import { generateSlug } from './src/utils/slugUtils.js';

const title = "ISI Solutions - Redes y comunicaciones";
console.log("Original:", title);
console.log("Slug:", generateSlug(title));
