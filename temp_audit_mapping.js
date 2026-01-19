
import { mapeoImagenes, buscarImagenPorDatos } from "./src/data/mapeo_imagenes_completo.js";
import fs from "fs";

const allAntecedentes = JSON.parse(fs.readFileSync("all_antecedentes_api.json", "utf8"));
const results = [];
let mappedCount = 0;

allAntecedentes.forEach(a => {
    // Try to find unique image using the documented function
    const filename = buscarImagenPorDatos(a.Cliente, a.Area, a.Titulo, a.id);
    if (filename) {
        results.push({ id: a.id, title: a.Titulo, client: a.Cliente, filename: filename });
        mappedCount++;
    } else {
        results.push({ id: a.id, title: a.Titulo, client: a.Cliente, filename: null });
    }
});

console.log("Total Antecedentes: " + allAntecedentes.length);
console.log("Mapped Successfully: " + mappedCount);
console.log("Missing: " + (allAntecedentes.length - mappedCount));

fs.writeFileSync("master_mapping_results.json", JSON.stringify(results, null, 2));
