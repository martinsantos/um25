// Reuse Hairline's MIT geometry and lifecycle with UM's detailed application.
// The upstream source and published v5 bundle remain immutable.
import fs from 'node:fs';
import {build} from 'esbuild';
const outline=(x0,y0,x1,y1)=>[[[x0,y0],[x1,y0]],[[x1,y0],[x1,y1]],[[x1,y1],[x0,y1]],[[x0,y1],[x0,y0]]];
const layers=[
 {name:'surface',r:[0,0,132,96],rad:7,segs:[[[1.5,12],[130.5,12]],...outline(42,4,105,9),[[47,6.5],[91,6.5]],...outline(111,4,117,9),...outline(121,4,127,9)],dots:[[7,6],[13,6],[19,6]]},
 {name:'sidebar',r:[5,17,38,91],rad:4,segs:[...outline(8,20,35,29),...[24,36,48,60,72].flatMap(y=>[...outline(10,y-1.5,13,y+1.5),[[17,y],[31,y]],[[17,y+3],[26,y+3]]]),[[9,81],[34,81]],...outline(10,84,14,88),[[18,86],[30,86]]]},
 {name:'card',r:[45,18,126,90],rad:5,segs:[[[51,25],[84,25]],[[51,29],[106,29]],...outline(111,23,120,28),...[51,76,101].flatMap(x=>[...outline(x,34,x+19,47),[[x+3,38],[x+13,38]],[[x+3,43],[x+9,43]]]),...outline(51,52,120,83),[[51,59],[120,59]],[[70,52],[70,83]],[[102,52],[102,83]],...[64,72,79].flatMap(y=>[[[55,y],[65,y]],[[75,y],[96,y]],[[107,y],[116,y]]])]},
 {name:'popover',r:[82,54,128,92],rad:4,segs:[[[88,61],[112,61]],...outline(88,66,121,73),[[91,69.5],[114,69.5]],[[88,78],[113,78]],[[88,82],[106,82]],...outline(88,85,97,89),...outline(102,85,121,89)],sel:[102,85,121,89]}
];
let source=fs.readFileSync('scripts/cine/vendor/hairline-v5-source.js','utf8');
function replaceOnce(before,after){if(source.split(before).length!==2)throw new Error('Hairline source does not match the reviewed v5 version.');source=source.replace(before,after);}
const begin=source.indexOf('var LAY = ['),end=source.indexOf('var REST3 = 0.18;',begin);
if(begin<0||end<begin)throw new Error('Missing application geometry.');
source=source.slice(0,begin)+'var LAY = '+JSON.stringify(layers)+';\n'+source.slice(end);
replaceOnce('const e = spring(REST3, { eps: 2e-3 });','const e = spring(Math.max(REST3, Math.min(1, options.expansion ?? REST3)), { eps: 2e-3, k: 60, c: 16 });');
replaceOnce('const C = Cam(45, 0.5, 1.42);\n  fit(C, [[0, 0, 0], [132, 96, 0], [132, 0, 0], [0, 96, 0], [0, 0, 3 * 34 + TK], [132, 0, 3 * 34 + TK]], 180, 166);',`const C = Cam(45, 1 / Math.sqrt(3), 1.85);
  const reframe = () => fit(C, LAY.flatMap((layer, i) => {const [x0,y0,x1,y1]=layer.r,z=i*GAP4*e.x;return [[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z+TK]];}), 200, 160);
  reframe();`);
replaceOnce('const m = stepS(e, dt), z = (i) => i * GAP4 * e.x;','const m = stepS(e, dt), z = (i) => i * GAP4 * e.x;\n    reframe();');
replaceOnce('return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 320];',`const scale=Math.min(r.width/400,r.height/320),left=(r.width-400*scale)/2,top=(r.height-320*scale)/2;
    return [(e.clientX-r.left-left)/scale,(e.clientY-r.top-top)/scale];`);
await build({entryPoints:['scripts/cine/vendor/hairline-v5-entry.js'],bundle:true,minify:true,format:'esm',outfile:'public/cine/hairline-v7.js',plugins:[{name:'um-application-v7',setup(builder){builder.onLoad({filter:/hairline-v5-source\.js$/},()=>({contents:source,loader:'js'}));}}],banner:{js:'/* Hairline 0.2.0, MIT; lucasmarkes/hairline. UM application geometry, equal-axis projection and framing. See LICENSE-hairline-v5.txt. */'}});
