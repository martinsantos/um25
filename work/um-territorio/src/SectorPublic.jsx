import React,{useState,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './hospital-public.css';
import './sector-public.css';
const Sector=lazy(()=>import('./SectorExperience.jsx'));
const sector=location.pathname.endsWith('bodega.html')?'winery':'airport';
const name=sector==='winery'?'Bodega':'Aeropuerto';
// Copy por industria: mismo motor, distinto foco operativo. Sin datos reales.
const intro=sector==='winery'
 ?'De recepción a despacho: redes, telemetría ilustrativa de tanques y toneles, CCTV, accesos, comunicaciones, detección de incendios y energía IT.'
 :'Del check-in al embarque: redes, CCTV, accesos de personal, comunicaciones, detección de incendios y energía IT con continuidad operativa.';
function PublicSector(){
 const [started,start]=useState(false);
 return <><header className="brand-header"><a className="brand-logo" href="/" target="_top">ultimamilla<span>.</span>com<span>.</span>ar</a><a href="/contacto" target="_top">Hablemos de tu infraestructura ↗</a></header><nav className="public-sectors" aria-label="Escenas 3D"><a href="/3dgemelohospital" target="_top">Hospital</a><a href="/3dgemeloaeropuerto" target="_top">Aeropuerto</a><a href="/3dgemelobodega" target="_top">Bodega</a></nav><main>{!started?<section className="hospital-intro"><span className="eyebrow">UM / INFRAESTRUCTURA VIVA</span><h1>{name} {sector==='winery'?'conectada':'conectado'}<span>.</span></h1><p>{intro}</p><button onClick={()=>start(true)}>Entrar {sector==='winery'?'a la':'al'} {name.toLowerCase()} 3D ↗</button><small>Requiere WebGL. El modelo se descarga al entrar. Métricas DEMO, sin equipos conectados.</small></section>:<Suspense fallback={<p className="load-status" role="status">Preparando la escena…</p>}><Sector sector={sector} modelBase={`${import.meta.env.BASE_URL}models/`}/></Suspense>}</main><footer className="brand-footer"><b>Última Milla · Mendoza, Argentina</b><p>Representación conceptual, no réplica de una instalación real ni ingeniería aprobada. Coberturas y mediciones ilustrativas. Sin datos del SGI, video real ni control de equipos.</p></footer></>;
}
createRoot(document.getElementById('root')).render(<PublicSector/>);
