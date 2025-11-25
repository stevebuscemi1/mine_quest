// js/systems/Inventory.js

import { INVENTORY_SIZE, ITEM_TYPES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class Inventory {
    constructor(size = INVENTORY_SIZE) {
        this.size = size;
        this.slots = new Array(size).fill(null);
        this.maxStackSize = 99;
        this.selectedSlot = 0;
        this.listeners = new Set();
    }
    
    addItem(item, count = 1) {
        // Try to stack with existing items first
        if (item.stackable !== false) {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot && this.canStack(slot, item)) {
                    const spaceAvailable = this.maxStackSize - slot.count;
                    const amountToAdd = Math.min(count, spaceAvailable);
                    
                    slot.count += amountToAdd;
                    count -= amountToAdd;
                    
                    this.notifyListeners('slotChanged', { index: i, slot: slot });
                    
                    if (count <= 0) {
                        return true;
                    }
                }
            }
        }
        
        // Find empty slot for remaining items
        while (count > 0) {
            const emptyIndex = this.findEmptySlot();
            if (emptyIndex === -1) {
                return false; // Inventory full
            }
            
            const amountToAdd = Math.min(count, this.maxStackSize);
            this.slots[emptyIndex] = {
                ...item,
                count: amountToAdd,
                id: item.id || this.generateItemId()
            };
            
            count -= amountToAdd;
            this.notifyListeners('slotChanged', { index: emptyIndex, slot: this.slots[emptyIndex] });
        }
        
        return true;
    }
    
    removeItem(index, count = 1) {
        const slot = this.slots[index];
        if (!slot) return false;
        
        if (slot.count <= count) {
            this.slots[index] = null;
            this.notifyListeners('slotChanged', { index, slot: null });
            return true;
        }
        
        slot.count -= count;
        this.notifyListeners('slotChanged', { index, slot: slot });
        return true;
    }
    
    moveItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return false;
        
        const fromSlot = this.slots[fromIndex];
        const toSlot = this.slots[toIndex];
        
        if (!fromSlot) return false;
        
        // If target slot is empty, move item
        if (!toSlot) {
            this.slots[toIndex] = fromSlot;
            this.slots[fromIndex] = null;
        } else {
            // Try to stack items
            if (this.canStack(fromSlot, toSlot)) {
                const totalAmount = fromSlot.count + toSlot.count;
                if (totalAmount <= this.maxStackSize) {
                    toSlot.count = totalAmount;
                    this.slots[fromIndex] = null;
                } else {
                    // Stack as much as possible
                    const remaining = totalAmount - this.maxStackSize;
                    toSlot.count = this.maxStackSize;
                    fromSlot.count = remaining;
                }
            } else {
                // Swap items
                this.slots[fromIndex] = toSlot;
                this.slots[toIndex] = fromSlot;
            }
        }
        
        this.notifyListeners('slotChanged', { index: fromIndex, slot: this.slots[fromIndex] });
        this.notifyListeners('slotChanged', { index: toIndex, slot: this.slots[toIndex] });
        
        return true;
    }
    
    splitItem(fromIndex, toIndex, amount) {
        const fromSlot = this.slots[fromIndex];
        if (!fromSlot || fromSlot.count <= amount) return false;
        
        const toSlot = this.slots[toIndex];
        if (toSlot && !this.canStack(fromSlot, toSlot)) return false;
        
        // Create new stack
        const newStack = {
            ...fromSlot,
            count: amount,
            id: this.generateItemId()
        };
        
        // Remove from original
        fromSlot.count -= amount;
        
        // Add to target
        if (toSlot) {
            toSlot.count += amount;
        } else {
            this.slots[toIndex] = newStack;
        }
        
        this.notifyListeners('slotChanged', { index: fromIndex, slot: fromSlot });
        this.notifyListeners('slotChanged', { index: toIndex, slot: this.slots[toIndex] });
        
        return true;
    }
    
    canStack(item1, item2) {
        return item1.type === item2.type &&
               item1.material === item2.material &&
               item1.name === item2.name &&
               item1.value === item2.value &&
               item1.durability === undefined; // Don't stack equipment
    }
    
    findEmptySlot() {
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                return i;
            }
        }
        return -1;
    }
    
    findItem(itemId) {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.id === itemId) {
                return { index: i, slot: slot };
            }
        }
        return null;
    }
    
    findItemsByType(type) {
        const items = [];
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.type === type) {
                items.push({ index: i, slot: slot });
            }
        }
        return items;
    }
    
    findItemsByMaterial(material) {
        const items = [];
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.material === material) {
                items.push({ index: i, slot: slot });
            }
        }
        return items;
    }
    
    getItemCount(itemId) {
        const item = this.findItem(itemId);
        return item ? item.slot.count : 0;
    }
    
    getMaterialCount(material) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.material === material) {
                total += slot.count;
            }
        }
        return total;
    }
    
    getMaterialInfo(material) {
        for (const slot of this.slots) {
            if (slot && slot.material === material) {
                return {
                    name: slot.name,
                    value: slot.value,
                    color: slot.color,
                    type: slot.type
                };
            }
        }
        return null;
    }
    
    removeMaterial(material, count) {
        let remainingToRemove = count;
        
        // First pass: remove from full stacks
        for (let i = 0; i < this.slots.length && remainingToRemove > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.material === material) {
                const removeAmount = Math.min(remainingToRemove, slot.count);
                slot.count -= removeAmount;
                remainingToRemove -= removeAmount;
                
                if (slot.count <= 0) {
                    this.slots[i] = null;
                }
                
                this.notifyListeners('slotChanged', { index: i, slot: this.slots[i] });
            }
        }
        
        return remainingToRemove === 0; // Return true if all materials were removed
    }
    
    getEmptySlotCount() {
        return this.slots.filter(slot => !slot).length;
    }
    
    getUsedSlotCount() {
        return this.slots.filter(slot => slot).length;
    }
    
    getSlot(index) {
        if (index < 0 || index >= this.slots.length) {
            return null;
        }
        return this.slots[index];
    }
    
    sortItems() {
        // Sort by type, then by name, then by value
        // Priority: Equipment > Consumable > Resource > Misc > Quest
        const sortedSlots = [...this.slots]
            .filter(slot => slot !== null)
            .sort((a, b) => {
                const typeOrder = {
                    'equipment': 1,
                    'consumable': 2, 
                    'resource': 3,
                    'misc': 4,
                    'quest': 5
                };
                
                const aTypeOrder = typeOrder[a.type] || 6;
                const bTypeOrder = typeOrder[b.type] || 6;
                
                if (aTypeOrder !== bTypeOrder) {
                    return aTypeOrder - bTypeOrder;
                }
                
                if (a.name !== b.name) {
                    return a.name.localeCompare(b.name);
                }
                
                return (b.value || 0) - (a.value || 0);
            });
        
        // Clear inventory
        this.slots.fill(null);
        
        // Re-add sorted items
        let index = 0;
        for (const slot of sortedSlots) {
            this.slots[index] = slot;
            index++;
        }
        
        this.notifyListeners('inventorySorted');
    }
    
    generateItemId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
            slots: this.slots.filter(slot => slot !== null),
            size: this.size,
            selectedSlot: this.selectedSlot
        };
    }
    
    deserialize(data) {
        this.slots = new Array(this.size).fill(null);
        for (let i = 0; i < data.slots.length && i < this.size; i++) {
            this.slots[i] = data.slots[i];
        }
        this.selectedSlot = data.selectedSlot || 0;
    }
}