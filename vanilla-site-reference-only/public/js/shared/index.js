/**
 * RealmsRPG Shared Utilities - Main Index
 * ========================================
 * Central export point for all shared utility modules.
 * 
 * Usage:
 *   import { sanitizeId, formatBonus, debounce } from '/js/shared/index.js';
 * 
 * Or import specific modules:
 *   import { sanitizeId } from '/js/shared/string-utils.js';
 */

// String utilities
export {
    sanitizeId,
    capitalize,
    capitalizeWords,
    capitalizeDamageType,
    truncate,
    slugify,
    escapeHtml,
    stripHtml,
    isBlank,
    camelToKebab,
    kebabToCamel,
    pluralize,
    formatCount
} from './string-utils.js';

// Number utilities
export {
    formatBonus,
    formatNumber,
    clamp,
    round,
    percentage,
    cmToFeetInches,
    kgToLbs,
    lbsToKg,
    parseNum,
    parseInt10,
    isValidNumber,
    randomInt,
    rollDice,
    formatDice,
    sum,
    average,
    computeSplits
} from './number-utils.js';

// Array utilities
export {
    toStrArray,
    toNumArray,
    unique,
    uniqueBy,
    groupBy,
    sortBy,
    filterBySearch,
    chunk,
    flatten,
    take,
    takeLast,
    isEmpty,
    findBy,
    removeItem,
    removeBy,
    shuffle,
    intersection,
    difference
} from './array-utils.js';

// DOM utilities
export {
    debounce,
    throttle,
    createElement,
    clearElement,
    toggleClass,
    showElement,
    hideElement,
    toggleElement,
    setupCollapsible,
    toggleExpand,
    scrollIntoView,
    copyToClipboard,
    getFormData,
    addListener,
    waitForElement,
    setupModal,
    showToast,
    setupTabs,
    openTab,
    createChip
} from './dom-utils.js';

// Game formulas
export {
    GAME_CONSTANTS,
    calculateAbilityPoints,
    calculateSkillPoints,
    calculateHealthEnergyPool,
    calculateProficiency,
    calculateTrainingPoints,
    calculateCreatureTrainingPoints,
    calculateCreatureCurrency,
    calculateMaxArchetypeFeats,
    calculateMaxCharacterFeats,
    getAbilityIncreaseCost,
    canIncreaseAbility,
    canDecreaseAbility,
    getArchetypeConfig,
    getArmamentMax,
    getArchetypeFeatLimit,
    getInnateEnergyMax,
    getPlayerProgression,
    getCreatureProgression,
    getLevelDifference
} from './game-formulas.js';

// Firebase utilities
export {
    initializeFirebase,
    waitForAuth,
    isAuthenticated,
    requireAuth,
    getWithRetry,
    getAuthInstance,
    getFirestoreInstance,
    getDatabaseInstance,
    getFunctionsInstance
} from '../core/firebase-init.js';
