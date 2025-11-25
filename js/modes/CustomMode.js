// js/modes/CustomMode.js

import { GAME_MODES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Player } from '../core/Player.js';
import { FogOfWar } from '../core/FogOfWar.js';
import { CustomArea } from '../systems/CustomArea.js';

export class CustomMode {
    constructor(game) {
        this.game = game;
        this.mode = GAME_MODES.CUSTOM;
        
        // Game state
        this.currentArea = null;
        this.player = null;
        this.fogOfWar = null;
        this.customAreaSystem = new CustomArea();
        
        // Mode-specific settings
        this.selectedAreaId = null;
        this.areaList = [];
        this.currentCategory = 'all';
        this.sortBy = 'rating';
        
        // Statistics
        this.stats = {
            areasPlayed: 0,
            customAreasCompleted: 0,
            totalRating: 0,
            ratingsGiven: 0,
            playTime: 0,
            startTime: Date.now()
        };
        
        // Load custom areas from storage
        this.customAreaSystem.loadFromLocalStorage();
    }
    
    async init() {
        // Show area selection interface
        await this.showAreaSelection();
    }
    
    async showAreaSelection() {
        // Load available areas
        this.areaList = this.customAreaSystem.getAreaList();
        
        // Create area selection interface
        const areaOptions = this.createAreaOptions();
        
        if (areaOptions.length === 0) {
            // No custom areas available
            this.game.ui.showDialog(
                'Custom Areas',
                'No custom areas available. You can create your own areas in the Custom Area Creator!',
                [
                    { text: 'Create Area', value: 'create', primary: true },
                    { text: 'Back', value: 'back' }
                ],
                (value) => {
                    if (value === 'create') {
                        this.showAreaCreator();
                    } else {
                        this.game.returnToStartPage();
                    }
                }
            );
        } else {
            // Show area selection
            this.game.ui.showDialog(
                'Select Custom Area',
                this.createAreaSelectionContent(),
                [
                    { text: 'Create New Area', value: 'create' },
                    { text: 'Import Area', value: 'import' },
                    { text: 'Back', value: 'back' }
                ],
                (value) => {
                    this.handleAreaSelectionAction(value);
                }
            );
        }
    }
    
    createAreaOptions() {
        return this.areaList.map(area => ({
            text: `${area.name} by ${area.creatorName} (${area.type}) - Rating: ${area.rating.toFixed(1)}/5`,
            value: area.id,
            data: area
        }));
    }
    
    createAreaSelectionContent() {
        let content = '<div class="area-selection">';
        
        // Add filters
        content += '<div class="area-filters">';
        content += '<label>Category: <select id="areaCategory">';
        content += '<option value="all">All Areas</option>';
        content += '<option value="mine">Mines</option>';
        content += '<option value="cave">Caves</option>';
        content += '<option value="crystal_cavern">Crystal Caverns</option>';
        content += '<option value="ancient_ruins">Ancient Ruins</option>';
        content += '<option value="cosmic_region">Cosmic Regions</option>';
        content += '</select></label>';
        
        content += '<label>Sort by: <select id="areaSort">';
        content += '<option value="rating">Rating</option>';
        content += '<option value="newest">Newest</option>';
        content += '<option value="downloads">Downloads</option>';
        content += '<option value="name">Name</option>';
        content += '</select></label>';
        content += '</div>';
        
        // Add area list
        content += '<div class="area-list">';
        
        const filteredAreas = this.filterAreas();
        const sortedAreas = this.sortAreas(filteredAreas);
        
        if (sortedAreas.length === 0) {
            content += '<p>No areas found matching your criteria.</p>';
        } else {
            sortedAreas.forEach(area => {
                content += `<div class="area-item" data-area-id="${area.id}">`;
                content += `<h3>${area.name}</h3>`;
                content += `<p>by ${area.creatorName}</p>`;
                content += `<p>Type: ${area.type} | Difficulty: ${area.difficulty}</p>`;
                content += `<p>Rating: ${area.rating.toFixed(1)}/5 (${this.customAreaSystem.ratings.get(area.id)?.size || 0} ratings)</p>`;
                content += `<p>Downloads: ${area.downloads}</p>`;
                content += `<button class="play-area-btn" data-area-id="${area.id}">Play</button>`;
                content += `<button class="rate-area-btn" data-area-id="${area.id}">Rate</button>`;
                content += `</div>`;
            });
        }
        
        content += '</div></div>';
        
        return content;
    }
    
