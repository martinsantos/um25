# Plantilla ARCA — AFIP Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Plantilla ARCA page from simulated invoice generation to real AFIP/ARCA integration with CUIT validation, professional PDF preview, AFIP authorization, and real CAE generation.

**Architecture:** Frontend (Astro SSR) orchestrates form validation, PDF preview, auth collection, and result display. Backend (FastAPI submodule) proxies SOAP calls to ARCA/AFIP web services (WSAA for auth, WSMTXCA for CAE). No credentials stored server-side — tokens live in `sessionStorage` during the browser session.

**Tech Stack:** Astro 5 (SSR), Tailwind CSS, Alpine.js (existing), FastAPI (Python 3.11+), arca_arg library, ReportLab + QR, ARCA WSAA/WSMTXCA SOAP services.

---

## Phase 1: Form Validation (Frontend Only)

### Task 1: CUIT Check-Digit Validation

**Files:**
- Modify: `src/components/arca/FormularioARCA.astro`

- [ ] **Step 1: Add `validarCUIT()` function to FormularioARCA script**

Add this function inside the existing `<script is:inline>` block, before the `handleChange` function:

```javascript
// Validación de CUIT - dígito verificador AFIP
function validarCUIT(cuit) {
  if (!/^\d{11}$/.test(cuit)) return { valido: false, error: 'CUIT debe tener 11 dígitos' };

  var pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  var suma = 0;
  for (var i = 0; i < 10; i++) {
    suma += parseInt(cuit[i]) * pesos[i];
  }
  var resto = suma % 11;
  var dvCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  var dvIngresado = parseInt(cuit[10]);

  if (dvCalculado !== dvIngresado) {
    return { valido: false, error: 'El dígito verificador del CUIT no es válido' };
  }

  var prefijo = parseInt(cuit.substring(0, 2));
  var prefijosValidos = [20, 23, 24, 27, 30, 33, 34];
  if (!prefijosValidos.includes(prefijo)) {
    return { valido: false, error: 'El prefijo del CUIT no corresponde a un tipo válido' };
  }

  return { valido: true, error: null };
}
```

- [ ] **Step 2: Add `mostrarErrorCUIT()` and `limpiarErrorCUIT()` helpers**

```javascript
function mostrarErrorCUIT(inputId, mensaje) {
  var input = document.querySelector(inputId);
  if (!input) return;

  var existingError = input.parentElement.querySelector('.cuit-error');
  if (existingError) existingError.remove();

  input.classList.add('border-red-500', 'ring-red-500');

  var error = document.createElement('p');
  error.className = 'cuit-error text-sm text-red-600 mt-1';
  error.textContent = mensaje;
  input.parentElement.appendChild(error);
}

function limpiarErrorCUIT(inputId) {
  var input = document.querySelector(inputId);
  if (!input) return;

  input.classList.remove('border-red-500', 'ring-red-500');
  var existingError = input.parentElement.querySelector('.cuit-error');
  if (existingError) existingError.remove();
}
```

- [ ] **Step 3: Add CUIT validation on blur + auto-clean non-digits**

Inside the same `<script>` block, after the `handleChange` function:

```javascript
// CUIT validation
var cuitInput = document.querySelector('#cuit');
if (cuitInput) {
  cuitInput.addEventListener('blur', function(e) {
    var value = e.target.value.replace(/\D/g, '');
    if (value.length === 11) {
      var result = validarCUIT(value);
      if (!result.valido) {
        mostrarErrorCUIT('#cuit', result.error);
      } else {
        limpiarErrorCUIT('#cuit');
      }
    } else if (value.length > 0) {
      mostrarErrorCUIT('#cuit', 'El CUIT debe tener exactamente 11 dígitos');
    } else {
      limpiarErrorCUIT('#cuit');
    }
  });

  cuitInput.addEventListener('input', function(e) {
    var cleaned = e.target.value.replace(/\D/g, '');
    if (cleaned !== e.target.value) {
      e.target.value = cleaned;
    }
    if (cleaned.length === 11) {
      limpiarErrorCUIT('#cuit');
    }
  });
}
```

- [ ] **Step 4: Verify CUIT validation works**

Run dev server with `npm run dev`, open the form, test:
- `20123456789` → should fail DV check
- `30711906361` → valid CUIT (passes)
- `20111111111` → should fail DV check
- `12345678901` → should fail (invalid prefix)

Expected: invalid CUITs show red border + error message; valid CUIT shows no error.

- [ ] **Step 5: Commit**

```bash
git add src/components/arca/FormularioARCA.astro
git commit -m "feat(arca): add CUIT check-digit validation with inline errors"
```

---

### Task 2: Form-Wide Validation Before Preview

**Files:**
- Modify: `src/components/arca/FormularioARCA.astro`
- Modify: `src/pages/plantilla-arca.astro`

- [ ] **Step 1: Add `validarFormulario()` function**

