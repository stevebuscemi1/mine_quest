// js/core/PlatformManager.js

import { CONTROLS, COLORS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class PlatformManager {
    constructor(game) {
        this.game = game;
        
        // Platform detection
        this.platform = this.detectPlatform();
        this.isMobile = this.isMobileDevice();
        this.isSteamDeck = this.isSteamDeckDevice();
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Display properties
        this.screen = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: this.getOrientation()
        };
        
        // Performance settings
        this.performance = {
            quality: 'high',
            targetFPS: 60,
            renderScale: 1.0,
            particleCount: 100,
            maxLights: 10,
            shadowQuality: 'high',
            textureQuality: 'high'
        };
        
        // Control schemes
        this.controlScheme = this.getDefaultControlScheme();
        this.customControls = new Map();
        
        // Touch controls
        this.touchControls = {
            active: false,
            dPad: null,
            actionButtons: null,
            gestures: new Map(),
            touchPoints: new Map()
        };
        
        // Gamepad support
        this.gamepads = new Map();
        this.gamepadDeadzone = 0.1;
        
        // Keyboard shortcuts
        this.keyboardShortcuts = new Map();
        
        // Accessibility
        this.accessibility = {
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            screenReader: false
        };
        
        // Steam Deck specific
        this.steamDeck = {
            controllerLayout: 'default',
            touchEnabled: true,
            performanceMode: 'balanced',
            gyroEnabled: false
        };
        
        // Initialize
        this.initialize();
    }
    
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        // Check for Steam Deck
        if (userAgent.includes('steam') || platform.includes('linux x86_64')) {
            // Additional check for Steam Deck specific characteristics
            if (window.screen.width === 1280 && window.screen.height === 800) {
                return 'steamdeck';
            }
        }
        
        // Check for mobile devices
        if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return 'mobile';
        }
        
        // Check for tablet
        if (/ipad|tablet|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        
        // Default to desktop
        return 'desktop';
    }
    
    isMobileDevice() {
        return this.platform === 'mobile' || this.platform === 'tablet';
    }
    
    isSteamDeckDevice() {
        return this.platform === 'steamdeck';
    }
    
    getOrientation() {
        if (window.screen.orientation) {
            return window.screen.orientation.angle;
        }
        return window.innerWidth > window.innerHeight ? 0 : 90;
    }
    
    getDefaultControlScheme() {
        switch (this.platform) {
            case 'mobile':
            case 'tablet':
                return 'touch';
            case 'steamdeck':
                return 'gamepad';
            default:
                return 'keyboard';
        }
    }
    
    initialize() {
        // Set up platform-specific optimizations
        this.setupPerformanceSettings();
        this.setupControls();
        this.setupDisplay();
        this.setupEventListeners();
        this.setupAccessibility();
        
        // Apply platform-specific settings
        this.applyPlatformSettings();
        
        console.log(`Platform detected: ${this.platform}`);
        console.log(`Control scheme: ${this.controlScheme}`);
    }
    
    setupPerformanceSettings() {
        switch (this.platform) {
            case 'mobile':
                this.performance.quality = 'medium';
                this.performance.targetFPS = 30;
                this.performance.renderScale = 0.75;
                this.performance.particleCount = 50;
                this.performance.maxLights = 5;
                this.performance.shadowQuality = 'low';
                this.performance.textureQuality = 'medium';
                break;
                
            case 'tablet':
                this.performance.quality = 'high';
                this.performance.targetFPS = 60;
                this.performance.renderScale = 0.9;
                this.performance.particleCount = 75;
                this.performance.maxLights = 8;
                this.performance.shadowQuality = 'medium';
                this.performance.textureQuality = 'high';
                break;
                
            case 'steamdeck':
                this.performance.quality = 'high';
                this.performance.targetFPS = 60;
                this.performance.renderScale = 1.0;
                this.performance.particleCount = 100;
                this.performance.maxLights = 10;
                this.performance.shadowQuality = 'high';
                this.performance.textureQuality = 'high';
                break;
                
            default:
                // Desktop - use maximum settings
                this.performance.quality = 'ultra';
                this.performance.targetFPS = 60;
                this.performance.renderScale = 1.0;
                this.performance.particleCount = 150;
                this.performance.maxLights = 15;
                this.performance.shadowQuality = 'ultra';
                this.performance.textureQuality = 'ultra';
        }
        
        // Adjust for device capabilities
        this.adjustForDeviceCapabilities();
    }
    
    adjustForDeviceCapabilities() {
        // Check GPU capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            
            // Reduce quality for lower-end GPUs
            if (vendor.includes('Intel') && renderer.includes('HD Graphics')) {
                this.performance.quality = 'medium';
                this.performance.shadowQuality = 'low';
                this.performance.particleCount = 50;
            }
            
            // Check for specific mobile GPUs
            if (vendor.includes('Qualcomm') || vendor.includes('ARM')) {
                this.performance.quality = 'medium';
                this.performance.textureQuality = 'medium';
            }
        }
        
        // Check memory
        if (navigator.deviceMemory) {
            const memoryGB = navigator.deviceMemory;
            if (memoryGB < 4) {
                this.performance.quality = 'low';
                this.performance.particleCount = 25;
                this.performance.maxLights = 3;
            } else if (memoryGB < 8) {
                this.performance.quality = 'medium';
                this.performance.particleCount = 50;
                this.performance.maxLights = 5;
            }
        }
        
        // Check connection speed
        if (navigator.connection) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.performance.textureQuality = 'low';
            }
        }
    }
    
    setupControls() {
        switch (this.controlScheme) {
            case 'touch':
                this.setupTouchControls();
                break;
            case 'gamepad':
                this.setupGamepadControls();
                break;
            case 'keyboard':
                this.setupKeyboardControls();
                break;
        }
        
        // Always set up keyboard as fallback
        this.setupKeyboardControls();
    }
    
    setupTouchControls() {
        if (!this.isTouchDevice) return;
        
        // Create touch control elements
        this.createTouchControls();
        
        // Set up touch event handlers
        this.setupTouchEvents();
        
        // Create touch gestures
        this.setupTouchGestures();
        
        this.touchControls.active = true;
    }
    
    createTouchControls() {
        // Create D-Pad
        const dPad = document.createElement('div');
        dPad.className = 'touch-dpad';
        dPad.innerHTML = `
            <div class="dpad-container">
                <button class="dpad-btn up" data-action="up">↑</button>
                <button class="dpad-btn down" data-action="down">↓</button>
                <button class="dpad-btn left" data-action="left">←</button>
                <button class="dpad-btn right" data-action="right">→</button>
                <div class="dpad-center"></div>
            </div>
        `;
        
        // Create action buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'touch-action-buttons';
        actionButtons.innerHTML = `
            <div class="action-buttons-container">
                <button class="action-btn primary" data-action="mine">⛏️</button>
                <button class="action-btn secondary" data-action="interact">🤝</button>
                <button class="action-btn tertiary" data-action="inventory">🎒</button>
                <button class="action-btn quaternary" data-action="menu">☰</button>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(dPad);
        document.body.appendChild(actionButtons);
        
        this.touchControls.dPad = dPad;
        this.touchControls.actionButtons = actionButtons;
        
        // Position controls
        this.positionTouchControls();
    }
    
    positionTouchControls() {
        const dPad = this.touchControls.dPad;
        const actionButtons = this.touchControls.actionButtons;
        
        // Position D-Pad on bottom left
        dPad.style.position = 'fixed';
        dPad.style.bottom = '20px';
        dPad.style.left = '20px';
        dPad.style.zIndex = '1000';
        
        // Position action buttons on bottom right
        actionButtons.style.position = 'fixed';
        actionButtons.style.bottom = '20px';
        actionButtons.style.right = '20px';
        actionButtons.style.zIndex = '1000';
        
        // Adjust for platform
        if (this.isSteamDeck) {
            dPad.style.bottom = '40px';
            dPad.style.left = '40px';
            actionButtons.style.bottom = '40px';
            actionButtons.style.right = '40px';
        }
    }
    
    setupTouchEvents() {
        const dPad = this.touchControls.dPad;
        const actionButtons = this.touchControls.actionButtons;
        
        // D-Pad events
        const dPadButtons = dPad.querySelectorAll('.dpad-btn');
        dPadButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleTouchAction(action, true);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleTouchAction(action, false);
            });
        });
        
        // Action button events
        const actionBtns = actionButtons.querySelectorAll('.action-btn');
        actionBtns.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleTouchAction(action, true);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleTouchAction(action, false);
            });
        });
    }
    
    setupTouchGestures() {
        const canvas = document.getElementById('gameCanvas');
        
        // Swipe gestures
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            // Check for swipe
            const minSwipeDistance = 50;
            const maxSwipeTime = 300;
            
            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
                if (deltaTime < maxSwipeTime) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // Horizontal swipe
                        this.handleTouchGesture(deltaX > 0 ? 'swipe-right' : 'swipe-left');
                    } else {
                        // Vertical swipe
                        this.handleTouchGesture(deltaY > 0 ? 'swipe-down' : 'swipe-up');
                    }
                }
            }
        });
        
        // Pinch to zoom
        let lastDistance = 0;
        
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                if (lastDistance > 0) {
                    const scale = distance / lastDistance;
                    this.handleTouchGesture('pinch', { scale: scale });
                }
                
                lastDistance = distance;
            } else {
                lastDistance = 0;
            }
        });
    }
    
    handleTouchAction(action, pressed) {
        // Map touch actions to game actions
        const actionMap = {
            'up': { key: CONTROLS.KEYBOARD.MOVE_UP, pressed: pressed },
            'down': { key: CONTROLS.KEYBOARD.MOVE_DOWN, pressed: pressed },
            'left': { key: CONTROLS.KEYBOARD.MOVE_LEFT, pressed: pressed },
            'right': { key: CONTROLS.KEYBOARD.MOVE_RIGHT, pressed: pressed },
            'mine': { key: CONTROLS.KEYBOARD.MINE, pressed: pressed },
            'interact': { key: CONTROLS.KEYBOARD.INTERACT, pressed: pressed },
            'inventory': { key: CONTROLS.KEYBOARD.INVENTORY, pressed: pressed },
            'menu': { key: CONTROLS.KEYBOARD.MENU, pressed: pressed }
        };
        
        const gameAction = actionMap[action];
        if (gameAction) {
            if (pressed) {
                this.game.input.keyboard.add(gameAction.key);
            } else {
                this.game.input.keyboard.delete(gameAction.key);
            }
        }
    }
    
    handleTouchGesture(gesture, data = {}) {
        // Handle touch gestures
        switch (gesture) {
            case 'swipe-left':
                // Switch to previous weapon/item
                break;
            case 'swipe-right':
                // Switch to next weapon/item
                break;
            case 'swipe-up':
                // Jump or use special ability
                break;
            case 'swipe-down':
                // Crouch or take cover
                break;
            case 'pinch':
                // Zoom in/out
                this.handleZoom(data.scale);
                break;
        }
    }
    
    setupGamepadControls() {
        // Set up gamepad event listeners
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepads.set(e.gamepad.index, e.gamepad);
            console.log('Gamepad connected:', e.gamepad);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            this.gamepads.delete(e.gamepad.index);
            console.log('Gamepad disconnected:', e.gamepad);
        });
        
        // Start gamepad polling
        this.startGamepadPolling();
    }
    
    startGamepadPolling() {
        const pollGamepads = () => {
            const gamepads = navigator.getGamepads();
            
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                
                if (gamepad) {
                    this.gamepads.set(i, gamepad);
                    this.processGamepadInput(gamepad);
                }
            }
            
            requestAnimationFrame(pollGamepads);
        };
        
        pollGamepads();
    }
    
    processGamepadInput(gamepad) {
        // Process buttons
        const buttonMap = {
            0: 'a',      // A button
            1: 'b',      // B button
            2: 'x',      // X button
            3: 'y',      // Y button
            4: 'lb',     // Left bumper
            5: 'rb',     // Right bumper
            6: 'lt',     // Left trigger
            7: 'rt',     // Right trigger
            8: 'select', // Select button
            9: 'start',  // Start button
            10: 'ls',    // Left stick press
            11: 'rs'     // Right stick press
        };
        
        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const buttonName = buttonMap[i];
            
            if (buttonName) {
                this.handleGamepadButton(buttonName, button.pressed);
            }
        }
        
        // Process axes
        const leftStickX = this.applyDeadzone(gamepad.axes[0]);
        const leftStickY = this.applyDeadzone(gamepad.axes[1]);
        const rightStickX = this.applyDeadzone(gamepad.axes[2]);
        const rightStickY = this.applyDeadzone(gamepad.axes[3]);
        
        this.handleGamepadStick('left', leftStickX, leftStickY);
        this.handleGamepadStick('right', rightStickX, rightStickY);
        
        // Process D-pad
        const dPadUp = gamepad.buttons[12]?.pressed || false;
        const dPadDown = gamepad.buttons[13]?.pressed || false;
        const dPadLeft = gamepad.buttons[14]?.pressed || false;
        const dPadRight = gamepad.buttons[15]?.pressed || false;
        
        this.handleGamepadDPad(dPadUp, dPadDown, dPadLeft, dPadRight);
    }
    
    applyDeadzone(value) {
        if (Math.abs(value) < this.gamepadDeadzone) {
            return 0;
        }
        return value;
    }
    
    handleGamepadButton(button, pressed) {
        // Map gamepad buttons to game actions
        const buttonMap = {
            'a': { key: CONTROLS.KEYBOARD.MINE, pressed: pressed },
            'b': { key: CONTROLS.KEYBOARD.MENU, pressed: pressed },
            'x': { key: CONTROLS.KEYBOARD.INVENTORY, pressed: pressed },
            'y': { key: CONTROLS.KEYBOARD.INTERACT, pressed: pressed },
            'start': { key: CONTROLS.KEYBOARD.MENU, pressed: pressed },
            'select': { key: CONTROLS.KEYBOARD.EQUIPMENT, pressed: pressed }
        };
        
        const gameAction = buttonMap[button];
        if (gameAction) {
            if (pressed) {
                this.game.input.keyboard.add(gameAction.key);
            } else {
                this.game.input.keyboard.delete(gameAction.key);
            }
        }
    }
    
    handleGamepadStick(stick, x, y) {
        if (stick === 'left') {
            // Map left stick to movement
            this.game.input.gamepadLeftX = x;
            this.game.input.gamepadLeftY = y;
        } else if (stick === 'right') {
            // Map right stick to camera/aiming
            this.game.input.gamepadRightX = x;
            this.game.input.gamepadRightY = y;
        }
    }
    
    handleGamepadDPad(up, down, left, right) {
        // Map D-pad to movement (alternative to left stick)
        if (up) this.game.input.keyboard.add(CONTROLS.KEYBOARD.MOVE_UP);
        else this.game.input.keyboard.delete(CONTROLS.KEYBOARD.MOVE_UP);
        
        if (down) this.game.input.keyboard.add(CONTROLS.KEYBOARD.MOVE_DOWN);
        else this.game.input.keyboard.delete(CONTROLS.KEYBOARD.MOVE_DOWN);
        
        if (left) this.game.input.keyboard.add(CONTROLS.KEYBOARD.MOVE_LEFT);
        else this.game.input.keyboard.delete(CONTROLS.KEYBOARD.MOVE_LEFT);
        
        if (right) this.game.input.keyboard.add(CONTROLS.KEYBOARD.MOVE_RIGHT);
        else this.game.input.keyboard.delete(CONTROLS.KEYBOARD.MOVE_RIGHT);
    }
    
    setupKeyboardControls() {
        // Set up keyboard shortcuts
        this.keyboardShortcuts.set('escape', { action: 'menu', description: 'Open Menu' });
        this.keyboardShortcuts.set('i', { action: 'inventory', description: 'Open Inventory' });
        this.keyboardShortcuts.set('e', { action: 'equipment', description: 'Open Equipment' });
        this.keyboardShortcuts.set('space', { action: 'mine', description: 'Mine/Attack' });
        this.keyboardShortcuts.set('f', { action: 'interact', description: 'Interact' });
        this.keyboardShortcuts.set('tab', { action: 'switch-weapon', description: 'Switch Weapon' });
        this.keyboardShortcuts.set('r', { action: 'reload', description: 'Reload' });
        this.keyboardShortcuts.set('shift', { action: 'sprint', description: 'Sprint' });
        this.keyboardShortcuts.set('ctrl', { action: 'crouch', description: 'Crouch' });
        
        // Platform-specific shortcuts
        if (this.isSteamDeck) {
            this.keyboardShortcuts.set('f5', { action: 'quick-save', description: 'Quick Save' });
            this.keyboardShortcuts.set('f9', { action: 'quick-load', description: 'Quick Load' });
        }
    }
    
    setupDisplay() {
        // Set up display settings for different platforms
        this.updateDisplaySettings();
        
        // Set up canvas scaling
        this.setupCanvasScaling();
        
        // Set up orientation handling
        this.setupOrientationHandling();
    }
    
    updateDisplaySettings() {
        const canvas = document.getElementById('gameCanvas');
        
        // Set canvas resolution based on platform
        switch (this.platform) {
            case 'mobile':
                canvas.width = 800 * this.performance.renderScale;
                canvas.height = 600 * this.performance.renderScale;
                break;
            case 'tablet':
                canvas.width = 1024 * this.performance.renderScale;
                canvas.height = 768 * this.performance.renderScale;
                break;
            case 'steamdeck':
                canvas.width = 1280 * this.performance.renderScale;
                canvas.height = 800 * this.performance.renderScale;
                break;
            default:
                canvas.width = 1920 * this.performance.renderScale;
                canvas.height = 1080 * this.performance.renderScale;
        }
        
        // Apply pixel ratio for sharp rendering
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
    }
    
    setupCanvasScaling() {
        const canvas = document.getElementById('gameCanvas');
        const container = canvas.parentElement;
        
        // Scale canvas to fit container
        const scaleToFit = () => {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            
            const scaleX = containerWidth / canvasWidth;
            const scaleY = containerHeight / canvasHeight;
            const scale = Math.min(scaleX, scaleY);
            
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'top left';
        };
        
        scaleToFit();
        window.addEventListener('resize', scaleToFit);
    }
    
    setupOrientationHandling() {
        if (this.isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.updateDisplaySettings();
                    this.positionTouchControls();
                }, 100);
            });
        }
    }
    
    setupEventListeners() {
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Handle memory pressure
        if ('memory' in performance) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                const usedMemory = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
                
                if (usedMemory > 0.8) {
                    this.optimizeMemory();
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    setupAccessibility() {
        // Check for accessibility preferences
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.accessibility.highContrast = true;
        }
        
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.accessibility.reducedMotion = true;
        }
        
        // Check for screen reader
        if (window.speechSynthesis) {
            this.accessibility.screenReader = true;
        }
        
        // Apply accessibility settings
        this.applyAccessibilitySettings();
    }
    
    applyAccessibilitySettings() {
        if (this.accessibility.highContrast) {
            // Increase contrast
            document.body.style.filter = 'contrast(1.2)';
        }
        
        if (this.accessibility.reducedMotion) {
            // Reduce animations
            document.body.style.setProperty('--animation-duration', '0.01ms');
        }
        
        if (this.accessibility.largeText) {
            // Increase text size
            document.body.style.fontSize = '120%';
        }
    }
    
    applyPlatformSettings() {
        switch (this.platform) {
            case 'mobile':
                this.applyMobileSettings();
                break;
            case 'tablet':
                this.applyTabletSettings();
                break;
            case 'steamdeck':
                this.applySteamDeckSettings();
                break;
            default:
                this.applyDesktopSettings();
        }
    }
    
    applyMobileSettings() {
        // Mobile-specific optimizations
        document.body.classList.add('mobile-platform');
        
        // Reduce particle effects
        this.game.maxParticles = 25;
        
        // Simplify UI
        document.body.classList.add('mobile-ui');
        
        // Enable touch controls
        if (this.isTouchDevice) {
            this.touchControls.active = true;
        }
    }
    
    applyTabletSettings() {
        // Tablet-specific optimizations
        document.body.classList.add('tablet-platform');
        
        // Medium particle effects
        this.game.maxParticles = 50;
        
        // Adaptive UI
        document.body.classList.add('tablet-ui');
    }
    
    applySteamDeckSettings() {
        // Steam Deck-specific optimizations
        document.body.classList.add('steamdeck-platform');
        
        // Enable gamepad controls
        this.controlScheme = 'gamepad';
        
        // Optimize for Steam Deck's screen
        this.performance.renderScale = 1.0;
        
        // Enable touch screen
        if (this.isTouchDevice) {
            this.touchControls.active = true;
            this.steamDeck.touchEnabled = true;
        }
        
        // Set up Steam Deck specific controls
        this.setupSteamDeckControls();
    }
    
    applyDesktopSettings() {
        // Desktop-specific optimizations
        document.body.classList.add('desktop-platform');
        
        // Maximum quality settings
        this.game.maxParticles = 150;
        
        // Full UI
        document.body.classList.add('desktop-ui');
    }
    
    setupSteamDeckControls() {
        // Set up Steam Deck specific control mappings
        const steamDeckMappings = {
            'a': 'mine',
            'b': 'menu',
            'x': 'inventory',
            'y': 'interact',
            'lb': 'previous-item',
            'rb': 'next-item',
            'lt': 'zoom-out',
            'rt': 'zoom-in',
            'select': 'equipment',
            'start': 'menu',
            'ls': 'sprint',
            'rs': 'zoom'
        };
        
        this.customControls.set('steamdeck', steamDeckMappings);
    }
    
    handleZoom(scale) {
        // Handle zoom gesture
        const currentScale = this.game.camera.zoom || 1.0;
        const newScale = Math.max(0.5, Math.min(2.0, currentScale * scale));
        this.game.camera.zoom = newScale;
    }
    
    pauseGame() {
        if (this.game && this.game.isRunning) {
            this.game.pause();
        }
    }
    
    resumeGame() {
        if (this.game && this.game.isPaused) {
            this.game.resume();
        }
    }
    
    optimizeMemory() {
        // Memory optimization
        console.log('Optimizing memory usage...');
        
        // Clear particle cache
        if (this.game.particles) {
            this.game.particles.clear();
        }
        
        // Reduce texture quality
        this.performance.textureQuality = 'low';
        
        // Reduce particle count
        this.performance.particleCount = Math.floor(this.performance.particleCount * 0.5);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
    
    getPerformanceMetrics() {
        return {
            platform: this.platform,
            quality: this.performance.quality,
            targetFPS: this.performance.targetFPS,
            renderScale: this.performance.renderScale,
            particleCount: this.performance.particleCount,
            maxLights: this.performance.maxLights,
            shadowQuality: this.performance.shadowQuality,
            textureQuality: this.performance.textureQuality,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }
    
    setQualityPreset(preset) {
        switch (preset) {
            case 'low':
                this.performance.quality = 'low';
                this.performance.targetFPS = 30;
                this.performance.renderScale = 0.5;
                this.performance.particleCount = 25;
                this.performance.maxLights = 3;
                this.performance.shadowQuality = 'low';
                this.performance.textureQuality = 'low';
                break;
            case 'medium':
                this.performance.quality = 'medium';
                this.performance.targetFPS = 45;
                this.performance.renderScale = 0.75;
                this.performance.particleCount = 50;
                this.performance.maxLights = 5;
                this.performance.shadowQuality = 'medium';
                this.performance.textureQuality = 'medium';
                break;
            case 'high':
                this.performance.quality = 'high';
                this.performance.targetFPS = 60;
                this.performance.renderScale = 1.0;
                this.performance.particleCount = 100;
                this.performance.maxLights = 10;
                this.performance.shadowQuality = 'high';
                this.performance.textureQuality = 'high';
                break;
            case 'ultra':
                this.performance.quality = 'ultra';
                this.performance.targetFPS = 60;
                this.performance.renderScale = 1.0;
                this.performance.particleCount = 150;
                this.performance.maxLights = 15;
                this.performance.shadowQuality = 'ultra';
                this.performance.textureQuality = 'ultra';
                break;
        }
        
        // Apply new settings
        this.updateDisplaySettings();
    }
    
    getControlScheme() {
        return this.controlScheme;
    }
    
    setControlScheme(scheme) {
        if (['keyboard', 'touch', 'gamepad'].includes(scheme)) {
            this.controlScheme = scheme;
            this.setupControls();
        }
    }
    
    getPlatformInfo() {
        return {
            platform: this.platform,
            isMobile: this.isMobile,
            isSteamDeck: this.isSteamDeck,
            isTouchDevice: this.isTouchDevice,
            controlScheme: this.controlScheme,
            screen: this.screen,
            performance: this.performance,
            accessibility: this.accessibility
        };
    }
    
    cleanup() {
        // Clean up touch controls
        if (this.touchControls.dPad) {
            this.touchControls.dPad.remove();
        }
        if (this.touchControls.actionButtons) {
            this.touchControls.actionButtons.remove();
        }
        
        // Clean up event listeners
        window.removeEventListener('orientationchange', this.updateDisplaySettings);
        window.removeEventListener('resize', this.setupCanvasScaling);
        window.removeEventListener('beforeunload', this.cleanup);
        
        // Stop gamepad polling
        if (this.gamepadPolling) {
            cancelAnimationFrame(this.gamepadPolling);
        }
    }
}