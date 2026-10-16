// Real-time isometric explainer shared by every sector page.
// A sector module receives the kit below, builds its scene and returns its chapters.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';

export const COLORS={en:0xE2B04A,da:0x3FC7B8,se:0x8B7CF6,de:0xF07A5A,red:0xDC2626};

export function createRenderer(){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0x000000,0);
 return renderer;
}

export function createScene(renderer,build,{compact=false,tagHost=null}={}){
 const scene=new THREE.Scene();
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
 const cam=new THREE.OrthographicCamera(-1,1,1,-1,-100,200);
 scene.add(new THREE.HemisphereLight(0xdfe8f5,0x1a1f27,.55));
 const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(16,30,20);sun.castShadow=true;
 sun.shadow.mapSize.set(compact?2048:4096,compact?2048:4096);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:140});
 sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;sun.shadow.radius=3;scene.add(sun);

 const std=(color,roughness=.6,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
 const M={
  slab:std(0x2b3440,.9),floor:std(0xb4bcc4,.5),wall:std(0xeef1f4,.85),
  glass:new THREE.MeshPhysicalMaterial({color:0xbfe3ea,roughness:.08,transparent:true,opacity:.07,envMapIntensity:.5,depthWrite:false}),
  alu:std(0xb9c0c8,.35,.85),steel:std(0xd3d8dd,.22,.95),white:std(0xf6f7f8,.45),sheet:std(0xe9f1f6,.9),mint:std(0x9fd3c7,.7),
  dark:std(0x1b2027,.5,.4),rack:std(0x15181d,.4,.6),wood:std(0xcfb593,.7),counter:std(0xf2f2ee,.3,.05),chair:std(0x3a4350,.6),
  tray:std(0x8c96a1,.4,.8),concrete:std(0x9aa1a8,.95),earth:std(0x8a7660,1),yellow:std(0xe8b923,.5),glassDark:std(0x223040,.1,.3,{transparent:true,opacity:.55}),
 };
 const led=c=>new THREE.MeshBasicMaterial({color:c,toneMapped:false});
 const EDGE=new THREE.LineBasicMaterial({color:0x0b0e12,transparent:true,opacity:.35});
 const world=new THREE.Group(),services=new THREE.Group();scene.add(world);world.add(services);
 const LAYER={en:[],da:[],se:[],de:[]},TAGS=[],flows={en:[],da:[],se:[],de:[]};
 const anim=[];

 function box(w,h,d,mat,x,y,z,{edges=false,shadow=true,parent=world,round=true}={}){
  const r=round?Math.min(.035,Math.min(w,h,d)*.3):0;
  const m=new THREE.Mesh(r>.004?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y+h/2,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);
  if(edges)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,30),EDGE));return m}
 function cyl(r,h,mat,x,y,z,{parent=world,seg=32,r2=r}={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r2,h,seg),mat);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function rod(a,b,r,mat,parent=world){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),len=A.distanceTo(B);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),mat);m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());m.castShadow=true;parent.add(m);return m}
 function lamp(k,w,h,d,x,y,z,parent=world){const o=box(w,h,d,led(COLORS[k]),x,y,z,{parent,shadow:false,round:false});LAYER[k].push(o);return o}
 function zone(x0,x1,z0,z1,color){const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),std(color,.55));m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,.005,(z0+z1)/2);m.receiveShadow=true;world.add(m);return m}
 function tag(p,label,color,only){if(!tagHost)return;const el=document.createElement('span');el.className='iso3d__tag';el.style.setProperty('--c',color);el.textContent=label;tagHost.appendChild(el);TAGS.push({p:new THREE.Vector3(...p),el,only})}
 function flowMat(c){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{t:{value:0},c:{value:new THREE.Color(c)},len:{value:10},a:{value:0},base:{value:.42}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float t,len,a,base;uniform vec3 c;varying vec2 vUv;void main(){float p=fract(vUv.x*len*.45-t*.9);float head=smoothstep(.0,.04,p)*smoothstep(.34,.0,p);gl_FragColor=vec4(mix(c,vec3(1.),head*.35),min(1.,base+head)*a);}'})}
 function flow(k,pts,r=.06){const path=new THREE.CurvePath();for(let i=1;i<pts.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i-1]),new THREE.Vector3(...pts[i])));
  const len=path.getLength(),seg=Math.max(8,Math.round(len*6));
  for(const [rad,base] of [[r,.42],[r*3.2,.08]]){const m=flowMat(COLORS[k]);m.uniforms.len.value=len;m.uniforms.base.value=base;const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,seg,rad,8,false),m);services.add(mesh);flows[k].push(mesh)}}
 function shell({W,D,H=3,walls=true,windows=true,slab=M.slab,floor=M.floor}){
  box(W+.6,.5,D+.6,slab,0,-.52,0,{shadow:false,edges:true,round:false});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),floor);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;world.add(fl);
  if(walls){box(W,H,.22,M.wall,0,0,-D/2+.11,{shadow:false,edges:true,round:false});box(.22,H,D,M.wall,-W/2+.11,0,0,{shadow:false,edges:true,round:false});
   if(windows)for(let x=-W/2+2.4;x<W/2-1.5;x+=4.6){box(2.2,1.3,.05,M.glass,x,1.1,-D/2+.24,{shadow:false,round:false});box(2.3,.06,.12,M.alu,x,2.42,-D/2+.25)}}
 }
 const kit={THREE,M,COLORS,box,cyl,rod,lamp,zone,tag,flow,shell,led,world,services,LAYER,anim,RoundedBoxGeometry};
 const def=build(kit);
 // furniture-scale casters only: long walls, trays and frames stay clean
 {const sz=new THREE.Vector3();world.traverse(o=>{if(!o.isMesh||o.material.isShaderMaterial)return;o.geometry.computeBoundingBox();o.geometry.boundingBox.getSize(sz);if(Math.max(sz.x,sz.z)>3)o.castShadow=false})}
 // Applies a layer focus: null = overview, 'all' = every layer, or one of en/da/se/de.
 function setLayers(k,ease=1,time=0){for(const key in flows){const on=k==='all'||k===key||k===null;for(const f of flows[key]){f.material.uniforms.t.value=time;f.material.uniforms.a.value+=((on?(k===null?.28:1):.04)-f.material.uniforms.a.value)*ease}}
  for(const key in LAYER){const on=k===null||k==='all'||k===key;for(const o of LAYER[key])o.visible=on}}
 return {scene,cam,world,services,TAGS,anim,setLayers,def,frame3d:def.frame||{w:24,d:14},pmrem};
}

