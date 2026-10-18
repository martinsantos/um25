import * as THREE from 'three';
// One selected camera only. A schematic viewing volume, not an optical survey.
export function createCameraCoverage(scene){
 const group=new THREE.Group();scene.add(group);let current='';
 const clear=()=>{for(const o of [...group.children]){o.geometry.dispose();o.material.dispose();group.remove(o);}};
 return {update(asset){
  const id=asset?.kind==='camera'?asset.id:'';if(id===current)return;current=id;clear();if(!id)return;
  const origin=new THREE.Vector3(asset.p[0],asset.p[2],-asset.p[1]);
  const points=[[-2,-1.5,4],[2,-1.5,4],[2,1,4],[-2,1,4]].map(p=>new THREE.Vector3(...p).add(origin));
  const vertices=[];for(let i=0;i<4;i++)vertices.push(...origin.toArray(),...points[i].toArray(),...points[(i+1)%4].toArray());
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xcf528a,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false})));
  const edges=[];for(let i=0;i<4;i++)edges.push(origin,points[i],points[i],points[(i+1)%4]);group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges),new THREE.LineBasicMaterial({color:0xcf528a,transparent:true,opacity:.65})));
 },dispose(){clear();group.removeFromParent();}};
}
