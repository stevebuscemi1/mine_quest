// js/systems/Timer.js'

import { Utils } from '../utils/Utils.js';

export class Timer {
    constructor(duration, onExpire = null) {
        this.duration = duration; // Duration in seconds
        this.remaining = duration;
        this.isRunning = false;
        this.isPaused = false;
        this.lastUpdate = 0;
        this.onExpire = onExpire;
        
        // Formatting
        this.showMilliseconds = false;
        this.warningThreshold = 60; // Show warning when 60 seconds left
        this.criticalThreshold = 10; // Show critical when 10 seconds left
        
        // Events
        this.listeners = new Set();
        
        // State tracking
        this.hasExpired = false;
        this.totalElapsed = 0;
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPausedTime = 0;
    }
    
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        if (this.isPaused) {
            // Resume from pause
            this.totalPausedTime += Date.now() - this.pauseTime;
            this.isPaused = false;
        } else {
            // Start fresh
            this.remaining = this.duration;
            this.totalElapsed = 0;
            this.hasExpired = false;
            this.totalPausedTime = 0;
            this.startTime = Date.now();
        }
        
        this.isRunning = true;
        this.lastUpdate = Date.now();
        
        this.notifyListeners('started', { remaining: this.remaining });
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pauseTime = Date.now();
        
        this.notifyListeners('paused', { remaining: this.remaining });
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.hasExpired = false;
        
        this.notifyListeners('stopped', { remaining: this.remaining });
    }
    
    reset(duration = null) {
        this.stop();
        
        if (duration !== null) {
            this.duration = duration;
        }
        
        this.remaining = this.duration;
        this.totalElapsed = 0;
        this.hasExpired = false;
        this.totalPausedTime = 0;
        
        this.notifyListeners('reset', { remaining: this.remaining });
    }
    
    update() {
        if (!this.isRunning || this.isPaused) return false;
        
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        this.remaining -= deltaTime;
        this.totalElapsed += deltaTime;
        
        // Check for warning thresholds
        if (this.remaining <= this.criticalThreshold && this.remaining > this.criticalThreshold - 1) {
            this.notifyListeners('critical', { remaining: this.remaining });
        } else if (this.remaining <= this.warningThreshold && this.remaining > this.warningThreshold - 1) {
            this.notifyListeners('warning', { remaining: this.remaining });
        }
        
        // Check if expired
        if (this.remaining <= 0 && !this.hasExpired) {
            this.remaining = 0;
            this.hasExpired = true;
            this.isRunning = false;
            
            this.notifyListeners('expired', { 
                remaining: 0, 
                totalElapsed: this.totalElapsed 
            });
            
            if (this.onExpire) {
                this.onExpire();
            }
            
            return true; // Timer expired
        }
        
        this.notifyListeners('updated', { 
            remaining: this.remaining, 
            totalElapsed: this.totalElapsed 
        });
        
        return false;
    }
    
    addTime(seconds) {
        this.remaining = Math.max(0, this.remaining + seconds);
        this.notifyListeners('timeAdded', { 
            remaining: this.remaining, 
            added: seconds 
        });
    }
    
    removeTime(seconds) {
        this.remaining = Math.max(0, this.remaining - seconds);
        this.notifyListeners('timeRemoved', { 
            remaining: this.remaining, 
            removed: seconds 
        });
        
        if (this.remaining <= 0 && !this.hasExpired) {
            this.update(); // Trigger expiration
        }
    }
    
    getFormattedTime(showMilliseconds = null) {
        const showMs = showMilliseconds !== null ? showMilliseconds : this.showMilliseconds;
        
        const minutes = Math.floor(this.remaining / 60);
        const seconds = Math.floor(this.remaining % 60);
        const milliseconds = Math.floor((this.remaining % 1) * 100);
        
        if (showMs) {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    getPercentage() {
        return (this.remaining / this.duration) * 100;
    }
    
    getState() {
        if (this.hasExpired) return 'expired';
        if (this.isPaused) return 'paused';
        if (this.isRunning) return 'running';
        return 'stopped';
    }
    
    isWarning() {
        return this.remaining <= this.warningThreshold && this.remaining > 0;
    }
    
    isCritical() {
        return this.remaining <= this.criticalThreshold && this.remaining > 0;
    }
    
    getTimeElapsed() {
        return this.totalElapsed;
    }
    
    getTimeElapsedFormatted() {
        return Utils.formatTime(this.totalElapsed);
    }
    
    setWarningThreshold(seconds) {
        this.warningThreshold = seconds;
    }
    
    setCriticalThreshold(seconds) {
        this.criticalThreshold = seconds;
    }
    
    setOnExpire(callback) {
        this.onExpire = callback;
    }
    
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Timer listener error:', error);
            }
        }
    }
    
    clone() {
        const cloned = new Timer(this.duration, this.onExpire);
        cloned.remaining = this.remaining;
        cloned.isRunning = this.isRunning;
        cloned.isPaused = this.isPaused;
        cloned.hasExpired = this.hasExpired;
        cloned.totalElapsed = this.totalElapsed;
        cloned.warningThreshold = this.warningThreshold;
        cloned.criticalThreshold = this.criticalThreshold;
        cloned.showMilliseconds = this.showMilliseconds;
        
        return cloned;
    }
    
    serialize() {
        return {
            duration: this.duration,
            remaining: this.remaining,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            hasExpired: this.hasExpired,
            totalElapsed: this.totalElapsed,
            startTime: this.startTime,
            pauseTime: this.pauseTime,
            totalPausedTime: this.totalPausedTime,
            warningThreshold: this.warningThreshold,
            criticalThreshold: this.criticalThreshold,
            showMilliseconds: this.showMilliseconds
        };
    }
    
    deserialize(data) {
        this.duration = data.duration;
        this.remaining = data.remaining;
        this.isRunning = data.isRunning;
        this.isPaused = data.isPaused;
        this.hasExpired = data.hasExpired;
        this.totalElapsed = data.totalElapsed;
        this.startTime = data.startTime;
        this.pauseTime = data.pauseTime;
        this.totalPausedTime = data.totalPausedTime;
        this.warningThreshold = data.warningThreshold || 60;
        this.criticalThreshold = data.criticalThreshold || 10;
        this.showMilliseconds = data.showMilliseconds || false;
        
        // Adjust timing based on current time
        if (this.isRunning && !this.isPaused) {
            const elapsedSinceSave = (Date.now() - data.startTime - data.totalPausedTime) / 1000;
            this.remaining = Math.max(0, this.duration - elapsedSinceSave);
            this.lastUpdate = Date.now();
            
            if (this.remaining <= 0) {
                this.hasExpired = true;
                this.isRunning = false;
            }
        } else if (this.isPaused) {
            this.lastUpdate = this.pauseTime;
        }
    }
}

