// js/core/Game.js

import { UI } from '../ui/UI.js';
import { GAME_MODES, GRID_SIZE, CELL_SIZE, CANVAS_SIZE, COLORS, CONTROLS, ASSET_PATHS, CELL_TYPES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Area } from './Area.js';
import { FogOfWar } from './FogOfWar.js';
import { StandardMode } from '../modes/StandardMode.js';
import { CustomMode } from '../modes/CustomMode.js';
import { GauntletMode } from '../modes/GauntletMode.js';
import { DebugMode } from '../modes/DebugMode.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { CraftingSystem } from '../systems/CraftingSystem.js';
import { CraftingUI } from '../ui/CraftingUI.js';
// import { EquipmentEnhancementSystem } from '../systems/EquipmentEnhancementSystem.js';
import { StoryManager } from './Story.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SaveLoadUI } from '../ui/SaveLoadUI.js';
import { ResponsiveDesign } from '../utils/ResponsiveDesign.js';

export class Game {
    constructor() {
        // Canvas and context
        this.canvas = null;
        this.ctx = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Game mode
        this.currentMode = null;
        this.gameMode = null;
        
        // Game objects
        this.currentArea = null;
        this.player = null;
        this.fogOfWar = null;
        
        // Rendering
        this.viewport = {
            x: 0,
            y: 0,
            width: GRID_SIZE,
            height: GRID_SIZE
        };
        
        // Zoom settings
        this.zoomEnabled = false; // Zoom disabled by default
        this.zoomLevel = 1.0; // 1.0 = default (13x13), 0.5 = zoomed out (17x17), 1.5 = zoomed in (7x7)
        this.minZoom = 0.7;  // Most zoomed out (17x17 cells visible)
        this.maxZoom = 2.0;  // Most zoomed in (7x7 cells visible)
        this.baseCellSize = CELL_SIZE;
        this.currentCellSize = CELL_SIZE;
        
        // Assets
        this.textures = new Map();
        this.entitySprites = new Map();
        this.playerSprites = new Map();
        this.itemSprites = new Map();
        
        // Progression systems
        this.achievementSystem = new AchievementSystem();
        this.craftingSystem = new CraftingSystem(this);
        this.storyManager = new StoryManager(this);

        // Crafting UI should be initialized after game initialization
        // this.craftingUI = new CraftingUI(this, this.craftingSystem);

        // Audio system
        this.audioSystem = new AudioSystem();

        // Save system
        this.saveSystem = new SaveSystem();
        this.saveLoadUI = new SaveLoadUI(this, this.saveSystem);
        
        // Input handling
        this.input = {
            keyboard: new Set(),
            mouse: { x: 0, y: 0, pressed: false, worldX: 0, worldY: 0 },
            touch: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },
            gamepad: null
        };
        
        // Tooltip system
        this.tooltip = {
            visible: false,
            x: 0,
            y: 0,
            content: '',
            type: '' // 'cell', 'enemy', 'player'
        };
        
        // Damage numbers for visual feedback
        this.damageNumbers = new Map();
        this.damageNumberId = 0;
        
        // Animation
        this.animations = new Map();
        this.particles = new Map();
        
