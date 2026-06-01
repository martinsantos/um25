El tesorero de la cámara empresaria de San Martín abrió el resumen de la tarjeta corporativa y se quedó tres segundos en la línea de Atlassian. La cifra estaba bien, los usuarios licenciados también. Lo que no estaba bien era el tipo de cambio aplicado: USD 1 facturado al billete tarjeta, peso minorista del 28 de abril, recargo del 60% por percepción anticipada del impuesto a las ganancias. La cuota mensual de Jira Standard, que el año pasado costaba 67 mil pesos por 12 usuarios, esta vez salió 218 mil. Treinta y dos por ciento del presupuesto trimestral de software corporativo de la cámara, en un solo renglón, en una sola tarjeta.

## La factura del peaje SaaS llegó con el dólar bridado al 8 y nadie quiere firmarla

El cuadro tarifario del dólar tarjeta el 28 de abril de 2026 cerró en torno a los 1.840 pesos por dólar, según [el monitoreo del BCRA](https://www.bcra.gob.ar/PublicacionesEstadisticas/Tipo_de_cambio_de_referencia.asp). Multiplicado por el spread del exterior, contra los 1.430 pesos del dólar mayorista, deja la suscripción típica a SaaS un 28% más cara que hace cuatro meses sin que el proveedor toque el precio en dólares. Para una cámara empresaria con 1.800 socios distribuidos entre Junín, San Martín y Rivadavia, el efecto compuesto es brutal.

El relevamiento [del Observatorio PYMES de la UADE de marzo 2026](https://observatoriopymes.org.ar/) indica que las pymes argentinas de Cuyo gastan en promedio el 4,7% de su facturación en herramientas SaaS importadas: HubSpot, Atlassian, Adobe Creative Cloud, Microsoft 365, Notion, Slack, Zoom, AWS y Google Workspace concentran el 78% de ese gasto. La cámara, que asesora a sus socios, calcula que entre marzo y abril el costo dolarizado en pesos creció 31% sin que se sumara una sola licencia. Lo que entró en abril no fue una renovación: fue una transferencia silenciosa de excedente al exterior.

## Por qué cancelar la suscripción no resuelve la cuestión de fondo

La salida obvia es austera: cortar usuarios, bajar de plan, pasar de Standard a Free. La cámara probó esa receta en febrero con Slack: bajó de 38 a 14 usuarios pagos. Ahorró USD 220 mensuales. Perdió la búsqueda histórica de mensajes y, en consecuencia, perdió tres conversaciones clave del directorio que nadie había exportado. La intuición funciona en una hoja de cálculo. Cae en la práctica.

El antagonista real no es la suscripción: es **la deuda dolarizada por suscripción**. Es el momento en el que una pyme del Valle de Uco descubre que no contrató una herramienta, contrató un peaje sobre su propia operación, y ese peaje se ajusta cada vez que el dólar tarjeta se mueve. El proveedor en Atlanta, San Francisco o Sídney no negocia tarifas en pesos argentinos: aplica el tipo de cambio de la red Visa o Mastercard, sin posibilidad de freezing. Mientras la pyme cuyana intenta pasar precios en pesos a clientes locales con un trimestre de adelanto, su factura de software se reajusta en tiempo real.

La consecuencia es que cuando el dólar pega un salto, el primer presupuesto que tiembla no es el sueldo: es el del software. Y los recortes hechos en pánico —cortar usuarios, dejar de pagar trazabilidad, soltar storage— suelen costar dos o tres veces el ahorro inmediato.

## Las salidas reales: autohospedaje, suscripciones argentinas y consorcios

Hay tres caminos concretos que la cámara está mapeando para sus socios, y los tres tienen casos en Cuyo.

**Autohospedaje selectivo**. No se trata de migrar todo. Se trata de identificar las dos o tres herramientas que se llevan la mitad de la factura y reemplazarlas con software libre alojado en infraestructura local. Atlassian Jira a [Plane.so](https://plane.so) o [OpenProject 14](https://www.openproject.org). HubSpot Marketing Hub a Mautic 5 sobre PostgreSQL. Slack a [Zulip 9.4](https://zulip.com) o Mattermost. La inversión inicial es real —entre USD 4.000 y USD 12.000 según el alcance, una vez— pero la cuota mensual cae a infraestructura de servidor argentino: USD 80 a USD 200 por mes para una pyme de 50 personas.

**Suscripciones en pesos**. Hay un puñado de proveedores argentinos que ya facturan SaaS en pesos con CUIT local: Tiendanube, Errepar, Holded en algunas líneas, Tango Nexo, BlueSoft. Ninguno reemplaza a HubSpot, pero juntos cubren CRM ligero, contabilidad, RR.HH. y facturación con factura A. La cámara armó una guía interna que cruza función SaaS dolarizada con alternativa peso, herramienta a herramienta.

**Consorcios de licencias**. La tercera vía es la más mendocina: agrupar pymes en un único contrato corporativo. Atlassian Cloud Enterprise tiene escalones de descuento desde 250 usuarios. Cinco pymes de 50 usuarios, sumadas, llegan al escalón. La cámara empresaria es la figura natural para administrar el consorcio. UMSA acompaña este patrón desde 2024 en proyectos de infraestructura compartida con cooperativas y mutuales del este provincial: una infraestructura, una factura, varios CUITs adentro.

## Tres riesgos honestos antes de cortar la nube comercial

Primero: **la migración no es gratis**. Mover 4 años de tickets de Jira a OpenProject toma entre 80 y 240 horas según calidad del exporte. Si la pyme no asigna esas horas, la migración fracasa y vuelve la suscripción.

Segundo: **el upskilling**. Las herramientas autohospedadas necesitan un humano que sepa parchar el servidor, mover backups y revisar logs. Si en la pyme no hay nadie con perfil DevOps —o un proveedor externo que cumpla ese rol— la deuda técnica se acumula y la disponibilidad cae. La cuenta del peaje vuelve, disfrazada de pérdida de horas-persona.

Tercero: **la latencia con clientes y proveedores**. Si la cadena de valor de la pyme está integrada con un SaaS específico —que un cliente grande exija recibir órdenes vía Salesforce, que un proveedor solo facture vía Coupa— migrar internamente no resuelve la dependencia externa. Hay que mapear la cadena completa antes de cortar.

La factura de abril ya se pagó. La de mayo todavía no. Esa es la ventana real, y se cierra antes de lo que parece.

## Para seguir leyendo

- [Tipo de cambio referencia BCRA](https://www.bcra.gob.ar/PublicacionesEstadisticas/Tipo_de_cambio_de_referencia.asp)
- [Observatorio PYMES UADE — Informe Cuyo](https://observatoriopymes.org.ar/)
- [State of Open Source 2026 — OpenLogic](https://www.openlogic.com/resources/state-of-open-source-report)
- [Coolify v4: cuándo autohospedar tu deploy y dejar de pagar Vercel](/blog/coolify-v4-cuando-autohospedar-tu-deploy-y-dejar-de-pagar-vercel)
