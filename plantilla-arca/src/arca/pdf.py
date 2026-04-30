"""PDF invoice generation with ReportLab."""
import io
import logging
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

logger = logging.getLogger(__name__)


def generar_pdf(
    cuit: str,
    razon_social: str,
    domicilio: str,
    condicion_iva: str,
    tipo_comprobante: str,
    fecha_emision: str,
    descripcion: str,
    importe_total: float,
    cae: str,
    vencimiento: str,
    logo_url: str | None = None,
) -> bytes:
    """Generate an invoice PDF with CAE."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)

    styles = getSampleStyleSheet()
    story = []

    title_style = styles["Heading1"]
    title_style.alignment = 1
    story.append(Paragraph(f"{tipo_comprobante}", title_style))
    story.append(Spacer(1, 5*mm))

    seller_data = [
        ["CUIT:", cuit],
        ["Razón Social:", razon_social],
        ["Domicilio:", domicilio],
        ["Condición IVA:", condicion_iva],
    ]
    seller_table = Table(seller_data, colWidths=[40*mm, 120*mm])
    seller_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(seller_table)
    story.append(Spacer(1, 5*mm))

    inv_data = [
        ["Fecha de Emisión:", fecha_emision],
        ["Descripción:", descripcion],
    ]
    inv_table = Table(inv_data, colWidths=[40*mm, 120*mm])
    inv_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(inv_table)
    story.append(Spacer(1, 5*mm))

    alicuota = 0.21
    subtotal = round(importe_total / (1 + alicuota), 2)
    iva = round(importe_total - subtotal, 2)

    amounts = [
        ["Subtotal:", f"${subtotal:,.2f}"],
        ["IVA 21%:", f"${iva:,.2f}"],
        ["TOTAL:", f"${importe_total:,.2f}"],
    ]
    amt_table = Table(amounts, colWidths=[130*mm, 30*mm])
    amt_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, 0), "Helvetica"),
        ("FONTNAME", (0, 1), (0, 1), "Helvetica"),
        ("FONTNAME", (0, 2), (0, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, 2), (1, 2), 1, colors.black),
        ("TOPPADDING", (0, 2), (1, 2), 6),
    ]))
    story.append(amt_table)
    story.append(Spacer(1, 5*mm))

    cae_data = [
        ["CAE:", cae],
        ["Vencimiento CAE:", vencimiento],
    ]
    cae_table = Table(cae_data, colWidths=[40*mm, 120*mm])
    cae_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1e3a5f")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(cae_table)

    story.append(Spacer(1, 10*mm))
    footer = Paragraph(
        "RG 5824 - Comprobante autorizado<br/>"
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        styles["Normal"]
    )
    story.append(footer)

    doc.build(story)
    return buf.getvalue()
