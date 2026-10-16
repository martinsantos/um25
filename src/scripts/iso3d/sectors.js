// Sector scenes for the isometric explainer. Units are metres; y is up.
const chapters=(intro,en,da,se,de,all)=>[
 {k:null,t:intro[0],p:intro[1],d:6.5},{k:'en',t:en[0],p:en[1],d:6},{k:'da',t:da[0],p:da[1],d:6},
 {k:'se',t:se[0],p:se[1],d:6},{k:'de',t:de[0],p:de[1],d:6},{k:'all',t:all[0],p:all[1],d:7}];
const ALL=['Un sistema. Cuatro capas.','Diseñadas, instaladas y mantenidas por un mismo equipo, con mediciones y documentación.'];
const TY=2.62;

// Technical room with rack + UPS, returns feed points for flows.
function techRoom(k,{x,z,w=3.6,d=4.2,D}){
 const {box,M,lamp,tag}=k;
 box(.22,3,d,M.wall,x-w/2,0,z,{edges:true,round:false});
 box(w-1.2,3,.22,M.wall,x-.6,0,z+d/2,{edges:true,round:false});
 box(1.1,2.2,.06,M.dark,x+w/2-.6,0,z+d/2);
 const rk=box(.8,2.1,1,M.rack,x-.6,0,z-.4);for(let u=0;u<14;u++)lamp('da',.62,.05,.02,0,-1.05+.25+u*.12,.51,rk);
 const ups=box(.7,1.2,.9,M.dark,x+.7,0,z-.4);lamp('en',.3,.06,.02,0,-.3,.46,ups);
 lamp('se',.12,.2,.05,x+w/2-1.3,1.1,z+d/2+.06);
 tag([x-.6,2.4,z-.4],'Rack','#3FC7B8',['da','all']);tag([x+.7,1.5,z-.4],'UPS','#E2B04A',['en','all']);
 return {rk:[x-.6,2.1,z-.4],up:[x+.7,1.2,z-.4],door:[x+w/2-1.3,1.2,z+d/2+.06]};
}
// Ceiling services: tray, access points, detectors and cameras along a corridor.
function ceiling(k,{x0,x1,z,aps,dets,cams,feed}){
 const {box,cyl,M,lamp,flow,tag,services,THREE}=k;
 box(x1-x0,.06,.4,M.tray,(x0+x1)/2,TY,z,{parent:services});
 for(let x=x0+.6;x<=x1;x+=3)box(.04,3-TY,.04,M.tray,x,TY,z,{parent:services});
 aps.forEach(([x,zz])=>{cyl(.22,.05,M.white,x,TY+.1,zz,{parent:services});lamp('da',.06,.02,.06,x,TY+.08,zz,services);
  flow('da',[[feed.rk[0],TY+.05,z],[x,TY+.05,z],[x,TY+.05,zz]],.042)});
 dets.forEach(([x,zz])=>{cyl(.13,.09,M.white,x,TY+.08,zz,{parent:services});lamp('de',.05,.02,.05,x,TY+.06,zz,services);
  flow('de',[[feed.rk[0]+.8,TY+.18,feed.rk[2]],[feed.rk[0]+.8,TY+.18,z-.15],[x,TY+.18,z-.15],[x,TY+.18,zz]],.042)});
 cams.forEach(([x,zz])=>{const g=new THREE.Mesh(new THREE.SphereGeometry(.16,20,12,0,Math.PI*2,0,Math.PI/2),M.dark);g.rotation.x=Math.PI;g.position.set(x,TY+.12,zz);services.add(g);
  lamp('se',.05,.02,.05,x,TY+.08,zz,services);flow('se',[[feed.rk[0],TY+.25,feed.rk[2]],[feed.rk[0],TY+.25,z-.25],[x,TY+.25,z-.25],[x,TY+.25,zz]],.042)});
 flow('se',[[feed.rk[0],TY+.25,z-.25],[feed.door[0],TY+.25,z-.25],[feed.door[0],TY+.25,feed.door[2]],feed.door],.042);
 flow('da',[feed.rk,[feed.rk[0],TY+.05,feed.rk[2]],[feed.rk[0],TY+.05,z]]);
 flow('en',[feed.up,[feed.up[0],TY+.12,feed.up[2]],[feed.up[0],TY+.12,z+.15]]);
 if(aps[0])tag([aps[0][0],TY+.6,aps[0][1]],'Wi‑Fi','#3FC7B8',['da']);
 if(dets[0])tag([dets[0][0],TY+.6,dets[0][1]],'Detector','#F07A5A',['de']);
 if(cams[0])tag([cams[0][0],TY+.6,cams[0][1]],'Cámara','#8B7CF6',['se']);
}
const energy=(k,feed,z,targets)=>targets.forEach(([x,y,zz])=>k.flow('en',[[feed.up[0],TY+.12,z+.15],[x,TY+.12,z+.15],[x,TY+.12,zz],[x,y,zz]]));
const data=(k,feed,z,targets)=>targets.forEach(([x,y,zz])=>k.flow('da',[[feed.rk[0],TY+.05,z],[x,TY+.05,z],[x,TY+.05,zz],[x,y,zz]]));
function deskRow(k,x,z,n,{facing=1}={}){const {box,cyl,M,led}=k;
 for(let i=0;i<n;i++){const xx=x+i*1.5;box(1.4,.04,.75,M.white,xx,.74,z);cyl(.03,.72,M.alu,xx-.6,0,z,{seg:10});cyl(.03,.72,M.alu,xx+.6,0,z,{seg:10});
  const m=box(.56,.34,.04,M.dark,xx,.95,z-.22*facing);const s=box(.5,.28,.01,led(0x2b6f8f),0,-.17+.03,.025*facing,{parent:m,shadow:false,round:false});
  box(.5,.06,.5,M.chair,xx,.45,z+.6*facing);box(.5,.45,.05,M.chair,xx,.5,z+.85*facing);cyl(.03,.42,M.dark,xx,0,z+.6*facing,{seg:8})}}

