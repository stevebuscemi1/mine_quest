// js/core/Area.js

import { CELL_TYPES, AREA_TYPES, MATERIALS, ENEMY_TYPES, CHEST_TYPES, CHEST_LOOT_TABLES, EQUIPMENT_DEFINITIONS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Enemy } from './Enemy.js';
import { Merchant } from '../systems/Merchant.js';

export class Area {
    constructor(width, height, type = AREA_TYPES.MINE, difficulty = 1) {
        this.id = Utils.randomInt(10000, 99999).toString();
        this.name = Utils.generateAreaName(type, difficulty);
        this.width = width;
        this.height = height;
        this.type = type;
        this.difficulty = difficulty;
        this.grid = [];
        this.connections = [];
        this.isCustom = false;
        this.creatorName = '';
        this.timeLimit = 0;
        
        // Entities
        this.enemies = new Map();
        this.merchants = new Map();
        this.chests = new Map();
        this.exits = [];
        
        // Generation data
        this.rooms = [];
        this.corridors = [];
        this.specialCells = new Set();
        
        // Initialize grid
        this.initializeGrid();
    }
    
    initializeGrid() {
        this.grid = new Array(this.width * this.height).fill(CELL_TYPES.WALL);
    }
    
    generate(playerLevel = 1) {
        // Clear existing data
        this.rooms = [];
        this.corridors = [];
        this.specialCells.clear();
        this.enemies.clear();
        this.merchants.clear();
        this.chests.clear();
        this.exits = [];
        
        // Generate based on area type
        switch (this.type) {
            case AREA_TYPES.MINE:
                this.generateMine();
                break;
            case AREA_TYPES.CAVE:
                this.generateCave();
                break;
            case AREA_TYPES.CRYSTAL_CAVERN:
                this.generateCrystalCavern();
                break;
            case AREA_TYPES.ANCIENT_RUINS:
                this.generateAncientRuins();
                break;
            case AREA_TYPES.COSMIC_REGION:
                this.generateCosmicRegion();
                break;
            case AREA_TYPES.VOLCANIC:
                this.generateVolcanic();
                break;
            case AREA_TYPES.FROZEN:
                this.generateFrozen();
                break;
            case AREA_TYPES.DESERT:
                this.generateDesert();
                break;
            case AREA_TYPES.JUNGLE:
                this.generateJungle();
                break;
            case AREA_TYPES.ABYSS:
                this.generateAbyss();
                break;
            case 'debug_testing':
                // Skip generation for debug testing - let DebugMode handle layout
                break;
            default:
                this.generateMine();
        }
        
        // Place entities
        this.placeEnemies();
        this.placeMerchants();
        this.placeChests(playerLevel);
        this.placeCraftingStations();
        this.placeExits();
        
        // Add special features based on difficulty
        this.addSpecialFeatures();

        // Apply enclosure and terrain adjustments
        this.applyWallEnclosure();
    }
    
    generateMine() {
        // Generate rooms and corridors
        const roomCount = Utils.randomInt(5, 10);
        
        for (let i = 0; i < roomCount; i++) {
            const room = this.generateRoom();
            if (room) {
                this.rooms.push(room);
                this.carveRoom(room);
            }
        }
        
        // Connect rooms with corridors
        this.connectRooms();
        
        // Fill with mine materials
        this.fillWithMaterials([
            CELL_TYPES.DIRT, CELL_TYPES.ROCK, CELL_TYPES.COAL, 
            CELL_TYPES.IRON, CELL_TYPES.GOLD
        ]);
    }
    
