# Plantilla ARCA: Facturación Electrónica Gratis con RG 5824 (Open Source)

**Publicado:** 26 de abril, 2026  
**Autor:** Ultima Milla  
**Categoría:** Tecnología Abierta • AFIP • Facturas Electrónicas  
**Lectura:** 10 minutos  
**Meta:** Herramienta open source (MIT) para generar facturas electrónicas según RG 5824 de AFIP. Sin Tango, sin Bejerman. Probá gratis en 5 minutos.

---

## 1. El Gancho: Martín y los $500 Mensuales

Martín es contador independiente en La Plata. Tiene 50 clientes pequeños, desde almacenes hasta profesionales liberales. Hace tres años, AFIP le obligó a cumplir con **RG 5824**: todas las facturas tienen que ser electrónicas, con CAE (Código de Autorización Electrónica).

El problema: la solución obvia era pagar $500/mes a Tango o Bejerman. Martín lo hizo durante un año. Luego se enfureció.

"¿Por qué estoy pagando $6.000 al año por un sistema que **no me deja ver el código**, que **me bloquea si me quiero ir**, y que literalmente **le pide permiso a un servidor remoto para cada factura?** Eso no es solución, eso es extorsión", le escuchamos decir.

Tuvo razón. Y así empezó esto.

**Hoy, Martín genera 200 facturas mensuales, sin pagar licencias, auditando cada línea de código.**

---

## 2. El Problema: RG 5824 —La Regulación que Cambió Todo

Si sos **contador, director, abogado, profesional independiente o dueño de pyme en Argentina**, la **Resolución General 5824 de AFIP** te alcanza. No es opcional.

**¿Qué dice RG 5824?**

Desde 2024, AFIP exige que **todas las facturas emitidas en Argentina cumplan con estándares de facturación electrónica**. No solo es "emitir un PDF": tenés que conectarte a los **Web Services de ARCA** (Aplicación de Registro de Código de Autorización), solicitar un **CAE** (código único de autorización), y grabar el comprobante en la base de datos oficial de AFIP.

Si no cumplís:
- **Multas** desde $5.000 hasta $1.000.000+
- **Clausura** del punto de venta
- **Antecedentes** fiscal que afectan futuras auditorías
- **Impugnación** de facturas por AFIP

Y la "letra chica": **una sola factura mal emitida** puede traer un inspector a tu puerta.

**¿A quién le afecta?**

- **Contadores**: Si asesorás clientes en RG 5824, necesitás herramienta
- **Directores y socios**: Si facturás honorarios, RG 5824 es obligatoria
- **Abogados, contadores, ingenieros**: Profesionales liberales **siempre** facturan
- **Pymes**: Cualquier empresa que venda servicios o productos
- **Freelancers con CUIT**: Si emitís recibos, entra en RG 5824

**El problema real**: las herramientas disponibles son costosas, lentas, y **te hacen dependiente de terceros** que controlan tu cumplimiento fiscal.

---

## 3. La Solución: Plantilla ARCA

**Acaba de nacer una herramienta open source, totalmente gratuita, que automatiza RG 5824 sin intermediarios.**

Se llama **Plantilla ARCA**. Es un generador de facturas electrónicas que:

✅ **Se conecta directo a AFIP** (sin Tango, sin Bejerman, sin plataformas caras)  
✅ **Solicita CAE automáticamente** en 2-3 segundos  
✅ **Genera PDFs válidos** con QR de verificación  
✅ **Guarda auditoría** en base de datos propia  
✅ **Corre localmente o en la nube** (tú decides)  
✅ **Totalmente gratis** (licencia MIT)  
✅ **100% auditable**: podés ver cada línea de código

### Por qué es diferente

No va a suceder que:
- Te cobren licencia mensual
- Te obliguen a contrato de 12 meses
- Te bloqueen porque "migraste a otro sistema"
- Te cobre AFIP por cada actualización de su API
- Pierdas acceso si cierra la empresa

Porque **creemos que las herramientas de cumplimiento fiscal deberían ser tan libres como Internet**.

---

## 4. Cómo Funciona (Técnico, pero entendible)

