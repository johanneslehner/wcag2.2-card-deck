/**
 * WCAG 2.2 Card Deck - Filters Module
 * 
 * Handles filter UI interactions, state management,
 * and card filtering logic.
 * 
 * @module filters
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'wcag-filters';

const FILTER_NAMES = {
  WCAG_VERSION: 'wcagVersion',
  PRINCIPLE: 'principle',
  GUIDELINE: 'guideline',
  LEVEL: 'level',
  THEME: 'theme',
  ROLE: 'role',
  DISABILITIES: 'disabilities'
};

// =============================================================================
// DOM UTILITIES
// =============================================================================

/**
 * Gets all checked values for a checkbox group
 * @param {string} name - The checkbox group name attribute
 * @returns {string[]} Array of checked values
 */
function getCheckedValues(name) {
  return Array.from(
    document.querySelectorAll(`input[name="${name}"]:checked`)
  ).map(cb => cb.value);
}

/**
 * Sets checkbox states from an array of values
 * @param {string} name - The checkbox group name attribute
 * @param {string[]} values - Values to check
 */
function setCheckedValues(name, values) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
    cb.checked = values.includes(cb.value);
  });
}

/**
 * Gets a single element value
 * @param {string} id - Element ID
 * @param {string} defaultValue - Default value if element not found
 * @returns {string} Element value or default
 */
function getElementValue(id, defaultValue = '') {
  return document.getElementById(id)?.value ?? defaultValue;
}

/**
 * Sets an element value
 * @param {string} id - Element ID
 * @param {string} value - Value to set
 */
function setElementValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

// =============================================================================
// TRANSLATION UTILITIES
// =============================================================================

/**
 * Builds a translation map from raw translations data
 * @param {Object} translations - Raw translations object
 * @returns {Object} Structured translation map
 */
function buildTranslationMap(translations) {
  return {
    level: translations.level || {},
    theme: translations.theme || {},
    responsibility: translations.responsibility || {},
    disability: translations.disability || {},
    principle: translations.strings?.principle || 'Principle',
    filterCategories: translations.strings?.filterCategories || {
      level: 'Level',
      theme: 'Theme',
      responsibility: 'Role',
      disability: 'Disabilities',
      principles: 'Principles & Guidelines'
    },
    wcagVersion: {
      label: 'WCAG Version',
      options: {
        '2.2': 'WCAG 2.2',
        '2.1': 'WCAG 2.1',
        '2.0': 'WCAG 2.0'
      }
    },
    obsolete: translations.strings?.obsolete || 'Show obsolete criteria',
    resetFilters: translations.strings?.resetFilters || 'Reset filter'
  };
}

/**
 * Applies translations to filter labels
 * @param {string} selector - CSS selector for labels
 * @param {string} dataAttr - Data attribute containing the key
 * @param {Object} translationObj - Translation object
 * @param {Function} formatter - Optional formatter function
 */
