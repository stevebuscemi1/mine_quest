// js/constants/GameConstants.js

// Cell Types
export const CELL_TYPES = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    CRYSTAL: 3,
    GEM: 4,
    GOLD: 5,
    WALL: 6,
    DOOR: 7,
    MERCHANT: 8,
    CHEST: 9,
    CHEST_OPENED: 9.5, // Use same value as chest but different visual
    BOSS: 10,
    BEDROCK: 11,
    LAVA: 12,
    WATER: 13,
    GRASS: 14,
    SAND: 15,
    ICE: 16,
    OBSIDIAN: 17,
    DIAMOND: 18,
    EMERALD: 19,
    RUBY: 20,
    SAPPHIRE: 21,
    AMETHYST: 22,
    COAL: 23,
    IRON: 24,
    COPPER: 25,
    SILVER: 26,
    PLATINUM: 27,
    MYTHRIL: 28,
    ADAMANTITE: 29,
    ENCHANTED: 30,
    // Enemy drop materials
    GEL: 31,
    SILK: 32,
    ROTTEN_FLESH: 33,
    BONE: 34,
    DRAGON_SCALE: 35,
    WOOD: 36,
    CRAFTING: 37
};

// Add to GameConstants.js
export const ASSET_PATHS = {
    TEXTURES: {
        [CELL_TYPES.EMPTY]: 'assets/images/cells/empty.png',
        [CELL_TYPES.DIRT]: 'assets/images/cells/dirt.png',
        [CELL_TYPES.ROCK]: 'assets/images/cells/rock.png',
        [CELL_TYPES.CRYSTAL]: 'assets/images/cells/crystal.png',
        [CELL_TYPES.GEM]: 'assets/images/cells/gem.png',
        [CELL_TYPES.GOLD]: 'assets/images/cells/gold.png',
        [CELL_TYPES.WALL]: 'assets/images/cells/wall.png',
        [CELL_TYPES.DOOR]: 'assets/images/cells/door.png',
        [CELL_TYPES.MERCHANT]: 'assets/images/cells/merchant.png',
        [CELL_TYPES.CHEST]: 'assets/images/cells/chest.png',
        [CELL_TYPES.CHEST_OPENED]: 'assets/images/cells/chest_opened.png',
        [CELL_TYPES.BOSS]: 'assets/images/entities/enemies/boss.png',
        [CELL_TYPES.BEDROCK]: 'assets/images/cells/bedrock.png',
        [CELL_TYPES.LAVA]: 'assets/images/cells/lava.png',
        [CELL_TYPES.WATER]: 'assets/images/cells/water.png',
        [CELL_TYPES.GRASS]: 'assets/images/cells/grass.png',
        [CELL_TYPES.SAND]: 'assets/images/cells/sand.png',
        [CELL_TYPES.ICE]: 'assets/images/cells/ice.png',
        [CELL_TYPES.OBSIDIAN]: 'assets/images/cells/obsidian.png',
        [CELL_TYPES.DIAMOND]: 'assets/images/cells/diamond.png',
        [CELL_TYPES.EMERALD]: 'assets/images/cells/emerald.png',
        [CELL_TYPES.RUBY]: 'assets/images/cells/ruby.png',
        [CELL_TYPES.SAPPHIRE]: 'assets/images/cells/sapphire.png',
        [CELL_TYPES.AMETHYST]: 'assets/images/cells/amethyst.png',
        [CELL_TYPES.COAL]: 'assets/images/cells/coal.png',
        [CELL_TYPES.IRON]: 'assets/images/cells/iron.png',
        [CELL_TYPES.COPPER]: 'assets/images/cells/copper.png',
        [CELL_TYPES.SILVER]: 'assets/images/cells/silver.png',
        [CELL_TYPES.PLATINUM]: 'assets/images/cells/platinum.png',
        [CELL_TYPES.MYTHRIL]: 'assets/images/cells/mythril.png',
        [CELL_TYPES.ADAMANTITE]: 'assets/images/cells/adamantite.png',
        [CELL_TYPES.ENCHANTED]: 'assets/images/cells/enchanted.png',
        // Enemy drop materials
        [CELL_TYPES.GEL]: 'assets/images/cells/gel.png',
        [CELL_TYPES.SILK]: 'assets/images/cells/silk.png',
        [CELL_TYPES.ROTTEN_FLESH]: 'assets/images/cells/rotten_flesh.png',
        [CELL_TYPES.BONE]: 'assets/images/cells/bone.png',
        [CELL_TYPES.DRAGON_SCALE]: 'assets/images/cells/dragon_scale.png',
        [CELL_TYPES.WOOD]: 'assets/images/cells/wood.png',
        [CELL_TYPES.CRAFTING]: 'assets/images/cells/crafting.png'
    },
    SPRITES: {
        PLAYER: 'assets/images/entities/player/',
        ENEMIES: 'assets/images/entities/enemies/',
        MERCHANT: 'assets/images/entities/merchant.png'
    },
    UI: {
        INVENTORY_SLOT: 'assets/images/ui/inventory_slot.png',
        EQUIPMENT_SLOTS: 'assets/images/ui/equipment_slots/',
        BUTTONS: 'assets/images/ui/buttons/',
        DIALOGS: 'assets/images/ui/dialogs/',
        NOTIFICATIONS: 'assets/images/ui/notifications/'
    },
    ITEMS: {
        // Equipment
        WOODEN_PICKAXE: 'assets/images/items/wooden_pickaxe.png',
        STONE_PICKAXE: 'assets/images/items/stone_pickaxe.png',
        IRON_PICKAXE: 'assets/images/items/iron_pickaxe.png',
        GOLD_PICKAXE: 'assets/images/items/gold_pickaxe.png',
        DIAMOND_PICKAXE: 'assets/images/items/diamond_pickaxe.png',
        LEATHER_HELMET: 'assets/images/items/leather_helmet.png',
        IRON_HELMET: 'assets/images/items/iron_helmet.png',
        DIAMOND_HELMET: 'assets/images/items/diamond_helmet.png',
        LEATHER_ARMOR: 'assets/images/items/leather_armor.png',
        IRON_ARMOR: 'assets/images/items/iron_armor.png',
        DIAMOND_ARMOR: 'assets/images/items/diamond_armor.png',
        LEATHER_BOOTS: 'assets/images/items/leather_boots.png',
        IRON_BOOTS: 'assets/images/items/iron_boots.png',
        DIAMOND_BOOTS: 'assets/images/items/diamond_boots.png',
        POWER_GLOVES: 'assets/images/items/power_gloves.png',
        LUCKY_AMULET: 'assets/images/items/lucky_amulet.png',
        // Consumables
        HEALTH_POTION: 'assets/images/items/health_potion.png',
        SPEED_POTION: 'assets/images/items/speed_potion.png',
        STRENGTH_POTION: 'assets/images/items/strength_potion.png',
        LUCK_POTION: 'assets/images/items/luck_potion.png'
    },
    PARTICLES: 'assets/images/particles/',
    MAIN_MENU: {
        LOGO: 'assets/images/main_menu/logo.png',
        BACKGROUND: 'assets/images/main_menu/background.mp4',
        BUTTONS: 'assets/images/main_menu/buttons/'
    },
    SOUNDS: {
        MUSIC: 'assets/sounds/music/',
        MENU_SOUNDS: 'assets/sounds/menu_sounds/',
        PLAYER_SOUNDS: 'assets/sounds/player_sounds/',
        ENEMY_SOUNDS: 'assets/sounds/enemy_sounds/',
        UI_SOUNDS: 'assets/sounds/ui_sounds/'
    }
};

