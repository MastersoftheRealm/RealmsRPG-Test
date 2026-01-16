import { createFeatsContent } from './library/feats.js';
import { createTechniquesContent } from './library/techniques.js';
import { createPowersContent } from './library/powers.js';
import { createInventoryContent } from './library/inventory.js';
import { createProficienciesContent } from './library/proficiencies.js';
import { createNotesContent } from './library/notes.js';
import { sanitizeId } from '../utils.js';
import { enrichCharacterData } from '../utils/data-enrichment.js';

// Render guard to prevent overlapping renders
let isRendering = false;
let pendingRender = null;

export async function renderLibrary(charData) {
    const container = document.getElementById('library-section');
    if (!container) return;
    
    // If already rendering, queue this render and return
    if (isRendering) {
        pendingRender = charData;
        return;
    }
    
    isRendering = true;
    
    try {
        // Clear existing content to prevent duplicates
        container.innerHTML = '';

        const tabs = document.createElement('div');
        tabs.className = 'tabs';
        tabs.innerHTML = `
            <button class="tab active" data-tab="feats">FEATS</button>
            <button class="tab" data-tab="techniques">TECHNIQUES</button>
            <button class="tab" data-tab="powers">POWERS</button>
            <button class="tab" data-tab="inventory">INVENTORY</button>
            <button class="tab" data-tab="proficiencies">PROFICIENCIES</button>
            <button class="tab" data-tab="notes">NOTES</button>
        `;
        container.appendChild(tabs);

        // Get user ID for enrichment
        const user = window.firebase?.auth?.()?.currentUser;
    const userId = user?.uid;

    // Use centralized data enrichment (will use cached data if already enriched)
    const enriched = charData._displayFeats ? charData : await enrichCharacterData(charData, userId);

    // Use _displayFeats if present, otherwise fallback to feats
    const featsContent = createFeatsContent(enriched._displayFeats || enriched.feats || [], enriched);
    const techniquesContent = createTechniquesContent(enriched._techniques || []);
    const powersContent = createPowersContent(enriched._powers || []);
    // Pass enriched inventory object with weapons, armor, equipment arrays
    const inventoryContent = await createInventoryContent(enriched._inventory || {});
    const proficienciesContent = await createProficienciesContent(enriched);
    // Pass full enriched data for notes (includes appearance, archetypeDesc, notes)
    const notesContent = createNotesContent(enriched);

    container.appendChild(featsContent);
    container.appendChild(techniquesContent);
    container.appendChild(powersContent);
    container.appendChild(inventoryContent);
    container.appendChild(proficienciesContent);
    container.appendChild(notesContent);

    // --- Insert top boxes (armament proficiency & currency) above weapons section when inventory tab is active ---
    function showTopBoxesIfNeeded() {
        document.querySelectorAll('.inventory-top-boxes').forEach(el => el.remove());
        if (inventoryContent.classList.contains('active') && inventoryContent._topBoxes) {
            inventoryContent.insertBefore(inventoryContent._topBoxes, inventoryContent.firstChild);
        }
    }

    // Tab switching
    const tabButtons = tabs.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetTab = button.dataset.tab;
            container.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active');
                }
            });
            showTopBoxesIfNeeded();
        });
    });

    showTopBoxesIfNeeded();
    
    } finally {
        isRendering = false;
        
        // If a render was queued while we were rendering, execute it now
        if (pendingRender) {
            const nextData = pendingRender;
            pendingRender = null;
            await renderLibrary(nextData);
        }
    }
}
