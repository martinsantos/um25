El gerente de la cooperativa eléctrica miró el dashboard nuevo y pidió que volvieran al Excel. Era abril, hacía dos semanas que habían pagado USD 1.260 por la suscripción anual de Power BI Pro para 18 usuarios, y la pantalla seguía sin poder graficar el consumo por subestación porque el conector ODBC al sistema antiguo de medición tarifaba "por carga". El proveedor de Microsoft 365 le había mandado un mail con la frase "complemento de capacidad Premium F2" y un presupuesto en dólares. La planilla con macros que armaba el técnico desde 2017 mostraba los mismos datos en cuatro segundos.

## El cuadro de mando empieza a latir cuando se desconecta del peaje por usuario

Power BI cobra entre USD 14 y USD 24 por usuario por mes en la región LATAM, según [el tarifario público de Microsoft](https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing). En una cooperativa de servicios públicos con 28 personas que necesitan ver dashboards —cuadrilla, atención al socio, finanzas, técnica— la cuenta arranca en USD 4.700 anuales y crece con la "capacidad" si querés exportar a SQL Server o consumir DirectQuery sobre tablas grandes. La encuesta [State of Open Source 2026 de OpenLogic](https://www.openlogic.com/resources/state-of-open-source-report) detectó que el 68% de las pymes latinoamericanas pagaba por suscripciones de BI que no usaba arriba del 30% de funcionalidades. Para la cooperativa cuyana esa cuenta tenía nombre y apellido: la subestación rural y el mapa de pérdidas técnicas, dos cosas que el plan Pro no podía dibujar sin pasar al plan Premium.

Acá entra Metabase 0.51, lanzado en febrero de 2026, que corre encima de PostgreSQL 17 y se planta como una alternativa silenciosa para los equipos que ya tienen el dato y no quieren pagar para mirarlo.

La diferencia no es de precio: es de propiedad.

Cuando el dashboard vive en tu servidor, el directorio técnico decide cuándo cambia el modelo de datos. Cuando vive en una nube comercial, lo decide el ingeniero de producto en Redmond.

## Por qué pagar la licencia premium no resuelve el problema de fondo

La intuición del directorio cooperativo es entendible: si el problema es que Power BI no carga la tabla grande, paguemos el plan que sí la carga. El gerente comercial ya tenía el formulario de la actualización Premium F2 abierto. La cuenta saltaba a USD 11.400 anuales y agregaba una capacidad de cómputo dedicada. La factura se firma, el dashboard arranca, todos contentos.

El problema es otro y vive más abajo. El sistema de medición de la cooperativa es un PostgreSQL 14 con 740 millones de filas de lecturas horarias desde 2018. Power BI puede leerlas vía DirectQuery, pero cada filtro pesa cinco a doce segundos en la red metropolitana de Mendoza, donde el ancho de banda hacia Microsoft Azure East US se mueve entre 38 y 90 ms de latencia con picos de 220 ms en horas pico. La nube comercial cobra por la lectura, además. La salida obvia —subir más fierro a Microsoft— no resuelve la latencia ni la dependencia: solo redistribuye el costo.

El antagonista no es el tarifario: es la decisión arquitectónica de poner el motor de visualización en otro continente cuando el dato vive a 40 metros del servidor de medición. La cooperativa, sin saberlo, llevaba ocho años pagando tránsito internacional para mirar consumos de Junín de los Andes y Real del Padre.

## La pila libre que entra en una VM de cuatro vCPUs

El stack que terminó instalando el equipo técnico cabe en una imagen Docker Compose y funciona como cualquier otra app interna.

**Metabase 0.51** corre en una VM de 4 vCPUs y 8 GB de RAM ([documentación oficial](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase)). Conecta directo al PostgreSQL 17 productivo en modo solo lectura. Para queries pesadas usa el caché Metabase Cache con TTL configurable —entre 15 y 60 minutos según el dashboard— y un read replica con `pg_repack` para no pisar la base operativa.

Encima va **dbt 1.9** versionado en Forgejo (Gitea fork) para que el modelo de datos sea código revisable, no un archivo .pbix que solo abre Marisa los lunes. Y abajo, para los técnicos que quieren más libertad gráfica, **Apache Superset 4.1** con Docker, leyendo las mismas materializadas. Costo total de licencias: cero. Costo total de infraestructura: USD 38 mensuales por la VM en un cloud argentino, USD 12 en backups Borg sobre MinIO. Tiempo de implementación con datos limpios: cinco días para la cooperativa eléctrica.

UMSA usa este patrón en proyectos de monitoreo de fibra industrial para clientes vitivinícolas de Luján de Cuyo desde 2023. La curva de aprendizaje no es nula —dbt obliga a pensar el modelo— pero el ahorro paga la curva en el primer trimestre. Y el dashboard, ahora, abre en menos de un segundo.

## Tres riesgos honestos antes de migrar tu BI a Metabase

Primero: **la curva de SQL**. Power BI permite que un analista financiero arme medidas en DAX sin escribir una sola consulta. Metabase tiene su Question Builder gráfico, pero los dashboards potentes piden SQL. Si tu equipo no tiene dos personas que sepan PostgreSQL al nivel CTE y window functions, la migración se traba. Tres cursos online de buena calidad sobre SQL avanzado bajan la curva, pero hay que presupuestarlos.

Segundo: **el go-to-market de los conectores**. Power BI tiene 200+ conectores nativos a SaaS. Metabase tiene 23 oficiales más una API de plugins. Si tu pyme depende de leer datos de HubSpot, Salesforce o Stripe en vivo, vas a terminar montando un Airbyte 0.62 o un Meltano para hidratar PostgreSQL. Eso es otra pieza, otro RAM y otra rotación de tokens.

Tercero: **la gobernanza**. Metabase no trae Row Level Security tan refinado como Power BI. Si tu organización necesita que el gerente de zona vea solo su zona y no la del vecino, hay que diseñar el RLS en PostgreSQL con vistas seguras y políticas. Es factible, pero exige una persona que entienda permisos a nivel base de datos. No es magia.

## Para seguir leyendo

- [State of Open Source 2026 — OpenLogic](https://www.openlogic.com/resources/state-of-open-source-report)
- [Metabase 0.51 release notes](https://www.metabase.com/releases/metabase-51)
- [Apache Superset 4.1 docs](https://superset.apache.org/docs/intro)
- [n8n en pymes: la arquitectura que saca a Zapier de la factura](/blog/n8n-en-pymes-la-arquitectura-que-saca-a-zapier-de-la-factura)
