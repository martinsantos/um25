# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ULTIMA MILLA Corporate Website** - Production Astro SSR application with Directus headless CMS backend, serving www.ultimamilla.com.ar and related services.

**Critical**: This is a PRODUCTION system serving 5 live websites with 24/7 uptime requirements. Follow strict server architecture rules documented in `.windsurf/rules/arquitectura-servidor-reglas.md`.

---

## Development Commands

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:4321)
npm run build                  # Production build
npm run preview                # Preview production build

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:ci                # CI environment tests

# Code Quality
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix lint issues

# Image Processing
npm run process-images         # Process images for optimization
npm run optimize-images        # Optimize existing images
npm run prebuild               # Runs before build (includes process-images)

# Database & API Validation
npm run validate:database      # Validate database connectivity
npm run validate:images        # Validate image loading
npm run validate:api           # Test API connectivity
npm run test:migration         # Full migration validation suite
```

### Production Deployment

```bash
# NEVER deploy manually to production
# All deployments MUST go through Git Flow → GitHub Actions

# Correct workflow:
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
# ... make changes ...
git commit -m "feat: your feature"
git push origin feature/your-feature
# Create PR to develop, then PR to master for deployment
```

---

## Critical Architecture Rules

### Production Baseline

**Baseline Version**: `v0.0.1-production-baseline` (tag)
- This is the immutable source of truth
- Production server at 23.105.176.45
- NEVER modify production server directly

### Git Flow Workflow (MANDATORY)

```
master (production) ← Protected, requires PR
  └── develop (integration) ← Base for features
      └── feature/* ← Your work here
```

### Prohibited Actions

**NEVER**:
- Push directly to `master`
- Edit files directly on production server
- Run `git pull` manually on server
- Modify `.env` files in production
- Execute `npm install` on server without CI/CD
- Disable monitoring cron jobs
- Delete logs without rotation

### Emergency Protocol

If production site is down:
```bash
ssh ultimamilla
pm2 restart astro-ultimamilla

# If that fails:
cd /root/fumbling-field
git checkout v0.0.1-production-baseline
pm2 restart astro-ultimamilla
```

**Full rules**: See `REGLAS_ARQUITECTURA_SERVIDOR.md` and `.windsurf/rules/arquitectura-servidor-reglas.md`

---

## Architecture Overview

### Tech Stack

```yaml
Frontend:
  Framework: Astro 5.7.4 (SSR mode)
  Styling: Tailwind CSS
  Icons: Lucide, Iconify
  Interactive: Alpine.js
  Process: PM2 (process: astro-ultimamilla, port 4321)

Backend Services:
  CMS: Directus 10.8.3 (port 8055, Docker)
  SGI: Sistema de Gestión Integral (port 3000/3456, Node.js)
  Database: PostgreSQL 15 (Docker, port 5432)
  Cache: Redis 7 (Docker, port 6379)
  MySQL: MariaDB 10.11.15 (port 3306, local)

Web Server:
  Proxy: Nginx (reverse proxy)
  Ports: 80/443 (HTTP/HTTPS)
  SSL: Let's Encrypt

Process Management:
  PM2: astro-ultimamilla (port 4321)
  PM2: sgi (port 3000)
  Node: 20.x
```

### Data Flow

```
┌──────────────────────────────────────────────────────┐
│              CLIENT REQUESTS                         │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│   NGINX (reverse proxy on :80/:443)                  │
│  - www.ultimamilla.com.ar → astro-ultimamilla:4321 │
│  - sgi.ultimamilla.com.ar → SGI:3000               │
│  - admin.ultimamilla.com.ar → Directus:8055         │
└──────────────────────────────────────────────────────┘
         ↓
    ┌────┴────┬────────┐
    ↓         ↓        ↓
┌─────────┐ ┌────┐ ┌─────────────┐
│ Astro   │ │SGI │ │ Directus    │
│ :4321   │ │:3000│ │ :8055       │
└────┬────┘ └───┬┘ └──────┬──────┘
     ↓          ↓         ↓
     └──────────┼─────────┘
            ↓
    ┌──────────────────┐
    │  PostgreSQL      │
    │  :5432 (Docker)  │
    │  + Redis :6379   │
    └──────────────────┘

    ┌──────────────────┐
    │  MySQL/MariaDB   │
    │  :3306 (local)   │
    └──────────────────┘
```

### Directus Integration

**Connection Pattern**:
```typescript
// src/lib/directus.ts
import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus(
  process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055'
).with(rest());

// Usage in pages:
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const items = await directus.request(
  readItems('collection_name', {
    filter: { status: { _eq: 'published' } },
    fields: ['*', 'relations.*']
  })
);
```

**Key Collections**:
- `antecedentes` - Case studies/portfolio items (469 items)
- `Servicios` - Services offered
- `Imagenes` - Image assets linked to antecedentes
- `sectores` - Industry sectors for filtering

### SGI (Sistema de Gestión Integral)

**Purpose**: Internal business management system for Ultima Milla
- URL: https://sgi.ultimamilla.com.ar
- Backend: Node.js + Express.js
- Port: 3000 (internal) → 3456 (Nginx reverse proxy)
- Database: MySQL/MariaDB (:3306)
- Auth: Basic authentication + session management

**Important Details**:
- **Database**: Uses local MariaDB (NOT Docker)
- **Credentials**: Root user without password (original setup)
- **Nginx Config**: `/etc/nginx/sites-available/sgi.ultimamilla.com.ar`
  - Must route to `127.0.0.1:3000` (NOT 3456)
  - Protocol: Reverse proxy with session preservation
- **PM2 Process**: `sgi` (started via PM2)
- **Memory Usage**: ~40-45MB normal
- **Critical**: If Nginx config port changes, SGI will return 502

**Incident 2025-12-15**: SGI was down for 10 minutes due to:
1. Nginx pointed to port 3456 (wrong)
2. SGI running on port 3000 (correct)
3. Fix: Updated `/etc/nginx/sites-available/sgi.ultimamilla.com.ar`
   ```
   sed -i 's/127.0.0.1:3456/127.0.0.1:3000/g' /etc/nginx/sites-available/sgi.ultimamilla.com.ar
   systemctl reload nginx
   ```

### Image Handling

**Critical**: Images come from Directus and require special handling.

```typescript
// src/utils/directus.js - getImageUrl()
// Priority: Directus URL > UUID fallback > placeholder

// src/utils/imageFixer.js
// Maps 13 known broken images to working URLs
// Used in sector pages (constructoras, bodegas, salud, etc.)
```

**Image Components**:
- `EnhancedImage.astro` - Standard image with fallback
- `LazyImage.astro` - Lazy loading implementation
- `OptimizedImage.astro` - Sharp-optimized images

### Sector Filtering

Sector pages (constructoras, bodegas, salud, aeropuertos, software, gobiernosectorpublico) use **positive filtering**:

```typescript
// Filter by specific keywords in title/description
const keywords = ['keyword1', 'keyword2', 'keyword3'];
const filteredItems = items.filter(item =>
  keywords.some(kw =>
    item.Nombre?.toLowerCase().includes(kw) ||
    item.Descripcion?.toLowerCase().includes(kw)
  )
);
```

---

## Project Structure

```
/
├── src/
│   ├── components/          # Astro components
│   │   ├── antecedentes/   # Case study components
│   │   ├── common/         # Shared components (EnhancedImage, etc.)
│   │   └── SEO/            # SEO components
│   ├── layouts/            # Page layouts
│   │   └── Layout.astro   # Main layout (includes Analytics, SEO)
│   ├── pages/              # Routes (file-based routing)
│   │   ├── index.astro    # Homepage
│   │   ├── servicios/     # Services pages
│   │   ├── antecedentes/  # Case studies
│   │   │   └── [id]/[slug].astro  # Dynamic routes
│   │   └── *.astro        # Sector pages
│   ├── lib/               # Utilities
│   │   └── directus.ts    # Directus client
│   └── utils/             # Helper functions
│       ├── directus.js    # Image URL helpers
│       └── imageFixer.js  # Broken image mappings
├── public/                # Static assets
│   ├── uploads/           # Directus image uploads
│   └── favicon.svg        # Favicon
├── .github/workflows/     # CI/CD pipelines
│   ├── production-deploy.yml  # Auto-deploy on master
│   └── pr-checks.yml      # PR validation
├── scripts/               # Build and deployment scripts
│   ├── health-check.sh    # Production health checks
│   └── server-metrics.sh  # Server monitoring
└── directus-admin/        # Directus Docker setup
```

---

## Key Configuration Files

### Environment Variables

**Development** (`.env.local`):
```bash
PUBLIC_DIRECTUS_URL=http://localhost:8055
NODE_ENV=development
```

**Production** (`.env` - NEVER commit):
```bash
PUBLIC_DIRECTUS_URL=https://admin.ultimamilla.com.ar
DATABASE_URL=postgresql://...
DIRECTUS_KEY=...
DIRECTUS_SECRET=...
```

### Astro Config

`astro.config.mjs`:
- **Output**: `server` (SSR mode)
- **Adapter**: `@astrojs/node` (standalone)
- **Port**: 4321
- **Alias**: `@` → `/src`

### PM2 Config

`ecosystem.config.js`:
```javascript
{
  name: 'astro-ultimamilla',
  script: './dist/server/entry.mjs',
  instances: 1,
  exec_mode: 'fork',
  env: { NODE_ENV: 'production', PORT: 4321 }
}
```

---

## Development Workflow

### 1. Starting Development

```bash
# Clone repo
git clone https://github.com/martinsantos/um25.git
cd fumbling-field

# Install dependencies
npm ci

# Start dev server
npm run dev
# → http://localhost:4321
```

### 2. Working with Directus Locally

Directus runs in Docker (port 8055):
```bash
cd directus-admin
docker-compose up -d

# Access admin panel:
# http://localhost:8055
# Credentials in .env file
```

### 3. Adding New Pages

```typescript
// src/pages/new-page.astro
---
import Layout from '@/layouts/Layout.astro';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

// Fetch data from Directus
const data = await directus.request(
  readItems('collection_name')
);
---

<Layout title="Page Title">
  <!-- Your content -->
</Layout>
```

### 4. Image Optimization

```bash
# Before build, process images
npm run process-images

# Build includes prebuild hook
npm run build  # Automatically runs process-images
```

---

## Testing

### Test Structure

```javascript
// __tests__/component.test.js
import { expect, test } from '@jest/globals';

test('component renders correctly', () => {
  // Test implementation
});
```

### Running Tests

```bash
# Single run
npm test

# Watch mode (for TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# CI environment
npm run test:ci
```

---

## Monitoring & Health Checks

### Automated Monitoring

Production server runs cron jobs:
```bash
# Health checks every 5 minutes
*/5 * * * * /root/scripts/health-check.sh

