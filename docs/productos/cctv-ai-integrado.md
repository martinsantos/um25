# CCTV AI Integrado - Definicion de producto UMSA

Version de trabajo: 2026-06-04

Fuentes revisadas:

- `/Users/santosma/Documents/Codex/2026-06-03/https-chatgpt-com-share-6a1eb948-9990/outputs/manual-20260603-cctv-ai/propuesta-cctv-ai-umsa-consolidada.md`
- `/Volumes/SDTERA/ultima milla/2026/CLIENTES/PETRO/UMSA-PETRO-CCTV AI - 030626.pptx`
- Sesion Codex / assets: `019e8d32-06c8-73a1-aa89-5f9d40c31f4b`

## Decision de arquitectura

`CCTV AI Integrado` debe publicarse como **producto** dentro de `Servicios`, no como un noveno frente de servicio.

Modelo recomendado:

- Categoria comercial nueva: `Producto`
- Tipo: `Producto`
- Servicio padre: `102 - Sistemas de Seguridad Electronica`
- Servicios relacionados: `104 - Software a medida`, `105 - Soporte 24/7`, `106 - Consultoria IT`
- URL inicial compatible con el sitio actual: `/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi#producto-cctv-ai-integrado`
- URL futura recomendada si se crea landing de productos: `/productos/cctv-ai-integrado`

Esta decision mantiene a CCTV AI dentro de la linea natural de seguridad electronica, pero permite venderlo como producto cerrado, con piloto, limites, opciones comerciales y pricing.

## Nombre y posicionamiento

Nombre comercial:

**CCTV AI Integrado**

Nombre explicativo:

**Inteligencia artificial para camaras de seguridad, alertas, evidencia y reportes UMSA**

Promesa corta:

**Camaras existentes convertidas en alertas, evidencia y reportes operativos.**

Bajada:

Integramos camaras, grabadores, control de acceso, alarmas y sistemas internos para transformar video existente en eventos utiles: alertas, clips, reportes y evidencia ordenada para la operacion.

## Copy para tarjeta en Servicios

Titulo:

**CCTV AI Integrado**

Texto:

Analitica sobre camaras existentes, alertas operativas, evidencia visual y reportes conectados con los sistemas del cliente.

Etiqueta:

**Producto / Seguridad + Software**

CTA:

**Solicitar diagnostico**

## Copy para ficha de producto

Kicker:

**Producto**

H1 / titulo:

**CCTV AI Integrado**

Destacado:

**Video existente convertido en eventos, clips y evidencia accionable**

Descripcion:

CCTV AI Integrado suma una capa de inteligencia operativa sobre camaras existentes. UMSA releva la instalacion, valida calidad de imagen y angulos, configura reglas utiles, integra alertas con la operacion y entrega evidencia documentada. No reemplaza operadores, protocolos internos ni revision humana: ordena el video para que la respuesta sea mas rapida y trazable.

Features:

- Relevamiento de camaras existentes: compatibilidad, angulos, calidad de imagen y NVR/VMS
- Piloto controlado de 30 dias sobre 6 camaras criticas
- Reglas de IA operativas: intrusion, cruce de linea, permanencia, conteo, EPP o evento validado por sitio
- Alertas con evidencia: clip, cuadro clave, severidad, estado y recomendacion para revision humana
- Integracion UMSA con alarmas, accesos, tableros, reportes y escalamiento por etapa

## Opciones comerciales

Precios circa en USD. La oferta final queda sujeta a relevamiento, compatibilidad, licencias, almacenamiento, cantidad de camaras y definicion del piloto.

