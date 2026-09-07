import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Reusable low-cost finish kit, layered over the original Blender architecture.
export function addHospitalFinishes(scene,xyz){
 const group=new THREE.Group();group.name='Architectural finish kit';scene.add(group);
 const materials={stone:new THREE.MeshStandardMaterial({color:'#6d7875',roughness:.72}),wood:new THREE.MeshStandardMaterial({color:'#89664b',roughness:.6}),metal:new THREE.MeshStandardMaterial({color:'#596764',metalness:.65,roughness:.34}),trim:new THREE.MeshStandardMaterial({color:'#aaa99d',roughness:.65}),white:new THREE.MeshStandardMaterial({color:'#d4d1c4',roughness:.6})};
 function box(p,d,key){const m=new THREE.Mesh(new THREE.BoxGeometry(d[0],d[2],d[1]),materials[key]);m.position.copy(xyz(p));m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function sign(body,p,w=1.3){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#263f3d';ctx.fillRect(0,0,512,128);ctx.fillStyle='#eef0e5';ctx.font='500 36px Arial';ctx.textAlign='center';ctx.fillText(body,256,77);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const o=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:t}));o.position.copy(xyz(p));group.add(o);
 }
 for(const cx of [-10.5,-3.5,3.5,10.5]){
  for(const dx of [-2.05,2.05]){
   box([cx+dx,8.505,.07],[2.8,.025,.12],'metal');
   box([cx+dx,8.50,.85],[2.8,.03,.40],'stone');
   box([cx+dx,8.46,1.04],[2.8,.035,.045],'wood');
  }
  sign(cx===10.5?'04 / QUIRÓFANO':`${cx<0?'01':'03'} / INTERNACIÓN`,[cx,8.495,2.7],1.22);
 }
 sign('02 / CONSULTORIO',[-8,5.10,2.65],1.3);
 sign('IT / ACCESO TÉCNICO',[11,5.35,2.60],1.7);
 // Service wall lining and continuous base trim establish human scale.
 for(const x of [-7,0,7]){
  box([x+.101,12.3,.08],[.025,7.4,.13],'metal');
  box([x+.106,12.3,.9],[.03,7.4,.65],'stone');
 }
 for(let x=-13.6;x<14;x+=.8)box([x,7,.118],[.006,2.6,.004],'trim');
 for(const y of [6.35,7.65])box([0,y,.12],[28,.018,.005],'metal');
 // Clinical cabinetry: doors, inset pulls and a worktop, not blank blocks.
 box([-13.45,3, .52],[.6,2.4,1],'white');box([-13.45,3,1.04],[.66,2.44,.035],'stone');
 for(const y of [2.2,3,3.8]){box([-13.135,y,.55],[.02,.76,.85],'wood');box([-13.10,y+.23,.82],[.035,.13,.02],'metal');}
 for(const x of [-12,-9,-5,-2,2,5]){
  box([x+1,13.235,.50],[.43,.022,.008],'metal');
  box([x+1,13.214,.63],[.13,.028,.016],'metal');
 }
 // Continuous backing connects the Blender cable-manager fingers to the rack rails.
 for(const x of [9.5,10.3,11.1])for(const dx of [-.255,.255]){
  box([x+dx,3.49,1.11],[.06,.12,1.99],'metal');
 }
 // Batch static millwork by material; added detail does not mean a draw call per tile.
 group.updateMatrixWorld(true);
 for(const material of Object.values(materials)){
  const objects=group.children.filter(o=>o.isMesh&&o.material===material);if(!objects.length)continue;
  const parts=objects.map(o=>o.geometry.clone().applyMatrix4(o.matrix));const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  for(const o of objects){o.geometry.dispose();group.remove(o);}
  const batch=new THREE.Mesh(merged,material);batch.castShadow=true;batch.receiveShadow=true;group.add(batch);
 }
 return {setVisible(value){group.visible=value;},dispose(){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.material.map){o.material.map.dispose();o.material.dispose();}}});Object.values(materials).forEach(m=>m.dispose());scene.remove(group);}};
}
