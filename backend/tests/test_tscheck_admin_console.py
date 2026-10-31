"""Admin console: dashboard stats, enquiries table/status change/note, Website tab settings update (restored),
reports export, Email Outbox."""
import uuid

import httpx

BACKEND = "http://localhost:8001/api"


def _admin_client():
    c = httpx.Client(base_url=BACKEND, timeout=30.0)
    r = c.post("/auth/login", json={"email": "admin@iconicshipping.org", "password": "Admin@123"})
    assert r.status_code == 200, r.text
    return c


def _make_enquiry(admin_or_guest):
    suffix = uuid.uuid4().hex[:8]
    email = f"tscheck-admin-src-{suffix}@example.com"
    r = admin_or_guest.post("/enquiries", json={
        "name": "Tscheck Admin Src", "company": "Tscheck Co", "email": email,
        "mobile": "9999900003", "whatsapp": "", "country": "India",
        "service_category": "marine-repair", "service_required": "Marine Repair",
        "vessel_name": "MV Admin", "imo_number": "", "vessel_type": "", "current_port": "Kandla",
        "next_port": "", "requirement": "Need marine repair services for vessel.",
        "expected_date": "", "cargo_details": "", "instructions": "", "attachment_ids": [],
        "source": "quote_form", "website": "",
    })
    assert r.status_code == 200, r.text
    return r.json()


def test_admin_dashboard_stats():
    admin = _admin_client()
    try:
        r = admin.get("/admin/stats")
        assert r.status_code == 200, r.text
        s = r.json()
        for key in ("total_enquiries", "new_enquiries", "total_quotations", "monthly", "by_service", "by_status"):
            assert key in s
    finally:
        admin.close()


def test_admin_enquiry_status_and_note():
    admin = _admin_client()
    try:
        enq = _make_enquiry(admin)
        r = admin.get("/admin/enquiries", params={"q": enq["enquiry_no"]})
        assert r.status_code == 200
        assert any(e["enquiry_no"] == enq["enquiry_no"] for e in r.json())

        r = admin.patch(f"/admin/enquiries/{enq['id']}", json={"status": "in_review"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "in_review"

        r = admin.post(f"/admin/enquiries/{enq['id']}/notes", json={"text": "tscheck internal note"})
        assert r.status_code == 200, r.text
        assert any(n["text"] == "tscheck internal note" for n in r.json()["notes"])

        r = admin.post(f"/admin/enquiries/{enq['id']}/reply", json={"text": "tscheck reply to customer"})
        assert r.status_code == 200, r.text
        assert any(n["text"] == "tscheck reply to customer" for n in r.json()["replies"])
    finally:
        admin.close()


def test_admin_website_settings_roundtrip_restored():
    admin = _admin_client()
    try:
        r = admin.get("/settings")
        assert r.status_code == 200
        original = r.json()
        assert original["phone"] == "+91 9712476193"

        updated = dict(original)
        updated["phone"] = "+91 9000000000"
        r = admin.put("/admin/settings", json=updated)
        assert r.status_code == 200, r.text
        assert r.json()["phone"] == "+91 9000000000"

        r = admin.get("/settings")
        assert r.json()["phone"] == "+91 9000000000"

        # restore original phone so other checks relying on the seeded footer still pass
        r = admin.put("/admin/settings", json=original)
        assert r.status_code == 200
        assert r.json()["phone"] == "+91 9712476193"
    finally:
        admin.close()


def test_admin_reports_export_and_outbox():
    admin = _admin_client()
    try:
        r = admin.get("/admin/reports/export", params={"kind": "enquiries", "fmt": "xlsx", "period": "all"})
        assert r.status_code == 200, r.text
        assert "spreadsheet" in r.headers["content-type"]

        r = admin.get("/admin/reports/export", params={"kind": "quotations", "fmt": "pdf", "period": "all"})
        assert r.status_code == 200, r.text
        assert r.content[:4] == b"%PDF"

        r = admin.get("/admin/outbox")
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)
    finally:
        admin.close()
