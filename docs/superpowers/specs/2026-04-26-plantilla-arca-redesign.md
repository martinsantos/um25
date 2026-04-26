# Plantilla ARCA: Redesign Completo
**Fecha:** 2026-04-26  
**Alcance:** Página/formulario en ultimamilla + Repo GitHub + Noticia de blog  
**Status:** Design Specification

---

## Executive Summary

Rediseño completo del lanzamiento de Plantilla ARCA con 3 componentes:

1. **Página/formulario mejorada** en ultimamilla.com.ar con gestión de templates y envío por email
2. **Repo GitHub profesional** con documentación clara y ejemplos prácticos
3. **Noticia de blog optimizada** para conversión y SEO

Objetivo: Herramienta completa, accesible, profesional que cierre el loop: problema (RG 5824) → solución (Plantilla ARCA) → implementación.

---

## Componente 1: Página/Formulario en ultimamilla.com.ar

### Tech Stack

```
Frontend: Astro (componentes responsivos)
Backend: Python FastAPI (3 endpoints simples)
Almacenamiento: localStorage (sin BD)
PDF: ReportLab (existente)
Email: SMTP (configurado en .env)
```

### Arquitectura de Flujo

```
Usuario abre /plantilla-arca/
         ↓
[Sección 1: Mi Empresa]
  • CUIT, razón social, domicilio
  • Guardar como template (localStorage)
         ↓
[Sección 2: Nueva Factura]
  • Cargar template guardado (opcional)
  • Editar datos específicos
  • Elegir: CAE simulado o real
         ↓
[Opciones de salida]
  • Vista previa PDF
  • Descargar directamente
  • Enviar por email
         ↓
[Backend FastAPI]
  POST /api/arca/generate-pdf
  POST /api/arca/send-email
  POST /api/arca/get-cae
```

### Componentes Astro a Crear

| Componente | Responsabilidad | Entrada | Salida |
|-----------|-----------------|---------|--------|
| `FormularioARCA.astro` | Formulario responsivo con 2 secciones | — | datos del formulario + eventos |
| `TemplateManager.astro` | Selector de templates guardados, crear/eliminar | localStorage | template seleccionado |
| `LogoUpload.astro` | Carga de logo del cliente (opcional) | archivo imagen | logo_url o null |
| `PDFPreview.astro` | Preview del PDF antes de generar | datos del formulario + logo | vista previa interactiva |
| `EmailInput.astro` | Input de email + toggle envío | — | email destino |
| `ResultadoGeneracion.astro` | Muestra resultado: PDF descarga + estado email | pdf_url, email_sent | botones de acción |

### API Endpoints (FastAPI)

**1. Generar PDF**
```
POST /api/arca/generate-pdf
Request: {
  "cuit": "20123456789",
  "razon_social": "Mi Empresa",
  "domicilio": "Av. Corrientes 1234",
  "condicion_iva": "Responsable Inscripto",
  "tipo_comprobante": "Factura A",
  "fecha_emision": "2026-04-26",
  "descripcion": "Servicios de consultoría",
  "importe_total": 150000.0,
  "logo_url": "https://example.com/mi-logo.png" (opcional, null si no hay)
}
Response: {
  "ok": true,
  "pdf_url": "/tmp/factura_20260426_001.pdf",
  "cae": "71234567890123",
  "vencimiento_cae": "25/06/2026"
}
```

**2. Enviar Email**
```
POST /api/arca/send-email
Request: {
  "email_destino": "user@example.com",
  "pdf_path": "/tmp/factura_20260426_001.pdf",
  "empresa": "Mi Empresa"
}
Response: {
  "ok": true,
  "mensaje": "Email enviado a user@example.com"
}
```

**3. Obtener CAE Real**
```
POST /api/arca/get-cae
Request: {
  "cuit": "20123456789",
  "importe": 150000.0,
  "tipo_comprobante": "Factura A",
  "ambiente": "homologacion" | "produccion"
}
Response: {
  "ok": true,
  "cae": "71234567890123",
  "vencimiento": "25/06/2026",
  "numero_comprobante": "0001-00000001"
}
```

