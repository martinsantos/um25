interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class Cache {
    private static instance: Cache;
    private cache: Map<string, CacheItem<any>>;
    private defaultTTL: number = 3600000; // 1 hora en milisegundos

    private constructor() {
        this.cache = new Map();
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    public get<T>(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        const isExpired = Date.now() - item.timestamp > item.ttl;
        
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }
}

export const cacheInstance = Cache.getInstance();

// Función de ayuda para cachear resultados de funciones
export async function withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = cacheInstance.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    const result = await fn();
    cacheInstance.set(key, result, ttl);
    return result;
}