| Familia | Opcion | Precio circa | Cliente cuenta con | Conviene si |
|---|---|---:|---|---|
| Mercado | Perimetro inteligente | desde USD 27,6k | Reglas de cruce, intrusion o entrada a zona restringida. | Necesita control perimetral rapido. |
| Mercado | Analitica del fabricante | desde USD 38,0k | Funciones avanzadas del equipo y metadata compatible. | Ya tiene equipos compatibles y quiere buscar mejor. |
| Mercado | Servidor del fabricante | hasta USD 72,0k | Mayor volumen de camaras, almacenamiento y administracion. | Tiene varios sitios o muchas camaras. |
| UMSA | IA local en planta | desde USD 34,8k | Procesamiento local de camaras criticas, alertas y clips. | Quiere alertas en sitio sin enviar todo el video a nube. |
| UMSA | Gestion central UMSA | desde USD 48,9k | UMSA revisa eventos, clasifica clips, reporta y ajusta reglas. | Necesita servicio administrado y seguimiento periodico. |
| UMSA | Operacion hibrida | desde USD 66,4k | Procesamiento local + gestion central + metricas + mejora por etapas. | La operacion es critica y requiere escalamiento gradual. |
| UMSA | Forense UMSA | desde USD 24,0k | Revision posterior de clips, clasificacion y reporte de evidencia. | Necesita auditoria, reclamos o investigacion posterior. |

Entrada recomendada:

**Piloto UMSA de 30 dias sobre 6 camaras criticas.**

## Casos de uso

Alta viabilidad:

- Cruce de linea
- Intrusion en zona restringida
- Permanencia en area no autorizada
- Conteo vehicular
- Ocupacion de estacionamientos

Viabilidad media o condicionada:

- Humo o fuego visual como alerta temprana complementaria
- Casco, chaleco u otros EPP si el cuerpo se ve completo
- Uso de telefono si la camara esta cerca y el angulo permite verlo
- Fumar si hay zoom suficiente y se valida con muestra real

No prometer sin validacion especifica:

- Reconocimiento facial
- Lectura de patentes sin camara dedicada
- Detecciones finas en video lejano, oscuro o con baja resolucion
- Decisiones automaticas sin revision humana

## Piloto recomendado

Duracion:

**30 dias**

Alcance inicial:

**6 camaras criticas**

Entregables:

- Relevamiento de camaras y compatibilidad
- Seleccion de zonas y eventos
- Configuracion inicial
- Reporte semanal de eventos
- Ajuste de reglas y falsos positivos
- Cierre con recomendacion tecnica y comercial

Criterios de exito:

- Eventos utiles detectados
- Falsos positivos controlables
- Evidencia clara para el cliente
- Flujo de alerta entendible
- Decision de escalamiento por sitio, camara o caso de uso

## Assets preparados

Hero recomendado:

- `/public/images/services/productos/cctv-ai/cctv-ai-integrado-hero.png`

Detalle / demo forense:

- `/public/images/services/productos/cctv-ai/cctv-ai-forense-fumador.png`
- `/public/images/services/productos/cctv-ai/cctv-ai-forense-telefono.png`

UUID de imagen recomendado para el mapa local:

```json
{
  "019e8d32-06c8-73a1-aa89-5f9d40c31f4b": "/images/services/productos/cctv-ai/cctv-ai-integrado-hero.png"
}
```

## Payload compatible con snapshot actual

El sitio actual carga productos desde `src/data/snapshots/productos.json` mediante `servicio_id`. Para publicarlo sin depender de Directus, el registro minimo compatible seria:

```json
{
  "servicio_id": 102,
  "titulo": "CCTV AI Integrado",
  "descripcion": "CCTV AI Integrado suma una capa de inteligencia operativa sobre camaras existentes. UMSA releva la instalacion, valida calidad de imagen y angulos, configura reglas utiles, integra alertas con la operacion y entrega evidencia documentada. No reemplaza operadores, protocolos internos ni revision humana: ordena el video para que la respuesta sea mas rapida y trazable.\\n\\n**Implementamos un piloto de 30 dias sobre 6 camaras criticas** para validar eventos utiles, falsos positivos, evidencia visual y forma de reporte antes de escalar por sitio, camara o caso de uso.",
  "imagen": "019e8d32-06c8-73a1-aa89-5f9d40c31f4b",
  "features": [
    "Relevamiento de camaras existentes — Compatibilidad, angulos, calidad de imagen y NVR/VMS antes de prometer IA",
    "Piloto controlado — 30 dias sobre 6 camaras criticas para medir eventos utiles y falsos positivos",
    "Reglas de IA operativas — Intrusion, cruce de linea, permanencia, conteo, EPP o evento validado por sitio",
    "Alertas con evidencia — Clip, cuadro clave, severidad, estado y recomendacion para revision humana",
    "Integracion UMSA — Alarmas, accesos, tableros, reportes y escalamiento por etapa"
  ],
  "destacado": "Video existente convertido en eventos, clips y evidencia accionable",
  "marcas": [
    "CCTV",
    "IA local",
    "NVR/VMS",
    "Reportes UMSA"
  ],
  "orden": 8,
  "status": "published"
}
```