### Almacenamiento Local (localStorage)

Templates guardados en navegador:
```json
{
  "plantillas": [
    {
      "id": "miempresa-001",
      "nombre": "Mi Empresa",
      "cuit": "20123456789",
      "razon_social": "Mi Empresa S.A.",
      "domicilio": "Av. Corrientes 1234, CABA",
      "condicion_iva": "Responsable Inscripto",
      "logo_url": "data:image/png;base64,..." (opcional, imagen embebida o null),
      "fecha_creacion": "2026-04-26T10:30:00Z"
    }
  ]
}
```

### PDF Generado

**Diseño profesional (personalizable):**
- Logo del cliente/empresa (esquina superior) — opcional, si no hay logo, espacio vacío
- Datos de la empresa (emisor) — los que cargó el usuario
- Número de comprobante + CAE
- Detalle de servicios (tabla con descripción, cantidad, precio)
- Subtotal, IVA, Total
- QR del CAE (esquina inferior derecha)
- Footer con información regulatoria + URL de validación AFIP

**Configuración del PDF:**
- El usuario puede opcionalmente subir/cargar su logo en la interfaz
- Si no hay logo, se omite ese espacio
- El PDF es SUYO, no de Ultima Milla
- Colores/fuentes: profesionales pero genéricos (sin branding UM)

**Generado por:** `src/pdf/generator.py` (necesita pequeñas mejoras para soporte de logos custom)

### Flujo de Usuario Detallado

**Caso 1: Primera vez**
1. Usuario abre `/plantilla-arca/`
2. Completa "Mi Empresa" (CUIT, razón social, etc.)
3. Botón: "Guardar esta empresa como plantilla"
4. Completa "Nueva Factura" con detalles específicos
5. Elige CAE simulado/real
6. Click "Generar Factura"
7. Ve preview del PDF
8. Elige: Descargar o Enviar por email
9. Si email: ingresa `user@example.com`, click "Enviar"
10. Resultado: "PDF enviado a tu email + descargado en pantalla"

**Caso 2: Usuario que ya tiene plantilla guardada**
1. Abre `/plantilla-arca/`
2. Sección "Mi Empresa": desplegable con plantillas guardadas
3. Selecciona "Mi Empresa"
4. Datos se cargan automáticamente
5. Solo completa "Nueva Factura" con lo nuevo
6. Genera y envía

### Seguridad

- Email validation (regex simple)
- Rate limiting en endpoints (max 10 requests/min por IP)
- Certificados ARCA almacenados en servidor, NO en cliente
- PDF generados con timestamp único
- Sin persistencia de datos entre sesiones (localStorage del usuario es local)

---

## Componente 2: Repo GitHub Mejorado

### README.md Rediseñado

**Estructura:**
```
1. Hero/Title + badges
2. "¿Qué es?" (2-3 párrafos claros)
3. "Quick Start" (3 opciones: Docker, local, servidor)
4. "¿Por qué Plantilla ARCA?" (vs Tango, Bejerman, etc.)
5. Stack técnico (tabla)
6. Guía RG 5824 (contexto regulatorio)
7. Casos de uso (3-4 ejemplos reales)
8. FAQ (preguntas comunes)
9. Troubleshooting (errores frecuentes)
10. Licencia + links
```

**Secciones nuevas importantes:**

#### Quick Start (3 opciones claras)
```markdown
### Con Docker (Recomendado)
[instrucciones exactas]

### Sin Docker (Local)
[instrucciones exactas]

### En servidor VPS
[instrucciones exactas con Systemd + Nginx]
```

#### Contexto RG 5824
```markdown
## 📋 ¿Qué es RG 5824?

[Explicación clara de:
- Quién está obligado
- Qué cambió en 2026
- Qué es CAE
- Qué es ARCA]
```