// ---------------------------------------------------------------- Salud
function salud(k){
 const {THREE,M,box,cyl,shell,zone,tag,lamp,world,anim,RoundedBoxGeometry}=k,W=24,D=14,H=3;
 shell({W,D});
 for(let i=0;i<4;i++)zone(-W/2+i*4.6+.05,-W/2+(i+1)*4.6-.05,-D/2+.22,-1.45,0x8fa3ad);
 zone(-W/2+18.4+.1,W/2,-D/2+.22,-1.45,0x5a6470);zone(-W/2+.22,W/2,-1.35,.2,0xc9cfd5);
 const ecg=document.createElement('canvas');ecg.width=256;ecg.height=160;const eg=ecg.getContext('2d');
 const ecgTex=new THREE.CanvasTexture(ecg);ecgTex.colorSpace=THREE.SRGBColorSpace;const screen=new THREE.MeshBasicMaterial({map:ecgTex,toneMapped:false});
 let ex=0;anim.push((t,dt,paused)=>{if(paused)return;ex=(ex+dt*120)%256;eg.fillStyle='#04120f';eg.fillRect(0,0,256,160);
  const beat=x=>{const p=(x%86)/86;return p>.42&&p<.46?-46:p>.46&&p<.5?38:p>.5&&p<.53?-10:p>.7&&p<.8?-8*Math.sin((p-.7)*31):0};
  eg.lineWidth=3;eg.strokeStyle='#3FE0B0';eg.beginPath();for(let x=0;x<256;x+=2){const y=70+beat(x+ex*2.2);x?eg.lineTo(x,y):eg.moveTo(x,y)}eg.stroke();
  eg.fillStyle='#3FE0B0';eg.font='700 30px Arial';eg.fillText('72',18,145);eg.fillStyle='#E2B04A';eg.fillText('98%',150,145);ecgTex.needsUpdate=true});
 const Z0=-D/2,Z1=-1.4,rw=4.6,rooms=[];
 for(let i=0;i<4;i++){const x0=-W/2+i*rw,cx=x0+rw/2;rooms.push(cx);
  if(i>0){box(.06,H-.2,Z1-Z0,M.glass,x0,0,(Z0+Z1)/2,{shadow:false,round:false});box(.1,.08,Z1-Z0,M.alu,x0,H-.28,(Z0+Z1)/2)}
  box(rw-1.4,H-.2,.06,M.glass,x0+(rw-1.4)/2,0,Z1,{shadow:false,round:false});box(rw,.08,.1,M.alu,cx,H-.28,Z1);box(.08,H-.2,.12,M.alu,x0+rw-1.4,0,Z1);
  bed(cx,Z0+2.25,i)}
 function bed(cx,cz,i){const g=new THREE.Group();g.position.set(cx,0,cz);world.add(g);
  box(1.02,.1,2.05,M.alu,0,.3,0,{parent:g});box(.9,.06,1.7,M.dark,0,.24,0,{parent:g});
  for(const[x,z]of[[-.42,-.88],[.42,-.88],[-.42,.88],[.42,.88]]){cyl(.022,.16,M.alu,x,.1,z,{parent:g,seg:12});const w=new THREE.Mesh(new THREE.TorusGeometry(.055,.022,10,20),M.dark);w.position.set(x,.075,z);w.rotation.y=Math.PI/2;g.add(w)}
  const deck=new THREE.Group();deck.position.set(0,.42,-.15);g.add(deck);box(1.0,.06,1.25,M.white,0,0,.45,{parent:deck});
  const back=new THREE.Group();back.position.set(0,.03,-.17);back.rotation.x=.49;deck.add(back);
  box(1.0,.06,.82,M.white,0,-.03,-.41,{parent:back});box(.96,.16,.8,M.sheet,0,.03,-.41,{parent:back});
  const pil=new THREE.Mesh(new RoundedBoxGeometry(.66,.1,.34,4,.05),M.white);pil.position.set(0,.2,-.62);pil.castShadow=true;back.add(pil);
  box(.96,.16,1.22,M.sheet,0,.06,.45,{parent:deck});box(.98,.05,.86,M.mint,0,.22,.62,{parent:deck});
  box(1.08,.62,.06,M.white,0,.32,-1.02,{parent:g});box(1.08,.42,.06,M.white,0,.32,1.03,{parent:g});
  for(const z of[-1.02,1.03]){const t=new THREE.Mesh(new THREE.TorusGeometry(.42,.018,8,32,Math.PI),M.alu);t.position.set(0,z<0?.94:.74,z);g.add(t)}
  for(const sx of[-.53,.53]){for(const y of[.72,.86]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.9,10),M.alu);r.rotation.x=Math.PI/2;r.position.set(sx,y,-.38);g.add(r)}for(const z of[-.8,.05])cyl(.014,.2,M.alu,sx,.68,z,{parent:g,seg:8})}
  box(.08,.05,.6,M.alu,.72,.06,.55,{parent:g});cyl(.02,.82,M.alu,.72,.08,.3,{parent:g,seg:10});box(.38,.03,.6,M.wood,.55,.9,.45,{parent:g});
  box(2.3,.42,.07,M.white,0,1.18,-1.92,{parent:g});box(2.3,.04,.075,M.alu,0,1.6,-1.92,{parent:g});
  [[-.8,0x2d8a4a],[-.62,0xf2f2f2],[-.44,0xffd34d]].forEach(([x,c])=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.04,24),new THREE.MeshStandardMaterial({color:c,roughness:.4}));o.rotation.x=Math.PI/2;o.position.set(x,1.42,-1.87);g.add(o)});
  for(let q=0;q<4;q++)lamp(q<2?'en':'da',.12,.12,.03,-.15+q*.17,1.26,-1.87,g);
  box(.9,.05,.12,M.white,0,1.9,-1.88,{parent:g});
  cyl(.03,.06,M.alu,.85,1.62,-1.86,{parent:g,seg:12});
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.38,10),M.alu);arm.rotation.x=Math.PI/2.6;arm.position.set(.85,1.72,-1.7);g.add(arm);
  const mon=new THREE.Mesh(new RoundedBoxGeometry(.6,.42,.07,3,.025),M.dark);mon.position.set(.85,1.95,-1.5);mon.rotation.x=-.12;mon.castShadow=true;g.add(mon);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.53,.33),screen);scr.position.set(0,.01,.037);mon.add(scr);
  cyl(.016,1.95,M.alu,-.85,.05,.55,{parent:g,seg:10});
  const bag=new THREE.Mesh(new RoundedBoxGeometry(.14,.24,.04,3,.02),new THREE.MeshPhysicalMaterial({color:0xe8f6ff,transparent:true,opacity:.7,roughness:.05}));bag.position.set(-.85,1.78,.55);g.add(bag);
  box(.04,.04,2.4,M.alu,-.7,2.55,-.4,{parent:g});
  const cg=new THREE.PlaneGeometry(1.0,1.8,40,1),pos=cg.attributes.position;for(let q=0;q<pos.count;q++)pos.setZ(q,Math.sin(pos.getX(q)*28)*.035);cg.computeVertexNormals();
  const cur=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xb9d3d9,roughness:.9,side:THREE.DoubleSide}));cur.rotation.y=Math.PI/2;cur.position.set(-.7,1.62,.5);g.add(cur);
  box(.5,.07,.5,M.chair,1.25,.42,.7,{parent:g});box(.5,.48,.06,M.chair,1.25,.49,.95,{parent:g});
  if(i===1)tag([cx+.85,2.25,cz-1.5],'Monitor','#3FC7B8',['da','all',null]);if(i===2)tag([cx,1.0,cz],'Cama 14','#ffffff',[null])}
 const ns=new THREE.Group();ns.position.set(-1.5,0,3.2);world.add(ns);
 box(5.2,1.05,.7,M.counter,0,0,0,{parent:ns});box(5.4,.06,.95,M.wood,0,1.05,-.1,{parent:ns});
 box(.7,1.05,2.2,M.counter,-2.6,0,.95,{parent:ns});box(.7,1.05,2.2,M.counter,2.6,0,.95,{parent:ns});
 for(const x of[-1.4,0,1.4]){box(.7,.44,.05,M.dark,x,1.25,.45,{parent:ns});box(.08,.2,.08,M.alu,x,1.05,.45,{parent:ns});box(.5,.08,.5,M.chair,x,.48,1.2,{parent:ns});cyl(.03,.45,M.dark,x,0,1.2,{parent:ns,seg:8})}
 tag([-1.5,1.9,3.2],'Enfermería','#ffffff',[null,'da']);
 for(let i=0;i<4;i++){box(.55,.08,.55,M.chair,-10.5+i*.7,.45,5.6);box(.55,.5,.07,M.chair,-10.5+i*.7,.5,5.9)}
 cyl(.28,.5,M.white,-6.6,0,5.8);const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),new THREE.MeshStandardMaterial({color:0x5f8f6a,roughness:.9,flatShading:true}));leaf.position.set(-6.6,1.05,5.8);leaf.castShadow=true;world.add(leaf);
 const feed=techRoom(k,{x:(-W/2+18.4+W/2)/2,z:-4.6+.4,D});
 ceiling(k,{x0:-11.4,x1:11,z:-.6,aps:rooms.map(x=>[x,-4.2]),dets:rooms.map(x=>[x-1.2,-3]),cams:[[-11.4,-.9],[0,-.9],[10.6,6.4]],feed});
 data(k,feed,-.6,rooms.map(x=>[x+.85,2.1,-5.6]).concat([[-1.5,1.1,3.2]]));energy(k,feed,-.6,rooms.map(x=>[x-.3,1.45,-6.75]));
 return {chapters:chapters(
  ['Una sala que no puede detenerse.','Cuatro habitaciones, un puesto de enfermería y la sala técnica que las sostiene.'],
  ['Energía estabilizada en cada cabecera.','La UPS alimenta tableros y tomas de cabecera: los monitores no se apagan ante un corte.'],
  ['Cada monitor, en la red clínica.','Desde el rack, la bandeja lleva datos a monitores, enfermería y puntos Wi‑Fi de cada habitación.'],
  ['Accesos y cámaras, sin puntos ciegos.','Control de acceso en la sala técnica y cámaras en circulación, registradas en el mismo sistema.'],
  ['Detección temprana en cada ambiente.','Detectores conectados a la central: una alarma se ubica por habitación, no por piso.'],ALL)};
}

