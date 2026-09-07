import * as THREE from 'three';
// Small reusable surface maps; no paid assets or remote texture requests.
export function createHospitalSurfaces(){
 const textures=[];
 function grain(woven=false){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d'),data=ctx.createImageData(128,128);let seed=17;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   seed=(seed*1664525+1013904223)>>>0;
   const v=128+(seed/4294967296-.5)*34+(woven?Math.sin(x*Math.PI/2)*18+Math.cos(y*Math.PI/2)*18:0),i=(y*128+x)*4;
   data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(woven?6:2,woven?6:2);textures.push(t);return t;
 }
 const fine=grain(),fabric=grain(true);
 function apply(mesh,finish){
  const cloth=/linen|textile|curtain|upholstery/.test(finish);
  const floor=/resin|stone/.test(finish),paint=/chalk|paint/.test(finish);
  if(!cloth&&!floor&&!paint&&!/polymer|oak/.test(finish))return;
  // Metric planar UVs keep grain scale consistent across batched Blender objects.
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
   const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
   uv[i*2]=nx>ny&&nx>nz?p.getY(i):p.getX(i);
   uv[i*2+1]=nz>nx&&nz>ny?p.getY(i):p.getZ(i);
  }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  mesh.material.bumpMap=cloth?fabric:fine;
  mesh.material.bumpScale=cloth?.0014:floor?.0006:.00035;
  mesh.material.roughness=cloth?.91:floor?.48:paint?.85:.42;
 }
 return {apply,dispose(){textures.forEach(t=>t.dispose());}};
}
