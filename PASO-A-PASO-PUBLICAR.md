# 📋 PASO A PASO: Publicar en GitHub + Deploy Online

## PARTE 1: PREPARAR REPOSITORIO LOCAL (30 minutos)

### Paso 1.1: Crear estructura del proyecto

```bash
# En tu máquina local
mkdir -p plantilla-arca
cd plantilla-arca

# Crear estructura
mkdir -p src/{arca,comprobante,pdf,web}
mkdir -p tests/fixtures
mkdir -p docs
mkdir -p scripts
mkdir -p certs
mkdir -p samples
mkdir -p docker
mkdir -p output
mkdir -p .github/workflows

# Crear archivos vacíos para mantener estructura en git
touch certs/.gitkeep
touch output/.gitkeep
touch samples/.gitkeep
touch tests/__init__.py
touch src/__init__.py
touch src/arca/__init__.py
touch src/pdf/__init__.py
touch src/web/__init__.py
touch src/comprobante/__init__.py
```

### Paso 1.2: Copiar archivos Python

Desde la carpeta de donde descargaste los archivos entregados:

```bash
# Config
cp plantilla-arca-src-config.py src/config.py

# Models
cp plantilla-arca-src-models.py src/models.py

# ARCA Client
cp plantilla-arca-src-arca-client.py src/arca/client.py

# PDF Generator
cp plantilla-arca-src-pdf-generator.py src/pdf/generator.py

# Streamlit Web
cp plantilla-arca-src-web-streamlit-app.py src/web/streamlit_app.py
```

### Paso 1.3: Crear archivos de configuración

**`.gitignore`:**
```bash
cat > .gitignore << 'EOF'
# Entorno
.env
.env.local
.env.*.local
venv/
env/
ENV/
__pycache__/
*.pyc
*.egg-info/

# IDE
.vscode/
.idea/
*.swp

# Certificados (CRÍTICO - nunca commitear)
certs/*.crt
certs/*.key
!certs/*.example

# Docker
docker-compose.override.yml
postgres_data/

# Archivos temporales
tmp/
temp/
*.log
output/*.pdf
EOF
```

**`requirements.txt`:**
```bash
cat > requirements.txt << 'EOF'
python-dotenv==1.0.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
arca_arg==0.1.2
reportlab==4.0.7
PyQRCode==1.9.2
weasyprint==59.3
streamlit==1.28.1
streamlit-aggrid==0.3.5
click==8.1.7
pydantic==2.5.0
pytest==7.4.3
pytest-cov==4.1.0
requests==2.31.0
python-dateutil==2.8.2
EOF
```

**`.env.example`:**
```bash
cat > .env.example << 'EOF'
DATABASE_URL=postgresql://arca_user:arca_password_dev@localhost:5432/arca_facturas
ARCA_CUIT=20123456789
ARCA_HOMOLOGACION=true
ARCA_CERT_PATH=certs/certificado.crt
ARCA_KEY_PATH=certs/clave_privada.key
ARCA_PUNTO_VENTA=1
OUTPUT_DIR=./output
CERTS_DIR=./certs
STREAMLIT_SERVER_PORT=8501
EOF
```

**`docker-compose.yml`:**
```bash
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: arca_postgres
    environment:
      POSTGRES_USER: arca_user
      POSTGRES_PASSWORD: arca_password_dev
      POSTGRES_DB: arca_facturas
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arca_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: arca_app
    environment:
      DATABASE_URL: postgresql://arca_user:arca_password_dev@postgres:5432/arca_facturas
      ARCA_HOMOLOGACION: "true"
      STREAMLIT_SERVER_HEADLESS: true
    ports:
      - "8501:8501"
    volumes:
      - .:/app
      - ./certs:/app/certs:ro
      - ./output:/app/output
    depends_on:
      postgres:
        condition: service_healthy
    command: streamlit run src/web/streamlit_app.py

volumes:
  postgres_data:

networks:
  default:
    name: arca_network
EOF
```

**`Dockerfile`:**
```bash
cat > Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/
COPY .env .env 2>/dev/null || true

RUN mkdir -p output certs && useradd -m arca && chown -R arca:arca /app
USER arca

EXPOSE 8501

CMD ["streamlit", "run", "src/web/streamlit_app.py"]
EOF
```

