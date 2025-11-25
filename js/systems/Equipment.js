// js/systems/Equipment.js

import { EQUIPMENT_SLOTS, EQUIPMENT_DEFINITIONS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class Equipment {
    constructor(player = null) {
        this.player = player;
        this.slots = {
            [EQUIPMENT_SLOTS.HELMET]: null,
            [EQUIPMENT_SLOTS.ARMOR]: null,
            [EQUIPMENT_SLOTS.BOOTS]: null,
            [EQUIPMENT_SLOTS.PICKAXE]: null,
            [EQUIPMENT_SLOTS.GLOVES]: null,
            [EQUIPMENT_SLOTS.AMULET]: null
        };
        
        this.listeners = new Set();
        this.statCache = new Map();
        this.cacheValid = false;
    }
    
    equip(item, slot) {
        // Check if item can be equipped first
        const canEquipResult = this.canEquip(item, slot);
        if (!canEquipResult.canEquip) {
            return { success: false, reason: canEquipResult.reason };
        }
        
        const currentItem = this.slots[slot];
        
        // Equip new item
        this.slots[slot] = { ...item };
        
        // Invalidate cache
        this.cacheValid = false;
        
        // Notify listeners
        this.notifyListeners('equipmentChanged', { slot, item: this.slots[slot], previousItem: currentItem });
        
        return { 
            success: true, 
            previousItem: currentItem,
            newItem: this.slots[slot]
        };
    }
    
    unequip(slot) {
        const item = this.slots[slot];
        if (!item) {
            return { success: false, reason: 'No item equipped in this slot' };
        }
        
        this.slots[slot] = null;
        
        // Invalidate cache
        this.cacheValid = false;
        
        // Notify listeners
        this.notifyListeners('equipmentChanged', { slot, item: null, previousItem: item });
        
        return { success: true, item: item };
    }
    
    getSlot(slot) {
        return this.slots[slot];
    }
    
    getAllEquippedItems() {
        const equipped = {};
        for (const [slot, item] of Object.entries(this.slots)) {
            if (item) {
                equipped[slot] = item;
            }
        }
        return equipped;
    }
    
    getAllStatBonuses() {
        if (this.cacheValid) {
            return new Map(this.statCache);
        }
        
        const bonuses = new Map();
        
        for (const item of Object.values(this.slots)) {
            if (item && item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    const current = bonuses.get(stat) || 0;
                    bonuses.set(stat, current + value);
                }

                // Add bonus stats from enhancements
                if (item.bonusStats) {
                    for (const [stat, value] of Object.entries(item.bonusStats)) {
                        const current = bonuses.get(stat) || 0;
                        bonuses.set(stat, current + value);
                    }
                }
            }
        }
        
        // Cache the result
        this.statCache = bonuses;
        this.cacheValid = true;
        
        return bonuses;
    }
    
    getStatBonus(stat) {
        const bonuses = this.getAllStatBonuses();
        return bonuses.get(stat) || 0;
    }
    
    getTotalDefense() {
        return this.getStatBonus('defense');
    }
    
    getTotalAttack() {
        return this.getStatBonus('attack');
    }
    
    getTotalMiningPower() {
        return this.getStatBonus('miningPower');
    }
    
    getTotalSpeed() {
        return this.getStatBonus('speed');
    }
    
    getTotalLuck() {
        return this.getStatBonus('luck');
    }
    
    damageItem(slot, amount) {
        const item = this.slots[slot];
        if (!item || item.durability === undefined) {
            return false;
        }
        
        item.durability = Math.max(0, item.durability - amount);
        
        // Check if item broke
        if (item.durability <= 0) {
            this.unequip(slot);
            this.notifyListeners('itemBroken', { slot, item: item });
            return true;
        }
        
        this.notifyListeners('itemDamaged', { slot, item: item, damage: amount });
        return false;
    }
    
    repairItem(slot, amount) {
        const item = this.slots[slot];
        if (!item || item.durability === undefined) {
            return false;
        }
        
        const maxDurability = item.maxDurability || 100;
        item.durability = Math.min(maxDurability, item.durability + amount);
        
        this.notifyListeners('itemRepaired', { slot, item: item, repairAmount: amount });
        return true;
    }
    
    getDurabilityPercentage(slot) {
        const item = this.slots[slot];
        if (!item || item.durability === undefined) {
            return 100;
        }
        
        const maxDurability = item.maxDurability || 100;
        return (item.durability / maxDurability) * 100;
    }
    
    getLowestDurabilityItem() {
        let lowestItem = null;
        let lowestPercentage = 100;
        
        for (const [slot, item] of Object.entries(this.slots)) {
            if (item && item.durability !== undefined) {
                const percentage = this.getDurabilityPercentage(slot);
                if (percentage < lowestPercentage) {
                    lowestPercentage = percentage;
                    lowestItem = { slot, item, percentage };
                }
            }
        }
        
        return lowestItem;
    }
    
    hasItem(itemId) {
        for (const item of Object.values(this.slots)) {
            if (item && item.id === itemId) {
                return true;
            }
        }
        return false;
    }
    
    findItem(itemId) {
        for (const [slot, item] of Object.entries(this.slots)) {
            if (item && item.id === itemId) {
                return { slot, item };
            }
        }
        return null;
    }
    
    getEquipmentPower() {
        let totalPower = 0;
        
        for (const item of Object.values(this.slots)) {
            if (item && item.stats) {
                for (const value of Object.values(item.stats)) {
                    totalPower += value;
                }
            }
        }
        
        return totalPower;
    }
    
    getTotalPower() {
        return this.getEquipmentPower();
    }
    
    getEquipmentValue() {
        let totalValue = 0;
        
        for (const item of Object.values(this.slots)) {
            if (item && item.value) {
                totalValue += item.value;
            }
        }
        
        return totalValue;
    }
    
    getTotalValue() {
        return this.getEquipmentValue();
    }
    
    isSlotEmpty(slot) {
        return this.slots[slot] === null;
    }
    
    getEmptySlots() {
        const emptySlots = [];
        for (const [slot, item] of Object.entries(this.slots)) {
            if (!item) {
                emptySlots.push(slot);
            }
        }
        return emptySlots;
    }
    
    canEquip(item, slot) {
        if (!item || !item.slot) {
            return { canEquip: false, reason: 'Item is not equippable' };
        }
        
        if (item.slot !== slot) {
            return { canEquip: false, reason: 'Item cannot be equipped in this slot' };
        }
        
        // Check level requirements if they exist
        if (item.requiredLevel && item.requiredLevel > this.getPlayerLevel()) {
            return { canEquip: false, reason: 'Player level too low' };
        }
        
        return { canEquip: true };
    }
    
    getPlayerLevel() {
        // Return the player's level if available, otherwise default to 1
        return this.player ? this.player.level : 1;
    }
    
    createEquipmentFromTemplate(templateId) {
        const template = EQUIPMENT_DEFINITIONS[templateId];
        if (!template) {
            return null;
        }
        
        return {
            id: this.generateEquipmentId(),
            ...template,
            durability: template.durability || 100,
            maxDurability: template.durability || 100
        };
    }
    
    generateEquipmentId() {
        return 'equip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
            slots: { ...this.slots }
        };
    }
    
    deserialize(data) {
        this.slots = { ...data.slots };
        this.cacheValid = false;
    }
}