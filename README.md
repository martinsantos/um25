# Última Milla Web (UM25)

Proyecto web desarrollado con Astro y Directus CMS, optimizado para rendimiento y escalabilidad. Incluye un conjunto completo de pruebas automatizadas y flujos de CI/CD para garantizar la calidad del código.

[![Tests](https://github.com/martinsantos/um25/actions/workflows/ci.yml/badge.svg)](https://github.com/martinsantos/um25/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/martinsantos/um25/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/martinsantos/um25)

## 🚀 Arquitectura

El proyecto está compuesto por:

- **Frontend**: Aplicación Astro con SSR
- **CMS**: Directus para gestión de contenidos
- **Base de datos**: PostgreSQL para almacenamiento persistente

Todo el stack se ejecuta en contenedores Docker para facilitar el desarrollo y despliegue.

## 📋 Requisitos

- Docker y Docker Compose
- Node.js 18 o superior
- Git

## 🛠️ Desarrollo Local

### Configuración Inicial

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/martinsantos/um25.git
   cd um25
   ```

2. Copiar el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Iniciar el entorno de desarrollo:
   ```bash
   make setup
   make dev
   ```

4. Acceder a las aplicaciones:
   - Frontend Astro: http://localhost:4321
   - Directus CMS: http://localhost:8055

### Comandos Útiles

| Comando         | Descripción                                      |
|-----------------|--------------------------------------------------|
| `make dev`      | Inicia el entorno de desarrollo                  |
| `make build`    | Construye la aplicación para producción          |
| `make test`     | Ejecuta las pruebas unitarias y de integración  |
| `make test:watch` | Ejecuta las pruebas en modo observación        |
| `make test:coverage` | Ejecuta las pruebas con informe de cobertura |
| `make test:ui`  | Ejecuta la interfaz de usuario de pruebas      |
| `make backup`   | Crea un backup de la base de datos y uploads     |
| `make restore`  | Restaura desde un backup                         |

## 🧪 Pruebas

El proyecto incluye un conjunto completo de pruebas automatizadas para garantizar la calidad del código:

### Tipos de Pruebas

- **Pruebas Unitarias**: Pruebas de funciones individuales y componentes aislados.
- **Pruebas de Integración**: Pruebas que verifican la interacción entre componentes y servicios.
- **Pruebas de Componentes**: Pruebas de componentes de interfaz de usuario.
- **Pruebas de API**: Pruebas de los endpoints de la API.

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo observación
npm run test:watch

# Generar informe de cobertura
npm run test:coverage

# Ejecutar interfaz de usuario de pruebas (útil para depuración)
npm run test:ui
```

### Estructura de Pruebas

```
src/
  __tests__/          # Pruebas unitarias
  __mocks__/          # Mocks para pruebas
  components/
    __tests__/      # Pruebas de componentes
  pages/
    __tests__/      # Pruebas de páginas
  utils/
    __tests__/      # Pruebas de utilidades
```

### Configuración de Pruebas

Las pruebas utilizan:
- **Vitest**: Ejecutor de pruebas rápido y compatible con Vite.
- **Testing Library**: Para pruebas de componentes centradas en el usuario.
- **MSW (Mock Service Worker)**: Para simular peticiones HTTP.
- **jsdom**: Para simular el entorno del navegador.

## 🚢 Despliegue en Producción

### Preparación

1. Configurar variables de entorno para producción:
   ```bash
   cp .env.example .env.prod
   # Editar .env.prod con valores de producción
   ```

2. Construir imágenes para producción:
   ```bash
   make prod-build
   ```

3. Subir imágenes a Docker Hub (opcional):
   ```bash
   docker login
   make docker-push
   ```

### Despliegue en Servidor

1. Copiar archivos de configuración al servidor:
   ```bash
   scp docker-compose.production.yml .env.prod root@23.105.176.45:/root/um25/
   ```

2. Conectarse al servidor e iniciar servicios:
   ```bash
   ssh root@23.105.176.45
   cd /root/um25
   docker-compose -f docker-compose.production.yml up -d
   ```

## 🔄 CI/CD

El proyecto utiliza GitHub Actions para la integración y despliegue continuos. El flujo de trabajo está configurado en `.github/workflows/ci.yml`.

### Flujo de Trabajo de CI/CD

1. **Pruebas Automatizadas**:
   - Se ejecutan en cada push a las ramas `main` y `dev`
   - Incluyen pruebas unitarias, de integración y de componentes
   - Generan informes de cobertura de código

2. **Despliegue Automático**:
   - Los cambios en `main` se despliegan automáticamente a producción
   - Los cambios en `dev` se despliegan a un entorno de staging

3. **Requisitos de Código**:
   - Todas las pruebas deben pasar
   - La cobertura de código debe ser al menos del 80%
   - El código debe pasar las validaciones de ESLint y Prettier

### Configuración de Secretos

Los siguientes secretos deben configurarse en GitHub Secrets:

- `DOCKERHUB_USERNAME`: Nombre de usuario de Docker Hub
- `DOCKERHUB_TOKEN`: Token de acceso a Docker Hub
- `SSH_PRIVATE_KEY`: Clave SSH para despliegue en el servidor
- `CODECOV_TOKEN`: Token para subir informes de cobertura a Codecov

## 🔄 Mantenimiento

### Backups

Para crear un backup completo:
```bash
make backup
```

Para restaurar desde un backup:
```bash
make restore DB_BACKUP=./backups/db_backup_20250507.sql UPLOADS_BACKUP=./backups/uploads_backup_20250507.tar.gz
```

## 📚 Estructura del Proyecto

```
├── src/               # Código fuente de Astro
├── public/            # Archivos estáticos
├── scripts/           # Scripts de utilidad
├── backups/           # Directorio para backups
├── docker-compose.yml # Configuración para desarrollo
└── docker-compose.production.yml # Configuración para producción
```

## 🤝 Contribución

1. Crear una rama para nuevas características: `git checkout -b feature/nombre-caracteristica`
2. Hacer commit de los cambios: `git commit -m 'feat: añadir nueva característica'`
3. Enviar la rama: `git push origin feature/nombre-caracteristica`
4. Crear un Pull Request
