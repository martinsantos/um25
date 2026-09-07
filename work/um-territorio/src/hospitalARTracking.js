import * as THREE from 'three';
import {INSPECTION_POINTS} from './hospitalInspection.js';
import {chooseLabels} from './hospitalARData.js';
const xyz=p=>new THREE.Vector3(p[0],p[2],-p[1]);
export function createARTracking(camera,getOccluders,onUpdate,inspectionPoints=INSPECTION_POINTS){
 const previousPosition=new THREE.Vector3(),previousRotation=new THREE.Quaternion(),ray=new THREE.Raycaster();let lastMotion=0,lastCheck=0,shown=false;
 return {update(ms,{width,height,layer,playing,enabled,hover}){
  const moved=previousPosition.distanceToSquared(camera.position)>.00001||previousRotation.angleTo(camera.quaternion)>.0005;
  if(moved||playing){lastMotion=ms;previousPosition.copy(camera.position);previousRotation.copy(camera.quaternion);if(shown){onUpdate([],false);shown=false;}}
  if(ms-lastCheck<350)return;lastCheck=ms;
  if(!enabled||ms-lastMotion<750){if(shown)onUpdate([],false);shown=false;return;}
  camera.updateMatrixWorld();const candidates=[];
  const source=hover?[{...hover.asset,p:hover.p},...inspectionPoints.filter(a=>a.id!==hover.asset.id)]:inspectionPoints;
  for(const asset of source){if(layer!=='all'&&layer!==asset.system)continue;const world=xyz(asset.p),ndc=world.clone().project(camera);if(ndc.z<0||ndc.z>1||Math.abs(ndc.x)>.93||Math.abs(ndc.y)>.90)continue;
   candidates.push({asset,x:(ndc.x+1)*width/2,y:(1-ndc.y)*height/2,world,priority:asset.id===hover?.asset.id?-100:world.distanceTo(camera.position)});
  }
  candidates.sort((a,b)=>a.priority-b.priority);const visible=[],occluders=getOccluders();
  for(const a of candidates.slice(0,10)){
   const distance=camera.position.distanceTo(a.world);ray.set(camera.position,a.world.clone().sub(camera.position).normalize());ray.far=Math.max(0,distance-.30);
   if(ray.intersectObjects(occluders,false).length)continue;visible.push(a);
  }
  const distinct=layer==='all'?visible.filter((v,i,a)=>a.findIndex(q=>q.asset.system===v.asset.system)===i):visible;
  onUpdate(chooseLabels(distinct,width,height,width<650?1:3),true);shown=true;
 }};
}
