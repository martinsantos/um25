import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=process.env.UM_TEMPLATE_WORK||path.join(os.tmpdir(),'um-sans-template-build');
const w=Workbook.create();
const result=w.worksheets.add('Resultado'),cost=w.worksheets.add('Costeo'),p=w.worksheets.add('Parámetros'),compare=w.worksheets.add('Proveedores');
const logo=await fs.readFile(root+'/logo-screen.png');
const bounds=JSON.parse(await fs.readFile(root+'/logo-bounds.json','utf8'));
const money='#,##0.00;(#,##0.00);0.00';
const set=(s,c,v)=>{s.getRange(c).values=[[v]];};
const merge=(s,c,v)=>{s.mergeCells(c);set(s,c.split(':')[0],v);};
function base(s,widths,rows,title){
  const last=String.fromCharCode(64+widths.length);
  s.showGridLines=false;
  s.getRange(`A1:${last}${rows}`).format={font:{name:'UM Sans 2',size:12,color:'#333333'},fill:'#FFFFFF',rowHeight:27,verticalAlignment:'center'};
  widths.forEach((x,i)=>{s.getRange(`${String.fromCharCode(65+i)}1:${String.fromCharCode(65+i)}${rows}`).format.columnWidthPx=x;});
  s.getRange(`A1:${last}1`).format.rowHeight=9;
  s.getRange(`A2:${last}2`).format.rowHeight=25;
  const tail=widths.slice(-2).reduce((a,b)=>a+b,0);
  s.images.add({dataUrl:`data:image/png;base64,${logo.toString('base64')}`,anchor:{from:{row:1,col:widths.length-2,colOffsetPx:tail-204+10,rowOffsetPx:4},extent:{widthPx:204,heightPx:204*bounds.height/bounds.width}}});
  s.getRange(`A3:${last}3`).format={rowHeight:8,borders:{bottom:{style:'thin',color:'#DC2626'}}};
  s.getRange(`A4:${last}4`).format.rowHeight=8;
  merge(s,`A5:${last}5`,title);s.getRange(`A5:${last}5`).format={font:{size:20,bold:true,color:'#000000'},rowHeight:34};
}
function input(s,range){s.getRange(range).format={fill:'#F5F5F5',font:{color:'#1A56C0'},borders:{bottom:{style:'thin',color:'#DDDDDD'}}};}
function header(s,range){s.getRange(range).format={fill:'#000000',font:{size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:42,horizontalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#FFFFFF'}}};}
function rows(s,last){for(let r=14;r<=43;r++)s.getRange(`A${r}:${last}${r}`).format={rowHeight:32,fill:r%2?'#F5F5F5':'#FFFFFF',borders:{bottom:{style:'thin',color:'#DDDDDD'}}};s.freezePanes.freezeRows(13);}
base(result,[70,330,90,130,155,180],39,'Resultado del presupuesto');result.tabColor='#000000';
base(cost,[100,115,140,300,75,90,80,125,125,90,125,135],48,'Cómputo y costeo');
base(p,[320,155,25,210,110,105],34,'Parámetros del presupuesto');p.tabColor='#666666';
base(compare,[120,300,75,90,80,125,125,125,100,140,145,180],49,'Comparación de proveedores');
merge(result,'A7:B7','Cliente');merge(result,'C7:F7','Referencia / licitación');
merge(result,'A8:B8','');merge(result,'C8:F8','');
merge(result,'A10:B10','Proyecto');merge(result,'C10:D10','Fecha');merge(result,'E10:F10','Moneda de cálculo');
merge(result,'A11:B11','');merge(result,'C11:D11','');merge(result,'E11:F11','USD');
for(const c of ['A7:F7','A10:F10'])result.getRange(c).format.font={size:10,color:'#666666'};
for(const c of ['A8','C8','A11','C11'])result.getRange(c).formulas=[[`=IF('Parámetros'!B${{A8:26,C8:28,A11:27,C11:29}[c]}="","",'Parámetros'!B${{A8:26,C8:28,A11:27,C11:29}[c]})`]];
result.getRange('C11').setNumberFormat('dd/mm/yyyy');
merge(result,'A13:C13','Tipo de costo');merge(result,'D13:E13','Costo USD');set(result,'F13','Venta USD');header(result,'A13:F13');
const kinds=['Materiales','Servicios directos','Tercerizados','Logística'];
for(const [i,kind] of kinds.entries()){
  const r=14+i;merge(result,`A${r}:C${r}`,kind);merge(result,`D${r}:E${r}`,'');
  for(const [col,source] of [['D','I'],['F','K']])result.getRange(`${col}${r}`).formulas=[[`=IF(COUNTIF(Costeo!K14:K43,"Completar")>0,"Completar",IF(COUNT(Costeo!K14:K43)=0,"",SUMIF(Costeo!C14:C43,"${kind}",Costeo!${source}14:${source}43)))`]];
  result.getRange(`A${r}:F${r}`).format={rowHeight:30,fill:r%2?'#F5F5F5':'#FFFFFF',borders:{bottom:{style:'thin',color:'#DDDDDD'}}};
}
for(const [r,label] of [[20,'Venta antes de ajustes'],[21,'Imprevistos'],[22,'Bonificación'],[23,'Neto'],[24,'IVA'],[25,'Total USD'],[27,'Tipo de cambio ARS / USD'],[28,'Total ARS']])merge(result,`B${r}:E${r}`,label);
result.getRange('F20').formulas=[['=IF(COUNTIF(Costeo!K14:K43,"Completar")>0,"Completar",IF(COUNT(Costeo!K14:K43)=0,"",SUM(Costeo!K14:K43)))']];
result.getRange('F21').formulas=[['=IF(COUNT(F20,\'Parámetros\'!B16)<2,"",ROUND(F20*\'Parámetros\'!B16,2))']];
result.getRange('F22').formulas=[['=IF(COUNT(F20:F21,\'Parámetros\'!B17)<3,"",ROUND(SUM(F20:F21)*\'Parámetros\'!B17,2))']];
result.getRange('F23').formulas=[['=IF(COUNT(F20:F22)<3,"",ROUND(SUM(F20:F21)-F22,2))']];
result.getRange('F24').formulas=[['=IF(COUNT(F23,\'Parámetros\'!B18)<2,"",ROUND(F23*\'Parámetros\'!B18,2))']];
result.getRange('F25').formulas=[['=IF(COUNT(F23:F24)<2,"",ROUND(SUM(F23:F24),2))']];
result.getRange('F27').formulas=[['=IF(AND(COUNT(\'Parámetros\'!B7)=1,\'Parámetros\'!B7>0),\'Parámetros\'!B7,"")']];
result.getRange('F28').formulas=[['=IF(COUNT(F25,F27)<2,"",ROUND(F25*F27,2))']];
result.getRange('D14:F28').setNumberFormat(money);result.getRange('D14:F28').format.horizontalAlignment='right';
for(const r of [25,28])result.getRange(`B${r}:F${r}`).format={rowHeight:34,fill:'#000000',font:{bold:true,color:'#FFFFFF'},borders:{top:{style:'thin',color:'#DC2626'}}};
merge(result,'A31:F32','Uso interno. Completar Parámetros y Costeo antes de cerrar el presupuesto. Para el cliente, trasladar los renglones y exportar sólo la oferta comercial.');result.getRange('A31:F32').format={wrapText:true,font:{size:11,color:'#666666'}};
merge(result,'A34:F35','Los márgenes se calculan sobre la venta: costo / (1 − margen). La bonificación se aplica después de imprevistos; el IVA se calcula sobre el neto.');result.getRange('A34:F35').format={wrapText:true,font:{size:11,color:'#666666'}};
merge(result,'A38:F39','Si falta un dato, el total queda sin cerrar. Ingresar 0 cuando un ajuste o impuesto no corresponda.');result.getRange('A38:F39').format={wrapText:true,font:{size:11,color:'#666666'}};
const params=[[7,'Tipo de cambio ARS / USD'],[8,'Fecha del tipo de cambio'],[11,'Materiales'],[12,'Servicios directos'],[13,'Tercerizados'],[14,'Logística'],[16,'Imprevistos'],[17,'Bonificación'],[18,'IVA'],[20,'Horas por jornada'],[21,'Costo de día hombre (USD)'],[22,'Costo de hora hombre (USD)'],[26,'Cliente'],[27,'Proyecto'],[28,'Referencia / licitación'],[29,'Fecha de la oferta']];
for(const [r,label] of params){set(p,`A${r}`,label);input(p,`B${r}`);p.getRange(`A${r}:B${r}`).format.rowHeight=30;}
set(p,'B20',8);p.getRange('B22').formulas=[['=IF(OR(COUNT(B20:B21)<2,B20<=0),"",ROUND(B21/B20,2))']];p.getRange('B22').format={fill:'#FFFFFF',font:{color:'#333333'}};
for(const r of [8,29])p.getRange(`B${r}`).setNumberFormat('dd/mm/yyyy');
p.getRange('B11:B18').setNumberFormat('0.0%');for(const r of [7,21,22])p.getRange(`B${r}`).setNumberFormat(money);
for(const [r,t] of [[10,'Márgenes sobre venta'],[15,'Ajustes de la oferta'],[19,'Mano de obra'],[25,'Datos de la oferta']]){merge(p,`A${r}:B${r}`,t);p.getRange(`A${r}:B${r}`).format={font:{bold:true,color:'#000000'},borders:{bottom:{style:'thin',color:'#DC2626'}},rowHeight:34};}
merge(p,'D7:F9','Ingresar la cotización y su fecha. Los costos en ARS se convierten a USD con ese valor.');
merge(p,'D11:F14','Ingresar un margen entre 0 % y menos de 100 %. No es un recargo sobre el costo. Sólo se exige el margen del tipo de costo usado.');
merge(p,'D16:F18','Completar los tres ajustes; ingresar 0 si no corresponde. Verificar el tratamiento de IVA de cada licitación.');
merge(p,'D20:F22','DH y HH pueden tomar estas tarifas si el costo unitario queda vacío y la moneda es USD. Un costo manual tiene prioridad.');
merge(p,'A32:F34','Celdas grises: datos editables. Azul: números ingresados. Verde: fórmulas vinculadas a otra hoja. Verificar moneda, fecha y condiciones antes de presentar.');
for(const a of ['D7:F9','D11:F14','D16:F18','D20:F22','A32:F34'])p.getRange(a).format={wrapText:true,font:{size:11,color:'#666666'}};
p.getRange('B11:B14').dataValidation={rule:{type:'decimal',operator:'between',formula1:0,formula2:0.99}};
p.getRange('B16:B18').dataValidation={rule:{type:'decimal',operator:'between',formula1:0,formula2:1}};
for(const a of ['B7','B20:B21'])p.getRange(a).dataValidation={rule:{type:'decimal',operator:'greaterThanOrEqual',formula1:0}};
merge(cost,'A7:L8','Una fila por renglón y componente de costo. Sector / piso conserva el frente de trabajo; la moneda se declara en cada fila.');cost.getRange('A7:L8').format={wrapText:true,font:{size:11,color:'#666666'}};
merge(cost,'A10:L11','Completar costo unitario o usar DH / HH en USD. La cantidad puede ser 0; una fila incompleta muestra «Completar».');cost.getRange('A10:L11').format={wrapText:true,font:{size:11,color:'#666666'}};
cost.getRange('A13:L13').values=[['Renglón / código','Sector / piso','Tipo','Descripción','Unidad','Cantidad','Moneda','Costo unitario','Costo USD','Margen','Venta USD','Venta ARS']];header(cost,'A13:L13');rows(cost,'L');
cost.getRange('D14:D43').format.wrapText=true;
cost.getRange('A14:B43').setNumberFormat('@');
for(const c of ['B26:B28'])p.getRange(c).setNumberFormat('@');
cost.getRange('F14:L43').format.horizontalAlignment='right';cost.getRange('H14:L43').setNumberFormat(money);cost.getRange('J14:J43').setNumberFormat('0.0%');cost.getRange('F14:F43').setNumberFormat('0.##');
cost.getRange('C14:C43').dataValidation={rule:{type:'list',values:kinds}};cost.getRange('G14:G43').dataValidation={rule:{type:'list',values:['USD','ARS']}};
for(const a of ['F14:F43','H14:H43'])cost.getRange(a).dataValidation={rule:{type:'decimal',operator:'greaterThanOrEqual',formula1:0}};
for(let r=14;r<=43;r++){
  const empty=`COUNTA(A${r}:H${r})=0`,tariff=`IF(E${r}="DH",'Parámetros'!B21,'Parámetros'!B22)`;
  const automatic=`AND(G${r}="USD",OR(E${r}="DH",E${r}="HH"),COUNT(${tariff})=1)`;
  cost.getRange(`I${r}`).formulas=[[`=IF(${empty},"",IF(OR(A${r}="",B${r}="",D${r}="",E${r}="",COUNT(F${r})<1,COUNTIF('Parámetros'!A11:A14,C${r})<>1,AND(G${r}<>"USD",G${r}<>"ARS"),AND(COUNT(H${r})=0,NOT(${automatic}))),"Completar",IF(AND(G${r}="ARS",OR(COUNT('Parámetros'!B7)=0,'Parámetros'!B7<=0)),"Completar",ROUND(F${r}*IF(COUNT(H${r})=1,H${r},${tariff})/IF(G${r}="ARS",'Parámetros'!B7,1),2))))`]];
  cost.getRange(`J${r}`).formulas=[[`=IF(${empty},"",IF(COUNTIF('Parámetros'!A11:A14,C${r})<>1,"Completar",IF(COUNT(INDEX('Parámetros'!B11:B14,MATCH(C${r},'Parámetros'!A11:A14,0)))=0,"Completar",INDEX('Parámetros'!B11:B14,MATCH(C${r},'Parámetros'!A11:A14,0)))))`]];
  cost.getRange(`K${r}`).formulas=[[`=IF(${empty},"",IF(OR(COUNT(I${r}:J${r})<2,J${r}<0,J${r}>=1),"Completar",ROUND(I${r}/(1-J${r}),2)))`]];
  cost.getRange(`L${r}`).formulas=[[`=IF(${empty},"",IF(COUNT(K${r})=0,"Completar",IF(OR(COUNT('Parámetros'!B7)=0,'Parámetros'!B7<=0),"Falta TC",ROUND(K${r}*'Parámetros'!B7,2))))`]];
}
cost.getRange('I14:L43').format.font={color:'#15803D'};
merge(cost,'A46:L48','El resultado suma todos los frentes de trabajo. Para ampliar a más de 30 componentes, insertar filas dentro del bloque y extender las fórmulas y los rangos de Resultado.');cost.getRange('A46:L48').format={wrapText:true,font:{size:11,color:'#666666'}};
set(compare,'F7','Proveedor A');set(compare,'G7','Proveedor B');input(compare,'F8:G8');
merge(compare,'A10:L11','Comparar precios en la misma moneda y fecha por renglón. Elegir A o B, considerar stock / plazo y trasladar el precio elegido al costeo con el mismo código.');compare.getRange('A10:L11').format={wrapText:true,font:{size:11,color:'#666666'}};
compare.getRange('A13:L13').values=[['Código','Descripción','Unidad','Cantidad','Moneda','Precio A','Precio B','Diferencia B / A','Elegir A / B','Precio elegido','Total elegido','Stock / plazo']];header(compare,'A13:L13');rows(compare,'L');
compare.getRange('B14:B43').format.wrapText=true;compare.getRange('D14:K43').format.horizontalAlignment='right';
compare.getRange('A14:C43').setNumberFormat('@');
compare.getRange('F14:K43').setNumberFormat(money);compare.getRange('H14:H43').setNumberFormat('0.0%');compare.getRange('D14:D43').setNumberFormat('0.##');
compare.getRange('I14:I43').dataValidation={rule:{type:'list',values:['A','B']}};compare.getRange('E14:E43').dataValidation={rule:{type:'list',values:['USD','ARS']}};
for(const a of ['D14:D43','F14:G43'])compare.getRange(a).dataValidation={rule:{type:'decimal',operator:'greaterThanOrEqual',formula1:0}};
for(let r=14;r<=43;r++){
  compare.getRange(`H${r}`).formulas=[[`=IF(COUNT(F${r}:G${r})<2,"",IF(F${r}=0,"Sin base",(G${r}-F${r})/F${r}))`]];
  compare.getRange(`J${r}`).formulas=[[`=IF(COUNTA(A${r}:G${r},I${r},L${r})=0,"",IF(I${r}="A",IF(COUNT(F${r})=0,"Completar",F${r}),IF(I${r}="B",IF(COUNT(G${r})=0,"Completar",G${r}),"Completar")))`]];
  compare.getRange(`K${r}`).formulas=[[`=IF(COUNTA(A${r}:G${r},I${r},L${r})=0,"",IF(OR(A${r}="",B${r}="",COUNT(D${r},J${r})<2,AND(E${r}<>"USD",E${r}<>"ARS")),"Completar",ROUND(D${r}*ROUND(J${r},2),2)))`]];
}
for(const [r,currency] of [[46,'USD'],[47,'ARS']]){merge(compare,`H${r}:J${r}`,'Total elegido '+currency);compare.getRange(`K${r}`).formulas=[[`=IF(COUNTIF(K14:K43,"Completar")>0,"Completar",IF(COUNT(K14:K43)=0,"",SUMIF(E14:E43,"${currency}",K14:K43)))`]];compare.getRange(`K${r}`).setNumberFormat(money);}
for(const s of [cost,compare])s.getRange('I14:L43').conditionalFormats.add('containsText',{text:'Completar',format:{font:{bold:true,color:'#DC2626'}}});
// Exercise the complete business calculation and restore every editable field.
const value=async(s,c)=>{const o=await w.inspect({kind:'table',range:`'${s.name}'!${c}`,tableMaxRows:1,tableMaxCols:1,maxChars:1000});return JSON.parse(o.ndjson.split('\n').find(x=>x.includes('"kind":"table"'))).values[0][0];};
for(const [c,v] of [['B7',1000],['B11',0.25],['B16',0.05],['B17',0.01],['B18',0.21],['B21',80]])set(p,c,v);
cost.getRange('A14:H14').values=[['1','Sector ficticio','Materiales','Material de prueba','un',2,'USD',100]];
assert.equal(await value(cost,'I14'),200);assert.equal(await value(cost,'K14'),266.67);assert.equal(await value(result,'F25'),335.41);assert.equal(await value(result,'F28'),335410);
set(cost,'F14',0);assert.equal(await value(cost,'K14'),0);assert.equal(await value(result,'F25'),0);
set(cost,'F14',null);assert.equal(await value(cost,'K14'),'Completar');assert.equal(await value(result,'F25'),'');
set(cost,'F14',2);set(p,'B11',null);assert.equal(await value(cost,'K14'),'Completar');set(p,'B11',0.25);
cost.getRange('A14:H14').values=[['2','Sector ficticio','Servicios directos','Jornada de prueba','DH',2,'USD',null]];set(p,'B12',0.2);assert.equal(await value(cost,'I14'),160);assert.equal(await value(cost,'K14'),200);
cost.getRange('A14:H14').values=[['1','Sector ficticio','Materiales','Material de prueba','un',2,'ARS',100000]];assert.equal(await value(cost,'I14'),200);set(p,'B7',null);assert.equal(await value(cost,'I14'),'Completar');set(p,'B7',1000);
compare.getRange('A14:G14').values=[['DEMO-1','Material de prueba','un',2,'USD',100,90]];set(compare,'I14','B');assert.equal(await value(compare,'K14'),180);assert.ok(Math.abs((await value(compare,'H14'))+0.1)<1e-10);
set(compare,'F14',0);assert.equal(await value(compare,'H14'),'Sin base');set(compare,'I14','A');assert.equal(await value(compare,'K14'),0);
// Native recalculation fixture, deliberately outside the public package.
set(compare,'F14',100);set(compare,'I14','B');
const resultHeights={6:8,7:12,8:24,9:6,10:12,11:24,12:6,13:28,18:6,19:6,26:6,29:6,30:6,31:12,32:12,33:5,34:12,35:12,36:6,37:6,38:12,39:12};
for(let r=6;r<=39;r++)result.getRange(`A${r}:F${r}`).format.rowHeight=resultHeights[r]??24;
for(let r=6;r<=34;r++)p.getRange(`A${r}:F${r}`).format.rowHeight=[6,9,23,24,30,31].includes(r)?6:r>=32?20:27;
await(await SpreadsheetFile.exportXlsx(w)).save(root+'/qa/costeo-prueba.xlsx');
for(const c of ['B7','B11:B14','B16:B18','B21','B26:B29'])p.getRange(c).clear({applyTo:'contents'});
cost.getRange('A14:H43').clear({applyTo:'contents'});
for(const c of ['A14:G43','I14:I43','L14:L43'])compare.getRange(c).clear({applyTo:'contents'});
w.recalculate();assert.equal(await value(result,'F25'),'');assert.equal(await value(compare,'K46'),'');
console.log((await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(root+'/entrega/presupuesto-interno.xlsx');
for(const s of [result,cost,p,compare]){const blob=await w.render({sheetName:s.name,range:s===p?'A1:F34':s===result?'A1:F39':'A1:L18',scale:1.5,format:'png'});await fs.writeFile(root+'/qa/costeo-'+s.name+'.png',new Uint8Array(await blob.arrayBuffer()));}
console.log('Costeo, ajustes, USD/ARS, DH, cero, faltantes y proveedores verificados; plantilla vacía restaurada.');
