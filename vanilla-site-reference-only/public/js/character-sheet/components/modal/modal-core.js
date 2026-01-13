/**
 * Modal Core - Base modal infrastructure
 * Handles modal creation, open/close, and shared utilities
 */

import { getWithRetry, applySort, initFirebase } from '../../../codex/core.js';

// Re-export for backwards compatibility
export { getWithRetry, applySort, initFirebase };

// --- Modal HTML injection (if not present) ---
export function ensureResourceModal() {
    let modal = document.getElementById('resource-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'resource-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" id="resource-modal-close">&times;</span>
                <div class="modal-header">
                    <h2 id="resource-modal-title">Add Resource</h2>
                </div>
                <div id="resource-modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    // Always re-attach close event
    const closeBtn = document.getElementById('resource-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeResourceModal);
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeResourceModal();
    });
    return modal;
}

// --- Modal open/close logic ---
export function openResourceModal() {
    const modal = ensureResourceModal();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

export function closeResourceModal() {
    const modal = document.getElementById('resource-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Get current character data (handles both function and object forms)
 */
export function getCharacterData() {
    return window.currentCharacterData ? 
        (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) 
        : null;
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
    return window.firebase?.auth?.()?.currentUser;
}

/**
 * Get Firestore instance (using compat API exposed by firebase-config.js)
 */
export function getFirestoreDb() {
    const fb = window.firebase;
    if (fb?.firestore) {
        return fb.firestore();
    }
    return null;
}

/**
 * Shared helper to refresh library after resource changes
 * @param {object} charData - Character data
 * @param {string} activeTab - Tab to restore after refresh
 */
export async function refreshLibraryAfterChange(charData, activeTab = null) {
    const container = document.getElementById('library-section');
    if (!container) return;
    
    // Preserve active tab if not specified
    if (!activeTab) {
        const activeTabBtn = container.querySelector('.tab.active');
        activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'feats';
    }
    
    // Re-enrich and re-render
    if (typeof window.enrichCharacterData === 'function' && typeof window.renderLibrary === 'function') {
        const user = getCurrentUser();
        const userId = user?.uid;
        
        try {
            const enrichedData = await window.enrichCharacterData(charData, userId);
            Object.assign(charData, enrichedData);
            
            await window.renderLibrary(enrichedData);
            
            // Restore active tab
            setTimeout(() => {
                const tabs = container.querySelectorAll('.tab');
                tabs.forEach(btn => {
                    if (btn.dataset.tab === activeTab) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
                container.querySelectorAll('.tab-content').forEach(content => {
                    const contentTab = content.id.replace('-content', '');
                    if (contentTab === activeTab) content.classList.add('active');
                    else content.classList.remove('active');
                });
            }, 0);
        } catch (err) {
            console.error('[LibraryRefresh] Error re-rendering library:', err);
        }
    }
}

// Export to window for global access
window.closeResourceModal = closeResourceModal;
