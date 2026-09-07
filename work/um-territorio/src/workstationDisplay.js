import * as THREE from 'three';
export function createWorkstationDisplay(){
 const c=document.createElement('canvas');c.width=1024;c.height=576;const ctx=c.getContext('2d');
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;
 let last=-Infinity,lastEvent='';
 function update(ms,reduced=false,demo='',stage=0){
  const event=demo+stage,changed=event!==lastEvent;
  if(!changed&&(ms-last<500||reduced&&last!==-Infinity))return;last=ms;lastEvent=event;
  ctx.fillStyle='#101e27';ctx.fillRect(0,0,1024,576);
  ctx.fillStyle='#f2f5f5';ctx.font='bold 27px Arial';ctx.fillText('ULTIMA MILLA / OPERACIÓN',32,48);
  ctx.font='16px Arial';ctx.fillStyle='#74baa9';ctx.fillText('DEMOSTRACIÓN · DATOS ILUSTRATIVOS',32,77);
  const names=['RED DE DATOS','SEGURIDAD IP','COMUNICACIONES'];
  for(let i=0;i<3;i++){
   const x=32+i*329;ctx.fillStyle='#1b303c';ctx.fillRect(x,108,305,112);ctx.fillStyle='#94aebd';ctx.font='16px Arial';ctx.fillText(names[i],x+18,138);ctx.font='bold 30px Arial';ctx.fillStyle='#daf4e7';ctx.fillText('Disponible',x+18,186);
  }
  ctx.fillStyle='#182c37';ctx.fillRect(32,244,627,268);ctx.fillRect(683,244,308,268);
  ctx.font='18px Arial';ctx.fillStyle='#c9dce4';ctx.fillText('Actividad de infraestructura',54,278);ctx.fillText('Puestos conectados',704,278);
  ctx.strokeStyle='#314953';ctx.lineWidth=1;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(54,309+i*32);ctx.lineTo(637,309+i*32);ctx.stroke();}
  ctx.strokeStyle='#e1473b';ctx.lineWidth=3;ctx.beginPath();
  for(let x=0;x<580;x++){const y=403-Math.sin(x*.038+(reduced?0:ms*.0003))*22-Math.sin(x*.017)*37;x?ctx.lineTo(54+x,y):ctx.moveTo(54+x,y);}ctx.stroke();
  ['Admisión','Consultorios','Internación','Sala técnica'].forEach((name,i)=>{ctx.font='17px Arial';ctx.fillStyle='#d4e3e8';ctx.fillText(name,706,322+i*43);ctx.fillStyle='#63c4a2';ctx.beginPath();ctx.arc(958,316+i*43,5,0,Math.PI*2);ctx.fill();});
  const events={wifi:'AP-04 / Dispositivo DEMO asociado',phone:'PBX / Llamada DEMO 201 → 203',fire:'CT-01 / Evento de prueba · sin emergencia real',power:'UPS / Operación DEMO sobre batería',access:'Acceso técnico / Credencial DEMO autorizada'};
  ctx.font='16px Arial';ctx.fillStyle=demo?'#ffbd80':'#93acb7';ctx.fillText(demo?`${stage+1}/3 · ${events[demo]}`:'Conectividad • Supervisión • Continuidad operativa',32,551);texture.needsUpdate=true;
 }
 update(0);return {texture,update,dispose:()=>texture.dispose()};
}
