import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {SECTORS,sectorRoutes} from './sectorScenes';
import {SYSTEM_STYLE} from './hospitalSystems';
import {ARLabels,ARInspector,SystemGlyph} from './HospitalAR';
import {createARTracking} from './hospitalARTracking';
import {createFreeNavigation} from './hospitalFreeNavigation';
import {hospitalQuality} from './hospitalQuality';
import './sector-experience.css';
import './sector-ar.css';
import {industrialInventory} from './industrialInventory';
import {createIndustrialSensors} from './industrialSensors';
import SensorPicker from './SensorPicker';
import {createCameraCoverage} from './cameraCoverage';
const v=p=>new THREE.Vector3(p[0],p[2],-p[1]);
export default function SectorExperience({sector='airport',modelBase='/models/'}){
 const config=SECTORS[sector],mount=useRef(),engine=useRef(),state=useRef({});
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[stop,setStop]=useState(0),[playing,setPlaying]=useState(false),[explore,setExplore]=useState(false),[navigation,setNavigation]=useState('orbit'),[layer,setLayer]=useState('all'),[mode,setMode]=useState('building'),[labels,setLabels]=useState([]),[settled,setSettled]=useState(false),[hover,setHover]=useState(null),[selection,setSelection]=useState(null),[time,setTime]=useState(0),[active,setActive]=useState(true),[expanded,setExpanded]=useState(false);
 state.current={playing,explore,navigation,layer,mode,selection};
 const select=asset=>{setSelection(asset);setPlaying(false);};
 const go=i=>{setStop(i);setPlaying(false);setSelection(null);engine.current?.go(i);};
 useEffect(()=>{if(!active)return;const id=setInterval(()=>{if(!document.hidden)setTime(t=>t+1);},1000);return()=>clearInterval(id);},[active]);
 useEffect(()=>{if(!expanded)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[expanded]);
 useEffect(()=>{
  let disposed=false,raf,last=0,clock=0,inView=true,transition=null,wasNavigation='orbit',wasPlaying=false;
  const host=mount.current,scene=new THREE.Scene();scene.background=new THREE.Color('#dce0dd');scene.fog=new THREE.Fog('#dce0dd',70,140);
  const camera=new THREE.PerspectiveCamera(52,1,.08,200),quality=hospitalQuality(host.clientWidth,devicePixelRatio,matchMedia('(pointer:coarse)').matches);
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{setError('Este navegador no pudo iniciar WebGL. Probá en un navegador actualizado.');return;}
  renderer.setPixelRatio(quality.pixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
  host.appendChild(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',`${config.title}: visor 3D interactivo`);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.environmentIntensity=.65;scene.add(new THREE.HemisphereLight('#edf5ff','#746e61',.7));const sun=new THREE.DirectionalLight('#fff0dc',2.2);sun.position.set(-12,25,15);sun.castShadow=true;sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:90});sun.shadow.normalBias=.025;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:'#c2c7c2',roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.35;ground.receiveShadow=true;scene.add(ground);
  const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.10;orbit.minDistance=.2;orbit.maxDistance=90;orbit.minPolarAngle=.01;orbit.maxPolarAngle=Math.PI-.01;orbit.enabled=false;
  const free=createFreeNavigation(camera),target=new THREE.Vector3(),meshes=[],edges=[],paths=[],pulses=[],pickables=[];
  function moveTo(i,instant=false){const s=config.stops[i];if(instant){camera.position.copy(v(s.camera));target.copy(v(s.target));camera.lookAt(target);orbit.target.copy(target);}else transition={at:performance.now(),from:camera.position.clone(),to:v(s.camera),lookFrom:orbit.target.clone(),lookTo:v(s.target)};}
  moveTo(0,true);engine.current={go:moveTo,focus:a=>{const look=v(a.p).add(new THREE.Vector3(a.kind==='door'?-.72:0,0,0)),to=look.clone().add(new THREE.Vector3(.3,.12,a.kind==='door'?3.4:1.15));transition={at:performance.now(),from:camera.position.clone(),to,lookFrom:orbit.target.clone(),lookTo:look};}};
  const draco=new DRACOLoader().setDecoderPath(`${modelBase}draco/`).setWorkerLimit(1);
  new GLTFLoader().setDRACOLoader(draco).load(`${modelBase}${config.model}`,g=>{
   if(disposed){g.scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});return;}
   g.scene.traverse(o=>{if(!o.isMesh)return;const system=o.userData.system||o.name.split('__')[0];o.userData.system=system;o.castShadow=true;o.receiveShadow=true;meshes.push(o);pickables.push(o);
    if(system==='Architecture'){const e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,35),new THREE.LineBasicMaterial({color:'#596561',transparent:true,opacity:.2}));e.matrix.copy(o.matrixWorld);e.matrixAutoUpdate=false;e.visible=false;edges.push(e);scene.add(e);}
   });scene.add(g.scene);setReady(true);
  },undefined,()=>{if(!disposed)setError('No se pudo cargar esta escena. Recargá para reintentar.');});
  const sensors=createIndustrialSensors(industrialInventory(sector));scene.add(sensors.root);meshes.push(...sensors.meshes);pickables.push(...sensors.meshes);
  const coverage=createCameraCoverage(scene);
  const markerGeometry=new THREE.SphereGeometry(.085,10,6);
  for(const p of config.points){const m=new THREE.Mesh(markerGeometry,new THREE.MeshBasicMaterial({color:SYSTEM_STYLE[p.system].color,transparent:true,opacity:.7}));m.position.copy(v(p.p));m.userData={system:p.system,asset:p};scene.add(m);pickables.push(m);}
  for(const r of sectorRoutes(config)){const pts=r.points.map(v),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:SYSTEM_STYLE[r.system].color,transparent:true,opacity:.8}));line.userData.system=r.system;scene.add(line);paths.push(line);const lengths=pts.slice(1).map((p,i)=>p.distanceTo(pts[i]));const total=lengths.reduce((a,b)=>a+b,0);if(total){const pulse=new THREE.Mesh(markerGeometry,new THREE.MeshBasicMaterial({color:SYSTEM_STYLE[r.system].color}));pulse.scale.setScalar(.6);scene.add(pulse);pulses.push({pulse,pts,lengths,total,system:r.system});}}
  const tracker=createARTracking(camera,()=>meshes.filter(o=>o.visible&&!o.material.transparent),(list,rest)=>{setLabels(list);setSettled(rest);},[...industrialInventory(sector),...config.points]);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,dragged=false;
  function pick(e){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables.filter(o=>o.visible),false)[0];if(!hit)return;let asset=hit.object.userData.asset;const sys=hit.object.userData.system;if(!asset&&SYSTEM_STYLE[sys])asset=config.points.filter(p=>p.system===sys).sort((a,b)=>v(a.p).distanceToSquared(hit.point)-v(b.p).distanceToSquared(hit.point))[0];if(asset)select(asset);}
  const pointerDown=e=>{down=[e.clientX,e.clientY];dragged=false;if(state.current.explore){canvas.focus();transition=null;}};
  const pointerMove=e=>{if(!down||!e.buttons)return;const dx=e.clientX-down[0],dy=e.clientY-down[1];if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;if(state.current.explore&&state.current.navigation==='walk'){free.rotate(dx,dy);down=[e.clientX,e.clientY];}};
  const pointerUp=e=>{if(down&&!dragged)pick(e);down=null;};
  const wheel=e=>{if(state.current.explore&&state.current.navigation==='walk'){e.preventDefault();free.dolly(Math.sign(e.deltaY)*.5);}};
  const keyDown=e=>{if(e.key==='Escape'){setExplore(false);setPlaying(false);free.clear();return;}if(state.current.explore&&state.current.navigation==='walk'&&['w','a','s','d','q','e','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())){e.preventDefault();free.keys.add(e.key.toLowerCase());}};
  const keyUp=e=>free.keys.delete(e.key.toLowerCase());
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',keyDown);canvas.addEventListener('keyup',keyUp);canvas.addEventListener('blur',free.clear);
  const resize=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();});resize.observe(host);
  const intersection=new IntersectionObserver(([e])=>{inView=e.isIntersecting;});intersection.observe(host);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(ms){raf=requestAnimationFrame(frame);if(ms-last<33)return;const dt=Math.min((ms-last)/1000,.05);last=ms;if(document.hidden||!inView)return;const s=state.current;
   if(wasNavigation!==s.navigation){if(s.navigation==='walk')free.capture();else{orbit.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(4));}wasNavigation=s.navigation;}
   if(s.playing&&!wasPlaying){clock=0;transition=null;}wasPlaying=s.playing;
   orbit.enabled=s.explore&&s.navigation==='orbit'&&!s.playing&&!transition;canvas.style.touchAction=s.explore?'none':'pan-y';
   if(s.playing){clock+=dt;const t=(clock/9)%(config.stops.length-1),i=Math.floor(t)+1,j=i===config.stops.length-1?1:i+1,f=(t%1);camera.position.lerpVectors(v(config.stops[i].camera),v(config.stops[j].camera),f*f*(3-2*f));target.lerpVectors(v(config.stops[i].target),v(config.stops[j].target),f);camera.lookAt(target);orbit.target.copy(target);}
   else if(transition){const t=Math.min(1,(ms-transition.at)/(reduced?1:1400)),f=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,f);target.lerpVectors(transition.lookFrom,transition.lookTo,f);camera.lookAt(target);orbit.target.copy(target);if(t===1){transition=null;free.capture();}}
   else if(s.explore&&s.navigation==='walk')free.update(dt);else if(orbit.enabled)orbit.update();
   for(const o of meshes){const sys=o.userData.system;o.visible=SYSTEM_STYLE[sys]?s.layer==='all'||s.layer===sys:s.mode==='building';}
   ground.visible=s.mode==='building';for(const e of edges)e.visible=s.mode==='skeleton';
   for(const p of pickables.filter(o=>o.userData.asset))p.visible=s.layer==='all'||s.layer===p.userData.system;
   for(const line of paths)line.visible=s.layer==='all'||s.layer===line.userData.system;
   for(const p of pulses){p.pulse.visible=s.layer==='all'||s.layer===p.system;let distance=(reduced?0:(ms*.001*.8)%p.total);for(let i=0;i<p.lengths.length;i++){if(distance<=p.lengths[i]){p.pulse.position.lerpVectors(p.pts[i],p.pts[i+1],p.lengths[i]?distance/p.lengths[i]:0);break;}distance-=p.lengths[i];}}
   coverage.update(s.selection);tracker.update(ms,{width:host.clientWidth,height:host.clientHeight,layer:s.layer,playing:s.playing||!!transition,enabled:!s.selection});
   canvas.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(2)).join(',');canvas.dataset.mode=s.mode;canvas.dataset.layer=s.layer;renderer.render(scene,camera);
  }raf=requestAnimationFrame(frame);
  return()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();intersection.disconnect();orbit.dispose();draco.dispose();engine.current=null;canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',keyDown);canvas.removeEventListener('keyup',keyUp);canvas.removeEventListener('blur',free.clear);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());env.dispose();renderer.dispose();canvas.remove();};
 },[sector]);
 return <section className={`sector-experience ${expanded?'is-expanded':''}`}>
  <div className="sector-heading"><div><span>UM / SISTEMAS INTEGRALES POR SECTOR</span><h1>{config.title}<b>.</b></h1><p>{config.subtitle}</p></div><nav aria-label="Elegir sector"><a href="#/infraestructura">Hospital</a><a href="#/aeropuerto" aria-current={sector==='airport'?'page':undefined}>Aeropuerto</a><a href="#/bodega" aria-current={sector==='winery'?'page':undefined}>Bodega</a></nav></div>
  <div className="sector-stage"><div className="sector-canvas" ref={mount}/>{!ready?<div className="sector-loading" role="status">{error||'Cargando arquitectura y sistemas…'}</div>:null}
   <div className="sector-location"><small>{String(stop+1).padStart(2,'0')} / {config.title.toUpperCase()}</small><strong>{playing?'Recorrido cinematográfico':config.stops[stop].name}</strong><span>{config.description}</span></div>
   <div className="sector-filters" aria-label="Filtrar sistemas">{['all',...Object.keys(SYSTEM_STYLE)].map(key=><button key={key} aria-pressed={layer===key} onClick={()=>{setLayer(key);setSelection(null);}}>{key==='all'?'Todos':<><SystemGlyph system={key}/>{SYSTEM_STYLE[key].label.split(' ·')[0]}</>}</button>)}</div>
   {!selection&&ready?<ARLabels labels={labels} settled={settled} hover={hover} onHover={setHover} onSelect={select} time={time} active={active}/>:null}
   {selection?<ARInspector asset={selection} time={time} active={active} onClose={()=>setSelection(null)} onToggle={()=>setActive(v=>!v)}/>:null}
   <div className="sector-actions"><button disabled={!ready} aria-pressed={explore} onClick={()=>{setExplore(v=>!v);setPlaying(false);}}>Explorar 3D</button><button disabled={!ready} aria-pressed={playing} onClick={()=>{setPlaying(v=>!v);setSelection(null);}}>Recorrido automático</button><select aria-label="Modo de navegación" value={navigation} onChange={e=>{setNavigation(e.target.value);setExplore(true);setPlaying(false);}}><option value="orbit">Orbitar / desplazar</option><option value="walk">Entrar / WASD</option></select><select aria-label="Visualización" value={mode} onChange={e=>setMode(e.target.value)}><option value="building">Edificio</option><option value="skeleton">Esqueleto</option><option value="systems">Sólo sistemas</option></select><button onClick={()=>setExpanded(v=>!v)}>{expanded?'Reducir visor':'Ampliar visor'}</button><button onClick={()=>go(0)}>Vista general ↗</button></div>
  </div>
  <div className="sector-stops">{config.stops.map((s,i)=><button key={s.name} disabled={!ready} aria-pressed={stop===i&&!playing} onClick={()=>go(i)}><small>{String(i+1).padStart(2,'0')}</small>{s.name}</button>)}</div>
  <SensorPicker sector={sector} disabled={!ready} onSelect={a=>{setLayer(a.system);select(a);engine.current?.focus(a);}}/>
  <p className="sector-note">Explorar: arrastrá para girar; rueda/pellizco para acercarte. En modo Entrar: WASD y Q/E; Escape libera el control. Fuera de Explorar, la rueda desplaza la página. Inspección sin colisiones.</p><p className="sector-note">Arquitectura y equipamiento de contexto conceptuales. Sistemas y métricas DEMO, sin conexión a instalaciones reales. No es ingeniería aprobada.</p>
 </section>;
}
