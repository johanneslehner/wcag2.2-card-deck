/**
 * WCAG 2.2 Card Deck - Render Module
 * 
 * Handles rendering of success criteria cards.
 * 
 * @module render
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maps principle numbers to class names */
const PRINCIPLE_CLASSES = {
  '1': 'perceivable',
  '2': 'operable',
  '3': 'understandable',
  '4': 'robust'
};

/** Icon paths for responsibility types */
const RESPONSIBILITY_ICONS = {
  design: 'assets/icons/pencil-ruler.svg',
  development: 'assets/icons/xml.svg',
  content: 'assets/icons/file-document.svg'
};

/** Icon paths for disability types */
const DISABILITY_ICONS = {
  visual: 'assets/icons/eye.svg',
  auditory: 'assets/icons/ear-hearing.svg',
  cognitive: 'assets/icons/head-cog.svg',
  physical: 'assets/icons/human.svg',
  speech: 'assets/icons/account-voice.svg'
};

// =============================================================================
// TEXT FORMATTING
// =============================================================================

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Formats description text with markdown-like syntax
 * Supports: **bold**, _italic_, **_bold italic_**, bullet lists
 * 
 * @param {string} desc - Raw description text
 * @returns {string} Formatted HTML
 */
export function formatDescription(desc) {
  if (!desc) return '';
  
  // Escape HTML first
  let html = escapeHtml(desc);
  
  // Process formatting (order matters for nested styles)
  const formatters = [
    // Bold + Italic combined
    [/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>'],
    [/_\*\*(.*?)\*\*_/g, '<strong><em>$1</em></strong>'],
    // Bold
    [/\*\*(.*?)\*\*/g, '<strong>$1</strong>'],
    // Italic
    [/_(.*?)_/g, '<em>$1</em>']
  ];
  
  formatters.forEach(([pattern, replacement]) => {
    html = html.replace(pattern, replacement);
  });
  
  // Process lines for lists and paragraphs
  const lines = html.split('\n');
  let result = '';
  let inList = false;
  
  lines.forEach(line => {
    const isBullet = line.startsWith('* ');
    
    if (isBullet) {
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      result += `<li>${line.substring(2)}</li>`;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      if (line.trim()) {
        result += `<p>${line}</p>`;
      }
    }
  });
  
  if (inList) result += '</ul>';
  
  return result;
}

// =============================================================================
// ICON GENERATION
// =============================================================================

/**
 * Creates HTML for an icon with wrapper
 * @param {string} iconPath - Path to the icon SVG
 * @param {string} label - Accessible label for the icon
 * @returns {string} Icon wrapper HTML
 */
function createIconHtml(iconPath, label) {
  return `
    <span class="icon-wrapper">
      <i class="icon" style="--icon-url: url('../../${iconPath}')" aria-label="${label}"></i>
    </span>
  `;
}

/**
 * Creates HTML for a list of responsibility icons
 * @param {string[]} responsibilities - Array of responsibility types
 * @param {Object} translations - Translations for labels
 * @returns {string} Combined icon HTML
 */
function createResponsibilityIcons(responsibilities, translations) {
  if (!responsibilities?.length) return '';
  
  return responsibilities
    .map(role => {
      const iconPath = RESPONSIBILITY_ICONS[role.toLowerCase()];
      const label = translations.responsibility?.[role] || role;
      return iconPath ? createIconHtml(iconPath, label) : '';
    })
    .join('');
}

/**
 * Creates HTML for a list of disability icons
 * @param {string[]} disabilities - Array of disability types
 * @param {Object} translations - Translations for labels
 * @returns {string} Combined icon HTML
 */
function createDisabilityIcons(disabilities, translations) {
  if (!disabilities?.length) return '';
  
  return disabilities
    .map(disability => {
      const iconPath = DISABILITY_ICONS[disability.toLowerCase()];
      const label = translations.disability?.[disability] || disability;
      return iconPath ? createIconHtml(iconPath, label) : '';
    })
    .join('');
}

// =============================================================================
// THEME TAGS
// =============================================================================

/**
 * Creates HTML for theme tags
 * @param {string[]} themes - Array of theme names
 * @param {Object} translations - Theme translations
 * @returns {string} Theme tags HTML
 */
function createThemeTags(themes, translations) {
  if (!themes?.length) return '';
  
  return themes
    .map(theme => {
      const label = translations.theme?.[theme] || theme;
      return `
        <span class="card-tag card-tag--${theme.toLowerCase()}">
          <i class="icon"></i>
          ${label}
        </span>
      `;
    })
    .join('');
}

// =============================================================================
// CARD RENDERING
// =============================================================================

/**
 * Populates a card template with data
 * @param {DocumentFragment} template - Cloned card template
 * @param {Object} data - Card data object
 */
function populateCardTemplate(template, data) {
  const {
    num,
    principleClass,
    principleTitle,
    level,
    title,
    description,
    responsibilityIcons,
    disabilityIcons,
    themeTags,
    seeTogetherHtml,
    successCriteriaLabel,
    url,
    qrPath,
    isObsolete
  } = data;
  
  // Set card class
  const card = template.querySelector('.card');
  card.classList.add(principleClass);
  if (isObsolete) {
    card.classList.add('card-obsolete');
  }
  
  // Header
  template.querySelector('.principle-title').textContent = principleTitle;
  template.querySelector('.card-level').textContent = level;
  
  // Content
  template.querySelector('.sc-number').textContent = num;
  
  const scName = template.querySelector('.sc-name');
  scName.textContent = title;
  if (isObsolete) {
    scName.classList.add('card-title-obsolete');
  }
  
  template.querySelector('.sc-responsibilities').innerHTML = responsibilityIcons;
  template.querySelector('.sc-disabilities').innerHTML = disabilityIcons;
  template.querySelector('.card-description').innerHTML = description;
  
  // Footer
  template.querySelector('.sc-see-together').innerHTML = seeTogetherHtml;
  template.querySelector('.sc-url').innerHTML = `
    <h4>${successCriteriaLabel}</h4>
    ${url ? `<a href="${url}" target="_blank" rel="noopener">${url}</a>` : ''}
  `;
  template.querySelector('.sc-url-qr').setAttribute(
    'style', 
    `--icon-url: url('../../${qrPath}')`
  );
  template.querySelector('.sc-themes').innerHTML = themeTags;
}

/**
 * Renders filtered cards to the container
 * 
 * @param {Array} filtered - Array of [num, card] pairs
 * @param {Object} translations - Translations data
 * @param {Object} criteria - Criteria data
 * @param {Object} translationMap - Translation map
 * @param {Object} principles - Principles data
 */
export function renderCards(filtered, translations, criteria, translationMap, principles) {
  const container = document.getElementById('cards-overview');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<p>No cards match the filter.</p>';
    return;
  }
  
  // Get template
  const template = document.getElementById('card-template');
  if (!template) {
    console.error('Card template not found');
    return;
  }
  
  // Get current language for QR paths
  const lang = document.getElementById('language')?.value || 'en';
  
  // Render each card
  filtered.forEach(([num, card]) => {
    const t = translations[num] || {};
    const c = criteria[num] || {};
    
    // Extract principle info
    const principleNum = num.split('.')[0];
    const principleData = principles[principleNum] || {};
    const principleClass = `card--${PRINCIPLE_CLASSES[principleNum] || ''}`;
    
    // Prepare card data
    const cardData = {
      num,
      principleClass,
      principleTitle: principleData.title || translationMap.principle || '',
      level: card.level 
        ? (translationMap.level[card.level]?.short || card.level) 
        : '',
      title: c.title || t.title || num,
      description: formatDescription(c.description || t.description || ''),
      responsibilityIcons: createResponsibilityIcons(card.responsibilities, translationMap),
      disabilityIcons: createDisabilityIcons(card.disabilities, translationMap),
      themeTags: createThemeTags(card.themes, translationMap),
      seeTogetherHtml: card.seeTogether?.length && translations.strings?.seeTogetherLabel
        ? `<h4>${translations.strings.seeTogetherLabel}:</h4> ${card.seeTogether.join(', ')}`
        : '',
      successCriteriaLabel: translations.strings?.successCriteria || 'Success Criteria',
      url: c.url || '',
      qrPath: `localization/${lang}/qr/${num.replace(/\./g, '-')}.svg`,
      isObsolete: Boolean(card.obsolete)
    };
    
    // Clone and populate template
    const clone = template.content.cloneNode(true);
    populateCardTemplate(clone, cardData);
    
    // Append to container
    container.appendChild(clone);
  });
}