    generateCave() {
        // Use cellular automata for cave generation
        this.initializeGrid(CELL_TYPES.ROCK);
        
        // Random initial state
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (Math.random() < 0.45) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                }
            }
        }
        
        // Apply cellular automata rules
        for (let iteration = 0; iteration < 5; iteration++) {
            const newGrid = [...this.grid];
            
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    const neighbors = this.countNeighborTypes(x, y, CELL_TYPES.EMPTY);
                    
                    if (neighbors >= 5) {
                        newGrid[y * this.width + x] = CELL_TYPES.EMPTY;
                    } else if (neighbors <= 2) {
                        newGrid[y * this.width + x] = CELL_TYPES.ROCK;
                    }
                }
            }
            
            this.grid = newGrid;
        }
        
        // Add cave materials with clustered crystal formations
        this.fillWithClusteredMaterials([
            CELL_TYPES.ROCK, CELL_TYPES.DIRT, CELL_TYPES.CRYSTAL,
            CELL_TYPES.GEM, CELL_TYPES.COAL
        ], 0.15, 4); // High cluster chance for crystal formations
    }
    
    generateCrystalCavern() {
        // Start with cave structure
        this.generateCave();
        
        // Add lots of crystals
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.ROCK && Math.random() < 0.3) {
                    this.setCell(x, y, CELL_TYPES.CRYSTAL);
                }
            }
        }
        
        // Add special crystal formations
        this.addCrystalFormations();
    }
    
    generateAncientRuins() {
        // Generate structured layout
        this.generateMine();
        
        // Replace some walls with ancient materials
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.WALL && Math.random() < 0.2) {
                    this.setCell(x, y, CELL_TYPES.OBSIDIAN);
                }
            }
        }
        
        // Add ancient treasures
        this.fillWithMaterials([
            CELL_TYPES.DIAMOND, CELL_TYPES.EMERALD, CELL_TYPES.RUBY,
            CELL_TYPES.SAPPHIRE, CELL_TYPES.GOLD
        ]);
    }
    
    generateCosmicRegion() {
        // Generate floating islands
        this.initializeGrid(CELL_TYPES.EMPTY);
        
        const islandCount = Utils.randomInt(3, 6);
        for (let i = 0; i < islandCount; i++) {
            const centerX = Utils.randomInt(10, this.width - 10);
            const centerY = Utils.randomInt(10, this.height - 10);
            const radius = Utils.randomInt(3, 8);
            
            for (let y = -radius; y <= radius; y++) {
                for (let x = -radius; x <= radius; x++) {
                    const distance = Math.sqrt(x * x + y * y);
                    if (distance <= radius) {
                        const px = centerX + x;
                        const py = centerY + y;
                        
                        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                            if (distance < radius - 1) {
                                this.setCell(px, py, CELL_TYPES.ENCHANTED);
                            } else {
                                this.setCell(px, py, CELL_TYPES.BEDROCK);
                            }
                        }
                    }
                }
            }
        }
        
        // Add cosmic materials
        this.fillWithMaterials([
            CELL_TYPES.ENCHANTED, CELL_TYPES.DIAMOND, CELL_TYPES.CRYSTAL
        ]);
    }
    
    generateVolcanic() {
        // Generate volcanic terrain with lava flows and obsidian formations
        this.initializeGrid(CELL_TYPES.ROCK);
        
        // Create lava chambers and tunnels using cellular automata
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (Math.random() < 0.35) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                }
            }
        }
        
        // Apply cellular automata to create cave-like structures
        for (let iteration = 0; iteration < 4; iteration++) {
            const newGrid = [...this.grid];
            
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    const neighbors = this.countNeighborTypes(x, y, CELL_TYPES.EMPTY);
                    
                    if (neighbors >= 4) {
                        newGrid[y * this.width + x] = CELL_TYPES.EMPTY;
                    } else if (neighbors <= 2) {
                        newGrid[y * this.width + x] = CELL_TYPES.ROCK;
                    }
                }
            }
            
            this.grid = newGrid;
        }
        
        // Add obsidian formations (walls become obsidian randomly)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.ROCK && Math.random() < 0.15) {
                    this.setCell(x, y, CELL_TYPES.OBSIDIAN);
                }
            }
        }
        
        // Add volcanic materials (use clustered distribution for obsidian veins)
        this.fillWithClusteredMaterials([
            CELL_TYPES.ROCK, CELL_TYPES.DIRT, CELL_TYPES.OBSIDIAN,
            CELL_TYPES.GOLD, CELL_TYPES.DIAMOND, CELL_TYPES.DRAGON_SCALE
        ], 0.08, 4); // Lower cluster chance, larger clusters for obsidian veins
    }
    
    generateFrozen() {
        // Generate icy caverns with glaciers and frozen lakes
        this.initializeGrid(CELL_TYPES.ICE);
        
        // Create open frozen areas with some rocky outcroppings
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (Math.random() < 0.6) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                } else if (Math.random() < 0.2) {
                    this.setCell(x, y, CELL_TYPES.ROCK);
                }
            }
        }
        
        // Add ice formations and frozen lakes
        const lakeCount = Utils.randomInt(2, 4);
        for (let i = 0; i < lakeCount; i++) {
            const centerX = Utils.randomInt(5, this.width - 5);
            const centerY = Utils.randomInt(5, this.height - 5);
            const radius = Utils.randomInt(2, 5);
            
            for (let y = -radius; y <= radius; y++) {
                for (let x = -radius; x <= radius; x++) {
                    const distance = Math.sqrt(x * x + y * y);
                    if (distance <= radius) {
                        const px = centerX + x;
                        const py = centerY + y;
                        
                        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                            if (this.getCell(px, py) === CELL_TYPES.EMPTY) {
                                this.setCell(px, py, CELL_TYPES.WATER); // Frozen lakes
                            }
                        }
                    }
                }
            }
        }
        
        // Add glacial formations
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.EMPTY && Math.random() < 0.08) {
                    this.setCell(x, y, CELL_TYPES.ICE);
                }
            }
        }
        
        // Add frozen materials (cluster crystals and gems)
        this.fillWithClusteredMaterials([
            CELL_TYPES.ICE, CELL_TYPES.ROCK, CELL_TYPES.CRYSTAL,
            CELL_TYPES.DIAMOND, CELL_TYPES.SAPPHIRE, CELL_TYPES.EMERALD
        ], 0.12, 3); // Higher cluster chance for crystal formations
    }
    
    generateDesert() {
        // Generate sandy desert with buried structures and dunes
        this.initializeGrid(CELL_TYPES.SAND);
        
        // Create open desert with some rocky areas
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (Math.random() < 0.8) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                }
            }
        }
        
        // Add buried structures (rooms beneath the sand)
        const buriedRoomCount = Utils.randomInt(3, 6);
        for (let i = 0; i < buriedRoomCount; i++) {
            const roomX = Utils.randomInt(5, this.width - 10);
            const roomY = Utils.randomInt(5, this.height - 10);
            const roomWidth = Utils.randomInt(3, 6);
            const roomHeight = Utils.randomInt(3, 6);
            
            // Create buried room
            for (let y = roomY; y < roomY + roomHeight; y++) {
                for (let x = roomX; x < roomX + roomWidth; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        if (Math.random() < 0.7) { // Some cells remain sandy
                            this.setCell(x, y, CELL_TYPES.EMPTY);
                        }
                    }
                }
            }
        }
        
        // Add desert rock formations
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.EMPTY && Math.random() < 0.05) {
                    this.setCell(x, y, CELL_TYPES.ROCK);
                }
            }
        }
        
        // Add desert materials (cluster precious metals and gems)
        this.fillWithClusteredMaterials([
            CELL_TYPES.SAND, CELL_TYPES.ROCK, CELL_TYPES.GOLD,
            CELL_TYPES.CRYSTAL, CELL_TYPES.RUBY, CELL_TYPES.DIAMOND
        ], 0.06, 2); // Rare clusters for buried treasures
    }
    
    generateJungle() {
        // Generate dense jungle with vegetation and water sources
        this.initializeGrid(CELL_TYPES.DIRT);
        
        // Create dense vegetation with clearings
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (Math.random() < 0.4) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                } else if (Math.random() < 0.3) {
                    this.setCell(x, y, CELL_TYPES.GRASS);
                }
            }
        }
        
        // Add water sources (lakes and streams)
        const waterSourceCount = Utils.randomInt(3, 5);
        for (let i = 0; i < waterSourceCount; i++) {
            const centerX = Utils.randomInt(5, this.width - 5);
            const centerY = Utils.randomInt(5, this.height - 5);
            const radius = Utils.randomInt(1, 3);
            
            for (let y = -radius; y <= radius; y++) {
                for (let x = -radius; x <= radius; x++) {
                    const distance = Math.sqrt(x * x + y * y);
                    if (distance <= radius) {
                        const px = centerX + x;
                        const py = centerY + y;
                        
                        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                            if (this.getCell(px, py) === CELL_TYPES.EMPTY) {
                                this.setCell(px, py, CELL_TYPES.WATER);
                            }
                        }
                    }
                }
            }
        }
        
        // Add dense vegetation clusters
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.DIRT && Math.random() < 0.2) {
                    this.setCell(x, y, CELL_TYPES.GRASS);
                }
            }
        }
        
        // Add jungle materials (cluster exotic gems and materials)
        this.fillWithClusteredMaterials([
            CELL_TYPES.DIRT, CELL_TYPES.GRASS, CELL_TYPES.WOOD,
            CELL_TYPES.CRYSTAL, CELL_TYPES.GEM, CELL_TYPES.DIAMOND,
            CELL_TYPES.EMERALD, CELL_TYPES.RUBY
        ], 0.1, 3); // Moderate clustering for jungle resources
    }
    
    generateAbyss() {
        // Generate deep abyss with vertical shafts and rare materials
        this.initializeGrid(CELL_TYPES.ROCK);
        
        // Create deep vertical shafts
        const shaftCount = Utils.randomInt(2, 4);
        for (let i = 0; i < shaftCount; i++) {
            const shaftX = Utils.randomInt(3, this.width - 3);
            const shaftTop = Utils.randomInt(2, 5);
            const shaftBottom = Utils.randomInt(this.height - 8, this.height - 3);
            
            // Create vertical shaft
            for (let y = shaftTop; y < shaftBottom; y++) {
                this.setCell(shaftX, y, CELL_TYPES.EMPTY);
                // Add some obsidian walls around shafts
                if (Math.random() < 0.6) {
                    if (shaftX - 1 >= 0) this.setCell(shaftX - 1, y, CELL_TYPES.OBSIDIAN);
                    if (shaftX + 1 < this.width) this.setCell(shaftX + 1, y, CELL_TYPES.OBSIDIAN);
                }
            }
        }
        
        // Create horizontal tunnels connecting shafts
        for (let y = 5; y < this.height - 5; y += Utils.randomInt(3, 6)) {
            const tunnelStart = Utils.randomInt(3, this.width - 10);
            const tunnelLength = Utils.randomInt(5, 12);
            
            for (let x = tunnelStart; x < tunnelStart + tunnelLength && x < this.width; x++) {
                if (this.getCell(x, y) === CELL_TYPES.ROCK) {
                    this.setCell(x, y, CELL_TYPES.EMPTY);
                }
            }
        }
        
        // Add rare abyss materials (cluster legendary materials)
        this.fillWithClusteredMaterials([
            CELL_TYPES.ROCK, CELL_TYPES.OBSIDIAN, CELL_TYPES.DIAMOND,
            CELL_TYPES.ADAMANTITE, CELL_TYPES.DRAGON_SCALE, CELL_TYPES.MYTHRIL
        ], 0.05, 2); // Very rare clusters for legendary materials
    }
    
    generateRoom() {
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const roomWidth = Utils.randomInt(4, 8);
            const roomHeight = Utils.randomInt(4, 8);
            const x = Utils.randomInt(1, this.width - roomWidth - 1);
            const y = Utils.randomInt(1, this.height - roomHeight - 1);
            
            const room = { x, y, width: roomWidth, height: roomHeight };
            
            // Check if room overlaps with existing rooms
            let overlaps = false;
            for (const existingRoom of this.rooms) {
                if (this.roomsOverlap(room, existingRoom)) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                return room;
            }
        }
        
        return null;
    }
    
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.setCell(x, y, CELL_TYPES.EMPTY);
            }
        }
    }
    
    connectRooms() {
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const room1 = this.rooms[i];
            const room2 = this.rooms[i + 1];
            
            const x1 = room1.x + Math.floor(room1.width / 2);
            const y1 = room1.y + Math.floor(room1.height / 2);
            const x2 = room2.x + Math.floor(room2.width / 2);
            const y2 = room2.y + Math.floor(room2.height / 2);
            
            this.carveCorridor(x1, y1, x2, y2);
        }
    }

    applyWallEnclosure() {
        const desiredThickness = 1;
        const maxPossibleThickness = Math.floor(Math.min(this.width, this.height) / 2);
        const borderThickness = Math.max(1, Math.min(desiredThickness, maxPossibleThickness));

        // Determine what material to use for interior walls based on area type
        let interiorMaterial;
        switch (this.type) {
            case AREA_TYPES.MINE:
                interiorMaterial = CELL_TYPES.DIRT;
                break;
            case AREA_TYPES.CAVE:
                interiorMaterial = CELL_TYPES.DIRT;
                break;
            case AREA_TYPES.CRYSTAL_CAVERN:
                interiorMaterial = CELL_TYPES.GEM;
                break;
            case AREA_TYPES.ABYSS:
                interiorMaterial = CELL_TYPES.OBSIDIAN;
                break;
            case AREA_TYPES.VOLCANIC:
                interiorMaterial = CELL_TYPES.ROCK;
                break;
            case AREA_TYPES.FROZEN:
                interiorMaterial = CELL_TYPES.ICE;
                break;
            case AREA_TYPES.DESERT:
                interiorMaterial = CELL_TYPES.SAND;
                break;
            case AREA_TYPES.JUNGLE:
                interiorMaterial = CELL_TYPES.DIRT;
                break;
            case AREA_TYPES.ANCIENT_RUINS:
                interiorMaterial = CELL_TYPES.LAVA;
                break;
            case AREA_TYPES.COSMIC_REGION:
                interiorMaterial = CELL_TYPES.ENCHANTED;
                break;
            default:
                interiorMaterial = CELL_TYPES.DIRT;
                break;
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const onBorder =
                    x < borderThickness ||
                    x >= this.width - borderThickness ||
                    y < borderThickness ||
                    y >= this.height - borderThickness;

                if (onBorder) {
                    this.setCell(x, y, CELL_TYPES.WALL);
                } else if (this.getCell(x, y) === CELL_TYPES.WALL) {
                    this.setCell(x, y, interiorMaterial);
                }
            }
        }
    }
    
    carveCorridor(x1, y1, x2, y2) {
        let x = x1;
        let y = y1;
        
        while (x !== x2 || y !== y2) {
            this.setCell(x, y, CELL_TYPES.EMPTY);
            
            if (Math.random() < 0.5) {
                x += Math.sign(x2 - x);
            } else {
                y += Math.sign(y2 - y);
            }
        }
        
        this.setCell(x2, y2, CELL_TYPES.EMPTY);
    }
    
    fillWithMaterials(materials) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                if (cell === CELL_TYPES.ROCK || cell === CELL_TYPES.EMPTY) {
                    if (Math.random() < 0.1) {
                        const material = Utils.randomChoice(materials);
                        this.setCell(x, y, material);
                    }
                }
            }
        }
    }
    
    fillWithClusteredMaterials(materials, clusterChance = 0.1, clusterSize = 3) {
        // First pass: place cluster centers
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                if ((cell === CELL_TYPES.ROCK || cell === CELL_TYPES.EMPTY) && Math.random() < clusterChance) {
                    const material = Utils.randomChoice(materials);
                    
                    // Create a cluster around this point
                    for (let dy = -clusterSize; dy <= clusterSize; dy++) {
                        for (let dx = -clusterSize; dx <= clusterSize; dx++) {
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const cx = x + dx;
                            const cy = y + dy;
                            
                            if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height) {
                                const targetCell = this.getCell(cx, cy);
                                if ((targetCell === CELL_TYPES.ROCK || targetCell === CELL_TYPES.EMPTY) && 
                                    Math.random() < (1 - distance / (clusterSize + 1))) {
                                    this.setCell(cx, cy, material);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Second pass: fill remaining areas with random materials
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                if ((cell === CELL_TYPES.ROCK || cell === CELL_TYPES.EMPTY) && Math.random() < 0.05) {
                    const material = Utils.randomChoice(materials);
                    this.setCell(x, y, material);
                }
            }
        }
    }
    
    addCrystalFormations() {
        const formationCount = Utils.randomInt(3, 8);
        
        for (let i = 0; i < formationCount; i++) {
            const x = Utils.randomInt(2, this.width - 2);
            const y = Utils.randomInt(2, this.height - 2);
            
            if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                this.setCell(x, y, CELL_TYPES.CRYSTAL);
                
                // Add surrounding crystals
                for (const neighbor of Utils.getNeighbors(x, y, true)) {
                    if (this.getCell(neighbor.x, neighbor.y) === CELL_TYPES.EMPTY && Math.random() < 0.5) {
                        this.setCell(neighbor.x, neighbor.y, CELL_TYPES.CRYSTAL);
                    }
                }
            }
        }
    }
    
    addSpecialFeatures() {
        // Add lava pools in volcanic areas
        if (this.type === AREA_TYPES.VOLCANIC) {
            const poolCount = Utils.randomInt(2, 4);
            for (let i = 0; i < poolCount; i++) {
                const x = Utils.randomInt(5, this.width - 5);
                const y = Utils.randomInt(5, this.height - 5);
                this.createPool(x, y, CELL_TYPES.LAVA, 3);
            }
        }
        
        // Add water in cave areas
        if (this.type === AREA_TYPES.CAVE) {
            const poolCount = Utils.randomInt(1, 3);
            for (let i = 0; i < poolCount; i++) {
                const x = Utils.randomInt(5, this.width - 5);
                const y = Utils.randomInt(5, this.height - 5);
                this.createPool(x, y, CELL_TYPES.WATER, 2);
            }
        }
        
        // Add lava flows in volcanic areas (longer, narrower pools)
        if (this.type === AREA_TYPES.VOLCANIC) {
            const lavaFlowCount = Utils.randomInt(1, 3);
            for (let i = 0; i < lavaFlowCount; i++) {
                const x = Utils.randomInt(3, this.width - 3);
                const y = Utils.randomInt(3, this.height - 3);
                this.createPool(x, y, CELL_TYPES.LAVA, 1); // Narrow flows
            }
        }
        
        // Add ice formations in frozen areas
        if (this.type === AREA_TYPES.FROZEN) {
            const iceFormationCount = Utils.randomInt(3, 6);
            for (let i = 0; i < iceFormationCount; i++) {
                const x = Utils.randomInt(3, this.width - 3);
                const y = Utils.randomInt(3, this.height - 3);
                this.createPool(x, y, CELL_TYPES.ICE, 2);
            }
        }
        
        // Add oasis in desert areas
        if (this.type === AREA_TYPES.DESERT) {
            const oasisCount = Utils.randomInt(1, 2);
            for (let i = 0; i < oasisCount; i++) {
                const x = Utils.randomInt(5, this.width - 5);
                const y = Utils.randomInt(5, this.height - 5);
                this.createPool(x, y, CELL_TYPES.WATER, 2);
            }
        }
        
        // Add dense vegetation clusters in jungle areas
        if (this.type === AREA_TYPES.JUNGLE) {
            const vegetationClusterCount = Utils.randomInt(4, 8);
            for (let i = 0; i < vegetationClusterCount; i++) {
                const x = Utils.randomInt(3, this.width - 3);
                const y = Utils.randomInt(3, this.height - 3);
                this.createPool(x, y, CELL_TYPES.GRASS, 2);
            }
        }
        
        // Add bottomless pits in abyss areas
        if (this.type === AREA_TYPES.ABYSS) {
            const pitCount = Utils.randomInt(1, 3);
            for (let i = 0; i < pitCount; i++) {
                const x = Utils.randomInt(4, this.width - 4);
                const y = Utils.randomInt(4, this.height - 4);
                this.createPool(x, y, CELL_TYPES.EMPTY, 3); // Bottomless pits
            }
        }
    }
    
    createPool(centerX, centerY, liquid, radius) {
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const distance = Math.sqrt(x * x + y * y);
                if (distance <= radius) {
                    const px = centerX + x;
                    const py = centerY + y;
                    
                    if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                        if (this.getCell(px, py) === CELL_TYPES.EMPTY) {
                            this.setCell(px, py, liquid);
                        }
                    }
                }
            }
        }
    }
    
    placeEnemies() {
        const enemyCount = Math.floor(this.width * this.height / 100) * this.difficulty;
        const enemyTypes = this.getEnemyTypesForArea();
        
        for (let i = 0; i < enemyCount; i++) {
            const x = Utils.randomInt(0, this.width - 1);
            const y = Utils.randomInt(0, this.height - 1);
            
            if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                const enemyType = Utils.randomChoice(enemyTypes);
                const enemy = new Enemy(x, y, enemyType);
                this.enemies.set(Utils.coordToKey(x, y), enemy);
            }
        }
        
        // Place boss if high difficulty
        if (this.difficulty >= 3) {
            this.placeBoss();
        }
    }
    
    placeBoss() {
        const room = this.rooms[this.rooms.length - 1];
        if (room) {
            const x = room.x + Math.floor(room.width / 2);
            const y = room.y + Math.floor(room.height / 2);
            
            const boss = new Enemy(x, y, 'DRAGON');
            this.enemies.set(Utils.coordToKey(x, y), boss);
        }
    }
    
    getEnemyTypesForArea() {
        const commonEnemies = ['SLIME', 'BAT'];
        const rareEnemies = ['SPIDER', 'ZOMBIE'];
        const eliteEnemies = ['SKELETON', 'GOLEM'];
        
        let enemyTypes = [...commonEnemies];
        
        if (this.difficulty >= 2) {
            enemyTypes.push(...rareEnemies);
        }
        
        if (this.difficulty >= 3) {
            enemyTypes.push(...eliteEnemies);
        }
        
        return enemyTypes;
    }
    
    placeMerchants() {
        const merchantCount = Utils.randomInt(0, 3);
        let placed = 0;
        const maxAttempts = 200; // More attempts since merchants can be 0-3
        let attempts = 0;
        
        console.log(`Area ${this.name}: Attempting to place ${merchantCount} merchants`);
        
        while (placed < merchantCount && attempts < maxAttempts) {
            const x = Utils.randomInt(0, this.width - 1);
            const y = Utils.randomInt(0, this.height - 1);
            
            if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                const merchant = new Merchant(x, y);
                this.merchants.set(Utils.coordToKey(x, y), merchant);
                this.setCell(x, y, CELL_TYPES.MERCHANT);
                placed++;
                console.log(`Placed merchant ${placed} at (${x}, ${y})`);
            }
            attempts++;
        }
        
        // If we couldn't place all merchants, try to place them by removing enemies from valid positions
        if (placed < merchantCount) {
            console.log(`Area ${this.name}: Could only place ${placed}/${merchantCount} merchants naturally, attempting to displace enemies...`);
            
            const remainingToPlace = merchantCount - placed;
            let displaced = 0;
            
            // Try to place remaining merchants by removing enemies
            while (displaced < remainingToPlace && attempts < maxAttempts * 2) {
                const x = Utils.randomInt(0, this.width - 1);
                const y = Utils.randomInt(0, this.height - 1);
                const enemyKey = Utils.coordToKey(x, y);
                
                // If there's an enemy here, remove it and place merchant
                if (this.enemies.has(enemyKey)) {
                    this.enemies.delete(enemyKey);
                    const merchant = new Merchant(x, y);
                    this.merchants.set(enemyKey, merchant);
                    this.setCell(x, y, CELL_TYPES.MERCHANT);
                    displaced++;
                    console.log(`Placed merchant ${placed + displaced} at (${x}, ${y}) by displacing enemy`);
                }
                attempts++;
            }
        }
        
        console.log(`Area ${this.name}: Total merchants placed: ${this.merchants.size}`);
    }
    
    placeChests(playerLevel = 1) {
        const chestCount = Utils.randomInt(2, 5);
        
        for (let i = 0; i < chestCount; i++) {
            const x = Utils.randomInt(0, this.width - 1);
            const y = Utils.randomInt(0, this.height - 1);
            
            if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                const chest = this.generateChest(playerLevel);
                chest.x = x; // Add coordinates to chest object
                chest.y = y;
                this.chests.set(Utils.coordToKey(x, y), chest);
                this.setCell(x, y, CELL_TYPES.CHEST);
            }
        }
    }
    
    placeCraftingStations() {
        // Always place exactly one crafting station per area
        const maxAttempts = 100;
        let attempts = 0;
        
        console.log(`Area ${this.name}: Placing crafting station`);
        
        while (attempts < maxAttempts) {
            const x = Utils.randomInt(0, this.width - 1);
            const y = Utils.randomInt(0, this.height - 1);
            
            if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                this.setCell(x, y, CELL_TYPES.CRAFTING);
                console.log(`Placed crafting station at (${x}, ${y})`);
                return; // Successfully placed, exit
            }
            attempts++;
        }
        
        // If we couldn't place it naturally, force placement
        console.warn('Could not place crafting station naturally, forcing placement...');
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                    this.setCell(x, y, CELL_TYPES.CRAFTING);
                    console.log('Forced crafting station placement at', x, y);
                    return;
                }
            }
        }
    }
    
    generateChest(playerLevel = 1) {
        // Determine chest type based on area difficulty and player level
        let chestType;

        // Base chance calculation
        const baseDifficulty = this.difficulty;
        const levelFactor = Math.max(0, playerLevel - 5) * 0.1; // Bonus chance after level 5
        const totalChance = baseDifficulty + levelFactor;

        // Determine chest rarity
        if (totalChance >= 3.5 || (this.difficulty >= 5 && playerLevel >= 15)) {
            chestType = CHEST_TYPES.LEGENDARY;
        } else if (totalChance >= 2.5 || (this.difficulty >= 3 && playerLevel >= 10)) {
            chestType = CHEST_TYPES.EPIC;
        } else if (totalChance >= 1.5 || (this.difficulty >= 2 && playerLevel >= 7)) {
            chestType = CHEST_TYPES.RARE;
        } else {
            chestType = CHEST_TYPES.COMMON;
        }

        const chestData = CHEST_LOOT_TABLES[chestType];
        const loot = [];

        // Generate items based on chest type
        const itemCount = Utils.randomInt(chestData.minItems, chestData.maxItems);

        for (let i = 0; i < itemCount; i++) {
            // Determine loot category
            const lootRoll = Math.random() * 100;
            let lootCategory;

            if (lootRoll < chestData.lootWeights.materials) {
                lootCategory = 'materials';
            } else if (lootRoll < chestData.lootWeights.materials + chestData.lootWeights.equipment) {
                lootCategory = 'equipment';
            } else {
                lootCategory = 'coins';
            }

            if (lootCategory === 'materials') {
                // Select material based on weighted random
                const materialRoll = Math.random() * 100;
                let cumulativeWeight = 0;
                let selectedMaterial = null;

                for (const material of chestData.materialLoot) {
                    cumulativeWeight += material.weight;
                    if (materialRoll <= cumulativeWeight) {
                        selectedMaterial = material;
                        break;
                    }
                }

                if (selectedMaterial) {
                    const count = Utils.randomInt(selectedMaterial.minCount, selectedMaterial.maxCount);
                    loot.push({
                        type: 'material',
                        materialType: selectedMaterial.type,
                        name: MATERIALS[selectedMaterial.type]?.name || 'Unknown Material',
                        count: count,
                        value: (MATERIALS[selectedMaterial.type]?.value || 1) * count,
                        color: MATERIALS[selectedMaterial.type]?.color || '#FFFFFF'
                    });
                }
            } else if (lootCategory === 'equipment') {
                // Select equipment based on weighted random
                const equipmentRoll = Math.random() * 100;
                let cumulativeWeight = 0;
                let selectedEquipment = null;

                for (const equipment of chestData.equipmentLoot) {
                    cumulativeWeight += equipment.weight;
                    if (equipmentRoll <= cumulativeWeight) {
                        selectedEquipment = equipment;
                        break;
                    }
                }

                if (selectedEquipment) {
                    const equipmentData = EQUIPMENT_DEFINITIONS[selectedEquipment.type];
                    if (equipmentData) {
                        loot.push({
                            id: `equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: equipmentData.name,
                            slot: equipmentData.slot,
                            stats: equipmentData.stats,
                            durability: equipmentData.durability || 100,
                            maxDurability: equipmentData.durability || 100,
                            value: equipmentData.value,
                            color: equipmentData.color,
                            miningLevel: equipmentData.miningLevel,
                            equipmentType: selectedEquipment.type,
                            type: 'equipment'
                        });
                    }
                }
            } else if (lootCategory === 'coins') {
                // Add extra coins
                const coinAmount = Utils.randomInt(chestData.coinRange.min, chestData.coinRange.max);
                loot.push({
                    type: 'coins',
                    count: coinAmount,
                    name: `${coinAmount} Coins`,
                    value: coinAmount,
                    color: '#FFD700'
                });
            }
        }

        return {
            type: chestType,
            loot: loot,
            isOpened: false,
            name: chestData.name,
            color: chestData.color
        };
    }
    
    placeExits() {
        // Ensure at least one exit - keep trying until we place at least one
        const targetExitCount = Utils.randomInt(1, 3);
        let attempts = 0;
        const maxAttempts = 100;
        
        console.log(`Area ${this.name}: Attempting to place ${targetExitCount} exits`);
        
        while (this.exits.length < targetExitCount && attempts < maxAttempts) {
            const x = Utils.randomInt(0, this.width - 1);
            const y = Utils.randomInt(0, this.height - 1);
            
            if (this.isValidDoorPosition(x, y)) {
                this.exits.push({ x, y });
                this.setCell(x, y, CELL_TYPES.DOOR);
                // Clear at least 3 cells around the door for safe spawning
                this.clearAreaAroundDoor(x, y, 3);
                console.log(`Placed exit ${this.exits.length} at (${x}, ${y}) with cleared area`);
            }
            attempts++;
        }
        
        // If no exits placed, force place one in first available empty space
        if (this.exits.length === 0) {
            console.warn('No exits placed naturally, forcing placement...');
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.getCell(x, y) === CELL_TYPES.EMPTY) {
                        this.exits.push({ x, y });
                        this.setCell(x, y, CELL_TYPES.DOOR);
                        this.clearAreaAroundDoor(x, y, 3);
                        console.log('Forced exit placement at', x, y, 'with cleared area');
                        break;
                    }
                }
                if (this.exits.length > 0) break;
            }
        }
        
        console.log(`Area ${this.name}: Total exits placed: ${this.exits.length}`);
    }
    
    isValidDoorPosition(x, y) {
        // Door must be on empty cell
        if (this.getCell(x, y) !== CELL_TYPES.EMPTY) return false;
        
        // Check if there are at least 3 empty or clearable cells around it
        const adjacentCells = [
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x, y: y - 1 },
            { x: x, y: y + 1 }
        ];
        
        let clearableCount = 0;
        for (const pos of adjacentCells) {
            if (pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height) {
                const cell = this.getCell(pos.x, pos.y);
                // Count empty cells or cells that can be cleared (not walls, not enemies, not chests)
                if (cell === CELL_TYPES.EMPTY || 
                    (cell !== CELL_TYPES.WALL && 
                     cell !== CELL_TYPES.CHEST && 
                     cell !== CELL_TYPES.CHEST_OPENED &&
                     !this.enemies.has(Utils.coordToKey(pos.x, pos.y)))) {
                    clearableCount++;
                }
            }
        }
        
        return clearableCount >= 3;
    }
    
    clearAreaAroundDoor(doorX, doorY, minCells) {
        // Create a 3x3 room around the door for safe spawning
        // Clear all cells in a 3x3 area centered on the door (but keep the door itself)
        const clearRadius = 1; // Clear 1 cell in each direction (3x3 total)

        let clearedCount = 0;

        // Clear cells in a 3x3 area around the door
        for (let dy = -clearRadius; dy <= clearRadius; dy++) {
            for (let dx = -clearRadius; dx <= clearRadius; dx++) {
                const posX = doorX + dx;
                const posY = doorY + dy;

                // Skip the door itself
                if (dx === 0 && dy === 0) continue;

                if (posX >= 0 && posX < this.width && posY >= 0 && posY < this.height) {
                    const cell = this.getCell(posX, posY);
                    const enemyKey = Utils.coordToKey(posX, posY);

                    // Clear if it's not a wall, door, or chest (preserve important objects)
                    if (cell !== CELL_TYPES.WALL &&
                        cell !== CELL_TYPES.DOOR &&
                        cell !== CELL_TYPES.CHEST &&
                        cell !== CELL_TYPES.CHEST_OPENED) {
                        this.setCell(posX, posY, CELL_TYPES.EMPTY);
                        // Remove enemy if present
                        if (this.enemies.has(enemyKey)) {
                            this.enemies.delete(enemyKey);
                        }
                        clearedCount++;
                    }
                }
            }
        }

        // Ensure we have at least the minimum required cleared cells
        if (clearedCount < minCells) {
            console.warn(`Only cleared ${clearedCount} cells around door at (${doorX}, ${doorY}), minimum required: ${minCells}`);
        } else {
            console.log(`Successfully cleared ${clearedCount} cells around door at (${doorX}, ${doorY}) for safe spawning`);
        }
    }
    
    roomsOverlap(room1, room2) {
        return !(room1.x + room1.width < room2.x ||
                room2.x + room2.width < room1.x ||
                room1.y + room1.height < room2.y ||
                room2.y + room2.height < room1.y);
    }
    
    countNeighborTypes(x, y, type) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    if (this.getCell(nx, ny) === type) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.grid[y * this.width + x];
    }
    
    setCell(x, y, value) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y * this.width + x] = value;
        }
    }
    
    getExitCount() {
        return this.exits.length;
    }
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            type: this.type,
            difficulty: this.difficulty,
            grid: this.grid,
            connections: this.connections,
            isCustom: this.isCustom,
            creatorName: this.creatorName,
            timeLimit: this.timeLimit,
            enemies: Array.from(this.enemies.entries()).map(([key, enemy]) => [key, enemy.serialize()]),
            merchants: Array.from(this.merchants.entries()).map(([key, merchant]) => [key, merchant.serialize()]),
            chests: Array.from(this.chests.entries()),
            exits: this.exits
        };
    }
    
    deserialize(data) {
        this.id = data.id;
        this.name = data.name;
        this.width = data.width;
        this.height = data.height;
        this.type = data.type;
        this.difficulty = data.difficulty;
        this.grid = data.grid;
        this.connections = data.connections;
        this.isCustom = data.isCustom;
        this.creatorName = data.creatorName;
        this.timeLimit = data.timeLimit;
        this.exits = data.exits;
        
        // Restore enemies
        this.enemies.clear();
        for (const [key, enemyData] of data.enemies) {
            const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type);
            enemy.deserialize(enemyData);
            this.enemies.set(key, enemy);
        }
        
        // Restore merchants
        this.merchants.clear();
        for (const [key, merchantData] of data.merchants) {
            const merchant = new Merchant(merchantData.x, merchantData.y);
            merchant.deserialize(merchantData);
            this.merchants.set(key, merchant);
        }
        
        // Restore chests
        this.chests.clear();
        for (const [key, chest] of data.chests) {
            this.chests.set(key, chest);
        }
    }
}