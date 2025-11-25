// js/systems/CustomArea.js

import { VALIDATION, AREA_TYPES, CELL_TYPES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Area } from '../core/Area.js';

export class CustomArea {
    constructor() {
        this.areas = new Map();
        this.templates = new Map();
        this.categories = new Map();
        this.ratings = new Map();
        this.downloads = new Map();
        
        // Validation rules
        this.validationRules = {
            maxAreaSize: VALIDATION.MAX_AREA_SIZE,
            minAreaSize: VALIDATION.MIN_AREA_SIZE,
            maxAreaNameLength: VALIDATION.MAX_AREA_NAME_LENGTH,
            maxCreatorNameLength: VALIDATION.MAX_CREATOR_NAME_LENGTH,
            maxCustomAreas: VALIDATION.MAX_CUSTOM_AREAS
        };
        
        // Initialize templates
        this.initializeTemplates();
    }
    
    initializeTemplates() {
        // Empty templates for different area types
        this.templates.set('empty_mine', {
            name: 'Empty Mine',
            type: AREA_TYPES.MINE,
            width: 50,
            height: 50,
            grid: null,
            description: 'A blank mine template for creating custom areas'
        });
        
        this.templates.set('empty_cave', {
            name: 'Empty Cave',
            type: AREA_TYPES.CAVE,
            width: 60,
            height: 60,
            grid: null,
            description: 'A blank cave template for creating custom areas'
        });
        
        this.templates.set('arena', {
            name: 'Battle Arena',
            type: AREA_TYPES.MINE,
            width: 30,
            height: 30,
            grid: this.generateArenaTemplate(),
            description: 'A pre-built arena template for combat challenges'
        });
        
        this.templates.set('puzzle_room', {
            name: 'Puzzle Room',
            type: AREA_TYPES.ANCIENT_RUINS,
            width: 25,
            height: 25,
            grid: this.generatePuzzleTemplate(),
            description: 'A puzzle room template with challenges'
        });
    }
    
    generateArenaTemplate() {
        const width = 30;
        const height = 30;
        const grid = new Array(width * height).fill(CELL_TYPES.WALL);
        
        // Create arena floor
        for (let y = 5; y < height - 5; y++) {
            for (let x = 5; x < width - 5; x++) {
                grid[y * width + x] = CELL_TYPES.EMPTY;
            }
        }
        
        // Add some obstacles
        for (let i = 0; i < 10; i++) {
            const x = Utils.randomInt(7, width - 7);
            const y = Utils.randomInt(7, height - 7);
            grid[y * width + x] = CELL_TYPES.ROCK;
        }
        
        // Add spawn points
        grid[10 * width + 10] = CELL_TYPES.MERCHANT; // Player spawn
        grid[19 * width + 19] = CELL_TYPES.BOSS; // Enemy spawn
        
        return grid;
    }
    
