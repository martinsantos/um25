// Small isometric thumbnails for cards. One WebGL renderer serves every card:
// each card gets a crisp still frame, and only the hovered or focused card animates.
import {createRenderer,createScene,frameCamera} from './engine.js';
import {SECTORS} from './sectors.js';

let renderer=null;const scenes=new Map();
function sceneFor(sector){
 if(!scenes.has(sector)){scenes.set(sector,createScene(renderer,SECTORS[sector],{compact:true}))}
 return scenes.get(sector);
}
function draw(card,time){
 const canvas=card.querySelector('canvas'),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const dpr=Math.min(devicePixelRatio,2),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
 const s=sceneFor(card.dataset.miniIso),layer=card.dataset.layer||null;
 s.setLayers(layer==='none'?null:layer,1,time);for(const f of s.anim)f(time,1/30,false);
 renderer.setSize(w,h,false);frameCamera(s.cam,s.frame3d,w,h,{caption:false});renderer.render(s.scene,s.cam);
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,pw,ph);ctx.drawImage(renderer.domElement,0,0,pw,ph);
 card.classList.add('is-ready');
}

export function bindMiniIso(root=document){
 const cards=[...root.querySelectorAll('[data-mini-iso]:not([data-mini-bound])')];if(!cards.length)return;
 try{renderer??=createRenderer()}catch{return}
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let active=null,raf=0,t0=0;
 const loop=now=>{if(!active)return;draw(active,(now-t0)/1000);raf=requestAnimationFrame(loop)};
 const start=card=>{if(reduce||active===card)return;active=card;t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)};
 const stop=card=>{if(active!==card)return;active=null;cancelAnimationFrame(raf)};
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){draw(e.target,2.4);io.unobserve(e.target)}},{rootMargin:'300px 0px'});
 for(const card of cards){
  card.dataset.miniBound='1';io.observe(card);
  const hover=card.closest('a,button,[data-mini-hover]')||card;
  hover.addEventListener('pointerenter',()=>start(card));hover.addEventListener('pointerleave',()=>stop(card));
  hover.addEventListener('focusin',()=>start(card));hover.addEventListener('focusout',()=>stop(card));
 }
 const ro=new ResizeObserver(entries=>{for(const e of entries)if(e.target.classList.contains('is-ready'))draw(e.target,2.4)});cards.forEach(c=>ro.observe(c));
}
