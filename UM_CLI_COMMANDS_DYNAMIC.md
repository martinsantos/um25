# 🖥️ UM CLI - COMANDOS CON DATOS DINÁMICOS

## 📅 **POST-RESTAURACIÓN DIRECTUS** - Septiembre 2025
## 🎯 **Estado**: Datos reales desde Directus CMS (sin fallback)

---

## 📊 COMANDOS PRINCIPALES CON DATOS DINÁMICOS

### **🏢 Comandos de Servicios**
```bash
# Lista todos los servicios disponibles  
ls servicios
# Salida esperada: Datos reales desde colección "Servicios"
# - "Desarrollo web y software a medida"
# - "Cableado estructurado y redes" 
# - "Sistemas de videovigilancia CCTV"

# Buscar servicios específicos
grep "desarrollo"
# Salida: Servicios que contengan "desarrollo" en título/descripción

# Ver detalles de servicios
cat servicios/desarrollo
# Salida: Información completa del servicio desde Directus
```

### **📋 Comandos de Antecedentes/Proyectos**
```bash  
# Lista casos de éxito y antecedentes
ls antecedentes
# Salida esperada: Datos reales desde colección "Antecedentes"

# Buscar proyectos por cliente
grep "Gobierno"
# Salida: Proyectos relacionados con gobierno

# Buscar por tecnología
grep "CCTV"
# Salida: Proyectos de videovigilancia
```

### **📊 Comandos de Estadísticas**
```bash
# Estadísticas generales actualizadas
stats --all
# Salida esperada:
# - Total Servicios: [número real desde Directus]
# - Total Antecedentes: [número real desde Directus]  
# - Última actualización: [timestamp dinámico]
# - Modo: "directus" (no "fallback")

# Top servicios más populares
top --servicios
# Salida: Ranking basado en datos reales

# Distribución de clientes
df --clientes
# Salida: Análisis de tipos de cliente desde datos reales
```

### **🔍 Comandos de Búsqueda Avanzada**
```bash
# Búsqueda semántica
search "redes"
# Salida: Resultados de servicios y antecedentes con "redes"

# Localizar contenido específico  
locate "Mendoza"
# Salida: Proyectos y servicios en Mendoza

# Filtros por fecha
find --year 2024
# Salida: Proyectos del 2024 desde datos reales
```

---

## 🔄 DIFERENCIAS PRE vs POST RESTAURACIÓN

### **❌ ANTES (Con Fallback)**
```json
{
  "success": false,
  "data": {
    "servicios": [
      {"id": "1", "titulo": "Servicios IT (fallback)"}
    ],
    "estadisticas": {
      "modo": "fallback",
      "totalServicios": 3,
      "note": "Datos estáticos de respaldo"
    }
  }
}
```

### **✅ DESPUÉS (Sin Fallback)**  
```json
{
  "success": true,
  "data": {
    "servicios": [
      {
        "id": 1, 
        "titulo": "Desarrollo web y software a medida",
        "descripcion": "Desarrollo web. Servicios web. Desarrollo..."
      }
    ],
    "estadisticas": {
      "modo": "directus",
      "totalServicios": 6,
      "totalAntecedentes": 15,
      "ultimaActualizacion": "2025-09-10T14:50:00.000Z"
    }
  }
}
```

---

## 🧪 COMANDOS DE VERIFICACIÓN

### **Verificar Modo de Operación**
```bash
# Comando especial para verificar fuente de datos
sudo ultimamilla.py --status
# Salida esperada:
# ✅ Directus: Conectado
# ✅ Modo: Datos reales (no fallback)
# ✅ API Response: < 200ms
# ✅ Colecciones: Servicios (6), Antecedentes (15)
```

### **Debug de Conectividad**
```bash
# Ver información de conexión
debug --directus
# Salida esperada:
# - URL: http://directus-app:8055
# - Auth: Público (sin token)
# - Status: HTTP 200 OK
# - Collections: Servicios, Antecedentes disponibles

# Estadísticas de performance
benchmark --api
# Salida esperada:
# - Tiempo de respuesta: < 200ms
# - Datos obtenidos: [cantidad real]
# - Cache hit/miss: [métricas]
```

---

## 🎯 COMANDOS ESPECIALIZADOS MEJORADOS