Si solo querés generar facturas, saltá al punto 8. Si querés saber qué hay adentro:

### La arquitectura en 30 segundos

```
Cliente (tu navegador)
    ↓ (Streamlit)
Validación RG 5824 (Python)
    ↓
Tres procesos en paralelo:
  • Solicita CAE a Web Service ARCA
  • Genera PDF con ReportLab
  • Registra en PostgreSQL
    ↓
Retorna PDF + Número de CAE
```

### Stack técnico (por qué cada herramienta)

| Componente | Herramienta | Razón |
|-----------|-----------|--------|
| **Lenguaje principal** | Python 3.10+ | Simple, usado en AFIP, escalable |
| **Cliente ARCA** | `arca_arg` | Abstrae certificados, SOAP, WSAA (no reinventar la rueda) |
| **Base de datos** | PostgreSQL | Auditable, escalable, open source |
| **PDFs con QR** | ReportLab | Control total, QR embebido, sin dependencias externas |
| **Interfaz usuario** | Streamlit | Prototipo rápido, funcional, zero config |
| **Contenedores** | Docker | Levantás todo con `docker-compose up` |

### Seguridad y validación

Plantilla ARCA **valida cada dato antes de emitir**:

1. **CUIT válido** (algoritmo de AFIP)
2. **Monto numérico** (sin caracteres raros)
3. **Comprador identificado** (CUIT o DNI del cliente)
4. **Puntos de venta registrados** en AFIP
5. **Fechas coherentes** (no facturas retroactivas imposibles)

Si algo falla, ARCA **rechaza antes de emitir**, y ves el error exacto. Cero facturas inválidas.

---

## 5. Casos de Uso: Cuatro Personas, Cuatro Soluciones

### María: Contadora con 50 clientes pequeños

Maria asesora pymes. Hace 2 años, AFIP cambió RG 5824 y sus clientes se paniquaron. Ella les decía: "Paguen a Tango" (que cuesta $50-200/mes cada uno).

Hoy descargó Plantilla ARCA. La instala en su VPS por $10/mes. Sus clientes se conectan, carga datos JSON con sus datos (CUIT, punto de venta, número de factura), presiona un botón, obtiene PDF en 3 segundos.

**Antes**: Gastaba 2-3 horas/mes asesorando clientes sobre qué software usar.  
**Ahora**: Usa una herramienta, la entiende 100%, y asesora sobre RG 5824 (no sobre UI).

**Valor generado**: Ahorra $300/mes en licencias de sus clientes. Ella monetiza con consultoría de RG 5824 ($150-250/hora).

---

### Juan: Director de PyME que recién se entero de RG 5824

Juan vende repuestos automotrices. Recién un contador le dijo: "Necesitás cumplir RG 5824 o AFIP te clausura."

Entró en pánico. No quería pagar $500/mes en software. Encontró Plantilla ARCA.

Pasó 30 minutos:
1. Solicitó certificado AFIP (gratis, 3-5 días)
2. Clonó el repo desde GitHub
3. `docker-compose up`
4. Probó con 5 facturas en Homologación
5. Cambió a Producción cuando se sintió seguro

Hoy genera 400 facturas/mes. El software le cuesta $0.

**Valor**: Ahorró $6.000/año en licencias. Duerme tranquilo porque **audita el código** si lo necesita.

---

### Laura: Abogada con 8 profesionales en estudio

Laura tiene estudio con 8 abogados. Cada uno factura clientes. No podía pagarles Bejerman a cada uno ($100+/mes cada uno).

Instaló Plantilla ARCA en servidor compartido. Los 8 abogados tienen usuario. Cada uno emite facturas. Todo registrado en una BD central para auditoría.

Integró con sistema de turnos: cuando marca "facturado", genera PDF automático.

**Antes**: Contratar contadora para gestionar facturación = $800/mes.  
**Ahora**: Proceso automático, gratis, auditable.

---

### Pablo: Freelancer que recién empieza

Pablo es desarrollador. Emite pocas facturas (10-20/mes). No tiene servidor. No quería complicarse.

Fue a la demo online de Plantilla ARCA. Cargó datos de una factura, presionó botón, descargó PDF en 3 segundos.

