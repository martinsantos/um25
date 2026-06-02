/**
 * Terminal Básico UM CLI - FALLBACK SIMPLE
 * Versión: 1.0-BASIC (Sin dependencias externas)
 */

class BasicUMTerminal {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.history = [];
        this.historyIndex = -1;
        this.currentDirectory = '/ultimamilla';
        this.commands = this.initializeCommands();
        
        if (this.container) {
            this.init();
        }
    }
    
    init() {
        this.setupHTML();
        this.setupEventListeners();
        this.showWelcome();
        this.focusInput();
    }
    
    setupHTML() {
        this.container.innerHTML = `
            <div class="terminal-window">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <span class="control close"></span>
                        <span class="control minimize"></span>
                        <span class="control maximize"></span>
                    </div>
                    <div class="terminal-title">ULTIMA MILLA CLI - Terminal Básico</div>
                </div>
                <div class="terminal-content">
                    <div id="terminal-output" class="terminal-output"></div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt">usuario@ultimamilla:${this.currentDirectory}$</span>
                        <input type="text" id="terminal-input" class="terminal-input" autocomplete="off">
                    </div>
                </div>
            </div>
        `;
        
        this.output = document.getElementById('terminal-output');
        this.input = document.getElementById('terminal-input');
        this.prompt = document.querySelector('.terminal-prompt');
    }
    
    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });
        
        this.container.addEventListener('click', () => {
            this.focusInput();
        });
    }
    
    focusInput() {
        if (this.input) {
            this.input.focus();
        }
    }
    
    executeCommand() {
        const command = this.input.value.trim();
        if (!command) return;
        
        // Agregar al historial
        this.history.push(command);
        this.historyIndex = this.history.length;
        
        // Mostrar comando en output
        this.addOutput(`<div class="command-line">
            <span class="prompt">usuario@ultimamilla:${this.currentDirectory}$</span>
            <span class="command">${command}</span>
        </div>`);
        
        // Ejecutar comando
        const result = this.processCommand(command);
        if (result) {
            this.addOutput(`<div class="command-result">${result}</div>`);
        }
        
        // Limpiar input
        this.input.value = '';
        this.scrollToBottom();
    }
    
    processCommand(input) {
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (this.commands[cmd]) {
            return this.commands[cmd](args);
        } else {
            return `<span class="error">Comando '${cmd}' no encontrado. Usa 'help' para ver comandos disponibles.</span>`;
        }
    }
    
    initializeCommands() {
        return {
            'help': () => this.showHelp(),
            'clear': () => this.clearTerminal(),
            'ls': () => this.listDirectory(),
            'pwd': () => `<span class="info">${this.currentDirectory}</span>`,
            'whoami': () => `<span class="info">visitante</span>`,
            'date': () => `<span class="info">${new Date().toLocaleString('es-AR')}</span>`,
            'echo': (args) => `<span class="info">${args.join(' ')}</span>`,
            'historia': () => this.showHistory(),
            'version': () => `<span class="info">UM CLI Basic v1.0 - Terminal de Fallback</span>`,
            'empresa': () => this.showCompany(),
            'contacto': () => this.showContact(),
            'servicios': () => this.showServices(),
            'hello': () => `<span class="success">¡Hola! Bienvenido a ULTIMA MILLA CLI básico</span>`
        };
    }
    
    showWelcome() {
        const welcome = `
            <div class="welcome-message">
                <pre class="ascii-art">
 ╦ ╦╦  ╔╦╗╦╔╦╗╔═╗  ╔╦╗╦╦  ╦  ╔═╗
 ║ ║║   ║ ║║║║╠═╣  ║║║║║  ║  ╠═╣
 ╚═╝╩═╝ ╩ ╩╩ ╩╩ ╩  ╩ ╩╩╩═╝╩═╝╩ ╩
                </pre>
                <div class="welcome-text">
                    <p>🚀 <strong>ULTIMA MILLA - Terminal CLI Básico</strong></p>
                    <p>📍 Especialistas en comunicaciones y sistemas desde 2003</p>
                    <p>💻 Terminal de fallback - Funcionalidad básica garantizada</p>
                    <p>⚡ Escribe <span class="highlight">'help'</span> para ver comandos disponibles</p>
                </div>
            </div>
        `;
        this.addOutput(welcome);
    }
    
    showHelp() {
        return `
            <div class="help-content">
                <h3>📋 COMANDOS DISPONIBLES - UM CLI BÁSICO</h3>
                <div class="command-list">
                    <div><span class="cmd">help</span> - Mostrar esta ayuda</div>
                    <div><span class="cmd">clear</span> - Limpiar terminal</div>
                    <div><span class="cmd">ls</span> - Listar contenido</div>
                    <div><span class="cmd">pwd</span> - Directorio actual</div>
                    <div><span class="cmd">whoami</span> - Usuario actual</div>
                    <div><span class="cmd">date</span> - Fecha y hora</div>
                    <div><span class="cmd">version</span> - Versión del terminal</div>
                    <div><span class="cmd">empresa</span> - Información de ULTIMA MILLA</div>
                    <div><span class="cmd">contacto</span> - Datos de contacto</div>
                    <div><span class="cmd">servicios</span> - Nuestros servicios</div>
                    <div><span class="cmd">historia</span> - Historial de comandos</div>
                    <div><span class="cmd">echo [texto]</span> - Imprimir texto</div>
                </div>
                <p>💡 <em>Use las flechas ↑↓ para navegar por el historial</em></p>
            </div>
        `;
    }
    
    clearTerminal() {
        this.output.innerHTML = '';
        return null;
    }
    
    listDirectory() {
        return `
            <div class="directory-listing">
                <div class="dir-header">📁 Contenido de ${this.currentDirectory}:</div>
                <div class="file-list">
                    <div class="file">📂 servicios/</div>
                    <div class="file">📂 proyectos/</div>
                    <div class="file">📂 clientes/</div>
                    <div class="file">📄 empresa.info</div>
                    <div class="file">📄 contacto.txt</div>
                    <div class="file">📄 README.md</div>
                </div>
            </div>
        `;
    }
    
    showHistory() {
        if (this.history.length === 0) {
            return '<span class="info">Historial vacío</span>';
        }
        
        let output = '<div class="history-list"><h4>📜 Historial de comandos:</h4>';
        this.history.forEach((cmd, index) => {
            output += `<div>${index + 1}: ${cmd}</div>`;
        });
        output += '</div>';
        return output;
    }
    
    showCompany() {
        return `
            <div class="company-info">
                <h3>🏢 ULTIMA MILLA</h3>
                <p><strong>Fundada:</strong> 2003</p>
                <p><strong>Especialidad:</strong> Comunicaciones, Sistemas e Integración</p>
                <p><strong>Experiencia:</strong> +21 años en el mercado</p>
                <p><strong>Proyectos:</strong> +400 proyectos completados</p>
                <p><strong>Ubicación:</strong> Mendoza, Argentina</p>
                <p><strong>Misión:</strong> Conectando el futuro con tecnología de vanguardia</p>
            </div>
        `;
    }
    
    showContact() {
        return `
            <div class="contact-info">
                <h3>📞 INFORMACIÓN DE CONTACTO</h3>
                <p><strong>Email:</strong> info@ultimamilla.com</p>
                <p><strong>Web:</strong> ultimamilla.com.ar</p>
                <p><strong>Ubicación:</strong> Mendoza, Argentina</p>
                <p><strong>Horarios:</strong> Lun-Vie 9:00-18:00</p>
                <p>📧 Para consultas comerciales: contacto@ultimamilla.com</p>
            </div>
        `;
    }
    
    showServices() {
        return `
            <div class="services-info">
                <h3>⚙️ NUESTROS SERVICIOS</h3>
                <div class="service-list">
                    <div>🌐 <strong>Redes y Comunicaciones:</strong> Infraestructura de red, WiFi, telefonía IP</div>
                    <div>💻 <strong>Desarrollo de Software:</strong> Aplicaciones web, sistemas a medida</div>
                    <div>🔒 <strong>Seguridad Informática:</strong> Auditorías, firewalls, monitoreo</div>
                    <div>🛠️ <strong>Soporte IT:</strong> Mantenimiento y soporte técnico</div>
                    <div>📊 <strong>Consultoría:</strong> Análisis y optimización de sistemas</div>
                </div>
                <p>💡 <em>+400 proyectos exitosos con clientes públicos y privados</em></p>
            </div>
        `;
    }
    
    navigateHistory(direction) {
        if (this.history.length === 0) return;
        
        if (direction === 'up' && this.historyIndex > 0) {
            this.historyIndex--;
            this.input.value = this.history[this.historyIndex];
        } else if (direction === 'down' && this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.input.value = this.history[this.historyIndex];
        } else if (direction === 'down' && this.historyIndex === this.history.length - 1) {
            this.historyIndex = this.history.length;
            this.input.value = '';
        }
    }
    
    addOutput(content) {
        this.output.innerHTML += content;
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Buscar contenedores del terminal
    const terminalContainers = ['um-terminal-enhanced', 'terminal-container', 'um-cli-terminal'];
    
    for (const containerId of terminalContainers) {
        const container = document.getElementById(containerId);
        if (container) {
            console.log('✅ Terminal Básico inicializado en:', containerId);
            new BasicUMTerminal(containerId);
            break;
        }
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BasicUMTerminal = BasicUMTerminal;
}
