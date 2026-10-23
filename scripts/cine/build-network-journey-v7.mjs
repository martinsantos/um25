import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=process.argv[2]||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const assets=path.join(root,'src/assets/cine/isometric');
const body=name=>fs.readFileSync(path.join(assets,`${name}.svg`),'utf8').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/g,'');
const colors={'#151515':'#d8dde1','#0b0b0b':'#515d69','#0c0c0c':'#404d59','#0f0f0f':'#98a3ad','#111':'#697782','#101010':'#414e5c','#171717':'#b9c3cb','#181818':'#bcc6ce','#141414':'#aebbc5','#1b1b1b':'#cbd3d9','#080808':'#162330','#050505':'#172330','#090909':'#344350','#020202':'#0c1722','#030303':'#111e2a','#060606':'#192631','#191919':'#bfcbd3','#121212':'#778792','#0e0e0e':'#72828d','#070707':'#1c2a36','#343434':'#dce3e8'};
function material(source){return source.replace(/<(polygon|path|rect|circle|polyline)\b[^>]*>/g,tag=>{
 const old=tag.match(/fill="([^"]+)"/)?.[1],fill=colors[old];
 if(!fill)return tag;
 tag=tag.replace(`fill="${old}"`,`fill="${fill}"`);
 if(['#d8dde1','#b9c3cb','#bcc6ce','#aebbc5','#cbd3d9','#bfcbd3','#dce3e8'].includes(fill))tag=tag.replace(/stroke="#[a-fA-F0-9]+"/,'stroke="#7d8b96"');
 return tag;
});}
let equipment=material(body('network-object')).replaceAll('iso-assembly','nj-assembly').replaceAll('iso-internals','nj-internals').replaceAll('iso-guides','nj-guides').replaceAll('iso-lid','nj-cover');
const jack=equipment.match(/<g data-port="1">([\s\S]*?)<\/g>/)[1];
equipment=equipment.replaceAll(jack,'<use href="#nj-jack"/>');
const project=material(body('network-system')).replace(/<circle[^>]+r="8"[^>]*\/>/g,'');
const detail=material(body('network-detail')).replace(/<path d="M[^\"]+l-63-36H96"[^>]*\/>/,'').replace(/<text[^>]*>Ocho contactos<\/text>/,'').replaceAll(jack,'<use href="#nj-jack"/>');
const output=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 740" class="nj-scene" role="img" aria-labelledby="nj-title nj-desc">
<title id="nj-title">Del edificio al switch, del switch al puerto</title><desc id="nj-desc">El mismo switch de 24 RJ45 y cuatro SFP se ubica en el rack de la sala IT, se acerca para reconocer sus conexiones, abre su cubierta y muestra un jack con ocho contactos. Modelo explicativo de una instalación de oficinas.</desc>
<defs><g id="nj-jack">${jack}</g></defs>
<g class="nj-project"><g transform="translate(-510 -280)">${project}</g></g>
<g class="nj-connection" fill="none" stroke="#dc2626" stroke-width="1.5"><path d="M164 233L294 302H490"/><circle cx="164" cy="233" r="4" fill="#dc2626"/><circle cx="490" cy="302" r="4" fill="#dc2626"/></g>
<g class="nj-device"><g transform="translate(-500 -410)">
<g class="nj-shadow" fill="#000" opacity=".12" transform="translate(0 29)"><polygon points="384.6,187.4 885.6,476.6 615.4,632.6 114.4,343.4"/></g>
${equipment}</g></g>
<g class="nj-detail"><g transform="translate(-500 -270)">${detail}</g></g>
<g class="nj-port-focus" fill="none" stroke="#dc2626" stroke-width="1.2"><path d="M579 367L644 326H754"/><circle cx="579" cy="367" r="5"/><text class="nj-label" x="754" y="308" fill="#24313b" stroke="none" font-size="30" font-family="UM Sans,Arial,sans-serif">Puerto 06 · RJ45</text><path d="M846 528L977 599H1128"/><text class="nj-label" x="977" y="627" fill="#c4c7cc" stroke="none" font-size="30" font-family="UM Sans,Arial,sans-serif">4 × SFP · fibra</text></g>
</svg>`;
fs.writeFileSync(path.join(assets,'network-journey-v7.svg'),output);
console.log(JSON.stringify({file:'network-journey-v7.svg',bytes:Buffer.byteLength(output)}));
