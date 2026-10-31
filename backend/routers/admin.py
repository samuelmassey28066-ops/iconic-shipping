"""Admin / staff console. Each route is gated by a permission; admins hold every permission."""
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response
from openpyxl import Workbook

from lib.auth import (ALL_PERMS, clean, hash_pw, log_activity, new_id, now_iso, public_user, require_admin,
                      require_perm, require_staff)
from lib.db import db
from lib.mailer import get_settings, https_origin, send_email, signature
from lib.pdfgen import quotation_pdf, table_pdf
from models.schemas import (Activity, ContactMessage, Enquiry, EnquiryPatch, FileRef, LabelCount, MessageOut,
                            MonthCount, OutboxItem, Quotation, QuotationIn, ServiceOverride, ServiceOverrideIn,
                            SiteSettings, StaffIn, Stats, TextIn, UserPatch, UserPublic)
from routers.public import notify_customer, save_upload, service_label

router = APIRouter(prefix="/admin", tags=["admin"])
STATUSES = ["new", "in_review", "quoted", "approved", "in_progress", "completed", "rejected", "closed"]
STATUS_LABEL = {s: s.replace("_", " ").title() for s in STATUSES}


# ---------- dashboard ----------
@router.get("/stats", response_model=Stats)
async def stats(_: dict = Depends(require_staff)):
    enqs = await db.enquiries.find({}, {"_id": 0, "status": 1, "created_at": 1, "service_category": 1, "archived": 1}).to_list(20000)
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        y, m = now.year, now.month - i
        while m <= 0:
            m += 12
            y -= 1
        months.append(f"{y}-{m:02d}")
    days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    by_svc: dict[str, int] = {}
    by_st: dict[str, int] = {}
    for e in enqs:
        by_svc[service_label(e["service_category"])] = by_svc.get(service_label(e["service_category"]), 0) + 1
        by_st[e["status"]] = by_st.get(e["status"], 0) + 1
    return {
        "total_enquiries": len(enqs),
        "new_enquiries": by_st.get("new", 0),
        "pending_enquiries": sum(by_st.get(s, 0) for s in ("new", "in_review", "quoted", "in_progress")),
        "active_customers": await db.users.count_documents({"role": "customer", "active": True}),
        "total_quotations": await db.quotations.count_documents({}),
        "approved_quotations": await db.quotations.count_documents({"status": "accepted"}),
        "completed_services": by_st.get("completed", 0),
        "monthly": [{"month": mo, "count": sum(1 for e in enqs if e["created_at"].startswith(mo))} for mo in months],
        "daily": [{"month": d, "count": sum(1 for e in enqs if e["created_at"].startswith(d))} for d in days],
        "by_service": [{"label": k, "count": v} for k, v in sorted(by_svc.items(), key=lambda x: -x[1])],
        "by_status": [{"label": STATUS_LABEL.get(k, k), "count": v} for k, v in by_st.items()],
    }


# ---------- enquiries ----------
@router.get("/enquiries", response_model=List[Enquiry])
async def list_enquiries(q: str = "", status: str = "", service: str = "", archived: bool = False,
                         _: dict = Depends(require_perm("enquiries"))):
    f: dict = {"archived": archived}
    if status:
        f["status"] = status
    if service:
        f["service_category"] = service
    if q:
        import re
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        f["$or"] = [{"enquiry_no": rx}, {"name": rx}, {"company": rx}, {"email": rx}, {"vessel_name": rx}, {"current_port": rx}]
    return await db.enquiries.find(f, {"_id": 0}).sort("created_at", -1).to_list(1000)


