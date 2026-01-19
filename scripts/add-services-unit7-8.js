
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECTUS_URL = 'http://localhost:8055';
const TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const IMAGES_DIR = path.resolve(__dirname, '../serviciosimg/limpias');

const uploadImage = async (filename) => {
  const filePath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  // Optional: Set title or folder
  // form.append('title', filename); 

  try {
    const response = await fetch(`${DIRECTUS_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Uploaded ${filename} -> ID: ${data.data.id}`);
    return data.data.id;
  } catch (error) {
    console.error(`Error uploading ${filename}:`, error);
    return null;
  }
};

const createService = async (serviceData) => {
    try {
        const response = await fetch(`${DIRECTUS_URL}/items/Servicios`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });

        if (!response.ok) {
             const err = await response.text();
             throw new Error(`Create service failed: ${response.status} - ${err}`);
        }

        const data = await response.json();
        console.log(`Service created: ${data.data.Titulo} (ID: ${data.data.id})`);
        return data.data;
    } catch (error) {
        console.error(`Error creating service:`, error);
    }
}

// DATA DEFINITION

const UNIT_7 = {
    id: 107,
    status: 'published',
    Titulo: "Sistemas de Detección y Alarma de Incendios",
    Subtitulo: "Ingeniería SDI con Certificación NFPA 72 y Habilitación de Bomberos",
    Descripcion: "Protección integral contra el fuego desde el primer segundo. Diseñamos, instalamos y mantenemos sistemas de detección temprana que salvan vidas y protegen activos críticos. Tecnología direccionable e inteligente.",
    Area: "Seguridad",
    Servicios: ["Detección Temprana", "Aviso de Evacuación", "Integración con Extinción", "Mantenimiento Preventivo"],
    Caracteristicas: ["Certificación NFPA 72", "Habilitación de Bomberos", "Sistemas Direccionables Inteligentes"],
    Tagline: "Protección integral contra el fuego desde el primer segundo",
    // We will fill Imagen and Servicios_Detalle
};

