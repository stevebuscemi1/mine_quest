// js/main.js

import { GAME_MODES, GRID_SIZE, CELL_SIZE, CANVAS_SIZE, COLORS, CONTROLS, ASSET_PATHS, CELL_TYPES } from './constants/GameConstants.js';
import { StartPage } from './ui/StartPage.js';
import { Game } from './core/Game.js';
import { LoadingManager } from './systems/LoadingManager.js';

class MineQuest {
    constructor() {
        this.startPage = null;
        this.game = null;
        this.currentMode = null;
        this.isInitialized = false;
        this.loadingManager = new LoadingManager();
    }
    
    async init() {
        console.log('=== Mine Quest Initialization ===');

        try {
            // Initialize start page
            console.log('Initializing start page...');
            this.startPage = new StartPage();

            // Set up event listeners for start page
            this.setupStartPageListeners();

            // Detect if touch device
            this.detectTouchDevice();

            // Load user preferences
            this.loadTouchControlsPreference();

            // Ensure loading screen starts hidden
            console.log('Ensuring loading screen starts hidden');
            this.loadingManager.hide();

            this.isInitialized = true;
            console.log('=== Mine Quest Initialization Complete ===');

        } catch (error) {
            console.error('=== Mine Quest Initialization Failed ===');
            console.error(error);
            this.handleInitializationError(error);
        }
    }
    
    setupStartPageListeners() {
        console.log('Setting up start page listeners...');
        
        // Listen for start page events
        document.addEventListener('startPage:startGame', (e) => {
            console.log('Start page start game event received:', e.detail);
            const mode = e.detail.mode;
            this.startGame(mode);
        });

        document.addEventListener('startPage:loadGame', (e) => {
            console.log('Start page load game event received:', e.detail);
            const saveData = e.detail.saveData;
            const slotIndex = e.detail.slotIndex;
            this.loadGame(saveData, slotIndex);
        });

        console.log('Start page listeners set up');
    }
    
    async loadGame(saveData, slotIndex) {
        console.log(`=== Loading Game ===`);
        console.log('Save data:', saveData);
        console.log('Slot index:', slotIndex);

        try {
            // Show loading screen
            this.loadingManager.show();

            // Hide start page
            this.startPage.hide(async () => {
                console.log('Start page hidden, loading game...');

                // Add timeout fallback to ensure loading screen hides
                const loadingTimeout = setTimeout(() => {
                    console.log('Main: Loading timeout reached, forcing hide');
                    this.loadingManager.hide();
                }, 10000); // 10 second timeout

                try {
                    // Create and initialize game
                    this.game = new Game();

                    // Set up game event listeners
                    this.setupGameListeners();

                    // Initialize game first
                    await this.game.init(saveData.mode);

                    // Load save data into game
                    await this.game.loadGameFromData(saveData);

                    console.log('=== Game Loaded Successfully ===');

                    // Ensure game container is visible
                    const gameContainer = document.getElementById('gameContainer');
                    if (gameContainer) {
                        gameContainer.classList.remove('hidden');
                        gameContainer.style.zIndex = '500';
                        gameContainer.style.display = 'flex';
                        console.log('Main: Game container confirmed visible (load)');
                    }

                    // Clear the timeout since game loaded successfully
                    clearTimeout(loadingTimeout);

                    // Wait a moment to ensure game is fully ready, then hide loading screen
                    setTimeout(() => {
                        console.log('Main: Forcing loading screen hide after game load');
                        this.loadingManager.hide();
                    }, 500);

                } catch (error) {
                    console.error('=== Game Load Failed ===');
                    console.error(error);

                    // Clear timeout on error too
                    clearTimeout(loadingTimeout);

                    // Hide loading screen and show start page on error
                    this.loadingManager.hide();
                    this.startPage.show();

                    this.handleGameStartError(error);
                }
            });

        } catch (error) {
            console.error('Error in loadGame:', error);
            this.handleGameStartError(error);
        }
    }

    async startGame(mode) {
        console.log(`=== Starting Game ===`);
        console.log('Mode:', mode);

        try {
            // Show loading screen immediately
            this.loadingManager.show();

            // Hide start page and wait for completion
            this.startPage.hide(async () => {
                console.log('Start page hidden, starting game initialization...');

                // Add timeout fallback to ensure loading screen hides
                const loadingTimeout = setTimeout(() => {
                    console.log('Main: Loading timeout reached, forcing hide');
                    this.loadingManager.hide();
                }, 10000); // 10 second timeout

                try {
                    // Create and initialize game
                    this.game = new Game();

                    // Set up game event listeners
                    this.setupGameListeners();

                    // Initialize game
                    await this.game.init(mode);

                    console.log('=== Game Started Successfully ===');

                    // Ensure game container is visible
                    const gameContainer = document.getElementById('gameContainer');
                    if (gameContainer) {
                        gameContainer.classList.remove('hidden');
                        gameContainer.style.zIndex = '500';
                        gameContainer.style.display = 'flex';
                        console.log('Main: Game container confirmed visible');
                    }

                    // Clear the timeout since game loaded successfully
                    clearTimeout(loadingTimeout);

                    // Wait a moment to ensure game is fully ready, then hide loading screen
                    setTimeout(() => {
                        console.log('Main: Forcing loading screen hide after game init');
                        this.loadingManager.hide();
                    }, 500);

                } catch (error) {
                    console.error('=== Game Start Failed ===');
                    console.error(error);

                    // Clear timeout on error too
                    clearTimeout(loadingTimeout);

                    // Hide loading screen and show start page on error
                    this.loadingManager.hide();
                    this.startPage.show();

                    this.handleGameStartError(error);
                }
            });

        } catch (error) {
            console.error('Error in startGame:', error);
            this.handleGameStartError(error);
        }
    }

