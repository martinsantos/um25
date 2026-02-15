# Análisis: Reversión a Versión Anterior y Estado CI/CD

**Fecha**: 2026-02-15
**Análisis por**: Claude Code
**Sitio**: www.ultimamilla.com.ar

---

## 📊 PARTE 1: ¿Por qué volvió a versión anterior?

### Causa Raíz: Divergencia de Branches Git

El problema fue una **divergencia crítica** entre dos ramas del repositorio:

```
RAMA MAIN (CI/CD)              RAMA MASTER (Contenido)
├── Commits CI/CD              ├── 8e28520 fix(seo): keywords
├── Infrastructure fixes       ├── 7380677 fix(seo): remove token
├── Deployment scripts         ├── f45c5df fix(seo): Product→Service
├── GitHub Actions setup       ├── b617406 fix(seo): aggregateRating
├── SSH key fixes              ├── c3b55db fix(seo): canonical URLs
├── Build optimizations        ├── a7057c8 fix(seo): www→non-www
│                              ├── 565c688 fix(seo): robots.txt
│                              ├── 71bf5dc fix: re-upload images
│                              ├── 57a68e9 fix: service 500 error
│                              ├── ... (195 commits total)
│                              └── fe86108 feat: offline fallback
└── ❌ SIN contenido actual

Total divergencia: **195 commits** de contenido ausentes en main
```

### Cronología del Problema

| Fecha | Branch | Acción | Resultado |
|-------|--------|--------|-----------|
| **Nov 2025** | `master` | Desarrollo activo de contenido (SEO, imágenes, Directus) | ✅ Contenido actualizado |
| **Feb 14** | `main` | Configuración de CI/CD, workflows, deploy scripts | ✅ CI/CD funcional |
| **Feb 14** | `main` | CI/CD deployó desde `main` (sin contenido de master) | ❌ **Sitio mostró versión antigua** |
| **Feb 15 02:23** | `main` | Merge de `master` → `main` (195 commits) | ✅ Contenido recuperado |

### Merge Base (Punto de Divergencia)

```bash
$ git merge-base origin/main origin/master
8e28520 fix(seo): fix undefined keywords, heading hierarchy, schema @context duplication
```

**Commits ausentes en main**:
- Optimizaciones SEO (14 mejoras)
- Migración a Directus-first para imágenes
- Fallback offline con 458 imágenes locales
- Fixes de servicios y antecedentes
- Correcciones de URLs canónicos
- Y otros 180+ commits de contenido

### Por qué Ocurrió

**Workflow incorrecto**:
1. ✅ Contenido se desarrolló en `master`
2. ✅ CI/CD se configuró en `main`
3. ❌ **CI/CD deployó desde `main`** (que no tenía el contenido)
4. ❌ Sitio mostró versión de hace 3 meses (sin las 195 actualizaciones)

### Solución Aplicada

**Merge completo de master → main**:
```bash
# Paso 1: Merge con conflictos
git merge origin/master -X theirs --no-edit

# Paso 2: Resolución de conflictos (19 archivos)
# - Eliminadas marcas de conflicto <<<<<<< HEAD
# - Tomada versión de master en todos los casos
# - Archivos afectados: Layout.astro, index.astro, todas las páginas

# Paso 3: Build y deploy exitoso
npm ci && npm run build  # ✅ Sin errores
tar czf ultimamilla-deploy.tar.gz dist/
scp → VPS → deploy_ultimamilla.sh
pm2 reload astro-ultimamilla  # ✅ Online
```

**Resultado**: Sitio ahora muestra contenido completo de master (195 commits recuperados)

---

## 🚀 PARTE 2: Estado CI/CD - Directus vs Astro

### Configuración Actual

**CI/CD solo deploya ASTRO** (frontend):

```yaml
# .github/workflows/deploy-production.yml
jobs:
  deploy-astro:
    - Build Astro Site: npm ci && npm run build
    - Package: tar czf (dist/ + node_modules/)
    - Upload: scp a VPS
    - Deploy: /opt/scripts-cicd/deploy_ultimamilla.sh
    - PM2 reload: astro-ultimamilla
```

**DIRECTUS NO está en CI/CD**:
- ❌ No hay workflow para Directus
- ❌ No hay build/deploy de Directus
- ❌ Directus corre manualmente via Docker Compose

### Arquitectura Actual de Producción

