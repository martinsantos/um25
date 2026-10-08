const STEP=6000,TOTAL=STEP*8;
const ingress=[[195,340],[333,420],[577,217]];
const uplink=[[577,217],[720,327],[900,202]];
const processing=[[900,202],[1080,310],[1080,353],[1080,396]];
const response=[[1080,396],[720,447],[577,242],[333,442],[195,340]];
export function along(points,t){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,t));
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const f=distance/lengths[i];return points[i].map((v,k)=>v+(points[i+1][k]-v)*f);}distance-=lengths[i];}
 return points.at(-1);
}
export function requestFrame(elapsed){
 const time=((elapsed%TOTAL)+TOTAL)%TOTAL,step=Math.floor(time/STEP),progress=time%STEP/STEP;
 const point=step===1?along(ingress,progress):step===2?along(uplink,progress):step===6?along(response,progress):step>=3&&step<=5?along(processing.slice(step-3,step-1),progress):[195,340];
 return {step,progress,point};
}
export function bindRequestSequence(root){
 if(root.dataset.requestBound)return;root.dataset.requestBound='true';
 const sequence=JSON.parse(root.querySelector('[data-request-script]').textContent),canvas=root.querySelector('[data-request-canvas]'),svg=canvas.querySelector('svg');
 const camera=root.querySelector('[data-request-camera]'),packet=root.querySelector('[data-request-packet]'),play=root.querySelector('[data-request-play]');
 const title=root.querySelector('[data-request-title]'),copy=root.querySelector('[data-request-copy]'),role=root.querySelector('[data-request-role]'),status=root.querySelector('[data-request-status]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
 let elapsed=0,since=0,frame=null,visible=false,paused=reduced.matches||Boolean(connection?.saveData),disposed=false,step=-1,mobile=false;
 function render(){
  const state=requestFrame(elapsed+(frame!==null?Date.now()-since:0));
  if(state.step!==step){step=state.step;const content=sequence[step];root.dataset.requestStep=String(step);title.textContent=content.title;copy.textContent=content.copy;role.textContent=content.role;status.textContent=content.status;
   root.querySelectorAll('[data-request-milestone]').forEach((node,i)=>node.dataset.state=i<step?'seen':i===step?'current':'next');
  }
  packet.setAttribute('transform',`translate(${state.point[0].toFixed(2)} ${state.point[1].toFixed(2)})`);
  const center=Math.max(300,Math.min(900,state.point[0]));camera.setAttribute('transform',mobile?`translate(${(300-center).toFixed(2)} 0)`:'translate(0 0)');
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
 const resize=()=>{mobile=window.innerWidth<=760;svg.setAttribute('viewBox',mobile?'0 0 600 510':'0 0 1200 510');render();};
 const preference=()=>{if(reduced.matches||connection?.saveData){paused=true;reconcile();}};
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.25);reconcile();},{threshold:[0,.25]});
 play.addEventListener('click',toggle);document.addEventListener('visibilitychange',reconcile);window.addEventListener('resize',resize);reduced.addEventListener('change',preference);connection?.addEventListener?.('change',preference);
 resize();reconcile();observer.observe(canvas);
 function cleanup(){if(disposed)return;stop();disposed=true;observer.disconnect();play.removeEventListener('click',toggle);document.removeEventListener('visibilitychange',reconcile);window.removeEventListener('resize',resize);reduced.removeEventListener('change',preference);connection?.removeEventListener?.('change',preference);document.removeEventListener('astro:before-swap',cleanup);root.removeAttribute('data-request-bound');}
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-request-story]').forEach(bindRequestSequence);}
document.addEventListener('astro:page-load',boot);boot();
