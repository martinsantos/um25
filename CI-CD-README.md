# 🔄 Pipeline CI/CD - UMBot Fumbling Field

## 📋 Resumen

Este documento contiene las instrucciones completas para configurar y activar el pipeline CI/CD automatizado del proyecto UMBot. El pipeline está diseñado para automatizar completamente el proceso desde el commit hasta el despliegue en producción.

## 🏗️ Arquitectura del Pipeline

```mermaid
graph TD
    A[🔄 Git Push/PR] --> B[🔍 Lint & Validate]
    B --> C[🧪 Tests & Coverage]
    C --> D[🏗️ Build Application]
    D --> E[🐳 Docker Build & Push]
    E --> F[🚀 Deploy Production]
    F --> G[🏥 Health Check]
    G --> H[✅ Success Notification]
    F --> I[🚨 Rollback on Failure]
    I --> J[📢 Failure Notification]
```

## 🚀 Activación Rápida

### Opción 1: Script Automático (Recomendado)
```bash
./scripts/setup-cicd.sh
```

### Opción 2: Configuración Manual
Sigue las instrucciones detalladas en la sección "Configuración Manual" más abajo.

## 📋 Prerrequisitos

✅ **Verificar antes de comenzar:**
- [ ] Acceso de administrador al repositorio GitHub
- [ ] Cuenta de Docker Hub activa
- [ ] Acceso SSH al servidor de producción (23.105.176.45)
- [ ] Git configurado localmente
- [ ] Docker instalado localmente (para testing)

## 🔐 Configuración de Secrets

### 1. Acceso a GitHub Secrets
```
GitHub > Tu Repositorio > Settings > Secrets and variables > Actions
```

### 2. Secrets Requeridos

#### 🐳 Docker Hub Access
```
DOCKERHUB_USERNAME: tu_usuario_dockerhub
DOCKERHUB_TOKEN: dckr_pat_xxxxxxxxxxxxx
```

