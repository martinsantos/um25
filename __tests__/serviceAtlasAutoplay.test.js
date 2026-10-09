import {bindServiceAtlas} from '../public/cine/service-atlas-v21.js';
import {operationScenes,operationOverview,overviewChapter} from '../src/data/cine/operationNarrative';
import {SERVICE_NARRATIVE} from '../src/data/cine/serviceNarrative';
import {EQUIPMENT_KITS,NETWORK_EQUIPMENT} from '../src/data/cine/networkAssembly';

let observers,hidden,reduced,preference,connection,OriginalImage;
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(){
 document.body.innerHTML=`<div data-service-atlas><script data-atlas-narrative type="application/json">${JSON.stringify(SERVICE_NARRATIVE)}</script><select data-atlas-picker>${SERVICE_NARRATIVE.map(c=>`<option value="${c.code}">${c.code}</option>`).join('')}</select><button data-atlas-play></button><span data-atlas-counter></span><p data-atlas-status></p><div class="svc-story__views">${['system','object','layers','detail'].map(view=>`<button data-atlas-view="${view}">${view}</button>`).join('')}</div><div data-atlas-theater><div data-atlas-network><figure data-network-journey><script data-network-kits type="application/json">${JSON.stringify(EQUIPMENT_KITS)}</script>${NETWORK_EQUIPMENT.map(part=>`<button data-network-part="${part.id}">${part.name}</button>`).join('')}<g data-rack-slot="switch" data-available></g></figure></div><div><img data-atlas-image src="/101-system.svg"><div data-atlas-operation="105"><figure data-isometric></figure></div><div data-atlas-operation="106"><figure data-isometric></figure></div><div data-atlas-software><section data-software-layers><div data-sl-canvas></div></section></div></div></div><h3 data-atlas-title></h3><p data-atlas-copy></p><p data-atlas-scene-title></p><p data-atlas-context></p><span data-atlas-code></span><a data-atlas-link>Explorar <span>→</span></a><p data-atlas-announce></p><details data-atlas-equipment><summary>Otras piezas</summary><select data-atlas-part></select></details>${SERVICE_NARRATIVE.map(chapter=>`<button data-atlas-service="${chapter.code}" ${EQUIPMENT_KITS[chapter.code]?`data-equipment-kit="${chapter.code}"`:''} data-name="Servicio ${chapter.code}" data-title="Resultado ${chapter.code}" data-copy="Alcance ${chapter.code}" data-system="/${chapter.code}-system.svg" data-object="/${chapter.code}-object.svg" data-detail="/${chapter.code}-detail.svg" data-context="Contexto" data-layers-copy="Interior" data-object-copy="Objeto" data-href="/servicios/${chapter.code}">${chapter.code}</button><span data-atlas-chapter="${chapter.code}"></span>`).join('')}</div>`;
 const root=document.querySelector('[data-service-atlas]');root.scrollIntoView=jest.fn();root.querySelector('[data-atlas-theater]').scrollIntoView=jest.fn();return root;
}
function see(ratio=.8){observers[0].callback([{isIntersecting:ratio>0,intersectionRatio:ratio}]);}
beforeEach(()=>{
 jest.useFakeTimers();observers=[];hidden=false;
 reduced={matches:false,addEventListener:jest.fn((_,callback)=>preference=callback),removeEventListener:jest.fn()};window.matchMedia=jest.fn(()=>reduced);
 connection={saveData:false,addEventListener:jest.fn(),removeEventListener:jest.fn()};Object.defineProperty(navigator,'connection',{configurable:true,value:connection});
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.IntersectionObserver=jest.fn(callback=>{const item={callback,observe:jest.fn(),disconnect:jest.fn()};observers.push(item);return item;});
 OriginalImage=window.Image;window.Image=class{decode(){return Promise.resolve();}};
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));window.Image=OriginalImage;jest.useRealTimers();jest.restoreAllMocks();});

