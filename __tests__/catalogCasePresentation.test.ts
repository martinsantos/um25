import { existsSync } from "node:fs";
import inventory from "../src/data/catalogCasePresentation.json";
import fixtures from "./fixtures/catalog-review-cases.json";
import {
  catalogPresentationFor,
  catalogSceneForCase,
} from "../src/data/catalogCasePresentation";
import { caseEquipmentFor } from "../src/components/proto/casePresentation";
const record = (id: number) => fixtures.find((r) => r.id === id)!;
describe("reviewed catalog scope and animation", () => {
  test("all 520 existing identities have an explicit presentation decision", () => {
    expect(Object.keys(inventory)).toHaveLength(520);
    for (const row of Object.values(inventory)) {
      expect(row.identity.length).toBeGreaterThan(3);
      if (row.asset && !["optical", "rack", "server"].includes(row.asset))
        expect(existsSync(`src/assets/catalog-scenes/${row.asset}.webp`)).toBe(
          true,
        );
    }
  });
  test.each(fixtures.map((f) => [f.id]))(
    "changed source cannot inherit review for %s",
    (id) => {
      const r = record(id as number);
      expect(catalogPresentationFor(r)).toBeDefined();
      expect(
        catalogPresentationFor({
          ...r,
          summary: r.summary + " Nuevo alcance eléctrico.",
        }),
      ).toBeUndefined();
      expect(
        catalogPresentationFor({ ...r, client: "Otro cliente" }),
      ).toBeUndefined();
    },
  );
  test.each([3613, 3616])(
    "optical connectors %s never become workstations",
    (id) => {
      expect(caseEquipmentFor(record(id)).partes.map((p) => p.key)).toEqual([
        "fibra",
      ]);
    },
  );
  test.each([3260, 3665, 3671])(
    "telephone PBX %s never becomes a fire panel",
    (id) => {
      expect(
        caseEquipmentFor(record(id)).partes.some((p) => p.code === "107"),
      ).toBe(false);
      expect(catalogSceneForCase(record(id))?.asset).toBe("pbx");
    },
  );
  test("SDI in an access-control room is a fire detection job", () => {
    expect(catalogSceneForCase(record(3111))?.asset).toBe("fire-panel");
    expect(
      caseEquipmentFor(record(3111)).partes.some((p) => p.key === "acceso"),
    ).toBe(false);
  });
  test("DVR disk replacement and CCTV cable replacement use the intervened part", () => {
    expect(catalogSceneForCase(record(3591))?.asset).toBe("drive-v2");
    for (const id of [3358, 3385])
      expect(catalogSceneForCase(record(id))?.asset).toBe("cctv-termination");
  });
  test("company and sector metadata cannot invent CCTV or SDI", () => {
    expect(caseEquipmentFor(record(3143)).partes.map((p) => p.key)).toEqual([
      "fibra",
    ]);
    expect(
      caseEquipmentFor(record(3281)).partes.some((p) => p.key === "camara"),
    ).toBe(false);
  });
  test.each([3636, 3300, 3419])(
    "quotation, exclusion or contradictory scope %s stays still",
    (id) => {
      expect(catalogSceneForCase(record(id))).toBeUndefined();
    },
  );
  test("attendance does not imply opening a door", () => {
    for (const id of [3211, 3430]) {
      const c = catalogSceneForCase(record(id));
      expect(c?.kind).toBe("attendance");
      expect(JSON.stringify(c)).not.toMatch(/habilita|puerta|apertura/);
    }
  });
  test("barcode readers and software modules do not become security hardware", () => {
    for (const id of [3604, 3667])
      expect(
        caseEquipmentFor(record(id)).partes.some((p) =>
          ["acceso", "camara"].includes(p.key),
        ),
      ).toBe(false);
    for (const id of [3507, 3529])
      expect(
        caseEquipmentFor(record(id)).partes.some((p) => p.code === "107"),
      ).toBe(false);
  });
});

test.each([
  [3405, "raised-floor"],
  [3576, "halogen-tripod"],
  [3673, "phone-power-supply"],
  [3581, "capacitor-bank"],
  [3577, "capacitor-bank"],
])("specific physical scope %s uses its own equipment", (id, asset) => {
  const scene = catalogSceneForCase(record(id as number));
  expect(scene?.asset).toBe(asset);
  expect(JSON.stringify(scene)).not.toMatch(/LED|UPS|batería/);
});
