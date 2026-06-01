El proyecto que Sturzenegger mandó esta semana al Congreso permite registrar una sociedad anónima que jamás contrató a un humano y nunca lo va a contratar. La contadora de San Rafael que firmó su primera SRL en 2009 —papel obra ruso, tres socios sentados en su escritorio, mate frío sobre el portavasos del Toyota Hilux gris estacionado en la puerta— leyó el borrador y se encontró con una pregunta vieja en cuerpo nuevo: ¿quién firma cuando algo sale mal? El casillero "nómina", que en su carrera se llenaba con tres dígitos como mínimo, ahora puede quedar en cero para siempre. La sociedad, en este caso, no es de personas: es de código.

## La sociedad sin nómina llega al Boletín Oficial antes que al taller de modelos

Esta semana, el ministro Federico Sturzenegger detalló un paquete de reformas que incluye un proyecto de Ley de Sociedades para "habilitar empresas que funcionen sin intervención humana directa, gestionadas íntegramente por sistemas de inteligencia artificial". El argumento oficial: convertir a Argentina en sede fiscal de "agentes de IA" y replicar lo que hizo Irlanda con software hace dos décadas. El paquete viene acompañado por la derogación de 80 normativas que el ministerio considera obsoletas y por una reforma de la Ley General de Sociedades 19.550, según [el detalle publicado en La Nación el 29 de abril](https://www.lanacion.com.ar/politica/sturzenegger-impulsa-una-ley-para-que-existan-empresas-gestionadas-100-por-inteligencia-artificial-nid29042026/) y [la cobertura de Ámbito](https://www.ambito.com/economia/federico-sturzenegger-impulsa-una-ley-que-existan-empresas-gestionadas-100-inteligenciaaartificial-n6271805).

La pieza clave para el contador mendocino no está en el discurso pirotécnico, sino en una línea técnica del articulado: el órgano de administración de una SA puede ser "un sistema automatizado". El [registro PYMES de la Secretaría de Industria](https://www.argentina.gob.ar/produccion/registro-pyme) computa hoy 1.286.247 empresas activas en el país. Si el 0,5% migrara a la figura sin nómina, son 6.400 sociedades sin recibos de sueldo en menos de tres años. El número parece chico hasta que entran las consultoras unipersonales y los estudios contables que ya facturan vía monotributo y verían en la SA fantasma una oportunidad de optimización.

## Por qué borrar al humano del organigrama no resuelve el problema fiscal

La intuición es directa: una empresa sin empleados es una empresa más barata. Menos recibos, menos cargas, menos ART, menos paritarias. Si te apurás, hasta menos peleas con el sindicato. La cuenta cierra rápido en una servilleta. Cierra menos rápido cuando se sienta una contadora con un mate frío, abre un simulador en una pestaña al lado del Excel impreso con engargolado azul, y empieza a marcar las casillas que no encajan.

Acá aparece el antagonista, y no es el robot. Es la mecánica argentina de tributación, que se construyó sobre tres puntos de apoyo —el sueldo bruto, la factura electrónica y el saldo bancario— y dos de esos tres están atados a un humano. ARCA todavía exige una persona física como responsable inscripto detrás de cada CUIT activo (Resolución General 5615/2024); IGJ pide directorio con domicilio real (Ley 19.550, art. 60); la UIF requiere "beneficiario final" persona humana en cualquier estructura societaria (Resolución 112/2021). Habilitar la sociedad sin nómina no es achicar un casillero: es desarmar el andamiaje de identidad detrás del sistema impositivo. La pyme cuyana lo intuye antes que el legislador. Si el modelo factura, ¿quién firma cuando se equivoca?

## El CUIT que factura sin recibos: la pila técnica ya existe en Mendoza

Conviene bajar de la metafísica al servidor. Hoy, sin esperar la ley, una pyme cuyana puede operar un agente de IA bajo CUIT propio combinando piezas que ya están en el catálogo del software libre.

La pila mínima funciona así: una instancia de **n8n 1.78** con cola Redis para orquestar workflows; **Ollama 0.6** sirviendo un modelo open weights (Qwen 3 32B o Llama 4 8B) en una GPU NVIDIA L4 alquilada por hora a un proveedor argentino; **PostgreSQL 17** con extensión pgvector para memoria de largo plazo del agente; **Mautic 5** para que ese agente dispare campañas reales y emita facturas vía la API de ARCA. Servidor dedicado en Buenos Aires, ancho de banda metropolitano, monitoreo Grafana. Costo total: entre USD 280 y USD 420 mensuales al cambio del dólar mayorista del 30 de abril ([Comunicación A8189 de ARCA](https://www.arca.gob.ar/)). Tiempo de implementación: dos semanas con un equipo de tres.

UMSA tiene este stack montado para clientes de trazabilidad de residuos peligrosos en la Dirección General de Fiscalización Ambiental de Mendoza desde 2024. La factura no la firma un robot: la firma un responsable humano matriculado, que es quien le dice al modelo cuándo arrancar y cuándo callarse. Esa diferencia —responsable visible, agente operando— es la que el proyecto del ministerio todavía no termina de despejar.

## Tres riesgos honestos antes de inscribir tu sociedad sin humanos

Primero: **la responsabilidad civil**. El art. 1758 del Código Civil y Comercial responsabiliza al "dueño y guardián" de la cosa por daños. Cuando la cosa es un agente que firmó un contrato perdidoso, ¿quién es el guardián? El proyecto no lo aclara, y la jurisprudencia internacional —el caso Mata v. Avianca de 2023 en EE.UU., donde un abogado citó precedentes inventados por ChatGPT— ya empezó a fijar que la responsabilidad sigue al humano que delegó.

Segundo: **el lavado**. Una sociedad sin beneficiario final visible es exactamente el tipo de vehículo que el GAFI marcó en su [informe Argentina 2024](https://www.fatf-gafi.org/en/publications/Mutualevaluations/Mer-argentina-2024.html) como vector de riesgo alto. La UIF va a venir, sin importar lo que diga IGJ.

Tercero: **el costo del modelo abierto**. Ollama corre, sí, pero un Qwen 3 32B cuantizado entrega 14 tokens por segundo en una L4 de 24 GB. Para una pyme mendocina con tráfico real eso significa entre USD 800 y USD 1.200 mensuales solo en cómputo, sin contar tokens de inferencia ni almacenamiento. La SA sin empleados no es gratis: es una SA cuyo sueldo se paga en electricidad y silicio.

## Para seguir leyendo

- [Sturzenegger impulsa la ley de sociedades IA — La Nación, 29/04/2026](https://www.lanacion.com.ar/politica/sturzenegger-impulsa-una-ley-para-que-existan-empresas-gestionadas-100-por-inteligencia-artificial-nid29042026/)
- [Reforma Ley de Sociedades, paquete completo — Ámbito](https://www.ambito.com/economia/federico-sturzenegger-impulsa-una-ley-que-existan-empresas-gestionadas-100-inteligenciaaartificial-n6271805)
- [Proyecto de Actualización Ley de Datos Personales — AAIP](https://www.argentina.gob.ar/aaip/datospersonales/proyecto-ley-datos-personales)
- [ARCA 5824/2026: el director que nunca facturó tiene fecha](/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha)
