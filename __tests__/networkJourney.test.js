import fs from 'node:fs';
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
