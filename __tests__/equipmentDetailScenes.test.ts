import { equipmentDetailForCase } from "../src/data/equipmentDetailScenes";
import reviewed from "./fixtures/catalog-review-cases.json";
import published from "./fixtures/catalog-production-identities.json";

const cases = [
  {
    id: 3568,
    title: "Montaje de sirenas y avisos de emergencia en campo de vuelo",
    client: "Cliente Confidencial",
    summary: "",
  },
  {
    id: 3292,
    title: "Provisión de sirena en perimetro exterior",
    client: "Cliente Confidencial",
    summary:
      "Provision de sirena en perimetro exterior para Cliente Confidencial.",
  },
  {
    id: 3602,
    client: "Municipalidad de Gral San Martín",
    title: "Insumos de cable canal",
    summary:
      "Provisión de insumos de cable canal para la Municipalidad de General San Martín.",
  },
  {
    id: 3463,
    client: "Triunfo Cooperativa de Seguros Limitada",
    title: "Sistema de videowall",
    summary:
      "Sistema de videowall compuesto por cuatro televisores de 55 pulgadas.",
  },
  {
    id: 3667,
    client: "Cliente Confidencial",
    title: "Lector de código de barra",
    summary: "",
  },
];

describe("reviewed equipment details", () => {
  test.each(cases)("recognizes the documented scope of $id", (story) => {
    expect(equipmentDetailForCase(story)).toBeDefined();
    const live = published.find((row) => row.id === story.id);
    if (live) expect(equipmentDetailForCase(live)).toBeDefined();
  });

  test.each(cases)("rejects a changed scope for $id", (story) => {
    for (const field of ["client", "title", "summary"] as const)
      expect(
        equipmentDetailForCase({ ...story, [field]: "Otro alcance" }),
      ).toBeUndefined();
  });

  test("barcode capture does not imply access control or surveillance", () => {
    expect(
      JSON.stringify(
        equipmentDetailForCase(cases.find((row) => row.id === 3667)!),
      ),
    ).not.toMatch(/CCTV|vigilancia|acceso|credencial|NVR/i);
  });

  test("sirens do not add unrecorded integration claims", () => {
    for (const id of [3292, 3568]) {
      const content = equipmentDetailForCase(
        cases.find((row) => row.id === id)!,
      );
      expect(JSON.stringify(content)).not.toMatch(
        /[0-9]+\s*(?:dB|W|km|pulgadas)|Android|iOS|PoE|Wi-Fi|incendio|evacuación/i,
      );
    }
  });

  test("keeps the simple tablet provision without an animation", () => {
    expect(
      equipmentDetailForCase({
        id: 3571,
        title: "Provisión de Tablets",
        client: "Cliente Confidencial",
        summary: "",
      }),
    ).toBeUndefined();
  });

  test("does not assign diagrams to excluded or quoted work", () => {
    for (const id of [3300, 3636])
      expect(
        equipmentDetailForCase(reviewed.find((row) => row.id === id)!),
      ).toBeUndefined();
  });
});
