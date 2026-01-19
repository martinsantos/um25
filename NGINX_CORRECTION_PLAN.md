# 🔧 Plan de Corrección Nginx (Solución Definitiva)

El uso de la IP `http://23.105.176.45:8055/admin/` es **ADMISIBLE** para que usted administre el contenido temporalmente.

🚫 **PERO NO ES ADMISIBLE** para el sitio web público, porque:
1.  Los navegadores bloquearán las imágenes (Error de "Mixed Content": sitio seguro HTTPS cargando imágenes inseguras HTTP).
2.  Google penalizará el sitio si encuentra enlaces HTTP inseguros.

## ✅ La Solución: "Proxy Inverso" en Nginx

Para que todo funcione sin tocar el DNS roto, debemos decirle al servidor web (Nginx) que cuando alguien pida una imagen, la busque internamente en Directus.

### Paso 1: Editar archivo de configuración Nginx
Abra el archivo de configuración de su sitio (usualmente en `/etc/nginx/sites-available/ultimamilla.com.ar` o `default`):

```bash
sudo nano /etc/nginx/sites-available/ultimamilla.com.ar
```

### Paso 2: Agregar este bloque dentro de `server { ... }` (puerto 443)

Copie y pegue este bloque. Esto hará que `https://ultimamilla.com.ar/directus-assets/...` sirva las imágenes desde Directus internamente.

```nginx
    # --- INICIO BLOQUE DIRECTUS PROXY ---
    
    # 1. Proxy para la API (si se necesita)
    location /directus/ {
        rewrite ^/directus/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Proxy ESPECÍFICO para Imágenes (Crucial para Antecedentes)
    # Mapea /directus-assets/UUID -> http://127.0.0.1:8055/assets/UUID
    location /directus-assets/ {
        rewrite ^/directus-assets/(.*) /assets/$1 break;
        proxy_pass http://127.0.0.1:8055;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_hide_header Content-Security-Policy;
        add_header Access-Control-Allow-Origin *;
    }
    
    # --- FIN BLOQUE DIRECTUS PROXY ---
```

### Paso 3: Guardar y Reiniciar

```bash
# Probar configuración
sudo nginx -t

# Si dice "syntax is ok", reiniciar
sudo systemctl reload nginx
```

## Resumen del Resultado
Al hacer esto:
*   El sitio web pedirá imágenes a `https://ultimamilla.com.ar/directus-assets/...` (Seguro ✅).
*   Nginx buscará la imagen en `http://127.0.0.1:8055` internamente (Funciona ✅).
*   El usuario verá las imágenes y Google indexará el sitio correctamente.
