import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../src/assets/cine/isometric');
const C=Math.sqrt(3)/2, S=1.3, red='#DC2626';
const n=v=>Math.round(v*100)/100;
const esc=t=>String(t).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const P=(x,y,z)=>[n(520+(x-y)*C*S),n(430+((x+y)/2-z)*S)];
const poly=(pts,fill='#1b1e22',stroke='#9aa0a8',width=.6)=>'<polygon points="'+pts.map(p=>P(...p).join(',')).join(' ')+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
const route=(pts,color='#707781',width=.7)=>'<path d="M'+pts.map(p=>P(...p).join(',')).join('L')+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" vector-effect="non-scaling-stroke"/>';
const top=(x,y,z,body)=>{const p=P(x,y,z);return '<g transform="matrix('+n(C*S)+' '+S/2+' '+n(-C*S)+' '+S/2+' '+p.join(' ')+')">'+body+'</g>';};
const front=(x,y,z,body)=>{const p=P(x,y,z);return '<g transform="matrix('+n(C*S)+' '+S/2+' 0 '+S+' '+p.join(' ')+')">'+body+'</g>';};
const rect=(x,y,w,h,fill='#111419',stroke='#767e88',extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width=".5" '+extra+'/>';
const text=(x,y,label,size=6,color='#bcc2ca')=>'<text x="'+x+'" y="'+y+'" font-family="UM Sans,Arial,sans-serif" font-size="'+size+'" fill="'+color+'">'+esc(label)+'</text>';
const line=(d,color='#767e88',width=.6)=>'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
const dot=(x,y,r=1.6,fill='#adb4be')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';
const box=(x,y,z,w,d,h)=>{
 const a=x-w/2,b=x+w/2,c=y-d/2,e=y+d/2;
 return poly([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],'#252a31')+poly([[b,c,z],[b,e,z],[b,e,z+h],[b,c,z+h]],'#171b21')+poly([[a,c,z+h],[b,c,z+h],[b,e,z+h],[a,e,z+h]],'#6c7580');
};
const sheet=(z,body)=>box(0,0,z,350,250,2.5)+top(0,0,z+2.8,rect(-167,-117,334,234,'#101318','#a6afb9')+body);
const screw=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="2.1" fill="#15191d" stroke="#949ca6" stroke-width=".45"/>'+line('M'+(x-1)+' '+y+'h2M'+x+' '+(y-1)+'v2','#aeb6bf',.4);
const grid=(x,y,w,h,step=16)=>Array.from({length:Math.floor(w/step)},(_,i)=>line('M'+(x+i*step)+' '+y+'v'+h,'#252b33',.35)).join('')+Array.from({length:Math.floor(h/step)},(_,i)=>line('M'+x+' '+(y+i*step)+'h'+w,'#252b33',.35)).join('');

function telemetry(){
 let s=rect(-136,-83,272,166,'#11151a','#a7afb8')+text(-125,-69,'TELEMETRÍA / SISTEMAS',7)+line('M-125-59H125');
 s+=grid(-123,-48,244,120,20);
 for(let r=0;r<5;r++){
  const yy=-40+r*22;s+=text(-121,yy+4,['RED','ENERGÍA','VIDEO','SERVIDORES','ENLACES'][r],5.5);
  s+=line('M-60 '+yy+'h16l7-6 7 9 7-5h14l7-8 7 12 7-6h27l8-5 7 5h21',r===1?red:'#a3adb9',.9)+text(104,yy+4,'OK',5);
 }
 return s;
}
function diagnostic(){
 let s=rect(-136,-83,272,166,'#141920','#a7afb8')+text(-125,-69,'DIAGNÓSTICO / CONTEXTO',7)+line('M-125-59H125');
 for(let i=0;i<3;i++){const x=-123+i*84;s+=rect(x,-47,77,36)+text(x+7,-35,['RED','ENERGÍA','VIDEO'][i],5.8)+text(x+7,-21,['ENLACE','UPS / CARGA','GRABACIÓN'][i],5.2);}
 for(let i=0;i<4;i++){const y=5+i*16;s+=text(-122,y,['ORIGEN','DEPENDENCIA','ALCANCE','EVIDENCIA'][i],5.5)+line('M-63 '+(y-2)+'H118','#6f7a89')+dot(i===1?46:112,y-2,1.4,i===1?red:'#b4becb');}
 return s;
}
function incident(){
 let s=rect(-136,-83,272,166,'#11161d','#b9c0c9')+text(-125,-69,'RESPUESTA / TRAZABILIDAD',7)+line('M-125-59H125');
 s+=rect(-124,-47,79,112)+text(-117,-33,'INCIDENTE',6.2)+text(-117,-16,'ASIGNADO',6.2,red);
 for(let i=0;i<6;i++)s+=line('M-117 '+(i*11+2)+'h'+(i%2?49:59),'#78828f');
 const labels=['Detectado','Diagnóstico','Intervención','Verificación'];
 for(let i=0;i<labels.length;i++){let y=-35+i*26;s+=dot(-26,y,2.4,i===2?red:'#a8b2c0')+text(-15,y+2,labels[i],6.2)+text(84,y+2,'00:'+String(12+i*3),5.3);if(i<3)s+=line('M-26 '+(y+3)+'v20','#4b5462');}
 return s;
}
function consoleBody(){
 let s=box(0,-38,0,150,110,5)+box(0,-48,5,25,30,61)+box(0,0,61,300,20,187);
 s+=front(0,10.3,154,rect(-142,-87,284,174,'#0d1117','#9ea8b5'));
 for(const x of [-145,145])for(const y of [-89,89])s+=front(0,10.6,154,screw(x,y));
 for(let i=0;i<18;i++)s+=route([[150,-8,85+i*7],[150,6,85+i*7]],'#939ba6',.5);
 s+=front(0,10.6,67,dot(131,0,1.8,red));
 return s;
}
function consoleDiagram(){
 return consoleBody()+'<g data-operation-layer="telemetry">'+front(0,11,154,telemetry())+'</g><g class="iso-operation-layer iso-operation-layer--middle" data-operation-layer="diagnostic">'+front(0,13,154,diagnostic())+'</g><g class="iso-operation-layer iso-operation-layer--front" data-operation-layer="response">'+front(0,14,154,incident())+'</g>';
}
function phone(){
 let s=box(0,0,0,64,10,130);
 s+=front(0,5.2,65,rect(-27,-59,54,118,'#0b1017','#c3cbd5')+line('M-8-51H8','#98a3b2',1.2)+text(-21,-34,'SOPORTE',5.5)+text(-21,-19,'ASIGNADO',5.5,red));
 s+=front(0,5.3,65,line('M-21-9h42m-42 9h34m-34 9h38m-38 9h26')+rect(-21,33,42,13,'#272f39')+text(-17,41,'VERIFICAR',4.8));
 return s;
}
function rackMini(){
 let s=box(0,0,0,106,90,218);
 for(let i=0;i<8;i++){
  s+=front(0,45.2,24+i*24,rect(-46,-9,92,18,'#20262e','#798492'));
  for(let port=0;port<12;port++)s+=front(0,45.4,24+i*24,rect(-40+port*6.3,-3,4.1,6,'#090c11','#8893a0'));
 }
 return s;
}
const place=(body,x,y,z,scale)=>{const p=P(x,y,z);return '<g transform="translate('+p.join(' ')+') scale('+scale+') translate(-520 -430)">'+body+'</g>';};
function supportSystem(){
 let s=poly([[-295,-125,0],[295,-125,0],[295,95,0],[-295,95,0]],'#0c1015','#596472');
 s+=route([[-210,17.4,80],[-210,65,5],[35,65,5],[35,-5,5],[35,-5,112]],red,1.4);
 s+=route([[35,65,5],[210,65,5],[210,74.2,52]],red,1.4);
 s+=place(rackMini(),-210,-15,0,.72);
 s+=place(consoleBody()+front(0,11,154,incident()),35,-15,0,.72);
 s+=place(phone(),210,70,0,.8);
 return s;
}
function floorplan(){
 let s=text(-151,-96,'RELEVAMIENTO / SITIO',8)+line('M-151-86H151')+grid(-150,-75,300,174);
 s+=rect(-145,-69,290,153,'none','#aeb9c5')+line('M-45-69V84M55-69V84M-145 6H145','#aeb9c5',1);
 s+=line('M-44 17v18M-44 35q18 0 18-18M56-52v18M56-34q18 0 18-18','#909caa',.7);
 for(let i=0;i<6;i++){const x=-125+(i%3)*28,y=-45+Math.floor(i/3)*26;s+=rect(x,y,20,12,'#252d38','#8996a6')+rect(x+5,y+15,9,6);}
 for(let i=0;i<5;i++)s+=rect(77,-58+i*24,48,16,'#26303c','#8996a6');
 for(const [x,y]of [[-113,42],[-70,42],[0,-37],[14,51],[95,51]])s+=rect(x,y,22,15)+dot(x+11,y+7,1.6,red);
 s+=line('M-132 49H-20V-28H5V59H106',red,1.2)+text(-148,108,'ESPACIOS · EQUIPOS · RECORRIDOS',6);
 return s;
}
function topology(){
 let s=text(-151,-96,'ARQUITECTURA / DEPENDENCIAS',8)+line('M-151-86H151');
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const x=-138+col*75,y=-56+row*48;
  s+=rect(x,y,52,27,'#202834','#9eacbe','data-topology-node=""')+text(x+7,y+11,['ACCESO','RED','DATOS','SERVICIO'][col],5.8)+line('M'+(x+7)+' '+(y+19)+'h36','#728095');
  if(col<3)s+=line('M'+(x+52)+' '+(y+13)+'h23',row===1?red:'#586b7f');
  if(row<2&&col===1)s+=line('M'+(x+26)+' '+(y+27)+'v21',red,.9);
 }
 s+=text(-148,108,'DISPONIBILIDAD · SEGURIDAD · EVOLUCIÓN',6);
 return s;
}
function decision(){
 let s=text(-151,-96,'DECISIONES / EVIDENCIA',8)+line('M-151-86H151');
 const labels=['Disponibilidad','Seguridad','Mantenimiento','Capacidad','Continuidad'];
 s+=text(-147,-68,'CRITERIO',6)+text(-21,-68,'ALTERNATIVAS',6)+text(99,-68,'EVIDENCIA',6);
 for(let i=0;i<labels.length;i++){
  const y=-49+i*26;s+=line('M-151 '+(y+14)+'H151','#414d5c')+text(-147,y+4,labels[i],6.5);
  for(let j=0;j<3;j++)s+=rect(-13+j*30,y-5,17,11,j===(i%3)?'#66788e':'#222c39','#60738a')+(j===(i%3)?line('M'+(-9+j*30)+' '+(y+1)+'l3 3 6-6',red,1):'');
  s+=line('M103 '+(y+4)+'h37','#a9b5c3',.8);
 }
 s+=text(-148,108,'ALCANCE · RESPONSABLE · ENTREGABLE',6);
 return s;
}
function architecture(){
 return '<g data-operation-layer="site">'+sheet(0,floorplan())+'</g><g class="iso-operation-layer iso-operation-layer--middle" data-operation-layer="dependencies">'+sheet(9,topology())+'</g><g class="iso-operation-layer iso-operation-layer--front" data-operation-layer="decision">'+sheet(18,decision())+'</g>';
}
const zoom=(body,scale=1.45)=>'<g transform="translate(520 350) scale('+scale+') translate(-520 -430)">'+body+'</g>';
const svg=(id,title,description,body,viewBox='0 -100 1040 800')=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+viewBox+'" role="img" aria-labelledby="'+id+'-title '+id+'-desc"><title id="'+id+'-title">'+esc(title)+'</title><desc id="'+id+'-desc">'+esc(description)+'</desc>'+body+'</svg>';
const files={
 'support-v7-object.svg':svg('support-v7-object','Consola operativa por capas','Telemetría, diagnóstico y respuesta forman capas relacionadas de una misma consola. Representación conceptual sin datos reales.',consoleDiagram(),'230 -160 610 710'),
 'support-v7-system.svg':svg('support-v7-system','Del sistema al responsable','El gabinete, la consola de monitoreo y el aviso al responsable conservan una conexión identificable.',supportSystem()),
 'support-v7-detail.svg':svg('support-v7-detail','Un incidente, de la señal al cierre','La respuesta conserva detección, diagnóstico, intervención y verificación. La misma interfaz del conjunto se amplía.',zoom(front(0,0,0,incident()),1.6)),
 'consulting-v7-object.svg':svg('consulting-v7-object','Un proyecto con evidencia en cada capa','Relevamiento espacial, arquitectura de dependencias y matriz de decisiones se separan sin perder el mismo sistema.',architecture(),'130 0 870 680'),
 'consulting-v7-system.svg':svg('consulting-v7-system','Del sitio a su arquitectura','Plano del sitio con puestos, sala técnica y recorridos identificados para relevar el proyecto.',zoom(sheet(0,floorplan()),1.15)),
 'consulting-v7-detail.svg':svg('consulting-v7-detail','Decisiones que se pueden verificar','Disponibilidad, seguridad, mantenimiento, capacidad y continuidad se relacionan con alternativas y evidencia.',zoom(sheet(0,decision()),1.45)),
};
fs.mkdirSync(out,{recursive:true});
for(const [name,source]of Object.entries(files))fs.writeFileSync(path.join(out,name),source);
fs.writeFileSync(path.join(out,'operations-v7.json'),JSON.stringify({version:7,projection:'orthographic 30 / 150 / 270 degrees',role:'generic conceptual service explanations',files:Object.entries(files).map(([file,source])=>({file,bytes:Buffer.byteLength(source)}))},null,2));
console.log(JSON.stringify({assets:Object.keys(files).length,bytes:Object.values(files).reduce((n,s)=>n+Buffer.byteLength(s),0)}));
