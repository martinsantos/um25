# 🚀 INSTRUCCIONES DE DEPLOY MANUAL - CORRECCIONES CRÍTICAS

## 📊 ESTADO ACTUAL
- **Correcciones aplicadas localmente:** ✅ COMPLETADAS
- **Commit:** `e9e79e3` - Correcciones críticas UI/UX
- **Tag:** `UM25-0.6` - Versión con correcciones
- **Servidor:** 23.105.176.45 (Web: ✅ HTTP 200, SSH: ❌ No accesible)

## 🔧 CORRECCIONES INCLUIDAS
1. ❌ **Eliminada sección "Servicios Destacados" duplicada** en HOME
2. ✅ **Corregido mapeo de imágenes** en ServicesList.astro
3. ✅ **Corregido mapeo de imágenes** en /servicios
4. ✅ **Corregido mapeo de imágenes** en páginas individuales

## 🚀 COMANDOS PARA EJECUTAR EN EL SERVIDOR

### PASO 1: Conectar al servidor
```bash
ssh root@23.105.176.45
# Password: 9z1edOH&86&o
```

### PASO 2: Navegar al directorio del proyecto
```bash
cd /root/fumbling-field
pwd
# Debe mostrar: /root/fumbling-field
```

### PASO 3: Verificar estado actual
```bash
git status
git log --oneline -3
# Verificar que esté en el commit correcto
```

### PASO 4: Hacer pull de los últimos cambios
```bash
git pull origin main
# Debe traer el commit e9e79e3 con las correcciones
```

### PASO 5: Verificar que las correcciones llegaron
```bash
grep -i "servicios destacados" src/pages/index.astro
# NO debe encontrar nada (sección eliminada)

grep "2749f988-2e2d-4f32-9978-4dbeb4aa6ab2" src/components/ServicesList.astro
# DEBE encontrar el mapeo actualizado
```

### PASO 6: Parar servicios actuales
```bash
docker-compose down
# O si usa otro archivo:
# docker-compose -f docker-compose.prod.yml down
```

### PASO 7: Reconstruir y reiniciar
```bash
# Limpiar cache de Docker
docker system prune -f

# Reconstruir con las correcciones
docker-compose up -d --build

# O si usa archivo específico:
# docker-compose -f docker-compose.prod.yml up -d --build
```

### PASO 8: Verificar estado de servicios
```bash
docker-compose ps
docker-compose logs --tail=20
```

### PASO 9: Verificar que las correcciones se aplicaron
```bash
# Verificar que el sitio responda
curl -I http://localhost

# Verificar que la sección "Servicios Destacados" no esté
curl -s http://localhost | grep -i "servicios destacados"
# NO debe encontrar nada
```

## 🔍 VERIFICACIÓN FINAL

Después del deploy, verificar en el navegador:

1. **HOME (https://www.umbot.com.ar)**
   - ❌ NO debe aparecer sección "Servicios Destacados"
   - ✅ DEBE aparecer sección normal de servicios con imágenes

2. **SERVICIOS (https://www.umbot.com.ar/servicios)**
   - ✅ DEBEN verse las miniaturas de todos los servicios
   - ✅ Imágenes correctas para cada servicio

3. **SERVICIO INDIVIDUAL (https://www.umbot.com.ar/servicios/2/redes-de-datos)**
   - ✅ DEBE verse la imagen correcta del servicio
   - ✅ NO imagen genérica o equivocada

## 🚨 SOLUCIÓN DE PROBLEMAS

### Si las correcciones no se ven:
```bash
# Forzar rebuild completo
docker-compose down
docker system prune -af --volumes
docker-compose up -d --build --force-recreate
```

### Si hay errores de permisos:
```bash
chown -R root:root /root/fumbling-field
chmod -R 755 /root/fumbling-field
```

### Si Docker no responde:
```bash
systemctl restart docker
docker-compose up -d --build
```

## 📊 ARCHIVOS MODIFICADOS EN ESTA VERSIÓN

- `src/pages/index.astro` - Eliminada sección "Servicios Destacados"
- `src/components/ServicesList.astro` - Mapeo de imágenes actualizado
- `src/pages/servicios/index.astro` - Mapeo de imágenes actualizado  
- `src/pages/servicios/[id]/[slug].astro` - Mapeo de imágenes actualizado

## ✅ RESULTADO ESPERADO

Después del deploy exitoso:
- ❌ Sección "Servicios Destacados" eliminada de HOME
- ✅ Todas las imágenes de servicios funcionando correctamente
- ✅ Miniaturas visibles en todas las páginas
- ✅ Mapeo correcto entre IDs de base de datos y archivos de imagen

---

**Versión:** UM25-0.6  
**Commit:** e9e79e3  
**Fecha:** 20 de Junio, 2025  
**Estado:** ✅ LISTO PARA DEPLOY 