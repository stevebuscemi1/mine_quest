// js/ui/UI.js

import { UI_CONSTANTS, COLORS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { MineMenuUI } from './menus/MineMenuUI.js';
import { OptionsUI } from './OptionsUI.js';
import { SkillsUI } from './SkillsUI.js';

export class UI {
    constructor() {
        // Elements
        this.elements = {
            // Game info
            areaName: document.getElementById('areaName'),
            exitCount: document.getElementById('exitCount'),
            playerLevel: document.getElementById('playerLevel'),
            playerHealth: document.getElementById('playerHealth'),
            playerXP: document.getElementById('playerXP'),
            playerCoins: document.getElementById('playerCoins'),
            timeRemaining: document.getElementById('timeRemaining'),

            // Panels
            inventoryPanel: document.getElementById('inventoryPanel'),
            equipmentPanel: document.getElementById('equipmentPanel'),
            statsPanel: document.getElementById('statsPanel'),
            achievementsPanel: document.getElementById('achievementsPanel'),
            skillsPanel: document.getElementById('skillsPanel'),
            dialogContainer: document.getElementById('dialogContainer'),
            contextMenu: document.getElementById('contextMenu'),
            loadingScreen: document.getElementById('loadingScreen'),

            // Game container
            gameContainer: document.getElementById('gameContainer'),
            gameCanvas: document.getElementById('gameCanvas'),
            touchControls: document.getElementById('touchControls'),

            // Buttons
            inventoryBtn: document.getElementById('inventoryBtn'),
            equipmentBtn: document.getElementById('equipmentBtn'),
            statsBtn: document.getElementById('statsBtn'),
            achievementsBtn: document.getElementById('achievementsBtn'),
            skillsBtn: document.getElementById('skillsBtn'),
            mineMenuBtn: document.getElementById('mineMenuBtn'),
            inventorySortBtn: document.getElementById('inventorySortBtn')
        };

        // Debug: Log which elements were found
        console.log('UI: Element availability check:');
        for (const [name, element] of Object.entries(this.elements)) {
            console.log(`   ${name}: ${element ? '✅ found' : '❌ missing'}`);
        }

        // State
        this.isInventoryOpen = false;
        this.isEquipmentOpen = false;
        this.isStatsOpen = false;
        this.isAchievementsOpen = false;
        this.isSkillsOpen = false;
        this.currentDialog = null;
        this.currentContextMenu = null;
        this.lastEscapeTime = 0;
        this.tooltips = new Map();
        this.animations = new Map();
        this.gameOptions = {};
        this.inventorySlots = [];
        this.equipmentSlots = new Map();
        this.debugEquipmentLogging = false;
        this.saveLoadUI = null;
        this.optionsUI = new OptionsUI();
        this.mineMenuUI = new MineMenuUI({
            onExitQuest: () => this.handleExitQuest(),
            onSave: () => this.handleSaveRequest(),
            onLoad: () => this.handleLoadRequest(),
            onOptions: () => this.handleOptionsRequest(),
            onContinue: () => this.resumeGame()
        });
        this.skillsUI = null; // Will be initialized when game is set
        
        // Animation state for tooltips
        this.animationTimeout1 = null;
        this.animationTimeout2 = null;
        this.rollingInterval = null;
        this.cirthAlphabet = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛝᛞᛟᚾ";

        // Selection state
        this.selectedInventorySlot = -1;
        this.selectedEquipmentSlot = null;

        // Announcement overlay state
        this.dwarvenAnnouncementOverlay = null;
        this.dwarvenAnnouncementTimer = null;
        this.dwarvenAnnouncementOnClose = null;

        // Bound handlers
        this.boundHandleAreaChanged = (event) => this.handleAreaChanged(event);

        // Initialize UI components immediately
        if (this.elements.dialogContainer && this.elements.dialogContainer.parentElement !== document.body) {
            document.body.appendChild(this.elements.dialogContainer);
        }

        this.initializeTooltips();
        this.initializeUIWithRetry();

        document.addEventListener('areaChanged', this.boundHandleAreaChanged);
    }

    setGame(game) {
        this.game = game;
        
        // If we have a SkillsUI and it's visible, refresh it
        if (this.skillsUI && this.game.player) {
            this.skillsUI.updateDisplay();
        }
    }

    handleAreaChanged(event) {
        const area = event?.detail?.toArea;
        if (!area) {
            return;
        }

        const title = area.name || this.formatAreaType(area.type) || 'Unknown Depths';
        const subtitleParts = [];
        const formattedType = this.formatAreaType(area.type);
        if (formattedType) {
            subtitleParts.push(formattedType);
        }
        if (typeof area.difficulty === 'number' && !Number.isNaN(area.difficulty)) {
            subtitleParts.push(`Depth ${area.difficulty}`);
        }

        const subtitle = subtitleParts.join(' · ');
        const body = `The stone halls shift as you enter ${formattedType ? formattedType.toLowerCase() : 'these depths'}. Stay sharp, adventurer.`;

        this.showDwarvenAnnouncement({
            title,
            subtitle,
            body,
            duration: 4200
        });
    }

    showDwarvenAnnouncement({
        title,
        subtitle = '',
        body = '',
        variant = 'default',
        duration = 0, // 0 means no auto-close
        onClose = null,
        backgroundImage = null
    }) {
        this.hideDwarvenAnnouncement();

        this.dwarvenAnnouncementOnClose = onClose || null;

        const overlay = document.createElement('div');
        overlay.className = 'dwarven-announcement-overlay';

        const container = document.createElement('div');
        container.className = 'dwarven-announcement';
        if (variant === 'danger') {
            container.classList.add('dwarven-announcement--danger');
        }

        // Add background image if provided
        if (backgroundImage) {
            const bgImg = document.createElement('div');
            bgImg.className = 'dwarven-announcement__bg';
            bgImg.style.backgroundImage = `url('${backgroundImage}')`;
            container.appendChild(bgImg);
        } else if (variant === 'danger') {
            // Default death background for danger variant
            const bgImg = document.createElement('div');
            bgImg.className = 'dwarven-announcement__bg';
            bgImg.style.backgroundImage = 'url(assets/images/ui/dialogs/death_bg.png)';
            container.appendChild(bgImg);
        } else {
            // Default area background for other variants
            const bgImg = document.createElement('div');
            bgImg.className = 'dwarven-announcement__bg';
            bgImg.style.backgroundImage = 'url(assets/images/ui/dialogs/area_bg.png)';
            container.appendChild(bgImg);
        }

        const closeButton = document.createElement('button');
        closeButton.className = 'dwarven-announcement__close';
        closeButton.setAttribute('aria-label', 'Close announcement');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.hideDwarvenAnnouncement());

        const inner = document.createElement('div');
        inner.className = 'dwarven-announcement__inner';

        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'dwarven-announcement__title';
            titleEl.textContent = title;
            inner.appendChild(titleEl);
        }

        if (subtitle) {
            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'dwarven-announcement__subtitle';
            subtitleEl.textContent = subtitle;
            inner.appendChild(subtitleEl);
        }

        if (body) {
            const bodyEl = document.createElement('div');
            bodyEl.className = 'dwarven-announcement__body';
            bodyEl.textContent = body;
            inner.appendChild(bodyEl);
        }

        container.appendChild(closeButton);
        container.appendChild(inner);
        overlay.appendChild(container);

        // Close only on X button, not on overlay click
        const closeHandler = (e) => {
            if (e.key === 'Escape' || e.target === closeButton) {
                this.hideDwarvenAnnouncement();
            }
        };

        document.addEventListener('keydown', closeHandler);
        this.dwarvenAnnouncementKeyHandler = closeHandler;

        document.body.appendChild(overlay);
        this.dwarvenAnnouncementOverlay = overlay;

        // Only set timer if duration is specified and greater than 0
        if (duration > 0) {
            this.dwarvenAnnouncementTimer = setTimeout(() => {
                this.hideDwarvenAnnouncement();
            }, duration);
        }
    }

    showBossDefeatedAnnouncement() {
        this.showDwarvenAnnouncement({
            title: 'Dragon Slain!',
            subtitle: 'A Mighty Foe Vanquished',
            body: 'The ground trembles as the dragon falls. Your legend grows, hero. The treasures of the deep are yours to claim!',
            variant: 'danger',
            duration: 0, // Don't auto-close
            backgroundImage: 'assets/images/ui/dialogs/area_bg.png'
        });
        
        // Play victory fanfare
        if (this.game?.audioSystem) {
            this.game.audioSystem.playSound('achievement');
        }
    }
    
    hideDwarvenAnnouncement() {
        if (this.dwarvenAnnouncementTimer) {
            clearTimeout(this.dwarvenAnnouncementTimer);
            this.dwarvenAnnouncementTimer = null;
        }

        // Remove keydown event listener
        if (this.dwarvenAnnouncementKeyHandler) {
            document.removeEventListener('keydown', this.dwarvenAnnouncementKeyHandler);
            this.dwarvenAnnouncementKeyHandler = null;
        }

        if (this.dwarvenAnnouncementOverlay) {
            this.dwarvenAnnouncementOverlay.classList.add('hidden');
            if (this.dwarvenAnnouncementOverlay.parentNode) {
                this.dwarvenAnnouncementOverlay.parentNode.removeChild(this.dwarvenAnnouncementOverlay);
            }
            this.dwarvenAnnouncementOverlay = null;
        }

        if (this.dwarvenAnnouncementOnClose) {
            const callback = this.dwarvenAnnouncementOnClose;
            this.dwarvenAnnouncementOnClose = null;
            callback();
        }
    }

    formatAreaType(type) {
        if (!type || typeof type !== 'string') {
            return '';
        }

        return type
            .split('_')
            .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ');
    }

    initializeUIWithRetry(retryCount = 0) {
        console.log(`UI: Initializing UI (attempt ${retryCount + 1})...`);

        // Check if critical elements are available
        const criticalElements = [
            this.elements.inventoryBtn,
            this.elements.equipmentBtn,
            this.elements.statsBtn,
            this.elements.mineMenuBtn,
            this.elements.inventoryPanel,
            this.elements.equipmentPanel,
            this.elements.statsPanel,
            this.elements.inventorySortBtn
        ];

        const missingElements = criticalElements.filter(el => !el);
        if (missingElements.length > 0 && retryCount < 5) {
            console.log(`UI: ${missingElements.length} critical elements missing, retrying in 100ms...`);
            setTimeout(() => {
                this.rescanElements();
                this.initializeUIWithRetry(retryCount + 1);
            }, 100);
            return;
        }

        if (missingElements.length > 0) {
            console.error('UI: Failed to find critical elements after 5 retries:', missingElements);
            return;
        }

        console.log('UI: All critical elements found, proceeding with initialization...');

        // Initialize UI components
        this.setupEventListeners();
        this.initializeInventory();
        this.initializeEquipment();
        this.initializeStats();
        this.initializeDialogs();
        this.initializeContextMenu();
    }

    rescanElements() {
        console.log('UI: Re-scanning for DOM elements...');
        this.elements = {
            // Game info
            areaName: document.getElementById('areaName'),
            exitCount: document.getElementById('exitCount'),
            playerLevel: document.getElementById('playerLevel'),
            playerHealth: document.getElementById('playerHealth'),
            playerXP: document.getElementById('playerXP'),
            playerCoins: document.getElementById('playerCoins'),
            timeRemaining: document.getElementById('timeRemaining'),

            // Panels
            inventoryPanel: document.getElementById('inventoryPanel'),
            equipmentPanel: document.getElementById('equipmentPanel'),
            statsPanel: document.getElementById('statsPanel'),
            achievementsPanel: document.getElementById('achievementsPanel'),
            skillsPanel: document.getElementById('skillsPanel'),
            dialogContainer: document.getElementById('dialogContainer'),
            contextMenu: document.getElementById('contextMenu'),
            loadingScreen: document.getElementById('loadingScreen'),

            // Game container
            gameContainer: document.getElementById('gameContainer'),
            gameCanvas: document.getElementById('gameCanvas'),
            touchControls: document.getElementById('touchControls'),

            // Buttons
            inventoryBtn: document.getElementById('inventoryBtn'),
            equipmentBtn: document.getElementById('equipmentBtn'),
            statsBtn: document.getElementById('statsBtn'),
            achievementsBtn: document.getElementById('achievementsBtn'),
            skillsBtn: document.getElementById('skillsBtn'),
            mineMenuBtn: document.getElementById('mineMenuBtn'),
            inventorySortBtn: document.getElementById('inventorySortBtn')
        };

        // Debug: Log which elements were found after re-scan
        console.log('UI: Element availability check after re-scan:');
        for (const [name, element] of Object.entries(this.elements)) {
            console.log(`   ${name}: ${element ? '✅ found' : '❌ missing'}`);
        }
    }
    
    setupEventListeners() {
        console.log('UI: Setting up event listeners...');

        // Panel close buttons with null checks
        if (this.elements.inventoryPanel?.querySelector('.close-btn')) {
            this.elements.inventoryPanel.querySelector('.close-btn').addEventListener('click', () => {
                this.hideInventory();
            });
            console.log('   ✅ Inventory close button listener added');
        } else {
            console.log('   ⚠️  Inventory close button not found');
        }

        if (this.elements.equipmentPanel?.querySelector('.close-btn')) {
            this.elements.equipmentPanel.querySelector('.close-btn').addEventListener('click', () => {
                this.hideEquipment();
            });
            console.log('   ✅ Equipment close button listener added');
        } else {
            console.log('   ⚠️  Equipment close button not found');
        }

        if (this.elements.statsPanel?.querySelector('.close-btn')) {
            this.elements.statsPanel.querySelector('.close-btn').addEventListener('click', () => {
                this.hideStats();
            });
            console.log('   ✅ Stats close button listener added');
        } else {
            console.log('   ⚠️  Stats close button not found');
        }

        if (this.elements.achievementsPanel?.querySelector('.close-btn')) {
            this.elements.achievementsPanel.querySelector('.close-btn').addEventListener('click', () => {
                this.hideAchievements();
            });
            console.log('   ✅ Achievements close button listener added');
        } else {
            console.log('   ⚠️  Achievements close button not found');
        }

        if (this.elements.skillsPanel?.querySelector('.close-btn')) {
            this.elements.skillsPanel.querySelector('.close-btn').addEventListener('click', () => {
                this.hideSkills();
            });
            console.log('   ✅ Skills close button listener added');
        } else {
            console.log('   ⚠️  Skills close button not found');
        }

        if (this.elements.dialogContainer?.querySelector('.close-btn')) {
            this.elements.dialogContainer.querySelector('.close-btn').addEventListener('click', () => {
                this.hideDialog();
            });
            console.log('   ✅ Dialog close button listener added');
        } else {
            console.log('   ⚠️  Dialog close button not found');
        }

        // Action buttons with null checks
        if (this.elements.inventorySortBtn) {
            this.elements.inventorySortBtn.addEventListener('click', () => {
                this.sortInventory();
            });
            console.log('   ✅ Inventory sort button listener added');
        } else {
            console.log('   ⚠️  Inventory sort button not found');
        }

        // New inventory action buttons
        const inventoryDropBtn = document.getElementById('inventoryDropBtn');
        const inventoryEquipBtn = document.getElementById('inventoryEquipBtn');
        const inventoryUseBtn = document.getElementById('inventoryUseBtn');
        const equipmentUnequipBtn = document.getElementById('equipmentUnequipBtn');

        if (inventoryDropBtn) {
            inventoryDropBtn.addEventListener('click', () => {
                this.handleInventoryDrop();
            });
            console.log('   ✅ Inventory drop button listener added');
        } else {
            console.log('   ⚠️  Inventory drop button not found');
        }

        if (inventoryEquipBtn) {
            inventoryEquipBtn.addEventListener('click', () => {
                this.handleInventoryEquip();
            });
            console.log('   ✅ Inventory equip button listener added');
        } else {
            console.log('   ⚠️  Inventory equip button not found');
        }

        if (inventoryUseBtn) {
            inventoryUseBtn.addEventListener('click', () => {
                this.handleInventoryUse();
            });
            console.log('   ✅ Inventory use button listener added');
        } else {
            console.log('   ⚠️  Inventory use button not found');
        }

        if (equipmentUnequipBtn) {
            equipmentUnequipBtn.addEventListener('click', () => {
                this.handleEquipmentUnequip();
            });
            console.log('   ✅ Equipment unequip button listener added');
        } else {
            console.log('   ⚠️  Equipment unequip button not found');
        }

        if (this.elements.inventoryBtn) {
            this.elements.inventoryBtn.addEventListener('click', () => {
                this.toggleInventory();
            });
            console.log('   ✅ Inventory button listener added');
        } else {
            console.log('   ❌ Inventory button element not found');
        }

        if (this.elements.equipmentBtn) {
            this.elements.equipmentBtn.addEventListener('click', () => {
                this.toggleEquipment();
            });
            console.log('   ✅ Equipment button listener added');
        } else {
            console.log('   ❌ Equipment button element not found');
        }

        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', () => {
                this.toggleStats();
            });
            console.log('   ✅ Stats button listener added');
        } else {
            console.log('   ❌ Stats button element not found');
        }

        if (this.elements.mineMenuBtn) {
            this.elements.mineMenuBtn.addEventListener('click', () => {
                this.toggleMineMenu();
            });
            console.log('   ✅ Mine menu button listener added');
        } else {
            console.log('   ❌ Mine menu button element not found');
        }

        if (this.elements.skillsBtn) {
            this.elements.skillsBtn.addEventListener('click', () => {
                this.toggleSkills();
            });
            console.log('   ✅ Skills button listener added');
        } else {
            console.log('   ❌ Skills button element not found');
        }

        if (this.elements.achievementsBtn) {
            this.elements.achievementsBtn.addEventListener('click', () => {
                this.toggleAchievements();
            });
            console.log('   ✅ Achievements button listener added');
        } else {
            console.log('   ❌ Achievements button element not found');
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyQ') {
                this.toggleInventory();
            } else if (e.code === 'KeyE') {
                this.toggleEquipment();
            } else if (e.code === 'KeyZ') {
                this.toggleStats();
            } else if (e.code === 'KeyX') {
                e.preventDefault();
                this.toggleAchievements();
            } else if (e.code === 'KeyC') {
                e.preventDefault();
                this.toggleSkills();
            } else if (e.code === 'Escape') {
                this.handleEscape();
            }
        });
        console.log('   ✅ Keyboard shortcuts listener added');

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.currentContextMenu && !this.elements.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        console.log('   ✅ Click outside listener added');

        console.log('UI: Event listeners setup complete');
    }
    
    initializeInventory() {
        console.log('UI: Initializing inventory...');
        const inventoryGrid = this.elements.inventoryPanel?.querySelector('.inventory-grid');
        if (!inventoryGrid) {
            console.warn('Inventory grid not found, skipping inventory initialization');
            return;
        }

        console.log('UI: Inventory grid found, creating slots...');
        // Set reference for easy access
        this.inventoryGrid = inventoryGrid;

        inventoryGrid.innerHTML = '';

        for (let i = 0; i < 40; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;

            // Add drag and drop
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e));
            slot.addEventListener('dragover', (e) => this.handleDragOver(e));
            slot.addEventListener('drop', (e) => this.handleDrop(e));
            slot.addEventListener('dragend', (e) => this.handleDragEnd(e));

            // Add click handlers
            slot.addEventListener('click', (e) => this.handleInventoryClick(e));
            slot.addEventListener('contextmenu', (e) => this.handleInventoryRightClick(e));

            inventoryGrid.appendChild(slot);
            this.inventorySlots.push(slot);
        }
        console.log('UI: Inventory initialized with 40 slots');
    }
    
    initializeEquipment() {
        const slotsContainer = this.elements.equipmentPanel?.querySelector('.equipment-slots');
        const slotElements = slotsContainer?.querySelectorAll('.slot');

        if (!slotElements) {
            console.warn('Equipment slots not found, skipping equipment initialization');
            return;
        }

        for (const slotElement of slotElements) {
            const slotType = slotElement.dataset.slot;
            this.equipmentSlots.set(slotType, slotElement);

            // Add click handlers
            slotElement.addEventListener('click', () => {
                this.handleEquipmentClick(slotType);
            });

            slotElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleEquipmentRightClick(slotType, e);
            });
        }
    }
    
    initializeDialogs() {
        // Dialog system is initialized in showDialog method
    }
    
    initializeContextMenu() {
        if (!this.elements.contextMenu) {
            console.warn('Context menu not found, skipping context menu initialization');
            return;
        }
        
        this.elements.contextMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('context-menu-item')) {
                const action = e.target.dataset.action;
                const data = JSON.parse(e.target.dataset.data || '{}');
                this.handleContextMenuAction(action, data);
                this.hideContextMenu();
            }
        });
    }
    
    initializeTooltips() {
        console.log('UI: Initializing tooltips...');
        // Tooltip system
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip';
        this.tooltipElement.style.display = 'none';
        document.body.appendChild(this.tooltipElement);

        // Add tooltip styles globally
        if (!document.getElementById('global-tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'global-tooltip-styles';
            style.textContent = `
                .tooltip {
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

                .tooltip p {
                    margin: 4px 0;
                }

                .tooltip .tooltip-khazdul {
                    font-family: 'Noto Sans Runic', serif;
                    font-weight: 700;
                    color: #9b59b6;
                    font-size: 1.2em;
                }

                .tooltip .tooltip-english {
                    font-style: italic;
                    color: white;
                    border-bottom: 1px solid #8a6d3b;
                    padding-bottom: 5px;
                }

                .tooltip .tooltip-explanation,
                .tooltip .tooltip-stats {
                    color: white;
                    font-size: 0.9em;
                }

                .tooltip .tooltip-stats {
                    margin-top: 8px;
                    color: #d4af37;
                    font-weight: 600;
                }

                .tooltip .tooltip-extra {
                    margin-top: 6px;
                    color: #c7c7c7;
                    font-size: 0.85em;
                }

                .tooltip .tooltip-divider {
                    margin: 10px 0;
                    border-bottom: 1px solid rgba(212, 175, 55, 0.35);
                }

                @keyframes cirthGlow {
                    0% {
                        text-shadow: 0 0 5px #9b59b6, 0 0 10px #9b59b6, 0 0 15px #9b59b6;
                        transform: scale(1);
                    }
                    100% {
                        text-shadow: 0 0 10px #9b59b6, 0 0 20px #9b59b6, 0 0 30px #9b59b6, 0 0 40px #9b59b6;
                        transform: scale(1.05);
                    }
                }

                .skill-tooltip-cirth {
                    display: block;
                    margin-top: 4px;
                    font-size: 1.1em;
                }
            `;
            document.head.appendChild(style);
            console.log('UI: Tooltip styles added to document head');
        } else {
            console.log('UI: Tooltip styles already present, skipping injection');
        }
    }

    initializeStats() {
        // Stats UI elements
        this.statsTabs = {
            stats: document.getElementById('statsTab'),
            achievements: document.getElementById('achievementsTab'),
            skills: document.getElementById('skillsTab')
        };

        this.statsElements = {
            attack: document.getElementById('statAttack'),
            defense: document.getElementById('statDefense'),
            health: document.getElementById('statHealth'),
            critChance: document.getElementById('statCritChance'),
            miningPower: document.getElementById('statMiningPower'),
            materialsMined: document.getElementById('statMaterialsMined'),
            autoMining: document.getElementById('statAutoMining'),
            level: document.getElementById('statLevel'),
            experience: document.getElementById('statExperience'),
            coins: document.getElementById('statCoins'),
            playtime: document.getElementById('statPlaytime'),
            equipPower: document.getElementById('statEquipPower'),
            equipValue: document.getElementById('statEquipValue'),
            itemsEquipped: document.getElementById('statItemsEquipped'),
            luck: document.getElementById('statLuck'),
            speed: document.getElementById('statSpeed'),
            statusEffects: document.getElementById('statStatusEffects'),
            skillPoints: document.getElementById('statSkillPoints'),
            currentSkillPoints: document.getElementById('currentSkillPoints')
        };

        // Tab functionality
        const tabButtons = this.elements.statsPanel?.querySelectorAll('.tab-btn');
        if (tabButtons) {
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchStatsTab(btn.dataset.tab);
                });
            });
        }

        // Achievement containers
        this.achievementContainers = {
            combat: document.getElementById('combatAchievements'),
            mining: document.getElementById('miningAchievements'),
            progression: document.getElementById('progressionAchievements'),
            special: document.getElementById('specialAchievements')
        };
    }

    switchStatsTab(tabName) {
        // Update tab buttons
        const tabButtons = this.elements.statsPanel?.querySelectorAll('.tab-btn');
        const tabContents = this.elements.statsPanel?.querySelectorAll('.tab-content');

        if (tabButtons && tabContents) {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === tabName) {
                    btn.classList.add('active');
                }
            });

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName + 'Tab') {
                    content.classList.add('active');
                }
            });
        }
    }

    updateStats(player) {
        if (!player) return;

        // Update player stats - show current stats with equipment bonuses
        if (this.statsElements.attack) {
            this.statsElements.attack.textContent = Math.floor(player.stats.attack || 0);
        }
        if (this.statsElements.defense) {
            this.statsElements.defense.textContent = Math.floor(player.stats.defense || 0);
        }
        if (this.statsElements.health) {
            this.statsElements.health.textContent = `${player.health}/${player.maxHealth}`;
        }
        if (this.statsElements.critChance) {
            this.statsElements.critChance.textContent = `${Math.floor((player.stats.luck || 0) * 0.1)}%`;
        }
        if (this.statsElements.miningPower) {
            this.statsElements.miningPower.textContent = Math.floor(player.stats.miningPower || 0);
        }
        if (this.statsElements.materialsMined) {
            this.statsElements.materialsMined.textContent = player.materialsMined || 0;
        }
        if (this.statsElements.autoMining) {
            this.statsElements.autoMining.textContent = player.autoMine || 'Disabled';
        }
        if (this.statsElements.level) {
            this.statsElements.level.textContent = player.level;
        }
        if (this.statsElements.experience) {
            this.statsElements.experience.textContent = `${player.experience}/${player.experienceToNext}`;
        }
        if (this.statsElements.coins) {
            this.statsElements.coins.textContent = Utils.formatNumber(player.coins);
        }
        if (this.statsElements.playtime) {
            const minutes = Math.floor(player.playtime / 60);
            const seconds = player.playtime % 60;
            this.statsElements.playtime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        if (this.statsElements.equipPower) {
            this.statsElements.equipPower.textContent = player.equipment?.getEquipmentPower() || 0;
        }
        if (this.statsElements.equipValue) {
            this.statsElements.equipValue.textContent = Utils.formatNumber(player.equipment?.getEquipmentValue() || 0);
        }
        if (this.statsElements.itemsEquipped) {
            const equipped = Object.values(player.equipment?.slots || {}).filter(item => item).length;
            this.statsElements.itemsEquipped.textContent = `${equipped}/6`;
        }
        if (this.statsElements.luck) {
            this.statsElements.luck.textContent = Math.floor(player.stats.luck || 0);
        }
        if (this.statsElements.speed) {
            this.statsElements.speed.textContent = `${player.stats.speed.toFixed(1)}x`;
        }
        if (this.statsElements.statusEffects) {
            const effects = Array.from(player.statusEffects.keys());
            this.statsElements.statusEffects.textContent = effects.length > 0 ? effects.join(', ') : 'None';
        }

        // Update skill points display
        if (this.statsElements.skillPoints) {
            this.statsElements.skillPoints.textContent = player.skillPoints || 0;
        }

        // Update current skill points display in skills tab
        const currentSkillPointsElement = document.getElementById('currentSkillPoints');
        if (currentSkillPointsElement) {
            currentSkillPointsElement.textContent = player.skillPoints || 0;
        }
    }

    updateAchievements(achievementSystem) {
        if (!achievementSystem) return;

        for (const [category, container] of Object.entries(this.achievementContainers)) {
            if (!container) continue;

            container.innerHTML = '';

            const achievements = achievementSystem.getAchievementsByCategory(category);
            achievements.forEach(achievement => {
                const achievementElement = this.createAchievementElement(achievement);
                container.appendChild(achievementElement);
            });
        }
    }

    createAchievementElement(achievement) {
        const element = document.createElement('div');
        element.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;

        const progress = achievement.progress || 0;
        const target = achievement.condition.value;
        const percentage = Math.min((progress / target) * 100, 100);

        element.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${!achievement.unlocked ? `
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="progress-text">${Math.floor(progress)}/${target}</span>
                    </div>
                ` : ''}
                ${achievement.unlocked ? `
                    <div class="achievement-reward">
                        <span class="reward-text">+${achievement.reward.experience} XP, +${achievement.reward.coins} coins</span>
                    </div>
                ` : ''}
            </div>
        `;

        return element;
    }

    showStats() {
        if (!this.elements.statsPanel) {
            console.warn('Stats panel not found, cannot show stats');
            return;
        }

        if (this.isStatsOpen) return;

        this.isStatsOpen = true;
        this.elements.statsPanel.classList.remove('hidden');

        // Set background image
        this.elements.statsPanel.style.backgroundImage = 'url(assets/images/ui/dialogs/dialog_bg.png)';
        this.elements.statsPanel.style.backgroundSize = 'cover';
        this.elements.statsPanel.style.fontFamily = 'Arial, sans-serif';
        this.elements.statsPanel.style.fontSize = '115%';

        // Play sound
        if (this.audioSystem && typeof this.audioSystem.playSound === 'function') {
            this.audioSystem.playSound('inventory_open');
        }

        this.elements.statsPanel.style.opacity = '0';
        this.elements.statsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';

        // Animate in
        setTimeout(() => {
            this.elements.statsPanel.style.transition = 'all 0.3s ease';
            this.elements.statsPanel.style.opacity = '1';
            this.elements.statsPanel.style.transform = 'translate(-50%, -50%) scale(1)';
            
            // Update achievements and skills data after animation starts
            if (this.game && this.game.achievementSystem) {
                this.updateAchievements(this.game.achievementSystem);
            }
        }, 10);
    }

    hideStats() {
        if (!this.elements.statsPanel) {
            console.warn('Stats panel not found, cannot hide stats');
            return;
        }

        this.isStatsOpen = false;
        this.elements.statsPanel.style.transition = 'all 0.3s ease';
        this.elements.statsPanel.style.opacity = '0';
        this.elements.statsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';

        setTimeout(() => {
            this.elements.statsPanel.classList.add('hidden');
        }, 300);
    }

    toggleStats() {
        if (this.isStatsOpen) {
            this.hideStats();
        } else {
            this.showStats();
            if (this.isInventoryOpen) {
                this.hideInventory();
            }
            if (this.isEquipmentOpen) {
                this.hideEquipment();
            }
        }
    }

    toggleSkills() {
        // Create SkillsUI if it doesn't exist and we have a game
        if (!this.skillsUI && this.game) {
            this.skillsUI = new SkillsUI(this.game);
        }

        // Update the game reference if it changed
        if (this.skillsUI && this.skillsUI.game !== this.game) {
            this.skillsUI.game = this.game;
        }

        if (!this.skillsUI) return;

        if (this.skillsUI.isVisible()) {
            this.skillsUI.hide();
        } else {
            this.skillsUI.show();
            if (this.isInventoryOpen) {
                this.hideInventory();
            }
            if (this.isEquipmentOpen) {
                this.hideEquipment();
            }
            if (this.isStatsOpen) {
                this.hideStats();
            }
        }
    }
    
    updateGameInfo(gameState) {
        // Update area name
        if (this.elements.areaName && gameState.area) {
            this.elements.areaName.textContent = gameState.area.name;
            if (this.elements.exitCount) {
                this.elements.exitCount.textContent = gameState.area.getExitCount();
            }
        }
        
        // Update player stats
        if (gameState.player) {
            if (this.elements.playerLevel) {
                this.elements.playerLevel.textContent = gameState.player.level;
            }
            if (this.elements.playerHealth) {
                this.elements.playerHealth.textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
                
                // Update health bar color based on percentage
                const healthPercentage = gameState.player.health / gameState.player.maxHealth;
                if (healthPercentage < 0.25) {
                    this.elements.playerHealth.style.color = COLORS.UI_WARNING;
                } else if (healthPercentage < 0.5) {
                    this.elements.playerHealth.style.color = COLORS.UI_HIGHLIGHT;
                } else {
                    this.elements.playerHealth.style.color = COLORS.UI_TEXT;
                }
            }
            if (this.elements.playerXP) {
                this.elements.playerXP.textContent = `${gameState.player.experience}/${gameState.player.experienceToNext}`;
            }
            if (this.elements.playerCoins) {
                this.elements.playerCoins.textContent = Utils.formatNumber(gameState.player.coins);
            }
        }
        
        // Update timer
        if (this.elements.timeRemaining && gameState.timeRemaining !== undefined) {
            this.elements.timeRemaining.textContent = Utils.formatTime(gameState.timeRemaining);
            
            // Show/hide timer based on game mode
            const timerElement = this.elements.timeRemaining.parentElement;
            if (timerElement) {
                if (gameState.gameMode === 'gauntlet') {
                    timerElement.classList.remove('hidden');
                    
                    // Add warning colors
                    if (gameState.timeRemaining < 10) {
                        this.elements.timeRemaining.style.color = COLORS.UI_WARNING;
                    } else if (gameState.timeRemaining < 60) {
                        this.elements.timeRemaining.style.color = COLORS.UI_HIGHLIGHT;
                    } else {
                        this.elements.timeRemaining.style.color = COLORS.UI_TEXT;
                    }
                } else {
                    timerElement.classList.add('hidden');
                }
            }
        }
    }
    
    updateInventory(inventory) {
        for (let i = 0; i < this.inventorySlots.length; i++) {
            const slot = this.inventorySlots[i];
            const item = inventory.getSlot(i);
            
            this.updateInventorySlot(slot, item, i);
        }
    }
    
    updateInventorySlot(slot, item, index) {
        if (!slot) return;
        
        slot.innerHTML = '';
        slot.classList.remove('has-item', 'selected');
        
        if (item) {
            slot.classList.add('has-item');
            
            // Try to use item sprite if available
            let sprite = null;
            if (this.game && this.game.itemSprites) {
                // For equipment items, check equipmentType first
                if (item.type === 'equipment' && item.equipmentType) {
                    sprite = this.game.itemSprites.get(item.equipmentType);
                }
                // For resources, they use CELL_TYPES textures, not item sprites
                // For consumables, fall back to item.id if no equipmentType
                else if (item.type !== 'resource') {
                    const spriteKey = item.equipmentType || item.id;
                    sprite = this.game.itemSprites.get(spriteKey);
                }
            }
            
            if (sprite) {
                // Item sprite
                const icon = document.createElement('img');
                icon.className = 'item-icon';
                icon.src = sprite.src;
                icon.alt = item.name || 'Item';
                slot.appendChild(icon);
            } else {
                // Fallback: Use CELL_TYPES texture for resources, or color background for others
                if (item.type === 'resource' && item.material && this.game && this.game.textures) {
                    const texture = this.game.textures.get(item.material);
                    if (texture) {
                        const icon = document.createElement('img');
                        icon.className = 'item-icon';
                        icon.src = texture.src;
                        icon.alt = item.name || 'Resource';
                        slot.appendChild(icon);
                    } else {
                        // Texture not found, use color
                        const icon = document.createElement('div');
                        icon.className = 'item-icon';
                        if (item.color) {
                            icon.style.backgroundColor = item.color;
                        }
                        slot.appendChild(icon);
                    }
                } else {
                    // Default fallback: color background
                    const icon = document.createElement('div');
                    icon.className = 'item-icon';
                    if (item.color) {
                        icon.style.backgroundColor = item.color;
                    }
                    slot.appendChild(icon);
                }
            }
            
            // Item count
            if (item.count > 1) {
                const count = document.createElement('span');
                count.className = 'item-count';
                count.textContent = item.count;
                slot.appendChild(count);
            }
            
            // Durability indicator
            if (item.durability !== undefined) {
                const durability = document.createElement('div');
                durability.className = 'durability-bar';
                const percentage = (item.durability / item.maxDurability) * 100;
                durability.style.setProperty('--durability-percent', percentage + '%');
                
                if (percentage < 25) {
                    durability.style.backgroundColor = COLORS.UI_WARNING;
                } else if (percentage < 50) {
                    durability.style.backgroundColor = COLORS.UI_HIGHLIGHT;
                } else {
                    durability.style.backgroundColor = COLORS.UI_SUCCESS;
                }
                
                slot.appendChild(durability);
            }
            
            // Add tooltip
            this.addTooltip(slot, this.createItemTooltip(item), item);
        }
        
        // Highlight selected slot
        // Note: We need to get the selected slot from the inventory object
        // For now, we'll assume the inventory object is available in the UI class
        // In a proper implementation, this should be passed as a parameter
        if (this.game && this.game.currentMode && this.game.currentMode.player && 
            this.game.currentMode.player.inventory) {
            if (index === this.game.currentMode.player.inventory.selectedSlot) {
                slot.classList.add('selected');
            }
        }
    }
    
    updateEquipment(equipment) {
        if (!equipment) {
            equipment = this.game?.player?.equipment;
        }

        if (!equipment) {
            return;
        }

        for (const [slotType, slotElement] of this.equipmentSlots) {
            if (this.debugEquipmentLogging) {
                console.log('UI: Processing equipment slot:', slotType, 'element:', slotElement);
                console.log('UI: Item in slot', slotType, ':', equipment.getSlot(slotType));
            }
            const item = equipment.getSlot(slotType);
            this.updateEquipmentSlot(slotElement, item, slotType);
        }
    }
    
    updateEquipmentSlot(slotElement, item, slotType) {
        if (!slotElement) return;
        
        slotElement.innerHTML = '';
        slotElement.classList.remove('has-item');
        
        const label = slotElement.querySelector('.slot-label');
        if (label) {
            slotElement.appendChild(label);
        }
        
        if (item) {
            slotElement.classList.add('has-item');
            
            // Try to use item sprite if available
            let sprite = null;
            if (this.game && this.game.itemSprites) {
                // For equipment items, check equipmentType first
                if (item.type === 'equipment' && item.equipmentType) {
                    sprite = this.game.itemSprites.get(item.equipmentType);
                }
                // For resources, they use CELL_TYPES textures, not item sprites
                // For consumables, fall back to item.id if no equipmentType
                else if (item.type !== 'resource') {
                    const spriteKey = item.equipmentType || item.id;
                    sprite = this.game.itemSprites.get(spriteKey);
                }
            }
            
            if (sprite) {
                // Item sprite
                const icon = document.createElement('img');
                icon.className = 'item-icon';
                icon.src = sprite.src;
                icon.alt = item.name || 'Equipment';
                slotElement.appendChild(icon);
            } else {
                // Fallback: Use CELL_TYPES texture for resources, or color background for others
                if (item.type === 'resource' && item.material && this.game && this.game.textures) {
                    const texture = this.game.textures.get(item.material);
                    if (texture) {
                        const icon = document.createElement('img');
                        icon.className = 'item-icon';
                        icon.src = texture.src;
                        icon.alt = item.name || 'Resource';
                        slotElement.appendChild(icon);
                    } else {
                        // Texture not found, use color
                        const icon = document.createElement('div');
                        icon.className = 'item-icon';
                        if (item.color) {
                            icon.style.backgroundColor = item.color;
                        }
                        slotElement.appendChild(icon);
                    }
                } else {
                    // Default fallback: color background
                    const icon = document.createElement('div');
                    icon.className = 'item-icon';
                    if (item.color) {
                        icon.style.backgroundColor = item.color;
                    }
                    slotElement.appendChild(icon);
                }
            }
            
            // Durability indicator
            if (item.durability !== undefined) {
                const durability = document.createElement('div');
                durability.className = 'durability-bar';
                const percentage = (item.durability / item.maxDurability) * 100;
                durability.style.setProperty('--durability-percent', percentage + '%');
                
                if (percentage < 25) {
                    durability.style.backgroundColor = COLORS.UI_WARNING;
                } else if (percentage < 50) {
                    durability.style.backgroundColor = COLORS.UI_HIGHLIGHT;
                } else {
                    durability.style.backgroundColor = COLORS.UI_SUCCESS;
                }
                
                slotElement.appendChild(durability);
            }
            
            // Add tooltip
            this.addTooltip(slotElement, this.createItemTooltip(item), item);
        } else {
            // If no item, remove tooltip listeners and hide any active tooltips
            this.removeTooltipListeners(slotElement);
            this.hideTooltip();
        }
    }
    
    showInventory() {
        if (!this.elements.inventoryPanel) {
            console.warn('Inventory panel not found, cannot show inventory');
            return;
        }
        
        if (this.isInventoryOpen) return;
        
        this.isInventoryOpen = true;
        this.elements.inventoryPanel.classList.remove('hidden');
        
        // Set background image
        this.elements.inventoryPanel.style.backgroundImage = 'url(assets/images/ui/dialogs/dialog_bg.png)';
        this.elements.inventoryPanel.style.backgroundSize = 'cover';
        this.elements.inventoryPanel.style.minWidth = '600px';
        
        // Play sound
        if (this.audioSystem && typeof this.audioSystem.playSound === 'function') {
            this.audioSystem.playSound('inventory_open');
        }
        
        this.elements.inventoryPanel.style.opacity = '0';
        this.elements.inventoryPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Animate in
        setTimeout(() => {
            this.elements.inventoryPanel.style.transition = 'all 0.3s ease';
            this.elements.inventoryPanel.style.opacity = '1';
            this.elements.inventoryPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideInventory() {
        if (!this.elements.inventoryPanel) {
            console.warn('Inventory panel not found, cannot hide inventory');
            return;
        }

        this.isInventoryOpen = false;
        this.elements.inventoryPanel.style.transition = 'all 0.3s ease';
        this.elements.inventoryPanel.style.opacity = '0';
        this.elements.inventoryPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Clear selection
        this.selectedInventorySlot = -1;
        this.updateInventoryButtonStates();
        
        setTimeout(() => {
            this.elements.inventoryPanel.classList.add('hidden');
        }, 300);
    }
    
    showEquipment() {
        console.log('UI: showEquipment called');
        if (!this.elements.equipmentPanel) {
            console.warn('Equipment panel not found, cannot show equipment');
            return;
        }

        this.isEquipmentOpen = true;
        this.elements.equipmentPanel.classList.remove('hidden');
        this.elements.equipmentPanel.style.opacity = '0';
        this.elements.equipmentPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';

        // Update equipment display
        if (this.game && this.game.currentMode && this.game.currentMode.player) {
            console.log('UI: Updating equipment display for player:', this.game.currentMode.player);
            this.updateEquipment(this.game.currentMode.player.equipment);
        } else {
            console.warn('UI: No game/player found to update equipment');
        }

        // Animate in
        setTimeout(() => {
            this.elements.equipmentPanel.style.transition = 'all 0.3s ease';
            this.elements.equipmentPanel.style.opacity = '1';
            this.elements.equipmentPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideEquipment() {
        if (!this.elements.equipmentPanel) {
            console.warn('Equipment panel not found, cannot hide equipment');
            return;
        }
        
        this.isEquipmentOpen = false;
        this.elements.equipmentPanel.style.transition = 'all 0.3s ease';
        this.elements.equipmentPanel.style.opacity = '0';
        this.elements.equipmentPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Clear selection
        this.selectedEquipmentSlot = null;
        this.updateEquipmentButtonStates();
        
        setTimeout(() => {
            this.elements.equipmentPanel.classList.add('hidden');
        }, 300);
    }
    
    toggleInventory() {
        if (this.isInventoryOpen) {
            this.hideInventory();
        } else {
            this.showInventory();
            if (this.isEquipmentOpen) {
                this.hideEquipment();
            }
        }
    }
    
    toggleEquipment() {
        if (this.isEquipmentOpen) {
            this.hideEquipment();
        } else {
            this.showEquipment();
            if (this.isInventoryOpen) {
                this.hideInventory();
            }
        }
    }
    
    showDialog(title, message, options = [], callback = null, autoHide = true) {
        if (!this.elements.dialogContainer) {
            console.warn('Dialog container not found, cannot show dialog');
            return;
        }
        
        this.currentDialog = { title, message, options, callback };
        
        const dialogTitle = this.elements.dialogContainer.querySelector('#dialogTitle');
        const dialogMessage = this.elements.dialogContainer.querySelector('#dialogMessage');
        const dialogOptions = this.elements.dialogContainer.querySelector('#dialogOptions');
        
        if (dialogTitle) dialogTitle.textContent = title;
        if (dialogMessage) dialogMessage.innerHTML = message;
        if (dialogOptions) dialogOptions.innerHTML = '';
        
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.className = 'dialog-option';
            
            if (option.primary) {
                button.classList.add('primary');
            }
            
            if (option.danger) {
                button.classList.add('danger');
            }
            
            button.addEventListener('click', () => {
                if (callback) {
                    callback(option.value);
                }
                if (autoHide) {
                    this.hideDialog(); // Only auto-hide if requested
                }
            });
            
            dialogOptions.appendChild(button);
        });
        
        this.elements.dialogContainer.classList.remove('hidden');
        this.elements.dialogContainer.style.opacity = '0';
        
        // Animate in
        setTimeout(() => {
            this.elements.dialogContainer.style.transition = 'opacity 0.3s ease';
            this.elements.dialogContainer.style.opacity = '1';
        }, 10);
    }
    
    hideDialog() {
        this.elements.dialogContainer.style.transition = 'opacity 0.3s ease';
        this.elements.dialogContainer.style.opacity = '0';
        
        setTimeout(() => {
            this.elements.dialogContainer.classList.add('hidden');
            this.currentDialog = null;
        }, 300);
    }
    
    showStoryDialog(title, message, choices, callback) {
        // Convert story choices to dialog options
        const options = choices.map((choice, index) => ({
            text: choice.text,
            value: index,
            primary: index === 0 // Make first choice primary
        }));

        this.showDialog(title, message, options, (choiceIndex) => {
            if (callback) callback(choiceIndex); // Show next dialog or end
        }, false); // Don't auto-hide
    }

    hideStoryDialog() {
        if (typeof this.hideDialog === 'function') {
            this.hideDialog();
        }
    }
    
    
    loadOptions() {
        try {
            const stored = localStorage.getItem('minequest_options');
            if (stored) {
                this.gameOptions = JSON.parse(stored);
            } else {
                this.gameOptions = {
                    fogOfWar: true,
                    showGrid: false,
                    musicVolume: 50,
                    sfxVolume: 50,
                    showFPS: false,
                    showCoords: false,
                    zoomEnabled: false
                };
            }
        } catch (e) {
            console.error('Failed to load options:', e);
            this.gameOptions = {
                fogOfWar: true,
                showGrid: false,
                musicVolume: 50,
                sfxVolume: 50,
                showFPS: false,
                showCoords: false,
                zoomEnabled: false
            };
        }
    }
    
    showConfirmDialog(title, message, onConfirm) {
        this.showDialog(
            title,
            message,
            [
                { text: 'Yes', value: 'yes', danger: true },
                { text: 'No', value: 'no', primary: true }
            ],
            (value) => {
                this.hideDialog();
                if (value === 'yes' && onConfirm) {
                    onConfirm();
                }
            },
            false // Don't auto-hide, let callback handle it
        );
    }
    
    showContextMenu(x, y, items) {
        if (!this.elements.contextMenu) {
            console.warn('Context menu not found, cannot show context menu');
            return;
        }
        
        this.hideContextMenu();
        
        const menuContent = this.elements.contextMenu.querySelector('.context-menu-content');
        if (!menuContent) {
            console.warn('Context menu content not found, cannot show context menu');
            return;
        }
        
        menuContent.innerHTML = '';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.text;
            menuItem.dataset.action = item.action;
            menuItem.dataset.data = JSON.stringify(item.data || {});
            
            if (item.danger) {
                menuItem.classList.add('danger');
            }
            
            if (item.disabled) {
                menuItem.classList.add('disabled');
            }
            
            menuContent.appendChild(menuItem);
        });
        
        // Position menu
        this.elements.contextMenu.style.left = x + 'px';
        this.elements.contextMenu.style.top = y + 'px';
        this.elements.contextMenu.classList.remove('hidden');
        
        // Adjust position if menu goes off screen
        const rect = this.elements.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.elements.contextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.elements.contextMenu.style.top = (y - rect.height) + 'px';
        }
    }
    
    hideContextMenu() {
        this.elements.contextMenu.classList.add('hidden');
        this.currentContextMenu = null;
    }
    
    handleContextMenuAction(action, data) {
        this.triggerEvent('contextMenuAction', { action, data });
    }
    
    showLoadingScreen(message = 'Loading...') {
        if (!this.elements.loadingScreen) {
            console.warn('Loading screen not found, cannot show loading screen');
            return;
        }
        
        const loadingContent = this.elements.loadingScreen.querySelector('.loading-content p');
        if (loadingContent) {
            loadingContent.textContent = message;
        }
        
        this.elements.loadingScreen.classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hidden');
    }
    
    adjustNotificationPositions() {
        // Adjust positions of remaining notifications
        this.activeNotifications.forEach((notification, index) => {
            const newTop = 80 + (index * 60);
            if (notification.element && notification.element.style.top !== newTop + 'px') {
                notification.element.style.transition = 'top 0.3s ease';
                notification.element.style.top = newTop + 'px';
                notification.top = newTop;
            }
        });
    }
    
    addTooltip(element, content, item = null) {
        // Remove any existing tooltip listeners first
        this.removeTooltipListeners(element);

        const mouseenterHandler = (e) => {
            this.showTooltip(e.target, content, item);
        };

        const mouseleaveHandler = () => {
            this.hideTooltip();
        };

        element.addEventListener('mouseenter', mouseenterHandler);
        element.addEventListener('mouseleave', mouseleaveHandler);

        // Store the listeners for later removal
        element._tooltipListeners = { mouseenterHandler, mouseleaveHandler };
    }
    
    removeTooltipListeners(element) {
        if (element._tooltipListeners) {
            const { mouseenterHandler, mouseleaveHandler } = element._tooltipListeners;
            element.removeEventListener('mouseenter', mouseenterHandler);
            element.removeEventListener('mouseleave', mouseleaveHandler);
            delete element._tooltipListeners;
        }
    }
    
    showTooltip(element, content, item = null) {
        if (!this.tooltipElement) {
            console.error('UI: Tooltip element not initialized, cannot show tooltip');
            return;
        }

        if (!element) {
            console.warn('UI: showTooltip called without a valid element');
            return;
        }

        // Set content first to measure tooltip size
        this.tooltipElement.innerHTML = content;
        this.tooltipElement.style.display = 'block';
        this.tooltipElement.style.visibility = 'visible';
        this.tooltipElement.style.opacity = '1';
        this.tooltipElement.classList.remove('hidden');

        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        // Default position above the element, centered horizontally
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 10;

        // If the tooltip would go off the top of the screen, place it below the element
        if (top < 10) {
            top = rect.bottom + 10;
        }

        // Prevent going off the left edge
        if (left < 10) {
            left = 10;
        }

        // Prevent going off the right edge
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.zIndex = '10001';

        if (item) {
            const khuzdulElement = this.tooltipElement.querySelector('.tooltip-khazdul');
            if (khuzdulElement) {
                this.startKhuzdulAnimation(item, khuzdulElement);
            } else {
                console.warn('UI: Tooltip khuzdul element not found for item:', item.name);
            }
        }
    }
    
    hideTooltip() {
        this.stopKhuzdulAnimation();

        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
            this.tooltipElement.style.visibility = 'hidden';
            this.tooltipElement.style.opacity = '0';
            this.tooltipElement.classList.add('hidden');
        }
    }

    createFlyingToken(content = '💰') {
        const token = document.createElement('div');
        token.className = 'flying-item';
        token.textContent = content;
        token.style.opacity = '1';
        token.style.transform = 'scale(1)';
        token.style.left = '-9999px';
        token.style.top = '-9999px';
        document.body.appendChild(token);
        return token;
    }

    animateFlyingToken(token, fromRect, toRect) {
        if (!token || !fromRect || !toRect) {
            return;
        }

        token.style.left = `${fromRect.left + fromRect.width / 2}px`;
        token.style.top = `${fromRect.top + fromRect.height / 2}px`;

        requestAnimationFrame(() => {
            token.style.transform = 'scale(0.85)';
            token.style.left = `${toRect.left + toRect.width / 2}px`;
            token.style.top = `${toRect.top + toRect.height / 2}px`;
            token.style.opacity = '0';
        });

        setTimeout(() => {
            if (token && token.parentNode) {
                token.parentNode.removeChild(token);
            }
        }, 600);
    }

    pulseCoinDisplay(element) {
        if (!element) {
            return;
        }

        element.classList.add('coin-animation');
        setTimeout(() => {
            element.classList.remove('coin-animation');
        }, 500);
    }
    
    handleEscape() {
        // Prevent rapid ESC key presses from causing issues (within 200ms)
        const now = Date.now();
        if (now - this.lastEscapeTime < 200) {
            console.log('ESC cooldown active, ignoring');
            return;
        }
        
        if (this.currentDialog) {
            if (typeof this.hideDialog === 'function') {
                this.hideDialog();
            }
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.currentContextMenu) {
            this.hideContextMenu();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.isInventoryOpen) {
            this.hideInventory();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.isEquipmentOpen) {
            this.hideEquipment();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.isStatsOpen) {
            this.hideStats();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.isAchievementsOpen) {
            this.hideAchievements();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.isSkillsOpen) {
            this.hideSkills();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.skillsUI && this.skillsUI.isVisible()) {
            this.skillsUI.hide();
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (document.getElementById('crafting-container') && !document.getElementById('crafting-container').classList.contains('hidden')) {
            // Close crafting dialog properly by calling its hide method
            if (this.game?.craftingUI?.hide) {
                this.game.craftingUI.hide();
            } else {
                // Fallback: just hide the container
                const craftingContainer = document.getElementById('crafting-container');
                if (craftingContainer) {
                    craftingContainer.classList.add('hidden');
                    // Trigger game resume if needed
                    if (this.game?.resume && this.game.isPaused) {
                        this.game.resume();
                    }
                }
            }
            this.lastEscapeTime = now; // Reset cooldown after action
        } else if (this.mineMenuUI.isOpen()) {
            this.mineMenuUI.hide();
            this.resumeGame();
            this.lastEscapeTime = now;
        } else {
            this.showMineMenu();
            this.lastEscapeTime = now; // Reset cooldown after action
        }
    }
    
    handleInventoryClick(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        this.triggerEvent('inventoryClick', { index, slot: e.currentTarget });
    }
    
    handleInventoryRightClick(e) {
        e.preventDefault();
        const index = parseInt(e.currentTarget.dataset.index);
        this.triggerEvent('inventoryRightClick', { 
            index, 
            slot: e.currentTarget,
            x: e.clientX,
            y: e.clientY
        });
    }
    
    handleEquipmentClick(slotType) {
        this.triggerEvent('equipmentClick', { slotType });
    }
    
    handleEquipmentRightClick(slotType, e) {
        e.preventDefault();
        this.triggerEvent('equipmentRightClick', { 
            slotType,
            x: e.clientX,
            y: e.clientY
        });
    }
    
    handleDragStart(e) {
        const index = parseInt(e.target.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        e.target.style.opacity = '0.5';
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDrop(e) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(e.currentTarget.dataset.index);
        
        this.triggerEvent('inventoryMove', { fromIndex, toIndex });
    }
    
    handleDragEnd(e) {
        e.target.style.opacity = '1';
    }
    
    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
    
    setEventListeners(listeners) {
        // Set up custom event listeners
        for (const [event, callback] of Object.entries(listeners)) {
            document.addEventListener(event, callback);
        }
    }
    
    updateHealthBar(current, max) {
        const percentage = (current / max) * 100;
        // Update health bar visual if it exists
        this.triggerEvent('healthUpdate', { current, max, percentage });
    }
    
    updateExperienceBar(current, max) {
        const percentage = (current / max) * 100;
        // Update experience bar visual if it exists
        this.triggerEvent('experienceUpdate', { current, max, percentage });
    }
    
    showDamageNumber(x, y, damage, type = 'damage') {
        if (!this.elements.gameCanvas) {
            console.warn('Game canvas not found, cannot show damage number');
            return;
        }
        
        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${type}`;
        damageElement.textContent = damage > 0 ? `-${damage}` : `+${Math.abs(damage)}`;
        
        // Position relative to canvas
        const canvasRect = this.elements.gameCanvas.getBoundingClientRect();
        damageElement.style.position = 'fixed';
        damageElement.style.left = (canvasRect.left + x * 64 + 32) + 'px';
        damageElement.style.top = (canvasRect.top + y * 64) + 'px';
        damageElement.style.zIndex = '1000';
        damageElement.style.fontWeight = 'bold';
        damageElement.style.fontSize = '24px';
        damageElement.style.pointerEvents = 'none';
        damageElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';
        damageElement.style.transition = 'all 1s ease-out';
        
        if (type === 'damage') {
            damageElement.style.color = COLORS.DAMAGE_PHYSICAL;
        } else if (type === 'heal') {
            damageElement.style.color = COLORS.DAMAGE_HEAL;
        } else if (type === 'experience') {
            damageElement.style.color = COLORS.DAMAGE_EXPERIENCE;
        }
        
        document.body.appendChild(damageElement);
        
        // Animate
        setTimeout(() => {
            damageElement.style.transform = 'translateY(-60px) scale(1.2)';
            damageElement.style.opacity = '0';
        }, 10);
        
        // Remove
        setTimeout(() => {
            if (document.body.contains(damageElement)) {
                document.body.removeChild(damageElement);
            }
        }, 1000);
    }
    
    showMiningProgress(x, y, progress) {
        // Show mining progress bar at position
        this.triggerEvent('miningProgress', { x, y, progress });
    }
    
    hideMiningProgress() {
        this.triggerEvent('miningProgress', { x: -1, y: -1, progress: 0 });
    }
    
    resizeCanvas() {
        if (!this.elements.gameCanvas) {
            console.warn('Game canvas not found, cannot resize canvas');
            return;
        }
        
        // Handle canvas resizing for different screen sizes
        const container = this.elements.gameCanvas.parentElement;
        if (!container) {
            console.warn('Canvas container not found, cannot resize canvas');
            return;
        }
        
        const maxSize = Math.min(container.clientWidth, container.clientHeight, window.innerWidth - 40, window.innerHeight - 200);
        const size = Math.floor(maxSize / 64) * 64; // Ensure it's a multiple of 64
        
        if (size > 0) {
            this.elements.gameCanvas.width = size;
            this.elements.gameCanvas.height = size;
            
            this.triggerEvent('canvasResized', { width: size, height: size });
        }
    }
    
    handleResize() {
        this.resizeCanvas();
    }
    
    // Initialize resize handler
    initializeResizeHandler() {
        window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
    }

    showMineMenu() {
        this.pauseGame();
        this.mineMenuUI.show();
    }

    toggleMineMenu() {
        if (this.mineMenuUI.isOpen()) {
            this.mineMenuUI.hide();
            this.resumeGame();
        } else {
            this.showMineMenu();
        }
    }

    handleSaveRequest() {
        if (!this.saveLoadUI?.showSaveDialog) {
            console.warn('UI: saveLoadUI is not ready to handle save dialog');
            return;
        }
        this.mineMenuUI.hide();
        // Add a small delay to ensure mine menu is hidden before showing save dialog
        setTimeout(() => {
            this.saveLoadUI.showSaveDialog();
        }, 50);
    }

    handleLoadRequest() {
        if (!this.saveLoadUI?.showLoadDialog) {
            console.warn('UI: saveLoadUI is not ready to handle load dialog');
            return;
        }
        this.mineMenuUI.hide();
        // Add a small delay to ensure mine menu is hidden before showing load dialog
        setTimeout(() => {
            this.saveLoadUI.showLoadDialog();
        }, 50);
    }

    handleOptionsRequest() {
        this.mineMenuUI.hide();
        // Add a small delay to ensure mine menu is hidden before showing options dialog
        setTimeout(() => {
            const options = OptionsUI.loadOptions();
            const markup = OptionsUI.buildOptionsMarkup(options, { prefix: 'game', useInlineStyles: false });
            this.showDialog(
                'Options',
                markup,
                [
                    { text: 'Apply', value: 'apply', primary: true },
                    { text: 'Cancel', value: 'cancel' }
                ],
                (value) => {
                    if (value === 'apply') {
                        const updated = OptionsUI.readOptions('game');
                        const saved = OptionsUI.saveOptions(updated);
                        OptionsUI.applyToGame(this.game, saved);
                        this.triggerEvent('optionsChanged', saved);
                        this.showNotification('Options applied successfully!', 'success');
                    }
                    this.hideDialog();
                },
                false
            );
            setTimeout(() => OptionsUI.bindLiveUpdates('game'), 0);
        }, 50);
    }

    handleExitQuest() {
        this.mineMenuUI.hide();
        this.showConfirmDialog(
            'Exit Quest',
            'Are you sure you want to exit to the start menu? Your current progress will not be saved.',
            () => {
                this.triggerEvent('game:returnedToStartPage');
            }
        );
    }

    setSaveLoadUI(saveLoadUI) {
        this.saveLoadUI = saveLoadUI;
        this.mineMenuUI.setSaveLoadUI(saveLoadUI);
    }

    setGame(game) {
        this.game = game;
        this.mineMenuUI.setGame(game);
    }

    pauseGame() {
        if (this.game?.pause && !this.game.isPaused) {
            this.game.pause();
        }
    }

    resumeGame() {
        if (this.game?.resume && this.game.isPaused) {
            this.game.resume();
        }
    }

    showConfirmDialog(title, message, callback) {
        this.showDialog(
            title,
            message,
            [
                { text: 'Yes', value: 'yes', primary: true },
                { text: 'No', value: 'no' }
            ],
            (value) => {
                if (value === 'yes' && callback) {
                    callback();
                }
            }
        );
    }

    getSaveSlots() {
        const saves = [];
        for (let i = 0; i < 3; i++) {
            const saveData = localStorage.getItem(`minequest_save_${i}`);
            if (saveData) {
                try {
                    saves[i] = JSON.parse(saveData);
                } catch (e) {
                    saves[i] = null;
                }
            } else {
                saves[i] = null;
            }
        }
    }

    // Event handlers for inventory interactions
    handleInventoryClick(e) {
        console.log('UI: Inventory slot clicked:', e.currentTarget.dataset.index);
        const slotIndex = parseInt(e.currentTarget.dataset.index);
        
        // Select the clicked inventory slot
        this.selectInventorySlot(slotIndex);
    }

    handleInventoryRightClick(e) {
        e.preventDefault();
        console.log('UI: Inventory slot right-clicked:', e.currentTarget.dataset.index);
        // TODO: Implement inventory slot right-click logic (context menu)
        this.triggerEvent('inventoryRightClick', { slotIndex: parseInt(e.currentTarget.dataset.index) });
    }

    handleDragStart(e) {
        console.log('UI: Drag started:', e.currentTarget.dataset.index);
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.index);
        e.currentTarget.classList.add('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(e.currentTarget.dataset.index);

        console.log('UI: Drop from', fromIndex, 'to', toIndex);
        e.currentTarget.classList.remove('drag-over');

        if (fromIndex !== toIndex) {
            this.triggerEvent('inventoryMove', { fromIndex, toIndex });
        }
    }

    handleDragEnd(e) {
        console.log('UI: Drag ended:', e.currentTarget.dataset.index);
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.classList.remove('drag-over');
        });
    }

    handleEquipmentClick(slotType) {
        console.log('UI: Equipment slot clicked:', slotType);
        
        // Select the clicked equipment slot
        this.selectEquipmentSlot(slotType);
    }

    handleEquipmentRightClick(slotType, e) {
        console.log('UI: Equipment slot right-clicked:', slotType);
        // TODO: Implement equipment slot right-click logic
        this.triggerEvent('equipmentRightClick', { slotType });
    }

    // Selection methods
    selectInventorySlot(slotIndex) {
        console.log('UI: Selecting inventory slot:', slotIndex);
        
        // Clear previous selection
        if (this.selectedInventorySlot !== -1) {
            const prevSlot = this.inventorySlots[this.selectedInventorySlot];
            if (prevSlot) {
                prevSlot.classList.remove('selected');
            }
        }
        
        // Set new selection
        this.selectedInventorySlot = slotIndex;
        
        // Update visual selection
        const slot = this.inventorySlots[slotIndex];
        if (slot) {
            slot.classList.add('selected');
        }
        
        // Update button states
        this.updateInventoryButtonStates();
    }
    
    selectEquipmentSlot(slotType) {
        console.log('UI: Selecting equipment slot:', slotType);
        
        // Clear previous selection
        if (this.selectedEquipmentSlot) {
            const prevSlot = this.equipmentSlots.get(this.selectedEquipmentSlot);
            if (prevSlot) {
                prevSlot.classList.remove('selected');
            }
        }
        
        // Set new selection
        this.selectedEquipmentSlot = slotType;
        
        // Update visual selection
        const slot = this.equipmentSlots.get(slotType);
        if (slot) {
            slot.classList.add('selected');
        }
        
        // Update button states
        this.updateEquipmentButtonStates();
    }
    
    updateInventoryButtonStates() {
        const dropBtn = document.getElementById('inventoryDropBtn');
        const equipBtn = document.getElementById('inventoryEquipBtn');
        const useBtn = document.getElementById('inventoryUseBtn');
        
        if (!this.game || !this.game.currentMode || !this.game.currentMode.player) return;
        
        const item = this.game.currentMode.player.inventory.getSlot(this.selectedInventorySlot);
        
        if (dropBtn) dropBtn.disabled = !item;
        if (equipBtn) equipBtn.disabled = !item || item.type !== 'equipment';
        if (useBtn) useBtn.disabled = !item || item.type !== 'consumable';
    }
    
    updateEquipmentButtonStates() {
        const unequipBtn = document.getElementById('equipmentUnequipBtn');
        
        if (!this.game || !this.game.currentMode || !this.game.currentMode.player) return;
        
        const item = this.game.currentMode.player.equipment.getSlot(this.selectedEquipmentSlot);
        
        if (unequipBtn) unequipBtn.disabled = !item;
    }

    // Button action handlers
    handleInventoryDrop() {
        console.log('UI: Handle inventory drop for slot:', this.selectedInventorySlot);
        if (this.selectedInventorySlot === -1) return;
        
        this.triggerEvent('inventoryDrop', { slotIndex: this.selectedInventorySlot });
    }
    
    handleInventoryEquip() {
        console.log('UI: Handle inventory equip for slot:', this.selectedInventorySlot);
        if (this.selectedInventorySlot === -1) return;
        
        this.triggerEvent('inventoryEquip', { slotIndex: this.selectedInventorySlot });
    }
    
    handleInventoryUse() {
        console.log('UI: Handle inventory use for slot:', this.selectedInventorySlot);
        if (this.selectedInventorySlot === -1) return;
        
        this.triggerEvent('inventoryUse', { slotIndex: this.selectedInventorySlot });
    }
    
    handleEquipmentUnequip() {
        console.log('UI: Handle equipment unequip for slot:', this.selectedEquipmentSlot);
        if (!this.selectedEquipmentSlot) return;
        
        this.triggerEvent('equipmentUnequip', { slotType: this.selectedEquipmentSlot });
    }

    triggerEvent(eventType, detail) {
        const event = new CustomEvent(eventType, { detail });
        document.dispatchEvent(event);
    }

    handleContextMenuAction(action, data) {
        console.log('UI: Context menu action:', action, data);
        this.triggerEvent('contextMenuAction', { action, data });
    }

    hideContextMenu() {
        if (this.currentContextMenu) {
            this.currentContextMenu.classList.add('hidden');
            this.currentContextMenu = null;
        }
    }

    showContextMenu(x, y, options) {
        if (!this.elements.contextMenu) {
            console.warn('Context menu not found');
            return;
        }

        this.hideContextMenu();

        const menu = this.elements.contextMenu;
        const content = menu.querySelector('.context-menu-content');
        if (!content) {
            console.warn('Context menu content not found');
            return;
        }

        content.innerHTML = '';
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option.text;
            item.dataset.action = option.action;
            item.dataset.data = JSON.stringify(option.data || {});
            
            // Add click event listener
            item.addEventListener('click', () => {
                this.handleContextMenuAction(option.action, option.data);
                this.hideContextMenu();
            });
            
            content.appendChild(item);
        });

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        this.currentContextMenu = menu;
    }

    createItemTooltip(item) {
        if (!item) return '';

        const lore = this.getCraftingLoreForItem(item);
        const englishName = item.name || lore?.englishName || 'Unknown Item';
        const hasCirth = Boolean(lore?.cirthName);
        const cirthText = hasCirth ? lore.cirthName : this.getRandomCirthString(Math.max(englishName.length, 6));

        // Store the animation target so the Khuzdul animation reveals the crafted runes when available
        if (hasCirth) {
            item.__tooltipAnimationText = lore.cirthName;
        } else {
            delete item.__tooltipAnimationText;
        }

        let tooltip = `<div class="tooltip-content">
            <p class="tooltip-khazdul">${cirthText}</p>`;

        if (lore?.khuzdulName && lore.khuzdulName !== englishName) {
            tooltip += `<div class="tooltip-extra">${lore.khuzdulName}</div>`;
        }

        if (englishName) {
            tooltip += `<div class="tooltip-extra">${englishName}</div>`;
        }

        if (lore?.description) {
            tooltip += `<p class="tooltip-explanation">${lore.description}</p>`;
        }

        if (lore?.stats) {
            tooltip += `<p class="tooltip-stats">${lore.stats}</p>`;
        }

        const detailedStats = this.buildItemStatDetails(item);
        if (detailedStats) {
            tooltip += detailedStats;
        }

        tooltip += `</div>`;
        return tooltip;
    }

    getCraftingLoreForItem(item) {
        if (!item || !this.game?.craftingSystem) {
            return null;
        }

        const recipes = this.game.craftingSystem.recipes;
        if (!Array.isArray(recipes)) {
            return null;
        }

        const candidates = new Set();
        if (item.craftingRecipeId) candidates.add(item.craftingRecipeId);
        if (item.equipmentType) candidates.add(item.equipmentType);
        if (item.result) candidates.add(item.result);
        if (item.id) candidates.add(item.id);
        if (item.name) candidates.add(item.name);

        let matchedRecipe = null;
        for (const candidate of candidates) {
            if (!candidate) continue;
            matchedRecipe = recipes.find(recipe =>
                recipe.result === candidate ||
                recipe.id === candidate ||
                recipe.name === candidate);
            if (matchedRecipe) break;
        }

        if (!matchedRecipe && item.name) {
            matchedRecipe = recipes.find(recipe => recipe.name === item.name);
        }

        if (!matchedRecipe) {
            return null;
        }

        return {
            englishName: matchedRecipe.name,
            khuzdulName: matchedRecipe.khuzdulName,
            cirthName: matchedRecipe.cirthName,
            description: matchedRecipe.description,
            stats: matchedRecipe.stats
        };
    }

    buildItemStatDetails(item) {
        if (!item) return '';

        const metaLines = [];
        const statLines = [];

        if (item.type) {
            metaLines.push(`Type: ${Utils.capitalize(item.type)}`);
        }

        if (item.slot) {
            const slotName = Utils.capitalize(item.slot.toLowerCase());
            metaLines.push(`Slot: ${slotName}`);
        }

        if (item.rarity) {
            metaLines.push(`Rarity: ${Utils.capitalize(item.rarity)}`);
        }

        if (item.count && item.count > 1) {
            metaLines.push(`Quantity: ${item.count}`);
        }

        if (typeof item.value === 'number') {
            metaLines.push(`Value: ${item.value} coins`);
        }

        if (item.durability !== undefined && item.maxDurability !== undefined) {
            const percentage = Math.round((item.durability / item.maxDurability) * 100);
            statLines.push(`Durability: ${item.durability}/${item.maxDurability} (${Number.isFinite(percentage) ? percentage : 0}%)`);
        }

        if (item.stats && typeof item.stats === 'object') {
            for (const [stat, value] of Object.entries(item.stats)) {
                const statName = stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formattedValue = typeof value === 'number' && value > 0 ? `+${value}` : value;
                statLines.push(`${statName}: ${formattedValue}`);
            }
        }

        if (!metaLines.length && !statLines.length) {
            return '';
        }

        let sections = '';

        if (metaLines.length) {
            sections += '<div class="tooltip-divider"></div>';
            sections += metaLines.map(line => `<div class="tooltip-extra">${line}</div>`).join('');
        }

        if (statLines.length) {
            sections += '<div class="tooltip-divider"></div>';
            sections += statLines.map(line => `<div class="tooltip-stats">${line}</div>`).join('');
        }

        return sections;
    }

    // Cirth animation methods for enhanced tooltips
    getRandomCirthString(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.cirthAlphabet.charAt(Math.floor(Math.random() * this.cirthAlphabet.length));
        }
        return result;
    }

    startKhuzdulAnimation(item, element) {
        if (!item || !element) return;

        const originalLength = item.name.length;

        this.clearAnimations();

        element.textContent = this.getRandomCirthString(originalLength);
        element.style.fontFamily = "'Noto Sans Runic', serif";

        this.animationTimeout1 = setTimeout(() => {
            this.rollingInterval = setInterval(() => {
                element.textContent = this.getRandomCirthString(originalLength);
            }, 100);

            this.animationTimeout2 = setTimeout(() => {
                this.clearAnimations();
                element.textContent = item.name;
                element.style.fontFamily = "'Cinzel', serif";
            }, 2000);
        }, 1000);
    }

    stopKhuzdulAnimation() {
        this.clearAnimations();
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

    sortInventory() {
        console.log('UI: Sorting inventory');
        if (!this.game || !this.game.currentMode || !this.game.currentMode.player) return;
        
        const inventory = this.game.currentMode.player.inventory;
        if (!inventory) return;
        
        // Sort the inventory using the inventory's sortItems method
        inventory.sortItems();
        
        // Update the UI to reflect the sorted inventory
        this.updateInventory(inventory);
        
        // Clear selection
        this.selectedInventorySlot = -1;
        this.updateInventoryButtonStates();
        
        this.showNotification('Inventory sorted!', 'success');
    }

    updateInventory(inventory) {
        for (let i = 0; i < this.inventorySlots.length; i++) {
            const slot = this.inventorySlots[i];
            const item = inventory.getSlot(i);
            
            this.updateInventorySlot(slot, item, i);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Track active notifications for stacking
        if (!this.activeNotifications) {
            this.activeNotifications = [];
        }

        // Remove expired notifications from tracking
        const now = Date.now();
        this.activeNotifications = this.activeNotifications.filter(n => n.timestamp > now - 3000);

        // Calculate vertical position based on active notifications
        const activeCount = this.activeNotifications.length;
        const baseTop = 80;
        const spacing = 60;
        const top = baseTop + (activeCount * spacing);

        // Add to tracking
        this.activeNotifications.push({
            element: notification,
            timestamp: now,
            top: top
        });

        document.body.appendChild(notification);

        notification.style.position = 'fixed';
        notification.style.top = top + 'px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.zIndex = '9999';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '8px';
        notification.style.color = '#fff';
        notification.style.fontWeight = 'bold';
        notification.style.fontSize = '18px';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        notification.style.maxWidth = '400px';
        notification.style.wordWrap = 'break-word';
        notification.style.textAlign = 'center';

        switch (type) {
            case 'success':
                notification.style.backgroundColor = COLORS.UI_SUCCESS;
                notification.style.border = '2px solid #00cc00';
                break;
            case 'warning':
                notification.style.backgroundColor = COLORS.UI_WARNING;
                notification.style.border = '2px solid #cc4400';
                break;
            case 'error':
                notification.style.backgroundColor = COLORS.UI_ERROR;
                notification.style.border = '2px solid #cc0000';
                break;
            default:
                notification.style.backgroundColor = COLORS.UI_HIGHLIGHT;
                notification.style.border = '2px solid #3a9b96';
        }

        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                // Remove from tracking
                this.activeNotifications = this.activeNotifications.filter(n => n.element !== notification);
                // Adjust remaining notifications
                this.adjustNotificationPositions();
            }, 300);
        }, duration);
    }

    updateGameInfo(data) {
        if (!data.player) return;

        const player = data.player;
        const skillStats = player.getSkillStats();

        // Update basic stats
        this.setElementText('statLevel', player.level);
        this.setElementText('statExperience', `${player.experience}/${player.experienceToNext}`);
        this.setElementText('statHealth', `${player.health}/${player.maxHealth}`);
        this.setElementText('statCoins', player.coins);
        this.setElementText('statSkillPoints', player.skillSystem.getAvailableSkillPoints());

        // Update combat stats
        this.setElementText('statAttack', Math.floor(player.stats.attack));
        this.setElementText('statDefense', Math.floor(player.stats.defense));
        this.setElementText('statCritChance', `${Math.floor(player.stats.critChance)}%`);

        // Update skill stats
        this.setElementText('statRegenRate', `${skillStats.regenRate || 0} HP/s`);
        this.setElementText('statDamageReduction', `${skillStats.damageReduction || 0}%`);

        // Update mining stats
        this.setElementText('statMiningPower', Math.floor(player.stats.miningPower));
        this.setElementText('statMiningEfficiency', `${skillStats.miningEfficiency || 0}%`);
        this.setElementText('statMaterialsMined', player.statsTracker.materials_mined);
        this.setElementText('statAutoMining', player.autoMine ? 'Enabled' : 'Disabled');

        // Update equipment stats
        const equippedCount = Object.values(player.equipment.slots).filter(item => item).length;
        this.setElementText('statEquipPower', player.equipment.getTotalPower());
        this.setElementText('statEquipValue', player.equipment.getTotalValue());
        this.setElementText('statItemsEquipped', `${equippedCount}/6`);

        // Update special stats
        this.setElementText('statLuck', player.stats.luck);
        this.setElementText('statSpeed', `${player.stats.speed.toFixed(1)}x`);
        this.setElementText('statStatusEffects', player.statusEffects.size > 0 ? 
            Array.from(player.statusEffects.keys()).join(', ') : 'None');

        // Update playtime
        const playtimeMinutes = Math.floor(player.statsTracker.playtime / 60000);
        const playtimeSeconds = Math.floor((player.statsTracker.playtime % 60000) / 1000);
        this.setElementText('statPlaytime', `${playtimeMinutes}:${playtimeSeconds.toString().padStart(2, '0')}`);

        // Update game info bar
        this.setElementText('areaName', data.area?.name || 'Unknown');
        this.setElementText('exitCount', data.area?.exits?.length || 0);
        this.setElementText('playerLevel', player.level);
        this.setElementText('playerHealth', `${player.health}/${player.maxHealth}`);
        this.setElementText('playerXP', `${player.experience}/${player.experienceToNext}`);
        this.setElementText('playerCoins', player.coins);
    }

    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    showAchievements() {
        if (!this.elements.achievementsPanel) {
            console.warn('Achievements panel not found, cannot show achievements');
            return;
        }
        
        if (this.isAchievementsOpen) return;
        
        this.isAchievementsOpen = true;
        this.elements.achievementsPanel.classList.remove('hidden');
        this.elements.achievementsPanel.style.opacity = '0';
        this.elements.achievementsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Update achievements display
        if (this.game && this.game.player) {
            this.updateAchievements(this.game.player);
        }
        
        // Animate in
        setTimeout(() => {
            this.elements.achievementsPanel.style.transition = 'all 0.3s ease';
            this.elements.achievementsPanel.style.opacity = '1';
            this.elements.achievementsPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideAchievements() {
        if (!this.elements.achievementsPanel) {
            console.warn('Achievements panel not found, cannot hide achievements');
            return;
        }
        
        this.isAchievementsOpen = false;
        this.elements.achievementsPanel.style.transition = 'all 0.3s ease';
        this.elements.achievementsPanel.style.opacity = '0';
        this.elements.achievementsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        setTimeout(() => {
            this.elements.achievementsPanel.classList.add('hidden');
        }, 300);
    }

    updateAchievements(player) {
        // This populates the achievements based on player progress
        const categories = ['combat', 'mining', 'progression', 'equipment', 'special'];
        categories.forEach(category => {
            const container = document.getElementById(`${category}Achievements`);
            if (container) {
                container.innerHTML = '';
                
                // Get achievements for this category
                if (this.game && this.game.achievementSystem) {
                    const achievements = this.game.achievementSystem.getAchievementsByCategory(category);
                    
                    if (achievements.length === 0) {
                        container.innerHTML = '<div class="achievement-item locked"><span class="achievement-icon">🔒</span><span class="achievement-name">No achievements in this category yet</span></div>';
                    } else {
                        achievements.forEach(achievement => {
                            const achievementElement = this.createAchievementElement(achievement);
                            container.appendChild(achievementElement);
                        });
                    }
                } else {
                    container.innerHTML = '<div class="achievement-item locked"><span class="achievement-icon">🔒</span><span class="achievement-name">Achievement system loading...</span></div>';
                }
            }
        });
    }

    toggleAchievements() {
        if (this.isAchievementsOpen) {
            this.hideAchievements();
        } else {
            this.showAchievements();
            if (this.isStatsOpen) {
                this.hideStats();
            }
            if (this.isSkillsOpen) {
                this.hideSkills();
            }
        }
    }

    showSkills() {
        if (!this.elements.skillsPanel) {
            console.warn('Skills panel not found, cannot show skills');
            return;
        }
        
        if (this.isSkillsOpen) return;
        
        this.isSkillsOpen = true;
        this.elements.skillsPanel.classList.remove('hidden');
        this.elements.skillsPanel.style.opacity = '0';
        this.elements.skillsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Show SkillsUI
        if (this.game) {
            if (!this.skillsUI) {
                this.skillsUI = new SkillsUI(this.game);
            }
            this.skillsUI.show();
        }
        
        // Animate in
        setTimeout(() => {
            this.elements.skillsPanel.style.transition = 'all 0.3s ease';
            this.elements.skillsPanel.style.opacity = '1';
            this.elements.skillsPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideSkills() {
        if (!this.elements.skillsPanel) {
            console.warn('Skills panel not found, cannot hide skills');
            return;
        }
        
        this.isSkillsOpen = false;
        
        // Hide SkillsUI
        if (this.skillsUI) {
            this.skillsUI.hide();
        }
        
        this.elements.skillsPanel.style.transition = 'all 0.3s ease';
        this.elements.skillsPanel.style.opacity = '0';
        this.elements.skillsPanel.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        setTimeout(() => {
            this.elements.skillsPanel.classList.add('hidden');
        }, 300);
    }

    toggleSkills() {
        if (this.isSkillsOpen) {
            this.hideSkills();
        } else {
            this.showSkills();
            if (this.isInventoryOpen) {
                this.hideInventory();
            }
            if (this.isEquipmentOpen) {
                this.hideEquipment();
            }
            if (this.isStatsOpen) {
                this.hideStats();
            }
            if (this.isAchievementsOpen) {
                this.hideAchievements();
            }
        }
    }

}
