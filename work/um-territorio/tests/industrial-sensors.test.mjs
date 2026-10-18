import test from 'node:test';
import assert from 'node:assert/strict';
import {industrialInventory} from '../src/industrialInventory.js';
import {createIndustrialSensors} from '../src/industrialSensors.js';
import {flowSummary,assetStory} from '../src/hospitalARData.js';
for(const sector of ['hospital','airport','winery'])test(`${sector}: instrument geometry and domain metrics`,()=>{
 const assets=industrialInventory(sector),kit=createIndustrialSensors(assets);
 assert.equal(new Set(assets.map(a=>a.system)).size,7);
 assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);
 assert.ok(kit.meshes.length<=assets.length*6,'bounded material batches');
 let vertices=0;
 for(const m of kit.meshes){vertices+=m.geometry.attributes.position.count;assert.ok(m.userData.asset||m.userData.system==='Furniture-context');m.geometry.computeBoundingBox();assert.ok(Number.isFinite(m.geometry.boundingBox.min.x));}
 assert.ok(vertices<55000,'sensor kit vertex budget');
 for(const a of assets){const f=flowSummary(a,12);assert.equal(f.unit,a.measurement.unit);assert.ok(f.samples.every(Number.isFinite));assert.ok(assetStory(a).title);assert.ok(a.source.every(Number.isFinite));}
 kit.dispose();assert.equal(kit.root.parent,null);
});
