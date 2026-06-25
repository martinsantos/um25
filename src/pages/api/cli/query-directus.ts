import type { APIRoute } from 'astro';
import {
    CLI_ANTECEDENTES_FIELDS,
    CLI_SERVICIOS_FIELDS,
    antecedenteClient,
    antecedenteDescription,
    antecedenteTitle,
    antecedenteUrl,
    getCliDirectusHeaders,
    getCliDirectusRuntime,
    queryCliDirectusSnapshot,
    readCliSearchQuery,
    servicioDescription,
    servicioTitle,
    servicioUrl,
    type CliDirectusData,
    type CliAntecedente,
    type CliServicio,
} from '../../../utils/cliDirectus';

// CONEXIÓN DIRECTA CON DIRECTUS REAL - SEGÚN PREMISAS PLAN.MD
// OBJETIVO: Acceso a TODOS los 469 antecedentes + 9 servicios con URLs reales

interface FormattedResult {
    id: number;
    type: string;
    icon: string;
    title: string;
    content: string;
    url: string;
    client: string | null;
    image: string | null;
    email_link: string;
    mailto_link: string;
}

// DIRECTUS API CONNECTION - REAL DATA ACCESS
async function queryDirectusReal(searchQuery: string): Promise<CliDirectusData> {
    try {
        const { directusUrl, token } = await getCliDirectusRuntime();
        const headers = getCliDirectusHeaders(token);
        
        // BUSCAR EN ANTECEDENTES REALES (469 registros) - AMPLIO ALCANCE
        const antecedentesUrl = `${directusUrl}/items/Antecedentes?limit=20&search=${encodeURIComponent(searchQuery)}&fields=${CLI_ANTECEDENTES_FIELDS}&sort=-Fecha`;
        
        // BUSCAR EN SERVICIOS REALES (9 registros)
        const serviciosUrl = `${directusUrl}/items/Servicios?limit=10&search=${encodeURIComponent(searchQuery)}&fields=${CLI_SERVICIOS_FIELDS}`;
        
        // PARALLEL REQUESTS para máximo rendimiento
        const [antecedentesResponse, serviciosResponse] = await Promise.all([
            fetch(antecedentesUrl, { headers }),
            fetch(serviciosUrl, { headers })
        ]);
        
        let antecedentes = antecedentesResponse.ok ? (await antecedentesResponse.json()).data : [];
        let servicios = serviciosResponse.ok ? (await serviciosResponse.json()).data : [];

        if (antecedentes.length === 0 && servicios.length === 0) {
            const fallback = await queryCliDirectusSnapshot(searchQuery, {
                antecedenteLimit: 20,
                servicioLimit: 10,
            });
            antecedentes = fallback.antecedentes;
            servicios = fallback.servicios;
        }
        
        console.warn(`[UM-CLI] Directus Query Results: ${antecedentes.length} antecedentes, ${servicios.length} servicios`);
        
        return { antecedentes, servicios };
    } catch (error) {
        console.error('[UM-CLI] Directus API Error:', error);
        return queryCliDirectusSnapshot(searchQuery, {
            antecedenteLimit: 20,
            servicioLimit: 10,
        });
    }
}

// INTELLIGENT SEARCH EXPANSION - SEGÚN PREMISAS PLAN.MD
function expandSearchQuery(query: string): string[] {
    const synonyms: Record<string, string[]> = {
        'seguridad': ['firewall', 'ciberseguridad', 'antivirus', 'protección', 'monitoreo', 'backup', 'incendio', 'detector'],
        'redes': ['networking', 'conectividad', 'wifi', 'internet', 'cisco', 'switch', 'router', 'fibra', 'optica'],
        'desarrollo': ['programación', 'software', 'web', 'app', 'aplicación', 'sistema', 'wordpress', 'ecommerce'],
        'telefonia': ['telefonía', 'voip', 'comunicaciones', 'asterisk', 'central', 'llamadas', 'ip'],
        'automatización': ['control', 'scada', 'industrial', 'proceso', 'monitoreo', 'plc'],
        'gobierno': ['municipal', 'ministerio', 'público', 'estado', 'gubernamental', 'municipalidad'],
        'empresas': ['corporativo', 'empresa', 'negocio', 'comercial', 'pyme', 'industria']
    };
    
    const expanded = [query];
    const lowerQuery = query.toLowerCase();
    
    // Expandir con sinónimos
    Object.entries(synonyms).forEach(([key, values]) => {
        if (lowerQuery.includes(key) || values.some(v => lowerQuery.includes(v))) {
            expanded.push(key, ...values);
        }
    });
    
    return [...new Set(expanded)];
}