**Sin instalar nada**. **Sin pagar nada**.

Cuando crezca, instalará localmente. Por ahora, la demo le sobra.

---

## 6. Preguntas Frecuentes (Las que realmente te importan)

**P: ¿Es legal? ¿AFIP lo permite?**

R: Completamente legal. Usamos los mismos Web Services que Tango, Bejerman, ARCA directo. AFIP no prohíbe escribir tu propia herramienta. Solo necesitás certificado X.509 válido. Ley de software libre (Ley 27.454) te respalda.

---

**P: ¿Qué pasa si cargo datos incorrectos?**

R: ARCA valida antes de emitir CAE. Si algo está mal (CUIT inválido, monto negativo, cliente desconocido), rechaza la solicitud y **te muestra el error exacto**. No se emite nada invalido.

---

**P: ¿Necesito certificado AFIP?**

R: Sí. **Pero es gratis**. Tardás 3-5 días en obtener desde https://www.afip.gob.ar → Administración de Clave y Certificados. Es X.509 (estándar de seguridad). Sin este certificado, no podés conectarte a ARCA (ningún software puede).

---

**P: ¿Puedo emitir en Producción desde el primer día?**

R: No recomendado. Plantilla ARCA default está en **Homologación** (entorno de prueba de AFIP). Probá ahí primero (10-20 facturas, sin riesgo). Cuando estés seguro, cambias `ARCA_ENV=produccion` en config. Listo.

---

**P: ¿Qué pasa si algo sale mal y pierdo 30 días?**

R: No se "pierden" días. ARCA es un sistema de **numeración secuencial**: cada CAE es único y tiene rango de validez (60 días). Si un CAE falla, AFIP tiene histórico. Los logs de Plantilla ARCA guardan **toda la trazabilidad**: qué solicitaste, cuándo, respuesta de ARCA. Si necesitás demostrar algo, está grabado.

---

**P: ¿Puedo usar la herramienta para dos empresas?**

R: Sí. Cada empresa configura su CUIT, su certificado, su base de datos. Cero interferencia. Es open source, podés forkear para cada caso.

---

**P: ¿Es seguro guardar datos en mi BD?**

R: Más seguro que confiar en terceros. La base de datos está **en tu máquina o en tu VPS**. AFIP nunca ve tus datos de cliente, solo el comprobante fiscal. PostgreSQL tiene cifrado, backups, auditoría nativa.

---

**P: ¿Puedo integrar con mi ERP / sistema de ventas?**

R: Completamente. API JSON. Enviás datos, recibes PDF + CAE. Ya hay integraciones hechas para sistemas populares. Es open source, podés customizar.

---

**P: ¿Cuál es el catch? ¿En dónde monetizas?**

R: La herramienta es **100% gratis, MIT, forever**. Ultima Milla monetiza con:

- **Consultoría**: Implementación avanzada, integraciones custom, auditoría
- **Workshops**: Para contadores que quieren entrenar a clientes
- **Soporte profesional**: SLA de respuesta, auditoría de cumplimiento
- **Integraciones**: Conectar con MercadoPago, sistemas contables, ERPs

Creemos que el cumplimiento fiscal **no debería tener costo de software**. El expertise, sí.

---

**P: ¿Hay roadmap? ¿Qué falta?**

R: Sí. Hoy soporta:
- ✅ Factura A, B, C
- ✅ Generación CAE automática
- ✅ PDF con QR

Próximamente:
- 🚀 Notas de Crédito / Débito
- 🚀 API REST con autenticación
- 🚀 Dashboard de auditoría
- 🚀 Envío automático por email
- 🚀 Descuentos y retenciones personalizadas
- 🚀 Integración Mercado Pago / MercadoLibre

---

## 7. Roadmap: Lo que viene (y por qué)

**Q2 2026** (Ahora)
- ✅ Generador básico de facturas (A/B/C)
- ✅ Demo online
- ✅ Documentación RG 5824

**Q3 2026**
- 🚀 Notas de Crédito / Débito (facturación negativa)
- 🚀 API REST para integraciones
- 🚀 Batch processing (500 facturas en 1 clic)
- 🚀 Dashboard histórico

