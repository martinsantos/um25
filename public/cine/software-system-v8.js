// One operational example, directed by the existing service story clock.
// Requests flow through access/API/data; releases follow their own control path.
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const phase=(ms,start,length)=>smooth((ms-start)/length);
export function softwarePose(stage,elapsed,reduced=false){
 const done=n=>reduced||stage===6||stage>n;
 const at=(n,start,length)=>done(n)?1:stage===n?phase(elapsed,start,length):0;
 return {
  drawer:at(0,0,700),
  gates:[0,1,2].map(i=>at(1,350+i*650,800)),
  gateSpread:[0,1,2].map(i=>reduced?0:stage===1?phase(elapsed,350+i*650,800):stage===2?1-phase(elapsed,0,700):0),
  mappings:[0,1,2].map(i=>at(2,400+i*550,850)),
  record:at(3,350,1000),release:at(4,400,2200),
  routes:[0,1,2,3,4,5].map(n=>at(n,[1400,2900,2650,1800,950,1500][n],[1800,1700,1700,2000,2500,2200][n])),
  health:at(5,350,1300)
 };
}

// Narration uses the same elapsed time as the mechanism, so pausing freezes both.
export const SOFTWARE_BEATS = [
 [[0,'La orden 0248 reúne proyecto, responsable y estado.'],[1000,'La persona revisa el contexto y solicita la aprobación.'],[3200,'La solicitud pasa a la capa de permisos.']],
 [[0,'La misma solicitud conserva la identidad de quien la envía.'],[1300,'Comprobamos su rol y el alcance sobre este proyecto.'],[4600,'Identidad, rol y alcance resueltos: la acción puede continuar.']],
 [[0,'El contrato define qué campos recibe el otro sistema.'],[1400,'Relacionamos proyecto, sede y responsable sin perder su significado.'],[4350,'Los campos validados llegan juntos a la capa de datos.']],
 [[0,'La orden conserva su relación con el proyecto.'],[1350,'Guardamos el cambio con su historial y su responsable.'],[3800,'El registro se confirma: la orden vuelve a la interfaz como aprobada.']],
 [[0,'Ahora, cómo entregamos mejoras a esta aplicación.'],[1100,'Las pruebas y el versionado preparan un artefacto publicable.'],[3450,'Publicamos la versión y conservamos una vía de recuperación.']],
 [[0,'La aplicación necesita una infraestructura que la sostenga.'],[1650,'Conectamos aplicación, datos y monitoreo de la operación.'],[3700,'Observación, respaldo y recuperación completan el servicio.']],
];
export function softwareNarration(stage,elapsed){
 const beats=SOFTWARE_BEATS[stage];
 return beats?.filter(([at])=>elapsed>=at).at(-1)?.[1]||'';
}

