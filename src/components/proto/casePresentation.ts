import { catalogPresentationFor } from "../../data/catalogCasePresentation";
import { casoDestacadoDe } from "../../data/propuesta/casos-destacados";
import { isNamedClient } from "./catalogEditorial";
import { despieceDe, type Despiece } from "./despiece";

const identity = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** A shared anonymous label never establishes a relationship between customers. */
export function samePublicClient(left: string, right: string): boolean {
  return (
    isNamedClient(left) &&
    isNamedClient(right) &&
    identity(left) === identity(right)
  );
}

/** Editorial additions cannot override a changed or anonymized live CMS identity. */
export function publicCaseFor(story: { id: number; client: string }) {
  const detail = casoDestacadoDe(story.id);
  return detail && samePublicClient(detail.client, story.client)
    ? detail
    : undefined;
}

/** Legacy exports append the customer and classification to the job description. */
export function caseIntroduction(summary: string, title: string, client: string): string {
  const footer = /(?:^|\s)Cliente:\s*(.+?)\.\s+Sector:\s*([\p{L}\p{N} &/-]+)\.?$/iu.exec(summary);
  const customer = identity(client);
  let body = summary.trim();
  if (footer?.[1] && customer && identity(footer[1]) === customer) {
    body = summary.slice(0, footer.index).trim();
  }
  const words = identity(body);
  if (!words || words === identity(title) || words === customer ||
      (customer && identity(body.replace(/\s*\(\d+\)$/, '')) === customer)) return '';
  if (body !== summary.trim() && body.includes(':')) {
    const subject = identity(body.slice(body.indexOf(':') + 1));
    if (subject === identity(title) + ' ' + customer) return '';
  }
  return body;
}

export function publicCaseTitle(story: { id: number; client: string; title: string }) {
  return publicCaseFor(story)?.title || story.title;
}

/** Public archive titles remain searchable under their original CMS wording. */
export function archiveIdentity(story: {
  id: number; client: string; title: string; sector: string; services: string[]; summary: string;
}) {
  const detail = publicCaseFor(story);
  const title = detail?.title || story.title;
  const terms = [`UM-${story.id}`, story.client, story.title, story.sector, ...story.services, story.summary];
  if (title !== story.title) terms.push(title);
  return { title, reviewed: Boolean(detail), search: terms.join(' ') };
}

/** The reviewed inventory and the editorial case share the same live identity gate. */
export function caseEquipmentFor(story: {
  id: number;
  client: string;
  title: string;
  summary: string;
  serviceCodes: string[];
}): Despiece {
  const detail = publicCaseFor(story);
  if (detail) return { partes: detail.parts, origen: "registro" };
  if (story.id === 3128 && /correo.*carpetas compartidas/i.test(story.title)) {
    return {
      origen: "registro",
      partes: [
        { key: "pantalla", code: "105", label: "Cuenta de correo" },
        { key: "servidor", code: "105", label: "Carpetas y permisos" },
      ],
    };
  }
  // Local preview: “módulo” in this case refers to software; don't render a fire module.
  if (
    story.id === 3529 &&
    /mercado pago/i.test(story.title) &&
    /notas? de pedido/i.test(story.title)
  ) {
    return {
      origen: "registro",
      partes: [
        { key: "pantalla", code: "104", label: "Módulo de notas de pedido" },
        { key: "servidor", code: "104", label: "Integración de pagos por API" },
      ],
    };
  }
  const reviewed = catalogPresentationFor(story);
  if (reviewed) return { origen: "registro", partes: reviewed.parts };
  const derived = despieceDe(story.title, story.summary, story.serviceCodes);
  return derived.origen === "registro"
    ? derived
    : { origen: "registro", partes: [] };
}
