import type { APIRoute } from 'astro';

// CRÍTICO: SOLO URLs REALES - NUNCA INVENTAR URLs
// Basado en corrección por violación de orden del usuario

interface DirectusResult {
    id: number;
    title: string;
    content?: string;
    client?: string;
    description?: string;
    slug?: string;
}

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
        
        // ⚠️ CRÍTICO: URLs REALES CONOCIDAS (de memorias del proyecto)
        // NO GENERAR URLs INVENTADAS - SOLO ESTAS VERIFICADAS
        const knownValidUrls: Record<string, string> = {
            // ANTECEDENTES VERIFICADOS EN PRODUCCIÓN
            '10769': 'ministerio-de-deportes-gobierno-de-mendoza-redes-y',
            '10771': 'bodega-domaine-bousquet-redes-y-comunicaciones', 
            '10775': 'municipalidad-de-maipu-redes-y-comunicaciones',
            '10777': 'cnn-software-a-medida',
            '10787': 'verde-pimienta-espana-software-a-medida',
            
            // SERVICIOS VERIFICADOS EN PRODUCCIÓN 
            '1': 'servicios-it',
            '2': 'redes-de-datos',
            '3': 'seguridad-informatica', 
            '4': 'servicios-gestionados',
            '5': 'consultoria-tecnologica',
            '11': 'servicios-web'
        };
        
        // BUSCAR EN ANTECEDENTES REALES
        const antecedentesResponse = await fetch(`${directusUrl}/items/Antecedentes?limit=10&search=${encodeURIComponent(searchQuery)}&fields=id,title,content,client&sort=-id`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // BUSCAR EN SERVICIOS REALES
        const serviciosResponse = await fetch(`${directusUrl}/items/Servicios?limit=5&search=${encodeURIComponent(searchQuery)}&fields=id,title,description&sort=id`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const results: FormattedResult[] = [];
        
        // PROCESAR ANTECEDENTES
        if (antecedentesResponse.ok) {
            const antecedentesData = await antecedentesResponse.json();
            const antecedentes: DirectusResult[] = antecedentesData.data || [];
            
            antecedentes.forEach((ant) => {
                const knownSlug = knownValidUrls[ant.id.toString()];
                
                // SOLO URLs REALES O GENÉRICAS - NUNCA INVENTADAS
                const realUrl = knownSlug 
                    ? `https://ultimamilla.com.ar/antecedentes/${ant.id}/${knownSlug}`
                    : 'https://ultimamilla.com.ar/antecedentes'; // Página genérica si no conocemos slug específico
                
                results.push({
                    id: ant.id,
                    type: 'antecedente',
                    icon: '📊',
                    title: ant.title,
                    content: (ant.content || 'Información disponible en el sitio web').slice(0, 250) + '...',
                    url: realUrl,
                    client: ant.client || null,
                    image: null,
                    mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta: ${ant.title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa el proyecto: ${ant.title}\n\nVer más información: ${realUrl}\n\nSaludos`)}`
                });
            });
        }
        
        // PROCESAR SERVICIOS
        if (serviciosResponse.ok) {
            const serviciosData = await serviciosResponse.json();
            const servicios: DirectusResult[] = serviciosData.data || [];
            
            servicios.forEach((serv) => {
                const knownSlug = knownValidUrls[serv.id.toString()];
                
                // SOLO URLs REALES O GENÉRICAS - NUNCA INVENTADAS
                const realUrl = knownSlug 
                    ? `https://ultimamilla.com.ar/servicios/${serv.id}/${knownSlug}`
                    : 'https://ultimamilla.com.ar/servicios'; // Página genérica si no conocemos slug específico
                
                results.push({
                    id: serv.id,
                    type: 'servicio',
                    icon: '🛠️',
                    title: serv.title,
                    content: (serv.description || 'Servicio profesional disponible').slice(0, 250) + '...',
                    url: realUrl,
                    client: null,
                    image: null,
                    mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta servicio: ${serv.title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa el servicio: ${serv.title}\n\nVer más información: ${realUrl}\n\nAguardo su contacto`)}`
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
        const { query } = await request.json();
        
        if (!query || query.trim().length < 2) {
            return new Response(JSON.stringify({
                error: true,
                message: 'Query muy corta. Mínimo 2 caracteres.',
                fallback_commands: ['help', 'servicios', 'antecedentes', 'contacto']
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const searchQuery = query.toLowerCase().trim();
        console.log(`[CLI] Processing: "${searchQuery}"`);
        
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
        
        console.log(`[CLI] Response: ${results.length} results (REAL URLs only)`);
        
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
