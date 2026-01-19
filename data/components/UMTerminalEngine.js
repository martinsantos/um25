// UMTerminalEngine.js - Motor completo de comandos para UM CLI
import { serviciosReales } from '../data/servicios_completos.js';
import { antecedentesReales } from '../data/antecedentes_completos.js';

class UMTerminalEngine {
  constructor() {
    this.servicios = serviciosReales || [];
    this.antecedentes = antecedentesReales || [];
    this.currentPath = '/ultimamilla/home';
    this.history = [];
    this.session = {
      startTime: new Date(),
      commandCount: 0,
      user: 'visitante_um_cli'
    };
    
    // Datos derivados para navegación rápida
    this.clientes = [...new Set(this.servicios.map(s => s.Cliente))].sort();
    this.areas = [...new Set(this.servicios.map(s => s.Area))].sort();
    this.unidades = [...new Set(this.servicios.map(s => s.Unidad_de_negocio))].sort();
  }

  async processCommand(input) {
    const command = this.parseCommand(input);
    this.session.commandCount++;
    this.history.push({ input, timestamp: new Date() });

    try {
      const result = await this.executeCommand(command);
      return {
        success: true,
        output: result.output,
        path: this.currentPath,
        timestamp: new Date(),
        commandCount: this.session.commandCount,
        action: result.action || null
      };
    } catch (error) {
      return {
        success: false,
        output: `umcli: ${command.name}: command not found`,
        error: error.message,
        path: this.currentPath,
        suggestion: this.getSuggestion(command.name)
      };
    }
  }

  parseCommand(input) {
    const tokens = input.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    // Guardamos el comando original pero usamos el lowercase para buscar
    const originalName = tokens[0] || '';
    return {
      name: originalName.toLowerCase(), // Convertir a minúsculas para case insensitivity
      originalName, // Mantener el original para visualización
      args: tokens.slice(1),
      flags: tokens.filter(t => t.startsWith('-')),
      raw: input
    };
  }

  async executeCommand(command) {
    switch (command.name.toLowerCase()) {
      case 'ls': return this.ls(command.args);
      case 'cd': return this.cd(command.args);
      case 'pwd': return this.pwd();
      case 'cat': return this.cat(command.args);
      case 'grep': return this.grep(command.args);
      case 'find': return this.find(command.args);
      case 'whoami': return this.whoami(command.args);
      case 'uname': return this.uname(command.args);
      case 'ps': return this.ps(command.args);
      case 'top': return this.top(command.args);
      case 'stats': return this.stats(command.args);
      case 'history': return this.historyCommand(command.args);
      case 'help': return this.help(command.args);
      case 'sudo': 
        if (command.args[0] === 'ultimamilla.py') {
          return this.sudoUltimaMilla(command.args.slice(1));
        }
        break;
      case 'fortune': return this.fortune();
      case 'cowsay': return this.cowsay(command.args);
      case 'matrix': return this.matrix();
      case 'clear': return this.clear();
      default:
        throw new Error(`Command '${command.name}' not found`);
    }
  }

  ls(args) {
    const hasLongFormat = args.includes('-l');
    const hasAll = args.includes('-a');
    
    if (args.includes('servicios') || this.currentPath.includes('/servicios')) {
      return this.listServicios(hasLongFormat);
    } else if (args.includes('clientes') || this.currentPath.includes('/clientes')) {
      return this.listClientes(hasLongFormat);
    } else if (args.includes('proyectos') || this.currentPath.includes('/proyectos')) {
      return this.listProyectos(hasLongFormat);
    } else {
      return this.listRoot(hasLongFormat, hasAll);
    }
  }

