// Frame the mechanism's full motion, not only its closed bounding box.
// This clock follows the narration and shares its pause/visibility lifecycle.
const CODES=new Set(['102','103','105','106','108']);
const ease=t=>t<.5?16*t**5:1-((-2*t+2)**5)/2;
const union=boxes=>{const x=Math.min(...boxes.map(b=>b[0])),y=Math.min(...boxes.map(b=>b[1]));return [x,y,Math.max(...boxes.map(b=>b[0]+b[2]))-x,Math.max(...boxes.map(b=>b[1]+b[3]))-y];};
export function bindDisciplineCamera(root){
 if(root.dataset.layerCameraBound)return;root.dataset.layerCameraBound='true';
 const owner=root.closest('[data-service-atlas]'),svg=root.querySelector('svg');if(!owner||!svg)return;
 const small=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const drawings=new Map([...root.querySelectorAll('[data-discipline-drawing]')].filter(d=>CODES.has(d.dataset.disciplineDrawing)).map(d=>[d.dataset.disciplineDrawing,d]));
 const covers=new Map();
 for(const [code,drawing] of drawings){
  covers.set(code,[...drawing.querySelectorAll('.ds-cover,.ds-door')].map(el=>{
   const m=el.transform.baseVal.consolidate()?.matrix,base=m?[m.a,m.b,m.c,m.d,m.e,m.f]:[1,0,0,1,0,0],style=getComputedStyle(el);
   const angle=74*Math.PI/180;
   const open=el.classList.contains('ds-door')?[Math.sqrt(3)/2*(Math.cos(angle)-Math.sin(angle)),.5*(Math.cos(angle)+Math.sin(angle)),0,1,0,0]:[1,0,0,1,parseFloat(style.getPropertyValue('--ds-lift-x'))||0,parseFloat(style.getPropertyValue('--ds-lift'))||0];
   el.style.transition='none';el.style.transform=`matrix(${base.join(',')})`;return {el,base,open,current:[...base],from:[...base],target:[...base]};
  }));
 }
 let code=null,stage=null,drawing=null,parts=[],full=[0,0,1000,650],current=[...full],from=[...full],target=[...full],frame=0,last=0,elapsed=0,disposed=false;
 function boxInRoot(el,matrix){
  const b=el.getBBox(),base=svg.getScreenCTM();if(!base||(!b.width&&!b.height))return null;
  const m=matrix||base.inverse().multiply(el.getScreenCTM());
  const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
 }
 function swept(nodes,onlyParts=parts){
  const boxes=nodes.map(el=>boxInRoot(el)).filter(Boolean),base=svg.getScreenCTM();
  if(base)for(const p of onlyParts){
   const parent=base.inverse().multiply(p.el.parentElement.getScreenCTM());
   for(const pose of [p.base,p.open]){const b=boxInRoot(p.el,parent.multiply(new DOMMatrix(pose)));if(b)boxes.push(b);}
  }
  return boxes.length?union(boxes):[0,0,1000,650];
 }
 function padding(b,minimum=0){
  const w=Math.max(b[2]+64,full[2]*minimum),h=Math.max(b[3]+58,full[3]*minimum);
  return [b[0]+b[2]/2-w/2,b[1]+b[3]/2-h/2,w,h];
 }
 function active(){return !disposed&&CODES.has(root.dataset.disciplineService)&&root.dataset.visible==='true'&&owner.dataset.storyState==='playing'&&!document.hidden;}
 function render(){svg.setAttribute('viewBox',current.join(' '));for(const p of parts)p.el.style.transform=`matrix(${p.current.join(',')})`;}
 function tick(now){
  frame=0;if(!active())return;if(last)elapsed+=Math.min(64,now-last);last=now;
  const t=Math.min(1,elapsed/2400),e=ease(t);current=from.map((v,i)=>v+(target[i]-v)*e);
  for(const p of parts)p.current=p.from.map((v,i)=>v+(p.target[i]-v)*e);render();if(t<1)frame=requestAnimationFrame(tick);
 }
 function update(force=false){
  cancelAnimationFrame(frame);frame=0;last=0;
  const nextCode=root.dataset.disciplineService,nextStage=Number(root.dataset.disciplineStage);
  if(!drawings.has(nextCode)){root.dataset.layerCamera='false';return;}
  const changed=code!==nextCode||stage!==nextStage||force;
  if(code!==nextCode){
   code=nextCode;drawing=drawings.get(code);parts=covers.get(code);svg.setAttribute('viewBox','0 0 1000 650');
   full=padding(swept([drawing]));current=[...full];from=[...full];target=[...full];
  }
  if(changed){
   stage=nextStage;const selected=[...drawing.querySelectorAll(`[data-discipline-node="${stage}"]`)];
   const selectedParts=parts.filter(p=>selected.some(node=>node.contains(p.el))),focus=stage>=0&&stage<6&&selected.length>0&&!reduced.matches;
   target=focus?padding(swept(selected,selectedParts),small.matches?.29:.61):full;from=[...current];
   root.dataset.layerCamera=String(focus);root.dataset.layerCameraFraming='swept';elapsed=0;
   for(const p of parts){p.from=[...p.current];p.target=reduced.matches||selectedParts.includes(p)?p.open:p.base;}
  }
  if(reduced.matches){current=[...target];for(const p of parts)p.current=[...p.target];render();return;}
  if(active()&&(current.some((v,i)=>Math.abs(v-target[i])>.001)||parts.some(p=>p.current.some((v,i)=>Math.abs(v-p.target[i])>.001))))frame=requestAnimationFrame(tick);
  else render();
 }
 const observer=new MutationObserver(()=>update());observer.observe(root,{attributes:true,attributeFilter:['data-discipline-service','data-discipline-stage','data-visible']});observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 const reframe=()=>update(true),visibility=()=>update();small.addEventListener('change',reframe);reduced.addEventListener('change',reframe);document.addEventListener('visibilitychange',visibility);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();small.removeEventListener('change',reframe);reduced.removeEventListener('change',reframe);document.removeEventListener('visibilitychange',visibility);};
 document.addEventListener('astro:before-swap',dispose,{once:true});update();return dispose;
}
function boot(){document.querySelectorAll('[data-discipline-system]').forEach(bindDisciplineCamera);}
if(typeof document!=='undefined'){boot();document.addEventListener('astro:page-load',boot);}
