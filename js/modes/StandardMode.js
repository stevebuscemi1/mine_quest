// js/modes/StandardMode.js

import { GAME_MODES, AREA_TYPES, CELL_TYPES, MATERIALS, ENEMY_TYPES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Player } from '../core/Player.js';
import { Enemy } from '../core/Enemy.js';
import { Area } from '../core/Area.js';
import { FogOfWar } from '../core/FogOfWar.js';

const MERCHANT_CONFIRMATION_THRESHOLD = 100;

export class StandardMode {
    constructor(game) {
        this.game = game;

        // Game state
        this.currentArea = null;
        this.player = null;
        this.fogOfWar = null;
        this.areaHistory = [];
        this.doorConnections = new Map(); // Maps door positions to their connected doors
        this.currentAreaIndex = 0;

        // Teleportation state tracking to prevent position corruption
        this.isTeleporting = false;

        // Area progression system
        this.areaTypeProgression = [
            AREA_TYPES.MINE,
            AREA_TYPES.CAVE,
            AREA_TYPES.CRYSTAL_CAVERN,
            AREA_TYPES.ANCIENT_RUINS,
            AREA_TYPES.COSMIC_REGION,
            AREA_TYPES.VOLCANIC,
            AREA_TYPES.FROZEN,
            AREA_TYPES.DESERT,
            AREA_TYPES.JUNGLE,
            AREA_TYPES.ABYSS
        ];

        // Area size ranges based on progression
        this.areaSizeRange = {
            min: 40,
            max: 80
        };

        // Mode-specific settings
        this.stats = {
            areasCompleted: 0,
            enemiesDefeated: 0,
            resourcesCollected: 0,
            timeElapsed: 0
        };

        // Progression tracking for hybrid system
        this.progressionState = {
            visitedAreaTypes: new Set(), // Track which area types have been visited
            mainPathProgress: 0, // Progress through the main path (0-4 for 5 area types)
            explorationBranchesAllowed: 2, // Max exploration branches per main path area
            currentExplorationBranches: 0, // Current exploration branches from this area
            areaTypeOrder: [AREA_TYPES.MINE, AREA_TYPES.CAVE, AREA_TYPES.CRYSTAL_CAVERN, AREA_TYPES.ANCIENT_RUINS, AREA_TYPES.COSMIC_REGION], // Guaranteed progression order
            difficultyGates: {
                [AREA_TYPES.MINE]: { minDifficulty: 1, minAreasVisited: 0 },
                [AREA_TYPES.CAVE]: { minDifficulty: 2, minAreasVisited: 2 },
                [AREA_TYPES.CRYSTAL_CAVERN]: { minDifficulty: 3, minAreasVisited: 4 },
                [AREA_TYPES.ANCIENT_RUINS]: { minDifficulty: 4, minAreasVisited: 6 },
                [AREA_TYPES.COSMIC_REGION]: { minDifficulty: 5, minAreasVisited: 8 }
            }
        };

        this.activeMerchantDialog = null;

        // Initialize fog of war
        this.fogOfWar = new FogOfWar();

        // Event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('playerMoved', (e) => this.handlePlayerMoved(e));
        document.addEventListener('areaCompleted', (e) => this.handleAreaCompleted(e));
        document.addEventListener('enemyDefeated', (e) => this.handleEnemyDefeated(e));
        document.addEventListener('resourceMined', (e) => this.handleResourceMined(e));
        document.addEventListener('miningComplete', (e) => this.handleMiningComplete(e));
        document.addEventListener('levelUp', (e) => this.handleLevelUp(e));
    }
    
    async init() {
        console.log('StandardMode: Initializing...');
        
        try {
            // Initialize player
            this.player = new Player(25, 25);
            
            // Initialize fog of war
            this.fogOfWar = new FogOfWar();
            
            // Generate first area
            await this.generateNewArea();
            
            // CRITICAL: Ensure player starts within bounds
            if (this.currentArea && this.player) {
                this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
                this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
                console.log(`StandardMode: Player initialized within bounds at (${this.player.x}, ${this.player.y})`);
            }
            
            // Update UI
            this.updateUI();
            
            // Start intro story if not completed
            setTimeout(() => {
                if (this.game.storyManager && this.game.ui && typeof this.game.ui.hideDialog === 'function' && !this.game.storyManager.isStoryCompleted('intro')) {
                    this.game.storyManager.startStory('intro');
                }
            }, 1000);
            
            console.log('StandardMode: Initialization complete');
        } catch (error) {
            console.error('StandardMode: Initialization failed:', error);
            
            // Show error message but continue with basic functionality
            if (this.game && this.game.ui) {
                this.game.ui.showNotification(
                    'Standard mode initialized with basic functionality',
                    'warning',
                    3000
                );
            }
        }
        return; // Added return statement
    }
    
