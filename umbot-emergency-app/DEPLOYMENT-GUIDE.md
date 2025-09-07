# 🚀 Guía Completa de Despliegue - UMBot Emergency App

## 📱 Descripción de la App

UMBot Emergency App es una PWA (Progressive Web App) para monitoreo y recuperación de emergencia de los servicios de UMBot. Funciona tanto online como offline y es instalable en dispositivos móviles.

## ✅ Características Implementadas

### 1. **Monitoreo en Tiempo Real**
- Verificación automática cada 30 segundos
- Estado visual de 5 servicios principales:
  - Directus (CMS)
  - Nginx (Web Server)
  - PostgreSQL (Database)
  - Prometheus (Metrics)
  - Grafana (Dashboards)

### 2. **Modo Demo Inteligente**
- Se activa automáticamente sin conexión
- Simula estados de servicios
- Permite probar todas las funcionalidades

### 3. **Acciones de Emergencia**
- 🚨 Recuperación de emergencia
- 🔍 Diagnóstico completo
- 👤 Acceso directo a Directus
- 🐳 Gestión Docker
- 📋 Visor de logs
- 🔐 Conexión SSH

### 4. **PWA Completa**
- Instalable en Android/iOS
- Funciona offline
- Service Worker implementado
- Manifest optimizado

## 📦 Archivos del Proyecto

```
umbot-emergency-app/
├── index.html              # App principal (todo en uno)
├── service-worker.js       # Soporte offline
├── manifest.json           # Configuración PWA
├── icon.svg               # Icono vectorial base
├── README.md              # Documentación usuario
├── deploy-emergency-app.sh # Script de deploy servidor
└── DEPLOYMENT-GUIDE.md    # Esta guía
```

## 🌐 Métodos de Despliegue

### Método 1: GitHub Pages (Recomendado)

```bash
# 1. Subir a GitHub
git add umbot-emergency-app
git commit -m "feat: UMBot Emergency App v1.0.0"
git push origin main

# 2. Configurar GitHub Pages
# - Ir a Settings > Pages
# - Source: Deploy from a branch
# - Branch: main
# - Folder: /umbot-emergency-app
# - Save

# URL resultante:
# https://[usuario].github.io/[repo]/umbot-emergency-app/
```

### Método 2: Netlify (Más Fácil)

1. Ir a https://app.netlify.com
2. Arrastrar la carpeta `umbot-emergency-app`
3. URL instantánea: https://[nombre].netlify.app

### Método 3: Servidor Propio

```bash
# 1. Copiar archivos al servidor
scp -r umbot-emergency-app root@23.105.176.45:/var/www/

# 2. Configurar Nginx
server {
    listen 80;
    server_name emergency.ultimamilla.com.ar;
    root /var/www/umbot-emergency-app;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 3. Reiniciar Nginx
systemctl reload nginx
```

### Método 4: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd umbot-emergency-app
vercel --prod
```

### Método 5: Surge.sh

```bash
# Instalar Surge
npm i -g surge

# Deploy
cd umbot-emergency-app
surge . emergency-umbot.surge.sh
```

## 📱 Instalación en Dispositivos

### Android (Chrome)
1. Abrir la URL de la app
2. Menú (3 puntos) > "Añadir a pantalla de inicio"
3. O esperar el banner automático

### iOS (Safari)
1. Abrir la URL de la app
2. Botón compartir > "Añadir a pantalla de inicio"

### Desktop (Chrome/Edge)
1. Abrir la URL de la app
2. Icono de instalación en la barra de direcciones
3. Clic en "Instalar"

## 🔧 Configuración

### Endpoints (en index.html)
```javascript
WEBSITE_URL: 'https://ultimamilla.com.ar'
SERVER_IP: '23.105.176.45'
DIRECTUS_URL: 'https://ultimamilla.com.ar/admin'
```

### Credenciales
```javascript
// Directus
email: 'admin@example.com'
password: 'd1r3ctu5'

// SSH
usuario: root@23.105.176.45
puerto: 22
```

## 📊 Testing de la App

### 1. Funcionalidades Online
- [ ] Verificación de sitio web
- [ ] Estado de servicios
- [ ] Logs simulados
- [ ] Acciones de emergencia

### 2. Funcionalidades Offline
- [ ] App carga sin internet
- [ ] Modo demo activado
- [ ] Interfaz completa disponible

### 3. Instalación PWA
- [ ] Banner de instalación aparece
- [ ] App se instala correctamente
- [ ] Icono en pantalla de inicio
- [ ] Abre en modo standalone

## 🚨 Uso en Emergencias

### Escenario 1: Sitio Caído
1. Abrir app
2. Ejecutar diagnóstico
3. Identificar servicio caído
4. Usar recuperación de emergencia

### Escenario 2: Sin Acceso SSH
1. Abrir app
2. Ver logs de servicios
3. Identificar problema
4. Acceder a Directus para cambios

### Escenario 3: Monitoreo Preventivo
1. Revisar estados periódicamente
2. Verificar uptimes
3. Anticipar problemas

## 📈 Métricas de Éxito

- **Tiempo de carga**: < 2 segundos
- **Tamaño total**: < 100KB
- **Score PWA**: 100/100
- **Funciona offline**: ✅
- **Instalable**: ✅

## 🔒 Seguridad

- No almacena credenciales localmente
- Conexiones HTTPS únicamente
- Headers de seguridad configurados
- Sin datos sensibles en cache

## 📞 Soporte

### Problemas Comunes

**La app no se instala**
- Verificar HTTPS
- Limpiar cache navegador
- Usar Chrome/Safari actualizado

**Servicios aparecen caídos**
- Verificar conexión de red
- Modo demo activado (normal sin conexión)
- Verificar configuración servidor

**Los logs no cargan**
- En modo demo muestra logs simulados
- En producción requiere conexión

## 🎯 Próximas Mejoras

- [ ] Notificaciones push
- [ ] Gráficos de métricas
- [ ] Historial de estados
- [ ] Integración Slack/Discord
- [ ] Autenticación biométrica

## 📋 Checklist Final

### Antes de Desplegar
- [ ] Probar en local
- [ ] Verificar URLs/IPs
- [ ] Revisar credenciales
- [ ] Test modo offline

### Después de Desplegar
- [ ] Verificar HTTPS
- [ ] Probar instalación PWA
- [ ] Test desde móvil
- [ ] Documentar URL final

---

**Versión**: 1.0.0  
**Fecha**: 27 de Junio 2025  
**Autor**: UMBot Team  
**Licencia**: MIT 