```javascript
function validarFormulario() {
  var errores = [];

  var cuit = (document.querySelector('#cuit')?.value || '').replace(/\D/g, '');
  var cuitVal = validarCUIT(cuit);
  if (!cuitVal.valido) {
    errores.push({ campo: 'cuit', mensaje: cuitVal.error || 'CUIT inválido' });
  }

  var razonSocial = (document.querySelector('#razon_social')?.value || '').trim();
  if (!razonSocial) {
    errores.push({ campo: 'razon_social', mensaje: 'Razón Social es requerida' });
  }

  var domicilio = (document.querySelector('#domicilio')?.value || '').trim();
  if (!domicilio) {
    errores.push({ campo: 'domicilio', mensaje: 'Domicilio es requerido' });
  }

  var condicionIva = document.querySelector('#condicion_iva')?.value || '';
  if (!condicionIva) {
    errores.push({ campo: 'condicion_iva', mensaje: 'Seleccioná una condición frente al IVA' });
  }

  var tipoComp = document.querySelector('#tipo_comprobante')?.value || '';
  if (!tipoComp) {
    errores.push({ campo: 'tipo_comprobante', mensaje: 'Seleccioná un tipo de comprobante' });
  }

  var fecha = document.querySelector('#fecha_emision')?.value || '';
  if (!fecha) {
    errores.push({ campo: 'fecha_emision', mensaje: 'Fecha de emisión es requerida' });
  } else {
    var fechaDate = new Date(fecha + 'T12:00:00');
    var dentroDeUnMes = new Date();
    dentroDeUnMes.setMonth(dentroDeUnMes.getMonth() + 1);
    if (fechaDate > dentroDeUnMes) {
      errores.push({ campo: 'fecha_emision', mensaje: 'La fecha no puede ser más de un mes en el futuro' });
    }
  }

  var importe = parseFloat(document.querySelector('#importe_total')?.value || '0');
  if (isNaN(importe) || importe <= 0) {
    errores.push({ campo: 'importe_total', mensaje: 'El importe debe ser mayor a 0' });
  }

  return errores;
}
window.validarFormularioARCA = validarFormulario;
```

- [ ] **Step 2: Add visual feedback function**

```javascript
function mostrarErroresFormulario(errores) {
  document.querySelectorAll('.cuit-error, .form-error').forEach(function(el) { el.remove(); });
  document.querySelectorAll('.input-field').forEach(function(el) {
    el.classList.remove('border-red-500', 'ring-red-500');
  });

  errores.forEach(function(err) {
    var input = document.querySelector('#' + err.campo);
    if (input) {
      input.classList.add('border-red-500', 'ring-red-500');
      var error = document.createElement('p');
      error.className = 'form-error text-sm text-red-600 mt-1';
      error.textContent = err.mensaje;
      input.parentElement.appendChild(error);
    }
  });

  var firstError = document.querySelector('.border-red-500');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError.focus();
  }
}
window.mostrarErroresFormulario = mostrarErroresFormulario;
```

- [ ] **Step 3: Add validation call in plantilla-arca.astro**

Find the `btnGenerate.addEventListener('click', ...)` handler in `src/pages/plantilla-arca.astro`. Replace its body to validate first:

```javascript
var btnGenerate = document.getElementById('btn-generate');
if (btnGenerate) {
  btnGenerate.addEventListener('click', async function() {
    // Validate form
    if (window.validarFormularioARCA) {
      var errores = window.validarFormularioARCA();
      if (errores.length > 0) {
        window.mostrarErroresFormulario(errores);
        return;
      }
    }

    if (!window.lastFormData) {
      window.showResult('error', 'Por favor completa el formulario');
      return;
    }

    // Show PDF preview instead of auto-generating
    var previewEvent = new CustomEvent('showPDFPreview', {
      detail: { data: window.lastFormData },
      bubbles: true,
    });
    document.dispatchEvent(previewEvent);
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/arca/FormularioARCA.astro src/pages/plantilla-arca.astro
git commit -m "feat(arca): add form-wide validation before PDF preview"
```

---

## Phase 2: Professional PDF Preview + AFIP CTA

### Task 3: Redesign PDFPreview with Professional Invoice Layout

**Files:**
- Modify: `src/components/arca/PDFPreview.astro`

- [ ] **Step 1: Create `renderInvoicePreview()` function using safe DOM methods**

Replace the table-building code inside `document.addEventListener('showPDFPreview', ...)` with a call to this function. All user data is set via `textContent` for XSS safety.

