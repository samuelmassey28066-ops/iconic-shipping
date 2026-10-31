"""Security: /api/admin/* unauthorized for guests (401) and customers (403); customer cannot fetch another
customer's quotation PDF (404); staff (perms=enquiries,quotations) forbidden from website/customers endpoints."""
import uuid

import httpx

BACKEND = "http://localhost:8001/api"


def _register_customer(tag):
    suffix = uuid.uuid4().hex[:8]
    email = f"tscheck-sec-{tag}-{suffix}@example.com"
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/register", json={
        "name": f"Tscheck Sec {tag}", "email": email, "password": "Passw0rd123",
        "company": "", "phone": "9999900004", "country": "India",
    })
    assert r.status_code == 200, r.text
    return c, email


def _admin_client():
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/login", json={"email": "admin@iconicshipping.org", "password": "Admin@123"})
    assert r.status_code == 200, r.text
    return c


def _staff_client():
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/login", json={"email": "staff@iconicshipping.org", "password": "Staff@123"})
    assert r.status_code == 200, r.text
    return c


def test_admin_endpoints_401_for_guest_403_for_customer():
    guest = httpx.Client(base_url=BACKEND, timeout=30.0)
    try:
        r = guest.get("/admin/stats")
        assert r.status_code == 401, r.text
    finally:
        guest.close()

    cust, _ = _register_customer("guard")
    try:
        r = cust.get("/admin/stats")
        assert r.status_code == 403, r.text
    finally:
        cust.close()


def test_customer_cannot_fetch_other_customers_quotation_pdf():
    custA, emailA = _register_customer("a")
    custB, emailB = _register_customer("b")
    admin = _admin_client()
    try:
        r = custA.post("/my/enquiries", json={
            "name": "Tscheck Sec A", "company": "", "email": emailA, "mobile": "9999900005",
            "whatsapp": "", "country": "India", "service_category": "lsa-ffa", "service_required": "LSA/FFA",
            "vessel_name": "MV Sec", "imo_number": "", "vessel_type": "", "current_port": "Kandla", "next_port": "",
            "requirement": "Need LSA FFA inspection for vessel.", "expected_date": "", "cargo_details": "",
            "instructions": "", "attachment_ids": [], "source": "quote_form", "website": "",
        })
        assert r.status_code == 200, r.text
        enq = r.json()

        r = admin.post("/admin/quotations", json={
            "enquiry_id": enq["id"],
            "items": [{"description": "LSA inspection", "qty": 1, "unit_price": 5000}],
            "gst_percent": 18, "discount": 0, "payment_terms": "", "validity": "15 days", "notes": "",
            "currency": "INR",
        })
        assert r.status_code == 200, r.text
        quote = r.json()
        r = admin.post(f"/admin/quotations/{quote['id']}/send")
        assert r.status_code == 200, r.text

        # customer A (owner) can fetch
        r = custA.get(f"/my/quotations/{quote['id']}/pdf")
        assert r.status_code == 200, r.text

        # customer B (not owner) cannot
        r = custB.get(f"/my/quotations/{quote['id']}/pdf")
        assert r.status_code == 404, r.text
    finally:
        custA.close()
        custB.close()
        admin.close()


def test_staff_forbidden_from_website_and_customers():
    staff = _staff_client()
    try:
        r = staff.get("/admin/customers")
        assert r.status_code == 403, r.text

        r = staff.put("/admin/settings", json={
            "company_name": "X", "owner": "X", "phone": "x", "whatsapp": "x", "email": "x@x.com",
            "location": "x", "address": "x", "map_query": "x", "office_hours": "x", "hero_title": "x",
            "hero_highlight": "x", "hero_subtitle": "x", "hero_description": "x", "hero_image": "",
            "about_text": "x", "footer_text": "x",
        })
        assert r.status_code == 403, r.text
    finally:
        staff.close()
