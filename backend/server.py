import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes  # noqa: E402
from routers import admin, auth, customer, extras, public  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    yield
    client.close()


app = FastAPI(lifespan=lifespan, title="ICONIC SHIPPING SERVICES API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "ICONIC SHIPPING SERVICES API"}


api_router.include_router(auth.router)
api_router.include_router(public.router)
api_router.include_router(customer.router)
api_router.include_router(admin.router)
api_router.include_router(extras.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Include the router in the main app — must stay the last statement
app.include_router(api_router)