function pointAlong(points,t){
 const lengths=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1]));
 let remaining=clamp(t)*lengths.reduce((sum,n)=>sum+n,0);
 for(let i=0;i<lengths.length;i++){
  if(remaining<=lengths[i]||i===lengths.length-1){const q=lengths[i]?remaining/lengths[i]:0;return points[i].map((v,j)=>v+(points[i+1][j]-v)*q);}
  remaining-=lengths[i];
 }
 return points[0]||[0,0];
}
export function bindSoftwareSystem(root){
 const drawing=root.querySelector('.sw-system'),owner=root.closest('[data-service-atlas]');
 if(!drawing||!owner||drawing.dataset.enhanced)return;
 drawing.dataset.enhanced='true';
 const svg=root.querySelector('svg'),viewport=drawing.querySelector('.sw-viewport');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const components=[...drawing.querySelectorAll('.sw-component')];
 const appSurface=drawing.querySelector('[data-sw-app-surface]');
 const drawer=drawing.querySelector('[data-sw-drawer]'),record=drawing.querySelector('[data-sw-record]'),release=drawing.querySelector('[data-sw-release]');
 const gates=[...drawing.querySelectorAll('[data-sw-gate]')],checks=[...drawing.querySelectorAll('[data-sw-check]')],mappings=[...drawing.querySelectorAll('[data-sw-mapping]')];
 const routeBases=[...drawing.querySelectorAll('[data-sw-route-base]')];
 const traces=[...drawing.querySelectorAll('[data-sw-trace]')],health=[...drawing.querySelectorAll('[data-sw-health]')];
 const tokens=[...drawing.querySelectorAll('[data-sw-token]')].map(node=>({node,points:node.dataset.points.split(';').map(p=>p.split(',').map(Number))}));
 const ties=[...drawing.querySelectorAll('[data-sw-registration]')],drawerTies=[...drawing.querySelectorAll('[data-sw-drawer-tie]')];
 const caption=owner.querySelector('[data-atlas-context]'),chapterLabel=owner.querySelector('[data-software-chapter]');
 const names=['Producto · UX/UI','Identidad y permisos','Integraciones','Datos y respuesta','Entrega de versiones','Infraestructura y operación'];
 const base=[0,0,1200,650];
 let mobile=false;
 let stage=null,previousStage=-1,elapsed=0,last=null,frame=0,disposed=false,current=[...base],from=[...base],target=[...base],cameraElapsed=0,detail=-1;
 const active=()=>root.dataset.disciplineService==='104';
 const running=()=>!disposed&&active()&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&!document.hidden&&!reduced.matches;
 function focus(){
  const component=components.find(n=>Number(n.dataset.disciplineNode)===stage);
  if(reduced.matches||!component||typeof component.getBBox!=='function')return [...base];
  const screen=svg.getBoundingClientRect(),aspect=screen.width/screen.height||1200/650;
  const dataFocus=stage===3&&detail>=0?(detail===0?drawing.querySelector('[data-sw-table="órdenes"]'):record):null;
  const focusElement=dataFocus|| (stage===0&&detail===1?drawer:screen.width<600?(stage===0?drawer:dataFocus||component.querySelector('.sw-machine')||component):component.querySelector('.sw-machine')||component);
  const b=focusElement.getBBox();if(!b.width||!b.height)return [...base];
  // Include the final swept positions of gates, drawer and release, not just
  // resting bounds. A close-up still keeps its surrounding connections visible.
  if(stage===1){
   // Frame the fully separated permission sheets, including their swept area.
   const swept=gates.map((n,i)=>{const q=n.getBBox();return {x:q.x+[-60,0,60][i],y:q.y+[15,-50,-115][i],width:q.width,height:q.height};});
   if(screen.width<600&&detail>=0){const q=swept[detail];b.x=q.x;b.y=q.y;b.width=q.width;b.height=q.height;}else{
   const left=Math.min(b.x,...swept.map(q=>q.x)),top=Math.min(b.y,...swept.map(q=>q.y));
   const right=Math.max(b.x+b.width,...swept.map(q=>q.x+q.width)),bottom=Math.max(b.y+b.height,...swept.map(q=>q.y+q.height));
   b.x=left;b.y=top;b.width=right-left;b.height=bottom-top;}
  }
  const pad=dataFocus?10:stage===1?(screen.width<600?14:24):stage===4?40:22;
  const w=Math.max(screen.width<600?(stage===3?125:stage===0||stage===1?240:300):stage===0&&detail===1?360:430,b.width+pad*2,(b.height+pad*2)*aspect);
  const h=w/aspect;
  root.dataset.cameraFraming='measured';
  return [b.x+b.width/2-w/2,b.y+b.height/2-h/2,w,h];
 }
 function render(){
  const pose=softwarePose(stage,elapsed,reduced.matches);
  const words=softwareNarration(stage,elapsed);
  if(caption&&words&&!reduced.matches&&caption.textContent!==words)caption.textContent=words;
  if(chapterLabel){const label=stage>=0&&stage<6?`${String(stage+1).padStart(2,'0')} / 06 · ${names[stage]}`:stage===6?'Una aplicación. Todas sus capas.':'De la tarea a la operación';if(chapterLabel.textContent!==label)chapterLabel.textContent=label;}
  drawing.dataset.operationState=stage===6?'complete':stage===-1?'overview':String(stage);
  drawing.dataset.operationTime=String(Math.round(elapsed));
  drawer.style.opacity=String(pose.drawer);
  if(appSurface)appSurface.style.opacity=String(1-.57*pose.drawer);
  drawer.setAttribute('transform',`translate(0 ${12*(1-pose.drawer)})`);
  drawerTies.forEach(n=>{const base=n.dataset.base.split(',').map(Number),tip=n.dataset.tip.split(',').map(Number);n.setAttribute('points',`${base.join(',')} ${tip[0]},${tip[1]+12*(1-pose.drawer)}`);n.setAttribute('opacity',String(pose.drawer));});
  gates.forEach((n,i)=>n.setAttribute('transform',`translate(${[-60,0,60][i]*pose.gateSpread[i]} ${[15,-50,-115][i]*pose.gateSpread[i]})`));
  ties.forEach(n=>{const i=Number(n.dataset.swRegistration),base=n.dataset.base.split(',').map(Number),tip=n.dataset.tip.split(',').map(Number);n.setAttribute('points',`${base.join(',')} ${tip[0]+[-60,0,60][i]*pose.gateSpread[i]},${tip[1]+[15,-50,-115][i]*pose.gateSpread[i]}`);});
  gates.forEach((n,i)=>{const content=n.querySelector('[data-sw-gate-content]');if(content)content.setAttribute('opacity',String(i===2?1:.10+.90*pose.gateSpread[i]));});
  checks.forEach((n,i)=>n.setAttribute('fill',pose.gates[i]>.95?'#70cdb8':'#a4bac7'));
  mappings.forEach((n,i)=>n.setAttribute('opacity',String(.15+.85*pose.mappings[i])));
  record.setAttribute('transform',`translate(${-19*pose.record} ${11*pose.record})`);
  release.setAttribute('transform',`translate(${50*pose.release} ${29*pose.release-10*Math.sin(Math.PI*pose.release)})`);
  routeBases.forEach((n,i)=>n.setAttribute('opacity',stage===i?'.38':'.08'));
  traces.forEach((n,i)=>{n.setAttribute('stroke-dasharray',`${100*pose.routes[i]} 100`);n.setAttribute('opacity',stage===i?'1':stage===6?'.3':'.07');});
  tokens.forEach(({node,points},i)=>{
   const t=pose.routes[i],q=pointAlong(points,t);
   node.setAttribute('transform',`translate(${q[0]} ${q[1]})`);
   node.setAttribute('opacity',String(stage===i&&t>0&&t<1?Math.min(1,t*12,(1-t)*12):0));
  });
  const confirmed=reduced.matches||stage===6||stage>3||(stage===3&&pose.routes[3]===1);
  for(const [selector,value] of [['[data-sw-record-state]',confirmed?'Aprobada':'En revisión'],['[data-sw-ui-state]',confirmed?'Aprobada':'En revisión'],['[data-sw-submit]',confirmed?'Aprobada ✓':'Aprobar orden']]){
   const label=drawing.querySelector(selector);if(label.textContent!==value)label.textContent=value;
  }
  drawing.querySelector('[data-sw-submit-bg]').setAttribute('fill',confirmed?'#247d69':'#dc2626');
  health.forEach(n=>n.setAttribute('r',String(2+pose.health*.7)));
  const e=phase(cameraElapsed,0,1050),emphasis=phase(elapsed,0,950);
  components.forEach(n=>{
   const nstage=Number(n.dataset.disciplineNode),overview=stage<0||stage===6||reduced.matches;
   n.style.opacity=String(overview?1:nstage===stage?.65+.35*emphasis:nstage===stage+1?.26:(nstage===previousStage||previousStage<0)?1-.92*emphasis:.08);
   n.querySelector('.sw-label').style.opacity=String(overview?1:0);
  });
  current=from.map((v,i)=>v+(target[i]-v)*e);
  if(stage>=0&&stage<=2&&!reduced.matches){
   const transit=phase(pose.routes[stage],.05,.8),next=components.find(n=>Number(n.dataset.disciplineNode)===stage+1);
   if(transit>0&&next&&typeof next.getBBox==='function'){
    const b=(next.querySelector('.sw-machine')||next).getBBox();
    const center=[b.x+b.width/2,b.y+b.height/2];
    current[0]+=(center[0]-(current[0]+current[2]/2))*.64*transit;
    current[1]+=(center[1]-(current[1]+current[3]/2))*.64*transit;
   }
  }
  viewport.setAttribute('viewBox',current.join(' '));
 }
 function tick(now){
  frame=0;if(!running())return;
  if(last!==null){const dt=Math.max(0,now-last);elapsed+=dt;cameraElapsed+=dt;}last=now;
  const nextDetail=stage===0?(elapsed<850?0:1):mobile&&stage===1?Math.max(0,Math.min(2,Math.floor((elapsed-350)/1450))):stage===3?(elapsed<1500?0:1):-1;
  if(nextDetail!==detail){detail=nextDetail;from=[...current];target=focus();cameraElapsed=0;}
  render();if(elapsed<6600||cameraElapsed<1100)frame=requestAnimationFrame(tick);
 }
 function update(){
  cancelAnimationFrame(frame);frame=0;last=null;
  if(!active())return;
  // Match the nested canvas to the outer surface without changing any other
  // discipline's outer coordinate system.
  const screen=svg.getBoundingClientRect();mobile=screen.width<600;
  const outer=[0,0,screen.width||1000,screen.height||650];
  svg.setAttribute('viewBox',outer.join(' '));
  viewport.setAttribute('x',String(outer[0]));viewport.setAttribute('y',String(outer[1]));
  viewport.setAttribute('width',String(outer[2]));viewport.setAttribute('height',String(outer[3]));
  const next=Number(root.dataset.disciplineStage);
  if(stage!==next){previousStage=stage??-1;stage=next;detail=-1;elapsed=0;from=[...current];cameraElapsed=0;target=focus();}
  if(reduced.matches){target=[...base];from=[...base];cameraElapsed=2200;}
  render();if(running())frame=requestAnimationFrame(tick);
 }
 function resize(){if(active()){from=[...current];target=focus();cameraElapsed=0;}update();}
 const observer=new MutationObserver(update);
 observer.observe(root,{attributes:true,attributeFilter:['data-discipline-stage','data-discipline-service','data-visible']});
 observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 window.addEventListener('resize',resize);reduced.addEventListener('change',resize);document.addEventListener('visibilitychange',update);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',resize);reduced.removeEventListener('change',resize);document.removeEventListener('visibilitychange',update);document.removeEventListener('astro:before-swap',dispose);};
 document.addEventListener('astro:before-swap',dispose,{once:true});
 update();return dispose;
}
