export const NETWORK_EQUIPMENT = [
 {
   "id": "switch",
   "name": "Switch",
   "title": "Conecta los equipos de tu red.",
   "copy": "Recibe las conexiones de los puestos, cámaras y puntos Wi-Fi. Desde aquí, los datos llegan a los servidores y al resto de la red.",
   "construction": "Cómo circulan los datos.",
   "inside": "Los puertos reciben cada cable; la placa procesa el tráfico y los disipadores evacuan el calor. El panel mantiene identificado el cableado del edificio.",
   "detail": "Un cable, una conexión identificada.",
   "closeup": "El conector RJ45 une el equipo con la red. Identificar y probar cada enlace permite encontrar fallas sin desconectar otros puestos.",
   "points": [
     {
       "name": "Puertos de acceso",
       "detail": "Conectan los dispositivos del edificio."
     },
     {
       "name": "Enlace al resto de la red",
       "detail": "Lleva el tráfico hacia servidores y otros switches."
     }
   ]
 },
 {
   "id": "panel",
   "name": "Patch panel",
   "title": "Cada puesto tiene un punto identificable.",
   "copy": "Termina el cableado fijo del edificio y lo ordena en el gabinete. Los cordones del frente permiten asignar cada puesto a un puerto del switch.",
   "construction": "El cableado fijo queda protegido.",
   "inside": "Los bloques posteriores reciben los conductores; la barra de sujeción evita que la tracción llegue a las terminaciones. El frente queda accesible para cambiar conexiones.",
   "detail": "Del puesto al panel, sin perder la referencia.",
   "closeup": "La terminación posterior mantiene el orden de los conductores. El mismo identificador acompaña a la toma, el cable y el puerto del panel.",
   "points": [
     {
       "name": "Frente de conexión",
       "detail": "Permite cambiar la asignación de un puesto."
     },
     {
       "name": "Terminación posterior",
       "detail": "Sujeta e identifica el cableado permanente."
     }
   ]
 },
 {
   "id": "manager",
   "name": "Organizador",
   "title": "El orden facilita el mantenimiento.",
   "copy": "Guía los cordones entre el panel y el switch. Deja cada conexión accesible y evita que los cables obstruyan otros equipos.",
   "construction": "Espacio para acceder a cada cable.",
   "inside": "La tapa protege el recorrido y el peine separa los cordones. Las curvas dejan espacio para reconectar un puerto sin tirar de los demás.",
   "detail": "Una curva que protege el tendido.",
   "closeup": "La guía evita dobleces cerrados y mantiene los cables separados. Un recorrido ordenado facilita revisar, cambiar y documentar cada conexión.",
   "points": [
     {
       "name": "Tapa y peine",
       "detail": "Protegen y separan los cordones."
     },
     {
       "name": "Recorrido del cable",
       "detail": "Deja espacio para trabajar en cada puerto."
     }
   ]
 },
 {
   "id": "fiber",
   "name": "Fibra óptica",
   "title": "Une áreas y edificios por fibra.",
   "copy": "Recibe los enlaces ópticos y protege sus empalmes. Desde esta bandeja, la fibra se conecta a los equipos que comunican las distintas áreas del sitio.",
   "construction": "Los empalmes quedan protegidos.",
   "inside": "Las bandejas separan las uniones y las guías guardan la reserva de fibra. Los adaptadores del frente permiten conectar el enlace sin exponer los empalmes.",
   "detail": "Dos fibras para un mismo enlace.",
   "closeup": "El conector LC dúplex reúne las dos terminaciones ópticas. La identificación y las pruebas del enlace permiten verificar qué extremos están conectados.",
   "points": [
     {
       "name": "Bandejas de empalme",
       "detail": "Protegen las uniones y la reserva de fibra."
     },
     {
       "name": "Adaptadores del frente",
       "detail": "Conectan el enlace con los equipos de red."
     }
   ]
 },
 {
   "id": "router",
   "name": "Router",
   "title": "Comunica tu red con otros sitios.",
   "copy": "Define por dónde sale el tráfico hacia Internet, una sede o una red externa. Sus interfaces separan los enlaces que conectan esos destinos.",
   "construction": "Interfaces para cada destino.",
   "inside": "Los puertos llevan el tráfico a la placa de procesamiento. La refrigeración mantiene el equipo en operación dentro del gabinete.",
   "detail": "La fibra entra mediante un transceptor.",
   "closeup": "El módulo SFP adapta la interfaz del equipo al enlace óptico. Se elige según la fibra, la distancia y los equipos de ambos extremos.",
   "points": [
     {
       "name": "Interfaces de red",
       "detail": "Conectan los distintos enlaces del sitio."
     },
     {
       "name": "Procesamiento del tráfico",
       "detail": "Aplica las rutas que llevan los datos a su destino."
     }
   ]
 },
 {
   "id": "server",
   "name": "Servidor",
   "title": "Aloja aplicaciones y datos de la operación.",
   "copy": "Reúne cómputo y almacenamiento para los servicios del sitio. La configuración de discos, memoria y respaldo depende de las aplicaciones que debe sostener.",
   "construction": "Cómputo, almacenamiento y refrigeración.",
   "inside": "Los discos guardan los datos, la memoria sostiene los procesos activos y los ventiladores extraen el calor. Cada módulo tiene una tarea en la operación.",
   "detail": "El almacenamiento se mantiene por módulos.",
   "closeup": "Las bandejas permiten identificar y sustituir unidades compatibles. El procedimiento de reemplazo y la protección de datos se definen según la configuración del servidor.",
   "points": [
     {
       "name": "Discos y memoria",
       "detail": "Sostienen los datos y las aplicaciones."
     },
     {
       "name": "Ventilación",
       "detail": "Extrae el calor del conjunto en funcionamiento."
     }
   ]
 },
 {
   "id": "ups",
   "name": "UPS",
   "title": "Da respaldo ante un corte eléctrico.",
   "copy": "Mantiene alimentados los equipos durante un tiempo definido por la carga y la autonomía del proyecto. Permite sostener la operación o realizar un apagado controlado.",
   "construction": "Baterías para sostener las cargas.",
   "inside": "El cassette almacena energía y la electrónica administra su entrega. El estado y el mantenimiento de las baterías determinan el respaldo disponible.",
   "detail": "El respaldo llega a los equipos.",
   "closeup": "Las conexiones de salida alimentan las cargas previstas. La autonomía se calcula para esos equipos y se verifica con pruebas y mantenimiento.",
   "points": [
     {
       "name": "Baterías",
       "detail": "Almacenan la energía de respaldo."
     },
     {
       "name": "Electrónica de potencia",
       "detail": "Administra la alimentación de las cargas."
     }
   ]
 },
 {
   "id": "pdu",
   "name": "Distribución",
   "title": "Distribuye la energía dentro del gabinete.",
   "copy": "Conecta cada equipo a la alimentación prevista. Sus salidas se identifican para conocer qué carga depende de cada circuito.",
   "construction": "Una salida para cada carga.",
   "inside": "Las barras internas distribuyen la alimentación a las salidas. Las protecciones y la capacidad se especifican según los equipos conectados.",
   "detail": "Alimentación con conexiones identificadas.",
   "closeup": "Las salidas IEC conectan los equipos del gabinete. La documentación vincula cada salida con su carga y su protección.",
   "points": [
     {
       "name": "Salidas de energía",
       "detail": "Alimentan los equipos del gabinete."
     },
     {
       "name": "Protección y capacidad",
       "detail": "Se definen para las cargas conectadas."
     }
   ]
 },
 {
   "id": "access",
   "name": "Punto Wi-Fi",
   "title": "Lleva la red a los espacios de trabajo.",
   "copy": "Conecta dispositivos inalámbricos con la red del edificio. Su ubicación se define por la cobertura, los materiales del lugar y la cantidad de usuarios.",
   "construction": "Antenas y electrónica trabajan juntas.",
   "inside": "Las antenas comunican los dispositivos y la placa administra el acceso. El cable de red vincula el punto Wi-Fi con el switch.",
   "detail": "La conexión que lleva la red al punto Wi-Fi.",
   "closeup": "El enlace RJ45 conecta el punto de acceso con el gabinete. Según el equipo, ese mismo cable también puede entregar alimentación PoE.",
   "points": [
     {
       "name": "Antenas",
       "detail": "Cubren el espacio donde se usa la red."
     },
     {
       "name": "Enlace de red",
       "detail": "Comunica el punto de acceso con el switch."
     }
   ]
 },
 {
   "id": "outlet",
   "name": "Toma de datos",
   "title": "La red llega al puesto de trabajo.",
   "copy": "Ofrece conexiones identificadas en el lugar donde se usan los equipos. Cada toma se corresponde con una terminación del panel en la sala de comunicaciones.",
   "construction": "Una terminación accesible y protegida.",
   "inside": "La placa fija los jacks a la pared y protege el cableado posterior. Cada boca se identifica para seguir el enlace hasta el gabinete.",
   "detail": "El mismo punto, en ambos extremos.",
   "closeup": "El RJ45 conecta el equipo del puesto. Su identificación permite localizar el puerto correspondiente en el panel y comprobar el enlace.",
   "points": [
     {
       "name": "Bocas de conexión",
       "detail": "Reciben los cables de los equipos del puesto."
     },
     {
       "name": "Identificación",
       "detail": "Vincula la toma con el panel del gabinete."
     }
   ]
 },
 {
   "id": "optic",
   "name": "Transceptor SFP",
   "title": "Adapta el equipo al enlace de fibra.",
   "copy": "Se instala en un puerto óptico del switch o router. Convierte la interfaz del equipo para comunicarlo por la fibra seleccionada en el proyecto.",
   "construction": "Interfaz eléctrica y conexión óptica.",
   "inside": "La placa comunica el equipo con la óptica del módulo; el cuerpo metálico protege y fija el transceptor en su alojamiento.",
   "detail": "Un módulo elegido para cada enlace.",
   "closeup": "El frente recibe la fibra y los contactos posteriores se conectan al equipo. Distancia, tipo de fibra y compatibilidad se comprueban entre ambos extremos.",
   "points": [
     {
       "name": "Frente óptico",
       "detail": "Recibe las terminaciones de fibra."
     },
     {
       "name": "Contactos posteriores",
       "detail": "Conectan el módulo con el switch o router."
     }
   ]
 },
 {
   "id": "injector",
   "name": "Inyector PoE",
   "title": "Entrega datos y energía por un cable.",
   "copy": "Añade alimentación a un enlace de red para un equipo compatible. Puede alimentar una cámara, un punto Wi-Fi o una radio desde un lugar accesible.",
   "construction": "La alimentación se incorpora al enlace.",
   "inside": "Una interfaz recibe los datos y la otra los entrega junto con energía. La electrónica de potencia adapta la alimentación al equipo previsto.",
   "detail": "Comprobar compatibilidad antes de conectar.",
   "closeup": "La salida PoE reúne red y alimentación. El estándar, la potencia y la compatibilidad se verifican para el dispositivo que recibirá energía.",
   "points": [
     {
       "name": "Entrada de datos",
       "detail": "Recibe el enlace desde la red."
     },
     {
       "name": "Salida PoE",
       "detail": "Entrega datos y alimentación al dispositivo."
     }
   ]
 },
 {
   "id": "camera",
   "name": "Cámara IP",
   "title": "Observa el área que necesita protección.",
   "copy": "Envía video a través de la red para grabación y monitoreo. La óptica, el soporte y la protección se eligen según el área y las condiciones del lugar.",
   "construction": "Cada parte ayuda a obtener una imagen útil.",
   "inside": "La óptica capta la escena, la electrónica procesa el video y el soporte conserva el encuadre. La carcasa protege el conjunto en su ubicación.",
   "detail": "La lente define qué se puede observar.",
   "closeup": "El ángulo y el alcance de la óptica se seleccionan para la escena. Los emisores, cuando corresponden, ayudan a observar con poca luz.",
   "points": [
     {
       "name": "Óptica",
       "detail": "Define el área y el detalle de la imagen."
     },
     {
       "name": "Red y grabación",
       "detail": "Llevan el video al sistema de monitoreo."
     }
   ]
 },
 {
   "id": "dome",
   "name": "Cámara domo",
   "title": "Vigila accesos y circulación.",
   "copy": "La óptica se orienta dentro de una cubierta protectora. Comparte la red y el sistema de grabación con las demás cámaras del edificio.",
   "construction": "Una óptica orientable dentro del domo.",
   "inside": "La cúpula protege la cámara y el soporte interior permite ajustar el encuadre. La base fija el equipo en el punto previsto.",
   "detail": "El encuadre se ajusta al lugar.",
   "closeup": "La orientación y la lente definen el área observada. Se comprueban sobre la instalación para evitar zonas sin cobertura.",
   "points": [
     {
       "name": "Cúpula y base",
       "detail": "Protegen y fijan el equipo."
     },
     {
       "name": "Óptica orientable",
       "detail": "Ajusta el encuadre del área que se observa."
     }
   ]
 },
 {
   "id": "reader",
   "name": "Lector de acceso",
   "title": "Identifica a quien solicita ingresar.",
   "copy": "Lee una credencial o recibe una identificación y la comunica al controlador. Las reglas del sistema determinan si ese acceso está permitido.",
   "construction": "Identificación, comunicación y montaje.",
   "inside": "La antena recibe la credencial, la placa transmite la lectura y la base fija el lector en el acceso. El controlador aplica los permisos.",
   "detail": "Una lectura que se verifica en el sistema.",
   "closeup": "La antena y la electrónica capturan la identificación. La tecnología de la credencial y los permisos se definen junto con el controlador.",
   "points": [
     {
       "name": "Lectura de credenciales",
       "detail": "Identifica la solicitud de ingreso."
     },
     {
       "name": "Controlador",
       "detail": "Aplica los permisos definidos para ese acceso."
     }
   ]
 },
 {
   "id": "radio",
   "name": "Radioenlace",
   "title": "Conecta sitios sin un tendido entre ellos.",
   "copy": "Comunica dos puntos mediante un enlace inalámbrico. La viabilidad depende del recorrido, la visibilidad entre extremos y las condiciones del lugar.",
   "construction": "Antena, radio y montaje forman el enlace.",
   "inside": "El reflector concentra la señal, la radio comunica los datos y el herraje mantiene la orientación. La alineación se verifica entre ambos sitios.",
   "detail": "El montaje mantiene la dirección del enlace.",
   "closeup": "Las abrazaderas fijan el equipo al mástil y permiten ajustar su orientación. La instalación debe conservar esa alineación y proteger su cableado.",
   "points": [
     {
       "name": "Antena y radio",
       "detail": "Comunican los datos con el otro extremo."
     },
     {
       "name": "Herraje de montaje",
       "detail": "Fija y mantiene la orientación del enlace."
     }
   ]
 },
 {
   "id": "detector",
   "name": "Detector",
   "title": "Detecta una condición de incendio.",
   "copy": "Supervisa el área donde está instalado y comunica su estado a la central. La tecnología y la ubicación se eligen según el riesgo y el ambiente.",
   "construction": "El sensor pertenece a un lazo supervisado.",
   "inside": "La cámara de detección y la electrónica realizan la supervisión; la base fija y conecta el dispositivo. La central recibe alarmas y fallas.",
   "detail": "La detección depende del lugar y del riesgo.",
   "closeup": "Las aberturas permiten que la condición del ambiente llegue al sensor. La selección, ubicación y prueba del dispositivo forman parte del diseño del sistema.",
   "points": [
     {
       "name": "Cámara de detección",
       "detail": "Supervisa la condición prevista en el ambiente."
     },
     {
       "name": "Conexión al lazo",
       "detail": "Comunica el estado del detector a la central."
     }
   ]
 },
 {
   "id": "central",
   "name": "Central de incendio",
   "title": "Reúne alarmas y fallas para actuar.",
   "copy": "Supervisa los dispositivos, informa su estado y activa las acciones previstas en el diseño. Sus indicaciones permiten localizar el evento y seguir el procedimiento de respuesta.",
   "construction": "Supervisión con alimentación de respaldo.",
   "inside": "Los bornes reciben los lazos, la placa supervisa sus estados y las baterías sostienen el funcionamiento ante una interrupción de alimentación.",
   "detail": "Cada lazo se conecta y se prueba.",
   "closeup": "Las terminaciones se identifican para seguir el circuito de dispositivos. La puesta en marcha verifica las alarmas, las fallas y las acciones previstas.",
   "points": [
     {
       "name": "Lazos y electrónica",
       "detail": "Supervisan los dispositivos del sistema."
     },
     {
       "name": "Baterías",
       "detail": "Sostienen el funcionamiento ante un corte."
     }
   ]
 }
] as const;

