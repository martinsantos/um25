const STEP=8000,TOTAL=STEP*8;
import geometry from './operation-geometry-v1.js';
export function along(points,t){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,t));
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=distance/lengths[i];return points[i].map((v,k)=>v+(points[i+1][k]-v)*f);}distance-=lengths[i];}
 return points.at(-1);
}
export function requestFrame(elapsed){
 const time=((elapsed%TOTAL)+TOTAL)%TOTAL,step=Math.floor(time/STEP),progress=time%STEP/STEP;
 const route=geometry.routes[Math.max(0,step-1)];
 const point=step===0?[600,400]:along(route,Math.min(1,progress*1.6));
 const previous=geometry.targets[(step+7)%8],target=geometry.targets[step];
 const t=Math.min(1,progress*3),ease=t*t*(3-2*t);
 const center=target.map((v,i)=>previous[i]+(v-previous[i])*ease);
 return {step,progress,point,center};
}

export function bindRequestSequence(root){
 if(root.dataset.requestBound)return;root.dataset.requestBound='true';
 const sequence=JSON.parse(root.querySelector('[data-request-script]').textContent),canvas=root.querySelector('[data-request-canvas]'),svg=canvas.querySelector('svg');
 const callout=root.querySelector('[data-operation-label]'),focus=root.querySelector('[data-operation-focus]');
 const camera=root.querySelector('[data-request-camera]'),packet=root.querySelector('[data-request-packet]'),play=root.querySelector('[data-request-play]');
 const title=root.querySelector('[data-request-title]'),copy=root.querySelector('[data-request-copy]'),role=root.querySelector('[data-request-role]'),status=root.querySelector('[data-request-status]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
 let elapsed=0,since=0,frame=null,visible=false,paused=reduced.matches||Boolean(connection?.saveData),disposed=false,step=-1,mobile=false;
 function render(){
  const state=requestFrame(elapsed+(frame!==null?Date.now()-since:0));
  if(state.step!==step){step=state.step;const content=sequence[step];root.dataset.requestStep=String(step);title.textContent=content.title;copy.textContent=content.copy;role.textContent=content.role;status.textContent=content.status;
   if(callout)callout.textContent=content.label;
   root.querySelectorAll('[data-operation-route]').forEach((route,i)=>route.dataset.active=String(i===step-1||step===7));
   root.querySelectorAll('[data-request-milestone]').forEach((node,i)=>node.dataset.state=i<step?'seen':i===step?'current':'next');
  }
  packet.setAttribute('transform',`translate(${state.point[0].toFixed(2)} ${state.point[1].toFixed(2)})`);
  const target=geometry.targets[step];
  focus?.setAttribute('transform',`translate(${target[0]} ${target[1]})`);
  packet.style.opacity=step===0?'0':'1';
  const center=Math.max(320,Math.min(880,state.center[0]));
  const vertical=Math.max(245,Math.min(465,state.center[1]));
  camera.setAttribute('transform',mobile?`translate(${(320-center).toFixed(2)} ${(260-vertical).toFixed(2)})`:'translate(0 0)');
  const route=root.querySelector(`[data-operation-route="${step-1}"]`);
  route?.style.setProperty('stroke-dashoffset',String(1-Math.min(1,state.progress*1.6)));
 }
 function tick(){if(disposed||frame===null)return;render();frame=window.requestAnimationFrame(tick);}
 function stop(){if(frame!==null){elapsed+=Date.now()-since;window.cancelAnimationFrame(frame);frame=null;}}
 function reconcile(){
  if(disposed)return;
  const running=visible&&!document.hidden&&!paused;
  if(running&&frame===null){since=Date.now();frame=window.requestAnimationFrame(tick);}else if(!running)stop();
  root.dataset.requestState=paused?'paused':running?'playing':'waiting';play.textContent=paused?'Reproducir recorrido':'Pausar recorrido';play.setAttribute('aria-pressed',String(!paused));render();
 }
 const toggle=()=>{paused=!paused;reconcile();};
 const resize=()=>{mobile=window.innerWidth<=760;svg.setAttribute('viewBox',mobile?'0 0 640 520':'0 0 1200 740');render();};
 const preference=()=>{if(reduced.matches||connection?.saveData){paused=true;reconcile();}};
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.25);reconcile();},{threshold:[0,.25]});
 play.addEventListener('click',toggle);document.addEventListener('visibilitychange',reconcile);window.addEventListener('resize',resize);reduced.addEventListener('change',preference);connection?.addEventListener?.('change',preference);
 resize();reconcile();observer.observe(canvas);
 function cleanup(){if(disposed)return;stop();disposed=true;observer.disconnect();play.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',reconcile);window.removeEventListener('resize',resize);reduced.removeEventListener('change',preference);connection?.removeEventListener?.('change',preference);document.removeEventListener('astro:before-swap',cleanup);root.removeAttribute('data-request-bound');}
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-request-story]').forEach(bindRequestSequence);}
document.addEventListener('astro:page-load',boot);boot();
