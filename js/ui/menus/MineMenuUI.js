// js/ui/menus/MineMenuUI.js

const DEFAULT_CALLBACK = () => {};

export class MineMenuUI {
    constructor({
        onExitQuest = DEFAULT_CALLBACK,
        onSave = DEFAULT_CALLBACK,
        onLoad = DEFAULT_CALLBACK,
        onOptions = DEFAULT_CALLBACK,
        onContinue = DEFAULT_CALLBACK
    } = {}) {
        this.callbacks = {
            onExitQuest,
            onSave,
            onLoad,
            onOptions,
            onContinue
        };

        this.game = null;
        this.saveLoadUI = null;
        this.isVisible = false;

        this.overlay = this.createOverlay();
        this.dialog = this.overlay.querySelector('.mine-menu');
        this.buttons = this.mapButtons();

        this.attachEventListeners();
        document.body.appendChild(this.overlay);
    }

    setCallbacks(callbacks = {}) {
        this.callbacks = {
            ...this.callbacks,
            ...Object.fromEntries(
                Object.entries(callbacks).filter(([key, value]) =>
                    Object.prototype.hasOwnProperty.call(this.callbacks, key) && typeof value === 'function'
                )
            )
        };
    }

    setGame(game) {
        this.game = game;
    }

    setSaveLoadUI(saveLoadUI) {
        this.saveLoadUI = saveLoadUI;
    }

    show() {
        if (this.isVisible) {
            return;
        }

        this.overlay.classList.remove('hidden');
        this.overlay.setAttribute('aria-hidden', 'false');
        this.isVisible = true;

        // Focus the first actionable button for accessibility
        this.buttons.exitQuest?.focus({ preventScroll: true });
    }

    hide() {
        if (!this.isVisible) {
            return;
        }

        this.overlay.classList.add('hidden');
        this.overlay.setAttribute('aria-hidden', 'true');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    isOpen() {
        return this.isVisible;
    }

    destroy() {
        this.overlay?.remove();
        this.overlay = null;
        this.dialog = null;
        this.buttons = {};
        this.isVisible = false;
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'mine-menu-overlay hidden';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');

        overlay.innerHTML = `
            <div class="mine-menu" tabindex="-1">
                <h2 class="mine-menu__title">Mine Menu</h2>
                <div class="mine-menu__buttons">
                    <button class="mine-menu__button mine-menu__button--danger" data-action="exit">
                        Exit Quest
                    </button>
                    <button class="mine-menu__button" data-action="save">
                        Save
                    </button>
                    <button class="mine-menu__button" data-action="load">
                        Load
                    </button>
                    <button class="mine-menu__button" data-action="options">
                        Options
                    </button>
                    <button class="mine-menu__button mine-menu__button--primary" data-action="continue">
                        Continue
                    </button>
                </div>
            </div>
        `;

        return overlay;
    }

    mapButtons() {
        if (!this.dialog) {
            return {};
        }

        return {
            exitQuest: this.dialog.querySelector('[data-action="exit"]'),
            save: this.dialog.querySelector('[data-action="save"]'),
            load: this.dialog.querySelector('[data-action="load"]'),
            options: this.dialog.querySelector('[data-action="options"]'),
            continue: this.dialog.querySelector('[data-action="continue"]')
        };
    }

    attachEventListeners() {
        if (!this.overlay || !this.dialog) {
            return;
        }

        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.handleContinue();
            }
        });

        this.dialog.addEventListener('click', (event) => {
            const action = event.target?.closest('[data-action]')?.dataset.action;
            if (!action) {
                return;
            }

            switch (action) {
                case 'exit':
                    this.handleExitQuest();
                    break;
                case 'save':
                    this.handleSave();
                    break;
                case 'load':
                    this.handleLoad();
                    break;
                case 'options':
                    this.handleOptions();
                    break;
                case 'continue':
                    this.handleContinue();
                    break;
                default:
                    break;
            }
        });

        this.dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.trapFocus(event);
            } else if (event.key === 'Escape') {
                this.handleContinue();
            }
        });
    }

    trapFocus(event) {
        const focusable = Array.from(
            this.dialog.querySelectorAll('button:not([disabled])')
        );

        if (focusable.length === 0) {
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
    }

    handleExitQuest() {
        this.hide();
        this.callbacks.onExitQuest?.();
    }

    handleSave() {
        this.hide();
        this.callbacks.onSave?.();
    }

    handleLoad() {
        this.hide();
        this.callbacks.onLoad?.();
    }

    handleOptions() {
        this.hide();
        this.callbacks.onOptions?.();
    }

    handleContinue() {
        this.hide();
        this.callbacks.onContinue?.();
    }
}
