"""WSAA authentication for ARCA/AFIP web services."""
import base64
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


class WSAA:
    """WSAA authentication — requests a Ticket de Acceso (TA) from AFIP."""

    def __init__(self, cuit: str | None = None, password: str | None = None,
                 cert: bytes | None = None, key: bytes | None = None,
                 passphrase: str = ""):
        self.cuit = cuit
        self.password = password
        self.cert = cert
        self.key = key
        self.passphrase = passphrase

    def authenticate(self) -> str:
        """
        Authenticate and return Ticket de Acceso (TA) as XML string.

        In production this calls AFIP's WSAA SOAP service.
        For development, returns a simulated TA.
        """
        try:
            from arca_arg.wsaa import WSAA as RealWSAA
            impl = RealWSAA(cuit=self.cuit, password=self.password,
                            cert=self.cert, key=self.key,
                            passphrase=self.passphrase)
            return impl.authenticate()
        except ImportError:
            logger.info("arca_arg not installed — using simulated WSAA")
            return self._simulate_ta()

    def _simulate_ta(self) -> str:
        """Generate a simulated Ticket de Acceso for development."""
        now = datetime.now(timezone.utc)
        exp = now + timedelta(hours=12)

        ta = ET.Element("ticket_acceso")
        ET.SubElement(ta, "cuit").text = self.cuit or "20123456789"
        ET.SubElement(ta, "generated").text = now.isoformat()
        ET.SubElement(ta, "expires").text = exp.isoformat()
        ET.SubElement(ta, "service").text = "wsmtxca"
        ET.SubElement(ta, "token").text = base64.b64encode(
            f"sim_{self.cuit or 'unknown'}_{int(now.timestamp())}".encode()
        ).decode()
        ET.SubElement(ta, "sign").text = base64.b64encode(b"sim_signature").decode()

        return ET.tostring(ta, encoding="unicode")