  listRoot(longFormat, showAll) {
    const items = [
      { name: 'servicios', type: 'd', description: `${this.servicios.length} servicios disponibles` },
      { name: 'clientes', type: 'd', description: `${this.clientes.length} clientes únicos` },
      { name: 'proyectos', type: 'd', description: 'Organizados por presupuesto' },
      { name: 'antecedentes', type: 'd', description: `${this.antecedentes.length}+ casos históricos` },
      { name: 'areas', type: 'd', description: `${this.areas.length} especialidades` },
      { name: 'empresa.info', type: 'f', description: 'Información corporativa' },
      { name: 'estadisticas.txt', type: 'f', description: 'Métricas y KPIs' }
    ];

    if (showAll) {
      items.unshift(
        { name: '.', type: 'd', description: 'Directorio actual' },
        { name: '..', type: 'd', description: 'Directorio padre' }
      );
    }

    if (longFormat) {
      const output = items.map(item => {
        const permissions = item.type === 'd' ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = item.type === 'd' ? '4096' : '1024';
        const date = new Date().toLocaleDateString();
        return `${permissions} 1 um um ${size.padStart(8)} ${date} ${item.name}`;
      }).join('\n');
      
      return { output: `total ${items.length}\n${output}` };
    } else {
      return { 
        output: items.map(item => 
          `${item.type === 'd' ? '📁' : '📄'} ${item.name}`
        ).join('  ')
      };
    }
  }

  listServicios(longFormat) {
    const areaStats = this.areas.map(area => {
      const count = this.servicios.filter(s => s.Area === area).length;
      const totalBudget = this.servicios
        .filter(s => s.Area === area)
        .reduce((sum, s) => sum + (s.Presupuesto || 0), 0);
      
      return {
        name: area.toLowerCase().replace(/\s+/g, '-'),
        type: 'd',
        count,
        budget: totalBudget
      };
    });

    if (longFormat) {
      return {
        output: `📊 SERVICIOS POR ÁREA\n\n${areaStats.map(area => 
          `📁 ${area.name.padEnd(35)} ${area.count.toString().padStart(3)} servicios  $${area.budget.toLocaleString()}`
        ).join('\n')}`
      };
    } else {
      return {
        output: areaStats.map(area => `📁 ${area.name} (${area.count})`).join('  ')
      };
    }
  }

  listClientes(longFormat) {
    const sectores = {
      'publico': this.servicios.filter(s => 
        ['Gobierno', 'Municipalidad', 'Universidad', 'Hospital', 'Ministerio', 'AFIP'].some(key => 
          s.Cliente.toLowerCase().includes(key.toLowerCase())
        )
      ),
      'privado': this.servicios.filter(s => 
        ['SA', 'SRL', 'S.A', 'Bodega', 'Hotel', 'Quilmes'].some(key => 
          s.Cliente.toLowerCase().includes(key.toLowerCase())
        )
      ),
      'internacional': this.servicios.filter(s => 
        ['EEUU', 'España', 'CNN', '800-Bear'].some(key => 
          s.Cliente.toLowerCase().includes(key.toLowerCase())
        )
      )
    };

    if (longFormat) {
      return {
        output: `👥 CLIENTES POR SECTOR\n\n${Object.entries(sectores).map(([sector, servicios]) => 
          `📁 ${sector.padEnd(15)} ${servicios.length.toString().padStart(3)} proyectos`
        ).join('\n')}`
      };
    } else {
      return {
        output: Object.keys(sectores).map(sector => `📁 ${sector}`).join('  ')
      };
    }
  }

  cd(args) {
    if (!args.length || args[0] === 'home' || args[0] === '~') {
      this.currentPath = '/ultimamilla/home';
    } else {
      const target = args[0];
      this.currentPath = `/ultimamilla/${target}`;
    }
    
    return { output: '' }; // Sin output para cd
  }

  pwd() {
    return { output: this.currentPath };
  }

  cat(args) {
    if (!args.length) {
      return { output: 'cat: falta operando\nPruebe "cat --help" para más información.' };
    }

    const file = args[0];
    
    switch (file) {
      case 'empresa.info':
        return { output: this.getEmpresaInfo() };
      case 'estadisticas.txt':
        return { output: this.getEstadisticas() };
      default:
        return { output: `cat: ${file}: No existe el archivo o directorio` };
    }
  }