    filterAreas() {
        if (this.currentCategory === 'all') {
            return this.areaList;
        }
        
        return this.areaList.filter(area => area.type === this.currentCategory);
    }
    
    sortAreas(areas) {
        return areas.sort((a, b) => {
            switch (this.sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'newest':
                    return b.createdAt - a.createdAt;
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return b.rating - a.rating;
            }
        });
    }
    
    handleAreaSelectionAction(action) {
        switch (action) {
            case 'create':
                this.showAreaCreator();
                break;
            case 'import':
                this.showAreaImporter();
                break;
            case 'back':
                this.game.returnToStartPage();
                break;
            default:
                // Play selected area
                this.playCustomArea(action);
        }
    }
    
    showAreaCreator() {
        this.game.ui.showDialog(
            'Create Custom Area',
            this.createAreaCreatorContent(),
            [
                { text: 'Create Area', value: 'create', primary: true },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (value === 'create') {
                    this.createCustomArea();
                } else {
                    this.showAreaSelection();
                }
            }
        );
    }
    
    createAreaCreatorContent() {
        return `
            <div class="area-creator">
                <div class="form-group">
                    <label>Area Name:</label>
                    <input type="text" id="areaName" maxlength="50" placeholder="Enter area name">
                </div>
                
                <div class="form-group">
                    <label>Creator Name:</label>
                    <input type="text" id="creatorName" maxlength="30" placeholder="Enter your name">
                </div>
                
                <div class="form-group">
                    <label>Area Type:</label>
                    <select id="areaType">
                        <option value="mine">Mine</option>
                        <option value="cave">Cave</option>
                        <option value="crystal_cavern">Crystal Cavern</option>
                        <option value="ancient_ruins">Ancient Ruins</option>
                        <option value="cosmic_region">Cosmic Region</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Width:</label>
                    <input type="number" id="areaWidth" min="40" max="200" value="50">
                </div>
                
                <div class="form-group">
                    <label>Height:</label>
                    <input type="number" id="areaHeight" min="40" max="200" value="50">
                </div>
                
                <div class="form-group">
                    <label>Difficulty:</label>
                    <input type="number" id="areaDifficulty" min="1" max="10" value="1">
                </div>
                
                <div class="form-group">
                    <label>Template:</label>
                    <select id="areaTemplate">
                        <option value="blank">Blank Area</option>
                        <option value="empty_mine">Empty Mine</option>
                        <option value="empty_cave">Empty Cave</option>
                        <option value="arena">Battle Arena</option>
                        <option value="puzzle_room">Puzzle Room</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    createCustomArea() {
        // Access elements from within the UI dialog container
        if (!this.game.ui || !this.game.ui.elements.dialogContainer) {
            this.game.ui.showNotification('Dialog not found', 'error');
            return;
        }

        const dialogMessage = this.game.ui.elements.dialogContainer.querySelector('#dialogMessage');
        if (!dialogMessage) {
            this.game.ui.showNotification('Dialog content not found', 'error');
            return;
        }

        const nameInput = dialogMessage.querySelector('#areaName');
        const creatorInput = dialogMessage.querySelector('#creatorName');
        const typeSelect = dialogMessage.querySelector('#areaType');
        const widthInput = dialogMessage.querySelector('#areaWidth');
        const heightInput = dialogMessage.querySelector('#areaHeight');
        const difficultyInput = dialogMessage.querySelector('#areaDifficulty');
        const templateSelect = dialogMessage.querySelector('#areaTemplate');

        // Check if all elements exist
        if (!nameInput || !creatorInput || !typeSelect || !widthInput || !heightInput || !difficultyInput || !templateSelect) {
            this.game.ui.showNotification('Form elements not found', 'error');
            return;
        }

        const name = nameInput.value?.trim() || '';
        const creatorName = creatorInput.value?.trim() || '';
        const type = typeSelect.value || 'mine';
        const width = parseInt(widthInput.value) || 50;
        const height = parseInt(heightInput.value) || 50;
        const difficulty = parseInt(difficultyInput.value) || 1;
        const template = templateSelect.value || 'blank';

        // Validate input
        if (!name || !creatorName) {
            this.game.ui.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (width < 40 || width > 200 || height < 40 || height > 200) {
            this.game.ui.showNotification('Area dimensions must be between 40 and 200', 'error');
            return;
        }

        if (difficulty < 1 || difficulty > 10) {
            this.game.ui.showNotification('Difficulty must be between 1 and 10', 'error');
            return;
        }

        // Create area
        let area;
        if (template === 'blank') {
            const result = this.customAreaSystem.createBlankArea(width, height, type, creatorName);
            if (!result.success) {
                this.game.ui.showNotification(result.reason, 'error');
                return;
            }
            area = result.area;
            area.name = name;
            area.difficulty = difficulty;
        } else {
            const result = this.customAreaSystem.createAreaFromTemplate(template, creatorName);
            if (!result.success) {
                this.game.ui.showNotification(result.reason, 'error');
                return;
            }
            area = result.area;
            area.name = name;
            area.difficulty = difficulty;
        }

        // Save area
        const saveResult = this.customAreaSystem.saveArea(area, {
            description: `Custom ${type} area created by ${creatorName}`
        });

        if (saveResult.success) {
            this.game.ui.showNotification('Area created successfully!', 'success');
            this.showAreaSelection();
        } else {
            this.game.ui.showNotification('Failed to save area', 'error');
        }
    }
    
    showAreaImporter() {
        this.game.ui.showDialog(
            'Import Custom Area',
            `
                <div class="area-importer">
                    <p>Paste the JSON data of a custom area below:</p>
                    <textarea id="areaJsonData" rows="10" cols="50" placeholder="Paste JSON data here..."></textarea>
                </div>
            `,
            [
                { text: 'Import', value: 'import', primary: true },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (value === 'import') {
                    this.importCustomArea();
                } else {
                    this.showAreaSelection();
                }
            }
        );
    }
    
    importCustomArea() {
        // Access elements from within the UI dialog container
        if (!this.game.ui || !this.game.ui.elements.dialogContainer) {
            this.game.ui.showNotification('Dialog not found', 'error');
            return;
        }

        const dialogMessage = this.game.ui.elements.dialogContainer.querySelector('#dialogMessage');
        if (!dialogMessage) {
            this.game.ui.showNotification('Dialog content not found', 'error');
            return;
        }

        const jsonInput = dialogMessage.querySelector('#areaJsonData');

        if (!jsonInput) {
            this.game.ui.showNotification('JSON input field not found', 'error');
            return;
        }

        const jsonData = jsonInput.value?.trim() || '';

        if (!jsonData) {
            this.game.ui.showNotification('Please paste JSON data', 'error');
            return;
        }

        const result = this.customAreaSystem.importArea(jsonData, 'importer');

        if (result.success) {
            this.game.ui.showNotification('Area imported successfully!', 'success');
            this.showAreaSelection();
        } else {
            this.game.ui.showNotification(result.reason, 'error');
        }
    }
    
    async playCustomArea(areaId) {
        // Load the area
        const result = this.customAreaSystem.loadArea(areaId);
        
        if (!result.success) {
            this.game.ui.showNotification('Failed to load area', 'error');
            return;
        }
        
        this.currentArea = result.area;
        this.selectedAreaId = areaId;
        
        // Initialize player
        this.player = new Player(25, 25);
        
        // Find valid spawn position
        const spawnPos = this.findValidSpawnPosition();
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;
        
        // Initialize fog of war
        this.fogOfWar = new FogOfWar();
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Update statistics
        this.stats.areasPlayed++;
        
        // Start the game
        this.game.onAreaChanged(this.currentArea);
        this.updateUI();
        
        // Hide dialog
        this.game.ui.hideDialog();
    }
    
    findValidSpawnPosition() {
        const validPositions = [];
        
        for (let y = 0; y < this.currentArea.height; y++) {
            for (let x = 0; x < this.currentArea.width; x++) {
                const cell = this.currentArea.getCell(x, y);
                if (cell === 0 || cell === 7) { // Empty or door
                    validPositions.push({ x, y });
                }
            }
        }
        
        return Utils.randomChoice(validPositions) || { x: 25, y: 25 };
    }
    
    update(deltaTime) {
        if (!this.currentArea || !this.player) return;
        
        // Update player
        this.player.update(deltaTime);
        
        // Update fog of war
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Update enemies
        for (const [key, enemy] of this.currentArea.enemies) {
            enemy.update(deltaTime, this.player, this.currentArea);
        }
        
        // Update merchants
        for (const merchant of this.currentArea.merchants.values()) {
            merchant.update(deltaTime);
        }
        
        // Update statistics
        this.stats.playTime = Date.now() - this.stats.startTime;
        
        // Check for area completion
        this.checkAreaCompletion();
    }
    
    checkAreaCompletion() {
        // Check if player is at an exit
        const playerCell = this.currentArea.getCell(this.player.x, this.player.y);
        if (playerCell === 7) { // Door
            this.completeArea();
        }
    }
    
    completeArea() {
        // Update statistics
        this.stats.customAreasCompleted++;
        
        // Show completion dialog
        this.game.ui.showDialog(
            'Area Complete!',
            `Congratulations! You completed "${this.currentArea.name}"!`,
            [
                { text: 'Rate Area', value: 'rate', primary: true },
                { text: 'Play Another', value: 'another' },
                { text: 'Back to Menu', value: 'menu' }
            ],
            (value) => {
                switch (value) {
                    case 'rate':
                        this.showAreaRating();
                        break;
                    case 'another':
                        this.showAreaSelection();
                        break;
                    case 'menu':
                        this.game.returnToStartPage();
                        break;
                }
            }
        );
    }
    
    showAreaRating() {
        this.game.ui.showDialog(
            'Rate Area',
            `How would you rate "${this.currentArea.name}"?`,
            [
                { text: '⭐', value: 1 },
                { text: '⭐⭐', value: 2 },
                { text: '⭐⭐⭐', value: 3 },
                { text: '⭐⭐⭐⭐', value: 4 },
                { text: '⭐⭐⭐⭐⭐', value: 5 },
                { text: 'Skip', value: 'skip' }
            ],
            (value) => {
                if (value !== 'skip') {
                    this.rateArea(value);
                }
                this.showAreaSelection();
            }
        );
    }
    
    rateArea(rating) {
        const result = this.customAreaSystem.rateArea(this.selectedAreaId, rating, 'player');
        
        if (result.success) {
            this.game.ui.showNotification('Area rated successfully!', 'success');
            this.stats.totalRating += rating;
            this.stats.ratingsGiven++;
        } else {
            this.game.ui.showNotification('Failed to rate area', 'error');
        }
    }
    
    updateUI() {
        if (!this.game.ui) return;
        
        // Update game info
        this.game.ui.updateGameInfo({
            area: this.currentArea,
            player: this.player,
            gameMode: this.mode
        });
        
        // Update inventory
        if (this.player.inventory) {
            this.game.ui.updateInventory(this.player.inventory);
        }
        
        // Update equipment
        if (this.player.equipment) {
            this.game.ui.updateEquipment(this.player.equipment);
        }
    }
    
    getSaveData() {
        return {
            mode: this.mode,
            selectedAreaId: this.selectedAreaId,
            player: this.player.serialize(),
            currentArea: this.currentArea.serialize(),
            fogOfWar: this.fogOfWar.serialize(),
            stats: this.stats,
            timestamp: Date.now()
        };
    }
    
    getStatistics() {
        return {
            ...this.stats,
            currentArea: this.currentArea ? this.currentArea.name : 'None',
            creatorName: this.currentArea ? this.currentArea.creatorName : 'Unknown',
            averageRating: this.stats.ratingsGiven > 0 ? (this.stats.totalRating / this.stats.ratingsGiven).toFixed(1) : 'N/A',
            totalPlayTime: this.formatPlayTime(this.stats.playTime)
        };
    }
    
    formatPlayTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }
    
    cleanup() {
        // Clean up resources
        if (this.customAreaSystem) {
            this.customAreaSystem.saveToLocalStorage();
        }
    }
}