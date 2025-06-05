#!/bin/bash

# Este script modifica el código de Astro para no requerir autenticación con Directus
# y permitir acceso público a los antecedentes e imágenes

# Crear un backup del archivo original
ssh root@23.105.176.45 "cd /root/um25 && cp -f src/pages/antecedentes/index.astro src/pages/antecedentes/index.astro.bak"

# Modificar el archivo index.astro para no requerir autenticación
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/const authenticate = async () => {/const authenticate = async () => { return { token: \"public-access\" }; \/\/ Bypass authentication\n  \/\*/' src/pages/antecedentes/index.astro"
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/return { token: staticToken };/return { token: staticToken }; \*\//' src/pages/antecedentes/index.astro"

# Modificar las funciones de fetch para que funcionen sin token de autorización
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/headers: { '\''Authorization'\'': `Bearer \${token}`, '\''Accept'\'': '\''application\/json'\'' }/headers: { '\''Accept'\'': '\''application\/json'\'' }/' src/pages/antecedentes/index.astro"

# Hacer lo mismo para la página de detalle si existe
if ssh root@23.105.176.45 "[ -f /root/um25/src/pages/antecedentes/\[id\]/\[slug\].astro ]"; then
  ssh root@23.105.176.45 "cd /root/um25 && cp -f src/pages/antecedentes/\[id\]/\[slug\].astro src/pages/antecedentes/\[id\]/\[slug\].astro.bak"
  ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/const authenticate = async () => {/const authenticate = async () => { return { token: \"public-access\" }; \/\/ Bypass authentication\n  \/\*/' src/pages/antecedentes/\[id\]/\[slug\].astro"
  ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/return { token: staticToken };/return { token: staticToken }; \*\//' src/pages/antecedentes/\[id\]/\[slug\].astro"
  ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/headers: { '\''Authorization'\'': `Bearer \${token}`, '\''Accept'\'': '\''application\/json'\'' }/headers: { '\''Accept'\'': '\''application\/json'\'' }/' src/pages/antecedentes/\[id\]/\[slug\].astro"
fi

# Reconstruir la aplicación Astro
ssh root@23.105.176.45 "cd /root/um25 && npm run build"

# Reiniciar el contenedor de Astro
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Modificación de autenticación en Astro completada y aplicación reconstruida"
echo "Los archivos originales se han respaldado con extensión .bak"
