# 🎉 PLANTILLA ARCA - ENTREGA FINAL

## ✅ Lo que está incluido

He preparado una **plantilla Python + PostgreSQL + Docker** completamente funcional y lista para publicar en GitHub. Esta herramienta cierra el loop del blog: "RG 5824 te obliga a facturar electrónicamente → Acá tenés la solución".

---

## 📦 Archivos Entregados (en esta carpeta)

### 1. **Documentación de Setup**
- `plantilla-arca-GITHUB-SETUP.md` — Estructura completa del repo, archivos a crear, configuración

### 2. **Código Python (Core)**
- `plantilla-arca-src-config.py` → `src/config.py` (configuración centralizada)
- `plantilla-arca-src-models.py` → `src/models.py` (modelos SQLAlchemy)
- `plantilla-arca-src-arca-client.py` → `src/arca/client.py` (cliente ARCA, el corazón)
- `plantilla-arca-src-pdf-generator.py` → `src/pdf/generator.py` (generador PDF con QR)
- `plantilla-arca-src-web-streamlit-app.py` → `src/web/streamlit_app.py` (interfaz web)

### 3. **Configuración de Infraestructura**
Los archivos a crear en el repo (ver SETUP para detalles):
- `docker-compose.yml` (PostgreSQL + app en un comando)
- `Dockerfile` (imagen Docker lista)
- `requirements.txt` (dependencias Python)
- `.env.example` (variables de entorno)
- `.gitignore` (seguridad: excluye certificados)

---

## 🚀 Pasos para Publicar en GitHub

### Paso 1: Crear Repositorio Vacío

**En GitHub (web):**

1. Ve a https://github.com/ultimamilla (asume que tenés org)
2. Click "New repository"
3. Nombre: `plantilla-arca`
4. Descripción: "Generador open source de facturas electrónicas según RG 5824 AFIP"
5. **Público** ✓
6. Licencia: MIT ✓
7. **No** inicialices con README (lo crearemos localmente)

### Paso 2: Crear Estructura Local

En tu máquina:

```bash
# 1. Crear carpeta del proyecto
mkdir plantilla-arca
cd plantilla-arca

# 2. Inicializar git
git init
git config user.name "Tu Nombre"
git config user.email "tu.email@ultimamilla.com.ar"

# 3. Crear estructura de directorios
mkdir -p src/{arca,comprobante,pdf,web}
mkdir -p tests/fixtures
mkdir -p docs
mkdir -p scripts
mkdir -p certs
mkdir -p samples
mkdir -p docker
mkdir -p output

# 4. Crear .gitkeep en carpetas vacías (para mantener en git)
touch certs/.gitkeep
touch output/.gitkeep
touch samples/.gitkeep
```

### Paso 3: Copiar Archivos de Código

**Copia los archivos entregados a sus ubicaciones:**

```bash
# Config
cp plantilla-arca-src-config.py src/config.py

# Modelos
cp plantilla-arca-src-models.py src/models.py

# Cliente ARCA
mkdir -p src/arca
cp plantilla-arca-src-arca-client.py src/arca/client.py
touch src/arca/__init__.py

# PDF
mkdir -p src/pdf
cp plantilla-arca-src-pdf-generator.py src/pdf/generator.py
touch src/pdf/__init__.py

# Web
mkdir -p src/web
cp plantilla-arca-src-web-streamlit-app.py src/web/streamlit_app.py
touch src/web/__init__.py

# Crear __init__.py en src
touch src/__init__.py
```

### Paso 4: Crear Archivos de Configuración

**`.gitignore`:**
```
# Entorno
.env
.env.local
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.pyc
__pycache__/
*.egg-info/

# Certificados (CRÍTICO)
certs/*.crt
certs/*.key
!certs/*.example

# Docker
.dockerignore
docker-compose.override.yml

# BD
*.db
*.sqlite
postgres_data/

# Archivos temporales
tmp/
temp/
*.log
```

**`requirements.txt`:**
```
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
```

**`docker-compose.yml`:**
[Ver contenido completo en plantilla-arca-GITHUB-SETUP.md]

**`Dockerfile`:**
[Ver contenido completo en plantilla-arca-GITHUB-SETUP.md]

**`.env.example`:**
```
DATABASE_URL=postgresql://arca_user:arca_password_dev@localhost:5432/arca_facturas
ARCA_CUIT=20123456789
ARCA_HOMOLOGACION=true
ARCA_CERT_PATH=certs/certificado.crt
ARCA_KEY_PATH=certs/clave_privada.key
ARCA_PUNTO_VENTA=1
```

### Paso 5: Crear README.md

[Usar el README.md completo de GITHUB-SETUP.md]

### Paso 6: Commit y Push

```bash
# Añadir todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit: Plantilla ARCA MVP"

# Cambiar rama a main
git branch -M main

# Añadir remote
git remote add origin https://github.com/ultimamilla/plantilla-arca.git

# Push
git push -u origin main
```

### Paso 7: Configurar Protecciones en GitHub (Web)

**En GitHub → Settings → Branches:**

