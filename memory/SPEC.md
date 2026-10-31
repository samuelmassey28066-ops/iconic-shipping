# ICONIC SHIPPING SERVICES – SPEC

Premium maritime corporate site + customer portal + admin console for ICONIC SHIPPING SERVICES, Gandhidham (owner VIKASH, +91 9712476193, supply@iconicshipping.org — all editable in Admin → Website).

## Stack
React 19 + Vite + Tailwind v4 + motion (frontend), FastAPI + MongoDB (backend). All API under /api.

## Public pages
/ (hero, 30 services, two primary services, supply services, why us, about, CTA), /about, /services (cards open right side panel with inquiry), /services/:slug (7 supply services), /port-clearance, /hold-cleaning (before/after slider), /why-us, /contact (form + Google Maps embed), /quote (5-step form → enquiry ID), /track (enquiry ID + email), /privacy-policy, /terms.
Floating WhatsApp + email buttons on every public page. ServiceInquiry form: Send via WhatsApp (wa.me with service-specific encoded message) / Send via Email (mailto with service subject+body). Both also save an enquiry (source whatsapp_inquiry / email_inquiry).

## Auth
Cookie session `iss_session` (httpOnly). Roles: admin (all perms), staff (permissions list: enquiries, quotations, customers, website, reports, staff), customer. /login shared; customers → /portal, staff → /admin.

## Collections
users, sessions (TTL), password_resets, enquiries (enquiry_no ISS-YYMMDD-XXXX, status new|in_review|quoted|approved|in_progress|completed|rejected|closed, notes internal, replies visible), quotations (QT-YYMM-NNNN, items, gst_percent, discount, totals, status draft|sent|accepted|rejected), files (uploads dir, PDF/JPG/PNG ≤5MB, magic-byte checked), notifications, outbox, activity, settings (id=site), service_overrides, contact_messages.

## Email — REAL (Emergent managed Resend)
lib/mailer.send_email renders a server-side HTML template, runs the guardrail gate, POSTs to the integration proxy (EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME, EMAIL_REPLY_TO in backend/.env) and records every send with its delivery status in `outbox` (Admin → Email Outbox). Never raises. Links (track, reset, shared quote PDF) only included when request Origin is https.

## Added features
- Logo: /logo-mark.png (header/admin/portal mark), /logo-wordmark.png (auth pages, About, quotation PDF header). Favicons generated from mark.
- Testimonials: POST /api/testimonials (public, honeypot, 3/min) → pending; admin (website perm) approves at Admin → Testimonials; GET /api/testimonials returns approved only; homepage section + feedback dialog.
- WhatsApp quote sharing: POST /api/admin/quotations/{id}/share-link → {path, phone}; public GET /api/quotations/shared/{token} serves the PDF (unguessable token, non-draft only). Quotations tab WhatsApp button opens wa.me/<customer> with message + link. Quotation emails include the same link.
- Vessel ETA board: collection vessel_calls; admin/staff (enquiries perm) CRUD at /api/admin/vessel-calls (board returns today in Asia/Kolkata); optional link to an enquiry → customer sees own calls at /api/my/vessel-calls (Portal → Vessel Schedule, no notes/crew) and gets a notification on ETA/status change.

## Seed (python seed.py)
admin@iconicshipping.org / Admin@123 (admin), staff@iconicshipping.org / Staff@123 (staff: enquiries, quotations). Default settings doc.
