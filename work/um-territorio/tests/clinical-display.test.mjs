import test from 'node:test';
import assert from 'node:assert/strict';
import { createClinicalDisplay } from '../src/clinicalDisplay.js';

test('clinical display is synthetic, throttled, reduced-motion aware and disposable', () => {
 const previous = globalThis.document;
 const labels = []; let frames = 0;
 const ctx = {fillRect(){ frames++; }, fillText(text){ labels.push(text); }, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}};
 globalThis.document = {createElement(){ return {getContext(){ return ctx; }}; }};
 try {
  const display = createClinicalDisplay();
  assert.equal(frames, 1);
  assert.ok(labels.includes('DEMO'));
  assert.ok(labels.includes('SEÑALES ILUSTRATIVAS / SIN DATOS REALES'));
  display.update(50); assert.equal(frames, 1);
  display.update(100); assert.equal(frames, 2);
  display.update(1000, true); assert.equal(frames, 2);
  display.update(1100, false); assert.equal(frames, 3);
  let disposed = false;
  display.texture.addEventListener('dispose', () => { disposed = true; });
  display.dispose(); assert.ok(disposed);
 } finally { globalThis.document = previous; }
});
