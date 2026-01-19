/**
 * Enhanced Data Navigation Engine for UM CLI
 * Provides advanced data exploration, filtering, and navigation capabilities
 * Version: 2.0.0
 */

import { antecedentesReales } from '../data/antecedentes_completos.js';
import { serviciosReales } from '../data/servicios_completos.js.backup';

class DataNavigationEngine {
    constructor() {
        this.currentPath = '/';
        this.currentContext = 'root';
        this.pageSize = 10;
        this.currentPage = 0;
        this.filters = {};
        this.searchQuery = '';
        
        // Virtual filesystem structure
        this.filesystem = {
            '/': ['servicios', 'antecedentes', 'clientes', 'areas', 'estadisticas'],
            '/servicios': ['desarrollo-web', 'redes-comunicaciones', 'software-medida', 'telecomunicaciones'],
            '/antecedentes': ['por-ano', 'por-cliente', 'por-area', 'por-presupuesto', 'destacados'],
            '/clientes': ['gobierno', 'empresas', 'instituciones', 'hospitales', 'municipalidades'],
            '/areas': ['software-servicios', 'redes-comunicaciones', 'telecomunicaciones'],
            '/estadisticas': ['resumen', 'por-ano', 'por-area', 'por-cliente', 'presupuestos']
        };
        
        // Data caching
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        this.init();
    }

    init() {
        this.loadData();
        this.preprocessData();
    }

    async loadData() {
        try {
            // Load data from various sources
            this.antecedentes = antecedentesReales || [];
            this.servicios = serviciosReales || [];
            
            console.log(`✓ Loaded ${this.antecedentes.length} antecedentes and ${this.servicios.length} servicios`);
        } catch (error) {
            console.error('Error loading data:', error);
            this.antecedentes = [];
            this.servicios = [];
        }
    }

    preprocessData() {
        // Create lookup tables for faster filtering
        this.clientesMap = new Map();
        this.areasMap = new Map();
        this.yearsMap = new Map();
        
        // Process antecedentes
        this.antecedentes.forEach(item => {
            const year = new Date(item.Fecha).getFullYear();
            const cliente = item.Cliente?.toLowerCase() || 'desconocido';
            const area = item.Area?.toLowerCase() || 'otros';
            
            // Clients mapping
            if (!this.clientesMap.has(cliente)) {
                this.clientesMap.set(cliente, []);
            }
            this.clientesMap.get(cliente).push(item);
            
            // Areas mapping
            if (!this.areasMap.has(area)) {
                this.areasMap.set(area, []);
            }
            this.areasMap.get(area).push(item);
            
            // Years mapping
            if (!this.yearsMap.has(year)) {
                this.yearsMap.set(year, []);
            }
            this.yearsMap.get(year).push(item);
        });
        
        // Process servicios
        this.servicios.forEach(item => {
            const year = new Date(item.Fecha).getFullYear();
            const cliente = item.Cliente?.toLowerCase() || 'desconocido';
            const area = item.Area?.toLowerCase() || 'otros';
            
            if (!this.clientesMap.has(cliente)) {
                this.clientesMap.set(cliente, []);
            }
            this.clientesMap.get(cliente).push(item);
            
            if (!this.areasMap.has(area)) {
                this.areasMap.set(area, []);
            }
            this.areasMap.get(area).push(item);
            
            if (!this.yearsMap.has(year)) {
                this.yearsMap.set(year, []);
            }
            this.yearsMap.get(year).push(item);
        });
        
        console.log(`✓ Preprocessed data: ${this.clientesMap.size} clientes, ${this.areasMap.size} areas, ${this.yearsMap.size} years`);
    }

