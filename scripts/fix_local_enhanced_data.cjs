const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/data/antecedentes_enhanced.js');
console.log(`Checking ${FILE}...`);

if (!fs.existsSync(FILE)) {
    console.error('File not found!');
    process.exit(1);
}

let content = fs.readFileSync(FILE, 'utf8');
const initialLength = content.length;

// Global replace
// matches "/imagenes_antecedentes_versionproduccion/._"
const regex = /\/imagenes_antecedentes_versionproduccion\/._/g;
const replacement = '/imagenes_antecedentes_versionproduccion/';

let matches = (content.match(regex) || []).length;
console.log(`Found ${matches} occurrences of "._" prefix.`);

if (matches > 0) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(FILE, content, 'utf8');
    console.log(`Replaced all. New length: ${content.length}. Delta: ${initialLength - content.length}`);
} else {
    console.log('No matches found. File is clean.');
}
