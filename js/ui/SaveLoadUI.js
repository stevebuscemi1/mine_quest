// js/ui/SaveLoadUI.js

import { Utils } from '../utils/Utils.js';

export class SaveLoadUI {
    constructor(game, saveSystem) {
        this.game = game;
        this.saveSystem = saveSystem;
        this.currentDialog = null;
        this.selectedSlot = null;
        
        // UI elements
        this.dialogContainer = document.getElementById('dialogContainer');
        this.dialogTitle = document.getElementById('dialogTitle');
        this.dialogMessage = document.getElementById('dialogMessage');
        this.dialogOptions = document.getElementById('dialogOptions');
    }
    
    showSaveDialog() {
        const slots = this.saveSystem.getSaveSlots();
        
        let content = '<div class="save-load-dialog">';
        content += '<h3>Select Save Slot</h3>';
        content += '<div class="save-slots">';
        
        slots.forEach(slot => {
            const saveInfo = this.saveSystem.getSaveInfo(slot.slot);
            const isSelected = slot.slot === this.selectedSlot;
            
            content += `<div class="save-slot ${isSelected ? 'selected' : ''}" data-slot="${slot.slot}">`;
            
            if (slot.isEmpty) {
                content += `<div class="empty-slot">`;
                content += `<h4>Slot ${slot.slot} - Empty</h4>`;
                content += `<p>Click to create a new save</p>`;
                content += `<div class="slot-actions">`;
                content += `<button class="save-btn" data-slot="${slot.slot}">Save</button>`;
                content += `</div>`;
                content += `</div>`;
            } else {
                content += `<div class="occupied-slot">`;
                content += `<div class="slot-header">`;
                content += `<h4>Slot ${slot.slot} - ${saveInfo.currentAreaName} (Lv.${saveInfo.playerLevel})</h4>`;
                content += `<span class="save-date">${saveInfo.formattedDate}</span>`;
                content += `</div>`;
                
                if (saveInfo.screenshot) {
                    content += `<img src="${saveInfo.screenshot}" alt="Screenshot" class="save-screenshot">`;
                }
                
                content += `<div class="slot-info">`;
                content += `<p><strong>Mode:</strong> ${Utils.capitalize(saveInfo.mode)}</p>`;
                content += `<p><strong>Level:</strong> ${saveInfo.playerLevel}</p>`;
                content += `<p><strong>Area:</strong> ${saveInfo.currentAreaName}</p>`;
                content += `<p><strong>Play Time:</strong> ${saveInfo.formattedPlayTime}</p>`;
                content += `</div>`;
                
                content += `<div class="slot-actions">`;
                content += `<button class="save-btn" data-slot="${slot.slot}">Save</button>`;
                content += `<button class="load-btn" data-slot="${slot.slot}">Load</button>`;
                content += `<button class="delete-btn" data-slot="${slot.slot}">Delete</button>`;
                content += `<button class="export-btn" data-slot="${slot.slot}">Export</button>`;
                content += `</div>`;
                content += `</div>`;
            }
            
            content += `</div>`;
        });
        
        content += '</div>';
        content += '</div>';
        
        // Use the UI's showDialog method instead of directly manipulating elements
        this.game.ui.showDialog(
            'Save Game',
            content,
            [
                { text: 'Import Save', value: 'import' },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (value === 'import') {
                    this.showImportDialog();
                }
                // Dialog will auto-hide
            },
            false // Don't auto-hide
        );
        
        // Set up event listeners after the dialog is created
        setTimeout(() => {
            this.setupSaveLoadEventListeners();
        }, 100);
    }
    
