# Comandos Finales de Verificación

## Verificación Rápida del Estado

### 1. Conectividad al Servidor
```bash
sshpass -p 'PASSWORD' ssh root@23.105.176.45
```

### 2. Estado de Docker Containers
```bash
docker ps
docker logs directus-admin --tail 20
```

### 3. Verificación de Datos Migrados
```bash
# Conectar a Directus y verificar colecciones
curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/items/antecedentes?limit=1&fields=cliente_nombre,cliente_industria,tecnologias_utilizadas"

curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/items/Servicios?limit=1&fields=descripcion_detallada,tecnologias_principales,nivel_complejidad"
```

### 4. Conteo de Registros
```bash
# Antecedentes
curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/items/antecedentes?aggregate[count]=*"

# Servicios  
curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/items/Servicios?aggregate[count]=*"
```

### 5. Verificación de Campos Nuevos
```bash
# Verificar esquema de antecedentes
curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/collections/antecedentes"

# Verificar esquema de servicios
curl -H "Authorization: Bearer TOKEN" \
  "https://www.ultimamilla.com.ar/collections/Servicios"
```

## Scripts de Validación Rápida

### Test de Conectividad
```bash
node scripts/test_conectividad.js
```

### Test de Esquema
```bash
node scripts/test_refactorizacion.js
```

### Test de Datos
```bash
node scripts/test_migracion.js
```

## Estado Esperado

### ✅ Indicadores de Éxito
- Docker containers ejecutándose
- Directus respondiendo en https://www.ultimamilla.com.ar
- 467 antecedentes con campos nuevos poblados
- 6 servicios con campos nuevos poblados
- 19 campos nuevos agregados al esquema
- 0 errores críticos en logs

### ❌ Indicadores de Problema
- Containers detenidos
- Errores 500 en Directus
- Campos nuevos vacíos
- Logs con errores de permisos críticos

## Comandos de Emergencia

### Reiniciar Directus
```bash
docker restart directus-admin
```

### Ver Logs en Tiempo Real
```bash
docker logs -f directus-admin
```

### Backup Rápido
```bash
docker exec directus-db pg_dump -U directus directus > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

**Última Verificación**: $(date)
**Estado**: ✅ OPERATIVO 