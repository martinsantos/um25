const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.45;
    
    // Fondo con gradiente rojo
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#d32f2f');
    gradient.addColorStop(1, '#b71c1c');
    
    // Círculo principal
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Texto "UM"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UM', centerX, centerY);
    
    // Borde
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();
    
    return canvas;
}

// Generar iconos
const sizes = [96, 192, 512];
sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), buffer);
    console.log(`✅ Generado icon-${size}.png`);
});

// Generar favicon.ico (16x16)
const faviconCanvas = drawIcon(16);
const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'favicon.ico'), faviconBuffer);
console.log('✅ Generado favicon.ico');

console.log('\n🎉 ¡Todos los iconos han sido generados exitosamente!'); 