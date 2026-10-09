// One operational example, directed by the existing service story clock.
// Requests flow through access/API/data; releases follow their own control path.
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const phase=(ms,start,length)=>smooth((ms-start)/length);
export function softwarePose(stage,elapsed,reduced=false){
 const done=n=>reduced||stage===6||stage>n;
 const at=(n,start,length)=>done(n)?1:stage===n?phase(elapsed,start,length):0;
 return {
  drawer:at(0,1100,1300),
  gates:[0,1,2].map(i=>at(1,1500+i*750,1100)),
  gateSpread:[0,1,2].map(i=>reduced?0:stage===1?phase(elapsed,1500+i*750,1100):stage===2?1-phase(elapsed,0,900):0),
  mappings:[0,1,2].map(i=>at(2,1800+i*650,1100)),
  record:at(3,1600,1500),release:at(4,2000,2600),
  routes:[0,1,2,3,4,5].map(n=>at(n,[2700,4200,4300,3300,2300,2300][n],[2600,2400,2600,3100,3000,3000][n])),
  health:at(5,1700,1800)
 };
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
 const drawer=drawing.querySelector('[data-sw-drawer]'),record=drawing.querySelector('[data-sw-record]'),release=drawing.querySelector('[data-sw-release]');
 const gates=[...drawing.querySelectorAll('[data-sw-gate]')],checks=[...drawing.querySelectorAll('[data-sw-check]')],mappings=[...drawing.querySelectorAll('[data-sw-mapping]')];
 const traces=[...drawing.querySelectorAll('[data-sw-trace]')],health=[...drawing.querySelectorAll('[data-sw-health]')];
 const tokens=[...drawing.querySelectorAll('[data-sw-token]')].map(node=>({node,points:node.dataset.points.split(';').map(p=>p.split(',').map(Number))}));
 const ties=[...drawing.querySelectorAll('[data-sw-registration]')];
 const base=[0,0,1200,650];
 let stage=null,previousStage=-1,elapsed=0,last=null,frame=0,disposed=false,current=[...base],from=[...base],target=[...base],cameraElapsed=0,detail=-1;
 const active=()=>root.dataset.disciplineService==='104';
 const running=()=>!disposed&&active()&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&!document.hidden&&!reduced.matches;
 function focus(){
  const component=components.find(n=>Number(n.dataset.disciplineNode)===stage);
  if(reduced.matches||!component||typeof component.getBBox!=='function')return [...base];
  const screen=svg.getBoundingClientRect(),aspect=screen.width/screen.height||1200/650;
  const focusElement=screen.width<600&&stage===0?drawer:component.querySelector('.sw-machine')||component;
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
  const pad=stage===1?24:stage===4?40:22;
  const w=Math.max(screen.width<600?300:550,b.width+pad*2,(b.height+pad*2)*aspect);
  const h=w/aspect;
  root.dataset.cameraFraming='measured';
  return [b.x+b.width/2-w/2,b.y+b.height/2-h/2,w,h];
 }
 function render(){
  const pose=softwarePose(stage,elapsed,reduced.matches);
  drawing.dataset.operationState=stage===6?'complete':stage===-1?'overview':String(stage);
  drawing.dataset.operationTime=String(Math.round(elapsed));
  drawer.style.opacity=String(pose.drawer);
  drawer.setAttribute('transform',`translate(0 ${12*(1-pose.drawer)})`);
  gates.forEach((n,i)=>n.setAttribute('transform',`translate(${[-60,0,60][i]*pose.gateSpread[i]} ${[15,-50,-115][i]*pose.gateSpread[i]})`));
  ties.forEach(n=>{const i=Number(n.dataset.swRegistration),base=n.dataset.base.split(',').map(Number),tip=n.dataset.tip.split(',').map(Number);n.setAttribute('points',`${base.join(',')} ${tip[0]+[-60,0,60][i]*pose.gateSpread[i]},${tip[1]+[15,-50,-115][i]*pose.gateSpread[i]}`);});
  checks.forEach((n,i)=>n.setAttribute('fill',pose.gates[i]>.95?'#247d69':'#a4bac7'));
  mappings.forEach((n,i)=>n.setAttribute('opacity',String(.15+.85*pose.mappings[i])));
  record.setAttribute('transform',`translate(${-19*pose.record} ${11*pose.record})`);
  release.setAttribute('transform',`translate(${50*pose.release} ${29*pose.release-10*Math.sin(Math.PI*pose.release)})`);
  traces.forEach((n,i)=>n.setAttribute('stroke-dasharray',`${100*pose.routes[i]} 100`));
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
  const e=phase(cameraElapsed,0,2200),emphasis=phase(elapsed,0,2200);
  components.forEach(n=>{
   const nstage=Number(n.dataset.disciplineNode),overview=stage<0||stage===6||reduced.matches;
   n.style.opacity=String(overview?1:nstage===stage?.35+.65*emphasis:(nstage===previousStage||previousStage<0)?1-.86*emphasis:.14);
   n.querySelector('.sw-label').style.opacity=String(overview?1:0);
  });
  current=from.map((v,i)=>v+(target[i]-v)*e);
  viewport.setAttribute('viewBox',current.join(' '));
 }
 function tick(now){
  frame=0;if(!running())return;
  if(last!==null){const dt=Math.min(80,Math.max(0,now-last));elapsed+=dt;cameraElapsed+=dt;}last=now;
  const nextDetail=stage===1&&svg.getBoundingClientRect().width<600?Math.max(0,Math.min(2,Math.floor((elapsed-1400)/2200))):-1;
  if(nextDetail!==detail){detail=nextDetail;from=[...current];target=focus();cameraElapsed=0;}
  render();if(elapsed<8000||cameraElapsed<2200)frame=requestAnimationFrame(tick);
 }
 function update(){
  cancelAnimationFrame(frame);frame=0;last=null;
  if(!active())return;
  // Match the nested canvas to the outer surface without changing any other
  // discipline's outer coordinate system.
  const screen=svg.getBoundingClientRect();
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