    generatePuzzleTemplate() {
        const width = 25;
        const height = 25;
        const grid = new Array(width * height).fill(CELL_TYPES.WALL);
        
        // Create puzzle rooms
        const rooms = [
            { x: 2, y: 2, w: 8, h: 8 },
            { x: 15, y: 2, w: 8, h: 8 },
            { x: 2, y: 15, w: 8, h: 8 },
            { x: 15, y: 15, w: 8, h: 8 }
        ];
        
        // Carve rooms
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x < width && y < height) {
                        grid[y * width + x] = CELL_TYPES.EMPTY;
                    }
                }
            }
        }
        
        // Add puzzle elements
        grid[6 * width + 6] = CELL_TYPES.CHEST;
        grid[18 * width + 6] = CELL_TYPES.DOOR;
        grid[6 * width + 18] = CELL_TYPES.MERCHANT;
        grid[18 * width + 18] = CELL_TYPES.DOOR;
        
        return grid;
    }
    
    createAreaFromTemplate(templateId, creatorName) {
        const template = this.templates.get(templateId);
        if (!template) {
            return { success: false, reason: 'Template not found' };
        }
        
        const area = new Area(template.width, template.height, template.type);
        area.name = template.name;
        area.isCustom = true;
        area.creatorName = creatorName;
        
        if (template.grid) {
            area.grid = [...template.grid];
        } else {
            area.generate(); // Generate random area for empty templates
        }
        
        return { success: true, area: area };
    }
    
    createBlankArea(width, height, type, creatorName) {
        // Validate dimensions
        if (width < this.validationRules.minAreaSize || width > this.validationRules.maxAreaSize) {
            return { success: false, reason: 'Invalid area width' };
        }
        
        if (height < this.validationRules.minAreaSize || height > this.validationRules.maxAreaSize) {
            return { success: false, reason: 'Invalid area height' };
        }
        
        // Validate creator name
        if (creatorName.length > this.validationRules.maxCreatorNameLength) {
            return { success: false, reason: 'Creator name too long' };
        }
        
        const area = new Area(width, height, type);
        area.isCustom = true;
        area.creatorName = creatorName;
        area.name = `${creatorName}'s Custom Area`;
        
        return { success: true, area: area };
    }
    
    saveArea(area, metadata = {}) {
        // Validate area
        const validation = this.validateArea(area);
        if (!validation.isValid) {
            return { success: false, reason: validation.reason };
        }
        
        // Generate unique ID
        const id = this.generateAreaId();
        
        // Prepare area data
        const areaData = {
            id: id,
            area: area.serialize(),
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                version: '1.0.0'
            }
        };
        
        // Save to storage
        this.areas.set(id, areaData);
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        return { success: true, id: id };
    }
    
    loadArea(id) {
        const areaData = this.areas.get(id);
        if (!areaData) {
            return { success: false, reason: 'Area not found' };
        }
        
        const area = new Area();
        area.deserialize(areaData.area);
        
        return { success: true, area: area, metadata: areaData.metadata };
    }
    
    deleteArea(id) {
        if (!this.areas.has(id)) {
            return { success: false, reason: 'Area not found' };
        }
        
        this.areas.delete(id);
        this.ratings.delete(id);
        this.downloads.delete(id);
        
        this.saveToLocalStorage();
        
        return { success: true };
    }
    
    validateArea(area) {
        // Check dimensions
        if (area.width < this.validationRules.minAreaSize || area.width > this.validationRules.maxAreaSize) {
            return { isValid: false, reason: 'Area width out of bounds' };
        }
        
        if (area.height < this.validationRules.minAreaSize || area.height > this.validationRules.maxAreaSize) {
            return { isValid: false, reason: 'Area height out of bounds' };
        }
        
        // Check name
        if (!area.name || area.name.length === 0) {
            return { isValid: false, reason: 'Area name is required' };
        }
        
        if (area.name.length > this.validationRules.maxAreaNameLength) {
            return { isValid: false, reason: 'Area name too long' };
        }
        
        // Check creator name
        if (!area.creatorName || area.creatorName.length === 0) {
            return { isValid: false, reason: 'Creator name is required' };
        }
        
        if (area.creatorName.length > this.validationRules.maxCreatorNameLength) {
            return { isValid: false, reason: 'Creator name too long' };
        }
        
        // Check grid
        if (!area.grid || area.grid.length !== area.width * area.height) {
            return { isValid: false, reason: 'Invalid grid data' };
        }
        
        // Check for valid cell types
        for (const cell of area.grid) {
            if (cell < 0 || cell > 30) { // Assuming max cell type is 30
                return { isValid: false, reason: 'Invalid cell type in grid' };
            }
        }
        
        // Check for required elements
        let hasExit = false;
        let hasPlayerStart = false;
        
        for (let y = 0; y < area.height; y++) {
            for (let x = 0; x < area.width; x++) {
                const cell = area.getCell(x, y);
                if (cell === CELL_TYPES.DOOR) {
                    hasExit = true;
                }
                if (cell === CELL_TYPES.EMPTY && !hasPlayerStart) {
                    hasPlayerStart = true;
                }
            }
        }
        
        if (!hasExit) {
            return { isValid: false, reason: 'Area must have at least one exit' };
        }
        
        return { isValid: true };
    }
    
    rateArea(id, rating, userId) {
        if (!this.areas.has(id)) {
            return { success: false, reason: 'Area not found' };
        }
        
        if (rating < 1 || rating > 5) {
            return { success: false, reason: 'Rating must be between 1 and 5' };
        }
        
        if (!this.ratings.has(id)) {
            this.ratings.set(id, new Map());
        }
        
        const areaRatings = this.ratings.get(id);
        areaRatings.set(userId, rating);
        
        this.saveToLocalStorage();
        
        const averageRating = this.getAverageRating(id);
        return { success: true, averageRating: averageRating };
    }
    
    getAverageRating(id) {
        const areaRatings = this.ratings.get(id);
        if (!areaRatings || areaRatings.size === 0) {
            return 0;
        }
        
        let total = 0;
        for (const rating of areaRatings.values()) {
            total += rating;
        }
        
        return total / areaRatings.size;
    }
    
    downloadArea(id) {
        if (!this.areas.has(id)) {
            return { success: false, reason: 'Area not found' };
        }
        
        // Increment download count
        const currentCount = this.downloads.get(id) || 0;
        this.downloads.set(id, currentCount + 1);
        
        this.saveToLocalStorage();
        
        // Return area data for download
        const areaData = this.areas.get(id);
        return { 
            success: true, 
            data: JSON.stringify(areaData, null, 2),
            filename: `${areaData.area.name.replace(/[^a-z0-9]/gi, '_')}.json`
        };
    }
    
    importArea(jsonData, userId) {
        try {
            const areaData = JSON.parse(jsonData);
            
            // Validate imported data
            const tempArea = new Area();
            tempArea.deserialize(areaData.area);
            
            const validation = this.validateArea(tempArea);
            if (!validation.isValid) {
                return { success: false, reason: validation.reason };
            }
            
            // Generate new ID to avoid conflicts
            const newId = this.generateAreaId();
            areaData.id = newId;
            areaData.metadata.importedAt = Date.now();
            areaData.metadata.importedBy = userId;
            
            this.areas.set(newId, areaData);
            this.saveToLocalStorage();
            
            return { success: true, id: newId };
        } catch (error) {
            return { success: false, reason: 'Invalid JSON data' };
        }
    }
    
    searchAreas(query, filters = {}) {
        const results = [];
        
        for (const [id, areaData] of this.areas) {
            const area = areaData.area;
            const metadata = areaData.metadata;
            
            // Text search
            if (query) {
                const searchText = query.toLowerCase();
                const nameMatch = area.name.toLowerCase().includes(searchText);
                const creatorMatch = area.creatorName.toLowerCase().includes(searchText);
                
                if (!nameMatch && !creatorMatch) {
                    continue;
                }
            }
            
            // Filter by type
            if (filters.type && area.type !== filters.type) {
                continue;
            }
            
            // Filter by difficulty
            if (filters.difficulty && area.difficulty !== filters.difficulty) {
                continue;
            }
            
            // Filter by rating
            if (filters.minRating) {
                const avgRating = this.getAverageRating(id);
                if (avgRating < filters.minRating) {
                    continue;
                }
            }
            
            results.push({
                id: id,
                name: area.name,
                creatorName: area.creatorName,
                type: area.type,
                difficulty: area.difficulty,
                rating: this.getAverageRating(id),
                downloads: this.downloads.get(id) || 0,
                createdAt: metadata.createdAt
            });
        }
        
        // Sort results
        results.sort((a, b) => {
            switch (filters.sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'newest':
                    return b.createdAt - a.createdAt;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return b.rating - a.rating;
            }
        });
        
        return results;
    }
    
    getAreaList() {
        const list = [];
        
        for (const [id, areaData] of this.areas) {
            const area = areaData.area;
            list.push({
                id: id,
                name: area.name,
                creatorName: area.creatorName,
                type: area.type,
                difficulty: area.difficulty,
                rating: this.getAverageRating(id),
                downloads: this.downloads.get(id) || 0,
                createdAt: areaData.metadata.createdAt
            });
        }
        
        return list;
    }
    
    getTemplates() {
        const templateList = [];
        
        for (const [id, template] of this.templates) {
            templateList.push({
                id: id,
                name: template.name,
                type: template.type,
                width: template.width,
                height: template.height,
                description: template.description
            });
        }
        
        return templateList;
    }
    
    generateAreaId() {
        return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    saveToLocalStorage() {
        try {
            const data = {
                areas: Array.from(this.areas.entries()),
                ratings: Array.from(this.ratings.entries()),
                downloads: Array.from(this.downloads.entries())
            };
            
            localStorage.setItem('minequest_custom_areas', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save custom areas:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('minequest_custom_areas');
            if (data) {
                const parsed = JSON.parse(data);
                
                this.areas = new Map(parsed.areas || []);
                this.ratings = new Map(parsed.ratings || []);
                this.downloads = new Map(parsed.downloads || []);
            }
        } catch (error) {
            console.error('Failed to load custom areas:', error);
        }
    }
    
    clearAllAreas() {
        this.areas.clear();
        this.ratings.clear();
        this.downloads.clear();
        this.saveToLocalStorage();
    }
    
    getStatistics() {
        const totalAreas = this.areas.size;
        const totalRatings = Array.from(this.ratings.values()).reduce((sum, ratings) => sum + ratings.size, 0);
        const totalDownloads = Array.from(this.downloads.values()).reduce((sum, count) => sum + count, 0);
        
        const typeDistribution = new Map();
        for (const areaData of this.areas.values()) {
            const type = areaData.area.type;
            typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
        }
        
        return {
            totalAreas,
            totalRatings,
            totalDownloads,
            typeDistribution: Object.fromEntries(typeDistribution),
            averageRating: this.getGlobalAverageRating()
        };
    }
    
    getGlobalAverageRating() {
        if (this.ratings.size === 0) return 0;
        
        let totalRating = 0;
        let totalRatings = 0;
        
        for (const areaRatings of this.ratings.values()) {
            for (const rating of areaRatings.values()) {
                totalRating += rating;
                totalRatings++;
            }
        }
        
        return totalRatings > 0 ? totalRating / totalRatings : 0;
    }
}