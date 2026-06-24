/**
 * UMCliPlugin.js - Plugin modular del UM CLI
 * 
 * Este plugin puede ser usado en:
 * - Página home principal
 * - Otras páginas del sitio
 * - Sitios externos como iframe
 * - Aplicaciones de terceros
 * 
 * Version: 3.0 - No Dependencies
 */

// Simple terminal engine integrado
class UMTerminalEngine {
  constructor() {
    this.commands = this.initializeCommands();
    this.history = [];
    this.aliases = {
      'll': 'ls -la',
      'dir': 'ls',
      'cls': 'clear',
      'ayuda': 'help'
    };
  }

  initializeCommands() {
    return {
      'help': () => this.showHelp(),
      'clear': () => '<!-- CLEAR -->',
      'ls': (args) => this.listServices(args),
      'grep': (args) => this.searchProjects(args),
      'stats': (args) => this.showStats(args),
      'top': (args) => this.showTopProjects(args),
      'sudo': (args) => this.handleSudo(args),
      'contacto': (args) => this.showContact(args),
      'whoami': () => this.whoami(),
      'date': () => this.showDate(),
      'uptime': () => this.showUptime()
    };
  }

  async executeCommand(input) {
    const parts = input.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Check aliases
    if (this.aliases[cmd]) {
      const aliasedCommand = this.aliases[cmd].split(' ');
      return this.executeCommand(aliasedCommand.concat(args).join(' '));
    }

    if (this.commands[cmd]) {
      try {
        const result = await this.commands[cmd](args);
        this.history.push(input);
        return result;
      } catch (error) {
        return `<div class="command-error">Error ejecutando '${cmd}': ${error.message}</div>`;
      }
    }

    return `<div class="command-error">Comando '${cmd}' no encontrado. Usa 'help' para ver comandos disponibles.</div>`;
  }

  showHelp() {
    return `<div class="command-success">
🚀 ULTIMA MILLA CLI - COMANDOS DISPONIBLES
═══════════════════════════════════════════════════════════════

📊 EXPLORACIÓN DE DATOS:
  ls [servicios|proyectos]     - Listar servicios o proyectos
  grep [término]               - Buscar en proyectos por término
  stats [--clientes|--anos]    - Estadísticas de la empresa
  top [--proyectos|--clientes] - Top proyectos o clientes

🔧 INFORMACIÓN:
  sudo ultimamilla.py --demo   - Demostración completa
  contacto [info|email|wa]     - Información de contacto
  whoami                       - Información del usuario
  date                         - Fecha y hora actual
  uptime                       - Tiempo de funcionamiento

🖥️  SISTEMA:
  help                         - Mostrar esta ayuda
  clear                        - Limpiar terminal
  history                      - Historial de comandos

💡 EJEMPLOS:
  • grep "Quilmes"             - Buscar proyectos de Quilmes
  • ls servicios               - Ver servicios disponibles
  • stats --clientes           - Estadísticas de clientes
  • contacto info              - Ver info de contacto

═══════════════════════════════════════════════════════════════
</div>`;
  }

  listServices(args) {
    if (args.includes('servicios')) {
      return `<div class="command-success">
📋 SERVICIOS ULTIMA MILLA
═══════════════════════════════════════════════════════════════

🔐 SEGURIDAD INFORMÁTICA
   • Auditorías de seguridad
   • Implementación de firewalls
   • Monitoreo 24/7
   • Backup y recuperación

🌐 REDES Y COMUNICACIONES
   • Cableado estructurado
   • Redes empresariales
   • WiFi corporativo
   • Telefonía IP

💻 SOFTWARE Y SERVICIOS
   • Desarrollo web
   • Aplicaciones a medida
   • Integración de sistemas
   • Mantenimiento de software

📊 ESTADÍSTICAS:
   • 469+ proyectos completados
   • 22 años de experiencia
   • 150+ clientes activos
   • Cobertura en toda Mendoza

═══════════════════════════════════════════════════════════════
</div>`;
    }
    return this.showGeneralListing();
  }

