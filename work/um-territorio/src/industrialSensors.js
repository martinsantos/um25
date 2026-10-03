import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {SYSTEM_STYLE} from './hospitalSystems.js';
// Reusable, metre-scale service kit on top of the Blender architecture.
// Batching keeps fasteners, terminals and ventilation from becoming draw calls.
export function createIndustrialSensors(assets){
 const root=new THREE.Group(),meshes=[],leds=[];
 for(const asset of assets){
  const parts={metal:[],body:[],dark:[],signal:[]};
  const p=asset.p,xyz=q=>new THREE.Vector3(q[0],q[2],-q[1]);
  if(asset.kind==='barrel'){
   const barrel=new THREE.Group();barrel.position.set(p[0],0,-p[1]-.55);
   const profile=[[0,.46],[.12,.5],[.7,.61],[1.28,.5],[1.4,.46]].map(([y,r])=>new THREE.Vector2(r,y));
   const body=new THREE.Mesh(new THREE.LatheGeometry(profile,40),new THREE.MeshStandardMaterial({color:0x795330,roughness:.7}));barrel.add(body);
   for(const y of [.12,.38,1.02,1.28]){const ring=new THREE.Mesh(new THREE.TorusGeometry(y<.2||y>1.2?.505:.565,.019,6,40),new THREE.MeshStandardMaterial({color:0x455053,metalness:.7,roughness:.4}));ring.rotation.x=Math.PI/2;ring.position.y=y;barrel.add(ring);}
   const lid=new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.035,40),new THREE.MeshStandardMaterial({color:0x8a623b,roughness:.75}));lid.position.y=1.4;barrel.add(lid);
   const bung=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,20),new THREE.MeshStandardMaterial({color:0x455053,metalness:.7,roughness:.4}));bung.position.set(.2,1.42,.1);barrel.add(bung);
   const tap=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.09,16),new THREE.MeshStandardMaterial({color:0x455053,metalness:.7,roughness:.4}));tap.rotation.x=Math.PI/2;tap.position.set(-.2,.32,.56);barrel.add(tap);
   barrel.traverse(o=>{if(o.isMesh){o.userData={system:'Furniture-context',base:o.material.color.clone(),emission:o.material.emissive.clone()};o.castShadow=true;o.receiveShadow=true;meshes.push(o);}});root.add(barrel);
  }
  const box=(x,y,z,w,d,h,mat='body')=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(p[0]+x,p[2]+z,-p[1]-y);parts[mat].push(g);};
  const rod=(a,b,r,mat='metal')=>{const from=xyz(a),to=xyz(b),dir=to.clone().sub(from);if(!dir.length())return;const g=new THREE.CylinderGeometry(r,r,dir.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());parts[mat].push(g);};
  if(asset.kind==='door'){
   // Door offset beside its reader, preserving a 1.05 m clear conceptual leaf.
   const centre=-.72;
   box(centre,0,1.12-p[2],1.04,.055,2.18,'body');
   for(const x of [centre-.58,centre+.58])box(x,0,1.16-p[2],.075,.15,2.32,'metal');
   box(centre,0,2.3-p[2],1.23,.15,.075,'metal');
   box(centre,-.035,1.6-p[2],.32,.012,.46,'dark');
   for(const z of [.25,1.1,2])box(centre-.49,-.02,z-p[2],.05,.08,.10,'metal');
   box(centre+.4,-.07,1.05-p[2],.035,.09,.17,'metal');
   box(centre+.32,-.12,1.1-p[2],.19,.025,.025,'metal');
   box(centre+.15,-.07,2.1-p[2],.24,.065,.07,'metal');
   box(centre,-.048,.3-p[2],.88,.012,.3,'metal');
   box(centre+.4,-.075,1.18-p[2],.015,.01,.015,'signal');
   rod([p[0]+centre+.15,p[1]-.1,2.1],[p[0]+centre-.12,p[1]-.18,2.24],.009);
   box(centre+.45,-.05,2.17-p[2],.07,.04,.035,'signal');
  }
  const ceiling=asset.kind.startsWith('ceiling-');
  // Losa por sector en metros: hospital 3.4, aeropuerto 4.2, bodega 5.2.
  // Evita varillas flotantes sobre el cielorraso o atravesando la losa.
  const ceil=asset.id.startsWith('HOS')?3.4:asset.id.startsWith('WIN')?5.2:4.2;
  if(asset.kind==='beam'){
   // Par lineal: emisor y receptor enfrentados, colgados de losa.
   const span=asset.span||6;
   for(const [dx,dir] of [[0,1],[span,-1]]){
    box(dx,0,0,.16,.12,.2,'body');
    box(dx+dir*.085,-.01,0,.02,.08,.1,'dark');
    box(dx,-.068,.05,.03,.012,.03,'signal');
    rod([p[0]+dx,p[1],p[2]+.1],[p[0]+dx,p[1],ceil],.01);
   }
   rod([p[0],p[1],p[2]],[p[0]+span,p[1],p[2]],.004,'dark');
  }
  if(asset.kind==='beacon'){
   rod([p[0],p[1],0],[p[0],p[1],2.4],.035,'metal');
   box(0,0,2.45-p[2],.24,.24,.07,'metal');
   box(0,0,2.58-p[2],.15,.15,.2,'dark');
   box(0,0,2.58-p[2],.16,.16,.09,'signal');
  }
  if(asset.kind==='barrier'){
   box(0,0,.55-p[2],.34,.34,1.1,'body');
   box(0,-.18,.95-p[2],.2,.02,.12,'dark');
   box(.08,-.185,.95-p[2],.03,.014,.03,'signal');
   for(let i=0;i<6;i++)box(.35+i*.5,-.02,1.02-p[2],.48,.06,.09,i%2?'dark':'body');
   box(3.32,-.02,1.02-p[2],.06,.07,.1,'signal');
  }
  if(asset.kind==='camera'){
   rod([p[0],p[1],0],[p[0],p[1],3.9],.045,'metal');
   box(0,0,.15,.34,.34,.3,'metal');
   box(0,-.05,3.72-p[2],.2,.2,.14,'metal');
   rod([p[0],p[1],3.78],[p[0],p[1]-.4,3.6],.02);
   box(0,-.44,3.52-p[2],.17,.3,.15,'body');
   box(0,-.44,3.63-p[2],.2,.34,.03,'metal');
   rod([p[0],p[1]-.5,3.5],[p[0],p[1]-.72,3.5],.055,'dark');
   box(0,-.44,3.66-p[2],.03,.03,.02,'signal');
  }
  if(asset.kind==='pir'){
   box(0,0,0,.14,.1,.2,'body');
   const dome=new THREE.SphereGeometry(.055,12,8,0,Math.PI*2,0,Math.PI/2);dome.rotateX(Math.PI);dome.translate(p[0],p[2]-.02,-p[1]+.075);parts.dark.push(dome);
   box(0,-.078,-.06,.02,.012,.02,'signal');
  }
  if(asset.kind==='alarm-panel'){
   box(0,0,0,.3,.1,.4,'body');
   box(0,-.055,-.05,.22,.012,.12,'dark');
   for(let r=0;r<4;r++)for(let c=0;c<3;c++)box(-.07+c*.07,-.062,.06-r*.045,.04,.008,.03,'metal');
   box(.09,-.062,.14,.03,.01,.03,'signal');
  }
  if(asset.kind==='battery'){
   // Banco abierto: zócalo, montantes y 4 estantes con bloques y testigos.
   box(0,0,-.68,.86,.46,.06,'metal');
   for(const x of [-.42,.42])box(x,0,0,.06,.46,1.36,'metal');
   box(0,0,.68,.86,.46,.05,'metal');
   for(let i=0;i<4;i++){const z=-.48+i*.32;box(0,0,z,.78,.4,.24,'dark');box(-.25,0,z,.06,.42,.1,'metal');box(.25,0,z,.06,.42,.1,'metal');box(.3,-.22,z,.03,.02,.06,'signal');}
  }
  if(asset.kind==='transfer'){
   box(0,0,0,.6,.2,.9,'body');
   box(0,-.105,0,.5,.012,.75,'dark');
   box(.1,-.115,.2,.05,.02,.1,'metal');
   box(.1,-.13,.2,.16,.025,.045,'metal');
   for(let i=0;i<3;i++)box(-.12+i*.12,-.112,-.2,.05,.014,.05,'signal');
   box(-.18,-.115,.28,.04,.015,.04,'metal');
  }
  if(asset.kind==='dish'){
   // Redundancia de enlace: mástil, parábola aproximada y alimentador.
   const base=asset.base??(p[2]-.5);
   rod([p[0],p[1],base],[p[0],p[1],p[2]+.1],.05,'metal');
   box(0,0,-.25,.2,.2,.15,'metal');
   const surf=new THREE.CylinderGeometry(.12,.55,.28,24,1,true);surf.rotateZ(-Math.PI/2);surf.translate(p[0]+.2,p[2],-p[1]);parts.metal.push(surf);
   rod([p[0]+.2,p[1],p[2]],[p[0]+.75,p[1],p[2]],.015);
   box(.75,0,0,.12,.09,.09,'dark');
   box(0,-.09,-.25,.04,.02,.04,'signal');
  }
  if(asset.kind==='survey'){
   // Mesa de relevamiento: hace tangible la consultoría y la auditoría.
   box(0,0,.725,1.2,.8,.05,'body');
   for(const x of [-.5,.5])for(const y of [-.3,.3])box(x,y,.375,.06,.06,.75,'metal');
   for(let i=0;i<2;i++){const roll=new THREE.CylinderGeometry(.035,.035,.85,12);roll.rotateZ(Math.PI/2);roll.translate(p[0]-.1,p[2]+.8+i*.09,-p[1]-.15);parts.body.push(roll);}
   box(-.25,-.1,.79,.4,.3,.008,'dark');
   box(.38,-.05,.2,.4,.3,.4,'dark');
   box(.38,-.05,.42,.2,.05,.03,'metal');
  }
  if(asset.kind==='noc-wall'){
   box(0,0,0,1.0,.08,.7,'metal');
   box(0,-.045,0,.92,.02,.62,'dark');
   for(let r=0;r<2;r++)for(let c=0;c<3;c++)box(-.3+c*.3,-.058,.12-r*.24,.24,.014,.18,(r===1&&c===2)?'signal':'dark');
   box(.4,-.058,.3,.06,.014,.06,'signal');
  }
  if(asset.kind==='totem'){
   box(0,0,.06,.5,.4,.12,'metal');
   box(0,0,.95,.18,.14,1.7,'metal');
   box(0,0,1.0,.62,.12,1.1,'dark');
   for(const s of [-1,1]){box(0,s*.075,1.0,.5,.012,.9,'dark');box(0,s*.082,1.32,.3,.01,.08,'signal');}
  }
  if(asset.kind==='level'){
   const fl=new THREE.CylinderGeometry(.07,.07,.03,16);fl.translate(p[0],p[2],-p[1]);parts.metal.push(fl);
   box(0,0,.12,.12,.1,.14,'metal');
   rod([p[0],p[1],p[2]+.07],[p[0],p[1],p[2]+.28],.012);
   box(0,0,.32,.1,.09,.12,'body');
   box(0,-.055,.32,.03,.012,.03,'signal');
  }
  const tall=asset.kind==='pdu',w=tall?.075:.19,h=tall?.75:.23,selfContained=asset.kind==='beam';
  // Backplate and independent anchored mounting rail: never a floating sensor.
  // Beam pairs are self-contained ensembles hung from the slab.
  if(!selfContained){
  box(0,.08,0,w+.05,.018,h+.07,'metal');
  rod([p[0],p[1]+.1,ceiling?ceil:.045],[p[0],p[1]+.1,p[2]+h/2],.012);
  if(!ceiling)box(0,.1,.025-p[2],.16,.16,.04,'metal');
  box(0,0,0,w,.105,h,asset.kind==='callpoint'||asset.kind==='sounder'?'signal':'body');
  for(const x of [-w*.38,w*.38])for(const z of [-h*.4,h*.4])box(x,-.058,z,.012,.008,.012,'metal');
  }
  if(ceiling){
   const detector=asset.kind==='ceiling-detector',radius=detector?.075:.14;
   const g=new THREE.CylinderGeometry(radius,radius*.93,.045,24);g.translate(p[0],p[2]-.09,-p[1]-.04);parts.body.push(g);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;box(Math.cos(a)*radius,-.04+Math.sin(a)*radius,-.09,.011,.011,.025,'dark');}
   box(0,-.04,-.116,.028,.014,.004,'signal');
   box(0,-.02,-.135,.03,.03,.03,'metal');
  }else if(asset.kind==='intercom'){
   for(let i=0;i<6;i++)box(0,-.06,.075-i*.018,.12,.007,.007,'dark');
   box(0,-.06,.105,.032,.016,.032,'dark');box(0,-.069,.105,.013,.006,.013,'signal');
   box(0,-.065,-.065,.04,.012,.04,'signal');
  }else if(tall){
   for(let i=0;i<7;i++){box(0,-.059,-.27+i*.085,.049,.012,.046,'dark');for(const x of [-.012,.012])box(x,-.068,-.27+i*.085,.006,.006,.012,'metal');box(.032,-.059,-.27+i*.085,.008,.006,.010,'signal');}
   rod([p[0],p[1],p[2]+.36],[p[0]+.12,p[1]+.05,p[2]+.55],.011);
  }else if(asset.kind==='contact'){
   box(.15,0,0,.038,.06,.14);box(.075,0,0,.018,.062,.15,'metal');box(0,-.06,0,.09,.008,.018,'signal');
  }else if(asset.kind==='callpoint'){
   box(0,-.056,0,.125,.012,.105,'body');box(0,-.066,-.024,.075,.009,.024,'dark');box(.045,-.066,.06,.012,.008,.012,'signal');
  }else if(asset.kind==='sounder'){
   box(0,-.06,.065,.13,.023,.055,'body');for(let i=0;i<5;i++)box(0,-.057,-.075+i*.024,.12,.008,.01,'dark');box(0,-.062,.105,.06,.018,.025,'signal');
  }else if(asset.kind==='fieldbox'){
   // Caja de distribución de campo: concentra puntos cercanos con un troncal único.
   box(0,0,0,.5,.12,.7,'body');
   box(0,-.062,0,.44,.01,.64,'dark');
   for(const z of [-.2,.2])box(-.2,-.066,z,.02,.014,.06,'metal');
   box(.15,-.068,.22,.05,.012,.05,'metal');
   box(-.15,-.068,.22,.04,.01,.04,'signal');
   for(let i=0;i<4;i++)box(-.15+i*.1,-.02,-.36,.05,.1,.03,'dark');
  }else if(asset.kind==='beam'){
   // Ensemble built above; no wall furniture at height.
  }else{
   box(0,-.06,.04,w*.68,.012,.073,'dark');
   // Segmented display and terminal strip.
   for(let i=0;i<4;i++)box(-w*.23+i*w*.15,-.069,.04,.014,.004,.032,'signal');
   for(let i=0;i<6;i++)box(-w*.34+i*w*.135,-.058,-h*.35,.012,.008,.018,'metal');
   for(let i=0;i<5;i++)box(w*.505,.015,-.065+i*.025,.006,.06,.008,'dark');
  }
  if(asset.kind==='radio')for(const x of [-.065,.065])rod([p[0]+x,p[1],p[2]+.10],[p[0]+x,p[1],p[2]+.32],.008,'dark');
  if(asset.kind==='probe'){rod([p[0],p[1],p[2]],[p[0],p[1]+.25,p[2]],.016);box(.07,.02,.22,.06,.05,.05,'metal');}
  if(asset.kind==='gateway')rod([p[0]+.08,p[1],p[2]+.10],[p[0]+.08,p[1],p[2]+.30],.006,'dark');
  if(asset.kind==='meter')for(let i=0;i<3;i++)box(-.04+i*.04,-.069,.075,.028,.004,.014,'signal');
  if(asset.kind==='optical'){for(const dx of [-.04,.04]){box(dx,-.075,-.02,.03,.02,.03,'dark');box(dx,-.085,-.02,.012,.008,.012,'signal');}}
  if(asset.kind==='environment')for(let i=0;i<3;i++)box(0,-.058,-.06+i*.03,.12,.008,.012,'dark');
  // Terminal gland and protected cable run return to a real source in inventory.
  const s=asset.source,routeHeight=(ceiling||asset.kind==='door'||asset.kind==='beam')?ceil:.12,run=[p,[p[0],p[1],routeHeight],[s[0],p[1],routeHeight],[s[0],s[1],routeHeight],s];
  for(let i=1;i<run.length;i++)rod(run[i-1],run[i],.007,'dark');
  if(!selfContained)box(0,0,-h/2-.025,.025,.03,.04,'metal');
  const palette={metal:0x859299,body:0xd7dcda,dark:0x172226,signal:SYSTEM_STYLE[asset.system].color};
  for(const [key,geometries] of Object.entries(parts)){
   if(!geometries.length)continue;const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
   const material=new THREE.MeshStandardMaterial({color:palette[key],metalness:key==='metal'?.7:.1,roughness:.36,emissive:key==='signal'?palette[key]:0,emissiveIntensity:key==='signal'?.12:0});
   const mesh=new THREE.Mesh(geometry,material);mesh.name=`sensor_${asset.id}_${key}`;mesh.userData={system:asset.system,asset,base:material.color.clone(),emission:material.emissive.clone(),baseIntensity:material.emissiveIntensity};mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);meshes.push(mesh);
   if(key==='signal')leds.push(mesh);
  }
 }
 return {root,meshes,update(t,active=true){for(const m of leds)m.material.emissiveIntensity=active?.12+.06*Math.sin(t*.8):.12;},dispose(){for(const m of meshes){m.geometry.dispose();m.material.dispose();}root.removeFromParent();}};
}