// Item Types
export const ITEM_TYPES = {
    RESOURCE: 'resource',
    EQUIPMENT: 'equipment',
    CONSUMABLE: 'consumable',
    QUEST: 'quest',
    MISC: 'misc'
};

// Equipment Slots
export const EQUIPMENT_SLOTS = {
    HELMET: 'helmet',
    ARMOR: 'armor',
    BOOTS: 'boots',
    PICKAXE: 'pickaxe',
    GLOVES: 'gloves',
    AMULET: 'amulet'
};

// Game Modes
export const GAME_MODES = {
    STANDARD: 'standard',
    CUSTOM: 'custom',
    GAUNTLET: 'gauntlet',
    DEBUG: 'debug'
};

// Area Types
export const AREA_TYPES = {
    MINE: 'mine',
    CAVE: 'cave',
    CRYSTAL_CAVERN: 'crystal_cavern',
    ANCIENT_RUINS: 'ancient_ruins',
    COSMIC_REGION: 'cosmic_region',
    VOLCANIC: 'volcanic',
    FROZEN: 'frozen',
    DESERT: 'desert',
    JUNGLE: 'jungle',
    ABYSS: 'abyss'
};

// Grid and Display Constants
export const GRID_SIZE = 13;
export const VISIBILITY_RADIUS = 7;
export const INVENTORY_SIZE = 40;
export const GAUNTLET_TIME_LIMIT = 600; // 10 minutes in seconds
export const CELL_SIZE = 64; // pixels
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// Material Properties
export const MATERIALS = {
    [CELL_TYPES.DIRT]: {
        name: 'Dirt',
        hardness: 1,
        value: 1,
        color: '#8B4513',
        miningTime: 500,
        experience: 1
    },
    [CELL_TYPES.ROCK]: {
        name: 'Rock',
        hardness: 2,
        value: 2,
        color: '#808080',
        miningTime: 1000,
        experience: 2
    },
    [CELL_TYPES.CRYSTAL]: {
        name: 'Crystal',
        hardness: 3,
        value: 10,
        color: '#E0FFFF',
        miningTime: 1500,
        experience: 5
    },
    [CELL_TYPES.GEM]: {
        name: 'Gem',
        hardness: 4,
        value: 25,
        color: '#FF69B4',
        miningTime: 2000,
        experience: 10
    },
    [CELL_TYPES.GOLD]: {
        name: 'Gold',
        hardness: 3,
        value: 50,
        color: '#FFD700',
        miningTime: 1800,
        experience: 15
    },
    [CELL_TYPES.DIAMOND]: {
        name: 'Diamond',
        hardness: 5,
        value: 100,
        color: '#B9F2FF',
        miningTime: 2500,
        experience: 25
    },
    [CELL_TYPES.EMERALD]: {
        name: 'Emerald',
        hardness: 4,
        value: 75,
        color: '#50C878',
        miningTime: 2200,
        experience: 20
    },
    [CELL_TYPES.RUBY]: {
        name: 'Ruby',
        hardness: 4,
        value: 80,
        color: '#E0115F',
        miningTime: 2200,
        experience: 20
    },
    [CELL_TYPES.SAPPHIRE]: {
        name: 'Sapphire',
        hardness: 4,
        value: 85,
        color: '#0F52BA',
        miningTime: 2200,
        experience: 20
    },
    [CELL_TYPES.COAL]: {
        name: 'Coal',
        hardness: 2,
        value: 5,
        color: '#36454F',
        miningTime: 800,
        experience: 3
    },
    [CELL_TYPES.IRON]: {
        name: 'Iron',
        hardness: 3,
        value: 15,
        color: '#B87333',
        miningTime: 1200,
        experience: 8
    },
    [CELL_TYPES.BEDROCK]: {
        name: 'Bedrock',
        hardness: 999,
        value: 0,
        color: '#2F4F4F',
        miningTime: Infinity,
        experience: 0
    },
    [CELL_TYPES.LAVA]: {
        name: 'Lava',
        hardness: 1,
        value: 0,
        color: '#FF4500',
        miningTime: 0,
        experience: 0,
        damage: 20
    },
    [CELL_TYPES.WATER]: {
        name: 'Water',
        hardness: 1,
        value: 0,
        color: '#4682B4',
        miningTime: 0,
        experience: 0
    },
    // Advanced Materials
    [CELL_TYPES.GRASS]: {
        name: 'Grass',
        hardness: 1,
        value: 2,
        color: '#32CD32',
        miningTime: 300,
        experience: 1
    },
    [CELL_TYPES.SAND]: {
        name: 'Sand',
        hardness: 1,
        value: 1,
        color: '#F4A460',
        miningTime: 400,
        experience: 1
    },
    [CELL_TYPES.ICE]: {
        name: 'Ice',
        hardness: 2,
        value: 8,
        color: '#87CEEB',
        miningTime: 900,
        experience: 4,
        slippery: true
    },
    [CELL_TYPES.OBSIDIAN]: {
        name: 'Obsidian',
        hardness: 6,
        value: 120,
        color: '#1C1C1C',
        miningTime: 3000,
        experience: 35
    },
    [CELL_TYPES.AMETHYST]: {
        name: 'Amethyst',
        hardness: 4,
        value: 90,
        color: '#9966CC',
        miningTime: 2400,
        experience: 22
    },
    [CELL_TYPES.COPPER]: {
        name: 'Copper',
        hardness: 2,
        value: 12,
        color: '#B87333',
        miningTime: 900,
        experience: 6
    },
    [CELL_TYPES.SILVER]: {
        name: 'Silver',
        hardness: 3,
        value: 25,
        color: '#C0C0C0',
        miningTime: 1400,
        experience: 12
    },
    [CELL_TYPES.PLATINUM]: {
        name: 'Platinum',
        hardness: 4,
        value: 60,
        color: '#E5E4E2',
        miningTime: 2000,
        experience: 18
    },
    [CELL_TYPES.MYTHRIL]: {
        name: 'Mythril',
        hardness: 5,
        value: 150,
        color: '#4169E1',
        miningTime: 2800,
        experience: 40,
        magical: true
    },
    [CELL_TYPES.ADAMANTITE]: {
        name: 'Adamantite',
        hardness: 6,
        value: 200,
        color: '#FF0000',
        miningTime: 3200,
        experience: 50,
        rare: true
    },
    [CELL_TYPES.ENCHANTED]: {
        name: 'Enchanted Stone',
        hardness: 5,
        value: 100,
        color: '#9370DB',
        miningTime: 2600,
        experience: 30,
        magical: true
    },
    // Enemy Drop Materials
    [CELL_TYPES.GEL]: {
        name: 'Gel',
        hardness: 1,
        value: 3,
        color: '#32CD32',
        miningTime: 300,
        experience: 2,
        organic: true
    },
    [CELL_TYPES.SILK]: {
        name: 'Silk',
        hardness: 1,
        value: 8,
        color: '#F5F5DC',
        miningTime: 400,
        experience: 3,
        organic: true
    },
    [CELL_TYPES.ROTTEN_FLESH]: {
        name: 'Rotten Flesh',
        hardness: 1,
        value: 2,
        color: '#556B2F',
        miningTime: 200,
        experience: 1,
        organic: true,
        cursed: true
    },
    [CELL_TYPES.BONE]: {
        name: 'Bone',
        hardness: 2,
        value: 5,
        color: '#F5F5DC',
        miningTime: 600,
        experience: 3,
        organic: true
    },
    [CELL_TYPES.DRAGON_SCALE]: {
        name: 'Dragon Scale',
        hardness: 6,
        value: 200,
        color: '#8B0000',
        miningTime: 3000,
        experience: 50,
        rare: true,
        legendary: true
    },
    [CELL_TYPES.WOOD]: {
        name: 'Wood',
        hardness: 1,
        value: 2,
        color: '#8B4513',
        miningTime: 300,
        experience: 1,
        organic: true
    },
    [CELL_TYPES.CRAFTING]: {
        name: 'Crafting Station',
        hardness: 999,
        value: 0,
        color: '#654321',
        miningTime: Infinity,
        experience: 0,
        interactive: true
    }
};

