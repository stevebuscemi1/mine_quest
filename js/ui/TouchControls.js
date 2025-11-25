// js/ui/TouchControls.js

import { Utils } from '../utils/Utils.js';

export class TouchControls {
    constructor(game) {
        this.game = game;
        
        // Control elements
        this.controls = {
            dPad: null,
            actionButtons: null,
            swipeArea: null
        };
        
        // Touch state
        this.touches = new Map();
        this.gestures = new Map();
        this.activeTouches = new Set();
        
        // D-Pad state
        this.dPadState = {
            up: false,
            down: false,
            left: false,
            right: false,
            center: false
        };
        
        // Action button state
        this.actionState = {
            mine: false,
            interact: false,
            inventory: false,
            menu: false
        };
        
        // Gesture settings
        this.gestureSettings = {
            swipeThreshold: 50,
            tapThreshold: 200,
            longPressThreshold: 500,
            doubleTapThreshold: 300,
            pinchThreshold: 20
        };
        
        // Haptic feedback
        this.hapticEnabled = 'vibrate' in navigator;
        
        // Visual feedback
        this.visualFeedback = true;
        this.feedbackDuration = 150;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.createControls();
        this.setupEventListeners();
        this.setupGestures();
    }
    
    createControls() {
        // Create D-Pad
        this.createDPad();
        
        // Create action buttons
        this.createActionButtons();
        
        // Create swipe area
        this.createSwipeArea();
    }
    
    createDPad() {
        const dPad = document.createElement('div');
        dPad.className = 'touch-dpad';
        dPad.innerHTML = `
            <div class="dpad-base">
                <div class="dpad-button up" data-action="up">
                    <div class="dpad-arrow">↑</div>
                </div>
                <div class="dpad-button down" data-action="down">
                    <div class="dpad-arrow">↓</div>
                </div>
                <div class="dpad-button left" data-action="left">
                    <div class="dpad-arrow">←</div>
                </div>
                <div class="dpad-button right" data-action="right">
                    <div class="dpad-arrow">→</div>
                </div>
                <div class="dpad-center" data-action="center">
                    <div class="dpad-dot"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dPad);
        this.controls.dPad = dPad;
    }
    
    createActionButtons() {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'touch-action-buttons';
        actionButtons.innerHTML = `
            <div class="action-buttons-container">
                <div class="action-button-group primary">
                    <button class="action-btn mine" data-action="mine">
                        <div class="btn-icon">⛏️</div>
                        <div class="btn-label">Mine</div>
                    </button>
                </div>
                <div class="action-button-group secondary">
                    <button class="action-btn interact" data-action="interact">
                        <div class="btn-icon">🤝</div>
                        <div class="btn-label">Interact</div>
                    </button>
                </div>
                <div class="action-button-group tertiary">
                    <button class="action-btn inventory" data-action="inventory">
                        <div class="btn-icon">🎒</div>
                        <div class="btn-label">Inv</div>
                    </button>
                </div>
                <div class="action-button-group quaternary">
                    <button class="action-btn menu" data-action="menu">
                        <div class="btn-icon">☰</div>
                        <div class="btn-label">Menu</div>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(actionButtons);
        this.controls.actionButtons = actionButtons;
    }
    
    createSwipeArea() {
        const swipeArea = document.createElement('div');
        swipeArea.className = 'touch-swipe-area';
        swipeArea.innerHTML = `
            <div class="swipe-indicator">
                <div class="swipe-arrow swipe-up">↑</div>
                <div class="swipe-arrow swipe-down">↓</div>
                <div class="swipe-arrow swipe-left">←</div>
                <div class="swipe-arrow swipe-right">→</div>
            </div>
        `;
        
        document.body.appendChild(swipeArea);
        this.controls.swipeArea = swipeArea;
    }
    
    setupEventListeners() {
        // D-Pad events
        this.setupDPadEvents();
        
        // Action button events
        this.setupActionButtonEvents();
        
        // Swipe area events
        this.setupSwipeAreaEvents();
        
        // Global touch events
        this.setupGlobalTouchEvents();
    }
    