# Server metrics every hour
0 * * * * /root/scripts/server-metrics.sh
```

### Health Check Logs

```bash
# SSH to production
ssh ultimamilla

# View health check logs
tail -f /var/log/health-check.log

# View server metrics
/root/scripts/server-metrics.sh

# PM2 status
pm2 list
pm2 logs astro-ultimamilla
```

### Services Monitored

```
✅ www.ultimamilla.com.ar
✅ sgi.ultimamilla.com.ar
✅ www.umbot.com.ar
✅ viveroloscocos.com.ar
✅ PM2 processes
✅ PostgreSQL Docker container
```

### Status Dashboard

**Live Monitoring Page**: https://ultimamilla.com.ar/status

**Authentication**: Requires HTTP Basic Auth
- **Username**: `santosma`
- **Password**: `santosma@gmail.com`

Real-time system monitoring dashboard with:
- **Memory Usage**: Current RAM consumption, threshold warnings (warning at 70%, critical at 85%)
- **Service Status**: Real-time Astro and SGI process status
- **Nginx Port Validation**: Ensures critical ports are listening (4321, 3000, 8055)
- **Recent Logs**: Integration with monitoring scripts
- **Auto-refresh**: Page refreshes every 30 seconds

**Dashboard Features** (4 Tabs):
1. **📈 Memory Trend**: Real-time Chart.js visualization with time range selection (1h/6h/24h/7d)
2. **⚙️ Configuration**: Editable threshold settings, check intervals, retention policies
3. **🔔 Webhooks**: Configure Slack/Discord webhook URLs for multi-channel alerts
4. **📋 Alert History**: Track recent system alerts and events

**Metrics Persistence**:
- Auto-saves metrics every 60 seconds via `/api/metrics/save.json`
- Stores in `/var/lib/ultimamilla/metrics/` directory
- Daily rotation with 30-day retention policy

**Protected API Endpoints** (All require HTTP Basic Auth):

1. **GET /api/status.json** - Current system metrics
```typescript
{
  "timestamp": "ISO8601",
  "server": {
    "memory": { total, used, available, usagePercent, status },
    "services": [{ name, status }],
    "nginxPorts": [{ service, expected, listening, status }]
  },
  "recentLogs": [{ timestamp, level, message, source }],
  "issues": ["list of detected issues"],
  "health": "healthy|degraded|critical"
}
```

2. **GET /api/config.json** - Current configuration thresholds
3. **POST /api/config.json** - Update configuration with validation
4. **POST /api/metrics/save.json** - Save metric snapshot (called by dashboard)
5. **GET /api/metrics/chart.json?hours={1,6,24,168,720}&type=memory** - Chart.js data

**Implementation**:
- Backend: `src/pages/api/status.json.ts` - Executes shell commands for real-time data
- Backend: `src/lib/metrics-store.ts` - JSON-based metric persistence
- Frontend: `src/pages/status.astro` - SSR page with all 5 integrated features
- Memory parsing: Uses `free -b` for accurate GB calculations
- PM2 status: Parses `pm2 list` text output for service detection
- Nginx Auth: HTTP Basic Auth protection via `/etc/nginx/.htpasswd`

### Email Alert System

**Purpose**: Automated email notifications for system issues (grouped, no spam)

**How It Works**:
- ✅ Monitors system every 10 minutes (via cron)
- ✅ Sends CRITICAL alerts immediately (memory >85%, services offline)
- ✅ Groups non-critical warnings into single email every 6 hours
- ✅ No email when system is healthy
- ✅ Professional HTML emails with metrics

**Installation**:
```bash
ssh ultimamilla

