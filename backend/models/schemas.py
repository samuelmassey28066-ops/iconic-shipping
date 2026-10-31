"""Pydantic v2 models. Mirrored by hand in frontend/src/lib/types.ts — keep in sync."""
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Users / auth ----------
class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str  # admin | staff | customer
    company: str = ""
    phone: str = ""
    whatsapp: str = ""
    country: str = ""
    address: str = ""
    gst_number: str = ""
    active: bool = True
    permissions: List[str] = []
    created_at: str = ""


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    company: str = Field(default="", max_length=150)
    phone: str = Field(default="", max_length=30)
    country: str = Field(default="India", max_length=60)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    company: str = Field(default="", max_length=150)
    phone: str = Field(default="", max_length=30)
    whatsapp: str = Field(default="", max_length=30)
    country: str = Field(default="", max_length=60)
    address: str = Field(default="", max_length=300)
    gst_number: str = Field(default="", max_length=30)


class MessageOut(BaseModel):
    message: str


# ---------- Files ----------
class FileRef(BaseModel):
    id: str
    filename: str
    content_type: str = ""
    size: int = 0
    uploaded_by: str = ""  # "customer" | "staff" | "guest"


# ---------- Enquiries ----------
class Note(BaseModel):
    id: str
    text: str
    author: str
    at: str


class EnquiryIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    company: str = Field(default="", max_length=150)
    email: EmailStr
    mobile: str = Field(min_length=6, max_length=30)
    whatsapp: str = Field(default="", max_length=30)
    country: str = Field(default="India", max_length=60)
    service_category: str = Field(min_length=2, max_length=80)
    service_required: str = Field(default="", max_length=200)
    vessel_name: str = Field(default="", max_length=120)
    imo_number: str = Field(default="", max_length=20)
    vessel_type: str = Field(default="", max_length=80)
    current_port: str = Field(default="", max_length=120)
    next_port: str = Field(default="", max_length=120)
    requirement: str = Field(min_length=5, max_length=4000)
    expected_date: str = Field(default="", max_length=20)
    cargo_details: str = Field(default="", max_length=2000)
    instructions: str = Field(default="", max_length=2000)
    attachment_ids: List[str] = Field(default=[], max_length=5)
    source: str = Field(default="quote_form", max_length=30)
    website: str = Field(default="", max_length=200)  # honeypot — must stay empty


class Enquiry(BaseModel):
    id: str
    enquiry_no: str
    customer_id: Optional[str] = None
    name: str
    company: str = ""
    email: str
    mobile: str
    whatsapp: str = ""
    country: str = ""
    service_category: str
    service_required: str = ""
    vessel_name: str = ""
    imo_number: str = ""
    vessel_type: str = ""
    current_port: str = ""
    next_port: str = ""
    requirement: str
    expected_date: str = ""
    cargo_details: str = ""
    instructions: str = ""
    attachments: List[FileRef] = []
    status: str = "new"
    assigned_to: Optional[str] = None
    assigned_name: str = ""
    notes: List[Note] = []
    replies: List[Note] = []
    archived: bool = False
    source: str = "quote_form"
    created_at: str
    updated_at: str


class EnquiryCreated(BaseModel):
    id: str
    enquiry_no: str
    status: str


class TrackOut(BaseModel):
    enquiry_no: str
    status: str
    service_category: str
    service_required: str
    vessel_name: str
    created_at: str
    updated_at: str
    replies: List[Note] = []
    quotation_status: Optional[str] = None
    quotation_total: Optional[float] = None


class EnquiryPatch(BaseModel):
    status: Optional[str] = Field(default=None, max_length=30)
    assigned_to: Optional[str] = Field(default=None, max_length=60)
    archived: Optional[bool] = None


class TextIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(default="", max_length=30)
    subject: str = Field(default="", max_length=200)
    message: str = Field(min_length=5, max_length=4000)
    website: str = Field(default="", max_length=200)  # honeypot


# ---------- Quotations ----------
class QuoteItem(BaseModel):
    description: str = Field(min_length=1, max_length=300)
    qty: float = Field(gt=0, le=1_000_000)
    unit_price: float = Field(ge=0, le=1_000_000_000)


class QuotationIn(BaseModel):
    enquiry_id: str
    items: List[QuoteItem] = Field(min_length=1, max_length=50)
    gst_percent: float = Field(default=18, ge=0, le=28)
    discount: float = Field(default=0, ge=0)
    payment_terms: str = Field(default="50% advance, balance on completion.", max_length=1000)
    validity: str = Field(default="15 days", max_length=100)
    notes: str = Field(default="", max_length=2000)
    currency: str = Field(default="INR", max_length=5)


class Quotation(BaseModel):
    id: str
    quote_no: str
    enquiry_id: str
    enquiry_no: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_phone: str = ""
    company: str = ""
    service: str = ""
    vessel_name: str = ""
    items: List[QuoteItem]
    gst_percent: float
    discount: float
    payment_terms: str
    validity: str
    notes: str = ""
    currency: str = "INR"
    subtotal: float
    gst_amount: float
    total: float
    status: str = "draft"  # draft | sent | accepted | rejected
    customer_comment: str = ""
    created_at: str
    sent_at: str = ""
    responded_at: str = ""


class QuoteRespondIn(BaseModel):
    decision: str = Field(pattern="^(accepted|rejected)$")
    comment: str = Field(default="", max_length=1000)


