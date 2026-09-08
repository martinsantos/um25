import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAt,sampleTelemetry,INSPECTION_POINTS} from '../src/hospitalInspection.js';
test('picking resolves rack fibre, separated recorder and power room',()=>{
 for(const id of ['ODF-01','NVR-01','UPS-01']){const p=INSPECTION_POINTS.find(a=>a.id===id);assert.equal(inspectAt(p.system,p.p).id,id);}
 assert.equal(inspectAt('Data',[0,0,0]).kind,'link');
});
test('telemetry uses domain units and paused traffic is zero',()=>{
 const data={system:'Data',kind:'fiber'};assert.match(sampleTelemetry(data,0)[0][1],/Gb\/s/);assert.equal(sampleTelemetry(data,3,false)[1][1],'0 Mb/s');
 const power={system:'Power'};assert.equal(sampleTelemetry(power)[0][1],'230 V AC');assert.equal(sampleTelemetry(power)[1][1],'50 Hz');
 assert.equal(sampleTelemetry({system:'Telecom',kind:'phone'})[0][1],'SIP / RTP');
});