    showLoadDialog() {
        const slots = this.saveSystem.getSaveSlots();
        const occupiedSlots = slots.filter(slot => !slot.isEmpty);
        
        if (occupiedSlots.length === 0) {
            this.game.ui.showDialog(
                'Load Game',
                'No save files found. Start a new game to create a save file.',
                [
                    { text: 'OK', value: 'ok', primary: true }
                ]
            );
            return;
        }
        
        let content = '<div class="save-load-dialog">';
        content += '<h3>Select Save to Load</h3>';
        content += '<div class="save-slots">';
        
        occupiedSlots.forEach(slot => {
            const saveInfo = this.saveSystem.getSaveInfo(slot.slot);
            const isSelected = slot.slot === this.selectedSlot;
            
            content += `<div class="save-slot ${isSelected ? 'selected' : ''}" data-slot="${slot.slot}">`;
            content += `<div class="occupied-slot">`;
            content += `<div class="slot-header">`;
            content += `<h4>Slot ${slot.slot} - ${saveInfo.currentAreaName} (Lv.${saveInfo.playerLevel})</h4>`;
            content += `<span class="save-date">${saveInfo.formattedDate}</span>`;
            content += `</div>`;
            
            if (saveInfo.screenshot) {
                content += `<img src="${saveInfo.screenshot}" alt="Screenshot" class="save-screenshot">`;
            }
            
            content += `<div class="slot-info">`;
            content += `<p><strong>Mode:</strong> ${Utils.capitalize(saveInfo.mode)}</p>`;
            content += `<p><strong>Level:</strong> ${saveInfo.playerLevel}</p>`;
            content += `<p><strong>Area:</strong> ${saveInfo.currentAreaName}</p>`;
            content += `<p><strong>Play Time:</strong> ${saveInfo.formattedPlayTime}</p>`;
            content += `</div>`;
            
            content += `<div class="slot-actions">`;
            content += `<button class="load-btn primary" data-slot="${slot.slot}">Load</button>`;
            content += `<button class="delete-btn" data-slot="${slot.slot}">Delete</button>`;
            content += `<button class="export-btn" data-slot="${slot.slot}">Export</button>`;
            content += `</div>`;
            content += `</div>`;
            content += `</div>`;
        });
        
        content += '</div>';
        content += '</div>';
        
        // Use the UI's showDialog method
        this.game.ui.showDialog(
            'Load Game',
            content,
            [
                { text: 'Import Save', value: 'import' },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (value === 'import') {
                    this.showImportDialog();
                }
                // Dialog will auto-hide
            },
            false // Don't auto-hide
        );
        
        // Set up event listeners after the dialog is created
        setTimeout(() => {
            this.setupSaveLoadEventListeners();
        }, 100);
    }
    
    showImportDialog() {
        const content = `
            <div class="import-dialog">
                <h3>Import Save File</h3>
                <p>Select a save file to import:</p>
                <input type="file" id="importFile" accept=".json" class="file-input">
                <div class="import-options">
                    <label>
                        <input type="radio" name="importSlot" value="1" checked>
                        Slot 1
                    </label>
                    <label>
                        <input type="radio" name="importSlot" value="2">
                        Slot 2
                    </label>
                    <label>
                        <input type="radio" name="importSlot" value="3">
                        Slot 3
                    </label>
                </div>
            </div>
        `;
        
        this.game.ui.showDialog(
            'Import Save',
            content,
            [
                { text: 'Import', value: 'confirm', disabled: true },
                { text: 'Cancel', value: 'cancel' }
            ],
            (value) => {
                if (value === 'confirm') {
                    const fileInput = document.getElementById('importFile');
                    this.handleImport(fileInput.files[0]);
                } else if (value === 'cancel') {
                    // Return to save menu
                    this.showSaveDialog();
                }
            },
            false
        );
        
        // Set up file input listener
        setTimeout(() => {
            const fileInput = document.getElementById('importFile');
            const confirmBtn = document.querySelector('.dialog-option[value="confirm"]');
            
            fileInput.addEventListener('change', (e) => {
                if (confirmBtn) {
                    confirmBtn.disabled = !e.target.files.length;
                }
            });
        }, 100);
    }
    
