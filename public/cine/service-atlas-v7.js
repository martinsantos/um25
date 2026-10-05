export function bindServiceAtlas(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const services=[...root.querySelectorAll('[data-atlas-service]')],views=[...root.querySelectorAll('[data-atlas-view]')];
  const network=root.querySelector('[data-atlas-network]'),networkFigure=network?.querySelector('[data-network-journey]');
  const viewControls=root.querySelector('.svc-story__views');
  const image=root.querySelector('[data-atlas-image]'),frame=image.parentElement;
  const title=root.querySelector('[data-atlas-title]'),copy=root.querySelector('[data-atlas-copy]'),code=root.querySelector('[data-atlas-code]'),link=root.querySelector('[data-atlas-link]');
  let active=services[0],view='object',revision=0,disposed=false;
  async function sync() {
    if(!active)return;
    if(network){const shown=active.dataset.atlasService==='101';network.hidden=!shown;frame.hidden=shown;if(viewControls)viewControls.hidden=shown;}
    const token=++revision,src=active.dataset[view];
    services.forEach(button=>button.setAttribute('aria-pressed',String(button===active)));
    views.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasView===view)));
    title.textContent=active.dataset.title;copy.textContent=active.dataset[view==='system'?'context':'copy'];code.textContent=active.dataset.atlasService;
    link.href=active.dataset.href;link.firstChild.textContent=`Explorar ${active.dataset.name.toLowerCase()} `;
    if(network&&!network.hidden){networkFigure?.dispatchEvent(new CustomEvent('um:network-view',{detail:{index:view==='system'?0:1}}));return;}
    if(image.getAttribute('src')===src)return;
    const next=new Image();next.src=src;
    try{await next.decode();}catch{if(token===revision)image.alt=`Vista de ${active.dataset.name.toLowerCase()} no disponible`;return;}
    if(disposed||token!==revision)return;
    image.src=src;image.alt=view==='system'?`${active.dataset.name} dentro de la planta de un proyecto`:active.dataset.alt;
    frame.classList.remove('is-entering');void frame.offsetWidth;frame.classList.add('is-entering');
  }
  const click=e=>{
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    if(service&&root.contains(service)){active=service;sync();}
    if(scale&&root.contains(scale)){view=scale.dataset.atlasView;sync();}
  };
  const keyboard=e=>{
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    const list=service?services:scale?views:null;if(!list)return;
    const at=list.indexOf(service||scale);let next;
    if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(at+1)%list.length;
    if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(at+list.length-1)%list.length;
    if(e.key==='Home')next=0;if(e.key==='End')next=list.length-1;
    if(next===undefined)return;e.preventDefault();list[next].focus();list[next].click();
  };
  const narrative=e=>{if(active.dataset.atlasService==='101'&&e.target===networkFigure){title.textContent=e.detail.title;copy.textContent=e.detail.copy;}};
  root.addEventListener('um:network-step',narrative);root.addEventListener('click',click);root.addEventListener('keydown',keyboard);
  const cleanup=()=>{disposed=true;revision++;root.removeEventListener('um:network-step',narrative);root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);delete root.dataset.bound;};
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-service-atlas]').forEach(bindServiceAtlas);}
document.addEventListener('astro:page-load',boot);boot();
