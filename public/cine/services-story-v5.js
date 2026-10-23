export function bindServicesStory(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const stage=root.querySelector('.svc-story__stage'),host=stage.querySelector('.svc-story__frame');
  const mountBtn=stage.querySelector('.svc-story__mount'),motion=stage.querySelector('.svc-story__motion'),movie=stage.querySelector('video');
  const now=stage.querySelector('.svc-story__now span'),items=[...root.querySelectorAll('.svc-story__item')],layers=[...stage.querySelectorAll('[data-poster-layer]')];
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=null,ready=false,active=null,inView=false,disposed=false,wanted=!query.matches && !navigator.connection?.saveData,timer=0,revision=0;
  const send=(action,value)=>frame?.contentWindow?.postMessage({type:'um-cinema-command',action,value},location.origin);
  const apply=el=>{if(!ready)return;for(const c of JSON.parse(el.dataset.cmd || '[]'))send(c.action,c.value);send('play');send('suspend',!inView || document.hidden);};
  const label=()=>{motion.hidden=!!frame || !active?.dataset.video;motion.textContent=wanted?'Pausar recorrido':'Reproducir recorrido';motion.setAttribute('aria-pressed',String(!wanted));};
  const playback=()=>{
    label();if(frame){movie.pause();send('suspend',!inView || document.hidden);return;}
    if(disposed || !inView || document.hidden || !wanted){movie.pause();return;}
    if(active?.dataset.video) {
      if(movie.getAttribute('src')!==active.dataset.video)movie.src=active.dataset.video;
      movie.play().then(()=>{if(disposed || !inView || document.hidden || !wanted || frame)movie.pause();}).catch(()=>{wanted=false;label();});
    }
  };
  const showPoster=async(src,token)=>{
    const on=layers.find(l=>l.classList.contains('is-on')) || layers[0],off=layers.find(l=>l!==on);
    if(!src || on.getAttribute('src')===src)return;
    const image=new Image();image.src=src;try{await image.decode();}catch{return;}
    if(disposed || revision!==token)return;off.src=src;off.classList.add('is-on');on.classList.remove('is-on');
  };
  const activate=el=>{
    if(el===active)return;active=el;const token=++revision;
    items.forEach(i=>i.classList.toggle('is-active',i===el));now.textContent=el.dataset.name || '';showPoster(el.dataset.poster,token);
    movie.pause();stage.classList.remove('has-movie');movie.removeAttribute('src');movie.load();
    clearTimeout(timer);timer=setTimeout(()=>{if(active===el)apply(el);},240);playback();
  };
  const close3d=()=>{
    frame?.remove();frame=null;ready=false;stage.classList.remove('is-ready');mountBtn.textContent='Recorrer el gemelo digital';mountBtn.setAttribute('aria-expanded','false');playback();
  };
  mountBtn.addEventListener('click',()=>{
    if(frame){close3d();return;}
    movie.pause();stage.classList.remove('has-movie');frame=document.createElement('iframe');
    frame.title='Gemelo digital · Sistemas del edificio';frame.src=stage.dataset.src;host.appendChild(frame);host.removeAttribute('aria-hidden');
    mountBtn.textContent='Cerrar el gemelo digital';mountBtn.setAttribute('aria-expanded','true');label();
  });
  const onState=e=>{
    if(e.origin!==location.origin || !frame || e.source!==frame.contentWindow)return;
    if(e.data?.type==='um-cinema-exit'){close3d();mountBtn.focus();return;}
    if(e.data?.type==='um-cinema-state' && e.data.ready && !ready){ready=true;stage.classList.add('is-ready');if(active)apply(active);}
  };
  addEventListener('message',onState);motion.addEventListener('click',()=>{wanted=!wanted;playback();});
  movie.addEventListener('playing',()=>{if(inView && wanted && !frame && !document.hidden)stage.classList.add('has-movie');else movie.pause();});
  movie.addEventListener('error',()=>{stage.classList.remove('has-movie');wanted=false;label();});
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)activate(e.target);},{rootMargin:'-35% 0px -35% 0px'});items.forEach(i=>io.observe(i));
  const stageIO=new IntersectionObserver(([e])=>{inView=e.isIntersecting;playback();},{threshold:0});stageIO.observe(stage);
  items.forEach(item=>item.addEventListener('focusin',()=>activate(item)));
  const visibility=()=>playback();document.addEventListener('visibilitychange',visibility);
  const preference=()=>{if(query.matches)wanted=false;playback();};query.addEventListener('change',preference);
  const cleanup=()=>{disposed=true;revision++;clearTimeout(timer);io.disconnect();stageIO.disconnect();movie.pause();frame?.remove();removeEventListener('message',onState);document.removeEventListener('visibilitychange',visibility);query.removeEventListener('change',preference);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});if(items[0])activate(items[0]);return cleanup;
}
document.querySelectorAll('[data-svc-story]').forEach(bindServicesStory);
