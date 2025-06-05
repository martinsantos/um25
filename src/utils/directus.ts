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
    
    // Durante el build, si no hay token, usar datos mock
    if (import.meta.env.SSR && (!staticToken || !baseUrl)) {
        console.warn('Variables de entorno de Directus no configuradas, usando datos mock');
        return { token: 'mock-token' };
    }

    if (!staticToken) {
        throw new Error('Token estático VITE_DIRECTUS_TOKEN no configurado en .env');
    }

    if (!baseUrl) {
        throw new Error('VITE_DIRECTUS_URL no configurado en .env');
    }

    try {
        const response = await fetch(`${baseUrl}/users/me`, {
            headers: { 'Authorization': `Bearer ${staticToken}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Authentication failed:', response.status, errorText);
            throw new Error(`Token inválido o expirado (${response.status}): ${errorText}`);
        }
        
        return { token: staticToken };
    } catch (e) {
        console.error('Error de autenticación:', e);
        throw new Error(`Autenticación fallida: ${e.message}`);
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