#### Casos de Uso
```markdown
### Director que factura 3 veces al año
"No quería pagar $50/mes por un servicio que uso raramente"
→ Descarga, corre localmente, úsalo cuando necesites.

### Abogado con 20 clientes recurrentes
"Necesitaba algo simple, no Bejerman"
→ Configura puntos de venta, integra con tu sistema.

### Contador que asesora pymes
"Mis clientes ahora deben facturar. ¿Cómo les digo?"
→ Recomendales esta herramienta + asesorá la configuración.

### Startup que necesita flexibilidad
"Queremos customizar el PDF con nuestro branding"
→ Código es tuyo (MIT), modificalo como necesites.
```

#### FAQ
```markdown
## ❓ Preguntas Frecuentes

**P: ¿Es legal?**
R: Sí. Usamos los mismos Web Services que Tango, Bejerman. AFIP no prohibe que escribas tu propia herramienta.

**P: ¿Necesito certificado AFIP?**
R: Sí. Gratis pero tarda 3-5 días. [Link a cómo obtenerlo]

**P: ¿Funciona en Producción?**
R: Sí. Usa `ARCA_HOMOLOGACION=false` en .env.

**P: ¿Puedo tener dos empresas?**
R: Sí. Cada una configura su CUIT y certificado. Cero interferencia.

**P: ¿Qué pasa si AFIP cambia algo?**
R: La comunidad actualiza el código. Es open source.

**P: ¿Cuál es el catch? ¿Cómo monetizan?**
R: Ofrecemos consultoría, workshops, auditoría, integraciones custom. El código es gratis.
```

#### Troubleshooting
```markdown
## 🔧 Troubleshooting

**Error: "No se encontraron certificados"**
→ Asegúrate de tener certificado.crt y clave_privada.key en certs/

**Error: "Conexión a PostgreSQL fallida"**
→ Verifica que Docker está corriendo: `docker ps`

**Error: "CAE no válido"**
→ Los datos no cumplen RG 5824. Revisa el formato del CUIT, importe.

[... más errores comunes ...]
```

### Ejemplos de Código (Nueva carpeta `examples/`)

**1. `examples/cli-simple.py`** (50 líneas)
```python
"""Emitir factura desde línea de comandos"""
from src.arca.client import ArcaClient
from src.pdf.generator import GeneradorPDFFactura

# Configura tu CUIT y certificados en .env
cliente = ArcaClient()

# Solicita CAE
cae = cliente.solicitar_cae(
    tipo_comprobante="Factura A",
    importe_total=100000.0
)

# Genera PDF
generador = GeneradorPDFFactura()
pdf_path = generador.generar(cae=cae.cae, vencimiento=cae.vto)

print(f"✅ Factura generada: {pdf_path}")
```

**2. `examples/integracion-django.py`** (80 líneas)
```python
"""Integrar Plantilla ARCA en un Django app"""
# Cómo llamar a Plantilla ARCA desde un modelo Django
# Cómo guardar el resultado en la BD
```

**3. `examples/batch-csv.py`** (100 líneas)
```python
"""Procesar un CSV con múltiples facturas"""
import csv
from src.arca.client import ArcaClient

with open('facturas.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Genera factura para cada fila
```

**4. `examples/custom-pdf.py`** (120 líneas)
```python
"""Personalizar el template PDF"""
# Cómo cambiar colores, fonts, layout del PDF
# Cómo agregar logo custom
```

### Documentación (Nueva carpeta `docs/`)

**`docs/INSTALACION.md`**
- Local (Linux, macOS, Windows)
- Docker
- Servidor VPS (systemd + Nginx)
- Troubleshooting específico por plataforma

**`docs/API.md`**
- Todas las funciones Python documentadas
- Parámetros, tipos, ejemplos
- Excepciones posibles

**`docs/DESARROLLO.md`**
- Cómo contribuir
- Cómo hacer un PR
- Cómo correr tests localmente
- Cómo hacer un release

