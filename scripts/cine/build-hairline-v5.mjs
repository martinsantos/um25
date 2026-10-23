// Rebuild the MIT Hairline app-window module without unrelated figures.
import { build } from 'esbuild';
await build({
  entryPoints:['scripts/cine/vendor/hairline-v5-entry.js'],bundle:true,minify:true,format:'esm',
  outfile:'public/cine/hairline-v5.js',
  banner:{js:'/* Hairline 0.2.0, MIT; lucasmarkes/hairline. UM25 keyboard layer controls. See LICENSE-hairline-v5.txt. */'},
});
