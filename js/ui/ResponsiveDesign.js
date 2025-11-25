// js/ui/ResponsiveDesign.js

import { Utils } from '../utils/Utils.js';

export class ResponsiveDesign {
    constructor(platformManager) {
        this.platformManager = platformManager;
        
        // Breakpoints
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1440
        };
        
        // Current breakpoint
        this.currentBreakpoint = this.getCurrentBreakpoint();
        
        // Layout configurations
        this.layouts = {
            mobile: {
                gridSize: 11,
                cellSize: 48,
                uiScale: 0.8,
                showLabels: false,
                compactMode: true
            },
            tablet: {
                gridSize: 13,
                cellSize: 56,
                uiScale: 0.9,
                showLabels: true,
                compactMode: false
            },
            desktop: {
                gridSize: 13,
                cellSize: 64,
                uiScale: 1.0,
                showLabels: true,
                compactMode: false
            },
            large: {
                gridSize: 15,
                cellSize: 72,
                uiScale: 1.2,
                showLabels: true,
                compactMode: false
            }
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.applyLayout();
        this.setupResponsiveUI();
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Handle media queries
        this.setupMediaQueries();
    }
    
    setupMediaQueries() {
        // Mobile
        const mobileQuery = window.matchMedia(`(max-width: ${this.breakpoints.mobile}px)`);
        mobileQuery.addListener((e) => {
            if (e.matches) {
                this.setBreakpoint('mobile');
            }
        });
        
        // Tablet
        const tabletQuery = window.matchMedia(`(min-width: ${this.breakpoints.mobile + 1}px) and (max-width: ${this.breakpoints.tablet}px)`);
        tabletQuery.addListener((e) => {
            if (e.matches) {
                this.setBreakpoint('tablet');
            }
        });
        
        // Desktop
        const desktopQuery = window.matchMedia(`(min-width: ${this.breakpoints.tablet + 1}px) and (max-width: ${this.breakpoints.desktop}px)`);
        desktopQuery.addListener((e) => {
            if (e.matches) {
                this.setBreakpoint('desktop');
            }
        });
        
        // Large
        const largeQuery = window.matchMedia(`(min-width: ${this.breakpoints.desktop + 1}px)`);
        largeQuery.addListener((e) => {
            if (e.matches) {
                this.setBreakpoint('large');
            }
        });
    }
    
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile) {
            return 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            return 'tablet';
        } else if (width <= this.breakpoints.desktop) {
            return 'desktop';
        } else {
            return 'large';
        }
    }
    
    setBreakpoint(breakpoint) {
        if (this.currentBreakpoint !== breakpoint) {
            this.currentBreakpoint = breakpoint;
            this.applyLayout();
            this.updateUI();
        }
    }
    
    handleResize() {
        const newBreakpoint = this.getCurrentBreakpoint();
        this.setBreakpoint(newBreakpoint);
    }
    
    handleOrientationChange() {
        // Handle orientation-specific adjustments
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }
        
        // Adjust layout for orientation
        this.adjustForOrientation();
    }
    
    applyLayout() {
        const layout = this.layouts[this.currentBreakpoint];
        
        // Apply layout settings
        document.body.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout', 'large-layout');
        document.body.classList.add(`${this.currentBreakpoint}-layout`);
        
        // Update CSS variables
        document.documentElement.style.setProperty('--grid-size', layout.gridSize);
        document.documentElement.style.setProperty('--cell-size', `${layout.cellSize}px`);
        document.documentElement.style.setProperty('--ui-scale', layout.uiScale);
        
        // Update canvas
        this.updateCanvas(layout);
        
        // Update UI elements
        this.updateUIElements(layout);
    }
    
    updateCanvas(layout) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        const canvasSize = layout.gridSize * layout.cellSize;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Update canvas container
        const container = canvas.parentElement;
        container.style.width = canvasSize + 'px';
        container.style.height = canvasSize + 'px';
    }
    
    updateUIElements(layout) {
        // Update game info bar
        const gameInfoBar = document.getElementById('gameInfoBar');
        if (gameInfoBar) {
            if (layout.compactMode) {
                gameInfoBar.classList.add('compact');
            } else {
                gameInfoBar.classList.remove('compact');
            }
        }
        
        // Update panels
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => {
            if (layout.compactMode) {
                panel.classList.add('compact');
            } else {
                panel.classList.remove('compact');
            }
        });
        
        // Update touch controls
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            if (this.currentBreakpoint === 'mobile') {
                touchControls.classList.remove('hidden');
            } else {
                touchControls.classList.add('hidden');
            }
        }
    }
    
    setupResponsiveUI() {
        // Set up responsive navigation
        this.setupResponsiveNavigation();
        
        // Set up responsive inventory
        this.setupResponsiveInventory();
        
        // Set up responsive dialogs
        this.setupResponsiveDialogs();
    }
    
    setupResponsiveNavigation() {
        // Adjust navigation based on screen size
        const navigation = document.querySelector('.navigation');
        if (!navigation) return;
        
        if (this.currentBreakpoint === 'mobile') {
            navigation.classList.add('mobile-nav');
            // Convert to hamburger menu
            this.createHamburgerMenu(navigation);
        } else {
            navigation.classList.remove('mobile-nav');
            // Restore normal navigation
            this.restoreNormalNavigation(navigation);
        }
    }
    
    createHamburgerMenu(navigation) {
        // Create hamburger menu button
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = '☰';
        
        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.style.display = 'none';
        
        // Move navigation items to mobile menu
        const navItems = navigation.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            mobileMenu.appendChild(item.cloneNode(true));
        });
        
        // Add event listeners
        hamburger.addEventListener('click', () => {
            mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        // Add to DOM
        navigation.appendChild(hamburger);
        navigation.appendChild(mobileMenu);
    }
    
    restoreNormalNavigation(navigation) {
        // Remove hamburger menu
        const hamburger = navigation.querySelector('.hamburger-menu');
        if (hamburger) {
            hamburger.remove();
        }
        
        // Remove mobile menu
        const mobileMenu = navigation.querySelector('.mobile-menu');
        if (mobileMenu) {
            mobileMenu.remove();
        }
    }
    
    setupResponsiveInventory() {
        // Adjust inventory grid based on screen size
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) return;
        
        const layout = this.layouts[this.currentBreakpoint];
        const columns = Math.floor(10 * layout.uiScale);
        const rows = Math.floor(4 * layout.uiScale);
        
        inventoryGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        inventoryGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }
    
    setupResponsiveDialogs() {
        // Adjust dialog size based on screen size
        const dialogs = document.querySelectorAll('.dialog');
        dialogs.forEach(dialog => {
            const layout = this.layouts[this.currentBreakpoint];
            
            if (this.currentBreakpoint === 'mobile') {
                dialog.style.width = '90vw';
                dialog.style.height = '80vh';
                dialog.style.margin = '10px';
            } else {
                dialog.style.width = '';
                dialog.style.height = '';
                dialog.style.margin = '';
            }
        });
    }
    
    adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Adjust for landscape
            document.body.classList.add('landscape-orientation');
            
            // Reduce UI height in landscape
            const gameInfoBar = document.getElementById('gameInfoBar');
            if (gameInfoBar) {
                gameInfoBar.style.height = '40px';
            }
        } else {
            // Adjust for portrait
            document.body.classList.add('portrait-orientation');
            
            // Increase UI height in portrait
            const gameInfoBar = document.getElementById('gameInfoBar');
            if (gameInfoBar) {
                gameInfoBar.style.height = '60px';
            }
        }
    }
    
    updateUI() {
        // Update all UI elements for current breakpoint
        this.updateUIElements(this.layouts[this.currentBreakpoint]);
        this.setupResponsiveNavigation();
        this.setupResponsiveInventory();
        this.setupResponsiveDialogs();
    }
    
    getLayout() {
        return this.layouts[this.currentBreakpoint];
    }
    
    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }
    
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }
    
    isTablet() {
        return this.currentBreakpoint === 'tablet';
    }
    
    isDesktop() {
        return this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'large';
    }
    
    addCustomBreakpoint(name, minWidth, maxWidth, layout) {
        this.breakpoints[name] = { min: minWidth, max: maxWidth };
        this.layouts[name] = layout;
        
        // Set up media query
        const query = window.matchMedia(`(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`);
        query.addListener((e) => {
            if (e.matches) {
                this.setBreakpoint(name);
            }
        });
    }
}