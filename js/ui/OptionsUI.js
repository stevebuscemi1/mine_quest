// js/ui/OptionsUI.js

const STORAGE_KEY = 'minequest_options';

const DEFAULT_OPTIONS = {
    fogOfWar: true,
    showGrid: false,
    musicVolume: 50,
    sfxVolume: 50,
    showFPS: false,
    showCoords: false,
    zoomEnabled: false
};

const SECTION_TITLES = {
    gameplay: 'Gameplay',
    audio: 'Audio',
    display: 'Display'
};

export class OptionsUI {
    static loadOptions() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_OPTIONS, ...parsed };
            }
        } catch (error) {
            console.error('OptionsUI: Failed to load options', error);
        }

        return { ...DEFAULT_OPTIONS };
    }

    static saveOptions(options) {
        try {
            const normalized = { ...DEFAULT_OPTIONS, ...options };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            return normalized;
        } catch (error) {
            console.error('OptionsUI: Failed to save options', error);
            return { ...DEFAULT_OPTIONS, ...options };
        }
    }

    static buildOptionsMarkup(options, { prefix = 'options', useInlineStyles = false } = {}) {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        const panelStyle = useInlineStyles ? 'style="text-align: left; padding: 20px;"' : '';
        const groupStyle = useInlineStyles ? 'style="margin: 20px 0;"' : '';
        const itemStyle = useInlineStyles ? 'style="margin: 10px 0;"' : '';
        const labelStyle = useInlineStyles ? 'style="display: flex; align-items: center; gap: 10px;"' : '';
        const sliderStyle = useInlineStyles ? 'style="width: 100%;"' : '';

        return `
            <div class="options-panel" ${panelStyle}>
                <div class="option-group" ${groupStyle}>
                    <h4>${SECTION_TITLES.gameplay}</h4>
                    <div class="option-item" ${itemStyle}>
                        <label ${labelStyle}>
                            <input type="checkbox" id="${prefix}FogOfWarToggle" ${opts.fogOfWar ? 'checked' : ''}>
                            <span>Enable Fog of War</span>
                        </label>
                    </div>
                    <div class="option-item" ${itemStyle}>
                        <label ${labelStyle}>
                            <input type="checkbox" id="${prefix}ShowGridToggle" ${opts.showGrid ? 'checked' : ''}>
                            <span>Show Grid Lines</span>
                        </label>
                    </div>
                </div>
                <div class="option-group" ${groupStyle}>
                    <h4>${SECTION_TITLES.audio}</h4>
                    <div class="option-item" ${itemStyle}>
                        <label>Music Volume</label>
                        <input type="range" id="${prefix}MusicVolume" min="0" max="100" value="${opts.musicVolume}" ${sliderStyle}>
                        <span id="${prefix}MusicVolumeValue">${opts.musicVolume}%</span>
                    </div>
                    <div class="option-item" ${itemStyle}>
                        <label>SFX Volume</label>
                        <input type="range" id="${prefix}SfxVolume" min="0" max="100" value="${opts.sfxVolume}" ${sliderStyle}>
                        <span id="${prefix}SfxVolumeValue">${opts.sfxVolume}%</span>
                    </div>
                </div>
                <div class="option-group" ${groupStyle}>
                    <h4>${SECTION_TITLES.display}</h4>
                    <div class="option-item" ${itemStyle}>
                        <label ${labelStyle}>
                            <input type="checkbox" id="${prefix}ShowFPSToggle" ${opts.showFPS ? 'checked' : ''}>
                            <span>Show FPS Counter</span>
                        </label>
                    </div>
                    <div class="option-item" ${itemStyle}>
                        <label ${labelStyle}>
                            <input type="checkbox" id="${prefix}ShowCoordsToggle" ${opts.showCoords ? 'checked' : ''}>
                            <span>Show Cell Coordinates</span>
                        </label>
                    </div>
                    <div class="option-item" ${itemStyle}>
                        <label ${labelStyle}>
                            <input type="checkbox" id="${prefix}ZoomEnabledToggle" ${opts.zoomEnabled ? 'checked' : ''}>
                            <span>Enable Zoom (Mouse Wheel)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    static bindLiveUpdates(prefix) {
        const musicSlider = document.getElementById(`${prefix}MusicVolume`);
        const musicValue = document.getElementById(`${prefix}MusicVolumeValue`);
        const sfxSlider = document.getElementById(`${prefix}SfxVolume`);
        const sfxValue = document.getElementById(`${prefix}SfxVolumeValue`);

        if (musicSlider && musicValue) {
            musicSlider.addEventListener('input', (event) => {
                musicValue.textContent = `${event.target.value}%`;
            });
        }

        if (sfxSlider && sfxValue) {
            sfxSlider.addEventListener('input', (event) => {
                sfxValue.textContent = `${event.target.value}%`;
            });
        }
    }

    static readOptions(prefix) {
        const getCheckbox = (id, fallback = false) => {
            const element = document.getElementById(`${prefix}${id}`);
            return element ? element.checked : fallback;
        };

        const getSliderValue = (id, fallback = 50) => {
            const element = document.getElementById(`${prefix}${id}`);
            return element ? parseInt(element.value, 10) : fallback;
        };

        return {
            fogOfWar: getCheckbox('FogOfWarToggle', DEFAULT_OPTIONS.fogOfWar),
            showGrid: getCheckbox('ShowGridToggle', DEFAULT_OPTIONS.showGrid),
            musicVolume: getSliderValue('MusicVolume', DEFAULT_OPTIONS.musicVolume),
            sfxVolume: getSliderValue('SfxVolume', DEFAULT_OPTIONS.sfxVolume),
            showFPS: getCheckbox('ShowFPSToggle', DEFAULT_OPTIONS.showFPS),
            showCoords: getCheckbox('ShowCoordsToggle', DEFAULT_OPTIONS.showCoords),
            zoomEnabled: getCheckbox('ZoomEnabledToggle', DEFAULT_OPTIONS.zoomEnabled)
        };
    }

    static applyToGame(game, options) {
        if (!game) {
            return;
        }

        const opts = { ...DEFAULT_OPTIONS, ...options };

        if (game.debug) {
            game.debug.showFPS = opts.showFPS;
            game.debug.showCoords = opts.showCoords;
            game.debug.showGrid = opts.showGrid;
        }

        game.fogOfWar = game.fogOfWar || {};
        game.fogOfWar.enabled = opts.fogOfWar;

        if (game.audioManager?.setVolumes) {
            game.audioManager.setVolumes({
                music: opts.musicVolume / 100,
                sfx: opts.sfxVolume / 100
            });
        }
    }
}
