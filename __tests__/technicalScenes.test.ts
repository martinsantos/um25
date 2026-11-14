import {
  technicalSceneForCase,
  technicalSceneForService,
} from "../src/data/technicalScenes";
const story = (id: number, client: string, code: string) => ({
  id,
  client,
  title: "Registro",
  summary: "",
  serviceCodes: [code],
});
describe("reviewed technical scenes", () => {
  it("limits the local batch to three new services", () => {
    expect(
      ["101", "103", "107"].map((code) => technicalSceneForService(code)?.kind),
    ).toEqual(["network", "radio", "fire"]);
    for (const code of ["102", "104", "105", "106", "108", "999"])
      expect(technicalSceneForService(code)).toBeUndefined();
  });
  it("requires both reviewed client identity and the relevant service", () => {
    expect(
      technicalSceneForCase(story(3099, "Headcomm S.A.", "101"))?.kind,
    ).toBe("cabling");
    expect(
      technicalSceneForCase(story(3126, "Aeropuertos Argentina 2000", "107"))
        ?.kind,
    ).toBe("fire");
    expect(
      technicalSceneForCase(
        story(
          3144,
          "Ministerio de Desarrollo Social, Salud y Deportes del Gobierno de MZA",
          "101",
        ),
      )?.kind,
    ).toBe("cabling");
    expect(
      technicalSceneForCase(story(3099, "Otro cliente", "101")),
    ).toBeUndefined();
    expect(
      technicalSceneForCase(story(3126, "Aeropuertos Argentina 2000", "105")),
    ).toBeUndefined();
    expect(
      technicalSceneForCase(story(3300, "Headcomm S.A.", "101")),
    ).toBeUndefined();
  });
  it("keeps passive cabling scopes free of active equipment claims", () => {
    for (const s of [
      story(3099, "Headcomm S.A.", "101"),
      story(
        3144,
        "Ministerio de Desarrollo Social, Salud y Deportes del Gobierno de MZA",
        "101",
      ),
    ]) {
      const content = technicalSceneForCase(s)!;
      expect(JSON.stringify(content)).not.toMatch(
        /switch|servidor|UPS|radioenlace/i,
      );
      expect(content.steps).toHaveLength(3);
    }
  });
});
