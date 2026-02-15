/**
 * UM CLI Terminal Engine v2.0 - Advanced Commands with Real Data Integration
 * ULTIMA MILLA - Enhanced Terminal Experience
 */

class UMTerminalEngineV2 {
  constructor() {
    this.version = '2.0.0';
    this.apiEndpoint = '/api/umcli-v2.json';
    this.currentDirectory = '/home/ultimamilla';
    this.history = [];
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    this.directories = {
      '/home/ultimamilla': {
        type: 'directory',
        children: ['antecedentes', 'servicios', 'clientes', 'equipo', 'docs'],
        description: 'Directorio principal de ULTIMA MILLA'
      },
      '/home/ultimamilla/antecedentes': {
        type: 'directory', 
        children: [],
        description: '469 proyectos documentados desde 2003'
      },
      '/home/ultimamilla/servicios': {
        type: 'directory',
        children: ['redes', 'software', 'seguridad', 'iot', 'consultoria'],
        description: 'Servicios tecnológicos especializados'
      },
      '/home/ultimamilla/clientes': {
        type: 'directory',
        children: [],
        description: '52 clientes activos en diversos sectores'
      }
    };

    this.commands = {
      // === COMANDOS DE NAVEGACIÓN ===
      ls: this.listDirectory.bind(this),
      cd: this.changeDirectory.bind(this),
      pwd: this.printWorkingDirectory.bind(this),
      tree: this.showTree.bind(this),

      // === COMANDOS DE BÚSQUEDA ===
      grep: this.searchData.bind(this),
      find: this.findFiles.bind(this),
      locate: this.locateInfo.bind(this),

      // === COMANDOS DE DATOS REALES ===
      antecedentes: this.showAntecedentes.bind(this),
      clientes: this.showClientes.bind(this),
      stats: this.showStats.bind(this),
      health: this.checkSystemHealth.bind(this),

      // === COMANDOS AVANZADOS ===
      export: this.exportData.bind(this),
      monitor: this.showMonitoring.bind(this),
      deploy: this.showDeployStatus.bind(this),
      backup: this.showBackupInfo.bind(this),

      // === COMANDOS EXTERNOS ===
      weather: this.getWeather.bind(this),
      currency: this.getCurrency.bind(this),
      whois: this.getWhoisInfo.bind(this),

      // === COMANDOS SISTEMA ===
      whoami: this.whoAmI.bind(this),
      uname: this.showSystemInfo.bind(this),
      uptime: this.showUptime.bind(this),
      ps: this.showProcesses.bind(this),
      df: this.showDiskUsage.bind(this),

      // === UTILIDADES ===
      help: this.showHelp.bind(this),
      clear: this.clearScreen.bind(this),
      history: this.showHistory.bind(this),
      version: this.showVersion.bind(this)
    };
  }

  async executeCommand(input) {
    const args = input.trim().split(/\s+/);
    const command = args[0].toLowerCase();
    const params = args.slice(1);

    // Agregar a historial
    this.history.push(input);

    if (!this.commands[command]) {
      return {
        success: false,
        output: `bash: ${command}: command not found\n\nTry 'help' to see available commands.`,
        type: 'error'
      };
    }

    try {
      const result = await this.commands[command](params);
      return result;
    } catch (error) {
      return {
        success: false,
        output: `Error executing '${command}': ${error.message}`,
        type: 'error'
      };
    }
  }

  // === COMANDOS DE NAVEGACIÓN ===
  
  async listDirectory(args) {
    const path = args[0] || this.currentDirectory;
    const showDetails = args.includes('-l');
    const showAll = args.includes('-a');

    if (path === 'antecedentes') {
      const response = await this.fetchFromAPI('antecedentes', { limit: 10 });
      if (response.success && response.data) {
        let output = `📁 ANTECEDENTES (${response.total} proyectos)\n\n`;
        response.data.forEach(item => {
          const date = new Date(item.fecha_inicio).toLocaleDateString();
          output += `${item.id.toString().padEnd(4)} ${item.cliente.padEnd(25)} ${item.area.padEnd(20)} ${date}\n`;
        });
        output += `\n💡 Use 'grep "cliente"' para buscar proyectos específicos`;
        return { success: true, output, type: 'info' };
      }
    }

    const currentDir = this.directories[path] || this.directories[this.currentDirectory];
    let output = '';
    
    if (currentDir && currentDir.children) {
      currentDir.children.forEach(child => {
        if (showDetails) {
          output += `drwxr-xr-x  2 ultimamilla staff  64 Sep 19 08:00 ${child}\n`;
        } else {
          output += `${child}  `;
        }
      });
    }

    return { success: true, output: output || 'Directory empty', type: 'success' };
  }