function applyTranslations(selector, dataAttr, translationObj, formatter = null) {
  if (!translationObj) return;
  
  document.querySelectorAll(selector).forEach(element => {
    const key = element.getAttribute(dataAttr);
    if (!key) return;
    
    let value = translationObj[key];
    
    // Handle nested objects (e.g., level.A.short)
    if (value?.short) {
      value = value.short;
    }
    
    if (value) {
      element.textContent = formatter ? formatter(value, key) : value;
    }
  });
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Gets current filter selections
 * @returns {Object} Current filter state
 */
function getFilterState() {
  return {
    wcagVersion: getElementValue('wcagVersion-select', '2.2'),
    showObsolete: document.getElementById('show-obsolete')?.checked ?? false,
    principle: getCheckedValues(FILTER_NAMES.PRINCIPLE),
    guideline: getCheckedValues(FILTER_NAMES.GUIDELINE),
    level: getCheckedValues(FILTER_NAMES.LEVEL),
    theme: getCheckedValues(FILTER_NAMES.THEME),
    role: getCheckedValues(FILTER_NAMES.ROLE),
    disabilities: getCheckedValues(FILTER_NAMES.DISABILITIES),
    searchQuery: getElementValue('search-bar', '').trim().toLowerCase()
  };
}

/**
 * Restores filter state from saved state
 * @param {Object} state - Saved filter state
 */
function restoreFilterState(state) {
  if (!state) return;
  
  setElementValue('wcagVersion-select', state.wcagVersion);
  
  if (state.showObsolete !== undefined) {
    const checkbox = document.getElementById('show-obsolete');
    if (checkbox) checkbox.checked = state.showObsolete;
  }
  
  Object.entries(FILTER_NAMES).forEach(([, name]) => {
    if (state[name]) {
      setCheckedValues(name, state[name]);
    }
  });
}

/**
 * Saves filter state to localStorage
 * @param {Object} state - Filter state to save
 */
function saveFilterState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Loads saved filter state from localStorage
 * @returns {Object|null} Saved state or null
 */
function loadSavedFilterState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// =============================================================================
// PRINCIPLE/GUIDELINE MANAGEMENT
// =============================================================================

/**
 * Updates principle checkbox states based on guideline selections
 * Implements tri-state logic (all/some/none selected)
 */
function updatePrincipleStates() {
  document.querySelectorAll('input[name="principle"]').forEach(principleCb => {
    if (principleCb._skipUpdate) {
      principleCb._skipUpdate = false;
      return;
    }
    
    const principleNum = principleCb.value;
    const guidelines = Array.from(
      document.querySelectorAll(`input[name="guideline"][id^="guideline-${principleNum}."]`)
    );
    
    if (guidelines.length === 0) return;
    
    const checkedCount = guidelines.filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
      principleCb.checked = false;
      principleCb.indeterminate = false;
    } else if (checkedCount === guidelines.length) {
      principleCb.checked = true;
      principleCb.indeterminate = false;
    } else {
      principleCb.checked = false;
      principleCb.indeterminate = true;
    }
  });
}

/**
 * Toggles all guidelines for a principle
 * @param {string} principleNum - Principle number
 * @param {boolean} checked - Whether to check or uncheck
 */
function togglePrincipleGuidelines(principleNum, checked) {
  document.querySelectorAll(`input[name="guideline"][id^="guideline-${principleNum}."]`)
    .forEach(cb => { cb.checked = checked; });
}

// =============================================================================
// FILTERING LOGIC
// =============================================================================

/**
 * Enriches relation data with computed properties
 * @param {Object} relations - Relations data object
 * @returns {Object} Enriched relations
 */
function enrichRelations(relations) {
  const enriched = { ...relations };
  
  Object.entries(enriched).forEach(([num, card]) => {
    const parts = num.split('.');
    card.principle = parts[0];
    card.guideline = parts.slice(0, 2).join('.');
  });
  
  return enriched;
}

/**
 * Filters cards based on current filter state
 * @param {Object} relations - Enriched relations data
 * @param {Object} state - Current filter state
 * @param {Object} translations - Translations for search
 * @param {Object} criteria - Criteria data for search
 * @returns {Array} Filtered entries as [num, card] pairs
 */
function filterCards(relations, state, translations, criteria) {
  return Object.entries(relations).filter(([num, card]) => {
    // WCAG Version filter
    if (card.wcagVersion) {
      if (state.wcagVersion === '2.0' && card.wcagVersion !== '2.0') return false;
      if (state.wcagVersion === '2.1' && card.wcagVersion === '2.2') return false;
    }
    
    // Obsolete filter (only for WCAG 2.2)
    if (state.wcagVersion === '2.2' && !state.showObsolete && card.obsolete) {
      return false;
    }
    
    // Guideline filter
    if (state.guideline.length && !state.guideline.includes(card.guideline)) {
      return false;
    }
    
    // Level filter
    if (state.level.length && !state.level.includes(card.level)) {
      return false;
    }
    
    // Theme filter (any match)
    if (state.theme.length && !state.theme.some(t => card.themes?.includes(t))) {
      return false;
    }
    
    // Role filter (any match)
    if (state.role.length && !state.role.some(r => card.responsibilities?.includes(r))) {
      return false;
    }
    
    // Disabilities filter (any match)
    if (state.disabilities.length && !state.disabilities.some(d => card.disabilities?.includes(d))) {
      return false;
    }
    
    // Text search
    if (state.searchQuery) {
      const t = translations[num] || {};
      const c = criteria[num] || {};
      
      const searchableFields = [
        num,
        t.title || c.title || '',
        t.description || c.description || '',
        t.url || '',
        ...(card.themes || []),
        ...(card.responsibilities || []),
        ...(card.disabilities || [])
      ];
      
      const matches = searchableFields.some(
        field => field?.toLowerCase().includes(state.searchQuery)
      );
      
      if (!matches) return false;
    }
    
    return true;
  });
}

