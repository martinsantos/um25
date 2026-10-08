export function bindHardware(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const image=root.querySelector('[data-hw-image]'),caption=root.querySelector('[data-hw-caption]');
  const views=[...root.querySelectorAll('[data-hw-view]')],video=root.querySelector('video'),motion=root.querySelector('[data-hw-motion]');
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,wanted=!!video && !query.matches && !navigator.connection?.saveData,revision=0,disposed=false;
  const label=()=>{motion?.setAttribute('aria-pressed',String(wanted));if(motion)motion.textContent=wanted?'Pausar recorrido':'Reproducir recorrido';};
  const sync=()=>{
    if(!video)return;
    if(disposed || !wanted || !visible || document.hidden){video.pause();label();return;}
    if(!video.getAttribute('src'))video.src=video.dataset.src;
    video.play().then(()=>{if(disposed || !wanted || !visible || document.hidden)video.pause();}).catch(()=>{wanted=false;label();});label();
  };
  const select=async button=>{
    const n=++revision;wanted=false;sync();root.classList.remove('is-playing');
    const next=new Image();next.src=button.dataset.image;
    try{await next.decode();}catch{return;}
    if(n!==revision || disposed)return;
    image.src=next.src;caption.textContent=button.dataset.detail;views.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  };
  views.forEach((button,i)=>{
    button.addEventListener('click',()=>select(button));
    button.addEventListener('keydown',e=>{
      let next;if(e.key==='ArrowRight')next=(i+1)%views.length;if(e.key==='ArrowLeft')next=(i+views.length-1)%views.length;
      if(e.key==='Home')next=0;if(e.key==='End')next=views.length-1;
      if(next===undefined)return;e.preventDefault();views[next].focus();select(views[next]);
    });
  });
  motion?.addEventListener('click',()=>{
    wanted=!wanted;
    if(wanted){revision++;caption.textContent='Recorrido del sistema, de la vista completa al detalle.';views.forEach(b=>b.setAttribute('aria-pressed','false'));}
    sync();
  });
  video?.addEventListener('playing',()=>{if(wanted && visible && !document.hidden)root.classList.add('is-playing');else video.pause();});
  video?.addEventListener('error',()=>{wanted=false;root.classList.remove('is-playing');label();});
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting && e.intersectionRatio>=.15;sync();},{threshold:[0,.15]});observer.observe(root);
  const visibility=()=>sync();document.addEventListener('visibilitychange',visibility);
  const preference=()=>{if(query.matches)wanted=false;sync();};query.addEventListener('change',preference);
  const cleanup=()=>{disposed=true;revision++;observer.disconnect();video?.pause();document.removeEventListener('visibilitychange',visibility);query.removeEventListener('change',preference);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});label();return cleanup;
}
document.querySelectorAll('[data-hardware-stage]').forEach(bindHardware);