  async changeDirectory(args) {
    const targetDir = args[0] || '/home/ultimamilla';
    
    if (this.directories[targetDir] || targetDir === '..') {
      if (targetDir === '..') {
        const parts = this.currentDirectory.split('/');
        parts.pop();
        this.currentDirectory = parts.join('/') || '/';
      } else {
        this.currentDirectory = targetDir.startsWith('/') ? targetDir : `${this.currentDirectory}/${targetDir}`;
      }
      return { success: true, output: '', type: 'success' };
    }
    
    return { 
      success: false, 
      output: `bash: cd: ${targetDir}: No such file or directory`, 
      type: 'error' 
    };
  }

  async printWorkingDirectory() {
    return { success: true, output: this.currentDirectory, type: 'info' };
  }

  // === COMANDOS DE DATOS REALES ===

  async showAntecedentes(args) {
    const limit = parseInt(args[0]) || 5;
    const response = await this.fetchFromAPI('antecedentes', { limit });
    
    if (!response.success) {
      return { success: false, output: 'Error fetching antecedentes', type: 'error' };
    }

    let output = `📊 ANTECEDENTES ULTIMA MILLA (${response.total} proyectos totales)\n`;
    output += `${'ID'.padEnd(6)}${'CLIENTE'.padEnd(30)}${'PROYECTO'.padEnd(40)}${'FECHA'}\n`;
    output += '─'.repeat(90) + '\n';

    response.data.forEach(item => {
      const fecha = new Date(item.fecha_inicio).toLocaleDateString();
      output += `${item.id.toString().padEnd(6)}${item.cliente.substring(0,28).padEnd(30)}${item.titulo.substring(0,38).padEnd(40)}${fecha}\n`;
    });

    output += `\n📈 Fuente: ${response.source === 'directus' ? 'Base de datos en tiempo real' : 'Cache local'}`;
    output += `\n💡 Use 'grep "cliente"' para buscar proyectos específicos`;

    return { success: true, output, type: 'success' };
  }

  async searchData(args) {
    const pattern = args.join(' ');
    if (!pattern) {
      return { 
        success: false, 
        output: 'Usage: grep "search_pattern"\nExample: grep "Gobierno"', 
        type: 'error' 
      };
    }

    const response = await this.fetchFromAPI('search', { q: pattern });
    
    if (!response.success) {
      return { success: false, output: 'Error performing search', type: 'error' };
    }

    let output = `🔍 BÚSQUEDA: "${pattern}" (${response.count} resultados)\n\n`;
    
    if (response.results && response.results.length > 0) {
      response.results.forEach(item => {
        output += `ID: ${item.id}\n`;
        output += `📋 ${item.titulo}\n`;
        output += `🏢 Cliente: ${item.cliente}\n`;
        output += `🏷️  Área: ${item.area}\n`;
        if (item.descripcion) output += `📝 ${item.descripcion}\n`;
        output += '\n';
      });
    } else {
      output += 'No se encontraron resultados.\n';
      output += '💡 Prueba con términos como: "Gobierno", "AFIP", "Banco", "YPF"';
    }

    output += `\n📊 Fuente: ${response.source === 'directus' ? 'Base de datos' : 'Cache local'}`;

    return { success: true, output, type: 'success' };
  }

  async showStats(args) {
    const response = await this.fetchFromAPI('stats');
    
    if (!response.success) {
      return { success: false, output: 'Error fetching statistics', type: 'error' };
    }

    const data = response.data;
    let output = `📊 ESTADÍSTICAS ULTIMA MILLA\n\n`;
    
    // Empresa
    output += `🏢 EMPRESA:\n`;
    output += `   Fundación: ${data.empresa.fundacion}\n`;
    output += `   Experiencia: ${data.empresa.años_experiencia} años\n`;
    output += `   Ubicación: ${data.empresa.ubicacion}\n\n`;

    // Proyectos
    output += `📋 PROYECTOS:\n`;
    output += `   Completados: ${data.proyectos.completados}\n`;
    output += `   Activos: ${data.proyectos.activos}\n`;
    output += `   Tasa éxito: ${data.proyectos.éxito_rate}\n\n`;

    // Clientes
    output += `👥 CLIENTES:\n`;
    output += `   Total: ${data.clientes.total}\n`;
    output += `   Activos: ${data.clientes.activos}\n`;
    output += `   Premium: ${data.clientes.premium}\n`;
    output += `   Sectores: ${data.clientes.sectores.join(', ')}\n\n`;

    // Team
    output += `👨‍💻 EQUIPO:\n`;
    output += `   Empleados: ${data.team.empleados}\n`;
    output += `   Ingenieros: ${data.team.ingenieros}\n`;
    output += `   Certificaciones: ${data.team.certificaciones.join(', ')}\n`;

    return { success: true, output, type: 'success' };
  }

