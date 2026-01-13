import { sanitizeId } from '../../utils.js';
import { CollapsibleRow, createCollapsibleSection } from '../shared/collapsible-row.js';
import { getCharacterResourceTracking } from '../../validation.js';

/**
 * Creates a collapsible row for a trait.
 * @param {object|string} trait - Trait data or trait name
 * @param {string} type - Type of trait ('ancestry', 'flaw', 'characteristic', etc.)
 * @param {object} allTraits - Global traits data object
 * @param {object} charData - Character data
 * @returns {HTMLElement} The trait row element
 */
function createTraitRow(trait, type, allTraits, charData) {
    // Get trait object from allTraits if available
    let traitObj = trait;
    if (allTraits && trait.name) {
        const tObj = allTraits[sanitizeId(trait.name)];
        if (tObj) traitObj = { ...tObj, ...trait };
    }

    // Determine subtext/type
    let subtext = '';
    if (typeof traitObj.flaw === 'boolean' && traitObj.flaw) subtext = 'Flaw';
    else if (typeof traitObj.characteristic === 'boolean' && traitObj.characteristic) subtext = 'Characteristic';
    else if (type === 'ancestry') subtext = 'Ancestry Trait';
    else if (type === 'flaw') subtext = 'Flaw';
    else if (type === 'characteristic') subtext = 'Characteristic';

    // Description
    let desc = traitObj.desc || traitObj.description || '';
    if (!desc || desc === 'No description') desc = 'No description available.';

    // Uses/recovery
    const maxUses = traitObj.uses_per_rec || 0;
    const recPeriod = traitObj.rec_period || '';
    
    // Find currentUses for this trait in charData
    let currentUses = maxUses;
    if (charData && Array.isArray(charData.traits)) {
        const found = charData.traits.find(t =>
            (typeof t === 'object' && t.name === traitObj.name && typeof t.currentUses === 'number')
        );
        if (found) currentUses = found.currentUses;
    }

    const row = new CollapsibleRow({
        title: traitObj.name,
        subtext: subtext,
        description: desc,
        className: 'collapsible-feat',
        uses: maxUses ? { current: currentUses, max: maxUses, recovery: recPeriod || 'Full Recovery' } : null,
        onUse: maxUses ? (delta) => window.changeTraitUses(traitObj.name, delta, charData, maxUses) : null
    });

    return row.element;
}

/**
 * Creates a collapsible row for a feat.
 * @param {object} f - Feat data object
 * @param {string} featType - 'archetype' or 'character' for remove functionality
 * @returns {HTMLElement} The feat row element
 */
