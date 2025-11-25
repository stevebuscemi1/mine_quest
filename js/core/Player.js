// js/core/Player.js

import { CELL_TYPES, EQUIPMENT_SLOTS, EXPERIENCE_FORMULA, MATERIALS, EQUIPMENT_DEFINITIONS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Inventory } from '../systems/Inventory.js';
import { Equipment } from '../systems/Equipment.js';
import { SkillSystem } from '../systems/SkillSystem.js';

export class Player {
    constructor(x, y) {
        // Position
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.moveProgress = 0;
        this.moveSpeed = 0.15; // Grid cells per frame
        
        // Stats
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = EXPERIENCE_FORMULA.calculateRequired(1);
        this.health = 100;
        this.maxHealth = 100;
        this.coins = 0;
        
        // Base stats
        this.baseStats = {
            attack: 10,
            defense: 5,
            miningPower: 1,
            speed: 1.0,
            luck: 0
        };
        
        // Current stats (with equipment bonuses)
        this.stats = { ...this.baseStats };
        
        // Achievement tracking stats
        this.statsTracker = {
            enemies_defeated: 0,
            bosses_defeated: 0,
            materials_mined: 0,
            gems_mined: 0,
            diamond_mined: 0,
            legendary_mined: 0,
            critical_hits: 0,
            playtime: 0,
            lastUpdateTime: Date.now()
        };
        
        // Auto-mining system
        this.autoMine = null; // 'basic', 'intermediate', or null
        this.autoMineQueue = [];
        this.autoMineTimer = 0;
        this.autoMineInterval = 5000; // 5 seconds between auto-mines
        
        // Mining
        this.isMining = false;
        this.miningTarget = null;
        this.miningProgress = 0;
        this.miningStartTime = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTime = 0;
        this.facingDirection = 'down';
        
        // Systems
        this.inventory = new Inventory(40);
        this.equipment = new Equipment(this);
        this.skillSystem = new SkillSystem();
        
        // Status effects
        this.statusEffects = new Map();
        
        // Skill system - start with some skill points
        this.skillPoints = 3; // Start with 3 skill points to invest
        this.skillSystem.addSkillPoints(3); // Sync with skill system
        
        // Initialize with starting equipment
        this.initStartingEquipment();
    }
    
    initStartingEquipment() {
        // Give player starting equipment using proper equipment definition
        const startingPickaxe = {
            ...EQUIPMENT_DEFINITIONS.WOODEN_PICKAXE,
            durability: EQUIPMENT_DEFINITIONS.WOODEN_PICKAXE.durability,
            maxDurability: EQUIPMENT_DEFINITIONS.WOODEN_PICKAXE.durability,
            equipmentType: 'WOODEN_PICKAXE' // Add equipmentType for sprite lookup
        };

        this.equipment.equip(startingPickaxe, EQUIPMENT_SLOTS.PICKAXE);
        this.updateStats();
    }
    
    update(deltaTime) {
        // Update playtime
        this.updatePlaytime(deltaTime);
        
        // Update movement
        if (this.isMoving) {
            this.moveProgress += this.moveSpeed * this.stats.speed;
            if (this.moveProgress >= 1) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.moveProgress = 0;
            }
        }
        
        // Update mining
        if (this.isMining && this.miningTarget) {
            const elapsed = Date.now() - this.miningStartTime;
            const miningTime = Utils.calculateMiningTime(
                this.miningTarget.material,
                this.stats.miningPower,
                this.stats.miningEfficiency || 0
            );
            
            this.miningProgress = Math.min(elapsed / miningTime, 1);
            
            if (this.miningProgress >= 1) {
                const result = this.completeMining();
                
                // Dispatch mining complete event with result
                if (result) {
                    document.dispatchEvent(new CustomEvent('miningComplete', {
                        detail: result
                    }));
                }
            }
        }
        
        // Update auto-mining
        this.updateAutoMining(deltaTime);
        
