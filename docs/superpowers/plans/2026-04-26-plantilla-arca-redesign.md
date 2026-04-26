# Plantilla ARCA: Redesign Completo - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar rediseño completo de Plantilla ARCA con interfaz mejorada en Astro, API FastAPI para generación de PDFs, documentación profesional en repo GitHub, y noticia de blog optimizada para conversión y SEO.

**Architecture:** 
- Frontend (Astro): Página `/plantilla-arca/` con formulario interactivo, gestión de templates en localStorage, preview de PDF
- Backend (FastAPI): 3 endpoints para generar PDF, enviar email, obtener CAE desde ARCA
- Documentación: README completo, guías, ejemplos, FAQ
- Blog: Noticia reescrita con estructura optimizada para conversión y SEO

**Tech Stack:** Astro 5.7.4, FastAPI, Python 3.10+, ReportLab, SMTP, localStorage, TDD

---

## Estructura del Plan (Resumen)

**Fase 1 — Página/Formulario + API (5 tasks, ~40 commits)**
- Componentes Astro (FormularioARCA, TemplateManager, LogoUpload, PDFPreview, EmailInput, ResultadoGeneracion)
- API FastAPI con 3 endpoints (generate-pdf, send-email, get-cae)
- Testing e integración

**Fase 2 — Repo GitHub Mejorado (4 tasks, ~10 commits)**
- README completo y profesional
- Documentación (4 archivos Markdown)
- Ejemplos de código (4 scripts Python)
- Mejoras a estructura repo

**Fase 3 — Noticia Blog Optimizada (1 task, ~1 commit)**
- Reescritura completa con SEO + copywriting
- Casos de uso específicos
- CTAs estratégicos

---

## File Structure Overview

### Fase 1: Página/Formulario + API

**Nuevos archivos (Astro frontend):**
```
src/pages/plantilla-arca.astro
src/components/arca/FormularioARCA.astro
src/components/arca/TemplateManager.astro
src/components/arca/LogoUpload.astro
src/components/arca/PDFPreview.astro
src/components/arca/EmailInput.astro
src/components/arca/ResultadoGeneracion.astro
src/lib/arca-client.ts
tests/components/arca/formulario.test.ts
```

**Nuevos archivos (FastAPI backend):**
```
plantilla-arca/src/web/fastapi_app.py
plantilla-arca/tests/test_api_endpoints.py
```

**Modificados:**
```
plantilla-arca/src/pdf/generator.py
plantilla-arca/requirements.txt
```

### Fase 2 & 3: Documentación y Blog

```
plantilla-arca/README.md (reescritura)
plantilla-arca/docs/INSTALACION.md (nuevo)
plantilla-arca/docs/API.md (nuevo)
plantilla-arca/docs/DESARROLLO.md (nuevo)
plantilla-arca/docs/RG-5824-EXPLICADO.md (nuevo)
plantilla-arca/examples/cli-simple.py (nuevo)
plantilla-arca/examples/integracion-django.py (nuevo)
plantilla-arca/examples/batch-csv.py (nuevo)
plantilla-arca/examples/custom-pdf.py (nuevo)
NOTA-BLOG-PLANTILLA-ARCA.md (reescritura)
```

---

# FASE 1: Página/Formulario + API FastAPI

## Task 1: Crear componentes Astro base

**Componentes a crear:** FormularioARCA, TemplateManager, LogoUpload, PDFPreview, EmailInput, ResultadoGeneracion

- [ ] **Step 1: Crear FormularioARCA.astro**

Ver spec — implementar formulario responsivo con 2 secciones (Mi Empresa, Nueva Factura)

- [ ] **Step 2: Crear TemplateManager.astro**

Gestión de templates en localStorage con botones (Guardar, Cargar, Eliminar)

- [ ] **Step 3: Crear LogoUpload.astro**

Input de archivo para logo, preview, y almacenamiento en window.currentLogoUrl

- [ ] **Step 4: Crear PDFPreview.astro**

Modal para mostrar preview del PDF antes de generar

