#!/bin/bash

# Este script actualiza el archivo .env.js en el directorio dist para eliminar la dependencia del token

echo "Actualizando archivo .env.js en el directorio dist..."
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/.env.js << EOL
export default {
  PUBLIC_DIRECTUS_URL: 'http://23.105.176.45:8055',
  DIRECTUS_URL: 'http://directus-app:8055',
  DIRECTUS_STATIC_TOKEN: 'dummy-token-not-used'
};
EOL"

# Verificar el contenido del archivo actualizado
echo "Verificando el contenido del archivo .env.js actualizado:"
ssh root@23.105.176.45 "cat /root/um25/dist/.env.js"

# Modificar los archivos de código fuente originales en src/fumbling-field
echo "Modificando los archivos de código fuente originales..."
ssh root@23.105.176.45 "cd /root/src/fumbling-field && cp -f src/pages/antecedentes/index.astro src/pages/antecedentes/index.astro.bak"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/const authenticate = async () => {/const authenticate = async () => { return { token: \"public-access\" }; \/\/ Bypass authentication\n  \/\*/' src/pages/antecedentes/index.astro"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/return { token: staticToken };/return { token: staticToken }; \*\//' src/pages/antecedentes/index.astro"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/headers: { '\''Authorization'\'': `Bearer \${token}`, '\''Accept'\'': '\''application\/json'\'' }/headers: { '\''Accept'\'': '\''application\/json'\'' }/' src/pages/antecedentes/index.astro"

# Hacer lo mismo para la página de detalle si existe
ssh root@23.105.176.45 "cd /root/src/fumbling-field && cp -f src/pages/antecedentes/\[id\]/\[slug\].astro src/pages/antecedentes/\[id\]/\[slug\].astro.bak"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/const authenticate = async () => {/const authenticate = async () => { return { token: \"public-access\" }; \/\/ Bypass authentication\n  \/\*/' src/pages/antecedentes/\[id\]/\[slug\].astro"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/return { token: staticToken };/return { token: staticToken }; \*\//' src/pages/antecedentes/\[id\]/\[slug\].astro"
ssh root@23.105.176.45 "cd /root/src/fumbling-field && sed -i 's/headers: { '\''Authorization'\'': `Bearer \${token}`, '\''Accept'\'': '\''application\/json'\'' }/headers: { '\''Accept'\'': '\''application\/json'\'' }/' src/pages/antecedentes/\[id\]/\[slug\].astro"

# Reiniciar el contenedor de Astro
echo "Reiniciando el contenedor de Astro..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Modificación completada y contenedor reiniciado"
echo "Espere unos segundos y luego verifique http://23.105.176.45:8080/antecedentes"