# ---------- Settings / services ----------
class SiteSettings(BaseModel):
    company_name: str = "ICONIC SHIPPING SERVICES"
    owner: str = "VIKASH"
    phone: str = "+91 9712476193"
    whatsapp: str = "+91 9712476193"
    email: str = "supply@iconicshipping.org"
    location: str = "Gandhidham, Gujarat, India"
    address: str = "Gandhidham, Kutch, Gujarat, India"
    map_query: str = "Gandhidham, Gujarat, India"
    office_hours: str = "Mon – Sat, 9:00 AM – 7:00 PM IST"
    hero_title: str = "Your Trusted Partner in"
    hero_highlight: str = "Port Clearance & Marine Logistics"
    hero_subtitle: str = "Reliable Port Operations, Professional Marine Logistics, Hold Cleaning & Tank Squeezing Services Across Indian Ports."
    hero_description: str = "ICONIC SHIPPING SERVICES delivers dependable port clearance, marine logistics and professional vessel cleaning solutions with a commitment to quality, safety and efficient operations."
    hero_image: str = ""
    about_text: str = "ICONIC SHIPPING SERVICES, based in Gandhidham, Gujarat, India, is focused on delivering dependable port clearance, marine logistics and vessel cleaning solutions. Our objective is to simplify marine operations through professional coordination, reliable services and customer-focused support."
    footer_text: str = "Dependable port clearance, marine logistics, marine supply and vessel cleaning support from Gandhidham, Gujarat."


class ServiceOverride(BaseModel):
    slug: str
    title: str = ""
    short: str = ""
    description: str = ""
    image: str = ""
    visible: bool = True


class ServiceOverrideIn(BaseModel):
    title: str = Field(default="", max_length=150)
    short: str = Field(default="", max_length=400)
    description: str = Field(default="", max_length=4000)
    image: str = Field(default="", max_length=600)
    visible: bool = True


# ---------- Misc ----------
class Notification(BaseModel):
    id: str
    title: str
    body: str
    read: bool = False
    created_at: str


class OutboxItem(BaseModel):
    id: str
    to: str
    subject: str
    body: str
    kind: str
    status: str
    created_at: str


class Activity(BaseModel):
    id: str
    user_name: str
    action: str
    target: str = ""
    at: str


class StaffIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="staff", pattern="^(staff|admin)$")
    permissions: List[str] = []


class UserPatch(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    company: Optional[str] = Field(default=None, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=30)
    country: Optional[str] = Field(default=None, max_length=60)
    active: Optional[bool] = None
    permissions: Optional[List[str]] = None
    role: Optional[str] = Field(default=None, pattern="^(staff|admin|customer)$")


class MonthCount(BaseModel):
    month: str
    count: int


class LabelCount(BaseModel):
    label: str
    count: int


class Stats(BaseModel):
    total_enquiries: int
    new_enquiries: int
    pending_enquiries: int
    active_customers: int
    total_quotations: int
    approved_quotations: int
    completed_services: int
    monthly: List[MonthCount]
    by_service: List[LabelCount]
    by_status: List[LabelCount]
    daily: List[MonthCount]


class ContactMessage(BaseModel):
    id: str
    name: str
    email: str
    phone: str = ""
    subject: str = ""
    message: str
    created_at: str


# ---------- Quotation sharing ----------
class ShareLink(BaseModel):
    path: str  # relative /api path; frontend prefixes window.location.origin
    phone: str
    quote_no: str
    total: float
    customer_name: str


# ---------- Testimonials ----------
class TestimonialIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    company: str = Field(default="", max_length=120)
    role: str = Field(default="", max_length=80)
    rating: int = Field(default=5, ge=1, le=5)
    message: str = Field(min_length=10, max_length=800)
    website: str = Field(default="", max_length=200)  # honeypot


class Testimonial(BaseModel):
    id: str
    name: str
    company: str = ""
    role: str = ""
    rating: int = 5
    message: str
    status: str = "pending"  # pending | approved | rejected
    created_at: str


class TestimonialPatch(BaseModel):
    status: str = Field(pattern="^(pending|approved|rejected)$")


# ---------- Vessel ETA board ----------
class VesselCallIn(BaseModel):
    vessel_name: str = Field(min_length=2, max_length=120)
    imo_number: str = Field(default="", max_length=20)
    vessel_type: str = Field(default="", max_length=80)
    port: str = Field(min_length=2, max_length=120)
    berth: str = Field(default="", max_length=80)
    eta: str = Field(min_length=10, max_length=25)  # local datetime "YYYY-MM-DDTHH:MM"
    etd: str = Field(default="", max_length=25)
    service_category: str = Field(default="port-clearance", max_length=80)
    enquiry_id: str = Field(default="", max_length=60)
    crew_assigned: str = Field(default="", max_length=300)
    status: str = Field(default="scheduled", pattern="^(scheduled|arrived|in_service|departed|cancelled)$")
    notes: str = Field(default="", max_length=1000)


class VesselCall(VesselCallIn):
    id: str
    enquiry_no: str = ""
    customer_id: Optional[str] = None
    created_at: str
    updated_at: str


class VesselBoard(BaseModel):
    today: str
    calls: List[VesselCall]


class CustomerVesselCall(BaseModel):
    id: str
    vessel_name: str
    port: str
    berth: str = ""
    eta: str
    etd: str = ""
    service_category: str
    enquiry_no: str = ""
    status: str
