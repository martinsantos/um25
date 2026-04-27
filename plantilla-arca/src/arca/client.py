"""ARCA WSMTXCA client for electronic invoice CAE generation."""
import logging
import random
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


class ArcaClient:
    """Client for ARCA WSMTXCA web service."""

    def __init__(self, ta: str):
        self.ta = ta
        self._token = self._parse_token()

    def _parse_token(self) -> str:
        try:
            root = ET.fromstring(self.ta)
            token_el = root.find("token")
            return token_el.text if token_el is not None else ""
        except ET.ParseError:
            return ""

    def solicitar_cae(self, cuit: str, tipo_comprobante: str,
                      fecha_emision: str, importe_total: float,
                      descripcion: str) -> dict:
        """
        Request a CAE from ARCA WSMTXCA.

        In production this calls the SOAP service.
        For development, returns simulated CAE data.
        """
        try:
            from arca_arg.wsmtxca import WSMTXCA
            client = WSMTXCA(ta=self.ta)
            return client.solicitar_cae(
                cuit=cuit,
                tipo_comprobante=tipo_comprobante,
                fecha_emision=fecha_emision,
                importe_total=importe_total,
                descripcion=descripcion,
            )
        except ImportError:
            logger.info("arca_arg not installed — returning simulated CAE")
            return self._simular_cae(cuit, tipo_comprobante, fecha_emision, importe_total)

    def _simular_cae(self, cuit: str, tipo_comprobante: str,
                     fecha_emision: str, importe_total: float) -> dict:
        """Generate simulated CAE for development/testing."""
        cae_digits = "".join([str(random.randint(0, 9)) for _ in range(14)])
        cae = f"6042345678{cae_digits[:4]}"

        vencimiento = (
            datetime.now(timezone.utc).replace(hour=23, minute=59, second=0)
            + timedelta(days=30)
        ).strftime("%d/%m/%Y")

        comprobante_num = f"0001-000000{random.randint(10000, 99999)}"

        return {
            "cae": cae,
            "vencimiento": vencimiento,
            "comprobante_numero": comprobante_num,
            "resultado": "A",
            "observaciones": "SIMULACION — sin validez fiscal",
        }
