import { connectionSceneForCase } from "../src/data/connectionScenes";
const rack = {
  id: 3072,
  client: "Hospital a Italo Perrupato",
  title: "Rack y patch panel",
  summary: "",
  serviceCodes: ["101"],
};
const fiber = {
  id: 3080,
  client: "Aeropuertos Argentina 2000",
  title: "Implementación de redes de datos y fibra óptica",
  summary: "",
  serviceCodes: ["101"],
};
describe("reviewed connection details", () => {
  test("the two records have distinct scenes", () => {
    expect(connectionSceneForCase(rack)?.kind).toBe("rack-detail");
    expect(connectionSceneForCase(fiber)?.kind).toBe("optical-detail");
  });
  test("scope cannot migrate to another project", () => {
    expect(connectionSceneForCase({ ...rack, id: 3073 })).toBeUndefined();
    expect(connectionSceneForCase({ ...fiber, id: 3099 })).toBeUndefined();
  });
  test("changed identities suppress the scene", () => {
    expect(
      connectionSceneForCase({ ...rack, client: "Otro hospital" }),
    ).toBeUndefined();
    expect(
      connectionSceneForCase({ ...fiber, client: "Otro cliente" }),
    ).toBeUndefined();
  });
  test("changed service or scope suppresses the scene", () => {
    expect(
      connectionSceneForCase({ ...rack, serviceCodes: ["108"] }),
    ).toBeUndefined();
    expect(
      connectionSceneForCase({ ...rack, title: "Soporte" }),
    ).toBeUndefined();
    expect(
      connectionSceneForCase({ ...fiber, title: "Cableado de cobre" }),
    ).toBeUndefined();
  });
  test("passive parts do not promise invented certification, quantities or active switching", () => {
    for (const item of [rack, fiber])
      expect(JSON.stringify(connectionSceneForCase(item))).not.toMatch(
        /certificad|conmuta|UPS|24 puertos|monomodo|Cat\.? ?6/,
      );
  });
});
