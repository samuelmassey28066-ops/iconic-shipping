"""Public site API: settings, service overrides, enquiries, tracking, contact, file upload/download."""
import secrets
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse

from lib.auth import clean, clean_dict, new_id, now_iso, optional_user, rate_limit
from lib.db import db
from lib.mailer import get_settings, https_origin, send_email, signature
from models.schemas import (ContactIn, EnquiryCreated, EnquiryIn, FileRef, MessageOut, ServiceOverride, SiteSettings,
                            TrackOut)

router = APIRouter(tags=["public"])
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_BYTES = 5 * 1024 * 1024
MAGIC = {"application/pdf": b"%PDF", "image/png": b"\x89PNG", "image/jpeg": b"\xff\xd8\xff", "image/webp": b"RIFF"}

SERVICE_LABELS = {
    "port-clearance": "Port Clearance & Marine Logistics Services",
    "hold-cleaning": "Hold Cleaning & Tank Squeezing",
    "marine-machinery": "Marine Machinery & Equipment",
    "electrical-electronic": "Electrical & Electronic Equipment",
    "ship-chandling": "Ship Chandling & Supplies",
    "marine-consumables": "Marine Consumables & Fluids",
    "lsa-ffa": "LSA/FFA Inspection & Certification",
    "marine-repair": "Marine Repair & Maintenance",
    "hold-tank-cleaning": "Hold Cleaning & Tank Cleaning",
}


def service_label(slug: str) -> str:
    return SERVICE_LABELS.get(slug, slug)


async def save_upload(f: UploadFile, owner_id: str | None, uploaded_by: str, public: bool = False,
                      allowed: tuple = ("application/pdf", "image/png", "image/jpeg")) -> dict:
    data = await f.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File too large (max 5 MB)")
    ctype = next((t for t in allowed if data.startswith(MAGIC[t])), None)
    if not ctype:
        raise HTTPException(415, "Only PDF, JPG or PNG files are allowed")
    fid = new_id()
    name = "".join(c for c in (f.filename or "file") if c.isalnum() or c in "._- ")[:120] or "file"
    (UPLOAD_DIR / fid).write_bytes(data)
    doc = {"id": fid, "filename": name, "content_type": ctype, "size": len(data), "owner_id": owner_id,
           "uploaded_by": uploaded_by, "public": public, "created_at": now_iso()}
    await db.files.insert_one(doc)
    return {k: doc[k] for k in ("id", "filename", "content_type", "size", "uploaded_by")}


@router.get("/settings", response_model=SiteSettings)
async def settings():
    return await get_settings()


@router.get("/services/overrides", response_model=List[ServiceOverride])
async def service_overrides():
    return await db.service_overrides.find({}, {"_id": 0}).to_list(100)


@router.post("/uploads", response_model=FileRef, dependencies=[Depends(rate_limit("upload", 15))])
async def upload(file: UploadFile = File(...), user: dict | None = Depends(optional_user)):
    if user:
        return await save_upload(file, user["id"], "staff" if user["role"] != "customer" else "customer")
    return await save_upload(file, None, "guest")


@router.get("/files/{fid}")
async def get_file(fid: str, user: dict | None = Depends(optional_user)):
    f = await db.files.find_one({"id": fid}, {"_id": 0})
    if not f:
        raise HTTPException(404, "File not found")
    if not f.get("public"):
        if not user:
            raise HTTPException(401, "Please sign in")
        if user["role"] == "customer":
            ok = f.get("owner_id") == user["id"] or await db.enquiries.find_one(
                {"customer_id": user["id"], "attachments.id": fid})
            if not ok:
                raise HTTPException(403, "Not allowed")
    return FileResponse(UPLOAD_DIR / fid, media_type=f["content_type"], filename=f["filename"])


def make_enquiry_no() -> str:
    from datetime import datetime, timezone
    return f"ISS-{datetime.now(timezone.utc):%y%m%d}-{secrets.token_hex(2).upper()}"


async def notify_customer(customer_id: str | None, title: str, body: str) -> None:
    if customer_id:
        await db.notifications.insert_one({"id": new_id(), "user_id": customer_id, "title": title, "body": body,
                                           "read": False, "created_at": now_iso()})


