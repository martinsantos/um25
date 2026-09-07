// Builds only the hospital, never the prototype catalogue or SGI content.
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,cp} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'../../public/hospital-3d');
await build({configFile:false,root,base:'/hospital-3d/',publicDir:false,plugins:[react()],build:{outDir:out,emptyOutDir:false,rollupOptions:{input:resolve(root,'hospital.html')}}});
await mkdir(resolve(out,'models'),{recursive:true});
for(const file of ['hospital-walkthrough.glb','hospital-services.glb','hospital-terminals.glb','hospital-workstations.glb','draco'])await cp(resolve(root,'public/models',file),resolve(out,'models',file),{recursive:true});
console.log('Hospital packaged locally. Nothing deployed.');
