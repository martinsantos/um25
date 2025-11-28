# 🏗️ ARQUITECTURA DIRECTUS COMO BACKEND COMPLETO

**Fecha**: 2025-11-28
**Versión Baseline**: v0.0.1-production-baseline
**Servidor**: 23.105.176.45

---

## 📋 **RESUMEN EJECUTIVO**

Esta es la arquitectura actual en producción de **ULTIMA MILLA** donde **Directus CMS** sirve como backend headless completo para el sitio web corporativo.

### **Stack Tecnológico**

| Componente | Tecnología | Puerto | Estado |
|------------|------------|--------|---------|
| **Frontend** | Astro 5.7.4 (SSR) | 4321 | ✅ Online |
| **Backend/CMS** | Directus 10.8.3 | 8055 | ✅ Online |
| **Base de Datos** | PostgreSQL 15 | 5432 | ✅ Online |
| **Cache** | Redis 7 | 6379 | ✅ Online |
| **Proxy** | Nginx | 80/443 | ✅ Online |
| **Process Manager** | PM2 | - | ✅ Online |
| **Container Engine** | Docker | - | ✅ Online |

---

## 🌐 **SERVICIOS EN PRODUCCIÓN**

### **URLs Principales**

```
✅ www.ultimamilla.com.ar       → Sitio Principal (Astro + Directus)
✅ sgi.ultimamilla.com.ar        → Sistema de Gestión Interna
✅ admin.ultimamilla.com.ar      → Panel Admin Directus
✅ www.umbot.com.ar              → UMBot Emergency System
✅ viveroloscocos.com.ar         → WordPress Vivero Los Cocos
✅ https://23.105.176.45:8090/   → CyberPanel
```

---

## 🏛️ **ARQUITECTURA DETALLADA**

### **Flujo de Datos**

```
┌──────────────────────────────────────────────────────────────┐
│                         INTERNET                              │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                 Cloudflare CDN + DNS                          │
│                  (SSL/TLS Termination)                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│            Nginx Reverse Proxy (23.105.176.45)                │
│                    Puertos 80/443                             │
├───────────────────────────┬───────────────────────────────────┤
│  ┌────────────────────────┼────────────────────────┐          │
│  │ VHost: www.ultimamilla │ VHost: admin          │          │
│  │        .com.ar         │   .ultimamilla.com.ar │          │
│  └────────────────────────┴────────────────────────┘          │
└───────────────┬───────────────────────┬──────────────────────┘
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────────┐
    │   Astro App       │   │   Directus CMS        │
    │   (PM2)           │   │   (Docker)            │
    │   Port: 4321      │   │   Port: 8055          │
    │                   │   │                       │
    │   SSR Mode        │   │   Headless CMS        │
    │   Node.js         │   │   REST + GraphQL API  │
    └─────────┬─────────┘   └────────────┬──────────┘
              │                          │
              │ API Calls                │ Database
              │ (SDK @directus/sdk)      │ Queries
              │                          │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   PostgreSQL           │
              │   (Docker)             │
              │   Port: 5432           │
              │                        │
              │   Database: directus   │
              │   Collections:         │
              │   - antecedentes       │
              │   - servicios          │
              │   - blog_posts         │
              │   - directus_files     │
              └────────────────────────┘
                           │
                           │ Session/Cache
                           ▼
              ┌────────────────────────┐
              │   Redis                │
              │   (Docker)             │
              │   Port: 6379           │
              └────────────────────────┘
```

---

## 📊 **COLECCIONES DIRECTUS**

### **Colección: `antecedentes`**

Almacena casos de éxito y proyectos ejecutados.

```typescript
interface Antecedente {
  id: number;
  Titulo: string;
  Cliente: string;
  Vertical: string;  // SALUD | GOBIERNO | EDUCACION | etc.
  Descripcion: string;
  Fecha_Inicio: Date;
  Fecha_Fin: Date;
  Servicios: number[];  // Relación M2M con servicios
  KPIs: JSON;
  Imagenes: string[];   // UUIDs de directus_files
  status: 'published' | 'draft';
  slug: string;
}
```

