// js/ui/StartPage.js

import { Utils } from '../utils/Utils.js';

export class StartPage {
    constructor() {
        this.container = document.getElementById('startPage');
        this.particles = [];
        this.animationFrame = null;
        this.lastTime = 0;
        
        // Background layers
        this.layers = {
            layer1: this.container.querySelector('.layer-1'),
            layer2: this.container.querySelector('.layer-2'),
            layer3: this.container.querySelector('.layer-3')
        };
        
        // UI elements
        this.title = this.container.querySelector('.game-title');
        this.subtitle = this.container.querySelector('.subtitle');
        this.menuButtons = this.container.querySelector('.menu-buttons');
        
        // State
        this.isVisible = true;
        this.isTransitioning = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('StartPage: Initializing...');
        
        // Check if elements exist
        this.debugCheckElements();
        
        this.createParticles();
        this.setupEventListeners();
        this.startAnimation();
        this.initializeParallax();
        this.addKeyboardNavigation();
        
        // Ensure proper z-index
        this.container.style.zIndex = '1000';
        
        console.log('StartPage: Initialization complete');
    }
    
    debugCheckElements() {
        console.log('StartPage: Checking elements...');
        
        if (!this.container) {
            console.error('StartPage: Container element not found!');
            return;
        }
        
        if (!this.menuButtons) {
            console.error('StartPage: Menu buttons container not found!');
            return;
        }
        
        const buttons = this.container.querySelectorAll('.menu-btn');
        console.log(`StartPage: Found ${buttons.length} menu buttons`);
        
        buttons.forEach((button, index) => {
            console.log(`StartPage: Button ${index} - ID: ${button.id}, Text: ${button.textContent}`);
        });
    }
    
    createParticles() {
        for (let i = 0; i < 50; i++) {
            this.createParticle(true);
        }
    }
    
    createParticle(initial = false) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Utils.randomFloat(1, 3);
        const opacity = Utils.randomFloat(0.3, 0.8);
        const duration = Utils.randomFloat(10, 20);
        const delay = initial ? Utils.randomFloat(0, 10) : 0;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.opacity = opacity;
        particle.style.left = Utils.randomFloat(0, 100) + '%';
        particle.style.animationDelay = delay + 's';
        particle.style.animationDuration = duration + 's';
        
