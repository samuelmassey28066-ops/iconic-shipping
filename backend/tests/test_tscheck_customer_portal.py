"""Customer portal: register -> submit enquiry -> admin quotes & sends -> customer downloads PDF & accepts."""
import uuid

import httpx

BACKEND = "http://localhost:8001/api"


def _register_customer():
    suffix = uuid.uuid4().hex[:8]
    email = f"tscheck-cust-{suffix}@example.com"
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/register", json={
        "name": "Tscheck Customer", "email": email, "password": "Passw0rd123",
        "company": "Tscheck Shipping", "phone": "9999900002", "country": "India",
    })
    assert r.status_code == 200, r.text
    return c, email


def _admin_client():
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/login", json={"email": "admin@iconicshipping.org", "password": "Admin@123"})
    assert r.status_code == 200, r.text
    return c


def test_customer_portal_quotation_lifecycle():
    cust, email = _register_customer()
    try:
        # customer submits an enquiry while logged in
        r = cust.post("/my/enquiries", json={
            "name": "Tscheck Customer", "company": "Tscheck Shipping", "email": email,
            "mobile": "9999900002", "whatsapp": "", "country": "India",
            "service_category": "ship-chandling", "service_required": "Ship Chandling",
            "vessel_name": "MV Portal", "imo_number": "", "vessel_type": "", "current_port": "Kandla",
            "next_port": "", "requirement": "Need chandling supplies for vessel call.",
            "expected_date": "", "cargo_details": "", "instructions": "", "attachment_ids": [],
            "source": "quote_form", "website": "",
        })
        assert r.status_code == 200, r.text
        enq = r.json()

        # customer sees only own enquiries
        r = cust.get("/my/enquiries")
        assert r.status_code == 200
        assert any(e["id"] == enq["id"] for e in r.json())

        admin = _admin_client()
        try:
            r = admin.post("/admin/quotations", json={
                "enquiry_id": enq["id"],
                "items": [{"description": "Chandling supply", "qty": 1, "unit_price": 10000}],
                "gst_percent": 18, "discount": 0, "payment_terms": "50% advance", "validity": "15 days",
                "notes": "", "currency": "INR",
            })
            assert r.status_code == 200, r.text
            quote = r.json()
            assert quote["status"] == "draft"

            r = admin.post(f"/admin/quotations/{quote['id']}/send")
            assert r.status_code == 200, r.text
            assert r.json()["status"] == "sent"
        finally:
            admin.close()

        # customer sees it in their quotations list
        r = cust.get("/my/quotations")
        assert r.status_code == 200
        mine = [q for q in r.json() if q["id"] == quote["id"]]
        assert len(mine) == 1, r.text
        assert mine[0]["status"] == "sent"

        # customer downloads PDF
        r = cust.get(f"/my/quotations/{quote['id']}/pdf")
        assert r.status_code == 200, r.text
        assert r.headers["content-type"] == "application/pdf"
        assert r.content[:4] == b"%PDF"

        # customer accepts
        r = cust.post(f"/my/quotations/{quote['id']}/respond", json={"decision": "accepted", "comment": "ok"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "accepted"
    finally:
        cust.close()
