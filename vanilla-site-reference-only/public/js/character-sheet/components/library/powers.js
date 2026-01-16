import { formatPowerDamage } from '../../../calculators/power-calc.js';
import { buildTechniquePartChips } from './techniques.js';
import { CollapsibleRow } from '../shared/collapsible-row.js';

export function createPowersContent(powers) {
    const content = document.createElement('div');
    content.id = 'powers-content';
    content.className = 'tab-content';
    
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Get character data for innate calculations
    const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
    
    // Calculate innate values using archetype progression
    let innateThreshold = 0;
    let innatePools = 0;
    let innateEnergyMax = 0;
    
    if (typeof window.calculateArchetypeProgression === 'function' && charData) {
        const progression = window.calculateArchetypeProgression(
            charData.level || 1,
            charData.mart_prof || 0,
            charData.pow_prof || 0,
            charData.archetypeChoices || {}
        );
        innateThreshold = progression.innateThreshold || 0;
        innatePools = progression.innatePools || 0;
        innateEnergyMax = progression.innateEnergy || 0;
    }

    // Separate powers into innate and non-innate
    // Check both the power object and charData.powers for innate flag
    const innatePowers = [];
    const regularPowers = [];
    
    powers.forEach(power => {
        // Check if this power is marked as innate in charData.powers
        const savedPower = (charData?.powers || []).find(p => {
            const pName = typeof p === 'string' ? p : p.name;
            return pName === power.name;
        });
        const isInnate = (typeof savedPower === 'object' && savedPower.innate === true) || power.innate === true;
        
        if (isInnate) {
            innatePowers.push({ ...power, innate: true });
        } else {
            regularPowers.push({ ...power, innate: false });
        }
    });

    // Calculate innate energy used (sum of energy costs of innate powers)
    const innateEnergyUsed = innatePowers.reduce((sum, p) => sum + (p.energy || 0), 0);
    const innateEnergyCurrent = Math.max(0, innateEnergyMax - innateEnergyUsed);

    // === INNATE POWERS SECTION ===
    const innateHeader = document.createElement('div');
    innateHeader.className = 'library-section-header';
    innateHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
    
    // Left side: Title
    const innateTitleEl = document.createElement('h3');
    innateTitleEl.textContent = 'INNATE POWERS';
    innateHeader.appendChild(innateTitleEl);
    
    // Right side: Innate displays + Add button
    const rightControls = document.createElement('div');
    rightControls.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    // Add innate displays if any values > 0
    if (innateThreshold > 0 || innatePools > 0 || innateEnergyMax > 0) {
        const displays = [
            { label: 'Threshold', value: innateThreshold },
            { label: 'Pools', value: innatePools }
        ].filter(item => item.value > 0);

        displays.forEach(item => {
            const display = document.createElement('div');
            display.className = 'innate-stat-chip';
            display.style.cssText = `
                background: var(--bg-medium);
                color: var(--primary-dark);
                border-radius: 6px;
                padding: 4px 10px;
                font-weight: 600;
                font-size: 0.85em;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            display.innerHTML = `
                <span style="color: var(--text-secondary); font-weight: 500;">${item.label}:</span>
                <span style="color: var(--primary-blue); font-weight: 700;">${item.value}</span>
            `;
            rightControls.appendChild(display);
        });
        
        // Innate Energy with current/max display
        if (innateEnergyMax > 0) {
            const energyDisplay = document.createElement('div');
            energyDisplay.className = 'innate-stat-chip';
            energyDisplay.style.cssText = `
                background: var(--bg-medium);
                color: var(--primary-dark);
                border-radius: 6px;
                padding: 4px 10px;
                font-weight: 600;
                font-size: 0.85em;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            const energyColor = innateEnergyCurrent < 0 ? 'var(--error-color, #dc3545)' : 'var(--primary-blue)';
            energyDisplay.innerHTML = `
                <span style="color: var(--text-secondary); font-weight: 500;">Energy:</span>
                <span class="innate-energy-display">
                    <span class="innate-energy-current" style="color: ${energyColor}; font-weight: 700;">${innateEnergyCurrent}</span>
                    <span class="innate-energy-separator" style="color: var(--text-secondary);">/</span>
                    <span class="innate-energy-max" style="color: var(--primary-blue); font-weight: 700;">${innateEnergyMax}</span>
                </span>
            `;
            rightControls.appendChild(energyDisplay);
        }
    }
    
    // Add Power button
    const addBtn = document.createElement('button');
    addBtn.className = 'resource-add-btn';
    addBtn.innerHTML = '+ Add Power';
    addBtn.onclick = () => window.showPowerModal?.();
    rightControls.appendChild(addBtn);
    
    innateHeader.appendChild(rightControls);
    content.appendChild(innateHeader);

    // Column headers for innate powers (with Innate checkbox column in edit mode)
    const innateTableHeader = document.createElement('div');
    innateTableHeader.className = 'library-table-header tech';
    if (isEditMode) {
        innateTableHeader.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.5fr';
        innateTableHeader.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div><div>INNATE</div>';
    } else {
        innateTableHeader.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr';
        innateTableHeader.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div>';
    }
    content.appendChild(innateTableHeader);

    // Render innate powers
    if (innatePowers.length > 0) {
        innatePowers.forEach(power => {
            const row = createPowerRow(power, isEditMode, true);
            content.appendChild(row);
        });
    } else {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center;color:var(--text-secondary);padding:12px;font-size:13px;';
        emptyMsg.textContent = 'No innate powers selected';
        content.appendChild(emptyMsg);
    }

    // === REGULAR POWERS SECTION ===
    const regularHeader = document.createElement('div');
    regularHeader.className = 'powers-section-header';
    regularHeader.innerHTML = '<h4>POWERS</h4>';
    regularHeader.style.marginTop = '24px';
    content.appendChild(regularHeader);

    // Column headers for regular powers
    const regularTableHeader = document.createElement('div');
    regularTableHeader.className = 'library-table-header tech';
    if (isEditMode) {
        regularTableHeader.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.5fr';
        regularTableHeader.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div><div>INNATE</div>';
    } else {
        regularTableHeader.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr';
        regularTableHeader.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div>';
    }
    content.appendChild(regularTableHeader);

    // Render regular powers
    if (regularPowers.length > 0) {
        regularPowers.forEach(power => {
            const row = createPowerRow(power, isEditMode, false);
            content.appendChild(row);
        });
    } else {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center;color:var(--text-secondary);padding:12px;font-size:13px;';
        emptyMsg.textContent = 'No regular powers selected';
        content.appendChild(emptyMsg);
    }

    return content;
}

/**
 * Creates a power row element
 * @param {object} power - Power data
 * @param {boolean} isEditMode - Whether in edit mode
 * @param {boolean} isInnate - Whether this power is innate
 * @returns {HTMLElement} The power row element
 */
function createPowerRow(power, isEditMode, isInnate) {
    // Build chips with blue highlight for TP cost
    let chipsHTML = '';
    if (Array.isArray(power.parts) && power.parts.length && power.partsDb) {
        chipsHTML = buildTechniquePartChips(power.parts, power.partsDb);
    } else if (power.partChipsHTML) {
        chipsHTML = power.partChipsHTML;
    }

    const damageStr = formatPowerDamage(power.damage);
    const expandedContent = chipsHTML ? `
        <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
        <div class="part-chips">${chipsHTML}</div>
    ` : '';

    const gridCols = isEditMode ? '1.4fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.5fr' : '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr';

    // For innate powers, the "Use" button just shows energy cost but doesn't deduct energy
    const actionButtonConfig = isInnate ? {
        label: `Use (${power.energy || 0})`,
        data: { name: power.name, energy: 0, innate: 'true' }, // energy 0 means no deduction
        onClick: (e) => {
            const name = e.target.dataset.name;
            // Innate powers don't cost energy - just show notification
            if (typeof window.showNotification === 'function') {
                window.showNotification(`Used innate power: ${name}`, 'info');
            }
        }
    } : {
        label: `Use (${power.energy || 0})`,
        data: { name: power.name, energy: power.energy || 0 },
        onClick: (e) => {
            const energy = parseInt(e.target.dataset.energy);
            const name = e.target.dataset.name;
            window.usePower(name, energy);
        }
    };

    const row = new CollapsibleRow({
        title: power.name,
        columns: [
            { content: power.actionType || 'Basic Action' },
            { content: damageStr || '-' }
        ],
        description: power.description || '',
        className: 'collapsible-tech',
        gridColumns: gridCols,
        actionButton: actionButtonConfig,
        expandedContent: expandedContent
    });

    // Add additional columns for area and duration
    const collapsedRow = row.element.querySelector('.collapsed-row');
    const areaDiv = document.createElement('div');
    areaDiv.textContent = power.area || '-';
    const durationDiv = document.createElement('div');
    durationDiv.textContent = power.duration || '-';
    collapsedRow.appendChild(areaDiv);
    collapsedRow.appendChild(durationDiv);

    // Add innate checkbox in edit mode
    if (isEditMode) {
        const innateCell = document.createElement('div');
        innateCell.className = 'innate-checkbox-cell';
        innateCell.style.cssText = 'display: flex; align-items: center; justify-content: center;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'innate-checkbox';
        checkbox.checked = isInnate;
        checkbox.title = isInnate ? 'Unmark as innate power' : 'Mark as innate power';
        checkbox.onclick = (e) => {
            e.stopPropagation();
            window.togglePowerInnate?.(power.name, e.target.checked);
        };
        
        innateCell.appendChild(checkbox);
        collapsedRow.appendChild(innateCell);
    }

    // Add remove button in edit mode
    if (isEditMode) {
        collapsedRow.style.position = 'relative';
        const removeBtn = document.createElement('button');
        removeBtn.className = 'resource-remove-btn';
        removeBtn.innerHTML = '✕';
        removeBtn.title = 'Remove power';
        removeBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 8px;font-size:0.9em;background:var(--error-color, #dc3545);color:white;border:none;border-radius:4px;cursor:pointer;z-index:10;';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Remove "${power.name}" power?`)) {
                window.removePowerFromCharacter(encodeURIComponent(power.name));
            }
        };
        collapsedRow.appendChild(removeBtn);
    }

    row.element.style.marginBottom = '10px';
    return row.element;
}
