# Configuración del Servidor de Producción - UM25-0.3

## 🖥️ **Datos del Servidor**

- **IP**: `23.105.176.45`
- **Dominio**: `www.ultimamilla.com.ar`
- **DNS**: Delegado a `ns1.23.105.176.45` y `ns2.23.105.176.45`
- **Panel**: CyberPanel en `https://23.105.176.45:8090`

## 🔐 **Credenciales de Acceso**

### SSH
```bash
ssh root@23.105.176.45
# Password: gsiB%s@0yD
```

### CyberPanel
- **URL**: `https://23.105.176.45:8090`
- **Usuario**: `admin`
- **Password**: `gsiB%s@0yD`

## 🌐 **Configuración DNS**

El dominio `www.ultimamilla.com.ar` debe estar configurado para apuntar a `23.105.176.45`:

```
A     www.ultimamilla.com.ar    23.105.176.45
A     ultimamilla.com.ar        23.105.176.45
CNAME www                 ultimamilla.com.ar
```

## 🔒 **Configuración SSL**

### Certificados Let's Encrypt
```bash
# Generar certificados SSL
certbot certonly --webroot -w /var/www/certbot -d www.ultimamilla.com.ar -d ultimamilla.com.ar

# Ubicación de certificados
/etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem
/etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem
```

### Configuración en CyberPanel
1. Acceder a `https://23.105.176.45:8090`
2. Ir a **SSL** > **Manage SSL**
3. Seleccionar dominio `www.ultimamilla.com.ar`
4. Configurar certificados SSL

## 🐳 **Despliegue Docker**

### Variables de Entorno para Producción
```bash
# URLs de Producción
DIRECTUS_URL=https://www.ultimamilla.com.ar/api
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar

# Base de Datos
DB_PASSWORD=umbot_directus_2025!

# Directus Admin
DIRECTUS_ADMIN_EMAIL=admin@ultimamilla.com.ar
DIRECTUS_ADMIN_PASSWORD=UltimaMillaAdmin2025!

# Redis
REDIS_PASSWORD=umbot_redis_2025!
```

### Comandos de Despliegue
```bash
# 1. Conectar al servidor
ssh root@23.105.176.45

# 2. Clonar repositorio
git clone [REPO_URL] /var/www/umbot

# 3. Navegar al directorio
cd /var/www/umbot

# 4. Ejecutar despliegue
./scripts/deploy-production.sh
```

## 🔧 **Configuración del Firewall**

Asegurar que los siguientes puertos estén abiertos:

```bash
# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# SSH
ufw allow 22/tcp

# CyberPanel
ufw allow 8090/tcp

# Docker (interno)
ufw allow 2376/tcp
ufw allow 2377/tcp
```

## 📊 **Monitoreo y Logs**

### Logs de Docker
```bash
# Ver logs de todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f umbot-nginx-prod
```

### Logs de Nginx
```bash
# Access logs
tail -f /var/log/nginx/umbot_access.log

# Error logs
tail -f /var/log/nginx/umbot_error.log
```

### Estado de Servicios
```bash
# Ver servicios Docker
docker-compose -f docker-compose.prod.yml ps

# Ver uso de recursos
docker stats
```

## 🔄 **Backup y Mantenimiento**

### Backup Automático
```bash
# Crear backup manual
./scripts/backup-production.sh

# Ubicación de backups
/var/backups/umbot/
```

### Actualización SSL
```bash
# Renovar certificados
certbot renew

# Reiniciar Nginx
docker-compose -f docker-compose.prod.yml restart umbot-nginx-prod
```

## 🚨 **Troubleshooting**

### Problemas Comunes

1. **Error de conexión SSL**
   ```bash
   # Verificar certificados
   openssl x509 -in /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem -text -noout
   ```

2. **Error de DNS**
   ```bash
   # Verificar resolución DNS
   nslookup www.ultimamilla.com.ar
   dig www.ultimamilla.com.ar
   ```

3. **Error de Docker**
   ```bash
   # Reiniciar servicios
   docker-compose -f docker-compose.prod.yml restart
   
   # Reconstruir imágenes
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

## 📞 **Contactos de Soporte**

- **Servidor**: `root@23.105.176.45`
- **Dominio**: Configurado en CyberPanel
- **SSL**: Let's Encrypt automático
- **Monitoreo**: Logs en `/var/log/nginx/`

---

**Última actualización**: 15 de Junio de 2025  
**Versión**: UM25-0.3  
**Estado**: Listo para producción 