// Timer Manager for handling multiple timers
export class TimerManager {
    constructor() {
        this.timers = new Map();
        this.globalTimeScale = 1.0;
    }
    
    createTimer(id, duration, onExpire = null) {
        const timer = new Timer(duration, onExpire);
        this.timers.set(id, timer);
        return timer;
    }
    
    getTimer(id) {
        return this.timers.get(id);
    }
    
    removeTimer(id) {
        const timer = this.timers.get(id);
        if (timer) {
            timer.stop();
            this.timers.delete(id);
            return true;
        }
        return false;
    }
    
    updateAll() {
        for (const timer of this.timers.values()) {
            timer.update();
        }
    }
    
    pauseAll() {
        for (const timer of this.timers.values()) {
            timer.pause();
        }
    }
    
    resumeAll() {
        for (const timer of this.timers.values()) {
            timer.start();
        }
    }
    
    stopAll() {
        for (const timer of this.timers.values()) {
            timer.stop();
        }
    }
    
    setGlobalTimeScale(scale) {
        this.globalTimeScale = Utils.clamp(scale, 0.1, 5.0);
    }
    
    getTimerCount() {
        return this.timers.size;
    }
    
    getRunningTimers() {
        return Array.from(this.timers.values()).filter(timer => timer.isRunning);
    }
    
    serialize() {
        const data = {};
        for (const [id, timer] of this.timers) {
            data[id] = timer.serialize();
        }
        return {
            timers: data,
            globalTimeScale: this.globalTimeScale
        };
    }
    
    deserialize(data) {
        this.timers.clear();
        
        for (const [id, timerData] of Object.entries(data.timers)) {
            const timer = new Timer(timerData.duration);
            timer.deserialize(timerData);
            this.timers.set(id, timer);
        }
        
        this.globalTimeScale = data.globalTimeScale || 1.0;
    }
}