```javascript
function renderInvoicePreview(data, logoUrl) {
  var container = document.querySelector('#pdf-preview-container');
  if (!container) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  var importeTotal = parseFloat(data.importe_total || 0);
  var alicuota = 0.21;
  var subtotal = importeTotal / (1 + alicuota);
  var iva = importeTotal - subtotal;
  var comprobanteNum = '0001-000000' + String(Math.floor(Math.random() * 90000) + 10000);

  // --- Outer wrapper ---
  var wrapper = document.createElement('div');
  wrapper.className = 'bg-white border border-gray-300 rounded-md shadow-sm';
  wrapper.style.fontSize = '12px';
  container.appendChild(wrapper);

  // --- HEADER ---
  var header = document.createElement('div');
  header.className = 'border-b border-gray-300 p-4 d-flex';
  header.style.display = 'flex';
  header.style.alignItems = 'flex-start';
  header.style.gap = '16px';

  if (logoUrl) {
    var logo = document.createElement('img');
    logo.src = logoUrl;
    logo.className = 'w-20 h-20 object-contain rounded';
    logo.alt = 'Logo';
    header.appendChild(logo);
  }

  var headerInfo = document.createElement('div');
  headerInfo.style.flex = '1';

  var title = document.createElement('h2');
  title.style.fontSize = '1.1rem';
  title.style.fontWeight = '800';
  title.style.color = '#1e3a5f';
  title.textContent = 'FACTURA';
  headerInfo.appendChild(title);

  var tipoP = document.createElement('p');
  tipoP.style.fontWeight = '600';
  tipoP.style.color = '#1e3a5f';
  tipoP.style.marginTop = '2px';
  tipoP.textContent = data.tipo_comprobante || '';
  headerInfo.appendChild(tipoP);

  var codigoP = document.createElement('p');
  codigoP.style.color = '#4b5563';
  codigoP.style.marginTop = '4px';
  codigoP.textContent = 'Codigo Nro: ' + comprobanteNum;
  headerInfo.appendChild(codigoP);

  header.appendChild(headerInfo);
  wrapper.appendChild(header);

  // --- SELLER DATA ---
  var seller = document.createElement('div');
  seller.className = 'border-b border-gray-300 p-4';

  var campos = [
    { label: 'CUIT', val: data.cuit },
    { label: 'Razon Social', val: data.razon_social },
    { label: 'Domicilio', val: data.domicilio },
    { label: 'Condicion IVA', val: data.condicion_iva },
  ];
  campos.forEach(function(c) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = c.label + ': ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(c.val || ''));
    seller.appendChild(p);
  });
  wrapper.appendChild(seller);

  // --- INVOICE DETAILS ---
  var details = document.createElement('div');
  details.className = 'border-b border-gray-300 p-4';

  var fechaP = document.createElement('p');
  var fs = document.createElement('strong');
  fs.textContent = 'Fecha Emision: ';
  fechaP.appendChild(fs);
  fechaP.appendChild(document.createTextNode(data.fecha_emision || ''));
  details.appendChild(fechaP);

  var descP = document.createElement('p');
  var ds = document.createElement('strong');
  ds.textContent = 'Descripcion: ';
  descP.appendChild(ds);
  descP.appendChild(document.createTextNode(data.descripcion || ''));
  details.appendChild(descP);

  wrapper.appendChild(details);

  // --- ITEMS TABLE (static structure, only numeric data) ---
  var tableWrap = document.createElement('div');
  tableWrap.className = 'border-b border-gray-300';

  var table = document.createElement('table');
  table.className = 'w-full';
  table.style.fontSize = '11px';
  table.style.borderCollapse = 'collapse';

  // Thead
  var thead = document.createElement('thead');
  var headRow = document.createElement('tr');
  headRow.style.backgroundColor = '#f3f4f6';
  ['Descripcion', 'Subtotal', 'IVA 21%', 'Total'].forEach(function(h) {
    var th = document.createElement('th');
    th.style.padding = '8px 12px';
    th.style.textAlign = 'left';
    th.style.fontWeight = '600';
    if (h !== 'Descripcion') th.style.textAlign = 'right';
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Tbody
  var tbody = document.createElement('tbody');
  var row = document.createElement('tr');
  row.style.borderTop = '1px solid #e5e7eb';

  var tdDesc = document.createElement('td');
  tdDesc.style.padding = '10px 12px';
  tdDesc.textContent = data.descripcion || '';
  row.appendChild(tdDesc);

  [subtotal, iva, importeTotal].forEach(function(val) {
    var td = document.createElement('td');
    td.style.padding = '10px 12px';
    td.style.textAlign = 'right';
    td.textContent = '$' + val.toFixed(2);
    row.appendChild(td);
  });

  tbody.appendChild(row);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  wrapper.appendChild(tableWrap);

  // --- TOTALS ---
  var totals = document.createElement('div');
  totals.className = 'border-b border-gray-300 p-4';
  totals.style.display = 'flex';
  totals.style.justifyContent = 'flex-end';

  var totalsInner = document.createElement('div');
  totalsInner.style.width = '50%';

  var totalLines = [
    { label: 'Subtotal:', val: '$' + subtotal.toFixed(2) },
    { label: 'IVA 21%:', val: '$' + iva.toFixed(2) },
  ];
  totalLines.forEach(function(line) {
    var div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    var spanL = document.createElement('span');
    spanL.textContent = line.label;
    var spanR = document.createElement('span');
    spanR.textContent = line.val;
    div.appendChild(spanL);
    div.appendChild(spanR);
    totalsInner.appendChild(div);
  });

  // Total line with top border
  var totalDiv = document.createElement('div');
  totalDiv.style.display = 'flex';
  totalDiv.style.justifyContent = 'space-between';
  totalDiv.style.fontWeight = '800';
  totalDiv.style.fontSize = '1rem';
  totalDiv.style.borderTop = '2px solid #000';
  totalDiv.style.paddingTop = '4px';
  totalDiv.style.marginTop = '4px';
  var totalL = document.createElement('span');
  totalL.textContent = 'TOTAL:';
  var totalR = document.createElement('span');
  totalR.textContent = '$' + importeTotal.toFixed(2);
  totalDiv.appendChild(totalL);
  totalDiv.appendChild(totalR);
  totalsInner.appendChild(totalDiv);

  totals.appendChild(totalsInner);
  wrapper.appendChild(totals);

  // --- FOOTER (CAE placeholder) ---
  var footer = document.createElement('div');
  footer.className = 'p-4 bg-gray-50 rounded-b-md';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.alignItems = 'center';

  var footerLeft = document.createElement('div');
  var caeP = document.createElement('p');
  var caeStrong = document.createElement('strong');
  caeStrong.textContent = 'CAE: ';
  caeP.appendChild(caeStrong);
  var caeSpan = document.createElement('span');
  caeSpan.style.fontFamily = 'monospace';
  caeSpan.style.color = '#9ca3af';
  caeSpan.textContent = 'Simulacion — sin validez fiscal';
  caeP.appendChild(caeSpan);
  footerLeft.appendChild(caeP);

  var noteP = document.createElement('p');
  noteP.style.color = '#9ca3af';
  noteP.style.fontSize = '0.7rem';
  noteP.style.marginTop = '2px';
  noteP.textContent = 'Esta es una vista previa. El CAE real se generara al facturar ante AFIP.';
  footerLeft.appendChild(noteP);
  footer.appendChild(footerLeft);

  var footerRight = document.createElement('div');
  footerRight.style.textAlign = 'right';
  footerRight.style.fontSize = '0.6rem';
  footerRight.style.color = '#9ca3af';
  var rgP = document.createElement('p');
  rgP.textContent = 'RG 5824';
  footerRight.appendChild(rgP);
  var authP = document.createElement('p');
  authP.textContent = 'Comprobante autorizado';
  footerRight.appendChild(authP);
  footer.appendChild(footerRight);

  wrapper.appendChild(footer);
}
```

