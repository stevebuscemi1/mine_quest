// js/utils/responsiveDesign.js

/**
 * Responsive Design Manager
 * Handles dynamic UI adjustments for different screen sizes and user preferences
 */

export class ResponsiveDesign {
    constructor(game) {
        this.game = game;
        this.currentLayout = 'default';
        this.inventoryColumns = 10;
        this.inventoryRows = 4;
        
        this.init();
    }
    
    init() {
        // Listen for window resize events
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial setup
        this.handleResize();
        
        // Listen for custom events
        document.addEventListener('inventoryLayoutChanged', (e) => {
            this.setInventoryLayout(e.detail.columns, e.detail.rows);
        });
        
        console.log('ResponsiveDesign: Initialized');
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`ResponsiveDesign: Window resized to ${width}x${height}`);
        
        // Adjust UI based on screen size
        this.adjustForScreenSize(width, height);
    }
    
    adjustForScreenSize(width, height) {
        // Mobile devices
        if (width <= 768) {
            this.setMobileLayout();
        }
        // Tablets
        else if (width <= 1024) {
            this.setTabletLayout();
        }
        // Desktop
        else {
            this.setDesktopLayout();
        }
    }
    
    setMobileLayout() {
        console.log('ResponsiveDesign: Applying mobile layout');
        this.currentLayout = 'mobile';

        // Inventory remains fixed at 8x5
        this.setInventoryLayout(8, 5);
        
        // Adjust panel sizes
        this.adjustPanelSizes(0.95, 0.9);
        
        // Adjust button sizes
        this.adjustButtonSizes(0.8);
    }
    
    setTabletLayout() {
        console.log('ResponsiveDesign: Applying tablet layout');
        this.currentLayout = 'tablet';

        // Inventory remains fixed at 8x5
        this.setInventoryLayout(8, 5);
        
        // Adjust panel sizes
        this.adjustPanelSizes(0.85, 0.8);
        
        // Adjust button sizes
        this.adjustButtonSizes(0.9);
    }
    
    setDesktopLayout() {
        console.log('ResponsiveDesign: Applying desktop layout');
        this.currentLayout = 'desktop';

        // Inventory remains fixed at 8x5
        this.setInventoryLayout(8, 5);
        
        // Default panel sizes
        this.adjustPanelSizes(1.0, 1.0);
        
        // Default button sizes
        this.adjustButtonSizes(1.0);
    }
    
    setInventoryLayout(columns, rows) {
        this.inventoryColumns = columns;
        this.inventoryRows = rows;
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--inventory-columns', columns);
        document.documentElement.style.setProperty('--inventory-rows', rows);
        
        // Update inventory grid if UI exists
        if (this.game && this.game.ui && this.game.ui.inventoryGrid) {
            this.game.ui.inventoryGrid.style.gridTemplateColumns = `repeat(${columns}, 75px)`;
            this.game.ui.inventoryGrid.style.gridTemplateRows = `repeat(${rows}, 75px)`;
            
            // Recreate slots if needed
            const currentSlots = this.game.ui.inventorySlots.length;
            const neededSlots = columns * rows;
            
            if (currentSlots !== neededSlots) {
                console.log(`ResponsiveDesign: Adjusting inventory slots from ${currentSlots} to ${neededSlots}`);
                this.adjustInventorySlots(neededSlots);
            }
        }
        
        console.log(`ResponsiveDesign: Inventory layout set to ${columns}x${rows}`);
    }
    
    adjustInventorySlots(neededSlots) {
        if (!this.game || !this.game.ui) return;
        
        const currentSlots = this.game.ui.inventorySlots.length;
        
        if (neededSlots > currentSlots) {
            // Add more slots
            for (let i = currentSlots; i < neededSlots; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                slot.dataset.index = i;
                
                // Add event listeners
                slot.draggable = true;
                slot.addEventListener('dragstart', (e) => this.game.ui.handleDragStart(e));
                slot.addEventListener('dragover', (e) => this.game.ui.handleDragOver(e));
                slot.addEventListener('drop', (e) => this.game.ui.handleDrop(e));
                slot.addEventListener('dragend', (e) => this.game.ui.handleDragEnd(e));
                slot.addEventListener('click', (e) => this.game.ui.handleInventoryClick(e));
                slot.addEventListener('contextmenu', (e) => this.game.ui.handleInventoryRightClick(e));
                
                this.game.ui.inventoryGrid.appendChild(slot);
                this.game.ui.inventorySlots.push(slot);
            }
        } else if (neededSlots < currentSlots) {
            // Remove excess slots
            for (let i = currentSlots - 1; i >= neededSlots; i--) {
                const slot = this.game.ui.inventorySlots[i];
                if (slot) {
                    slot.remove();
                    this.game.ui.inventorySlots.pop();
                }
            }
        }
        
        // Update inventory display
        if (this.game.ui.updateInventory && this.game.currentMode && 
            this.game.currentMode.player && this.game.currentMode.player.inventory) {
            this.game.ui.updateInventory(this.game.currentMode.player.inventory);
        }
    }
    
    adjustPanelSizes(widthScale, heightScale) {
        // Update CSS custom properties for panel scaling
        document.documentElement.style.setProperty('--panel-width-scale', widthScale);
        document.documentElement.style.setProperty('--panel-height-scale', heightScale);
    }
    
    adjustButtonSizes(scale) {
        // Update CSS custom properties for button scaling
        document.documentElement.style.setProperty('--button-scale', scale);
    }
    
    // Public API for manual layout changes
    setCustomInventoryLayout(columns, rows) {
        if (columns < 5 || columns > 15 || rows < 2 || rows > 8) {
            console.warn('ResponsiveDesign: Invalid inventory layout dimensions');
            return false;
        }
        
        this.setInventoryLayout(columns, rows);
        return true;
    }
    
    getCurrentLayout() {
        return {
            layout: this.currentLayout,
            inventoryColumns: this.inventoryColumns,
            inventoryRows: this.inventoryRows,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };
    }
    
    // Force a layout refresh
    refreshLayout() {
        this.handleResize();
    }
}
