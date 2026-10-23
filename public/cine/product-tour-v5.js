export function bindProductTour(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const tabs=[...root.querySelectorAll('[data-pst-tab]')],panels=[...root.querySelectorAll('[data-pst-panel]')];
  const path=root.querySelector('[data-pst-path]'),motion=root.querySelector('[data-pst-motion]'),query=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,timer=0,visible=false,held=false,disposed=false,wanted=root.dataset.tour==='on' && !query.matches;
  const stop=()=>{clearTimeout(timer);timer=0;root.classList.remove('is-running');};
  const label=()=>{root.dataset.tour=wanted?'on':'off';if(motion){motion.textContent=wanted?'Pausar recorrido':'Reanudar recorrido';motion.setAttribute('aria-pressed',String(!wanted));}};
  const show=key=>{
    current=Math.max(0,tabs.findIndex(t=>t.dataset.pstTab===key));
    tabs.forEach(t=>{
      t.setAttribute('aria-pressed',String(t.dataset.pstTab===key));const bar=t.querySelector('.pst__progress');
      if(bar){bar.style.animation='none';void bar.offsetWidth;bar.style.animation='';}
    });
    panels.forEach(p=>{p.hidden=p.dataset.pstPanel!==key;});if(path)path.textContent=`/${key}`;
  };
  const arm=()=>{
    stop();label();if(disposed || !wanted || held || !visible || document.hidden)return;
    root.classList.add('is-running');timer=setTimeout(()=>{show(tabs[(current+1)%tabs.length].dataset.pstTab);arm();},5200);
  };
  const hold=value=>{held=value;root.classList.toggle('is-held',value);arm();};
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>{wanted=false;show(tab.dataset.pstTab);arm();});
    tab.addEventListener('keydown',e=>{
      let n;if(e.key==='ArrowRight' || e.key==='ArrowDown')n=(i+1)%tabs.length;if(e.key==='ArrowLeft' || e.key==='ArrowUp')n=(i+tabs.length-1)%tabs.length;
      if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n===undefined)return;e.preventDefault();tabs[n].focus();tabs[n].click();
    });
  });
  motion?.addEventListener('click',()=>{wanted=!wanted;if(wanted){held=false;root.classList.remove('is-held');}arm();});
  root.addEventListener('mouseenter',()=>hold(true));root.addEventListener('mouseleave',()=>hold(root.contains(document.activeElement)));
  root.addEventListener('focusin',()=>hold(true));root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))hold(false);});
  const visibility=()=>arm();document.addEventListener('visibilitychange',visibility);
  const preference=()=>{if(query.matches)wanted=false;arm();};query.addEventListener('change',preference);
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting && e.intersectionRatio>=.3;arm();},{threshold:[0,.3]});observer.observe(root);
  const cleanup=()=>{disposed=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',visibility);query.removeEventListener('change',preference);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});label();return cleanup;
}
document.querySelectorAll('[data-pst]').forEach(bindProductTour);
