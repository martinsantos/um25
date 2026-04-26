# Plantilla ARCA: Facturación Electrónica Open Source (La solución que faltaba)

**Publicado:** 26 de abril, 2026  
**Autor:** Ultima Milla  
**Categoría:** Tecnología Abierta  
**Lectura:** 8 minutos

---

## El Problema: RG 5824 te atrapó

Hace un tiempo escribimos sobre [la RG 5824 que cambió las reglas para directores, abogados y profesionales](https://ultimamilla.com.ar/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha/). Si caíste en esa nota, ya sabés el suspenso: **AFIP te obliga a facturar electrónicamente**, y la mayoría de las herramientas disponibles son caras, lentas o atadas a proveedores que no querés.

Hace tres meses uno de ustedes nos escribió: *"Entiendo el problema, pero ¿cómo conecto a ARCA sin pagar $500/mes a Tango?"*

Fue la pregunta que nos faltaba. Y así nació esto.

---

## La Solución: Plantilla ARCA

**Acaba de lanzarse una herramienta open source, gratuita y 100% funcional para generar facturas electrónicas con CAE de AFIP.**

[**🚀 Probar la herramienta online →**](https://ultimamilla.com.ar/plantilla-arca/)

### Qué hace

- ✅ Se conecta a los Web Services de ARCA (sin intermediarios)
- ✅ Solicita CAE automáticamente (en 2-3 segundos)
- ✅ Genera PDF válido con QR del CAE
- ✅ Guarda todo en una base de datos para auditoría
- ✅ Funciona localmente o en la nube
- ✅ **Totalmente gratuito** (licencia MIT)

### Qué NO hace (y por qué)

No vamos a:
- Venderte nada
- Bloquearte con contracts de 12 meses
- Darte una UI genérica sin permitirte personalizar
- Cobrar por actualizaciones de AFIP

Porque creemos que **las herramientas que facilitan cumplimiento fiscal deberían ser tan accesibles como internet**.

---

## El Stack Técnico (para el curioso)

| Componente | Herramienta | Por qué |
|-----------|-----------|--------|
| **Lenguaje** | Python 3.10+ | Simple, popular en AFIP |
| **Cliente ARCA** | `arca_arg` | Abstrae WSAA, SOAP, certificados |
| **Base de datos** | PostgreSQL | Escalable, auditable |
| **Generación PDF** | ReportLab | Control total, QR embebido |
| **Interfaz** | Streamlit | Prototipo rápido, cero frontend |
| **Contenedores** | Docker | Levantar todo con 1 comando |

**En corto:** Cero dependencias raras. Stack profesional que escala.

---

## Cómo Usar (2 opciones)

### Opción 1: Online (La más fácil)

Acá en el sitio hay una demo funcionando. Cargá tus datos, presioná un botón, obtené el PDF con CAE. Ideal para probar sin instalar nada.

[**→ Ir a la demo online**](https://ultimamilla.com.ar/plantilla-arca/)

### Opción 2: En tu máquina (Para producción)

```bash
# Clonar
git clone https://github.com/UltimaMilla/plantilla-arca.git
cd plantilla-arca

# Levantar con Docker (todo adentro)
docker-compose up

# Abrí http://localhost:8501
```

Listo. PostgreSQL + app corriendo localmente.

### Opción 3: En tu servidor (Para pymes)

Si tenés un VPS propio, hay instrucciones en el README para desplegar con systemd + Nginx. Takes ~15 minutos.

---

## RG 5824 Step by Step

Para los que recién empiezan, esto es lo que tenés que saber:

**1. Necesitás un certificado AFIP** (X.509, gratis pero tarda 3-5 días)
   - Solicitá en https://www.afip.gob.ar → Web Services
   - Usá tu CUIT

**2. Cada factura necesita un CAE**
   - CAE = Código de Autorización Electrónica
   - Válido por 60 días
   - Lo solicitas a ARCA (nosotros automatizamos esto)

**3. El PDF que generamos es válido**
   - Incluye QR para verificación
   - Puede imprimirse o enviarse por email
   - AFIP lo valida si lo escanean

**4. Todo debe registrarse en AFIP**
   - Nosotros lo hacemos automáticamente
   - Guardamos en BD para auditoría

---

## Casos de Uso

### Director que factura esporádicamente
*"Emití 3 facturas al año, no quería pagar $50/mes por un servicio."*

Descarga la plantilla, usa 2 veces, listo. Sin suscripción.

### Abogado con múltiples clientes
*"Tengo 20 clientes recurrentes. Quería un sistema simple, no Bejerman."*

Configurá puntos de venta, cargá JSON automatizado desde tu contabilidad, generá facturas en batch.

### Contador que asesora pymes
*"Mis clientes ahora tienen que facturar. Les recomiendo que usen esto."*

Cada uno se lo instala, vos asesorás cómo configurarlo. Ganas en horas de consultoría, no en licencias.

### Startup que necesita flexibilidad
*"Necesitamos customizar el PDF con nuestro branding."*

El código es tuyo. Cambiale el color, añadile un logo, integralo con tu ERP. Licencia MIT = libertad total.

---

## Preguntas Frecuentes

**P: ¿Es legal? ¿AFIP lo permite?**

R: Sí. Usamos los mismos Web Services que usan Tango, Bejerman y todos. AFIP no prohibe que escribas tu propia herramienta. Solo necesitás un certificado válido.

**P: ¿Qué pasa si me equivoco en los datos?**

R: ARCA valida antes de emitir el CAE. Si algo está mal, rechaza y te muestra el error. Es un sandbox, no se emite nada inválido.

**P: ¿Puedo emitir en Producción desde el primer día?**

R: No, recomendamos probar primero en Homologación (nuestro default). Cuando estés seguro, cambias `ARCA_HOMOLOGACION=false` y listo. Las facturas serán válidas.

**P: ¿Y si tengo un error en ARCA y pierdo 30 días?**

R: ARCA te da trazabilidad completa. Todos los logs están guardados. Si algo falla, sabemos exactamente qué pasó.

**P: ¿Puede haber dos empresas usando la plantilla?**

R: Sí. Cada una configura su CUIT, su certificado, su BD. Cero interferencia.

**P: ¿Cuál es el catch? ¿En dónde monetizás?**

R: Acá en Ultima Milla ofrecemos:
- **Consultoría** para configuración avanzada
- **Workshops** para contadores que quieren enseñarles a sus clientes
- **Auditoría** de implementaciones en producción
- **Integraciones custom** con ERPs

La herramienta es gratis. El expertise es lo que cobramos.

---

## Arquitectura (Para DevOps)

```
┌─────────────────────────────────────────┐
│   Usuario (Streamlit en navegador)      │
└────────────┬────────────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Capa de Aplicación (Python)     │
│  • Validación RG 5824            │
│  • Parseo de datos               │
│  • Serialización a SOAP          │
└────────────┬─────────────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────────┐
│ ARCA │ │  DB  │ │PDF+QR    │
│WSMTXCA│ │PG    │ │ReportLab │
└──────┘ └──────┘ └──────────┘

Deployment: Docker Compose → Producción
```

---

## Roadmap (Lo que viene)

- ✅ Factura A, B y C (soportados)
- 🚀 Nota de Débito, Nota de Crédito (próximamente)
- 🚀 API REST para integraciones
- 🚀 Dashboard de auditoría (histórico de facturas)
- 🚀 Envío automático por email
- 🚀 Descuentos y retenciones
- 🚀 Integración con populares (Mercado Pago, MercadoLibre)

Las contribuciones son bienvenidas. Es open source (MIT).

---

## Cómo Empezar

### Si querés probar sin instalar nada
👇 **[Probá la herramienta online →](https://ultimamilla.com.ar/plantilla-arca/)**

### Si querés descargar e instalar

```bash
git clone https://github.com/UltimaMilla/plantilla-arca.git
cd plantilla-arca
docker-compose up
# → http://localhost:8501
```

Requiere:
- Docker
- Certificado AFIP (gratis, 3-5 días para obtener)

### Si tenés dudas de implementación

Escribinos a: **hola@ultimamilla.com.ar** o abrí un issue en [GitHub](https://github.com/UltimaMilla/plantilla-arca).

---

## Reflexión Final

Hace tres años escribimos sobre las integraciones complejas con AFIP. Hace un año escribimos sobre RG 5824. Hoy entregamos la herramienta.

**Eso es consistencia.** No solo hablamos de los problemas; los resolvemos.

Si este software te ahorra $500/mes en licencias, o te permite facturar sin stress, o simplemente te muestra que **sí se puede hacer mejor**: nuestro objetivo está cumplido.

Y si querés contribuir, mejorar algo, adaptar para tu caso específico: el código es tuyo. MIT significa que.

---

## Links Útiles

- **Herramienta online:** https://ultimamilla.com.ar/plantilla-arca/
- **GitHub:** https://github.com/UltimaMilla/plantilla-arca
- **Documentación:** [README + ejemplos](https://github.com/UltimaMilla/plantilla-arca#readme)
- **Artículo anterior (RG 5824 explicado):** https://ultimamilla.com.ar/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha/
- **AFIP Web Services:** https://www.afip.gob.ar/ws/
- **Licencia MIT (full text):** https://opensource.org/licenses/MIT

---

**Última nota:** Si esto te salvó de pagar licencias costosas, considerá hacer una PR o reportar bugs. La comunidad es quien mantiene esto vivo.

**Hecho por [Ultima Milla](https://ultimamilla.com.ar)** — Soluciones técnicas para pymes argentinas. 🇦🇷
