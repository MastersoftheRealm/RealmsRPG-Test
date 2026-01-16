/**
 * Modal Module (Legacy Compatibility Wrapper)
 * 
 * This file now just re-exports from the modular structure.
 * For new code, import directly from './modal-index.js' or the specific sub-modules.
 * 
 * The modal system is now split into:
 * - modal/modal-core.js: Base infrastructure
 * - modal/equipment-modal.js: General equipment
 * - modal/feat-modal.js: Feats
 * - modal/library-modals.js: Techniques, powers, weapons, armor
 */

export * from './modal-index.js';