// Enemy Types
export const ENEMY_TYPES = {
    SLIME: {
        name: 'Slime',
        health: 60,
        damage: 5,
        speed: 0.5,
        experience: 10,
        coins: 5,
        defense: 1,
        color: '#32CD32',
        aggressive: false,
        drops: [{ type: CELL_TYPES.GEL, chance: 0.3 }]
    },
    BAT: {
        name: 'Bat',
        health: 20,
        damage: 8,
        speed: 1.5,
        experience: 15,
        coins: 8,
        defense: 0,
        color: '#2F4F4F',
        aggressive: true,
        flying: true,
        drops: [{ type: CELL_TYPES.GEM, chance: 0.1 }]
    },
    SPIDER: {
        name: 'Spider',
        health: 80,
        damage: 12,
        speed: 1.0,
        experience: 20,
        coins: 12,
        defense: 2,
        color: '#8B4513',
        aggressive: true,
        drops: [{ type: CELL_TYPES.SILK, chance: 0.4 }]
    },
    ZOMBIE: {
        name: 'Zombie',
        health: 120,
        damage: 15,
        speed: 0.3,
        experience: 30,
        coins: 15,
        defense: 3,
        color: '#556B2F',
        aggressive: true,
        drops: [{ type: CELL_TYPES.ROTTEN_FLESH, chance: 0.5 }]
    },
    SKELETON: {
        name: 'Skeleton',
        health: 100,
        damage: 18,
        speed: 0.8,
        experience: 35,
        coins: 20,
        defense: 1,
        color: '#F5F5DC',
        aggressive: true,
        ranged: true,
        drops: [{ type: CELL_TYPES.BONE, chance: 0.6 }]
    },
    GOLEM: {
        name: 'Golem',
        health: 200,
        damage: 25,
        speed: 0.2,
        experience: 50,
        coins: 30,
        defense: 8,
        color: '#696969',
        aggressive: false,
        width: 2,
        height: 2,
        drops: [{ type: CELL_TYPES.ROCK, chance: 0.8 }]
    },
    DRAGON: {
        name: 'Dragon',
        health: 400,
        damage: 40,
        speed: 1.2,
        experience: 100,
        coins: 100,
        defense: 5,
        color: '#8B0000',
        aggressive: true,
        boss: true,
        flying: true,
        width: 3,
        height: 2,
        drops: [
            { type: CELL_TYPES.DIAMOND, chance: 0.5 },
            { type: CELL_TYPES.DRAGON_SCALE, chance: 0.9 }
        ]
    }
};

