// js/systems/EquipmentEnhancementSystem.js

import { MATERIALS, EQUIPMENT_DEFINITIONS, CELL_TYPES } from '../constants/GameConstants.js';

export class EquipmentEnhancementSystem {
    constructor() {
        this.enhancementRecipes = new Map();
        this.listeners = new Set();

        this.initializeEnhancementRecipes();
    }

    initializeEnhancementRecipes() {
        // Pickaxe upgrades
        this.addEnhancementRecipe({
            id: 'pickaxe_stone_upgrade',
            name: 'Stone Pickaxe Enhancement',
            description: 'Enhance wooden pickaxe to stone level',
            category: 'pickaxe',
            icon: '⛏️',
            targetEquipment: 'WOODEN_PICKAXE',
            requirements: {
                materials: {
                    [MATERIALS[CELL_TYPES.ROCK].name]: 15,
                    [MATERIALS[CELL_TYPES.COAL].name]: 5
                },
                level: 3,
                coins: 50
            },
            result: {
                template: 'STONE_PICKAXE',
                enhancementLevel: 1
            },
            enhancementTime: 8000,
            experience: 30
        });

        this.addEnhancementRecipe({
            id: 'pickaxe_iron_upgrade',
            name: 'Iron Pickaxe Enhancement',
            description: 'Enhance stone pickaxe to iron level',
            category: 'pickaxe',
            icon: '⚒️',
            targetEquipment: 'STONE_PICKAXE',
            requirements: {
                materials: {
                    [MATERIALS[CELL_TYPES.IRON].name]: 20,
                    [MATERIALS[CELL_TYPES.COAL].name]: 10
                },
                level: 5,
                coins: 100
            },
            result: {
                template: 'IRON_PICKAXE',
                enhancementLevel: 1
            },
            enhancementTime: 15000,
            experience: 50
        });

        // Armor enhancements
        this.addEnhancementRecipe({
            id: 'armor_iron_upgrade',
            name: 'Iron Armor Enhancement',
            description: 'Enhance leather armor to iron level',
            category: 'armor',
            icon: '🛡️',
            targetEquipment: 'LEATHER_ARMOR',
            requirements: {
                materials: {
                    [MATERIALS[CELL_TYPES.IRON].name]: 25,
                    [MATERIALS[CELL_TYPES.COAL].name]: 8,
                    [MATERIALS[CELL_TYPES.SILK].name]: 10
                },
                level: 4,
                coins: 75
            },
            result: {
                template: 'IRON_ARMOR',
                enhancementLevel: 1
            },
            enhancementTime: 12000,
            experience: 40
        });

        // Special enhancements
        this.addEnhancementRecipe({
            id: 'pickaxe_efficiency_enhancement',
            name: 'Efficiency Enhancement',
            description: 'Add efficiency bonus to pickaxe',
            category: 'enhancement',
            icon: '⚡',
            targetEquipment: ['STONE_PICKAXE', 'IRON_PICKAXE', 'GOLD_PICKAXE', 'DIAMOND_PICKAXE'],
            requirements: {
                materials: {
                    [MATERIALS[CELL_TYPES.GEM].name]: 3,
                    [MATERIALS[CELL_TYPES.CRYSTAL].name]: 5
                },
                level: 6,
                coins: 200
            },
            result: {
                enhancementLevel: 1,
                bonusStats: { miningEfficiency: 15 }
            },
            enhancementTime: 10000,
            experience: 60
        });

        this.addEnhancementRecipe({
            id: 'weapon_damage_enhancement',
            name: 'Damage Enhancement',
            description: 'Add damage bonus to weapon',
            category: 'enhancement',
            icon: '💥',
            targetEquipment: ['STONE_PICKAXE', 'IRON_PICKAXE', 'GOLD_PICKAXE', 'DIAMOND_PICKAXE'],
            requirements: {
                materials: {
                    [MATERIALS[CELL_TYPES.RUBY].name]: 2,
                    [MATERIALS[CELL_TYPES.DIAMOND].name]: 1,
                    [MATERIALS[CELL_TYPES.DRAGON_SCALE].name]: 1
                },
                level: 8,
                coins: 500
            },
            result: {
                enhancementLevel: 1,
                bonusStats: { attack: 5 }
            },
            enhancementTime: 20000,
            experience: 100
        });
    }

    addEnhancementRecipe(recipe) {
        this.enhancementRecipes.set(recipe.id, recipe);
    }

