import {writeFileSync} from 'node:fs';
import {NETWORKS,SYSTEM_STYLE} from '../src/hospitalSystems.js';
writeFileSync(new URL('../work/blender/sectors/hospital-network.json',import.meta.url),JSON.stringify({networks:NETWORKS,styles:SYSTEM_STYLE},null,2));
