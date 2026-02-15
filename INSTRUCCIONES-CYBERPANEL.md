# 🌐 INSTRUCCIONES PARA CYBERPANEL - MIGRACIÓN ULTIMAMILLA.COM.AR

## 1. CREAR WEBSITE
1. **Websites** → **Create Website**
2. **Domain**: ultimamilla.com.ar
3. **Admin Email**: tu-email@gmail.com
4. **Package**: Default o el mismo que ultimamilla.com.ar
5. **Create Website**

## 2. AGREGAR SUBDOMINIOS
1. **Websites** → **List Websites** → ultimamilla.com.ar → **Manage**
2. **Create Child Domain**:
   - www.ultimamilla.com.ar
   - umw.ultimamilla.com.ar  
   - sello.ultimamilla.com.ar

## 3. CONFIGURAR DNS
1. **DNS** → **Create DNS Zone** → ultimamilla.com.ar
2. **Agregar registros desde dns-zones-ultimamilla.txt**

### Registros críticos:
```
ultimamilla.com.ar        A      23.105.176.45
www.ultimamilla.com.ar    A      23.105.176.45
ultimamilla.com.ar        MX 1   aspmx.l.google.com
ultimamilla.com.ar        MX 5   alt1.aspmx.l.google.com
```

## 4. CONFIGURAR SSL
1. **SSL** → **Manage SSL** → ultimamilla.com.ar
2. **Issue SSL** (Let's Encrypt)
3. **Force HTTPS**: Enable

## 5. PROXY CONFIGURATION
1. **Websites** → ultimamilla.com.ar → **Manage**
2. **Configuration** → **Edit Configuration**
3. **Copiar contenido de nginx-ultimamilla.conf**

## 6. VERIFICAR
- https://www.ultimamilla.com.ar (debe cargar el sitio)
- https://ultimamilla.com.ar (redirect a www)
- Correo: test@ultimamilla.com.ar (debe funcionar)
