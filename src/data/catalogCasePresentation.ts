import inventory from "./catalogCasePresentation.json";
import type { Parte } from "../components/proto/despiece";
import {
  operationsSceneForService,
  type OperationsContent,
} from "./operationsScenes";

export type CatalogMotion =
  | "inspection"
  | "replacement"
  | "product"
  | "call"
  | "attendance"
  | "access"
  | "audio"
  | "energy"
  | "detection"
  | "capture"
  | "storage"
  | "light"
  | "distribution"
  | "coverage"
  | "network"
  | "notification";
export type CatalogAsset =
  | "phone-ip"
  | "phone-analog"
  | "intercom"
  | "access-reader"
  | "amplifier"
  | "ups"
  | "battery"
  | "fire-panel"
  | "detector"
  | "camera"
  | "recorder"
  | "drive-v2"
  | "lighting"
  | "distribution"
  | "wifi"
  | "network-switch-v2"
  | "optical"
  | "network-termination"
  | "cctv-termination"
  | "rack"
  | "pbx"
  | "desktop"
  | "radio"
  | "server"
  | "field-tools"
  | "nurse-call"
  | "raised-floor"
  | "capacitor-bank"
  | "phone-power-supply"
  | "halogen-tripod";
type RecordPresentation = {
  identity: string;
  parts: Parte[];
  kind: CatalogMotion | OperationsContent["kind"] | "existing" | null;
  asset: CatalogAsset | null;
};
type Identity = { id: number; client: string; title: string; summary: string };
const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const reviewed = inventory as unknown as Record<string, RecordPresentation>;
/** An edited CMS record cannot inherit the equipment assigned to its previous scope. */
export function catalogPresentationFor(
  story: Identity,
): RecordPresentation | undefined {
  const entry = reviewed[String(story.id)];
  return entry?.identity ===
    normalize(`${story.client}|${story.title}|${story.summary}`)
    ? entry
    : undefined;
}
export type CatalogContent = {
  kind: CatalogMotion;
  asset: CatalogAsset;
  subject: string;
  title: string;
  kicker: string;
  steps: readonly (readonly [string, string])[];
};
const labels: Record<CatalogAsset, string> = {
  "phone-ip": "Teléfono IP",
  "phone-analog": "Teléfono analógico",
  intercom: "Portería IP",
  "access-reader": "Lectura de credenciales",
  amplifier: "Amplificación de audio",
  ups: "Alimentación ininterrumpida",
  battery: "Batería",
  "fire-panel": "Central de detección",
  detector: "Detector",
  camera: "Cámara de seguridad",
  recorder: "Grabador de video",
  "drive-v2": "Almacenamiento",
  lighting: "Iluminación LED",
  distribution: "Distribución eléctrica",
  wifi: "Punto de acceso",
  "network-switch-v2": "Switch de red",
  optical: "Conexión óptica",
  "network-termination": "Terminación de datos",
  "cctv-termination": "Terminación de CCTV",
  rack: "Rack de comunicaciones",
  pbx: "Central telefónica",
  desktop: "Puesto de trabajo",
  radio: "Radioenlace",
  server: "Servidor",
  "field-tools": "Diagnóstico de red",
  "nurse-call": "Llamado de enfermería",
  "raised-floor": "Piso técnico elevado",
  "capacitor-bank": "Banco de capacitores",
  "phone-power-supply": "Fuente para teléfono IP",
  "halogen-tripod": "Reflector halógeno con trípode",
};
const explanations: Record<
  CatalogMotion,
  { title: string; steps: readonly (readonly [string, string])[] }
