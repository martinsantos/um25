import { a as getAntecedenteImageUrlSync } from './directus_BhDGbJ3K.mjs';

const mockItem = { id: 3148, Titulo: "Premix Test" };
const mockItemString = { id: "3148", Titulo: "Premix Test String" };

console.log("Result Number:", getAntecedenteImageUrlSync(mockItem));
console.log("Result String:", getAntecedenteImageUrlSync(mockItemString));
