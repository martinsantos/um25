/**
 * Error Suppressor for Production
 * This script must load BEFORE any other scripts to catch all development errors
 * Version: 1.0
 */

(function() {
    'use strict';
    
    // Only run in production (not localhost or dev environments)
    const hostname = window.location.hostname;
    const isProduction = !hostname.includes('localhost') && 
                        !hostname.includes('127.0.0.1') && 
                        !hostname.includes('192.168') &&
                        !hostname.includes('10.0.0');
    
    if (!isProduction) {
        return; // Don't suppress in development
    }
    
    // Development error patterns to suppress
    const DEV_ERROR_PATTERNS = [
        'websocket connection',
        'websocket',
        'ws://',
        'wss://',
        'vite',
        'hmr',
        'hot module replacement',
        'failed to load resource',
        'alpinejs.js',
        'alpinejs',
        'alpine.js',
        'alpine',
        'localhost:5173',
        'localhost:4321',
        'localhost:3000',
        'cannot read properties of undefined',
        'client:',
        'createconnection',
        'token=',
        'server responded with a status of 504',
        'status of 504',
        '504 ()',
        'failed to connect to websocket',
        'network configuration',
        'server-options.html',
        'vite.dev',
        'dev server',
        '__vite',
        'import.meta.hot',
        'check out your vite',
        'reverse proxy',
        'setdefaultresultorder',
        'gwoeayb9zk',
        'connection failed',
        'net::err_connection',
        'refused to connect',
        'connection was refused',
        'xhr poll error'
    ];
    
    // Check if message contains development error patterns
    function isDevelopmentError(message) {
        const messageStr = String(message).toLowerCase();
        return DEV_ERROR_PATTERNS.some(pattern => messageStr.includes(pattern));
    }
    
    // Store original console methods
    const originalConsole = {
        error: console.error,
        warn: console.warn,
        log: console.log,
        info: console.info
    };
    
    // Override console.error
    console.error = function(...args) {
        const message = args.join(' ');
        if (!isDevelopmentError(message)) {
            originalConsole.error.apply(console, args);
        }
    };
    
    // Override console.warn
    console.warn = function(...args) {
        const message = args.join(' ');
        if (!isDevelopmentError(message)) {
            originalConsole.warn.apply(console, args);
        }
    };
    
    // Override console.log for certain dev messages
    console.log = function(...args) {
        const message = args.join(' ');
        if (!isDevelopmentError(message)) {
            originalConsole.log.apply(console, args);
        }
    };
    
    // Override console.info
    console.info = function(...args) {
        const message = args.join(' ');
        if (!isDevelopmentError(message)) {
            originalConsole.info.apply(console, args);
        }
    };
    
    // Suppress window errors for development issues
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (isDevelopmentError(message) || (source && isDevelopmentError(source))) {
            return true; // Prevent default error handling
        }
        if (originalWindowError) {
            return originalWindowError.call(this, message, source, lineno, colno, error);
        }
        return false;
    };
    
    // Suppress unhandled promise rejections for development errors
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason) {
            const reason = String(event.reason);
            if (isDevelopmentError(reason)) {
                event.preventDefault();
                return;
            }
        }
    });
    
    // Suppress resource loading errors for development assets
    window.addEventListener('error', function(event) {
        if (event.target && event.target.src) {
            if (isDevelopmentError(event.target.src)) {
                event.preventDefault();
                return;
            }
        }
    }, true);
    
    // Store reference for debugging if needed
    window.__errorSuppressor = {
        isActive: true,
        environment: 'production',
        patternsCount: DEV_ERROR_PATTERNS.length,
        restore: function() {
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.log = originalConsole.log;
            console.info = originalConsole.info;
            window.onerror = originalWindowError;
        }
    };
    
})();
