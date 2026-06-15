/**
 * Advanced UI/UX Effects System for UM CLI
 * Features: Typing animations, syntax highlighting, themes, sound effects
 * Version: 1.0.0
 */

class UIEffectsSystem {
    constructor(terminal) {
        this.terminal = terminal;
        this.isInitialized = false;
        
        // Animation settings
        this.typingSpeed = 30; // ms per character
        this.enableSyntaxHighlighting = true;
        this.enableSoundEffects = false;
        this.currentTheme = 'professional';
        
        // Available themes
        this.themes = {
            professional: {
                name: 'Professional',
                background: '#111111',
                primary: '#DC2626',
                secondary: '#ffffff',
                accent: '#dddddd',
                text: '#f5f5f5',
                border: 'rgba(220, 38, 38, 0.32)',
                glow: 'rgba(220, 38, 38, 0.36)'
            },
            matrix: {
                name: 'Modo datos',
                background: '#050505',
                primary: '#DC2626',
                secondary: '#ffffff',
                accent: '#dddddd',
                text: '#f5f5f5',
                border: 'rgba(220, 38, 38, 0.42)',
                glow: 'rgba(220, 38, 38, 0.36)'
            },
            retro: {
                name: 'Archivo',
                background: '#18181b',
                primary: '#DC2626',
                secondary: '#f5f5f5',
                accent: '#dddddd',
                text: '#ffffff',
                border: 'rgba(220, 38, 38, 0.38)',
                glow: 'rgba(220, 38, 38, 0.34)'
            },
            hacker: {
                name: 'Diagnostico',
                background: '#050505',
                primary: '#DC2626',
                secondary: '#ffffff',
                accent: '#dddddd',
                text: '#ffffff',
                border: 'rgba(220, 38, 38, 0.42)',
                glow: 'rgba(220, 38, 38, 0.36)'
            }
        };
        
        // Sound effects
        this.sounds = {
            keypress: null,
            success: null,
            error: null,
            notification: null
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadSoundEffects();
            this.setupThemeSystem();
            this.setupAnimationSystem();
            this.isInitialized = true;
            console.log('✓ UI Effects System initialized successfully');
        } catch (error) {
            console.warn('UI Effects System initialization failed:', error);
        }
    }

    // TYPING ANIMATIONS SYSTEM
    async typeText(element, text, options = {}) {
        const {
            speed = this.typingSpeed,
            startDelay = 0,
            pauseOnPunctuation = true,
            cursor = true,
            onComplete = null,
            className = ''
        } = options;

        return new Promise(resolve => {
            setTimeout(async () => {
                if (cursor) {
                    element.classList.add('typing-cursor');
                }
                
                let currentText = '';
                let i = 0;
                
                const typeInterval = setInterval(() => {
                    if (i < text.length) {
                        const char = text.charAt(i);
                        currentText += char;
                        element.innerHTML = this.applySyntaxHighlighting(currentText, className);
                        
                        // Play keypress sound
                        if (this.enableSoundEffects && Math.random() < 0.3) {
                            this.playSound('keypress');
                        }
                        
                        i++;
                        
                        // Pause on punctuation for more natural typing
                        if (pauseOnPunctuation && /[.!?,:;]/.test(char)) {
                            clearInterval(typeInterval);
                            setTimeout(() => {
                                const newInterval = setInterval(() => {
                                    if (i < text.length) {
                                        const newChar = text.charAt(i);
                                        currentText += newChar;
                                        element.innerHTML = this.applySyntaxHighlighting(currentText, className);
                                        i++;
                                    } else {
                                        clearInterval(newInterval);
                                        if (cursor) {
                                            element.classList.remove('typing-cursor');
                                        }
                                        if (onComplete) onComplete();
                                        resolve();
                                    }
                                }, speed);
                            }, speed * 2);
                            return;
                        }
                    } else {
                        clearInterval(typeInterval);
                        if (cursor) {
                            element.classList.remove('typing-cursor');
                        }
                        if (onComplete) onComplete();
                        resolve();
                    }
                }, speed);
            }, startDelay);
        });
    }