```
┌─────────────────────────────────────────────────────┐
│  VPS Producción (23.105.176.45)                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ASTRO (Frontend/SSR)                         │  │
│  │ ✅ Deployado via CI/CD                       │  │
│  │ ├── Build en GitHub Actions                  │  │
│  │ ├── Deploy automático on push to main       │  │
│  │ ├── Releases: /root/ultimamilla-releases/   │  │
│  │ ├── Symlink: /root/fumbling-field           │  │
│  │ └── PM2: astro-ultimamilla (puerto 4321)    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ DIRECTUS (Backend/CMS)                       │  │
│  │ ❌ NO está en CI/CD (manual)                 │  │
│  │ ├── Docker Compose manual                    │  │
│  │ ├── Container: directus-admin-directus-app-1│  │
│  │ ├── Database: directus-admin-database-1     │  │
│  │ ├── Uptime: 2 semanas (sin updates)         │  │
│  │ ├── Puerto: 8055                             │  │
│  │ └── Volumes: /root/.../uploads, extensions  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Network: fumbling-field_umbot-network              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Estado de Directus en Producción

```bash
$ docker ps | grep directus
d829d1b234c7   directus/directus:latest   Up 2 weeks   0.0.0.0:8055->8055/tcp   directus-admin-directus-app-1
3ed02a505f67   postgres:15-alpine         Up 2 weeks   0.0.0.0:5432->5432/tcp   directus-admin-database-1
```

**Observaciones críticas**:
- ✅ Directus corriendo estable (2 semanas uptime)
- ⚠️ **NO hay deployment automático**
- ⚠️ **Actualizaciones manuales** (riesgo de desincronización)
- ⚠️ **Sin versionado** de configuración Directus
- ⚠️ **Sin backup automático** de DB/uploads

---

## 🎯 RECOMENDACIONES

### 1. Unificar Branches (CRÍTICO)

**Problema**: Tener `main` y `master` separados causa confusion.

**Solución**:
```bash
# Opción A: Eliminar master, usar solo main
git push origin --delete master
git branch -d master

