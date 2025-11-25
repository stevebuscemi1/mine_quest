// js/modes/GauntletMode.js

import { GAME_MODES, GAUNTLET_TIME_LIMIT, AREA_TYPES } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';
import { Area } from '../core/Area.js';
import { Player } from '../core/Player.js';
import { FogOfWar } from '../core/FogOfWar.js';
import { Timer } from '../systems/Timer.js';

export class GauntletMode {
    constructor(game) {
        this.game = game;
        this.mode = GAME_MODES.GAUNTLET;
        
        // Game state
        this.currentArea = null;
        this.player = null;
        this.fogOfWar = null;
        this.timer = null;
        
        // Gauntlet-specific settings
        this.currentAreaIndex = 0;
        this.areasPerGauntlet = 5;
        this.timeLimit = GAUNTLET_TIME_LIMIT;
        this.baseDifficulty = 1;
        this.difficultyIncrement = 0.5;
        
        // Scoring
        this.score = 0;
        this.highScore = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.comboTimeout = 5000; // 5 seconds to maintain combo
        
        // Statistics
        this.stats = {
            areasCompleted: 0,
            enemiesDefeated: 0,
            resourcesMined: 0,
            perfectAreas: 0,
            fastestTime: Infinity,
            totalPlayTime: 0,
            startTime: Date.now()
        };
        
        // Leaderboard
        this.leaderboard = this.loadLeaderboard();
        
        // Event listeners
        this.setupEventListeners();
    }
    
    async init() {
        // Load high score
        this.highScore = this.loadHighScore();
        
        // Initialize player
        this.player = new Player(25, 25);
        
        // Initialize fog of war
        this.fogOfWar = new FogOfWar();
        
        // Initialize timer
        this.timer = new Timer(this.timeLimit, () => {
            this.gameOver();
        });
        
        // Set up timer events
        this.timer.addListener((event, data) => {
            this.handleTimerEvent(event, data);
        });
        
        // Generate first area
        await this.generateNewArea();
        
        // Start timer
        this.timer.start();
        
        // Update UI
        this.updateUI();
        
        // Show countdown
        this.showCountdown();
    }
    
    setupEventListeners() {
        document.addEventListener('enemyDefeated', (e) => this.handleEnemyDefeated(e));
        document.addEventListener('resourceMined', (e) => this.handleResourceMined(e));
        document.addEventListener('areaCompleted', (e) => this.handleAreaCompleted(e));
        document.addEventListener('levelUp', (e) => this.handleLevelUp(e));
    }
    
    async generateNewArea() {
        // Calculate difficulty for this area
        const difficulty = Math.floor(this.baseDifficulty + (this.currentAreaIndex * this.difficultyIncrement));
        
        // Determine area type (progressive)
        const areaTypes = [
            AREA_TYPES.MINE,
            AREA_TYPES.CAVE,
            AREA_TYPES.CRYSTAL_CAVERN,
            AREA_TYPES.ANCIENT_RUINS,
            AREA_TYPES.COSMIC_REGION
        ];
        const areaType = areaTypes[Math.min(this.currentAreaIndex, areaTypes.length - 1)];
        
        // Generate smaller, more challenging areas for gauntlet
        const width = Utils.randomInt(30, 50);
        const height = Utils.randomInt(30, 50);
        
        // Generate area
        this.currentArea = new Area(width, height, areaType, difficulty);
        this.currentArea.generate();
        
        // Add more enemies for gauntlet mode
        this.addGauntletEnemies();
        
        // Find valid spawn position
        const spawnPos = this.findValidSpawnPosition();
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;
        
        // Update fog of war
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Notify game
        this.game.onAreaChanged(this.currentArea);
    }
    
    addGauntletEnemies() {
        // Add extra enemies for gauntlet mode
        const extraEnemies = Math.floor(this.currentAreaIndex * 2);
        const enemyTypes = ['SLIME', 'BAT', 'SPIDER', 'ZOMBIE', 'SKELETON', 'GOLEM'];
        
        for (let i = 0; i < extraEnemies; i++) {
            const x = Utils.randomInt(0, this.currentArea.width - 1);
            const y = Utils.randomInt(0, this.currentArea.height - 1);
            
            if (this.currentArea.getCell(x, y) === 0) { // Empty
                const enemyType = enemyTypes[Math.min(Math.floor(this.currentAreaIndex / 2), enemyTypes.length - 1)];
                const enemy = new Enemy(x, y, enemyType);
                this.currentArea.enemies.set(Utils.coordToKey(x, y), enemy);
            }
        }
    }
    