    // SYNTAX HIGHLIGHTING SYSTEM
    applySyntaxHighlighting(text, context = '') {
        if (!this.enableSyntaxHighlighting) return text;

        let highlightedText = text;

        // Command highlighting
        highlightedText = highlightedText.replace(
            /\b(help|clear|ls|cd|pwd|whoami|date|echo|history|contacto|servicios|antecedentes|stats|explore|filter|details|navigate|back|export|form-data|theme|fullscreen|sudo)\b/g,
            '<span class="syntax-command">$1</span>'
        );

        // Options/flags highlighting
        highlightedText = highlightedText.replace(
            /(--?\w+)/g,
            '<span class="syntax-option">$1</span>'
        );

        // Numbers highlighting
        highlightedText = highlightedText.replace(
            /\b(\d+)\b/g,
            '<span class="syntax-number">$1</span>'
        );

        // Strings highlighting
        highlightedText = highlightedText.replace(
            /(['"])(.*?)\1/g,
            '<span class="syntax-string">$1$2$1</span>'
        );

        // Email highlighting
        highlightedText = highlightedText.replace(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            '<span class="syntax-email">$1</span>'
        );

        // URL highlighting
        highlightedText = highlightedText.replace(
            /(https?:\/\/[^\s]+)/g,
            '<span class="syntax-url">$1</span>'
        );

        // File paths highlighting
        highlightedText = highlightedText.replace(
            /(\/[\w\-\.\/]*)/g,
            '<span class="syntax-path">$1</span>'
        );

        return highlightedText;
    }

    // VISUAL FEEDBACK SYSTEM
    showCommandFeedback(type, message = '') {
        const feedback = document.createElement('div');
        feedback.className = `command-feedback command-feedback-${type}`;
        
        const icon = this.getFeedbackIcon(type);
        feedback.innerHTML = `<span class="feedback-icon">${icon}</span><span class="feedback-message">${message}</span>`;
        
        // Position feedback near cursor
        const terminalBody = this.terminal.output;
        terminalBody.appendChild(feedback);
        
        // Animate in
        setTimeout(() => feedback.classList.add('show'), 10);
        
        // Play sound
        if (this.enableSoundEffects) {
            this.playSound(type === 'success' ? 'success' : type === 'error' ? 'error' : 'notification');
        }
        
        // Auto remove
        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }

    getFeedbackIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳',
            progress: '🔄'
        };
        return icons[type] || 'ℹ️';
    }

    // LOADING STATES SYSTEM
    createLoadingIndicator(options = {}) {
        const {
            type = 'spinner',
            message = 'Procesando...',
            progress = null,
            animated = true
        } = options;

        const loader = document.createElement('div');
        loader.className = `loading-indicator loading-${type}`;
        
        let loaderContent = '';
        
        switch (type) {
            case 'spinner':
                loaderContent = `
                    <div class="spinner">
                        <div class="spinner-circle"></div>
                    </div>
                    <div class="loading-message">${message}</div>
                `;
                break;
                
            case 'dots':
                loaderContent = `
                    <div class="dots-loader">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="loading-message">${message}</div>
                `;
                break;
                
            case 'progress':
                loaderContent = `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress || 0}%"></div>
                    </div>
                    <div class="loading-message">${message} ${progress ? `(${progress}%)` : ''}</div>
                `;
                break;
                
            case 'matrix':
                loaderContent = `
                    <div class="matrix-loader" aria-label="Modo datos">
                        <span>|</span><span>/</span><span>-</span><span>\\</span>
                    </div>
                    <div class="loading-message">${message}</div>
                `;
                break;
        }
        
        loader.innerHTML = loaderContent;
        
        if (animated) {
            setTimeout(() => loader.classList.add('show'), 10);
        }
        
        return loader;
    }

    updateLoadingProgress(loader, progress, message = null) {
        const progressBar = loader.querySelector('.progress-fill');
        const messageEl = loader.querySelector('.loading-message');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (message && messageEl) {
            messageEl.textContent = `${message} (${progress}%)`;
        }
    }

    removeLoadingIndicator(loader) {
        if (loader && loader.parentNode) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }

    // THEME SYSTEM
    switchTheme(themeName) {
        const aliases = {
            datos: 'matrix',
            archivo: 'retro',
            diagnostico: 'hacker'
        };
        themeName = aliases[themeName] || themeName;

        if (!this.themes[themeName]) {
            console.warn(`Theme ${themeName} not found`);
            return false;
        }

        this.currentTheme = themeName;
        const theme = this.themes[themeName];
        
        // Apply theme to terminal
        const terminal = document.getElementById('um-terminal-enhanced');
        if (terminal) {
            // Update CSS variables
            const root = document.documentElement;
            root.style.setProperty('--terminal-bg', theme.background);
            root.style.setProperty('--terminal-primary', theme.primary);
            root.style.setProperty('--terminal-secondary', theme.secondary);
            root.style.setProperty('--terminal-accent', theme.accent);
            root.style.setProperty('--terminal-text', theme.text);
            root.style.setProperty('--terminal-border', theme.border);
            root.style.setProperty('--terminal-glow', theme.glow);
            
            // Add theme class
            terminal.className = terminal.className.replace(/theme-\w+/g, '');
            terminal.classList.add(`theme-${themeName}`);
            
            // Special effects for certain themes
            this.applyThemeEffects(themeName);
        }

        // Save preference
        localStorage.setItem('um-terminal-theme', themeName);
        
        return true;
    }