  getEmpresaInfo() {
    const proyectoMasGrande = this.servicios.reduce((max, s) => 
      (s.Presupuesto > max.Presupuesto) ? s : max, this.servicios[0]
    );

    return `
╔══════════════════════════════════════╗
║           ULTIMA MILLA               ║
║    Conectando el futuro desde 2003   ║
╚══════════════════════════════════════╝

📊 INFORMACIÓN EMPRESARIAL
• Fundada: 2003
• Ubicación: Mendoza, Argentina
• Experiencia: 22 años
• Proyectos completados: ${this.servicios.length}+
• Clientes únicos: ${this.clientes.length}+

🔧 ÁREAS DE ESPECIALIZACIÓN (${this.areas.length})
${this.areas.map(area => `• ${area}`).join('\n')}

💰 PROYECTO MÁS GRANDE
• Cliente: ${proyectoMasGrande.Cliente}
• Presupuesto: $${proyectoMasGrande.Presupuesto.toLocaleString()}
• Área: ${proyectoMasGrande.Area}

🌍 COBERTURA
• Argentina: Mendoza, Buenos Aires, Córdoba, San Juan, San Luis
• Internacional: España, Estados Unidos

📞 CONTACTO
• Web: www.ultimamilla.com
• Email: info@ultimamilla.com
    `;
  }

  getEstadisticas() {
    const totalPresupuesto = this.servicios.reduce((sum, s) => sum + (s.Presupuesto || 0), 0);
    const promedioPresupuesto = totalPresupuesto / this.servicios.length;
    
    const clienteStats = this.clientes.map(cliente => {
      const proyectos = this.servicios.filter(s => s.Cliente === cliente);
      const total = proyectos.reduce((sum, p) => sum + (p.Presupuesto || 0), 0);
      return { cliente, proyectos: proyectos.length, total };
    }).sort((a, b) => b.total - a.total);

    return `
📈 ESTADÍSTICAS DETALLADAS ULTIMA MILLA

🎯 MÉTRICAS GENERALES
• Total proyectos: ${this.servicios.length}
• Clientes únicos: ${this.clientes.length}
• Áreas de negocio: ${this.areas.length}
• Presupuesto total: $${totalPresupuesto.toLocaleString()}
• Promedio por proyecto: $${Math.round(promedioPresupuesto).toLocaleString()}

🏆 TOP 5 CLIENTES (por volumen)
${clienteStats.slice(0, 5).map((c, i) => 
  `${i + 1}. ${c.cliente.substring(0, 40)}... - ${c.proyectos} proyectos ($${c.total.toLocaleString()})`
).join('\n')}

📊 DISTRIBUCIÓN POR ÁREA
${this.areas.map(area => {
  const count = this.servicios.filter(s => s.Area === area).length;
  const percentage = ((count / this.servicios.length) * 100).toFixed(1);
  return `• ${area}: ${count} proyectos (${percentage}%)`;
}).join('\n')}

⏰ LÍNEA DE TIEMPO
• Primer proyecto: ${this.getFirstProject().Fecha}
• Último proyecto: ${this.getLastProject().Fecha}
• Período activo: ${this.getYearsActive()} años
    `;
  }

