import { bindHardware } from '../public/cine/cine-studies-v5.js';
import { bindProductTour } from '../public/cine/product-tour-v5.js';
import { bindServicesStory } from '../public/cine/services-story-v5.js';
import { banner } from '../public/cine/cine-banner-v7.js';

let observers, preferences, media, frames, nextFrame;
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const visible = (target, value=true) => {
  for (const o of observers) if (o.targets.has(target)) o.callback([{target,isIntersecting:value,intersectionRatio:value?1:0}]);
};
const hidden = value => { Object.defineProperty(document,'hidden',{configurable:true,value});document.dispatchEvent(new Event('visibilitychange')); };
const reduced = () => { for (const p of preferences) {p.matches=true;p.listeners.forEach(fn=>fn({matches:true}));} };
const hardware = () => {
  document.body.innerHTML='<figure data-hardware-stage><img data-hw-image src="/whole.webp"><video data-src="/tour.mp4"></video><button data-hw-view data-image="/whole.webp" data-detail="Whole" aria-pressed="true">Equipo</button><button data-hw-view data-image="/detail.webp" data-detail="Detail">Puerto</button><button data-hw-motion></button><figcaption data-hw-caption>Whole</figcaption></figure>';
  return document.querySelector('figure');
};
const product = () => {
  document.body.innerHTML='<div data-pst data-tour="on"><span data-pst-path>/uno</span><button data-pst-motion></button><button data-pst-tab="uno" aria-pressed="true">Uno</button><button data-pst-tab="dos">Dos</button><section data-pst-panel="uno"></section><section data-pst-panel="dos" hidden></section></div>';
  return document.querySelector('[data-pst]');
};
beforeEach(() => {
  jest.useFakeTimers();document.body.innerHTML='';hidden(false);observers=[];preferences=[];media=new WeakMap();frames=new Map();nextFrame=0;
  global.IntersectionObserver=class {
    constructor(callback){this.callback=callback;this.targets=new Set();this.disconnect=jest.fn(()=>this.targets.clear());observers.push(this);}
    observe(target){this.targets.add(target);} unobserve(target){this.targets.delete(target);}
  };
  global.matchMedia=jest.fn(()=>{const p={matches:false,listeners:new Set(),addEventListener:(_,fn)=>p.listeners.add(fn),removeEventListener:(_,fn)=>p.listeners.delete(fn)};preferences.push(p);return p;});
  Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return media.get(this)!==false;}});
  jest.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){media.set(this,false);this.dispatchEvent(new Event('play'));this.dispatchEvent(new Event('playing'));return Promise.resolve();});
  jest.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){if(media.get(this)===false){media.set(this,true);this.dispatchEvent(new Event('pause'));}});
  jest.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
  global.Image=class { decode(){return Promise.resolve();} };
  global.requestAnimationFrame=jest.fn(fn=>{const id=++nextFrame;frames.set(id,fn);return id;});
  global.cancelAnimationFrame=jest.fn(id=>frames.delete(id));
  global.fetch=jest.fn(()=>Promise.resolve({ok:true,json:()=>Promise.resolve({frames:2,order:'linear',track:{},assets:[]})}));
  Object.defineProperty(document,'readyState',{configurable:true,value:'complete'});
});
afterEach(() => {
  document.dispatchEvent(new Event('astro:before-swap'));jest.clearAllTimers();jest.useRealTimers();
});

