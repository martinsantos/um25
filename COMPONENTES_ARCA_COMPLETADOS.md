# Componentes Astro para Plantilla ARCA - Completados

**Fecha:** 26 de Abril, 2026  
**Status:** ✅ COMPLETADOS - 6/6 componentes + 49 tests pasando  
**Branch:** develop

---

## Resumen Ejecutivo

Se han creado 6 componentes Astro interactivos siguiendo TDD (Test-Driven Development):
- Todos los tests pasan (49/49)
- Seguridad contra XSS: uso de `textContent` en lugar de `innerHTML`
- Responsivos con Tailwind CSS
- Integración con localStorage para persistencia
- Funciones globales window.* para comunicación entre componentes
- Eventos personalizados para orquestación

---

## Componentes Creados

### 1. FormularioARCA.astro ✅
**Archivo:** `src/components/arca/FormularioARCA.astro`  
**Tests:** 6 tests pasando

**Funcionalidad:**
- Formulario responsivo con 2 secciones:
  - **Mi Empresa:** CUIT, Razón Social, Domicilio, Condición IVA
  - **Nueva Factura:** Tipo Comprobante, Fecha, Descripción, Importe
- Grid responsivo: 2 columnas en desktop, 1 en mobile (Tailwind)
- Emite evento `formDataChange` cuando cambian los datos
- Validación básica: CUIT (11 dígitos), importe (positivo)
- Recolección de datos con FormData API

**Características de Seguridad:**
- Inputs con atributos `required` y `pattern`
- Validación en el navegador con HTML5 form validation

---

### 2. TemplateManager.astro ✅
**Archivo:** `src/components/arca/TemplateManager.astro`  
**Tests:** 7 tests pasando

**Funcionalidad:**
- Gestor de plantillas de empresas en localStorage
- Almacenamiento: clave `plantilla_arca_templates`
- Operaciones:
  - **Guardar:** Crear nueva plantilla con ID único (timestamp)
  - **Cargar:** Selector para cambiar entre plantillas guardadas
  - **Eliminar:** Botón de eliminar con confirmación
- Estructura de Template (TypeScript):
  ```typescript
  {
    id: string;           // miempresa-001
    nombre: string;       // Mi Empresa
    cuit: string;
    razon_social: string;
    domicilio: string;
    condicion_iva: string;
    logo_url?: string | null;  // data URL o null
    fecha_creacion: string;    // ISO 8601
  }
  ```
- Eventos globales: `loadTemplate`, `templateSaved`, `templateDeleted`
- Funciones globales:
  - `window.getTemplates()` → Array<Template>
  - `window.getTemplate(id)` → Template
  - `window.saveTemplate(data)` → Template

**Características de Seguridad:**
- No usa `innerHTML`, construye elementos con `createElement`
- Usa `textContent` para valores

---

### 3. LogoUpload.astro ✅
**Archivo:** `src/components/arca/LogoUpload.astro`  
**Tests:** 9 tests pasando

**Funcionalidad:**
- Upload de imágenes (accept="image/*")
- Validación:
  - Tamaño máximo: 2MB (configurable con prop `maxSizeMB`)
  - Tipos MIME válidos: png, jpg, jpeg, gif, webp
- Conversión a Data URL (Base64)
- Almacenamiento: `window.currentLogoUrl`
- Características:
  - Preview de la imagen cargada
  - Botón "Quitar Logo"
  - Mensajes de error dinámicos
  - Validación en tiempo real

**Características de Seguridad:**
- Validación de tipo MIME
- Límite de tamaño para evitar DoS
- FileReader para lectura segura

---

### 4. PDFPreview.astro ✅
**Archivo:** `src/components/arca/PDFPreview.astro`  
**Tests:** 8 tests pasando

**Funcionalidad:**
- Modal para preview de facturas antes de generar
- Activación: evento `showPDFPreview`
- Contenido: tabla HTML con datos de la factura
- Botones:
  - "Confirmar y Generar" → evento `previewConfirmed`
  - "Cancelar" → evento `previewCancelled`
- Estilo:
  - Overlay oscuro (backdrop:bg-black/50)
  - Centrado en pantalla (fixed, inset-0, flex)
  - Sombra y bordes redondeados

**Características de Seguridad:**
- Usa `textContent` para mostrar valores
- Limpia contenedor antes de actualizar
- Usa `createElement` para construcción segura

---

### 5. EmailInput.astro ✅
**Archivo:** `src/components/arca/EmailInput.astro`  
**Tests:** 8 tests pasando

**Funcionalidad:**
- Checkbox: "Enviar factura por Email"
- Input de email (oculto por defecto, mostrado al marcar checkbox)
- Validación:
  - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Validación en tiempo real (blur e input)
  - Mensajes de error dinámicos
- Funciones globales:
  - `window.getEmailToSend()` → email | null
  - `window.getEmailData()` → {send, email, isValid}
  - `window.validateEmail()` → boolean

**Características de Seguridad:**
- Validación de formato email
- Prevención de inyección: usa textContent

---

### 6. ResultadoGeneracion.astro ✅
**Archivo:** `src/components/arca/ResultadoGeneracion.astro`  
**Tests:** 11 tests pasando

**Funcionalidad:**
- Muestra resultado de generación de PDF (success/error)
- Estados:
  - **Cargando:** Spinner animado "Generando factura..."
  - **Éxito:** Información de CAE, botón descarga, info de email
  - **Error:** Mensaje de error y botón reintentar
