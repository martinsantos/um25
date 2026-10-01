import { randomInt, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const here = dirname(new URL(import.meta.url).pathname);
const variants = {
  a: { photo: 'photo-a-wide.jpg', hosted: 'comunidad-reunion.jpg', credit: 'Mario Amé / Pexels', alt: 'Personas adultas participando en una reunión de trabajo; fotografía ilustrativa' },
  b: { photo: 'photo-b-wide.jpg', hosted: 'oficio-panaderia.jpg', credit: 'Crisher P.H / Pexels', alt: 'Manos de un panadero trabajando la masa; fotografía ilustrativa' },
  c: { photo: 'photo-c-wide.jpg', hosted: 'oficio-taller.jpg', credit: 'erik debarre / Pexels', alt: 'Manos trabajando una pieza de metal en un taller; fotografía ilustrativa' },
};
const destinations = {
  general: '', cuotas: '#recorrido-cuotas', credencial: '#recorrido-credencial',
  autonomia: '#independencia', descubrimiento: '#experiencia',
};
const escapeHtml = (text) => text.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
const requested = option('--variant');
if (requested && !variants[requested]) throw new Error('Variant must be a, b or c');
const imageMode = option('--image-mode') || 'cid';
if (!['cid', 'hosted'].includes(imageMode)) throw new Error('Image mode must be cid or hosted');
const assetBase = option('--asset-base-url') || 'https://www.ultimamilla.com.ar/images/software-comunidades';
if (!/^https:\/\/www\.ultimamilla\.com\.ar\/images\/software-comunidades$|^http:\/\/127\.0\.0\.1:49324\/images\/software-comunidades$/.test(assetBase)) {
  throw new Error('Unexpected asset base URL');
}
const segment = option('--segment') || 'general';
if (!(segment in destinations)) throw new Error(`Unknown segment: ${segment}`);
const contextLine = option('--context-line') || '';
if (contextLine && (contextLine.length < 20 || contextLine.length > 240 || /[\r\n<>]/.test(contextLine))) {
  throw new Error('Context line must be 20–240 characters of plain text');
}
const id = requested || Object.keys(variants)[randomInt(3)];
const output = option('--output');
if (!output) throw new Error('Pass --output with a writable HTML path');
const selected = variants[id];
const utmContent = segment === 'general' ? `photo_${id}` : `${segment}_photo_${id}`;
const landingUrl = `https://www.ultimamilla.com.ar/software/gestion-de-comunidades-profesionales?utm_source=email&utm_medium=outreach&utm_campaign=comunidades_profesionales&utm_content=${utmContent}`;
const template = await readFile(resolve(here, 'comunidades-email.html'), 'utf8');
const html = template
  .replaceAll('{{photo_alt}}', selected.alt)
  .replaceAll('{{photo_credit}}', selected.credit)
  .replace('{{context_row}}', contextLine
    ? `<tr><td style="padding:0 30px 18px;font-size:16px;line-height:1.5">${escapeHtml(contextLine)}</td></tr>`
    : '')
  .replaceAll('{{utm_content}}', utmContent)
  .replace('{{target_hash}}', destinations[segment])
  .replace('cid:community-photo@ultimamilla', imageMode === 'hosted'
    ? `${assetBase}/${selected.hosted}` : 'cid:community-photo@ultimamilla')
  .replace('cid:credential-demo@ultimamilla', imageMode === 'hosted'
    ? `${assetBase}/credencial-demo-email.gif` : 'cid:credential-demo@ultimamilla');
if (/{{(?:photo_|context_row|utm_content|target_hash)/.test(html)) throw new Error('Unresolved token');
const file = resolve(output);
const assignment = {
  message_id: randomUUID(),
  variant: id,
  segment,
  utm_content: utmContent,
  target_hash: destinations[segment],
  editorial_context: contextLine || null,
  photo_file: resolve(here, 'variants', selected.photo),
  image_mode: imageMode,
  ...(imageMode === 'hosted'
    ? { image_url: `${assetBase}/${selected.hosted}`, animation_url: `${assetBase}/credencial-demo-email.gif` }
    : { cid: 'community-photo@ultimamilla', animation_cid: 'credential-demo@ultimamilla' }),
  generated_at: new Date().toISOString(),
};
await writeFile(file, html, { flag: 'wx' });
const plain = `Hola, les escribimos desde Última Milla, una empresa argentina de tecnología abierta.

Desarrollamos soluciones de software de código abierto para pymes y organizaciones.

Tenemos en producción un software de gestión de colegios de profesionales.

Nuestro software para colegios permite:
• Cobrar cuotas en línea
• Ofrecer una credencial digital para consultar y compartir desde el celular
• Mostrar en la web la vigencia de la matrícula
• Gestionar trámites y consultas mediante tickets

Demostración visual de la credencial (QR ilustrativo, sin datos reales): ${landingUrl}#recorrido-credencial

La instalación y puesta a punto de nuestro software son sin cargo, y el servicio se cotiza en pesos argentinos.

Si les interesa, podemos preparar una demo con el formato de datos que utiliza su institución.

Conocer el software y pedir una demo: ${landingUrl}${destinations[segment]}

Saludos,
{{firma}}
`;
await writeFile(`${file}.txt`, plain, { flag: 'wx' });
await writeFile(`${file}.assignment.json`, JSON.stringify(assignment, null, 2) + '\n', { flag: 'wx' });
process.stdout.write(`${id} ${file}\n`);
