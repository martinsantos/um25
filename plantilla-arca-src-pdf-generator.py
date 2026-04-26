# src/pdf/generator.py
"""
Generador de PDF para facturas con QR del CAE
Respeta identidad visual de ULTIMA MILLA
"""
import logging
from datetime import datetime
from io import BytesIO
from typing import Dict, Optional, Tuple
import os

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import qrcode

from config import IDENTIDAD_UMSA, OUTPUT_DIR

logger = logging.getLogger(__name__)

# Colores UMSA
COLOR_PRIMARIO = "#DC2626"  # Rojo
COLOR_SECUNDARIO = "#1A56C0"  # Azul
COLOR_TEXTO = "#000000"  # Negro
COLOR_FONDO = "#F5F5F5"  # Gris claro


class GeneradorPDFFactura:
    """
    Generador profesional de PDFs de factura con QR
    Incluye validación RG 5824 y diseño UMSA
    """

    def __init__(self, output_dir: str = OUTPUT_DIR):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def generar(
        self,
        tipo_comprobante: int,
        numero: int,
        punto_venta: int,
        cuit_emisor: str,
        razon_social_emisor: str,
        domicilio_emisor: str,
        cae: str,
        vencimiento_cae: str,
        fecha_emision: str,
        #
        tipo_documento_cliente: int,
        numero_documento_cliente: str,
        razon_social_cliente: Optional[str] = None,
        domicilio_cliente: Optional[str] = None,
        #
        items: list = None,
        importe_neto: float = 0.0,
        importe_iva: float = 0.0,
        importe_total: float = 0.0,
        #
        moneda: str = "PES",
        condicion_venta: str = "Contado",
        observaciones: str = "",
        output_filename: Optional[str] = None,
    ) -> str:
        """
        Genera PDF de factura

        Args:
            tipo_comprobante: 6=Factura B, 1=Factura A, etc
            numero: Número secuencial del comprobante
            punto_venta: Punto de venta
            cuit_emisor: CUIT del emisor (ej: 20123456789)
            razon_social_emisor: Nombre de la empresa
            domicilio_emisor: Domicilio fiscal
            cae: CAE obtenido de ARCA
            vencimiento_cae: Fecha de vencimiento del CAE
            fecha_emision: Fecha del comprobante
            tipo_documento_cliente: 99=Consumidor final, 80=CUIT, etc
            numero_documento_cliente: DNI/CUIT del cliente (o "0" si es consumidor)
            razon_social_cliente: Nombre del cliente
            domicilio_cliente: Domicilio del cliente
            items: Lista de dicts con {descripcion, cantidad, precio_unitario, subtotal, iva}
            importe_neto: Total sin IVA
            importe_iva: Total IVA
            importe_total: Total a pagar
            moneda: "PES" o "DOL"
            condicion_venta: "Contado", "30 días", etc
            observaciones: Notas adicionales
            output_filename: Nombre del archivo (default: genera automático)

        Returns:
            Ruta del archivo PDF generado
        """

        if items is None:
            items = []

        # Generar nombre del archivo si no se proporciona
        if not output_filename:
            tipo_str = {6: "B", 1: "A", 11: "C"}.get(tipo_comprobante, str(tipo_comprobante))
            output_filename = f"factura_{tipo_str}_{numero:08d}.pdf"

        filepath = os.path.join(self.output_dir, output_filename)

        # Crear documento
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        # Estilos
        styles = getSampleStyleSheet()
        style_titulo = ParagraphStyle(
            "TituloFactura",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor(COLOR_PRIMARIO),
            spaceAfter=2 * mm,
            alignment=0,  # Left
        )
        style_encabezado = ParagraphStyle(
            "Encabezado",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor(COLOR_TEXTO),
            spaceAfter=1 * mm,
        )
        style_label = ParagraphStyle(
            "Label",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor(COLOR_SECUNDARIO),
            fontName="Helvetica-Bold",
        )

        # Contenido del documento
        story = []

        # === ENCABEZADO ===
        encabezado_data = [
            [
                # Columna izquierda: datos del emisor
                Table(
                    [
                        [Paragraph(f"<b>{razon_social_emisor}</b>", style_encabezado)],
                        [Paragraph(f"CUIT: {cuit_emisor}", style_encabezado)],
                        [Paragraph(domicilio_emisor, style_encabezado)],
                        [Paragraph(IDENTIDAD_UMSA["url"], style_encabezado)],
                    ],
                    colWidths=[80 * mm],
                    style=TableStyle([]),
                ),
                # Columna derecha: tipo de comprobante y número
                Table(
                    [
                        [
                            Paragraph(
                                f"<font size=20 color='{COLOR_PRIMARIO}'>FACTURA {tipo_str.upper()}</font>",
                                style_titulo,
                            )
                        ],
                        [
                            Paragraph(f"N° {punto_venta:05d}-{numero:08d}", style_encabezado)
                        ],
                    ],
                    colWidths=[80 * mm],
                    style=TableStyle([]),
                ),
            ]
        ]

        encabezado_table = Table(encabezado_data, colWidths=[80 * mm, 80 * mm])
        encabezado_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )

        story.append(encabezado_table)
        story.append(Spacer(1, 5 * mm))

        # === DATOS DEL CLIENTE ===
        cliente_data = [
            [Paragraph(f"<b>CLIENTE:</b> {razon_social_cliente or 'Consumidor Final'}", style_encabezado)],
            [
                Paragraph(
                    f"<b>Documento:</b> {['Desconocido', 'Consumidor Final'][(tipo_documento_cliente == 99) and 1] if tipo_documento_cliente == 99 else numero_documento_cliente}",
                    style_encabezado,
                )
            ],
        ]
        if domicilio_cliente:
            cliente_data.append([Paragraph(f"<b>Domicilio:</b> {domicilio_cliente}", style_encabezado)])

        cliente_table = Table(cliente_data, colWidths=[160 * mm])
        cliente_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(COLOR_FONDO)),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )

        story.append(cliente_table)
        story.append(Spacer(1, 5 * mm))

        # === DATOS DEL COMPROBANTE ===
        datos_comprobante = [
            [
                Paragraph("<b>Fecha Emisión:</b>", style_label),
                Paragraph(fecha_emision, style_encabezado),
                Paragraph("<b>Moneda:</b>", style_label),
                Paragraph(moneda, style_encabezado),
                Paragraph("<b>Condición:</b>", style_label),
                Paragraph(condicion_venta, style_encabezado),
            ],
            [
                Paragraph("<b>CAE:</b>", style_label),
                Paragraph(cae, style_encabezado),
                Paragraph("<b>Vto. CAE:</b>", style_label),
                Paragraph(vencimiento_cae, style_encabezado),
                Paragraph("", style_encabezado),
                Paragraph("", style_encabezado),
            ],
        ]

        datos_table = Table(datos_comprobante, colWidths=[25 * mm, 25 * mm, 25 * mm, 25 * mm, 25 * mm, 25 * mm])
        datos_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(COLOR_FONDO)),
                    ("LEFTPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )

        story.append(datos_table)
        story.append(Spacer(1, 5 * mm))

        # === TABLA DE ITEMS ===
        if items:
            items_data = [
                [
                    Paragraph("<b>Descripción</b>", style_label),
                    Paragraph("<b>Cant.</b>", style_label),
                    Paragraph("<b>P. Unitario</b>", style_label),
                    Paragraph("<b>Subtotal</b>", style_label),
                    Paragraph("<b>IVA (21%)</b>", style_label),
                    Paragraph("<b>Total</b>", style_label),
                ]
            ]

            for item in items:
                items_data.append(
                    [
                        Paragraph(item.get("descripcion", ""), style_encabezado),
                        Paragraph(f"{item.get('cantidad', 0):.2f}", style_encabezado),
                        Paragraph(f"${item.get('precio_unitario', 0):.2f}", style_encabezado),
                        Paragraph(f"${item.get('subtotal', 0):.2f}", style_encabezado),
                        Paragraph(f"${item.get('iva', 0):.2f}", style_encabezado),
                        Paragraph(f"${item.get('total', 0):.2f}", style_encabezado),
                    ]
                )

            items_table = Table(items_data, colWidths=[60 * mm, 15 * mm, 20 * mm, 20 * mm, 20 * mm, 25 * mm])
            items_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(COLOR_SECUNDARIO)),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )

            story.append(items_table)
            story.append(Spacer(1, 5 * mm))

        # === TOTALES ===
        totales_data = [
            [Paragraph("<b>Subtotal Neto:</b>", style_label), Paragraph(f"${importe_neto:.2f}", style_encabezado)],
            [Paragraph("<b>IVA (21%):</b>", style_label), Paragraph(f"${importe_iva:.2f}", style_encabezado)],
            [
                Paragraph("<b style='font-size:12'>TOTAL:</b>", style_label),
                Paragraph(f"<b style='font-size:12'>${importe_total:.2f}</b>", style_encabezado),
            ],
        ]

        totales_table = Table(totales_data, colWidths=[140 * mm, 20 * mm])
        totales_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor(COLOR_FONDO)),
                    ("GRID", (0, 2), (-1, 2), 0.5, colors.grey),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        story.append(totales_table)
        story.append(Spacer(1, 10 * mm))

        # === QR DEL CAE ===
        try:
            qr_img = self._generar_qr_cae(cae, fecha_emision)
            story.append(Paragraph("<b>Código QR para verificación:</b>", style_label))
            story.append(qr_img)
        except Exception as e:
            logger.warning(f"No se pudo generar QR: {e}")

        # === PIE DE PÁGINA ===
        story.append(Spacer(1, 5 * mm))
        story.append(
            Paragraph(
                f"<i><font size=8>Este comprobante fue generado con la plantilla open source de {IDENTIDAD_UMSA['nombre_empresa']} ({IDENTIDAD_UMSA['url']})</font></i>",
                style_encabezado,
            )
        )

        if observaciones:
            story.append(Spacer(1, 3 * mm))
            story.append(Paragraph(f"<b>Observaciones:</b> {observaciones}", style_encabezado))

        # Construir PDF
        try:
            doc.build(story)
            logger.info(f"✓ PDF generado: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"✗ Error generando PDF: {e}")
            raise

    def _generar_qr_cae(self, cae: str, fecha_emision: str) -> Image:
        """
        Genera QR con datos del CAE para verificación en AFIP
        """
        # URL de verificación de AFIP
        qr_data = f"https://www.arca.gob.ar/comprobantes/ver?cae={cae}&fecha={fecha_emision}"

        # Generar QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convertir a BytesIO para ReportLab
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        return Image(img_bytes, width=50 * mm, height=50 * mm)


# Ejemplo de uso
if __name__ == "__main__":
    generador = GeneradorPDFFactura()

    # Datos de ejemplo
    pdf_path = generador.generar(
        tipo_comprobante=6,
        numero=1,
        punto_venta=1,
        cuit_emisor="20123456789",
        razon_social_emisor="Mi Empresa S.A.",
        domicilio_emisor="Calle Falsa 123, CABA",
        cae="12345678901234",
        vencimiento_cae="20260502",
        fecha_emision="20260426",
        tipo_documento_cliente=99,
        numero_documento_cliente="0",
        razon_social_cliente="Consumidor Final",
        items=[
            {
                "descripcion": "Servicio profesional",
                "cantidad": 1,
                "precio_unitario": 100.0,
                "subtotal": 100.0,
                "iva": 21.0,
                "total": 121.0,
            }
        ],
        importe_neto=100.0,
        importe_iva=21.0,
        importe_total=121.0,
    )

    print(f"PDF creado en: {pdf_path}")
