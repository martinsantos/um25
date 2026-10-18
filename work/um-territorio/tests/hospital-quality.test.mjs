import test from 'node:test';
import assert from 'node:assert/strict';
import {hospitalQuality} from '../src/hospitalQuality.js';
test('phone profile bounds shaded pixels and disables contact-shadow processing',()=>{
 assert.deepEqual(hospitalQuality(390,3),{pixelRatio:1,shadowSize:1024,contactShadows:false});
 assert.equal(hospitalQuality(1200,2,true).contactShadows,false);
 assert.deepEqual(hospitalQuality(1440,2),{pixelRatio:1.5,shadowSize:2048,contactShadows:true});
});
