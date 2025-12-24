// assets/main.js
// Main entry point for WCAG 2.2 Card Deck

import { loadJSON } from './data.js';
import { renderCards } from './render.js';
import { setupFilters } from './filters.js';
import { createElement } from './utils.js';

// Global config variable
let appConfig = {
    languages: {
        hiddenLanguages: [],
        defaultLanguage: "en"
    },
    developer: {
        devMode: false,
        verboseLogging: false
    },
    ui: {
        cardsPerPage: 0,
        enableAnimation: true,
        colorScheme: "auto",
        highContrastMode: false
    },
    features: {
        enableQrCodes: true,
        enableFilters: true,
        enableSearch: true
    },
    cache: {
        enabled: true,
        duration: 86400
    }
};

async function loadAppConfig() {
    try {
        const config = await loadJSON('config/app-config.json');
        appConfig = { 
            ...appConfig,
            ...config
        };
        
        if (appConfig.developer?.verboseLogging) {
            console.log('App config loaded:', appConfig);
        }
        
        return config;
    } catch (error) {
        console.warn('Failed to load app config:', error);
        return appConfig;
    }
}

function renderDevPanel(relations, translations, criteria, principles, lang) {
    const existingPanel = document.getElementById('data-loading-test');
    if (existingPanel) existingPanel.remove();

    if (!appConfig.developer?.devMode) return;

    const panelContent = [
        createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            createElement('h3', { style: { marginTop: '0' } }, 'Data Loading Test Panel (Dev Mode)'),
            createElement('button', { id: 'close-test-panel', style: { padding: '5px 10px' }, onclick: () => {
                document.getElementById('data-loading-test').style.display = 'none';
            } }, '×')
        ]),
        createElement('div', { style: { display: 'flex', gap: '20px' } }, [
            createElement('div', {}, [
                createElement('h4', {}, 'Data Loading'),
                createElement('p', {}, `Relations: ${Object.keys(relations).length} entries`),
                createElement('p', {}, `Translations: ${Object.keys(translations).length} entries`),
                createElement('p', {}, `Criteria: ${Object.keys(criteria).length} entries`),
                createElement('p', {}, `Principles: ${Object.keys(principles).length} entries`)
            ]),
            createElement('div', {}, [
                createElement('h4', {}, 'Active Configuration'),
                createElement('p', {}, `Language: ${lang} (Default: ${appConfig.languages?.defaultLanguage || 'en'})`),
                createElement('p', {}, `Hidden Languages: ${(appConfig.languages?.hiddenLanguages || []).join(', ') || 'None'}`),
                createElement('p', {}, `UI Settings: ${appConfig.ui?.colorScheme || 'auto'} mode, Animations: ${appConfig.ui?.enableAnimation ? 'On' : 'Off'}`)
            ])
        ]),
        createElement('p', {}, [
            createElement('small', {}, 'To disable this panel, set "developer.devMode": false in config/app-config.json or press Ctrl+Shift+D')
        ])
    ];

    const testEl = createElement('div', {
        id: 'data-loading-test',
        style: {
            padding: '20px',
            margin: '20px',
            border: '2px solid red',
            background: '#fff',
            borderRadius: '5px'
        }
    }, panelContent);

    document.body.insertBefore(testEl, document.getElementById('main-content'));
}

function renderError(error) {
    console.error('Error in loadAndRender:', error);
    const container = document.getElementById('cards-overview');
    container.innerHTML = '';
    
    container.appendChild(createElement('div', { className: 'no-results-message' }, [
        createElement('h3', {}, 'Error loading JSON data'),
        createElement('p', {}, `Details: ${error.message || 'Unknown error'}`),
        createElement('p', {}, [
            createElement('strong', {}, 'Solution:'),
            ' This is most likely due to CORS restrictions when loading files directly from the filesystem.'
        ]),
        createElement('p', {}, 'Please use one of the following methods to run the application:'),
        createElement('ol', {}, [
            createElement('li', {}, [createElement('strong', {}, 'Python server:'), ' Run ', createElement('code', {}, 'python server.py'), ' in the terminal']),
            createElement('li', {}, [createElement('strong', {}, 'Node.js server:'), ' Run ', createElement('code', {}, 'node server.js'), ' in the terminal']),
            createElement('li', {}, [createElement('strong', {}, 'VS Code:'), ' Use the Live Server extension'])
        ]),
        createElement('p', {}, ['Then access the application at ', createElement('a', { href: 'http://localhost:8000' }, 'http://localhost:8000')])
    ]));
}

async function loadAndRender() {
    try {
        console.log('Starting data loading...');
        const lang = document.getElementById('language').value;
        console.log(`Selected language: ${lang}`);
        document.documentElement.setAttribute('lang', lang);
        
        console.log('Loading JSON files...');
        const [relations, translations, criteria, principles] = await Promise.all([
            loadJSON('localization/data-relations.json'),
            loadJSON(`localization/${lang}/translations.json`),
            loadJSON(`localization/${lang}/success-criteria.json`),
            loadJSON(`localization/${lang}/principles_guidelines.json`)
        ]);
        
        console.log('Data loaded:', {
            relationsEntries: Object.keys(relations).length,
            translationsEntries: Object.keys(translations).length,
            criteriaEntries: Object.keys(criteria).length,
            principlesEntries: Object.keys(principles).length
        });
        
        renderDevPanel(relations, translations, criteria, principles, lang);
        
        setupFilters({ relations, translations, criteria, principles, renderCards });
    } catch (error) {
        renderError(error);
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
}

// Debug mode toggle function
function toggleDevMode() {
    // Ensure the developer object exists
    if (!appConfig.developer) {
        appConfig.developer = {};
    }
    
    // Toggle the devMode flag
    appConfig.developer.devMode = !appConfig.developer.devMode;
    
    console.log(`Dev mode ${appConfig.developer.devMode ? 'enabled' : 'disabled'}`);
    
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
