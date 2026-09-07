// All telemetry is synthetic. These are scene annotations, not SGI or hardware readings.
export const INSPECTION_POINTS=[
 {id:'ODF-01',system:'Data',name:'ODF / backbone óptico',p:[9.5,3.3,1.52],kind:'fiber'},
 {id:'SW-01',system:'Data',name:'Switch de distribución',p:[10.3,3.46,1.75]},
 {id:'UPS-01',system:'Power',name:'UPS modular / sala eléctrica',p:[17.15,6.74,1.3]},
 {id:'TAB-01',system:'Power',name:'Tablero IT / distribución',p:[18.6,7.74,1.65]},
 {id:'BAT-01',system:'Power',name:'Banco de baterías',p:[16.7,5.1,.5],kind:'battery'},
 {id:'NVR-01',system:'CCTV',name:'Grabación / rack CCTV',p:[17.5,12.64,1.4]},
 ...[[-13.5,15.47,2.83],[13.5,15.47,2.83],[3.3,-1.8,3.1],[-3.5,6.25,3.25],[16.1,.5,3.05]].map((p,i)=>({id:`CAM-0${i+1}`,system:'CCTV',name:`Cámara IP ${i+1}`,p,kind:'camera'})),
 ...[-12,-8,-4,0,4,8,12].map((x,i)=>({id:`AP-0${i+1}`,system:'Telecom',name:`Punto de acceso Wi-Fi ${i+1}`,p:[x,7.3,3.15],kind:'wifi'})),
 ...[-4,-2,0].map((x,i)=>({id:`IP-${201+i}`,system:'Telecom',name:`Terminal IP ${201+i}`,p:[x-.37,3.2,1.25],kind:'phone'})),
 {id:'ACC-01',system:'Security',name:'Videoportero / acceso principal',p:[.05,-2.2,1.32]},
 {id:'ACC-02',system:'Security',name:'Lector / acceso técnico',p:[12.12,.08,1.26]},
 {id:'F-01',system:'Fire-detection',name:'Central de detección',p:[-13.5,15.69,1.55]},
 {id:'OPS-01',system:'Software',name:'Puesto de operación',p:[-2,3.1,1.3]},
];
export function inspectAt(system,p){
 const candidates=INSPECTION_POINTS.filter(a=>a.system===system).map(a=>({a,d:Math.hypot(...a.p.map((n,i)=>n-p[i]))})).sort((a,b)=>a.d-b.d);
 return candidates[0]?.d<1.3?candidates[0].a:{id:`${system}-ENLACE`,name:'Enlace / distribución',system,kind:'link'};
}
export function sampleTelemetry(asset,seconds=0,active=true){
 const traffic=active?Math.round(128+24*Math.sin(seconds*.7)):0;
 const base={Data:[['Capacidad ilustrativa',asset.kind==='fiber'?'10 Gb/s':'1 Gb/s'],['Tráfico simulado',`${traffic} Mb/s`],['Medio',asset.kind==='fiber'?'Fibra óptica · 1310 nm':'Ethernet']],
 CCTV:[['Video simulado','H.264 · 1920 × 1080'],['Caudal simulado',`${active?(4+.3*Math.sin(seconds)).toFixed(1):'0'} Mb/s`],['Cadencia DEMO',active?'25 fps':'Pausada']],
 Telecom:asset.kind==='phone'?[['Protocolo DEMO','SIP / RTP'],['Audio ilustrativo','G.711 · 64 kb/s'],['Estado',active?'Sesión de prueba':'Pausada']]:[['Banda ilustrativa','5 GHz'],['Canal DEMO','36 · 5.180 GHz'],['Tráfico simulado',`${active?Math.round(35+8*Math.sin(seconds)):0} Mb/s`]],
 Power:asset.kind==='battery'?[['Tensión DC ilustrativa','48 V DC'],['Carga ilustrativa','86 %'],['Estado','Respaldo disponible · DEMO']]:[['Tensión ilustrativa','230 V AC'],['Frecuencia ilustrativa','50 Hz'],['Corriente simulada',`${active?(12+.6*Math.sin(seconds)).toFixed(1):'12.0'} A`]],
 Security:[['Control ilustrativo','Credencial / controlador'],['Alimentación ilustrativa','12 V DC'],['Evento DEMO',active?'Supervisión de acceso':'Animación pausada']],
 'Fire-detection':[['Sistema','Detección / supervisión DEMO'],['Alimentación ilustrativa','24 V DC'],['Estado','Normal simulado · sin alarma real']],
 Software:[['Sesión','Aplicación DEMO local'],['Eventos simulados',active?'3 / s':'0 / s'],['Origen','Datos sintéticos, sin SGI']]};
 return base[asset.system]||[];
}
