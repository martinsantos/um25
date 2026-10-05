import fs from 'node:fs';
import path from 'node:path';
import {bindIsometric} from '../public/cine/isometric-services-v6.js';
import {bindServiceAtlas} from '../public/cine/service-atlas-v8.js';

const assets=path.join(process.cwd(),'src/assets/cine/isometric');
const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
const stage=()=>{
 document.body.innerHTML=`<figure data-isometric data-iso-code="101" data-iso-view="1"><div data-iso-panel="system" hidden></div><div data-iso-panel="object"></div><div data-iso-panel="detail" hidden></div><h3 data-iso-title>Equipo</h3><p data-iso-description>Completo</p><b data-iso-step>02</b>${['Sistema','Equipo','Despiece','Conector'].map((name,i)=>`<button data-iso-select="${i}" data-title="${name}" data-description="Vista ${i}" aria-pressed="${i===1}">${name}</button>`).join('')}</figure>`;
 return document.querySelector('[data-isometric]');
};
afterEach(()=>{document.dispatchEvent(new Event('astro:before-swap'));jest.restoreAllMocks();});

test('all eight services retain system, object and detail assets with valid SVG and unique IDs',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(assets,'manifest.json'),'utf8'));
 expect(new Set(manifest.files.map(file=>file.code)).size).toBe(8);
 for(const file of manifest.files){
  const xml=new DOMParser().parseFromString(fs.readFileSync(path.join(assets,file.file),'utf8'),'image/svg+xml');
  expect(xml.querySelector('parsererror')).toBeNull();
  const ids=[...xml.querySelectorAll('[id]')].map(el=>el.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(xml.documentElement.getAttribute('role')).toBe('img');
 }
});
test('the access switch has distinct copper and fiber apertures and eight contacts per jack',()=>{
 const source=fs.readFileSync(path.join(assets,'network-object.svg'),'utf8');
 const xml=new DOMParser().parseFromString(source,'image/svg+xml');
 expect(xml.querySelectorAll('[data-port]').length).toBe(24);
 expect(xml.querySelectorAll('[data-sfp]').length).toBe(4);
 for(const jack of xml.querySelectorAll('[data-port]'))expect(jack.querySelectorAll('[data-contact]').length).toBe(8);
 const detail=new DOMParser().parseFromString(fs.readFileSync(path.join(assets,'power-detail.svg'),'utf8'),'image/svg+xml');
 expect(detail.querySelectorAll('[data-iec-contact]').length).toBe(3);
});
test('selection exposes one drawing, retains caption identity and returns the cover to its closed state',()=>{
 const root=stage();bindIsometric(root);const buttons=[...root.querySelectorAll('button')];
 buttons[2].click();expect(root.classList.contains('is-open')).toBe(true);
 buttons[3].click();expect(root.querySelector('[data-iso-title]').textContent).toBe('Conector');expect(root.classList.contains('is-open')).toBe(false);
 expect([...root.querySelectorAll('[data-iso-panel]')].filter(panel=>!panel.hidden).map(panel=>panel.dataset.isoPanel)).toEqual(['detail']);
 buttons[1].click();expect(root.querySelector('[data-iso-panel="object"]').hidden).toBe(false);expect(root.querySelector('[data-iso-step]').textContent).toBe('02');
 expect(buttons.filter(button=>button.getAttribute('aria-pressed')==='true')).toEqual([buttons[1]]);
});
test('keyboard moves focus and descriptions without scrolling; disposal removes old listeners',()=>{
 const root=stage(),cleanup=bindIsometric(root),buttons=[...root.querySelectorAll('button')];
 const end=new KeyboardEvent('keydown',{key:'End',cancelable:true,bubbles:true});buttons[1].dispatchEvent(end);
 expect(end.defaultPrevented).toBe(true);expect(document.activeElement).toBe(buttons[3]);expect(root.dataset.isoView).toBe('3');
 buttons[3].dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));expect(document.activeElement).toBe(buttons[0]);
 cleanup();buttons[2].click();expect(root.dataset.isoView).toBe('0');
});
test('Astro page loads bind replacement figures once after a swap',()=>{
 const old=stage();document.dispatchEvent(new Event('astro:page-load'));expect(old.dataset.bound).toBe('true');
 document.dispatchEvent(new Event('astro:before-swap'));const replacement=stage();document.dispatchEvent(new Event('astro:page-load'));
 document.dispatchEvent(new Event('astro:page-load'));replacement.querySelector('[data-iso-select="2"]').click();
 expect(replacement.dataset.isoView).toBe('2');expect(replacement.classList.contains('is-open')).toBe(true);
});
test('a slower earlier image decode cannot overwrite the last selected home service',async()=>{
 document.body.innerHTML=`<div data-service-atlas><div><img data-atlas-image src="/network.svg"></div><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><a data-atlas-link href="/servicios">Explorar <span>→</span></a><button data-atlas-view="system"></button><button data-atlas-view="object"></button>${['101','102','108'].map(code=>`<button data-atlas-service="${code}" data-object="/${code}.svg" data-system="/${code}-system.svg" data-name="Servicio ${code}" data-title="Título ${code}" data-copy="Descripción ${code}" data-context="Contexto ${code}" data-alt="Equipo ${code}" data-href="/servicios/${code}">${code}</button>`).join('')}</div>`;
 const pending=[];global.Image=class {decode(){return new Promise(resolve=>pending.push(resolve));}};
 const root=document.querySelector('[data-service-atlas]');bindServiceAtlas(root);const buttons=[...root.querySelectorAll('[data-atlas-service]')];
 buttons[1].click();buttons[2].click();pending[1]();await settle();pending[0]();await settle();
 expect(root.querySelector('img').getAttribute('src')).toBe('/108.svg');expect(root.querySelector('[data-atlas-title]').textContent).toBe('Título 108');
 expect(root.querySelector('a').getAttribute('href')).toBe('/servicios/108');expect(root.querySelector('iframe')).toBeNull();expect(root.querySelector('video')).toBeNull();
});