  showGeneralListing() {
    return `<div class="command-success">
📁 DIRECTORIO PRINCIPAL - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

drwxr-xr-x  5 admin  admin  160 Sep  7 20:30 servicios/
drwxr-xr-x  3 admin  admin   96 Sep  7 20:30 proyectos/
drwxr-xr-x  2 admin  admin   64 Sep  7 20:30 clientes/
drwxr-xr-x  2 admin  admin   64 Sep  7 20:30 stats/
-rw-r--r--  1 admin  admin 1024 Sep  7 20:30 README.md
-rw-r--r--  1 admin  admin  512 Sep  7 20:30 empresa.info

💡 Usa 'ls servicios' para ver servicios detallados
💡 Usa 'grep [término]' para buscar proyectos
💡 Usa 'stats --clientes' para estadísticas

═══════════════════════════════════════════════════════════════
</div>`;
  }

  searchProjects(args) {
    const searchTerm = args.join(' ');
    if (!searchTerm) {
      return `<div class="command-error">Uso: grep [término de búsqueda]</div>`;
    }

    // Simulación de búsqueda de proyectos
    const mockResults = [
      { client: 'Gobierno de Mendoza', project: 'Modernización de sistemas', year: 2023 },
      { client: 'Hospital Central', project: 'Red de comunicaciones', year: 2022 },
      { client: 'Municipalidad de Godoy Cruz', project: 'Portal web ciudadano', year: 2023 },
      { client: 'Bodegas Catena', project: 'ERP personalizado', year: 2021 },
      { client: 'AFIP Mendoza', project: 'Infraestructura de redes', year: 2022 }
    ];

    const filteredResults = mockResults.filter(r => 
      r.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.project.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredResults.length === 0) {
      return `<div class="command-info">No se encontraron proyectos con el término "${searchTerm}"</div>`;
    }

    return `<div class="command-success">
🔍 RESULTADOS DE BÚSQUEDA: "${searchTerm}"
═══════════════════════════════════════════════════════════════

${filteredResults.map((result, index) => 
  `${index + 1}. 🏢 ${result.client}
   📋 ${result.project}
   📅 Año: ${result.year}\n`
).join('\n')}

📊 Total encontrado: ${filteredResults.length} proyectos

═══════════════════════════════════════════════════════════════
</div>`;
  }

  showStats(args) {
    if (args.includes('--clientes')) {
      return `<div class="command-success">
📊 ESTADÍSTICAS DE CLIENTES - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

👥 RESUMEN GENERAL:
   • Total clientes atendidos: 150+
   • Clientes activos: 89
   • Tasa de retención: 94%
   • Satisfacción promedio: 4.8/5

🏛️  SECTOR PÚBLICO (35%):
   • Gobierno de Mendoza
   • Municipalidades (12)
   • Hospitales públicos (8)
   • Universidades (3)

🏢 SECTOR PRIVADO (65%):
   • Bodegas y viñedos (23)
   • Clínicas privadas (15)
   • Empresas comerciales (45)
   • Industrias (12)

🌍 COBERTURA GEOGRÁFICA:
   • Ciudad de Mendoza: 45%
   • Gran Mendoza: 35%
   • Interior provincial: 20%

═══════════════════════════════════════════════════════════════
</div>`;
    }

    return `<div class="command-success">
📈 ESTADÍSTICAS GENERALES - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

🚀 EMPRESA:
   • Años en el mercado: 22 (desde 2000)
   • Proyectos completados: 469+
   • Tasa de éxito: 98.5%
   • Equipo técnico: 15 profesionales

💼 PROYECTOS POR AÑO:
   • 2023: 45 proyectos
   • 2022: 52 proyectos
   • 2021: 38 proyectos
   • Promedio: 40 proyectos/año

🏆 ESPECIALIDADES:
   • Redes y comunicaciones: 45%
   • Desarrollo de software: 30%
   • Seguridad informática: 25%

🌟 RECONOCIMIENTOS:
   • Proveedor preferido Gob. Mendoza
   • Certificación ISO 9001
   • Partner oficial Microsoft

═══════════════════════════════════════════════════════════════
</div>`;
  }

