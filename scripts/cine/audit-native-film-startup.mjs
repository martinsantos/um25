/** Run exclusively on a disposable CI checkout. No screenshots interrupt decoding. */
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;
if(!out||!path.isAbsolute(out))throw Error('Absolute audit directory required');
fs.mkdirSync(out,{recursive:true});
const code=/^10[1-8]$/.test(process.env.FRAMING_SERVICE_CODE||'')?process.env.FRAMING_SERVICE_CODE:'101';
const registry=JSON.parse(fs.readFileSync('src/data/cine/site-movies-v1.json','utf8'));
const route=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(x=>x[1]).find(x=>x.startsWith('/servicios/'+code+'/'));
const source='/cine/media/cine-'+registry.services[code].scene+'.mp4';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={code,source,measurements:[],findings:[]};
try{
 // Reverse the original order and repeat the identical page to distinguish
 // first-decoder startup from work done by the offscreen diagrams.
 for(const mode of ['page-no-isometry','page','page-repeat','native']){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage();
  if(mode==='page-no-isometry')await page.route('**/cine/*.js',route=>/precision-systems|discipline-camera|fire-system/.test(route.request().url())?route.abort():route.continue());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__filmAudit={longTasks:[],events:[],frames:[],navigation:null};
   try{new PerformanceObserver(list=>window.__filmAudit.longTasks.push(...list.getEntries().map(e=>({at:e.startTime,ms:e.duration,name:e.name})))).observe({type:'longtask',buffered:true});}catch{}
   for(const event of ['loadstart','loadeddata','canplay','play','playing','waiting','stalled','pause','ended'])document.addEventListener(event,e=>{
    if(e.target instanceof HTMLVideoElement)window.__filmAudit.events.push({event,at:performance.now(),media:e.target.currentTime});
   },true);
   let next=0;
   function sample(){
    const v=document.querySelector('video.is-on,video[data-native-probe]');
    if(v&&v.currentTime>=next){
     const q=v.getVideoPlaybackQuality();
     window.__filmAudit.frames.push({at:performance.now(),media:v.currentTime,total:q.totalVideoFrames,dropped:q.droppedVideoFrames,ready:v.readyState,stories:[...document.querySelectorAll('[data-service-atlas]')].map(root=>({state:root.dataset.storyState,scene:root.dataset.storyScene,runtime:root.querySelector('[data-discipline-system]')?.dataset.disciplineRuntime,top:Math.round(root.querySelector('[data-atlas-theater]')?.getBoundingClientRect().top||0)})),animations:document.getAnimations().filter(a=>a.playState==='running').length});next=Math.floor(v.currentTime)+1;
    }
    window.__filmAuditTimer=setTimeout(sample,80);
   }
   document.addEventListener('DOMContentLoaded',sample,{once:true});
  });
  if(mode==='native'){
   await page.route('**/__native-film-audit',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#050505"><video data-native-probe muted playsinline preload="auto" style="position:absolute;left:604.8px;top:209px;width:835.2px;height:469.8px" src="${source}"></video><script>setTimeout(()=>document.querySelector('video').play(),600);</script>`}));
   await page.goto('http://127.0.0.1:4326/__native-film-audit',{waitUntil:'load'});
  }else await page.goto('http://127.0.0.1:4326'+route,{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('video.is-on,video[data-native-probe]')?.currentTime>=23.3,{},{timeout:45000,polling:300});
  const result=await page.evaluate(()=>{
   clearTimeout(window.__filmAuditTimer);
   const v=document.querySelector('video.is-on,video[data-native-probe]'),q=v.getVideoPlaybackQuality();
   return {...window.__filmAudit,quality:{total:q.totalVideoFrames,dropped:q.droppedVideoFrames,corrupted:q.corruptedVideoFrames},navigation:performance.getEntriesByType('navigation').map(x=>({load:x.loadEventEnd,dom:x.domContentLoadedEventEnd,response:x.responseEnd})),resources:performance.getEntriesByType('resource').filter(x=>/\.js|woff|\.mp4/.test(x.name)).map(x=>({name:new URL(x.name).pathname,start:x.startTime,end:x.responseEnd,bytes:x.transferSize}))};
  });
  report.measurements.push({mode,...result,errors});
  if(errors.length||result.quality.corrupted)report.findings.push({mode,errors,quality:result.quality});
  fs.writeFileSync(path.join(out,'native-startup-report.json'),JSON.stringify(report,null,2));
  await context.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify(report.measurements.map(m=>({mode:m.mode,quality:m.quality,longTasks:m.longTasks.length,blockedMs:m.longTasks.reduce((n,x)=>n+x.ms,0)}))));
if(report.findings.length)process.exitCode=1;
