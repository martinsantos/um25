# 🚀 Instrucciones de Ejecución Local - fix_articles.sh

## Resumen Rápido

Este script automatiza la corrección de 5 errores editoriales en 3 artículos de blog mediante la API de Directus. Ejecución: **~10 segundos**.

---

## 📋 Requisitos Previos

### 1. Herramientas Necesarias

**En macOS:**
```bash
# Verificar si jq está instalado
jq --version

# Si no está instalado:
brew install jq
```

**En Linux (Ubuntu/Debian):**
```bash
apt-get update
apt-get install -y jq curl
```

**En Windows:**
- Descargar jq desde: https://stedolan.github.io/jq/
- O usar WSL (Windows Subsystem for Linux) con los comandos de Linux arriba

### 2. Verificar curl (incluido en todos los sistemas)

```bash
curl --version
```

---

## 🔐 Obtener Credenciales

### Opción A: Usar Token de API (Recomendado)

1. Ingresa a: **https://admin.ultimamilla.com.ar**
2. Navega a **Settings** → **Access Tokens**
3. Crea un nuevo token (o usa uno existente válido)
4. Copia el token completo

### Opción B: Usar Credenciales de Usuario

Si no tienes acceso a tokens:
- Email: `admin@umbot.com.ar`
- Contraseña: `monise2024`

(El script usa estas automáticamente como fallback)

---

## ⚙️ Pasos de Ejecución

### Paso 1: Navegar a la carpeta del proyecto

```bash
# Reemplaza con tu ruta real
cd /ruta/a/fumbling-field
```

Ejemplo (si clonaste el repo):
```bash
cd ~/projects/um25/fumbling-field
```

### Paso 2: Configurar variable de entorno (Opcional pero Recomendado)

```bash
# Si tienes token:
export DIRECTUS_TOKEN="tu_token_aqui"

# Si prefieres usar credenciales básicas (en el script ya está):
# No necesitas hacer nada, el script lo maneja
```

### Paso 3: Ejecutar el script

```bash
bash fix_articles.sh
```

O con token en una sola línea:
```bash
DIRECTUS_TOKEN="tu_token" bash fix_articles.sh
```

### Paso 4: Esperar a que termine

Salida esperada:
```
═══════════════════════════════════════════════════════════════
  AUDITORÍA EDITORIAL - FIX AUTOMATIZADO
═══════════════════════════════════════════════════════════════

Directus URL: https://admin.ultimamilla.com.ar
Blog Base: https://ultimamilla.com.ar/blog
Log: log_correccion.jsonl
Backups: backup_correccion

[1/3] Procesando: mautic-5-vs-hubspot-la-cuota-fantasma-del-crm-en-pymes
✓ Corregido
[2/3] Procesando: arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha
✓ Corregido
[3/3] Procesando: clinica-de-godoy-cruz-vs-receta-electronica-la-receta-del-medio
✓ Corregido

═══════════════════════════════════════════════════════════════
✓ Ejecución completada
═══════════════════════════════════════════════════════════════
```

---

## ✅ Validar Resultados

Después de ejecutar, verifica los cambios:

### 1. Revisar el log de ejecución

```bash
cat log_correccion.jsonl | jq '.'
```

Resultado esperado: estado `"corrected"` para los 3 artículos.

### 2. Verificar backups creados

```bash
ls -lah backup_correccion/
```

Deberías ver 3 archivos `*_original.json` (respaldos automáticos).

### 3. Validar en producción (blog público)

```bash
# Artículo 1
curl -s https://ultimamilla.com.ar/blog/mautic-5-vs-hubspot-la-cuota-fantasma-del-crm-en-pymes/ | grep -i "narrativo"
# Esperado: Hay un giro narrativo en esta historia.

# Artículo 2
curl -s https://ultimamilla.com.ar/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha/ | grep -i "conflicto central"
# Esperado: Acá entra el conflicto central

# Artículo 3
curl -s https://ultimamilla.com.ar/blog/clinica-de-godoy-cruz-vs-receta-electronica-la-receta-del-medio/ | grep -i "integración de datos"
# Esperado: esa integración de datos significa
```

---

## 📊 Los 5 Cambios Exactos