test('the complete eight-service story starts on a visible drawing, progresses without clicks and stops once',async()=>{
 const root=fixture(),commands=[];root.addEventListener('um:network-story',e=>commands.push({...e.detail}),true);
 bindServiceAtlas(root);expect(observers[0].observe).toHaveBeenCalledWith(root.querySelector('[data-atlas-theater]'));
 await jest.advanceTimersByTimeAsync(60000);expect(jest.getTimerCount()).toBe(0);expect(root.dataset.activeService).toBe('101');
 see(.2);await settle();expect(jest.getTimerCount()).toBe(0);
 see();await settle();const seen=[];
 for(const chapter of SERVICE_NARRATIVE){
  seen.push(root.dataset.activeService);expect(root.querySelector('[data-atlas-link]').getAttribute('href')).toBe(`/servicios/${chapter.code}`);
  for(const scene of chapter.scenes){
   expect(root.querySelector(`[data-atlas-view="${scene.view}"]`).getAttribute('aria-pressed')).toBe('true');
   expect(root.querySelector('[data-atlas-context]').textContent).toBe(scene.copy);
   await jest.advanceTimersByTimeAsync(scene.duration);
  }
 }
 expect(seen).toEqual(['101','103','102','107','108','104','105','106']);expect(root.dataset.storyState).toBe('complete');expect(root.querySelector('[data-atlas-play]').textContent).toBe('Volver a ver');expect(jest.getTimerCount()).toBe(0);
 expect(commands.some(command=>command.code==='101'&&command.index===0&&command.open)).toBe(true);
 expect(commands.some(command=>command.code==='108'&&command.part==='ups'&&command.index===2)).toBe(true);
 expect(root.querySelector('[data-atlas-announce]').textContent).toBe('');expect(root.scrollIntoView).not.toHaveBeenCalled();expect(document.activeElement).toBe(document.body);
 root.querySelector('[data-atlas-play]').click();await settle();expect(root.dataset.activeService).toBe('101');expect(root.dataset.storyState).toBe('playing');
});

test('leaving the stage and hiding the document preserve the unplayed part of a scene',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();await jest.advanceTimersByTimeAsync(1000);
 see(0);expect(jest.getTimerCount()).toBe(0);await jest.advanceTimersByTimeAsync(90000);expect(root.dataset.storyScene).toBe('0');
 see();await jest.advanceTimersByTimeAsync(1599);expect(root.dataset.storyScene).toBe('0');await jest.advanceTimersByTimeAsync(1);expect(root.dataset.storyScene).toBe('1');
 await jest.advanceTimersByTimeAsync(1200);hidden=true;document.dispatchEvent(new Event('visibilitychange'));expect(jest.getTimerCount()).toBe(0);
 await jest.advanceTimersByTimeAsync(30000);hidden=false;document.dispatchEvent(new Event('visibilitychange'));
 await jest.advanceTimersByTimeAsync(2999);expect(root.dataset.storyScene).toBe('1');await jest.advanceTimersByTimeAsync(1);expect(root.dataset.storyScene).toBe('2');
});

test('manual choices hold the current service and view, then continue from that chapter without stealing focus',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]');support.focus();support.click();root.querySelector('[data-atlas-view="layers"]').click();
 expect(root.dataset.activeService).toBe('105');expect(root.querySelector('[data-atlas-operation="105"]').hidden).toBe(false);expect(root.querySelector('[data-isometric]').dataset.isoView).toBe('2');
 await jest.advanceTimersByTimeAsync(90000);expect(root.dataset.activeService).toBe('105');expect(jest.getTimerCount()).toBe(0);expect(document.activeElement).toBe(support);
 const play=root.querySelector('[data-atlas-play]');play.focus();play.click();await settle();expect(document.activeElement).toBe(play);
 await jest.advanceTimersByTimeAsync(7200);expect(root.querySelector('[data-atlas-view="detail"]').getAttribute('aria-pressed')).toBe('true');expect(root.dataset.activeService).toBe('105');
});

