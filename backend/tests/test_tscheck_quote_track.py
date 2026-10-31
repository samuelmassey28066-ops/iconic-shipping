"""Multi-step quote form submits -> creates enquiry with ISS-YYMMDD-XXXX id; /track finds it with status New."""
import re
import uuid

ENQ_NO_RE = re.compile(r"^ISS-\d{6}-[A-Z0-9]{4}$")


def test_quote_form_creates_enquiry_and_tracks(client):
    email = f"tscheck-quote-{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Tscheck Quote User",
        "company": "Tscheck Co",
        "email": email,
        "mobile": "9999900001",
        "whatsapp": "",
        "country": "India",
        "service_category": "port-clearance",
        "service_required": "Port Clearance",
        "vessel_name": "MV Tscheck",
        "imo_number": "1234567",
        "vessel_type": "Bulk Carrier",
        "current_port": "Kandla",
        "next_port": "Mundra",
        "requirement": "Need port clearance for vessel arrival next week.",
        "expected_date": "",
        "cargo_details": "",
        "instructions": "",
        "attachment_ids": [],
        "source": "quote_form",
        "website": "",
    }
    r = client.post("/enquiries", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert ENQ_NO_RE.match(body["enquiry_no"]), body
    assert body["status"] == "new"

    r2 = client.get("/enquiries/track", params={"enquiry_no": body["enquiry_no"], "email": email})
    assert r2.status_code == 200, r2.text
    t = r2.json()
    assert t["enquiry_no"] == body["enquiry_no"]
    assert t["status"] == "new"


def test_track_unknown_enquiry_404(client):
    r = client.get("/enquiries/track", params={"enquiry_no": "ISS-000000-ZZZZ", "email": "nobody@example.com"})
    assert r.status_code == 404, r.text
