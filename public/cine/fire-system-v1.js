// The panel and its lens follow the same narration clock as the text.
// No independent autoplay timer, required click, or work outside the viewport.
const A=Math.sqrt(3)/2,S=450;
const point=(x,y,z)=>[S*A*(x+y),S*((x-y)/2-z)];
const ease=t=>t<.5?16*t**5:1-((-2*t+2)**5)/2;
export function bindFirePrecision(root){
 const drawing=root.querySelector('.pf-drawing');if(!drawing||drawing.dataset.bound)return;drawing.dataset.bound='true';
 const owner=root.closest('[data-service-atlas]'),viewport=drawing.querySelector('.pf-viewport'),outer=root.querySelector('svg');
 const door=drawing.querySelector('.pf-door'),front=drawing.querySelector('.pf-door-front'),back=drawing.querySelector('.pf-door-back'),cover=drawing.querySelector('.pf-detector-cover');
 const ribbons=[...drawing.querySelectorAll('.pf-ribbon')],small=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=[0,0,0,0,1000,650],target=[...current],from=[...current],elapsed=0,last=0,frame=0,disposed=false;
 const views={0:[0,10,490,305],1:[85,5,470,410],2:[85,30,705,505],3:[288,42,485,470],4:[788,198,185,270],5:[532,354,210,187]};
 function active(){return !disposed&&root.dataset.disciplineService==='107'&&root.dataset.visible==='true'&&owner?.dataset.storyState==='playing'&&!document.hidden;}
 function render(){
  const [angle,lift,...view]=current,t=angle*Math.PI/180,hinge=point(-.26,-.064,0);
  viewport.setAttribute('viewBox',view.join(' '));cover.setAttribute('transform',`translate(0 ${-lift})`);
  door.setAttribute('transform',`matrix(${A*(Math.cos(t)-Math.sin(t))} ${.5*(Math.cos(t)+Math.sin(t))} 0 1 0 0)`);
  const turn=Math.min(1,Math.max(0,(angle-55)/30));front.setAttribute('opacity',String(1-turn));back.setAttribute('opacity',String(turn));
  for(const ribbon of ribbons){
   const i=Number(ribbon.dataset.conductor),start=point(-.052+i*.0015,.001,.346),length=(.17+i*.0015)*S;
   const end=[hinge[0]+A*(Math.cos(t)-Math.sin(t))*length,hinge[1]+.5*(Math.cos(t)+Math.sin(t))*length-.380*S];
   ribbon.setAttribute('d',`M${start[0]} ${start[1]}C${start[0]-16} ${start[1]+26} ${end[0]+17} ${end[1]+32} ${end[0]} ${end[1]}`);
   ribbon.style.opacity=String(Math.min(1,angle/32));
  }
 }
 function tick(now){
  frame=0;if(!active())return;if(last)elapsed+=Math.min(64,now-last);last=now;
  const progress=Math.min(1,elapsed/2600),e=ease(progress);current=from.map((v,i)=>v+(target[i]-v)*e);render();
  if(progress<1)frame=requestAnimationFrame(tick);
 }
 function update(){
  cancelAnimationFrame(frame);frame=0;last=0;
  if(root.dataset.disciplineService!=='107')return;
  outer.setAttribute('viewBox','0 0 1000 650');
  const stage=Number(root.dataset.disciplineStage),focus=reduced.matches?[0,0,1000,650]:small.matches?(views[stage]||[0,0,1000,650]):stage===3||stage===5?[210,30,760,494]:[0,0,1000,650];
  const next=[reduced.matches||stage>=3?102:0,reduced.matches||stage===1?65:0,...focus];
  if(next.some((v,i)=>v!==target[i])){from=[...current];target=next;elapsed=0;}
  if(reduced.matches){current=[...target];render();return;}
  if(active()&&current.some((v,i)=>Math.abs(v-target[i])>.001))frame=requestAnimationFrame(tick);
 }
 const observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['data-discipline-service','data-discipline-stage','data-visible']});observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 small.addEventListener('change',update);reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();small.removeEventListener('change',update);reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 document.addEventListener('astro:before-swap',dispose,{once:true});render();update();return dispose;
}
function boot(){document.querySelectorAll('[data-discipline-system]').forEach(bindFirePrecision);}
if(typeof document!=='undefined'){boot();document.addEventListener('astro:page-load',boot);}
