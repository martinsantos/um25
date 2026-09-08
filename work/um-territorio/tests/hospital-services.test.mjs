import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {DEMOS,demoStep} from '../src/hospitalServiceDemos.js';
import {STOPS,LAYERS} from '../src/hospitalJourney.js';
import {addServiceEffects} from '../src/hospitalServiceEffects.js';
import {createWorkstationDisplay} from '../src/workstationDisplay.js';
test('six demonstrations use real stops, existing layers and bounded event stages',()=>{
 assert.equal(Object.keys(DEMOS).length,6);
 for(const d of Object.values(DEMOS)){assert.ok(STOPS.some(s=>s.name===d.stop));assert.ok(LAYERS.some(l=>l[0]===d.layer));assert.equal(d.steps.length,3);}
 assert.deepEqual([-2,0,2499,2500,5000,100000].map(demoStep),[0,0,0,1,2,2]);
});
test('only selected service effects are visible, reduced motion is stable and all resources dispose',()=>{
 const scene=new THREE.Scene(),fx=addServiceEffects(scene,([x,y,z])=>new THREE.Vector3(x,z,-y));
 fx.update('',0,false);assert.ok(scene.children[0].children.every(o=>!o.visible));
 fx.update('wifi',1000,true);const objects=scene.children[0].children.filter(o=>o.visible);assert.equal(objects.length,3);
 const positions=objects.map(o=>o.position.toArray());fx.update('wifi',6500,true);assert.deepEqual(objects.map(o=>o.position.toArray()),positions);
 fx.update('fiber',3000,false);assert.equal(scene.children[0].children.filter(o=>o.visible).length,3);
 let disposed=0;scene.children[0].traverse(o=>o.geometry?.addEventListener('dispose',()=>disposed++));fx.dispose();assert.equal(scene.children.length,0);assert.ok(disposed>=10);
});
test('operator screen shows DEMO event changes even with reduced motion',()=>{
 const old=globalThis.document,labels=[];const ctx={fillRect(){},fillText(t){labels.push(t);},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
 globalThis.document={createElement:()=>({getContext:()=>ctx})};
 try{const d=createWorkstationDisplay();d.update(1000,true,'fire',2);assert.ok(labels.some(t=>t.includes('CT-01 / Evento de prueba')));d.dispose();}finally{globalThis.document=old;}
});
