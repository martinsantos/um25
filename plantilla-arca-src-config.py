# src/config.py
"""
Configuración centralizada para la aplicación ARCA
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

# DATABASE
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://arca_user:arca_password_dev@localhost:5432/arca_facturas"
)

# ARCA Configuration
ARCA_CUIT = os.getenv("ARCA_CUIT")
ARCA_HOMOLOGACION = os.getenv("ARCA_HOMOLOGACION", "true").lower() == "true"
ARCA_CERT_PATH = os.getenv("ARCA_CERT_PATH", "certs/certificado.crt")
ARCA_KEY_PATH = os.getenv("ARCA_KEY_PATH", "certs/clave_privada.key")
ARCA_PUNTO_VENTA = int(os.getenv("ARCA_PUNTO_VENTA", "1"))

# ARCA Web Services URLs
ARCA_URLS = {
    "homologacion": {
        "wsaa": "https://wsaahomo.afip.gov.ar/ws/services/LoginCMS",
        "wsmtxca": "https://wswhomo.afip.gov.ar/ws/services/wsmtxca",
    },
    "produccion": {
        "wsaa": "https://wsaa.afip.gov.ar/ws/services/LoginCMS",
        "wsmtxca": "https://ws.afip.gov.ar/ws/services/wsmtxca",
    },
}

ARCA_ENVIRONMENT = "homologacion" if ARCA_HOMOLOGACION else "produccion"

# Paths
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./output")
CERTS_DIR = os.getenv("CERTS_DIR", "./certs")

# Database Engine
engine = create_engine(DATABASE_URL, echo=False)

# Constantes de AFIP
TIPO_COMPROBANTE = {
    1: "Factura A",
    2: "Nota de Débito A",
    3: "Nota de Crédito A",
    6: "Factura B",
    7: "Nota de Débito B",
    8: "Nota de Crédito B",
    11: "Factura C",
    12: "Nota de Débito C",
    13: "Nota de Crédito C",
}

TIPO_DOCUMENTO = {
    80: "CUIT",
    86: "CUIL",
    96: "DNI",
    89: "Libreta Cívica",
    90: "Libreta de Enrolamiento",
    92: "En Trámite",
    99: "Consumidor Final",
}

TIPO_IVA = {
    3: "IVA 0%",
    4: "IVA 10.5%",
    5: "IVA 21%",
    6: "IVA 27%",
    8: "Exento",
    9: "No Categorizado",
}

MONEDA = {
    "PES": "Pesos Argentinos",
    "DOL": "Dólares",
    "EUR": "Euros",
}

# Identidad UMSA
IDENTIDAD_UMSA = {
    "nombre_empresa": "Ultima Milla",
    "url": "https://ultimamilla.com.ar",
    "color_primario": "#DC2626",  # Rojo
    "color_secundario": "#1A56C0",  # Azul
    "color_fondo": "#F5F5F5",  # Gris claro
    "tipografia": "Poppins",  # Google Fonts
}

# Validaciones RG 5824
VALIDACIONES_RG5824 = {
    "importe_minimo": 1.00,
    "importe_maximo": 99999999.99,
    "max_items": 250,
    "concepto_minimo": 1,
    "concepto_maximo": 3,
}
