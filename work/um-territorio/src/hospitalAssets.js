// Fictional inventory, never synchronized with SGI or real hospital equipment.
export const HOSPITAL_ASSETS=[
 {id:'ODF-01',name:'Fibra / distribución óptica',stop:'Fibra y certificación',layer:'Data',route:'ODF → patch óptico → SFP → switch',detail:'Bandeja de empalmes, reserva de fibra y adaptadores LC.'},
 {id:'TEST-01',name:'Certificación del enlace',stop:'Fibra y certificación',layer:'Data',route:'Certificador → enlace bajo prueba → remoto',detail:'Registro ilustrativo: identificación, continuidad y resultado DEMO. No constituye certificación real.'},
 {id:'CCTV-01',name:'Cámara y grabación',stop:'Grabación CCTV',layer:'CCTV',route:'Cámara exterior → PoE → NVR → supervisión',detail:'Sala de seguridad independiente: cámaras, red PoE, grabador y supervisión.'},
 {id:'AP-04',name:'Wi-Fi / movilidad',stop:'Wi-Fi',layer:'Telecom',route:'Dispositivo → AP → switch PoE → aplicaciones',detail:'Puntos de acceso, uplinks y alimentación sobre el mismo enlace.'},
 {id:'IP-201',name:'Telefonía IP',stop:'Puestos IT',layer:'Telecom',route:'Interno 201 → PBX → interno 203',detail:'Terminales físicos y comunicación representada en la demo de llamada.'},
 {id:'PWR-01',name:'Energía IT / tablero',stop:'Energía IT',layer:'Power',route:'Distribución → UPS / batería → carga IT',detail:'Protecciones, rieles DIN, borneras, canaletas y barra de tierra. Esquema conceptual, no unifilar aprobado.'},
 {id:'ACC-01',name:'Acceso principal',stop:'Acceso principal',layer:'Security',route:'Lector / videoportero → controlador → acceso',detail:'Entrada cubierta, pedestal, lector, videoportero y contacto de puerta.'},
 {id:'FIRE-01',name:'Detección y aviso',stop:'Calderas',layer:'Fire-detection',route:'Detector → central → notificación / supervisión',detail:'Detección y aviso en sala técnica; equipos térmicos solamente como contexto.'},
 {id:'OPS-01',name:'Software y soporte',stop:'Puestos IT',layer:'Software',route:'Activo → incidencia → atención → cierre',detail:'Flujo local demostrativo de soporte, sin datos ni conexión al SGI.'},
];
