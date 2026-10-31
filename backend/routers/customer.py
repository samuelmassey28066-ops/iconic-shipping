"""Customer portal — every query is scoped to the signed-in customer's id."""
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from lib.auth import clean, new_id, now_iso, require_customer
from lib.db import db
from lib.mailer import get_settings, send_email
from lib.pdfgen import quotation_pdf
from models.schemas import (Enquiry, EnquiryCreated, EnquiryIn, FileRef, MessageOut, Notification, Quotation,
                            QuoteRespondIn, TextIn)
from routers.public import create_enquiry, save_upload

router = APIRouter(prefix="/my", tags=["customer"])
HIDE = {"_id": 0, "notes": 0}  # internal notes never leave the staff side


@router.get("/enquiries", response_model=List[Enquiry])
async def my_enquiries(user: dict = Depends(require_customer)):
    return await db.enquiries.find({"customer_id": user["id"]}, HIDE).sort("created_at", -1).to_list(500)


@router.post("/enquiries", response_model=EnquiryCreated)
async def my_submit(body: EnquiryIn, user: dict = Depends(require_customer)):
    e = await create_enquiry(body, user)
    return {"id": e["id"], "enquiry_no": e["enquiry_no"], "status": e["status"]}


async def _own_enquiry(eid: str, user: dict) -> dict:
    e = await db.enquiries.find_one({"id": eid, "customer_id": user["id"]}, HIDE)
    if not e:
        raise HTTPException(404, "Enquiry not found")
    return e


@router.post("/enquiries/{eid}/documents", response_model=FileRef)
async def upload_doc(eid: str, file: UploadFile = File(...), user: dict = Depends(require_customer)):
    await _own_enquiry(eid, user)
    ref = await save_upload(file, user["id"], "customer")
    await db.enquiries.update_one({"id": eid}, {"$push": {"attachments": ref}, "$set": {"updated_at": now_iso()}})
    return ref


@router.post("/enquiries/{eid}/messages", response_model=MessageOut)
async def message_support(eid: str, body: TextIn, user: dict = Depends(require_customer)):
    e = await _own_enquiry(eid, user)
    note = {"id": new_id(), "text": clean(body.text), "author": f"{user['name']} (customer)", "at": now_iso()}
    await db.enquiries.update_one({"id": eid}, {"$push": {"replies": note}, "$set": {"updated_at": now_iso()}})
    s = await get_settings()
    await send_email(s["email"], f"Customer message on {e['enquiry_no']}", f"{user['name']} wrote:\n\n{note['text']}", "admin_customer_message")
    return {"message": "Message sent to support"}


@router.get("/quotations", response_model=List[Quotation])
async def my_quotations(user: dict = Depends(require_customer)):
    return await db.quotations.find({"customer_id": user["id"], "status": {"$ne": "draft"}}, {"_id": 0}).sort("created_at", -1).to_list(500)


async def _own_quote(qid: str, user: dict) -> dict:
    q = await db.quotations.find_one({"id": qid, "customer_id": user["id"], "status": {"$ne": "draft"}}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Quotation not found")
    return q


@router.post("/quotations/{qid}/respond", response_model=Quotation)
async def respond(qid: str, body: QuoteRespondIn, user: dict = Depends(require_customer)):
    q = await _own_quote(qid, user)
    if q["status"] != "sent":
        raise HTTPException(400, "This quotation has already been responded to")
    upd = {"status": body.decision, "customer_comment": clean(body.comment), "responded_at": now_iso()}
    await db.quotations.update_one({"id": qid}, {"$set": upd})
    await db.enquiries.update_one({"id": q["enquiry_id"]}, {"$set": {
        "status": "approved" if body.decision == "accepted" else "rejected", "updated_at": now_iso()}})
    s = await get_settings()
    await send_email(s["email"], f"Quotation {q['quote_no']} {body.decision} by customer",
                     f"{user['name']} has {body.decision} quotation {q['quote_no']} (Enquiry {q['enquiry_no']}).\n"
                     f"Comment: {upd['customer_comment'] or '-'}", "admin_quote_response")
    return {**q, **upd}


@router.get("/quotations/{qid}/pdf")
async def quote_pdf(qid: str, user: dict = Depends(require_customer)):
    q = await _own_quote(qid, user)
    pdf = quotation_pdf(q, await get_settings())
    return Response(pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{q["quote_no"]}.pdf"'})


@router.get("/notifications", response_model=List[Notification])
async def notifications(user: dict = Depends(require_customer)):
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("created_at", -1).to_list(100)


@router.post("/notifications/read", response_model=MessageOut)
async def mark_read(user: dict = Depends(require_customer)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"message": "ok"}