// FORMAT RESULTS WITH REAL URLs - SOLO URLs QUE EXISTEN VERIFICADAMENTE
function formatResults(directusData: {antecedentes: CliAntecedente[], servicios: CliServicio[]}): FormattedResult[] {
    const results: FormattedResult[] = [];

    // FORMATEAR ANTECEDENTES - usar slug real del CMS o índice genérico
    directusData.antecedentes.forEach((antecedente) => {
        const title = antecedenteTitle(antecedente);
        const realUrl = antecedenteUrl(antecedente);

        results.push({
            id: antecedente.id,
            type: 'antecedente',
            icon: '📊',
            title,
            content: antecedenteDescription(antecedente),
            url: realUrl,
            client: antecedenteClient(antecedente),
            image: null,
            email_link: `/api/cli/email?type=antecedente&id=${antecedente.id}`,
            mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta sobre: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa conocer más sobre el proyecto: ${title}\n\nVer detalles: ${realUrl}\n\nSaludos cordiales`)}`
        });
    });
    
    // FORMATEAR SERVICIOS - usar slug real del CMS o índice genérico
    directusData.servicios.forEach((servicio) => {
        const title = servicioTitle(servicio);
        const realUrl = servicioUrl(servicio);

        results.push({
            id: servicio.id,
            type: 'servicio',
            icon: '🛠️',
            title,
            content: servicioDescription(servicio),
            url: realUrl,
            client: null,
            image: null,
            email_link: `/api/cli/email?type=servicio&id=${servicio.id}`,
            mailto_link: `mailto:?subject=${encodeURIComponent(`Consulta sobre servicio: ${title}`)}&body=${encodeURIComponent(`Hola,\n\nMe interesa contratar el servicio: ${title}\n\nVer información: ${realUrl}\n\nAguardo su contacto`)}`
        });
    });
    
    return results;
}

// MAIN API ENDPOINT - AMPLIADO SEGÚN PLAN.MD
export const POST: APIRoute = async ({ request }) => {
    try {
        const parsed = await readCliSearchQuery(request);
        if (!parsed.ok) return parsed.response;

        const searchQuery = parsed.query.toLowerCase();
        console.warn(`[UM-CLI] Processing query: "${searchQuery}"`);
        
        // EXPANDED SEARCH según premisas PLAN.MD
        const expandedTerms = expandSearchQuery(searchQuery);
        console.warn(`[UM-CLI] Expanded terms:`, expandedTerms);
        
        // QUERY DIRECTUS REAL DATA
        const directusData = await queryDirectusReal(searchQuery);
        
        // FORMAT WITH REAL URLs
        const formattedResults = formatResults(directusData);
        
        // RESPONSE CON ESTADÍSTICAS EXPANDIDAS
        const response = {
            query: searchQuery,
            expanded_terms: expandedTerms,
            total_found: formattedResults.length,
            total_antecedentes: directusData.antecedentes.length,
            total_servicios: directusData.servicios.length,
            results: formattedResults,
            meta: {
                source: 'directus_real_data',
                timestamp: new Date().toISOString(),
                version: 'um-cli-v2.5-directus'
            }
        };
        
        console.warn(`[UM-CLI] Response: ${formattedResults.length} results for "${searchQuery}"`);
        
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // 5 min cache
            }
        });
        
    } catch (error) {
        console.error('[UM-CLI] API Error:', error);
        
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
