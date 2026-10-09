import fs from 'node:fs';
import {softwarePose,bindSoftwareSystem} from '../public/cine/software-system-v5.js';
let reduced=false;
const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
function fixture(stage=0){
 const drawing=fs.readFileSync('src/assets/cine/isometric/discipline-104-v5.svg','utf8');
 document.body.innerHTML=`<section data-service-atlas data-story-state="playing"><div data-discipline-system data-visible="true" data-discipline-service="104" data-discipline-stage="${stage}">${drawing}</div></section>`;
 const root=document.querySelector('[data-discipline-system]');bindSoftwareSystem(root);return root;
}
beforeEach(()=>{
 jest.useFakeTimers();reduced=false;
 global.matchMedia=()=>({get matches(){return reduced;},addEventListener:jest.fn(),removeEventListener:jest.fn()});
 global.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),16);
 global.cancelAnimationFrame=id=>clearTimeout(id);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();});
test('an operational request never travels through the release pipeline',()=>{
 const request=softwarePose(3,7000);
 expect(request.routes.slice(0,4)).toEqual([1,1,1,1]);
 expect(request.release).toBe(0);expect(request.routes[4]).toBe(0);
 const delivery=softwarePose(4,7000);expect(delivery.release).toBe(1);
 expect(delivery.routes[4]).toBe(1);
});
test('all three permissions open in order before the request leaves access control',()=>{
 const early=softwarePose(1,2300);expect(early.gates[0]).toBeGreaterThan(early.gates[1]);expect(early.gates[2]).toBe(0);expect(early.routes[1]).toBe(0);
 for(const ms of [3400,3700,4000,4100])expect(softwarePose(1,ms).routes[1]).toBe(0);
 expect(softwarePose(2,4200).routes[2]).toBe(0);
 expect(softwarePose(2,4200).mappings).toEqual([1,1,1]);
 const released=softwarePose(1,5000);expect(released.gates).toEqual([1,1,1]);expect(released.routes[1]).toBeGreaterThan(0);
});
test('the data response changes the same request in the original UI',async()=>{
 const root=fixture(3);expect(root.querySelector('[data-sw-ui-state]').textContent).toBe('En revisión');expect(root.querySelector('[data-sw-record-state]').textContent).toBe('En revisión');
 await jest.advanceTimersByTimeAsync(7000);
 expect(root.querySelector('[data-sw-ui-state]').textContent).toBe('Aprobada');
 expect(root.querySelector('[data-sw-submit]').textContent).toBe('Aprobada ✓');expect(root.querySelector('[data-sw-record-state]').textContent).toBe('Aprobada');
});
test('pause freezes the full mechanism and resumes without skipping the result',async()=>{
 const root=fixture(1),drawing=root.querySelector('.sw-system');await jest.advanceTimersByTimeAsync(2800);
 root.parentElement.dataset.storyState='paused';await settle();const before=drawing.innerHTML,time=drawing.dataset.operationTime;
 await jest.advanceTimersByTimeAsync(5000);expect(drawing.innerHTML).toBe(before);expect(drawing.dataset.operationTime).toBe(time);
 root.parentElement.dataset.storyState='playing';await settle();await jest.advanceTimersByTimeAsync(1000);
 expect(Number(drawing.dataset.operationTime)).toBeGreaterThan(Number(time));
});
test('switching service stops rendering and reduced motion shows a complete static result',async()=>{
 const root=fixture(2);await jest.advanceTimersByTimeAsync(900);root.dataset.disciplineService='101';await settle();const before=root.querySelector('.sw-system').innerHTML;
 await jest.advanceTimersByTimeAsync(3000);expect(root.querySelector('.sw-system').innerHTML).toBe(before);
 reduced=true;root.dataset.disciplineService='104';await settle();
 expect(root.querySelector('[data-sw-ui-state]').textContent).toBe('Aprobada');
 expect(root.querySelector('.sw-viewport').getAttribute('viewBox')).toBe('0 0 1200 650');
 const quiet=root.innerHTML;await jest.advanceTimersByTimeAsync(2000);expect(root.innerHTML).toBe(quiet);
});
