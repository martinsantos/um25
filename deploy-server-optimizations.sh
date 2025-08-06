#!/bin/bash

# Deploy Server Optimizations Script
# This script deploys the monitoring and auto-restart configurations

set -e

echo "Deploying server optimizations..."

# 1. Deploy systemd service file
echo "Installing systemd service..."
sudo cp umbot-astro.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable umbot-astro.service
echo "✓ Systemd service installed and enabled"

# 2. Deploy uptime monitoring
echo "Setting up uptime monitoring..."
sudo cp uptime-probe.sh /root/fumbling-field/
sudo chmod +x /root/fumbling-field/uptime-probe.sh

# Add cron entry for uptime monitoring
(crontab -l 2>/dev/null; cat umbot-uptime.cron) | crontab -
echo "✓ Uptime monitoring configured"

# 3. Test the uptime probe
echo "Testing uptime probe..."
bash uptime-probe.sh && echo "✓ Uptime probe working" || echo "⚠ Uptime probe test failed"

# 4. Create log directory if needed
sudo mkdir -p /var/log
sudo touch /var/log/umbot-uptime.log
sudo chmod 644 /var/log/umbot-uptime.log

echo "✓ Server optimizations deployed successfully!"
echo ""
echo "Next steps to complete on server:"
echo "1. Run: sudo systemctl start umbot-astro"
echo "2. Check status: sudo systemctl status umbot-astro"
echo "3. Monitor logs: tail -f /var/log/umbot-uptime.log"
