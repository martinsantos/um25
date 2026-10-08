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
const serviceCode=/^10[1-8]$/.test(process.env.FRAMING_SERVICE_CODE||'')?process.env.FRAMING_SERVICE_CODE:null;
const fireOnly=process.env.FRAMING_FIRE_ONLY==='true'||serviceCode==='107',networkOnly=process.env.FRAMING_NETWORK_ONLY==='true'||serviceCode==='101';
const routes=serviceCode?allRoutes.filter(route=>route.startsWith('/servicios/'+serviceCode+'/')):networkOnly?allRoutes.filter(route=>route.startsWith('/servicios/101/')):fireOnly?allRoutes.filter(route=>route.startsWith('/servicios/107/')):process.env.FRAMING_SOFTWARE_ONLY==='true'?allRoutes.filter(route=>route==='/software'||route.startsWith('/servicios/104/')):allRoutes;
const registry=JSON.parse(fs.readFileSync('src/data/cine/site-movies-v1.json','utf8'));
const controlsOnly=process.env.FRAMING_CONTROLS_ONLY==='true';
const report={scope:controlsOnly?'mobile-cinema-controls':fireOnly?'fire-project-v2':networkOnly?'network-project-v2':serviceCode?'service-'+serviceCode:'service-film-framing',pages:[],findings:[]};
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
// The authored fire film must start and complete its explanation without input.
// Let real time advance: seeking would conceal lifecycle and continuity faults.
if(fireOnly||networkOnly||serviceCode){
 const film=fireOnly?'fire':networkOnly?'network':registry.services[serviceCode].scene.split('-')[0];
 report.autonomous=[];
 for(const [engine,type,width] of [['Chrome',chromium,1440],['WebKit',webkit,390]]){
  const browser=await type.launch(engine==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:4326'+routes[0],{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('.umc-video.is-on')?.currentTime>.1,{},{timeout:20000});
   const observations=[];
   for(const time of (fireOnly?[2,7.65,14.2,16,22.8]:networkOnly?[2,7.45,10.4,17.35,22.8]:[2,8.65,16,20.1,22.8])){
    await page.waitForFunction(time=>document.querySelector('.umc-video.is-on')?.currentTime>=time,time,{timeout:20000,polling:100});
    observations.push(await page.locator('.umc-video.is-on').evaluate(v=>({time:v.currentTime,duration:v.duration,ready:v.readyState,paused:v.paused,quality:v.getVideoPlaybackQuality?.()})));
    await page.screenshot({path:path.join(out,`${film}-autonomous-${engine}-${width}-${time}.png`)});
   }
   await page.waitForFunction(()=>document.querySelector('.umc-video.is-on')?.currentTime<2,{},{timeout:6500,polling:100});
   report.autonomous.push({engine,width,observations,loop:true,errors});
   if(fireOnly){
   // Continue the same visit into the explanation, with no selection clicks.
   await page.locator('[data-atlas-theater]').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-100));
   const layers=[];
   for(const stage of [0,1,2,3,4,5,6]){
    await page.waitForFunction(stage=>Number(document.querySelector('[data-discipline-system]').dataset.disciplineStage)===stage,stage,{timeout:16000});
    await page.waitForTimeout(2800);
    const pose=await page.locator('.pf-drawing').evaluate((el,stage)=>{
     const root=el.closest('[data-discipline-system]'),frame=root.querySelector('svg').getBoundingClientRect();
     const nodes=[...el.querySelectorAll(`[data-pf-focus="${stage}"]${stage===2?', [data-discipline-route~="2"]':''}`)];
     const boxes=nodes.map(n=>n.getBoundingClientRect().toJSON());
     const detector=el.querySelector('.pf-detector-cover use').getBBox();
     return {stage:root.dataset.disciplineStage,door:el.querySelector('.pf-door').getAttribute('transform'),front:el.querySelector('.pf-door-front').getAttribute('opacity'),back:el.querySelector('.pf-door-back').getAttribute('opacity'),view:el.querySelector('.pf-viewport').getAttribute('viewBox'),outer:root.querySelector('svg').getAttribute('viewBox'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,frame:frame.toJSON(),boxes,detector:{width:detector.width,height:detector.height}};
    },stage);
    if(pose.outer!=='0 0 1000 650'||pose.detector.width<40||pose.detector.height<20||stage<6&&!pose.boxes.length||pose.boxes.some(b=>b.left<pose.frame.left+2||b.right>pose.frame.right-2||b.top<pose.frame.top+2||b.bottom>pose.frame.bottom-2))report.findings.push({engine,width,scope:'fire-visible-components',pose});
    if(pose.width!==pose.scrollWidth||(stage>=3&&pose.back!=='1'))report.findings.push({engine,width,scope:'fire-isometry',pose});
    layers.push(pose);await page.locator('[data-atlas-theater]').screenshot({path:path.join(out,`fire-isometry-${engine}-${width}-${stage}.png`),animations:'allow'});
   }
   report.autonomous.at(-1).layers=layers;
   await page.locator('[data-atlas-play]').click();
   const paused=await page.locator('.pf-door').getAttribute('transform');await page.waitForTimeout(800);
   if(await page.locator('.pf-door').getAttribute('transform')!==paused)report.findings.push({engine,width,message:'Fire inspection ignores its pause control'});

   }
   if(errors.length)report.findings.push({engine,width,errors});
  }catch(error){report.findings.push({engine,width,scope:'autonomous-'+film,error:error.message});}
  finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'framing-report.json'),JSON.stringify(report,null,2));
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