const UNIT_7_DETAILS = [
    {
        imgFile: "7.1.png",
        data: {
            nombre: "Panel Central de Alarma Direccionable",
            headline: "El cerebro que identifica dónde está el fuego en segundos",
            descripcion: "En un edificio con 500 detectores, saber que 'hay alarma' no alcanza. Necesita saber exactamente en qué habitación. Nuestros paneles direccionables identifican el dispositivo exacto que detectó el problema, acelerando la respuesta y evacuación.",
            servicio_asociado: "🔧 Diseñamos e instalamos sistemas SDI direccionables con paneles Notifier, Hochiki o equivalente. Programación por zonas, integración con BMS y habilitación ante Bomberos incluida.",
            caracteristicas: ["Localización exacta del incendio", "Reducción de falsas alarmas", "Cumplimiento NFPA 72"]
        }
    },
    {
        imgFile: "7.2.png",
        data: {
            nombre: "Detectores Fotoeléctricos de Humo",
            headline: "Segundos de ventaja que salvan vidas",
            descripcion: "El humo viaja más rápido que las llamas. Nuestros detectores fotoeléctricos identifican partículas de combustión antes de que el fuego sea visible. Cada segundo de anticipación es tiempo para evacuar y actuar. Diseñados para minimizar falsas alarmas.",
            servicio_asociado: "🔧 Instalamos detectores de humo fotoeléctricos convencionales y direccionables. Cálculo de cobertura según NFPA 72, altura de techo y tipo de ambiente.",
            caracteristicas: ["Detección en fase temprana", "Mínimas falsas alarmas", "Cobertura calculada"]
        }
    },
    {
        imgFile: "7.3.png",
        data: {
            nombre: "Detectores Térmicos para Ambientes Especiales",
            headline: "Protección donde el humo no es confiable",
            descripcion: "Cocinas, calderas, estacionamientos. Lugares donde el humo es normal pero el fuego no. Los detectores térmicos activan la alarma por temperatura, no por partículas. Protección inteligente adaptada a cada ambiente.",
            servicio_asociado: "🔧 Instalamos detectores térmicos de temperatura fija y termovelocimétricos para ambientes donde los detectores de humo no son prácticos. Selección según clase de temperatura requerida.",
            caracteristicas: ["Cero falsas alarmas por vapor o humo normal", "Ideal para cocinas y calderas", "Clasificación por temperatura"]
        }
    },
    {
        imgFile: "7.4.png",
        data: {
            nombre: "Detectores de Llama para Alta Velocidad",
            headline: "Detección instantánea donde cada milisegundo cuenta",
            descripcion: "En ambientes con combustibles, explosivos o procesos críticos, esperar a que se forme humo no es opción. Los detectores UV/IR identifican la radiación de la llama en milisegundos, activando supresión automática antes de que el fuego se propague.",
            servicio_asociado: "🔧 Instalamos detectores de llama UV/IR para plantas industriales, hangares, depósitos de combustibles y áreas de alto riesgo. Integración con sistemas de supresión automática.",
            caracteristicas: ["Respuesta en milisegundos", "Visión de largo alcance", "Integración con supresión"]
        }
    },
    {
        imgFile: "7.5.png", // Or 7.5alt.png, sticking to primary
        data: {
            nombre: "Notificación Audible y Visual de Alarma",
            headline: "Que nadie se quede sin enterarse",
            descripcion: "La alarma suena, pero ¿todos la escuchan? En ambientes ruidosos o con personas con discapacidad auditiva, las sirenas estroboscópicas garantizan que TODOS perciban la emergencia. Luz y sonido combinados para evacuación efectiva.",
            servicio_asociado: "🔧 Instalamos dispositivos de notificación audibles y visuales cumpliendo requisitos ADA de accesibilidad. Cálculo de intensidad lumínica y nivel sonoro según normativa.",
            caracteristicas: ["Cumplimiento de accesibilidad", "Penetra el ruido ambiental", "Sincronización de destellos"]
        }
    },
    {
        imgFile: "7.6.png",
        data: {
            nombre: "Estaciones Manuales de Activación",
            headline: "Cualquier persona puede dar la voz de alarma",
            descripcion: "Cuando alguien ve fuego antes que el sistema, necesita poder alertar a todos. Las estaciones manuales estratégicamente ubicadas permiten activar la alarma general con un simple tirón. Visibilidad máxima en color rojo normativo.",
            servicio_asociado: "🔧 Instalamos estaciones manuales en ubicaciones normativas: salidas de emergencia, escaleras y pasillos a distancias máximas establecidas por NFPA 72.",
            caracteristicas: ["Activación instantánea", "Ubicación normativa", "Alta visibilidad"]
        }
    },
    {
        imgFile: "7.7.png",
        data: {
            nombre: "Módulos de Integración y Control",
            headline: "Conectamos la detección con la acción",
            descripcion: "Detectar no alcanza, hay que actuar. Nuestros módulos conectan el sistema de alarma con puertas cortafuego, ascensores, HVAC y sistemas de supresión. Cuando hay alarma, todo el edificio responde coordinadamente.",
            servicio_asociado: "🔧 Instalamos módulos de control y monitoreo para integrar el SDI con otros sistemas del edificio: liberación de puertas, retorno de ascensores, apagado de HVAC y activación de supresión.",
            caracteristicas: ["Respuesta coordinada", "Puertas que liberan solas", "Ascensores a planta baja"]
        }
    },
    {
        imgFile: "7.8.png",
        data: {
            nombre: "Integración con Sistemas de Extinción",
            headline: "De la detección a la supresión automática",
            descripcion: "En salas de servidores, archivos y áreas críticas, detectar no basta: hay que extinguir antes de que haya daño. Integramos la detección con sistemas de supresión por agentes limpios, CO2 o agua nebulizada para respuesta automática.",
            servicio_asociado: "🔧 Diseñamos e instalamos integración SDI-supresión con sistemas de agentes limpios (FM-200, Novec), CO2 y agua nebulizada. Pre-alarma, alarma, retardo y disparo automático.",
            caracteristicas: ["Supresión automática", "Agentes limpios", "Secuencia de pre-alarma"]
        }
    }
];