    async generateNewArea() {
        console.log('StandardMode: Generating new area...');
        
        try {
            // Determine area type based on hybrid progression system
            const areaType = this.selectAreaTypeForProgression();
            
            // Calculate area size
            const width = Utils.randomInt(this.areaSizeRange.min, this.areaSizeRange.max);
            const height = Utils.randomInt(this.areaSizeRange.min, this.areaSizeRange.max);
            
            // Calculate difficulty
            const difficulty = Math.floor(1 + this.currentAreaIndex * 0.2);
            
            console.log(`StandardMode: Generating area: ${areaType} (${width}x${height}, difficulty: ${difficulty}) - Main Path Progress: ${this.progressionState.mainPathProgress}/${this.progressionState.areaTypeOrder.length}`);
            
            // Generate area
            this.currentArea = new Area(width, height, areaType, difficulty);
            this.currentArea.generate(this.player.level);
            
            // Find valid spawn position
            const spawnPos = this.findValidSpawnPosition();
            this.player.x = spawnPos.x;
            this.player.y = spawnPos.y;
            
            // Ensure initial spawn position is within area bounds
            this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
            this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
            
            console.log(`StandardMode: Initial spawn position set to (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);
            
            // Add to history
            this.areaHistory.push({
                area: this.currentArea,
                playerPos: { x: this.player.x, y: this.player.y },
                index: this.currentAreaIndex,
                areaType: areaType,
                isMainPath: this.isMainPathArea(areaType)
            });
            
            // Update progression tracking
            this.progressionState.visitedAreaTypes.add(areaType);
            if (this.isMainPathArea(areaType)) {
                this.progressionState.mainPathProgress = Math.max(this.progressionState.mainPathProgress, 
                    this.progressionState.areaTypeOrder.indexOf(areaType) + 1);
                this.progressionState.currentExplorationBranches = 0; // Reset exploration branches for new main path area
            }
            
            // Update fog of war
            this.fogOfWar.update(this.player.x, this.player.y);
            
            console.log('StandardMode: Area generated successfully');
        } catch (error) {
            console.error('StandardMode: Failed to generate area:', error);
            throw error;
        }
    }
    
    findValidSpawnPosition() {
        console.log('StandardMode: Finding valid spawn position...');
        
        // Check if currentArea exists
        if (!this.currentArea) {
            console.log('StandardMode: No current area, using default position');
            return { x: 25, y: 25 };
        }
        
        // Check if grid exists
        if (!this.currentArea.grid || !Array.isArray(this.currentArea.grid)) {
            console.log('StandardMode: No grid found, using default position');
            return { x: 25, y: 25 };
        }
        
        const width = this.currentArea.width;
        const height = this.currentArea.height;
        
        // Priority 1: Find empty cells adjacent to doors
        if (this.currentArea.exits && this.currentArea.exits.length > 0) {
            const door = this.currentArea.exits[0]; // Use first door
            const adjacentPositions = [
                { x: door.x - 1, y: door.y },
                { x: door.x + 1, y: door.y },
                { x: door.x, y: door.y - 1 },
                { x: door.x, y: door.y + 1 }
            ];
            
            // Find valid adjacent empty cells
            const validAdjacentPositions = adjacentPositions.filter(pos => {
                if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
                    const cell = this.currentArea.getCell(pos.x, pos.y);
                    const enemyKey = Utils.coordToKey(pos.x, pos.y);
                    return cell === CELL_TYPES.EMPTY && !this.currentArea.enemies.has(enemyKey);
                }
                return false;
            });
            
            if (validAdjacentPositions.length > 0) {
                const spawnPos = validAdjacentPositions[Utils.randomInt(0, validAdjacentPositions.length - 1)];
                console.log(`StandardMode: Spawning near door at (${spawnPos.x}, ${spawnPos.y})`);
                return spawnPos;
            }
        }
        
        // Priority 2: Find any empty cell
        const validPositions = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = this.currentArea.getCell(x, y);
                const enemyKey = Utils.coordToKey(x, y);
                if (cell === CELL_TYPES.EMPTY && !this.currentArea.enemies.has(enemyKey)) {
                    validPositions.push({ x, y });
                }
            }
        }
        
        if (validPositions.length === 0) {
            console.log('StandardMode: No valid spawn positions found');
            // Return a bounds-checked default position
            const defaultX = Math.min(25, this.currentArea.width - 1);
            const defaultY = Math.min(25, this.currentArea.height - 1);
            return { x: defaultX, y: defaultY };
        }
        
        const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
        console.log(`StandardMode: Found ${validPositions.length} valid positions, using position ${randomPos.x},${randomPos.y}`);
        
        // Ensure the position is within bounds (double check)
        randomPos.x = Math.max(0, Math.min(randomPos.x, this.currentArea.width - 1));
        randomPos.y = Math.max(0, Math.min(randomPos.y, this.currentArea.height - 1));
        
        return randomPos;
    }
    
    selectAreaTypeForProgression() {
        // Priority 1: Ensure main path progression (guaranteed access to all area types)
        const nextMainPathType = this.getNextRequiredAreaType();
        if (nextMainPathType && this.canAccessAreaType(nextMainPathType)) {
            console.log(`StandardMode: Selecting required main path area type: ${nextMainPathType}`);
            return nextMainPathType;
        }
        
        // Priority 2: Exploration branches from current main path area
        if (this.progressionState.currentExplorationBranches < this.progressionState.explorationBranchesAllowed) {
            const explorationType = this.selectExplorationAreaType();
            if (explorationType) {
                console.log(`StandardMode: Selecting exploration branch area type: ${explorationType}`);
                this.progressionState.currentExplorationBranches++;
                return explorationType;
            }
        }
        
        // Priority 3: Revisit previously visited areas (for replayability)
        const availableTypes = this.getAvailableAreaTypes();
        if (availableTypes.length > 0) {
            const randomType = Utils.randomChoice(availableTypes);
            console.log(`StandardMode: Selecting revisited area type: ${randomType}`);
            return randomType;
        }
        
        // Fallback: Any area type that meets difficulty requirements
        const fallbackTypes = Object.keys(this.progressionState.difficultyGates).filter(type => 
            this.canAccessAreaType(type)
        );
        
        if (fallbackTypes.length > 0) {
            const fallbackType = Utils.randomChoice(fallbackTypes);
            console.log(`StandardMode: Selecting fallback area type: ${fallbackType}`);
            return fallbackType;
        }
        
        // Ultimate fallback: Mine (always accessible)
        console.log('StandardMode: Using ultimate fallback: MINE');
        return 'MINE';
    }
    
    getNextRequiredAreaType() {
        // Return the next area type in the main path that hasn't been visited yet
        const currentProgress = this.progressionState.mainPathProgress;
        if (currentProgress < this.progressionState.areaTypeOrder.length) {
            return this.progressionState.areaTypeOrder[currentProgress];
        }
        return null; // All main path areas completed
    }
    
    canAccessAreaType(areaType) {
        const gate = this.progressionState.difficultyGates[areaType];
        if (!gate) return true; // No gate means always accessible
        
        const currentDifficulty = Math.floor(1 + this.currentAreaIndex * 0.2);
        const areasVisited = this.stats.areasCompleted;
        
        return currentDifficulty >= gate.minDifficulty && areasVisited >= gate.minAreasVisited;
    }
    
    selectExplorationAreaType() {
        // Select an area type that's different from current but meets requirements
        const currentAreaType = this.currentArea?.type;
        const availableTypes = Object.keys(this.progressionState.difficultyGates).filter(type => 
            type !== currentAreaType && this.canAccessAreaType(type)
        );
        
        return availableTypes.length > 0 ? Utils.randomChoice(availableTypes) : null;
    }
    
    getAvailableAreaTypes() {
        // Return area types that have been visited before and meet current requirements
        return Array.from(this.progressionState.visitedAreaTypes).filter(type => 
            this.canAccessAreaType(type)
        );
    }
    
    isMainPathArea(areaType) {
        return this.progressionState.areaTypeOrder.includes(areaType);
    }
    
    canCreateConnection(fromAreaIndex, toAreaIndex) {
        // Connection constraints to prevent loops and ensure progression
        
        // Rule 1: Prevent direct backwards connections (earlier to later areas)
        if (toAreaIndex < fromAreaIndex) {
            console.log(`StandardMode: Rejecting backwards connection from ${fromAreaIndex} to ${toAreaIndex}`);
            return false;
        }
        
        // Rule 2: Allow connections to same or next main path areas
        const fromHistory = this.areaHistory.find(h => h.index === fromAreaIndex);
        const toHistory = this.areaHistory.find(h => h.index === toAreaIndex);
        
        if (fromHistory && toHistory) {
            const fromTypeIndex = this.progressionState.areaTypeOrder.indexOf(fromHistory.areaType);
            const toTypeIndex = this.progressionState.areaTypeOrder.indexOf(toHistory.areaType);
            
            // Allow connections within same main path tier or to next tier
            if (Math.abs(fromTypeIndex - toTypeIndex) <= 1) {
                return true;
            }
            
            // Allow limited exploration connections (max 2 per source area)
            if (this.countConnectionsFromArea(fromAreaIndex) < 2) {
                return true;
            }
        }
        
        return false;
    }
    
    countConnectionsFromArea(areaIndex) {
        // Count how many connections originate from this area
        let count = 0;
        for (const [key, connection] of this.doorConnections) {
            if (connection.fromAreaIndex === areaIndex) {
                count++;
            }
        }
        return count;
    }
    
    validatePlayerBounds() {
        // CRITICAL: Ensure player is within current area bounds
        // Skip validation during teleportation to prevent position corruption
        if (this.isTeleporting || !this.currentArea || !this.player) return false;

        const wasOutOfBounds = this.player.x < 0 || this.player.x >= this.currentArea.width || 
                              this.player.y < 0 || this.player.y >= this.currentArea.height;

        if (wasOutOfBounds) {
            console.error(`StandardMode: Player position (${this.player.x}, ${this.player.y}) is outside area bounds (${this.currentArea.width}x${this.currentArea.height})`);
            
            // Correct the position
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
            this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
            
            console.log(`StandardMode: Corrected player position from (${oldX}, ${oldY}) to (${this.player.x}, ${this.player.y})`);
            
            // Update fog of war for the corrected position
            if (this.fogOfWar) {
                this.fogOfWar.update(this.player.x, this.player.y);
            }
            
            return true; // Position was corrected
        }
        
        return false; // Position was already valid
    }
    
    forcePlayerIntoBounds() {
        // Emergency method to force player into bounds regardless of current position
        if (!this.currentArea || !this.player) return;
        
        console.warn(`StandardMode: Emergency bounds correction triggered`);
        
        // Place at center of area as last resort
        this.player.x = Math.floor(this.currentArea.width / 2);
        this.player.y = Math.floor(this.currentArea.height / 2);
        
        console.log(`StandardMode: Emergency placement at center (${this.player.x}, ${this.player.y})`);
        
        // Update fog of war
        if (this.fogOfWar) {
            this.fogOfWar.update(this.player.x, this.player.y);
        }
    }
    
    handlePlayerMoved(e) {
        // Handle player movement - update fog of war, check for interactions, etc.
        // DO NOT dispatch playerMoved event here - it causes infinite recursion!
        
        // CRITICAL: Ensure player stays within area bounds
        if (this.currentArea && this.player) {
            const wasOutOfBounds = this.player.x < 0 || this.player.x >= this.currentArea.width || 
                                  this.player.y < 0 || this.player.y >= this.currentArea.height;
            
            if (wasOutOfBounds) {
                console.error(`StandardMode: Player moved outside area bounds! Position: (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);
                
                // Force player back into bounds
                this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
                this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
                
                console.log(`StandardMode: Corrected player position to (${this.player.x}, ${this.player.y})`);
            }
        }
        
        // Update fog of war
        if (this.fogOfWar) {
            this.fogOfWar.update(this.player.x, this.player.y);
        }
        
        // Check for door interactions
        this.checkDoorInteraction();
        
        // Check for chest interactions
        this.checkChestInteraction();
        
        // Check for merchant interactions
        this.checkMerchantInteraction();
        
        // Check for crafting interactions
        this.checkCraftingInteraction();
    }
    
