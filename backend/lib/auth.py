"""Password hashing, cookie sessions, role/permission guards, rate limiting, sanitising."""
import re
import secrets
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
COOKIE = "iss_session"
SESSION_DAYS = 7
ALL_PERMS = ["enquiries", "quotations", "customers", "website", "reports", "staff"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def hash_pw(p: str) -> str:
    return pwd.hash(p)


def verify_pw(p: str, h: str) -> bool:
    try:
        return pwd.verify(p, h)
    except Exception:
        return False


_TAG = re.compile(r"<[^>]*>")


def clean(s: str) -> str:
    """Strip HTML tags + control chars from free text."""
    if not isinstance(s, str):
        return s
    s = _TAG.sub("", s)
    return "".join(ch for ch in s if ch in "\n\t" or ord(ch) >= 32).strip()


def clean_dict(d: dict) -> dict:
    return {k: clean(v) if isinstance(v, str) else v for k, v in d.items()}


# ---------- rate limiting (in-memory, per IP + bucket) ----------
_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(bucket: str, limit: int, window: int = 60):
    async def dep(request: Request):
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
        key = f"{bucket}:{ip}"
        q = _hits[key]
        t = time.time()
        while q and q[0] < t - window:
            q.popleft()
        if len(q) >= limit:
            raise HTTPException(429, "Too many requests. Please wait a minute and try again.")
        q.append(t)

    return dep


# ---------- sessions ----------
async def create_session(response: Response, request: Request, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await db.sessions.insert_one({"token": token, "user_id": user_id, "expires_at": expires})
    secure = request.headers.get("x-forwarded-proto", request.url.scheme) == "https"
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", secure=secure,
                        max_age=SESSION_DAYS * 86400, path="/")


async def destroy_session(request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE)
    if token:
        await db.sessions.delete_one({"token": token})
    response.delete_cookie(COOKIE, path="/")


def public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in ("_id", "password_hash")}


async def optional_user(request: Request) -> dict | None:
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    s = await db.sessions.find_one({"token": token})
    if not s:
        return None
    exp = s["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        await db.sessions.delete_one({"token": token})
        return None
    u = await db.users.find_one({"id": s["user_id"]}, {"_id": 0})
    if not u or not u.get("active", True):
        return None
    return u


async def current_user(user: dict | None = Depends(optional_user)) -> dict:
    if not user:
        raise HTTPException(401, "Please sign in")
    return user


async def require_customer(user: dict = Depends(current_user)) -> dict:
    if user["role"] != "customer":
        raise HTTPException(403, "Customer account required")
    return user


async def require_staff(user: dict = Depends(current_user)) -> dict:
    if user["role"] not in ("admin", "staff"):
        raise HTTPException(403, "Staff access only")
    return user


def require_perm(perm: str):
    async def dep(user: dict = Depends(require_staff)) -> dict:
        if user["role"] != "admin" and perm not in user.get("permissions", []):
            raise HTTPException(403, f"Missing permission: {perm}")
        return user

    return dep


async def require_admin(user: dict = Depends(require_staff)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user


async def log_activity(user: dict, action: str, target: str = "") -> None:
    await db.activity.insert_one({"id": new_id(), "user_id": user["id"], "user_name": user["name"],
                                  "action": action, "target": target, "at": now_iso()})