        this.container.querySelector('.animated-background').appendChild(particle);
        this.particles.push({
            element: particle,
            x: parseFloat(particle.style.left),
            y: -10,
            speed: Utils.randomFloat(0.5, 2),
            size: size,
            opacity: opacity,
            duration: duration
        });
    }
    
    setupEventListeners() {
        console.log('StartPage: Setting up event listeners...');
        
        // Button click effects
        const buttons = this.container.querySelectorAll('.menu-btn');
        console.log(`StartPage: Setting up listeners for ${buttons.length} buttons`);
        
        buttons.forEach((button, index) => {
            console.log(`StartPage: Adding click listener to button ${index}: ${button.id}`);
            
            // Add click listener
            button.addEventListener('click', (e) => {
                console.log(`StartPage: Button clicked! ID: ${button.id}, Text: ${button.textContent}`);
                
                // Check for shift+click on Start Quest button to enter debug mode
                if (button.id === 'startStandard' && e.shiftKey) {
                    console.log('StartPage: Shift+Click detected! Starting DEBUG MODE...');
                    this.createClickEffect(e);
                    
                    // Prevent multiple clicks during transition
                    if (this.isTransitioning) {
                        console.log('StartPage: Already transitioning, ignoring click');
                        return;
                    }
                    
                    this.isTransitioning = true;
                    this.startGame('debug');
                    return;
                }
                
                this.createClickEffect(e);
                this.handleButtonClick(e);
            });
            
            // Add hover effects
            button.addEventListener('mouseenter', (e) => {
                console.log(`StartPage: Mouse enter on button: ${button.id}`);
                this.createHoverEffect(e.target);
            });
            
            button.addEventListener('mouseleave', (e) => {
                console.log(`StartPage: Mouse leave on button: ${button.id}`);
                this.removeHoverEffect(e.target);
            });
        });
        
        // Mouse movement for parallax
        document.addEventListener('mousemove', (e) => {
            this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });
        
        // Touch movement for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
                this.targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
            }
        });
        
        console.log('StartPage: Event listeners set up complete');
    }
    
    handleButtonClick(e) {
        console.log('StartPage: handleButtonClick called');
        
        const button = e.currentTarget;
        const action = button.id.replace('start', '').toLowerCase();
        
        console.log(`StartPage: Button action: ${action}`);
        
        // Prevent multiple clicks during transition
        if (this.isTransitioning) {
            console.log('StartPage: Already transitioning, ignoring click');
            return;
        }
        
        this.isTransitioning = true;
        
        // Handle different button actions
        switch (action) {
            case 'loadquest':
                console.log('StartPage: Showing load game dialog');
                this.showLoadGameDialog();
                break;
            case 'standard':
                console.log('StartPage: Starting standard game');
                this.startGame('standard');
                break;
            case 'challenges':
                console.log('StartPage: Showing challenges dialog');
                this.showChallengesDialog();
                break;
            case 'options':
                console.log('StartPage: Showing options dialog');
                this.showOptionsDialog();
                break;
            case 'howtoplay':
                console.log('StartPage: Showing how to play dialog');
                this.showHowToPlayDialog();
                break;
            case 'exitgame':
                console.log('StartPage: Handling exit game');
                this.handleExitGame();
                break;
            default:
                console.log(`StartPage: Unknown action: ${action}`);
                this.isTransitioning = false;
        }
    }
    
    startGame(mode) {
        console.log(`StartPage: startGame called with mode: ${mode}`);
        
        // Hide start page
        this.hide(() => {
            console.log('StartPage: Start page hidden, showing game container');
            
            // Show game container
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.style.zIndex = '500';
                console.log('StartPage: Game container shown');
            } else {
                console.error('StartPage: Game container not found!');
            }
            
            // Trigger game start event
            console.log('StartPage: Triggering startPage:startGame event');
            const event = new CustomEvent('startPage:startGame', {
                detail: { mode: mode }
            });
            
            // Check if event was dispatched successfully
            if (document.dispatchEvent(event)) {
                console.log('StartPage: Event dispatched successfully');
            } else {
                console.error('StartPage: Failed to dispatch event');
            }
            
            // Reset transition state
            this.isTransitioning = false;
        });
    }
    
    hide(callback) {
        console.log('StartPage: Hiding start page');
        
        this.isVisible = false;
        
        // Animate out
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.style.opacity = '1';
            
            console.log('StartPage: Start page hidden');
            
            if (callback) {
                callback();
            }
        }, 500);
    }
    
    show() {
        console.log('StartPage: Showing start page');
        
        this.isVisible = true;
        this.isTransitioning = false;
        
        this.container.classList.remove('hidden');
        this.container.style.opacity = '0';
        
        // Animate in
        setTimeout(() => {
            this.container.style.transition = 'opacity 0.5s ease';
            this.container.style.opacity = '1';
            console.log('StartPage: Start page visible');
        }, 10);
    }
    
    createClickEffect(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.position = 'absolute';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        ripple.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(4)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => {
            button.removeChild(ripple);
        };
    }
    
    createHoverEffect(button) {
        button.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
        button.style.transform = 'translateY(-2px) scale(1.05)';
    }
    
    removeHoverEffect(button) {
        button.style.boxShadow = '';
        button.style.transform = '';
    }
    
    initializeParallax() {
        this.updateParallax();
    }
    
    updateParallax() {
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;
        
        this.layers.layer1.style.transform = `translate(${this.mouseX * 10}px, ${this.mouseY * 10}px)`;
        this.layers.layer2.style.transform = `translate(${this.mouseX * 20}px, ${this.mouseY * 20}px)`;
        this.layers.layer3.style.transform = `translate(${this.mouseX * 30}px, ${this.mouseY * 30}px)`;
    }
    
    startAnimation() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    update(deltaTime) {
        this.updateParallax();
        this.updateParticles(deltaTime);
        this.updateTitleAnimation(deltaTime);
    }
    
    updateParticles(deltaTime) {
        this.particleSpawnTimer += deltaTime;
        
        if (this.particleSpawnTimer > 200) {
            this.particleSpawnTimer = 0;
            
            if (this.particles.length >= 50) {
                const oldParticle = this.particles.shift();
                oldParticle.element.remove();
            }
            
            this.createParticle();
        }
        
        this.particles = this.particles.filter(particle => {
            particle.y += particle.speed;
            
            if (particle.y > 110) {
                particle.y = -10;
                particle.x = Utils.randomFloat(0, 100);
                particle.element.style.left = particle.x + '%';
            }
            
            return true;
        });
    }
    
    updateTitleAnimation(deltaTime) {
        const time = Date.now() / 1000;
        const floatY = Math.sin(time) * 5;
        this.title.style.transform = `translateY(${floatY}px)`;
        
        const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;
        this.title.style.filter = `brightness(${glowIntensity})`;
    }
    
    showChallengesDialog() {
        console.log('StartPage: Showing challenges dialog');
        
        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Select Challenge</h2>
                <div class="dialog-options">
                    <button class="dialog-btn" data-action="custom">Custom Areas</button>
                    <button class="dialog-btn" data-action="gauntlet">Gauntlet Mode</button>
                    <button class="dialog-btn" data-action="back">Back</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2000';
        
        const buttons = dialog.querySelectorAll('.dialog-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                if (action === 'back') {
                    document.body.removeChild(dialog);
                    this.isTransitioning = false;
                } else {
                    document.body.removeChild(dialog);
                    this.startGame(action);
                }
            });
        });
    }
    
    showOptionsDialog() {
        console.log('StartPage: Showing options dialog');
        
        // Load saved options from localStorage
        let savedOptions = {};
        try {
            const saved = localStorage.getItem('minequest_options');
            if (saved) {
                savedOptions = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load options:', e);
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = `
            <div class="dialog-content" style="max-width: 500px;">
                <h2>Options</h2>
                <div class="options-panel" style="text-align: left; padding: 20px;">
                    <div class="option-group">
                        <h4>Gameplay</h4>
                        <div class="option-item" style="margin: 10px 0;">
                            <label style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="startFogOfWarToggle" ${savedOptions.fogOfWar !== false ? 'checked' : ''}>
                                <span>Enable Fog of War</span>
                            </label>
                        </div>
                        <div class="option-item" style="margin: 10px 0;">
                            <label style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="startShowGridToggle" ${savedOptions.showGrid ? 'checked' : ''}>
                                <span>Show Grid Lines</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="option-group" style="margin-top: 20px;">
                        <h4>Audio</h4>
                        <div class="option-item" style="margin: 10px 0;">
                            <label>Music Volume</label>
                            <input type="range" id="startMusicVolume" min="0" max="100" value="${savedOptions.musicVolume || 50}" style="width: 100%;">
                            <span id="startMusicVolumeValue">${savedOptions.musicVolume || 50}%</span>
                        </div>
                        <div class="option-item" style="margin: 10px 0;">
                            <label>SFX Volume</label>
                            <input type="range" id="startSfxVolume" min="0" max="100" value="${savedOptions.sfxVolume || 50}" style="width: 100%;">
                            <span id="startSfxVolumeValue">${savedOptions.sfxVolume || 50}%</span>
                        </div>
                    </div>
                    
                    <div class="option-group" style="margin-top: 20px;">
                        <h4>Display</h4>
                        <div class="option-item" style="margin: 10px 0;">
                            <label style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="startShowFPSToggle" ${savedOptions.showFPS ? 'checked' : ''}>
                                <span>Show FPS Counter</span>
                            </label>
                        </div>
                        <div class="option-item" style="margin: 10px 0;">
                            <label style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" id="startShowCoordsToggle" ${savedOptions.showCoords ? 'checked' : ''}>
                                <span>Show Cell Coordinates</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="dialog-options">
                    <button class="dialog-btn primary" data-action="apply">Apply</button>
                    <button class="dialog-btn" data-action="back">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2000';
        
        // Set up slider updates
        const musicSlider = dialog.querySelector('#startMusicVolume');
        const sfxSlider = dialog.querySelector('#startSfxVolume');
        const musicValue = dialog.querySelector('#startMusicVolumeValue');
        const sfxValue = dialog.querySelector('#startSfxVolumeValue');
        
        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                if (musicValue) musicValue.textContent = e.target.value + '%';
            });
        }
        
        if (sfxSlider) {
            sfxSlider.addEventListener('input', (e) => {
                if (sfxValue) sfxValue.textContent = e.target.value + '%';
            });
        }
        
        const buttons = dialog.querySelectorAll('.dialog-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                if (action === 'apply') {
                    // Save options to localStorage
                    const options = {
                        fogOfWar: document.getElementById('startFogOfWarToggle')?.checked ?? true,
                        showGrid: document.getElementById('startShowGridToggle')?.checked ?? false,
                        musicVolume: parseInt(document.getElementById('startMusicVolume')?.value || '50'),
                        sfxVolume: parseInt(document.getElementById('startSfxVolume')?.value || '50'),
                        showFPS: document.getElementById('startShowFPSToggle')?.checked ?? false,
                        showCoords: document.getElementById('startShowCoordsToggle')?.checked ?? false
                    };
                    
                    try {
                        localStorage.setItem('minequest_options', JSON.stringify(options));
                        console.log('Options saved:', options);
                    } catch (e) {
                        console.error('Failed to save options:', e);
                    }
                }
                
                document.body.removeChild(dialog);
                this.isTransitioning = false;
            });
        });
    }
    
    showHowToPlayDialog() {
        console.log('StartPage: Showing how to play dialog');
        
        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = `
            <div class="dialog-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h2>How to Play - Mine Quest</h2>
                <div style="text-align: left; padding: 20px;">
                    <h3>🎯 Objective</h3>
                    <p>Explore procedurally generated underground areas, mine resources, battle enemies, and find exits to progress deeper.</p>
                    
                    <h3>🎮 Controls</h3>
                    <ul>
                        <li><strong>WASD or Arrow Keys</strong> - Move your character</li>
                        <li><strong>I</strong> - Open/Close Inventory</li>
                        <li><strong>E</strong> - Open/Close Equipment</li>
                        <li><strong>ESC</strong> - Open Game Menu</li>
                        <li><strong>Mouse Click</strong> - Mine adjacent cells or attack enemies</li>
                    </ul>
                    
                    <h3>⚒️ Mining</h3>
                    <p>Click on adjacent cells to mine resources like dirt, rock, coal, iron, gold, and gems. Different materials require different mining times.</p>
                    
                    <h3>⚔️ Combat</h3>
                    <p>Click on adjacent enemies to attack them. Your damage depends on your equipped gear and stats. Enemies drop experience and sometimes loot.</p>
                    
                    <h3>🎒 Inventory & Equipment</h3>
                    <p>Manage your 40-slot inventory and equip items in 6 equipment slots (helmet, armor, boots, pickaxe, gloves, amulet) to improve your stats.</p>
                    
                    <h3>🏪 Merchants</h3>
                    <p>Find merchants (yellow circles) to trade resources for coins and buy better equipment.</p>
                    
                    <h3>🚪 Exits</h3>
                    <p>Find exits (marked as "Exit") to progress to new areas with increased difficulty and better rewards.</p>
                    
                    <h3>🌫️ Fog of War</h3>
                    <p>Areas are hidden until you explore them. The fog reveals as you move around.</p>
                    
                    <h3>🎮 Game Modes</h3>
                    <ul>
                        <li><strong>Standard</strong> - Classic exploration with no time limit</li>
                        <li><strong>Custom</strong> - Play custom-made areas</li>
                        <li><strong>Gauntlet</strong> - Time-based challenge mode</li>
                    </ul>
                </div>
                <div class="dialog-options">
                    <button class="dialog-btn primary" data-action="back">Got It!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2000';
        
        const backBtn = dialog.querySelector('[data-action="back"]');
        backBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.isTransitioning = false;
        });
    }

    showLoadGameDialog() {
        console.log('StartPage: Showing load game dialog');

        // Load saved games from localStorage
        const saveSlots = this.getSaveSlots();

        let dialogHTML = `
            <div class="dialog-content" style="max-width: 600px;">
                <h2>Load Quest</h2>
                <p>Select a saved game to load:</p>
                <div class="save-slots" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
        `;

        for (let i = 0; i < 3; i++) {
            const save = saveSlots[i];
            if (save) {
                const date = new Date(save.timestamp).toLocaleDateString();
                const time = new Date(save.timestamp).toLocaleTimeString();

                dialogHTML += `
                    <div class="save-slot" data-slot="${i}" style="border: 2px solid #FFD700; border-radius: 8px; padding: 15px; margin: 10px 0; background: rgba(255, 215, 0, 0.1); cursor: pointer; transition: all 0.2s;">
                        <div class="save-info">
                            <div class="save-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="color: #FFD700; margin: 0;">Slot ${i + 1}</h4>
                                <span style="color: #888; font-size: 12px;">${date} ${time}</span>
                            </div>
                            <div class="save-details" style="display: flex; gap: 20px; flex-wrap: wrap;">
                                <div class="save-stat">
                                    <span style="color: #888;">Level:</span>
                                    <span style="color: #fff; font-weight: bold;">${save?.player?.level || '???'}</span>
                                </div>
                                <div class="save-stat">
                                    <span style="color: #888;">Area:</span>
                                    <span style="color: #fff; font-weight: bold;">${save?.currentArea?.name || 'Unknown'}</span>
                                </div>
                                <div class="save-stat">
                                    <span style="color: #888;">Coins:</span>
                                    <span style="color: #FFD700; font-weight: bold;">${save?.player?.coins ? save.player.coins.toLocaleString() : '???'}</span>
                                </div>
                                <div class="save-stat">
                                    <span style="color: #888;">Mode:</span>
                                    <span style="color: #fff; font-weight: bold;">${save?.mode || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                dialogHTML += `
                    <div class="save-slot empty" data-slot="${i}" style="border: 2px dashed #444; border-radius: 8px; padding: 15px; margin: 10px 0; background: rgba(255, 255, 255, 0.05); color: #666; text-align: center; cursor: pointer; transition: all 0.2s;">
                        <div style="font-style: italic;">Empty Slot</div>
                        <div style="font-size: 12px; margin-top: 5px;">Click to create new save</div>
                    </div>
                `;
            }
        }

        dialogHTML += `
                </div>
                <div class="dialog-options">
                    <button class="dialog-btn" data-action="back">Back</button>
                </div>
            </div>
        `;

        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = dialogHTML;

        document.body.appendChild(dialog);

        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2000';

        // Add click listeners to save slots
        const saveSlotsElements = dialog.querySelectorAll('.save-slot');
        saveSlotsElements.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotIndex = parseInt(e.currentTarget.dataset.slot);
                const save = saveSlots[slotIndex];

                if (save) {
                    // Load the selected save
                    this.loadGame(save, slotIndex);
                } else {
                    // Create new save (show confirmation)
                    this.showNewSaveConfirmation(slotIndex);
                }

                document.body.removeChild(dialog);
            });

            // Hover effects
            slot.addEventListener('mouseenter', () => {
                if (!slot.classList.contains('empty')) {
                    slot.style.background = 'rgba(255, 215, 0, 0.2)';
                    slot.style.borderColor = '#FFD700';
                }
            });

            slot.addEventListener('mouseleave', () => {
                if (!slot.classList.contains('empty')) {
                    slot.style.background = 'rgba(255, 215, 0, 0.1)';
                    slot.style.borderColor = '#FFD700';
                }
            });
        });

        // Back button
        const backBtn = dialog.querySelector('[data-action="back"]');
        backBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.isTransitioning = false;
        });
    }

    getSaveSlots() {
        // Use the SaveSystem to get save data (handles compression/decompression)
        if (window.saveSystem) {
            const saveSlots = window.saveSystem.getSaveSlots();
            return saveSlots.map(slot => slot.data); // Extract the actual save data
        }

        // Fallback: load directly from localStorage (with decompression)
        const slots = [];

        for (let i = 0; i < 3; i++) {
            try {
                const compressedData = localStorage.getItem(`minequest_save_${i}`);
                if (compressedData) {
                    // Try to decompress first, fall back to direct parsing
                    let saveData;
                    try {
                        saveData = JSON.parse(compressedData);
                        // Check if it's compressed (simple heuristic: if it doesn't have expected properties)
                        if (!saveData.version || !saveData.player) {
                            // Try decompressing
                            const decompressed = Utils.decompressData(compressedData);
                            saveData = JSON.parse(decompressed);
                        }
                    } catch (decompressError) {
                        // If decompression fails, try direct parsing
                        console.warn(`Failed to decompress save slot ${i}, trying direct parse:`, decompressError);
                        saveData = JSON.parse(compressedData);
                    }
                    slots.push(saveData);
                } else {
                    slots.push(null);
                }
            } catch (e) {
                console.error(`Error loading save slot ${i}:`, e);
                slots.push(null);
            }
        }

        return slots;
    }

    loadGame(saveData, slotIndex) {
        console.log('StartPage: Loading game from slot', slotIndex);

        // Hide start page
        this.hide(() => {
            // Show game container
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.style.zIndex = '500';

                // Trigger game load event
                const event = new CustomEvent('startPage:loadGame', {
                    detail: { saveData: saveData, slotIndex: slotIndex }
                });

                if (document.dispatchEvent(event)) {
                    console.log('StartPage: Load game event dispatched successfully');
                } else {
                    console.error('StartPage: Failed to dispatch load game event');
                }
            } else {
                console.error('StartPage: Game container not found!');
            }

            this.isTransitioning = false;
        });
    }

    showNewSaveConfirmation(slotIndex) {
        console.log('StartPage: Showing new save confirmation');

        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Start New Quest</h2>
                <p>This will create a new save in Slot ${slotIndex + 1}. Continue?</p>
                <div class="dialog-options">
                    <button class="dialog-btn primary" data-action="confirm">Start New Quest</button>
                    <button class="dialog-btn" data-action="cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2001';

        const buttons = dialog.querySelectorAll('.dialog-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;

                document.body.removeChild(dialog);

                if (action === 'confirm') {
                    // Start new game
                    this.startGame('standard');
                } else {
                    this.isTransitioning = false;
                }
            });
        });
    }

    handleExitGame() {
        console.log('StartPage: Handling exit game');
        
        const dialog = document.createElement('div');
        dialog.className = 'start-page-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Exit Game</h2>
                <p>Are you sure you want to exit the game?</p>
                <div class="dialog-options">
                    <button class="dialog-btn danger" data-action="confirm">Yes</button>
                    <button class="dialog-btn" data-action="cancel">No</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.zIndex = '2000';
        
        const buttons = dialog.querySelectorAll('.dialog-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                document.body.removeChild(dialog);
                this.isTransitioning = false;
                
                if (action === 'confirm') {
                    window.close();
                    window.location.href = 'about:blank';
                }
            });
        });
    }
    
    addKeyboardNavigation() {
        let currentButtonIndex = 0;
        const buttons = Array.from(this.container.querySelectorAll('.menu-btn'));
        
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    currentButtonIndex = (currentButtonIndex - 1 + buttons.length) % buttons.length;
                    this.highlightButton(buttons[currentButtonIndex]);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    currentButtonIndex = (currentButtonIndex + 1) % buttons.length;
                    this.highlightButton(buttons[currentButtonIndex]);
                    break;
                case 'Enter':
                    e.preventDefault();
                    buttons[currentButtonIndex].click();
                    break;
            }
        });
    }
    
    highlightButton(button) {
        // Remove highlight from all buttons
        const buttons = this.container.querySelectorAll('.menu-btn');
        buttons.forEach(btn => btn.classList.remove('highlighted'));
        
        // Add highlight to current button
        button.classList.add('highlighted');
        button.focus();
    }
    
    cleanup() {
        this.stopAnimation();
        
        this.particles.forEach(particle => {
            particle.element.remove();
        });
        this.particles = [];
    }
}