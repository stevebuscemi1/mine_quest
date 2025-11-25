// js/core/GameIntegration.js

import { GAME_MODES, SAVE_CONSTANTS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Game } from './Game.js';
import { PlatformManager } from './PlatformManager.js';
import { ResponsiveDesign } from '../ui/ResponsiveDesign.js';
import { TouchControls } from '../ui/TouchControls.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SaveLoadUI } from '../ui/SaveLoadUI.js';

export class GameIntegration {
    constructor() {
        // Core components
        this.game = null;
        this.platformManager = null;
        this.responsiveDesign = null;
        this.touchControls = null;
        this.saveSystem = null;
        this.saveLoadUI = null;
        
        // State
        this.isInitialized = false;
        this.currentMode = null;
        this.isPaused = false;
        this.isLoading = false;
        
        // Error handling
        this.errorHandler = new ErrorHandler();
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        this.debugMode = false;
        
        // Event system
        this.eventBus = new EventBus();
        
        // Initialization promise
        this.initializationPromise = null;
    }
    
    async initialize() {
        if (this.isInitialized) {
            return Promise.resolve();
        }
        
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }
    
    async _performInitialization() {
        try {
            console.log('Initializing Mine Quest...');
            
            // Show loading screen
            this.showLoadingScreen('Initializing game systems...');
            
            // Initialize core systems
            await this.initializeCoreSystems();
            
            // Initialize platform systems
            await this.initializePlatformSystems();
            
            // Initialize save system
            await this.initializeSaveSystem();
            
            // Initialize UI systems
            await this.initializeUISystems();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Set up error handling
            this.setupErrorHandling();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Initialize game
            await this.initializeGame();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('Mine Quest initialized successfully!');
            
            // Trigger initialization complete event
            this.eventBus.emit('game:initialized');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }
    
    async initializeCoreSystems() {
        this.showLoadingScreen('Loading core systems...');
        
        // Initialize event bus first
        this.eventBus.initialize();
        
        // Initialize game instance
        this.game = new Game();
        
        // Set up game callbacks
        this.setupGameCallbacks();
        
        await Utils.wait(100); // Allow UI to update
    }
    
    async initializePlatformSystems() {
        this.showLoadingScreen('Detecting platform...');
        
        // Initialize platform manager
        this.platformManager = new PlatformManager(this.game);
        
        // Initialize responsive design
        this.responsiveDesign = new ResponsiveDesign(this.platformManager);
        
        // Initialize touch controls if needed
        if (this.platformManager.isTouchDevice) {
            this.touchControls = new TouchControls(this.game);
        }
        
        await Utils.wait(100);
    }
    
    async initializeSaveSystem() {
        this.showLoadingScreen('Initializing save system...');
        
        // Initialize save system
        this.saveSystem = new SaveSystem();
        
        // Initialize save/load UI
        this.saveLoadUI = new SaveLoadUI(this.game, this.saveSystem);
        if (this.game?.ui?.setSaveLoadUI) {
            this.game.ui.setSaveLoadUI(this.saveLoadUI);
        }
        
        // Set up save data provider
        this.saveSystem.setGameDataProvider(() => {
            return this.game.currentMode ? this.game.currentMode.getSaveData() : null;
        });
        
        await Utils.wait(100);
    }
    
    async initializeUISystems() {
        this.showLoadingScreen('Loading UI systems...');
        
        // UI is already initialized in Game constructor
        // Just set up additional UI features here
        
        // Set up platform-specific UI
        this.setupPlatformUI();
        
        await Utils.wait(100);
    }
    
    setupGameCallbacks() {
        // Set up game event callbacks
        this.game.onAreaChanged = (area) => {
            this.eventBus.emit('game:areaChanged', area);
        };
        
        this.game.returnToStartPage = () => {
            this.returnToStartPage();
        };
        if (this.game?.ui?.setGame) {
            this.game.ui.setGame(this.game);
        }
        
        this.game.loadGameData = (saveData) => {
            this.loadGameData(saveData);
        };
    }
    
    setupEventHandlers() {
        // Handle game mode selection
        this.eventBus.on('startPage:startGame', (mode) => {
            this.startGame(mode);
        });
        
        // Handle save/load events
        this.eventBus.on('game:save', (slot) => {
            this.saveGame(slot);
        });
        
        this.eventBus.on('game:load', (slot) => {
            this.loadGame(slot);
        });
        
        // Handle pause/resume
        this.eventBus.on('game:pause', () => {
            this.pauseGame();
        });
        
        this.eventBus.on('game:resume', () => {
            this.resumeGame();
        });
        
        // Handle errors
        this.eventBus.on('error', (error) => {
            this.handleError(error);
        });
        
        // Handle performance warnings
        this.eventBus.on('performance:warning', (warning) => {
            this.handlePerformanceWarning(warning);
        });
    }
    
    setupErrorHandling() {
        // Set up global error handler
        window.addEventListener('error', (event) => {
            this.errorHandler.handleError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.errorHandler.handleError(event.reason);
        });
        
        // Set up game-specific error handling
        this.errorHandler.setRetryCallback(() => {
            this.retryInitialization();
        });
    }
    
    setupPerformanceMonitoring() {
        // Initialize performance monitor
        this.performanceMonitor.initialize();
        
        // Set up performance metrics
        this.performanceMonitor.on('fps:low', () => {
            this.handleLowFPS();
        });
        
        this.performanceMonitor.on('memory:high', () => {
            this.handleHighMemoryUsage();
        });
        
        this.performanceMonitor.on('performance:warning', (warning) => {
            this.handlePerformanceWarning(warning);
        });
    }
    
    async initializeGame() {
        this.showLoadingScreen('Initializing game...');
        
        // Game is already initialized in constructor
        // Just set up final initialization here
        
        // Set up platform-specific game settings
        this.applyPlatformGameSettings();
        
        await Utils.wait(100);
    }
    
    setupPlatformUI() {
        // Set up platform-specific UI elements
        const platform = this.platformManager.platform;
        
        switch (platform) {
            case 'mobile':
                this.setupMobileUI();
                break;
            case 'tablet':
                this.setupTabletUI();
                break;
            case 'steamdeck':
                this.setupSteamDeckUI();
                break;
            default:
                this.setupDesktopUI();
        }
    }
    
    setupMobileUI() {
        // Add mobile-specific UI elements
        document.body.classList.add('mobile-ui');
        
        // Adjust touch controls
        if (this.touchControls) {
            this.touchControls.setPosition('mobile');
        }
    }
    
    setupTabletUI() {
        // Add tablet-specific UI elements
        document.body.classList.add('tablet-ui');
        
        // Adjust touch controls
        if (this.touchControls) {
            this.touchControls.setPosition('tablet');
        }
    }
    
    setupSteamDeckUI() {
        // Add Steam Deck-specific UI elements
        document.body.classList.add('steamdeck-ui');
        
        // Adjust touch controls
        if (this.touchControls) {
            this.touchControls.setPosition('steamdeck');
        }
    }
    
    setupDesktopUI() {
        // Add desktop-specific UI elements
        document.body.classList.add('desktop-ui');
        
        // Hide touch controls
        if (this.touchControls) {
            this.touchControls.hide();
        }
    }
    
    applyPlatformGameSettings() {
        // Apply platform-specific game settings
        const performance = this.platformManager.performance;
        
        // Update game performance settings
        this.game.performance = performance;
        
        // Update target FPS
        this.game.performance.targetFPS = performance.targetFPS;
        
        // Update render scale
        this.game.renderScale = performance.renderScale;
        
        // Update particle count
        this.game.maxParticles = performance.particleCount;
    }
    
    async startGame(mode) {
        if (this.isLoading) {
            return;
        }
        
        try {
            this.isLoading = true;
            this.showLoadingScreen('Starting game...');
            
            // Hide start page
            document.getElementById('startPage').classList.add('hidden');
            document.getElementById('gameContainer').classList.remove('hidden');
            
            // Initialize game mode
            await this.game.init(mode);
            
            this.currentMode = mode;
            this.isLoading = false;
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Start game loop
            this.game.start();
            
            // Trigger game started event
            this.eventBus.emit('game:started', { mode });
            
        } catch (error) {
            this.isLoading = false;
            this.handleGameStartError(error);
        }
    }
    
    pauseGame() {
        if (this.game && this.game.isRunning) {
            this.game.pause();
            this.isPaused = true;
            this.eventBus.emit('game:paused');
        }
    }
    
    resumeGame() {
        if (this.game && this.game.isPaused) {
            this.game.resume();
            this.isPaused = false;
            this.eventBus.emit('game:resumed');
        }
    }
    
    async saveGame(slot) {
        try {
            if (!this.game.currentMode) {
                throw new Error('No game mode active');
            }
            
            const gameData = this.game.currentMode.getSaveData();
            const result = this.saveSystem.saveGame(slot, gameData);
            
            if (result.success) {
                this.eventBus.emit('game:saved', { slot });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            this.eventBus.emit('error', error);
        }
    }
    
    async loadGame(slot) {
        try {
            const result = this.saveSystem.loadGame(slot);
            
            if (result.success) {
                await this.loadGameData(result.saveData);
                this.eventBus.emit('game:loaded', { slot });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            this.eventBus.emit('error', error);
        }
    }
    
    async loadGameData(saveData) {
        try {
            // Stop current game if running
            if (this.game && this.game.isRunning) {
                this.game.stop();
            }
            
            // Load game data based on mode
            const mode = saveData.mode;
            
            // Initialize game mode
            await this.game.init(mode);
            
            // Load save data into current mode
            if (this.game.currentMode && this.game.currentMode.loadGame) {
                this.game.currentMode.loadGame(saveData);
            }
            
            this.currentMode = mode;
            
            // Start game
            this.game.start();
            
        } catch (error) {
            throw new Error(`Failed to load game data: ${error.message}`);
        }
    }
    
    returnToStartPage() {
        // Stop game
        if (this.game) {
            this.game.stop();
        }
        
        // Show start page
        document.getElementById('gameContainer').classList.add('hidden');
        document.getElementById('startPage').classList.remove('hidden');
        
        // Reset state
        this.currentMode = null;
        this.isPaused = false;
        
        // Trigger return to start page event
        this.eventBus.emit('game:returnedToStartPage');
    }
    
    showLoadingScreen(message = 'Loading...') {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = loadingScreen.querySelector('.loading-content p');
        
        loadingText.textContent = message;
        loadingScreen.classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
    }
    
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show error message
        this.showErrorMessage(
            'Failed to initialize game',
            error.message,
            () => {
                this.retryInitialization();
            }
        );
    }
    
    handleGameStartError(error) {
        console.error('Game start error:', error);
        
        // Show error message
        this.showErrorMessage(
            'Failed to start game',
            error.message,
            () => {
                this.returnToStartPage();
            }
        );
    }
    
    handleError(error) {
        console.error('Game error:', error);
        
        // Log error
        this.errorHandler.logError(error);
        
        // Show error notification
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                'An error occurred',
                'error',
                5000
            );
        }
    }
    
