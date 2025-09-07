#!/bin/bash

# Production Deployment Script for ULTIMA MILLA CLI
# Server: root@23.105.176.45
# Version: 1.0.0

echo "🚀 ULTIMA MILLA CLI - Production Deployment"
echo "============================================"
echo ""

# Configuration
SERVER="root@23.105.176.45"
PROJECT_PATH="/root/fumbling-field"
BRANCH="main"
BACKUP_DIR="/root/backup"
SERVICE_NAME="fumbling-field"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

function log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

function log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we can connect to server
log_info "Testing connection to production server..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER exit 2>/dev/null; then
    log_success "Connection to $SERVER established"
else
    log_error "Cannot connect to $SERVER"
    echo "Please check:"
    echo "1. SSH key is properly configured"
    echo "2. Server is accessible"
    echo "3. Firewall settings allow connection"
    exit 1
fi

# Create deployment command script
DEPLOY_COMMANDS=$(cat << 'EOF'
#!/bin/bash

# Production deployment commands
set -e

PROJECT_PATH="/root/fumbling-field"
BACKUP_DIR="/root/backup"
SERVICE_NAME="fumbling-field"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting deployment process..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup of current version
if [ -d "$PROJECT_PATH" ]; then
    echo "📦 Creating backup of current version..."
    cp -r $PROJECT_PATH $BACKUP_DIR/fumbling-field_$TIMESTAMP
    echo "✓ Backup created: $BACKUP_DIR/fumbling-field_$TIMESTAMP"
fi

# Navigate to project directory
cd $PROJECT_PATH || {
    echo "❌ Project directory not found: $PROJECT_PATH"
    exit 1
}

echo "📥 Pulling latest changes from repository..."

# Fetch latest changes
git fetch origin

# Check if there are new commits
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL = $REMOTE ]; then
    echo "⚠️  No new changes to deploy"
else
    echo "🔄 New changes detected, updating..."
    
    # Pull latest changes
    git pull origin main
    
    echo "📦 Installing/updating dependencies..."
    npm ci --only=production
    
    echo "🏗️  Building project for production..."
    npm run build
    
    # Check if build was successful
    if [ $? -eq 0 ]; then
        echo "✅ Build completed successfully"
    else
        echo "❌ Build failed, rolling back..."
        git reset --hard $LOCAL
        exit 1
    fi
fi

# Check if PM2 is installed
if command -v pm2 >/dev/null 2>&1; then
    echo "🔄 Managing services with PM2..."
    
    # Check if service is already running
    if pm2 describe $SERVICE_NAME > /dev/null 2>&1; then
        echo "🔄 Restarting existing service..."
        pm2 restart $SERVICE_NAME
        pm2 save
    else
        echo "🚀 Starting new service..."
        pm2 start npm --name $SERVICE_NAME -- start
        pm2 save
    fi
    
    # Show service status
    pm2 status
    
elif command -v docker-compose >/dev/null 2>&1; then
    echo "🐳 Managing services with Docker..."
    
    # Check for docker-compose files
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.prod.yml" ]; then
        echo "🔄 Restarting Docker services..."
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || docker-compose down
        docker-compose -f docker-compose.prod.yml up -d --build 2>/dev/null || docker-compose up -d --build
        
        # Show service status
        docker-compose ps
    else
        echo "⚠️  No docker-compose files found"
    fi
    
else
    echo "⚠️  No service manager found (PM2 or Docker)"
    echo "🚀 Starting application directly..."
    
    # Kill existing process if running
    pkill -f "npm start" || true
    pkill -f "node" || true
    
    # Start in background
    nohup npm start > /root/logs/app.log 2>&1 &
    echo "✅ Application started"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📊 Deployment summary:"
echo "   - Time: $(date)"
echo "   - Commit: $(git rev-parse --short HEAD)"
echo "   - Branch: $(git branch --show-current)"
echo ""

# Basic health check
echo "🏥 Performing basic health check..."
sleep 5

# Check if port is responding (assuming the app runs on port 3000 or 4321)
for port in 4321 3000 80 443; do
    if netstat -tuln | grep ":$port " > /dev/null; then
        echo "✅ Service responding on port $port"
        break
    fi
done

echo "✅ Deployment verification completed"
EOF
)

# Transfer and execute deployment script
log_info "Transferring deployment script to server..."
echo "$DEPLOY_COMMANDS" | ssh $SERVER 'cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh'

log_info "Executing deployment on production server..."
ssh -t $SERVER '/tmp/deploy.sh'

if [ $? -eq 0 ]; then
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Your enhanced terminal should now be live at:"
    echo "   https://ultimamilla.com.ar/"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Verify the site is loading correctly"
    echo "2. Test the enhanced terminal functionality"  
    echo "3. Check all new commands (performance, cache, memory, theme)"
    echo "4. Test on mobile devices"
    echo "5. Verify offline functionality"
    echo ""
else
    log_error "Deployment failed"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check server logs: ssh $SERVER 'tail -f /root/logs/app.log'"
    echo "2. Check service status: ssh $SERVER 'pm2 status' or 'docker-compose ps'"
    echo "3. Manual rollback if needed: ssh $SERVER 'cp -r $BACKUP_DIR/fumbling-field_* $PROJECT_PATH'"
    echo ""
    exit 1
fi

# Cleanup
ssh $SERVER 'rm -f /tmp/deploy.sh'

echo "🧹 Cleanup completed"
echo "🎉 Deployment process finished!"
