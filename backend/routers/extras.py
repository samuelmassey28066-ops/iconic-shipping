"""Testimonials (public submit → admin approve), shared quotation PDF links, and the Vessel ETA board."""
import secrets
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from lib.auth import clean, clean_dict, log_activity, new_id, now_iso, optional_user, rate_limit, require_customer, require_perm
from lib.dates import today_iso
from lib.db import db
from lib.mailer import get_settings, send_email
from lib.pdfgen import quotation_pdf
from models.schemas import (CustomerVesselCall, MessageOut, ShareLink, Testimonial, TestimonialIn, TestimonialPatch,
                            VesselBoard, VesselCall, VesselCallIn)

router = APIRouter(tags=["extras"])


# ---------- Testimonials ----------
@router.get("/testimonials", response_model=List[Testimonial])
async def approved_testimonials():
    return await db.testimonials.find({"status": "approved"}, {"_id": 0, "customer_id": 0}).sort("created_at", -1).to_list(50)


@router.post("/testimonials", response_model=MessageOut, dependencies=[Depends(rate_limit("testimonial", 3))])
async def submit_testimonial(body: TestimonialIn, user: dict | None = Depends(optional_user)):
    if body.website:
        raise HTTPException(400, "Spam detected")
    d = clean_dict(body.model_dump(exclude={"website"}))
    await db.testimonials.insert_one({**d, "id": new_id(), "status": "pending", "created_at": now_iso(),
                                      "customer_id": user["id"] if user else None})
    s = await get_settings()
    await send_email(s["email"], "New testimonial awaiting approval",
                     f"{d['name']} ({d['company'] or 'no company'}) left a {d['rating']}-star review:\n\n{d['message']}\n\n"
                     "Approve or reject it in Admin → Testimonials.", "admin_testimonial")
    return {"message": "Thank you! Your feedback will appear once our team reviews it."}


@router.get("/admin/testimonials", response_model=List[Testimonial])
async def all_testimonials(_: dict = Depends(require_perm("website"))):
    return await db.testimonials.find({}, {"_id": 0, "customer_id": 0}).sort("created_at", -1).to_list(500)


@router.patch("/admin/testimonials/{tid}", response_model=Testimonial)
async def moderate(tid: str, body: TestimonialPatch, user: dict = Depends(require_perm("website"))):
    t = await db.testimonials.find_one({"id": tid}, {"_id": 0, "customer_id": 0})
    if not t:
        raise HTTPException(404, "Testimonial not found")
    await db.testimonials.update_one({"id": tid}, {"$set": {"status": body.status}})
    await log_activity(user, f"Testimonial {body.status}", t["name"])
    return {**t, "status": body.status}


@router.delete("/admin/testimonials/{tid}", response_model=MessageOut)
async def delete_testimonial(tid: str, user: dict = Depends(require_perm("website"))):
    r = await db.testimonials.delete_one({"id": tid})
    if not r.deleted_count:
        raise HTTPException(404, "Testimonial not found")
    await log_activity(user, "Deleted testimonial", tid)
    return {"message": "Deleted"}


# ---------- Quotation share links (capability URL, unguessable token) ----------
async def ensure_share_token(q: dict) -> str:
    if q.get("share_token"):
        return q["share_token"]
    tok = secrets.token_urlsafe(24)
    await db.quotations.update_one({"id": q["id"]}, {"$set": {"share_token": tok}})
    return tok