    setupDPadEvents() {
        const dPadButtons = this.controls.dPad.querySelectorAll('.dpad-button');
        
        dPadButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleDPadTouch(action, true, e);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleDPadTouch(action, false, e);
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleDPadTouch(action, false, e);
            });
        });
    }
    
    setupActionButtonEvents() {
        const actionButtons = this.controls.actionButtons.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleActionButtonTouch(action, true, e);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleActionButtonTouch(action, false, e);
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                const action = button.dataset.action;
                this.handleActionButtonTouch(action, false, e);
            });
        });
    }
    
    setupSwipeAreaEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        this.controls.swipeArea.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        this.controls.swipeArea.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            this.handleSwipe(deltaX, deltaY, deltaTime);
        });
    }
    
    setupGlobalTouchEvents() {
        document.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        });
        
        document.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        });
        
        document.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        });
        
        document.addEventListener('touchcancel', (e) => {
            this.handleTouchCancel(e);
        });
    }
    
    setupGestures() {
        // Set up gesture recognition
        this.gestures.set('tap', {
            threshold: this.gestureSettings.tapThreshold,
            handler: this.handleTap.bind(this)
        });
        
        this.gestures.set('longPress', {
            threshold: this.gestureSettings.longPressThreshold,
            handler: this.handleLongPress.bind(this)
        });
        
        this.gestures.set('doubleTap', {
            threshold: this.gestureSettings.doubleTapThreshold,
            handler: this.handleDoubleTap.bind(this)
        });
        
        this.gestures.set('pinch', {
            threshold: this.gestureSettings.pinchThreshold,
            handler: this.handlePinch.bind(this)
        });
    }
    
    handleDPadTouch(action, pressed, event) {
        this.dPadState[action] = pressed;
        
        // Update visual feedback
        if (this.visualFeedback) {
            const button = this.controls.dPad.querySelector(`[data-action="${action}"]`);
            if (pressed) {
                button.classList.add('active');
                this.hapticFeedback(50);
            } else {
                button.classList.remove('active');
            }
        }
        
        // Map to game controls
        this.mapDPadToGameControls(action, pressed);
    }
    
    handleActionButtonTouch(action, pressed, event) {
        this.actionState[action] = pressed;
        
        // Update visual feedback
        if (this.visualFeedback) {
            const button = this.controls.actionButtons.querySelector(`[data-action="${action}"]`);
            if (pressed) {
                button.classList.add('active');
                this.hapticFeedback(50);
            } else {
                button.classList.remove('active');
            }
        }
        
        // Map to game controls
        this.mapActionToGameControls(action, pressed);
    }
    
    handleSwipe(deltaX, deltaY, deltaTime) {
        const minSwipeDistance = this.gestureSettings.swipeThreshold;
        const maxSwipeTime = 300;
        
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return;
        }
        
        if (deltaTime > maxSwipeTime) {
            return;
        }
        
        let direction = '';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        // Show swipe indicator
        this.showSwipeIndicator(direction);
        
        // Handle swipe action
        this.handleSwipeAction(direction);
        
        // Haptic feedback
        this.hapticFeedback(100);
    }
    
    handleTouchStart(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now(),
                currentX: touch.clientX,
                currentY: touch.clientY
            });
            this.activeTouches.add(touch.identifier);
        }
    }
    
    handleTouchMove(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchData = this.touches.get(touch.identifier);
            
            if (touchData) {
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
            }
        }
    }
    
    handleTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchData = this.touches.get(touch.identifier);
            
            if (touchData) {
                const deltaX = touchData.currentX - touchData.startX;
                const deltaY = touchData.currentY - touchData.startY;
                const deltaTime = Date.now() - touchData.startTime;
                
                // Check for gestures
                this.checkGestures(touchData, deltaX, deltaY, deltaTime);
                
                this.touches.delete(touch.identifier);
                this.activeTouches.delete(touch.identifier);
            }
        }
    }
    
    handleTouchCancel(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
            this.activeTouches.delete(touch.identifier);
        }
    }
    
    checkGestures(touchData, deltaX, deltaY, deltaTime) {
        // Check for tap
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < this.gestureSettings.tapThreshold) {
            this.handleTap(touchData);
        }
        
        // Check for long press
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime > this.gestureSettings.longPressThreshold) {
            this.handleLongPress(touchData);
        }
    }
    
    handleTap(touchData) {
        // Handle tap gesture
        console.log('Tap detected');
    }
    
    handleLongPress(touchData) {
        // Handle long press gesture
        console.log('Long press detected');
        this.hapticFeedback(200);
    }
    
    handleDoubleTap(touchData) {
        // Handle double tap gesture
        console.log('Double tap detected');
    }
    
    handlePinch(scale) {
        // Handle pinch gesture
        console.log('Pinch detected:', scale);
    }
    
    mapDPadToGameControls(action, pressed) {
        const controlMap = {
            'up': { key: 'KeyW', pressed: pressed },
            'down': { key: 'KeyS', pressed: pressed },
            'left': { key: 'KeyA', pressed: pressed },
            'right': { key: 'KeyD', pressed: pressed },
            'center': { key: 'Space', pressed: pressed }
        };
        
        const control = controlMap[action];
        if (control) {
            if (pressed) {
                this.game.input.keyboard.add(control.key);
            } else {
                this.game.input.keyboard.delete(control.key);
            }
        }
    }
    
    mapActionToGameControls(action, pressed) {
        const controlMap = {
            'mine': { key: 'Space', pressed: pressed },
            'interact': { key: 'KeyF', pressed: pressed },
            'inventory': { key: 'KeyI', pressed: pressed },
            'menu': { key: 'Escape', pressed: pressed }
        };
        
        const control = controlMap[action];
        if (control) {
            if (pressed) {
                this.game.input.keyboard.add(control.key);
            } else {
                this.game.input.keyboard.delete(control.key);
            }
        }
    }
    
    handleSwipeAction(direction) {
        // Handle swipe actions
        switch (direction) {
            case 'up':
                // Jump or use item
                break;
            case 'down':
                // Crouch or special action
                break;
            case 'left':
                // Switch to previous item
                break;
            case 'right':
                // Switch to next item
                break;
        }
    }
    
    showSwipeIndicator(direction) {
        const indicator = this.controls.swipeArea.querySelector(`.swipe-${direction}`);
        if (indicator) {
            indicator.classList.add('active');
            setTimeout(() => {
                indicator.classList.remove('active');
            }, this.feedbackDuration);
        }
    }
    
    hapticFeedback(duration) {
        if (this.hapticEnabled) {
            navigator.vibrate(duration);
        }
    }
    
    show() {
        this.controls.dPad.style.display = 'block';
        this.controls.actionButtons.style.display = 'block';
        this.controls.swipeArea.style.display = 'block';
    }
    
    hide() {
        this.controls.dPad.style.display = 'none';
        this.controls.actionButtons.style.display = 'none';
        this.controls.swipeArea.style.display = 'none';
    }
    
    setPosition(position) {
        // Position controls based on device
        if (this.game.platformManager.isSteamDeck) {
            this.positionForSteamDeck();
        } else if (this.game.platformManager.isMobile) {
            this.positionForMobile();
        } else {
            this.positionForDesktop();
        }
    }
    
    positionForSteamDeck() {
        this.controls.dPad.style.bottom = '60px';
        this.controls.dPad.style.left = '60px';
        
        this.controls.actionButtons.style.bottom = '60px';
        this.controls.actionButtons.style.right = '60px';
    }
    
    positionForMobile() {
        this.controls.dPad.style.bottom = '20px';
        this.controls.dPad.style.left = '20px';
        
        this.controls.actionButtons.style.bottom = '20px';
        this.controls.actionButtons.style.right = '20px';
    }
    
    positionForDesktop() {
        // Hide touch controls on desktop
        this.hide();
    }
    
    updateLayout(breakpoint) {
        // Update control layout based on breakpoint
        switch (breakpoint) {
            case 'mobile':
                this.controls.dPad.style.transform = 'scale(0.8)';
                this.controls.actionButtons.style.transform = 'scale(0.8)';
                break;
            case 'tablet':
                this.controls.dPad.style.transform = 'scale(0.9)';
                this.controls.actionButtons.style.transform = 'scale(0.9)';
                break;
            case 'desktop':
                this.controls.dPad.style.transform = 'scale(1.0)';
                this.controls.actionButtons.style.transform = 'scale(1.0)';
                break;
        }
    }
    
    setVisualFeedback(enabled) {
        this.visualFeedback = enabled;
    }
    
    setHapticFeedback(enabled) {
        this.hapticEnabled = enabled && 'vibrate' in navigator;
    }
    
    getState() {
        return {
            dPad: { ...this.dPadState },
            action: { ...this.actionState },
            activeTouches: Array.from(this.activeTouches)
        };
    }
    
    cleanup() {
        // Remove controls
        if (this.controls.dPad) {
            this.controls.dPad.remove();
        }
        if (this.controls.actionButtons) {
            this.controls.actionButtons.remove();
        }
        if (this.controls.swipeArea) {
            this.controls.swipeArea.remove();
        }
        
        // Clear state
        this.touches.clear();
        this.activeTouches.clear();
    }
}