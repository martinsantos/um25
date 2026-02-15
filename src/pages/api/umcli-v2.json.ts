import type { APIRoute } from 'astro';
import { 
  getAntecedentesV2, 
  searchAntecedentesV2, 
  checkDirectusHealthV2,
  getEstadisticasEmpresariales 
} from '../../lib/directus-v2';

export const GET: APIRoute = async ({ url }) => {
  const startTime = Date.now();
  const searchParams = new URLSearchParams(url.search);
  const action = searchParams.get('action') || 'default';
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // Health check primero
    const healthCheck = await checkDirectusHealthV2();
    
    let responseData = {
      success: true,
      timestamp: Date.now(),
      version: '2.0.0',
      directus_health: healthCheck,
      data: {},
      performance: {
        response_time_ms: 0,
        cache_status: 'miss'
      }
    };

    // Manejar diferentes acciones
    switch (action) {
      case 'search':
        if (query) {
          const searchResults = await searchAntecedentesV2(query);
          responseData.data = {
            action: 'search',
            query,
            ...searchResults
          };
        } else {
          responseData.data = {
            action: 'search',
            error: 'Query parameter required',
            usage: 'Use ?action=search&q=your_search_term'
          };
        }
        break;
        
      case 'antecedentes':
        const antecedentes = await getAntecedentesV2(limit);
        responseData.data = {
          action: 'antecedentes',
          ...antecedentes
        };
        break;
        
      case 'health':
        const stats = await getEstadisticasEmpresariales();
        responseData.data = {
          action: 'health',
          astro_status: 'online',
          pm2_status: 'running',
          directus_status: healthCheck.status,
          server_info: {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            node_version: process.version,
            platform: process.platform
          },
          empresa: stats.data
        };
        break;
        
      case 'stats':
        const empresaStats = await getEstadisticasEmpresariales();
        responseData.data = {
          action: 'stats',
          ...empresaStats
        };
        break;

      case 'commands':
        responseData.data = {
          action: 'commands',
          available_commands: {
            navegacion: ['ls', 'cd', 'pwd', 'tree'],
            busqueda: ['grep', 'find', 'locate'],
            estadisticas: ['stats', 'top', 'wc', 'du'],
            sistema: ['whoami', 'uname', 'ps', 'uptime', 'df'],
            utilidades: ['help', 'history', 'clear'],
            avanzados: ['export', 'backup', 'deploy', 'monitor'],
            externos: ['weather', 'currency', 'news', 'whois']
          },
          new_in_v2: [
            'Real data from Directus',
            'External API integration', 
            'Enhanced search capabilities',
            'Performance monitoring',
            'Export functionality',
            'System health checks'
          ]
        };
        break;
        
      default:
        // Respuesta completa por defecto
        const [antecedentesData, empresaData] = await Promise.all([
          getAntecedentesV2(5),
          getEstadisticasEmpresariales()
        ]);
        
        responseData.data = {
          antecedentes: antecedentesData.data,
          estadisticas: {
            totalAntecedentes: antecedentesData.total,
            dataSource: antecedentesData.source,
            ultimaActualizacion: new Date().toISOString(),
            serviciosActivos: ['Astro SSR', 'Directus CMS', 'PostgreSQL', 'Redis'],
            arquitectura: {
              frontend: 'Astro SSR (puerto 3000)',
              cms: 'Directus (puerto 8055)',
              database: 'PostgreSQL (Docker)',
              proxy: 'Nginx (80/443)'
            }
          },
          empresa: empresaData.data,
          capabilities: [
            'search',
            'real-time-data',
            'health-monitoring', 
            'performance-metrics',
            'external-apis',
            'data-export',
            'system-integration'
          ],
          endpoints: {
            default: '/api/umcli-v2.json',
            search: '/api/umcli-v2.json?action=search&q=TERM',
            antecedentes: '/api/umcli-v2.json?action=antecedentes&limit=10',
            health: '/api/umcli-v2.json?action=health',
            stats: '/api/umcli-v2.json?action=stats',
            commands: '/api/umcli-v2.json?action=commands'
          }
        };
    }

    // Performance timing
    responseData.performance.response_time_ms = Date.now() - startTime;

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-API-Version': '2.0.0',
        'X-Response-Time': `${responseData.performance.response_time_ms}ms`,
        'X-Data-Source': healthCheck.healthy ? 'directus' : 'fallback',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('[UM-CLI API v2] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: Date.now(),
      version: '2.0.0',
      fallback_available: true
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '2.0.0'
      }
    });
  }
};

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};
