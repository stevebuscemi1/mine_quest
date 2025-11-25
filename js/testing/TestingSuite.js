// js/testing/TestingSuite.js

import { Utils } from '../utils/Utils.js';

export class TestingSuite {
    constructor() {
        this.tests = new Map();
        this.results = [];
        this.isRunning = false;
        this.currentTest = null;
        
        // Test categories
        this.categories = {
            core: 'Core Game Systems',
            ui: 'User Interface',
            platform: 'Platform Integration',
            save: 'Save/Load System',
            performance: 'Performance'
        };
        
        // Initialize tests
        this.initializeTests();
    }
    
    initializeTests() {
        // Core system tests
        this.addTest('core', 'player-movement', 'Test player movement', this.testPlayerMovement.bind(this));
        this.addTest('core', 'mining-system', 'Test mining system', this.testMiningSystem.bind(this));
        this.addTest('core', 'combat-system', 'Test combat system', this.testCombatSystem.bind(this));
        this.addTest('core', 'inventory-system', 'Test inventory system', this.testInventorySystem.bind(this));
        
        // UI tests
        this.addTest('ui', 'responsive-design', 'Test responsive design', this.testResponsiveDesign.bind(this));
        this.addTest('ui', 'touch-controls', 'Test touch controls', this.testTouchControls.bind(this));
        this.addTest('ui', 'dialog-system', 'Test dialog system', this.testDialogSystem.bind(this));
        
        // Platform tests
        this.addTest('platform', 'platform-detection', 'Test platform detection', this.testPlatformDetection.bind(this));
        this.addTest('platform', 'gamepad-support', 'Test gamepad support', this.testGamepadSupport.bind(this));
        this.addTest('platform', 'performance-optimization', 'Test performance optimization', this.testPerformanceOptimization.bind(this));
        
        // Save/Load tests
        this.addTest('save', 'save-system', 'Test save system', this.testSaveSystem.bind(this));
        this.addTest('save', 'load-system', 'Test load system', this.testLoadSystem.bind(this));
        this.addTest('save', 'save-validation', 'Test save validation', this.testSaveValidation.bind(this));
        
        // Performance tests
        this.addTest('performance', 'fps-stability', 'Test FPS stability', this.testFPSStability.bind(this));
        this.addTest('performance', 'memory-usage', 'Test memory usage', this.testMemoryUsage.bind(this));
        this.addTest('performance', 'rendering-performance', 'Test rendering performance', this.testRenderingPerformance.bind(this));
    }
    
    addTest(category, name, description, testFunction) {
        this.tests.set(`${category}-${name}`, {
            category,
            name,
            description,
            testFunction,
            timeout: 5000
        });
    }
    
    async runAllTests() {
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }
        
        this.isRunning = true;
        this.results = [];
        
        console.log('Running Mine Quest Test Suite...');
        
        const testContainer = this.createTestContainer();
        document.body.appendChild(testContainer);
        
        try {
            for (const [testId, test] of this.tests) {
                await this.runSingleTest(testId, test);
            }
            
            this.showTestResults();
            
        } finally {
            this.isRunning = false;
            document.body.removeChild(testContainer);
        }
        