# 1. Ensure mailutils installed
apt-get install mailutils

# 2. Make script executable
chmod +x /root/scripts/alert-monitor-email.sh

# 3. Test manually
/root/scripts/alert-monitor-email.sh

# 4. Add to crontab (runs every 10 minutes)
crontab -e
# Add: */10 * * * * /root/scripts/alert-monitor-email.sh
```

**Configuration**:
```bash
# Email recipient (in script or as env var)
ALERT_EMAIL="devops@ultimamilla.com.ar"

# Memory threshold for immediate alert
ALERT_THRESHOLD_MEMORY="85"  # % - sends immediately if exceeded

# Grouping period for non-critical alerts
ALERT_CONSOLIDATE_HOURS="6"  # Sends grouped email every 6 hours
```

**Alert Scenarios**:
1. **All OK**: No email
2. **Warning (degraded)**: Buffered, sent in 6h or next critical
3. **Critical (>85% memory or service down)**: Immediate email
4. **Multiple warnings**: All grouped in single consolidated email

**Alert Email Contains**:
- System health status (CRITICAL/DEGRADED/HEALTHY)
- Current memory usage %
- Service status (online/offline)
- Issue summary
- Timestamp (UTC)
- Action links

**Logs**:
- `/var/log/alert-monitor.log` - Alert events
- `/var/log/alert-monitor-cron.log` - Cron execution
- `/tmp/alert-state.json` - State tracking (last email time, etc)

**Complete Setup Guide**: See [ALERT-SYSTEM-SETUP.md](ALERT-SYSTEM-SETUP.md)

---

## CI/CD Pipeline

### GitHub Actions Workflows

**`production-deploy.yml`** (triggers on push to `master`):
1. Build & test
2. Deploy via rsync to server
3. Restart PM2: `astro-ultimamilla`
4. Health check
5. Notification

**`pr-checks.yml`** (triggers on PRs):
1. Lint validation
2. Build verification
3. Tests
4. Auto-comment with results

### Required GitHub Secrets

```
SSH_PRIVATE_KEY    # For deployment
```

---

## Common Issues & Solutions

### Issue: www.ultimamilla.com.ar Returns 502

**Symptoms**: HTTP 502 Bad Gateway, site not responding

**Diagnosis**:
```bash
# Check if astro-ultimamilla is running
pm2 list
# Should show: astro-ultimamilla online