**`README.md`:**

[Copiar el contenido del README completo de GITHUB-SETUP.md]

### Paso 1.4: Crear archivo LICENSE

```bash
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Ultima Milla

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

EOF
```

---

## PARTE 2: CREAR REPOSITORIO EN GITHUB (5 minutos)

### Opción A: Vía GitHub Web

1. **Ve a** https://github.com/new
2. **Nombre:** `plantilla-arca`
3. **Descripción:** `Generador open source de facturas electrónicas según RG 5824 AFIP`
4. **Público** ✓
5. **NO inicialices** con README (ya lo tenemos)
6. Click **Create repository**

### Opción B: Vía GitHub CLI (si lo tenés instalado)

```bash
gh repo create ultimamilla/plantilla-arca \
  --public \
  --description "Generador open source de facturas electrónicas según RG 5824 AFIP" \
  --source=. \
  --remote=origin \
  --push
```

---

## PARTE 3: HACER PUSH A GITHUB (10 minutos)

En la carpeta del proyecto:

```bash
# Inicializar git (si no lo hiciste)
git init
git config user.name "Tu Nombre"
git config user.email "santosma@gmail.com"

# Añadir todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: Plantilla ARCA MVP - Facturación electrónica open source"

# Cambiar rama a main
git branch -M main

# Añadir remote (reemplaza ultimamilla/plantilla-arca con tu org/repo)
git remote add origin https://github.com/ultimamilla/plantilla-arca.git

# Push
git push -u origin main
```

**Si pide contraseña:**
- Usa Personal Access Token (PAT) en lugar de contraseña
- Genera en: GitHub Settings → Developer settings → Personal access tokens
- Permisos: `repo`, `write:repo_hook`

---

## PARTE 4: CONFIGURAR PROTECCIONES EN GITHUB (5 minutos)

**En GitHub → Settings → Branches:**

1. Click "Add rule"
2. **Branch name pattern:** `main`
3. ✓ Require a pull request before merging
4. ✓ Require status checks to pass before merging
5. ✓ Require branches to be up to date before merging
6. Click "Create"

---

## PARTE 5: DESPLEGAR ONLINE (Opciones)

### OPCIÓN 1: En un VPS propio (Recomendado para producción)

**Requisitos:**
- VPS Linux (Ubuntu 22.04 recomendado)
- Docker instalado
- Dominio apuntando a tu IP
- Certificado SSL

**En el servidor:**

```bash
# 1. Clonar repo
git clone https://github.com/ultimamilla/plantilla-arca.git
cd plantilla-arca

# 2. Crear .env desde .env.example
cp .env.example .env
# Editar .env con tus datos reales

# 3. Copiar certificado AFIP
# cp /ruta/a/certificado.crt certs/
# cp /ruta/a/clave.key certs/

# 4. Levantar con Docker
docker-compose up -d

# 5. Ver logs
docker-compose logs -f app
```

**Nginx reverse proxy (opcional pero recomendado):**