// ---------------------------------------------------------------- Constructoras (office floor)
function constructoras(k){
 const {THREE,M,box,cyl,shell,zone,tag,world}=k,W=24,D=14;
 shell({W,D});zone(-W/2+.22,W/2,-D/2+.22,D/2,0xa7b2bb);
 for(const x of[-6,0,6])for(const z of[-3.5,3])box(.5,3,.5,M.concrete,x,0,z,{edges:true});
 for(const [x,z] of [[-9,-4.6],[-9,-1.6],[-3,-4.6],[-3,-1.6],[-9,2.2],[-3,2.2]]){deskRow(k,x-1.5,z,3);deskRow(k,x-1.5,z+1.5,3,{facing:-1})}
 // meeting room
 const mx=4.2,mz=-4.4;box(4,2.8,.06,M.glass,mx,0,mz+2,{shadow:false,round:false});box(.06,2.8,4,M.glass,mx-2,0,mz,{shadow:false,round:false});
 box(2.6,.05,1.2,M.wood,mx,.74,mz);for(const x of[-.9,.9])cyl(.05,.72,M.alu,mx+x,0,mz,{seg:12});
 for(let i=0;i<3;i++)for(const s of[-1,1]){box(.48,.06,.48,M.chair,mx-.9+i*.9,.45,mz+s*.95);box(.48,.42,.05,M.chair,mx-.9+i*.9,.5,mz+s*1.18)}
 box(1.6,.9,.05,M.dark,mx,1.1,mz-1.95);tag([mx,1.9,mz-1.9],'Sala de reuniones','#ffffff',[null]);
 // floor boxes
 const fb=[];for(const x of[-10.5,-7.5,-4.5,-1.5])for(const z of[-3.85,2.95]){box(.3,.03,.3,M.alu,x,0,z,{round:false});fb.push([x,.05,z])}
 tag([-7.5,.5,2.95],'Caja de piso','#E2B04A',['en']);tag([-4.5,1.3,-4.6],'Puesto','#ffffff',[null,'da']);
 for(const [x,z] of [[9,4.5],[-10.5,6]]){cyl(.28,.5,M.white,x,0,z);const l=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),new THREE.MeshStandardMaterial({color:0x5f8f6a,roughness:.9,flatShading:true}));l.position.set(x,1.05,z);l.castShadow=true;world.add(l)}
 const feed=techRoom(k,{x:9.8,z:-4.2,D});
 ceiling(k,{x0:-11.4,x1:11,z:-.15,aps:[[-9,-3],[-3,-3],[-9,3],[-3,3],[4.2,-4.4]],dets:[[-7.5,-4.5],[-1.5,-4.5],[-7.5,4.5],[3,-3]],cams:[[-11.2,-.4],[1.2,-.4],[10.6,5.8]],feed});
 data(k,feed,-.15,[[-9,.9,-4.6],[-3,.9,-4.6],[-9,.9,2.2],[-3,.9,2.2],[mx,1.1,mz-1.95]]);
 energy(k,feed,-.15,fb.map(([x,,z])=>[x,.05,z]));
 return {chapters:chapters(
  ['Una planta lista para trabajar desde el primer día.','Puestos, sala de reuniones y el núcleo técnico que conecta todo el piso.'],
  ['Energía ordenada bajo el piso.','Cajas de piso con tomas estabilizadas: cada puesto se conecta sin cables a la vista.'],
  ['Cada puesto, cada sala, en la red.','Cableado estructurado certificado y Wi‑Fi diseñado por densidad de usuarios.'],
  ['Accesos y cámaras del piso.','Control de acceso al núcleo técnico y cámaras en circulaciones, en un único registro.'],
  ['Detección por sector.','Detectores direccionables: una alarma indica el puesto, no sólo el piso.'],ALL)};
}

