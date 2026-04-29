# Plantilla ARCA v1.0.0 Launch — Social Media Announcements

## 🐦 Twitter/X

### Tweet 1 — Lead (with link)
```
🚀 Presentamos Plantilla ARCA — Facturación electrónica RG 5824, totalmente GRATIS y open source.

Sin Tango. Sin Bejerman. Sin $500/mes.
✅ Genera CAE en 2-3 segundos
✅ PDFs válidos con QR
✅ Código auditable (licencia MIT)

Probá online en 5 min: https://ultimamilla.com.ar/plantilla-arca/

#AFIP #RG5824 #OpenSource #Pymes
```

### Tweet 2 — Problem/Solution
```
Martín es contador. Pagaba $500/mes a Tango por RG 5824. Se enfureció.

"¿Por qué pago $6.000/año por un sistema que no me deja ver el código y me bloquea si me quiero ir?"

Hoy genera 200 facturas/mes sin pagar. Audita cada línea de código.

Eso es lo que entregamos: https://github.com/UltimaMilla/plantilla-arca

#Facturación #Pymes #Argentina
```

### Tweet 3 — Tech Stack
```
¿Cómo funciona Plantilla ARCA?

Arquitectura simple:
• Python 3.10+ (como usa AFIP)
• Web Services ARCA directo
• PostgreSQL (auditable)
• ReportLab (PDFs con QR)
• Docker (funciona en cualquier lado)

Documentación completa:
https://github.com/UltimaMilla/plantilla-arca#readme

#Python #AFIP #Docker
```

### Tweet 4 — CTA
```
¿Contadora? ¿Director? ¿Profesional independiente?

RG 5824 es obligatoria en Argentina. Pero no necesitás pagar licencias.

Plantilla ARCA = Código abierto, MIT, funcionando ahora.

Demo online: https://ultimamilla.com.ar/plantilla-arca/
Blog: https://ultimamilla.com.ar/blog/plantilla-arca-facturacion-electronica-gratis/
```

---

## 💼 LinkedIn

### LinkedIn Post 1 — Professional angle
```
🚀 Anunciamos Plantilla ARCA: Herramienta Open Source para Cumplimiento RG 5824

Durante 3 años asesoramos contadores, directores y pymes sobre el cumplimiento de la Resolución General 5824 de AFIP para facturación electrónica. Identificamos el problema: las soluciones existentes son costosas ($500/mes+) y generan dependencia de terceros.

Hoy entregamos la solución: Plantilla ARCA.

✅ Generación automática de CAE en 2-3 segundos
✅ PDFs válidos con QR de verificación
✅ Auditoría completa en base de datos propia
✅ 100% gratis (licencia MIT, open source)
✅ Se conecta directo a Web Services ARCA — sin intermediarios

**Casos de uso reales:**
• María (contadora): Reduce asesoría a clientes sobre herramientas de 2-3h/mes a 0. Ahora asesora sobre RG 5824 (su core). Ahorro: $300/mes en licencias de sus clientes.

• Juan (PyME): Descargó, instaló con Docker en 15 min, probó en homologación, ahora genera 400 facturas/mes. Costo de software: $0.

• Laura (abogada): Integró con sistema de turnos. 8 abogados, emisión automática de facturas. Antes: $800/mes en contadora. Ahora: proceso automático, gratis.

**Demo online (sin instalar):**
https://ultimamilla.com.ar/plantilla-arca/

**Código fuente y documentación:**
https://github.com/UltimaMilla/plantilla-arca

**Roadmap Q2-Q4 2026:**
• Notas de Crédito / Débito
• API REST para integraciones
• Batch processing (500 facturas en 1 clic)
• Dashboard de auditoría
• Móvil (React Native)
• Webhooks de confirmación

Creemos que el cumplimiento fiscal no debería ser un negocio extractivo, sino una utilidad pública.

¿Contadores, directores, freelancers con CUIT que facturan en Argentina? ¿Cuál es su experiencia actual con RG 5824?

#AFIP #Facturación #OpenSource #Pymes #Argentina #RG5824 #Tecnología
```

