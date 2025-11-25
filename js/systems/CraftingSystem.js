// js/systems/CraftingSystem.js

import { CRAFTING_TIERS, CRAFTING_STATES, CRAFTING_CONSTANTS } from '../constants/GameConstants.js';

export class CraftingSystem {
    constructor(game) {
        this.game = game;
        this.state = CRAFTING_STATES.IDLE;
        this.currentRecipe = null;
        this.craftingTime = 0;
        this.progress = 0;
        this.craftedItems = new Set(); // Track which recipes have been crafted
        this.discoveredRecipes = new Set(); // Track which recipes have been discovered
        this.listeners = new Set();

        this.initializeRecipes();
        this.initializeRecipeDiscovery();
    }

    initializeRecipes() {
        this.recipes = [
            // NOVICE RECIPES
            {
                id: 'wooden_pickaxe',
                name: 'Wooden Pickaxe',
                khuzdulName: "Baraz-Ferg",
                cirthName: "ᛒᚨᚱᚨᛎ‑ᚠᛖᚱᚷ",
                tier: CRAFTING_TIERS.NOVICE,
                ingredients: [
                    { material: 'WOOD', count: 2 },
                    { material: 'IRON', count: 1 }
                ],
                result: 'WOODEN_PICKAXE',
                description: "'Baraz' (red) signifies iron's ruddy hue; 'Ferg' means pick.",
                stats: "Durability: High | Mining Speed: Standard | Luck: None",
                icon: '⛏️',
                craftTime: 2000,
                requiredLevel: 1
            },
            {
                id: 'leather_helmet',
                name: 'Leather Helmet',
                khuzdulName: "Muzg-Ash",
                cirthName: "ᛗᚢᛎᚷ‑ᚨᛋᚺ",
                tier: CRAFTING_TIERS.NOVICE,
                ingredients: [
                    { material: 'LEATHER', count: 3 }
                ],
                result: 'LEATHER_HELMET',
                description: "'Muzg' (neck/hood) + 'Ash' (wood); lightweight scouting helm.",
                stats: "Armor: Low | Weight: Light | Stealth: High",
                icon: '🎩',
                craftTime: 1500,
                requiredLevel: 1
            },
            {
                id: 'leather_armor',
                name: 'Leather Armor',
                khuzdulName: "Thag-Ash",
                cirthName: "ᚦᚨᚷ‑ᚨᛋᚺ",
                tier: CRAFTING_TIERS.NOVICE,
                ingredients: [
                    { material: 'LEATHER', count: 5 }
                ],
                result: 'LEATHER_ARMOR',
                description: "'Thag' (breast) + 'Ash'; flexible yet sturdy.",
                stats: "Armor: Low | Weight: Light | Stealth: High",
                icon: '🦺',
                craftTime: 2000,
                requiredLevel: 1
            },
            {
                id: 'leather_boots',
                name: 'Leather Boots',
                khuzdulName: "Tark-Ash",
                cirthName: "ᛏᚨᚱᚲ‑ᚨᛋᚺ",
                tier: CRAFTING_TIERS.NOVICE,
                ingredients: [
                    { material: 'LEATHER', count: 2 }
                ],
                result: 'LEATHER_BOOTS',
                description: "'Tark' (feet) + 'Ash'; silent movement.",
                stats: "Armor: Low | Weight: Light | Stealth: Very High",
                icon: '👞',
                craftTime: 1500,
                requiredLevel: 1
            },

            // APPRENTICE RECIPES
            {
                id: 'stone_pickaxe',
                name: 'Stone Pickaxe',
                khuzdulName: "Azan-Mubarak",
                cirthName: "ᚨᛎᚨᚾ‑ᛗᚢᛒᚨᚱᚨᚲ",
                tier: CRAFTING_TIERS.APPRENTICE,
                ingredients: [
                    { material: 'WOOD', count: 2 },
                    { material: 'ROCK', count: 3 }
                ],
                result: 'STONE_PICKAXE',
                description: "'Azan' (dark/gold) + 'Mubarak' (blessed); for hard rock.",
                stats: "Durability: Very High | Mining Speed: Fast | Luck: None",
                icon: '⛏️',
                craftTime: 3000,
                requiredLevel: 3
            },
            {
                id: 'iron_helmet',
                name: 'Iron Helmet',
                khuzdulName: "Bund-Baraz",
                cirthName: "ᛒᚢᚾᛞ‑ᛒᚨᚱᚨᛎ",
                tier: CRAFTING_TIERS.APPRENTICE,
                ingredients: [
                    { material: 'IRON', count: 5 }
                ],
                result: 'IRON_HELMET',
                description: "'Bund' (head) + 'Baraz' (red); iconic dwarven war helm.",
                stats: "Armor: High | Weight: Heavy | Fire Resistance: Low",
                icon: '⛑️',
                craftTime: 2500,
                requiredLevel: 4
            },
            {
                id: 'iron_armor',
                name: 'Iron Armor',
                khuzdulName: "Thag-Baraz",
                cirthName: "ᚦᚨᚷ‑ᛒᚨᚱᚨᛎ",
                tier: CRAFTING_TIERS.APPRENTICE,
                ingredients: [
                    { material: 'IRON', count: 8 }
                ],
                result: 'IRON_ARMOR',
                description: "'Thag' + 'Baraz'; core of heavy infantry gear.",
                stats: "Armor: High | Weight: Heavy | Fire Resistance: Low",
                icon: '🛡️',
                craftTime: 3500,
                requiredLevel: 4
            },
            {
                id: 'iron_boots',
                name: 'Iron Boots',
                khuzdulName: "Tark-Baraz",
                cirthName: "ᛏᚨᚱᚲ‑ᛒᚨᚱᚨᛎ",
                tier: CRAFTING_TIERS.APPRENTICE,
                ingredients: [
                    { material: 'IRON', count: 4 }
                ],
                result: 'IRON_BOOTS',
                description: "'Tark' + 'Baraz'; reinforced for tunnel stability.",
                stats: "Armor: Medium | Weight: Heavy | Fire Resistance: Low",
                icon: '🥾',
                craftTime: 2500,
                requiredLevel: 4
            },

            // MASTER RECIPES
            {
                id: 'diamond_pickaxe',
                name: 'Diamond Pickaxe',
                khuzdulName: "Zirak-Dûm",
                cirthName: "ᛎᛁᚱᚨᚲ‑ᛞᚢᛗ",
                tier: CRAFTING_TIERS.MASTER,
                ingredients: [
                    { material: 'WOOD', count: 2 },
                    { material: 'DIAMOND', count: 3 },
                    { material: 'IRON', count: 2 }
                ],
                result: 'DIAMOND_PICKAXE',
                description: "'Zirak' (spike/peak) + 'Dûm' (excavations); for legendary mining.",
                stats: "Durability: Legendary | Mining Speed: Very Fast | Luck: Medium",
                icon: '⛏️',
                craftTime: 5000,
                requiredLevel: 8
            },
            {
                id: 'diamond_helmet',
                name: 'Diamond Helmet',
                khuzdulName: "Bund-Zigil",
                cirthName: "ᛒᚢᚾᛞ‑ᛎᛁᚷᛁᛚ",
                tier: CRAFTING_TIERS.APPRENTICE,
                ingredients: [
                    { material: 'DIAMOND', count: 5 }
                ],
                result: 'DIAMOND_HELMET',
                description: "'Bund' + 'Zigil' (silver); enchanted to reflect light.",
                stats: "Armor: Medium | Weight: Very Light | Magic Resistance: High",
                icon: '👑',
                craftTime: 4000,
                requiredLevel: 6
            },
            {
                id: 'diamond_armor',
                name: 'Diamond Armor',
                khuzdulName: "Thag-Zigil",
                cirthName: "ᚦᚨᚷ‑ᛎᛁᚷᛁᛚ",
                tier: CRAFTING_TIERS.MASTER,
                ingredients: [
                    { material: 'DIAMOND', count: 8 }
                ],
                result: 'DIAMOND_ARMOR',
                description: "'Thag' + 'Zigil'; priceless heirloom of kings.",
                stats: "Armor: High | Weight: Very Light | Magic Resistance: High",
                icon: '🎽',
                craftTime: 5000,
                requiredLevel: 10
            },
            {
                id: 'diamond_boots',
                name: 'Diamond Boots',
                khuzdulName: "Tark-Zigil",
                cirthName: "ᛏᚨᚱᚲ‑ᛎᛁᚷᛁᛚ",
                tier: CRAFTING_TIERS.MASTER,
                ingredients: [
                    { material: 'DIAMOND', count: 4 }
                ],
                result: 'DIAMOND_BOOTS',
                description: "'Tark' + 'Zigil'; light as feather, strong as steel.",
                stats: "Armor: Medium | Weight: Very Light | Magic Resistance: High",
                icon: '👟',
                craftTime: 4000,
                requiredLevel: 10
            }
        ];
    }

