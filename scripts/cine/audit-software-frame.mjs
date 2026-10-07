import fs from 'node:fs';
import path from 'node:path';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;
if(!out||!path.isAbsolute(out))throw Error('Absolute artifact directory required');
fs.mkdirSync(out,{recursive:true});
const routes=['/software',[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/104\/[^']+)'/g)][0][1]];
const report={pages:[],findings:[]};
for(const [engine,type] of [['Chrome',chromium],['WebKit',webkit]]){
 const browser=await type.launch(engine==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 for(const width of [1440,1280,834,390,360]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  for(const [index,route] of routes.entries()){
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.goto('http://127.0.0.1:4326'+route,{waitUntil:'load',timeout:60000});
    await page.locator('.umc-poster').evaluate(image=>image.decode());
    const state=await page.locator('[data-umc]').evaluate(root=>{
     const box=node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
     const poster=root.querySelector('.umc-poster'),stage=root.querySelector('.umc-stage'),video=root.querySelector('video');
     return {poster:box(poster),stage:box(stage),video:box(video),source:poster.currentSrc,mask:getComputedStyle(poster).maskImage,width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    const row={engine,width,route,state,errors};report.pages.push(row);
    const center=b=>b.y+b.height/2;
    if(Math.abs(center(state.poster)-center(state.stage))>1||Math.abs(state.poster.y-state.video.y)>1||Math.abs(state.poster.height-state.video.height)>1||state.scrollWidth>width+2||errors.length)report.findings.push(row);
    await page.screenshot({path:path.join(out,`${engine}-${width}-${index}-poster.png`)});
    if(engine==='Chrome'&&(width===1440||width===390)){
     await page.locator('[data-umc-motion]').click();
     await page.waitForFunction(()=>[...document.querySelectorAll('.umc-video')].some(video=>video.classList.contains('is-on')&&video.currentTime>.5),{},{timeout:15000});
     const playing=await page.locator('.umc-video.is-on').boundingBox();row.playing=playing;
     if(Math.abs(playing.y-state.poster.y)>1||Math.abs(playing.height-state.poster.height)>1)report.findings.push({engine,width,route,poster:state.poster,playing});
     await page.screenshot({path:path.join(out,`${engine}-${width}-${index}-playing.png`)});
    }
   }catch(error){report.findings.push({engine,width,route,error:error.message});}
   await page.close();fs.writeFileSync(path.join(out,'framing-report.json'),JSON.stringify(report,null,2));
  }
  await context.close();
 }
 await browser.close();
}
console.log(JSON.stringify({pages:report.pages.length,findings:report.findings.length}));if(report.findings.length)process.exitCode=1;