    // EXPLORE command - hierarchical navigation
    async explore(path = null, options = {}) {
        const targetPath = path || this.currentPath;
        const fullPath = this.resolvePath(targetPath);
        
        if (!this.filesystem[fullPath]) {
            return this.formatError(`Ruta no encontrada: ${fullPath}`);
        }
        
        this.currentPath = fullPath;
        const contents = this.filesystem[fullPath];
        
        const output = `<div class="command-success">
📁 EXPLORANDO: ${fullPath}
═══════════════════════════════════════════════════════════════

📂 CONTENIDO DISPONIBLE:
${contents.map((item, index) => {
    const icon = this.getPathIcon(item);
    return `   ${String(index + 1).padStart(2, ' ')}. ${icon} ${item}`;
}).join('\n')}

💡 COMANDOS DISPONIBLES:
   • explore [nombre]     - Navegar a subdirectorio
   • navigate [ruta]      - Cambiar a ruta específica
   • filter [criterio]    - Filtrar contenido
   • details [elemento]   - Ver detalles específicos
   • back                 - Volver al directorio anterior
   • ls                   - Listar contenido actual

═══════════════════════════════════════════════════════════════
</div>`;
        
        return output;
    }

    // FILTER command - advanced filtering
    async filter(criteria, options = {}) {
        const criteriaLower = criteria?.toLowerCase() || '';
        let dataset = [];
        let results = [];
        
        // Determine dataset based on current context
        if (this.currentPath.includes('antecedentes')) {
            dataset = this.antecedentes;
        } else if (this.currentPath.includes('servicios')) {
            dataset = this.servicios;
        } else {
            dataset = [...this.antecedentes, ...this.servicios];
        }
        
        // Parse filter criteria
        const filters = this.parseFilterCriteria(criteria);
        results = this.applyFilters(dataset, filters);
        
        // Apply pagination
        const paginatedResults = this.paginateResults(results, options.page || 0, options.limit || this.pageSize);
        
        return this.formatFilterResults(results, paginatedResults, filters, options);
    }

    parseFilterCriteria(criteria) {
        const filters = {};
        
        if (!criteria) return filters;
        
        const parts = criteria.split(' ');
        let currentKey = null;
        let currentValue = [];
        
        for (const part of parts) {
            if (part.includes(':')) {
                // Save previous filter
                if (currentKey && currentValue.length > 0) {
                    filters[currentKey] = currentValue.join(' ');
                }
                
                // Start new filter
                const [key, ...value] = part.split(':');
                currentKey = key.toLowerCase();
                currentValue = value.filter(v => v);
            } else {
                if (currentKey) {
                    currentValue.push(part);
                } else {
                    // General search term
                    filters.general = (filters.general || '') + ' ' + part;
                }
            }
        }
        
        // Save last filter
        if (currentKey && currentValue.length > 0) {
            filters[currentKey] = currentValue.join(' ');
        }
        
        return filters;
    }

