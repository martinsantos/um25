import type { EntradaBlog } from '../lib/directus';

export const MOCK_POSTS: EntradaBlog[] = [
  {
    id: '0',
    status: 'published',
    slug: 'plantilla-arca-facturacion-electronica-gratis',
    titulo: 'Plantilla ARCA: Facturación Electrónica Gratis con RG 5824 (Open Source)',
    resumen: 'Herramienta open source (MIT) para generar facturas electrónicas según RG 5824 de AFIP. Sin Tango, sin Bejerman. Probá gratis en 5 minutos. Facturación sin estrés, auditoría sin pedir permiso, libertad sin lock-in.',
    meta_title: 'Plantilla ARCA: Facturación Electrónica Gratis | RG 5824 | Open Source MIT',
    meta_description: 'Generador de facturas electrónicas open source para cumplir RG 5824 de AFIP. Gratis, auditable, sin dependencias de terceros. Demo online disponible.',
    meta_keywords: 'Plantilla ARCA, facturación electrónica RG 5824, generador facturas Argentina, AFIP Web Services, facturación gratis, open source MIT, herramientas pymes',
    contenido: `<h2>El Gancho: Martín y los $500 Mensuales</h2>
<p>Martín es contador independiente en La Plata. Tiene 50 clientes pequeños, desde almacenes hasta profesionales liberales. Hace tres años, AFIP le obligó a cumplir con <strong>RG 5824</strong>: todas las facturas tienen que ser electrónicas, con CAE (Código de Autorización Electrónica).</p>
<p>El problema: la solución obvia era pagar $500/mes a Tango o Bejerman. Martín lo hizo durante un año. Luego se enfureció.</p>
<p>«¿Por qué estoy pagando $6.000 al año por un sistema que <strong>no me deja ver el código</strong>, que <strong>me bloquea si me quiero ir</strong>, y que literalmente <strong>le pide permiso a un servidor remoto para cada factura?</strong> Eso no es solución, eso es extorsión». Tuvo razón. Y así empezó esto.</p>
<p><strong>Hoy, Martín genera 200 facturas mensuales, sin pagar licencias, auditando cada línea de código.</strong></p>

<h2>El Problema: RG 5824 — La Regulación que Cambió Todo</h2>
<p>Si sos <strong>contador, director, abogado, profesional independiente o dueño de pyme en Argentina</strong>, la <strong>Resolución General 5824 de AFIP</strong> te alcanza. No es opcional.</p>
<p>Desde 2024, AFIP exige que <strong>todas las facturas emitidas en Argentina cumplan con estándares de facturación electrónica</strong>. No solo es «emitir un PDF»: tenés que conectarte a los <strong>Web Services de ARCA</strong> (Aplicación de Registro de Código de Autorización), solicitar un <strong>CAE</strong> (código único de autorización), y grabar el comprobante en la base de datos oficial de AFIP.</p>
<p>Si no cumplís:</p>
<ul>
<li><strong>Multas</strong> desde $5.000 hasta $1.000.000+</li>
<li><strong>Clausura</strong> del punto de venta</li>
<li><strong>Antecedentes</strong> fiscal que afectan futuras auditorías</li>
<li><strong>Impugnación</strong> de facturas por AFIP</li>
</ul>
<p><strong>¿A quién le afecta?</strong> Contadores, directores y socios, abogados e ingenieros, pymes, y freelancers con CUIT — si emitís recibos, entra en RG 5824.</p>

<h2>La Solución: Plantilla ARCA</h2>
<p>Acaba de nacer una herramienta open source, totalmente gratuita, que automatiza RG 5824 sin intermediarios.</p>
<p>Se llama <strong>Plantilla ARCA</strong>. Es un generador de facturas electrónicas que:</p>
<ul>
<li>✅ <strong>Se conecta directo a AFIP</strong> (sin Tango, sin Bejerman, sin plataformas caras)</li>
<li>✅ <strong>Solicita CAE automáticamente</strong> en 2-3 segundos</li>
<li>✅ <strong>Genera PDFs válidos</strong> con QR de verificación</li>
<li>✅ <strong>Guarda auditoría</strong> en base de datos propia</li>
<li>✅ <strong>Corre localmente o en la nube</strong> (tú decides)</li>
<li>✅ <strong>Totalmente gratis</strong> (licencia MIT)</li>
<li>✅ <strong>100% auditable</strong>: podés ver cada línea de código</li>
</ul>

<h2>Cómo Funciona (Técnico, pero entendible)</h2>
<p>La arquitectura en 30 segundos:</p>
<p><strong>Cliente (tu navegador) → Validación RG 5824 (Python) → Tres procesos en paralelo:</strong> Solicita CAE a Web Service ARCA, Genera PDF con ReportLab, Registra en PostgreSQL → Retorna PDF + Número de CAE</p>
<table>
<tr>
<th>Componente</th>
<th>Herramienta</th>
<th>Razón</th>
</tr>
<tr>
<td><strong>Lenguaje principal</strong></td>
<td>Python 3.10+</td>
<td>Simple, usado en AFIP, escalable</td>
</tr>
<tr>
<td><strong>Cliente ARCA</strong></td>
<td><code>arca_arg</code></td>
<td>Abstrae certificados, SOAP, WSAA</td>
</tr>
<tr>
<td><strong>Base de datos</strong></td>
<td>PostgreSQL</td>
<td>Auditable, escalable, open source</td>
</tr>
<tr>
<td><strong>PDFs con QR</strong></td>
<td>ReportLab</td>
<td>Control total, QR embebido, sin dependencias</td>
</tr>
<tr>
<td><strong>Interfaz usuario</strong></td>
<td>Streamlit</td>
<td>Prototipo rápido, funcional, zero config</td>
</tr>
<tr>
<td><strong>Contenedores</strong></td>
<td>Docker</td>
<td>Levantás todo con <code>docker-compose up</code></td>
</tr>
</table>

<h2>Casos de Uso: Cuatro Personas, Cuatro Soluciones</h2>
<h3>María: Contadora con 50 clientes pequeños</h3>
<p>Maria asesora pymes. Hoy descargó Plantilla ARCA. La instala en su VPS por $10/mes. Sus clientes se conectan, cargan datos JSON, presionan un botón, obtienen PDF en 3 segundos. <strong>Antes</strong>: Gastaba 2-3 horas/mes asesorando clientes. <strong>Ahora</strong>: Usa una herramienta, la entiende 100%.</p>

<h3>Juan: Director de PyME que recién se entero de RG 5824</h3>
<p>Juan vende repuestos automotrices. Encontró Plantilla ARCA, pasó 30 minutos: solicitó certificado AFIP, clonó el repo, <code>docker-compose up</code>, probó con 5 facturas en Homologación. Hoy genera 400 facturas/mes. El software le cuesta $0.</p>

<h3>Laura: Abogada con 8 profesionales en estudio</h3>
<p>Laura tiene estudio con 8 abogados. Cada uno factura clientes. Instaló Plantilla ARCA en servidor compartido. Los 8 abogados tienen usuario. Integró con sistema de turnos: cuando marca «facturado», genera PDF automático.</p>

<h3>Pablo: Freelancer que recién empieza</h3>
<p>Pablo es desarrollador. Emite pocas facturas (10-20/mes). Fue a la demo online de Plantilla ARCA. Cargó datos de una factura, presionó botón, descargó PDF en 3 segundos. Sin instalar nada. Sin pagar nada.</p>

<h2>Preguntas Frecuentes (Las que realmente te importan)</h2>
<h3>¿Es legal? ¿AFIP lo permite?</h3>
<p>Completamente legal. Usamos los mismos Web Services que Tango, Bejerman, ARCA directo. AFIP no prohíbe escribir tu propia herramienta. Ley de software libre (Ley 27.454) te respalda.</p>

<h3>¿Qué pasa si cargo datos incorrectos?</h3>
<p>ARCA valida antes de emitir CAE. Si algo está mal, rechaza la solicitud y <strong>te muestra el error exacto</strong>. No se emite nada inválido.</p>

<h3>¿Necesito certificado AFIP?</h3>
<p>Sí, pero es gratis. Tardás 3-5 días en obtener desde https://www.afip.gob.ar. Es X.509 (estándar de seguridad). Sin este certificado, no podés conectarte a ARCA.</p>

<h3>¿Puedo emitir en Producción desde el primer día?</h3>
<p>No recomendado. Plantilla ARCA default está en <strong>Homologación</strong> (entorno de prueba de AFIP). Probá ahí primero. Cuando estés seguro, cambias <code>ARCA_ENV=produccion</code>.</p>

<h3>¿Puedo usar la herramienta para dos empresas?</h3>
<p>Sí. Cada empresa configura su CUIT, su certificado, su base de datos. Cero interferencia. Es open source, podés forkear para cada caso.</p>

<h3>¿Es seguro guardar datos en mi BD?</h3>
<p>Más seguro que confiar en terceros. La base de datos está <strong>en tu máquina o en tu VPS</strong>. AFIP nunca ve tus datos de cliente, solo el comprobante fiscal.</p>

<h3>¿Puedo integrar con mi ERP / sistema de ventas?</h3>
<p>Completamente. API JSON. Enviás datos, recibes PDF + CAE. Es open source, podés customizar.</p>

<h3>¿Cuál es el catch? ¿En dónde monetizas?</h3>
<p>La herramienta es <strong>100% gratis, MIT, forever</strong>. Ultima Milla monetiza con consultoría, workshops, soporte profesional e integraciones. Creemos que el cumplimiento fiscal <strong>no debería tener costo de software</strong>. El expertise, sí.</p>

<h2>Roadmap: Lo que viene (y por qué)</h2>
<p><strong>Q2 2026 (Ahora)</strong>: ✅ Generador básico de facturas (A/B/C), ✅ Demo online, ✅ Documentación RG 5824</p>
<p><strong>Q3 2026</strong>: 🚀 Notas de Crédito / Débito, 🚀 API REST, 🚀 Batch processing, 🚀 Dashboard histórico</p>
<p><strong>Q4 2026</strong>: 🚀 Móvil (React Native), 🚀 Machine learning, 🚀 Webhooks</p>

<h2>Cómo Empezar: Tres Caminos</h2>
<h3>Opción 1: Online (5 minutos, sin instalar)</h3>
<p>La demo corre en nuestro servidor. Cargas datos, presionas botón, descargas PDF.</p>
<p><strong><a href="https://www.ultimamilla.com.ar/plantilla-arca/">👉 Probá Plantilla ARCA online →</a></strong></p>

<h3>Opción 2: Docker Local (15 minutos, para producción)</h3>
<p>Clonas, levantas con Docker, tenés todo en tu máquina.</p>
<pre><code># Clonar repositorio
git clone https://github.com/UltimaMilla/plantilla-arca.git
cd plantilla-arca

# Crear archivo .env
cp .env.example .env
nano .env

# Levantar servicios
docker-compose up

# Abrí navegador: http://localhost:8501</code></pre>

<h3>Opción 3: Servidor Propio (30 minutos, para escala)</h3>
<p>Si tenés VPS (AWS, DigitalOcean, Azure), hay guía en el README para desplegar con systemd + Nginx.</p>

<h2>Reflexión Final: Consistencia en la Facturación</h2>
<p>Hace tres años escribimos sobre integraciones complejas con AFIP. Hace dos años hablamos de RG 5824. Hace un año asesoramos contadores sobre qué herramientas usar.</p>
<p>Hoy <strong>entregamos la herramienta</strong>.</p>
<p>Eso es consistencia: no solo identificar problemas, resolverlos.</p>
<p><strong>Facturación sin estrés. Auditoría sin pedir permiso. Libertad sin lock-in.</strong></p>
<p>Creemos en Argentina. Creemos en pymes. Creemos que el <strong>cumplimiento fiscal no debería ser un negocio extractivo</strong>, sino una utilidad.</p>

<h2>Links Útiles y Recursos</h2>
<ul>
<li><strong>Herramienta online (demo):</strong> https://www.ultimamilla.com.ar/plantilla-arca/</li>
<li><strong>GitHub (código fuente, MIT):</strong> https://github.com/UltimaMilla/plantilla-arca</li>
<li><strong>AFIP Web Services (oficial):</strong> https://www.afip.gob.ar/ws/</li>
<li><strong>Solicitar certificado AFIP:</strong> https://www.afip.gob.ar/administracion/</li>
</ul>
<p><strong>¿Preguntas? Escribinos:</strong> hola@ultimamilla.com.ar</p>`,
    imagen_portada: null,
    categoria: 'tecnologia',
    tags: ['ARCA', 'RG-5824', 'facturación', 'AFIP', 'Python', 'open-source', 'pymes'],
    fecha_publicacion: '2026-04-26T10:00:00Z',
    tiempo_lectura: 10,
  },
  {
    id: '1',
    status: 'published',
    slug: 'nueva-normativa-camara-vigilancia-edificios-2024',
    titulo: 'Nueva normativa de cámaras de vigilancia en edificios: lo que tus vecinos ya te reclaman',
    resumen: 'La resolución 847/2024 del gobierno de Mendoza cambió las reglas para CCTV en propiedad horizontal. Administradores que no se adecúen tienen plazo hasta diciembre y pueden recibir multas. Esto es lo que hay que hacer.',
    meta_title: 'Normativa CCTV Mendoza 2024: Requisitos para edificios residenciales',
    meta_description: 'Resolución 847/2024 de Mendoza: nuevos estándares para cámaras de vigilancia en edificios. Qué cambia, plazos hasta diciembre y qué pasa si no te adecuás.',
    meta_keywords: 'normativa CCTV Mendoza 2024, cámaras vigilancia edificios, propiedad horizontal seguridad, resolución 847 2024, CCTV consorcios',
    contenido: `<p>A las 11 de la noche de un miércoles, un vecino del cuarto piso filmó con el celular la cámara del hall de su edificio en Guaymallén. La cámara apuntaba directamente a la puerta de su departamento. Subió el video a un grupo de WhatsApp con 120 integrantes del consorcio. A las 48 horas, la administración había recibido tres cartas documento.</p>

<p>No era un caso aislado. En 2024, las consultas sobre instalaciones de CCTV en propiedad horizontal crecieron un 40% en los estudios de administración de consorcio de Mendoza. La combinación de tecnología más accesible, mayor conciencia sobre privacidad y una normativa nueva creó una tormenta perfecta para administradores que no actualizaron sus sistemas.</p>

<h2>Qué dice la resolución 847/2024</h2>

<p>En marzo de 2024, la Dirección de Defensa del Consumidor de Mendoza publicó la resolución 847/2024 que establece requisitos técnicos mínimos para sistemas de videovigilancia en edificios de propiedad horizontal. No es una sugerencia: es de cumplimiento obligatorio para todos los edificios bajo régimen de la Ley 13.512.</p>

<p>Los cambios más importantes, en lenguaje directo:</p>

<h3>Retención de grabaciones: 30 días mínimo</h3>

<p>El requisito anterior era de 72 horas. La nueva norma exige almacenar las grabaciones durante al menos 30 días corridos. Esto tiene un impacto directo en la infraestructura: una cámara de 2MP grabando 24/7 genera aproximadamente 40GB de video por mes. Si el edificio tiene 8 cámaras, necesitás un sistema de almacenamiento con al menos 400GB disponibles, con margen.</p>

<p>La mayoría de los DVR instalados antes de 2022 tienen discos de 500GB a 1TB y no soportan esta retención con la resolución requerida. En los relevamientos que hicimos en edificios de Mendoza y Godoy Cruz, el 68% de los sistemas existentes no cumple este requisito.</p>

<h3>Resolución mínima de 2 megapíxeles</h3>

<p>Las cámaras analógicas y las IP de 720p que se instalaron masivamente entre 2015 y 2020 quedan fuera de norma. El requisito de 2MP (1080p Full HD) no es capricho estético: con resolución menor, las grabaciones no son útiles para identificación en situaciones de seguridad o litigios.</p>

<p>Este es el punto que más impacta el bolsillo: cambiar las cámaras implica en muchos casos revisar también el cableado. Las cámaras analógicas usan coaxial; las IP modernas usan UTP Cat5e o Cat6. En edificios de más de 20 años, ese cableado puede no existir o estar en condiciones deficientes.</p>

<h3>Cartelería obligatoria y visible</h3>

<p>La norma exige señalización en cada punto de acceso al edificio y en zonas monitoreadas, indicando que el lugar está bajo vigilancia. El cartel debe incluir el nombre del responsable del sistema y un número de contacto donde los residentes puedan solicitar información sobre las grabaciones que les conciernan.</p>

<p>Este punto tiene implicancias legales directas: sin cartelería adecuada, las grabaciones pueden no ser admisibles como prueba en procedimientos judiciales o administrativos.</p>

<h3>Prohibición de cámaras apuntando a unidades privadas</h3>

<p>El incidente del vecino de Guaymallén que mencionamos al principio ya era ilegal bajo el marco anterior. La nueva norma lo explicita con mayor precisión: ninguna cámara puede tener como campo visual principal la puerta, ventanas o zonas exclusivas de una unidad funcional. El ángulo de cobertura debe justificarse en función de la zona común que protege.</p>

<h2>Los plazos y qué pasa si no cumplís</h2>

<p>Los edificios existentes tienen tiempo hasta el 31 de diciembre de 2024 para adecuarse. Las nuevas construcciones deben cumplir desde el momento de la habilitación edilicia.</p>

<p>El incumplimiento puede derivar en:</p>

<ul>
<li>Multas del Municipio de hasta 30 Unidades Fijas (alrededor de $2.400.000 pesos a valores de octubre 2024)</li>
<li>Responsabilidad civil del administrador frente a reclamos de copropietarios</li>
<li>Inhabilitación de las grabaciones como prueba en cualquier trámite legal</li>
</ul>

<h2>El costo real de adecuarse (y el de no hacerlo)</h2>

<p>Un relevamiento y adecuación completa para un edificio de 20 unidades con 6 cámaras cuesta en promedio entre $800.000 y $2.400.000 pesos, dependiendo del estado del cableado existente y la calidad de los equipos elegidos.</p>

<p>Suena a mucho. Pero una multa municipal, un juicio de daños y perjuicios de un copropietario, o la invalidación de pruebas en un caso de robo pueden costar diez veces más. Sin contar el desgaste de la administración.</p>

<p>El cálculo que le recomendamos a los administradores es simple: ¿cuánto cobraría el seguro del edificio si hay un siniestro y el sistema de cámaras no cumple norma? En la mayoría de los contratos de seguro de propiedad horizontal, la respuesta es: nada.</p>

<h2>Por dónde empezar</h2>

<p>Antes de gastar un peso en equipos, la primera acción es un relevamiento técnico del sistema existente. Hay que determinar:</p>

<ol>
<li><strong>Estado del cableado actual:</strong> ¿Es coaxial o UTP? ¿Qué longitudes hay?</li>
<li><strong>Capacidad de almacenamiento del DVR/NVR:</strong> ¿Cuántos días retiene con los ángulos y resolución actuales?</li>
<li><strong>Campo visual de cada cámara:</strong> ¿Hay alguna apuntando incorrectamente?</li>
<li><strong>Existencia de cartelería:</strong> ¿Hay señalización actualizada en cada acceso?</li>
</ol>

<p>Con ese diagnóstico, el plan de adecuación puede priorizarse: a veces solo hace falta ajustar ángulos y agregar carteles. En otros casos hay que reemplazar cámaras o ampliar el almacenamiento. El relevamiento tarda entre 2 y 4 horas y cuesta una fracción del problema que evita.</p>

<hr/>

<h2>Preguntas frecuentes</h2>

<h3>¿La normativa aplica a casas en countries y barrios privados?</h3>
<p>No directamente. La resolución 847/2024 aplica a edificios bajo el régimen de propiedad horizontal (Ley 13.512). Los countries y barrios privados tienen figuras jurídicas propias y sus reglamentos internos. Sin embargo, la jurisprudencia sobre privacidad y orientación de cámaras aplica en todos los casos.</p>

<h3>¿Qué pasa con las cámaras de unidades individuales que apuntan a zonas comunes?</h3>
<p>Las cámaras instaladas por copropietarios en sus propias unidades que capturan zonas comunes (pasillos, hall, ascensores) entran en un área gris. La norma regula las cámaras del sistema del consorcio, pero un copropietario que instala cámaras propias con campo visual en zonas comunes puede ser objeto de reclamos bajo el código civil. Recomendamos que el reglamento de copropiedad lo regule explícitamente.</p>

<h3>¿Quién certifica que el sistema cumple la norma?</h3>
<p>La norma no establece un organismo certificador. La responsabilidad de cumplimiento recae en el administrador del consorcio. Una empresa instaladora habilitada puede emitir una declaración de conformidad técnica, que sirve como respaldo documental ante posibles reclamos.</p>`,
    imagen_portada: null,
    categoria: 'noticias',
    tags: ['normativa', 'CCTV', 'seguridad', 'mendoza', 'propiedad horizontal'],
    fecha_publicacion: '2024-10-14T09:00:00Z',
    tiempo_lectura: 7,
  },
  {
    id: '2',
    status: 'published',
    slug: 'aeropuerto-mendoza-red-wifi-6-proyecto',
    titulo: 'Wi-Fi 6 en el Aeropuerto El Plumerillo: 340 access points instalados sin apagar el aeropuerto ni un minuto',
    resumen: 'Durante 18 meses, renovamos por completo la red inalámbrica del Aeropuerto Internacional de Mendoza con 340 access points Cisco Wi-Fi 6 — sin interrumpir operaciones, en horario nocturno y con protocolo aeronáutico. Este es el detrás de escena.',
    meta_title: 'Wi-Fi 6 Aeropuerto Mendoza: 340 APs Cisco sin downtime — Caso ULTIMA MILLA',
    meta_description: 'Caso real: cómo ULTIMA MILLA instaló 340 access points Wi-Fi 6 en el Aeropuerto El Plumerillo durante 18 meses sin interrumpir operaciones. Metodología y resultados.',
    meta_keywords: 'Wi-Fi 6 aeropuerto, Cisco Catalyst 9130, infraestructura inalámbrica aeropuerto, redes aeropuerto Mendoza, telecomunicaciones aeronáuticas',
    contenido: `<p>La restricción principal no era técnica. Era humana.</p>

<p>En el Aeropuerto Internacional Francisco Gabrielli operan simultáneamente Aerolíneas Argentinas, LATAM, JetSmart y Flybondi. Hay vuelos desde las 5 de la mañana hasta la medianoche. En el edificio trabajan de forma permanente la Policía de Seguridad Aeroportuaria, la ANAC, Migraciones, Aduana y el personal de rampa. Cada uno de estos organismos tiene sistemas críticos que dependen de la red inalámbrica.</p>

<p>Cuando Aeropuertos Argentina 2000 nos convocó en 2022 para renovar la infraestructura Wi-Fi, la condición era absoluta: cero minutos de downtime. El sistema viejo tenía que seguir funcionando hasta el segundo exacto en que el nuevo lo reemplazara.</p>

<h2>El problema que nadie quería heredar</h2>

<p>La red existente tenía 8 años. En 2014, cuando se instaló, Wi-Fi 5 (802.11ac) era el estándar de punta. Para 2022, la situación era otra: el tráfico de datos en el aeropuerto había crecido 380% y la densidad de dispositivos se había multiplicado por seis. Un pasajero moderno llega al aeropuerto con el teléfono, la tablet, los auriculares inalámbricos y el reloj — todos compitiendo por el mismo canal.</p>

<p>Los síntomas eran claros: zonas muertas en las mangas de embarque, velocidades degradadas en horario pico, quejas recurrentes de pasajeros en las redes sociales del aeropuerto. Pero el problema real era menos visible: los sistemas internos de los operadores también estaban afectados. Las lectoras de boarding pass en remoto, los dispositivos de rampa y los terminales de facturación inalámbrica funcionaban con latencias que no deberían tener.</p>

<h2>Por qué Wi-Fi 6 y no Wi-Fi 5 mejorado</h2>

<p>Podríamos haber renovado el parque con más access points Wi-Fi 5. Hubiera sido más barato, más rápido de implementar y técnicamente suficiente para los estándares del momento.</p>

<p>La decisión de ir a Wi-Fi 6 (802.11ax) tuvo tres fundamentos:</p>

<p><strong>OFDMA y densidad de usuarios.</strong> Wi-Fi 6 introduce acceso múltiple por división de frecuencia ortogonal, que permite transmitir a múltiples clientes simultáneamente en el mismo canal. En un aeropuerto con 800 pasajeros en hora pico, esto no es un nice-to-have: es lo que hace la diferencia entre 10 Mbps y 90 Mbps por usuario.</p>

<p><strong>Target Wake Time (TWT).</strong> Los dispositivos IoT y los terminales de los operadores pueden negociar cuándo se despiertan para transmitir, reduciendo la congestión del espectro. En un ambiente con miles de dispositivos conectados, esto se traduce en una red más estable bajo carga extrema.</p>

<p><strong>Horizonte de 10 años.</strong> El aeropuerto proyecta incorporar sistemas de monitoreo de pasajeros, puertas de embarque automatizadas y plataformas de experiencia del viajero en los próximos cinco años. Todos estos sistemas asumen Wi-Fi 6 como mínimo. Instalar Wi-Fi 5 hoy sería hacer esta obra dos veces.</p>

<h2>La metodología: 18 meses en ventanas nocturnas de 4 horas</h2>

<p>El aeropuerto cierra su última operación comercial alrededor de las 00:30. Los primeros vuelos salen a las 05:00. Eso nos dejaba una ventana de trabajo de 4 horas y media — incluyendo el tiempo de ingreso del personal y los equipos por acceso de seguridad, que sola toma 45 minutos.</p>

<p>Dividimos el aeropuerto en 23 zonas de trabajo. Cada zona tenía entre 12 y 18 access points. El proceso para cada zona era:</p>

<ol>
<li>Instalar físicamente los nuevos Cisco Catalyst 9130 sin desactivar los equipos viejos</li>
<li>Configurar el nuevo AP en modo pasivo — monitorea, no transmite</li>
<li>Verificar cobertura y solapamiento con herramientas de análisis de espectro</li>
<li>En la noche de comisionamiento: migración en caliente, con el AP viejo activo hasta el momento del switchover</li>
<li>Verificación funcional con todos los sistemas críticos antes de retirarse</li>
</ol>

<p>El trabajo nocturno implicó coordinar con los equipos de seguridad aeroportuaria para cada acceso a zonas restringidas. Cada noche, dos técnicos nuestros completaban el ingreso junto con un supervisor de la PSA. Los equipos eran revisados individualmente. El protocolo era el mismo tanto si entrábamos a la terminal pública como a la zona de preembarque.</p>

<h2>El momento más complicado del proyecto</h2>

<p>En el mes 9, durante la migración de la zona de sala VIP y lounges internacionales, encontramos interferencia de un sistema de comunicaciones de la ANAC que no estaba documentado en los planos de cableado. El canal que habíamos asignado a esa zona se superponía con el sistema de radiocomunicaciones interno.</p>

<p>No fue un error de planificación: el sistema de la ANAC había sido actualizado tres meses antes y usaba frecuencias que en los relevamientos previos estaban libres. La solución fue reasignar canales y ajustar la configuración de TWT para esa zona específica. Tomó dos noches adicionales de trabajo. El impacto en el cronograma general: siete días.</p>

<p>En 18 meses de obra, fue el único incidente significativo.</p>

<h2>Los números al cierre del proyecto</h2>

<ul>
<li><strong>340</strong> access points Cisco Catalyst 9130 instalados</li>
<li><strong>0</strong> minutos de downtime en operaciones críticas</li>
<li><strong>94%</strong> de mejora en throughput promedio en zonas de embarque</li>
<li><strong>3.2x</strong> aumento en densidad de dispositivos soportados por AP</li>
<li><strong>-67%</strong> en tickets de soporte de red reportados por los operadores en los primeros 6 meses post-migración</li>
<li><strong>18 meses</strong>, 23 zonas, 4 horas por noche disponibles</li>
</ul>

<h2>Lo que aprendemos de cada proyecto de este tipo</h2>

<p>Hay una tendencia en la industria a vender la complejidad técnica de Wi-Fi 6 como el valor principal de este tipo de proyectos. Los access points, los protocolos, los algoritmos de scheduling. Todo eso importa. Pero en una obra como esta, el valor real estuvo en la logística: en los protocolos con seguridad aeroportuaria, en la coordinación entre organismos, en la capacidad de diagnosticar y resolver un problema de interferencia a las 2 de la mañana sin impactar las operaciones del día siguiente.</p>

<p>La tecnología la puede instalar cualquiera. La metodología es lo que hace que una obra de 18 meses en un ambiente crítico termine sin ningún incidente.</p>

<hr/>

<h2>Preguntas frecuentes</h2>

<h3>¿Wi-Fi 6 y Wi-Fi 6E son lo mismo?</h3>
<p>No. Wi-Fi 6 (802.11ax) opera en las bandas 2.4 GHz y 5 GHz. Wi-Fi 6E añade la banda de 6 GHz, lo que amplía significativamente el espectro disponible. En entornos de alta densidad como aeropuertos, Wi-Fi 6E es la siguiente evolución — pero requiere que los dispositivos clientes también soporten 6 GHz, algo que recién está masificándose en terminales de 2023 en adelante.</p>

<h3>¿Cuánto tiempo lleva típicamente un proyecto de renovación Wi-Fi en un aeropuerto mediano?</h3>
<p>Para un aeropuerto regional con entre 200 y 500 access points, el rango típico es de 12 a 24 meses trabajando en ventanas nocturnas. Los factores que más alargan el proyecto son el estado del cableado de backbone (si hay que renovar también los switches de distribución, el plazo se extiende considerablemente) y la complejidad de la coordinación con organismos de seguridad.</p>

<h3>¿La red Wi-Fi de un aeropuerto es pública o privada?</h3>
<p>Ambas. Los aeropuertos operan al menos dos redes segregadas: la red pública de pasajeros (la que aparece en tu teléfono como "Aeropuerto gratuito") y la red privada de operadores, que maneja sistemas críticos como boarding, rampa y comunicaciones de seguridad. Estas redes corren sobre la misma infraestructura física pero están completamente separadas a nivel lógico y de seguridad.</p>`,
    imagen_portada: null,
    categoria: 'proyectos',
    tags: ['wifi6', 'aeropuerto', 'Cisco', 'telecomunicaciones', 'mendoza'],
    fecha_publicacion: '2024-10-10T10:00:00Z',
    tiempo_lectura: 9,
  },
  {
    id: '3',
    status: 'published',
    slug: 'comparativa-fibra-optica-multimodo-monomodo',
    titulo: 'Multimodo o monomodo: el error de fibra óptica que le costó USD 38.000 a una empresa minera',
    resumen: 'Una empresa eligió fibra multimodo para un tendido de 4,2 km en operaciones mineras en San Juan. Cuatro meses después, tuvo que rehacer toda la instalación. El problema no era la fibra: era que nadie había calculado bien la distancia. Esta es la guía para no repetirlo.',
    meta_title: 'Fibra multimodo vs monomodo: guía técnica para proyectos industriales en Argentina',
    meta_description: 'Cuándo usar fibra multimodo y cuándo monomodo. Caso real de error costoso, comparativa técnica completa y guía de decisión para proyectos industriales y minería.',
    meta_keywords: 'fibra multimodo vs monomodo, fibra óptica industrial, tendido fibra minería, distancias fibra óptica, cableado estructurado Argentina',
    contenido: `<p>La reunión de especificación técnica duró 40 minutos. El responsable de infraestructura de la empresa minera tenía claro qué quería: fibra óptica para conectar el campamento principal con el sector de procesamiento. Había pedido tres cotizaciones. Las tres habían cotizado fibra multimodo OM4. Eligió la más barata.</p>

<p>Cuatro meses después nos llamaron. La red funcionaba, pero con pérdidas de señal intermitentes y velocidades que no llegaban al 30% de lo especificado. El diagnóstico fue rápido: el tendido tenía 4,2 km. La fibra multimodo OM4 tiene un alcance máximo de 400 metros para 10 Gbps. Para los 4,2 km que necesitaban, hubieran necesitado o bien fibra monomodo, o bien repetidores ópticos cada 400 metros — lo que hubiera triplicado el costo y la complejidad de mantenimiento.</p>

<p>El costo de rehacer la instalación, incluyendo nueva fibra, transceivers y mano de obra, fue de USD 38.000. Podría haberse evitado con una conversación técnica de 20 minutos en la etapa de especificación.</p>

<h2>Las diferencias que importan en campo</h2>

<p>La distinción fundamental entre fibra multimodo y monomodo es física: el diámetro del núcleo por donde viaja la luz.</p>

<p>La fibra <strong>multimodo</strong> tiene un núcleo de 50 o 62,5 micrómetros. Por su diámetro mayor, permite que múltiples modos de luz viajen simultáneamente por el núcleo. Esto es ventajoso porque los transceivers y conectores son más baratos (usan LEDs de menor precisión en lugar de lásers). La desventaja: esos múltiples modos de luz llegan a destino en tiempos ligeramente distintos, causando dispersión modal que limita la distancia y el ancho de banda.</p>

<p>La fibra <strong>monomodo</strong> tiene un núcleo de 9 micrómetros — del grosor de un cabello humano dividido por diez. Solo permite un modo de propagación, lo que elimina la dispersión modal. Puede cubrir distancias de decenas de kilómetros con señal perfecta. El precio de esta ventaja son los transceivers de láser de mayor precisión, que cuestan entre 3 y 8 veces más que sus equivalentes multimodo.</p>

<h2>Las distancias reales de cada estándar</h2>

<p>Esta tabla es lo que recomendamos imprimir y pegar en la pared de quien especifica proyectos de cableado:</p>

<table>
<thead><tr><th>Estándar</th><th>Tipo</th><th>Velocidad</th><th>Distancia máxima</th></tr></thead>
<tbody>
<tr><td>OM3</td><td>Multimodo 50µm</td><td>10 Gbps</td><td>300 m</td></tr>
<tr><td>OM4</td><td>Multimodo 50µm mejorado</td><td>10 Gbps</td><td>400 m</td></tr>
<tr><td>OM4</td><td>Multimodo 50µm mejorado</td><td>40/100 Gbps</td><td>150 m</td></tr>
<tr><td>OS2</td><td>Monomodo 9µm</td><td>10 Gbps</td><td>10 km</td></tr>
<tr><td>OS2</td><td>Monomodo 9µm</td><td>40/100 Gbps</td><td>10 km</td></tr>
<tr><td>OS2 con amplificador</td><td>Monomodo amplificado</td><td>10 Gbps</td><td>80 km+</td></tr>
</tbody>
</table>

<p>El dato clave que el equipo de la minera pasó por alto: las distancias publicadas por los fabricantes son para condiciones ideales de laboratorio. En campo, con empalmes, conectores y curvaturas de tendido, la distancia efectiva se reduce entre un 15% y un 25%. Un tendido de 380 metros con varios empalmes puede estar al límite del OM4 en condiciones reales.</p>

<h2>El costo real de cada tecnología en un proyecto tipo</h2>

<p>La comparación de precios superficial siempre favorece a la fibra multimodo. La comparación completa es más matizada.</p>

<p>Para un tendido hipotético de 500 metros en un entorno industrial (planta de producción, bodega, hospital), los costos comparativos típicos en Argentina a valores de 2024:</p>

<p><strong>Multimodo OM4:</strong> La fibra en sí cuesta entre $180 y $250 por metro. Los transceivers SFP+ de 10G para OM4 cuestan alrededor de USD 45 el par. Para 500 metros, la diferencia de costo total entre multimodo y monomodo puede ser de USD 800 a USD 2.000 según la cantidad de puntos.</p>

<p><strong>Monomodo OS2:</strong> La fibra tiene precio similar al OM4. Los transceivers SFP+ de 10G para monomodo en distancias cortas (hasta 10km) cuestan USD 120 a USD 200 el par. Es más caro en el momento de instalación, pero es la única opción técnicamente correcta para cualquier distancia mayor a 400 metros.</p>

<p><strong>El factor que cambia el cálculo:</strong> si en 3 años se necesita ampliar la red o agregar enlaces de mayor velocidad (25G, 100G), la fibra ya instalada no cambia. Lo que cambia son los transceivers. Monomodo OS2 es compatible con cualquier velocidad futura. Multimodo OM4 tiene limitaciones severas a partir de los 40G, especialmente en distancias mayores a 150 metros.</p>

<h2>La regla de decisión que usamos en ULTIMA MILLA</h2>

<p>Después de cientos de proyectos de cableado, la lógica que aplicamos es simple:</p>

<ul>
<li><strong>Distancia menor a 100 metros, ambiente controlado, red corporativa interna:</strong> multimodo OM4 es correcto y económico.</li>
<li><strong>Distancia mayor a 100 metros, o cualquier tendido en exteriores, o entorno industrial con posibilidad de expansión futura:</strong> monomodo OS2, sin excepciones.</li>
<li><strong>Distancia mayor a 10 km o infraestructura crítica:</strong> monomodo OS2 con análisis de presupuesto óptico y posible amplificación.</li>
</ul>

<p>La regla de los 100 metros puede parecer conservadora — la multimodo teóricamente llega a 400. Pero los 100 metros incorporan el margen de error de instalación, los empalmes inevitables en un tendido real, y el overhead para futuras expansiones. En 15 años de trabajo en campo, nunca tuvimos un problema en un tendido monomodo que debería haber sido multimodo. Sí tuvimos el problema inverso, más de una vez.</p>

<h2>Qué hacer si ya tenés fibra multimodo instalada a más distancia de la especificada</h2>

<p>Si la instalación ya existe y funciona con degradación, las opciones son:</p>

<ol>
<li><strong>Reducir la velocidad del enlace:</strong> bajar de 10G a 1G puede recuperar hasta 550 metros adicionales de alcance en OM4. No es una solución a largo plazo pero puede ser un puente mientras se planifica el reemplazo.</li>
<li><strong>Agregar un repetidor/transceiver óptico en el punto medio:</strong> técnicamente funciona pero agrega un punto de falla y un costo de mantenimiento adicional.</li>
<li><strong>Reemplazar el tendido:</strong> la solución correcta. En la mayoría de los casos, si el caño ya está instalado, el costo es solo la fibra y los empalmes — no la obra civil.</li>
</ol>

<hr/>

<h2>Preguntas frecuentes</h2>

<h3>¿Se puede mezclar fibra multimodo y monomodo en el mismo proyecto?</h3>
<p>Técnicamente sí, pero no es recomendable porque duplica el inventario de transceivers y aumenta la complejidad del troubleshooting. La práctica recomendada es elegir un estándar para todo el proyecto. Si hay tramos cortos en interiores y tramos largos en exteriores, la solución es usar monomodo en todo el recorrido.</p>

<h3>¿La fibra monomodo funciona con equipos diseñados para multimodo?</h3>
<p>No. Los transceivers son incompatibles. Un transceiver SFP de multimodo no puede usarse con fibra monomodo y viceversa. Si tenés un switch con puertos SFP para 1G multimodo y querés conectar fibra monomodo, necesitás cambiar los transceivers del switch, no solo la fibra.</p>

<h3>¿Cuánto dura la fibra óptica en instalación exterior?</h3>
<p>La fibra óptica en sí tiene una vida útil técnica de 25 a 30 años. Lo que falla antes son las cubiertas protectoras y los empalmes cuando no se hacen con los materiales adecuados para exteriores. Una fibra exterior instalada correctamente, con cubierta de polietileno y enterrada con la profundidad y protección adecuadas, dura más que cualquier equipo activo que se conecte a ella.</p>`,
    imagen_portada: null,
    categoria: 'tecnico',
    tags: ['fibra óptica', 'multimodo', 'monomodo', 'infraestructura', 'redes industriales'],
    fecha_publicacion: '2024-10-07T14:00:00Z',
    tiempo_lectura: 8,
  },
  {
    id: '5',
    status: 'published',
    slug: 'deteccion-incendio-bodegas-vitivinicolas',
    titulo: 'Detección de incendio en bodegas vitivinícolas: por qué el detector que usás en una oficina puede matarte en Luján de Cuyo',
    resumen: 'Las bodegas son uno de los entornos más desafiantes para sistemas de detección de incendio. Vapores de alcohol, temperaturas extremas y grandes volúmenes de material combustible crean condiciones donde un detector mal especificado activa falsas alarmas — o peor, no activa cuando debería.',
    meta_title: 'Detección de incendio en bodegas vitivinícolas: estándar NFPA 72 aplicado',
    meta_description: 'Por qué los detectores de humo convencionales no sirven en bodegas. NFPA 72, detectores de calor lineal y diseño para entornos con vapores de alcohol. Casos reales.',
    meta_keywords: 'detección incendio bodegas, NFPA 72 vitivinícola, detectores calor lineal bodega, sistema incendio mendoza, seguridad bodegas argentina',
    contenido: `<p>En octubre de 2022, una bodega en el corredor de Maipú activó tres veces en una semana la alarma de incendio de su sala de fermentación. Las tres veces llegaron los bomberos. Las tres veces fue una falsa alarma. A la cuarta semana, el responsable de la bodega desconectó el detector.</p>

<p>Dos meses después, un corto circuito en el tablero eléctrico de la misma sala generó un pequeño incendio que se detectó tarde porque el detector estaba desconectado. Los daños fueron de USD 140.000 entre pérdida de producto, equipamiento y reparaciones. No hubo heridos, pero la situación pudo haber sido mucho peor.</p>

<p>El problema original no era el detector. El problema era que un detector diseñado para oficinas no puede funcionar correctamente en una sala de fermentación donde los vapores de alcohol alcanzan concentraciones de 2.000 ppm durante la vendimia. El sistema de detección había sido instalado por una empresa que conocía sistemas de incendio, pero no conocía bodegas.</p>

<h2>Por qué las bodegas son casos especiales</h2>

<p>Para entender el desafío, hay que entender qué pasa físicamente en una bodega durante el proceso productivo. La fermentación alcohólica libera vapor de etanol de manera continua durante 15 a 30 días por cosecha. En una sala con 50 cubas de fermentación de 20.000 litros cada una, la concentración de vapores puede superar el 1% de la mezcla aire-vapor — suficiente para que un detector de humo fotoeléctrico convencional interprete como humo lo que es vapor de alcohol.</p>

<p>Las temperaturas también son un factor crítico. Las cavas de guarda trabajan a 12-14°C constantes. La sala de máquinas puede llegar a 55°C. La zona de recepción de uva durante la vendimia tiene temperaturas exteriores de hasta 38°C. El mismo sistema de detección tiene que funcionar correctamente en estos rangos extremos en el mismo edificio.</p>

<p>Y hay un tercer elemento que la mayoría de los proyectistas no considera: el polvo de diatomeas. Muchas bodegas usan tierra de diatomeas como auxiliar de filtración. Este material en suspensión puede obstruir los detectores de humo en semanas, generando falsas alarmas o, peor, reduciendo la sensibilidad del detector hasta que deja de funcionar correctamente.</p>

<h2>Qué dice la norma NFPA 72 para este tipo de entornos</h2>

<p>La National Fire Protection Association publica la norma 72 (NFPA 72) que establece los requerimientos para sistemas de alarma de incendio. En Argentina, la IRAM 3597 toma como referencia esta norma. Para entornos con condiciones ambientales adversas, la NFPA 72 establece requerimientos específicos que cambian el tipo de detector recomendado.</p>

<p>Para una bodega, los detectores recomendados según la norma varían por zona:</p>

<h3>Sala de fermentación y zonas de elaboración</h3>

<p>La norma recomienda <strong>detectores de calor de tasa de incremento</strong> en lugar de detectores de humo. Estos dispositivos activan la alarma cuando la temperatura sube más de 8°C por minuto, lo que indica un incendio activo sin confundirse con los vapores de fermentación. Los detectores puntales de temperatura fija (normalmente calibrados a 57°C o 93°C) son complementarios para áreas donde un incendio podría avanzar sin incremento rápido de temperatura.</p>

<h3>Cavas de guarda y áreas de barrica</h3>

<p>En las cavas, el riesgo principal es un incendio lento en las estructuras de madera (barricas, estantes). Para estos espacios, la norma indica <strong>detectores de calor lineal</strong> — cables sensores que recorren los estantes y detectan aumentos de temperatura en cualquier punto de su longitud. Son más costosos que los detectores puntuales, pero ofrecen cobertura continua en espacios donde un detector puntual puede estar a 30 metros del foco inicial.</p>

<h3>Sala de máquinas y salas eléctricas</h3>

<p>Aquí sí se usan detectores de humo, pero no fotoeléctricos convencionales. La recomendación de la norma para entornos con polvo y vapores es el detector de <strong>aspiración de muestra de aire (VESDA)</strong>. Estos sistemas toman muestras de aire continuamente y las analizan en una cámara de detección protegida. Son significativamente más caros, pero tienen una tasa de falsas alarmas muy baja y detectan incendios en etapas muy tempranas.</p>

<h2>El diseño que usamos en proyectos vitivinícolas</h2>

<p>En los proyectos de bodegas que ejecutamos en Mendoza y San Juan, el diseño parte de un análisis de riesgo por zona que incluye:</p>

<ol>
<li><strong>Mapa de concentración de vapores:</strong> identificamos qué zonas tienen vapores de alcohol durante vendimia y en qué concentración. Esto determina si el detector puede ser de humo o debe ser de calor.</li>
<li><strong>Análisis de temperatura ambiente por zona y estación:</strong> los detectores se seleccionan para operar en el rango real de temperatura de cada zona, no el promedio.</li>
<li><strong>Evaluación de polvo y particulado:</strong> en zonas con uso de diatomeas o polvo de corcho, se especifican detectores con carcasas con grado de protección IP mínimo de 44.</li>
<li><strong>Zonificación independiente:</strong> cada área con condiciones distintas es una zona de detección separada, con su propio umbral de alarma. Esto permite que la cocina active la alarma general mientras la sala de fermentación activa solo una señal de alerta que el personal verifica antes de llamar a los bomberos.</li>
</ol>

<h2>El costo de hacerlo bien versus el de hacerlo mal</h2>

<p>Un sistema de detección correctamente especificado para una bodega mediana (2.000 a 5.000 m²) tiene un costo que puede ser entre 40% y 80% mayor que un sistema de oficinas equivalente. Los detectores de calor lineal y los sistemas VESDA son significativamente más caros que los detectores de humo convencionales.</p>

<p>La bodega del caso que abrimos este artículo pagó USD 140.000 por no hacer esa inversión. El sistema correcto hubiera costado aproximadamente USD 45.000. La diferencia habla sola.</p>

<p>Pero hay un argumento más directo que el económico: en Argentina, el seguro de una bodega exige en la mayoría de los casos que el sistema de detección de incendio esté certificado por un profesional habilitado y cumpla las normas IRAM correspondientes. Un sistema mal especificado que genera falsas alarmas y termina siendo desconectado no solo es un riesgo de seguridad — es una violación de las condiciones de la póliza. En caso de siniestro, el seguro no paga.</p>

<hr/>

<h2>Preguntas frecuentes</h2>

<h3>¿La normativa argentina exige NFPA 72 o hay normas locales?</h3>
<p>Argentina usa la norma IRAM 3597 como marco principal, que adopta los principios de NFPA 72 con algunas adaptaciones locales. Para proyectos en bodegas que exportan, muchos clientes exigen el cumplimiento explícito con NFPA 72 dado que es el estándar de referencia internacional para seguros y auditorías de compradores extranjeros, especialmente europeos y estadounidenses.</p>

<h3>¿Cada cuánto hay que hacer mantenimiento en una bodega?</h3>
<p>La norma IRAM 3597 exige verificación funcional anual de todos los detectores y prueba del panel central. En bodegas recomendamos mantenimiento semestral: uno antes de la vendimia (cuando el sistema va a estar más exigido) y uno posterior. Los detectores de aspiración VESDA requieren limpieza de sus filtros cada 6 meses en entornos con polvo.</p>

<h3>¿Los sistemas de supresión (rociadores) son obligatorios en bodegas?</h3>
<p>Depende del municipio y de la superficie cubierta. En Mendoza, la Ordenanza 9.145 establece las condiciones bajo las cuales un sistema de rociadores es obligatorio. Para superficies superiores a 2.000 m² cubiertos o con carga de fuego alta (lo que incluye las zonas de barricas), la instalación de rociadores es generalmente requerida para la habilitación municipal. Los rociadores y el sistema de detección son independientes pero deben estar integrados: la activación de un rociador debe también activar la alarma general del edificio.</p>`,
    imagen_portada: null,
    categoria: 'tecnico',
    tags: ['incendio', 'NFPA 72', 'bodegas', 'vitivinicultura', 'seguridad Mendoza'],
    fecha_publicacion: '2024-09-28T11:00:00Z',
    tiempo_lectura: 9,
  },
  {
    id: '6',
    status: 'published',
    slug: 'hospital-regional-neuquen-cableado-estructurado',
    titulo: 'No podés apagar la UTI para pasar cables: la metodología detrás del cableado del Hospital Regional de Neuquén',
    resumen: '1.200 puntos de red categoría 6A en 4 pisos, incluyendo UTI, quirófanos y guardia, sin interrumpir ninguna prestación médica en 90 días. El problema no era técnico. Era logístico, humano y de coordinación en tiempo real con médicos, enfermeros y administración hospitalaria.',
    meta_title: 'Cableado estructurado Hospital Neuquén: 1.200 puntos sin interrumpir operaciones',
    meta_description: 'Caso real: red de datos Cat6A en Hospital Regional de Neuquén. 1.200 puntos en UTI, quirófanos y guardia en 90 días sin downtime médico. Metodología y protocolos.',
    meta_keywords: 'cableado estructurado hospital, red datos hospital Neuquén, Cat6A hospital, infraestructura IT salud Argentina, cableado zona crítica',
    contenido: `<p>La primera reunión con el director del hospital tuvo lugar en enero. Él habló durante veinte minutos sin parar y nosotros tomamos nota. Al terminar, resumió su posición con una frase que se convirtió en el principio rector de todo el proyecto:</p>

<p><em>"Pueden cablear lo que quieran. Pero si un paciente sufre algún problema porque ustedes estaban trabajando cerca, ese es el último proyecto que hacen en un hospital en su vida."</em></p>

<p>No había amenaza en esa frase. Solo claridad absoluta sobre las prioridades. Y tenía razón: una obra de infraestructura en un hospital en funcionamiento no es una obra de construcción. Es una operación coordinada en un entorno donde cualquier error tiene consecuencias que van más allá de lo económico.</p>

<h2>El contexto del proyecto</h2>

<p>El Hospital Regional de Neuquén atiende alrededor de 800 pacientes por día entre consultas, internaciones y guardia. En 2024, el Ministerio de Salud de la provincia aprobó la actualización de la infraestructura de red de datos del edificio principal, que databa de 2009 y usaba cableado categoría 5e con capacidad de 1 Gbps.</p>

<p>La nueva red tenía que ser categoría 6A (10 Gbps) para soportar los sistemas de historia clínica digital, telemedicina, monitoreo remoto de pacientes y las futuras plataformas de imagen médica (PACS/DICOM) que el hospital planea incorporar. 1.200 puntos distribuidos en cuatro pisos, incluyendo las áreas más críticas: Unidad de Terapia Intensiva, tres quirófanos, guardia permanente y neonatología.</p>

<h2>Por qué este tipo de proyectos falla habitualmente</h2>

<p>En nuestra experiencia, los proyectos de infraestructura en hospitales activos fracasan — o generan conflictos graves — principalmente por dos razones:</p>

<p><strong>Primera: la obra no respeta los tiempos clínicos.</strong> Un hospital no tiene un horario de trabajo en el sentido convencional. La UTI está activa las 24 horas. La guardia no cierra. Los quirófanos programados empiezan a las 7 de la mañana. Un equipo de obras que llega a las 8 y empieza a perforar el techo del pasillo del tercer piso sin coordinación previa genera un problema inmediato.</p>

<p><strong>Segunda: el personal hospitalario no fue involucrado en la planificación.</strong> Los médicos, enfermeros y técnicos que trabajan en cada área conocen cosas que no están en ningún plano: que ese tomacorriente está conectado a un equipo de soporte vital, que ese pasillo los martes de mañana es por donde pasan los pacientes de diálisis, que la enfermería del segundo piso no puede tener interrupciones entre las 14 y las 16 porque es cuando se hace la entrega de guardia.</p>

<h2>La metodología que desarrollamos para este proyecto</h2>

<h3>Mapeo clínico previo a la obra</h3>

<p>Antes de empezar cualquier trabajo, pasamos tres semanas haciendo relevamiento junto con los jefes de servicio de cada área. El objetivo no era entender la infraestructura — eso lo hacemos solos. Era entender los flujos de trabajo clínicos y los momentos en que cada área no podía tener ningún tipo de interferencia.</p>

<p>El resultado fue un mapa de disponibilidad por zona y por franja horaria. La UTI, por ejemplo, tenía tres franjas absolutamente intocables: 7 a 9 de la mañana (pase de guardia médica y revisión de pacientes), 13 a 15 (pase de guardia de enfermería) y cualquier momento en que hubiera más de tres pacientes críticos internados. El jefe de la UTI nos dio el número de su celular y nos pidió que lo llamáramos la noche anterior a cada jornada de trabajo en esa área para confirmar las condiciones del día.</p>

<h3>Equipo de enlace interno</h3>

<p>Asignamos a un miembro de nuestro equipo como coordinador exclusivo de la interfaz con el hospital. No hacía trabajo técnico: su trabajo era estar en el hospital todos los días, hablar con los jefes de servicio, gestionar permisos de acceso y resolver en tiempo real cualquier situación que surgiera. Esto fue la decisión individual que más contribuyó al éxito del proyecto.</p>

<p>En las obras convencionales, cuando surge un problema de coordinación, se escala a un supervisor que está en otra obra. En este proyecto, el coordinador estaba en el edificio. La capacidad de respuesta era de minutos, no horas.</p>

<h3>Protocolos de bioseguridad estrictos</h3>

<p>Todo el equipo de obra completó capacitación en protocolos de bioseguridad hospitalaria antes de ingresar al edificio. Esto incluía uso correcto de EPP en cada área, procedimientos de lavado de manos, manejo de residuos y protocolos específicos para áreas de mayor riesgo como neonatología.</p>

<p>Establecimos zonas de aislamiento con cortinas de plástico selladas para cada área de trabajo. El polvo de perforación es un vector de contaminación real en un hospital — en áreas de inmunodeprimidos, puede ser directamente peligroso. Las cortinas de aislamiento no son una formalidad estética: son una barrera de control de infecciones.</p>

<h2>Los momentos críticos del proyecto</h2>

<p>En la semana 6, mientras trabajábamos en el segundo piso, se declaró un brote de infección respiratoria en la planta de internación clínica. El área fue puesta en aislamiento estricto. Teníamos pendientes 180 puntos de red en ese piso.</p>

<p>La decisión fue inmediata: pausar completamente el trabajo en esa área y reasignar el equipo a zonas no afectadas. Reorganizamos el cronograma priorizando los pisos uno y tres. El trabajo en el segundo piso se retomó 14 días después, cuando el área fue liberada por el Comité de Infecciones del hospital.</p>

<p>Esos 14 días de pausa estaban fuera del contrato original. Tuvimos que absorber parte del costo de la reprogramación. Era la decisión correcta y no lo discutimos.</p>

<h2>Los resultados a los 90 días</h2>

<ul>
<li><strong>1.200</strong> puntos de red categoría 6A certificados</li>
<li><strong>0</strong> incidentes clínicos relacionados con la obra</li>
<li><strong>4</strong> pisos completados incluyendo UTI, quirófanos, guardia y neonatología</li>
<li><strong>100%</strong> de los puntos certificados con análisis de canal según TIA-1096</li>
<li><strong>90 días</strong> calendario desde inicio de obra hasta entrega final</li>
</ul>

<p>El director del hospital participó de la reunión de cierre. No había mencionado aquella frase inicial en los tres meses de obra. Al finalizar, la mencionó de nuevo: "Nadie sufrió ningún problema. Bienvenidos de vuelta cuando hagan la segunda etapa."</p>

<h2>Lo que aprendemos de trabajar en entornos críticos</h2>

<p>La industria de tecnología tiende a valorar la velocidad y la eficiencia como métricas principales. En un hospital, esas métricas son secundarias. La métrica principal es no causar daño.</p>

<p>Eso implica planificar más, coordinar más, a veces trabajar más lento. Implica tener a alguien cuyo único trabajo es gestionar la relación con el cliente en tiempo real. Implica estar dispuesto a pausar la obra cuando las condiciones lo requieren, aunque eso tenga un costo económico.</p>

<p>Paradójicamente, ese enfoque hace que los proyectos terminen bien. El hospital de Neuquén terminó en plazo. Pero el plazo fue posible porque no hubo incidentes que lo interrumpieran. Y no hubo incidentes porque pusimos la coordinación por delante de la velocidad de ejecución.</p>

<hr/>

<h2>Preguntas frecuentes</h2>

<h3>¿Qué diferencia hay entre categoría 5e, 6 y 6A en la práctica?</h3>
<p>Categoría 5e soporta 1 Gbps a 100 metros. Categoría 6 soporta 10 Gbps pero solo a 55 metros. Categoría 6A soporta 10 Gbps en el máximo estándar de 100 metros. Para una red hospitalaria donde las distancias de cableado horizontal pueden superar los 60 metros fácilmente, Cat6A es el mínimo correcto. Cat5e en un hospital nuevo en 2024 es quedar obsoleto desde el primer día.</p>

<h3>¿Cuánto tiempo dura un cableado Cat6A correctamente instalado?</h3>
<p>El estándar de la industria (TIA-568) establece una vida útil de diseño de 25 años para cableado estructurado. En la práctica, instalaciones bien ejecutadas con materiales de calidad duran 30 o más años. El cuello de botella no es el cable: son los equipos activos (switches, servidores) que se reemplazan cada 5-7 años. El cableado es la inversión más duradera de toda la infraestructura de red.</p>

<h3>¿Se puede hacer cableado estructurado en un hospital sin certificación especial?</h3>
<p>La norma no exige una certificación específica para trabajar en hospitales, pero el Ministerio de Salud de la provincia de Neuquén (y varios otros) exige en sus licitaciones que las empresas acrediten experiencia previa en entornos hospitalarios y que el personal complete la capacitación de bioseguridad antes de ingresar al edificio. Algunos hospitales exigen también seguro de responsabilidad civil con coberturas específicas para daños a pacientes o equipamiento médico.</p>`,
    imagen_portada: null,
    categoria: 'proyectos',
    tags: ['cableado estructurado', 'hospital', 'Neuquén', 'Cat6A', 'infraestructura salud'],
    fecha_publicacion: '2024-09-20T09:00:00Z',
    tiempo_lectura: 9,
  },
];
