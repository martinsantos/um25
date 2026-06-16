import { serviciosReales } from '../data/servicios_completos.js';
import { antecedentesReales } from '../data/antecedentes_completos.js';
import umCliData from '../../um-cli-data.json';

/**
 * ULTIMA MILLA CLI Service
 * Servicio principal que maneja todos los comandos del CLI
 * y devuelve respuestas basadas en datos reales de la empresa
 */
class UMCliService {
  constructor() {
    this.data = umCliData;
    this.servicios = serviciosReales || [];
    this.antecedentes = antecedentesReales || [];
    this.currentPath = '/ultimamilla/home';
    this.history = [];
    this.session = {
      startTime: new Date(),
      commandCount: 0,
      user: 'visitante_um_cli'
    };
  }

  /**
   * Método principal para procesar comandos
   */
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
        commandCount: this.session.commandCount
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

  /**
   * Parser de comandos tipo Linux
   */
  parseCommand(input) {
    const tokens = input.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    return {
      name: tokens[0] || '',
      args: tokens.slice(1),
      flags: tokens.filter(t => t.startsWith('-')),
      raw: input
    };
  }

  /**
   * Ejecutor principal de comandos
   */
  async executeCommand(command) {
    switch (command.name.toLowerCase()) {
      // Comandos de navegación
      case 'ls':
        return this.ls(command.args);
      case 'cd':
        return this.cd(command.args);
      case 'pwd':
        return this.pwd();
      
      // Comandos de consulta
      case 'cat':
        return this.cat(command.args);
      case 'grep':
        return this.grep(command.args);
      case 'find':
        return this.find(command.args);
      case 'search':
        return this.search(command.args);
      
      // Comandos de sistema
      case 'whoami':
        return this.whoami(command.args);
      case 'uname':
        return this.uname(command.args);
      case 'ps':
        return this.ps(command.args);
      case 'top':
        return this.top(command.args);
      case 'stats':
        return this.stats(command.args);
      case 'df':
        return this.df(command.args);
      case 'free':
        return this.free(command.args);
      
      // Comandos de historia
      case 'history':
        return this.historyCommand(command.args);
      case 'tail':
        return this.tail(command.args);
      case 'head':
        return this.head(command.args);
      
      // Comandos especiales
      case 'help':
        return this.help(command.args);
      case 'clear':
        return this.clear();
      
      // Comando maestro
      case 'sudo':
        if (command.args[0] === 'ultimamilla.py') {
          return this.sudoUltimaMilla(command.args.slice(1));
        }
        break;
      
      // Easter eggs
      case 'fortune':
        return this.fortune();
      case 'cowsay':
        return this.cowsay(command.args);
      case 'matrix':
        return this.matrix();
      
      default:
        throw new Error(`Command '${command.name}' not found`);
    }
  }

  /**
   * Comando ls - Listar contenido
   */
  ls(args) {
    const path = this.currentPath;
    let content = [];

    if (args.includes('servicios') || path.includes('/servicios')) {
      content = this.data.empresa.areas_de_negocio.map(area => ({
        name: area.toLowerCase().replace(/\s+/g, '-'),
        type: 'directory',
        description: area
      }));
    } else if (args.includes('clientes') || path.includes('/clientes')) {
      content = Object.keys(this.data.clientes.sectores).map(sector => ({
        name: sector,
        type: 'directory',
        count: this.data.clientes.sectores[sector].length
      }));
    } else if (args.includes('proyectos') || path.includes('/proyectos')) {
      content = Object.keys(this.data.presupuestos.rangos).map(rango => ({
        name: rango,
        type: 'directory',
        range: this.data.presupuestos.rangos[rango]
      }));
    } else {
      // Directorio raíz
      content = [
        { name: 'servicios', type: 'directory', description: `${this.data.servicios.total} servicios` },
        { name: 'clientes', type: 'directory', description: `${this.data.clientes.total}+ clientes` },
        { name: 'proyectos', type: 'directory', description: 'Por presupuesto' },
        { name: 'antecedentes', type: 'directory', description: `${this.data.antecedentes.total}+ casos` },
        { name: 'tecnologias', type: 'directory', description: 'Stack tecnológico' },
        { name: 'estadisticas', type: 'file', description: 'KPIs y métricas' },
        { name: 'empresa.info', type: 'file', description: 'Información corporativa' }
      ];
    }

    return {
      output: this.formatLsOutput(content, args.includes('-l'))
    };
  }

  formatLsOutput(content, longFormat) {
    if (longFormat) {
      return content.map(item => 
        `${item.type === 'directory' ? 'd' : '-'}rwxr-xr-x 1 um um ${item.name.padEnd(20)} ${item.description || ''}`
      ).join('\n');
    } else {
      return content.map(item => 
        item.type === 'directory' ? `📁 ${item.name}` : `📄 ${item.name}`
      ).join('  ');
    }
  }

