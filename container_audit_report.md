# Container & Network Topology Audit Report

## Discovered Container Configuration

Based on analysis of docker-compose files, the following containers should be running:

### Production Setup (docker-compose.production.yml)
- **Network**: `um25_network` (bridge driver)
- **Container Names**:
  - `um25_directus` - Directus CMS (port 8055)
  - `um25_astro` - Astro frontend (port 3000) 
  - `um25_database` - PostgreSQL database (internal only)

### SSR Proxy Setup (docker-compose-ssr.yml)
- **Network**: `umbot-network` (external)
- **Container Names**:
  - `umbot-ssr-proxy` - SSR Proxy service (port 8092)

### Development Setup (docker-compose.yml)
- **Network**: `directusnet` (bridge driver)
- **Container Names**:
  - `directus-app` - Directus CMS (port 8055)
  - `astro-app` - Astro frontend (port 4321)
  - `database` - PostgreSQL database (internal only)

## Container Status Check Results

### Docker Daemon Communication Issue
The Docker CLI commands are consistently being interrupted, indicating a communication issue with the Docker daemon. However, network analysis reveals:

### Active Services Analysis (via lsof/netstat)
- **Port 3000**: Active (Docker process) - Likely Astro app
- **Port 4321**: Active (Node.js process) - Development Astro instance  
- **Port 5432**: Active (Docker process) - PostgreSQL database
- **Port 8055**: NOT LISTENING - **Directus service is DOWN**
- **Port 8080/8081**: Active (Docker processes) - Additional services
- **Port 8092/8093**: Not detected - Proxy services likely down

### Critical Issue Identified
**The Directus service (port 8055) is not running**, which explains the API error:
```
API Error (500): {"errors":[{"message":"Cannot read properties of undefined (reading 'primary')","extensions":{"code":"INTERNAL_SERVER_ERROR"}}]}
```

### Attempted Commands (Docker daemon unresponsive)
```bash
# Network inspection commands (FAILED)
docker network ls
docker network inspect um25_network

# Log collection commands (FAILED) 
docker logs --tail 100 astro-app > astro_before.log
docker logs --tail 100 um25_directus > directus_before.log  
docker logs --tail 100 proxy-ssr > proxy_before.log
```

## Immediate Action Required

**CRITICAL**: The Directus CMS service is not running (port 8055), causing the website API to fail.

### Next Steps:
1. **Fix Docker daemon communication** - Docker CLI is unresponsive
2. **Restart Directus service** - Once Docker is accessible, restart the `um25_directus` container
3. **Check container logs** - Investigate why Directus service stopped
4. **Verify network connectivity** - Ensure containers can communicate via `um25_network`

## Detailed Recommendations

1. Verify Docker Desktop is fully started and daemon is accessible
2. Check which compose configuration is currently active (production vs development)
3. Run the network inspection commands once Docker daemon is available
4. Collect logs from running containers to analyze current state
5. **PRIORITY**: Restart the Directus service to restore website functionality

## Log Files Created

- `astro_before.log` - Ready for Astro container logs
- `directus_before.log` - Ready for Directus container logs  
- `proxy_before.log` - Ready for proxy container logs