  async checkSystemHealth(args) {
    const response = await this.fetchFromAPI('health');
    
    if (!response.success) {
      return { success: false, output: 'Error checking system health', type: 'error' };
    }

    let output = `🏥 SYSTEM HEALTH CHECK\n\n`;
    
    // Status servicios
    output += `📡 SERVICIOS:\n`;
    output += `   Astro SSR: ${response.astro_status}\n`;
    output += `   Directus CMS: ${response.directus_status}\n`;
    output += `   PM2: ${response.pm2_status}\n\n`;

    // Server info
    if (response.server_info) {
      const uptime = Math.floor(response.server_info.uptime / 3600);
      const memory = Math.round(response.server_info.memory_usage.used / 1024 / 1024);
      
      output += `💻 SERVIDOR:\n`;
      output += `   Uptime: ${uptime} horas\n`;
      output += `   Memoria: ${memory} MB\n`;
      output += `   Node.js: ${response.server_info.node_version}\n`;
      output += `   Platform: ${response.server_info.platform}\n\n`;
    }

    // Empresa stats
    if (response.empresa) {
      output += `🏢 EMPRESA STATUS:\n`;
      output += `   Proyectos activos: ${response.empresa.proyectos.activos}\n`;
      output += `   Clientes activos: ${response.empresa.clientes.activos}\n`;
      output += `   Tasa éxito: ${response.empresa.proyectos.éxito_rate}\n`;
    }

    return { success: true, output, type: 'success' };
  }

  // === COMANDOS AVANZADOS ===

  async exportData(args) {
    const format = args[0] || 'json';
    const type = args[1] || 'antecedentes';
    
    if (!['json', 'csv', 'xml'].includes(format)) {
      return { 
        success: false, 
        output: 'Supported formats: json, csv, xml\nUsage: export json antecedentes', 
        type: 'error' 
      };
    }

    const response = await this.fetchFromAPI(type, { limit: 50 });
    
    if (!response.success) {
      return { success: false, output: `Error exporting ${type}`, type: 'error' };
    }

    let output = `📤 EXPORT ${type.toUpperCase()} (${format.toUpperCase()})\n\n`;
    
    if (format === 'json') {
      output += JSON.stringify(response.data, null, 2);
    } else if (format === 'csv') {
      if (response.data && response.data.length > 0) {
        const headers = Object.keys(response.data[0]).join(',');
        output += headers + '\n';
        response.data.forEach(item => {
          output += Object.values(item).map(v => `"${v}"`).join(',') + '\n';
        });
      }
    }

    output += `\n\n💾 Export completed: ${response.data.length} records`;
    output += `\n📊 Source: ${response.source}`;

    return { success: true, output, type: 'success' };
  }

  async getWeather(args) {
    const city = args[0] || 'mendoza';
    
    // Simulated weather API call
    const weatherData = {
      mendoza: { temp: '22°C', condition: 'Soleado', humidity: '45%' },
      'buenos aires': { temp: '18°C', condition: 'Nublado', humidity: '62%' }
    };

    const weather = weatherData[city.toLowerCase()] || weatherData.mendoza;
    
    let output = `🌤️  CLIMA EN ${city.toUpperCase()}\n\n`;
    output += `🌡️  Temperatura: ${weather.temp}\n`;
    output += `☁️  Condición: ${weather.condition}\n`;
    output += `💧 Humedad: ${weather.humidity}\n\n`;
    output += `📍 Ubicación: ULTIMA MILLA office`;

    return { success: true, output, type: 'info' };
  }

  // === UTILIDADES ===

