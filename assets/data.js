// assets/data.js
// Data loading and utility functions for WCAG 2.2 Card Deck

export async function loadJSON(url) {
    return loadJSONWithLogger(url);
}

export async function loadJSONWithLogger(url, logger = console) {
    try {
        logger?.debug?.(`Fetching: ${url}`);

        const res = await fetch(url);
        logger?.debug?.(`Fetch response for ${url}: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            logger?.error?.(`Error loading ${url}: ${res.status} ${res.statusText}`);
            return {};
        }

        try {
            const data = await res.json();
            logger?.debug?.(`Parsed JSON: ${url}`);
            return data;
        } catch (parseError) {
            logger?.error?.(`Failed to parse JSON from ${url}:`, parseError);
            return {};
        }
    } catch (fetchError) {
        logger?.error?.(`Fetch failed for ${url}:`, fetchError);
        return {};
    }
}