# Opción B: Hacer master = main siempre
git checkout master
git reset --hard main
git push origin master --force
```

**Workflow único**:
```
feature/* → main → deploy production
```

### 2. Agregar Directus a CI/CD (ALTA PRIORIDAD)

**Crear workflow para Directus**:

```yaml
# .github/workflows/deploy-directus.yml
name: Deploy Directus to Production

on:
  push:
    branches: [main]
    paths:
      - 'directus-admin/**'
      - '.github/workflows/deploy-directus.yml'

jobs:
  deploy-directus:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Directus Configuration
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY_BASE64 }}
          script: |
            cd /root/directus-deployment

            # Backup actual
            docker-compose exec -T database pg_dump -U directus directus > backup-$(date +%Y%m%d-%H%M%S).sql

            # Pull nueva config
            git pull origin main

            # Rebuild si cambió Dockerfile/compose
            docker-compose up -d --build

            # Verificar salud
            sleep 10
            curl -f http://localhost:8055/server/health || exit 1
```

**Ventajas**:
- ✅ Deployment automático de cambios Directus
- ✅ Backup automático antes de updates
- ✅ Rollback posible
- ✅ Logs en GitHub Actions

### 3. Estructura de Deployment Completa

**Directorio en producción**:
```
/opt/directus-releases/
├── 20260215-120000/
│   ├── docker-compose.yml
│   ├── extensions/
│   └── .env
├── 20260214-080000/
└── current → 20260215-120000/  # Symlink

/var/directus-data/  # Persistente (NO se borra)
├── uploads/
└── database/
```

**Deploy script** (`/opt/scripts-cicd/deploy_directus.sh`):
```bash
#!/bin/bash
set -e

RELEASE_NAME=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR=/opt/directus-releases/$RELEASE_NAME
CURRENT_LINK=/opt/directus-current

# 1. Backup DB
docker-compose -f /opt/directus-current/docker-compose.yml exec -T database \
  pg_dump -U directus directus > /opt/directus-backups/backup-$RELEASE_NAME.sql

# 2. Crear nuevo release
mkdir -p $RELEASE_DIR
cp -r directus-admin/* $RELEASE_DIR/

# 3. Switch symlink
ln -sfn $RELEASE_DIR $CURRENT_LINK

# 4. Recreate containers
cd $CURRENT_LINK
docker-compose up -d --force-recreate

# 5. Health check
sleep 10
curl -f http://localhost:8055/server/health || {
  echo "❌ Health check failed - ROLLBACK"
  PREV_RELEASE=$(ls -t /opt/directus-releases | sed -n 2p)
  ln -sfn /opt/directus-releases/$PREV_RELEASE $CURRENT_LINK
  cd $CURRENT_LINK && docker-compose up -d
  exit 1
}

echo "✅ Directus deployed: $RELEASE_NAME"
```

### 4. Variables de Entorno Sincronizadas

**Problema actual**: `.env` de Directus no está versionado.

**Solución**:
```yaml
# GitHub Secrets para Directus
DIRECTUS_KEY: '...'
DIRECTUS_SECRET: '...'
DIRECTUS_ADMIN_EMAIL: '...'
DIRECTUS_ADMIN_PASSWORD: '...'
DB_PASSWORD: '...'
```

**Template en repo**:
```bash
# directus-admin/.env.template
KEY=${DIRECTUS_KEY}
SECRET=${DIRECTUS_SECRET}
DB_CLIENT=pg
DB_HOST=directus-admin-database-1
DB_PORT=5432
DB_USER=directus
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=directus
ADMIN_EMAIL=${DIRECTUS_ADMIN_EMAIL}
ADMIN_PASSWORD=${DIRECTUS_ADMIN_PASSWORD}
PUBLIC_URL=https://admin.ultimamilla.com.ar
```

**Deploy genera .env**:
```bash
envsubst < .env.template > .env
```

### 5. Backup Automático

**Cron job en VPS**:
```bash
# /etc/cron.d/directus-backup
0 2 * * * root /opt/scripts-cicd/backup_directus.sh
```

**Script de backup**:
```bash
#!/bin/bash
# /opt/scripts-cicd/backup_directus.sh

BACKUP_DIR=/opt/directus-backups
DATE=$(date +%Y%m%d-%H%M%S)

# Backup DB
docker-compose -f /opt/directus-current/docker-compose.yml exec -T database \
  pg_dump -U directus directus | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Backup uploads
tar czf $BACKUP_DIR/uploads-$DATE.tar.gz /var/directus-data/uploads

# Cleanup old backups (mantener últimos 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ Backup completo: $DATE"
```

---

## 📋 CHECKLIST: Implementación CI/CD Completo

### Fase 1: Sincronización de Branches ✅
- [x] Merge master → main (195 commits)
- [ ] Decidir: eliminar `master` o mantener sincronizado
- [ ] Actualizar documentación de workflow Git

### Fase 2: Directus CI/CD 🚧
- [ ] Crear workflow `deploy-directus.yml`
- [ ] Crear script `/opt/scripts-cicd/deploy_directus.sh`
- [ ] Configurar GitHub Secrets para Directus
- [ ] Migrar directus-admin a estructura releases/

### Fase 3: Backups Automáticos 🚧
- [ ] Crear script `backup_directus.sh`
- [ ] Configurar cron job diario
- [ ] Test de restore desde backup

### Fase 4: Monitoreo 🚧
- [ ] Health checks automáticos post-deploy
- [ ] Alertas si Directus cae
- [ ] Dashboard de estado (Directus + Astro)

### Fase 5: Documentación 🚧
- [ ] CLAUDE.md actualizado con workflow Directus
- [ ] Runbook de troubleshooting Directus
- [ ] Procedimiento de rollback Directus

---

## 🔍 VERIFICACIÓN ACTUAL

### Estado del Sitio (Post-Fix)

```bash
✅ Astro Build: Sin errores de merge conflicts
✅ PM2 Status: Online (astro-ultimamilla)
✅ Latest Release: /root/ultimamilla-releases/20260215-022343
✅ Symlink: /root/fumbling-field → 20260215-022343
✅ HTTP Status: 200 en todas las páginas
✅ Contenido: 195 commits de master aplicados
✅ Imágenes: Directus assets con versioning (?v=20260201)
✅ Antecedentes: Mostrando casos de éxito completos
```

### Estado de Directus

```bash
✅ Container: directus-admin-directus-app-1 (Up 2 weeks)
✅ Database: directus-admin-database-1 (Up 2 weeks)
✅ Puerto: 8055 (accesible)
⚠️ CI/CD: NO implementado (deployment manual)
⚠️ Backups: NO automáticos
⚠️ Versionado: Config NO en Git
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Inmediato** (hoy):
   - Purgar cache Cloudflare (ya hecho)
   - Decidir estrategia de branches (main vs master)

2. **Corto plazo** (esta semana):
   - Implementar workflow Directus CI/CD
   - Configurar backups automáticos

3. **Mediano plazo** (próximas 2 semanas):
   - Migrar Directus a estructura releases
   - Implementar monitoreo automático

4. **Largo plazo** (mes):
   - Preview environments (Hostinger)
   - Rollback automático en fallos
   - Dashboard de deployment

---

**Conclusión**: El problema de versión anterior se debió a divergencia de branches. Ahora está resuelto. Sin embargo, **Directus NO está en CI/CD** y requiere implementación para tener un deployment completo y automatizado.
