import { CollapsibleRow } from '../shared/collapsible-row.js';
import { findByIdOrName } from '/js/shared/id-constants.js';

export function createTechniquesContent(techniques) {
    const content = document.createElement('div');
    content.id = 'techniques-content';
    content.className = 'tab-content';
    
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Add header with "Add Technique" button in edit mode
    const editHeader = document.createElement('div');
    editHeader.className = 'library-section-header';
    editHeader.innerHTML = `
        <h3>TECHNIQUES</h3>
        <button class="resource-add-btn" onclick="window.showTechniqueModal()">
            + Add Technique
        </button>
    `;
    content.appendChild(editHeader);
    
    if (!techniques.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;';
        emptyMsg.textContent = 'No techniques selected';
        content.appendChild(emptyMsg);
        return content;
    }
    const header = document.createElement('div');
    header.className = 'library-table-header tech';
    header.innerHTML = '<div>NAME</div><div>ACTION</div><div>WEAPON</div><div>ENERGY</div>';
    content.appendChild(header);

    techniques.forEach(t => {
        // Build chips with blue highlight for TP cost
        let chipsHTML = '';
        if (Array.isArray(t.parts) && t.parts.length && t.partsDb) {
            chipsHTML = buildTechniquePartChips(t.parts, t.partsDb);
        } else if (t.partChipsHTML) {
            chipsHTML = t.partChipsHTML;
        }

        const expandedContent = chipsHTML ? `
            <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
            <div class="part-chips">${chipsHTML}</div>
        ` : '';

        const row = new CollapsibleRow({
            title: t.name,
            columns: [
                { content: t.actionType || 'Basic Action' },
                { content: t.weaponName || 'Unarmed' }
            ],
            description: t.description || '',
            className: 'collapsible-tech',
            actionButton: {
                label: `Use (${t.energy})`,
                data: { name: t.name, energy: t.energy },
                onClick: (e) => {
                    const energy = parseInt(e.target.dataset.energy);
                    const name = e.target.dataset.name;
                    window.useTechnique(name, energy);
                }
            },
            expandedContent: expandedContent
        });

        // Add remove button in edit mode
        if (isEditMode) {
            const collapsedRow = row.element.querySelector('.collapsed-row');
            if (collapsedRow) {
                collapsedRow.style.position = 'relative';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'resource-remove-btn';
                removeBtn.innerHTML = '✕';
                removeBtn.title = 'Remove technique';
                removeBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 8px;font-size:0.9em;background:var(--error-color, #dc3545);color:white;border:none;border-radius:4px;cursor:pointer;z-index:10;';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove "${t.name}" technique?`)) {
                        window.removeTechniqueFromCharacter(encodeURIComponent(t.name));
                    }
                };
                collapsedRow.appendChild(removeBtn);
            }
        }

        content.appendChild(row.element);
    });
    return content;
}

// --- Shared helper for collapsible chips for powers/techniques ---
// Creates clickable chips that expand to show description and level details
export function buildTechniquePartChips(parts, partsDb) {
    if (!Array.isArray(parts) || !partsDb) return '';
    return parts.map((pl, idx) => {
        const def = findByIdOrName(partsDb, pl);
        if (!def) return '';
        // Calculate TP cost
        const l1 = pl.op_1_lvl || 0, l2 = pl.op_2_lvl || 0, l3 = pl.op_3_lvl || 0;
        let opt1TPRaw = (def.op_1_tp || 0) * l1;
        if (def.name === 'Additional Damage') opt1TPRaw = Math.floor(opt1TPRaw);
        const rawTP =
            (def.base_tp || 0) +
            opt1TPRaw +
            (def.op_2_tp || 0) * l2 +
            (def.op_3_tp || 0) * l3;
        const finalTP = Math.floor(rawTP);
        
        // Build chip label
        let labelText = def.name;
        if (l1 > 0) labelText += ` (Lvl ${l1})`;
        if (l2 > 0) labelText += ` (Opt2 ${l2})`;
        if (l3 > 0) labelText += ` (Opt3 ${l3})`;
        if (finalTP > 0) labelText += ` [+${finalTP} TP]`;
        
        // Build description content for expanded view
        let descContent = def.description || 'No description available.';
        if (l1 > 0 && def.op_1_desc) {
            descContent += `<br><strong>Level ${l1}:</strong> ${def.op_1_desc}`;
        }
        if (l2 > 0 && def.op_2_desc) {
            descContent += `<br><strong>Option 2 (${l2}):</strong> ${def.op_2_desc}`;
        }
        if (l3 > 0 && def.op_3_desc) {
            descContent += `<br><strong>Option 3 (${l3}):</strong> ${def.op_3_desc}`;
        }
        
        const tpClass = finalTP > 0 ? 'tp-cost' : '';
        const chipId = `chip-${idx}-${Date.now()}`;
        
        return `
            <span class="part-chip collapsible-chip ${tpClass}" data-chip-id="${chipId}" onclick="this.classList.toggle('expanded')" title="Click to expand">
                <span class="chip-label">${labelText}</span>
                <span class="chip-expand-icon">▼</span>
                <div class="chip-description">${descContent}</div>
            </span>
        `;
    }).join('');
}

/**
 * Build collapsible property chips for armaments (weapons/armor)
 * @param {Array} properties - Array of property objects with name, op_1_lvl, etc.
 * @param {Array} propsDb - Database of all properties with descriptions
 * @returns {string} HTML string of collapsible chips
 */
export function buildPropertyChips(properties, propsDb) {
    if (!Array.isArray(properties) || !properties.length) return '';
    
    // Exclude base properties that are displayed elsewhere
    const EXCLUDED_PROPS = [
        "Damage Reduction", "Split Damage Dice", "Range", "Shield Base", 
        "Armor Base", "Weapon Damage", "Critical Range +1",
        "Armor Strength Requirement", "Armor Agility Requirement", "Armor Vitality Requirement"
    ];
    
    return properties.map((prop, idx) => {
        const propName = typeof prop === 'string' ? prop : (prop.name || '');
        if (!propName || EXCLUDED_PROPS.includes(propName)) return '';
        
        const lvl = (typeof prop === 'object' ? prop.op_1_lvl : 0) || 0;
        const def = findByIdOrName(propsDb, prop);
        
        // Build label
        let labelText = propName;
        if (lvl > 0) labelText += ` (Lvl ${lvl})`;
        
        // Build description
        let descContent = def?.description || 'No description available.';
        if (lvl > 0 && def?.op_1_desc) {
            descContent += `<br><strong>Level ${lvl}:</strong> ${def.op_1_desc}`;
        }
        
        const chipId = `prop-chip-${idx}-${Date.now()}`;
        
        return `
            <span class="part-chip collapsible-chip property-chip" data-chip-id="${chipId}" onclick="this.classList.toggle('expanded')" title="Click to expand">
                <span class="chip-label">${labelText}</span>
                <span class="chip-expand-icon">▼</span>
                <div class="chip-description">${descContent}</div>
            </span>
        `;
    }).filter(Boolean).join('');
}
