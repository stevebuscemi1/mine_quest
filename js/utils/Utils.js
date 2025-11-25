// js/utils/Utils.js

import { MATERIALS, AREA_TYPES } from '../constants/GameConstants.js';

export class Utils {
    // Math Utilities
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static randomWeightedChoice(options) {
        const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const option of options) {
            random -= option.weight;
            if (random <= 0) {
                return option.value;
            }
        }
        
        return options[options.length - 1].value;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // Coordinate Utilities
    static coordToKey(x, y) {
        return `${x},${y}`;
    }

    static keyToCoord(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    static getNeighbors(x, y, includeDiagonal = false) {
        const neighbors = [];
        
        // Cardinal directions
        neighbors.push({ x: x - 1, y });
        neighbors.push({ x: x + 1, y });
        neighbors.push({ x, y: y - 1 });
        neighbors.push({ x, y: y + 1 });
        
        if (includeDiagonal) {
            neighbors.push({ x: x - 1, y: y - 1 });
            neighbors.push({ x: x + 1, y: y - 1 });
            neighbors.push({ x: x - 1, y: y + 1 });
            neighbors.push({ x: x + 1, y: y + 1 });
        }
        
        return neighbors;
    }

    static getDirection(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // Array Utilities
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static unique(array) {
        return [...new Set(array)];
    }

    static remove(array, item) {
        const index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    }

    // Color Utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static blendColors(color1, color2, ratio) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return color1;
        
        const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
        
        return this.rgbToHex(r, g, b);
    }

    static adjustBrightness(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        
        const r = Math.min(255, Math.max(0, rgb.r + (rgb.r * percent / 100)));
        const g = Math.min(255, Math.max(0, rgb.g + (rgb.g * percent / 100)));
        const b = Math.min(255, Math.max(0, rgb.b + (rgb.b * percent / 100)));
        
        return this.rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    }

    // String Utilities
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static formatNumber(num) {
        return num.toLocaleString();
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static truncate(str, maxLength) {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
    }

    static slugify(str) {
        return str.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    // Time Utilities
    static now() {
        return Date.now();
    }

    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Save/Load Utilities
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    static compressData(data) {
        // Simple compression - in a real game, you'd use a proper compression library
        return JSON.stringify(data);
    }

    static decompressData(compressed) {
        return JSON.parse(compressed);
    }

    // Validation Utilities
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static isValidUsername(username) {
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    }

    static sanitizeInput(input) {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Asset Loading Utilities
    static async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    static async loadAudio(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = src;
        });
    }

    // Game-specific Utilities
    static calculateDamage(attacker, defender) {
        if (!attacker || !attacker.stats) {
            console.error('calculateDamage: attacker or attacker.stats is undefined', attacker);
            return { damage: 1, isCritical: false };
        }
        if (!defender || !defender.stats) {
            console.error('calculateDamage: defender or defender.stats is undefined', defender);
            return { damage: 1, isCritical: false };
        }

        const baseDamage = attacker.stats.attack || 10;
        const defense = defender.stats.defense || 0;
        const variance = this.randomFloat(0.8, 1.2);

        // Critical hit chance based on luck (0.1% per luck point, max 20%)
        const critChance = Math.min((attacker.stats.luck || 0) * 0.001, 0.2);
        const isCritical = Math.random() < critChance;
        const critical = isCritical ? 2 : 1;

        // Track critical hits for achievements
        if (isCritical) {
            document.dispatchEvent(new CustomEvent('criticalHit', {
                detail: { attacker: attacker, defender: defender }
            }));
        }

        const damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * variance * critical));
        return { damage, isCritical };
    }

    static calculateMiningTime(material, pickaxePower, efficiency = 0) {
        const baseTime = MATERIALS[material]?.miningTime || 1000;
        const powerReduction = pickaxePower * 100;
        const efficiencyReduction = baseTime * (efficiency / 100);
        return Math.max(100, baseTime - powerReduction - efficiencyReduction);
    }

    static generateLootTable(drops) {
        const loot = [];
        for (const drop of drops) {
            if (Math.random() < drop.chance) {
                const count = drop.count || 1;
                loot.push({ type: drop.type, count });
            }
        }
        return loot;
    }

