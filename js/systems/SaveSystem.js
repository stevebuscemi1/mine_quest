// js/systems/SaveSystem.js

import { SAVE_CONSTANTS, GAME_MODES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class SaveSystem {
    constructor() {
        this.maxSlots = SAVE_CONSTANTS.MAX_SLOTS;
        this.currentVersion = SAVE_CONSTANTS.VERSION;
        this.compressionEnabled = SAVE_CONSTANTS.COMPRESSION;
        this.autoSaveInterval = SAVE_CONSTANTS.AUTO_SAVE_INTERVAL;
        
        // Save slots
        this.saveSlots = new Map();
        this.currentSlot = null;
        this.autoSaveTimer = null;
        
        // Cloud save support
        this.cloudSaveEnabled = false;
        this.cloudSaveProvider = null;
        
        // Save validation
        this.validationErrors = [];
        
        // Initialize save system
        this.initialize();
    }
    
    initialize() {
        console.log('SaveSystem: Initializing...');
        
        // Load existing save slots
        this.loadSaveSlots();
        console.log('SaveSystem: After loadSaveSlots, saveSlots Map has', this.saveSlots.size, 'entries');
        
        // Initialize cloud save if available
        this.initializeCloudSave();
        
        // Start auto-save timer
        this.startAutoSave();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('SaveSystem: Initialization complete');
    }
    
    loadSaveSlots() {
        this.saveSlots.clear();
        
        for (let i = 1; i <= this.maxSlots; i++) {
            const saveData = this.loadSaveSlot(i);
            if (saveData) {
                this.saveSlots.set(i, saveData);
            }
        }
    }
    
    loadSaveSlot(slot) {
        try {
            const saveKey = `minequest_save_${slot}`;
            console.log(`SaveSystem: Loading save slot ${slot} with key: ${saveKey}`);
            
            const saveData = localStorage.getItem(saveKey);
            console.log(`SaveSystem: localStorage.getItem("${saveKey}") returned:`, saveData ? 'data found' : 'null');
            
            if (!saveData) {
                console.log(`SaveSystem: No save data found in localStorage for slot ${slot}`);
                return null;
            }
            
            // Decompress if needed
            const decompressedData = this.compressionEnabled ? 
                Utils.decompressData(saveData) : saveData;
            
            const parsedData = JSON.parse(decompressedData);
            console.log(`SaveSystem: Successfully parsed save data for slot ${slot}`);
            
            // Validate save data
            const validation = this.validateSaveData(parsedData);
            if (!validation.isValid) {
                console.warn(`Invalid save data in slot ${slot}:`, validation.errors);
                return null;
            }
            
            console.log(`SaveSystem: Save slot ${slot} loaded successfully`);
            return parsedData;
        } catch (error) {
            console.error(`Failed to load save slot ${slot}:`, error);
            return null;
        }
    }
    
    saveGame(slot, gameData) {
        try {
            // Prepare save data
            const saveData = this.prepareSaveData(gameData, slot);
            
            // Validate save data
            const validation = this.validateSaveData(saveData);
            if (!validation.isValid) {
                throw new Error(`Invalid save data: ${validation.errors.join(', ')}`);
            }
            
            // Compress if needed
            const serializedData = JSON.stringify(saveData);
            const compressedData = this.compressionEnabled ? 
                Utils.compressData(serializedData) : serializedData;
            
            // Save to localStorage
            const saveKey = `minequest_save_${slot}`;
            localStorage.setItem(saveKey, compressedData);
            
            // Update save slots
            this.saveSlots.set(slot, saveData);
            this.currentSlot = slot;
            
            // Save to cloud if enabled
            if (this.cloudSaveEnabled) {
                this.saveToCloud(slot, saveData);
            }
            
            // Trigger save event
            this.triggerSaveEvent('gameSaved', { slot, saveData });
            
            return { success: true, slot: slot };
        } catch (error) {
            console.error('Failed to save game:', error);
            this.triggerSaveEvent('saveError', { error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    loadGame(slot) {
        try {
            console.log('SaveSystem: loadGame called for slot:', slot);
            console.log('SaveSystem: saveSlots Map has', this.saveSlots.size, 'entries');
            console.log('SaveSystem: slot keys:', Array.from(this.saveSlots.keys()));
            
            const saveData = this.saveSlots.get(slot);
            console.log('SaveSystem: saveData retrieved for slot', slot, ':', saveData);
            
            if (!saveData) {
                console.error('SaveSystem: No save data found in saveSlots Map for slot', slot);
                throw new Error(`No save data found in slot ${slot}`);
            }
            
            // Validate save data
            const validation = this.validateSaveData(saveData);
            if (!validation.isValid) {
                throw new Error(`Invalid save data: ${validation.errors.join(', ')}`);
            }
            
            // Check version compatibility
            if (!this.isVersionCompatible(saveData.version)) {
                console.warn('Save data version mismatch, attempting migration...');
                saveData = this.migrateSaveData(saveData);
            }
            
            this.currentSlot = slot;
            
            // Trigger load event
            this.triggerSaveEvent('gameLoaded', { slot, saveData });
            
            return { success: true, saveData: saveData };
        } catch (error) {
            console.error('SaveSystem: Failed to load game:', error);
            this.triggerSaveEvent('loadError', { error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    deleteSave(slot) {
        try {
            const saveKey = `minequest_save_${slot}`;
            localStorage.removeItem(saveKey);
            
            this.saveSlots.delete(slot);
            
            if (this.currentSlot === slot) {
                this.currentSlot = null;
            }
            
            // Delete from cloud if enabled
            if (this.cloudSaveEnabled) {
                this.deleteFromCloud(slot);
            }
            
            // Trigger delete event
            this.triggerSaveEvent('saveDeleted', { slot });
            
            return { success: true };
        } catch (error) {
            console.error('Failed to delete save:', error);
            return { success: false, error: error.message };
        }
    }
    
    prepareSaveData(gameData, slot) {
        return {
            version: this.currentVersion,
            timestamp: Date.now(),
            slot: slot,
            mode: gameData.mode,
            player: gameData.player,
            currentArea: gameData.currentArea,
            fogOfWar: gameData.fogOfWar,
            stats: gameData.stats,
            settings: gameData.settings || {},
            screenshot: this.captureScreenshot(),
            metadata: {
                playTime: gameData.stats?.playTime || 0,
                areasExplored: gameData.stats?.areasExplored || 0,
                enemiesDefeated: gameData.stats?.enemiesDefeated || 0,
                playerLevel: gameData.player?.level || 1,
                currentAreaName: gameData.currentArea?.name || 'Unknown',
                gameMode: gameData.mode
            }
        };
    }
    
    validateSaveData(saveData) {
        const errors = [];
        
        // Check required fields
        if (!saveData.version) {
            errors.push('Missing version');
        }
        
        if (!saveData.timestamp) {
            errors.push('Missing timestamp');
        }
        
        if (!saveData.mode) {
            errors.push('Missing game mode');
        }
        
        if (!saveData.player) {
            errors.push('Missing player data');
        }
        
        if (!saveData.currentArea) {
            errors.push('Missing current area data');
        }
        
        // Validate game mode
        if (!Object.values(GAME_MODES).includes(saveData.mode)) {
            errors.push('Invalid game mode');
        }
        
        // Validate player data
        if (saveData.player) {
            if (typeof saveData.player.x !== 'number' || typeof saveData.player.y !== 'number') {
                errors.push('Invalid player position');
            }
            
            if (typeof saveData.player.health !== 'number' || saveData.player.health < 0) {
                errors.push('Invalid player health');
            }
            
            if (typeof saveData.player.level !== 'number' || saveData.player.level < 1) {
                errors.push('Invalid player level');
            }
        }
        
        // Validate area data
        if (saveData.currentArea) {
            if (typeof saveData.currentArea.width !== 'number' || saveData.currentArea.width <= 0) {
                errors.push('Invalid area width');
            }
            
            if (typeof saveData.currentArea.height !== 'number' || saveData.currentArea.height <= 0) {
                errors.push('Invalid area height');
            }
            
            if (!Array.isArray(saveData.currentArea.grid)) {
                errors.push('Invalid area grid');
            }
        }
        
        // Check data size
        const dataSize = JSON.stringify(saveData).length;
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (dataSize > maxSize) {
            errors.push('Save data too large');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    isVersionCompatible(version) {
        // Simple version compatibility check
        if (!version) return false;
        
        const currentParts = this.currentVersion.split('.').map(Number);
        const saveParts = version.split('.').map(Number);
        
        // Major version must match
        if (currentParts[0] !== saveParts[0]) {
            return false;
        }
        
        // Minor version can be higher or equal
        if (currentParts[1] < saveParts[1]) {
            return false;
        }
        
        return true;
    }
    
    migrateSaveData(saveData) {
        // Migration logic for different versions
        const fromVersion = saveData.version;
        const toVersion = this.currentVersion;
        
        console.log(`Migrating save data from ${fromVersion} to ${toVersion}`);
        
        // Example migration logic
        if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
            // Add new fields for version 1.1.0
            if (!saveData.stats) {
                saveData.stats = {};
            }
            
            if (!saveData.stats.achievements) {
                saveData.stats.achievements = [];
            }
        }
        
        // Update version
        saveData.version = toVersion;
        saveData.migratedFrom = fromVersion;
        saveData.migratedAt = Date.now();
        
        return saveData;
    }
    
    captureScreenshot() {
        try {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                return canvas.toDataURL('image/jpeg', 0.5);
            }
        } catch (error) {
            console.warn('Failed to capture screenshot:', error);
        }
        return null;
    }
    
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.autoSave();
        }, this.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    autoSave() {
        if (!this.currentSlot) {
            return;
        }
        
        // Trigger auto-save event
        this.triggerSaveEvent('autoSave', { slot: this.currentSlot });
        
        // Get current game data from the active game mode
        const gameData = this.getCurrentGameData();
        if (gameData) {
            this.saveGame(this.currentSlot, gameData);
        }
    }
    
    getCurrentGameData() {
        // This should be implemented by the game to provide current data
        // For now, return null - the game will override this
        return null;
    }
    
    setGameDataProvider(provider) {
        this.getCurrentGameData = provider;
    }
    
    getSaveSlots() {
        const slots = [];
        
        for (let i = 1; i <= this.maxSlots; i++) {
            const saveData = this.saveSlots.get(i);
            
            slots.push({
                slot: i,
                exists: !!saveData,
                data: saveData,
                isEmpty: !saveData,
                timestamp: saveData?.timestamp || 0,
                version: saveData?.version || 'Unknown',
                mode: saveData?.mode || 'Unknown',
                metadata: saveData?.metadata || {},
                screenshot: saveData?.screenshot || null
            });
        }
        
        return slots;
    }
    
    getSaveInfo(slot) {
        const saveData = this.saveSlots.get(slot);
        
        if (!saveData) {
            return null;
        }
        
        return {
            slot: slot,
            timestamp: saveData.timestamp,
            version: saveData.version,
            mode: saveData.mode,
            playTime: saveData.metadata?.playTime || 0,
            playerLevel: saveData.metadata?.playerLevel || 1,
            areasExplored: saveData.metadata?.areasExplored || 0,
            enemiesDefeated: saveData.metadata?.enemiesDefeated || 0,
            currentAreaName: saveData.metadata?.currentAreaName || 'Unknown',
            screenshot: saveData.screenshot,
            formattedDate: new Date(saveData.timestamp).toLocaleString(),
            formattedPlayTime: this.formatPlayTime(saveData.metadata?.playTime || 0)
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
    
    exportSave(slot) {
        try {
            const saveData = this.saveSlots.get(slot);
            
            if (!saveData) {
                throw new Error(`No save data found in slot ${slot}`);
            }
            
            const exportData = {
                exportVersion: '1.0',
                exportedAt: Date.now(),
                saveData: saveData
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minequest_save_slot_${slot}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to export save:', error);
            return { success: false, error: error.message };
        }
    }
    
    importSave(slot, jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (!importData.saveData) {
                throw new Error('Invalid save file format');
            }
            
            // Validate imported data
            const validation = this.validateSaveData(importData.saveData);
            if (!validation.isValid) {
                throw new Error(`Invalid save data: ${validation.errors.join(', ')}`);
            }
            
            // Save imported data
            return this.saveGame(slot, importData.saveData);
        } catch (error) {
            console.error('Failed to import save:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Cloud save methods
    initializeCloudSave() {
        // Check for cloud save providers
        if (typeof Steam !== 'undefined') {
            this.initializeSteamCloud();
        } else if (typeof gapi !== 'undefined') {
            this.initializeGoogleDrive();
        }
    }
    
    initializeSteamCloud() {
        this.cloudSaveEnabled = true;
        this.cloudSaveProvider = 'steam';
        
        // Set up Steam cloud save
        if (Steam && Steam.Client && Steam.Client.Storage) {
            console.log('Steam Cloud save initialized');
        }
    }
    
    initializeGoogleDrive() {
        this.cloudSaveEnabled = true;
        this.cloudSaveProvider = 'google-drive';
        
        // Set up Google Drive save
        console.log('Google Drive save initialized');
    }
    
    async saveToCloud(slot, saveData) {
        if (!this.cloudSaveEnabled) {
            return { success: false, error: 'Cloud save not enabled' };
        }
        
        try {
            switch (this.cloudSaveProvider) {
                case 'steam':
                    return await this.saveToSteamCloud(slot, saveData);
                case 'google-drive':
                    return await this.saveToGoogleDrive(slot, saveData);
                default:
                    return { success: false, error: 'Unknown cloud provider' };
            }
        } catch (error) {
            console.error('Failed to save to cloud:', error);
            return { success: false, error: error.message };
        }
    }
    
    async loadFromCloud(slot) {
        if (!this.cloudSaveEnabled) {
            return { success: false, error: 'Cloud save not enabled' };
        }
        
        try {
            switch (this.cloudSaveProvider) {
                case 'steam':
                    return await this.loadFromSteamCloud(slot);
                case 'google-drive':
                    return await this.loadFromGoogleDrive(slot);
                default:
                    return { success: false, error: 'Unknown cloud provider' };
            }
        } catch (error) {
            console.error('Failed to load from cloud:', error);
            return { success: false, error: error.message };
        }
    }
    
    async saveToSteamCloud(slot, saveData) {
        // Implementation for Steam Cloud save
        if (Steam && Steam.Client && Steam.Client.Storage) {
            const key = `minequest_save_${slot}`;
            const data = JSON.stringify(saveData);
            
            return new Promise((resolve) => {
                Steam.Client.Storage.writeFile(key, data, (success) => {
                    resolve({ success: success });
                });
            });
        }
        
        return { success: false, error: 'Steam Cloud not available' };
    }
    
    async loadFromSteamCloud(slot) {
        // Implementation for Steam Cloud load
        if (Steam && Steam.Client && Steam.Client.Storage) {
            const key = `minequest_save_${slot}`;
            
            return new Promise((resolve) => {
                Steam.Client.Storage.readFile(key, (data, success) => {
                    if (success) {
                        try {
                            const saveData = JSON.parse(data);
                            resolve({ success: true, saveData: saveData });
                        } catch (error) {
                            resolve({ success: false, error: 'Failed to parse cloud data' });
                        }
                    } else {
                        resolve({ success: false, error: 'Cloud data not found' });
                    }
                });
            });
        }
        
        return { success: false, error: 'Steam Cloud not available' };
    }
    
    async saveToGoogleDrive(slot, saveData) {
        // Implementation for Google Drive save
        // This would require Google Drive API integration
        return { success: false, error: 'Google Drive save not implemented' };
    }
    
    async loadFromGoogleDrive(slot) {
        // Implementation for Google Drive load
        // This would require Google Drive API integration
        return { success: false, error: 'Google Drive load not implemented' };
    }
    
    async deleteFromCloud(slot) {
        if (!this.cloudSaveEnabled) {
            return { success: false, error: 'Cloud save not enabled' };
        }
        
        try {
            switch (this.cloudSaveProvider) {
                case 'steam':
                    return await this.deleteFromSteamCloud(slot);
                case 'google-drive':
                    return await this.deleteFromGoogleDrive(slot);
                default:
                    return { success: false, error: 'Unknown cloud provider' };
            }
        } catch (error) {
            console.error('Failed to delete from cloud:', error);
            return { success: false, error: error.message };
        }
    }
    
    async deleteFromSteamCloud(slot) {
        if (Steam && Steam.Client && Steam.Client.Storage) {
            const key = `minequest_save_${slot}`;
            
            return new Promise((resolve) => {
                Steam.Client.Storage.deleteFile(key, (success) => {
                    resolve({ success: success });
                });
            });
        }
        
        return { success: false, error: 'Steam Cloud not available' };
    }
    
    async deleteFromGoogleDrive(slot) {
        // Implementation for Google Drive delete
        return { success: false, error: 'Google Drive delete not implemented' };
    }
    
    syncWithCloud() {
        if (!this.cloudSaveEnabled) {
            return { success: false, error: 'Cloud save not enabled' };
        }
        
        // Sync local saves with cloud
        for (let slot = 1; slot <= this.maxSlots; slot++) {
            this.loadFromCloud(slot).then(result => {
                if (result.success) {
                    // Compare timestamps and use newer version
                    const cloudData = result.saveData;
                    const localData = this.saveSlots.get(slot);
                    
                    if (!localData || cloudData.timestamp > localData.timestamp) {
                        this.saveSlots.set(slot, cloudData);
                        this.triggerSaveEvent('cloudSynced', { slot, fromCloud: true });
                    }
                }
            });
        }
        
        return { success: true };
    }
    
    setupEventListeners() {
        // Listen for save/load events
        document.addEventListener('saveGame', (e) => {
            this.saveGame(e.detail.slot, e.detail.gameData);
        });
        
        document.addEventListener('loadGame', (e) => {
            this.loadGame(e.detail.slot);
        });
        
        document.addEventListener('deleteSave', (e) => {
            this.deleteSave(e.detail.slot);
        });
        
        document.addEventListener('exportSave', (e) => {
            this.exportSave(e.detail.slot);
        });
        
        document.addEventListener('importSave', (e) => {
            this.importSave(e.detail.slot, e.detail.jsonData);
        });
    }
    
    triggerSaveEvent(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
    
    getStatistics() {
        const slots = this.getSaveSlots();
        const occupiedSlots = slots.filter(slot => !slot.isEmpty);
        
        return {
            totalSlots: this.maxSlots,
            occupiedSlots: occupiedSlots.length,
            emptySlots: this.maxSlots - occupiedSlots.length,
            currentSlot: this.currentSlot,
            cloudSaveEnabled: this.cloudSaveEnabled,
            cloudProvider: this.cloudSaveProvider,
            compressionEnabled: this.compressionEnabled,
            version: this.currentVersion,
            oldestSave: occupiedSlots.length > 0 ? 
                Math.min(...occupiedSlots.map(slot => slot.timestamp)) : null,
            newestSave: occupiedSlots.length > 0 ? 
                Math.max(...occupiedSlots.map(slot => slot.timestamp)) : null,
            totalPlayTime: occupiedSlots.reduce((sum, slot) => 
                sum + (slot.data?.metadata?.playTime || 0), 0)
        };
    }
    
    cleanup() {
        // Stop auto-save
        this.stopAutoSave();
        
        // Clear event listeners
        document.removeEventListener('saveGame', this.saveGame);
        document.removeEventListener('loadGame', this.loadGame);
        document.removeEventListener('deleteSave', this.deleteSave);
        document.removeEventListener('exportSave', this.exportSave);
        document.removeEventListener('importSave', this.importSave);
    }
}