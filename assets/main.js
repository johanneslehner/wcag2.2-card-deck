// assets/main.js
// Main entry point for WCAG 2.2 Card Deck

import { loadJSONWithLogger } from './data.js';
import { renderCards } from './render.js';
import { setupFilters } from './filters.js';
import { createLogger } from './logger.js';

const DEFAULT_CONFIG = {
    languages: {
        hiddenLanguages: [],
        defaultLanguage: "en",
    },
    developer: {
        devMode: false,
        verboseLogging: false,
    },
    ui: {
        cardsPerPage: 0,
        enableAnimation: true,
        colorScheme: "auto", // "auto" | "light" | "dark"
        highContrastMode: false,
    },
    features: {
        enableQrCodes: true,
        enableFilters: true,
        enableSearch: true,
    },
    cache: {
        enabled: true,
        duration: 86400,
    },
};

let appConfig = structuredClone(DEFAULT_CONFIG);
let logger = createLogger({ verbose: false });

function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && value.constructor === Object;
}

function deepMerge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) return override ?? base;
    const out = { ...base };
    for (const [k, v] of Object.entries(override)) {
        out[k] = isPlainObject(v) ? deepMerge(base[k] ?? {}, v) : v;
    }
    return out;
}

function applyUiConfig(config) {
    const root = document.documentElement;

    // color scheme
    const scheme = config?.ui?.colorScheme || 'auto';
    if (scheme === 'light' || scheme === 'dark') {
        root.dataset.colorScheme = scheme;
    } else {
        delete root.dataset.colorScheme;
    }

    // high contrast
    if (config?.ui?.highContrastMode) {
        root.dataset.highContrast = 'true';
    } else {
        delete root.dataset.highContrast;
    }

    // motion
    if (config?.ui?.enableAnimation === false) {
        root.dataset.reduceMotion = 'true';
    } else {
        delete root.dataset.reduceMotion;
    }
}

async function loadAppConfig() {
    try {
        const config = await loadJSONWithLogger('config/app-config.json', logger);
        appConfig = deepMerge(DEFAULT_CONFIG, config);
        logger = createLogger({ verbose: Boolean(appConfig.developer?.verboseLogging) });
        applyUiConfig(appConfig);
        logger.debug('App config loaded:', appConfig);
        return appConfig;
    } catch (error) {
        logger.warn('Failed to load app config:', error);
        applyUiConfig(appConfig);
        return appConfig;
    }
}

