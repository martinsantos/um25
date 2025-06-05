#!/bin/bash

# Actualizar el archivo .env.js en el directorio dist de Astro
ssh root@23.105.176.45 "cd /root/um25 && cat > dist/.env.js << EOL
export default {
  PUBLIC_DIRECTUS_URL: 'http://23.105.176.45:8055',
  DIRECTUS_URL: 'http://directus-app:8055',
  DIRECTUS_STATIC_TOKEN: 'STATIC-TOKEN-FOR-DIRECTUS-ACCESS'
};
EOL"

# Reiniciar solo el contenedor de Astro
ssh root@23.105.176.45 "cd /root/um25 && docker restart astro-app"

echo "Configuración de Astro actualizada y contenedor reiniciado"
