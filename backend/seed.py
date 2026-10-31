"""Idempotent seed: admin + staff accounts and default site settings. Run: cd /app/backend && python seed.py"""
import asyncio

from lib.auth import ALL_PERMS, hash_pw, new_id, now_iso
from lib.db import db, ensure_indexes
from models.schemas import SiteSettings

ACCOUNTS = [
    ("admin@iconicshipping.org", "Admin@123", "Vikash", "admin", ALL_PERMS),
    ("staff@iconicshipping.org", "Staff@123", "Operations Staff", "staff", ["enquiries", "quotations"]),
]


async def main():
    await ensure_indexes()
    for email, pw, name, role, perms in ACCOUNTS:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({"id": new_id(), "email": email, "name": name, "role": role, "company": "ICONIC SHIPPING SERVICES",
                                       "phone": "+91 9712476193", "whatsapp": "+91 9712476193", "country": "India", "address": "",
                                       "gst_number": "", "active": True, "permissions": perms, "created_at": now_iso(),
                                       "password_hash": hash_pw(pw)})
            print("created", email)
    if not await db.settings.find_one({"id": "site"}):
        await db.settings.insert_one({"id": "site", **SiteSettings().model_dump()})
        print("settings seeded")


if __name__ == "__main__":
    asyncio.run(main())
