#!/bin/bash

# Pre-deployment Checklist for ULTIMA MILLA CLI
# Version: 1.0.0

echo "🚀 ULTIMA MILLA CLI - Pre-deployment Check"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check functions
check_passed=0
check_failed=0

function check_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((check_passed++))
}

function check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

function check_error() {
    echo -e "${RED}✗${NC} $1"
    ((check_failed++))
}

function check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Environment Check
echo -e "${BLUE}1. Environment Verification${NC}"
echo "─────────────────────────────"

# Check Node.js version
if command -v node >/dev/null 2>&1; then
    node_version=$(node --version)
    check_success "Node.js version: $node_version"
else
    check_error "Node.js not found"
fi

# Check npm version
if command -v npm >/dev/null 2>&1; then
    npm_version=$(npm --version)
    check_success "npm version: $npm_version"
else
    check_error "npm not found"
fi

# Check if we're in the correct directory
if [ -f "package.json" ]; then
    project_name=$(node -p "require('./package.json').name")
    check_success "Project: $project_name"
else
    check_error "Not in project root directory (package.json not found)"
fi

echo ""

# 2. Dependencies Check
echo -e "${BLUE}2. Dependencies Verification${NC}"
echo "──────────────────────────────"

if [ -d "node_modules" ]; then
    check_success "node_modules directory exists"
    
    # Check for critical packages
    critical_packages=("astro" "@astrojs/node" "sharp")
    for package in "${critical_packages[@]}"; do
        if [ -d "node_modules/$package" ]; then
            check_success "Package $package installed"
        else
            check_error "Critical package $package missing"
        fi
    done
else
    check_error "node_modules directory not found - run npm install"
fi

echo ""

# 3. Build Verification
echo -e "${BLUE}3. Build Process Check${NC}"
echo "─────────────────────────────"

echo "Running build process..."
if npm run build > /tmp/build.log 2>&1; then
    check_success "Build completed successfully"
else
    check_error "Build failed - check /tmp/build.log for details"
    echo "Build log:"
    tail -10 /tmp/build.log
fi

# Check if dist directory was created
if [ -d "dist" ]; then
    dist_size=$(du -sh dist | cut -f1)
    check_success "dist directory created (size: $dist_size)"
else
    check_error "dist directory not found after build"
fi

echo ""

# 4. File Structure Check
echo -e "${BLUE}4. Required Files Verification${NC}"
echo "────────────────────────────────"

required_files=(
    "public/terminalEnhanced.js"
    "public/uiEffectsSystem.js"
    "public/performanceOptimizer.js"
    "public/contactSystem.js"
    "public/dataNavigationEngine.js"
    "public/uiEffects.css"
    "public/sw.js"
    "public/offline.html"
    "public/manifest.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        file_size=$(du -h "$file" | cut -f1)
        check_success "$file ($file_size)"
    else
        check_error "$file missing"
    fi
done

echo ""

# 5. Configuration Check
echo -e "${BLUE}5. Configuration Verification${NC}"
echo "───────────────────────────────"

# Check astro.config.mjs
if [ -f "astro.config.mjs" ]; then
    check_success "astro.config.mjs exists"
    if grep -q "@astrojs/node" astro.config.mjs; then
        check_success "Node.js adapter configured"
    else
        check_warning "Node.js adapter not found in config"
    fi
else
    check_error "astro.config.mjs not found"
fi

# Check package.json scripts
if grep -q "build:production" package.json; then
    check_success "build:production script available"
else
    check_warning "build:production script not found"
fi

echo ""

# 6. Git Status Check
echo -e "${BLUE}6. Version Control Status${NC}"
echo "────────────────────────────────"

if command -v git >/dev/null 2>&1; then
    # Check if we're in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        check_success "Git repository detected"
        
        # Check current branch
        current_branch=$(git branch --show-current)
        check_info "Current branch: $current_branch"
        
        # Check for uncommitted changes
        if git diff-index --quiet HEAD --; then
            check_success "No uncommitted changes"
        else
            check_warning "Uncommitted changes detected"
            echo "Modified files:"
            git diff --name-only HEAD
        fi
        
        # Check for untracked files
        untracked=$(git ls-files --others --exclude-standard)
        if [ -z "$untracked" ]; then
            check_success "No untracked files"
        else
            check_warning "Untracked files detected:"
            echo "$untracked"
        fi
        
    else
        check_warning "Not in a git repository"
    fi
else
    check_warning "Git not available"
fi

echo ""

# 7. Production Readiness Check
echo -e "${BLUE}7. Production Readiness${NC}"
echo "─────────────────────────────"

# Check for production environment variables
if [ -f ".env" ] || [ -f ".env.production" ]; then
    check_success "Environment configuration files found"
else
    check_warning "No environment configuration files found"
fi

# Check if service worker is valid
if [ -f "public/sw.js" ]; then
    if grep -q "CACHE_NAME" public/sw.js; then
        check_success "Service Worker appears valid"
    else
        check_warning "Service Worker may be incomplete"
    fi
fi

# Check manifest.json
if [ -f "public/manifest.json" ]; then
    if command -v jq >/dev/null 2>&1; then
        if jq empty public/manifest.json 2>/dev/null; then
            check_success "manifest.json is valid JSON"
        else
            check_error "manifest.json is invalid JSON"
        fi
    else
        check_info "jq not available - cannot validate manifest.json"
    fi
fi

echo ""

# 8. Security Check
echo -e "${BLUE}8. Security Verification${NC}"
echo "────────────────────────────"

# Check for sensitive information
sensitive_patterns=("password" "secret" "api_key" "token")
for pattern in "${sensitive_patterns[@]}"; do
    if grep -r -i "$pattern" src/ public/ --exclude-dir=node_modules 2>/dev/null | grep -v ".git" | head -1 >/dev/null; then
        check_warning "Potential sensitive information found for: $pattern"
    else
        check_success "No obvious sensitive information for: $pattern"
    fi
done

echo ""

# Final Summary
echo -e "${BLUE}Summary${NC}"
echo "─────────"
echo -e "Checks passed: ${GREEN}$check_passed${NC}"
echo -e "Checks failed: ${RED}$check_failed${NC}"

if [ $check_failed -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All critical checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit any pending changes to git"
    echo "2. Push changes to repository"
    echo "3. SSH to production server"
    echo "4. Pull latest changes"
    echo "5. Run production build"
    echo "6. Restart services"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some checks failed. Please resolve issues before deployment.${NC}"
    echo ""
    exit 1
fi