        // Update animation
        this.animationTime += deltaTime;
        if (this.animationTime > 200) { // Change frame every 200ms
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTime = 0;
        }
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Regenerate health slowly
        if (this.health < this.maxHealth && Math.random() < 0.001) {
            this.health = Math.min(this.health + 1, this.maxHealth);
        }
    }
    
    updateStatusEffects(deltaTime) {
        for (const [effect, data] of this.statusEffects) {
            data.duration -= deltaTime;
            if (data.duration <= 0) {
                this.removeStatusEffect(effect);
            }
        }
    }
    
    addStatusEffect(effect, duration, value = 0) {
        this.statusEffects.set(effect, { duration, value });
        this.updateStats();
    }
    
    removeStatusEffect(effect) {
        this.statusEffects.delete(effect);
        this.updateStats();
    }
    
    move(dx, dy, area) {
        if (this.isMoving || this.isMining) {
            return false;
        }
        
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // Check bounds
        if (newX < 0 || newX >= area.width || newY < 0 || newY >= area.height) {
            return false;
        }
        
        // Check if cell is walkable
        const cell = area.getCell(newX, newY);
        if (!this.canWalkOn(cell)) {
            return false;
        }
        
        // Set movement target
        this.targetX = newX;
        this.targetY = newY;
        this.isMoving = true;
        this.moveProgress = 0;
        
        // Update facing direction
        if (dx > 0) this.facingDirection = 'right';
        else if (dx < 0) this.facingDirection = 'left';
        else if (dy > 0) this.facingDirection = 'down';
        else if (dy < 0) this.facingDirection = 'up';
        
        return true;
    }
    
    canWalkOn(cell) {
        if (cell === null || cell === undefined) {
            return false;
        }

        const walkableCells = [
            CELL_TYPES.EMPTY,
            CELL_TYPES.DOOR,
            CELL_TYPES.MERCHANT,
            CELL_TYPES.CHEST,
            CELL_TYPES.CHEST_OPENED,
            CELL_TYPES.CRAFTING,
            // New walkable materials
            CELL_TYPES.GRASS,
            CELL_TYPES.SAND,
            CELL_TYPES.ICE,
            CELL_TYPES.WOOD,
            // Note: LAVA and WATER are not walkable (damaging or obstacles)
            // Note: Enemy drop materials (GEL, SILK, etc.) are not walkable terrain
        ];

        return walkableCells.includes(cell);
    }
    
    startMining(targetX, targetY, area) {
        if (this.isMining || this.isMoving) return false;
        
        // Check if target is adjacent
        const distance = Utils.manhattanDistance(this.x, this.y, targetX, targetY);
        if (distance !== 1) return false;
        
        const cell = area.getCell(targetX, targetY);
        if (!cell || !this.canMine(cell)) return false;
        
        this.isMining = true;
        this.miningTarget = { x: targetX, y: targetY, material: cell };
        this.miningProgress = 0;
        this.miningStartTime = Date.now();
        
        return true;
    }
    
    canMine(cell) {
        const minableCells = [
            CELL_TYPES.DIRT,
            CELL_TYPES.ROCK,
            CELL_TYPES.CRYSTAL,
            CELL_TYPES.GEM,
            CELL_TYPES.GOLD,
            CELL_TYPES.COAL,
            CELL_TYPES.IRON,
            CELL_TYPES.DIAMOND,
            CELL_TYPES.EMERALD,
            CELL_TYPES.RUBY,
            CELL_TYPES.SAPPHIRE,
            // Advanced Materials
            CELL_TYPES.GRASS,
            CELL_TYPES.SAND,
            CELL_TYPES.ICE,
            CELL_TYPES.OBSIDIAN,
            CELL_TYPES.AMETHYST,
            CELL_TYPES.COPPER,
            CELL_TYPES.SILVER,
            CELL_TYPES.PLATINUM,
            CELL_TYPES.MYTHRIL,
            CELL_TYPES.ADAMANTITE,
            CELL_TYPES.ENCHANTED,
            // Enemy Drop Materials (minable if found in world)
            CELL_TYPES.GEL,
            CELL_TYPES.SILK,
            CELL_TYPES.ROTTEN_FLESH,
            CELL_TYPES.BONE,
            CELL_TYPES.DRAGON_SCALE,
            CELL_TYPES.WOOD
        ];

        return minableCells.includes(cell);
    }
    
    completeMining() {
        if (!this.miningTarget) return null;
        
        const { x, y, material } = this.miningTarget;
        
        // Add resource to inventory
        const success = this.inventory.addItem({
            id: `resource_${material}`,
            name: Utils.capitalize(MATERIALS[material]?.name || 'Unknown'),
            type: 'resource',
            material: material,
            value: MATERIALS[material]?.value || 1,
            color: MATERIALS[material]?.color || '#FFFFFF'
        });
        
        let result = { x, y, mined: false };
        
        if (success) {
            // Update achievement stats
            this.statsTracker.materials_mined++;

            const materialData = MATERIALS[material];
            if (materialData) {
                // Check for gem
                if (materialData.name.toLowerCase().includes('gem') ||
                    materialData.name.toLowerCase().includes('diamond') ||
                    materialData.name.toLowerCase().includes('emerald') ||
                    materialData.name.toLowerCase().includes('ruby') ||
                    materialData.name.toLowerCase().includes('sapphire') ||
                    materialData.name.toLowerCase().includes('amethyst')) {
                    this.statsTracker.gems_mined++;
                }

                // Check for diamond
                if (material === CELL_TYPES.DIAMOND) {
                    this.statsTracker.diamond_mined++;
                }

                // Check for legendary
                if (materialData.legendary) {
                    this.statsTracker.legendary_mined++;
                }

                // Handle special material effects
                if (materialData.magical) {
                    const bonusXP = Math.floor(materialData.experience * 0.5);
                    this.gainExperience(bonusXP);
                }

                // Rare materials trigger special notification
                if (materialData.rare) {
                    document.dispatchEvent(new CustomEvent('rareMaterialMined', {
                        detail: { material: material, player: this }
                    }));
                }

                // Legendary materials trigger special notification
                if (materialData.legendary) {
                    document.dispatchEvent(new CustomEvent('legendaryMaterialMined', {
                        detail: { material: material, player: this }
                    }));
                }

                // Cursed materials apply negative effects
                if (materialData.cursed) {
                    this.addStatusEffect('cursed', 30000); // 30 seconds of curse
                }

                // Slippery materials increase pickaxe damage
                if (materialData.slippery) {
                    this.damageEquipment(EQUIPMENT_SLOTS.PICKAXE, 2); // Extra damage for slippery materials
                }
            }

            // Gain experience
            this.gainExperience(MATERIALS[material]?.experience || 1);

            // Check for rare drop (Lucky Finder achievement)
            this.checkForLuckyFind(material);

            // Damage pickaxe
            this.damageEquipment(EQUIPMENT_SLOTS.PICKAXE, 1);

            // Mark as mined
            result.mined = true;
        }
        
        // Always reset mining state when complete
        this.isMining = false;
        this.miningTarget = null;
        this.miningProgress = 0;
        
        return result;
    }
    
    cancelMining() {
        this.isMining = false;
        this.miningTarget = null;
        this.miningProgress = 0;
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.health = Math.max(0, this.health - actualDamage);
        
        // Flash effect
        this.addStatusEffect('damage', 500);
        
        return actualDamage;
    }
    
    heal(amount) {
        const healed = Math.min(amount, this.maxHealth - this.health);
        this.health += healed;
        return healed;
    }
    
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        this.experienceToNext = EXPERIENCE_FORMULA.calculateRequired(this.level);
        
        // Give skill points when leveling up
        this.skillSystem.addSkillPoints(1); // 1 skill point per level
        
        // Increase stats
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.baseStats.attack += 2;
        this.baseStats.defense += 1;
        this.baseStats.miningPower += 0.5;
        
        this.updateStats();
        
        // Dispatch level up event for achievements
        document.dispatchEvent(new CustomEvent('playerLevelUp', {
            detail: { newLevel: this.level, player: this }
        }));
        
        // Level up effect
        this.addStatusEffect('levelup', 2000);
    }
    
    updateStats() {
        // Start with base stats
        this.stats = { ...this.baseStats };
        
        // Add equipment bonuses
        const equipmentBonuses = this.equipment.getAllStatBonuses();
        for (const [stat, bonus] of Object.entries(equipmentBonuses)) {
            this.stats[stat] = (this.stats[stat] || 0) + bonus;
        }
        
        // Add status effect bonuses
        for (const [effect, data] of this.statusEffects) {
            switch (effect) {
                case 'strength':
                    this.stats.attack += data.value;
                    break;
                case 'defense_boost':
                    this.stats.defense += data.value;
                    break;
                case 'haste':
                    this.stats.speed *= (1 + data.value);
                    break;
                case 'luck':
                    this.stats.luck += data.value;
                    break;
                case 'cursed':
                    // Cursed reduces all stats by 10%
                    this.stats.attack *= 0.9;
                    this.stats.defense *= 0.9;
                    this.stats.miningPower *= 0.9;
                    this.stats.luck = Math.max(0, this.stats.luck - 5);
                    break;
                case 'regeneration':
                    // Health regeneration per second
                    this.health = Math.min(this.maxHealth, this.health + data.value * (deltaTime / 1000));
                    break;
                case 'poison':
                    // Damage over time
                    this.health = Math.max(0, this.health - data.value * (deltaTime / 1000));
                    break;
                case 'berserker':
                    // Bonus when low on health
                    if (this.health / this.maxHealth < 0.25) {
                        this.stats.attack *= (1 + data.value);
                    }
                    break;
                case 'immunity':
                    // Temporary damage immunity
                    this.stats.defense = Infinity;
                    break;
            }
        }
        
        // Apply luck to other stats
        if (this.stats.luck > 0) {
            const luckMultiplier = 1 + (this.stats.luck / 100);
            this.stats.attack *= luckMultiplier;
            this.stats.miningPower *= luckMultiplier;
        }

        // Apply skill bonuses
        const skillStats = this.getSkillStats();
        for (const [stat, value] of Object.entries(skillStats)) {
            if (stat === 'autoMine') {
                this.autoMine = value;
            } else if (stat === 'maxHealth') {
                this.maxHealth += value;
                // Ensure current health doesn't exceed new max
                if (this.health > this.maxHealth) {
                    this.health = this.maxHealth;
                }
            } else {
                this.stats[stat] = (this.stats[stat] || 0) + value;
            }
        }

        // Check achievements
        this.checkAchievements();
    }

    getSkillStats() {
        // Get bonuses from learned skills
        return this.skillSystem.getTotalStatsFromSkills();
    }
    
    damageEquipment(slot, amount) {
        const item = this.equipment.getSlot(slot);
        if (item && item.durability !== undefined) {
            item.durability -= amount;
            if (item.durability <= 0) {
                this.equipment.unequip(slot);
                this.updateStats();
                return true; // Equipment broke
            }
        }
        return false;
    }
    
    repairEquipment(slot, amount) {
        const item = this.equipment.getSlot(slot);
        if (item && item.durability !== undefined) {
            item.durability = Math.min(item.maxDurability, item.durability + amount);
            return true;
        }
        return false;
    }
    
    getRenderPosition() {
        if (this.isMoving) {
            const t = Utils.easeInOut(this.moveProgress);
            return {
                x: Utils.lerp(this.x, this.targetX, t),
                y: Utils.lerp(this.y, this.targetY, t)
            };
        }
        return { x: this.x, y: this.y };
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            level: this.level,
            experience: this.experience,
            health: this.health,
            maxHealth: this.maxHealth,
            coins: this.coins,
            skillPoints: this.skillPoints,
            baseStats: this.baseStats,
            characterInfo: this.characterInfo,
            inventory: this.inventory.serialize(),
            equipment: this.equipment.serialize(),
            skillSystem: this.skillSystem.serialize(),
            statsTracker: this.statsTracker,
            autoMine: this.autoMine,
            playtime: this.statsTracker.playtime
        };
    }
    
    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.level = data.level;
        this.experience = data.experience;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.coins = data.coins;
        this.skillPoints = data.skillPoints || 3; // Default to 3 if not saved
        this.baseStats = data.baseStats;
        this.characterInfo = data.characterInfo;
        
        this.inventory.deserialize(data.inventory);
        this.equipment.deserialize(data.equipment);
        this.skillSystem.deserialize(data.skillSystem || {});
        
        // Restore stats tracking
        if (data.statsTracker) {
            this.statsTracker = { ...this.statsTracker, ...data.statsTracker };
        }
        
        // Restore auto-mining
        this.autoMine = data.autoMine || null;
        
        this.experienceToNext = EXPERIENCE_FORMULA.calculateRequired(this.level);
        this.updateStats();
    }

    setGame(game) {
        this.game = game;
    }

    updatePlaytime(deltaTime) {
        this.statsTracker.playtime += deltaTime;
        this.statsTracker.lastUpdateTime = Date.now();
    }

    updateAutoMining(deltaTime) {
    if (!this.autoMine) return;

    // For basic auto-mine, check adjacent cells for dirt/wood and mine instantly
    if (this.autoMine === 'basic') {
        this.performInstantAutoMining();
    } else {
        // For advanced auto-mining, use the timer-based system
        this.autoMineTimer += deltaTime;
        if (this.autoMineTimer >= this.autoMineInterval) {
            this.performAutoMining();
        }
    }
    }

    mineMaterial(targetX, targetY, material) {
        // Instantly mine a material (used for auto-mining)
        const success = this.inventory.addItem({
            id: `resource_${material}`,
            name: Utils.capitalize(MATERIALS[material]?.name || 'Unknown'),
            type: 'resource',
            material: material,
            value: MATERIALS[material]?.value || 1,
            color: MATERIALS[material]?.color || '#FFFFFF'
        });

        if (success) {
            // Update achievement stats
            this.statsTracker.materials_mined++;

            const materialData = MATERIALS[material];
            if (materialData) {
                // Check for gem
                if (materialData.name.toLowerCase().includes('gem') ||
                    materialData.name.toLowerCase().includes('diamond') ||
                    materialData.name.toLowerCase().includes('emerald') ||
                    materialData.name.toLowerCase().includes('ruby') ||
                    materialData.name.toLowerCase().includes('sapphire') ||
                    materialData.name.toLowerCase().includes('amethyst')) {
                    this.statsTracker.gems_mined++;
                }

                // Check for diamond
                if (material === CELL_TYPES.DIAMOND) {
                    this.statsTracker.diamond_mined++;
                }

                // Check for legendary
                if (materialData.legendary) {
                    this.statsTracker.legendary_mined++;
                }

                // Handle special material effects
                if (materialData.magical) {
                    const bonusXP = Math.floor(materialData.experience * 0.5);
                    this.gainExperience(bonusXP);
                }

                // Rare materials trigger special notification
                if (materialData.rare) {
                    document.dispatchEvent(new CustomEvent('rareMaterialMined', {
                        detail: { material: material, player: this }
                    }));
                }

                // Legendary materials trigger special notification
                if (materialData.legendary) {
                    document.dispatchEvent(new CustomEvent('legendaryMaterialMined', {
                        detail: { material: material, player: this }
                    }));
                }

                // Cursed materials apply negative effects
                if (materialData.cursed) {
                    this.addStatusEffect('cursed', 30000); // 30 seconds of curse
                }

                // Slippery materials increase pickaxe damage
                if (materialData.slippery) {
                    this.damageEquipment(EQUIPMENT_SLOTS.PICKAXE, 2); // Extra damage for slippery materials
                }
            }

            // Gain experience
            this.gainExperience(MATERIALS[material]?.experience || 1);

            // Check for rare drop (Lucky Finder achievement)
            this.checkForLuckyFind(material);

            // Damage pickaxe
            this.damageEquipment(EQUIPMENT_SLOTS.PICKAXE, 1);
        }

        return success;
    }

    performAutoMining() {
        // Advanced auto-mining: mine harder materials or mine from a wider range
        if (!this.game?.currentArea) return;

        // Reset timer
        this.autoMineTimer = 0;

        // Define materials that advanced auto-mining can target
        const advancedMineable = [
            CELL_TYPES.ROCK,
            CELL_TYPES.CRYSTAL,
            CELL_TYPES.COAL,
            CELL_TYPES.IRON,
            CELL_TYPES.COPPER,
            CELL_TYPES.GOLD
        ];

        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: -1, dy: -1 }, // diagonal up-left
            { dx: -1, dy: 1 },  // diagonal down-left
            { dx: 1, dy: -1 },  // diagonal up-right
            { dx: 1, dy: 1 }    // diagonal down-right
        ];

        // Check all adjacent cells (including diagonals) for advanced materials
        for (const dir of directions) {
            const targetX = this.x + dir.dx;
            const targetY = this.y + dir.dy;

            const cell = this.game.currentArea.getCell(targetX, targetY);
            if (cell && advancedMineable.includes(cell)) {
                // Instantly mine the cell
                this.mineMaterial(targetX, targetY, cell);
                // Remove the cell from the area
                this.game.currentArea.setCell(targetX, targetY, CELL_TYPES.EMPTY);

                // Play mining sound if available
                if (this.game.audioSystem?.playMiningSound) {
                    this.game.audioSystem.playMiningSound(cell);
                }

                // Create mining effect
                if (this.game.createMiningEffect) {
                    this.game.createMiningEffect(targetX, targetY);
                }

                // Only mine one cell per auto-mine cycle to prevent spam
                break;
            }
        }
    }

    performInstantAutoMining() {
        // Auto-mine dirt and wood instantly when adjacent
        if (!this.game?.currentArea) return;

        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

        // Check all adjacent cells
        for (const dir of directions) {
            const targetX = this.x + dir.dx;
            const targetY = this.y + dir.dy;

            const cell = this.game.currentArea.getCell(targetX, targetY);
            if (cell === CELL_TYPES.DIRT || cell === CELL_TYPES.WOOD) {
                // Instantly mine the cell
                this.mineMaterial(targetX, targetY, cell);
                // Remove the cell from the area
                this.game.currentArea.setCell(targetX, targetY, CELL_TYPES.EMPTY);

                // Play mining sound if available
                if (this.game.audioSystem?.playMiningSound) {
                    this.game.audioSystem.playMiningSound(cell);
                }

                // Create mining effect
                if (this.game.createMiningEffect) {
                    this.game.createMiningEffect(targetX, targetY);
                }

                // Only mine one cell per update to prevent spam
                break;
            }
        }
    }

    checkForLuckyFind(material) {
        // Check for rare drop (Lucky Finder achievement)
        if (Math.random() < 0.01) { // 1% chance
            // Add a gem to inventory
            const gemAdded = this.inventory.addItem({
                id: `resource_${CELL_TYPES.GEM}`,
                name: 'Gem',
                type: 'resource',
                material: CELL_TYPES.GEM,
                value: MATERIALS[CELL_TYPES.GEM]?.value || 25,
                color: MATERIALS[CELL_TYPES.GEM]?.color || '#FF69B4'
            });

            if (gemAdded) {
                // Show notification for lucky find
                if (this.game?.ui?.showNotification) {
                    this.game.ui.showNotification('Lucky Find! You discovered a free gem!', 'success', 3000);
                }

                document.dispatchEvent(new CustomEvent('rareDropFound', {
                    detail: { material: material, player: this }
                }));
            }
        }
    }

    checkAchievements() {
        // Check for fully equipped achievement
        const equippedCount = Object.values(this.equipment.slots).filter(item => item).length;
        if (equippedCount >= 6 && !this.statsTracker.fully_equipped) {
            this.statsTracker.fully_equipped = true;
            document.dispatchEvent(new CustomEvent('fullyEquipped', {
                detail: { player: this }
            }));
        }

        // Check for legendary equipped achievement
        const hasLegendary = Object.values(this.equipment.slots).some(item =>
            item && (item.legendary || item.enhanced)
        );
        if (hasLegendary && !this.statsTracker.legendary_equipped) {
            this.statsTracker.legendary_equipped = true;
            document.dispatchEvent(new CustomEvent('legendaryEquipped', {
                detail: { player: this }
            }));
        }
    }

    attack(target) {
        // Calculate damage and track if it was critical
        const result = Utils.calculateDamage(this, target);
        this.lastAttackWasCritical = result.isCritical;
        this.lastDamageDealt = result.damage; // Store damage for Game.js to access
        
        // Apply damage to target
        const enemyDied = target.takeDamage(result.damage);
        
        // Return the damage dealt, not whether enemy died
        return result.damage;
    }
}