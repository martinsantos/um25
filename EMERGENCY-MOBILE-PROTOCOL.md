# 📱 **PROTOCOLO DE EMERGENCIA MÓVIL - ANDROID**
## **UMBot - Fumbling Field Emergency Response**

---

## 🚨 **EVALUACIÓN INICIAL DESDE MÓVIL**

### **PASO 1: Verificación rápida del estado**

#### **🔍 Apps requeridas (instalar si no están disponibles):**
- **Termux** - Terminal para Android
- **JuiceSSH** - Cliente SSH robusto
- **ConnectBot** - SSH alternativo
- **Chrome/Firefox** - Para verificación web

#### **📋 Checklist de verificación inmediata:**
```bash
# URLs a verificar desde el navegador móvil:
✅ https://umbot.com.ar/
✅ https://umbot.com.ar/admin/
✅ https://23.105.176.45/ (IP directa)

# Estados esperados:
- HTTP 200 OK = ✅ Funcionando
- Connection timeout = ❌ Servidor caído
- 502/503 Error = ⚠️ Servicios internos caídos
```

---

## 🛠️ **MÉTODOS DE RECUPERACIÓN MÓVIL**

### **MÉTODO 1: SSH via JuiceSSH (RECOMENDADO)**

#### **📱 Configuración inicial:**
1. **Instalar JuiceSSH** desde Google Play Store
2. **Crear nueva conexión:**
   - **Host**: `23.105.176.45`
   - **Username**: `root`
   - **Password**: `gsiB%s@0yD`
   - **Port**: `22`

#### **🔧 Comandos de emergencia móvil:**
```bash
# SECUENCIA DE RECUPERACIÓN RÁPIDA
cd /root/fumbling-field

# 1. Verificar estado
docker ps
docker-compose ps

# 2. Recuperación automática
docker-compose down && docker-compose up -d

# 3. Verificación final
curl -I http://localhost/
```

### **MÉTODO 2: Termux (Terminal nativo Android)**

#### **📱 Instalación y configuración:**
```bash
# 1. Instalar Termux desde F-Droid o Google Play
# 2. Actualizar paquetes
pkg update && pkg upgrade

# 3. Instalar SSH
pkg install openssh

# 4. Conectar al servidor
ssh root@23.105.176.45
```

#### **🚀 Script de recuperación móvil:**
```bash
#!/data/data/com.termux/files/usr/bin/bash

# Mobile Emergency Recovery Script
echo "🚨 EMERGENCY RECOVERY FROM MOBILE"
echo "=================================="

# Conectar y ejecutar recuperación
ssh root@23.105.176.45 << 'EOF'
cd /root/fumbling-field
echo "📊 Current status:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo "🔄 Restarting services..."
docker-compose down
sleep 5
docker-compose up -d

echo "⏳ Waiting for services..."
sleep 30

echo "✅ Final status:"
docker ps --format "table {{.Names}}\t{{.Status}}"
curl -I http://localhost/

echo "🎉 Recovery completed from mobile device"
EOF
```

### **MÉTODO 3: App SSH específica (ConnectBot)**

#### **📱 Configuración ConnectBot:**
1. **Host**: `root@23.105.176.45:22`
2. **Nickname**: `UMBot-Emergency`
3. **Use pubkey authentication**: No
4. **Password**: `gsiB%s@0yD`

---

## 📋 **SCRIPT DE DIAGNÓSTICO MÓVIL**

### **🔍 Diagnóstico completo desde Android:**

```bash
#!/bin/bash
# Mobile Diagnostic Script for UMBot

echo "📱 DIAGNÓSTICO MÓVIL - UMBot Emergency"
echo "====================================="
echo "Fecha: $(date)"
echo "Dispositivo: Android Mobile"
echo ""

# Test de conectividad
echo "🌐 CONECTIVIDAD:"
ping -c 3 8.8.8.8 > /dev/null && echo "✅ Internet OK" || echo "❌ Sin internet"
ping -c 3 23.105.176.45 > /dev/null && echo "✅ Servidor accesible" || echo "❌ Servidor inaccesible"

# Test de servicios web
echo ""
echo "🔍 SERVICIOS WEB:"
curl -I --connect-timeout 10 https://umbot.com.ar/ 2>/dev/null | head -1 || echo "❌ HTTPS no responde"
curl -I --connect-timeout 10 http://umbot.com.ar/ 2>/dev/null | head -1 || echo "❌ HTTP no responde"

# SSH Test
echo ""
echo "🔐 SSH ACCESS:"
ssh -o ConnectTimeout=10 -o BatchMode=yes root@23.105.176.45 'echo "✅ SSH OK"' 2>/dev/null || echo "❌ SSH no accesible"

echo ""
echo "📊 DIAGNÓSTICO COMPLETADO"
```

---

## 🚀 **AUTOMATIZACIÓN MÓVIL AVANZADA**

### **📱 App personalizada (Tasker + SSH):**

#### **Configuración Tasker:**
```javascript
// Tasker Profile: UMBot Emergency
// Trigger: Widget tap or emergency keyword

// Task: Emergency Recovery
A1: HTTP Get [
    Server:Port: https://umbot.com.ar
    Timeout: 10
]

A2: If [ %HTTPD !~ 200 ]
    A3: SSH Command [
        Host: 23.105.176.45
        User: root
        Password: gsiB%s@0yD
        Command: cd /root/fumbling-field && docker-compose restart
    ]
    A4: Wait [ 30 seconds ]
    A5: HTTP Get [ https://umbot.com.ar ]
    A6: Flash [ "Recovery completed: %HTTPD" ]
A7: End If
```

