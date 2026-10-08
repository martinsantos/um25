import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;assert(out&&path.isAbsolute(out));
const routes=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(m=>m[1]);
const browser=await webkit.launch({headless:true}),report={engine:'WebKit on disposable Linux runner',layouts:[],motion:[],errors:[]};
try{
 for(const width of [1440,1280,834,390,360]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  for(const code of ['101','104']){
   await page.goto('http://127.0.0.1:4326'+routes.find(route=>route.startsWith('/servicios/'+code+'/')),{waitUntil:'domcontentloaded'});
   const theater=page.locator('[data-atlas-theater]');await theater.scrollIntoViewIfNeeded();await page.waitForTimeout(500);
   const state=await page.locator('[data-service-atlas]').evaluate(root=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clock:root.dataset.storyState,code:root.dataset.activeService,svgWidth:root.querySelector('[data-discipline-system] svg').getBoundingClientRect().width}));
   assert.equal(state.width,state.scrollWidth);assert.equal(state.clock,'paused');assert(state.svgWidth>0);report.layouts.push(state);
   await theater.screenshot({path:path.join(out,`precision-webkit-${width}-${code}.png`)});
  }
  await context.close();
 }
 for(const [width,code,stage] of [[390,'101',3],[1440,'104',1]]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4326'+routes.find(route=>route.startsWith('/servicios/'+code+'/')),{waitUntil:'domcontentloaded'});
  await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-100));
  await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:45000});await page.waitForTimeout(2700);
  const state=await page.locator('[data-discipline-system]').evaluate(el=>({stage:el.dataset.disciplineStage,framing:el.dataset.precisionFraming,door:el.querySelector('.pn-door')?.getAttribute('transform'),plane:getComputedStyle(el.querySelector('.ps-layer[data-discipline-node="1"]')||el).transform,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.equal(state.width,state.scrollWidth);if(code==='101')assert.equal(state.framing,'measured');else assert.notEqual(state.plane,'matrix(1, 0, 0, 1, 0, 0)');
  report.motion.push({code,...state});await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`precision-webkit-motion-${code}.png`),animations:'allow'});
  await context.close();
 }
 assert.equal(report.errors.length,0);
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'precision-webkit-report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
