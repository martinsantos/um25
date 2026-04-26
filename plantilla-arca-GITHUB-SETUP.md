# 📋 PLANTILLA ARCA - SETUP REPOSITORIO GITHUB

## Resumen del Proyecto

**Nombre del repo:** `plantilla-arca`  
**Descripción:** Herramienta open source para facturación electrónica según RG 5824 de AFIP. Conecta a ARCA Web Services, solicita CAE y genera PDF con QR.  
**Licencia:** MIT  
**Stack:** Python 3.10+ | PostgreSQL | Docker | Streamlit  

---

## 📁 Estructura del Repositorio

```
plantilla-arca/
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions para tests
├── README.md                         # Documentación principal
├── CONTRIBUTING.md                  # Guía de contribución
├── LICENSE                          # MIT License
├── requirements.txt                 # Dependencias Python
├── docker-compose.yml               # Stack completo (DB + app)
├── Dockerfile                       # Imagen Docker
├── .env.example                     # Variables de entorno (template)
│
├── src/
│   ├── __init__.py
│   ├── main.py                      # Punto de entrada (CLI + Streamlit)
│   ├── config.py                    # Configuración (DB, ARCA, etc)
│   ├── models.py                    # Modelos SQLAlchemy
│   │
│   ├── arca/
│   │   ├── __init__.py
│   │   ├── client.py                # Cliente ARCA (envolvedor de arca_arg)
│   │   ├── auth.py                  # Autenticación WSAA
│   │   └── wsmtxca.py               # Lógica de solicitud CAE
│   │
│   ├── comprobante/
│   │   ├── __init__.py
│   │   ├── validator.py             # Validaciones RG 5824
│   │   ├── parser.py                # Parseo de datos de entrada
│   │   └── serializer.py            # Serialización a formato ARCA
│   │
│   ├── pdf/
│   │   ├── __init__.py
│   │   ├── generator.py             # Generación de PDF con ReportLab
│   │   ├── qr.py                    # Generación de QR
│   │   └── templates/
│   │       └── factura_template.py  # Template de factura
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── engine.py                # Inicialización de BD
│   │   └── migrations/              # Alembic para versionado de BD
│   │       └── versions/
│   │
│   └── web/
│       ├── __init__.py
│       └── streamlit_app.py         # Interfaz web (Streamlit)
│
├── tests/
│   ├── __init__.py
│   ├── test_arca_client.py
│   ├── test_validator.py
│   ├── test_pdf_generator.py
│   └── fixtures/
│       ├── certificado_test.crt
│       └── clave_privada_test.key
│
├── docs/
│   ├── ARQUITECTURA.md              # Descripción técnica detallada
│   ├── GUIA_INSTALACION.md          # Pasos de instalación
│   ├── RG5824_RESUMEN.md            # Resumen de la normativa
│   ├── CERTIFICADOS.md              # Cómo obtener certificado AFIP
│   └── EJEMPLOS.md                  # Casos de uso prácticos
│
├── certs/
│   ├── .gitkeep                     # Carpeta para certificados (NO commitear)
│   ├── certificado.crt.example      # Template de certificado
│   └── clave_privada.key.example    # Template de clave (vacío, seguridad)
│
├── samples/
│   ├── datos_comprobante.json       # Ejemplo JSON de entrada
│   ├── respuesta_arca.json          # Ejemplo de respuesta de ARCA
│   └── factura_ejemplo.pdf          # PDF de ejemplo
│
├── scripts/
│   ├── init_db.py                   # Script para crear/resetear BD
│   ├── test_arca_homologacion.py    # Script de test contra ARCA homologación
│   └── load_example_data.py         # Carga datos de ejemplo
│
└── docker/
    ├── nginx.conf                   # Config Nginx (si necesario)
    └── postgres_init.sql            # SQL inicial para PostgreSQL
```

---

## 📄 Archivos Principales a Crear

### 1. `.gitignore`

```
# Entorno
.env
.env.local
.env.*.local
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo
*.pyc
__pycache__/
*.egg-info/

# Certificados (CRÍTICO - nunca commitear)
certs/*.crt
certs/*.key
!certs/*.example

# Archivos sensibles
.DS_Store
*.log
*.pid

# Docker
.dockerignore
docker-compose.override.yml

# Base de datos
*.db
*.sqlite
postgres_data/

# PDFs generados (opcional, si quieres versionarlos)
/output/
/facturas/

# Archivos temporales
tmp/
temp/
*.tmp
```