async function loadAndRender() {
    try {
        const lang = document.getElementById('language').value;
        document.documentElement.setAttribute('lang', lang);

        const [relations, translations, criteria, principles] = await Promise.all([
            loadJSONWithLogger('localization/data-relations.json', logger),
            loadJSONWithLogger(`localization/${lang}/translations.json`, logger),
            loadJSONWithLogger(`localization/${lang}/success-criteria.json`, logger),
            loadJSONWithLogger(`localization/${lang}/principles_guidelines.json`, logger),
        ]);
        logger.debug('Data loaded:', {
            relationsEntries: Object.keys(relations || {}).length,
            translationsEntries: Object.keys(translations || {}).length,
            criteriaEntries: Object.keys(criteria || {}).length,
            principlesEntries: Object.keys(principles || {}).length,
        });
        
        // Only show the test panel if devMode is enabled
        if (appConfig.developer?.devMode) {
            const testEl = document.createElement('section');
            testEl.id = 'data-loading-test';
            testEl.className = 'dev-panel';

            testEl.innerHTML = `
                <header class="dev-panel__header">
                    <h3 class="dev-panel__title">Data Loading Test Panel (Dev Mode)</h3>
                    <button id="close-test-panel" class="dev-panel__close" type="button" aria-label="Close">×</button>
                </header>
                <div class="dev-panel__grid">
                    <div>
                        <h4>Data Loading</h4>
                        <p>Relations: ${Object.keys(relations).length} entries</p>
                        <p>Translations: ${Object.keys(translations).length} entries</p>
                        <p>Criteria: ${Object.keys(criteria).length} entries</p>
                        <p>Principles: ${Object.keys(principles).length} entries</p>
                    </div>
                    <div>
                        <h4>Active Configuration</h4>
                        <p>Language: ${lang} (Default: ${appConfig.languages?.defaultLanguage || 'en'})</p>
                        <p>Hidden Languages: ${(appConfig.languages?.hiddenLanguages || []).join(', ') || 'None'}</p>
                        <p>UI Settings: ${appConfig.ui?.colorScheme || 'auto'} mode, Animations: ${appConfig.ui?.enableAnimation ? 'On' : 'Off'}</p>
                    </div>
                </div>
                <p class="dev-panel__hint"><small>To disable this panel, set "developer.devMode": false in config/app-config.json or press Ctrl+Shift+D</small></p>
            `;
            document.body.insertBefore(testEl, document.getElementById('main-content'));
            
            // Add event listener to close button
            document.getElementById('close-test-panel').addEventListener('click', () => {
                document.getElementById('data-loading-test').style.display = 'none';
            });
        }
        
        setupFilters({ relations, translations, criteria, principles, renderCards });
    } catch (error) {
        logger.error('Error in loadAndRender:', error);
        document.getElementById('cards-overview').innerHTML = 
            `<div class="no-results-message">
                <h3>Error loading JSON data</h3>
                <p>Details: ${error.message || 'Unknown error'}</p>
                <p><strong>Solution:</strong> This is most likely due to CORS restrictions when loading files directly from the filesystem.</p>
                <p>Please use one of the following methods to run the application:</p>
                <ol>
                    <li><strong>Python server:</strong> Run <code>python server.py</code> in the terminal</li>
                    <li><strong>Node.js server:</strong> Run <code>node server.js</code> in the terminal</li>
                    <li><strong>VS Code:</strong> Use the Live Server extension</li>
                </ol>
                <p>Then access the application at <a href="http://localhost:8000">http://localhost:8000</a></p>
            </div>`;
    }
}


async function getAvailableLanguages() {
    // Simulate folder list (since JS can't read folders directly in browser)
    const allLangs = ['de', 'en', 'es', 'fr', 'id', 'it', 'nl', 'sk'];
    
    // Use the hiddenLanguages setting from the config
    const hiddenLanguages = appConfig.languages?.hiddenLanguages || [];
    
    return allLangs.filter(lang => !hiddenLanguages.includes(lang));
}

async function populateLanguageSelect() {
    const select = document.getElementById('language');
    select.innerHTML = '';
    const langs = await getAvailableLanguages();
    const labels = {
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        fr: 'Français',
        id: 'Bahasa Indonesia',
        it: 'Italiano',
        nl: 'Nederlands',
        sk: 'Slovenský'
    };
    langs.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = labels[lang] || lang;
        select.appendChild(option);
    });

    const preferred = appConfig.languages?.defaultLanguage || 'en';
    if (langs.includes(preferred)) {
        select.value = preferred;
    }
}

// Debug mode toggle function
function toggleDevMode() {
    // Ensure the developer object exists
    if (!appConfig.developer) {
        appConfig.developer = {};
    }
    
    // Toggle the devMode flag
    appConfig.developer.devMode = !appConfig.developer.devMode;
    
    logger.log(`Dev mode ${appConfig.developer.devMode ? 'enabled' : 'disabled'}`);
    
    // Remove existing test panel if it exists
    const existingPanel = document.getElementById('data-loading-test');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Reload the application
    loadAndRender();
}

window.addEventListener('DOMContentLoaded', async () => {
    // Load app configuration first
    await loadAppConfig();
    
    // Add keyboard shortcut for toggling dev mode (Ctrl+Shift+D)
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            toggleDevMode();
        }
    });
    
    await populateLanguageSelect();
    document.getElementById('language').addEventListener('change', loadAndRender);
    loadAndRender();
});