test('a resting pointer does not stall the story, while keyboard focus holds the current scene',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();await jest.advanceTimersByTimeAsync(900);
 const slot=root.querySelector('[data-rack-slot]');slot.dispatchEvent(new Event('pointerover',{bubbles:true}));
 await jest.advanceTimersByTimeAsync(1700);expect(root.dataset.storyScene).toBe('1');expect(root.dataset.storyState).toBe('playing');
 const button=root.querySelector('[data-atlas-view="object"]');button.focus();await jest.advanceTimersByTimeAsync(20000);
 expect(root.dataset.storyState).toBe('exploring');expect(document.activeElement).toBe(button);
});

test.each(['motion','data'])('%s preference disables automatic playback while explicit play and manual views remain available',async kind=>{
 if(kind==='motion')reduced.matches=true;else connection.saveData=true;
 const root=fixture();bindServiceAtlas(root);see();await jest.advanceTimersByTimeAsync(90000);expect(jest.getTimerCount()).toBe(0);expect(root.dataset.storyState).toBe('paused');
 root.querySelector('[data-atlas-view="layers"]').click();expect(root.querySelector('[data-atlas-view="layers"]').getAttribute('aria-pressed')).toBe('true');
 root.querySelector('[data-atlas-play]').click();await settle();expect(jest.getTimerCount()).toBe(1);
 if(kind==='motion')preference();else connection.addEventListener.mock.calls[0][1]();expect(jest.getTimerCount()).toBe(0);
});

test('changing equipment pauses the narrative; a queued image from another service cannot overwrite the choice',async()=>{
 const root=fixture();let resolve;
 window.Image=class{decode(){return new Promise(done=>resolve=done);}};
 bindServiceAtlas(root);see();await settle();
 root.querySelector('[data-atlas-service="104"]').click();root.querySelector('[data-atlas-service="102"]').click();
 resolve();await settle();expect(root.dataset.activeService).toBe('102');expect(root.querySelector('[data-atlas-network]').hidden).toBe(false);expect(root.querySelector('[data-atlas-image]').getAttribute('src')).toBe('/101-system.svg');
 const equipment=root.querySelector('[data-atlas-part]');equipment.value='switch';equipment.dispatchEvent(new Event('change',{bubbles:true}));
 const command=JSON.parse(root.querySelector('[data-network-journey]').dataset.networkStory);expect(command).toMatchObject({code:'102',part:'switch',index:1});expect(root.dataset.storyState).toBe('exploring');expect(jest.getTimerCount()).toBe(1);
});

test('software layers stay in the same drawing while navigation, content and actions receive their turn',async()=>{
 const root=fixture(),software=root.querySelector('[data-software-layers]'),commands=[];software.addEventListener('um:software-view',e=>commands.push({...e.detail}));
 bindServiceAtlas(root);see();await settle();root.querySelector('[data-atlas-service="104"]').click();root.querySelector('[data-atlas-play]').click();await settle();
 for(const scene of SERVICE_NARRATIVE.find(chapter=>chapter.code==='104').scenes)await jest.advanceTimersByTimeAsync(scene.duration);
 expect(commands.map(command=>command.layer)).toEqual([0,1,2,3]);expect(root.dataset.activeService).toBe('105');
});

test('Astro disposal clears clocks, listeners and observers, including a render awaiting image decode',async()=>{
 const root=fixture();let resolve;window.Image=class{decode(){return new Promise(done=>resolve=done);}};
 const cleanup=bindServiceAtlas(root);see();await settle();root.querySelector('[data-atlas-service="104"]').click();cleanup();cleanup();resolve();await settle();
 expect(root.dataset.bound).toBeUndefined();expect(jest.getTimerCount()).toBe(0);expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
 root.querySelector('[data-atlas-service="108"]').click();document.dispatchEvent(new Event('visibilitychange'));expect(root.dataset.activeService).toBe('104');expect(jest.getTimerCount()).toBe(0);
});


