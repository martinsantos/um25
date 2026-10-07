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
};
