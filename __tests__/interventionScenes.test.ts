import { interventionSceneForCase } from "../src/data/interventionScenes";
import reviewed from "./fixtures/catalog-review-cases.json";
import published from "./fixtures/catalog-production-identities.json";

const cases = [
  reviewed.find((row) => row.id === 3604)!,
  {
    id: 3229,
    client: "Aeropuertos Argentina 2000",
    title: "Búsqueda y reparación pérdida red incendio · Aeropuerto de Tucuman",
    summary:
      "Búsqueda y reparación de una pérdida en la red de incendio del Aeropuerto de Tucumán.",
  },
  {
    id: 3490,
    client: "Cervecería y Maltería Quilmes",
    title: "Reparación de bridas de transformador",
    summary:
      "Reparación de bridas de transformador para Cervecería y Maltería Quilmes.",
  },
];

describe("specific intervention scenes", () => {
  test.each(cases)("recognizes the reviewed scope of $id", (story) => {
    expect(interventionSceneForCase(story)).toBeDefined();
    const publicStory = published.find((row) => row.id === story.id);
    if (publicStory)
      expect(interventionSceneForCase(publicStory)).toBeDefined();
  });

  test.each(cases)("changed scope cannot inherit scene $id", (story) => {
    for (const field of ["title", "client", "summary"] as const)
      expect(
        interventionSceneForCase({ ...story, [field]: "Otro alcance" }),
      ).toBeUndefined();
  });

  test("does not reintroduce excluded or quoted work", () => {
    for (const id of [3300, 3636])
      expect(
        interventionSceneForCase(reviewed.find((row) => row.id === id)!),
      ).toBeUndefined();
  });

  test("peripherals remain capture and barcode devices, not CCTV", () => {
    const scene = interventionSceneForCase(cases[0]);
    expect(scene?.kind).toBe("peripherals");
    expect(JSON.stringify(scene)).not.toMatch(
      /CCTV|vigilancia|grabador|acceso|NVR/i,
    );
  });

  test("maintenance imagery does not invent specifications or test results", () => {
    for (const story of cases.slice(1))
      expect(JSON.stringify(interventionSceneForCase(story))).not.toMatch(
        /bar\b|kVA|NFPA|certificad|presuriz|transformador seco/i,
      );
  });
});