/**
 * Updates the obsolete checkbox enabled/disabled state
 * @param {string} wcagVersion - Selected WCAG version
 */
function updateObsoleteCheckbox(wcagVersion) {
  const checkbox = document.getElementById('show-obsolete');
  if (!checkbox) return;
  
  const isEnabled = wcagVersion === '2.2';
  checkbox.disabled = !isEnabled;
  checkbox.parentElement?.classList.toggle('disabled', !isEnabled);
}

/**
 * Updates the helper info display
 * @param {number} filteredCount - Number of filtered results
 * @param {number} totalCount - Total number of cards
 */
function updateHelperInfo(filteredCount, totalCount) {
  const helperInfo = document.getElementById('helper-info');
  if (helperInfo) {
    helperInfo.textContent = `${filteredCount} / ${totalCount} success criteria found`;
  }
}

/**
 * Displays the no results message
 * @param {Function} onClear - Callback when clear button is clicked
 */
function showNoResults(onClear) {
  const container = document.getElementById('cards-overview');
  if (!container) return;
  
  container.innerHTML = `
    <div class="no-results-message">
      <p>No success criterion found.<br>Try a different wording or reset the filter/search.</p>
      <button id="clear-search-btn">Clear search</button>
    </div>
  `;
  
  document.getElementById('clear-search-btn')?.addEventListener('click', onClear);
}

// =============================================================================
// MAIN SETUP FUNCTION
// =============================================================================

/**
 * Sets up the filter system
 * @param {Object} config - Configuration object
 * @param {Object} config.relations - Relations data
 * @param {Object} config.translations - Translations data
 * @param {Object} config.criteria - Criteria data
 * @param {Object} config.principles - Principles data
 * @param {Function} config.renderCards - Card rendering function
 */
export function setupFilters({ relations, translations, criteria, principles, renderCards }) {
  // Validate required data
  if (!relations || !translations || !criteria || !principles) {
    console.error('Missing required data for filters');
    document.getElementById('cards-overview').innerHTML = 
      '<div class="no-results-message">Error: Required data could not be loaded.</div>';
    return;
  }
  
  // Build translation map and enrich relations
  const translationMap = buildTranslationMap(translations);
  const enrichedRelations = enrichRelations(relations);
  
  // Apply translations to UI elements
  applyFilterTranslations(translationMap, principles);
  
  // Setup event listeners
  setupEventListeners(update, reset);
  
  // Restore saved state
  const savedState = loadSavedFilterState();
  if (savedState) {
    restoreFilterState(savedState);
  }
  
  // Initial render
  updatePrincipleStates();
  update();
  
  // =========================================================================
  // INTERNAL FUNCTIONS
  // =========================================================================
  
  /**
   * Main update function - filters and renders cards
   */
  function update() {
    const state = getFilterState();
    
    updateObsoleteCheckbox(state.wcagVersion);
    updatePrincipleStates();
    
    const filtered = filterCards(enrichedRelations, state, translations, criteria);
    
    updateHelperInfo(filtered.length, Object.keys(relations).length);
    
    if (filtered.length === 0) {
      showNoResults(() => {
        setElementValue('search-bar', '');
        update();
      });
    } else {
      renderCards(filtered, translations, criteria, translationMap, principles);
    }
    
    saveFilterState(state);
  }
  
  /**
   * Resets all filters to default state
   */
  function reset() {
    // Check all filter checkboxes
    document.querySelectorAll('#filter-area input[type="checkbox"]').forEach(cb => {
      if (cb.id !== 'show-obsolete') {
        cb.checked = true;
        cb.disabled = false;
      }
    });
    
    // Reset obsolete checkbox
    const obsoleteCheckbox = document.getElementById('show-obsolete');
    if (obsoleteCheckbox) {
      obsoleteCheckbox.checked = false;
      obsoleteCheckbox.disabled = false;
      obsoleteCheckbox.parentElement?.classList.remove('disabled');
    }
    
    // Reset WCAG version
    setElementValue('wcagVersion-select', '2.2');
    
    // Clear search
    setElementValue('search-bar', '');
    
    update();
  }
}