**`docs/RG-5824-EXPLICADO.md`**
- Guía técnica de RG 5824
- Qué es CAE, ARCA, Web Services
- Flujo de emisión de facturas

### Mejoras a `README.md` existente

- Agregar tabla de contenidos
- Mejorar badges (agregar "Python 3.10+", "PostgreSQL 15", links a versiones)
- Agregar "demo online" → link a ultimamilla.com.ar/plantilla-arca/
- Agregar sección "Contribuidores"
- Agregar "Roadmap" claro para futuras versiones

---

## Componente 3: Noticia de Blog Optimizada

### Objetivo

Noticia que RANKEE bien en Google (SEO) Y convierta usuarios a probar la herramienta (conversión).

### Estructura Mejorada

#### 1. Headline + Meta (SEO)
```
Title: "Plantilla ARCA: Facturación Electrónica Gratis con RG 5824 (Open Source)"
Meta Description: "Herramienta gratuita (MIT) para generar facturas electrónicas según RG 5824 de AFIP. Sin licencias, sin Tango, sin Bejerman. Probá ahora."
Keywords: RG 5824, ARCA, factura electrónica, open source, AFIP, Argentina
```

#### 2. Hook inicial (Conversión)
```markdown
Anécdota de usuario real:
"Me costaba $500/mes en Tango solo por emitir 4 facturas al año. 
No podía ser tan difícil. Hoy, factura gratis."
```

#### 3. Secciones principales

**Sección 1: "El Problema: RG 5824 te atrapó"**
- Qué es RG 5824 (breve)
- Quién está obligado
- Por qué es un problema (herramientas caras, vendor lock-in)
- Pain point: "¿Cómo conecto a ARCA sin pagar $500/mes?"

**Sección 2: "La Solución: Plantilla ARCA"**
- Qué es (1 párrafo claro)
- Qué hace (bullets: CAE automático, PDF, QR, etc.)
- Por qué es diferente (open source, sin vendor lock-in, personalizable)
- **CTA #1:** "Probá la herramienta online →"

**Sección 3: "Cómo Funciona (Técnico)"**
- Stack: Python, PostgreSQL, ReportLab
- Arquitectura simplificada (diagrama ASCII)
- Por qué elegimos cada tecnología
- Seguridad: certificados, no almacenamos datos

**Sección 4: "Casos de Uso Específicos"**
```markdown
### Director que factura esporádicamente
"Emití 3 facturas al año, no quería pagar $50/mes"
→ Descarga, usa 2 veces, listo. Sin suscripción.

### Abogado con múltiples clientes
"Tengo 20 clientes recurrentes. Quería algo simple."
→ Configura puntos de venta, genera en batch.

### Contador que asesora pymes
"Mis clientes ahora deben facturar. ¿Qué les recomiendo?"
→ Esta herramienta + tu asesoramiento = ROI.

### Startup que necesita flexibilidad
"Queremos customizar el PDF, integrar con nuestro ERP"
→ Código es tuyo (MIT), modificalo como necesites.
```

**Sección 5: "Preguntas Frecuentes"**
- ¿Es legal?
- ¿Necesito certificado?
- ¿Funciona en Producción?
- ¿Cuál es el catch?

**Sección 6: "Roadmap"**
- Notas de crédito/débito (próximamente)
- API REST
- Dashboard de auditoría
- Integraciones (Mercado Pago, MercadoLibre)

#### 4. CTAs Distribuidos
```
CTA #1 (después de "la solución"): 
"Probá la herramienta online →" → /plantilla-arca/

CTA #2 (después de "cómo funciona"):
"Descargá desde GitHub →" → https://github.com/UltimaMilla/plantilla-arca

CTA #3 (después de FAQs):
"Empezá en 5 minutos" → /plantilla-arca/ + docker-compose up

CTA #4 (final):
"Tenés dudas? Escribinos →" → hola@ultimamilla.com.ar
```