### LinkedIn Post 2 — Technical deep-dive
```
Detrás de Plantilla ARCA: Arquitectura Open Source para Cumplimiento Fiscal

Durante 18 meses, desarrollamos una solución que resuelve un problema que afecta a 500k+ pymes en Argentina: la generación de facturas electrónicas según RG 5824.

**¿Por qué fue necesario?**
Las herramientas existentes (Tango, Bejerman) cobran $500/mes + y generan lock-in. Los usuarios no pueden migrar sin perder histórico. El código es privado.

**¿Qué entregamos?**
Una arquitectura completa que:

1. **Se conecta directo a AFIP** — Sin intermediarios, usamos los mismos Web Services que Tango
2. **Valida antes de emitir** — Cada dato se verifica (CUIT válido, montos correctos, clientes identificados)
3. **Genera PDFs válidos** — Con QR embebido que cualquier teléfono puede leer
4. **Auditoría completa** — Todo queda registrado en PostgreSQL (tuyo, en tu máquina)
5. **Escalable** — Corre localmente (para pruebas), en tu VPS ($10/mes), o en AWS/Google Cloud

**Stack técnico:**
• Backend: Python 3.10+ (mismo lenguaje que usa AFIP internamente)
• BD: PostgreSQL (auditable, escalable)
• API: FastAPI (respuestas en JSON)
• Interfaz: Streamlit (prototipo funcional)
• PDFs: ReportLab (control total)
• Contenedores: Docker (reproducible en cualquier ambiente)
• Licencia: MIT (completamente libre)

**Números del proyecto:**
• 587 líneas de especificación
• 520 líneas de página Astro principal
• 250 líneas de cliente HTTP TypeScript con timeout handling
• 420 líneas de API FastAPI
• 240 líneas de generador PDF con soporte para logos customizados
• 10+ ejemplos de integración (CLI, Django, batch CSV, PDF customizado)
• 5 documentos de onboarding (instalación, API, RG 5824 explicado, desarrollo, ejemplos)
• Cobertura de tests: >85%

**¿Cuál es el modelo de negocio?**
La herramienta es gratis forever. ULTIMA MILLA monetiza con:
• Consultoría: Implementación avanzada para empresas grandes
• Workshops: Entrenamientos para contadores y equipos
• Soporte profesional: SLA de respuesta, auditoría de cumplimiento
• Integraciones: Conectar con MercadoPago, ERPs, sistemas contables

Creemos que el cumplimiento fiscal debería ser una utilidad, no un negocio extractivo.

Demo: https://ultimamilla.com.ar/plantilla-arca/
GitHub: https://github.com/UltimaMilla/plantilla-arca
Blog: https://ultimamilla.com.ar/blog/plantilla-arca-facturacion-electronica-gratis/

¿Ingenieros trabajando en fintech o compliance? ¿Qué herramientas open source les gustaría tener?

#Fintech #OpenSource #Python #Pymes #AFIP #Cumplimiento #Arquitectura
```

---

## 📧 Email (for newsletter/community)

### Subject: Presentamos Plantilla ARCA — Facturación Electrónica Gratis (RG 5824)

```
Hola,

Hace 3 años que asesoramos pymes, contadores y profesionales sobre RG 5824 (la norma de AFIP que obligó a facturación electrónica en Argentina).

Después de asesorar a 200+ empresas, identificamos el problema real:

Las herramientas existentes cobran $500/mes + y generan lock-in total. Los usuarios quedan atrapados, sin acceso al código, sin poder migrar.

Hace 18 meses decidimos resolver esto nosotros mismos.

Hoy presentamos Plantilla ARCA:

✅ Generador de facturas electrónicas, 100% gratis (licencia MIT)
✅ Se conecta directo a AFIP Web Services — sin intermediarios
✅ Código auditable — podés leer cada línea
✅ Funciona en tu máquina, en tu VPS, o en nube pública
✅ Escalable — desde 10 hasta 10,000 facturas/mes

**Probá online en 5 minutos (sin instalar):**
https://ultimamilla.com.ar/plantilla-arca/

**Lee la historia completa (incluye casos reales):**
https://ultimamilla.com.ar/blog/plantilla-arca-facturacion-electronica-gratis/

**Código fuente y documentación:**
https://github.com/UltimaMilla/plantilla-arca

¿Sos contador, director, freelancer con CUIT, o profesional independiente en Argentina?

RG 5824 es obligatoria. Pero no necesitás pagar licencias.

Creemos que el cumplimiento fiscal debería ser una utilidad pública, no un negocio extractivo.

Escribinos si tenés preguntas: hola@ultimamilla.com.ar

Saludos,
ULTIMA MILLA
Soluciones técnicas para pymes argentinas

P.S. — ¿Tu empresa usa soluciones de facturación? Nos gustaría escuchar tu experiencia. Respondé este email.
```

---

## 📱 WhatsApp/Telegram (community channels)

```
🚀 ¡Plantilla ARCA v1.0.0 en vivo!

Presentamos herramienta open source (MIT) para RG 5824 — generación de facturas electrónicas, 100% gratis.

📌 Demo online (5 min, sin instalar):
https://ultimamilla.com.ar/plantilla-arca/

📌 Blog completo (historia, casos reales, FAQ):
https://ultimamilla.com.ar/blog/plantilla-arca-facturacion-electronica-gratis/

📌 Código fuente:
https://github.com/UltimaMilla/plantilla-arca

✅ Sin $500/mes de Tango
✅ Sin lock-in de Bejerman
✅ 100% auditable
✅ Licencia MIT forever

¿Contadores? ¿Directores de PyME? ¿Freelancers? Compartir en vuestros grupos 🔄
```

---

## 📊 Content Calendar

| Date | Channel | Content | Format |
|------|---------|---------|--------|
| Apr 26 | Blog | Artículo principal | 2,100 palabras |
| Apr 26 | LinkedIn | Professional deep-dive | Post largo |
| Apr 26 | Twitter | Series de 4 tweets | Thread |
| Apr 26 | GitHub | Release notes | v1.0.0 |
| Apr 27 | Newsletter | Community announcement | Email |
| Apr 27 | WhatsApp/Telegram | Quick share | Link + teaser |

---

## 📈 Success Metrics to Track

- Blog post page views (target: 500+ in first week)
- GitHub stars (baseline, track growth)
- Demo usage (track # of PDF generations in first week)
- Lead emails from hola@ultimamilla.com.ar
- Social media engagement (retweets, comments, shares)
- LinkedIn post impressions (target: 5,000+)
