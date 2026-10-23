let library;
export function bindSoftware(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const host=root.querySelector('[data-sl-canvas]'),fallback=host.innerHTML,buttons=[...root.querySelectorAll('[data-sl-layer]')];
  const text=root.querySelector('[data-sl-description]'),toggle=root.querySelector('[data-sl-separate]');
  let figure,active=0,expanded=true,visible=false,revision=0,disposed=false;
  const options=()=>({theme:'dark',intensity:.75,activeLayer:active,expansion:expanded?.9:.18,label:'Aplicación isométrica con navegación, contenido y acciones.'});
  const destroy=()=>{revision++;figure?.destroy();figure=undefined;host.innerHTML=fallback;};
  const sync=async()=>{
    if(!visible || document.hidden || disposed){destroy();return;}
    if(figure){figure.update(options());return;}
    const token=++revision;
    try {
      library ||= import('/cine/hairline-v5.js');const {exploded}=await library;
      if(token!==revision || disposed || !visible || document.hidden)return;
      host.replaceChildren();figure=exploded(host,options());
    } catch {host.innerHTML=fallback;}
  };
  const select=button=>{active=Number(button.dataset.slLayer);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));text.textContent=button.dataset.description;sync();};
  buttons.forEach((button,i)=>{
    button.addEventListener('click',()=>select(button));
    button.addEventListener('keydown',e=>{
      let n;if(e.key==='ArrowRight' || e.key==='ArrowDown')n=(i+1)%buttons.length;if(e.key==='ArrowLeft' || e.key==='ArrowUp')n=(i+buttons.length-1)%buttons.length;
      if(e.key==='Home')n=0;if(e.key==='End')n=buttons.length-1;if(n===undefined)return;e.preventDefault();buttons[n].focus();select(buttons[n]);
    });
  });
  toggle.addEventListener('click',()=>{expanded=!expanded;toggle.setAttribute('aria-pressed',String(expanded));toggle.textContent=expanded?'Unir capas':'Separar capas';sync();});
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();},{threshold:0});observer.observe(root);
  const visibility=()=>sync();document.addEventListener('visibilitychange',visibility);
  const cleanup=()=>{disposed=true;observer.disconnect();destroy();document.removeEventListener('visibilitychange',visibility);};
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
document.querySelectorAll('[data-software-layers]').forEach(bindSoftware);