const UNIT_8 = {
    id: 108,
    status: 'published',
    Titulo: "Servicios Eléctricos para IT",
    Subtitulo: "Instalaciones Eléctricas, UPS y Energía Ininterrumpida para Data Centers",
    Descripcion: "Energía confiable para infraestructura crítica. Diseñamos e instalamos sistemas eléctricos dedicados, UPS online, bancos de baterías y puesta a tierra técnica para asegurar que sus datos nunca se detengan por falta de energía.",
    Area: "Infraestructura", // Using established Area
    Servicios: ["Energía Ininterrumpida", "Tableros Dedicados", "Corrección de Factor de Potencia", "Puesta a Tierra Técnica"],
    Caracteristicas: ["Redundancia N+1 / 2N", "Cumplimiento TIA-942", "Cero interrupciones"],
    Tagline: "Energía confiable para infraestructura crítica",
};

const UNIT_8_DETAILS = [
    {
        imgFile: "8.1.png",
        data: {
            nombre: "Tableros Eléctricos para Circuitos IT",
            headline: "Energía dedicada y protegida para su infraestructura crítica",
            descripcion: "Sus equipos IT no pueden compartir circuito con el aire acondicionado o la cafetera. Diseñamos e instalamos tableros eléctricos dedicados para informática: circuitos separados, protecciones adecuadas, puesta a tierra técnica y medición independiente.",
            servicio_asociado: "🔧 Diseñamos e instalamos tableros eléctricos dedicados para salas de servidores y data centers. Protecciones termomagnéticas, diferenciales, supresores de transitorios y barra de tierra aislada.",
            caracteristicas: ["Aislamiento de ruido eléctrico", "Protección contra sobretensiones", "Puesta a tierra técnica"]
        }
    },
    {
        imgFile: "8.2.png",
        data: {
            nombre: "Sistemas de Alimentación Ininterrumpida (UPS)",
            headline: "Cero interrupciones, cero pérdida de datos",
            descripcion: "Un corte de luz de un segundo puede significar horas de recuperación. Los UPS Online de doble conversión mantienen sus equipos funcionando sin parpadeos: durante cortes, durante tormentas, durante todo. Autonomía desde minutos hasta horas según su necesidad.",
            servicio_asociado: "🔧 Instalamos sistemas UPS desde 1 kVA para racks individuales hasta 500 kVA para data centers completos. Online doble conversión, bypass automático y monitoreo remoto incluido.",
            caracteristicas: ["Transición imperceptible", "Regulación constante", "Monitoreo remoto"]
        }
    },
    {
        imgFile: "8.3.png",
        data: {
            nombre: "Bancos de Baterías para Autonomía Extendida",
            headline: "Horas de respaldo cuando los minutos no alcanzan",
            descripcion: "¿Cuánto tiempo necesita funcionar sin red eléctrica? ¿15 minutos para apagar ordenadamente? ¿2 horas hasta que llegue el generador? ¿8 horas de autonomía total? Dimensionamos bancos de baterías para su tiempo de respaldo requerido.",
            servicio_asociado: "🔧 Dimensionamos e instalamos bancos de baterías de plomo-ácido o litio para autonomías extendidas. Rack de baterías, cableado, protecciones y mantenimiento preventivo incluido.",
            caracteristicas: ["Autonomía a medida", "Baterías de grado UPS", "Mantenimiento preventivo"]
        }
    },
    {
        imgFile: "8.4.png",
        data: {
            nombre: "Tableros de Transferencia Automática",
            headline: "Del UPS al generador sin intervención humana",
            descripcion: "Cuando el corte se extiende y el UPS se agota, el generador debe tomar la carga. Los tableros de transferencia automática (ATS) hacen el cambio sin operador: detectan la falla, arrancan el generador, transfieren la carga y vuelven a red cuando se normaliza.",
            servicio_asociado: "🔧 Instalamos tableros de transferencia automática (ATS) para conmutación entre red comercial, UPS y generador. Secuencia de arranque, sincronización y retransferencia programable.",
            caracteristicas: ["Transferencia sin operador", "Secuencia programable", "Monitoreo de fuentes"]
        }
    },
    {
        imgFile: "8.5.png",
        data: {
            nombre: "Unidades de Distribución de Energía en Rack (PDU)",
            headline: "Energía organizada dentro de cada rack",
            descripcion: "Del tablero al UPS, del UPS a... ¿dónde? Las PDU distribuyen la energía dentro de cada rack de forma organizada: múltiples tomas, protección individual por circuito, medición de consumo y en algunos casos, control remoto de cada toma.",
            servicio_asociado: "🔧 Instalamos PDUs básicas, monitoreadas e inteligentes. Montaje vertical u horizontal, con o sin medición, con o sin switching remoto según necesidad.",
            caracteristicas: ["Distribución organizada", "Medición de consumo", "Control remoto"]
        }
    },
    {
        imgFile: "8.6.png",
        data: {
            nombre: "Puesta a Tierra Técnica",
            headline: "La referencia de tierra que sus equipos necesitan",
            descripcion: "Los equipos electrónicos sensibles no toleran ruido en la tierra. Una puesta a tierra técnica (TGB/SRS) proporciona una referencia limpia, separada del sistema de tierras de fuerza. Medimos, diseñamos e instalamos según norma TIA-607.",
            servicio_asociado: "🔧 Diseñamos e instalamos sistemas de puesta a tierra técnica según TIA-607: barra principal (TMGB), barras secundarias (TGB), malla equipotencial y medición de resistividad.",
            caracteristicas: ["Referencia limpia", "Cumplimiento TIA-607", "Medición certificada"]
        }
    },
    {
        imgFile: "8.7.png",
        data: {
            nombre: "Banco de Capacitores",
            headline: "Pague solo por la energía que realmente usa",
            descripcion: "¿Su factura eléctrica tiene recargo por bajo factor de potencia? Los bancos de capacitores corrigen el desfase entre tensión y corriente, mejorando la eficiencia de su instalación y eliminando penalizaciones. El ahorro paga la inversión.",
            servicio_asociado: "🔧 Instalamos bancos de capacitores automáticos para corrección de factor de potencia. Medición previa, dimensionamiento, instalación y verificación de factura posterior.",
            caracteristicas: ["Elimina recargos", "ROI en meses", "Mayor capacidad disponible"]
        }
    },
    {
        imgFile: "8.8.png",
        data: {
            nombre: "Instalaciones Eléctricas para Data Centers",
            headline: "Ingeniería eléctrica de punta a punta para infraestructura crítica",
            descripcion: "Desde la acometida hasta el último rack: diseñamos e instalamos la infraestructura eléctrica completa para data centers. Redundancia N+1 o 2N, selectividad de protecciones, tierras técnicas y cumplimiento de TIA-942. Su data center, listo para certificar.",
            servicio_asociado: "🔧 Diseñamos e instalamos infraestructura eléctrica completa para data centers: acometida, transformadores, tableros generales y de distribución, canalizaciones, UPS, baterías, transferencia y PDUs.",
            caracteristicas: ["Diseño integral", "Redundancia según tier", "Cumplimiento TIA-942"]
        }
    }
];

