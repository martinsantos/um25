/**
 * UMCliPlugin.js - Plugin modular del UM CLI
 * 
 * Este plugin puede ser usado en:
 * - Página home principal
 * - Otras páginas del sitio
 * - Sitios externos como iframe
 * - Aplicaciones de terceros
 */

import UMTerminalEngine from '../components/UMTerminalEngine.js';

class UMCliPlugin {
  constructor(options = {}) {
    this.options = {
      container: options.container || '#um-cli-container',
      theme: options.theme || 'dark',
      autoFocus: options.autoFocus !== false,
      showWelcome: options.showWelcome !== false,
      allowFullscreen: options.allowFullscreen !== false,
      customCommands: options.customCommands || {},
      apiEndpoint: options.apiEndpoint || null,
      ...options
    };
    
    this.engine = new UMTerminalEngine();
    this.isInitialized = false;
    this.isFullscreen = false;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.createHTML();
      this.attachStyles();
      this.setupEventListeners();
      this.displayWelcome();
      
      if (this.options.autoFocus) {
        this.focus();
      }
      
      this.isInitialized = true;
      this.fireEvent('initialized', { plugin: this });
      
    } catch (error) {
      console.error('Error initializing UM CLI Plugin:', error);
    }
  }

  createHTML() {
    const container = document.querySelector(this.options.container);
    if (!container) {
      throw new Error(`Container ${this.options.container} not found`);
    }

    container.innerHTML = `
      <div class="um-cli-plugin" data-theme="${this.options.theme}">
        <div class="um-terminal">
          <div class="um-terminal-header">
            <div class="um-terminal-controls">
              <button class="um-control um-close" data-action="close"></button>
              <button class="um-control um-minimize" data-action="minimize"></button>
              <button class="um-control um-maximize" data-action="fullscreen"></button>
            </div>
            <div class="um-terminal-title">ULTIMA MILLA CLI v22.0 - Conectando el futuro</div>
          </div>
          
          <div class="um-terminal-body" id="um-output">
            <div class="um-welcome-message">
              <pre class="um-ascii-art"></pre>
              <div class="um-welcome-info">
                <p>🚀 Bienvenido al <strong>ULTIMA MILLA CLI</strong> - Terminal interactivo</p>
                <p>📊 Datos reales: 201+ proyectos, 150+ clientes, 22 años de experiencia</p>
                <p>💡 Escribe <code>help</code> para comandos disponibles</p>
                <p>⚡ Prueba <code>sudo ultimamilla.py --demo</code> para demo completa</p>
              </div>
            </div>
          </div>
          
          <div class="um-terminal-input-line">
            <span class="um-prompt">visitante@ultimamilla:~$ </span>
            <input 
              type="text" 
              class="um-input" 
              placeholder="Escribe un comando..."
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </div>
      </div>
    `;

    // Referencias DOM
    this.elements = {
      container: container,
      plugin: container.querySelector('.um-cli-plugin'),
      terminal: container.querySelector('.um-terminal'),
      output: container.querySelector('#um-output'),
      input: container.querySelector('.um-input'),
      prompt: container.querySelector('.um-prompt'),
      asciiArt: container.querySelector('.um-ascii-art'),
      controls: {
        close: container.querySelector('[data-action="close"]'),
        minimize: container.querySelector('[data-action="minimize"]'),
        fullscreen: container.querySelector('[data-action="fullscreen"]')
      }
    };
  }

  attachStyles() {
    if (document.getElementById('um-cli-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'um-cli-styles';
    styles.textContent = this.getCSS();
    document.head.appendChild(styles);
  }

  getCSS() {
    return `
      .um-cli-plugin {
        font-family: 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
        font-size: 14px;
        line-height: 1.5;
        width: 100%;
        max-width: 900px;
        margin: 20px auto;
        position: relative;
      }

      .um-cli-plugin[data-theme="dark"] {
        --bg-primary: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        --bg-secondary: linear-gradient(90deg, #21262d 0%, #30363d 100%);
        --border-color: #30363d;
        --text-primary: #e6edf3;
        --text-secondary: #8b949e;
        --accent-color: #00d4aa;
        --success-color: #7ee787;
        --error-color: #f85149;
        --info-color: #79c0ff;
      }

      .um-cli-plugin[data-theme="light"] {
        --bg-primary: linear-gradient(135deg, #ffffff 0%, #f6f8fa 100%);
        --bg-secondary: linear-gradient(90deg, #f6f8fa 0%, #e1e7ef 100%);
        --border-color: #d1d9e0;
        --text-primary: #24292f;
        --text-secondary: #656d76;
        --accent-color: #0366d6;
        --success-color: #28a745;
        --error-color: #d73a49;
        --info-color: #0366d6;
      }

      .um-terminal {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
        height: 500px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .um-terminal.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        height: 100vh;
        border-radius: 0;
        box-shadow: none;
      }

      .um-terminal-header {
        background: var(--bg-secondary);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color);
        user-select: none;
      }

      .um-terminal-controls {
        display: flex;
        gap: 8px;
      }

      .um-control {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .um-close { background: #ff5f57; }
      .um-minimize { background: #ffbd2e; }
      .um-maximize { background: #28ca42; }

      .um-control:hover {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

      .um-terminal-title {
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        flex: 1;
        margin-left: -60px;
      }

      .um-terminal-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        color: var(--text-primary);
        background: rgba(13, 17, 23, 0.4);
      }

      .um-welcome-message {
        margin-bottom: 20px;
      }

      .um-ascii-art {
        color: var(--accent-color);
        font-size: 10px;
        margin-bottom: 16px;
        text-shadow: 0 0 10px rgba(0, 212, 170, 0.3);
      }

      .um-welcome-info p {
        margin: 8px 0;
        color: var(--text-secondary);
      }

      .um-welcome-info strong {
        color: var(--accent-color);
        font-weight: 600;
      }

      .um-welcome-info code {
        background: rgba(110, 118, 129, 0.15);
        color: var(--info-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: inherit;
        font-size: 0.9em;
      }

      .um-terminal-input-line {
        padding: 12px 16px;
        background: rgba(13, 17, 23, 0.6);
        border-top: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .um-prompt {
        color: var(--accent-color);
        font-weight: 600;
        white-space: nowrap;
        text-shadow: 0 0 8px rgba(0, 212, 170, 0.4);
      }

      .um-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 14px;
        outline: none;
        caret-color: var(--accent-color);
      }

      .um-input::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
      }

      /* Output styles */
      .um-output-line {
        margin: 8px 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .um-command-input {
        color: var(--text-primary);
        margin: 8px 0 4px 0;
        font-weight: 500;
      }

      .um-command-success {
        color: var(--success-color);
      }

      .um-command-error {
        color: var(--error-color);
      }

      .um-command-info {
        color: var(--info-color);
      }

      /* Scrollbar */
      .um-terminal-body::-webkit-scrollbar {
        width: 6px;
      }

      .um-terminal-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .um-terminal-body::-webkit-scrollbar-thumb {
        background: rgba(110, 118, 129, 0.3);
        border-radius: 3px;
      }

      .um-terminal-body::-webkit-scrollbar-thumb:hover {
        background: rgba(110, 118, 129, 0.5);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .um-cli-plugin {
          margin: 10px;
        }
        
        .um-terminal {
          height: 400px;
          border-radius: 6px;
        }
        
        .um-terminal-body {
          font-size: 12px;
          padding: 12px;
        }
        
        .um-ascii-art {
          font-size: 8px;
        }
      }

      /* Animations */
      .um-typing {
        border-right: 2px solid var(--accent-color);
        animation: blink 1s infinite;
      }

      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }

      .um-loading {
        opacity: 0.7;
      }

      .um-matrix {
        color: #00ff00;
        text-shadow: 0 0 5px #00ff00;
        animation: matrix-glow 1s infinite alternate;
      }

      @keyframes matrix-glow {
        from { opacity: 0.8; }
        to { opacity: 1; }
      }
    `;
  }

  setupEventListeners() {
    // Input handling
    this.elements.input.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Enter':
          e.preventDefault();
          this.executeCommand();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateHistory(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateHistory(1);
          break;
        case 'Tab':
          e.preventDefault();
          this.autoComplete();
          break;
        case 'c':
          if (e.ctrlKey) {
            e.preventDefault();
            this.cancelCommand();
          }
          break;
      }
    });

    // Terminal controls
    this.elements.controls.close.addEventListener('click', () => this.close());
    this.elements.controls.minimize.addEventListener('click', () => this.minimize());
    this.elements.controls.fullscreen.addEventListener('click', () => this.toggleFullscreen());

    // Focus management
    this.elements.output.addEventListener('click', () => this.focus());
    
    // Window events
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.toggleFullscreen();
      }
    });
  }

  displayWelcome() {
    if (!this.options.showWelcome) return;

    const asciiArt = `
╔════════════════════════════════════════════╗
║              ULTIMA MILLA                  ║
║       Conectando el futuro desde 2003      ║
║                                            ║
║  💻 22 años de experiencia tecnológica     ║
║  🚀 +469 proyectos exitosos               ║
║  👥 150+ clientes satisfechos              ║
║  🔧 +30 comandos disponibles               ║
╚════════════════════════════════════════════╝

💡 COMANDOS PARA EMPEZAR:
   help             → Ver todos los comandos disponibles
   sudo ultimamilla.py --demo → Demo completa de la empresa
   ls servicios     → Explorar nuestros servicios
   grep "Quilmes"   → Buscar proyectos de Quilmes
   stats --clientes → Estadísticas de clientes
   matrix           → Easter egg divertido

📋 Escribe un comando o usa los botones de arriba para comenzar...
═══════════════════════════════════════════════════════════════
`;
    
    this.elements.asciiArt.textContent = asciiArt;
  }

  async executeCommand() {
    const command = this.elements.input.value.trim();
    if (!command) return;

    // Show command in output
    this.addOutput(`visitante@ultimamilla:~$ ${command}`, 'um-command-input');

    // Clear input
    this.elements.input.value = '';

    // Handle special frontend commands
    if (command === 'clear') {
      this.clearOutput();
      return;
    }

    try {
      this.setLoading(true);
      
      // Check for custom commands first
      if (this.options.customCommands[command]) {
        const result = await this.options.customCommands[command](command, this);
        this.handleCommandResult(result);
        return;
      }

      // Use engine or API
      let result;
      if (this.options.apiEndpoint) {
        result = await this.callAPI(command);
      } else {
        result = await this.engine.processCommand(command);
      }

      this.handleCommandResult(result);

    } catch (error) {
      this.addOutput(`Error: ${error.message}`, 'um-command-error');
    } finally {
      this.setLoading(false);
      this.focus();
      this.scrollToBottom();
    }
  }

  handleCommandResult(result) {
    if (result.action === 'clear') {
      this.clearOutput();
      return;
    }

    if (result.success) {
      if (result.output) {
        this.addOutput(result.output, 'um-command-success');
      }
      
      // Update prompt if path changed
      if (result.path) {
        const shortPath = result.path.replace('/ultimamilla', '~');
        this.elements.prompt.textContent = `visitante@ultimamilla:${shortPath}$ `;
      }
    } else {
      this.addOutput(result.output, 'um-command-error');
      if (result.suggestion) {
        this.addOutput(`💡 ¿Quisiste decir: ${result.suggestion}?`, 'um-command-info');
      }
    }

    this.fireEvent('commandExecuted', { command: result, plugin: this });
  }

  async callAPI(command) {
    const response = await fetch(this.options.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }

  addOutput(text, className = '') {
    const div = document.createElement('div');
    div.className = `um-output-line ${className}`;
    div.textContent = text;
    
    this.elements.output.appendChild(div);
    this.scrollToBottom();
  }

  clearOutput() {
    const welcome = this.elements.output.querySelector('.um-welcome-message');
    this.elements.output.innerHTML = '';
    if (this.options.showWelcome) {
      this.elements.output.appendChild(welcome);
    }
  }

  focus() {
    this.elements.input.focus();
  }

  setLoading(loading) {
    this.elements.terminal.classList.toggle('um-loading', loading);
    this.elements.input.disabled = loading;
  }

  scrollToBottom() {
    this.elements.output.scrollTop = this.elements.output.scrollHeight;
  }

  // Navigation and history
  navigateHistory(direction) {
    // Implementation similar to previous version
    // This would need to track command history
  }

  autoComplete() {
    const value = this.elements.input.value;
    const commands = ['ls', 'cd', 'cat', 'grep', 'find', 'stats', 'help', 'sudo', 'whoami', 'pwd'];
    
    const matches = commands.filter(cmd => cmd.startsWith(value));
    if (matches.length === 1) {
      this.elements.input.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      this.addOutput(`Completados posibles: ${matches.join('  ')}`, 'um-command-info');
    }
  }

  cancelCommand() {
    this.elements.input.value = '';
    this.addOutput('^C', 'um-command-info');
  }

  // Window controls
  close() {
    this.elements.plugin.style.display = 'none';
    this.fireEvent('closed', { plugin: this });
  }

  minimize() {
    this.elements.terminal.style.height = '40px';
    this.elements.output.style.display = 'none';
    this.elements.controls.minimize.style.background = '#ffbd2e';
    this.fireEvent('minimized', { plugin: this });
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.elements.terminal.classList.toggle('fullscreen', this.isFullscreen);
    
    if (this.isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    this.fireEvent('fullscreenToggled', { isFullscreen: this.isFullscreen, plugin: this });
  }

  // Plugin management
  show() {
    this.elements.plugin.style.display = 'block';
    if (this.options.autoFocus) this.focus();
    this.fireEvent('shown', { plugin: this });
  }

  hide() {
    this.elements.plugin.style.display = 'none';
    this.fireEvent('hidden', { plugin: this });
  }

  destroy() {
    if (this.elements.container) {
      this.elements.container.innerHTML = '';
    }
    
    const styles = document.getElementById('um-cli-styles');
    if (styles) styles.remove();
    
    this.fireEvent('destroyed', { plugin: this });
  }

  // Theme management
  setTheme(theme) {
    this.options.theme = theme;
    this.elements.plugin.setAttribute('data-theme', theme);
    this.fireEvent('themeChanged', { theme, plugin: this });
  }

  // Event system
  fireEvent(eventName, detail) {
    const event = new CustomEvent(`umcli:${eventName}`, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    this.elements.container.dispatchEvent(event);
  }

  on(eventName, callback) {
    this.elements.container.addEventListener(`umcli:${eventName}`, callback);
    return this;
  }

  off(eventName, callback) {
    this.elements.container.removeEventListener(`umcli:${eventName}`, callback);
    return this;
  }

  // Public API
  executeCommandProgrammatically(command) {
    this.elements.input.value = command;
    return this.executeCommand();
  }

  getStats() {
    return {
      initialized: this.isInitialized,
      fullscreen: this.isFullscreen,
      commandCount: this.engine.session?.commandCount || 0,
      theme: this.options.theme
    };
  }
}

// Factory function for easy initialization
window.UMCli = {
  create: (options) => new UMCliPlugin(options),
  
  // Quick setup for common use cases
  setupForHome: (container = '#um-cli') => {
    return new UMCliPlugin({
      container,
      theme: 'dark',
      showWelcome: true,
      autoFocus: true
    });
  },

  setupAsWidget: (container, options = {}) => {
    return new UMCliPlugin({
      container,
      theme: 'light',
      showWelcome: false,
      allowFullscreen: true,
      ...options
    });
  },

  setupForEmbed: (container, options = {}) => {
    return new UMCliPlugin({
      container,
      theme: 'dark',
      showWelcome: true,
      autoFocus: false,
      apiEndpoint: options.apiEndpoint || 'https://api.ultimamilla.com/cli',
      ...options
    });
  }
};

export default UMCliPlugin;
