// js/systems/Merchant.js'

import { MERCHANT_CONSTANTS, MATERIALS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class Merchant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.name = this.generateMerchantName();
        this.coinCapacity = Utils.randomInt(1000, 5000);
        this.coins = Math.min(this.coinCapacity, MERCHANT_CONSTANTS.INITIAL_COINS);
        this.inventory = [];
        this.restockTimer = 0;
        this.lastRestock = Date.now();
        this.personality = this.generatePersonality();
        this.specialty = this.generateSpecialty();
        
        // Trading preferences
        this.buyPriceMultiplier = MERCHANT_CONSTANTS.BUY_PRICE_MULTIPLIER;
        this.sellPriceMultiplier = MERCHANT_CONSTANTS.SELL_PRICE_MULTIPLIER;
        
        // Initialize inventory
        this.generateInitialInventory();
    }
    
    generateMerchantName() {
        const firstNames = ['Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        const titles = ['the Trader', 'the Merchant', 'the Dealer', 'the Broker', 'the Vendor'];
        
        const firstName = Utils.randomChoice(firstNames);
        const lastName = Utils.randomChoice(lastNames);
        const title = Utils.randomChoice(titles);
        
        return `${firstName} ${lastName} ${title}`;
    }
    
    generatePersonality() {
        const personalities = ['friendly', 'grumpy', 'shrewd', 'generous', 'mysterious'];
        return Utils.randomChoice(personalities);
    }
    
    generateSpecialty() {
        const specialties = ['tools', 'resources', 'armor', 'weapons', 'rare_items'];
        return Utils.randomChoice(specialties);
    }
    
    generateInitialInventory() {
        const itemCount = Utils.randomInt(8, 15);
        
        for (let i = 0; i < itemCount; i++) {
            const item = this.generateRandomItem();
            if (item) {
                this.inventory.push(item);
            }
        }
    }
    
    generateRandomItem() {
        const itemTypes = ['resource', 'equipment', 'consumable'];
        const type = Utils.randomChoice(itemTypes);
        
        switch (type) {
            case 'resource':
                return this.generateResourceItem();
            case 'equipment':
                return this.generateEquipmentItem();
            case 'consumable':
                return this.generateConsumableItem();
            default:
                return null;
        }
    }
    
    generateResourceItem() {
        const resources = [
            { type: 'IRON', basePrice: 15, rarity: 0.3 },
            { type: 'GOLD', basePrice: 50, rarity: 0.2 },
            { type: 'CRYSTAL', basePrice: 10, rarity: 0.4 },
            { type: 'GEM', basePrice: 25, rarity: 0.15 },
            { type: 'DIAMOND', basePrice: 100, rarity: 0.05 }
        ];
        
        const resource = Utils.randomWeightedChoice(
            resources.map(r => ({ value: r.type, weight: r.rarity }))
        );
        
        const resourceData = resources.find(r => r.type === resource);
        const count = Utils.randomInt(1, 5);
        
        return {
            id: this.generateItemId(),
            name: MATERIALS[resource]?.name || resource,
            type: 'resource',
            material: resource,
            count: count,
            value: Math.floor(resourceData.basePrice * this.sellPriceMultiplier),
            buyPrice: Math.floor(resourceData.basePrice * this.buyPriceMultiplier),
            sellPrice: Math.floor(resourceData.basePrice * this.sellPriceMultiplier),
            color: MATERIALS[resource]?.color || '#FFFFFF'
        };
    }
    
    generateEquipmentItem() {
        const equipmentTypes = [
            { type: 'WOODEN_PICKAXE', basePrice: 10, rarity: 0.4 },
            { type: 'STONE_PICKAXE', basePrice: 25, rarity: 0.3 },
            { type: 'IRON_PICKAXE', basePrice: 50, rarity: 0.2 },
            { type: 'LEATHER_ARMOR', basePrice: 20, rarity: 0.3 },
            { type: 'IRON_ARMOR', basePrice: 60, rarity: 0.2 },
            { type: 'POWER_GLOVES', basePrice: 30, rarity: 0.15 }
        ];
        
        const equipment = Utils.randomWeightedChoice(
            equipmentTypes.map(e => ({ value: e.type, weight: e.rarity }))
        );
        
        const equipmentData = equipmentTypes.find(e => e.type === equipment);
        
        return {
            id: this.generateItemId(),
            name: equipment.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            type: 'equipment',
            equipmentType: equipment,
            slot: this.getEquipmentSlot(equipment),
            value: Math.floor(equipmentData.basePrice * this.sellPriceMultiplier),
            buyPrice: Math.floor(equipmentData.basePrice * this.buyPriceMultiplier),
            sellPrice: Math.floor(equipmentData.basePrice * this.sellPriceMultiplier),
            durability: Utils.randomInt(50, 100),
            maxDurability: 100,
            stats: this.getEquipmentStats(equipment),
            color: this.getEquipmentColor(equipment)
        };
    }
    
    generateConsumableItem() {
        const consumables = [
            { name: 'Health Potion', effect: 'heal', value: 20, price: 15 },
            { name: 'Strength Potion', effect: 'strength', value: 10, price: 25 },
            { name: 'Luck Potion', effect: 'luck', value: 5, price: 30 },
            { name: 'Speed Potion', effect: 'speed', value: 3, price: 20 }
        ];
        
        const consumable = Utils.randomChoice(consumables);
        const count = Utils.randomInt(1, 3);
        
        return {
            id: this.generateItemId(),
            name: consumable.name,
            type: 'consumable',
            effect: consumable.effect,
            value: consumable.value,
            count: count,
            buyPrice: Math.floor(consumable.price * this.buyPriceMultiplier),
            sellPrice: Math.floor(consumable.price * this.sellPriceMultiplier * 0.5),
            color: '#FF6B6B'
        };
    }
    
    getEquipmentSlot(equipmentType) {
        const slotMap = {
            'WOODEN_PICKAXE': 'pickaxe',
            'STONE_PICKAXE': 'pickaxe',
            'IRON_PICKAXE': 'pickaxe',
            'GOLD_PICKAXE': 'pickaxe',
            'DIAMOND_PICKAXE': 'pickaxe',
            'LEATHER_HELMET': 'helmet',
            'IRON_HELMET': 'helmet',
            'DIAMOND_HELMET': 'helmet',
            'LEATHER_ARMOR': 'armor',
            'IRON_ARMOR': 'armor',
            'DIAMOND_ARMOR': 'armor',
            'LEATHER_BOOTS': 'boots',
            'IRON_BOOTS': 'boots',
            'DIAMOND_BOOTS': 'boots',
            'POWER_GLOVES': 'gloves',
            'LUCKY_AMULET': 'amulet'
        };
        return slotMap[equipmentType] || 'helmet';
    }
    
    getEquipmentStats(equipmentType) {
        const statsMap = {
            'WOODEN_PICKAXE': { miningPower: 1, attack: 2 },
            'STONE_PICKAXE': { miningPower: 2, attack: 4 },
            'IRON_PICKAXE': { miningPower: 3, attack: 6 },
            'GOLD_PICKAXE': { miningPower: 4, attack: 8 },
            'DIAMOND_PICKAXE': { miningPower: 5, attack: 10 },
            'LEATHER_HELMET': { defense: 2 },
            'IRON_HELMET': { defense: 5 },
            'DIAMOND_HELMET': { defense: 10 },
            'LEATHER_ARMOR': { defense: 3 },
            'IRON_ARMOR': { defense: 8 },
            'DIAMOND_ARMOR': { defense: 15 },
            'LEATHER_BOOTS': { defense: 1, speed: 0.1 },
            'IRON_BOOTS': { defense: 3, speed: 0.05 },
            'DIAMOND_BOOTS': { defense: 6, speed: 0.15 },
            'POWER_GLOVES': { miningPower: 1, attack: 3 },
            'LUCKY_AMULET': { luck: 10 }
        };
        return statsMap[equipmentType] || { defense: 1 };
    }
    
    getEquipmentColor(equipmentType) {
        const colorMap = {
            'WOODEN_PICKAXE': '#8B4513',
            'STONE_PICKAXE': '#808080',
            'IRON_PICKAXE': '#B87333',
            'GOLD_PICKAXE': '#FFD700',
            'DIAMOND_PICKAXE': '#B9F2FF',
            'LEATHER_HELMET': '#8B4513',
            'IRON_HELMET': '#B87333',
            'DIAMOND_HELMET': '#B9F2FF',
            'LEATHER_ARMOR': '#8B4513',
            'IRON_ARMOR': '#B87333',
            'DIAMOND_ARMOR': '#B9F2FF',
            'LEATHER_BOOTS': '#8B4513',
            'IRON_BOOTS': '#B87333',
            'DIAMOND_BOOTS': '#B9F2FF',
            'POWER_GLOVES': '#FF6347',
            'LUCKY_AMULET': '#FFD700'
        };
        return colorMap[equipmentType] || '#8B4513';
    }
    
    generateItemId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    update(deltaTime) {
        this.restockTimer += deltaTime;
        
        if (this.restockTimer >= MERCHANT_CONSTANTS.RESTOCK_INTERVAL) {
            this.restock();
            this.restockTimer = 0;
        }
    }
    
    restock() {
        // Remove some old items
        const itemsToRemove = Math.floor(this.inventory.length * 0.3);
        for (let i = 0; i < itemsToRemove; i++) {
            if (this.inventory.length > 5) {
                const index = Utils.randomInt(0, this.inventory.length - 1);
                this.inventory.splice(index, 1);
            }
        }
        
        // Add new items
        const itemsToAdd = Utils.randomInt(3, 8);
        for (let i = 0; i < itemsToAdd; i++) {
            const item = this.generateRandomItem();
            if (item) {
                this.inventory.push(item);
            }
        }
        
        this.lastRestock = Date.now();
    }
    
    buyItem(player, itemIndex, count = 1) {
        if (itemIndex < 0 || itemIndex >= this.inventory.length) {
            return { success: false, reason: 'Invalid item index' };
        }
        
        const item = this.inventory[itemIndex];
        if (!item) {
            return { success: false, reason: 'Item not found' };
        }

        const requestedCount = Number(count) || 0;
        if (requestedCount <= 0) {
            return { success: false, reason: 'Invalid quantity selected' };
        }

        const availableCountRaw = item.count ?? 1;
        const availableCount = Number.isFinite(availableCountRaw) ? availableCountRaw : Number(availableCountRaw) || 1;
        const buyCount = Math.min(requestedCount, Math.max(1, availableCount));

        if (buyCount <= 0) {
            return { success: false, reason: 'That item is no longer available' };
        }

        const pricePerUnitRaw = item.buyPrice ?? item.value ?? 0;
        const pricePerUnit = Number.isFinite(pricePerUnitRaw) ? pricePerUnitRaw : Number(pricePerUnitRaw);

        if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
            return { success: false, reason: 'This item cannot be purchased right now' };
        }

        const totalCost = pricePerUnit * buyCount;

        if (player.coins < totalCost) {
            return { success: false, reason: 'Not enough coins' };
        }

        if (this.coinCapacity && this.coins + totalCost > this.coinCapacity) {
            return { success: false, reason: 'Merchant cannot hold more coins right now' };
        }

        // Check if player has inventory space
        const itemToAdd = { ...item };
        if (item.count) {
            itemToAdd.count = buyCount;
        }
        
        if (!player.inventory.addItem(itemToAdd)) {
            return { success: false, reason: 'Inventory full' };
        }
        
        // Complete transaction
        player.coins -= totalCost;
        this.coins += totalCost;
        
        // Update merchant inventory
        if (item.count) {
            item.count -= buyCount;
            if (item.count <= 0) {
                this.inventory.splice(itemIndex, 1);
            }
        } else {
            this.inventory.splice(itemIndex, 1);
        }
        
        return { 
            success: true, 
            item: itemToAdd, 
            cost: totalCost,
            remainingCoins: player.coins
        };
        
        // Play trading sound
        if (player.game && player.game.audioSystem) {
            player.game.audioSystem.playTradingSound();
        }
    }
    
    sellItem(player, itemIndex, count = 1) {
        const slot = player.inventory.getSlot(itemIndex);
        if (!slot) {
            return { success: false, reason: 'Item not found' };
        }

        const requestedCount = Number(count) || 0;
        const slotCountRaw = slot.count ?? 1;
        const slotCount = Number.isFinite(slotCountRaw) ? slotCountRaw : Number(slotCountRaw) || 1;
        const sellCount = Math.min(requestedCount || 1, Math.max(1, slotCount));

        if (sellCount <= 0) {
            return { success: false, reason: 'Invalid quantity selected' };
        }

        const pricePerUnit = this.calculateSellPrice(slot);
        if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
            return { success: false, reason: 'Merchant is not interested in that item' };
        }

        const totalValue = pricePerUnit * sellCount;

        // Check if merchant has enough coins
        if (this.coins < totalValue) {
            return { success: false, reason: 'Merchant does not have enough coins' };
        }
        
        // Remove item from player inventory
        player.inventory.removeItem(itemIndex, sellCount);
        
        // Complete transaction
        player.coins += totalValue;
        this.coins -= totalValue;
        
        // Add item to merchant inventory (optional)
        if (Math.random() < 0.5) { // 50% chance merchant keeps the item
            const merchantItem = { ...slot };
            merchantItem.count = sellCount;
            this.inventory.push(merchantItem);
        }
        
        return { 
            success: true, 
            item: slot, 
            count: sellCount,
            value: totalValue,
            newCoins: player.coins
        };
        
        // Play trading sound
        if (player.game && player.game.audioSystem) {
            player.game.audioSystem.playTradingSound();
        }
    }
    
    calculateSellPrice(item) {
        let basePrice = item.value || 0;
        
        // Adjust for item condition
        if (item.durability !== undefined && item.maxDurability) {
            const conditionMultiplier = item.durability / item.maxDurability;
            basePrice *= conditionMultiplier;
        }
        
        // Apply personality-based price adjustment
        switch (this.personality) {
            case 'generous':
                basePrice *= 1.2;
                break;
            case 'shrewd':
                basePrice *= 0.8;
                break;
            case 'grumpy':
                basePrice *= 0.9;
                break;
        }
        
        return Math.floor(basePrice);
    }
    
    getGreeting() {
        const greetings = {
            friendly: [
                "Welcome, adventurer! What can I get for you today?",
                "Ah, a customer! Come browse my wares!",
                "Good day! I have the finest goods in the land!"
            ],
            grumpy: [
                "What do you want? I'm busy.",
                "Hmph. Another customer. Make it quick.",
                "If you're not buying, don't waste my time."
            ],
            shrewd: [
                "Welcome! I have deals you won't find anywhere else.",
                "Ah, a discerning customer! My prices are fair, my goods are finer.",
                "Business is good! Let's make a deal, shall we?"
            ],
            generous: [
                "Welcome, friend! Please, take a look at my selection.",
                "I'm feeling generous today! Special prices for you!",
                "Come in, come in! I have just what you need!"
            ],
            mysterious: [
                "...You seek something? I may have what you need...",
                "The winds brought you here. Fate, perhaps?",
                "I have items of power... if you can afford them."
            ]
        };
        
        const personalityGreetings = greetings[this.personality] || greetings.friendly;
        return Utils.randomChoice(personalityGreetings);
    }
    
    getFarewell() {
        const farewells = {
            friendly: [
                "Come back anytime!",
                "Thank you for your business!",
                "Safe travels, adventurer!"
            ],
            grumpy: [
                "Goodbye.",
                "Don't come back too soon.",
                "Hmph."
            ],
            shrewd: [
                "A pleasure doing business with you!",
                "Remember me for your future needs!",
                "Smart choice! Come again!"
            ],
            generous: [
                "It was my pleasure! Take care!",
                "Thank you, my friend! Visit again soon!",
                "May fortune favor you!"
            ],
            mysterious: [
                "...Until we meet again...",
                "The paths may cross once more...",
                "Fate guides you... and me..."
            ]
        };
        
        const personalityFarewells = farewells[this.personality] || farewells.friendly;
        return Utils.randomChoice(personalityFarewells);
    }
    
    getTradeResponse(success) {
        if (success) {
            const responses = {
                friendly: ["Excellent choice!", "You won't regret it!", "A fine purchase!"],
                grumpy: ["Hmph. Take it.", "Whatever.", "Here."],
                shrewd: ["A wise investment!", "You drive a hard bargain!", "Excellent!"],
                generous: ["A wonderful choice!", "I'm glad you like it!", "Perfect for you!"],
                mysterious: ["...The item chooses you...", "Destiny... perhaps...", "It was meant to be..."]
            };
            
            const personalityResponses = responses[this.personality] || responses.friendly;
            return Utils.randomChoice(personalityResponses);
        } else {
            const responses = [
                "Perhaps another time?",
                "I understand.",
                "No problem.",
                "Maybe next time."
            ];
            return Utils.randomChoice(responses);
        }
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            name: this.name,
            coins: this.coins,
            coinCapacity: this.coinCapacity,
            inventory: this.inventory,
            personality: this.personality,
            specialty: this.specialty,
            lastRestock: this.lastRestock
        };
    }
    
    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.name = data.name;
        this.coinCapacity = data.coinCapacity ?? Utils.randomInt(1000, 5000);
        this.coins = Math.min(data.coins ?? MERCHANT_CONSTANTS.INITIAL_COINS, this.coinCapacity);
        this.inventory = data.inventory || [];
        this.personality = data.personality || 'friendly';
        this.specialty = data.specialty || 'tools';
        this.lastRestock = data.lastRestock || Date.now();
    }
}