import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTORS,sectorRoutes} from '../src/sectorScenes.js';
for(const [name,scene] of Object.entries(SECTORS)){
 test(`${name}: seven systems, unique terminals and finite camera coordinates`,()=>{
  assert.equal(new Set(scene.points.map(p=>p.id)).size,scene.points.length);
  assert.equal(new Set(scene.points.map(p=>p.system)).size,7);
  for(const p of scene.points){assert.ok(p.why.length>15);assert.ok(p.p.every(Number.isFinite));}
  for(const s of scene.stops)for(const p of [s.camera,s.target])assert.ok(p.length===3&&p.every(Number.isFinite));
 });
 test(`${name}: all illustrated branches reach their named device`,()=>{
  for(const route of sectorRoutes(scene)){
   assert.deepEqual(route.points.at(-1),scene.points.find(p=>p.id===route.id).p);
   assert.ok(scene.points.some(p=>JSON.stringify(p.p)===JSON.stringify(route.points[0])));
   for(let i=1;i<route.points.length;i++)assert.ok(route.points[i].filter((v,j)=>v!==route.points[i-1][j]).length<=1);
  }
 });
}