test('explicit resume from a pointer inspection continues immediately',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]'),play=root.querySelector('[data-atlas-play]');
 support.dispatchEvent(new Event('pointerover',{bubbles:true}));support.click();
 play.click();await settle();expect(root.dataset.storyState).toBe('playing');expect(jest.getTimerCount()).toBe(1);
 await jest.advanceTimersByTimeAsync(6400);expect(root.querySelector('[data-atlas-view="object"]').getAttribute('aria-pressed')).toBe('true');
});


test('pointer exploration continues after reading time without an extra play click, while explicit pause persists',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]');
 support.dispatchEvent(new Event('pointerover',{bubbles:true}));support.dispatchEvent(new Event('pointerdown',{bubbles:true}));support.focus();support.click();
 expect(root.dataset.activeService).toBe('105');expect(root.dataset.storyState).toBe('exploring');
 await jest.advanceTimersByTimeAsync(5999);expect(root.dataset.storyScene).toBe('0');
 await jest.advanceTimersByTimeAsync(6401);expect(root.dataset.storyScene).toBe('1');expect(root.dataset.storyState).toBe('playing');expect(document.activeElement).toBe(support);
 const play=root.querySelector('[data-atlas-play]');play.click();expect(root.dataset.storyState).toBe('paused');
 root.querySelector('[data-atlas-service="108"]').click();await jest.advanceTimersByTimeAsync(90000);
 expect(root.dataset.activeService).toBe('108');expect(root.dataset.storyScene).toBe('0');expect(root.dataset.storyState).toBe('paused');expect(jest.getTimerCount()).toBe(0);
});

test('keyboard exploration holds the content until focus leaves, then the story continues without another button',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]');support.focus();support.click();
 await jest.advanceTimersByTimeAsync(90000);expect(root.dataset.activeService).toBe('105');expect(root.dataset.storyScene).toBe('0');expect(document.activeElement).toBe(support);
 support.blur();await jest.advanceTimersByTimeAsync(12400);expect(root.dataset.storyScene).toBe('1');expect(root.dataset.storyState).toBe('playing');expect(document.activeElement).toBe(document.body);
});

test('a continuous project visits all eight services and returns to its beginning while remaining pausable',async()=>{
 const root=fixture();root.dataset.storyLoop='true';bindServiceAtlas(root);see();await settle();
 const duration=SERVICE_NARRATIVE.reduce((sum,c)=>sum+c.scenes.reduce((n,s)=>n+s.duration,0),0);
 await jest.advanceTimersByTimeAsync(duration);expect(root.dataset.activeService).toBe('101');expect(root.dataset.storyScene).toBe('0');expect(root.dataset.storyState).toBe('playing');
 root.querySelector('[data-atlas-play]').click();await jest.advanceTimersByTimeAsync(duration);
 expect(root.dataset.activeService).toBe('101');expect(root.dataset.storyScene).toBe('0');expect(root.dataset.storyState).toBe('paused');expect(jest.getTimerCount()).toBe(0);
});


test('a software-only story progresses with no unused hardware library mounted',async()=>{
 const root=fixture();root.querySelector('[data-atlas-network]').remove();
 root.querySelectorAll('[data-atlas-service]').forEach(button=>{if(button.dataset.atlasService!=='104')button.remove();});
 const project=document.createElement('div');project.dataset.atlasProject='';root.querySelector('[data-atlas-theater]').prepend(project);
 const frame=root.querySelector('[data-atlas-image]').parentElement;frame.hidden=true;
 bindServiceAtlas(root);see();await settle();expect(frame.dataset.atlasVisible).toBe('false');expect(frame.inert).toBe(true);
 await jest.advanceTimersByTimeAsync(SERVICE_NARRATIVE.find(c=>c.code==='104').scenes[0].duration);
 expect(root.dataset.activeService).toBe('104');expect(frame.hidden).toBe(false);expect(root.querySelector('[data-atlas-software]').hidden).toBe(false);
 expect(root.querySelector('[data-atlas-view="object"]').getAttribute('aria-pressed')).toBe('true');
});