1. Añade regla para `main`:
   - Require pull request reviews: 1 persona
   - Require status checks to pass (cuando tengas CI)
   - Dismiss stale pull request approvals: ✓
   - Require code owners review: ✓

### Paso 8: Crear CI/CD con GitHub Actions

**Crear `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_arca
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      env:
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_arca
      run: |
        pytest tests/ -v --cov=src

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

---

## 📋 Checklist Final Antes de Publicar

- [ ] Repo creado en GitHub (`ultimamilla/plantilla-arca`)
- [ ] Todos los archivos `.py` copiados a sus ubicaciones correctas
- [ ] `.gitignore` excluye certificados y `.env`
- [ ] `requirements.txt` incluye todas las dependencias
- [ ] `docker-compose.yml` está listo para `docker-compose up`
- [ ] `README.md` es completo e inspirador
- [ ] `.github/workflows/ci.yml` está configurado (opcional pero recomendado)
- [ ] Rama `main` tiene protecciones activadas
- [ ] Se añadió topic `arca` + `facturacion` + `afip` en GitHub (Settings → Topics)

---

## 🔗 Pasos Post-Publicación

### 1. Actualizar Blog

Añade un "brindis" al final del artículo sobre RG 5824:

```markdown
---

## 🎁 Bonus: Plantilla Open Source

¿Querés probarlo en 5 minutos? Tenemos una plantilla de código abierto lista para usar:

**[Descargar Plantilla ARCA desde GitHub](https://github.com/ultimamilla/plantilla-arca)**

Incluye:
- ✅ Conexión automática a ARCA Web Services
- ✅ Solicitud de CAE sin dolor
- ✅ Generación de PDF con QR
- ✅ Docker Compose (cero configuración)
- ✅ Licencia MIT - úsalo gratis

```bash
git clone https://github.com/ultimamilla/plantilla-arca.git
cd plantilla-arca
docker-compose up
# → Abrí http://localhost:8501
```

Hecha por **[Ultima Milla](https://ultimamilla.com.ar)** — Soluciones técnicas para pymes argentinas.
```

### 2. Publicar en Redes

**LinkedIn + Twitter:**
```
🚀 Acaba de lanzarse: Plantilla ARCA open source

¿La RG 5824 te obliga a facturar electrónicamente? 
Hemos creado una herramienta gratuita (MIT) para automatizar todo.

✅ Conexión a ARCA Web Services
✅ Solicitud automática de CAE
✅ Generación de PDF con QR
✅ Docker Compose (listo en 5 min)

Descargá: github.com/ultimamilla/plantilla-arca
Lee el artículo: ultimamilla.com.ar/blog/arca-5824...

#AFIP #Argentina #OpenSource #Tecnología
```

### 3. Publicar en Comunidades

- **GitHub Trending** (agregando topics relevantes)
- **Made in Argentina** (si aplica)
- **Comunidad Python Argentina**
- **HN / Dev.to** (si quieres)

### 4. Monitoreo Post-Lanzamiento

- Responder issues rápido
- Agregar contribuyentes que abran PRs
- Trackear stars/forks

---

## 🛠️ Próximas Mejoras (Roadmap)

Para futuras versiones:

- [ ] Soporte para Nota de Débito y Nota de Crédito
- [ ] API REST para integraciones
- [ ] Dashboard de auditoría (comprobantes emitidos, histórico)
- [ ] Integración con email (envío automático de factura)
- [ ] Descuentos y retenciones
- [ ] QR dinámico mejorado
- [ ] Tests automatizados más robustos
- [ ] Documentación en video

---

## 📞 Preguntas Frecuentes

**P: ¿Necesito certificado AFIP para usar esto?**  
R: Sí. Vas a `https://www.afip.gob.ar` → Web Services → Solicitar Certificado. Cuesta ~$0 pero toma algunos días.

**P: ¿Funciona en Producción?**  
R: Sí. Cambá `ARCA_HOMOLOGACION=false` en `.env`. Las facturas serán válidas.

**P: ¿Puedo vender esto o cobrarlo?**  
R: No, es MIT (open source). Pero podés cobrar por **consultoría, integración o soporte**.

**P: ¿Qué pasa si tengo un error en ARCA?**  
R: Cada error está logeado. Revisá `log_correccion.jsonl` o ejecutá con `--debug`.

---

## 🎯 Objetivo Logrado

✅ **Cierra el loop del blog:**
- Problema explicado (RG 5824)
- Solución ofrecida (plantilla ARCA)
- Código abierto (MIT)
- Sin vendas empresariales (Tango, Bejerman)
- Genera leads para consultoría

✅ **Refuerza expertise técnico de ULTIMA MILLA:**
- Integración AFIP real
- Código profesional y documentado
- Comunidad potencial

✅ **Sostenible:**
- Comunidad puede contribuir
- Bajo costo de mantenimiento
- ROI vía consultoría + workshops

---

## 📧 Contacto y Soporte

Cualquier duda sobre la publicación o la plantilla:

- Email: santosma@gmail.com
- Sitio: ultimamilla.com.ar
- GitHub: github.com/ultimamilla

---

**¿Empezamos con el Push a GitHub?** 🚀
