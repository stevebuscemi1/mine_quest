// js/ui/CraftingUI.js

import { CRAFTING_TIERS, CRAFTING_STATES, CRAFTING_CONSTANTS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class CraftingUI {
    constructor(game, craftingSystem) {
        this.game = game;
        this.craftingSystem = craftingSystem;
        this.isOpen = false;
        this.currentRecipeIndex = 0;
        this.currentRecipes = [];
        this.animationTimeout1 = null;
        this.animationTimeout2 = null;
        this.rollingInterval = null;

        this.cirthAlphabet = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛞᛟᚾ";

        // Audio setup
        this.buttonSound = new Audio('assets/sounds/ui/button_click.mp3');
        this.buttonSound.volume = 0.5;
        this.successSound = new Audio('assets/sounds/ui/craft_success.mp3');
        this.successSound.volume = CRAFTING_CONSTANTS.SUCCESS_VOLUME;
        this.failureSound = new Audio('assets/sounds/ui/craft_failure.mp3');
        this.failureSound.volume = CRAFTING_CONSTANTS.FAILURE_VOLUME;
        this.errorSound = new Audio('assets/sounds/ui/craft_error.mp3');
        this.errorSound.volume = CRAFTING_CONSTANTS.ERROR_VOLUME;
        this.ambientSound = new Audio('assets/sounds/ambient/forge.mp3');
        this.ambientSound.volume = CRAFTING_CONSTANTS.AMBIENT_VOLUME;
        this.ambientSound.loop = true;

        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Create the main crafting container
        this.container = document.createElement('div');
        this.container.id = 'crafting-container';
        this.container.className = 'crafting-container hidden';

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'crafting-tooltip';
        this.tooltip.className = 'crafting-tooltip';
        document.body.appendChild(this.tooltip);

        // Create ingredient tooltip
        this.ingredientTooltip = document.createElement('div');
        this.ingredientTooltip.id = 'ingredient-tooltip';
        this.ingredientTooltip.className = 'tooltip';
        document.body.appendChild(this.ingredientTooltip);

        this.container.innerHTML = `
            <div class="crafting-header">
                <button id="crafting-close-btn" class="crafting-close-btn">×</button>
            </div>
            <div class="crafting-main">
                <div class="crafting-left">
                    <div id="crafting-item-slot" class="crafting-item-slot">
                        <!-- Item icon will be set by JS -->
                    </div>
                    <div class="crafting-buttons">
                        <button id="crafting-prev-btn">&lt;</button>
                        <button id="crafting-next-btn">&gt;</button>
                    </div>
                </div>
                <div class="crafting-right">
                    <div class="crafting-ingredients">
                        <div class="crafting-ingredients-top">
                            <div id="crafting-ingredient-1" class="crafting-ingredient-slot" data-material=""></div>
                        </div>
                        <div class="crafting-ingredients-bottom">
                            <div id="crafting-ingredient-2" class="crafting-ingredient-slot" data-material=""></div>
                            <div id="crafting-ingredient-3" class="crafting-ingredient-slot" data-material=""></div>
                        </div>
                    </div>
                    <button id="crafting-make-btn" class="crafting-make-btn">🔨 Make</button>
                    <div id="crafting-progress" class="crafting-progress hidden">
                        <div class="crafting-progress-bar">
                            <div class="crafting-progress-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="crafting-cirth-display" class="crafting-cirth-display"></div>
        `;

        // Add styles
        this.addStyles();

        // Get elements
        this.itemSlot = this.container.querySelector('#crafting-item-slot');
        this.prevBtn = this.container.querySelector('#crafting-prev-btn');
        this.nextBtn = this.container.querySelector('#crafting-next-btn');
        this.makeBtn = this.container.querySelector('#crafting-make-btn');
        this.closeBtn = this.container.querySelector('#crafting-close-btn');
        this.cirthDisplay = this.container.querySelector('#crafting-cirth-display');
        this.progressBar = this.container.querySelector('.crafting-progress-fill');
        this.progressContainer = this.container.querySelector('#crafting-progress');
        this.ingredientSlots = [
            this.container.querySelector('#crafting-ingredient-1'),
            this.container.querySelector('#crafting-ingredient-2'),
            this.container.querySelector('#crafting-ingredient-3')
        ];

        document.body.appendChild(this.container);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .crafting-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url('assets/images/ui/dialogs/crafting_bg.png');
                background-size: 100% 100%;
                background-position: center;
                background-repeat: no-repeat;
                border: none;
                box-shadow:
                    inset 1px 1px 0px rgba(255, 255, 255, 0.15),
                    inset -1px -1px 0px rgba(0, 0, 0, 0.5),
                    1px 1px 0px rgba(0, 0, 0, 0.7),
                    -1px -1px 0px rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                z-index: 10000;
                color: #e0e0e0;
                font-family: 'Crimson Text', serif;
                width: 80vw;
                height: 80vh;
                max-width: 800px;
                max-height: 600px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
            }

            .crafting-container.hidden {
                display: none !important;
            }

            .crafting-header {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                width: 100%;
                margin-bottom: 20px;
            }

            .crafting-close-btn {
                background: none;
                border: none;
                color: #d4af37;
                font-size: 2em;
                font-weight: bold;
                cursor: pointer;
                padding: 5px 15px;
                border-radius: 5px;
                transition: all 0.2s ease;
            }

            .crafting-close-btn:hover {
                background-color: rgba(212, 175, 55, 0.2);
                color: #ffd700;
            }

            .crafting-main {
                display: flex;
                gap: 40px;
                align-items: center;
            }

            .crafting-left {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
            }

            #crafting-item-slot {
                width: 200px;
                height: 200px;
                border: 8px solid #5a3e36;
                border-radius: 10px;
                background-color: #4a4a4a;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 80px;
                cursor: pointer;
                position: relative;
                box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000;
                transition: background-color 0.4s ease, transform 0.2s ease;
                overflow: hidden;
            }

            #crafting-item-slot:hover {
                transform: scale(1.05);
            }

            .crafting-buttons {
                display: flex;
                gap: 50px;
            }

            .crafting-buttons button {
                width: 100px;
                height: 70px;
                font-family: 'Cinzel', serif;
                font-size: 36px;
                font-weight: bold;
                color: #e0e0e0;
                background-color: #8a6d3b;
                border: 3px solid #5a3e36;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.1s ease;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }

            .crafting-buttons button:hover {
                background-color: #a0826d;
                transform: translateY(-3px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            }

            .crafting-buttons button:active {
                transform: translateY(2px) scale(0.98);
                box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                background-color: #7a5d2b;
            }

            .crafting-right {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
            }

            .crafting-ingredients {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .crafting-ingredients-top {
                display: flex;
                justify-content: center;
            }

            .crafting-ingredients-bottom {
                display: flex;
                gap: 10px;
            }

            .crafting-ingredient-slot {
                width: 80px;
                height: 80px;
                border: 4px solid #5a3e36;
                border-radius: 8px;
                background-color: #4a4a4a;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 40px;
                position: relative;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
            }

            .crafting-make-btn {
                width: 120px;
                height: 60px;
                font-family: 'Cinzel', serif;
                font-size: 24px;
                font-weight: bold;
                color: #e0e0e0;
                background-color: #8a6d3b;
                border: 3px solid #5a3e36;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.1s ease;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .crafting-make-btn:hover:not(:disabled) {
                background-color: #a0826d;
                transform: translateY(-3px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            }

            .crafting-make-btn:active:not(:disabled) {
                transform: translateY(2px) scale(0.98);
                box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                background-color: #7a5d2b;
            }

            .crafting-make-btn:disabled {
                background-color: #666;
                cursor: not-allowed;
                opacity: 0.6;
            }

            .crafting-progress {
                width: 200px;
                height: 20px;
                background-color: #333;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
            }

            .crafting-progress.hidden {
                display: none;
            }

            .crafting-progress-bar {
                width: 100%;
                height: 100%;
                position: relative;
            }

            .crafting-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
                width: 0%;
                transition: width 0.1s ease;
                box-shadow: 0 0 10px rgba(0,255,0,0.5);
            }

            .crafting-cirth-display {
                font-family: 'Noto Sans Runic', serif;
                text-align: center;
                font-size: 2em;
                color: #e36f11ff;
                text-shadow: 1px 1px 2px #8b1303ed, -1px -1px 2px #555;
                margin-top: 10px;
                min-height: 1.2em;
                width: 100%;
            }

            .crafting-tooltip, .tooltip {
                position: fixed;
                background-color: black;
                color: white;
                padding: 12px 18px;
                border-radius: 8px;
                border: 2px solid #d4af37;
                width: 250px;
                white-space: normal;
                text-align: left;
                z-index: 10001;
                box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            .crafting-tooltip p, .tooltip p {
                margin: 4px 0;
            }

            .crafting-tooltip .tooltip-khazdul, .tooltip .tooltip-khazdul {
                font-family: 'Noto Sans Runic', serif;
                font-weight: 700;
                color: #9b59b6;
                font-size: 1.2em;
            }

            .crafting-tooltip .tooltip-english, .tooltip .tooltip-english {
                font-style: italic;
                color: white;
                border-bottom: 1px solid #8a6d3b;
                padding-bottom: 5px;
            }

            .crafting-tooltip .tooltip-explanation,
            .crafting-tooltip .tooltip-stats,
            .tooltip .tooltip-explanation,
            .tooltip .tooltip-stats {
                color: white;
                font-size: 0.9em;
            }

            .crafting-tooltip .tooltip-stats, .tooltip .tooltip-stats {
                margin-top: 8px;
                color: #d4af37;
                font-weight: 600;
            }

            /* Material-specific visual effects */
            .effect-mithril::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 150%;
                height: 100%;
                background: linear-gradient(
                    105deg,
                    transparent 40%,
                    rgba(255, 255, 255, 0.7) 50%,
                    rgba(255, 119, 171, 0.7) 60%,
                    rgba(119, 171, 255, 0.7) 70%,
                    transparent 80%
                );
                mix-blend-mode: overlay;
                transform: translateX(-100%);
                animation: liquid-sheen 3s infinite;
            }

            .effect-gem::before,
            .effect-gem::after {
                content: '';
                position: absolute;
                width: 5px;
                height: 5px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
                opacity: 0;
            }

            .effect-gem::before {
                top: 20%;
                left: 30%;
                animation: sparkle 2s infinite 0.5s;
            }

            .effect-gem::after {
                top: 60%;
                left: 70%;
                animation: sparkle 2s infinite 1.5s;
            }

            .effect-fire {
                animation: ember-flicker 0.15s infinite steps(1);
            }

            .effect-gold {
                animation: golden-gleam 2s infinite ease-in-out;
            }

            @keyframes liquid-sheen {
                0% { transform: translateX(-100%) rotate(35deg); }
                100% { transform: translateX(250%) rotate(35deg); }
            }

            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
            }

            @keyframes ember-flicker {
                0% { box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000, 0 0 15px #ff8800; }
                50% { box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000, 0 0 20px #ff4400; }
                100% { box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000, 0 0 12px #ffaa00; }
            }

            @keyframes golden-gleam {
                0%, 100% { box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000, 0 0 5px #d4af37, inset 0 0 15px rgba(212, 175, 55, 0.2); }
                50% { box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px #000, 0 0 20px #ffd700, inset 0 0 25px rgba(255, 215, 0, 0.4); }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Button clicks
        this.prevBtn.addEventListener('click', () => this.navigateRecipe(-1));
        this.nextBtn.addEventListener('click', () => this.navigateRecipe(1));
        this.makeBtn.addEventListener('click', () => this.makeItem());
        this.closeBtn.addEventListener('click', () => this.hide());

        // Item slot hover for tooltip
        this.itemSlot.addEventListener('mouseenter', (e) => this.showTooltip(e));
        this.itemSlot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        this.itemSlot.addEventListener('mouseleave', () => this.hideTooltip());

        // Ingredient slot hovers
        this.ingredientSlots.forEach(slot => {
            slot.addEventListener('mouseenter', (e) => this.showIngredientTooltip(e));
            slot.addEventListener('mousemove', (e) => this.updateIngredientTooltipPosition(e));
            slot.addEventListener('mouseleave', () => this.hideTooltip());
        });

        // Crafting system listeners
        this.craftingSystem.addListener((event, data) => {
            switch (event) {
                case 'craftingStarted':
                    this.onCraftingStarted(data);
                    break;
                case 'craftingSuccess':
                    this.onCraftingSuccess(data);
                    break;
                case 'craftingFailed':
                    this.onCraftingFailed(data);
                    break;
                case 'craftingError':
                    this.onCraftingError(data);
                    break;
                case 'craftingCancelled':
                    this.onCraftingCancelled();
                    break;
            }
        });
    }

    show() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.container.classList.remove('hidden');

        // Update available recipes
        this.currentRecipes = this.craftingSystem.getAvailableRecipes(this.game.player.level);
        this.currentRecipeIndex = 0;

        // Start ambient sound
        this.ambientSound.currentTime = 0;
        this.ambientSound.play().catch(e => console.log('Ambient sound failed:', e));

        this.updateDisplay();
        this.game.pause();
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.container.classList.add('hidden');
        this.hideTooltip();

        // Stop ambient sound
        this.ambientSound.pause();

        // Cancel any ongoing crafting
        this.craftingSystem.cancelCrafting();

        this.game.resume();
    }

    updateDisplay() {
        if (this.currentRecipes.length === 0) {
            this.itemSlot.textContent = '❌';
            this.itemSlot.style.backgroundColor = '#4a4a4a';
            this.cirthDisplay.textContent = 'No recipes available';
            this.makeBtn.disabled = true;
            this.clearIngredients();
            return;
        }

        const recipe = this.currentRecipes[this.currentRecipeIndex];
        this.displayRecipe(recipe);
    }

    displayRecipe(recipe) {
        // Update item slot
        this.itemSlot.textContent = recipe.icon;
        this.itemSlot.style.backgroundColor = this.getMaterialColor(recipe.ingredients[0]?.material || 'iron');

        // Clear existing effects
        this.itemSlot.classList.remove('effect-mithril', 'effect-gem', 'effect-fire', 'effect-gold');

        // Add material effect
        const material = recipe.ingredients[0]?.material || 'iron';
        this.addMaterialEffect(material);

        // Update ingredients
        this.displayIngredients(recipe.ingredients);

        // Update Cirth display
        this.cirthDisplay.textContent = recipe.cirthName;

        // Check if can craft
        const canCraft = this.craftingSystem.canCraftRecipe(recipe.id, this.game.player);
        this.makeBtn.disabled = !canCraft.canCraft;

        // Update tooltip data
        this.currentTooltipData = {
            khuzdulName: recipe.khuzdulName,
            englishName: recipe.name,
            explanation: recipe.description,
            stats: recipe.stats
        };
    }

    displayIngredients(ingredients) {
        // Clear all slots
        this.ingredientSlots.forEach(slot => {
            slot.textContent = '';
            slot.style.backgroundColor = '#4a4a4a';
            slot.dataset.material = '';
        });

        // Display ingredients
        ingredients.forEach((ingredient, index) => {
            if (index < this.ingredientSlots.length) {
                const slot = this.ingredientSlots[index];
                const materialTexture = this.game.textures.get(ingredient.material);

                if (materialTexture) {
                    // Use texture
                    const img = document.createElement('img');
                    img.src = materialTexture.src;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    slot.innerHTML = '';
                    slot.appendChild(img);
                } else {
                    // Fallback to emoji
                    slot.textContent = this.getMaterialEmoji(ingredient.material);
                }

                slot.dataset.material = ingredient.material;

                // Check if player has enough
                const hasCount = this.game.player.inventory.getMaterialCount(ingredient.material);
                const enough = hasCount >= ingredient.count;
                slot.style.opacity = enough ? '1' : '0.5';
                slot.style.borderColor = enough ? '#5a3e36' : '#ff4444';
            }
        });
    }

    clearIngredients() {
        this.ingredientSlots.forEach(slot => {
            slot.textContent = '';
            slot.style.backgroundColor = '#4a4a4a';
            slot.dataset.material = '';
            slot.style.opacity = '1';
            slot.style.borderColor = '#5a3e36';
        });
    }

    navigateRecipe(direction) {
        this.playButtonSound();

        if (this.currentRecipes.length === 0) return;

        this.currentRecipeIndex = (this.currentRecipeIndex + direction + this.currentRecipes.length) % this.currentRecipes.length;
        this.updateDisplay();
    }

    makeItem() {
        if (this.currentRecipes.length === 0) return;

        const recipe = this.currentRecipes[this.currentRecipeIndex];
        const success = this.craftingSystem.startCrafting(recipe.id, this.game.player);

        if (success) {
            this.makeBtn.disabled = true;
            this.progressContainer.classList.remove('hidden');
        }
    }

    onCraftingStarted(data) {
        // Show progress bar
        this.progressContainer.classList.remove('hidden');
        this.makeBtn.disabled = true;
    }

    onCraftingSuccess(data) {
        this.playSuccessSound();
        this.showCraftingResult('success', data.isCritical ? 'Critical Craft!' : 'Success!', data.item.name);
        this.updateDisplay();
        this.progressContainer.classList.add('hidden');
    }

    onCraftingFailed(data) {
        this.playFailureSound();
        this.showCraftingResult('failure', 'Failed!', 'Materials lost');
        this.updateDisplay();
        this.progressContainer.classList.add('hidden');
    }

    onCraftingError(data) {
        this.playErrorSound();
        this.showCraftingResult('error', 'Cannot Craft', data.reason);
    }

    onCraftingCancelled() {
        this.progressContainer.classList.add('hidden');
        this.updateDisplay();
    }

    showCraftingResult(type, title, message) {
        // Simple notification - could be enhanced
        console.log(`${type}: ${title} - ${message}`);
        if (this.game.ui && typeof this.game.ui.showNotification === 'function') {
            this.game.ui.showNotification(`${title}: ${message}`, type === 'success' ? 'success' : 'error', 3000);
        }
    }

    update(deltaTime) {
        if (this.craftingSystem.state === CRAFTING_STATES.CRAFTING) {
            const progress = this.craftingSystem.progress;
            this.progressBar.style.width = `${progress * 100}%`;

            // Color based on progress
            if (progress < 0.5) {
                this.progressBar.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
            } else if (progress < 0.8) {
                this.progressBar.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
            } else {
                this.progressBar.style.background = 'linear-gradient(90deg, #ff8800, #ff0000)';
            }
        }
    }

    showTooltip(e) {
        if (!this.currentTooltipData) return;

        this.tooltip.innerHTML = `
            <p class="tooltip-khazdul">${this.currentTooltipData.khuzdulName}</p>
            <p class="tooltip-english">${this.currentTooltipData.englishName}</p>
            <p class="tooltip-explanation">${this.currentTooltipData.explanation}</p>
            <p class="tooltip-stats">${this.currentTooltipData.stats}</p>
        `;

        this.tooltip.style.visibility = 'visible';
        this.tooltip.style.opacity = '1';

        // Start Khuzdul animation
        this.startKhuzdulAnimation();
    }

    showIngredientTooltip(e) {
        const material = e.target.dataset.material;
        if (!material) return;

        const materialData = this.game.player.inventory.getMaterialInfo(material);
        const hasCount = this.game.player.inventory.getMaterialCount(material);
        const requiredCount = this.getRequiredCount(material);

        this.ingredientTooltip.innerHTML = `
            <p class="tooltip-name">${materialData?.name || material}</p>
            <p class="tooltip-description">Owned: ${hasCount}/${requiredCount}</p>
        `;

        this.ingredientTooltip.style.visibility = 'visible';
        this.ingredientTooltip.style.opacity = '1';
    }

    getRequiredCount(material) {
        if (this.currentRecipes.length === 0) return 0;
        const recipe = this.currentRecipes[this.currentRecipeIndex];
        const ingredient = recipe.ingredients.find(ing => ing.material === material);
        return ingredient ? ingredient.count : 0;
    }

    updateTooltipPosition(e) {
        const tooltipHeight = this.tooltip.offsetHeight;
        this.tooltip.style.left = e.pageX + 10 + 'px';
        this.tooltip.style.top = (e.pageY - tooltipHeight - 10) + 'px';
    }

    updateIngredientTooltipPosition(e) {
        const tooltipHeight = this.ingredientTooltip.offsetHeight;
        this.ingredientTooltip.style.left = e.pageX + 10 + 'px';
        this.ingredientTooltip.style.top = (e.pageY - tooltipHeight - 10) + 'px';
    }

    hideTooltip() {
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.opacity = '0';
        this.ingredientTooltip.style.visibility = 'hidden';
        this.ingredientTooltip.style.opacity = '0';
        this.stopKhuzdulAnimation();
    }

    startKhuzdulAnimation() {
        if (!this.currentTooltipData) return;

        const element = this.tooltip.querySelector('.tooltip-khazdul');
        if (!element) return;

        const originalLength = this.currentTooltipData.khuzdulName.length;

        clearTimeout(this.animationTimeout1);
        clearTimeout(this.animationTimeout2);
        clearInterval(this.rollingInterval);

        element.textContent = this.currentTooltipData.khuzdulName;
        element.style.fontFamily = "'Noto Sans Runic', serif";

        this.animationTimeout1 = setTimeout(() => {
            this.rollingInterval = setInterval(() => {
                element.textContent = this.getRandomCirthString(originalLength);
            }, 100);

            this.animationTimeout2 = setTimeout(() => {
                clearInterval(this.rollingInterval);
                element.textContent = this.currentTooltipData.khuzdulName;
                element.style.fontFamily = "'Cinzel', serif";
            }, 2000);
        }, 1000);
    }

    stopKhuzdulAnimation() {
        clearTimeout(this.animationTimeout1);
        clearTimeout(this.animationTimeout2);
        clearInterval(this.rollingInterval);
    }

    getRandomCirthString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.cirthAlphabet.charAt(Math.floor(Math.random() * this.cirthAlphabet.length));
        }
        return result;
    }

    getMaterialColor(material) {
        const colors = {
            iron: '#b7410e', gold: '#ffd700', diamond: '#b9f2ff', copper: '#b87333',
            obsidian: '#36454f', leather: '#8b4513', mithril: '#e5e4e2', magic: '#a855f7',
            gem: '#23d5d0', stone: '#a9a9a9', crystal: '#f0ffff', parchment: '#f4e4c1'
        };
        return colors[material] || '#4a4a4a';
    }

    getMaterialEmoji(material) {
        const emojis = {
            iron: "🔩", coal: "⚫", wood: "🪵", gold: "🏅",
            diamond: "💎", copper: "🟠", obsidian: "⚫", leather: "👞",
            mithril: "✨", magic: "🔮", gem: "💍", stone: "🪨",
            crystal: "🔮", parchment: "📜", ash: "🌫️", hide: "🐉"
        };
        return emojis[material] || "❓";
    }

    addMaterialEffect(material) {
        switch (material) {
            case 'mithril':
                this.itemSlot.classList.add('effect-mithril');
                break;
            case 'gem':
                this.itemSlot.classList.add('effect-gem');
                break;
            case 'magic':
                this.itemSlot.classList.add('effect-fire');
                break;
            case 'gold':
                this.itemSlot.classList.add('effect-gold');
                break;
        }
    }

    playButtonSound() {
        this.buttonSound.currentTime = 0;
        this.buttonSound.play().catch(e => console.log('Button sound failed:', e));
    }

    playSuccessSound() {
        this.successSound.currentTime = 0;
        this.successSound.play().catch(e => console.log('Success sound failed:', e));
    }

    playFailureSound() {
        this.failureSound.currentTime = 0;
        this.failureSound.play().catch(e => console.log('Failure sound failed:', e));
    }

    playErrorSound() {
        this.errorSound.currentTime = 0;
        this.errorSound.play().catch(e => console.log('Error sound failed:', e));
    }
}
