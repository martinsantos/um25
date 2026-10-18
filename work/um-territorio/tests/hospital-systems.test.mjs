import test from 'node:test';
import assert from 'node:assert/strict';
import {NETWORKS,SYSTEM_STYLE,uniqueSegments,DATA_TERMINALS} from '../src/hospitalSystems.js';
import {readFileSync} from 'node:fs';
test('Blender mounting manifest matches the live routes and every data outlet has an equipment connection',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../work/blender/sectors/hospital-network.json',import.meta.url)));
 assert.deepEqual(manifest.networks,NETWORKS);
 assert.equal(DATA_TERMINALS.filter(t=>t.mount==='wall').length,6);
 assert.equal(DATA_TERMINALS.filter(t=>t.mount==='post').length,4);
 for(const t of DATA_TERMINALS){assert.equal(t.patch.length,3);assert.notDeepEqual(t.patch,t.end);}
 for(const r of NETWORKS.Data.filter(r=>r.mount==='wall'))assert.equal(r.points.at(-2)[1],15.72);
});
test('every illustrated endpoint has an unbroken orthogonal source route',()=>{
 let count=0;
 for(const routes of Object.values(NETWORKS))for(const {source,end,points} of routes){
  assert.deepEqual(points[0],source);assert.deepEqual(points.at(-1),end);
  for(let i=1;i<points.length;i++)assert.equal(points[i].filter((v,k)=>v!==points[i-1][k]).length,1);
  count++;
 }
 assert.equal(count,57);assert.equal(NETWORKS.CCTV.length,5);assert.equal(NETWORKS.Security.length,3);
});
test('system identities have distinct colors and non-color codes',()=>{
 assert.equal(new Set(Object.values(SYSTEM_STYLE).map(s=>s.color)).size,7);
 assert.equal(new Set(Object.values(SYSTEM_STYLE).map(s=>s.code)).size,7);
});
test('deduplication preserves endpoints and drops identical shared edges',()=>{
 const routes=NETWORKS.Data,segments=uniqueSegments(routes);
 assert.ok(segments.length<routes.reduce((n,r)=>n+r.points.length-1,0));
 for(const {end} of routes)assert.ok(segments.some(s=>s.some(p=>p.every((v,k)=>v===end[k]))));
});
