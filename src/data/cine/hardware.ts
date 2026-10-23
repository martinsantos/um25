export interface HardwareView { name: string; image: string; detail: string }
export interface HardwareStudy { title: string; alt: string; views: HardwareView[]; video?: string; components: {name: string; detail: string}[] }
const image = (name: string) => `/cine/media/cine-v5-${name}.webp`;
export const HARDWARE: Record<string, HardwareStudy> = {
  '101': {
    title: 'Una red. Todo conectado.',
    alt: 'Gabinete de red con panel de conexiones, switch de 24 puertos, servidores y UPS',
    video: '/cine/media/cine-v5-redes.mp4',
    views: [
      {name:'Infraestructura',image:image('infraestructura'),detail:'Del gabinete completo al punto de conexión.'},
      {name:'Conexiones',image:image('conexiones'),detail:'Panel 09 → puerto 06. Un recorrido físico entre ambos equipos.'},
      {name:'Puerto',image:image('puerto'),detail:'Un jack vacío deja ver sus ocho contactos y el mecanismo de retención.'},
    ],
    components:[
      {name:'Panel y switch',detail:'24 puertos de cobre y cuatro alojamientos SFP independientes.'},
      {name:'Conexiones identificadas',detail:'Cordones insertados y guiados por el organizador del rack.'},
      {name:'Continuidad de la instalación',detail:'Servidores, alimentación y respaldo conviven en el mismo gabinete.'},
    ],
  },
  '102': {
    title:'La seguridad empieza por ver bien.',
    alt:'Cámara IP domo con lente, carcasa transparente y base de montaje',
    video:'/cine/media/cine-v5-camera.mp4',
    views:[{name:"Equipo",image:image("camera-01-producto"),detail:"Óptica, protección y montaje en una misma pieza."},{name:"Mecanismo",image:image("camera-02-mecanismo"),detail:"El interior permite reconocer lente, ajuste y fijación de la cámara."},{name:"Detalle",image:image("camera-03-macro"),detail:"Lente y aro infrarrojo, vistos desde su propia cámara de detalle."}],
    components:[{name:'Óptica y orientación',detail:'La escena y la distancia determinan el encuadre de cada cámara.'},{name:'Carcasa y montaje',detail:'Protección y fijación según el ambiente de instalación.'},{name:'Sistema integrado',detail:'Video, acceso y operación se diseñan juntos.'}],
  },
  '103': {
    title:'Conectar donde empieza la distancia.',
    alt:'Antena parabólica de radioenlace con alimentador, radio y abrazaderas sobre un mástil',
    video:'/cine/media/cine-v5-antenna.mp4',
    views:[{name:"Equipo",image:image("antenna-01-producto"),detail:"El reflector y su alimentador comparten una dirección precisa."},{name:"Mecanismo",image:image("antenna-02-mecanismo"),detail:"Radio, disipación, cableado y herrajes de montaje quedan a la vista."},{name:"Detalle",image:image("antenna-03-macro"),detail:"El montaje asegura la orientación del conjunto sobre el mástil."}],
    components:[{name:'Reflector y alimentador',detail:'La orientación se define entre los dos puntos del enlace.'},{name:'Radio y cableado',detail:'Conexión y alimentación organizadas para operación exterior.'},{name:'Herrajes al mástil',detail:'Fijación y ajuste forman parte del diseño de cada sitio.'}],
  },
  '107': {
    title:'Cada dispositivo forma parte del lazo.',
    alt:'Central de incendio con gabinete rojo, detector óptico y avisador manual',
    video:'/cine/media/cine-v5-fire.mp4',
    views:[{name:"Sistema",image:image("fire-01-producto"),detail:"Central, detector y avisador son piezas distintas de un mismo sistema."},{name:"Mecanismo",image:image("fire-02-mecanismo"),detail:"El gabinete abre sobre su bisagra y deja ver terminales y recorrido del lazo."},{name:"Detalle",image:image("fire-03-macro"),detail:"Las aberturas del detector dejan entrar el aire hacia su cámara de detección."}],
    components:[{name:'Central y señalización',detail:'Pantalla, controles e indicadores permiten leer el estado del sistema.'},{name:'Detector y avisador',detail:'Detección automática y aviso manual se integran en el diseño.'},{name:'Lazo supervisado',detail:'El recorrido queda documentado para instalación y mantenimiento.'}],
  },
  '108': {
    title:'Energía que sostiene la operación.',
    alt:'UPS de rack de dos unidades con frente de estado y conexiones IEC',
    video:'/cine/media/cine-v5-ups.mp4',
    views:[{name:"Equipo",image:image("ups-01-producto"),detail:"Frente, ventilación y chasis de un equipo de respaldo en rack."},{name:"Mecanismo",image:image("ups-02-mecanismo"),detail:"Módulos, conexiones y tapa permiten reconocer el sistema de energía."},{name:"Detalle",image:image("ups-03-macro"),detail:"El conjunto de respaldo, a escala de sus componentes."}],
    components:[{name:'Estado y ventilación',detail:'Lectura operativa y circulación de aire en el frente del equipo.'},{name:'Conexiones de alimentación',detail:'Entradas y salidas definidas para la carga del sitio.'},{name:'Respaldo dimensionado',detail:'La autonomía se calcula sobre la carga crítica y la continuidad requerida.'}],
  },
};