test('hardware loads a single movie only in view and preserves manual pause after visibility changes',async()=>{
  const root=hardware();bindHardware(root);const video=root.querySelector('video'),motion=root.querySelector('[data-hw-motion]');
  expect(video.hasAttribute('src')).toBe(false);visible(root);await settle();expect(video.getAttribute('src')).toBe('/tour.mp4');expect(video.paused).toBe(false);
  hidden(true);expect(video.paused).toBe(true);hidden(false);await settle();expect(video.paused).toBe(false);
  motion.click();visible(root,false);visible(root);await settle();expect(video.paused).toBe(true);expect(motion.textContent).toBe('Reproducir recorrido');
});
test('hardware respects reduced motion, offers explicit playback and handles decode errors',async()=>{
  const root=hardware();bindHardware(root);reduced();visible(root);await settle();const video=root.querySelector('video');expect(video.hasAttribute('src')).toBe(false);
  root.querySelector('[data-hw-motion]').click();await settle();expect(video.paused).toBe(false);
  video.dispatchEvent(new Event('error'));expect(root.classList.contains('is-playing')).toBe(false);expect(root.querySelector('[data-hw-motion]').textContent).toBe('Reproducir recorrido');
});
test('hardware keyboard selects the matching image and stale decodes cannot replace the latest view',async()=>{
  const root=hardware();bindHardware(root);const buttons=[...root.querySelectorAll('[data-hw-view]')];
  buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));await settle();
  expect(document.activeElement).toBe(buttons[1]);expect(root.querySelector('img').getAttribute('src')).toBe('/detail.webp');expect(root.querySelector('figcaption').textContent).toBe('Detail');
  const pending=[];global.Image=class {decode(){return new Promise(resolve=>pending.push(resolve));}};
  buttons[0].click();buttons[1].click();pending[1]();await settle();pending[0]();await settle();
  expect(root.querySelector('img').getAttribute('src')).toBe('/detail.webp');expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
});
test('product tours run only when visible and stop after selection, reduced motion and page disposal',()=>{
  const root=product();const cleanup=bindProductTour(root),tabs=[...root.querySelectorAll('[data-pst-tab]')];
  jest.advanceTimersByTime(10400);expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
  visible(root);jest.advanceTimersByTime(5200);expect(tabs[1].getAttribute('aria-pressed')).toBe('true');
  hidden(true);jest.advanceTimersByTime(10400);expect(tabs[1].getAttribute('aria-pressed')).toBe('true');
  hidden(false);tabs[0].click();jest.advanceTimersByTime(10400);expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
  root.querySelector('[data-pst-motion]').click();reduced();jest.advanceTimersByTime(10400);expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
  cleanup();expect(observers[0].disconnect).toHaveBeenCalled();expect(jest.getTimerCount()).toBe(0);
});
test('product sections are operable with arrows without scrolling the page',()=>{
  const root=product();bindProductTour(root);const tabs=[...root.querySelectorAll('[data-pst-tab]')],key=new KeyboardEvent('keydown',{key:'ArrowDown',cancelable:true});
  tabs[0].dispatchEvent(key);expect(key.defaultPrevented).toBe(true);expect(document.activeElement).toBe(tabs[1]);expect(root.querySelector('[data-pst-panel="dos"]').hidden).toBe(false);
});
test('home mounts no WebGL iframe until requested, frees it on close and pauses offscreen',async()=>{
  document.body.innerHTML='<div data-svc-story><div class="svc-story__stage" data-src="/3d/cinema.html"><div class="svc-story__frame"></div><video></video><button class="svc-story__motion"></button><button class="svc-story__mount"></button><p class="svc-story__now"><span></span></p><img data-poster-layer class="is-on" src="/whole.webp"><img data-poster-layer></div><li class="svc-story__item" data-cmd="[]" data-name="Redes" data-poster="/whole.webp" data-video="/tour.mp4"></li></div>';
  const root=document.querySelector('[data-svc-story]');bindServicesStory(root);const stage=root.querySelector('.svc-story__stage'),video=stage.querySelector('video'),mount=stage.querySelector('.svc-story__mount');
  expect(root.querySelector('iframe')).toBeNull();expect(video.hasAttribute('src')).toBe(false);visible(stage);await settle();expect(video.paused).toBe(false);
  mount.click();expect(root.querySelector('iframe')).not.toBeNull();expect(video.paused).toBe(true);mount.click();expect(root.querySelector('iframe')).toBeNull();
  await settle();visible(stage,false);expect(video.paused).toBe(true);
});
test('hero RAF stops offscreen and track identity follows variant cuts rather than the base scene',async()=>{
  document.body.innerHTML='<div data-umc data-scenes="fachada" data-variants="fachada:fachada-redes"><div class="umc-stage"><video class="umc-video"></video><video class="umc-video"></video><picture><source><img class="umc-poster"></picture><div class="umc-ar"></div></div><button data-umc-motion></button><span data-umc-caption></span></div>';
  const root=document.querySelector('[data-umc]');jest.spyOn(Math,'random').mockReturnValue(.99);const cleanup=banner(root);
  jest.advanceTimersByTime(600);expect(fetch).not.toHaveBeenCalled();expect(frames.size).toBe(0);
  visible(root);await settle();expect(root.querySelector('video').getAttribute('src')).toContain('fachada-redes');expect(fetch).toHaveBeenCalledWith('/cine/media/cine-fachada-redes-ar.json');expect(frames.size).toBe(1);
  visible(root,false);expect(frames.size).toBe(0);expect(root.querySelector('video').paused).toBe(true);
  visible(root);await settle();expect(frames.size).toBe(1);cleanup();expect(frames.size).toBe(0);
});