# Check if port 4321 is listening
netstat -tlnp | grep :4321
# Should show: node process listening

# Check Nginx error logs
tail -50 /var/log/nginx/error.log | grep 4321
# Will show: "Connection refused" if astro-ultimamilla down
```

**Solution**:
```bash
# Option 1: Restart astro-ultimamilla
pm2 restart astro-ultimamilla

# Option 2: If restart fails, check ecosystem config exists
cat /root/fumbling-field/ecosystem.config.cjs
# Should show: name: 'astro-ultimamilla', script: './dist/server/entry.mjs'

# Option 3: If config missing, recreate from master branch
git checkout master -- ecosystem.config.cjs
pm2 start ecosystem.config.cjs
```

**Root Cause (2025-12-15 Incident)**:
- Missing `ecosystem.config.cjs` file in repository
- File was only on server at `/root/ecosystem.config.cjs`
- When PM2 was misconfigured, process couldn't start

### Issue: www.sgi.ultimamilla.com.ar Returns 502

**Symptoms**: HTTP 502 Bad Gateway, SGI login page not loading

**Diagnosis**:
```bash
# Check if SGI is running
pm2 list | grep sgi
# Should show: sgi online, port 3000

# Check if Nginx points to correct port
grep proxy_pass /etc/nginx/sites-available/sgi.ultimamilla.com.ar
# Should show: proxy_pass http://127.0.0.1:3000;
# NOT: proxy_pass http://127.0.0.1:3456;

