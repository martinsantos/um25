import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createARTracking} from '../src/hospitalARTracking.js';

function fixture(occluders=[]){
 const camera=new THREE.PerspectiveCamera(60,1.5,.1,100);
 camera.position.set(0,1,5);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 const updates=[];
 const point={id:'TEST-AIRPORT-AP',system:'Telecom',p:[0,0,1]};
 const tracker=createARTracking(camera,()=>occluders,(labels,settled)=>updates.push({labels,settled}),[point]);
 const update=(ms,extra={})=>tracker.update(ms,{width:1000,height:650,layer:'all',playing:false,enabled:true,...extra});
 return {camera,updates,update};
}
test('AR can use a sector inventory without leaking hospital devices',()=>{
 const f=fixture();f.update(400);assert.equal(f.updates.length,0);f.update(1200);
 assert.deepEqual(f.updates.at(-1).labels.map(a=>a.asset.id),['TEST-AIRPORT-AP']);
 f.camera.position.x=1;f.update(1600);assert.equal(f.updates.at(-1).settled,false);
 f.update(2400);assert.equal(f.updates.at(-1).settled,true);
 f.update(2800,{enabled:false});assert.equal(f.updates.at(-1).labels.length,0);
});
test('an opaque wall hides a device label; a different system filter excludes it',()=>{
 const wall=new THREE.Mesh(new THREE.BoxGeometry(3,3,.2),new THREE.MeshBasicMaterial());
 wall.position.set(0,1,2);wall.updateMatrixWorld();
 const f=fixture([wall]);f.update(400);f.update(1200);assert.equal(f.updates.at(-1).labels.length,0);
 wall.geometry.dispose();wall.material.dispose();
 const g=fixture();g.update(400);g.update(1200,{layer:'Data'});assert.equal(g.updates.at(-1).labels.length,0);
});
