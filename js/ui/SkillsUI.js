// js/ui/SkillsUI.js

import { SKILL_TREES, CELL_TYPES } from '../constants/GameConstants.js';

export class SkillsUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.selectedTree = 'combat';
        this.skillButtons = new Map();

        // Animation variables
        this.animationTimeout1 = null;
        this.animationTimeout2 = null;
        this.rollingInterval = null;
        this.cirthAlphabet = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛞᛟᚾ";

        // Use existing HTML skillsPanel instead of creating new container
        this.container = document.getElementById('skillsPanel');
        if (!this.container) {
            console.error('SkillsUI: skillsPanel not found in HTML');
            return;
        }

        this.getReferencesToElements();
        this.setupEventListeners();
    }

    getRandomCirthString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.cirthAlphabet.charAt(Math.floor(Math.random() * this.cirthAlphabet.length));
        }
        return result;
    }

    startKhuzdulAnimation(skill, element) {
        const originalLength = skill.name.length;
        this.clearAnimations();
        
        element.textContent = this.getRandomCirthString(originalLength);
        element.style.fontFamily = "'Noto Sans Runic', serif";
        
        this.animationTimeout1 = setTimeout(() => {
            this.rollingInterval = setInterval(() => {
                element.textContent = this.getRandomCirthString(originalLength);
            }, 100);
            
            this.animationTimeout2 = setTimeout(() => {
                this.clearAnimations();
                element.textContent = skill.name;
                element.style.fontFamily = "'Cinzel', serif";
            }, 2000);
        }, 1000);
    }

    stopKhuzdulAnimation(skill, element) {
        this.clearAnimations();
        element.textContent = this.getRandomCirthString(skill.name.length);
        element.style.fontFamily = "'Noto Sans Runic', serif";
    }

    clearAnimations() {
        if (this.animationTimeout1) {
            clearTimeout(this.animationTimeout1);
            this.animationTimeout1 = null;
        }
        if (this.animationTimeout2) {
            clearTimeout(this.animationTimeout2);
            this.animationTimeout2 = null;
        }
        if (this.rollingInterval) {
            clearInterval(this.rollingInterval);
            this.rollingInterval = null;
        }
    }

    getReferencesToElements() {
        this.skillPointsValue = this.container.querySelector('#skillPointsValue');
        this.combatSkillGrid = this.container.querySelector('#combatSkillGrid');
        this.miningSkillGrid = this.container.querySelector('#miningSkillGrid');
        this.defenseSkillGrid = this.container.querySelector('#defenseSkillGrid');
        this.closeBtn = this.container.querySelector('.close-btn');
        this.resetBtn = this.container.querySelector('#skills-reset-btn');
    }

    setupEventListeners() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.hide());

        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetSkills());
        }

        // Only set up skill system listeners if player is available
        if (this.game.player && this.game.player.skillSystem) {
            this.game.player.skillSystem.addListener((event, data) => {
                if (event === 'skillPointsChanged' || event === 'skillUnlocked') {
                    this.updateDisplay();
                }
            });
        }
    }

    show() {
        if (!this.game || !this.game.player || !this.game.player.skillSystem) {
            console.warn('SkillsUI: Cannot show - game, player, or skillSystem not available');
            return;
        }

        this.isOpen = true;
        this.updateDisplay();
        this.updateSkillsGrid();
    }

    hide() {
        this.isOpen = false;
    }

    updateDisplay() {
        if (!this.game.player || !this.game.player.skillSystem) return;

        // Update skill points
        const skillPoints = this.game.player.skillSystem.getAvailableSkillPoints();
        this.skillPointsValue.textContent = skillPoints;

        this.updateSkillsGrid();
    }

    updateSkillsGrid() {
        if (!this.game.player || !this.game.player.skillSystem) return;

        // Populate combat skills
        const combatSkills = this.game.player.skillSystem.getSkillsByTree('combat');
        this.combatSkillGrid.innerHTML = '';
        combatSkills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            this.combatSkillGrid.appendChild(skillElement);
        });

        // Populate mining skills
        const miningSkills = this.game.player.skillSystem.getSkillsByTree('mining');
        this.miningSkillGrid.innerHTML = '';
        miningSkills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            this.miningSkillGrid.appendChild(skillElement);
        });

        // Populate defense skills
        const defenseSkills = this.game.player.skillSystem.getSkillsByTree('defense');
        this.defenseSkillGrid.innerHTML = '';
        defenseSkills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            this.defenseSkillGrid.appendChild(skillElement);
        });
    }

    createSkillElement(skill) {
        const element = document.createElement('div');
        element.className = `skill-node ${skill.canUnlock ? 'available' : 'locked'}`;
        element.dataset.skillId = skill.id;

        const currentLevel = skill.currentLevel;
        const maxLevel = skill.maxLevel;
        const isMaxed = currentLevel >= maxLevel;

        const canUpgrade = skill.canUnlock && !isMaxed;
        
        element.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <div class="skill-info">
                <div class="skill-name" style="font-family: 'Noto Sans Runic', serif; font-weight: 700; color: #9b59b6;">${this.getRandomCirthString(skill.name.length)}</div>
                <div class="skill-description">${skill.description}</div>
                <div class="skill-level">Level: ${currentLevel}/${maxLevel}</div>
                <div class="skill-cost">Cost: ${skill.cost} SP</div>
            </div>
            <button class="skill-upgrade-btn ${canUpgrade ? '' : 'disabled'}"
                    ${canUpgrade ? '' : 'disabled'}>
                ${isMaxed ? 'MAX' : 'UPGRADE'}
            </button>
        `;

        // Add click handler for upgrade button
        const upgradeBtn = element.querySelector('.skill-upgrade-btn');
        if (!upgradeBtn.disabled) {
            upgradeBtn.addEventListener('click', () => {
                this.upgradeSkill(skill.id);
            });
        }

        // Add tooltip on hover
        element.addEventListener('mouseenter', (e) => {
            this.showSkillTooltip(skill, e);
        });
        element.addEventListener('mouseleave', () => {
            this.hideSkillTooltip();
        });

        return element;
    }

    isVisible() {
        return this.isOpen;
    }

    showSkillTooltip(skill, event) {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.className = 'skill-tooltip';
            this.tooltipElement.style.position = 'fixed';
            this.tooltipElement.style.zIndex = '10001';
            this.tooltipElement.style.pointerEvents = 'none';
            document.body.appendChild(this.tooltipElement);
        }

        let requirementsText = '';
        if (skill.requirements && skill.requirements.length > 0) {
            requirementsText = '<div class="tooltip-requirements"><strong>Requirements:</strong>';
            skill.requirements.forEach(reqId => {
                const reqSkill = this.game.player.skillSystem.getSkillById(reqId);
                if (reqSkill) {
                    requirementsText += `<br>• ${reqSkill.name} (Max Level)`;
                }
            });
            requirementsText += '</div>';
        } else {
            requirementsText = '<div class="tooltip-requirements"><strong>Requirements:</strong><br>• None</div>';
        }

        let effectsText = '<div class="tooltip-effects"><strong>Effects:</strong>';
        if (skill.effect) {
            Object.entries(skill.effect).forEach(([stat, value]) => {
                const statName = stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                effectsText += `<br>• ${statName}: +${value}`;
            });
        }
        effectsText += '</div>';

        this.tooltipElement.innerHTML = `
            <div class="skill-tooltip-title">
                <span class="skill-tooltip-english">${this.getRandomCirthString(skill.name.length)}</span>
            </div>
            <div class="skill-tooltip-description">${skill.description}</div>
            <div class="skill-tooltip-level">Tier: ${skill.tier} | Max Level: ${skill.maxLevel}</div>
            <div class="skill-tooltip-cost">Skill Points: ${skill.cost}</div>
            ${requirementsText}
            ${effectsText}
        `;

        // Start the Khuzdul animation for the tooltip
        const englishElement = this.tooltipElement.querySelector('.skill-tooltip-english');
        this.startKhuzdulAnimation(skill, englishElement);

        // Show tooltip temporarily to get dimensions
        this.tooltipElement.style.display = 'block';
        this.tooltipElement.style.visibility = 'hidden';
        
        // Position tooltip relative to the skill node
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        
        // Position above the element if there's space, otherwise below
        let top = rect.top - tooltipRect.height - 10;
        if (top < 10) { // Not enough space above
            top = rect.bottom + 10;
        }
        
        // Center horizontally on the element
        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Keep within viewport bounds
        const maxLeft = window.innerWidth - tooltipRect.width - 10;
        const finalLeft = Math.max(10, Math.min(left, maxLeft));
        
        this.tooltipElement.style.left = finalLeft + 'px';
        this.tooltipElement.style.top = top + 'px';
        this.tooltipElement.style.visibility = 'visible';
    }

    hideSkillTooltip() {
        if (this.tooltipElement) {
            // Stop any running animations
            this.clearAnimations();
            this.tooltipElement.style.display = 'none';
        }
    }

    upgradeSkill(skillId) {
        if (!this.game.player || !this.game.player.skillSystem) return;

        // Find the tree that contains this skill
        let treeId = null;
        for (const [treeKey, treeData] of this.game.player.skillSystem.skillTrees) {
            if (treeData.skills.has(skillId)) {
                treeId = treeKey;
                break;
            }
        }

        if (!treeId) {
            if (this.game.ui && this.game.ui.showNotification) {
                this.game.ui.showNotification('Skill not found!', 'error', 3000);
            }
            return;
        }

        try {
            const result = this.game.player.skillSystem.unlockSkill(skillId, treeId);
            if (result.success) {
                this.updateDisplay();
                if (this.game.ui && this.game.ui.showNotification) {
                    this.game.ui.showNotification('Skill upgraded!', 'success', 2000);
                }
            } else {
                if (this.game.ui && this.game.ui.showNotification) {
                    this.game.ui.showNotification(result.reason || 'Cannot upgrade skill', 'error', 3000);
                }
            }
        } catch (error) {
            if (this.game.ui && this.game.ui.showNotification) {
                this.game.ui.showNotification(error.message, 'error', 3000);
            }
        }
    }

    resetSkills() {
        if (!this.game.player || !this.game.player.skillSystem) return;

        // Check if player has 3 gems in inventory
        const gemCount = this.game.player.inventory.getMaterialCount(CELL_TYPES.GEM);
        if (gemCount < 3) {
            if (this.game.ui && this.game.ui.showNotification) {
                this.game.ui.showNotification('You need 3 gems to reset skills!', 'error', 3000);
            }
            return;
        }

        // Remove 3 gems from inventory
        this.game.player.inventory.removeMaterial(CELL_TYPES.GEM, 3);

        // Reset skills and restore all skill points
        this.game.player.skillSystem.resetSkills();
        this.game.player.updateStats();

        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification('Skills reset! All skill points restored.', 'success', 3000);
        }

        this.updateDisplay();
    }
}
