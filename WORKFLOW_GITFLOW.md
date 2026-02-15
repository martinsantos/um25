# 🔄 WORKFLOW GIT FLOW - ULTIMA MILLA

**Fecha de Implementación**: 2025-11-28
**Baseline Version**: v0.0.1-production-baseline
**Repositorio**: https://github.com/martinsantos/um25.git

---

## 📋 **RESUMEN**

Este documento describe el workflow Git Flow establecido para el desarrollo del sitio web de ULTIMA MILLA, garantizando un flujo ordenado desde desarrollo hasta producción.

---

## 🌳 **ESTRUCTURA DE RAMAS**

### **Ramas Principales**

```
master (producción)
  └── Lo que está en producción (www.ultimamilla.com.ar)
  └── Protegida: requiere pull request y aprobación
  └── Deploy automático al servidor

develop (integración)
  └── Rama de desarrollo activo
  └── Integración de features antes de producción
  └── Testing completo antes de merge a master
```

### **Ramas de Soporte**

```
feature/*    → Nuevas funcionalidades
hotfix/*     → Fixes urgentes en producción
release/*    → Preparación de releases
bugfix/*     → Corrección de bugs (no urgentes)
```

---

## 🔀 **FLUJO DE TRABAJO**

### **1. Desarrollo de Nueva Funcionalidad**

```bash
# Desde develop, crear feature branch
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad

# Desarrollar y commitear
git add .
git commit -m "feat: descripción de la funcionalidad"

# Push y crear Pull Request
git push origin feature/nombre-funcionalidad
# Crear PR en GitHub: feature/nombre-funcionalidad → develop
```

**Checklist antes de merge**:
- [ ] Tests pasando
- [ ] Lint sin errores
- [ ] Build exitoso
- [ ] Code review aprobado
- [ ] Documentación actualizada

### **2. Preparación de Release**

```bash
# Desde develop, cuando esté listo para producción
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0

# Ajustes finales (versión, changelog, etc.)
npm version 0.1.0
git add .
git commit -m "chore: bump version to 0.1.0"

# Merge a master
git checkout master
git merge release/v0.1.0 --no-ff
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin master --tags

# Merge de vuelta a develop
git checkout develop
git merge release/v0.1.0 --no-ff
git push origin develop

# Eliminar rama release
git branch -d release/v0.1.0
```

### **3. Hotfix Urgente en Producción**

```bash
# Desde master, para fix urgente
git checkout master
git pull origin master
git checkout -b hotfix/descripcion-fix

# Aplicar fix
git add .
git commit -m "hotfix: descripción del fix urgente"

# Merge a master
git checkout master
git merge hotfix/descripcion-fix --no-ff
git tag -a v0.0.2 -m "Hotfix v0.0.2"
git push origin master --tags

# Merge también a develop
git checkout develop
git merge hotfix/descripcion-fix --no-ff
git push origin develop

# Eliminar rama hotfix
git branch -d hotfix/descripcion-fix
```

---

## 📝 **CONVENCIONES DE COMMITS**

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

### **Tipos de Commits**

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: add contact form to homepage` |
| `fix` | Corrección de bug | `fix: resolve image loading issue on mobile` |
| `docs` | Cambios en documentación | `docs: update README with new deployment steps` |
| `style` | Cambios de formato/estilo | `style: format code with prettier` |
| `refactor` | Refactorización de código | `refactor: simplify image utils` |
| `perf` | Mejoras de performance | `perf: optimize Directus queries` |
| `test` | Añadir o modificar tests | `test: add unit tests for API endpoints` |
| `chore` | Tareas de mantenimiento | `chore: update dependencies` |
| `ci` | Cambios en CI/CD | `ci: add GitHub Actions workflow` |

### **Formato**

```
<tipo>(<scope>): <descripción>

<cuerpo opcional>

<footer opcional>
```

**Ejemplos**:
```bash
feat(antecedentes): add filtering by vertical sector
^--^ ^-----------^  ^-----------------------------^
│    │             └─> Descripción en presente imperativo
│    └─────────────> Scope (opcional): área afectada
└──────────────────> Tipo: feat, fix, docs, etc.

