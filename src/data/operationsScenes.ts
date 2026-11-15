export type OperationsKind =
  | "software"
  | "support"
  | "consulting"
  | "payments"
  | "workspace"
  | "hosting";
export type OperationsContent = {
  kind: OperationsKind;
  kicker: string;
  title: string;
  description: string;
  accessible: string;
  steps: readonly (readonly [string, string])[];
};
const scenes: Partial<Record<string, OperationsContent>> = {
  "104": {
    kind: "software",
    kicker: "Software a medida",
    title: "El dato llega. El proceso avanza.",
    description:
      "Una operación conecta la interfaz, las reglas del negocio y los sistemas que ya usás. La respuesta vuelve al mismo lugar donde empezó el trabajo.",
    accessible:
      "Una solicitud sale de la interfaz, atraviesa la lógica del sistema y recibe una respuesta. La interfaz recibe el resultado.",
    steps: [
      ["Solicitud", "La interfaz recibe la operación."],
      ["Integración", "El sistema aplica reglas y conecta servicios."],
      ["Respuesta", "El resultado vuelve al flujo de trabajo."],
    ],
  },
  "105": {
    kind: "support",
    kicker: "Soporte 24/7",
    title: "De la señal al diagnóstico.",
    description:
      "Un incidente se reconoce, se analiza y se atiende. El seguimiento permite conocer qué se revisó y cómo continúa la operación.",
    accessible:
      "Una señal de incidencia se registra, se revisa el componente afectado y se documenta la intervención. El seguimiento reúne las etapas de atención.",
    steps: [
      ["Registro", "El incidente entra al circuito de atención."],
      ["Diagnóstico", "Se revisa el servicio y su infraestructura."],
      ["Seguimiento", "La intervención queda documentada."],
    ],
  },
  "106": {
    kind: "consulting",
    kicker: "Consultoría IT",
    title: "Medir antes de decidir.",
    description:
      "El relevamiento convierte el estado de una instalación en decisiones técnicas: qué conservar, qué corregir y cómo ordenar la próxima etapa.",
    accessible:
      "Un instrumento de medición acompaña un recorrido de relevamiento, análisis y definición de prioridades. El informe organiza los hallazgos de la instalación.",
    steps: [
      ["Relevar", "Registrar la infraestructura y sus condiciones."],
      ["Analizar", "Relacionar los hallazgos con la operación."],
      ["Priorizar", "Ordenar acciones y criterios de implementación."],
    ],
  },
};
export const operationsSceneForService = (code: string) => scenes[code];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Named, reviewed records only. A changed identity or scope disables the scene. */
export function operationsSceneForCase(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
  serviceCodes: string[];
}): OperationsContent | undefined {
  const text = normalize(`${story.title} ${story.summary}`);
  if (
    story.id === 3529 &&
    normalize(story.client) === "cliente confidencial" &&
    story.serviceCodes.includes("104") &&
    /mercado pago/.test(text) &&
    /notas de pedido/.test(text)
  )
    return {
      kind: "payments",
      kicker: "Integración de pagos · UM-3529",
      title: "El pedido se comunica con el servicio de pago.",
      description:
        "La integración conecta el módulo de notas de pedido con la API de Mercado Pago. El recorrido distingue el pedido, la comunicación entre sistemas y la respuesta.",
      accessible:
        "Recorrido conceptual entre una nota de pedido y la API del servicio de pago. El pedido y el servicio de pago intercambian información.",
      steps: [
        ["Pedido", "Módulo de creación de notas de pedido."],
        ["API", "Integración con Mercado Pago."],
        ["Intercambio", "Comunicación entre ambos sistemas."],
      ],
    };
  if (
    story.id === 3128 &&
    normalize(story.client) === "eqalq s r l" &&
    story.serviceCodes.includes("105") &&
    /correo/.test(text) &&
    /carpetas/.test(text)
  )
    return {
      kind: "workspace",
      kicker: "Correo y colaboración · UM-3128",
      title: "Cada carpeta, con el acceso que corresponde.",
      description:
        "Una cuenta de correo y una estructura de carpetas personales y compartidas en Google Drive. Los permisos definen quién puede acceder a cada espacio.",
      accessible:
        "Una cuenta de correo acompaña dos espacios: personal y compartido. Un permiso se asocia a la carpeta compartida.",
      steps: [
        ["Cuenta", "Configuración de correo."],
        ["Estructura", "Carpetas personales y compartidas."],
        ["Acceso", "Organización de permisos."],
      ],
    };
  if (
    story.id === 3083 &&
    normalize(story.client) === "municipalidad guaymallen" &&
    story.serviceCodes.includes("105") &&
    /alojamiento/.test(text) &&
    /mantenimiento/.test(text)
  )
    return {
      kind: "hosting",
      kicker: "Sitio web municipal · UM-3083",
      title: "El sitio, detrás de cada consulta.",
      description:
        "El antecedente registra alojamiento y mantenimiento de la página web municipal. El recorrido sitúa el servidor detrás de la consulta que realiza una persona al sitio.",
      accessible:
        "Una consulta llega al alojamiento web y la respuesta vuelve al navegador. El alojamiento atiende la solicitud del navegador.",
      steps: [
        ["Consulta", "Una persona accede al sitio web."],
        ["Alojamiento", "El servidor atiende la solicitud."],
        ["Mantenimiento", "El servicio acompaña la operación del sitio."],
      ],
    };
  return undefined;
}