    setupSaveLoadEventListeners() {
        // Find elements within the current dialog
        const dialogMessage = document.querySelector('#dialogMessage');
        if (!dialogMessage) {
            console.warn('SaveLoadUI: dialogMessage not found');
            return;
        }
        
        // Slot selection
        const slotElements = dialogMessage.querySelectorAll('.save-slot');
        slotElements.forEach(element => {
            element.addEventListener('click', (e) => {
                if (!e.target.classList.contains('save-btn') && 
                    !e.target.classList.contains('load-btn') && 
                    !e.target.classList.contains('delete-btn') && 
                    !e.target.classList.contains('export-btn')) {
                    this.selectSlot(parseInt(element.dataset.slot));
                }
            });
        });
        
        // Save buttons
        const saveButtons = dialogMessage.querySelectorAll('.save-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleSave(parseInt(button.dataset.slot));
            });
        });
        
        // Load buttons
        const loadButtons = dialogMessage.querySelectorAll('.load-btn');
        loadButtons.forEach(button => {
            button.addEventListener('click', async () => {
                await this.handleLoad(parseInt(button.dataset.slot));
            });
        });
        
        // Delete buttons
        const deleteButtons = dialogMessage.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleDelete(parseInt(button.dataset.slot));
            });
        });
        
        // Export buttons
        const exportButtons = dialogMessage.querySelectorAll('.export-btn');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleExport(parseInt(button.dataset.slot));
            });
        });
        
        // Import button (in dialog options)
        const importBtn = document.querySelector('.dialog-option[value="import"]');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportDialog();
            });
        }
        
        // Cancel button (in dialog options)
        const cancelBtn = document.querySelector('.dialog-option[value="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideDialog();
            });
        }
    }
    
    selectSlot(slot) {
        this.selectedSlot = slot;
        
        // Update visual selection
        const dialogMessage = document.querySelector('#dialogMessage');
        if (dialogMessage) {
            const slotElements = dialogMessage.querySelectorAll('.save-slot');
            slotElements.forEach(element => {
                element.classList.remove('selected');
                if (parseInt(element.dataset.slot) === slot) {
                    element.classList.add('selected');
                }
            });
        }
    }
    
    handleSave(slot) {
        const gameData = this.game.currentMode.getSaveData();
        const result = this.saveSystem.saveGame(slot, gameData);
        
        if (result.success) {
            this.game.ui.showNotification(`Game saved to slot ${slot}`, 'success');
            this.hideDialog();
        } else {
            this.game.ui.showNotification(`Failed to save: ${result.error}`, 'error');
        }
    }
    
    async handleLoad(slot) {
        console.log('SaveLoadUI: handleLoad called for slot:', slot);
        
        // Check if save data exists in the SaveSystem
        const saveInfo = this.saveSystem.getSaveInfo(slot);
        console.log('SaveLoadUI: saveInfo for slot', slot, ':', saveInfo);
        
        const result = this.saveSystem.loadGame(slot);
        console.log('SaveLoadUI: loadGame result:', result);
        
        if (result.success) {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification(`Game loaded from slot ${slot}`, 'success');
            }
            this.hideDialog();
            
            try {
                // Load the game data
                await this.game.loadGameFromData(result.saveData);
            } catch (error) {
                console.error('SaveLoadUI: Error loading game:', error);
                if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                    this.game.ui.showNotification('Failed to load game: ' + error.message, 'error');
                }
            }
        } else {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification(`Failed to load: ${result.error}`, 'error');
            }
        }
    }
    
    handleDelete(slot) {
        if (this.game && this.game.ui && typeof this.game.ui.showConfirmDialog === 'function') {
            this.game.ui.showConfirmDialog(
                'Delete Save',
                `Are you sure you want to delete the save in slot ${slot}? This cannot be undone.`,
                () => {
                    const result = this.saveSystem.deleteSave(slot);
                    
                    if (result.success) {
                        if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                            this.game.ui.showNotification(`Save deleted from slot ${slot}`, 'success');
                        }
                        this.showSaveDialog(); // Refresh dialog
                    } else {
                        if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                            this.game.ui.showNotification(`Failed to delete: ${result.error}`, 'error');
                        }
                    }
                }
            );
        }
    }
    
    handleExport(slot) {
        const result = this.saveSystem.exportSave(slot);
        
        if (result.success) {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification(`Save exported from slot ${slot}`, 'success');
            }
        } else {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification(`Failed to export: ${result.error}`, 'error');
            }
        }
    }
    
    handleImport(file) {
        if (!file) {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification('Please select a file to import', 'error');
            }
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = e.target.result;
            const slot = parseInt(document.querySelector('input[name="importSlot"]:checked').value);
            
            const result = this.saveSystem.importSave(slot, jsonData);
            
            if (result.success) {
                if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                    this.game.ui.showNotification(`Save imported to slot ${slot}`, 'success');
                }
                this.hideDialog();
                // Return to save menu to show the imported save
                setTimeout(() => {
                    this.showSaveDialog();
                }, 500);
            } else {
                if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                    this.game.ui.showNotification(`Failed to import: ${result.error}`, 'error');
                }
            }
        };
        
        reader.onerror = () => {
            if (this.game && this.game.ui && typeof this.game.ui.showNotification === 'function') {
                this.game.ui.showNotification('Failed to read file', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    hideDialog() {
        // Use the UI's hideDialog method instead of directly manipulating elements
        if (this.game && this.game.ui && typeof this.game.ui.hideDialog === 'function') {
            this.game.ui.hideDialog();
        }
        this.selectedSlot = null;
    }
}