fix(directus): resolve asset URL generation issue

- Update imageUtils.ts to handle null UUIDs
- Add fallback placeholder for missing images
- Update tests

Closes #123
```

---

## 🔒 **PROTECCIÓN DE RAMAS**

### **Configuración en GitHub**

**Para `master`** (Configurar en: Settings → Branches → Add rule):

- ✅ Require pull request before merging
  - Require approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Status checks:
    - `build`
    - `lint`
    - `test` (si aplica)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ❌ Allow force pushes (NUNCA en master)
- ❌ Allow deletions

**Para `develop`**:

- ✅ Require pull request before merging
  - Require approvals: 1 (puede ser menos estricto)
- ✅ Require status checks to pass before merging
- ✅ Do not allow force pushes

---

## 🚀 **DEPLOYMENT AUTOMÁTICO**

### **Triggers**

| Acción | Rama | Resultado |
|--------|------|-----------|
| **Push** | `master` | Deploy automático a PRODUCCIÓN |
| **Push** | `develop` | Build + Tests (sin deploy) |
| **PR** | cualquiera → `master` | Build + Tests + Preview |
| **PR** | cualquiera → `develop` | Build + Tests |

### **Proceso de Deploy a Producción**

```
1. Merge PR a master
   ↓
2. GitHub Actions triggered
   ↓
3. Run tests
   ↓
4. Build proyecto
   ↓
5. Deploy a servidor via SSH/rsync
   ↓
6. PM2 restart astro-ultimamilla
   ↓
7. Health check
   ↓
8. Notificación (Slack/Email)
```

---

## 📊 **ESTRATEGIA DE VERSIONADO**

Seguimos **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

### **Incremento de Versión**

- **MAJOR** (1.0.0): Cambios que rompen compatibilidad
- **MINOR** (0.1.0): Nuevas funcionalidades (compatible hacia atrás)
- **PATCH** (0.0.1): Bug fixes (compatible hacia atrás)

### **Ejemplos**

```bash
# Versión actual: v0.0.1-production-baseline

# Próximas versiones:
v0.0.2  → Hotfix urgente (patch)
v0.1.0  → Nueva funcionalidad (minor)
v1.0.0  → Reescritura completa o breaking change (major)
```

### **Pre-releases**

```bash
v0.1.0-alpha.1   → Alpha testing
v0.1.0-beta.1    → Beta testing
v0.1.0-rc.1      → Release candidate
v0.1.0           → Release final
```

---

## 🧪 **TESTING & QA**

### **Checklist Pre-Merge a Develop**

- [ ] Código compila sin errores
- [ ] ESLint pasa sin errores
- [ ] Tests unitarios pasan (si existen)
- [ ] Build de producción exitoso
- [ ] Code review por otro desarrollador

### **Checklist Pre-Merge a Master**

- [ ] Todo lo de develop +
- [ ] Tests de integración pasan
- [ ] Performance check realizado
- [ ] SEO check (si aplica)
- [ ] Accessibility check (si aplica)
- [ ] Testing manual en staging
- [ ] Documentación actualizada
- [ ] Changelog actualizado

---

## 📂 **ESTRUCTURA DE BRANCHES**

```
master (producción)
├── v0.0.1-production-baseline (tag)
├── v0.0.2 (tag, futuro)
└── v0.1.0 (tag, futuro)

develop (integración)
├── feature/add-newsletter-form
├── feature/improve-mobile-navigation
└── bugfix/fix-image-lazy-loading

hotfix/critical-security-patch (desde master)

release/v0.1.0 (antes de merge a master)
```

---

## 🔄 **SINCRONIZACIÓN DE RAMAS**

### **Mantener Develop Actualizado con Master**

```bash
# Periódicamente (después de hotfixes o releases)
git checkout develop
git pull origin develop
git merge master
git push origin develop
```

### **Mantener Feature Branch Actualizada**

```bash
# Antes de crear PR
git checkout feature/mi-feature
git merge develop
# Resolver conflictos si existen
git push origin feature/mi-feature
```

---

## 📋 **PLANTILLAS DE PULL REQUEST**

### **Template para Features**

```markdown
## Descripción
Breve descripción de qué hace este PR.

