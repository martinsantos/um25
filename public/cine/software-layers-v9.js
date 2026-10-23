let library;
const prepare=()=>library ||= import('/cine/hairline-v7.js').catch(error=>{library=undefined;throw error;});
export function bindSoftware(root,load=prepare) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const host=root.querySelector('[data-sl-canvas]'),fallback=host.innerHTML,buttons=[...root.querySelectorAll('[data-sl-layer]')];
  const fallbackAttrs=['data-hairline','data-hairline-theme','role','aria-label'].map(name=>[name,host.getAttribute(name)]);
  const text=root.querySelector('[data-sl-description]'),toggle=root.querySelector('[data-sl-separate]');
  const guided=root.dataset.softwareGuided==='true';let permitted=!guided;
  let figure,active=Number(buttons.find(button=>button.getAttribute('aria-pressed')==='true')?.dataset.slLayer)||0,expanded=root.dataset.slCompact!=='true',visible=false,revision=0,disposed=false;
  const options=()=>({theme:'dark',intensity:.75,activeLayer:active,expansion:expanded?.9:.18,label:'Aplicación isométrica con navegación, contenido y acciones.'});
  const destroy=()=>{revision++;figure?.destroy();figure=undefined;host.innerHTML=fallback;for(const [name,value] of fallbackAttrs)if(value!==null)host.setAttribute(name,value);};
  const sync=async()=>{
    if(!permitted || !visible || document.hidden || disposed){destroy();return;}
    if(figure){figure.update(options());return;}
    const token=++revision;
    try {
      const {exploded}=await load();
      if(token!==revision || disposed || !visible || document.hidden)return;
      host.replaceChildren();figure=exploded(host,options());
    } catch {host.innerHTML=fallback;}
  };
  const select=button=>{active=Number(button.dataset.slLayer);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));text.textContent=button.dataset.description;sync();};
  const click=e=>{const button=e.target.closest('[data-sl-layer]');if(button&&buttons.includes(button))select(button);};
  const keyboard=e=>{
    const button=e.target.closest('[data-sl-layer]'),i=buttons.indexOf(button);if(i<0)return;
    let n;if(e.key==='ArrowRight' || e.key==='ArrowDown')n=(i+1)%buttons.length;if(e.key==='ArrowLeft' || e.key==='ArrowUp')n=(i+buttons.length-1)%buttons.length;
    if(e.key==='Home')n=0;if(e.key==='End')n=buttons.length-1;if(n===undefined)return;e.preventDefault();buttons[n].focus();select(buttons[n]);
  };
  const separate=()=>{expanded=!expanded;toggle.setAttribute('aria-pressed',String(expanded));toggle.textContent=expanded?'Unir capas':'Separar capas';sync();};
  root.addEventListener('click',click);root.addEventListener('keydown',keyboard);toggle.addEventListener('click',separate);
  const owner=root.closest('[data-isometric]');
  const isoView=e=>{const i=e.detail.index;active=i===3?2:i===2?1:0;expanded=i>=2;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===active)));sync();};
  owner?.addEventListener('um:iso-view',isoView);
  const storyView=e=>{
    const i=e.detail?.index;if(!Number.isInteger(i)||i<0||i>3)return;
    permitted=true;active=Number.isInteger(e.detail.layer)?Math.max(0,Math.min(3,e.detail.layer)):i===3?2:i===2?1:0;
    expanded=i>=2;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===active)));
    if(text)text.textContent=buttons[active]?.dataset.description||'';
    root.dataset.slActive=String(active);root.dataset.slExpanded=String(expanded);
    toggle.setAttribute('aria-pressed',String(expanded));toggle.textContent=expanded?'Unir capas':'Separar capas';sync();
  };
  const pause=()=>{if(guided){permitted=false;sync();}};
  root.addEventListener('um:software-pause',pause);root.addEventListener('um:software-view',storyView);
  if(root.dataset.softwareView){try{storyView({detail:JSON.parse(root.dataset.softwareView)});}catch{/* Preserve the first frame. */}}
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();},{threshold:0});observer.observe(root);
  const warmup=new IntersectionObserver(([e])=>{if(!guided&&e.isIntersecting&&!navigator.connection?.saveData){load().catch(()=>{});warmup.disconnect();}},{rootMargin:'700px 0px'});
  warmup.observe(root.closest('[data-service-atlas]')||root);
  const visibility=()=>sync();document.addEventListener('visibilitychange',visibility);
  const cleanup=()=>{if(disposed)return;disposed=true;root.removeAttribute('data-bound');root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);toggle.removeEventListener('click',separate);document.removeEventListener('astro:before-swap',cleanup);observer.disconnect();warmup.disconnect();destroy();document.removeEventListener('visibilitychange',visibility);owner?.removeEventListener('um:iso-view',isoView);root.removeEventListener('um:software-view',storyView);root.removeEventListener('um:software-pause',pause);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-software-layers]').forEach(root=>bindSoftware(root));}
document.addEventListener('astro:page-load',boot);boot();
