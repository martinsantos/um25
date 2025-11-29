# 🔧 GUÍA DE CONFIGURACIÓN POST-IMPLEMENTACIÓN

**Fecha**: 2025-11-28
**Versión**: 1.0
**Para**: Configuraciones que requieren acceso web o servicios externos

---

## 📋 ÍNDICE

1. [Configurar Branch Protection en GitHub](#1-configurar-branch-protection-en-github)
2. [Configurar GitHub Secrets para CI/CD](#2-configurar-github-secrets-para-cicd)
3. [Implementar Sentry Error Tracking](#3-implementar-sentry-error-tracking)
4. [Configurar UptimeRobot Monitoring](#4-configurar-uptimerobot-monitoring)
5. [Optimización de Seguridad](#5-optimización-de-seguridad)

---

## 1. Configurar Branch Protection en GitHub

### **¿Por qué es importante?**

Branch protection previene:
- Push directo a `master` (violación crítica de reglas)
- Merge sin aprobación de PR
- Deploy accidental sin tests

### **Pasos para Configurar**

#### **Proteger rama `master`**

1. **Ir a Settings del repositorio**:
   ```
   https://github.com/martinsantos/um25/settings/branches
   ```

2. **Add branch protection rule**:
   - Branch name pattern: `master`

3. **Configuraciones requeridas**:

   ✅ **Require a pull request before merging**
   - Require approvals: `1`
   - Dismiss stale pull request approvals when new commits are pushed: ✓
   - Require review from Code Owners: ✓ (opcional)

   ✅ **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✓
   - Status checks requeridos:
     - `build` (del workflow production-deploy.yml)
     - `lint` (del workflow pr-checks.yml)
     - `test` (del workflow pr-checks.yml)

   ✅ **Require conversation resolution before merging**: ✓

   ✅ **Require linear history**: ✓

   ✅ **Do not allow bypassing the above settings**: ✓

   ❌ **Allow force pushes**: DESACTIVADO

   ❌ **Allow deletions**: DESACTIVADO

4. **Save changes**

#### **Proteger rama `develop`**

Repetir pasos anteriores con:
- Branch name pattern: `develop`
- Configuraciones similares pero menos estrictas:
  - Require approvals: `1` (puede ser 0 para desarrollo rápido)
  - Status checks: solo `build` y `lint`

### **Verificación**

```bash
# Intenta hacer push directo a master (debe fallar):
git checkout master
git commit --allow-empty -m "test: branch protection"
git push origin master
# Resultado esperado: ! [remote rejected] master -> master (protected branch hook declined)
```

---

## 2. Configurar GitHub Secrets para CI/CD

### **¿Por qué es importante?**

Los secrets permiten:
- Deploy automático vía SSH
- Notificaciones de Slack/Discord
- Integración con servicios externos

### **Secrets Requeridos**

#### **SSH_PRIVATE_KEY** (CRÍTICO para deploy)

1. **Generar par de claves SSH** (si no existe):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions@ultimamilla.com.ar" -f ~/.ssh/github_deploy_key
   ```

2. **Copiar clave pública al servidor**:
   ```bash
   ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@23.105.176.45
   ```

3. **Copiar clave privada**:
   ```bash
   cat ~/.ssh/github_deploy_key
   # Copiar TODO el contenido (desde -----BEGIN hasta -----END)
   ```

4. **Agregar a GitHub Secrets**:
   - Ir a: `https://github.com/martinsantos/um25/settings/secrets/actions`
   - Click: **New repository secret**
   - Name: `SSH_PRIVATE_KEY`
   - Value: [pegar clave privada completa]
   - Click: **Add secret**

#### **SENTRY_DSN** (para error tracking)

1. **Crear cuenta en Sentry**: https://sentry.io/signup/

2. **Crear nuevo proyecto**:
   - Platform: `Astro`
   - Project name: `ultimamilla-web`

3. **Copiar DSN**:
   ```
   Settings → Projects → ultimamilla-web → Client Keys (DSN)
   Ejemplo: https://abc123@o123456.ingest.sentry.io/123456
   ```

4. **Agregar a GitHub Secrets**:
   - Name: `SENTRY_DSN`
   - Value: [pegar DSN]

5. **Agregar a `.env` en servidor de producción**:
   ```bash
   ssh ultimamilla
   echo "SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456" >> /root/fumbling-field/.env
   ```

#### **SLACK_WEBHOOK_URL** (opcional, para notificaciones)

1. **Crear Slack Webhook**:
   - Ir a: https://api.slack.com/messaging/webhooks
   - Click: **Create New App** → **From scratch**
   - App Name: `ULTIMA MILLA Deployment`
   - Workspace: [tu workspace]

2. **Activar Incoming Webhooks**:
   - Features → Incoming Webhooks → **On**
   - Add New Webhook to Workspace
   - Seleccionar canal: `#deployments`
   - Copy Webhook URL

3. **Agregar a GitHub Secrets**:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: [pegar webhook URL]

### **Lista Completa de Secrets Recomendados**

```yaml
Obligatorios:
  SSH_PRIVATE_KEY: Clave SSH para deploy
  SENTRY_DSN: Sentry error tracking

Opcionales:
  SLACK_WEBHOOK_URL: Notificaciones de deploy
  DISCORD_WEBHOOK_URL: Notificaciones alternativas
```

### **Verificación**

Secrets configurados correctamente si:
```bash
# Workflow de deploy funciona sin errores de autenticación
git push origin master
# GitHub Actions debe conectar vía SSH y deployar
```

---

## 3. Implementar Sentry Error Tracking

### **Estado Actual**

✅ **Sentry ya instalado**: `@sentry/astro`
✅ **Configurado en**: `astro.config.mjs`

### **Pasos Restantes**

#### **1. Crear cuenta y proyecto en Sentry**

1. Ir a: https://sentry.io/signup/
2. Crear organización: `ULTIMA MILLA`
3. Crear proyecto:
   - Platform: `Astro`
   - Project name: `ultimamilla-web`
   - Alert frequency: `On every new issue`

#### **2. Obtener DSN**

```
Settings → Projects → ultimamilla-web → Client Keys (DSN)
DSN: https://abc123@o123456.ingest.sentry.io/123456
```

#### **3. Configurar variables de entorno**

**En desarrollo** (`.env.local`):
```bash
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
NODE_ENV=development
```

**En producción** (servidor):
```bash
ssh ultimamilla
cd /root/fumbling-field
echo "SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456" >> .env
pm2 restart astro-ultimamilla
```

**En GitHub Secrets** (para CI/CD):
- Ver sección anterior: [Configurar GitHub Secrets](#2-configurar-github-secrets-para-cicd)

#### **4. Verificar funcionamiento**

**Test en desarrollo**:
```typescript
// src/pages/test-sentry.astro
---
import * as Sentry from '@sentry/astro';

// Generar error de prueba
Sentry.captureMessage('Test message from Astro', 'info');

try {
  throw new Error('Test error from Astro');
} catch (error) {
  Sentry.captureException(error);
}
---

<h1>Sentry Test Page</h1>
<p>Check Sentry dashboard for test events</p>
```

Visitar: `http://localhost:4321/test-sentry`

**Verificar en dashboard**:
```
https://sentry.io/ → Projects → ultimamilla-web → Issues
```

Deberías ver:
- ✅ Test message from Astro
- ✅ Test error from Astro

#### **5. Configurar alertas**

En Sentry dashboard:
```
Settings → Alerts → Create Alert Rule

Regla: "Email on new issue"
  When: An event is first seen
  Then: Send a notification via email
  To: admin@ultimamilla.com.ar
```

### **Uso en Código**

```typescript
// Capturar errores
import * as Sentry from '@sentry/astro';

try {
  // Código que puede fallar
  const data = await fetchDataFromDirectus();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'directus',
      action: 'fetch-data'
    }
  });
}

// Capturar mensajes
Sentry.captureMessage('User action logged', {
  level: 'info',
  tags: { user_id: '123' }
});
```

---

## 4. Configurar UptimeRobot Monitoring

### **¿Por qué UptimeRobot?**

- ✅ Gratis hasta 50 monitores
- ✅ Checks cada 5 minutos
- ✅ Alertas por email/SMS/Slack
- ✅ Status page pública
- ✅ Historial de uptime 30/90 días

### **Pasos de Configuración**

#### **1. Crear cuenta**

1. Ir a: https://uptimerobot.com/signUp
2. Email: `admin@ultimamilla.com.ar`
3. Verificar email

#### **2. Crear monitores**

**Monitor 1: Sitio Principal (CRÍTICO)**
```yaml
Monitor Type: HTTP(s)
Friendly Name: ULTIMA MILLA - Sitio Principal
URL: https://www.ultimamilla.com.ar
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: [tu email]
```

**Monitor 2: SGI System**
```yaml
Monitor Type: HTTP(s)
Friendly Name: ULTIMA MILLA - SGI
URL: https://sgi.ultimamilla.com.ar
Monitoring Interval: 5 minutes
Expected Status Code: 302 (redirect)
```

**Monitor 3: UMBot**
```yaml
Monitor Type: HTTP(s)
Friendly Name: ULTIMA MILLA - UMBot
URL: https://www.umbot.com.ar
Monitoring Interval: 5 minutes
```

**Monitor 4: Vivero Los Cocos**
```yaml
Monitor Type: HTTP(s)
Friendly Name: Vivero Los Cocos
URL: https://viveroloscocos.com.ar
Monitoring Interval: 5 minutes
```

**Monitor 5: CyberPanel**
```yaml
Monitor Type: HTTP(s)
Friendly Name: ULTIMA MILLA - CyberPanel
URL: https://23.105.176.45:8090/
Monitoring Interval: 10 minutes
Ignore SSL errors: Yes (si cert auto-firmado)
```

#### **3. Configurar alertas**

**Alert Contacts**:
```
Primary Email: admin@ultimamilla.com.ar
Threshold: Alert when down
```

**Opcional - Slack Integration**:
1. My Settings → Add Alert Contact
2. Type: **Webhook**
3. Webhook URL: [tu Slack webhook]
4. POST Value:
   ```json
   {
     "text": "*monitorFriendlyName* is *monitorAlertType*\nURL: *monitorURL*"
   }
   ```

#### **4. Crear Status Page (Público)**

1. Status Pages → Add Status Page
2. Friendly Name: `ULTIMA MILLA Services Status`
3. Select Monitors: [todos los creados]
4. Custom Domain: `status.ultimamilla.com.ar` (opcional)
5. Public URL: `https://stats.uptimerobot.com/xyz123`

**Compartir status page**:
```html
<!-- En footer del sitio web -->
<a href="https://stats.uptimerobot.com/xyz123" target="_blank">
  Service Status
</a>
```

### **Verificación**

```bash
# Probar downtime simulado
ssh ultimamilla
pm2 stop astro-ultimamilla

# Esperar 5 minutos → debe llegar alerta por email

# Restaurar
pm2 start astro-ultimamilla
```

---

## 5. Optimización de Seguridad

### **Headers de Seguridad en Nginx**

**Editar configuración de Nginx**:
```bash
ssh ultimamilla
nano /etc/nginx/sites-enabled/ultimamilla.com.ar.conf
```

**Agregar headers de seguridad**:
```nginx
server {
    listen 443 ssl http2;
    server_name www.ultimamilla.com.ar;

    # SSL Configuration (existente)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security Headers (AGREGAR)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://admin.ultimamilla.com.ar;" always;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Security headers en proxy
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Reiniciar Nginx**:
```bash
nginx -t  # Verificar sintaxis
systemctl restart nginx
```

### **Rate Limiting**

**Agregar a nginx.conf**:
```nginx
http {
    # ... existing config ...

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        # ... server config ...

        # Apply rate limiting
        limit_req zone=general burst=20 nodelay;
        limit_conn addr 10;

        # API endpoints más restrictivos
        location /api/ {
            limit_req zone=api burst=5 nodelay;
            proxy_pass http://localhost:4321;
        }
    }
}
```

### **Firewall (UFW)**

```bash
ssh ultimamilla

# Verificar estado
ufw status

# Si no está configurado:
ufw default deny incoming
ufw default allow outgoing

# Permitir solo puertos necesarios
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8090/tcp  # CyberPanel

# Activar
ufw enable

# Verificar
ufw status verbose
```

### **Dependencias con Vulnerabilidades**

**Ejecutar audit**:
```bash
npm audit

# Arreglar automáticamente
npm audit fix

# Si hay breaking changes:
npm audit fix --force  # Solo si es seguro
```

**Actualizar package.json**:
```bash
# Ver outdated packages
npm outdated

# Actualizar patches (seguro)
npm update

# Actualizar majors (revisar breaking changes)
npm install package@latest
```

### **Environment Variables**

**Verificar que secrets NO estén en Git**:
```bash
# .gitignore debe contener:
.env
.env.local
.env.production
.env.*
directus-admin/.env
```

**Rotar secrets periódicamente**:
```bash
# Cada 90 días, regenerar:
1. Claves SSH
2. Tokens de Directus
3. Database passwords
4. API keys
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### **Urgente (1 semana)**

- [ ] **Branch Protection** configurado en `master`
- [ ] **Branch Protection** configurado en `develop`
- [ ] **GitHub Secret**: `SSH_PRIVATE_KEY` añadido
- [ ] **Sentry**: Cuenta creada y DSN configurado
- [ ] **Sentry**: Variable `SENTRY_DSN` en servidor producción
- [ ] **UptimeRobot**: Cuenta creada
- [ ] **UptimeRobot**: 5 monitores configurados
- [ ] **UptimeRobot**: Alertas por email configuradas

### **Importante (2 semanas)**

- [ ] **Nginx**: Headers de seguridad añadidos
- [ ] **Nginx**: Rate limiting configurado
- [ ] **Firewall**: UFW configurado y activo
- [ ] **npm audit**: Vulnerabilidades resueltas
- [ ] **Slack/Discord**: Webhook configurado (opcional)
- [ ] **Status Page**: Creada y URL pública disponible

### **Recomendado (1 mes)**

- [ ] **Sentry**: Alertas configuradas para errores críticos
- [ ] **CSP**: Content Security Policy ajustado
- [ ] **Dependencias**: Actualizadas a latest stable
- [ ] **Secrets**: Documentados en password manager
- [ ] **Rotación**: Calendario establecido para rotar secrets

---

## 🆘 TROUBLESHOOTING

### **Branch Protection no funciona**

```bash
# Verificar permisos de usuario
# Settings → Manage access → Roles
# Debe ser Admin para configurar branch protection
```

### **GitHub Actions no puede hacer SSH**

```bash
# Verificar que SSH_PRIVATE_KEY esté correctamente formateado
# Debe incluir header y footer completos:
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### **Sentry no captura errores**

```bash
# Verificar que esté en producción
echo $NODE_ENV  # debe ser 'production'

# Verificar DSN
echo $SENTRY_DSN  # debe tener formato válido

# Revisar logs
pm2 logs astro-ultimamilla | grep -i sentry
```

### **UptimeRobot reporta falsos positivos**

```
# Ajustar timeout
Monitor Settings → Monitoring Timeout: 60 seconds

# Cambiar monitoring locations
Monitor Settings → Monitoring Locations: [seleccionar múltiples]
```

---

## 📞 SOPORTE

**Documentación Oficial**:
- GitHub Branch Protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- Sentry Astro: https://docs.sentry.io/platforms/javascript/guides/astro/
- UptimeRobot: https://uptimerobot.com/help/
- Nginx Security: https://nginx.org/en/docs/http/ngx_http_headers_module.html

**Contacto Interno**:
- Email: admin@ultimamilla.com.ar
- Server: ssh ultimamilla (23.105.176.45)

---

**Última Actualización**: 2025-11-28
**Versión**: 1.0
**Mantenido por**: Equipo DevOps ULTIMA MILLA
