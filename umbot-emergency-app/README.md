# 🚨 UMBot Emergency App

App de emergencia para monitoreo y recuperación de servicios de UMBot.

## 🌟 Características

- **Monitoreo en tiempo real** de todos los servicios
- **Gestión Docker** integrada con reinicio y limpieza
- **Visor de logs** centralizado con pestañas
- **Recuperación de emergencia** automatizada
- **PWA instalable** que funciona offline
- **Interfaz móvil** optimizada

## 📱 Instalación en Móvil

### Android
1. Abre https://emergency.umbot.com.ar en Chrome
2. Toca el menú (3 puntos) → "Añadir a pantalla de inicio"
3. O espera el banner automático de instalación

### iOS
1. Abre https://emergency.umbot.com.ar en Safari
2. Toca el botón compartir → "Añadir a pantalla de inicio"

## 🚀 Acceso Local

```bash
cd umbot-emergency-app
python3 -m http.server 8001
```

Luego abre: http://localhost:8001

## 🛠️ Funcionalidades

### Estado del Sitio
- Verificación automática cada 30 segundos
- Indicador visual del estado (✅/❌)
- Mensajes de error detallados

### Servicios Monitoreados
- **Directus** (Puerto 8055) - CMS y Admin
- **Nginx** (Puerto 80) - Servidor web
- **PostgreSQL** (Puerto 5432) - Base de datos
- **Prometheus** (Puerto 9090) - Métricas
- **Grafana** (Puerto 3000) - Dashboards

### Acciones Disponibles
1. **🚨 Recuperación de Emergencia**
   - Reinicia todos los servicios
   - Limpia cache Docker
   - Verifica estado post-reinicio

2. **🔍 Diagnóstico Completo**
   - Verifica conectividad
   - Chequea health de servicios
   - Actualiza estado visual

3. **👤 Acceder a Directus**
   - Acceso directo al panel admin
   - Credenciales pre-configuradas

4. **🐳 Gestión Docker**
   - Ver estado de contenedores
   - Reiniciar servicios
   - Limpiar cache

5. **📋 Ver Logs**
   - Logs por servicio
   - Filtrado por nivel
   - Actualización en tiempo real

6. **🔐 Conectar SSH**
   - Acceso directo al servidor
   - Para comandos avanzados

## 🔧 Configuración

### Endpoints
```javascript
WEBSITE_URL: 'https://umbot.com.ar'
SERVER_IP: '23.105.176.45'
DIRECTUS_URL: 'https://umbot.com.ar/directus-admin'
```

### Credenciales Directus
```javascript
email: 'admin@example.com'
password: 'd1r3ctu5'
```

## 📦 Despliegue en Producción

1. **Subir archivos al servidor:**
```bash
scp -r umbot-emergency-app root@23.105.176.45:/root/
scp deploy-emergency-app.sh root@23.105.176.45:/root/
```

2. **Ejecutar en el servidor:**
```bash
ssh root@23.105.176.45
cd /root
chmod +x deploy-emergency-app.sh
./deploy-emergency-app.sh
```

3. **Verificar:**
- https://emergency.umbot.com.ar
- SSL configurado automáticamente
- PWA instalable

## 🔒 Seguridad

- Headers de seguridad configurados
- CORS habilitado para API Docker
- SSL/TLS con Let's Encrypt
- Permisos restrictivos

## 📱 Uso Offline

La app funciona sin conexión gracias al Service Worker:
- Interfaz completa disponible
- Último estado conocido visible
- Reconexión automática cuando vuelve internet

## 🐞 Troubleshooting

### La app no se instala
- Verifica que uses HTTPS
- Limpia cache del navegador
- Usa Chrome/Safari actualizado

### Los servicios no responden
- Verifica conectividad de red
- Revisa configuración CORS
- Chequea firewall del servidor

### Los logs no cargan
- Verifica permisos Docker
- Revisa API Docker habilitada
- Chequea logs de Nginx

## 📄 Archivos del Proyecto

```
umbot-emergency-app/
├── index.html          # App principal
├── service-worker.js   # Soporte offline
├── manifest.json       # Configuración PWA
├── icon.svg           # Icono base
├── generate-icons.sh  # Script para generar iconos
└── README.md          # Este archivo
```

## 🎯 Próximas Mejoras

- [ ] Notificaciones push para alertas
- [ ] Gráficos de métricas en tiempo real
- [ ] Backup automático antes de recuperación
- [ ] Integración con Slack/Discord
- [ ] Modo oscuro/claro automático

## 📞 Soporte

Para problemas o sugerencias:
- Email: admin@umbot.com.ar
- Sitio: https://umbot.com.ar

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2025 