export function bindIsometric(root) {
 if(root.dataset.bound)return;
 root.dataset.bound='true';
 const buttons=[...root.querySelectorAll('[data-iso-select]')],panels=[...root.querySelectorAll('[data-iso-panel]')];
 const title=root.querySelector('[data-iso-title]'),description=root.querySelector('[data-iso-description]'),step=root.querySelector('[data-iso-step]'),play=root.querySelector('[data-iso-play]');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:true,addEventListener(){},removeEventListener(){}};
 let selected=Number(root.dataset.isoView||1),timer=null,playing=false,visible=false,disposed=false;
 const clear=()=>{if(timer!==null)window.clearTimeout(timer);timer=null;};
 const status=()=>{if(play){play.setAttribute('aria-pressed',String(playing));play.textContent=playing?'Pausar recorrido':'Ver recorrido';}};
 const stop=()=>{clear();playing=false;status();};
 const select=index=>{
  const button=buttons[index];if(!Number.isInteger(index)||!button||disposed)return;
  selected=index;
  const view=index===0?'system':index===3&&root.dataset.isoCode!=='104'?'detail':'object';
  root.dataset.isoView=String(index);root.classList.toggle('is-open',index===2);
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  for(const panel of panels){
   const shown=panel.dataset.isoPanel===view,entering=shown&&panel.hidden;
   panel.hidden=!shown;
   // Object and open layers are one persistent drawing: only its layers travel.
   panel.classList.toggle('is-entering',entering&&!reduced.matches);
  }
  title.textContent=button.dataset.title;description.textContent=button.dataset.description;step.textContent=String(index+1).padStart(2,'0');
  root.dispatchEvent(new CustomEvent('um:iso-view',{detail:{index}}));
 };
 const schedule=()=>{
  clear();if(!playing||!visible||document.hidden||disposed||reduced.matches)return;
  timer=window.setTimeout(()=>{timer=null;if(selected===buttons.length-1){stop();return;}select(selected+1);schedule();},selected===2?7200:6400);
 };
 const reveal=()=>{
  if(root.classList.contains('iso--compact'))return;
  const frame=root.querySelector('.iso__frame'),controls=root.querySelector('.iso__controls');if(!frame||!controls)return;
  const rect=frame.getBoundingClientRect();
  if(rect.top<80||rect.bottom>window.innerHeight-72)controls.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
 };
 const click=e=>{
  const button=e.target.closest('[data-iso-select]');
  if(button&&root.contains(button)){stop();select(Number(button.dataset.isoSelect));reveal();return;}
  if(play&&e.target.closest('[data-iso-play]')===play){
   if(playing)stop();else if(!reduced.matches){select(0);playing=true;status();schedule();}
  }
 };
 const keyboard=e=>{
  if(!e.target.closest('[data-iso-select]'))return;
  let next;
  if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(selected+1)%buttons.length;
  if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(selected+buttons.length-1)%buttons.length;
  if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;
  if(next===undefined)return;e.preventDefault();stop();select(next);buttons[next].focus();
 };
 const interact=e=>{if(e.target.closest('[data-sl-canvas],[data-sl-layer],[data-sl-separate]'))stop();};
 const external=e=>{stop();select(e.detail?.index);};
 const visibility=()=>schedule();
 const motion=()=>{if(reduced.matches)stop();if(play){play.hidden=reduced.matches;status();}};
 const observer=play?new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&(e.intersectionRatio===undefined||e.intersectionRatio>=.2));schedule();},{threshold:.2}):null;
 root.addEventListener('click',click);root.addEventListener('keydown',keyboard);root.addEventListener('pointerdown',interact);root.addEventListener('um:iso-select',external);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
 observer?.observe(root);motion();select(selected);
 const cleanup=()=>{
  if(disposed)return;disposed=true;stop();observer?.disconnect();
  root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);root.removeEventListener('pointerdown',interact);root.removeEventListener('um:iso-select',external);
  document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);document.removeEventListener('astro:before-swap',cleanup);root.removeAttribute('data-bound');
 };
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-isometric]').forEach(bindIsometric);}
document.addEventListener('astro:page-load',boot);boot();
