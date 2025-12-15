#!/bin/bash

###############################################################################
# ANALYZE MEMORY USAGE
#
# Purpose: Analyze Astro memory consumption and identify memory leaks
# Usage: ./scripts/analyze-memory-usage.sh [--report|--monitor|--help]
#
# This script analyzes:
# 1. Current memory usage
# 2. VSZ vs RSS (virtual vs resident memory)
# 3. Module sizes in node_modules
# 4. Build size analysis
# 5. Dependency analysis
###############################################################################

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_FILE="/tmp/astro-memory-report-$(date +%Y%m%d_%H%M%S).txt"

# Function: Print header
print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# Function: Analyze Astro process
analyze_astro_process() {
    print_header "1. ASTRO PROCESS MEMORY ANALYSIS"

    local pid=$(pm2 pid astro-ultimamilla 2>/dev/null | head -1 || echo "")

    if [ -z "$pid" ] || [ "$pid" == "no pid" ]; then
        echo -e "${YELLOW}⚠️  Astro process not running${NC}"
        return 1
    fi

    echo "Process ID: $pid"
    echo ""

    # Get memory info
    local ps_output=$(ps -p "$pid" -o pid,vsz,rss,comm --no-headers)
    echo "$ps_output" | awk '{
        printf "%-20s %s\n", "Virtual Memory:", ($2/1024) " MB"
        printf "%-20s %s\n", "Resident Memory:", ($3/1024) " MB"
        printf "%-20s %s%%\n", "Memory Ratio:", int(($3/$2)*100)
    }'
    echo ""

    # Get memory maps
    if [ -f "/proc/$pid/maps" ]; then
        echo "Memory segments:"
        cat "/proc/$pid/maps" | awk -F' ' '{
            split($1, range, "-")
            start = strtonum("0x" range[1])
            end = strtonum("0x" range[2])
            size = (end - start) / 1048576  # Convert to MB
            if (size > 10) {  # Show segments > 10MB
                printf "  %6.1f MB - %s\n", size, $NF
            }
        }' | sort -rn | head -10
        echo ""
    fi

    # Comparison with expected
    echo "Expected memory usage:"
    echo "  Astro normal:    50-70 MB"
    echo "  Astro current:   $(($(ps -p "$pid" -o rss --no-headers) / 1024)) MB"
    echo "  Status:          $([ $(ps -p "$pid" -o rss --no-headers) -gt 100000 ] && echo -e "${RED}HIGH${NC}" || echo -e "${GREEN}NORMAL${NC}")"
    echo ""
}

# Function: Analyze build size
analyze_build_size() {
    print_header "2. BUILD SIZE ANALYSIS"

    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}⚠️  dist/ directory not found${NC}"
        return 1
    fi

    echo "Build directory structure:"
    du -sh dist/* 2>/dev/null | sort -rh | head -10
    echo ""
    echo "Total build size:"
    du -sh dist 2>/dev/null
    echo ""

    # Analyze server bundle
    if [ -f "dist/server/entry.mjs" ]; then
        echo "Server entry point:"
        ls -lh dist/server/entry.mjs | awk '{printf "  Size: %s\n", $5}'
        echo ""
    fi
}

# Function: Analyze node_modules
analyze_node_modules() {
    print_header "3. NODE_MODULES ANALYSIS"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  node_modules/ not found${NC}"
        return 1
    fi

    echo "Total node_modules size:"
    du -sh node_modules 2>/dev/null
    echo ""

    echo "Largest packages (top 10):"
    du -sh node_modules/* 2>/dev/null | sort -rh | head -10
    echo ""

    # Count total packages
    local pkg_count=$(ls -d node_modules/*/ 2>/dev/null | wc -l)
    echo "Total packages: $pkg_count"
    echo ""
}

# Function: Analyze Astro-specific packages
analyze_astro_packages() {
    print_header "4. ASTRO DEPENDENCY ANALYSIS"

    echo "Astro ecosystem packages:"
    du -sh node_modules/@astro* 2>/dev/null | sort -rh | head -10 || echo "  (None found)"
    echo ""

    echo "Large dependencies that may impact memory:"
    du -sh node_modules/{sharp,vips,esbuild,rollup,webpack,typescript}/ 2>/dev/null | \
        sort -rh || echo "  (Analysis skipped)"
    echo ""

    # Check for unused packages
    echo "Potentially unused packages (starting with _ or @):"
    ls node_modules/ | grep "^_\|^@" | head -5
    echo ""
}

