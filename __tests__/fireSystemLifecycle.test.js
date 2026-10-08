import fs from 'node:fs';
import {bindFirePrecision} from '../public/cine/fire-system-v1.js';
const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
let reduced,small,hidden;
function fixture(){
 document.body.innerHTML=`<section data-service-atlas data-story-state="playing"><div data-discipline-system data-visible="true" data-discipline-service="107" data-discipline-stage="-1">${fs.readFileSync('src/assets/cine/isometric/discipline-107-v2.svg','utf8')}</div></section>`;
 const root=document.querySelector('[data-discipline-system]');bindFirePrecision(root);return root;
}
beforeEach(()=>{
 jest.useFakeTimers();hidden=false;reduced={matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()};small={...reduced};
 window.matchMedia=jest.fn(query=>query.includes('max-width')?small:reduced);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();jest.restoreAllMocks();});
test('the hinged panel keeps its conductors attached through pause, resume and final inspection',async()=>{
 const root=fixture(),door=root.querySelector('.pf-door');root.dataset.disciplineStage='3';await settle();await jest.advanceTimersByTimeAsync(850);
 const before=door.getAttribute('transform');expect(before).not.toBe('matrix(0.8660254037844386 0.5 0 1 0 0)');
 root.parentElement.dataset.storyState='paused';await settle();await jest.advanceTimersByTimeAsync(4000);expect(door.getAttribute('transform')).toBe(before);expect(jest.getTimerCount()).toBe(0);
 root.parentElement.dataset.storyState='playing';await settle();await jest.advanceTimersByTimeAsync(2200);
 const [a,b]=door.getAttribute('transform').match(/[-\d.]+/g).map(Number),hx=450*Math.sqrt(3)/2*(-.26-.064),hy=450*(-.26+.064)/2;
 for(const ribbon of root.querySelectorAll('.pf-ribbon')){
  const i=Number(ribbon.dataset.conductor),values=ribbon.getAttribute('d').match(/[-\d.]+/g).map(Number),length=(.17+i*.0015)*450;
  expect(values.at(-2)).toBeCloseTo(hx+a*length,6);expect(values.at(-1)).toBeCloseTo(hy+b*length-.380*450,6);
 }
 expect(root.querySelector('.pf-door-front').getAttribute('opacity')).toBe('0');expect(root.querySelector('.pf-door-back').getAttribute('opacity')).toBe('1');expect(jest.getTimerCount()).toBe(0);
});
test('mobile focuses the current component, and hidden or changed services stop its motion',async()=>{
 small.matches=true;const root=fixture(),viewport=root.querySelector('.pf-viewport');root.dataset.disciplineStage='4';await settle();await jest.advanceTimersByTimeAsync(2800);expect(viewport.getAttribute('viewBox')).toBe('788 198 185 270');
 root.dataset.disciplineStage='1';await settle();await jest.advanceTimersByTimeAsync(600);hidden=true;document.dispatchEvent(new Event('visibilitychange'));const before=viewport.getAttribute('viewBox');
 await jest.advanceTimersByTimeAsync(4000);expect(viewport.getAttribute('viewBox')).toBe(before);expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));await jest.advanceTimersByTimeAsync(2400);expect(viewport.getAttribute('viewBox')).toBe('85 5 470 410');
 root.dataset.disciplineService='104';root.dataset.disciplineStage='3';await settle();expect(jest.getTimerCount()).toBe(0);
});
test('reduced motion gives one stable open drawing and disposal stops the pending animation',async()=>{
 reduced.matches=true;const root=fixture();expect(root.querySelector('.pf-door-back').getAttribute('opacity')).toBe('1');expect(root.querySelector('.pf-viewport').getAttribute('viewBox')).toBe('0 0 1000 650');expect(jest.getTimerCount()).toBe(0);
 reduced.matches=false;root.dataset.disciplineStage='0';await settle();await jest.advanceTimersByTimeAsync(350);document.dispatchEvent(new Event('astro:before-swap'));const before=root.querySelector('.pf-door').getAttribute('transform');
 root.dataset.disciplineStage='3';await settle();await jest.advanceTimersByTimeAsync(4000);expect(root.querySelector('.pf-door').getAttribute('transform')).toBe(before);expect(jest.getTimerCount()).toBe(0);
});

test('reusable detector geometry remains valid SVG when embedded in HTML',()=>{
 const root=fixture(),part=root.querySelector('#pf-detail-detector-cover');
 expect(part).not.toBeNull();expect(part.localName).toBe('g');expect(part.namespaceURI).toBe('http://www.w3.org/2000/svg');
});
