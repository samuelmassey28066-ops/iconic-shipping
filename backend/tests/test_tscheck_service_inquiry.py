"""Service inquiry form (WhatsApp/Email source) saves an enquiry via POST /api/enquiries."""
import uuid


def test_service_inquiry_saves_enquiry_with_whatsapp_source(client):
    suffix = uuid.uuid4().hex[:8]
    email = f"tscheck-svcinq-{suffix}@example.com"
    r = client.post("/enquiries", json={
        "name": "Tscheck Svc Inquiry", "company": "", "email": email, "mobile": "9999900006",
        "whatsapp": "9999900006", "country": "India", "service_category": "marine-machinery",
        "service_required": "Marine Machinery & Equipment", "vessel_name": "", "imo_number": "",
        "vessel_type": "", "current_port": "", "next_port": "", "requirement": "Need marine machinery parts urgently.",
        "expected_date": "", "cargo_details": "", "instructions": "", "attachment_ids": [],
        "source": "whatsapp_inquiry", "website": "",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "new"
    assert body["enquiry_no"].startswith("ISS-")


def test_service_inquiry_validation_rejects_missing_name(client):
    r = client.post("/enquiries", json={
        "name": "", "company": "", "email": "notname@example.com", "mobile": "9999900007",
        "whatsapp": "", "country": "India", "service_category": "marine-machinery",
        "service_required": "", "vessel_name": "", "imo_number": "", "vessel_type": "", "current_port": "",
        "next_port": "", "requirement": "Need something done please.", "expected_date": "", "cargo_details": "",
        "instructions": "", "attachment_ids": [], "source": "email_inquiry", "website": "",
    })
    assert r.status_code == 422, r.text
