/**
 * Shared Collapsible Row Component
 * 
 * A reusable component for creating collapsible rows used across
 * feats, traits, techniques, powers, and inventory items.
 * 
 * Usage:
 *   const row = new CollapsibleRow({
 *     title: 'Feat Name',
 *     columns: [{ content: 'Action', style: '' }],
 *     description: 'Full description text',
 *     subtext: 'Ancestry Trait',
 *     uses: { current: 2, max: 3, recovery: 'Full Recovery' },
 *     onUse: (delta) => handleUseChange(delta),
 *     expandedContent: '<div>Extra content</div>',
 *     actionButton: { label: 'Use (5)', onClick: () => {}, data: {} },
 *     className: 'collapsible-feat',
 *     gridColumns: '1fr 1fr 1fr'
 *   });
 *   container.appendChild(row.element);
 */

import { sanitizeId } from '../../utils.js';

export class CollapsibleRow {
    constructor(options = {}) {
        this.options = {
            title: '',
            columns: [],           // Array of { content, style? } for additional columns
            description: '',
            subtext: '',           // Secondary text under title (e.g., 'Ancestry Trait')
            uses: null,            // { current, max, recovery } or null
            onUse: null,           // Callback: (delta) => void
            expandedContent: '',   // Additional HTML for expanded section
            actionButton: null,    // { label, onClick, data } for action buttons like "Use (5)"
            className: 'collapsible-row-wrapper',
            gridColumns: null,     // Custom grid template columns
            checkbox: null,        // { checked, onChange, data } for equipped checkboxes
            truncateWords: 14,     // Number of words to show in truncated description
            ...options
        };

        this.element = this._createElement();
        this._bindEvents();
    }

    _createElement() {
        const wrapper = document.createElement('div');
        wrapper.className = this.options.className;

        const id = sanitizeId(this.options.title);
        const truncatedDesc = this._truncateDescription(this.options.description);
        
        wrapper.innerHTML = `
            <div class="collapsed-row"${this.options.gridColumns ? ` style="grid-template-columns:${this.options.gridColumns};"` : ''}>
                ${this._buildTitleCell()}
                ${this._buildColumns()}
                ${this._buildUsesCell(id)}
                ${this._buildActionButton()}
                ${this._buildCheckbox()}
            </div>
            <div class="expanded-body">
                ${this._buildExpandedContent(id)}
            </div>
        `;

        return wrapper;
    }

    _buildTitleCell() {
        const { title, subtext } = this.options;
        if (subtext) {
            return `
                <div>
                    <strong>${title}</strong>
                    <span class="expand-indicator">▼</span><br>
                    <span style="font-size:10px;color:var(--text-secondary);">${subtext}</span>
                </div>
            `;
        }
        return `
            <div>
                <strong>${title}</strong>
                <span class="expand-indicator">▼</span>
            </div>
        `;
    }

    _buildColumns() {
        if (!this.options.columns.length) {
            // Default: show truncated description if no custom columns
            const truncatedDesc = this._truncateDescription(this.options.description);
            return `<div class="truncated">${truncatedDesc}</div>`;
        }
        return this.options.columns.map(col => 
            `<div${col.style ? ` style="${col.style}"` : ''}>${col.content}</div>`
        ).join('');
    }

    _buildUsesCell(id) {
        const { uses } = this.options;
        if (!uses || !uses.max) return '';
        
        const current = uses.current ?? uses.max;
        return `
            <div class="uses-cell">
                <button class="use-button" data-dir="-1">-</button>
                <span id="uses-${id}">${current}</span>/<span>${uses.max}</span>
                <button class="use-button" data-dir="1">+</button>
            </div>
        `;
    }

