# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**ULTiMA MILLA - Fumbling Field** is a modern corporate web portal built with Astro, Directus CMS, and a Docker-based deployment pipeline. The project serves as the main website for ULTiMA MILLA, featuring services showcase, case studies (antecedentes), and blog functionality.

- **Production URL**: https://www.ultimamilla.com.ar
- **Admin Panel**: https://www.ultimamilla.com.ar:8055  
- **GitHub**: https://github.com/martinsantos/um25

## Architecture Overview

### Tech Stack
- **Frontend**: Astro 5.7.4 (SSR mode) + TypeScript + Tailwind CSS
- **CMS**: Directus 10.8.3 (Headless CMS)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Production Server**: Nginx reverse proxy (23.105.176.45)

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │───▶│   Astro App     │───▶│   Directus CMS  │
│  (Reverse Proxy)│    │   (SSR/SSG)     │    │   (Headless)    │
│   Port 80/443   │    │   Port 4321     │    │   Port 8055     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │   PostgreSQL    │
                       │   (Cache)       │    │   (Database)    │
                       │   Port 6379     │    │   Port 5432     │
                       └─────────────────┘    └─────────────────┘
```

## Development Commands

### Core Development
```bash
# Development (local without Docker)
npm run dev
make dev

# Development with full Docker stack
make dev-docker
docker-compose -f docker-compose.dev.yml up -d

# Build for production
npm run build
make build

# Production build with optimizations
npm run build:production
```

### Testing
```bash
# Run tests
npm run test
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ci           # CI mode

# Integration tests
npm run test:integration
npm run test:e2e
```

### Image Processing & Optimization
```bash
# Process images (runs automatically in prebuild)
npm run process-images

# Optimize images
npm run optimize-images

# Production audit
npm run production-audit
```

### Database & Migration
```bash
# Database validation
npm run validate:database
./scripts/validate-database.sh

# Directus migration
npm run migrate:directus
npm run migrate:dry-run

# Generate migration reports
npm run migration:report
```

### Docker Operations
```bash
# Development environment
make dev-docker           # Start dev stack
make status              # Check service status
make logs               # View dev logs

# Production deployment
make deploy             # Full automated deploy
make deploy-force      # Deploy without validations
make rollback          # Rollback to previous version

# Database operations
make db-backup         # Create database backup
make db-restore        # Restore from backup
make db-reset         # Reset development database

# Cleanup
make clean            # Clean build artifacts
make clean-docker    # Clean Docker resources
make clean-all      # Complete cleanup
```

## Project Structure

### Key Directories
```
fumbling-field/
├── src/
│   ├── components/          # Astro components
│   │   ├── antecedentes/   # Case study components
│   │   ├── SEO/           # SEO optimization components
│   │   └── common/        # Shared components
│   ├── pages/              # Astro pages (file-based routing)
│   │   ├── antecedentes/  # Case studies pages
│   │   ├── api/          # API routes
│   │   └── blog/         # Blog pages
│   ├── layouts/           # Page layouts
│   ├── lib/              # Utilities and integrations
│   │   └── directus.ts   # Directus SDK setup
│   ├── data/             # Static data files
│   └── config/           # Configuration files
├── scripts/              # Deployment and utility scripts
├── .github/workflows/    # CI/CD pipeline definitions
└── docker-compose.*.yml # Docker configurations
```

### Important Configuration Files
- `astro.config.mjs` - Astro configuration with SSR setup
- `docker-compose.dev.yml` - Development environment
- `docker-compose.prod.yml` - Production environment  
- `Makefile` - Development workflow commands
- `jest.config.mjs` - Testing configuration
- `tailwind.config.mjs` - Styling configuration
- `tsconfig.json` - TypeScript configuration

## Data Architecture

### Directus Collections
The project uses Directus as a headless CMS with the following main collections:
- **servicios** - Service offerings
- **casos_de_exito** (antecedentes) - Case studies/success stories
- **blog_posts** - Blog entries

### Data Fetching Pattern
```typescript
// Example from src/lib/directus.ts
import { getClient } from '@/lib/directus';

// Get published content
export const getServicios = async (limite: number = 10) => 
  obtenerContenidoPublicado('servicios', { limite });

export const getCasosExito = async (limite: number = 10) => 
  obtenerContenidoPublicado('casos_de_exito', { limite });
