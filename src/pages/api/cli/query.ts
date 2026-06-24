import type { APIRoute } from 'astro';
import {
    CLI_ANTECEDENTES_FIELDS,
    CLI_SERVICIOS_FIELDS,
    antecedenteClient,
    antecedenteDescription,
    antecedenteTitle,
    antecedenteUrl,
    readCliSearchQuery,
    servicioDescription,
    servicioTitle,
    servicioUrl,
    type CliAntecedente,
    type CliServicio,
} from '../../../utils/cliDirectus';

// CRÍTICO: SOLO URLs REALES - NUNCA INVENTAR URLs
// Basado en corrección por violación de orden del usuario

interface FormattedResult {
    id: number;
    type: string;
    icon: string;
    title: string;
    content: string;
    url: string;
    client: string | null;
    image: string | null;
    mailto_link: string;
}

// CONEXIÓN DIRECTA A DIRECTUS REAL - SOLO URLs VERIFICADAS
async function queryDirectusRealOnly(searchQuery: string): Promise<FormattedResult[]> {
    try {
        const token = import.meta.env.DIRECTUS_STATIC_TOKEN || import.meta.env.PUBLIC_DIRECTUS_TOKEN || '';
        const directusUrl = import.meta.env.DIRECTUS_INTERNAL_URL || import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
        if (!token) return [];
        
        // BUSCAR EN ANTECEDENTES REALES
        const antecedentesResponse = await fetch(`${directusUrl}/items/Antecedentes?limit=10&search=${encodeURIComponent(searchQuery)}&fields=${CLI_ANTECEDENTES_FIELDS}&sort=-Fecha`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // BUSCAR EN SERVICIOS REALES
        const serviciosResponse = await fetch(`${directusUrl}/items/Servicios?limit=5&search=${encodeURIComponent(searchQuery)}&fields=${CLI_SERVICIOS_FIELDS}&sort=id`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const results: FormattedResult[] = [];
        
        // PROCESAR ANTECEDENTES
        if (antecedentesResponse.ok) {
            const antecedentesData = await antecedentesResponse.json();
            const antecedentes: CliAntecedente[] = antecedentesData.data || [];
            
            antecedentes.forEach((ant) => {
                const title = antecedenteTitle(ant);
                const realUrl = antecedenteUrl(ant);
                
                results.push({
                    id: ant.id,
                    type: 'antecedente',
                    icon: '📊',
                    title,
                    content: antecedenteDescription(ant, 250),
                    url: realUrl,
                    client: antecedenteClient(ant),
                    image: null,
                    mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa el proyecto: ${title}\n\nVer más información: ${realUrl}\n\nSaludos`)}`
                });
            });
        }
        
        // PROCESAR SERVICIOS
        if (serviciosResponse.ok) {
            const serviciosData = await serviciosResponse.json();
            const servicios: CliServicio[] = serviciosData.data || [];
            
            servicios.forEach((serv) => {
                const title = servicioTitle(serv);
                const realUrl = servicioUrl(serv);
                
                results.push({
                    id: serv.id,
                    type: 'servicio',
                    icon: '🛠️',
                    title,
                    content: servicioDescription(serv, 250),
                    url: realUrl,
                    client: null,
                    image: null,
                    mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta servicio: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa el servicio: ${title}\n\nVer más información: ${realUrl}\n\nAguardo su contacto`)}`
                });
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('[CLI] Error querying Directus:', error);
        return [];
    }
}

// API ENDPOINT CORREGIDO - SOLO URLs REALES
export const POST: APIRoute = async ({ request }) => {
    try {
        const parsed = await readCliSearchQuery(request);
        if (!parsed.ok) return parsed.response;

        const searchQuery = parsed.query.toLowerCase();
        console.warn(`[CLI] Processing: "${searchQuery}"`);
        
        // CONSULTAR DIRECTUS CON URLs REALES SOLAMENTE
        const results = await queryDirectusRealOnly(searchQuery);
        
        // RESPUESTA CON GARANTÍA DE URLs REALES
        const response = {
            query: searchQuery,
            results: results,
            total: results.length,
            meta: {
                source: 'directus_real_data_only',
                timestamp: new Date().toISOString(),
                warning: 'Only verified URLs included - no invented URLs',
                version: 'um-cli-v2.5-real-urls-only'
            }
        };
        
        console.warn(`[CLI] Response: ${results.length} results (REAL URLs only)`);
        
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        });
        
    } catch (error) {
        console.error('[CLI] API Error:', error);
        
        return new Response(JSON.stringify({
            error: true,
            message: 'Error interno del servidor. Intenta nuevamente.',
            fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto']
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
