"""Transactional email via Emergent managed email (Resend). Every send is also recorded in the `outbox`
collection with its real delivery status (Admin → Email Outbox). Bodies come from server-side templates only."""
import ipaddress
import logging
import os
import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv

from lib.auth import new_id, now_iso
from lib.db import db

load_dotenv()
logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"  # constant — survives deployment
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "ICONIC SHIPPING SERVICES")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")


async def get_settings() -> dict:
    from models.schemas import SiteSettings
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0, "id": 0}) or {}
    return SiteSettings(**doc).model_dump()


def signature(s: dict) -> str:
    return (f"\n\nBest Regards,\n{s['owner']}\n{s['company_name']}\n{s['location']}\n"
            f"Phone / WhatsApp: {s['phone']}\nEmail: {s['email']}")


def https_origin(origin: str | None) -> str:
    """Only first-party https origins may appear as links in email."""
    return origin.rstrip("/") if origin and origin.startswith("https://") else ""


# ---------------- guardrail gate (G2 + G3) ----------------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


def _render(subject: str, body: str, link: str, link_label: str) -> str:
    text = escape(body).replace("\n", "<br>")
    btn = (f'<p style="margin:24px 0"><a href="{escape(link, quote=True)}" style="background:#0284C7;color:#ffffff;'
           f'padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">{escape(link_label)}</a></p>'
           if link else "")
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F7FF;padding:24px 0">'
            f'<tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" '
            f'style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,sans-serif">'
            f'<tr><td style="background:#0B1D3A;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">'
            f'{escape(EMAIL_FROM_NAME)}<div style="font-size:12px;color:#7DD3FC;font-weight:normal">Port Clearance &amp; Marine Logistics · Gandhidham</div></td></tr>'
            f'<tr><td style="padding:28px;color:#0B1D3A;font-size:14px;line-height:1.6">{text}{btn}</td></tr>'
            f'<tr><td style="padding:16px 28px;background:#F0F7FF;color:#64748B;font-size:11px">Sent by {escape(EMAIL_FROM_NAME)}. '
            f'We never ask for your password or card details by email.</td></tr></table></td></tr></table>')


async def send_email(to: str, subject: str, body: str, kind: str, link: str = "", link_label: str = "Open") -> None:
    """Never raises: delivery failures are logged and recorded in the outbox so business flows keep working."""
    rec = {"id": new_id(), "to": to, "subject": subject, "body": body + (f"\n\n{link_label}: {link}" if link else ""),
           "kind": kind, "status": "pending", "created_at": now_iso()}
    try:
        html = _render(subject, body, link, link_label)
        _assert_safe_email(subject, html)
        if not EMAIL_KEY:
            raise RuntimeError("EMERGENT_EMAIL_KEY not configured")
        payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
        if EMAIL_REPLY_TO:
            payload["contact_email"] = EMAIL_REPLY_TO
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send", headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        if resp.status_code >= 400:
            try:
                info = resp.json()
            except ValueError:
                info = {}
            code = info.get("code", "")
            if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
                logger.warning("Email paused: %s: %s", code, info.get("message", ""))
                rec["status"] = f"not delivered — {code.replace('_', ' ')} (check Emergent account)"
            else:
                logger.error("Email send failed: %s %s", resp.status_code, resp.text[:300])
                rec["status"] = f"failed ({resp.status_code})"
        else:
            rec["status"] = "delivered"
            rec["provider_id"] = resp.json().get("id", "")
    except Exception as e:  # noqa: BLE001
        logger.error("Email send error: %s", e)
        rec["status"] = f"failed ({str(e)[:80]})"
    await db.outbox.insert_one(rec)
