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

### Scripts CI/CD (/opt/scripts-cicd/)

```
backup_directus.sh
backup_sitrep.sh
deploy_directus.sh
deploy_sgi.sh
deploy_sitrep_backend.sh
deploy_sitrep_backend_with_build.sh
deploy_sitrep_frontend.sh
deploy_sitrep_frontend_with_build.sh
deploy_ultimamilla.sh
deploy_ultimamilla_with_build.sh
rollback_to_manual.sh
switch_to_cicd.sh
verify_remote_backups.sh
```

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

### COMANDOS PM2 IMPORTANTES
```bash
# Ver estado
pm2 list

# Reiniciar servicio especifico
pm2 restart sitrep-backend

# Ver logs
pm2 logs sitrep-backend --lines 50

# Guardar configuracion
pm2 save
```

---

## CONTENEDORES DOCKER - NO TOCAR

| Nombre | Estado | Puertos | RAM | Descripcion |
|--------|--------|---------|-----|-------------|
| **directus-admin-directus-app-1** | Up 5 weeks | 8055 | 175MB | CMS Directus |
| **directus-admin-database-1** | Up 5 weeks | 5432 | 150MB | PostgreSQL 15 (Directus) |
| remnanode | Up 7 weeks | - | 8MB | Monitoreo |

### COMANDOS DOCKER IMPORTANTES
```bash
# Ver contenedores
docker ps -a

# Ver logs
docker logs directus-admin-directus-app-1 --tail 50

# Reiniciar contenedor
docker restart directus-admin-directus-app-1
```

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
# DEMOAMBIENTE (Trazabilidad RRPP Demo)
/demoambiente/           -> /var/www/demoambiente/ (estaticos)
/demoambiente/assets/    -> /var/www/demoambiente/assets/ (cache 1y)
/demoambiente/api/       -> localhost:3457 (proxy)

# API Trazabilidad (Emergency fix para frontend)
/api/(auth|manifiestos|catalogos|pdf|reportes|actores|analytics|notificaciones)
                         -> localhost:3010

# STATUS Dashboard
/status                  -> localhost:4321 (Astro)

# DIRECTUS ASSETS (proxy HTTPS)
/directus-assets/        -> localhost:8055/assets/

# IMAGENES
/imagenes_antecedentes_versionproduccion/
                         -> /var/www/html
```

### 2. sitrep.ultimamilla.com.ar (PRODUCCION)

```nginx
upstream sitrep_backend { server localhost:3002; }

/               -> /var/www/sitrep (symlink -> sitrep-releases/{timestamp})
/assets         -> /var/www/sitrep/assets (cache 1y)
/sw-custom.js   -> /var/www/sitrep/sw-custom.js (no-cache)
/api            -> localhost:3002 (sitrep-backend cluster)
```

### 3. admin.ultimamilla.com.ar

```nginx
/               -> localhost:8055 (Directus CMS)
```

### 4. sgi.ultimamilla.com.ar

```nginx
/               -> localhost:3000 (SGI App)
client_max_body_size 50M
```

### 5. wiki.ultimamilla.com.ar

```nginx
/               -> MediaWiki (PHP 7.4)
root: /home/wiki.ultimamilla.com.ar
```

### 6. umbot.com.ar

```nginx
/               -> /home/umbot.com.ar/public_html (SPA estatico)
```

### 7. viveroloscocos.com.ar

```nginx
/               -> WordPress (PHP 7.4)
root: /home/viveroloscocos.com.ar/public_html
```

### 8. vecinorabioso.com.ar

```nginx
/               -> WordPress/PHP (php-fpm pool www, puerto 9000)
root: /home/vecinorabioso.com.ar/public_html
SSL: Let's Encrypt
client_max_body_size 64M
```

---

## DIRECTORIOS IMPORTANTES

### /var/www/

| Directorio | Descripcion | Usado Por | CRITICO |
|------------|-------------|-----------|---------|
| **demoambiente/** | Frontend Demo Trazabilidad | Nginx | SI |
| **sitrep/** (symlink) | Frontend Prod Trazabilidad | sitrep.ultimamilla.com.ar | SI |
| **sitrep-backend/** (symlink) | Backend Prod Trazabilidad | PM2 sitrep-backend | SI |
| **sitrep-releases/** | Releases frontend sitrep | Deploy CI/CD | SI |
| **sitrep-backend-releases/** | Releases backend sitrep | Deploy CI/CD | SI |
| **sitrep-uploads/** | Uploads persistentes sitrep | Backend | SI |
| html/ | Default nginx + imagenes | Nginx | NO |
| directus/ | Directus files | Docker | NO |
| umbot/ | UMBot files | No usado | NO |
| ultimamilla.com.ar/ | Sitio legacy | No usado | NO |

### /home/

| Directorio | Descripcion | CRITICO |
|------------|-------------|---------|
| sgi.ultimamilla.com.ar/ (symlink) | App SGI -> sgi-releases/{timestamp} | SI |
| sgi-releases/ | Releases SGI | SI |
| wiki.ultimamilla.com.ar/ | MediaWiki | SI |
| umbot.com.ar/ | UMBot frontend | NO |
| viveroloscocos.com.ar/ | WordPress | SI |
| vecinorabioso.com.ar/ | WordPress | SI |

### /root/

| Directorio | Descripcion | CRITICO |
|------------|-------------|---------|
| fumbling-field/ | Repo git Astro UM (NO es el runtime) | SI |
| ultimamilla-releases/ | Releases Astro UM (el runtime real) | SI |
| um25/ | Copia/clone repo | NO |
| .pm2/ | Config PM2 | SI |
| scripts/ | Scripts monitoreo | NO |
| deployment_staging/ | Staging para deploys | NO |

### /opt/scripts-cicd/

| Script | Descripcion | CRITICO |
|--------|-------------|---------|
| deploy_ultimamilla.sh | Deploy Astro UM | SI |
| deploy_sitrep_frontend.sh | Deploy sitrep front | SI |
| deploy_sitrep_backend.sh | Deploy sitrep back | SI |
| deploy_sgi.sh | Deploy SGI | SI |
| deploy_directus.sh | Deploy Directus | SI |
| backup_directus.sh | Backup diario Directus | SI |
| backup_sitrep.sh | Backup diario Sitrep | SI |
| rollback_to_manual.sh | Rollback emergencia | SI |

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

## RECURSOS (2026-03-22 13:01 UTC)

```
RAM Total: 3.6 GB
RAM Usada: 3.0 GB (83%)
RAM Libre: 168 MB (4%)
Buffer/Cache: 751 MB
RAM Disponible: 560 MB

