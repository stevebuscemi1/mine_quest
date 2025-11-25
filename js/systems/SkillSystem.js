// js/systems/SkillSystem.js

import { SKILL_TREES } from '../constants/GameConstants.js';

export class SkillSystem {
    constructor() {
        this.skillTrees = new Map();
        this.playerSkills = new Map(); // skillId -> level
        this.skillPoints = 0;
        this.totalSkillPointsEarned = 0;
        this.listeners = new Set();

        this.initializeSkillTrees();
    }

    initializeSkillTrees() {
        for (const [treeKey, treeData] of Object.entries(SKILL_TREES)) {
            // Use lowercase keys to match UI expectations
            const lowerKey = treeKey.toLowerCase();
            const skillsMap = new Map();
            
            // Convert skill keys to lowercase to match skill.id values
            for (const [skillKey, skillData] of Object.entries(treeData.skills)) {
                skillsMap.set(skillKey.toLowerCase(), skillData);
            }
            
            this.skillTrees.set(lowerKey, {
                ...treeData,
                skills: skillsMap
            });
        }
    }

    addSkillPoints(points) {
        this.skillPoints += points;
        this.totalSkillPointsEarned += points;
        this.notifyListeners('skillPointsChanged', { points: this.skillPoints });
    }

    canUnlockSkill(skillId, treeId) {
        const tree = this.skillTrees.get(treeId);
        if (!tree) return false;

        const skill = tree.skills.get(skillId);
        if (!skill) return false;

        // Check if already maxed
        const currentLevel = this.playerSkills.get(skillId) || 0;
        if (currentLevel >= skill.maxLevel) return false;

        // Check skill point cost
        if (this.skillPoints < skill.cost) return false;

        // Check requirements - if skill has no requirements (tier 1), it's always available
        if (skill.requirements && skill.requirements.length > 0) {
            for (const requirement of skill.requirements) {
                const reqLevel = this.playerSkills.get(requirement) || 0;
                const reqSkill = this.getSkillById(requirement);
                if (!reqSkill || reqLevel < reqSkill.maxLevel) {
                    return false;
                }
            }
        }

        return true;
    }

    unlockSkill(skillId, treeId) {
        if (!this.canUnlockSkill(skillId, treeId)) {
            return { success: false, reason: 'Cannot unlock skill' };
        }

        const tree = this.skillTrees.get(treeId);
        const skill = tree.skills.get(skillId);
        const currentLevel = this.playerSkills.get(skillId) || 0;

        // Unlock or level up skill
        this.playerSkills.set(skillId, currentLevel + 1);
        this.skillPoints -= skill.cost;

        // Apply skill effects
        this.applySkillEffects(skill, currentLevel + 1);

        this.notifyListeners('skillUnlocked', {
            skillId,
            treeId,
            newLevel: currentLevel + 1,
            effects: skill.effect
        });

        return {
            success: true,
            skillId,
            newLevel: currentLevel + 1,
            effects: skill.effect
        };
    }

    applySkillEffects(skill, level) {
        // This would integrate with the player's stat system
        // For now, we'll notify listeners with the effects to apply
        this.notifyListeners('applySkillEffects', {
            skillId: skill.id,
            effects: skill.effect,
            level: level
        });
    }

    getSkillById(skillId) {
        for (const tree of this.skillTrees.values()) {
            const skill = tree.skills.get(skillId);
            if (skill) return skill;
        }
        return null;
    }

    getSkillLevel(skillId) {
        return this.playerSkills.get(skillId) || 0;
    }

    getSkillsByTree(treeId) {
        const tree = this.skillTrees.get(treeId);
        if (!tree) return [];

        return Array.from(tree.skills.values()).map(skill => ({
            ...skill,
            currentLevel: this.getSkillLevel(skill.id),
            canUnlock: this.canUnlockSkill(skill.id, treeId)
        }));
    }

    getTotalStatsFromSkills() {
        const totalStats = {
            attack: 0,
            defense: 0,
            miningPower: 0,
            maxHealth: 0,
            critChance: 0,
            miningEfficiency: 0,
            damageReduction: 0,
            regenRate: 0
        };

        for (const [skillId, level] of this.playerSkills) {
            const skill = this.getSkillById(skillId);
            if (!skill || level <= 0) continue;

            const effects = skill.effect;
            for (const [stat, value] of Object.entries(effects)) {
                if (stat === 'berserker' || stat === 'immortal' || stat === 'autoMine') {
                    // Handle special effects
                    if (stat === 'autoMine') {
                        totalStats.autoMine = effects[stat];
                    }
                } else {
                    totalStats[stat] = (totalStats[stat] || 0) + (value * level);
                }
            }
        }

        return totalStats;
    }

    getAvailableSkillPoints() {
        return this.skillPoints;
    }

    getSkillTrees() {
        return Array.from(this.skillTrees.entries()).map(([key, tree]) => ({
            id: key,
            ...tree,
            skills: this.getSkillsByTree(key)
        }));
    }

    resetSkills() {
        this.playerSkills.clear();
        this.skillPoints = this.totalSkillPointsEarned;
        this.notifyListeners('skillsReset', {});
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
        // Convert skill trees with Map skills to serializable format
        const serializedTrees = [];
        for (const [treeKey, treeData] of this.skillTrees) {
            serializedTrees.push([treeKey, {
                ...treeData,
                skills: Array.from(treeData.skills.entries())
            }]);
        }
        
        return {
            skillTrees: serializedTrees,
            playerSkills: Array.from(this.playerSkills.entries()),
            skillPoints: this.skillPoints,
            totalSkillPointsEarned: this.totalSkillPointsEarned
        };
    }

    deserialize(data) {
        // Reconstruct skill trees with proper Map structure
        this.skillTrees = new Map();
        if (data.skillTrees) {
            for (const [treeKey, treeData] of data.skillTrees) {
                // Reconstruct skills Map for each tree
                const skillsMap = new Map(treeData.skills);
                this.skillTrees.set(treeKey, {
                    ...treeData,
                    skills: skillsMap
                });
            }
        }
        
        this.playerSkills = new Map(data.playerSkills || []);
        this.skillPoints = data.skillPoints || 0;
        this.totalSkillPointsEarned = data.totalSkillPointsEarned || 0;
    }
}