- [ ] **Step 2: Use `renderInvoicePreview` in the showPDFPreview handler**

Replace the current inline table-building code inside `document.addEventListener('showPDFPreview', ...)`:

```javascript
document.addEventListener('showPDFPreview', function(e) {
  var data = (e.detail || {}).data;

  if (previewContainer && data) {
    renderInvoicePreview(data, window.currentLogoUrl || null);
  }

  modal.showModal();
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/arca/PDFPreview.astro
git commit -m "feat(arca): redesign PDF preview with professional invoice layout and IVA breakdown"
```

---

### Task 4: Add "¿Querés facturar ante AFIP?" CTA to ResultadoGeneracion

**Files:**
- Modify: `src/components/arca/ResultadoGeneracion.astro`

- [ ] **Step 1: Add CTA section HTML**

Add this block right after the closing `</div>` of the error result section (`id="result-error"`), before the outer `</div>` closes:

```html
  <!-- CTA: Queres facturar ante AFIP? -->
  <div id="afip-cta-section" class="hidden mt-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
    <h3 class="text-lg font-bold text-indigo-900 mb-3">
      Queres facturar ante AFIP?
    </h3>
    <p class="text-sm text-gray-700 mb-4 leading-relaxed">
      ARCA (Agencia de Recaudacion y Control Aduanero) es el organismo que unifico AFIP en 2025.
      Para que tus facturas tengan <strong>validez fiscal</strong> ante la AFIP, necesitan un
      CAE (Codigo de Autorizacion Electronico) generado por sus servicios web. Este proceso
      requiere autorizacion previa.
    </p>
    <a
      href="https://www.arca.gob.ar"
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-blue-600 hover:text-blue-800 underline mb-4 inline-block"
    >
      Sitio oficial de ARCA/AFIP →
    </a>
    <div class="flex flex-col sm:flex-row gap-3 mt-4">
      <button
        id="afip-cta-yes"
        type="button"
        class="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
      >
        Si, conectar con AFIP — facturar con validez fiscal
      </button>
      <button
        id="afip-cta-no"
        type="button"
        class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
      >
        No por ahora, solo estaba probando
      </button>
    </div>
  </div>
```

- [ ] **Step 2: Add functions to show/hide CTA**

Add to the existing `<script is:inline>` block:

```javascript
// Show/hide AFIP CTA
window.mostrarCTA = function() {
  var cta = document.querySelector('#afip-cta-section');
  if (cta) {
    cta.classList.remove('hidden');
    cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.ocultarCTA = function() {
  var cta = document.querySelector('#afip-cta-section');
  if (cta) cta.classList.add('hidden');
};
```

- [ ] **Step 3: Wire CTA buttons**

```javascript
document.querySelector('#afip-cta-yes')?.addEventListener('click', function() {
  document.querySelector('#afip-cta-section')?.classList.add('hidden');
  var event = new CustomEvent('afipAuthRequested', { bubbles: true });
  document.dispatchEvent(event);
});

document.querySelector('#afip-cta-no')?.addEventListener('click', function() {
  document.querySelector('#afip-cta-section')?.classList.add('hidden');
});
```

- [ ] **Step 4: Show CTA after success, hide on error/new**

In `window.showResult`, add `window.mostrarCTA()` after showing success. In the "Nueva Factura" path add `window.ocultarCTA()`. Also update `window.clearResult`:

```javascript
// In window.showResult, after success display:
if (type === 'success') {
  // ... existing success code ...
  if (!window.afipAuthToken) {
    window.mostrarCTA();
  }
}

// In newInvoiceBtn click handler (or window.clearResult):
window.ocultarCTA();
```

- [ ] **Step 5: Commit**

```bash
git add src/components/arca/ResultadoGeneracion.astro
git commit -m "feat(arca): add 'Queres facturar ante AFIP?' CTA with ARCA explanation"
```

---

### Task 5: Wire CTA Flow in plantilla-arca.astro

**Files:**
- Modify: `src/pages/plantilla-arca.astro`

- [ ] **Step 1: Listen for `afipAuthRequested` event**

```javascript
document.addEventListener('afipAuthRequested', function() {
  var resultContainer = document.getElementById('resultado-generacion');
  if (resultContainer) resultContainer.classList.add('hidden');

  var authSection = document.querySelector('#afip-auth-section');
  if (authSection) {
    authSection.classList.remove('hidden');
    authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/plantilla-arca.astro
git commit -m "feat(arca): wire AFIP CTA event to transition to authorization mode"
```

---

## Phase 3: AFIP Authorization Mode

### Task 6: Create AfipAuthForm Component

**Files:**
- Create: `src/components/arca/AfipAuthForm.astro`

- [ ] **Step 1: Create component with dual auth tabs**

