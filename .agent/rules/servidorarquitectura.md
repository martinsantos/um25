---
trigger: always_on
---

# URLs Principales:
- `www.ultimamilla.com.ar` → Sitio Principal Astro (PRODUCCIÓN) ✅
- `sgi.ultimamilla.com.ar` → Sistema de Gestión Interna (Autenticado) ✅
- `viveroloscocos.com.ar` → WordPress Vivero Los Cocos ✅
- `admin.ultimamilla.com.ar` → Panel de Administración Directus ✅

## 🛠️ Configuración Actual

## Servidor Principal 23.105.176.45:

23.105.176.45 (Servidor Principal)
│
├── 🌐 Nginx (Puertos 80/443) - Proxy Inverso Principal
│   ├── www.ultimamilla.com.ar → Astro App (puerto 4321) ✅
│   ├── sgi.ultimamilla.com.ar → SGI System (puerto 3456) ✅
│   ├── viveroloscocos.com.ar → WordPress (PHP-FPM 9000) ✅
│   └── admin.ultimamilla.com.ar → Directus (puerto 8055) ✅
│
├── 🚀 Aplicaciones Principales - PRODUCCIÓN
│   ├── 📦 Astro App (Puerto 4321) - Modo Producción via PM2
│   ├── 🗄️  Directus CMS (Puerto 8055) - Contenedor Docker
│   ├── 🐘 PostgreSQL (Contenedor Docker) - Base de Datos
│   ├── 🟥 Redis (Contenedor Docker) - Caché
│   └── 🚨 UMBot Emergency (Puerto 8092) - Sistema de Emergencia
│
├── ⚙️ Sistema de Gestión Interna (SGI)
│   └── 📊 Node.js + PM2 (Puerto 3456) - Sistema Autenticado
│
└── 🌐 Sitio WordPress Externo
    └── 🌱 Vivero Los Cocos (PHP-FPM 9000) - WordPress Completo

## 🛠️ Configuración Actual

### Nginx (Proxy Inverso)
```nginx
server {
    listen 80;
    server_name ultimamilla.com.ar www.ultimamilla.com.ar;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ultimamilla.com.ar www.ultimamilla.com.ar;
    
    # Configuración SSL
    ssl_certificate /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem;
    
    # Proxy a Astro
    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy a Directus
    location /admin/ {
        proxy_pass http://localhost:8055/;
        # ... configuración adicional de proxy
    }
}
```

### Servicios en Docker
```bash
# Contenedores activos
$ docker ps
CONTAINER ID   NAMES                  PORTS                    
xxxxxxxxxxxx   directus-app          0.0.0.0:8055->8055/tcp   
yyyyyyyyyyyy   umbot-postgres-prod    5432/tcp                
zzzzzzzzzzzz   umbot-redis-prod      6379/tcp                
aaaaaaaaaaaa   umbot-emergency       0.0.0.0:8092->8092/tcp
```

### Procesos PM2
```bash
# Aplicaciones gestionadas por PM2
$ pm2 list
┌─────┬────────────────┬─────────────┬─────────┬──────┬────────────┐
│ id  │ name           │ namespace   │ version │ mode │ pid        │
├─────┼────────────────┼─────────────┼─────────┼──────┼────────────┤
│ 0   │ sgi-system     │ default     │ 1.0.0   │ fork │ 138689     │
└─────┴────────────────┴─────────────┴─────────┴──────┴────────────┘
```

## ✅ ARQUITECTURA FINAL IMPLEMENTADA

### 🎯 Estado Actual - PRODUCCIÓN

| Servicio | URL | Backend | Puerto | Estado |
|----------|-----|---------|--------|---------|
| **Ultima Milla** | ultimamilla.com.ar | Astro (Producción) | 3000 | ✅ HTTP 200 |
| **SGI System** | sgi.ultimamilla.com.ar | Node.js PM2 | 3456 | ✅ HTTP 401 (Auth) |
| **Vivero Los Cocos** | viveroloscocos.com.ar | WordPress | 9000 (PHP-FPM) | ✅ HTTP 200 |
| **Admin Panel** | admin.ultimamilla.com.ar | Directus CMS | 8055 | ✅ Activo |

### 🔧 Configuración Nginx
- **Archivos separados**: `/etc/nginx/sites-available/` y `/etc/nginx/sites-enabled/`
- **SSL/TLS**: Certificados Let's Encrypt configurados
- **Proxy Headers**: Configuración completa para aplicaciones
- **PHP-FPM**: Integración WordPress funcional

## 🚀 SERVICIOS EN PRODUCCIÓN

### PM2 Configuration
```bash
# Estado actual PM2
id │ name │ status │ cpu │ memory │ port
3  │ sgi  │ online │ 0%  │ 92.7mb │ 3456

# Astro ejecutándose directamente en puerto 3000
PID: 102055 | Status: LISTEN | Port: 3000
```

### Archivos de Configuración
- **SGI**: `/home/sgi.ultimamilla.com.ar/ecosystem.config.js`
- **Astro**: Proceso directo con `astro dev --port 3000`
- **Nginx**: Configuraciones en `/etc/nginx/sites-available/`
- **WordPress**: `/home/viveroloscocos.com.ar/public_html/`

## 📋 Mantenimiento

### Comandos de Gestión
```bash
# Reiniciar servicios
pm2 restart sgi
systemctl reload nginx

# Verificar estado
pm2 list
netstat -tulpn | grep -E ':3000|:3456|:9000'

# Logs
pm2 logs sgi
tail -f /var/log/nginx/access.log
```

---