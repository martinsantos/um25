# src/models.py
"""
Modelos SQLAlchemy para almacenar comprobantes
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Boolean, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from config import DATABASE_URL

Base = declarative_base()

class Comprobante(Base):
    """
    Tabla principal: comprobantes emitidos
    Registra facturas, notas de débito, notas de crédito
    """
    __tablename__ = "comprobantes"

    # Identificadores
    id = Column(Integer, primary_key=True, index=True)

    # Datos del emisor
    cuit_emisor = Column(String(11), nullable=False, index=True)

    # Tipo de comprobante
    tipo_comprobante = Column(Integer, nullable=False)  # 1=Factura A, 6=Factura B, etc
    punto_venta = Column(Integer, nullable=False)
    numero_comprobante = Column(Integer, nullable=False, index=True)

    # CAE (Centro de Autenticación de AFIP)
    cae = Column(String(14), nullable=False, unique=True, index=True)
    vencimiento_cae = Column(Date, nullable=False)

    # Datos del cliente
    tipo_documento_cliente = Column(Integer, nullable=False)  # 99=Consumidor final, 80=CUIT, etc
    numero_documento_cliente = Column(String(20), nullable=True)  # Opcional si es consumidor final
    razon_social_cliente = Column(String(255), nullable=True)
    domicilio_cliente = Column(String(255), nullable=True)

    # Moneda y valores
    moneda = Column(String(3), default="PES")
    cotizacion = Column(Float, default=1.0)

    # Totales
    importe_neto = Column(Float, nullable=False)
    importe_iva = Column(Float, default=0.0)
    importe_tributos = Column(Float, default=0.0)
    importe_total = Column(Float, nullable=False)

    # Fechas
    fecha_emision = Column(Date, nullable=False, index=True)
    fecha_vencimiento_pago = Column(Date, nullable=True)
    fecha_servicio_desde = Column(Date, nullable=True)  # Para servicios
    fecha_servicio_hasta = Column(Date, nullable=True)

    # Metadatos
    concepto = Column(Integer, default=1)  # 1=Productos, 2=Servicios, 3=Ambos
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Auditoría
    respuesta_arca_json = Column(Text, nullable=True)  # JSON raw de ARCA
    estado = Column(String(20), default="emitido")  # emitido, anulado, revisado
    notas = Column(Text, nullable=True)

    # Relación con ítems
    items = relationship("ComprobanteItem", back_populates="comprobante", cascade="all, delete-orphan")
    impuestos = relationship("ComprobanteImpuesto", back_populates="comprobante", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Comprobante {self.tipo_comprobante}/{self.punto_venta}/{self.numero_comprobante} CAE:{self.cae}>"


class ComprobanteItem(Base):
    """
    Tabla de detalle: ítems/renglones del comprobante
    """
    __tablename__ = "comprobante_items"

    id = Column(Integer, primary_key=True, index=True)
    comprobante_id = Column(Integer, ForeignKey("comprobantes.id"), nullable=False)

    # Descripción del item
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Float, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    # Subtotal y bonificación
    subtotal = Column(Float, nullable=False)
    porcentaje_bonificacion = Column(Float, default=0.0)
    monto_bonificacion = Column(Float, default=0.0)
    subtotal_con_bonif = Column(Float, nullable=False)

    # Alícuota de IVA
    alicuota_iva = Column(Integer, default=5)  # 5=21%, 4=10.5%, etc
    monto_iva = Column(Float, default=0.0)

    # Total del item
    total = Column(Float, nullable=False)

    comprobante = relationship("Comprobante", back_populates="items")

    def __repr__(self):
        return f"<Item {self.descripcion}: {self.cantidad}x${self.precio_unitario}>"


class ComprobanteImpuesto(Base):
    """
    Tabla de impuestos/tributos del comprobante
    """
    __tablename__ = "comprobante_impuestos"

    id = Column(Integer, primary_key=True, index=True)
    comprobante_id = Column(Integer, ForeignKey("comprobantes.id"), nullable=False)

    tipo_impuesto = Column(Integer, nullable=False)  # Código de tributo AFIP
    descripcion = Column(String(255), nullable=False)
    alicuota = Column(Float, default=0.0)
    base_imponible = Column(Float, nullable=False)
    monto = Column(Float, nullable=False)

    comprobante = relationship("Comprobante", back_populates="impuestos")

    def __repr__(self):
        return f"<Impuesto {self.descripcion}: ${self.monto}>"


class AuditLog(Base):
    """
    Tabla de auditoría: registra todas las acciones críticas
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Tipo de acción
    accion = Column(String(50), nullable=False)  # solicitar_cae, generar_pdf, anular, etc

    # Contexto
    comprobante_id = Column(Integer, nullable=True)
    usuario = Column(String(255), nullable=True)
    ip_origen = Column(String(45), nullable=True)

    # Detalles
    descripcion = Column(Text)
    resultado = Column(String(20))  # exito, error, advertencia
    error_mensaje = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.accion} {self.resultado} @ {self.timestamp}>"


# Crear todas las tablas
def init_db():
    """Inicializa la base de datos"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✓ Base de datos inicializada")


if __name__ == "__main__":
    init_db()