test.each(['101','102','103','104','105','106','107','108'])('%s explains every connected layer by itself, with no hidden equipment boot or required clicks',async code=>{
 const root=fixture();root.querySelector('[data-atlas-narrative]').textContent=JSON.stringify([{code,scenes:operationScenes(code,undefined),overview:operationOverview(code)}]);
 const diagram=document.createElement('div');diagram.dataset.disciplineSystem='';diagram.innerHTML='<span data-discipline-key></span>'+[0,1,2,3,4,5].map(i=>`<g data-discipline-node="${i}"></g><g data-discipline-tag="${i}"></g><g data-discipline-route="${i}"></g>`).join('');root.querySelector('[data-atlas-theater]').append(diagram);
 const list=document.createElement('ol');list.innerHTML=[0,1,2].map(()=>'<li data-story-point><span class="svc-story__point-number"></span><h4 data-point-title></h4><p data-point-copy></p></li>').join('');root.append(list);
 const hardware=jest.fn();root.querySelector('[data-network-journey]').addEventListener('um:network-story',hardware);
 bindServiceAtlas(root);see();await settle();
 const geometry=[...diagram.children];
 for(const scene of operationScenes(code,undefined)){
  expect(root.dataset.disciplineActive).toBe('true');expect(diagram.dataset.visible).toBe('true');expect(diagram.dataset.disciplineStage).toBe(String(scene.disciplineStage));
  expect([...diagram.children]).toEqual(geometry);expect(root.querySelectorAll('[data-story-point]')).toHaveLength(6);
  expect(root.querySelector('[data-atlas-context]').textContent).toBe(scene.copy);
  if(scene.disciplineStage>=0&&scene.disciplineStage<6)expect(diagram.querySelector('[data-discipline-node][data-current="true"]').dataset.disciplineNode).toBe(String(scene.disciplineStage));
  await jest.advanceTimersByTimeAsync(scene.duration);
 }
 expect(hardware).not.toHaveBeenCalled();expect(root.dataset.storyState).toBe('complete');expect(jest.getTimerCount()).toBe(0);
 expect(document.activeElement).toBe(document.body);
});


test('a software architecture loops without retaining an unrelated physical project',async()=>{
 const root=fixture();root.dataset.storyLoop='true';
 const scenes=operationScenes('104',undefined);root.querySelector('[data-atlas-narrative]').textContent=JSON.stringify([{code:'104',scenes,overview:operationOverview('104')}]);
 const diagram=document.createElement('div');diagram.dataset.disciplineSystem='';diagram.innerHTML='<span data-discipline-key></span>';root.querySelector('[data-atlas-theater]').append(diagram);
 const flow=document.createElement('ol');flow.dataset.atlasFlow='';flow.innerHTML=[0,1,2].map(()=>'<li data-flow-node><span data-flow-label></span></li>').join('');root.append(flow);
 bindServiceAtlas(root);see();await settle();
 expect(root.querySelector('[data-atlas-project]')).toBeNull();
 for(let cycle=0;cycle<2;cycle++){
  for(const scene of scenes){expect(flow.querySelector('[data-state="current"] [data-flow-label]').textContent).toBe(scene.flow.nodes[scene.flow.phase]);await jest.advanceTimersByTimeAsync(scene.duration);}
  expect(root.dataset.storyScene).toBe('0');expect(root.dataset.storyState).toBe('playing');expect(root.dataset.disciplineActive).toBe('true');
 }
});

