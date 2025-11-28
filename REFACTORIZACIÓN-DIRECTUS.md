# 🔧 REFACTORIZACIÓN DIRECTUS - FUMBLING FIELD

## 📋 **Resumen del Problema**

Existen discrepancias entre el **diseño visual** de las páginas de antecedentes y servicios y el **contenido editable** disponible en Directus:

### **🚨 Antecedentes - Discrepancias Identificadas:**
- ✅ **Campos correctos:** `Titulo`, `Descripcion`, `Cliente`, `Fecha`, `Area`, `Presupuesto`, `Imagen`
- ❌ **Campos faltantes:** Contenido rico HTML, tecnologías, características, estados, galerías
- ⚠️ **Limitaciones:** Descripción en texto plano vs. contenido rico mostrado en templates

### **🚨 Servicios - Discrepancias Identificadas:**
- ✅ **Campos correctos:** `Titulo`, `Descripcion`, `Area`, `Cliente`, `Imagen`
- ❌ **No implementados:** Arrays `Servicios` y `Caracteristicas` (existen en datos, no en Directus)
- ❌ **Campos faltantes:** `Icono`, `Color_Tema`, campos de tematización

---

## 🎯 **Solución Implementada**

### **FASE 1: Extensión del Esquema Directus**
Archivo: `scripts/refactor-directus-schema.sh`

**Para Antecedentes:**
- `Contenido_Rico` → HTML Editor con toolbar completo
- `Tecnologias` → JSON Array con nombre y color `[{"nombre": "React", "color": "#61dafb"}]`
- `Caracteristicas_Proyecto` → JSON Array de características `["Característica 1", "Característica 2"]`
- `Estado_Proyecto` → Enum (completado, en_progreso, mantenimiento, pausado)
- `Progreso_Porcentaje` → Slider 0-100% con indicador visual
- `Satisfaccion_Cliente` → Slider 0-100% con indicador visual
- `Galeria` → Relación Many-to-Many con `directus_files`

**Para Servicios:**
- `Lista_Servicios` → JSON Array de servicios incluidos
- `Caracteristicas_Servicio` → JSON Array de características
- `Icono` → Enum con iconos predefinidos (🖥️ computer, 🌐 network_wired, 🔒 security, etc.)
- `Color_Tema` → Color Picker para tematización

### **FASE 2: Migración de Datos Existentes**
Archivo: `scripts/migrate-existing-data.sh`

**Para Antecedentes:**
- Genera tecnologías automáticamente según el área del proyecto
- Crea contenido HTML rico personalizado por tipo de proyecto
- Asigna características estándar por área de especialización
- Establece estado "completado" para proyectos históricos
- Genera valores aleatorios realistas para satisfacción (90-100%)

**Para Servicios:**
- Migra arrays `Servicios` y `Caracteristicas` desde `servicios_reales_db.js`
- Asigna iconos representativos automáticamente
- Establece colores de tema únicos por servicio
- Mapea datos específicos por ID de servicio

---

## 🚀 **Instalación y Ejecución**

### **Prerrequisitos**
```bash
# Herramientas necesarias
sudo apt-get install curl jq

# Variables de entorno requeridas
export DIRECTUS_URL="http://localhost:8055"           # URL de Directus
export DIRECTUS_TOKEN="your_static_token_here"        # Token de acceso estático
```

### **Paso 1: Configurar Variables de Entorno**
```bash
# Editar variables en los scripts o exportar:
export DIRECTUS_URL="https://tu-directus-instance.com"
export DIRECTUS_TOKEN="tu_token_de_acceso_estatico"

# Verificar que Directus está accesible
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/server/health"
```

### **Paso 2: Ejecutar Extensión de Esquema**
```bash
# Hacer ejecutable el script
chmod +x scripts/refactor-directus-schema.sh

# Ejecutar extensión del esquema
./scripts/refactor-directus-schema.sh
```

**Expected Output:**
```
🔧 REFACTORIZACIÓN DEL ESQUEMA DIRECTUS
========================================
📊 EXTENDIENDO COLECCIÓN ANTECEDENTES
======================================
1️⃣  Agregando campo Contenido_Rico...
✅ Campo creado exitosamente
2️⃣  Agregando campo Tecnologias...
✅ Campo creado exitosamente
...
📋 Campos agregados a ANTECEDENTES:
   • Contenido_Rico (HTML Editor)
   • Tecnologias (JSON Array)
   • Caracteristicas_Proyecto (JSON Array)
   • Estado_Proyecto (Enum)
   • Progreso_Porcentaje (Slider 0-100%)
   • Satisfaccion_Cliente (Slider 0-100%)
   • Galeria (Many-to-Many con archivos)
```

### **Paso 3: Ejecutar Migración de Datos**
```bash
# Hacer ejecutable el script
chmod +x scripts/migrate-existing-data.sh

# Ejecutar migración de datos existentes
./scripts/migrate-existing-data.sh
```

**Expected Output:**
```
📦 MIGRACIÓN DE DATOS EXISTENTES
=================================
📋 MIGRANDO ANTECEDENTES
=========================
🔄 Procesando antecedente: ISI Solutions - Redes y comunicaciones (ID: 10768)
   ✅ Actualizado exitosamente (Satisfacción: 97%)
🔄 Procesando antecedente: Ministerio de Deportes... (ID: 10769)
   ✅ Actualizado exitosamente (Satisfacción: 92%)
...
🔧 MIGRANDO SERVICIOS
=====================
🔄 Procesando servicio: Servicios IT (ID: 1)
   ✅ Actualizado exitosamente (computer, #3B82F6)
🔄 Procesando servicio: Redes de datos (ID: 2)
   ✅ Actualizado exitosamente (network_wired, #10B981)
...
```