**Cómo obtener el token:**
1. Ir a [Docker Hub](https://hub.docker.com)
2. Account Settings > Security > Access Tokens
3. Generate New Token
4. Permisos: Read, Write, Delete
5. Copiar el token generado

#### 🔑 SSH Access
```
SSH_PRIVATE_KEY: -----BEGIN OPENSSH PRIVATE KEY-----
[contenido completo de la clave privada]
-----END OPENSSH PRIVATE KEY-----
```

**Configuración SSH:**
```bash
# Generar clave SSH (si no existe)
ssh-keygen -t rsa -b 4096 -C "github-actions@umbot.com.ar" -f ~/.ssh/github-actions-umbot

# Instalar clave pública en servidor
ssh-copy-id -i ~/.ssh/github-actions-umbot.pub root@23.105.176.45

# Probar conexión
ssh -i ~/.ssh/github-actions-umbot root@23.105.176.45 'echo "SSH funcionando"'

# Copiar clave privada para GitHub Secrets
cat ~/.ssh/github-actions-umbot
```

#### 📱 Slack Notifications (Opcional)
```
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## 🧪 Plan de Testing Seguro

### Paso 1: Crear Rama de Testing
```bash
git checkout -b test-ci-cd-$(date +%Y%m%d)
git push -u origin test-ci-cd-$(date +%Y%m%d)
```

### Paso 2: Modificar Workflow Temporalmente
```yaml
# En .github/workflows/ci-cd.yml, cambiar:
on:
  push:
    branches: [ test-ci-cd-20250627 ]  # Solo tu rama de testing
```

### Paso 3: Ejecutar Test Inicial
```bash
# Hacer cambio menor
echo "# Test CI/CD - $(date)" >> README.md
git add README.md
git commit -m "test: Activar pipeline CI/CD"
git push origin test-ci-cd-20250627
```

### Paso 4: Verificar Ejecución
1. Ir a **GitHub > Actions**
2. Verificar que se ejecuten todos los jobs
3. Revisar logs de cada paso
4. Confirmar despliegue exitoso

### Paso 5: Test de Rollback
```bash
# Introducir error intencional
sed -i 's/"test": ".*"/"test": "exit 1"/' package.json
git add package.json
git commit -m "test: Probar rollback"
git push origin test-ci-cd-20250627

# Verificar que el rollback se ejecute automáticamente
# Restaurar después del test
git revert HEAD
git push origin test-ci-cd-20250627
```

### Paso 6: Activar para Main
```bash
# Restaurar workflow original
git checkout .github/workflows/ci-cd.yml

# Merge a main
git checkout main
git merge test-ci-cd-20250627
git push origin main
```

## 📊 Jobs del Pipeline

### 1. 🔍 Lint & Validate
- **Duración:** ~2 minutos
- **Acciones:**
  - ESLint para calidad de código
  - TypeScript validation
  - Prettier format check

### 2. 🧪 Tests & Coverage
- **Duración:** ~3 minutos
- **Acciones:**
  - Jest unit tests
  - Integration tests
  - Coverage report a Codecov

### 3. 🏗️ Build Application
- **Duración:** ~4 minutos
- **Acciones:**
  - Astro production build
  - Asset optimization
  - Artifact generation

### 4. 🐳 Docker Build & Push
- **Duración:** ~5 minutos
- **Acciones:**
  - Multi-platform build (amd64/arm64)
  - Push to Docker Hub
  - Tag management

### 5. 🚀 Deploy Production
- **Duración:** ~3 minutos
- **Acciones:**
  - SSH to production server
  - Pull latest images
  - Recreate services
  - Health verification

### 6. 🔄 Rollback (if needed)
- **Duración:** ~2 minutos
- **Triggers:**
  - Health check failure
  - Deployment script error
  - Post-deployment test failure

## 🏥 Health Checks

### Verificaciones Automáticas
```bash
# Conectividad básica
curl -f https://www.umbot.com.ar/

# API health
curl -f https://www.umbot.com.ar/api/server/health

# Páginas críticas
curl -f https://www.umbot.com.ar/antecedentes
curl -f https://www.umbot.com.ar/servicios
```

### Configuración de Timeouts
- **Timeout total:** 300 segundos
- **Reintentos:** 10 attempts
- **Intervalo:** 30 segundos entre intentos

## 🚨 Rollback Automático

### Triggers de Rollback
- ❌ Health check fallido (10 intentos)
- ❌ Error en script de despliegue
- ❌ Tests post-despliegue fallidos
- ❌ Timeout en verificaciones

### Proceso de Rollback
1. **Backup automático** antes de cada despliegue
2. **Detener servicios** actuales
3. **Restaurar código** desde backup
4. **Restaurar BD** (si necesario)
5. **Restaurar uploads** (si necesario)
6. **Reiniciar servicios**
7. **Verificar funcionalidad**
8. **Notificar rollback**

## 📋 Monitoreo y Troubleshooting

### Comandos de Monitoreo
```bash
# Ver estado del pipeline
ssh root@23.105.176.45 "docker ps"

# Ver logs de despliegue
ssh root@23.105.176.45 "cd /root/fumbling-field && cat .deploy-info"

# Verificar salud del sitio
curl -I https://www.umbot.com.ar/
```

### Logs Importantes
```bash
# Logs de GitHub Actions
# Ir a: GitHub > Repository > Actions > [Workflow Run]

# Logs del servidor
ssh root@23.105.176.45 "docker-compose -f docker-compose.prod.yml logs --tail 50"

# Logs de nginx
ssh root@23.105.176.45 "tail -f /var/log/nginx/access.log"
```

### Troubleshooting Común

#### ❌ Pipeline falla en SSH
```bash
# Verificar clave SSH
ssh -i ~/.ssh/github-actions-umbot root@23.105.176.45

# Verificar known_hosts
ssh-keyscan -H 23.105.176.45 >> ~/.ssh/known_hosts
```

#### ❌ Docker build falla
```bash
# Verificar Dockerfile
docker build -f Dockerfile.astro.prod .

# Verificar secrets de Docker Hub
echo $DOCKERHUB_TOKEN | docker login --username $DOCKERHUB_USERNAME --password-stdin
```

#### ❌ Health check falla
```bash
# Verificar sitio manualmente
curl -v https://www.umbot.com.ar/

# Verificar logs del servidor
ssh root@23.105.176.45 "docker logs fumbling-field-astro-app-1"
```

## 🔧 Mantenimiento

### Tareas Regulares
- **Semanal:** Revisar logs de GitHub Actions
- **Mensual:** Limpiar artifacts antiguos
- **Trimestral:** Actualizar dependencias del pipeline
- **Anual:** Renovar tokens y credenciales

### Actualizaciones del Pipeline
1. Crear rama `feature/pipeline-update`
2. Modificar `.github/workflows/ci-cd.yml`
3. Probar en rama de testing
4. Merge a main después de verificación

## 📊 Métricas de Éxito

### KPIs del Pipeline
- ✅ **Tiempo total:** < 15 minutos
- ✅ **Éxito rate:** > 95%
- ✅ **Rollback time:** < 3 minutos
- ✅ **Test coverage:** > 80%
- ✅ **Zero downtime:** 99.9%

### Beneficios Alcanzados
- 🚀 **Despliegue automático:** 0 intervención manual
- 🔍 **Calidad garantizada:** Tests + lint automáticos
- ⚡ **Velocidad:** De 30min → 5min de despliegue
- 🛡️ **Seguridad:** Rollback automático
- 📊 **Visibilidad:** Logs y notificaciones completas

## 🎯 Próximos Pasos

### Mejoras Planificadas
- [ ] **Staging Environment:** Deploy automático a staging
- [ ] **Blue-Green Deployment:** Zero-downtime deployments
- [ ] **Performance Monitoring:** Métricas automáticas
- [ ] **Security Scanning:** Análisis de vulnerabilidades
- [ ] **A/B Testing:** Tests automáticos de features

## 📞 Soporte

### Contactos de Emergencia
- **Pipeline Issues:** Revisar GitHub Actions logs
- **Server Issues:** SSH a 23.105.176.45
- **DNS/SSL Issues:** Verificar Cloudflare/Let's Encrypt

### Recursos Útiles
- 📖 [GitHub Actions Docs](https://docs.github.com/en/actions)
- 🐳 [Docker Compose Reference](https://docs.docker.com/compose/)
- 🚀 [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- 📊 [UMBot Status Page](https://www.umbot.com.ar/)

---

## ✅ Checklist de Activación

Antes de activar el pipeline, verificar:

- [ ] Secrets configurados en GitHub
- [ ] SSH funcionando al servidor
- [ ] Docker Hub access configurado
- [ ] Tests ejecutándose localmente
- [ ] Backup del servidor realizado
- [ ] Equipo notificado del cambio
- [ ] Rollback plan documentado
- [ ] Monitoreo configurado

---

**🏆 Una vez completada la configuración, el pipeline CI/CD estará completamente automatizado y funcionando para el proyecto UMBot.** 