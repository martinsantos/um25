# 🚨 PLAN DE RECUPERACIÓN SERVIDOR 23.105.176.45

## 📊 DIAGNÓSTICO ACTUAL (19 Sep 2025 - 09:50)

### ❌ PROBLEMAS IDENTIFICADOS:
- **SSH**: Puerto 22 abierto pero conexiones cuelgan/timeout
- **HTTP 524**: Cloudflare no puede conectar al origen
- **Duración**: >2 horas offline (desde ~08:00)
- **Causa probable**: Problema interno del servidor/servicios

### ✅ PUERTOS ACCESIBLES:
- Puerto 22 (SSH): ✅ Abierto pero problemático
- Puerto 80 (HTTP): ✅ Abierto
- Puerto 443 (HTTPS): ✅ Abierto  
- Puerto 8055 (Directus): ✅ Abierto

## 🔧 PLAN DE REINICIO SEGÚN ARQUITECTURA

### PASO 1: DIAGNÓSTICO INICIAL (cuando SSH vuelva)
```bash
# Verificar servicios críticos según ultimamillaarquitecturaservidores.md
echo "=== DIAGNÓSTICO SERVICIOS CRÍTICOS ==="
systemctl status nginx
docker ps | grep -E 'directus|postgres|redis|umbot'
pm2 list | grep -E 'astro-app|sgi'
```

### PASO 2: REINICIO PM2 (Astro puerto 3000)
```bash
# Según arquitectura: Astro App puerto 3000 vía PM2
echo "=== REINICIANDO PM2 ASTRO APP ==="
pm2 restart astro-app || pm2 start astro-app
pm2 list
```

### PASO 3: REINICIO CONTENEDORES DOCKER
```bash
# Directus CMS (puerto 8055), PostgreSQL, Redis
echo "=== REINICIANDO CONTENEDORES DOCKER ==="
docker restart directus-app
docker restart umbot-postgres-prod  
docker restart umbot-redis-prod
docker restart umbot-emergency
docker ps
```

### PASO 4: REINICIO NGINX (Proxy Inverso)
```bash
# Nginx maneja todos los proxies según arquitectura
echo "=== REINICIANDO NGINX ==="
systemctl reload nginx
systemctl status nginx
```

### PASO 5: VERIFICACIÓN COMPLETA
```bash
# Test todos los servicios según tabla de arquitectura
echo "=== VERIFICACIÓN POST-REINICIO ==="
curl -I https://ultimamilla.com.ar        # Astro via Nginx
curl -I https://sgi.ultimamilla.com.ar     # SGI System PM2
curl -I https://admin.ultimamilla.com.ar   # Directus CMS
curl -I https://viveroloscocos.com.ar      # WordPress
```

## 🚀 COMANDOS DE EJECUCIÓN INMEDIATA

### Reinicio Completo Automático:
```bash
# Ejecutar cuando SSH esté disponible
systemctl reload nginx && \
pm2 restart all && \
docker restart directus-app umbot-postgres-prod umbot-redis-prod umbot-emergency && \
sleep 10 && \
curl -I https://ultimamilla.com.ar
```

### Monitoreo Continuo:
```bash
# Para verificar estado durante recuperación  
watch -n 5 'echo "=== $(date) ===" && pm2 list && docker ps --format "table {{.Names}}\t{{.Status}}" && systemctl is-active nginx'
```

## 📋 CHECKLIST DE RECUPERACIÓN

- [ ] Conexión SSH restaurada
- [ ] Nginx activo y configurado
- [ ] PM2: astro-app ejecutándose en puerto 3000
- [ ] Docker: directus-app activo en puerto 8055
- [ ] Docker: PostgreSQL y Redis funcionando
- [ ] Sitio principal: https://ultimamilla.com.ar (HTTP 200)
- [ ] SGI System: https://sgi.ultimamilla.com.ar (HTTP 401 esperado)
- [ ] Admin Panel: https://admin.ultimamilla.com.ar (accesible)
- [ ] Deploy UM-CLI v2.0 (cuando servicios estén estables)

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Monitoreo SSH**: Intentar conexión cada 10 minutos
2. **Desarrollo Local**: Continuar con UM-CLI v2.0 
3. **Deploy Ready**: Código v2.0 listo para subir
4. **Contacto Hosting**: Considerar contactar soporte si persiste >4 horas

---

**FECHA**: 19 Septiembre 2025 09:50
**ESTADO**: Esperando recuperación servidor
**PRIORIDAD**: ALTA - Servicios de producción afectados