function createFeatRow(f, featType = 'archetype') {
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Check if this feat has unmet requirements (stored as object with unmetRequirements flag)
    const hasUnmetRequirements = f.unmetRequirements === true;
    
    const row = new CollapsibleRow({
        title: f.name,
        description: f.description || 'No description available.',
        className: `collapsible-feat${hasUnmetRequirements ? ' unmet-requirements' : ''}`,
        uses: f.uses ? { current: f.currentUses ?? f.uses, max: f.uses, recovery: f.recovery || 'Full Recovery' } : null,
        onUse: f.uses ? (delta) => window.changeFeatUses(f.name, delta) : null
    });
    
    // Add red border styling for unmet requirements
    if (hasUnmetRequirements) {
        row.element.style.cssText = 'border: 2px solid var(--danger-red, #dc3545); border-radius: 8px; margin-bottom: 4px;';
        // Add warning indicator to header
        const header = row.element.querySelector('.collapsed-row');
        if (header) {
            const warningBadge = document.createElement('span');
            warningBadge.className = 'unmet-requirements-badge';
            warningBadge.innerHTML = '⚠️';
            warningBadge.title = 'Requirements not met';
            warningBadge.style.cssText = 'margin-left: 8px; font-size: 14px;';
            const titleEl = header.querySelector('.collapsed-row-title');
            if (titleEl) titleEl.appendChild(warningBadge);
        }
    }

    // Add remove button in edit mode
    if (isEditMode) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'feat-remove-btn small-button';
        removeBtn.innerHTML = '✕';
        removeBtn.title = 'Remove feat';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Remove "${f.name}" feat?`)) {
                window.removeFeatFromCharacter(encodeURIComponent(f.name), featType);
            }
        };
        
        // Insert remove button into the row header (collapsed-row is the actual header element)
        const header = row.element.querySelector('.collapsed-row');
        if (header) {
            header.style.position = 'relative';
            removeBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 8px;font-size:0.9em;background:var(--error-color, #dc3545);color:white;border:none;border-radius:4px;cursor:pointer;z-index:10;';
            header.appendChild(removeBtn);
        }
    }

    return row.element;
}

/**
 * Adds edit controls (pencil icon and add button) to a feat section header.
 * @param {HTMLElement} section - The section element
 * @param {string} featType - 'archetype' or 'character'
 * @param {object} tracking - { max, current, remaining } from resource tracking
 */
function addFeatEditControls(section, featType, tracking) {
    const header = section.querySelector('.section-header');
    if (!header) return;
    
    // Create edit controls container
    const editControls = document.createElement('div');
    editControls.className = 'feat-edit-controls';
    editControls.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;';
    
    // Slots remaining indicator - three states
    let indicatorClass;
    if (tracking.remaining < 0) {
        indicatorClass = 'points-over-budget';
    } else if (tracking.remaining > 0) {
        indicatorClass = 'points-available';
    } else {
        indicatorClass = 'points-complete';
    }
    
    const slotsIndicator = document.createElement('span');
    slotsIndicator.className = `feat-slots-indicator ${indicatorClass}`;
    slotsIndicator.textContent = `${tracking.current}/${tracking.max}`;
    slotsIndicator.title = tracking.remaining >= 0 ? `${tracking.remaining} slots remaining` : `${Math.abs(tracking.remaining)} over limit`;
    
    // Add Feat button - three color states
    let buttonClass;
    if (tracking.remaining < 0) {
        buttonClass = 'btn-red';
    } else if (tracking.remaining > 0) {
        buttonClass = 'btn-green';
    } else {
        buttonClass = 'btn-blue';
    }
    
    const addBtn = document.createElement('button');
    addBtn.className = `resource-add-btn ${buttonClass}`;
    addBtn.innerHTML = '+ Add';
    addBtn.title = tracking.remaining > 0 ? `Add ${featType} feat (${tracking.remaining} slots available)` : 
                   tracking.remaining === 0 ? 'All slots filled' : 
                   `Over limit by ${Math.abs(tracking.remaining)}`;
    addBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.showFeatModal) {
            window.showFeatModal(featType);
        }
    };
    
    editControls.appendChild(slotsIndicator);
    editControls.appendChild(addBtn);
    
    // Insert before the count span
    const countSpan = header.querySelector('.section-count');
    if (countSpan) {
        header.insertBefore(editControls, countSpan);
    } else {
        header.appendChild(editControls);
    }
}

/**
 * Creates the feats tab content with organized sections.
 * Displays traits (ancestry, flaw, characteristic) and feats (archetype, character, state).
 * @param {Array} feats - Array of feat objects
 * @param {object} charData - Character data object
 * @returns {HTMLElement} The feats content container
 */
export function createFeatsContent(feats, charData = {}) {
    // --- Split feats into sections ---
    // Traits: from charData.traits (array of trait names or objects), and ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    // Feats: archetype feats, character feats, state feats
    // If charData is not passed, try window.currentCharacterData?.()
    if (!charData || Object.keys(charData).length === 0) {
        charData = window.currentCharacterData?.() || {};
    }

    // --- Traits Section ---
    // Collect all traits with their type
    const traitRows = [];
    let allTraits = (window.allTraits && typeof window.allTraits === 'object') ? window.allTraits : (charData.allTraits || {});

    // Ancestry traits
    if (Array.isArray(charData.traits)) {
        charData.traits.forEach(nameOrObj => {
            let name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
            // Try to infer type from charData fields
            let type = '';
            if (charData.ancestryTraits && charData.ancestryTraits.includes(name)) type = 'ancestry';
            else if (charData.flawTrait && charData.flawTrait === name) type = 'flaw';
            else if (charData.characteristicTrait && charData.characteristicTrait === name) type = 'characteristic';
            // No subtext for species traits
            traitRows.push(createTraitRow({ name }, type, allTraits, charData));
        });
    }
    // If not present, try ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    if (!traitRows.length) {
        const tryAddTrait = (name, type) => {
            if (name) traitRows.push(createTraitRow({ name }, type, allTraits, charData));
        };
        tryAddTrait(charData.flawTrait, 'flaw');
        tryAddTrait(charData.characteristicTrait, 'characteristic');
        if (Array.isArray(charData.ancestryTraits)) {
            charData.ancestryTraits.forEach(name => tryAddTrait(name, 'ancestry'));
        }
        if (Array.isArray(charData.speciesTraits)) {
            charData.speciesTraits.forEach(name => tryAddTrait(name, ''));
        }
    }

    // --- Feats Section ---
    // Sort feats into state, character, archetype
    const stateFeats = [];
    const characterFeats = [];
    const archetypeFeats = [];
    feats.forEach(f => {
        if (f.state_feat === true) {
            stateFeats.push(f);
        } else if (f.char_feat === true) {
            characterFeats.push(f);
        } else {
            archetypeFeats.push(f);
        }
    });

    // Check edit mode and get resource tracking
    const isEditMode = document.body.classList.contains('edit-mode');
    const tracking = getCharacterResourceTracking(charData);

    // --- Build sections ---
    const sections = [];

    // Traits section (always open)
    sections.push(createCollapsibleSection('Traits', traitRows.length, traitRows, true));

    // Archetype feats section with edit controls
    const archetypeFeatRows = archetypeFeats.map(f => createFeatRow(f, 'archetype'));
    const archetypeSection = createCollapsibleSection('Archetype Feats', archetypeFeats.length, archetypeFeatRows, true);
    
    if (isEditMode) {
        addFeatEditControls(archetypeSection, 'archetype', tracking.feats.archetype);
    }
    sections.push(archetypeSection);

    // Character feats section with edit controls
    const characterFeatRows = characterFeats.map(f => createFeatRow(f, 'character'));
    const characterSection = createCollapsibleSection('Character Feats', characterFeats.length, characterFeatRows, true);
    
    if (isEditMode) {
        addFeatEditControls(characterSection, 'character', tracking.feats.character);
    }
    sections.push(characterSection);

    // State feats
    sections.push(createCollapsibleSection('State Feats', stateFeats.length, stateFeats.map(f => createFeatRow(f, 'state')), true));

    // --- Compose content ---
    const content = document.createElement('div');
    content.id = 'feats-content';
    content.className = 'tab-content active';
    if (sections.every(sec => sec.querySelector('.section-body').children.length === 0)) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No feats or traits selected</p>';
        return content;
    }
    sections.forEach(sec => content.appendChild(sec));
    return content;
}