    findValidSpawnPosition() {
        const validPositions = [];
        
        for (let y = 0; y < this.currentArea.height; y++) {
            for (let x = 0; x < this.currentArea.width; x++) {
                const cell = this.currentArea.getCell(x, y);
                if (cell === 0 || cell === 7) { // Empty or door
                    // Check if position is safe
                    let safe = true;
                    for (const [key, enemy] of this.currentArea.enemies) {
                        const [ex, ey] = Utils.keyToCoord(key);
                        if (Utils.manhattanDistance(x, y, ex, ey) < 3) {
                            safe = false;
                            break;
                        }
                    }
                    
                    if (safe) {
                        validPositions.push({ x, y });
                    }
                }
            }
        }
        
        return Utils.randomChoice(validPositions) || { x: 25, y: 25 };
    }
    
    showCountdown() {
        let count = 3;
        
        const countdownInterval = setInterval(() => {
            if (count > 0) {
                this.game.ui.showNotification(count.toString(), 'info', 1000);
                count--;
            } else {
                this.game.ui.showNotification('GO!', 'success', 1000);
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    update(deltaTime) {
        if (!this.currentArea || !this.player || !this.timer.isRunning) return;
        
        // Update timer
        const timerExpired = this.timer.update();
        if (timerExpired) return;
        
        // Update player
        this.player.update(deltaTime);
        
        // Update fog of war
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Update enemies
        for (const [key, enemy] of this.currentArea.enemies) {
            enemy.update(deltaTime, this.player, this.currentArea);
        }
        
        // Update merchants
        for (const merchant of this.currentArea.merchants.values()) {
            merchant.update(deltaTime);
        }
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboMultiplier = 1;
            }
        }
        
        // Update statistics
        this.stats.totalPlayTime = Date.now() - this.stats.startTime;
        
        // Check for area completion
        this.checkAreaCompletion();
    }
    
    checkAreaCompletion() {
        // Check if player is at an exit
        const playerCell = this.currentArea.getCell(this.player.x, this.player.y);
        if (playerCell === 7) { // Door
            this.completeArea();
        }
    }
    
    completeArea() {
        // Calculate area completion bonus
        const timeBonus = Math.floor(this.timer.remaining * 10);
        const difficultyBonus = this.currentArea.difficulty * 50;
        const comboBonus = Math.floor((this.comboMultiplier - 1) * 100);
        const areaScore = timeBonus + difficultyBonus + comboBonus;
        
        // Add to score
        this.score += areaScore;
        
        // Update statistics
        this.stats.areasCompleted++;
        
        // Check for perfect area (completed quickly)
        if (this.timer.remaining > this.timeLimit * 0.8) {
            this.stats.perfectAreas++;
            this.score += 500; // Perfect area bonus
        }
        
        // Show completion message
        this.game.ui.showNotification(
            `Area Complete! Score: +${areaScore} | Combo: x${this.comboMultiplier}`,
            'success'
        );
        
        // Check if gauntlet is complete
        if (this.currentAreaIndex >= this.areasPerGauntlet - 1) {
            this.completeGauntlet();
        } else {
            // Generate next area
            this.currentAreaIndex++;
            this.generateNewArea();
            
            // Add time bonus for completing area
            this.timer.addTime(30); // 30 seconds bonus per area
        }
        
        // Trigger event
        document.dispatchEvent(new CustomEvent('areaCompleted', {
            detail: {
                areaIndex: this.currentAreaIndex,
                score: areaScore,
                combo: this.comboMultiplier
            }
        }));
    }
    
    completeGauntlet() {
        // Calculate final score
        const timeBonus = Math.floor(this.timer.remaining * 20);
        const completionBonus = 1000;
        const finalScore = this.score + timeBonus + completionBonus;
        
        // Update statistics
        if (this.timer.remaining < this.stats.fastestTime) {
            this.stats.fastestTime = this.timer.remaining;
        }
        
        // Stop timer
        this.timer.stop();
        
        // Check for high score
        const isNewHighScore = finalScore > this.highScore;
        if (isNewHighScore) {
            this.highScore = finalScore;
            this.saveHighScore();
        }
        
        // Add to leaderboard
        this.addToLeaderboard(finalScore);
        
        // Show completion dialog
        this.game.ui.showDialog(
            'Gauntlet Complete!',
            `
                <div class="gauntlet-results">
                    <h2>Final Score: ${finalScore}</h2>
                    <p>Areas Completed: ${this.stats.areasCompleted}</p>
                    <p>Enemies Defeated: ${this.stats.enemiesDefeated}</p>
                    <p>Resources Mined: ${this.stats.resourcesMined}</p>
                    <p>Perfect Areas: ${this.stats.perfectAreas}</p>
                    <p>Time Remaining: ${Utils.formatTime(this.timer.remaining)}</p>
                    <p>Time Bonus: ${timeBonus}</p>
                    ${isNewHighScore ? '<p class="high-score">NEW HIGH SCORE!</p>' : ''}
                </div>
            `,
            [
                { text: 'Play Again', value: 'again', primary: true },
                { text: 'View Leaderboard', value: 'leaderboard' },
                { text: 'Main Menu', value: 'menu' }
            ],
            (value) => {
                switch (value) {
                    case 'again':
                        this.restartGauntlet();
                        break;
                    case 'leaderboard':
                        this.showLeaderboard();
                        break;
                    case 'menu':
                        this.game.returnToStartPage();
                        break;
                }
            }
        );
    }
    
    gameOver() {
        // Show game over dialog
        this.game.ui.showDialog(
            'Time\'s Up!',
            `
                <div class="gauntlet-results">
                    <h2>Game Over</h2>
                    <p>Final Score: ${this.score}</p>
                    <p>Areas Completed: ${this.stats.areasCompleted}</p>
                    <p>Enemies Defeated: ${this.stats.enemiesDefeated}</p>
                    <p>Resources Mined: ${this.stats.resourcesMined}</p>
                    <p>High Score: ${this.highScore}</p>
                </div>
            `,
            [
                { text: 'Try Again', value: 'again', primary: true },
                { text: 'View Leaderboard', value: 'leaderboard' },
                { text: 'Main Menu', value: 'menu' }
            ],
            (value) => {
                switch (value) {
                    case 'again':
                        this.restartGauntlet();
                        break;
                    case 'leaderboard':
                        this.showLeaderboard();
                        break;
                    case 'menu':
                        this.game.returnToStartPage();
                        break;
                }
            }
        );
    }
    
    restartGauntlet() {
        // Reset game state
        this.currentAreaIndex = 0;
        this.score = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        
        // Reset statistics
        this.stats = {
            areasCompleted: 0,
            enemiesDefeated: 0,
            resourcesMined: 0,
            perfectAreas: 0,
            fastestTime: Infinity,
            totalPlayTime: 0,
            startTime: Date.now()
        };
        
        // Restart game
        this.init();
    }
    
    handleTimerEvent(event, data) {
        switch (event) {
            case 'warning':
                this.game.ui.showNotification('Warning: 1 minute remaining!', 'warning', 3000);
                break;
            case 'critical':
                this.game.ui.showNotification('Critical: 10 seconds remaining!', 'error', 3000);
                break;
            case 'updated':
                // Update UI with new time
                this.updateUI();
                break;
        }
    }
    
    handleEnemyDefeated(e) {
        const enemy = e.detail.enemy;
        
        // Add score for defeating enemy
        const baseScore = enemy.experienceValue * 10;
        const comboScore = Math.floor(baseScore * this.comboMultiplier);
        this.score += comboScore;
        
        // Update combo
        this.comboMultiplier = Math.min(this.comboMultiplier + 0.1, 5.0);
        this.comboTimer = this.comboTimeout;
        
        // Update statistics
        this.stats.enemiesDefeated++;
        
        // Show floating score
        this.game.ui.showDamageNumber(
            enemy.x * 64,
            enemy.y * 64,
            comboScore,
            'score'
        );
        
        // Update UI
        this.updateUI();
    }
    
    handleResourceMined(e) {
        const resource = e.detail.resource;
        
        // Add score for mining
        const baseScore = (resource.value || 1) * 5;
        const comboScore = Math.floor(baseScore * this.comboMultiplier);
        this.score += comboScore;
        
        // Update combo
        this.comboTimer = this.comboTimeout;
        
        // Update statistics
        this.stats.resourcesMined++;
        
        // Update UI
        this.updateUI();
    }
    
    handleAreaCompleted(e) {
        // Area completion is handled in completeArea method
    }
    
    handleLevelUp(e) {
        // Add score for leveling up
        this.score += 100;
        
        // Show notification
        this.game.ui.showNotification(
            `Level Up! +100 score bonus`,
            'success',
            3000
        );
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        if (!this.game.ui) return;
        
        // Update game info
        this.game.ui.updateGameInfo({
            area: this.currentArea,
            player: this.player,
            gameMode: this.mode,
            timeRemaining: this.timer.remaining
        });
        
        // Update inventory
        if (this.player.inventory) {
            this.game.ui.updateInventory(this.player.inventory);
        }
        
        // Update equipment
        if (this.player.equipment) {
            this.game.ui.updateEquipment(this.player.equipment);
        }
        
        // Update score display (if it exists)
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        // Update score display in UI
        const scoreElement = document.getElementById('scoreDisplay');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.score}`;
        }
        
        // Update combo display
        const comboElement = document.getElementById('comboDisplay');
        if (comboElement) {
            comboElement.textContent = `Combo: x${this.comboMultiplier.toFixed(1)}`;
            comboElement.style.color = this.comboMultiplier > 2 ? '#FFD700' : '#FFFFFF';
        }
    }
    
    showLeaderboard() {
        const leaderboardContent = this.createLeaderboardContent();
        
        this.game.ui.showDialog(
            'Leaderboard',
            leaderboardContent,
            [
                { text: 'Clear Scores', value: 'clear' },
                { text: 'Close', value: 'close', primary: true }
            ],
            (value) => {
                if (value === 'clear') {
                    this.clearLeaderboard();
                    this.showLeaderboard();
                }
            }
        );
    }
    
    createLeaderboardContent() {
        let content = '<div class="leaderboard">';
        
        if (this.leaderboard.length === 0) {
            content += '<p>No scores yet. Be the first to complete the gauntlet!</p>';
        } else {
            content += '<table class="leaderboard-table">';
            content += '<tr><th>Rank</th><th>Score</th><th>Areas</th><th>Time</th><th>Date</th></tr>';
            
            this.leaderboard.forEach((entry, index) => {
                const date = new Date(entry.date).toLocaleDateString();
                content += `<tr>`;
                content += `<td>${index + 1}</td>`;
                content += `<td>${entry.score}</td>`;
                content += `<td>${entry.areasCompleted}</td>`;
                content += `<td>${Utils.formatTime(entry.timeRemaining)}</td>`;
                content += `<td>${date}</td>`;
                content += `</tr>`;
            });
            
            content += '</table>';
        }
        
        content += '</div>';
        return content;
    }
    
    addToLeaderboard(score) {
        const entry = {
            score: score,
            areasCompleted: this.stats.areasCompleted,
            enemiesDefeated: this.stats.enemiesDefeated,
            timeRemaining: this.timer.remaining,
            date: Date.now()
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
        
        this.saveLeaderboard();
    }
    
    loadLeaderboard() {
        try {
            const data = localStorage.getItem('minequest_gauntlet_leaderboard');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    }
    
    saveLeaderboard() {
        try {
            localStorage.setItem('minequest_gauntlet_leaderboard', JSON.stringify(this.leaderboard));
        } catch (error) {
            console.error('Failed to save leaderboard:', error);
        }
    }
    
    clearLeaderboard() {
        this.leaderboard = [];
        this.saveLeaderboard();
        this.game.ui.showNotification('Leaderboard cleared', 'info');
    }
    
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('minequest_gauntlet_highscore') || '0');
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }
    
    saveHighScore() {
        try {
            localStorage.setItem('minequest_gauntlet_highscore', this.highScore.toString());
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }
    
    getSaveData() {
        return {
            mode: this.mode,
            currentAreaIndex: this.currentAreaIndex,
            score: this.score,
            highScore: this.highScore,
            comboMultiplier: this.comboMultiplier,
            comboTimer: this.comboTimer,
            player: this.player.serialize(),
            currentArea: this.currentArea.serialize(),
            fogOfWar: this.fogOfWar.serialize(),
            timer: this.timer.serialize(),
            stats: this.stats,
            timestamp: Date.now()
        };
    }
    
    getStatistics() {
        return {
            ...this.stats,
            currentScore: this.score,
            highScore: this.highScore,
            currentArea: this.currentAreaIndex + 1,
            totalAreas: this.areasPerGauntlet,
            currentCombo: this.comboMultiplier.toFixed(1),
            timeRemaining: Utils.formatTime(this.timer.remaining),
            totalPlayTime: this.formatPlayTime(this.stats.totalPlayTime)
        };
    }
    
    formatPlayTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }
    
    cleanup() {
        // Clean up event listeners
        document.removeEventListener('enemyDefeated', this.handleEnemyDefeated);
        document.removeEventListener('resourceMined', this.handleResourceMined);
        document.removeEventListener('areaCompleted', this.handleAreaCompleted);
        document.removeEventListener('levelUp', this.handleLevelUp);
        
        // Clean up timer
        if (this.timer) {
            this.timer.stop();
        }
    }
}