#!/bin/bash

# Step 5: Rebuild and restart Docker containers for production
# Execute this script once Docker daemon is fully accessible

echo "=== Production Deployment - Step 5 ==="
echo "Location: $(pwd)"
echo "Timestamp: $(date)"
echo

# Wait for Docker daemon to be ready
echo "Step 1: Waiting for Docker daemon to be ready..."
count=0
while ! docker info >/dev/null 2>&1; do
    if [ $count -ge 40 ]; then
        echo "Docker daemon timeout - please check Docker Desktop"
        exit 1
    fi
    echo "Waiting for Docker daemon..."
    sleep 3
    count=$((count + 1))
done
echo "Docker is ready!"
echo

# Check current containers status
echo "Step 2: Checking current containers status..."
echo "Current running containers:"
docker-compose ps || echo "No containers currently running"
echo

# Stop existing containers gracefully
echo "Step 3: Stopping existing containers..."
docker-compose down
echo "Containers stopped."
echo

# Rebuild the Astro application
echo "Step 4: Rebuilding Astro application..."
docker-compose build astro-app
echo "Astro application rebuilt."
echo

# Optionally rebuild Directus if needed
echo "Step 5: Checking if Directus needs rebuilding..."
# Since Directus uses a pre-built image, we'll just ensure it's up to date
docker-compose pull directus-app
echo

# Start all containers in detached mode
echo "Step 6: Starting all containers..."
docker-compose up -d
echo "Containers started in detached mode."
echo

# Wait a moment for containers to initialize
echo "Step 7: Waiting for containers to initialize..."
sleep 10
echo

# Check final status
echo "Step 8: Verifying container status..."
docker-compose ps
echo

# Check container logs for any immediate errors
echo "Step 9: Checking logs for errors..."
echo "=== Astro Application Logs ==="
docker-compose logs --tail=20 astro-app
echo
echo "=== Directus Application Logs ==="
docker-compose logs --tail=20 directus-app
echo
echo "=== Database Logs ==="
docker-compose logs --tail=20 database
echo

# Final verification
echo "Step 10: Final verification..."
echo "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== Deployment Complete ==="
echo "Astro should be accessible at: http://localhost:4321"
echo "Directus should be accessible at: http://localhost:8055"
echo
echo "To monitor logs continuously, run:"
echo "docker-compose logs -f"
echo
echo "To check individual service logs:"
echo "docker-compose logs -f astro-app"
echo "docker-compose logs -f directus-app"
echo "docker-compose logs -f database"