**Endpoints API**:
- GET `/items/antecedentes` - Listar todos
- GET `/items/antecedentes/:id` - Obtener uno
- GET `/items/antecedentes?filter[Vertical][_eq]=SALUD` - Filtrar por vertical
- GET `/items/antecedentes?fields=*,Servicios.id,Imagenes.*` - Con relaciones

### **Colección: `servicios`**

Catálogo de servicios ofrecidos.

```typescript
interface Servicio {
  id: number;
  Nombre: string;
  Slug: string;
  Descripcion: string;
  Icono: string;          // UUID de directus_files
  Imagen_Principal: string; // UUID de directus_files
  Categoria: 'REDES' | 'SEGURIDAD' | 'SOFTWARE' | 'INFRAESTRUCTURA';
  Caracteristicas: string[];
  Tecnologias: string[];
  status: 'published' | 'draft';
}
```

**Endpoints API**:
- GET `/items/servicios`
- GET `/items/servicios?filter[Categoria][_eq]=REDES`
- GET `/items/servicios/:id?fields=*,Imagen_Principal.*`

### **Colección: `blog_posts`**

Artículos y noticias del blog.

```typescript
interface BlogPost {
  id: number;
  titulo: string;
  slug: string;
  contenido: string;
  fecha_publicacion: Date;
  autor: string;
  imagen_destacada: string;  // UUID
  categorias: string[];
  tags: string[];
  status: 'published' | 'draft';
}
```

### **Colección: `directus_files`**

Sistema de archivos gestionado por Directus.

**Estructura**:
```
/uploads/
├── {UUID}.jpg           # Imagen original
├── {UUID}.webp          # Versión WebP
└── thumbnails/
    ├── {UUID}-200x200.jpg
    └── {UUID}-400x400.jpg
```

**API de Assets**:
```
https://admin.ultimamilla.com.ar/assets/{UUID}
https://admin.ultimamilla.com.ar/assets/{UUID}?width=800&height=600&fit=cover
https://admin.ultimamilla.com.ar/assets/{UUID}?format=webp&quality=80
```

---

## 🔌 **INTEGRACIÓN ASTRO ↔ DIRECTUS**

### **Configuración SDK**

**Archivo**: `/src/lib/directus.ts`

```typescript
import { createDirectus, rest, authentication } from '@directus/sdk';

const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

export const directus = createDirectus(directusUrl)
  .with(rest())
  .with(authentication('json'));

// Tipos para collections
export type Antecedente = {
  id: number;
  Titulo: string;
  Cliente: string;
  // ... resto de campos
};

export type Servicio = {
  id: number;
  Nombre: string;
  // ... resto de campos
};

// Helper para obtener URL de asset
export function getAssetUrl(uuid: string, params?: Record<string, any>): string {
  const baseUrl = `${directusUrl}/assets/${uuid}`;
  if (!params) return baseUrl;

  const queryString = new URLSearchParams(params).toString();
  return `${baseUrl}?${queryString}`;
}
```

### **Uso en Páginas Astro**

**Ejemplo**: `/src/pages/antecedentes/[id]/[slug].astro`

```astro
---
import { directus, type Antecedente } from '@/lib/directus';
import { readItems } from '@directus/sdk';

// Obtener antecedente con relaciones
const { id } = Astro.params;

const antecedente = await directus.request<Antecedente>(
  readItems('antecedentes', {
    filter: { id: { _eq: parseInt(id) } },
    fields: ['*', 'Servicios.id', 'Servicios.Nombre', 'Imagenes.*'],
    limit: 1
  })
);

// Generar URLs de imágenes
const imageUrls = antecedente.Imagenes.map(img =>
  getAssetUrl(img.id, { width: 1200, format: 'webp', quality: 85 })
);
---

<div>
  <h1>{antecedente.Titulo}</h1>
  <p>{antecedente.Cliente}</p>

  <div class="gallery">
    {imageUrls.map(url => <img src={url} loading="lazy" />)}
  </div>
</div>
```

### **Endpoints API Propios**

**Archivo**: `/src/pages/api/antecedentes.ts`

