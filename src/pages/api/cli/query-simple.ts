import type { APIRoute } from 'astro';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
    CLI_ANTECEDENTES_FIELDS,
    CLI_SERVICIOS_FIELDS,
    antecedenteClient,
    antecedenteDescription,
    antecedenteTitle,
    antecedenteUrl,
    getCliDirectusHeaders,
    getCliDirectusRuntime,
    readCliSearchQuery,
    servicioDescription,
    servicioTitle,
    servicioUrl,
    type CliAntecedente,
    type CliServicio,
} from '../../../utils/cliDirectus';

// Enable server-side rendering for this endpoint
export const prerender = false;

const execAsync = promisify(exec);

// Execute PostgreSQL queries via docker exec
async function queryDatabase(sql: string, params: string[] = []) {
    try {
        // Build parameterized query
        let query = sql;
        params.forEach((param, index) => {
            query = query.replace(`$${index + 1}`, `'${param.replace(/'/g, "''")}'`);
        });
        
        const dockerCmd = `docker exec umbot-postgres-prod psql -U directus -d directus -t -c "${query}"`;
        const { stdout } = await execAsync(dockerCmd);
        
        return stdout.trim();
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// CONECTAR DIRECTAMENTE CON DIRECTUS REAL - 469 antecedentes + 9 servicios
async function queryDirectusAPI(searchQuery: string): Promise<any> {
    try {
        const { directusUrl, token } = getCliDirectusRuntime();
        const headers = getCliDirectusHeaders(token);
        
        // BUSCAR EN ANTECEDENTES REALES (469 registros)
        const antecedentesResponse = await fetch(`${directusUrl}/items/Antecedentes?limit=50&search=${encodeURIComponent(searchQuery)}&fields=${CLI_ANTECEDENTES_FIELDS}&sort=-Fecha`, {
            headers,
        });
        
        // BUSCAR EN SERVICIOS REALES (9 registros)
        const serviciosResponse = await fetch(`${directusUrl}/items/Servicios?limit=10&search=${encodeURIComponent(searchQuery)}&fields=${CLI_SERVICIOS_FIELDS}`, {
            headers,
        });
        
        const antecedentes = antecedentesResponse.ok ? (await antecedentesResponse.json()).data : [];
        const servicios = serviciosResponse.ok ? (await serviciosResponse.json()).data : [];
        
        return { antecedentes, servicios };
    } catch (error) {
        console.error('Directus API error:', error);
        return { antecedentes: [], servicios: [] };
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const parsed = await readCliSearchQuery(request);
        if (!parsed.ok) return parsed.response;

        const searchQuery = parsed.query.toLowerCase();
        
        // CONSULTAR DIRECTUS REAL - 469 antecedentes + 9 servicios
        const directusData = await queryDirectusAPI(searchQuery);
        
        const formattedResults: any[] = [];
        
        // FORMATEAR ANTECEDENTES REALES CON URLs REALES
        directusData.antecedentes.forEach((antecedente: CliAntecedente) => {
            const title = antecedenteTitle(antecedente);
            const realUrl = antecedenteUrl(antecedente);
            
            formattedResults.push({
                id: antecedente.id,
                type: 'antecedente',
                icon: '📊',
                title,
                content: antecedenteDescription(antecedente, 300),
                url: realUrl,
                client: antecedenteClient(antecedente),
                image: null,
                email_link: `/api/cli/query?action=email&id=${antecedente.id}`,
                mailto_link: `mailto:?subject=${encodeURIComponent(`Información sobre: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nTe envío información sobre el proyecto: ${title}\n\nMás detalles: ${realUrl}\n\nSaludos,\nEquipo Ultima Milla`)}`
            });
        });
        
        // FORMATEAR SERVICIOS REALES CON URLs REALES  
        directusData.servicios.forEach((servicio: CliServicio) => {
            const title = servicioTitle(servicio);
            const realUrl = servicioUrl(servicio);
            
            formattedResults.push({
                id: servicio.id,
                type: 'servicio',
                icon: '🛠️',
                title,
                content: servicioDescription(servicio, 300),
                url: realUrl,
                client: null,
                image: null,
                email_link: `/api/cli/query?action=email&id=${servicio.id}`,
                mailto_link: `mailto:?subject=${encodeURIComponent(`Información sobre: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nTe envío información sobre el servicio: ${title}\n\nMás detalles: ${realUrl}\n\nSaludos,\nEquipo Ultima Milla`)}`
            });
        });
        
        // If no results, provide intelligent suggestions
        if (formattedResults.length === 0) {
            const suggestions = [];
            
            if (/seguridad|cámara|firewall|monitoreo/.test(searchQuery)) {
                suggestions.push({
                    type: 'suggestion',
                    icon: '🔒',
                    title: 'Servicios de Seguridad IT',
                    content: 'Sistemas de cámaras IP, monitoreo 24/7, firewall empresarial y seguridad perimetral completa.',
                    url: '/servicios'
                });
            }
            
            if (/red|networking|conectividad|wifi|internet|cableado/.test(searchQuery)) {
                suggestions.push({
                    type: 'suggestion', 
                    icon: '🌐',
                    title: 'Redes y Conectividad',
                    content: 'Instalación de redes LAN/WAN, WiFi empresarial, cableado estructurado Cat6A y switching.',
                    url: '/servicios'
                });
            }
            
            if (/desarrollo|web|app|software|ecommerce/.test(searchQuery)) {
                suggestions.push({
                    type: 'suggestion',
                    icon: '💻', 
                    title: 'Desarrollo Web y Software',
                    content: 'Sitios web corporativos, e-commerce, aplicaciones móviles y sistemas de gestión a medida.',
                    url: '/servicios'
                });
            }
            
            if (suggestions.length === 0) {
                suggestions.push({
                    type: 'help',
                    icon: '💡',
                    title: `Sin resultados para "${searchQuery}"`,
                    content: 'Intenta con: "seguridad", "redes", "desarrollo", "cámaras", "wifi" o "antecedentes"',
                    url: '/servicios'
                });
            }
            
            return new Response(JSON.stringify({
                query: searchQuery,
                results: suggestions,
                total: 0,
                type: 'suggestions'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            query: searchQuery,
            results: formattedResults,
            total: formattedResults.length,
            type: 'search_results'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('❌ UM CLI API Error:', error);
        
        return new Response(JSON.stringify({
            error: 'Error de búsqueda',
            message: 'Servicio temporalmente no disponible. Intenta comandos básicos.',
            fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto']
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const GET: APIRoute = async () => {
    try {
        const countResult = await queryDatabase('SELECT COUNT(*) as total FROM cli_content;');
        const total = parseInt(countResult.trim()) || 0;
        
        return new Response(JSON.stringify({
            status: 'UM CLI API operativo',
            version: '1.0.0',
            database_docs: total,
            endpoints: {
                'POST /api/cli/query': 'Búsqueda inteligente',
                'GET /api/cli/query': 'Estado API'
            },
            example: {
                method: 'POST',
                url: '/api/cli/query',
                body: { query: 'seguridad' }
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            status: 'UM CLI API operativo',
            version: '1.0.0',
            message: 'API funcional - Stats DB no disponibles'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