```bash
# En /etc/nginx/sites-available/plantilla-arca
server {
    listen 80;
    server_name plantilla-arca.ultimamilla.com.ar;

    location / {
        proxy_pass http://localhost:8501;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
    }
}

# Activar
sudo ln -s /etc/nginx/sites-available/plantilla-arca /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### OPCIÓN 2: En Render.com (Más fácil, semi-gratis)

1. Ve a https://render.com
2. Click "New +"
3. Selecciona "Web Service"
4. Conecta tu repo GitHub
5. Selecciona rama `main`
6. **Build command:** `pip install -r requirements.txt`
7. **Start command:** `streamlit run src/web/streamlit_app.py`
8. **Port:** 8501
9. Añade variables de entorno (`.env`)
10. Deploy

**Costo:** ~$10/mes si usas PostgreSQL compartido

---

### OPCIÓN 3: En Railway.app (También fácil)

1. https://railway.app
2. "Create New Project"
3. "Deploy from GitHub repo"
4. Conecta `ultimamilla/plantilla-arca`
5. Añade servicio PostgreSQL
6. Configura env vars
7. Deploy automático

**Costo:** ~$5-10/mes

---

## PARTE 6: PUBLICAR NOTA EN BLOG (15 minutos)

### Crear artículo en Directus

1. **Accede a:** https://admin.ultimamilla.com.ar
2. **Blog → Create item**
3. **Campos a rellenar:**

| Campo | Valor |
|-------|-------|
| **Slug** | `plantilla-arca-facturacion-open-source` |
| **Título** | `Plantilla ARCA: Facturación Electrónica Open Source (La solución que faltaba)` |
| **Descripción (preview)** | `Acaba de lanzarse una herramienta open source, gratuita y 100% funcional para generar facturas electrónicas con CAE de AFIP. Probá la demo online.` |
| **Contenido** | [Copiar de NOTA-BLOG-PLANTILLA-ARCA.md] |
| **Categorías** | Tecnología, AFIP, Herramientas |
| **Imagen destacada** | [Usa una captura de pantalla de Streamlit] |
| **Estado** | Published |
| **Fecha** | 26/04/2026 |

4. **Guardar**

**Link resultante:** https://ultimamilla.com.ar/blog/plantilla-arca-facturacion-open-source

---

## PARTE 7: PROMOCIONAR LA NOVEDAD (Rápido)

### Redes Sociales

**LinkedIn:**
```
🚀 Acaba de lanzarse: Plantilla ARCA open source

¿La RG 5824 te obliga a facturar electrónicamente?
Hemos creado una herramienta gratuita (MIT) para automatizar todo sin pagar $500/mes en Tango o Bejerman.

✅ Conexión a ARCA Web Services
✅ CAE automático
✅ PDF con QR
✅ Docker (listo en 5 min)
✅ Licencia MIT

→ Probá online: ultimamilla.com.ar/blog/plantilla-arca-...
→ Descarga: github.com/ultimamilla/plantilla-arca

#AFIP #Argentina #OpenSource
```

**Twitter/X:**
```
Una herramienta open source para facturación electrónica según RG 5824 AFIP.

Gratis. Sin suscripción. Código tuyo.

github.com/ultimamilla/plantilla-arca
ultimamilla.com.ar/blog/plantilla-arca

#AFIP #Argentina #OpenSource
```

### Email

Envía a clientes/comunidad:

```
Asunto: Nuevo: Plantilla ARCA (facturación electrónica open source)

---

Hola,

Acaba de lanzarse una herramienta que resuelve uno de los mayores dolores de cabeza del 2026: RG 5824 (facturación electrónica obligatoria para directores, abogados, etc).

→ Lee el artículo: ultimamilla.com.ar/blog/plantilla-arca-...
→ Descarga gratis: github.com/ultimamilla/plantilla-arca
→ Prueba online: plantilla-arca.ultimamilla.com.ar

Gratis. Open source. Sin vendors. Sin mensualidades.

¿Dudas? Escribinos.

Saludos,
Ultima Milla
```

---

## ✅ CHECKLIST FINAL

Antes de dar por completado:

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado (`git push`)
- [ ] README visible en GitHub
- [ ] `main` branch tiene protecciones
- [ ] `.gitignore` excluye certificados
- [ ] `docker-compose up` funciona localmente
- [ ] Streamlit accesible en http://localhost:8501
- [ ] Nota de blog publicada en Directus
- [ ] URL de blog accesible
- [ ] Demo online desplegada
- [ ] GitHub topics añadidos: `arca`, `facturacion`, `afip`, `argentina`, `open-source`
- [ ] Redes sociales publicadas

---

## 🎯 Resultado Final

Cuando termines esto, tendrás:

```
✅ GitHub repo público (código fuente accesible)
✅ Demo online en ultimamilla.com.ar
✅ Nota de blog explicando la novedad
✅ Redes sociales promocionando
✅ Documentación completa
```

**Todo listo para que los usuarios descarguen, prueben y usen sin pagar.**

---

**¿Necesitás ayuda en algún paso específico?**

Escribime cuál es el cuello de botella y lo resolvemos.