@router.post("/admin/quotations/{qid}/share-link", response_model=ShareLink)
async def share_link(qid: str, user: dict = Depends(require_perm("quotations"))):
    q = await db.quotations.find_one({"id": qid}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Quotation not found")
    if q["status"] == "draft":
        raise HTTPException(400, "Send the quotation before sharing it")
    phone = q.get("customer_phone") or ""
    if not phone:
        e = await db.enquiries.find_one({"id": q["enquiry_id"]}, {"_id": 0, "whatsapp": 1, "mobile": 1}) or {}
        phone = e.get("whatsapp") or e.get("mobile") or ""
    tok = await ensure_share_token(q)
    await log_activity(user, "Shared quotation via WhatsApp", q["quote_no"])
    return {"path": f"/api/quotations/shared/{tok}", "phone": phone, "quote_no": q["quote_no"], "total": q["total"],
            "customer_name": q["customer_name"]}


@router.get("/quotations/shared/{token}")
async def shared_pdf(token: str):
    if len(token) < 20:
        raise HTTPException(404, "Not found")
    q = await db.quotations.find_one({"share_token": token, "status": {"$ne": "draft"}}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Quotation link is invalid or expired")
    return Response(quotation_pdf(q, await get_settings()), media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{q["quote_no"]}.pdf"'})


# ---------- Vessel ETA board ----------
async def _link_enquiry(d: dict) -> dict:
    d["enquiry_no"], d["customer_id"] = "", None
    if d.get("enquiry_id"):
        e = await db.enquiries.find_one({"id": d["enquiry_id"]}, {"_id": 0, "enquiry_no": 1, "customer_id": 1})
        if not e:
            raise HTTPException(404, "Linked enquiry not found")
        d["enquiry_no"], d["customer_id"] = e["enquiry_no"], e.get("customer_id")
    return d


@router.get("/admin/vessel-calls", response_model=VesselBoard)
async def board(scope: str = Query(default="upcoming", pattern="^(upcoming|all)$"), _: dict = Depends(require_perm("enquiries"))):
    today = today_iso("Asia/Kolkata")
    f = {"$or": [{"eta": {"$gte": today}}, {"status": {"$in": ["arrived", "in_service"]}}]} if scope == "upcoming" else {}
    calls = await db.vessel_calls.find(f, {"_id": 0}).sort("eta", 1).to_list(1000)
    return {"today": today, "calls": calls}


@router.post("/admin/vessel-calls", response_model=VesselCall)
async def create_call(body: VesselCallIn, user: dict = Depends(require_perm("enquiries"))):
    d = await _link_enquiry(clean_dict(body.model_dump()))
    ts = now_iso()
    d.update({"id": new_id(), "created_at": ts, "updated_at": ts})
    await db.vessel_calls.insert_one(dict(d))
    await log_activity(user, "Scheduled vessel call", f"{d['vessel_name']} @ {d['port']} ETA {d['eta']}")
    return d


@router.put("/admin/vessel-calls/{cid}", response_model=VesselCall)
async def update_call(cid: str, body: VesselCallIn, user: dict = Depends(require_perm("enquiries"))):
    cur = await db.vessel_calls.find_one({"id": cid}, {"_id": 0})
    if not cur:
        raise HTTPException(404, "Vessel call not found")
    d = await _link_enquiry(clean_dict(body.model_dump()))
    d["updated_at"] = now_iso()
    await db.vessel_calls.update_one({"id": cid}, {"$set": d})
    if d.get("customer_id") and (d["eta"] != cur["eta"] or d["status"] != cur["status"]):
        await db.notifications.insert_one({"id": new_id(), "user_id": d["customer_id"], "read": False, "created_at": now_iso(),
                                           "title": f"{d['vessel_name']} schedule updated",
                                           "body": f"ETA {d['eta'].replace('T', ' ')} at {d['port']} · status {d['status'].replace('_', ' ')}"})
    await log_activity(user, "Updated vessel call", f"{d['vessel_name']} {d['status']}")
    return {**cur, **d}


@router.delete("/admin/vessel-calls/{cid}", response_model=MessageOut)
async def delete_call(cid: str, user: dict = Depends(require_perm("enquiries"))):
    r = await db.vessel_calls.delete_one({"id": cid})
    if not r.deleted_count:
        raise HTTPException(404, "Vessel call not found")
    await log_activity(user, "Deleted vessel call", cid)
    return {"message": "Deleted"}


@router.get("/my/vessel-calls", response_model=List[CustomerVesselCall])
async def my_calls(user: dict = Depends(require_customer)):
    return await db.vessel_calls.find({"customer_id": user["id"], "status": {"$ne": "cancelled"}},
                                      {"_id": 0, "notes": 0, "crew_assigned": 0}).sort("eta", 1).to_list(200)
