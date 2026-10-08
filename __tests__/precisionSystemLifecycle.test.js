import fs from 'node:fs';
import {bindPrecisionSystem,bindDisciplineCamera} from '../public/cine/precision-systems-v6.js';
const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
let motion,small,hidden;
function fixture(){
 const svg=fs.readFileSync('src/assets/cine/isometric/discipline-101-v2.svg','utf8');
 document.body.innerHTML=`<section data-service-atlas data-story-state="playing"><div data-discipline-system data-visible="true" data-discipline-service="101" data-discipline-stage="-1">${svg}</div></section>`;
 const root=document.querySelector('[data-discipline-system]');bindPrecisionSystem(root);return root;
}
beforeEach(()=>{
 jest.useFakeTimers();hidden=false;
 motion={matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()};small={...motion};
 window.matchMedia=jest.fn(query=>query.includes('max-width')?small:motion);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();jest.restoreAllMocks();});

test('an opening inspection keeps every patch cord attached while pausing and resuming in place',async()=>{
 const root=fixture(),owner=root.parentElement,drawer=root.querySelector('.pn-switch-drawer'),door=root.querySelector('.pn-door');
 root.dataset.disciplineStage='3';await settle();await jest.advanceTimersByTimeAsync(900);
 const before=drawer.getAttribute('transform'),beforeDoor=door.getAttribute('transform');
 expect(before).not.toBe('translate(0 0)');
 owner.dataset.storyState='paused';await settle();await jest.advanceTimersByTimeAsync(5000);
 expect(drawer.getAttribute('transform')).toBe(before);expect(door.getAttribute('transform')).toBe(beforeDoor);expect(jest.getTimerCount()).toBe(0);
 owner.dataset.storyState='playing';await settle();await jest.advanceTimersByTimeAsync(2000);
 const translation=drawer.getAttribute('transform').match(/[-\d.]+/g).map(Number);
 for(const cord of root.querySelectorAll('.pn-cord')){
  const [x,y,z]=cord.dataset.end.split(' ').map(Number),values=cord.getAttribute('d').match(/[-\d.]+/g).map(Number);
  expect(values.at(-2)).toBeCloseTo(Math.sqrt(3)/2*(x-y)+translation[0],6);
  expect(values.at(-1)).toBeCloseTo((x+y)/2-z+translation[1],6);
 }
 expect(jest.getTimerCount()).toBe(0);
});

test('mobile inspection moves its viewport without changing another service and stops when hidden',async()=>{
 small.matches=true;const root=fixture(),viewport=root.querySelector('.pn-viewport');
 root.dataset.disciplineStage='4';await settle();await jest.advanceTimersByTimeAsync(2600);
 expect(viewport.getAttribute('viewBox')).toBe('550 342 245 240');
 root.dataset.disciplineService='104';root.dataset.disciplineStage='1';await settle();
 expect(jest.getTimerCount()).toBe(0);
 root.dataset.disciplineService='101';await settle();await jest.advanceTimersByTimeAsync(800);
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));const pose=viewport.getAttribute('viewBox');
 await jest.advanceTimersByTimeAsync(8000);expect(viewport.getAttribute('viewBox')).toBe(pose);expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));await jest.advanceTimersByTimeAsync(2600);
 expect(viewport.getAttribute('viewBox')).toBe('130 0 470 330');
});

test('reduced motion exposes a stable open cabinet and Astro disposal removes pending motion',async()=>{
 motion.matches=true;const root=fixture();expect(root.querySelector('.pn-switch-drawer').getAttribute('transform')).not.toBe('translate(0 0)');expect(jest.getTimerCount()).toBe(0);
 motion.matches=false;root.dataset.disciplineStage='0';await settle();await jest.advanceTimersByTimeAsync(400);
 document.dispatchEvent(new Event('astro:before-swap'));
 expect(jest.getTimerCount()).toBe(0);const before=root.querySelector('.pn-door').getAttribute('transform');root.dataset.disciplineStage='3';await settle();await jest.advanceTimersByTimeAsync(5000);
 expect(root.querySelector('.pn-door').getAttribute('transform')).toBe(before);
});

test('the software lens leaves all other discipline cameras alone',async()=>{
 for(const code of ['101','102','103','105','106','107','108']){
  document.body.innerHTML='<section data-service-atlas data-story-state="playing"><div data-discipline-system data-visible="true" data-discipline-service="'+code+'" data-discipline-stage="3"><svg viewBox="12 24 450 600"></svg></div></section>';
  const root=document.querySelector('[data-discipline-system]'),svg=root.querySelector('svg');
  const dispose=bindDisciplineCamera(root);
  expect(svg.getAttribute('viewBox')).toBe('12 24 450 600');
  root.dataset.disciplineStage='5';await Promise.resolve();
  expect(svg.getAttribute('viewBox')).toBe('12 24 450 600');dispose();
 }
});
