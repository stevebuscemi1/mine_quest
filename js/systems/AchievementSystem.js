// js/systems/AchievementSystem.js

import { ACHIEVEMENTS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class AchievementSystem {
    constructor() {
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.playerStats = {
            enemies_defeated: 0,
            bosses_defeated: 0,
            materials_mined: 0,
            gems_mined: 0,
            diamond_mined: 0,
            legendary_mined: 0,
            critical_hits: 0,
            level_reached: 1,
            coins_collected: 0,
            fully_equipped: false,
            legendary_equipped: false,
            speed_mining: 0,
            rare_drop_found: false,
            low_health_survival: false,
            curse_survived: false
        };
        this.listeners = new Set();

        // Initialize achievements
        this.initializeAchievements();
    }

    initializeAchievements() {
        for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
            this.achievements.set(key, {
                ...achievement,
                unlocked: false,
                progress: 0,
                dateUnlocked: null
            });
        }
    }

    updateStat(statType, value, extraData = {}) {
        // Update player stats
        if (statType === 'enemies_defeated') {
            this.playerStats.enemies_defeated += value;
            if (extraData.isBoss) {
                this.playerStats.bosses_defeated += 1;
            }
        } else if (statType === 'materials_mined') {
            this.playerStats.materials_mined += value;
            if (extraData.isGem) {
                this.playerStats.gems_mined += value;
            }
            if (extraData.isDiamond) {
                this.playerStats.diamond_mined += value;
            }
            if (extraData.isLegendary) {
                this.playerStats.legendary_mined += value;
            }
        } else if (statType === 'critical_hits') {
            this.playerStats.critical_hits += value;
        } else if (statType === 'level_reached') {
            this.playerStats.level_reached = Math.max(this.playerStats.level_reached, value);
        } else if (statType === 'coins_collected') {
            this.playerStats.coins_collected += value;
        } else if (statType === 'fully_equipped') {
            this.playerStats.fully_equipped = value;
        } else if (statType === 'legendary_equipped') {
            this.playerStats.legendary_equipped = value;
        } else if (statType === 'rare_drop_found') {
            this.playerStats.rare_drop_found = true;
        } else if (statType === 'low_health_survival') {
            this.playerStats.low_health_survival = true;
        } else if (statType === 'curse_survived') {
            this.playerStats.curse_survived = true;
        }

        // Check for achievement unlocks
        this.checkAchievements();
    }

    checkAchievements() {
        for (const [key, achievement] of this.achievements) {
            if (achievement.unlocked) continue;

            const condition = achievement.condition;
            let isUnlocked = false;

            switch (condition.type) {
                case 'enemies_defeated':
                    isUnlocked = this.playerStats.enemies_defeated >= condition.value;
                    achievement.progress = this.playerStats.enemies_defeated;
                    break;
                case 'bosses_defeated':
                    isUnlocked = this.playerStats.bosses_defeated >= condition.value;
                    achievement.progress = this.playerStats.bosses_defeated;
                    break;
                case 'materials_mined':
                    isUnlocked = this.playerStats.materials_mined >= condition.value;
                    achievement.progress = this.playerStats.materials_mined;
                    break;
                case 'gems_mined':
                    isUnlocked = this.playerStats.gems_mined >= condition.value;
                    achievement.progress = this.playerStats.gems_mined;
                    break;
                case 'diamond_mined':
                    isUnlocked = this.playerStats.diamond_mined >= condition.value;
                    achievement.progress = this.playerStats.diamond_mined;
                    break;
                case 'legendary_mined':
                    isUnlocked = this.playerStats.legendary_mined >= condition.value;
                    achievement.progress = this.playerStats.legendary_mined;
                    break;
                case 'critical_hits':
                    isUnlocked = this.playerStats.critical_hits >= condition.value;
                    achievement.progress = this.playerStats.critical_hits;
                    break;
                case 'level_reached':
                    isUnlocked = this.playerStats.level_reached >= condition.value;
                    achievement.progress = this.playerStats.level_reached;
                    break;
                case 'coins_collected':
                    isUnlocked = this.playerStats.coins_collected >= condition.value;
                    achievement.progress = this.playerStats.coins_collected;
                    break;
                case 'fully_equipped':
                    isUnlocked = this.playerStats.fully_equipped;
                    achievement.progress = this.playerStats.fully_equipped ? 100 : 0;
                    break;
                case 'legendary_equipped':
                    isUnlocked = this.playerStats.legendary_equipped;
                    achievement.progress = this.playerStats.legendary_equipped ? 100 : 0;
                    break;
                case 'speed_mining':
                    isUnlocked = this.playerStats.speed_mining >= condition.value;
                    achievement.progress = this.playerStats.speed_mining;
                    break;
                case 'rare_drop_found':
                    isUnlocked = this.playerStats.rare_drop_found;
                    achievement.progress = this.playerStats.rare_drop_found ? 100 : 0;
                    break;
                case 'low_health_survival':
                    isUnlocked = this.playerStats.low_health_survival;
                    achievement.progress = this.playerStats.low_health_survival ? 100 : 0;
                    break;
                case 'curse_survived':
                    isUnlocked = this.playerStats.curse_survived;
                    achievement.progress = this.playerStats.curse_survived ? 100 : 0;
                    break;
            }

            if (isUnlocked && !achievement.unlocked) {
                this.unlockAchievement(key);
            }
        }
    }

    unlockAchievement(achievementKey) {
        const achievement = this.achievements.get(achievementKey);
        if (!achievement) return;

        achievement.unlocked = true;
        achievement.dateUnlocked = new Date().toISOString();
        this.unlockedAchievements.add(achievementKey);

        // Grant rewards
        this.grantRewards(achievement.reward);

        // Notify listeners
        this.notifyListeners('achievementUnlocked', {
            achievement: achievement,
            key: achievementKey
        });

        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    grantRewards(reward) {
        if (reward.experience) {
            this.notifyListeners('experienceGained', { amount: reward.experience });
        }
        if (reward.coins) {
            this.notifyListeners('coinsGained', { amount: reward.coins });
        }
    }

    getAchievementsByCategory(category) {
        const achievements = [];
        for (const [key, achievement] of this.achievements) {
            if (achievement.category === category) {
                achievements.push(achievement);
            }
        }
        return achievements.sort((a, b) => a.unlocked === b.unlocked ? 0 : a.unlocked ? 1 : -1);
    }

    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    getUnlockedAchievements() {
        return Array.from(this.unlockedAchievements).map(key => this.achievements.get(key));
    }

    getProgress(achievementKey) {
        const achievement = this.achievements.get(achievementKey);
        if (!achievement) return 0;

        const condition = achievement.condition;
        let current = 0;

        switch (condition.type) {
            case 'enemies_defeated':
                current = this.playerStats.enemies_defeated;
                break;
            case 'bosses_defeated':
                current = this.playerStats.bosses_defeated;
                break;
            case 'materials_mined':
                current = this.playerStats.materials_mined;
                break;
            case 'gems_mined':
                current = this.playerStats.gems_mined;
                break;
            case 'diamond_mined':
                current = this.playerStats.diamond_mined;
                break;
            case 'legendary_mined':
                current = this.playerStats.legendary_mined;
                break;
            case 'critical_hits':
                current = this.playerStats.critical_hits;
                break;
            case 'level_reached':
                current = this.playerStats.level_reached;
                break;
            case 'coins_collected':
                current = this.playerStats.coins_collected;
                break;
            default:
                current = achievement.progress || 0;
        }

        const target = condition.value;
        return Math.min((current / target) * 100, 100);
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
            achievements: Array.from(this.achievements.entries()),
            unlockedAchievements: Array.from(this.unlockedAchievements),
            playerStats: { ...this.playerStats }
        };
    }

    deserialize(data) {
        this.achievements = new Map(data.achievements);
        this.unlockedAchievements = new Set(data.unlockedAchievements);
        this.playerStats = { ...data.playerStats };
    }
}
