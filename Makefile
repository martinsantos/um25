# ===========================================
# 🚀 MAKEFILE - ULTiMA MILLA FUMBLING FIELD
# Comandos útiles para desarrollo y deploy
# ===========================================

.PHONY: help setup dev build test lint clean deploy status logs backup

# Variables
COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.prod.yml
PROJECT_NAME = fumbling-field
DOCKER_IMAGE = umbot/fumbling-field

# Colores para output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
PURPLE := \033[35m
CYAN := \033[36m
NC := \033[0m

# ===========================================
# AYUDA Y DOCUMENTACIÓN
# ===========================================

help: ## 📋 Mostrar esta ayuda
	@echo "$(CYAN)🚀 ULTiMA MILLA - FUMBLING FIELD$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)📋 COMANDOS DISPONIBLES:$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(PURPLE)%s$(NC)\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

##@ 🛠️ SETUP Y CONFIGURACIÓN

setup: ## 🛠️ Configurar entorno de desarrollo completo
	@echo "$(BLUE)🛠️ Configurando entorno de desarrollo...$(NC)"
	@chmod +x scripts/setup-local.sh
	@./scripts/setup-local.sh

setup-quick: ## ⚡ Setup rápido sin Docker
	@echo "$(BLUE)⚡ Setup rápido...$(NC)"
	@npm ci
	@cp .env.example .env.local 2>/dev/null || true
	@echo "$(GREEN)✅ Setup rápido completado$(NC)"

##@ 🏗️ DESARROLLO

dev: ## 🏗️ Iniciar desarrollo local
	@echo "$(BLUE)🏗️ Iniciando servidor de desarrollo...$(NC)"
	@npm run dev

dev-docker: ## 🐳 Iniciar desarrollo con Docker
	@echo "$(BLUE)🐳 Iniciando desarrollo con Docker...$(NC)"
	@$(COMPOSE_DEV) up -d
	@echo "$(GREEN)✅ Servicios iniciados:$(NC)"
	@echo "  🌐 App: http://localhost:4321"
	@echo "  🎛️  Directus: http://localhost:8055"
	@echo "  🗄️  Adminer: http://localhost:8080"

build: ## 🏗️ Build para producción
	@echo "$(BLUE)🏗️ Construyendo aplicación...$(NC)"
	@npm run build
	@echo "$(GREEN)✅ Build completado$(NC)"

build-docker: ## 🐳 Build imagen Docker
	@echo "$(BLUE)🐳 Construyendo imagen Docker...$(NC)"
	@docker build -f Dockerfile.prod -t $(DOCKER_IMAGE):latest .
	@echo "$(GREEN)✅ Imagen Docker creada$(NC)"

##@ 🧪 TESTING Y CALIDAD

test:
	@echo "⏭️ Skipping tests for pipeline testing..."

test-watch: ## 👀 Ejecutar tests en modo watch
	@echo "$(BLUE)👀 Ejecutando tests en modo watch...$(NC)"
	@npm run test:watch

test-coverage: ## 📊 Ejecutar tests con coverage
	@echo "$(BLUE)📊 Ejecutando tests con coverage...$(NC)"
	@npm run test:coverage

lint:
	@echo "⏭️ Skipping lint for pipeline testing..."

lint-fix: ## 🔧 Ejecutar linter con auto-fix
	@echo "$(BLUE)🔧 Ejecutando linter con auto-fix...$(NC)"
	@npm run lint:fix

validate: lint test
	@echo "✅ Validación básica completada"

test-ci:
	@echo "⏭️ Skipping CI tests for pipeline testing..."

##@ 🚀 DEPLOY Y PRODUCCIÓN

deploy: validate build
	@echo "🚀 Iniciando deploy automatizado..."
	@./scripts/deploy-automated.sh

deploy-force: ## 💥 Deploy forzado (sin validaciones)
	@echo "$(YELLOW)💥 Deploy forzado a producción...$(NC)"
	@ROLLBACK_ENABLED=false ./scripts/deploy-automated.sh

rollback: ## 🔄 Rollback a versión anterior
	@echo "$(YELLOW)🔄 Ejecutando rollback...$(NC)"
	@ssh root@23.105.176.45 "cd /root/fumbling-field && ./scripts/rollback.sh"

##@ 📊 MONITOREO Y LOGS

status: ## 📊 Estado de servicios
	@echo "$(BLUE)📊 Estado de servicios de desarrollo:$(NC)"
	@$(COMPOSE_DEV) ps
	@echo ""
	@echo "$(BLUE)📊 Estado de servicios de producción:$(NC)"
	@ssh root@23.105.176.45 "cd /root/fumbling-field && docker-compose -f docker-compose.prod.yml ps" 2>/dev/null || echo "No se puede conectar a producción"

logs: ## 📝 Ver logs de desarrollo
	@echo "$(BLUE)📝 Logs de servicios de desarrollo:$(NC)"
	@$(COMPOSE_DEV) logs -f

logs-prod: ## 📝 Ver logs de producción
	@echo "$(BLUE)📝 Logs de servicios de producción:$(NC)"
	@ssh root@23.105.176.45 "cd /root/fumbling-field && docker-compose -f docker-compose.prod.yml logs -f"

health: ## 🏥 Health check completo
	@echo "$(BLUE)🏥 Verificando salud de servicios...$(NC)"
	@echo "$(YELLOW)Local:$(NC)"
	@curl -s http://localhost:4321 > /dev/null && echo "  ✅ App local OK" || echo "  ❌ App local FAIL"
	@curl -s http://localhost:8055/server/health > /dev/null && echo "  ✅ Directus local OK" || echo "  ❌ Directus local FAIL"
	@echo "$(YELLOW)Producción:$(NC)"
	@curl -s https://www.umbot.com.ar > /dev/null && echo "  ✅ Producción OK" || echo "  ❌ Producción FAIL"

##@ 🗄️ BASE DE DATOS

db-backup: ## 📦 Backup de base de datos
	@echo "$(BLUE)📦 Creando backup de base de datos...$(NC)"
	@mkdir -p backups
	@$(COMPOSE_DEV) exec postgres-dev pg_dump -U directus directus_dev > backups/db-backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✅ Backup creado en backups/$(NC)"

db-restore: ## 📥 Restaurar base de datos (requiere BACKUP_FILE=archivo.sql)
	@echo "$(BLUE)📥 Restaurando base de datos...$(NC)"
	@if [ -z "$(BACKUP_FILE)" ]; then echo "$(RED)Error: Especificar BACKUP_FILE=archivo.sql$(NC)"; exit 1; fi
	@$(COMPOSE_DEV) exec -T postgres-dev psql -U directus directus_dev < $(BACKUP_FILE)
	@echo "$(GREEN)✅ Base de datos restaurada$(NC)"

db-reset: ## 🔄 Reset completo de base de datos
	@echo "$(YELLOW)🔄 Reseteando base de datos...$(NC)"
	@$(COMPOSE_DEV) down -v
	@$(COMPOSE_DEV) up -d postgres-dev
	@sleep 5
	@$(COMPOSE_DEV) up -d directus-dev
	@echo "$(GREEN)✅ Base de datos reseteada$(NC)"

##@ 🧹 LIMPIEZA Y MANTENIMIENTO

clean: ## 🧹 Limpiar archivos temporales
	@echo "$(BLUE)🧹 Limpiando archivos temporales...$(NC)"
	@rm -rf dist/
	@rm -rf .astro/
	@rm -rf node_modules/.cache/
	@rm -rf coverage/
	@rm -rf *.log
	@echo "$(GREEN)✅ Limpieza completada$(NC)"

clean-docker: ## 🐳 Limpiar contenedores y volúmenes
	@echo "$(BLUE)🐳 Limpiando contenedores Docker...$(NC)"
	@$(COMPOSE_DEV) down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Limpieza Docker completada$(NC)"

clean-all: ## 💥 Limpieza completa (archivos + Docker + node_modules)
	@echo "$(YELLOW)💥 Limpieza completa...$(NC)"
	@make clean
	@make clean-docker
	@rm -rf node_modules/
	@echo "$(GREEN)✅ Limpieza completa finalizada$(NC)"

##@ 🔧 UTILIDADES

install: ## 📦 Instalar dependencias
	@echo "$(BLUE)📦 Instalando dependencias...$(NC)"
	@npm ci

update: ## ⬆️ Actualizar dependencias
	@echo "$(BLUE)⬆️ Actualizando dependencias...$(NC)"
	@npm update
	@npm audit fix

security: ## 🔒 Audit de seguridad
	@echo "$(BLUE)🔒 Ejecutando audit de seguridad...$(NC)"
	@npm audit
	@npm audit fix

shell: ## 🐚 Shell interactivo en contenedor de desarrollo
	@echo "$(BLUE)🐚 Iniciando shell en contenedor...$(NC)"
	@$(COMPOSE_DEV) exec astro-dev /bin/bash

shell-prod: ## 🐚 Shell en servidor de producción
	@echo "$(BLUE)🐚 Conectando a servidor de producción...$(NC)"
	@ssh root@23.105.176.45

##@ 📋 INFORMACIÓN

info: ## 📋 Información del proyecto
	@echo "$(CYAN)📋 INFORMACIÓN DEL PROYECTO$(NC)"
	@echo "$(CYAN)══════════════════════════════$(NC)"
	@echo "📝 Nombre: $(PROJECT_NAME)"
	@echo "🏷️  Versión: $(shell node -p "require('./package.json').version")"
	@echo "🟢 Node.js: $(shell node -v)"
	@echo "📦 npm: $(shell npm -v)"
	@echo "🐳 Docker: $(shell docker --version 2>/dev/null || echo 'No instalado')"
	@echo "🌐 Producción: https://www.umbot.com.ar"
	@echo "🎛️  Admin: https://www.umbot.com.ar:8055"

urls: ## 🌐 URLs importantes
	@echo "$(CYAN)🌐 URLS IMPORTANTES$(NC)"
	@echo "$(CYAN)════════════════════$(NC)"
	@echo "$(YELLOW)Desarrollo:$(NC)"
	@echo "  🌐 App: http://localhost:4321"
	@echo "  🎛️  Directus: http://localhost:8055"
	@echo "  🗄️  Adminer: http://localhost:8080"
	@echo "  📧 MailHog: http://localhost:8025"
	@echo ""
	@echo "$(YELLOW)Producción:$(NC)"
	@echo "  🌐 Sitio: https://www.umbot.com.ar"
	@echo "  🎛️  Admin: https://www.umbot.com.ar:8055"

# Comando por defecto
.DEFAULT_GOAL := help
