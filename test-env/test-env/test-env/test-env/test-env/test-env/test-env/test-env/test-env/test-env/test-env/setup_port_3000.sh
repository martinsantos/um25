#!/bin/bash

echo "Setting up port 3000 installation..."

# Create port-3000 directory if it doesn't exist
mkdir -p port-3000

# Copy necessary files from the original installation
echo "Copying files from 4321 installation to port-3000..."
cp -r src port-3000/
cp -r scripts port-3000/
cp -r public port-3000/
cp package.json port-3000/
cp astro.config.mjs port-3000/
cp tailwind.config.js port-3000/

# Modify astro.config.mjs for port 3000
sed -i '' 's/port: 4321/port: 3000/' port-3000/astro.config.mjs

# Install dependencies and build
echo "Installing dependencies and building application..."
cd port-3000
npm install
# Skip image processing for now as we'll copy the processed images
sed -i '' 's/"build": "npm run process-images && astro build"/"build": "astro build"/' package.json
npm run build
cd ..

# Create directories for Docker volumes
mkdir -p data/port-3000/uploads
mkdir -p data/port-3000/database

echo "Starting port 3000 services..."
docker-compose -f docker-compose.port-3000.yml up -d

echo "Setup complete! The new installation should be available at:"
echo "- Main site: http://localhost:3000"
echo "- Directus: http://localhost:8056"
echo ""
echo "Note: The original installation on port 4321 remains untouched."
