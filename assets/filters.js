// assets/filters.js
// Filter UI and logic for WCAG 2.2 Card Deck

export function setupFilters({ relations, translations, criteria, principles, renderCards }) {
    // Make setup idempotent: this function is called again on language change.
    if (window.__wcagFiltersController) {
        window.__wcagFiltersController.abort();
    }
    const controller = new AbortController();
    window.__wcagFiltersController = controller;
    const { signal } = controller;

    // If we're missing required data, display an error and exit
    if (!relations || Object.keys(relations).length === 0 || 
        !translations || Object.keys(translations).length === 0 ||
        !criteria || Object.keys(criteria).length === 0 ||
        !principles || Object.keys(principles).length === 0) {
        
        document.getElementById('cards-overview').innerHTML = 
            `<div class="no-results-message">Error: Some required data files could not be loaded. Please check the console for details.</div>`;
        return;
    }
    
    // Utility functions

    function getCheckedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
    }

    function getCheckedGuidelines() {
        return Array.from(document.querySelectorAll('input[name="guideline"]:checked')).map(cb => cb.value);
    }

    // Build translation maps for filter values
    const translationMap = {
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

    // No need to gather unique filter values since filters are now static in HTML

    // Create filter UI
    const filterArea = document.getElementById('filter-area');

    // Set up event listeners for the static filter controls
    
    // WCAG Version dropdown
    document.getElementById('wcagVersion-select')?.addEventListener('change', update, { signal });
    
    // Show/hide obsolete checkbox
    document.getElementById('show-obsolete')?.addEventListener('change', update, { signal });
    
    // Reset filter button
    document.getElementById('reset-filter-btn')?.addEventListener('click', function() {
        document.querySelectorAll('#filter-area input[type="checkbox"]').forEach(cb => { 
            // Skip the obsolete checkbox as we handle it separately
            if (cb.id !== 'show-obsolete') {
                cb.checked = true;
                cb.disabled = false;
            }
        });
        
        if (document.getElementById('search-bar')) document.getElementById('search-bar').value = '';
        
        // Reset obsolete checkbox
        const obsoleteCheckbox = document.getElementById('show-obsolete');
        if (obsoleteCheckbox) {
            obsoleteCheckbox.checked = false;
            // Enable it since we're resetting to WCAG 2.2
            obsoleteCheckbox.disabled = false;
            obsoleteCheckbox.parentElement.classList.remove('disabled');
        }
        
        // Reset WCAG version dropdown to "2.2" (All)
        if (document.getElementById('wcagVersion-select')) {
            document.getElementById('wcagVersion-select').value = '2.2';
        }
        
        update();
    }, { signal });

    // Set up event handlers for the static Principles & Guidelines filter section
    // Add toggle functionality to the principle toggle buttons
    document.querySelectorAll('.principle-toggle-header').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', function() {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!expanded));
            const controlId = toggleBtn.getAttribute('aria-controls');
            const guidelineList = document.getElementById(controlId);
            if (guidelineList) {
                guidelineList.hidden = expanded;
            }
            toggleBtn.innerHTML = expanded ? '&#9654;' : '&#9660;'; // right/down arrow
        }, { signal });
    });
    
    // Add change handlers for guideline checkboxes to update principle states
    document.querySelectorAll('input[name="guideline"]').forEach(guidelineCb => {
        guidelineCb.addEventListener('change', function() {
            // Immediately update the related principle checkbox state
            updatePrincipleCheckboxStates();
        }, { signal });
    });

    // Other filters (collapsible)
    // All filters are now static in HTML, so we just need to update translations and add collapsible behavior
    
    // Generic function to update element text content using translations
    function updateTranslation(element, translationObj, key, formatter = null) {
        if (!element || !translationObj || !key) return;
        
        let translatedText = null;
        
        // Handle nested objects (like level.A.short)
        if (key.includes('.')) {
            const keys = key.split('.');
            let currentObj = translationObj;
            for (const k of keys) {
                if (!currentObj || !currentObj[k]) return;
                currentObj = currentObj[k];
            }
            translatedText = currentObj;
        } 
        // Handle direct lookup
        else if (translationObj[key]) {
            translatedText = translationObj[key];
        }
        
        // Apply formatter if provided
        if (translatedText && formatter) {
            translatedText = formatter(translatedText, key);
        }
        
        // Update element if translation found
        if (translatedText) {
            element.textContent = translatedText;
        }
    }
    
    // Generic function to update filter labels with translations based on data attributes
    function updateFilterLabels(selector, dataAttribute, translationKey, formatter = null) {
        document.querySelectorAll(selector).forEach(label => {
            const value = label.getAttribute(dataAttribute);
            const translations = translationMap[translationKey];
            
            if (value && translations) {
                // Handle special case for level which has nested short/full structure
                if (translationKey === 'level' && translations[value]?.short) {
                    updateTranslation(label, translations[value], 'short');
                } else {
                    updateTranslation(label, translations, value, formatter);
                }
            }
        });
    }
    
    // Apply translations to all filter types
    updateFilterLabels('.level-label', 'data-level', 'level');
    updateFilterLabels('.theme-label', 'data-theme', 'theme');
    updateFilterLabels('.role-label', 'data-role', 'responsibility');
    updateFilterLabels('.disability-label', 'data-disability', 'disability');
    
    // Update filter category headers with translations
    updateFilterLabels('.filter-category-header', 'data-filter-category', 'filterCategories');
    
    // Update principle titles with translations (including numbers) from principles object
    document.querySelectorAll('.principle-inline-title').forEach(title => {
        const principleValue = title.getAttribute('data-principle');
        if (principleValue && principles[principleValue]) {
            title.textContent = principleValue + '. ' + principles[principleValue].title;
        }
    });
    
    // Update guideline labels with translations (including numbers) from principles object
    document.querySelectorAll('.guideline-label').forEach(label => {
        const guidelineValue = label.getAttribute('data-guideline');
        if (guidelineValue && principles[guidelineValue]) {
            label.textContent = guidelineValue + ' ' + principles[guidelineValue].title;
        }
    });
    
    // Update WCAG version dropdown with translations
    const wcagVersionLabel = document.querySelector('label[for="wcagVersion-select"] strong');
    if (wcagVersionLabel) {
        updateTranslation(wcagVersionLabel, translationMap.wcagVersion, 'label', 
            (translated) => `${translated}:`);
    }
    
    document.querySelectorAll('#wcagVersion-select option').forEach(option => {
        const version = option.value;
        if (version) {
            updateTranslation(option, translationMap.wcagVersion?.options, version);
        }
    });
    
    // Helper function for translating text nodes
    function updateTextNodeTranslation(element, translationKey, prefix = '') {
        if (!element || !translationMap[translationKey]) return;
        
        const textNode = Array.from(element.childNodes)
            .find(node => node.nodeType === Node.TEXT_NODE);
            
        if (textNode) {
            textNode.nodeValue = prefix + translationMap[translationKey];
        }
    }
    
    // Update obsolete checkbox label
    const obsoleteText = document.getElementById('show-obsolete-label');
    if (obsoleteText && translationMap.obsolete) {
        obsoleteText.textContent = translationMap.obsolete;
    }
    
    // Update reset filter button
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
        updateTranslation(resetBtn, translationMap, 'resetFilters');
    }
    
    // Add collapsible behavior to all filter headers
    document.querySelectorAll('.filter-collapsible-group .group-header').forEach(header => {
        // Update translation for header if it has a data attribute
        const category = header.getAttribute('data-filter-category');
        if (category) {
            updateTranslation(header, translationMap.filterCategories, category);
        }
        
        header.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!expanded));
            const controlId = this.getAttribute('aria-controls');
            const content = controlId ? document.getElementById(controlId) : null;
            if (content) {
                content.hidden = expanded;
            }
        }, { signal });

        // Ensure initial state matches aria-expanded
        const initialExpanded = header.getAttribute('aria-expanded') !== 'false';
        const controlId = header.getAttribute('aria-controls');
        const content = controlId ? document.getElementById(controlId) : null;
        if (content) {
            content.hidden = !initialExpanded;
        }
    });

    // Full text search
    // Remove search input from filter area; use top search bar instead


    // Tri-state logic for principles
    function updatePrincipleCheckboxStates() {
        // Get all principle checkboxes
        document.querySelectorAll('input[name="principle"]').forEach(principleCb => {
            const principleNum = principleCb.value;
            // Find all guideline checkboxes for this principle
            const guidelineSelector = `input[name="guideline"][id^="guideline-${principleNum}."]`;
            const guidelineCbs = Array.from(document.querySelectorAll(guidelineSelector));
            
            if (guidelineCbs.length === 0) return;
            
            // Skip this update if the principle checkbox was directly changed by user
            if (principleCb._ignoreNextUpdate) {
                principleCb._ignoreNextUpdate = false;
                return;
            }
            
            const checkedCount = guidelineCbs.filter(cb => cb.checked).length;
            if (checkedCount === 0) {
                principleCb.checked = false;
                principleCb.indeterminate = false;
            } else if (checkedCount === guidelineCbs.length) {
                principleCb.checked = true;
                principleCb.indeterminate = false;
            } else {
                principleCb.checked = false;
                principleCb.indeterminate = true;
            }
        });
    }

    // Helper: enable/disable guideline checkboxes based on selected principles
    function updateGuidelineCheckboxes(selectedPrinciples, prevPrinciples) {
        // No need to disable any checkboxes in the static HTML implementation
        updatePrincipleCheckboxStates();
    }

    // Principle checkbox click handler for tri-state logic
    document.querySelectorAll('input[name="principle"]').forEach(principleCb => {
        principleCb.addEventListener('change', function(e) {
            // Prevent the default checkbox behavior temporarily
            e.stopPropagation();
            
            const principleNum = principleCb.value;
            // Find all guideline checkboxes for this principle
            const guidelineSelector = `input[name="guideline"][id^="guideline-${principleNum}."]`;
            const guidelineCbs = Array.from(document.querySelectorAll(guidelineSelector));
            
            if (guidelineCbs.length === 0) return;
            
            // Check if the principle checkbox is checked and set all guidelines accordingly
            const isChecked = principleCb.checked;
            guidelineCbs.forEach(cb => {
                cb.checked = isChecked;
            });
            
            // Trigger update
            setTimeout(() => {
                update();
            }, 0);
        }, { signal });
    });

    // Store and restore filter selections
    function getFilterSelections() {
        return {
            wcagVersion: document.getElementById('wcagVersion-select')?.value || '2.2',
            principle: getCheckedValues('principle'),
            guideline: getCheckedGuidelines(),
            level: getCheckedValues('level'),
            theme: getCheckedValues('theme'),
            role: getCheckedValues('role'),
            disabilities: getCheckedValues('disabilities')
        };
    }
    function setFilterSelections(selections) {
        if (!selections) return;
        
        // Handle WCAG version dropdown
        if (selections.wcagVersion && document.getElementById('wcagVersion-select')) {
            document.getElementById('wcagVersion-select').value = selections.wcagVersion;
        }
        
        // Handle checkbox filters
        ['principle','guideline','level','theme','role','disabilities'].forEach(name => {
            const values = selections[name] || [];
            document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
                cb.checked = values.includes(cb.value);
            });
        });
    }

    let lastSelections = null;

    function update() {
        const filters = getFilterSelections();
        Object.entries(relations).forEach(([num, card]) => {
            card.principle = num.split('.')[0];
            card.guideline = num.split('.').slice(0,2).join('.');
        });
        updateGuidelineCheckboxes(filters.principle);
        lastSelections = filters;
        const showObsolete = document.getElementById('show-obsolete')?.checked;
        
        // Get selected WCAG version
        const selectedWcagVersion = document.getElementById('wcagVersion-select')?.value || '2.2';
        
        // Enable/disable obsolete checkbox based on WCAG version
        // The obsolete filter is only relevant for WCAG 2.2
        const obsoleteCheckbox = document.getElementById('show-obsolete');
        if (obsoleteCheckbox) {
            if (selectedWcagVersion === '2.2') {
                obsoleteCheckbox.disabled = false;
                obsoleteCheckbox.parentElement.classList.remove('disabled');
            } else {
                obsoleteCheckbox.disabled = true;
                obsoleteCheckbox.parentElement.classList.add('disabled');
            }
        }
        
        let filtered = Object.entries(relations).filter(([num, card]) => {
            // Filter by WCAG version
            if (card.wcagVersion) {
                // If 2.0 is selected, only show 2.0 items
                if (selectedWcagVersion === '2.0' && card.wcagVersion !== '2.0') return false;
                
                // If 2.1 is selected, show 2.0 and 2.1 items but not 2.2
                if (selectedWcagVersion === '2.1' && card.wcagVersion === '2.2') return false;
                
                // If 2.2 is selected, show all items (no filtering)
            }
            
            // Continue with other filters
            if (filters.guideline.length && (!card.guideline || !filters.guideline.includes(card.guideline))) return false;
            if (filters.level.length && (!card.level || !filters.level.includes(card.level))) return false;
            if (filters.theme.length && (!card.themes || !filters.theme.some(t => card.themes.includes(t)))) return false;
            if (filters.role.length && (!card.responsibilities || !filters.role.some(r => card.responsibilities.includes(r)))) return false;
            if (filters.disabilities.length && (!card.disabilities || !filters.disabilities.some(d => card.disabilities.includes(d)))) return false;
            
            // Only apply the obsolete filter for WCAG 2.2
            // Obsolete criteria only exist in WCAG 2.2 where criteria from 2.0/2.1 may be marked as obsolete
            if (selectedWcagVersion === '2.2' && !showObsolete && card.obsolete) return false;
            return true;
        });
        // Use top search bar value for filtering
        const searchValue = (document.getElementById('search-bar')?.value || '').trim().toLowerCase();
        if (searchValue) {
            filtered = filtered.filter(([num, card]) => {
                    // Always include criteria even if translation is missing
                    const t = translations[num] || {};
                    const c = criteria[num] || {};
                    const fields = [
                        num,
                        t.title || c.title || '',
                        t.description || c.description || '',
                        t.url || '',
                        (card.themes || []).join(' '),
                        (card.responsibilities || []).join(' '),
                        (card.disabilities || []).join(' ')
                    ];
                    return fields.some(f => f && f.toLowerCase().includes(searchValue));
            });
        }
        // Update helper info
        const helperInfo = document.getElementById('helper-info');
        if (helperInfo) {
                const totalCount = Object.keys(relations).length;
                helperInfo.textContent = `${filtered.length} / ${totalCount} success criteria found`;
        }
        if (filtered.length === 0) {
            const container = document.getElementById('cards-overview');
            container.innerHTML = `<div class="no-results-message">
                <p>No success criterion found.<br>Try a different wording or reset the filter/search.</p>
                <button id="clear-search-btn">Clear search</button>
            </div>`;
            document.getElementById('clear-search-btn').onclick = function() {
                const topSearch = document.getElementById('search-bar');
                if (topSearch) topSearch.value = '';
                update();
            };
        } else {
            renderCards(filtered, translations, criteria, translationMap, principles);
        }
        localStorage.setItem('wcag-filters', JSON.stringify(lastSelections));
    }

    filterArea.addEventListener('change', function(e) {
        // Only update principle visual state if a guideline was changed
        if (e.target && e.target.name === 'guideline') {
            updatePrincipleCheckboxStates();
        } else if (e.target && e.target.name === 'principle') {
            // Mark this principle checkbox to be ignored in the next updatePrincipleCheckboxStates
            e.target._ignoreNextUpdate = true;
        }
        update();
    }, { signal });

    Object.entries(relations).forEach(([num, card]) => {
        card.principle = num.split('.')[0];
        card.guideline = num.split('.').slice(0,2).join('.');
    });
    let storedSelections = null;
    try {
        storedSelections = JSON.parse(localStorage.getItem('wcag-filters'));
    } catch(e) {}
    if (storedSelections) {
        setFilterSelections(storedSelections);
    }
    updatePrincipleCheckboxStates();
    update();

    // Listen to top search bar for filtering
    const topSearchInput = document.getElementById('search-bar');
    const topClearBtn = document.getElementById('search-clear-btn');
    if (topSearchInput) {
        topSearchInput.addEventListener('input', () => {
            update();
            topClearBtn.style.display = topSearchInput.value ? '' : 'none';
        }, { signal });
        topClearBtn.addEventListener('click', () => {
            topSearchInput.value = '';
            topClearBtn.style.display = 'none';
            update();
        }, { signal });
        topClearBtn.style.display = topSearchInput.value ? '' : 'none';
    }
}