export function frameCamera(cam,frame3d,w,h,{caption=true,lift=0}={}){
 const a=w/h,span=frame3d.w/24;
 const fit=(a<1?13.2/Math.max(a,.5):a<1.2?13.8:a<1.4?12.4:10.4)*span*(caption?1:.92);
 const sh=caption&&a>1.2?fit*a*.3:0,sv=!caption?0:a<1?fit*.2:a<1.2?fit*.16:0;
 Object.assign(cam,{left:-fit*a-sh,right:fit*a-sh,top:fit+sv,bottom:-fit+sv});
 const r=40,ang=Math.PI/4,el=.62;cam.position.set(Math.sin(ang)*r*Math.cos(el),Math.sin(el)*r,Math.cos(ang)*r*Math.cos(el));cam.lookAt(0,lift*.35,frame3d.look??-1.2);cam.updateProjectionMatrix();
}

export function mountIso(host,build){
 const canvasHost=host.querySelector('[data-iso-canvas]'),tagHost=host.querySelector('[data-iso-tags]');
 const cap=host.querySelector('[data-iso-caption]'),steps=host.querySelector('[data-iso-steps]'),pp=host.querySelector('[data-iso-play]');
 const legend=[...host.querySelectorAll('[data-iso-layer]')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const compact=matchMedia('(max-width: 760px), (pointer: coarse)').matches;
 const renderer=createRenderer();canvasHost.appendChild(renderer.domElement);
 const {scene,cam,services,TAGS,anim,setLayers,def,frame3d,pmrem}=createScene(renderer,build,{compact,tagHost});
 const CH=def.chapters;

 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,cam));
 if(!compact){const ao=new GTAOPass(scene,cam,1,1);ao.updateGtaoMaterial({radius:.45,distanceExponent:1.4,thickness:1.2,scale:1.1,samples:16});ao.blendIntensity=.85;composer.addPass(ao)}
 composer.addPass(new OutputPass());

 function resize(){const w=canvasHost.clientWidth,h=canvasHost.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setPixelRatio(Math.min(devicePixelRatio,2));composer.setSize(w,h);
  frameCamera(cam,frame3d,w,h)}
 const ro=new ResizeObserver(resize);ro.observe(canvasHost);resize();

 CH.forEach(()=>steps.appendChild(document.createElement('i')));
 let ci=0,ct=0,paused=reduce,lift=0,liftT=0,time=0,visible=false;
 function setChapter(i){ci=i;ct=0;cap.classList.add('is-out');
  setTimeout(()=>{cap.querySelector('h3').textContent=CH[i].t;cap.querySelector('p').textContent=CH[i].p;cap.classList.remove('is-out')},reduce?0:380);
  const k=CH[i].k;legend.forEach(s=>s.classList.toggle('is-on',k==='all'||s.dataset.isoLayer===k));liftT=k&&k!=='all'?1.1:k==='all'?.6:0}
 setChapter(0);lift=liftT;
 const sync=()=>{pp.textContent=paused?'▶':'❚❚';pp.setAttribute('aria-label',paused?'Reanudar recorrido':'Pausar recorrido')};sync();
 pp.addEventListener('click',()=>{paused=!paused;sync()});
 const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)clock.getDelta()},{threshold:.15});io.observe(host);
 const clock=new THREE.Clock(),v=new THREE.Vector3();let raf=0;
 function frame(){raf=requestAnimationFrame(frame);if(!visible||document.hidden)return;
  const dt=Math.min(clock.getDelta(),.05);if(!paused){time+=dt;ct+=dt;if(ct>CH[ci].d)setChapter((ci+1)%CH.length)}
  const k=CH[ci].k,ease=1-Math.pow(.001,dt);lift+=(liftT-lift)*ease*.9;services.position.y=lift;
  setLayers(k,ease,time);for(const f of anim)f(time,dt,paused);
  frameCamera(cam,frame3d,canvasHost.clientWidth,canvasHost.clientHeight,{lift});
  steps.querySelectorAll('i').forEach((s,i)=>s.style.setProperty('--p',i<ci?1:i===ci?Math.min(1,ct/CH[ci].d):0));
  const w=canvasHost.clientWidth,h=canvasHost.clientHeight;
  for(const t of TAGS){const on=t.only.includes(k);if(on){v.copy(t.p);if(t.p.y>2.5)v.y+=lift;v.project(cam);t.el.style.left=(canvasHost.offsetLeft+(v.x+1)/2*w)+'px';t.el.style.top=(canvasHost.offsetTop+(1-v.y)/2*h)+'px'}t.el.classList.toggle('is-on',on)}
  composer.render()}
 frame();
 return ()=>{cancelAnimationFrame(raf);io.disconnect();ro.disconnect();renderer.dispose();pmrem.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose()});renderer.domElement.remove();tagHost.replaceChildren();steps.replaceChildren()};
}