test('the cinematic hero starts without waiting for unrelated window load and binds after Astro swaps',async()=>{
 document.body.innerHTML='<div data-umc data-scenes="fachada"><div class="umc-stage"><video class="umc-video"></video><video class="umc-video"></video><img class="umc-poster"><div class="umc-ar"></div></div><button data-umc-motion></button></div>';
 Object.defineProperty(document,'readyState',{configurable:true,value:'loading'});
 const root=document.querySelector('[data-umc]');banner(root);visible(root);jest.advanceTimersByTime(600);await settle();
 expect(root.querySelector('video').paused).toBe(false);expect(root.dataset.cinematic).toBe('quiet');
 document.dispatchEvent(new Event('astro:before-swap'));expect(root.dataset.bound).toBeUndefined();expect(frames.size).toBe(0);
 document.dispatchEvent(new Event('astro:page-load'));expect(root.dataset.bound).toBe('true');
});


test('a moving equipment label hides before crossing hero copy even between label selection intervals',async()=>{
 document.body.innerHTML='<div data-umc data-scenes="bodega-label-test"><div class="umc-stage"><video class="umc-video"></video><video class="umc-video"></video><img class="umc-poster"><div class="umc-ar"></div></div><div class="umc-copy"><h1>Operación</h1><a href="/contacto">Contactar</a></div></div>';
 const root=document.querySelector('[data-umc]'),stage=root.querySelector('.umc-stage'),video=stage.querySelector('video');
 Object.defineProperty(root,'clientWidth',{configurable:true,value:1000});Object.defineProperty(stage,'clientWidth',{configurable:true,value:1000});Object.defineProperty(stage,'clientHeight',{configurable:true,value:600});
 const sceneRect={left:0,top:0,right:1000,bottom:600,width:1000,height:600};
 jest.spyOn(root,'getBoundingClientRect').mockReturnValue(sceneRect);jest.spyOn(stage,'getBoundingClientRect').mockReturnValue(sceneRect);
 jest.spyOn(root.querySelector('.umc-copy'),'getBoundingClientRect').mockReturnValue({left:0,top:200,right:600,bottom:550,width:600,height:350});
 fetch.mockResolvedValue({ok:true,json:()=>Promise.resolve({frames:2,fps:24,order:'linear',assets:[{id:'camera',system:'CCTV',name:'Cámara IP'}],track:{camera:[[.92,.6,true],[.72,.6,true]]}})});
 banner(root);root.querySelectorAll('.umc-tag__card').forEach(card=>{Object.defineProperty(card,'offsetWidth',{configurable:true,value:260});Object.defineProperty(card,'offsetHeight',{configurable:true,value:80});});
 visible(root);jest.advanceTimersByTime(600);for(let i=0;i<4;i++)await settle();
 const tick=now=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));};
 tick(2000);const label=root.querySelector('.umc-tag.is-on');expect(label).not.toBeNull();expect(label.classList.contains('is-obscured')).toBe(false);
 video.currentTime=1/24;tick(2100);expect(label.classList.contains('is-obscured')).toBe(true);expect(root.querySelectorAll('.umc-tag.is-on')).toHaveLength(1);
});


test('a still sector hero mounts no media, track fetch, animation clock or observer',async()=>{
 document.body.innerHTML='<div data-umc data-motion="still" data-scenes="fachada"><img class="umc-poster"></div>';
 banner(document.querySelector('[data-umc]'));await jest.advanceTimersByTimeAsync(30000);
 expect(observers).toHaveLength(0);expect(fetch).not.toHaveBeenCalled();expect(frames.size).toBe(0);expect(jest.getTimerCount()).toBe(0);
});


test('a single unannotated project movie plays natively without track fetches, overlay tags or a JS frame loop',async()=>{
 document.body.innerHTML='<div data-umc data-scenes="fachada-proyecto-v1" data-annotations="none"><div class="umc-stage"><video class="umc-video"></video><video class="umc-video"></video><img class="umc-poster"><div class="umc-ar"></div></div><button data-umc-motion></button></div>';
 const root=document.querySelector('[data-umc]');const cleanup=banner(root);visible(root);await jest.advanceTimersByTimeAsync(600);await settle();
 expect(root.querySelector('video').paused).toBe(false);expect(root.querySelectorAll('.umc-tag')).toHaveLength(0);expect(fetch).not.toHaveBeenCalled();expect(frames.size).toBe(0);
 visible(root,false);expect(root.querySelector('video').paused).toBe(true);cleanup();
});
