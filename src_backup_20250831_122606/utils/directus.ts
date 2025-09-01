// Utility functions for Directus authentication and API calls
const MOCK_SERVICES = [
    {
        id: 1,
        Titulo: 'Servicio de ejemplo 1',
        status: 'published',
        Descripcion: 'Este es un servicio de ejemplo para desarrollo.',
    },
    {
        id: 2,
        Titulo: 'Servicio de ejemplo 2',
        status: 'published',
        Descripcion: 'Este es otro servicio de ejemplo para desarrollo.',
    }
];

export async function authenticate() {
    const baseUrl = import.meta.env.VITE_DIRECTUS_URL;
    const staticToken = import.meta.env.VITE_DIRECTUS_TOKEN;
    const isDevelopment = import.meta.env.MODE === 'development';
    const useDirectus = import.meta.env.USE_DIRECTUS === 'true';
    
    // In development or when Directus is disabled, use mock data
    if (isDevelopment || !useDirectus || !staticToken || !baseUrl) {
        console.warn('Using static data instead of Directus connection');
        return { token: 'mock-token' };
    }

    try {
        const response = await fetch(`${baseUrl}/users/me`, {
            headers: { 'Authorization': `Bearer ${staticToken}` },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Directus authentication failed, falling back to static data:', response.status, errorText);
            return { token: 'mock-token' };
        }
        
        return { token: staticToken };
    } catch (e) {
        console.warn('Directus connection failed, using static data:', e.message);
        return { token: 'mock-token' };
    }
}

export async function fetchDirectus(path: string, options: RequestInit = {}) {
    const baseUrl = import.meta.env.VITE_DIRECTUS_URL;
    const staticToken = import.meta.env.VITE_DIRECTUS_TOKEN;

    // Durante el build, si no hay token, devolver datos mock
    if (import.meta.env.SSR && (!staticToken || !baseUrl)) {
        console.warn('Variables de entorno de Directus no configuradas, usando datos mock');
        
        // Mock data based on the requested path
        if (path.includes('servicios')) {
            if (path.includes('fields=id,Titulo,status')) {
                return { data: MOCK_SERVICES };
            }
            const id = path.match(/\/servicios\/(\d+)/)?.[1];
            if (id) {
                const service = MOCK_SERVICES.find(s => s.id === parseInt(id));
                return { data: service || null };
            }
        }
        
        return { data: [] };
    }

    if (!baseUrl || !staticToken) {
        throw new Error('Configuración de Directus incompleta en .env');
    }

    const url = new URL(path, baseUrl);
    const response = await fetch(url.toString(), {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${staticToken}`,
        }
    });

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    return response.json();
}