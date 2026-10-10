import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=process.env.UM_TEMPLATE_WORK||path.join(os.tmpdir(),'um-sans-template-build');
const repo=process.env.UM_TEMPLATE_REPO||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
await fs.mkdir(root+'/entrega',{recursive:true});
await fs.mkdir(root+'/qa',{recursive:true});
const wb=Workbook.create();const s=wb.worksheets.add('Oferta económica');s.showGridLines=false;s.tabColor='#000000';
const set=(a,v)=>s.getRange(a).values=[[v]];
const merge=(a,v)=>{s.mergeCells(a);if(v!==undefined)set(a.split(':')[0],v);};
const fmt=(a,v)=>s.getRange(a).format=v;
fmt('A1:F38',{font:{name:'UM Sans 2',size:11,color:'#333333'},verticalAlignment:'center',fill:'#FFFFFF'});
for(const [i,w] of [42,240,54,48,116,124].entries())s.getRange(`${String.fromCharCode(65+i)}1:${String.fromCharCode(65+i)}38`).format.columnWidth=(w-5)/7;
const heights={1:9,2:25,3:8,4:8,5:30,6:8,7:12,8:22,9:5,10:12,11:22,12:10,13:28,29:8,30:20,31:20,32:26,33:8,34:14,35:24,36:24,37:8,38:12};
for(let r=1;r<=38;r++)s.getRange(`A${r}:F${r}`).format.rowHeight=heights[r]??26;
merge('A2:D2','[Referencia de la oferta]');fmt('A2:D2',{font:{size:9,color:'#666666'}});
const logo=await fs.readFile(`${root}/logo-screen.png`);
const bounds=JSON.parse(await fs.readFile(`${root}/logo-bounds.json`,'utf8'));
const brandWidth=Math.round(234*54/62);
s.images.add({dataUrl:`data:image/png;base64,${logo.toString('base64')}`,anchor:{from:{row:1,col:4,colOffsetPx:243-brandWidth,rowOffsetPx:4},extent:{widthPx:brandWidth,heightPx:brandWidth*bounds.height/bounds.width}}});
fmt('A3:F3',{borders:{bottom:{style:'thin',color:'#DC2626'}}});
merge('A5:F5','Oferta económica');fmt('A5:F5',{font:{size:20,bold:true,color:'#000000'}});
for(const [a,t] of [['A7:B7','Cliente'],['C7:F7','Licitación o expediente'],['A10:B10','Proyecto'],['C10:D10','Fecha'],['E10:F10','Moneda']]){merge(a,t);fmt(a,{font:{size:9,color:'#666666'}});}
for(const [a,t] of [['A8:B8','[Organización]'],['C8:F8','[Referencia]'],['A11:B11','[Proyecto]'],['C11:D11',null],['E11:F11',null]]){merge(a,t);fmt(a,{fill:'#F5F5F5',borders:{bottom:{style:'thin',color:'#DDDDDD'}}});}
s.getRange('C11').setNumberFormat('dd/mm/yyyy');s.getRange('E11').dataValidation={rule:{type:'list',values:['ARS','USD','EUR']}};
s.getRange('A13:F13').values=[['Ítem','Descripción','Cant.','Un.','Precio unitario','Importe']];
fmt('A13:F13',{fill:'#000000',font:{size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#FFFFFF'}}});
fmt('B13',{horizontalAlignment:'left'});
for(let r=14;r<=28;r++){
  set(`A${r}`,r-13);
  fmt(`A${r}:F${r}`,{fill:r%2===0?'#FFFFFF':'#F5F5F5',borders:{bottom:{style:'thin',color:'#DDDDDD'}}});
  fmt(`A${r}`,{horizontalAlignment:'center',font:{size:10,color:'#666666'}});
  fmt(`B${r}`,{wrapText:true});fmt(`C${r}:F${r}`,{horizontalAlignment:'right'});fmt(`D${r}`,{horizontalAlignment:'center'});
  s.getRange(`F${r}`).formulas=[[`=IF(COUNTA(B${r}:E${r})=0,"",IF(OR(B${r}="",COUNT(C${r},E${r})<2),"Completar",ROUND(C${r}*ROUND(E${r},2),2)))`]];
}
s.getRange('C14:C28').setNumberFormat('0.##');s.getRange('E14:F32').setNumberFormat('#,##0.00');
for(const r of ['C14:C28','E14:E28','F31'])s.getRange(r).dataValidation={rule:{type:'decimal',operator:'greaterThanOrEqual',formula1:0}};
for(const [r,t] of [[30,'Subtotal'],[31,'Impuestos'],[32,'Total de la oferta']]){merge(`D${r}:E${r}`,t);fmt(`D${r}:F${r}`,{horizontalAlignment:'right'});}
s.getRange('F30').formulas=[['=IF(COUNTIF(F14:F28,"Completar")>0,"Completar",IF(COUNT(F14:F28)=0,"",SUM(F14:F28)))']];
s.getRange('F32').formulas=[['=IF(COUNT(F30:F31)<2,"",ROUND(SUM(F30:F31),2))']];
fmt('F31',{fill:'#F5F5F5',borders:{bottom:{style:'thin',color:'#DDDDDD'}}});
fmt('D32:F32',{fill:'#000000',font:{bold:true,color:'#FFFFFF'},borders:{top:{style:'medium',color:'#DC2626'}}});
merge('A30:C32','Completar el importe de impuestos. Ingresar 0 si no corresponde.');fmt('A30:C32',{font:{size:9,color:'#666666'},wrapText:true,verticalAlignment:'top'});
merge('A34:F34','Condiciones comerciales');fmt('A34:F34',{font:{bold:true,color:'#000000'}});
merge('A35:F35','Validez: [Completar]    Forma de pago: [Completar]');merge('A36:F36','Entrega: [Completar el plazo y lugar]');
fmt('A35:F36',{wrapText:true});
merge('A38:F38','ULTIMA MILLA S.A. · ultimamilla.com.ar');fmt('A38:F38',{font:{size:9,color:'#666666'},borders:{top:{style:'thin',color:'#DDDDDD'}}});
s.getRange('F14:F30').conditionalFormats.add('containsText',{text:'Completar',format:{font:{bold:true,color:'#DC2626'}}});
s.freezePanes.freezeRows(13);
// Exercise complete, zero, partial, large and decimal amounts before restoring a blank template.
const value=async a=>{const result=await wb.inspect({kind:'table',range:`'Oferta económica'!${a}`,tableMaxRows:1,tableMaxCols:1,maxChars:1000});return JSON.parse(result.ndjson.split('\n').find(x=>x.includes('"kind":"table"'))).values[0][0];};
s.getRange('B14:E14').values=[['Instalación de equipos y verificación funcional',2,'u.',1250.555]];
set('F31',0);assert.equal(await value('F14'),2501.12);assert.equal(await value('F32'),2501.12);
s.getRange('B21:E21').values=[['Servicio incluido',0,'u.',500]];assert.equal(await value('F21'),0);
s.getRange('B28:E28').values=[['Servicio de gran importe',1,'u.',12345678.90]];
assert.equal(await value('F30'),12348180.02);assert.equal(await value('F32'),12348180.02);
set('C28',null);assert.equal(await value('F28'),'Completar');assert.equal(await value('F30'),'Completar');assert.equal(await value('F32'),'');
for(const a of ['B14:E28','F31'])s.getRange(a).clear({applyTo:'contents'});
wb.recalculate();assert.equal(await value('F30'),'');assert.equal(await value('F32'),'');
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:20},maxChars:1500})).ndjson);
console.log('Formulas verified: rounding, zero, first/middle/last row, incomplete row, totals and blank reset.');
let image=await wb.render({sheetName:s.name,range:'A1:F38',scale:1.5,format:'png'});
await fs.writeFile(`${root}/qa/excel-corregido.png`,new Uint8Array(await image.arrayBuffer()));
await (await SpreadsheetFile.exportXlsx(wb)).save(`${root}/entrega/oferta-economica.xlsx`);
// Disposable example for native recalculation and print QA. Never delivered as real quote data.
s.getRange('B14:E16').values=[['Instalación de equipos y verificación funcional',2,'u.',1250.555],['Servicio de configuración y documentación técnica',3,'hs',450],['Prueba de importes de dos cifras',12,'u.',120.25]];
set('F31',210);set('A8','Ejemplo de maquetación');set('C8','DATOS FICTICIOS');set('A11','Prueba de impresión');set('C11',new Date('2026-10-08T12:00:00Z'));set('E11','ARS');
wb.recalculate();assert.equal(await value('F32'),5504.12);
await(await SpreadsheetFile.exportXlsx(wb)).save(`${root}/qa/prueba-economica.xlsx`);
await fs.writeFile(`${root}/qa/excel-checks.json`,JSON.stringify({expectedSubtotal:5294.12,expectedTax:210,expectedTotal:5504.12,tests:7,blankTemplateRestored:true},null,2));
// Public example: same live formulas and blank-template layout, shared inputs.
const example=JSON.parse(await fs.readFile(new URL('./example-tender.json',import.meta.url),'utf8'));
s.getRange('B14:E16').values=example.items.map(i=>[i.description,i.quantity,i.unit,i.price]);
set('A2','EJEMPLO FICTICIO · SIN VALIDEZ COMERCIAL');
set('A8',example.client);set('C8',example.reference);set('A11',example.project);
set('C11',new Date(example.date+'T12:00:00Z'));set('E11',example.currency);set('F31',example.tax);
set('A35','Validez: 30 días    Forma de pago: a la aceptación');set('A36','Entrega: 10 días hábiles en las instalaciones del centro');
wb.recalculate();assert.equal(await value('F30'),5294.12);assert.equal(await value('F32'),5504.12);
await(await SpreadsheetFile.exportXlsx(wb)).save(`${root}/entrega/ejemplo-economico.xlsx`);
const sampleImage=await wb.render({sheetName:s.name,range:'A1:F38',scale:1.5,format:'png'});
await fs.writeFile(`${root}/qa/ejemplo-economico.png`,new Uint8Array(await sampleImage.arrayBuffer()));
