// Import from shared modules and re-export for backwards compatibility
import { formatBonus as sharedFormatBonus } from '../shared/number-utils.js';
import { sanitizeId as sharedSanitizeId } from '../shared/string-utils.js';
import { createElement as sharedCreateElement } from '../shared/dom-utils.js';

// Re-export from shared modules
export const formatBonus = sharedFormatBonus;
export const sanitizeId = sharedSanitizeId;
export const createElement = sharedCreateElement;

export function clearElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}
