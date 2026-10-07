import {bindRequestSequence,requestFrame} from '../public/cine/request-sequence-v3.js';
import {REQUEST_SEQUENCE} from '../src/data/cine/requestSequence';
let observer,hidden,reduced;
function fixture(){document.body.innerHTML=`<article data-request-story><script data-request-script type="application/json">${JSON.stringify(REQUEST_SEQUENCE)}</script><button data-request-play></button><h3 data-request-title></h3><p data-request-copy></p><p data-request-role></p><span data-request-status></span><div data-request-canvas><svg><g data-request-camera><g data-request-packet></g></g></svg></div>${REQUEST_SEQUENCE.map(()=>'<li data-request-milestone></li>').join('')}</article>`;return document.querySelector('article');}
beforeEach(()=>{jest.useFakeTimers();hidden=false;reduced={matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()};window.matchMedia=jest.fn(()=>reduced);Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});window.IntersectionObserver=jest.fn(cb=>{observer=cb;return {observe:jest.fn(),disconnect:jest.fn()};});});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();});
test('all eight services explain one installation without user input',async()=>{
 const root=fixture();bindRequestSequence(root);observer([{isIntersecting:true,intersectionRatio:1}]);
 const states=[];
 for(let i=0;i<8;i++){await jest.advanceTimersByTimeAsync(i===0?50:8000);states.push(root.querySelector('[data-request-status]').textContent);expect(root.dataset.requestStep).toBe(String(i));expect(root.dataset.requestState).toBe('playing');}
 expect(states).toHaveLength(8);expect(new Set(states).size).toBe(8);expect(new Set(REQUEST_SEQUENCE.map(s=>s.code)).size).toBe(8);
 await jest.advanceTimersByTimeAsync(8000);expect(root.dataset.requestStep).toBe('0');expect(document.activeElement).toBe(document.body);
},10000);
test('signals move through continuous routes and the camera never jumps at a chapter boundary',()=>{
 for(let step=1;step<8;step++){
  const first=requestFrame(step*8000),middle=requestFrame(step*8000+3000),last=requestFrame(step*8000+7999);
  expect(first.point).not.toEqual(middle.point);
  const next=requestFrame((step+1)*8000);
  expect(Math.hypot(last.center[0]-next.center[0],last.center[1]-next.center[1])).toBeLessThan(.01);
 }
});
test('pause, offscreen and hidden tab preserve elapsed progress; pointer focus never gates playback',async()=>{
 const root=fixture(),dispose=bindRequestSequence(root);observer([{isIntersecting:true,intersectionRatio:1}]);await jest.advanceTimersByTimeAsync(11500);
 const button=root.querySelector('button');button.focus();button.click();const stopped=root.querySelector('[data-request-packet]').getAttribute('transform');await jest.advanceTimersByTimeAsync(30000);expect(root.dataset.requestStep).toBe('1');expect(root.querySelector('[data-request-packet]').getAttribute('transform')).toBe(stopped);
 button.click();await jest.advanceTimersByTimeAsync(4700);expect(root.dataset.requestStep).toBe('2');
 observer([{isIntersecting:false,intersectionRatio:0}]);await jest.advanceTimersByTimeAsync(30000);expect(root.dataset.requestStep).toBe('2');observer([{isIntersecting:true,intersectionRatio:1}]);
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));await jest.advanceTimersByTimeAsync(30000);expect(root.dataset.requestStep).toBe('2');hidden=false;document.dispatchEvent(new Event('visibilitychange'));await jest.advanceTimersByTimeAsync(8000);expect(root.dataset.requestStep).toBe('3');dispose();expect(jest.getTimerCount()).toBe(0);
});
test('reduced motion waits for an explicit start and cleans up on navigation',async()=>{reduced.matches=true;const root=fixture();bindRequestSequence(root);observer([{isIntersecting:true,intersectionRatio:1}]);await jest.advanceTimersByTimeAsync(10000);expect(root.dataset.requestState).toBe('paused');expect(jest.getTimerCount()).toBe(0);root.querySelector('button').click();await jest.advanceTimersByTimeAsync(8500);expect(root.dataset.requestStep).toBe('1');document.dispatchEvent(new Event('astro:before-swap'));expect(jest.getTimerCount()).toBe(0);expect(root.dataset.requestBound).toBeUndefined();});
