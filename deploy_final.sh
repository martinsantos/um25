#!/bin/bash
export SSHPASS='gsiB%s@0yD'

REMOTE_DIR="/root/fumbling-field"
PM2_ID="19"

echo "Deploying to $REMOTE_DIR..."

# Sync dist folder
# -r for recursive, but dist/ already exists so it will merge/overwrite files inside.
# We might want to clear it first? No, replacing is safer for zero-downtime-ish (though node needs restart to pick up changes usually).
echo "Uploading files..."
sshpass -e scp -o StrictHostKeyChecking=no -r dist/* root@23.105.176.45:$REMOTE_DIR/dist/
sshpass -e scp -o StrictHostKeyChecking=no package.json root@23.105.176.45:$REMOTE_DIR/

# Upload astro.config.mjs and sitemap files if they are needed by server reference?
# Node adapter compiles everything into dist/server/entry.mjs so source files usually aren't needed unless referenced dynamically.
# BUT public/ files needs to be in client/??
# Let's check dist structure locally.
# dist/client -> contains public assets (robots.txt, sitemap-index.xml should be here after build).
# dist/server -> server entry.

# Restart PM2
echo "Restarting Astro Service (ID: $PM2_ID)..."
sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pm2 restart $PM2_ID"

echo "Deployment Complete!"