    handleLowFPS() {
        console.warn('Low FPS detected');
        
        // Reduce quality settings
        this.platformManager.setQualityPreset('medium');
        
        // Show warning
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                'Performance: Reduced quality to improve FPS',
                'warning',
                3000
            );
        }
    }
    
    handleHighMemoryUsage() {
        console.warn('High memory usage detected');
        
        // Optimize memory
        this.platformManager.optimizeMemory();
        
        // Show warning
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                'Performance: Optimizing memory usage',
                'warning',
                3000
            );
        }
    }
    
    handlePerformanceWarning(warning) {
        console.warn('Performance warning:', warning);
        
        // Handle specific warnings
        switch (warning.type) {
            case 'memory':
                this.handleHighMemoryUsage();
                break;
            case 'fps':
                this.handleLowFPS();
                break;
            default:
                console.warn('Unknown performance warning:', warning);
        }
    }
    
    showErrorMessage(title, message, retryCallback) {
        // Create error dialog
        const dialog = document.createElement('div');
        dialog.className = 'error-dialog';
        dialog.innerHTML = `
            <div class="error-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="error-actions">
                    <button class="retry-btn">Retry</button>
                    <button class="close-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(dialog);
        
        // Set up event listeners
        const retryBtn = dialog.querySelector('.retry-btn');
        const closeBtn = dialog.querySelector('.close-btn');
        
        retryBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (retryCallback) {
                retryCallback();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }
    
    async retryInitialization() {
        if (this.retryCount >= this.maxRetries) {
            this.showErrorMessage(
                'Initialization Failed',
                'Failed to initialize game after multiple attempts. Please refresh the page.',
                null
            );
            return;
        }
        
        this.retryCount++;
        console.log(`Retrying initialization (${this.retryCount}/${this.maxRetries})`);
        
        try {
            await this._performInitialization();
            this.retryCount = 0; // Reset retry count on success
        } catch (error) {
            // Error will be handled by _performInitialization
        }
    }
    
    enableDebugMode() {
        this.debugMode = true;
        
        // Enable debug features
        if (this.game) {
            this.game.debug.enabled = true;
            this.game.debug.showFPS = true;
            this.game.debug.showGrid = true;
            this.game.debug.showCoords = true;
        }
        
        // Add debug UI
        this.createDebugUI();
    }
    
    createDebugUI() {
        const debugUI = document.createElement('div');
        debugUI.className = 'debug-ui';
        debugUI.innerHTML = `
            <div class="debug-panel">
                <h3>Debug Panel</h3>
                <div class="debug-info">
                    <p>Platform: ${this.platformManager?.platform || 'Unknown'}</p>
                    <p>Mode: ${this.currentMode || 'None'}</p>
                    <p>FPS: <span id="debug-fps">0</span></p>
                    <p>Memory: <span id="debug-memory">0 MB</span></p>
                </div>
                <div class="debug-controls">
                    <button id="debug-toggle-grid">Toggle Grid</button>
                    <button id="debug-toggle-coords">Toggle Coords</button>
                    <button id="debug-toggle-fps">Toggle FPS</button>
                    <button id="debug-save-state">Save State</button>
                    <button id="debug-load-state">Load State</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(debugUI);
        
        // Set up debug controls
        this.setupDebugControls(debugUI);
    }
    
    setupDebugControls(debugUI) {
        // Toggle grid
        document.getElementById('debug-toggle-grid').addEventListener('click', () => {
            if (this.game) {
                this.game.debug.showGrid = !this.game.debug.showGrid;
            }
        });
        
        // Toggle coords
        document.getElementById('debug-toggle-coords').addEventListener('click', () => {
            if (this.game) {
                this.game.debug.showCoords = !this.game.debug.showCoords;
            }
        });
        
        // Toggle FPS
        document.getElementById('debug-toggle-fps').addEventListener('click', () => {
            if (this.game) {
                this.game.debug.showFPS = !this.game.debug.showFPS;
            }
        });
        
        // Save state
        document.getElementById('debug-save-state').addEventListener('click', () => {
            this.saveDebugState();
        });
        
        // Load state
        document.getElementById('debug-load-state').addEventListener('click', () => {
            this.loadDebugState();
        });
    }
    
    saveDebugState() {
        if (!this.game || !this.game.currentMode) {
            return;
        }
        
        const state = {
            gameData: this.game.currentMode.getSaveData(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('minequest_debug_state', JSON.stringify(state));
        console.log('Debug state saved');
    }
    
    loadDebugState() {
        try {
            const stateData = localStorage.getItem('minequest_debug_state');
            if (!stateData) {
                console.log('No debug state found');
                return;
            }
            
            const state = JSON.parse(stateData);
            this.loadGameData(state.gameData);
            console.log('Debug state loaded');
        } catch (error) {
            console.error('Failed to load debug state:', error);
        }
    }
    
    getGameState() {
        return {
            isInitialized: this.isInitialized,
            currentMode: this.currentMode,
            isPaused: this.isPaused,
            isLoading: this.isLoading,
            platform: this.platformManager?.getPlatformInfo(),
            performance: this.performanceMonitor?.getMetrics(),
            debugMode: this.debugMode
        };
    }
    
    cleanup() {
        // Stop game
        if (this.game) {
            this.game.stop();
        }
        
        // Clean up systems
        if (this.platformManager) {
            this.platformManager.cleanup();
        }
        
        if (this.touchControls) {
            this.touchControls.cleanup();
        }
        
        if (this.saveSystem) {
            this.saveSystem.cleanup();
        }
        
        if (this.performanceMonitor) {
            this.performanceMonitor.cleanup();
        }
        
        // Remove debug UI
        const debugUI = document.querySelector('.debug-ui');
        if (debugUI) {
            debugUI.remove();
        }
        
        // Reset state
        this.isInitialized = false;
        this.currentMode = null;
        this.isPaused = false;
        this.isLoading = false;
    }
}

// Supporting classes

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.retryCallback = null;
    }
    
    handleError(error) {
        this.logError(error);
        
        // Try to recover from error
        this.attemptRecovery(error);
    }
    
    logError(error) {
        const errorEntry = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.push(errorEntry);
        
        // Keep only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        console.error('Game error:', errorEntry);
    }
    
    attemptRecovery(error) {
        // Try to recover from common errors
        if (error.message.includes('memory')) {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
        }
        
        if (error.message.includes('webgl')) {
            // Try to restart rendering
            console.log('Attempting to restart rendering...');
        }
    }
    
    setRetryCallback(callback) {
        this.retryCallback = callback;
    }
    
    getErrors() {
        return [...this.errors];
    }
    
    clearErrors() {
        this.errors = [];
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memory: 0,
            drawCalls: 0
        };
        
        this.thresholds = {
            minFPS: 30,
            maxMemory: 0.8,
            maxFrameTime: 33
        };
        
        this.callbacks = new Map();
        this.isMonitoring = false;
        this.frameCount = 0;
        this.lastTime = 0;
    }
    
    initialize() {
        this.isMonitoring = true;
        this.startMonitoring();
    }
    
    startMonitoring() {
        if (!this.isMonitoring) return;
        
        const monitor = () => {
            if (!this.isMonitoring) return;
            
            this.updateMetrics();
            this.checkThresholds();
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    updateMetrics() {
        const now = performance.now();
        
        if (this.lastTime > 0) {
            const deltaTime = now - this.lastTime;
            this.metrics.frameTime = deltaTime;
            this.metrics.fps = 1000 / deltaTime;
        }
        
        this.lastTime = now;
        this.frameCount++;
        
        // Update memory usage
        if (performance.memory) {
            this.metrics.memory = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        }
    }
    
    checkThresholds() {
        // Check FPS
        if (this.metrics.fps < this.thresholds.minFPS) {
            this.triggerCallback('fps:low', { fps: this.metrics.fps });
        }
        
        // Check memory
        if (this.metrics.memory > this.thresholds.maxMemory) {
            this.triggerCallback('memory:high', { memory: this.metrics.memory });
        }
        
        // Check frame time
        if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
            this.triggerCallback('frameTime:high', { frameTime: this.metrics.frameTime });
        }
    }
    
    on(event, callback) {
        this.callbacks.set(event, callback);
    }
    
    triggerCallback(event, data) {
        const callback = this.callbacks.get(event);
        if (callback) {
            callback(data);
        }
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    cleanup() {
        this.isMonitoring = false;
        this.callbacks.clear();
    }
}

class EventBus {
    constructor() {
        this.events = new Map();
    }
    
    initialize() {
        // Initialize event system
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    emit(event, data) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${event}:`, error);
                }
            });
        }
    }
    
    off(event, callback) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}

// Main initialization
let gameIntegration = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        gameIntegration = new GameIntegration();
        await gameIntegration.initialize();
        
        // Set up global access for debugging
        window.MineQuest = gameIntegration;
        
        // Enable debug mode if URL parameter is present
        if (window.location.search.includes('debug=true')) {
            gameIntegration.enableDebugMode();
        }
        
    } catch (error) {
        console.error('Failed to initialize Mine Quest:', error);
        
        // Show fallback error message
        document.body.innerHTML = `
            <div class="fatal-error">
                <h1>Failed to Initialize Mine Quest</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
});