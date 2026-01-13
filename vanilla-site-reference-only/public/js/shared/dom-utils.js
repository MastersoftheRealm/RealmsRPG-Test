/**
 * RealmsRPG Shared Utilities - DOM Functions
 * ==========================================
 * Centralized DOM manipulation and utility functions.
 */

/**
 * Debounce a function - only execute after a delay without calls.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} [wait=300] - Delay in milliseconds
 * @returns {Function} The debounced function
 * 
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function - only execute once per interval.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} [limit=100] - Minimum time between calls in milliseconds
 * @returns {Function} The throttled function
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Create an element with optional attributes and children.
 * 
 * @param {string} tag - The HTML tag name
 * @param {Object} [attributes={}] - Attributes to set on the element
 * @param {(string|Node)[]} [children=[]] - Child elements or text
 * @returns {HTMLElement} The created element
 * 
 * @example
 * createElement('button', { class: 'btn btn-primary', onclick: handleClick }, ['Click me'])
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'class' || key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

/**
 * Remove all children from an element.
 * 
 * @param {HTMLElement} element - The element to clear
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Toggle a class on an element.
 * 
 * @param {HTMLElement} element - The element
 * @param {string} className - The class to toggle
 * @param {boolean} [force] - Force add (true) or remove (false)
 * @returns {boolean} Whether the class is now present
 */
export function toggleClass(element, className, force) {
    if (!element) return false;
    return element.classList.toggle(className, force);
}

/**
 * Show an element (remove display: none).
 * 
 * @param {HTMLElement} element - The element to show
 * @param {string} [display='block'] - The display value to use
 */
export function showElement(element, display = 'block') {
    if (element) {
        element.style.display = display;
    }
}

/**
 * Hide an element (set display: none).
 * 
 * @param {HTMLElement} element - The element to hide
 */
export function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Toggle element visibility.
 * 
 * @param {HTMLElement} element - The element to toggle
 * @param {string} [display='block'] - The display value when visible
 */
export function toggleElement(element, display = 'block') {
    if (!element) return;
    if (element.style.display === 'none') {
        element.style.display = display;
    } else {
        element.style.display = 'none';
    }
}

/**
 * Set up an expandable/collapsible section.
 * 
 * @param {HTMLElement} header - The header element to click
 * @param {HTMLElement} body - The body element to show/hide
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.startOpen=false] - Start in open state
 * @param {Function} [options.onToggle] - Callback when toggled
 */
export function setupCollapsible(header, body, options = {}) {
    const { startOpen = false, onToggle } = options;
    
    if (!header || !body) return;
    
    const toggle = () => {
        const isOpen = body.classList.toggle('open');
        header.classList.toggle('open', isOpen);
        if (onToggle) onToggle(isOpen);
    };
    
    header.addEventListener('click', toggle);
    header.style.cursor = 'pointer';
    
    if (startOpen) {
        body.classList.add('open');
        header.classList.add('open');
    }
}

/**
 * Toggle expand/collapse for a card or section.
 * Works with elements that have .expanded class and .expand-icon child.
 * 
 * @param {HTMLElement} element - The element or its child to toggle
 */
export function toggleExpand(element) {
    const card = element.classList?.contains('expandable-card') 
        ? element 
        : element.closest('.expandable-card') || element.closest('[class$="-card"]') || element.parentElement;
    
    if (card) {
        card.classList.toggle('expanded');
    }
}

// Make toggleExpand available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.toggleExpand = toggleExpand;
}

/**
 * Scroll an element into view smoothly.
 * 
 * @param {HTMLElement} element - The element to scroll to
 * @param {Object} [options={}] - Scroll options
 * @param {string} [options.behavior='smooth'] - Scroll behavior
 * @param {string} [options.block='start'] - Vertical alignment
 */
export function scrollIntoView(element, options = {}) {
    if (!element) return;
    element.scrollIntoView({
        behavior: options.behavior || 'smooth',
        block: options.block || 'start'
    });
}

/**
 * Copy text to clipboard.
 * 
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} Whether the copy was successful
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Get form data as an object.
 * 
 * @param {HTMLFormElement} form - The form element
 * @returns {Object} Form data as key-value pairs
 */
export function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    return data;
}

