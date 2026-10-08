import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.VISUAL_ENGINE||'Chrome',width=Number(process.env.VISUAL_WIDTH)||1440;
const root=process.env.VISUAL_AUDIT_DIR;assert(root&&path.isAbsolute(root));
const out=path.join(root,engine);fs.mkdirSync(out,{recursive:true});
const browser=await(engine==='Chrome'?chromium:webkit).launch(engine==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
const routes=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(m=>m[1]);
const codes=['102','103','104','105','106','108'].filter(code=>!process.env.CAMERA_SERVICE_CODE||process.env.CAMERA_SERVICE_CODE==='all'||process.env.CAMERA_SERVICE_CODE===code);assert(codes.length);
const report={engine,width,states:[],reduced:[],errors:[],findings:[]};
function save(){fs.writeFileSync(path.join(out,'layer-camera-report.json'),JSON.stringify(report,null,2));}
async function measure(page,code,stage){
 return page.locator('[data-discipline-system]').evaluate((root,{code,stage})=>{
  const frame=root.querySelector('svg').getBoundingClientRect(),drawing=root.querySelector(`[data-discipline-drawing="${code}"]`);
  const rect=b=>({left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height});
  const nodes=stage===-1?[...drawing.querySelectorAll(code==='104'?'.ps-layer':'.ds-cover,.ds-door')]:[...drawing.querySelectorAll(`[data-discipline-node="${stage}"]`)];
  return {stage,view:root.querySelector('svg').getAttribute('viewBox'),frame:rect(frame),nodes:nodes.map(n=>rect(n.getBoundingClientRect())),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clock:root.closest('[data-service-atlas]').dataset.storyState,framing:code==='104'?(stage<0||stage===6?'overview':root.dataset.cameraFraming):root.dataset.layerCameraFraming};
 },{code,stage});
}
function inspect(code,state){
 if(state.width!==state.scrollWidth||(code==='104'?!['measured','overview'].includes(state.framing):state.framing!=='swept'))report.findings.push({code,state,message:'Invalid viewport or missing measured camera'});
 for(const n of state.nodes){if(n.width>0&&n.height>0&&(n.left<state.frame.left+2||n.right>state.frame.right-2||n.top<state.frame.top+2||n.bottom>state.frame.bottom-2))report.findings.push({code,state,message:'The active component or opening cover leaves the drawing frame'});}
}
try{
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 for(const code of codes){
  await page.goto('http://127.0.0.1:4326'+routes.find(r=>r.startsWith('/servicios/'+code+'/')),{waitUntil:'domcontentloaded'});
  await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-100));
  for(const stage of [0,1,2,3,4,5,6]){
   await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:16000});
   await page.waitForTimeout(2700);
   const state=await measure(page,code,stage);report.states.push({code,...state});inspect(code,state);
   await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`${code}-${stage}.png`),animations:'allow'});save();
   if(code==='104'&&stage===2){
    await page.locator('[data-atlas-play]').click();await page.waitForTimeout(150);
    const paused=await page.locator('.ps-drawing').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState!=='finished').map(a=>({time:a.currentTime,state:a.playState})));
    await page.waitForTimeout(700);
    const after=await page.locator('.ps-drawing').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState!=='finished').map(a=>({time:a.currentTime,state:a.playState})));
    assert(paused.length>0,'The integration must animate its information flow');
    assert.deepEqual(after,paused,'Pause must stop inner software states as well as the camera');
    assert(after.every(a=>a.state==='paused'));report.softwarePause={animations:after.length,stable:true};
    await page.locator('[data-atlas-play]').click();
   }
  }
 }
 await context.close();
 const quiet=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),pageQuiet=await quiet.newPage();pageQuiet.on('pageerror',e=>report.errors.push(e.message));
 for(const code of codes){
  await pageQuiet.goto('http://127.0.0.1:4326'+routes.find(r=>r.startsWith('/servicios/'+code+'/')),{waitUntil:'domcontentloaded'});
  await pageQuiet.locator('[data-atlas-theater]').scrollIntoViewIfNeeded();await pageQuiet.waitForTimeout(500);
  const state=await measure(pageQuiet,code,-1);report.reduced.push({code,...state});inspect(code,state);assert.equal(state.clock,'paused');
  await pageQuiet.locator('[data-atlas-theater]').screenshot({path:path.join(out,`${code}-reduced.png`)});
 }
 assert.equal(report.errors.length,0);await quiet.close();
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{save();await browser.close();}
console.log(JSON.stringify({engine,width,states:report.states.length,findings:report.findings.length,errors:report.errors.length,failure:report.failure}));if(report.findings.length)process.exitCode=1;