  grep(args) {
    if (!args.length) {
      return { output: 'grep: falta operando de búsqueda' };
    }

    const query = args[0].replace(/"/g, '');
    const isClientSearch = args.includes('--cliente');
    const isAreaSearch = args.includes('--area');
    const showAll = args.includes('--all');
    
    const results = [];

    // Búsqueda en servicios
    this.servicios.forEach(servicio => {
      if (this.matchesQuery(servicio, query, isClientSearch, isAreaSearch)) {
        results.push({
          type: 'servicio',
          data: servicio,
          score: this.calculateRelevance(servicio, query)
        });
      }
    });

    // Ordenar por relevancia
    results.sort((a, b) => b.score - a.score);

    if (!results.length) {
      return { output: `grep: sin coincidencias para '${query}'` };
    }

    const displayCount = showAll ? results.length : Math.min(10, results.length);
    const displayResults = results.slice(0, displayCount);

    return {
      output: `
🔍 RESULTADOS DE BÚSQUEDA: "${query}" (${results.length} coincidencias)

${displayResults.map((result, i) => `
${i + 1}. 🏢 ${result.data.Cliente}
   📋 ${result.data.Titulo}
   📝 ${result.data.Descripcion.substring(0, 120)}...
   💰 $${result.data.Presupuesto?.toLocaleString() || 'N/A'}
   🔧 ${result.data.Area}
   📅 ${result.data.Fecha}
   🔗 Ref: ${result.data.Antecedente}
`).join('\n')}
${results.length > displayCount ? `\n... y ${results.length - displayCount} resultados más. Use 'grep "${query}" --all' para ver todos.` : ''}

💡 Tip: Use 'grep "${query}" --cliente' o 'grep "${query}" --area' para filtrar
      `
    };
  }

  find(args) {
    if (!args.length) {
      return { output: 'find: falta criterio de búsqueda' };
    }

    const criteria = this.parseFindCriteria(args);
    let results = this.servicios;

    // Aplicar filtros
    if (criteria.area) {
      results = results.filter(s => 
        s.Area.toLowerCase().includes(criteria.area.toLowerCase())
      );
    }

    if (criteria.cliente) {
      results = results.filter(s => 
        s.Cliente.toLowerCase().includes(criteria.cliente.toLowerCase())
      );
    }

    if (criteria.year) {
      results = results.filter(s => s.Fecha.includes(criteria.year));
    }

    if (criteria.minBudget) {
      results = results.filter(s => s.Presupuesto >= criteria.minBudget);
    }

    if (criteria.maxBudget) {
      results = results.filter(s => s.Presupuesto <= criteria.maxBudget);
    }

    return {
      output: `
🔎 BÚSQUEDA AVANZADA - ${results.length} resultados encontrados

${results.slice(0, 15).map((item, i) => 
  `${i + 1}. ${item.Cliente} - ${item.Area} ($${item.Presupuesto.toLocaleString()})`
).join('\n')}

${results.length > 15 ? `\n... y ${results.length - 15} resultados más` : ''}
      `
    };
  }

  parseFindCriteria(args) {
    const criteria = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--area':
          criteria.area = args[i + 1];
          i++;
          break;
        case '--cliente':
          criteria.cliente = args[i + 1];
          i++;
          break;
        case '--year':
          criteria.year = args[i + 1];
          i++;
          break;
        case '--budget-min':
          criteria.minBudget = parseInt(args[i + 1]);
          i++;
          break;
        case '--budget-max':
          criteria.maxBudget = parseInt(args[i + 1]);
          i++;
          break;
      }
    }
    
