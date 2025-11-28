/**
 * Enhanced Terminal Engine for UM CLI
 * Features: Typing animations, ASCII art, improved UX, responsive design
 * Version: 2.0.0
 */

// Import DataNavigationEngine (will be loaded dynamically)
let DataNavigationEngine = null;

class EnhancedTerminal {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.prompt = document.getElementById('terminal-prompt');
        this.cursor = document.getElementById('terminal-cursor');
        this.suggestions = document.getElementById('input-suggestions');
        this.loading = document.getElementById('loading-overlay');
        
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentUser = 'visitante';
        this.currentPath = '~';
        
        // Data navigation engine
        this.dataEngine = null;
        this.isDataEngineReady = false;
        
        // Contact system
        this.contactSystem = null;
        this.isContactSystemReady = false;
        
        // UI Effects system
        this.uiEffects = null;
        this.isUIEffectsReady = false;
        
        // Performance Optimizer system
        this.performanceOptimizer = null;
        this.isPerformanceOptimizerReady = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeWelcome();
        this.loadDataNavigationEngine();
        this.loadContactSystem();
        this.loadUIEffectsSystem();
        this.loadPerformanceOptimizer();
        this.loadCommands();
        this.focusInput();
    }

    setupEventListeners() {
        // Input handling
        this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));

        // Terminal control buttons
        const controls = this.container.querySelectorAll('.um-control');
        controls.forEach(control => {
            control.addEventListener('click', this.handleControlClick.bind(this));
        });

        // Click to focus
        this.container.addEventListener('click', this.focusInput.bind(this));

        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    async initializeWelcome() {
        // Generate ASCII art
        const asciiArt = this.generateASCIIArt();
        const asciiElement = document.getElementById('welcome-ascii');
        if (asciiElement) {
            await this.typeText(asciiElement, asciiArt, 20);
        }

        // Animate welcome lines with staggered timing
        const welcomeLines = document.querySelectorAll('.welcome-line');
        welcomeLines.forEach((line, index) => {
            const delay = parseInt(line.dataset.delay) || 0;
            setTimeout(() => {
                line.classList.add('visible');
            }, delay);
        });
    }

    generateASCIIArt() {
        return `
 █    ██  ██       ████████ ██ ███    ███  █████      ███    ███ ██ ██       ██       █████  
 ██   ██  ██          ██    ██ ████  ████ ██   ██     ████  ████ ██ ██       ██      ██   ██ 
 ██   ██  ██          ██    ██ ██ ████ ██ ███████     ██ ████ ██ ██ ██       ██      ███████ 
 ██   ██  ██          ██    ██ ██  ██  ██ ██   ██     ██  ██  ██ ██ ██       ██      ██   ██ 
  █████   ███████     ██    ██ ██      ██ ██   ██     ██      ██ ██ ███████ ███████  ██   ██ 
                                                                                              
        ═══════════════════════════════════════════════════════════════════════
        ║  🏢 EMPRESA TECNOLÓGICA LÍDER EN MENDOZA DESDE 2002  📍           ║
        ║  🚀 DESARROLLO WEB • APPS • SISTEMAS EMPRESARIALES • MARKETING    ║
        ══════════════════════════════════════════════════════════════════════`;
    }

    async typeText(element, text, speed = 50) {
        return new Promise(resolve => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.executeCommand();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateHistory('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateHistory('down');
                break;
            case 'Tab':
                event.preventDefault();
                this.handleAutocomplete();
                break;
            case 'Escape':
                this.clearSuggestions();
                break;
        }
    }

    handleInput(event) {
        const value = event.target.value;
        this.showSuggestions(value);
        this.updateCursorPosition();
    }

    handleFocus() {
        this.container.classList.add('focused');
        this.cursor.style.display = 'block';
    }

    handleBlur() {
        this.container.classList.remove('focused');
        // Keep cursor visible for UX
    }

    handleControlClick(event) {
        const action = event.target.dataset.action;
        switch (action) {
            case 'close':
                this.minimizeTerminal();
                break;
            case 'minimize':
                this.minimizeTerminal();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
        }
    }

    handleResize() {
        // Adjust terminal layout on resize
        this.updateLayout();
    }

    focusInput() {
        if (this.input) {
            this.input.focus();
        }
    }

    updateCursorPosition() {
        // Position custom cursor at end of input
        const inputValue = this.input.value;
        const textWidth = this.getTextWidth(inputValue);
        this.cursor.style.left = textWidth + 'px';
    }

    getTextWidth(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(this.input);
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        return context.measureText(text).width;
    }

    async executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;

        // Add to history
        this.commandHistory.unshift(command);
        this.historyIndex = -1;

        // Display command in output
        this.addCommandToOutput(command);

        // Clear input
        this.input.value = '';
        this.clearSuggestions();

        // Show loading if needed
        this.showLoading();

        try {
            // Process command
            const result = await this.processCommand(command);
            this.addOutputToTerminal(result);
        } catch (error) {
            this.addErrorToOutput(error.message);
        } finally {
            this.hideLoading();
            this.scrollToBottom();
            this.focusInput();
        }
    }

    async processCommand(command) {
        const [cmd, ...args] = command.split(' ');
        
        // Enhanced command processing with better UX
        switch (cmd.toLowerCase()) {
            case 'help':
            case 'ayuda':
                return this.getHelpText();
            
            case 'clear':
            case 'cls':
                return this.clearOutput();
            
            case 'sudo':
                return this.handleSudoCommand(args);
            
            case 'ls':
            case 'dir':
                return this.listDirectory(args);
            
            case 'cd':
                return this.changeDirectory(args);
            
            case 'pwd':
                return this.getCurrentDirectory();
            
            case 'whoami':
                return this.getCurrentUser();
            
            case 'date':
                return this.getDate();
            
            case 'echo':
                return args.join(' ');
            
            case 'historia':
            case 'history':
                return this.getCommandHistory();
            
            case 'contacto':
            case 'contact':
                return await this.handleEnhancedContactCommand(args);
            
            case 'form-data':
                return await this.handleFormDataCommand(args);
            
            case 'servicios':
            case 'services':
                return await this.getServiciosData();
            
            case 'antecedentes':
            case 'casos':
            case 'projects':
                return await this.getAntecedentesData();
            
            case 'stats':
            case 'estadisticas':
                return this.getStats();
            
            case 'theme':
                return this.handleThemeCommand(args);
            
            case 'performance':
            case 'perf':
                return this.handlePerformanceCommand(args);
                
            case 'cache':
                return this.handleCacheCommand(args);
                
            case 'memory':
                return this.handleMemoryCommand();
            
            case 'fullscreen':
                this.toggleFullscreen();
                return 'Modo pantalla completa activado/desactivado';
            
            case 'explore':
                return await this.handleExploreCommand(args);
            
            case 'filter':
                return await this.handleFilterCommand(args);
            
            case 'details':
                return await this.handleDetailsCommand(args);
            
            case 'navigate':
                return await this.handleNavigateCommand(args);
                
            case 'back':
                return await this.handleBackCommand();
                
            case 'export':
                return this.handleExportCommand(args);
                
            case 'clear-filters':
                return this.handleClearFiltersCommand();
            
            default:
                return this.getUnknownCommandHelp(cmd);
        }
    }

    getHelpText() {
        return `
<div class="command-success">
═══════════════════════════════════════════════════════════════
                    🚀 ULTIMA MILLA CLI v22.0 - COMANDOS
═══════════════════════════════════════════════════════════════

📁 NAVEGACIÓN Y SISTEMA:
  • help, ayuda           - Muestra esta ayuda
  • clear, cls            - Limpia la pantalla
  • ls, dir               - Lista contenido del directorio
  • cd [directorio]       - Cambia de directorio
  • pwd                   - Muestra directorio actual
  • whoami               - Usuario actual
  • date                 - Fecha y hora actual
  • history              - Historial de comandos

🏢 INFORMACIÓN EMPRESARIAL:
  • servicios            - Lista todos los servicios
  • antecedentes         - Casos de éxito y proyectos
  • stats                - Estadísticas de la empresa
  • contacto             - Información de contacto

📊 NAVEGACIÓN AVANZADA DE DATOS:
  • explore [ruta]       - Explorar estructura de datos
  • navigate [ruta]      - Navegar a ubicación específica
  • filter [criterios]   - Filtrar datos (ej: cliente:gobierno)
  • details [id]         - Ver detalles completos de un elemento
  • back                 - Volver al directorio anterior
  • clear-filters        - Limpiar filtros activos
  • export               - Exportar datos (en desarrollo)

🎨 PERSONALIZACIÓN:
  • theme [tema]         - Cambiar tema visual (professional|matrix|retro|hacker)
  • fullscreen           - Modo pantalla completa

⚡ OPTIMIZACIÓN Y RENDIMIENTO:
  • performance          - Ver métricas de rendimiento del sistema
  • cache [status|clear|info] - Gestión de cache del sistema
  • memory               - Información detallada de memoria

⚡ COMANDOS ESPECIALES:
  • sudo ultimamilla.py --demo  - Demostración completa
  • echo [texto]         - Repite el texto ingresado

💡 TIPS:
  - Use TAB para autocompletar comandos
  - Use ↑/↓ para navegar el historial
  - Escriba los primeros caracteres y presione TAB
  - Use 'explore' para navegar datos como un filesystem
  - Combine filtros: filter cliente:gobierno ano:2024
  - Use 'details [número]' después de filtrar para más info

═══════════════════════════════════════════════════════════════
</div>`;
    }

    clearOutput() {
        this.output.innerHTML = '';
        this.initializeWelcome();
        return '';
    }

    handleSudoCommand(args) {
        if (args.length === 0) {
            return `<span class="command-error">sudo: falta comando</span>`;
        }

        if (args[0] === 'ultimamilla.py' && args[1] === '--demo') {
            return this.runDemoSequence();
        }

        return `<span class="command-error">sudo: ${args[0]}: comando no encontrado</span>`;
    }

    async runDemoSequence() {
        const demoCommands = [
            'Iniciando demostración completa de ULTIMA MILLA...',
            'Cargando información empresarial...',
            '✅ 22 años de experiencia verificados',
            '✅ 469+ proyectos completados exitosamente', 
            '✅ 150+ clientes satisfechos',
            '✅ Equipo de 15+ profesionales especializados',
            '✅ Sede principal en Mendoza, Argentina',
            '✅ Servicios: Desarrollo Web, Apps, Sistemas, Marketing',
            '',
            '🚀 Demo completada - ¡Explore con los comandos disponibles!'
        ];

        let output = '<div class="command-success">';
        for (let line of demoCommands) {
            output += line + '\n';
            // Add small delay for dramatic effect in real implementation
        }
        output += '</div>';

        return output;
    }

    listDirectory(args) {
        const directories = {
            '~': ['servicios/', 'antecedentes/', 'contacto/', 'equipo/', 'historia/'],
            'servicios': ['desarrollo-web/', 'apps-moviles/', 'sistemas-empresariales/', 'marketing-digital/'],
            'antecedentes': ['proyectos-2024/', 'proyectos-2023/', 'casos-destacados/', 'testimonios/'],
            'contacto': ['mendoza.txt', 'telefono.txt', 'email.txt', 'whatsapp.txt'],
            'equipo': ['desarrollo.txt', 'diseno.txt', 'marketing.txt', 'direccion.txt']
        };

        const currentDir = directories[this.currentPath] || [];
        
        return `<div class="command-info">
Contenido de ${this.currentPath}:

${currentDir.map(item => 
    item.endsWith('/') ? 
        `📁 <span style="color: #79c0ff;">${item}</span>` : 
        `📄 <span style="color: #e6edf3;">${item}</span>`
).join('\n')}

Total: ${currentDir.length} elementos
</div>`;
    }

    changeDirectory(args) {
        if (args.length === 0) {
            this.currentPath = '~';
            this.updatePrompt();
            return `<span class="command-success">Directorio cambiado a: ${this.currentPath}</span>`;
        }

        const targetDir = args[0];
        const validDirs = ['~', 'servicios', 'antecedentes', 'contacto', 'equipo', 'historia'];

        if (validDirs.includes(targetDir)) {
            this.currentPath = targetDir;
            this.updatePrompt();
            return `<span class="command-success">Directorio cambiado a: ${this.currentPath}</span>`;
        }

        return `<span class="command-error">cd: ${targetDir}: No existe el directorio</span>`;
    }

    getCurrentDirectory() {
        return `<span class="command-info">${this.currentPath}</span>`;
    }

    getCurrentUser() {
        return `<span class="command-info">${this.currentUser}</span>`;
    }

    getDate() {
        const now = new Date();
        return `<span class="command-info">${now.toLocaleString('es-AR', { 
            timeZone: 'America/Argentina/Mendoza',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })} (Mendoza, Argentina)</span>`;
    }

    getCommandHistory() {
        if (this.commandHistory.length === 0) {
            return `<span class="command-info">No hay comandos en el historial</span>`;
        }

        return `<div class="command-info">
Historial de comandos:
${this.commandHistory.slice(0, 10).map((cmd, index) => 
    `${String(index + 1).padStart(3, ' ')}  ${cmd}`
).join('\n')}
</div>`;
    }

    handleContactCommand(args) {
        if (args.length === 0) {
            return `<div class="command-success">
═══════════════════════════════════════════════════════════════
                          📞 CONTACTO - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

🏢 DIRECCIÓN:
   Mendoza, Argentina
   Zona Centro - Ciudad de Mendoza

📱 TELÉFONO/WHATSAPP:
   <a href="tel:+542612345678" style="color: #00d4aa;">+54 261 234-5678</a>
   <a href="https://wa.me/542612345678" target="_blank" style="color: #00d4aa;">WhatsApp Directo</a>

📧 EMAIL:
   <a href="mailto:info@ultimamilla.com.ar" style="color: #00d4aa;">info@ultimamilla.com.ar</a>
   <a href="mailto:ventas@ultimamilla.com.ar" style="color: #00d4aa;">ventas@ultimamilla.com.ar</a>

🌐 WEB:
   <a href="https://www.ultimamilla.com.ar" target="_blank" style="color: #00d4aa;">www.ultimamilla.com.ar</a>

💼 HORARIOS DE ATENCIÓN:
   Lunes a Viernes: 9:00 - 18:00 hs
   Sábados: 9:00 - 13:00 hs

═══════════════════════════════════════════════════════════════
💡 Tip: Use "contacto email" para enviar un mensaje directo
</div>`;
        }

        if (args[0] === 'email') {
            return this.showContactForm();
        }

        return this.handleContactCommand([]);
    }

    showContactForm() {
        // This would integrate with a contact form API
        return `<div class="command-info">
📧 Formulario de contacto:

Para enviar un mensaje directo:
1. Email: <a href="mailto:info@ultimamilla.com.ar?subject=Consulta desde CLI" style="color: #00d4aa;">Abrir cliente de email</a>
2. WhatsApp: <a href="https://wa.me/542612345678?text=Hola! Vengo desde el CLI de su sitio web" target="_blank" style="color: #00d4aa;">Mensaje directo</a>

💡 También puede completar el formulario de contacto en la sección correspondiente del sitio.
</div>`;
    }

    async getServiciosData() {
        // This would fetch from real Directus API
        return `<div class="command-success">
🚀 SERVICIOS - ULTIMA MILLA

📱 DESARROLLO WEB
   • Sitios web responsivos y modernos
   • Aplicaciones web progresivas (PWA)
   • E-commerce y tiendas online
   • Sistemas de gestión de contenido (CMS)

📱 APLICACIONES MÓVILES
   • Apps nativas iOS y Android
   • Aplicaciones híbridas
   • Apps corporativas y empresariales

🏢 SISTEMAS EMPRESARIALES
   • Software a medida
   • Integración de sistemas
   • Automatización de procesos
   • APIs y microservicios

📊 MARKETING DIGITAL
   • Estrategias digitales integrales
   • SEO y posicionamiento web
   • Gestión de redes sociales
   • Publicidad digital (SEM, Social Ads)

💡 Para más detalles use: servicios [categoria]
Ej: servicios web, servicios apps, servicios marketing
</div>`;
    }

    async getAntecedentesData() {
        // This would fetch from real Directus API
        return `<div class="command-success">
📊 CASOS DE ÉXITO - ULTIMA MILLA (Últimos proyectos)

🏥 SECTOR SALUD
   • Sistema de gestión hospitalaria - Hospital Regional
   • App de telemedicina - 5,000+ usuarios activos
   • Portal de turnos médicos - 15 clínicas integradas

🏫 EDUCACIÓN
   • Plataforma e-learning - Universidad Nacional
   • App móvil educativa - 3,000+ descargas
   • Sistema de gestión académica

🏢 EMPRESAS
   • ERP completo - Empresa logística regional
   • E-commerce B2B - Distribuidora mayorista
   • Sistema de facturación electrónica

🍷 TURISMO Y VINOS
   • Portal turístico de Mendoza
   • App de bodegas y catas - 2,000+ usuarios
   • Sistema de reservas online

Total proyectos: 469+ | Años de experiencia: 22
Clientes activos: 150+ | Tasa de satisfacción: 98%

💡 Use: antecedentes [sector] para filtrar por categoría
</div>`;
    }

    getStats() {
        return `<div class="command-success">
📊 ESTADÍSTICAS ULTIMA MILLA (2024)

🏢 EMPRESA:
   • Fundada: 2002 (22 años)
   • Ubicación: Mendoza, Argentina
   • Equipo: 15+ profesionales

📈 PROYECTOS:
   • Total completados: 469+
   • Proyectos activos: 23
   • En desarrollo: 8
   • Tasa de éxito: 98.5%

👥 CLIENTES:
   • Total clientes: 150+
   • Clientes activos: 89
   • Clientes recurrentes: 76%
   • NPS Score: 9.2/10

🌐 TECNOLOGÍAS:
   • Sitios web: 280+
   • Apps móviles: 45+
   • Sistemas empresariales: 78+
   • Campañas marketing: 320+

🎯 SECTORES ATENDIDOS:
   • Salud: 28%
   • Educación: 18%  
   • Empresas: 35%
   • Turismo: 12%
   • Otros: 7%

⏱️  TIEMPO PROMEDIO:
   • Sitio web: 3-6 semanas
   • App móvil: 8-12 semanas
   • Sistema ERP: 12-24 semanas
</div>`;
    }

    handleThemeCommand(args) {
        // Use UI Effects System if available for enhanced theming
        if (this.isUIEffectsReady && this.uiEffects) {
            if (args.length === 0) {
                // Show available themes
                const themes = Object.keys(this.uiEffects.themes);
                const currentTheme = this.uiEffects.currentTheme;
                
                let output = '<div class="command-info">Temas disponibles:\n';
                themes.forEach(theme => {
                    const isCurrent = theme === currentTheme;
                    const status = isCurrent ? ' (actual)' : '';
                    const themeName = this.uiEffects.themes[theme].name;
                    output += `  • ${theme} - ${themeName}${status}\n`;
                });
                output += '\nUso: theme <nombre-tema></div>';
                return output;
            }
            
            const themeName = args[0].toLowerCase();
            const success = this.uiEffects.switchTheme(themeName);
            
            if (success) {
                const themeDisplayName = this.uiEffects.themes[themeName].name;
                return `<span class="command-success">Tema cambiado a: ${themeDisplayName}</span>`;
            } else {
                const availableThemes = Object.keys(this.uiEffects.themes).join(', ');
                return `<span class="command-error">Tema '${themeName}' no encontrado.\nDisponibles: ${availableThemes}</span>`;
            }
        } else {
            // Fallback to basic theming
            if (args.length === 0) {
                return `<span class="command-info">Tema actual: dark. Disponibles: dark, light, matrix</span>`;
            }

            const theme = args[0].toLowerCase();
            const validThemes = ['dark', 'light', 'matrix'];

            if (validThemes.includes(theme)) {
                this.applyTheme(theme);
                return `<span class="command-success">Tema cambiado a: ${theme}</span>`;
            }

            return `<span class="command-error">Tema no válido. Disponibles: ${validThemes.join(', ')}</span>`;
        }
    }

    applyTheme(theme) {
        const terminal = this.container.querySelector('.um-terminal-enhanced');
        if (terminal) {
            terminal.className = terminal.className.replace(/theme-\w+/g, '');
            terminal.classList.add(`theme-${theme}`);
        }
    }

    getUnknownCommandHelp(cmd) {
        const suggestions = this.getSimilarCommands(cmd);
        let response = `<span class="command-error">${cmd}: comando no encontrado</span>`;
        
        if (suggestions.length > 0) {
            response += `\n\n<span class="command-info">¿Quizás quisiste decir?</span>`;
            response += `\n${suggestions.map(s => `  • ${s}`).join('\n')}`;
        }
        
        response += `\n\n<span class="command-info">Escribe 'help' para ver todos los comandos disponibles</span>`;
        return response;
    }

    getSimilarCommands(input) {
        const commands = [
            'help', 'clear', 'ls', 'cd', 'pwd', 'whoami', 'date', 'echo',
            'history', 'contacto', 'servicios', 'antecedentes', 'stats', 'theme',
            'explore', 'filter', 'details', 'navigate', 'back', 'export', 'form-data'
        ];
        
        return commands.filter(cmd => 
            cmd.includes(input.toLowerCase()) || 
            this.levenshteinDistance(cmd, input.toLowerCase()) <= 2
        ).slice(0, 3);
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => 
            Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        if (direction === 'up') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.input.value = this.commandHistory[this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.commandHistory[this.historyIndex];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                this.input.value = '';
            }
        }
    }

    handleAutocomplete() {
        const input = this.input.value.toLowerCase();
        if (!input) return;

        const commands = [
            'help', 'ayuda', 'clear', 'cls', 'ls', 'dir', 'cd', 'pwd', 
            'whoami', 'date', 'echo', 'history', 'contacto', 'contact',
            'servicios', 'services', 'antecedentes', 'casos', 'projects',
            'stats', 'estadisticas', 'theme', 'fullscreen',
            'theme professional', 'theme matrix', 'theme retro', 'theme hacker',
            'performance', 'perf', 'cache', 'memory',
            'performance metrics', 'performance clear', 'performance optimize',
            'cache status', 'cache clear', 'cache info',
            'explore', 'filter', 'details', 'navigate', 'back', 
            'export', 'clear-filters', 'form-data'
        ];

        const matches = commands.filter(cmd => cmd.startsWith(input));
        
        if (matches.length === 1) {
            this.input.value = matches[0];
        } else if (matches.length > 1) {
            this.showSuggestions(input, matches);
        }
    }

    showSuggestions(input, customSuggestions = null) {
        if (!input.trim()) {
            this.clearSuggestions();
            return;
        }

        const commands = customSuggestions || [
            'help', 'clear', 'ls', 'cd', 'servicios', 'antecedentes', 
            'contacto', 'stats', 'theme', 'performance', 'cache', 'memory',
            'explore', 'filter', 'details'
        ];

        const matches = commands.filter(cmd => 
            cmd.toLowerCase().includes(input.toLowerCase())
        );

        if (matches.length > 0) {
            // Use enhanced autocomplete if available
            if (this.isUIEffectsReady && this.uiEffects) {
                this.uiEffects.enhanceAutocomplete(input, matches.slice(0, 5));
            } else {
                // Fallback to basic suggestions
                this.suggestions.innerHTML = `Sugerencias: ${matches.slice(0, 5).join(', ')}`;
                this.suggestions.classList.add('visible');
            }
        } else {
            this.clearSuggestions();
        }
    }

    clearSuggestions() {
        this.suggestions.classList.remove('visible');
        this.suggestions.innerHTML = '';
    }

    showLoading() {
        this.loading.classList.add('visible');
    }

    hideLoading() {
        this.loading.classList.remove('visible');
    }

    addCommandToOutput(command) {
        const commandDiv = document.createElement('div');
        commandDiv.className = 'command-input';
        commandDiv.innerHTML = `<span style="color: #00d4aa; font-weight: 700;">${this.currentUser}@ultimamilla:${this.currentPath}$</span> ${command}`;
        this.output.appendChild(commandDiv);
    }

    addOutputToTerminal(output) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'command-output';
        outputDiv.innerHTML = output;
        this.output.appendChild(outputDiv);
    }

    addErrorToOutput(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'command-output command-error';
        errorDiv.textContent = error;
        this.output.appendChild(errorDiv);
    }

    updatePrompt() {
        this.prompt.textContent = `${this.currentUser}@ultimamilla:${this.currentPath}$ `;
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    toggleFullscreen() {
        this.container.classList.toggle('fullscreen');
        const isFullscreen = this.container.classList.contains('fullscreen');
        
        // Apply UI effects enhancements if available
        if (this.isUIEffectsReady && this.uiEffects) {
            this.uiEffects.enhanceFullscreenMode();
        }
        
        if (isFullscreen) {
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.zIndex = '9999';
            this.container.style.background = 'rgba(0, 0, 0, 0.95)';
        } else {
            this.container.style.position = '';
            this.container.style.top = '';
            this.container.style.left = '';
            this.container.style.width = '';
            this.container.style.height = '';
            this.container.style.zIndex = '';
            this.container.style.background = '';
        }
        
        // Show UI effects feedback if available
        if (this.isUIEffectsReady && this.uiEffects) {
            const message = isFullscreen ? 
                'Modo pantalla completa activado. Presiona ESC para salir.' : 
                'Modo pantalla completa desactivado.';
            this.uiEffects.showCommandFeedback('info', message);
        }
        
        this.focusInput();
    }

    minimizeTerminal() {
        this.container.style.transform = 'scale(0.8)';
        this.container.style.opacity = '0.7';
        
        setTimeout(() => {
            this.container.style.transform = '';
            this.container.style.opacity = '';
        }, 300);
    }

    updateLayout() {
        // Handle responsive layout updates
        this.scrollToBottom();
        this.focusInput();
    }

    async loadDataNavigationEngine() {
        try {
            // Import data navigation engine dynamically
            const module = await import('./dataNavigationEngine.js');
            const DataNavigationEngine = module.default || module.DataNavigationEngine;
            
            if (DataNavigationEngine) {
                this.dataEngine = new DataNavigationEngine();
                this.isDataEngineReady = true;
                console.log('✓ Data Navigation Engine loaded successfully');
            }
        } catch (error) {
            console.warn('Data Navigation Engine not available:', error);
            this.isDataEngineReady = false;
        }
    }
    
    async loadContactSystem() {
        try {
            // Wait for ContactSystem to be available
            if (typeof window.ContactSystem !== 'undefined') {
                this.contactSystem = new window.ContactSystem();
                this.isContactSystemReady = true;
                console.log('✓ Contact System loaded successfully');
            } else {
                // Try to load it dynamically
                await this.loadScriptDynamically('/contactSystem.js');
                if (typeof window.ContactSystem !== 'undefined') {
                    this.contactSystem = new window.ContactSystem();
                    this.isContactSystemReady = true;
                    console.log('✓ Contact System loaded successfully');
                } else {
                    throw new Error('ContactSystem not found');
                }
            }
        } catch (error) {
            console.warn('Contact System not available:', error);
            this.isContactSystemReady = false;
        }
    }
    
    async loadUIEffectsSystem() {
        try {
            // Wait for UIEffectsSystem to be available
            if (typeof window.UIEffectsSystem !== 'undefined') {
                this.uiEffects = new window.UIEffectsSystem(this);
                this.isUIEffectsReady = true;
                console.log('✓ UI Effects System loaded successfully');
            } else {
                // Try to load it dynamically
                await this.loadScriptDynamically('/uiEffectsSystem.js');
                if (typeof window.UIEffectsSystem !== 'undefined') {
                    this.uiEffects = new window.UIEffectsSystem(this);
                    this.isUIEffectsReady = true;
                    console.log('✓ UI Effects System loaded successfully');
                } else {
                    throw new Error('UIEffectsSystem not found');
                }
            }
        } catch (error) {
            console.warn('UI Effects System not available:', error);
            this.isUIEffectsReady = false;
        }
    }

    // Enhanced command handlers
    async handleExploreCommand(args) {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        const path = args.length > 0 ? args[0] : null;
        const options = this.parseCommandOptions(args.slice(1));
        
        try {
            return await this.dataEngine.explore(path, options);
        } catch (error) {
            console.error('Error in explore command:', error);
            return `<span class="command-error">Error explorando: ${error.message}</span>`;
        }
    }
    
    async handleFilterCommand(args) {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        const criteria = args.join(' ');
        const options = this.parseCommandOptions(args);
        
        // Extract page option if present
        const pageMatch = criteria.match(/--page\s+(\d+)/);
        if (pageMatch) {
            options.page = parseInt(pageMatch[1]);
        }
        
        // Remove options from criteria
        const cleanCriteria = criteria.replace(/--\w+\s*\d*/g, '').trim();
        
        try {
            return await this.dataEngine.filter(cleanCriteria, options);
        } catch (error) {
            console.error('Error in filter command:', error);
            return `<span class="command-error">Error filtrando: ${error.message}</span>`;
        }
    }
    
    async handleDetailsCommand(args) {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        if (args.length === 0) {
            return `<span class="command-error">details: falta identificador\nUso: details [id|nombre]</span>`;
        }
        
        const identifier = args.join(' ');
        const options = this.parseCommandOptions(args);
        
        try {
            return await this.dataEngine.details(identifier, options);
        } catch (error) {
            console.error('Error in details command:', error);
            return `<span class="command-error">Error obteniendo detalles: ${error.message}</span>`;
        }
    }
    
    async handleNavigateCommand(args) {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        if (args.length === 0) {
            return `<span class="command-error">navigate: falta ruta\nUso: navigate [ruta]</span>`;
        }
        
        const path = args[0];
        const options = this.parseCommandOptions(args.slice(1));
        
        try {
            return await this.dataEngine.navigate(path, options);
        } catch (error) {
            console.error('Error in navigate command:', error);
            return `<span class="command-error">Error navegando: ${error.message}</span>`;
        }
    }
    
    async handleBackCommand() {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        // Navigate back to parent directory
        const currentPath = this.dataEngine.currentPath || '/';
        const parentPath = currentPath === '/' ? '/' : currentPath.split('/').slice(0, -1).join('/') || '/';
        
        try {
            return await this.dataEngine.navigate(parentPath);
        } catch (error) {
            console.error('Error in back command:', error);
            return `<span class="command-error">Error retrocediendo: ${error.message}</span>`;
        }
    }
    
    handleExportCommand(args) {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        // Basic export functionality
        return `<div class="command-info">
📤 FUNCIONALIDAD DE EXPORTACIÓN

⚠️  Esta funcionalidad está en desarrollo.

💡 PRÓXIMAS CARACTERÍSTICAS:
   • Exportar resultados filtrados a CSV
   • Exportar detalles específicos
   • Exportar estadísticas
   • Envío por email

Para obtener datos específicos, use:
   • details [id] - Ver detalles completos
   • filter [criterios] - Filtrar datos
</div>`;
    }
    
    handleClearFiltersCommand() {
        if (!this.isDataEngineReady) {
            return `<span class="command-error">Motor de navegación de datos no disponible. Intente más tarde.</span>`;
        }
        
        try {
            this.dataEngine.filters = {};
            this.dataEngine.currentPage = 0;
            return `<span class="command-success">✅ Filtros limpiados exitosamente.</span>`;
        } catch (error) {
            return `<span class="command-error">Error limpiando filtros: ${error.message}</span>`;
        }
    }
    
    parseCommandOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg.startsWith('--')) {
                const optionName = arg.substring(2);
                const nextArg = args[i + 1];
                
                if (nextArg && !nextArg.startsWith('--')) {
                    options[optionName] = isNaN(nextArg) ? nextArg : parseInt(nextArg);
                    i++; // Skip next arg as it's a value
                } else {
                    options[optionName] = true;
                }
            }
        }
        
        return options;
    }
    
    async handleEnhancedContactCommand(args) {
        if (!this.isContactSystemReady) {
            // Fallback to basic contact info
            return this.handleContactCommand(args);
        }
        
        try {
            return await this.contactSystem.handleContactCommand(args);
        } catch (error) {
            console.error('Error in enhanced contact command:', error);
            return this.handleContactCommand(args); // Fallback
        }
    }
    
    async handleFormDataCommand(args) {
        if (!this.isContactSystemReady) {
            return `<span class="command-error">Sistema de contacto no disponible. Use 'contacto email' como alternativa.</span>`;
        }
        
        if (args.length === 0) {
            return `<span class="command-error">form-data: falta información\nUso: form-data [sus datos]</span>`;
        }
        
        const inputData = args.join(' ');
        
        try {
            return await this.contactSystem.processFormData(inputData);
        } catch (error) {
            console.error('Error processing form data:', error);
            return `<span class="command-error">Error procesando datos: ${error.message}</span>`;
        }
    }

    loadCommands() {
        // Load additional command configurations if needed
        // This could fetch from an API or configuration file
    }
    
    // Cleanup method to properly dispose resources
    cleanup() {
        if (this.isUIEffectsReady && this.uiEffects) {
            this.uiEffects.cleanup();
        }
        
        if (this.isPerformanceOptimizerReady && this.performanceOptimizer) {
            this.performanceOptimizer.cleanup();
        }
        
        // Remove event listeners
        if (this.input) {
            this.input.removeEventListener('keydown', this.handleKeyDown.bind(this));
            this.input.removeEventListener('input', this.handleInput.bind(this));
            this.input.removeEventListener('focus', this.handleFocus.bind(this));
            this.input.removeEventListener('blur', this.handleBlur.bind(this));
        }
        
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
    
    async loadPerformanceOptimizer() {
        try {
            // Wait for PerformanceOptimizer to be available
            if (typeof window.PerformanceOptimizer !== 'undefined') {
                this.performanceOptimizer = new window.PerformanceOptimizer(this);
                this.isPerformanceOptimizerReady = true;
                console.log('✓ Performance Optimizer loaded successfully');
            } else {
                // Try to load it dynamically
                await this.loadScriptDynamically('/performanceOptimizer.v2.js');
                if (typeof window.PerformanceOptimizer !== 'undefined') {
                    this.performanceOptimizer = new window.PerformanceOptimizer(this);
                    this.isPerformanceOptimizerReady = true;
                    console.log('✓ Performance Optimizer loaded successfully');
                } else {
                    throw new Error('PerformanceOptimizer not found');
                }
            }
        } catch (error) {
            console.warn('Performance Optimizer not available:', error);
            this.isPerformanceOptimizerReady = false;
        }
    }
    
    // Handle performance command
    handlePerformanceCommand(args) {
        if (!this.isPerformanceOptimizerReady) {
            return `<span class="command-error">Sistema de optimización no disponible.</span>`;
        }
        
        if (args.length === 0 || args[0] === 'metrics') {
            return this.showPerformanceMetrics();
        }
        
        switch (args[0]) {
            case 'clear':
                this.performanceOptimizer.clearCache();
                return `<span class="command-success">✓ Cache limpiado exitosamente</span>`;
                
            case 'optimize':
                this.performanceOptimizer.handleMemoryPressure();
                return `<span class="command-success">✓ Optimización de memoria ejecutada</span>`;
                
            case 'virtual-scroll':
                const enabled = args[1] === 'on' || args[1] === 'true';
                this.performanceOptimizer.virtualScrollEnabled = enabled;
                return `<span class="command-info">Virtual scroll ${enabled ? 'activado' : 'desactivado'}</span>`;
                
            default:
                return `<span class="command-info">
Comandos de performance disponibles:
  • performance metrics  - Ver métricas de rendimiento
  • performance clear    - Limpiar cache
  • performance optimize - Optimizar memoria
  • performance virtual-scroll [on|off] - Toggle virtual scroll
</span>`;
        }
    }
    
    // Show performance metrics
    showPerformanceMetrics() {
        if (!this.isPerformanceOptimizerReady) {
            return `<span class="command-error">Métricas no disponibles</span>`;
        }
        
        const metrics = this.performanceOptimizer.getPerformanceMetrics();
        const memoryInfo = performance.memory;
        
        return `<div class="command-success">
📈 MÉTRICAS DE RENDIMIENTO - ULTIMA MILLA CLI

🚀 RENDIMIENTO GENERAL:
   • Tiempo activo: ${this.formatUptime(metrics.uptime)}
   • Comandos ejecutados: ${metrics.totalCommands}
   • Tasa de aciertos de cache: ${metrics.cacheHitRate.toFixed(1)}%
   • Modo offline: ${metrics.offlineMode ? 'Activado' : 'Desactivado'}

💾 MEMORIA:
   • Uso actual: ${this.formatBytes(memoryInfo?.usedJSHeapSize || 0)}
   • Memoria total: ${this.formatBytes(memoryInfo?.totalJSHeapSize || 0)}
   • Límite: ${this.formatBytes(memoryInfo?.jsHeapSizeLimit || 0)}
   • Uso del cache: ${this.formatBytes(metrics.cacheSizeBytes)}

⚡ CACHE:
   • Entradas en cache: ${metrics.cacheSize}
   • Tamaño del cache: ${this.formatBytes(metrics.cacheSizeBytes)}
   • Aciertos: ${metrics.cacheHits}

🎨 UI/UX:
   • Sistema de efectos: ${this.isUIEffectsReady ? 'Activo' : 'Inactivo'}
   • Tema actual: ${this.uiEffects?.currentTheme || 'No disponible'}
   • Sonido: ${this.uiEffects?.enableSoundEffects ? 'Activado' : 'Desactivado'}

🔍 Use 'performance clear' para limpiar cache
</div>`;
    }
    
    // Handle cache command
    handleCacheCommand(args) {
        if (!this.isPerformanceOptimizerReady) {
            return `<span class="command-error">Sistema de cache no disponible.</span>`;
        }
        
        if (args.length === 0 || args[0] === 'status') {
            const metrics = this.performanceOptimizer.getPerformanceMetrics();
            return `<div class="command-info">
💾 ESTADO DEL CACHE:

   • Entradas: ${metrics.cacheSize}
   • Tamaño: ${this.formatBytes(metrics.cacheSizeBytes)}
   • Tasa de aciertos: ${metrics.cacheHitRate.toFixed(1)}%
   • Total de aciertos: ${metrics.cacheHits}
   • Comandos totales: ${metrics.totalCommands}

⚡ Comandos disponibles:
   • cache clear  - Limpiar todo el cache
   • cache info   - Información detallada
</div>`;
        }
        
        switch (args[0]) {
            case 'clear':
                this.performanceOptimizer.clearCache();
                return `<span class="command-success">✓ Cache limpiado completamente</span>`;
                
            case 'info':
                return this.showCacheInfo();
                
            default:
                return `<span class="command-error">Comando de cache no reconocido: ${args[0]}</span>`;
        }
    }
    
    // Show detailed cache info
    showCacheInfo() {
        if (!this.isPerformanceOptimizerReady) {
            return `<span class="command-error">Información de cache no disponible</span>`;
        }
        
        const cache = this.performanceOptimizer.cache;
        const config = this.performanceOptimizer.cacheConfig;
        
        let cacheEntries = '';
        let totalSize = 0;
        
        cache.forEach((item, key) => {
            const age = Date.now() - item.timestamp;
            const isExpired = age > item.ttl;
            const status = isExpired ? '⚠️ Expirado' : '✓ Válido';
            
            cacheEntries += `   • ${key}: ${this.formatBytes(item.size)} - ${status}\n`;
            totalSize += item.size;
        });
        
        return `<div class="command-info">
💾 INFORMACIÓN DETALLADA DEL CACHE:

⚙️ CONFIGURACIÓN:
   • TTL por defecto: ${this.formatTime(config.defaultTTL)}
   • Tamaño máximo: ${this.formatBytes(config.maxSize)}
   • Compresión: ${config.compressionEnabled ? 'Activada' : 'Desactivada'}

📝 ENTRADAS (${cache.size}):
${cacheEntries || '   No hay entradas en cache\n'}
📊 TOTAL: ${this.formatBytes(totalSize)}
</div>`;
    }
    
    // Handle memory command
    handleMemoryCommand() {
        const memoryInfo = performance.memory;
        if (!memoryInfo) {
            return `<span class="command-error">Información de memoria no disponible en este navegador</span>`;
        }
        
        const usedPercent = ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1);
        const totalPercent = ((memoryInfo.totalJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1);
        
        return `<div class="command-info">
💾 INFORMACIÓN DE MEMORIA:

⚡ ESTADO ACTUAL:
   • Memoria usada: ${this.formatBytes(memoryInfo.usedJSHeapSize)} (${usedPercent}%)
   • Memoria total: ${this.formatBytes(memoryInfo.totalJSHeapSize)} (${totalPercent}%)
   • Límite del heap: ${this.formatBytes(memoryInfo.jsHeapSizeLimit)}

🚨 ALERTAS:
   ${usedPercent > 90 ? '• ⚠️ Uso de memoria crítico' : '• ✓ Uso de memoria normal'}
   ${totalPercent > 95 ? '• ⚠️ Memoria total cerca del límite' : '• ✓ Memoria total en rango seguro'}

🔧 ACCIONES:
   • performance optimize - Liberar memoria
   • cache clear - Limpiar cache para liberar memoria
</div>`;
    }
    
    // Utility formatters
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatTime(ms) {
        if (ms < 1000) return ms + 'ms';
        if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
        if (ms < 3600000) return (ms / 60000).toFixed(1) + 'min';
        return (ms / 3600000).toFixed(1) + 'h';
    }
    
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}min ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}min ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    // Dynamically load script files
    async loadScriptDynamically(scriptPath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptPath;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${scriptPath}`));
            document.head.appendChild(script);
        });
    }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const terminal = new EnhancedTerminal('um-terminal-enhanced');
    
    // Make terminal globally accessible for debugging
    window.umTerminal = terminal;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedTerminal;
}
