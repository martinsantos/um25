import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/pages/antecedentes/[id]/[slug].astro');

// Read the file
let content = readFileSync(filePath, 'utf8');

// Replace stroke-* attributes
content = content.replace(/stroke-linecap="/g, 'strokeLinecap="');
content = content.replace(/stroke-linejoin="/g, 'strokeLinejoin="');
content = content.replace(/stroke-width=/g, 'strokeWidth=');

// Write the changes back to the file
writeFileSync(filePath, content, 'utf8');

console.log('SVG attributes updated successfully!');
