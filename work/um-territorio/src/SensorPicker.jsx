import React from 'react';
import {industrialInventory} from './industrialInventory';
import {SYSTEM_STYLE} from './hospitalSystems';
import './sensor-picker.css';
import {SECTORS} from './sectorScenes';
import {INSPECTION_POINTS} from './hospitalInspection';
const inventories=Object.fromEntries(['hospital','airport','winery'].map(s=>[s,[...industrialInventory(s),...(s==='hospital'?INSPECTION_POINTS:SECTORS[s].points).filter(a=>a.kind==='camera')]]));
export default function SensorPicker({sector,onSelect,disabled=false}){
 const items=inventories[sector];
 return <label className="sensor-picker"><span><strong>Instrumentación / DEMO</strong><small>Acercate a un equipo y explorá su señal.</small></span><select disabled={disabled} aria-label="Inspeccionar instrumentación" value="" onChange={e=>{const a=items.find(a=>a.id===e.target.value);if(a)onSelect(a);}}><option value="" disabled>Elegir sensor o equipo…</option>{Object.keys(SYSTEM_STYLE).map(sys=>{const group=items.filter(a=>a.system===sys);return group.length?<optgroup key={sys} label={SYSTEM_STYLE[sys].label}>{group.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>:null;})}{items.filter(a=>!SYSTEM_STYLE[a.system]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>;
}
