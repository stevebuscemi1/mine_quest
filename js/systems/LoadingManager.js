// js/systems/LoadingManager.js

export class LoadingManager {
    constructor() {
        this.isLoading = false;
        this.progress = 0;
        this.loadingSteps = [];
        this.currentStep = 0;
        this.loadingTips = [
            'Initializing game world...',
            'Loading assets...',
            'Generating terrain...',
            'Creating enemies...',
            'Setting up interface...',
            'Preparing for adventure...',
            'Almost ready...',
            'Get your pickaxe ready!'
        ];
        this.tipIndex = 0;
    }

    show() {
        this.isLoading = true;
        this.progress = 0;
        this.currentStep = 0;

        const loadingScreen = document.getElementById('loadingScreen');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingTip = document.getElementById('loadingTip');

        if (loadingScreen) {
            // Reset loading screen state
            loadingScreen.classList.remove('hidden');
            loadingScreen.style.opacity = '1';
            loadingScreen.style.visibility = 'visible';
            loadingScreen.style.transition = 'none'; // Remove transition for immediate show
        }

        if (progressFill) {
            progressFill.style.width = '0%';
            progressFill.style.transition = 'width 0.3s ease';
        }

        if (progressText) {
            progressText.textContent = 'Loading... 0%';
        }

        if (loadingTip) {
            loadingTip.textContent = 'Initializing...';
        }

        // Start tip rotation and progress animation
        this.startTipRotation(loadingTip);
        this.startProgressAnimation(progressFill, progressText);
    }

    hide() {
        console.log('LoadingManager: Hide method called');
        this.isLoading = false;

        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            console.log('LoadingManager: Found loading screen element, hiding it');

            // Add fade transition
            loadingScreen.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.pointerEvents = 'none';

            // Remove from view after transition
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                loadingScreen.style.opacity = '1'; // Reset for next use
                loadingScreen.style.visibility = 'hidden';
                loadingScreen.style.pointerEvents = 'auto';
                console.log('LoadingManager: Loading screen hidden successfully');
            }, 500);
        } else {
            console.log('LoadingManager: Loading screen element not found');
        }
    }

    startTipRotation(tipElement) {
        if (!tipElement) return;

        const updateTip = () => {
            if (!this.isLoading) return;

            tipElement.textContent = this.loadingTips[this.tipIndex];
            this.tipIndex = (this.tipIndex + 1) % this.loadingTips.length;

            setTimeout(updateTip, 2000); // Change tip every 2 seconds
        };

        updateTip();
    }

    startProgressAnimation(progressFill, progressText) {
        const animate = () => {
            if (!this.isLoading) return;

            // Simulate loading progress
            const targetProgress = Math.min(95, this.progress + Math.random() * 5);
            this.progress = targetProgress;

            if (progressFill) {
                progressFill.style.width = `${this.progress}%`;
            }

            if (progressText) {
                progressText.textContent = `Loading... ${Math.floor(this.progress)}%`;
            }

            if (this.progress < 95) {
                setTimeout(animate, 100 + Math.random() * 200); // Random delay between updates
            }
        };

        animate();
    }

    updateProgress(newProgress, stepName = '') {
        this.progress = Math.max(this.progress, newProgress);

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingTip = document.getElementById('loadingTip');

        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${stepName || 'Loading'}... ${Math.floor(this.progress)}%`;
        }

        if (loadingTip && stepName) {
            loadingTip.textContent = stepName;
        }
    }

    complete() {
        console.log('LoadingManager: Complete method called');
        this.progress = 100;

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = '100%';
            console.log('LoadingManager: Progress bar set to 100%');
        }

        if (progressText) {
            progressText.textContent = 'Complete! 100%';
            console.log('LoadingManager: Progress text set to complete');
        }

        // Wait a moment before hiding with fade effect
        setTimeout(() => {
            console.log('LoadingManager: Calling hide after delay');
            this.hide();
        }, 800); // Increased delay for better visual completion
    }

    async simulateLoading(steps = []) {
        this.loadingSteps = steps.length > 0 ? steps : [
            { name: 'Initializing game world', duration: 800 },
            { name: 'Loading assets', duration: 600 },
            { name: 'Generating terrain', duration: 1000 },
            { name: 'Creating enemies', duration: 400 },
            { name: 'Setting up interface', duration: 300 },
            { name: 'Preparing for adventure', duration: 200 }
        ];

        this.show();

        for (let i = 0; i < this.loadingSteps.length; i++) {
            const step = this.loadingSteps[i];
            const stepProgress = Math.round((i / this.loadingSteps.length) * 100);

            this.updateProgress(stepProgress, step.name);
            await this.wait(step.duration);
        }

        this.complete();
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
