// Native-speed visual evidence from a disposable CI copy, never the user's Mac.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const profile=process.env.VISUAL_AUDIT_PROFILE||'desktop',out=process.env.VISUAL_AUDIT_DIR;
assert(out&&path.isAbsolute(out));fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:4326';
const route=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/101\/[^']+)'/g)][0][1];
const browser=await chromium.launch({channel:'chrome',headless:true});
const viewport=profile==='mobile'?{width:390,height:844}:{width:1440,height:1000};
const context=await browser.newContext({viewport,recordVideo:{dir:path.join(out,'motion'),size:viewport},reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={commit:process.env.GITHUB_SHA,profile,route,states:[],errors,clock:'Real browser timing; no acceleration; no clicks before the full sequence'};
try{
 await page.goto(origin+route,{waitUntil:'networkidle'});
 const theater=page.locator('[data-atlas-theater]');
 await theater.evaluate(el=>{scrollTo(0,el.getBoundingClientRect().top+scrollY-110);});
 await page.waitForFunction(()=>document.querySelector('[data-service-atlas]').dataset.storyState==='playing');
 for(const stage of [-1,0,1,2,3,4,5,6]){
  await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:15000});
  await delay(stage===-1?500:2700);
  const state=await page.locator('[data-discipline-system]').evaluate(el=>({stage:el.dataset.disciplineStage,framing:el.dataset.precisionFraming,bound:el.dataset.precisionBound,door:el.querySelector('.pn-door')?.getAttribute('transform'),drawer:el.querySelector('.pn-switch-drawer')?.getAttribute('transform'),size:el.getBoundingClientRect().toJSON(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.equal(state.bound,'true');assert.equal(state.scrollWidth,state.width);report.states.push(state);
  await page.screenshot({path:path.join(out,`precision-${stage}-viewport.png`)});
  await theater.screenshot({path:path.join(out,`precision-${stage}-drawing.png`),animations:'allow'});
 }
 // Pausing and leaving the viewport must stop physical interpolation too.
 await page.locator('[data-atlas-play]').click();
 const a=await page.locator('.pn-door').getAttribute('transform');await delay(800);
 assert.equal(await page.locator('.pn-door').getAttribute('transform'),a);
 report.pauseVerified=true;
 assert.equal(errors.length,0);
 await page.screenshot({path:path.join(out,'precision-page.png'),fullPage:true});
 // A sector must show its own installation, then the mechanism, then return.
 report.context=[];
 for(const check of ['/bodegas','/constructoras','/']){
  await page.goto(origin+check,{waitUntil:'domcontentloaded'});
  await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-110));
  const stages=check==='/'?[-1,3]:[-1,3,6];
  for(const stage of stages){
   await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:12000});await delay(2700);
   const state=await page.locator('[data-service-atlas]').evaluate(root=>({code:root.dataset.activeService,stage:root.querySelector('[data-discipline-system]').dataset.disciplineStage,discipline:root.dataset.disciplineActive,height:root.querySelector('[data-atlas-theater]').getBoundingClientRect().height,context:root.querySelector('[data-atlas-context]').textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.equal(state.discipline,String(check==='/'||stage===3));assert.equal(state.width,state.scrollWidth);
   report.context.push({route:check,...state});
   await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`context-${check.replaceAll('/','')||'home'}-${stage}.png`),animations:'allow'});
  }
  await page.waitForFunction(()=>document.querySelector('[data-service-atlas]').dataset.activeService!=='101',null,{timeout:12000});
  assert.equal(new Set(report.context.filter(s=>s.route===check).map(s=>s.height)).size,1,'Theater height must stay stable across context and mechanism');
 }
 // Each remaining discipline renders its authored geometry on first arrival.
 report.services=[];
 for(const code of ['102','103','105','106','107','108']){
  const href=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(m=>m[1]).find(href=>href.startsWith('/servicios/'+code+'/'));
  await page.goto(origin+href,{waitUntil:'domcontentloaded'});
  await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-110));
  await page.waitForFunction(()=>document.querySelector('[data-discipline-system]').dataset.disciplineStage==='0',null,{timeout:12000});await delay(2200);
  const state=await page.locator('[data-service-atlas]').evaluate(root=>({code:root.dataset.activeService,stage:root.querySelector('[data-discipline-system]').dataset.disciplineStage,stroke:root.querySelector('[data-discipline-drawing="'+root.dataset.activeService+'"] [stroke]')?.getAttribute('stroke'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.equal(state.width,state.scrollWidth);report.services.push(state);
  await page.screenshot({path:path.join(out,`service-${code}-viewport.png`)});
  await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`service-${code}-drawing.png`),animations:'allow'});
 }
 // The six software planes must expose their full contents by themselves.
 const softwareRoute=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/104\/[^']+)'/g)][0][1];
 await page.goto(origin+softwareRoute,{waitUntil:'domcontentloaded'});
 await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-100));
 report.software=[];
 for(const stage of [-1,0,1,2,3,4,5,6]){
  await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:15000});await delay(2700);
  const state=await page.locator('.ps-drawing').evaluate(el=>{
   const root=el.closest('[data-discipline-system]'),stage=Number(root.dataset.disciplineStage),svg=root.querySelector('svg'),active=el.querySelector('[data-discipline-node="'+stage+'"]');
   return {stage,viewBox:svg.getAttribute('viewBox'),frame:svg.getBoundingClientRect().toJSON(),active:active?.getBoundingClientRect().toJSON(),planes:[...el.querySelectorAll('.ps-layer')].map(layer=>({layer:layer.dataset.disciplineNode,transform:getComputedStyle(layer).transform})),width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });
  report.software.push(state);
  await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`precision-software-${stage}.png`),animations:'allow'});
  assert.equal(state.width,state.scrollWidth);
  if(state.active){const a=state.active,f=state.frame;assert(a.left>=f.left+2&&a.right<=f.right-2&&a.top>=f.top+2&&a.bottom<=f.bottom-2,'Software layer clipped: '+JSON.stringify(state));}
 }
 const reduced=await browser.newContext({viewport,reducedMotion:'reduce'}),quiet=await reduced.newPage();
 await quiet.goto(origin+route,{waitUntil:'domcontentloaded'});await delay(700);
 report.reduced=await quiet.locator('[data-service-atlas]').getAttribute('data-story-state');
 assert.equal(errors.length,0);assert.equal(report.reduced,'paused');await quiet.locator('[data-atlas-theater]').screenshot({path:path.join(out,'precision-reduced.png')});await reduced.close();
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'precision-report.json'),JSON.stringify(report,null,2));await context.close();await browser.close();}
console.log(JSON.stringify(report,null,2));
