import fs from 'node:fs';
import {bindIsometric} from '../public/cine/isometric-services-v7.js';
import {bindServiceAtlas} from '../public/cine/service-atlas-v18.js';

let visible, hidden, reduced, motion;
const fixture=()=>{
 document.body.innerHTML=`<figure data-isometric data-iso-code="105" data-iso-view="1"><button data-iso-play aria-pressed="false">Ver recorrido</button><div data-iso-panel="system" hidden></div><div data-iso-panel="object"><i class="iso-operation-layer"></i></div><div data-iso-panel="detail" hidden></div><h3 data-iso-title>Consola</h3><p data-iso-description>Señal</p><b data-iso-step>02</b>${['Sistema','Consola','Capas','Aviso'].map((name,i)=>`<button data-iso-select="${i}" data-title="${name}" data-description="Descripción ${i}" aria-pressed="${i===1}">${name}</button>`).join('')}</figure>`;
 return document.querySelector('figure');
};
beforeEach(()=>{
 jest.useFakeTimers();hidden=false;reduced={matches:false,addEventListener:jest.fn((_,fn)=>motion=fn),removeEventListener:jest.fn()};
 window.matchMedia=jest.fn(()=>reduced);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.IntersectionObserver=jest.fn(callback=>{visible=callback;return {observe:jest.fn(),disconnect:jest.fn()};});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();jest.restoreAllMocks();});
test('the service story waits for intent and gives each phase enough reading time, then stops',()=>{
 const root=fixture();bindIsometric(root);visible([{isIntersecting:true}]);
 jest.advanceTimersByTime(60000);expect(root.dataset.isoView).toBe('1');expect(jest.getTimerCount()).toBe(0);
 root.querySelector('[data-iso-play]').click();expect(root.dataset.isoView).toBe('0');
 jest.advanceTimersByTime(6399);expect(root.dataset.isoView).toBe('0');jest.advanceTimersByTime(1);expect(root.dataset.isoView).toBe('1');
 jest.advanceTimersByTime(6400);expect(root.dataset.isoView).toBe('2');expect(root.classList.contains('is-open')).toBe(true);
 jest.advanceTimersByTime(7200);expect(root.dataset.isoView).toBe('3');jest.advanceTimersByTime(6400);
 expect(root.querySelector('[data-iso-play]').getAttribute('aria-pressed')).toBe('false');expect(jest.getTimerCount()).toBe(0);
});
test('moving from assembled object to open layers preserves the drawing instead of re-entering it',()=>{
 const root=fixture();bindIsometric(root);root.querySelector('[data-iso-select="2"]').click();
 const object=root.querySelector('[data-iso-panel="object"]');expect(object.hidden).toBe(false);expect(object.classList.contains('is-entering')).toBe(false);
 expect(root.classList.contains('is-open')).toBe(true);root.querySelector('[data-iso-select="1"]').click();expect(root.classList.contains('is-open')).toBe(false);
});
test('visibility, manual choice, reduced motion and navigation cancel scheduled story work',()=>{
 const root=fixture(),cleanup=bindIsometric(root);visible([{isIntersecting:true}]);root.querySelector('[data-iso-play]').click();
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(1);
 visible([{isIntersecting:false}]);jest.advanceTimersByTime(30000);expect(root.dataset.isoView).toBe('0');expect(jest.getTimerCount()).toBe(0);
 visible([{isIntersecting:true}]);root.querySelector('[data-iso-select="2"]').click();expect(jest.getTimerCount()).toBe(0);
 root.querySelector('[data-iso-play]').click();reduced.matches=true;motion();expect(jest.getTimerCount()).toBe(0);expect(root.querySelector('[data-iso-play]').hidden).toBe(true);
 root.querySelector('[data-iso-select="3"]').click();expect(root.dataset.isoView).toBe('3');cleanup();cleanup();root.querySelector('[data-iso-select="0"]').click();expect(root.dataset.isoView).toBe('3');expect(root.dataset.bound).toBeUndefined();
});
test('operation drawings retain separate layers, project context and native vector detail without ID collisions',()=>{
 const manifest=JSON.parse(fs.readFileSync('src/assets/cine/isometric/operations-v7.json','utf8'));expect(manifest.files).toHaveLength(6);
 for(const file of manifest.files){
  const source=fs.readFileSync('src/assets/cine/isometric/'+file.file,'utf8');
  const xml=new DOMParser().parseFromString(source,'image/svg+xml');expect(xml.querySelector('parsererror')).toBeNull();
  const ids=[...xml.querySelectorAll('[id]')].map(el=>el.id);expect(new Set(ids).size).toBe(ids.length);
  expect(xml.documentElement.getAttribute('role')).toBe('img');expect(xml.querySelector('image')).toBeNull();
  if(file.file.endsWith('-object.svg'))expect(xml.querySelectorAll('[data-operation-layer]')).toHaveLength(3);
 }
});