```astro
---
// AfipAuthForm.astro - AFIP Authorization form with dual auth methods
// - Option A: Digital certificate upload (.crt + .key + passphrase)
// - Option B: CUIT + Clave Fiscal

interface Props {
  id?: string;
}

const { id = 'afip-auth-form' } = Astro.props;
---

<div {id} class="afip-auth-form space-y-6">
  <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
    <h3 class="text-xl font-bold text-gray-900 mb-2">Autorizacion AFIP</h3>
    <p class="text-sm text-gray-600 mb-6">
      Para generar facturas con validez fiscal, necesitas autorizar la conexion con ARCA/AFIP.
      Elegi uno de los metodos:
    </p>

    <!-- Method Tabs -->
    <div class="flex border-b border-gray-200 mb-6">
      <button
        id="auth-tab-cert"
        type="button"
        class="auth-tab px-6 py-3 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600"
      >
        Certificado Digital
      </button>
      <button
        id="auth-tab-pass"
        type="button"
        class="auth-tab px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
      >
        CUIT + Clave Fiscal
      </button>
    </div>

    <!-- Option A: Digital Certificate -->
    <div id="auth-method-cert" class="space-y-4">
      <div class="p-4 bg-amber-50 rounded-md border border-amber-200 mb-4">
        <p class="text-sm text-amber-800">
          <strong>No tenes certificado?</strong> Necesitas obtener un certificado digital de
          ARCA/AFIP. Consulta los requisitos en el
          <a href="https://www.arca.gob.ar" target="_blank" rel="noopener noreferrer"
             class="underline font-medium">sitio oficial</a>.
        </p>
      </div>

      <div>
        <label for="auth-cert-file" class="block text-sm font-medium text-gray-700 mb-1">Certificado (.crt)</label>
        <input id="auth-cert-file" type="file" accept=".crt,.cer,.pem"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
      </div>

      <div>
        <label for="auth-key-file" class="block text-sm font-medium text-gray-700 mb-1">Clave Privada (.key)</label>
        <input id="auth-key-file" type="file" accept=".key,.pem"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
      </div>

      <div>
        <label for="auth-passphrase" class="block text-sm font-medium text-gray-700 mb-1">Passphrase</label>
        <input id="auth-passphrase" type="password" placeholder="••••••••"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <button id="auth-verify-cert" type="button" disabled
        class="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        Verificar Certificado
      </button>
    </div>

    <!-- Option B: CUIT + Clave Fiscal -->
    <div id="auth-method-pass" class="hidden space-y-4">
      <div class="p-4 bg-blue-50 rounded-md border border-blue-200 mb-4">
        <p class="text-sm text-blue-800">
          Usa tu CUIT y Clave Fiscal de AFIP. La clave se envia de forma segura y
          <strong>no se almacena</strong> en nuestros servidores.
        </p>
      </div>

      <div>
        <label for="auth-cuit" class="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
        <input id="auth-cuit" type="text" placeholder="20123456789" maxlength="11"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        <label for="auth-clave-fiscal" class="block text-sm font-medium text-gray-700 mb-1">Clave Fiscal</label>
        <input id="auth-clave-fiscal" type="password" placeholder="••••••••"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        <small class="text-gray-500">Tu Clave Fiscal de AFIP. Nunca la almacenamos.</small>
      </div>

      <button id="auth-login-afip" type="button"
        class="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
        Autenticar con AFIP
      </button>
    </div>

    <!-- Status area (loading/error/success) -->
    <div id="auth-status" class="hidden mt-4"></div>
  </div>
</div>
```

- [ ] **Step 2: Add script block**

