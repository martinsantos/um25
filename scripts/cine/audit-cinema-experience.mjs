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
const routes=['/','/servicios','/sectores',...['constructoras','bodegas','salud','aeropuertos','industria','mineria','gobiernosectorpublico','seguridad-electronica','software'].map(s=>'/'+s),...servicePaths];
const report={profile,viewport,commit:process.env.GITHUB_SHA,pages:[],findings:[],movieCoverage:[],clock:'Native playback; narrative timers accelerated only in separate story pages'};
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
    if(state.state!=='playing'){finding(route,'Story cannot progress on its own while the drawing is visible',state);break;}
    const key=state.code+'-'+state.scene;
    if(!captured.has(key)&&(state.code===chapters[0].code||['object','detail'].includes(state.view))){
     captured.add(key);await delay(1550);
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
// Accessibility preference is verified separately from the automatic story.
const reduced=await browser.newContext({viewport,reducedMotion:'reduce'}),quiet=await reduced.newPage();
await quiet.goto(origin,{waitUntil:'domcontentloaded'});await delay(1800);
report.reducedMotion=await quiet.locator('[data-umc]').evaluate(root=>({paused:root.classList.contains('is-paused'),loaded:[...root.querySelectorAll('video')].some(v=>!!v.getAttribute('src'))}));
if(!report.reducedMotion.paused||report.reducedMotion.loaded)finding('/','Reduced motion does not keep the hero still',report.reducedMotion);
await reduced.close();await context.close();await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({profile,pages:report.pages.length,findings:report.findings.length,movies:report.movieCoverage.length,out}));
if(process.env.VISUAL_AUDIT_STRICT==='1'&&report.findings.length)process.exitCode=1;
