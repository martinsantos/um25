import * as THREE from 'three';
// Free inspection, not a clinical circulation simulator. No pointer lock.
export function createFreeNavigation(camera){
 const keys=new Set(),rotation=new THREE.Euler(0,0,0,'YXZ');let active=false;
 const orient=()=>{rotation.x=THREE.MathUtils.clamp(rotation.x,-Math.PI*.49,Math.PI*.49);camera.quaternion.setFromEuler(rotation);};
 const bound=()=>{camera.position.x=THREE.MathUtils.clamp(camera.position.x,-60,60);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-60,60);camera.position.y=THREE.MathUtils.clamp(camera.position.y,.25,35);};
 function capture(){rotation.setFromQuaternion(camera.quaternion,'YXZ');active=true;keys.clear();}
 function move(x,y,z){const v=new THREE.Vector3(x,0,z).applyQuaternion(camera.quaternion);v.y+=y;camera.position.add(v);bound();}
 return {capture,keys,rotate(dx,dy){if(!active)capture();rotation.y-=dx*.004;rotation.x-=dy*.003;orient();},dolly(d){move(0,0,d);},pan(dx,dy){move(dx,dy,0);},
  update(dt){const n=Number;const x=n(keys.has('d'))-n(keys.has('a')),z=n(keys.has('s')||keys.has('arrowdown'))-n(keys.has('w')||keys.has('arrowup')),y=n(keys.has('e'))-n(keys.has('q'));
   const length=Math.hypot(x,y,z)||1,speed=keys.has('shift')?6:2.2;move(x/length*dt*speed,y/length*dt*speed,z/length*dt*speed);
   rotation.y+=(n(keys.has('arrowleft'))-n(keys.has('arrowright')))*dt;orient();
  },clear(){keys.clear();},get yaw(){return rotation.y;},get pitch(){return rotation.x;}};
}
