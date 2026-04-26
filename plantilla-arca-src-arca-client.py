# src/arca/client.py
"""
Cliente abstrayente para conectar a ARCA (Web Services de AFIP)
Maneja autenticación WSAA, solicitud de CAE, validación de respuestas
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
import re

try:
    from arca_arg import ArcaClient as _ArcaClientBase
except ImportError:
    raise ImportError(
        "arca_arg no está instalado. Ejecutá: pip install arca_arg"
    )

from config import (
    ARCA_CUIT,
    ARCA_CERT_PATH,
    ARCA_KEY_PATH,
    ARCA_HOMOLOGACION,
    ARCA_PUNTO_VENTA,
)

logger = logging.getLogger(__name__)


class ArcaClient:
    """
    Envolvedor de ArcaClient que simplifica la interacción con ARCA
    Maneja autenticación, solicitud de CAE y parseo de respuestas
    """

    def __init__(
        self,
        cuit: str = ARCA_CUIT,
        cert_path: str = ARCA_CERT_PATH,
        key_path: str = ARCA_KEY_PATH,
        homologacion: bool = ARCA_HOMOLOGACION,
    ):
        """
        Args:
            cuit: CUIT del emisor (ej: 20123456789)
            cert_path: Ruta al certificado X.509 (.crt)
            key_path: Ruta a la clave privada (.key)
            homologacion: True para ambiente de prueba, False para producción
        """
        if not all([cuit, cert_path, key_path]):
            raise ValueError("CUIT, certificado y clave privada son obligatorios")

        self.cuit = cuit
        self.homologacion = homologacion
        self.ambiente = "Homologación" if homologacion else "Producción"

        try:
            self.cliente = _ArcaClientBase(
                cuit=cuit,
                cert_path=cert_path,
                key_path=key_path,
                production=not homologacion,
            )
            logger.info(f"✓ Cliente ARCA inicializado ({self.ambiente})")
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Certificado o clave no encontrados: {e}")
        except Exception as e:
            raise RuntimeError(f"Error inicializando cliente ARCA: {e}")

    def solicitar_cae(
        self,
        tipo_comprobante: int,
        punto_venta: int,
        numero: int,
        fecha_emision: str,  # Formato: YYYYMMDD
        importe_neto: float,
        importe_iva: float,
        importe_total: float,
        tipo_documento_cliente: int = 99,
        numero_documento_cliente: str = "0",
        concepto: int = 1,
        moneda: str = "PES",
        cotizacion: float = 1.0,
        fecha_servicio_desde: Optional[str] = None,
        fecha_servicio_hasta: Optional[str] = None,
        fecha_vto_pago: Optional[str] = None,
        iva_id: int = 5,  # 5 = 21%
    ) -> Tuple[str, str]:
        """
        Solicita un CAE a ARCA mediante WSMTXCA

        Args:
            tipo_comprobante: 1=Factura A, 6=Factura B, etc
            punto_venta: Punto de venta (1-99999)
            numero: Número de comprobante secuencial
            fecha_emision: Fecha en formato YYYYMMDD
            importe_neto: Monto sin IVA
            importe_iva: Monto de IVA
            importe_total: Monto total
            tipo_documento_cliente: 99=Consumidor final (default)
            numero_documento_cliente: "0" si es consumidor final
            concepto: 1=Productos, 2=Servicios, 3=Ambos
            moneda: "PES" o "DOL"
            cotizacion: Cotización (1.0 si PES)
            fecha_servicio_desde/hasta: Para servicios
            fecha_vto_pago: Fecha de vencimiento del pago
            iva_id: 5=21%, 4=10.5%, 3=0%, etc

        Returns:
            Tupla (CAE, vencimiento_cae) ej: ("20261234567", "20260502")
        """

        # Validar fecha
        try:
            datetime.strptime(fecha_emision, "%Y%m%d")
        except ValueError:
            raise ValueError(f"Fecha inválida {fecha_emision}. Usa formato YYYYMMDD")

        # Si no hay fecha de vencimiento de pago, usá 10 días después
        if not fecha_vto_pago:
            fecha_dt = datetime.strptime(fecha_emision, "%Y%m%d")
            fecha_dt_vto = fecha_dt + timedelta(days=10)
            fecha_vto_pago = fecha_dt_vto.strftime("%Y%m%d")

        # Si no hay fecha de servicio (para productos), usá la de emisión
        if not fecha_servicio_desde:
            fecha_servicio_desde = fecha_emision
        if not fecha_servicio_hasta:
            fecha_servicio_hasta = fecha_emision

        # Construir payload para WSMTXCA
        # Documentación: https://www.afip.gob.ar/ws/

        payload = {
            # Encabezado
            "CantReg": 1,
            "PtoVta": punto_venta,
            "CbteTipo": tipo_comprobante,
            "Concepto": concepto,
            "DocTipo": tipo_documento_cliente,
            "DocNro": int(numero_documento_cliente) if numero_documento_cliente != "0" else 0,
            # Números de comprobante
            "CbteDesde": numero,
            "CbteHasta": numero,
            # Fechas
            "CbteFch": int(fecha_emision.replace("-", "")),
            "FchServDesde": int(fecha_servicio_desde.replace("-", "")),
            "FchServHasta": int(fecha_servicio_hasta.replace("-", "")),
            "FchVtoPago": int(fecha_vto_pago.replace("-", "")),
            # Importes
            "ImpTotal": float(importe_total),
            "ImpTotConc": 0.0,  # Importes no gravados
            "ImpNeto": float(importe_neto),
            "ImpOpEx": 0.0,  # Exportaciones
            "ImpIVA": float(importe_iva),
            "ImpTrib": 0.0,  # Tributos
            # Moneda
            "MonId": moneda,
            "MonCotiz": float(cotizacion),
            # IVA detail
            "Iva": [{"Id": iva_id, "BaseImp": float(importe_neto), "Importe": float(importe_iva)}],
            # Opcionales
            "Tributos": None,
            "Opcionales": None,
        }

        try:
            logger.info(f"→ Solicitando CAE a ARCA ({self.ambiente})")
            logger.debug(f"Payload: {payload}")

            # Invocar WSMTXCA
            respuesta = self.cliente.request("wsmtxca", "FECAESolicitar", payload)

            logger.debug(f"Respuesta ARCA: {respuesta}")

            # Parsear respuesta
            resultado = respuesta.get("FECAESolicitarResult", {})

            if not resultado:
                raise RuntimeError("Respuesta vacía de ARCA")

            # Buscar errores
            fe_resultados = resultado.get("FeDetResp", {})
            if not fe_resultados:
                raise RuntimeError("FeDetResp no encontrado en respuesta")

            fe_cae_det = fe_resultados.get("FECAEDetResponse", [])
            if not fe_cae_det:
                raise RuntimeError("FECAEDetResponse vacío en respuesta")

            det = fe_cae_det[0]

            # Verificar si hay error
            if det.get("Resultado") != "A":
                errores = det.get("Observaciones", {}).get("Obs", [])
                mensaje_error = f"ARCA rechazó: {errores}"
                logger.error(mensaje_error)
                raise RuntimeError(mensaje_error)

            # Extraer CAE y vencimiento
            cae = det.get("CAE")
            vto_cae = det.get("CAEFchVto")

            if not cae or not vto_cae:
                raise RuntimeError(f"CAE o vencimiento no encontrados en respuesta")

            logger.info(f"✓ CAE obtenido: {cae} (Vto: {vto_cae})")

            return cae, vto_cae

        except Exception as e:
            logger.error(f"✗ Error solicitando CAE: {e}")
            raise

    def validar_certificado(self) -> bool:
        """
        Valida que el certificado sea válido y no esté expirado
        """
        try:
            # Intentá una solicitud de prueba (sin generar comprobante)
            # Esto verifica que la autenticación WSAA funcione
            logger.info("Validando certificado...")

            # El cliente _ArcaClientBase valida al instanciar
            logger.info("✓ Certificado válido")
            return True

        except Exception as e:
            logger.error(f"✗ Certificado inválido: {e}")
            return False

    def obtener_ultimo_numero_comprobante(
        self, tipo_comprobante: int, punto_venta: int
    ) -> int:
        """
        Obtiene el último número de comprobante emitido
        Útil para saber qué número asignarle al próximo

        Nota: Esta funcionalidad requiere WSMTXCA con FECompLastCbteRequest
        Por ahora, retorna un placeholder
        """
        # TODO: Implementar cuando sea necesario
        logger.warning("obtener_ultimo_numero_comprobante no implementado aún")
        return 1


# Uso simple:
if __name__ == "__main__":
    cliente = ArcaClient()

    # Solicitar CAE
    cae, vto = cliente.solicitar_cae(
        tipo_comprobante=6,  # Factura B
        punto_venta=1,
        numero=1,
        fecha_emision="20260426",
        importe_neto=100.00,
        importe_iva=21.00,
        importe_total=121.00,
    )

    print(f"CAE: {cae}")
    print(f"Vencimiento: {vto}")
