// Exporta el inventario AR del motor Cine (mismo que usa cinemaAR.js) a JSON
// en coordenadas Blender (Z arriba), para proyectar etiquetas sobre los renders.
// Uso (desde work/um-territorio): node ../cine/scripts/export-ar-assets.mjs > ../cine/ar-assets.json
import { cinemaAssets } from '../../um-territorio/src/cinemaAR.js';

const out = {};
for (const scene of ['hospital', 'aeropuerto', 'bodega', 'fachada']) {
  out[scene] = cinemaAssets(scene).map((a) => ({
    id: a.id, system: a.system, name: a.name, kind: a.kind || null,
    p: [+a.position.x.toFixed(3), +(-a.position.z).toFixed(3), +a.position.y.toFixed(3)],
    metric: a.metric,
  }));
}
process.stdout.write(JSON.stringify(out, null, 1));
