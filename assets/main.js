/**
 * WCAG 2.2 Card Deck - Main Application Module
 * 
 * Entry point for the application. Handles initialization,
 * configuration loading, and language switching.
 * 
 * @module main
 */

import { loadJSON, loadLanguageData } from './data.js';
import { renderCards } from './render.js';
import { setupFilters } from './filters.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Supported languages with labels */
const LANGUAGE_LABELS = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  id: 'Bahasa Indonesia',
  it: 'Italiano',
  nl: 'Nederlands',
  sk: 'Slovenský'
};

/** All available language codes */
const ALL_LANGUAGES = Object.keys(LANGUAGE_LABELS);

/** Default application configuration */
const DEFAULT_CONFIG = {
  languages: {
    hiddenLanguages: [],
    defaultLanguage: 'en'
  },
  developer: {
    devMode: false,
    verboseLogging: false
  },
  ui: {
    cardsPerPage: 0,
    enableAnimation: true,
    colorScheme: 'auto',
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

// =============================================================================
// APPLICATION STATE
// =============================================================================

let appConfig = { ...DEFAULT_CONFIG };

// =============================================================================
// DOM REFERENCES
// =============================================================================

const getElements = () => ({
  languageSelect: document.getElementById('language'),
  cardsContainer: document.getElementById('cards-overview'),
  mainContent: document.getElementById('main-content')
});

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Loads application configuration from JSON file
 * @returns {Promise<Object>} Merged configuration object
 */
async function loadAppConfig() {
  try {
    const config = await loadJSON('config/app-config.json', { useCache: false });
    appConfig = mergeDeep(DEFAULT_CONFIG, config);
    
    if (appConfig.developer?.verboseLogging) {
      console.log('Configuration loaded:', appConfig);
    }
    
    return appConfig;
  } catch (error) {
    console.warn('Using default configuration:', error.message);
    return DEFAULT_CONFIG;
  }
}

/**
 * Deep merges two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = mergeDeep(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// =============================================================================
// LANGUAGE MANAGEMENT
// =============================================================================

/**
 * Gets list of available (non-hidden) languages
 * @returns {string[]} Array of language codes
 */
function getAvailableLanguages() {
  const hidden = appConfig.languages?.hiddenLanguages || [];
  return ALL_LANGUAGES.filter(lang => !hidden.includes(lang));
}

/**
 * Populates the language selection dropdown
 */
function populateLanguageSelect() {
  const { languageSelect } = getElements();
  if (!languageSelect) return;
  
  const languages = getAvailableLanguages();
  const defaultLang = appConfig.languages?.defaultLanguage || 'en';
  
  languageSelect.innerHTML = languages
    .map(lang => `<option value="${lang}"${lang === defaultLang ? ' selected' : ''}>${LANGUAGE_LABELS[lang]}</option>`)
    .join('');
}

// =============================================================================
// DATA LOADING & RENDERING
// =============================================================================

/**
 * Loads data and renders the application
 */
async function loadAndRender() {
  const { languageSelect, cardsContainer } = getElements();
  const lang = languageSelect?.value || appConfig.languages?.defaultLanguage || 'en';
  
  // Update document language
  document.documentElement.setAttribute('lang', lang);
  
  try {
    const data = await loadLanguageData(lang, {
      useCache: appConfig.cache?.enabled ?? true
    });
    
    // Validate required data
    if (!validateData(data)) {
      throw new Error('Required data files are missing or empty');
    }
    
    // Initialize filters and render
    setupFilters({
      ...data,
      renderCards
    });
    
  } catch (error) {
    console.error('Application error:', error);
    displayError(error, cardsContainer);
  }
}

/**
 * Validates that all required data is present
 * @param {Object} data - Data object to validate
 * @returns {boolean} True if valid
 */
function validateData(data) {
  const { relations, translations, criteria, principles } = data;
  
  return Boolean(
    relations && Object.keys(relations).length > 0 &&
    translations && Object.keys(translations).length > 0 &&
    criteria && Object.keys(criteria).length > 0 &&
    principles && Object.keys(principles).length > 0
  );
}

/**
 * Displays an error message to the user
 * @param {Error} error - The error to display
 * @param {HTMLElement} container - Container element for error message
 */
function displayError(error, container) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="no-results-message">
      <h3>Error Loading Data</h3>
      <p>${error.message || 'An unexpected error occurred'}</p>
      <p><strong>Solution:</strong> This may be due to CORS restrictions when loading files directly from the filesystem.</p>
      <p>Please run the application using a local web server:</p>
      <ul style="text-align: left; display: inline-block; list-style: disc; padding-left: 20px;">
        <li><code>python -m http.server 8000</code></li>
        <li><code>npx serve .</code></li>
        <li>VS Code Live Server extension</li>
      </ul>
    </div>
  `;
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handles language change events
 */
function handleLanguageChange() {
  loadAndRender();
}

/**
 * Handles keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+D toggles developer mode
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault();
    toggleDevMode();
  }
}

/**
 * Toggles developer mode
 */
function toggleDevMode() {
  appConfig.developer = appConfig.developer || {};
  appConfig.developer.devMode = !appConfig.developer.devMode;
  
  console.log(`Developer mode ${appConfig.developer.devMode ? 'enabled' : 'disabled'}`);
  loadAndRender();
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the application
 */
async function init() {
  // Load configuration
  await loadAppConfig();
  
  // Setup language selector
  populateLanguageSelect();
  
  // Bind event listeners
  const { languageSelect } = getElements();
  languageSelect?.addEventListener('change', handleLanguageChange);
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Initial render
  await loadAndRender();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
