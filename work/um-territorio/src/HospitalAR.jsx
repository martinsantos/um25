import React from 'react';
import {SYSTEM_STYLE} from './hospitalSystems';
import {SERVICE_STORIES,assetStory,flowSummary} from './hospitalARData';
import {sampleTelemetry} from './hospitalInspection';
import './hospital-ar.css';
export function SystemGlyph({system}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SERVICE_STORIES[system]?.icon||'M4 4h16v16H4z'}/></svg>;}
export function ARLabels({labels,hover,time,active,onSelect,onHover,settled}){
 return <div className={`um-ar-layer ${settled?'is-settled':''}`} aria-label="Equipos detectados en la escena">
  <svg className="um-ar-leaders" width="100%" height="100%" aria-hidden="true">{labels.map(a=><g key={a.asset.id} style={{color:SYSTEM_STYLE[a.asset.system].color}}><path d={`M${a.anchorX} ${a.anchorY} L${a.x-10} ${a.y+27} L${a.x} ${a.y+27}`} stroke="currentColor" fill="none"/><circle cx={a.anchorX} cy={a.anchorY} r="5" fill="currentColor"/><circle cx={a.anchorX} cy={a.anchorY} r="10" fill="none" stroke="currentColor"/></g>)}</svg>
  {labels.map(a=>{const story=assetStory(a.asset),flow=flowSummary(a.asset,time,active),expanded=hover?.id===a.asset.id;return <button key={a.asset.id} className={`um-ar-tag ${expanded?'is-hovered':''}`} style={{left:a.x,top:a.y,'--ar-color':SYSTEM_STYLE[a.asset.system].color}} aria-label={`Inspeccionar ${a.asset.id}: ${story.title}`} onMouseEnter={()=>onHover(a.asset)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(a.asset)} onBlur={()=>onHover(null)} onClick={()=>onSelect(a.asset)}><span className="um-ar-tag-title"><SystemGlyph system={a.asset.system}/><span>{story.title}<small>{a.asset.id}</small></span><b>↗</b></span><span className="um-ar-tag-flow"><strong>{flow.value.toFixed(flow.value<10?2:0)}</strong> {flow.unit}<i>DEMO</i></span><span className="um-ar-tag-help">{expanded?story.why:story.verb}</span><span className="um-ar-tag-cta">Ver tráfico y servicio →</span></button>;})}
 </div>;
}
export function ARInspector({asset,time,active,onClose,onToggle}){
 const story=assetStory(asset),f=flowSummary(asset,time,active),max=Math.max(f.peak*1.2,.01),points=f.samples.map((v,i)=>`${i*10},${78-v/max*68}`).join(' ');
 return <aside className="um-ar-inspector" style={{'--ar-color':SYSTEM_STYLE[asset.system].color}} aria-label="Inspector del sistema">
  <header><span><SystemGlyph system={asset.system}/> UM / SYSTEM VISION</span><button aria-label="Cerrar inspector" onClick={onClose}>×</button></header>
  <div className="um-ar-dossier"><span className="um-ar-eyebrow">{asset.id} <i>SIMULACIÓN DEMO</i></span><h2>{story.title}</h2><p className="um-ar-device">{asset.name}</p><p>{story.why}</p>
   <div className="um-ar-provider"><span>QUÉ APORTAMOS</span><p>{story.um}</p></div>
   <div className="um-ar-route">{story.chain.map((v,i)=><React.Fragment key={v}>{i?<span>→</span>:null}<b>{v}</b></React.Fragment>)}</div>
   <div className="um-ar-measure"><span>{f.label}</span><strong>{f.value.toFixed(f.value<10?2:0)}<small>{f.unit}</small></strong><em>{active?'● Flujo DEMO activo':'Ⅱ Simulación pausada'}</em></div>
   <figure className="um-ar-chart"><svg viewBox="0 0 300 90" role="img" aria-label={`${f.label}: evolución simulada de los últimos 60 segundos`}><path d="M0 10H300 M0 45H300 M0 78H300" stroke="#ffffff16"/><polygon points={`0,78 ${points} 300,78`} fill="var(--ar-color)" opacity=".14"/><polyline points={points} fill="none" stroke="var(--ar-color)" strokeWidth="2"/><circle cx="300" cy={78-f.samples[30]/max*68} r="3" fill="var(--ar-color)"/></svg><figcaption><span>−60 s</span><span>Ventana sintética · ahora</span></figcaption></figure>
   <div className="um-ar-volume"><div><strong>{f.total}</strong><span>{f.totalLabel}</span></div><div><strong>{f.peak.toFixed(1)}</strong><span>Pico · {f.unit}</span></div></div>
   <dl>{sampleTelemetry(asset,time,active).filter(([k])=>!k.includes('Tráfico')&&!k.includes('Caudal')&&!k.includes('Corriente')).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
   <button className="um-ar-pause" onClick={onToggle}>{active?'Pausar flujo DEMO':'Reanudar flujo DEMO'}</button><small className="um-ar-disclaimer">Magnitudes y volúmenes sintéticos. Sin equipos conectados, mediciones reales ni datos del SGI.</small>
  </div>
 </aside>;
}
