/**
 * Modal Module Index
 * 
 * This file consolidates all modal functionality for the character sheet.
 * Each type of modal is now in its own focused module for better maintainability.
 * 
 * Structure:
 * - modal-core.js: Base modal infrastructure (open/close, shared utilities)
 * - equipment-modal.js: General equipment from RTDatabase codex
 * - feat-modal.js: Archetype and character feats from RTDatabase
 * - library-modals.js: User's personal library items (techniques, powers, weapons, armor)
 */

// Re-export everything from sub-modules
export { 
    ensureResourceModal,
    openResourceModal, 
    closeResourceModal,
    getCharacterData,
    getCurrentUser,
    getFirestoreDb,
    refreshLibraryAfterChange
} from './modal/modal-core.js';

export { showEquipmentModal } from './modal/equipment-modal.js';
export { showFeatModal } from './modal/feat-modal.js';
export { 
    showTechniqueModal, 
    showPowerModal, 
    showWeaponModal, 
    showArmorModal 
} from './modal/library-modals.js';

export { 
    showSkillModal, 
    showSubSkillModal 
} from './modal/skill-modal.js';