    applyFilters(dataset, filters) {
        return dataset.filter(item => {
            // General search
            if (filters.general) {
                const searchTerm = filters.general.toLowerCase().trim();
                const searchableText = [
                    item.Titulo,
                    item.Descripcion,
                    item.Cliente,
                    item.Area
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Year filter
            if (filters.ano || filters.year) {
                const year = new Date(item.Fecha).getFullYear();
                const targetYear = parseInt(filters.ano || filters.year);
                if (year !== targetYear) {
                    return false;
                }
            }
            
            // Client filter
            if (filters.cliente || filters.client) {
                const cliente = item.Cliente?.toLowerCase() || '';
                const targetCliente = (filters.cliente || filters.client).toLowerCase();
                if (!cliente.includes(targetCliente)) {
                    return false;
                }
            }
            
            // Area filter
            if (filters.area) {
                const area = item.Area?.toLowerCase() || '';
                const targetArea = filters.area.toLowerCase();
                if (!area.includes(targetArea)) {
                    return false;
                }
            }
            
            // Budget filter
            if (filters.presupuesto || filters.budget) {
                const budget = item.Presupuesto || 0;
                const targetBudget = parseInt(filters.presupuesto || filters.budget);
                
                // Support range queries like ">1000000" or "<500000"
                const budgetStr = (filters.presupuesto || filters.budget).toString();
                if (budgetStr.startsWith('>')) {
                    const minBudget = parseInt(budgetStr.substring(1));
                    if (budget <= minBudget) return false;
                } else if (budgetStr.startsWith('<')) {
                    const maxBudget = parseInt(budgetStr.substring(1));
                    if (budget >= maxBudget) return false;
                } else if (budget !== targetBudget) {
                    return false;
                }
            }
            
            return true;
        });
    }

    formatFilterResults(allResults, paginatedResults, filters, options) {
        const totalResults = allResults.length;
        const currentPage = options.page || 0;
        const totalPages = Math.ceil(totalResults / this.pageSize);
        
        let output = `<div class="command-success">
🔍 RESULTADOS DEL FILTRO
═══════════════════════════════════════════════════════════════

📊 FILTROS APLICADOS:
${Object.keys(filters).map(key => `   • ${key}: ${filters[key]}`).join('\n') || '   • Ningún filtro activo'}

📈 ESTADÍSTICAS:
   • Total encontrados: ${totalResults}
   • Página actual: ${currentPage + 1} de ${totalPages}
   • Mostrando: ${paginatedResults.length} elementos

═══════════════════════════════════════════════════════════════

`;

        if (paginatedResults.length === 0) {
            output += `❌ No se encontraron resultados con los criterios especificados.

💡 SUGERENCIAS:
   • Verifique la ortografía de los términos de búsqueda
   • Use términos más generales
   • Pruebe diferentes criterios de filtro
   • Use el comando 'help filter' para ver ejemplos

`;
        } else {
            output += `📋 RESULTADOS:\n\n`;
            
            paginatedResults.forEach((item, index) => {
                const globalIndex = (currentPage * this.pageSize) + index + 1;
                const year = new Date(item.Fecha).getFullYear();
                const budget = this.formatCurrency(item.Presupuesto || 0);
                
                output += `${String(globalIndex).padStart(3, ' ')}. 📋 ${item.Titulo}
     👤 Cliente: ${item.Cliente || 'N/A'}
     📅 Año: ${year}
     💰 Presupuesto: ${budget}
     🏢 Área: ${item.Area || 'N/A'}
     📄 ${item.Descripcion?.substring(0, 100) || 'Sin descripción'}...
     
`;
            });
        }
        
        if (totalPages > 1) {
            output += `
═══════════════════════════════════════════════════════════════
📄 NAVEGACIÓN:
   • filter --page ${Math.max(0, currentPage - 1)}  - Página anterior
   • filter --page ${Math.min(totalPages - 1, currentPage + 1)}  - Página siguiente
   • filter --page 0                    - Primera página
   • filter --page ${totalPages - 1}                    - Última página

`;
        }
        
        output += `💡 COMANDOS ÚTILES:
   • details [número]     - Ver detalles completos del elemento
   • export              - Exportar resultados a CSV
   • clear-filters       - Limpiar todos los filtros
   
</div>`;
        
        return output;
    }

    // DETAILS command - detailed view of specific items
    async details(identifier, options = {}) {
        let item = null;
        
        // Try to find by ID
        if (!isNaN(identifier)) {
            const id = parseInt(identifier);
            item = this.antecedentes.find(a => a.id === id) || 
                   this.servicios.find(s => s.id === id);
        }
        
        // Try to find by title
        if (!item) {
            const titleLower = identifier.toLowerCase();
            item = [...this.antecedentes, ...this.servicios].find(i => 
                i.Titulo?.toLowerCase().includes(titleLower)
            );
        }
        
        if (!item) {
            return this.formatError(`No se encontró elemento: ${identifier}`);
        }
        
        return this.formatItemDetails(item);
    }

    formatItemDetails(item) {
        const year = new Date(item.Fecha).getFullYear();
        const budget = this.formatCurrency(item.Presupuesto || 0);
        const type = this.antecedentes.includes(item) ? 'ANTECEDENTE' : 'SERVICIO';
        
        return `<div class="command-success">
📋 DETALLES COMPLETOS - ${type}
═══════════════════════════════════════════════════════════════

🏷️  IDENTIFICACIÓN:
     ID: ${item.id}
     Título: ${item.Titulo}
     
👤 CLIENTE:
     Nombre: ${item.Cliente || 'N/A'}
     
📅 INFORMACIÓN TEMPORAL:
     Fecha: ${item.Fecha}
     Año: ${year}
     
💰 INFORMACIÓN FINANCIERA:
     Presupuesto: ${budget}
     Unidad de Negocio: ${item.Unidad_de_negocio || 'N/A'}
     
🏢 CLASIFICACIÓN:
     Área: ${item.Area || 'N/A'}
     Categoría: ${this.getCategory(item)}
     
📄 DESCRIPCIÓN COMPLETA:
     ${item.Descripcion || 'Sin descripción disponible.'}

🖼️  RECURSOS:
     Imagen ID: ${item.Imagen || 'Sin imagen'}
     ${item.Antecedente ? `Antecedente: ${item.Antecedente}` : ''}

═══════════════════════════════════════════════════════════════

💡 ACCIONES DISPONIBLES:
   • filter cliente:"${item.Cliente}"   - Ver más del mismo cliente
   • filter area:"${item.Area}"         - Ver más de la misma área
   • filter ano:${year}                 - Ver más del mismo año
   • export --id ${item.id}            - Exportar este elemento

</div>`;
    }

    // NAVIGATE command - path navigation
    async navigate(path, options = {}) {
        const targetPath = this.resolvePath(path);
        
        if (!this.filesystem[targetPath]) {
            // Try to create dynamic path for data exploration
            if (this.isDynamicPath(targetPath)) {
                return this.handleDynamicNavigation(targetPath, options);
            }
            
            return this.formatError(`Ruta no válida: ${targetPath}\n\nRutas disponibles:\n${this.getAvailablePaths().join('\n')}`);
        }
        
        this.currentPath = targetPath;
        return this.explore(targetPath, options);
    }

    isDynamicPath(path) {
        // Check if path is a dynamic data exploration path
        const dynamicPatterns = [
            /^\/clientes\/[^\/]+$/,
            /^\/areas\/[^\/]+$/,
            /^\/antecedentes\/\d{4}$/,
            /^\/servicios\/[^\/]+$/
        ];
        
        return dynamicPatterns.some(pattern => pattern.test(path));
    }

    async handleDynamicNavigation(path, options = {}) {
        const parts = path.split('/').filter(p => p);
        
        if (parts[0] === 'clientes' && parts[1]) {
            return this.exploreByClient(parts[1], options);
        }
        
        if (parts[0] === 'areas' && parts[1]) {
            return this.exploreByArea(parts[1], options);
        }
        
        if (parts[0] === 'antecedentes' && parts[1] && /^\d{4}$/.test(parts[1])) {
            return this.exploreByYear(parseInt(parts[1]), options);
        }
        
        return this.formatError(`Navegación dinámica no soportada para: ${path}`);
    }

    async exploreByClient(clientName, options = {}) {
        const clientData = this.clientesMap.get(clientName.toLowerCase()) || [];
        
        if (clientData.length === 0) {
            return this.formatError(`No se encontraron datos para el cliente: ${clientName}`);
        }
        
        const paginatedResults = this.paginateResults(clientData, options.page || 0, options.limit || this.pageSize);
        
        return `<div class="command-success">
👤 CLIENTE: ${clientName.toUpperCase()}
═══════════════════════════════════════════════════════════════

📊 ESTADÍSTICAS:
   • Total proyectos: ${clientData.length}
   • Presupuesto total: ${this.formatCurrency(clientData.reduce((sum, item) => sum + (item.Presupuesto || 0), 0))}
   • Años activos: ${this.getYearRange(clientData)}
   • Áreas principales: ${this.getTopAreas(clientData, 3).join(', ')}

═══════════════════════════════════════════════════════════════

📋 PROYECTOS:

${paginatedResults.map((item, index) => {
    const globalIndex = ((options.page || 0) * this.pageSize) + index + 1;
    const year = new Date(item.Fecha).getFullYear();
    const budget = this.formatCurrency(item.Presupuesto || 0);
    
    return `${String(globalIndex).padStart(3, ' ')}. 📋 ${item.Titulo}
     📅 ${year} | 💰 ${budget} | 🏢 ${item.Area || 'N/A'}
     📄 ${item.Descripcion?.substring(0, 120) || 'Sin descripción'}...`;
}).join('\n\n')}

═══════════════════════════════════════════════════════════════
</div>`;
    }

    async exploreByArea(areaName, options = {}) {
        const areaData = this.areasMap.get(areaName.toLowerCase()) || [];
        
        if (areaData.length === 0) {
            return this.formatError(`No se encontraron datos para el área: ${areaName}`);
        }
        
        const paginatedResults = this.paginateResults(areaData, options.page || 0, options.limit || this.pageSize);
        
        return `<div class="command-success">
🏢 ÁREA: ${areaName.toUpperCase()}
═══════════════════════════════════════════════════════════════

📊 ESTADÍSTICAS:
   • Total proyectos: ${areaData.length}
   • Presupuesto total: ${this.formatCurrency(areaData.reduce((sum, item) => sum + (item.Presupuesto || 0), 0))}
   • Clientes únicos: ${new Set(areaData.map(item => item.Cliente)).size}
   • Años activos: ${this.getYearRange(areaData)}

═══════════════════════════════════════════════════════════════

📋 PROYECTOS:

${paginatedResults.map((item, index) => {
    const globalIndex = ((options.page || 0) * this.pageSize) + index + 1;
    const year = new Date(item.Fecha).getFullYear();
    const budget = this.formatCurrency(item.Presupuesto || 0);
    
    return `${String(globalIndex).padStart(3, ' ')}. 📋 ${item.Titulo}
     👤 ${item.Cliente} | 📅 ${year} | 💰 ${budget}
     📄 ${item.Descripcion?.substring(0, 120) || 'Sin descripción'}...`;
}).join('\n\n')}

═══════════════════════════════════════════════════════════════
</div>`;
    }

    async exploreByYear(year, options = {}) {
        const yearData = this.yearsMap.get(year) || [];
        
        if (yearData.length === 0) {
            return this.formatError(`No se encontraron datos para el año: ${year}`);
        }
        
        const paginatedResults = this.paginateResults(yearData, options.page || 0, options.limit || this.pageSize);
        
        return `<div class="command-success">
📅 AÑO: ${year}
═══════════════════════════════════════════════════════════════

📊 ESTADÍSTICAS:
   • Total proyectos: ${yearData.length}
   • Presupuesto total: ${this.formatCurrency(yearData.reduce((sum, item) => sum + (item.Presupuesto || 0), 0))}
   • Clientes únicos: ${new Set(yearData.map(item => item.Cliente)).size}
   • Áreas principales: ${this.getTopAreas(yearData, 3).join(', ')}

═══════════════════════════════════════════════════════════════

📋 PROYECTOS:

${paginatedResults.map((item, index) => {
    const globalIndex = ((options.page || 0) * this.pageSize) + index + 1;
    const budget = this.formatCurrency(item.Presupuesto || 0);
    
    return `${String(globalIndex).padStart(3, ' ')}. 📋 ${item.Titulo}
     👤 ${item.Cliente} | 🏢 ${item.Area} | 💰 ${budget}
     📄 ${item.Descripcion?.substring(0, 120) || 'Sin descripción'}...`;
}).join('\n\n')}

═══════════════════════════════════════════════════════════════
</div>`;
    }

    // Utility methods
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        if (this.currentPath === '/') {
            return '/' + path;
        }
        
        return this.currentPath + '/' + path;
    }

    getPathIcon(path) {
        const iconMap = {
            'servicios': '🛠️',
            'antecedentes': '📋',
            'clientes': '👤',
            'areas': '🏢',
            'estadisticas': '📊',
            'desarrollo-web': '🌐',
            'redes-comunicaciones': '🔗',
            'software-medida': '💻',
            'telecomunicaciones': '📡',
            'por-ano': '📅',
            'por-cliente': '👥',
            'por-area': '🏭',
            'por-presupuesto': '💰',
            'destacados': '⭐',
            'gobierno': '🏛️',
            'empresas': '🏢',
            'instituciones': '🎓',
            'hospitales': '🏥',
            'municipalidades': '🏛️'
        };
        
        return iconMap[path] || '📁';
    }

    getAvailablePaths() {
        return Object.keys(this.filesystem).sort();
    }

    paginateResults(results, page = 0, limit = 10) {
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        return results.slice(startIndex, endIndex);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatError(message) {
        return `<div class="command-error">
❌ ERROR: ${message}

💡 Use 'help' para ver comandos disponibles
</div>`;
    }

    getCategory(item) {
        if (this.antecedentes.includes(item)) return 'Antecedente';
        if (this.servicios.includes(item)) return 'Servicio';
        return 'Desconocido';
    }

    getYearRange(data) {
        const years = data.map(item => new Date(item.Fecha).getFullYear()).sort();
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        return minYear === maxYear ? minYear.toString() : `${minYear}-${maxYear}`;
    }

    getTopAreas(data, limit = 5) {
        const areaCounts = {};
        data.forEach(item => {
            const area = item.Area || 'Otros';
            areaCounts[area] = (areaCounts[area] || 0) + 1;
        });
        
        return Object.entries(areaCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([area]) => area);
    }

    // Cache management
    setCacheItem(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    getCacheItem(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clearCache() {
        this.cache.clear();
        return 'Cache limpiado exitosamente.';
    }

    // Real-time data fetching capability (placeholder for Directus integration)
    async fetchRealTimeData(endpoint, params = {}) {
        // This would integrate with Directus CMS API
        try {
            const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
            const cachedResult = this.getCacheItem(cacheKey);
            
            if (cachedResult) {
                return cachedResult;
            }
            
            // Placeholder for actual API call
            // const response = await fetch(`/api/directus/${endpoint}`, {
            //     method: 'GET',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(params)
            // });
            // const data = await response.json();
            
            // For now, return cached local data
            const result = {
                antecedentes: this.antecedentes,
                servicios: this.servicios,
                timestamp: Date.now()
            };
            
            this.setCacheItem(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            return null;
        }
    }

    // Statistics and analytics
    generateStats() {
        const totalProjects = this.antecedentes.length + this.servicios.length;
        const totalBudget = [...this.antecedentes, ...this.servicios]
            .reduce((sum, item) => sum + (item.Presupuesto || 0), 0);
        
        const uniqueClients = new Set([...this.antecedentes, ...this.servicios]
            .map(item => item.Cliente)).size;
        
        const uniqueAreas = new Set([...this.antecedentes, ...this.servicios]
            .map(item => item.Area)).size;
        
        const yearRange = this.getYearRange([...this.antecedentes, ...this.servicios]);
        
        return {
            totalProjects,
            totalBudget: this.formatCurrency(totalBudget),
            uniqueClients,
            uniqueAreas,
            yearRange,
            antecedentesCount: this.antecedentes.length,
            serviciosCount: this.servicios.length
        };
    }
}

// Export for use in terminal
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataNavigationEngine;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.DataNavigationEngine = DataNavigationEngine;
}
