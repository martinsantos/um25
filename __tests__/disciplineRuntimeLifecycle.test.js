import {bindViewportDiscipline} from '../public/cine/discipline-runtime-v7.js';
const settle=async()=>{for(let i=0;i<7;i++)await Promise.resolve();};
let observers;
beforeEach(()=>{
 observers=[];
 global.IntersectionObserver=jest.fn(callback=>{const observer={callback,observe:jest.fn(),disconnect:jest.fn()};observers.push(observer);return observer;});
 document.body.innerHTML='<section data-atlas-theater><div data-discipline-system><svg><path d="M0 0L10 10"/></svg></div></section>';
});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.restoreAllMocks();});
const root=()=>document.querySelector('[data-discipline-system]');
test('the film can play before any moving SVG mechanism is prepared',async()=>{
 const bind=jest.fn(),load=jest.fn(async()=>[bind]),node=root(),markup=node.innerHTML;
 bindViewportDiscipline(node,load);await settle();
 expect(load).not.toHaveBeenCalled();expect(node.innerHTML).toBe(markup);
 expect(observers[0].observe).toHaveBeenCalledWith(node.parentElement);
 observers[0].callback([{isIntersecting:true}]);observers[0].callback([{isIntersecting:true}]);await settle();
 expect(load).toHaveBeenCalledTimes(1);expect(bind).toHaveBeenCalledWith(node);expect(node.dataset.disciplineRuntime).toBe('ready');
 expect(observers[0].disconnect).toHaveBeenCalled();
});
test('late downloaded code cannot animate a page that has already been left',async()=>{
 let resolve;const bind=jest.fn(),load=jest.fn(()=>new Promise(done=>{resolve=done;}));
 bindViewportDiscipline(root(),load);observers[0].callback([{isIntersecting:true}]);
 document.dispatchEvent(new Event('astro:before-swap'));resolve([bind]);await settle();
 expect(bind).not.toHaveBeenCalled();expect(observers[0].disconnect).toHaveBeenCalled();
});
test('the latest story stage is used and moving mechanisms are disposed on navigation',async()=>{
 let resolve;const cleanup=jest.fn(),seen=[],bind=node=>{seen.push(node.dataset.disciplineStage);return cleanup;};
 const node=root();bindViewportDiscipline(node,()=>new Promise(done=>{resolve=done;}));observers[0].callback([{isIntersecting:true}]);
 node.dataset.disciplineStage='2';resolve([bind]);await settle();expect(seen).toEqual(['2']);
 document.dispatchEvent(new Event('astro:before-swap'));expect(cleanup).toHaveBeenCalledTimes(1);
});

test('a failed mechanism download reveals the illustration instead of leaving an empty stage',async()=>{
 const warning=jest.spyOn(console,'warn').mockImplementation(()=>{}),node=root(),markup=node.innerHTML;
 const load=jest.fn(async()=>{throw Error('offline');});
 bindViewportDiscipline(node,load);observers[0].callback([{isIntersecting:true}]);await settle();
 expect(node.dataset.disciplineRuntime).toBe('static');expect(node.innerHTML).toBe(markup);expect(observers[0].disconnect).toHaveBeenCalled();
 observers[0].callback([{isIntersecting:true}]);await settle();expect(load).toHaveBeenCalledTimes(1);expect(warning).toHaveBeenCalledTimes(1);
});
