/**
 * Performance Optimization System for UM Terminal CLI
 * Features: Lazy loading, caching, virtual scrolling, error boundaries
 * Version: 1.0.0
 */

class PerformanceOptimizer {
    constructor(terminal) {
        this.terminal = terminal;
        this.cache = new Map();
        this.virtualScrollEnabled = true;
        this.lazyLoadThreshold = 100; // lines
        this.maxCacheSize = 50; // MB
        this.observer = null;
        this.performanceMetrics = {
            commandExecutionTime: [],
            renderTime: [],
            memoryUsage: [],
            cacheHitRate: 0,
            totalCommands: 0,
            cacheHits: 0
        };
        
        this.init();
    }

    async init() {
        try {
            this.setupVirtualScrolling();
            this.setupLazyLoading();
            this.setupCaching();
            this.setupErrorBoundaries();
            this.setupPerformanceMonitoring();
            this.setupOfflineMode();
            console.log('✓ Performance Optimizer initialized successfully');
        } catch (error) {
            console.warn('Performance Optimizer initialization failed:', error);
        }
    }

    // VIRTUAL SCROLLING SYSTEM
    setupVirtualScrolling() {
        if (!this.virtualScrollEnabled) return;

        this.virtualScroller = {
            containerHeight: 0,
            itemHeight: 24, // approx line height
            visibleItems: 0,
            startIndex: 0,
            endIndex: 0,
            totalItems: 0,
            buffer: 5 // extra items to render
        };

        // Create virtual scroll container
        this.createVirtualScrollContainer();
        
        // Setup scroll listener
        this.setupScrollListener();
    }

    createVirtualScrollContainer() {
        const output = this.terminal.output;
        if (!output) return;

        // Wrap existing content in virtual container
        const virtualContainer = document.createElement('div');
        virtualContainer.className = 'virtual-scroll-container';
        virtualContainer.style.position = 'relative';
        virtualContainer.style.overflow = 'hidden';

        const viewport = document.createElement('div');
        viewport.className = 'virtual-scroll-viewport';
        viewport.style.position = 'absolute';
        viewport.style.top = '0';
        viewport.style.left = '0';
        viewport.style.right = '0';

        // Move existing content to viewport
        while (output.firstChild) {
            viewport.appendChild(output.firstChild);
        }

        virtualContainer.appendChild(viewport);
        output.appendChild(virtualContainer);

        this.virtualContainer = virtualContainer;
        this.virtualViewport = viewport;
    }