# Check MySQL connectivity
mysql -u root -e 'SELECT 1;'
# Should work (root has no password)
```

**Solution**:
```bash
# Check Nginx config
grep 127.0.0.1:3456 /etc/nginx/sites-available/sgi.ultimamilla.com.ar

# If found, fix it
sed -i 's/127.0.0.1:3456/127.0.0.1:3000/g' /etc/nginx/sites-available/sgi.ultimamilla.com.ar

# Validate and reload
nginx -t
systemctl reload nginx

# Restart SGI if needed
pm2 restart sgi
```

**Root Cause (2025-12-15 Incident)**:
- Nginx config had hardcoded port 3456 (legacy config)
- SGI actually runs on port 3000
- Nginx couldn't connect, returned 502

### Issue: Server Running Out of Memory

**Symptoms**:
- Free RAM < 200MB
- Processes start to slow down
- One service may kill another via OOM killer

**Diagnosis**:
```bash
free -h
# If available < 200MB, critical

ps aux --sort=-%mem | head -10
# Check which processes consuming most memory
```

**Current State (2025-12-15)**:
- Total: 3.6GB
- Astro: 100-102MB (HIGH for Node.js)
- SGI: 40-45MB (NORMAL)
- Directus: 17-20MB (NORMAL)
- **Root cause**: Astro's VSZ is 22.8GB (virtual memory reserved)

**Solutions**:
1. **Short-term**: Monitor memory, restart processes if > 85%
2. **Medium-term**: Investigate Astro memory leak
   - Sentry integration may be leaking memory
   - Image processing may reserve too much memory
   - Build may have unused dependencies
3. **Long-term**: Upgrade server RAM from 3.6GB to 8GB

### Issue: PM2 Process Crashed

```bash
# Check what happened
pm2 logs astro-ultimamilla --lines 50

