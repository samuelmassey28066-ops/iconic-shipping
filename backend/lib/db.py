"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "users": [IndexModel([("id", ASCENDING)], name="id", unique=True),
              IndexModel([("email", ASCENDING)], name="email", unique=True),
              IndexModel([("role", ASCENDING), ("created_at", DESCENDING)], name="role_created")],
    "sessions": [IndexModel([("token", ASCENDING)], name="token", unique=True),
                 IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "password_resets": [IndexModel([("token", ASCENDING)], name="token", unique=True),
                        IndexModel([("expires_at", ASCENDING)], name="ttl", expireAfterSeconds=0)],
    "enquiries": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                  IndexModel([("enquiry_no", ASCENDING)], name="enquiry_no", unique=True),
                  IndexModel([("customer_id", ASCENDING), ("created_at", DESCENDING)], name="customer_created"),
                  IndexModel([("archived", ASCENDING), ("created_at", DESCENDING)], name="archived_created")],
    "quotations": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                   IndexModel([("share_token", ASCENDING)], name="share_token", sparse=True),
                   IndexModel([("enquiry_id", ASCENDING)], name="enquiry_id"),
                   IndexModel([("customer_id", ASCENDING), ("created_at", DESCENDING)], name="customer_created")],
    "files": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "notifications": [IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")],
    "outbox": [IndexModel([("created_at", DESCENDING)], name="created")],
    "activity": [IndexModel([("at", DESCENDING)], name="at")],
    "service_overrides": [IndexModel([("slug", ASCENDING)], name="slug", unique=True)],
    "testimonials": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                     IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created")],
    "vessel_calls": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                     IndexModel([("eta", ASCENDING)], name="eta"),
                     IndexModel([("customer_id", ASCENDING), ("eta", ASCENDING)], name="customer_eta")],
    "settings": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