    initializeRecipeDiscovery() {
        // For now, discover basic recipes by default
        // In a full implementation, recipes would be discovered through gameplay
        this.discoverRecipe('wooden_pickaxe');
        this.discoverRecipe('leather_helmet');
        this.discoverRecipe('leather_armor');
        this.discoverRecipe('leather_boots');
        
        // Discover apprentice recipes for testing
        this.discoverRecipe('stone_pickaxe');
        this.discoverRecipe('iron_helmet');
        this.discoverRecipe('iron_armor');
        this.discoverRecipe('iron_boots');
        
        // Discover master recipes for testing
        this.discoverRecipe('diamond_pickaxe');
        this.discoverRecipe('diamond_helmet');
        this.discoverRecipe('diamond_armor');
        this.discoverRecipe('diamond_boots');
    }

    getAvailableRecipes(playerLevel) {
        return this.recipes.filter(recipe => {
            // Check if player level meets requirements
            if (playerLevel < recipe.requiredLevel) return false;

            // Check if recipe has been discovered
            if (!this.discoveredRecipes.has(recipe.id)) return false;

            // Check if recipe is unlocked (tier-based or previously crafted)
            if (recipe.tier === CRAFTING_TIERS.NOVICE) return true;
            if (recipe.tier === CRAFTING_TIERS.APPRENTICE && playerLevel >= 3) return true;
            if (recipe.tier === CRAFTING_TIERS.MASTER && playerLevel >= 8) return true;

            return false;
        });
    }