**Q4 2026**
- 🚀 Móvil (React Native, offlineability)
- 🚀 Machine learning de verificación AFIP
- 🚀 Webhooks para confirmación de recepción

**Por qué este orden**: Empezamos donde están los clientes (facturación básica). Escalamos con features demandadas (notas, batch). Movemos a mobile cuando el core está sólido.

**Contribuciones bienvenidas**: MIT = podés proponer, forkear, customizar.

---

## 8. Cómo Empezar: Tres Caminos

### Opción 1: Online (5 minutos, sin instalar)

La demo corre en nuestro servidor. Cargas datos, presionas botón, descargas PDF.

**👉 [Probá Plantilla ARCA online →](https://ultimamilla.com.ar/plantilla-arca/)**

Ideal para: Probar sin compromiso. Ver si funciona. Entender el workflow.

---

### Opción 2: Docker Local (15 minutos, para producción)

Clonas, levantas con Docker, tenés todo en tu máquina.

```bash
# Clonar repositorio
git clone https://github.com/UltimaMilla/plantilla-arca.git
cd plantilla-arca

# Crear archivo .env con tu CUIT y ruta del certificado AFIP
cp .env.example .env
nano .env

# Levantar servicios (PostgreSQL + app)
docker-compose up

# Abrí navegador
# http://localhost:8501
```

**Requiere**: Docker, Docker Compose, Certificado AFIP (gratis, 3-5 días).

**Ideal para**: Contadores, equipos pequeños, desarrollo local.

---

### Opción 3: Servidor Propio (30 minutos, para escala)

Si tenés VPS (AWS, DigitalOcean, Azure), hay guía en el README para desplegar con systemd + Nginx.

```bash
# En tu VPS
git clone https://github.com/UltimaMilla/plantilla-arca.git
cd plantilla-arca

# Instalar dependencias y configurar systemd
./scripts/deploy.sh

# Nginx reverse proxy
sudo nano /etc/nginx/sites-available/arca
# ... configurar ...

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl start plantilla-arca
```

**Requiere**: VPS propio (desde $10/mes), conocimiento básico de Linux.

**Ideal para**: Pymes grandes, varios usuarios, datos sensibles on-premises.

---

## 9. Reflexión Final: Consistencia en la Facturación

Hace tres años escribimos sobre integraciones complejas con AFIP. Hace dos años hablamos de RG 5824 y sus implicancias. Hace un año asesoramos contadores sobre qué herramientas usar.

Hoy **entregamos la herramienta**.

Eso es consistencia: no solo identificar problemas, resolverlos.

**Facturación sin estrés. Auditoría sin pedir permiso. Libertad sin lock-in.**

Si Plantilla ARCA te ahorra $500/mes en licencias, o te permite facturar seguro, o simplemente te demuestra que **sí se puede hacer mejor**: nuestro objetivo está cumplido.

Creemos en Argentina. Creemos en pymes. Creemos que el **cumplimiento fiscal no debería ser un negocio extractivo**, sino una utilidad.

**Y si querés contribuir, mejorar algo, adaptar para tu caso:** el código es tuyo. MIT significa libertad.

Escribinos, abrí un issue, haz un PR. La comunidad es quien mantiene esto vivo.

---

## 10. Links Útiles y Recursos

- **Herramienta online (demo):** https://ultimamilla.com.ar/plantilla-arca/
- **GitHub (código fuente, MIT):** https://github.com/UltimaMilla/plantilla-arca
- **Documentación completa:** https://github.com/UltimaMilla/plantilla-arca#readme
- **Artículo anterior (RG 5824 explicado):** https://ultimamilla.com.ar/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha/
- **AFIP Web Services (oficial):** https://www.afip.gob.ar/ws/
- **Licencia MIT (full text):** https://opensource.org/licenses/MIT
- **Solicitar certificado AFIP:** https://www.afip.gob.ar/administracion/

**¿Preguntas? Escribinos:** hola@ultimamilla.com.ar

---

**Hecho por [Ultima Milla](https://ultimamilla.com.ar)** — Soluciones técnicas para pymes argentinas, desde 2022.