// Equipment Definitions
export const EQUIPMENT_DEFINITIONS = {
    // Pickaxes
    WOODEN_PICKAXE: {
        name: 'Wooden Pickaxe',
        slot: EQUIPMENT_SLOTS.PICKAXE,
        stats: { miningPower: 1, attack: 2 },
        durability: 50,
        value: 10,
        color: '#8B4513',
        miningLevel: 1
    },
    STONE_PICKAXE: {
        name: 'Stone Pickaxe',
        slot: EQUIPMENT_SLOTS.PICKAXE,
        stats: { miningPower: 2, attack: 4 },
        durability: 100,
        value: 25,
        color: '#808080',
        miningLevel: 2
    },
    IRON_PICKAXE: {
        name: 'Iron Pickaxe',
        slot: EQUIPMENT_SLOTS.PICKAXE,
        stats: { miningPower: 3, attack: 6 },
        durability: 200,
        value: 50,
        color: '#B87333',
        miningLevel: 3
    },
    GOLD_PICKAXE: {
        name: 'Gold Pickaxe',
        slot: EQUIPMENT_SLOTS.PICKAXE,
        stats: { miningPower: 4, attack: 8 },
        durability: 150,
        value: 100,
        color: '#FFD700',
        miningLevel: 4
    },
    DIAMOND_PICKAXE: {
        name: 'Diamond Pickaxe',
        slot: EQUIPMENT_SLOTS.PICKAXE,
        stats: { miningPower: 5, attack: 10 },
        durability: 500,
        value: 200,
        color: '#B9F2FF',
        miningLevel: 5
    },
    
    // Armor
    LEATHER_HELMET: {
        name: 'Leather Helmet',
        slot: EQUIPMENT_SLOTS.HELMET,
        stats: { defense: 2 },
        durability: 80,
        value: 15,
        color: '#8B4513'
    },
    IRON_HELMET: {
        name: 'Iron Helmet',
        slot: EQUIPMENT_SLOTS.HELMET,
        stats: { defense: 5 },
        durability: 150,
        value: 40,
        color: '#B87333'
    },
    DIAMOND_HELMET: {
        name: 'Diamond Helmet',
        slot: EQUIPMENT_SLOTS.HELMET,
        stats: { defense: 10 },
        durability: 300,
        value: 150,
        color: '#B9F2FF'
    },
    
    LEATHER_ARMOR: {
        name: 'Leather Armor',
        slot: EQUIPMENT_SLOTS.ARMOR,
        stats: { defense: 3 },
        durability: 100,
        value: 20,
        color: '#8B4513'
    },
    IRON_ARMOR: {
        name: 'Iron Armor',
        slot: EQUIPMENT_SLOTS.ARMOR,
        stats: { defense: 8 },
        durability: 200,
        value: 60,
        color: '#B87333'
    },
    DIAMOND_ARMOR: {
        name: 'Diamond Armor',
        slot: EQUIPMENT_SLOTS.ARMOR,
        stats: { defense: 15 },
        durability: 400,
        value: 200,
        color: '#B9F2FF'
    },
    
    LEATHER_BOOTS: {
        name: 'Leather Boots',
        slot: EQUIPMENT_SLOTS.BOOTS,
        stats: { defense: 1, speed: 0.1 },
        durability: 80,
        value: 12,
        color: '#8B4513'
    },
    IRON_BOOTS: {
        name: 'Iron Boots',
        slot: EQUIPMENT_SLOTS.BOOTS,
        stats: { defense: 3, speed: 0.05 },
        durability: 150,
        value: 35,
        color: '#B87333'
    },
    DIAMOND_BOOTS: {
        name: 'Diamond Boots',
        slot: EQUIPMENT_SLOTS.BOOTS,
        stats: { defense: 6, speed: 0.15 },
        durability: 300,
        value: 120,
        color: '#B9F2FF'
    },
    
    // Accessories
    POWER_GLOVES: {
        name: 'Power Gloves',
        slot: EQUIPMENT_SLOTS.GLOVES,
        stats: { miningPower: 1, attack: 3 },
        durability: 120,
        value: 30,
        color: '#FF6347'
    },
    LUCKY_AMULET: {
        name: 'Lucky Amulet',
        slot: EQUIPMENT_SLOTS.AMULET,
        stats: { luck: 10 },
        durability: 200,
        value: 80,
        color: '#FFD700'
    }
};

// Chest Types and Loot Tables
export const CHEST_TYPES = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

