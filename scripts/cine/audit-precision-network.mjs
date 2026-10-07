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
  const state=await page.locator('[data-discipline-system]').evaluate(el=>({stage:el.dataset.disciplineStage,bound:el.dataset.precisionBound,door:el.querySelector('.pn-door')?.getAttribute('transform'),drawer:el.querySelector('.pn-switch-drawer')?.getAttribute('transform'),size:el.getBoundingClientRect().toJSON(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
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
 // All service-family mounts use the same authored asset, including home/sector.
 for(const check of ['/','/bodegas','/constructoras']){
  await page.goto(origin+check,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.pn-drawing').count(),1,check);
 }
 const reduced=await browser.newContext({viewport,reducedMotion:'reduce'}),quiet=await reduced.newPage();
 await quiet.goto(origin+route,{waitUntil:'domcontentloaded'});await delay(700);
 report.reduced=await quiet.locator('[data-service-atlas]').getAttribute('data-story-state');
 assert.equal(report.reduced,'paused');await quiet.locator('[data-atlas-theater]').screenshot({path:path.join(out,'precision-reduced.png')});await reduced.close();
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'precision-report.json'),JSON.stringify(report,null,2));await context.close();await browser.close();}
console.log(JSON.stringify(report,null,2));