- [ ] **Step 5: Crear EmailInput.astro**

Toggle para envío por email + input validado

- [ ] **Step 6: Crear ResultadoGeneracion.astro**

Mostrar resultado de generación (success/error) con botones de descarga y nueva factura

- [ ] **Step 7: Commit componentes**

```bash
git add src/components/arca/ src/pages/
git commit -m "feat(arca): add base Astro components for form and result handling"
```

---

## Task 2: Crear cliente HTTP para API

**Archivo:** `src/lib/arca-client.ts`

- [ ] **Step 1: Escribir tipos TypeScript**

Definir interfaces: GeneratePDFRequest, GeneratePDFResponse, SendEmailRequest, GetCAERequest, etc.

- [ ] **Step 2: Implementar clase ArcaClient**

Métodos: `generatePDF()`, `sendEmail()`, `getCAE()`

- [ ] **Step 3: Exportar singleton**

```typescript
export default new ArcaClient();
```

- [ ] **Step 4: Commit cliente**

```bash
git add src/lib/arca-client.ts
git commit -m "feat(arca): add TypeScript HTTP client for API endpoints"
```

---

## Task 3: Crear API FastAPI con endpoints

**Archivo:** `plantilla-arca/src/web/fastapi_app.py`

- [ ] **Step 1: Setup FastAPI app**

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Plantilla ARCA API", version="1.0.0")
```

- [ ] **Step 2: Definir Pydantic models**

GeneratePDFRequest, GeneratePDFResponse, SendEmailRequest, SendEmailResponse, GetCAERequest, GetCAEResponse

- [ ] **Step 3: Implementar endpoint generate-pdf**

```python
@app.post("/api/arca/generate-pdf")
async def generate_pdf(request: GeneratePDFRequest):
    # Generar PDF con logo custom (si existe)
    # Retornar pdf_url, cae, vencimiento
```

- [ ] **Step 4: Implementar endpoint send-email**

```python
@app.post("/api/arca/send-email")
async def send_email(request: SendEmailRequest):
    # Validar email
    # Conectar SMTP
    # Adjuntar PDF
    # Enviar
```

- [ ] **Step 5: Implementar endpoint get-cae**

```python
@app.post("/api/arca/get-cae")
async def get_cae(request: GetCAERequest):
    # Para MVP: retornar CAE simulado
    # En producción: conectar a ARCA real
```

- [ ] **Step 6: Agregar endpoint de descarga**

```python
@app.get("/pdf/{filename}")
async def download_pdf(filename: str):
    # Validar filename para seguridad
    # Retornar FileResponse
```

- [ ] **Step 7: Actualizar requirements.txt**

Agregar: fastapi, uvicorn, python-multipart, aiofiles, pydantic

- [ ] **Step 8: Crear tests para API**

```python
# plantilla-arca/tests/test_api_endpoints.py
def test_health()
def test_generate_pdf_success()
def test_generate_pdf_with_logo()
def test_get_cae()
def test_send_email_invalid()
```

- [ ] **Step 9: Run tests**

```bash
cd plantilla-arca
python -m pytest tests/test_api_endpoints.py -v
```

Expected: 5/5 PASSED

- [ ] **Step 10: Commit API**

```bash
cd plantilla-arca
git add src/web/fastapi_app.py tests/test_api_endpoints.py requirements.txt
git commit -m "feat(api): add FastAPI endpoints for PDF generation, email, CAE retrieval with tests"
```

---

## Task 4: Modificar PDF generator para soportar logos

**Archivo:** `plantilla-arca/src/pdf/generator.py`

- [ ] **Step 1: Agregar imports**

```python
from urllib.request import urlopen
from io import BytesIO
import base64
```

- [ ] **Step 2: Agregar método _load_logo()**

```python
def _load_logo(self, logo_url):
    """Cargar logo desde URL o data:image URL"""
    if not logo_url:
        return None
    try:
        if logo_url.startswith("data:image"):
            header, data = logo_url.split(",", 1)
            return BytesIO(base64.b64decode(data))
        else:
            response = urlopen(logo_url, timeout=5)
            return BytesIO(response.read())
    except Exception:
        return None  # Continuar sin logo si falla
