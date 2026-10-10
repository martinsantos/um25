import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {chromium} from 'playwright';
const root=process.env.UM_TEMPLATE_WORK||path.join(os.tmpdir(),'um-sans-template-build');
const repo=process.env.UM_TEMPLATE_REPO||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
await fs.mkdir(root+'/entrega',{recursive:true});
await fs.mkdir(root+'/qa',{recursive:true});
const src=path.join(repo,'public/images/logo-light.svg');
const original=await fs.readFile(src,'utf8');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let bounds;
try { const page=await browser.newPage();await page.setContent(original);bounds=await page.locator('svg').evaluate(svg=>{const b=svg.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height}}); }
finally { await browser.close(); }
// Preserve every official path. Only the image viewport follows the visible ink.
const svg=original.replace(/viewBox="[^"]+"/,`viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}"`);
await fs.writeFile(root+'/logo.svg',svg);
await sharp(Buffer.from(svg),{density:300}).png().toFile(root+'/logo.png');
// Spreadsheet previewers may minify bitmap images without filtering. A 2x
// screen fallback keeps antialiased edge pixels at the 204 px header width;
// the SVG remains the native Office/print representation.
await sharp(Buffer.from(svg),{density:300}).resize({width:408,kernel:'lanczos3'}).flatten({background:'#FFFFFF'}).blur(0.5).png().toFile(root+'/logo-screen.png');
await fs.writeFile(root+'/logo-bounds.json',JSON.stringify({...bounds,widthMm:54,source:src},null,2));
console.log(bounds);
