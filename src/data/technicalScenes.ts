import { publicCaseFor } from "../components/proto/casePresentation";

export type TechnicalKind = "network" | "radio" | "fire" | "cabling";
export type TechnicalContent = {
  kind: TechnicalKind;
  kicker: string;
  title: string;
  description: string;
  accessible: string;
  steps: readonly (readonly [string, string])[];
};
const network: TechnicalContent = {
  kind: "network",
  kicker: "Redes",
  title: "Cada conexión tiene un recorrido",
  description:
    "El switch recibe los datos de los puestos y los envía por el enlace de fibra hacia el resto de la red.",
  accessible:
    "Los datos entran al switch por los puertos de acceso y salen por el enlace óptico. El puerto de destino se identifica sin iluminar todos los equipos a la vez.",
  steps: [
    ["Entrada", "Los puestos llegan a los puertos de acceso."],
    ["Conmutación", "El switch dirige cada comunicación."],
    ["Enlace", "La fibra conecta con el resto de la red."],
  ],
};
const radio: TechnicalContent = {
  kind: "radio",
  kicker: "Telecomunicaciones",
  title: "Dos sedes. Una comunicación.",
  description:
    "Un radioenlace conecta las redes de ambos sitios. La alineación, la visibilidad entre antenas y las condiciones del enlace se verifican en campo.",
  accessible:
    "Dos antenas enfrentadas establecen un radioenlace. Una solicitud viaja desde la sede A hasta la sede B y una respuesta vuelve en la dirección contraria.",
  steps: [
    ["Alineación", "Los dos extremos establecen el enlace."],
    ["Transmisión", "Los datos llegan a la otra sede."],
    ["Respuesta", "La comunicación vuelve por el mismo enlace."],
  ],
};
const fire: TechnicalContent = {
  kind: "fire",
  kicker: "Detección de incendios",
  title: "Detectar. Ubicar. Dar aviso.",
  description:
    "El detector reconoce un evento y lo comunica a la central. La ubicación identificada permite poner en marcha la respuesta prevista para la instalación.",
  accessible:
    "Una pequeña nube llega a las entradas del detector. Su indicador se enciende de forma estable y la central presenta el evento y su ubicación.",
  steps: [
    ["Detección", "El detector reconoce el evento."],
    ["Identificación", "La central indica dónde se originó."],
    ["Aviso", "El evento queda disponible para la respuesta."],
  ],
};
const services: Partial<Record<string, TechnicalContent>> = {
  "101": network,
  "103": radio,
  "107": fire,
};
export const technicalSceneForService = (code: string) => services[code];

/** Only reviewed identities and recorded scope get a project-specific scene. */
export function technicalSceneForCase(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
  serviceCodes: string[];
}): TechnicalContent | undefined {
  const detail = publicCaseFor(story);
  if (!detail) return undefined;
  if (story.id === 3126 && story.serviceCodes.includes("107"))
    return {
      ...fire,
      kicker: "Detección · balizamiento aeroportuario",
      title: "Del detector a la central",
      description:
        "El proyecto incluye detectores, centrales y placas de red para el balizamiento principal, norte, sur y Mantenimiento Central. El recorrido muestra la detección y la identificación del evento.",
    };
  if (![3099, 3144].includes(story.id) || !story.serviceCodes.includes("101"))
    return undefined;
  const yaguar = story.id === 3099;
  return {
    kind: "cabling",
    kicker: "Cableado estructurado",
    title: yaguar
      ? "Del puesto al distribuidor óptico"
      : "Datos y telefonía, con un recorrido ordenado",
    description: yaguar
      ? "Los puestos Cat. 6 llegan al rack. El ODF organiza las terminaciones de la fibra monomodo entre racks."
      : "El cableado de los puestos se concentra en racks murales. La fibra monomodo completa el alcance de la infraestructura del edificio.",
    accessible:
      "Vista cercana de las terminaciones de cobre y fibra. El recorrido destaca primero el cableado de los puestos, luego su concentración en el rack y finalmente las terminaciones ópticas.",
    steps: [
      [
        "Puestos",
        yaguar
          ? "16 puestos Cat. 6: 6 estándar y 10 para AP."
          : "43 puestos de datos y 18 de telefonía.",
      ],
      [
        "Concentración",
        yaguar
          ? "Rack mural de 12U y cañería secundaria."
          : "Cuatro racks murales de 9U.",
      ],
      [
        "Fibra",
        yaguar
          ? "ODF, fusiones y fibra monomodo de 12 hilos."
          : "Tendido de cuatro fibras monomodo.",
      ],
    ],
  };
}
