export type ConnectionContent = {
  kind: "rack-detail" | "optical-detail";
  kicker: string;
  title: string;
  description: string;
  accessible: string;
  steps: readonly (readonly [string, string])[];
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
/** Only these reviewed records; a changed source identity suppresses the scene. */
export function connectionSceneForCase(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
  serviceCodes: string[];
}): ConnectionContent | undefined {
  const text = normalize(`${story.title} ${story.summary}`);
  if (!story.serviceCodes.includes("101")) return undefined;
  if (
    story.id === 3072 &&
    normalize(story.client) === "hospital a italo perrupato" &&
    /rack/.test(text) &&
    /patch panel/.test(text)
  )
    return {
      kind: "rack-detail",
      kicker: "Rack y patch panel · UM-3072",
      title: "Una conexión que se puede seguir.",
      description:
        "El rack concentra las conexiones. El patch panel organiza sus terminaciones y permite reconocer cada punto sin perder de vista el conjunto.",
      accessible:
        "Un rack y su patch panel se ven completos y en detalle. El acercamiento recorre el soporte, los puertos del panel y la organización de los cables.",
      steps: [
        ["Estructura", "El rack reúne y sostiene los componentes."],
        ["Terminación", "Los cables llegan a los puertos del patch panel."],
        ["Organización", "Las conexiones quedan accesibles para trabajar."],
      ],
    };
  if (
    story.id === 3080 &&
    normalize(story.client) === "aeropuertos argentina 2000" &&
    /fibra optica/.test(text)
  )
    return {
      kind: "optical-detail",
      kicker: "Fibra óptica · UM-3080",
      title: "Acercarse al punto de conexión.",
      description:
        "La fibra tiene un recorrido físico: cable, conector y terminación. Mirar esa unión de cerca ayuda a entender cómo se organiza un enlace óptico.",
      accessible:
        "Vista cercana de una terminación óptica. El detalle recorre el cable, el conector y el frente de conexiones, con curvas amplias en la fibra.",
      steps: [
        ["Cable", "La fibra llega hasta el punto de conexión."],
        ["Conector", "La unión alinea los extremos ópticos."],
        ["Terminación", "El frente organiza y protege las conexiones."],
      ],
    };
  return undefined;
}