test('home and service share the same live layers; changing service clears an unsupported layer view',()=>{
 document.body.innerHTML=`<div data-service-atlas><div class="svc-story__views">${['object','system','layers'].map(view=>`<button data-atlas-view="${view}">${view}</button>`).join('')}</div><div><img data-atlas-image src="/101.svg"><div data-atlas-operation="105" hidden></div></div><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><a data-atlas-link>Explorar <span>→</span></a><p data-atlas-context></p>${['101','105','104'].map(code=>`<button data-atlas-service="${code}" data-object="/${code}.svg" data-system="/${code}-system.svg" data-name="Servicio ${code}" data-title="Servicio ${code}" data-copy="Introducción" data-object-copy="Herramienta" data-context="Proyecto" data-layers-copy="Señal, diagnóstico y respuesta" data-href="/servicios/${code}">${code}</button>`).join('')}</div>`;
 const atlas=document.querySelector('[data-service-atlas]'),operation=atlas.querySelector('[data-atlas-operation]');const template=fixture().outerHTML;
 document.body.innerHTML=atlas.outerHTML;const root=document.querySelector('[data-service-atlas]'),container=root.querySelector('[data-atlas-operation]');container.innerHTML=template;
 bindIsometric(container.querySelector('[data-isometric]'));bindServiceAtlas(root);
 root.querySelector('[data-atlas-service="105"]').click();root.querySelector('[data-atlas-view="layers"]').click();
 expect(container.hidden).toBe(false);expect(container.querySelector('[data-isometric]').classList.contains('is-open')).toBe(true);expect(root.querySelector('[data-atlas-image]').hidden).toBe(true);
 expect(root.querySelector('[data-atlas-context]').textContent).toBe('Señal, diagnóstico y respuesta');
 root.querySelector('[data-atlas-service="104"]').click();expect(container.hidden).toBe(true);expect(root.querySelector('[data-atlas-view="layers"]').hidden).toBe(true);expect(root.querySelector('[data-atlas-view="object"]').getAttribute('aria-pressed')).toBe('true');
});
test('an atlas view requested before its async controller binds is retained without a second click',()=>{
 const root=fixture();root.dataset.isoView='2';bindIsometric(root);expect(root.classList.contains('is-open')).toBe(true);
 expect(root.querySelector('[data-iso-step]').textContent).toBe('03');expect(root.querySelector('[data-iso-select="2"]').getAttribute('aria-pressed')).toBe('true');
});

test('a manual view keeps the drawing visible on a short screen while preserving focus',()=>{
 const root=fixture(),frame=document.createElement('div'),controls=document.createElement('div');
 frame.className='iso__frame';controls.className='iso__controls';
 for(const panel of root.querySelectorAll('[data-iso-panel]'))frame.append(panel);
 for(const button of root.querySelectorAll('[data-iso-select]'))controls.append(button);
 root.append(controls,frame);frame.getBoundingClientRect=()=>({top:700,bottom:1000});controls.scrollIntoView=jest.fn();
 bindIsometric(root);const layers=root.querySelector('[data-iso-select="2"]');layers.focus();layers.click();
 expect(controls.scrollIntoView).toHaveBeenCalledWith({block:'start',behavior:'smooth'});expect(document.activeElement).toBe(layers);expect(root.dataset.isoView).toBe('2');
});
