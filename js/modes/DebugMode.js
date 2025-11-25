// js/modes/DebugMode.js

import { GAME_MODES, CELL_TYPES, MATERIALS, EQUIPMENT_DEFINITIONS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Area } from '../core/Area.js';
import { Player } from '../core/Player.js';
import { Enemy } from '../core/Enemy.js';
import { Merchant } from '../systems/Merchant.js';
import { StandardMode } from './StandardMode.js';

export class DebugMode {
    constructor(game) {
        this.game = game;
        this.mode = GAME_MODES.DEBUG;

        // Use StandardMode for all game rules and functions
        this.standardMode = new StandardMode(game);

        // Override to use our testing area instead of generated areas
        this.standardMode.generateNewArea = this.generateTestingArea.bind(this);
        
        // Flag to prevent multiple area generations
        this.testingAreaGenerated = false;
    }

async init() {
        console.log('DebugMode: Initializing testing environment...');

        // Initialize the StandardMode with our testing area
        await this.standardMode.init();

        console.log('DebugMode: Testing environment ready');
        console.log('DebugMode: Testing map includes:');
        console.log('- All cell types and materials');
        console.log('- All enemy types including boss');
        console.log('- All 5 merchant specialty types');
        console.log('- Multiple chests with loot');
        console.log('- Doors for area transitions');
        console.log('- Full visibility for testing');
    }

    get player() {
        return this.standardMode.player;
    }

    get currentArea() {
        return this.standardMode.currentArea;
    }

    get fogOfWar() {
        return this.standardMode.fogOfWar;
    }

    generateTestingArea() {
        console.log('DebugMode: Generating testing area...');

        // Prevent multiple generations
        if (this.testingAreaGenerated) {
            console.log('DebugMode: Testing area already generated, skipping...');
            return;
        }
        this.testingAreaGenerated = true;

        try {
            // Create a large testing area (60x40 for compact testing)
            const width = 60;
            const height = 40;

            this.standardMode.currentArea = new Area(width, height, 'debug_testing', 1);
            // Skip standard generation for debug testing - we'll set up the layout manually
            
            // Set up basic area structure: walls on borders, empty interior
            this.setupBasicAreaStructure();

            // Find valid spawn position
            const spawnPos = this.findValidSpawnPosition();
            
            // Clear walls around spawn position to allow player movement
            this.clearSpawnArea(spawnPos.x, spawnPos.y);
            
            this.standardMode.player.x = spawnPos.x;
            this.standardMode.player.y = spawnPos.y;

            // Add comprehensive testing elements
            this.addTestingElements();

            // Reveal entire area for testing (no fog of war)
            this.setupFullVisibility();

            console.log('DebugMode: Testing area generated successfully');
        } catch (error) {
            console.error('DebugMode: Failed to generate testing area:', error);
            throw error;
        }
    }

    createTestingArea() {
        // This method is no longer needed - area generation happens in generateTestingArea
        console.warn('DebugMode: createTestingArea called but should not be used');
    }

    findValidSpawnPosition() {
        const area = this.standardMode.currentArea;

        // Start in the center-left area for good overview
        const centerX = Math.floor(area.width / 4);
        const startY = 5;

        // Find nearest empty cell
        for (let y = startY; y < area.height; y++) {
            for (let x = centerX - 5; x <= centerX + 5; x++) {
                if (x >= 0 && x < area.width && y >= 0 && y < area.height) {
                    const cell = area.getCell(x, y);
                    const enemyKey = Utils.coordToKey(x, y);
                    if (cell === CELL_TYPES.EMPTY && !area.enemies.has(enemyKey)) {
                        return { x, y };
                    }
                }
            }
        }

        // Fallback to center
        return { x: centerX, y: startY };
    }