        return this.results;
    }
    
    async runSingleTest(testId, test) {
        this.currentTest = testId;
        
        const result = {
            id: testId,
            name: test.name,
            category: test.category,
            description: test.description,
            passed: false,
            error: null,
            duration: 0
        };
        
        this.updateTestStatus(testId, 'running');
        
        const startTime = performance.now();
        
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Test timeout')), test.timeout);
            });
            
            await Promise.race([
                test.testFunction(),
                timeoutPromise
            ]);
            
            result.passed = true;
            this.updateTestStatus(testId, 'passed');
            
        } catch (error) {
            result.error = error.message;
            this.updateTestStatus(testId, 'failed');
        }
        
        result.duration = performance.now() - startTime;
        this.results.push(result);
        
        console.log(`Test ${testId}: ${result.passed ? 'PASSED' : 'FAILED'} (${result.duration.toFixed(2)}ms)`);
        
        if (!result.passed) {
            console.error(`  Error: ${result.error}`);
        }
    }
    
    createTestContainer() {
        const container = document.createElement('div');
        container.id = 'test-container';
        container.innerHTML = `
            <div class="test-header">
                <h2>Mine Quest Test Suite</h2>
                <div class="test-progress">
                    <span id="test-progress-text">0/0 tests</span>
                    <div class="progress-bar">
                        <div id="test-progress-bar" class="progress-fill"></div>
                    </div>
                </div>
            </div>
            <div class="test-results" id="test-results"></div>
        `;
        
        return container;
    }
    
    updateTestStatus(testId, status) {
        const resultsContainer = document.getElementById('test-results');
        let testElement = document.getElementById(`test-${testId}`);
        
        if (!testElement) {
            testElement = document.createElement('div');
            testElement.id = `test-${testId}`;
            testElement.className = 'test-item';
            resultsContainer.appendChild(testElement);
        }
        
        testElement.className = `test-item ${status}`;
        
        const test = this.tests.get(testId);
        testElement.innerHTML = `
            <div class="test-info">
                <span class="test-category">${this.categories[test.category]}</span>
                <span class="test-name">${test.name}</span>
                <span class="test-description">${test.description}</span>
            </div>
            <div class="test-status">${status.toUpperCase()}</div>
        `;
        
        // Update progress
        this.updateProgress();
    }
    
    updateProgress() {
        const totalTests = this.tests.size;
        const completedTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        
        const progressText = document.getElementById('test-progress-text');
        const progressBar = document.getElementById('test-progress-bar');
        
        if (progressText) {
            progressText.textContent = `${completedTests}/${totalTests} tests (${passedTests} passed)`;
        }
        
        if (progressBar) {
            progressBar.style.width = `${(completedTests / totalTests) * 100}%`;
        }
    }
    
    showTestResults() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        const resultsContainer = document.getElementById('test-results');
        
        // Add summary
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        summary.innerHTML = `
            <h3>Test Summary</h3>
            <p>Total: ${totalTests}, Passed: ${passedTests}, Failed: ${failedTests}</p>
            <p>Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%</p>
            <p>Total Duration: ${this.results.reduce((sum, r) => sum + r.duration, 0).toFixed(2)}ms</p>
        `;
        
        resultsContainer.appendChild(summary);
        
        // Log results to console
        console.log('\n=== Test Results ===');
        console.log(`Total: ${totalTests}, Passed: ${passedTests}, Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`- ${result.name}: ${result.error}`);
            });
        }
    }
    
    // Test implementations
    
    async testPlayerMovement() {
        // Test player movement functionality
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        if (!game.player) throw new Error('Player not initialized');
        
        const originalX = game.player.x;
        const originalY = game.player.y;
        
        // Test movement
        const moved = game.player.move(1, 0, game.currentArea);
        
        if (!moved) throw new Error('Player movement failed');
        
        // Test position update
        await Utils.wait(100);
        
        if (game.player.x === originalX && game.player.y === originalY) {
            throw new Error('Player position not updated');
        }
    }
    
    async testMiningSystem() {
        // Test mining system
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        if (!game.player) throw new Error('Player not initialized');
        
        // Test mining
        const miningStarted = game.player.startMining(1, 0, game.currentArea);
        
        if (!miningStarted) throw new Error('Mining failed to start');
        
        // Test mining progress
        await Utils.wait(100);
        
        if (!game.player.isMining) {
            throw new Error('Mining not in progress');
        }
    }
    
    async testCombatSystem() {
        // Test combat system
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        if (!game.player) throw new Error('Player not initialized');
        
        // Test damage calculation
        const damage = Utils.calculateDamage(game.player, { stats: { defense: 5 } });
        
        if (typeof damage !== 'number' || damage <= 0) {
            throw new Error('Invalid damage calculation');
        }
    }
    
    async testInventorySystem() {
        // Test inventory system
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        if (!game.player) throw new Error('Player not initialized');
        if (!game.player.inventory) throw new Error('Inventory not initialized');
        
        // Test item addition
        const item = {
            id: 'test-item',
            name: 'Test Item',
            type: 'resource',
            value: 10
        };
        
        const added = game.player.inventory.addItem(item);
        
        if (!added) throw new Error('Failed to add item to inventory');
        
        // Test item removal
        const removed = game.player.inventory.removeItem(0);
        
        if (!removed) throw new Error('Failed to remove item from inventory');
    }
    
    async testResponsiveDesign() {
        // Test responsive design
        const platformManager = window.MineQuest?.platformManager;
        if (!platformManager) throw new Error('Platform manager not initialized');
        
        // Test breakpoint detection
        const breakpoint = platformManager.getCurrentBreakpoint();
        
        if (!breakpoint) throw new Error('Breakpoint not detected');
        
        // Test layout application
        const layout = platformManager.getLayout();
        
        if (!layout) throw new Error('Layout not applied');
    }
    
    async testTouchControls() {
        // Test touch controls
        const touchControls = window.MineQuest?.touchControls;
        if (!touchControls) throw new Error('Touch controls not initialized');
        
        // Test touch control state
        const state = touchControls.getState();
        
        if (!state) throw new Error('Touch control state not available');
    }
    
    async testDialogSystem() {
        // Test dialog system
        const ui = window.MineQuest?.game?.ui;
        if (!ui) throw new Error('UI not initialized');
        
        // Test dialog creation
        const dialogShown = ui.showDialog('Test Dialog', 'Test message', [
            { text: 'OK', value: 'ok' }
        ]);
        
        if (!dialogShown) throw new Error('Failed to show dialog');
        
        // Test dialog hiding
        ui.hideDialog();
    }
    
    async testPlatformDetection() {
        // Test platform detection
        const platformManager = window.MineQuest?.platformManager;
        if (!platformManager) throw new Error('Platform manager not initialized');
        
        // Test platform info
        const platformInfo = platformManager.getPlatformInfo();
        
        if (!platformInfo) throw new Error('Platform info not available');
        
        if (!platformInfo.platform) throw new Error('Platform not detected');
    }
    
    async testGamepadSupport() {
        // Test gamepad support
        const platformManager = window.MineQuest?.platformManager;
        if (!platformManager) throw new Error('Platform manager not initialized');
        
        // Test gamepad polling
        const gamepads = platformManager.gamepads;
        
        if (!gamepads) throw new Error('Gamepad system not available');
    }
    
    async testPerformanceOptimization() {
        // Test performance optimization
        const platformManager = window.MineQuest?.platformManager;
        if (!platformManager) throw new Error('Platform manager not initialized');
        
        // Test quality preset
        const originalQuality = platformManager.performance.quality;
        
        platformManager.setQualityPreset('low');
        
        if (platformManager.performance.quality !== 'low') {
            throw new Error('Quality preset not applied');
        }
        
        // Restore original quality
        platformManager.setQualityPreset(originalQuality);
    }
    
    async testSaveSystem() {
        // Test save system
        const saveSystem = window.MineQuest?.saveSystem;
        if (!saveSystem) throw new Error('Save system not initialized');
        
        // Test save slot creation
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            mode: 'standard',
            player: { x: 0, y: 0, health: 100 },
            currentArea: { width: 50, height: 50, grid: new Array(2500).fill(0) }
        };
        
        const saveResult = saveSystem.saveGame(1, saveData);
        
        if (!saveResult.success) throw new Error('Save failed');
    }
    
    async testLoadSystem() {
        // Test load system
        const saveSystem = window.MineQuest?.saveSystem;
        if (!saveSystem) throw new Error('Save system not initialized');
        
        // Test save loading
        const loadResult = saveSystem.loadGame(1);
        
        if (!loadResult.success && !loadResult.error.includes('No save data found')) {
            throw new Error('Load failed');
        }
    }
    
    async testSaveValidation() {
        // Test save validation
        const saveSystem = window.MineQuest?.saveSystem;
        if (!saveSystem) throw new Error('Save system not initialized');
        
        // Test invalid save data
        const invalidSaveData = {
            // Missing required fields
            version: '1.0.0'
        };
        
        const validation = saveSystem.validateSaveData(invalidSaveData);
        
        if (validation.isValid) throw new Error('Invalid save data passed validation');
    }
    
    async testFPSStability() {
        // Test FPS stability
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        // Monitor FPS for a short period
        const fpsSamples = [];
        const sampleCount = 30;
        
        for (let i = 0; i < sampleCount; i++) {
            fpsSamples.push(game.fps || 0);
            await Utils.wait(16); // ~60fps
        }
        
        const averageFPS = fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;
        
        if (averageFPS < 30) {
            throw new Error(`Average FPS too low: ${averageFPS.toFixed(2)}`);
        }
    }
    
    async testMemoryUsage() {
        // Test memory usage
        if (!performance.memory) {
            console.warn('Memory API not available');
            return;
        }
        
        const initialMemory = performance.memory.usedJSHeapSize;
        
        // Create some objects to test memory
        const testObjects = [];
        for (let i = 0; i < 1000; i++) {
            testObjects.push({
                id: i,
                data: new Array(100).fill(Math.random()),
                timestamp: Date.now()
            });
        }
        
        const peakMemory = performance.memory.usedJSHeapSize;
        
        // Clean up
        testObjects.length = 0;
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        await Utils.wait(100);
        
        const finalMemory = performance.memory.usedJSHeapSize;
        
        // Check memory growth
        const memoryGrowth = peakMemory - initialMemory;
        const memoryLeak = finalMemory - initialMemory;
        
        if (memoryLeak > 10 * 1024 * 1024) { // 10MB
            throw new Error(`Potential memory leak detected: ${(memoryLeak / 1024 / 1024).toFixed(2)}MB`);
        }
    }
    
    async testRenderingPerformance() {
        // Test rendering performance
        const game = window.MineQuest?.game;
        if (!game) throw new Error('Game not initialized');
        
        // Measure render time
        const renderTimes = [];
        const sampleCount = 60;
        
        for (let i = 0; i < sampleCount; i++) {
            const startTime = performance.now();
            
            // Trigger render
            if (game.render) {
                game.render();
            }
            
            const renderTime = performance.now() - startTime;
            renderTimes.push(renderTime);
            
            await Utils.wait(16); // ~60fps
        }
        
        const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
        const maxRenderTime = Math.max(...renderTimes);
        
        if (averageRenderTime > 16.67) { // 60fps = 16.67ms per frame
            throw new Error(`Average render time too high: ${averageRenderTime.toFixed(2)}ms`);
        }
        
        if (maxRenderTime > 33.33) { // 30fps = 33.33ms per frame
            throw new Error(`Max render time too high: ${maxRenderTime.toFixed(2)}ms`);
        }
    }
    
    // Utility methods
    
    getTestResults() {
        return [...this.results];
    }
    
    getFailedTests() {
        return this.results.filter(result => !result.passed);
    }
    
    getPassedTests() {
        return this.results.filter(result => result.passed);
    }
    
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.getPassedTests().length;
        const failedTests = this.getFailedTests().length;
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
                duration: this.results.reduce((sum, r) => sum + r.duration, 0)
            },
            details: this.results,
            failed: this.getFailedTests(),
            passed: this.getPassedTests()
        };
    }
}

// Auto-run tests if in development mode
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait for game to initialize
        await Utils.wait(2000);
        
        const testingSuite = new TestingSuite();
        const results = await testingSuite.runAllTests();
        
        // Log results
        console.log('Test Results:', results);
        
        // Show results in UI if available
        if (window.MineQuest && window.MineQuest.game && window.MineQuest.game.ui) {
            const report = testingSuite.generateReport();
            window.MineQuest.game.ui.showDialog(
                'Test Results',
                `Total: ${report.summary.total}, Passed: ${report.summary.passed}, Failed: ${report.summary.failed}`,
                [
                    { text: 'OK', value: 'ok' }
                ]
            );
        }
    });
}