# Última Milla Web (UM25)

Proyecto web desarrollado con Astro y Directus CMS, optimizado para rendimiento y escalabilidad.

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
| `make test`     | Ejecuta las pruebas de lint                      |
| `make backup`   | Crea un backup de la base de datos y uploads     |
| `make restore`  | Restaura desde un backup                         |

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
