/**
 * RealmsRPG Centralized Chip Utilities
 * =====================================
 * Shared JavaScript for chip interactions, expand/collapse, option controls.
 * Used across: Character Creator, Character Sheet, Library, Creature Creator
 */

/**
 * Toggle chip expansion (show/hide description)
 * @param {HTMLElement} chip - The chip element to toggle
 * @param {Object} [options] - Optional config
 * @param {Function} [options.onExpand] - Callback when expanded
 * @param {Function} [options.onCollapse] - Callback when collapsed
 * @returns {boolean} New expanded state
 */
export function toggleChipExpand(chip, options = {}) {
    const wasExpanded = chip.classList.contains('expanded');
    chip.classList.toggle('expanded');
    const isExpanded = !wasExpanded;
    
    if (isExpanded && options.onExpand) {
        options.onExpand(chip);
    } else if (!isExpanded && options.onCollapse) {
        options.onCollapse(chip);
    }
    
    return isExpanded;
}

/**
 * Initialize chips with click-to-expand functionality
 * @param {string|HTMLElement} containerSelector - Selector or element containing chips
 * @param {Object} [options] - Optional config
 * @param {string} [options.chipSelector='.chip'] - Selector for chips
 * @param {boolean} [options.exclusive=false] - Only one chip expanded at a time
 */
export function initExpandableChips(containerSelector, options = {}) {
    const container = typeof containerSelector === 'string' 
        ? document.querySelector(containerSelector)
        : containerSelector;
        
    if (!container) return;
    
    const chipSelector = options.chipSelector || '.chip';
    const exclusive = options.exclusive || false;
    
    container.addEventListener('click', (e) => {
        const chip = e.target.closest(chipSelector);
        if (!chip) return;
        
        // Don't toggle if clicking on a button inside the chip
        if (e.target.closest('.chip-btn')) return;
        
        if (exclusive) {
            // Collapse all other chips
            container.querySelectorAll(`${chipSelector}.expanded`).forEach(c => {
                if (c !== chip) c.classList.remove('expanded');
            });
        }
        
        toggleChipExpand(chip, options);
    });
}

/**
 * Toggle total costs box collapse state
 * @param {HTMLElement} box - The total-costs-box element
 */
export function toggleTotalCostsBox(box) {
    box.classList.toggle('collapsed');
    const arrow = box.querySelector('.toggle-arrow');
    if (arrow) {
        arrow.textContent = box.classList.contains('collapsed') ? '▶' : '◀';
    }
    // Save preference
    try {
        localStorage.setItem('totalCostsBoxCollapsed', box.classList.contains('collapsed'));
    } catch (e) { /* ignore storage errors */ }
}

/**
 * Initialize total costs box with toggle functionality
 * @param {string|HTMLElement} selector - Selector or element for the box
 */
export function initTotalCostsBox(selector) {
    const box = typeof selector === 'string' 
        ? document.querySelector(selector)
        : selector;
        
    if (!box) return;
    
    // Create toggle arrow if not exists
    let arrow = box.querySelector('.toggle-arrow');
    if (!arrow) {
        arrow = document.createElement('div');
        arrow.className = 'toggle-arrow';
        arrow.textContent = '◀';
        box.appendChild(arrow);
    }
    
    arrow.addEventListener('click', () => toggleTotalCostsBox(box));
    
    // Restore saved preference
    try {
        const savedState = localStorage.getItem('totalCostsBoxCollapsed');
        if (savedState === 'true') {
            box.classList.add('collapsed');
            arrow.textContent = '▶';
        }
    } catch (e) { /* ignore storage errors */ }
}

/**
 * Toggle expandable section (powers, techniques lists)
 * @param {HTMLElement} section - The expandable-section element
 */
export function toggleExpandableSection(section) {
    section.classList.toggle('expanded');
}

/**
 * Initialize expandable sections with header click
 * @param {string|HTMLElement} containerSelector - Container with sections
 * @param {Object} [options] - Optional config
 * @param {string} [options.sectionSelector='.expandable-section'] - Section selector
 * @param {string} [options.headerSelector='.expandable-header'] - Header selector
 */