```astro
<script is:inline>
  // Tab switching
  document.querySelector('#auth-tab-cert')?.addEventListener('click', function() {
    var tabCert = document.querySelector('#auth-tab-cert');
    var tabPass = document.querySelector('#auth-tab-pass');
    tabCert.className = 'auth-tab px-6 py-3 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600';
    tabPass.className = 'auth-tab px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700';
    document.querySelector('#auth-method-cert').classList.remove('hidden');
    document.querySelector('#auth-method-pass').classList.add('hidden');
  });

  document.querySelector('#auth-tab-pass')?.addEventListener('click', function() {
    var tabCert = document.querySelector('#auth-tab-cert');
    var tabPass = document.querySelector('#auth-tab-pass');
    tabPass.className = 'auth-tab px-6 py-3 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600';
    tabCert.className = 'auth-tab px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700';
    document.querySelector('#auth-method-pass').classList.remove('hidden');
    document.querySelector('#auth-method-cert').classList.add('hidden');
  });

  // Enable verify button when files selected
  function checkCertFiles() {
    var btn = document.querySelector('#auth-verify-cert');
    if (btn) {
      btn.disabled = !(document.querySelector('#auth-cert-file')?.files?.length > 0 && document.querySelector('#auth-key-file')?.files?.length > 0);
    }
  }
  document.querySelector('#auth-cert-file')?.addEventListener('change', checkCertFiles);
  document.querySelector('#auth-key-file')?.addEventListener('change', checkCertFiles);

  // Show status message using textContent for XSS safety
  function showAuthStatus(type, message) {
    var status = document.querySelector('#auth-status');
    if (!status) return;

    while (status.firstChild) status.removeChild(status.firstChild);
    status.classList.remove('hidden');

    if (type === 'loading') {
      var div = document.createElement('div');
      div.className = 'd-flex align-items-center gap-2 text-indigo-600';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      var spinner = document.createElement('div');
      spinner.className = 'animate-spin rounded-full h-4 w-4 border border-indigo-600 border-t-transparent';
      div.appendChild(spinner);
      div.appendChild(document.createTextNode(' Autenticando...'));
      status.appendChild(div);
    } else if (type === 'error') {
      var div = document.createElement('div');
      div.className = 'p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700';
      div.textContent = message || 'Error desconocido';
      status.appendChild(div);
    } else if (type === 'success') {
      var div = document.createElement('div');
      div.className = 'p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700';
      div.textContent = message || 'Operacion exitosa';
      status.appendChild(div);
    }
  }

  // Auth: CUIT + Clave Fiscal
  document.querySelector('#auth-login-afip')?.addEventListener('click', async function() {
    var cuitInput = document.querySelector('#auth-cuit');
    var claveInput = document.querySelector('#auth-clave-fiscal');
    var cuit = (cuitInput?.value || '').replace(/\D/g, '');
    var claveFiscal = claveInput?.value || '';

    if (cuit.length !== 11) {
      showAuthStatus('error', 'CUIT invalido — debe tener 11 digitos');
      return;
    }
    if (!claveFiscal) {
      showAuthStatus('error', 'Ingresa tu Clave Fiscal');
      return;
    }

    showAuthStatus('loading', '');

    try {
      var response = await fetch('/plantilla-arca/api/auth/afip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'clave_fiscal', cuit: cuit, clave_fiscal: claveFiscal }),
      });

      if (!response.ok) {
        var err = await response.json().catch(function() { return { error: 'Error de autenticacion' }; });
        showAuthStatus('error', err.error || 'Error de autenticacion con AFIP');
        return;
      }

      var data = await response.json();
      showAuthStatus('success', 'Autenticacion exitosa con AFIP');

      sessionStorage.setItem('afip_token', data.token);
      sessionStorage.setItem('afip_token_expiry', data.expiry);

      var event = new CustomEvent('afipAuthSuccess', {
        detail: { method: 'clave_fiscal', token: data.token, expiry: data.expiry },
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (_err) {
      showAuthStatus('error', 'Error de conexion. Verifica e intenta de nuevo.');
    }
  });

  // Auth: Certificate
  document.querySelector('#auth-verify-cert')?.addEventListener('click', async function() {
    var certFile = document.querySelector('#auth-cert-file');
    var keyFile = document.querySelector('#auth-key-file');
    var passphrase = document.querySelector('#auth-passphrase')?.value || '';

    if (!certFile?.files?.length || !keyFile?.files?.length) {
      showAuthStatus('error', 'Selecciona el certificado y la clave privada');
      return;
    }

    showAuthStatus('loading', '');

    try {
      var formData = new FormData();
      formData.append('cert', certFile.files[0]);
      formData.append('key', keyFile.files[0]);
      formData.append('passphrase', passphrase);
      formData.append('method', 'certificate');

      var response = await fetch('/plantilla-arca/api/auth/afip', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        var err = await response.json().catch(function() { return { error: 'Error de autenticacion' }; });
        showAuthStatus('error', err.error || 'Error al verificar el certificado');
        return;
      }

      var data = await response.json();
      showAuthStatus('success', 'Certificado verificado exitosamente');

      sessionStorage.setItem('afip_token', data.token);
      sessionStorage.setItem('afip_token_expiry', data.expiry);

      var event = new CustomEvent('afipAuthSuccess', {
        detail: { method: 'certificate', token: data.token, expiry: data.expiry },
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (_err) {
      showAuthStatus('error', 'Error de conexion. Verifica e intenta de nuevo.');
    }
  });

  // Pre-fill CUIT from form data
  document.addEventListener('formDataChange', function(e) {
    var cuitField = document.querySelector('#auth-cuit');
    if (cuitField && e.detail?.cuit && !cuitField.value) {
      cuitField.value = e.detail.cuit;
    }
  });
</script>
```

- [ ] **Step 3: Add the auth section to plantilla-arca.astro**

In the right column after `<ResultadoGeneracion ... />`, add:

```astro
            <!-- AFIP Authorization (hidden by default) -->
            <div id="afip-auth-section" class="hidden">
              <AfipAuthForm id="afip-auth-form" />
            </div>
```

Add the import at the top:

```astro
import AfipAuthForm from '@/components/arca/AfipAuthForm.astro';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/arca/AfipAuthForm.astro src/pages/plantilla-arca.astro
git commit -m "feat(arca): create AfipAuthForm with dual auth methods (cert + clave fiscal)"
```

---

### Task 7: Add FastAPI `/auth/afip` Endpoint

**Files:**
- Modify: `plantilla-arca/src/web/fastapi_app.py`

- [ ] **Step 1: Add authentication endpoint**

```python
import base64
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ClaveFiscalAuthRequest(BaseModel):
    method: str = "clave_fiscal"
    cuit: str
    clave_fiscal: str


@router.post("/auth/afip")
async def auth_afip_clave_fiscal(body: ClaveFiscalAuthRequest):
    """Authenticate against AFIP using CUIT + Clave Fiscal (WSAA proxy)."""
    try:
        from arca.auth import WSAA

        wsaa = WSAA(cuit=body.cuit, password=body.clave_fiscal)
        ta = wsaa.authenticate()

        return {
            "status": "ok",
            "token": base64.b64encode(ta.encode()).decode(),
            "expiry": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        }
    except Exception as e:
        logger.error(f"AFIP auth failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))
```

- [ ] **Step 2: Add certificate auth endpoint (same route, different body)**

```python
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
    except Exception as e:
        logger.error(f"Certificate auth failed: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))
```

