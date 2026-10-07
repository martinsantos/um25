import fs from 'node:fs';
import path from 'node:path';
const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;if(!out||!path.isAbsolute(out))throw Error('Absolute artifact directory required');
fs.mkdirSync(out,{recursive:true});
const browser=await webkit.launch({headless:true});
const paths=process.env.VISUAL_AUDIT_HOME_ONLY==='1'?['/']:[...(process.env.VISUAL_AUDIT_SOFTWARE_ONLY==='1'?['/software']:['/','/constructoras','/software']),...(process.env.VISUAL_AUDIT_SOFTWARE_ONLY==='1'?['104']:['101','102','103','104','105','106','107','108']).map(code=>[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(m=>m[1]).find(route=>route.startsWith('/servicios/'+code+'/')))];
const report={engine:'WebKit on isolated Linux runner; not a physical Safari device',pages:[],findings:[]};
for(const width of [1440,1280,834,390,360]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 for(const [index,route] of paths.entries()){
  console.log('WEBKIT',width,route);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
   const response=await page.goto('http://127.0.0.1:4326'+route,{waitUntil:'load',timeout:60000});
   if(route==='/software'||route.startsWith('/servicios/104/'))await page.screenshot({path:path.join(out,`webkit-${width}-${index}-hero.png`)});
   const story=page.locator('[data-service-atlas]');
   if(await page.locator('.um26-service-library').count())await page.locator('.um26-service-library').evaluate(node=>node.open=true);
   await story.locator('[data-atlas-theater]').scrollIntoViewIfNeeded();
   const architecture=story.locator('[data-discipline-system][data-visible="true"]');
   if(await architecture.count()){
    const state=await story.evaluate(root=>({visible:root.dataset.disciplineActive==='true',outline:root.querySelectorAll('[data-story-point]').length,stage:root.querySelector('[data-discipline-system]')?.dataset.disciplineStage,width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    if(!state.visible||state.outline!==6||state.stage!=='-1'||state.scrollWidth>width+2)report.findings.push({width,route,architecture:state});
    await page.screenshot({path:path.join(out,`webkit-${width}-${index}-system.png`)});
    if(await architecture.locator('.ds-door').count()){
     const hinge=await architecture.evaluate(root=>{root.dataset.disciplineStage='3';const m=new DOMMatrix(getComputedStyle(root.querySelector('.ds-door')).transform);root.dataset.disciplineStage='-1';return {a:m.a,c:m.c,d:m.d};});
     if(hinge.a>=0||Math.abs(hinge.c)>.0001||Math.abs(hinge.d-1)>.0001)report.findings.push({width,route,hinge});
    }

   }
   const technical=story.locator('.svc-story__technical');if(await technical.count())await technical.evaluate(node=>node.open=true);
   await story.locator('[data-atlas-view="object"]').click();
   await story.locator('[data-atlas-theater]').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(600);
   const state=await story.evaluate(root=>({code:root.dataset.activeService,projectView:root.querySelector('[data-atlas-project]')?.dataset.projectView,hardwareVisible:Boolean(root.querySelector('[data-atlas-network]')&&!root.querySelector('[data-atlas-network]').hidden),hardwareMounted:!!root.querySelector('[data-atlas-network] svg'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
   report.pages.push({width,route,status:response.status(),state,errors});
   if(response.status()!==200||state.scrollWidth>width+2||(state.projectView!==undefined&&state.projectView!=='1')||(state.hardwareVisible&&!state.hardwareMounted)||errors.length)report.findings.push({width,route,state,errors});
   await page.screenshot({path:path.join(out,`webkit-${width}-${index}-detail.png`)});
  }catch(error){report.findings.push({width,route,error:error.message});}
  await page.close();
  fs.writeFileSync(path.join(out,'webkit-report.json'),JSON.stringify(report,null,2));
 }
 await context.close();
}
await browser.close();fs.writeFileSync(path.join(out,'webkit-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({engine:'webkit',pages:report.pages.length,findings:report.findings.length}));if(report.findings.length)process.exitCode=1;
