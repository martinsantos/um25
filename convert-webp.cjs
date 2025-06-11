   // convert-webp.js
   const sharp = require('sharp');
   const fs = require('fs');
   const path = require('path');

   const inputDir = 'public/';
   const outputDir = 'public/webp/';

   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

   fs.readdirSync(inputDir).forEach(file => {
     if (file.endsWith('.jpg') || file.endsWith('.png')) {
       sharp(path.join(inputDir, file))
         .webp({ quality: 80 })
         .toFile(path.join(outputDir, file.replace(/\.(jpg|png)$/, '.webp')))
         .then(() => console.log(`Convertido: ${file}`))
         .catch(err => console.error(`Error con ${file}:`, err));
     }
   });