// =============================================================================
// TRANSLATION APPLICATION
// =============================================================================

/**
 * Applies all translations to filter UI elements
 * @param {Object} translationMap - Translation map object
 * @param {Object} principles - Principles data
 */
function applyFilterTranslations(translationMap, principles) {
  // Filter chip labels
  applyTranslations('.level-label', 'data-level', translationMap.level);
  applyTranslations('.theme-label', 'data-theme', translationMap.theme);
  applyTranslations('.role-label', 'data-role', translationMap.responsibility);
  applyTranslations('.disability-label', 'data-disability', translationMap.disability);
  applyTranslations('.filter-category-header', 'data-filter-category', translationMap.filterCategories);
  
  // Guideline labels with principle data
  document.querySelectorAll('.guideline-label').forEach(label => {
    const guideline = label.getAttribute('data-guideline');
    if (guideline && principles[guideline]) {
      label.textContent = `${guideline} ${principles[guideline].title}`;
    }
  });
  
  // Reset button
  const resetBtn = document.getElementById('reset-filter-btn');
  if (resetBtn) {
    resetBtn.textContent = translationMap.resetFilters;
  }
}

// =============================================================================
// EVENT LISTENER SETUP
// =============================================================================

/**
 * Sets up all event listeners for the filter system
 * @param {Function} onUpdate - Update callback
 * @param {Function} onReset - Reset callback
 */
function setupEventListeners(onUpdate, onReset) {
  const filterArea = document.getElementById('filter-area');
  
  // WCAG Version dropdown
  document.getElementById('wcagVersion-select')?.addEventListener('change', onUpdate);
  
  // Show obsolete toggle
  document.getElementById('show-obsolete')?.addEventListener('change', onUpdate);
  
  // Reset button
  document.getElementById('reset-filter-btn')?.addEventListener('click', onReset);
  
  // Principle toggles (expand/collapse)
  document.querySelectorAll('.principle-toggle-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      
      const targetId = btn.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = expanded ? 'none' : '';
      }
      
      btn.innerHTML = expanded ? '&#9654;' : '&#9660;';
    });
  });
  
  // Principle checkboxes (toggle all guidelines)
  document.querySelectorAll('input[name="principle"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      cb._skipUpdate = true;
      togglePrincipleGuidelines(cb.value, cb.checked);
      setTimeout(onUpdate, 0);
    });
  });
  
  // Guideline checkboxes
  document.querySelectorAll('input[name="guideline"]').forEach(cb => {
    cb.addEventListener('change', updatePrincipleStates);
  });
  
  // Filter area change handler
  filterArea?.addEventListener('change', (e) => {
    if (e.target?.name === 'guideline') {
      updatePrincipleStates();
    } else if (e.target?.name === 'principle') {
      e.target._skipUpdate = true;
    }
    onUpdate();
  });
  
  // Search bar
  const searchBar = document.getElementById('search-bar');
  const clearBtn = document.getElementById('search-clear-btn');
  
  if (searchBar) {
    searchBar.addEventListener('input', () => {
      onUpdate();
      if (clearBtn) {
        clearBtn.style.display = searchBar.value ? '' : 'none';
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchBar) {
        searchBar.value = '';
        clearBtn.style.display = 'none';
        onUpdate();
      }
    });
    clearBtn.style.display = searchBar?.value ? '' : 'none';
  }
}