// ---------------------------------------------------------------- Aeropuertos (terminal)
function aeropuertos(k){
 const {THREE,M,box,cyl,shell,zone,tag,anim,world,led}=k,W=24,D=14;
 shell({W,D,H:3.4});zone(-W/2+.22,W/2,-D/2+.22,-1.6,0xb9c2ca);zone(-W/2+.22,W/2,-1.6,D/2,0xd3d8dd);
 // check-in island with counters, screens and belt
 for(let i=0;i<6;i++){const x=-9.5+i*2.2;box(1.6,1.05,.7,M.counter,x,0,-3.6);box(1.7,.05,.8,M.wood,x,1.05,-3.6);
  const s=box(.9,.5,.05,M.dark,x,1.9,-4.1);box(.8,.38,.01,led(0x1d5fa8),0,-.25+.06,.03,{parent:s,shadow:false,round:false});cyl(.03,.85,M.alu,x,1.1,-4.1,{seg:10});
  box(.9,.3,.6,M.dark,x+.9,0,-3.0);box(.36,.02,.36,M.alu,x+.9,.3,-3.0)}
 box(13.6,.35,.7,M.dark,-4,0,-5.2);const belt=box(13.6,.04,.6,M.steel,-4,.35,-5.2);
 const bags=[];for(let i=0;i<7;i++){const b=box(.5,.3,.35,new THREE.MeshStandardMaterial({color:[0x2d4a6b,0x7a3b3b,0x3d5c46,0x5c5c66][i%4],roughness:.6}),-10+i*2,.39,-5.2);bags.push(b)}
 anim.push((t,dt,paused)=>{if(paused)return;for(const b of bags){b.position.x+=dt*.6;if(b.position.x>2.6)b.position.x=-10.6}});
 tag([-5.1,2.4,-4.1],'Check‑in','#ffffff',[null]);tag([1.5,.9,-5.2],'Equipaje','#ffffff',[null,'da']);
 // security lanes with gates
 for(let i=0;i<3;i++){const x=-6+i*2.6;box(.25,1,1.4,M.white,x-.7,0,2.6);box(.25,1,1.4,M.white,x+.7,0,2.6);
  const gate=box(1.15,.05,.05,M.glassDark,x,.8,2.6);k.lamp('se',.1,.1,.02,x-.7,1.05,2.0)}
 tag([-3.4,1.4,2.6],'Control de acceso','#8B7CF6',['se']);
 // seating rows
 for(let r=0;r<2;r++)for(let i=0;i<8;i++){const x=1+i*.6,z=4.6+r*1.4;box(.52,.06,.5,M.chair,x,.45,z);box(.52,.45,.05,M.chair,x,.5,z+.25)}
 // FIDS wall
 const f=box(3.2,1,.08,M.dark,6.8,1.6,-6.7);box(3,.8,.01,led(0x10304f),0,-.4+.1,.05,{parent:f,shadow:false,round:false});tag([6.8,2.8,-6.6],'Pantallas FIDS','#3FC7B8',['da']);
 const feed=techRoom(k,{x:9.8,z:-4.4,D});
 ceiling(k,{x0:-11.4,x1:11,z:-.9,aps:[[-8,-2.2],[-3,-2.2],[2,-2.2],[3,4.8]],dets:[[-9,1],[-4,1],[1,1],[5,5]],cams:[[-11,-1.2],[-3.4,1.2],[2.4,1.2],[10.6,5.8]],feed});
 data(k,feed,-.9,[[-9.5,1.9,-4.1],[-5.1,1.9,-4.1],[-0.7,1.9,-4.1],[6.8,1.6,-6.7]]);energy(k,feed,-.9,[[-4,.35,-5.2],[-9.5,1.05,-3.6],[-0.7,1.05,-3.6]]);
 return {chapters:chapters(
  ['Una terminal que opera en tiempo real.','Check‑in, equipaje, controles de acceso y la sala técnica que los coordina.'],
  ['Energía continua para mostradores y cintas.','Circuitos estabilizados para puestos, cintas de equipaje y pantallas.'],
  ['Cada mostrador y cada pantalla, en línea.','Red para check‑in, información de vuelos y Wi‑Fi de alta densidad en la sala.'],
  ['Accesos controlados y video.','Molinetes y cámaras integrados: cada paso queda registrado.'],
  ['Detección en todo el hall.','Detectores conectados por zona: la evacuación se activa donde corresponde.'],ALL),frame:{w:24,d:14,look:-1}};
}

