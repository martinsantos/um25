/** The explanatory layer is a system, not a sequence of isolated product shots. */
export interface DisciplineLayer {name:string;title:string;copy:string;decision:string;}
export interface DisciplineSystem {name:string;premise:string;result:string;layers:DisciplineLayer[];}
export const DISCIPLINE_SYSTEMS:Record<string,DisciplineSystem>={
 '103':{name:'Telecomunicaciones',premise:'De un extremo al otro, cada capa tiene una decisión de ingeniería.',result:'Un enlace se entrega conectado, medido y documentado.',layers:[
  {name:'Extremos',title:'Primero, qué necesita cruzar de un sitio al otro.',copy:'Relevamos los extremos, las aplicaciones y la capacidad que requiere la operación. La distancia sola no define el enlace.',decision:'Sitios, demanda y crecimiento.'},
  {name:'Transporte',title:'El recorrido determina el medio.',copy:'Evaluamos fibra o radio según el trazado, la distancia y las condiciones del lugar. Son alternativas de diseño; no dos pasos obligatorios en serie.',decision:'Tendido óptico o línea de vista.'},
  {name:'Terminación',title:'El medio se conecta con equipos concretos.',copy:'La fibra termina en distribuidores y transceptores compatibles. El radio necesita montaje, orientación y alimentación adecuados en sus dos extremos.',decision:'Interfaces, montaje y alimentación.'},
  {name:'Red lógica',title:'Conectar sitios también es ordenar su tráfico.',copy:'Integramos el enlace con los routers y las redes existentes. Direccionamiento, segmentación y capacidad se definen para los servicios que deben circular.',decision:'Rutas, segmentos y capacidad.'},
  {name:'Servicios',title:'La conexión tiene que servir a la operación.',copy:'Datos, voz, video y aplicaciones comparten infraestructura con necesidades diferentes. Verificamos la comunicación que el proyecto debe sostener.',decision:'Qué circula y qué necesita prioridad.'},
  {name:'Operación',title:'La puesta en marcha deja una red comprensible.',copy:'Mediciones, identificación de extremos y documentación permiten operar el enlace, diagnosticar fallas y planificar su ampliación.',decision:'Pruebas, identificación y mantenimiento.'},
 ]},
 '107':{name:'Detección de incendio',premise:'Del riesgo relevado al aviso: una cadena que debe funcionar completa.',result:'Detectar, localizar y avisar, con una respuesta prevista y probada.',layers:[
  {name:'Cobertura',title:'La detección empieza por entender el lugar.',copy:'Relevamos ambientes, actividades y condiciones de instalación para definir la cobertura y los dispositivos del proyecto.',decision:'Riesgo, ambiente y ubicación.'},
  {name:'Dispositivos',title:'Cada punto aporta una señal identificable.',copy:'Detectores y puntos de accionamiento manual se distribuyen según el diseño. Cada dispositivo tiene ubicación y función dentro del sistema.',decision:'Detectar o iniciar un aviso manual.'},
  {name:'Circuitos',title:'La señal viaja por un circuito supervisado.',copy:'El cableado vincula los dispositivos con la central. La supervisión permite distinguir estados del sistema y advertir fallas del circuito.',decision:'Recorrido, conexión y supervisión.'},
  {name:'Central',title:'La central reúne estados y localiza el aviso.',copy:'Integramos dispositivos, circuitos e indicaciones para identificar el origen de una alarma o una falla y aplicar la secuencia prevista.',decision:'Identificación y lógica de respuesta.'},
  {name:'Aviso',title:'La información se convierte en una advertencia.',copy:'Los dispositivos de señalización se integran con las salidas previstas por el proyecto. Definimos qué se activa y cómo se reconoce cada situación.',decision:'Señalización y acciones previstas.'},
  {name:'Respaldo y pruebas',title:'El sistema se verifica también ante una falla.',copy:'Revisamos alimentación y respaldo, probamos alarmas y fallas y entregamos la documentación de puesta en marcha. El alcance se define para cada instalación.',decision:'Autonomía, pruebas y documentación.'},
 ]},
 '104':{name:'Software a medida',premise:'Una aplicación visible. Una arquitectura completa detrás de cada acción.',result:'Una herramienta que tu equipo puede usar y que podemos evolucionar.',layers:[
  {name:'Producto · UX/UI',title:'La primera capa es el trabajo de las personas.',copy:'Entendemos tareas, roles y recorridos. Diseñamos una interfaz que convierte el proceso en acciones claras y validamos un primer alcance útil.',decision:'Necesidad, experiencia y primer producto.'},
  {name:'Reglas de negocio',title:'La aplicación conoce cómo funciona el proceso.',copy:'Estados, validaciones y permisos definen qué puede hacer cada persona y qué debe ocurrir después de cada acción.',decision:'Reglas, roles y trazabilidad.'},
  {name:'Integraciones',title:'Los sistemas intercambian información.',copy:'Las interfaces de integración conectan la aplicación con los servicios que necesita. Definimos contratos de datos, errores y responsabilidades.',decision:'APIs y sistemas existentes.'},
  {name:'Datos',title:'La información conserva estructura y contexto.',copy:'Modelamos registros y relaciones para consultar, actualizar y seguir la historia del proceso. Los permisos acompañan el acceso a los datos.',decision:'Modelo, acceso e integridad.'},
  {name:'Despliegue',title:'Los cambios llegan de forma controlada.',copy:'Organizamos versiones, entornos y pruebas para publicar y recuperar una versión. Contenedores u otras formas de despliegue se eligen según el proyecto.',decision:'Entornos, versiones y recuperación.'},
  {name:'Infraestructura',title:'La aplicación también necesita ser operable.',copy:'Integramos cómputo, red, almacenamiento y seguimiento de la operación. Definimos respaldo y mantenimiento de acuerdo con las necesidades del sistema.',decision:'Recursos, observación y continuidad.'},
 ]},
 "101":{
  "name": "Infraestructura de redes",
  "premise": "Del puesto de trabajo al núcleo de la red, una infraestructura que se puede entender.",
  "result": "Cada conexión identificada, medida y lista para operar.",
  "layers": [
    {
      "name": "Puestos",
      "title": "La red empieza donde se trabaja.",
      "copy": "Relevamos puestos, equipos y puntos de conexión. El uso de cada espacio define dónde se necesita una toma y dónde cobertura inalámbrica.",
      "decision": "Ubicación, uso y crecimiento."
    },
    {
      "name": "Cableado",
      "title": "Un recorrido físico para cada conexión.",
      "copy": "Diseñamos canalizaciones y tendidos hasta la distribución. Cobre y fibra se eligen por distancia, capacidad y condiciones de instalación.",
      "decision": "Canalizaciones, cobre y fibra."
    },
    {
      "name": "Distribución",
      "title": "El gabinete organiza toda la instalación.",
      "copy": "Patch panels, distribuidores ópticos y organizadores reúnen los tendidos. La identificación permite seguir una conexión sin adivinar a dónde va.",
      "decision": "Gabinete, terminaciones y orden."
    },
    {
      "name": "Red activa",
      "title": "Los equipos transportan y separan el tráfico.",
      "copy": "Integramos switches y routers con la red existente. Capacidad, alimentación PoE y segmentación responden a los equipos y servicios del proyecto.",
      "decision": "Puertos, segmentos y capacidad."
    },
    {
      "name": "Wi-Fi",
      "title": "La cobertura se diseña para el uso real.",
      "copy": "Ubicamos puntos de acceso según ambientes, materiales y demanda. Verificamos cobertura y comunicación en los espacios que debe atender la red.",
      "decision": "Cobertura, densidad y movilidad."
    },
    {
      "name": "Entrega",
      "title": "Una red terminada también se puede mantener.",
      "copy": "Verificamos enlaces y funcionamiento, identificamos extremos y documentamos la instalación. Las mediciones y pruebas se acuerdan según el alcance.",
      "decision": "Mediciones, planos e identificación."
    }
  ]
},
 "102":{
  "name": "Seguridad electrónica",
  "premise": "Ver, registrar y controlar: cada dispositivo forma parte de una respuesta.",
  "result": "Información disponible, accesos definidos y una operación preparada para actuar.",
  "layers": [
    {
      "name": "Cobertura",
      "title": "Primero, qué necesitamos observar y proteger.",
      "copy": "Relevamos accesos, áreas y condiciones de luz. Definimos qué debe verse, dónde se identifica un evento y quién necesita esa información.",
      "decision": "Zonas, objetivos y condiciones."
    },
    {
      "name": "Captura y acceso",
      "title": "Una imagen y una credencial cumplen funciones distintas.",
      "copy": "Cámaras y lectores se eligen por su tarea. La captura de video y las decisiones de acceso comparten infraestructura, pero conservan su propia lógica.",
      "decision": "Cámaras, lectores y controladores."
    },
    {
      "name": "Transporte",
      "title": "La información necesita una red adecuada.",
      "copy": "Dimensionamos conectividad y alimentación de los dispositivos. Integramos su tráfico y sus permisos con la infraestructura de datos del lugar.",
      "decision": "Red, alimentación y segmentación."
    },
    {
      "name": "Registro y control",
      "title": "Los eventos conservan su contexto.",
      "copy": "Integramos grabación y control de acceso. Capacidad de almacenamiento, retención, horarios y permisos se definen para la operación de cada proyecto.",
      "decision": "Grabación, eventos y permisos."
    },
    {
      "name": "Supervisión",
      "title": "La persona responsable encuentra lo que necesita.",
      "copy": "Organizamos vistas y consultas para reconocer el lugar, revisar un evento y seguir su secuencia. El diseño acompaña a quien supervisa.",
      "decision": "Visualización, búsqueda y responsables."
    },
    {
      "name": "Respuesta",
      "title": "La instalación se entrega probada y documentada.",
      "copy": "Verificamos imágenes, registros y acciones previstas. Acordamos criterios de operación y mantenimiento para conservar la utilidad del sistema.",
      "decision": "Pruebas, operación y mantenimiento."
    }
  ]
},
 "108":{
  "name": "Energía y respaldo",
  "premise": "La continuidad empieza por saber qué cargas hay que sostener.",
  "result": "Una cadena de alimentación dimensionada, identificada y probada.",
  "layers": [
    {
      "name": "Cargas críticas",
      "title": "No todos los equipos tienen la misma necesidad.",
      "copy": "Identificamos los equipos que sostienen la operación, su consumo y el tiempo de respaldo requerido. Esa demanda determina el dimensionamiento.",
      "decision": "Potencia, criticidad y autonomía."
    },
    {
      "name": "Alimentación",
      "title": "Conocemos la entrada antes de integrar el respaldo.",
      "copy": "Relevamos la alimentación disponible y las condiciones de conexión. Protecciones y maniobras se coordinan con la instalación y el alcance del proyecto.",
      "decision": "Entrada, conexión y protecciones."
    },
    {
      "name": "Respaldo",
      "title": "La UPS sostiene las cargas previstas.",
      "copy": "Seleccionamos capacidad y autonomía según consumo y condiciones de uso. Baterías, ventilación y acceso para mantenimiento forman parte del diseño.",
      "decision": "UPS, baterías y mantenimiento."
    },
    {
      "name": "Distribución",
      "title": "La energía llega a equipos identificados.",
      "copy": "Organizamos distribución y conexiones hacia las cargas atendidas. La identificación permite reconocer qué equipo depende de cada salida.",
      "decision": "Distribución, salidas y trazabilidad."
    },
    {
      "name": "Continuidad",
      "title": "Una falla de entrada tiene una secuencia prevista.",
      "copy": "Probamos la transferencia al respaldo y el comportamiento de las cargas. La autonomía tiene un límite: se define qué debe continuar y qué debe detenerse.",
      "decision": "Transferencia y comportamiento de cargas."
    },
    {
      "name": "Verificación",
      "title": "La entrega incluye saber cómo operarlo.",
      "copy": "Registramos configuración y pruebas, documentamos cargas y acordamos revisiones. Las condiciones reales de operación orientan el mantenimiento.",
      "decision": "Pruebas, registro y revisiones."
    }
  ]
},
 "105":{
  "name": "Soporte técnico",
  "premise": "De una señal a una resolución: un recorrido con contexto y responsables.",
  "result": "La intervención resuelve el caso y conserva lo aprendido para el siguiente.",
  "layers": [
    {
      "name": "Señal",
      "title": "Entender qué dejó de funcionar y a quién afecta.",
      "copy": "Recibimos el incidente con su equipo, sitio y contexto. Un síntoma útil incluye qué cambió, desde cuándo sucede y qué actividad interrumpe.",
      "decision": "Usuario, equipo y operación afectada."
    },
    {
      "name": "Caso",
      "title": "La información se convierte en un caso trazable.",
      "copy": "Registramos el incidente, vinculamos sus antecedentes y reunimos la evidencia disponible. La conversación conserva un punto de referencia común.",
      "decision": "Registro, antecedentes y evidencia."
    },
    {
      "name": "Prioridad",
      "title": "El impacto organiza la atención.",
      "copy": "Evaluamos alcance, urgencia y dependencias para asignar la intervención. Responsables y condiciones de atención se acuerdan según el servicio contratado.",
      "decision": "Impacto, urgencia y responsable."
    },
    {
      "name": "Diagnóstico",
      "title": "Probamos hipótesis sobre el sistema completo.",
      "copy": "Seguimos las dependencias entre equipo, red y aplicación. Las pruebas permiten acotar el origen del problema y elegir la intervención adecuada.",
      "decision": "Evidencia, dependencias y causa."
    },
    {
      "name": "Intervención",
      "title": "Cada acción busca recuperar la operación.",
      "copy": "Coordinamos la intervención remota o en sitio según el caso y verificamos su resultado. El alcance y los cambios quedan registrados.",
      "decision": "Acción, coordinación y verificación."
    },
    {
      "name": "Seguimiento",
      "title": "La resolución se comprueba con quien trabaja.",
      "copy": "Confirmamos la recuperación, documentamos lo realizado y dejamos recomendaciones. El historial ayuda a reconocer recurrencias y planificar mantenimiento.",
      "decision": "Confirmación, aprendizaje y prevención."
    }
  ]
},
 "106":{
  "name": "Consultoría IT",
  "premise": "Convertimos una operación compleja en decisiones técnicas que se pueden ejecutar.",
  "result": "Un plan con dependencias, prioridades y un alcance comprensible.",
  "layers": [
    {
      "name": "Relevamiento",
      "title": "La primera tarea es entender la operación.",
      "copy": "Reunimos necesidades, equipos, sistemas y restricciones. Contrastamos lo documentado con lo que las personas necesitan hacer cada día.",
      "decision": "Necesidades, activos y restricciones."
    },
    {
      "name": "Dependencias",
      "title": "Relacionamos las piezas antes de proponer cambios.",
      "copy": "Identificamos cómo se vinculan aplicaciones, red, equipos y proveedores. El mapa muestra qué depende de qué y dónde una decisión impacta en otra.",
      "decision": "Sistemas, conexiones y responsables."
    },
    {
      "name": "Riesgos",
      "title": "Las debilidades se evalúan por su efecto.",
      "copy": "Revisamos puntos de falla, obsolescencia y dificultades de operación. Ordenamos los hallazgos por impacto y por la evidencia disponible.",
      "decision": "Impacto, exposición y evidencia."
    },
    {
      "name": "Alternativas",
      "title": "Una recomendación debe explicar sus razones.",
      "copy": "Comparamos alternativas técnicas con sus condiciones, costos y compromisos. La propuesta responde a las necesidades relevadas y al horizonte del proyecto.",
      "decision": "Criterios, opciones y compromisos."
    },
    {
      "name": "Prioridades",
      "title": "El orden de ejecución también es una decisión.",
      "copy": "Definimos etapas según dependencias, recursos y continuidad de la operación. Cada etapa debe dejar un resultado útil y verificable.",
      "decision": "Secuencia, recursos y continuidad."
    },
    {
      "name": "Plan y alcance",
      "title": "La decisión se convierte en un proyecto concreto.",
      "copy": "Entregamos criterios, alcance y documentación para evaluar y ejecutar. Definimos qué incluye la intervención y cómo se verificará su resultado.",
      "decision": "Alcance, documentación y aceptación."
    }
  ]
},
};