| # | Artículo | Búsqueda | Reemplazo |
|---|----------|----------|-----------|
| 1 | mautic-5-vs-hubspot | `Hay un giro Michael Lewis` | `Hay un giro narrativo` |
| 2 | mautic-5-vs-hubspot | `Es la asimetría que Daniel Kahneman describiría` | `Es la asimetría descrita en la literatura sobre sesgos cognitivos` |
| 3 | arca-5824-2026 | `Hay un giro Lewis` | `Hay un giro inesperado` |
| 4 | arca-5824-2026 | `el antagonista nombrado` | `el conflicto central` |
| 5 | clinica-de-godoy-cruz | `el dato puente` | `esa integración de datos` |

---

## ⚠️ Troubleshooting

### Error: "command not found: jq"

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Verificar instalación
jq --version
```

### Error: "HTTP 401 Unauthorized"

- Verifica que tu token sea válido
- Tokens expiran después de 24h, regenera si es necesario
- Si usas Basic Auth, confirma credenciales

```bash
# Probar conexión básica
curl -u admin@umbot.com.ar:monise2024 \
  https://admin.ultimamilla.com.ar/api/blog/
```

### Error: "Connection timed out"

- Verifica conexión a internet: `ping google.com`
- Verifica que admin.ultimamilla.com.ar sea accesible: `curl -I https://admin.ultimamilla.com.ar`
- Puede ser temporalmente caída, intenta en unos minutos

### Error: "jq: parse error"

- Puede indicar respuesta HTML en lugar de JSON (auth error)
- Verifica credenciales nuevamente
- Intenta sin token: `bash fix_articles.sh` (usa fallback de Basic Auth)

### Error: "PATCH falló, intentando DELETE+POST"

- Es normal si el endpoint PATCH tiene problemas de configuración
- El script automáticamente intenta DELETE+POST (fallback workflow)
- Si sigue fallando, revisa `log_correccion.jsonl` para detalles del error

---

## 📝 Archivos Generados

Después de ejecutar, se crean:

```
├── log_correccion.jsonl           ← Bitácora de ejecución (JSON línea por línea)
└── backup_correccion/
    ├── mautic-5-vs-hubspot...original.json
    ├── arca-5824-2026...original.json
    └── clinica-de-godoy-cruz...original.json
```

**log_correccion.jsonl** contiene:
- Timestamp de cada acción
- Slug del artículo
- Status (corrected / corrected_fallback / failed)
- Cantidad de matches
- Error (si aplica)

---

## 🔄 Rollback (Si es Necesario)

Si algo sale mal y quieres revertir:

```bash
# Restaurar desde backup
jq '.' backup_correccion/mautic-5-vs-hubspot...original.json | \
  curl -X PATCH https://admin.ultimamilla.com.ar/api/blog/mautic-5-vs-hubspot-la-cuota-fantasma-del-crm-en-pymes/ \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d @-
```

O simplemente edita manualmente en Directus Admin Panel.

---

## 🎯 Próximos Pasos

1. **Copia el script a tu máquina:**
   - Descarga `fix_articles.sh` desde la carpeta compartida
   - O copia el contenido completo a un archivo local

2. **Dale permisos de ejecución:**
   ```bash
   chmod +x fix_articles.sh
   ```

3. **Ejecuta:**
   ```bash
   bash fix_articles.sh
   ```

4. **Valida resultados** usando los comandos de la sección "✅ Validar Resultados"

---

## 📞 Soporte

Si necesitas ayuda:

1. Revisa el archivo `log_correccion.jsonl` para ver exactamente qué falló
2. Intenta el script de nuevo (a veces es timeout de red)
3. Si persiste, comparte el error exacto de `log_correccion.jsonl`

**Variables de entorno útiles para debugging:**

```bash
# Ver todas las variables del script
bash -x fix_articles.sh 2>&1 | head -50

# Ver solo errores de curl
bash fix_articles.sh 2>&1 | grep -i "error\|failed"
```

---

## ✨ Notas Finales

- **Rate limiting**: El script incluye delays de 0.3s entre llamadas para evitar throttling
- **Backups automáticos**: Se crean automáticamente antes de cualquier cambio
- **Fallback workflow**: Si PATCH falla, intenta DELETE+POST automáticamente
- **Logs detallados**: Cada acción se registra en `log_correccion.jsonl` para auditoría

**El script es idempotente**: Puedes ejecutarlo múltiples veces sin efectos secundarios.

---

¡Listo para ejecutar! 🚀