async def create_enquiry(body: EnquiryIn, user: dict | None, origin: str = "") -> dict:
    if body.website:
        raise HTTPException(400, "Spam detected")
    data = clean_dict(body.model_dump(exclude={"website", "attachment_ids"}))
    q = {"id": {"$in": body.attachment_ids}}
    q["owner_id"] = user["id"] if user else None
    files = await db.files.find(q, {"_id": 0}).to_list(10)
    attachments = [{k: f[k] for k in ("id", "filename", "content_type", "size", "uploaded_by")} for f in files]
    ts = now_iso()
    enq = {**data, "id": new_id(), "enquiry_no": make_enquiry_no(), "email": data["email"].lower(),
           "customer_id": user["id"] if user and user["role"] == "customer" else None, "attachments": attachments,
           "status": "new", "assigned_to": None, "assigned_name": "", "notes": [], "replies": [], "archived": False,
           "created_at": ts, "updated_at": ts}
    await db.enquiries.insert_one(dict(enq))
    s = await get_settings()
    label = service_label(enq["service_category"])
    await send_email(s["email"], f"New Enquiry {enq['enquiry_no']} – {label}",
                     f"New enquiry received.\n\nEnquiry ID: {enq['enquiry_no']}\nService: {label}\n"
                     f"Service Required: {enq['service_required']}\nName: {enq['name']}\nCompany: {enq['company']}\n"
                     f"Email: {enq['email']}\nMobile: {enq['mobile']}\nWhatsApp: {enq['whatsapp']}\n"
                     f"Vessel: {enq['vessel_name']} ({enq['vessel_type']}) IMO {enq['imo_number']}\n"
                     f"Current Port: {enq['current_port']}  Next Port: {enq['next_port']}\n"
                     f"Expected Date: {enq['expected_date']}\n\nRequirement:\n{enq['requirement']}\n\n"
                     f"Cargo / Cleaning Details: {enq['cargo_details']}\nInstructions: {enq['instructions']}\n"
                     f"Attachments: {len(attachments)}", "admin_new_enquiry")
    await send_email(enq["email"], f"We received your enquiry {enq['enquiry_no']} | {s['company_name']}",
                     f"Dear {enq['name']},\n\nThank you for contacting {s['company_name']}. We have received your enquiry "
                     f"for {label}.\n\nYour Enquiry ID: {enq['enquiry_no']}\nYou can track it any time on our website using "
                     f"this ID and your email address.\n\nOur team will review your requirement and respond shortly." + signature(s),
                     "customer_ack", link=f"{origin}/track?id={enq['enquiry_no']}&email={enq['email']}" if origin else "",
                     link_label="Track your enquiry")
    await notify_customer(enq["customer_id"], f"Enquiry {enq['enquiry_no']} submitted",
                          f"We received your {label} enquiry.")
    return enq


@router.post("/enquiries", response_model=EnquiryCreated, dependencies=[Depends(rate_limit("enquiry", 6))])
async def submit_enquiry(body: EnquiryIn, request: Request, user: dict | None = Depends(optional_user)):
    enq = await create_enquiry(body, user, https_origin(request.headers.get("origin")))
    return {"id": enq["id"], "enquiry_no": enq["enquiry_no"], "status": enq["status"]}


@router.get("/enquiries/track", response_model=TrackOut, dependencies=[Depends(rate_limit("track", 20))])
async def track(enquiry_no: str = Query(min_length=5, max_length=30), email: str = Query(min_length=3, max_length=200)):
    e = await db.enquiries.find_one({"enquiry_no": enquiry_no.strip().upper(), "email": email.strip().lower()}, {"_id": 0})
    if not e:
        raise HTTPException(404, "No enquiry found for this ID and email")
    q = await db.quotations.find_one({"enquiry_id": e["id"], "status": {"$ne": "draft"}}, {"_id": 0}, sort=[("created_at", -1)])
    return {**e, "quotation_status": q["status"] if q else None, "quotation_total": q["total"] if q else None}


@router.post("/contact", response_model=MessageOut, dependencies=[Depends(rate_limit("contact", 5))])
async def contact(body: ContactIn):
    if body.website:
        raise HTTPException(400, "Spam detected")
    d = clean_dict(body.model_dump(exclude={"website"}))
    await db.contact_messages.insert_one({**d, "id": new_id(), "created_at": now_iso()})
    s = await get_settings()
    await send_email(s["email"], f"Website contact: {d['subject'] or 'General enquiry'}",
                     f"From: {d['name']} <{d['email']}> {d['phone']}\n\n{d['message']}", "admin_contact")
    await send_email(d["email"], f"Thank you for contacting {s['company_name']}",
                     f"Dear {d['name']},\n\nThank you for your message. Our team will get back to you shortly." + signature(s),
                     "customer_ack")
    return {"message": "Message received"}
