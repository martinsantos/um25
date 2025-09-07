# 🚨 UMBot Emergency App v2.0.1

App de emergencia para monitoreo y recuperación de servicios de UMBot.

## 🌟 Características

- **Monitoreo en tiempo real** de todos los servicios
- **Gestión Docker** integrada con reinicio y limpieza
- **Visor de logs** centralizado con pestañas
- **Recuperación de emergencia** automatizada
- **PWA instalable** que funciona offline
- **Interfaz móvil** optimizada
- **API REST** para gestión remota
- **Modo Demo** para pruebas sin conexión

## 🚀 Instalación y Despliegue

### Requisitos
- Docker y Docker Compose
- Node.js 18 o superior (para desarrollo)
- Acceso al socket de Docker

### Método 1: Docker Compose (Recomendado)
```bash
# Clonar repositorio
git clone https://github.com/umbot/emergency-app.git
cd emergency-app

# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Método 2: Node.js (Desarrollo)
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📱 Acceso

### Producción
- Web: https://www.ultimamilla.com.ar:8092
- API: https://www.ultimamilla.com.ar:8092/api

### Desarrollo
- Web: http://localhost:8092
- API: http://localhost:8092/api

## 🔧 Endpoints API

### Estado General
```
GET /api/status
```

### Verificar Servicio
```
GET /api/check/:service
```

### Reiniciar Servicio
```
POST /api/restart/:service
```

### Ejecutar Comando
```
POST /api/execute
Content-Type: application/json
{
    "command": "docker ps"
}
```

## 📦 Servicios Monitoreados

| Servicio | Container | Puerto |
|----------|-----------|--------|
| Directus | umbot-directus | 8055 |
| Nginx | umbot-nginx-static | 80 |
| PostgreSQL | umbot-postgres | 5432 |
| Grafana | umbot-grafana | 3000 |
| Prometheus | umbot-prometheus | 9090 |

## 🔐 Seguridad

- Lista blanca de comandos permitidos
- Validación de entradas
- CORS configurado
- Sin acceso a comandos sensibles
- Logs de acciones

## 🛠️ Desarrollo

### Estructura del Proyecto
```
umbot-emergency-app/
├── index.html          # Frontend
├── server.js           # Backend API
├── package.json        # Dependencias
├── Dockerfile          # Contenedor
└── docker-compose.yml  # Orquestación
```

### Comandos NPM
```bash
npm run dev    # Desarrollo con hot-reload
npm start      # Producción
npm test       # Tests
```

## 📝 Logs y Monitoreo

Los logs se almacenan en:
- Aplicación: `/app/logs`
- Docker: `docker-compose logs emergency-app`

## 🔄 Actualización

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull

# Reconstruir y reiniciar
docker-compose up -d --build
```

## 🐛 Solución de Problemas

1. **Error de conexión**
   - Verificar puerto 8092
   - Comprobar permisos de Docker socket

2. **Comandos no funcionan**
   - Verificar permisos de usuario
   - Comprobar lista de comandos permitidos

3. **Modo Demo activo**
   - Verificar conectividad con el servidor
   - Comprobar configuración de API_ENDPOINT

## 📞 Soporte

- Email: admin@ultimamilla.com.ar
- Sitio: https://ultimamilla.com.ar

---

**Versión**: 2.0.1  
**Última actualización**: Marzo 2024 