export const CHEST_LOOT_TABLES = {
    [CHEST_TYPES.COMMON]: {
        name: 'Common',
        color: '#8B4513',
        texture: 'chest.png',
        textureOpened: 'chest_opened.png',
        minItems: 1,
        maxItems: 3,
        lootWeights: {
            materials: 70,    // 70% chance for materials
            equipment: 25,    // 25% chance for equipment
            coins: 5          // 5% chance for extra coins
        },
        materialLoot: [
            { type: CELL_TYPES.DIRT, weight: 20, minCount: 1, maxCount: 5 },
            { type: CELL_TYPES.ROCK, weight: 25, minCount: 1, maxCount: 4 },
            { type: CELL_TYPES.COAL, weight: 20, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.IRON, weight: 15, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.GOLD, weight: 10, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.CRYSTAL, weight: 8, minCount: 1, maxCount: 1 },
            { type: CELL_TYPES.GEM, weight: 2, minCount: 1, maxCount: 1 }
        ],
        equipmentLoot: [
            { type: 'WOODEN_PICKAXE', weight: 30 },
            { type: 'LEATHER_HELMET', weight: 20 },
            { type: 'LEATHER_ARMOR', weight: 20 },
            { type: 'LEATHER_BOOTS', weight: 20 },
            { type: 'POWER_GLOVES', weight: 10 }
        ],
        coinRange: { min: 10, max: 50 }
    },
    [CHEST_TYPES.RARE]: {
        name: 'Rare',
        color: '#4169E1',
        texture: 'chest.png',
        textureOpened: 'chest_opened.png',
        minItems: 2,
        maxItems: 4,
        lootWeights: {
            materials: 50,
            equipment: 35,
            coins: 15
        },
        materialLoot: [
            { type: CELL_TYPES.IRON, weight: 25, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.GOLD, weight: 25, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.CRYSTAL, weight: 20, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.GEM, weight: 15, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.DIAMOND, weight: 10, minCount: 1, maxCount: 1 },
            { type: CELL_TYPES.EMERALD, weight: 3, minCount: 1, maxCount: 1 },
            { type: CELL_TYPES.RUBY, weight: 2, minCount: 1, maxCount: 1 }
        ],
        equipmentLoot: [
            { type: 'STONE_PICKAXE', weight: 25 },
            { type: 'IRON_HELMET', weight: 20 },
            { type: 'IRON_ARMOR', weight: 20 },
            { type: 'IRON_BOOTS', weight: 20 },
            { type: 'POWER_GLOVES', weight: 10 },
            { type: 'LUCKY_AMULET', weight: 5 }
        ],
        coinRange: { min: 50, max: 150 }
    },
    [CHEST_TYPES.EPIC]: {
        name: 'Epic',
        color: '#9932CC',
        texture: 'chest.png',
        textureOpened: 'chest_opened.png',
        minItems: 3,
        maxItems: 5,
        lootWeights: {
            materials: 40,
            equipment: 45,
            coins: 15
        },
        materialLoot: [
            { type: CELL_TYPES.GOLD, weight: 20, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.CRYSTAL, weight: 20, minCount: 2, maxCount: 4 },
            { type: CELL_TYPES.GEM, weight: 20, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.DIAMOND, weight: 15, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.EMERALD, weight: 10, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.RUBY, weight: 8, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.SAPPHIRE, weight: 5, minCount: 1, maxCount: 1 },
            { type: CELL_TYPES.OBSIDIAN, weight: 2, minCount: 1, maxCount: 1 }
        ],
        equipmentLoot: [
            { type: 'IRON_PICKAXE', weight: 20 },
            { type: 'DIAMOND_HELMET', weight: 15 },
            { type: 'DIAMOND_ARMOR', weight: 15 },
            { type: 'DIAMOND_BOOTS', weight: 15 },
            { type: 'POWER_GLOVES', weight: 15 },
            { type: 'LUCKY_AMULET', weight: 10 },
            { type: 'GOLD_PICKAXE', weight: 10 }
        ],
        coinRange: { min: 150, max: 400 }
    },
    [CHEST_TYPES.LEGENDARY]: {
        name: 'Legendary',
        color: '#FFD700',
        texture: 'chest.png',
        textureOpened: 'chest_opened.png',
        minItems: 4,
        maxItems: 6,
        lootWeights: {
            materials: 30,
            equipment: 50,
            coins: 20
        },
        materialLoot: [
            { type: CELL_TYPES.DIAMOND, weight: 25, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.EMERALD, weight: 20, minCount: 1, maxCount: 3 },
            { type: CELL_TYPES.RUBY, weight: 15, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.SAPPHIRE, weight: 15, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.OBSIDIAN, weight: 10, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.DRAGON_SCALE, weight: 10, minCount: 1, maxCount: 2 },
            { type: CELL_TYPES.ADAMANTITE, weight: 5, minCount: 1, maxCount: 1 }
        ],
        equipmentLoot: [
            { type: 'DIAMOND_PICKAXE', weight: 40 },
            { type: 'DIAMOND_HELMET', weight: 15 },
            { type: 'DIAMOND_ARMOR', weight: 15 },
            { type: 'DIAMOND_BOOTS', weight: 15 },
            { type: 'LUCKY_AMULET', weight: 10 },
            { type: 'POWER_GLOVES', weight: 5 }
        ],
        coinRange: { min: 500, max: 1000 }
    }
};

// Experience and Leveling
export const EXPERIENCE_FORMULA = {
    base: 100,
    multiplier: 1.5,
    calculateRequired(level) {
        return Math.floor(this.base * Math.pow(this.multiplier, level - 1));
    }
};

// Control Mappings
export const CONTROLS = {
    KEYBOARD: {
        MOVE_UP: ['KeyW', 'ArrowUp'],
        MOVE_DOWN: ['KeyS', 'ArrowDown'],
        MOVE_LEFT: ['KeyA', 'ArrowLeft'],
        MOVE_RIGHT: ['KeyD', 'ArrowRight'],
        INVENTORY: 'KeyI',
        EQUIPMENT: 'KeyE',
        MENU: 'Escape',
        MINE: 'Space',
        INTERACT: 'KeyF',
        SAVE: 'F5',
        LOAD: 'F9'
    },
    GAMEPAD: {
        MOVE_UP: 'DPadUp',
        MOVE_DOWN: 'DPadDown',
        MOVE_LEFT: 'DPadLeft',
        MOVE_RIGHT: 'DPadRight',
        INTERACT: 'ButtonA', // A button
        MENU: 'ButtonB', // B button
        INVENTORY: 'ButtonX', // X button
        EQUIPMENT: 'ButtonY' // Y button
    },
    TOUCH: {
        TAP_THRESHOLD: 10,
        LONG_PRESS_DELAY: 500,
        SWIPE_THRESHOLD: 50
    }
};

// Crafting System Constants
export const CRAFTING_TIERS = {
    NOVICE: 'novice',
    APPRENTICE: 'apprentice', 
    MASTER: 'master'
};

export const CRAFTING_STATES = {
    IDLE: 'idle',
    CRAFTING: 'crafting',
    SUCCESS: 'success',
    FAILURE: 'failure',
    ERROR: 'error'
};

