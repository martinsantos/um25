# 🕵️ Reporte de Auditoría Profunda: URLs, Imágenes y Directus
Fecha: 1/18/2026, 10:02:31 PM

| URL | Estado | Title | Desc | Schema | Imgs Rotas |
|---|---|---|---|---|---|

## 1. Integridad de Directus

- ❌ API Error: 404
| `/` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/servicios` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/antecedentes` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/contacto` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/blog` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/mineria` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/industria` | ✅ 200 | ❌ | ❌ | ❌ | ✅ |
| `/seguridad-electronica` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/constructoras` | ✅ 200 | ❌ | ❌ | ❌ | ✅ |
| `/bodegas` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/aeropuertos` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/salud` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/gobiernosectorpublico` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/sitemap-index.xml` | ✅ 200 | ❌ | ❌ | ❌ | ✅ |
| `/sitemap-antecedentes.xml` | ✅ 200 | ❌ | ❌ | ❌ | ✅ |
| `/antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 2 |
<!-- Broken on /antecedentes/3064/desarrollo-de-software-y-digitalizacion-de-procesos-para-el-gobierno-de-la-provincia-de-mendoza: https://ultimamilla.com.ar/directus-assets/0586663e-5558-41d8-819e-0f46582dddb5 (403), https://ultimamilla.com.ar/directus-assets/aa202948-a37e-4de0-a36e-4addb3603620 (403) -->
| `/antecedentes/3065/camara-de-cctv-aeropuerto-de-mendoza` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/antecedentes/3066/torre-thays-dispositivos-de-deteccion` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 2 |
<!-- Broken on /antecedentes/3066/torre-thays-dispositivos-de-deteccion: https://ultimamilla.com.ar/directus-assets/0586663e-5558-41d8-819e-0f46582dddb5 (403), https://ultimamilla.com.ar/directus-assets/aa202948-a37e-4de0-a36e-4addb3603620 (403) -->
| `/antecedentes/3067/mantenimiento-critico-de-sistemas-de-deteccion-torre-thays` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 1 |
<!-- Broken on /antecedentes/3067/mantenimiento-critico-de-sistemas-de-deteccion-torre-thays: https://ultimamilla.com.ar/directus-assets/b9c5a552-7962-4a6d-a31f-78fb3824170a (403) -->
| `/antecedentes/3068/implementacion-de-redes-de-datos-y-fibra-optica-aeropuertos-argentina-2000` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/antecedentes/3069/instalacion-electrica-para-data-center` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 1 |
<!-- Broken on /antecedentes/3069/instalacion-electrica-para-data-center: https://ultimamilla.com.ar/directus-assets/b338aac4-004e-43af-a5f7-1eb43ee27757 (403) -->
| `/antecedentes/3070/instalacion-de-camaras-en-dependencias-iscamen` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
| `/antecedentes/3071/mantenimiento-critico-de-sistemas-de-deteccion-cela-sa-junio-2025` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 1 |
<!-- Broken on /antecedentes/3071/mantenimiento-critico-de-sistemas-de-deteccion-cela-sa-junio-2025: https://ultimamilla.com.ar/directus-assets/b9c5a552-7962-4a6d-a31f-78fb3824170a (403) -->
| `/antecedentes/3072/infraestructura-hospitalaria-rack-y-patch-panel-hospital-a-italo-perrupato` | ✅ 200 | ✅ | ✅ | ✅ | ❌ 2 |
<!-- Broken on /antecedentes/3072/infraestructura-hospitalaria-rack-y-patch-panel-hospital-a-italo-perrupato: https://ultimamilla.com.ar/directus-assets/1263e093-46a5-4fe8-81ae-75fef6cc78aa (403), https://ultimamilla.com.ar/directus-assets/72e39e43-81f5-4557-ac6e-45fd6a64a2af (403) -->
| `/antecedentes/3073/implementacion-de-redes-de-datos-y-fibra-optica-fuesmen-fundacion-escuela-medicina-nuclear` | ✅ 200 | ✅ | ✅ | ✅ | ✅ |
