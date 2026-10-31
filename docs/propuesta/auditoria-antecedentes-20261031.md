# Auditoría de antecedentes · 31 de octubre de 2026

Generada por el control visual (scripts/propuesta/control.mjs) a partir de /propuesta/auditoria.json. Las señales son de contenido: lo que la regla no puede completar sin inventar. Se corrigen en Directus o en SGI.

Qué significa cada señal:
- descripcion-corta: el registro no describe el trabajo (vacío, o sólo repite el título o trae "Cliente: … Sector: …"). SGI no tiene descripciones: sus notas son automáticas de estado.
- sin-equipos-en-registro: la descripción no nombra equipos; la ficha muestra el alcance publicado del servicio con su leyenda.
- sin-sector: el cliente no tiene sector asignado ni se infiere del texto.
- titulo-repetido-en-cliente: mismo cliente, mismo título, mismo mes; no hay dato que los distinga.

SGI manda en fecha de inicio, fecha de cierre y estado de cada proyecto con ficha web (src/data/sgi/fechas.json: sólo fechas y estado por id web; el volcado completo de SGI no entra al repo).

518 fichas servidas de 518 en el catálogo. Fichas limpias: 165. Señales:

| Señal | Fichas |
|---|---|
| descripcion-corta | 312 |
| sin-equipos-en-registro | 95 |
| sin-sector | 25 |
| titulo-repetido-en-cliente | 8 |
| titulo-corto | 1 |

### Cruce con SGI

SGI tiene 524 proyectos; 517 tienen ficha web. Sin ficha web: 7 (el detalle queda en SGI, no en este informe). Fichas web sin proyecto en SGI: 1.

### Las 40 fichas con más señales

