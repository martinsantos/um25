import fs from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

// This audit serves a fresh candidate build on a disposable CI runner. It does
// not connect to production, the user's browser, or the Mac's local preview.
const origin='http://127.0.0.1:4326';
const profile=process.env.VISUAL_AUDIT_PROFILE||'desktop';
const out=process.env.VISUAL_AUDIT_DIR;
if(!out||!path.isAbsolute(out))throw new Error('VISUAL_AUDIT_DIR must be an absolute artifact path');
fs.mkdirSync(out,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const viewport=profile==='mobile'?{width:390,height:844}:{width:1440,height:900};
const servicePaths=[...fs.readFileSync('src/data/navigation.ts','utf8').matchAll(/href: '(\/servicios\/\d+\/[^']+)'/g)].map(match=>match[1]);
const pilotOnly=process.env.VISUAL_AUDIT_PILOT_ONLY==='1',includeHome=process.env.VISUAL_AUDIT_HOME_ONLY==='1';
const routes=process.env.VISUAL_AUDIT_SOFTWARE_ONLY==='1'?[servicePaths.find(route=>route.startsWith('/servicios/104/'))]:process.env.VISUAL_AUDIT_DISCIPLINE_ONLY==='1'?['/','/bodegas',...['103','104','107'].map(code=>servicePaths.find(route=>route.startsWith('/servicios/'+code+'/')))]:pilotOnly?[...(includeHome?['/']:[]),'/bodegas',servicePaths.find(path=>path.startsWith('/servicios/107/'))]:process.env.VISUAL_AUDIT_HOME_ONLY==='1'?['/']:['/','/servicios','/sectores',...['constructoras','bodegas','salud','aeropuertos','industria','mineria','gobiernosectorpublico','seguridad-electronica','software'].map(s=>'/'+s),...servicePaths];
const report={profile,viewport,scope:process.env.VISUAL_AUDIT_SOFTWARE_ONLY==='1'?'software':process.env.VISUAL_AUDIT_DISCIPLINE_ONLY==='1'?'discipline-systems':pilotOnly?(includeHome?'home-and-winery-pilot':'winery-pilot'):process.env.VISUAL_AUDIT_HOME_ONLY==='1'?'home':'all',commit:process.env.GITHUB_SHA,pages:[],findings:[],movieCoverage:[],clock:'Native playback; narrative timers accelerated only in separate story pages'};
const movies=new Set();
const slug=route=>route==='/'?'home':route.replace(/\/$/,'').replaceAll('/','_').slice(1);
const finding=(route,message,detail)=>{report.findings.push({route,message,detail});console.log('FINDING',route,message);};
const context=await browser.newContext({viewport,isMobile:profile==='mobile',hasTouch:profile==='mobile',reducedMotion:'no-preference'});
async function snapshot(page,name,locator){
 const file=name+'.png';
 if(locator&&profile!=='mobile')await locator.screenshot({path:path.join(out,file),animations:'allow',timeout:20000});
 else await page.screenshot({path:path.join(out,file),fullPage:false,animations:'allow',timeout:20000});
 return file;
}
async function movieState(page){return page.locator('[data-umc]').evaluate(root=>({scene:root.dataset.scene,motion:root.dataset.motion,paused:root.classList.contains('is-paused'),videos:[...root.querySelectorAll('video')].map(v=>({on:v.classList.contains('is-on'),paused:v.paused,time:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:null,ready:v.readyState,error:v.error?.code||null,src:v.currentSrc,h264:v.canPlayType('video/mp4; codecs="avc1.42E01E"')}))}));}
async function storyState(page){return page.locator('[data-service-atlas]').evaluate(root=>({code:root.dataset.activeService,scene:Number(root.dataset.storyScene||0),state:root.dataset.storyState,view:root.querySelector('[data-atlas-view][aria-pressed="true"]')?.dataset.atlasView,title:root.querySelector('[data-atlas-scene-title]')?.textContent,projectOpen:root.querySelector('[data-atlas-project]')?.dataset.projectOpen,focused:document.activeElement?.getAttribute('data-atlas-service')}));}
for(const route of routes){
 const name=slug(route),row={route,shots:[],errors:[],httpErrors:[]};report.pages.push(row);
 console.log('AUDIT',profile,route);
 const page=await context.newPage();await page.bringToFront();
 page.on('pageerror',e=>row.errors.push(e.message));
 page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(origin))row.httpErrors.push({url:response.url().slice(origin.length),status:response.status()});});
 try{
  await page.addInitScript(()=>{window.__umMetrics={lcp:0,cls:0};try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__umMetrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__umMetrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});}catch{}});
  const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:60000});row.status=response.status();
  await page.waitForLoadState('load',{timeout:30000}).catch(()=>{});
  await delay(2500);
  row.title=await page.title();
  row.layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,domNodes:document.querySelectorAll('*').length,h1:document.querySelector('h1')?.textContent,metrics:window.__umMetrics}));
  if(row.status!==200||!row.layout.h1)finding(route,'Page identity or complete rendering failed',row);
  if(row.layout.scrollWidth>viewport.width+2)finding(route,'Page overflows horizontally',row.layout);
  row.shots.push(await snapshot(page,name+'-hero'));
  if(await page.locator('[data-umc]').count()){
   const initial=await movieState(page);row.movie=[initial];
   const key=initial.scene,full=route==='/'||!movies.has(key);movies.add(key);
   const duration=route==='/'?43000:full?19500:1600,until=Date.now()+duration;
   while(Date.now()<until){await delay(1100);row.movie.push(await movieState(page));}
   const played=row.movie.some(state=>state.videos.some(v=>v.on&&!v.paused&&v.time>.4&&!v.error));
   if(!played)finding(route,'Movie does not play automatically with native H.264',row.movie);
   if(route==='/'&&new Set(row.movie.map(s=>s.scene)).size<5)finding(route,'Home movie did not visit all five scenes without a click',row.movie.map(s=>s.scene));
   report.movieCoverage.push({route,key,played,full,scenes:[...new Set(row.movie.map(s=>s.scene))]});
   const motion=page.locator('[data-umc-motion]');
   if(played&&await motion.count()){
    await motion.click();const before=await movieState(page);await delay(1000);const after=await movieState(page);
    row.moviePause={before,after};
    if(after.videos.some(v=>v.on&&!v.paused))finding(route,'Explicit movie pause is ineffective',after);
    await motion.click();
   }
  }
  if(route==='/'&&profile==='desktop'){
   row.menus=[];
   for(const group of ['servicios','sectores']){
    const toggle=page.locator(`[data-mega="${group}"] .um-ops-mega__toggle`);
    await toggle.hover();await toggle.focus();await delay(250);
    const menu=page.locator('#um-mega-'+group);
    row.menus.push({group,expanded:await toggle.getAttribute('aria-expanded'),box:await menu.boundingBox()});
    if(await toggle.getAttribute('aria-expanded')!=='true'||!await menu.isVisible())finding(route,'Moving hover and focus to a menu closes its panel',group);
    row.shots.push(await snapshot(page,name+'-menu-'+group));
    await page.keyboard.press('Escape');await delay(250);
    if(await toggle.getAttribute('aria-expanded')!=='false'||await menu.isVisible())finding(route,'Escape does not close the visible mega-menu',group);
    await toggle.press('Enter');await delay(250);
    if(await toggle.getAttribute('aria-expanded')!=='true'||!await menu.isVisible())finding(route,'Keyboard cannot reopen the mega-menu',group);
    await page.keyboard.press('Escape');
   }
  }
  if(route==='/'&&profile==='mobile'){
   const toggle=page.locator('#menuToggle');await toggle.tap();await delay(250);
   row.mobileMenu={expanded:await toggle.getAttribute('aria-expanded')};
   row.shots.push(await snapshot(page,name+'-mobile-menu'));
   await toggle.tap();await delay(250);
   if(await toggle.getAttribute('aria-expanded')!=='false')finding(route,'Mobile menu does not close',row.mobileMenu);
  }
  if(row.errors.length)finding(route,'Browser runtime errors',row.errors);
  if(row.httpErrors.length)finding(route,'Missing local assets',row.httpErrors);
 }catch(error){finding(route,'Native first-fold audit failed',error.message);}
 await page.close();

 // A separate context installs the clock before site code runs. Native movie and
 // load timing above are never measured with the accelerated narrative clock.
 if(route!=='/sectores'){
  const storyContext=await browser.newContext({viewport,isMobile:profile==='mobile',hasTouch:profile==='mobile',reducedMotion:'no-preference'});
  const story=await storyContext.newPage();await story.bringToFront();
  story.on('pageerror',e=>row.errors.push(e.message));
  try{
   const epoch=new Date('2026-10-06T00:00:00Z');
   await story.clock.install({time:epoch});
   await story.clock.pauseAt(new Date(epoch.getTime()+1000));
   await story.goto(origin+route,{waitUntil:'domcontentloaded',timeout:60000});
   await story.clock.runFor(1000);
   for(let n=0;n<40;n++){if(await story.locator('[data-service-atlas]').getAttribute('data-bound')==='true')break;await delay(150);await story.clock.runFor(100);}
   if(await story.locator('[data-service-atlas]').evaluate(root=>Boolean(root.closest('details:not([open])'))))finding(route,'The primary story is hidden behind a disclosure');
   const theater=story.locator('[data-atlas-theater]');
   await theater.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
   await story.clock.runFor(250);await delay(300);
   const chapters=JSON.parse(await story.locator('[data-atlas-narrative]').textContent());
   row.timeline=[];
   const total=chapters.reduce((sum,c)=>sum+c.scenes.length,0),captured=new Set();
   for(let step=0;step<=total+2;step++){
    await theater.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    await story.clock.runFor(60);await delay(60);
    const state=await storyState(story);row.timeline.push(state);
    const current=chapters.find(c=>c.code===state.code)?.scenes[state.scene];
    if(state.state==='complete')break;
    if(state.view!=='system'){
     const activeDetail=await story.locator('[data-service-atlas]').evaluate(root=>{
      const code=root.dataset.activeService,selector=root.dataset.disciplineActive==='true'?'[data-discipline-system]':['101','102','103','107','108'].includes(code)?'[data-atlas-network]':code==='104'?'[data-atlas-software]':'[data-atlas-operation="'+code+'"]';
      const node=root.querySelector(selector);return {code,shown:!!node&&node.getBoundingClientRect().width>0&&getComputedStyle(node).visibility!=='hidden',gated:!!root.closest('details:not([open])')};
     });
     if(!activeDetail.shown||activeDetail.gated)finding(route,'Automatic phase leaves its explanatory drawing hidden',activeDetail);
    }
    if(state.state!=='playing'){finding(route,'Story cannot progress on its own while the drawing is visible',state);break;}
    const key=state.code+'-'+state.scene;
    if(!captured.has(key)&&(route==='/'||state.code===chapters[0].code)){
     captured.add(key);await delay(1550);
     if(current?.flow?.phase===1&&state.view==='system'){
      const framing=await story.locator('[data-atlas-project]').evaluate(root=>{
       const focus=root.querySelector(`[data-project-focus="${root.dataset.projectService}"]`);if(!focus)return null;
       const x=Number(focus.dataset.x),y=Number(focus.dataset.y),w=Number(focus.dataset.width),h=Number(focus.dataset.height);
       const matrix=root.querySelector('.sp-root').getScreenCTM();
       const points=[[x-w/2,y-h/2],[x+w/2,y+h/2]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
       const stage=root.closest('[data-atlas-theater]').getBoundingClientRect();
       return {device:{left:points[0].x,top:points[0].y,right:points[1].x,bottom:points[1].y},stage:{left:stage.left,top:stage.top,right:stage.right,bottom:stage.bottom}};
      });
      if(framing){const {device,stage}=framing;if(device.left<stage.left-2||device.right>stage.right+2||device.top<stage.top-2||device.bottom>stage.bottom+2)finding(route,'The focused device is clipped by the stage',{code:state.code,...framing});}
     }
     if(current?.flow?.phase===1&&state.view==='system'&&state.code!=='103'){
      const effect=await story.locator('[data-atlas-project]').evaluate(root=>({code:root.dataset.projectService,visible:[...root.querySelectorAll('.sp-effect')].filter(node=>Number(getComputedStyle(node).opacity)>.8).map(node=>node.getAttribute('class'))}));
      row.deviceEffects||=[];row.deviceEffects.push(effect);
      // Network delivery is visible in phase 2; other systems act in phase 1.
      if(state.code!=='101'&&!effect.visible.length)finding(route,'The service has no visible device response',effect);
     }
     if(state.view!=='system'){
      const detail=await story.locator('[data-service-atlas]').evaluate(root=>{
       const hardware=root.querySelector('[data-atlas-network]'),software=root.querySelector('[data-atlas-software]');
       const visible=node=>Boolean(node&&getComputedStyle(node).visibility!=='hidden'&&node.getBoundingClientRect().width>0);
       const discipline=root.querySelector('[data-discipline-system]');
       return {system:root.dataset.disciplineActive==='true',diagram:visible(discipline),layers:discipline?.querySelectorAll(`[data-discipline-drawing="${root.dataset.activeService}"] [data-discipline-tag]`).length,stage:discipline?.dataset.disciplineStage,view:root.dataset.storyView,hardware:visible(hardware)&&!!hardware.querySelector('svg'),software:visible(software),outline:root.querySelectorAll('[data-story-point]').length,disclosure:!!root.closest('details:not([open])')};
      });
      row.defaultDetails||=[];row.defaultDetails.push({code:state.code,...detail});
      if(detail.disclosure||(detail.system?(!detail.diagram||detail.layers!==6||detail.outline!==6||Number(detail.stage)!==current?.disciplineStage):(detail.outline!==3||(['101','102','103','107','108'].includes(state.code)&&!detail.hardware)||(state.code==='104'&&!detail.software))))finding(route,'The explanatory detail is not visible by default',detail);
     }
     row.shots.push(await snapshot(story,name+'-'+key+'-'+state.view,story.locator('.svc-story__stage')));
    }
    await story.clock.runFor((current?.duration||8000)+40);
    await delay(30);
   }
   const visited=[...new Set(row.timeline.map(s=>s.code))];row.visitedServices=visited;
   if(visited.length<chapters.length)finding(route,'Automatic story omits services',{expected:chapters.map(c=>c.code),visited});
   if(route==='/'||route==='/servicios'){
    const other=story.locator('[data-atlas-service]').nth(1);
    if(profile==='mobile')await other.tap();else await other.click();await theater.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    // Scrolling queues IntersectionObserver delivery. Settle visibility before
    // accelerating reading time; otherwise a paused clock can consume the whole
    // measurement while the stage is still correctly marked offscreen.
    for(let attempt=0;attempt<20;attempt++){
     await story.clock.runFor(100);await delay(50);
     if(['exploring','playing'].includes((await storyState(story)).state))break;
    }
    // Leave pointer and focus on the chosen control: continuation must not need another gesture.
    row.manualBefore=await storyState(story);
    await story.clock.runFor(20000);await delay(30);row.manualAfter=await storyState(story);
    row.manualContinues=row.manualAfter.state==='playing'&&(row.manualBefore.code!==row.manualAfter.code||row.manualBefore.scene!==row.manualAfter.scene);
    if(!row.manualContinues)finding(route,'Exploration requires an extra Play click to resume', {before:row.manualBefore,after:row.manualAfter});
    row.shots.push(await snapshot(story,name+'-after-exploration',story.locator('.svc-story__stage')));
   }
  }catch(error){finding(route,'Automatic narrative audit failed',error.message);}
  await storyContext.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
// Record actual elapsed-time operation and verify CSS transport, independently of fake clocks.
if(!pilotOnly||includeHome){
const liveContext=await browser.newContext({viewport,isMobile:profile==='mobile',hasTouch:profile==='mobile',reducedMotion:'no-preference',recordVideo:{dir:out,size:viewport}});
const live=await liveContext.newPage();
await live.goto(origin,{waitUntil:'load'});
if(await live.locator('[data-request-story]').count()){
 await live.locator('[data-request-canvas]').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
 report.livePilot=[];const shots=new Set();
 for(let sample=0;sample<34;sample++){
  await delay(2000);
  const state=await live.locator('[data-request-story]').evaluate(root=>({step:root.dataset.requestStep,state:root.dataset.requestState,grid:root.dataset.gridState,caseState:root.dataset.caseState,status:root.querySelector('[data-request-status]').textContent,packet:root.querySelector('[data-request-packet]').getAttribute('transform'),camera:root.querySelector('[data-request-camera]').getAttribute('transform')}));
  report.livePilot.push(state);
  if(!shots.has(state.step)){shots.add(state.step);await snapshot(live,'home-request-'+state.step,live.locator('[data-request-story]'));}
 }
 const caseStates=new Set(report.livePilot.map(s=>s.caseState));
 if(!['received','assigned','working','verified','closed'].every(s=>caseStates.has(s)))finding('/','Incident does not reach every operational state',report.livePilot);
 if(report.livePilot.some(s=>['2','3','4','5'].includes(s.step)&&s.grid!=='lost'))finding('/','Power incident clears before intervention',report.livePilot);
 if(new Set(report.livePilot.map(s=>s.step)).size!==8)finding('/','Request pilot does not tell its complete story without input',report.livePilot);
 if(new Set(report.livePilot.map(s=>s.packet)).size<5)finding('/','The request does not travel through the system',report.livePilot);
 const control=live.locator('[data-request-play]');await control.click();const paused=await live.locator('[data-request-packet]').getAttribute('transform');await delay(700);if(await live.locator('[data-request-packet]').getAttribute('transform')!==paused)finding('/','Request pause does not stop transport');
}else{
await live.locator('[data-atlas-theater]').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
report.liveOperation=[];
for(let sample=0;sample<16;sample++){
 await delay(2000);
 report.liveOperation.push(await live.locator('[data-service-atlas]').evaluate(root=>({code:root.dataset.activeService,phase:root.querySelector('[data-atlas-project]')?.dataset.operationPhase,state:root.dataset.storyState,signals:[...root.querySelectorAll('.sp-signal')].slice(0,2).map(node=>({offset:getComputedStyle(node).strokeDashoffset,animation:getComputedStyle(node).animationName,playState:getComputedStyle(node).animationPlayState}))})));
}
const nativeCodes=new Set(report.liveOperation.map(s=>s.code));
if(nativeCodes.size<2)finding('/','Native operation does not reach another service without input',report.liveOperation);
const transported=report.liveOperation.filter(s=>s.phase==='1').flatMap(s=>s.signals);
if(!transported.length||new Set(transported.map(s=>s.offset)).size<2||transported.some(s=>s.animation==='none'||s.playState!=='running'))finding('/','Operational signals do not move on native time',transported);
}
await live.close();await liveContext.close();
await live.video().saveAs(path.join(out,'home-operation-native.webm'));

// Accessibility preference is verified separately from the automatic story.
const reduced=await browser.newContext({viewport,reducedMotion:'reduce'}),quiet=await reduced.newPage();
await quiet.goto(origin,{waitUntil:'domcontentloaded'});await delay(1800);
if(await quiet.locator('[data-request-story]').count()){await quiet.locator('[data-request-canvas]').evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));await delay(400);if(await quiet.locator('[data-request-story]').getAttribute('data-request-state')!=='paused')finding('/','Request pilot ignores reduced motion');}
report.reducedMotion=await quiet.locator('[data-umc]').evaluate(root=>({paused:root.classList.contains('is-paused'),loaded:[...root.querySelectorAll('video')].some(v=>!!v.getAttribute('src'))}));
if(!report.reducedMotion.paused||report.reducedMotion.loaded)finding('/','Reduced motion does not keep the hero still',report.reducedMotion);
await reduced.close();await context.close();
// Inspect every home band at the design contract widths, not just the hero.
report.responsive=[];
for(const width of (profile==='desktop'?[1440,1280,834]:[390,360])){
 const layoutContext=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 const layoutPage=await layoutContext.newPage();await layoutPage.goto(origin,{waitUntil:'load'});
 for(const id of ['servicios-it','sectores','antecedentes-home','empresa','capacidad','producto','cobertura','blog-home']){
  const section=layoutPage.locator('#'+id);await section.evaluate(node=>node.scrollIntoView({block:'start',behavior:'instant'}));await delay(450);
  const geometry=await layoutPage.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  if(geometry.scrollWidth>width+2){
   const elements=await layoutPage.evaluate(()=>[...document.querySelectorAll('body *')].filter(node=>{const r=node.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&getComputedStyle(node).position!=='fixed';}).slice(-12).map(node=>({tag:node.tagName,class:node.getAttribute('class'),text:node.textContent.slice(0,80),right:node.getBoundingClientRect().right})));
   finding('/','Home section overflows at '+width,{id,...geometry,elements});
  }
  await layoutPage.screenshot({path:path.join(out,`home-${width}-${id}.png`),fullPage:false});
  report.responsive.push({width,section:id,...geometry});
 }
 await layoutPage.screenshot({path:path.join(out,`home-${width}-full.png`),fullPage:true});
 await layoutContext.close();
}
}
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({profile,pages:report.pages.length,findings:report.findings.length,movies:report.movieCoverage.length,out}));
if(process.env.VISUAL_AUDIT_STRICT==='1'&&report.findings.length)process.exitCode=1;
