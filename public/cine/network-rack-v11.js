export function bindNetworkJourney(root) {
 if(root.dataset.networkBound)return;
 root.dataset.networkBound='true';
 const buttons=[...root.querySelectorAll('[data-network-select]')];
 const allParts=[...root.querySelectorAll('[data-network-part]')];
 let parts=allParts;
 const kits=JSON.parse(root.querySelector('[data-network-kits]')?.textContent||'{}'),remembered=new Map();
 const play=root.querySelector('[data-network-play]'),door=root.querySelector('[data-network-door]');
 const tag=root.querySelector('[data-network-tag]'),title=root.querySelector('[data-network-title]'),copy=root.querySelector('[data-network-copy]'),announce=root.querySelector('[data-network-announce]');
 const focus=root.querySelector('.rk-focus'),detail=root.querySelector('.rk-detail');
 const picker=root.querySelector('[data-network-picker]'),explore=root.querySelector('[data-network-explore]'),points=root.querySelector('[data-network-points]');
 const guides=root.querySelector('[data-rack-guides]');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let step=0,part=parts[0],timer=null,visible=false,playing=false,automatic=root.dataset.networkGuided!=='true',disposed=false,opened=reduced.matches,previewSlot=null,partReveal=null;
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
  const kit=kits[root.dataset.networkService];
  const heading=step===0?(kit?.overview||'Un gabinete. Todo el sistema.'):step===1?data.title:step===2?data.construction:data.detail;
  const description=step===0?(kit?.description||'Abrí la puerta y extraé cada equipo. Puertos, fibra, datos y energía forman una instalación; el punto Wi-Fi lleva la red fuera del rack.'):step===1?data.copy:step===2?data.inside:data.closeup;
  if(title)title.textContent=heading;if(copy)copy.textContent=description;
  if(points){points.hidden=step===0;points.replaceChildren(...JSON.parse(data.points||'[]').map(point=>{const item=document.createElement('li'),label=document.createElement('strong'),text=document.createElement('span');label.textContent=point.name;text.textContent=point.detail;item.append(label,text);return item;}));}
  tag.textContent=step===0?(kit?.name||'La instalación'):part.textContent.trim()+' · '+buttons[step].textContent.replace(/^\s*0\d\s*/,'').trim();
  if(manual&&announce)announce.textContent=heading;
  root.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:heading,copy:description,manual,index:step,part:data.networkPart,code:root.dataset.networkService}}));
 }
 function resetPreview(){if(previewSlot)previewSlot.removeAttribute('data-preview');previewSlot=null;}
 function setPart(button,manual=false){
  if(!button||disposed)return;resetPreview();cancelReveal();root.dataset.motionScope='part';part=button;const data=button.dataset,id=data.networkPart;
  root.dataset.part=id;parts.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  root.dataset.location=data.location||'rack';
  if(picker)picker.value=id;
  root.querySelector('[data-rack-base]').setAttribute('href',`#rk-${id}-base`);
  root.querySelector('[data-rack-cover]').setAttribute('href',`#rk-${id}-cover`);
  root.querySelector('[data-rack-detail]').setAttribute('href',`#rk-${id}-detail`);
  const contextPart=kits[root.dataset.networkService]?.contextPart||id;
  root.dataset.contextPart=contextPart;root.dataset.sameContext=String(contextPart===id);
  root.querySelector('[data-rack-context]')?.setAttribute('href',`#rk-${contextPart}-full`);
  if(guides)guides.setAttribute('href',`#rk-${id}-guides`);
  focus.style.setProperty('--slot-x',data.slotX+'px');focus.style.setProperty('--slot-y',data.slotY+'px');
  focus.style.setProperty('--part-scale',data.scale);focus.style.setProperty('--lift-x',data.liftX+'px');focus.style.setProperty('--lift-y',data.liftY+'px');
  focus.style.setProperty('--piece-y',(data.pieceY||370)+'px');focus.style.setProperty('--open-y',(data.openY||473)+'px');focus.style.setProperty('--mobile-piece-y',(data.mobilePieceY||366)+'px');
  const magnification=['camera','dome','reader','detector'].includes(id)?1.7:1;
  detail.style.setProperty('--detail-scale',Number(data.detailScale)*magnification);
  const x=data.location==='field'?395:245+Number(data.slotX)*.24,y=data.location==='field'?510:517+Number(data.slotY)*.24;
  root.querySelector('[data-rack-leader]').setAttribute('d',`M${x} ${y}H430L510 370H580`);
  root.querySelectorAll('[data-rack-slot]').forEach(slot=>{slot.toggleAttribute('data-selected',slot.dataset.rackSlot===id);slot.toggleAttribute('data-available',parts.some(button=>button.dataset.networkPart===slot.dataset.rackSlot));});
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
  if(index>0)setDoor(true);door.hidden=index!==0||root.dataset.networkService==='107';content(manual);
 }
 function status(){play.setAttribute('aria-pressed',String(playing));play.firstChild.textContent=playing?'Pausar recorrido ':'Ver recorrido ';}
 function stop(){clear();playing=false;automatic=false;status();}
 function setKit(code,manual=false){
  const kit=kits[code];if(!kit)return false;
  const available=kit.parts.map(id=>allParts.find(button=>button.dataset.networkPart===id)).filter(Boolean);
  if(!available.length)return false;
  if(manual&&root.dataset.networkService===code){content();return true;}
  if(manual){remembered.set(root.dataset.networkService,{part:part.dataset.networkPart,step});stop();}
  parts=available;root.dataset.networkService=code;
  allParts.forEach(button=>{button.hidden=!parts.includes(button);button.style.order=String(parts.indexOf(button));button.setAttribute('aria-pressed','false');});
  if(picker)picker.replaceChildren(...parts.map(button=>new Option(button.textContent.trim(),button.dataset.networkPart)));
  const count=root.querySelector('[data-network-count]');
  root.querySelectorAll('[data-network-name]').forEach(name=>{name.textContent=kit.name;});if(count)count.textContent=`${parts.length} piezas`;
  buttons[0].textContent='Sistema';
  const svgTitle=root.querySelector('svg title'),svgDescription=root.querySelector('svg desc');
  if(svgTitle)svgTitle.textContent=kit.name+' · gabinete y equipos';if(svgDescription)svgDescription.textContent=kit.description;
  const saved=manual?remembered.get(code):null;
  setPart(parts.find(button=>button.dataset.networkPart===(saved?.part||kit.initial))||parts[0]);
  const context=root.querySelector('[data-network-context]');
  if(context)context.replaceChildren(...(kit.context||[]).map((text,index)=>{const item=document.createElement('li');if(index){const arrow=document.createElement('span');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');item.append(arrow);}item.append(document.createTextNode(text));return item;}));
  if(explore)explore.open=Boolean(saved?.step);
  if(manual)select(saved?.step??0,true);
  return true;
 }
 function schedule(){
  clear();if(!visible||document.hidden||disposed)return;
  if(!playing){
   if(automatic&&!reduced.matches&&!navigator.connection?.saveData){
    timer=window.setTimeout(()=>{timer=null;automatic=false;setDoor(true);},700);
   }else automatic=false;
   return;
  }
  timer=window.setTimeout(()=>{
   timer=null;
   if(step===0&&!opened){setDoor(true);schedule();return;}
   if(step===3){stop();return;}
   select(step+1);schedule();
  },step===0&&!opened?700:step===2?7200:6400);
 }
 function start(){automatic=false;if(explore)explore.open=true;select(0);setDoor(false);playing=true;status();schedule();}
 function keepResultVisible(){
  if(window.innerWidth>900)return;
  const canvas=root.querySelector('.network-journey__canvas'),controls=root.querySelector('.network-journey__exploration');
  if(!canvas||!controls)return;const rect=canvas.getBoundingClientRect();
  if(rect.top<80||rect.bottom>window.innerHeight-72)controls.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
 }
 const click=event=>{
  const choice=event.target.closest('[data-network-select]');
  if(choice&&root.contains(choice)){stop();select(Number(choice.dataset.networkSelect),true);keepResultVisible();return;}
  const equipment=event.target.closest('[data-network-part]');
  if(equipment&&root.contains(equipment)){stop();if(explore)explore.open=true;setPart(equipment);select(step===0?1:step,true);keepResultVisible();return;}
  const slot=event.target.closest('[data-rack-slot],[data-system-part]');
  if(slot&&root.contains(slot)&&step===0&&(opened||slot.hasAttribute('data-system-part'))){const choice=parts.find(button=>button.dataset.networkPart===(slot.dataset.rackSlot||slot.dataset.systemPart));if(choice){stop();if(explore)explore.open=true;setPart(choice);select(1,true);keepResultVisible();}return;}
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
  stop();setPart(parts.find(button=>button.dataset.networkPart===picker.value));select(step===0?1:step,true);keepResultVisible();
 };
 // Hover follows Hairline's original cabinet interaction: only the nearest
 // unit moves on its rails. No continuous render loop or pointer capture.
 const preview=event=>{
  if(step!==0||!opened||reduced.matches||event.pointerType==='touch')return;
  const slot=event.target.closest('[data-rack-slot]');if(slot===previewSlot)return;resetPreview();
  if(slot&&root.contains(slot)&&parts.some(button=>button.dataset.networkPart===slot.dataset.rackSlot)){previewSlot=slot;slot.setAttribute('data-preview','');}
 };
 const leave=()=>resetPreview();
 const visibility=()=>{root.dataset.visible=String(visible&&!document.hidden);if(document.hidden){resetPreview();cancelReveal();}schedule();};
 const change=()=>{if(reduced.matches){cancelReveal();stop();setDoor(true);}};
 const scale=event=>{stop();select(event.detail.index,true);};
 const service=event=>setKit(String(event.detail.code),true);
 // Keep kit, device and view coherent, including a request made before bind.
 const story=event=>{
  const command=event.detail;if(!command||disposed)return;
  stop();
  if(root.dataset.networkService!==String(command.code))setKit(String(command.code));
  const choice=parts.find(button=>button.dataset.networkPart===command.part);
  if(choice&&choice!==part)setPart(choice);
  select(command.index);
  if(step===0)setDoor(Boolean(command.open));
 };
 const observer=new IntersectionObserver(entries=>{
  visible=entries.some(entry=>entry.isIntersecting&&(entry.intersectionRatio===undefined||entry.intersectionRatio>=.2));
  root.dataset.visible=String(visible&&!document.hidden);
  if(!visible)cancelReveal();
  if(visible&&automatic&&(reduced.matches||navigator.connection?.saveData))automatic=false;
  schedule();
 },{threshold:[0,.2]});
 root.addEventListener('um:network-pause',stop);root.addEventListener('click',click);root.addEventListener('change',choose);root.addEventListener('keydown',keyboard);root.addEventListener('pointerover',preview);root.addEventListener('pointerleave',leave);root.addEventListener('um:network-view',scale);root.addEventListener('um:network-service',service);root.addEventListener('um:network-story',story);
 const collapse=()=>{if(explore&&!explore.open){stop();select(0);}};
 explore?.addEventListener('toggle',collapse);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',change);
 setDoor(opened);if(!setKit(root.dataset.networkService))setPart(parts[0]);select(0);if(root.dataset.networkStory){try{story({detail:JSON.parse(root.dataset.networkStory)});}catch{/* Keep the server-rendered figure. */}}observer.observe(root);
 const cleanup=()=>{if(disposed)return;disposed=true;clear();cancelReveal();resetPreview();remembered.clear();root.dataset.visible='false';observer.disconnect();root.removeEventListener('um:network-pause',stop);root.removeEventListener('click',click);root.removeEventListener('change',choose);root.removeEventListener('keydown',keyboard);root.removeEventListener('pointerover',preview);root.removeEventListener('pointerleave',leave);root.removeEventListener('um:network-view',scale);root.removeEventListener('um:network-service',service);root.removeEventListener('um:network-story',story);explore?.removeEventListener('toggle',collapse);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',change);document.removeEventListener('astro:before-swap',cleanup);delete root.dataset.networkBound;};
 document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-network-journey]').forEach(bindNetworkJourney);}
document.addEventListener('astro:page-load',boot);boot();