// ---------------------------------------------------------------- Industria (plant)
function industria(k){
 const {THREE,M,box,cyl,rod,shell,zone,tag,anim,world}=k,W=26,D=15;
 shell({W,D,H:4,windows:false});zone(-W/2+.22,W/2,-D/2+.22,D/2,0x9ba4ad);
 for(const x of[-11.2,-6.6,-2.2,2.2,6.6])box(.1,.012,D-1.2,k.M.yellow,x,0.006,0,{round:false,shadow:false});
 // production cells: machine + guard + operator panel
 const cells=[];for(let r=0;r<2;r++)for(let i=0;i<4;i++){const x=-9+i*4.4,z=r?2.6:-3.6;cells.push([x,z]);
  const mc=box(2,1.6,1.6,M.white,x,0,z);box(1.2,.5,.9,M.dark,x,1.6,z-.1);box(.6,.4,.02,k.led(0x38d39f),0,.0,.81,{parent:mc,shadow:false,round:false});
  for(const [gx,gz] of [[-1.4,-1.2],[1.4,-1.2],[-1.4,1.2],[1.4,1.2]])box(.06,1.8,.06,M.yellow,x+gx,0,z+gz,{round:false});
  for(const y of[.6,1.2,1.8]){box(2.8,.03,.03,M.yellow,x,y,z-1.2,{round:false});box(.03,.03,2.4,M.yellow,x-1.4,y,z,{round:false})}
  box(.4,.6,.2,M.dark,x+1.2,1,z+1.35)}
 // conveyor between rows
 box(18,.6,.8,M.dark,-2.4,0,-.5);const belt=box(18,.04,.7,M.steel,-2.4,.6,-.5);const parts=[];
 for(let i=0;i<9;i++)parts.push(box(.4,.25,.4,M.alu,-11+i*2,.64,-.5));
 anim.push((t,dt,paused)=>{if(paused)return;for(const p of parts){p.position.x+=dt*.7;if(p.position.x>6.4)p.position.x=-11.2}});
 // overhead crane beam
 box(.3,.4,D-1,M.yellow,-11.6,3.5,0,{round:false});box(.3,.4,D-1,M.yellow,8,3.5,0,{round:false});box(19.6,.35,.3,M.yellow,-1.8,3.55,1.5,{round:false});
 // electrical board
 const tb=box(1.8,2,.5,M.white,-11.6,0,-6.4);k.lamp('en',.6,.08,.02,0,.3,.26,tb);tag([-11.6,2.3,-6.4],'Tablero','#E2B04A',['en','all']);
 tag([-9,2.6,-3.6],'Celda 1','#ffffff',[null]);tag([4.2,1.2,-.5],'Línea','#ffffff',[null]);tag([4.2,1.5,2.6],'PLC','#3FC7B8',['da']);
 const feed=techRoom(k,{x:10.9,z:-5,D});
 ceiling(k,{x0:-12.4,x1:12,z:-1.6,aps:[[-6.8,-1.6],[2,-1.6],[2,4.6]],dets:cells.map(([x,z])=>[x,z+(z<0?1:-1)]),cams:[[-12,-1.9],[0,-1.9],[11.6,6.6]],feed});
 data(k,feed,-1.6,cells.map(([x,z])=>[x+1.2,1.3,z+1.35]));energy(k,feed,-1.6,cells.map(([x,z])=>[x,1.6,z]).concat([[-2.4,.6,-.5]]));
 return {chapters:chapters(
  ['Una planta que no se detiene.','Celdas productivas, línea de transporte, tablero y sala técnica conectados.'],
  ['Energía protegida para cada celda.','Tableros y protecciones dimensionados: un corte en una celda no detiene la línea.'],
  ['Cada máquina, en la red de planta.','PLC y paneles de operador conectados al rack, con datos de producción en tiempo real.'],
  ['Accesos y video en la nave.','Control de acceso a la sala técnica y cámaras sobre la línea y los pasillos.'],
  ['Detección sobre cada celda.','Detectores por sector de la nave, vinculados a la central y a la parada segura.'],ALL),frame:{w:26,d:15,look:-1}};
}