        // Make sure game container is visible before UI initialization
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
            gameContainer.style.zIndex = '500';
            gameContainer.style.display = 'flex';
            console.log('Game: Game container made visible for UI initialization');
        }

        // Initialize UI
        this.initializeUI();
        
        // Initialize responsive design system
        this.responsiveDesign = new ResponsiveDesign(this);
        
        // Performance
        this.performance = {
            targetFPS: 60,
            frameTime: 1000 / 60,
            maxFrameTime: 1000 / 30,
            updateInterval: 1000 / 60
        };
        
        // Pause state tracking
        this.pausePressed = false;
        
        // Debug settings
        this.debug = {
            enabled: false,
            showGrid: false,
            showCoords: false,  // Coordinates off by default - toggleable in options
            showFPS: false      // FPS off by default - toggleable in options
        };
        
        // Load saved options from localStorage
        this.loadSavedOptions();
    }

    loadSavedOptions() {
        try {
            const saved = localStorage.getItem('minequest_options');
            if (saved) {
                const options = JSON.parse(saved);
                console.log('Loading saved options:', options);

                // Apply debug settings
                if (options.showFPS !== undefined) {
                    this.debug.showFPS = options.showFPS;
                }
                if (options.showCoords !== undefined) {
                    this.debug.showCoords = options.showCoords;
                }

                // Apply zoom setting
                if (options.zoomEnabled !== undefined) {
                    this.zoomEnabled = options.zoomEnabled;
                }
                if (options.showGrid !== undefined) {
                    this.debug.showGrid = options.showGrid;
                }

                // Apply fog of war setting (default to disabled if not set)
                if (options.fogOfWar !== undefined) {
                    this.fogOfWar = this.fogOfWar || {};
                    this.fogOfWar.enabled = options.fogOfWar;
                } else {
                    // Default to disabled if no saved option exists
                    this.fogOfWar = this.fogOfWar || {};
                    this.fogOfWar.enabled = false;
                }
            } else {
                // No saved options, set defaults including disabled fog of war
                console.log('No saved options found, setting defaults');
                this.fogOfWar = this.fogOfWar || {};
                this.fogOfWar.enabled = false;
            }
        } catch (e) {
            console.error('Failed to load saved options:', e);
            // Set defaults on error
            this.fogOfWar = this.fogOfWar || {};
            this.fogOfWar.enabled = false;
        }
    }

    async init(mode) {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size based on device type
        this.updateCanvasSize();
        
        // Initialize UI first
        this.initializeUI();
        
        // Load assets
        await this.loadAssets();
        
        // Set game mode
        this.gameMode = mode;
        
        // Initialize game mode
        switch (mode) {
            case GAME_MODES.STANDARD:
                this.currentMode = new StandardMode(this);
                break;
            case GAME_MODES.CUSTOM:
                this.currentMode = new CustomMode(this);
                break;
            case GAME_MODES.GAUNTLET:
                this.currentMode = new GauntletMode(this);
                break;
            case GAME_MODES.DEBUG:
                console.log('Game: Initializing DEBUG MODE');
                this.currentMode = new DebugMode(this);
                break;
            default:
                this.currentMode = new StandardMode(this);
        }
        
        // Initialize game mode
        await this.currentMode.init();
        
        // Sync game state from mode
        this.syncGameState();
        
        // Update UI with current game state immediately
        if (this.ui && typeof this.ui.updateGameInfo === 'function') {
            this.ui.updateGameInfo({
                area: this.currentArea,
                player: this.player,
                gameMode: this.gameMode
            });
        }
        
        // Update stats UI immediately to show correct skill points
        if (this.ui && typeof this.ui.updateStats === 'function' && this.player) {
            this.ui.updateStats(this.player);
        }
        
        // Initialize crafting UI
        this.craftingUI = new CraftingUI(this, this.craftingSystem);
        
        // Set up input handlers
        this.setupInputHandlers();
        
        // Set up resize handler for Android viewport height changes
        this.setupResizeHandler();
        
        // Initialize gamepad
        this.initializeGamepad();
        
        // Set up options listener
        this.setupOptionsListener();
        
        // Set up progression system listeners
        this.setupProgressionListeners();
        
        // Start game loop
        this.start();

        // Dispatch game initialized event
        const event = new CustomEvent('game:initialized', {
            detail: { mode: mode }
        });
        document.dispatchEvent(event);

        console.log('Game: Initialization complete, game:initialized event dispatched');
    }
    
    async loadAssets() {
        console.log('Game: Loading game assets...');
        
        try {
            // Load textures
            await this.loadTextures();
            
            // Load entity sprites
            await this.loadEntitySprites();
            
            // Load player sprites
            await this.loadPlayerSprites();
            
            // Load item sprites
            await this.loadItemSprites();
            
            // Load audio
            await this.audioSystem.loadSounds();
            await this.audioSystem.loadMusic();
            
            // Play main menu music
            this.audioSystem.playMusic('main_menu');
            
            console.log('Game: Assets loaded successfully');
        } catch (error) {
            console.error('Game: Failed to load assets:', error);
            this.handleAssetLoadError(error);
        }
    }
    
    async loadTextures() {
        console.log('Game: Loading textures...');
    
        const textureList = {
            [CELL_TYPES.EMPTY]: ASSET_PATHS.TEXTURES[CELL_TYPES.EMPTY],
            [CELL_TYPES.DIRT]: ASSET_PATHS.TEXTURES[CELL_TYPES.DIRT],
            [CELL_TYPES.ROCK]: ASSET_PATHS.TEXTURES[CELL_TYPES.ROCK],
            [CELL_TYPES.CRYSTAL]: ASSET_PATHS.TEXTURES[CELL_TYPES.CRYSTAL],
            [CELL_TYPES.GEM]: ASSET_PATHS.TEXTURES[CELL_TYPES.GEM],
            [CELL_TYPES.GOLD]: ASSET_PATHS.TEXTURES[CELL_TYPES.GOLD],
            [CELL_TYPES.WALL]: ASSET_PATHS.TEXTURES[CELL_TYPES.WALL],
            [CELL_TYPES.DOOR]: ASSET_PATHS.TEXTURES[CELL_TYPES.DOOR],
            [CELL_TYPES.MERCHANT]: ASSET_PATHS.TEXTURES[CELL_TYPES.MERCHANT],
            [CELL_TYPES.CHEST]: ASSET_PATHS.TEXTURES[CELL_TYPES.CHEST],
            [CELL_TYPES.CHEST_OPENED]: ASSET_PATHS.TEXTURES[CELL_TYPES.CHEST_OPENED],
            [CELL_TYPES.BOSS]: ASSET_PATHS.TEXTURES[CELL_TYPES.BOSS],
            [CELL_TYPES.BEDROCK]: ASSET_PATHS.TEXTURES[CELL_TYPES.BEDROCK],
            [CELL_TYPES.LAVA]: ASSET_PATHS.TEXTURES[CELL_TYPES.LAVA],
            [CELL_TYPES.WATER]: ASSET_PATHS.TEXTURES[CELL_TYPES.WATER],
            [CELL_TYPES.GRASS]: ASSET_PATHS.TEXTURES[CELL_TYPES.GRASS],
            [CELL_TYPES.SAND]: ASSET_PATHS.TEXTURES[CELL_TYPES.SAND],
            [CELL_TYPES.ICE]: ASSET_PATHS.TEXTURES[CELL_TYPES.ICE],
            [CELL_TYPES.OBSIDIAN]: ASSET_PATHS.TEXTURES[CELL_TYPES.OBSIDIAN],
            [CELL_TYPES.DIAMOND]: ASSET_PATHS.TEXTURES[CELL_TYPES.DIAMOND],
            [CELL_TYPES.EMERALD]: ASSET_PATHS.TEXTURES[CELL_TYPES.EMERALD],
            [CELL_TYPES.RUBY]: ASSET_PATHS.TEXTURES[CELL_TYPES.RUBY],
            [CELL_TYPES.SAPPHIRE]: ASSET_PATHS.TEXTURES[CELL_TYPES.SAPPHIRE],
            [CELL_TYPES.AMETHYST]: ASSET_PATHS.TEXTURES[CELL_TYPES.AMETHYST],
            [CELL_TYPES.COAL]: ASSET_PATHS.TEXTURES[CELL_TYPES.COAL],
            [CELL_TYPES.IRON]: ASSET_PATHS.TEXTURES[CELL_TYPES.IRON],
            [CELL_TYPES.COPPER]: ASSET_PATHS.TEXTURES[CELL_TYPES.COPPER],
            [CELL_TYPES.SILVER]: ASSET_PATHS.TEXTURES[CELL_TYPES.SILVER],
            [CELL_TYPES.PLATINUM]: ASSET_PATHS.TEXTURES[CELL_TYPES.PLATINUM],
            [CELL_TYPES.MYTHRIL]: ASSET_PATHS.TEXTURES[CELL_TYPES.MYTHRIL],
            [CELL_TYPES.ADAMANTITE]: ASSET_PATHS.TEXTURES[CELL_TYPES.ADAMANTITE],
            [CELL_TYPES.ENCHANTED]: ASSET_PATHS.TEXTURES[CELL_TYPES.ENCHANTED],
            // crafting cell
            [CELL_TYPES.CRAFTING]: ASSET_PATHS.TEXTURES[CELL_TYPES.CRAFTING],
            // Enemy drop materials
            [CELL_TYPES.GEL]: ASSET_PATHS.TEXTURES[CELL_TYPES.GEL],
            [CELL_TYPES.SILK]: ASSET_PATHS.TEXTURES[CELL_TYPES.SILK],
            [CELL_TYPES.ROTTEN_FLESH]: ASSET_PATHS.TEXTURES[CELL_TYPES.ROTTEN_FLESH],
            [CELL_TYPES.BONE]: ASSET_PATHS.TEXTURES[CELL_TYPES.BONE],
            [CELL_TYPES.DRAGON_SCALE]: ASSET_PATHS.TEXTURES[CELL_TYPES.DRAGON_SCALE],
            [CELL_TYPES.WOOD]: ASSET_PATHS.TEXTURES[CELL_TYPES.WOOD]
        };

        let loadedCount = 0;
        const totalTextures = Object.keys(textureList).length;
        
        for (const [cellType, path] of Object.entries(textureList)) {
            try {
                const texture = await Utils.loadImage(path);
                // Convert cellType string back to number for proper Map key matching
                this.textures.set(parseInt(cellType), texture);
                loadedCount++;
                console.log(`Game: Loaded texture for ${cellType}: ${path}`);
            } catch (error) {
                console.warn(`Failed to load texture ${path}:`, error);
            }
        }
        
        console.log(`Game: Textures loaded: ${loadedCount}/${totalTextures}`);
    }
    
    async loadEntitySprites() {
        console.log('Game: Loading entity sprites...');
        
        const spriteList = {
            'BAT': `${ASSET_PATHS.SPRITES.ENEMIES}bat.png`,
            'SLIME': `${ASSET_PATHS.SPRITES.ENEMIES}slime.png`,
            'SPIDER': `${ASSET_PATHS.SPRITES.ENEMIES}spider.png`,
            'SKELETON': `${ASSET_PATHS.SPRITES.ENEMIES}skeleton.png`,
            'ZOMBIE': `${ASSET_PATHS.SPRITES.ENEMIES}zombie.png`,
            'GOLEM': `${ASSET_PATHS.SPRITES.ENEMIES}golem.png`,
            'MERCHANT': `${ASSET_PATHS.SPRITES.MERCHANT}`,
            'BOSS': `${ASSET_PATHS.SPRITES.ENEMIES}boss.png`
        };

        let loadedCount = 0;
        const totalSprites = Object.keys(spriteList).length;
        
        for (const [entityType, path] of Object.entries(spriteList)) {
            try {
                console.log(`Game: Attempting to load sprite: ${entityType} from ${path}`);
                const sprite = await Utils.loadImage(path);
                this.entitySprites.set(entityType, sprite);
                loadedCount++;
                console.log(`Game: Successfully loaded sprite for ${entityType}: ${path}`);
            } catch (error) {
                console.error(`Game: Failed to load sprite ${path} for ${entityType}:`, error);
            }
        }
        
        console.log(`Game: Entity sprites loaded: ${loadedCount}/${totalSprites}`);
    }
    
    async loadPlayerSprites() {
        console.log('Game: Loading player sprites...');
        
        const playerSpriteList = {
            idle: `${ASSET_PATHS.SPRITES.PLAYER}idle.png`,
            walk_up: `${ASSET_PATHS.SPRITES.PLAYER}walk_up.png`,
            walk_down: `${ASSET_PATHS.SPRITES.PLAYER}walk_down.png`,
            walk_left: `${ASSET_PATHS.SPRITES.PLAYER}walk_left.png`,
            walk_right: `${ASSET_PATHS.SPRITES.PLAYER}walk_right.png`,
            mine: `${ASSET_PATHS.SPRITES.PLAYER}mine.png`
        };

        let loadedCount = 0;
        const totalSprites = Object.keys(playerSpriteList).length;
        
        for (const [spriteName, path] of Object.entries(playerSpriteList)) {
            try {
                console.log(`Game: Attempting to load player sprite: ${spriteName} from ${path}`);
                const sprite = await Utils.loadImage(path);
                this.playerSprites.set(spriteName, sprite);
                loadedCount++;
                console.log(`Game: Successfully loaded player sprite: ${spriteName}: ${path}`);
            } catch (error) {
                console.error(`Game: Failed to load player sprite ${path} for ${spriteName}:`, error);
            }
        }
        
        console.log(`Game: Player sprites loaded: ${loadedCount}/${totalSprites}`);
    }
    
    async loadItemSprites() {
        console.log('Game: Loading item sprites...');
        
        const itemSpriteList = {
            // Equipment
            WOODEN_PICKAXE: ASSET_PATHS.ITEMS.WOODEN_PICKAXE,
            STONE_PICKAXE: ASSET_PATHS.ITEMS.STONE_PICKAXE,
            IRON_PICKAXE: ASSET_PATHS.ITEMS.IRON_PICKAXE,
            GOLD_PICKAXE: ASSET_PATHS.ITEMS.GOLD_PICKAXE,
            DIAMOND_PICKAXE: ASSET_PATHS.ITEMS.DIAMOND_PICKAXE,
            LEATHER_HELMET: ASSET_PATHS.ITEMS.LEATHER_HELMET,
            IRON_HELMET: ASSET_PATHS.ITEMS.IRON_HELMET,
            DIAMOND_HELMET: ASSET_PATHS.ITEMS.DIAMOND_HELMET,
            LEATHER_ARMOR: ASSET_PATHS.ITEMS.LEATHER_ARMOR,
            IRON_ARMOR: ASSET_PATHS.ITEMS.IRON_ARMOR,
            DIAMOND_ARMOR: ASSET_PATHS.ITEMS.DIAMOND_ARMOR,
            LEATHER_BOOTS: ASSET_PATHS.ITEMS.LEATHER_BOOTS,
            IRON_BOOTS: ASSET_PATHS.ITEMS.IRON_BOOTS,
            DIAMOND_BOOTS: ASSET_PATHS.ITEMS.DIAMOND_BOOTS,
            POWER_GLOVES: ASSET_PATHS.ITEMS.POWER_GLOVES,
            LUCKY_AMULET: ASSET_PATHS.ITEMS.LUCKY_AMULET,
            // Consumables
            HEALTH_POTION: ASSET_PATHS.ITEMS.HEALTH_POTION,
            SPEED_POTION: ASSET_PATHS.ITEMS.SPEED_POTION,
            STRENGTH_POTION: ASSET_PATHS.ITEMS.STRENGTH_POTION,
            LUCK_POTION: ASSET_PATHS.ITEMS.LUCK_POTION
        };

        let loadedCount = 0;
        const totalSprites = Object.keys(itemSpriteList).length;
        
        for (const [itemType, path] of Object.entries(itemSpriteList)) {
            try {
                // Check if the file exists (simple check by trying to load)
                console.log(`Game: Attempting to load item sprite: ${itemType} from ${path}`);
                const sprite = await Utils.loadImage(path);
                this.itemSprites.set(itemType, sprite);
                loadedCount++;
                console.log(`Game: Successfully loaded item sprite: ${itemType}: ${path}`);
            } catch (error) {
                console.warn(`Game: Failed to load item sprite ${path} for ${itemType}:`, error.message);
                // Continue loading other sprites - this is expected for placeholder files
            }
        }
        
        console.log(`Game: Item sprites loaded: ${loadedCount}/${totalSprites}`);
        
        // Log what sprites were loaded
        console.log('Game: Loaded item sprites:');
        for (const [key, sprite] of this.itemSprites) {
            console.log(`  - ${key}: ${sprite.src}`);
        }
    }
    
    initializeUI() {
        if (this.ui) {
            console.log('Game: UI already initialized, skipping reinitialization');
            return;
        }

        console.log('Game: Initializing UI...');
        // Create UI instance
        this.ui = new UI();

        // Link UI to game instance
        this.ui.game = this;

        // Set save/load UI on the UI instance
        if (this.ui && typeof this.ui.setSaveLoadUI === 'function') {
            this.ui.setSaveLoadUI(this.saveLoadUI);
            console.log('Game: SaveLoadUI set on UI instance');
        }

        // Set up UI event listeners
        this.setupUIEventListeners();

        // Force UI to update with current game state after initialization
        if (this.ui && typeof this.ui.updateGameInfo === 'function') {
            this.ui.updateGameInfo({
                area: this.currentArea,
                player: this.player,
                gameMode: this.gameMode
            });
        }

        console.log('Game: All critical elements found, proceeding with initialization...');

        // Initialize SkillsUI BEFORE setting up event listeners
        if (this.ui) {
            this.ui.game = this;

            // Initialize SkillsUI
            if (this.ui.setGame) {
                this.ui.setGame(this);
            }
        }

        // Set up UI event listeners
        this.setupUIEventListeners();

        console.log('Game: UI initialized');
    }
    
    setupUIEventListeners() {
        // Set up UI event listeners
        this.ui.setEventListeners({
            inventoryClick: (e) => this.handleInventoryClick(e.detail),
            inventoryRightClick: (e) => this.handleInventoryRightClick(e.detail),
            equipmentClick: (e) => this.handleEquipmentClick(e.detail),
            equipmentRightClick: (e) => this.handleEquipmentRightClick(e.detail),
            inventoryMove: (e) => this.handleInventoryMove(e.detail),
            contextMenuAction: (e) => this.handleContextMenuAction(e.detail),
            inventoryDrop: (e) => this.handleInventoryDrop(e.detail),
            inventoryEquip: (e) => this.handleInventoryEquip(e.detail),
            inventoryUse: (e) => this.handleInventoryUse(e.detail),
            equipmentUnequip: (e) => this.handleEquipmentUnequip(e.detail),
            saveGame: (e) => this.saveGame(e.detail),
            loadGame: (e) => this.loadGame(e.detail),
            healthUpdate: (e) => this.handleHealthUpdate(e.detail),
            experienceUpdate: (e) => this.handleExperienceUpdate(e.detail),
            miningProgress: (e) => this.handleMiningProgress(e.detail),
            canvasResized: (e) => this.handleCanvasResized(e.detail),
            skillUnlock: (e) => this.handleSkillUnlock(e.detail),
            materialsConsumed: (e) => this.handleMaterialsConsumed(e.detail)
        });
    }
    
    setupInputHandlers() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
        
        // D-pad button events for touch controls
        this.setupDPadHandlers();
    }
    
    handleKeyDown(e) {
        // Prevent default behavior for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }
        
        this.input.keyboard.add(e.code);
    }
    
    handleKeyUp(e) {
        this.input.keyboard.delete(e.code);
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        this.input.mouse.pressed = true;
        this.input.mouse.x = e.clientX;
        this.input.mouse.y = e.clientY;
        this.input.mouse.button = e.button;
    }
    
    handleMouseUp(e) {
        this.input.mouse.pressed = false;
        this.input.mouse.x = e.clientX;
        this.input.mouse.y = e.clientY;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouse.x = e.clientX - rect.left;
        this.input.mouse.y = e.clientY - rect.top;
        
        // Calculate world coordinates
        const gridX = Math.floor(this.input.mouse.x / this.currentCellSize);
        const gridY = Math.floor(this.input.mouse.y / this.currentCellSize);
        this.input.mouse.worldX = gridX + this.viewport.x;
        this.input.mouse.worldY = gridY + this.viewport.y;
        
        // Update tooltip
        this.updateTooltip();
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        // Prevent default context menu
        // Context menu functionality can be implemented later
    }
    
    isGameKey(keyCode) {
        // Define which keys are used by the game
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'Space', 'KeyP', 'KeyQ', 'KeyE', 'KeyZ', 'Escape'
        ];
        return gameKeys.includes(keyCode);
    }
    
    setupDPadHandlers() {
        // Set up event listeners for d-pad buttons
        const dPadButtons = document.querySelectorAll('.d-pad-btn');
        
        dPadButtons.forEach(button => {
            const direction = button.dataset.direction;
            
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleDPadPress(direction, true);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleDPadPress(direction, false);
            });
            
            // Mouse events (for testing on PC)
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleDPadPress(direction, true);
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleDPadPress(direction, false);
            });
            
            button.addEventListener('mouseleave', (e) => {
                // Release button if mouse leaves while pressed
                this.handleDPadPress(direction, false);
            });
        });
    }
    
    handleDPadPress(direction, pressed) {
        // Map d-pad directions to keyboard codes
        const keyMap = {
            'up': 'KeyW',
            'down': 'KeyS', 
            'left': 'KeyA',
            'right': 'KeyD'
        };
        
        const keyCode = keyMap[direction];
        if (!keyCode) return;
        
        if (pressed) {
            // Add to pressed keys set
            this.input.keyboard.add(keyCode);
        } else {
            // Remove from pressed keys set
            this.input.keyboard.delete(keyCode);
        }
    }

    handleResize() {
        // Handle window resize
        this.ui.handleResize();
        
        // Update canvas size for mobile devices
        if (document.body.classList.contains('mobile-device')) {
            // Delay slightly to allow DOM to settle
            setTimeout(() => {
                this.updateCanvasSize();
            }, 50);
        }
    }

    setupResizeHandler() {
        // Handle viewport height changes for mobile devices (Android address bar)
        this.updateViewportHeight();
        
        // Listen for viewport changes
        window.addEventListener('resize', Utils.debounce(() => {
            this.updateViewportHeight();
            this.handleResize();
        }, 50));
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            // Delay to allow viewport to settle after orientation change
            setTimeout(() => {
                this.updateViewportHeight();
                this.handleResize();
            }, 100);
        });
        
        // Listen for visual viewport changes (Android Chrome address bar)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', Utils.debounce(() => {
                this.updateViewportHeight();
                // Also update canvas size for mobile
                if (document.body.classList.contains('mobile-device')) {
                    this.updateCanvasSize();
                }
            }, 50));
        }
    }
    
    updateViewportHeight() {
        // Update CSS custom property for dynamic viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Also set a fixed viewport height for touch controls positioning
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
        
        console.log('Game: Updated viewport height:', viewportHeight);
    }

    updateCanvasSize() {
        // Check if this is a mobile device
        const isMobile = document.body.classList.contains('mobile-device');
        
        if (isMobile) {
            // For mobile: Calculate canvas size based on available space
            // The canvas container should fill the available space between top and bottom UI
            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                // Get the computed style to get actual dimensions
                const containerRect = canvasContainer.getBoundingClientRect();
                const availableWidth = containerRect.width;
                const availableHeight = containerRect.height;
                
                // Calculate cell size to fit 13x13 grid in available space
                const cellSize = Math.min(
                    Math.floor(availableWidth / GRID_SIZE),
                    Math.floor(availableHeight / GRID_SIZE)
                );
                
                // Ensure minimum cell size
                this.currentCellSize = Math.max(cellSize, 32); // Minimum 32px for readability
                
                // Set canvas size
                const canvasSize = GRID_SIZE * this.currentCellSize;
                this.canvas.width = canvasSize;
                this.canvas.height = canvasSize;
                
                // Update CSS for proper scaling
                this.canvas.style.width = `${canvasSize}px`;
                this.canvas.style.height = `${canvasSize}px`;
                this.canvas.style.maxWidth = '100%';
                this.canvas.style.maxHeight = '100%';
                
                console.log(`Game: Mobile canvas resized to ${canvasSize}x${canvasSize} (${this.currentCellSize}px cells)`);
            }
        } else {
            // For desktop: Use fixed size
            this.currentCellSize = CELL_SIZE;
            this.canvas.width = CANVAS_SIZE;
            this.canvas.height = CANVAS_SIZE;
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            this.canvas.style.maxWidth = '';
            this.canvas.style.maxHeight = '';
            
            console.log('Game: Desktop canvas size set to fixed size');
        }
    }

    handleSkillUnlock(e) {
        const { skillId, treeId } = e.detail || e;
        console.log('Game: Handle skill unlock:', skillId, treeId);

        if (!this.skillSystem || !this.player) return;

        const result = this.skillSystem.unlockSkill(skillId, treeId);

        if (result.success) {
            // Apply effects to player
            this.applySkillEffects(result.effects, result.newLevel);

            // Update UI
            if (this.ui && typeof this.ui.updateSkills === 'function') {
                this.ui.updateSkills(this.skillSystem);
            }
            if (this.ui && typeof this.ui.updateStats === 'function') {
                this.ui.updateStats(this.player);
            }

            this.ui.showNotification(`Skill "${result.skillId}" unlocked!`, 'success');
        } else {
            this.ui.showNotification(`Cannot unlock skill: ${result.reason}`, 'error');
        }
    }

    setupProgressionListeners() {
        // Achievement system events
        this.achievementSystem.addListener((event, data) => {
            switch (event) {
                case 'achievementUnlocked':
                    if (this.ui && typeof this.ui.showNotification === 'function') {
                        this.ui.showNotification(`Achievement Unlocked: ${data.achievement.name}!`, 'success', 5000);
                    }
                    // Play achievement sound
                    if (this.audioSystem) {
                        this.audioSystem.playAchievementSound();
                    }
                    break;
                case 'experienceGained':
                    if (this.player) {
                        this.player.gainExperience(data.amount);
                    }
                    break;
                case 'coinsGained':
                    if (this.player) {
                        this.player.coins += data.amount;
                    }
                    break;
            }
        });

        // Skill system events
        this.skillSystem.addListener((event, data) => {
            switch (event) {
                case 'skillUnlocked':
                    if (this.ui && typeof this.ui.showNotification === 'function') {
                        this.ui.showNotification(`Skill Unlocked: ${data.skillId}!`, 'success', 3000);
                    }
                    // Apply skill effects to player
                    if (this.player) {
                        this.applySkillEffects(data.effects, data.newLevel);
                    }
                    break;
                case 'applySkillEffects':
                    if (this.player) {
                        this.applySkillEffects(data.effects, data.level);
                    }
                    break;
            }
        });

        // Crafting system events
        this.craftingSystem.addListener((event, data) => {
            switch (event) {
                case 'itemCrafted':
                    if (this.player) {
                        this.player.inventory.addItem(data.item);
                        if (this.ui && typeof this.ui.showNotification === 'function') {
                            this.ui.showNotification(`Crafted: ${data.item.name}!`, 'success', 3000);
                        }
                    }
                    break;
                case 'craftingStarted':
                    if (this.ui && typeof this.ui.showNotification === 'function') {
                        this.ui.showNotification(`Crafting: ${data.recipe.name}...`, 'info', data.craftTime / 1000);
                    }
                    break;
            }
        });

        // Enhancement system events
        // this.enhancementSystem.addListener((event, data) => {
        //     switch (event) {
        //         case 'enhancementCompleted':
        //             if (this.player && this.player.equipment) {
        //                 // Replace equipment in player's inventory/equipment
        //                 this.replaceEquipment(data.originalEquipment, data.enhancedEquipment);
        //                 this.ui.showNotification(`Enhanced: ${data.enhancedEquipment.name}!`, 'success', 3000);
        //             }
        //             break;
        //         case 'enhancementStarted':
        //             this.ui.showNotification(`Enhancing: ${data.recipe.name}...`, 'info', data.enhancementTime / 1000);
        //             break;
        //     }
        // });

        // Player events
        document.addEventListener('criticalHit', (e) => {
            this.achievementSystem.updateStat('critical_hits', 1);
        });

        document.addEventListener('rareDropFound', (e) => {
            this.achievementSystem.updateStat('rare_drop_found', true);
        });

        document.addEventListener('rareMaterialMined', (e) => {
            this.achievementSystem.updateStat('rare_drop_found', true);
        });

        document.addEventListener('legendaryMaterialMined', (e) => {
            this.achievementSystem.updateStat('legendary_mined', 1);
        });

        document.addEventListener('fullyEquipped', (e) => {
            this.achievementSystem.updateStat('fully_equipped', true);
        });

        document.addEventListener('legendaryEquipped', (e) => {
            this.achievementSystem.updateStat('legendary_equipped', true);
        });

        document.addEventListener('playerLevelUp', (e) => {
            this.achievementSystem.updateStat('level_reached', e.detail.newLevel);
        });
    }

    applySkillEffects(effects, level) {
        if (!this.player) return;

        // Apply skill effects to player stats
        for (const [stat, value] of Object.entries(effects)) {
            if (stat === 'berserker' || stat === 'immortal' || stat === 'autoMine') {
                // Handle special effects
                if (stat === 'autoMine') {
                    this.player.autoMine = effects[stat];
                }
            } else {
                // Apply to base stats
                this.player.baseStats[stat] = (this.player.baseStats[stat] || 0) + (value * level);
            }
        }

        this.player.updateStats();
    }

    replaceEquipment(originalEquipment, enhancedEquipment) {
        if (!this.player || !this.player.equipment) return;

        // Find the slot containing the original equipment
        const slot = this.player.equipment.findItem(originalEquipment.id);
        if (slot) {
            // Replace in equipment
            this.player.equipment.unequip(slot.slot);
            this.player.equipment.equip(enhancedEquipment, slot.slot);

            // Also replace in inventory if it exists there
            if (this.player.inventory) {
                this.player.inventory.removeItem(originalEquipment.id);
                this.player.inventory.addItem(enhancedEquipment);
            }
        }

        this.player.updateStats();
    }

    handleAssetLoadError(error) {
        console.error('Game: Asset loading failed:', error);
        
        // Show error message but continue with initialization
        if (this.ui && typeof this.ui.showNotification === 'function') {
            this.ui.showNotification(
                'Asset Loading Warning',
                `Failed to load some assets: ${error.message}`,
                'warning',
                5000
            );
        }
    }

    handleInventoryClick(e) {
        console.log('Game: Inventory click:', e);
        if (!this.player || !this.player.inventory) return;

        const { slotIndex } = e.detail || e;
        const item = this.player.inventory.getSlot(slotIndex);

        if (!item) return;

        // Show context menu with "Use Item" option for equipment and consumables
        if (item.type === 'equipment' || item.type === 'consumable') {
            const menuItems = [{
                text: 'Use Item',
                action: 'useItem',
                data: { index: slotIndex, item }
            }];

            // Get mouse position for context menu
            const mousePos = this.input.mouse;
            this.ui.showContextMenu(mousePos.x, mousePos.y, menuItems);
        }
    }

    handleInventoryRightClick(e) {
        console.log('Game: Inventory right click:', e);
        // Implementation will be added later
    }

    handleEquipmentClick(e) {
        console.log('Game: Equipment click:', e);
        if (!this.player || !this.player.equipment) return;

        const { slotType } = e.detail || e;
        const item = this.player.equipment.getSlot(slotType);

        if (item) {
            // Show context menu with "Unequip" option
            const menuItems = [{
                text: 'Unequip',
                action: 'unequipItem',
                data: { slotType, item }
            }];

            // Get mouse position for context menu
            const mousePos = this.input.mouse;
            this.ui.showContextMenu(mousePos.x, mousePos.y, menuItems);
        }
    }

    handleEquipmentRightClick(e) {
        console.log('Game: Equipment right click:', e);
        // Implementation will be added later
    }

    handleContextMenuAction(e) {
        const { action, data } = e.detail || e;
        console.log('Game: Context menu action:', action, data);

        switch (action) {
            case 'useItem':
                this.handleUseItem(data);
                break;
            case 'unequipItem':
                this.unequipItem(data);
                break;
            default:
                console.warn('Game: Unknown context menu action:', action);
        }
    }

    handleUseItem(data) {
        const { index, item } = data;

        if (item.type === 'equipment') {
            this.equipItem(index, item);
        } else if (item.type === 'consumable') {
            this.useConsumable(index, item);
        }
    }

    equipItem(inventoryIndex, item) {
        if (!this.player || !this.player.equipment) return;

        // Get the equipment slot for this item
        const slotType = item.slot;

        // Check if slot is valid
        if (!slotType) {
            this.ui.showNotification('This item cannot be equipped', 'error');
            return;
        }

        // Get current item in slot
        const currentItem = this.player.equipment.getSlot(slotType);

        // Try to equip the new item
        const result = this.player.equipment.equip(item, slotType);

        if (result.success) {
            // Remove from inventory
            this.player.inventory.removeItem(inventoryIndex);

            // If there was a previous item, add it to inventory
            if (result.previousItem) {
                this.player.inventory.addItem(result.previousItem);
                this.ui.showNotification(`Equipped ${item.name}, ${result.previousItem.name} moved to inventory`, 'success');
            } else {
                this.ui.showNotification(`Equipped ${item.name}`, 'success');
            }

            // Update player stats
            this.player.updateStats();

            // Play equip sound
            if (this.audioSystem) {
                this.audioSystem.playSound('equip');
            }
        } else {
            this.ui.showNotification(result.reason, 'error');
        }
    }

    useConsumable(inventoryIndex, item) {
        if (!this.player) return;

        // Apply consumable effects
        this.applyConsumableEffects(item);

        // Remove from inventory
        this.player.inventory.removeItem(inventoryIndex);

        // Show notification
        this.ui.showNotification(`Used ${item.name}`, 'success');

        // Add status effect for visual feedback
        this.player.addStatusEffect(item.effect, item.duration || 10000); // Default 10 seconds

        // Play use sound
        if (this.audioSystem) {
            this.audioSystem.playSound('heal'); // Or a generic use sound
        }
    }

    applyConsumableEffects(item) {
        switch (item.effect) {
            case 'heal':
                const healAmount = item.healAmount || 50;
                const healed = this.player.heal(healAmount);
                this.ui.showNotification(`Healed for ${healed} HP`, 'success');
                break;

            case 'strength':
                this.player.addStatusEffect('strength', item.duration || 30000, item.strengthBonus || 5);
                break;

            case 'defense_boost':
                this.player.addStatusEffect('defense_boost', item.duration || 30000, item.defenseBonus || 3);
                break;

            case 'haste':
                this.player.addStatusEffect('haste', item.duration || 30000, item.speedBonus || 0.5);
                break;

            case 'luck':
                this.player.addStatusEffect('luck', item.duration || 30000, item.luckBonus || 10);
                break;

            default:
                console.warn('Unknown consumable effect:', item.effect);
        }
    }

    saveGame(slot) {
        console.log('Game: Save game to slot:', slot);

        try {
            if (!this.currentMode) {
                console.error('Game: No current mode to save');
                return false;
            }

            // Get save data from current mode
            const saveData = this.currentMode.getSaveData();

            // Add additional game state
            saveData.gameState = {
                isPaused: this.isPaused,
                debug: this.debug,
                viewport: this.viewport,
                zoomLevel: this.zoomLevel,
                currentCellSize: this.currentCellSize
            };

            // Add story manager data
            if (this.storyManager) {
                saveData.storyManager = this.storyManager.serialize();
            }

            // Add skill system data
            if (this.skillSystem) {
                saveData.skillSystem = this.skillSystem.serialize();
            }

            // Save to localStorage
            localStorage.setItem(`minequest_save_${slot}`, JSON.stringify(saveData));

            // Show confirmation
            if (this.ui) {
                this.ui.showNotification('Game saved successfully!', 'success', 3000);
            }

            console.log('Game: Save completed');
            return true;

        } catch (error) {
            console.error('Game: Save failed:', error);
            if (this.ui) {
                this.ui.showNotification('Failed to save game', 'error', 3000);
            }
            return false;
        }
    }

    async loadGameFromData(saveData) {
        console.log('=== Game.loadGameFromData called with saveData:', saveData);
        console.log('Game: Loading game from save data:', saveData);
        console.log('Game: currentMode:', this.currentMode);
        console.log('Game: currentMode type:', this.currentMode ? this.currentMode.constructor.name : 'null');

        try {
            if (!this.currentMode) {
                console.error('Game: No current mode to load into');
                return false;
            }

            console.log('Game: About to call currentMode.loadGame');
            // Load save data into current mode
            await this.currentMode.loadGame(saveData);
            console.log('Game: currentMode.loadGame completed successfully');

            // Restore additional game state
            if (saveData.gameState) {
                this.isPaused = saveData.gameState.isPaused || false;
                this.debug = saveData.gameState.debug || this.debug;
                this.viewport = saveData.gameState.viewport || this.viewport;
                this.zoomLevel = saveData.gameState.zoomLevel || this.zoomLevel;
                this.currentCellSize = saveData.gameState.currentCellSize || this.currentCellSize;
            }

            // Restore story manager data
            if (saveData.storyManager && this.storyManager) {
                this.storyManager.deserialize(saveData.storyManager);
            }

            // Restore skill system data
            if (saveData.skillSystem && this.skillSystem) {
                this.skillSystem.deserialize(saveData.skillSystem);
            }

            // Sync game state
            this.syncGameState();

            // Show confirmation
            if (this.ui) {
                this.ui.showNotification('Game loaded successfully!', 'success', 3000);
            }

            console.log('Game: Load completed');
            return true;

        } catch (error) {
            console.error('Game: Load failed:', error);
            if (this.ui) {
                this.ui.showNotification('Failed to load game', 'error', 3000);
            }
            return false;
        }
    }

    handleHealthUpdate(e) {
        console.log('Game: Health update:', e);
        // Implementation will be added later
    }

    handleExperienceUpdate(e) {
        console.log('Game: Experience update:', e);
        // Implementation will be added later
    }

    handleMiningProgress(e) {
        console.log('Game: Mining progress:', e);
        // Implementation will be added later
    }

    handleSkillUnlock(e) {
        const { skillId, treeId } = e;
        const result = this.skillSystem.unlockSkill(skillId, treeId);
        
        if (result.success) {
            // Sync skill points back to player
            if (this.player) {
                this.player.skillPoints = this.skillSystem.skillPoints;
            }
            
            // Update UI to reflect the unlocked skill
            if (this.ui && this.ui.updateSkills) {
                this.ui.updateSkills(this.skillSystem);
            }
        }
    }

    handleCanvasResized(e) {
        console.log('Game: Canvas resized to:', e.width, 'x', e.height);
        // The UI handles the canvas resizing, we just need to acknowledge the event
        // Viewport size remains constant (GRID_SIZE), only cell size changes
    }


    initializeGamepad() {
        // Check for gamepad support
        if (navigator.getGamepads) {
            window.addEventListener('gamepadconnected', (e) => {
                console.log('Gamepad connected:', e.gamepad);
                this.input.gamepad = e.gamepad;
            });
            
            window.addEventListener('gamepaddisconnected', (e) => {
                console.log('Gamepad disconnected:', e.gamepad);
                this.input.gamepad = null;
            });
        }
    }
    
    setupOptionsListener() {
        // Listen for options changes from UI
        document.addEventListener('optionsChanged', (e) => {
            const options = e.detail;
            console.log('Game: Options changed:', options);
            
            // Apply debug settings
            if (options.showFPS !== undefined) {
                this.debug.showFPS = options.showFPS;
            }
            if (options.showCoords !== undefined) {
                this.debug.showCoords = options.showCoords;
            }
            if (options.showGrid !== undefined) {
                this.debug.showGrid = options.showGrid;
            }
            
            // Apply fog of war setting
            if (options.fogOfWar !== undefined) {
                this.fogOfWar = this.fogOfWar || {};
                this.fogOfWar.enabled = options.fogOfWar;
            }
            if (this.audioSystem && typeof this.audioSystem.setMusicVolume === 'function') {
                if (options.musicVolume !== undefined) {
                    this.audioSystem.setMusicVolume(options.musicVolume / 100);
                }
            }
            if (this.audioSystem && typeof this.audioSystem.setSFXVolume === 'function') {
                if (options.sfxVolume !== undefined) {
                    this.audioSystem.setSFXVolume(options.sfxVolume / 100);
                }
            }
        });
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        if (this.isPaused) return; // Already paused
        
        this.isPaused = true;
        
        // Pause audio system with null check
        if (this.audioSystem && typeof this.audioSystem.pauseMusic === 'function') {
            this.audioSystem.pauseMusic();
        }
        if (this.audioSystem && typeof this.audioSystem.pauseAllSounds === 'function') {
            this.audioSystem.pauseAllSounds();
        }
        
        console.log('Game paused');
    }
    
    resume() {
        if (!this.isPaused) return; // Already running
        
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Resume audio system with null check
        if (this.audioSystem && typeof this.audioSystem.resumeMusic === 'function') {
            this.audioSystem.resumeMusic();
        }
        
        console.log('Game resumed');
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Limit delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, this.performance.maxFrameTime);
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Always check pause/unpause input (even when paused)
        this.processPauseInput();
        
        // Update game logic
        if (!this.isPaused) {
            this.update(clampedDeltaTime);
        }
        
        // Render game
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            
            if (this.debug.showFPS) {
                console.log(`FPS: ${this.fps}`);
            }
        }
    }
    
    update(deltaTime) {
        // Update current game mode
        if (this.currentMode) {
            this.currentMode.update(deltaTime);

            // Update crafting system
            if (this.craftingUI && this.craftingUI.isOpen) {
                this.craftingUI.update(deltaTime);
            }

            // Check for player death
            if (this.player && this.player.health <= 0) {
                this.handlePlayerDeath();
                return; // Stop updating if player is dead
            }

            // Sync game state
            this.syncGameState();
        }

        // Update animations
        this.updateAnimations(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);
        
        // Update damage numbers
        this.updateDamageNumbers(deltaTime);

        // Update viewport
        this.updateViewport();

        // Process input
        this.processInput();

        // Update UI with latest stats
        this.ui.updateGameInfo({
            area: this.currentArea,
            player: this.player,
            gameMode: this.gameMode
        });
    }

    syncGameState() {
        // Sync game state from current mode
        if (this.currentMode.currentArea) {
            this.currentArea = this.currentMode.currentArea;
        }

        if (this.currentMode.player) {
            this.player = this.currentMode.player;
            // Use the player's skill system as the game's skill system
            this.skillSystem = this.player.skillSystem;
            // Provide game reference to player for auto-mining functionality
            this.player.setGame(this);
        }

        if (this.currentMode.fogOfWar) {
            this.fogOfWar = this.currentMode.fogOfWar;
        }
    }

    handlePlayerDeath() {
        console.log('Game: Player has died');
        
        // Stop the game loop
        this.isRunning = false;

        if (this.ui?.showDwarvenAnnouncement) {
            this.ui.showDwarvenAnnouncement({
                title: 'Song of the Fallen',
                subtitle: 'Your legend meets a quiet anvil',
                body: 'The echoes of battle fade as your strength leaves the stone. Another dwarf must rise.',
                variant: 'danger',
                duration: 5200,
                onClose: () => this.showGameOverDialog()
            });
        } else {
            // Fallback if UI system cannot render announcement
            this.showGameOverDialog();
        }
    }
    
    showGameOverDialog() {
        const buttons = [
            {
                text: 'Load Game',
                action: () => {
                    this.hideGameOverDialog();
                    this.ui.showLoadMenu();
                }
            },
            {
                text: 'Restart Quest',
                action: () => {
                    this.hideGameOverDialog();
                    this.resetGame();
                    this.ui.showMainMenu();
                }
            },
            {
                text: 'Quit to Desktop',
                action: () => {
                    if (window.close) {
                        window.close();
                    }
                }
            }
        ];

        this.ui.showDialog('Game Over', 'Your journey has ended...', buttons);
    }
    
    updateAnimations(deltaTime) {
        for (const [id, animation] of this.animations) {
            animation.elapsed += deltaTime;
            
            if (animation.elapsed >= animation.duration) {
                if (animation.loop) {
                    animation.elapsed = 0;
                } else {
                    this.animations.delete(id);
                    if (animation.onComplete) {
                        animation.onComplete();
                    }
                }
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (const [id, particle] of this.particles) {
            particle.update(deltaTime);
            
            if (particle.isDead()) {
                this.particles.delete(id);
            }
        }
    }
    
    updateDamageNumbers(deltaTime) {
        for (const [id, damageNumber] of this.damageNumbers) {
            damageNumber.elapsed += deltaTime;
            
            if (damageNumber.elapsed >= damageNumber.duration) {
                this.damageNumbers.delete(id);
            } else {
                // Update position (floating upward)
                damageNumber.y -= damageNumber.speed * deltaTime;
                damageNumber.alpha = 1 - (damageNumber.elapsed / damageNumber.duration);
            }
        }
    }
    
    createDamageNumber(x, y, damage, isCritical = false, isHeal = false, source = 'player') {
        const id = ++this.damageNumberId;
        
        // Stack damage numbers vertically by checking existing ones at this position
        let verticalOffset = 0;
        for (const [, existingNumber] of this.damageNumbers) {
            if (existingNumber.originX === x && existingNumber.originY === y) {
                verticalOffset = Math.max(verticalOffset, existingNumber.verticalOffset + 1);
            }
        }
        
        this.damageNumbers.set(id, {
            x,
            y,
            originX: x,
            originY: y,
            damage,
            isCritical,
            isHeal,
            elapsed: 0,
            duration: 1000, // Fixed 1 second duration for all damage numbers
            speed: 1.2,
            alpha: 1.0,
            verticalOffset,
            source,
            id: id // Add id for easier reference
        });
    }
    
    updateViewport() {
        if (!this.player) return;
        
        // Center viewport on player (center of grid)
        this.viewport.x = Math.floor(this.player.x - Math.floor(this.viewport.width / 2));
        this.viewport.y = Math.floor(this.player.y - Math.floor(this.viewport.height / 2));
        
        // Clamp viewport to area bounds
        if (this.currentArea) {
            this.viewport.x = Utils.clamp(this.viewport.x, 0, this.currentArea.width - this.viewport.width);
            this.viewport.y = Utils.clamp(this.viewport.y, 0, this.currentArea.height - this.viewport.height);
        }
    }
    
    processPauseInput() {
        // Pause/Resume toggle (always check, even when paused)
        if (this.input.keyboard.has('Space') || this.input.keyboard.has('KeyP')) {
            if (!this.pausePressed) {
                this.pausePressed = true;
                if (this.isPaused) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
        } else {
            this.pausePressed = false;
        }
    }
    
    processInput() {
        if (!this.player || !this.currentArea) return;
        
        // Process keyboard input
        this.processKeyboardInput();
        
        // Process mouse input
        this.processMouseInput();
        
        // Process touch input
        this.processTouchInput();
        
        // Process gamepad input
        this.processGamepadInput();
    }
    
    processKeyboardInput() {
        // Skip input processing if paused or missing game objects
        if (this.isPaused || !this.player || !this.currentArea) {
            return;
        }
        
        let dx = 0, dy = 0;
        
        // Movement - handle both WASD and arrow keys
        const moveUpKeys = Array.isArray(CONTROLS.KEYBOARD.MOVE_UP) ? CONTROLS.KEYBOARD.MOVE_UP : [CONTROLS.KEYBOARD.MOVE_UP];
        const moveDownKeys = Array.isArray(CONTROLS.KEYBOARD.MOVE_DOWN) ? CONTROLS.KEYBOARD.MOVE_DOWN : [CONTROLS.KEYBOARD.MOVE_DOWN];
        const moveLeftKeys = Array.isArray(CONTROLS.KEYBOARD.MOVE_LEFT) ? CONTROLS.KEYBOARD.MOVE_LEFT : [CONTROLS.KEYBOARD.MOVE_LEFT];
        const moveRightKeys = Array.isArray(CONTROLS.KEYBOARD.MOVE_RIGHT) ? CONTROLS.KEYBOARD.MOVE_RIGHT : [CONTROLS.KEYBOARD.MOVE_RIGHT];
        
        if (moveUpKeys.some(key => this.input.keyboard.has(key))) dy = -1;
        if (moveDownKeys.some(key => this.input.keyboard.has(key))) dy = 1;
        if (moveLeftKeys.some(key => this.input.keyboard.has(key))) dx = -1;
        if (moveRightKeys.some(key => this.input.keyboard.has(key))) dx = 1;
        
        // Handle movement
        if (dx !== 0 || dy !== 0) {
            const targetX = this.player.x + dx;
            const targetY = this.player.y + dy;
            
            // Check if target cell has an enemy - attack instead of moving
            const enemyKey = Utils.coordToKey(targetX, targetY);
            if (this.currentArea && this.currentArea.enemies.has(enemyKey)) {
                const enemy = this.currentArea.enemies.get(enemyKey);
                this.attackEnemy(enemy);
                // Play enemy sound
                this.audioSystem.playEnemySound(enemy.type);
                // Clear movement keys so attack doesn't repeat
                ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(key => {
                    this.input.keyboard.delete(key);
                });
                return;
            }
            
            // Check if target cell is minable - start mining instead of moving (only if player is not already mining)
            const targetCell = this.currentArea?.getCell(targetX, targetY);
            if (targetCell && this.player.canMine(targetCell) && !this.player.isMining) {
                const distance = Utils.manhattanDistance(this.player.x, this.player.y, targetX, targetY);
                if (distance === 1) {
                    if (this.player.startMining(targetX, targetY, this.currentArea)) {
                        this.createMiningEffect(targetX, targetY);
                        // Clear movement keys so mining doesn't repeat
                        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(key => {
                            this.input.keyboard.delete(key);
                        });
                    }
                }
                return;
            }
            
            // Normal movement
            const moved = this.player.move(dx, dy, this.currentArea);
            if (moved) {
                this.onPlayerMoved();
                // Play walking sound
                this.audioSystem.playWalkingSound();
            }
        }
        
        // Mining
        if (this.input.keyboard.has(CONTROLS.KEYBOARD.MINE)) {
            this.handleMining();
        }
        
        // Interact
        if (this.input.keyboard.has(CONTROLS.KEYBOARD.INTERACT)) {
            this.handleInteraction();
        }
    }
    
    processMouseInput() {
        if (!this.input.mouse.pressed) return;
        
        // Convert mouse position to grid coordinates
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((this.input.mouse.x - rect.left) / CELL_SIZE);
        const y = Math.floor((this.input.mouse.y - rect.top) / CELL_SIZE);
        
        // Handle mouse actions
        this.handleMouseAction(x, y);
    }
    
    processTouchInput() {
        if (!this.input.touch.active) return;
        
        // Convert touch position to grid coordinates
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((this.input.touch.currentX - rect.left) / CELL_SIZE);
        const y = Math.floor((this.input.touch.currentY - rect.top) / CELL_SIZE);
        
        // Handle touch actions
        this.handleTouchAction(x, y);
    }
    
    processGamepadInput() {
        if (!this.input.gamepad) return;
        
        // Get gamepad state
        const gamepad = navigator.getGamepads()[this.input.gamepad.index];
        if (!gamepad) return;
        
        let dx = 0, dy = 0;
        
        // D-pad movement
        if (gamepad.buttons[12].pressed) dy = -1; // D-pad up
        if (gamepad.buttons[13].pressed) dy = 1;  // D-pad down
        if (gamepad.buttons[14].pressed) dx = -1; // D-pad left
        if (gamepad.buttons[15].pressed) dx = 1;  // D-pad right
        
        // Analog stick movement
        if (Math.abs(gamepad.axes[0]) > 0.5) {
            dx = Math.sign(gamepad.axes[0]);
        }
        if (Math.abs(gamepad.axes[1]) > 0.5) {
            dy = Math.sign(gamepad.axes[1]);
        }
        
        // Handle movement
        if (dx !== 0 || dy !== 0) {
            if (this.player.move(dx, dy, this.currentArea)) {
                this.onPlayerMoved();
            }
        }
        
        // Handle buttons
        if (gamepad.buttons[0].pressed) { // A button
            this.handleMining();
        }
        
        if (gamepad.buttons[1].pressed) { // B button
            this.handleInteraction();
        }
    }
    
    handleMining() {
        if (!this.player || !this.currentArea || !this.audioSystem) return;
        
        // Get target position based on player facing direction
        let targetX = this.player.x;
        let targetY = this.player.y;
        
        switch (this.player.facingDirection) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }
        
        // Play pickaxe swing sound with null check
        if (this.audioSystem.playSound) {
            this.audioSystem.playSound('pickaxe_swing');
        }
        
        // Start mining
        if (this.player.startMining(targetX, targetY, this.currentArea)) {
            this.createMiningEffect(targetX, targetY);
            // Play mining sound based on material type
            const targetCell = this.currentArea.getCell(targetX, targetY);
            this.audioSystem.playMiningSound(targetCell);
        }
    }
    
    handleInteraction() {
        if (!this.player || !this.currentArea) return;
        
        // Check for nearby interactable objects
        const key = Utils.coordToKey(this.player.x, this.player.y);
        
        // Check for merchant
        if (this.currentArea.merchants.has(key)) {
            const merchant = this.currentArea.merchants.get(key);
            this.interactWithMerchant(merchant);
            // Play merchant greeting sound
            if (this.audioSystem && this.audioSystem.playMerchantSound) {
                this.audioSystem.playMerchantSound();
            }
        }
        
        // Check for chest
        if (this.currentArea.chests.has(key)) {
            const chest = this.currentArea.chests.get(key);
            // Always allow reopening chests to take remaining items
            this.openChest(chest);
        }
    }
    
    handleMouseAction(x, y) {
        // Convert to world coordinates
        const worldX = x + this.viewport.x;
        const worldY = y + this.viewport.y;
        
        // Check if clicking on adjacent cell for mining
        const distance = Utils.manhattanDistance(this.player.x, this.player.y, worldX, worldY);
        if (distance === 1) {
            if (this.player.startMining(worldX, worldY, this.currentArea)) {
                this.createMiningEffect(worldX, worldY);
                // Play mining sound based on material type
                const targetCell = this.currentArea.getCell(worldX, worldY);
                this.audioSystem.playMiningSound(targetCell);
            }
        }
        
        // Check if clicking on enemy for attack
        const enemyKey = Utils.coordToKey(worldX, worldY);
        if (this.currentArea.enemies.has(enemyKey)) {
            const enemy = this.currentArea.enemies.get(enemyKey);
            this.attackEnemy(enemy);
            // Play enemy sound
            this.audioSystem.playEnemySound(enemy.type);
        }
    }
    
    handleTouchAction(x, y) {
        // Similar to mouse action but with touch-specific handling
        this.handleMouseAction(x, y);
    }
    
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.currentArea) return;
        
        // Save context state
        this.ctx.save();
        
        // Render game layers
        this.renderTerrain();
        this.renderMiningProgress();
        this.renderObjects();
        this.renderEntities();
        this.renderPlayer();
        this.renderEffects();
        this.renderFogOfWar();
        this.renderDebug();
        
        // Render pause overlay if paused
        if (this.isPaused) {
            this.renderPauseOverlay();
        }
        
        // Render tooltip
        this.renderTooltip();

        // Render status effect icons
        this.renderStatusEffectIcons();

        // Restore context state
        this.ctx.restore();
    }
    
    renderTerrain() {
        for (let y = 0; y < this.viewport.height; y++) {
            for (let x = 0; x < this.viewport.width; x++) {
                const worldX = x + this.viewport.x;
                const worldY = y + this.viewport.y;

                const cell = this.currentArea.getCell(worldX, worldY);
                if (cell === null) continue;

                this.renderCell(x, y, cell);
            }
        }
    }
    
    renderMiningProgress() {
        if (!this.player || !this.player.isMining || !this.player.miningTarget) return;

        const { x, y } = this.player.miningTarget;
        const screenX = (x - this.viewport.x) * CELL_SIZE;
        const screenY = (y - this.viewport.y) * CELL_SIZE;

        // Only render if cell is on screen
        if (screenX >= -CELL_SIZE && screenX < this.canvas.width &&
            screenY >= -CELL_SIZE && screenY < this.canvas.height) {

            // Draw progress bar background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(screenX + 2, screenY + 2, CELL_SIZE - 4, 4);

            // Draw progress bar fill
            const progress = this.player.miningProgress;
            const progressColor = progress > 0.8 ? '#FF4444' : progress > 0.5 ? '#FFFF44' : '#44FF44';

            this.ctx.fillStyle = progressColor;
            this.ctx.fillRect(screenX + 2, screenY + 2, (CELL_SIZE - 4) * progress, 4);

            // Draw progress bar border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenX + 2, screenY + 2, CELL_SIZE - 4, 4);
        }
    }
    
    renderCell(screenX, screenY, cellType) {
        const x = screenX * this.currentCellSize;
        const y = screenY * this.currentCellSize;
        
        // Try to use texture if available
        const texture = this.textures.get(cellType);
        
        if (texture) {
            // Draw texture
            this.ctx.drawImage(texture, x, y, this.currentCellSize, this.currentCellSize);
        } else {
            // Use color placeholder
            let color = this.getCellColor(cellType);
            
            // Draw cell
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, this.currentCellSize, this.currentCellSize);
            
            // Don't draw text labels - will be replaced by hover tooltips
        }
    }
    
    getCellColor(cellType) {
        const colorMap = {
            [CELL_TYPES.EMPTY]: '#1a1a1a',
            [CELL_TYPES.DIRT]: '#8B4513',
            [CELL_TYPES.ROCK]: '#808080',
            [CELL_TYPES.CRYSTAL]: '#E0FFFF',
            [CELL_TYPES.GEM]: '#FF69B4',
            [CELL_TYPES.GOLD]: '#FFD700',
            [CELL_TYPES.WALL]: '#2F4F4F',
            [CELL_TYPES.DOOR]: '#4B0082',
            [CELL_TYPES.MERCHANT]: '#FFFF00',
            [CELL_TYPES.CHEST]: '#8B4513',
            [CELL_TYPES.CHEST_OPENED]: '#7b6262ff', // Darker brown for opened chest
            [CELL_TYPES.BOSS]: '#8B0000',
            [CELL_TYPES.BEDROCK]: '#2F4F4F',
            [CELL_TYPES.LAVA]: '#FF4500',
            [CELL_TYPES.WATER]: '#4682B4',
            [CELL_TYPES.GRASS]: '#32CD32',
            [CELL_TYPES.SAND]: '#F4A460',
            [CELL_TYPES.ICE]: '#87CEEB',
            [CELL_TYPES.OBSIDIAN]: '#1C1C1C',
            [CELL_TYPES.DIAMOND]: '#B9F2FF',
            [CELL_TYPES.EMERALD]: '#50C878',
            [CELL_TYPES.RUBY]: '#E0115F',
            [CELL_TYPES.SAPPHIRE]: '#0F52BA',
            [CELL_TYPES.AMETHYST]: '#9966CC',
            [CELL_TYPES.COAL]: '#36454F',
            [CELL_TYPES.IRON]: '#B87333',
            [CELL_TYPES.COPPER]: '#B87333',
            [CELL_TYPES.SILVER]: '#C0C0C0',
            [CELL_TYPES.PLATINUM]: '#E5E4E2',
            [CELL_TYPES.MYTHRIL]: '#4169E1',
            [CELL_TYPES.ADAMANTITE]: '#FF0000',
            [CELL_TYPES.ENCHANTED]: '#9370DB',
            // Enemy drop materials
            [CELL_TYPES.GEL]: '#32CD32',
            [CELL_TYPES.SILK]: '#F5F5DC',
            [CELL_TYPES.ROTTEN_FLESH]: '#556B2F',
            [CELL_TYPES.BONE]: '#F5F5DC',
            [CELL_TYPES.DRAGON_SCALE]: '#8B0000'
        };
        return colorMap[cellType] || '#1a1a1a';
    }
    
    getCellTypeName(cellType) {
        const nameMap = {
            [CELL_TYPES.EMPTY]: 'Empty',
            [CELL_TYPES.DIRT]: 'Dirt',
            [CELL_TYPES.ROCK]: 'Rock',
            [CELL_TYPES.CRYSTAL]: 'Crystal',
            [CELL_TYPES.GEM]: 'Gem',
            [CELL_TYPES.GOLD]: 'Gold',
            [CELL_TYPES.WALL]: 'Wall',
            [CELL_TYPES.DOOR]: 'Exit',
            [CELL_TYPES.CHEST]: 'Chest',
            [CELL_TYPES.CHEST_OPENED]: 'Opened Chest',
            [CELL_TYPES.BEDROCK]: 'Bedrock',
            [CELL_TYPES.LAVA]: 'Lava',
            [CELL_TYPES.WATER]: 'Water',
            [CELL_TYPES.GRASS]: 'Grass',
            [CELL_TYPES.SAND]: 'Sand',
            [CELL_TYPES.ICE]: 'Ice',
            [CELL_TYPES.OBSIDIAN]: 'Obsidian',
            [CELL_TYPES.DIAMOND]: 'Diamond',
            [CELL_TYPES.EMERALD]: 'Emerald',
            [CELL_TYPES.RUBY]: 'Ruby',
            [CELL_TYPES.SAPPHIRE]: 'Sapphire',
            [CELL_TYPES.AMETHYST]: 'Amethyst',
            [CELL_TYPES.COAL]: 'Coal',
            [CELL_TYPES.IRON]: 'Iron',
            [CELL_TYPES.COPPER]: 'Copper',
            [CELL_TYPES.SILVER]: 'Silver',
            [CELL_TYPES.PLATINUM]: 'Platinum',
            [CELL_TYPES.MYTHRIL]: 'Mythril',
            [CELL_TYPES.ADAMANTITE]: 'Adamantite',
            [CELL_TYPES.ENCHANTED]: 'Enchanted',
            // Enemy drop materials
            [CELL_TYPES.GEL]: 'Gel',
            [CELL_TYPES.SILK]: 'Silk',
            [CELL_TYPES.ROTTEN_FLESH]: 'Rotten Flesh',
            [CELL_TYPES.BONE]: 'Bone',
            [CELL_TYPES.DRAGON_SCALE]: 'Dragon Scale'
        };
        return nameMap[cellType] || '';
    }
    
    renderObjects() {
        if (!this.currentArea) return;
        
        // Render chests
        for (const [key, chest] of this.currentArea.chests) {
            const screenX = (chest.x - this.viewport.x) * CELL_SIZE;
            const screenY = (chest.y - this.viewport.y) * CELL_SIZE;
            
            // Try to use chest texture
            const textureKey = chest.isOpened ? CELL_TYPES.CHEST_OPENED : CELL_TYPES.CHEST;
            const texture = this.textures.get(textureKey);
            
            if (texture) {
                // Draw texture
                this.ctx.drawImage(texture, screenX, screenY, CELL_SIZE, CELL_SIZE);
            } else {
                // Fallback: Draw chest visual based on opened state
                if (chest.isOpened) {
                    // Opened chest - darker and more empty looking
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(screenX + 2, screenY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(screenX + 4, screenY + 4, CELL_SIZE - 8, CELL_SIZE - 8);
                } else {
                    // Closed chest
                    this.ctx.fillStyle = COLORS.CHEST;
                    this.ctx.fillRect(screenX + 2, screenY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                    
                    // Draw chest lid
                    this.ctx.fillStyle = '#A0522D';
                    this.ctx.fillRect(screenX + 5, screenY + 5, CELL_SIZE - 10, 8);
                }
            }
            
            // Draw chest type label
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const textX = screenX + CELL_SIZE / 2;
            const textY = screenY + CELL_SIZE / 2;
            
            this.ctx.strokeText(chest.name, textX, textY);
            this.ctx.fillText(chest.name, textX, textY);
            
            // Reset text align
            this.ctx.textAlign = 'start';
            this.ctx.textBaseline = 'alphabetic';
        }
        
        // Render merchants
        for (const [key, merchant] of this.currentArea.merchants) {
            const screenX = (merchant.x - this.viewport.x) * CELL_SIZE;
            const screenY = (merchant.y - this.viewport.y) * CELL_SIZE;
            
            // Try to use merchant sprite if available
            const sprite = this.entitySprites.get('MERCHANT');
            
            if (sprite) {
                // Draw sprite image
                this.ctx.drawImage(sprite, screenX, screenY, CELL_SIZE, CELL_SIZE);
            } else {
                // Fallback: Draw merchant circle
                this.ctx.fillStyle = COLORS.MERCHANT;
                this.ctx.beginPath();
                this.ctx.arc(screenX + CELL_SIZE/2, screenY + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw merchant label
                this.ctx.fillStyle = '#000000';
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const textX = screenX + CELL_SIZE / 2;
                const textY = screenY + CELL_SIZE / 2;
                
                this.ctx.strokeText('Merchant', textX, textY);
                this.ctx.fillText('Merchant', textX, textY);
                
                // Reset text align
                this.ctx.textAlign = 'start';
                this.ctx.textBaseline = 'alphabetic';
            }
        }
    }
    
    renderEntities() {
        if (!this.currentArea) return;
        
        // Render enemies
        for (const [key, enemy] of this.currentArea.enemies) {
            const enemyPos = enemy.getRenderPosition();
            const screenX = (enemyPos.x - this.viewport.x) * CELL_SIZE;
            const screenY = (enemyPos.y - this.viewport.y) * CELL_SIZE;
            
            // Check if enemy is visible on screen (considering multi-cell size)
            const enemyScreenWidth = enemy.width * CELL_SIZE;
            const enemyScreenHeight = enemy.height * CELL_SIZE;
            const isVisible = screenX + enemyScreenWidth > -CELL_SIZE && 
                            screenX < this.canvas.width + CELL_SIZE &&
                            screenY + enemyScreenHeight > -CELL_SIZE && 
                            screenY < this.canvas.height + CELL_SIZE;
            
            if (!isVisible) continue;
            
            // Try to use sprite if available
            let sprite = null;
            let spriteKey = '';
            
            // Special handling for bosses - Dragon uses BOSS sprite
            if (enemy.isBoss && enemy.type === 'DRAGON') {
                spriteKey = 'BOSS';
                sprite = this.entitySprites.get('BOSS');
            } else {
                // Try entity sprite first (for golem)
                spriteKey = enemy.type ? enemy.type.toUpperCase() : 'UNKNOWN';
                sprite = this.entitySprites.get(spriteKey);
                
                // Fallback to texture if no entity sprite
                if (!sprite) {
                    sprite = this.textures[CELL_TYPES.BOSS]; // Use boss texture as fallback
                }
            }
            
            if (sprite) {
                // For multi-cell enemies, stretch the sprite across multiple cells
                this.ctx.drawImage(sprite, screenX, screenY, enemyScreenWidth, enemyScreenHeight);
            } else {
                // Fallback: Draw enemy as colored rectangle for multi-cell
                this.ctx.fillStyle = enemy.color || COLORS.ENEMY;
                this.ctx.fillRect(screenX, screenY, enemyScreenWidth, enemyScreenHeight);
                
                // Draw border to show multi-cell structure
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenX, screenY, enemyScreenWidth, enemyScreenHeight);
            }
            
            // Draw enemy name label (only if no sprite or for debugging)
            if (!sprite) {
                const enemyName = enemy.type || 'Enemy';
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.font = 'bold 8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const textX = screenX + (enemyScreenWidth / 2);
                const textY = screenY + (enemyScreenHeight / 2);
                
                this.ctx.strokeText(enemyName, textX, textY);
                this.ctx.fillText(enemyName, textX, textY);
            }
            
            // Draw health bar (scaled for multi-cell enemies)
            if (enemy.health && enemy.maxHealth) {
                const healthBarWidth = Math.min(enemyScreenWidth - 8, 60); // Cap at reasonable size
                const healthBarHeight = 4;
                const healthBarX = screenX + Math.max(4, (enemyScreenWidth - healthBarWidth) / 2);
                const healthBarY = screenY + enemyScreenHeight - 8;
                
                // Background
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
                
                // Health fill
                const healthPercent = enemy.health / enemy.maxHealth;
                let healthColor = '#00FF00'; // Green for full health
                if (healthPercent < 0.6) healthColor = '#FFFF00'; // Yellow for medium
                if (healthPercent < 0.3) healthColor = '#FF0000'; // Red for low
                
                this.ctx.fillStyle = healthColor;
                this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
                
                // Border
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            }
            
            // Mark boss enemies
            if (enemy.isBoss) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.strokeText('BOSS', screenX + enemyScreenWidth / 2, screenY - 2);
                this.ctx.fillText('BOSS', screenX + enemyScreenWidth / 2, screenY - 2);
            }
            
            // Reset text align
            this.ctx.textAlign = 'start';
            this.ctx.textBaseline = 'alphabetic';
        }
    }
    
    renderPlayer() {
        if (!this.player) {
            console.warn('renderPlayer: No player object');
            return;
        }
        
        // Get player position relative to viewport
        const playerPos = this.player.getRenderPosition();
        const screenX = (playerPos.x - this.viewport.x) * CELL_SIZE;
        const screenY = (playerPos.y - this.viewport.y) * CELL_SIZE;
        
        // Determine which sprite to use based on player state
        let spriteKey = 'idle';
        
        if (this.player.isMining && this.playerSprites.has('mine')) {
            spriteKey = 'mine';
        } else if (this.player.isMoving) {
            // Determine direction for walking animation
            switch (this.player.facingDirection) {
                case 'up':
                    spriteKey = this.playerSprites.has('walk_up') ? 'walk_up' : 'idle';
                    break;
                case 'down':
                    spriteKey = this.playerSprites.has('walk_down') ? 'walk_down' : 'idle';
                    break;
                case 'left':
                    spriteKey = this.playerSprites.has('walk_left') ? 'walk_left' : 'idle';
                    break;
                case 'right':
                    spriteKey = this.playerSprites.has('walk_right') ? 'walk_right' : 'idle';
                    break;
                default:
                    spriteKey = 'idle';
            }
        }
        
        // Get the sprite image
        const sprite = this.playerSprites.get(spriteKey);
        
        if (sprite) {
            // Draw sprite image
            this.ctx.drawImage(sprite, screenX, screenY, CELL_SIZE, CELL_SIZE);
        } else {
            // Fallback: Draw colored circle if sprite not available
            this.ctx.fillStyle = COLORS.PLAYER || '#00FF00';
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX + CELL_SIZE/2, screenY + CELL_SIZE/2, CELL_SIZE/2 - 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw direction indicator
            this.ctx.fillStyle = '#FFFFFF';
            let indicatorX = screenX + CELL_SIZE/2;
            let indicatorY = screenY + CELL_SIZE/2;
            
            switch (this.player.facingDirection) {
                case 'up':
                    indicatorY -= 10;
                    break;
                case 'down':
                    indicatorY += 10;
                    break;
                case 'left':
                    indicatorX -= 10;
                    break;
                case 'right':
                    indicatorX += 10;
                    break;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw player label (for debugging)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        const textX = screenX + CELL_SIZE / 2;
        const textY = screenY + CELL_SIZE + 2;
        
        this.ctx.strokeText('Player', textX, textY);
        this.ctx.fillText('Player', textX, textY);
        
        // Reset text align
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
        
        // Render status effect icons
        this.renderStatusEffectIcons();
    }
    
    renderStatusEffectIcons() {
        if (!this.player || !this.player.statusEffects) return;

        const iconSize = 32;
        const margin = 10;
        let x = margin;
        const y = 80; // Position under the info bar

        for (const [effectName, effectData] of this.player.statusEffects) {
            // Skip damage effect (visual flash, not a buff/debuff)
            if (effectName === 'damage' || effectName === 'levelup') continue;

            // Get icon texture
            let iconTexture = null;
            if (effectName === 'strength') {
                iconTexture = this.textures.get(CELL_TYPES.DIAMOND); // Use diamond as strength icon
            } else if (effectName === 'defense_boost') {
                iconTexture = this.textures.get(CELL_TYPES.IRON); // Use iron as defense icon
            } else if (effectName === 'haste') {
                iconTexture = this.textures.get(CELL_TYPES.GOLD); // Use gold as speed icon
            } else if (effectName === 'luck') {
                iconTexture = this.textures.get(CELL_TYPES.GEM); // Use gem as luck icon
            } else if (effectName === 'heal') {
                iconTexture = this.textures.get(CELL_TYPES.CRYSTAL); // Use crystal as heal icon
            }

            // Draw background circle
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(x + iconSize/2, y + iconSize/2, iconSize/2 + 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw icon texture or fallback
            if (iconTexture) {
                this.ctx.drawImage(iconTexture, x, y, iconSize, iconSize);
            } else {
                // Fallback: colored circle based on effect type
                let color = '#FFFFFF';
                if (effectName === 'strength') color = '#FF4444';
                else if (effectName === 'defense_boost') color = '#4444FF';
                else if (effectName === 'haste') color = '#44FF44';
                else if (effectName === 'luck') color = '#FFFF44';
                else if (effectName === 'heal') color = '#FF44FF';

                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(x + iconSize/2, y + iconSize/2, iconSize/2 - 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw countdown timer
            const remainingTime = Math.max(0, effectData.duration);
            const totalDuration = effectData.originalDuration || effectData.duration;
            const timeRatio = remainingTime / totalDuration;

            // Draw timer arc
            this.ctx.strokeStyle = timeRatio > 0.5 ? '#00FF00' : timeRatio > 0.25 ? '#FFFF00' : '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x + iconSize/2, y + iconSize/2, iconSize/2 + 1, -Math.PI/2, -Math.PI/2 + (timeRatio * 2 * Math.PI));
            this.ctx.stroke();

            // Draw time remaining text
            const secondsLeft = Math.ceil(remainingTime / 1000);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.strokeText(secondsLeft.toString(), x + iconSize/2, y + iconSize/2);
            this.ctx.fillText(secondsLeft.toString(), x + iconSize/2, y + iconSize/2);

            // Reset text alignment
            this.ctx.textAlign = 'start';
            this.ctx.textBaseline = 'alphabetic';

            x += iconSize + margin;
        }
    }
    
    renderEffects() {
        // ... (rest of the code remains the same)
        this.renderDamageNumbers();
        
        // Render animations
        for (const [id, animation] of this.animations) {
            // TODO: Implement animation rendering
        }
    }
    
    renderDamageNumbers() {
        for (const [id, damageNumber] of this.damageNumbers) {
            // Convert world coordinates to screen coordinates
            const screenX = (damageNumber.x - this.viewport.x) * CELL_SIZE + CELL_SIZE / 2;
            const screenY = (damageNumber.y - this.viewport.y) * CELL_SIZE
                - (damageNumber.verticalOffset * 38)
                - (CELL_SIZE * 0.35);
            
            // Skip if off-screen
            if (screenX < -50 || screenX > this.canvas.width + 50 ||
                screenY < -50 || screenY > this.canvas.height + 50) {
                continue;
            }
            
            this.ctx.save();
            this.ctx.globalAlpha = damageNumber.alpha;
            
            // Set color based on damage type
            let color = COLORS.DAMAGE_PHYSICAL; // Default red
            if (damageNumber.isHeal) {
                color = COLORS.DAMAGE_HEAL; // Green for healing
            } else if (damageNumber.source === 'player') {
                color = '#ffe066';
            } else {
                color = '#ff4d4d';
            }
            if (damageNumber.isCritical && !damageNumber.isHeal) {
                color = '#fff175';
            }

            // Draw damage number with outline
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;

            const baseFontSize = damageNumber.isHeal ? 30 : 34;
            const fontSize = damageNumber.isCritical ? baseFontSize + 4 : baseFontSize;
            this.ctx.font = `900 ${fontSize}px 'Cinzel', Arial, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const text = damageNumber.damage.toString();

            // Draw stroke first, then fill
            this.ctx.strokeText(text, screenX, screenY);
            this.ctx.fillText(text, screenX, screenY);
            
            this.ctx.restore();
        }
    }
    
    renderFogOfWar() {
        if (!this.fogOfWar) return;
        
        // Render fog of war
        this.fogOfWar.render(this.ctx, this.viewport);
    }
    
    renderDebug() {
        // Check if any debug feature is enabled
        if (!this.debug.showGrid && !this.debug.showCoords && !this.debug.showFPS) return;
        
        // Draw grid
        if (this.debug.showGrid) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            
            for (let x = 0; x <= GRID_SIZE; x++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x * CELL_SIZE, 0);
                this.ctx.lineTo(x * CELL_SIZE, CANVAS_SIZE);
                this.ctx.stroke();
            }
            
            for (let y = 0; y <= GRID_SIZE; y++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y * CELL_SIZE);
                this.ctx.lineTo(CANVAS_SIZE, y * CELL_SIZE);
                this.ctx.stroke();
            }
        }
        
        // Draw coordinates
        if (this.debug.showCoords) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '10px Arial';
            
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const worldX = x + this.viewport.x;
                    const worldY = y + this.viewport.y;
                    
                    this.ctx.fillText(`${worldX},${worldY}`, x * CELL_SIZE + 2, y * CELL_SIZE + 10);
                }
            }
        }
        
        // Draw FPS
        if (this.debug.showFPS) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
        }
    }
    
    renderPauseOverlay() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pause text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Draw instructions
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE or P to resume', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Draw border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(50, 50, this.canvas.width - 100, this.canvas.height - 100);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    createMiningEffect(x, y) {
        // Create mining particles
        for (let i = 0; i < 5; i++) {
            const particle = new Particle(
                x * CELL_SIZE + CELL_SIZE / 2,
                y * CELL_SIZE + CELL_SIZE / 2,
                Utils.randomFloat(-2, 2),
                Utils.randomFloat(-2, 2),
                '#FFD700'
            );
            this.particles.set(particle.id, particle);
        }
    }
    
    onPlayerMoved() {
        // Trigger player moved event
        document.dispatchEvent(new CustomEvent('playerMoved', {
            detail: { player: this.player }
        }));
    }
    
    onAreaChanged(area) {
        // Trigger area changed event
        document.dispatchEvent(new CustomEvent('areaChanged', {
            detail: { area: area }
        }));
        
        // Play area-specific music
        this.playAreaMusic(area);
    }
    
    playAreaMusic(area) {
        // Play ambient cave music for all areas for a cohesive lowfi experience
        this.audioSystem.playMusic('ambient_cave');
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        // Only zoom if enabled in options
        if (!this.zoomEnabled) return;
        
        // Zoom in/out with mouse wheel
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed; // Scroll down = zoom out, scroll up = zoom in
        
        // Update zoom level
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
        
        // Update cell size based on zoom
        this.currentCellSize = Math.floor(this.baseCellSize * this.zoomLevel);
        
        // Update viewport dimensions (cells visible)
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        this.viewport.width = Math.floor(canvasWidth / this.currentCellSize);
        this.viewport.height = Math.floor(canvasHeight / this.currentCellSize);
        
        // Center viewport on player if exists
        if (this.player) {
            this.updateViewport();
        }
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.input.touch.active = true;
        this.input.touch.startX = touch.clientX;
        this.input.touch.startY = touch.clientY;
        this.input.touch.currentX = touch.clientX;
        this.input.touch.currentY = touch.clientY;
    }
    
    handleTouchMove(e) {
        const touch = e.touches[0];
        this.input.touch.currentX = touch.clientX;
        this.input.touch.currentY = touch.clientY;
    }
    
    handleTouchEnd(e) {
        this.input.touch.active = false;
    }
    
    // UI event handlers
    handleInventoryClick(e) {
        console.log('Game: Inventory click:', e);
        if (!this.player || !this.player.inventory) return;

        const { slotIndex } = e.detail || e;
        const item = this.player.inventory.getSlot(slotIndex);

        if (!item) return;

        // Show context menu with "Use Item" option for equipment and consumables
        if (item.type === 'equipment' || item.type === 'consumable') {
            const menuItems = [{
                text: 'Use Item',
                action: 'useItem',
                data: { index: slotIndex, item }
            }];

            // Get mouse position for context menu
            const mousePos = this.input.mouse;
            this.ui.showContextMenu(mousePos.x, mousePos.y, menuItems);
        }
    }
    
    handleInventoryRightClick(e) {
        // Handle inventory right click
        console.log('Inventory right click:', e);
    }
    
    handleEquipmentClick(e) {
        console.log('Game: Equipment click:', e);
        if (!this.player || !this.player.equipment) return;

        const { slotType } = e.detail || e;
        const item = this.player.equipment.getSlot(slotType);

        if (item) {
            // Show context menu with "Unequip" option
            const menuItems = [{
                text: 'Unequip',
                action: 'unequipItem',
                data: { slotType, item }
            }];

            // Get mouse position for context menu
            const mousePos = this.input.mouse;
            this.ui.showContextMenu(mousePos.x, mousePos.y, menuItems);
        }
    }
    
    handleEquipmentRightClick(e) {
        // Handle equipment right click
        console.log('Equipment right click:', e);
    }
    
    handleInventoryMove(e) {
        // Handle inventory move
        console.log('Inventory move:', e);
    }
    
    handleContextMenuAction(e) {
        const { action, data } = e.detail || e;
        console.log('Game: Context menu action:', action, data);

        switch (action) {
            case 'useItem':
                this.handleUseItem(data);
                break;
            case 'unequipItem':
                this.unequipItem(data);
                break;
            default:
                console.warn('Game: Unknown context menu action:', action);
        }
    }
    
    handleInventoryDrop(e) {
        const { slotIndex } = e.detail || e;
        console.log('Game: Handle inventory drop for slot:', slotIndex);
        
        if (!this.player || !this.player.inventory) return;
        
        const item = this.player.inventory.getSlot(slotIndex);
        if (!item) return;
        
        // Confirm drop
        this.ui.showConfirmDialog(
            'Drop Item',
            `Are you sure you want to drop ${item.name}? This action cannot be undone.`,
            () => {
                // Remove item from inventory
                this.player.inventory.removeItem(slotIndex);
                
                // Show notification
                this.ui.showNotification(`Dropped ${item.name}`, 'info');
                
                // Clear selection and update UI
                this.ui.selectedInventorySlot = -1;
                this.ui.updateInventory(this.player.inventory);
                this.ui.updateInventoryButtonStates();
                
                // Clear tooltip if it was showing for this slot
                this.ui.hideTooltip();
            }
        );
    }
    
    handleInventoryEquip(e) {
        const { slotIndex } = e.detail || e;
        console.log('Game: Handle inventory equip for slot:', slotIndex);
        
        if (!this.player || !this.player.inventory) return;
        
        const item = this.player.inventory.getSlot(slotIndex);
        if (!item || item.type !== 'equipment') return;
        
        this.equipItem(slotIndex, item);
        
        // Clear selection and update UI
        this.ui.selectedInventorySlot = -1;
        this.ui.updateInventory(this.player.inventory);
        this.ui.updateInventoryButtonStates();
        
        // Clear tooltip if it was showing for this slot
        this.ui.hideTooltip();
    }
    
    equipItem(inventoryIndex, item) {
        if (!this.player || !this.player.equipment) return;

        // Get the equipment slot for this item
        const slotType = item.slot;

        // Check if slot is valid
        if (!slotType) {
            this.ui.showNotification('This item cannot be equipped', 'error');
            return;
        }

        // Get current item in slot
        const currentItem = this.player.equipment.getSlot(slotType);

        // Try to equip the new item
        const result = this.player.equipment.equip(item, slotType);

        if (result.success) {
            // Remove from inventory
            this.player.inventory.removeItem(inventoryIndex);

            // If there was a previous item, add it to inventory
            if (currentItem) {
                const added = this.player.inventory.addItem(currentItem);
                if (added) {
                    this.ui.showNotification(`Equipped ${item.name}, ${currentItem.name} moved to inventory`, 'success');
                } else {
                    // If inventory is full, put it back in equipment
                    this.player.equipment.equip(currentItem, slotType);
                    this.ui.showNotification('Inventory full! Could not equip item.', 'error');
                    return;
                }
            } else {
                this.ui.showNotification(`Equipped ${item.name}`, 'success');
            }

            // Update player stats
            this.player.updateStats();

            // Update equipment UI
            this.ui.updateEquipment(this.player.equipment);
            this.ui.updateEquipmentButtonStates();

            // Play equip sound
            if (this.audioSystem) {
                this.audioSystem.playSound('equip');
            }
        } else {
            this.ui.showNotification(result.reason, 'error');
        }
    }
    
    handleInventoryUse(e) {
        const { slotIndex } = e.detail || e;
        console.log('Game: Handle inventory use for slot:', slotIndex);
        
        if (!this.player || !this.player.inventory) return;
        
        const item = this.player.inventory.getSlot(slotIndex);
        if (!item || item.type !== 'consumable') return;
        
        this.useConsumable(slotIndex, item);
        
        // Clear selection and update UI
        this.ui.selectedInventorySlot = -1;
        this.ui.updateInventory(this.player.inventory);
        this.ui.updateInventoryButtonStates();
        
        // Clear tooltip if it was showing for this slot
        this.ui.hideTooltip();
    }
    
    handleEquipmentUnequip(e) {
        const { slotType } = e.detail || e;
        console.log('Game: Handle equipment unequip for slot:', slotType);
        
        if (!this.player || !this.player.equipment) return;
        
        const item = this.player.equipment.getSlot(slotType);
        if (!item) return;
        
        // Confirm unequip
        this.ui.showConfirmDialog(
            'Unequip Item',
            `Unequip ${item.name}?`,
            () => {
                this.unequipItem({ slotType, item });
                
                // Clear selection and update UI
                this.ui.selectedEquipmentSlot = null;
                
                // Force hide any active tooltips before updating UI
                this.ui.hideTooltip();
                
                this.ui.updateEquipment(this.player.equipment);
                this.ui.updateEquipmentButtonStates();
            }
        );
    }

    unequipItem(data) {
        const { slotType, item } = data;

        if (!this.player || !this.player.equipment) return;

        // Try to unequip the item
        const result = this.player.equipment.unequip(slotType);

        if (result.success) {
            // Add the item back to inventory
            const added = this.player.inventory.addItem(result.item);

            if (added) {
                this.ui.showNotification(`Unequipped ${item.name}`, 'success');

                // Update player stats
                this.player.updateStats();

                // Play unequip sound
                if (this.audioSystem) {
                    this.audioSystem.playSound('unequip');
                }
                
                // Update inventory UI to show the newly added item
                this.ui.updateInventory(this.player.inventory);
                
                // Clear tooltip if it was showing for this slot
                this.ui.hideTooltip();
                
                // Also update equipment UI to clear any lingering tooltips
                this.ui.updateEquipment(this.player.equipment);
            } else {
                // If inventory is full, put it back in equipment
                this.player.equipment.equip(result.item, slotType);
                this.ui.showNotification('Inventory full! Could not unequip item.', 'error');
            }
        } else {
            this.ui.showNotification(result.reason, 'error');
        }
    }

    handleHealthUpdate(e) {
        // Handle health update
        console.log('Health update:', e);
    }
    attackEnemy(enemy) {
        if (!this.player || !enemy) return;
        
        // Calculate damage using player's attack method
        const damage = this.player.attack(enemy);
        
        // Create damage number at enemy position with vertical stacking
        const enemyPos = enemy.getRenderPosition();
        this.createDamageNumber(enemyPos.x, enemyPos.y, damage, this.player.lastAttackWasCritical, false, 'player');
        
        console.log(`Player attacked ${enemy.type} for ${damage} damage`);
        
        // Check if enemy died
        if (enemy.health <= 0) {
            console.log(`${enemy.type} defeated!`);
            
            // Award experience and coins
            this.player.gainExperience(enemy.experienceValue);
            this.player.coins += enemy.coins;
            
            // Remove enemy from area
            this.currentArea.enemies.delete(Utils.coordToKey(enemy.x, enemy.y));
            
            // Play defeat sound
            this.audioSystem.playSound(`${enemy.type.toLowerCase()}_defeat`);
            
            // Track achievements
            this.achievementSystem.updateStat('enemies_defeated', 1, { isBoss: enemy.isBoss });
            if (enemy.isBoss) {
                this.achievementSystem.updateStat('bosses_defeated', 1);
            }
            
            // Check if this was a boss enemy
            if (enemy.isBoss) {
                console.log(`Boss ${enemy.type} defeated!`);
                // Show boss defeated announcement
                if (this.ui && typeof this.ui.showBossDefeatedAnnouncement === 'function') {
                    this.ui.showBossDefeatedAnnouncement();
                }
            }
            
            // Trigger enemy defeated event
            document.dispatchEvent(new CustomEvent('enemyDefeated', {
                detail: { enemy: enemy }
            }));
        }
    }
    
    interactWithMerchant(merchant) {
        // Handle merchant interaction
        this.currentMode.interactWithMerchant(merchant);
    }
    
    openChest(chest) {
        // Handle chest opening
        this.currentMode.openChest(chest);
    }
    
    // Save/Load
    saveGame(slot) {
        if (!this.currentMode) return;
        
        try {
            const gameData = this.currentMode.getSaveData();
            localStorage.setItem(`minequest_save_${slot}`, JSON.stringify(gameData));
            this.ui.showNotification(`Game saved to slot ${slot}`, 'success');
        } catch (error) {
            console.error('Failed to save game:', error);
            this.ui.showNotification(`Failed to save: ${error.message}`, 'error');
        }
    }
    
    loadGame(slot) {
        try {
            const saveData = JSON.parse(localStorage.getItem(`minequest_save_${slot}`));
            if (!saveData) {
                this.ui.showNotification('No save data found', 'error');
                return;
            }
            
            // Load game mode
            if (this.currentMode) {
                this.currentMode.cleanup();
            }
            
            switch (saveData.mode) {
                case GAME_MODES.STANDARD:
                    this.currentMode = new StandardMode(this);
                    break;
                case GAME_MODES.CUSTOM:
                    this.currentMode = new CustomMode(this);
                    break;
                case GAME_MODES.GAUNTLET:
                    this.currentMode = new GauntletMode(this);
                    break;
            }
            
            // Load game state
            this.currentMode.loadGame(saveData);
            
            // Sync game state
            this.syncGameState();
            
            this.ui.showNotification(`Game loaded from slot ${slot}`, 'success');
        } catch (error) {
            console.error('Failed to load game:', error);
            this.ui.showNotification('Failed to load game', 'error');
        }
    }
    
    restartStandardMode() {
        console.log('Game: Restarting standard mode');

        // Reset game over state
        this.isGameOver = false;

        // Restart the game loop
        this.isRunning = true;

        // Close any open dialogs
        if (this.ui && this.ui.hideDialog) {
            this.ui.hideDialog();
        }

        // Restart the standard mode
        if (this.currentMode) {
            this.currentMode.cleanup();
        }

        // Create new standard mode
        this.currentMode = new StandardMode(this);

        // Initialize the new mode
        this.currentMode.init();

        // Sync game state
        this.syncGameState();

        // Update UI
        if (this.ui && typeof this.ui.updateGameInfo === 'function') {
            this.ui.updateGameInfo({
                area: this.currentArea,
                player: this.player,
                gameMode: this.gameMode
            });
        }

        console.log('Game restarted in Standard Mode');
    }
    
    returnToStartPage() {
        console.log('Game: Returning to start page');
        
        // Stop the game loop
        this.isRunning = false;
        
        // Hide game UI and show start page
        if (this.ui) {
            this.ui.hideStats();
            this.ui.hideInventory();
            this.ui.hideEquipment();
        }
        
        // Show start page
        const gameContainer = document.getElementById('gameContainer');
        const startPage = document.getElementById('startPage');
        
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        if (startPage) {
            startPage.style.display = 'block';
        }
        
        // Dispatch event to notify main.js
        const event = new CustomEvent('game:returnedToStartPage');
        document.dispatchEvent(event);
        
        console.log('Game: Returned to start page');
    }
    
    // Debug methods
    toggleDebug() {
        this.debug.enabled = !this.debug.enabled;
    }
    
    toggleGrid() {
        this.debug.showGrid = !this.debug.showGrid;
    }
    
    toggleFPS() {
        this.debug.showFPS = !this.debug.showFPS;
    }
    
    pause() {
        this.isPaused = true;
        if (this.currentMode && typeof this.currentMode.pause === 'function') {
            this.currentMode.pause();
        }
    }

    resume() {
        this.isPaused = false;
        if (this.currentMode && typeof this.currentMode.resume === 'function') {
            this.currentMode.resume();
        }
    }
    
    updateTooltip() {
        if (!this.currentArea || !this.player) {
            this.tooltip.visible = false;
            return;
        }
        
        const worldX = this.input.mouse.worldX;
        const worldY = this.input.mouse.worldY;
        
        // Check if mouse is over player
        if (worldX === this.player.x && worldY === this.player.y) {
            this.tooltip.visible = true;
            this.tooltip.type = 'player';
            this.tooltip.x = this.input.mouse.x;
            this.tooltip.y = this.input.mouse.y;
            this.tooltip.content = this.generatePlayerTooltip();
            return;
        }
        
        // Check if mouse is over enemy
        const enemyKey = Utils.coordToKey(worldX, worldY);
        if (this.currentArea.enemies.has(enemyKey)) {
            const enemy = this.currentArea.enemies.get(enemyKey);
            this.tooltip.visible = true;
            this.tooltip.type = 'enemy';
            this.tooltip.x = this.input.mouse.x;
            this.tooltip.y = this.input.mouse.y;
            this.tooltip.content = this.generateEnemyTooltip(enemy);
            return;
        }
        
        // Check cell
        const cell = this.currentArea.getCell(worldX, worldY);
        if (cell !== null && cell !== undefined) {
            this.tooltip.visible = true;
            this.tooltip.type = 'cell';
            this.tooltip.x = this.input.mouse.x;
            this.tooltip.y = this.input.mouse.y;
            this.tooltip.content = this.generateCellTooltip(cell);
            return;
        }
        
        this.tooltip.visible = false;
    }
    
    generatePlayerTooltip() {
        // Generate or get persistent player character info
        if (!this.player.characterInfo) {
            this.player.characterInfo = {
                name: this.generateRandomName(),
                age: Utils.randomInt(18, 45),
                skills: this.generateRandomSkills(),
                power: Utils.randomInt(50, 150)
            };
        }
        
        const info = this.player.characterInfo;
        return `<div class="tooltip-title">${info.name}</div>
<div>Age: ${info.age}</div>
<div>Skills: ${info.skills.join(', ')}</div>
<div>Power: ${info.power}</div>
<div>Level: ${this.player.level}</div>
<div>Health: ${this.player.health}/${this.player.maxHealth}</div>`;
    }
    
    generateEnemyTooltip(enemy) {
        return `<div class="tooltip-title">${enemy.type}</div>
<div>Health: ${enemy.health}/${enemy.maxHealth}</div>
<div>Attack: ${enemy.stats.attack}</div>
<div>Defense: ${enemy.stats.defense}</div>
<div>Difficulty: ${this.currentArea.difficulty}</div>`;
    }
    
    generateCellTooltip(cellType) {
        const cellName = this.getCellTypeName(cellType);
        const percentage = this.calculateCellPercentage(cellType);
        return `<div class="tooltip-title">${cellName}</div>
<div>${percentage.toFixed(1)}% of area</div>`;
    }
    
    getCellTypeName(cellType) {
        switch (cellType) {
            case CELL_TYPES.EMPTY: return 'Empty';
            case CELL_TYPES.DIRT: return 'Dirt';
            case CELL_TYPES.ROCK: return 'Rock';
            case CELL_TYPES.CRYSTAL: return 'Crystal';
            case CELL_TYPES.GEM: return 'Gem';
            case CELL_TYPES.GOLD: return 'Gold';
            case CELL_TYPES.WALL: return 'Wall';
            case CELL_TYPES.DOOR: return 'Door';
            case CELL_TYPES.MERCHANT: return 'Merchant';
            case CELL_TYPES.CHEST: return 'Treasure Chest';
            case CELL_TYPES.CHEST_OPENED: return 'Opened Chest';
            case CELL_TYPES.BOSS: return 'Boss';
            case CELL_TYPES.BEDROCK: return 'Bedrock';
            case CELL_TYPES.LAVA: return 'Lava';
            case CELL_TYPES.WATER: return 'Water';
            case CELL_TYPES.GRASS: return 'Grass';
            case CELL_TYPES.SAND: return 'Sand';
            case CELL_TYPES.ICE: return 'Ice';
            case CELL_TYPES.OBSIDIAN: return 'Obsidian';
            case CELL_TYPES.DIAMOND: return 'Diamond';
            case CELL_TYPES.EMERALD: return 'Emerald';
            case CELL_TYPES.RUBY: return 'Ruby';
            case CELL_TYPES.SAPPHIRE: return 'Sapphire';
            case CELL_TYPES.AMETHYST: return 'Amethyst';
            case CELL_TYPES.COAL: return 'Coal';
            case CELL_TYPES.IRON: return 'Iron';
            case CELL_TYPES.COPPER: return 'Copper';
            case CELL_TYPES.SILVER: return 'Silver';
            case CELL_TYPES.PLATINUM: return 'Platinum';
            case CELL_TYPES.MYTHRIL: return 'Mythril';
            case CELL_TYPES.ADAMANTITE: return 'Adamantite';
            case CELL_TYPES.ENCHANTED: return 'Enchanted Stone';
            case CELL_TYPES.GEL: return 'Gel';
            case CELL_TYPES.SILK: return 'Silk';
            case CELL_TYPES.ROTTEN_FLESH: return 'Rotten Flesh';
            case CELL_TYPES.BONE: return 'Bone';
            case CELL_TYPES.DRAGON_SCALE: return 'Dragon Scale';
            case CELL_TYPES.WOOD: return 'Wood';
            case CELL_TYPES.CRAFTING: return 'Crafting Station';
            default: return 'Unknown';
        }
    }
    
    calculateCellPercentage(cellType) {
        if (!this.currentArea || !this.currentArea.grid) return 0;
        
        let count = 0;
        const total = this.currentArea.grid.length;
        
        for (const cell of this.currentArea.grid) {
            if (cell === cellType) count++;
        }
        
        return (count / total) * 100;
    }
    
    generateRandomName() {
        const firstNames = ['Aldric', 'Bran', 'Cedric', 'Darius', 'Elena', 'Fiona', 'Gareth', 'Helena', 'Iris', 'Jasper'];
        const lastNames = ['Ironforge', 'Stonehand', 'Goldseeker', 'Crystaldelver', 'Rockbreaker', 'Gemhunter', 'Deepminer', 'Oremaster'];
        return firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
    }
    
    generateRandomSkills() {
        const allSkills = ['Mining', 'Combat', 'Crafting', 'Trading', 'Exploration', 'Magic', 'Stealth', 'Leadership'];
        const count = Utils.randomInt(2, 4);
        const skills = [];
        const available = [...allSkills];
        
        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * available.length);
            skills.push(available.splice(index, 1)[0]);
        }
        
        return skills;
    }
    
    renderTooltip() {
        if (!this.tooltip.visible || !this.tooltip.content) return;
        
        // Create temporary div to measure tooltip size
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: absolute; visibility: hidden; padding: 10px; background: rgba(0, 0, 0, 0.9); color: white; border: 2px solid #FFD700; border-radius: 5px; font-family: Arial; font-size: 14px; pointer-events: none; z-index: 10000;';
        tempDiv.innerHTML = this.tooltip.content;
        document.body.appendChild(tempDiv);
        
        const width = tempDiv.offsetWidth;
        const height = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);
        
        // Position tooltip (avoid edge of screen)
        let x = this.tooltip.x + 15;
        let y = this.tooltip.y + 15;
        
        if (x + width > window.innerWidth) {
            x = this.tooltip.x - width - 15;
        }
        
        if (y + height > window.innerHeight) {
            y = this.tooltip.y - height - 15;
        }
        
        // Draw tooltip on canvas
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(x, y, width, height);
        
        // Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // Parse and render HTML content
        const lines = this.tooltip.content.split('\n');
        let offsetY = 10;
        
        for (const line of lines) {
            // Remove HTML tags for canvas rendering
            const text = line.replace(/<[^>]*>/g, '').trim();
            if (text) {
                // Check if it's a title
                if (line.includes('tooltip-title')) {
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillText(text, x + 10, y + offsetY);
                    this.ctx.font = '14px Arial';
                    this.ctx.fillStyle = 'white';
                    offsetY += 20;
                } else {
                    this.ctx.fillText(text, x + 10, y + offsetY);
                    offsetY += 18;
                }
            }
        }
        
        this.ctx.restore();
    }
}

// Particle class for effects
class Particle {
    constructor(x, y, vx, vy, color) {
        this.id = Date.now() + Math.random(); // Simple unique ID
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 3;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.1; // Gravity
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
    
    isDead() {
        return this.life <= 0;
    }
}