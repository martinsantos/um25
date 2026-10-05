import fs from 'node:fs';
import {shareSvgPrimitives} from '../scripts/cine/share-svg-primitives.js';
import {exploded} from '../public/cine/hairline-v7.js';
import {bindSoftware} from '../public/cine/software-layers-v7.js';

const xml=source=>new DOMParser().parseFromString(source,'image/svg+xml');
const original=fs.readFileSync('src/assets/cine/isometric/network-rack-v8.svg','utf8');
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function drawing(document,node,parents=[]){
 const attributes=[...node.attributes].filter(a=>!['id','href'].includes(a.name)).map(a=>[a.name,a.value]);
 const context=attributes.length?[...parents,[node.localName,attributes]]:parents;
 if(node.localName==='use')return drawing(document,document.getElementById(node.getAttribute('href').slice(1)),context);
 if(['path','polygon','polyline','rect','circle','text'].includes(node.localName))return [[node.localName,attributes,node.textContent,parents]];
 return [...node.children].flatMap(child=>drawing(document,child,context));
}
test('sharing complete static groups reduces bytes and parsed nodes with identical projected drawings',()=>{
 const before=xml(original),source=shareSvgPrimitives(original),after=xml(source);
 expect(after.querySelector('parsererror')).toBeNull();expect(source.length).toBeLessThan(original.length);
 expect(after.querySelectorAll('*').length).toBeLessThan(before.querySelectorAll('*').length);
 const manifest=JSON.parse(fs.readFileSync('src/assets/cine/isometric/network-rack-v8.json','utf8'));
 for(const {id} of manifest.models)for(const view of ['base','cover','full','detail'])expect(drawing(after,after.getElementById(`rk-${id}-${view}`))).toEqual(drawing(before,before.getElementById(`rk-${id}-${view}`)));
 const ids=[...after.querySelectorAll('[id]')].map(node=>node.id);expect(new Set(ids).size).toBe(ids.length);
});
test('the complete software drawing exists before JavaScript with both compact and expanded layer geometry',()=>{
 const small=xml(fs.readFileSync('src/assets/cine/isometric/software-layers-v7.svg','utf8'));
 const large=xml(fs.readFileSync('src/assets/cine/isometric/software-layers-expanded-v7.svg','utf8'));
 for(const document of [small,large]){expect(document.querySelector('parsererror')).toBeNull();expect(document.querySelectorAll('path').length).toBe(16);expect([...document.querySelectorAll('path')].every(path=>path.getAttribute('d')?.length>20)).toBe(true);}
 expect(small.documentElement.outerHTML).not.toBe(large.documentElement.outerHTML);
});
let observers,hidden=false;
function fixture(){
 const preview=fs.readFileSync('src/assets/cine/isometric/software-layers-v7.svg','utf8');
 document.body.innerHTML=`<div data-service-atlas><section data-software-layers data-sl-compact="true"><div data-sl-canvas data-hairline="exploded" data-hairline-theme="dark" role="img" aria-label="Aplicación">${preview}</div><button data-sl-separate></button><p data-sl-description></p>${[0,1,2,3].map(i=>`<button data-sl-layer="${i}" data-description="Capa ${i}">${i}</button>`).join('')}</section></div>`;
 return document.querySelector('[data-software-layers]');
}
beforeEach(()=>{hidden=false;observers=[];Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});global.IntersectionObserver=class{constructor(callback){this.callback=callback;this.targets=new Set();this.disconnect=jest.fn();this.unobserve=jest.fn();observers.push(this);}observe(target){this.targets.add(target);}};});
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.restoreAllMocks();});
test('a delayed software module keeps the complete first frame and restores its styling when offscreen',async()=>{
 const root=fixture(),host=root.querySelector('[data-sl-canvas]'),preview=host.innerHTML;let resolve;
 const pending=new Promise(done=>{resolve=done;});const load=jest.fn(()=>pending);
 const exploded=jest.fn(stage=>{stage.innerHTML='<svg data-live><path d="M0 0L1 1"/></svg>';return {update:jest.fn(),destroy:()=>{stage.replaceChildren();for(const name of ['data-hairline','data-hairline-theme','role','aria-label'])stage.removeAttribute(name);}};});
 bindSoftware(root,load);observers[1].callback([{isIntersecting:true}]);observers[0].callback([{isIntersecting:true}]);
 expect(host.innerHTML).toBe(preview);root.querySelector('[data-sl-layer="2"]').click();resolve({exploded});await settle();
 expect(exploded).toHaveBeenCalledTimes(1);expect(exploded.mock.calls[0][1].activeLayer).toBe(2);expect(host.querySelector('[data-live]')).not.toBeNull();
 observers[0].callback([{isIntersecting:false}]);expect(host.innerHTML).toBe(preview);expect(host.dataset.hairline).toBe('exploded');expect(host.dataset.hairlineTheme).toBe('dark');expect(host.getAttribute('role')).toBe('img');
});
test('failed or disposed software imports preserve the visible SVG and mount no stale instance',async()=>{
 const root=fixture(),host=root.querySelector('[data-sl-canvas]'),preview=host.innerHTML;
 const cleanup=bindSoftware(root,()=>Promise.reject(new Error('offline')));observers[0].callback([{isIntersecting:true}]);await settle();expect(host.innerHTML).toBe(preview);cleanup();
 let resolve;const load=new Promise(done=>{resolve=done;}),exploded=jest.fn();const newer=fixture(),dispose=bindSoftware(newer,()=>load);observers[2].callback([{isIntersecting:true}]);dispose();resolve({exploded});await settle();
 expect(exploded).not.toHaveBeenCalled();expect(newer.querySelectorAll('path').length).toBe(16);expect(observers[3].disconnect).toHaveBeenCalled();
});

test('software keeps its complete first frame when interaction mounts and every horizontal axis is at thirty degrees',()=>{
 window.matchMedia=jest.fn(()=>({matches:false,addEventListener(){},removeEventListener(){}}));
 window.requestAnimationFrame=jest.fn(()=>1);window.cancelAnimationFrame=jest.fn();
 const paths=svg=>[...svg.querySelectorAll('path')].map(path=>path.getAttribute('d'));
 for(const [name,expansion] of [['software-layers-v7.svg',.18],['software-layers-expanded-v7.svg',.9]]){
  const reference=xml(fs.readFileSync('src/assets/cine/isometric/'+name,'utf8'));
  const host=document.createElement('div');document.body.append(host);
  const figure=exploded(host,{theme:'dark',intensity:.75,activeLayer:0,expansion});
  expect(paths(host.querySelector('svg'))).toEqual(paths(reference));
  const marks=host.querySelector('svg>g>g').querySelectorAll('path.nf')[1].getAttribute('d');
  const points=marks.match(/^M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)/).slice(1).map(Number);
  expect(Math.abs((points[3]-points[1])/(points[2]-points[0]))).toBeCloseTo(Math.tan(Math.PI/6),3);
  figure.destroy();host.remove();
 }
});