- Botones:
  - "Descargar PDF" → descarga el archivo (atributo `download`)
  - "Nueva Factura" → resetea el form y oculta resultado
  - "Intentar de Nuevo" → evento `retryGeneration`
- Funciones globales:
  - `window.showResult(type, message, pdfUrl, emailSent)` → {type, message, pdfUrl, emailSent}
  - `window.showLoader()` → muestra spinner
  - `window.setCae(cae, vencimiento)` → actualiza CAE
  - `window.clearResult()` → oculta resultado

**Características de Seguridad:**
- Usa `textContent` para mensajes
- Prevención de XSS explícita en tests
- Atributo `download` para descargas seguras

---

## Estadísticas de Pruebas

```
Test Suites: 6 passed, 6 total
Tests:       49 passed, 49 total
Time:        0.617s
```

### Desglose por Componente:
- FormularioARCA: 6 tests ✅
- TemplateManager: 7 tests ✅
- LogoUpload: 9 tests ✅
- PDFPreview: 8 tests ✅
- EmailInput: 8 tests ✅
- ResultadoGeneracion: 11 tests ✅

---

## Estructura de Archivos

```
src/components/arca/
├── FormularioARCA.astro        (6.5 KB)
├── TemplateManager.astro       (8.0 KB)
├── LogoUpload.astro            (3.9 KB)
├── PDFPreview.astro            (4.3 KB)
├── EmailInput.astro            (3.5 KB)
└── ResultadoGeneracion.astro   (6.4 KB)

__tests__/components/arca/
├── FormularioARCA.test.js      (5.2 KB)
├── TemplateManager.test.js     (5.5 KB)
├── LogoUpload.test.js          (4.8 KB)
├── PDFPreview.test.js          (4.2 KB)
├── EmailInput.test.js          (3.8 KB)
└── ResultadoGeneracion.test.js (6.4 KB)
```

---

## Committs Realizados

```
1. feat(arca): crear componente FormularioARCA con tests
2. feat(arca): crear componente TemplateManager con tests
3. feat(arca): crear componente LogoUpload con tests
4. feat(arca): crear componente PDFPreview con tests
5. feat(arca): crear componente EmailInput con tests
6. feat(arca): crear componente ResultadoGeneracion con tests
```

---

## Integración con Otros Componentes

Los componentes están diseñados para ser orquestados por una página principal `plantilla-arca.astro`:

```astro
---
import FormularioARCA from '@/components/arca/FormularioARCA.astro';
import TemplateManager from '@/components/arca/TemplateManager.astro';
import LogoUpload from '@/components/arca/LogoUpload.astro';
import PDFPreview from '@/components/arca/PDFPreview.astro';
import EmailInput from '@/components/arca/EmailInput.astro';
import ResultadoGeneracion from '@/components/arca/ResultadoGeneracion.astro';
---

<div class="container">
  <FormularioARCA />
  <TemplateManager />
  <LogoUpload />
  <PDFPreview />
  <EmailInput />
  <ResultadoGeneracion />
</div>

<script is:inline>
  // Orquestación mediante eventos globales
  document.addEventListener('formDataChange', (e) => {
    console.log('Datos del formulario cambiaron:', e.detail);
  });
  
  document.addEventListener('previewConfirmed', async () => {
    window.showLoader();
    const result = await generarPDF();
    window.showResult(result.type, result.message, result.pdfUrl);
  });
</script>
```

---

## Próximos Pasos (Task 2-5)

1. **Task 2:** Crear cliente HTTP TypeScript (arca-client.ts)
   - Comunicación con API FastAPI
   - Métodos: generatePDF, sendEmail, getCae

2. **Task 3:** Crear API FastAPI con 3 endpoints
   - POST /api/arca/generate-pdf
   - POST /api/arca/send-email
   - POST /api/arca/get-cae

3. **Task 4:** Modificar PDF generator para soporte de logos custom
   - Integración con src/pdf/generator.py
   - Soporte para logos como data URLs

4. **Task 5:** Crear página Astro que orquesta todo
   - src/pages/plantilla-arca.astro
   - Integración de los 6 componentes
   - Lógica de flujo de usuario

---

## Notas de Implementación

### TDD Applied ✅
- Se escribieron tests ANTES que el código de producción
- Todos los tests comienzan en RED (fallando)
- Se implementó código mínimo para hacerlos pasar (GREEN)
- Refactoring mejoró seguridad contra XSS

### Seguridad ✅
- No hay uso de `innerHTML` con datos no confiables
- Se usa `textContent` para todos los valores dinámicos
- Validación de tipos MIME y tamaños de archivo
- Validación regex para emails

### Responsive Design ✅
- Tailwind CSS para estilos responsivos
- Grid systems: 2 col desktop, 1 col mobile
- Media queries implícitas en clases Tailwind
- Buttons y inputs adaptables

### Accesibilidad ✅
- Labels asociados con inputs via `for` attribute
- Semantic HTML (fieldset, legend, dialog)
- Errores mostrados con `aria-describedby`
- Contraste de colores adecuado

---

## Verificación Final

Para verificar que todo está funcionando:

```bash
# Ejecutar todos los tests
npm test -- __tests__/components/arca/

# Verificar que los componentes existen
ls -la src/components/arca/

# Contar líneas de código
wc -l src/components/arca/*.astro __tests__/components/arca/*.js
```

---

**Status:** 🟢 COMPLETADO - Listo para integración con API y página orquestadora