```

- [ ] **Step 3: Modificar método generar() para incluir logo**

En la sección de dibujo del header, agregar soporte para logo:

```python
if data.get("logo_url"):
    logo_img = self._load_logo(data["logo_url"])
    if logo_img:
        try:
            img = Image(logo_img, width=80, height=80)
            img.drawOn(self.canvas, 40, y_pos - 100)
        except:
            pass  # Si falla, continuar sin logo
```

- [ ] **Step 4: Crear tests**

```python
def test_pdf_with_logo_data_url()
def test_pdf_without_logo()
def test_pdf_with_invalid_logo_url()  # Debe continuar sin errores
```

- [ ] **Step 5: Run tests**

```bash
cd plantilla-arca
python -m pytest tests/test_pdf_generator.py -v
```

Expected: 3/3 PASSED

- [ ] **Step 6: Commit**

```bash
cd plantilla-arca
git add src/pdf/generator.py
git commit -m "feat(pdf): add support for custom logo URLs and data URLs"
```

---

## Task 5: Crear página Astro que orquesta todo

**Archivo:** `src/pages/plantilla-arca.astro`

- [ ] **Step 1: Estructurar página con Layout**

```astro
---
import Layout from '@/layouts/Layout.astro';
import FormularioARCA from '@/components/arca/FormularioARCA.astro';
import TemplateManager from '@/components/arca/TemplateManager.astro';
// ... otros imports

export const prerender = false;  // SSR para form handling
---

<Layout title="Plantilla ARCA - Generador de Facturas Electrónicas | RG 5824">
  <main class="plantilla-arca-main">
    <!-- Hero section -->
    <!-- Form wrapper con todos los componentes -->
    <!-- FAQ section -->
    <!-- CTA section -->
  </main>
</Layout>
```

- [ ] **Step 2: Agregar estilos responsivos**

CSS grid para desktop, single column para mobile

- [ ] **Step 3: Agregar script que orquesta flujo**

```javascript
const btnGenerate = document.getElementById('btn-generate');
btnGenerate.addEventListener('click', async () => {
  const data = /* recopilar datos del formulario */
  const pdfResponse = await arcaClient.generatePDF(data);
  const emailToSend = window.getEmailToSend?.();
  if (emailToSend) {
    await arcaClient.sendEmail({...});
  }
  window.showResult('success', '...', pdfResponse.pdf_url);
});
```

- [ ] **Step 4: Crear test para página**

```typescript
// tests/pages/plantilla-arca.test.ts
test('page renders form and hero')
test('button triggers API call')
test('email toggle shows/hides email input')
```

- [ ] **Step 5: Run tests**

```bash
npm run test tests/pages/plantilla-arca.test.ts
```

Expected: PASSED

- [ ] **Step 6: Test en navegador**

Iniciar dev server y verificar:
- Formulario se completa
- Botón genera factura
- Logo se carga correctamente
- Email se valida

- [ ] **Step 7: Commit página**

```bash
git add src/pages/plantilla-arca.astro tests/pages/
git commit -m "feat(pages): add Plantilla ARCA interactive form page with full integration"
```

---

## Task 6: Testing y validación completa

- [ ] **Step 1: Run all tests**

```bash
npm run test
cd plantilla-arca && python -m pytest tests/ -v
```

Expected: Todas las pruebas PASSED

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Build exitoso sin errores

- [ ] **Step 3: Dev server test (manual)**

```bash
npm run dev
# Abrir http://localhost:4321/plantilla-arca/
# Probar flujo completo: llenar form, cargar logo, generar PDF
```

- [ ] **Step 4: API test (manual)**

```bash
cd plantilla-arca
python -m uvicorn src.web.fastapi_app:app --host 127.0.0.1 --port 8000