export interface EquipmentKit {name:string;initial:string;parts:readonly string[];overview:string;description:string;context:readonly string[];contextPart:string}
export const EQUIPMENT_KITS:Record<string,EquipmentKit>={
  "101": {
    "name": "Redes de datos",
    "initial": "switch",
    "parts": [
      "switch",
      "panel",
      "manager",
      "fiber",
      "router",
      "server",
      "ups",
      "pdu",
      "access",
      "outlet",
      "optic",
      "injector"
    ],
    "overview": "Del puesto de trabajo a la sala de comunicaciones.",
    "description": "El cableado llega al panel; el switch conecta los equipos y los enlaces ópticos comunican otras áreas. Cada punto se identifica y se prueba como parte de la misma red.",
    "context": [
      "Puestos y Wi-Fi",
      "Panel y switch",
      "Servidores y enlaces"
    ],
    "contextPart": "panel"
  },
  "102": {
    "name": "Seguridad electrónica",
    "initial": "camera",
    "parts": [
      "camera",
      "dome",
      "reader",
      "switch",
      "server"
    ],
    "overview": "Cámaras y accesos conectados con la operación.",
    "description": "Las cámaras envían video para grabación y monitoreo. Los lectores comunican las solicitudes de acceso al controlador. La red conecta ambos sistemas con su operación.",
    "context": [
      "Cámaras y accesos",
      "Red del edificio",
      "Grabación y control"
    ],
    "contextPart": "server"
  },
  "103": {
    "name": "Telecomunicaciones",
    "initial": "radio",
    "parts": [
      "radio",
      "injector",
      "optic",
      "router",
      "fiber"
    ],
    "overview": "Dos sitios, un enlace diseñado para conectarlos.",
    "description": "El router comunica la red del sitio con un enlace óptico o inalámbrico. La alimentación, las interfaces y el recorrido se definen para los extremos reales del proyecto.",
    "context": [
      "Red del sitio",
      "Fibra o radioenlace",
      "Sitio remoto"
    ],
    "contextPart": "router"
  },
  "107": {
    "name": "Detección de incendio",
    "initial": "central",
    "parts": [
      "central",
      "detector",
      "ups"
    ],
    "overview": "Detectar, informar y activar la respuesta prevista.",
    "description": "Los detectores comunican su estado por un lazo supervisado. La central informa alarmas y fallas; su alimentación de respaldo sostiene el sistema ante un corte.",
    "context": [
      "Dispositivos",
      "Lazo supervisado",
      "Central y aviso"
    ],
    "contextPart": "central"
  },
  "108": {
    "name": "Energía IT",
    "initial": "ups",
    "parts": [
      "ups",
      "pdu",
      "server"
    ],
    "overview": "Energía de respaldo para las cargas de IT.",
    "description": "La UPS sostiene la alimentación durante la autonomía prevista. La distribución lleva esa energía a cada equipo del gabinete con conexiones y cargas identificadas.",
    "context": [
      "Alimentación",
      "UPS y distribución",
      "Equipos de IT"
    ],
    "contextPart": "ups"
  }
};
