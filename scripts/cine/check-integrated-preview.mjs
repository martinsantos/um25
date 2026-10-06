import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.argv[2]||'http://127.0.0.1:4326';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const sectors=['constructoras','bodegas','salud','aeropuertos','industria','mineria','gobiernosectorpublico','seguridad-electronica','software'];
const servicePaths=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(match=>match[1]);
assert.equal(servicePaths.length,8);
const routes=['/','/servicios','/sectores',...sectors.map(s=>'/'+s),...servicePaths],reports=[];
for(const route of routes){
 const response=await fetch(origin+route,{signal:AbortSignal.timeout(20000)}),html=await response.text();
 assert.equal(response.status,200,route);assert.match(html,/<\/html>/,route+': incomplete SSR stream');
 assert.match(html,/<h1[^>]*>/,route+': page heading');
 assert.ok(!html.includes('data-scene-rail'),route+': obsolete repeated movie rail');
 assert.ok(!html.includes('src="/3d/cinema.html"'),route+': obsolete automatic WebGL');
 if(route!=='/sectores'){
  assert.equal((html.match(/data-atlas-project\s/g)||[]).length,1,route+': one persistent service project');
  assert.ok(html.includes('/cine/service-atlas-v12.js'),route+': autonomous service story');
  if(!route.startsWith('/servicios/'))assert.match(html,/data-story-loop="true"/,route+': continuous service journey');
 }
 else assert.match(html,/data-sector-atlas/,route+': sector journey');
 assert.ok(html.includes('/cine/cine-banner-v8.js'),route+': active cinema player');
 if(process.argv.includes('--movies')){
  const scenes=[...html.matchAll(/data-scenes="([^"]+)"/g)].flatMap(m=>m[1].split(','));
  assert.ok(scenes.length>0,route+': movie playlist');
  assert.match(html,/data-motion="auto"/,route+': completed cinema enabled');
  if(route==='/'){
   assert.deepEqual(scenes,['bodega','fachada','aeropuerto','hospital','planta'],route+': original whole-project Blender cinema');
   assert.match(html,/data-framing="cover"/,route+': immersive home movie');
  }else for(const scene of scenes)assert.match(scene,/proyecto-v[23]$/,route+': new cinema '+scene);
  for(const scene of scenes)assert.ok(fs.existsSync('public/cine/media/cine-'+scene+'.mp4'),route+': completed movie '+scene);
 }
 reports.push({route,status:response.status,bytes:Buffer.byteLength(html)});
}
console.log(JSON.stringify({completeSSR:true,pages:reports.length,reports},null,2));