```typescript
import type { APIRoute } from 'astro';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const GET: APIRoute = async ({ url }) => {
  const vertical = url.searchParams.get('vertical');

  const filter = vertical
    ? { Vertical: { _eq: vertical }, status: { _eq: 'published' } }
    : { status: { _eq: 'published' } };

  const antecedentes = await directus.request(
    readItems('antecedentes', {
      filter,
      fields: ['*'],
      sort: ['-Fecha_Inicio'],
      limit: 50
    })
  );

  return new Response(JSON.stringify(antecedentes), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## 🔐 **AUTENTICACIÓN Y PERMISOS**

### **Roles en Directus**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Administrator** | Acceso completo | CRUD en todas las collections |
| **Editor** | Gestión de contenido | CRUD en antecedentes, servicios, blog |
| **Public** | API pública | Read-only en items publicados |

### **Configuración de Public Access**

```sql
-- Permisos para rol público en Directus
INSERT INTO directus_permissions (role, collection, action, permissions) VALUES
  (NULL, 'antecedentes', 'read', '{"status":{"_eq":"published"}}'),
  (NULL, 'servicios', 'read', '{"status":{"_eq":"published"}}'),
  (NULL, 'blog_posts', 'read', '{"status":{"_eq":"published"}}'),
  (NULL, 'directus_files', 'read', '{}');
```

### **Variables de Entorno**

**Producción** (`/root/fumbling-field/.env`):
```env
# Astro
NODE_ENV=production
PORT=4321
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar
PUBLIC_DIRECTUS_URL=https://admin.ultimamilla.com.ar

# Directus (en directus-admin/.env)
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=***************

REDIS_HOST=redis
REDIS_PORT=6379