test('an equipment inspection describes the selected service before its lazy geometry arrives',async()=>{
 const root=fixture(),network=root.querySelector('[data-network-journey]');
 network.insertAdjacentHTML('beforeend','<h3 data-network-title>Texto anterior de Redes</h3><p data-network-copy>Descripción anterior de Redes</p>');
 for(const equipment of NETWORK_EQUIPMENT){const button=network.querySelector('[data-network-part="'+equipment.id+'"]');Object.assign(button.dataset,equipment);}
 bindServiceAtlas(root);see();await settle();
 root.querySelector('[data-atlas-service="108"]').click();
 const ups=NETWORK_EQUIPMENT.find(part=>part.id==='ups');
 for(const [view,title,copy] of [['object',ups.title,ups.copy],['layers',ups.construction,ups.inside],['detail',ups.detail,ups.closeup]]){
  root.querySelector('[data-atlas-view="'+view+'"]').click();await settle();
  expect(root.querySelector('[data-atlas-scene-title]').textContent).toBe(title);
  expect(root.querySelector('[data-atlas-context]').textContent).toBe(copy);
  expect(network.querySelector('svg')).toBeNull();
 }
});


test('a sector alternates its own installation and the service mechanism, without booting hidden equipment',async()=>{
 const root=fixture();root.dataset.contextProject='true';
 const chapter=overviewChapter({code:'101',scenes:operationScenes('101',['La red de la bodega.','Tanques, laboratorio y fraccionamiento.']),overview:operationOverview('101')});
 root.querySelector('[data-atlas-narrative]').textContent=JSON.stringify([chapter]);
 const project=document.createElement('div');project.dataset.atlasProject='';project.innerHTML='<svg><g class="sp-root"></g></svg>';root.querySelector('[data-atlas-theater]').append(project);
 const diagram=document.createElement('div');diagram.dataset.disciplineSystem='';diagram.innerHTML='<span data-discipline-key></span>';root.querySelector('[data-atlas-theater]').append(diagram);
 const hardware=jest.fn();root.querySelector('[data-network-journey]').addEventListener('um:network-story',hardware);
 bindServiceAtlas(root);see();await settle();
 for(const scene of chapter.scenes){
  expect(diagram.dataset.visible).toBe(String(scene.view!=='system'));
  expect(root.querySelector('[data-atlas-context]').textContent).toBe(scene.copy);
  expect(project.dataset.projectService).toBe('101');
  await jest.advanceTimersByTimeAsync(scene.duration);
 }
 expect(hardware).not.toHaveBeenCalled();expect(root.dataset.storyState).toBe('complete');
});

test('the index reaches all eight services in under three minutes, preserving context and all six visible layer descriptions',()=>{
 const codes=['101','102','103','104','105','106','107','108'];
 const chapters=codes.map(code=>overviewChapter({code,scenes:operationScenes(code,['Contexto del sector','La operación concreta.']),overview:operationOverview(code)}));
 expect(chapters.reduce((sum,c)=>sum+c.scenes.reduce((n,s)=>n+s.duration,0),0)).toBeLessThan(180000);
 for(const c of chapters){
  expect(c.scenes[0].title).toBe('Contexto del sector');expect(c.scenes.map(s=>s.flow.phase)).toEqual([0,1,2]);
  expect(c.scenes[1].disciplineStage).toBeGreaterThanOrEqual(0);expect(c.scenes[1].disciplineStage).toBeLessThan(6);
  expect(c.overview).toHaveLength(6);expect(operationScenes(c.code).map(s=>s.disciplineStage)).toEqual([-1,0,1,2,3,4,5,6]);
 }
});

test('focusing playback preserves its pointer target until the click changes playback',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const play=root.querySelector('[data-atlas-play]'),label=play.firstChild;
 play.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));play.focus();
 expect(play.firstChild).toBe(label);
 play.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));play.click();
 expect(root.dataset.storyState).toBe('paused');expect(play.textContent).toBe('Reproducir');
});
