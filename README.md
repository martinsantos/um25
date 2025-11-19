# 🚀 ULTiMA MILLA - Fumbling Field

[![CI/CD Pipeline](https://github.com/martinsantos/um25/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/martinsantos/um25/actions/workflows/ci-cd.yml)
[![Deployment Status](https://img.shields.io/website?url=https%3A//www.ultimamilla.com.ar)](https://www.ultimamilla.com.ar)
[![Docker Image](https://img.shields.io/docker/v/umbot/fumbling-field?label=docker)](https://hub.docker.com/r/umbot/fumbling-field)

> **Aplicación web moderna para ULTiMA MILLA** - Portal corporativo con Astro, Directus CMS, y pipeline CI/CD automatizado.

## 📸 **HITO: UM CLI 1.0 + CONTACT FORM FIXED - ESTADO ACTUAL**

**🎯 VERSIÓN ESTABLE**: v1.1.0 (2025-09-09 15:24:00Z)  
✅ **ESTADO**: PRODUCCIÓN COMPLETAMENTE FUNCIONAL + FORMULARIO CONTACTO REPARADO

### 🚀 **Logros del HITO UM CLI 1.0**
- ✅ **Terminal Profesional**: UM CLI con 30+ comandos interactivos, ASCII art y efectos avanzados
- ✅ **Navegación Limpia**: Eliminada duplicación de menús, interface limpia
- ✅ **Arquitectura Optimizada**: Componentes organizados sin conflictos
- ✅ **100% Responsive**: Diseño adaptable móvil/tablet/desktop
- ✅ **Performance Optimizado**: Carga rápida y experiencia fluida

### 🎆 **Características UM CLI 1.0**
- **⭐ Terminal Interactivo**: GitHub-style con comandos: `help`, `services`, `about`, `contact`, `matrix`
- **🎨 ASCII Art Animado**: Logo Ultima Milla con efectos de typing
- **⚙️ Funciones Avanzadas**: Historial (↑↓), autocompletado (Tab), cursor parpadeante
- **📱 Mobile-First**: Responsive breakpoints optimizados para todos los dispositivos
- **🔥 Visual Effects**: Gradientes, glow effects, smooth animations

### 📧 **NUEVO: Formulario de Contacto Reparado (v1.1.0)**
- **✅ Correo Funcionando**: Nodemailer configurado correctamente con postfix
- **✅ Seguridad Implementada**: Rate limiting, detección spam, honeypot anti-bots
- **✅ Validaciones Robustas**: Campos requeridos, formato email, sanitización
- **✅ Entrega Verificada**: Logs postfix confirman envío exitoso a martin@ultimamilla.com.ar
- **✅ API Estable**: /api/contact respondiendo HTTP 200 con ~0.4s response time

## 🎉 **Estado Actual: COMPLETAMENTE OPERACIONAL**

✅ **SITIO WEB RESTAURADO EXITOSAMENTE** (Enero 2025)

- **🌍 Sitio Principal**: [ultimamilla.com.ar](https://www.ultimamilla.com.ar) - Diseño corporativo completo ✅
- **🏢 Diseño Corporativo**: Hero, Nosotros, Servicios, Antecedentes, Contacto - Todas las secciones funcionando ✅
- **🖥️ Terminal CLI**: Integrada como plugin en banner central (no reemplaza contenido) ✅
- **⚡ Performance**: SSR dinámico con contenido en tiempo real ✅
- **📊 CMS Directus**: Gestión de contenido operacional ✅
- **🔒 SSL**: Certificados válidos y HTTPS funcionando ✅

### 🛠️ Actualización 2025-11-19
- **Problema**: El sitio intentaba cargar `about.css`, `servicios-ciberseguridad.css` e `index-optimized-1.css`, archivos legacy inexistentes que devolvían 404 y sobrescribían estilos.
- **Solución**: Se eliminaron esas referencias desde `src/layouts/Layout.astro`, dejando únicamente los estilos empaquetados por Astro/Tailwind y `uiEffects.css`.
- **Verificación**:
  - `npm run build` ✅
  - Validación manual: homepage y navegación principal sin errores 404 en consola.

## 🌐 **Enlaces Importantes**

- **🌍 Sitio Web**: [www.ultimamilla.com.ar](https://www.ultimamilla.com.ar)
- **🎛️ Admin Panel**: [www.ultimamilla.com.ar:8055](https://www.ultimamilla.com.ar:8055)
- **📊 GitHub Repository**: [martinsantos/um25](https://github.com/martinsantos/um25)

## 📋 **Tabla de Contenidos**

- [🏗️ Arquitectura](#️-arquitectura)
- [⚡ Quick Start](#-quick-start)
- [🛠️ Desarrollo Local](#️-desarrollo-local)
- [🚀 Pipeline CI/CD](#-pipeline-cicd)
- [📦 Deploy](#-deploy)
- [🧪 Testing](#-testing)
- 📚 [Comandos Ütiles](#-comandos-útiles)
- 🔧 [Configuración](#-configuración)
- 📖 [Documentación](#-documentación)
- 📸 **[HITO UM CLI 1.0 - Punto de Restauración](solucionfinal.md)** (🎯 **Estado Estable**)

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
| **Directus Admin** | http://localhost:8055 | admin@ultimamilla.local / admin123dev |
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
- **Producción**: `https://www.ultimamilla.com.ar`

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
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar
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
- **Email**: admin@ultimamilla.com.ar
- **Issues**: [GitHub Issues](https://github.com/martinsantos/um25/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/martinsantos/um25/wiki)

---

**Desarrollado con ❤️ por el equipo de ULTiMA MILLA**


## 🔥 **IMPLEMENTACIÓN MEGA: UM CLI v4.0 CON DATOS DINÁMICOS**

Se ha completado exitosamente la implementación de la versión MEGA del UM CLI que integra datos dinámicos desde Directus CMS con sistema robusto de cache y fallback.

### **🏗️ Arquitectura de Datos Dinámicos**

```
┌─────────────────┐    fetch    ┌─────────────────┐    SDK    ┌─────────────────┐
│  UM Terminal    │─────────────▶│  API Endpoint   │─────────▶│   Directus CMS  │
│  (Frontend JS)  │             │ /api/umcli.json │           │   (Backend)     │
└─────────────────┘             └─────────────────┘           └─────────────────┘
        │                               │                             │
        ▼                               ▼                             ▼
┌─────────────────┐             ┌─────────────────┐           ┌─────────────────┐
│ Fallback Data   │             │  HTTP Cache     │           │   PostgreSQL    │
│  (Hardcoded)    │             │  60s + SWR     │           │   Database      │
└─────────────────┘             └─────────────────┘           └─────────────────┘
```

### **⚡ Funcionalidades Implementadas**

#### **1. Endpoint API Server-Side** (`/src/pages/api/umcli.json.ts`):
- ✅ Consume datos de Directus vía SDK oficial en el servidor
- ✅ Maneja autenticación y filtros de contenido publicado
- ✅ Sistema de cache HTTP optimizado (`max-age=60s`, `stale-while-revalidate=300s`)
- ✅ Fallback automático en caso de error de conexión a Directus
- ✅ Payload consolidado: servicios, casos de éxito, blog posts + estadísticas

#### **2. Integración del Cliente** (`/public/UMTerminalEngine.js`):
- ✅ Carga asincrónica no bloqueante desde `/api/umcli.json`
- ✅ Inicialización que permite funcionamiento offline
- ✅ Sistema de namespace `window.UMTerminal` para evitar colisiones
- ✅ Actualización automática de comandos con datos reales

### **🚀 Estado de Deployment**

| Componente | Estado | URL | Funcionalidad |
|------------|--------|-----|---------------|
| **UM CLI Terminal** | ✅ Operativo | [www.ultimamilla.com.ar](https://www.ultimamilla.com.ar) | Terminal interactivo con 49+ comandos |
| **API Endpoint** | ✅ Funcional | `/api/umcli.json` | Datos dinámicos con cache |
| **Directus CMS** | ✅ Conectado | `:8055/admin` | Gestión de contenidos |
| **Sistema de Cache** | ✅ Optimizado | HTTP + Browser | Performance mejorada |
| **Fallback System** | ✅ Probado | Hardcoded data | Funciona offline |

### **🔧 Comandos MEGA Destacados**

```bash
# CONTENIDO DINÁMICO
ls servicios          # Lista servicios con datos de Directus
antecedentes          # Casos de éxito desde CMS
blog                  # Últimas publicaciones
directus             # Estado de integración CMS
reload               # Recargar datos dinámicos

# ANÁLISIS Y ESTADÍSTICAS
stats --all          # Estadísticas completas empresa
top --clientes       # Ranking de clientes principales
benchmark redes      # Comparativas técnicas

# DIVERSIÓN Y EASTER EGGS
fortune             # Frases motivacionales
cowsay "ULTIMA MILLA"  # Arte ASCII
sudo ultimamilla.py # Comando maestro
```

---

**🚀 UM CLI MEGA v4.0** - *"Conectando el futuro con tecnología de vanguardia"*

