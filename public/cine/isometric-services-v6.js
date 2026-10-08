export function bindIsometric(root) {
  if(root.dataset.bound)return;
  root.dataset.bound='true';
  const buttons=[...root.querySelectorAll('[data-iso-select]')];
  const panels=[...root.querySelectorAll('[data-iso-panel]')];
  const title=root.querySelector('[data-iso-title]'),description=root.querySelector('[data-iso-description]'),step=root.querySelector('[data-iso-step]');
  let selected=Number(root.dataset.isoView||1);
  const select=index=>{
    selected=index;const button=buttons[index];if(!button)return;
    const view=index===0?'system':index===3&&root.dataset.isoCode!=='104'?'detail':'object';
    root.dataset.isoView=String(index);root.classList.toggle('is-open',index===2);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    for(const panel of panels){const shown=panel.dataset.isoPanel===view;panel.hidden=!shown;panel.classList.toggle('is-entering',shown);}
    title.textContent=button.dataset.title;description.textContent=button.dataset.description;step.textContent=String(index+1).padStart(2,'0');
    root.dispatchEvent(new CustomEvent('um:iso-view',{detail:{index}}));
  };
  const click=e=>{const button=e.target.closest('[data-iso-select]');if(button&&root.contains(button))select(Number(button.dataset.isoSelect));};
  const keyboard=e=>{
    if(!e.target.closest('[data-iso-select]'))return;
    let next;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(selected+1)%buttons.length;
    if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(selected+buttons.length-1)%buttons.length;
    if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;
    if(next===undefined)return;e.preventDefault();select(next);buttons[next].focus();
  };
  root.addEventListener('click',click);root.addEventListener('keydown',keyboard);
  const cleanup=()=>{root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);delete root.dataset.bound;};
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-isometric]').forEach(bindIsometric);}
document.addEventListener('astro:page-load',boot);boot();