#### 5. Cierre + Social Proof
```markdown
## Reflexión Final

Hace 3 años escribimos sobre integraciones AFIP.
Hace 1 año escribimos sobre RG 5824.
Hoy entregamos la herramienta.

**Eso es consistencia.** No solo hablamos de problemas, los resolvemos.

Si esto te ahorra $500/mes, o te permite facturar sin stress, 
o simplemente te muestra que **sí se puede hacer mejor**: 
nuestro objetivo está cumplido.

La comunidad mantiene esto vivo. Contribuye, mejora, adapta.
```

### Meta Tags Completos
```html
<title>Plantilla ARCA: Facturación Electrónica Gratis | RG 5824 | Ultima Milla</title>
<meta name="description" content="Herramienta open source (MIT) para generar facturas electrónicas según RG 5824. Sin Tango, sin Bejerman. Probá gratis en 5 minutos.">
<meta name="keywords" content="RG 5824, ARCA, factura electrónica, open source, AFIP, Argentina, facturación">
<meta property="og:title" content="Plantilla ARCA: Solución Open Source para RG 5824">
<meta property="og:description" content="Genera facturas electrónicas gratis. Sin licencias, sin vendor lock-in.">
<meta property="og:image" content="[screenshot de la herramienta]">
```

### Estructura de Markdown
```
# Título Principal
[Hero section con hook emocional]

## El Problema
[Contexto + dolor]

## La Solución  
[Qué es + qué hace]
**[CTA #1: Probá ahora]**

## Cómo Funciona
[Técnico]

## Casos de Uso
[4 ejemplos específicos]

## FAQ
[Preguntas comunes]

## Roadmap
[Qué viene]

## Reflexión Final
[Cierre emocional]

**[CTA #4: Contacto]**
```

### SEO Specifics
- H1: Una sola vez (título principal)
- H2: Secciones principales
- H3: Subsecciones y casos de uso
- Internal links: artículo anterior sobre RG 5824, documentación GitHub
- External links: AFIP oficial, arca_arg librería
- Palabras clave: distribuidas naturalmente en H2, primeros párrafos
- URL: `/blog/plantilla-arca-facturacion-rg-5824/` (slug SEO-friendly)

---

## Integración de los 3 Componentes

**Flujo de usuario completo:**

1. Usuario ve noticia en blog / búsqueda Google
2. Lee y hace click en "Probá ahora"
3. Llega a `/plantilla-arca/` (página mejorada)
4. Prueba el formulario, genera un PDF
5. Si le gusta: descarga el código desde GitHub
6. Lee el README bien documentado + ejemplos
7. Instala localmente / en servidor propio
8. Si tiene dudas, ve la noticia nuevamente (está linkeada)

**Cross-linking:**
- Noticia → `/plantilla-arca/` (demo online)
- Noticia → GitHub (descargar)
- Página formulario → Noticia (entender RG 5824)
- Página formulario → GitHub (instalación local)
- README → Noticia (contexto)
- README → `/plantilla-arca/` (demo online)

---

## Definición de Éxito

**Página/Formulario:**
- ✅ Formulario funcional, responsivo, rápido
- ✅ Templates guardados en localStorage (funcional)
- ✅ PDF generado profesionalmente
- ✅ Email enviado correctamente
- ✅ UX clara (usuario completa en <5 min)

**Repo GitHub:**
- ✅ README es referencia (claro, completo, profesional)
- ✅ Ejemplos de código son copy/paste ready
- ✅ Documentación completa (instalación, API, desarrollo)
- ✅ FAQ resuelve 90% de preguntas

**Noticia:**
- ✅ Rankea en primera página de Google para "RG 5824 open source"
- ✅ CTA conversion: 15%+ de lectores hacen click en "Probá ahora"
- ✅ Bien escrita, clara, técnica pero accesible
- ✅ Links internos y externos estratégicos

---

## Próximos Pasos

1. Escribir implementation plan (writing-plans skill)
2. Implementar en orden: página → repo → noticia
3. Testing + review
4. Launch coordinado

