"""FastAPI application for ARCA/AFIP integration endpoints."""
import base64
import logging
import os
from datetime import datetime, timedelta, timezone

import aiofiles
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)

app = FastAPI(title="Plantilla ARCA API", version="1.0.0")
router = APIRouter()


# ─── Auth endpoint ────────────────────────────────────────────────────

class ClaveFiscalAuthRequest(BaseModel):
    method: str = "clave_fiscal"
    cuit: str
    clave_fiscal: str


@router.post("/auth/afip")
async def auth_afip_clave_fiscal(body: ClaveFiscalAuthRequest):
    """Authenticate against AFIP using CUIT + Clave Fiscal."""
    try:
        from arca.auth import WSAA

        wsaa = WSAA(cuit=body.cuit, password=body.clave_fiscal)
        ta = wsaa.authenticate()

        return {
            "status": "ok",
            "token": base64.b64encode(ta.encode()).decode(),
            "expiry": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AFIP auth failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/auth/afip")
async def auth_afip_certificate(
    cert: UploadFile = File(...),
    key: UploadFile = File(...),
    passphrase: str = Form(""),
):
    """Authenticate against AFIP using digital certificate."""
    try:
        cert_data = await cert.read()
        key_data = await key.read()

        from arca.auth import WSAA

        wsaa = WSAA(cert=cert_data, key=key_data, passphrase=passphrase)
        ta = wsaa.authenticate()

        return {
            "status": "ok",
            "token": base64.b64encode(ta.encode()).decode(),
            "expiry": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Certificate auth failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))


# ─── CAE endpoint ─────────────────────────────────────────────────────

class FacturarRequest(BaseModel):
    cuit: str
    razon_social: str
    domicilio: str
    condicion_iva: str
    tipo_comprobante: str
    fecha_emision: str
    descripcion: str
    importe_total: float
    token: str | None = None
    logo_url: str | None = None


@router.post("/facturar/cae")
async def facturar_cae(req: FacturarRequest):
    """Generate a real CAE via ARCA WSMTXCA web service."""
    try:
        from arca.client import ArcaClient
        from arca.pdf import generar_pdf

        if not req.token:
            raise HTTPException(status_code=401, detail="No hay sesion activa de AFIP")

        ta_xml = base64.b64decode(req.token).decode()
        client = ArcaClient(ta=ta_xml)

        cae_result = client.solicitar_cae(
            cuit=req.cuit,
            tipo_comprobante=req.tipo_comprobante,
            fecha_emision=req.fecha_emision,
            importe_total=req.importe_total,
            descripcion=req.descripcion,
        )

        pdf_data = generar_pdf(
            cuit=req.cuit,
            razon_social=req.razon_social,
            domicilio=req.domicilio,
            condicion_iva=req.condicion_iva,
            tipo_comprobante=req.tipo_comprobante,
            fecha_emision=req.fecha_emision,
            descripcion=req.descripcion,
            importe_total=req.importe_total,
            cae=cae_result["cae"],
            vencimiento=cae_result["vencimiento"],
            logo_url=req.logo_url,
        )

        pdf_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            ))),
            "public", "pdf"
        )
        os.makedirs(pdf_dir, exist_ok=True)

        pdf_filename = f"factura_{cae_result['cae']}.pdf"
        pdf_path = os.path.join(pdf_dir, pdf_filename)

        async with aiofiles.open(pdf_path, "wb") as f:
            await f.write(pdf_data)

        return {
            "status": "ok",
            "cae": cae_result["cae"],
            "vencimiento": cae_result["vencimiento"],
            "comprobante_numero": cae_result.get("comprobante_numero", ""),
            "pdf_url": f"/pdf/{pdf_filename}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CAE generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al generar CAE: {str(e)}")


# ─── Register routes ──────────────────────────────────────────────────

app.include_router(router, prefix="/plantilla-arca/api")


# ─── Health check ─────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
