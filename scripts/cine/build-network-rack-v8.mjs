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
const face=(a,f='#121212',st='#aaa',w=.8,extra='')=>`<polygon points="${pts(a)}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`;
const line=(a,st='#777',w=.6,extra='')=>`<polyline points="${pts(a)}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const box=(x,y,z,w,d,h,top='#202020',front='#101010',side='#161616')=>{
 const a=x-w/2,b=x+w/2,c=y-d/2,e=y+d/2;
 return face([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],front)+face([[b,c,z],[b,e,z],[b,e,z+h],[b,c,z+h]],side)+face([[a,c,z+h],[b,c,z+h],[b,e,z+h],[a,e,z+h]],top);
};
function plane(axis,x,y,z,content){const [a,b]=P(x,y,z);const m=axis==='front'?[C,.5,0,1]:axis==='side'?[-C,.5,0,1]:[C,.5,-C,.5];return `<g data-plane="${axis}" transform="matrix(${m.map(v=>Number(v.toFixed(9))).join(' ')} ${a} ${b})">${content}</g>`;}
const front=(x,y,z,s)=>plane('front',x,y,z,s),top=(x,y,z,s)=>plane('top',x,y,z,s),side=(x,y,z,s)=>plane('side',x,y,z,s);
const rect=(x,y,w,h,f='#0a0a0a',s='#777',r=0,sw=.6)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
const circle=(x,y,r,f='#111',s='#999',sw=.5)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
const text=(x,y,s,size=6,color='#bdbdbd')=>`<text x="${n(x)}" y="${n(y)}" fill="${color}" font-size="${size}" font-family="Arial,sans-serif">${esc(s)}</text>`;
const screw=(r=2.1)=>circle(0,0,r,'#171717','#aaa')+`<path d="M${-r*.5} 0h${r}M0 ${-r*.5}v${r}" fill="none" stroke="#ccc" stroke-width=".55"/>`;
function fan(x,y,z,r=22){return top(x,y,z,circle(0,0,r,'#0b0b0b','#999')+circle(0,0,r*.74,'none','#555')+Array.from({length:7},(_,i)=>`<path transform="rotate(${i*360/7})" d="M3-3Q${r*.55}-${r*.96} ${r*.83}-${r*.28}Q${r*.37}-${r*.2} 3 3Z" fill="#393939" stroke="#888" stroke-width=".45"/>`).join('')+circle(0,0,r*.18,'#151515','#aaa'));}
function shell(w,d,h){let s=box(0,0,0,w,d,2,'#161616','#121212');s+=face([[-w/2,-d/2,2],[w/2,-d/2,2],[w/2,-d/2,h],[-w/2,-d/2,h]],'#101010','#555');s+=face([[w/2,-d/2,2],[w/2,d/2,2],[w/2,d/2,h],[w/2,-d/2,h]],'#171717','#999');for(let i=0;i<16;i++)s+=side(w/2+.1,-d/2+18+i*(d-36)/16,h/2,rect(-1,-h*.27,2,h*.54,'#070707','#666',1,.35));return s;}
function lid(w,d,h){let s=box(0,0,h-2,w,d,2,'#1b1b1b','#151515');s+=top(0,0,h+.1,rect(-w/2+8,-d/2+8,w-16,d-16,'none','#444',2,.45));for(const x of [-w/2+10,w/2-10])for(const y of [-d/2+12,d/2-12])s+=top(x,y,h+.2,screw());for(let i=0;i<18;i++)s+=top(-100+i*11,-d*.23,h+.3,rect(-2,-20,4,40,'#0c0c0c','#555',1.8,.4));s+=face([[-w/2+3,d/2-3,h-6],[w/2-3,d/2-3,h-6],[w/2-3,d/2-3,h-2],[-w/2+3,d/2-3,h-2]],'#171717','#777',.55);return s;}
function ears(h=44.45,y=120){let s='';for(const x of [-233,233])s+=front(x,y+2,h/2,rect(-10,-h/2+1,20,h-2,'#151515','#a3a3a3',1)+rect(-2.6,-h/2+6.35-3.5,5.2,7,'#070707','#777',2.5)+rect(-2.6,h/2-6.35-3.5,5.2,7,'#070707','#777',2.5));return s;}
function rackFront(h,detail,d=240,mount=true){const y=d/2;return face([[-222.5,y,0],[222.5,y,0],[222.5,y,h],[-222.5,y,h]],'#121212','#aaa',.8)+front(0,y+.2,h/2,detail)+(mount?ears(h,y):'');}
function electronics(w,d){let s=box(-25,-8,3,w-35,d-22,2,'#181818','#0e0e0e');for(let i=0;i<12;i++){const x=-w/2+27+i*(w-60)/12;s+=line([[x,d/2-18,5.3],[x,d/2-44,5.3],[x+7,d/2-51,5.3],[x+7,-d*.15,5.3]],'#626262',.7);s+=top(x+7,-d*.15,5.5,circle(0,0,1.1,'#aaa','#777'));}for(let i=0;i<3;i++){s+=box(-110+i*58,-20,5,39,40,6,'#111');for(let j=0;j<9;j++)s+=box(-126+i*58+j*4,-20,11,1.1,34,12,'#555','#252525');}s+=box(139,-d*.19,5,100,d*.37,24,'#2b2b2b');for(let i=0;i<7;i++)s+=top(103+i*12,-d*.19,29.2,rect(-1.2,-d*.13,2.4,d*.26,'#0a0a0a','#777',1,.35));return s;}
// A single physical front-plane jack: shield, keyed opening and eight contacts.
// Every face and macro uses the exact same projection, including the switch.
const jack=rect(-8,-7,16,14,'#aaa','#ccc',.7,.65)+rect(-7,-6,14,12,'#171717','#999',.4,.4)+`<path d="M-5.8-4.8H5.8V2.6H3.5V4.2H2.2V5.2H-2.2V4.2H-3.5V2.6H-5.8Z" fill="#070707" stroke="#777" stroke-width=".35"/>`+Array.from({length:8},(_,i)=>`<g data-contact="${i+1}">${rect(-5.35+i*1.42,-4.2,.75,4.7,'#ddd','#777',.15,.18)}</g>`).join('');
// The macro enlarges a connector, not a second equipment chassis. The shield
// has a cutaway roof; eight spring contacts align with the common port face.
let socket=box(0,0,0,18,25,1,'#333')+face([[9,-12.5,1],[9,12.5,1],[9,12.5,17],[9,-12.5,17]],'#171717','#bbb',.75)+face([[-9,-12.5,1],[9,-12.5,1],[9,-12.5,17],[-9,-12.5,17]],'#171717','#bbb',.75);
for(let i=0;i<8;i++){const x=-4.975+i*1.42;socket+=line([[x,-10,3],[x,2,3],[x,9,11.5]],'#ccc',.75);}
socket+=face([[-9,-12.5,17],[0,-12.5,17],[0,12.5,17],[-9,12.5,17]],'#333','#bbb',.75)+face([[-9,12.5,0],[9,12.5,0],[9,12.5,17],[-9,12.5,17]],'#333','#ccc',.8)+front(0,12.7,8.5,'<use href="#rk-jack"/>');
for(const y of [-4,7])socket+=side(9.1,y,8,rect(-1.3,-3,2.6,6,'#111','#aaa',.4,.45));
let plug=box(0,40,4,11.4,22,8,'#777','#333');
plug+=top(0,40,12.1,rect(-5,-10,10,20,'none','#bbb',.6)+Array.from({length:8},(_,i)=>rect(-5.35+i*1.42,-10,.75,17,'#ddd','#777',.1,.18)).join(''));
plug+=face([[-1.6,33,1],[1.6,33,1],[1.6,48,4],[-1.6,48,4]],'#aaa','#ccc',.65)+box(0,54,3,14,7,10,'#333');
for(let i=0;i<5;i++)plug+=box(0,59+i*2,3,14-i*.9,1.1,9-i*.7,'#444');
plug+=line([[0,69,8],[0,77,8],[16,88,8]],'#dc2626',3);
const jackDetail=`<g transform="scale(7.2)">${socket}<g class="rk-plug">${plug}</g></g>`;
const iec=rect(-12,-9,24,18,'#0b0b0b','#aaa',1)+`<path d="M-8-6H8L10-3V6H-10V-3Z" fill="#050505" stroke="#777" stroke-width=".6"/>`+rect(-1.2,-4,2.4,3.4,'#aaa','#555',.2)+rect(-5.5,1,2.4,3.4,'#aaa','#555',.2)+rect(3.1,1,2.4,3.4,'#aaa','#555',.2);
const lc=rect(-7.5,-5.5,15,11,'#1b1b1b','#aaa',.6)+rect(-5.3,-3.5,4.5,7,'#070707','#777',.4)+rect(.8,-3.5,4.5,7,'#070707','#777',.4)+`<path d="M-5-6v-2h10v2M-1-4v8" fill="none" stroke="#ccc" stroke-width=".6"/>`;
const models=[];
function add(id,label,base,cover,detail,z,scale,lift,detailScale=1){models.push({id,label,base,cover,detail,z,scale,lift,detailScale});}
// 1U managed switch: 2 × 12 RJ45, four SFP cages, ASIC and power supply.
let switchBody=shell(445,240,44.45),switchFace=text(-208,-12,'STATUS',4.5);
for(let i=0;i<4;i++)switchFace+=circle(-203+i*9,-1,1.6,i===0?'#dc2626':'#aaa','#777',.35);
switchFace+=rect(-205,9,31,9,'#080808','#aaa',.6)+text(-202,16,'CONSOLE',3.4);
const switchPorts=[];
for(let i=0;i<24;i++){
 const x=-152+(i%12)*18.5,y=i<12?-8.5:8.5;
 switchPorts.push({id:i+1,x,z:22.225-y});
 switchFace+=`<g data-port="${i+1}" transform="translate(${x} ${y})"><use href="#rk-jack"/>${i===5?rect(-8.8,-7.8,17.6,15.6,'none','#dc2626',1,1.1):''}</g>`;
 if(i<12)switchFace+=text(x-2.7,-17,String(i+1).padStart(2,'0'),3.2);
}
for(let i=0;i<4;i++){
 const x=87+(i%2)*31,y=i<2?-10:9;
 switchFace+=`<g data-sfp="${i+1}">${rect(x-12,y-6,24,12,'#aaa','#ccc',.4,.6)+rect(x-10,y-4,20,8,'#070707','#777',.4,.35)}</g>`;
}
switchFace+=text(82,-18,'SFP',4)+text(155,-10,'UM / NETWORK',4.5)+rect(156,-2,43,15,'#111','#aaa',1)+text(160,8,'24 PORTS',4.5);
switchBody+=box(-27,-8,3,379,190,2,'#181818');
for(let bank=0;bank<4;bank++){
 const x=-133.5+bank*55.5;
 switchBody+=box(x,82,5,53,71,33,'#333');
 for(let i=0;i<6;i++)switchBody+=line([[x-19+i*7,49,7],[x-19+i*7,30,7],[x-9+i*6,-7,7]],'#999',.7);
}
switchBody+=box(-4,-22,5,70,72,9,'#333');
for(let i=0;i<16;i++)switchBody+=box(-33+i*4,-22,14,1.8,65,19,'#777','#333');
switchBody+=box(151,-29,5,112,151,31,'#333');
switchBody+=top(151,-29,36.1,rect(-48,-68,96,136,'none','#999',2));
switchBody+=fan(-138,-60,29,24)+fan(-77,-60,29,24);
for(let i=0;i<9;i++)switchBody+=box(90+i*12,-102,7,6,13,16,'#aaa');
switchBody+=rackFront(44.45,switchFace,240);
add('switch','Switch',switchBody,lid(445,240,44.45),jackDetail,580.4,.98,[0,-155],.78);

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
for(const x of [-102,36]){server+=box(x,-113,8,85,84,9,'#202020');for(let i=0;i<16;i++)server+=box(x-36+i*4.8,-113,17,1.6,75,35,'#595959','#222');for(let i=0;i<6;i++)server+=box(x+74,-156+i*17,7,62,2.8,32,'#3b3b3b');}
for(let level=0;level<2;level++)for(let i=0;i<4;i++){const x=-181+i*83,z=17.45+level*31;server+=box(x,150,z,72,170,22,'#181818');server+=top(x,150,z+22.1,rect(-30,-72,60,144,'#222','#999',2,.4));for(const offset of [-28,28])server+=top(x+offset,219,z+22.2,screw(1.5));}server+=rackFront(88.9,serverFace,480);
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

// Peripheral equipment uses the same physical projection and material palette.
// Circular parts are faceted solids, not screen-space ellipses or perspective.
const disc=(x,y,z,r)=>Array.from({length:32},(_,i)=>[x+r*Math.cos(i*Math.PI/16),y+r*Math.sin(i*Math.PI/16),z]);
function roundBody(x,y,z,r,h){let s='';for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16;if(Math.cos(a)+Math.sin(a)>-.15)s+=face([[x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z],[x+r*Math.cos(b),y+r*Math.sin(b),z+h],[x+r*Math.cos(a),y+r*Math.sin(a),z+h]],i<8?'#171717':'#151515','#777',.35);}return s+face(disc(x,y,z+h,r),'#252525','#aaa',.65);}
function board(w,d,z=5){let s=box(0,0,z,w,d,2,'#181818');for(let i=0;i<10;i++){const x=-w/2+12+i*(w-24)/10;s+=line([[x,d/2-9,z+2.2],[x,d/2-30,z+2.2],[x+9,d/2-39,z+2.2],[x+9,-d/2+15,z+2.2]],'#858585',.55)+top(x+9,-d/2+15,z+2.3,circle(0,0,1.2,'#aaa'));}for(const x of [-w/2+7,w/2-7])for(const y of [-d/2+7,d/2-7])s+=top(x,y,z+2.5,screw(2));return s;}
function lens(r=30){return circle(0,0,r,'#333','#ccc',.8)+circle(0,0,r*.86,'#0a0a0a','#aaa',.7)+circle(0,0,r*.69,'#171717','#777',.6)+circle(0,0,r*.51,'#060606','#bbb',.6)+circle(-r*.12,-r*.12,r*.23,'#151515','#626262',.45)+`<path d="M${-r*.37} ${-r*.23}Q${-r*.12} ${-r*.48} ${r*.14} ${-r*.38}" fill="none" stroke="#ccc" stroke-width=".8"/>`;}

// Wall outlet: two keyed jacks, rear IDC blocks and a removable faceplate.
let outlet=box(0,0,0,86,42,146,'#171717');outlet+=front(0,21.1,73,rect(-33,-58,66,116,'#080808','#999',4));
for(const z of [47,98]){outlet+=box(0,0,z-14,32,36,28,'#333')+front(0,22,z,'<g transform="scale(1.4)"><use href="#rk-jack"/></g>');for(let i=0;i<8;i++)outlet+=top(-11+i*3.2,-13,z+14.2,rect(-.6,-4,1.2,8,'#ddd','#777',.1));}
let outletCover=box(0,27,0,90,4,150,'#252525');outletCover+=front(0,29.2,75,rect(-39,-69,78,138,'none','#bbb',3)+rect(-21,-39,42,25,'#080808','#999',2)+rect(-21,12,42,25,'#080808','#999',2)+text(-10,-45,'DATA 01',5)+text(-10,8,'DATA 02',5));for(const z of [10,140])outletCover+=front(0,29.4,z,screw(3));
add('outlet','Toma de datos',outlet,outletCover,jackDetail,0,2.1,[0,0],.78);
// Optical transceiver: metal body, rear edge contacts and a removable shield.
let optic=box(0,0,0,28,115,2,'#333')+board(23,99,2)+front(0,57.6,9,'<use href="#rk-lc"/>');optic+=box(0,31,4,20,26,12,'#222');for(let i=0;i<10;i++)optic+=top(-11.25+i*2.5,-57,4.2,rect(-.5,-8,1,16,'#ddd','#777',.1));
let opticCover=box(0,0,18,28,115,1.4,'#777')+side(14.1,0,9,rect(-56,-9,112,18,'#333','#aaa',1))+line([[-13,62,5],[-13,78,5],[13,78,5],[13,62,5]],'#ccc',2)+top(0,0,19.6,rect(-11,-43,22,78,'none','#aaa',1)+text(-8,-22,'SFP',6));
add('optic','Transceptor SFP',optic,opticCover,`<g transform="scale(3)">${sfp}</g>`,0,3.4,[0,0],1);
// PoE injector: mains and two Ethernet interfaces remain distinct.
let injector=shell(91,152,39)+board(77,131,3);injector+=box(19,-30,6,25,35,18,'#333')+box(-21,-12,6,24,32,22,'#484848');for(let i=0;i<8;i++)injector+=box(-30+i*4,-12,28,1,28,7,'#777');injector+=front(0,76.2,19.5,'<g transform="translate(-22 0)"><use href="#rk-jack"/></g><g transform="translate(22 0)"><use href="#rk-jack"/></g>'+text(-29,-11,'DATA',4)+text(12,-11,'PoE',4));injector+=box(0,-78,8,36,12,22,'#111');
let injectorCover=lid(91,152,39);injectorCover+=top(0,0,39.5,rect(-28,-29,56,58,'none','#aaa',3)+text(-21,-2,'DATA + POWER',4.8)+circle(0,20,2,'#dc2626','#888'));
add('injector','Inyector PoE',injector,injectorCover,jackDetail,0,2.35,[0,0],.78);
// Fixed IP camera: folded weather hood, optical face, board, seal and bracket.
let camera=shell(142,222,92)+board(124,186,5);camera+=box(0,-31,7,43,47,12,'#333');for(let i=0;i<9;i++)camera+=box(-20+i*5,-31,19,1.4,42,20,'#aaa','#333');camera+=box(0,62,12,58,52,50,'#222');
let cameraFace=rect(-71,-46,142,92,'#151515','#aaa',3)+lens(31);for(let i=0;i<16;i++){const a=i*Math.PI/8;cameraFace+=circle(43*Math.cos(a),35*Math.sin(a),2.7,'#aaa','#777',.4);}for(const x of [-61,61])for(const y of [-36,36])cameraFace+=`<g transform="translate(${x} ${y})">${screw(2.1)}</g>`;
camera+=front(0,111.3,46,cameraFace)+face([[-71,111,0],[71,111,0],[71,111,92],[-71,111,92]],'none','#aaa',1)+box(0,-85,-25,39,45,25,'#333')+box(0,-117,-72,29,70,47,'#333')+box(0,-153,-85,86,7,101,'#252525');for(const x of [-33,33])for(const z of [-72,1])camera+=front(x,-149,z,screw(3));camera+=side(20,-90,-14,circle(0,0,11,'#222','#aaa')+screw(5));camera+=line([[38,-112,20],[38,-139,20],[56,-153,3],[56,-185,-20]],'#777',3);
let cameraCover=box(0,0,92,150,243,3,'#252525')+face([[-75,-121.5,69],[-75,121.5,69],[-75,121.5,92],[-75,-121.5,92]],'#151515','#aaa')+face([[75,-121.5,69],[75,121.5,69],[75,121.5,92],[75,-121.5,92]],'#171717','#aaa');cameraCover+=top(0,0,95.2,rect(-65,-111,130,223,'none','#888',4));for(const x of [-61,61])for(const y of [-97,97])cameraCover+=top(x,y,95.4,screw());
const cameraMacro=front(0,0,0,lens(39)+Array.from({length:16},(_,i)=>circle(54*Math.cos(i*Math.PI/8),54*Math.sin(i*Math.PI/8),3,'#aaa','#888')).join(''));
add('camera','Cámara IP',camera,cameraCover,`<g transform="scale(3.1)">${cameraMacro}</g>`,0,1.35,[0,0],1);
// Dome camera: bayonet base, electronics and lens gimbal under a faceted cover.
let dome=roundBody(0,0,0,91,15)+board(105,105,16)+box(0,0,19,72,55,6,'#333');dome+=box(-31,0,25,12,56,45,'#333')+box(31,0,25,12,56,45,'#333')+box(0,4,34,47,52,40,'#222')+front(0,31,53,lens(21));for(const x of [-37,37])dome+=side(x,0,49,circle(0,0,10,'#777','#aaa')+screw(4));for(let i=0;i<3;i++){const a=i*Math.PI*2/3;dome+=top(74*Math.cos(a),74*Math.sin(a),15.3,screw(3));}
let domeCover=roundBody(0,0,16,91,11);for(let ring=0;ring<6;ring++){const z0=27+ring*10,z1=z0+10,r0=82*Math.sqrt(1-(ring/6)**2),r1=82*Math.sqrt(1-((ring+1)/6)**2);for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16;if(Math.cos(a)+Math.sin(a)>-.2)domeCover+=face([[r0*Math.cos(a),r0*Math.sin(a),z0],[r0*Math.cos(b),r0*Math.sin(b),z0],[r1*Math.cos(b),r1*Math.sin(b),z1],[r1*Math.cos(a),r1*Math.sin(a),z1]],'#151515','#888',.3,'fill-opacity=".5"');}}
add('dome','Cámara domo',dome,domeCover,`<g transform="scale(3.5)">${front(0,0,0,lens(34))}</g>`,0,1.8,[0,0],1);
// Access reader: keypad, antenna loop and a board fixed to a separate backplate.
let reader=box(0,0,0,89,24,164,'#171717')+front(0,12.2,82,rect(-33,-70,66,140,'#181818','#aaa',3));for(const x of [-31,31])for(const z of [13,150])reader+=front(x,12.5,z,screw(2.4));reader+=front(0,12.6,100,Array.from({length:4},(_,i)=>rect(-27+i*4,-32+i*4,54-i*8,64-i*8,'none','#aaa',7-i,.55)).join(''))+box(0,0,25,31,18,17,'#333');for(let i=0;i<8;i++)reader+=front(-23+i*6.5,12.8,22,rect(-1,-6,2,12,'#aaa','#777',.2));
let readerCover=box(0,23,0,94,7,168,'#252525')+front(0,26.6,84,rect(-40,-77,80,154,'none','#aaa',8)+rect(-31,-61,62,24,'#080808','#aaa',3)+text(-15,-46,'ACCESS',5));for(let i=0;i<12;i++){const x=-22+(i%3)*22,y=-22+Math.floor(i/3)*20;readerCover+=front(x,26.8,84,rect(-8,y-7,16,14,'#171717','#999',2)+text(-2,y+3,i<9?i+1:i===9?'*':i===10?'0':'#',5.5));}readerCover+=front(0,26.9,20,rect(-20,-2,40,4,'#dc2626','#777',1));
const readerMacro=front(0,0,0,Array.from({length:5},(_,i)=>rect(-60+i*9,-60+i*9,120-i*18,120-i*18,'none','#ccc',18-i*3,1.2)).join('')+rect(-16,-16,32,32,'#333','#aaa',3)+text(-13,3,'RFID',7));
add('reader','Lector de acceso',reader,readerCover,`<g transform="scale(2.4)">${readerMacro}</g>`,0,2,[0,0],1);
// Directional radio: reflector segments, feed, rear fins and an adjustable mast.
let radio=box(0,-44,5,91,72,211,'#171717')+box(0,-50,17,73,54,188,'#333');for(let i=0;i<12;i++)radio+=box(-36+i*6.5,-72,30,2.3,17,165,'#aaa','#333');radio+=box(0,-112,-23,27,28,295,'#222')+box(0,-85,38,85,23,50,'#333')+box(0,-85,154,85,23,50,'#333');for(const z of [63,179])for(const x of [-30,30])radio+=front(x,-71,z,screw(5));radio+=front(0,-6,76,'<use href="#rk-jack"/>')+box(0,34,117,28,65,23,'#333');
let dish='';for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16;const edge=t=>[112*Math.cos(t),13,126+112*Math.sin(t)],inner=t=>[33*Math.cos(t),36,126+33*Math.sin(t)];dish+=face([edge(a),edge(b),inner(b),inner(a)],i<16?'#252525':'#202020','#888',.4);}dish+=front(0,15,126,circle(0,0,112,'none','#ccc',1.4))+front(0,70,126,circle(0,0,16,'#333','#aaa'));for(const a of [0,2.094395,4.18879])dish+=line([[98*Math.cos(a),15,126+98*Math.sin(a)],[0,67,126]],'#ccc',2.4);
const clamp=box(0,0,0,120,42,72,'#333')+box(0,-55,-36,30,30,146,'#222');let radioMacro=clamp;for(const x of [-44,44])for(const z of [16,56])radioMacro+=front(x,21.2,z,circle(0,0,7,'#aaa','#777')+screw(4));
add('radio','Radioenlace',radio,dish,`<g transform="scale(2.1)">${radioMacro}</g>`,0,1.45,[0,0],1);
// Smoke detector: bayonet base, PCB, protected chamber and vented outer cap.
let detector=roundBody(0,0,0,62,9)+board(68,68,10)+roundBody(0,0,12,30,27);for(let i=0;i<20;i++){const a=i*Math.PI/10;detector+=box(34*Math.cos(a),34*Math.sin(a),16,4,4,17,'#333');}for(const x of [-40,40])detector+=top(x,0,9.3,screw(2.6));detector+=top(0,0,39.2,circle(0,0,17,'#080808','#aaa')+circle(0,0,5,'#171717','#777'));
let detectorCover=roundBody(0,0,40,62,8)+roundBody(0,0,48,50,8)+roundBody(0,0,56,39,4);for(let i=0;i<28;i++){const a=i*Math.PI/14,b=a+.043;detectorCover+=face([[61*Math.cos(a),61*Math.sin(a),43],[61*Math.cos(b),61*Math.sin(b),43],[53*Math.cos(b),53*Math.sin(b),51],[53*Math.cos(a),53*Math.sin(a),51]],'#070707','#666',.3);}detectorCover+=top(0,0,60.2,circle(0,0,26,'none','#888')+circle(0,19,2.2,'#dc2626','#777'));
let chamber=roundBody(0,0,0,42,28);for(let i=0;i<24;i++){const a=i*Math.PI/12;chamber+=box(33*Math.cos(a),33*Math.sin(a),28,3,6,15,'#333');}chamber+=top(0,0,28.5,circle(0,0,22,'#070707','#aaa'));
add('detector','Detector',detector,detectorCover,`<g transform="scale(2.8)">${chamber}</g>`,0,2.3,[0,0],1);
// Fire panel: the front and internals belong to the same physical enclosure.
let central=box(0,-38,0,284,4,360,'#171717')+face([[142,-38,0],[142,38,0],[142,38,360],[142,-38,360]],'#151515','#aaa')+face([[-142,-38,0],[-142,38,0],[-142,38,360],[-142,-38,360]],'#151515','#aaa')+box(0,0,0,284,76,4,'#222')+box(0,0,356,284,76,4,'#252525');central+=front(0,-33,218,rect(-117,-101,234,184,'#181818','#aaa',2));for(let row=0;row<2;row++)for(let i=0;i<12;i++)central+=front(-101+i*18,-30,292-row*44,rect(-6,-7,12,14,'#333','#aaa',.7)+rect(-3,-4,6,8,'#aaa','#777',.2));central+=box(0,-19,175,78,21,48,'#333');for(let i=0;i<8;i++)central+=front(-25+i*7,-7,197,rect(-1,-15,2,30,'#aaa','#777',.2));for(const x of [-65,65]){central+=box(x,0,10,107,60,91,'#232323');central+=top(x,0,101.2,rect(-48,-25,96,50,'none','#888',2));for(const p of [-32,32])central+=box(x+p,-17,102,11,12,5,'#aaa');}central+=line([[-97,-17,109],[-97,-18,127],[97,-18,127],[97,-17,109]],'#dc2626',2.5)+line([[-33,-17,109],[-33,-18,149],[-99,-18,149],[-99,-30,255]],'#aaa',2.3)+line([[33,-17,109],[33,-18,156],[99,-18,156],[99,-30,255]],'#aaa',2.3);
let centralDoor=rect(-142,-360,284,360,'#252525','#aaa',1.5,.8)+rect(-134,-350,268,340,'none','#888',2)+rect(-102,-311,204,76,'#080808','#bbb',3)+rect(-94,-303,188,60,'#171717','#777',1)+text(-78,-276,'SYSTEM / NORMAL',10)+text(-78,-255,'LOOP 01   LOOP 02',7);for(let i=0;i<8;i++)centralDoor+=circle(-98+i*28,-205,3,i===0?'#dc2626':'#aaa','#777');for(let i=0;i<9;i++)centralDoor+=rect(-56+(i%3)*36,-169+Math.floor(i/3)*27,27,17,'#171717','#aaa',2)+text(-47+(i%3)*36,-157+Math.floor(i/3)*27,i+1,6);centralDoor+=circle(117,-80,8,'#111','#aaa')+screw(4);
let terminals=box(0,0,0,125,55,35,'#333');for(let i=0;i<8;i++)terminals+=top(-49+i*14,0,35.2,rect(-5,-21,10,42,'#171717','#aaa',1)+screw(3));
add('central','Central de incendio',central,front(0,40,0,centralDoor),`<g transform="scale(2.3)">${terminals}</g>`,0,1.06,[0,0],1);

models.find(m=>m.id==='fiber').closed=fiberFront;models.find(m=>m.id==='ups').closed='';
const motions={switch:[0,0,155],panel:[0,0,105],manager:[0,80,0],fiber:[0,130,0],router:[0,0,155],server:[0,0,165],ups:[0,140,0],pdu:[0,0,105],access:[0,0,90],outlet:[0,95,0],optic:[0,0,38],injector:[0,0,90],camera:[0,0,100],dome:[0,0,95],reader:[0,100,0],radio:[0,105,0],detector:[0,0,65],central:[0,155,0]};
const dimensions={switch:[445,240,44.45],panel:[445,95,44.45],manager:[445,95,44.45],fiber:[415,226,3],router:[445,280,44.45],server:[445,480,88.9],ups:[378,333,3],pdu:[445,72,44.45],access:[166,166,28],outlet:[90,42,150],optic:[28,115,20],injector:[91,152,39],camera:[150,243,95],dome:[182,182,87],reader:[94,31,168],radio:[224,130,240],detector:[124,124,60],central:[284,76,360]};
for(const model of models){model.motion=motions[model.id];model.lift=P(...model.motion);const [w,d,h]=dimensions[model.id];model.guides=[[-w*.46,-d*.43,h],[-w*.46,d*.43,h],[w*.46,d*.43,h]].map(p=>line([p,p.map((v,i)=>v+model.motion[i])],'#777',.55,'stroke-dasharray="3 5"')).join('');}
const defs='<g id="rk-jack">'+jack+'</g><g id="rk-lc">'+lc+'</g><g id="rk-iec">'+iec+'</g>'+models.map(m=>`<g id="rk-${m.id}-base">${m.base}</g><g id="rk-${m.id}-cover">${m.cover}</g><g id="rk-${m.id}-guides">${m.guides}</g><g id="rk-${m.id}-closed">${m.closed===undefined?`<use href="#rk-${m.id}-cover"/>`:m.closed}</g><g id="rk-${m.id}-full"><use href="#rk-${m.id}-base"/><use href="#rk-${m.id}-closed"/></g><g id="rk-${m.id}-detail">${m.detail}</g>`).join('');

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
for(const m of [...models].filter(m=>m.z>0).sort((a,b)=>a.z-b.z)){
 const d={switch:240,panel:95,manager:95,fiber:260,router:280,server:480,ups:440,pdu:72}[m.id];
 const oy=222-d/2;const q=P(0,oy,m.z);
 mounted+=`<g class="rk-mounted" data-rack-slot="${m.id}" transform="translate(${q.join(' ')})"><g class="rk-rail"><use href="#rk-${m.id}-full"/></g><g class="rk-slot-outline">${front(0,d/2+.4,0,rect(-242,-(m.id==='server'||m.id==='ups'?88.9:44.45),484,m.id==='server'||m.id==='ups'?88.9:44.45,'none','#dc2626',1,1))}</g></g>`;
 for(const x of [-233,233])for(const z of [m.z+6.35,m.z+(m.id==='server'||m.id==='ups'?88.9:44.45)-6.35])cabinetFront+=front(x,224,z,screw(2.4));
 m.slotX=q[0];m.slotY=q[1];
}
// The same red physical patch joins panel 09 to switch 06; five further runs
// are muted. Soft curves are projected from control points in cabinet space.
function cable(a,b,color,width=2.8){const q=P(...a),t=P(...b),c1=P(a[0],a[1]+130,a[2]-22),c2=P(b[0],b[1]+125,b[2]+38);return `<path d="M${q}C${c1} ${c2} ${t}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;}
let patching='';for(let i=0;i<5;i++){const pa=-197.8+(8+i*2)*17.2,port=switchPorts.find(p=>p.id===6+i*2);patching+=cable([pa,224,690.525],[port.x,224,580.4+port.z],i===0?'#dc2626':'#858585',i===0?3.3:2);}
let blank='';for(const z of [0,3,5,6,9,11,15,17].map(u=>47+u*44.45+22.225))blank+=front(0,224,z,rect(-221,-20,442,40,'#171717','#626262',1)+rect(-210,-12,420,24,'none','#383838',1));
let door=rect(0,-896,564,896,'none','#b1b1b1',4,1.3)+rect(1,-895,21,894,'#181818','#777',1)+rect(542,-895,21,894,'#181818','#777',1)+rect(22,-895,520,22,'#181818','#777',1)+rect(22,-22,520,21,'#181818','#777',1)+rect(22,-872,520,850,'#141414','#636363',3,.8);
// Glass is translucent; frame and lock remain readable when closed.
door=door.replace('fill="#141414"','fill="#141414" fill-opacity=".38"');
door+=rect(516,-545,15,104,'#1c1c1c','#aaa',5,1)+rect(521,-524,5,61,'#0a0a0a','#777',2)+circle(523.5,-559,5,'#111','#aaa');
for(const y of [-784,-454,-124])door+=rect(-4,y-15,9,30,'#272727','#bbb',2);
const hinge=P(-282,284,11);
const defaultPart=models[0],focusX=defaultPart.slotX,focusY=defaultPart.slotY;
const overviewScale=.43,apOrigin=[905,430],apPort=P(0,83.2,10),wifiPort=switchPorts.find(p=>p.id===18),wifiStart=P(wifiPort.x,222.2,580.4+wifiPort.z);
const wifiA=wifiStart.map((v,i)=>n(v*overviewScale+[505,555][i])),wifiB=apPort.map((v,i)=>n(v*overviewScale+apOrigin[i]));
const wifiLead=[n(wifiA[0]-180*C*overviewScale),n(wifiA[1]+90*overviewScale)],wifiFloor=[wifiLead[0],630];
const wifiCorner=[n(wifiFloor[0]+(wifiB[0]-wifiFloor[0]+(wifiB[1]-wifiFloor[1])/Math.tan(Math.PI/6))/2),0];wifiCorner[1]=n(wifiFloor[1]+(wifiCorner[0]-wifiFloor[0])*Math.tan(Math.PI/6));
const wifiFrontPath=`M${wifiA}L${wifiLead}L${wifiFloor}L${wifiCorner}`,wifiPath=wifiFrontPath+`L${wifiB}`;
const route=[wifiA,wifiLead,wifiFloor,wifiCorner,wifiB],routeLengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1])),frontPathLength=n(100*routeLengths.slice(0,3).reduce((a,b)=>a+b,0)/routeLengths.reduce((a,b)=>a+b,0));
const networkWire=(d,pathLength=100)=>`<path d="${d}" fill="none" stroke="#697680" stroke-width="1.2"/><path class="rk-signal" d="${d}" pathLength="${pathLength}" fill="none" stroke="#dc2626" stroke-width="2.7" stroke-dasharray="4 96" stroke-dashoffset="100"/>`;
const peripherals=[['101','outlet',885,610],['102','camera',912,360],['102','dome',958,495],['102','reader',872,670],['103','radio',908,420],['103','injector',859,611],['103','optic',1080,570],['107','central',927,555],['107','detector',1012,625]];
const perimeter=peripherals.map(([service,id,x,y])=>`<g class="rk-peripheral" data-context-services="${service}" data-system-part="${id}" transform="translate(${x} ${y}) scale(${overviewScale})"><use href="#rk-${id}-full"/></g>`).join('');
const screenPoint=(position,origin)=>P(...position).map((v,i)=>n(v*overviewScale+origin[i]));
function isoCorner(a,b){const x=n(a[0]+(b[0]-a[0]+(b[1]-a[1])/Math.tan(Math.PI/6))/2);return [x,n(a[1]+(x-a[0])*Math.tan(Math.PI/6))];}
function isoRoute(a,b){return `M${a}L${isoCorner(a,b)}L${b}`;}
const systemRoutes=[
 ['101','panel-outlet',screenPoint([-60.2,224,690.525],[505,555]),screenPoint([0,22,98],[885,610])],
 ['102','switch-camera',screenPoint([-152,224,611.125],[505,555]),screenPoint([56,-185,-20],[912,360])],
 ['103','injector-radio',screenPoint([22,76,19.5],[859,611]),screenPoint([0,-6,76],[908,420])],
 ['107','central-detector',screenPoint([7,-30,292],[927,555]),screenPoint([0,62,8],[1012,625])],
];
// Cabinet runs leave through the exposed front, descend to the floor and
// pass behind the cabinet side. Both layers share one continuous signal path.
const wireRun=([service,id,a,b])=>{
 if(!['panel-outlet','switch-camera'].includes(id))return {service,id,path:isoRoute(a,b)};
 const lead=[n(a[0]-180*C*overviewScale),n(a[1]+90*overviewScale)],floor=[lead[0],630],corner=isoCorner(floor,b),points=[a,lead,floor,corner,b];
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 const front=`M${a}L${lead}L${floor}L${corner}`;
 return {service,id,path:front+`L${b}`,front,frontLength:n(100*lengths.slice(0,3).reduce((a,b)=>a+b,0)/lengths.reduce((a,b)=>a+b,0))};
};
const runs=systemRoutes.map(wireRun);
const systemWires=runs.map(({service,id,path})=>`<g class="rk-peripheral rk-system-wire" data-context-services="${service}" data-system-link="${id}">${networkWire(path)}</g>`).join('');
const systemFrontWires=runs.filter(run=>run.front).map(({service,id,front,frontLength})=>`<g class="rk-peripheral rk-system-wire" data-context-services="${service}" data-system-link="${id}-front">${networkWire(front,frontLength)}</g>`).join('');
const sceneRaw=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" class="rk-scene" role="img" aria-labelledby="rk-title rk-description"><title id="rk-title">Un gabinete de red, pieza por pieza</title><desc id="rk-description">Gabinete de 18 unidades con puerta articulada, rieles perforados, patch panel, organizador, switch, router, bandeja óptica, servidor, UPS y distribución eléctrica. El punto Wi-Fi se conecta fuera del rack. Cada equipo se extrae, abre y muestra una conexión propia.</desc><defs>${defs}</defs><style>.rk-scene polygon,.rk-scene polyline,.rk-scene rect,.rk-scene circle,.rk-scene path{vector-effect:non-scaling-stroke}</style>
<g class="rk-ground">${face([[-800,-600,-75],[800,-600,-75],[800,750,-75],[-800,750,-75]],'none','#303030',.5)}</g>
<g class="rk-external-link" data-network-link="switch18-access">${networkWire(wifiPath)}</g>
<g class="rk-peripherals rk-peripherals-back">${systemWires}</g>
<g class="rk-cabinet">${cabinet}${mounted}${blank}<g class="rk-patching">${patching}</g>${cabinetFront}<g class="rk-door" style="--hinge-x:${hinge[0]}px;--hinge-y:${hinge[1]}px" transform="translate(${hinge.join(' ')})">${door}</g></g>
<g class="rk-external-link">${networkWire(wifiFrontPath,frontPathLength)}</g>
<g class="rk-peripherals">${systemFrontWires}${perimeter}<g class="rk-external rk-peripheral" data-context-services="101" data-system-part="access"><use href="#rk-access-full"/></g></g>
<g class="rk-context-object"><use data-rack-context="" href="#rk-switch-full"/></g>
<path class="rk-leader" data-rack-leader="" d="M220 410H440L510 370H590" fill="none" stroke="#dc2626" stroke-width=".7" stroke-dasharray="3 5"/><g class="rk-focus" style="--slot-x:${focusX}px;--slot-y:${focusY}px"><use data-rack-base="" href="#rk-switch-base"/><g class="rk-guides"><use data-rack-guides="" href="#rk-switch-guides"/></g><g class="rk-cover"><use data-rack-cover="" href="#rk-switch-cover"/></g></g>
<g class="rk-detail"><use data-rack-detail="" href="#rk-switch-detail"/></g>
<g class="rk-view-labels" fill="#c4c7cc" font-family="Arial,sans-serif" font-size="30"><text x="805" y="175" class="rk-overview-label">Switch → punto Wi-Fi</text><text x="805" y="212" class="rk-overview-label" fill="#fff">Puerto 18 · cobre</text><text x="85" y="116" class="rk-context-label">El equipo conserva su contexto.</text><path d="M805 240h115" stroke="#dc2626" stroke-width="1.2" class="rk-overview-label"/></g>
</svg>`;
// Materials carry the volume; fine strokes describe construction. The same
// neutral light reaches all models, with no full-surface filters or WebGL.
const fillPalette={'#040404':'#0b0e11','#050505':'#080b0e','#060606':'#0b0e11','#070707':'#0c1014','#080808':'#11161b','#090909':'#0c1014','#0a0a0a':'#0e1318','#0b0b0b':'#11161b','#0c0c0c':'#151b20','#0e0e0e':'#1a2026','#101010':'#2b3239','#111':'#1b2228','#111111':'#1b2228','#121212':'#424b53','#141414':'#252d34','#151515':'#3b454d','#161616':'#3d474f','#171717':'#4e5962','#181818':'#333d45','#1a1a1a':'#505d67','#1b1b1b':'#77838d','#1c1c1c':'#4c5862','#202020':'#8a969f','#222':'#53616b','#222222':'#53616b','#232323':'#55616b','#242424':'#6f7d87','#252525':'#7b8791','#262626':'#65737e','#272727':'#71808b','#2b2b2b':'#626f79','#2c2c2c':'#65737d','#303030':'#7c8a94','#333':'#71808b','#333333':'#71808b','#343434':'#82909a','#393939':'#66757f','#3b3b3b':'#84949e','#444':'#9caab3','#484848':'#a6b2ba','#555':'#a9b4bd','#595959':'#aeb9c2','#777':'#c3cbd1','#aaa':'#d3d9de','#bbb':'#d8dde1','#ccc':'#e2e6e9','#ddd':'#f0f2f3'};
const strokePalette={'#303030':'#3e4b55','#383838':'#60707c','#444':'#697985','#454545':'#697985','#555':'#71818e','#626262':'#85939e','#636363':'#85939e','#666':'#7d8c98','#686868':'#82919d','#6b6b6b':'#93a0aa','#777':'#a0adb7','#888':'#aab6c0','#898989':'#aab6c0','#8f8f8f':'#b5c0c8','#999':'#bac5cd','#aaa':'#d0d8de','#a3a3a3':'#ced7dd','#bbb':'#dce2e6','#b1b1b1':'#d5dde3','#ccc':'#eef1f3'};
const scene=sceneRaw.replace(/\b(fill|stroke)="(#[\da-f]+)"/gi,(match,kind,color)=>`${kind}="${(kind==='fill'?fillPalette:strokePalette)[color]||color}"`);
const dest=path.join(root,'src/assets/cine/isometric');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'network-rack-v8.svg'),scene);
fs.writeFileSync(path.join(dest,'network-rack-v8.json'),JSON.stringify({version:8,projection:'orthographic 30°',projectionMatrix:{x:[C,.5],y:[-C,.5],z:[0,-1]},overviewScale,externalScale:overviewScale,connections:{copper:{panelPort:9,switchPort:6},wifi:{switchPort:18,from:wifiA,to:wifiB,path:wifiPath}},equipment:'Generic explanatory geometry; dimensions do not specify a product or a client installation.',interactionReference:'Hairline cabinet: nearest rack modules extend on rails.',models:models.map(({id,label,z,scale,lift,motion,detailScale,slotX=450,slotY=-280})=>({id,label,z,scale,lift,motion,detailScale,slotX,slotY,pieceY:['radio','central'].includes(id)?550:['outlet','reader'].includes(id)?430:370,openY:id==='central'?510:['radio','injector'].includes(id)?535:473,mobilePieceY:['radio','central'].includes(id)?430:366})),bytes:Buffer.byteLength(scene)},null,2));
console.log(JSON.stringify({models:models.length,bytes:Buffer.byteLength(scene),svg:path.join(dest,'network-rack-v8.svg')}));