  /**
   * Comando cd - Cambiar directorio
   */
  cd(args) {
    if (!args.length || args[0] === 'home' || args[0] === '~') {
      this.currentPath = '/ultimamilla/home';
    } else {
      const target = args[0];
      this.currentPath = `/ultimamilla/${target}`;
    }
    
    return {
      output: `Navegando a: ${this.currentPath}`
    };
  }

  /**
   * Comando pwd - Mostrar directorio actual
   */
  pwd() {
    return {
      output: this.currentPath
    };
  }

  /**
   * Comando cat - Mostrar contenido
   */
  cat(args) {
    if (!args.length) {
      return { output: 'cat: falta operando\nPruebe "cat --help" para más información.' };
    }

    const file = args[0];
    
    switch (file) {
      case 'empresa.info':
        return {
          output: `
╔══════════════════════════════════════╗
║           ULTIMA MILLA               ║
║    Conectando el futuro desde 2003   ║
╚══════════════════════════════════════╝

📊 INFORMACIÓN EMPRESARIAL
• Fundada: ${this.data.empresa.fundacion}
• Ubicación: ${this.data.empresa.ubicacion}
• Experiencia: ${this.data.estadisticas.anos_experiencia} años
• Proyectos completados: ${this.data.estadisticas.proyectos_completados}+
• Clientes activos: ${this.data.estadisticas.clientes_activos}+

🔧 ÁREAS DE ESPECIALIZACIÓN
${this.data.empresa.areas_de_negocio.map(area => `• ${area}`).join('\n')}

💰 PRESUPUESTO TOTAL GESTIONADO
$${this.data.estadisticas.presupuesto_total_gestionado.toLocaleString()} ARS

🌍 COBERTURA
• Nacional: ${this.data.ubicaciones.principales.join(', ')}
• Internacional: ${this.data.ubicaciones.internacionales.join(', ')}
          `
        };
        
      case 'estadisticas':
        return {
          output: `
📈 ESTADÍSTICAS ULTIMA MILLA

🎯 MÉTRICAS CLAVE
• Proyectos completados: ${this.data.estadisticas.proyectos_completados}
• Años de experiencia: ${this.data.estadisticas.anos_experiencia}
• Clientes activos: ${this.data.estadisticas.clientes_activos}
• Áreas de cobertura: ${this.data.estadisticas.areas_cobertura}
• Colaboradores: ${this.data.estadisticas.colaboradores}

💸 ANÁLISIS FINANCIERO
• Presupuesto mínimo: $${this.data.antecedentes.rango_presupuestos.minimo.toLocaleString()}
• Presupuesto máximo: $${this.data.antecedentes.rango_presupuestos.maximo.toLocaleString()}
• Promedio por proyecto: $${this.data.antecedentes.rango_presupuestos.promedio.toLocaleString()}

🏆 PROYECTOS DESTACADOS
${this.data.presupuestos.proyectos_destacados.map(p => 
  `• ${p.cliente}: $${p.presupuesto.toLocaleString()} (${p.area})`
).join('\n')}
          `
        };
        
      default:
        return { output: `cat: ${file}: No existe el archivo o directorio` };
    }
  }

