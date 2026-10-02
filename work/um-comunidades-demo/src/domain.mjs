export const STORAGE_KEY='um-comunidades-demo:v1';
export const MAX_ROWS=2000,MAX_FILE_BYTES=3*1024*1024;
export const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function parseAmount(v){
 if(typeof v==='number') return Number.isFinite(v)&&v>=0&&v<=1e8?Math.round(v*100)/100:null;
 let s=String(v??'').trim().replace(/^(?:ARS|\$)\s*/i,'').replace(/\s/g,'');
 if(!s)return null;
 if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s=s.replace(/\./g,'').replace(',','.');
 else if(/^\d+(,\d{1,2})$/.test(s))s=s.replace(',','.');
 else if(!/^\d+(\.\d{1,2})?$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)&&n>=0&&n<=1e8?Math.round(n*100)/100:null;
}
export function parseDate(v){
 if(v===''||v==null)return '';
 if(typeof v==='number'){if(v<1||v>109574)return null;return new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10);}
 let s=String(v).trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/),y,mo,d;
 if(m)[,y,mo,d]=m;else{m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(!m)return null;[,d,mo,y]=m;}
 const date=new Date(Date.UTC(+y,+mo-1,+d));return date.getUTCFullYear()===+y&&date.getUTCMonth()===+mo-1&&date.getUTCDate()===+d?date.toISOString().slice(0,10):null;
}
export const statusMap={vigente:'Vigente',activa:'Vigente',activo:'Vigente',suspendida:'Suspendida',suspendido:'Suspendida',vencida:'Vencida',vencido:'Vencida',pendiente:'Pendiente'};
export function validateRows(rows,mapping,existing){
 const seen=new Set(existing.map(x=>norm(x.license))),emails=new Set(existing.map(x=>norm(x.email)).filter(Boolean));
 return rows.map((r,i)=>{
 const get=k=>mapping[k]===undefined||mapping[k]===''?'':r[Number(mapping[k])]??'';
 const name=String(get('name')).trim(),license=String(get('license')).trim().toUpperCase(),email=String(get('email')).trim(),amount=parseAmount(get('amount')),status=statusMap[norm(get('status'))],validUntil=parseDate(get('validUntil'));
 const errors=[];
 if(r.some(v=>String(v).startsWith('__FORMULA__')||/^[=+@\t\r]/.test(String(v))))errors.push('Contiene una fórmula o contenido no admitido');
 if(name.length<2||name.length>100)errors.push('Nombre requerido (2–100 caracteres)');
 if(!/^[A-Z0-9ÁÉÍÓÚÜÑ][A-Z0-9ÁÉÍÓÚÜÑ .\/-]{0,39}$/.test(license))errors.push('Matrícula inválida');
 if(seen.has(norm(license)))errors.push('Matrícula duplicada');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.push('Correo inválido');
 if(email&&emails.has(norm(email)))errors.push('Correo duplicado');
 if(amount===null)errors.push('Importe inválido o negativo');
 if(!status)errors.push('Estado: Vigente, Suspendida, Vencida o Pendiente');
 if(validUntil===null)errors.push('Fecha inválida (dd/mm/aaaa)');
 if(!errors.length){seen.add(norm(license));if(email)emails.add(norm(email));}
 return {row:i+2,data:{name,license,email,amount,status,validUntil:validUntil||''},errors};
 });
}
export function suggestMapping(headers){
 const aliases={name:['nombre','nombre completo','apellido y nombre'],license:['matricula','nro matricula','numero de matricula'],email:['correo','email','correo electronico'],amount:['cuota','importe','saldo','importe cuota'],status:['estado','estado de matricula','estado matricula'],validUntil:['vigencia','vigente hasta','vencimiento','fecha de vigencia']};
 return Object.fromEntries(Object.entries(aliases).map(([k,list])=>[k,headers.findIndex(h=>list.includes(norm(h)))<0?'':String(headers.findIndex(h=>list.includes(norm(h))))]));
}
export function safeCsv(rows){return '\uFEFF'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}
export const uid=p=>p+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase();
export const stamp=()=>new Date().toISOString();
export function seed(){
 return {version:1,members:[
 {id:'m1',name:'Ana Lucía Ruiz',license:'MP-1042',email:'ana.ruiz@example.test',amount:18500,status:'Vigente',validUntil:'2027-03-31'},
 {id:'m2',name:'Martín Aguirre',license:'MP-1043',email:'martin@example.test',amount:0,status:'Vigente',validUntil:'2027-03-31'},
 {id:'m3',name:'Camila Torres',license:'MP-1044',email:'camila@example.test',amount:37000,status:'Suspendida',validUntil:'2026-12-31'},
 {id:'m4',name:'Julián Benítez',license:'MP-1045',email:'julian@example.test',amount:18500,status:'Vencida',validUntil:'2026-08-31'},
 {id:'m5',name:'Valentina Díaz',license:'MP-1046',email:'valentina@example.test',amount:0,status:'Vigente',validUntil:'2027-06-30'},
 {id:'m6',name:'Santiago Molina',license:'MP-1047',email:'santiago@example.test',amount:18500,status:'Pendiente',validUntil:''}
 ],movements:[{id:'mov-demo-1',memberId:'m1',type:'Cuota septiembre',amount:18500,date:'2026-09-02T12:00:00Z',status:'Pago simulado'}],requests:[{id:'TRA-2026-001',memberId:'m1',type:'Constancia de matrícula',description:'Para presentar en una institución de práctica.',status:'En revisión',date:'2026-09-29T12:00:00Z',history:[{date:'2026-09-29T12:00:00Z',status:'Recibido',note:'Solicitud registrada en la demo'},{date:'2026-09-30T12:00:00Z',status:'En revisión',note:'Revisión administrativa de demostración'}]}],tickets:[{id:'CON-2026-001',memberId:'m3',type:'Consulta sobre cuotas',description:'Quisiera revisar mi saldo pendiente.',status:'Abierto',date:'2026-09-30T12:00:00Z',history:[{date:'2026-09-30T12:00:00Z',status:'Abierto',note:'Consulta recibida en la demo'}]}]};
}
export function payMember(state,id){const m=state.members.find(x=>x.id===id);if(!m||m.amount<=0)throw new Error('No hay saldo pendiente');return {...state,members:state.members.map(x=>x.id===id?{...x,amount:0}:x),movements:[{id:uid('PAG'),memberId:id,type:'Cancelación de saldo',amount:m.amount,date:stamp(),status:'Pago simulado'},...state.movements]};}
export function addImported(state,rows){if(state.members.length+rows.length>MAX_ROWS)throw new Error('El máximo es 2.000 matriculados por demo');return {...state,members:[...state.members,...rows.map(r=>({...r,id:uid('IMP')}))]};}