### **📲 Notificaciones automáticas:**
```bash
# Script para enviar notificaciones móviles
send_mobile_notification() {
    local status=$1
    local message=$2
    
    # Usar webhook de Telegram/WhatsApp/Slack
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="🚨 UMBot Emergency: $status - $message"
}

# Ejemplos de uso:
send_mobile_notification "RECOVERED" "Services restored successfully"
send_mobile_notification "CRITICAL" "Server unresponsive - manual intervention required"
```

---

## 🛡️ **MONITOREO PREVENTIVO MÓVIL**

### **📊 Dashboard móvil simple:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>UMBot Mobile Dashboard</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #1a1a1a; color: white; }
        .status { padding: 15px; margin: 10px 0; border-radius: 8px; }
        .ok { background: #2d5a2d; }
        .error { background: #5a2d2d; }
        .warning { background: #5a5a2d; }
        button { width: 100%; padding: 15px; font-size: 18px; margin: 10px 0; }
        .emergency { background: #d32f2f; color: white; }
    </style>
</head>
<body>
    <h1>🚨 UMBot Emergency Dashboard</h1>
    
    <div id="status-web" class="status">
        <h3>🌐 Web Status</h3>
        <p id="web-result">Checking...</p>
    </div>
    
    <div id="status-server" class="status">
        <h3>🖥️ Server Status</h3>
        <p id="server-result">Checking...</p>
    </div>
    
    <button class="emergency" onclick="emergencyRecover()">
        🚨 EMERGENCY RECOVERY
    </button>
    
    <button onclick="runDiagnostic()">
        🔍 Run Diagnostic
    </button>
    
    <script>
        async function checkStatus() {
            try {
                const response = await fetch('https://umbot.com.ar/');
                document.getElementById('web-result').textContent = `✅ OK (${response.status})`;
                document.getElementById('status-web').className = 'status ok';
            } catch (error) {
                document.getElementById('web-result').textContent = `❌ Error: ${error.message}`;
                document.getElementById('status-web').className = 'status error';
            }
        }
        
        function emergencyRecover() {
            if (confirm('¿Ejecutar recuperación de emergencia?')) {
                alert('🚨 Ejecutando recuperación...\n\nConéctate vía SSH:\nssh root@23.105.176.45\n\nEjecuta:\ncd /root/fumbling-field && docker-compose restart');
            }
        }
        
        function runDiagnostic() {
            checkStatus();
        }
        
        // Auto-check every 30 seconds
        setInterval(checkStatus, 30000);
        checkStatus();
    </script>
</body>
</html>
```

---

## 📞 **CONTACTOS DE EMERGENCIA**

### **🆘 Escalation Matrix:**
```
NIVEL 1 - Autorecuperación (0-5 min):
├── SSH directo desde móvil
├── Restart de contenedores
└── Verificación automática

NIVEL 2 - Soporte técnico (5-15 min):
├── Contactar administrador del servidor
├── Verificar logs detallados
└── Análisis de causa raíz

NIVEL 3 - Proveedor de hosting (15+ min):
├── Contactar soporte de hosting
├── Verificar estado del datacenter
└── Escalation a infraestructura
```

---

## 🔧 **HERRAMIENTAS MÓVILES ESENCIALES**

### **📱 Apps obligatorias para emergencias:**
1. **JuiceSSH** - SSH principal
2. **Termux** - Terminal completo
3. **Ping Tools** - Diagnóstico de red
4. **HTTP Request Shortcuts** - Tests rápidos
5. **Tasker** - Automatización
6. **Telegram/WhatsApp** - Notificaciones

### **⚡ Widgets de acceso rápido:**
- **Emergency Recovery** - Un tap para recuperación
- **Status Check** - Verificación rápida de estado
- **SSH Direct** - Conexión SSH inmediata

---

## 📊 **MÉTRICAS DE EMERGENCIA MÓVIL**

### **🎯 Objetivos de tiempo de respuesta:**
- **Detección**: < 2 minutos
- **Diagnóstico**: < 3 minutos  
- **Recuperación**: < 5 minutos
- **Verificación**: < 1 minuto
- **Total**: < 11 minutos desde móvil

### **✅ Checklist post-recuperación:**
- [ ] Sitio web respondiendo (HTTP 200)
- [ ] Admin Directus accesible
- [ ] Base de datos funcionando
- [ ] Contenedores estables
- [ ] Logs sin errores críticos
- [ ] Notificación de recuperación enviada

---

## 🎯 **CONCLUSIÓN**

**✅ SÍ ES COMPLETAMENTE VIABLE GESTIONAR EMERGENCIAS DESDE ANDROID**

### **Ventajas del enfoque móvil:**
- ✅ **Disponibilidad 24/7** - Siempre llevas el móvil
- ✅ **Respuesta rápida** - No necesitas computadora
- ✅ **Múltiples métodos** - SSH, web, apps especializadas
- ✅ **Automatización** - Scripts y widgets personalizados
- ✅ **Notificaciones** - Alertas automáticas

### **Limitaciones a considerar:**
- ⚠️ **Pantalla pequeña** - Comandos complejos más difíciles
- ⚠️ **Teclado virtual** - Typing más lento
- ⚠️ **Conectividad** - Dependiente de red móvil/WiFi
- ⚠️ **Batería** - Operaciones prolongadas pueden agotar batería

**RECOMENDACIÓN**: Implementar el protocolo móvil como **respuesta primaria** para emergencias, con escalation a desktop para análisis complejos. 