export function initExpandableSections(containerSelector, options = {}) {
    const container = typeof containerSelector === 'string' 
        ? document.querySelector(containerSelector)
        : containerSelector;
        
    if (!container) return;
    
    const sectionSelector = options.sectionSelector || '.expandable-section';
    const headerSelector = options.headerSelector || '.expandable-header';
    
    container.addEventListener('click', (e) => {
        const header = e.target.closest(headerSelector);
        if (!header) return;
        
        const section = header.closest(sectionSelector);
        if (section) {
            toggleExpandableSection(section);
        }
    });
}

/**
 * Create chip HTML structure
 * @param {Object} config - Chip configuration
 * @param {string} config.name - Chip display name
 * @param {string} [config.type] - Chip type for coloring (action, duration, etc.)
 * @param {string} [config.description] - Expandable description
 * @param {string} [config.size] - Size variant (sm, lg)
 * @param {boolean} [config.expandable=true] - Whether chip is expandable
 * @param {Array<Object>} [config.options] - Option controls [{name, level, min, max, desc, cost}]
 * @param {string} [config.addButtonText] - Text for add button (if applicable)
 * @returns {string} HTML string
 */
export function createChipHTML(config) {
    const {
        name,
        type = '',
        description = '',
        size = '',
        expandable = true,
        options = [],
        addButtonText = ''
    } = config;
    
    const typeClass = type ? `chip--${type}` : '';
    const sizeClass = size ? `chip--${size}` : '';
    const expandableClass = expandable && (description || options.length) ? '' : 'no-expand';
    
    let html = `<div class="chip ${typeClass} ${sizeClass} ${expandableClass}">`;
    
    html += '<div class="chip-header">';
    html += `<span class="chip-name">${escapeHTML(name)}</span>`;
    
    if (addButtonText) {
        html += `<button class="chip-btn chip-btn--add">${escapeHTML(addButtonText)}</button>`;
    }
    
    if (expandable && (description || options.length)) {
        html += '<span class="chip-expand-icon">▼</span>';
    }
    
    html += '</div>';
    
    if (description || options.length) {
        html += '<div class="chip-description">';
        
        if (description) {
            html += `<p>${escapeHTML(description)}</p>`;
        }
        
        options.forEach(opt => {
            html += `
                <div class="chip-option">
                    <span class="chip-option-label">${escapeHTML(opt.name)}</span>
                    <div class="chip-option-controls">
                        <button class="chip-btn chip-btn--option" data-action="decrease">−</button>
                        <span class="chip-option-level">${opt.level || 0}</span>
                        <button class="chip-btn chip-btn--option" data-action="increase">+</button>
                    </div>
                    ${opt.desc ? `<span class="chip-option-desc">${escapeHTML(opt.desc)}</span>` : ''}
                    ${opt.cost !== undefined ? `<span class="chip-option-cost">(${opt.cost})</span>` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

/**
 * Create expandable section HTML
 * @param {Object} config - Section configuration
 * @param {string} config.title - Section title
 * @param {number} [config.count] - Item count
 * @param {string} config.content - Section body HTML
 * @param {boolean} [config.expanded=false] - Initial expanded state
 * @returns {string} HTML string
 */
export function createExpandableSectionHTML(config) {
    const { title, count, content, expanded = false } = config;
    const expandedClass = expanded ? ' expanded' : '';
    
    return `
        <div class="expandable-section${expandedClass}">
            <div class="expandable-header">
                <span class="expandable-title">${escapeHTML(title)}</span>
                ${count !== undefined ? `<span class="expandable-count">(${count})</span>` : ''}
                <span class="expandable-toggle">▼</span>
            </div>
            <div class="expandable-body">
                ${content}
            </div>
        </div>
    `;
}

/**
 * Create feature item HTML (for powers/techniques/armaments in lists)
 * @param {Object} config - Feature configuration
 * @param {string} config.name - Feature name
 * @param {string} [config.meta] - Meta info (cost, level, etc.)
 * @param {Array<Object>} [config.details] - Detail lines [{label, value}]
 * @returns {string} HTML string
 */
export function createFeatureItemHTML(config) {
    const { name, meta = '', details = [] } = config;
    
    let detailsHTML = '';
    if (details.length) {
        detailsHTML = '<div class="feature-item-details">';
        details.forEach(d => {
            detailsHTML += `<div class="feature-detail-line"><strong>${escapeHTML(d.label)}:</strong> ${escapeHTML(d.value)}</div>`;
        });
        detailsHTML += '</div>';
    }
    
    return `
        <div class="feature-item">
            <div class="feature-item-header">
                <span class="feature-item-name">${escapeHTML(name)}</span>
                ${meta ? `<span class="feature-item-meta">${escapeHTML(meta)}</span>` : ''}
            </div>
            ${detailsHTML}
        </div>
    `;
}

/**
 * Initialize feature items with click-to-expand
 * @param {string|HTMLElement} containerSelector - Container element
 */
export function initFeatureItems(containerSelector) {
    const container = typeof containerSelector === 'string' 
        ? document.querySelector(containerSelector)
        : containerSelector;
        
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.feature-item');
        if (item) {
            item.classList.toggle('expanded');
        }
    });
}

/**
 * Create total costs box HTML
 * @param {Object} costs - Cost values
 * @param {number} [costs.pp=0] - Power Points
 * @param {number} [costs.tp=0] - Technique Points
 * @param {number} [costs.ap=0] - Armament Points
 * @param {number} [costs.fp=0] - Feature Points
 * @param {Object} [options] - Display options
 * @param {string} [options.title='Total Costs'] - Box title
 * @returns {string} HTML string
 */
export function createTotalCostsBoxHTML(costs, options = {}) {
    const { pp = 0, tp = 0, ap = 0, fp = 0 } = costs;
    const { title = 'Total Costs' } = options;
    
    return `
        <div class="total-costs-box">
            <h3>${escapeHTML(title)}</h3>
            ${pp !== undefined ? `<p><strong>PP:</strong> ${pp}</p>` : ''}
            ${tp !== undefined ? `<p><strong>TP:</strong> ${tp}</p>` : ''}
            ${ap !== undefined ? `<p><strong>AP:</strong> ${ap}</p>` : ''}
            ${fp !== undefined ? `<p><strong>FP:</strong> ${fp}</p>` : ''}
            <div class="toggle-arrow">◀</div>
        </div>
    `;
}

/**
 * Update total costs box values
 * @param {HTMLElement} box - The total-costs-box element
 * @param {Object} costs - New cost values
 */
export function updateTotalCostsBox(box, costs) {
    if (!box) return;
    
    const updateCost = (key, value) => {
        const p = box.querySelector(`p:has(strong:contains('${key.toUpperCase()}'))`);
        // Fallback to searching all <p> elements
        if (!p) {
            box.querySelectorAll('p').forEach(para => {
                if (para.textContent.includes(key.toUpperCase() + ':')) {
                    para.innerHTML = `<strong>${key.toUpperCase()}:</strong> ${value}`;
                }
            });
        } else {
            p.innerHTML = `<strong>${key.toUpperCase()}:</strong> ${value}`;
        }
    };
    
    Object.entries(costs).forEach(([key, value]) => {
        updateCost(key, value);
    });
}

/**
 * Get chip type class based on action category
 * @param {string} category - Category name (Action, Duration, etc.)
 * @returns {string} CSS class name
 */
export function getChipTypeClass(category) {
    const map = {
        'action': 'action',
        'activation': 'activation',
        'area': 'area',
        'duration': 'duration',
        'target': 'target',
        'special': 'special',
        'restriction': 'restriction',
        'proficiency': 'proficiency',
        'weapon': 'weapon',
        'armor': 'armor',
        'shield': 'shield',
        'feat': 'feat',
        'weakness': 'weakness'
    };
    
    const key = (category || '').toLowerCase();
    return map[key] ? `chip--${map[key]}` : '';
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Export for use in non-module contexts
if (typeof window !== 'undefined') {
    window.ChipUtils = {
        toggleChipExpand,
        initExpandableChips,
        toggleTotalCostsBox,
        initTotalCostsBox,
        toggleExpandableSection,
        initExpandableSections,
        createChipHTML,
        createExpandableSectionHTML,
        createFeatureItemHTML,
        initFeatureItems,
        createTotalCostsBoxHTML,
        updateTotalCostsBox,
        getChipTypeClass
    };
}
