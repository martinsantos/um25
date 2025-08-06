# Step 5: Rebuild and Restart Docker Containers - Manual Guide

## Current Status
- **Location**: `/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field`
- **Docker Configuration**: Found `docker-compose.yml` with Astro and Directus services
- **Issue**: Docker daemon connectivity problems

## Docker Configuration Analysis

### Services in docker-compose.yml:
1. **database**: PostgreSQL 15-alpine
2. **directus-app**: Directus 11.7.2 (port 8055)
3. **astro-app**: Custom build using `Dockerfile.astro.dev` (port 4321)

## Manual Deployment Commands

### Step 1: Verify Docker is Running
```bash
# Check Docker Desktop status
docker version

# If Docker is not responding, restart Docker Desktop:
# - Close Docker Desktop completely
# - Reopen Docker Desktop application
# - Wait 2-3 minutes for full initialization
```

### Step 2: Check Current Container Status
```bash
# Check what containers are currently running
docker-compose ps

# Check all containers (running and stopped)
docker ps -a
```

### Step 3: Stop Existing Containers
```bash
# Stop all services gracefully
docker-compose down

# If containers are stuck, force stop:
docker-compose down --remove-orphans
```

### Step 4: Rebuild Astro Application
```bash
# Rebuild only the Astro service
docker-compose build astro-app

# Alternative: Rebuild with no cache
docker-compose build --no-cache astro-app
```

### Step 5: Update Directus Image
```bash
# Pull latest Directus image
docker-compose pull directus-app
```

### Step 6: Start All Containers
```bash
# Start all services in detached mode
docker-compose up -d

# Alternative: Start with build flag
docker-compose up -d --build
```

### Step 7: Monitor Startup
```bash
# Check container status
docker-compose ps

# Monitor logs during startup
docker-compose logs -f

# Check specific service logs
docker-compose logs -f astro-app
docker-compose logs -f directus-app
docker-compose logs -f database
```

### Step 8: Verify Services
```bash
# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test connectivity
curl http://localhost:4321  # Astro
curl http://localhost:8055  # Directus
```

## Expected Results

### Successful Deployment Should Show:
- **astro-app**: Running on port 4321
- **directus-app**: Running on port 8055
- **database**: Running internally (no external port)

### Accessible URLs:
- **Astro Frontend**: http://localhost:4321
- **Directus Admin**: http://localhost:8055

## Troubleshooting

### Docker Daemon Issues:
1. Restart Docker Desktop completely
2. Check system resources (RAM/disk space)
3. Check for Docker Desktop updates
4. Try `docker system prune` to clean up resources

### Container Build Issues:
1. Check Dockerfile.astro.dev exists and is valid
2. Ensure all dependencies are properly defined
3. Check available disk space for builds
4. Try building without cache: `--no-cache`

### Port Conflicts:
1. Check if ports 4321 or 8055 are already in use:
   ```bash
   lsof -i :4321
   lsof -i :8055
   ```
2. Kill conflicting processes if found

### Environment Issues:
1. Check .env file exists and has correct values
2. Verify database credentials match between services
3. Check file permissions on mounted volumes

## Alternative Quick Commands

If the full deployment script fails, use these essential commands:

```bash
# Quick restart sequence
docker-compose down && docker-compose build astro-app && docker-compose up -d

# Emergency rebuild everything
docker-compose down --volumes --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Monitor everything
docker-compose logs -f
```

## Post-Deployment Verification

1. **Check all containers are running**:
   ```bash
   docker-compose ps
   ```

2. **Test Astro application**:
   ```bash
   curl -I http://localhost:4321
   ```

3. **Test Directus admin**:
   ```bash
   curl -I http://localhost:8055
   ```

4. **Monitor logs for errors**:
   ```bash
   docker-compose logs --tail=50
   ```

## Files Created
- `deploy-production-step5.sh`: Automated deployment script
- `DEPLOYMENT_MANUAL_STEP5.md`: This manual guide

Execute the script once Docker daemon is accessible, or use the manual commands above.
