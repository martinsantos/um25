import fs from 'node:fs';
import zlib from 'node:zlib';
import {DISCIPLINE_SYSTEMS} from '../src/data/cine/disciplineSystems';
import {operationScenes} from '../src/data/cine/operationNarrative';

test.each(Object.keys(DISCIPLINE_SYSTEMS))('%s has six connected and self-contained layers in its first-paint diagram',code=>{
 const source=fs.readFileSync(`src/assets/cine/isometric/discipline-${code}-v${code==='108'?5:['103','105','106'].includes(code)?3:2}.svg`,'utf8');
 const doc=new DOMParser().parseFromString(source,'image/svg+xml');
 expect(doc.querySelector('parsererror')).toBeNull();
 expect([...doc.querySelectorAll('[data-discipline-drawing]')].map(n=>n.dataset.disciplineDrawing)).toEqual([code]);
 expect([...doc.querySelectorAll('[data-discipline-tag]')].map(n=>Number(n.dataset.disciplineTag))).toEqual([0,1,2,3,4,5]);
 const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);expect(new Set(ids).size).toBe(ids.length);
 for(const node of doc.querySelectorAll('use'))expect(ids).toContain(node.getAttribute('href').slice(1));
 for(let i=0;i<6;i++)expect(doc.querySelector(`[data-discipline-node="${i}"]`)||[...doc.querySelectorAll('[data-discipline-route]')].find(n=>n.dataset.disciplineRoute.split(' ').includes(String(i)))).toBeTruthy();
 expect(zlib.gzipSync(source).length).toBeLessThan(30000);
 expect(operationScenes(code).map(s=>s.disciplineStage)).toEqual([-1,0,1,2,3,4,5,6]);
 expect(operationScenes(code).every(s=>s.duration>=5500)).toBe(true);
});
