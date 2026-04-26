# src/web/streamlit_app.py
"""
Interfaz web con Streamlit para generar facturas electrónicas
Ofrece un formulario simple para cargar datos y generar PDF con CAE
"""
import streamlit as st
from datetime import datetime, timedelta
import os
import sys

# Agregar directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from src.arca.client import ArcaClient
from src.pdf.generator import GeneradorPDFFactura
from src.config import ARCA_CUIT, IDENTIDAD_UMSA

# Configuración de página
st.set_page_config(
    page_title="Facturación ARCA - ULTIMA MILLA",
    page_icon="🧾",
    layout="wide",
    initial_sidebar_state="expanded",
)

# CSS personalizado con identidad UMSA
st.markdown(
    """
    <style>
    :root {
        --color-primario: #DC2626;
        --color-secundario: #1A56C0;
        --color-fondo: #F5F5F5;
    }

    .titulo-principal {
        color: var(--color-primario);
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .subtitulo {
        color: var(--color-secundario);
        font-size: 1.2rem;
    }

    .box-info {
        background-color: var(--color-fondo);
        padding: 20px;
        border-radius: 10px;
        border-left: 4px solid var(--color-primario);
        margin: 10px 0;
    }

    .box-exito {
        background-color: #ECFDF5;
        border-left: 4px solid #10B981;
        padding: 15px;
        border-radius: 5px;
    }

    .box-error {
        background-color: #FEF2F2;
        border-left: 4px solid #EF4444;
        padding: 15px;
        border-radius: 5px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# === ENCABEZADO ===
col1, col2 = st.columns([3, 1])
with col1:
    st.markdown("<div class='titulo-principal'>🧾 Generador de Facturas ARCA</div>", unsafe_allow_html=True)
    st.markdown("<div class='subtitulo'>Cumplimiento RG 5824 - AFIP</div>", unsafe_allow_html=True)

with col2:
    st.image("https://ultimamilla.com.ar/logo.svg" if os.path.exists("logo.svg") else None)

st.divider()

# === INFORMACIÓN INICIAL ===
st.markdown(
    f"""
    <div class='box-info'>
    <strong>Plantilla open source de {IDENTIDAD_UMSA['nombre_empresa']}</strong><br>
    Genera facturas electrónicas con CAE automático desde ARCA, válidas según RG 5824 de AFIP.
    </div>
    """,
    unsafe_allow_html=True,
)

# === SIDEBAR: CONFIGURACIÓN ===
with st.sidebar:
    st.header("⚙️ Configuración")

    ambiente = st.radio(
        "Ambiente",
        ["🏠 Homologación (Test)", "🚀 Producción"],
        index=0,
        help="Homologación = pruebas sin validez legal. Producción = genera facturas válidas.",
    )

    homologacion = ambiente == "🏠 Homologación (Test)"

    st.info(f"Ambiente: **{'Homologación' if homologacion else 'Producción'}**")

    st.divider()

    st.subheader("Datos del Emisor")
    cuit_emisor = st.text_input(
        "CUIT del Emisor",
        value=ARCA_CUIT or "20123456789",
        help="Tu CUIT sin guiones (11 dígitos)",
    )

    razon_social = st.text_input(
        "Razón Social",
        value="Mi Empresa S.A.",
        help="Nombre de tu empresa/profesión",
    )

    domicilio = st.text_input(
        "Domicilio",
        value="Calle Falsa 123, CABA, Argentina",
        help="Domicilio fiscal",
    )

# === FORMULARIO PRINCIPAL ===
st.subheader("📝 Datos del Comprobante")

col_fecha, col_tipo, col_punto = st.columns(3)
with col_fecha:
    fecha_emision = st.date_input(
        "Fecha de Emisión",
        value=datetime.now(),
        format="DD/MM/YYYY",
    )

with col_tipo:
    tipo_comprobante = st.selectbox(
        "Tipo de Comprobante",
        [(1, "Factura A"), (6, "Factura B"), (11, "Factura C"), (7, "Nota de Débito B")],
        format_func=lambda x: x[1],
        index=1,
    )[0]

with col_punto:
    punto_venta = st.number_input(
        "Punto de Venta",
        value=1,
        min_value=1,
        max_value=99999,
        help="Número de punto de venta AFIP",
    )

numero_comprobante = st.number_input(
    "Número de Comprobante",
    value=1,
    min_value=1,
    help="Número secuencial del comprobante",
)

st.divider()

st.subheader("👤 Datos del Cliente")

col_doc_tipo, col_doc_num = st.columns(2)
with col_doc_tipo:
    tipo_documento = st.selectbox(
        "Tipo de Documento",
        [(99, "Consumidor Final"), (80, "CUIT"), (96, "DNI")],
        format_func=lambda x: x[1],
        index=0,
    )[0]

with col_doc_num:
    numero_documento = st.text_input(
        "Número de Documento",
        value="0" if tipo_documento == 99 else "",
        help="Dejar en 0 si es Consumidor Final",
    )

razon_social_cliente = st.text_input(
    "Nombre/Razón Social del Cliente",
    value="Consumidor Final" if tipo_documento == 99 else "",
    placeholder="Nombre del cliente",
)

domicilio_cliente = st.text_input(
    "Domicilio del Cliente (Opcional)",
    value="",
    placeholder="Calle, número, localidad",
)

st.divider()

st.subheader("🛍️ Items/Detalles")

col_items = st.expander("➕ Agregar Items", expanded=True)
with col_items:
    num_items = st.slider("Cantidad de items", 1, 10, 1)

    items = []
    for i in range(num_items):
        st.write(f"**Item {i+1}**")
        col1, col2, col3 = st.columns(3)

        with col1:
            descripcion = st.text_input(
                "Descripción",
                value=f"Servicio {i+1}" if i == 0 else "Producto",
                key=f"desc_{i}",
            )

        with col2:
            cantidad = st.number_input(
                "Cantidad",
                value=1.0,
                min_value=0.01,
                step=0.01,
                key=f"cant_{i}",
            )

        with col3:
            precio = st.number_input(
                "Precio Unitario",
                value=100.0,
                min_value=0.01,
                step=0.01,
                key=f"precio_{i}",
            )

        subtotal = cantidad * precio
        iva_item = subtotal * 0.21  # 21% por defecto
        total_item = subtotal + iva_item

        items.append(
            {
                "descripcion": descripcion,
                "cantidad": cantidad,
                "precio_unitario": precio,
                "subtotal": subtotal,
                "iva": iva_item,
                "total": total_item,
            }
        )

        st.write(f"Subtotal: ${subtotal:.2f} | IVA: ${iva_item:.2f} | Total: ${total_item:.2f}")
        st.divider()

# === CÁLCULOS AUTOMÁTICOS ===
importe_neto = sum(item["subtotal"] for item in items)
importe_iva = sum(item["iva"] for item in items)
importe_total = importe_neto + importe_iva

st.divider()

st.subheader("💰 Resumen")
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Subtotal Neto", f"${importe_neto:,.2f}")
with col2:
    st.metric("IVA (21%)", f"${importe_iva:,.2f}")
with col3:
    st.metric("Total", f"${importe_total:,.2f}", delta=None)

st.divider()

# === OPCIONES AVANZADAS ===
with st.expander("⚙️ Opciones Avanzadas"):
    col1, col2 = st.columns(2)
    with col1:
        fecha_vencimiento = st.date_input(
            "Fecha de Vencimiento de Pago",
            value=datetime.now() + timedelta(days=10),
            format="DD/MM/YYYY",
        )

        concepto = st.selectbox(
            "Concepto",
            [(1, "Productos"), (2, "Servicios"), (3, "Ambos")],
            format_func=lambda x: x[1],
            index=0,
        )[0]

    with col2:
        moneda = st.selectbox(
            "Moneda",
            ["PES", "DOL", "EUR"],
            index=0,
        )

        condicion_venta = st.text_input(
            "Condición de Venta",
            value="Contado",
            help="Contado, 30 días, etc",
        )

    observaciones = st.text_area(
        "Observaciones (Opcional)",
        value="",
        placeholder="Notas adicionales",
        height=80,
    )

st.divider()

# === BOTÓN PRINCIPAL: GENERAR FACTURA ===
col_btn1, col_btn2 = st.columns([2, 1])

with col_btn1:
    if st.button(
        "✨ Generar Factura con CAE",
        type="primary",
        use_container_width=True,
        key="btn_generar",
    ):
        try:
            with st.spinner("Conectando a ARCA, solicitando CAE..."):
                # Crear cliente ARCA
                cliente_arca = ArcaClient(
                    cuit=cuit_emisor,
                    homologacion=homologacion,
                )

                # Convertir fechas a formato YYYYMMDD
                fecha_emision_str = fecha_emision.strftime("%Y%m%d")
                fecha_vencimiento_str = fecha_vencimiento.strftime("%Y%m%d")

                # Solicitar CAE
                cae, vto_cae = cliente_arca.solicitar_cae(
                    tipo_comprobante=tipo_comprobante,
                    punto_venta=int(punto_venta),
                    numero=int(numero_comprobante),
                    fecha_emision=fecha_emision_str,
                    importe_neto=importe_neto,
                    importe_iva=importe_iva,
                    importe_total=importe_total,
                    tipo_documento_cliente=tipo_documento,
                    numero_documento_cliente=numero_documento,
                    concepto=concepto,
                    moneda=moneda,
                    fecha_vto_pago=fecha_vencimiento_str,
                )

            st.success(f"✅ CAE obtenido: **{cae}**")

            # Generar PDF
            with st.spinner("Generando PDF..."):
                generador = GeneradorPDFFactura()
                pdf_path = generador.generar(
                    tipo_comprobante=tipo_comprobante,
                    numero=int(numero_comprobante),
                    punto_venta=int(punto_venta),
                    cuit_emisor=cuit_emisor,
                    razon_social_emisor=razon_social,
                    domicilio_emisor=domicilio,
                    cae=cae,
                    vencimiento_cae=vto_cae,
                    fecha_emision=fecha_emision_str,
                    tipo_documento_cliente=tipo_documento,
                    numero_documento_cliente=numero_documento,
                    razon_social_cliente=razon_social_cliente,
                    domicilio_cliente=domicilio_cliente,
                    items=items,
                    importe_neto=importe_neto,
                    importe_iva=importe_iva,
                    importe_total=importe_total,
                    moneda=moneda,
                    condicion_venta=condicion_venta,
                    observaciones=observaciones,
                )

            # Botón de descarga
            with open(pdf_path, "rb") as pdf_file:
                st.download_button(
                    label="📥 Descargar PDF",
                    data=pdf_file,
                    file_name=os.path.basename(pdf_path),
                    mime="application/pdf",
                    use_container_width=True,
                    type="secondary",
                )

            st.markdown(
                f"""
                <div class='box-exito'>
                <strong>✅ Factura generada exitosamente</strong><br>
                CAE: <strong>{cae}</strong><br>
                Vencimiento: <strong>{vto_cae}</strong><br>
                <small>Esta factura es válida según RG 5824 de AFIP</small>
                </div>
                """,
                unsafe_allow_html=True,
            )

        except Exception as e:
            st.markdown(
                f"""
                <div class='box-error'>
                <strong>❌ Error:</strong> {str(e)}
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.info("📋 Asegurate de:\n- Tener certificado AFIP en `certs/`\n- Estar en Homologación si estás probando\n- Verificar la conexión a internet")

with col_btn2:
    if st.button("🔄 Limpiar", use_container_width=True):
        st.rerun()

st.divider()

# === PIE DE PÁGINA ===
st.markdown(
    f"""
    ---
    <div style='text-align: center; color: #999; font-size: 0.9rem;'>
    <strong>{IDENTIDAD_UMSA['nombre_empresa']}</strong> - Soluciones técnicas para pymes argentinas<br>
    <a href='{IDENTIDAD_UMSA['url']}' target='_blank'>{IDENTIDAD_UMSA['url']}</a> |
    <a href='{IDENTIDAD_UMSA['url']}/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha' target='_blank'>Lee el artículo sobre RG 5824</a><br>
    <em>Licencia MIT - Código abierto</em>
    </div>
    """,
    unsafe_allow_html=True,
)