    _buildActionButton() {
        const { actionButton } = this.options;
        if (!actionButton) return '';
        
        const dataAttrs = actionButton.data 
            ? Object.entries(actionButton.data).map(([k, v]) => `data-${k}="${v}"`).join(' ')
            : '';
        
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                <button class="action-btn" ${dataAttrs}>${actionButton.label}</button>
            </div>
        `;
    }

    _buildCheckbox() {
        const { checkbox } = this.options;
        if (!checkbox) return '';
        
        const dataAttrs = checkbox.data 
            ? Object.entries(checkbox.data).map(([k, v]) => `data-${k}="${v}"`).join(' ')
            : '';
        
        return `
            <div style="text-align:center;">
                <input type="checkbox" class="row-checkbox" ${checkbox.checked ? 'checked' : ''} ${dataAttrs}>
            </div>
        `;
    }

    _buildExpandedContent(id) {
        const { description, uses, expandedContent } = this.options;
        let html = '';

        if (description) {
            html += `<p style="margin:0 0 10px 0;">${description}</p>`;
        }

        if (uses && uses.max) {
            html += `
                <div style="margin:6px 0 10px;font-size:12px;">
                    <strong>Recovery:</strong> ${uses.recovery || 'Full Recovery'}<br>
                    <strong>Uses:</strong> <span id="exp-uses-${id}">${uses.current ?? uses.max}</span> / ${uses.max}
                </div>
            `;
        }

        if (expandedContent) {
            html += expandedContent;
        }

        return html;
    }

    _truncateDescription(desc) {
        if (!desc) return 'No description';
        const words = desc.split(/\s+/);
        if (words.length <= this.options.truncateWords) return desc;
        return words.slice(0, this.options.truncateWords).join(' ') + '...';
    }

    _bindEvents() {
        const collapsedRow = this.element.querySelector('.collapsed-row');
        const expandedBody = this.element.querySelector('.expanded-body');
        const indicator = this.element.querySelector('.expand-indicator');

        // Toggle expand/collapse
        collapsedRow.addEventListener('click', (e) => {
            // Don't toggle if clicking interactive elements
            if (e.target.classList.contains('use-button') || 
                e.target.classList.contains('action-btn') ||
                e.target.classList.contains('energy-use-btn') ||
                e.target.type === 'checkbox') {
                return;
            }
            this.element.classList.toggle('open');
            if (indicator) {
                indicator.textContent = this.element.classList.contains('open') ? '▲' : '▼';
            }
        });

        // Uses buttons
        if (this.options.uses && this.options.onUse) {
            const id = sanitizeId(this.options.title);
            this.element.querySelectorAll('.use-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const delta = parseInt(btn.dataset.dir);
                    this.options.onUse(delta);
                    // Sync expanded and collapsed uses displays
                    const expSpan = this.element.querySelector(`#exp-uses-${id}`);
                    const baseSpan = this.element.querySelector(`#uses-${id}`);
                    if (expSpan && baseSpan) {
                        expSpan.textContent = baseSpan.textContent;
                    }
                });
            });
        }

        // Action button
        if (this.options.actionButton && this.options.actionButton.onClick) {
            const actionBtn = this.element.querySelector('.action-btn');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.options.actionButton.onClick(e);
                });
            }
        }

        // Checkbox
        if (this.options.checkbox && this.options.checkbox.onChange) {
            const checkbox = this.element.querySelector('.row-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.options.checkbox.onChange(e.target.checked, e);
                });
            }
        }
    }

    // Public methods for external control
    updateUses(current, max) {
        const id = sanitizeId(this.options.title);
        const baseSpan = this.element.querySelector(`#uses-${id}`);
        const expSpan = this.element.querySelector(`#exp-uses-${id}`);
        if (baseSpan) baseSpan.textContent = current;
        if (expSpan) expSpan.textContent = current;
    }

    expand() {
        this.element.classList.add('open');
        const indicator = this.element.querySelector('.expand-indicator');
        if (indicator) indicator.textContent = '▲';
    }

    collapse() {
        this.element.classList.remove('open');
        const indicator = this.element.querySelector('.expand-indicator');
        if (indicator) indicator.textContent = '▼';
    }

    toggle() {
        this.element.classList.toggle('open');
        const indicator = this.element.querySelector('.expand-indicator');
        if (indicator) {
            indicator.textContent = this.element.classList.contains('open') ? '▲' : '▼';
        }
    }
}

/**
 * Collapsible Section Component
 * 
 * Creates a collapsible section with a header that can contain multiple rows.
 * Used for grouping related items (e.g., "Archetype Feats", "Weapons").
 */
export class CollapsibleSection {
    constructor(options = {}) {
        this.options = {
            title: '',
            count: 0,
            content: [],     // Array of DOM elements or a single element
            open: true,
            headerClass: 'library-table-header section-header',
            ...options
        };

        this.element = this._createElement();
        this._bindEvents();
    }

    _createElement() {
        const section = document.createElement('div');
        section.className = 'collapsible-section';

        const { title, count, open } = this.options;
        
        section.innerHTML = `
            <div class="${this.options.headerClass}" style="cursor:pointer;user-select:none;">
                <div style="font-weight:700;">${title}</div>
                <div style="text-align:right;font-size:13px;color:var(--primary-blue);">
                    ${count > 0 ? count : ''} 
                    <span class="expand-indicator" style="margin-left:8px;">${open ? '▲' : '▼'}</span>
                </div>
            </div>
            <div class="section-body" style="${open ? '' : 'display:none;'}"></div>
        `;

        const body = section.querySelector('.section-body');
        const { content } = this.options;
        
        if (Array.isArray(content)) {
            content.forEach(el => {
                if (el instanceof HTMLElement) {
                    body.appendChild(el);
                }
            });
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        }

        return section;
    }

    _bindEvents() {
        const header = this.element.querySelector('.section-header, .library-table-header');
        const body = this.element.querySelector('.section-body');
        const indicator = this.element.querySelector('.expand-indicator');

        header.addEventListener('click', () => {
            const expanded = body.style.display !== 'none';
            body.style.display = expanded ? 'none' : '';
            if (indicator) {
                indicator.textContent = expanded ? '▼' : '▲';
            }
        });
    }

    appendContent(element) {
        const body = this.element.querySelector('.section-body');
        if (body && element instanceof HTMLElement) {
            body.appendChild(element);
        }
    }

    clearContent() {
        const body = this.element.querySelector('.section-body');
        if (body) {
            body.innerHTML = '';
        }
    }
}

/**
 * Helper function to create a simple collapsible row without instantiating the class
 */
export function createCollapsibleRow(options) {
    return new CollapsibleRow(options).element;
}

/**
 * Helper function to create a collapsible section without instantiating the class
 */
export function createCollapsibleSection(title, count, content, open = true) {
    return new CollapsibleSection({ title, count, content, open }).element;
}
