/**
 * WCAG 2.2 Card Deck - Data Module
 * 
 * Handles all data fetching and caching operations.
 * 
 * @module data
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CACHE_DURATION = 86400000; // 24 hours in milliseconds
const CACHE_PREFIX = 'wcag-data-';

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Retrieves cached data if valid
 * @param {string} key - Cache key
 * @param {number} duration - Cache duration in milliseconds
 * @returns {Object|null} Cached data or null if expired/missing
 */
function getCachedData(key, duration = DEFAULT_CACHE_DURATION) {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > duration;
    
    return isExpired ? null : data;
  } catch {
    return null;
  }
}

/**
 * Stores data in cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 */
function setCachedData(key, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    // Storage might be full or disabled - fail silently
    console.warn('Cache storage failed:', error.message);
  }
}

/**
 * Clears all cached data
 */
export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch {
    // Fail silently
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches JSON data from a URL with optional caching
 * 
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Configuration options
 * @param {boolean} options.useCache - Whether to use caching (default: true)
 * @param {number} options.cacheDuration - Cache duration in ms (default: 24h)
 * @returns {Promise<Object>} The parsed JSON data
 * @throws {Error} If fetch fails and no cached data available
 */
export async function loadJSON(url, options = {}) {
  const { 
    useCache = true, 
    cacheDuration = DEFAULT_CACHE_DURATION 
  } = options;
  
  // Try cache first
  if (useCache) {
    const cached = getCachedData(url, cacheDuration);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch fresh data
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    if (useCache) {
      setCachedData(url, data);
    }
    
    return data;
  } catch (error) {
    // Try to return stale cache data on error
    const staleData = getCachedData(url, Infinity);
    if (staleData) {
      console.warn(`Using stale cache for ${url} due to fetch error`);
      return staleData;
    }
    
    throw new Error(`Failed to load ${url}: ${error.message}`);
  }
}

/**
 * Loads multiple JSON files in parallel
 * 
 * @param {string[]} urls - Array of URLs to fetch
 * @param {Object} options - Configuration options (passed to loadJSON)
 * @returns {Promise<Object[]>} Array of parsed JSON data in same order as urls
 */
export async function loadMultipleJSON(urls, options = {}) {
  return Promise.all(urls.map(url => loadJSON(url, options)));
}

/**
 * Loads all required data for a specific language
 * 
 * @param {string} lang - Language code (e.g., 'en', 'de')
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Object containing relations, translations, criteria, principles
 */
export async function loadLanguageData(lang, options = {}) {
  const urls = [
    'localization/data-relations.json',
    `localization/${lang}/translations.json`,
    `localization/${lang}/success-criteria.json`,
    `localization/${lang}/principles_guidelines.json`
  ];
  
  const [relations, translations, criteria, principles] = await loadMultipleJSON(urls, options);
  
  return { relations, translations, criteria, principles };
}
