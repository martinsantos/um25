import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../src/assets/cine/isometric');
const C=Math.sqrt(3)/2,S=.8;
const P=([x,y,z])=>[540+(x-y)*C*S,278+((x+y)/2-z)*S];
const n=v=>Math.round(v*1000)/1000;
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const palette={slab:'#686e77',side:'#343941',top:'#939aa4',metal:'#79828e',body:'#20252c',glass:'#788b9b',screen:'#0c1219',edge:'#a5adb8',red:'#DC2626',white:'#d7dce3'};
const scenes=[{id:'building',name:'Edificio preparado desde la obra',floors:3,program:'office'},{id:'clinic',name:'Infraestructura de un centro de salud',floors:1,program:'clinic'},{id:'terminal',name:'Infraestructura de una terminal',floors:1,program:'terminal'},{id:'plant',name:'Infraestructura de una nave productiva',floors:1,program:'plant'},{id:'winery',name:'Una bodega conectada, del tanque a la operación',floors:1,program:'winery'},{id:'mine',name:'Comunicaciones y operación de un sitio minero',floors:1,program:'mine'}];
const all=[];
for(const spec of scenes){
 const boxes=[],cylinders=[],lines=[],circles=[],labels=[],routes=[],pins={};
 const box=(id,x,y,z,w,d,h,material='body',service=null)=>{const item={id,x,y,z,w,d,h,material,service};boxes.push(item);return item;};
 const cylinder=(id,x,y,z,r,h,material='metal',topR=r,axis='z')=>cylinders.push({id,x,y,z,r,h,topR,material,axis});
 const line=(points,color='edge',width=.65,service=null)=>lines.push({points,color,width,service});
 const circle=(at,r,color='edge',service=null)=>circles.push({at,r,color,service});
 const route=(code,input)=>{
  const points=[input[0]];
  for(const target of input.slice(1)){
   const point=[...points.at(-1)];
   // Rise before crossing; cross on the tray plane, then descend to the device.
   const axes=target[2]>point[2]?[2,1,0]:[1,0,2];
   for(const axis of axes)if(point[axis]!==target[axis]){point[axis]=target[axis];points.push([...point]);}
  }
  routes.push({code,points});
 };
 const pin=(code,at)=>pins[code]=at;
 const cabinet=(id,x,y,z)=>{
  box(id,x,y,z,37,31,86,'body');
  box(id+'-top',x,y,z+86,37,31,2,'metal');
  for(let u=0;u<18;u++){
   const yy=z+5+u*4.1;line([[x-17,y+15.8,yy],[x+17,y+15.8,yy]],'edge',.45);
   for(const xx of [-17,17])circle([x+xx,y+15.9,yy],.45,'white');
  }
  for(let unit=0;unit<7;unit++){
   const zz=z+8+unit*9;box(id+'-unit-'+unit,x,y+15.7,zz,30,1.4,6,'metal');
   const count=unit<3?24:4;
   for(let j=0;j<count;j++)box(id+'-port-'+unit+'-'+j,x-13+j*(26/count),y+16.6,zz+2,unit<3?.74:3.1,.35,unit<3?2.2:2.5,'screen');
   circle([x+14,y+16.7,zz+2.6],.6,unit===2?'red':'white');
  }
  // A transparent, hinged door is open sideways; the rack stays recognizable.
  line([[x-20,y+17,z+2],[x-42,y+31,z+2],[x-42,y+31,z+85],[x-20,y+17,z+85],[x-20,y+17,z+2]],'edge',.75);
  line([[x-39,y+29,z+12],[x-39,y+29,z+76]],'side',.6);
 };
 const monitor=(id,x,y,z,service=null)=>{box(id+'-foot',x,y,z,11,8,1.6,'metal',service);box(id+'-stem',x,y,z+2,1.8,2.5,9,'metal',service);box(id+'-body',x,y,z+11,22,2.7,15,'metal',service);box(id+'-screen',x,y+1.5,z+12,20.2,.3,13,'screen',service);line([[x-8,y+1.8,z+23],[x+6,y+1.8,z+23]],'edge',.6,service);line([[x-8,y+1.8,z+19],[x+8,y+1.8,z+19]],'edge',.55,service);};
 const desk=(id,x,y,z)=>{box(id+'-top',x,y,z+26,61,29,2,'metal');for(const xx of [-27,27])for(const yy of [-11,11])box(id+'-leg-'+xx+'-'+yy,x+xx,y+yy,z,2,2,26,'side');monitor(id,x,y+3,z+28,'104');box(id+'-chair',x,y+27,z+11,13,13,3,'body');box(id+'-back',x,y+33,z+14,13,2,14,'metal');line([[x-7,y+19,z+28],[x+8,y+19,z+28]],'white',.6);};
 const camera=(id,x,y,z)=>{box(id+'-bracket',x,y,z-7,2,5,8,'side','102');box(id,x,y+4,z,9,16,7,'metal','102');box(id+'-hood',x,y+5,z+7,11,18,1.5,'body','102');circle([x,y+12.2,z+3.4],2.2,'white','102');circle([x,y+12.4,z+3.4],1.1,'body','102');};
 const detector=(id,x,y,z)=>{circle([x,y,z],4.5,'white','107');circle([x,y,z+.2],3.2,'metal','107');circle([x+.8,y+.8,z+.4],.7,'red','107');};
 const floorNames=['Planta baja','Primer piso','Segundo piso'];
 for(let floor=0;floor<spec.floors;floor++){
  const z=floor*112;
  box('slab-'+floor,300,170,z-9,600,340,9,'slab');
  for(const x of [18,290,582])for(const y of [18,322])box('column-'+floor+'-'+x+'-'+y,x,y,z,8,8,102,'side');
  // Exterior frame and transparent envelope: no repeated facade reveal.
  for(const x of [0,600]){line([[x,0,z],[x,340,z],[x,340,z+94],[x,0,z+94],[x,0,z]],'edge',.65);for(let y=40;y<340;y+=40)line([[x,y,z],[x,y,z+94]],'side',.5);}
  line([[0,0,z+94],[600,0,z+94],[600,340,z+94]],'edge',.65);
  for(let x=40;x<600;x+=40)line([[x,0,z],[x,0,z+94]],'side',.4);
  // Riser and accessible trays remain in one position through every service.
  box('shaft-'+floor,555,224,z,23,26,107,'body');
  for(let rung=0;rung<12;rung++)line([[545,237.3,z+rung*8.8],[565,237.3,z+rung*8.8]],'metal',.65);
  box('tray-'+floor,292,165,z+83,545,8,3,'metal');
  for(let hole=0;hole<50;hole++)line([[32+hole*10.5,169.3,z+84],[36+hole*10.5,169.3,z+84]],'body',.4);
  // Partition doors and swing arcs are readable in the floor plan.
  for(const x of [164,337]){
   box('partition-'+floor+'-'+x,x,64,z,2,118,66,'glass');
   line([[x,4,z+68],[x,123,z+68]],'edge',.6);
   line([[x,125,z],[x+19,125,z],[x+19,125,z+58],[x,125,z+58]],'edge',.6);
  }
  if(spec.program==='office'){
   for(let row=0;row<2;row++)for(let col=0;col<3;col++)desk('desk-'+floor+'-'+row+'-'+col,72+col*177,46+row*68,z);
   box('meeting-'+floor,158,252,z+26,136,53,3,'metal');
   for(const x of [113,158,203])for(const y of [212,292]){box('meeting-seat-'+floor+'-'+x+'-'+y,x,y,z+12,16,16,3,'body');box('meeting-back-'+floor+'-'+x+'-'+y,x,y+(y<250?-7:7),z+15,16,2,14,'metal');}
  }else if(spec.program==='clinic'){
   for(let col=0;col<3;col++){
    const x=68+col*172;for(let row=0;row<2;row++){const y=44+row*74;box('bed-base-'+col+'-'+row,x,y,9,43,64,12,'body');box('bed-mattress-'+col+'-'+row,x,y,21,45,66,6,'white');box('bed-pillow-'+col+'-'+row,x,y-22,27,32,14,3,'metal');line([[x-21,y-32,29],[x-21,y+32,29]],'edge',.65);box('bed-cabinet-'+col+'-'+row,x+31,y,0,15,19,28,'metal');}
   }
   desk('nursing',217,257,0);desk('admission',85,257,0);
  }else if(spec.program==='terminal'){
   for(let station=0;station<5;station++){const x=52+station*91;box('counter-'+station,x,61,0,67,31,29,'metal');monitor('checkin-'+station,x,61,29,'104');box('baggage-'+station,x+33,62,8,15,90,5,'body');for(let roll=0;roll<10;roll++)line([[x+26,23+roll*8,13.5],[x+40,23+roll*8,13.5]],'metal',.6);}
   for(let row=0;row<3;row++)for(let seat=0;seat<5;seat++){const x=60+seat*54,y=218+row*35;box('lounge-seat-'+row+'-'+seat,x,y,13,24,22,2,'metal');box('lounge-back-'+row+'-'+seat,x,y+10,15,24,2,20,'metal');line([[x,y,0],[x,y,13]],'side',.7);}
   box('gate',390,273,0,55,28,34,'body');monitor('gate-display',390,273,36,'104');
  }else if(spec.program==='winery'){
   for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const x=68+col*123,y=51+row*111,id='fermenter-'+row+'-'+col;
    cylinder(id+'-cone',x,y,12,18,16,'metal',28);
    cylinder(id+'-vessel',x,y,28,28,61,'metal');
    cylinder(id+'-roof',x,y,89,28,5,'top',23);
    cylinder(id+'-manway',x,y,94,8,3,'body');
    for(const dx of [-18,18])for(const dy of [-18,18])box(id+'-leg-'+dx+'-'+dy,x+dx,y+dy,0,3,3,28,'side');
    line([[x+25,y+12,8],[x+25,y+12,90]],'edge',1.1);
    for(let step=0;step<12;step++)line([[x+22,y+12,12+step*6],[x+28,y+12,12+step*6]],'body',.6);
    line([[x,y+28,22],[x,y+39,22],[x+7,y+39,22]],'metal',1.5);
    box(id+'-valve',x+7,y+39,19,3,3,6,'red');circle([x,y+28.2,57],3.2,'body');
   }
   desk('oenology-lab',461,55,0);box('lab-analyser',446,97,0,33,22,24,'metal');
   box('bottling-conveyor',242,284,18,322,26,5,'body');
   for(let i=0;i<22;i++){const x=99+i*13;line([[x,272,23.5],[x,296,23.5]],'metal',.6);if(i%2===0){cylinder('bottle-'+i,x,284,24,2.6,11,'body');cylinder('neck-'+i,x,284,35,1.3,4,'metal');}}
   box('bottling-control',398,290,0,29,15,62,'body');monitor('bottling-terminal',398,290,62,'104');
   route('101',[[542,263,49],[542,165,88],[398,165,88],[398,290,67]]);
   route('104',[[540,274,64],[461,274,64],[461,55,40]]);
  }else if(spec.program==='mine'){
   box('site-control-room',264,62,0,228,100,4,'slab');
   for(let i=0;i<3;i++)desk('dispatch-'+i,184+i*65,52,0);
   for(let i=0;i<3;i++){box('communications-module-'+i,62,51+i*93,0,81,67,48,'metal');box('module-roof-'+i,62,51+i*93,48,86,72,3,'top');box('module-door-'+i,62,86+i*93,0,18,1,39,'body');for(let j=0;j<3;j++)box('module-window-'+i+'-'+j,27+j*25,86.5+i*93,22,15,.4,17,'screen');}
   box('equipment-skid',277,249,0,166,106,7,'side');
   for(let i=0;i<3;i++){box('equipment-pump-'+i,226+i*49,247,7,35,55,35,'metal');cylinder('pump-drive-'+i,226+i*49,247,42,11,6,'top');}
   for(const x of [183,371]){box('mast-foot-'+x,x,319,0,16,16,4,'metal','103');box('mast-'+x,x,319,4,3,3,130,'metal','103');for(let h=20;h<125;h+=13)line([[x-9,319,h],[x+9,319,h+13]],'edge',.6,'103');box('radio-unit-'+x,x,319,103,13,6,26,'body','103');cylinder('radio-reflector-'+x,x,322,115,12,3,'metal',12,'y');line([[x,319,128],[x-29,335,1]],'edge',.45,'103');line([[x,319,128],[x+29,335,1]],'edge',.45,'103');}
   route('103',[[553,228,49],[553,304,49],[371,304,49],[371,319,116],[183,319,116],[183,319,29],[62,319,29]]);
   box('weather-base',440,45,0,7,7,76,'metal');line([[421,45,76],[455,45,76]],'edge',1.2);circle([450,45,76],5,'white');
  }else{
   for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const x=73+col*122,y=62+row*102;box('process-'+row+'-'+col,x,y,0,63,68,73,'metal');box('process-top-'+row+'-'+col,x,y,73,63,68,3,'top');for(let seam=0;seam<4;seam++)line([[x-31.7,y-34,14+seam*16],[x-31.7,y+34,14+seam*16]],'edge',.45);circle([x-32,y+10,18],4,'edge');
    box('process-window-'+row+'-'+col,x,y+34.6,41,35,.7,20,'screen');
    for(const dx of [-19,19])box('process-window-frame-'+row+'-'+col+'-'+dx,x+dx,y+35,39,2,1,24,'top');
    box('process-hmi-'+row+'-'+col,x+20,y+35.2,26,12,1.6,9,'body','104');
    box('process-hmi-screen-'+row+'-'+col,x+20,y+36.1,28,9,.3,5,'screen','104');
    circle([x+24,y+36.3,18],1.6,'red');
    box('process-handle-'+row+'-'+col,x-23,y+35.4,26,2,3,17,'metal');
    for(let vent=0;vent<7;vent++)line([[x-16,y+35.1,8+vent*2.4],[x+12,y+35.1,8+vent*2.4]],'body',.6);
    cylinder('process-drive-'+row+'-'+col,x+37,y,0,8,24,'body');
    cylinder('process-drive-top-'+row+'-'+col,x+37,y,24,8,3,'metal');}
   desk('lab',470,62,0);box('electrical-panel',420,275,0,52,18,78,'body');
   for(let block=0;block<3;block++)box('pallet-'+block,88+block*106,280,0,75,59,25,'side');
  }
  // Shared project endpoints; each service is traced independently.
  for(let col=0;col<3;col++){
   const x=74+col*174;
   box('data-outlet-'+floor+'-'+col,x,119,z+16,5,1.7,5,'metal','101');
   box('wifi-'+floor+'-'+col,x,142,z+91,10,10,1.3,'white','101');
   detector('detector-'+floor+'-'+col,x,230,z+94);
   route('101',[[542,263,49],[542,224,z+88],[x,165,z+88],[x,122,z+88],[x,119,z+20]]);
   route('107',[[512,283,38],[532,224,z+93],[x,224,z+93],[x,230,z+94]]);
  }
  camera('camera-'+floor,374,319,z+80);camera('camera-entry-'+floor,20,321,z+80);
  route('102',[[538,269,62],[561,224,z+88],[561,309,z+88],[374,309,z+88],[374,323,z+80]]);
  route('108',[[481,265,29],[566,229,z+82],[292,174,z+82],[292,117,z+18]]);
  if(floor<spec.floors-1)route('103',[[553,228,z+60],[553,228,z+172]]);
  labels.push({at:[-18,325,z+10],text:floorNames[floor]});
 }
 // The technical room is a real part of the building, with an operable rack.
 cabinet('rack',540,278,0);
 box('ups',481,265,0,31,29,44,'body','108');for(let band=0;band<9;band++)line([[466,280.2,8+band*3],[496,280.2,8+band*3]],'metal',.65);box('ups-screen',481,280.6,33,10,.6,7,'screen','108');
 box('fire-panel',512,306,23,25,8,35,'metal','107');box('fire-lcd',512,310.3,45,14,.6,7,'screen','107');for(let led=0;led<5;led++)circle([504+led*3.6,310.5,38],.65,led===1?'red':'white','107');
 box('reader',370,322,0,6,3,13,'body','102');box('reader-screen',370,324,7,4,.4,4,'screen','102');
 desk('operations',397,264,0);route('104',[[540,274,64],[540,255,64],[398,255,28],[398,266,40]]);route('105',[[398,266,40],[466,255,28],[481,265,29],[540,274,64]]);
 route('103',[[553,228,49],[578,228,49],[578,38,49],[628,38,0]]);
 pin('101',[74,119,20]);pin('103',[553,228,49]);pin('102',[374,323,80]);pin('107',[512,306,49]);pin('108',[481,265,40]);pin('104',[397,264,42]);pin('105',[397,264,42]);pin('106',[294,159,83]);
 const faces=[];
 for(const b of boxes){const x=b.x-b.w/2,y=b.y-b.d/2,z=b.z;const vertices=[[x,y,z],[x+b.w,y,z],[x+b.w,y+b.d,z],[x,y+b.d,z],[x,y,z+b.h],[x+b.w,y,z+b.h],[x+b.w,y+b.d,z+b.h],[x,y+b.d,z+b.h]];const base=palette[b.material]||palette.body;
  faces.push({id:b.id,pts:[vertices[3],vertices[2],vertices[6],vertices[7]],color:b.material==='glass'?palette.glass:b.material==='white'?palette.metal:palette.side,alpha:b.material==='glass'?.12:1,service:b.service});
  faces.push({id:b.id,pts:[vertices[1],vertices[2],vertices[6],vertices[5]],color:b.material==='glass'?palette.glass:palette.body,alpha:b.material==='glass'?.1:1,service:b.service});
  faces.push({id:b.id,pts:[vertices[4],vertices[5],vertices[6],vertices[7]],color:base,alpha:b.material==='slab'?.38:b.material==='glass'?.1:1,service:b.service});
 }
 for(const c of cylinders){
  const ring=(r,t)=>Array.from({length:32},(_,i)=>c.axis==='y'?[c.x+r*Math.cos(i*Math.PI/16),c.y+t,c.z+r*Math.sin(i*Math.PI/16)]:[c.x+r*Math.cos(i*Math.PI/16),c.y+r*Math.sin(i*Math.PI/16),c.z+t]);
  const lo=ring(c.r,0),hi=ring(c.topR,c.h);
  for(let i=0;i<32;i++){
   const j=(i+1)%32;
   if(Math.cos((i+.5)*Math.PI/16)+Math.sin((i+.5)*Math.PI/16)>0){
    const light=.48+.35*Math.max(0,Math.cos((i+.5)*Math.PI/16-.6));
    const color='#'+[121,130,142].map(v=>Math.round(v*light).toString(16).padStart(2,'0')).join('');
    faces.push({id:c.id,pts:[lo[i],lo[j],hi[j],hi[i]],color,alpha:1});
   }
  }
  faces.push({id:c.id,pts:hi,color:palette[c.material],alpha:1});
 }
 // Large enclosure faces must not paint over their own smaller front panels.
 // Sort overlapping faces by depth at the overlap, rather than by centroid alone.
 const projected=faces.map(f=>f.pts.map(P));
 const bounds=projected.map(pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))]);
 const depthAt=(f,p)=>{
  const [a,b,c]=f.pts,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
  const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],den=normal.reduce((x,y)=>x+y,0);
  if(Math.abs(den)<1e-7)return null;
  const dx=(p[0]-540)/(C*S),dy=(p[1]-278)/S;
  const base=[dx/2,-dx/2,-dy];
  const t=normal.reduce((sum,n,i)=>sum+n*(a[i]-base[i]),0)/den;
  return 3*t-dy;
 };
 const intersection=(subject,clip)=>{
  let result=subject;
  const area=clip.reduce((sum,p,i)=>sum+p[0]*clip[(i+1)%clip.length][1]-clip[(i+1)%clip.length][0]*p[1],0);
  const sign=area>=0?1:-1;
  for(let k=0;k<clip.length&&result.length;k++){
   const a=clip[k],b=clip[(k+1)%clip.length],side=p=>sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));
   const input=result;result=[];
   for(let i=0;i<input.length;i++){
    const p=input[i],q=input[(i+1)%input.length],sp=side(p),sq=side(q);
    if(sp>=0)result.push(p);
    if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
   }
  }
  return result;
 };
 const edges=faces.map(()=>[]),incoming=new Uint16Array(faces.length);
 for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
  const a=bounds[i],b=bounds[j];if(a[2]<=b[0]+.001||b[2]<=a[0]+.001||a[3]<=b[1]+.001||b[3]<=a[1]+.001)continue;
  const overlap=intersection(projected[i],projected[j]);if(overlap.length<3)continue;
  const overlapArea=Math.abs(overlap.reduce((sum,p,k)=>sum+p[0]*overlap[(k+1)%overlap.length][1]-overlap[(k+1)%overlap.length][0]*p[1],0));
  if(overlapArea<.001)continue;
  const p=overlap.reduce((sum,q)=>[sum[0]+q[0]/overlap.length,sum[1]+q[1]/overlap.length],[0,0]);
  const da=depthAt(faces[i],p),db=depthAt(faces[j],p);if(da===null||db===null||Math.abs(da-db)<.001)continue;
  const [far,near]=da<db?[i,j]:[j,i];edges[far].push(near);incoming[near]++;
 }
 const queue=faces.map((_,i)=>i).filter(i=>!incoming[i]),ordered=[],seen=new Set();
 while(queue.length){const i=queue.shift();ordered.push(faces[i]);seen.add(i);for(const next of edges[i])if(--incoming[next]===0)queue.push(next);}
 console.log(JSON.stringify({scene:spec.id,orderedFaces:ordered.length,totalFaces:faces.length}));
 // Interpenetrating illustrative geometry can form a cycle; keep it deterministic.
 if(ordered.length<faces.length)ordered.push(...faces.filter((_,i)=>!seen.has(i)).sort((a,b)=>a.pts.reduce((sum,p)=>sum+p[0]+p[1]+p[2],0)/a.pts.length-b.pts.reduce((sum,p)=>sum+p[0]+p[1]+p[2],0)/b.pts.length));
 faces.splice(0,faces.length,...ordered);
 const polygon=f=>'<polygon points="'+f.pts.map(p=>P(p).map(n).join(',')).join(' ')+'" fill="'+f.color+'" fill-opacity="'+f.alpha+'" stroke="'+palette.edge+'" stroke-opacity="'+(f.alpha<.5?.4:.65)+'" stroke-width=".45" vector-effect="non-scaling-stroke" stroke-linejoin="round"'+(f.service?' data-project-device="'+f.service+'"':'')+'/>';
 const pathLine=(r,extra='')=>'<path d="M'+r.points.map(p=>P(p).map(n).join(' ')).join('L')+'" fill="none" stroke="'+(palette[r.color]||palette.edge)+'" stroke-width="'+r.width+'" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" '+extra+'/>';
 const circlesSVG=circles.map(c=>{const [x,y]=P(c.at);return '<ellipse cx="'+n(x)+'" cy="'+n(y)+'" rx="'+n(c.r*S)+'" ry="'+n(c.r*S*.58)+'" fill="'+(palette[c.color]||palette.edge)+'"'+(c.service?' data-project-device="'+c.service+'"':'')+'/>';}).join('');
 const routeSVG=Object.entries(routes.reduce((groups,r)=>{(groups[r.code]||=[]).push(r);return groups;},{})).map(([code,rows])=>'<g class="sp-route sp-route--'+code+'" data-project-route="'+code+'">'+rows.map(r=>pathLine({...r,color:'red',width:1.65},'pathLength="100"')).join('')+'</g>').join('');
 const pinSVG=Object.entries(pins).map(([code,at])=>{const [x,y]=P(at);return '<g class="sp-pin sp-pin--'+code+'" data-project-pin="'+code+'" data-x="'+n(x)+'" data-y="'+n(y)+'"><circle cx="'+n(x)+'" cy="'+n(y)+'" r="5.2" fill="'+palette.red+'"/><circle cx="'+n(x)+'" cy="'+n(y)+'" r="9" fill="none" stroke="'+palette.white+'" stroke-opacity=".55" stroke-width=".65" vector-effect="non-scaling-stroke"/></g>';}).join('');
 const labelSVG=labels.map(l=>{const [x,y]=P(l.at);return '<text x="'+n(x-16)+'" y="'+n(y)+'" fill="#aeb5bf" font-family="UM Sans,Arial,sans-serif" font-size="18" text-anchor="end" class="sp-floor-label">'+esc(l.text)+'</text>';}).join('');
 // Operational consequences belong to the installed devices, in the same projection.
 const effect=(code,body,phase='')=>'<g class="sp-effect sp-effect--'+code+(phase?' sp-effect--phase-'+phase:'')+'">'+body+'</g>';
 const surface=(pts,fill,opacity=1)=>'<polygon points="'+pts.map(p=>P(p).map(n).join(',')).join(' ')+'" fill="'+fill+'" fill-opacity="'+opacity+'"/>';
 const display=(x,y,z,w,h,color)=>surface([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],color);
 const effects=[];
 for(let floor=0;floor<spec.floors;floor++){
  const z=floor*112;
  effects.push(effect('102',surface([[374,323,z+80],[306,252,z+1],[438,252,z+1]],palette.red,.09)+pathLine({points:[[374,323,z+80],[306,252,z+1],[438,252,z+1],[374,323,z+80]],color:'red',width:.8}),'1'));
  for(let col=0;col<3;col++){
   const x=74+col*174;
   const at=P([x,230,z+94.4]);
   effects.push(effect('107','<ellipse cx="'+n(at[0])+'" cy="'+n(at[1])+'" rx="7" ry="4" fill="none" stroke="#DC2626" stroke-width="1.4"/>','1'));
   effects.push(effect('101',display(x-1,120,z+18,2,1,palette.white),'2'));
  }
 }
 // Console screen: the picture, task and resolution each have their own visual state.
 for(let row=0;row<2;row++)for(let col=0;col<2;col++)effects.push(effect('102',display(389+col*8,268.9,42+row*5,7,4,row===0?palette.metal:palette.side),'1'));
 for(const code of ['104','105'])for(let phase=0;phase<3;phase++){
  let rows='';
  for(let row=0;row<3;row++)rows+=display(389,268.95,42+row*3.5,15-row*2,1.6,row<=phase?(phase===2?palette.white:palette.red):palette.side);
  effects.push(effect(code,rows,String(phase)));
 }
 effects.push(effect('107',display(506,310.75,46,12,4,palette.red),'1'));
 effects.push(effect('107',display(506,310.75,46,12,4,palette.white),'2'));
 for(let phase=1;phase<=2;phase++){
  let bars='';for(let i=0;i<4;i++)bars+=display(477+i*2,281,34,1.3,4,phase===1?palette.red:palette.white);
  effects.push(effect('108',bars,String(phase)));
 }
 effects.push(effect('106',pathLine({points:[[12,12,.4],[588,12,.4],[588,328,.4],[12,328,.4],[12,12,.4]],color:'red',width:1},'stroke-dasharray="4 5"'),'1'));
 const structure=faces.map(polygon).join('')+lines.map(l=>pathLine(l)).join('')+circlesSVG;

 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" class="sp-scene" role="img" aria-labelledby="sp-'+spec.id+'-title sp-'+spec.id+'-desc"><title id="sp-'+spec.id+'-title">'+esc(spec.name)+'</title><desc id="sp-'+spec.id+'-desc">Un solo proyecto isométrico con espacios, equipos, montante, bandejas y recorridos. La estructura permanece; cada servicio recorre su instalación.</desc><g class="sp-root"><g class="sp-structure">'+structure+'</g>'+routeSVG+effects.join('')+pinSVG+labelSVG+'</g><path class="sp-leader" data-project-leader="" fill="none" stroke="#DC2626" stroke-opacity=".65" stroke-width=".8" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"/></svg>';
 fs.writeFileSync(path.join(out,'site-'+spec.id+'-v1.svg'),svg);
 all.push({...spec,boxes,cylinders,lines,circles,routes,pins,projection:{c:C,s:.5,scale:S,origin:[540,278]},dimensions:{width:600,depth:340,floorHeight:112},svgBytes:Buffer.byteLength(svg),faceCount:faces.length});
}
fs.writeFileSync(path.join(out,'site-projects-v1.json'),JSON.stringify({version:1,description:'Shared generic project geometry for the authored isometric and Blender cinema.',palette,scenes:all}));
console.log(JSON.stringify(all.map(s=>({scene:s.id,boxes:s.boxes.length,faces:s.faceCount,svgBytes:s.svgBytes}))));
