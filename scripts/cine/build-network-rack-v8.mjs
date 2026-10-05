import fs from 'node:fs';
import path from 'node:path';

// One orthographic model library. Cabinet and isolated views reference the same
// equipment, rather than independently drawn approximations of each device.
const root=process.argv[2];
if(!root)throw new Error('Pass the repository root.');
const C=Math.sqrt(3)/2,n=v=>Math.round(v*100)/100;
const P=(x,y,z)=>[n((x-y)*C),n((x+y)/2-z)];
const pts=a=>a.map(p=>P(...p).join(',')).join(' ');
const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const face=(a,f='#121212',st='#888',w=.65,extra='')=>`<polygon points="${pts(a)}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`;
const line=(a,st='#777',w=.6,extra='')=>`<polyline points="${pts(a)}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const box=(x,y,z,w,d,h,top='#202020',front='#101010',side='#161616')=>{
 const a=x-w/2,b=x+w/2,c=y-d/2,e=y+d/2;
 return face([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],front)+face([[b,c,z],[b,e,z],[b,e,z+h],[b,c,z+h]],side)+face([[a,c,z+h],[b,c,z+h],[b,e,z+h],[a,e,z+h]],top);
};
function plane(axis,x,y,z,content){const [a,b]=P(x,y,z);const m=axis==='front'?[C,.5,0,1]:axis==='side'?[-C,.5,0,1]:[C,.5,-C,.5];return `<g transform="matrix(${m.map(n).join(' ')} ${a} ${b})">${content}</g>`;}
const front=(x,y,z,s)=>plane('front',x,y,z,s),top=(x,y,z,s)=>plane('top',x,y,z,s),side=(x,y,z,s)=>plane('side',x,y,z,s);
const rect=(x,y,w,h,f='#0a0a0a',s='#777',r=0,sw=.6)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
const circle=(x,y,r,f='#111',s='#999',sw=.5)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
const text=(x,y,s,size=6,color='#bdbdbd')=>`<text x="${n(x)}" y="${n(y)}" fill="${color}" font-size="${size}" font-family="Arial,sans-serif">${esc(s)}</text>`;
const screw=(r=2.1)=>circle(0,0,r,'#171717','#aaa')+`<path d="M${-r*.5} 0h${r}M0 ${-r*.5}v${r}" fill="none" stroke="#ccc" stroke-width=".55"/>`;
function fan(x,y,z,r=22){return top(x,y,z,circle(0,0,r,'#0b0b0b','#999')+circle(0,0,r*.74,'none','#555')+Array.from({length:7},(_,i)=>`<path transform="rotate(${i*360/7})" d="M3-3Q${r*.55}-${r*.96} ${r*.83}-${r*.28}Q${r*.37}-${r*.2} 3 3Z" fill="#393939" stroke="#888" stroke-width=".45"/>`).join('')+circle(0,0,r*.18,'#151515','#aaa'));}
function shell(w,d,h){let s=box(0,0,0,w,d,2,'#161616','#121212');s+=face([[-w/2,-d/2,2],[w/2,-d/2,2],[w/2,-d/2,h],[-w/2,-d/2,h]],'#101010','#555');s+=face([[w/2,-d/2,2],[w/2,d/2,2],[w/2,d/2,h],[w/2,-d/2,h]],'#171717','#999');for(let i=0;i<16;i++)s+=side(w/2+.1,-d/2+18+i*(d-36)/16,h/2,rect(-1,-h*.27,2,h*.54,'#070707','#666',1,.35));return s;}
function lid(w,d,h){let s=box(0,0,h-2,w,d,2,'#1b1b1b','#151515');s+=top(0,0,h+.1,rect(-w/2+8,-d/2+8,w-16,d-16,'none','#444',2,.45));for(const x of [-w/2+10,w/2-10])for(const y of [-d/2+12,d/2-12])s+=top(x,y,h+.2,screw());for(let i=0;i<18;i++)s+=top(-100+i*11,-d*.23,h+.3,rect(-2,-20,4,40,'#0c0c0c','#555',1.8,.4));return s;}
function ears(h=44.45,y=120){let s='';for(const x of [-233,233])s+=front(x,y+2,h/2,rect(-10,-h/2+1,20,h-2,'#151515','#a3a3a3',1)+rect(-2.6,-h/2+6.35-3.5,5.2,7,'#070707','#777',2.5)+rect(-2.6,h/2-6.35-3.5,5.2,7,'#070707','#777',2.5));return s;}
function rackFront(h,detail,d=240,mount=true){const y=d/2;return face([[-222.5,y,0],[222.5,y,0],[222.5,y,h],[-222.5,y,h]],'#121212','#aaa',.8)+front(0,y+.2,h/2,detail)+(mount?ears(h,y):'');}
function electronics(w,d){let s=box(-25,-8,3,w-35,d-22,2,'#181818','#0e0e0e');for(let i=0;i<12;i++){const x=-w/2+27+i*(w-60)/12;s+=line([[x,d/2-18,5.3],[x,d/2-44,5.3],[x+7,d/2-51,5.3],[x+7,-d*.15,5.3]],'#626262',.7);s+=top(x+7,-d*.15,5.5,circle(0,0,1.1,'#aaa','#777'));}for(let i=0;i<3;i++){s+=box(-110+i*58,-20,5,39,40,6,'#111');for(let j=0;j<9;j++)s+=box(-126+i*58+j*4,-20,11,1.1,34,12,'#555','#252525');}s+=box(139,-d*.19,5,100,d*.37,24,'#2b2b2b');for(let i=0;i<7;i++)s+=top(103+i*12,-d*.19,29.2,rect(-1.2,-d*.13,2.4,d*.26,'#0a0a0a','#777',1,.35));return s;}
function innerGroup(source,match){const at=source.indexOf(match);const start=source.lastIndexOf('<g',at);let level=0;const tags=/<\/?g\b[^>]*>/g;tags.lastIndex=start;let m;while((m=tags.exec(source))){level+=m[0].startsWith('</')?-1:1;if(level===0)return {start,end:tags.lastIndex,inner:source.slice(source.indexOf('>',start)+1,m.index),full:source.slice(start,tags.lastIndex)};}throw new Error('Missing group '+match);}
function body(source){return source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g,'');}
const previous=fs.readFileSync(path.join(root,'src/assets/cine/isometric/network-object.svg'),'utf8');
const jackGroup=innerGroup(previous,'data-port="1"');
const jack=jackGroup.inner;
const reuseJacks=s=>s.replace(/(<g data-port="\d+">)([\s\S]*?)(<\/g>)/g,(m,a,b,c)=>a+'<use href="#rk-jack"/>'+(a.includes('data-port="6"')?'<path d="M-8.4-7.6H8.4V7.6H-8.4Z" fill="none" stroke="#dc2626" stroke-width=".8"/>':'')+c);
let switchBody=body(previous);const switchCover=innerGroup(switchBody,'class="iso-lid"');switchBody=switchBody.replace(switchCover.full,'');const switchGuides=innerGroup(switchBody,'class="iso-guides"');switchBody=switchBody.replace(switchGuides.full,'');
const normalized=s=>`<g transform="scale(.76923) translate(-500 -410)">${reuseJacks(s)}</g>`;
const previousDetail=body(fs.readFileSync(path.join(root,'src/assets/cine/isometric/network-detail.svg'),'utf8')).replace(/<path d="M[^"]*l-63-36H96"[\s\S]*$/,'');
const jackDetail=`<g transform="translate(-545 -270)">${previousDetail.replace(jack,'<use href="#rk-jack"/>')}</g>`;
const iec=rect(-12,-9,24,18,'#0b0b0b','#aaa',1)+`<path d="M-8-6H8L10-3V6H-10V-3Z" fill="#050505" stroke="#777" stroke-width=".6"/>`+rect(-1.2,-4,2.4,3.4,'#aaa','#555',.2)+rect(-5.5,1,2.4,3.4,'#aaa','#555',.2)+rect(3.1,1,2.4,3.4,'#aaa','#555',.2);
const lc=rect(-7.5,-5.5,15,11,'#1b1b1b','#aaa',.6)+rect(-5.3,-3.5,4.5,7,'#070707','#777',.4)+rect(.8,-3.5,4.5,7,'#070707','#777',.4)+`<path d="M-5-6v-2h10v2M-1-4v8" fill="none" stroke="#ccc" stroke-width=".6"/>`;
const models=[];
function add(id,label,base,cover,detail,z,scale,lift,detailScale=1){models.push({id,label,base,cover,detail,z,scale,lift,detailScale});}
add('switch','Switch',normalized(switchBody),normalized(switchCover.inner),jackDetail,580.4,.98,[52,-175],.78);

// Patch panel: one row of 24 individual jacks, rear IDC terminals and lacing bar.
let panel=shell(445,95,44.45),panelFace='';
for(let i=0;i<24;i++){const x=-197.8+i*17.2;panelFace+=`<g transform="translate(${n(x)} 1)" data-patch-port="${i+1}"><use href="#rk-jack"/></g>`+text(x-3,-10,String(i+1).padStart(2,'0'),3.4);}
panel+=rackFront(44.45,panelFace,95);
for(let i=0;i<24;i++){const x=-197.8+i*17.2;panel+=box(x,-12,4,13,27,20,'#393939');for(let k=0;k<8;k++)panel+=top(x-5.6+k*1.6,-12,24.2,rect(-.25,-5,.5,10,'#ccc','#777',0,.15));}
panel+=box(0,-43,5,428,3,8,'#333');for(let i=0;i<12;i++)panel+=top(-185+i*33,-43,13,rect(-2,-2,4,4,'#060606','#999',1));
let idc=box(0,0,0,85,64,24,'#333','#101010');for(let k=0;k<8;k++)idc+=top(-30+k*8.5,0,24.3,rect(-1.2,-22,2.4,44,'#ddd','#888',.2));idc+=top(0,0,24.4,text(-25,30,'1 2 3 4 5 6 7 8',4));
add('panel','Patch panel',panel,lid(445,95,44.45),`<g transform="scale(3.1)">${idc}</g>`,669.3,1.04,[30,-120],1);

// Removable finger duct: its cap lifts to reveal cable paths between combs.
let manager=shell(445,95,44.45)+ears(44.45,47.5);
for(let i=0;i<18;i++){const x=-201+i*23.6;manager+=box(x,31,3,5,48,35,'#303030');}
for(let i=0;i<7;i++)manager+=line([[-150+i*43,-12,8],[-130+i*40,34,8],[-130+i*40,66,5]],i===2?'#dc2626':'#919191',2.1);
const managerCap=box(0,69,5,444,4,32,'#242424','#111')+front(0,71.2,21,rect(-209,-11,418,22,'none','#777',3)+text(-24,3,'CABLE MANAGEMENT',4));
let clip=box(0,0,0,95,63,10,'#333');for(let x=-40;x<=40;x+=20)clip+=box(x,15,10,4,32,65,'#484848');clip+=line([[-28,-24,16],[-28,30,16],[28,32,16],[28,62,16]],'#dc2626',5);
add('manager','Organizador',manager,managerCap,`<g transform="scale(2.6)">${clip}</g>`,624.85,1.02,[-75,42],1);

// Fiber drawer: twelve duplex adapters, spool radii and six protected splice trays.
let fiber=shell(445,260,44.45),fiberFace='';
for(let i=0;i<12;i++)fiberFace+=`<g transform="translate(${-177+i*32} 0)" data-optical-adapter="${i+1}"><use href="#rk-lc"/></g>`+text(-181+i*32,-10,String(i+1).padStart(2,'0'),3.3);
const fiberFront=rackFront(44.45,fiberFace+rect(-213,-6,8,12,'#333','#aaa',1)+rect(205,-6,8,12,'#333','#aaa',1),260,false);fiber+=ears(44.45,130)+lid(445,260,44.45);
let fiberTray=box(0,-12,3,415,226,3,'#222');
for(let i=0;i<6;i++){const x=-151+i*61;fiberTray+=box(x,-38,6,51,101,7,'#333');fiberTray+=top(x,-38,13.2,rect(-22,-46,44,92,'none','#969696',9,.65));for(let strand=0;strand<4;strand++)fiberTray+=top(x,-38,13.4,rect(-18+strand*1.6,-39+strand*1.7,36-strand*3.2,78-strand*3.4,'none',i===2&&strand===0?'#dc2626':'#848484',13-strand,.45));for(let j=0;j<4;j++)fiberTray+=box(x-13+j*8,-37,13.6,2.5,16,1.5,'#bbb');fiberTray+=line([[x,-3,14],[x,61,10],[x+5,70,10],[x+5,111,15]],i===2?'#dc2626':'#aaa',1.1);}
let lcMacro=box(0,0,0,42,74,25,'#333','#151515');lcMacro+=front(0,37.1,13,`<g transform="scale(2.3)"><use href="#rk-lc"/></g>`);for(const x of [-11,11])lcMacro+=box(x,-46,8,12,19,9,'#777');lcMacro+=line([[-11,-50,12],[-11,-89,12],[-3,-97,12]],'#dc2626',2.4)+line([[11,-50,12],[11,-89,12],[19,-97,12]],'#999',2.4);
add('fiber','Fibra óptica',fiber,fiberTray+fiberFront,`<g transform="scale(3)">${lcMacro}</g>`,758.2,.97,[-95,60],1);

// Edge router with serviceable board, independent copper and optical connections.
let router=shell(445,280,44.45)+electronics(445,280),routerFace=text(-207,-11,'EDGE / ROUTING',5);
for(let i=0;i<8;i++)routerFace+=`<g transform="translate(${-141+i*24} 3)" data-router-port="${i+1}"><use href="#rk-jack"/></g>`+text(-144+i*24,-9,String(i+1),3.5);
for(let i=0;i<2;i++)routerFace+=rect(72+i*30,-3,25,15,'#090909','#aaa',.6)+rect(76+i*30,0,17,8,'#020202','#666',.3);
routerFace+=rect(152,-1,17,7,'#0a0a0a','#aaa',.4)+rect(181,-1,17,7,'#0a0a0a','#aaa',.4);router+=rackFront(44.45,routerFace,280)+fan(100,-89,33,19)+fan(156,-89,33,19);
let sfp=box(0,0,0,28,115,18,'#777','#333');sfp+=top(0,0,18.2,rect(-12,-48,24,91,'none','#aaa',1)+text(-8,-29,'SFP',7));sfp+=front(0,57.6,9,`<use href="#rk-lc"/>`)+line([[-13,63,5],[-13,78,5],[13,78,5],[13,63,5]],'#ccc',2);for(let i=0;i<8;i++)sfp+=top(-10+i*2.7,-63,6,rect(-.5,-7,1,14,'#bbb','#666',.2));
add('router','Router',router,lid(445,280,44.45),`<g transform="scale(3)">${sfp}</g>`,491.5,.94,[52,-175],1);

// Server: eight individually latched drive carriers, fan bank, memory and CPU cooling.
let server=shell(445,480,88.9),serverFace=text(-205,-35,'COMPUTE / STORAGE',4.5);
for(let i=0;i<8;i++){const x=-181+(i%4)*83,y=i<4?-15:16;serverFace+=`<g data-drive="${i+1}">`+rect(x-36,y-11,72,22,'#0b0b0b','#8f8f8f',1)+rect(x+25,y-9,7,18,'#343434','#aaa',1)+circle(x+28.5,y,1.4,i===2?'#dc2626':'#aaa','#666');for(let v=0;v<11;v++)serverFace+=rect(x-32+v*4.6,y-7,1.8,14,'#181818','#555',.6,.35);serverFace+=text(x-35,y+2,String(i+1).padStart(2,'0'),3.4)+'</g>';}
serverFace+=rect(157,-24,47,29,'#070707','#888',1)+rect(161,-20,39,21,'#1c1c1c','#555',.5)+text(164,-7,'SYSTEM',4.5)+circle(170,23,5,'#1a1a1a','#bbb')+rect(184,20,14,6,'#090909','#aaa',.4);
server+=box(0,-55,3,415,365,2,'#1b1b1b');for(let i=0;i<6;i++)server+=fan(-170+i*65,30,10,26);
for(const x of [-102,36]){server+=box(x,-113,8,85,84,9,'#202020');for(let i=0;i<16;i++)server+=box(x-36+i*4.8,-113,17,1.6,75,35,'#595959','#222');for(let i=0;i<6;i++)server+=box(x+58,-156+i*17,7,62,2.8,32,'#3b3b3b');}
for(let i=0;i<4;i++)server+=box(-136+i*87,92,5,74,180,37,'#181818');server+=rackFront(88.9,serverFace,480);
let drive=box(0,0,0,95,142,12,'#343434');drive+=top(0,0,12.2,rect(-44,-68,88,134,'none','#bbb',2)+rect(-30,-41,60,80,'#181818','#777',2)+text(-24,3,'SSD',10));for(const x of [-38,38])for(const y of [-60,60])drive+=top(x,y,12.4,screw(2.8));drive+=box(0,76,0,105,6,24,'#303030')+front(0,80,12,rect(-44,-8,88,16,'#0a0a0a','#999',2)+rect(27,-6,13,12,'#444','#bbb',1));
add('server','Servidor',server,lid(445,480,88.9),`<g transform="scale(2.7)">${drive}</g>`,358.15,.78,[52,-175],.87);

// UPS: electronics remain in the enclosure while the battery cassette is withdrawn.
let ups=shell(445,440,88.9)+electronics(445,430);let upsFace=rect(-34,-31,68,44,'#060606','#aaa',2)+rect(-28,-25,56,32,'#242424','#777',1)+text(-22,-8,'ONLINE',6)+text(-20,3,'230 V',6);
for(const x of [-154,154]){upsFace+=rect(x-22,-26,44,55,'#101010','#888',3)+rect(x-13,-17,26,37,'#080808','#aaa',3);for(let j=0;j<10;j++)upsFace+=rect(x<0?x+40+j*5:x-88+j*5,-28,2,58,'#070707','#555',1,.35);}
for(let i=0;i<4;i++)upsFace+=circle(-23+i*15,24,2,'#aaa','#555');ups+=rackFront(88.9,upsFace,440);
let batteries=box(0,-28,3,378,333,3,'#333');for(let i=0;i<6;i++){const x=-119+(i%3)*118,y=-99+Math.floor(i/3)*161;batteries+=box(x,y,6,105,145,51,'#232323','#111');batteries+=top(x,y,57.1,rect(-47,-67,94,134,'none','#555',2)+text(-20,0,'BATTERY',6));for(const k of [-32,32])batteries+=box(x+k,y-51,57,12,15,5,'#777');}for(let i=0;i<5;i++)batteries+=line([[-151+(i%3)*118,-145+Math.floor(i/3)*161,64],[-80+(i%3)*118,-145+Math.floor(i/3)*161,64]],i===0?'#dc2626':'#999',2.7);
const iecMacro=box(0,0,0,52,62,33,'#333','#181818')+front(0,31.2,16.5,`<g transform="scale(1.7)"><use href="#rk-iec"/></g>`)+top(0,0,33.1,rect(-22,-26,44,51,'none','#777',2));
add('ups','UPS',ups+lid(445,440,88.9),batteries,`<g transform="scale(3.3)">${iecMacro}</g>`,91.45,.84,[-100,75],1);

// Power distributor: eight separate IEC outlets, breaker and a continuous busbar.
let pdu=shell(445,72,44.45),pduFace='';for(let i=0;i<8;i++)pduFace+=`<g transform="translate(${-129+i*40} 0)" data-power-outlet="${i+1}"><use href="#rk-iec"/></g>`+text(-133+i*40,-12,String(i+1),3.5);pduFace+=rect(-209,-11,28,22,'#080808','#aaa',1)+rect(-204,-7,18,14,'#2c2c2c','#888',.4)+text(-202,2,'16A',4.5);pduFace+=rect(-172,-10,16,21,'#2b2b2b','#aaa',1)+line([[0,-20,7],[0,24,7]],'#777');pdu+=rackFront(44.45,pduFace,72);for(let i=0;i<3;i++)pdu+=box(0,-24+i*15,6,412,4,3,'#aaa','#555');for(let i=0;i<8;i++)pdu+=box(-129+i*40,12,7,23,23,19,'#252525');
add('pdu','Distribución',pdu,lid(445,72,44.45),`<g transform="scale(3.3)">${iecMacro}</g>`,224.8,1.03,[32,-110],1);

// Access point sits outside the cabinet, connected to its switching layer.
let apBase=box(0,0,0,166,166,5,'#333','#161616');apBase+=box(0,0,5,146,146,2,'#181818');for(let i=0;i<4;i++){const x=i%2?-51:51,y=i<2?-51:51;apBase+=top(x,y,7.2,rect(-11,-11,22,22,'none','#aaa',2)+rect(-7,-7,14,14,'none','#888',1));}apBase+=box(0,0,7,55,55,6,'#333');for(let i=0;i<11;i++)apBase+=box(-23+i*4.5,0,13,1.1,49,7,'#555');apBase+=face([[-83,83,0],[83,83,0],[83,83,20],[-83,83,20]],'#161616','#888')+face([[83,-83,0],[83,83,0],[83,83,20],[83,-83,20]],'#1c1c1c','#777')+front(0,83.1,10,'<use href="#rk-jack"/>');
let apCover=box(0,0,20,166,166,8,'#2b2b2b','#202020');apCover+=top(0,0,28.1,rect(-73,-73,146,146,'none','#777',16)+line([[-7,-63,28.2],[7,-63,28.2]],'#dc2626',1.8));for(let i=0;i<17;i++)apCover+=side(83.1,-64+i*8,24,rect(-1,-2.4,2,4.8,'#111','#666',.5,.35));
add('access','Punto Wi-Fi',apBase,apCover,jackDetail,0,1.66,[0,-95],.78);

models.find(m=>m.id==='fiber').closed=fiberFront;models.find(m=>m.id==='ups').closed='';
const defs='<g id="rk-jack">'+jack+'</g><g id="rk-lc">'+lc+'</g><g id="rk-iec">'+iec+'</g>'+models.map(m=>`<g id="rk-${m.id}-base">${m.base}</g><g id="rk-${m.id}-cover">${m.cover}</g><g id="rk-${m.id}-closed">${m.closed===undefined?`<use href="#rk-${m.id}-cover"/>`:m.closed}</g><g id="rk-${m.id}-full"><use href="#rk-${m.id}-base"/><use href="#rk-${m.id}-closed"/></g><g id="rk-${m.id}-detail">${m.detail}</g>`).join('');

// 18U cabinet: four posts, three rail holes per U, two side panels, removable
// front glass, hinges, leveling feet, roof fans and grounded power at the base.
let cabinet=box(0,0,-32,600,550,32,'#171717','#111');
for(const x of [-263,263])for(const y of [-237,237])cabinet+=box(x,y,-65,31,31,33,'#272727')+box(x,y,-70,48,48,5,'#333');
cabinet+=face([[-280,-263,0],[280,-263,0],[280,-263,919],[-280,-263,919]],'#0c0c0c','#626262');
let cabinetFront='';for(const x of [-290,290])for(const y of [-263,263]){const post=box(x,y,0,20,24,930,'#262626','#141414');if(y<0)cabinet+=post;else cabinetFront+=post;}
cabinetFront+=face([[300,-255,15],[300,255,15],[300,255,906],[300,-255,906]],'#101010','#858585',.75);
cabinetFront+=side(300.2,0,460,rect(-222,-416,444,832,'none','#444',2)+rect(-21,-320,42,13,'#080808','#aaa',2)+circle(0,-300,4,'#151515','#aaa'));
for(let i=0;i<12;i++)cabinetFront+=side(300.4,-82+i*15,75,rect(-2,-38,4,76,'#080808','#454545',1,.5));
for(const x of [-246,246]){cabinet+=front(x,222,452,rect(-10,-409,20,818,'#202020','#898989',.4));for(let u=0;u<18;u++){const z=47+u*44.45;for(const dz of [6.35,22.225,38.1])cabinet+=front(x,222.5,z+dz,rect(-3.2,-3.2,6.4,6.4,'#040404','#686868',.3,.5));if(x===246)cabinet+=front(x+12,222.6,z+26,text(0,0,String(u+1).padStart(2,'0'),5,'#999'));}}
const roof=box(0,0,930,600,550,14,'#252525','#151515');cabinetFront+=roof+fan(0,-54,944.5,56)+fan(0,82,944.5,56)+top(0,0,944.8,rect(-88,-154,176,296,'none','#6b6b6b',7));
for(const x of [-80,80])for(const y of [-143,143])cabinetFront+=top(x,y,945,screw(3));
cabinetFront+=front(0,266,910,text(-84,0,'NETWORK / 18U',11,'#bbb'));
let mounted='';
for(const m of [...models].filter(m=>m.id!=='access').sort((a,b)=>a.z-b.z)){
 const d={switch:240,panel:95,manager:95,fiber:260,router:280,server:480,ups:440,pdu:72}[m.id];
 const oy=222-d/2;const q=P(0,oy,m.z);
 mounted+=`<g class="rk-mounted" data-rack-slot="${m.id}" transform="translate(${q.join(' ')})"><g class="rk-rail"><use href="#rk-${m.id}-full"/></g><g class="rk-slot-outline">${front(0,d/2+.4,0,rect(-242,-(m.id==='server'||m.id==='ups'?88.9:44.45),484,m.id==='server'||m.id==='ups'?88.9:44.45,'none','#dc2626',1,1))}</g></g>`;
 for(const x of [-233,233])for(const z of [m.z+6.35,m.z+(m.id==='server'||m.id==='ups'?88.9:44.45)-6.35])cabinetFront+=front(x,224,z,screw(2.4));
 m.slotX=q[0];m.slotY=q[1];
}
// The same red physical patch joins panel 09 to switch 06; five further runs
// are muted. Soft curves are projected from control points in cabinet space.
function cable(a,b,color,width=2.8){const q=P(...a),t=P(...b),c1=P(a[0],a[1]+130,a[2]-22),c2=P(b[0],b[1]+125,b[2]+38);return `<path d="M${q}C${c1} ${c2} ${t}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;}
let patching='';for(let i=0;i<5;i++){const pa=-197.8+(8+i*2)*17.2,sw=-153+(2+i*2)*20.2;patching+=cable([pa,230,691.525],[sw,230,610],i===0?'#dc2626':'#858585');}
let blank='';for(const z of [0,3,5,6,9,11,15,17].map(u=>47+u*44.45+22.225))blank+=front(0,224,z,rect(-221,-20,442,40,'#171717','#626262',1)+rect(-210,-12,420,24,'none','#383838',1)+text(-12,2,'UM',5));
let door=rect(0,-896,564,896,'none','#b1b1b1',4,1.3)+rect(1,-895,21,894,'#181818','#777',1)+rect(542,-895,21,894,'#181818','#777',1)+rect(22,-895,520,22,'#181818','#777',1)+rect(22,-22,520,21,'#181818','#777',1)+rect(22,-872,520,850,'#141414','#636363',3,.8);
// Glass is translucent; frame and lock remain readable when closed.
door=door.replace('fill="#141414"','fill="#141414" fill-opacity=".38"');
door+=rect(516,-545,15,104,'#1c1c1c','#aaa',5,1)+rect(521,-524,5,61,'#0a0a0a','#777',2)+circle(523.5,-559,5,'#111','#aaa');
for(const y of [-784,-454,-124])door+=rect(-4,y-15,9,30,'#272727','#bbb',2);
const hinge=P(-282,284,11);
const defaultPart=models[0],focusX=defaultPart.slotX,focusY=defaultPart.slotY;
const scene=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" class="rk-scene" role="img" aria-labelledby="rk-title rk-description"><title id="rk-title">Un gabinete de red, pieza por pieza</title><desc id="rk-description">Gabinete de 18 unidades con puerta articulada, rieles perforados, patch panel, organizador, switch, router, bandeja óptica, servidor, UPS y distribución eléctrica. El punto Wi-Fi se conecta fuera del rack. Cada equipo se extrae, abre y muestra una conexión propia.</desc><defs>${defs}</defs><style>.rk-scene polygon,.rk-scene polyline,.rk-scene rect,.rk-scene circle,.rk-scene path{vector-effect:non-scaling-stroke}.rk-scene [stroke-width=".035"]{stroke-width:.5}</style>
<g class="rk-ground">${face([[-800,-600,-75],[800,-600,-75],[800,750,-75],[-800,750,-75]],'none','#303030',.5)}</g>
<g class="rk-cabinet">${cabinet}${mounted}${blank}<g class="rk-patching">${patching}</g>${cabinetFront}<g class="rk-door" style="--hinge-x:${hinge[0]}px;--hinge-y:${hinge[1]}px" transform="translate(${hinge.join(' ')})">${door}</g></g>
<g class="rk-external"><use href="#rk-access-full"/><path d="M-71.9 31.5C-90 55-160 85-210 115" fill="none" stroke="#dc2626" stroke-width="1.2"/></g>
<path class="rk-leader" data-rack-leader="" d="M220 410H440L510 370H590" fill="none" stroke="#dc2626" stroke-width=".7" stroke-dasharray="3 5"/><g class="rk-focus" style="--slot-x:${focusX}px;--slot-y:${focusY}px"><use data-rack-base="" href="#rk-switch-base"/><g class="rk-cover"><use data-rack-cover="" href="#rk-switch-cover"/></g></g>
<g class="rk-detail"><use data-rack-detail="" href="#rk-switch-detail"/></g>
<g class="rk-view-labels" fill="#c4c7cc" font-family="Arial,sans-serif" font-size="30"><text x="805" y="175" class="rk-overview-label">Del rack al puesto</text><text x="805" y="212" class="rk-overview-label" fill="#fff">Cada conexión tiene su lugar.</text><text x="85" y="116" class="rk-context-label">El equipo conserva su contexto.</text><path d="M805 240h115" stroke="#dc2626" stroke-width="1.2" class="rk-overview-label"/></g>
</svg>`;
const dest=path.join(root,'src/assets/cine/isometric');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'network-rack-v8.svg'),scene);
fs.writeFileSync(path.join(dest,'network-rack-v8.json'),JSON.stringify({version:8,projection:'orthographic 30°',equipment:'Generic explanatory geometry; dimensions do not specify a product or a client installation.',interactionReference:'Hairline cabinet: nearest rack modules extend on rails.',models:models.map(({id,label,z,scale,lift,detailScale,slotX=450,slotY=-280})=>({id,label,z,scale,lift,detailScale,slotX,slotY})),bytes:Buffer.byteLength(scene)},null,2));
console.log(JSON.stringify({models:models.length,bytes:Buffer.byteLength(scene),svg:path.join(dest,'network-rack-v8.svg')}));