async def _enq(eid: str) -> dict:
    e = await db.enquiries.find_one({"id": eid}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Enquiry not found")
    return e


@router.patch("/enquiries/{eid}", response_model=Enquiry)
async def patch_enquiry(eid: str, body: EnquiryPatch, request: Request, user: dict = Depends(require_perm("enquiries"))):
    e = await _enq(eid)
    upd: dict = {"updated_at": now_iso()}
    if body.status is not None:
        if body.status not in STATUSES:
            raise HTTPException(422, "Invalid status")
        upd["status"] = body.status
    if body.assigned_to is not None:
        if body.assigned_to == "":
            upd["assigned_to"], upd["assigned_name"] = None, ""
        else:
            st = await db.users.find_one({"id": body.assigned_to, "role": {"$in": ["admin", "staff"]}})
            if not st:
                raise HTTPException(404, "Staff member not found")
            upd["assigned_to"], upd["assigned_name"] = st["id"], st["name"]
    if body.archived is not None:
        upd["archived"] = body.archived
    await db.enquiries.update_one({"id": eid}, {"$set": upd})
    if "status" in upd and upd["status"] != e["status"]:
        s = await get_settings()
        lbl = STATUS_LABEL[upd["status"]]
        await send_email(e["email"], f"Enquiry {e['enquiry_no']} status: {lbl} | {s['company_name']}",
                         f"Dear {e['name']},\n\nThe status of your enquiry {e['enquiry_no']} "
                         f"({service_label(e['service_category'])}) is now: {lbl}." + signature(s), "status_update",
                         link=f"{origin}/track?id={e['enquiry_no']}&email={e['email']}" if (origin := https_origin(request.headers.get("origin"))) else "",
                         link_label="Track enquiry")
        await notify_customer(e.get("customer_id"), f"Enquiry {e['enquiry_no']} updated", f"Status changed to {lbl}.")
    await log_activity(user, "Updated enquiry", f"{e['enquiry_no']} {', '.join(k for k in upd if k != 'updated_at')}")
    return {**e, **upd}


@router.post("/enquiries/{eid}/notes", response_model=Enquiry)
async def add_note(eid: str, body: TextIn, user: dict = Depends(require_perm("enquiries"))):
    e = await _enq(eid)
    n = {"id": new_id(), "text": clean(body.text), "author": user["name"], "at": now_iso()}
    await db.enquiries.update_one({"id": eid}, {"$push": {"notes": n}, "$set": {"updated_at": now_iso()}})
    await log_activity(user, "Added internal note", e["enquiry_no"])
    return {**e, "notes": e["notes"] + [n]}


@router.post("/enquiries/{eid}/reply", response_model=Enquiry)
async def reply(eid: str, body: TextIn, user: dict = Depends(require_perm("enquiries"))):
    e = await _enq(eid)
    n = {"id": new_id(), "text": clean(body.text), "author": user["name"], "at": now_iso()}
    await db.enquiries.update_one({"id": eid}, {"$push": {"replies": n}, "$set": {"updated_at": now_iso()}})
    s = await get_settings()
    await send_email(e["email"], f"Re: Enquiry {e['enquiry_no']} | {s['company_name']}",
                     f"Dear {e['name']},\n\n{n['text']}" + signature(s), "reply")
    await notify_customer(e.get("customer_id"), f"New reply on {e['enquiry_no']}", n["text"][:160])
    await log_activity(user, "Replied to customer", e["enquiry_no"])
    return {**e, "replies": e["replies"] + [n]}


# ---------- quotations ----------
def _totals(items: list, gst: float, discount: float) -> tuple[float, float, float]:
    sub = round(sum(i["qty"] * i["unit_price"] for i in items), 2)
    discount = min(discount, sub)
    gst_amt = round((sub - discount) * gst / 100, 2)
    return sub, gst_amt, round(sub - discount + gst_amt, 2)


@router.get("/quotations", response_model=List[Quotation])
async def list_quotes(enquiry_id: Optional[str] = None, _: dict = Depends(require_perm("quotations"))):
    f = {"enquiry_id": enquiry_id} if enquiry_id else {}
    return await db.quotations.find(f, {"_id": 0}).sort("created_at", -1).to_list(1000)


@router.post("/quotations", response_model=Quotation)
async def create_quote(body: QuotationIn, user: dict = Depends(require_perm("quotations"))):
    e = await _enq(body.enquiry_id)
    items = [{**i.model_dump(), "description": clean(i.description)} for i in body.items]
    sub, gst_amt, total = _totals(items, body.gst_percent, body.discount)
    count = await db.quotations.count_documents({}) + 1
    q = {"id": new_id(), "quote_no": f"QT-{datetime.now(timezone.utc):%y%m}-{count:04d}", "enquiry_id": e["id"],
         "enquiry_no": e["enquiry_no"], "customer_id": e.get("customer_id"), "customer_name": e["name"],
         "customer_email": e["email"], "customer_phone": e.get("whatsapp") or e.get("mobile", ""), "company": e.get("company", ""), "service": service_label(e["service_category"]),
         "vessel_name": e.get("vessel_name", ""), "items": items, "gst_percent": body.gst_percent,
         "discount": min(body.discount, sub), "payment_terms": clean(body.payment_terms), "validity": clean(body.validity),
         "notes": clean(body.notes), "currency": body.currency, "subtotal": sub, "gst_amount": gst_amt, "total": total,
         "status": "draft", "customer_comment": "", "created_at": now_iso(), "sent_at": "", "responded_at": ""}
    await db.quotations.insert_one(dict(q))
    await log_activity(user, "Created quotation", f"{q['quote_no']} for {e['enquiry_no']}")
    return q


async def _quote(qid: str) -> dict:
    q = await db.quotations.find_one({"id": qid}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Quotation not found")
    return q


@router.post("/quotations/{qid}/send", response_model=Quotation)
async def send_quote(qid: str, request: Request, user: dict = Depends(require_perm("quotations"))):
    from routers.extras import ensure_share_token
    q = await _quote(qid)
    tok = await ensure_share_token(q)
    origin = https_origin(request.headers.get("origin"))
    upd = {"status": "sent", "sent_at": now_iso()}
    await db.quotations.update_one({"id": qid}, {"$set": upd})
    await db.enquiries.update_one({"id": q["enquiry_id"]}, {"$set": {"status": "quoted", "updated_at": now_iso()}})
    s = await get_settings()
    await send_email(q["customer_email"], f"Quotation {q['quote_no']} for {q['service']} | {s['company_name']}",
                     f"Dear {q['customer_name']},\n\nPlease find our quotation {q['quote_no']} for enquiry {q['enquiry_no']}.\n"
                     f"Total: {q['currency']} {q['total']:,.2f} (incl. GST {q['gst_percent']:g}%)\nValidity: {q['validity']}\n"
                     f"Payment Terms: {q['payment_terms']}\n\nUse the button below to view or download the quotation PDF. "
                     f"Customers with a portal account can also accept or reject it online." + signature(s), "quotation",
                     link=f"{origin}/api/quotations/shared/{tok}" if origin else "", link_label="View quotation PDF")
    await notify_customer(q.get("customer_id"), f"New quotation {q['quote_no']}",
                          f"Total {q['currency']} {q['total']:,.2f}. Review and accept or reject in your portal.")
    await log_activity(user, "Sent quotation", q["quote_no"])
    return {**q, **upd}


@router.get("/quotations/{qid}/pdf")
async def admin_quote_pdf(qid: str, _: dict = Depends(require_perm("quotations"))):
    q = await _quote(qid)
    return Response(quotation_pdf(q, await get_settings()), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{q["quote_no"]}.pdf"'})


@router.delete("/quotations/{qid}", response_model=MessageOut)
async def delete_quote(qid: str, user: dict = Depends(require_perm("quotations"))):
    q = await _quote(qid)
    if q["status"] != "draft":
        raise HTTPException(400, "Only draft quotations can be deleted")
    await db.quotations.delete_one({"id": qid})
    await log_activity(user, "Deleted draft quotation", q["quote_no"])
    return {"message": "Deleted"}


# ---------- customers & staff ----------
@router.get("/customers", response_model=List[UserPublic])
async def customers(_: dict = Depends(require_perm("customers"))):
    return await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)


@router.get("/customers/{uid}/enquiries", response_model=List[Enquiry])
async def customer_history(uid: str, _: dict = Depends(require_perm("customers"))):
    return await db.enquiries.find({"customer_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.patch("/users/{uid}", response_model=UserPublic)
async def patch_user(uid: str, body: UserPatch, user: dict = Depends(require_perm("customers"))):
    target = await db.users.find_one({"id": uid}, {"_id": 0})
    if not target:
        raise HTTPException(404, "User not found")
    upd = {k: (clean(v) if isinstance(v, str) else v) for k, v in body.model_dump(exclude_none=True).items()}
    if ("role" in upd or "permissions" in upd or target["role"] != "customer") and user["role"] != "admin":
        raise HTTPException(403, "Only admins can manage staff accounts and roles")
    if uid == user["id"] and (upd.get("active") is False or upd.get("role", "admin") != "admin"):
        raise HTTPException(400, "You cannot disable or demote your own account")
    if "permissions" in upd:
        upd["permissions"] = [p for p in upd["permissions"] if p in ALL_PERMS]
    await db.users.update_one({"id": uid}, {"$set": upd})
    if upd.get("active") is False:
        await db.sessions.delete_many({"user_id": uid})
    await log_activity(user, "Updated account", target["email"])
    return public_user({**target, **upd})


@router.get("/staff", response_model=List[UserPublic])
async def staff(_: dict = Depends(require_staff)):
    return await db.users.find({"role": {"$in": ["admin", "staff"]}}, {"_id": 0, "password_hash": 0}).to_list(500)


@router.post("/staff", response_model=UserPublic)
async def create_staff(body: StaffIn, user: dict = Depends(require_admin)):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already in use")
    u = {"id": new_id(), "email": email, "name": clean(body.name), "role": body.role, "company": "", "phone": "",
         "whatsapp": "", "country": "", "address": "", "gst_number": "", "active": True,
         "permissions": [p for p in body.permissions if p in ALL_PERMS], "created_at": now_iso(),
         "password_hash": hash_pw(body.password)}
    await db.users.insert_one(u)
    await log_activity(user, "Created staff account", email)
    return public_user(u)


@router.get("/activity", response_model=List[Activity])
async def activity(_: dict = Depends(require_admin)):
    return await db.activity.find({}, {"_id": 0}).sort("at", -1).to_list(300)


@router.get("/outbox", response_model=List[OutboxItem])
async def outbox(_: dict = Depends(require_staff)):
    return await db.outbox.find({}, {"_id": 0}).sort("created_at", -1).to_list(300)


@router.get("/messages", response_model=List[ContactMessage])
async def messages(_: dict = Depends(require_perm("enquiries"))):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


# ---------- website management ----------
@router.put("/settings", response_model=SiteSettings)
async def put_settings(body: SiteSettings, user: dict = Depends(require_perm("website"))):
    data = {k: clean(v) for k, v in body.model_dump().items()}
    await db.settings.update_one({"id": "site"}, {"$set": data}, upsert=True)
    await log_activity(user, "Updated website settings")
    return data


@router.put("/services/{slug}", response_model=ServiceOverride)
async def put_service(slug: str, body: ServiceOverrideIn, user: dict = Depends(require_perm("website"))):
    data = {"slug": clean(slug)[:60], **{k: clean(v) if isinstance(v, str) else v for k, v in body.model_dump().items()}}
    await db.service_overrides.update_one({"slug": data["slug"]}, {"$set": data}, upsert=True)
    await log_activity(user, "Updated service", slug)
    return data


@router.post("/images", response_model=FileRef)
async def upload_image(file: UploadFile = File(...), user: dict = Depends(require_perm("website"))):
    ref = await save_upload(file, user["id"], "staff", public=True, allowed=("image/png", "image/jpeg", "image/webp"))
    await log_activity(user, "Uploaded image", ref["filename"])
    return ref


# ---------- reports ----------
def _period_start(period: str) -> str:
    now = datetime.now(timezone.utc)
    if period == "daily":
        return now.strftime("%Y-%m-%d")
    if period == "monthly":
        return now.strftime("%Y-%m")
    return ""


@router.get("/reports/export")
async def export(kind: str = Query(pattern="^(enquiries|quotations|customers|services)$"),
                 fmt: str = Query(default="xlsx", pattern="^(xlsx|pdf)$"),
                 period: str = Query(default="all", pattern="^(all|daily|monthly)$"),
                 user: dict = Depends(require_perm("reports"))):
    start = _period_start(period)
    f = {"created_at": {"$regex": f"^{start}"}} if start else {}
    if kind == "enquiries":
        headers = ["Enquiry ID", "Date", "Name", "Company", "Email", "Mobile", "Service", "Vessel", "Port", "Status", "Assigned"]
        docs = await db.enquiries.find(f, {"_id": 0}).sort("created_at", -1).to_list(10000)
        rows = [[d["enquiry_no"], d["created_at"][:10], d["name"], d["company"], d["email"], d["mobile"],
                 service_label(d["service_category"]), d["vessel_name"], d["current_port"], d["status"], d["assigned_name"]] for d in docs]
    elif kind == "quotations":
        headers = ["Quote No", "Date", "Enquiry", "Customer", "Service", "Subtotal", "GST", "Total", "Status"]
        docs = await db.quotations.find(f, {"_id": 0}).sort("created_at", -1).to_list(10000)
        rows = [[d["quote_no"], d["created_at"][:10], d["enquiry_no"], d["customer_name"], d["service"], d["subtotal"],
                 d["gst_amount"], d["total"], d["status"]] for d in docs]
    elif kind == "customers":
        headers = ["Name", "Email", "Company", "Phone", "Country", "Joined", "Active", "Enquiries"]
        docs = await db.users.find({**f, "role": "customer"}, {"_id": 0}).to_list(10000)
        rows = [[d["name"], d["email"], d["company"], d["phone"], d["country"], d["created_at"][:10], d["active"],
                 await db.enquiries.count_documents({"customer_id": d["id"]})] for d in docs]
    else:
        headers = ["Service", "Enquiries", "Completed", "Quoted / Approved"]
        docs = await db.enquiries.find(f, {"_id": 0, "service_category": 1, "status": 1}).to_list(20000)
        agg: dict[str, list[int]] = {}
        for d in docs:
            a = agg.setdefault(service_label(d["service_category"]), [0, 0, 0])
            a[0] += 1
            a[1] += d["status"] == "completed"
            a[2] += d["status"] in ("quoted", "approved")
        rows = [[k, *v] for k, v in agg.items()]
    await log_activity(user, "Exported report", f"{kind} {period} {fmt}")
    name = f"{kind}-{period}-report"
    if fmt == "pdf":
        s = await get_settings()
        return Response(table_pdf(f"{kind.title()} report ({period})", headers, rows, s["company_name"]),
                        media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'})
    wb = Workbook()
    ws = wb.active
    ws.title = kind.title()
    ws.append(headers)
    for r in rows:
        ws.append(r)
    buf = BytesIO()
    wb.save(buf)
    return Response(buf.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{name}.xlsx"'})
