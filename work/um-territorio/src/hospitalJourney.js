// Positions authored in Blender metres (Z up); the renderer converts to Y up.
export const WAYPOINTS = [
  {p:[21,-13,18],look:[0,8,1]},
  {p:[1.8,-3,2.1],look:[1.8,7,1.65]},
  {p:[1.8,7,1.65],look:[-8,7,1.65]},
  {p:[-8,7,1.65],look:[-8,3,1.3]},
  {p:[-8,4.1,1.65],look:[-11,2.8,.9]},
  {p:[-8,7,1.65],look:[3.5,7,1.65]},
  {p:[3.5,7,1.65],look:[3.5,12,1.2]},
  {p:[3.5,10.5,1.65],look:[2,13,1]},
  {p:[3.5,7,1.65],look:[8.8,7,1.65]},
  {p:[8.8,7,1.65],look:[8.8,2,1.65]},
  {p:[8.8,2,1.65],look:[10.5,4,1.2]},
  {p:[10.5,2,1.65],look:[10.5,4,1.2]},
  {p:[-2,4.55,1.65],look:[-2,3.1,1.51]},
  {p:[0,6,1.65],look:[0,7.3,3.13]},
  {p:[8.8,7,1.65],look:[11,2,1.5]},
  {p:[11,2.4,1.65],look:[12,.05,1.45]},
  {p:[12.1,-2.1,1.75],look:[10.1,-4.7,1.3]},
  {p:[1.8,-7,2.1],look:[1.5,0,1.8]},
  {p:[1.1,-3.5,1.6],look:[.05,-2.2,1.35]},
  {p:[9.6,2.4,1.92],look:[9.65,3.4,1.55]},
  {p:[16.2,2.1,1.8],look:[17.6,6.4,1.4]},
  {p:[16.2,10.1,1.8],look:[17,12.7,1.4]},
];
export const STOPS = [
 {name:'Vista general',step:0,description:'Una infraestructura. Sistemas que trabajan juntos.'},
 {name:'Pasillo',step:2,description:'La red troncal distribuye conectividad y servicios hacia cada ambiente.'},
 {name:'Consultorio',step:4,description:'Datos, telefonía y acceso a las aplicaciones de gestión.'},
 {name:'Internación',step:7,description:'Llamado de enfermería, conectividad y detección: continuidad asistencial.'},
 {name:'Sala técnica',step:11,description:'Racks, distribución y respaldo de energía sostienen toda la operación.'},
 {name:'Puestos IT',step:12,description:'PCs, telefonía IP y supervisión: la infraestructura al servicio de las personas.'},
 {name:'Wi-Fi',step:13,description:'AP-04: montaje, alimentación PoE y conectividad para dispositivos móviles.'},
 {name:'Acceso técnico',step:15,description:'Lector, contacto de puerta y conexión al controlador. Demostración de autorización.'},
 {name:'Calderas',step:16,description:'Equipamiento térmico como contexto. Detección, notificación y supervisión como servicios UM.'},
 {name:'Exterior',step:17,description:'Marquesina, entrada y vigilancia: la infraestructura comienza antes de entrar.'},
 {name:'Acceso principal',step:18,description:'Videoportero, lector, controlador y contacto de puerta. Acceso conectado.'},
 {name:'Fibra y certificación',step:19,description:'ODF integrado al rack, conectores LC y backbone. Instrumental móvil para mantenimiento.'},
 {name:'Energía IT',step:20,description:'Sala eléctrica propia: tableros, UPS modular, baterías, distribución y tierra.'},
 {name:'Grabación CCTV',step:21,description:'Grabador y almacenamiento: del punto de vigilancia al registro y la supervisión.'},
];
export const LAYERS = [
 ['all','Todos','Infraestructura integrada. Equipamiento y recorridos ilustrativos.'],
 ['Data','Datos','Cableado estructurado y backbone: de la sala técnica a cada puesto.'],
 ['Fire-detection','Incendio','Detección, aviso manual y central de alarma. Sin simular una emergencia real.'],
 ['Telecom','Comunicaciones','Wi-Fi, telefonía IP y llamado de enfermería conectados a la infraestructura.'],
 ['Security','Accesos','Lectores, videoportero y control de puertas. CCTV se inspecciona en su capa independiente.'],
 ['CCTV','CCTV','Cámaras y enlaces de video hacia un rack PoE/NVR y puesto de supervisión independientes.'],
 ['Power','Energía','Respaldo y distribución eléctrica para la infraestructura IT.'],
 ['Software','Software / operación','Terminales, gestión y supervisión sobre la red. Sin datos reales del SGI.'],
];
export const clamp = (x,min=0,max=1)=>Math.max(min,Math.min(max,x));
export function sampleJourney(progress) {
 const v=clamp(progress)*(WAYPOINTS.length-1),i=Math.min(Math.floor(v),WAYPOINTS.length-2),t=v-i;
 const a=WAYPOINTS[i],b=WAYPOINTS[i+1];
 return {p:a.p.map((n,k)=>n+(b.p[k]-n)*t),look:a.look.map((n,k)=>n+(b.look[k]-n)*t)};
}
export function nearestStop(progress) {
 return STOPS.reduce((a,b)=>Math.abs(b.step/(WAYPOINTS.length-1)-progress)<Math.abs(a.step/(WAYPOINTS.length-1)-progress)?b:a);
}
export const JOURNEY_STEPS=WAYPOINTS.length-1;
