---
trigger: always_on
---

# ARQUITECTURA SERVIDOR PRODUCCION - 23.105.176.45

**DOCUMENTO ACTUALIZADO**: 2026-03-22
**PROPOSITO**: Regla general para NO pisar servicios en produccion

---

## DATOS DEL SERVIDOR

```
IP: 23.105.176.45
OS: AlmaLinux 9.7 (Moss Jungle Cat) (5.14.0-611.16.1.el9_7.x86_64)
RAM: 3.6 GB total
Swap: 1.9 GB
Disco: 80 GB (/dev/sda4) - 88% usado (9.8 GB libres)
vCPU: 1
Node.js: v20.19.4
PostgreSQL: 15.14 (Docker)
Redis: 6.2.20
```

---

## SISTEMA DE DEPLOYMENT (RELEASE-BASED)

El servidor usa un sistema de releases con symlinks. Los deployments crean un directorio con timestamp y luego actualizan el symlink.

### Directorios de releases

| Servicio | Symlink | Apunta a | Scripts CI/CD |
|----------|---------|----------|---------------|
| **ultimamilla** | /root/fumbling-field (repo) | /root/ultimamilla-releases/{timestamp} (runtime) | /opt/scripts-cicd/deploy_ultimamilla.sh |
| **sitrep frontend** | /var/www/sitrep | /var/www/sitrep-releases/{timestamp} | /opt/scripts-cicd/deploy_sitrep_frontend.sh |
| **sitrep backend** | /var/www/sitrep-backend | /var/www/sitrep-backend-releases/{timestamp} | /opt/scripts-cicd/deploy_sitrep_backend.sh |
| **SGI** | /home/sgi.ultimamilla.com.ar | /home/sgi-releases/{timestamp} | /opt/scripts-cicd/deploy_sgi.sh |

**IMPORTANTE**: astro-ultimamilla NO corre desde /root/fumbling-field/ sino desde /root/ultimamilla-releases/20260215-115052/

---

## SERVICIOS PM2 - NO TOCAR

| ID | Nombre | Puerto | Directorio | Modo | Memoria | Restarts | Estado |
|----|--------|--------|------------|------|---------|----------|--------|
| 0 | pm2-logrotate | - | ~/.pm2/modules | fork | 35MB | 0 | OK |
| 1 | **sgi** | 3000 | /home/sgi-releases/20260215-221316 | fork | 66MB | 139 | ESTABLE |
| 31 | **astro-ultimamilla** | 4321 | /root/ultimamilla-releases/20260215-115052 | fork | 83MB | 9 | ESTABLE |
| 42 | **sitrep-backend** | 3002 | /var/www/sitrep-backend-releases/20260321-184258 | cluster | 120MB | 1 | ESTABLE |
| 43 | **sitrep-backend** | 3002 | /var/www/sitrep-backend-releases/20260321-184258 | cluster | 123MB | 1 | ESTABLE |

**Nota**: sitrep-backend corre en modo cluster con 2 instancias (~243MB total).

---

## CONTENEDORES DOCKER - NO TOCAR

| Nombre | Estado | Puertos | RAM | Descripcion |
|--------|--------|---------|-----|-------------|
| **directus-admin-directus-app-1** | Up 5 weeks | 8055 | 175MB | CMS Directus |
| **directus-admin-database-1** | Up 5 weeks | 5432 | 150MB | PostgreSQL 15 (Directus) |
| remnanode | Up 7 weeks | - | 8MB | Monitoreo |

---

## PUERTOS EN USO - MAPA COMPLETO

| Puerto | Servicio | Proceso | Descripcion | CRITICO |
|--------|----------|---------|-------------|---------|
| 21 | FTP | pure-ftpd | Servidor FTP | NO |
| 22 | SSH | sshd | Acceso remoto | SI |
| 25 | SMTP | postfix (master) | Servidor mail | NO |
| 53 | DNS | pdns_server | PowerDNS | NO |
| 80 | HTTP | nginx | Web server | SI |
| 443 | HTTPS | nginx | Web server SSL | SI |
| 2222 | SSH Web | FastAPI (MainThread) | Terminal web | NO |
| **3000** | **SGI** | **node** | **App SGI** | SI |
| **3002** | **SITREP API** | **node (cluster x2)** | **Backend Trazabilidad** | SI |
| 3306 | MySQL | mariadbd | Base de datos | NO |
| **4321** | **Astro** | **node** | **Frontend UM** | SI |
| 5432 | PostgreSQL | docker-proxy | Base de datos Directus | SI |
| 6379 | Redis | redis-server | Cache | SI |
| 7080 | LiteSpeed | litespeed | Web server alt | NO |
| **8055** | **Directus** | docker-proxy | **CMS** | SI |
| 8081 | PowerDNS | pdns_server | API DNS | NO |
| 8090 | LiteSpeed CP | lscpd | Panel control | NO |
| 8091 | PHP-FPM | php | FastCGI | NO |
| 8888 | Python | python3 | Servicio interno | NO |
| 8891 | OpenDKIM | opendkim | Firma DKIM email | NO |
| 9000 | PHP-FPM | php-fpm | Pool www | NO |
| 11211 | Memcached | memcached | Cache | NO |

