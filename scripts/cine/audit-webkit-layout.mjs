import fs from 'node:fs';
import path from 'node:path';
const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;if(!out||!path.isAbsolute(out))throw Error('Absolute artifact directory required');
fs.mkdirSync(out,{recursive:true});
const browser=await webkit.launch({headless:true});
const paths=['/','/constructoras',...['101','103','104','107'].map(code=>[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(m=>m[1]).find(route=>route.startsWith('/servicios/'+code+'/')))];
const report={engine:'WebKit on isolated Linux runner; not a physical Safari device',pages:[],findings:[]};
for(const width of [1440,1280,834,390,360]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 for(const [index,route] of paths.entries()){
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
   const response=await page.goto('http://127.0.0.1:4326'+route,{waitUntil:'load',timeout:60000});
   const story=page.locator('[data-service-atlas]');
   if(await page.locator('.um26-service-library').count())await page.locator('.um26-service-library').evaluate(node=>node.open=true);
   await story.locator('[data-atlas-theater]').scrollIntoViewIfNeeded();
   const architecture=story.locator('[data-discipline-system][data-visible="true"]');
   if(await architecture.count()){
    const state=await story.evaluate(root=>({visible:root.dataset.disciplineActive==='true',outline:root.querySelectorAll('[data-story-point]').length,stage:root.querySelector('[data-discipline-system]')?.dataset.disciplineStage,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    if(!state.visible||state.outline!==6||state.stage!=='-1'||state.scrollWidth>width+2)report.findings.push({width,route,architecture:state});
    await page.screenshot({path:path.join(out,`webkit-${width}-${index}-system.png`)});
   }
   const technical=story.locator('.svc-story__technical');if(await technical.count())await technical.evaluate(node=>node.open=true);
   await story.locator('[data-atlas-view="object"]').click();
   await story.locator('[data-atlas-theater]').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(600);
   const state=await story.evaluate(root=>({code:root.dataset.activeService,projectView:root.querySelector('[data-atlas-project]')?.dataset.projectView,hardwareVisible:Boolean(root.querySelector('[data-atlas-network]')&&!root.querySelector('[data-atlas-network]').hidden),hardwareMounted:!!root.querySelector('[data-atlas-network] svg'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   report.pages.push({width,route,status:response.status(),state,errors});
   if(response.status()!==200||state.scrollWidth>width+2||state.projectView!=='1'||(state.hardwareVisible&&!state.hardwareMounted)||errors.length)report.findings.push({width,route,state,errors});
   await page.screenshot({path:path.join(out,`webkit-${width}-${index}-detail.png`)});
  }catch(error){report.findings.push({width,route,error:error.message});}
  await page.close();
 }
 await context.close();
}
await browser.close();fs.writeFileSync(path.join(out,'webkit-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({engine:'webkit',pages:report.pages.length,findings:report.findings.length}));if(report.findings.length)process.exitCode=1;
