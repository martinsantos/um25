# 🚀 ULTiMA MILLA - Fumbling Field

[![CI/CD Pipeline](https://github.com/martinsantos/um25/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/martinsantos/um25/actions/workflows/ci-cd.yml)
[![Deployment Status](https://img.shields.io/website?url=https%3A//www.ultimamilla.com.ar)](https://www.ultimamilla.com.ar)
[![Docker Image](https://img.shields.io/docker/v/umbot/fumbling-field?label=docker)](https://hub.docker.com/r/umbot/fumbling-field)
[![System Status](https://img.shields.io/badge/status-100%25%20functional-brightgreen)](https://www.ultimamilla.com.ar)

> **Aplicación web moderna para ULTiMA MILLA** - Portal corporativo con Astro, Directus CMS, y pipeline CI/CD automatizado.

## 🎉 **HITO ALCANZADO: 100% FUNCIONAL** (22/11/2025)

### ✅ **Estado del Sistema**
```
╔════════════════════════════════════════════════╗
║  🎯 SISTEMA 100% OPERATIVO                    ║
║  📊 42/42 TESTS EXITOSOS                      ║
║  🚀 PRODUCCIÓN ESTABLE                        ║
╚════════════════════════════════════════════════╝
```

### 🔥 **Logros Principales**
- ✅ **Logo Ultima Milla**: Visible y funcionando (fix de componente Image)
- ✅ **Imágenes**: 100% cargando correctamente (469 antecedentes)
- ✅ **Directus CMS**: Integración completa y operativa
- ✅ **Filtros de Sector**: Depurados y coherentes (constructoras, salud, bodegas, etc.)
- ✅ **Errores 404**: Eliminados (favicon, CSS, manifest)
- ✅ **Fallback System**: Actualizado con imageFixer para imágenes rotas

### 📦 **Versión Actual**
- **Versión**: v2.0.0-stable
- **Fecha**: 22 de Noviembre 2025
- **Commit**: Production-ready with 100% functionality
- **Backup**: `backup_ultimamilla_fixed_v3.tar.gz` (25GB)

### 🔧 **Cambios Técnicos Implementados**

#### **Fixes Críticos**
1. **Logo Fix** (`src/components/Navigation.astro`)
   - Reemplazado `<Image />` por `<img>` estándar
   - Eliminado error 500 en `/_image`

2. **Image Loading System** (6 archivos de sector)
   - Implementado `imageFixer.js` con mapeo de 13 imágenes rotas
   - Priorización de URLs de Directus en `getImageUrl()`
   - Fix de Mixed Content (localhost:8055 → producción)

3. **Constructoras Filter** (`src/pages/constructoras.astro`)
   - Filtro positivo estricto con keywords específicas
   - Eliminación de antecedentes no relacionados

4. **Layout Fixes** (`src/layouts/Layout.astro`)
   - Favicon: `/favicon.ico` → `/favicon.svg`
   - Eliminado `uiEffects-v2.css` (404)
   - Creado `site.webmanifest` para PWA

#### **Archivos Nuevos**
- `src/utils/imageFixer.js` - Sistema de mapeo de imágenes
- `public/site.webmanifest` - Configuración PWA

#### **Archivos Modificados**
- `src/components/Navigation.astro`
- `src/pages/antecedentes/[id]/[slug].astro`
- `src/utils/directus.js`
- `src/pages/constructoras.astro`
- `src/pages/aeropuertos.astro`
- `src/pages/bodegas.astro`
- `src/pages/salud.astro`
- `src/pages/software.astro`
- `src/pages/gobiernosectorpublico.astro`
- `src/layouts/Layout.astro`

### 📊 **Testing Results**
```bash
# Test Suite: test-100-definitivo.sh
Total: 42 tests
✅ Exitosos: 42
❌ Fallidos: 0
📊 Éxito: 100%

Cobertura:
✓ Todas las páginas principales
✓ Logo y assets
✓ Imágenes de antecedentes (muestra representativa)
✓ Directus API
✓ Páginas de sector (6 sectores)
```

## 🌐 **Enlaces Importantes**

- **🌍 Sitio Web**: [www.ultimamilla.com.ar](https://www.ultimamilla.com.ar)
- **🎛️ Admin Panel**: [admin.ultimamilla.com.ar](https://admin.ultimamilla.com.ar)
- **📊 GitHub Repository**: [martinsantos/um25](https://github.com/martinsantos/um25)

## 📋 **Tabla de Contenidos**

- [🏗️ Arquitectura](#️-arquitectura)
- [⚡ Quick Start](#-quick-start)
- [🛠️ Desarrollo Local](#️-desarrollo-local)
- [🚀 Pipeline CI/CD](#-pipeline-cicd)
- [📦 Deploy](#-deploy)
- [🧪 Testing](#-testing)
- [📚 Comandos Útiles](#-comandos-útiles)
- [🔧 Configuración](#-configuración)
- [📖 Documentación](#-documentación)

## 🏗️ **Arquitectura**

### **Tech Stack**
- **Frontend**: [Astro](https://astro.build/) + TypeScript + Tailwind CSS
- **CMS**: [Directus](https://directus.io/) v10.8.3
- **Base de Datos**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerización**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Servidor dedicado con nginx

### **Arquitectura del Sistema**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │───▶│   Astro App     │───▶│   Directus CMS  │
│  (Reverse Proxy)│    │   (SSR/SSG)     │    │   (Headless)    │
│   Port 80/443   │    │   Port 4321     │    │   Port 8055     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │   PostgreSQL    │
                       │   (Cache)       │    │   (Database)    │
                       │   Port 6379     │    │   Port 5432     │
                       └─────────────────┘    └─────────────────┘
```

### **Pipeline CI/CD**
```
┌─────────────┐  git push  ┌─────────────┐  build  ┌─────────────┐  deploy  ┌─────────────┐
│  Developer  │──────────▶│   GitHub    │────────▶│ Docker Hub  │────────▶│ Production  │
│   (Local)   │           │  Actions    │         │  Registry   │         │   Server    │
└─────────────┘           └─────────────┘         └─────────────┘         └─────────────┘
                                │                                                 │
                                ▼                                                 ▼
                         ┌─────────────┐                                  ┌─────────────┐
                         │    Tests    │                                  │ Health Check│
                         │  Coverage   │                                  │  Rollback   │
                         │    Lint     │                                  │ Monitoring  │
                         └─────────────┘                                  └─────────────┘
```

## ⚡ **Quick Start**

### **1. Setup Automático (Recomendado)**
```bash
# Clonar repositorio
git clone https://github.com/martinsantos/um25.git
cd um25

# Setup completo automatizado
make setup
```

### **2. Desarrollo Inmediato**
```bash
# Iniciar desarrollo (todas las dependencias incluidas)
make dev-docker

# O desarrollo sin Docker
make dev
```

### **3. Verificar Setup**
```bash
# Ver estado de servicios
make status

# Health check completo
make health

# Ver URLs disponibles
make urls
```

## 🛠️ **Desarrollo Local**

### **Prerrequisitos**
- Node.js 18+ 
- Docker Desktop
- Git
- Make (opcional pero recomendado)

### **Configuración Manual**
```bash
# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar servicios con Docker
docker-compose -f docker-compose.dev.yml up -d

# Iniciar desarrollo
npm run dev
```

### **Servicios de Desarrollo**
| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **App Principal** | http://localhost:4321 | - |
| **Directus Admin** | http://localhost:8055 | admin@umbot.local / admin123dev |
| **Adminer (DB)** | http://localhost:8080 | directus / dev_password_2025 |
| **MailHog (Email)** | http://localhost:8025 | - |
| **Redis** | localhost:6379 | - |
| **PostgreSQL** | localhost:5432 | directus / dev_password_2025 |

### **Estructura del Proyecto**
```
fumbling-field/
├── .github/workflows/     # GitHub Actions CI/CD
├── scripts/              # Scripts de deploy y setup
├── src/                  # Código fuente Astro
├── public/               # Assets estáticos
├── docker-compose.*.yml  # Configuraciones Docker
├── Dockerfile.*          # Dockerfiles optimizados
├── Makefile             # Comandos útiles
└── package.json         # Dependencias y scripts
```

## 🚀 **Pipeline CI/CD**

### **Triggers Automáticos**
- **Push a `main`**: Deploy automático a producción
- **Pull Request**: Build y tests
- **Tags `v*`**: Release con versionado semántico

### **Stages del Pipeline**
1. **🔍 Lint & Quality**: ESLint, Prettier, TypeScript
2. **🧪 Tests**: Unit tests + coverage report
3. **🏗️ Build**: Aplicación + Docker image
4. **🐳 Push**: Subida automática a Docker Hub
5. **🚀 Deploy**: Despliegue en servidor de producción
6. **🏥 Health Check**: Verificación de funcionamiento
7. **🔄 Rollback**: Automático en caso de fallo

### **Configuración de Secrets en GitHub**
```bash
# Ir a Settings → Secrets and variables → Actions
DOCKERHUB_USERNAME=tu_usuario
DOCKERHUB_TOKEN=tu_token
SSH_PRIVATE_KEY=clave_ssh_privada
SLACK_WEBHOOK_URL=webhook_opcional
```

### **Monitoreo del Pipeline**
- [![Build Status](https://github.com/martinsantos/um25/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/martinsantos/um25/actions)
- Notificaciones Slack en deploys
- Health checks automáticos post-deploy

## 📦 **Deploy**

### **Deploy Automático (CI/CD)**
```bash
# Deploy se ejecuta automáticamente en push a main
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

### **Deploy Manual**
```bash
# Deploy con validaciones completas
make deploy

# Deploy forzado (sin validaciones)
make deploy-force

# Rollback a versión anterior
make rollback
```

### **Ambientes**
- **Desarrollo**: `http://localhost:4321`
- **Producción**: `https://www.umbot.com.ar`

## 🧪 **Testing**

### **Comandos de Testing**
```bash
# Tests unitarios
make test

# Tests con watch mode
make test-watch

# Coverage report
make test-coverage

# Lint código
make lint

# Auto-fix lint issues
make lint-fix

# Validación completa (lint + test + build)
make validate
```

### **Testing en CI/CD**
- Tests unitarios automáticos
- Coverage tracking con Codecov
- Lint validation en PRs
- Build verification antes de deploy

## 📚 **Comandos Útiles**

### **Desarrollo**
```bash
make dev              # Desarrollo local sin Docker
make dev-docker       # Desarrollo con Docker completo
make build            # Build para producción
make build-docker     # Build imagen Docker
```

### **Base de Datos**
```bash
make db-backup        # Crear backup automático
make db-restore       # Restaurar backup (BACKUP_FILE=file.sql)
make db-reset         # Reset completo de BD
```

### **Monitoreo**
```bash
make status           # Estado de servicios
make logs             # Ver logs de desarrollo
make logs-prod        # Ver logs de producción
make health           # Health check completo
```

### **Limpieza**
```bash
make clean           # Limpiar archivos temporales
make clean-docker    # Limpiar contenedores Docker
make clean-all       # Limpieza completa
```

### **Información**
```bash
make help            # Ver todos los comandos disponibles
make info            # Información del proyecto
make urls            # URLs importantes
```

## 🔧 **Configuración**

### **Variables de Entorno**

#### **Desarrollo (`.env.local`)**
```bash
NODE_ENV=development
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
DATABASE_URL=postgresql://directus:dev_password_2025@localhost:5432/directus_dev
REDIS_URL=redis://localhost:6379
```

#### **Producción (`.env`)**
```bash
NODE_ENV=production
DIRECTUS_URL=http://directus:8055
PUBLIC_SITE_URL=https://www.umbot.com.ar
DATABASE_URL=postgresql://directus:prod_password@postgres:5432/directus
```

### **Docker Compose Profiles**
```bash
# Desarrollo completo
docker-compose -f docker-compose.dev.yml up -d

# Solo base de datos para desarrollo híbrido
docker-compose -f docker-compose.dev.yml up -d postgres-dev directus-dev

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 **Documentación**

### **Enlaces de Documentación**
- [📄 Documentación Completa](./solucionfinal.md)
- [🏗️ Arquitectura del Sistema](./docs/architecture.md)
- [🚀 Guía de Deploy](./docs/deployment.md)
- [🧪 Testing Guide](./docs/testing.md)
- [🔧 Troubleshooting](./docs/troubleshooting.md)

### **APIs y Tecnologías**
- [Astro Documentation](https://docs.astro.build/)
- [Directus Documentation](https://docs.directus.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 **Soporte**

Para soporte técnico o consultas:
- **Email**: admin@umbot.com.ar
- **Issues**: [GitHub Issues](https://github.com/martinsantos/um25/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/martinsantos/um25/wiki)

---

**Desarrollado con ❤️ por el equipo de ULTiMA MILLA**
# CI/CD Test - Secret Fixed - Sat Feb 14 18:31:11 -03 2026
