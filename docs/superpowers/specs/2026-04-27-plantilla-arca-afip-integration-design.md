# Plantilla ARCA — AFIP Integration Design

**Date:** 2026-04-27
**Status:** Draft
**Author:** Claude (via brainstorming + user direction)

---

## Overview

The Plantilla ARCA page (`/plantilla-arca/`) currently provides a form to generate simulated invoices with a mock PDF preview. This spec extends it in four phases toward real AFIP integration, culminating in actual CAE generation via ARCA web services.

The design preserves the existing UX flow: the user fills company + invoice data, sees a preview, and gets a result. Each phase adds fidelity without breaking prior steps.

---

## Phase 1: Improved Form Validation (Simulated)

### What Changes

**CUIT digit validation** — The CUIT field currently accepts 11 digits via `pattern` attribute but does not validate the check digit. A client-side JS function will compute and verify the CUIT's last digit using the AFIP standard algorithm (factor weights 5-4-3-2-7-6-5-4-3-2, modulus 11).

**Data consistency checks** — Before showing the PDF preview, validate:
- CUIT is 11 digits and passes check digit
- `razon_social` is non-empty
- `importe_total` > 0
- `fecha_emision` is not in the future (or within a reasonable range)
- `tipo_comprobante` is selected

### Where

`src/components/arca/FormularioARCA.astro` — Add validation function and wire it to the `formDataChange` event. Display inline error messages per field.

### Non-Goals

No server-side validation yet. No connection to ARCA in this phase.

---

## Phase 2: Professional PDF Preview + "¿Querés facturar ante AFIP?" CTA

### Professional PDF Preview

The current PDFPreview modal renders a simple HTML table. Replace it with a styled visual that resembles a real invoice layout:

- Company header area: logo (if uploaded), `razon_social`, `cuit`, `domicilio`, `condicion_iva`
- Invoice details: `tipo_comprobante`, `fecha_emision`, unique comprobante number (simulated)
- Line items: `descripcion`, `importe_total` with IVA breakdown (21% by default, computed)
- Totals: subtotal, IVA, total final
- Footer: CAE placeholder text ("CAE: ____" with explanatory note)

Styled to look like a draft invoice using Tailwind, printed on white card with subtle borders.

### Updated Result Display

When the user confirms generation, `ResultadoGeneracion` shows:

- **Success state**: Professional result card showing:
  - Comprobante number
  - CAE placeholder ("Generado en modo simulación — sin validez fiscal")
  - Download button (downloads the same HTML-as-PDF preview, or a notice that real PDF requires AFIP authorization)
  - Nueva Factura button

- **"¿Querés facturar ante AFIP?" CTA** — A new section at the bottom of the result area:
  - Title: "¿Querés facturar ante AFIP?"
  - Explanation paragraph about ARCA (see below)
  - Official ARCA link
  - Button: "Sí, conectar con AFIP — facturar con validez fiscal"
  - Secondary link: "No por ahora, solo estaba probando"

#### ARCA Explanation Text

