import { catalogPresentationFor } from "./catalogCasePresentation";

export type EquipmentDetailContent = {
  kind: "cable-duct" | "videowall" | "barcode" | "siren";
  kicker: string;
  title: string;
  description: string;
  accessible: string;
  steps: readonly (readonly [string, string])[];
};

const scenes: Record<number, EquipmentDetailContent> = {
  3568: {
    kind: "siren",
    kicker: "Aviso en campo de vuelo · UM-3568",
    title: "Un aviso en el campo de vuelo.",
    description:
      "Montaje de sirenas y avisos de emergencia en campo de vuelo. El detalle sigue la activación de una sirena hasta la emisión del aviso sonoro.",
    accessible:
      "Una señal de activación llega a una sirena de exterior. Tres frentes de onda salen de la boca del dispositivo y se expanden hacia el entorno. La escena no reproduce sonido.",
    steps: [
      ["Activación", "La señal inicia el aviso."],
      ["Emisión", "El dispositivo produce el sonido."],
      ["Entorno", "El aviso sonoro se propaga desde la sirena."],
    ],
  },

  3292: {
    kind: "siren",
    kicker: "Aviso en el perímetro · UM-3292",
    title: "Una señal que se hace escuchar.",
    description:
      "La sirena exterior convierte su activación en un aviso sonoro. El detalle sigue esa transición: de la señal de entrada a la emisión hacia el entorno.",
    accessible:
      "Una señal de activación llega a una sirena de exterior. Tres frentes de onda salen de la boca del dispositivo y se expanden hacia el entorno. La escena no reproduce sonido.",
    steps: [
      ["Activación", "La señal inicia el aviso."],
      ["Emisión", "El dispositivo produce el sonido."],
      ["Entorno", "El aviso sonoro se propaga desde la sirena."],
    ],
  },

  3602: {
    kind: "cable-duct",
    kicker: "Canalización · UM-3602",
    title: "El recorrido empieza por su contención.",
    description:
      "Insumos de cable canal para la Municipalidad de General San Martín: una mirada a la base y la tapa que forman el conjunto.",
    accessible:
      "La tapa de un cable canal se separa de su base para mostrar el interior. Ambas piezas vuelven a aproximarse sobre el mismo recorrido.",
    steps: [
      ["Base", "El perfil contiene el recorrido del cableado."],
      ["Acceso", "La tapa separable permite llegar al interior."],
      ["Conjunto", "Base y tapa forman la canalización."],
    ],
  },
  3463: {
    kind: "videowall",
    kicker: "Cuatro pantallas de 55 pulgadas · UM-3463",
    title: "Cuatro superficies. Una imagen continua.",
    description:
      "El sistema de videowall de Triunfo reúne cuatro televisores de 55 pulgadas. El detalle muestra cómo una composición se reparte entre las pantallas.",
    accessible:
      "Cuatro pantallas organizadas en dos filas reciben cuatro partes de una misma composición. Las cuatro partes se alinean para mostrar la continuidad visual.",
    steps: [
      ["Contenido", "Una composición define la imagen del conjunto."],
      ["Reparto", "Cada pantalla presenta una parte de esa imagen."],
      ["Continuidad", "Las cuatro partes se leen como una superficie."],
    ],
  },
  3667: {
    kind: "barcode",
    kicker: "Lectura de códigos · UM-3667",
    title: "De las barras a la información.",
    description:
      "El lector reconoce el patrón de un código y lo convierte en un dato para el equipo receptor.",
    accessible:
      "Un lector de códigos se muestra junto a una etiqueta. Una línea recorre las barras y la información leída aparece en un campo de entrada.",
    steps: [
      ["Patrón", "Las barras y los espacios representan información."],
      ["Lectura", "El lector reconoce y decodifica el patrón."],
      ["Dato", "El resultado pasa al equipo receptor."],
    ],
  },
};

/** Keep each device bound to the client and scope that were reviewed. */
export function equipmentDetailForCase(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
}): EquipmentDetailContent | undefined {
  return catalogPresentationFor(story) ? scenes[story.id] : undefined;
}
