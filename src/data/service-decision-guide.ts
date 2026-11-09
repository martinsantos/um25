type ServiceChoice = { title: string; description: string };

export const serviceDecisionGuide: Record<number, ServiceChoice[]> = {
  101: [
    { title: 'Cableado estructurado', description: 'Para conectar puestos de trabajo, cámaras o puntos Wi-Fi dentro de un edificio.' },
    { title: 'Fibra óptica', description: 'Para troncales que unen racks o edificios y concentran el tráfico de varios sectores.' },
    { title: 'Radioenlace punto a punto', description: 'Para unir dos sitios donde no es viable tender cable. Evaluamos la línea de vista antes de definir el enlace.' },
  ],
  102: [
    { title: 'Videovigilancia IP', description: 'Para observar accesos o perímetros y consultar las grabaciones cuando ocurre un incidente.' },
    { title: 'Control de acceso', description: 'Para autorizar el ingreso a áreas restringidas y registrar los movimientos.' },
    { title: 'Detección de intrusión', description: 'Para recibir alertas si alguien entra en un sector cerrado o protegido.' },
  ],
  103: [
    { title: 'Telefonía IP', description: 'Para integrar llamadas e internos entre oficinas o migrar una central existente.' },
    { title: 'Enlaces entre sedes', description: 'Para conectar sitios que necesitan intercambiar datos. Relevamos el recorrido y la disponibilidad de conectividad.' },
    { title: 'Radiocomunicación', description: 'Para coordinar equipos móviles, personal de campo o grupos de despacho.' },
  ],
  104: [
    { title: 'Aplicaciones a medida', description: 'Para organizar un proceso propio que hoy se reparte entre planillas y sistemas.' },
    { title: 'Integraciones', description: 'Para compartir datos entre aplicaciones, ERP y servicios externos sin volver a cargarlos a mano.' },
    { title: 'Automatización y análisis', description: 'Para ejecutar tareas repetitivas y consultar indicadores a partir de los datos de la operación.' },
  ],
  105: [
    { title: 'Mesa de ayuda', description: 'Para que los usuarios tengan un punto de atención y puedan seguir sus incidentes.' },
    { title: 'Monitoreo y mantenimiento', description: 'Para vigilar equipos críticos, atender alertas y planificar revisiones.' },
    { title: 'Backup y recuperación', description: 'Para recuperar datos tras una falla y comprobar que las copias se puedan restaurar.' },
  ],
  106: [
    { title: 'Auditoría de infraestructura', description: 'Para entender qué hay instalado, dónde están las brechas y qué merece atención primero.' },
    { title: 'Arquitectura y planificación', description: 'Para ordenar inversiones y definir etapas de renovación o migración.' },
    { title: 'Riesgos y cumplimiento', description: 'Para identificar riesgos y preparar acciones frente a los requisitos aplicables al proyecto.' },
  ],
  107: [
    { title: 'Detección según el ambiente', description: 'Para definir la cobertura y los equipos a partir de la actividad, el ambiente y el riesgo de cada sector.' },
    { title: 'Aviso de alarma', description: 'Para distribuir pulsadores, sirenas y balizas de acuerdo con el proyecto y las rutas de evacuación.' },
    { title: 'Integración y supervisión', description: 'Para coordinar la central, el monitoreo y los otros sistemas del edificio que deban responder.' },
  ],
  108: [
    { title: 'Distribución eléctrica', description: 'Para alimentar equipos IT desde tableros y circuitos definidos según las cargas.' },
    { title: 'Respaldo de energía', description: 'Para sostener equipos críticos durante cortes, con autonomía calculada según su consumo.' },
    { title: 'Puesta a tierra y mediciones', description: 'Para verificar la instalación y detectar problemas de calidad de la energía.' },
  ],
};
