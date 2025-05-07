.PHONY: setup dev build test prod-build prod-up prod-down backup restore

# Variables
BACKUP_DIR := ./backups
TIMESTAMP := $(shell date +%Y%m%d_%H%M%S)

# Setup project
setup:
	npm install
	docker-compose up -d database directus-app
	@echo "Waiting for services to start..."
	sleep 10
	@echo "Setup complete. Run 'make dev' to start development environment."

# Start development environment
dev:
	docker-compose up -d

# Build for production
build:
	npm run build

# Run tests
test:
	npm run lint

# Build production Docker images
prod-build:
	docker-compose -f docker-compose.production.yml build

# Start production environment
prod-up:
	docker-compose -f docker-compose.production.yml up -d

# Stop production environment
prod-down:
	docker-compose -f docker-compose.production.yml down

# Create backup of database and uploads
backup:
	@mkdir -p $(BACKUP_DIR)
	docker-compose exec database pg_dump -U myuser mydatabase > $(BACKUP_DIR)/db_backup_$(TIMESTAMP).sql
	tar -czf $(BACKUP_DIR)/uploads_backup_$(TIMESTAMP).tar.gz -C ./uploads .
	@echo "Backup created in $(BACKUP_DIR)"

# Restore from backup (specify DB_BACKUP and UPLOADS_BACKUP)
restore:
	@if [ -z "$(DB_BACKUP)" ]; then echo "Error: DB_BACKUP not specified"; exit 1; fi
	@if [ -z "$(UPLOADS_BACKUP)" ]; then echo "Error: UPLOADS_BACKUP not specified"; exit 1; fi
	docker-compose down
	docker-compose up -d database
	sleep 5
	cat $(DB_BACKUP) | docker-compose exec -T database psql -U myuser mydatabase
	rm -rf ./uploads/*
	tar -xzf $(UPLOADS_BACKUP) -C ./uploads
	docker-compose up -d
	@echo "Restore completed"

# Push to Docker Hub (requires login)
docker-push:
	docker tag fumbling-field_astro-app martinsantos/um25:astro-latest
	docker tag directus/directus:latest martinsantos/um25:directus-latest
	docker push martinsantos/um25:astro-latest
	docker push martinsantos/um25:directus-latest