export const CRAFTING_CONSTANTS = {
    CRITICAL_CRAFT_CHANCE: 0.15, // 15% chance for superior craft
    FAILURE_CHANCE: 0.1, // 10% chance for craft failure (materials lost)
    BASE_CRAFT_TIME: 2000, // 2 seconds base crafting time
    MAX_CRAFT_TIME: 10000, // 10 seconds max crafting time
    AMBIENT_VOLUME: 0.3, // Ambient forge sound volume
    SUCCESS_VOLUME: 0.7, // Success sound volume
    FAILURE_VOLUME: 0.6, // Failure sound volume
    ERROR_VOLUME: 0.5, // Error sound volume
    HAPTIC_PATTERN: [100, 50, 100] // Vibration pattern for success
};

// Sound Effects (references)
export const SOUNDS = {
    MOVE: 'move',
    MINE: 'mine',
    MINE_SUCCESS: 'mine_success',
    MINE_FAIL: 'mine_fail',
    PICKUP: 'pickup',
    EQUIP: 'equip',
    UNEQUIP: 'unequip',
    DAMAGE: 'damage',
    HEAL: 'heal',
    LEVEL_UP: 'level_up',
    OPEN_DOOR: 'open_door',
    OPEN_CHEST: 'open_chest',
    MERCHANT: 'merchant',
    ENEMY_HIT: 'enemy_hit',
    ENEMY_DEATH: 'enemy_death',
    BOSS_MUSIC: 'boss_music',
    AMBIENT_CAVE: 'ambient_cave',
    AMBIENT_MINE: 'ambient_mine'
};

// Animation Constants
export const ANIMATIONS = {
    PLAYER_IDLE: {
        frames: 4,
        duration: 1000,
        loop: true
    },
    PLAYER_MOVE: {
        frames: 8,
        duration: 500,
        loop: true
    },
    PLAYER_MINE: {
        frames: 6,
        duration: 300,
        loop: false
    },
    ENEMY_SLIME: {
        frames: 4,
        duration: 800,
        loop: true
    },
    ENEMY_BAT: {
        frames: 6,
        duration: 400,
        loop: true
    },
    PARTICLE_MINE: {
        frames: 8,
        duration: 400,
        loop: false
    },
    PARTICLE_DAMAGE: {
        frames: 6,
        duration: 300,
        loop: false
    },
    CHEST_OPEN: {
        frames: 4,
        duration: 600,
        loop: false
    },
    CHEST_CLOSE: {
        frames: 4,
        duration: 600,
        loop: false
    }
};

// Merchant Constants
export const MERCHANT_CONSTANTS = {
    RESTOCK_INTERVAL: 300000, // 5 minutes
    BUY_PRICE_MULTIPLIER: 1.5,
    SELL_PRICE_MULTIPLIER: 0.7,
    INVENTORY_SIZE: 10,
    INITIAL_COINS: 1000
};

// Save System Constants
export const SAVE_CONSTANTS = {
    MAX_SLOTS: 5,
    AUTO_SAVE_INTERVAL: 60000, // 1 minute
    VERSION: '1.0.0',
    COMPRESSION: true
};

// Performance Constants
export const PERFORMANCE = {
    TARGET_FPS: 60,
    MAX_PARTICLES: 100,
    UPDATE_INTERVAL: 1000 / 60,
    RENDER_DISTANCE: 15,
    BATCH_SIZE: 50
};

// Validation Constants
export const VALIDATION = {
    MAX_AREA_SIZE: 200,
    MIN_AREA_SIZE: 20,
    MAX_CUSTOM_AREAS: 200,
    MAX_AREA_NAME_LENGTH: 20,
    MAX_CREATOR_NAME_LENGTH: 20
};

// UI Constants
export const UI_CONSTANTS = {
    PANEL_ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 5000,
    TOOLTIP_DELAY: 500,
    ESC_KEY_COOLDOWN: 200,
    DAMAGE_NUMBER_DURATION: 1000,
    MINING_PROGRESS_UPDATE_INTERVAL: 100,
    HEALTH_BAR_UPDATE_INTERVAL: 500,
    EXPERIENCE_BAR_UPDATE_INTERVAL: 500,
    INVENTORY_GRID_SIZE: 10,
    EQUIPMENT_GRID_SIZE: 3
};

// Color Constants
export const COLORS = {
    // UI Colors
    UI_TEXT: '#ffffff',
    UI_HIGHLIGHT: '#ffff00',
    UI_WARNING: '#ff6600',
    UI_SUCCESS: '#00ff00',
    UI_ERROR: '#ff0000',
    UI_BACKGROUND: '#1a1a1a',
    UI_PANEL: '#2a2a2a',
    UI_BORDER: '#444444',

    // Game Colors
    BACKGROUND: '#0a0a0a',
    PLAYER: '#00ff00',
    ENEMY: '#ff0000',
    CHEST: '#8B4513',
    MERCHANT: '#ffff00',
    DOOR: '#4B0082',
    WALL: '#2F4F4F',

    // Item Colors
    ITEM_COMMON: '#ffffff',
    ITEM_UNCOMMON: '#00ff00',
    ITEM_RARE: '#0080ff',
    ITEM_EPIC: '#591d949a',
    ITEM_LEGENDARY: '#ff8000',

    // Status Colors
    HEALTH_FULL: '#00ff00',
    HEALTH_MEDIUM: '#ffff00',
    HEALTH_LOW: '#ff6600',
    HEALTH_CRITICAL: '#ff0000',

    // Damage Colors
    DAMAGE_PHYSICAL: '#ff4444',
    DAMAGE_FIRE: '#ff8844',
    DAMAGE_ICE: '#88ddff',
    DAMAGE_ELECTRIC: '#ffff44',
    DAMAGE_POISON: '#88ff44',
    DAMAGE_HEAL: '#44ff44'
};

