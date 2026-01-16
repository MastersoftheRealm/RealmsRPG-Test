export function createNotesContent(charData) {
    const content = document.createElement('div');
    content.id = 'notes-content';
    content.className = 'tab-content';

    const appearance = charData?.appearance || '';
    const archetypeDesc = charData?.archetypeDesc || '';
    const notes = charData?.notes || '';

    // Physical attributes and calculations
    const weight = Number(charData?.weight) || 70; // kg
    const height = Number(charData?.height) || 170; // cm
    const isEditMode = document.body.classList.contains('edit-mode');

    // Get abilities for movement calculations
    const abilities = charData?.abilities || {};
    const strength = Number(abilities.strength) || 0;
    const agility = Number(abilities.agility) || 0;
    const vitality = Number(abilities.vitality) || 0;

    // Helpers
    const pluralize = (n, s, p) => (n === 1 ? `${n} ${s}` : `${n} ${p}`);
    const upMin1 = v => Math.max(1, Math.ceil(v));

    // Calculate movement values (round up, minimum 1)
    const jumpHorizontal = upMin1(Math.max(strength, agility));
    const jumpVertical = upMin1(Math.max(strength, agility) / 2);
    const climbSpeed = upMin1(strength / 2);
    const swimSpeed = upMin1(Math.max(strength, vitality) / 2);

    // Calculate fall damage
    const weightCategory = Math.max(200, Math.ceil(weight / 200) * 200);
    const fallDiceCount = Math.min(Math.ceil(weight / 200) || 1, 4); // 1..4

    // Build roll button html for dice
    const rollBtn = (diceStr) => `<button class="dice-roll-btn" type="button" onclick="window.rollDamage('${diceStr}')">${diceStr}</button>`;

    // Build weight and height HTML with edit capability
    let weightHtml = isEditMode
        ? `<span class="editable-field" id="weight-display">${weight} kg</span>
           <span class="edit-icon" data-edit="weight" title="Edit weight">🖉</span>`
        : `${weight} kg`;

    let heightHtml = isEditMode
        ? `<span class="editable-field" id="height-display">${height} cm</span>
           <span class="edit-icon" data-edit="height" title="Edit height">🖉</span>`
        : `${height} cm`;

    // Compose fall damage display: clickable dice + description
    const fallDiceStr = `${fallDiceCount}d4`;
    const fallDesc = `${fallDiceStr} bludgeoning per 2 spaces fallen (${weightCategory}kg weight category)`;

    content.innerHTML = `
        <label class="notes-label">PHYSICAL ATTRIBUTES & MOVEMENT</label>
        <div class="notes-section physical-attributes">
            <div class="physical-stats-grid">
                <div class="physical-stat">
                    <span class="stat-label">Weight:</span>
                    <span class="stat-value">${weightHtml}</span>
                </div>
                <div class="physical-stat">
                    <span class="stat-label">Height:</span>
                    <span class="stat-value">${heightHtml}</span>
                </div>
                <div class="physical-stat">
                    <span class="stat-label">Jump - Horizontal:</span>
                    <span class="stat-value">${pluralize(jumpHorizontal, 'space', 'spaces')}</span>
                </div>
                <div class="physical-stat">
                    <span class="stat-label">Jump - Vertical:</span>
                    <span class="stat-value">${pluralize(jumpVertical, 'space', 'spaces')}</span>
                </div>
                <div class="physical-stat">
                    <span class="stat-label">Climb Speed:</span>
                    <span class="stat-value">
                        ${pluralize(climbSpeed, 'space', 'spaces')}
                        <div class="subtext">Requires successful Athletics roll</div>
                    </span>
                </div>
                <div class="physical-stat">
                    <span class="stat-label">Swim Speed:</span>
                    <span class="stat-value">
                        ${pluralize(swimSpeed, 'space', 'spaces')}
                        <div class="subtext">Requires successful DC 10 Acrobatics or Athletics (Vitality) roll</div>
                    </span>
                </div>
                <div class="physical-stat fall-damage">
                    <span class="stat-label">Fall Damage:</span>
                    <span class="stat-value">
                        ${rollBtn(fallDiceStr)} bludgeoning per 2 spaces fallen
                    </span>
                </div>
            </div>
        </div>
        <div class="notes-section">
            <label class="notes-label">APPEARANCE</label>
            <textarea id="character-appearance" class="notes-textarea" placeholder="Describe your character's appearance...">${appearance}</textarea>
        </div>
        <div class="notes-section">
            <label class="notes-label">ARCHETYPE DESCRIPTION</label>
            <textarea id="character-archetype-desc" class="notes-textarea" placeholder="Describe your character's archetype background...">${archetypeDesc}</textarea>
        </div>
        <div class="notes-section">
            <label class="notes-label">NOTES</label>
            <textarea id="character-notes" class="notes-textarea notes-main" placeholder="Additional notes, backstory, goals...">${notes}</textarea>
        </div>

        <style>
        .physical-attributes {
            background: var(--bg-surface, #ffffff);
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 10px;
            margin-bottom: 14px;
            box-shadow: 0 1px 2px rgba(16,24,40,0.03);
        }

        .physical-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 10px;
            padding: 12px 14px;
        }

        .physical-stat {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px 6px;
            background: transparent;
        }

        .physical-stat > .stat-label {
            font-weight: 700;
            color: var(--text-primary, #111827);
            font-size: 13px;
        }

        .physical-stat > .stat-value {
            color: var(--text-secondary, #6b7280);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .subtext {
            font-size: 12px;
            color: var(--text-muted, #9ca3af);
            margin-top: 4px;
        }

        .fall-damage .stat-value { align-items: center; }

        .dice-roll-btn {
            background: linear-gradient(180deg,#f8fafc,#eef2ff);
            border: 1px solid rgba(59,130,246,0.18);
            color: #0f172a;
            padding: 6px 10px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(2,6,23,0.04);
        }

        .dice-roll-btn:hover { transform: translateY(-1px); }

        .fd-text { margin-left: 6px; color: var(--text-secondary, #6b7280); }

        .editable-field { cursor: pointer; padding: 2px 6px; border-radius: 6px; }
        .edit-icon { color: #2563eb; cursor: pointer; margin-left:6px; }

        .editable-input { border: 1px solid #2563eb !important; padding: 2px 6px !important; border-radius: 6px !important; background:#fff; }
        </style>
    `;
    
    // Setup autosave on blur (tab change) and on Enter for single-line feel
    setTimeout(() => {
        const appearanceEl = document.getElementById('character-appearance');
        const archetypeDescEl = document.getElementById('character-archetype-desc');
        const notesEl = document.getElementById('character-notes');
        
        const saveField = (field, value) => {
            const charData = typeof window.currentCharacterData === 'function' 
                ? window.currentCharacterData() 
                : window.currentCharacterData;
            if (!charData) return;
            charData[field] = value;
            if (window.scheduleAutoSave) window.scheduleAutoSave();
        };
        
        // Setup editable weight field
        if (isEditMode) {
            const weightEditIcon = content.querySelector('.edit-icon[data-edit="weight"]');
            const weightDisplay = content.querySelector('#weight-display');
            
            if (weightEditIcon && weightDisplay) {
                weightEditIcon.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.value = parseFloat(weightDisplay.textContent) || 70;
                    input.className = 'editable-input';
                    input.min = '1';
                    input.step = '0.1';
                    input.style.width = '80px';
                    
                    weightDisplay.replaceWith(input);
                    input.focus();
                    input.select();
                    
                    let saved = false;
                    const saveWeightChange = () => {
                        if (saved) return;
                        saved = true;
                        const newValue = parseFloat(input.value) || 70;
                        charData.weight = newValue;
                        window.scheduleAutoSave();
                        // Create new display span
                        const newDisplay = document.createElement('span');
                        newDisplay.className = 'editable-field';
                        newDisplay.id = 'weight-display';
                        newDisplay.textContent = `${newValue} kg`;
                        input.replaceWith(newDisplay);
                    };
                    
                    input.addEventListener('blur', saveWeightChange);
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            input.blur();
                        }
                    });
                });
            }
            
            // Setup editable height field
            const heightEditIcon = content.querySelector('.edit-icon[data-edit="height"]');
            const heightDisplay = content.querySelector('#height-display');
            
            if (heightEditIcon && heightDisplay) {
                heightEditIcon.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.value = parseFloat(heightDisplay.textContent) || 170;
                    input.className = 'editable-input';
                    input.min = '1';
                    input.step = '1';
                    input.style.width = '80px';
                    
                    heightDisplay.replaceWith(input);
                    input.focus();
                    input.select();
                    
                    let saved = false;
                    const saveHeightChange = () => {
                        if (saved) return;
                        saved = true;
                        const newValue = parseFloat(input.value) || 170;
                        charData.height = newValue;
                        window.scheduleAutoSave();
                        // Create new display span
                        const newDisplay = document.createElement('span');
                        newDisplay.className = 'editable-field';
                        newDisplay.id = 'height-display';
                        newDisplay.textContent = `${newValue} cm`;
                        input.replaceWith(newDisplay);
                    };
                    
                    input.addEventListener('blur', saveHeightChange);
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            input.blur();
                        }
                    });
                });
            }
        }
        
        if (appearanceEl) {
            appearanceEl.addEventListener('blur', () => saveField('appearance', appearanceEl.value));
            appearanceEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveField('appearance', appearanceEl.value);
                    appearanceEl.blur();
                }
            });
        }
        
        if (archetypeDescEl) {
            archetypeDescEl.addEventListener('blur', () => saveField('archetypeDesc', archetypeDescEl.value));
            archetypeDescEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveField('archetypeDesc', archetypeDescEl.value);
                    archetypeDescEl.blur();
                }
            });
        }
        
        if (notesEl) {
            notesEl.addEventListener('blur', () => saveField('notes', notesEl.value));
            // Notes can be multi-line, so only save on blur, not Enter
        }
    }, 0);
    
    return content;
}