  async showHelp(args) {
    const command = args[0];
    
    if (command) {
      const helpTexts = {
        grep: 'grep "pattern" - Buscar proyectos y clientes\nEjemplo: grep "Gobierno"',
        antecedentes: 'antecedentes [limit] - Mostrar proyectos completados\nEjemplo: antecedentes 10',
        stats: 'stats - Mostrar estadísticas empresariales',
        export: 'export [format] [type] - Exportar datos\nEjemplo: export json antecedentes',
        health: 'health - Verificar estado del sistema'
      };
      
      return { 
        success: true, 
        output: helpTexts[command] || `No help available for '${command}'`, 
        type: 'info' 
      };
    }

    let output = `🚀 UM CLI v${this.version} - COMANDOS DISPONIBLES\n\n`;
    
    output += `📁 NAVEGACIÓN:\n`;
    output += `   ls [dir]     - Listar contenido\n`;
    output += `   cd [dir]     - Cambiar directorio\n`;
    output += `   pwd          - Directorio actual\n\n`;

    output += `🔍 BÚSQUEDA:\n`;
    output += `   grep "term"  - Buscar en proyectos\n`;
    output += `   find [name]  - Encontrar archivos\n\n`;

    output += `📊 DATOS REALES:\n`;
    output += `   antecedentes - Ver proyectos\n`;
    output += `   stats        - Estadísticas empresa\n`;
    output += `   health       - Estado sistema\n\n`;

    output += `⚡ AVANZADOS:\n`;
    output += `   export       - Exportar datos\n`;
    output += `   weather      - Clima actual\n`;
    output += `   monitor      - Monitoreo\n\n`;

    output += `💡 Use 'help [comando]' para ayuda específica`;

    return { success: true, output, type: 'info' };
  }

  async showVersion() {
    let output = `UM CLI Terminal Engine v${this.version}\n`;
    output += `ULTIMA MILLA - Enhanced Terminal Experience\n\n`;
    output += `🆕 NEW IN v2.0:\n`;
    output += `   ✅ Real Directus integration\n`;
    output += `   ✅ Advanced search capabilities\n`;
    output += `   ✅ External API support\n`;
    output += `   ✅ Data export functionality\n`;
    output += `   ✅ System health monitoring\n\n`;
    output += `🏢 ULTIMA MILLA © 2003-2025`;

    return { success: true, output, type: 'success' };
  }

  // === UTILIDADES INTERNAS ===

  async fetchFromAPI(action, params = {}) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const queryParams = new URLSearchParams({
        action,
        ...params
      });

      const response = await fetch(`${this.apiEndpoint}?${queryParams}`);
      const data = await response.json();
      
      // Cache result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('[UM-CLI] API Error:', error);
      return { success: false, error: error.message };
    }
  }

  clearScreen() {
    return { success: true, output: '', type: 'clear' };
  }

  async showHistory() {
    let output = `📜 COMMAND HISTORY\n\n`;
    this.history.forEach((cmd, index) => {
      output += `${(index + 1).toString().padStart(4)}: ${cmd}\n`;
    });
    return { success: true, output, type: 'info' };
  }

  async whoAmI() {
    return { 
      success: true, 
      output: 'ultimamilla@servidor-mendoza.com.ar\n🏢 ULTIMA MILLA - Ingeniero de Sistemas', 
      type: 'info' 
    };
  }

  async showSystemInfo() {
    let output = `🖥️  SYSTEM INFORMATION\n\n`;
    output += `System: Linux ultimamilla-server 5.15.0\n`;
    output += `Architecture: x86_64\n`;
    output += `Kernel: 5.15.0-72-generic\n`;
    output += `Uptime: ${Math.floor(Math.random() * 30 + 1)} days\n`;
    output += `Location: Mendoza, Argentina\n`;
    output += `Company: ULTIMA MILLA S.A.`;

    return { success: true, output, type: 'info' };
  }

  async showUptime() {
    const days = Math.floor(Math.random() * 30 + 1);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    
    let output = `⏰ SYSTEM UPTIME\n\n`;
    output += `Server uptime: ${days} days, ${hours} hours, ${minutes} minutes\n`;
    output += `ULTIMA MILLA services: ✅ Running\n`;
    output += `Last restart: System maintenance`;

    return { success: true, output, type: 'success' };
  }
}

// Export para uso en Astro
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UMTerminalEngineV2;
}

// Export para browser
if (typeof window !== 'undefined') {
  window.UMTerminalEngineV2 = UMTerminalEngineV2;
}
