export const SERVICE_STORIES={
 Data:{title:'Red de datos',verb:'Transporta información',why:'Une puestos, servidores y aplicaciones para que la operación no se interrumpa.',um:'Última Milla · cableado estructurado y fibra óptica',chain:['Puesto','Switch','Aplicación'],icon:'M4 6h16v5H4z M7 8h1m3 0h1m3 0h1 M12 11v6 M5 20v-3h14v3'},
 CCTV:{title:'Videovigilancia',verb:'Transporta imágenes',why:'Las cámaras envían video al grabador y al puesto de supervisión.',um:'Última Milla · CCTV y seguridad electrónica',chain:['Cámara IP','PoE','Grabación'],icon:'M3 6h13v10H3z M16 9l5-3v10l-5-3 M8 16v4m-4 0h8'},
 Telecom:{title:'Comunicaciones',verb:'Conecta personas y dispositivos',why:'Wi-Fi y telefonía IP permiten movilidad, llamadas y acceso a los servicios.',um:'Última Milla · conectividad inalámbrica y telefonía IP',chain:['Dispositivo','Red de acceso','Comunicación'],icon:'M3 8q9-8 18 0 M6 12q6-6 12 0 M9 16q3-3 6 0 M12 20h.01'},
 Power:{title:'Energía IT',verb:'Sostiene la operación',why:'La distribución y el respaldo alimentan la infraestructura tecnológica.',um:'Última Milla · energía y continuidad IT',chain:['Tablero','UPS','Carga IT'],icon:'M13 2L5 14h7l-1 8 8-13h-7z'},
 Security:{title:'Control de accesos',verb:'Valida quién puede ingresar',why:'El lector comunica una credencial al controlador y registra el evento.',um:'Última Milla · control de accesos y seguridad electrónica',chain:['Credencial','Controlador','Acceso'],icon:'M5 3h14v18H5z M9 7h6v5H9z M15 16h.01'},
 'Fire-detection':{title:'Detección de incendio',verb:'Supervisa y notifica',why:'Los dispositivos reportan su estado a la central para detectar y comunicar una condición de alarma.',um:'Última Milla · detección y aviso de incendio',chain:['Detector','Central','Notificación'],icon:'M13 2c2 6-5 6-3 11 2-1 3-3 3-5 7 5 6 13-2 13C2 21 1 13 7 8c-1 4 1 5 2 5-1-5 4-7 4-11z'},
 Software:{title:'Software y operación',verb:'Convierte datos en acciones',why:'Los eventos de la infraestructura se presentan como información útil para gestionar y dar soporte.',um:'Última Milla · desarrollo e integración de software',chain:['Dato','Proceso','Decisión'],icon:'M8 6L2 12l6 6 M16 6l6 6-6 6 M14 3l-4 18'},
};
export function assetStory(asset){
 const base=SERVICE_STORIES[asset.system];
 if(asset.kind==='fiber')return {...base,title:'Fibra óptica',verb:'Conecta la red troncal',why:'El ODF organiza la fibra y la conecta al switch: el enlace troncal transporta información entre sectores.',chain:['Fibra','ODF / switch','Red de datos']};
 if(asset.kind==='wifi')return {...base,title:'Wi-Fi',verb:'Da movilidad a los dispositivos'};
 if(asset.kind==='phone')return {...base,title:'Telefonía IP',verb:'Transporta conversaciones',chain:['Terminal IP','Central','Destino']};
 return base;
}
export function flowValue(asset,t){
 const s=asset.system;
 if(s==='Power')return 12+.6*Math.sin(t);
 if(s==='Data')return 128+24*Math.sin(t*.7);
 if(s==='CCTV')return 4+.3*Math.sin(t);
 if(s==='Telecom')return asset.kind==='phone'?.064:35+8*Math.sin(t);
 if(s==='Software')return 3+.6*Math.sin(t*.4);
 return s==='Security'?.5+.1*Math.sin(t*.3):1;
}
export function flowSummary(asset,time=0,active=true){
 const network=['Data','CCTV','Telecom'].includes(asset.system),power=asset.system==='Power';
 // Pause freezes the simulation clock; it must not erase a minute of history.
 const samples=Array.from({length:31},(_,i)=>flowValue(asset,time-60+i*2));
 const value=flowValue(asset,time),volume=samples.reduce((n,v,i)=>n+(i?(samples[i-1]+v)/2*2:0),0);
 return {samples,value,unit:network?'Mb/s':power?'A':'eventos/s',label:network?'Tráfico de información':power?'Corriente de carga':'Eventos de supervisión',total:network?(volume/8).toFixed(1):power?(volume/60).toFixed(1):Math.round(volume).toString(),totalLabel:network?'MB / ventana de 60 s':power?'A / promedio de 60 s':'eventos / ventana de 60 s',peak:Math.max(...samples),network};
}
// Limit density before raycasts: chosen labels must not cover one another.
export function chooseLabels(candidates,width,height,limit=3){
 const chosen=[];
 for(const p of candidates){
  const x=Math.max(18,Math.min(width-226,p.x+24)),y=Math.max(210,Math.min(height-270,p.y-76));
  if(chosen.some(q=>Math.abs(q.x-x)<225&&Math.abs(q.y-y)<182))continue;
  chosen.push({...p,anchorX:p.x,anchorY:p.y,x,y});if(chosen.length===limit)break;
 }
 return chosen;
}