    handleAreaCompleted(e) {
        // Calculate completion bonus
        const completionBonus = {
            experience: 50 * this.currentArea.difficulty,
            coins: 25 * this.currentArea.difficulty
        };
        
        // Apply bonuses
        this.player.gainExperience(completionBonus.experience);
        this.player.coins += completionBonus.coins;
        
        // Update statistics
        this.stats.areasExplored++;
        
        // Show completion message
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                `Area Complete! +${completionBonus.experience} XP, +${completionBonus.coins} coins`,
                'success',
                5000
            );
        }
        
        // Generate new area
        this.currentAreaIndex++;
        this.generateNewArea();
        
        // DO NOT dispatch areaCompleted event here - it causes infinite recursion!
    }
    
    handleEnemyDefeated(e) {
        const enemy = e.detail.enemy;
        
        // Add loot to player
        const loot = enemy.getLoot();
        for (const item of loot) {
            if (item.type === 'coins') {
                this.player.coins += item.count;
            } else {
                // Add item to inventory
                this.player.inventory.addItem({
                    id: `loot_${item.type}`,
                    name: item.name,
                    type: 'resource',
                    material: item.type,
                    count: item.count,
                    value: MATERIALS[item.type]?.value || 1,
                    color: MATERIALS[item.type]?.color || '#FFFFFF'
                });
            }
        }
        
        // Update statistics
        this.stats.enemiesDefeated++;
        
        // Update UI
        this.updateUI();
        
        // DO NOT dispatch enemyDefeated event here - it causes infinite recursion!
    }
    
    handleResourceMined(e) {
        const resource = e.detail.resource;
        
        // Update statistics
        this.stats.resourcesMined++;
        this.stats.totalValue += resource.value || 0;
        
        // Update UI
        this.updateUI();
        
        // DO NOT dispatch resourceMined event here - it causes infinite recursion!
    }
    
    handleMiningComplete(e) {
        const { x, y, mined } = e.detail;
        
        if (mined && this.currentArea) {
            // Clear the mined cell
            this.currentArea.setCell(x, y, CELL_TYPES.EMPTY);
            
            // Update statistics
            this.stats.resourcesMined++;
            
            // Update UI
            this.updateUI();
            
            console.log(`StandardMode: Cell at (${x}, ${y}) mined and cleared`);
        }
    }
    
    handleLevelUp(e) {
        const player = e.detail.player;
        
        // Show level up notification
        if (this.game && this.game.ui) {
            this.game.ui.showNotification(
                `Level Up! You are now level ${player.level}!`,
                'success',
                5000
            );
        }
        
        // Update UI
        this.updateUI();
        
        // DO NOT dispatch levelUp event here - it causes infinite recursion!
    }
    
    checkDoorInteraction() {
        if (!this.currentArea || !this.player) return;

        // CRITICAL: Prevent interaction if player is outside area bounds
        if (this.player.x < 0 || this.player.x >= this.currentArea.width || 
            this.player.y < 0 || this.player.y >= this.currentArea.height) {
            console.error(`StandardMode: Player is outside area bounds! Position: (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);
            
            // Force player back into bounds
            this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
            this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
            
            console.log(`StandardMode: Forced player back into bounds at (${this.player.x}, ${this.player.y})`);
            return;
        }

        // Check if player is on a door
        const cell = this.currentArea.getCell(this.player.x, this.player.y);
        if (cell === CELL_TYPES.DOOR) {
            // Find which exit door the player is on
            const exitDoor = this.currentArea.exits.find(door =>
                door.x === this.player.x && door.y === this.player.y
            );

            if (exitDoor) {
                this.teleportThroughDoor(exitDoor);
            }
        }
    }

    teleportThroughDoor(exitDoor) {
        console.log(`Teleporting through door at (${exitDoor.x}, ${exitDoor.y})`);

        // Set teleporting flag to prevent position corruption
        this.isTeleporting = true;

        // Create a unique key for this door
        const doorKey = Utils.coordToKey(exitDoor.x, exitDoor.y);

        if (this.doorConnections.has(doorKey)) {
            // Use existing connection
            const connection = this.doorConnections.get(doorKey);
            
            // Check if this connection violates progression rules
            if (!this.canCreateConnection(connection.fromAreaIndex, connection.targetAreaIndex)) {
                console.log(`StandardMode: Existing connection violates progression rules, redirecting...`);
                // Create a new connection instead
                this.createNewConnection(exitDoor, doorKey);
                return;
            }
            
            this.loadAreaFromHistory(connection.targetAreaIndex, connection.targetDoor);
        } else {
            // Create new connection to next area
            this.createNewConnection(exitDoor, doorKey);
        }
    }
    
    createNewConnection(exitDoor, doorKey) {
        this.currentAreaIndex++;
        const targetAreaIndex = this.currentAreaIndex;

        // Generate new area
        this.generateNewArea();

        // Find and validate safe spawn door
        const targetDoor = this.findSafeSpawnDoor(this.currentArea);
        if (targetDoor) {
            // Validate the target door is actually safe
            if (this.isSafeSpawnPosition(targetDoor.x, targetDoor.y, this.currentArea)) {
                // Check if this connection follows progression rules
                if (this.canCreateConnection(this.currentAreaIndex - 1, targetAreaIndex)) {
                    const connection = {
                        fromAreaIndex: this.currentAreaIndex - 1,
                        fromDoor: exitDoor,
                        targetAreaIndex: targetAreaIndex,
                        targetDoor: targetDoor
                    };

                    // Store connection for both doors
                    this.doorConnections.set(doorKey, connection);
                    this.doorConnections.set(Utils.coordToKey(targetDoor.x, targetDoor.y), {
                        fromAreaIndex: targetAreaIndex,
                        fromDoor: targetDoor,
                        targetAreaIndex: this.currentAreaIndex - 1,
                        targetDoor: exitDoor
                    });

                    // Place player safely
                    this.placePlayerSafely(targetDoor);
                    console.log(`Successfully teleported to safe position near door (${targetDoor.x}, ${targetDoor.y})`);
                } else {
                    console.warn(`StandardMode: Generated connection violates progression rules, using fallback`);
                    this.placePlayerWithFallback();
                }
            } else {
                console.error('Target door is not safe, using fallback position');
                this.placePlayerWithFallback();
            }
        } else {
            console.error('Could not find safe spawn door in new area, using fallback');
            this.placePlayerWithFallback();
        }

        // Update fog of war for new area
        this.updateFogOfWar();

        // Update UI
        this.updateUI();

        // Dispatch area change event
        document.dispatchEvent(new CustomEvent('areaChanged', {
            detail: {
                fromArea: this.areaHistory[this.areaHistory.length - 2]?.area,
                toArea: this.currentArea,
                connection: this.doorConnections.get(doorKey)
            }
        }));

        // Reset teleporting flag after teleportation is complete
        setTimeout(() => {
            this.isTeleporting = false;
            console.log(`StandardMode: Teleportation completed, flag reset`);
        }, 100);
    }

    findSafeSpawnDoor(area) {
        // Find a door that has at least 3 empty cells around it
        for (const door of area.exits) {
            if (this.isSafeSpawnPosition(door.x, door.y, area)) {
                return door;
            }
        }

        // If no safe door found, try to create one
        return this.createSafeSpawnDoor(area);
    }

    createSafeSpawnDoor(area) {
        // Try to find a safe position for a new door
        for (let y = 1; y < area.height - 1; y++) {
            for (let x = 1; x < area.width - 1; x++) {
                if (area.getCell(x, y) === CELL_TYPES.EMPTY && this.isSafeSpawnPosition(x, y, area)) {
                    // Create a new door at this position
                    const newDoor = { x, y };
                    area.exits.push(newDoor);
                    area.setCell(x, y, CELL_TYPES.DOOR);
                    area.clearAreaAroundDoor(x, y, 5);

                    return newDoor;
                }
            }
        }

        return null;
    }

    isSafeSpawnPosition(x, y, area) {
        // Check if there are at least 4 walkable cells around this position (up, down, left, right)
        const cardinalDirections = [
            { x: x - 1, y: y },     // left
            { x: x + 1, y: y },     // right
            { x: x, y: y - 1 },     // up
            { x: x, y: y + 1 }      // down
        ];

        let walkableCount = 0;
        let hasWallProximity = false;

        for (const pos of cardinalDirections) {
            if (pos.x >= 0 && pos.x < area.width && pos.y >= 0 && pos.y < area.height) {
                const cell = area.getCell(pos.x, pos.y);
                const enemyKey = Utils.coordToKey(pos.x, pos.y);

                // Check for wall proximity (immediate adjacent walls are bad)
                if (cell === CELL_TYPES.WALL) {
                    hasWallProximity = true;
                }

                // Count walkable cells (empty, door, crafting station, or clearable non-wall cells)
                if (cell === CELL_TYPES.EMPTY ||
                    cell === CELL_TYPES.DOOR ||
                    cell === CELL_TYPES.CRAFTING ||
                    (cell !== CELL_TYPES.WALL &&
                     cell !== CELL_TYPES.CHEST &&
                     cell !== CELL_TYPES.CHEST_OPENED &&
                     !area.enemies.has(enemyKey))) {
                    walkableCount++;
                }
            } else {
                // Out of bounds counts as wall proximity
                hasWallProximity = true;
            }
        }

        // Must have at least 4 walkable directions and no immediate wall proximity
        return walkableCount >= 4 && !hasWallProximity;
    }

    placePlayerSafely(targetDoor) {
        // Find the safest adjacent empty cell
        const adjacentPositions = [
            { x: targetDoor.x - 1, y: targetDoor.y },
            { x: targetDoor.x + 1, y: targetDoor.y },
            { x: targetDoor.x, y: targetDoor.y - 1 },
            { x: targetDoor.x, y: targetDoor.y + 1 }
        ];

        // Find valid adjacent empty cells, prioritizing safer positions
        const validPositions = adjacentPositions.filter(pos => {
            if (pos.x < 0 || pos.x >= this.currentArea.width || pos.y < 0 || pos.y >= this.currentArea.height) {
                return false;
            }
            const cell = this.currentArea.getCell(pos.x, pos.y);
            return cell === CELL_TYPES.EMPTY;
        });

        // Sort by safety (prefer positions with more open space)
        validPositions.sort((a, b) => {
            const safetyA = this.calculatePositionSafety(a.x, a.y, this.currentArea);
            const safetyB = this.calculatePositionSafety(b.x, b.y, this.currentArea);
            return safetyB - safetyA; // Higher safety first
        });

        if (validPositions.length > 0) {
            const safePos = validPositions[0];
            this.player.x = safePos.x;
            this.player.y = safePos.y;
            console.log(`StandardMode: Placed player safely at (${safePos.x}, ${safePos.y}) near door (${targetDoor.x}, ${targetDoor.y})`);
        } else {
            // Fallback: place at door position if no adjacent cells are available
            console.warn(`StandardMode: No valid adjacent positions found for door at (${targetDoor.x}, ${targetDoor.y}), using door position as fallback`);
            this.player.x = targetDoor.x;
            this.player.y = targetDoor.y;
        }

        // Ensure player position is within area bounds
        this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
        this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
        
        console.log(`StandardMode: Final player position after bounds check: (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);
    }

    calculatePositionSafety(x, y, area) {
        // Calculate a safety score for a position (higher is safer)
        let safetyScore = 0;
        const directions = [
            { x: x - 1, y: y }, { x: x + 1, y: y },
            { x: x, y: y - 1 }, { x: x, y: y + 1 }
        ];

        for (const pos of directions) {
            if (pos.x >= 0 && pos.x < area.width && pos.y >= 0 && pos.y < area.height) {
                const cell = area.getCell(pos.x, pos.y);
                if (cell === CELL_TYPES.EMPTY || cell === CELL_TYPES.DOOR || cell === CELL_TYPES.CRAFTING) {
                    safetyScore += 2; // Open space is very good
                } else if (cell !== CELL_TYPES.WALL) {
                    safetyScore += 1; // Other non-wall cells are okay
                }
                // Walls reduce safety (score remains 0)
            }
        }

        return safetyScore;
    }

    placePlayerWithFallback() {
        console.warn('StandardMode: Using fallback player placement - this should be rare');

        // Try to find any safe empty cell in the area
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Utils.randomInt(1, this.currentArea.width - 2);
            const y = Utils.randomInt(1, this.currentArea.height - 2);

            if (this.currentArea.getCell(x, y) === CELL_TYPES.EMPTY &&
                this.isSafeSpawnPosition(x, y, this.currentArea)) {
                this.player.x = x;
                this.player.y = y;
                console.log(`StandardMode: Placed player at fallback safe position (${x}, ${y})`);
                return;
            }
        }

        // Ultimate fallback: center of area (may not be safe, but prevents crash)
        this.player.x = Math.floor(this.currentArea.width / 2);
        this.player.y = Math.floor(this.currentArea.height / 2);
        console.error(`StandardMode: CRITICAL: Could not find safe fallback position, placed at center (${this.player.x}, ${this.player.y})`);

        // Ensure player position is within area bounds even for center placement
        this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
        this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
        
        console.log(`StandardMode: Final fallback player position after bounds check: (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);
    }

    findAdjacentEmptyCell(door, area) {
        // Find an empty cell adjacent to the door to place the player
        const adjacentPositions = [
            { x: door.x - 1, y: door.y },
            { x: door.x + 1, y: door.y },
            { x: door.x, y: door.y - 1 },
            { x: door.x, y: door.y + 1 }
        ];

        // Find valid adjacent empty cells with enhanced safety checks
        const validPositions = adjacentPositions.filter(pos => {
            if (pos.x < 0 || pos.x >= area.width || pos.y < 0 || pos.y >= area.height) {
                return false;
            }
            const cell = area.getCell(pos.x, pos.y);
            const enemyKey = Utils.coordToKey(pos.x, pos.y);

            // Must be empty and safe (no enemies, proper movement freedom)
            return cell === CELL_TYPES.EMPTY &&
                   !area.enemies.has(enemyKey) &&
                   this.isSafeSpawnPosition(pos.x, pos.y, area);
        });

        // Sort by safety score for best placement
        validPositions.sort((a, b) => {
            const safetyA = this.calculatePositionSafety(a.x, a.y, area);
            const safetyB = this.calculatePositionSafety(b.x, b.y, area);
            return safetyB - safetyA; // Higher safety first
        });

        if (validPositions.length > 0) {
            // Return the safest position
            return validPositions[0];
        }

        // Fallback: return door position itself (better than crashing)
        console.warn(`No safe adjacent cells found for door at (${door.x}, ${door.y}), using door position as fallback`);
        return { x: door.x, y: door.y };
    }

    loadAreaFromHistory(targetAreaIndex, targetDoor) {
        // Check if we already have this area in history
        const historyEntry = this.areaHistory.find(entry => entry.index === targetAreaIndex);

        if (historyEntry) {
            // Load existing area from history
            this.currentArea = historyEntry.area;
            this.currentAreaIndex = targetAreaIndex;

            // Place player safely near the target door
            this.placePlayerSafely(targetDoor);
            console.log(`StandardMode: Successfully loaded area and placed player safely near door (${targetDoor.x}, ${targetDoor.y})`);

            // Ensure player position is within area bounds
            this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
            this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
            
            console.log(`StandardMode: Final loaded area player position after bounds check: (${this.player.x}, ${this.player.y}) in area ${this.currentArea.width}x${this.currentArea.height}`);

            // CRITICAL: Double-check bounds after loading
            if (this.player.x < 0 || this.player.x >= this.currentArea.width || 
                this.player.y < 0 || this.player.y >= this.currentArea.height) {
                console.error(`StandardMode: CRITICAL - Player still outside bounds after loading! Forcing correction.`);
                this.player.x = Math.floor(this.currentArea.width / 2);
                this.player.y = Math.floor(this.currentArea.height / 2);
                console.log(`StandardMode: Emergency correction - placed at center (${this.player.x}, ${this.player.y})`);
            }

            // Update fog of war for the loaded area
            this.updateFogOfWar();
        } else {
            console.error('Could not find area in history:', targetAreaIndex);
            // Fallback: generate new area (this shouldn't happen with proper connection tracking)
            this.generateNewArea();
        }

        // Reset teleporting flag after teleportation is complete
        setTimeout(() => {
            this.isTeleporting = false;
            console.log(`StandardMode: Teleportation completed, flag reset`);
        }, 100);
    }

    updateFogOfWar() {
        if (this.fogOfWar && this.currentArea) {
            // Clear fog around player's new position
            const viewDistance = 5;
            for (let y = this.player.y - viewDistance; y <= this.player.y + viewDistance; y++) {
                for (let x = this.player.x - viewDistance; x <= this.player.x + viewDistance; x++) {
                    if (x >= 0 && x < this.currentArea.width && y >= 0 && y < this.currentArea.height) {
                        this.fogOfWar.reveal(x, y);
                    }
                }
            }
        }
    }
    
    checkChestInteraction() {
        if (!this.currentArea || !this.player) return;

        // Check if player is on a chest or opened chest
        const key = Utils.coordToKey(this.player.x, this.player.y);
        if (this.currentArea.chests.has(key)) {
            const chest = this.currentArea.chests.get(key);

            // Always allow reopening chests to take remaining items
            this.showChestDialog(chest);
        }
    }

    openChest(chest) {
        // Mark chest as opened (visual change)
        chest.isOpened = true;

        // Change the cell visual to opened chest
        const key = Utils.coordToKey(chest.x, chest.y);
        if (this.currentArea.chests.has(key)) {
            this.currentArea.setCell(chest.x, chest.y, CELL_TYPES.CHEST_OPENED);
        }

        // Show chest inventory dialog
        this.showChestDialog(chest);

        // Play chest opening sound if available
        if (this.game.audioSystem) {
            this.game.audioSystem.playSound('open_chest');
        }

        // Update UI
        this.updateUI();

        // Dispatch event for any listeners
        document.dispatchEvent(new CustomEvent('chestOpened', {
            detail: { chest, loot: chest.loot }
        }));
    }

    getItemTextureStyle(item) {
        if (!item) return '';

        // Try to use item sprite if available (same logic as refreshMerchantDialog)
        if (this.game && this.game.itemSprites) {
            // For equipment items, check equipmentType first
            let sprite = null;
            if (item.type === 'equipment' && item.equipmentType) {
                sprite = this.game.itemSprites.get(item.equipmentType);
            }
            // For resources, they use CELL_TYPES textures, not item sprites
            else if (item.type === 'resource' && typeof item.type === 'number' && item.type in CELL_TYPES) {
                const texturePath = ASSET_PATHS.TEXTURES[item.type];
                if (texturePath) {
                    return `background-image: url('${texturePath}'); background-size: cover;`;
                }
            }
            // For consumables, fall back to item.id if no equipmentType
            else if (item.type !== 'resource') {
                const spriteKey = item.equipmentType || item.id;
                sprite = this.game.itemSprites.get(spriteKey);
            }

            if (sprite) {
                // Return a style that will create an img element
                return `content: url('${sprite.src}');`;
            }
        }

        // For materials/resources, use CELL_TYPES textures
        if (typeof item.type === 'number' && item.type in CELL_TYPES) {
            const texturePath = ASSET_PATHS.TEXTURES[item.type];
            if (texturePath) {
                return `background-image: url('${texturePath}'); background-size: cover;`;
            }
        }

        // For equipment, we don't have specific textures, so fall back to color
        if (item.color) {
            return `background-color: ${item.color};`;
        }

        return '';
    }

    showChestDialog(chest) {
        if (!this.game || !this.game.ui) return;

        // Create the dialog container
        const overlay = document.createElement('div');
        overlay.className = 'chest-overlay';

        // Create the dialog content
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'chest-dialog-container';
        overlay.appendChild(dialogContainer);

        // Get the chest type name for display
        const chestTypeName = chest.name || 'Chest';

        // Create the dialog HTML
        dialogContainer.innerHTML = `
            <div class="chest-dialog-header">
                <h2>${chestTypeName}</h2>
            </div>
            <div class="chest-dialog-content">
                <!-- Chest Inventory Panel -->
                <div class="chest-inventory-panel">
                    <h3 class="inventory-panel-title">Chest</h3>
                    <div class="chest-grid">
                        ${Array(20).fill().map((_, i) => {
                            const item = chest.loot[i];
                            if (!item) return `<div class="chest-slot empty" data-index="${i}"></div>`;
                            
                            const itemStyle = this.getItemTextureStyle(item);
                            const countDisplay = item.count > 1 ? `<span class="item-count">${item.count}</span>` : '';
                            
                            return `
                                <div class="chest-slot has-item" data-index="${i}">
                                    <div class="item-icon" style="${itemStyle}"></div>
                                    ${countDisplay}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="chest-actions">
                        <button class="chest-button" id="take-all-button">Take All</button>
                    </div>
                </div>

                <!-- Player Inventory Panel -->
                <div class="player-inventory-panel">
                    <h3 class="inventory-panel-title">Your Inventory</h3>
                    <div class="player-inventory-grid">
                        ${Array(20).fill().map((_, i) => {
                            const item = this.player.inventory.getSlot(i);
                            if (!item) return `<div class="player-slot empty" data-slot-index="${i}"></div>`;
                            
                            const itemStyle = this.getItemTextureStyle(item);
                            const countDisplay = item.count > 1 ? `<span class="item-count">${item.count}</span>` : '';
                            
                            return `
                                <div class="player-slot has-item" data-slot-index="${i}">
                                    <div class="item-icon" style="${itemStyle}"></div>
                                    ${countDisplay}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="chest-actions">
                        <button class="chest-button" id="give-all-button">Give All</button>
                    </div>
                </div>
            </div>
            <div class="chest-dialog-actions">
                <button class="chest-button" id="close-chest-button">Close</button>
            </div>
        `;

        // Add the dialog to the document
        document.body.appendChild(overlay);

        // Show the warning popup
        this.showChestWarning(overlay);

        // Set up event listeners
        this.setupChestDialogListeners(chest, overlay);
    }

    showChestWarning(overlay) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'chest-warning';
        warningDiv.innerHTML = `
            <h3>Warning</h3>
            <p>Items in the chest inventory are not saved when you close the game. Make sure to take all items you want to keep!</p>
            <button class="chest-warning-button">I Understand</button>
        `;
        
        overlay.appendChild(warningDiv);
        
        // Add click handler to dismiss the warning
        const closeButton = warningDiv.querySelector('.chest-warning-button');
        closeButton.addEventListener('click', () => {
            warningDiv.style.opacity = '0';
            setTimeout(() => {
                if (warningDiv.parentNode === overlay) {
                    overlay.removeChild(warningDiv);
                }
            }, 300);
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (warningDiv.parentNode === overlay) {
                warningDiv.style.opacity = '0';
                setTimeout(() => {
                    if (warningDiv.parentNode === overlay) {
                        overlay.removeChild(warningDiv);
                    }
                }, 300);
            }
        }, 10000);
    }

    setupChestDialogListeners(chest, overlay) {
        // Close button
        const closeButton = overlay.querySelector('#close-chest-button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Take All button
        const takeAllButton = overlay.querySelector('#take-all-button');
        takeAllButton.addEventListener('click', () => {
            this.takeAllFromChest(chest);
            // Refresh the dialog
            this.showChestDialog(chest);
            // Remove the old overlay
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
        });

        // Give All button
        const giveAllButton = overlay.querySelector('#give-all-button');
        giveAllButton.addEventListener('click', () => {
            this.giveAllToChest(chest);
            // Refresh the dialog
            this.showChestDialog(chest);
            // Remove the old overlay
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
        });

        // Chest slot click handlers
        overlay.querySelectorAll('.chest-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                if (index < chest.loot.length) {
                    this.takeItemFromChest(chest, index);
                    // Refresh the dialog
                    this.showChestDialog(chest);
                    // Remove the old overlay
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                }
            });
        });

        // Player inventory slot click handlers
        overlay.querySelectorAll('.player-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotIndex = parseInt(e.currentTarget.dataset.slotIndex);
                const item = this.player.inventory.getSlot(slotIndex);
                if (item) {
                    this.returnItemToChest(chest, slotIndex);
                    // Refresh the dialog
                    this.showChestDialog(chest);
                    // Remove the old overlay
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                }
            });
        });

        // Add tooltips to chest slots with items
        overlay.querySelectorAll('.chest-slot').forEach((slot, index) => {
            if (index < chest.loot.length) {
                const item = chest.loot[index];
                if (item) {
                    this.game.ui.addTooltip(slot, this.game.ui.createItemTooltip(item), item);
                }
            }
        });

        // Add tooltips to player inventory slots with items
        overlay.querySelectorAll('.player-slot').forEach((slot, index) => {
            const item = this.player.inventory.getSlot(index);
            if (item) {
                this.game.ui.addTooltip(slot, this.game.ui.createItemTooltip(item), item);
            }
        });

        // Close on Escape key
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    takeItemFromChest(chest, lootIndex) {
        if (lootIndex >= chest.loot.length) return false;

        const item = chest.loot[lootIndex];
        if (!item) return false;

        const added = this.player.inventory.addItem({
            ...item,
            count: item.type === 'equipment' ? 1 : item.count
        });

        if (added) {
            // Remove item from chest
            chest.loot.splice(lootIndex, 1);
            this.updateUI();
            return true;
        } else {
            // Inventory full
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification('Inventory is full!', 'warning', 2000);
            }
            return false;
        }
    }

    takeAllFromChest(chest) {
        let itemsTaken = 0;
        let itemsSkipped = 0;

        // Take all items from chest
        for (let i = chest.loot.length - 1; i >= 0; i--) {
            const item = chest.loot[i];

            const added = this.player.inventory.addItem({
                ...item,
                count: item.type === 'equipment' ? 1 : item.count
            });

            if (added) {
                chest.loot.splice(i, 1);
                itemsTaken++;
            } else {
                itemsSkipped++;
            }
        }

        if (itemsTaken > 0) {
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification(`Took ${itemsTaken} items from chest!`, 'success', 2000);
            }
        }
        
        if (itemsSkipped > 0) {
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification(`${itemsSkipped} items skipped (inventory full)`, 'warning', 2000);
            }
        }

        this.updateUI();
    }
    
    giveAllToChest(chest) {
        let itemsGiven = 0;
        let itemsSkipped = 0;
        
        // Create a copy of the player's inventory to avoid modifying it while iterating
        const playerItems = [];
        for (let i = 0; i < this.player.inventory.size; i++) {
            const item = this.player.inventory.getSlot(i);
            if (item) {
                playerItems.push({
                    slotIndex: i,
                    item: { ...item }
                });
            }
        }
        
        // Add all items to the chest
        playerItems.forEach(({ slotIndex, item }) => {
            // Check if the item is stackable with existing items in the chest
            const existingItemIndex = chest.loot.findIndex(chestItem => 
                chestItem.id === item.id && 
                chestItem.type === item.type &&
                chestItem.count < (chestItem.maxStack || Infinity)
            );
            
            if (existingItemIndex !== -1) {
                // Stack with existing item
                const existingItem = chest.loot[existingItemIndex];
                const spaceLeft = (existingItem.maxStack || Infinity) - existingItem.count;
                const amountToAdd = Math.min(item.count, spaceLeft);
                
                existingItem.count += amountToAdd;
                
                if (amountToAdd >= item.count) {
                    // Remove the item from player's inventory
                    this.player.inventory.removeItem(slotIndex);
                } else {
                    // Update the remaining count in player's inventory
                    this.player.inventory.setSlot(slotIndex, {
                        ...item,
                        count: item.count - amountToAdd
                    });
                }
                
                itemsGiven++;
            } else if (chest.loot.length < 20) { // Max 20 items in chest
                // Add as new item
                chest.loot.push({
                    ...item,
                    count: item.type === 'equipment' ? 1 : item.count
                });
                
                // Remove from player's inventory
                this.player.inventory.removeItem(slotIndex);
                itemsGiven++;
            } else {
                itemsSkipped++;
            }
        });
        
        if (itemsGiven > 0) {
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification(`Placed ${itemsGiven} items in the chest!`, 'success', 2000);
            }
        }
        
        if (itemsSkipped > 0) {
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification(`${itemsSkipped} items skipped (chest is full)`, 'warning', 2000);
            }
        }
        
        this.updateUI();
    }

    returnItemToChest(chest, playerSlotIndex) {
        const item = this.player.inventory.getSlot(playerSlotIndex);
        if (!item) return false;
        
        // Check if chest is full
        if (chest.loot.length >= 20) {
            if (this.game?.ui?.showNotification) {
                this.game.ui.showNotification('Chest is full!', 'warning', 2000);
            }
            return false;
        }

        // Add item to chest
        chest.loot.push({
            ...item,
            count: item.type === 'equipment' ? 1 : item.count
        });

        // Remove from player inventory
        this.player.inventory.removeItem(playerSlotIndex);
        
        this.updateUI();
        
        if (this.game?.ui?.showNotification) {
            this.game.ui.showNotification('Placed item in chest', 'success', 1500);
        }
        
        return true;
    }
    
    checkMerchantInteraction() {
        if (!this.currentArea || !this.player) return;
        
        // Check if player is on a merchant
        const key = Utils.coordToKey(this.player.x, this.player.y);
        if (this.currentArea.merchants.has(key)) {
            const merchant = this.currentArea.merchants.get(key);
            this.showMerchantDialog(merchant);
        }
    }
    
    
    checkCraftingInteraction() {
        if (!this.currentArea || !this.player) return;

        // Check if player is on a crafting station
        const cell = this.currentArea.getCell(this.player.x, this.player.y);
        if (cell === CELL_TYPES.CRAFTING) {
            // Open crafting UI
            if (this.game && this.game.craftingUI) {
                this.game.craftingUI.show();
            }
        }
    }

    showMerchantDialog(merchant) {
        if (!this.game || !this.game.ui) return;

        if (this.activeMerchantDialog) {
            this.closeMerchantDialog(false);
        }

        const overlay = document.createElement('div');
        overlay.className = 'merchant-overlay';

        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'merchant-dialog-container';
        overlay.appendChild(dialogContainer);

        const greeting = merchant.getGreeting();

        dialogContainer.innerHTML = `
            <button class="merchant-dialog-close" type="button" aria-label="Close merchant dialog">&times;</button>
            <div class="merchant-dialog-header">
                <h2>${merchant.name}</h2>
                <p class="merchant-greeting">"${greeting}"</p>
            </div>
            <div class="merchant-info-bar">
                <span class="merchant-wealth">Merchant coins: ${Utils.formatNumber(merchant.coins)}</span>
                <span class="player-coins-display">Your coins: ${Utils.formatNumber(this.player.coins)}</span>
            </div>
            <div class="merchant-dialog-content">
                <div class="merchant-inventory-panel">
                    <h3 class="merchant-panel-title">Merchant's Wares</h3>
                    <div class="merchant-grid" role="list"></div>
                </div>
                <div class="player-inventory-panel">
                    <h3 class="merchant-panel-title">Your Pack</h3>
                    <div class="player-grid" role="list"></div>
                </div>
            </div>
            <div class="merchant-info-secondary">
                <span class="merchant-specialty">Specialty: ${merchant.specialty}</span>
            </div>
            <div class="merchant-dialog-actions">
                <div class="merchant-action-group" data-action="buy">
                    <div class="merchant-quantity">
                        <span>Qty:</span>
                        <input type="range" id="merchant-quantity-slider" min="1" max="1" value="1" disabled>
                        <span id="merchant-quantity-value">1</span>
                    </div>
                    <button class="merchant-action-button" id="merchant-buy-btn" type="button" disabled>Buy</button>
                </div>
                <div class="merchant-action-group" data-action="sell">
                    <div class="merchant-quantity">
                        <span>Qty:</span>
                        <input type="range" id="player-quantity-slider" min="1" max="1" value="1" disabled>
                        <span id="player-quantity-value">1</span>
                    </div>
                    <button class="merchant-action-button" id="merchant-sell-btn" type="button" disabled>Sell</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        this.activeMerchantDialog = {
            merchant,
            overlay,
            container: dialogContainer,
            elements: {
                merchantGrid: dialogContainer.querySelector('.merchant-grid'),
                playerGrid: dialogContainer.querySelector('.player-grid'),
                merchantCoins: dialogContainer.querySelector('.merchant-wealth'),
                merchantSpecialty: dialogContainer.querySelector('.merchant-specialty'),
                playerCoins: dialogContainer.querySelector('.player-coins-display'),
                closeButton: dialogContainer.querySelector('.merchant-dialog-close'),
                buyButton: dialogContainer.querySelector('#merchant-buy-btn'),
                sellButton: dialogContainer.querySelector('#merchant-sell-btn'),
                merchantQtySlider: dialogContainer.querySelector('#merchant-quantity-slider'),
                merchantQtyValue: dialogContainer.querySelector('#merchant-quantity-value'),
                playerQtySlider: dialogContainer.querySelector('#player-quantity-slider'),
                playerQtyValue: dialogContainer.querySelector('#player-quantity-value')
            },
            state: {
                selectedMerchantSlot: -1,
                selectedInventorySlot: -1,
                merchantQuantity: 1,
                playerQuantity: 1,
                pendingConfirmation: null
            },
            listenersAttached: false
        };

        this.renderMerchantDialogContent(merchant);
        this.setupMerchantDialogListeners(merchant);
    }
    
    setupMerchantDialogListeners(merchant) {
        if (!this.activeMerchantDialog) return;

        const { overlay, container, elements, state } = this.activeMerchantDialog;

        if (!overlay || !container || !elements) return;

        if (this.activeMerchantDialog.listenersAttached) {
            return;
        }

        const overlayClickHandler = (event) => {
            if (event.target === overlay) {
                this.closeMerchantDialog();
            }
        };

        const containerClickHandler = (event) => {
            const closeButton = event.target.closest('.merchant-dialog-close');
            if (closeButton) {
                event.preventDefault();
                this.closeMerchantDialog();
                return;
            }

            const buyButton = event.target.closest('#merchant-buy-btn');
            if (buyButton) {
                event.preventDefault();
                if (state.selectedMerchantSlot === -1) {
                    this.game.ui.showNotification('Select an item to buy first', 'warning');
                    return;
                }
                this.handleMerchantBuy(merchant, state.selectedMerchantSlot, state.merchantQuantity);
                return;
            }

            const sellButton = event.target.closest('#merchant-sell-btn');
            if (sellButton) {
                event.preventDefault();
                if (state.selectedInventorySlot === -1) {
                    this.game.ui.showNotification('Select an item to sell first', 'warning');
                    return;
                }
                this.handleMerchantSell(merchant, state.selectedInventorySlot, state.playerQuantity);
                return;
            }

            const merchantSlot = event.target.closest('.merchant-slot');
            if (merchantSlot) {
                const index = Number.parseInt(merchantSlot.dataset.index, 10);
                if (!Number.isNaN(index) && index < merchant.inventory.length) {
                    state.selectedMerchantSlot = index;
                    state.selectedInventorySlot = -1;
                    state.merchantQuantity = 1;
                    this.renderMerchantDialogContent(merchant);
                }
                return;
            }

            const playerSlot = event.target.closest('.player-slot');
            if (playerSlot) {
                const slotIndex = Number.parseInt(playerSlot.dataset.slotIndex, 10);
                const item = this.player.inventory.getSlot(slotIndex);
                if (!Number.isNaN(slotIndex) && item) {
                    state.selectedInventorySlot = slotIndex;
                    state.selectedMerchantSlot = -1;
                    state.playerQuantity = 1;
                    this.renderMerchantDialogContent(merchant);
                }
            }
        };

        const containerInputHandler = (event) => {
            if (event.target === elements.merchantQtySlider) {
                const max = Number.parseInt(event.target.max, 10) || 1;
                const value = Math.max(1, Math.min(max, Number.parseInt(event.target.value, 10) || 1));
                state.merchantQuantity = value;
                event.target.value = String(value);
                elements.merchantQtyValue.textContent = String(value);
            } else if (event.target === elements.playerQtySlider) {
                const max = Number.parseInt(event.target.max, 10) || 1;
                const value = Math.max(1, Math.min(max, Number.parseInt(event.target.value, 10) || 1));
                state.playerQuantity = value;
                event.target.value = String(value);
                elements.playerQtyValue.textContent = String(value);
            }
        };

        const escHandler = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.closeMerchantDialog();
            }
        };

        overlay.addEventListener('click', overlayClickHandler);
        container.addEventListener('click', containerClickHandler);
        container.addEventListener('input', containerInputHandler);
        document.addEventListener('keydown', escHandler);

        this.activeMerchantDialog.listenersAttached = true;
        this.activeMerchantDialog.listeners = {
            overlayClickHandler,
            containerClickHandler,
            containerInputHandler,
            escHandler
        };
    }
    
    handleMerchantBuy(merchant, itemIndex, count = 1, confirmationToken = null) {
        if (!this.activeMerchantDialog) {
            return;
        }

        const { elements, state } = this.activeMerchantDialog;

        if (!elements) return;

        const item = merchant.inventory[itemIndex];
        if (!item) {
            this.game.ui.showNotification('That item is no longer available.', 'error');
            this.refreshMerchantDialog(merchant);
            return;
        }

        const totalCost = (item.buyPrice || item.value || 0) * count;
        const token = confirmationToken || `buy-${item.id || itemIndex}-${Date.now()}`;

        if (totalCost >= MERCHANT_CONFIRMATION_THRESHOLD) {
            const shouldContinue = this.confirmTransaction('buy', merchant, {
                token,
                itemName: item.name || 'item',
                count,
                totalValue: totalCost,
                itemIndex
            });

            if (!shouldContinue) {
                return;
            }
        }

        let itemRect = null;
        if (elements.merchantGrid) {
            const slot = elements.merchantGrid.querySelector(`.merchant-slot[data-index="${itemIndex}"]`);
            if (slot) {
                itemRect = slot.getBoundingClientRect();
            }
        }

        const result = merchant.buyItem(this.player, itemIndex, count);
        
        if (result.success) {
            if (this.game?.audioSystem) {
                this.game.audioSystem.playTradingSound();
            }

            this.updateUI();
            this.game.ui?.showNotification?.(`Bought ${result.item.name} for ${Utils.formatNumber(result.cost)} coins!`, 'success');

            this.refreshMerchantDialog(merchant);
            this.animateMerchantFeedback('buy', itemRect);
            if (this.activeMerchantDialog?.state?.pendingConfirmation?.token === token) {
                this.activeMerchantDialog.state.pendingConfirmation = null;
            }
        } else {
            this.game.ui?.showNotification?.(result.reason, 'error');
        }
    }
    
    handleMerchantSell(merchant, itemIndex, count = 1, confirmationToken = null) {
        if (!this.activeMerchantDialog) {
            return;
        }

        const { elements, state } = this.activeMerchantDialog;

        if (!elements) return;

        const item = this.player.inventory.getSlot(itemIndex);
        if (!item) {
            this.game.ui.showNotification('You no longer have that item.', 'error');
            this.refreshMerchantDialog(merchant);
            return;
        }

        const totalValue = merchant.calculateSellPrice(item) * count;
        const token = confirmationToken || `sell-${item.id || itemIndex}-${Date.now()}`;

        if (totalValue >= MERCHANT_CONFIRMATION_THRESHOLD) {
            const shouldContinue = this.confirmTransaction('sell', merchant, {
                token,
                itemName: item.name || 'item',
                count,
                totalValue,
                itemIndex
            });

            if (!shouldContinue) {
                return;
            }
        }

        let itemRect = null;
        if (elements.playerGrid) {
            const slot = elements.playerGrid.querySelector(`.player-slot[data-slot-index="${itemIndex}"]`);
            if (slot) {
                itemRect = slot.getBoundingClientRect();
            }
        }

        const result = merchant.sellItem(this.player, itemIndex, count);
        
        if (result.success) {
            if (this.game?.audioSystem) {
                this.game.audioSystem.playTradingSound();
            }

            this.updateUI();
            this.game.ui?.showNotification?.(`Sold ${result.item.name} for ${Utils.formatNumber(result.value)} coins!`, 'success');

            this.refreshMerchantDialog(merchant);
            this.animateMerchantFeedback('sell', itemRect);
            if (this.activeMerchantDialog?.state?.pendingConfirmation?.token === token) {
                this.activeMerchantDialog.state.pendingConfirmation = null;
            }
        } else {
            this.game.ui?.showNotification?.(result.reason, 'error');
        }
    }
    
    refreshMerchantDialog(merchant) {
        if (!this.activeMerchantDialog || this.activeMerchantDialog.merchant !== merchant) {
            return;
        }

        this.renderMerchantDialogContent(merchant);
    }

    renderMerchantDialogContent(merchant) {
        if (!this.activeMerchantDialog) return;

        const { elements, state } = this.activeMerchantDialog;
        if (!elements) return;

        if (elements.merchantCoins) {
            const capacity = merchant.coinCapacity ?? merchant.coins;
            elements.merchantCoins.textContent = `Merchant coins: ${Utils.formatNumber(merchant.coins)} / ${Utils.formatNumber(capacity)}`;
        }

        if (elements.merchantSpecialty) {
            elements.merchantSpecialty.textContent = `Specialty: ${merchant.specialty}`;
        }

        if (elements.playerCoins) {
            elements.playerCoins.textContent = `Your coins: ${Utils.formatNumber(this.player.coins)}`;
        }

        if (elements.merchantGrid) {
            elements.merchantGrid.innerHTML = this.buildMerchantGridHTML(merchant, state.selectedMerchantSlot);
        }

        if (elements.playerGrid) {
            elements.playerGrid.innerHTML = this.buildPlayerGridHTML(merchant, state.selectedInventorySlot);
        }

        this.attachMerchantTooltips(merchant);
        this.updateMerchantDialogActions(merchant);
    }

    buildMerchantGridHTML(merchant, selectedIndex = -1) {
        const slots = [];
        const totalSlots = 20;

        for (let index = 0; index < totalSlots; index++) {
            const item = merchant.inventory[index];
            if (item) {
                const rarityClass = this.getItemRarityClass(item);
                const selectedClass = index === selectedIndex ? ' selected' : '';
                const count = item.count ?? 1;
                const price = item.buyPrice || item.value || 0;
                const durability = item.durability !== undefined && item.maxDurability
                    ? `${item.durability}/${item.maxDurability}`
                    : '';

                slots.push(`
                    <div class="merchant-slot has-item${rarityClass}${selectedClass}" data-index="${index}" role="listitem">
                        ${this.getItemIconHtml(item)}
                        ${count > 1 ? `<div class="slot-count">${count}</div>` : ''}
                        ${durability ? `<div class="slot-durability">${durability}</div>` : ''}
                        <div class="slot-price">${Utils.formatNumber(price)}c</div>
                    </div>
                `);
            } else {
                slots.push(`
                    <div class="merchant-slot empty" data-index="${index}" role="listitem"></div>
                `);
            }
        }

        return slots.join('');
    }

    buildPlayerGridHTML(merchant, selectedIndex = -1) {
        const slots = [];
        const totalSlots = 20;

        for (let index = 0; index < totalSlots; index++) {
            const item = this.player.inventory.getSlot(index);
            if (item) {
                const rarityClass = this.getItemRarityClass(item);
                const selectedClass = index === selectedIndex ? ' selected' : '';
                const count = item.count ?? 1;
                const sellPrice = merchant.calculateSellPrice(item);
                const durability = item.durability !== undefined && item.maxDurability
                    ? `${item.durability}/${item.maxDurability}`
                    : '';

                slots.push(`
                    <div class="player-slot has-item${rarityClass}${selectedClass}" data-slot-index="${index}" role="listitem">
                        ${this.getItemIconHtml(item)}
                        ${count > 1 ? `<div class="slot-count">${count}</div>` : ''}
                        ${durability ? `<div class="slot-durability">${durability}</div>` : ''}
                        <div class="slot-price">${Utils.formatNumber(sellPrice)}c</div>
                    </div>
                `);
            } else {
                slots.push(`
                    <div class="player-slot empty" data-slot-index="${index}" role="listitem"></div>
                `);
            }
        }

        return slots.join('');
    }

    getItemIconHtml(item) {
        if (!item) {
            return '<div class="item-icon"></div>';
        }

        if (this.game && this.game.itemSprites) {
            let sprite = null;

            if (item.type === 'equipment' && item.equipmentType) {
                sprite = this.game.itemSprites.get(item.equipmentType);
            } else if (item.type !== 'resource') {
                const spriteKey = item.equipmentType || item.id;
                sprite = this.game.itemSprites.get(spriteKey);
            }

            if (sprite) {
                return `<img class="item-icon" src="${sprite.src}" alt="${item.name || 'Item'}" />`;
            }
        }

        if (item.type === 'resource' && item.material && this.game && this.game.textures) {
            const texture = this.game.textures.get(item.material);
            if (texture) {
                return `<img class="item-icon" src="${texture.src}" alt="${item.name || 'Resource'}" />`;
            }
        }

        const color = item.color || '#FFFFFF';
        return `<div class="item-icon" style="background-color: ${color}"></div>`;
    }

    getItemRarityClass(item) {
        if (!item || !item.rarity) {
            return '';
        }

        const rarity = String(item.rarity).toLowerCase();
        const allowed = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        return allowed.includes(rarity) ? ` rarity-${rarity}` : '';
    }

    attachMerchantTooltips(merchant) {
        if (!this.game || !this.game.ui || !this.activeMerchantDialog) return;

        const { elements } = this.activeMerchantDialog;
        if (!elements) return;

        if (elements.merchantGrid) {
            elements.merchantGrid.querySelectorAll('.merchant-slot').forEach((slot) => {
                const index = Number.parseInt(slot.dataset.index, 10);
                const item = merchant.inventory[index];
                if (item) {
                    this.game.ui.addTooltip(slot, this.game.ui.createItemTooltip(item), item);
                } else {
                    this.game.ui.removeTooltipListeners(slot);
                }
            });
        }

        if (elements.playerGrid) {
            elements.playerGrid.querySelectorAll('.player-slot').forEach((slot) => {
                const index = Number.parseInt(slot.dataset.slotIndex, 10);
                const item = this.player.inventory.getSlot(index);
                if (item) {
                    this.game.ui.addTooltip(slot, this.game.ui.createItemTooltip(item), item);
                } else {
                    this.game.ui.removeTooltipListeners(slot);
                }
            });
        }
    }

    updateMerchantDialogActions(merchant) {
        if (!this.activeMerchantDialog) return;

        const { elements, state } = this.activeMerchantDialog;
        if (!elements) return;

        const selectedMerchantItem = state.selectedMerchantSlot !== -1 ? merchant.inventory[state.selectedMerchantSlot] : null;
        const selectedPlayerItem = state.selectedInventorySlot !== -1 ? this.player.inventory.getSlot(state.selectedInventorySlot) : null;

        if (!selectedMerchantItem) {
            state.selectedMerchantSlot = -1;
            state.merchantQuantity = 1;
        }

        if (!selectedPlayerItem) {
            state.selectedInventorySlot = -1;
            state.playerQuantity = 1;
        }

        if (elements.buyButton) {
            elements.buyButton.disabled = !selectedMerchantItem;
        }

        if (elements.sellButton) {
            elements.sellButton.disabled = !selectedPlayerItem;
        }

        if (elements.merchantQtySlider && elements.merchantQtyValue) {
            const max = selectedMerchantItem?.count ? selectedMerchantItem.count : 1;
            const clamped = Math.max(1, Math.min(state.merchantQuantity, max));
            state.merchantQuantity = clamped;
            elements.merchantQtySlider.max = String(Math.max(1, max));
            elements.merchantQtySlider.value = String(clamped);
            elements.merchantQtySlider.disabled = !selectedMerchantItem || max <= 1;
            elements.merchantQtyValue.textContent = String(clamped);
        }

        if (elements.playerQtySlider && elements.playerQtyValue) {
            const max = selectedPlayerItem?.count ? selectedPlayerItem.count : 1;
            const clamped = Math.max(1, Math.min(state.playerQuantity, max));
            state.playerQuantity = clamped;
            elements.playerQtySlider.max = String(Math.max(1, max));
            elements.playerQtySlider.value = String(clamped);
            elements.playerQtySlider.disabled = !selectedPlayerItem || max <= 1;
            elements.playerQtyValue.textContent = String(clamped);
        }
    }

    confirmTransaction(type, merchant, params) {
        if (!this.activeMerchantDialog || !this.game?.ui) {
            return true;
        }

        const { state } = this.activeMerchantDialog;

        if (!params?.token) {
            return true;
        }

        if (state.pendingConfirmation?.token === params.token && state.pendingConfirmation.confirmed) {
            state.pendingConfirmation = null;
            return true;
        }

        state.pendingConfirmation = {
            token: params.token,
            type,
            merchant,
            params,
            confirmed: false
        };

        const verb = type === 'buy' ? 'purchase' : 'sell';
        const itemName = params.itemName || 'item';
        const countText = params.count > 1 ? `${params.count} × ${itemName}` : itemName;
        const totalText = Utils.formatNumber(params.totalValue);
        const message = `Are you sure you want to ${verb} <strong>${countText}</strong> for <strong>${totalText} coins</strong>?`;

        this.game.ui.showDialog(
            'Confirm Trade',
            `<div class="merchant-confirmation">${message}</div>`,
            [
                { text: 'Confirm', value: 'confirm', primary: true },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (!this.activeMerchantDialog) {
                    return;
                }

                const pending = this.activeMerchantDialog.state.pendingConfirmation;

                if (!pending || pending.token !== params.token) {
                    return;
                }

                if (value === 'confirm') {
                    pending.confirmed = true;
                    if (pending.type === 'buy') {
                        this.handleMerchantBuy(pending.merchant, pending.params.itemIndex, pending.params.count, pending.params.token);
                    } else {
                        this.handleMerchantSell(pending.merchant, pending.params.itemIndex, pending.params.count, pending.params.token);
                    }
                } else {
                    this.activeMerchantDialog.state.pendingConfirmation = null;
                }
            },
            true
        );

        return false;
    }

    animateMerchantFeedback(type, sourceRect) {
        if (!this.activeMerchantDialog || !this.game?.ui) {
            return;
        }

        const { elements } = this.activeMerchantDialog;

        const targetElement = type === 'buy' ? elements.playerCoins : elements.merchantCoins;
        const token = this.game.ui.createFlyingToken(type === 'buy' ? '🪙' : '💰');

        const targetRect = targetElement?.getBoundingClientRect() || null;

        if (token) {
            if (sourceRect && targetRect) {
                this.game.ui.animateFlyingToken(token, sourceRect, targetRect);
            } else {
                token.remove();
            }
        }

        this.game.ui.pulseCoinDisplay(elements.playerCoins);
        this.game.ui.pulseCoinDisplay(elements.merchantCoins);
    }

    closeMerchantDialog(showFarewell = true) {
        if (!this.activeMerchantDialog) return;

        const { overlay, container, listeners, merchant } = this.activeMerchantDialog;

        if (listeners) {
            if (listeners.overlayClickHandler && overlay) {
                overlay.removeEventListener('click', listeners.overlayClickHandler);
            }
            if (listeners.containerClickHandler && container) {
                container.removeEventListener('click', listeners.containerClickHandler);
            }
            if (listeners.containerInputHandler && container) {
                container.removeEventListener('input', listeners.containerInputHandler);
            }
            if (listeners.escHandler) {
                document.removeEventListener('keydown', listeners.escHandler);
            }
        }

        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }

        if (showFarewell && merchant && this.game && this.game.ui && typeof merchant.getFarewell === 'function') {
            const farewell = merchant.getFarewell();
            if (farewell) {
                this.game.ui.showNotification(`"${farewell}"`, 'info', 2000);
            }
        }

        if (this.activeMerchantDialog?.state) {
            this.activeMerchantDialog.state.pendingConfirmation = null;
        }

        this.activeMerchantDialog = null;
    }
    
    update(deltaTime) {
        if (!this.currentArea || !this.player) return;
        
        // CRITICAL: Validate player bounds every frame
        this.validatePlayerBounds();
        
        // Update player
        this.player.update(deltaTime);
        
        // Update fog of war
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Update enemies
        for (const [key, enemy] of this.currentArea.enemies) {
            enemy.update(deltaTime, this.player, this.currentArea);
        }
        
        // Update merchants
        for (const merchant of this.currentArea.merchants.values()) {
            merchant.update(deltaTime);
        }
        
        // Chests are simple objects without an update method, so no update needed
    }
    
    updateUI() {
        if (!this.game || !this.game.ui) return;
        
        // Update game info
        this.game.ui.updateGameInfo({
            area: this.currentArea,
            player: this.player,
            gameMode: GAME_MODES.STANDARD
        });
        
        // Update inventory
        if (this.player.inventory) {
            this.game.ui.updateInventory(this.player.inventory);
        }
        
        // Update equipment
        if (this.player.equipment) {
            this.game.ui.updateEquipment(this.player.equipment);
        }
    }
    
    getSaveData() {
        return {
            mode: GAME_MODES.STANDARD,
            currentArea: this.currentArea.serialize(),
            currentAreaIndex: this.currentAreaIndex,
            player: this.player.serialize(),
            fogOfWar: this.fogOfWar.serialize(),
            stats: this.stats,
            progressionState: {
                visitedAreaTypes: Array.from(this.progressionState.visitedAreaTypes),
                mainPathProgress: this.progressionState.mainPathProgress,
                explorationBranchesAllowed: this.progressionState.explorationBranchesAllowed,
                currentExplorationBranches: this.progressionState.currentExplorationBranches,
                areaTypeOrder: this.progressionState.areaTypeOrder,
                difficultyGates: this.progressionState.difficultyGates
            },
            areaHistory: this.areaHistory.map(entry => ({
                area: entry.area.serialize(),
                playerPos: entry.playerPos,
                index: entry.index,
                areaType: entry.areaType,
                isMainPath: entry.isMainPath
            })),
            doorConnections: Array.from(this.doorConnections.entries()),
            timestamp: Date.now()
        };
    }
    
    loadGame(saveData) {
        try {
            console.log('StandardMode: Starting to load game data');
            
            // Restore game state
            const areaData = saveData.currentArea;
            console.log('StandardMode: Creating area with data:', areaData);
            this.currentArea = new Area(areaData.width, areaData.height, areaData.type, areaData.difficulty);
            this.currentArea.deserialize(areaData);
            console.log('StandardMode: Area created and deserialized successfully');
            
            console.log('StandardMode: Creating player');
            this.player = new Player();
            this.player.deserialize(saveData.player);
            console.log('StandardMode: Player created and deserialized successfully');
            
            // CRITICAL: Validate loaded player position is within bounds
            if (this.currentArea && this.player) {
                const wasOutOfBounds = this.player.x < 0 || this.player.x >= this.currentArea.width || 
                                      this.player.y < 0 || this.player.y >= this.currentArea.height;
                
                if (wasOutOfBounds) {
                    console.error(`StandardMode: Loaded player position (${this.player.x}, ${this.player.y}) is outside area bounds (${this.currentArea.width}x${this.currentArea.height})`);
                    
                    // Force player into bounds
                    this.player.x = Math.max(0, Math.min(this.player.x, this.currentArea.width - 1));
                    this.player.y = Math.max(0, Math.min(this.player.y, this.currentArea.height - 1));
                    
                    console.log(`StandardMode: Corrected loaded player position to (${this.player.x}, ${this.player.y})`);
                }
            }
            
            console.log('StandardMode: Creating fog of war');
            this.fogOfWar = new FogOfWar();
            this.fogOfWar.deserialize(saveData.fogOfWar);
            console.log('StandardMode: Fog of war created and deserialized successfully');
            
            this.stats = saveData.stats;
            this.currentAreaIndex = saveData.currentAreaIndex || 0;
            console.log('StandardMode: Stats and area index restored');

            // Restore progression state
            if (saveData.progressionState) {
                console.log('StandardMode: Restoring progression state');
                this.progressionState.visitedAreaTypes = new Set(saveData.progressionState.visitedAreaTypes || []);
                this.progressionState.mainPathProgress = saveData.progressionState.mainPathProgress || 0;
                this.progressionState.explorationBranchesAllowed = saveData.progressionState.explorationBranchesAllowed || 2;
                this.progressionState.currentExplorationBranches = saveData.progressionState.currentExplorationBranches || 0;
                this.progressionState.areaTypeOrder = saveData.progressionState.areaTypeOrder || ['MINE', 'CAVE', 'CRYSTAL_CAVERN', 'ANCIENT_RUINS', 'COSMIC_REGION'];
                this.progressionState.difficultyGates = saveData.progressionState.difficultyGates || {
                    'MINE': { minDifficulty: 1, minAreasVisited: 0 },
                    'CAVE': { minDifficulty: 2, minAreasVisited: 2 },
                    'CRYSTAL_CAVERN': { minDifficulty: 3, minAreasVisited: 4 },
                    'ANCIENT_RUINS': { minDifficulty: 4, minAreasVisited: 6 },
                    'COSMIC_REGION': { minDifficulty: 5, minAreasVisited: 8 }
                };
                console.log('StandardMode: Progression state restored');
            } else {
                console.log('StandardMode: No progression state found in save, using defaults');
            }

            this.areaHistory = [];

            // Restore area history
            if (saveData.areaHistory) {
                console.log('StandardMode: Restoring area history');
                for (const entry of saveData.areaHistory) {
                    const areaHistoryData = entry.area;
                    const area = new Area(areaHistoryData.width, areaHistoryData.height, areaHistoryData.type, areaHistoryData.difficulty);
                    area.deserialize(areaHistoryData);
                    this.areaHistory.push({
                        area: area,
                        playerPos: entry.playerPos,
                        index: entry.index,
                        areaType: entry.areaType,
                        isMainPath: entry.isMainPath
                    });
                }
                console.log('StandardMode: Area history restored');
            }

            // Restore door connections
            this.doorConnections.clear();
            if (saveData.doorConnections) {
                console.log('StandardMode: Restoring door connections');
                for (const [key, connection] of saveData.doorConnections) {
                    this.doorConnections.set(key, connection);
                }
                console.log('StandardMode: Door connections restored');
            }
            
            // Update UI
            console.log('StandardMode: Updating UI');
            this.updateUI();
            console.log('StandardMode: UI updated');
            
            console.log('StandardMode: Game loaded successfully');
        } catch (error) {
            console.error('StandardMode: Failed to load game:', error);
            throw error;
        }
    }
    
    cleanup() {
        // Clean up event listeners
        document.removeEventListener('playerMoved', this.handlePlayerMoved);
        document.removeEventListener('areaCompleted', this.handleAreaCompleted);
        document.removeEventListener('enemyDefeated', this.handleEnemyDefeated);
        document.removeEventListener('resourceMined', this.handleResourceMined);
        document.removeEventListener('miningComplete', this.handleMiningComplete);
        document.removeEventListener('levelUp', this.handleLevelUp);
    }
    
    pause() {
        // Pause any ongoing activities like mining
        if (this.player && this.player.isMining) {
            this.player.cancelMining();
        }
        // Could pause enemy movement, etc. if needed
    }
    
    resume() {
        // Resume any paused activities
        // For now, no special resume logic needed
    }
}