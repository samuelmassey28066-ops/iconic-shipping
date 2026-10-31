from fastapi import APIRouter, Depends, HTTPException, Request, Response

from typing import Optional

from lib.auth import (clean, create_session, current_user, destroy_session, hash_pw, new_id, now_iso,
                      optional_user, public_user, rate_limit, verify_pw)
from lib.db import db
from lib.mailer import get_settings, https_origin, send_email, signature
from models.schemas import ForgotIn, LoginIn, MessageOut, ProfileIn, RegisterIn, ResetIn, UserPublic
from datetime import datetime, timedelta, timezone
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, dependencies=[Depends(rate_limit("register", 5))])
async def register(body: RegisterIn, request: Request, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "An account with this email already exists")
    u = {"id": new_id(), "email": email, "name": clean(body.name), "role": "customer", "company": clean(body.company),
         "phone": clean(body.phone), "whatsapp": clean(body.phone), "country": clean(body.country), "address": "",
         "gst_number": "", "active": True, "permissions": [], "created_at": now_iso(), "password_hash": hash_pw(body.password)}
    await db.users.insert_one(u)
    await create_session(response, request, u["id"])
    s = await get_settings()
    await send_email(email, f"Welcome to {s['company_name']} Customer Portal",
                     f"Dear {u['name']},\n\nYour customer account has been created. You can now submit enquiries, "
                     f"track status and receive quotations online." + signature(s), "welcome")
    return public_user(u)


@router.post("/login", response_model=UserPublic, dependencies=[Depends(rate_limit("login", 10))])
async def login(body: LoginIn, request: Request, response: Response):
    u = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not u or not verify_pw(body.password, u["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    if not u.get("active", True):
        raise HTTPException(403, "This account is disabled")
    await create_session(response, request, u["id"])
    return public_user(u)


@router.post("/logout", response_model=MessageOut)
async def logout(request: Request, response: Response):
    await destroy_session(request, response)
    return {"message": "Signed out"}


@router.get("/me", response_model=Optional[UserPublic])
async def me(user: dict | None = Depends(optional_user)):
    """Guests get null (200) so public pages don't log a 401 on every visit."""
    return public_user(user) if user else None


@router.put("/profile", response_model=UserPublic)
async def update_profile(body: ProfileIn, user: dict = Depends(current_user)):
    data = {k: clean(v) for k, v in body.model_dump().items()}
    await db.users.update_one({"id": user["id"]}, {"$set": data})
    return public_user({**user, **data})


@router.post("/forgot-password", response_model=MessageOut, dependencies=[Depends(rate_limit("forgot", 5))])
async def forgot(body: ForgotIn, request: Request):
    u = await db.users.find_one({"email": body.email.lower()})
    if u:
        token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({"token": token, "user_id": u["id"],
                                             "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)})
        origin = https_origin(request.headers.get("origin"))
        s = await get_settings()
        await send_email(u["email"], f"Reset your password | {s['company_name']}",
                         f"Dear {u['name']},\n\nWe received a request to reset your customer portal password. "
                         f"Use the button below to choose a new password (the link is valid for 1 hour).\n\n"
                         f"If you did not request this, please ignore this email." + signature(s),
                         "password_reset", link=f"{origin}/reset-password?token={token}" if origin else "",
                         link_label="Reset password")
    return {"message": "If an account exists for this email, a reset link has been issued."}


@router.post("/reset-password", response_model=MessageOut)
async def reset(body: ResetIn):
    r = await db.password_resets.find_one({"token": body.token})
    if not r:
        raise HTTPException(400, "Invalid or expired reset link")
    exp = r["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired reset link")
    await db.users.update_one({"id": r["user_id"]}, {"$set": {"password_hash": hash_pw(body.password)}})
    await db.password_resets.delete_many({"user_id": r["user_id"]})
    await db.sessions.delete_many({"user_id": r["user_id"]})
    return {"message": "Password updated. Please sign in."}
