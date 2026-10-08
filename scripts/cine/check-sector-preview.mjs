import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.argv[2]||'http://127.0.0.1:4326';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const sectors=['constructoras','bodegas','salud','aeropuertos','industria','mineria'];
const reports=[];
for(const sector of sectors){
 const started=Date.now();
 const response=await fetch(`${origin}/${sector}`,{signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,sector);
 // Reading the complete body catches errors after SSR already sent an HTTP 200.
 const html=await response.text();
 assert.match(html,/<\/html>/,`${sector}: incomplete SSR stream`);
 assert.equal((html.match(/data-atlas-project\s/g)||[]).length,1,`${sector}: persistent project`);
 assert.ok(!html.includes('Los ocho frentes en'),`${sector}: repeated movie rail`);
 assert.ok(!html.includes('src="/3d/cinema.html"'),`${sector}: obsolete auto WebGL`);
 assert.ok(html.includes('/cine/service-atlas-v11.js'),`${sector}: active controller`);
 reports.push({sector,status:response.status,bytes:Buffer.byteLength(html),elapsedMs:Date.now()-started});
}
console.log(JSON.stringify({verifiedAt:new Date().toISOString(),completeSSR:true,reports},null,2));
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(reports,null,2));
