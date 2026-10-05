import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const C=Math.sqrt(3)/2;
let S=1.3,origin=[500,410];
const num=n=>Math.round(n*100)/100;
const P=(x,y,z)=>[num(origin[0]+(x-y)*C*S),num(origin[1]+((x+y)/2-z)*S)];
const xy=q=>q.join(' ');
const points=ps=>ps.map(p=>P(...p).join(',')).join(' ');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function poly(ps,fill='#111',stroke='#8d8d8d',w=.65,extra=''){
 return `<polygon points="${points(ps)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${extra}/>`;
}
function line(ps,stroke='#666',w=.5,extra=''){
 return `<polyline points="${points(ps)}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${extra}/>`;
}
function block(x,y,z,w,d,h,top='#151515',front='#0b0b0b',edge='#666'){
 const a=x-w/2,b=x+w/2,c=y-d/2,e=y+d/2,f=z,g=z+h;
 return poly([[a,e,f],[b,e,f],[b,e,g],[a,e,g]],front,edge,.45)
 +poly([[b,c,f],[b,e,f],[b,e,g],[b,c,g]],'#111',edge,.45)
 +poly([[a,c,g],[b,c,g],[b,e,g],[a,e,g]],top,edge,.55);
}
function front(x,y,z,content){const [a,b]=P(x,y,z);return `<g transform="matrix(${num(C*S)} ${S/2} 0 ${S} ${a} ${b})">${content}</g>`;}
function top(x,y,z,content){const [a,b]=P(x,y,z);return `<g transform="matrix(${num(C*S)} ${S/2} ${num(-C*S)} ${S/2} ${a} ${b})">${content}</g>`;}
function side(x,y,z,content){const [a,b]=P(x,y,z);return `<g transform="matrix(${num(-C*S)} ${S/2} 0 ${S} ${a} ${b})">${content}</g>`;}
const circle=(x,y,r,fill='#101010',stroke='#999',w=.5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`;
const text=(x,y,t,size=3,fill='#aaa')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" letter-spacing=".1">${esc(t)}</text>`;
const screw=(r=2)=>circle(0,0,r,'#111','#858585',.45)+circle(0,0,r*.78,'none','#393939',.35)+`<path d="M${-r*.45} 0H${r*.45}M0 ${-r*.45}V${r*.45}" stroke="#a6a6a6" stroke-width=".35" vector-effect="non-scaling-stroke"/>`;
const contact=(k)=>{
 const x=-3.57+k*1.02;
 return `<path data-contact="${k+1}" d="M${num(x)} -3.9v1.2l.2 1.55v.8" stroke="#c4c4c4" stroke-width=".23" fill="none" stroke-linejoin="round"/>`;
};
const jack=`<symbol id="um-jack" viewBox="-9 -8 18 16" overflow="visible">
 <path d="M-7.65-6.85H7.65V6.85H-7.65Z" fill="#151515" stroke="#bbb" stroke-width=".6" vector-effect="non-scaling-stroke"/>
 <path d="M-6.9-6.1H6.9V6.1H-6.9Z" fill="#101010" stroke="#686868" stroke-width=".4" vector-effect="non-scaling-stroke"/>
 <path d="M-5.45-4.4H5.45V2.65H2.05V4.8H-2.05V2.65H-5.45Z" fill="#030303" stroke="#a0a0a0" stroke-width=".5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
 <path d="M-5.05-3.85H5.05M-5.05-3.85V2.2M5.05-3.85V2.2" stroke="#393939" stroke-width=".28" fill="none"/>
 ${Array.from({length:8},(_,k)=>contact(k)).join('')}
 <path d="M-7.5-2.8l.65.8v3l-.65.8M7.5-2.8l-.65.8v3l.65.8" fill="none" stroke="#a5a5a5" stroke-width=".27"/>
 <path d="M-1.55 4.65H1.55" stroke="#555" stroke-width=".35"/>
 </symbol>`;
const sfp=`<symbol id="um-sfp" viewBox="-9 -7 18 14" overflow="visible">
 <rect x="-7.6" y="-5" width="15.2" height="10" rx=".3" fill="#171717" stroke="#b4b4b4" stroke-width=".65" vector-effect="non-scaling-stroke"/>
 <path d="M-6.6-3.7H6.6V3.5H-6.6Z" fill="#020202" stroke="#929292" stroke-width=".45" vector-effect="non-scaling-stroke"/>
 <path d="M-6.2-3.2H6.2M-6.2 3.05H6.2M-4.2 3.1v-1h8.4v1" stroke="#949494" stroke-width=".3" fill="none"/>
 <path d="M-7.45-2.6l.65.55M-7.45 0l.65.55M-7.45 2.6l.65.55M7.45-2.6l-.65.55M7.45 0l-.65.55M7.45 2.6l-.65.55" stroke="#767676" stroke-width=".25"/>
 </symbol>`;
const jackBody=jack.replace(/^<symbol[^>]*>/,'').replace(/<\/symbol>$/,'');
const sfpBody=sfp.replace(/^<symbol[^>]*>/,'').replace(/<\/symbol>$/,'');
function ear(x){
 const a=x<0?-242:222.5,b=x<0?-222.5:242;
 let s=poly([[a,119,2],[b,119,2],[b,119,42.4],[a,119,42.4]],'#111','#9a9a9a',.6);
 s+=poly([[a,116.8,2],[a,119,2],[a,119,42.4],[a,116.8,42.4]],'#181818','#777',.4);
 s+=front((a+b)/2,119.3,22.2,`<rect x="-2.55" y="-14.6" width="5.1" height="7.4" rx="2.45" fill="#050505" stroke="#777" stroke-width=".55"/><rect x="-2.55" y="7.2" width="5.1" height="7.4" rx="2.45" fill="#050505" stroke="#777" stroke-width=".55"/>`);
 return s;
}
function lid(){
 const x=222.5,y=120,z=44.45;
 let s=poly([[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],'#151515','#b1b1b1',.75);
 s+=poly([[-x,y,z-5],[x,y,z-5],[x,y,z],[-x,y,z]],'#0c0c0c','#8c8c8c',.55);
 s+=poly([[x,-y,z-5],[x,y,z-5],[x,y,z],[x,-y,z]],'#0f0f0f','#858585',.55);
 s+=line([[-x+2,-y+2,z+.2],[x-2,-y+2,z+.2],[x-2,y-2,z+.2]],'#4b4b4b',.4);
 s+=line([[-x+2,y-2,z+.2],[-x+2,-y+2,z+.2]],'#4b4b4b',.4);
 // Fold returns sit inside the perimeter, with corner relief cuts.
 for(const xx of [-213,213]){
  s+=line([[xx,-112,z+.35],[xx,109,z+.35]],'#464646',.35);
  for(const yy of [-109,0,105])s+=top(xx,yy,z+.55,screw(1.7));
 }
 for(const xx of [-130,-90,-50,-10,30,70,110,150]){
  s+=top(xx,-72,z+.4,`<rect x="-11" y="-1.6" width="22" height="3.2" rx="1.55" fill="#080808" stroke="#3f3f3f" stroke-width=".38"/>`);
 }
 // A folded corner is shown as a return, rather than an extra decoration.
 s+=line([[214,109,z],[222.5,117,z],[222.5,117,z-5]],'#a6a6a6',.55);
 s+=line([[-214,-109,z],[-222.5,-117,z],[-222.5,-117,z-5]],'#757575',.45);
 return s;
}
function internals(){
 let s=poly([[-210,-106,8],[210,-106,8],[210,105,8],[-210,105,8]],'#0e0e0e','#555',.45);
 s+=poly([[-206,-102,8.4],[206,-102,8.4],[206,101,8.4],[-206,101,8.4]],'none','#2e2e2e',.3);
 for(let i=0;i<12;i++){
  const x=-154+i*20;
  s+=line([[x,79,8.6],[x,49,8.6],[x+8,41,8.6],[x+8,17,8.6]],'#353535',.35);
  s+=top(x+8,17,8.7,circle(0,0,.65,'#060606','#575757',.35));
  s+=block(x,78,9,16,20,13,'#191919','#111','#696969');
  s+=line([[x-6,74,22.2],[x+6,74,22.2]],'#959595',.4);
 }
 for(let chip=0;chip<3;chip++){
  const x=-105+chip*55,y=-8;
  s+=block(x,y,10,38,37,7,'#111','#090909','#555');
  s+=block(x,y,17,34,33,4,'#151515','#0d0d0d','#858585');
  for(let fin=0;fin<8;fin++)s+=block(x-14+fin*4,y,21,.8,32,8,'#343434','#181818','#858585');
  for(let j=0;j<6;j++){
   s+=line([[x-18,-29+j*6,12],[x-23,-29+j*6,12]],'#858585',.4);
   s+=line([[x+18,-29+j*6,12],[x+23,-29+j*6,12]],'#858585',.4);
  }
 }
 for(let c=0;c<4;c++){
  const x=111+c*23;
  s+=block(x,81,9,17.2,49,13,'#171717','#080808','#818181');
  for(let j=0;j<5;j++)s+=top(x,64+j*5,22.3,`<rect x="-5.2" y="-.55" width="10.4" height="1.1" fill="#070707" stroke="#555" stroke-width=".2"/>`);
  s+=top(x,92,22.3,`<path d="M-4.5-2.5H4.5V2.5H-4.5Z" fill="#090909" stroke="#777" stroke-width=".3"/>`);
 }
 s+=block(145,-53,9,104,74,21,'#141414','#0b0b0b','#777');
 for(let j=0;j<8;j++)s+=top(109+j*10,-52,30.5,`<rect x="-1.1" y="-24" width="2.2" height="48" rx="1" fill="#060606" stroke="#444" stroke-width=".25"/>`);
 for(const x of [-202,202])for(const y of [-96,95])s+=top(x,y,9.1,screw(1.7));
 for(let j=0;j<9;j++)s+=top(-162+j*28,-70,9.3,`<rect x="-5.3" y="-2" width="10.6" height="4" fill="#121212" stroke="#727272" stroke-width=".35"/><path d="M-3-2v4M0-2v4M3-2v4" stroke="#4a4a4a" stroke-width=".28"/>`);
 return s;
}
function switchSVG(){
 let floor=poly([[-222.5,-120,0],[222.5,-120,0],[222.5,120,0],[-222.5,120,0]],'#090909','#737373',.5);
 floor+=poly([[-222.5,-120,0],[222.5,-120,0],[222.5,-120,43],[-222.5,-120,43]],'#0b0b0b','#555',.5);
 floor+=line([[-217,-114,3],[-217,114,3],[217,114,3],[217,-114,3]],'#363636',.35);
 let shell=poly([[-222.5,120,0],[222.5,120,0],[222.5,120,43],[-222.5,120,43]],'#0b0b0b','#a2a2a2',.7);
 shell+=poly([[222.5,-120,0],[222.5,120,0],[222.5,120,43],[222.5,-120,43]],'#101010','#8d8d8d',.6);
 shell+=line([[-220,120.1,2],[220,120.1,2]],'#3e3e3e',.4);
 shell+=line([[222.6,-116,40.8],[222.6,116,40.8]],'#484848',.4);
 for(let j=0;j<18;j++)shell+=side(222.7,-80+j*10,22,`<rect x="-1.7" y="-11.5" width="3.4" height="23" rx="1.65" fill="#030303" stroke="#656565" stroke-width=".45"/>`);
 for(const y of [-110,108])shell+=side(222.9,y,21,screw(1.7));
 for(let col=0;col<12;col++)for(let row=0;row<2;row++){
  const id=col*2+row+1,x=-153+col*20.2,z=12+row*17.6;
  shell+=front(x,120.6,z,`<g data-port="${id}">${jackBody}${id===6?'<path d="M-8.4-7.6H8.4V7.6H-8.4Z" fill="none" stroke="#dc2626" stroke-width=".8" vector-effect="non-scaling-stroke"/>':''}</g>`);
  if(row===1)shell+=front(x-2.6,121,40.3,text(0,0,String(id).padStart(2,'0'),2.55,'#9f9f9f'));
  else shell+=front(x-2.6,121,3.2,text(0,0,String(id).padStart(2,'0'),2.55,'#888'));
 }
 for(let i=0;i<4;i++){
  shell+=front(111+i*23,120.7,22.4,`<g data-sfp="${i+1}">${sfpBody}${text(-4.8,-7,'SFP '+(i+1),2.3,'#909090')}</g>`);
 }
 shell+=front(-200,121,22,`<path d="M-4.1-2H4.1L3.3 2.3H-3.3Z" fill="#030303" stroke="#999" stroke-width=".4"/><path d="M-2.9-.7H2.9" stroke="#666" stroke-width=".45"/>${text(-9,-8,'CONSOLE',2.45,'#999')}`);
 shell+=front(-199,121,10,circle(-6,0,.95,'#080808','#777',.35)+circle(0,0,.95,'#080808','#999',.35)+circle(6,0,.95,'#080808','#777',.35));
 shell+=front(-211,121,35.9,text(0,0,'NETWORK',2.8,'#b4b4b4'));
 shell+=ear(-232)+ear(232);
 let guides='';
 for(const [x,y]of [[-213,-109],[213,-109],[-213,105],[213,105]]){
  const p=P(x,y,44.45);guides+=`<path d="M${p[0]} ${p[1]}l95-190" stroke="#3c3c3c" stroke-width=".45" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"/>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -75 1040 755" class="iso-object" id="switch-diagram" role="img" aria-labelledby="switch-title switch-description"><title id="switch-title">Switch de acceso isométrico</title><desc id="switch-description">Un solo switch de rack con tapa plegada, electrónica representativa, 24 jacks RJ45 en dos filas, cuatro alojamientos SFP, consola, ranuras de ventilación y orejas con agujeros de montaje. El puerto 06 se señala en rojo.</desc><g class="iso-assembly">${floor}<g class="iso-internals">${internals()}</g>${shell}<g class="iso-guides">${guides}</g><g class="iso-lid">${lid()}</g></g></svg>`;
}
function macroSVG(){
 // The same eight-contact, latch-down opening becomes the isolated detail.
 const scale=21,cx=545,cy=372;
 const p=(x,y,z)=>[num(cx+(x-y)*C*scale),num(cy+((x+y)/2-z)*scale)];
 const pp=ps=>ps.map(q=>p(...q).join(',')).join(' ');
 const face=(ps,f,st='#9d9d9d',w=.7)=>`<polygon points="${pp(ps)}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round"/>`;
 let s=face([[-7.65,-10,13.72],[7.65,-10,13.72],[7.65,9,13.72],[-7.65,9,13.72]],'#151515');
 s+=face([[7.65,-10,0],[7.65,9,0],[7.65,9,13.72],[7.65,-10,13.72]],'#0e0e0e','#929292');
 s+=face([[-7.65,9,0],[7.65,9,0],[7.65,9,13.72],[-7.65,9,13.72]],'#111','#bababa');
 const f=p(0,9.03,6.86);
 s+=`<g transform="matrix(${num(C*scale)} ${scale/2} 0 ${scale} ${f[0]} ${f[1]})">${jackBody}</g>`;
 const tf=p(0,-1,13.74);
 s+=`<g transform="matrix(${num(C*scale)} ${scale/2} ${num(-C*scale)} ${scale/2} ${tf[0]} ${tf[1]})"><path d="M-7.1-8H7.1V9H-7.1Z" fill="none" stroke="#4b4b4b" stroke-width=".035"/><path d="M-5-5.3H-2.1v3H-5ZM2.1-5.3H5v3H2.1Z" fill="#080808" stroke="#999" stroke-width=".035"/><path d="M-5-5.3v1.8h2.9M2.1-5.3v1.8H5" fill="none" stroke="#aaa" stroke-width=".035"/></g>`;
 const sf=p(7.68,0,6.86);
 s+=`<g transform="matrix(${num(-C*scale)} ${scale/2} 0 ${scale} ${sf[0]} ${sf[1]})"><path d="M-8-5.6H8V5.6H-8Z" fill="none" stroke="#444" stroke-width=".035"/><path d="M-4.8-1.2H-2V2H-4.8ZM2-1.2H4.8V2H2Z" fill="#080808" stroke="#666" stroke-width=".035"/></g>`;
 // One fine leader describes the aperture without drawing another object.
 const a=p(-4.2,9.5,10.3);
 s+=`<path d="M${a[0]} ${a[1]}l-63-36H96" fill="none" stroke="#6e6e6e" stroke-width=".7"/><circle cx="${a[0]}" cy="${a[1]}" r="2.5" fill="#dc2626"/><text x="96" y="${num(a[1]-49)}" fill="#b9b9b9" font-size="26" font-family="Arial,sans-serif">Ocho contactos</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 -130 900 710" class="iso-object" id="jack-diagram" role="img" aria-labelledby="jack-title jack-description"><title id="jack-title">Un jack RJ45, por dentro</title><desc id="jack-description">Conector aislado con blindaje metálico plegado, ventanas de retención, abertura con espacio para la traba y ocho contactos separados. Mismo lenguaje isométrico del switch.</desc>${s.replaceAll('href="#um-jack"','href="#um-macro-jack"')}</svg>`;
}

const {models}=await import('./isometric-models-v6.mjs');
const model=models({P,poly,line,block,front,top,side,circle,text,screw,jackBody,num,esc});
const out=process.argv[2] || path.resolve(__dirname,'../../src/assets/cine/isometric');
fs.mkdirSync(out,{recursive:true});
const hardware={
 '101':{object:switchSVG(),detail:macroSVG()},
 '102':model.camera(), '103':model.radio(), '104':model.app(),
 '105':model.monitor(), '106':model.architecture(), '107':model.fire(), '108':model.ups(),
};
const names={'101':'network','102':'security','103':'telecom','104':'software','105':'support','106':'consulting','107':'fire','108':'power'};
const report=[];
for(const [code,data]of Object.entries(hardware)){
 S=.58;origin=[510,320];const context=model.project(code);S=1.3;origin=[500,410];
 for(const [view,source]of Object.entries({...data,system:context})){
  const file=`${names[code]}-${view}.svg`;
  fs.writeFileSync(path.join(out,file),source);
  report.push({code,view,file,bytes:Buffer.byteLength(source)});
 }
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:6,kind:'authored-isometric-svg',projection:'orthographic 30 / 150 / 270 degrees',role:'service explanations; full-project cinema remains Blender',equipment:'generic explanatory models, not manufacturer CAD or client installations',sources:['https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html','https://www.te.com/en/product-2007676-1.html'],files:report},null,2));
console.log(JSON.stringify({assets:report.length,bytes:report.reduce((n,f)=>n+f.bytes,0),directory:out}));
