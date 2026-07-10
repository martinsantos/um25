# Auditoria de migracion demo ULTIMA MILLA - 2026-06-26

## Fuentes comparadas

- Demo viva: `https://preview-chat-5deefe29-79c9-4bbe-8184-3894fa162686.space-z.ai`
- Fuente local demo: `uiglmv3/` y `uiglmv3/astro-migration/`
- Produccion: `https://www.ultimamilla.com.ar`
- Espejo local encontrado: `work/prod-mirror-20260620`

Capturas y JSON del barrido:

- `/private/tmp/um-route-audit/summary.json`
- `/private/tmp/um-route-audit/audit.json`
- `/private/tmp/um-route-audit/screens/`

## Diagnostico

Produccion no esta sirviendo una copia completa del port de la demo. El repo actual mezcla `LayoutV4`, `v4.css` y templates propios con partes del diseno nuevo. La fuente local `uiglmv3/astro-migration` trae otra arquitectura: `BaseLayout`, `SectionLayout`, `HubLayout`, `LegalLayout`, `Header`, `Footer`, `SectionHeader` y `global.css`.

La demo Next usa una SPA con rewrites a `/`; por eso algunos deep links no existen en el preview externo aunque el componente exista en el store. Astro debe tener rutas reales o redirects.

## Rutas con divergencia alta

- `/`
- `/sectores`
- `/aeropuertos`
- `/bodegas`
- `/constructoras`
- `/gobiernosectorpublico`
- `/salud`
- `/industria`
- `/mineria`
- `/seguridad-electronica`
- `/software`
- `/antecedentes`
- `/blog`
- `/blog/categoria/tecnico`
- `/nosotros`
- `/cctvai`

## Rutas con divergencia media

- `/servicios`
- `/certificaciones`

## Rutas mas cercanas, pero no identicas

- `/contacto`
- `/geo`
- `/plantilla-arca`
- `/privacidad`
- `/terminos`
- `/servicios-it-empresas-mendoza`
- `/presupuesto-servicios-it-empresas`
- `/proyectos-ingenieria-it-mendoza`
- `/servicios-it-empresas-argentina`

## Hallazgos de routing

- `/servicios/101` a `/servicios/108` daban 404 en demo viva y produccion.
- El codigo Next local si contempla esos estados por store (`selectedServiceCode`), pero `next.config.ts` no tiene rewrites para `/servicios/:code`.
- En Astro corresponde exponer rutas reales. Se agrego `src/pages/servicios/[id]/index.astro` para redirigir `301` a `/servicios/{id}/{slug}`.

## Primer cambio aplicado localmente

- `src/pages/servicios/[id]/index.astro`
- Validacion local:
  - `npm run lint`: OK
  - `npm run build`: OK
  - `GET /servicios/101`: `301` a `/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces`
  - URL canonica: `200`

## Orden recomendado de migracion

1. Congelar despliegues parciales: no mergear cambios por pantalla aislada.
2. Portar infraestructura visual base desde `uiglmv3/astro-migration`: layouts, header/footer, section header y tokens CSS.
3. Adaptar datos reales del repo actual a las props esperadas por las paginas demo. No copiar `directus.ts` del port sin adaptar, porque asume colecciones/campos distintos.
4. Migrar paginas por familias:
   - Familia A: home, servicios, sectores.
   - Familia B: singles de sector y servicio.
   - Familia C: antecedentes explorer y single antecedente.
   - Familia D: blog index, single y categorias.
   - Familia E: empresa/contacto/certificaciones/cctvai.
   - Familia F: legales, GEO, ARCA y hubs comerciales.
5. Validar cada familia contra demo viva, fuente local y produccion con Playwright antes de PR.
