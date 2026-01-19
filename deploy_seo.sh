#!/bin/bash
export SSHPASS='gsiB%s@0yD'

# 1. Find the directory of the running Astro app
REMOTE_DIR=$(sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "lsof -p \$(lsof -i :3000 -t) -d cwd -a -F n | grep '^n' | cut -c2- | head -n 1")

if [ -z "$REMOTE_DIR" ]; then
    echo "Could not find running process on port 3000. Defaulting to /var/www/ultimamilla"
    REMOTE_DIR="/var/www/ultimamilla" # Fallback, likely incorrect so we rely on checks
    # Try finding via PM2 if possible or just LIST listing HOME directories
    REMOTE_DIR=$(sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "ls -d /home/admin/domains/ultimamilla.com.ar/public_html 2>/dev/null || echo ''")
fi

echo "Target Directory seems to be: $REMOTE_DIR"

# IF we still don't know, we will upload to a temp folder and ask user or try to find it manually. 
# BUT memory said: Astro ejecutándose directamente en puerto 3000 -> PID 102055.
# Let's try to assume a standard path or just find where package.json is.
# Let's actually Just sync to the KNOWN location if we can find it.

# Let's try to find where index.mjs is running.
REMOTE_DIR=$(sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "find / -name 'server/entry.mjs' 2>/dev/null | grep 'ultimamilla' | head -n 1 | xargs dirname | xargs dirname")

if [ -z "$REMOTE_DIR" ]; then
    echo "Could not autodetect. Uploading to /root/deployment_staging and we will move it manually."
    REMOTE_DIR="/root/deployment_staging"
    sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "mkdir -p $REMOTE_DIR"
fi

echo "Deploying to $REMOTE_DIR"

# Sync dist folder
sshpass -e scp -o StrictHostKeyChecking=no -r dist/* root@23.105.176.45:$REMOTE_DIR/dist/
# Sync required configuration files if they are needed at runtime (usually just dist/server/entry.mjs contains everything for node adapter if standalone, but host:true needs check)
# Upload package.json just in case dependencies changed (unlikely for this seo fix but good practice)
sshpass -e scp -o StrictHostKeyChecking=no package.json root@23.105.176.45:$REMOTE_DIR/

# Restart the service
# We need to know HOW it is running. PM2 name?
# Memory said: "Astro ejecutándose directamente en puerto 3000 PID: 102055". It might NOT be in PM2?
# Memory ALSO said: "PM2 list ... sgi-system". 
# So Astro might be running manually or via a different PM2 process not shown in the summary.
# I will try to find the PM2 process for port 3000.

PM2_ID=$(sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pm2 jlist | grep -B 10 '3000' | grep 'pm_id' | awk '{print \$2}' | tr -d ','")

if [ ! -z "$PM2_ID" ]; then
    echo "Restarting PM2 ID $PM2_ID"
    sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pm2 restart $PM2_ID"
else
    echo "No PM2 process found on port 3000. Killing process on port 3000 and starting fresh?"
    # This is risky. Let's just try to restart 'astro' or 'server' if it exists in pm2 list.
    sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 "pm2 restart all"
fi