Swap Total: 1.9 GB
Swap Usado: 1.2 GB (63%)

Disco /: 70 GB usado / 80 GB total (88%) -- ATENCION
Espacio libre: 9.8 GB

Load Average: 0.19 / 0.13 / 0.10 (saludable)
Uptime: 54 dias
```

### TOP 5 PROCESOS POR MEMORIA
| Proceso | PID | RAM | Descripcion |
|---------|-----|-----|-------------|
| Directus (node) | 556729 | 131MB | CMS (Docker) |
| sitrep-backend (cluster 1) | 575395 | 126MB | Backend Trazabilidad |
| sitrep-backend (cluster 2) | 575387 | 124MB | Backend Trazabilidad |
| astro-ultimamilla | 395784 | 85MB | Frontend UM |
| php-fpm pool www | varios | ~77MB c/u | WordPress/Wiki |

---

## REGLAS PARA DEPLOYMENTS

### ULTIMAMILLA (Frontend Astro)

```bash
# Deploy via CI/CD:
/opt/scripts-cicd/deploy_ultimamilla.sh

# Release actual:
/root/ultimamilla-releases/20260215-115052/
PROCESO PM2: astro-ultimamilla (ID 31)
PUERTO: 4321

# Rollback:
/opt/scripts-cicd/rollback_to_manual.sh
```

### SITREP (Trazabilidad RRPP Produccion)

```bash
# Frontend (symlink-based releases)
SYMLINK: /var/www/sitrep -> /var/www/sitrep-releases/{timestamp}
DEPLOY: /opt/scripts-cicd/deploy_sitrep_frontend.sh

# Backend (symlink-based releases, cluster mode)
SYMLINK: /var/www/sitrep-backend -> /var/www/sitrep-backend-releases/{timestamp}
DEPLOY: /opt/scripts-cicd/deploy_sitrep_backend.sh
PROCESO PM2: sitrep-backend (IDs 42,43 - cluster x2)
PUERTO: 3002
```

### SGI

```bash
# Symlink-based releases
SYMLINK: /home/sgi.ultimamilla.com.ar -> /home/sgi-releases/{timestamp}
DEPLOY: /opt/scripts-cicd/deploy_sgi.sh
PROCESO PM2: sgi (ID 1)
PUERTO: 3000
```

### DEMOAMBIENTE (Demo Trazabilidad)

```bash
# Frontend (archivos estaticos)
DESTINO: /var/www/demoambiente/

# Deployment:
1. cd /var/www/demoambiente
2. Hacer backup: tar -czf ../demoambiente-backup-$(date +%Y%m%d).tar.gz .
3. Subir nuevos archivos
4. Nginx no necesita reinicio (archivos estaticos)
```

### REGLAS GENERALES

```bash
# ANTES de cualquier deployment:
1. Verificar RAM: free -h (debe haber >300MB disponible)
2. Verificar disco: df -h / (debe haber >5GB libre)
3. Los scripts CI/CD hacen backup automatico
4. Verificar que no hay transacciones activas

# DESPUES de deployment:
1. Si hay PM2: pm2 restart <nombre>
2. Verificar logs: pm2 logs <nombre> --lines 20
3. Si hay Nginx: nginx -t && systemctl reload nginx
4. Probar en navegador

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

## CHECKLIST PRE-DEPLOYMENT

- [ ] Verificar RAM disponible: `free -h` (>300MB disponible)
- [ ] Verificar disco: `df -h /` (>5GB libre)
- [ ] Verificar load average: `uptime` (<5 ideal)
- [ ] Verificar proceso destino estable: `pm2 list`
- [ ] Verificar logs sin errores: `pm2 logs <nombre> --lines 10`

## CHECKLIST POST-DEPLOYMENT

- [ ] Reiniciar servicio si aplica: `pm2 restart <nombre>`
- [ ] Verificar proceso online: `pm2 list`
- [ ] Verificar logs sin errores: `pm2 logs <nombre> --lines 20`
- [ ] Testear Nginx si se modifico: `nginx -t`
- [ ] Recargar Nginx si aplica: `systemctl reload nginx`
- [ ] Probar funcionalidad en navegador
- [ ] Verificar RAM post-deployment: `free -h`

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