    discoverRecipe(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (recipe && !this.discoveredRecipes.has(recipeId)) {
            this.discoveredRecipes.add(recipeId);
            this.notifyListeners('recipeDiscovered', { recipe: recipe });
            return true;
        }
        return false;
    }

    hasDiscoveredRecipe(recipeId) {
        return this.discoveredRecipes.has(recipeId);
    }

    canCraftRecipe(recipeId, player) {
        if (!player || !player.inventory) return { canCraft: false, reason: 'No player inventory' };

        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return { canCraft: false, reason: 'Recipe not found' };

        // Check if player level meets requirements
        if (player.level < recipe.requiredLevel) {
            return { canCraft: false, reason: `Requires level ${recipe.requiredLevel}` };
        }

        // Check ingredients
        for (const ingredient of recipe.ingredients) {
            const hasCount = player.inventory.getMaterialCount(ingredient.material);
            if (hasCount < ingredient.count) {
                return { canCraft: false, reason: `Need ${ingredient.count} ${ingredient.material}, have ${hasCount}` };
            }
        }

        return { canCraft: true };
    }

    startCrafting(recipeId, player) {
        const check = this.canCraftRecipe(recipeId, player);
        if (!check.canCraft) {
            this.notifyListeners('craftingError', { reason: check.reason });
            return false;
        }

        const recipe = this.recipes.find(r => r.id === recipeId);
        this.currentRecipe = recipe;
        this.state = CRAFTING_STATES.CRAFTING;
        this.craftingTime = recipe.craftTime;
        this.progress = 0;

        this.notifyListeners('craftingStarted', { recipe: recipe });

        // Start crafting timer
        this.craftTimer = setTimeout(() => {
            this.finishCrafting(player);
        }, this.craftingTime);

        return true;
    }