### **Análisis de Datos Empresariales**
```bash
# Análisis por sector
stats --sector publico
# Salida: Proyectos del sector público desde datos reales

# Timeline de proyectos  
timeline --cliente "Gobierno de Mendoza"
# Salida: Historial cronológico de proyectos

# Análisis de tecnologías
tech --stack
# Salida: Tecnologías utilizadas por proyecto
```

### **Generación de Reportes**
```bash
# Reporte completo
report --full
# Salida: PDF/HTML con datos reales actualizados

# Reporte por cliente
report --cliente "AFIP"
# Salida: Todos los proyectos para cliente específico

# Métricas de crecimiento
report --growth --year 2024
# Salida: Análisis de crecimiento con datos reales
```

---

## ⚡ NUEVAS FUNCIONALIDADES POST-RESTAURACIÓN

### **🔥 Comandos en Tiempo Real**
```bash
# Actualización automática
watch stats
# Salida: Estadísticas que se actualizan cada 5 segundos

# Monitoreo de cambios
monitor --collection servicios  
# Salida: Notificación cuando se agregan nuevos servicios

# Live data feed
tail --directus --follow
# Salida: Stream de cambios en tiempo real desde CMS
```

### **📊 Dashboard Interactivo**
```bash
# Dashboard completo
dashboard --live
# Salida: Vista interactiva con gráficos actualizados

# Métricas en tiempo real
metrics --realtime
# Salida: KPIs actualizados desde Directus

# Alertas configurables  
alert --config new_project
# Salida: Notificación cuando se agrega nuevo proyecto
```

---

## 🔧 COMANDOS DE ADMINISTRACIÓN

### **Gestión de Cache**
```bash
# Limpiar cache para forzar datos frescos
cache --clear
# Salida: Cache limpiado, próximas consultas serán frescas

# Estado del cache
cache --status
# Salida: Hit ratio, tamaño, tiempo de vida

# Warm cache con datos populares
cache --warmup
# Salida: Cache pre-poblado con servicios y antecedentes
```

### **Configuración Dinámica**
```bash  
# Ver configuración actual
config --show
# Salida: URL Directus, timeout, límites, etc.

# Test de conectividad
config --test-connection
# Salida: Verificación completa de conectividad Directus

# Estadísticas de uso
config --usage-stats
# Salida: Comandos más utilizados, performance histórico
```

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-RESTAURACIÓN

### **✅ Datos Dinámicos Funcionando**
- [ ] `stats --all` muestra totales reales (no 3 servicios fijos)
- [ ] `ls servicios` lista servicios desde Directus 
- [ ] `grep "desarrollo"` encuentra servicios reales
- [ ] JSON response no contiene `"modo": "fallback"`
- [ ] Timestamps son dinámicos (no fecha fija)
- [ ] Totales cambian al agregar datos en Directus admin

### **✅ Performance Optimizada**
- [ ] Respuesta API < 200ms (vs 50ms fallback)
- [ ] Sin errores 401/403 en logs
- [ ] Datos se actualizan sin reiniciar servidor
- [ ] Cache funciona correctamente
- [ ] Conexión estable con Directus

### **✅ Funcionalidades Avanzadas**
- [ ] Búsquedas devuelven resultados relevantes
- [ ] Filtros funcionan con datos reales
- [ ] Comandos especializados (sector, tech, etc.)
- [ ] Reportes generan contenido actualizado
- [ ] Dashboard muestra métricas reales

---

## 🚀 PRÓXIMAS FUNCIONALIDADES PLANIFICADAS

### **Fase 1 (Inmediata)**
- Comandos de exportación de datos
- Integración con API externa para clientes
- Notificaciones push para nuevos proyectos

### **Fase 2 (1-2 meses)**
- Machine learning para recomendaciones
- Análisis predictivo de tendencias
- Integración con CRM/ERP empresarial

### **Fase 3 (3-6 meses)**  
- IA conversacional para consultas complejas
- Automatización de reportes periódicos
- Dashboard ejecutivo en tiempo real

---

**📅 Documento actualizado**: Post-restauración Directus Septiembre 2025  
**🎯 Estado**: Datos dinámicos confirmados sin fallback  
**⚡ Performance**: Optimizada para respuesta < 200ms  
**🔄 Modo**: `directus` (tiempo real desde CMS)
