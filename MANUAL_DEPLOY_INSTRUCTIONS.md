# 🚀 INSTRUCCIONES DE DEPLOY MANUAL - FIX ANTECEDENTES

**Fecha**: $(date)  
**Problema**: Los links de antecedentes desde el index devuelven 404 y solo muestran 100 de 469 proyectos  

## 📦 ARCHIVO GENERADO
**Paquete**: `antecedentes-fix-manual-20250806-172834.tar.gz`  
**Ubicación**: En el directorio actual del proyecto  

## 🔧 PASOS DE DEPLOYMENT MANUAL

### 1. Transferir archivo al servidor
```bash
# Opción A: Usar SCP (requerirá contraseña)
scp antecedentes-fix-manual-20250806-172834.tar.gz root@ultimamilla.com.ar:/root/fumbling-field/

# Opción B: Usar cualquier herramienta de transferencia de archivos
# Transferir a: root@ultimamilla.com.ar:/root/fumbling-field/
```

### 2. Conectar al servidor
```bash
ssh root@ultimamilla.com.ar
```

### 3. Navegar al directorio del proyecto
```bash
cd /root/fumbling-field
```

### 4. Extraer y aplicar el fix
```bash
# Extraer el paquete
tar -xzf antecedentes-fix-manual-20250806-172834.tar.gz

# Ejecutar el script de deployment
bash deploy-on-server.sh
```

### 5. Verificar que funcionó
```bash
# Verificar que el servicio responde
curl -I https://ultimamilla.com.ar/antecedentes

# Verificar una página individual
curl -I https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones
```

## ✅ CAMBIOS INCLUIDOS EN EL FIX

### 🔧 PageTransition.astro
- **Problema**: JavaScript interceptaba clicks en links de antecedentes
- **Solución**: Excluir links `/antecedentes/` del sistema de transiciones
- **Línea agregada**: `if (link.href.includes('/antecedentes/')) return;`

### 📊 Antecedentes Index
- **Problema**: Solo mostraba 100 de 469 proyectos disponibles
- **Solución**: Aumentar límite de Directus de 100 a 500
- **Línea cambiada**: `limit: 500` (antes era `limit: 100`)

### 📚 Documentación
- **Agregado**: Documentación completa del problema y solución
- **Archivo**: `docs/fixes/antecedentes-links-404-fix.md`

## 🧪 VERIFICACIÓN POST-DEPLOYMENT

Después del deploy, verificar:

1. **Página índice de antecedentes**: https://ultimamilla.com.ar/antecedentes
   - Debería mostrar "469 Proyectos Disponibles" (no 100)

2. **Navegación desde índice**:
   - Click en cualquier tarjeta de antecedente
   - Debería navegar correctamente (no 404)

3. **Acceso directo**:
   - https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones
   - Debería seguir funcionando

## 🔙 ROLLBACK (si es necesario)

El script crea automáticamente un backup en `backup-FECHA/`:
```bash
# Listar backups disponibles
ls -la backup-*

# Restaurar desde backup (ejemplo)
cp backup-20250806-172840/PageTransition.astro src/components/
cp backup-20250806-172840/index.astro src/pages/antecedentes/

# Rebuildy restart
npm run build
docker-compose restart astro-app
```

## 🎯 RESULTADO ESPERADO

✅ **Links de antecedentes funcionan** desde el index  
✅ **Se muestran 469 proyectos** en lugar de 100  
✅ **No hay errores 404** al navegar desde el index  
✅ **Las transiciones siguen funcionando** en otras páginas  

---

**📞 Soporte**: Si hay problemas durante el deploy, revisar logs de Docker:
```bash
docker-compose logs astro-app
```
