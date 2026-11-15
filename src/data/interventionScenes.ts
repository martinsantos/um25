import { catalogPresentationFor } from "./catalogCasePresentation";

export type InterventionContent = {
  kind: "peripherals" | "pipe-repair" | "flange-repair";
  kicker: string;
  title: string;
  description: string;
  accessible: string;
  steps: readonly (readonly [string, string])[];
};

const scenes: Record<number, InterventionContent> = {
  3604: {
    kind: "peripherals",
    kicker: "Captura y lectura · UM-3604",
    title: "De la imagen y el código al dato.",
    description:
      "Provisión de dos cámaras web y dos lectores de código de barras.",
    accessible:
      "Una cámara web captura imágenes. Un lector reconoce un código de barras y entrega su información al equipo.",
    steps: [
      ["Imagen", "La cámara convierte una imagen en señal."],
      ["Código", "El lector reconoce la información de las barras."],
      ["Entrada", "Los periféricos entregan datos al equipo."],
    ],
  },
  3229: {
    kind: "pipe-repair",
    kicker: "Red contra incendio · UM-3229",
    title: "Encontrar el punto. Recuperar la continuidad.",
    description:
      "Búsqueda y reparación de una pérdida en la red de incendio del Aeropuerto de Tucumán.",
    accessible:
      "Un acercamiento recorre una tubería y se detiene en una unión. El detalle destaca el punto de intervención en la red.",
    steps: [
      ["Localizar", "Ubicar el punto donde se manifiesta la pérdida."],
      ["Intervenir", "Concentrar la reparación en el punto detectado."],
      ["Revisar", "Volver sobre la unión y la continuidad de la red."],
    ],
  },
  3490: {
    kind: "flange-repair",
    kicker: "Bridas de transformador · UM-3490",
    title: "Cada superficie cuenta en la unión.",
    description: "Una mirada al encuentro entre las piezas de una brida.",
    accessible:
      "Dos caras de una brida y una junta se presentan separadas y se aproximan sobre un mismo eje. El movimiento permite reconocer el plano de contacto.",
    steps: [
      ["Caras", "Las superficies enfrentadas forman la unión."],
      ["Contacto", "La junta ocupa el plano entre las piezas."],
      ["Alineación", "Los elementos comparten un mismo eje de cierre."],
    ],
  },
};

/** A new CMS identity must be reviewed before it can inherit this scene. */
export function interventionSceneForCase(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
}): InterventionContent | undefined {
  return catalogPresentationFor(story) ? scenes[story.id] : undefined;
}