    canEnhance(equipment, recipeId) {
        const recipe = this.enhancementRecipes.get(recipeId);
        if (!recipe) return false;

        // Check if equipment matches target
        if (typeof recipe.targetEquipment === 'string') {
            if (equipment.name !== recipe.targetEquipment) return false;
        } else if (Array.isArray(recipe.targetEquipment)) {
            if (!recipe.targetEquipment.includes(equipment.name)) return false;
        }

        // Check level requirement
        if (recipe.requirements.level > this.getPlayerLevel()) {
            return false;
        }

        // Check material requirements
        for (const [materialName, requiredCount] of Object.entries(recipe.requirements.materials)) {
            const playerCount = this.getPlayerMaterialCount(materialName);
            if (playerCount < requiredCount) {
                return false;
            }
        }

        // Check coin requirement
        if (recipe.requirements.coins > this.getPlayerCoins()) {
            return false;
        }

        return true;
    }

    startEnhancement(equipment, recipeId) {
        if (!this.canEnhance(equipment, recipeId)) {
            return { success: false, reason: 'Cannot enhance this equipment' };
        }

        const recipe = this.enhancementRecipes.get(recipeId);
        if (!recipe) {
            return { success: false, reason: 'Recipe not found' };
        }

        // Consume materials and coins
        this.consumeEnhancementMaterials(recipe.requirements);

        // Start enhancement timer
        setTimeout(() => {
            this.completeEnhancement(equipment, recipe);
        }, recipe.enhancementTime);

        this.notifyListeners('enhancementStarted', {
            equipment,
            recipe,
            enhancementTime: recipe.enhancementTime
        });

        return {
            success: true,
            recipe,
            enhancementTime: recipe.enhancementTime
        };
    }

    completeEnhancement(equipment, recipe) {
        let enhancedEquipment;

        if (recipe.result.template) {
            // Replace with new template
            const template = EQUIPMENT_DEFINITIONS[recipe.result.template];
            enhancedEquipment = {
                ...template,
                id: `${equipment.id}_enhanced_${Date.now()}`,
                durability: template.durability || 100,
                maxDurability: template.durability || 100,
                enhancementLevel: recipe.result.enhancementLevel || 1,
                originalItem: equipment
            };
        } else {
            // Enhance existing item
            enhancedEquipment = {
                ...equipment,
                enhancementLevel: recipe.result.enhancementLevel || 1,
                bonusStats: recipe.result.bonusStats || {},
                enhanced: true
            };
        }

        // Add bonus stats
        if (recipe.result.bonusStats) {
            enhancedEquipment.stats = enhancedEquipment.stats || {};
            for (const [stat, value] of Object.entries(recipe.result.bonusStats)) {
                enhancedEquipment.stats[stat] = (enhancedEquipment.stats[stat] || 0) + value;
            }
        }

        // Notify completion
        this.notifyListeners('enhancementCompleted', {
            originalEquipment: equipment,
            enhancedEquipment,
            recipe
        });

        // Gain experience
        if (recipe.experience) {
            this.notifyListeners('experienceGained', { amount: recipe.experience });
        }

        return enhancedEquipment;
    }

    consumeEnhancementMaterials(requirements) {
        // This would integrate with the player's inventory
        this.notifyListeners('enhancementMaterialsConsumed', { materials: requirements.materials });

        // Deduct coins
        if (requirements.coins) {
            this.notifyListeners('coinsSpent', { amount: requirements.coins });
        }
    }

    getPlayerMaterialCount(materialName) {
        // This would integrate with the player's inventory
        return 0; // Placeholder
    }

    getPlayerLevel() {
        // This would get from player object
        return 1; // Placeholder
    }

    getPlayerCoins() {
        // This would get from player object
        return 0; // Placeholder
    }

    getEnhancementRecipesForEquipment(equipment) {
        const recipes = [];
        for (const recipe of this.enhancementRecipes.values()) {
            if (this.canEnhance(equipment, recipe.id)) {
                recipes.push({
                    ...recipe,
                    canEnhance: true
                });
            } else {
                recipes.push({
                    ...recipe,
                    canEnhance: false
                });
            }
        }
        return recipes;
    }

    getAllEnhancementRecipes() {
        return Array.from(this.enhancementRecipes.values());
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            listener(event, data);
        }
    }

    serialize() {
        return {
            enhancementRecipes: Array.from(this.enhancementRecipes.entries())
        };
    }

    deserialize(data) {
        this.enhancementRecipes = new Map(data.enhancementRecipes);
    }
}
