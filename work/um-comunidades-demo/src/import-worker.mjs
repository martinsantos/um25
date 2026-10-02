import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import {MAX_FILE_BYTES,MAX_ROWS} from './domain.mjs';
function inspectZip(buffer){
 const v=new DataView(buffer); let at=-1;
 for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--)if(v.getUint32(i,true)===0x06054b50){at=i;break;}
 if(at<0)throw Error('El archivo no es un Excel .xlsx válido');
 const count=v.getUint16(at+10,true);let pos=v.getUint32(at+16,true),total=0;
 if(count>4000)throw Error('El Excel contiene demasiados elementos');
 for(let i=0;i<count;i++){
 if(pos+46>v.byteLength||v.getUint32(pos,true)!==0x02014b50)throw Error('Estructura Excel inválida');
 const size=v.getUint32(pos+24,true),len=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),flag=v.getUint16(pos+8,true);
 total+=size;if(total>25*1024*1024||size===0xffffffff)throw Error('El contenido expandido supera 25 MB');
 if(flag&1)throw Error('No se admiten archivos cifrados');
 const name=new TextDecoder().decode(new Uint8Array(buffer,pos+46,len));
 if(/vbaProject|macrosheet|externalLinks/i.test(name))throw Error('No se admiten macros ni vínculos externos');
 pos+=46+len+extra+comment;
 }
}
function clean(rows){if(rows.length>MAX_ROWS+1)throw Error('Máximo 2.000 filas de datos por hoja');if(rows.some(r=>r.length>30))throw Error('Máximo 30 columnas por hoja');if(rows.some(r=>r.some(v=>String(v??'').length>500)))throw Error('Máximo 500 caracteres por celda');return rows.filter(r=>r.some(v=>String(v??'').trim()));}
self.onmessage=async({data})=>{
 try{
 const {buffer,name}=data;if(buffer.byteLength>MAX_FILE_BYTES)throw Error('El archivo supera 3 MB');let sheets=[];
 if(/\.csv$/i.test(name)){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);const result=Papa.parse(text,{skipEmptyLines:'greedy',delimitersToGuess:[',',';','\t','|']});
 if(result.errors.length)throw Error('CSV mal formado: '+result.errors[0].message);
 sheets=[{name:'CSV',rows:clean(result.data)}];
 }else if(/\.xlsx$/i.test(name)){
 inspectZip(buffer);const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer);if(wb.worksheets.length>10)throw Error('Máximo 10 hojas');
 sheets=wb.worksheets.map(ws=>{if(ws.rowCount>MAX_ROWS+1||ws.columnCount>30)throw Error('Máximo 2.000 filas y 30 columnas por hoja');const rows=[];ws.eachRow({includeEmpty:true},row=>{const a=[];for(let i=1;i<=ws.columnCount;i++){const v=row.getCell(i).value;a.push(v&&typeof v==='object'?(v.formula||v.sharedFormula?'__FORMULA__':v instanceof Date?v.toISOString().slice(0,10):v.richText?v.richText.map(t=>t.text).join(''):v.text??''):v??'');}rows.push(a);});return {name:ws.name,rows:clean(rows)};});
 }else throw Error('Elegí un archivo .xlsx o .csv');
 sheets=sheets.filter(s=>s.rows.length);if(!sheets.length)throw Error('El archivo está vacío');postMessage({sheets});
 }catch(e){postMessage({error:e.message||'No pudimos leer el archivo'});}
};
