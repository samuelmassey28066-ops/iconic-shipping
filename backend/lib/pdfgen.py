"""Branded quotation PDF + tabular report PDF via reportlab."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from pathlib import Path

from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

LOGO = Path(__file__).parent / "logo-wordmark.png"

NAVY = colors.HexColor("#0B1D3A")
OCEAN = colors.HexColor("#0284C7")
SKY = colors.HexColor("#F0F7FF")


def _money(cur: str, v: float) -> str:
    sym = "Rs." if cur == "INR" else cur
    return f"{sym} {v:,.2f}"


def quotation_pdf(q: dict, s: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
                            title=f"Quotation {q['quote_no']}")
    ss = getSampleStyleSheet()
    h = ParagraphStyle("h", parent=ss["Title"], textColor=colors.white, fontSize=18, alignment=0, leading=22)
    small_w = ParagraphStyle("sw", parent=ss["Normal"], textColor=colors.white, fontSize=8.5, leading=11)
    body = ParagraphStyle("b", parent=ss["Normal"], fontSize=9, leading=12, textColor=NAVY)
    label = ParagraphStyle("l", parent=body, textColor=OCEAN, fontName="Helvetica-Bold", fontSize=8)
    cur = q.get("currency", "INR")

    header = Table([[Paragraph(f"<b>{s['company_name']}</b>", h),
                     Paragraph(f"QUOTATION<br/><b>{q['quote_no']}</b><br/>Date: {q['created_at'][:10]}<br/>Validity: {q['validity']}", small_w)],
                    [Paragraph(f"{s['location']} &nbsp;|&nbsp; {s['phone']} &nbsp;|&nbsp; {s['email']}", small_w), ""]],
                   colWidths=[120 * mm, 58 * mm])
    header.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8),
                                ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LINEBELOW", (0, -1), (-1, -1), 3, OCEAN)]))
    to = Table([[Paragraph("QUOTATION FOR", label), Paragraph("REFERENCE", label)],
                [Paragraph(f"<b>{q['customer_name']}</b><br/>{q.get('company') or ''}<br/>{q['customer_email']}", body),
                 Paragraph(f"Enquiry: {q['enquiry_no']}<br/>Service: {q.get('service') or '-'}<br/>Vessel: {q.get('vessel_name') or '-'}", body)]],
               colWidths=[89 * mm, 89 * mm])
    to.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SKY), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5)]))

    rows = [["#", "Description", "Qty", "Unit Price", "Amount"]]
    for i, it in enumerate(q["items"], 1):
        rows.append([str(i), Paragraph(it["description"], body), f"{it['qty']:g}", _money(cur, it["unit_price"]),
                     _money(cur, it["qty"] * it["unit_price"])])
    rows += [["", "", "", "Subtotal", _money(cur, q["subtotal"])],
             ["", "", "", "Discount", "- " + _money(cur, q["discount"])],
             ["", "", "", f"GST ({q['gst_percent']:g}%)", _money(cur, q["gst_amount"])],
             ["", "", "", "TOTAL", _money(cur, q["total"])]]
    t = Table(rows, colWidths=[10 * mm, 88 * mm, 16 * mm, 32 * mm, 32 * mm], repeatRows=1)
    n = len(q["items"])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), OCEAN), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                           ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                           ("GRID", (0, 0), (-1, n), 0.4, colors.HexColor("#CBD5E1")),
                           ("ALIGN", (2, 0), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("FONTNAME", (3, -1), (-1, -1), "Helvetica-Bold"), ("BACKGROUND", (3, -1), (-1, -1), SKY),
                           ("TEXTCOLOR", (0, 1), (-1, -1), NAVY)]))
    terms = Paragraph(f"<b>Payment Terms:</b> {q['payment_terms']}<br/><b>Notes:</b> {q.get('notes') or '-'}", body)
    foot = Paragraph(f"For {s['company_name']}<br/><b>{s['owner']}</b><br/>{s['phone']} | {s['email']}", body)
    logo = Image(str(LOGO), width=52 * mm, height=20 * mm) if LOGO.exists() else Spacer(1, 1)
    doc.build([logo, Spacer(1, 6), header, Spacer(1, 8), to, Spacer(1, 10), t, Spacer(1, 12), terms, Spacer(1, 18), foot])
    return buf.getvalue()


def table_pdf(title: str, headers: list[str], rows: list[list], company: str) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=10 * mm, rightMargin=10 * mm, topMargin=10 * mm, bottomMargin=10 * mm)
    ss = getSampleStyleSheet()
    cell = ParagraphStyle("c", parent=ss["Normal"], fontSize=7.5, leading=9)
    data = [headers] + [[Paragraph(str(c), cell) for c in r] for r in rows]
    t = Table(data, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                           ("FONTSIZE", (0, 0), (-1, 0), 8), ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD5E1")),
                           ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    doc.build([Paragraph(f"<b>{company}</b> — {title}", ss["Heading2"]), Spacer(1, 6), t])
    return buf.getvalue()
