import * as THREE from 'three';
// Clearly labeled synthetic signal, shared by all contextual bedside displays.
// No patient information and no connection to SGI or clinical systems.
export function createClinicalDisplay(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;let last=-Infinity;
 function update(ms,reduced=false){
  if(ms-last<100)return;if(reduced&&last!==-Infinity)return;last=ms;
  ctx.fillStyle='#071619';ctx.fillRect(0,0,512,384);
  ctx.fillStyle='#819b9d';ctx.font='16px Arial';ctx.fillText('UM / ESTUDIO CLÍNICO',18,25);ctx.fillStyle='#eac574';ctx.fillText('DEMO',438,25);
  ctx.strokeStyle='#173136';ctx.lineWidth=1;
  for(let x=15;x<370;x+=20){ctx.beginPath();ctx.moveTo(x,48);ctx.lineTo(x,335);ctx.stroke();}
  for(let y=48;y<340;y+=20){ctx.beginPath();ctx.moveTo(15,y);ctx.lineTo(365,y);ctx.stroke();}
  const phase=reduced?0:ms*.000055;
  for(let row=0;row<3;row++){
   const baseline=94+row*95;ctx.strokeStyle=['#6bcc96','#61afcc','#e6c077'][row];ctx.lineWidth=2;ctx.beginPath();
   for(let x=18;x<365;x++){
    const p=((x/115)+phase)%1;
    const pulse=row===0?(-.20*Math.exp(-(((p-.28)/.05)**2))+1.3*Math.exp(-(((p-.38)/.018)**2))-.45*Math.exp(-(((p-.42)/.025)**2))+.28*Math.exp(-(((p-.64)/.08)**2))):Math.sin(p*Math.PI*2)*(row===1?.55:.30);
    const y=baseline-pulse*31;x===18?ctx.moveTo(x,y):ctx.lineTo(x,y);
   }ctx.stroke();
   ctx.fillStyle=['#6bcc96','#61afcc','#e6c077'][row];ctx.font='13px Arial';ctx.fillText(['ECG SIM','SpO2 SIM','RESP SIM'][row],391,baseline-25);ctx.font='bold 43px Arial';ctx.fillText(['72','98','16'][row],390,baseline+18);
  }
  ctx.fillStyle='#92aaaa';ctx.font='13px Arial';ctx.fillText('SEÑALES ILUSTRATIVAS / SIN DATOS REALES',18,369);texture.needsUpdate=true;
 }
 update(0);return {texture,update,dispose:()=>texture.dispose()};
}
