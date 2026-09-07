// Conceptual demonstrations only: no live devices, clinical data or alarm logic.
export const DEMOS={
 wifi:{label:'Conexión Wi-Fi',stop:'Wi-Fi',layer:'Telecom',title:'AP-04 / Movilidad',steps:['La tablet se asocia al punto de acceso.','El enlace PoE lleva los datos hasta el switch.','El dispositivo aparece en supervisión · cobertura ilustrativa.']},
 phone:{label:'Llamada IP',stop:'Puestos IT',layer:'Telecom',title:'Interno 201 → 203',steps:['Admisión inicia una llamada DEMO.','La central IP establece la comunicación.','Enfermería recibe la llamada · registro en supervisión.']},
 fire:{label:'Prueba de detección',stop:'Calderas',layer:'Fire-detection',title:'Zona CT-01 / Prueba de incendio',steps:['Entrada de prueba del detector térmico.','La central identifica la zona CT-01.','Avisador y evento de supervisión · sin descarga ni maniobras reales.']},
 power:{label:'Respaldo UPS',stop:'Energía IT',layer:'Power',title:'Continuidad IT / DEMO',steps:['Se simula pérdida de alimentación de red.','El UPS sostiene la carga IT representada.','La supervisión registra operación sobre batería.']},
 access:{label:'Probar credencial',stop:'Acceso técnico',layer:'Security',title:'Puerta técnica / DEMO',steps:['Se presenta una credencial ilustrativa.','El controlador valida el permiso de acceso.','Indicador autorizado · evento registrado en supervisión.']},
};
export const demoStep=elapsed=>Math.min(2,Math.max(0,Math.floor(elapsed/2500)));