// Achievement System
export const ACHIEVEMENTS = {
    // Combat Achievements
    FIRST_BLOOD: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        category: 'combat',
        icon: '🩸',
        condition: { type: 'enemies_defeated', value: 1 },
        reward: { experience: 50, coins: 25 }
    },
    WARRIOR: {
        id: 'warrior',
        name: 'Warrior',
        description: 'Defeat 10 enemies',
        category: 'combat',
        icon: '⚔️',
        condition: { type: 'enemies_defeated', value: 10 },
        reward: { experience: 100, coins: 50 }
    },
    CHAMPION: {
        id: 'champion',
        name: 'Champion',
        description: 'Defeat 50 enemies',
        category: 'combat',
        icon: '👑',
        condition: { type: 'enemies_defeated', value: 50 },
        reward: { experience: 250, coins: 100 }
    },
    BOSS_SLAYER: {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat your first boss',
        category: 'combat',
        icon: '🐉',
        condition: { type: 'bosses_defeated', value: 1 },
        reward: { experience: 500, coins: 200 }
    },
    CRITICAL_MASTER: {
        id: 'critical_master',
        name: 'Critical Master',
        description: 'Land 100 critical hits',
        category: 'combat',
        icon: '💥',
        condition: { type: 'critical_hits', value: 100 },
        reward: { experience: 300, coins: 150 }
    },

    // Mining Achievements
    FIRST_ORE: {
        id: 'first_ore',
        name: 'First Ore',
        description: 'Mine your first piece of ore',
        category: 'mining',
        icon: '⛏️',
        condition: { type: 'materials_mined', value: 1 },
        reward: { experience: 25, coins: 10 }
    },
    MINER: {
        id: 'miner',
        name: 'Miner',
        description: 'Mine 100 materials',
        category: 'mining',
        icon: '⛰️',
        condition: { type: 'materials_mined', value: 100 },
        reward: { experience: 75, coins: 25 }
    },
    EXCAVATOR: {
        id: 'excavator',
        name: 'Excavator',
        description: 'Mine 500 materials',
        category: 'mining',
        icon: '🏔️',
        condition: { type: 'materials_mined', value: 500 },
        reward: { experience: 150, coins: 50 }
    },
    GEM_HUNTER: {
        id: 'gem_hunter',
        name: 'Gem Hunter',
        description: 'Mine your first gem',
        category: 'mining',
        icon: '💎',
        condition: { type: 'gems_mined', value: 1 },
        reward: { experience: 100, coins: 50 }
    },
    DIAMOND_MINER: {
        id: 'diamond_miner',
        name: 'Diamond Miner',
        description: 'Mine a diamond',
        category: 'mining',
        icon: '💍',
        condition: { type: 'diamond_mined', value: 1 },
        reward: { experience: 200, coins: 100 }
    },
    LEGENDARY_MINER: {
        id: 'legendary_miner',
        name: 'Legendary Miner',
        description: 'Mine a legendary material',
        category: 'mining',
        icon: '⭐',
        condition: { type: 'legendary_mined', value: 1 },
        reward: { experience: 500, coins: 250 }
    },

    // Progression Achievements
    LEVEL_UP: {
        id: 'level_up',
        name: 'Getting Stronger',
        description: 'Reach level 5',
        category: 'progression',
        icon: '📈',
        condition: { type: 'level_reached', value: 5 },
        reward: { experience: 100, coins: 50 }
    },
    ADVENTURER: {
        id: 'adventurer',
        name: 'Adventurer',
        description: 'Reach level 10',
        category: 'progression',
        icon: '🗺️',
        condition: { type: 'level_reached', value: 10 },
        reward: { experience: 200, coins: 100 }
    },
    HERO: {
        id: 'hero',
        name: 'Hero',
        description: 'Reach level 25',
        category: 'progression',
        icon: '🦸',
        condition: { type: 'level_reached', value: 25 },
        reward: { experience: 500, coins: 250 }
    },
    WEALTHY: {
        id: 'wealthy',
        name: 'Wealthy',
        description: 'Collect 1000 coins',
        category: 'progression',
        icon: '💰',
        condition: { type: 'coins_collected', value: 1000 },
        reward: { experience: 150, coins: 75 }
    },
    RICH: {
        id: 'rich',
        name: 'Rich',
        description: 'Collect 10000 coins',
        category: 'progression',
        icon: '💎',
        condition: { type: 'coins_collected', value: 10000 },
        reward: { experience: 300, coins: 150 }
    },
    MILLIONAIRE: {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Collect 100000 coins',
        category: 'progression',
        icon: '🤑',
        condition: { type: 'coins_collected', value: 100000 },
        reward: { experience: 1000, coins: 500 }
    },

    // Equipment Achievements
    FULLY_EQUIPPED: {
        id: 'fully_equipped',
        name: 'Fully Equipped',
        description: 'Equip items in all slots',
        category: 'equipment',
        icon: '🛡️',
        condition: { type: 'fully_equipped', value: true },
        reward: { experience: 200, coins: 100 }
    },
    LEGENDARY_GEAR: {
        id: 'legendary_gear',
        name: 'Legendary Gear',
        description: 'Equip a legendary item',
        category: 'equipment',
        icon: '🌟',
        condition: { type: 'legendary_equipped', value: true },
        reward: { experience: 500, coins: 250 }
    },

    // Special Achievements
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Mine 10 materials in under 30 seconds',
        category: 'special',
        icon: '⚡',
        condition: { type: 'speed_mining', value: 10 },
        reward: { experience: 300, coins: 150 }
    },
    LUCKY_FINDER: {
        id: 'lucky_finder',
        name: 'Lucky Finder',
        description: 'Find a rare drop from mining',
        category: 'special',
        icon: '🍀',
        condition: { type: 'rare_drop_found', value: true },
        reward: { experience: 250, coins: 125 }
    },
    SURVIVOR: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive with less than 10 health',
        category: 'special',
        icon: '❤️',
        condition: { type: 'low_health_survival', value: true },
        reward: { experience: 200, coins: 100 }
    },
    CURSE_BREAKER: {
        id: 'curse_breaker',
        name: 'Curse Breaker',
        description: 'Survive a curse effect',
        category: 'special',
        icon: '🔮',
        condition: { type: 'curse_survived', value: true },
        reward: { experience: 150, coins: 75 }
    }
};