### **Paso 4: Verificación en Directus Admin**
1. Acceder a `http://localhost:8055` (o tu URL de Directus)
2. Ir a **Collections → Antecedentes**
3. Verificar que aparecen los nuevos campos:
   - Campo `Contenido_Rico` con editor HTML
   - Campo `Tecnologias` con datos JSON
   - Sliders `Progreso_Porcentaje` y `Satisfaccion_Cliente`
   - Campo `Estado_Proyecto` con opciones enum
4. Ir a **Collections → Servicios**
5. Verificar nuevos campos:
   - `Lista_Servicios` con arrays poblados
   - `Caracteristicas_Servicio` con datos
   - `Icono` con opciones de dropdown
   - `Color_Tema` con color picker

---

## 📊 **Resultados Esperados**

### **Frontend - Antecedentes**
Las páginas `/antecedentes/[id]/[slug]` ahora pueden mostrar:
- ✅ Contenido rico HTML formateado
- ✅ Tecnologías con colores específicos
- ✅ Características del proyecto en listas
- ✅ Barras de progreso y satisfacción
- ✅ Estados visuales del proyecto
- ✅ Galerías de imágenes (cuando se agreguen)

### **Frontend - Servicios**
Las páginas `/servicios/[id]/[slug]` ahora pueden mostrar:
- ✅ Listas de servicios incluidos
- ✅ Características específicas por servicio
- ✅ Iconos temáticos
- ✅ Colores de tema personalizados

### **Backend - Directus Admin**
- ✅ Interfaz de edición rica y completa
- ✅ Campos específicos por tipo de contenido
- ✅ Validaciones y controles de calidad
- ✅ Experiencia de usuario mejorada para editores

---

## 🔄 **Datos Migrados Automáticamente**

### **Tecnologías por Área**
```json
{
  "Telecomunicaciones": [
    {"nombre": "Cisco", "color": "#1BA0D7"},
    {"nombre": "Fibra Óptica", "color": "#FF6B35"},
    {"nombre": "VoIP", "color": "#4ECDC4"}
  ],
  "Seguridad": [
    {"nombre": "Firewalls", "color": "#E74C3C"},
    {"nombre": "CCTV", "color": "#34495E"},
    {"nombre": "Control Acceso", "color": "#9B59B6"}
  ],
  "Software": [
    {"nombre": "React", "color": "#61DAFB"},
    {"nombre": "Node.js", "color": "#339933"},
    {"nombre": "PostgreSQL", "color": "#336791"}
  ]
}
```

### **Servicios Específicos Migrados**
```json
{
  "ID 1 - Servicios IT": {
    "servicios": ["Consultoría IT", "Soporte técnico", "Mantenimiento"],
    "caracteristicas": ["Experiencia comprobada", "Soluciones integrales"],
    "icono": "computer",
    "color": "#3B82F6"
  },
  "ID 2 - Redes de datos": {
    "servicios": ["Cableado estructurado", "Fibra óptica", "Radioenlaces"],
    "caracteristicas": ["Diseño personalizado", "Alta velocidad"],
    "icono": "network_wired", 
    "color": "#10B981"
  }
}
```

---

## 🛠️ **Troubleshooting**

### **Error: "Authentication failed"**
```bash
# Verificar token
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/users/me"

# Generar nuevo token estático en Directus Admin:
# Settings → Access Tokens → Create Token
```

### **Error: "Campo ya existe"**
```bash
# Normal en re-ejecución, el script es idempotente
# ⚠️  Campo ya existe o error: Field already exists
```

### **Error: "No se pudieron obtener antecedentes/servicios"**
```bash
# Verificar conectividad
curl "$DIRECTUS_URL/items/Antecedentes?limit=1"

# Verificar permisos de la colección en Directus Admin
```

### **Verificar Migración Exitosa**
```bash
# Contar antecedentes actualizados
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/Antecedentes?filter[Contenido_Rico][_nnull]=true" | jq '.data | length'

# Contar servicios actualizados  
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/Servicios?filter[Lista_Servicios][_nnull]=true" | jq '.data | length'
```

---

## 📈 **Impacto de la Refactorización**

### **Antes:**
- ❌ Contenido básico no alineado con diseño
- ❌ Experiencia de edición limitada
- ❌ Datos hardcodeados en templates
- ❌ Inconsistencia visual/contenido

### **Después:**
- ✅ Contenido rico completamente alineado
- ✅ Experiencia de edición profesional
- ✅ Datos dinámicos desde Directus
- ✅ Coherencia total diseño/contenido
- ✅ Escalabilidad para contenido futuro
- ✅ Mantenimiento simplificado

---

## 🎯 **Próximos Pasos Sugeridos**

1. **Ejecutar ambos scripts** en el entorno de desarrollo
2. **Verificar resultados** en Directus Admin  
3. **Testear frontend** para confirmar que se muestran los nuevos datos
4. **Aplicar en producción** cuando esté validado
5. **Capacitar editores** en el uso de los nuevos campos
6. **Considerar nuevas funcionalidades** basadas en la estructura mejorada

---

*La refactorización está diseñada para ser **no-destructiva** y **backwards-compatible**. Los datos existentes se mantienen intactos y se agregan los nuevos campos de forma incremental.* 