## Tipo de cambio
- [ ] Nueva funcionalidad (feature)
- [ ] Corrección de bug (bugfix)
- [ ] Mejora de performance (perf)
- [ ] Refactorización (refactor)
- [ ] Documentación (docs)

## ¿Cómo ha sido probado?
Descripción de las pruebas realizadas.

## Checklist
- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado áreas difíciles de entender
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban mi fix/feature
- [ ] Tests unitarios pasan localmente
- [ ] Build de producción exitoso

## Screenshots (si aplica)
Añadir capturas de pantalla de cambios visuales.
```

---

## 🚨 **PROTOCOLO DE ROLLBACK**

### **Si un Deploy Falla**

```bash
# 1. Identificar última versión estable
git tag | grep "^v" | tail -5

# 2. En servidor de producción
ssh ultimamilla
cd /root/fumbling-field
git checkout v0.0.1-production-baseline  # o última versión estable
pm2 restart astro-ultimamilla

# 3. Verificar
curl -I https://www.ultimamilla.com.ar
```

### **Si un Hotfix Urgente es Necesario**

1. Seguir proceso de hotfix (ver arriba)
2. Notificar al equipo
3. Documentar el incidente
4. Post-mortem si es crítico

---

## 📞 **CONTACTO Y RESPONSABLES**

| Rol | Responsable | Acciones |
|-----|-------------|----------|
| **Release Manager** | TBD | Aprobar merges a master |
| **Tech Lead** | TBD | Arquitectura y revisión de código |
| **DevOps** | TBD | CI/CD y deployment |

---

## 📚 **RECURSOS ADICIONALES**

- [Git Flow Original](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 🔄 **MIGRACIÓN A ESTE WORKFLOW**

### **Estado Actual (2025-11-28)**

✅ **Completado**:
- [x] Rama `master` con baseline de producción
- [x] Rama `develop` creada
- [x] Tag `v0.0.1-production-baseline` establecido
- [x] Documentación de workflow creada

⏳ **Próximos Pasos**:
- [ ] Configurar branch protection en GitHub
- [ ] Configurar GitHub Actions para CI/CD
- [ ] Entrenar al equipo en el workflow
- [ ] Crear templates de PR

---

## ✅ **EJEMPLOS PRÁCTICOS**

### **Ejemplo 1: Añadir Formulario de Newsletter**

```bash
# 1. Crear feature branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/add-newsletter-form

# 2. Desarrollar
# ... hacer cambios en código ...

# 3. Commits
git add src/components/NewsletterForm.astro
git commit -m "feat(newsletter): add newsletter subscription form

- Create NewsletterForm.astro component
- Add API endpoint /api/newsletter.ts
- Integrate with Mailchimp API
- Add validation and error handling
- Add success/error messages

Closes #45"

# 4. Push y crear PR
git push origin feature/add-newsletter-form
# Ir a GitHub y crear PR: feature/add-newsletter-form → develop

# 5. Después de aprobación y merge, eliminar branch
git checkout develop
git pull origin develop
git branch -d feature/add-newsletter-form
```

### **Ejemplo 2: Fix Urgente de Seguridad**

```bash
# 1. Desde master
git checkout master
git pull origin master
git checkout -b hotfix/security-xss-patch

# 2. Aplicar fix
# ... hacer cambios ...

# 3. Commit
git add .
git commit -m "hotfix(security): patch XSS vulnerability in contact form

- Sanitize all user inputs
- Add CSRF token validation
- Update security headers

SECURITY: CVE-2025-XXXXX"

# 4. Merge a master
git checkout master
git merge hotfix/security-xss-patch --no-ff
git tag -a v0.0.2 -m "Security hotfix v0.0.2"
git push origin master --tags

# 5. Merge a develop
git checkout develop
git merge hotfix/security-xss-patch --no-ff
git push origin develop

# 6. Deploy inmediato a producción (via CI/CD o manual)
```

---

**Última Actualización**: 2025-11-28
**Versión Documento**: 1.0
**Estado**: ✅ ACTIVO