    clearSpawnArea(centerX, centerY) {
        const area = this.standardMode.currentArea;
        const radius = 3; // Clear a 7x7 area (radius 3) around spawn position

        console.log(`DebugMode: Clearing spawn area around (${centerX}, ${centerY}) with radius ${radius}`);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const clearX = centerX + dx;
                const clearY = centerY + dy;

                if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                    // Only clear WALL cells, leave other cells (like doors, merchants) intact
                    const currentCell = area.getCell(clearX, clearY);
                    if (currentCell === CELL_TYPES.WALL) {
                        area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                    }
                }
            }
        }

        console.log(`DebugMode: Spawn area cleared`);
    }

    setupBasicAreaStructure() {
        const area = this.standardMode.currentArea;
        const borderThickness = 1;

        console.log(`DebugMode: Setting up basic area structure (${area.width}x${area.height}) with ${borderThickness} cell thick borders`);

        for (let y = 0; y < area.height; y++) {
            for (let x = 0; x < area.width; x++) {
                const onBorder =
                    x < borderThickness ||
                    x >= area.width - borderThickness ||
                    y < borderThickness ||
                    y >= area.height - borderThickness;

                if (onBorder) {
                    // Keep walls on borders
                    area.setCell(x, y, CELL_TYPES.WALL);
                } else {
                    // Clear interior to empty
                    area.setCell(x, y, CELL_TYPES.EMPTY);
                }
            }
        }

        console.log('DebugMode: Basic area structure set up');
    }

    addTestingElements() {
        const area = this.standardMode.currentArea;

        // Add organized testing sections
        this.addMaterialShowcase(area);
        this.addEnemyShowcase(area);
        this.addBossShowcase(area);
        this.addMerchantShowcase(area);
        this.addChestShowcase(area);
        this.addDoorShowcase(area);
    }

    addMaterialShowcase(area) {
        console.log('DebugMode: Adding material showcase...');

        // Create a large grid of all mineable materials
        const materials = [
            // Common materials
            { type: CELL_TYPES.DIRT, name: 'Dirt' },
            { type: CELL_TYPES.ROCK, name: 'Rock' },
            { type: CELL_TYPES.COAL, name: 'Coal' },
            { type: CELL_TYPES.IRON, name: 'Iron' },
            { type: CELL_TYPES.COPPER, name: 'Copper' },
            { type: CELL_TYPES.SILVER, name: 'Silver' },

            // Precious materials
            { type: CELL_TYPES.GOLD, name: 'Gold' },
            { type: CELL_TYPES.CRYSTAL, name: 'Crystal' },
            { type: CELL_TYPES.GEM, name: 'Gem' },
            { type: CELL_TYPES.DIAMOND, name: 'Diamond' },
            { type: CELL_TYPES.EMERALD, name: 'Emerald' },
            { type: CELL_TYPES.RUBY, name: 'Ruby' },
            { type: CELL_TYPES.SAPPHIRE, name: 'Sapphire' },
            { type: CELL_TYPES.AMETHYST, name: 'Amethyst' },

            // Rare materials
            { type: CELL_TYPES.OBSIDIAN, name: 'Obsidian' },
            { type: CELL_TYPES.PLATINUM, name: 'Platinum' },
            { type: CELL_TYPES.MYTHRIL, name: 'Mythril' },
            { type: CELL_TYPES.ADAMANTITE, name: 'Adamantite' },
            { type: CELL_TYPES.ENCHANTED, name: 'Enchanted' },

            // Environmental
            { type: CELL_TYPES.GRASS, name: 'Grass' },
            { type: CELL_TYPES.SAND, name: 'Sand' },
            { type: CELL_TYPES.ICE, name: 'Ice' },
            { type: CELL_TYPES.WOOD, name: 'Wood' },

            // Enemy drops
            { type: CELL_TYPES.GEL, name: 'Gel' },
            { type: CELL_TYPES.SILK, name: 'Silk' },
            { type: CELL_TYPES.ROTTEN_FLESH, name: 'Rotten Flesh' },
            { type: CELL_TYPES.BONE, name: 'Bone' },
            { type: CELL_TYPES.DRAGON_SCALE, name: 'Dragon Scale' }
        ];

        // Place materials in organized rows starting from left side
        let x = 2;
        let y = 8;
        const materialsPerRow = 6;

        materials.forEach((material, index) => {
            // Clear area around material for mining access
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const clearX = x + dx;
                    const clearY = y + dy;
                    if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                        const currentCell = area.getCell(clearX, clearY);
                        if (currentCell !== CELL_TYPES.WALL && currentCell !== CELL_TYPES.BEDROCK) {
                            area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                        }
                    }
                }
            }

            area.setCell(x, y, material.type);

            x += 3;
            if ((index + 1) % materialsPerRow === 0) {
                x = 5;
                y += 3;
            }
        });

        console.log(`DebugMode: Added ${materials.length} materials for testing`);
    }

    addEnemyShowcase(area) {
        console.log('DebugMode: Adding enemy showcase...');

        const enemyTypes = [
            'SLIME', 'BAT', 'SPIDER', 'ZOMBIE', 'SKELETON',
            'GOLEM' // Boss will be separate
        ];

        // Place enemies in a line on the right side of materials
        let x = 40;
        const y = 12;
        const spacing = 3;

        enemyTypes.forEach(type => {
            const enemy = new Enemy(x, y, type);
            area.enemies.set(Utils.coordToKey(x, y), enemy);

            // Clear space around enemy
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const clearX = x + dx;
                    const clearY = y + dy;
                    if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                        area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                    }
                }
            }

            console.log(`DebugMode: Added ${type} at (${x}, ${y})`);
            x += spacing;
        });

        console.log(`DebugMode: Added ${enemyTypes.length} enemy types for testing`);
    }

    addBossShowcase(area) {
        console.log('DebugMode: Adding boss showcase...');

        // Place boss in a prominent location near enemies
        const bossX = 52;
        const bossY = 16;

        const boss = new Enemy(bossX, bossY, 'DRAGON');
        boss.isBoss = true;
        area.enemies.set(Utils.coordToKey(bossX, bossY), boss);

        // Clear large area around boss
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const clearX = bossX + dx;
                const clearY = bossY + dy;
                if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                    area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                }
            }
        }

        console.log(`DebugMode: Added DRAGON BOSS at (${bossX}, ${bossY})`);
    }

    addMerchantShowcase(area) {
        console.log('DebugMode: Adding all 5 merchant specialty types...');

        const merchantTypes = [
            { specialty: 'tools', x: 5, y: 22, name: 'Tool Merchant' },
            { specialty: 'resources', x: 8, y: 22, name: 'Resource Merchant' },
            { specialty: 'armor', x: 11, y: 22, name: 'Armor Merchant' },
            { specialty: 'weapons', x: 14, y: 22, name: 'Weapon Merchant' },
            { specialty: 'rare_items', x: 17, y: 22, name: 'Rare Items Merchant' }
        ];

        merchantTypes.forEach(({ specialty, x, y, name }) => {
            // Create merchant with specific specialty
            const merchant = new Merchant(x, y);
            merchant.specialty = specialty;
            merchant.name = name;
            merchant.personality = 'friendly'; // Keep friendly for consistent testing

            // Customize inventory based on specialty
            this.customizeMerchantInventory(merchant, specialty);

            area.merchants.set(Utils.coordToKey(x, y), merchant);
            area.setCell(x, y, CELL_TYPES.MERCHANT);

            // Clear space around merchant
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const clearX = x + dx;
                    const clearY = y + dy;
                    if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                        area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                    }
                }
            }

            console.log(`DebugMode: Added ${specialty} merchant at (${x}, ${y})`);
        });

        console.log('DebugMode: Added all 5 merchant specialty types for testing');
    }

    customizeMerchantInventory(merchant, specialty) {
        // Clear default inventory
        merchant.inventory = [];

        // Generate specialty-specific inventory
        switch (specialty) {
            case 'tools':
                this.generateToolInventory(merchant);
                break;
            case 'resources':
                this.generateResourceInventory(merchant);
                break;
            case 'armor':
                this.generateArmorInventory(merchant);
                break;
            case 'weapons':
                this.generateWeaponInventory(merchant);
                break;
            case 'rare_items':
                this.generateRareItemInventory(merchant);
                break;
        }
    }

    generateToolInventory(merchant) {
        const toolItems = [
            { type: 'WOODEN_PICKAXE', basePrice: 10 },
            { type: 'STONE_PICKAXE', basePrice: 25 },
            { type: 'IRON_PICKAXE', basePrice: 50 },
            { type: 'STONE_PICKAXE', basePrice: 25 }, // Multiple for testing
            { type: 'WOODEN_PICKAXE', basePrice: 10 },
            { type: 'IRON_PICKAXE', basePrice: 50 },
            { type: 'STONE_PICKAXE', basePrice: 25 }
        ];

        toolItems.forEach(tool => {
            const item = {
                id: this.generateMerchantItemId(),
                name: tool.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                type: 'equipment',
                equipmentType: tool.type,
                value: Math.floor(tool.basePrice * merchant.sellPriceMultiplier),
                buyPrice: Math.floor(tool.basePrice * merchant.buyPriceMultiplier),
                sellPrice: Math.floor(tool.basePrice * merchant.sellPriceMultiplier),
                durability: Utils.randomInt(80, 100),
                maxDurability: 100
            };
            merchant.inventory.push(item);
        });
    }

    generateResourceInventory(merchant) {
        const resourceItems = [
            { material: 'IRON', basePrice: 15, count: 8 },
            { material: 'GOLD', basePrice: 50, count: 3 },
            { material: 'CRYSTAL', basePrice: 10, count: 12 },
            { material: 'GEM', basePrice: 25, count: 5 },
            { material: 'DIAMOND', basePrice: 100, count: 2 },
            { material: 'IRON', basePrice: 15, count: 6 },
            { material: 'CRYSTAL', basePrice: 10, count: 10 },
            { material: 'GOLD', basePrice: 50, count: 4 }
        ];

        resourceItems.forEach(resource => {
            const item = {
                id: this.generateMerchantItemId(),
                name: MATERIALS[resource.material]?.name || resource.material,
                type: 'resource',
                material: resource.material,
                count: resource.count,
                value: Math.floor(resource.basePrice * merchant.sellPriceMultiplier),
                buyPrice: Math.floor(resource.basePrice * merchant.buyPriceMultiplier),
                sellPrice: Math.floor(resource.basePrice * merchant.sellPriceMultiplier),
                color: MATERIALS[resource.material]?.color || '#FFFFFF'
            };
            merchant.inventory.push(item);
        });
    }

    generateArmorInventory(merchant) {
        const armorItems = [
            { type: 'LEATHER_ARMOR', basePrice: 20 },
            { type: 'IRON_ARMOR', basePrice: 60 },
            { type: 'LEATHER_ARMOR', basePrice: 20 },
            { type: 'IRON_ARMOR', basePrice: 60 },
            { type: 'POWER_GLOVES', basePrice: 30 },
            { type: 'POWER_GLOVES', basePrice: 30 },
            { type: 'LEATHER_ARMOR', basePrice: 20 }
        ];

        armorItems.forEach(armor => {
            const item = {
                id: this.generateMerchantItemId(),
                name: armor.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                type: 'equipment',
                equipmentType: armor.type,
                value: Math.floor(armor.basePrice * merchant.sellPriceMultiplier),
                buyPrice: Math.floor(armor.basePrice * merchant.buyPriceMultiplier),
                sellPrice: Math.floor(armor.basePrice * merchant.sellPriceMultiplier),
                durability: Utils.randomInt(70, 100),
                maxDurability: 100
            };
            merchant.inventory.push(item);
        });
    }

    generateWeaponInventory(merchant) {
        // Weapons aren't implemented yet in the game, so we'll use available equipment
        const weaponItems = [
            { type: 'WOODEN_PICKAXE', basePrice: 15, name: 'Wooden Club' },
            { type: 'STONE_PICKAXE', basePrice: 35, name: 'Stone Mace' },
            { type: 'IRON_PICKAXE', basePrice: 75, name: 'Iron Sword' },
            { type: 'WOODEN_PICKAXE', basePrice: 15, name: 'Wooden Staff' },
            { type: 'STONE_PICKAXE', basePrice: 35, name: 'Stone Hammer' },
            { type: 'IRON_PICKAXE', basePrice: 75, name: 'Iron Axe' }
        ];

        weaponItems.forEach(weapon => {
            const item = {
                id: this.generateMerchantItemId(),
                name: weapon.name,
                type: 'equipment',
                equipmentType: weapon.type,
                value: Math.floor(weapon.basePrice * merchant.sellPriceMultiplier),
                buyPrice: Math.floor(weapon.basePrice * merchant.buyPriceMultiplier),
                sellPrice: Math.floor(weapon.basePrice * merchant.sellPriceMultiplier),
                durability: Utils.randomInt(60, 90),
                maxDurability: 100
            };
            merchant.inventory.push(item);
        });
    }

    generateRareItemInventory(merchant) {
        const rareItems = [
            { name: 'Health Potion', effect: 'heal', healAmount: 50, price: 15, count: 5 },
            { name: 'Strength Potion', effect: 'strength', strengthBonus: 5, duration: 30000, price: 25, count: 3 },
            { name: 'Luck Potion', effect: 'luck', luckBonus: 10, duration: 60000, price: 30, count: 2 },
            { name: 'Speed Potion', effect: 'haste', speedBonus: 0.5, duration: 45000, price: 20, count: 4 },
            { name: 'Defense Potion', effect: 'defense_boost', defenseBonus: 3, duration: 30000, price: 22, count: 3 },
            { name: 'Health Potion', effect: 'heal', healAmount: 50, price: 15, count: 3 }
        ];

        rareItems.forEach(rare => {
            const item = {
                id: this.generateMerchantItemId(),
                name: rare.name,
                type: 'consumable',
                effect: rare.effect,
                healAmount: rare.healAmount,
                strengthBonus: rare.strengthBonus,
                luckBonus: rare.luckBonus,
                speedBonus: rare.speedBonus,
                defenseBonus: rare.defenseBonus,
                duration: rare.duration,
                value: rare.price,
                count: rare.count,
                buyPrice: Math.floor(rare.price * merchant.buyPriceMultiplier),
                sellPrice: Math.floor(rare.price * merchant.sellPriceMultiplier * 0.5),
                color: '#FF6B6B'
            };
            merchant.inventory.push(item);
        });
    }

    generateMerchantItemId() {
        return 'debug_merchant_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addChestShowcase(area) {
        console.log('DebugMode: Adding chest showcase...');

        // Add multiple chests with different loot types
        const chestPositions = [
            { x: 5, y: 28, loot: 'resources' },
            { x: 8, y: 28, loot: 'equipment' },
            { x: 11, y: 28, loot: 'mixed' },
            { x: 14, y: 28, loot: 'rare' },
            { x: 17, y: 28, loot: 'valuable' }
        ];

        chestPositions.forEach((pos, index) => {
            const chest = this.createTestingChest(pos.x, pos.y, pos.loot);
            area.chests.set(Utils.coordToKey(pos.x, pos.y), chest);
            area.setCell(pos.x, pos.y, CELL_TYPES.CHEST);

            // Clear space around chest
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const clearX = pos.x + dx;
                    const clearY = pos.y + dy;
                    if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                        area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                    }
                }
            }

            console.log(`DebugMode: Added ${pos.loot} chest at (${pos.x}, ${pos.y})`);
        });

        console.log(`DebugMode: Added ${chestPositions.length} testing chests`);
    }

    createTestingChest(x, y, lootType) {
        const lootTemplates = {
            resources: [
                { type: 'material', materialType: CELL_TYPES.GOLD, count: 5 },
                { type: 'material', materialType: CELL_TYPES.IRON, count: 3 },
                { type: 'material', materialType: CELL_TYPES.CRYSTAL, count: 4 }
            ],
            equipment: [
                { type: 'equipment', equipmentType: 'WOODEN_PICKAXE' },
                { type: 'equipment', equipmentType: 'LEATHER_ARMOR' },
                { type: 'equipment', equipmentType: 'POWER_GLOVES' }
            ],
            mixed: [
                { type: 'material', materialType: CELL_TYPES.DIAMOND, count: 2 },
                { type: 'material', materialType: CELL_TYPES.GOLD, count: 3 },
                { type: 'equipment', equipmentType: 'IRON_PICKAXE' }
            ],
            rare: [
                { type: 'material', materialType: CELL_TYPES.DIAMOND, count: 3 },
                { type: 'material', materialType: CELL_TYPES.EMERALD, count: 2 },
                { type: 'material', materialType: CELL_TYPES.DRAGON_SCALE, count: 1 }
            ],
            valuable: [
                { type: 'material', materialType: CELL_TYPES.DIAMOND, count: 5 },
                { type: 'material', materialType: CELL_TYPES.PLATINUM, count: 2 },
                { type: 'material', materialType: CELL_TYPES.ADAMANTITE, count: 1 }
            ]
        };

        // Convert raw loot templates to proper item objects
        const loot = [];
        const rawLoot = lootTemplates[lootType] || lootTemplates.resources;

        for (const itemData of rawLoot) {
            if (itemData.type === 'material') {
                const materialInfo = MATERIALS[itemData.materialType];
                if (materialInfo) {
                    loot.push({
                        type: 'material',
                        materialType: itemData.materialType,
                        name: materialInfo.name,
                        count: itemData.count,
                        value: materialInfo.value * itemData.count,
                        color: materialInfo.color
                    });
                }
            } else if (itemData.type === 'equipment') {
                const equipmentData = EQUIPMENT_DEFINITIONS[itemData.equipmentType];
                if (equipmentData) {
                    loot.push({
                        type: 'equipment',
                        equipmentType: itemData.equipmentType,
                        name: equipmentData.name,
                        slot: equipmentData.slot,
                        stats: equipmentData.stats,
                        durability: equipmentData.durability,
                        value: equipmentData.value,
                        color: equipmentData.color
                    });
                }
            }
        }

        return {
            x: x,
            y: y,
            loot: loot,
            isOpened: false,
            type: 'common', // Default chest type
            name: 'Debug Chest',
            color: '#FFD700'
        };
    }

    addDoorShowcase(area) {
        console.log('DebugMode: Adding door showcase...');

        // Add doors at strategic locations for testing teleportation
        const doorPositions = [
            { x: 10, y: 35 },
            { x: 30, y: 35 },
            { x: 50, y: 35 }
        ];

        doorPositions.forEach((pos, index) => {
            area.setCell(pos.x, pos.y, CELL_TYPES.DOOR);
            area.exits.push({ x: pos.x, y: pos.y });

            // Ensure doors have empty cells around them
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const clearX = pos.x + dx;
                    const clearY = pos.y + dy;
                    if (clearX >= 0 && clearX < area.width && clearY >= 0 && clearY < area.height) {
                        const currentCell = area.getCell(clearX, clearY);
                        if (currentCell !== CELL_TYPES.DOOR) {
                            area.setCell(clearX, clearY, CELL_TYPES.EMPTY);
                        }
                    }
                }
            }

            console.log(`DebugMode: Added testing door ${index + 1} at (${pos.x}, ${pos.y})`);
        });

        console.log(`DebugMode: Added ${doorPositions.length} testing doors`);
    }

    setupFullVisibility() {
        const area = this.standardMode.currentArea;

        // Reveal entire area for testing
        for (let y = 0; y < area.height; y++) {
            for (let x = 0; x < area.width; x++) {
                this.standardMode.fogOfWar.reveal(x, y);
                this.standardMode.fogOfWar.currentlyVisible.add(Utils.coordToKey(x, y));
            }
        }

        // Override fog methods to maintain full visibility
        this.standardMode.fogOfWar.isVisible = (x, y) => true;
        this.standardMode.fogOfWar.getVisibilityAlpha = (x, y) => 1.0;
        this.standardMode.fogOfWar.render = (ctx, viewport) => {
            // Do nothing - no fog rendering in debug mode
        };

        console.log('DebugMode: Full visibility enabled for testing');
    }

    // Delegate all game logic to StandardMode
    update(deltaTime) {
        return this.standardMode.update(deltaTime);
    }

    render(ctx, viewport) {
        // Delegate rendering to StandardMode if it has a render method
        if (this.standardMode.render) {
            return this.standardMode.render(ctx, viewport);
        }
    }

    updateUI() {
        // Update UI with testing-specific information
        if (!this.game.ui) return;

        this.game.ui.updateGameInfo({
            area: {
                name: '🧪 TESTING ENVIRONMENT',
                type: 'Debug Mode - Comprehensive Testing Map',
                difficulty: 1,
                getExitCount: () => this.standardMode.currentArea ? this.standardMode.currentArea.exits.length : 0
            },
            player: this.standardMode.player
        });

        // Update health and experience bars
        if (this.standardMode.player) {
            this.game.ui.updateHealthBar(
                this.standardMode.player.health,
                this.standardMode.player.maxHealth
            );
            this.game.ui.updateExperienceBar(
                this.standardMode.player.experience,
                this.standardMode.player.experienceToNextLevel
            );
        }
    }

    getSaveData() {
        // Testing mode doesn't save (or could save test progress)
        return null;
    }

    loadGame(saveData) {
        // Testing mode doesn't load saves
        console.warn('DebugMode: Cannot load saves in testing mode');
    }

    cleanup() {
        console.log('DebugMode: Cleaning up testing environment...');

        if (this.standardMode) {
            this.standardMode.cleanup();
        }

        console.log('DebugMode: Testing environment cleaned up');
    }
}
