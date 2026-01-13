import { buildPropertyChips } from './techniques.js';
import { fetchItemProperties } from '../../../core/rtdb-cache.js';

function computePropertyTotals(itemProps, catalog) {
    let ip = 0, tp = 0, c = 0;
    const displayNames = [];
    (itemProps || []).forEach(ref => {
        // ref may be string OR object {id/name, op_1_lvl}
        const id = (ref && (ref.id || ref.name)) ? (ref.id || ref.name) : ref;
        const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
        const found = catalog.find(pp => pp.id === id || pp.name === id);
        if (!found) {
            if (typeof id === 'string') displayNames.push(id);
            return;
        }
        ip += found.base_ip + (found.op_1_ip * lvl);
        tp += found.base_tp + (found.op_1_tp * lvl);
        c  += found.base_c  + (found.op_1_c  * lvl);
        displayNames.push(lvl > 0 ? `${found.name} (Lvl ${lvl})` : found.name);
    });
    return { ip, tp, c, displayNames };
}

function deriveRange(itemProps, catalog) {
    const ref = (itemProps || []).find(r => {
        const nm = r && (r.name || r.id) ? (r.name || r.id) : r;
        return nm === 'Range';
    });
    if (!ref) return 'Melee';
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    // Base 8 spaces + 8 per level (matches creator logic)
    return `${8 + lvl * 8} spaces`;
}

function deriveDamageReduction(itemProps, catalog) {
    const ref = (itemProps || []).find(r => {
        const nm = r && (r.name || r.id) ? (r.name || r.id) : r;
        return nm === 'Damage Reduction';
    });
    if (!ref) return 0;
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    return 1 + lvl;
}

function buildDamageString(dmgArr) {
    if (!Array.isArray(dmgArr)) return '-';
    const usable = dmgArr.filter(d => d && d.amount && d.size && d.type && d.type !== 'none');
    if (!usable.length) return '-';
    // Show type after dice, capitalized (e.g., "1d6 Slashing")
    return usable.map(d => `${d.amount}d${d.size} ${capitalizeDamageType(d.type)}`).join(', ');
}

