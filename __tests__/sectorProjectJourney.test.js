import fs from 'node:fs';
import {sectorProject} from '../src/data/cine/sectorNarrative';
import {bindServiceAtlas} from '../public/cine/service-atlas-v17.js';
import {EQUIPMENT_KITS,NETWORK_EQUIPMENT} from '../src/data/cine/networkAssembly';
const model=JSON.parse(fs.readFileSync('src/assets/cine/isometric/site-projects-v1.json','utf8'));
const project=sectorProject('constructoras','fachada',['101','102','103','106','107','108']);
let observer,hidden;
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(){
 document.body.innerHTML=`<div data-service-atlas><script data-atlas-narrative type="application/json">${JSON.stringify(project.chapters)}</script><div class="svc-story__list">${project.chapters.map(c=>`<button data-atlas-service="${c.code}" data-name="Servicio ${c.code}" data-equipment-kit="${EQUIPMENT_KITS[c.code]?c.code:''}" data-title="Alcance ${c.code}" data-copy="Alcance ${c.code}" data-href="/servicios/${c.code}">${c.code}</button>`).join('')}</div><button data-atlas-play></button><span data-atlas-status></span><span data-atlas-counter></span><div class="svc-story__views">${['system','object','layers','detail'].map(v=>`<button data-atlas-view="${v}">${v}</button>`).join('')}</div><div data-atlas-theater><div data-atlas-project>${fs.readFileSync('src/assets/cine/isometric/site-building-v1.svg','utf8')}</div><div data-atlas-network><figure data-network-journey><script data-network-kits type="application/json">${JSON.stringify(EQUIPMENT_KITS)}</script>${NETWORK_EQUIPMENT.map(p=>`<button data-network-part="${p.id}">${p.name}</button>`).join('')}</figure></div><div><img data-atlas-image src="/original.svg"><div data-atlas-operation="106"><figure data-isometric></figure></div></div></div><ol data-atlas-flow>${[0,1,2].map(i=>`<li data-flow-node><span data-flow-label></span></li>`).join('')}</ol><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><p data-atlas-scene-title></p><p data-atlas-context></p><a data-atlas-link>Explorar <span>→</span></a><p data-atlas-announce></p><details data-atlas-equipment><select data-atlas-part></select></details></div>`;
 const root=document.querySelector('[data-service-atlas]');root.querySelector('.svc-story__list').scrollTo=jest.fn();return root;
}
beforeEach(()=>{
 jest.useFakeTimers();hidden=false;
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.matchMedia=jest.fn(()=>({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()}));
 window.IntersectionObserver=jest.fn(cb=>{observer=cb;return {observe:jest.fn(),disconnect:jest.fn()};});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.useRealTimers();jest.restoreAllMocks();});

test('Constructoras follows the six services of its project, with optical fiber in the building riser',()=>{
 expect(project.chapters.map(c=>c.code)).toEqual(['101','103','108','102','107','106']);
 expect(project.chapters.at(-1).scenes.at(-1).copy).toContain('Última Milla');
 const fiber=project.chapters.find(c=>c.code==='103');expect(fiber.scenes.every(s=>s.part==='fiber')).toBe(true);
 expect(fiber.scenes.map(s=>s.view)).toEqual(['system','system','system']);
 expect(fiber.scenes.map(s=>s.flow.phase)).toEqual([0,1,2]);
 expect(fiber.scenes[1].copy).toContain('distribuidor óptico');expect(fiber.scenes[1].copy).not.toContain('radio');
});

test.each(model.scenes.map(s=>[s.id,s]))('%s has a detailed valid SVG and exact equal-axis projection from shared physical geometry',(id,scene)=>{
 const svg=new DOMParser().parseFromString(fs.readFileSync(`src/assets/cine/isometric/site-${id}-v1.svg`,'utf8'),'image/svg+xml');
 expect(svg.querySelector('parsererror')).toBeNull();expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 1200 720');
 expect(svg.querySelectorAll('.sp-root')).toHaveLength(1);expect(svg.querySelector('image')).toBeNull();
 expect(scene.boxes.length).toBeGreaterThan(150);expect(svg.querySelectorAll('polygon').length).toBe(scene.faceCount);
 const {c,s,scale}=scene.projection;
 expect(Math.atan2(s,c)*180/Math.PI).toBeCloseTo(30,10);
 expect(Math.hypot(c*scale,s*scale)).toBeCloseTo(scale,10);
 for(const code of project.chapters.map(c=>c.code))expect(svg.querySelector(`[data-project-pin="${code}"]`)).not.toBeNull();
 const ids=[...svg.querySelectorAll('[id]')].map(n=>n.id);expect(new Set(ids).size).toBe(ids.length);
 for(const b of scene.boxes)expect(Math.min(b.w,b.d,b.h)).toBeGreaterThan(0);
});

