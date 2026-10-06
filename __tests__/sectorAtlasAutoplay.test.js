import {bindSectorAtlas} from '../public/cine/sector-atlas-v2.js';
let observe,hidden,paused,ended,reduced,play;
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(){
 document.body.innerHTML='<div data-sector-atlas><div class="um-atlas__stage"><video></video><span class="um-atlas__now"><span>Salud</span></span><button class="um-atlas__motion"></button></div><ol class="um-atlas__list"><li><a href="/salud" data-scene="hospital-proyecto-v3" data-title="Salud">Salud</a></li><li><a href="/aeropuertos" data-scene="aeropuerto-proyecto-v3" data-title="Aeropuertos">Aeropuertos</a></li><li><a href="/constructoras" data-scene="fachada-proyecto-v2" data-title="Constructoras">Constructoras</a></li></ol><img data-poster="hospital-proyecto-v3"><img data-poster="aeropuerto-proyecto-v3"><img data-poster="fachada-proyecto-v2"></div>';
 const root=document.querySelector('[data-sector-atlas]'),video=root.querySelector('video');
 Object.defineProperty(video,'paused',{get:()=>paused});Object.defineProperty(video,'ended',{get:()=>ended});
 play=jest.spyOn(video,'play').mockImplementation(()=>{paused=false;return Promise.resolve();});
 jest.spyOn(video,'pause').mockImplementation(()=>{paused=true;});
 return root;
}
beforeEach(()=>{
 hidden=false;paused=true;ended=false;reduced=false;
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 window.matchMedia=jest.fn(()=>({matches:reduced,addEventListener:jest.fn(),removeEventListener:jest.fn()}));
 window.IntersectionObserver=jest.fn(cb=>{observe=cb;return {observe:jest.fn(),disconnect:jest.fn()};});
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.restoreAllMocks();});

test('the sector journey plays when visible and visits the next sector on native video completion without clicks',async()=>{
 const root=fixture(),video=root.querySelector('video');bindSectorAtlas(root);
 expect(video.getAttribute('src')).toBeNull();observe([{intersectionRatio:1}]);await settle();
 expect(video.getAttribute('src')).toContain('hospital-proyecto-v3');expect(paused).toBe(false);
 video.dispatchEvent(new Event('ended'));await settle();expect(root.dataset.scene).toBe('aeropuerto-proyecto-v3');
 expect(root.querySelector('.um-atlas__now span').textContent).toBe('Aeropuertos');
 video.dispatchEvent(new Event('ended'));await settle();expect(root.dataset.scene).toBe('fachada-proyecto-v2');
});
test('offscreen and hidden states pause the sector movie, and a user pause persists after visibility returns',async()=>{
 const root=fixture();bindSectorAtlas(root);observe([{intersectionRatio:1}]);await settle();
 observe([{intersectionRatio:0}]);expect(paused).toBe(true);observe([{intersectionRatio:1}]);await settle();expect(paused).toBe(false);
 root.querySelector('button').click();expect(paused).toBe(true);
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));await settle();expect(paused).toBe(true);
});
test('reduced motion keeps the poster and loads no movie until explicit playback',async()=>{
 reduced=true;const root=fixture();bindSectorAtlas(root);observe([{intersectionRatio:1}]);await settle();expect(play).not.toHaveBeenCalled();
 root.querySelector('button').click();await settle();expect(play).toHaveBeenCalled();
});
test('keyboard exploration holds the chosen sector, and cleanup prevents media from restarting',async()=>{
 const root=fixture(),video=root.querySelector('video');bindSectorAtlas(root);observe([{intersectionRatio:1}]);await settle();
 root.querySelectorAll('a')[1].focus();await settle();video.dispatchEvent(new Event('ended'));await settle();expect(root.dataset.scene).toBe('aeropuerto-proyecto-v3');
 document.dispatchEvent(new Event('astro:before-swap'));const before=play.mock.calls.length;
 document.dispatchEvent(new Event('visibilitychange'));observe([{intersectionRatio:1}]);await settle();expect(play).toHaveBeenCalledTimes(before);expect(paused).toBe(true);
});