test('equipment events never overwrite the home service headline or summary',()=>{
 document.body.innerHTML=`<div data-service-atlas><div data-atlas-network><figure data-network-journey></figure></div><div><img data-atlas-image src="/102.svg"></div><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><a data-atlas-link>Explorar <span>→</span></a><div class="svc-story__views"><button data-atlas-view="system"></button><button data-atlas-view="object"></button></div>${['101','102'].map(code=>`<button data-atlas-service="${code}" data-object="/${code}.svg" data-system="/${code}-system.svg" data-title="Servicio ${code}" data-name="Servicio ${code}" data-copy="Descripción ${code}" data-context="Contexto ${code}" data-href="/servicios/${code}">${code}</button>`).join('')}</div>`;
 const root=document.querySelector('[data-service-atlas]'),figure=root.querySelector('figure');bindServiceAtlas(root);
 root.querySelector('[data-atlas-service="101"]').click();
 figure.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:'La pieza',copy:'24 puertos'}}));
 expect(root.querySelector('h3').textContent).toBe('Servicio 101');expect(root.querySelector('p').textContent).toBe('Descripción 101');
 root.querySelector('[data-atlas-service="102"]').click();expect(root.querySelector('[data-atlas-network]').hidden).toBe(true);
 figure.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:'Aviso tardío',copy:'No debe reemplazar'}}));
 expect(root.querySelector('h3').textContent).toBe('Servicio 102');
 root.querySelector('[data-atlas-service="101"]').click();expect(root.querySelector('[data-atlas-network]').hidden).toBe(false);
});

test('hardware home services select the shared equipment kit and keep their own CTA and captions',()=>{
 document.body.innerHTML=`<div data-service-atlas><div data-atlas-network><figure data-network-journey></figure></div><div><img data-atlas-image src="/network.svg"></div><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><a data-atlas-link>Explorar <span>→</span></a><div class="svc-story__views"></div>${['101','102','104'].map(code=>`<button data-atlas-service="${code}" ${code==='104'?'':`data-equipment-kit="${code}"`} data-title="Servicio ${code}" data-name="Servicio ${code}" data-object="/${code}.svg" data-href="/servicios/${code}">${code}</button>`).join('')}</div>`;
 const root=document.querySelector('[data-service-atlas]'),figure=root.querySelector('figure'),select=jest.fn();figure.addEventListener('um:network-service',select);bindServiceAtlas(root);
 root.querySelector('[data-atlas-service="102"]').click();expect(root.querySelector('[data-atlas-network]').hidden).toBe(false);expect(select.mock.calls[0][0].detail.code).toBe('102');expect(root.querySelector('a').getAttribute('href')).toBe('/servicios/102');
 figure.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:'Domo',copy:'Óptica y protección'}}));expect(root.querySelector('h3').textContent).toBe('Servicio 102');
 root.querySelector('[data-atlas-service="104"]').click();expect(root.querySelector('[data-atlas-network]').hidden).toBe(true);
 figure.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:'Señal tardía',copy:'Cámara'}}));expect(root.querySelector('h3').textContent).toBe('Servicio 104');
});

test('the mobile service choice updates the kit, destination and stable service message together',()=>{
 document.body.innerHTML=`<div data-service-atlas><select data-atlas-picker><option value="101">Redes</option><option value="102">Seguridad</option><option value="104">Software</option></select><div data-atlas-network><figure data-network-journey></figure></div><div><img data-atlas-image src="/104.svg"></div><h3 data-atlas-title></h3><p data-atlas-copy></p><span data-atlas-code></span><a data-atlas-link>Explorar <span>→</span></a><p data-atlas-announce></p><div class="svc-story__views"></div>${['101','102','104'].map(code=>`<button data-atlas-service="${code}" ${code==='104'?'':`data-equipment-kit="${code}"`} data-title="Resultado ${code}" data-name="Servicio ${code}" data-copy="Alcance ${code}" data-object="/${code}.svg" data-href="/servicios/${code}">${code}</button>`).join('')}</div>`;
 const root=document.querySelector('[data-service-atlas]'),picker=root.querySelector('select'),figure=root.querySelector('figure'),select=jest.fn();figure.addEventListener('um:network-service',select);
 const cleanup=bindServiceAtlas(root);picker.value='102';picker.dispatchEvent(new Event('change',{bubbles:true}));
 expect(select.mock.calls[0][0].detail.code).toBe('102');expect(root.querySelector('h3').textContent).toBe('Resultado 102');expect(root.querySelector('a').getAttribute('href')).toBe('/servicios/102');
 figure.dispatchEvent(new CustomEvent('um:network-step',{bubbles:true,detail:{title:'Óptica',copy:'Anatomía'}}));expect(root.querySelector('h3').textContent).toBe('Resultado 102');expect(root.querySelector('p').textContent).toBe('Alcance 102');
 root.querySelector('[data-atlas-service="104"]').click();expect(picker.value).toBe('104');expect(root.querySelector('[data-atlas-network]').hidden).toBe(true);
 cleanup();picker.value='101';picker.dispatchEvent(new Event('change',{bubbles:true}));expect(root.querySelector('h3').textContent).toBe('Resultado 104');
});