    static getPath(startX, startY, endX, endY, obstacles) {
        // Simple A* pathfinding implementation
        const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
        const closedSet = new Set();
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            // Remove current from openSet
            openSet.splice(currentIndex, 1);
            closedSet.add(this.coordToKey(current.x, current.y));
            
            // Check if we reached the goal
            if (current.x === endX && current.y === endY) {
                const path = [];
                let temp = current;
                while (temp) {
                    path.push({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path.reverse();
            }
            
            // Check neighbors
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const key = this.coordToKey(neighbor.x, neighbor.y);
                
                if (closedSet.has(key) || obstacles.has(key)) {
                    continue;
                }
                
                const g = current.g + 1;
                const h = this.manhattanDistance(neighbor.x, neighbor.y, endX, endY);
                const f = g + h;
                
                const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                
                if (!existingNode) {
                    openSet.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        g,
                        h,
                        f,
                        parent: current
                    });
                } else if (g < existingNode.g) {
                    existingNode.g = g;
                    existingNode.f = f;
                    existingNode.parent = current;
                }
            }
        }
        
        return null; // No path found
    }

    static generateAreaName(type, difficulty) {
        const prefixes = {
            [AREA_TYPES.MINE]: ['Abandoned', 'Forgotten', 'Dark', 'Deep'],
            [AREA_TYPES.CAVE]: ['Mysterious', 'Echoing', 'Hidden', 'Ancient'],
            [AREA_TYPES.CRYSTAL_CAVERN]: ['Shimmering', 'Radiant', 'Prismatic', 'Luminous'],
            [AREA_TYPES.ANCIENT_RUINS]: ['Lost', 'Sunken', 'Crumbling', 'Haunted'],
            [AREA_TYPES.COSMIC_REGION]: ['Starlit', 'Void', 'Celestial', 'Ethereal'],
            [AREA_TYPES.VOLCANIC]: ['Fiery', 'Smoldering', 'Lava-filled', 'Ash-covered'],
            [AREA_TYPES.FROZEN]: ['Frozen', 'Icy', 'Glacial', 'Arctic'],
            [AREA_TYPES.DESERT]: ['Barren', 'Sandy', 'Scorching', 'Wind-swept'],
            [AREA_TYPES.JUNGLE]: ['Dense', 'Verdant', 'Overgrown', 'Tropical'],
            [AREA_TYPES.ABYSS]: ['Bottomless', 'Deep', 'Endless', 'Abyssal'],
            'debug_testing': ['Testing', 'Debug', 'Experimental', 'Development']
        };
        
        const suffixes = {
            [AREA_TYPES.MINE]: ['Mine', 'Shaft', 'Tunnels', 'Excavation'],
            [AREA_TYPES.CAVE]: ['Cavern', 'Grotto', 'Cave', 'Chasm'],
            [AREA_TYPES.CRYSTAL_CAVERN]: ['Cavern', 'Grotto', 'Cave', 'Chamber'],
            [AREA_TYPES.ANCIENT_RUINS]: ['Ruins', 'Temple', 'Crypt', 'Dungeon'],
            [AREA_TYPES.COSMIC_REGION]: ['Void', 'Nexus', 'Realm', 'Dimension'],
            [AREA_TYPES.VOLCANIC]: ['Volcano', 'Crater', 'Caldera', 'Forge'],
            [AREA_TYPES.FROZEN]: ['Tundra', 'Glacier', 'Ice Cave', 'Frostlands'],
            [AREA_TYPES.DESERT]: ['Desert', 'Wasteland', 'Dunes', 'Badlands'],
            [AREA_TYPES.JUNGLE]: ['Jungle', 'Wilds', 'Thicket', 'Rainforest'],
            [AREA_TYPES.ABYSS]: ['Abyss', 'Chasm', 'Pit', 'Depths'],
            'debug_testing': ['Environment', 'Lab', 'Zone', 'Arena']
        };
        
        const prefix = this.randomChoice(prefixes[type] || ['Testing']);
        const suffix = this.randomChoice(suffixes[type] || ['Environment']);
        const level = difficulty > 1 ? ` (Level ${difficulty})` : '';
        
        return `${prefix} ${suffix}${level}`;
    }

    static getMaterialValue(materialType) {
        return MATERIALS[materialType]?.value || 1;
    }

    static getMaterialColor(materialType) {
        return MATERIALS[materialType]?.color || '#FFFFFF';
    }

    static getMaterialExperience(materialType) {
        return MATERIALS[materialType]?.experience || 1;
    }

    static getMaterialName(materialType) {
        return MATERIALS[materialType]?.name || 'Unknown';
    }
}