test('one persistent building progresses through all six services without replacing its geometry or loading bitmap frames',async()=>{
 const root=fixture(),drawing=root.querySelector('.sp-root'),geometry=[...drawing.querySelectorAll('polygon')];
 const image=jest.spyOn(window,'Image');bindServiceAtlas(root);
 observer([{isIntersecting:true,intersectionRatio:1}]);await settle();
 for(const chapter of project.chapters){
  expect(root.dataset.activeService).toBe(chapter.code);
  for(const scene of chapter.scenes){
   expect(root.querySelector('.sp-root')).toBe(drawing);expect([...drawing.querySelectorAll('polygon')]).toEqual(geometry);
   expect(root.querySelector('[data-atlas-project]').dataset.operationPhase).toBe(String(scene.flow.phase));
   expect(root.querySelector('[data-flow-node][data-state="current"] [data-flow-label]').textContent).toBe(scene.flow.nodes[scene.flow.phase]);
   expect(root.querySelector('[data-atlas-project]').dataset.projectView).toBe(String({system:0,object:1,layers:2,detail:3}[scene.view]));
   if(scene.view==='system')expect(root.querySelector('[data-atlas-network]').hidden).toBe(true);
   if(scene.view==='object'&&EQUIPMENT_KITS[chapter.code])expect(root.querySelector('[data-atlas-network]').hidden).toBe(false);
   expect(root.querySelector('[data-atlas-flow]').hidden).toBe(false);
   await jest.advanceTimersByTimeAsync(scene.duration);
  }
 }
 expect(root.dataset.storyState).toBe('complete');expect(jest.getTimerCount()).toBe(0);expect(image).not.toHaveBeenCalled();
});

test('project visibility stops the route clock and manual inspection preserves the building context',async()=>{
 const root=fixture();bindServiceAtlas(root);observer([{isIntersecting:true,intersectionRatio:1}]);await settle();
 await jest.advanceTimersByTimeAsync(2000);hidden=true;document.dispatchEvent(new Event('visibilitychange'));
 expect(root.querySelector('[data-atlas-project]').dataset.projectVisible).toBe('false');expect(jest.getTimerCount()).toBe(0);
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));await jest.advanceTimersByTimeAsync(3600);
 expect(root.querySelector('[data-atlas-project]').dataset.projectOpen).toBe('true');
 root.querySelector('[data-atlas-view="object"]').click();expect(root.querySelector('[data-atlas-project]').dataset.projectView).toBe('1');
 expect(root.querySelector('[data-atlas-network]').hidden).toBe(false);expect(root.querySelector('[data-project-leader]').getAttribute('d')).toMatch(/^M/);
 root.querySelector('[data-atlas-service="103"]').click();expect(root.querySelector('[data-atlas-context]').textContent).toContain('cuarto técnico');
 expect(root.querySelector('[data-atlas-network]').hidden).toBe(true);expect(root.dataset.storyState).toBe('exploring');
 const drawing=root.querySelector('.sp-root');
 const chapter=project.chapters.find(chapter=>chapter.code==='103');
 await jest.advanceTimersByTimeAsync(6000+chapter.scenes[0].duration+chapter.scenes[1].duration);
 expect(root.dataset.activeService).toBe('103');expect(root.querySelector('[data-atlas-project]').dataset.projectView).toBe('0');expect(root.querySelector('.sp-root')).toBe(drawing);
 expect(root.querySelector('[data-atlas-project]').dataset.operationPhase).toBe('2');
});

test('the integrated sector template uses one project, with no repeated movie rail, legacy interactive scene or duplicate service grid',()=>{
 const source=fs.readFileSync('src/components/templates/SectorTemplateUM26.astro','utf8');
 expect((source.match(/<SectorJourney /g)||[]).length).toBe(1);
 expect(source).not.toContain('<SceneServiceRail');expect(source).not.toContain('<SystemsStory');
 expect(source).not.toContain('aria-label="Servicios aplicados"');
});


test('a single-service infographic keeps explaining its operation without waiting for another click',async()=>{
 const root=fixture();const single=sectorProject('salud','hospital',['108']);
 root.querySelector('[data-atlas-narrative]').textContent=JSON.stringify(single.chapters);root.dataset.storyLoop='true';
 const dispose=bindServiceAtlas(root);observer([{isIntersecting:true,intersectionRatio:1}]);await settle();
 const projectNode=root.querySelector('[data-atlas-project]');
 expect(projectNode.querySelectorAll('.sp-signal').length).toBeGreaterThan(0);
 for(let cycle=0;cycle<2;cycle++)for(const scene of single.chapters[0].scenes){
  expect(root.dataset.activeService).toBe('108');expect(projectNode.dataset.operationPhase).toBe(String(scene.flow.phase));
  expect(root.dataset.storyState).toBe('playing');await jest.advanceTimersByTimeAsync(scene.duration);
 }
 expect(projectNode.dataset.operationPhase).toBe('0');
 root.querySelector('[data-atlas-play]').click();await jest.advanceTimersByTimeAsync(30000);
 expect(projectNode.dataset.operationPhase).toBe('0');expect(root.dataset.storyState).toBe('paused');
 dispose();expect(projectNode.querySelector('.sp-operation')).toBeNull();expect(jest.getTimerCount()).toBe(0);
});