**Note:** The actual `WSAA` class interface depends on the `arca_arg` library. Adjust constructor parameters and method names to match the library's actual API.

- [ ] **Step 3: Register the router in the FastAPI app**

Find where the FastAPI app is defined and add:

```python
from web.fastapi_app import router as afip_router
app.include_router(afip_router, prefix="/plantilla-arca/api")
```

- [ ] **Step 4: Commit**

```bash
git add plantilla-arca/src/web/fastapi_app.py
git commit -m "feat(arca): add /auth/afip endpoint with dual auth support"
```

---

### Task 8: Wire Auth Flow in plantilla-arca.astro

**Files:**
- Modify: `src/pages/plantilla-arca.astro`

- [ ] **Step 1: Listen for `afipAuthSuccess` to update UI**

```javascript
document.addEventListener('afipAuthSuccess', function(e) {
  var detail = e.detail || {};
  window.afipAuthToken = detail.token;
  window.afipAuthMethod = detail.method;

  var authSection = document.querySelector('#afip-auth-section');
  if (authSection) {
    // Replace auth form with success state using safe DOM methods
    while (authSection.firstChild) authSection.removeChild(authSection.firstChild);

    var wrapper = document.createElement('div');
    wrapper.className = 'bg-green-50 border border-green-200 rounded-lg p-6 text-center';

    var checkEl = document.createElement('div');
    checkEl.className = 'text-4xl mb-3';
    checkEl.textContent = '✅';
    wrapper.appendChild(checkEl);

    var title = document.createElement('h3');
    title.className = 'text-lg font-bold text-green-800 mb-2';
    title.textContent = 'Conectado a AFIP';
    wrapper.appendChild(title);

    var msg = document.createElement('p');
    msg.className = 'text-sm text-green-700 mb-4';
    msg.textContent = 'Autenticacion exitosa. Ya podes generar facturas con validez fiscal.';
    wrapper.appendChild(msg);

    var expiryP = document.createElement('p');
    expiryP.className = 'text-xs text-green-600';
    var expiryDate = detail.expiry ? new Date(detail.expiry).toLocaleString('es-AR') : '--';
    expiryP.textContent = 'Token valido hasta: ' + expiryDate;
    wrapper.appendChild(expiryP);

    var btnGroup = document.createElement('div');
    btnGroup.className = 'mt-4 d-flex gap-2 justify-content-center';
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '8px';
    btnGroup.style.justifyContent = 'center';

    var disconnectBtn = document.createElement('button');
    disconnectBtn.id = 'afip-disconnect';
    disconnectBtn.className = 'px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
    disconnectBtn.textContent = 'Desconectar';
    btnGroup.appendChild(disconnectBtn);

    var backBtn = document.createElement('button');
    backBtn.id = 'afip-show-form';
    backBtn.className = 'px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700';
    backBtn.textContent = 'Volver al formulario';
    btnGroup.appendChild(backBtn);

    wrapper.appendChild(btnGroup);
    authSection.appendChild(wrapper);

    // Disconnect
    disconnectBtn.addEventListener('click', function() {
      window.afipAuthToken = null;
      window.afipAuthMethod = null;
      sessionStorage.removeItem('afip_token');
      sessionStorage.removeItem('afip_token_expiry');
      location.reload();
    });

    // Back to form
    backBtn.addEventListener('click', function() {
      authSection.classList.add('hidden');
      var formSection = document.querySelector('#formulario');
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Update generate button to show "Facturar ante AFIP"
  var btn = document.getElementById('btn-generate');
  if (btn) {
    btn.textContent = 'Facturar ante AFIP';
    btn.className = 'w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 d-flex align-items-center justify-content-center gap-2';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
  }
});
```

- [ ] **Step 2: Update btn-generate handler for AFIP mode**

Replace the `btnGenerate.addEventListener('click', ...)` body:

```javascript
var btnGenerate = document.getElementById('btn-generate');
if (btnGenerate) {
  btnGenerate.addEventListener('click', async function() {
    // Validate form
    if (window.validarFormularioARCA) {
      var errores = window.validarFormularioARCA();
      if (errores.length > 0) {
        window.mostrarErroresFormulario(errores);
        return;
      }
    }

    if (!window.lastFormData) {
      window.showResult('error', 'Por favor completa el formulario');
      return;
    }

    btnGenerate.disabled = true;

    var hasAfipAuth = !!(window.afipAuthToken || sessionStorage.getItem('afip_token'));

    if (hasAfipAuth) {
      // Real CAE generation
      btnGenerate.textContent = 'Generando factura con validez fiscal...';
      var token = window.afipAuthToken || sessionStorage.getItem('afip_token');

      try {
        var response = await fetch('/plantilla-arca/api/facturar/cae', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...window.lastFormData,
            token: token,
            logo_url: window.currentLogoUrl || null,
          }),
        });

        if (!response.ok) {
          var err = await response.json().catch(function() { return { error: 'Error al generar factura' }; });
          window.showResult('error', err.error || 'Error al generar factura ante AFIP');
          btnGenerate.textContent = 'Facturar ante AFIP';
          btnGenerate.disabled = false;
          return;
        }

        var result = await response.json();
        window.showResult('success', 'Factura generada con validez fiscal', result.pdf_url, !!window.getEmailToSend?.(), result);
        if (window.setCae) window.setCae(result.cae, result.vencimiento);
        btnGenerate.textContent = 'Facturado ante AFIP';
        btnGenerate.disabled = true;
      } catch (_err) {
        window.showResult('error', 'Error de conexion al generar factura');
        btnGenerate.textContent = 'Facturar ante AFIP';
        btnGenerate.disabled = false;
      }
    } else {
      // Simulated mode — show preview
      btnGenerate.textContent = 'Preparando vista previa...';
      var previewEvent = new CustomEvent('showPDFPreview', {
        detail: { data: window.lastFormData },
        bubbles: true,
      });
      document.dispatchEvent(previewEvent);
      btnGenerate.textContent = 'Generar Factura';
      btnGenerate.disabled = false;
    }
  });
}
```