---

## CONFIGURACION NGINX - TODOS LOS SITIOS

### 1. ultimamilla.com.ar (PRINCIPAL)

```nginx
/demoambiente/           -> /var/www/demoambiente/ (estaticos)
/demoambiente/assets/    -> /var/www/demoambiente/assets/ (cache 1y)
/demoambiente/api/       -> localhost:3457 (proxy)
/api/(auth|manifiestos|catalogos|pdf|reportes|actores|analytics|notificaciones)
                         -> localhost:3010
/status                  -> localhost:4321 (Astro)
/directus-assets/        -> localhost:8055/assets/
/imagenes_antecedentes_versionproduccion/ -> /var/www/html
```

### 2. sitrep.ultimamilla.com.ar (PRODUCCION)

```nginx
upstream sitrep_backend { server localhost:3002; }
/               -> /var/www/sitrep (symlink -> sitrep-releases/{timestamp})
/assets         -> cache 1y
/api            -> localhost:3002 (sitrep-backend cluster)
```

### 3. admin.ultimamilla.com.ar -> localhost:8055 (Directus)

### 4. sgi.ultimamilla.com.ar -> localhost:3000 (SGI, max body 50M)

### 5. wiki.ultimamilla.com.ar -> MediaWiki (PHP 7.4, /home/wiki.ultimamilla.com.ar)

### 6. umbot.com.ar -> /home/umbot.com.ar/public_html (SPA estatico)

### 7. viveroloscocos.com.ar -> WordPress (PHP 7.4, /home/viveroloscocos.com.ar/public_html)

### 8. vecinorabioso.com.ar -> WordPress/PHP (php-fpm :9000, /home/vecinorabioso.com.ar/public_html, SSL Let's Encrypt)

---

## CRON JOBS ACTIVOS

```bash
# SSL SGI (cada 10 min)
*/10 * * * * /root/setup-sgi-ssl.sh

# Metricas servidor (cada hora)
0 * * * * /root/scripts/server-metrics.sh

# Health check y monitoreo (cada 5 min)
*/5 * * * * /root/health-check.sh
*/5 * * * * /root/scripts/memory-monitor.sh
*/5 * * * * /root/scripts/ensure-pm2-processes.sh

# Backups automaticos (diarios)
0 2 * * * /opt/scripts-cicd/backup_directus.sh
0 3 * * * /opt/scripts-cicd/backup_sitrep.sh
0 3 * * * /root/scripts/snapshot-directus-data.sh
0 4 * * * /root/scripts/mirror-directus-images.sh
```

---

## SERVICIOS SYSTEMD ACTIVOS

### CRITICOS (NO TOCAR)
- nginx.service - Web server
- docker.service - Contenedores
- pm2-root.service - PM2 process manager
- redis.service - Cache local
- mariadb.service - Base datos MariaDB
- postfix.service - Email
- fail2ban.service - Seguridad

### AUXILIARES
- php-fpm.service - PHP 8.x
- php74-php-fpm.service - PHP 7.4 (WordPress/Wiki)
- memcached.service - Cache
- pdns.service - DNS
- pure-ftpd.service - FTP
- emergency-dashboard.service - Dashboard emergencia
- fastapi_ssh_server.service - Terminal web

---

## BASES DE DATOS

### PostgreSQL (Docker - puerto 5432)
- **directus-admin-database-1**: BD Directus CMS (PostgreSQL 15.14)

### MariaDB (Local - puerto 3306)
- Bases de datos WordPress (viveroloscocos, vecinorabioso), wiki, otros

### Redis
- **Local**: redis-server 6.2.20 (127.0.0.1:6379)

---

## REGLAS GENERALES

```bash
# NUNCA:
- Cambiar puertos sin actualizar Nginx
- Eliminar configuraciones de Nginx activas
- Detener contenedores Docker sin razon
- Modificar bases de datos directamente
- Reiniciar todo el servidor sin necesidad
- Usar pm2 delete sin pm2 save despues
- Borrar directorios de releases sin verificar cual es el activo
```

---

## CONTACTOS Y ACCESOS

```
SSH: root@23.105.176.45
SITREP Prod: https://sitrep.ultimamilla.com.ar
SITREP Demo: https://ultimamilla.com.ar/demoambiente/
Admin Directus: https://admin.ultimamilla.com.ar
SGI: https://sgi.ultimamilla.com.ar
Wiki: https://wiki.ultimamilla.com.ar
Vecino Rabioso: https://vecinorabioso.com.ar
```

---

*Documento actualizado: 2026-03-22 - Actualizar al hacer cambios en el servidor*