### 2. `README.md`

```markdown
# 🧾 Plantilla ARCA - Facturación Electrónica Open Source

**Genera facturas electrónicas con CAE de AFIP en minutos, sin depender de servicios caros.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://github.com/ultimamilla/plantilla-arca/workflows/CI/badge.svg)](https://github.com/ultimamilla/plantilla-arca/actions)

---

## 🎯 Qué Resuelve

La RG 5824 de AFIP obliga a facturación electrónica a **directores, abogados, contadores, consultores** y otras profesiones que antes emitían comprobantes manuales.

Esta plantilla elimina la fricción:

- ✅ Conecta automáticamente a los Web Services de ARCA
- ✅ Solicita CAE sin dolor (abstrae WSAA, SOAP, certificados)
- ✅ Genera PDF válido con QR del CAE
- ✅ Almacena todo en PostgreSQL para auditoría
- ✅ Interfaz web mínima (Streamlit) o uso CLI

**Resultado:** De "¿cómo conecto a ARCA?" a "tengo mi factura en PDF" en 5 minutos.

---

## 🚀 Quick Start (30 segundos)

### Requisitos previos
- Docker + Docker Compose (o Python 3.10+ + PostgreSQL)
- Certificado AFIP (X.509) para tu CUIT

### Levantar todo

```bash
# Clonar
git clone https://github.com/ultimamilla/plantilla-arca.git
cd plantilla-arca

# Copiar env de ejemplo y rellenar con tus datos
cp .env.example .env
# Editar .env con tu CUIT, certificado, etc

# Levantar (PostgreSQL + app)
docker-compose up

# Acceder a http://localhost:8501 (Streamlit)
```

¡Listo! Cargá los datos del comprobante y obtené el PDF.

---

## 📚 Documentación

- [ARQUITECTURA.md](./docs/ARQUITECTURA.md) — Diseño técnico detallado
- [GUIA_INSTALACION.md](./docs/GUIA_INSTALACION.md) — Pasos por sistema operativo
- [RG5824_RESUMEN.md](./docs/RG5824_RESUMEN.md) — Qué dice la normativa
- [CERTIFICADOS.md](./docs/CERTIFICADOS.md) — Cómo obtener el certificado AFIP
- [EJEMPLOS.md](./docs/EJEMPLOS.md) — Casos de uso (factura B, nota de débito, etc)

---

## 💻 Uso

### Opción 1: Interfaz Web (Recomendado para principiantes)

```bash
streamlit run src/web/streamlit_app.py
```

Cargá el formulario, descargá el PDF. Fin.

### Opción 2: CLI (Para automatización)

```bash
python src/main.py --cuit 20123456789 --datos datos.json --output factura.pdf
```

### Opción 3: Código Python (Para integración)

```python
from src.arca.client import ArcaClient
from src.comprobante.parser import parsear_comprobante
from src.pdf.generator import generar_pdf

cliente = ArcaClient(cert_path="certs/cert.crt", key_path="certs/key.key")
comprobante = parsear_comprobante("datos.json")
cae, vto = cliente.solicitar_cae(comprobante)
generar_pdf(comprobante, cae, vto, output="factura.pdf")
```

---

## 🔧 Stack Técnico

| Componente | Herramienta | Razón |
|-----------|-----------|-------|
| **Lenguaje** | Python 3.10+ | Fácil, popular, buena comunidad AFIP |
| **Cliente ARCA** | `arca_arg` | Abstrae WSAA, SOAP, certificados |
| **Base de datos** | PostgreSQL | Escalable, auditable, estándar |
| **ORM** | SQLAlchemy | Flexible, migraciones con Alembic |
| **PDF** | ReportLab | Control total, se integra bien en Python |
| **QR** | PyQRCode | Ligero, el QR es crítico para CAE |
| **Web** | Streamlit | Prototipo rápido, cero frontend |
| **Contenedores** | Docker Compose | Levantar todo con un comando |

---

## 🧪 Testing

```bash
# Tests unitarios
pytest tests/

# Coverage
pytest --cov=src tests/

