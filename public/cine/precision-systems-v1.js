// Physical motion for the authored SVG. It follows the existing story clock;
// it never asks a visitor to click and never runs a second narration timer.
const SQRT3_2=Math.sqrt(3)/2;
const project=([x,y,z])=>[SQRT3_2*(x-y),(x+y)/2-z];
const ease=t=>t<.5?16*t**5:1-((-2*t+2)**5)/2;
export function bindPrecisionSystem(root){
 if(root.dataset.precisionBound)return;
 root.dataset.precisionBound='true';
 const owner=root.closest('[data-service-atlas]');
 const drawing=root.querySelector('.pn-drawing');
 if(!owner||!drawing)return;
 const door=drawing.querySelector('.pn-door'),drawer=drawing.querySelector('.pn-switch-drawer'),lid=drawing.querySelector('.pn-lid');
 const cords=[...drawing.querySelectorAll('.pn-cord')].map(node=>({node,start:node.dataset.start.split(' ').map(Number),end:node.dataset.end.split(' ').map(Number),sag:Number(node.dataset.sag)}));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=[0,0,0],from=[...current],target=[...current],frame=0,elapsed=0,last=0,disposed=false;
 const duration=2400;
 function render(){
  const [angle,pull,lift]=current,theta=angle*Math.PI/180;
  door.setAttribute('transform',`matrix(${SQRT3_2*(Math.cos(theta)-Math.sin(theta))} ${.5*(Math.cos(theta)+Math.sin(theta))} 0 1 0 0)`);
  drawer.setAttribute('transform',`translate(${-SQRT3_2*pull} ${pull/2})`);
  lid.setAttribute('transform',`translate(${lift*2.1} ${-lift})`);
  for(const rail of drawing.querySelectorAll('.pn-drawer-rail')){const x=Number(rail.dataset.x),z=Number(rail.dataset.z),a=project([x,40,z]),b=project([x,128+pull,z]);rail.setAttribute('d',`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);}
  for(const cord of cords){
   const a=project(cord.start),b=project([cord.end[0],cord.end[1]+pull,cord.end[2]]),sag=cord.sag;
   const c=project([cord.start[0],cord.start[1]+16+sag,cord.start[2]-9]),d=project([cord.end[0],cord.end[1]+pull+20+sag,cord.end[2]-10]);
   cord.node.setAttribute('d',`M${a[0]} ${a[1]}C${c[0]} ${c[1]} ${d[0]} ${d[1]} ${b[0]} ${b[1]}`);
  }
 }
 function running(){return !disposed&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&root.dataset.disciplineService==='101'&&!document.hidden;}
 function tick(now){
  frame=0;if(!running())return;
  if(last)elapsed+=Math.min(64,now-last);last=now;
  const t=Math.min(1,elapsed/duration),e=ease(t);
  current=from.map((v,i)=>v+(target[i]-v)*e);render();
  if(t<1)frame=requestAnimationFrame(tick);
 }
 function update(){
  const stage=Number(root.dataset.disciplineStage);
  const next=reduced.matches?[76,48,24]:stage===3?[76,48,30]:stage===2?[76,0,0]:stage===4||stage===5?[58,0,0]:[0,0,0];
  if(next.some((v,i)=>v!==target[i])){from=[...current];target=next;elapsed=0;last=0;}
  cancelAnimationFrame(frame);frame=0;last=0;
  if(reduced.matches){current=[...target];render();return;}
  if(running()&&current.some((v,i)=>Math.abs(v-target[i])>.001))frame=requestAnimationFrame(tick);
 }
 const observer=new MutationObserver(update);
 observer.observe(root,{attributes:true,attributeFilter:['data-discipline-stage','data-discipline-service','data-visible']});
 observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 document.addEventListener('astro:before-swap',dispose,{once:true});
 render();update();
 return dispose;
}
function boot(){document.querySelectorAll('[data-discipline-system]').forEach(bindPrecisionSystem);}
if(typeof document!=='undefined'){boot();document.addEventListener('astro:page-load',boot);}
