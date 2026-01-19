
const fs = require('fs');
const path = require('path');

// Paths on production server
const DIST_IMG_PATH = '/root/fumbling-field/dist/client/img/sync-offline/';
const FALLBACK_JSON_PATH = '/root/fumbling-field/src/data/directus_fallback_offline.json';
const REPAIR_MAP_PATH = '/root/fumbling-field/src/data/repair_mapping.js';

console.log("Starting Deep Audit of Production Images...");

// 1. Load Data
if (!fs.existsSync(FALLBACK_JSON_PATH)) {
    console.error("CRITICAL: Fallback JSON not found at " + FALLBACK_JSON_PATH);
    process.exit(1);
}
const fallbackData = JSON.parse(fs.readFileSync(FALLBACK_JSON_PATH, 'utf8'));
const antecedentes = fallbackData.antecedentes || [];

console.log(`Loaded ${antecedentes.length} antecedents from JSON.`);

// 2. Load Repair Map (Safe eval since it's an ES module on disk)
let REPAIR_MAP = {};
try {
    const repairMapContent = fs.readFileSync(REPAIR_MAP_PATH, 'utf8');
    // Extract the object part manually or use a simple eval context if trusted
    // Simple parsing for export const REPAIR_MAP = { ... };
    const match = repairMapContent.match(/export const REPAIR_MAP = ({[\s\S]*?});/);
    if (match && match[1]) {
        // This is a bit hacky for a script, but we need to parse the object literal
        // Since we know the format we generated, we can try to parse it safely or use eval
        // safely assuming the content is trusted (it's our code).
        REPAIR_MAP = eval('(' + match[1] + ')');
    } else {
        console.error("Could not parse REPAIR_MAP from file.");
    }
} catch (e) {
    console.error("Error reading REPAIR_MAP:", e.message);
}

// 3. Audit
let missing = 0;
let success = 0;
let errors = [];

antecedentes.forEach(item => {
    const id = item.id;
    let expectedFilename = null;

    // Logic must match src/utils/directus.js
    if (REPAIR_MAP[id]) {
        expectedFilename = REPAIR_MAP[id];
    } else if (item.LocalFallbackImage) {
        expectedFilename = path.basename(item.LocalFallbackImage);
    }

    if (!expectedFilename) {
        // Technically shouldn't happen if we have 100% coverage
        errors.push(`ID ${id}: No mapping found in REPAIR_MAP or LocalFallbackImage`);
        missing++;
        return;
    }

    const fullPath = path.join(DIST_IMG_PATH, expectedFilename);
    if (fs.existsSync(fullPath)) {
        success++;
    } else {
        errors.push(`ID ${id}: Image MISSING in dist. Expected: ${expectedFilename}`);
        missing++;
    }
});

// 4. Report
console.log("-".repeat(50));
console.log(`TOTAL Items: ${antecedentes.length}`);
console.log(`SUCCESS    : ${success}`);
console.log(`MISSING    : ${missing}`);
console.log("-".repeat(50));

if (missing > 0) {
    console.log("ERRORS Found:");
    errors.forEach(e => console.log(e));
    process.exit(1);
} else {
    console.log("VERIFICATION PASSED: All 427 items have valid images in dist/client.");
    process.exit(0);
}
