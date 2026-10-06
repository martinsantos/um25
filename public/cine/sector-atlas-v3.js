export function bindSectorAtlas(root){
 if(root.dataset.bound)return;root.dataset.bound='true';
 const stage=root.querySelector('.um-atlas__stage'),video=root.querySelector('video'),button=root.querySelector('.um-atlas__motion'),now=root.querySelector('.um-atlas__now span');
 const posters=[...root.querySelectorAll('[data-poster]')],links=[...root.querySelectorAll('.um-atlas__list a')];
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let at=0,visible=false,paused=preference.matches||Boolean(navigator.connection?.saveData),keyboardInspecting=false,disposed=false,generation=0;
 const label=()=>{button.textContent=paused?'Reproducir recorrido':'Pausar recorrido';button.setAttribute('aria-pressed',String(!paused));};
 const canPlay=()=>visible&&!document.hidden&&!paused&&!disposed;
 function sync(){
  if(!canPlay()){video.pause();label();return;}
  const src=`/cine/media/cine-${links[at].dataset.scene}.mp4`;
  if(video.getAttribute('src')!==src){video.classList.remove('is-on');video.src=src;}
  const token=++generation;
  video.play().then(()=>{if(token!==generation||!canPlay())return;video.classList.add('is-on');label();}).catch(e=>{if(e?.name==='NotAllowedError'){paused=true;label();}});
 }
 function show(index){
  at=index;const item=links[at];
  links.forEach(link=>link.classList.toggle('is-active',link===item));
  now.textContent=item.dataset.title;root.dataset.scene=item.dataset.scene;
  posters.forEach(p=>p.classList.toggle('is-on',p.dataset.poster===item.dataset.scene));
  video.classList.remove('is-on');generation++;video.pause();
  if(video.currentTime&&video.getAttribute('src')===`/cine/media/cine-${item.dataset.scene}.mp4`)video.currentTime=0;
  sync();
 }
 const ended=()=>{if(canPlay()&&!keyboardInspecting)show((at+1)%links.length);};
 const playing=()=>{if(canPlay())video.classList.add('is-on');};
 const error=()=>{video.classList.remove('is-on');paused=true;label();};
 const toggle=()=>{paused=!paused;if(video.ended&&!paused&&!keyboardInspecting)show((at+1)%links.length);else sync();};
 const visibility=()=>sync();
 const onPreference=()=>{if(preference.matches)paused=true;sync();};
 const disposers=[];
 const listen=(target,event,handler)=>{target.addEventListener(event,handler);disposers.push(()=>target.removeEventListener(event,handler));};
 links.forEach((link,index)=>{
  listen(link,'pointerenter',()=>{if(!keyboardInspecting&&at!==index)show(index);});
  listen(link,'focus',()=>{keyboardInspecting=true;if(at!==index)show(index);});
 });
 listen(root.querySelector('.um-atlas__list'),'focusout',event=>{if(!root.querySelector('.um-atlas__list').contains(event.relatedTarget)){keyboardInspecting=false;if(video.ended)ended();}});
 button.addEventListener('click',toggle);video.addEventListener('ended',ended);video.addEventListener('playing',playing);video.addEventListener('error',error);
 document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',onPreference);
 const observer=new IntersectionObserver(([entry])=>{visible=entry.intersectionRatio>.25;sync();},{threshold:[0,.25,.5]});observer.observe(stage);
 const cleanup=()=>{disposed=true;generation++;disposers.forEach(dispose=>dispose());button.removeEventListener('click',toggle);video.removeEventListener('ended',ended);video.removeEventListener('playing',playing);video.removeEventListener('error',error);root.removeAttribute('data-bound');video.pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',onPreference);};
 document.addEventListener('astro:before-swap',cleanup,{once:true});label();return cleanup;
}
function init(){document.querySelectorAll('[data-sector-atlas]').forEach(bindSectorAtlas);}
if(typeof document!=='undefined'){document.addEventListener('astro:page-load',init);init();}
