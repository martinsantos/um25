export function bindNetworkJourney(root) {
 if(root.dataset.networkBound)return;
 root.dataset.networkBound='true';
 const buttons=[...root.querySelectorAll('[data-network-select]')];
 const parts=[...root.querySelectorAll('[data-network-part]')];
 const play=root.querySelector('[data-network-play]'),door=root.querySelector('[data-network-door]');
 const tag=root.querySelector('[data-network-tag]'),title=root.querySelector('[data-network-title]'),copy=root.querySelector('[data-network-copy]'),announce=root.querySelector('[data-network-announce]');
 const focus=root.querySelector('.rk-focus'),detail=root.querySelector('.rk-detail');
 const picker=root.querySelector('[data-network-picker]');
 const guides=root.querySelector('[data-rack-guides]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let step=0,part=parts[0],timer=null,visible=false,playing=false,automatic=true,disposed=false,opened=reduced.matches,previewSlot=null,partReveal=null;
 const cancelReveal=()=>{partReveal?.cancel();partReveal=null;};
 const clear=()=>{if(timer!==null)window.clearTimeout(timer);timer=null;};
 function setDoor(open){
  opened=open;root.dataset.open=String(open);
  door.setAttribute('aria-pressed',String(open));door.firstChild.textContent=open?'Cerrar gabinete ':'Abrir gabinete ';
  if(!open)resetPreview();
 }
 function content(manual=false){
  const data=part.dataset;
  root.querySelector('[data-rack-cover]').setAttribute('href',`#rk-${data.networkPart}-${step===2?'cover':'closed'}`);
  const heading=step===0?'Un gabinete. Todo el sistema.':step===1?data.title:step===2?data.construction:data.detail;
  const description=step===0?'Abrí la puerta y extraé cada equipo. Puertos, fibra, datos y energía forman una instalación; el punto Wi-Fi lleva la red fuera del rack.':step===1?data.copy:step===2?data.inside:data.closeup;
  if(title)title.textContent=heading;if(copy)copy.textContent=description;
  tag.textContent=step===0?'18U · cobre / fibra / cómputo / energía':part.textContent.trim()+' · '+buttons[step].textContent.replace(/^\s*0\d\s*/,'').trim();
  if(manual&&announce)announce.textContent=heading;
  root.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:heading,copy:description,manual}}));
 }
 function resetPreview(){if(previewSlot)previewSlot.removeAttribute('data-preview');previewSlot=null;}
 function setPart(button,manual=false){
  if(!button||disposed)return;resetPreview();cancelReveal();root.dataset.motionScope='part';part=button;const data=button.dataset,id=data.networkPart;
  root.dataset.part=id;parts.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  if(picker)picker.value=id;
  root.querySelector('[data-rack-base]').setAttribute('href',`#rk-${id}-base`);
  root.querySelector('[data-rack-cover]').setAttribute('href',`#rk-${id}-cover`);
  root.querySelector('[data-rack-detail]').setAttribute('href',`#rk-${id}-detail`);
  if(guides)guides.setAttribute('href',`#rk-${id}-guides`);
  focus.style.setProperty('--slot-x',data.slotX+'px');focus.style.setProperty('--slot-y',data.slotY+'px');
  focus.style.setProperty('--part-scale',data.scale);focus.style.setProperty('--lift-x',data.liftX+'px');focus.style.setProperty('--lift-y',data.liftY+'px');
  detail.style.setProperty('--detail-scale',data.detailScale);
  const x=245+Number(data.slotX)*.24,y=517+Number(data.slotY)*.24;
  root.querySelector('[data-rack-leader]').setAttribute('d',`M${x} ${y}H430L510 370H580`);
  root.querySelectorAll('[data-rack-slot]').forEach(slot=>slot.toggleAttribute('data-selected',slot.dataset.rackSlot===id));
  // Fit a newly selected geometry immediately. Interpolating the old zoom onto
  // a different device causes large chassis to clip before the transition ends.
  const reveal=step===3?detail:focus;reveal.getBoundingClientRect();
  if(step>0&&visible&&!document.hidden&&!reduced.matches&&typeof reveal.animate==='function'){
   partReveal=reveal.animate([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});partReveal.finished.catch(()=>{});
  }
  content(manual);
 }
 function select(index,manual=false){
  if(!Number.isInteger(index)||!buttons[index]||disposed)return;
  if(index!==step){cancelReveal();root.dataset.motionScope='view';}
  resetPreview();step=index;root.dataset.step=String(index);
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  if(index>0)setDoor(true);door.hidden=index!==0;content(manual);
 }
 function status(){play.setAttribute('aria-pressed',String(playing));play.firstChild.textContent=playing?'Pausar recorrido ':'Ver recorrido ';}
 function stop(){clear();playing=false;automatic=false;status();}
 function schedule(){
  clear();if(!playing||!visible||document.hidden||disposed)return;
  timer=window.setTimeout(()=>{
   timer=null;
   if(step===0&&!opened){setDoor(true);schedule();return;}
   if(step===3){stop();return;}
   select(step+1);schedule();
  },step===0&&!opened?700:step===0?3200:step===2?4600:4000);
 }
 function start(){automatic=false;select(0);setDoor(false);playing=true;status();schedule();}
 const click=event=>{
  const choice=event.target.closest('[data-network-select]');
  if(choice&&root.contains(choice)){stop();select(Number(choice.dataset.networkSelect),true);return;}
  const equipment=event.target.closest('[data-network-part]');
  if(equipment&&root.contains(equipment)){stop();setPart(equipment);select(step===0?1:step,true);return;}
  const slot=event.target.closest('[data-rack-slot]');
  if(slot&&root.contains(slot)&&opened&&step===0){stop();setPart(parts.find(button=>button.dataset.networkPart===slot.dataset.rackSlot));select(1,true);return;}
  if(event.target.closest('[data-network-door]')===door){stop();setDoor(!opened);return;}
  if(event.target.closest('[data-network-play]')===play){if(playing)stop();else start();}
 };
 const keyboard=event=>{
  const choice=event.target.closest('[data-network-select],[data-network-part]');if(!choice||!root.contains(choice))return;
  const equipment=choice.hasAttribute('data-network-part'),group=equipment?parts:buttons,at=group.indexOf(choice);let next;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(at+1)%group.length;
  if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(at+group.length-1)%group.length;
  if(event.key==='Home')next=0;if(event.key==='End')next=group.length-1;
  if(next===undefined)return;event.preventDefault();stop();
  if(equipment){setPart(group[next]);select(step===0?1:step,true);}else select(next,true);group[next].focus();
 };
 const choose=event=>{
  if(event.target!==picker)return;
  stop();setPart(parts.find(button=>button.dataset.networkPart===picker.value));select(step===0?1:step,true);
 };
 // Hover follows Hairline's original cabinet interaction: only the nearest
 // unit moves on its rails. No continuous render loop or pointer capture.
 const preview=event=>{
  if(step!==0||!opened||reduced.matches||event.pointerType==='touch')return;
  const slot=event.target.closest('[data-rack-slot]');if(slot===previewSlot)return;resetPreview();
  if(slot&&root.contains(slot)){previewSlot=slot;slot.setAttribute('data-preview','');}
 };
 const leave=()=>resetPreview();
 const visibility=()=>{root.dataset.visible=String(visible&&!document.hidden);if(document.hidden){resetPreview();cancelReveal();}schedule();};
 const change=()=>{if(reduced.matches){cancelReveal();stop();setDoor(true);}};
 const scale=event=>{stop();select(event.detail.index,true);};
 const observer=new IntersectionObserver(entries=>{
  visible=entries.some(entry=>entry.isIntersecting&&(entry.intersectionRatio===undefined||entry.intersectionRatio>=.2));
  root.dataset.visible=String(visible&&!document.hidden);
  if(!visible)cancelReveal();
  if(visible&&automatic){automatic=false;if(!reduced.matches&&!navigator.connection?.saveData){playing=true;status();}}
  schedule();
 },{threshold:[0,.2]});
 root.addEventListener('click',click);root.addEventListener('change',choose);root.addEventListener('keydown',keyboard);root.addEventListener('pointerover',preview);root.addEventListener('pointerleave',leave);root.addEventListener('um:network-view',scale);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',change);
 setDoor(opened);setPart(parts[0]);select(0);observer.observe(root);
 const cleanup=()=>{if(disposed)return;disposed=true;clear();cancelReveal();resetPreview();root.dataset.visible='false';observer.disconnect();root.removeEventListener('click',click);root.removeEventListener('change',choose);root.removeEventListener('keydown',keyboard);root.removeEventListener('pointerover',preview);root.removeEventListener('pointerleave',leave);root.removeEventListener('um:network-view',scale);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',change);document.removeEventListener('astro:before-swap',cleanup);delete root.dataset.networkBound;};
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-network-journey]').forEach(bindNetworkJourney);}
document.addEventListener('astro:page-load',boot);boot();
