// js/core/Enemy.js

import { ENEMY_TYPES, CELL_TYPES, MATERIALS } from '../constants/GameConstants.js';
import { Utils } from '../utils/Utils.js';

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.type = type;

        // Get enemy template with safety check
        this.template = ENEMY_TYPES[type];
        if (!this.template) {
            console.error(`Enemy type '${type}' not found in ENEMY_TYPES`);
            // Fallback to basic slime stats
            this.template = ENEMY_TYPES.SLIME;
        }

        // Stats with safety checks
        this.health = this.template.health || 30;
        this.maxHealth = this.template.health || 30;
        this.damage = this.template.damage || 5;
        this.speed = this.template.speed || 1.0;
        this.experienceValue = this.template.experience || 10;
        this.coins = this.template.coins || 5;

        // Size
        this.width = this.template.width || 1;
        this.height = this.template.height || 1;

        // Create stats object for combat calculations
        this.stats = {
            attack: this.template.damage || 10,
            defense: this.template.defense || 0,
            speed: this.template.speed || 1
        };

        // AI
        this.isAggressive = this.template.aggressive !== false;
        this.isFlying = this.template.flying || false;
        this.isRanged = this.template.ranged || false;
        this.isBoss = this.template.boss || false;
        
        // Movement
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.moveProgress = 0;
        this.moveTimer = 0;
        this.moveInterval = 1000 / this.speed; // Move every X milliseconds
        
        // Combat
        this.attackCooldown = 0;
        this.attackRange = this.isRanged ? 5 : 1;
        this.detectionRange = this.isAggressive ? 7 : 2; // Changed to 7 blocks
        this.lastAttackTime = 0;
        this.attackInterval = 2000; // Attack every 2 seconds
        
        // Animation
        this.animationFrame = 0;
        this.animationTime = 0;
        this.facingDirection = 'down';
        
        // Status effects
        this.statusEffects = new Map();
        
        // AI state
        this.state = 'idle'; // idle, patrol, chase, attack, flee, return
        this.patrolTarget = null;
        this.lastPlayerPos = null;
        this.isFollowingPlayer = false;
        
        // Drops
        this.drops = this.template.drops || [];

        // Initialize patrol behavior for all enemies
        this.initPatrol();
    }
    
    initPatrol() {
        this.state = 'patrol';
        this.setNewPatrolTarget();
    }
    
    setNewPatrolTarget(area = null) {
        // Random walk within small radius, but ensure target is within area bounds
        const radius = 3;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const targetX = this.x + Utils.randomInt(-radius, radius);
            const targetY = this.y + Utils.randomInt(-radius, radius);

            // Check if target is within bounds
            if (area) {
                if (targetX >= 0 && targetX < area.width &&
                    targetY >= 0 && targetY < area.height) {
                    this.patrolTarget = { x: targetX, y: targetY };
                    return;
                }
            } else {
                // Without area bounds, just set the target (will be validated during movement)
                this.patrolTarget = { x: targetX, y: targetY };
                return;
            }
            attempts++;
        }

        // Fallback: use current position if no valid target found
        this.patrolTarget = { x: this.x, y: this.y };
    }
    
    update(deltaTime, player, area) {
        // Update movement
        this.updateMovement(deltaTime, area);
        
        // Update combat
        this.updateCombat(player, area);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // AI behavior
        this.updateAI(player, area);
    }
    
    updateMovement(deltaTime, area) {
        if (this.isMoving) {
            this.moveProgress += this.speed * 0.1;
            if (this.moveProgress >= 1) {
                // Store old position for map key update
                const oldKey = Utils.coordToKey(this.x, this.y);
                
                // Update position
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.moveProgress = 0;
                
                // Update the enemy's position in the area.enemies Map
                const newKey = Utils.coordToKey(this.x, this.y);
                if (area && area.enemies) {
                    // Remove from old position and add to new position
                    if (area.enemies.has(oldKey)) {
                        area.enemies.delete(oldKey);
                        area.enemies.set(newKey, this);
                    }
                }
            }
        }
        
        this.moveTimer += deltaTime;
    }
    
    updateCombat(player, area) {
        const now = Date.now();
        const distance = Utils.manhattanDistance(this.x, this.y, player.x, player.y);
        
        if (distance <= this.attackRange && now - this.lastAttackTime > this.attackInterval) {
            this.attack(player);
            this.lastAttackTime = now;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        const frameDuration = this.isMoving ? 100 : 500;
        
        if (this.animationTime > frameDuration) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTime = 0;
        }
    }
    
    updateStatusEffects(deltaTime) {
        for (const [effect, data] of this.statusEffects) {
            data.duration -= deltaTime;
            if (data.duration <= 0) {
                this.statusEffects.delete(effect);
            }
        }
    }
    
    updateAI(player, area) {
        const playerDistance = Utils.manhattanDistance(this.x, this.y, player.x, player.y);
        const homeDistance = Utils.manhattanDistance(this.x, this.y, this.initialX, this.initialY);
        
        switch (this.state) {
            case 'idle':
                if (this.isAggressive && playerDistance <= this.detectionRange) {
                    this.state = 'chase';
                    this.lastPlayerPos = { x: player.x, y: player.y };
                } else if (!this.isAggressive && playerDistance <= 2) {
                    this.state = 'flee';
                }
                break;
                
            case 'patrol':
                if (this.isAggressive && playerDistance <= this.detectionRange) {
                    this.state = 'chase';
                    this.lastPlayerPos = { x: player.x, y: player.y };
                } else if (playerDistance <= 2) {
                    this.state = 'flee';
                } else if (homeDistance > 7) {
                    // Too far from initial position, return
                    this.state = 'return';
                } else if (this.moveTimer > this.moveInterval) {
                    // Only move if patrolTarget is set
                    if (this.patrolTarget) {
                        this.moveTowards(this.patrolTarget.x, this.patrolTarget.y, area);
                        this.moveTimer = 0;

                        // Check if reached patrol target
                        if (this.x === this.patrolTarget.x && this.y === this.patrolTarget.y) {
                            this.setNewPatrolTarget(area);
                        }
                    } else {
                        // If no patrol target, set one
                        this.setNewPatrolTarget(area);
                    }
                }
                break;
                
            case 'chase':
                if (homeDistance > 7) {
                    // Too far from initial position, return
                    this.state = 'return';
                } else if (playerDistance > this.detectionRange * 2) {
                    // Lost player, return to patrol
                    this.state = 'patrol';
                    this.setNewPatrolTarget(area);
                } else if (playerDistance <= this.attackRange) {
                    this.state = 'attack';
                } else if (this.moveTimer > this.moveInterval) {
                    this.moveTowards(player.x, player.y, area);
                    this.moveTimer = 0;
                    this.lastPlayerPos = { x: player.x, y: player.y };
                }
                break;
                
            case 'attack':
                if (homeDistance > 7) {
                    // Too far from initial position, return
                    this.state = 'return';
                } else if (playerDistance > this.attackRange) {
                    this.state = 'chase';
                } else if (this.moveTimer > this.moveInterval) {
                    // Attack player if in range
                    this.attack(player);
                    this.moveTimer = 0;
                }
                break;
                
            case 'flee':
                if (playerDistance > 5) {
                    this.state = 'patrol';
                    this.setNewPatrolTarget(area);
                } else if (this.moveTimer > this.moveInterval) {
                    // Move away from player
                    const dx = this.x - player.x;
                    const dy = this.y - player.y;
                    const moveX = this.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
                    const moveY = this.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
                    this.moveTowards(moveX, moveY, area);
                    this.moveTimer = 0;
                }
                break;
                
            case 'return':
                const returnDistance = Utils.manhattanDistance(this.x, this.y, this.initialX, this.initialY);
                if (returnDistance <= 1) {
                    // Reached home, start patrolling
                    this.state = 'patrol';
                    this.x = this.initialX;
                    this.y = this.initialY;
                    this.setNewPatrolTarget(area);
                } else if (this.moveTimer > this.moveInterval) {
                    // Move back to initial position
                    this.moveTowards(this.initialX, this.initialY, area);
                    this.moveTimer = 0;
                }
                break;
        }
    }
    
    moveTowards(targetX, targetY, area) {
        if (this.isMoving) return false;
        
        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);
        
        // Try to move towards target
        let newX = this.x + dx;
        let newY = this.y + dy;
        
        // Check if can move there
        if (this.canMoveTo(newX, newY, area)) {
            this.targetX = newX;
            this.targetY = newY;
            this.isMoving = true;
            this.moveProgress = 0;
            
            // Update facing direction
            if (dx > 0) this.facingDirection = 'right';
            else if (dx < 0) this.facingDirection = 'left';
            else if (dy > 0) this.facingDirection = 'down';
            else if (dy < 0) this.facingDirection = 'up';
            
            return true;
        }
        
        // Try alternative movement
        if (dx !== 0 && this.canMoveTo(this.x + dx, this.y, area)) {
            this.targetX = this.x + dx;
            this.targetY = this.y;
            this.isMoving = true;
            this.moveProgress = 0;
            this.facingDirection = dx > 0 ? 'right' : 'left';
            return true;
        }
        
        if (dy !== 0 && this.canMoveTo(this.x, this.y + dy, area)) {
            this.targetX = this.x;
            this.targetY = this.y + dy;
            this.isMoving = true;
            this.moveProgress = 0;
            this.facingDirection = dy > 0 ? 'down' : 'up';
            return true;
        }
        
        return false;
    }
    
    canMoveTo(x, y, area) {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                const cellX = x + i;
                const cellY = y + j;
                if (cellX < 0 || cellX >= area.width || cellY < 0 || cellY >= area.height) {
                    return false;
                }
                
                const cell = area.getCell(cellX, cellY);
                if (!cell) return false;
                
                // Flying enemies can move over more terrain
                if (this.isFlying) {
                    if (cell === CELL_TYPES.WALL || cell === CELL_TYPES.BEDROCK) {
                        return false;
                    }
                } else {
                    // Ground enemies - only move on empty cells
                    if (cell !== CELL_TYPES.EMPTY) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    attack(player) {
        const damage = Utils.calculateDamage(this, player);
        
        // Apply damage to player
        const actualDamage = player.takeDamage(damage.damage);
        
        // Play enemy sound when attacking
        if (window.game && window.game.audioSystem) {
            window.game.audioSystem.playEnemySound(this.type);
        }
        
        // Create damage number at player position (for enemy attacks on player)
        if (window.game && window.game.createDamageNumber) {
            const playerPos = player.getRenderPosition();
            window.game.createDamageNumber(playerPos.x, playerPos.y, actualDamage, damage.isCritical, false, 'enemy');
        }
        
        // Face the player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facingDirection = dx > 0 ? 'right' : 'left';
        } else {
            this.facingDirection = dy > 0 ? 'down' : 'up';
        }
        
        return actualDamage;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        // Clamp health to 0 to prevent negative values
        if (this.health < 0) {
            this.health = 0;
        }
        
        // Add damage effect
        this.addStatusEffect('damage', 200);
        
        // Become aggressive if attacked
        if (!this.isAggressive) {
            this.isAggressive = true;
            this.state = 'chase';
        }
        
        return this.health <= 0;
    }
    
    addStatusEffect(effect, duration) {
        this.statusEffects.set(effect, { duration });
    }
    
    getLoot() {
        const loot = [];
        
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const count = drop.count || 1;
                loot.push({ 
                    type: drop.type, 
                    count,
                    name: MATERIALS[drop.type]?.name || 'Unknown'
                });
            }
        }
        
        // Always drop some coins
        loot.push({
            type: 'coins',
            count: this.coins,
            name: 'Coins'
        });
        
        return loot;
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            health: this.health,
            maxHealth: this.maxHealth,
            damage: this.damage,
            speed: this.speed,
            experienceValue: this.experienceValue,
            coins: this.coins,
            stats: this.stats,
            isAggressive: this.isAggressive,
            isFlying: this.isFlying,
            isRanged: this.isRanged,
            isBoss: this.isBoss,
            width: this.width,
            height: this.height,
            targetX: this.targetX,
            targetY: this.targetY,
            isMoving: this.isMoving,
            moveProgress: this.moveProgress,
            moveTimer: this.moveTimer,
            moveInterval: this.moveInterval,
            attackCooldown: this.attackCooldown,
            attackRange: this.attackRange,
            detectionRange: this.detectionRange,
            lastAttackTime: this.lastAttackTime,
            attackInterval: this.attackInterval,
            animationFrame: this.animationFrame,
            animationTime: this.animationTime,
            facingDirection: this.facingDirection,
            state: this.state,
            patrolTarget: this.patrolTarget,
            lastPlayerPos: this.lastPlayerPos,
            drops: this.drops
        };
    }

    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.type = data.type;
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.damage = data.damage;
        this.speed = data.speed;
        this.experienceValue = data.experienceValue;
        this.coins = data.coins;

        // Ensure stats object exists and has proper values
        this.stats = data.stats || {
            attack: this.damage || 10,
            defense: 0,
            speed: this.speed || 1
        };

        this.isAggressive = data.isAggressive;
        this.isFlying = data.isFlying;
        this.isRanged = data.isRanged;
        this.isBoss = data.isBoss;
        this.width = data.width || 1;
        this.height = data.height || 1;
        this.targetX = data.targetX;
        this.targetY = data.targetY;
        this.isMoving = data.isMoving;
        this.moveProgress = data.moveProgress;
        this.moveTimer = data.moveTimer;
        this.moveInterval = data.moveInterval;
        this.attackCooldown = data.attackCooldown;
        this.attackRange = data.attackRange;
        this.detectionRange = data.detectionRange;
        this.lastAttackTime = data.lastAttackTime;
        this.attackInterval = data.attackInterval;
        this.animationFrame = data.animationFrame;
        this.animationTime = data.animationTime;
        this.facingDirection = data.facingDirection;
        this.state = data.state;
        this.patrolTarget = data.patrolTarget;
        this.lastPlayerPos = data.lastPlayerPos;
        this.drops = data.drops;
    }

    getRenderPosition() {
        if (this.isMoving) {
            const t = Utils.easeInOut(this.moveProgress);
            return {
                x: Utils.lerp(this.x, this.targetX, t),
                y: Utils.lerp(this.y, this.targetY, t)
            };
        }
        return { x: this.x, y: this.y };
    }
}