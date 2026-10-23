const VIEW_INDEX={system:0,object:1,layers:2,detail:3};
const INDEX_VIEW=['system','object','layers','detail'];
export function bindServiceAtlas(root) {
  if(root.dataset.bound)return;root.dataset.bound='true';
  const services=[...root.querySelectorAll('[data-atlas-service]')],views=[...root.querySelectorAll('[data-atlas-view]')];
  const network=root.querySelector('[data-atlas-network]'),networkFigure=network?.querySelector('[data-network-journey]');
  const operations=[...root.querySelectorAll('[data-atlas-operation]')];
  const viewControls=root.querySelector('.svc-story__views'),picker=root.querySelector('[data-atlas-picker]');
  const illustrationCopy=root.querySelector('[data-atlas-context]'),sceneTitle=root.querySelector('[data-atlas-scene-title]');
  const image=root.querySelector('[data-atlas-image]'),frame=image.parentElement,software=root.querySelector('[data-atlas-software]');
  const softwareFigure=software?.querySelector('[data-software-layers]'),project=root.querySelector('[data-atlas-project]');
  const title=root.querySelector('[data-atlas-title]'),copy=root.querySelector('[data-atlas-copy]'),code=root.querySelector('[data-atlas-code]'),link=root.querySelector('[data-atlas-link]');
  const play=root.querySelector('[data-atlas-play]'),status=root.querySelector('[data-atlas-status]'),counter=root.querySelector('[data-atlas-counter]');
  const equipment=root.querySelector('[data-atlas-equipment]'),equipmentPicker=root.querySelector('[data-atlas-part]');
  const partName=root.querySelector('[data-atlas-part-name]'),serviceRail=root.querySelector('.svc-story__list');
  const track=[...root.querySelectorAll('[data-atlas-chapter]')],theater=root.querySelector('[data-atlas-theater]');
  const chapters=JSON.parse(root.querySelector('[data-atlas-narrative]')?.textContent||'[]').filter(chapter=>services.some(button=>button.dataset.atlasService===chapter.code));
  const guided=chapters.length>0;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:true,addEventListener(){},removeEventListener(){}};
  const connection=navigator.connection;
  let active=services[0],view='object',revision=0,disposed=false,sceneAnimation;
  let chapterIndex=0,sceneIndex=0,intent=guided&&!reduced.matches&&!connection?.saveData,started=false,ended=false,inView=false,hovered=false;
  let timer=null,deadline=0,remaining=0,ready=true,manualPart=null,rendering=false;
  const chapter=()=>chapters[chapterIndex],scene=()=>chapter()?.scenes[sceneIndex];
  function cancelClock(){if(timer!==null){remaining=Math.max(0,deadline-Date.now());window.clearTimeout(timer);timer=null;}}
  function ui(){
    if(!guided)return;
    root.dataset.storyState=ended?'complete':!intent?'paused':timer!==null?'playing':'waiting';
    root.dataset.storyScene=String(sceneIndex);
    if(project)project.dataset.projectVisible=String(inView&&!document.hidden&&!disposed);
    if(play){play.hidden=false;play.setAttribute('aria-pressed',String(intent&&!ended));play.textContent=ended?'Volver a ver':intent?'Pausar':'Seguir la historia';}
    if(status)status.textContent=ended?'Un equipo, del proyecto a la operación.':!intent?'Explorá a tu ritmo.':hovered?'En pausa mientras explorás.':!inView||document.hidden?'El recorrido sigue cuando lo ves.':'Una operación, por dentro.';
    if(counter)counter.textContent=`${String(chapterIndex+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
    track.forEach((node,index)=>{node.dataset.state=index<chapterIndex?'seen':index===chapterIndex?'current':'next';});
  }
  function schedule(){
    cancelClock();
    if(!guided||!intent||ended||!inView||document.hidden||hovered||!ready||disposed){ui();return;}
    if(!started){started=true;sceneIndex=0;remaining=scene().duration;renderStory();return;}
    deadline=Date.now()+remaining;
    timer=window.setTimeout(()=>{timer=null;remaining=0;advance();},remaining);
    ui();
  }
  function pause(){intent=false;cancelClock();networkFigure?.dispatchEvent(new CustomEvent('um:network-pause'));ui();}
  function selectChapter(button){
    active=button;const index=chapters.findIndex(item=>item.code===button.dataset.atlasService);
    if(index>=0)chapterIndex=index;sceneIndex=0;manualPart=null;ended=false;
  }
  function requestNetwork(detail){
    networkFigure.dataset.networkStory=JSON.stringify(detail);
    networkFigure.dispatchEvent(new CustomEvent('um:network-story',{detail}));
  }
  function requestSoftware(detail){
    if(!softwareFigure)return;
    softwareFigure.dataset.softwareView=JSON.stringify(detail);
    softwareFigure.dispatchEvent(new CustomEvent('um:software-view',{detail}));
  }
  async function sync({manual=false,narration=null,newChapter=false}={}) {
    if(!active||disposed)return;
    if(project&&!narration&&view==='system')narration=chapter()?.scenes.find(s=>s.view==='system'&&s.open)||null;
    rendering=true;
    networkFigure?.dispatchEvent(new CustomEvent('um:network-pause'));
    const operation=operations.find(node=>node.dataset.atlasOperation===active.dataset.atlasService);
    if(!guided&&view==='layers'&&!operation)view='object';
    const index=VIEW_INDEX[view]??1;
    for(const node of operations){
      node.hidden=node!==operation;
      const figure=node.querySelector('[data-isometric]');
      if(figure&&node===operation){figure.dataset.isoView=String(index);figure.dispatchEvent(new CustomEvent('um:iso-select',{detail:{index}}));}
    }
    for(const button of views)button.hidden=button.dataset.atlasView==='layers'&&!guided&&!operation;
    const hardware=!!network&&(active.dataset.atlasService==='101'||!!active.dataset.equipmentKit);
    if(network){network.hidden=!hardware||Boolean(project&&view==='system');frame.hidden=hardware||Boolean(project&&view==='system');if(viewControls)viewControls.hidden=!guided&&hardware;}
    if(project){
      project.dataset.projectService=active.dataset.atlasService;project.dataset.projectView=String(index);project.dataset.projectOpen=String(narration?.open??true);
      const pin=project.querySelector(`[data-project-pin="${active.dataset.atlasService}"]`),leader=project.querySelector('[data-project-leader]');
      if(pin&&leader){
        const mobile=window.innerWidth<=760,id=manualPart||narration?.part;
        const x=Number(pin.dataset.x)*(mobile?.28:.33)+(mobile?240:-80),y=Number(pin.dataset.y)*(mobile?.28:.33)+(mobile?360:340);
        const target=index===3?[mobile?(['switch','access','outlet','injector'].includes(id)?683:653):811,mobile?313:330]:index===2?[mobile?(id==='fiber'?684:640):788,mobile?484:473]:[mobile?658:803,mobile?366:370];
        leader.setAttribute('d',`M${x} ${y}H430L${target[0]-110} ${target[1]+20}H${target[0]-80}`);
      }
      root.querySelectorAll('[data-atlas-project-link]').forEach(anchor=>anchor.href=active.dataset.href);
    }
    if(project&&serviceRail&&serviceRail.scrollWidth>serviceRail.clientWidth&&serviceRail.scrollTo){
      const left=active.offsetLeft-serviceRail.offsetLeft,right=left+active.offsetWidth;
      if(left<serviceRail.scrollLeft||right>serviceRail.scrollLeft+serviceRail.clientWidth)serviceRail.scrollTo({left:Math.max(0,left-(serviceRail.clientWidth-active.offsetWidth)/2),behavior:reduced.matches?'auto':'smooth'});
    }
    if(partName){partName.hidden=view==='system';partName.textContent=active.dataset.atlasService==='104'?'Interfaz de software':active.dataset.atlasService==='105'?'Centro de operaciones':active.dataset.atlasService==='106'?'Planos y documentación':'';}
    const token=++revision,src=active.dataset[view];
    if(software)software.hidden=active.dataset.atlasService!=='104'||(!guided&&view!=='object')||(guided&&view==='system');
    image.hidden=!!operation||Boolean(software&&!software.hidden);
    services.forEach(button=>button.setAttribute('aria-pressed',String(button===active)));
    views.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.atlasView===view)));
    title.textContent=active.dataset.title;copy.textContent=active.dataset.copy;code.textContent=active.dataset.name;root.dataset.activeService=active.dataset.atlasService;
    if(picker)picker.value=active.dataset.atlasService;
    const announce=root.querySelector('[data-atlas-announce]');if(manual&&announce)announce.textContent=active.dataset.name+'. '+active.dataset.title;
    if(sceneTitle)sceneTitle.textContent=narration?.title||active.dataset.name;
    if(illustrationCopy){illustrationCopy.hidden=!guided&&hardware;illustrationCopy.textContent=narration?.copy||active.dataset[view==='system'?'context':view==='layers'?'layersCopy':view==='detail'?'detailCopy':'objectCopy']||active.dataset.copy;}
    link.href=active.dataset.href;link.firstChild.textContent=`Explorar ${active.dataset.name.toLowerCase()} `;
    if(equipment)equipment.hidden=!hardware;
    if(hardware){
      if(guided){
        const kit=JSON.parse(networkFigure.querySelector('[data-network-kits]')?.textContent||'{}')[active.dataset.atlasService];
        const part=manualPart||narration?.part||kit?.initial;
        if(equipmentPicker&&kit){
          if(equipmentPicker.dataset.service!==active.dataset.atlasService){
            equipmentPicker.replaceChildren(...kit.parts.map(id=>new Option(networkFigure.querySelector(`[data-network-part="${id}"]`)?.textContent.trim()||id,id)));
            equipmentPicker.dataset.service=active.dataset.atlasService;
          }
          equipmentPicker.value=part;
        }
        requestNetwork({code:active.dataset.atlasService,part,index,open:narration?.open??index>0});
        if(partName)partName.textContent=networkFigure.querySelector(`[data-network-part="${part}"]`)?.textContent.trim()||'';
        if((manualPart||manual)&&!(project&&view==='system')){
          if(sceneTitle)sceneTitle.textContent=networkFigure.querySelector('[data-network-title]')?.textContent||active.dataset.name;
          if(illustrationCopy)illustrationCopy.textContent=networkFigure.querySelector('[data-network-copy]')?.textContent||active.dataset.copy;
        }
      }else if(active.dataset.equipmentKit)networkFigure?.dispatchEvent(new CustomEvent('um:network-service',{detail:{code:active.dataset.equipmentKit}}));
      else networkFigure?.dispatchEvent(new CustomEvent('um:network-view',{detail:{index:view==='system'?0:1}}));
    }else if(software&&!software.hidden){requestSoftware({index,layer:narration?.layer});}
    rendering=false;
    if(!(project&&view==='system')&&!hardware&&!operation&&(!software||software.hidden)&&image.getAttribute('src')!==src){
      const next=new Image();next.src=src;
      try{await next.decode();}catch{if(token===revision)image.alt=`Vista de ${active.dataset.name.toLowerCase()} no disponible`;return;}
      if(disposed||token!==revision)return;
      image.src=src;image.alt=view==='system'?`${active.dataset.name} dentro de la planta de un proyecto`:active.dataset.alt;
      frame.classList.remove('is-entering');void frame.offsetWidth;frame.classList.add('is-entering');
    }
    if(newChapter&&!project&&theater&&!reduced.matches&&inView&&!document.hidden&&typeof theater.animate==='function'){
      sceneAnimation?.cancel();sceneAnimation=theater.animate([{opacity:.35},{opacity:1}],{duration:420,easing:'ease-out'});sceneAnimation.finished.catch(()=>{});
    }
  }
  async function renderStory(newChapter=false){
    const current=scene();if(!current)return;
    active=services.find(button=>button.dataset.atlasService===chapter().code);view=current.view;
    ready=false;cancelClock();ui();
    const pending=sync({narration:manualPart?null:current,newChapter}),token=revision;
    await pending;
    if(disposed||token!==revision)return;
    ready=true;schedule();
  }
  function advance(){
    if(disposed)return;
    sceneIndex++;
    let newChapter=false;
    if(sceneIndex>=chapter().scenes.length){
      chapterIndex++;sceneIndex=0;manualPart=null;newChapter=true;
      if(chapterIndex>=chapters.length){chapterIndex=chapters.length-1;sceneIndex=chapter().scenes.length-1;ended=true;intent=false;ui();return;}
    }
    remaining=scene().duration;renderStory(newChapter);
  }
  function resume(){
    if(ended){chapterIndex=0;sceneIndex=0;manualPart=null;ended=false;started=false;remaining=scene().duration;}
    intent=true;
    if(!started)schedule();
    else {if(!remaining)remaining=scene().duration;renderStory();}
  }
  function manualView(next){
    pause();view=next;
    if(guided){const index=chapter().scenes.findIndex(item=>item.view===view);sceneIndex=Math.max(0,index);remaining=scene().duration;}
    sync({manual:true});ui();
  }
  const click=e=>{
    if(e.target.closest('[data-atlas-play]')===play&&play){intent?pause():resume();return;}
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    if(service&&root.contains(service)){pause();selectChapter(service);if(guided){started=true;view='system';remaining=scene().duration;}sync({manual:true});ui();}
    if(scale&&root.contains(scale))manualView(scale.dataset.atlasView);
  };
  const keyboard=e=>{
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    const list=service?services:scale?views.filter(button=>!button.hidden):null;if(!list)return;
    const at=list.indexOf(service||scale);let next;
    if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(at+1)%list.length;
    if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(at+list.length-1)%list.length;
    if(e.key==='Home')next=0;if(e.key==='End')next=list.length-1;
    if(next===undefined)return;e.preventDefault();list[next].focus();list[next].click();
  };
  const choose=e=>{
    if(e.target===equipmentPicker){pause();manualPart=equipmentPicker.value;view=view==='system'?'object':view;manualView(view);return;}
    if(e.target!==picker)return;
    pause();selectChapter(services.find(button=>button.dataset.atlasService===picker.value));
    if(guided){started=true;view='system';remaining=scene().duration;}sync({manual:true});ui();
    if(guided||window.innerWidth>900)return;
    const target=network&&!network.hidden&&networkFigure?.dataset.step!=='0'?networkFigure?.querySelector('.network-journey__exploration'):root.querySelector('.svc-story__stage');
    if(!target)return;const rect=target.getBoundingClientRect();
    if(rect.top<80||rect.top>window.innerHeight*.35)target.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
  };
  const intentEvent=e=>{if(guided&&!e.target.closest('[data-atlas-play]')&&e.target.closest('button,select,summary,a,[data-rack-slot][data-available],[data-system-part],[data-sl-canvas]'))pause();};
  const interactive='button,select,summary,a,[data-rack-slot][data-available],[data-system-part],[data-sl-canvas]';
  const hover=e=>{if(!guided||e.pointerType==='touch'||e.target.closest('[data-atlas-play]'))return;const target=e.target.closest(interactive);if(target&&root.contains(target)){hovered=true;schedule();}};
  const leave=e=>{if(hovered&&(!e.relatedTarget?.closest?.(interactive)||e.relatedTarget.closest('[data-atlas-play]'))){hovered=false;schedule();}};
  const networkStep=e=>{
    if(!guided||rendering||network?.hidden)return;
    const detail=e.detail||{};
    if(detail.manual){pause();view=INDEX_VIEW[detail.index]||view;manualPart=detail.part||manualPart;sceneIndex=Math.max(0,chapter().scenes.findIndex(item=>item.view===view));remaining=scene().duration;views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasView===view)));if(project)sync({manual:true});}
    if((manualPart||!intent)&&sceneTitle&&illustrationCopy){sceneTitle.textContent=detail.title;illustrationCopy.textContent=detail.copy;}
    if(equipmentPicker&&detail.part)equipmentPicker.value=detail.part;ui();
  };
  const visibility=()=>schedule();
  const resize=()=>{if(project)sync({narration:manualPart?null:scene()});};
  const preference=()=>{if(reduced.matches||connection?.saveData)pause();};
  const observer=guided?new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.35);if(!inView)sceneAnimation?.cancel();schedule();},{threshold:[0,.35]}):null;
  root.addEventListener('change',choose);root.addEventListener('click',click);root.addEventListener('keydown',keyboard);
  root.addEventListener('pointerdown',intentEvent);root.addEventListener('focusin',intentEvent);root.addEventListener('pointerover',hover);root.addEventListener('pointerout',leave);root.addEventListener('um:network-step',networkStep);
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);connection?.addEventListener?.('change',preference);
  if(guided){active=services.find(button=>button.dataset.atlasService===chapter().code);view='system';remaining=scene().duration;sync({narration:scene()});ui();observer.observe(theater||root);}
  const cleanup=()=>{
    if(disposed)return;disposed=true;revision++;cancelClock();sceneAnimation?.cancel();observer?.disconnect();
    root.removeEventListener('change',choose);root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);root.removeEventListener('pointerdown',intentEvent);root.removeEventListener('focusin',intentEvent);root.removeEventListener('pointerover',hover);root.removeEventListener('pointerout',leave);root.removeEventListener('um:network-step',networkStep);
    window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('astro:before-swap',cleanup);reduced.removeEventListener('change',preference);connection?.removeEventListener?.('change',preference);root.removeAttribute('data-bound');
  };
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-service-atlas]').forEach(bindServiceAtlas);}
document.addEventListener('astro:page-load',boot);boot();