// Helper for capitalizing damage type
function capitalizeDamageType(type) {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// REPLACED createInventoryContent with enriched calculations
export async function createInventoryContent(inventoryObj) {
    // Ensure properties cache is loaded before rendering
    const itemPropertiesCache = await fetchItemProperties();
    const content = document.createElement('div');
    content.id = 'inventory-content';
    content.className = 'tab-content';

    // --- Currency and Armament Proficiency boxes are created here, but appended to parent after tab activation ---
    content._topBoxes = (() => {
        const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
        let currency = charData?.currency ?? 0;
        
        // Calculate armament proficiency using level progression
        let armamentProficiency = 3; // default
        if (typeof window.calculateArchetypeProgression === 'function') {
            const progression = window.calculateArchetypeProgression(
                charData?.level || 1,
                charData?.mart_prof || 0,
                charData?.pow_prof || 0,
                charData?.archetypeChoices || {}
            );
            armamentProficiency = progression.armamentProficiency;
        } else {
            // Fallback calculation if function not available
            const martialProf = charData?.mart_prof || 0;
            if (martialProf === 0) armamentProficiency = 3;
            else if (martialProf === 1) armamentProficiency = 8;
            else if (martialProf === 2) armamentProficiency = 12;
            else armamentProficiency = 12 + (3 * (martialProf - 2));
        }

        const topBoxesContainer = document.createElement('div');
        topBoxesContainer.className = 'inventory-top-boxes';
        topBoxesContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            margin-bottom: 10px;
        `;

        // Armament Proficiency Box
        const armamentBox = document.createElement('div');
        armamentBox.style.cssText = `
            background: var(--bg-medium);
            color: var(--primary-dark);
            border-radius: 7px;
            padding: 6px 14px;
            font-weight: 700;
            font-size: 0.98em;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            letter-spacing: 0.2px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        armamentBox.innerHTML = `
            ARMAMENT PROFICIENCY:
            <span style="
                color: var(--primary-blue);
                font-weight: 700;
            ">${armamentProficiency}</span>
        `;

        // Currency Box
        const currencyBox = document.createElement('div');
        currencyBox.style.cssText = `
            background: var(--bg-medium);
            color: var(--primary-dark);
            border-radius: 7px;
            padding: 6px 14px;
            font-weight: 700;
            font-size: 0.98em;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            letter-spacing: 0.2px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        currencyBox.innerHTML = `
            CURRENCY:
            <input
                id="inventory-currency-input"
                type="text"
                inputmode="numeric"
                pattern="[0-9+-]*"
                value="${currency}"
                style="
                    width: 54px;
                    font-size: 1em;
                    font-weight: 700;
                    color: var(--primary-blue);
                    background: #fff;
                    border: 1px solid var(--border-color);
                    border-radius: 5px;
                    padding: 2px 6px;
                    text-align: right;
                    margin-left: 4px;
                    transition: border-color 0.2s;
                "
                title="Click to edit. Use +5, -5, or a number."
            >
        `;

        topBoxesContainer.appendChild(armamentBox);
        topBoxesContainer.appendChild(currencyBox);
        
        // --- Add logic for editing currency ---
        setTimeout(() => {
            const input = topBoxesContainer.querySelector('#inventory-currency-input');
            if (!input) return;
            input.addEventListener('focus', e => {
                setTimeout(() => input.select(), 1);
            });
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const raw = input.value.trim();
                    let currentVal = parseInt(charData?.currency) || 0;
                    let newValue;
                    if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                    else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                    else newValue = parseInt(raw) || 0;
                    newValue = Math.max(0, newValue);
                    input.value = newValue;
                    if (charData) {
                        charData.currency = newValue;
                        window.scheduleAutoSave?.();
                    }
                }
            });
            input.addEventListener('blur', () => {
                // Reset to current value if not changed
                input.value = (charData?.currency ?? 0);
            });
        }, 50);

        return topBoxesContainer;
    })();

    // Don't append currencyBox here; it will be inserted on tab activation

    // Accept inventoryObj: { weapons, armor, equipment }
    // --- FILTER OUT Unarmed Prowess from weapons and remove string entries ---
    const weapons = (Array.isArray(inventoryObj.weapons) ? inventoryObj.weapons : []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
    // --- FILTER OUT string entries from armor (legacy data) ---
    const armor = (Array.isArray(inventoryObj.armor) ? inventoryObj.armor : []).filter(a => {
        return typeof a === 'object' && a !== null;
    });
    const equipment = Array.isArray(inventoryObj.equipment) ? inventoryObj.equipment : [];
    
    const isEditMode = document.body.classList.contains('edit-mode');

    if (!weapons.length && !armor.length && !equipment.length && !isEditMode) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No items in inventory</p>';
        return content;
    }

    // Weapons Section
    const weaponsTitle = document.createElement('div');
    weaponsTitle.className = 'library-section-header';
    weaponsTitle.innerHTML = `
        <h3>WEAPONS</h3>
        <button class="resource-add-btn" onclick="window.showWeaponModal()">+ Add Weapon</button>
    `;
    content.appendChild(weaponsTitle);

    if (weapons.length) {
        const header = document.createElement('div');
        header.className = 'library-table-header';
        header.style.gridTemplateColumns = '1.8fr 1fr 1fr 0.6fr 0.9fr 0.9fr 0.7fr 40px';
        header.innerHTML = '<div>NAME</div><div>DAMAGE</div><div>RANGE</div><div>TP</div><div>CURRENCY</div><div>RARITY</div><div>EQUIPPED</div><div class="edit-mode-only"></div>';
        content.appendChild(header);

        weapons.forEach((w, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-tech';
            wrapper.style.marginBottom = '8px';
            wrapper.innerHTML = `
              <div class="collapsed-row" style="grid-template-columns:1.8fr 1fr 1fr 0.6fr 0.9fr 0.9fr 0.7fr 40px;">
                <div><strong>${w.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                <div>${w.damage || '-'}</div>
                <div>${w.range || 'Melee'}</div>
                <div>${w.totalTP || 0}</div>
                <div>${Math.ceil(w.currencyCost || 0)}</div>
                <div>${w.rarity || 'Common'}</div>
                <div style="text-align:center;"><input type="checkbox" class="equipped-checkbox" data-type="weapon" data-index="${idx}" ${w.equipped ? 'checked' : ''}></div>
                <div style="text-align:center;"><button class="resource-remove-btn" onclick="event.stopPropagation(); if(confirm('Remove ${w.name}?')) window.removeWeaponFromCharacter('${encodeURIComponent(w.name)}')">✕</button></div>
              </div>
              <div class="expanded-body">
                ${w.description ? `<p style="margin:0 0 10px;">${w.description}</p>` : ''}
                ${w.proficiencies && w.proficiencies.length > 0 ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  <div class="part-chips">
                    ${buildPropertyChips(w.proficiencies.map(p => ({ name: p.name, op_1_lvl: p.level || 0 })), itemPropertiesCache)}
                  </div>
                ` : ''}
              </div>
            `;
            wrapper.querySelector('.collapsed-row').addEventListener('click', e => {
                if (e.target.type === 'checkbox') return;
                wrapper.classList.toggle('open');
                const ind = wrapper.querySelector('.expand-indicator');
                if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
            });
            wrapper.querySelector('.equipped-checkbox').addEventListener('change', e => {
                weapons[idx].equipped = e.target.checked;
                const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                if (charData?.weapons && charData.weapons[idx]) charData.weapons[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
            });
            content.appendChild(wrapper);
        });
    }

    // Armor Section
    const armorTitle = document.createElement('div');
    armorTitle.className = 'library-section-header';
    armorTitle.style.marginTop = '24px';
    armorTitle.innerHTML = `
        <h3>ARMOR</h3>
        <button class="resource-add-btn" onclick="window.showArmorModal()">+ Add Armor</button>
    `;
    content.appendChild(armorTitle);

    if (armor.length) {
        const header = document.createElement('div');
        header.className = 'library-table-header';
        header.style.gridTemplateColumns = '2fr 0.9fr 0.6fr 0.9fr 0.9fr 0.7fr 40px';
        header.innerHTML = '<div>NAME</div><div>DMG RED.</div><div>TP</div><div>CURRENCY</div><div>RARITY</div><div>EQUIPPED</div><div class="edit-mode-only"></div>';
        content.appendChild(header);

        armor.forEach((a, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-tech';
            wrapper.style.marginBottom = '8px';
            wrapper.innerHTML = `
              <div class="collapsed-row" style="grid-template-columns:2fr 0.9fr 0.6fr 0.9fr 0.9fr 0.7fr 40px;">
                <div><strong>${a.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                <div>${a.damageReduction ?? 0}</div>
                <div>${a.totalTP || 0}</div>
                <div>${Math.ceil(a.currencyCost || 0)}</div>
                <div>${a.rarity || 'Common'}</div>
                <div style="text-align:center;"><input type="checkbox" class="equipped-checkbox" data-type="armor" data-index="${idx}" ${a.equipped ? 'checked' : ''}></div>
                <div style="text-align:center;"><button class="resource-remove-btn" onclick="event.stopPropagation(); if(confirm('Remove ${a.name}?')) window.removeArmorFromCharacter('${encodeURIComponent(a.name)}')">✕</button></div>
              </div>
              <div class="expanded-body">
                ${a.description ? `<p style="margin:0 0 10px;">${a.description}</p>` : ''}
                ${a.proficiencies && a.proficiencies.length > 0 ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  <div class="part-chips">
                    ${buildPropertyChips(a.proficiencies.map(p => ({ name: p.name, op_1_lvl: p.level || 0 })), itemPropertiesCache)}
                  </div>
                ` : ''}
              </div>
            `;
            wrapper.querySelector('.collapsed-row').addEventListener('click', e => {
                if (e.target.type === 'checkbox') return;
                wrapper.classList.toggle('open');
                const ind = wrapper.querySelector('.expand-indicator');
                if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
            });
            wrapper.querySelector('.equipped-checkbox').addEventListener('change', e => {
                armor[idx].equipped = e.target.checked;
                const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                if (charData?.armor && charData.armor[idx]) charData.armor[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
            });
            content.appendChild(wrapper);
        });
    }

    // --- General Equipment Section (always render, even if empty) ---
    {
        // Header row with "GENERAL EQUIPMENT" title and "Add Item" button on the right
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.alignItems = 'center';
        headerRow.style.margin = '24px 0 12px 0';

        // Section title
        const title = document.createElement('h3');
        title.textContent = 'GENERAL EQUIPMENT';
        title.style.cssText = 'margin:0;padding:12px;background:var(--bg-medium);border-radius:8px;font-size:14px;font-weight:700;flex:1;';
        headerRow.appendChild(title);

        // Add Item button (right side)
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Item';
        addBtn.className = 'action-button';
        addBtn.style.marginLeft = '12px';
        addBtn.onclick = () => {
            // Use global function set by main.js
            if (typeof window.showEquipmentModal === 'function') {
                window.showEquipmentModal();
            } else {
                // fallback: try to find and call showEquipmentModal from module
                try {
                    // If using module system, this should never happen, but fallback for safety
                    if (window.showEquipmentModal) window.showEquipmentModal();
                } catch (e) {
                    alert('Add Item modal not available.');
                }
            }
        };
        headerRow.appendChild(addBtn);

        content.appendChild(headerRow);

        // Table header
        const header = document.createElement('div');
        header.className = 'library-table-header';
        header.style.gridTemplateColumns = '1.5fr 2fr 1fr 0.9fr 0.8fr 1fr';
        header.innerHTML = '<div>NAME</div><div>DESCRIPTION</div><div>CATEGORY</div><div>CURRENCY</div><div>QUANTITY</div><div></div>';
        content.appendChild(header);

        // Always render the section, even if equipment is empty
        if (equipment.length === 0) {
            const empty = document.createElement('div');
            empty.style.textAlign = 'center';
            empty.style.color = 'var(--text-secondary)';
            empty.style.padding = '20px';
            empty.textContent = 'No items in inventory';
            content.appendChild(empty);
        } else {
            equipment.forEach((item, idx) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'collapsible-tech';
                wrapper.style.marginBottom = '8px';
                const truncatedDesc = (item.description || 'No description').split(/\s+/).slice(0, 12).join(' ') + '...';
                const uniqueKey = item.id || (item.name + '|' + (item.category || '') + '|' + (item.description || ''));
                const safeKey = String(uniqueKey).replace(/[^a-zA-Z0-9_-]/g, '_');
                wrapper.innerHTML = `
                  <div class="collapsed-row" style="grid-template-columns:1.5fr 2fr 1fr 0.9fr 0.8fr 1fr;">
                    <div><strong>${item.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                    <div class="truncated">${truncatedDesc}</div>
                    <div>${item.category || 'General'}</div>
                    <div>${item.currency || 0}</div>
                    <div>
                      <span class="qty-controls">
                        <button class="qty-dec" data-key="${uniqueKey}" data-safekey="${safeKey}" style="width:24px;height:24px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1em;cursor:pointer;">-</button>
                        <span class="qty-value" id="equip-qty-${safeKey}" style="display:inline-block;width:28px;text-align:center;font-size:1em;font-weight:600;background:#f7f7f7;border-radius:8px;">${item.quantity || 1}</span>
                        <button class="qty-inc" data-key="${uniqueKey}" data-safekey="${safeKey}" style="width:24px;height:24px;border-radius:50%;background:#eee;border:1px solid #ccc;font-size:1em;cursor:pointer;">+</button>
                      </span>
                    </div>
                    <div>
                      <button class="equipment-remove-btn" data-key="${uniqueKey}" title="Remove equipment" style="width:28px;height:28px;border-radius:50%;background:#fdd;border:1px solid #f99;font-size:1.1em;cursor:pointer;">×</button>
                    </div>
                  </div>
                  <div class="expanded-body">
                    ${item.description ? `<p style="margin:0;">${item.description}</p>` : ''}
                  </div>
                `;
                wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
                    if (
                        e.target.classList.contains('qty-dec') ||
                        e.target.classList.contains('qty-inc') ||
                        e.target.classList.contains('equipment-remove-btn')
                    ) return;
                    wrapper.classList.toggle('open');
                    const ind = wrapper.querySelector('.expand-indicator');
                    if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
                });

                // Quantity controls
                wrapper.querySelector('.qty-dec').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const key = e.target.dataset.key;
                    const safeKey = e.target.dataset.safekey;
                    const idxNow = equipment.findIndex(eq =>
                        (eq.id || (eq.name + '|' + (eq.category || '') + '|' + (eq.description || ''))) === key
                    );
                    if (idxNow !== -1 && equipment[idxNow].quantity > 1) {
                        equipment[idxNow].quantity--;
                        const qtyEl = wrapper.querySelector(`#equip-qty-${safeKey}`);
                        if (qtyEl) qtyEl.textContent = equipment[idxNow].quantity;
                        const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                        if (charData && Array.isArray(charData.equipment)) {
                            charData.equipment[idxNow].quantity = equipment[idxNow].quantity;
                            window.scheduleAutoSave && window.scheduleAutoSave();
                        }
                    }
                });
                wrapper.querySelector('.qty-inc').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const key = e.target.dataset.key;
                    const safeKey = e.target.dataset.safekey;
                    const idxNow = equipment.findIndex(eq =>
                        (eq.id || (eq.name + '|' + (eq.category || '') + '|' + (eq.description || ''))) === key
                    );
                    if (idxNow !== -1) {
                        equipment[idxNow].quantity = (equipment[idxNow].quantity || 1) + 1;
                        const qtyEl = wrapper.querySelector(`#equip-qty-${safeKey}`);
                        if (qtyEl) qtyEl.textContent = equipment[idxNow].quantity;
                        const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                        if (charData && Array.isArray(charData.equipment)) {
                            charData.equipment[idxNow].quantity = equipment[idxNow].quantity;
                            window.scheduleAutoSave && window.scheduleAutoSave();
                        }
                    }
                });
                wrapper.querySelector('.equipment-remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const key = e.target.dataset.key;
                    const idxNow = equipment.findIndex(eq =>
                        (eq.id || (eq.name + '|' + (eq.category || '') + '|' + (eq.description || ''))) === key
                    );
                    if (idxNow !== -1) {
                        equipment.splice(idxNow, 1);
                        const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                        if (charData && Array.isArray(charData.equipment)) {
                            charData.equipment.splice(idxNow, 1);
                            window.scheduleAutoSave && window.scheduleAutoSave();
                        }
                        wrapper.remove();
                    }
                });

                content.appendChild(wrapper);
            });
        }
    }

    return content;
}

function computeSinglePropertyTotals(ref, catalog) {
    const id = (ref && (ref.id || ref.name)) ? (ref.id || ref.name) : ref;
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    const found = catalog.find(pp => pp.id === id || pp.name === id);
    if (!found) return null;
    return {
        name: found.name,
        lvl,
        ip: found.base_ip + found.op_1_ip * lvl,
        tp: found.base_tp + found.op_1_tp * lvl,
        c: found.base_c + found.op_1_c * lvl
    };
}

function formatAbilityReq(req) {
    if (!req || typeof req !== 'object') return 'None';
    const entries = Object.entries(req);
    if (entries.length === 0) return 'None';
    return entries.map(([ability, value]) => `${value} ${ability.substring(0, 3).toUpperCase()}`).join(', ');
}