    cancelCrafting() {
        if (this.state === CRAFTING_STATES.CRAFTING) {
            clearTimeout(this.craftTimer);
            this.state = CRAFTING_STATES.IDLE;
            this.currentRecipe = null;
            this.progress = 0;
            this.notifyListeners('craftingCancelled', {});
        }
    }

    finishCrafting(player) {
        if (!this.currentRecipe || !player) return;

        // Check for critical craft
        const isCritical = Math.random() < CRAFTING_CONSTANTS.CRITICAL_CRAFT_CHANCE;
        const isFailure = Math.random() < CRAFTING_CONSTANTS.FAILURE_CHANCE;

        if (isFailure) {
            // Failed craft - lose materials but no item
            this.consumeIngredients(player);
            this.state = CRAFTING_STATES.FAILURE;
            this.notifyListeners('craftingFailed', {
                recipe: this.currentRecipe,
                reason: 'Crafting failed - materials lost'
            });
        } else {
            // Successful craft
            this.consumeIngredients(player);
            const itemResult = this.createItem(isCritical);
            player.inventory.addItem(itemResult);

            // Mark recipe as crafted
            this.craftedItems.add(this.currentRecipe.id);

            this.state = CRAFTING_STATES.SUCCESS;
            this.notifyListeners('craftingSuccess', {
                recipe: this.currentRecipe,
                item: itemResult,
                isCritical: isCritical
            });

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(CRAFTING_CONSTANTS.HAPTIC_PATTERN);
            }
        }

        this.currentRecipe = null;
        this.progress = 0;

        // Reset to idle after a delay
        setTimeout(() => {
            this.state = CRAFTING_STATES.IDLE;
        }, 1000);
    }

    consumeIngredients(player) {
        for (const ingredient of this.currentRecipe.ingredients) {
            player.inventory.removeMaterial(ingredient.material, ingredient.count);
        }
    }

    createItem(isCritical) {
        const equipmentDef = this.game.equipmentDefinitions?.[this.currentRecipe.result];

        if (equipmentDef) {
            const item = {
                id: `equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: isCritical ? `${equipmentDef.name} (Masterwork)` : equipmentDef.name,
                slot: equipmentDef.slot,
                stats: { ...equipmentDef.stats },
                durability: equipmentDef.durability || 100,
                maxDurability: equipmentDef.durability || 100,
                value: equipmentDef.value,
                color: equipmentDef.color,
                miningLevel: equipmentDef.miningLevel,
                equipmentType: this.currentRecipe.result,
                type: 'equipment',
                isMasterwork: isCritical
            };

            // Enhance stats for masterwork items
            if (isCritical) {
                for (const stat in item.stats) {
                    item.stats[stat] = Math.floor(item.stats[stat] * 1.25); // 25% boost
                }
                item.durability = Math.floor(item.durability * 1.5); // 50% more durability
                item.maxDurability = item.durability;
            }

            return item;
        }

        // Fallback for non-equipment items
        return {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.currentRecipe.name,
            type: 'misc',
            value: 10,
            color: '#FFFFFF'
        };
    }

    update(deltaTime) {
        if (this.state === CRAFTING_STATES.CRAFTING && this.currentRecipe) {
            this.progress = Math.min(1, this.progress + (deltaTime / this.craftingTime));
        }
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
            craftedItems: Array.from(this.craftedItems),
            discoveredRecipes: Array.from(this.discoveredRecipes),
            state: this.state,
            currentRecipe: this.currentRecipe,
            craftingTime: this.craftingTime,
            progress: this.progress
        };
    }

    deserialize(data) {
        this.craftedItems = new Set(data.craftedItems || []);
        this.discoveredRecipes = new Set(data.discoveredRecipes || []);
        this.state = data.state || CRAFTING_STATES.IDLE;
        this.currentRecipe = data.currentRecipe;
        this.craftingTime = data.craftingTime || 0;
        this.progress = data.progress || 0;
    }
}