// ---------------------------------------------------------------- Bodegas (winery)
function bodegas(k){
 const {THREE,M,box,cyl,rod,shell,zone,tag,anim,world}=k,W=26,D=15;
 shell({W,D,H:4.2,windows:false});zone(-W/2+.22,W/2,-D/2+.22,D/2,0xa49a8e);
 const tanks=[];for(let r=0;r<2;r++)for(let i=0;i<5;i++){const x=-10.2+i*2.6,z=r?-1.2:-4.6;tanks.push([x,z]);
  cyl(.95,3,M.steel,x,.35,z,{seg:48});cyl(.95,.45,M.steel,x,3.35,z,{seg:48,r2:.25});
  for(const a of[0,2.1,4.2])cyl(.05,.35,M.alu,x+Math.cos(a)*.8,0,z+Math.sin(a)*.8,{seg:8});
  const p=box(.22,.32,.06,M.dark,x+.6,1.5,z+.75);k.lamp('de',.08,.05,.02,0,.05,.04,p);
  cyl(.06,.2,M.dark,x,.7,z+.95,{seg:12})}
 // catwalk
 box(13,.06,1,M.alu,-5,3.1,-2.9,{round:false});for(let x=-11;x<=1;x+=2)box(.06,3.1,.06,M.alu,x,0,-2.4,{round:false});
 box(13,.04,.04,M.alu,-5,4.1,-2.4,{round:false});
 // bottling line
 box(9,.9,.7,M.white,5.2,0,3.2);box(9,.04,.6,M.steel,5.2,.9,3.2);const bottles=[];
 for(let i=0;i<14;i++){const b=cyl(.07,.32,new THREE.MeshPhysicalMaterial({color:0x2a3a25,roughness:.1,metalness:.1,transparent:true,opacity:.9}),1+i*.6,.94,3.2,{seg:12});bottles.push(b)}
 anim.push((t,dt,paused)=>{if(paused)return;for(const b of bottles){b.position.x+=dt*.5;if(b.position.x>9.5)b.position.x=.9}});
 box(1.4,1.8,1.2,M.white,2.2,0,4.6);box(1.4,1.8,1.2,M.white,7.6,0,4.6);tag([5.2,1.5,3.2],'Fraccionamiento','#ffffff',[null]);
 for(let i=0;i<6;i++)for(let j=0;j<2;j++)box(1.1,1,1.1,M.wood,-10+i*1.3,0,4.4+j*1.3);
 tag([-7.6,4.2,-4.6],'Tanque 4','#ffffff',[null]);tag([-4.4,2.1,-.45],'Sensor','#F07A5A',['de']);
 const feed=techRoom(k,{x:10.9,z:-5,D});
 ceiling(k,{x0:-12.4,x1:12,z:.6,aps:[[-7,2.6],[3,1.6]],dets:[[-9,3.4],[-3,3.4],[6,1.4]],cams:[[-12,.3],[0,.3],[11.6,6.6]],feed});
 data(k,feed,.6,tanks.map(([x,z])=>[x+.6,1.8,z+.75]).concat([[5.2,.9,3.2]]));energy(k,feed,.6,[[5.2,.9,3.2],[2.2,1.8,4.6],[7.6,1.8,4.6]].concat(tanks.slice(5).map(([x,z])=>[x,.9,z+.95])));
 return {chapters:chapters(
  ['Una bodega medida tanque por tanque.','Tanques, pasarela, línea de fraccionamiento y la sala técnica que los supervisa.'],
  ['Energía para frío y fraccionamiento.','Circuitos protegidos para el control de temperatura y la línea de envasado.'],
  ['Cada tanque, en línea.','Sensores de temperatura y nivel conectados: la enología ve cada tanque en tiempo real.'],
  ['Accesos y video en la nave.','Control de acceso a depósito y sala técnica, con cámaras en la línea y los pasillos.'],
  ['Alertas antes de un desvío.','Sensores por tanque y detección en la nave: un desvío se ve antes de ser un problema.'],ALL),frame:{w:26,d:15,look:-1}};
}

