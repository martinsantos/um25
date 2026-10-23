// Author-drawn parts share the accepted orthographic projection and neutral palette.
// Dimensions organize generic equipment; these are explanatory models, not shop drawings.
export function models(lib) {
  const {P,poly,line,block,front,top,side,circle,text,screw,jackBody,num,esc}=lib;
  const face=(ps,f='#131313',st='#a0a0a0',w=.65)=>poly(ps,f,st,w);
  const ring=(axis,x,y,z,r,n=48)=>Array.from({length:n},(_,i)=>{
    const a=i*Math.PI*2/n;
    return axis==='y'?[x+Math.cos(a)*r,y,z+Math.sin(a)*r]:[x+Math.cos(a)*r,y+Math.sin(a)*r,z];
  });
  function cylinder(axis,x,y,z,r,length,edge='#929292',fill='#121212') {
    const a=ring(axis,x,y,z,r),b=ring(axis,x,axis==='y'?y+length:y,axis==='z'?z+length:z,r);
    let s='';
    for(let i=0;i<a.length;i++){
      const j=(i+1)%a.length;
      s+=face([a[i],a[j],b[j],b[i]],fill,'none',0);
    }
    s+=line([...a,a[0]],edge,.55)+face(b,fill,edge,.65);
    return s;
  }
  function fins(x,y,z,w,d,n) {
    let s=''; for(let i=0;i<n;i++)s+=block(x-w/2+i*w/(n-1),y,z,1.3,d,9,'#282828','#0e0e0e','#898989'); return s;
  }
  const ports=(x,y,z,n,spacing=19)=>Array.from({length:n},(_,i)=>front(x+i*spacing,y,z,`<g data-jack="${i+1}">${jackBody}</g>`)).join('');
  const layer=(body,cover,inner='',guides='')=>`<g class="iso-assembly">${body}<g class="iso-internals">${inner}</g><g class="iso-guides">${guides}</g><g class="iso-lid">${cover}</g></g>`;
  const zoom=(body,focus,scale=3.2)=>{const p=P(...focus);return `<g transform="translate(510 355) scale(${scale}) translate(${-p[0]} ${-p[1]})">${body}</g>`;};
  const svg=(key,body,title,description,viewBox='0 -75 1040 755')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="iso-object" role="img" aria-labelledby="${key}-title ${key}-desc"><title id="${key}-title">${esc(title)}</title><desc id="${key}-desc">${esc(description)}</desc>${body}</svg>`;

  function camera() {
    let body=block(0,-66,0,104,82,9,'#191919','#0c0c0c','#969696');
    for(const x of [-40,40])for(const y of [-97,-35])body+=top(x,y,9.2,screw(2.8));
    body+=cylinder('z',0,-67,9,19,59)+cylinder('y',0,-85,66,23,36);
    body+=block(0,-37,81,40,48,14,'#181818','#0a0a0a','#999');
    body+=face([[-57,-84.5,99],[57,-84.5,99],[57,100.5,99],[-57,100.5,99]],'#101010','#969696');
    body+=face([[-57,100.5,99],[57,100.5,99],[57,100.5,185],[-57,100.5,185]],'#0a0a0a','#ababab');
    body+=face([[57,-84.5,99],[57,100.5,99],[57,100.5,185],[57,-84.5,185]],'#131313','#ababab');
    // Optical barrel and concentric glass surfaces; the lens remains inside its housing.
    const opticsStart=body.length;
    body+=cylinder('y',0,97,142,36,7,'#b6b6b6');
    body+=front(0,104.3,142,circle(0,0,30,'#070707','#959595',.6)+circle(0,0,19.4,'#121212','#bcbcbc',.55)+circle(0,0,14,'#020202','#727272',.5)+circle(0,0,9.5,'#090909','#9b9b9b',.4));
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      body+=front(Math.cos(a)*25,105,142+Math.sin(a)*25,circle(0,0,2.1,'#1c1c1c','#c1c1c1',.4));
    }
    const optics=body.slice(opticsStart);
    for(let i=0;i<8;i++)body+=side(57.2,-40+i*15,124,`<rect x="-2" y="-9" width="4" height="18" rx="1.7" fill="#050505" stroke="#626262" stroke-width=".35"/>`);
    body+=side(57.3,52,130,screw(2.4));
    let cover=face([[-66,-98,192],[66,-98,192],[66,116,192],[-66,116,192]],'#181818','#bdbdbd');
    cover+=face([[66,-98,175],[66,116,175],[66,116,192],[66,-98,192]],'#0e0e0e','#a3a3a3');
    cover+=face([[-66,116,187],[66,116,187],[66,116,192],[-66,116,192]],'#101010','#a3a3a3');
    for(const x of [-56,56])for(const y of [-80,90])cover+=top(x,y,192.1,screw(2.3));
    let inside=block(0,18,186,74,117,2,'#101010','#050505','#8a8a8a');
    inside+=block(0,-9,188,26,27,5,'#0e0e0e','#080808','#8c8c8c')+fins(0,-9,193,22,24,6);
    for(let i=0;i<6;i++)inside+=block(-25+i*10,52,188,5,10,4,'#191919','#050505','#929292');
    inside+=line([[0,62,190],[0,83,190],[0,96,175]],'#bcbcbc',.75);
    return {
      object:svg('camera',layer(body,cover,inside),'Cámara IP de exterior','Carcasa, parasol plegado, soporte articulado, lente y doce emisores alrededor de la óptica.','0 -150 1040 830'),
      detail:svg('camera-lens',zoom(optics,[0,100,142],5.2),'Óptica de una cámara IP','Anillos concéntricos, lente protegida y emisores infrarrojos del mismo equipo.','0 -110 1040 800'),
    };
  }
  function radio() {
    let body=cylinder('z',0,-86,0,13,254,'#929292');
    for(const z of [73,171]){
      body+=block(0,-85,z,62,46,13,'#161616','#080808','#a1a1a1');
      for(const x of [-25,25])body+=front(x,-59,z+6,screw(3.5));
      body+=line([[-25,-84,z],[25,-84,z]],'#b5b5b5',.8);
    }
    body+=block(0,-48,124,54,42,65,'#111','#080808','#929292')+fins(0,-48,189,50,35,10);
    const bowlR=105,centerZ=158;
    let dish='';
    const at=(r,a)=>[Math.cos(a)*r,-6+(r*r/(bowlR*bowlR))*34,centerZ+Math.sin(a)*r];
    for(let j=0;j<5;j++){
      const r0=j*bowlR/5,r1=(j+1)*bowlR/5;
      for(let i=0;i<64;i++){
        const a=i*Math.PI/32,b=(i+1)*Math.PI/32;
        dish+=face([at(r0,a),at(r0,b),at(r1,b),at(r1,a)],j%2?'#151515':'#131313','none',0);
      }
      dish+=line(Array.from({length:65},(_,i)=>at(r1,i*Math.PI/32)),j===4?'#c4c4c4':'#535353',j===4?.8:.35);
    }
    for(let i=0;i<12;i++)dish+=line(Array.from({length:9},(_,j)=>at(j*bowlR/8,i*Math.PI/6)),'#353535',.35);
    body+=dish;
    for(const a of [Math.PI/2,Math.PI*7/6,Math.PI*11/6])body+=line([at(92,a),[0,111,centerZ]],'#a8a8a8',1.7);
    body+=cylinder('y',0,111,centerZ,13,28,'#c4c4c4');
    body+=front(0,139.1,centerZ,circle(0,0,9,'#060606','#a1a1a1',.6));
    let cover=block(0,-63,105,52,13,35,'#161616','#080808','#9c9c9c');
    cover+=front(0,-56.3,122,jackBody);
    for(const x of [-19,19])cover+=front(x,-56,122,screw(2.2));
    const inside=ports(0,-43,124,1)+line([[0,-42,115],[0,-55,96],[0,-76,86],[0,-84,48]],'#b5b5b5',1);
    const clamp=block(0,-85,30,78,49,16,'#141414','#080808','#b2b2b2')+cylinder('z',0,-86,0,13,84)+front(-31,-59,38,screw(4.6))+front(31,-59,38,screw(4.6))+line([[-31,-61,38],[-31,-105,38],[31,-105,38],[31,-61,38]],'#ababab',2.3);
    return {
      object:svg('radio',layer(body,cover,inside),'Radioenlace con reflector y alimentador','Reflector parabólico, tres soportes de alimentador, radio disipado, mástil y herrajes de ajuste.'),
      detail:svg('radio-clamp',zoom(clamp,[0,-85,40],4.5),'Herrajes de un radioenlace','Abrazadera, tornillos y mástil mantienen la orientación del conjunto.'),
    };
  }
  function detector() {
    let s=cylinder('z',0,0,0,45,7)+cylinder('z',0,0,7,42,16);
    s+=face(ring('z',0,0,23,34),'#1b1b1b','#b2b2b2');
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16,b=a+.055;
      s+=face([[Math.cos(a)*43,Math.sin(a)*43,8],[Math.cos(b)*43,Math.sin(b)*43,8],[Math.cos(b)*39,Math.sin(b)*39,19],[Math.cos(a)*39,Math.sin(a)*39,19]],'#050505','#747474',.3);
    }
    s+=top(0,0,23.3,circle(0,0,6,'#111','#818181',.6));
    s+=top(0,26,23.3,circle(0,0,1.8,'#dc2626','#dc2626',.5));
    return s;
  }
  function fire() {
    let body=block(0,-4,0,180,73,227,'#151515','#090909','#9b9b9b');
    for(const z of [12,214])for(const x of [-80,80])body+=front(x,33,227-z,screw(2.6));
    let inside=front(0,33.5,113,`<path d="M-76-96H76V96H-76Z" fill="#0b0b0b" stroke="#858585" stroke-width=".6"/>`);
    inside+=block(0,19,129,129,26,59,'#181818','#050505','#b1b1b1');
    for(let i=0;i<14;i++)inside+=front(-59+i*9,33.8,127,`<rect x="-3.8" y="-6" width="7.6" height="12" fill="#181818" stroke="#aaa" stroke-width=".4"/>${screw(1.6)}`);
    for(const x of [-41,41])inside+=block(x,13,24,68,37,65,'#171717','#0b0b0b','#939393')+front(x,32,50,text(-21,0,'BATTERY',6,'#c4c4c4'));
    inside+=line([[-61,35,122],[-70,35,116],[-70,35,87],[-39,35,82]],'#ccc',.75)+line([[59,35,122],[70,35,116],[70,35,87],[39,35,82]],'#8e8e8e',.75);
    let cover=face([[-88,35.5,0],[88,35.5,0],[88,35.5,227],[-88,35.5,227]],'#161616','#bdbdbd',.8);
    cover+=front(0,36,140,`<rect x="-60" y="-51" width="120" height="84" rx="2" fill="#090909" stroke="#929292" stroke-width=".5"/><rect x="-44" y="-38" width="88" height="31" fill="#141414" stroke="#c4c4c4" stroke-width=".45"/>${text(-37,-17,'SISTEMA NORMAL',5.2,'#c4c4c4')}${Array.from({length:5},(_,i)=>circle(-38+i*19,10,3,'#151515','#c4c4c4',.5)).join('')}${text(-39,24,'ESTADO   CONTROL',4.8,'#c4c4c4')}`);
    cover+=front(72,36,51,circle(0,0,5.4,'#111','#c4c4c4',.65)+`<path d="M0-2v4" stroke="#c4c4c4"/>`);
    cover+=front(-73,36,87,`<rect x="-2.5" y="-16" width="5" height="32" fill="#101010" stroke="#999" stroke-width=".5"/>`);
    cover+=front(-73,36,194,`<rect x="-2.5" y="-16" width="5" height="32" fill="#101010" stroke="#999" stroke-width=".5"/>`);
    return {
      object:svg('fire',layer(body,cover,inside),'Central de detección de incendio','Gabinete, interfaz de estado, bornes separados y dos baterías de respaldo.'),
      detail:svg('fire-detector',zoom(detector(),[0,0,13],5.6),'Detector óptico del sistema','Base, aberturas de entrada de aire, cámara protegida e indicador de estado.'),
    };
  }
  function iec() {
    let s=block(0,0,0,28,28,24,'#111','#070707','#a9a9a9');
    s+=front(0,14.1,12,`<path d="M-12-11H12V11H-12Z" fill="#101010" stroke="#bbb" stroke-width=".7"/><path d="M-8.8-9H8.8L11-6V9H-11V-6Z" fill="#020202" stroke="#858585" stroke-width=".5"/><rect data-iec-contact="1" x="-2" y="-6" width="4" height="5" fill="#090909" stroke="#aaa" stroke-width=".4"/><rect data-iec-contact="2" x="-8" y="2" width="5" height="3.7" fill="#090909" stroke="#aaa" stroke-width=".4"/><rect data-iec-contact="3" x="3" y="2" width="5" height="3.7" fill="#090909" stroke="#aaa" stroke-width=".4"/>`);
    return s;
  }
  function ups() {
    let body=face([[-222.5,-185,0],[222.5,-185,0],[222.5,185,0],[-222.5,185,0]],'#0c0c0c','#9f9f9f')+face([[-222.5,185,0],[222.5,185,0],[222.5,185,88.9],[-222.5,185,88.9]],'#090909','#9f9f9f')+face([[222.5,-185,0],[222.5,185,0],[222.5,185,88.9],[222.5,-185,88.9]],'#101010','#9f9f9f');
    body+=front(-95,185.1,44,`<rect x="-65" y="-26" width="130" height="52" rx="2.5" fill="#080808" stroke="#a6a6a6" stroke-width=".6"/><rect x="-54" y="-16" width="76" height="31" fill="#171717" stroke="#c4c4c4" stroke-width=".5"/>${text(-45,-1,'ONLINE',6,'#c4c4c4')}${text(-45,9,'230 V',5,'#c4c4c4')}${circle(44,0,9,'#090909','#c4c4c4',.6)}`);
    for(let j=0;j<24;j++)body+=front(49+j*6.1,185.1,44,`<rect x="-1.6" y="-25" width="3.2" height="50" rx="1.5" fill="#040404" stroke="#5a5a5a" stroke-width=".35"/>`);
    for(let j=0;j<18;j++)body+=side(222.7,-129+j*16,44,`<rect x="-2" y="-27" width="4" height="54" rx="1.8" fill="#030303" stroke="#757575" stroke-width=".35"/>`);
    for(const x of [-234,234]){
      body+=face([[x-9,185.4,0],[x+9,185.4,0],[x+9,185.4,88.9],[x-9,185.4,88.9]],'#101010','#9f9f9f');
      for(const z of [17,72])body+=front(x,185.8,z,`<rect x="-2.6" y="-4.7" width="5.2" height="9.4" rx="2.5" fill="#030303" stroke="#aaa" stroke-width=".5"/>`);
    }
    let inside='';
    for(const x of [-136,-53]){
      inside+=block(x,9,10,74,232,58,'#1b1b1b','#080808','#a1a1a1');
      for(const y of [-94,106])inside+=top(x,y,68.2,`<rect x="-26" y="-5" width="52" height="10" rx="1" fill="#0b0b0b" stroke="#9e9e9e" stroke-width=".5"/>`);
      inside+=top(x,0,68.2,text(-27,0,'BATTERY',7,'#c4c4c4'));
    }
    inside+=block(100,-15,10,152,254,3,'#0e0e0e','#080808','#8d8d8d')+fins(82,-35,23,52,92,12);
    inside+=cylinder('z',148,57,14,23,38,'#aaa');
    for(let i=0;i<8;i++)inside+=top(151,57,52.3,`<path d="M${-20+i*5} -11v22" stroke="#a9a9a9" stroke-width=".45"/>`);
    inside+=line([[-53,117,68],[-53,145,68],[13,145,68],[52,107,52]],'#c4c4c4',1);
    let cover=face([[-222.5,-185,88.9],[222.5,-185,88.9],[222.5,185,88.9],[-222.5,185,88.9]],'#161616','#b5b5b5',.8);
    cover+=face([[222.5,-185,83],[222.5,185,83],[222.5,185,88.9],[222.5,-185,88.9]],'#0c0c0c','#969696');
    for(const x of [-209,209])for(const y of [-171,0,170])cover+=top(x,y,89.1,screw(2.4));
    return {
      object:svg('ups',layer(body,cover,inside),'UPS de rack con respaldo de baterías','Frente de estado, ventilación, dos módulos de batería y electrónica de potencia.','-65 -240 1150 1010'),
      detail:svg('ups-iec',zoom(iec(),[0,3,14],9),'Salida IEC de alimentación','Tierra, fase y neutro se distinguen en una salida de tres contactos.'),
    };
  }
  function monitor() {
    let body=block(0,0,0,145,93,7,'#151515','#080808','#979797')+block(0,-14,7,22,24,43,'#1c1c1c','#080808','#a6a6a6');
    body+=block(0,-14,49,270,18,172,'#171717','#080808','#a7a7a7');
    let screen=front(0,-4.8,135,`<rect x="-127" y="-77" width="254" height="153" rx="1.4" fill="#080808" stroke="#9b9b9b" stroke-width=".55"/><path d="M-115-54H115M-64-51V63" stroke="#444" stroke-width=".5"/>${text(-114,-63,'OPERACIÓN / NOC',6.5,'#c4c4c4')}${Array.from({length:4},(_,i)=>`<path d="M-113 ${-35+i*24}h37" stroke="#999" stroke-width=".75"/><circle cx="-106" cy="${-25+i*24}" r="1.3" fill="#aaa"/>`).join('')}`);
    for(let i=0;i<3;i++)screen+=front(0,-4.7,135,`<rect x="${-48+i*55}" y="-38" width="49" height="30" fill="#121212" stroke="#626262" stroke-width=".45"/>${text(-41+i*55,-23,['RED','ENERGÍA','VIDEO'][i],4.8,'#c4c4c4')}`);
    screen+=front(0,-4.5,135,`<path d="M-47 42h20l8-22 9 32 12-20h19l8-18 10 27h58" fill="none" stroke="#c4c4c4" stroke-width="1"/><path d="M-47 56h149" stroke="#555" stroke-width=".5"/><circle cx="-2" cy="32" r="2" fill="#dc2626"/>`);
    let inner=front(0,-4,135,`<rect x="-106" y="-66" width="212" height="132" fill="#101010" stroke="#767676" stroke-width=".5"/><path d="M-90-44H90v86H-90Z" stroke="#818181" fill="none" stroke-width=".45"/>`);
    for(let i=0;i<12;i++)inner+=front(-80+i*15,-3.8,92,`<rect x="-4.3" y="-3.5" width="8.6" height="7" fill="#161616" stroke="#aaa" stroke-width=".35"/>`);
    let phone=block(0,0,0,58,8,122,'#151515','#070707','#a7a7a7');
    phone+=front(0,4.2,61,`<rect x="-24" y="-55" width="48" height="110" rx="4" fill="#0b0b0b" stroke="#969696" stroke-width=".4"/><path d="M-7-47H7" stroke="#c4c4c4" stroke-width="1.2"/><rect x="-20" y="-28" width="40" height="49" rx="2" fill="#141414" stroke="#999" stroke-width=".4"/>${text(-15,-17,'UM / SOPORTE',3.5,'#c4c4c4')}${text(-15,-5,'INCIDENTE',4,'#c4c4c4')}${text(-15,5,'ASIGNADO',4,'#c4c4c4')}<path d="M-14 13H12" stroke="#dc2626" stroke-width=".8"/>`);
    return {
      object:svg('support',layer(body,screen,inner),'Una consola de operación','Monitor, estado de sistemas y trazas operativas; interfaz conceptual de monitoreo.'),
      detail:svg('support-notice',zoom(phone,[0,0,61],3.7),'Aviso de un incidente','El mismo evento de la consola llega al teléfono del responsable.'),
    };
  }
  function sheet(z,detail=false) {
    let s=face([[-150,-105,z],[150,-105,z],[150,105,z],[-150,105,z]],'#141414','#ababab',.7);
    s+=top(0,0,z+.2,`<path d="M-137-92H137V92H-137Z" fill="none" stroke="#454545" stroke-width=".5"/>${text(-126,-72,detail?'ARQUITECTURA / DECISIÓN':'ARQUITECTURA / SISTEMAS',8,'#c4c4c4')}<path d="M-126-59H126" stroke="#8d8d8d" stroke-width=".55"/>`);
    for(let i=0;i<3;i++){
      s+=top(-82+i*82,0,z+.3,`<rect x="-34" y="-28" width="68" height="56" rx="1" fill="#101010" stroke="#a4a4a4" stroke-width=".55"/>${text(-25,-10,['ACCESO','NÚCLEO','SERVICIOS'][i],5.4,'#c4c4c4')}<path d="M-25 1h42M-25 9h36M-25 17h24" stroke="#747474" stroke-width=".5"/>`);
    }
    s+=top(0,0,z+.4,`<path d="M-48 0h14M34 0h14" stroke="#dc2626" stroke-width="1.2"/><path d="M-116 55H116M-116 66h92M-116 77h139" stroke="#777" stroke-width=".5"/>`);
    return s;
  }
  function architecture() {
    let body=sheet(0)+sheet(7)+sheet(14);
    const cover=sheet(23),inner=sheet(22,true);
    return {
      object:svg('architecture',layer(body,cover,inner),'La arquitectura se lee por capas','Hojas de diseño con acceso, núcleo, servicios y trazabilidad entre decisiones.'),
      detail:svg('architecture-decision',zoom(sheet(0,true),[0,0,0],1.5),'Una decisión dentro de la arquitectura','Una lámina del proyecto conserva relaciones y evidencia en el detalle.'),
    };
  }
  function app() {
    const plate=z=>face([[-185,-130,z],[185,-130,z],[185,130,z],[-185,130,z]],'#121212','#aaa',.65);
    const window=z=>top(0,0,z+.2,`<path d="M-173-118H173V118H-173Z" fill="none" stroke="#a1a1a1" stroke-width=".5"/><path d="M-173-89H173M-93-89V118" stroke="#747474" stroke-width=".5"/>${circle(-158,-104,3,'#141414','#aaa',.4)}${circle(-146,-104,3,'#141414','#aaa',.4)}${circle(-134,-104,3,'#141414','#aaa',.4)}${text(-77,-101,'OPERACIÓN / APLICACIÓN',7,'#c4c4c4')}${Array.from({length:5},(_,i)=>`<rect x="-159" y="${-69+i*28}" width="9" height="9" fill="#121212" stroke="#999" stroke-width=".4"/><path d="M-142 ${-64+i*28}h34" stroke="#929292" stroke-width=".6"/>`).join('')}${Array.from({length:4},(_,i)=>`<rect x="${-73+(i%2)*112}" y="${-66+Math.floor(i/2)*83}" width="98" height="69" rx="1.4" fill="#101010" stroke="#999" stroke-width=".5"/>${text(-64+(i%2)*112,-49+Math.floor(i/2)*83,['TAREAS','ESTADO','REGISTROS','ACCIONES'][i],6,'#c4c4c4')}<path d="M${-64+(i%2)*112} ${-32+Math.floor(i/2)*83}h76m-76 11h62m-62 11h47" stroke="#6d6d6d" stroke-width=".5"/>`).join('')}<path d="M-73 105H147" stroke="#666" stroke-width=".5"/><path d="M101 85H138" stroke="#dc2626" stroke-width="1.3"/>`);
    const base=plate(0)+window(0)+plate(5);
    const cover=plate(11)+window(11);
    const detail=plate(0)+window(0);
    return {object:svg('application',layer(base,cover,window(5)),'Aplicación por capas','Ventana, navegación lateral, módulos y acciones dentro de un mismo proceso.'),detail:svg('application-action',zoom(detail,[0,0,0],1.45),'Acciones de una aplicación','La información y las acciones mantienen su relación dentro del proceso.')};
  }

  function project(code='101') {
    const targets={
      '101':[-470,-252,127], '102':[518,224,181], '103':[-556,-275,245],
      '104':[229,19,53], '105':[399,-178,126], '106':[40,-114,0],
      '107':[-477,73,106], '108':[-469,-250,50],
    };
    let s=block(0,0,-22,1260,800,22,'#101010','#090909','#9a9a9a');
    // The cutaway has a real plan: IT room, meeting room, operations and circulation.
    for(let x=-570;x<=570;x+=95)s+=line([[x,-390,.1],[x,390,.1]],'#242424',.3);
    for(let y=-330;y<=330;y+=82.5)s+=line([[-620,y,.1],[620,y,.1]],'#242424',.3);
    s+=block(0,-390,0,1260,16,200,'#171717','#080808','#777');
    s+=block(-620,0,0,18,790,200,'#181818','#090909','#838383');
    s+=block(-304,-224,0,12,332,94,'#171717','#090909','#878787');
    s+=block(-455,-53,0,310,12,94,'#191919','#080808','#929292');
    // Glass partitions use frames and a lower wall; doors have a leaf and swing arc in plan.
    for(let x=-278;x<=538;x+=136){
      s+=block(x,-89,0,5,12,100,'#1b1b1b','#090909','#999');
      s+=line([[x,-89,100],[x+124,-89,100]],'#b0b0b0',.55);
      s+=line([[x,-89,10],[x+124,-89,10]],'#535353',.4);
    }
    for(const x of [-207,337]){
      s+=line([[x,-89,0],[x,-28,0]],'#a7a7a7',.65);
      const pts=Array.from({length:13},(_,i)=>[x+Math.sin(i*Math.PI/24)*61,-89+Math.cos(i*Math.PI/24)*61,.2]);
      s+=line(pts,'#555',.4);
    }
    // Rack with shelves, fan grilles and copper connections.
    s+=block(-474,-250,0,83,87,165,'#111','#080808','#a1a1a1');
    s+=front(-474,-206,80,`<rect x="-34" y="-72" width="68" height="144" fill="#080808" stroke="#777" stroke-width=".5"/>`);
    for(let i=0;i<7;i++){
      s+=front(-474,-205.6,15+i*20,`<rect x="-30" y="-7" width="60" height="14" fill="#151515" stroke="#aaa" stroke-width=".35"/>`);
      for(let j=0;j<12;j++)s+=front(-499+j*4.5,-205.5,19+i*20,`<rect x="-1.5" y="-2.2" width="3" height="4.4" fill="#020202" stroke="#6d6d6d" stroke-width=".25"/>`);
    }
    // Six equipped workstations, arranged in two banks.
    for(const x of [25,215,405])for(const y of [57,254]){
      s+=block(x,y,37,136,82,5,'#1b1b1b','#080808','#969696');
      for(const dx of [-57,57])for(const dy of [-31,31])s+=block(x+dx,y+dy,0,4,4,37,'#171717','#090909','#5e5e5e');
      s+=block(x,y-15,42,49,6,36,'#141414','#090909','#a9a9a9');
      s+=front(x,y-11.7,59,`<rect x="-20" y="-13" width="40" height="26" fill="#0c0c0c" stroke="#8b8b8b" stroke-width=".35"/><path d="M-15-7H11M-15-1H15M-15 5H6" stroke="#666" stroke-width=".4"/>`);
      s+=top(x,y+16,43,`<rect x="-22" y="-7" width="44" height="14" fill="#101010" stroke="#8e8e8e" stroke-width=".4"/><path d="M-17-3H15M-17 1H15M-17 4H8" stroke="#474747" stroke-width=".3"/>`);
      s+=block(x,y+62,0,30,31,23,'#151515','#080808','#7e7e7e');
      s+=block(x,y+73,23,30,5,25,'#151515','#080808','#8a8a8a');
    }
    // Meeting table and chairs, the NOC wall and an exterior mast remain recognizable.
    s+=block(64,-242,34,270,106,7,'#191919','#080808','#a2a2a2');
    for(const x of [-19,64,147])for(const y of [-326,-157]){
      s+=block(x,y,0,30,30,23,'#131313','#080808','#777')+block(x,y+(y<-200?-12:12),23,30,4,25,'#191919','#080808','#8e8e8e');
    }
    s+=block(409,-313,0,260,48,40,'#141414','#080808','#8d8d8d');
    for(const x of [333,409,485]){
      s+=block(x,-353,88,70,7,48,'#151515','#080808','#ababab');
      s+=front(x,-349,111,`<rect x="-30" y="-19" width="60" height="38" fill="#080808" stroke="#808080" stroke-width=".35"/><path d="M-22 7l8-10 9 16 12-21 15 8" fill="none" stroke="#bbb" stroke-width=".6"/>`);
    }
    s+=block(-481,65,45,49,17,80,'#181818','#080808','#aaa');
    s+=front(-481,74,98,`<rect x="-17" y="-22" width="34" height="25" fill="#060606" stroke="#999" stroke-width=".4"/><path d="M-12 14H12" stroke="#999" stroke-width=".6"/>`);
    for(const [x,y]of [[523,224],[-259,224],[517,-185]]){
      s+=block(x,y,166,17,35,14,'#1b1b1b','#080808','#bababa')+front(x,y+18,173,circle(0,0,4.2,'#020202','#aaa',.45));
      s+=line([[x,y-15,180],[x,y-15,196]],'#aaa',.8);
    }
    s+=cylinder('z',-553,-274,198,3.5,51,'#b7b7b7');
    s+=front(-553,-267,243,circle(0,0,16,'#131313','#c4c4c4',.6)+circle(0,0,9,'none','#777',.35));
    // Visible corridor cable tray: same plan for every service, one selected circuit.
    s+=line([[-483,-181,151],[520,-181,151],[520,320,151]],'#747474',1);
    s+=line([[-483,-170,151],[508,-170,151],[508,320,151]],'#464646',.6);
    for(let x=-440;x<=480;x+=46)s+=line([[x,-181,151],[x,-170,151]],'#666',.4);
    for(const [x,y]of [[25,57],[215,57],[405,57],[25,254],[215,254],[405,254]])s+=line([[x,-175,151],[x,y,151],[x,y,78]],'#393939',.45);
    const target=targets[code]||targets['101'];
    const selected=code==='103'?[[-553,-274,245],[-553,-340,245],[-230,-340,245]]:code==='106'?[[-300,-88,2],[610,-88,2],[610,389,2],[-300,389,2],[-300,-88,2]]:[[-474,-205,127],[-474,-175,151],[target[0],-175,151],[target[0],target[1],151],target];
    s+=line(selected,'#dc2626',1.6);
    const q=P(...target);s+=`<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="#dc2626"/><circle cx="${q[0]}" cy="${q[1]}" r="8" fill="none" stroke="#c4c4c4" stroke-width=".65"/>`;
    // Short labels aid orientation without competing with the service copy outside the SVG.
    for(const [x,y,label]of [[-514,-355,'IT'],[-82,-330,'REUNIÓN'],[123,345,'OPERACIÓN']])s+=top(x,y,.3,text(0,0,label,14,'#a4a4a4'));
    return svg('project-'+code,s,'El servicio dentro de un proyecto','Planta seccionada con sala IT, reunión y operación. El rojo recorre el sistema seleccionado.','-35 -130 1100 800');
  }
  return {camera,radio,fire,ups,monitor,architecture,app,project,svg};
}
