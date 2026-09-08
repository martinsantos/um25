import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFreeNavigation} from '../src/hospitalFreeNavigation.js';
import {HOSPITAL_ASSETS} from '../src/hospitalAssets.js';
import {STOPS,LAYERS} from '../src/hospitalJourney.js';
test('free camera rotates past 360 and translates independently with bounded altitude',()=>{
 const c=new THREE.PerspectiveCamera();c.position.set(0,2,0);const f=createFreeNavigation(c);f.capture();f.rotate(2000,0);assert.ok(Math.abs(f.yaw)>Math.PI*2);
 const before=c.position.clone();f.keys.add('w');f.update(1);assert.ok(c.position.distanceTo(before)>2);f.clear();const stopped=c.position.clone();f.update(1);assert.deepEqual(c.position.toArray(),stopped.toArray());
 f.pan(0,-100);assert.equal(c.position.y,.25);f.pan(0,100);assert.equal(c.position.y,35);
});
test('all asset inspection links resolve to existing stops and systems',()=>{
 assert.equal(new Set(HOSPITAL_ASSETS.map(a=>a.id)).size,9);
 for(const a of HOSPITAL_ASSETS){assert.ok(STOPS.some(s=>s.name===a.stop));assert.ok(LAYERS.some(l=>l[0]===a.layer));}
});