```

## Development Environment Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git

### Quick Setup
```bash
# Automated setup
make setup

# Or manual setup
npm ci
cp .env.example .env.local
make dev-docker
```

### Development URLs
- **App**: http://localhost:4321
- **Directus Admin**: http://localhost:8055 (admin@ultimamilla.local / admin123dev)
- **Database Admin**: http://localhost:8080 (Adminer)
- **Email Testing**: http://localhost:8025 (MailHog)

## CI/CD Pipeline

### GitHub Actions Workflow
The pipeline automatically triggers on:
- Push to `main` branch → Production deployment
- Pull requests → Build and test validation
- Tagged releases → Versioned deployment

### Pipeline Stages
1. **Lint & Validation** - ESLint, TypeScript, Prettier
2. **Testing** - Unit tests with coverage
3. **Build** - Production build with artifacts
4. **Docker Build** - Multi-platform image creation
5. **Deploy** - Automated production deployment
6. **Health Check** - Post-deployment verification
7. **Rollback** - Automatic rollback on failure

### Required GitHub Secrets
```bash
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_token  
SSH_PRIVATE_KEY=your_ssh_private_key
SLACK_WEBHOOK_URL=optional_slack_webhook
```

## Production Deployment

### Manual Deployment
```bash
# Full deployment with validation
make deploy

# Emergency deployment without checks
make deploy-force

# Rollback if needed
make rollback
```

### Production Environment
- **Server**: 23.105.176.45
- **Path**: /root/fumbling-field
- **Domains**: www.ultimamilla.com.ar, ultimamilla.com.ar
- **Admin**: https://www.ultimamilla.com.ar:8055

## Code Patterns & Best Practices

### Component Architecture
- **Layout Components**: Base layouts in `src/layouts/`
- **Page Components**: File-based routing in `src/pages/`
- **Reusable Components**: Shared components in `src/components/`
- **Feature-Specific Components**: Grouped by domain (e.g., `antecedentes/`)

### Directus Integration
- Client configuration in `src/lib/directus.ts`
- Type-safe data fetching with TypeScript interfaces
- Environment-based URL configuration
- Token-based authentication for static generation

### Image Optimization
- Automatic image processing with Sharp
- WebP/AVIF format conversion
- Responsive image generation
- Lazy loading implementation

### SEO Optimization
- Server-side rendering (SSR) for better SEO
- Automated sitemap generation
- Meta tag management
- Breadcrumb navigation
- Image optimization for Core Web Vitals

## Testing Strategy

### Unit Testing
- Jest with jsdom environment
- Component testing with Testing Library
- Mock implementations for Directus SDK
- Coverage reporting enabled

### Integration Testing
- Database connectivity validation
- Image processing verification  
- API endpoint testing
- Docker health checks

## Environment Variables

### Development (.env.local)
```bash
NODE_ENV=development
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
DATABASE_URL=postgresql://directus:dev_password_2025@localhost:5432/directus_dev
REDIS_URL=redis://localhost:6379
```

### Production (.env)
```bash
NODE_ENV=production
DIRECTUS_URL=http://directus:8055
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar
DATABASE_URL=postgresql://directus:prod_password@postgres:5432/directus
```

## Troubleshooting

### Common Issues

1. **Docker connection issues**: Ensure Docker Desktop is running
2. **Port conflicts**: Check if ports 4321, 8055, 5432, 6379 are available
3. **Build failures**: Clear node_modules and reinstall dependencies
4. **Image processing errors**: Verify Sharp installation and image file permissions
5. **Directus connection**: Check environment variables and token configuration

### Debug Commands
```bash
# Check service status
make status
make health

# View logs
make logs              # Development logs  
make logs-prod        # Production logs

# Validate components
npm run validate:database
npm run validate:images
npm run validate:api
```

### Database Troubleshooting
```bash
# Reset development database
make db-reset

# Create backup before changes
make db-backup

# Restore from backup
make db-restore BACKUP_FILE=backup.sql
```

## Performance Optimization

### Build Optimizations
- Code splitting enabled
- Asset optimization with Terser
- CSS code splitting
- Image format optimization (WebP/AVIF)

### Runtime Optimizations  
- Redis caching layer
- CDN-ready asset structure
- Lazy loading for images
- Server-side rendering for SEO

### Monitoring
- Docker health checks
- Application-level monitoring
- Performance auditing scripts
- Automated deployment verification
