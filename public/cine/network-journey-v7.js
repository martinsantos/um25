export function bindNetworkJourney(root) {
 if(root.dataset.networkBound)return;
 root.dataset.networkBound='true';
 const buttons=[...root.querySelectorAll('[data-network-select]')];
 const play=root.querySelector('[data-network-play]'),tag=root.querySelector('[data-network-tag]');
 const title=root.querySelector('[data-network-title]'),copy=root.querySelector('[data-network-copy]'),announce=root.querySelector('[data-network-announce]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let step=0,timer=null,visible=false,playing=false,automatic=true,disposed=false;
 const clear=()=>{if(timer!==null)window.clearTimeout(timer);timer=null;};
 function select(index,manual=false) {
  if(!Number.isInteger(index)||!buttons[index]||disposed)return;
  step=index;const button=buttons[index];root.dataset.step=String(index);
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  tag.textContent=button.dataset.tag;
  if(title)title.textContent=button.dataset.title;if(copy)copy.textContent=button.dataset.copy;
  if(manual&&announce)announce.textContent=button.dataset.title;
  root.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:button.dataset.title,copy:button.dataset.copy,manual}}));
 }
 function status(){play.setAttribute('aria-pressed',String(playing));play.firstChild.textContent=playing?'Pausar recorrido ':'Ver recorrido ';}
 function stop(){clear();playing=false;automatic=false;status();}
 function schedule(){
  clear();if(!playing||!visible||document.hidden||disposed)return;
  timer=window.setTimeout(()=>{
   timer=null;if(step===3){stop();return;}
   select(step+1);schedule();
  },step===0?3600:step===2?4600:4000);
 }
 function start(){automatic=false;select(0);playing=true;status();schedule();}
 const click=event=>{
  const choice=event.target.closest('[data-network-select]');
  if(choice&&root.contains(choice)){stop();select(Number(choice.dataset.networkSelect),true);}
  if(event.target.closest('[data-network-play]')===play){if(playing)stop();else start();}
 };
 const keyboard=event=>{
  const choice=event.target.closest('[data-network-select]');if(!choice||!root.contains(choice))return;
  const at=buttons.indexOf(choice);let next;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(at+1)%buttons.length;
  if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(at+buttons.length-1)%buttons.length;
  if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;
  if(next===undefined)return;event.preventDefault();stop();select(next,true);buttons[next].focus();
 };
 const visibility=()=>schedule();
 const change=()=>{if(reduced.matches)stop();};
 const scale=event=>{stop();select(event.detail.index,true);};
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible&&automatic){automatic=false;if(!reduced.matches&&!navigator.connection?.saveData){playing=true;status();}}
  schedule();
 },{threshold:.25});
 root.addEventListener('click',click);root.addEventListener('keydown',keyboard);root.addEventListener('um:network-view',scale);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',change);observer.observe(root);
 const cleanup=()=>{if(disposed)return;disposed=true;clear();observer.disconnect();root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);root.removeEventListener('um:network-view',scale);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',change);document.removeEventListener('astro:before-swap',cleanup);delete root.dataset.networkBound;};
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-network-journey]').forEach(bindNetworkJourney);}
document.addEventListener('astro:page-load',boot);boot();
