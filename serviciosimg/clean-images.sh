#!/bin/bash

# Configuration
SCRIPT_DIR="$(dirname "$0")"
PYTHON_SCRIPT="$SCRIPT_DIR/limpiar_imagenes.py"
REQUIREMENTS="$SCRIPT_DIR/requirements.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎨 Image Cleaning Tool${NC}"
echo "======================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 could not be found.${NC}"
    exit 1
fi

# Function to check if a python module is installed
check_module() {
    python3 -c "import $1" 2>/dev/null
}

# Check for required modules
echo -e "${YELLOW}Checking dependencies...${NC}"
MISSING_DEPS=0

if ! check_module "rembg"; then
    echo -e "${RED}Missing dependency: rembg${NC}"
    MISSING_DEPS=1
fi

if ! check_module "PIL"; then
    echo -e "${RED}Missing dependency: Pillow${NC}"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${YELLOW}Installing missing dependencies...${NC}"
    pip3 install -r "$REQUIREMENTS"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies. Please run 'pip3 install -r $REQUIREMENTS' manually.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Dependencies installed successfully.${NC}"
else
    echo -e "${GREEN}All dependencies met.${NC}"
fi

# Arguments
INPUT_DIR="$1"
OUTPUT_DIR="$2"

if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_DIR" ]; then
    echo -e "\n${YELLOW}Usage: $0 <input_directory> <output_directory>${NC}"
    echo "Example: $0 ./raw_images ./clean_images"
    exit 1
fi

# Run the python script
echo -e "\n${GREEN}Starting processing...${NC}"
python3 "$PYTHON_SCRIPT" "$INPUT_DIR" "$OUTPUT_DIR"
