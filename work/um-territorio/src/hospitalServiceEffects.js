import * as THREE from 'three';
const paths={
 wifi:[[-1.42,3.3,1.25],[0,7.3,3.13],[0,7.3,3.23],[0,8.1,3.23],[10.3,8.1,3.23],[10.3,3.46,3.23],[10.3,3.46,1.48]],
 phone:[[-4.37,3.2,1.25],[-3.5,2.965,1.3],[-3.5,2.965,3.23],[-3.5,8.1,3.23],[10.3,8.1,3.23],[10.3,3.46,3.23],[10.3,3.46,1.22],[10.3,3.46,3.23],[10.3,8.1,3.23],[.5,8.1,3.23],[.5,2.965,3.23],[.5,2.965,1.3],[-.37,3.2,1.25]],
 fire:[[10.5,-3.55,3.4],[10.5,-5.77,3.4],[12.9,-5.77,3.4],[12.9,-5.77,1.7],[13.18,-5.60,1.7],[13.18,-5.60,3.35],[13.18,-.08,3.35],[12.30,-.08,3.35],[12.30,-.08,2.45]],
 power:[[18.6,7.64,1.9],[18.6,7.64,3.15],[17.15,7.64,3.15],[17.15,6.74,3.15],[17.15,6.74,1.4],[17.15,6.74,3.29],[17.15,8.65,3.29],[10.3,8.65,3.29],[10.3,3.49,3.29],[10.3,3.49,.3]],
 access:[[12.12,.08,1.26],[12.12,.08,3.18],[11.1,.08,3.18],[11.1,3.46,3.18],[11.1,3.46,1.6]],
};
const colors={wifi:'#8056be',phone:'#8056be',fire:'#d64032',power:'#c79238',access:'#268369'};
export function addServiceEffects(scene,xyz){
 const root=new THREE.Group();scene.add(root);const entries={};
 for(const [key,points] of Object.entries(paths)){
  const curve=new THREE.CurvePath();points.slice(1).forEach((p,i)=>curve.add(new THREE.LineCurve3(xyz(points[i]),xyz(p))));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(xyz)),new THREE.LineBasicMaterial({color:colors[key],transparent:true,opacity:.65,depthTest:true}));
  const packet=new THREE.Mesh(new THREE.SphereGeometry(.027,12,8),new THREE.MeshBasicMaterial({color:colors[key]}));root.add(line,packet);entries[key]={line,packet,curve};
 }
 const halo=new THREE.Mesh(new THREE.RingGeometry(.14,.17,48),new THREE.MeshBasicMaterial({color:colors.wifi,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.copy(xyz([0,7.3,3.11]));root.add(halo);
 const alarm=new THREE.Mesh(new THREE.BoxGeometry(.14,.045,.008),new THREE.MeshBasicMaterial({color:'#ff563d'}));alarm.position.copy(xyz([12.30,-.145,2.49]));root.add(alarm);
 const access=new THREE.Mesh(new THREE.BoxGeometry(.045,.008,.006),new THREE.MeshBasicMaterial({color:'#63efb0'}));access.position.copy(xyz([12.12,.116,1.3]));root.add(access);
 const phoneIndicators=[-4,0].map(x=>{const o=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),new THREE.MeshBasicMaterial({color:'#83e4ce'}));o.position.copy(xyz([x-.343,3.23,1.278]));root.add(o);return o;});
 const upsIndicator=new THREE.Mesh(new THREE.BoxGeometry(.25,.09,.008),new THREE.MeshBasicMaterial({color:'#d69b45'}));upsIndicator.position.copy(xyz([17.15,6.681,1.3]));root.add(upsIndicator);
 return {update(mode,elapsed,reduced){
  for(const [key,item] of Object.entries(entries)){item.line.visible=item.packet.visible=mode===key;item.packet.position.copy(item.curve.getPoint(reduced?.65:(elapsed%7500)/7500));}
  halo.visible=mode==='wifi';halo.scale.setScalar(reduced?2:1+(elapsed%3000)/1500);halo.material.opacity=reduced?.35:.55*(1-(elapsed%3000)/3000);
  // Slow visual indicator, never emergency strobing or automatic sound.
  alarm.visible=mode==='fire'&&elapsed>=2500;const glow=reduced?1:.7+.3*Math.sin(elapsed*.0015);alarm.material.color.setRGB(glow,.16*glow,.09*glow);
  access.visible=mode==='access'&&elapsed>=2500;
  phoneIndicators.forEach((o,i)=>{o.visible=mode==='phone'&&elapsed>=i*2500;});upsIndicator.visible=mode==='power'&&elapsed>=2500;
 },dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.remove(root);}};
}