    return criteria;
  }

  stats(args) {
    if (args.includes('--clientes')) {
      return this.getClientStats();
    } else if (args.includes('--areas')) {
      return this.getAreaStats();
    } else if (args.includes('--timeline')) {
      return this.getTimelineStats();
    } else {
      return this.getGeneralStats();
    }
  }

  getClientStats() {
    const clienteProyectos = this.clientes.map(cliente => {
      const proyectos = this.servicios.filter(s => s.Cliente === cliente);
      const totalPresupuesto = proyectos.reduce((sum, p) => sum + (p.Presupuesto || 0), 0);
      return {
        cliente,
        cantidad: proyectos.length,
        presupuesto: totalPresupuesto,
        areas: [...new Set(proyectos.map(p => p.Area))]
      };
    }).sort((a, b) => b.presupuesto - a.presupuesto);

    return {
      output: `
📊 ESTADÍSTICAS DE CLIENTES

🏆 TOP 10 CLIENTES POR VOLUMEN
${clienteProyectos.slice(0, 10).map((c, i) => 
  `${i + 1}. ${c.cliente.substring(0, 45)}...\n   📈 ${c.cantidad} proyectos | 💰 $${c.presupuesto.toLocaleString()} | 🔧 ${c.areas.length} áreas`
).join('\n\n')}

📋 RESUMEN
• Total clientes únicos: ${this.clientes.length}
• Promedio proyectos/cliente: ${(this.servicios.length / this.clientes.length).toFixed(1)}
• Cliente más activo: ${clienteProyectos[0].cliente} (${clienteProyectos[0].cantidad} proyectos)
      `
    };
  }

  getAreaStats() {
    const areaStats = this.areas.map(area => {
      const proyectos = this.servicios.filter(s => s.Area === area);
      const presupuesto = proyectos.reduce((sum, p) => sum + (p.Presupuesto || 0), 0);
      const clientes = [...new Set(proyectos.map(p => p.Cliente))];
      
      return {
        area,
        proyectos: proyectos.length,
        presupuesto,
        clientes: clientes.length,
        promedio: presupuesto / proyectos.length || 0
      };
    }).sort((a, b) => b.presupuesto - a.presupuesto);

    return {
      output: `
🔧 ESTADÍSTICAS POR ÁREA DE NEGOCIO

${areaStats.map((area, i) => 
  `${i + 1}. 📊 ${area.area}
   • Proyectos: ${area.proyectos}
   • Clientes: ${area.clientes}
   • Presupuesto total: $${area.presupuesto.toLocaleString()}
   • Promedio/proyecto: $${Math.round(area.promedio).toLocaleString()}
   • % del total: ${((area.proyectos / this.servicios.length) * 100).toFixed(1)}%`
).join('\n\n')}
      `
    };
  }

  top(args) {
    if (args.includes('--proyectos')) {
      const topProyectos = [...this.servicios]
        .sort((a, b) => b.Presupuesto - a.Presupuesto)
        .slice(0, 10);
        
      return {
        output: `
🏆 TOP 10 PROYECTOS POR PRESUPUESTO

${topProyectos.map((p, i) => 
  `${i + 1}. 💰 $${p.Presupuesto.toLocaleString()}
   🏢 ${p.Cliente}
   📋 ${p.Titulo}
   🔧 ${p.Area}
   📅 ${p.Fecha}`
).join('\n\n')}
        `
      };
    } else {
      // Top clientes por defecto
      const clienteStats = this.clientes.map(cliente => {
        const proyectos = this.servicios.filter(s => s.Cliente === cliente);
        const total = proyectos.reduce((sum, p) => sum + (p.Presupuesto || 0), 0);
        return { cliente, proyectos: proyectos.length, total };
      }).sort((a, b) => b.total - a.total).slice(0, 10);

      return {
        output: `
🏆 TOP 10 CLIENTES POR VOLUMEN

${clienteStats.map((c, i) => 
  `${i + 1}. 🏢 ${c.cliente}
   📈 ${c.proyectos} proyectos
   💰 $${c.total.toLocaleString()}`
).join('\n\n')}
        `
      };
    }
  }

  sudoUltimaMilla(args) {
    if (args.includes('--demo')) {
      return this.getDemoOutput();
    } else if (args.includes('--scan')) {
      return this.getScanOutput();
    } else if (args.includes('--analyze')) {
      return this.getAnalysisOutput();
    } else {
      return this.getDefaultSudoOutput();
    }
  }

  getDemoOutput() {
    return {
      output: `
🚀 ULTIMA MILLA - DEMOSTRACIÓN COMPLETA

[████████████████████████████████] 100% Cargando sistemas...

✅ Base de datos: ${this.servicios.length} servicios cargados
✅ Clientes activos: ${this.clientes.length}+ únicos
✅ Áreas especializadas: ${this.areas.length}
✅ Años de experiencia: 22 (2003-2024)

🏆 PROYECTOS EMBLEMÁTICOS DETECTADOS:
${this.servicios
  .sort((a, b) => b.Presupuesto - a.Presupuesto)
  .slice(0, 4)
  .map(p => `• ${p.Cliente} - $${p.Presupuesto.toLocaleString()} (${p.Area})`)
  .join('\n')}

📡 COBERTURA OPERATIVA:
• Mendoza ████████████ 100% (HQ)
• Buenos Aires ██████████ 90%
• Córdoba ████████ 80%
• Internacional ██████ 60%

💡 TECNOLOGÍAS DESPLEGADAS:
• Proyectos de redes: ${this.servicios.filter(s => s.Area.includes('Redes')).length}
• Desarrollos de software: ${this.servicios.filter(s => s.Area.includes('Software')).length}
• Sistemas de seguridad: ${this.servicios.filter(s => s.Area.includes('CCTV') || s.Area.includes('SDI')).length}

🎯 STATUS: READY FOR NEW CHALLENGES
📞 Contacto: info@ultimamilla.com
🌐 Web: www.ultimamilla.com

Prueba otros comandos: 'grep [cliente]', 'stats --areas', 'top --proyectos'
      `
    };
  }

  help() {
    return {
      output: `
📚 ULTIMA MILLA CLI - GUÍA COMPLETA v22.0

🔧 NAVEGACIÓN:
• ls [dir]              Lista contenido (servicios, clientes, proyectos)
• cd [dir]              Cambiar directorio  
• pwd                   Mostrar ruta actual

📋 CONSULTA DE DATOS:
• cat [archivo]         Mostrar información (empresa.info, estadisticas.txt)
• grep [término]        Buscar en ${this.servicios.length}+ servicios
• find [filtros]        Búsqueda avanzada con criterios
• stats [--opción]      Estadísticas detalladas

🖥️ SISTEMA:
• whoami [--empresa]    Información de usuario/empresa
• uname [-a]           Info del sistema UM
• ps [--area]          Proyectos activos por área
• top [--proyectos]    Rankings y estadísticas
• history              Historial de comandos

🎯 COMANDO MAESTRO:
• sudo ultimamilla.py [--opción]
  --demo               Demostración completa
  --scan               Escanear infraestructura
  --analyze            Análisis profundo de capacidades

🎭 EASTER EGGS:
• fortune              Frase motivacional tech
• matrix               Efecto Matrix con datos UM
• cowsay [msg]         Arte ASCII personalizado

💡 EJEMPLOS PRÁCTICOS:
• grep "Quilmes"       → Busca proyectos de Quilmes
• find --area "Software" --year "2023"  → Software del 2023
• stats --clientes     → Estadísticas de clientes
• top --proyectos      → Proyectos más grandes
• cat empresa.info     → Información corporativa

📊 DATOS DISPONIBLES:
• ${this.servicios.length}+ servicios reales
• ${this.clientes.length}+ clientes únicos  
• ${this.areas.length} áreas especializadas
• 22 años de historia (2003-2024)

🆘 ¿Necesitas ayuda? Escribe: help [comando]
      `
    };
  }

  // Métodos auxiliares
  matchesQuery(item, query, isClientSearch, isAreaSearch) {
    if (isClientSearch) {
      return item.Cliente.toLowerCase().includes(query.toLowerCase());
    }
    
    if (isAreaSearch) {
      return item.Area.toLowerCase().includes(query.toLowerCase());
    }
    
    const searchableText = [
      item.Titulo,
      item.Cliente,
      item.Descripcion,
      item.Area
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query.toLowerCase());
  }

  calculateRelevance(item, query) {
    let score = 0;
    const q = query.toLowerCase();
    
    if (item.Cliente.toLowerCase().includes(q)) score += 10;
    if (item.Titulo.toLowerCase().includes(q)) score += 8;
    if (item.Area.toLowerCase().includes(q)) score += 6;
    if (item.Descripcion.toLowerCase().includes(q)) score += 3;
    
    // Bonus por presupuesto alto
    if (item.Presupuesto > 1000000) score += 2;
    
    return score;
  }

  getFirstProject() {
    return this.servicios.reduce((earliest, s) => 
      new Date(s.Fecha) < new Date(earliest.Fecha) ? s : earliest
    );
  }

  getLastProject() {
    return this.servicios.reduce((latest, s) => 
      new Date(s.Fecha) > new Date(latest.Fecha) ? s : latest
    );
  }

  getYearsActive() {
    const first = new Date(this.getFirstProject().Fecha);
    const last = new Date(this.getLastProject().Fecha);
    return last.getFullYear() - first.getFullYear();
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

  fortune() {
    const fortunes = [
      "La innovación distingue entre un líder y un seguidor. - Steve Jobs",
      "La tecnología es mejor cuando acerca a la gente. - Matt Mullenweg",
      "En Ultima Milla, cada proyecto es una oportunidad de conectar el futuro.",
      "22 años conectando sueños con realidad tecnológica.",
      "No hay problemas de redes que no podamos resolver. - Equipo UM",
      "El código limpio siempre parece que fue escrito por alguien que se preocupa. - Robert C. Martin",
      "La excelencia tecnológica se construye proyecto a proyecto. - Ultima Milla",
      "Desde Mendoza para el mundo: conectamos el futuro digitalmente."
    ];
    
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    return {
      output: `\n💡 ${fortune}\n`
    };
  }

  matrix() {
    return {
      output: `
🟢 Iniciando Matrix Protocol...

U L T I M A   M I L L A   N E T W O R K
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
R E D E S   •   S O F T W A R E   •   S E G U R I D A D  
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
Q U I L M E S   ↔   A F I P   ↔   G O B I E R N O
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
${this.servicios.length}   P R O Y E C T O S   A C T I V O S
█▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░ █▓▒░
2 0 0 3   ─ ─ ─ →   2 0 2 4   ─ ─ ─ →   ∞

🔴 The Matrix has you... 🔴
¿Tomar la píldora roja o azul? [R/a] _
      `
    };
  }

  cowsay(args) {
    const message = args.join(' ') || 'Conectando el futuro';
    const border = '_'.repeat(message.length + 2);
    const spaces = ' '.repeat(message.length + 2);
    
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
      `
    };
  }

  clear() {
    return {
      output: '',
      action: 'clear'
    };
  }

  // Otros métodos de comando que faltan...
  whoami(args) {
    if (args.includes('--empresa')) {
      return {
        output: `
👤 SESIÓN ACTUAL

Usuario: ${this.session.user}
Sesión iniciada: ${this.session.startTime.toLocaleString()}
Comandos ejecutados: ${this.session.commandCount}
Ruta actual: ${this.currentPath}

🏢 ULTIMA MILLA
"Conectando el futuro desde 2003"
📍 Mendoza, Argentina
📊 ${this.servicios.length}+ proyectos completados
🌐 Cobertura nacional e internacional
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

  ps(args) {
    const activeProjects = this.servicios
      .filter(s => new Date(s.Fecha).getFullYear() >= 2020)
      .slice(0, 15);

    return {
      output: `
📋 PROYECTOS ACTIVOS (${activeProjects.length} procesos)

PID    USER     %CPU  %MEM  COMMAND
${activeProjects.map((p, i) => {
  const pid = (1000 + i).toString().padStart(6);
  const cpu = Math.floor(Math.random() * 100).toString().padStart(5);
  const mem = Math.floor(Math.random() * 50).toString().padStart(5);
  const command = `${p.Area.toLowerCase().replace(/\s/g, '_')}_${p.Cliente.substring(0, 15).toLowerCase().replace(/\s/g, '_')}`;
  return `${pid}  um       ${cpu}  ${mem}  ${command}`;
}).join('\n')}

Total: ${activeProjects.length} procesos activos
      `
    };
  }

  historyCommand(args) {
    const count = args[0] ? parseInt(args[0]) : 10;
    const recentHistory = this.history.slice(-count);
    
    return {
      output: `
📜 HISTORIAL DE COMANDOS (últimos ${count})

${recentHistory.map((h, i) => 
  `${(this.history.length - count + i + 1).toString().padStart(4)} ${h.input}`
).join('\n')}

Total comandos ejecutados: ${this.session.commandCount}
    `
    };
  }

  // Métodos auxiliares para estadísticas
  getGeneralStats() {
    const totalPresupuesto = this.servicios.reduce((sum, s) => sum + (s.Presupuesto || 0), 0);
    
    return {
      output: `
📈 ESTADÍSTICAS GENERALES ULTIMA MILLA

🎯 OVERVIEW EJECUTIVO
• Proyectos completados: ${this.servicios.length}
• Clientes únicos: ${this.clientes.length}
• Áreas especializadas: ${this.areas.length}  
• Años de experiencia: 22 (2003-2024)
• Presupuesto total gestionado: $${totalPresupuesto.toLocaleString()} ARS

🔧 DISTRIBUCIÓN POR ÁREA
${this.areas.map(area => {
  const count = this.servicios.filter(s => s.Area === area).length;
  const percentage = ((count / this.servicios.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(percentage / 5));
  return `• ${area.padEnd(35)} ${bar} ${percentage}% (${count})`;
}).join('\n')}

🌍 COBERTURA GEOGRÁFICA
• Argentina: 5 provincias principales  
• Internacional: España, Estados Unidos
• Proyectos rurales y urbanos

📊 Use 'stats --clientes' o 'stats --areas' para más detalles
      `
    };
  }
}

// Exportar para uso en otros componentes
export default UMTerminalEngine;
