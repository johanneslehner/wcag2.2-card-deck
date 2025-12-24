/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag - The tag name.
 * @param {Object} attributes - The attributes to set.
 * @param {(string|Node|Array)} children - The children to append.
 * @returns {HTMLElement} The created element.
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });

    // Append children
    if (!Array.isArray(children)) {
        children = [children];
    }

    children.forEach(child => {
        if (child === null || child === undefined) return;
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Escapes HTML characters in a string.
 * @param {string} text 
 * @returns {string}
 */
export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Formats description text with markdown-like syntax.
 * @param {string} desc 
 * @returns {string} HTML string
 */
export function formatDescription(desc) {
    if (!desc) return '';
    
    // Basic formatting replacement
    // Note: In a full refactor, we might want to parse this into nodes instead of innerHTML
    // but for now, we'll keep the text processing but move it here.
    let text = escapeHtml(desc);
    text = text.replace(/\*\*_(.*?)_\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/_\*\*(.*?)\*\*_ /g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    const lines = text.split('\n');
    let inList = false;
    let html = '';
    
    lines.forEach(line => {
        if (line.startsWith('* ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${line.substring(2)}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (line.trim() !== '') {
                html += `<p>${line}</p>`;
            }
        }
    });
    
    if (inList) html += '</ul>';
    return html;
}
