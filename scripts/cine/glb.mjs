/**
 * Lectura de un .glb con mallas Draco (los modelos de public/3d/models) a triángulos en
 * coordenadas del mundo del kit: x e y en el piso, z hacia arriba. Devuelve, por nodo:
 * { name, system, material, positions: Float32Array (xyz), indices: Uint32Array }.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);

let decoderPromise;
function decoder() {
  if (!decoderPromise) {
    // El decodificador (emscripten) declara `var DracoDecoderModule`; se evalúa en una función propia.
    const code = readFileSync(new URL('../../public/3d/models/draco/draco_decoder.js', import.meta.url), 'utf8');
    const dir = dirname(fileURLToPath(new URL('../../public/3d/models/draco/draco_decoder.js', import.meta.url)));
    const factory = new Function('module', 'exports', 'require', '__dirname', `${code}\n;return DracoDecoderModule;`)({}, {}, require, dir);
    decoderPromise = factory({});
  }
  return decoderPromise;
}

/** glTF: x derecha, y arriba, z hacia el espectador → kit: [x, -z, y]. */
const aKit = ([x, y, z]) => [x, -z, y];

function matrizDe(node) {
  // Sólo traslación, rotación (cuaternión) y escala; los modelos del sitio no usan matrices.
  const t = node.translation || [0, 0, 0], q = node.rotation || [0, 0, 0, 1], s = node.scale || [1, 1, 1];
  const [qx, qy, qz, qw] = q;
  const R = [
    1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw),
    2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw),
    2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy),
  ];
  return (p) => {
    const x = p[0] * s[0], y = p[1] * s[1], z = p[2] * s[2];
    return [R[0] * x + R[1] * y + R[2] * z + t[0], R[3] * x + R[4] * y + R[5] * z + t[1], R[6] * x + R[7] * y + R[8] * z + t[2]];
  };
}

export async function leerGlb(ruta) {
  const buf = readFileSync(ruta);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  const bin = buf.subarray(binStart);
  const draco = await decoder();
  const dec = new draco.Decoder();
  const nodos = [];
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    const mesh = json.meshes[node.mesh];
    const xf = matrizDe(node);
    for (const prim of mesh.primitives) {
      const ext = prim.extensions?.KHR_draco_mesh_compression;
      if (!ext) continue;
      const bv = json.bufferViews[ext.bufferView];
      const data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      const dbuf = new draco.DecoderBuffer();
      dbuf.Init(new Int8Array(data), data.length);
      const geom = new draco.Mesh();
      const st = dec.DecodeBufferToMesh(dbuf, geom);
      if (!st.ok()) { console.error('draco', st.error_msg()); continue; }
      const nFaces = geom.num_faces(), nPts = geom.num_points();
      const posId = ext.attributes.POSITION;
      const attr = dec.GetAttributeByUniqueId(geom, posId);
      const arr = new draco.DracoFloat32Array();
      dec.GetAttributeFloatForAllPoints(geom, attr, arr);
      const positions = new Float32Array(nPts * 3);
      for (let i = 0; i < nPts; i++) {
        const p = xf([arr.GetValue(i * 3), arr.GetValue(i * 3 + 1), arr.GetValue(i * 3 + 2)]);
        const w = aKit(p);
        positions[i * 3] = w[0]; positions[i * 3 + 1] = w[1]; positions[i * 3 + 2] = w[2];
      }
      const indices = new Uint32Array(nFaces * 3);
      const face = new draco.DracoInt32Array();
      for (let f = 0; f < nFaces; f++) { dec.GetFaceFromMesh(geom, f, face); indices[f * 3] = face.GetValue(0); indices[f * 3 + 1] = face.GetValue(1); indices[f * 3 + 2] = face.GetValue(2); }
      draco.destroy(face); draco.destroy(arr); draco.destroy(geom); draco.destroy(dbuf);
      const [system, material] = (node.name || '').split('__');
      nodos.push({ name: node.name, system: node.extras?.system || system, material: material || '', positions, indices });
    }
  }
  draco.destroy(dec);
  return nodos;
}
