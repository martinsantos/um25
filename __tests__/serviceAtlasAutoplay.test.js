import {bindServiceAtlas} from '../public/cine/service-atlas-v12.js';
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

test('focus intent and hovering interactive geometry pause the clock before an unwanted transition',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();await jest.advanceTimersByTimeAsync(900);
 const slot=root.querySelector('[data-rack-slot]');slot.dispatchEvent(new Event('pointerover',{bubbles:true}));await jest.advanceTimersByTimeAsync(10000);expect(root.dataset.storyScene).toBe('0');expect(jest.getTimerCount()).toBe(0);
 slot.dispatchEvent(new Event('pointerout',{bubbles:true}));await jest.advanceTimersByTimeAsync(1700);expect(root.dataset.storyScene).toBe('1');
 const button=root.querySelector('[data-atlas-view="object"]');button.focus();await jest.advanceTimersByTimeAsync(20000);expect(root.dataset.storyState).toBe('exploring');expect(document.activeElement).toBe(button);
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


test('moving from another control to the play control releases a hover hold so explicit resume takes effect',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]'),play=root.querySelector('[data-atlas-play]');
 support.dispatchEvent(new Event('pointerover',{bubbles:true}));support.click();
 const leave=new Event('pointerout',{bubbles:true});Object.defineProperty(leave,'relatedTarget',{value:play});support.dispatchEvent(leave);
 play.click();await settle();expect(root.dataset.storyState).toBe('playing');expect(jest.getTimerCount()).toBe(1);
 await jest.advanceTimersByTimeAsync(6400);expect(root.querySelector('[data-atlas-view="object"]').getAttribute('aria-pressed')).toBe('true');
});


test('pointer exploration continues after reading time without an extra play click, while explicit pause persists',async()=>{
 const root=fixture();bindServiceAtlas(root);see();await settle();
 const support=root.querySelector('[data-atlas-service="105"]');
 support.dispatchEvent(new Event('pointerdown',{bubbles:true}));support.focus();support.click();support.blur();
 expect(root.dataset.activeService).toBe('105');expect(root.dataset.storyState).toBe('exploring');
 await jest.advanceTimersByTimeAsync(5999);expect(root.dataset.storyScene).toBe('0');
 await jest.advanceTimersByTimeAsync(6401);expect(root.dataset.storyScene).toBe('1');expect(root.dataset.storyState).toBe('playing');
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
