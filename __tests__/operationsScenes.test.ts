import {
  operationsSceneForService,
  operationsSceneForCase,
} from "../src/data/operationsScenes";
const mail = {
  id: 3128,
  client: "Eqalq S.R.L.",
  title: "Configuración de correo y carpetas compartidas",
  summary: "Google Drive y permisos de acceso",
  serviceCodes: ["105"],
};
const payment = {
  id: 3529,
  client: "Cliente Confidencial",
  title:
    "Integración de Mercado Pago [API] al Módulo de Creación de Notas de Pedido",
  summary: "Integración por API",
  serviceCodes: ["104"],
};
const hosting = {
  id: 3083,
  client: "Municipalidad Guaymallén",
  title: "Alojamiento y mantenimiento de la página web municipal",
  summary: "",
  serviceCodes: ["104", "105"],
};
describe("reviewed operational scenes", () => {
  test("the three services have distinct purposes", () => {
    expect(
      ["104", "105", "106"].map(
        (code) => operationsSceneForService(code)?.kind,
      ),
    ).toEqual(["software", "support", "consulting"]);
    expect(operationsSceneForService("102")).toBeUndefined();
  });
  test("mail shows permissions rather than a generic hardware incident", () => {
    expect(operationsSceneForCase(mail)?.kind).toBe("workspace");
    expect(
      operationsSceneForCase({ ...mail, client: "Otro cliente" }),
    ).toBeUndefined();
  });
  test("payment scope admits an exchange, never an invented paid status", () => {
    const scene = operationsSceneForCase(payment);
    expect(scene?.kind).toBe("payments");
    expect(JSON.stringify(scene)).not.toMatch(
      /pago aprobado|cobro confirmado|transacción exitosa/i,
    );
    expect(
      operationsSceneForCase({
        ...payment,
        title: "Nueva instalación eléctrica",
        summary: "",
      }),
    ).toBeUndefined();
  });
  test("hosting is gated by client, service and recorded scope", () => {
    expect(operationsSceneForCase(hosting)?.kind).toBe("hosting");
    expect(
      operationsSceneForCase({ ...hosting, client: "Cliente Confidencial" }),
    ).toBeUndefined();
    expect(
      operationsSceneForCase({ ...hosting, serviceCodes: ["101"] }),
    ).toBeUndefined();
    expect(
      operationsSceneForCase({
        ...hosting,
        title: "Soporte técnico",
        summary: "",
      }),
    ).toBeUndefined();
  });
  test("a different record cannot inherit the scene by keyword", () => {
    expect(operationsSceneForCase({ ...mail, id: 9999 })).toBeUndefined();
  });
});