## Extension recomendada para categoria Producto

Para soportar el producto sin meter todo dentro de `descripcion`, conviene agregar una capa de datos propia:

```json
{
  "categoria_comercial": "Producto",
  "tipo_producto": "producto",
  "slug_producto": "cctv-ai-integrado",
  "servicios_relacionados": [102, 104, 105, 106],
  "opciones_comerciales": [
    {
      "familia": "Mercado",
      "nombre": "Perimetro inteligente",
      "precio": "desde USD 27,6k",
      "alcance": "Reglas de cruce, intrusion o zona restringida",
      "ideal_para": "Control perimetral rapido"
    },
    {
      "familia": "Mercado",
      "nombre": "Analitica del fabricante",
      "precio": "desde USD 38,0k",
      "alcance": "Funciones avanzadas compatibles del fabricante",
      "ideal_para": "Busqueda avanzada con equipos compatibles"
    },
    {
      "familia": "Mercado",
      "nombre": "Servidor del fabricante",
      "precio": "hasta USD 72,0k",
      "alcance": "Volumen, almacenamiento y administracion centralizada",
      "ideal_para": "Varios sitios o muchas camaras"
    },
    {
      "familia": "UMSA",
      "nombre": "IA local en planta",
      "precio": "desde USD 34,8k",
      "alcance": "Procesamiento local de camaras criticas, alertas y clips",
      "ideal_para": "Alertas locales sobre zonas criticas"
    },
    {
      "familia": "UMSA",
      "nombre": "Gestion central UMSA",
      "precio": "desde USD 48,9k",
      "alcance": "Clasificacion de eventos, clips, reportes y ajuste de reglas",
      "ideal_para": "Servicio administrado y seguimiento periodico"
    },
    {
      "familia": "UMSA",
      "nombre": "Operacion hibrida",
      "precio": "desde USD 66,4k",
      "alcance": "Local + central + metricas + mejora por etapas",
      "ideal_para": "Operacion critica con escalamiento gradual"
    },
    {
      "familia": "UMSA",
      "nombre": "Forense UMSA",
      "precio": "desde USD 24,0k",
      "alcance": "Revision posterior, clasificacion y reporte de evidencia",
      "ideal_para": "Auditorias, reclamos o investigaciones"
    }
  ]
}
```

## SEO / GEO

Meta title:

**CCTV AI para camaras de seguridad | ULTIMA MILLA**

Meta description:

**CCTV AI Integrado para convertir camaras existentes en alertas, evidencia y reportes. Piloto UMSA sobre 6 camaras criticas.**

Keywords:

- CCTV AI
- inteligencia artificial para camaras de seguridad
- analitica de video
- videovigilancia inteligente
- CCTV con IA Mendoza
- reportes forenses CCTV
- alertas sobre camaras existentes
- seguridad electronica con inteligencia artificial

Interlinking recomendado:

- `/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi`
- `/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp`
- `/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it`
- `/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria`
- `/antecedentes`
- `/contacto`

## Recomendacion de publicacion

Fase 1:

- Publicar como producto dentro del servicio `102`.
- Agregar una seccion breve `Producto` en `/servicios`.
- Usar el asset hero y el ancla `#producto-cctv-ai-integrado`.

Fase 2:

- Crear landing `/productos/cctv-ai-integrado`.
- Mostrar opciones comerciales con comparador Mercado vs UMSA.
- Agregar demo forense con las dos imagenes de incidente.
- Incluir FAQ de limites para evitar promesas fragiles.
