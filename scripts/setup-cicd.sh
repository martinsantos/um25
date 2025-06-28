#!/bin/bash

# ===========================================
# 🔄 SCRIPT DE CONFIGURACIÓN CI/CD
# ULTiMA MILLA - Fumbling Field Pipeline Setup
# ===========================================

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[SETUP]${NC} $1"
}

# Función para mostrar el banner
show_banner() {
    echo -e "${PURPLE}"
    echo "================================================"
    echo "🔄 CONFIGURACIÓN PIPELINE CI/CD - UMBOT"
    echo "================================================"
    echo -e "${NC}"
    echo "Este script te guiará para configurar el pipeline CI/CD"
    echo "de forma segura y estructurada."
    echo ""
}

# Verificar prerrequisitos
check_prerequisites() {
    log_header "🔍 Verificando prerrequisitos..."
    
    local errors=0
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git no está instalado"
        ((errors++))
    fi
    
    # Verificar que estamos en un repositorio Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "No estamos en un repositorio Git"
        ((errors++))
    fi
    
    # Verificar que existe el workflow
    if [[ ! -f "$PROJECT_ROOT/.github/workflows/ci-cd.yml" ]]; then
        log_error "No se encontró el archivo de workflow CI/CD"
        ((errors++))
    fi
    
    # Verificar archivos Docker
    if [[ ! -f "$PROJECT_ROOT/Dockerfile.astro.prod" ]]; then
        log_error "No se encontró Dockerfile.astro.prod"
        ((errors++))
    fi
    
    if [[ ! -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        log_error "No se encontró docker-compose.prod.yml"
        ((errors++))
    fi
    
    # Verificar script de deploy
    if [[ ! -f "$PROJECT_ROOT/scripts/deploy-automated.sh" ]]; then
        log_error "No se encontró scripts/deploy-automated.sh"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Todos los prerrequisitos están cumplidos"
    else
        log_error "Se encontraron $errors errores. Corrige antes de continuar."
        exit 1
    fi
}

# Generar clave SSH para GitHub Actions
generate_ssh_key() {
    log_header "🔑 Configuración de clave SSH..."
    
    local ssh_dir="$HOME/.ssh"
    local key_name="github-actions-umbot"
    local key_path="$ssh_dir/$key_name"
    
    # Crear directorio SSH si no existe
    mkdir -p "$ssh_dir"
    chmod 700 "$ssh_dir"
    
    if [[ -f "$key_path" ]]; then
        log_warning "Ya existe una clave SSH en $key_path"
        read -p "¿Deseas generar una nueva clave? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Usando clave existente"
            show_ssh_instructions "$key_path"
            return
        fi
    fi
    
    log_info "Generando nueva clave SSH para GitHub Actions..."
    ssh-keygen -t rsa -b 4096 -C "github-actions@umbot.com.ar" -f "$key_path" -N ""
    
    log_success "Clave SSH generada en: $key_path"
    
    show_ssh_instructions "$key_path"
}

# Mostrar instrucciones para configurar SSH
show_ssh_instructions() {
    local key_path="$1"
    local pub_key_path="${key_path}.pub"
    
    echo -e "${YELLOW}"
    echo "================================================"
    echo "🔧 INSTRUCCIONES DE CONFIGURACIÓN SSH"
    echo "================================================"
    echo -e "${NC}"
    
    log_info "1. Instalar clave pública en el servidor:"
    echo "   Copia esta clave pública al servidor:"
    echo ""
    echo -e "${GREEN}"
    cat "$pub_key_path"
    echo -e "${NC}"
    echo ""
    echo "   Comando para instalarla en el servidor:"
    echo -e "${BLUE}   ssh-copy-id -i $pub_key_path root@23.105.176.45${NC}"
    echo ""
    
    log_info "2. Para GitHub Secrets (SSH_PRIVATE_KEY):"
    echo "   Copia el contenido completo de la clave privada:"
    echo ""
    echo -e "${YELLOW}   ===== COPIAR DESDE AQUÍ =====${NC}"
    cat "$key_path"
    echo -e "${YELLOW}   ===== HASTA AQUÍ =====${NC}"
    echo ""
    
    read -p "Presiona ENTER cuando hayas configurado la clave en el servidor..."
}

# Probar conectividad SSH
test_ssh_connection() {
    log_header "🔗 Probando conectividad SSH..."
    
    local host="23.105.176.45"
    local user="root"
    
    if ssh -o BatchMode=yes -o ConnectTimeout=10 "$user@$host" 'exit 0' 2>/dev/null; then
        log_success "Conectividad SSH funcionando correctamente"
        return 0
    else
        log_error "No se puede conectar al servidor via SSH"
        log_info "Verifica que:"
        echo "  - La clave pública esté instalada en el servidor"
        echo "  - El servidor esté accesible"
        echo "  - El puerto SSH (22) esté abierto"
        return 1
    fi
}

# Mostrar guía de configuración de secrets
show_secrets_guide() {
    log_header "🔐 Configuración de GitHub Secrets"
    
    echo -e "${YELLOW}"
    echo "================================================"
    echo "🔧 CONFIGURAR SECRETS EN GITHUB"
    echo "================================================"
    echo -e "${NC}"
    
    echo "Ve a: GitHub > Tu Repositorio > Settings > Secrets and variables > Actions"
    echo ""
    echo "Agrega los siguientes Repository secrets:"
    echo ""
    
    echo -e "${GREEN}1. DOCKERHUB_USERNAME${NC}"
    echo "   Valor: tu_usuario_dockerhub"
    echo ""
    
    echo -e "${GREEN}2. DOCKERHUB_TOKEN${NC}"
    echo "   Valor: dckr_pat_xxxxxxxxxxxxx"
    echo "   (Generar en: Docker Hub > Account Settings > Security > Access Tokens)"
    echo ""
    
    echo -e "${GREEN}3. SSH_PRIVATE_KEY${NC}"
    echo "   Valor: [clave privada SSH mostrada anteriormente]"
    echo ""
    
    echo -e "${BLUE}4. SLACK_WEBHOOK_URL (Opcional)${NC}"
    echo "   Valor: https://hooks.slack.com/services/..."
    echo ""
    
    read -p "Presiona ENTER cuando hayas configurado todos los secrets..."
}

# Crear rama de testing
create_test_branch() {
    log_header "🌿 Creando rama de testing..."
    
    local test_branch="test-ci-cd-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Creando rama: $test_branch"
    git checkout -b "$test_branch"
    
    log_info "Subiendo rama al repositorio remoto..."
    git push -u origin "$test_branch"
    
    log_success "Rama de testing creada: $test_branch"
    
    # Modificar workflow temporalmente para testing
    log_info "Configurando workflow para testing..."
    modify_workflow_for_testing "$test_branch"
    
    echo "CURRENT_TEST_BRANCH=$test_branch" > "$PROJECT_ROOT/.cicd-test-info"
}

# Modificar workflow para testing
modify_workflow_for_testing() {
    local test_branch="$1"
    local workflow_file="$PROJECT_ROOT/.github/workflows/ci-cd.yml"
    
    # Crear backup del workflow original
    cp "$workflow_file" "$workflow_file.backup"
    
    # Modificar triggers para solo ejecutar en la rama de testing
    sed -i.tmp "s/branches: \[ main, develop \]/branches: [ $test_branch ]/" "$workflow_file"
    rm -f "$workflow_file.tmp"
    
    log_info "Workflow modificado para ejecutar solo en rama: $test_branch"
}

# Ejecutar test inicial del pipeline
run_initial_test() {
    log_header "🧪 Ejecutando test inicial del pipeline..."
    
    # Hacer un cambio menor para triggerar el pipeline
    echo "# Pipeline CI/CD Test - $(date)" >> "$PROJECT_ROOT/README.md"
    
    git add README.md
    git commit -m "test: Activar pipeline CI/CD - Test inicial"
    git push origin "$(git branch --show-current)"
    
    log_success "Test inicial enviado al pipeline"
    
    echo -e "${YELLOW}"
    echo "================================================"
    echo "🔍 VERIFICAR EJECUCIÓN DEL PIPELINE"
    echo "================================================"
    echo -e "${NC}"
    echo "1. Ve a GitHub > Tu Repositorio > Actions"
    echo "2. Verifica que se esté ejecutando el workflow"
    echo "3. Revisa los logs de cada job"
    echo "4. Confirma que el despliegue sea exitoso"
    echo ""
    
    read -p "Presiona ENTER cuando el pipeline haya terminado de ejecutarse..."
}

# Probar rollback
test_rollback() {
    log_header "🔄 Probando mecanismo de rollback..."
    
    read -p "¿Deseas probar el rollback automático? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Saltando test de rollback"
        return
    fi
    
    log_warning "Introduciendo error intencional para probar rollback..."
    
    # Modificar package.json para que falle un test
    local package_file="$PROJECT_ROOT/package.json"
    cp "$package_file" "$package_file.backup"
    
    # Agregar script que falle
    sed -i.tmp 's/"test": ".*"/"test": "exit 1"/' "$package_file"
    rm -f "$package_file.tmp"
    
    git add package.json
    git commit -m "test: Probar rollback automático (error intencional)"
    git push origin "$(git branch --show-current)"
    
    log_info "Error introducido, el pipeline debería fallar y ejecutar rollback"
    
    read -p "Presiona ENTER cuando el rollback haya terminado..."
    
    # Restaurar package.json
    mv "$package_file.backup" "$package_file"
    git add package.json
    git commit -m "fix: Restaurar package.json después del test de rollback"
    git push origin "$(git branch --show-current)"
    
    log_success "Test de rollback completado"
}

# Activar pipeline para main
activate_for_main() {
    log_header "🚀 Activando pipeline para rama main..."
    
    read -p "¿Todo funcionó correctamente en los tests? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Completa los tests antes de activar en main"
        return 1
    fi
    
    # Restaurar workflow original
    local workflow_file="$PROJECT_ROOT/.github/workflows/ci-cd.yml"
    if [[ -f "$workflow_file.backup" ]]; then
        mv "$workflow_file.backup" "$workflow_file"
        log_info "Workflow restaurado a configuración original"
    fi
    
    # Hacer merge a main
    git add .github/workflows/ci-cd.yml
    git commit -m "feat: Activar pipeline CI/CD para main"
    git push origin "$(git branch --show-current)"
    
    log_info "Cambiando a rama main..."
    git checkout main
    git pull origin main
    
    log_info "Haciendo merge de la rama de testing..."
    local test_branch
    if [[ -f "$PROJECT_ROOT/.cicd-test-info" ]]; then
        test_branch=$(grep CURRENT_TEST_BRANCH "$PROJECT_ROOT/.cicd-test-info" | cut -d'=' -f2)
        git merge "$test_branch"
    else
        read -p "Nombre de la rama de testing: " test_branch
        git merge "$test_branch"
    fi
    
    git push origin main
    
    log_success "Pipeline CI/CD activado para rama main"
    
    # Limpiar archivos temporales
    rm -f "$PROJECT_ROOT/.cicd-test-info"
    
    echo -e "${GREEN}"
    echo "================================================"
    echo "🎉 PIPELINE CI/CD ACTIVADO EXITOSAMENTE"
    echo "================================================"
    echo -e "${NC}"
    echo "A partir de ahora, cada push a main ejecutará automáticamente:"
    echo "• Lint y validación de código"
    echo "• Tests unitarios e integración"
    echo "• Build de la aplicación"
    echo "• Build y push de imagen Docker"
    echo "• Despliegue automático a producción"
    echo "• Health checks y verificaciones"
    echo "• Rollback automático en caso de fallo"
    echo ""
}

# Mostrar status final
show_final_status() {
    log_header "📊 Status final del pipeline CI/CD"
    
    echo -e "${GREEN}"
    echo "================================================"
    echo "✅ CONFIGURACIÓN COMPLETADA"
    echo "================================================"
    echo -e "${NC}"
    
    echo "Tu pipeline CI/CD está configurado y funcionando:"
    echo ""
    echo "🔍 Monitoreo:"
    echo "  • GitHub Actions: Ir a repositorio > Actions"
    echo "  • Logs de despliegue: SSH al servidor y revisar logs"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "  • Ver estado: ssh root@23.105.176.45 'docker ps'"
    echo "  • Ver logs: ssh root@23.105.176.45 'docker-compose logs'"
    echo "  • Health check: curl -I https://www.umbot.com.ar/"
    echo ""
    echo "📋 Próximos pasos:"
    echo "  • Configurar notificaciones Slack (opcional)"
    echo "  • Establecer monitoreo continuo"
    echo "  • Documentar proceso para el equipo"
    echo ""
    
    log_success "¡Pipeline CI/CD de UMBot configurado exitosamente!"
}

# Función principal
main() {
    show_banner
    
    # Verificar prerrequisitos
    check_prerequisites
    
    # Generar y configurar SSH
    generate_ssh_key
    
    # Probar conectividad SSH
    if ! test_ssh_connection; then
        log_error "Configura SSH antes de continuar"
        exit 1
    fi
    
    # Mostrar guía de secrets
    show_secrets_guide
    
    # Crear rama de testing
    create_test_branch
    
    # Ejecutar test inicial
    run_initial_test
    
    # Probar rollback
    test_rollback
    
    # Activar para main
    if activate_for_main; then
        show_final_status
    else
        log_warning "Pipeline no activado para main. Completa los tests primero."
    fi
}

# Ejecutar función principal
main "$@" 