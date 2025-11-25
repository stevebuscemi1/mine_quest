// utils/Sanitizer.js
// Utility for sanitizing user-provided content before inserting into the DOM.
// This file implements simple text sanitization and optional HTML sanitization.
// For more robust HTML sanitization you can replace the implementation with DOMPurify.

/**
 * Sanitizer class provides static methods for safe content handling.
 */
export class Sanitizer {
    /**
     * Escape a plain text string for safe insertion via innerHTML.
     * This converts special characters to HTML entities.
     * @param {string} text - The user-provided text.
     * @returns {string} - Escaped HTML string.
     */
    static escapeHTML(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text; // automatically escapes
        return div.innerHTML;
    }

    /**
     * Sanitize a string that will be used as an attribute value.
     * Removes characters that could break HTML attributes.
     * @param {string} value - Attribute value.
     * @returns {string}
     */
    static sanitizeAttribute(value) {
        if (typeof value !== 'string') return '';
        // Remove quotes and angle brackets
        return value.replace(/["'<>]/g, '');
    }

    /**
     * Simple HTML sanitization using a whitelist of allowed tags.
     * If you need more advanced sanitization, replace this with DOMPurify.
     * @param {string} html - Raw HTML string.
     * @param {Array<string>} allowedTags - List of allowed HTML tags (e.g., ['b','i','span']).
     * @returns {string}
     */
    static sanitizeHTML(html, allowedTags = []) {
        if (typeof html !== 'string') return '';
        // Create a temporary element to parse HTML
        const template = document.createElement('template');
        template.innerHTML = html;
        // Walk the nodes and remove disallowed elements
        const walk = (node) => {
            const childNodes = Array.from(node.childNodes);
            for (const child of childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.nodeName.toLowerCase();
                    if (!allowedTags.includes(tag)) {
                        // Replace element with its text content
                        const textNode = document.createTextNode(child.textContent);
                        node.replaceChild(textNode, child);
                    } else {
                        // Recursively sanitize children
                        walk(child);
                    }
                }
            }
        };
        walk(template.content);
        return template.innerHTML;
    }
}
