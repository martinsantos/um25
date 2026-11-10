# Configuración local de credenciales

Copiá .env.example a .env para Astro y directus-admin/.env.example a
directus-admin/.env si necesitás levantar un Directus aislado. Completá sólo
las variables que usa tu entorno. Usá contraseñas y claves nuevas para la
instancia de prueba. DIRECTUS_STATIC_TOKEN es una variable de servidor:
no lo agregues a variables PUBLIC_* o VITE_*.

Los Compose que comparten PostgreSQL y Directus toman POSTGRES_PASSWORD para
ambos contenedores. Los que toman DIRECTUS_KEY, DIRECTUS_SECRET o
DIRECTUS_ADMIN_PASSWORD requieren esos valores en el entorno antes de
arrancar. env-server-production.example sólo registra los nombres para
integraciones antiguas. La producción recibe su configuración por su flujo
vigente de operación.

directus-admin/.htpasswd.example muestra cómo crear un archivo local si el
proxy de tu entorno usa Basic Auth. Las claves privadas de TLS y el estado
de cuentas ACME se generan fuera del repositorio. Si necesitás crear un token de Directus,
hacelo desde la instancia autorizada y guardalo en el entorno de servidor.
Los certificados públicos
no contienen claves privadas.

Los comandos históricos con REPLACE_WITH_ son referencias. Los scripts de
mantenimiento no forman parte del despliegue vigente; verificá el destino y
el flujo de operación antes de usarlos.
