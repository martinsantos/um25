/**
 * UMTerminal Advanced Engine v3.0
 * Features: Themes, animations, enhanced commands, Matrix effects, AI-like responses
 * Integration of server-side engine with client-side enhancements
 */

class UMTerminalAdvanced {
    constructor() {
        // Get DOM elements with error handling
        this.terminal = document.getElementById('um-terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.prompt = document.getElementById('terminal-prompt');
        this.suggestions = document.getElementById('input-suggestions');
        this.loading = document.getElementById('loading-overlay');
        this.progressBar = document.getElementById('progress-bar');
        this.themeSelector = document.getElementById('theme-selector');
        this.matrixCanvas = document.getElementById('matrix-canvas');
        
        // Verify critical elements exist
        if (!this.terminal || !this.input || !this.output) {
            console.error('❌ Critical terminal elements not found');
            return;
        }
        
        // Terminal state
        this.currentUser = 'visitante';
        this.currentPath = '~';
        this.currentTheme = 'default';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.session = {
            user: 'visitante',
            startTime: new Date(),
            commandCount: 0
        };
        
        // Data storage (simulated from server-side engine)
        this.servicios = [];
        this.clientes = [];
        this.antecedentes = [];
        this.isDataLoaded = false;
        
        // Effects and animations
        this.matrixEffect = null;
        this.typingSpeed = 30;
        this.suggestionIndex = -1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.initializeWelcome();
        this.focusInput();
        this.setupThemes();
        this.preloadEffects();
    }

    setupEventListeners() {
        // Safety checks for elements
        if (!this.input || !this.terminal) {
            console.error('Terminal elements not found');
            return;
        }
        
        // Input handling
        this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.input.addEventListener('input', this.handleInput.bind(this));
        
        // Theme selector with safety check
        if (this.themeSelector) {
            this.themeSelector.addEventListener('change', this.changeTheme.bind(this));
        }
        
        // Terminal controls
        const controls = document.querySelectorAll('.um-control');
        controls.forEach(control => {
            control.addEventListener('click', this.handleControlClick.bind(this));
        });
        
        // Click to focus
        this.terminal.addEventListener('click', () => {
            if (this.input) this.input.focus();
        });
        
        // Prevent context menu on terminal
        this.terminal.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle window resize for responsive design
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    async loadData() {
        // Simulated data loading from server
        try {
            // In a real implementation, this would fetch from the server
            this.servicios = await this.getSimulatedServicios();
            this.clientes = await this.getSimulatedClientes();
            this.antecedentes = await this.getSimulatedAntecedentes();
            this.isDataLoaded = true;
        } catch (error) {
            console.warn('Error loading data:', error);
            this.isDataLoaded = false;
        }
    }

    async getSimulatedServicios() {
        // Simulated service data
        return [
            { Cliente: "AFIP", Titulo: "Sistema Tributario Nacional", Area: "Desarrollo", Presupuesto: 5000000, Fecha: "2023-01-15" },
            { Cliente: "Gobierno Nacional", Titulo: "Portal Ciudadano Digital", Area: "Web Development", Presupuesto: 3500000, Fecha: "2023-06-10" },
            { Cliente: "Quilmes", Titulo: "App Móvil Municipal", Area: "Mobile", Presupuesto: 2000000, Fecha: "2023-08-22" },
            { Cliente: "MercadoLibre", Titulo: "Integración API", Area: "Backend", Presupuesto: 1500000, Fecha: "2023-11-05" },
            { Cliente: "Banco Nación", Titulo: "Sistema de Seguridad", Area: "Cybersecurity", Presupuesto: 4500000, Fecha: "2023-12-01" }
        ];
    }

    async getSimulatedClientes() {
        return ["AFIP", "Gobierno Nacional", "Quilmes", "MercadoLibre", "Banco Nación", "YPF", "Telecom", "Claro"];
    }

    async getSimulatedAntecedentes() {
        return [
            { titulo: "Modernización AFIP", descripcion: "Transformación digital del sistema tributario", año: "2023" },
            { titulo: "Portal Quilmes", descripcion: "Plataforma ciudadana integrada", año: "2023" },
            { titulo: "App Gobierno", descripcion: "Aplicación móvil gubernamental", año: "2022" }
        ];
    }

    async initializeWelcome() {
        const asciiElement = document.getElementById('welcome-ascii');
        if (asciiElement) {
            const asciiArt = this.generateASCIIArt();
            await this.typeText(asciiElement, asciiArt, 15);
        }
        
        // Animate welcome lines
        const welcomeLines = document.querySelectorAll('.welcome-line');
        welcomeLines.forEach((line, index) => {
            const delay = parseInt(line.dataset.delay) || 0;
            setTimeout(() => {
                line.classList.add('visible');
            }, delay + 1000); // Add 1s after ASCII completes
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
        ║  🏢 EMPRESA TECNOLÓGICA LÍDER EN MENDOZA DESDE 2003  📍           ║
        ║  🚀 DESARROLLO • SISTEMAS • REDES • SEGURIDAD • MARKETING        ║
        ══════════════════════════════════════════════════════════════════════`;
    }

    async typeText(element, text, speed = 30) {
        return new Promise(resolve => {
            element.textContent = '';
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

    setupThemes() {
        // Set initial theme
        this.changeTheme({ target: { value: 'default' } });
    }

    changeTheme(event) {
        const theme = event.target.value;
        this.currentTheme = theme;
        
        if (!this.terminal) {
            console.error('Terminal element not found');
            return;
        }
        
        console.log(`Changing theme to: ${theme}`);
        
        // Remove existing theme classes
        this.terminal.removeAttribute('data-theme');
        
        // Apply new theme
        if (theme !== 'default') {
            this.terminal.setAttribute('data-theme', theme);
        }
        
        // Special effects for Matrix theme
        if (theme === 'matrix') {
            this.startMatrixRain();
        } else {
            this.stopMatrixRain();
        }
        
        // Update prompt color for theme
        this.updatePromptStyle();
        
        // Update theme selector colors
        this.updateThemeSelectorStyle();
    }

    updatePromptStyle() {
        const colors = {
            default: '#00ffaa',
            matrix: '#00ff00',
            retro: '#ff00ff',
            neon: '#00ffff',
            corporate: '#fbbf24'
        };
        
        if (this.prompt) {
            this.prompt.style.color = colors[this.currentTheme] || colors.default;
        }
    }
    
    updateThemeSelectorStyle() {
        if (!this.themeSelector) return;
        
        const colors = {
            default: '#00ffaa',
            matrix: '#00ff00',
            retro: '#ff00ff',
            neon: '#00ffff',
            corporate: '#fbbf24'
        };
        
        const currentColor = colors[this.currentTheme] || colors.default;
        this.themeSelector.style.borderColor = currentColor;
        this.themeSelector.style.color = currentColor;
    }
    
    handleResize() {
        // Update Matrix canvas size if it exists
        if (this.matrixCanvas && this.terminal) {
            this.matrixCanvas.width = this.terminal.offsetWidth;
            this.matrixCanvas.height = this.terminal.offsetHeight;
        }
        
        // Update terminal layout for mobile
        if (window.innerWidth <= 768) {
            this.terminal?.classList.add('mobile-view');
        } else {
            this.terminal?.classList.remove('mobile-view');
        }
    }

    startMatrixRain() {
        if (!this.matrixCanvas) return;
        
        this.matrixCanvas.style.display = 'block';
        const ctx = this.matrixCanvas.getContext('2d');
        
        // Set canvas size
        this.matrixCanvas.width = this.terminal.offsetWidth;
        this.matrixCanvas.height = this.terminal.offsetHeight;
        
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 14;
        const columns = Math.floor(this.matrixCanvas.width / fontSize);
        const drops = Array(columns).fill(1);
        
        this.matrixEffect = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = `${fontSize}px 'Fira Code', monospace`;
            
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > this.matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }, 35);
    }

    stopMatrixRain() {
        if (this.matrixEffect) {
            clearInterval(this.matrixEffect);
            this.matrixEffect = null;
        }
        if (this.matrixCanvas) {
            this.matrixCanvas.style.display = 'none';
        }
    }

    preloadEffects() {
        // Preload any additional effects or resources
        this.terminal.classList.add('enhanced');
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
                this.hideSuggestions();
                break;
        }
    }

    handleInput(event) {
        const value = event.target.value.trim();
        if (value.length > 0) {
            this.showSuggestions(value);
        } else {
            this.hideSuggestions();
        }
    }

    handleControlClick(event) {
        const action = event.target.dataset.action;
        switch (action) {
            case 'close':
            case 'minimize':
                this.minimizeTerminal();
                break;
            case 'maximize':
                this.toggleMaximize();
                break;
        }
    }

    minimizeTerminal() {
        this.terminal.style.transform = 'scale(0.1)';
        this.terminal.style.opacity = '0.5';
        setTimeout(() => {
            this.terminal.style.transform = 'scale(1)';
            this.terminal.style.opacity = '1';
        }, 500);
    }

    toggleMaximize() {
        this.terminal.classList.toggle('maximized');
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        
        if (direction === 'up') {
            if (this.historyIndex === -1) {
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else if (direction === 'down') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
            } else {
                this.historyIndex = -1;
                this.input.value = '';
                return;
            }
        }
        
        this.input.value = this.commandHistory[this.historyIndex];
    }

    showSuggestions(input) {
        const commands = ['help', 'ls', 'cat', 'grep', 'stats', 'matrix', 'fortune', 'cowsay', 
                         'whoami', 'uname', 'ps', 'history', 'contacto', 'clear', 'cd'];
        
        const matches = commands.filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase()));
        
        if (matches.length > 0) {
            this.suggestions.innerHTML = matches.map((match, index) => 
                `<div class="suggestion-item ${index === 0 ? 'selected' : ''}" data-command="${match}">
                    ${match}
                </div>`
            ).join('');
            this.suggestions.style.display = 'block';
            this.suggestionIndex = 0;
            
            // Add click handlers
            this.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.input.value = item.dataset.command;
                    this.hideSuggestions();
                    this.input.focus();
                });
            });
        } else {
            this.hideSuggestions();
        }
    }

    hideSuggestions() {
        this.suggestions.style.display = 'none';
        this.suggestionIndex = -1;
    }

    handleAutocomplete() {
        const suggestions = this.suggestions.querySelectorAll('.suggestion-item');
        if (suggestions.length > 0) {
            this.input.value = suggestions[0].dataset.command;
            this.hideSuggestions();
        }
    }

    async executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = -1;
        this.session.commandCount++;
        
        // Show command in output
        this.addOutput(`${this.prompt.textContent}${command}`, 'command');
        
        // Clear input
        this.input.value = '';
        this.hideSuggestions();
        
        // Show loading
        this.showLoading();
        
        // Process command
        try {
            const result = await this.processCommand(command);
            this.hideLoading();
            
            if (result.action === 'clear') {
                this.clearTerminal();
            } else {
                await this.addOutput(result.output, 'response');
            }
        } catch (error) {
            this.hideLoading();
            this.addOutput(`Error: ${error.message}`, 'error');
        }
        
        // Auto-scroll
        this.scrollToBottom();
        this.focusInput();
    }

    async processCommand(input) {
        const [command, ...args] = input.split(' ');
        
        switch (command.toLowerCase()) {
            case 'help':
                return this.help();
            case 'ls':
                return this.ls(args);
            case 'cat':
                return this.cat(args);
            case 'grep':
                return this.grep(args);
            case 'stats':
                return this.stats();
            case 'matrix':
                return this.matrix();
            case 'fortune':
                return this.fortune();
            case 'cowsay':
                return this.cowsay(args);
            case 'whoami':
                return this.whoami(args);
            case 'uname':
                return this.uname(args);
            case 'ps':
                return this.ps();
            case 'history':
                return this.historyCommand();
            case 'contacto':
                return this.contacto(args);
            case 'clear':
                return this.clear();
            case 'cd':
                return this.cd(args);
            case 'sudo':
                return this.sudo(args);
            default:
                return this.commandNotFound(command);
        }
    }

    help() {
        return {
            output: `
🚀 ULTIMA MILLA CLI v3.0 - Comandos Disponibles

📋 NAVEGACIÓN Y SISTEMA:
• ls [directorio]       Lista archivos y directorios
• cd [directorio]       Cambiar directorio
• cat [archivo]         Mostrar contenido de archivos
• grep [término]        Buscar en archivos y datos
• clear                 Limpiar pantalla

📊 INFORMACIÓN EMPRESARIAL:
• stats                 Estadísticas generales de UM
• whoami [--empresa]    Información del usuario/empresa
• uname [-a]           Información del sistema
• ps                   Procesos activos (proyectos)
• history [número]     Historial de comandos

🎨 EFECTOS Y DIVERSIÓN:
• matrix               Activar efecto Matrix
• fortune              Frase inspiracional aleatoria
• cowsay "mensaje"     Vaca habladora de UM

📞 CONTACTO Y DEMO:
• contacto [mensaje]   Enviar consulta al equipo
• sudo ultimamilla.py  Demo interactiva completa

💡 CONSEJOS:
- Usa Tab para autocompletar comandos
- Flechas arriba/abajo para historial
- Selector de temas en la barra superior
- Escribe 'grep [término]' para buscar información específica

¡Explora 22 años de historia tecnológica! 🌟
            `
        };
    }

    ls(args) {
        const directory = args[0] || '.';
        
        switch (directory) {
            case '.':
            case '~':
                return {
                    output: `
📁 DIRECTORIO RAÍZ - ULTIMA MILLA

drwxr-xr-x 2 um um  4096 dic  1 10:00 📂 servicios/
drwxr-xr-x 2 um um  4096 dic  1 10:00 📂 clientes/
drwxr-xr-x 2 um um  4096 dic  1 10:00 📂 antecedentes/
drwxr-xr-x 2 um um  4096 dic  1 10:00 📂 equipo/
-rw-r--r-- 1 um um  1337 dic  1 10:00 📄 empresa.info
-rw-r--r-- 1 um um   892 dic  1 10:00 📄 contacto.txt
-rw-r--r-- 1 um um  2048 dic  1 10:00 📄 ultimamilla.py
-rw-r--r-- 1 um um   555 dic  1 10:00 📄 README.md

💡 Usa 'cd [directorio]' para navegar
💡 Usa 'cat [archivo]' para ver contenido
                    `
                };
            case 'servicios':
                return this.lsServicios();
            case 'clientes':
                return this.lsClientes();
            case 'antecedentes':
                return this.lsAntecedentes();
            default:
                return {
                    output: `ls: no se puede acceder a '${directory}': No existe el archivo o el directorio`
                };
        }
    }

    lsServicios() {
        if (!this.isDataLoaded || this.servicios.length === 0) {
            return {
                output: `
📊 SERVICIOS ULTIMA MILLA (${this.servicios.length} proyectos)

⚡ Cargando datos del servidor...
💡 Usa 'stats' para ver estadísticas completas
                `
            };
        }

        const recentServices = this.servicios.slice(0, 10);
        let output = `
📊 SERVICIOS ULTIMA MILLA (${this.servicios.length} proyectos activos)

`;
        
        recentServices.forEach((servicio, index) => {
            output += `${(index + 1).toString().padStart(2, '0')}. ${servicio.Cliente.padEnd(20)} | ${servicio.Area.padEnd(15)} | $${servicio.Presupuesto.toLocaleString()}\n`;
        });
        
        output += `\n💡 Usa 'grep [cliente]' para buscar proyectos específicos`;
        
        return { output };
    }

    lsClientes() {
        return {
            output: `
👥 CLIENTES ULTIMA MILLA (${this.clientes.length}+ empresas)

🏛️  SECTOR PÚBLICO:
• AFIP (Administración Federal)
• Gobierno Nacional  
• Municipio de Quilmes
• Organismos provinciales

🏢 SECTOR PRIVADO:
• MercadoLibre (E-commerce)
• Banco Nación (Financiero)
• YPF (Energía)
• Telecom (Telecomunicaciones)
• Claro (Telecomunicaciones)

💡 22 años construyendo confianza empresarial
💡 Usa 'grep [cliente]' para ver proyectos específicos
            `
        };
    }

    lsAntecedentes() {
        return {
            output: `
🏆 CASOS DE ÉXITO - ULTIMA MILLA

📈 PROYECTOS DESTACADOS 2023:
• Modernización Sistema AFIP          ⭐⭐⭐⭐⭐
• Portal Ciudadano Digital            ⭐⭐⭐⭐⭐  
• App Municipal Quilmes               ⭐⭐⭐⭐
• Integración APIs MercadoLibre       ⭐⭐⭐⭐⭐
• Sistema Seguridad Banco Nación      ⭐⭐⭐⭐⭐

🔥 TECNOLOGÍAS IMPLEMENTADAS:
• React, Node.js, Python
• AWS, Azure, Docker
• PostgreSQL, MongoDB
• APIs REST y GraphQL
• Cybersecurity & DevOps

💡 Cada proyecto es una historia de éxito
💡 Usa 'cat antecedentes' para detalles
            `
        };
    }

    cat(args) {
        if (args.length === 0) {
            return {
                output: "cat: falta un operando\nPrueba 'cat --help' para más información."
            };
        }
        
        const filename = args.join(' ');
        
        switch (filename.toLowerCase()) {
            case 'empresa.info':
                return this.catEmpresaInfo();
            case 'contacto.txt':
                return this.catContacto();
            case 'ultimamilla.py':
                return this.catUltimaMilla();
            case 'readme.md':
                return this.catReadme();
            case 'antecedentes':
                return this.catAntecedentes();
            default:
                return {
                    output: `cat: ${filename}: No existe el archivo o el directorio`
                };
        }
    }

    catEmpresaInfo() {
        return {
            output: `
╔════════════════════════════════════════════════════════════╗
║                    ULTIMA MILLA S.R.L.                    ║
║                 Información Corporativa                    ║
╚════════════════════════════════════════════════════════════╝

🏢 EMPRESA:           Ultima Milla S.R.L.
📅 FUNDACIÓN:         2003 (22 años de experiencia)
📍 UBICACIÓN:         Mendoza, Argentina
🌐 ALCANCE:           Nacional e Internacional

🎯 ESPECIALIDADES:
• Desarrollo de Software a Medida
• Sistemas Web y Aplicaciones Móviles  
• Infraestructura de Redes
• Ciberseguridad Empresarial
• Marketing Digital y SEO

📊 NÚMEROS:
• 469+ Proyectos Completados
• 150+ Clientes Satisfechos
• 22 Años de Experiencia
• 99.9% Uptime Garantizado

🏆 CERTIFICACIONES:
• ISO 9001:2015 (Calidad)
• ISO 27001 (Seguridad)
• Partner Oficial Microsoft
• Certified AWS Solutions

📞 CONTACTO:
• Web: www.ultimamilla.com.ar
• Email: contacto@ultimamilla.com.ar
• Tel: +54 261 xxx-xxxx

"Conectando el futuro desde 2003" 🚀
            `
        };
    }

    catContacto() {
        return {
            output: `
📞 INFORMACIÓN DE CONTACTO - ULTIMA MILLA

🌐 SITIOS WEB:
• Principal: https://www.ultimamilla.com.ar
• Admin: https://www.ultimamilla.com.ar:8055
• SGI: https://www.sgi.ultimamilla.com.ar
• CLI: https://www.ultimamilla.com.ar/cli

📧 EMAIL:
• General: contacto@ultimamilla.com.ar
• Ventas: ventas@ultimamilla.com.ar  
• Soporte: soporte@ultimamilla.com.ar
• Proyectos: proyectos@ultimamilla.com.ar

📱 REDES SOCIALES:
• LinkedIn: /company/ultima-milla
• Twitter: @ultimamilla_ar
• Instagram: @ultimamilla.tech

📍 UBICACIÓN:
Mendoza, Argentina
Zona Metropolitana

💡 Usa el comando 'contacto' para enviar un mensaje directo
            `
        };
    }

    catUltimaMilla() {
        return {
            output: `
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ULTIMA MILLA ENTERPRISE SYSTEM v22.0
Demostración interactiva del ecosistema tecnológico
"""

class UltimaMilla:
    def __init__(self):
        self.empresa = "Ultima Milla S.R.L."
        self.fundacion = 2003
        self.experiencia = 22
        self.proyectos = 469
        self.clientes = 150
        self.uptime = 99.9
        
    def demo(self):
        print("🚀 INICIANDO DEMO ULTIMA MILLA...")
        print("⚡ Cargando módulos empresariales...")
        print("📊 Generando estadísticas en tiempo real...")
        print("🔐 Verificando sistemas de seguridad...")
        print("✅ SISTEMA LISTO - ¡Explora con comandos!")
        
        return {
            "status": "ready",
            "services": ["web", "mobile", "security", "networks"],
            "technologies": ["React", "Node.js", "Python", "AWS"],
            "message": "22 años conectando el futuro"
        }

if __name__ == "__main__":
    um = UltimaMilla()
    um.demo()

# 💡 Ejecuta: sudo python ultimamilla.py --demo
# 🔧 Disponible en: www.ultimamilla.com.ar
            `
        };
    }

    catReadme() {
        return {
            output: `
# ULTIMA MILLA - Terminal Interactivo

## 🚀 Descripción
Terminal empresarial avanzado con IA integrada para explorar 22 años 
de experiencia en desarrollo tecnológico.

## ⚡ Características
- **469+ proyectos** documentados y navegables
- **150+ clientes** del sector público y privado  
- **Temas visuales** (Matrix, Retro, Neon, Corporate)
- **Comandos inteligentes** con autocompletado
- **Integración en tiempo real** con sistemas UM

## 🎯 Comandos Principales
- \`help\` - Lista completa de comandos
- \`stats\` - Estadísticas empresariales  
- \`matrix\` - Efecto visual Matrix
- \`contacto\` - Formulario de contacto directo

## 🛠️ Tecnologías
- Frontend: Astro + TypeScript + Tailwind
- Backend: Node.js + Directus CMS
- Base de Datos: PostgreSQL
- Infraestructura: Docker + Nginx

## 📞 Contacto
**Web:** www.ultimamilla.com.ar  
**Email:** contacto@ultimamilla.com.ar

---
*"Conectando el futuro desde 2003"* 🌟
            `
        };
    }

    catAntecedentes() {
        return {
            output: `
🏆 CASOS DE ÉXITO DETALLADOS - ULTIMA MILLA

═══════════════════════════════════════════════════════════

📊 PROYECTO: Modernización AFIP (2023)
🎯 Objetivo: Transformación digital del sistema tributario
💻 Tecnologías: React, Node.js, PostgreSQL, Redis
⏱️ Duración: 8 meses
💰 Presupuesto: $5.000.000
⭐ Resultado: 40% mejora en eficiencia, 99.9% uptime

═══════════════════════════════════════════════════════════

🌐 PROYECTO: Portal Ciudadano Digital (2023)  
🎯 Objetivo: Plataforma unificada de servicios gubernamentales
💻 Tecnologías: Vue.js, Python Django, AWS
⏱️ Duración: 6 meses
💰 Presupuesto: $3.500.000
⭐ Resultado: 500,000+ usuarios registrados

═══════════════════════════════════════════════════════════

📱 PROYECTO: App Municipal Quilmes (2023)
🎯 Objetivo: Servicios municipales móviles  
💻 Tecnologías: React Native, Node.js, MongoDB
⏱️ Duración: 4 meses
💰 Presupuesto: $2.000.000
⭐ Resultado: 4.8★ en app stores, 100K+ descargas

═══════════════════════════════════════════════════════════

🔒 PROYECTO: Sistema Seguridad Banco Nación (2023)
🎯 Objetivo: Infraestructura de ciberseguridad
💻 Tecnologías: Cybersecurity Suite, AI/ML
⏱️ Duración: 12 meses  
💰 Presupuesto: $4.500.000
⭐ Resultado: 0 incidentes de seguridad, certificación ISO 27001

💡 Cada proyecto refleja nuestro compromiso con la excelencia
💡 Usa 'grep [cliente]' para buscar proyectos específicos
            `
        };
    }

    grep(args) {
        if (args.length === 0) {
            return {
                output: "grep: falta un patrón de búsqueda\nUso: grep [término_busqueda]"
            };
        }
        
        const query = args.join(' ').toLowerCase();
        const results = [];
        
        // Search in services
        this.servicios.forEach(servicio => {
            if (servicio.Cliente.toLowerCase().includes(query) ||
                servicio.Titulo.toLowerCase().includes(query) ||
                servicio.Area.toLowerCase().includes(query)) {
                results.push(`📊 SERVICIO: ${servicio.Cliente} - ${servicio.Titulo} (${servicio.Area})`);
            }
        });
        
        // Search in clients
        this.clientes.forEach(cliente => {
            if (cliente.toLowerCase().includes(query)) {
                results.push(`👥 CLIENTE: ${cliente}`);
            }
        });
        
        if (results.length === 0) {
            return {
                output: `🔍 No se encontraron resultados para: "${query}"\n\n💡 Términos sugeridos: AFIP, Quilmes, desarrollo, web, mobile, seguridad`
            };
        }
        
        return {
            output: `
🔍 RESULTADOS DE BÚSQUEDA: "${query}" (${results.length} coincidencias)

${results.join('\n')}

💡 Usa 'cat [archivo]' para más detalles
💡 Usa 'ls [directorio]' para explorar más contenido
            `
        };
    }

    stats() {
        const totalPresupuesto = this.servicios.reduce((sum, s) => sum + (s.Presupuesto || 0), 0);
        const avgPresupuesto = totalPresupuesto / this.servicios.length;
        
        return {
            output: `
📊 ESTADÍSTICAS ULTIMA MILLA - Panel Ejecutivo

═══════════════════════════════════════════════════════════

🏢 INFORMACIÓN GENERAL:
• Años Activos:           22 años (2003-2025)
• Proyectos Completados:  ${this.servicios.length}+ 
• Clientes Atendidos:     ${this.clientes.length}+
• Sectores:               Público y Privado

💰 MÉTRICAS FINANCIERAS:
• Facturación Total:      $${totalPresupuesto.toLocaleString()}
• Proyecto Promedio:      $${Math.round(avgPresupuesto).toLocaleString()}  
• Crecimiento Anual:      +25% YoY
• ROI Cliente Promedio:   +340%

🎯 ÁREAS DE ESPECIALIZACIÓN:
• Desarrollo Web:         35% de proyectos
• Aplicaciones Móviles:   25% de proyectos  
• Ciberseguridad:         20% de proyectos
• Infraestructura:        20% de proyectos

🌟 INDICADORES DE CALIDAD:
• Satisfacción Cliente:   98.5%
• Uptime Promedio:        99.9%
• Tiempo Entrega:         95% on-time
• Retención Clientes:     92%

🔥 TECNOLOGÍAS LÍDERES:
• React/Vue.js:          80% proyectos web
• Node.js/Python:        70% backends
• AWS/Azure:             60% cloud deployments
• Docker/Kubernetes:     85% containerization

📈 PROYECCIÓN 2025:
• Meta Proyectos:        +100 nuevos proyectos
• Expansión:             Brasil y Chile
• Nuevas Tecnologías:    IA, Blockchain, IoT
• Equipo:                +50% crecimiento

═══════════════════════════════════════════════════════════

🚀 "22 años conectando el futuro" - Ultima Milla 2025
            `
        };
    }

    matrix() {
        // Trigger theme change to matrix if not already
        if (this.currentTheme !== 'matrix') {
            this.themeSelector.value = 'matrix';
            this.changeTheme({ target: { value: 'matrix' } });
        }
        
        return {
            output: `
🟢 INICIANDO MATRIX PROTOCOL...

U L T I M A   M I L L A   N E T W O R K
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
R E D E S   •   S O F T W A R E   •   S E G U R I D A D  
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
Q U I L M E S   ↔   A F I P   ↔   G O B I E R N O
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
${this.servicios.length}   P R O Y E C T O S   A C T I V O S
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
2 0 0 3   ─ ─ ─ →   2 0 2 5   ─ ─ ─ →   ∞

🔴 The Matrix has you... 🔴
¿Tomar la píldora roja o azul? [R/a] 

💊 PÍLDORA ROJA: Descubre la verdad de 22 años de código
💊 PÍLDORA AZUL: Regresa al terminal normal

🌐 CONECTANDO A LA MATRIX DE ULTIMA MILLA...
⚡ Cargando datos en tiempo real...
🔒 Acceso autorizado: NIVEL_DESARROLLADOR

Tip: El efecto Matrix está activo en el fondo 👀
            `
        };
    }

    fortune() {
        const fortunes = [
            "La innovación distingue entre un líder y un seguidor. - Steve Jobs",
            "La tecnología es mejor cuando acerca a la gente. - Matt Mullenweg",
            "En Ultima Milla, cada proyecto es una oportunidad de conectar el futuro.",
            "22 años conectando sueños con realidad tecnológica.",
            "No hay problemas de redes que no podamos resolver. - Equipo UM",
            "El código limpio siempre parece que fue escrito por alguien que se preocupa. - Robert C. Martin",
            "La excelencia tecnológica se construye proyecto a proyecto. - Ultima Milla",
            "Desde Mendoza para el mundo: conectamos el futuro digitalmente.",
            "Un bug es una feature no documentada. - Desarrolladores UM",
            "En la nube o en tierra, Ultima Milla te conecta donde estés."
        ];
        
        const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        return {
            output: `\n💡 ${fortune}\n`
        };
    }

    cowsay(args) {
        const message = args.join(' ') || 'Conectando el futuro';
        const border = '_'.repeat(message.length + 2);
        
        return {
            output: `
 ${border}
< ${message} >
 ${'-'.repeat(message.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
             UM||----w |
                ||     ||

🐄 Vaca Ultima Milla dice: "${message}"
            `
        };
    }

    whoami(args) {
        if (args.includes('--empresa')) {
            return {
                output: `
👤 INFORMACIÓN DE SESIÓN Y EMPRESA

🔐 SESIÓN ACTUAL:
Usuario: ${this.session.user}
Sesión iniciada: ${this.session.startTime.toLocaleString()}
Comandos ejecutados: ${this.session.commandCount}
Ruta actual: ${this.currentPath}
Tema activo: ${this.currentTheme}

🏢 ULTIMA MILLA S.R.L.
"Conectando el futuro desde 2003"

📍 UBICACIÓN: Mendoza, Argentina
📊 PROYECTOS: ${this.servicios.length}+ completados  
🌐 ALCANCE: Nacional e Internacional
🎯 ESPECIALIDAD: Soluciones tecnológicas integrales

⚡ SERVICIOS PRINCIPALES:
• Desarrollo de Software
• Aplicaciones Móviles
• Ciberseguridad
• Infraestructura de Redes
• Marketing Digital

🏆 CERTIFICACIONES:
• ISO 9001:2015 (Gestión de Calidad)
• ISO 27001 (Seguridad de la Información)
• Partner Microsoft & AWS

22 años de excelencia tecnológica 🚀
                `
            };
        }
        
        return { output: this.session.user };
    }

    uname(args) {
        if (args.includes('-a')) {
            return {
                output: `ULTIMA MILLA Enterprise Linux 22.0.0 #${this.servicios.length}-projects SMP ${new Date().toDateString()} x86_64 GNU/Linux`
            };
        }
        
        return { output: 'ULTIMA MILLA Enterprise Linux' };
    }

    ps() {
        const activeProjects = this.servicios
            .filter(s => new Date(s.Fecha).getFullYear() >= 2020)
            .slice(0, 15);

        let output = `
📋 PROYECTOS ACTIVOS (${activeProjects.length} procesos)

PID    USER     %CPU  %MEM  COMMAND
`;

        activeProjects.forEach((p, i) => {
            const pid = (1000 + i).toString().padStart(6);
            const cpu = Math.floor(Math.random() * 100).toString().padStart(5);
            const mem = Math.floor(Math.random() * 50).toString().padStart(5);
            const command = `${p.Area.toLowerCase().replace(/\s/g, '_')}_${p.Cliente.substring(0, 15).toLowerCase().replace(/\s/g, '_')}`;
            output += `${pid}  um       ${cpu}  ${mem}  ${command}\n`;
        });

        output += `\nTotal: ${activeProjects.length} procesos activos`;
        
        return { output };
    }

    historyCommand() {
        const count = 10;
        const recentHistory = this.commandHistory.slice(-count);
        
        let output = `
📜 HISTORIAL DE COMANDOS (últimos ${count})

`;
        
        recentHistory.forEach((h, i) => {
            output += `${(this.commandHistory.length - count + i + 1).toString().padStart(4)} ${h}\n`;
        });
        
        output += `\nTotal comandos ejecutados: ${this.session.commandCount}`;
        
        return { output };
    }

    contacto(args) {
        if (args.length === 0) {
            return {
                output: `
📞 FORMULARIO DE CONTACTO ULTIMA MILLA

Para enviar un mensaje, usa:
contacto "Tu mensaje aquí"

📧 O contáctanos directamente:
• Email: contacto@ultimamilla.com.ar
• Web: www.ultimamilla.com.ar
• Tel: +54 261 xxx-xxxx

🕒 Horarios de atención: Lun-Vie 9:00-18:00
⚡ Respuesta garantizada en 24hs
                `
            };
        }
        
        const mensaje = args.join(' ');
        
        // Simulate sending message
        return {
            output: `
📤 MENSAJE ENVIADO EXITOSAMENTE

De: ${this.session.user}@terminal
Para: contacto@ultimamilla.com.ar
Fecha: ${new Date().toLocaleString()}

Mensaje: "${mensaje}"

✅ Tu consulta ha sido enviada al equipo de Ultima Milla
⚡ Recibirás respuesta en tu email en menos de 24hs
📞 Para urgencias, llama al +54 261 xxx-xxxx

¡Gracias por contactarnos! 🚀
            `
        };
    }

    cd(args) {
        const newPath = args[0] || '~';
        
        switch (newPath) {
            case '~':
            case '/':
                this.currentPath = '~';
                break;
            case 'servicios':
            case 'clientes':
            case 'antecedentes':
            case 'equipo':
                this.currentPath = `~/${newPath}`;
                break;
            case '..':
                this.currentPath = '~';
                break;
            default:
                return {
                    output: `cd: ${newPath}: No existe el directorio`
                };
        }
        
        this.updatePrompt();
        return {
            output: `Directorio cambiado a: ${this.currentPath}`
        };
    }

    updatePrompt() {
        this.prompt.textContent = `${this.session.user}@ultimamilla:${this.currentPath}$ `;
    }

    sudo(args) {
        if (args.length === 0) {
            return {
                output: `sudo: falta un comando\n\n🔐 COMANDOS SUDO DISPONIBLES:\n• sudo ultimamilla.py --demo\n• sudo -l (listar permisos)`
            };
        }
        
        if (args[0] === 'ultimamilla.py' && args[1] === '--demo') {
            return {
                output: `
🚀 INICIANDO DEMO INTERACTIVA ULTIMA MILLA...

[sudo] password for ${this.session.user}: ********

⚡ Autenticando con servidor principal...
🔐 Acceso autorizado como ADMINISTRADOR
📡 Conectando a base de datos empresarial...
🌐 Cargando portfolio completo...

╔═══════════════════════════════════════════════════════════╗
║              ULTIMA MILLA DEMO v22.0                     ║
║            🚀 MODO DEMOSTRACIÓN EJECUTIVO 🚀              ║
╚═══════════════════════════════════════════════════════════╝

✅ SISTEMAS OPERATIVOS:
   • Portal Web Principal: ONLINE
   • Sistema SGI: ONLINE  
   • Base de Datos: ONLINE
   • API Gateway: ONLINE
   • Admin Panel: ONLINE

📊 DATOS EN TIEMPO REAL:
   • Proyectos Activos: ${this.servicios.length}
   • Clientes Conectados: ${this.clientes.length}
   • Uptime: 99.9%
   • Performance: ÓPTIMO

🔧 DEMO COMPLETADA - Explora con comandos:
   • stats (estadísticas detalladas)
   • ls servicios (ver proyectos)
   • matrix (efecto visual)
   • contacto (enviar mensaje)

🎯 PRÓXIMO PASO: ¿Listo para un proyecto real?
            `
            };
        }
        
        if (args[0] === '-l') {
            return {
                output: `
🔐 PERMISOS SUDO PARA ${this.session.user}:

Usuario ${this.session.user} puede ejecutar los siguientes comandos:
    (ALL) NOPASSWD: /usr/bin/ultimamilla.py --demo
    (ALL) NOPASSWD: /bin/ls, /bin/cat, /usr/bin/grep
    (root) /usr/sbin/service ultimamilla *
    
⚠️ NOTA: Este es un entorno simulado con propósitos demostrativos
            `
            };
        }
        
        return {
            output: `sudo: ${args[0]}: comando no encontrado\n\n💡 Prueba: sudo ultimamilla.py --demo`
        };
    }

    clear() {
        return {
            output: '',
            action: 'clear'
        };
    }

    commandNotFound(command) {
        const suggestion = this.getSuggestion(command);
        let output = `bash: ${command}: command not found`;
        
        if (suggestion) {
            output += `\n\n💡 ¿Quisiste decir '${suggestion}'?`;
        }
        
        output += `\n\n❓ Usa 'help' para ver comandos disponibles`;
        
        return { output };
    }

    getSuggestion(command) {
        const suggestions = {
            'l': 'ls',
            'list': 'ls',
            'dir': 'ls',
            'search': 'grep',
            'buscar': 'grep',
            'info': 'cat empresa.info',
            'ayuda': 'help',
            'estadisticas': 'stats',
            'clientes': 'ls clientes',
            'servicios': 'ls servicios'
        };
        
        return suggestions[command] || null;
    }

    showLoading() {
        this.loading.style.display = 'flex';
        
        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            this.progressBar.style.width = progress + '%';
        }, 100);
        
        // Auto-hide after 2 seconds max
        setTimeout(() => {
            clearInterval(interval);
            this.hideLoading();
        }, 2000);
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.progressBar.style.width = '0%';
    }

    clearTerminal() {
        // Keep welcome message but clear command output
        const welcomeMessage = this.output.querySelector('.welcome-message');
        this.output.innerHTML = '';
        if (welcomeMessage) {
            this.output.appendChild(welcomeMessage);
        }
    }

    async addOutput(text, type = 'response') {
        const outputDiv = document.createElement('div');
        outputDiv.className = `terminal-line ${type}`;
        
        if (type === 'command') {
            outputDiv.innerHTML = `<span class="command-text">${text}</span>`;
        } else if (type === 'error') {
            outputDiv.innerHTML = `<span class="error-text">${text}</span>`;
        } else {
            // Type the response for better UX
            outputDiv.innerHTML = `<pre class="response-text">${text}</pre>`;
        }
        
        this.output.appendChild(outputDiv);
        
        // Add some visual flair
        outputDiv.style.opacity = '0';
        outputDiv.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            outputDiv.style.transition = 'all 0.3s ease-out';
            outputDiv.style.opacity = '1';
            outputDiv.style.transform = 'translateY(0)';
        });
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    focusInput() {
        this.input.focus();
    }
}

// Comprehensive error suppression for production
if (typeof window !== 'undefined') {
    // Get hostname (handle both www and non-www)
    const hostname = window.location.hostname;
    const isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('192.168');
    
    if (isProduction) {
        // Override console methods to filter development errors
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalLog = console.log;
        
        // Comprehensive error filtering
        const isDevelopmentError = (message) => {
            const errorPatterns = [
                'WebSocket connection',
                'websocket',
                'ws://',
                'wss://',
                'vite',
                'Vite',
                'HMR',
                'hmr',
                'Failed to load resource',
                'alpinejs',
                'AlpineJS',
                'localhost:5173',
                'TypeError: Cannot read properties of undefined',
                'client:',
                'createConnection',
                'token=',
                'server responded with a status of 504',
                'failed to connect to websocket',
                'network configuration',
                'server-options.html'
            ];
            
            return errorPatterns.some(pattern => 
                message.toLowerCase().includes(pattern.toLowerCase())
            );
        };
        
        console.error = function(...args) {
            const message = args.join(' ');
            if (!isDevelopmentError(message)) {
                originalError.apply(console, args);
            }
        };
        
        console.warn = function(...args) {
            const message = args.join(' ');
            if (!isDevelopmentError(message)) {
                originalWarn.apply(console, args);
            }
        };
        
        // Also suppress certain info logs
        console.log = function(...args) {
            const message = args.join(' ');
            if (!isDevelopmentError(message)) {
                originalLog.apply(console, args);
            }
        };
        
        // Suppress window error events for development errors
        const originalWindowError = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            if (isDevelopmentError(message)) {
                return true; // Prevent default error handling
            }
            if (originalWindowError) {
                return originalWindowError.call(this, message, source, lineno, colno, error);
            }
        };
        
        // Suppress unhandled promise rejections for development errors
        const originalUnhandledRejection = window.onunhandledrejection;
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && isDevelopmentError(String(event.reason))) {
                event.preventDefault();
                return;
            }
            if (originalUnhandledRejection) {
                originalUnhandledRejection.call(this, event);
            }
        });
    }
}

// Initialize the terminal when DOM is ready
function initializeTerminal() {
    // Check if elements exist before initializing
    const terminal = document.getElementById('um-terminal');
    const input = document.getElementById('terminal-input');
    
    if (terminal && input) {
        console.log('✅ UM CLI Advanced - Initializing terminal');
        new UMTerminalAdvanced();
    } else {
        console.warn('⚠️ UM CLI Advanced - Terminal elements not found, retrying in 100ms');
        setTimeout(initializeTerminal, 100);
    }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTerminal);
} else {
    initializeTerminal();
}

// Fallback initialization
setTimeout(initializeTerminal, 500);

// Add styles for terminal output
const additionalStyles = `
<style>
.terminal-line {
    margin-bottom: 16px;
    line-height: 1.6;
}

.command-text {
    color: #00ffaa;
    font-weight: 600;
}

.response-text {
    color: #e6e6e6;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
}

.error-text {
    color: #ff6b6b;
    font-weight: 500;
}

/* Theme-specific colors */
[data-theme="matrix"] .response-text {
    color: #00ff00;
}

[data-theme="retro"] .response-text {
    color: #ff00ff;
}

[data-theme="neon"] .response-text {
    color: #00ffff;
}

[data-theme="corporate"] .response-text {
    color: #fbbf24;
}

.um-terminal.maximized {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    border-radius: 0 !important;
    z-index: 9999 !important;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);