# Function: Memory optimization recommendations
optimization_recommendations() {
    print_header "5. OPTIMIZATION RECOMMENDATIONS"

    echo "🔍 Issues Found:"
    echo ""

    # Check VSZ issue
    local pid=$(pm2 pid astro-ultimamilla 2>/dev/null | head -1 || echo "")
    if [ -n "$pid" ] && [ "$pid" != "no pid" ]; then
        local vsz=$(ps -p "$pid" -o vsz --no-headers)
        if [ "$vsz" -gt 10000000 ]; then
            echo -e "${RED}✗ VSZ Critical${NC}: $((vsz/1024))MB (expected: ~1000MB)"
            echo "  Cause: Possible memory leak or large memory allocation"
            echo "  Action: Enable Node.js profiling"
            echo ""
        fi
    fi

    # Recommendations
    echo "📋 Recommended Actions (No Cost):"
    echo ""
    echo "1. SHORT-TERM (This week):"
    echo "   • Enable Node.js heap snapshots to identify memory leak"
    echo "     npm install --save-dev clinic"
    echo "   • Profile Astro with: clinic doctor -- npm run preview"
    echo ""
    echo "2. MEDIUM-TERM (This month):"
    echo "   • Remove unused Sentry integration if not needed"
    echo "   • Check astro.config.mjs for heavy integrations"
    echo "   • Tree-shake unused dependencies"
    echo ""
    echo "3. BUILD-TIME:"
    echo "   • Review src/pages/antecedentes/index.astro (may load all items)"
    echo "   • Check image processing pipelines"
    echo "   • Consider lazy loading of collections"
    echo ""
    echo "4. DEPLOYMENT:"
    echo "   • Use ecosystem.config.production.cjs with memory limits"
    echo "   • Enable memory monitoring with memory-alert-monitor.sh"
    echo ""
}

# Function: Generate detailed report
generate_report() {
    print_header "GENERATING DETAILED REPORT"

    {
        echo "═══════════════════════════════════════════════════════════"
        echo "ASTRO MEMORY ANALYSIS REPORT"
        echo "Generated: $(date)"
        echo "═══════════════════════════════════════════════════════════"
        echo ""

        analyze_astro_process 2>&1 || echo "Process analysis skipped"
        analyze_build_size 2>&1 || echo "Build analysis skipped"
        analyze_node_modules 2>&1 || echo "Module analysis skipped"
        analyze_astro_packages 2>&1 || echo "Astro analysis skipped"
        optimization_recommendations 2>&1 || echo "Recommendations skipped"

    } | tee "$REPORT_FILE"

    echo ""
    echo "📄 Report saved to: $REPORT_FILE"
}

# Function: Monitor memory in real-time
monitor_memory() {
    print_header "REAL-TIME MEMORY MONITORING"
    echo "Press Ctrl+C to stop"
    echo ""

    local pid=$(pm2 pid astro-ultimamilla 2>/dev/null | head -1 || echo "")

    if [ -z "$pid" ] || [ "$pid" == "no pid" ]; then
        echo -e "${RED}✗ Astro not running${NC}"
        return 1
    fi

    while true; do
        local memory=$(ps -p "$pid" -o rss --no-headers)
        local timestamp=$(date '+%H:%M:%S')
        local mb=$((memory / 1024))

        if [ "$mb" -gt 100 ]; then
            printf "[%s] %s MB ${RED}(HIGH)${NC}\n" "$timestamp" "$mb"
        elif [ "$mb" -gt 70 ]; then
            printf "[%s] %s MB ${YELLOW}(MEDIUM)${NC}\n" "$timestamp" "$mb"
        else
            printf "[%s] %s MB ${GREEN}(OK)${NC}\n" "$timestamp" "$mb"
        fi

        sleep 5
    done
}

# Function: Show help
show_help() {
    cat <<EOF
Astro Memory Analysis Tool

Usage: $0 [COMMAND]

Commands:
  --report         Generate detailed memory analysis report
  --monitor        Monitor memory in real-time (Press Ctrl+C to stop)
  --help           Show this help message

Examples:
  $0 --report      # Generate full report and save to file
  $0 --monitor     # Watch memory usage live

Report Contents:
  1. Astro process memory analysis
  2. Build size breakdown
  3. node_modules analysis
  4. Astro-specific dependencies
  5. Optimization recommendations

EOF
}

# Main
case "${1:-}" in
    --report)
        generate_report
        ;;
    --monitor)
        monitor_memory
        ;;
    --help|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
