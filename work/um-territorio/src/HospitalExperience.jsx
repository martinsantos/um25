import React, {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {NETWORKS,SYSTEM_STYLE,uniqueSegments} from './hospitalSystems';
import {addHospitalFinishes} from './hospitalFinishes';
import {createClinicalDisplay} from './clinicalDisplay';
import {createWorkstationDisplay} from './workstationDisplay';
import {createHospitalSurfaces} from './hospitalSurface';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {clamp,LAYERS,STOPS,JOURNEY_STEPS,sampleJourney,nearestStop} from './hospitalJourney';
import './hospital-experience.css';
import {DEMOS,demoStep} from './hospitalServiceDemos';
import {addServiceEffects} from './hospitalServiceEffects';
import {hospitalQuality} from './hospitalQuality';
import {createFreeNavigation} from './hospitalFreeNavigation';
import {HOSPITAL_ASSETS} from './hospitalAssets';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {inspectAt} from './hospitalInspection';
import {ARLabels,ARInspector,SystemGlyph} from './HospitalAR';
import {SERVICE_STORIES} from './hospitalARData';
import {createARTracking} from './hospitalARTracking';

const xyz=([x,y,z])=>new THREE.Vector3(x,z,-y);

export default function HospitalExperience({modelBase='/models/'}){
 const mount=useRef(null),engine=useRef(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[explore,setExplore]=useState(false),[playing,setPlaying]=useState(false),[layer,setLayer]=useState('all'),[progress,setProgress]=useState(0);
 const [systemsView,setSystemsView]=useState(true); // Highlight only physically visible routes.
 const [demo,setDemo]=useState(''),[demoStage,setDemoStage]=useState(0),[servicesReady,setServicesReady]=useState(false);
 const [demoRun,setDemoRun]=useState(0);
 const [navigation,setNavigation]=useState('orbit'),[viewMode,setViewMode]=useState('building'),[expanded,setExpanded]=useState(false),[selection,setSelection]=useState(null),[traffic,setTraffic]=useState(true),[telemetryTime,setTelemetryTime]=useState(0);
 const [arLabels,setARLabels]=useState([]),[arSettled,setARSettled]=useState(false),[arHover,setARHover]=useState(null),[arEnabled,setAREnabled]=useState(true);
 useEffect(()=>{if(!traffic||(!selection&&!arEnabled))return;const id=setInterval(()=>{if(!document.hidden)setTelemetryTime(t=>t+1);},1000);return()=>clearInterval(id);},[selection,traffic,arEnabled]);
 useEffect(()=>{if(!expanded)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[expanded]);
 const [assetId,setAssetId]=useState('ODF-01'),[incidents,setIncidents]=useState({}),[certified,setCertified]=useState(false);
 const asset=HOSPITAL_ASSETS.find(a=>a.id===assetId),incident=incidents[assetId]||0;
 const controls=useRef({explore:false,playing:false,layer:'all',progress:0,systemsView:true});
 controls.current={explore,playing,layer,progress,systemsView,demo,demoRun,navigation,viewMode,traffic,arEnabled,selection};
 useEffect(()=>{
  const host=mount.current; let alive=true,frame,model,renderer,last=0,uiTime=0,current=0,yaw=0,pitch=0,visible=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b9c3bd');
  const camera=new THREE.PerspectiveCamera(52,1,.06,140);
  const free=createFreeNavigation(camera);let wasExploring=false,lastNavigation='',manualPose=false;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{setError('Tu navegador no pudo iniciar WebGL. El recorrido requiere aceleración gráfica.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Hospital 3D. Clic para inspeccionar sistemas. Activá Explorar para orbitar o entrar.');host.appendChild(canvas);
  const orbit=new OrbitControls(camera,canvas);orbit.enabled=false;orbit.enableDamping=true;orbit.dampingFactor=.09;orbit.minDistance=.15;orbit.maxDistance=100;orbit.maxPolarAngle=Math.PI-.001;orbit.minPolarAngle=.001;orbit.zoomSpeed=.8;orbit.screenSpacePanning=true;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),skeleton=new THREE.Group();scene.add(skeleton);
  const edgeMaterial=new THREE.LineBasicMaterial({color:'#758982',transparent:true,opacity:.34});
  const registerStructure=o=>{if(!['Architecture','Architectural-detail'].includes(o.userData.system))return;o.updateWorldMatrix(true,false);const lines=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,35),edgeMaterial);lines.matrix.copy(o.matrixWorld);lines.matrixAutoUpdate=false;skeleton.add(lines);};
  const pmrem=new THREE.PMREMGenerator(renderer),envScene=new RoomEnvironment(),env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;envScene.dispose();pmrem.dispose();
  scene.environmentIntensity=.32;scene.add(new THREE.HemisphereLight(0xe5edf3,0x514c43,.48));const sun=new THREE.DirectionalLight(0xffedcf,2.6);sun.position.set(-7,9,-24);sun.target.position.set(0,0,-10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:18,bottom:-18,near:.5,far:65});sun.shadow.normalBias=.012;scene.add(sun,sun.target);
  RectAreaLightUniformsLib.init();
  for(const x of [-10.5,-3.5,3.5,10.5]){
   const windowLight=new THREE.RectAreaLight(0xe0edff,3.2,5.6,1.25);windowLight.position.copy(xyz([x,15.6,2.4]));windowLight.lookAt(xyz([x,11,1.2]));scene.add(windowLight);
   const ceilingLight=new THREE.RectAreaLight(0xfff2dc,1.8,1.2,.6);ceilingLight.position.copy(xyz([x,12,3.38]));ceilingLight.lookAt(xyz([x,12,0]));scene.add(ceilingLight);
  }
  for(const [p,target,power,w,h] of [[[-10,3,3.37],[-11,2.8,.7],3.5,1.2,.6],[[10.3,2.8,2.8],[10.3,4,1.1],4.5,2.2,.25]]){
   const taskLight=new THREE.RectAreaLight(0xf0f4ff,power,w,h);taskLight.position.copy(xyz(p));taskLight.lookAt(xyz(target));scene.add(taskLight);
  }
  const finishes=addHospitalFinishes(scene,xyz),clinicalDisplay=createClinicalDisplay(),workstationDisplay=createWorkstationDisplay(),surfaces=createHospitalSurfaces();
  const serviceEffects=addServiceEffects(scene,xyz);
  const plantLight=new THREE.RectAreaLight(0xffeedb,4.5,5,2);plantLight.position.copy(xyz([10.5,-2.5,3.42]));plantLight.lookAt(xyz([10.5,-4.3,.5]));scene.add(plantLight);
  const plantFill=new THREE.PointLight(0xe1edff,9,9,2);plantFill.position.copy(xyz([11,-1.1,2.6]));scene.add(plantFill);
  const cut=new THREE.Plane(new THREE.Vector3(0,-1,0),1.4),meshes=[],paths=[],traces=[],dots=[],endpoints=[],markers=[];
  for(const x of [-10.5,-3.5,3.5,10.5]){
   const m=new THREE.MeshStandardMaterial({color:0xdedfd9,roughness:.5}),o=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.045,20),m);o.position.copy(xyz([x,12,3.16]));o.userData={system:'Fire-detection',base:m.color.clone(),emission:m.emissive.clone()};scene.add(o);meshes.push(o);endpoints.push(o);
  }
  Object.entries(NETWORKS).forEach(([system,routes])=>{
   const style=SYSTEM_STYLE[system];
   // Software has no extra conduit: only moving logical packets on data paths.
   if(system!=='Software'){
    const parts=uniqueSegments(routes).map(([a,b])=>new THREE.TubeGeometry(new THREE.LineCurve3(xyz(a),xyz(b)),1,style.radius,6,false));
    const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    const material=new THREE.MeshStandardMaterial({color:style.color,emissive:style.color,emissiveIntensity:.12,roughness:.38});
    const mesh=new THREE.Mesh(geometry,material);mesh.userData.system=system;scene.add(mesh);paths.push(mesh);
    const lineGeometry=new LineSegmentsGeometry();lineGeometry.setPositions(uniqueSegments(routes).flatMap(pair=>pair.flatMap(p=>xyz(p).toArray())));
    const lineMaterial=new LineMaterial({color:style.color,linewidth:2.5,depthTest:true,depthWrite:false,transparent:true,opacity:.95,toneMapped:false});
    const trace=new LineSegments2(lineGeometry,lineMaterial);trace.userData.system=system;trace.renderOrder=10;scene.add(trace);traces.push(trace);
   }
   routes.forEach(({points,end},i)=>{
    const curve=new THREE.CurvePath();points.slice(1).forEach((p,j)=>curve.add(new THREE.LineCurve3(xyz(points[j]),xyz(p))));
    if(i<3){const dot=new THREE.Mesh(new THREE.SphereGeometry(.036,8,6),new THREE.MeshBasicMaterial({color:style.color,depthTest:true,depthWrite:false}));dot.renderOrder=5;scene.add(dot);dots.push({dot,curve,system,offset:i*.13+Object.keys(SYSTEM_STYLE).indexOf(system)*.07});}
    if(system!=='Software'){
     const marker=new THREE.Mesh(new THREE.TorusGeometry(.075,.006,5,24),new THREE.MeshBasicMaterial({color:style.color,depthTest:true,depthWrite:false}));marker.position.copy(xyz(end));marker.renderOrder=4;scene.add(marker);markers.push({marker,system});
    }
    // Terminal plates complete the physical circuits; small ports rather than graph nodes.
    if(system==='Power'){
     const mat=new THREE.MeshStandardMaterial({color:'#dedacc',roughness:.45});const plate=new THREE.Mesh(new THREE.BoxGeometry(.10,.07,.018),mat);plate.position.copy(xyz(end));plate.userData={system,base:mat.color.clone(),emission:mat.emissive.clone()};scene.add(plate);meshes.push(plate);endpoints.push(plate);
    }
   });
  });
  const detector=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.045,20),new THREE.MeshStandardMaterial({color:'#dedacc',roughness:.5}));detector.position.copy(xyz([-9.5,3.9,3.16]));detector.userData={system:'Fire-detection',base:detector.material.color.clone(),emission:detector.material.emissive.clone()};scene.add(detector);meshes.push(detector);endpoints.push(detector);
  const disposeModel=root=>root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});
  const draco=new DRACOLoader().setDecoderPath(`${modelBase}draco/`).setWorkerLimit(1);
  let workstationModel,terminalModel,servicesModel;
  new GLTFLoader().setDRACOLoader(draco).load(`${modelBase}hospital-services.glb`,g=>{
   if(!alive){disposeModel(g.scene);return;}servicesModel=g.scene;
   servicesModel.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.userData={system:o.name.split('__')[0],base:o.material.color.clone(),emission:o.material.emissive.clone(),baseIntensity:o.material.emissiveIntensity};o.castShadow=true;o.receiveShadow=true;meshes.push(o);});
   scene.add(servicesModel);servicesModel.traverse(o=>{if(o.isMesh)registerStructure(o);});lastLayer='';setServicesReady(true);
  },undefined,()=>{if(alive)setError('No se pudo cargar la ampliación de servicios. Recargá para volver a intentarlo.');});
  new GLTFLoader().setDRACOLoader(draco).load(`${modelBase}hospital-terminals.glb`,g=>{
   if(!alive){disposeModel(g.scene);return;}terminalModel=g.scene;
   terminalModel.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.userData={system:o.name.split('__')[0],base:o.material.color.clone(),emission:o.material.emissive.clone(),baseIntensity:o.material.emissiveIntensity};o.castShadow=true;o.receiveShadow=true;meshes.push(o);});
   scene.add(terminalModel);lastLayer='';
  },undefined,()=>{if(alive)setError('No se pudieron cargar las terminaciones de red. Recargá para volver a intentarlo.');});
  new GLTFLoader().setDRACOLoader(draco).load(`${modelBase}hospital-walkthrough.glb`,g=>{
   if(!alive){disposeModel(g.scene);return;}model=g.scene;
   model.traverse(o=>{if(!o.isMesh)return;const system=o.name.split('__')[0];o.userData.system=system;
    o.material=o.material.clone();
    const finish=o.name.split('__')[1],palette={chalk:'#c6c4b7',stone:'#687a79',resin:'#8daba5',metal:'#647572',wood:'#87654b',upholstery:'#304e59',dark:'#172f34'};
    if(palette[finish])o.material.color.set(palette[finish]);
    if(system==='Data'&&finish==='dark'){o.material.color.set('#111820');o.material.roughness=.48;}
    if(system==='Ceiling'&&finish==='chalk')o.material.color.set('#c4c3b8');
    surfaces.apply(o,finish||'');
    if(finish==='red'&&SYSTEM_STYLE[system]){o.material.color.set(SYSTEM_STYLE[system].color);o.material.emissive?.set(SYSTEM_STYLE[system].color);o.material.emissiveIntensity=.16;}
    if(o.name.includes('clinical-screen')){o.material.map=clinicalDisplay.texture;o.material.emissiveMap=clinicalDisplay.texture;o.material.color.set('#ffffff');o.material.emissive.set('#ffffff');o.material.emissiveIntensity=.6;o.material.roughness=.35;o.material.metalness=0;}
    o.userData.base=o.material.color.clone();o.userData.emission=o.material.emissive?.clone();o.userData.baseIntensity=o.material.emissiveIntensity;o.userData.legacyWorkstation=system==='Software';o.userData.legacyAP=system==='Telecom'&&finish==='chalk';o.userData.legacyEquipment=system==='Power'||system==='Security';o.castShadow=system!=='Ceiling'&&!o.name.includes('__glass');o.receiveShadow=true;o.material.clipShadows=true;
    // Readable low-cost glazing for WebGL; architectural glass remains in the scene.
    if(o.name.includes('__glass')){o.material.transmission=0;o.material.transparent=true;o.material.opacity=.15;o.material.depthWrite=false;}
    meshes.push(o);
   });scene.add(model);model.traverse(o=>{if(o.isMesh)registerStructure(o);});lastLayer='';setReady(true);
   new GLTFLoader().setDRACOLoader(draco).load(`${modelBase}hospital-workstations.glb`,pc=>{
    if(!alive){disposeModel(pc.scene);return;}workstationModel=pc.scene;
    pc.scene.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.userData.system='Software';
     if(o.name.includes('workstation-screen')){o.material.map=workstationDisplay.texture;o.material.emissiveMap=workstationDisplay.texture;o.material.emissive.set('#ffffff');o.material.emissiveIntensity=.7;}
     o.userData.base=o.material.color.clone();o.userData.emission=o.material.emissive.clone();o.userData.baseIntensity=o.material.emissiveIntensity;o.castShadow=true;o.receiveShadow=true;meshes.push(o);
    });scene.add(pc.scene);lastLayer='';
   },undefined,()=>{if(alive)setError('No se pudieron cargar los puestos IT. Recargá para volver a intentarlo.');});
  },undefined,()=>{if(alive)setError('No se pudo cargar el hospital. Recargá esta página para volver a intentarlo.');});
  // Contact occlusion grounds equipment. Cap resolution; mobile uses the direct renderer.
  const composer=new EffectComposer(renderer);composer.setPixelRatio(1);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;
  const ao=new SSAOPass(scene,camera,800,500,12);ao.kernelRadius=.15;ao.minDistance=.0001;ao.maxDistance=.006;
  const output=new OutputPass();composer.addPass(new RenderPass(scene,camera));composer.addPass(ao);composer.addPass(output);let useAO=false;
  let viewHeight=600;
  const resize=()=>{const {width,height}=host.getBoundingClientRect();viewHeight=height;const quality=hospitalQuality(width,devicePixelRatio,matchMedia('(pointer: coarse)').matches);renderer.setPixelRatio(quality.pixelRatio);renderer.setSize(width,height);if(sun.shadow.mapSize.x!==quality.shadowSize){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);}camera.aspect=width/height;camera.updateProjectionMatrix();useAO=quality.contactShadows;const scale=Math.min(1,1200/width);composer.setSize(useAO?Math.round(width*scale):1,useAO?Math.round(height*scale):1);canvas.dataset.pixelRatio=String(quality.pixelRatio);canvas.dataset.shadowSize=String(quality.shadowSize);traces.forEach(t=>t.material.resolution.set(width,height));};const ro=new ResizeObserver(resize);ro.observe(host);resize();
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});io.observe(host);
  const pointers=new Map();let drag=null,pinch=0,pinchCentre=null,clickStart=null,hoverWorld=null,hoverTimer=null,lastHoverCheck=0,hoverId='';
  const arTracking=createARTracking(camera,()=>meshes.filter(o=>o.visible&&!o.material.clippingPlanes?.length&&(!o.material.transparent||o.material.opacity>.5)),(labels,settled)=>{setARLabels(labels);setARSettled(settled);canvas.dataset.arSettled=String(settled);canvas.dataset.arLabels=String(labels.length);});
  const hoverMove=e=>{if(e.buttons||performance.now()-lastHoverCheck<140)return;lastHoverCheck=performance.now();const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...meshes,...paths].filter(o=>o.visible),false).find(h=>!h.object.material.transparent||h.object.material.opacity>.3);const system=hit?.object.userData.system;if(!SYSTEM_STYLE[system]){clearTimeout(hoverTimer);hoverId='';hoverWorld=null;setARHover(null);canvas.style.cursor='';return;}const q=hit.point,p=[q.x,-q.z,q.y],asset=inspectAt(system,p);canvas.style.cursor='pointer';if(asset.id===hoverId)return;hoverId=asset.id;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{hoverWorld={asset,p};setARHover(asset);},350);};
  const pick=e=>{const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...meshes,...paths].filter(o=>o.visible),false);const hit=hits.find(h=>!h.object.material.transparent||h.object.material.opacity>.3);if(hit&&SYSTEM_STYLE[hit.object.userData.system]){const q=hit.point;setSelection(inspectAt(hit.object.userData.system,[q.x,-q.z,q.y]));setPlaying(false);}};
  const down=e=>{clickStart=[e.clientX,e.clientY,performance.now()];if(!controls.current.explore||controls.current.navigation==='orbit')return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag=[e.clientX,e.clientY];setPlaying(false);if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);pinchCentre=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];}};
  const move=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);
   if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),centre=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];free.dolly(-(d-pinch)*.012);if(pinchCentre)free.pan(-(centre[0]-pinchCentre[0])*.008,(centre[1]-pinchCentre[1])*.008);pinch=d;pinchCentre=centre;}
   else if(drag){free.rotate(e.clientX-drag[0],e.clientY-drag[1]);drag=[e.clientX,e.clientY];}
  };
  const up=e=>{if(clickStart&&Math.hypot(e.clientX-clickStart[0],e.clientY-clickStart[1])<5&&performance.now()-clickStart[2]<500)pick(e);clickStart=null;pointers.delete(e.pointerId);drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  const wheel=e=>{if(!controls.current.explore||controls.current.navigation==='orbit')return;e.preventDefault();free.dolly(-clamp(e.deltaY,-100,100)*.012);};
  const key=e=>{if(e.key==='Escape'){free.clear();setExplore(false);setPlaying(false);pointers.clear();drag=null;return;}if(!controls.current.explore||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
   const k=e.key.toLowerCase();if(controls.current.navigation==='walk'&&['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){e.preventDefault();free.keys.add(k);}
  };
  const keyUp=e=>free.keys.delete(e.key.toLowerCase()),blur=()=>free.clear();window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointermove',hoverMove);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',key);
  engine.current={resetLook:()=>{yaw=0;pitch=0;free.clear();manualPose=false;},nudge:(x,y,z)=>{const before=camera.position.clone();free.pan(x,y);free.dolly(z);if(controls.current.navigation==='orbit')orbit.target.add(camera.position.clone().sub(before));}};
  let lastLayer='',lastOverview,lastSystems,lastView,measurementStart=0,renderedFrames=0,lastDemo='',lastDemoRun=-1,demoStart=0,lastDemoStage=-1;
  function tick(ms){frame=requestAnimationFrame(tick);const dt=Math.min((ms-last)/1000,.08);if(ms-last<33)return;last=ms;if(!visible||document.hidden){free.clear();return;}
   const c=controls.current;
   if(c.demo!==lastDemo||c.demoRun!==lastDemoRun){lastDemo=c.demo;lastDemoRun=c.demoRun;demoStart=ms;lastDemoStage=-1;}
   const elapsed=ms-demoStart,stage=demoStep(elapsed);
   if(c.demo&&stage!==lastDemoStage){lastDemoStage=stage;setDemoStage(stage);}
   serviceEffects.update(c.demo,elapsed,reduced.matches||!c.traffic);
   if(c.playing&&model){const next=clamp(c.progress+dt/65);c.progress=next;if(ms-uiTime>90){setProgress(next);uiTime=ms;}if(next===1)setPlaying(false);}
   current=reduced.matches?c.progress:THREE.MathUtils.damp(current,c.progress,4,dt);
   orbit.enabled=c.explore&&c.navigation==='orbit';
   if(c.explore){if(!wasExploring||lastNavigation!==c.navigation){free.capture();if(!manualPose)orbit.target.copy(xyz(sampleJourney(current).look));else{const ahead=camera.getWorldDirection(new THREE.Vector3());orbit.target.copy(camera.position).addScaledVector(ahead,5);}manualPose=true;}if(c.navigation==='orbit')orbit.update();else free.update(dt);}else if(!manualPose||c.playing){const sample=sampleJourney(current),position=xyz(sample.p),target=xyz(sample.look);const fit=1+(Math.max(1,1.6/camera.aspect)-1)*clamp(1-current/.08);camera.position.copy(target).add(position.sub(target).multiplyScalar(fit));camera.lookAt(target);free.clear();}else free.clear();wasExploring=c.explore;lastNavigation=c.navigation;
   const overview=manualPose?camera.position.y>5:current<.06;
   const rect=host.getBoundingClientRect();arTracking.update(ms,{width:rect.width,height:rect.height,layer:c.layer,playing:c.playing,enabled:c.arEnabled&&!c.selection,hover:hoverWorld});
   if(lastLayer!==c.layer||lastOverview!==overview||lastSystems!==c.systemsView||lastView!==c.viewMode){
    skeleton.visible=c.viewMode==='skeleton';finishes.setVisible(c.viewMode==='building');
    meshes.forEach(o=>{
     const system=o.userData.system,selected=system===c.layer,m=o.material;
     const service=Boolean(SYSTEM_STYLE[system]);o.visible=(!o.userData.legacyWorkstation||!workstationModel)&&(!o.userData.legacyAP||!servicesModel)&&(!o.userData.legacyEquipment||!servicesModel)&&(system!=='Ceiling'||!overview)&&(c.viewMode==='building'||service)&&(c.viewMode==='building'||c.layer==='all'||selected||(c.layer==='Software'&&system==='Data'));
     m.clippingPlanes=(system==='Architecture'||system==='Architectural-detail')&&overview?[cut]:null;
     m.color.copy(o.userData.base);if(o.userData.emission)m.emissive.copy(o.userData.emission);m.emissiveIntensity=o.userData.baseIntensity??0;
     if(c.systemsView&&c.layer!=='all'&&!selected)m.color.multiplyScalar(.66);
     if(selected&&c.systemsView&&!o.name.includes('screen')){m.color.lerp(new THREE.Color(SYSTEM_STYLE[system].color),.08);m.emissive?.set(SYSTEM_STYLE[system].color);m.emissiveIntensity=.045;}
     m.needsUpdate=true;
    });paths.forEach(o=>{o.visible=c.layer==='all'||o.userData.system===c.layer||(c.layer==='Software'&&o.userData.system==='Data');o.material.emissiveIntensity=.12;o.material.depthTest=true;o.material.depthWrite=true;});
    traces.forEach(o=>{o.visible=c.systemsView&&(c.layer==='all'||o.userData.system===c.layer||(c.layer==='Software'&&o.userData.system==='Data'));o.material.linewidth=c.layer==='all'?1.4:2.8;});lastLayer=c.layer;lastOverview=overview;lastSystems=c.systemsView;lastView=c.viewMode;
   }
   const metresPerPixel=o=>2*camera.position.distanceTo(o.position)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/viewHeight;
   dots.forEach(({dot,curve,system,offset})=>{dot.visible=c.systemsView&&(system===c.layer||c.layer==='all');dot.position.copy(curve.getPoint((reduced.matches||!c.traffic?offset:ms*.00004+offset)%1));dot.scale.setScalar(Math.max(1,metresPerPixel(dot)*5/.072));dot.renderOrder=12;});
   markers.forEach(({marker,system})=>{marker.visible=c.systemsView&&system===c.layer;marker.quaternion.copy(camera.quaternion);marker.scale.setScalar(Math.max(1,metresPerPixel(marker)*11/.15));marker.renderOrder=11;});
   canvas.dataset.progress=current.toFixed(3);canvas.dataset.yaw=yaw.toFixed(3);canvas.dataset.layer=c.layer;canvas.dataset.explore=String(c.explore);canvas.dataset.systems=String(c.systemsView);canvas.dataset.workstations=String(Boolean(workstationModel));canvas.dataset.terminals=String(Boolean(terminalModel));
   canvas.dataset.services=String(Boolean(servicesModel));canvas.dataset.demo=c.demo;canvas.dataset.demoStage=String(stage);canvas.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(2)).join(',');canvas.dataset.viewMode=c.viewMode;canvas.dataset.navigation=c.navigation;if(c.explore)canvas.dataset.yaw=(c.navigation==='walk'?free.yaw:orbit.getAzimuthalAngle()).toFixed(3);
   clinicalDisplay.update(ms,reduced.matches);workstationDisplay.update(ms,reduced.matches,c.demo,stage);if(useAO&&!overview&&c.viewMode==='building')composer.render();else renderer.render(scene,camera);
   if(!measurementStart)measurementStart=ms;
   renderedFrames++;
   if(ms-measurementStart>=2000){canvas.dataset.renderFps=(renderedFrames*1000/(ms-measurementStart)).toFixed(1);canvas.dataset.quality=useAO&&!overview?'contact-shadows':'direct';renderedFrames=0;measurementStart=ms;}
  }frame=requestAnimationFrame(tick);
  return()=>{
   alive=false;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);free.clear();
   clearTimeout(hoverTimer);canvas.removeEventListener('pointermove',hoverMove);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);
   if(model)disposeModel(model);if(workstationModel)disposeModel(workstationModel);if(terminalModel)disposeModel(terminalModel);if(servicesModel)disposeModel(servicesModel);serviceEffects.dispose();
   [...paths,...traces,...endpoints,...markers.map(m=>m.marker),...dots.map(d=>d.dot)].forEach(o=>{o.geometry.dispose();o.material.dispose();});
   orbit.dispose();skeleton.children.forEach(o=>o.geometry.dispose());edgeMaterial.dispose();ao.dispose();output.dispose();composer.dispose();clinicalDisplay.dispose();workstationDisplay.dispose();surfaces.dispose();finishes.dispose();draco.dispose();env.dispose();renderer.dispose();canvas.remove();engine.current=null;
  };
 },[]);
 const stop=nearestStop(progress),layerInfo=LAYERS.find(l=>l[0]===layer);
 const go=(value,preserveDemo=false)=>{if(!preserveDemo)setDemo('');setExplore(false);setPlaying(false);setProgress(value);engine.current?.resetLook();};
 const runDemo=id=>{setDemo(id);setDemoRun(n=>n+1);setDemoStage(0);setExplore(false);setSystemsView(true);if(id){setLayer(DEMOS[id].layer);go(STOPS.find(s=>s.name===DEMOS[id].stop).step/JOURNEY_STEPS,true);mount.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}else setLayer('all');};
 return <section className="hospital-experience">
  <div className="hospital-heading"><div><span className="hospital-kicker">ULTIMA MILLA / INFRAESTRUCTURA VIVA</span><h1>Sistemas integrales por SECTOR</h1><p>Un hospital desde adentro. Descubrí la infraestructura detrás de cada operación.</p></div><span className="hospital-badge">01 / SALUD<br/>Estudio interactivo</span></div>
  <div className={`hospital-stage ${expanded?'is-expanded':''}`}>
   <div className={`hospital-canvas ${explore?'is-exploring':''}`} ref={mount}/>
   {!ready&&!error?<div className="hospital-loading" role="status">Preparando arquitectura y sistemas…</div>:null}
   {error?<div className="hospital-loading" role="alert">{error}</div>:null}
   <div className="hospital-location" aria-live="polite"><span>{explore?'Exploración libre':demo?DEMOS[demo].title:stop.name}</span><p>{selection?`${selection.id} · ${selection.name} · DEMO`:demo?`${demoStage+1}/3 · ${DEMOS[demo].steps[demoStage]}`:stop.description}</p></div>
   <div className="hospital-view-tools"><div aria-label="Representación">{[['building','Edificio'],['skeleton','Esqueleto'],['systems','Sólo sistemas']].map(([id,label])=><button key={id} aria-pressed={viewMode===id} onClick={()=>setViewMode(id)}>{label}</button>)}</div><button onClick={()=>setExpanded(v=>!v)}>{expanded?'Reducir visor':'Ampliar visor'}</button><select aria-label="Modo de navegación" value={navigation} onChange={e=>{setNavigation(e.target.value);setExplore(true);setPlaying(false);setDemo('');}}><option value="orbit">Orbitar / desplazar</option><option value="walk">Entrar / caminar</option></select></div>
   <div className="hospital-layer-overlay"><span className="um-ar-filter-title">FILTRAR SISTEMAS · NO SON ETIQUETAS DE EQUIPOS</span><div className="hospital-layers" aria-label="Capas de servicios">{LAYERS.map(([id,name])=><button key={id} style={{'--system-color':SYSTEM_STYLE[id]?.color||'#344f46'}} aria-label={name} title={SERVICE_STORIES[id]?.verb||'Ver todos los sistemas'} aria-pressed={layer===id} onClick={()=>{setLayer(id);setSelection(null);}}>{SYSTEM_STYLE[id]?<SystemGlyph system={id}/>:null}{name}</button>)}</div></div>
   <div className="um-ar-status"><button aria-pressed={arEnabled} onClick={()=>setAREnabled(v=>!v)}>◎ Lentes AR {arEnabled?'activados':'desactivados'}</button><span>{selection?'Inspector fijado · datos DEMO':arEnabled?(arSettled?'Apuntá o tocá una etiqueta para ver su servicio':'Mové la cámara y detenete para detectar sistemas'):'Inspección directa: clic sobre un equipo'}</span></div>
   {!selection&&arEnabled?<ARLabels labels={arLabels} settled={arSettled} hover={arHover} time={telemetryTime} active={traffic} onHover={setARHover} onSelect={a=>{setSelection(a);setPlaying(false);}}/>:null}
   <div className="hospital-actions"><button disabled={!ready} aria-pressed={explore} onClick={()=>{setExplore(!explore);setPlaying(false);}}>{explore?'Salir de Explorar · Esc':'Explorar 3D'}</button><button disabled={!ready} aria-pressed={playing} onClick={()=>{setExplore(false);if(progress>.99)go(0);setPlaying(!playing);}}>{playing?'Pausar':'Recorrido automático'}</button><button aria-pressed={systemsView} onClick={()=>setSystemsView(v=>!v)}>Resaltar sistemas</button><button disabled={!ready} onClick={()=>go(0)}>Vista general ↗</button></div>
   <div className="hospital-instruction">{explore?(navigation==='orbit'?'Orbitar: arrastre · Desplazar: botón derecho o Ctrl + arrastre · Zoom: rueda · Táctil: dos dedos para zoom y desplazamiento.':'Entrar: WASD · Altura: Q/E · Mirar: arrastre · Rueda: avanzar · Shift: acelerar.'):'Clic en equipos o enlaces para inspeccionarlos. Activá Explorar para manejar la cámara.'}</div>
   {selection?<ARInspector asset={selection} time={telemetryTime} active={traffic} onClose={()=>setSelection(null)} onToggle={()=>setTraffic(v=>!v)}/>:null}
  </div>
  <div className="hospital-navigation-tools"><span>Cámara</span><button aria-pressed={explore&&navigation==='orbit'} disabled={!ready} onClick={()=>{setNavigation('orbit');setExplore(true);setPlaying(false);setDemo('');}}>Orbitar edificio</button><button aria-pressed={explore&&navigation==='walk'} disabled={!ready} onClick={()=>{setNavigation('walk');setExplore(true);setPlaying(false);setDemo('');}}>Entrar y caminar</button><span>Esc libera el cursor sin volver al inicio. Vista general recupera el encuadre.</span></div>
  {explore?<div className="hospital-free-controls" aria-label="Desplazamiento libre">{[['← Izquierda',-.5,0,0],['Adelante',0,0,-.5],['Atrás',0,0,.5],['Derecha →',.5,0,0],['Subir',0,.4,0],['Bajar',0,-.4,0]].map(([label,x,y,z])=><button key={label} onClick={()=>engine.current?.nudge(x,y,z)}>{label}</button>)}<span>Inspección libre: permite atravesar paredes. Elegí una ubicación para reorientarte.</span></div>:null}
  <div className="hospital-controlbar"><label>Recorrido <input aria-label="Avance del recorrido" type="range" min="0" max="1000" value={Math.round(progress*1000)} onChange={e=>go(Number(e.target.value)/1000)}/></label><div className="hospital-stops">{STOPS.map(s=><button key={s.name} aria-pressed={stop.name===s.name} disabled={!ready} onClick={()=>go(s.step/JOURNEY_STEPS)}>{s.name}</button>)}</div></div>
  <div className="hospital-demo-panel"><div><span className="hospital-kicker">PROBÁ UN SERVICIO · DEMO</span><p>Del dispositivo al evento en supervisión.</p></div><div className="hospital-demo-buttons">{Object.entries(DEMOS).map(([id,d])=><button key={id} disabled={!servicesReady} aria-pressed={demo===id} onClick={()=>runDemo(id)}>{d.label}</button>)}{demo?<button onClick={()=>runDemo('')}>Finalizar demo</button>:null}</div><div className="hospital-demo-status" role="status"><strong>{demo?DEMOS[demo].title:'Cinco recorridos funcionales'}</strong><span>{demo?`${demoStage+1}/3 · ${DEMOS[demo].steps[demoStage]}`:'Seleccioná una prueba para seguir una conexión. Sin equipos reales conectados.'}</span></div></div>
  <div className="hospital-asset-panel"><div><span className="hospital-kicker">ACTIVOS / OPERACIÓN DEMO</span><h2>Del detalle al servicio.</h2><p>Inspeccioná cada equipo y probá el circuito de soporte. Todo sucede en esta sesión, sin sistemas externos.</p><label>Activo <select value={assetId} onChange={e=>setAssetId(e.target.value)}>{HOSPITAL_ASSETS.map(a=><option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}</select></label></div><div><h3>{asset.name}</h3><p>{asset.detail}</p><p className="hospital-asset-route">{asset.route}</p><button disabled={!servicesReady} onClick={()=>{go(STOPS.find(s=>s.name===asset.stop).step/JOURNEY_STEPS);setLayer(asset.layer);setSystemsView(true);mount.current?.scrollIntoView({block:'center',behavior:'smooth'});}}>Ver equipo en 3D ↗</button><div className="hospital-incident" role="status"><strong>{['Disponible · DEMO','Incidencia abierta · DEMO','En atención · DEMO','Resuelta · DEMO'][incident]}</strong><p>{['Creá una incidencia de prueba sobre este activo.','Se registró la solicitud en la sesión local.','Diagnóstico y atención simulados.','Cierre ilustrativo. No se ha intervenido ningún equipo.'][incident]}</p><button onClick={()=>setIncidents(v=>({...v,[assetId]:(incident+1)%4}))}>{['Crear incidencia DEMO','Iniciar atención DEMO','Resolver DEMO','Reiniciar prueba'][incident]}</button></div>{assetId==='TEST-01'?<div><button onClick={()=>setCertified(v=>!v)}>{certified?'Limpiar registro':'Generar registro de prueba DEMO'}</button>{certified?<p role="status">TEST-01 · Enlace ilustrativo · Continuidad: SIMULADA · Resultado: DEMO, sin mediciones ni validez de certificación.</p>:null}</div>:null}</div></div>
  <div className="hospital-systems"><div><span className="hospital-kicker">SEGUÍ UN SISTEMA</span><h2>Lo que no se ve.<br/> Lo que no puede fallar.</h2></div><div><p aria-live="polite">{layerInfo[2]}</p></div></div>
  <p className="hospital-disclaimer">Esquema conceptual creado en Blender. No representa un hospital real ni un proyecto aprobado. Equipos médicos como contexto; pantallas DEMO con señales sintéticas, sin datos clínicos ni conexión al SGI. Recorrido guiado e inspección libre 360°, sin colisiones: no es un simulador de circulación clínica. Incidencias y registros son pruebas locales sin persistencia.</p>
 </section>;
}