// ---------------------------------------------------------------- Minería (field camp)
function mineria(k){
 const {THREE,M,box,cyl,rod,shell,zone,tag,anim,world,flow,lamp,services}=k,W=28,D=16;
 shell({W,D,walls:false,slab:M.earth,floor:new THREE.MeshStandardMaterial({color:0xb59e80,roughness:1})});
 zone(-W/2,W/2,-1.2,1.2,0x8e7a63);
 // camp modules
 const mods=[];for(let i=0;i<4;i++){const x=-11+i*3.6,z=-4.8;mods.push([x,z]);box(3.2,2.6,2.4,M.white,x,.25,z,{edges:true});
  for(let b=0;b<2;b++)cyl(.12,.25,M.concrete,x+(b?1.2:-1.2),0,z,{seg:10});box(.9,.6,.04,M.glassDark,x-.6,1.2,z+1.22);box(.8,1.9,.04,M.dark,x+.9,.25,z+1.22)}
 tag([-11,3.3,-4.8],'Módulo','#ffffff',[null]);
 // generator + fuel
 const gen=box(2.4,1.6,1.2,M.yellow,6,0,-5.4);lamp('en',.4,.08,.02,0,.2,.61,gen);cyl(.7,2,M.white,9,0,-5.4,{seg:32}).rotation.z=Math.PI/2;
 tag([6,2,-5.4],'Generación','#E2B04A',['en','all']);
 // lattice masts with link antennas
 function mast(x,z,h){for(const [a,b] of [[-.3,-.3],[.3,-.3],[0,.3]])rod([x+a,0,z+b],[x+a*.3,h,z+b*.3],.035,M.alu);
  for(let y=.6;y<h;y+=.8){rod([x-.3+.3*(y/h)*.7,y,z-.3],[x+.3-.3*(y/h)*.7,y,z-.3],.015,M.alu)}
  const d=cyl(.35,.18,M.white,x,h-.6,z+.1,{seg:24});d.rotation.x=Math.PI/2;lamp('da',.1,.1,.1,x,h+.1,z,world);return [x,h-.6,z]}
 const m1=mast(11,3.6,6.5),m2=mast(-12,4.2,5.5);
 tag([11,7.2,3.6],'Enlace de radio','#3FC7B8',['da','all']);
 // line of sight beam between masts
 flow('da',[m1,[0,m1[1]+.5,3.9],m2],.05);
 // shelter with rack at mast base
 const sh=box(2.2,2.3,1.8,M.white,8,0,4.8,{edges:true});const rk=box(.6,1.6,.6,M.rack,7.4,0,4.6);for(let u=0;u<9;u++)lamp('da',.45,.04,.02,0,-.8+.2+u*.14,.31,rk);
 // perimeter fence and gate
 for(let x=-13.5;x<=13.5;x+=1.5){box(.05,1.6,.05,M.alu,x,0,7.6,{round:false})}box(27,.03,.03,M.alu,0,1.5,7.6,{round:false});box(27,.03,.03,M.alu,0,.8,7.6,{round:false});
 lamp('se',.12,.2,.05,-.8,1.2,7.5);tag([-.8,1.8,7.5],'Acceso','#8B7CF6',['se']);
 // light vehicles
 for(const [x,c] of [[-4,0xf2f2f2],[-1.6,0xe8b923]]){box(1.8,.7,3.4,new THREE.MeshStandardMaterial({color:c,roughness:.4,metalness:.3}),x,.35,2.6);box(1.6,.6,1.6,M.glassDark,x,1.05,2.2);for(const [wx,wz] of[[-.8,1.2],[.8,1.2],[-.8,-1.2],[.8,-1.2]]){const w=cyl(.33,.25,M.dark,x+wx,.33,2.6+wz,{seg:20});w.rotation.z=Math.PI/2;w.position.y=.33}}
 // ground-level trench for fibre/energy
 const fd={rk:[7.4,1.6,4.6],up:[6,1.6,-5.4]};
 mods.forEach(([x,z])=>{flow('da',[fd.rk,[7.4,.08,4.6],[7.4,.08,-1],[x,.08,-1],[x,.08,z+1.2],[x,1.6,z+1.2]]);flow('en',[fd.up,[6,.14,-5.4],[6,.14,-1.4],[x+.4,.14,-1.4],[x+.4,.14,z+1.2],[x+.4,1,z+1.2]]);
  cyl(.12,.08,M.white,x,2.85,z,{seg:16});lamp('de',.05,.02,.05,x,2.92,z,world);flow('de',[fd.rk,[7.4,.2,4.6],[7.4,.2,-.8],[x-.4,.2,-.8],[x-.4,.2,z],[x-.4,2.85,z]],.042)});
 for(const [x,z] of [[-12,6.4],[12.4,-1.8]]){cyl(.05,4,M.alu,x,0,z,{seg:8});const c=new THREE.Mesh(new THREE.SphereGeometry(.2,16,10,0,Math.PI*2,0,Math.PI/2),M.dark);c.rotation.x=Math.PI;c.position.set(x,4,z);world.add(c);lamp('se',.06,.04,.06,x,3.95,z,world);flow('se',[fd.rk,[7.4,.26,4.6],[7.4,.26,z],[x,.26,z],[x,4,z]],.042)}
 flow('se',[fd.rk,[7.4,.26,6.8],[-.8,.26,6.8],[-.8,1.2,7.5]],.042);flow('en',[fd.up,[6,.14,4.6],[8,.14,4.6],[8,1.2,4.6]]);
 return {chapters:chapters(
  ['Un campamento conectado en medio del cerro.','Módulos, generación, enlaces de radio y acceso, operados como un único sistema.'],
  ['Energía generada en sitio.','Generación y tableros distribuyen energía a módulos y al shelter de comunicaciones.'],
  ['Enlaces con línea de vista.','Radioenlaces entre mástiles y fibra en zanja llevan datos a cada módulo.'],
  ['Perímetro controlado.','Acceso vehicular y cámaras en mástiles cubren el perímetro del campamento.'],
  ['Detección en cada módulo.','Detectores en módulos y shelter, monitoreados a distancia.'],ALL),frame:{w:28,d:16,look:0}};
}

export const SECTORS={salud,constructoras,aeropuertos,industria,bodegas,mineria};