# En otra terminal:
curl -X POST http://localhost:8000/api/arca/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"cuit":"20123456789","razon_social":"Test","..."}'
# Expected: 200 OK con pdf_url
```

- [ ] **Step 5: Commit final Fase 1**

```bash
git add -A
git commit -m "feat: Plantilla ARCA form page complete (Phase 1 - Frontend + API)"
```

---

# FASE 2: Repo GitHub Mejorado

## Task 7: Reescribir README.md

**Archivo:** `plantilla-arca/README.md`

- [ ] **Step 1: Backup README actual**

```bash
cd plantilla-arca
cp README.md README.md.backup
```

- [ ] **Step 2: Escribir nuevo README**

Estructura (ver spec):
1. Título + badges
2. Quick Start (3 opciones: Docker, local, VPS)
3. ¿Qué es RG 5824?
4. Instalación completa
5. Stack técnico (tabla)
6. Casos de uso (4 ejemplos específicos)
7. FAQ (6-8 preguntas)
8. Troubleshooting (4-5 errores comunes)
9. Documentación (links a docs/)
10. Ejemplos (links a examples/)
11. Testing
12. Roadmap
13. Licencia + links

Total: ~3000 palabras

- [ ] **Step 3: Verificar formato Markdown**

```bash
# Chequear que todos los links son válidos
grep -o '\[.*\](.*)'  README.md | head -20
```

- [ ] **Step 4: Commit README**

```bash
cd plantilla-arca
git add README.md
git commit -m "docs: rewrite README with complete structure, quick start, FAQ, examples"
```

---

## Task 8: Crear documentación en `docs/`

**Archivos:** INSTALACION.md, API.md, DESARROLLO.md, RG-5824-EXPLICADO.md

- [ ] **Step 1: Crear INSTALACION.md**

Secciones:
- Con Docker (paso a paso)
- Sin Docker (venv, pip, config)
- En VPS propio (systemd, Nginx, certificados)
- Troubleshooting específico por plataforma

~800 palabras

- [ ] **Step 2: Crear API.md**

Secciones:
- Referencia de módulos
- Funciones y parámetros
- Ejemplos de uso
- Excepciones posibles

~500 palabras

- [ ] **Step 3: Crear DESARROLLO.md**

Secciones:
- Setup para desarrollo
- Estructura del código
- Cómo hacer un PR
- Cómo correr tests localmente
- Git workflow

~400 palabras

- [ ] **Step 4: Crear RG-5824-EXPLICADO.md**

Secciones:
- Quién está obligado
- Qué es CAE, ARCA, WSAA, SOAP
- Flujo de emisión de facturas
- Puntos de venta y números de comprobante
- Validaciones

~600 palabras

- [ ] **Step 5: Commit docs**

```bash
cd plantilla-arca
git add docs/
git commit -m "docs: add complete documentation (INSTALACION, API, DESARROLLO, RG-5824-EXPLICADO)"
```

---

## Task 9: Crear ejemplos en `examples/`

**Archivos:** cli-simple.py, integracion-django.py, batch-csv.py, custom-pdf.py

- [ ] **Step 1: Crear cli-simple.py**

```python
"""Emitir factura desde CLI sin web"""
from src.arca.client import ArcaClient
from src.pdf.generator import GeneradorPDFFactura

# Configura CUIT y certificados
cliente = ArcaClient()
cae = cliente.solicitar_cae(tipo_comprobante="Factura A", importe_total=100000.0)
generador = GeneradorPDFFactura()
pdf = generador.generar(cae=cae)
print(f"✅ PDF generado: {pdf}")
```

~50 líneas

- [ ] **Step 2: Crear integracion-django.py**

```python
"""Integrar ARCA en un modelo Django"""
from django.db import models
from src.arca.client import ArcaClient

