// Physical motion for the authored SVG. It follows the existing story clock;
// it never asks a visitor to click and never runs a second narration timer.
const SQRT3_2=Math.sqrt(3)/2;
const project=([x,y,z])=>[SQRT3_2*(x-y),(x+y)/2-z];
const ease=t=>t<.5?16*t**5:1-((-2*t+2)**5)/2;
export function bindPrecisionSystem(root){
 if(root.dataset.precisionBound)return;
 root.dataset.precisionBound='true';
 const owner=root.closest('[data-service-atlas]');
 const drawing=root.querySelector('.pn-drawing');
 if(!owner||!drawing)return;
 const door=drawing.querySelector('.pn-door'),drawer=drawing.querySelector('.pn-switch-drawer'),lid=drawing.querySelector('.pn-lid');
 const cords=[...drawing.querySelectorAll('.pn-cord')].map(node=>({node,start:node.dataset.start.split(' ').map(Number),end:node.dataset.end.split(' ').map(Number),sag:Number(node.dataset.sag)}));
 const outer=root.querySelector('svg'),baseViewBox=outer.getAttribute('viewBox'),ap=drawing.querySelector('.pn-inspection .pn-ap-cover');
 const viewport=drawing.querySelector('.pn-viewport'),small=matchMedia('(max-width:600px)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=[0,0,0,0,0,1000,650,0],from=[...current],target=[...current],frame=0,elapsed=0,last=0,disposed=false;
 const duration=2400;
 let focusStage=null,focusSmall=null,focusReduced=null,focusBox=[0,0,1000,650];
 function measuredFocus(stage,fallback){
  const part=drawing.querySelector(`.pn-inspection [data-pn-focus="${stage}"]`);
  if(!part||typeof part.getBBox!=='function'||!viewport?.getScreenCTM)return fallback;
  const box=part.getBBox(),local=part.getScreenCTM(),base=viewport.getScreenCTM();
  if(!box.width||!box.height||!local||!base)return fallback;
  const matrix=base.inverse().multiply(local);
  const corners=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>[matrix.a*x+matrix.c*y+matrix.e,matrix.b*x+matrix.d*y+matrix.f]);
  const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(...xs)-minX,h=Math.max(...ys)-minY;
  // Include the mechanism's complete swept area, not just its closed pose.
  const px=stage===2?115:stage===3?60:22,py=stage===3?52:35;
  root.dataset.precisionFraming='measured';
  return [minX-px,minY-py,w+2*px,h+2*py];
 }
 function render(){
  if(viewport)viewport.setAttribute('viewBox',current.slice(3,7).join(' '));
  if(ap)ap.setAttribute('transform',`translate(0 ${-current[7]})`);
  const [angle,pull,lift]=current,theta=angle*Math.PI/180;
  door.setAttribute('transform',`matrix(${SQRT3_2*(Math.cos(theta)-Math.sin(theta))} ${.5*(Math.cos(theta)+Math.sin(theta))} 0 1 0 0)`);
  drawer.setAttribute('transform',`translate(${-SQRT3_2*pull} ${pull/2})`);
  lid.setAttribute('transform',`translate(${lift*2.1} ${-lift})`);
  for(const rail of drawing.querySelectorAll('.pn-drawer-rail')){const x=Number(rail.dataset.x),z=Number(rail.dataset.z),a=project([x,40,z]),b=project([x,128+pull,z]);rail.setAttribute('d',`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);}
  for(const cord of cords){
   const a=project(cord.start),b=project([cord.end[0],cord.end[1]+pull,cord.end[2]]),sag=cord.sag;
   const c=project([cord.start[0],cord.start[1]+16+sag,cord.start[2]-9]),d=project([cord.end[0],cord.end[1]+pull+20+sag,cord.end[2]-10]);
   cord.node.setAttribute('d',`M${a[0]} ${a[1]}C${c[0]} ${c[1]} ${d[0]} ${d[1]} ${b[0]} ${b[1]}`);
  }
 }
 function running(){return !disposed&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&root.dataset.disciplineService==='101'&&!document.hidden;}
 function tick(now){
  frame=0;if(!running())return;
  if(last)elapsed+=Math.min(64,now-last);last=now;
  const t=Math.min(1,elapsed/duration),e=ease(t);
  current=from.map((v,i)=>v+(target[i]-v)*e);render();
  if(t<1)frame=requestAnimationFrame(tick);
 }
 function update(){
  if(root.dataset.disciplineService!=='101'){cancelAnimationFrame(frame);frame=0;last=0;return;}
  const stage=Number(root.dataset.disciplineStage);
  const views={0:[0,225,390,300],1:[130,0,470,330],2:[230,70,370,510],3:[245,150,350,295],4:[550,342,245,240],5:[0,425,320,205]};
  if(root.dataset.disciplineService==='101')outer.setAttribute('viewBox',small.matches?'0 0 1000 920':baseViewBox);
  if(focusStage!==stage||focusSmall!==small.matches||focusReduced!==reduced.matches){focusBox=small.matches&&!reduced.matches&&views[stage]?measuredFocus(stage,views[stage]):[0,0,1000,650];focusStage=stage;focusSmall=small.matches;focusReduced=reduced.matches;}
  const focus=focusBox;
  const pose=reduced.matches?[76,48,24]:stage===3?[76,48,30]:stage===2?[76,0,0]:stage===4||stage===5?[58,0,0]:[0,0,0];
  const next=[...pose,...focus,stage===4?23:0];
  if(next.some((v,i)=>v!==target[i])){from=[...current];target=next;elapsed=0;last=0;}
  cancelAnimationFrame(frame);frame=0;last=0;
  if(reduced.matches){current=[...target];render();return;}
  if(running()&&current.some((v,i)=>Math.abs(v-target[i])>.001))frame=requestAnimationFrame(tick);
 }
 const observer=new MutationObserver(update);
 observer.observe(root,{attributes:true,attributeFilter:['data-discipline-stage','data-discipline-service','data-visible']});
 observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 small.addEventListener('change',update);reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();small.removeEventListener('change',update);reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 document.addEventListener('astro:before-swap',dispose,{once:true});
 render();update();
 return dispose;
}
export function bindSoftwarePrecision(root){
 const drawing=root.querySelector('.ps-drawing');
 if(!drawing||drawing.dataset.bound)return;drawing.dataset.bound='true';
 const owner=root.closest('[data-service-atlas]'),layers=[...drawing.querySelectorAll('.ps-layer')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let stage=null,animations=[];
 function update(){
  const next=Number(root.dataset.disciplineStage),active=root.dataset.disciplineService==='104';
  if(stage!==next&&active){
   stage=next;
   const current=layers.map(layer=>getComputedStyle(layer).transform);
   animations.forEach(a=>a.cancel());animations=[];
   layers.forEach((layer,i)=>{
    const target=Number(layer.dataset.disciplineNode)===stage?'translate(-183px,106px)':'translate(0px,0px)';
    layer.style.transform=target;
    if(!reduced.matches&&typeof layer.animate==='function')animations.push(layer.animate([{transform:current[i]},{transform:target}],{duration:2400,easing:'cubic-bezier(.45,0,.2,1)',fill:'none'}));
   });
  }
  // WebKit does not consistently match a selector outside an inline SVG's
  // stylesheet. Explicitly suspend its inner CSS timelines with the story clock.
  const innerPlaying=active&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&!document.hidden&&!reduced.matches;
  drawing.querySelectorAll('.ps-detail,.ps-outcome,.ps-check,.ps-draw,.ps-flow').forEach(node=>{
   node.style.animationPlayState=innerPlaying?'running':'paused';
   // Some WebKit SVG CSS timelines ignore animation-play-state updates.
   // Control the actual timelines too, preserving their elapsed position.
   for(const animation of node.getAnimations?.()||[]){
    if(animation.playState==='finished')continue;
    if(innerPlaying&&animation.playState==='paused')animation.play();
    else if(!innerPlaying&&animation.playState!=='paused')animation.pause();
   }
  });
  for(const animation of animations){
   if(reduced.matches){animation.finish();continue;}
   if(animation.playState==='finished')continue;
   if(active&&owner.dataset.storyState==='playing'&&!document.hidden){if(animation.playState==='paused')animation.play();}
   else if(animation.playState==='running')animation.pause();
  }
 }
 const observer=new MutationObserver(update);
 observer.observe(root,{attributes:true,attributeFilter:['data-discipline-stage','data-discipline-service']});
 observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 const dispose=()=>{animations.forEach(a=>a.cancel());observer.disconnect();reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 document.addEventListener('astro:before-swap',dispose,{once:true});update();return dispose;
}
// On small screens, follow the equipment being explained rather than shrinking
// all six items into a static thumbnail. Bounds come from the actual drawing.
export function bindDisciplineCamera(root){
 if(root.dataset.cameraBound)return;root.dataset.cameraBound='true';
 const owner=root.closest('[data-service-atlas]'),svg=root.querySelector('svg');
 if(!owner||!svg)return;
 const base=[0,0,1000,650],small=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=[...base],from=[...base],target=[...base],frame=0,last=0,elapsed=0,key='',disposed=false;
 function active(){return root.dataset.disciplineService==='104';}
 function running(){return !disposed&&active()&&owner.dataset.storyState==='playing'&&root.dataset.visible==='true'&&!document.hidden;}
 function render(){if(active())svg.setAttribute('viewBox',current.join(' '));}
 function tick(now){
  frame=0;if(!running())return;if(last)elapsed+=Math.min(64,now-last);last=now;
  const t=Math.min(1,elapsed/2200),e=ease(t);current=from.map((v,i)=>v+(target[i]-v)*e);render();
  if(t<1)frame=requestAnimationFrame(tick);
 }
 function update(){
  const box=svg.getBoundingClientRect(),aspect=box.width>0&&box.height>0?box.width/box.height:(small.matches?1.085:1000/650);
  const code=root.dataset.disciplineService,stage=Number(root.dataset.disciplineStage),nextKey=[code,stage,aspect.toFixed(3),reduced.matches].join(':');
  if(key!==nextKey){
   const changed=key.split(':')[0]!==code;key=nextKey;target=[...base];
   if(changed){current=[...base];if(code==='104')svg.setAttribute('viewBox',base.join(' '));}
   if(active()&&!reduced.matches&&stage>=0&&stage<6){
    const nodes=[...root.querySelectorAll('[data-discipline-drawing="'+code+'"] [data-discipline-node="'+stage+'"]')];
    if(nodes.length&&svg.getScreenCTM){
     const points=[];const screen=svg.getScreenCTM();
     if(screen)for(const node of nodes){
      // Measure the final pose in its stationary parent's coordinates. A
      // getScreenCTM/getComputedStyle pair can sample different animation poses,
      // shifting the lens twice while the plane is sliding out.
      const parent=node.parentElement?.getScreenCTM?.();
      if(!node.getBBox||!parent)continue;
      const b=node.getBBox(),m=screen.inverse().multiply(parent);
      m.e+=m.a*(-183)+m.c*106;m.f+=m.b*(-183)+m.d*106;
      for(const [x,y] of [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]])points.push([m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
     }
     if(points.length){
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
      const padding=40;
      const width=Math.max(340,w+padding,(h+padding)*aspect),height=width/aspect;
      target=[x+w/2-width/2,y+h/2-height/2,width,height];root.dataset.cameraFraming='measured';
     }
    }
   }
   from=[...current];elapsed=0;last=0;
  }
  cancelAnimationFrame(frame);frame=0;last=0;
  if(!active())return;
  if(reduced.matches){current=[...target];render();return;}
  if(running()&&current.some((v,i)=>Math.abs(v-target[i])>.001))frame=requestAnimationFrame(tick);
 }
 const observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['data-discipline-stage','data-discipline-service','data-visible']});observer.observe(owner,{attributes:true,attributeFilter:['data-story-state']});
 window.addEventListener('resize',update);small.addEventListener('change',update);reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 const dispose=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',update);small.removeEventListener('change',update);reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
 document.addEventListener('astro:before-swap',dispose,{once:true});update();return dispose;
}
