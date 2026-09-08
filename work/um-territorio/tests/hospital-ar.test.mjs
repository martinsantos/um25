import test from 'node:test';
import assert from 'node:assert/strict';
import {SERVICE_STORIES,flowSummary,chooseLabels} from '../src/hospitalARData.js';
import {SYSTEM_STYLE} from '../src/hospitalSystems.js';
test('every system has a didactic story and a distinct glyph',()=>{
 for(const key of Object.keys(SYSTEM_STYLE)){const s=SERVICE_STORIES[key];assert.ok(s.why.length>30);assert.match(s.um,/Última Milla/);assert.equal(s.chain.length,3);}
 assert.equal(new Set(Object.values(SERVICE_STORIES).map(s=>s.icon)).size,7);
});
test('traffic volumes integrate Mb/s into MB while power stays in amperes',()=>{
 const f=flowSummary({system:'Data'},60,true);assert.equal(f.samples.length,31);assert.ok(Number(f.total)>800);assert.match(f.totalLabel,/MB/);
 const off=flowSummary({system:'Data'},60,false);assert.equal(off.total,f.total);assert.deepEqual(off.samples,f.samples);
 const power=flowSummary({system:'Power'},60,true);assert.equal(power.unit,'A');assert.doesNotMatch(power.totalLabel,/MB/);
});
test('AR labels reserve toolbar and avoid overlapping one another',()=>{
 const result=chooseLabels([{x:250,y:300},{x:260,y:310},{x:650,y:300}],1000,600);
 assert.equal(result.length,2);assert.ok(result.every(p=>p.y>=210));
});