  showTopProjects(args) {
    return `<div class="command-success">
🏆 TOP PROYECTOS - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

1. 🏛️  GOBIERNO DE MENDOZA - Red Provincial
   💰 Presupuesto: $2.5M ARG
   📅 Duración: 18 meses
   👥 Equipo: 8 técnicos
   ⭐ Impacto: Conectividad en 18 departamentos

2. 🏥 HOSPITAL CENTRAL - Sistema Integral
   💰 Presupuesto: $1.8M ARG
   📅 Duración: 12 meses
   👥 Equipo: 6 técnicos
   ⭐ Impacto: Digitalización completa

3. 🍷 CATENA ZAPATA - ERP Vitivinícola
   💰 Presupuesto: $1.2M ARG
   📅 Duración: 10 meses
   👥 Equipo: 5 técnicos
   ⭐ Impacto: Automatización de procesos

4. 🏢 AFIP REGIONAL - Infraestructura
   💰 Presupuesto: $950K ARG
   📅 Duración: 8 meses
   👥 Equipo: 4 técnicos
   ⭐ Impacto: Modernización tecnológica

5. 🏫 UNCuyo - Campus Digital
   💰 Presupuesto: $780K ARG
   📅 Duración: 6 meses
   👥 Equipo: 6 técnicos
   ⭐ Impacto: WiFi en todo el campus

═══════════════════════════════════════════════════════════════
</div>`;
  }

  handleSudo(args) {
    if (args[0] === 'ultimamilla.py' && args.includes('--demo')) {
      return this.showDemo();
    }
    return `<div class="command-error">sudo: comando no autorizado. Use 'sudo ultimamilla.py --demo' para la demostración.</div>`;
  }

  showDemo() {
    return `<div class="command-success">
🎬 DEMOSTRACIÓN ULTIMA MILLA - MODO ADMINISTRATIVO
═══════════════════════════════════════════════════════════════

🔐 Acceso autorizado como: admin@ultimamilla
⚡ Iniciando demostración completa...

📊 CARGANDO DATOS EMPRESARIALES:
   ✅ Base de datos de proyectos: 469 registros
   ✅ Clientes activos: 89 empresas
   ✅ Servicios disponibles: 15 categorías
   ✅ Equipo técnico: 15 profesionales

🚀 CAPACIDADES DEL SISTEMA:
   • Gestión integral de proyectos
   • Seguimiento en tiempo real
   • Reportes automáticos
   • Integración con sistemas externos
   • API REST para terceros

💡 COMANDOS ESPECIALES DESBLOQUEADOS:
   • advanced-search [criterios]
   • project-timeline [id]
   • client-portal [cliente]
   • team-status
   • system-monitor

🎯 PRÓXIMOS PASOS:
   1. Use 'contacto info' para comunicarse
   2. Explore con 'ls servicios'
   3. Busque proyectos con 'grep [término]'
   4. Vea estadísticas con 'stats'

═══════════════════════════════════════════════════════════════
</div>`;
  }

  showContact(args) {
    const contactInfo = `<div class="command-success">
📞 CONTACTO - ULTIMA MILLA
═══════════════════════════════════════════════════════════════

🏢 OFICINA PRINCIPAL:
   📍 Av. San Martín 1234, Ciudad de Mendoza
   ☎️  +54 261 123 4567
   📧 info@ultimamilla.com.ar
   🌐 ultimamilla.com.ar

💬 WHATSAPP COMERCIAL:
   📱 +54 261 123 4567
   💭 "Hola! Vengo desde el sitio web de ULTIMA MILLA"

⏰ HORARIOS DE ATENCIÓN:
   📅 Lunes a Viernes: 9:00 - 18:00
   📅 Sábados: 9:00 - 13:00
   📅 Domingos: Solo emergencias

🚨 SOPORTE TÉCNICO 24/7:
   📞 +54 261 456 7890
   📧 soporte@ultimamilla.com.ar

═══════════════════════════════════════════════════════════════
</div>`;
    
    if (args.includes('email')) {
      window.open('mailto:info@ultimamilla.com.ar?subject=Consulta desde sitio web ULTIMA MILLA');
    }
    if (args.includes('wa')) {
      window.open('https://wa.me/5492611234567?text=Hola! Vengo desde el sitio web de ULTIMA MILLA');
    }
    
    return contactInfo;
  }

  whoami() {
    return `<div class="command-info">
visitante@ultimamilla.com.ar

👤 Usuario: Visitante
🌐 Dominio: ultimamilla.com.ar
🔐 Privilegios: Lectura
📍 Ubicación: Mendoza, Argentina
⏰ Sesión iniciada: ${new Date().toLocaleString()}
</div>`;
  }

  showDate() {
    return `<div class="command-info">${new Date().toLocaleString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Mendoza'
    })}</div>`;
  }

