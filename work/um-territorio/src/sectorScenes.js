// Conceptual layouts in metres, Blender Z-up. No operational site data.
const point=(id,system,name,p,kind,why)=>({id,system,name,p,kind,why});
export const SECTORS={
 airport:{title:'Aeropuerto',subtitle:'Cada conexión sostiene un viaje.',description:'Del check-in al embarque: información al pasajero, comunicaciones y continuidad operativa.',model:'airport-connected.glb',source:[10,4,2],height:4.2,
 stops:[{name:'Terminal',camera:[29,-24,23],target:[1,8,1]},{name:'Check-in',camera:[-10,-.5,1.65],target:[-9,3.1,1.35]},{name:'Control y circulación',camera:[0,2,1.65],target:[3,8,1.6]},{name:'Embarque',camera:[7,9,1.65],target:[13,14,1.5]},{name:'Manga',camera:[17,13,1.65],target:[22,13,1.65]},{name:'Red y operación',camera:[10,1,1.65],target:[11,4,1.4]},{name:'Energía IT',camera:[21,1,1.65],target:[21,4,1.5]}],
 points:[point('AIR-SW','Data','Distribución de red / terminal',[10,3.45,1.8],'switch','Conecta los puestos operativos y las aplicaciones de la terminal.'),...[-13,-9,-5].map((x,i)=>point(`AIR-PC-${i+1}`,'Data',`Puesto de check-in ${i+1}`,[x,3.08,1.42],'pc','El puesto intercambia información operativa mediante su conexión de datos.')),
 ...[-10,-2,6,14].map((x,i)=>point(`AIR-AP-${i+1}`,'Telecom','Wi-Fi / circulación de pasajeros',[x,8,4.05],'wifi','Conectividad inalámbrica para movilidad en la terminal.')),
 point('AIR-TEL','Telecom','Telefonía IP / embarque',[13.55,14,1.2],'phone','Comunicación entre el personal de embarque y los sectores operativos.'),
 ...[[-14,1,3.4],[1,7,3.5],[14,14,3.4],[20,13,2.7]].map((p,i)=>point(`AIR-CAM-${i+1}`,'CCTV','Cámara IP / terminal',p,'camera','Video IP de áreas de circulación hacia el puesto de supervisión.')),
 ...[-12,-4,4,12].map((x,i)=>point(`AIR-DET-${i+1}`,'Fire-detection','Detector / hall',[x,6,4.05],'detector','Supervisión ilustrativa del lazo de detección y aviso.')),
 point('AIR-FACP','Fire-detection','Central de detección',[15,1,1.5],'panel','Centraliza estados y eventos de los dispositivos de detección.'),
 point('AIR-ACC','Security','Control de acceso / embarque',[15.7,13,1.2],'access','Valida credenciales del personal en el límite del área restringida.'),
 point('AIR-UPS','Power','UPS / sala eléctrica independiente',[20,4,1.1],'ups','Respaldo de energía para equipos de red y operación.'),point('AIR-TGBT','Power','Tablero de distribución IT',[22,4.5,1.6],'panel','Distribución eléctrica ilustrativa hacia cargas IT.'),
 point('AIR-NVR','CCTV','NVR / gabinete de supervisión',[14.5,4,1.4],'nvr','Grabación y supervisión de video, separadas del rack de datos.'),
 point('AIR-FIDS','Software','Información al pasajero / DEMO',[7,10,3.3],'screen','Información de vuelos ilustrativa distribuida mediante la red.') ]},
 winery:{title:'Bodega',subtitle:'Del origen al despacho. Todo conectado.',description:'Producción, depósito y operación unidos por infraestructura IT: trazabilidad, comunicaciones, seguridad y respaldo.',model:'winery-connected.glb',source:[12,3,2],height:5.4,
 stops:[{name:'Bodega',camera:[31,-29,27],target:[0,9,1.5]},{name:'Recepción',camera:[-12,-1,1.65],target:[-12,4,1.6]},{name:'Nave de tanques',camera:[-7,5,1.65],target:[-8,11,2.8]},{name:'Embotellado',camera:[2,7,1.65],target:[4,12,1.2]},{name:'Depósito y despacho',camera:[8,12,1.65],target:[12,17,1.4]},{name:'Operación y red',camera:[10,.6,1.65],target:[12,3,1.5]},{name:'Energía IT',camera:[19,1,1.65],target:[20,4,1.5]}],
 points:[point('WIN-SW','Data','Distribución / bodega',[12,2.45,1.8],'switch','Une operación, depósito y puestos de producción.'),point('WIN-PC','Data','Puesto de recepción',[ -12,3,1.42],'pc','Registro ilustrativo de recepción mediante un puesto conectado.'),point('WIN-TERM','Software','Terminal de trazabilidad / DEMO',[3,10,1.5],'screen','Eventos ilustrativos de lote y estado; no controla maquinaria real.'),point('WIN-OPS','Software','Puesto de operación / DEMO',[10,3,1.42],'pc','Visualiza información integrada de la operación.'),
 ...[[-10,10,5.15],[-2,10,5.15],[9,15,5.15]].map((p,i)=>point(`WIN-AP-${i+1}`,'Telecom','Wi-Fi / producción y depósito',p,'wifi','Movilidad para terminales y personal operativo.')),
 point('WIN-TEL','Telecom','Telefonía IP / operación',[10.7,3,1.1],'phone','Comunica recepción, operación y despacho.'),
 ...[[-14,2,3.8],[-6,17,4.5],[5,10,4],[14,18,4.5]].map((p,i)=>point(`WIN-CAM-${i+1}`,'CCTV','Cámara IP / supervisión',p,'camera','Supervisión visual de accesos y circulación productiva.')),
 ...[-12,-4,4,12].map((x,i)=>point(`WIN-DET-${i+1}`,'Fire-detection','Detección / nave industrial',[x,9,5.2],'detector','Dispositivo ilustrativo: la tecnología y ubicación reales requieren proyecto específico.')),
 point('WIN-FACP','Fire-detection','Central de detección',[15,1,1.5],'panel','Supervisa los estados de detección y notificación.'),point('WIN-ACC','Security','Control de acceso / recepción',[-15,1,1.2],'access','Acceso del personal y registro ilustrativo de credenciales.'),
 point('WIN-UPS','Power','UPS / sala eléctrica',[20,4,1.1],'ups','Respaldo para red, servidores y puestos IT; no representa potencia de proceso.'),point('WIN-TGBT','Power','Tablero eléctrico IT',[22,4.5,1.6],'panel','Distribución a cargas IT, independiente de la maquinaria industrial.'),point('WIN-NVR','CCTV','Gabinete CCTV / operación',[14,3,1.4],'nvr','Concentra grabación y supervisión de cámaras.') ]}
};
export function sectorRoutes(config){return config.points.filter(p=>p.id!==config.points[0].id).map(p=>{
 const origin=config.points.find(a=>p.system==='Power'?a.id.endsWith('TGBT'):p.system==='Fire-detection'?a.id.endsWith('FACP'):p.system==='CCTV'?a.id.endsWith('NVR'):a.id===config.points[0].id);
 const source=origin?.p||config.source;
 return {id:p.id,system:p.system,points:[source,[source[0],source[1],config.height],[source[0],8,config.height],[p.p[0],8,config.height],[p.p[0],p.p[1],config.height],p.p]};
 }).filter(r=>r.points[0]!==r.points.at(-1));}