/**
 * Add event listener with automatic cleanup.
 * Returns a function to remove the listener.
 * 
 * @param {HTMLElement} element - The element to attach to
 * @param {string} event - The event name
 * @param {Function} handler - The event handler
 * @param {Object} [options] - Event listener options
 * @returns {Function} A function to remove the listener
 */
export function addListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * Wait for an element to exist in the DOM.
 * 
 * @param {string} selector - CSS selector for the element
 * @param {number} [timeout=5000] - Maximum wait time in milliseconds
 * @returns {Promise<HTMLElement>} The found element
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Set up a modal with open/close functionality.
 * 
 * @param {HTMLElement} modal - The modal overlay element
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.closeOnBackdrop=true] - Close when clicking backdrop
 * @param {boolean} [options.closeOnEscape=true] - Close on Escape key
 * @returns {{open: Function, close: Function, isOpen: Function}} Modal controls
 */
export function setupModal(modal, options = {}) {
    const { closeOnBackdrop = true, closeOnEscape = true } = options;
    
    const open = () => {
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    
    const close = () => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    };
    
    const isOpen = () => modal.classList.contains('active');
    
    if (closeOnBackdrop) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }
    
    if (closeOnEscape) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) close();
        });
    }
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close, [data-modal-close]');
    if (closeBtn) {
        closeBtn.addEventListener('click', close);
    }
    
    return { open, close, isOpen };
}

/**
 * Create and show a toast notification.
 * 
 * @param {string} message - The message to show
 * @param {Object} [options={}] - Options
 * @param {'success'|'danger'|'warning'|'info'} [options.type='info'] - Toast type
 * @param {number} [options.duration=3000] - How long to show in milliseconds
 */
export function showToast(message, options = {}) {
    const { type = 'info', duration = 3000 } = options;
    
    // Create container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = createElement('div', { id: 'toast-container' });
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = createElement('div', { class: `alert alert-${type}` }, [message]);
    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 8px;
        animation: slideIn 0.3s ease;
        min-width: 200px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Set up tab switching functionality.
 * 
 * @param {string} tabsContainerSelector - Selector for the tabs container
 * @param {Object} [options={}] - Options
 * @param {Function} [options.onTabChange] - Callback when tab changes
 */
export function setupTabs(tabsContainerSelector, options = {}) {
    const { onTabChange } = options;
    
    const tabButtons = document.querySelectorAll(`${tabsContainerSelector} .tab-button`);
    const tabContents = document.querySelectorAll('.tab-content');
    
    const openTab = (tabName) => {
        tabContents.forEach(content => content.classList.remove('active-tab'));
        tabButtons.forEach(button => button.classList.remove('active'));
        
        const content = document.getElementById(tabName);
        const button = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (content) content.classList.add('active-tab');
        if (button) button.classList.add('active');
        
        if (onTabChange) onTabChange(tabName);
    };
    
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = button.dataset.tab || button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (tabName) {
                e.preventDefault();
                openTab(tabName);
            }
        });
    });
    
    return { openTab };
}

/**
 * Standard tab opener function for onclick handlers.
 * 
 * @param {Event} event - The click event
 * @param {string} tabName - The tab name to open
 */
export function openTab(event, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active-tab'));
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.classList.add('active-tab');
    }
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// Make openTab available globally for onclick handlers
if (typeof window !== 'undefined') {
    window.openTab = openTab;
}

/**
 * Create a chip/tag element.
 * 
 * @param {string} text - The chip text
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.removable=false] - Whether to show remove button
 * @param {Function} [options.onRemove] - Callback when remove is clicked
 * @param {string} [options.variant=''] - Chip variant (e.g., 'primary', 'success')
 * @returns {HTMLElement} The chip element
 */
export function createChip(text, options = {}) {
    const { removable = false, onRemove, variant = '' } = options;
    
    const chip = createElement('div', { 
        class: `chip ${variant ? `chip-${variant}` : ''}`.trim() 
    });
    
    chip.appendChild(document.createTextNode(text));
    
    if (removable && onRemove) {
        const removeBtn = createElement('span', { class: 'chip-remove' }, ['×']);
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onRemove();
            chip.remove();
        });
        chip.appendChild(removeBtn);
    }
    
    return chip;
}
