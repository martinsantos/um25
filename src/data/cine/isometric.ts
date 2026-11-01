export interface IsometricStudy {
  asset: string;
  name: string;
  title: string;
  object: string;
  views: {label: string; title: string; description: string}[];
  parts: {name: string; detail: string}[];
}
const system = (description: string) => ({label:'Sistema', title:'Una pieza dentro del proyecto.', description});
export const ISOMETRIC_STUDIES: Record<string, IsometricStudy> = {
  '101': {
    asset:'network', name:'Redes de datos', title:'Cada conexión. Todo en marcha.', object:'Switch de acceso · 24 RJ45 / 4 SFP',
    views:[
      system('La sala IT y los puestos de trabajo comparten una misma red. El recorrido rojo ubica el equipo dentro de esa instalación.'),
      {label:'Equipo',title:'Un switch de acceso.',description:'Veinticuatro puertos de cobre, cuatro alojamientos de fibra y una consola. Cada conexión conserva su identificación.'},
      {label:'Despiece',title:'La forma sigue a la construcción.',description:'La tapa plegada se separa del cuerpo y permite leer la placa, los módulos y los alojamientos de conexión.'},
      {label:'Conector',title:'El detalle pertenece al conjunto.',description:'Blindaje plegado, espacio para la traba y ocho contactos separados: el jack sigue siendo parte del mismo equipo.'},
    ],
    parts:[{name:'Conexiones reconocibles',detail:'Cobre y fibra tienen alojamientos propios; los puertos se identifican individualmente.'},{name:'Construcción y montaje',detail:'Tapa, ventilación, fijaciones y orejas de rack forman un cuerpo coherente.'},{name:'Una red documentada',detail:'Cableado, puertos y equipos se entregan con identificación y pruebas de la instalación.'}],
  },
  '102': {
    asset:'security',name:'Seguridad electrónica',title:'Ver bien. Actuar a tiempo.',object:'Cámara IP · óptica / soporte / protección',
    views:[
      system('Cámaras distribuidas en accesos y circulación se conectan a la sala IT. El diseño parte del espacio que hay que observar.'),
      {label:'Equipo',title:'Cada cámara tiene un encuadre.',description:'Lente, parasol, carcasa y soporte articulado resuelven tareas distintas en una misma pieza.'},
      {label:'Despiece',title:'Protección, óptica y electrónica.',description:'La cubierta se separa para reconocer el interior y sus fijaciones sin perder la orientación del equipo.'},
      {label:'Óptica',title:'La imagen empieza en la lente.',description:'Los anillos de protección y los emisores rodean la óptica. El alcance se especifica para cada escena real.'},
    ],
    parts:[{name:'Escena y distancia',detail:'La óptica se elige a partir del área, la iluminación y el detalle que debe verse.'},{name:'Montaje y ambiente',detail:'La protección y la fijación acompañan las condiciones del sitio.'},{name:'Operación integrada',detail:'Video, grabación, accesos y monitoreo se coordinan dentro del sistema.'}],
  },
  '103': {
    asset:'telecom',name:'Telecomunicaciones',title:'Conectar donde empieza la distancia.',object:'Radioenlace · reflector / radio / herrajes',
    views:[
      system('El enlace exterior conecta el sitio con otro punto. Radio, red y alimentación conservan un recorrido identificable.'),
      {label:'Equipo',title:'Dos puntos. Una dirección precisa.',description:'Reflector, alimentador y radio trabajan sobre el mismo eje; el mástil sostiene la orientación.'},
      {label:'Despiece',title:'Conexiones protegidas en exterior.',description:'La cubierta de conexión se aparta para leer el puerto y el cableado junto a la radio y su disipación.'},
      {label:'Montaje',title:'La precisión también se sostiene.',description:'Abrazadera, tornillos y mástil fijan la dirección del conjunto. El herraje forma parte del diseño del enlace.'},
    ],
    parts:[{name:'Reflector y alimentador',detail:'La orientación se define entre los extremos y las condiciones del trayecto.'},{name:'Radio y conexión',detail:'Datos, alimentación y protección se especifican para operación exterior.'},{name:'Ajuste y fijación',detail:'El montaje permite orientar y mantener el enlace a lo largo del tiempo.'}],
  },
  '104': {
    asset:'software',name:'Software a medida',title:'La lógica. En cada capa.',object:'Puesto de trabajo · pantalla / teclado / equipo',
    views:[
      {...system('Los puestos de trabajo y la sala IT comparten la red por la que corre la aplicación. El recorrido rojo es el del software dentro del edificio.'),title:'El software corre en el edificio.'},
      {label:'Puesto',title:'Donde la aplicación se usa.',description:'Pantalla, teclado, equipo y teléfono: un puesto de trabajo real. La herramienta se diseña para ese lugar, esas tareas y esas personas.'},
      {label:'Pantalla',title:'La aplicación vive en la pantalla.',description:'Lo que ve quien opera: navegación, registros y acciones en una misma interfaz, hecha para su proceso.'},
    ],
    parts:[{name:'Proceso y personas',detail:'La herramienta se define a partir de tareas, roles y permisos reales.'},{name:'Datos e integraciones',detail:'APIs, sistemas y registros conectan la aplicación con la operación.'},{name:'Código y evolución',detail:'El desarrollo conserva trazabilidad, pruebas y capacidad de mejora.'}],
  },
  '105': {
    asset:'support-v7',name:'Soporte IT 24/7',title:'Leer el estado. Resolver el incidente.',object:'Sala de servidores · racks / equipos',
    views:[
      {...system('Soporte cubre redes, energía, video, telecomunicaciones y detección en el mismo edificio. Cada incidente conserva su lugar en la instalación.'),title:'Todos los sistemas, un responsable.'},
      {label:'Sala',title:'La sala de servidores.',description:'Los racks con los equipos que sostienen la operación. Es lo que el soporte vigila, mantiene y restablece.'},
      {label:'Rack',title:'Cada equipo tiene un estado.',description:'Unidad por unidad, lo que está montado se identifica, se monitorea y se interviene con registro, prioridad y plazo acordado.'},
    ],
    parts:[{name:'Monitoreo y prioridad',detail:'El estado del sitio orienta la evaluación inicial del incidente.'},{name:'Responsable y respuesta',detail:'Cada solicitud tiene asignación, seguimiento y un alcance acordado.'},{name:'Registro y prevención',detail:'La resolución documentada alimenta el mantenimiento y la mejora del servicio.'}],
  },
  '106': {
    asset:'consulting-v7',name:'Consultoría IT',title:'La arquitectura se puede leer.',object:'Edificio · sistemas / plantas / planta baja',
    views:[
      {...system('El edificio con todos sus sistemas: redes, seguridad, telecomunicaciones, software, detección de incendios y energía. La consultoría parte de leerlos juntos.'),title:'La arquitectura se puede leer.'},
      {label:'Plantas',title:'Separar para entender las relaciones.',description:'Las dos primeras plantas sin las de arriba: cómo suben los montantes, dónde se concentran los equipos y qué depende de qué.'},
      {label:'Planta baja',title:'Una planta, todos los sistemas.',description:'La planta baja sola: espacios, equipos y recorridos de cada sistema sobre el mismo piso. De acá salen las decisiones.'},
    ],
    parts:[{name:'Relevamiento y evidencia',detail:'El diagnóstico parte de sistemas, documentación y necesidades del sitio.'},{name:'Diseño y alternativas',detail:'La arquitectura conecta alcance, dependencias y criterios de decisión.'},{name:'Plan de ejecución',detail:'El roadmap ordena prioridades, etapas y entregables verificables.'}],
  },
  '107': {
    asset:'fire',name:'Detección de incendio',title:'Cada dispositivo forma parte del lazo.',object:'Central · lazo / señalización / respaldo',
    views:[
      system('La central reúne señales de los dispositivos distribuidos en el edificio. El recorrido se documenta para instalar y mantener.'),
      {label:'Central',title:'El estado del sistema se puede leer.',description:'Gabinete, pantalla, controles e indicadores forman una central reconocible.'},
      {label:'Despiece',title:'Conexión y respaldo quedan a la vista.',description:'La cubierta se separa y revela bornes, cableado y baterías dentro del mismo gabinete.'},
      {label:'Detector',title:'El detalle responde a una función.',description:'Las aberturas permiten entrar aire hacia la cámara protegida. Base e indicador pertenecen al mismo dispositivo.'},
    ],
    parts:[{name:'Detección y aviso',detail:'Dispositivos automáticos y manuales se ubican a partir del riesgo y el ambiente.'},{name:'Central y lazo',detail:'Señales, recorridos e identificación se diseñan como un sistema supervisado.'},{name:'Entrega y mantenimiento',detail:'Pruebas, documentación y mantenimiento acompañan la puesta en servicio.'}],
  },
  '108': {
    asset:'power',name:'Energía IT',title:'Energía que sostiene la operación.',object:'UPS de rack · potencia / baterías / conexiones',
    views:[
      system('El respaldo se integra en la sala IT y sostiene las cargas definidas para la continuidad del sitio.'),
      {label:'Equipo',title:'El respaldo tiene una carga concreta.',description:'Frente de estado, ventilación y chasis de rack forman el equipo de continuidad.'},
      {label:'Despiece',title:'Potencia y batería tienen su lugar.',description:'La tapa se separa para distinguir módulos de batería, electrónica de potencia y conexiones.'},
      {label:'Conexión',title:'Tres contactos, una función definida.',description:'La salida IEC distingue tierra, fase y neutro. Las conexiones se especifican según el equipo y las cargas.'},
    ],
    parts:[{name:'Carga crítica',detail:'El dimensionamiento parte de los consumos que deben conservar continuidad.'},{name:'Autonomía y conexión',detail:'Potencia, baterías y salidas responden al alcance del respaldo.'},{name:'Instalación y control',detail:'Tableros, protección, puesta a tierra y mantenimiento completan el sistema.'}],
  },
};