# Restart process
pm2 restart astro-ultimamilla

# Verify it stays online
sleep 5 && pm2 list
```

### Issue: Images Not Loading

**Solution**: Check Directus URL configuration and image UUID mapping in `imageFixer.js`

```typescript
// src/utils/imageFixer.js
export const imageFixMap = {
  'broken-image-id': 'working-url',
  // Add mappings here
};
```

### Issue: Directus API Not Responding

```bash
# Check Docker containers
docker ps | grep postgres

# Restart if needed
cd /root/fumbling-field/directus-admin
docker-compose restart
```

### Issue: Build Failures

```bash
# Clear cache and rebuild
rm -rf dist/ .astro/
npm ci
npm run build
```

---

## Important Documentation

**Must Read Before Making Changes**:
1. `REGLAS_ARQUITECTURA_SERVIDOR.md` - Complete server rules
2. `.windsurf/rules/arquitectura-servidor-reglas.md` - Quick reference
3. `WORKFLOW_GITFLOW.md` - Git Flow workflow
4. `MONITORING_SETUP.md` - Monitoring configuration
5. `IMPLEMENTATION_COMPLETE.md` - System overview
6. `INCIDENT-REPORT-2025-12-15.md` - **CRITICAL INCIDENT DOCUMENTATION**

**Architecture Docs**:
- `ARQUITECTURA_DIRECTUS_BACKEND.md` - Directus integration details
- `BASELINE_PRODUCTION_SYNC_REPORT.md` - Production baseline report

**Recent Critical Issues (2025-12-15)**:
- See `INCIDENT-REPORT-2025-12-15.md` for complete analysis
- Both www.ultimamilla.com.ar and www.sgi.ultimamilla.com.ar went down
- Root causes: Missing ecosystem config + Nginx misconfiguration + memory saturation
- Required actions documented in incident report

---

## Deployment Checklist

Before merging to master:

- [ ] Code builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tested locally with production build (`npm run preview`)
- [ ] PR approved and merged to `develop` first
- [ ] Directus schema changes deployed (if any)
- [ ] Environment variables updated (if needed)
- [ ] Backup exists (automated via CI/CD)

---

## Contact & Support

**Production Server**:
- IP: `23.105.176.45`
- SSH: `ssh ultimamilla` (configured in `~/.ssh/config`)

**Repository**:
- GitHub: https://github.com/martinsantos/um25
- Baseline Tag: `v0.0.1-production-baseline`

**Services**:
- Main: https://www.ultimamilla.com.ar
- Admin: https://admin.ultimamilla.com.ar
- SGI: https://sgi.ultimamilla.com.ar

---

## Final Notes

### Golden Rules

1. **Baseline is Sacred**: `v0.0.1-production-baseline` is immutable
2. **Git Flow is Law**: feature → develop → master (no exceptions)
3. **Production is Read-Only**: Only CI/CD writes to production
4. **Backup Before Change**: No backup = no change
5. **Rollback Over Fix**: In emergencies, rollback first, fix later

### Never Assume

- Always verify changes locally first
- Test with production build before deploying
- Check logs after deployment
- Monitor health checks for 30 minutes post-deploy

**This is a production system with zero-downtime requirements. When in doubt, ask for review before proceeding.**
