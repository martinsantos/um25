# 🚀 INSTRUCCIONES DE DESPLIEGUE FINAL - UM25-0.3

## 📋 RESUMEN DE LA SITUACIÓN

### ✅ **Estado Actual del Proyecto Local**
- **Repositorio completo**: Todos los archivos están presentes (`src/`, `scripts/`, `public/`, etc.)
- **Imágenes únicas**: Sistema de placeholders únicos implementado ✅
- **Código actualizado**: Último commit `861aba7` con limpieza pre-producción
- **469 antecedentes + 5 servicios + 821 imágenes** listos para producción

### ❌ **Problemas Identificados**

#### 1. **Servidor de Producción - Repositorio Incompleto**
```bash
# En el servidor 23.105.176.45 solo hay:
total 24
-rw-r--r--. 1 root root  369 .env
drwxr-xr-x. 8 root root  163 .git
drwxr-xr-x. 3 root root   45 .specstory
drwxr-xr-x. 9 root root 4096 database
-rw-r--r--. 1 root root  964 docker-compose.yml

# FALTAN: src/, scripts/, public/, package.json, astro.config.mjs, etc.
```

#### 2. **Entorno Local - Problemas de Autenticación Directus**
```bash
Error: Token expired.
Error: You don't have permission to access this.
HTTP error! status: 403
```

---

## 🛠️ SOLUCIONES IMPLEMENTADAS

### 📦 **Scripts Creados**

1. **`deploy-production-complete.sh`** - Despliegue completo en producción
2. **`diagnose-server.sh`** - Diagnóstico del servidor
3. **`fix-directus-auth-local.sh`** - Solución de autenticación local

---

## 🚀 PROCEDIMIENTO DE DESPLIEGUE

### **PASO 1: Diagnóstico del Servidor**

```bash
# Ejecutar diagnóstico para verificar el estado actual
./diagnose-server.sh
```

**Resultado esperado**: Confirmará que el repositorio está incompleto.

### **PASO 2: Despliegue Completo en Producción**

```bash
# Ejecutar despliegue completo (resuelve el problema del repositorio incompleto)
./deploy-production-complete.sh
```

**Este script realiza:**
1. ✅ **Backup** del servidor actual
2. ✅ **Limpieza** completa del directorio
3. ✅ **Clonado** completo del repositorio
4. ✅ **Verificación** de integridad (src/, scripts/, public/, etc.)
5. ✅ **Configuración** de variables de entorno para producción
6. ✅ **Instalación** de dependencias
7. ✅ **Build** del proyecto
8. ✅ **Configuración** de Docker
9. ✅ **Inicio** de servicios
10. ✅ **Verificación** final

### **PASO 3: Verificación Post-Despliegue**

```bash
# Verificar que el sitio esté funcionando
curl -I http://23.105.176.45/

# Verificar servicios Docker
ssh root@23.105.176.45 "cd /root/fumbling-field && docker-compose -f docker-compose.static.yml ps"
```

---

## 🔧 SOLUCIÓN PARA PROBLEMAS LOCALES

### **Problema: Autenticación Directus Local**

```bash
# Ejecutar script de solución de autenticación
./fix-directus-auth-local.sh
```

**Este script:**
1. ✅ Reinicia servicios Directus
2. ✅ Configura credenciales por defecto
3. ✅ Obtiene token de autenticación automáticamente
4. ✅ Actualiza `.env.local` con el token válido
5. ✅ Configura fallback a modo estático si es necesario

---

## 📊 CONFIGURACIÓN DE PRODUCCIÓN

### **Variables de Entorno (Servidor)**
```bash
# .env.production (creado automáticamente)
NODE_ENV=production
ASTRO_ENV=production
PUBLIC_SITE_URL=https://www.umbot.com.ar
PUBLIC_DOMAIN=www.umbot.com.ar
STATIC_MODE=true
USE_STATIC_DATA=true
```

### **Arquitectura de Despliegue**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │───▶│  Astro Static   │───▶│  Static Assets  │
│   Port 80/443   │    │   Port 3000     │    │   Images/CSS    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🌐 URLs DE ACCESO

### **Producción**
- **IP Directa**: http://23.105.176.45/
- **Dominio**: https://www.umbot.com.ar/
- **Antecedentes**: https://www.umbot.com.ar/antecedentes
- **Servicios**: https://www.umbot.com.ar/servicios

### **Local (Desarrollo)**
- **Astro**: http://localhost:4321/
- **Directus**: http://localhost:8055/

---

## 🔍 COMANDOS DE MONITOREO

### **En el Servidor de Producción**
```bash
# Conectar al servidor
ssh root@23.105.176.45

# Ver estado de servicios
cd /root/fumbling-field
docker-compose -f docker-compose.static.yml ps

# Ver logs
docker-compose -f docker-compose.static.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.static.yml restart

# Verificar sitio
curl -I http://localhost/
```

### **En Local (Desarrollo)**
```bash
# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar Directus
docker-compose restart directus

# Verificar autenticación
curl -H "Authorization: Bearer $TOKEN" http://localhost:8055/collections
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Si el despliegue falla:**
1. Ejecutar `./diagnose-server.sh` para identificar el problema
2. Verificar conectividad SSH: `ssh root@23.105.176.45`
3. Verificar espacio en disco en el servidor
4. Revisar logs de Docker en el servidor

### **Si Directus local no funciona:**
1. Ejecutar `./fix-directus-auth-local.sh`
2. Si persiste, usar modo estático: `STATIC_MODE=true` en `.env.local`
3. Reiniciar servicios: `docker-compose restart`

### **Si las imágenes no cargan:**
- ✅ **YA SOLUCIONADO**: Sistema de imágenes únicas implementado
- Cada antecedente tiene su imagen específica o placeholder único
- No más imágenes repetidas

---

## 📈 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ **Sistema de Imágenes Únicas**
- 469 antecedentes con imágenes específicas
- Placeholders únicos por proyecto
- Sin imágenes por defecto hardcodeadas

### ✅ **Modo Estático para Producción**
- Sin dependencias de Directus en producción
- Datos estáticos pre-generados
- Mayor estabilidad y rendimiento

### ✅ **UI/UX Mejorada**
- Sin botones "Ver Detalles"
- Tipografía font-black
- Efectos hover modernos
- Diseño responsive

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar despliegue**: `./deploy-production-complete.sh`
2. **Verificar funcionamiento**: Acceder a http://23.105.176.45/
3. **Configurar dominio**: Apuntar www.umbot.com.ar al servidor
4. **Configurar SSL**: Certificado HTTPS para el dominio
5. **Monitoreo**: Configurar alertas y backups automáticos

---

## 📞 INFORMACIÓN DE CONTACTO

**Servidor de Producción:**
- **IP**: 23.105.176.45
- **Usuario**: root
- **Contraseña**: gsiB%s@0yD
- **Directorio**: /root/fumbling-field

**Repositorio:**
- **GitHub**: https://github.com/martinsantos/um25.git
- **Rama**: main
- **Último commit**: 861aba7

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] Ejecutar `./diagnose-server.sh`
- [ ] Ejecutar `./deploy-production-complete.sh`
- [ ] Verificar http://23.105.176.45/
- [ ] Probar navegación en antecedentes
- [ ] Verificar imágenes únicas
- [ ] Configurar dominio DNS
- [ ] Configurar certificado SSL
- [ ] Documentar accesos y procedimientos

---

**🚀 UM25-0.3 listo para producción con todas las mejoras implementadas!** 