# Test contra homologación ARCA (requiere certificado)
python scripts/test_arca_homologacion.py
```

---

## 🤝 Contribuir

Estamos abiertos a contribuciones. Ver [CONTRIBUTING.md](./CONTRIBUTING.md).

Ideas de mejora:
- [ ] Soporte para Nota de Débito, Nota de Crédito
- [ ] Descuentos y retenciones
- [ ] API REST para integraciones
- [ ] Dashboard de auditoría
- [ ] Integración con Mail para envío automático

---

## ⚠️ Seguridad

- **Nunca** commitees certificados o claves privadas (el `.gitignore` lo previene)
- Los certificados van en `certs/` con permisos `600`
- Las variables sensibles en `.env` (no versionado)
- En producción, usa variables de entorno del SO

---

## 📝 Licencia

MIT — Usá, modificá, distribuí sin restricciones. Ver [LICENSE](./LICENSE).

---

## 🔗 Enlaces Útiles

- [Blog de Ultima Milla: RG 5824](https://ultimamilla.com.ar/blog/arca-5824-2026-el-director-que-nunca-facturo-tiene-fecha/)
- [AFIP - Web Services de ARCA](https://www.afip.gob.ar/ws/)
- [Documentación de `arca_arg`](https://github.com/tinybike/arca_arg)
- [RG 5824 completa (PDF AFIP)](https://www.afip.gob.ar/genericos/basesnormativas/AFIP_Resolucion_General_5824.pdf)

---

## 📧 Soporte

¿Problemas?
- Abrí un [Issue](https://github.com/ultimamilla/plantilla-arca/issues)
- Consultá los [Ejemplos](./docs/EJEMPLOS.md)
- Revisá [RG5824_RESUMEN.md](./docs/RG5824_RESUMEN.md)

---

**Construido por [Ultima Milla](https://ultimamilla.com.ar) — Soluciones técnicas para pymes argentinas.**
```

### 3. `docker-compose.yml`

```yaml
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
      - ./docker/postgres_init.sql:/docker-entrypoint-initdb.d/init.sql
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
      - "8501:8501"  # Streamlit
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
```

### 4. `Dockerfile`

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY src/ src/
COPY .env .env

# Crear directorios
RUN mkdir -p output certs

# Usuario no-root
RUN useradd -m arca && chown -R arca:arca /app
USER arca

EXPOSE 8501

CMD ["streamlit", "run", "src/web/streamlit_app.py"]
```

### 5. `.env.example`

```bash
# Base de datos
DATABASE_URL=postgresql://arca_user:arca_password_dev@localhost:5432/arca_facturas

# ARCA - Tu CUIT
ARCA_CUIT=20123456789

# ARCA - Modo homologación o producción
ARCA_HOMOLOGACION=true

# Rutas a certificado y clave (ver CERTIFICADOS.md)
ARCA_CERT_PATH=certs/certificado.crt
ARCA_KEY_PATH=certs/clave_privada.key

# Punto de venta (número del punto donde se emiten facturas)
ARCA_PUNTO_VENTA=1

# Streamlit
STREAMLIT_SERVER_HEADLESS=true
STREAMLIT_SERVER_PORT=8501
```

### 6. `requirements.txt`

```
# Core
python-dotenv==1.0.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9

# ARCA
arca_arg==0.1.2

# PDF & QR
reportlab==4.0.7
PyQRCode==1.9.2
weasyprint==59.3

# Web
streamlit==1.28.1
streamlit-aggrid==0.3.5

# CLI
click==8.1.7
pydantic==2.5.0

# Testing
pytest==7.4.3
pytest-cov==4.1.0
pytest-postgresql==5.0.0

# Utils
requests==2.31.0
python-dateutil==2.8.2
```

---

## 🎬 Próximos Pasos para Publicar

1. **Crear repositorio vacío en GitHub:**
   ```
   Organización: ultimamilla
   Nombre: plantilla-arca
   Descripción: "Generador open source de facturas electrónicas según RG 5824 AFIP"
   Público: Sí
   Licencia: MIT
   ```

2. **Inicializar repo localmente:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Plantilla ARCA MVP"
   git branch -M main
   git remote add origin https://github.com/ultimamilla/plantilla-arca.git
   git push -u origin main
   ```

3. **Proteger rama main:**
   - Require pull request reviews
   - Require status checks to pass (CI)

4. **Configurar GitHub Actions:**
   - Tests en cada PR
   - Linting con Black/Pylint
   - Coverage reports

5. **Publicar en bloque de ÚLTIMA MILLA:**
   - Agregar link a README del blog
   - Tweet/LinkedIn sobre el lanzamiento
   - Foro de desarrolladores

---

**¿Empezamos a escribir el código del MVP?**
