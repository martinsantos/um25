// Keep the authored SVG visible immediately. Prepare its moving mechanisms
// just before the explanation enters the viewport, without blocking the film.
async function loadMechanisms(root){
 const pending=[];
 if(root.querySelector('.pn-drawing,.ps-drawing'))pending.push(import('./precision-systems-v9.js').then(m=>root.querySelector('.sw-system')?[m.bindPrecisionSystem]:[m.bindPrecisionSystem,m.bindSoftwarePrecision,m.bindDisciplineCamera]));
 if(root.querySelector('.pf-drawing'))pending.push(import('./fire-system-v2.js').then(m=>[m.bindFirePrecision]));
 if(root.querySelector('[data-discipline-drawing="102"],[data-discipline-drawing="103"],[data-discipline-drawing="105"],[data-discipline-drawing="106"],[data-discipline-drawing="108"]'))pending.push(import('./discipline-camera-v3.js').then(m=>[m.bindDisciplineCamera]));
 if(root.querySelector('.sw-system'))pending.push(import('./software-system-v7.js').then(m=>[m.bindSoftwareSystem]));
 return (await Promise.all(pending)).flat();
}
export function bindViewportDiscipline(root,load=loadMechanisms){
 if(root.dataset.disciplineRuntime)return;
 root.dataset.disciplineRuntime='waiting';
 let pending=false,disposed=false,observer;
 const cleanups=[];
 async function start(){
  if(pending||disposed||['ready','static'].includes(root.dataset.disciplineRuntime))return;
  pending=true;root.dataset.disciplineRuntime='loading';
  try{
   const binders=await load(root);
   if(disposed||!root.isConnected)return;
   for(const bind of binders){const cleanup=bind(root);if(typeof cleanup==='function')cleanups.push(cleanup);}
   root.dataset.disciplineRuntime='ready';observer?.disconnect();
  }catch(error){
   if(!disposed){
    // Keep the authored illustration visible when a mechanism download fails.
    // Returning to waiting would hide it behind offscreen paint containment.
    root.dataset.disciplineRuntime='static';observer?.disconnect();
    console.warn('No se pudo preparar el recorrido isométrico.',error);
   }
  }finally{pending=false;}
 }
 const dispose=()=>{disposed=true;observer?.disconnect();for(const cleanup of cleanups)cleanup();document.removeEventListener('astro:before-swap',dispose);};
 document.addEventListener('astro:before-swap',dispose,{once:true});
 if(typeof IntersectionObserver==='undefined')void start();
 else{
  observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))void start();},{rootMargin:'300px 0px'});
  observer.observe(root.closest('[data-atlas-theater]')||root);
 }
 return dispose;
}
function boot(){document.querySelectorAll('[data-discipline-system]').forEach(root=>bindViewportDiscipline(root));}
if(typeof document!=='undefined'){boot();document.addEventListener('astro:page-load',boot);}
