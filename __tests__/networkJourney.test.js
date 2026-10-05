import fs from 'node:fs';
import {bindNetworkJourney as bindRack} from '../public/cine/network-rack-v8.js';
import {bindNetworkJourney} from '../public/cine/network-journey-v7.js';

let intersections,reduced,hidden=false;
function fixture(){
 document.body.innerHTML=`<figure data-network-journey data-step="0"><span data-network-tag></span><button data-network-play aria-pressed="false">Ver recorrido <span>↗</span></button><h3 data-network-title></h3><p data-network-copy></p><p data-network-announce></p>${[0,1,2,3].map(i=>`<button data-network-select="${i}" data-title="Paso ${i}" data-copy="Detalle ${i}" data-tag="Estado ${i}">${i}</button>`).join('')}</figure>`;
 return document.querySelector('figure');
}
beforeEach(()=>{
 jest.useFakeTimers();hidden=false;reduced={matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()};
 window.matchMedia=jest.fn(()=>reduced);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.IntersectionObserver=jest.fn(callback=>{intersections=callback;return {observe:jest.fn(),disconnect:jest.fn()};});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();});

test('the narrative plays only while visible, stops after one pass and manual control cancels it',()=>{
 const root=fixture();bindNetworkJourney(root);
 jest.advanceTimersByTime(30000);expect(root.dataset.step).toBe('0');
 intersections([{isIntersecting:true}]);jest.advanceTimersByTime(3600);expect(root.dataset.step).toBe('1');
 intersections([{isIntersecting:false}]);jest.advanceTimersByTime(20000);expect(root.dataset.step).toBe('1');
 intersections([{isIntersecting:true}]);jest.advanceTimersByTime(4000);expect(root.dataset.step).toBe('2');
 jest.advanceTimersByTime(4600);expect(root.dataset.step).toBe('3');jest.advanceTimersByTime(4000);
 expect(root.querySelector('[data-network-play]').getAttribute('aria-pressed')).toBe('false');expect(jest.getTimerCount()).toBe(0);
 root.querySelector('[data-network-play]').click();root.querySelector('[data-network-select="2"]').click();
 jest.advanceTimersByTime(30000);expect(root.dataset.step).toBe('2');expect(jest.getTimerCount()).toBe(0);
});
test('background tabs and Astro disposal leave no scheduled work or old handlers',()=>{
 const root=fixture(),cleanup=bindNetworkJourney(root);intersections([{isIntersecting:true}]);
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(1);
 cleanup();expect(jest.getTimerCount()).toBe(0);root.querySelector('[data-network-select="3"]').click();expect(root.dataset.step).toBe('0');
 cleanup();expect(root.dataset.networkBound).toBeUndefined();
});
test('reduced motion disables autoplay but retains keyboard exploration and readable state',()=>{
 reduced.matches=true;const root=fixture();bindNetworkJourney(root);intersections([{isIntersecting:true}]);
 expect(jest.getTimerCount()).toBe(0);const first=root.querySelector('[data-network-select="0"]');
 const event=new KeyboardEvent('keydown',{key:'End',cancelable:true,bubbles:true});first.dispatchEvent(event);
 expect(event.defaultPrevented).toBe(true);expect(root.dataset.step).toBe('3');expect(document.activeElement.dataset.networkSelect).toBe('3');
 expect(root.querySelector('[data-network-announce]').textContent).toBe('Paso 3');
});
test('the same jack anatomy is reused in all 24 ports and the close-up without duplicate SVG IDs',()=>{
 const source=fs.readFileSync('src/assets/cine/isometric/network-journey-v7.svg','utf8');
 const xml=new DOMParser().parseFromString(source,'image/svg+xml');expect(xml.querySelector('parsererror')).toBeNull();
 expect(xml.querySelectorAll('[data-port]').length).toBe(24);expect(xml.querySelectorAll('[data-sfp]').length).toBe(4);
 expect(xml.querySelector('#nj-jack').querySelectorAll('[data-contact]').length).toBe(8);
 expect(xml.querySelectorAll('use[href="#nj-jack"]').length).toBe(25);
 const ids=[...xml.querySelectorAll('[id]')].map(e=>e.id);expect(new Set(ids).size).toBe(ids.length);
});