    // Method to force hide loading screen (for debugging)
    forceHideLoading() {
        console.log('Main: Force hiding loading screen');
        this.loadingManager.hide();
    }
    
    setupGameListeners() {
        console.log('Setting up game listeners...');
        
        // Listen for game events
        document.addEventListener('game:initialized', () => {
            console.log('Game initialized event received');
        });
        
        document.addEventListener('game:started', () => {
            console.log('Game started event received');
            this.setupTouchControlsToggle();
        });
        
        document.addEventListener('game:returnedToStartPage', () => {
            console.log('Game returned to start page event received');
            this.returnToStartPage();
        });
        
        document.addEventListener('error', (e) => {
            console.error('Game error event received:', e.detail);
            this.handleGameError(e.detail);
        });
        
        console.log('Game listeners set up');
    }
    
    setupTouchControlsToggle() {
        const toggleBtn = document.getElementById('touchControlsToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTouchControls();
            });
            console.log('Touch controls toggle set up');
        }
    }
    
    returnToStartPage() {
        console.log('Returning to start page');
        
        // Stop game
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        
        // Show start page
        this.startPage.show();
        
        // Reset state
        this.currentMode = null;
    }
    
    handleGameStartError(error) {
        console.error('Game start error:', error);

        // Hide loading screen
        this.loadingManager.hide();

        // Show start page
        this.startPage.show();

        // Show error message
        this.showErrorMessage(
            'Failed to start game',
            error.message,
            () => {
                // Retry option - do nothing, user can click Start Quest again
            }
        );
    }
    
    handleGameError(error) {
        console.error('Game error:', error);
        
        // Show error notification
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                'An error occurred',
                'error',
                5000
            );
        }
    }
    
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show fallback error message
        document.body.innerHTML = `
            <div class="fatal-error">
                <h1>Failed to Initialize Mine Quest</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
    
    showErrorMessage(title, message, retryCallback) {
        console.log(`Showing error message: ${title} - ${message}`);
        
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
        
        document.body.appendChild(dialog);
        
        const retryBtn = dialog.querySelector('.retry-btn');
        const closeBtn = dialog.querySelector('.close-btn');
        
        retryBtn.addEventListener('click', () => {
            console.log('Retry button clicked');
            document.body.removeChild(dialog);
            if (retryCallback) {
                retryCallback();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            document.body.removeChild(dialog);
        });
    }
    
    detectTouchDevice() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Detect mobile OS
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroid = /android/.test(userAgent);
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isMobile = /android|iphone|ipad|ipod|blackberry|opera mini|iemobile/.test(userAgent) || 
                        (window.innerWidth <= 768 && window.innerHeight <= 1024);
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            console.log('Touch device detected');
            
            // Add specific device classes
            if (isAndroid) {
                document.body.classList.add('android-device');
                console.log('Android device detected');
            }
            if (isIOS) {
                document.body.classList.add('ios-device');
                console.log('iOS device detected');
            }
            if (isMobile) {
                document.body.classList.add('mobile-device');
                console.log('Mobile device detected');
            }
        } else {
            // Hide touch controls on PC by default
            document.body.classList.add('pc-device');
            this.hideTouchControls();
            console.log('PC device detected, touch controls hidden');
        }
    }

    hideTouchControls() {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
    }

    showTouchControls() {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.classList.remove('hidden');
        }
    }

    toggleTouchControls() {
        const touchControls = document.getElementById('touchControls');
        const toggleBtn = document.getElementById('touchControlsToggle');

        if (touchControls && toggleBtn) {
            if (touchControls.classList.contains('hidden')) {
                this.showTouchControls();
                document.body.classList.add('touch-controls-enabled');
                toggleBtn.textContent = '✖️';
                toggleBtn.title = 'Hide Touch Controls';
                // Save preference
                localStorage.setItem('mineQuest_showTouchControls', 'true');
            } else {
                this.hideTouchControls();
                document.body.classList.remove('touch-controls-enabled');
                toggleBtn.textContent = '🎮';
                toggleBtn.title = 'Show Touch Controls';
                // Save preference
                localStorage.setItem('mineQuest_showTouchControls', 'false');
            }
        }
    }

    loadTouchControlsPreference() {
        const preference = localStorage.getItem('mineQuest_showTouchControls');
        const toggleBtn = document.getElementById('touchControlsToggle');

        if (preference === 'true') {
            this.showTouchControls();
            document.body.classList.add('touch-controls-enabled');
            if (toggleBtn) {
                toggleBtn.textContent = '✖️';
                toggleBtn.title = 'Hide Touch Controls';
            }
        } else if (preference === 'false') {
            this.hideTouchControls();
            document.body.classList.remove('touch-controls-enabled');
            if (toggleBtn) {
                toggleBtn.textContent = '🎮';
                toggleBtn.title = 'Show Touch Controls';
            }
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    try {
        const game = new MineQuest();
        await game.init();
        
        // Set up global access for debugging
        window.MineQuest = game;
        
        // Enable debug mode if URL parameter is present
        if (window.location.search.includes('debug=true')) {
            console.log('Debug mode enabled');
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