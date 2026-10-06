/** A single operation, told from its connections to the people who keep it running. */
export interface ServiceScene {
  view: 'system' | 'object' | 'layers' | 'detail';
  duration: number;
  title: string;
  copy: string;
  part?: string;
  open?: boolean;
  layer?: number;
}
export interface ServiceChapter {code: string; scenes: ServiceScene[]}
const equipment = (part: string, system: [string,string], object: [string,string], inside: [string,string], detail: [string,string], cabinet = true): ServiceScene[] => [
  {view:'system',duration:cabinet?2600:6400,title:system[0],copy:system[1],part,open:false},
  ...(cabinet?[{view:'system' as const,duration:4200,title:system[0],copy:system[1],part,open:true}]:[]),
  {view:'object',duration:6200,title:object[0],copy:object[1],part},
  {view:'layers',duration:7200,title:inside[0],copy:inside[1],part},
  {view:'detail',duration:5600,title:detail[0],copy:detail[1],part},
];
export const SERVICE_NARRATIVE: ServiceChapter[] = [
 {code:'101',scenes:equipment('switch',
  ['Todo empieza por una conexión.','Puestos, Wi-Fi y servidores se encuentran en una red. El gabinete concentra sus conexiones; cada punto tiene un recorrido.'],
  ['El switch une las piezas.','Del sistema extraemos el equipo que conecta los puestos y los enlaces. Su lugar en el gabinete sigue visible.'],
  ['Una función detrás de cada componente.','La tapa se separa: placa, alimentación y ventilación aparecen en la misma geometría del equipo.'],
  ['El detalle también forma parte de la obra.','Contactos, puertos y enlaces ópticos: la instalación se resuelve hasta la conexión que vas a operar.'])},
 {code:'103',scenes:equipment('radio',
  ['La red llega más lejos.','El proyecto continúa entre sitios. La fibra o el radioenlace conectan los extremos con la capacidad que necesita la operación.'],
  ['Un enlace tiene dos extremos reales.','La radio sale del conjunto. Antena, carcasa y fijación forman una pieza preparada para su emplazamiento.'],
  ['La ingeniería está dentro y fuera.','Abrimos la carcasa para relacionar la electrónica, la alimentación y la comunicación con el recorrido del enlace.'],
  ['La conexión completa el recorrido.','Una interfaz y su alimentación unen la radio con la red del sitio. El enlace se diseña como un sistema.'])},
 {code:'102',scenes:equipment('camera',
  ['Lo conectado también necesita protección.','Cámaras, accesos, red y grabación trabajan juntos. La información llega al equipo que debe observar y actuar.'],
  ['La cobertura empieza en una cámara.','Una cámara concreta sale del proyecto: óptica, cuerpo y soporte definen qué puede ver y dónde puede instalarse.'],
  ['La imagen tiene una arquitectura.','La carcasa se abre para mostrar óptica, electrónica y conexiones. Cada elemento cumple una función.'],
  ['Ver bien para responder a tiempo.','El detalle de la óptica y la conexión explica cómo esa pieza se integra al sistema de video.'])},
 {code:'107',scenes:equipment('central',
  ['Detectar es el comienzo de una respuesta.','Los dispositivos comunican su estado por un lazo supervisado. La central reúne alarmas y fallas del sistema.'],
  ['La central organiza el aviso.','Del conjunto aislamos la central. Indicaciones, mandos y alimentación se reconocen en una misma pieza.'],
  ['El sistema se entiende al abrirlo.','Placa, bornes y respaldo quedan expuestos. La relación con los detectores sigue formando parte del proyecto.'],
  ['Cada conexión debe poder verificarse.','Los bornes y circuitos vinculan los dispositivos con la central. Instalamos, probamos y documentamos el recorrido.'],false)},
 {code:'108',scenes:equipment('ups',
  ['Y la operación necesita energía.','La alimentación llega al respaldo y a la distribución. Las cargas de IT comparten una infraestructura identificada.'],
  ['La UPS sostiene las cargas críticas.','Extraemos el equipo de respaldo. Su capacidad y autonomía se definen según lo que necesita seguir funcionando.'],
  ['El respaldo tiene piezas concretas.','Baterías, electrónica y ventilación aparecen al retirar la tapa. El mantenimiento también se contempla en el diseño.'],
  ['La energía llega a cada equipo.','Entradas, salidas y distribución completan el circuito que alimenta la infraestructura de IT.'])},
 {code:'104',scenes:[
  {view:'system',duration:6400,title:'La infraestructura se convierte en un proceso.',copy:'Personas, datos y tareas necesitan una herramienta común. El software conecta esas partes de la operación.'},
  {view:'object',duration:6200,title:'Una aplicación hecha para quienes la usan.',copy:'La interfaz reúne navegación, registros y acciones. Una persona encuentra su trabajo en un lugar reconocible.',layer:0},
  {view:'layers',duration:7200,title:'La navegación ordena el trabajo.',copy:'Separamos las capas de la misma interfaz. Cada área encuentra sus módulos y sus tareas.',layer:1},
  {view:'detail',duration:6200,title:'Los datos toman una forma útil.',copy:'Estados, indicadores y registros aportan contexto para decidir. El contenido se distingue de la estructura.',layer:2},
  {view:'detail',duration:5600,title:'Y cada acción deja un registro.',copy:'Crear, revisar, aprobar y resolver: el proceso continúa con acciones claras y trazables.',layer:3},
 ]},
 {code:'105',scenes:[
  {view:'system',duration:6400,title:'Alguien tiene que sostener todo esto.',copy:'Equipos, aplicaciones y responsables se conectan con la mesa de ayuda. Una señal se convierte en un caso.'},
  {view:'object',duration:6200,title:'El incidente llega a una persona.',copy:'La consola reúne señales, diagnóstico y respuesta. La información permite ordenar el siguiente paso.'},
  {view:'layers',duration:7200,title:'De la señal a la resolución.',copy:'Tres planos del mismo caso: qué ocurrió, cómo se investiga y quién responde. La historia conserva su contexto.'},
  {view:'detail',duration:5600,title:'El trabajo termina con seguimiento.',copy:'Prioridad, responsable y estado acompañan el caso hasta su cierre. La documentación queda para la próxima vez.'},
 ]},
 {code:'106',scenes:[
  {view:'system',duration:6400,title:'Todo vuelve al proyecto completo.',copy:'El sitio, sus equipos y su forma de trabajar definen las decisiones. Un plan conecta lo que existe con lo que sigue.'},
  {view:'object',duration:6200,title:'Una decisión con evidencia.',copy:'El relevamiento se traduce en arquitectura, dependencias y criterios para evaluar cada inversión.'},
  {view:'layers',duration:7200,title:'El plan puede leerse por capas.',copy:'Sitio, sistemas y prioridades conservan una misma proyección. Cada decisión tiene un lugar en el conjunto.'},
  {view:'detail',duration:6400,title:'Ocho servicios. Un mismo equipo.',copy:'Relevamos, diseñamos, instalamos y sostenemos. La complejidad se convierte en una operación que podés comprender y mantener.'},
 ]},
];