    setupScrollListener() {
        if (!this.terminal.output) return;

        const scrollContainer = this.terminal.output;
        
        this.scrollHandler = this.throttle((e) => {
            this.updateVirtualScroll();
        }, 16); // 60fps

        scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    updateVirtualScroll() {
        if (!this.virtualContainer) return;

        const scrollTop = this.terminal.output.scrollTop;
        const containerHeight = this.terminal.output.clientHeight;
        
        this.virtualScroller.containerHeight = containerHeight;
        this.virtualScroller.visibleItems = Math.ceil(containerHeight / this.virtualScroller.itemHeight);
        
        const startIndex = Math.floor(scrollTop / this.virtualScroller.itemHeight);
        const endIndex = Math.min(
            startIndex + this.virtualScroller.visibleItems + this.virtualScroller.buffer * 2,
            this.virtualScroller.totalItems
        );

        this.virtualScroller.startIndex = Math.max(0, startIndex - this.virtualScroller.buffer);
        this.virtualScroller.endIndex = endIndex;

        this.renderVisibleItems();
    }

    renderVisibleItems() {
        // This would be implemented based on the actual terminal output structure
        // For now, we'll implement a basic version
        const allLines = this.virtualViewport.children;
        
        for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i];
            if (i >= this.virtualScroller.startIndex && i <= this.virtualScroller.endIndex) {
                line.style.display = 'block';
            } else {
                line.style.display = 'none';
            }
        }
    }

    // LAZY LOADING SYSTEM
    setupLazyLoading() {
        this.lazyLoader = {
            queue: [],
            loading: false,
            batchSize: 10
        };

        // Setup intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    root: this.terminal.output,
                    rootMargin: '100px',
                    threshold: 0.1
                }
            );
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadLazyContent(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    async loadLazyContent(element) {
        const dataUrl = element.dataset.lazyUrl;
        const dataType = element.dataset.lazyType;
        
        if (!dataUrl || !dataType) return;

        try {
            const cachedData = this.getFromCache(dataUrl);
            if (cachedData) {
                this.renderLazyContent(element, cachedData, dataType);
                return;
            }

            // Show loading placeholder
            element.innerHTML = this.createLoadingPlaceholder(dataType);

            // Fetch data
            const data = await this.fetchWithTimeout(dataUrl, 5000);
            
            // Cache the result
            this.setCache(dataUrl, data);
            
            // Render content
            this.renderLazyContent(element, data, dataType);
            
        } catch (error) {
            console.error('Error loading lazy content:', error);
            element.innerHTML = this.createErrorPlaceholder(error.message);
        }
    }

    renderLazyContent(element, data, type) {
        switch (type) {
            case 'servicios':
                element.innerHTML = this.formatServiciosData(data);
                break;
            case 'antecedentes':
                element.innerHTML = this.formatAntecedentesData(data);
                break;
            case 'stats':
                element.innerHTML = this.formatStatsData(data);
                break;
            default:
                element.innerHTML = JSON.stringify(data, null, 2);
        }
    }

    createLoadingPlaceholder(type) {
        return `
            <div class="lazy-loading-placeholder">
                <div class="placeholder-spinner"></div>
                <div class="placeholder-text">Cargando ${type}...</div>
            </div>
        `;
    }

    createErrorPlaceholder(message) {
        return `
            <div class="lazy-error-placeholder">
                <div class="error-icon">⚠️</div>
                <div class="error-message">Error: ${message}</div>
                <button class="retry-btn" onclick="this.parentElement.parentElement.click()">
                    Reintentar
                </button>
            </div>
        `;
    }

    // CACHING SYSTEM
    setupCaching() {
        this.cacheConfig = {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: this.maxCacheSize * 1024 * 1024, // Convert to bytes
            compressionEnabled: true
        };

        // Setup cache cleanup interval
        setInterval(() => {
            this.cleanupCache();
        }, 60000); // Every minute

        // Setup cache persistence
        this.loadCacheFromStorage();
    }

    setCache(key, data, ttl = this.cacheConfig.defaultTTL) {
        try {
            const item = {
                data: this.cacheConfig.compressionEnabled ? this.compressData(data) : data,
                timestamp: Date.now(),
                ttl: ttl,
                size: JSON.stringify(data).length,
                compressed: this.cacheConfig.compressionEnabled
            };

            this.cache.set(key, item);
            this.performanceMetrics.cacheHits++;
            
            // Check cache size and cleanup if necessary
            if (this.getCacheSize() > this.cacheConfig.maxSize) {
                this.evictOldestItems();
            }

            // Persist to localStorage
            this.saveCacheToStorage(key, item);
            
        } catch (error) {
            console.warn('Failed to set cache:', error);
        }
    }

    getFromCache(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.removeCacheFromStorage(key);
            return null;
        }

        this.performanceMetrics.cacheHits++;
        this.updateCacheHitRate();

        // Decompress if necessary
        return item.compressed ? this.decompressData(item.data) : item.data;
    }

    compressData(data) {
        // Simple compression using JSON string replacement
        const jsonString = JSON.stringify(data);
        return jsonString
            .replace(/{"id":/g, '{i:')
            .replace(/,"title":/g, ',t:')
            .replace(/,"description":/g, ',d:')
            .replace(/,"date":/g, ',dt:')
            .replace(/,"client":/g, ',c:')
            .replace(/null/g, 'n')
            .replace(/true/g, 't')
            .replace(/false/g, 'f');
    }

    decompressData(compressedData) {
        try {
            const decompressed = compressedData
                .replace(/{i:/g, '{"id":')
                .replace(/,t:/g, ',"title":')
                .replace(/,d:/g, ',"description":')
                .replace(/,dt:/g, ',"date":')
                .replace(/,c:/g, ',"client":')
                .replace(/n/g, 'null')
                .replace(/\bt\b/g, 'true')
                .replace(/\bf\b/g, 'false');
                
            return JSON.parse(decompressed);
        } catch (error) {
            console.warn('Failed to decompress data:', error);
            return compressedData;
        }
    }

    getCacheSize() {
        let totalSize = 0;
        this.cache.forEach(item => {
            totalSize += item.size;
        });
        return totalSize;
    }

    evictOldestItems() {
        const sortedEntries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest 20% of items
        const itemsToRemove = Math.ceil(sortedEntries.length * 0.2);
        
        for (let i = 0; i < itemsToRemove; i++) {
            const [key] = sortedEntries[i];
            this.cache.delete(key);
            this.removeCacheFromStorage(key);
        }
    }

    cleanupCache() {
        const now = Date.now();
        const keysToDelete = [];

        this.cache.forEach((item, key) => {
            if (now - item.timestamp > item.ttl) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.removeCacheFromStorage(key);
        });
    }

    // CACHE PERSISTENCE
    loadCacheFromStorage() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith('um-cache-')
            );

            keys.forEach(key => {
                const item = JSON.parse(localStorage.getItem(key));
                const cacheKey = key.replace('um-cache-', '');
                
                // Check if item is still valid
                if (Date.now() - item.timestamp <= item.ttl) {
                    this.cache.set(cacheKey, item);
                } else {
                    localStorage.removeItem(key);
                }
            });
            
        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
        }
    }

    saveCacheToStorage(key, item) {
        try {
            // Only persist if item is not too large
            if (item.size < 100000) { // 100KB limit for localStorage
                localStorage.setItem(`um-cache-${key}`, JSON.stringify(item));
            }
        } catch (error) {
            console.warn('Failed to save cache to storage:', error);
        }
    }

    removeCacheFromStorage(key) {
        try {
            localStorage.removeItem(`um-cache-${key}`);
        } catch (error) {
            console.warn('Failed to remove cache from storage:', error);
        }
    }

    // ERROR BOUNDARIES
    setupErrorBoundaries() {
        this.errorBoundary = {
            errors: [],
            maxErrors: 10,
            recoveryStrategies: new Map()
        };

        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

        // Setup recovery strategies
        this.registerRecoveryStrategies();
    }

    handleGlobalError(event) {
        const error = {
            type: 'javascript',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: Date.now()
        };

        this.recordError(error);
        this.attemptRecovery(error);
    }

    handlePromiseRejection(event) {
        const error = {
            type: 'promise',
            message: event.reason?.message || 'Unhandled promise rejection',
            stack: event.reason?.stack,
            timestamp: Date.now()
        };

        this.recordError(error);
        this.attemptRecovery(error);
    }

    recordError(error) {
        this.errorBoundary.errors.push(error);
        
        // Keep only the most recent errors
        if (this.errorBoundary.errors.length > this.errorBoundary.maxErrors) {
            this.errorBoundary.errors.shift();
        }

        // Log to console in development
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.error('Error recorded by Performance Optimizer:', error);
        }
    }

    attemptRecovery(error) {
        // Try to find a recovery strategy
        const strategy = this.findRecoveryStrategy(error);
        
        if (strategy) {
            try {
                strategy.recover(error);
                console.log('Successfully recovered from error:', error.message);
            } catch (recoveryError) {
                console.error('Recovery strategy failed:', recoveryError);
                this.fallbackRecovery(error);
            }
        } else {
            this.fallbackRecovery(error);
        }
    }

    registerRecoveryStrategies() {
        // Network error recovery
        this.errorBoundary.recoveryStrategies.set('network', {
            test: (error) => error.message.includes('fetch') || error.message.includes('network'),
            recover: (error) => {
                this.enableOfflineMode();
                this.terminal.addOutput('⚠️ Modo offline activado debido a problemas de conexión', 'warning');
            }
        });

        // Memory error recovery
        this.errorBoundary.recoveryStrategies.set('memory', {
            test: (error) => error.message.includes('memory') || error.message.includes('heap'),
            recover: (error) => {
                this.clearCache();
                this.cleanupVirtualScroll();
                this.terminal.addOutput('🧹 Memoria optimizada automáticamente', 'info');
            }
        });

        // Terminal state recovery
        this.errorBoundary.recoveryStrategies.set('terminal', {
            test: (error) => error.message.includes('terminal') || error.message.includes('input'),
            recover: (error) => {
                this.resetTerminalState();
                this.terminal.addOutput('🔄 Estado del terminal restaurado', 'info');
            }
        });
    }

    findRecoveryStrategy(error) {
        for (const [name, strategy] of this.errorBoundary.recoveryStrategies) {
            if (strategy.test(error)) {
                return strategy;
            }
        }
        return null;
    }

    fallbackRecovery(error) {
        // Last resort recovery
        try {
            // Clear any potentially corrupted state
            this.clearCache();
            
            // Show user-friendly error message
            if (this.terminal && this.terminal.addOutput) {
                this.terminal.addOutput(
                    `⚠️ Se produjo un error inesperado. El sistema se ha recuperado automáticamente.`,
                    'warning'
                );
            }
            
        } catch (fallbackError) {
            console.error('Fallback recovery failed:', fallbackError);
            // If even fallback fails, reload the page as last resort
            if (confirm('Se produjo un error crítico. ¿Desea recargar la página?')) {
                window.location.reload();
            }
        }
    }

    // PERFORMANCE MONITORING
    setupPerformanceMonitoring() {
        this.performanceMonitor = {
            startTime: performance.now(),
            entries: [],
            observers: []
        };

        // Setup performance observers
        if ('PerformanceObserver' in window) {
            this.setupPerformanceObservers();
        }

        // Setup memory monitoring
        this.startMemoryMonitoring();

        // Setup FPS monitoring
        this.startFPSMonitoring();
    }

    setupPerformanceObservers() {
        try {
            // Long task observer
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn('Long task detected:', entry.duration + 'ms');
                    }
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });

            // Layout shift observer
            const layoutShiftObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput && entry.value > 0.1) {
                        console.warn('Layout shift detected:', entry.value);
                    }
                }
            });
            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
            console.warn('Performance observers setup failed:', error);
        }
    }

    startMemoryMonitoring() {
        if ('memory' in performance) {
            this.memoryMonitorInterval = setInterval(() => {
                const memory = performance.memory;
                this.performanceMetrics.memoryUsage.push({
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                // Keep only last 100 measurements
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage.shift();
                }

                // Check for memory pressure
                const usagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                if (usagePercentage > 0.9) {
                    console.warn('High memory usage detected:', usagePercentage * 100 + '%');
                    this.handleMemoryPressure();
                }
            }, 10000); // Every 10 seconds
        }
    }

    startFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;

        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn('Low FPS detected:', fps);
                }

                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    handleMemoryPressure() {
        // Clear cache
        this.clearCache();
        
        // Cleanup virtual scroll
        this.cleanupVirtualScroll();
        
        // Trigger garbage collection if available
        if ('gc' in window) {
            window.gc();
        }
        
        // Notify user if memory is critically low
        if (this.terminal && this.terminal.addOutput) {
            this.terminal.addOutput('🧹 Optimización de memoria realizada automáticamente', 'info');
        }
    }

    // OFFLINE MODE
    setupOfflineMode() {
        this.offlineMode = {
            enabled: false,
            data: new Map(),
            strategies: new Map()
        };

        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // Setup offline strategies
        this.registerOfflineStrategies();
    }

    handleOnline() {
        if (this.offlineMode.enabled) {
            this.offlineMode.enabled = false;
            if (this.terminal && this.terminal.addOutput) {
                this.terminal.addOutput('🌐 Conexión restaurada. Modo online activado.', 'success');
            }
        }
    }

    handleOffline() {
        this.enableOfflineMode();
    }

    enableOfflineMode() {
        this.offlineMode.enabled = true;
        if (this.terminal && this.terminal.addOutput) {
            this.terminal.addOutput('📱 Modo offline activado. Funcionalidad limitada disponible.', 'info');
        }
    }

    registerOfflineStrategies() {
        // Service worker strategy
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.warn('Service Worker registration failed:', error);
                });
        }
    }

    // UTILITY METHODS
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal
            });
            clearTimeout(id);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    updateCacheHitRate() {
        this.performanceMetrics.totalCommands++;
        this.performanceMetrics.cacheHitRate = 
            (this.performanceMetrics.cacheHits / this.performanceMetrics.totalCommands) * 100;
    }

    // CLEANUP METHODS
    clearCache() {
        this.cache.clear();
        
        // Clear localStorage cache
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith('um-cache-')
        );
        keys.forEach(key => localStorage.removeItem(key));
    }

    cleanupVirtualScroll() {
        if (this.virtualContainer) {
            // Reset virtual scroll state
            this.virtualScroller.startIndex = 0;
            this.virtualScroller.endIndex = 0;
            this.updateVirtualScroll();
        }
    }

    resetTerminalState() {
        try {
            if (this.terminal) {
                // Focus input
                if (this.terminal.focusInput) {
                    this.terminal.focusInput();
                }
                
                // Clear any pending operations
                if (this.terminal.clearPendingOperations) {
                    this.terminal.clearPendingOperations();
                }
            }
        } catch (error) {
            console.warn('Failed to reset terminal state:', error);
        }
    }

    // PERFORMANCE METRICS
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            cacheSizeBytes: this.getCacheSize(),
            uptime: performance.now() - this.performanceMonitor.startTime,
            offlineMode: this.offlineMode.enabled
        };
    }

    // CLEANUP
    cleanup() {
        // Clear intervals
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
        }

        // Remove event listeners
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);

        if (this.terminal.output && this.scrollHandler) {
            this.terminal.output.removeEventListener('scroll', this.scrollHandler);
        }

        // Disconnect observers
        if (this.observer) {
            this.observer.disconnect();
        }

        this.performanceMonitor.observers.forEach(observer => {
            observer.disconnect();
        });

        // Clear cache
        this.clearCache();
    }
}

// Export for use in terminal
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}
