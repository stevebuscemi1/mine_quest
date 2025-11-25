// js/core/FogOfWar.js

import { VISIBILITY_RADIUS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class FogOfWar {
    constructor(radius = VISIBILITY_RADIUS) {
        this.radius = radius;
        this.discoveredCells = new Set();
        this.currentlyVisible = new Set();
        this.previouslyVisible = new Set();
        
        // Animation
        this.revealAnimations = new Map();
        this.fadeDuration = 500; // milliseconds
        
        // Visibility cache for performance
        this.visibilityCache = new Map();
        this.lastPlayerPos = null;
    }
    
    update(playerX, playerY) {
        const currentKey = Utils.coordToKey(playerX, playerY);
        
        // Check if player moved significantly
        if (this.lastPlayerPos === currentKey) {
            return;
        }
        
        this.lastPlayerPos = currentKey;
        
        // Store previously visible cells for fade animation
        this.previouslyVisible = new Set(this.currentlyVisible);
        
        // Clear current visibility
        this.currentlyVisible.clear();
        
        // Calculate new visibility using circular radius
        const radiusSquared = this.radius * this.radius;
        
        for (let y = -this.radius; y <= this.radius; y++) {
            for (let x = -this.radius; x <= this.radius; x++) {
                const distanceSquared = x * x + y * y;
                
                if (distanceSquared <= radiusSquared) {
                    const worldX = playerX + x;
                    const worldY = playerY + y;
                    const key = Utils.coordToKey(worldX, worldY);
                    
                    this.currentlyVisible.add(key);
                    this.discoveredCells.add(key);
                    
                    // Check if this is a newly discovered cell
                    if (!this.previouslyVisible.has(key)) {
                        this.startRevealAnimation(key);
                    }
                }
            }
        }
        
        // Update reveal animations
        this.updateRevealAnimations();
    }
    
    startRevealAnimation(key) {
        this.revealAnimations.set(key, {
            startTime: Date.now(),
            progress: 0
        });
    }
    
    updateRevealAnimations() {
        const now = Date.now();
        
        for (const [key, animation] of this.revealAnimations) {
            const elapsed = now - animation.startTime;
            animation.progress = Math.min(elapsed / this.fadeDuration, 1);
            
            if (animation.progress >= 1) {
                this.revealAnimations.delete(key);
            }
        }
    }
    
    isVisible(x, y) {
        return this.currentlyVisible.has(Utils.coordToKey(x, y));
    }
    
    isDiscovered(x, y) {
        return this.discoveredCells.has(Utils.coordToKey(x, y));
    }
    
    isPartiallyVisible(x, y) {
        const key = Utils.coordToKey(x, y);
        return this.revealAnimations.has(key);
    }
    
    getVisibilityAlpha(x, y) {
        const key = Utils.coordToKey(x, y);
        
        if (this.currentlyVisible.has(key)) {
            return 1.0;
        }
        
        if (this.revealAnimations.has(key)) {
            return this.revealAnimations.get(key).progress;
        }
        
        if (this.discoveredCells.has(key)) {
            return 0.3; // Dimly visible discovered areas
        }
        
        return 0.0; // Completely hidden
    }
    
    getEdgeVisibility(x, y) {
        // Check if cell is on the edge of visibility
        const key = Utils.coordToKey(x, y);
        
        if (!this.currentlyVisible.has(key)) {
            return 0;
        }
        
        // Check neighbors
        let hiddenNeighbors = 0;
        const neighbors = Utils.getNeighbors(x, y, true);
        
        for (const neighbor of neighbors) {
            if (!this.isVisible(neighbor.x, neighbor.y)) {
                hiddenNeighbors++;
            }
        }
        
        return hiddenNeighbors / neighbors.length;
    }
    
    revealArea(centerX, centerY, radius) {
        // Reveal a circular area (used for special effects)
        const radiusSquared = radius * radius;
        
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const distanceSquared = x * x + y * y;
                
                if (distanceSquared <= radiusSquared) {
                    const worldX = centerX + x;
                    const worldY = centerY + y;
                    const key = Utils.coordToKey(worldX, worldY);
                    
                    this.discoveredCells.add(key);
                    this.startRevealAnimation(key);
                }
            }
        }
    }
    
    reveal(x, y) {
        // Reveal a single cell (add to discovered and start reveal animation)
        const key = Utils.coordToKey(x, y);
        this.discoveredCells.add(key);
        this.startRevealAnimation(key);
    }
    
    hideArea(centerX, centerY, radius) {
        // Hide a circular area (used for special effects)
        const radiusSquared = radius * radius;
        
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const distanceSquared = x * x + y * y;
                
                if (distanceSquared <= radiusSquared) {
                    const worldX = centerX + x;
                    const worldY = centerY + y;
                    const key = Utils.coordToKey(worldX, worldY);
                    
                    this.discoveredCells.delete(key);
                    this.currentlyVisible.delete(key);
                }
            }
        }
    }
    
    reset() {
        this.discoveredCells.clear();
        this.currentlyVisible.clear();
        this.previouslyVisible.clear();
        this.revealAnimations.clear();
        this.lastPlayerPos = null;
    }
    
    getDiscoveryPercentage() {
        // Calculate percentage of area discovered
        const totalCells = this.visibilityCache.size || 1000;
        return (this.discoveredCells.size / totalCells) * 100;
    }
    
    getVisibleCellsInArea(x, y, width, height) {
        const visibleCells = [];
        
        for (let py = y; py < y + height; py++) {
            for (let px = x; px < x + width; px++) {
                if (this.isVisible(px, py)) {
                    visibleCells.push({ x: px, y: py });
                }
            }
        }
        
        return visibleCells;
    }
    
    getDiscoveredCellsInArea(x, y, width, height) {
        const discoveredCells = [];
        
        for (let py = y; py < y + height; py++) {
            for (let px = x; px < x + width; px++) {
                if (this.isDiscovered(px, py)) {
                    discoveredCells.push({ x: px, y: py });
                }
            }
        }
        
        return discoveredCells;
    }
    
    setRadius(newRadius) {
        this.radius = newRadius;
        this.update(this.lastPlayerPos ? Utils.keyToCoord(this.lastPlayerPos).x : 0,
                   this.lastPlayerPos ? Utils.keyToCoord(this.lastPlayerPos).y : 0);
    }
    
    getRadius() {
        return this.radius;
    }
    
    serialize() {
        return {
            discoveredCells: Array.from(this.discoveredCells),
            radius: this.radius
        };
    }
    
    deserialize(data) {
        this.discoveredCells = new Set(data.discoveredCells);
        this.radius = data.radius;
        this.currentlyVisible.clear();
        this.previouslyVisible.clear();
        this.revealAnimations.clear();
        this.lastPlayerPos = null;
    }
    
    render(ctx, viewport) {
        // Render fog of war effect over the entire viewport
        const { x: viewportX, y: viewportY } = viewport;
        
        // Draw fog over all cells
        for (let y = 0; y < 13; y++) { // GRID_SIZE is 13
            for (let x = 0; x < 13; x++) {
                const worldX = x + viewportX;
                const worldY = y + viewportY;
                
                // Get visibility alpha for this cell
                const alpha = 1.0 - this.getVisibilityAlpha(worldX, worldY);
                
                // Only draw fog if cell is not fully visible
                if (alpha > 0) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.fillRect(x * 64, y * 64, 64, 64); // CELL_SIZE is 64
                }
            }
        }
    }
}