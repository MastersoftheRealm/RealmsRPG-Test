# Vanilla Site Codebase Analysis

This document provides a comprehensive analysis of the vanilla site implementation to assist with the migration to the Next.js version.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Layer & Firebase](#data-layer--firebase)
3. [ID Constants & Database Mapping](#id-constants--database-mapping)
4. [Character Creator](#character-creator)
5. [Character Sheet](#character-sheet)
6. [Codex](#codex)
7. [Library](#library)
8. [Creators (Power, Technique, Item, Creature)](#creators)
9. [Encounter Tracker](#encounter-tracker)
10. [Calculation Logic](#calculation-logic)
11. [UI Patterns](#ui-patterns)
12. [CSS Structure](#css-structure)

---

## Architecture Overview

### File Structure
```
vanilla-site/public/
├── js/
│   ├── calculators/          # Cost calculation modules
│   │   ├── item-calc.js      # Item IP/TP/Currency calculations
│   │   ├── power-calc.js     # Power energy/TP calculations
│   │   └── technique-calc.js # Technique energy/TP calculations
│   ├── character-creator/    # Character creation flow
│   ├── character-sheet/      # Character sheet rendering
│   ├── codex/                # Database browser (read-only)
│   ├── core/                 # Firebase init, auth, RTDB cache
│   ├── pages/                # Page-specific JS (library, codex, characters)
│   ├── shared/               # Shared utilities
│   └── tools/                # Creator tools
├── css/                      # Stylesheets
├── pages/                    # HTML pages
└── tools/                    # Tool HTML pages
```

### Key Patterns
- **ES Modules**: Uses native ES module imports
- **Firebase v9 Modular SDK**: With some compat mode for older pages
- **Centralized Caching**: RTDB data cached via `rtdb-cache.js`
- **ID-based Lookups**: Migrated from name-based to numeric IDs with backwards compatibility

---

## Data Layer & Firebase

### Firebase Initialization (`core/firebase-init.js`)
```javascript
// Singleton pattern for Firebase services
export async function initializeFirebase() {
    // Returns: { app, auth, db, rtdb, functions }
    // Auto-detects if already initialized
}

export async function waitForAuth() {
    // Returns current user or null
}
```

### RTDB Cache (`core/rtdb-cache.js`)
Provides cached fetch functions for all database entities:

```javascript
// Cached fetch functions
export async function fetchPowerParts(database)       // Parts with type='power'
export async function fetchTechniqueParts(database)   // Parts with type='technique'
export async function fetchItemProperties(database)   // Item properties
export async function fetchAllFeats(database)         // Character feats
export async function fetchCreatureFeats(database)    // Creature-specific feats
export async function fetchEquipment(database)        // General items
export async function fetchTraits(database)           // Species traits
export async function fetchSkills(database)           // All skills
export async function fetchSpecies(database)          // All species
```

### Database Paths
| Path | Description |
|------|-------------|
| `parts` | Power & Technique parts (filtered by `type`) |
| `properties` | Item properties |
| `feats` | Character feats |
| `creature_feats` | Creature feats |
| `skills` | All skills |
| `species` | All species |
| `traits` | Species traits |
| `items` | General equipment |
| `users/{uid}/library` | User's saved powers |
| `users/{uid}/techniqueLibrary` | User's saved techniques |
| `users/{uid}/itemLibrary` | User's saved armaments |
| `users/{uid}/creatureLibrary` | User's saved creatures |
| `users/{uid}/character` | User's characters |

---

## ID Constants & Database Mapping

### Location: `shared/id-constants.js`

The database has migrated from string-based names to numeric IDs. This file provides:

#### Part IDs (Power & Technique Parts)
```javascript
export const PART_IDS = {
    // Damage Types
    TRUE_DAMAGE: 1,
    ADDITIONAL_DAMAGE: 6,
    SPLIT_DAMAGE_DICE: 5,
    
    // Action Modifiers
    REACTION: 2,
    LONG_ACTION: 3,
    QUICK_OR_FREE_ACTION: 4,
    
    // Power-specific variants
    POWER_LONG_ACTION: 81,
    POWER_REACTION: 82,
    POWER_QUICK_OR_FREE_ACTION: 83,
    
    // Area Effects
    LINE_OF_EFFECT: 88,
    CONE_OF_EFFECT: 89,
    CYLINDER_OF_EFFECT: 231,
    SPHERE_OF_EFFECT: 232,
    
    // Duration Parts
    DURATION_PERMANENT: 306,
    DURATION_DAYS: 375,
    DURATION_HOUR: 376,
    DURATION_MINUTE: 377,
    DURATION_ROUND: 378,
    
    // etc... (400+ constants)
};
```

#### Property IDs (Item Properties)
```javascript
export const PROPERTY_IDS = {
    DAMAGE_REDUCTION: 1,
    ARMOR_STRENGTH_REQUIREMENT: 2,
    RANGE: 13,
    TWO_HANDED: 14,
    SHIELD_BASE: 15,
    ARMOR_BASE: 16,
    WEAPON_DAMAGE: 17,
    FINESSE: 26,
    REACH: 41,
    VERSATILE: 43,
    // etc...
};
```

#### Skill, Species, Item, Creature Feat IDs
Similar constants for skills, species, items, and creature feats.

#### Helper Functions
```javascript
// Find by ID or name (backwards compatible)
export function findByIdOrName(db, ref) {
    // First tries by ID, then falls back to name
    if (ref.id !== undefined) {
        const byId = db.find(item => item.id === ref.id);
        if (byId) return byId;
    }
    if (ref.name) {
        return db.find(item => item.name === ref.name);
    }
    return undefined;
}

// Normalize references to always have ID
export function normalizeRef(db, ref) { ... }
export function normalizeRefsArray(items, db) { ... }
```

---

## Character Creator

### Location: `js/character-creator/`

### Module Structure
| File | Purpose |
|------|---------|
| `main.js` | Entry point, initialization, finalize tab |
| `firebase.js` | Firebase init & data loading |
| `storage.js` | LocalStorage save/load |
| `tabs.js` | Tab navigation |
| `ancestry.js` | Species selection & trait selection |
| `archetype.js` | Archetype selection (Power/Martial/Powered-Martial) |
| `abilities.js` | Ability score allocation |
| `skills.js` | Skill point allocation |
| `feats.js` | Feat selection |
| `equipment.js` | Weapon/armor/equipment selection |
| `powers.js` | Powers & techniques from library |
| `utils.js` | Helper functions |

### Character State
```javascript
window.character = {
    // Species/Ancestry
    speciesId: number,
    speciesName: string,          // Backwards compat
    ancestryTraits: string[],
    characteristicTrait: string,
    flawTrait: string,
    size: string,
    
    // Archetype
    archetype: {
        type: 'power' | 'martial' | 'powered-martial',
        abilities: string | { power: string, martial: string }
    },
    
    // Abilities (7 points at level 1)
    abilities: {
        strength: number,
        vitality: number,
        agility: number,
        acuity: number,
        intelligence: number,
        charisma: number
    },
    abilityValues: number[],      // [str, vit, agi, acu, int, cha]
    
    // Skills
    skills: string[],             // Selected skill names
    skillVals: { [name]: number }, // Additional points in skills
    defenseVals: {                // Defense point allocations
        might: number,
        fortitude: number,
        reflex: number,
        discernment: number,
        mentalFortitude: number,
        resolve: number
    },
    
    // Feats
    feats: {
        archetype: string[],
        character: string[]
    },
    
    // Equipment
    equipment: string[],          // Equipment IDs
    equipmentQuantities: { [id]: number },
    
    // Powers & Techniques
    powersTechniques: string[],   // Selected power/technique IDs
    
    // Finalize
    name: string,
    height: string,
    weight: string,
    appearance: string,
    archetypeDesc: string,
    notes: string,
    finalizeHealth: number,
    finalizeEnergy: number
};
```

### Storage Pattern
```javascript
// storage.js
export function saveCharacter() {
    localStorage.setItem('characterCreator_draft', JSON.stringify(window.character));
}

export function loadCharacter() {
    const saved = localStorage.getItem('characterCreator_draft');
    if (saved) window.character = JSON.parse(saved);
    return !!saved;
}

export function clearCharacter() {
    localStorage.removeItem('characterCreator_draft');
    window.character = {};
    location.reload();
}

export function restoreCharacterState() {
    // Calls restore functions for each module
    import('./archetype.js').then(mod => mod.restoreArchetype?.());
    import('./ancestry.js').then(mod => mod.restoreAncestry?.());
    // etc...
}
```

### Key Calculations (utils.js)
```javascript
export function getArchetypeAbilityScore() {
    // Returns the archetype ability score (max of power/martial abilities)
    const char = window.character;
    if (archetype.type === 'powered-martial') {
        return Math.max(abilities[powAbil], abilities[martAbil]);
    }
    return abilities[archetypeAbility];
}

export function getBaseHealth() {
    // 8 + vitality (or strength if vitality is archetype ability)
    return 8 + (vitalityIsArchetype ? strength : vitality);
}

export function getBaseEnergy() {
    // 0 + archetype ability score
    return getArchetypeAbilityScore();
}

export function getDefaultTrainingPoints() {
    // 22 + archetype ability score
    return 22 + getArchetypeAbilityScore();
}
```

### Archetype Configuration
| Type | Feat Limit | Armament Max | Innate Energy | Martial Prof | Power Prof |
|------|------------|--------------|---------------|--------------|------------|
| Power | 1 | 4 | 8 | 0 | 2 |
| Powered-Martial | 2 | 8 | 6 | 1 | 1 |
| Martial | 3 | 16 | 0 | 2 | 0 |

---

## Character Sheet

### Location: `js/character-sheet/`

### Module Structure
| File | Purpose |
|------|---------|
| `main.js` | Entry point, character loading, auto-save |
| `data.js` | Firestore read/write |
| `firebase-config.js` | Firebase initialization |
| `calculations.js` | Defense, speed, health calculations |
| `level-progression.js` | Level-up formulas |
| `validation.js` | Resource tracking validation |
| `interactions.js` | UI event handlers |
| `utils/data-enrichment.js` | Enrich saved data with RTDB lookups |
| `components/` | UI component renderers |

### Data Enrichment Pattern
Characters are saved with minimal data (names/IDs only). On load, data is "enriched" by looking up full objects:

```javascript
// data-enrichment.js
export async function enrichCharacterData(rawData, userId) {
    const data = { ...rawData };
    
    // Enrich feats
    const { displayFeats } = await enrichFeats(data.feats);
    data._displayFeats = displayFeats;
    
    // Enrich techniques from user's library
    const { displayTechniques } = await enrichTechniques(data.techniques, userId);
    data._techniques = displayTechniques;
    
    // Enrich powers from user's library
    const { displayPowers } = await enrichPowers(data.powers, userId);
    data._powers = displayPowers;
    
    // Enrich inventory items
    data._inventory = await enrichInventory(data, userId);
    
    return data;
}
```

### Saveable vs Display Fields
```javascript
// main.js - cleanForSave()
const SAVEABLE_FIELDS = [
    // Identity
    'name', 'species', 'gender', 'portrait', 'xp', 'level',
    // Core stats
    'abilities', 'defenseVals', 'baseAbilities',
    'health_energy_points', 'currentHealth', 'currentEnergy',
    // Skills
    'skills',
    // Archetype
    'archetype', 'archetypeName', 'archetypeAbility',
    'mart_prof', 'pow_prof', 'mart_abil', 'pow_abil',
    // References (names only, not full objects)
    'feats', 'techniques', 'powers', 'traits',
    // Inventory (names/equipped only)
    'weapons', 'armor', 'equipment', 'currency',
    // Notes
    'notes', 'backstory', 'appearance', 'archetypeDesc'
];
```

### Level Progression Formulas (level-progression.js)
```javascript
// Health-Energy Pool: 18 + 12 * (level - 1)
export function calculateHealthEnergyPoints(level) {
    return 18 + (12 * (level - 1));
}

// Ability Points: 7 at level 1, +1 every 3 levels starting at level 3
export function calculateAbilityPoints(level) {
    if (level < 3) return 7;
    return 7 + Math.floor((level - 1) / 3);
}

// Skill Points: 2 + level * 3
export function calculateSkillPoints(level) {
    return 2 + (3 * level);
}

// Training Points: 22 + ability + ((2 + ability) * (level - 1))
export function calculateTrainingPoints(level, highestArchetypeAbility) {
    return 22 + highestArchetypeAbility + ((2 + highestArchetypeAbility) * (level - 1));
}

// Proficiency: 2 + 1 every 5 levels starting at level 5
export function calculateProficiencyPoints(level) {
    if (level < 5) return 2;
    return 2 + Math.floor(level / 5);
}
```

### Defense Calculations (calculations.js)
```javascript
export function calculateDefenses(abilities, defenseVals) {
    const defenseBonuses = {
        might: (abilities.strength || 0) + (defenseVals.might || 0),
        fortitude: (abilities.vitality || 0) + (defenseVals.fortitude || 0),
        reflex: (abilities.agility || 0) + (defenseVals.reflex || 0),
        discernment: (abilities.acuity || 0) + (defenseVals.discernment || 0),
        mentalFortitude: (abilities.intelligence || 0) + (defenseVals.mentalFortitude || 0),
        resolve: (abilities.charisma || 0) + (defenseVals.resolve || 0)
    };
    const defenseScores = {
        might: 10 + defenseBonuses.might,
        // ... same for others
    };
    return { defenseBonuses, defenseScores };
}

export function calculateSpeed(agility, speedBase = 6) {
    return speedBase + Math.ceil(agility / 2);
}

export function calculateEvasion(agility, reflexDefense, evasionBase = 10) {
    return evasionBase + agility;
}

export function calculateMaxHealth(healthPoints, vitality, level, archetypeAbility, abilities) {
    const useStrength = archetypeAbility?.toLowerCase() === 'vitality';
    const abilityMod = useStrength ? abilities.strength : vitality;
    if (abilityMod < 0) {
        return 8 + abilityMod + healthPoints;
    }
    return 8 + (abilityMod * level) + healthPoints;
}
```

---

## Codex

### Location: `js/codex/`, `js/pages/codex.js`

### Purpose
Read-only browser for database entities (feats, skills, species, parts, properties, equipment).

### Module Structure
| File | Purpose |
|------|---------|
| `core.js` | Firebase init, shared utilities |
| `feats.js` | Feat list with filters |
| `skills.js` | Skills list |
| `species.js` | Species list with traits |
| `parts.js` | Power/technique parts |
| `properties.js` | Item properties |
| `equipment.js` | General equipment |

### Common Pattern
```javascript
// Each module follows this pattern:
let allData = [];
let filteredData = [];
let sortState = { col: 'name', dir: 1 };

export function initModule() {
    loadData();
    setupEventListeners();
}

function loadData() {
    getWithRetry('path')
        .then(snap => {
            allData = Object.values(snap.val());
            populateFilters();
            applyFilters();
        });
}

function applyFilters() {
    filteredData = allData.filter(item => {
        // Apply all filter conditions
        return matchesSearch && matchesCategory && ...;
    });
    applySort(filteredData, sortState, sortState.col);
    render();
}
```

### Filter UI Pattern
```javascript
// Chip-based multi-select
export function createChip(text, container, removeCallback) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${text} <span class="remove">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => {
        chip.remove();
        removeCallback();
    });
    container.appendChild(chip);
}
```

---

## Library

### Location: `js/pages/library.js`

### Purpose
User's saved powers, techniques, armaments, and creatures.

### Tabs
1. **Powers** - From `users/{uid}/library`
2. **Techniques** - From `users/{uid}/techniqueLibrary`
3. **Armaments** - From `users/{uid}/itemLibrary`
4. **Creatures** - From `users/{uid}/creatureLibrary`

### Display Pattern
```javascript
function createPowerCard(power, db, userId, powerPartsDb) {
    const display = derivePowerDisplay(power, powerPartsDb);
    
    const card = document.createElement('div');
    card.className = 'library-card';
    
    // Header (collapsed view)
    const header = document.createElement('div');
    header.className = 'library-header';
    header.onclick = () => toggleExpand(card);
    header.innerHTML = `
        <div class="col">${display.name}</div>
        <div class="col">${display.energy}</div>
        <div class="col">${display.actionType}</div>
        <div class="col">${display.duration}</div>
        <div class="col">${display.range}</div>
        <div class="col">${display.area}</div>
        <div class="col">${formatPowerDamage(power.damage)}</div>
        <span class="expand-icon">▼</span>
    `;
    
    // Body (expanded view)
    const body = document.createElement('div');
    body.className = 'library-body';
    body.innerHTML = `
        <div class="library-description">${display.description}</div>
        <div class="library-details">
            <label>Training Points:</label><span>${display.tp}</span>
        </div>
        <h4>Parts & Proficiencies</h4>
        <div class="library-parts">${display.partChipsHTML}</div>
    `;
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.onclick = () => deleteDoc(doc(db, 'users', userId, 'library', power.docId));
    
    return card;
}
```

---

## Creators

### Common Pattern for All Creators

All creators follow a similar pattern:

1. **Load Parts/Properties** - Fetch from RTDB
2. **Part Selection UI** - Add/remove parts with options
3. **Cost Calculation** - Real-time updates
4. **Save to Firestore** - User's library collection

### Power Creator (`tools/power-creator/main.js`)

#### State
```javascript
let powerParts = [];              // All power parts from RTDB
const selectedPowerParts = [];    // User's selected parts
let range = 0;
let area = 1;
let duration = 1;
let tpSources = [];
```

#### Part Selection
```javascript
function addPowerPart() {
    selectedPowerParts.push({ 
        part: powerParts[0], 
        op_1_lvl: 0, 
        op_2_lvl: 0, 
        op_3_lvl: 0, 
        applyDuration: false,
        selectedCategory: 'any' 
    });
    renderPowerParts();
    updateTotalCosts();
}
```

#### Cost Calculation (via power-calc.js)
```javascript
function updateTotalCosts() {
    const partsPayload = selectedPowerParts.map(p => ({
        id: p.part.id,
        name: p.part.name,
        op_1_lvl: p.op_1_lvl,
        op_2_lvl: p.op_2_lvl,
        op_3_lvl: p.op_3_lvl,
        applyDuration: p.applyDuration
    }));
    
    // Add mechanic parts (action type, area, etc.)
    const mechanicParts = buildMechanicParts();
    
    const { totalEnergy, totalTP, tpSources } = calculatePowerCosts(
        [...partsPayload, ...mechanicParts], 
        powerParts
    );
}
```

### Technique Creator (`tools/technique-creator/main.js`)

Similar to power creator but includes:
- Weapon selection from user's armament library
- Damage dice configuration
- Action type selection

### Item Creator (`tools/item-creator/main.js`)

Handles:
- Weapon/Armor/Shield type selection
- Damage dice and type
- Property selection with option levels
- Cost calculation (IP, TP, Currency → Rarity)

### Creature Creator (`tools/creature-creator/`)

More complex with multiple modules:
- `main.js` - Entry point
- `state.js` - Creature state management
- `interactions.js` - UI handlers
- `modals.js` - Modal management
- `save-load.js` - Firestore persistence
- `skill-interactions.js` - Skill selection
- `calc.js` - Creature calculations
- `tp-calc.js` - Training point calculations

---

## Calculation Logic

### Item Calculations (`calculators/item-calc.js`)

#### Cost Calculation
```javascript
export function calculateItemCosts(properties, propertiesData) {
    let totalIP = 0;
    let totalTP = 0;
    let totalCurrency = 0;

    properties.forEach(ref => {
        const data = findByIdOrName(propertiesData, ref);
        const lvl = ref.op_1_lvl || 0;
        
        totalIP += (data.base_ip || 0) + (data.op_1_ip || 0) * lvl;
        totalTP += (data.base_tp || 0) + (data.op_1_tp || 0) * lvl;
        totalCurrency += (data.base_c || 0) + (data.op_1_c || 0) * lvl;
    });

    return { totalIP, totalTP, totalCurrency };
}
```

#### Rarity Calculation
```javascript
const RARITY_BRACKETS = [
    { name: 'Common',     low: 25,     ipLow: 0,     ipHigh: 4 },
    { name: 'Uncommon',   low: 100,    ipLow: 4.01,  ipHigh: 6 },
    { name: 'Rare',       low: 500,    ipLow: 6.01,  ipHigh: 8 },
    { name: 'Epic',       low: 2500,   ipLow: 8.01,  ipHigh: 11 },
    { name: 'Legendary',  low: 10000,  ipLow: 11.01, ipHigh: 14 },
    { name: 'Mythic',     low: 50000,  ipLow: 14.01, ipHigh: 16 },
    { name: 'Ascended',   low: 100000, ipLow: 16.01, ipHigh: Infinity }
];

export function calculateCurrencyCostAndRarity(totalCurrency, totalIP) {
    for (const br of RARITY_BRACKETS) {
        if (totalIP >= br.ipLow && totalIP <= br.ipHigh) {
            return {
                rarity: br.name,
                currencyCost: br.low * (1 + 0.125 * totalCurrency)
            };
        }
    }
}
```

### Power Calculations (`calculators/power-calc.js`)

#### Energy Formula
```javascript
// Unified power energy equation:
// (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur)

export function calculatePowerCosts(partsPayload, partsDb) {
    let flat_normal = 0;
    let flat_duration = 0;
    let perc_all = 1;
    let perc_dur = 1;
    let dur_all = 1;
    let totalTP = 0;

    partsPayload.forEach(pl => {
        const def = findByIdOrName(partsDb, pl);
        const energyContribution = /* base + options */;

        if (def.duration) {
            dur_all *= energyContribution;
        } else if (def.percentage) {
            perc_all *= energyContribution;
            if (pl.applyDuration) perc_dur *= energyContribution;
        } else {
            flat_normal += energyContribution;
            if (pl.applyDuration) flat_duration += energyContribution;
        }
        
        totalTP += Math.floor(/* tp calculation */);
    });

    const totalEnergy = Math.ceil(
        (flat_normal * perc_all) + 
        ((dur_all + 1) * flat_duration * perc_dur) - 
        (flat_duration * perc_dur)
    );

    return { totalEnergy, totalTP, tpSources };
}
```

### Technique Calculations (`calculators/technique-calc.js`)

```javascript
export function calculateTechniqueCosts(partsPayload, partsDb) {
    let sumNonPercentage = 0;
    let productPercentage = 1;
    let totalTP = 0;

    partsPayload.forEach(pl => {
        const def = findByIdOrName(partsDb, pl);
        const energyContribution = /* base + options */;

        if (def.percentage) {
            productPercentage *= energyContribution;
        } else {
            sumNonPercentage += energyContribution;
        }
        
        totalTP += Math.floor(/* tp calculation */);
    });

    const totalEnergy = Math.ceil(sumNonPercentage * productPercentage);
    return { totalEnergy, totalTP, tpSources, energyRaw: sumNonPercentage * productPercentage };
}
```

### Shared Game Formulas (`shared/game-formulas.js`)

```javascript
export const GAME_CONSTANTS = {
    SHARED: {
        BASE_ABILITY_POINTS: 7,
        ABILITY_POINTS_PER_3_LEVELS: 1,
        BASE_SKILL_POINTS: 2,
        SKILL_POINTS_PER_LEVEL: 3,
        BASE_PROFICIENCY: 2,
        PROFICIENCY_PER_5_LEVELS: 1,
        HIT_ENERGY_PER_LEVEL: 12
    },
    PLAYER: {
        BASE_HIT_ENERGY: 18,
        BASE_TRAINING_POINTS: 22
    },
    CREATURE: {
        BASE_HIT_ENERGY: 26,
        BASE_TRAINING_POINTS: 9,
        BASE_FEAT_POINTS: 4,
        BASE_CURRENCY: 200
    },
    ARCHETYPE: {
        power: { featLimit: 1, armamentMax: 4, innateEnergy: 8 },
        'powered-martial': { featLimit: 2, armamentMax: 8, innateEnergy: 6 },
        martial: { featLimit: 3, armamentMax: 16, innateEnergy: 0 }
    }
};
```

---

## Encounter Tracker

### Location: `tools/encounter-tracker/main.js`

### Features
- Drag-and-drop initiative order
- AP (Action Points) tracking
- HP tracking with color coding
- Condition tracking with levels (decaying conditions)
- Surprise round handling
- Turn order with ally/enemy alternation

### Conditions List
```javascript
const conditionOptions = [
    { name: "Bleeding", decaying: true, description: "..." },
    { name: "Blinded", decaying: false, description: "..." },
    { name: "Charmed", decaying: false, description: "..." },
    { name: "Dazed", decaying: false, description: "..." },
    // ... 20+ conditions
];
```

### Entry Structure
```javascript
{
    element: HTMLElement,
    name: string,
    roll: number,          // Initiative roll
    acuity: number,        // Tiebreaker
    side: 'ally' | 'enemy',
    surprised: boolean
}
```

### Initiative Sorting
```javascript
function sortInitiative() {
    // Separate allies and enemies
    // Sort each group by roll (descending), then acuity (descending)
    // Handle surprise (non-surprised go first in round 0)
    // Interleave: start with highest overall, alternate sides
}
```

---

## UI Patterns

### Collapsible Sections
```javascript
// Toggle expand on header click
header.addEventListener('click', () => {
    body.classList.toggle('open');
    arrow.classList.toggle('open');
});
```

### Modal Pattern
```javascript
// Open modal
modal.classList.remove('hidden');

// Close modal
function closeModal() {
    modal.classList.add('hidden');
}
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});
```

### Tab Navigation
```javascript
function openTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active-tab');
    event.currentTarget.classList.add('active');
}
```

### Filter Chips
```javascript
function createChip(text, container, removeCallback) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${text} <span class="remove">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => {
        chip.remove();
        removeCallback();
    });
    container.appendChild(chip);
}
```

### Quantity Controls
```html
<div class="control">
    <button class="dec">-</button>
    <span class="value">0</span>
    <button class="inc">+</button>
</div>
```

### Sortable Table Headers
```html
<div class="col" data-col="name">
    NAME
    <div class="sort-group">
        <span class="sort" data-dir="asc">A-Z</span>
        <span class="sort" data-dir="desc">Z-A</span>
    </div>
</div>
```

---

## CSS Structure

### Location: `css/`

```
css/
├── layouts/
│   └── main.css              # Global layout styles
├── core/
│   └── variables.css         # CSS custom properties
├── character-creator/
│   └── character-creator.css
├── character-sheet/
│   ├── main.css
│   ├── header.css
│   ├── abilities.css
│   ├── skills.css
│   ├── archetype.css
│   ├── library.css
│   ├── modal.css
│   └── roll-log.css
├── pages/
│   ├── codex.css
│   └── library.css
└── tools/
    ├── encounter-tracker.css
    ├── power-creator.css
    └── creature-creator.css
```

### Common Variables (inferred)
```css
:root {
    --primary: #0a4a7a;
    --primary-light: #1a6aaa;
    --secondary: #ff9800;
    --background: #f5f5f5;
    --surface: #ffffff;
    --text: #333333;
    --text-light: #888888;
    --border: #cccccc;
    --success: #4caf50;
    --warning: #ff9800;
    --error: #d9534f;
}
```

### Common Patterns

#### Cards
```css
.card {
    background: var(--surface);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 16px;
}
```

#### Expandable Items
```css
.item-body {
    display: none;
    padding: 16px;
}
.item.expanded .item-body {
    display: block;
}
.expand-icon {
    transition: transform 0.2s;
}
.expanded .expand-icon {
    transform: rotate(180deg);
}
```

#### Chips
```css
.chip {
    display: inline-flex;
    align-items: center;
    background: var(--primary-light);
    color: white;
    padding: 4px 12px;
    border-radius: 16px;
    margin: 4px;
}
.chip .remove {
    cursor: pointer;
    margin-left: 8px;
}
```

---

## Key Takeaways for Migration

1. **ID-based lookups** - Always use numeric IDs with `findByIdOrName()` fallback for backwards compatibility

2. **Cached RTDB fetches** - Use `rtdb-cache.js` pattern to avoid redundant database calls

3. **Data enrichment** - Store minimal data (names/IDs), enrich with full objects on load

4. **Calculation modules** - Keep calculations in dedicated `calculators/` modules

5. **Save/load separation** - Clearly define what gets saved vs. what's computed

6. **Archetype-aware logic** - Many calculations depend on archetype type

7. **Level progression** - Use centralized formulas from `game-formulas.js`

8. **UI patterns** - Reuse collapsible, modal, tab, and chip patterns

9. **Error handling** - Use retry logic for RTDB fetches, handle offline/permission errors

10. **Type safety** - Consider adding TypeScript interfaces matching the data structures above

---

## React Implementation Progress

### Completed Features ✅

#### Character Sheet Components
| Feature | Component | Notes |
|---------|-----------|-------|
| Equipment Quantity Controls | `library-section.tsx` | +/- buttons for equipment in edit mode |
| Unarmed Prowess | `library-section.tsx` | Always-available weapon with STR-based damage |
| Ability 2-Point Cost | `abilities-section.tsx` | Abilities 4+ cost 2 points to increase |
| Defense Value Editing | `abilities-section.tsx` | +/- controls with 2 skill point cost |
| Defense Max Validation | `abilities-section.tsx` | Defense skill capped at level |
| Currency +/- Support | `library-section.tsx` | Input supports +5, -10 or direct values |
| Armament Proficiency Display | `library-section.tsx` | Shows max TP for weapons/armor tabs |
| Parts Chips | `library-section.tsx` | PartChipList for power/technique parts |
| Feat Uses +/- | `archetype-section.tsx` | Limited-use feat tracking |
| Recovery Display | `archetype-section.tsx` | Shows recovery period for feats |
| Proficiency Editing | `archetype-section.tsx` | Martial/Power proficiency +/- |
| Innate vs Regular Powers | `library-section.tsx` | Separate sections with purple styling |
| Health-Energy Allocation | `sheet-header.tsx` | Pool allocation with point tracking |
| Innate Energy Tracking | `library-section.tsx` | Threshold × Pools breakdown display |
| Power Potency Display | `archetype-section.tsx` | 10 + pow_prof + pow_abil |
| Attack Bonuses Table | `archetype-section.tsx` | Clickable roll buttons for bonuses |
| Power/Technique Use Buttons | `library-section.tsx` | Energy cost deduction on use |
| Three-State Point Colors | `abilities-section.tsx`, `skills-section.tsx`, `archetype-section.tsx` | Green (remaining), Blue (perfect), Red (over) |
| Skill Ability Selector | `skills-section.tsx` | Dropdown to change skill's governing ability |
| Archetype Milestone Choices | `archetype-section.tsx` | Innate/Feat selection for mixed archetypes |
| Feats Tab in Library | `feats-tab.tsx` | Combined Traits + Feats with collapsible sections |
| Speed/Evasion Base Editing | `sheet-header.tsx` | EditableStatBlock for base values |
| Ability Constraints | `abilities-section.tsx` | Min -2, max by level, negative sum -3 limit |

#### Core Systems
| Feature | Location | Notes |
|---------|----------|-------|
| Archetype Progression | `formulas.ts` | `calculateArchetypeProgression()` function |
| archetypeChoices Type | `character.ts` | TypeScript interface for milestone choices |
| Level Progression | `formulas.ts` | Health/Energy pool, ability points, skill points, etc. |
| Defense Calculations | `page.tsx` | Uses vanilla formulas for defense bonuses/scores |

### Partially Implemented ⚠️

| Feature | Status | Blocker |
|---------|--------|---------|
| Power/Technique Parts Display | Parts shown as chips | Missing RTDB enrichment for TP data |
| Proficiencies Tab | Basic structure exists | String parts don't have TP values |
| Weapon Requirement Display | Shows weapon type | Need specific requirement text |

### Not Yet Implemented ❌

| Feature | Priority | Notes |
|---------|----------|-------|
| Part RTDB Enrichment | High | Load full part data from RTDB for TP calculations |
| Creature Creator | Medium | Not started |
| Encounter Tracker | Medium | Not started |

### Shared Components

| Component | Location | Used By |
|-----------|----------|---------|
| `SpeciesTraitCard` | `shared/species-trait-card.tsx` | Archetype section, Feats tab |
| `PartChipList` | `shared/part-chip.tsx` | Library section (powers/techniques) |
| `ItemCard` (shared) | `shared/item-card.tsx` | Codex, Library |
| `CollapsibleSection` | `feats-tab.tsx` | Feats tab (could be extracted) |

### Architecture Decisions

1. **Component-local cards** - PowerCard, TechniqueCard, ItemCard kept in library-section.tsx since they have highly specific behaviors (innate toggle, equip toggle, roll buttons)

2. **Three-state color system** - Consistent pattern across all point trackers:
   - Green (`text-green-600`, `bg-green-100`): Points remaining
   - Blue (`text-blue-600`, `bg-blue-100`): Points perfectly spent
   - Red (`text-red-600`, `bg-red-100`): Over budget

3. **Editable stats pattern** - EditableStatBlock shows value with +/- controls for base in edit mode

4. **Formula centralization** - All game formulas in `src/lib/game/formulas.ts`

5. **Type safety** - Character type extended with `archetypeChoices`, `speedBase`, `evasionBase`, etc.