> = {
  inspection: {
    title: "El detalle también hace al sistema.",
    steps: [
      ["Conjunto", "Reconocer el equipo y sus conexiones."],
      ["Detalle", "Acercar la mirada al punto de intervención."],
      ["Relación", "Ubicar cada componente dentro del conjunto."],
    ],
  },
  replacement: {
    title: "La intervención, pieza por pieza.",
    steps: [
      ["Componente", "Identificar la pieza que se interviene."],
      ["Cambio", "Distinguir el elemento de su conjunto."],
      ["Conexión", "Reconocer su punto de integración."],
    ],
  },
  product: {
    title: "El equipo, más de cerca.",
    steps: [
      ["Formato", "Una vista del conjunto."],
      ["Construcción", "Materiales y disposición de los elementos."],
      ["Conexiones", "El detalle que vincula cada pieza."],
    ],
  },
  call: {
    title: "De una llamada a una conversación.",
    steps: [
      ["Llamada", "La señal inicia la comunicación."],
      ["Conexión", "El sistema vincula los extremos."],
      ["Voz", "El audio circula durante la conversación."],
    ],
  },
  attendance: {
    title: "Identificar. Registrar. Consultar.",
    steps: [
      ["Identificación", "Una persona presenta su credencial."],
      ["Lectura", "El terminal reconoce la identificación."],
      ["Registro", "El evento se incorpora al control de asistencia."],
    ],
  },
  access: {
    title: "Cada acceso empieza por una identificación.",
    steps: [
      ["Credencial", "El lector recibe la identificación."],
      ["Validación", "El sistema consulta el permiso de acceso."],
      ["Resultado", "La respuesta habilita o rechaza el acceso."],
    ],
  },
  audio: {
    title: "La señal toma volumen.",
    steps: [
      ["Entrada", "El equipo recibe una señal de audio."],
      ["Amplificación", "La etapa de potencia eleva su nivel."],
      ["Salida", "La señal continúa hacia el sistema de sonido."],
    ],
  },
  energy: {
    title: "Energía disponible cuando hace falta.",
    steps: [
      ["Alimentación", "La instalación entrega energía al sistema."],
      ["Reserva", "La batería almacena energía."],
      ["Continuidad", "La reserva acompaña la alimentación de la carga."],
    ],
  },
  detection: {
    title: "Una señal que llega al punto de control.",
    steps: [
      ["Detección", "Un dispositivo reconoce una condición."],
      ["Comunicación", "La señal llega al sistema de detección."],
      ["Indicación", "La central identifica el evento."],
    ],
  },
  capture: {
    title: "De la imagen al registro.",
    steps: [
      ["Captura", "La cámara obtiene la imagen."],
      ["Video", "La señal se transmite al sistema."],
      ["Registro", "El grabador conserva el video para su consulta."],
    ],
  },
  storage: {
    title: "El dato encuentra su lugar.",
    steps: [
      ["Entrada", "Los datos llegan al almacenamiento."],
      ["Escritura", "La unidad los guarda."],
      ["Lectura", "La información vuelve cuando se consulta."],
    ],
  },
  light: {
    title: "La energía se convierte en luz.",
    steps: [
      ["Entrada", "La luminaria recibe alimentación."],
      ["Emisión", "Los LED convierten energía en luz."],
      ["Distribución", "La óptica dirige la iluminación."],
    ],
  },
  distribution: {
    title: "Cada circuito tiene su recorrido.",
    steps: [
      ["Entrada", "La alimentación llega al tablero."],
      ["Protección", "Los dispositivos protegen los circuitos."],
      ["Distribución", "Las salidas abastecen los distintos sectores."],
    ],
  },
  coverage: {
    title: "Conectividad a través del aire.",
    steps: [
      ["Equipo", "La interfaz se conecta a la red."],
      ["Radio", "El equipo emite y recibe señales."],
      ["Enlace", "La comunicación vincula ambos extremos."],
    ],
  },
  network: {
    title: "Cada dato sigue su destino.",
    steps: [
      ["Puerto", "Una conexión recibe el tráfico."],
      ["Conmutación", "El switch determina la salida."],
      ["Destino", "La comunicación continúa por el puerto correspondiente."],
    ],
  },
  notification: {
    title: "Un llamado que llega a quien lo atiende.",
    steps: [
      ["Solicitud", "El pulsador inicia el llamado."],
      ["Aviso", "El sistema comunica la solicitud."],
      ["Atención", "El aviso se presenta al personal de enfermería."],
    ],
  },
};
const specificDetails: Partial<
  Record<CatalogAsset, (typeof explanations)["product"]>
> = {
  "raised-floor": {
    title: "La infraestructura también va bajo el piso.",
    steps: [
      ["Superficie", "Las placas forman la superficie transitable."],
      ["Soporte", "Los pedestales sostienen el piso elevado."],
      ["Acceso", "Las placas permiten acceder al espacio inferior."],
    ],
  },
  "capacitor-bank": {
    title: "Compensación, componente a componente.",
    steps: [
      ["Capacitores", "El banco aporta compensación de energía reactiva."],
      ["Maniobra", "Los componentes de maniobra conectan las etapas."],
      ["Conjunto", "Gabinete y conexiones reúnen los componentes."],
    ],
  },
  "phone-power-supply": {
    title: "La alimentación también forma parte del enlace.",
    steps: [
      ["Entrada", "El adaptador recibe alimentación eléctrica."],
      ["Conversión", "La fuente entrega corriente continua al equipo."],
      ["Conector", "El cable vincula la fuente con el teléfono."],
    ],
  },
  "halogen-tripod": {
    title: "Luz de trabajo, con soporte propio.",
    steps: [
      ["Lámparas", "Las lámparas halógenas producen la luz."],
      ["Reflectores", "Cada cabezal permite orientar la iluminación."],
      ["Trípode", "La estructura sostiene ambos proyectores."],
    ],
  },
};
export function catalogSceneForCase(
  story: Identity,
): CatalogContent | undefined {
  if (story.id === 3300) return undefined;
  const entry = catalogPresentationFor(story);
  if (!entry?.asset || !entry.kind || !(entry.kind in explanations))
    return undefined;
  const kind = entry.kind as CatalogMotion;
  return {
    kind,
    asset: entry.asset,
    subject: labels[entry.asset],
    kicker: `${labels[entry.asset]} · UM-${story.id}`,
    ...explanations[kind],
    ...specificDetails[entry.asset],
  };
}
/** General operation explanations are selected by reviewed scope, not the service category. */
export function catalogOperationsForCase(
  story: Identity,
): OperationsContent | undefined {
  const entry = catalogPresentationFor(story);
  if (!entry || entry.asset || !entry.kind) return undefined;
  const map: Partial<Record<string, string>> = {
    software: "104",
    support: "105",
    consulting: "106",
  };
  const code = map[entry.kind];
  if (code) {
    const c = operationsSceneForService(code);
    return c ? { ...c, kicker: `${c.kicker} · UM-${story.id}` } : undefined;
  }
  if (entry.kind === "hosting")
    return {
      kind: "hosting",
      kicker: `Alojamiento web · UM-${story.id}`,
      title: "La consulta llega al servidor.",
      description:
        "El alojamiento conecta la consulta de una persona con los recursos del sitio web.",
      accessible:
        "Una consulta llega al servidor y la respuesta vuelve al navegador.",
      steps: [
        ["Consulta", "El navegador solicita un recurso."],
        ["Alojamiento", "El servidor atiende la solicitud."],
        ["Respuesta", "El recurso vuelve al navegador."],
      ],
    };
  return undefined;
}