class Comprobante(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    
    def generar_cae(self):
        cliente_arca = ArcaClient()
        self.cae = cliente_arca.solicitar_cae(...)
        self.save()
```

~80 líneas

- [ ] **Step 3: Crear batch-csv.py**

```python
"""Procesar CSV con múltiples facturas"""
import csv
from src.arca.client import ArcaClient
from src.pdf.generator import GeneradorPDFFactura

cliente = ArcaClient()
generador = GeneradorPDFFactura()

with open('facturas.csv') as f:
    for row in csv.DictReader(f):
        cae = cliente.solicitar_cae(...)
        pdf = generador.generar(...)
        print(f"✅ {row['empresa']}: {pdf}")
```

~100 líneas

- [ ] **Step 4: Crear custom-pdf.py**

```python
"""Personalizar template PDF"""
from src.pdf.generator import GeneradorPDFFactura

class MiGenerador(GeneradorPDFFactura):
    def generar(self, data):
        # Personalizar colores, fonts, layout
        return super().generar(data)

generador = MiGenerador()
pdf = generador.generar(data)
```

~120 líneas

- [ ] **Step 5: Crear archivo README en examples/**

```markdown
# Ejemplos de Código

## cli-simple.py
Emitir factura desde línea de comandos.

## integracion-django.py
Integrar ARCA en un modelo Django.

... etc
```

- [ ] **Step 6: Commit ejemplos**

```bash
cd plantilla-arca
git add examples/
git commit -m "docs: add 4 practical code examples (CLI, Django, batch, custom PDF)"
```

---

## Task 10: Mejoras finales a repo

- [ ] **Step 1: Actualizar .gitignore**

Verificar que excluye:
- Certificados (.crt, .key)
- .env (credenciales)
- __pycache__
- *.pyc
- venv/
- .DS_Store
- output/pdf_files/

- [ ] **Step 2: Agregar CODEOWNERS**

Crear `.github/CODEOWNERS`:
```
* @martinsan  # Tu usuario de GitHub
docs/ @martinsan
tests/ @martinsan
```

- [ ] **Step 3: Agregar GitHub issue templates**

Crear `.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
## Descripción del bug
...

## Pasos para reproducir
...

## Comportamiento esperado
...
```

- [ ] **Step 4: Verificar topics en GitHub**

En https://github.com/UltimaMilla/plantilla-arca/settings:
- Topics: `arca`, `facturacion`, `afip`, `rg-5824`, `python`, `open-source`, `argentina`

- [ ] **Step 5: Actualizar descripción repo**

"Open source generador de facturas electrónicas según RG 5824 AFIP. Gratis, MIT, sin vendor lock-in."

- [ ] **Step 6: Commit final Fase 2**

```bash
cd plantilla-arca
git add .gitignore .github/
git commit -m "chore: improve repository configuration and issue templates"
```

---

# FASE 3: Noticia de Blog Optimizada

## Task 11: Reescribir NOTA-BLOG-PLANTILLA-ARCA.md

**Archivo:** `NOTA-BLOG-PLANTILLA-ARCA.md`

- [ ] **Step 1: Backup noticia actual**

```bash
cp NOTA-BLOG-PLANTILLA-ARCA.md NOTA-BLOG-PLANTILLA-ARCA.md.backup
```

- [ ] **Step 2: Escribir estructura nueva**

Secciones (ver spec):
1. **Hook emocional** — anécdota de usuario real (Martín que pagaba $500/mes)
2. **El problema: RG 5824** — contexto, quién está obligado, por qué duele
3. **La solución: Plantilla ARCA** — qué es, qué hace, por qué diferente
4. **Cómo funciona (técnico)** — stack, arquitectura, seguridad
5. **Casos de uso específicos** — 4 personas diferentes con su caso
6. **FAQ** — 8-10 preguntas
7. **Roadmap** — qué viene
8. **Cómo empezar** — 3 opciones (online, local, servidor)
9. **Reflexión final** — consistency, valor, llamada a contribuir
10. **Links útiles** — referencias, GitHub, documentación

Total: ~2500 palabras

- [ ] **Step 3: Optimizar para SEO**

- Title: "Plantilla ARCA: Facturación Electrónica Gratis con RG 5824 (Open Source)"
- Meta description: "Herramienta open source (MIT) para generar facturas electrónicas según RG 5824 de AFIP. Sin Tango, sin Bejerman. Probá gratis en 5 minutos."
- Keywords distribuidas: RG 5824, ARCA, factura electrónica, open source, AFIP, Argentina
- H1: una sola vez (título principal)
- H2: secciones principales
- H3: subsecciones

- [ ] **Step 4: Optimizar copywriting**

- Hook emocional en primeras líneas
- Beneficios antes de features
- Casos de uso específicos (personas, no roles genéricos)
- CTAs estratégicas (4-5 a lo largo del post):
  - Después de "la solución" → Probá online
  - Después de "técnico" → Descargá desde GitHub
  - Después de "FAQs" → Empezá en 5 minutos
  - Final → Escribinos

- [ ] **Step 5: Agregar links internos/externos**

- Links internos: artículo anterior sobre RG 5824 (si existe)
- Links externos: AFIP oficial, arca_arg librería
- Links a recursos: demo online, repo GitHub, documentación

- [ ] **Step 6: Verificar estructura**

```bash
# Contar palabras
wc -w NOTA-BLOG-PLANTILLA-ARCA.md
# Expected: ~2000-2500

# Verificar headers
grep '^#' NOTA-BLOG-PLANTILLA-ARCA.md
# Expected: 1 H1, 8-10 H2, 10-15 H3
```

- [ ] **Step 7: Commit noticia**

```bash
git add NOTA-BLOG-PLANTILLA-ARCA.md
git commit -m "docs(blog): rewrite with optimized structure, SEO, copywriting, and CTAs"
```

---

## Task 12: Verificación final y commit global

- [ ] **Step 1: Verificar que todos los archivos existen**

```bash
# Fase 1: Astro components
ls src/pages/plantilla-arca.astro
ls src/components/arca/*.astro
ls src/lib/arca-client.ts

# Fase 1: API
ls plantilla-arca/src/web/fastapi_app.py
ls plantilla-arca/tests/test_api_endpoints.py

# Fase 2: Docs
ls plantilla-arca/README.md
ls plantilla-arca/docs/*.md
ls plantilla-arca/examples/*.py

# Fase 3: Blog
ls NOTA-BLOG-PLANTILLA-ARCA.md
```

- [ ] **Step 2: Build final check**

```bash
npm run build
cd plantilla-arca && python -m pytest tests/ -v && cd ..
```

Expected: Build exitoso, todos los tests PASSED

- [ ] **Step 3: Ver resumen de cambios**

```bash
git log --oneline | head -15
# Expected: ~15-20 commits de esta implementación
```

- [ ] **Step 4: Commit final integrado**

```bash
git add docs/superpowers/
git commit -m "docs: complete redesign of Plantilla ARCA (Phases 1-3 with plan)"
```

---

## Summary de Implementación

**Fase 1: Página/Formulario + API**
- 6 componentes Astro interactivos (FormularioARCA, TemplateManager, LogoUpload, PDFPreview, EmailInput, ResultadoGeneracion)
- Cliente HTTP TypeScript
- API FastAPI con 3 endpoints (generate-pdf, send-email, get-cae)
- PDF generator mejorado con soporte para logos custom
- Página Astro que orquesta todo
- Tests completos para componentes y API
- ~8 commits

**Fase 2: Repo GitHub Mejorado**
- README completamente reescrito (~3000 palabras)
- 4 documentos Markdown (INSTALACION, API, DESARROLLO, RG-5824-EXPLICADO)
- 4 ejemplos de código listos para copy/paste (CLI, Django, batch, custom PDF)
- Mejoras a estructura repo (CODEOWNERS, issue templates, topics)
- ~6 commits

**Fase 3: Noticia de Blog Optimizada**
- Reescritura completa (~2500 palabras)
- Optimizado para SEO (keywords, estructura, meta tags)
- Copywriting mejorado (hook emocional, beneficios, CTAs estratégicas)
- 4 casos de uso específicos
- 8-10 preguntas frecuentes
- ~1 commit

**Total: ~15-20 commits, documentación profesional, código testeable**

---

Plan guardado en: `docs/superpowers/plans/2026-04-26-plantilla-arca-redesign.md`

