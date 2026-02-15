# 🚀 PRODUCTION DEPLOY - EJECUTAR AHORA

## ⚡ COMANDOS PARA EJECUCIÓN INMEDIATA EN SERVIDOR

**Conectar al servidor de producción:**
```bash
ssh root@23.105.176.45
# Password: gsiB%s@0yD
```

**Una vez conectado, ejecutar estos comandos en orden:**

### 1. Navegar al proyecto
```bash
cd /root/fumbling-field
pwd  # Debe mostrar: /root/fumbling-field
```

### 2. Crear backup de seguridad
```bash
cp src/layouts/Layout.astro src/layouts/Layout.astro.backup.$(date +%s)
cp src/lib/directus.ts src/lib/directus.ts.backup.$(date +%s)
echo "✅ Backups creados"
```

### 3. APLICAR GOOGLE ANALYTICS (Cambio crítico #1)
```bash
sed -i 's/G-XXXXXXXXXX/G-S2376K1GED/g' src/layouts/Layout.astro
grep "G-S2376K1GED" src/layouts/Layout.astro && echo "✅ Google Analytics configurado" || echo "❌ Error en GA"
```

### 4. CORREGIR DIRECTUS COLLECTIONS (Cambio crítico #2)
```bash
sed -i "s/obtenerContenidoPublicado('Servicios'/obtenerContenidoPublicado('servicios'/g" src/lib/directus.ts
sed -i "s/obtenerContenidoPublicado('Antecedentes'/obtenerContenidoPublicado('antecedentes'/g" src/lib/directus.ts
grep "obtenerContenidoPublicado('servicios'" src/lib/directus.ts && echo "✅ Directus servicios OK"
grep "obtenerContenidoPublicado('antecedentes'" src/lib/directus.ts && echo "✅ Directus antecedentes OK"
```

### 5. REINICIAR CONTENEDOR ASTRO
```bash
docker restart astro-app
echo "✅ Contenedor reiniciado"
```

### 6. VERIFICAR DEPLOYMENT
```bash
# Verificar que el contenedor está running
docker ps | grep astro-app

# Test Google Analytics en producción
curl -s https://www.ultimamilla.com.ar | grep -o G-S2376K1GED && echo "🎯 GA ACTIVO EN PRODUCCIÓN" || echo "❌ GA no encontrado"

# Test API UM CLI
curl -s https://www.ultimamilla.com.ar/api/umcli.json | head -100

echo "🚀 DEPLOYMENT COMPLETADO"
```

## 🎯 RESULTADO ESPERADO

Después de ejecutar estos comandos:

- ✅ **Google Analytics G-S2376K1GED activo** en https://www.ultimamilla.com.ar
- ✅ **Directus collections corregidas** (servicios, antecedentes) 
- ✅ **UM CLI API funcionando** en https://www.ultimamilla.com.ar/api/umcli.json
- ✅ **Terminal CLI disponible** en https://www.ultimamilla.com.ar/cli

## 🔧 SOLUCIÓN DE PROBLEMAS

Si algún comando falla:

```bash
# Restaurar backup si es necesario
cp src/layouts/Layout.astro.backup.* src/layouts/Layout.astro
cp src/lib/directus.ts.backup.* src/lib/directus.ts

# Reiniciar todos los servicios
docker-compose restart

# Verificar logs
docker logs astro-app --tail 50
```

## ✅ CONFIRMACIÓN FINAL

Una vez ejecutado, verifica en el navegador:
- https://www.ultimamilla.com.ar (debe cargar normalmente)
- Ver código fuente -> buscar "G-S2376K1GED" (debe aparecer)
- https://www.ultimamilla.com.ar/cli (terminal debe funcionar)

---
**ESTADO**: LISTO PARA EJECUCIÓN INMEDIATA  
**TIEMPO ESTIMADO**: 2-3 minutos  
**RIESGO**: BAJO (backups incluidos)
