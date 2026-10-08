// Compile the same Hairline geometry used by the browser into a complete SSR preview.
// This uses a small DOM serializer, not a browser or a renderer process.
import fs from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import {exploded} from '../../public/cine/hairline-v7.js';

const root=process.argv[2];
if(!root)throw new Error('Pass the repository root.');
const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>');
const frames=new Map();let next=1;
globalThis.document=dom.window.document;
globalThis.window=dom.window;
globalThis.requestAnimationFrame=callback=>{const id=next++;frames.set(id,callback);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
globalThis.IntersectionObserver=class{constructor(callback){this.callback=callback;}observe(target){this.callback([{target,isIntersecting:true}]);}disconnect(){}unobserve(){}};
const destination=path.join(root,'src/assets/cine/isometric');
for(const [name,expansion] of [['software-layers-v7.svg',.18],['software-layers-expanded-v7.svg',.9]]){
 const host=document.createElement('div');document.body.append(host);
 const figure=exploded(host,{theme:'dark',intensity:.75,activeLayer:0,expansion,label:'Aplicación isométrica con navegación, contenido y acciones.'});
 const now=performance.now();
 for(let i=1;i<5&&frames.size;i++){const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(now+i*16);}
 const svg=host.querySelector('svg');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.classList.add('sl__fallback');
 const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=[...document.head.querySelectorAll('style')].map(item=>item.textContent).join('\n');svg.prepend(style);
 const source=svg.outerHTML;fs.writeFileSync(path.join(destination,name),source);
 console.log(JSON.stringify({file:name,bytes:Buffer.byteLength(source),paths:svg.querySelectorAll('path').length}));
 figure.destroy();host.remove();
}
dom.window.close();
