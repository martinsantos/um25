import {uid,stamp,parseDate,addImported} from './domain.mjs';
export const today=()=>new Date().toISOString().slice(0,10);
export const cents=v=>Math.round(Number(v)*100);
export const remaining=c=>c.status==='Refinanciada'?0:Math.max(0,c.amountCents-c.paidCents);
export const balance=(state,id)=>state.charges.filter(c=>c.memberId===id).reduce((n,c)=>n+remaining(c),0);
export function syncLedger(state){const balances=new Map();for(const c of state.charges)balances.set(c.memberId,(balances.get(c.memberId)||0)+remaining(c));return {...state,members:state.members.map(m=>({...m,amount:(balances.get(m.id)||0)/100}))};}
function originalCharges(member){const total=cents(member.amount);if(!total)return [];const n=member.id==='m3'&&total===3700000?2:1;return Array.from({length:n},(_,i)=>({id:`CUO-${member.id}-${i+1}`,memberId:member.id,label:n===2?['Cuota septiembre','Cuota octubre'][i]:'Cuota pendiente',originalCents:Math.floor(total/n)+(i<total%n?1:0),amountCents:Math.floor(total/n)+(i<total%n?1:0),paidCents:0,status:'Pendiente',kind:'dues',dueDate:today(),planId:null,benefitId:null}));}
export function upgradeState(s){if(s.financeVersion===2&&Array.isArray(s.charges)&&Array.isArray(s.plans)&&Array.isArray(s.benefits))return syncLedger(s);const charges=s.members.flatMap(originalCharges);for(const m of s.movements){const n=cents(m.amount);charges.push({id:'HIS-'+m.id,memberId:m.memberId,label:m.type,originalCents:n,amountCents:n,paidCents:n,status:'Pagada',kind:'dues',dueDate:m.date.slice(0,10),planId:null,benefitId:null});}return syncLedger({...s,financeVersion:2,charges,plans:[],benefits:[]});}
export function appendImported(state,rows){const next=addImported(state,rows);const ids=new Set(state.members.map(m=>m.id));return syncLedger({...next,charges:[...state.charges,...next.members.filter(m=>!ids.has(m.id)).flatMap(originalCharges)]});}
export function splitCents(total,count){if(!Number.isSafeInteger(total)||total<count||![2,3,6].includes(count))throw Error('Importe o cantidad de cuotas inválidos');const base=Math.floor(total/count),rest=total%count;return Array.from({length:count},(_,i)=>base+(i<rest?1:0));}
export function monthlyDate(start,offset){const [y,m,d]=start.split('-').map(Number),last=new Date(Date.UTC(y,m+offset,0)).getUTCDate();return new Date(Date.UTC(y,m-1+offset,Math.min(d,last))).toISOString().slice(0,10);}
export function quotePlan(state,memberId,ids,count,startDate){
 if(!ids.length||new Set(ids).size!==ids.length)throw Error('Elegí al menos una cuota, sin repetirla');
 if(parseDate(startDate)!==startDate||startDate<today()||startDate>new Date(Date.now()+90*86400000).toISOString().slice(0,10))throw Error('Elegí una fecha entre hoy y los próximos 90 días');
 const source=ids.map(id=>state.charges.find(c=>c.id===id));if(source.some(c=>!c||c.memberId!==memberId||c.kind!=='dues'||c.status==='Refinanciada'||remaining(c)<=0))throw Error('Hay cuotas que ya no están disponibles para un plan');
 const total=source.reduce((s,c)=>s+remaining(c),0),parts=splitCents(total,Number(count));
 return {memberId,sourceIds:ids.slice(),count:Number(count),startDate,totalCents:total,snapshot:source.map(c=>`${c.id}:${c.amountCents}:${c.paidCents}:${c.status}`).join('|'),installments:parts.map((amountCents,i)=>({number:i+1,amountCents,dueDate:monthlyDate(startDate,i)}))};
}
export function acceptPlan(state,quote,operationId){
 if(!operationId)throw Error('La operación requiere un identificador');if(state.plans.some(p=>p.operationId===operationId))return state;
 const current=quotePlan(state,quote.memberId,quote.sourceIds,quote.count,quote.startDate);if(current.snapshot!==quote.snapshot||current.totalCents!==quote.totalCents)throw Error('Las cuotas cambiaron. Volvé a revisar el plan');
 const id=uid('PLAN'),created=stamp();const plan={...current,id,operationId,date:created,status:'Activo',history:[{date:created,note:'Plan de demostración aceptado, sin interés ni cargos adicionales'}]};
 const charges=state.charges.map(c=>quote.sourceIds.includes(c.id)?{...c,status:'Refinanciada',refinancedCents:remaining(c),refinancedBy:id}:c);
 charges.push(...current.installments.map(c=>({id:`${id}-${c.number}`,memberId:quote.memberId,label:`Cuota ${c.number} de ${quote.count}`,originalCents:c.amountCents,amountCents:c.amountCents,paidCents:0,status:'Pendiente',kind:'plan',planId:id,benefitId:null,dueDate:c.dueDate})));
 return syncLedger({...state,charges,plans:[plan,...state.plans]});
}
export function payCharges(state,memberId,allocations,operationId){
 if(!operationId)throw Error('Falta identificar la operación');if(state.movements.some(m=>m.operationId===operationId))return state;
 if(!allocations.length||new Set(allocations.map(a=>a.chargeId)).size!==allocations.length)throw Error('Selección de cuotas inválida');
 for(const a of allocations){const c=state.charges.find(c=>c.id===a.chargeId);if(!c||c.memberId!==memberId||!Number.isSafeInteger(a.amountCents)||a.amountCents<=0||a.amountCents>remaining(c))throw Error('El importe debe ser mayor a cero y no superar el saldo pendiente');}
 const total=allocations.reduce((n,a)=>n+a.amountCents,0),id=uid('PAG'),now=stamp();
 const charges=state.charges.map(c=>{const a=allocations.find(a=>a.chargeId===c.id);if(!a)return c;const paidCents=c.paidCents+a.amountCents;return {...c,paidCents,status:paidCents===c.amountCents?'Pagada':'Pago parcial'};});
 const planIds=new Set(charges.filter(c=>allocations.some(a=>a.chargeId===c.id)).map(c=>c.planId).filter(Boolean));
 const plans=state.plans.map(p=>planIds.has(p.id)?{...p,status:charges.filter(c=>c.planId===p.id).every(c=>remaining(c)===0)?'Completado':'Activo',history:[...p.history,{date:now,note:`Pago simulado registrado: ${id}`}]}:p);
 return syncLedger({...state,charges,plans,movements:[{id,operationId,memberId,type:allocations.length===1?'Pago de '+charges.find(c=>c.id===allocations[0].chargeId).label:'Pago de cuotas seleccionadas',amount:total/100,amountCents:total,date:now,status:'Pago simulado',allocations},...state.movements]});
}
export const promotions=[
 {id:'demo-regulariza-10',title:'Regularizá tu cuenta',description:'Un ejemplo de beneficio para acompañar la regularización.',percent:10,minCents:1000000,start:'2026-10-01',end:'2026-12-31',importOnly:false},
 {id:'demo-bienvenida-5',title:'Bienvenida a la comunidad',description:'Un ejemplo para probar con un perfil importado.',percent:5,minCents:500000,start:'2026-10-01',end:'2026-12-31',importOnly:true},
 {id:'demo-septiembre-15',title:'Beneficio de septiembre',description:'Este ejemplo permite ver cómo se informa una promoción vencida.',percent:15,minCents:1,start:'2026-09-01',end:'2026-09-30',importOnly:false}
];
export function quotePromotion(state,memberId,promotionId,at=today()){
 const promo=promotions.find(p=>p.id===promotionId);if(!promo)throw Error('Beneficio desconocido');const member=state.members.find(m=>m.id===memberId);let reason='';
 if(at<promo.start)reason='Todavía no comenzó';else if(at>promo.end)reason='Promoción vencida';else if(state.benefits.some(b=>b.memberId===memberId))reason='Este perfil ya utilizó un beneficio';else if(promo.importOnly&&!member?.id.startsWith('IMP-'))reason='Disponible sólo para perfiles importados';
 const eligible=state.charges.filter(c=>c.memberId===memberId&&c.kind==='dues'&&c.status==='Pendiente'&&c.paidCents===0&&!c.benefitId&&remaining(c)>0),subtotal=eligible.reduce((n,c)=>n+c.amountCents,0);
 if(!reason&&!eligible.length)reason='No hay cuotas originales elegibles sin pagos';if(!reason&&subtotal<promo.minCents)reason='El saldo elegible no alcanza el mínimo';
 const allocations=eligible.map(c=>({chargeId:c.id,beforeCents:c.amountCents,discountCents:Math.round(c.amountCents*promo.percent/100)}));const discount=allocations.reduce((n,c)=>n+c.discountCents,0);
 return {promotionId,memberId,promo,eligible:!reason,reason,allocations,subtotalCents:subtotal,discountCents:discount,finalCents:subtotal-discount,snapshot:eligible.map(c=>`${c.id}:${c.amountCents}:${c.paidCents}:${c.status}:${c.benefitId}`).join('|')};
}
export function applyPromotion(state,quote,operationId,at=today()){
 if(!operationId)throw Error('Falta identificar la operación');if(state.benefits.some(b=>b.operationId===operationId))return state;
 const current=quotePromotion(state,quote.memberId,quote.promotionId,at);if(!current.eligible)throw Error(current.reason);if(current.snapshot!==quote.snapshot||current.finalCents!==quote.finalCents)throw Error('Las cuotas cambiaron. Revisá nuevamente el beneficio');
 const id=uid('BEN'),benefit={...current,id,operationId,date:stamp()};
 const charges=state.charges.map(c=>{const a=current.allocations.find(a=>a.chargeId===c.id);return a?{...c,amountCents:c.amountCents-a.discountCents,benefitId:id,discountCents:a.discountCents}:c});
 return syncLedger({...state,charges,benefits:[benefit,...state.benefits]});
}
export const QR_PAYLOAD='UM DEMO';