| Ficha | Cliente | Título | Señales |
|---|---|---|---|
| [3662](/propuesta/antecedentes/3662/venta-de-remanente-de-proyectos) | Sanjuan, Daniel Alberto | Venta de remanente de Proyectos | descripcion-corta, sin-sector, sin-equipos-en-registro |
| [3066](/propuesta/antecedentes/3066/torre-thays-dispositivos-de-deteccion) | Consorcio Torre Thays | Torre Thays · Dispositivos de detección | descripcion-corta, sin-equipos-en-registro |
| [3080](/propuesta/antecedentes/3080/implementacion-de-redes-de-datos-y-fibra-optica-aeropuertos-argentina-2000) | Aeropuertos Argentina 2000 | Implementación de Redes de Datos y Fibra Óptica · abril 2025 | descripcion-corta, titulo-repetido-en-cliente |
| [3068](/propuesta/antecedentes/3068/implementacion-de-redes-de-datos-y-fibra-optica-aeropuertos-argentina-2000) | Aeropuertos Argentina 2000 | Implementación de Redes de Datos y Fibra Óptica · abril 2025 | descripcion-corta, titulo-repetido-en-cliente |
| [3084](/propuesta/antecedentes/3084/servicio-por-desarrollo-y-puesta-en-marcha-de-proyecto) | TDS · True Digital Systems S.A. | Servicio por desarrollo y puesta en marcha de proyecto | descripcion-corta, sin-sector |
| [3587](/propuesta/antecedentes/3587/configuracion-de-llaveros) | José Nucete e Hijos S.A. | Configuración de llaveros | descripcion-corta, sin-equipos-en-registro |
| [3134](/propuesta/antecedentes/3134/reparacion-de-central-de-deteccion-de-incendio-firewarden-10) | Allex S.A. | Reparación de Central de detección de incendio Firewarden 100X | descripcion-corta, sin-sector |
| [3076](/propuesta/antecedentes/3076/sistena-deteccion-de-incendios-aa2000-san-juan) | Procon S.R.L. | Sistema Detección de Incendios · AA2000 San Juan | descripcion-corta, sin-equipos-en-registro |
| [3147](/propuesta/antecedentes/3147/proyecto-de-corrientes-debiles) | José Nucete e Hijos S.A. | Proyecto de | descripcion-corta, sin-equipos-en-registro |
| [3590](/propuesta/antecedentes/3590/fuente-de-alimentacion) | RAC S.R.L. | Fuente de alimentacion | descripcion-corta, sin-sector |
| [3156](/propuesta/antecedentes/3156/aeropuertos-telecomunicaciones-scanner-municipalidad-de-gral-san-martin) | Municipalidad de Gral San Martín | Scanner | titulo-corto, sin-equipos-en-registro |
| [3165](/propuesta/antecedentes/3165/prestacion-de-servicio-de-internet-compartido-20mb-x-24-mese) | Fondo para la Transformación y el Crecimiento de Mendoza (FTyC) | Prestación de servicio de Internet compartido 20MB x 24 meses | descripcion-corta, sin-equipos-en-registro |
| [3596](/propuesta/antecedentes/3596/insumo-de-informatica) | Procon S.R.L. | Insumo de informática | descripcion-corta, sin-equipos-en-registro |
| [3179](/propuesta/antecedentes/3179/adicional-aeropuerto-df-sarmiento) | Procon S.R.L. | Adicional Aeropuerto DF Sarmiento | descripcion-corta, sin-equipos-en-registro |
| [3601](/propuesta/antecedentes/3601/cpu-para-coco-y-cpu-para-vigilancia) | José Nucete e Hijos S.A. | CPU para coco y CPU para vigilancia | descripcion-corta, sin-equipos-en-registro |
| [3211](/propuesta/antecedentes/3211/puesta-en-servicios-de-control-de-asistencia-en-planta) | Obras S.R.L. | Puesta en servicios de control de asistencia en planta | descripcion-corta, sin-equipos-en-registro |
| [3205](/propuesta/antecedentes/3205/baterias-y-ups-para-central-de-deteccion-de-incendio) | Gani S.A. | Baterias y UPS para central de detección de incendio | descripcion-corta, sin-sector |
| [3603](/propuesta/antecedentes/3603/proyecto-red-de-incendio-para-la-sede-administrativa-del-4) | Dirección Provincial de Vialidad de Mendoza | Proyecto Red de Incendio para la Sede Administrativa del 4º Distrito | descripcion-corta, sin-equipos-en-registro |
| [3600](/propuesta/antecedentes/3600/comodato-telefonico-por-1-ano) | Municipalidad Guaymallén | Comodato telefonico por 1 año | descripcion-corta, sin-equipos-en-registro |
| [3166](/propuesta/antecedentes/3166/ce-terminal-de-san-martin) | Procon S.R.L. | CE · Terminal de San Martín | descripcion-corta, sin-equipos-en-registro |
| [3214](/propuesta/antecedentes/3214/soluciones-tecnologicas-cambio-de-central-gani-sa) | Gani S.A. | Cambio de central | descripcion-corta, sin-sector |
| [3163](/propuesta/antecedentes/3163/corrientes-debiles-hotel-de-la-terminal-de-mendoza) | Fuente Mayor S.A. | Corrientes Debiles · Hotel de la Terminal de Mendoza | descripcion-corta, sin-equipos-en-registro |
| [3606](/propuesta/antecedentes/3606/despliegue-ftth-y-ultima-milla) | ITC | Despliegue FTTH Y Ultima Milla | descripcion-corta, sin-sector |
| [3605](/propuesta/antecedentes/3605/insumo-de-informatica) | Municipalidad de Gral San Martín | Insumo de informática · julio 2022 | descripcion-corta, sin-equipos-en-registro |
| [3241](/propuesta/antecedentes/3241/sitema-de-corriente-debiles-bodega-sur-de-los-andes) | Luna Maya | Sitema de corriente debiles · Bodega Sur de Los Andes | descripcion-corta, sin-equipos-en-registro |
| [3245](/propuesta/antecedentes/3245/edificio-thays-panel-remoto) | Diego | Edificio Thays · Panel Remoto | descripcion-corta, sin-equipos-en-registro |
| [3612](/propuesta/antecedentes/3612/insumos-de-informatica-desde-mayo-del-2022-hasta-abril-del-2) | José Nucete e Hijos S.A. | Insumos de informática desde Mayo del 2022 hasta Abril del 2023 | descripcion-corta, sin-equipos-en-registro |
| [3222](/propuesta/antecedentes/3222/mantenimiento-critico-de-sistemas-de-deteccion-marsch-sa-septiembre-2022) | Marsch S.A. | Mantenimiento Crítico de Sistemas de Detección | descripcion-corta, sin-sector |
| [3617](/propuesta/antecedentes/3617/insumo-de-informatica) | Municipalidad de Gral San Martín | Insumo de informática · diciembre 2021 | descripcion-corta, sin-equipos-en-registro |
| [3616](/propuesta/antecedentes/3616/glc-conector-scupc-sm-mecanico-fo-5625) | Municipalidad de Gral San Martín | Glc Conector Sc/upc Sm Mecánico Fo-5625 | descripcion-corta, sin-equipos-en-registro |
| [3254](/propuesta/antecedentes/3254/desarrollo-de-software-y-digitalizacion-de-procesos-procon-srl-2) | Procon S.R.L. | Sistema de corriente débiles aeropuerto de San Juan | descripcion-corta, sin-equipos-en-registro |
| [3618](/propuesta/antecedentes/3618/crimpeadora-furukawa) | Municipalidad de Gral San Martín | Crimpeadora furukawa | descripcion-corta, sin-equipos-en-registro |
| [3615](/propuesta/antecedentes/3615/glc-drop-flat-2core-sm-port-acero-g657a2-1000m) | Municipalidad de Gral San Martín | Glc Drop Flat 2core Sm Port Acero G657a2 1000m | descripcion-corta, sin-equipos-en-registro |
| [3619](/propuesta/antecedentes/3619/30-porta-bastidor-universal-para-cablecanal-30-faceplate-4) | Municipalidad de Gral San Martín | 30 Porta bastidor universal para cablecanal; 30 Faceplate 4 puertos | descripcion-corta, sin-equipos-en-registro |
| [3625](/propuesta/antecedentes/3625/jack-cat5e-y-faceplate) | Municipalidad de Gral San Martín | Jack Cat.5e y faceplate | descripcion-corta, sin-equipos-en-registro |
| [3300](/propuesta/antecedentes/3300/provision-de-torre-y-equipamiento) | Municipalidad de Tupungato | Provisión de torre y equipamiento | descripcion-corta, sin-equipos-en-registro |
| [3309](/propuesta/antecedentes/3309/corrientes-debiles-rto) | Procon S.R.L. | Corrientes débiles RTO | descripcion-corta, sin-equipos-en-registro |
| [3307](/propuesta/antecedentes/3307/desarrollo-de-software-y-digitalizacion-de-procesos-flexcolor-s-r-l) | Flexcolor S.R.L. | Desarrollo de Software y Digitalización de Procesos | descripcion-corta, sin-sector |
| [3316](/propuesta/antecedentes/3316/ssd-y-memoria-ram-8gb) | Construcciones | SSD y Memoria ram 8GB | descripcion-corta, sin-equipos-en-registro |
| [3322](/propuesta/antecedentes/3322/implementacion-de-redes-de-datos-y-fibra-optica-municipalidad-de-gral-san-martin-3) | Municipalidad de Gral San Martín | 10 patchcord sc-lc monomodo y 3 botellones de 24 fibra | descripcion-corta, sin-equipos-en-registro |