> ARCA (Agencia de Recaudación y Control Aduanero) es el organismo que unificó AFIP en 2025. Para que tus facturas tengan validez fiscal ante la AFIP, necesitan un CAE (Código de Autorización Electrónico) generado por sus servicios web. Este proceso requiere autorización previa.
>
> [Sitio oficial de ARCA/AFIP](https://www.arca.gob.ar)

### Where

- `src/components/arca/PDFPreview.astro` — Major restyle of the preview layout
- `src/components/arca/ResultadoGeneracion.astro` — Add CTA section
- `src/pages/plantilla-arca.astro` — Handle CTA event to transition to Phase 3

---

## Phase 3: AFIP Authorization Mode

### Flow

1. User clicks "Sí, conectar con AFIP — facturar con validez fiscal"
2. Page transitions to authorization mode — a new section replaces the result area
3. Two authentication options presented side by side:

### Option A: Certificado Digital (.crt + .key)

- Upload `.crt` file input
- Upload `.key` file input
- Private key passphrase input (password field)
- "Verificar certificado" button

Requires the user to have obtained a digital certificate from ARCA/AFIP (which they must request externally).

### Option B: CUIT + Clave Fiscal

- CUIT input (pre-filled from form data)
- Clave Fiscal input (password field, the same credential used for AFIP online services)
- "Autenticar con AFIP" button

This uses ARCA's WSAA (Autenticación) service with user-supplied credentials — the server proxies the SOAP request.

### Auth Storage Decision

Credentials are NOT stored server-side. The user must re-authorize each session (or re-upload on page refresh). `sessionStorage` can keep them during the current browser tab session for convenience.

### UX Notes

- Clear labels explaining both options in plain Spanish
- Tooltip/help text: "Necesitás tener una cuenta activa en ARCA/AFIP para usar esta función. [Más información](https://www.arca.gob.ar)"
- Validation of inputs before sending to server
- Error states for invalid certs, wrong password, expired clave fiscal

### Where

- New component: `src/components/arca/AfipAuthForm.astro`
- `src/pages/plantilla-arca.astro` — Orchestrate auth section visibility
- `plantilla-arca/src/web/fastapi_app.py` — New endpoint `POST /auth/afip` that proxies WSAA

---

## Phase 4: Real CAE Generation via ARCA

### Flow

1. After successful AFIP authentication (Phase 3), the user must submit the invoice for real CAE generation
2. A new "Facturar ante AFIP" button appears in the form actions area
3. On click: sends invoice data + auth token to `POST /facturar/cae`
4. FastAPI endpoint calls `ArcaClient.solicitar_cae()` with real auth (not mock)
5. On success: receives CAE, vencimiento, comprobante number
6. PDF is generated server-side via ReportLab with QR code
7. Result shown in `ResultadoGeneracion` — real CAE, real PDF download

### Error Handling

- ARCA service unavailable: show retry prompt
- Invalid auth (token expired): redirect back to Phase 3 authorization
- Invoice rejected (data validation by ARCA): show specific error message from ARCA response
- Rate limiting: notify user and suggest retry later

### Where

- `plantilla-arca/src/web/fastapi_app.py` — New endpoint `POST /facturar/cae` (replacing mock)
- `plantilla-arca/src/arca/client.py` — Already has `solicitar_cae()`; may need auth context improvements
- `plantilla-arca/src/pdf/generator.py` — Already generates PDF with QR; may need adjustments
- `plantilla-arca/src/models.py` — Already has `Comprobante` model
- `src/pages/plantilla-arca.astro` — Wire the new endpoint

### Auth Token Flow

```
Client (browser)                    FastAPI (server)              ARCA/AFIP
      │                                   │                           │
      │  POST /auth/afip                  │                           │
      │  {cuit, clave_fiscal}             │                           │
      │ ──────────────────────────►       │                           │
      │                                   │  WSAA login (SOAP)       │
      │                                   │ ──────────────────────►   │
      │                                   │ ◄──────────────────────── │
      │                                   │  token + tokenId          │
      │  {token, tokenId, expiry}         │                           │
      │ ◄──────────────────────────       │                           │
      │                                   │                           │
      │  POST /facturar/cae               │                           │
      │  {invoice_data, token}            │                           │
      │ ──────────────────────────►       │                           │
      │                                   │  WSMTXCA (SOAP)          │
      │                                   │ ──────────────────────►   │
      │                                   │ ◄──────────────────────── │
      │                                   │  CAE, vencimiento, etc.  │
      │  {cae, vencimiento, pdf_url}      │                           │
      │ ◄──────────────────────────       │                           │
```

---

## File Changes Summary

### Frontend (Astro)

| File | Phase | Change |
|------|-------|--------|
| `src/components/arca/FormularioARCA.astro` | 1 | Add CUIT DV validation, inline errors, consistency checks |
| `src/components/arca/PDFPreview.astro` | 2 | Redesign with professional invoice layout, IVA breakdown, simulated CAE |
| `src/components/arca/ResultadoGeneracion.astro` | 2 | Add "¿Querés facturar ante AFIP?" CTA with ARCA explanation + link |
| `src/components/arca/AfipAuthForm.astro` | 3 | NEW — dual auth method form (cert upload + CUIT/clave fiscal) |
| `src/pages/plantilla-arca.astro` | 1-4 | Orchestrate validation, auth flow, and CAE generation |

### Backend (FastAPI — plantilla-arca submodule)

| File | Phase | Change |
|------|-------|--------|
| `plantilla-arca/src/web/fastapi_app.py` | 3-4 | Add `/auth/afip` + update `/facturar/cae` for real auth |
| `plantilla-arca/src/arca/client.py` | 3-4 | May need auth context parameter updates |
| `plantilla-arca/src/pdf/generator.py` | 4 | Minor adjustments if needed |
| `plantilla-arca/src/models.py` | 4 | No changes expected (already has auth fields) |

---

## Open Questions

1. Clave Fiscal auth: AFIP's WSAA does not directly accept CUIT+password. It requires a digital certificate (XML signature). For CUIT+Clave Fiscal, the server would need to use ARCA's "Clave Fiscal" web login flow (which may require a different endpoint or scraping). **Recommendation**: Lead with cert-based auth (Option A) as primary; investigate Clave Fiscal API separately. If Clave Fiscal API is unavailable, Option B can proxy through the user's browser (redirect to ARCA login page).

2. Token storage duration: WSAA tokens expire after a fixed period (~12 hours). Should we persist across page reloads in `sessionStorage`?

3. Rate limits: AFIP/ARCA web services have rate limits. Need a backoff strategy.

---

## Implementation Order

1. Phase 1: CUIT DV validation + inline errors
2. Phase 2: Professional preview + AFIP CTA
3. Phase 3: Auth form component + `/auth/afip` endpoint
4. Phase 4: Real CAE generation wired end-to-end

Each phase is self-contained and deployable independently.