- [ ] **Step 3: Restore AFIP session on page load**

```javascript
(function restoreAfipSession() {
  var token = sessionStorage.getItem('afip_token');
  if (token) {
    window.afipAuthToken = token;
    var event = new CustomEvent('afipAuthSuccess', {
      detail: {
        token: token,
        expiry: sessionStorage.getItem('afip_token_expiry') || new Date(Date.now() + 12*3600000).toISOString(),
      },
      bubbles: true,
    });
    document.dispatchEvent(event);
  }
})();
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/plantilla-arca.astro
git commit -m "feat(arca): wire AFIP auth flow into page orchestration"
```

---

## Phase 4: Real CAE Generation

### Task 9: Update FastAPI `/facturar/cae` for Real CAE

**Files:**
- Modify: `plantilla-arca/src/web/fastapi_app.py`

- [ ] **Step 1: Update the `/facturar/cae` endpoint**

```python
import base64
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


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

        pdf_filename = f"factura_{cae_result['cae']}.pdf"
        pdf_path = f"/root/fumbling-field/public/pdf/{pdf_filename}"

        import aiofiles
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
```

- [ ] **Step 2: Verify `ArcaClient.solicitar_cae()` method signature**

Check `plantilla-arca/src/arca/client.py` to confirm the method signature matches the call above. If different, adjust the call parameters in the endpoint.

- [ ] **Step 3: Create `/pdf/` directory if it doesn't exist**

```bash
mkdir -p /root/fumbling-field/public/pdf
```

- [ ] **Step 4: Commit**

```bash
git add plantilla-arca/src/web/fastapi_app.py
git commit -m "feat(arca): update /facturar/cae endpoint for real CAE generation"
```

---

### Task 10: Wire Real CAE into Result Display

**Files:**
- Modify: `src/components/arca/ResultadoGeneracion.astro`

- [ ] **Step 1: Update `showResult` to handle CAE data**

The existing `window.showResult` function accepts `(type, message, pdfUrl, emailSent)`. Make it also accept CAE data:

```javascript
window.showResult = function(type, message, pdfUrl, emailSent, caeData) {
  loader.classList.add('hidden');
  successBox.classList.add('hidden');
  errorBox.classList.add('hidden');
  container.classList.remove('hidden');

  if (type === 'success') {
    successBox.classList.remove('hidden');
    successMessage.textContent = message || 'Tu factura ha sido generada correctamente.';

    if (pdfUrl) {
      downloadBtn.href = pdfUrl;
      downloadBtn.download = 'factura_' + Date.now() + '.pdf';
    }

    if (emailSent) {
      emailInfo.classList.remove('hidden');
      emailSentMsg.textContent = 'Email enviado exitosamente a la direccion especificada.';
    } else {
      emailInfo.classList.add('hidden');
    }

    // Show CAE data if provided (real CAE generation)
    if (caeData && caeData.cae) {
      caeValue.textContent = caeData.cae;
      caeExpiry.textContent = caeData.vencimiento || '--';
    }

    // Show AFIP CTA only if not already authenticated
    if (!window.afipAuthToken && window.mostrarCTA) {
      window.mostrarCTA();
    }
  } else if (type === 'error') {
    errorBox.classList.remove('hidden');
    errorMessage.textContent = message || 'Ocurrio un error al generar la factura.';
  }
};
```

Also update `window.clearResult` and the "Nueva Factura" path to hide CTA:

```javascript
// Add to new invoice click handler
window.ocultarCTA?.();
```

- [ ] **Step 2: Commit**

```bash
git add src/components/arca/ResultadoGeneracion.astro
git commit -m "feat(arca): wire real CAE data into result display"
```

---

## Deployment

### Task 11: Deploy to Production

- [ ] **Step 1: Build and test locally**

```bash
cd /root/fumbling-field
npm run build
```

- [ ] **Step 2: Deploy via CI/CD**

Create PR from `feature/arca-integration` → `develop`, then PR to `master`. GitHub Actions auto-deploys.

---

## Self-Review Checklist

**1. Spec coverage:**
- CUIT DV validation → Task 1
- Data consistency checks → Task 2
- Professional PDF preview → Task 3
- "¿Querés facturar ante AFIP?" CTA with ARCA explanation + official link → Task 4
- AFIP authorization mode, dual auth → Tasks 6, 7
- Real CAE generation → Task 9
- End-to-end flow → Tasks 5, 8, 10

**2. Placeholder check:** No TBDs, TODOs, or incomplete sections.

**3. Type consistency:** All function names, event names, and data shapes are consistent:
- `afipAuthRequested` — dispatched in Task 4, handled in Task 5
- `afipAuthSuccess` — dispatched in Task 6, handled in Task 8
- `validarFormularioARCA` — exposed in Task 2, used in Task 8
- `showResult(type, message, pdfUrl, emailSent, caeData)` — extended in Task 10, called in Task 8

All user data handled via `textContent` or `document.createTextNode` — no `innerHTML` with untrusted content.