  /**
   * Comando grep - Búsqueda en contenido
   */
  grep(args) {
    if (!args.length) {
      return { output: 'grep: falta operando de búsqueda' };
    }

    const query = args[0].replace(/"/g, '');
    const results = [];

    // Buscar en servicios
    this.servicios.forEach(servicio => {
      if (this.matchesQuery(servicio, query)) {
        results.push({
          type: 'servicio',
          data: servicio
        });
      }
    });

    // Buscar en antecedentes
    this.antecedentes.slice(0, 50).forEach(ant => { // Limitar resultados
      if (this.matchesQuery(ant, query)) {
        results.push({
          type: 'antecedente',
          data: ant
        });
      }
    });

    if (!results.length) {
      return { output: `grep: sin coincidencias para '${query}'` };
    }

    return {
      output: `
🔍 RESULTADOS DE BÚSQUEDA: "${query}" (${results.length} coincidencias)

${results.slice(0, 10).map((result, i) => `
${i + 1}. ${result.data.Cliente || result.data.Titulo}
   📋 ${result.data.Descripcion?.substring(0, 100)}...
   💰 $${result.data.Presupuesto?.toLocaleString() || 'N/A'}
   📅 ${result.data.Fecha}
`).join('\n')}

${results.length > 10 ? `\n... y ${results.length - 10} resultados más. Use 'grep "${query}" --all' para ver todos.` : ''}
      `
    };
  }

  matchesQuery(item, query) {
    const searchableFields = [
      item.Titulo,
      item.Cliente,
      item.Descripcion,
      item.Area
    ].join(' ').toLowerCase();
    
    return searchableFields.includes(query.toLowerCase());
  }

  /**
   * Comando whoami
   */
  whoami(args) {
    if (args.includes('--empresa')) {
      return {
        output: `
👤 INFORMACIÓN DE ACCESO

Usuario: ${this.session.user}
Sesión iniciada: ${this.session.startTime.toLocaleString()}
Comandos ejecutados: ${this.session.commandCount}
Ruta actual: ${this.currentPath}

🏢 ULTIMA MILLA
"Conectando el futuro desde 2003"
Mendoza, Argentina
        `
      };
    }
    
    return { output: this.session.user };
  }

  /**
   * Comando uname
   */
  uname(args) {
    if (args.includes('-a')) {
      return {
        output: `ULTIMA MILLA Enterprise Linux 22.0.0 #2003-${new Date().getFullYear()} SMP ${new Date().toDateString()} x86_64 GNU/Linux`
      };
    }
    
    return { output: 'ULTIMA MILLA Enterprise Linux' };
  }

  /**
   * Comando stats - Estadísticas detalladas
   */
  stats(args) {
    if (args.includes('--clientes')) {
      return {
        output: `
📊 ESTADÍSTICAS DE CLIENTES

🏛️ SECTOR PÚBLICO (${this.data.clientes.sectores.publico.length} clientes)
${this.data.clientes.sectores.publico.slice(0, 5).map(c => `• ${c}`).join('\n')}

🏢 SECTOR PRIVADO (${this.data.clientes.sectores.privado.length} clientes)
${this.data.clientes.sectores.privado.slice(0, 5).map(c => `• ${c}`).join('\n')}

⚡ INFRAESTRUCTURA CRÍTICA (${this.data.clientes.sectores.infraestructura_critica.length} clientes)
${this.data.clientes.sectores.infraestructura_critica.map(c => `• ${c}`).join('\n')}
        `
      };
    }

    return {
      output: `
📈 ESTADÍSTICAS GENERALES ULTIMA MILLA

🎯 OVERVIEW
• Proyectos completados: ${this.data.estadisticas.proyectos_completados}
• Años de experiencia: ${this.data.estadisticas.anos_experiencia} (2003-2024)
• Clientes activos: ${this.data.estadisticas.clientes_activos}+
• Alcance gestionado: proyectos de redes, software, seguridad y soporte

🔧 DISTRIBUCIÓN POR ÁREAS
• Redes y Comunicaciones: infraestructura y conectividad
• Software a Medida: sistemas operativos y automatización
• Sistemas de Seguridad: CCTV, SDI y control
• Soporte IT: mantenimiento y continuidad

🌍 COBERTURA GEOGRÁFICA
• Argentina: 5 provincias principales
• Internacional: España, Estados Unidos
      `
    };
  }

  /**
   * Comando sudo ultimamilla.py - Comando maestro
   */
  sudoUltimaMilla(args) {
    if (args.includes('--demo')) {
      return {
        output: `
🚀 ULTIMA MILLA - DEMOSTRACIÓN COMPLETA

[████████████████████████████████] Cargando sistemas...

✅ Sistema de redes: OPERATIVO
✅ Centro de desarrollo: OPERATIVO
✅ Infraestructura de seguridad: OPERATIVO (SDI+CCTV)
✅ Soporte 24/7: OPERATIVO

🏆 PROYECTOS EMBLEMÁTICOS EJECUTÁNDOSE:
• Hospital Schestakow - Corrientes débiles
• Gobierno de Mendoza - Portal web completo
• AFIP Multi-sede - Sistema detección incendios
• Quilmes - Mantenimiento integral

📡 CONECTIVIDAD:
• Mendoza: cobertura operativa
• Buenos Aires: proyectos atendidos
• Córdoba: instalaciones documentadas
• San Juan: soporte regional

💡 TECNOLOGÍAS DESPLEGADAS:
• Fibra óptica: tendidos y certificación
• CCTV: instalación, integración y mantenimiento
• SDI: detección y documentación técnica
• Software: aplicaciones operativas e integraciones

🎯 STATUS: READY FOR NEW CHALLENGES
Contacto: info@ultimamilla.com
        `
      };
    }

    if (args.includes('--scan')) {
      return {
        output: `
🔍 ESCANEANDO INFRAESTRUCTURA ULTIMA MILLA...

[█████████████████████████████████]

📍 UBICACIONES DETECTADAS:
• Mendoza (HQ): 15 servicios activos
• Buenos Aires: 8 proyectos
• Córdoba: 5 instalaciones
• Internacional: 3 clientes

🔧 SERVICIOS DESPLEGADOS:
• Redes y comunicaciones: 92 proyectos
• Software a medida: 51 desarrollos
• Sistemas de seguridad: 41 instalaciones
• Soporte IT: 17 contratos activos

⚡ INFRAESTRUCTURA CRÍTICA:
• Aeropuertos: operativo y monitoreado
• Hospitales: operativo y documentado
• Gobierno: operativo por alcance
• Telecomunicaciones: operativo con soporte

✅ ESCANEO COMPLETADO
Todos los sistemas funcionando correctamente.
        `
      };
    }

    // Comando por defecto
    return {
      output: `
🔐 ACCESO ADMINISTRATIVO CONCEDIDO

╔══════════════════════════════════════╗
║        ULTIMA MILLA SYSTEMS          ║
║     Diagnóstico Completo v22.0       ║
╚══════════════════════════════════════╝

📊 ESTADO DEL SISTEMA:
✅ Base de datos: ${this.servicios.length} servicios cargados
✅ Historial: ${this.antecedentes.length}+ antecedentes
✅ Clientes activos: ${this.data.clientes.total}+ 
✅ Cobertura: Nacional e internacional

🚀 CAPACIDADES OPERATIVAS:
• Desarrollo de software: activo
• Infraestructura de redes: activo
• Sistemas de seguridad: activo
• Soporte técnico 24/7: activo

💡 COMANDOS DISPONIBLES:
• --demo     : Demostración completa
• --scan     : Escanear infraestructura  
• --analyze  : Análisis profundo
• --report   : Generar reporte completo

Ejecute 'help' para ver todos los comandos disponibles.
      `
    };
  }

  /**
   * Comando help
   */
  help(args) {
    return {
      output: `
📚 ULTIMA MILLA CLI - SISTEMA DE AYUDA

🔧 COMANDOS PRINCIPALES:
• ls [directorio]        Lista contenido 
• cd [directorio]        Cambiar directorio
• cat [archivo]          Mostrar contenido
• grep [término]         Buscar en datos
• stats [--opción]       Estadísticas
• whoami [--empresa]     Info de usuario
• sudo ultimamilla.py    Comando maestro

🎯 COMANDOS ESPECIALIZADOS:
• find [filtros]         Búsqueda avanzada
• top [--opción]         Rankings y tops
• history               Historial de comandos
• ps [--área]           Proyectos activos

🎭 UTILIDADES:
• fortune               Frase operativa
• matrix                Modo datos UM
• cowsay [mensaje]      Mensaje ASCII

💡 EJEMPLOS:
• grep "Quilmes"        → Busca proyectos de Quilmes
• stats --clientes      → Estadísticas de clientes  
• cat empresa.info      → Info de la empresa
• sudo ultimamilla.py --demo  → Demo completa

Para ayuda específica: help [comando]
      `
    };
  }

  /**
   * Easter Eggs
   */
  fortune() {
    const fortunes = [
      "La innovación distingue entre un líder y un seguidor. - Steve Jobs",
      "La tecnología es mejor cuando acerca a la gente. - Matt Mullenweg", 
      "En Ultima Milla, cada proyecto es una oportunidad de conectar el futuro.",
      "22 años conectando sueños con realidad tecnológica.",
      "No hay problemas de redes que no podamos resolver. - Equipo UM",
      "El código limpio siempre parece que fue escrito por alguien que se preocupa. - Robert C. Martin"
    ];
    
    return {
      output: `
💡 ${fortunes[Math.floor(Math.random() * fortunes.length)]}
      `
    };
  }

  cowsay(args) {
    const message = args.join(' ') || 'Conectando el futuro';
    return {
      output: `
 _${message.split('').map(() => '_').join('')}_
< ${message} >
 -${message.split('').map(() => '-').join('')}-
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
      `
    };
  }

  matrix() {
    return {
      output: `
Activando modo datos...

U L T I M A   M I L L A   S Y S T E M S
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
R E D E S   •   S O F T W A R E   •   S E G U R I D A D
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
Q U I L M E S   A F I P   G O B I E R N O
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
2 0 0 3   →   2 0 2 4   →   ∞
█ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █

¿Ver historial tecnico? [S/n] _
      `
    };
  }

  clear() {
    return {
      output: '',
      action: 'clear'
    };
  }

  getSuggestion(command) {
    const suggestions = {
      'l': 'ls',
      'list': 'ls',
      'dir': 'ls',
      'search': 'grep',
      'buscar': 'grep',
      'info': 'cat empresa.info',
      'ayuda': 'help'
    };
    
    return suggestions[command] || null;
  }
}

// Singleton para mantener estado
let umCliInstance = null;

export function getUMCliService() {
  if (!umCliInstance) {
    umCliInstance = new UMCliService();
  }
  return umCliInstance;
}

export default UMCliService;