  showUptime() {
    return `<div class="command-info">
⏱️  TIEMPO DE FUNCIONAMIENTO - ULTIMA MILLA

🖥️  Servidor web: 99.8% uptime (22 años)
🌐 Sitio web: Operativo desde 2000
💼 Empresa: 22 años en funcionamiento
🔧 Último mantenimiento: Ayer 02:00 AM

📊 Estadísticas de rendimiento:
   • Tiempo promedio de respuesta: 250ms
   • Disponibilidad mensual: 99.9%
   • Proyectos en ejecución: 12
</div>`;
  }
}

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
    this.commandHistory = [];
    this.historyIndex = -1;
    
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
        font-family: 'Open Sans', Arial, system-ui, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        width: 100%;
        max-width: 900px;
        margin: 20px auto;
        position: relative;
      }

      .um-cli-plugin[data-theme="dark"] {
        --bg-primary: #111111;
        --bg-secondary: #050505;
        --border-color: rgba(255, 255, 255, 0.14);
        --text-primary: #f5f5f5;
        --text-secondary: #d4d4d4;
        --accent-color: #DC2626;
        --success-color: #ffffff;
        --error-color: #ffffff;
        --info-color: #ffffff;
      }

      .um-cli-plugin[data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #f5f5f5;
        --border-color: #e1e4e8;
        --text-primary: #111111;
        --text-secondary: #4b5563;
        --accent-color: #DC2626;
        --success-color: #111111;
        --error-color: #111111;
        --info-color: #111111;
      }

      .um-terminal {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
        height: 500px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: border-color 0.24s ease, box-shadow 0.24s ease;
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
        transition: transform 0.18s ease-out, filter 0.18s ease-out;
      }

      .um-close { background: #DC2626; }
      .um-minimize { background: #ffffff; opacity: 0.64; }
      .um-maximize { background: #ffffff; opacity: 0.36; }

      .um-control:hover {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

      .um-terminal-title {
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        flex: 1;
        margin-left: -60px;
      }

      .um-terminal-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        color: var(--text-primary);
        background: transparent;
      }

      .um-welcome-message {
        margin-bottom: 20px;
      }

      .um-ascii-art {
        color: var(--text-primary);
        font-size: 16px;
        margin-bottom: 16px;
        line-height: 1.35;
        text-shadow: none;
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
        background: rgba(220, 38, 38, 0.08);
        color: var(--text-primary);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: inherit;
        font-size: 1rem;
      }

      .um-terminal-input-line {
        padding: 12px 16px;
        background: color-mix(in srgb, var(--bg-secondary) 86%, transparent);
        border-top: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .um-prompt {
        color: var(--accent-color);
        font-weight: 600;
        white-space: nowrap;
        text-shadow: none;
      }

      .um-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 16px;
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
        border-left: 3px solid var(--accent-color);
        padding-left: 10px;
      }

      .um-command-error {
        color: var(--error-color);
        border-left: 3px solid var(--accent-color);
        padding-left: 10px;
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
        background: rgba(220, 38, 38, 0.72);
        border-radius: 3px;
      }

      .um-terminal-body::-webkit-scrollbar-thumb:hover {
        background: #DC2626;
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
          font-size: 16px;
          padding: 12px;
        }
        
        .um-ascii-art {
          font-size: 16px;
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
        color: #ffffff;
        border-left: 3px solid #DC2626;
        padding-left: 10px;
        text-shadow: none;
        animation: um-data-pulse 1s infinite alternate;
      }

      @keyframes um-data-pulse {
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
║     22 años de experiencia técnica         ║
║     +469 proyectos publicados              ║
║     150+ clientes y organismos             ║
║     comandos para explorar evidencia       ║
╚════════════════════════════════════════════╝

COMANDOS PARA EMPEZAR:
   help             → Ver todos los comandos disponibles
   sudo ultimamilla.py --demo → Demo completa de la empresa
   ls servicios     → Explorar nuestros servicios
   grep "Quilmes"   → Buscar proyectos de Quilmes
   stats --clientes → Estadísticas de clientes
   matrix           → Modo de lectura alternativa

Escribe un comando o usa los accesos para comenzar.
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
        const output = await this.engine.executeCommand(command);
        result = { success: true, output: output };
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
    
    // Check if text contains HTML
    if (text.includes('<')) {
      div.innerHTML = text;
    } else {
      div.textContent = text;
    }
    
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

// Export para compatibilidad
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UMCliPlugin;
}

// Global para uso directo en navegador
window.UMCliPlugin = UMCliPlugin;
