// Create new AudioSystem.js
import { Utils } from '../utils/Utils.js';
import { CELL_TYPES } from '../constants/GameConstants.js';

export class AudioSystem {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        this.volume = {
            master: 1.0,
            music: 0.7,
            sfx: 0.8
        };
        this.enabled = true;
        
        // Enemy sound timing control
        this.lastEnemySoundTime = 0;
        this.enemySoundCooldown = 3000; // 3 seconds
    }
    
    async loadSounds() {
        const soundList = {
            // Enemy sounds (using the provided files)
            'slime': 'assets/sounds/slime.m4a',
            'bat': 'assets/sounds/bat.m4a',
            'zombie': 'assets/sounds/zombie.m4a',
            'dragon': 'assets/sounds/dragon.m4a',
            
            // Player/Movement sounds
            'walking': 'assets/sounds/walking.m4a',
            'mining': 'assets/sounds/mining.m4a',
            'gold': 'assets/sounds/gold.m4a', // Special mining sound for gold
            'gems': 'assets/sounds/gems.m4a', // Special mining sound for gems
            
            // Merchant/Trading sounds
            'merchant': 'assets/sounds/merchant.m4a',
            'sell or buy': 'assets/sounds/sell or buy.m4a',
            
            // UI sounds
            'click': 'assets/sounds/click.m4a',
            'achievement': 'assets/sounds/achievement.m4a'
        };

        for (const [soundName, path] of Object.entries(soundList)) {
            try {
                const audio = await Utils.loadAudio(path);
                this.sounds.set(soundName, audio);
            } catch (error) {
                console.warn(`Failed to load sound ${path}:`, error);
            }
        }
    }
    
    async loadMusic() {
        const musicList = {
            'main_menu': 'assets/sounds/music/8-bit-loop-189494.mp3', // Using the 8-bit loop for main menu
            'mine_ambient': 'assets/sounds/music/mine_ambient.ogg',
            'cave_ambient': 'assets/sounds/music/ambient_cave.mp3', // Using the ambient cave for cave areas
            'crystal_cavern_ambient': 'assets/sounds/music/crystal_cavern_ambient.ogg',
            'ancient_ruins_ambient': 'assets/sounds/music/ancient_ruins_ambient.ogg',
            'cosmic_region_ambient': 'assets/sounds/music/cosmic_region_ambient.ogg',
            'boss_battle': 'assets/sounds/music/boss_battle.ogg',
            'ambient_cave': 'assets/sounds/music/ambient_cave.mp3' // Keeping this for backward compatibility
        };
        
        console.log('Loading music files...');

        for (const [musicName, path] of Object.entries(musicList)) {
            try {
                const audio = await Utils.loadAudio(path);
                audio.loop = true;
                this.music.set(musicName, audio);
            } catch (error) {
                console.warn(`Failed to load music ${path}:`, error);
            }
        }
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.enabled) return;
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            // Stop any currently playing instance of this sound to prevent overlap
            if (sound.currentTime > 0) {
                sound.pause();
                sound.currentTime = 0;
            }
            
            sound.volume = volume * this.volume.sfx * this.volume.master;
            sound.play().catch(error => {
                console.warn(`Failed to play sound ${soundName}:`, error);
            });
        }
    }
    
    playEnemySound(enemyType) {
        if (!this.enabled) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySoundTime < this.enemySoundCooldown) {
            return; // Still in cooldown
        }
        
        // Map enemy type to sound file
        let soundName;
        switch (enemyType) {
            case 'SLIME':
                soundName = 'slime';
                break;
            case 'BAT':
                soundName = 'bat';
                break;
            case 'ZOMBIE':
                soundName = 'zombie';
                break;
            case 'DRAGON':
                soundName = 'dragon';
                break;
            default:
                return; // No sound for this enemy type
        }
        
        this.playSound(soundName);
        this.lastEnemySoundTime = currentTime;
    }
    
    playMiningSound(material) {
        if (!this.enabled) return;

        let materialType = material;

        if (typeof materialType === 'object' && materialType !== null) {
            materialType =
                materialType.materialType ??
                materialType.type ??
                materialType.material ??
                materialType.cellType ??
                materialType.id ??
                materialType.value;
        }

        if (typeof materialType !== 'number') {
            this.playSound('mining');
            return;
        }

        let soundName = 'mining';

        if (materialType === 5) { // GOLD
            soundName = 'gold';
        } else if ([
            4,  // GEM
            18, // DIAMOND
            19, // EMERALD
            20, // RUBY
            21, // SAPPHIRE
            22  // AMETHYST
        ].includes(materialType)) {
            soundName = 'gems';
        }

        this.playSound(soundName);
    }
    
    playWalkingSound() {
        if (!this.enabled) return;
        this.playSound('walking');
    }
    
    playMerchantSound() {
        if (!this.enabled) return;
        this.playSound('merchant');
    }
    
    playTradingSound() {
        if (!this.enabled) return;
        this.playSound('sell or buy');
    }
    
    playClickSound() {
        if (!this.enabled) return;
        this.playSound('click');
    }
    
    playAchievementSound() {
        if (!this.enabled) return;
        this.playSound('achievement');
    }
    
    playMusic(musicName, volume = 1.0) {
        if (!this.enabled) {
            console.log(`Music playback disabled, skipping: ${musicName}`);
            return;
        }
        
        // Don't restart the same music if it's already playing
        if (this.currentMusic && this.currentMusic === this.music.get(musicName) && !this.currentMusic.paused) {
            console.log(`Music ${musicName} is already playing`);
            return;
        }
        
        console.log(`Attempting to play music: ${musicName}`);
        
        // Stop current music with fade out
        if (this.currentMusic) {
            console.log(`Stopping current music`);
            this.fadeOutCurrentMusic(500); // 500ms fade out
        }
        
        const music = this.music.get(musicName);
        if (music) {
            console.log(`Found music track: ${musicName}`);
            const calculatedVolume = volume * this.volume.music * this.volume.master;
            console.log(`Setting volume to: ${calculatedVolume}`);
            music.volume = calculatedVolume;
            
            // Add event listeners for debugging
            music.onplay = () => console.log(`Music started playing: ${musicName}`);
            music.onerror = (e) => console.error(`Error playing music ${musicName}:`, e);
            
            const playPromise = music.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error(`Failed to play music ${musicName}:`, error);
                    // Try to play fallback music
                    if (musicName !== 'main_menu') {
                        console.log('Trying to play fallback music...');
                        this.playMusic('main_menu', volume);
                    }
                });
            }
            
            this.currentMusic = music;
        } else {
            console.warn(`Music track not found: ${musicName}`);
            console.log('Available music tracks:', Array.from(this.music.keys()));
        }
    }
    
    fadeOutCurrentMusic(duration = 500) {
        if (!this.currentMusic) return Promise.resolve();
        
        return new Promise(resolve => {
            const startVolume = this.currentMusic.volume;
            const fadeOutInterval = 50; // ms
            const steps = duration / fadeOutInterval;
            const stepSize = startVolume / steps;
            
            const fadeOut = setInterval(() => {
                if (this.currentMusic.volume > stepSize) {
                    this.currentMusic.volume -= stepSize;
                } else {
                    this.currentMusic.volume = 0;
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                    clearInterval(fadeOut);
                    resolve();
                }
            }, fadeOutInterval);
            
            // Store the interval ID so we can clear it if needed
            this.fadeOutInterval = fadeOut;
        });
    }
    
    stopMusic() {
        if (this.currentMusic) {
            // Clear any ongoing fade out
            if (this.fadeOutInterval) {
                clearInterval(this.fadeOutInterval);
                this.fadeOutInterval = null;
            }
            
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic.volume = this.volume.music * this.volume.master; // Reset volume
            this.currentMusic = null;
        }
    }
    
    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
    }
    
    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play().catch(error => {
                console.warn('Failed to resume music:', error);
            });
        }
    }
    
    pauseAllSounds() {
        // Pause all currently playing sounds
        for (const [name, sound] of this.sounds) {
            if (!sound.paused) {
                sound.pause();
            }
        }
    }
    
    setMusicVolume(volume) {
        this.volume.music = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume.music * this.volume.master;
        }
    }
    
    setSFXVolume(volume) {
        this.volume.sfx = Math.max(0, Math.min(1, volume));
    }
    
    setMasterVolume(volume) {
        this.volume.master = Math.max(0, Math.min(1, volume));
        // Update current music volume
        if (this.currentMusic) {
            this.currentMusic.volume = this.volume.music * this.volume.master;
        }
    }
}