function rackFixture(){
 document.body.innerHTML=`<figure data-network-journey data-step="0"><span data-network-tag></span><button data-network-door>Abrir gabinete <span>↗</span></button><button data-network-play>Ver recorrido <span>↗</span></button><h3 data-network-title></h3><p data-network-copy></p><p data-network-announce></p><svg><g class="rk-focus"><use data-rack-base/><g class="rk-cover"><use data-rack-cover/></g></g><g class="rk-detail"><use data-rack-detail/></g><path data-rack-leader/>${['switch','fiber','ups'].map(id=>`<g data-rack-slot="${id}"></g>`).join('')}</svg>${[0,1,2,3].map(i=>`<button data-network-select="${i}">0${i+1} Vista ${i}</button>`).join('')}${['switch','fiber','ups'].map((id,i)=>`<button data-network-part="${id}" data-title="${id} equipo" data-copy="${id} descripción" data-construction="${id} abierto" data-inside="${id} interior" data-detail="${id} conexión" data-closeup="${id} detalle" data-slot-x="${i*10}" data-slot-y="${-i*20}" data-scale="1" data-lift-x="40" data-lift-y="-100" data-detail-scale=".8">${id}</button>`).join('')}</figure>`;
 return document.querySelector('figure');
}
test('rack opens once before the narrative and pauses completely outside the viewport',()=>{
 const root=rackFixture();bindRack(root);
 intersections([{isIntersecting:true,intersectionRatio:.1}]);jest.advanceTimersByTime(10000);expect(root.dataset.open).toBe('false');
 intersections([{isIntersecting:true,intersectionRatio:.6}]);jest.advanceTimersByTime(700);expect(root.dataset.open).toBe('true');expect(root.dataset.step).toBe('0');
 intersections([{isIntersecting:false,intersectionRatio:0}]);expect(jest.getTimerCount()).toBe(0);
 jest.advanceTimersByTime(9000);expect(root.dataset.step).toBe('0');
 intersections([{isIntersecting:true,intersectionRatio:.6}]);jest.advanceTimersByTime(3200+4000+4600+4000);
 expect(root.dataset.step).toBe('3');expect(jest.getTimerCount()).toBe(0);expect(root.querySelector('[data-network-play]').getAttribute('aria-pressed')).toBe('false');
});
test('selecting equipment cancels autoplay and keeps its exploded state and connection in sync',()=>{
 const root=rackFixture();const events=[];root.addEventListener('um:network-step',event=>events.push(event.detail));bindRack(root);
 intersections([{isIntersecting:true,intersectionRatio:.6}]);root.querySelector('[data-network-part="fiber"]').click();
 expect(root.dataset.step).toBe('1');expect(root.dataset.part).toBe('fiber');expect(root.dataset.open).toBe('true');expect(root.querySelector('[data-rack-cover]').getAttribute('href')).toBe('#rk-fiber-closed');
 root.querySelector('[data-network-select="2"]').click();expect(root.querySelector('[data-rack-cover]').getAttribute('href')).toBe('#rk-fiber-cover');
 root.querySelector('[data-network-part="ups"]').click();
 expect(root.dataset.step).toBe('2');expect(root.querySelector('[data-rack-base]').getAttribute('href')).toBe('#rk-ups-base');expect(root.querySelector('[data-network-title]').textContent).toBe('ups abierto');
 root.querySelector('[data-network-select="3"]').click();expect(root.querySelector('[data-rack-detail]').getAttribute('href')).toBe('#rk-ups-detail');expect(events.at(-1)).toMatchObject({title:'ups conexión',manual:true});
 jest.advanceTimersByTime(30000);expect(root.dataset.step).toBe('3');expect(jest.getTimerCount()).toBe(0);
});
test('reduced motion retains cabinet and keyboard controls without hover extraction or autoplay',()=>{
 reduced.matches=true;const root=rackFixture();bindRack(root);intersections([{isIntersecting:true,intersectionRatio:.9}]);
 expect(root.dataset.open).toBe('true');expect(jest.getTimerCount()).toBe(0);
 const first=root.querySelector('[data-network-part="switch"]');first.dispatchEvent(new KeyboardEvent('keydown',{key:'End',cancelable:true,bubbles:true}));
 expect(root.dataset.part).toBe('ups');expect(document.activeElement.dataset.networkPart).toBe('ups');expect(root.querySelector('[data-network-announce]').textContent).toBe('ups equipo');
 root.querySelector('[data-network-select="0"]').click();root.querySelector('[data-rack-slot="switch"]').dispatchEvent(new Event('pointerover',{bubbles:true}));expect(root.querySelector('[data-preview]')).toBeNull();
 root.querySelector('[data-network-door]').click();expect(root.dataset.open).toBe('false');
});
test('rack hover and all scheduled work are disposed during Astro navigation',()=>{
 const root=rackFixture(),cleanup=bindRack(root);root.querySelector('[data-network-door]').click();
 const slot=root.querySelector('[data-rack-slot="fiber"]');slot.dispatchEvent(new Event('pointerover',{bubbles:true}));expect(slot.hasAttribute('data-preview')).toBe(true);
 root.dispatchEvent(new Event('pointerleave'));expect(slot.hasAttribute('data-preview')).toBe(false);
 root.querySelector('[data-network-play]').click();intersections([{isIntersecting:true,intersectionRatio:.8}]);
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(1);
 cleanup();cleanup();expect(jest.getTimerCount()).toBe(0);expect(root.dataset.networkBound).toBeUndefined();
 root.querySelector('[data-network-part="ups"]').click();expect(root.dataset.part).toBe('switch');
});
test('the rack and nine isolated equipment views share complete, unique SVG models and connections',()=>{
 const source=fs.readFileSync('src/assets/cine/isometric/network-rack-v8.svg','utf8');const xml=new DOMParser().parseFromString(source,'image/svg+xml');expect(xml.querySelector('parsererror')).toBeNull();
 const ids=[...xml.querySelectorAll('[id]')].map(el=>el.id);expect(new Set(ids).size).toBe(ids.length);
 for(const use of xml.querySelectorAll('use'))expect(ids).toContain(use.getAttribute('href').slice(1));
 const manifest=JSON.parse(fs.readFileSync('src/assets/cine/isometric/network-rack-v8.json','utf8'));expect(manifest.models).toHaveLength(9);expect(xml.querySelectorAll('[data-rack-slot]')).toHaveLength(8);
 for(const {id} of manifest.models)for(const kind of ['base','cover','closed','full','detail'])expect(xml.getElementById(`rk-${id}-${kind}`)).not.toBeNull();
 expect(xml.querySelector('#rk-jack').querySelectorAll('[data-contact]')).toHaveLength(8);
 expect(xml.querySelector('#rk-switch-base').querySelectorAll('[data-port]')).toHaveLength(24);
 expect(xml.querySelector('#rk-switch-base').querySelectorAll('[data-sfp]')).toHaveLength(4);
 expect(xml.querySelector('#rk-panel-base').querySelectorAll('[data-patch-port]')).toHaveLength(24);
 expect(xml.querySelector('#rk-fiber-cover').querySelectorAll('[data-optical-adapter]')).toHaveLength(12);
 expect(xml.querySelector('#rk-pdu-base').querySelectorAll('[data-power-outlet]')).toHaveLength(8);
 expect(xml.querySelector('#rk-server-base').querySelectorAll('[data-drive]')).toHaveLength(8);
});


test('an open cabinet lets the same equipment be extracted by tapping its mounted module',()=>{
 const root=rackFixture();bindRack(root);root.querySelector('[data-network-door]').click();
 root.querySelector('[data-rack-slot="fiber"]').dispatchEvent(new Event('click',{bubbles:true}));
 expect(root.dataset.part).toBe('fiber');expect(root.dataset.step).toBe('1');
 expect(root.querySelector('[data-network-part="fiber"]').getAttribute('aria-pressed')).toBe('true');
 expect(root.querySelector('[data-network-title]').textContent).toBe('fiber equipo');expect(jest.getTimerCount()).toBe(0);
});