// MAIN EXECUTION

const processUnit = async (unitData, details) => {
    console.log(`Processing Unit: ${unitData.Titulo}`);
    const processedDetails = [];
    let mainImageId = null;

    for (const detail of details) {
        console.log(`  Uploading ${detail.imgFile}...`);
        const uuid = await uploadImage(detail.imgFile);
        if (uuid) {
            // Store as /directus-assets/UUID for frontend compatibility
            detail.data.imagen = `/directus-assets/${uuid}`;
            processedDetails.push(detail.data);
            
            // Use the first image (x.1.png) as the main service image 
            // OR checks generic main image requirement. 
            // For now, assume first one is HERO candidate if not specified otherwise.
            if (!mainImageId && detail.imgFile.endsWith('.1.png')) {
                mainImageId = uuid;
            }
        } else {
            console.warn(`  Failed to upload ${detail.imgFile}, skipping detail.`);
        }
    }

    if (processedDetails.length === 0) {
        console.error("  No details processed. Aborting unit creation.");
        return;
    }

    const servicePayload = {
        ...unitData,
        Imagen: mainImageId, // Direct UUID for main image
        Servicios_Detalle: processedDetails
    };

    console.log(`  Creating Service Record...`);
    await createService(servicePayload);
};

const run = async () => {
    console.log("Starting import process for Unit 7...");
    await processUnit(UNIT_7, UNIT_7_DETAILS);
    
    console.log("\nStarting import process for Unit 8...");
    await processUnit(UNIT_8, UNIT_8_DETAILS);
    
    console.log("\nDone.");
};

run();
