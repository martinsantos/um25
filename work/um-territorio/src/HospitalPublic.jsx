import React,{useState,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './hospital-public.css';
const Hospital=lazy(()=>import('./HospitalExperience.jsx'));
function PublicHospital(){
 const [started,start]=useState(false);
 return <><header className="brand-header"><a href="/" target="_top" aria-label="Última Milla, inicio" className="brand-logo">ultimamilla<span>.</span>com<span>.</span>ar</a><a href="/contacto" target="_top">Hablemos de tu infraestructura ↗</a></header><main>
 {!started?<section className="hospital-intro"><span className="eyebrow">UM / INFRAESTRUCTURA VIVA · SALUD</span><h1>Sistemas integrales por SECTOR</h1><p>Entrá a un hospital conectado. Explorá sus redes, cámaras, comunicaciones, detección de incendio, energía IT y software.</p><button onClick={()=>start(true)}>Entrar al hospital 3D ↗</button><small>Experiencia interactiva · requiere WebGL · la escena se descarga al entrar.</small><div className="instructions"><p><b>01 / Recorré</b>Elegí una sala o activá la exploración libre.</p><p><b>02 / Descubrí</b>Detené la cámara para ver los sistemas identificados.</p><p><b>03 / Inspeccioná</b>Pulsá un equipo para conocer su función y sus métricas DEMO.</p></div></section>:<Suspense fallback={<p className="load-status" role="status">Preparando el hospital 3D…</p>}><Hospital modelBase={`${import.meta.env.BASE_URL}models/`}/></Suspense>}
 </main><footer className="brand-footer"><b>Última Milla · Mendoza, Argentina</b><p>Demostración conceptual. No reproduce un hospital real ni constituye un proyecto de ingeniería aprobado. Equipamiento clínico ilustrativo; métricas simuladas, sin conexión a sistemas reales.</p><a href="/servicios" target="_top">Conocé nuestros servicios ↗</a></footer></>;
}
createRoot(document.getElementById('root')).render(<PublicHospital/>);
