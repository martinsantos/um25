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
  const guided=chapters.length>0,operational=Boolean(chapters[0]?.scenes[0]?.flow),looping=root.dataset.storyLoop==='true'&&(operational||chapters.length>1);
  const flow=root.querySelector('[data-atlas-flow]');
  let outline=[...root.querySelectorAll('[data-story-point]')];
  const discipline=root.querySelector('[data-discipline-system]');
  const beats=[...root.querySelectorAll('[data-atlas-beat]')],scaleLabel=root.querySelector('[data-atlas-scale]');
  let outlineChapter=null;
  function reading(narration){
    const current=chapter();if(!current)return;
    if(outlineChapter!==current){
      const points=current.overview||[current.scenes[0],current.scenes.find(item=>item.view==='layers')||current.scenes[1],current.scenes.at(-1)];
      if(outline.length&&outline.length!==points.length){
        const template=outline[0],list=template.parentElement;
        outline=points.map((_,i)=>{const node=template.cloneNode(true);const number=node.querySelector('.svc-story__point-number');if(number)number.textContent=String(i+1).padStart(2,'0');return node;});list.replaceChildren(...outline);
      }
      outline.forEach((node,i)=>{node.querySelector('[data-point-title]').textContent=points[i].title;node.querySelector('[data-point-copy]').textContent=points[i].copy;});
      outlineChapter=current;
    }
    const phase=narration?.disciplineStage??narration?.flow?.phase??(view==='system'?0:1);
    root.dataset.storyView=view;
    outline.forEach((node,i)=>{node.dataset.state=i===phase?'current':i<phase?'seen':'next';});
    const result=narration?.flow?.phase===2||phase===6;
    const beat=result?'result':view;
    const labels=active.dataset.atlasService==='104'?['Proyecto','Aplicación','Navegación','Datos y acciones','Resultado']:active.dataset.atlasService==='105'?['Proyecto','Consola','Diagnóstico','Seguimiento','Resultado']:active.dataset.atlasService==='106'?['Proyecto','Arquitectura','Dependencias','Plan','Resultado']:['Proyecto','Equipo','Por dentro','Conexión','Resultado'];
    beats.forEach((node,i)=>{node.dataset.current=String(node.dataset.atlasBeat===beat);node.textContent=labels[i];});
    if(scaleLabel)scaleLabel.textContent={system:result?'El sistema, funcionando':'En el proyecto',object:'El equipo que lo hace posible',layers:'Cómo funciona por dentro',detail:active.dataset.atlasService==='104'?'Datos y acciones':active.dataset.atlasService==='105'?'El caso, documentado':active.dataset.atlasService==='106'?'El plan de trabajo':'La conexión, en detalle'}[view];
  }
  let signalCode=null,signalLayer=null;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:true,addEventListener(){},removeEventListener(){}};
  const connection=navigator.connection;
  let active=services[0],view='object',revision=0,disposed=false,sceneAnimation;
  let chapterIndex=0,sceneIndex=0,intent=guided&&!reduced.matches&&!connection?.saveData,started=false,ended=false,inView=false;
  let timer=null,deadline=0,remaining=0,ready=true,manualPart=null,rendering=false;
  let inspectionTimer=null,keyboardHeld=false,pointerFocusUntil=0,explicitPaused=!intent;
  const chapter=()=>chapters[chapterIndex],scene=()=>chapter()?.scenes[sceneIndex];
  function cancelClock(){if(timer!==null){remaining=Math.max(0,deadline-Date.now());window.clearTimeout(timer);timer=null;}}
  function ui(){
    if(!guided)return;
    const inspecting=keyboardHeld||inspectionTimer!==null;
    root.dataset.storyState=ended?'complete':!intent?'paused':inspecting?'exploring':timer!==null?'playing':'waiting';
    root.dataset.storyScene=String(sceneIndex);
    if(project)project.dataset.projectVisible=String(inView&&!document.hidden&&!disposed);
    if(play){play.hidden=false;play.setAttribute('aria-pressed',String(intent&&!ended&&!inspecting));play.textContent=ended?'Volver a ver':!intent?'Reproducir':inspecting?'Continuar':'Pausar';}
    if(status)status.textContent=ended?'Un equipo, del proyecto a la operación.':!intent?'Explorá a tu ritmo.':inspecting?'Explorá. La historia continúa sola.':!inView||document.hidden?'El recorrido sigue cuando lo ves.':'Recorrido automático';
    if(counter)counter.textContent=`${String(chapterIndex+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
    track.forEach((node,index)=>{node.dataset.state=index<chapterIndex?'seen':index===chapterIndex?'current':'next';});
  }
  function schedule(){
    cancelClock();
    if(!inView||document.hidden)clearInspection();
    if(!guided||!intent||ended||!inView||document.hidden||keyboardHeld||inspectionTimer!==null||!ready||disposed){ui();return;}
    if(!started){started=true;sceneIndex=0;remaining=scene().duration;renderStory();return;}
    deadline=Date.now()+remaining;
    timer=window.setTimeout(()=>{timer=null;remaining=0;advance();},remaining);
    ui();
  }
  function clearInspection(){if(inspectionTimer!==null){window.clearTimeout(inspectionTimer);inspectionTimer=null;}}
  function inspect(){
    cancelClock();clearInspection();
    if(!explicitPaused)intent=true;
    if(intent&&inView&&!document.hidden)inspectionTimer=window.setTimeout(()=>{inspectionTimer=null;if(operational){manualPart=null;remaining=scene().duration;renderStory();}else schedule();},6000);
    ui();
  }
  function pause(){explicitPaused=true;intent=false;cancelClock();clearInspection();networkFigure?.dispatchEvent(new CustomEvent('um:network-pause'));ui();}
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
  function updateOperation(narration,index){
    if(!operational)return;
    const state=narration?.flow,code=active.dataset.atlasService;
    if(flow){
      flow.hidden=!state;
      flow.querySelectorAll('[data-flow-node]').forEach((node,i)=>{
        node.dataset.state=i<(state?.phase??0)?'seen':i===state?.phase?'current':'next';
        const label=node.querySelector('[data-flow-label]');if(label&&state)label.textContent=state.nodes[i];
      });
    }
    if(!project)return;
    project.dataset.operationPhase=state?String(state.phase):'';
    const sceneRoot=project.querySelector('.sp-root');let operationScale=1;
    if(sceneRoot){
      sceneRoot.style.removeProperty('transform');
      if(state?.phase===1&&index===0){
        const routePaths=[...project.querySelectorAll(`[data-project-route="${code}"] path`)];
        const points=routePaths.flatMap(path=>{
          const values=path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];
          return values.reduce((rows,value,i)=>{if(i%2===0)rows.push([value,values[i+1]]);return rows;},[]);
        });
        if(points.length){
          const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
          const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
          // The middle passage shows the installed device at working scale.
          // Telecom keeps both ends in view; a cabinet or console needs a closer look.
          let scale=Math.min(1.8,850/Math.max(300,right-left),450/Math.max(220,bottom-top));
          let center=[(left+right)*.5,(top+bottom)*.5];
          if(code!=='103'&&code!=='106'){
            const bounds=project.querySelector(`[data-project-focus="${code}"]`);
            if(bounds){
              center=[Number(bounds.dataset.x),Number(bounds.dataset.y)];
              scale=Math.min(window.innerWidth<=760?5:3.2,600/Math.max(1,Number(bounds.dataset.width)),520/Math.max(1,Number(bounds.dataset.height)));
            }
          }
          operationScale=scale;
          const x=600-center[0]*scale,y=350-center[1]*scale;
          sceneRoot.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
        }
      }
    }
    project.dataset.operationReverse=String(Boolean(state?.reverse));
    if(signalCode!==code){
      signalLayer?.remove();signalCode=code;
      const svgNS='http://www.w3.org/2000/svg';signalLayer=document.createElementNS(svgNS,'g');
      signalLayer.setAttribute('class','sp-operation');signalLayer.setAttribute('aria-hidden','true');
      const paths=project.querySelectorAll(code==='106'?'[data-project-route] path':`[data-project-route="${code}"] path`);
      paths.forEach((path,i)=>{
        if(code!=='106'){
          const signal=document.createElementNS(svgNS,'path');signal.setAttribute('d',path.getAttribute('d'));signal.setAttribute('pathLength','100');signal.setAttribute('class','sp-signal');signal.setAttribute('vector-effect','non-scaling-stroke');signal.style.animationDelay=`${-i*.23}s`;signalLayer.append(signal);
        }
        const coordinates=path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];
        if(i===0&&state&&code!=='106'){
          const start=state.reverse?coordinates.slice(-2):coordinates.slice(0,2),end=state.reverse?coordinates.slice(0,2):coordinates.slice(-2);
          for(const [point,label] of [[start,state.nodes[0]],[end,state.nodes[2]]]){
            if(point.length!==2)continue;
            const text=document.createElementNS(svgNS,'text');
            text.setAttribute('x',String(point[0]+(point[0]>600?-14:14)));text.setAttribute('y',String(point[1]-16));
            text.setAttribute('text-anchor',point[0]>600?'end':'start');text.setAttribute('class','sp-operation-label');text.textContent=label;signalLayer.append(text);
          }
        }
        const endpoint=state?.reverse?coordinates.slice(0,2):coordinates.slice(-2);
        if(endpoint.length===2){const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('cx',String(endpoint[0]));dot.setAttribute('cy',String(endpoint[1]));dot.setAttribute('r','4');dot.setAttribute('class','sp-arrival');signalLayer.append(dot);}
      });
      project.querySelector('.sp-root')?.append(signalLayer);
    }
    if(signalLayer){
      signalLayer.style.display=state?'':'none';
      const box=project.querySelector('svg').getBoundingClientRect();
      const factor=box.width&&box.height?Math.min(box.width/1200,box.height/720):1;
      signalLayer.querySelectorAll('.sp-operation-label').forEach(label=>{
        label.style.fontSize=`${16/(factor*operationScale)}px`;
        label.style.strokeWidth=`${4/(factor*operationScale)}px`;
      });
    }
  }
  async function sync({manual=false,narration=null,newChapter=false}={}) {
    if(!active||disposed)return;
    if((project||discipline)&&!narration&&view==='system')narration=chapter()?.scenes.find(item=>item.disciplineStage===-1)||chapter()?.scenes[sceneIndex]||null;
    rendering=true;
    networkFigure?.dispatchEvent(new CustomEvent('um:network-pause'));
    const operation=operations.find(node=>node.dataset.atlasOperation===active.dataset.atlasService);
    if(!guided&&view==='layers'&&!operation)view='object';
    const index=VIEW_INDEX[view]??1;
    updateOperation(narration,index);reading(narration);
    const contextMode=Boolean(project&&root.dataset.contextProject==='true'&&view==='system'&&active.dataset.atlasService!=='104'&&!manualPart);
    const systemMode=Boolean(discipline&&narration?.disciplineStage!==undefined&&!manualPart&&!contextMode);
    root.dataset.disciplineActive=String(systemMode);
    if(systemMode||active.dataset.atlasService!=='104')software?.dispatchEvent(new CustomEvent('um:software-pause'));
    if(discipline){
      discipline.dataset.visible=String(systemMode);discipline.inert=!systemMode;
      discipline.dataset.disciplineService=active.dataset.atlasService;
      const stage=narration?.disciplineStage??-1;discipline.dataset.disciplineStage=String(stage);
      discipline.querySelectorAll('[data-discipline-node],[data-discipline-tag]').forEach(node=>{node.dataset.current=String(Number(node.dataset.disciplineNode??node.dataset.disciplineTag)===stage);});
      discipline.querySelectorAll('[data-discipline-route]').forEach(node=>{node.dataset.current=String(stage===6||node.dataset.disciplineRoute.split(' ').includes(String(stage)));});
      discipline.querySelector('[data-discipline-key]').textContent=stage<0?'Un sistema. Todas sus capas.':stage===6?'Las capas trabajan como un solo sistema.':`Capa ${String(stage+1).padStart(2,'0')} de 06 · ${chapter().overview[stage].title}`;
      const label=root.querySelector('[data-atlas-reading-label]');if(label)label.textContent=systemMode?'Las capas que resolvemos':'Cómo lo resolvemos';
      if(systemMode&&scaleLabel)scaleLabel.textContent='Arquitectura del servicio';
    }
    for(const node of operations){
      node.hidden=node!==operation;
      const figure=node.querySelector('[data-isometric]');
      if(figure&&node===operation&&!systemMode){figure.dataset.isoView=String(index);figure.dispatchEvent(new CustomEvent('um:iso-select',{detail:{index}}));}
    }
    for(const button of views)button.hidden=button.dataset.atlasView==='layers'&&!guided&&!operation;
    const hardware=!!network&&(active.dataset.atlasService==='101'||!!active.dataset.equipmentKit);
    if(network){network.hidden=!hardware;network.dataset.atlasVisible=String(!(project&&view==='system'));network.inert=Boolean(project&&view==='system');}
    frame.hidden=hardware;frame.dataset.atlasVisible=String(!(project&&view==='system'));frame.inert=Boolean(project&&view==='system');
    if(viewControls)viewControls.hidden=!guided&&hardware;
    if(project){
      project.dataset.projectService=active.dataset.atlasService;project.dataset.projectView=String(index);project.dataset.projectOpen=String(narration?.open??true);
      const pin=project.querySelector(`[data-project-pin="${active.dataset.atlasService}"]`),leader=project.querySelector('[data-project-leader]');
      if(pin&&leader){
        const mobile=window.innerWidth<=760,id=manualPart||narration?.part;
        const x=Number(pin.dataset.x)*(mobile?.20:.33)+(mobile?220:-80),y=Number(pin.dataset.y)*(mobile?.20:.33)+(mobile?70:340);
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
    if(equipment)equipment.hidden=!hardware||(operational&&view==='system');
    if(hardware&&!systemMode&&!contextMode){
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
          // Equipment metadata is already in the document. A lazy SVG fetch
          // must never expose the previous service's caption while it loads.
          const selected=networkFigure.querySelector(`[data-network-part="${part}"]`)?.dataset;
          if(sceneTitle)sceneTitle.textContent=selected?.[index===2?'construction':index===3?'detail':'title']||active.dataset.name;
          if(illustrationCopy)illustrationCopy.textContent=selected?.[index===2?'inside':index===3?'closeup':'copy']||active.dataset.copy;
        }
      }else if(active.dataset.equipmentKit)networkFigure?.dispatchEvent(new CustomEvent('um:network-service',{detail:{code:active.dataset.equipmentKit}}));
      else networkFigure?.dispatchEvent(new CustomEvent('um:network-view',{detail:{index:view==='system'?0:1}}));
    }else if(!systemMode&&software&&!software.hidden){requestSoftware({index,layer:narration?.layer});}
    if(systemMode||contextMode){if(partName)partName.hidden=true;if(equipment)equipment.hidden=true;}
    rendering=false;
    if(!systemMode&&!(project&&view==='system')&&!hardware&&!operation&&(!software||software.hidden)&&image.getAttribute('src')!==src){
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
    if(operational)manualPart=null;
    sceneIndex++;
    let newChapter=false;
    if(sceneIndex>=chapter().scenes.length){
      chapterIndex++;sceneIndex=0;manualPart=null;newChapter=true;
      if(chapterIndex>=chapters.length){
        if(looping){chapterIndex=0;sceneIndex=0;}
        else{chapterIndex=chapters.length-1;sceneIndex=chapter().scenes.length-1;ended=true;intent=false;ui();return;}
      }
    }
    remaining=scene().duration;renderStory(newChapter);
  }
  function resume(){
    explicitPaused=false;clearInspection();
    if(ended){chapterIndex=0;sceneIndex=0;manualPart=null;ended=false;started=false;remaining=scene().duration;}
    intent=true;
    if(!started)schedule();
    else {if(!remaining)remaining=scene().duration;renderStory();}
  }
  function manualView(next){
    inspect();view=next;
    if(guided){const index=chapter().scenes.findIndex(item=>item.view===view);sceneIndex=Math.max(0,index);remaining=scene().duration;}
    sync({manual:true});ui();
  }
  const playbackClick=e=>{
    e.stopPropagation();
    const action=intent&&!ended&&!keyboardHeld&&inspectionTimer===null?'pause':'resume';
    root.dataset.playbackAction=action;
    action==='pause'?pause():resume();
  };
  const click=e=>{
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    if(service&&root.contains(service)){inspect();selectChapter(service);if(guided){started=true;view='system';remaining=scene().duration;}sync({manual:true});ui();}
    if(scale&&root.contains(scale))manualView(scale.dataset.atlasView);
  };
  const keyboard=e=>{
    pointerFocusUntil=0;
    if(guided&&!e.target.closest('[data-atlas-play]')&&e.target.closest(interactive)){keyboardHeld=true;schedule();}
    const service=e.target.closest('[data-atlas-service]'),scale=e.target.closest('[data-atlas-view]');
    const list=service?services:scale?views.filter(button=>!button.hidden):null;if(!list)return;
    const at=list.indexOf(service||scale);let next;
    if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(at+1)%list.length;
    if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(at+list.length-1)%list.length;
    if(e.key==='Home')next=0;if(e.key==='End')next=list.length-1;
    if(next===undefined)return;e.preventDefault();list[next].focus();list[next].click();
  };
  const choose=e=>{
    if(e.target===equipmentPicker){inspect();manualPart=equipmentPicker.value;view=view==='system'?'object':view;manualView(view);return;}
    if(e.target!==picker)return;
    inspect();selectChapter(services.find(button=>button.dataset.atlasService===picker.value));
    if(guided){started=true;view='system';remaining=scene().duration;}sync({manual:true});ui();
    if(guided||window.innerWidth>900)return;
    const target=network&&!network.hidden&&networkFigure?.dataset.step!=='0'?networkFigure?.querySelector('.network-journey__exploration'):root.querySelector('.svc-story__stage');
    if(!target)return;const rect=target.getBoundingClientRect();
    if(rect.top<80||rect.top>window.innerHeight*.35)target.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
  };
  const intentEvent=e=>{if(guided&&!e.target.closest('[data-atlas-play]')&&e.target.closest('button,select,summary,a,[data-rack-slot][data-available],[data-system-part],[data-sl-canvas]')){pointerFocusUntil=Date.now()+1000;inspect();}};
  const interactive='button,select,summary,a,[data-rack-slot][data-available],[data-system-part],[data-sl-canvas]';
  const focusIntent=e=>{if(!guided)return;keyboardHeld=Boolean(e.target.closest(interactive)&&!e.target.closest('[data-atlas-play]')&&Date.now()>pointerFocusUntil);schedule();};
  const blurIntent=e=>{if(e.relatedTarget&&root.contains(e.relatedTarget)&&e.relatedTarget.closest(interactive)&&!e.relatedTarget.closest('[data-atlas-play]'))return;const held=keyboardHeld;keyboardHeld=false;held?inspect():schedule();};
  const networkStep=e=>{
    if(!guided||rendering||network?.hidden)return;
    const detail=e.detail||{};
    if(detail.manual){inspect();view=INDEX_VIEW[detail.index]||view;manualPart=detail.part||manualPart;sceneIndex=Math.max(0,chapter().scenes.findIndex(item=>item.view===view));remaining=scene().duration;views.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasView===view)));if(project)sync({manual:true});}
    if((manualPart||!intent)&&sceneTitle&&illustrationCopy){sceneTitle.textContent=detail.title;illustrationCopy.textContent=detail.copy;}
    if(equipmentPicker&&detail.part)equipmentPicker.value=detail.part;ui();
  };
  const visibility=()=>schedule();
  const resize=()=>{if(project)sync({narration:manualPart?null:scene()});};
  const preference=()=>{if(reduced.matches||connection?.saveData)pause();};
  const observer=guided?new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.35);if(!inView)sceneAnimation?.cancel();schedule();},{threshold:[0,.35]}):null;
  play?.addEventListener('click',playbackClick);
  root.addEventListener('change',choose);root.addEventListener('click',click);root.addEventListener('keydown',keyboard);
  root.addEventListener('pointerdown',intentEvent);root.addEventListener('focusin',focusIntent);root.addEventListener('focusout',blurIntent);root.addEventListener('um:network-step',networkStep);
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);connection?.addEventListener?.('change',preference);
  if(guided){active=services.find(button=>button.dataset.atlasService===chapter().code);view='system';remaining=scene().duration;sync({narration:scene()});ui();observer.observe(theater||root);}
  const cleanup=()=>{
    if(disposed)return;disposed=true;revision++;cancelClock();clearInspection();sceneAnimation?.cancel();observer?.disconnect();signalLayer?.remove();
    play?.removeEventListener('click',playbackClick);
    root.removeEventListener('change',choose);root.removeEventListener('click',click);root.removeEventListener('keydown',keyboard);root.removeEventListener('pointerdown',intentEvent);root.removeEventListener('focusin',focusIntent);root.removeEventListener('focusout',blurIntent);root.removeEventListener('um:network-step',networkStep);
    window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('astro:before-swap',cleanup);reduced.removeEventListener('change',preference);connection?.removeEventListener?.('change',preference);root.removeAttribute('data-bound');
  };
  document.addEventListener('astro:before-swap',cleanup,{once:true});return cleanup;
}
function boot(){document.querySelectorAll('[data-service-atlas]').forEach(bindServiceAtlas);}
document.addEventListener('astro:page-load',boot);boot();
