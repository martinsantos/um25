import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
async function redSwatch(buffer){
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});const bins=new Map();
 for(let i=0;i<data.length;i+=info.channels){const [r,g,b]=[data[i],data[i+1],data[i+2]];if(r>160&&g<100&&b<100){const key=[r,g,b].join(',');bins.set(key,(bins.get(key)||0)+1);}}
 const mode=[...bins].sort((a,b)=>b[1]-a[1])[0];return mode?{rgb:mode[0].split(',').map(Number),pixels:mode[1]}:null;
}
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.VISUAL_AUDIT_DIR;
if(!out||!path.isAbsolute(out))throw Error('Absolute artifact directory required');
fs.mkdirSync(out,{recursive:true});
const allRoutes=['/software',...[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(match=>match[1])];
const routes=process.env.FRAMING_SOFTWARE_ONLY==='true'?allRoutes.filter(route=>route==='/software'||route.startsWith('/servicios/104/')):allRoutes;
const registry=JSON.parse(fs.readFileSync('src/data/cine/site-movies-v1.json','utf8'));
const controlsOnly=process.env.FRAMING_CONTROLS_ONLY==='true';
const report={scope:controlsOnly?'mobile-cinema-controls':'all-eight-service-films',pages:[],findings:[]};
const traversedWebKit=new Set();
const probe=process.env.FRAMING_PROBE==='true';
for(const [engine,type] of (probe?[['WebKit',webkit]]:[['Chrome',chromium],['WebKit',webkit]])){
 const browser=await type.launch(engine==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 for(const width of (probe?[390]:controlsOnly?[820,390,360]:[1440,1280,834,390,360])){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  for(const [index,route] of (probe?routes.slice(0,2):routes).entries()){
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.__cinemaEvents=[];
    for(const name of ['play','playing','pause','waiting','stalled','ended','error','timeupdate'])document.addEventListener(name,event=>{
     const video=event.target;if(!(video instanceof HTMLVideoElement))return;
     window.__cinemaEvents.push({event:name,time:video.currentTime,paused:video.paused,ready:video.readyState,visibility:document.visibilityState,wall:performance.now()});
     if(window.__cinemaEvents.length>160)window.__cinemaEvents.shift();
    },true);
   });
   try{
    await page.goto('http://127.0.0.1:4326'+route,{waitUntil:'load',timeout:60000});
    await page.locator('.umc-poster').evaluate(image=>image.decode());
    const state=await page.locator('[data-umc]').evaluate(root=>{
     const box=node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
     const poster=root.querySelector('.umc-poster'),stage=root.querySelector('.umc-stage'),video=root.querySelector('video');
     const motion=root.querySelector('[data-umc-motion]'),controlBox=box(motion);
     const hit=document.elementFromPoint(controlBox.x+controlBox.width/2,controlBox.y+controlBox.height/2);
     const control={...controlBox,exposed:hit===motion||motion.contains(hit)};
     return {product:root.dataset.productComposition==='true',copy:box(root.querySelector('.umc-copy')),control,poster:box(poster),stage:box(stage),video:box(video),source:poster.currentSrc,mask:getComputedStyle(poster).maskImage,width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    });
    const row={engine,width,route,state,errors};report.pages.push(row);
    if(state.product){
     if(state.mask!=='none')report.findings.push({engine,width,route,message:'Product UI is erased by a mask'});
     if(width>820&&state.stage.x<state.copy.x+state.copy.width+16)report.findings.push({engine,width,route,message:'Product film overlaps its reading column',state});
     if(width<=820&&Math.abs(state.stage.width/state.stage.height-16/9)>.01)report.findings.push({engine,width,route,message:'Mobile product frame is cropped',state});
    }
    if(width<=820&&(!state.control.exposed||state.control.y<0||state.control.y+state.control.height>840||state.control.width<44||state.control.height<44))report.findings.push({engine,width,route,message:'Motion control is obscured or undersized',control:state.control});
    const code=route.match(/^\/servicios\/(\d+)\//)?.[1]||'104';
    const expected=registry.services?.[code]?.scene;
    if(!expected||!state.source.includes('cine-'+expected+'-poster'+(width<=820?'-sq':'')))report.findings.push({engine,width,route,expected,source:state.source});
    const center=b=>b.y+b.height/2;
    if(Math.abs(center(state.poster)-center(state.stage))>1||Math.abs(state.poster.y-state.video.y)>1||Math.abs(state.poster.height-state.video.height)>1||state.scrollWidth>width+2||errors.length)report.findings.push(row);
    await page.screenshot({path:path.join(out,`${engine}-${width}-${index}-poster.png`)});
    if(width===1440||width===390){
     await page.locator('[data-umc-motion]').click();
     // Clicking the mobile control scrolls it into view. Restore the same
     // viewport before comparing media coordinates and taking the hero shot.
     await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
     await page.waitForFunction(()=>[...document.querySelectorAll('.umc-video')].some(video=>video.classList.contains('is-on')&&video.currentTime>.5),{},{timeout:15000});
     const playing=await page.locator('.umc-video.is-on').boundingBox();row.playing=playing;
     if(Math.abs(playing.y-state.poster.y)>1||Math.abs(playing.height-state.poster.height)>1)report.findings.push({engine,width,route,poster:state.poster,playing});
     await page.screenshot({path:path.join(out,`${engine}-${width}-${index}-playing.png`)});
     if(expected==='software-system-v4'){
      row.movieRed=await redSwatch(await page.locator('.umc-video.is-on').screenshot({animations:'allow'}));
      if(!row.movieRed||Math.max(...row.movieRed.rgb.map((v,i)=>Math.abs(v-[220,38,38][i])))>6)report.findings.push({engine,width,route,message:'Movie changes the authored UM red',swatch:row.movieRed});
     }
     if(!controlsOnly&&engine==='WebKit'&&width===390&&!traversedWebKit.has(expected)){
      await page.waitForFunction(()=>document.querySelector('.umc-video.is-on')?.currentTime>=22,{},{timeout:35000,polling:250});
      const end=await page.locator('.umc-video.is-on').evaluate(v=>({time:v.currentTime,duration:v.duration,error:v.error?.code||null,src:v.currentSrc}));
      await page.waitForFunction(()=>document.querySelector('.umc-video.is-on')?.currentTime<2,{},{timeout:6000,polling:100});
      row.nativeLoop={end,after:await page.locator('.umc-video.is-on').evaluate(v=>v.currentTime)};traversedWebKit.add(expected);
     }
    }
   }catch(error){
    const playback=await page.evaluate(()=>({visibility:document.visibilityState,scrollY,events:window.__cinemaEvents,videos:[...document.querySelectorAll('.umc-video')].map(v=>({src:v.currentSrc,time:v.currentTime,duration:v.duration,paused:v.paused,ready:v.readyState,network:v.networkState,error:v.error?.message,loop:v.loop,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)]),rect:v.getBoundingClientRect().toJSON()}))})).catch(()=>null);
    report.findings.push({engine,width,route,error:error.message,playback});
   }
   await page.close();fs.writeFileSync(path.join(out,'framing-report.json'),JSON.stringify(report,null,2));
  }
  await context.close();
 }
 await browser.close();
}
// Compare the same encoded file without the website player on the disposable runner.
if(probe){
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:900}});
 report.nativeComparison=[];
 for(const looping of [false,true]){
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4326/');
  await page.setContent('<video muted playsinline style="width:390px" src="/cine/media/cine-network-system-v1-sq.mp4"></video>');
  await page.locator('video').evaluate((v,looping)=>{
   v.muted=true;v.loop=looping;window.__nativeFrames=[];window.__nativeEvents=[];
   for(const name of ['timeupdate','ended','seeking','seeked','waiting','error'])v.addEventListener(name,()=>window.__nativeEvents.push({event:name,time:v.currentTime,wall:performance.now(),rate:v.playbackRate,ended:v.ended}));
   const frame=(now,meta)=>{window.__nativeFrames.push({time:v.currentTime,media:meta.mediaTime,frames:meta.presentedFrames,wall:now});v.requestVideoFrameCallback(frame);};
   if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(frame);
   return v.play();
  },looping);
  await page.waitForTimeout(27000);
  report.nativeComparison.push(await page.locator('video').evaluate(v=>({loop:v.loop,duration:v.duration,time:v.currentTime,paused:v.paused,ended:v.ended,events:window.__nativeEvents,frames:window.__nativeFrames,quality:v.getVideoPlaybackQuality?.()})));
  await page.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(out,'framing-report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({pages:report.pages.length,findings:report.findings.length}));if(report.findings.length)process.exitCode=1;