PUBLIC_URL=https://admin.ultimamilla.com.ar
ADMIN_EMAIL=admin@ultimamilla.com.ar
```

---

## 🚀 **DEPLOYMENT & PM2**

### **Configuración PM2**

**Archivo**: `/root/fumbling-field/ecosystem.config.js` (si existe)

```javascript
module.exports = {
  apps: [{
    name: 'astro-ultimamilla',
    script: 'node_modules/.bin/astro',
    args: 'dev --port 4321 --host',
    cwd: '/root/fumbling-field',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### **Comandos de Gestión**

```bash
# Ver estado de procesos PM2
pm2 list

# Reiniciar Astro app
pm2 restart astro-ultimamilla

# Ver logs en tiempo real
pm2 logs astro-ultimamilla

# Monitoreo
pm2 monit

# Guardar configuración PM2
pm2 save
pm2 startup
```

### **Docker Compose Directus**

**Archivo**: `/root/fumbling-field/directus-admin/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - directus_network

  redis:
    image: redis:7-alpine
    networks:
      - directus_network

  directus:
    image: directus/directus:10.8.3
    ports:
      - "8055:8055"
    environment:
      KEY: ${DIRECTUS_KEY}
      SECRET: ${DIRECTUS_SECRET}
      DB_CLIENT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      PUBLIC_URL: https://admin.ultimamilla.com.ar
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - directus_network
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions

volumes:
  postgres_data:
  directus_uploads:
  directus_extensions:

networks:
  directus_network:
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
/root/fumbling-field/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # Homepage con datos de Directus
│   │   ├── antecedentes/
│   │   │   ├── index.astro                # Listado desde Directus
│   │   │   └── [id]/[slug].astro          # Detalle dinámico
│   │   ├── servicios/
│   │   │   ├── index.astro
│   │   │   └── [id]/[slug].astro
│   │   └── api/
│   │       ├── antecedentes.ts            # Proxy API
│   │       ├── servicios.ts
│   │       └── contact.ts                 # Formulario de contacto
│   ├── components/
│   │   ├── FeaturedAntecedentes.astro     # Usa datos de Directus
│   │   ├── ServicesList.astro
│   │   └── common/
│   │       └── EnhancedImage.astro        # Optimización imágenes Directus
│   ├── lib/
│   │   ├── directus.ts                    # SDK & helpers
│   │   └── imageUtils.ts                  # Utils para assets
│   └── layouts/
│       └── Layout.astro
├── public/
│   ├── images/                            # Assets estáticos (fallback)
│   └── uploads/                           # Sincronizado con Directus
├── directus-admin/
│   ├── docker-compose.yml
│   ├── .env
│   └── extensions/                        # Extensiones Directus custom
├── .env                                   # Variables Astro
├── astro.config.mjs
├── package.json
└── ecosystem.config.js                    # PM2 config

```

---

## 🔄 **FLUJO DE SINCRONIZACIÓN**

### **Proceso de Actualización de Contenido**

1. **Editor actualiza en Directus** (https://admin.ultimamilla.com.ar)
   - Login con credenciales
   - Edita antecedente/servicio/blog
   - Cambia `status` a `published`
   - Guarda cambios

2. **Directus persiste en PostgreSQL**
   - INSERT/UPDATE en tabla correspondiente
   - Genera webhooks (si configurado)

3. **Astro obtiene datos frescos**
   - En cada request (SSR mode)
   - O mediante build programado (SSG mode)
   - SDK hace request a Directus API

4. **Cliente ve contenido actualizado**
   - Sin necesidad de redeploy
   - Cambios en tiempo real (SSR)
   - O tras rebuild (SSG)

### **Cache Strategy**

```typescript
// Ejemplo con cache en Astro
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

async function getAntecedentes() {
  const cached = cache.get('antecedentes');
  if (cached) return cached;

  const data = await directus.request(readItems('antecedentes', {
    filter: { status: { _eq: 'published' } }
  }));

  cache.set('antecedentes', data);
  return data;
}
```

---

## 🛡️ **SEGURIDAD**

### **Checklist de Seguridad**

- ✅ Directus detrás de Nginx reverse proxy
- ✅ SSL/TLS en todas las conexiones
- ✅ Acceso público restringido a read-only
- ✅ Admin panel requiere autenticación
- ✅ Credenciales en variables de entorno
- ✅ PostgreSQL no expuesto públicamente
- ✅ Rate limiting en Nginx
- ✅ CORS configurado correctamente
- ✅ File uploads con validación de tipo
- ✅ Backups automáticos de base de datos

### **Nginx Security Headers**

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
```

---

## 📈 **MONITOREO**

### **Health Checks**

```bash
# Verificar Directus
curl -I https://admin.ultimamilla.com.ar/server/health

# Verificar Astro
curl -I https://www.ultimamilla.com.ar

# Verificar PM2
pm2 status astro-ultimamilla

# Verificar Docker
docker ps | grep directus
```

### **Logs**

```bash
# PM2 logs
pm2 logs astro-ultimamilla --lines 100

# Docker logs Directus
docker logs -f directus-app

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## 🔮 **PRÓXIMOS PASOS RECOMENDADOS**

### **Optimizaciones**

1. **Implementar ISR (Incremental Static Regeneration)**
   - Cachear páginas estáticas con TTL
   - Revalidar en background

2. **CDN para Assets de Directus**
   - Cloudflare Images o similar
   - Reducir carga en servidor

3. **GraphQL en lugar de REST**
   - Queries más eficientes
   - Menos overfetching

4. **Webhooks Directus → Rebuild**
   - Auto-deploy en cambios de contenido
   - CI/CD trigger desde Directus

5. **Monitoreo Avanzado**
   - Prometheus + Grafana
   - Alertas en Slack/Email

### **Backup Strategy**

```bash
# Backup automático diario de PostgreSQL
0 2 * * * docker exec postgres pg_dump -U directus directus > /backups/directus_$(date +\%Y\%m\%d).sql

# Backup de uploads
0 3 * * * tar -czf /backups/directus_uploads_$(date +\%Y\%m\%d).tar.gz /var/lib/docker/volumes/directus_uploads/
```

---

## 📞 **CONTACTO Y SOPORTE**

**Equipo Técnico**: admin@ultimamilla.com.ar
**Servidor**: 23.105.176.45
**Documentación Directus**: https://docs.directus.io/
**Documentación Astro**: https://docs.astro.build/

---

**Última actualización**: 2025-11-28
**Versión Documento**: 1.0
**Autor**: Equipo ULTiMA MILLA