// Skill Trees
export const SKILL_TREES = {
    COMBAT: {
        id: 'combat',
        name: 'Combat',
        icon: '⚔️',
        description: 'Enhance your combat abilities',
        skills: {
            // Tier 1 Skills
            STRENGTH_1: {
                id: 'strength_1',
                name: 'Basic Strength',
                description: '+5 Attack Power',
                icon: '💪',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { attack: 5 },
                requirements: []
            },
            DEFENSE_1: {
                id: 'defense_1',
                name: 'Basic Defense',
                description: '+3 Defense',
                icon: '🛡️',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { defense: 3 },
                requirements: []
            },
            CRITICAL_1: {
                id: 'critical_1',
                name: 'Lucky Strike',
                description: '+2% Critical Chance',
                icon: '🎯',
                tier: 1,
                cost: 1,
                maxLevel: 10,
                effect: { critChance: 2 },
                requirements: []
            },

            // Tier 2 Skills
            STRENGTH_2: {
                id: 'strength_2',
                name: 'Advanced Strength',
                description: '+10 Attack Power',
                icon: '🔥',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { attack: 10 },
                requirements: ['strength_1']
            },
            DEFENSE_2: {
                id: 'defense_2',
                name: 'Advanced Defense',
                description: '+8 Defense',
                icon: '⚔️',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { defense: 8 },
                requirements: ['defense_1']
            },
            CRITICAL_2: {
                id: 'critical_2',
                name: 'Critical Mastery',
                description: '+5% Critical Chance',
                icon: '💥',
                tier: 2,
                cost: 2,
                maxLevel: 10,
                effect: { critChance: 5 },
                requirements: ['critical_1']
            },

            // Tier 3 Skills (Ultimate)
            BERSERKER: {
                id: 'berserker',
                name: 'Berserker',
                description: '+20% Attack when low on health',
                icon: '😠',
                tier: 3,
                cost: 10,
                maxLevel: 1,
                effect: { berserker: true },
                requirements: ['strength_2', 'critical_2']
            }
        }
    },

    MINING: {
        id: 'mining',
        name: 'Mining',
        icon: '⛏️',
        description: 'Improve your mining efficiency',
        skills: {
            // Tier 1 Skills
            POWER_1: {
                id: 'power_1',
                name: 'Mining Power I',
                description: '+2 Mining Power',
                icon: '⛏️',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { miningPower: 2 },
                requirements: []
            },
            EFFICIENCY_1: {
                id: 'efficiency_1',
                name: 'Mining Efficiency I',
                description: '-10% Mining Time',
                icon: '⚡',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { miningEfficiency: 10 },
                requirements: []
            },
            AUTO_MINE_1: {
                id: 'auto_mine_1',
                name: 'Auto-Miner I',
                description: 'Automatically mine basic materials',
                icon: '🤖',
                tier: 1,
                cost: 2,
                maxLevel: 1,
                effect: { autoMine: 'basic' },
                requirements: []
            },

            // Tier 2 Skills
            POWER_2: {
                id: 'power_2',
                name: 'Mining Power II',
                description: '+5 Mining Power',
                icon: '⛰️',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { miningPower: 5 },
                requirements: ['power_1']
            },
            EFFICIENCY_2: {
                id: 'efficiency_2',
                name: 'Mining Efficiency II',
                description: '-20% Mining Time',
                icon: '🚀',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { miningEfficiency: 20 },
                requirements: ['efficiency_1']
            },
            AUTO_MINE_2: {
                id: 'auto_mine_2',
                name: 'Auto-Miner II',
                description: 'Automatically mine intermediate materials',
                icon: '🔧',
                tier: 2,
                cost: 3,
                maxLevel: 1,
                effect: { autoMine: 'intermediate' },
                requirements: ['auto_mine_1']
            },

            // Tier 3 Skills
            MASTER_MINER: {
                id: 'master_miner',
                name: 'Master Miner',
                description: '+10 Mining Power, -30% Mining Time',
                icon: '👑',
                tier: 3,
                cost: 10,
                maxLevel: 1,
                effect: { miningPower: 10, miningEfficiency: 30 },
                requirements: ['power_2', 'efficiency_2']
            }
        }
    },

    DEFENSE: {
        id: 'defense',
        name: 'Defense',
        icon: '🛡️',
        description: 'Enhance your survivability',
        skills: {
            // Tier 1 Skills
            VITALITY_1: {
                id: 'vitality_1',
                name: 'Vitality I',
                description: '+20 Max Health',
                icon: '❤️',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { maxHealth: 20 },
                requirements: []
            },
            REGENERATION_1: {
                id: 'regeneration_1',
                name: 'Regeneration I',
                description: '+1 Health per second',
                icon: '💚',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { regenRate: 1 },
                requirements: []
            },
            RESISTANCE_1: {
                id: 'resistance_1',
                name: 'Elemental Resistance I',
                description: '+5% Damage Reduction',
                icon: '🔥',
                tier: 1,
                cost: 1,
                maxLevel: 5,
                effect: { damageReduction: 5 },
                requirements: []
            },

            // Tier 2 Skills
            VITALITY_2: {
                id: 'vitality_2',
                name: 'Vitality II',
                description: '+50 Max Health',
                icon: '💖',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { maxHealth: 50 },
                requirements: ['vitality_1']
            },
            REGENERATION_2: {
                id: 'regeneration_2',
                name: 'Regeneration II',
                description: '+3 Health per second',
                icon: '💊',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { regenRate: 3 },
                requirements: ['regeneration_1']
            },
            RESISTANCE_2: {
                id: 'resistance_2',
                name: 'Elemental Resistance II',
                description: '+10% Damage Reduction',
                icon: '🛡️',
                tier: 2,
                cost: 2,
                maxLevel: 5,
                effect: { damageReduction: 10 },
                requirements: ['resistance_1']
            },

            // Tier 3 Skills
            IMMORTAL: {
                id: 'immortal',
                name: 'Immortal',
                description: 'Immune to death, +100 Max Health',
                icon: '✨',
                tier: 3,
                cost: 10,
                maxLevel: 1,
                effect: { maxHealth: 100, immortal: true },
                requirements: ['vitality_2', 'regeneration_2', 'resistance_2']
            }
        }
    }
};