    applyThemeEffects(themeName) {
        const terminal = document.getElementById('um-terminal-enhanced');
        if (!terminal) return;

        // Remove existing effect classes
        terminal.classList.remove('matrix-rain', 'retro-scanlines', 'hacker-glitch');

        switch (themeName) {
            case 'matrix':
                terminal.classList.add('matrix-rain');
                this.startMatrixRain();
                break;
                
            case 'retro':
                terminal.classList.add('retro-scanlines');
                break;
                
            case 'hacker':
                terminal.classList.add('hacker-glitch');
                this.startDiagnosticsSignal();
                break;
        }
    }

    // SPECIAL THEME EFFECTS
    startMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        canvas.style.opacity = '0.1';

        const terminal = document.getElementById('um-terminal-enhanced');
        if (terminal) {
            terminal.style.position = 'relative';
            terminal.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            canvas.width = terminal.offsetWidth;
            canvas.height = terminal.offsetHeight;

            const signal = '01UMSAREDESSERVICIOSDATOS';
            const drops = [];
            const columns = canvas.width / 16;

            for (let i = 0; i < columns; i++) {
                drops[i] = 1;
            }

            const draw = () => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#DC2626';
                ctx.font = '16px Open Sans, Arial, system-ui, sans-serif';

                for (let i = 0; i < drops.length; i++) {
                    const text = signal[Math.floor(Math.random() * signal.length)];
                    ctx.fillText(text, i * 16, drops[i] * 16);

                    if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            };

            const matrixInterval = setInterval(draw, 35);
            
            // Store interval for cleanup
            terminal.dataset.matrixInterval = matrixInterval;
        }
    }

    startDiagnosticsSignal() {
        const terminal = document.getElementById('um-terminal-enhanced');
        if (!terminal) return;

        const diagnostics = () => {
            if (Math.random() < 0.08) {
                terminal.style.filter = 'contrast(1.04)';
                terminal.style.transform = 'translateY(-1px)';
                
                setTimeout(() => {
                    terminal.style.filter = '';
                    terminal.style.transform = '';
                }, 120);
            }
        };

        const glitchInterval = setInterval(diagnostics, 700);
        terminal.dataset.glitchInterval = glitchInterval;
    }

    // SOUND EFFECTS SYSTEM
    async loadSoundEffects() {
        if (!this.enableSoundEffects) return;

        try {
            // Create simple beep sounds using Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.sounds = {
                keypress: () => this.createBeep(800, 50),
                success: () => this.createBeep(1000, 200),
                error: () => this.createBeep(400, 300),
                notification: () => this.createBeep(600, 150)
            };
            
        } catch (error) {
            console.warn('Sound effects not available:', error);
            this.enableSoundEffects = false;
        }
    }

    createBeep(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }

    playSound(type) {
        if (!this.enableSoundEffects || !this.sounds[type]) return;
        
        try {
            if (typeof this.sounds[type] === 'function') {
                this.sounds[type]();
            }
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    // COMMAND SUGGESTIONS ENHANCEMENT
    enhanceAutocomplete(input, suggestions = []) {
        const suggestionsContainer = document.getElementById('input-suggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.classList.remove('visible');
            return;
        }

        // Create enhanced suggestions HTML
        const suggestionsHTML = suggestions.slice(0, 5).map((suggestion, index) => {
            const isActive = index === 0;
            return `
                <div class="suggestion-item ${isActive ? 'active' : ''}" data-suggestion="${suggestion}">
                    <span class="suggestion-icon">⚡</span>
                    <span class="suggestion-text">${this.highlightMatch(suggestion, input)}</span>
                    <span class="suggestion-shortcut">Tab</span>
                </div>
            `;
        }).join('');

        suggestionsContainer.innerHTML = `
            <div class="suggestions-header">
                <span class="suggestions-title">💡 Sugerencias</span>
                <span class="suggestions-count">${suggestions.length}</span>
            </div>
            <div class="suggestions-list">
                ${suggestionsHTML}
            </div>
        `;

        suggestionsContainer.classList.add('visible');

        // Add click handlers
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                if (this.terminal.input) {
                    this.terminal.input.value = suggestion;
                    this.terminal.focusInput();
                    suggestionsContainer.classList.remove('visible');
                }
            });
        });
    }

    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // ANIMATION UTILITIES
    animateElement(element, animation, options = {}) {
        const {
            duration = 500,
            easing = 'ease-in-out',
            fill = 'forwards',
            onComplete = null
        } = options;

        element.style.animation = `${animation} ${duration}ms ${easing} ${fill}`;
        
        if (onComplete) {
            element.addEventListener('animationend', onComplete, { once: true });
        }
    }

    // FULLSCREEN MODE ENHANCEMENT
    enhanceFullscreenMode() {
        const terminal = document.getElementById('um-terminal-enhanced-container');
        if (!terminal) return;

        if (terminal.classList.contains('fullscreen')) {
            // Add fullscreen enhancements
            terminal.classList.add('fullscreen-enhanced');
            
            // Add ESC key listener
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.terminal.toggleFullscreen();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            
            // Show fullscreen controls
            this.showFullscreenControls();
        } else {
            terminal.classList.remove('fullscreen-enhanced');
            this.hideFullscreenControls();
        }
    }

    showFullscreenControls() {
        const controls = document.createElement('div');
        controls.id = 'fullscreen-controls';
        controls.innerHTML = `
            <div class="fullscreen-control-item" data-action="theme">
                <span class="control-icon">🎨</span>
                <span class="control-label">Tema</span>
            </div>
            <div class="fullscreen-control-item" data-action="sound">
                <span class="control-icon">${this.enableSoundEffects ? '🔊' : '🔇'}</span>
                <span class="control-label">Sonido</span>
            </div>
            <div class="fullscreen-control-item" data-action="exit">
                <span class="control-icon">⛶</span>
                <span class="control-label">ESC</span>
            </div>
        `;

        document.body.appendChild(controls);

        // Add event handlers
        controls.addEventListener('click', (e) => {
            const item = e.target.closest('.fullscreen-control-item');
            if (!item) return;

            const action = item.dataset.action;
            switch (action) {
                case 'theme':
                    this.cycleTheme();
                    break;
                case 'sound':
                    this.toggleSound();
                    break;
                case 'exit':
                    this.terminal.toggleFullscreen();
                    break;
            }
        });
    }

    hideFullscreenControls() {
        const controls = document.getElementById('fullscreen-controls');
        if (controls) {
            controls.remove();
        }
    }

    // UTILITY METHODS
    cycleTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];
        
        this.switchTheme(nextTheme);
        this.showCommandFeedback('success', `Tema cambiado a: ${this.themes[nextTheme].name}`);
    }

    toggleSound() {
        this.enableSoundEffects = !this.enableSoundEffects;
        const icon = this.enableSoundEffects ? '🔊' : '🔇';
        const message = this.enableSoundEffects ? 'Sonido activado' : 'Sonido desactivado';
        
        // Update fullscreen controls if visible
        const soundControl = document.querySelector('[data-action="sound"] .control-icon');
        if (soundControl) {
            soundControl.textContent = icon;
        }
        
        this.showCommandFeedback('info', message);
        
        // Save preference
        localStorage.setItem('um-terminal-sound', this.enableSoundEffects);
    }

    setupThemeSystem() {
        // Load saved theme
        const savedTheme = localStorage.getItem('um-terminal-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.switchTheme(savedTheme);
        }

        // Load sound preference
        const savedSound = localStorage.getItem('um-terminal-sound');
        if (savedSound !== null) {
            this.enableSoundEffects = savedSound === 'true';
        }
    }

    setupAnimationSystem() {
        // Add typing cursor styles
        const style = document.createElement('style');
        style.textContent = `
            .typing-cursor::after {
                content: '█';
                color: var(--terminal-primary, #DC2626);
                animation: typing-blink 1s infinite;
                text-shadow: 0 0 8px var(--terminal-glow, rgba(220, 38, 38, 0.36));
            }
            
            @keyframes typing-blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // CLEANUP
    cleanup() {
        // Clear intervals
        const terminal = document.getElementById('um-terminal-enhanced');
        if (terminal) {
            const matrixInterval = terminal.dataset.matrixInterval;
            if (matrixInterval) {
                clearInterval(parseInt(matrixInterval));
                delete terminal.dataset.matrixInterval;
            }
            
            const glitchInterval = terminal.dataset.glitchInterval;
            if (glitchInterval) {
                clearInterval(parseInt(glitchInterval));
                delete terminal.dataset.glitchInterval;
            }
            
            // Remove canvas
            const canvas = document.getElementById('matrix-rain-canvas');
            if (canvas) {
                canvas.remove();
            }
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in terminal
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEffectsSystem;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.UIEffectsSystem = UIEffectsSystem;
}
