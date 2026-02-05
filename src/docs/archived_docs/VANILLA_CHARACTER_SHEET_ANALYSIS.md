# Comprehensive Vanilla vs React Character Sheet Analysis

**Last Updated**: January 21, 2026

This document provides an exhaustive analysis of all character sheet functionality in the vanilla JavaScript implementation vs the React implementation, identifying gaps, missing features, and components that can be reused.

Priorities for implimentation: In the entire codebase always look for ways to consolidate code, create resuable components, or use other components from across thre react site to accomplish goals. For instance, the library pages power/technique/armament cards all work similalry, their part/property chips all work the same essentially, I want these same compnents reused wherever possible in the character sheet, made to work in all contexts, etc creating or extracting compnents where needed for more utility and use across THE ENTIRE react ttrpg website. this is how I always want to approach our feature implimentation, since it's scalable, ui friendly, intuitive for users who have seen the same things and know how they work across the site, etc. Continue implimentation as you go and keep this goal at the top of our prioerties right below ensuring we migrate/capture all of the vanilla sites functioanlty in the react site. Ensure progress is tracked in a seperate document or in the same file as vanilla character sheet analysis so we know what we've done, know what needs doing, know what components we can reuse, need to create, or need to parese out to make more useful in broader context and so on. nothing should fall through the cracks, this is a slow/quality project, not quantity/speed.

---

## IMPLEMENTATION PROGRESS TRACKER

### Completed Features (2025-01-20)
- ✅ **Equipment Quantity Controls** - Added +/- buttons for equipment quantity (min 1)
- ✅ **Unarmed Prowess Display** - Shows computed unarmed attack option (damage = ceil(str/2) Bludgeoning)
- ✅ **Ability 2-Point Cost** - High abilities (4→5, etc.) already correctly cost 2 points
- ✅ **Defense Value Editing** - Defense allocation already implemented with 2 skill point cost
- ✅ **Currency +/- Support** - Currency input already supports typing +5, -10, or absolute values
- ✅ **Armament Proficiency Display** - Shows max training points based on martial proficiency
- ✅ **Parts Chips** - Shared chip components created and used across power/technique displays
- ✅ **Feat Uses +/-** - Use buttons implemented for feats with use tracking
- ✅ **Recovery Display** - Feat recovery periods shown in feat cards
- ✅ **Proficiency Editing** - Martial/Power proficiency editing with +/- buttons in archetype section
- ✅ **Innate vs Regular Power Separation** - Powers visually separated into Innate and Regular sections with headers
- ✅ **Health-Energy Allocation Panel** - Full H/E point allocation UI in header with +/- controls and visual bars
- ✅ **Innate Energy Tracking** - Full display with threshold × pools breakdown, current/max values in powers tab
- ✅ **Power Potency Display** - Shows 10 + pow_prof + pow_abil in archetype section with styled box
- ✅ **Archetype Bonuses Table** - Full prof/unprof attack bonuses grid with clickable roll buttons
- ✅ **Power/Technique Use Buttons** - "Use (X)" buttons that deduct energy when clicked
- ✅ **calculateArchetypeProgression** - Full archetype progression calculation (innate threshold/pools/energy, bonus feats)
- ✅ **archetypeChoices Type** - Added Character type support for mixed archetype milestone choices
- ✅ **Three-State Point Colors** - Green (has points) / Blue (no points) / Red (over budget) coloring for all point displays
- ✅ **Skill Ability Selector** - Dropdown to change ability associated with each skill in edit mode
- ✅ **Proficiency Points Display** - Shows remaining/total prof points with three-state coloring in archetype section
- ✅ **Ability Constraints Validation** - min -2, max by level, negative sum limit -3 validation in abilities-section.tsx
- ✅ **Archetype Milestone Choices UI** - Full UI for mixed archetypes to select Innate/Feat at levels 4, 7, 10, etc.
- ✅ **Speed/Evasion Base Editing** - EditableStatBlock in sheet-header.tsx for base value editing in edit mode
- ✅ **Defense Max Validation** - getMaxDefenseSkill constraint (max = level) with disabled button and hint
- ✅ **Feats Tab in Library** - New FeatsTab component with Traits + Archetype/Character Feats sections

### Completed Features (2025-01-21)
- ✅ **Save Notifications (Toast)** - Toast feedback on auto-save success/failure
- ✅ **Feat Modal Eligible Filter** - "Show eligible only" checkbox in AddFeatModal
- ✅ **Archetype Abilities Text** - Header displays "Power: Charisma • Martial: Strength"
- ✅ **Weapon Requirement Display** - TechniqueCard shows weaponName badge
- ✅ **Data Cleaning Before Save** - cleanForSave() strips computed fields
- ✅ **Trait Uses RTDB Enrichment** - Traits enriched with uses_per_rec/rec_period, +/- buttons
- ✅ **Power/Technique Parts Enrichment** - Parts chips enriched with RTDB descriptions
- ✅ **Proficiencies Tab RTDB Enrichment** - String parts enriched with TP costs from RTDB
- ✅ **Edge Cases Audit** - All components verified with loading/error/empty states
- ✅ **Modal Functionality Review** - AddFeatModal and AddLibraryItemModal fully featured
- ✅ **User Library Integration** - Full modal with search, multi-select, metadata display

### Partially Implemented Features
- ✅ ~~**Power/Technique Parts Display**~~ COMPLETED (2025-01-21) - Parts enriched with RTDB descriptions
- ✅ ~~**Proficiencies Tab**~~ COMPLETED (2025-01-21) - RTDB enrichment for TP calculations
- ✅ ~~**Weapon Requirement Display**~~ COMPLETED - TechniqueCard shows weaponName badge

### Edge Cases & Polish Audit (2025-01-21)
**All character sheet components verified for edge case handling:**
- ✅ **page.tsx** - Loading spinner, error display, auth redirect
- ✅ **LibrarySection** - Empty states for all tabs (Powers, Techniques, Weapons, Armor, Equipment)
- ✅ **FeatsTab** - Empty state with action buttons for adding feats
- ✅ **ProficienciesTab** - "No proficiencies" per section, TP color coding
- ✅ **NotesTab** - Default values for all props
- ✅ **AddFeatModal** - Search, category filters, eligible-only, loading/error/empty states
- ✅ **AddLibraryItemModal** - Search, loading/empty states, multi-select, item metadata

### High Priority Remaining Features
~~1. **Speed/Evasion Base Editing**~~ ✅ COMPLETED
~~2. **Defense Max Validation**~~ ✅ COMPLETED
~~3. **Traits Section**~~ ✅ COMPLETED (FeatsTab includes traits)

### Medium Priority Remaining Features
4. ~~**Feat Requirement Checking**~~ ✅ COMPLETED - Already implemented in AddFeatModal with ability/skill/level checks
5. ~~**Data Cleaning Before Save**~~ ✅ COMPLETED (2025-01-21) - cleanForSave() in data-enrichment.ts
6. ~~**Save Notifications**~~ ✅ COMPLETED (2025-01-21) - Toast notifications for auto-save
7. ~~**Show Eligible Only**~~ ✅ COMPLETED (2025-01-21) - Feat modal filter checkbox
8. ~~**Archetype Abilities Text**~~ ✅ COMPLETED (2025-01-21) - Header displays "Power: Charisma • Martial: Strength"
9. ~~**Weapon Requirement Display**~~ ✅ COMPLETED (2025-01-21) - TechniqueCard shows weaponName badge
10. ~~**Trait Uses RTDB Enrichment**~~ ✅ COMPLETED (2025-01-21) - Traits enriched with uses_per_rec/rec_period from RTDB, +/- buttons for tracking

---

## EXECUTIVE SUMMARY: REACT CHARACTER SHEET GAPS

### Critical Missing Features (High Priority) - UPDATED
✅ **All critical features now complete!**
- ~~Speed/Evasion Base Editing~~ ✅ COMPLETED
- ~~Defense Max Validation~~ ✅ COMPLETED
- ~~Traits Section in Library~~ ✅ COMPLETED (FeatsTab)

### Previously Listed as Missing (Now Complete)
- ~~Edit Mode Toggle System~~ ✅ Exists with notification dot
- ~~Resource Allocation UI~~ ✅ Full H/E allocation panel
- ~~Ability Point Costs~~ ✅ 2-point cost for 4+ implemented
- ~~Defense Value Editing~~ ✅ Full editing with skill point cost
- ~~Power Innate Toggle~~ ✅ Star button toggle
- ~~Technique/Power Use Buttons~~ ✅ Use buttons with energy deduction
- ~~Feat Uses System~~ ✅ +/- buttons for use tracking
- ~~Trait Recovery Display~~ ✅ Recovery periods shown
- ~~Unarmed Prowess~~ ✅ Always-present unarmed option
- ~~Archetype Bonuses Table~~ ✅ Full prof/unprof grid
- ~~Power Potency Display~~ ✅ Calculated and displayed
- ~~Equipment Quantity Controls~~ ✅ +/- buttons
- ~~Armament Proficiency Display~~ ✅ Shown in inventory
- ~~Currency +/- Support~~ ✅ Supports +5, -10 input
- ~~Pencil Icon Color States~~ ✅ Three-state coloring (green/blue/red) for all point displays
- ~~Skill Ability Selector~~ ✅ Dropdown to change skill ability
- ~~Ability Constraints~~ ✅ min -2, max by level, negative sum limit -3
- ~~Point Overspending Indicators~~ ✅ Red coloring when overspent
- ~~Archetype Milestone Choices UI~~ ✅ Full UI for mixed archetype level 4/7/10 choices

### Missing UI/UX Features (Medium Priority)
~~28. **Power/Technique Parts Enrichment**~~ ✅ COMPLETED - Parts enriched with RTDB descriptions
~~29. **Property/Part TP Calculations**~~ ✅ COMPLETED - Proficiencies tab RTDB enrichment
~~30. **User Library Integration**~~ ✅ COMPLETED - AddLibraryItemModal has search, loading/empty states, multi-select, weapon/armor metadata

---

## DETAILED FEATURE COMPARISON

This document provides an exhaustive analysis of all character sheet functionality in the vanilla JavaScript implementation located in `vanilla-site-reference-only/public/`.

---

## TABLE OF CONTENTS

1. [File Structure Overview](#file-structure-overview)
2. [Core Architecture](#core-architecture)
3. [Header Section](#header-section)
4. [Abilities Section](#abilities-section)
5. [Skills Section](#skills-section)
6. [Archetype Section](#archetype-section)
7. [Library Section (Tabs)](#library-section-tabs)
8. [Level Progression System](#level-progression-system)
9. [Dice Rolling System](#dice-rolling-system)
10. [Data Persistence](#data-persistence)
11. [Modals and Dialogs](#modals-and-dialogs)
12. [Edit Mode System](#edit-mode-system)
13. [All Calculations and Formulas](#all-calculations-and-formulas)
14. [All Event Handlers](#all-event-handlers)
15. [All UI Components](#all-ui-components)
16. [Firebase/Data Operations](#firebasedata-operations)
17. [CSS Styling Overview](#css-styling-overview)

---

## FILE STRUCTURE OVERVIEW

### HTML
- `pages/character-sheet.html` - Main entry point

### Core JavaScript Files
- `js/character-sheet/main.js` - Entry point, initialization, global state
- `js/character-sheet/abilities.js` - Simple ability rendering (legacy)
- `js/character-sheet/calculations.js` - All stat calculation formulas
- `js/character-sheet/data.js` - Firestore CRUD operations
- `js/character-sheet/header.js` - Header rendering (legacy)
- `js/character-sheet/interactions.js` - Global event handlers and dice rolling
- `js/character-sheet/level-progression.js` - XP/level formulas and constraints
- `js/character-sheet/utils.js` - Shared utilities
- `js/character-sheet/validation.js` - Point allocation validation
- `js/character-sheet/firebase-config.js` - Firebase initialization

### Component JavaScript Files
- `components/header.js` - Full header component
- `components/abilities.js` - Abilities grid with edit mode
- `components/skills.js` - Skills/sub-skills tables
- `components/archetype.js` - Archetype proficiency, bonuses, weapons, armor
- `components/library.js` - Tabbed library container
- `components/roll-log.js` - Dice roll log panel

### Library Sub-Components
- `components/library/feats.js` - Feats tab (traits, archetype feats, character feats)
- `components/library/techniques.js` - Techniques tab
- `components/library/powers.js` - Powers tab (innate and regular)
- `components/library/inventory.js` - Inventory tab (weapons, armor, equipment)
- `components/library/proficiencies.js` - Proficiencies tab (training point tracking)
- `components/library/notes.js` - Notes tab (appearance, archetype desc, notes)

### Modal Components
- `components/modal/modal-core.js` - Base modal infrastructure
- `components/modal/feat-modal.js` - Add feat modal
- `components/modal/skill-modal.js` - Add skill/sub-skill modal
- `components/modal/equipment-modal.js` - Add equipment modal
- `components/modal/library-modals.js` - Power, technique, weapon, armor modals

### Shared Components
- `components/shared/collapsible-row.js` - Reusable collapsible row component

### Utility Files
- `utils/data-enrichment.js` - Data normalization and enrichment

### CSS Files
- `css/character-sheet/main.css` - Main styles
- `css/character-sheet/header.css` - Header section
- `css/character-sheet/abilities.css` - Abilities grid
- `css/character-sheet/skills.css` - Skills tables
- `css/character-sheet/archetype.css` - Archetype column
- `css/character-sheet/library.css` - Library tabs
- `css/character-sheet/modal.css` - Modal dialogs
- `css/character-sheet/roll-log.css` - Roll log panel

---

## CORE ARCHITECTURE

### Global State Management
Located in `main.js`:
```javascript
let currentCharacterId = null;      // Document ID from URL
let currentCharacterData = null;    // Full character data object
let autoSaveTimeout = null;         // Debounce timer for auto-save
window.isEditMode = false;          // Edit mode toggle
window.isEditingHealthEnergy = false;
window.isEditingAbilities = false;
window.isEditingProficiency = false;
window.userItemLibrary = [];        // Cached items from user's library
```

### Initialization Flow
1. Load header/footer partials
2. Initialize Firebase (Auth, Firestore, RTDB, App Check)
3. Wait for authentication
4. Load traits from RTDB
5. Load character by ID from URL parameter
6. Enrich character data (parallel fetches for feats, techniques, powers, weapons)
7. Calculate derived stats (defenses, health, energy, bonuses)
8. Render all sections (header, abilities, skills, archetype, library)
9. Setup event listeners

### Auto-Save System
- **Debounce delay**: 2 seconds after last change
- **Retry logic**: Retries once after 3 seconds on failure
- **Data cleaning**: Strips temporary/computed fields before saving
- **Notification**: Shows success/error notifications

### Saveable Fields (cleanForSave function)
```javascript
const SAVEABLE_FIELDS = [
    'name', 'species', 'gender', 'portrait', 'xp', 'level',
    'abilities', 'defenseVals', 'baseAbilities', 'ancestryAbilities',
    'health_energy_points', 'currentHealth', 'currentEnergy', 'innateEnergy',
    'skills', 'archetype', 'archetypeName', 'archetypeAbility',
    'mart_prof', 'pow_prof', 'mart_abil', 'pow_abil', 'archetypeChoices',
    'feats', 'techniques', 'powers', 'traits',
    'weapons', 'armor', 'equipment', 'currency',
    'notes', 'backstory', 'appearance', 'archetypeDesc', 'allies', 'organizations',
    'ancestry', 'ancestryId', 'ancestryTraits'
];
```

---

## HEADER SECTION

### Rendered Elements
- **Portrait**: Character image with placeholder
- **Character name**: Editable in edit mode
- **Gender symbol**: ♂/♀ based on gender
- **Archetype abilities text**: "Power: Charisma • Martial: Strength"
- **Species name**
- **XP display**: Shows current XP with level-up indicator if eligible
- **Level display**: Editable dropdown in edit mode
- **Speed stat**: Calculated, editable base in edit mode
- **Evasion stat**: Calculated, editable base in edit mode
- **Health bar**: Current/Max with +/- buttons
- **Energy bar**: Current/Max with +/- buttons
- **Terminal stat**: maxHealth / 4 (rounded up)
- **Innate Energy**: Innate threshold from archetype progression
- **Health-Energy Editor**: Collapsible panel for allocating points

### Calculations
```javascript
// Speed = speedBase + ceil(agility / 2)
calculateSpeed(agility, speedBase = 6) {
    return speedBase + Math.ceil(agility / 2);
}

// Evasion = evasionBase + agility
calculateEvasion(agility, reflexDefense, evasionBase = 10) {
    return evasionBase + agility;
}

// Terminal = ceil(maxHealth / 4)
terminal = Math.ceil(maxHealth / 4);

// Innate Threshold from calculateArchetypeProgression()
```

### Event Handlers
- `changeHealth(delta)`: Adjust health +/- (can go below 0 or exceed max)
- `changeEnergy(delta)`: Adjust energy +/- (clamped 0 to max)
- Health/Energy input: Enter key to apply delta (+5, -5) or absolute value
- Health/Energy blur: Reset to current value
- Color update: Red when value <= 0

### Edit Mode Features
- Pencil icon for health-energy editor (colored by remaining points)
- Health-Energy editor panel with +/- buttons
- Speed/Evasion base edit icons
- Name, XP, Level edit icons
- Archetype abilities edit icon

---

## ABILITIES SECTION

### Rendered Elements
- **6 Ability boxes**: Strength, Vitality, Agility, Acuity, Intelligence, Charisma
- **6 Defense boxes**: Might, Fortitude, Reflex, Discernment, Mental Fort., Resolve
- **Resource tracker** (edit mode): Shows ability points and skill points remaining

### Ability Data Structure
```javascript
abilities: {
    strength: number,
    vitality: number,
    agility: number,
    acuity: number,
    intelligence: number,
    charisma: number
}

defenseVals: {
    might: number,       // Added to strength for Might defense
    fortitude: number,   // Added to vitality for Fortitude defense
    reflex: number,      // Added to agility for Reflex defense
    discernment: number, // Added to acuity for Discernment defense
    mentalFortitude: number, // Added to intelligence for Mental Fort defense
    resolve: number      // Added to charisma for Resolve defense
}
```

### Defense Calculations
```javascript
// Defense Bonus = ability score + defenseVal
// Defense Score = 10 + Defense Bonus

calculateDefenses(abilities, defenseVals) {
    defenseBonuses = {
        might: strength + defenseVals.might,
        fortitude: vitality + defenseVals.fortitude,
        reflex: agility + defenseVals.reflex,
        discernment: acuity + defenseVals.discernment,
        mentalFortitude: intelligence + defenseVals.mentalFortitude,
        resolve: charisma + defenseVals.resolve
    }
    defenseScores = {
        might: 10 + defenseBonuses.might,
        // etc...
    }
}
```

### View Mode
- Ability mod buttons: Click to roll ability check
- Defense bonus buttons: Click to roll defense save

### Edit Mode Features
- Pencil toggle icon (colored by remaining ability points)
- Resource tracker bar showing remaining points
- Ability +/- buttons with cost display
- Defense +/- buttons (2 skill points per increase)
- Constraints display (max ability at level, negative sum limit)

### Ability Point Costs
```javascript
// Normal cost: 1 point per increase
// High ability cost: 2 points to go from 4→5, 5→6, etc.
getAbilityIncreaseCost(currentValue) {
    return currentValue >= 4 ? 2 : 1;
}

// Refund mirrors cost
getAbilityDecreaseRefund(currentValue) {
    return currentValue > 4 ? 2 : 1;
}
```

### Ability Constraints
```javascript
ABILITY_CONSTRAINTS = {
    MIN_ABILITY: -2,           // Cannot go below -2
    MAX_NEGATIVE_SUM: -3,      // Sum of negative abilities >= -3
    LEVEL_1_MAX: 3,            // Level 1 max is 3
    getMaxAbility(level) {     // Increases with level
        // Level 1: 3, Level 3: 4, Level 6: 5, etc.
    }
}
```

---

## SKILLS SECTION

### Rendered Elements
- **SKILLS section**: Table with Proficiency, Skill Name, Ability, Bonus
- **SUB-SKILLS section**: Table with Proficiency, Base Skill, Skill Name, Ability, Bonus
- **Skill point tracker** (edit mode)

### Skill Data Structure
```javascript
skills: [
    {
        name: string,           // Skill name
        ability: string,        // Selected ability (str, agi, etc.)
        skill_val: number,      // Invested points (0+)
        prof: boolean,          // Is proficient
        baseSkill?: string      // For sub-skills only: parent skill name
    }
]
```

### Skill Bonus Calculations
```javascript
// Base skill, proficient:
bonus = abilityValue + skill_val

// Base skill, not proficient:
bonus = unprofBonus(abilityValue)
unprofBonus = abilityValue < 0 ? abilityValue * 2 : Math.floor(abilityValue / 2)

// Sub-skill, base skill not proficient:
bonus = unprofBonus(abilityValue) + baseSkillVal

// Sub-skill, base proficient but sub-skill not:
bonus = abilityValue + baseSkillVal

// Sub-skill, both proficient:
bonus = abilityValue + skill_val + baseSkillVal
```

### View Mode
- Blue dot for proficient, orange dot for non-proficient
- Bonus buttons: Click to roll skill check

### Edit Mode Features
- Pencil toggle icon (colored by remaining skill points)
- Skill point tracker showing used/remaining
- "+ Add Skill" button opens skill modal
- "+ Add Sub-Skill" button (when base skills exist)
- Proficiency dots clickable (toggle proficiency)
- Ability dropdown (if skill has multiple ability options)
- +/- buttons for skill value
- Remove (✕) button for each skill

### Skill Point Costs
```javascript
// Each skill_val point costs 1 skill point
// Becoming proficient (base skill only) costs 1 skill point
// Defense vals cost 2 skill points each

calculateSpentSkillPoints(skills) {
    skills.forEach(skill => {
        spent += skill.skill_val
        if (skill.prof && !skill.baseSkill) spent += 1
    })
}
```

---

## ARCHETYPE SECTION

### Rendered Elements
- **ARCHETYPE PROFICIENCY**: Martial and Power boxes
- **ARCHETYPE CHOICES** (mixed archetype in edit mode): Milestone level choices
- **BONUSES table**: Strength/Agility/Acuity/Power with Prof/Unprof columns
- **POWER POTENCY**: 10 + pow_prof + pow_abil
- **WEAPONS table**: Equipped weapons with attack/damage/range
- **ARMOR table**: Equipped armor with damage reduction/crit range/ability req

### Archetype Types
```javascript
function getArchetypeType(martialProf, powerProf) {
    if (martialProf === 0 && powerProf > 0) return 'power';      // Pure caster
    if (powerProf === 0 && martialProf > 0) return 'martial';    // Pure martial
    if (martialProf > 0 && powerProf > 0) return 'mixed';        // Hybrid
    return 'none';
}
```

### Archetype Progression
```javascript
// Pure Power Archetype:
innateThreshold = 8 + (bonuses at levels 4, 7, 10...)
innatePools = 2 + (bonuses at levels 4, 7, 10...)
innateEnergy = innateThreshold * innatePools

// Pure Martial Archetype:
bonusArchetypeFeats = 2 + (bonuses at levels 4, 7, 10...)

// Mixed Archetype (base values):
innateThreshold = 6
innatePools = 1
bonusArchetypeFeats = 1
// Plus choices at milestone levels (4, 7, 10, 13...)
// Each choice adds either: +1 innateThreshold/innatePools OR +1 bonusArchetypeFeat

// Armament Proficiency:
calculateArmamentProficiency(martialProf) {
    if (martialProf === 0) return 3;
    if (martialProf === 1) return 8;
    if (martialProf === 2) return 12;
    return 12 + (3 * (martialProf - 2)); // 15, 18, 21...
}
```

### Bonus Calculations
```javascript
calculateBonuses(martProf, powProf, abilities, powAbil) {
    const unprofBonus = (abil) => abil < 0 ? abil * 2 : Math.ceil(abil / 2);
    
    return {
        martial: martProf,
        power: powProf,
        strength: {
            prof: martProf + abilities.strength,
            unprof: unprofBonus(abilities.strength)
        },
        agility: {
            prof: martProf + abilities.agility,
            unprof: unprofBonus(abilities.agility)
        },
        acuity: {
            prof: martProf + abilities.acuity,
            unprof: unprofBonus(abilities.acuity)
        },
        power: {
            prof: powProf + abilities[powAbil],
            unprof: unprofBonus(abilities[powAbil])
        }
    }
}
```

### Weapons Display
- **Unarmed Prowess**: Always shown, uses unproficient strength
  - Attack bonus: `str < 0 ? str * 2 : ceil(str / 2)`
  - Damage: `ceil(str / 2)` Bludgeoning
- **Equipped weapons**: From character.weapons where equipped=true
  - Attack bonus: Strength (prof) for melee, Agility (prof) for Finesse, Acuity (prof) for Range
  - Damage: dice + bonus + type
  - Properties row shown below weapon

### Armor Display
- Shows only equipped armor items
- **Damage Reduction**: 1 + level of Damage Reduction property
- **Critical Range**: evasion + 10 + critRangeBonus
- **Ability Requirements**: Parsed from armor properties

### Edit Mode Features
- Proficiency editor panel with +/- for Martial/Power
- Archetype choices UI for mixed archetypes (milestone selection)

---

## LIBRARY SECTION (TABS)

### Tab Structure
1. **FEATS** - Traits and feats with collapsible rows
2. **TECHNIQUES** - Martial techniques with energy costs
3. **POWERS** - Innate and regular powers
4. **INVENTORY** - Weapons, armor, equipment
5. **PROFICIENCIES** - Training point tracking
6. **NOTES** - Character notes and physical attributes

### Feats Tab
**Sections:**
- **Traits**: Ancestry traits, flaws, characteristics
- **Archetype Feats**: Non-char_feat feats
- **Character Feats**: char_feat=true feats
- **State Feats**: state_feat=true feats

**Features:**
- Collapsible rows with description
- Uses tracking with +/- buttons
- Recovery period display
- Unmet requirements warning (red border, ⚠️ icon)
- Edit mode: Add button, remove button, slots remaining indicator

### Techniques Tab
**Display columns:** Name, Action, Weapon, Energy (Use button)

**Features:**
- Collapsible rows with description and parts chips
- "Use (X)" button deducts energy
- Edit mode: Add button, remove button

### Powers Tab
**Split into:**
- **Innate Powers**: Powers marked as innate (don't cost regular energy)
- **Regular Powers**: Standard powers

**Display columns:** Name, Action, Damage, Energy, Area, Duration

**Features:**
- Innate energy tracking (Threshold, Pools, Energy current/max)
- "Use (X)" button (innate powers don't deduct energy)
- Collapsible rows with parts chips
- Edit mode: Innate checkbox, add/remove buttons

### Inventory Tab
**Top boxes:**
- Armament Proficiency display
- Currency input (editable with +/- support)

**Sections:**
- **WEAPONS**: Name, Damage, Range, TP, Currency, Rarity, Equipped checkbox
- **ARMOR**: Name, Dmg Red., TP, Currency, Rarity, Equipped checkbox
- **GENERAL EQUIPMENT**: Name, Description, Category, Currency, Quantity (+/-)

**Features:**
- Collapsible rows with properties chips
- Equipped checkbox triggers archetype column refresh
- Quantity controls for equipment
- Add/Remove buttons for each section

### Proficiencies Tab
**Displays training points spent on:**
- Power proficiencies (parts from powers)
- Technique proficiencies (parts from techniques)
- Weapon proficiencies (properties from weapons)
- Armor proficiencies (properties from armor)

**Shows:**
- Total TP spent vs. available
- Level requirements for each proficiency

### Notes Tab
**Physical Attributes (calculated):**
- Weight (editable)
- Height (editable)
- Jump - Horizontal: `max(strength, agility)` spaces
- Jump - Vertical: `max(strength, agility) / 2` spaces
- Climb Speed: `strength / 2` spaces (min 1)
- Swim Speed: `max(strength, vitality) / 2` spaces (min 1)
- Fall Damage: `Xd4` based on weight category (clickable dice roll)

**Text Areas (auto-save on blur):**
- Appearance
- Archetype Description
- Notes

---

## LEVEL PROGRESSION SYSTEM

### XP and Level
```javascript
// Level up requires: level * 4 XP
canLevelUp = xp >= (level * 4)
```

### Point Calculations by Level
```javascript
// Ability Points: 7 at level 1, +1 every 3 levels starting at 3
calculateAbilityPoints(level) {
    return 7 + Math.floor((level - 1) / 3);
}

// Skill Points: 2 + level * 3
calculateSkillPoints(level) {
    return 2 + level * 3;
}

// Health-Energy Points: 18 + 12 * (level - 1)
calculateHealthEnergyPoints(level) {
    return 18 + 12 * (level - 1);
}

// Proficiency Points: 2 + 1 every 5 levels starting at 5
calculateProficiencyPoints(level) {
    return 2 + Math.floor(level / 5);
}

// Max Archetype Feats: level + bonusArchetypeFeats
// Max Character Feats: level

// Training Points: 22 + highestArchetypeAbility + ((2 + highestArchetypeAbility) * (level - 1))
calculateTrainingPoints(level, highestArchetypeAbility) {
    return 22 + highestArchetypeAbility + ((2 + highestArchetypeAbility) * (level - 1));
}
```

### Milestone Levels
- **Ability Point**: Level 3, 6, 9, 12, 15, 18...
- **Proficiency Point**: Level 5, 10, 15, 20...
- **Archetype Choice** (mixed only): Level 4, 7, 10, 13, 16...

---

## DICE ROLLING SYSTEM

### Roll Log Component
- **Location**: Bottom-right corner, toggle button with d20 image
- **Capacity**: Last 20 rolls
- **Panel features**: Header with title, clear button, roll list, dice roller

### Dice Roller (in roll log)
- Click dice images to add to pool (d4, d6, d8, d10, d12, d20)
- Right-click to remove from pool
- Roll button appears when dice in pool
- Results added to roll log

### Roll Types
```javascript
// Skill Check
window.rollSkill(skillName, bonus)

// Attack Roll
window.rollAttack(weaponName, attackBonus)
window.rollAttackBonus(name, bonus)

// Damage Roll (parses "2d6+3 Slashing" format)
window.rollDamage(damageStr, bonus = 0)

// Ability Check
window.rollAbility(abilityName, bonus)

// Defense Save
window.rollDefense(defenseName, bonus)
```

### Critical Handling
```javascript
// Natural 20: +2 to total, green styling, pulse animation
// Natural 1: -2 from total, red styling, shake animation
```

### Roll Entry Display
- Type icon and styling
- Title
- Die result with crit styling
- Modifier
- Total
- Crit message if applicable
- Timestamp
- For damage: individual dice results displayed

---

## DATA PERSISTENCE

### Firebase Configuration
- Uses Firebase compat SDK (loaded via script tags)
- App Check with reCAPTCHA v3
- Firestore for character data
- RTDB for game data (feats, skills, traits, items, parts, properties)

### Data Operations (data.js)
```javascript
// Get character data
async getCharacterData(charId)
// Path: users/{uid}/character/{charId}
// Fallback: case-insensitive match, name match

// Save character data
async saveCharacterData(charId, data)
// Removes: _displayFeats, allTraits, defenses, defenseBonuses
// Removes undefined values recursively
// Uses merge: true
```

### User Library Collections
```javascript
// Powers: users/{uid}/library
// Techniques: users/{uid}/techniqueLibrary
// Items: users/{uid}/itemLibrary
```

### RTDB Paths
- `feats/` - All feat definitions
- `skills/` - All skill definitions
- `traits/` - All trait definitions
- `items/` - General equipment catalog
- `parts/` - Technique and power parts
- `properties/` - Item properties

### Data Enrichment
```javascript
// Parallel fetches for performance:
// 1. Feats (from RTDB)
// 2. Techniques (from user's Firestore)
// 3. Powers (from user's Firestore)
// 4. Weapons (from user's Firestore itemLibrary)
// Then:
// 5. Armor (reuses allItems)
// 6. Equipment (reuses allItems)
```

---

## MODALS AND DIALOGS

### Modal Core Infrastructure
- Single modal container: `#resource-modal`
- Open/close functions with body scroll lock
- Click outside to close
- Header with title and close button

### Feat Modal
**Features:**
- Filter by search text
- Filter by category dropdown
- "Show only eligible" checkbox
- Sortable columns
- Slots remaining indicator (green/blue/red)
- Add button with unmet requirements warning
- Roman numeral feat leveling (replaces previous level)

**Requirement Checking:**
- Level requirement
- Ability requirements
- Skill requirements (proficiency + bonus)
- Martial/Power proficiency requirements
- Prerequisite feat (roman numeral leveling)

### Skill Modal
**Features:**
- Search filter
- Shows skills not already added
- Adds with prof=false, skill_val=0

### Sub-Skill Modal
**Features:**
- Only available if base skills exist with proficiency
- Shows sub-skills for proficient base skills
- Links to base skill

### Equipment Modal
**Features:**
- Search, category, rarity filters
- Sortable columns
- Add increments quantity if already present

### Other Modals (via library-modals.js)
- Power Modal: Add from user's power library
- Technique Modal: Add from user's technique library
- Weapon Modal: Add from user's item library
- Armor Modal: Add from user's item library

---

## EDIT MODE SYSTEM

### Toggle Edit Mode
```javascript
window.setEditMode(enabled) {
    window.isEditMode = enabled;
    document.body.classList.toggle('edit-mode', enabled);
    // Update button text
    // Update notification dot
    // Re-render all sections
}
```

### Edit Button Notification Dot
Shows green pulsing dot when:
- Ability points remaining > 0
- Health-Energy points remaining > 0
- Skill points remaining > 0
- Archetype feats remaining > 0
- Character feats remaining > 0
- Can level up

### Section Edit Toggles
Each section has a pencil icon that toggles editing for that section:
- `window.toggleHealthEnergyEditor()`
- `window.toggleAbilitiesEditor()`
- `window.toggleProficiencyEditor()`
- `window.toggleSkillsEditor()`

### Pencil Icon Coloring (Three States)
```javascript
// Green (has-points): remaining > 0
// Blue (no-points): remaining === 0
// Red (over-budget): remaining < 0
```

---

## ALL CALCULATIONS AND FORMULAS

### Health Calculation
```javascript
calculateMaxHealth(healthPoints, vitality, level, archetypeAbility, abilities) {
    const useStrength = (archetypeAbility === 'vitality');
    const abilityMod = useStrength ? abilities.strength : vitality;
    
    if (abilityMod < 0) {
        return 8 + abilityMod + healthPoints;
    } else {
        return 8 + (abilityMod * level) + healthPoints;
    }
}
```

### Energy Calculation
```javascript
calculateMaxEnergy(energyPoints, archetypeAbility, abilities, level) {
    const abilityMod = abilities[archetypeAbility.toLowerCase()] || 0;
    return (abilityMod * level) + energyPoints;
}
```

### Movement Calculations (in notes.js)
```javascript
jumpHorizontal = Math.max(1, Math.ceil(Math.max(strength, agility)));
jumpVertical = Math.max(1, Math.ceil(Math.max(strength, agility) / 2));
climbSpeed = Math.max(1, Math.ceil(strength / 2));
swimSpeed = Math.max(1, Math.ceil(Math.max(strength, vitality) / 2));
fallDiceCount = Math.min(Math.ceil(weight / 200), 4); // 1d4 to 4d4
```

### Power Potency
```javascript
powerPotency = 10 + (pow_prof || 0) + (abilities[pow_abil] || 0);
```

### Archetype Ability Score
```javascript
getArchetypeAbilityScore(charData) {
    const powVal = abilities[pow_abil.toLowerCase()] || 0;
    const martVal = abilities[mart_abil.toLowerCase()] || 0;
    return Math.max(powVal, martVal);
}
```

---

## ALL EVENT HANDLERS

### Global Window Functions (interactions.js)
```javascript
window.updateResourceColors()      // Update health/energy input colors
window.changeHealth(delta)         // Adjust health
window.changeEnergy(delta)         // Adjust energy
window.rollSkill(name, bonus)      // Roll skill check
window.rollAttack(weapon, bonus)   // Roll attack
window.rollAttackBonus(name, bonus)// Roll attack bonus
window.rollDamage(dmgStr, bonus)   // Roll damage
window.rollAbility(name, bonus)    // Roll ability check
window.rollDefense(name, bonus)    // Roll defense save
window.changeFeatUses(name, delta) // Adjust feat uses
window.changeTraitUses(name, delta, charData, max) // Adjust trait uses
window.toggleFeat(name)            // Toggle feat active state
window.useTechnique(name, energy)  // Use technique (deduct energy)
window.usePower(name, energy)      // Use power (deduct energy)
window.saveNotes()                 // Save notes textarea
```

### Main.js Global Functions
```javascript
window.scheduleAutoSave()          // Trigger debounced save
window.currentCharacterData()      // Get current character data
window.updateCharacterData(updates)// Apply updates and save
window.getEditMode()               // Get edit mode state
window.setEditMode(enabled)        // Set edit mode
window.refreshCharacterSheet()     // Full re-render
window.refreshArchetypeColumn()    // Re-render archetype only
window.getCalculatedData()         // Get calculated stats
window.getResourceTracking()       // Get point tracking
window.increaseAbility(name)       // Increase ability score
window.decreaseAbility(name)       // Decrease ability score
window.increaseDefense(key)        // Increase defense value
window.decreaseDefense(key)        // Decrease defense value
window.getAbilityEditInfo(name)    // Get ability editing info
window.toggleHealthEnergyEditor()  // Toggle HE editor
window.toggleAbilitiesEditor()     // Toggle abilities editor
window.toggleProficiencyEditor()   // Toggle proficiency editor
window.increaseHealthAllocation()  // Increase health points
window.decreaseHealthAllocation()  // Decrease health points
window.increaseEnergyAllocation()  // Increase energy points
window.decreaseEnergyAllocation()  // Decrease energy points
window.increaseMartialProf()       // Increase martial prof
window.decreaseMartialProf()       // Decrease martial prof
window.increasePowerProf()         // Increase power prof
window.decreasePowerProf()         // Decrease power prof
```

### Modal Functions
```javascript
window.showFeatModal(featType)     // Show feat selection modal
window.addFeatToCharacter(name, type, unmet) // Add feat
window.removeFeatFromCharacter(name, type) // Remove feat
window.showSkillModal()            // Show skill selection modal
window.showSubSkillModal()         // Show sub-skill selection modal
window.showEquipmentModal()        // Show equipment modal
window.addEquipmentToCharacter(name) // Add equipment
window.showPowerModal()            // Show power modal
window.removePowerFromCharacter(name) // Remove power
window.togglePowerInnate(name, isInnate) // Toggle power innate status
window.showTechniqueModal()        // Show technique modal
window.removeTechniqueFromCharacter(name) // Remove technique
window.showWeaponModal()           // Show weapon modal
window.removeWeaponFromCharacter(name) // Remove weapon
window.showArmorModal()            // Show armor modal
window.removeArmorFromCharacter(name) // Remove armor
window.closeResourceModal()        // Close any modal
```

### Other Global Functions
```javascript
window.toggleSkillsEditor()        // Toggle skills edit mode
window.setArchetypeChoice(level, choice) // Set archetype milestone choice
window.clearRollLog()              // Clear all dice rolls
window.addRoll(rollData)           // Add roll to log
window.toggleRollLog()             // Toggle roll log panel
window.openRollLog()               // Open roll log panel
window.rollDicePool()              // Roll dice from pool
window.calculateArchetypeProgression() // Calculate archetype stats
window.calculateArmamentProficiency() // Calculate armament prof
window.enrichCharacterData()       // Enrich character data
window.renderLibrary()             // Re-render library section
window.allTraits                   // All traits from RTDB
```

---

## ALL UI COMPONENTS

### Collapsible Row Component (shared/collapsible-row.js)
**Options:**
- `title` - Row title
- `columns` - Additional column content
- `description` - Expanded description
- `subtext` - Secondary text under title
- `uses` - { current, max, recovery } for use tracking
- `onUse` - Callback for use buttons
- `expandedContent` - Extra HTML in expanded section
- `actionButton` - { label, onClick, data } for action buttons
- `className` - CSS class
- `gridColumns` - Custom grid template
- `checkbox` - Equipped checkbox config
- `truncateWords` - Description truncation length

**Built-in features:**
- Click to expand/collapse
- Expand indicator (▼/▲)
- Uses +/- buttons
- Action button
- Checkbox handling

### Collapsible Section (createCollapsibleSection)
- Section header with count badge
- Collapsible body containing child rows
- Initially expanded option

### Part Chips (techniques.js, powers.js)
- Collapsible chips showing part name, level, TP cost
- Click to expand for description
- Blue highlighting for TP-costing parts

### Property Chips (techniques.js)
- For weapon/armor properties
- Excludes base properties (damage, range, etc.)
- Shows level if > 0

---

## FIREBASE/DATA OPERATIONS

### Firebase Initialization (firebase-config.js)
```javascript
initializeFirebase() {
    // Wait for firebase global
    // Initialize auth, db (Firestore), rtdb (Realtime Database)
    // Activate App Check with reCAPTCHA
    // Wait for auth state
}

waitForAuth() {
    // Returns current user or waits for auth state change
}
```

### RTDB Loading Functions
```javascript
loadFeatsFromDatabase()           // Load all feats
loadTechniquePartsFromDatabase()  // Load technique parts
loadPowerPartsFromDatabase()      // Load power parts
loadItemPropertiesFromDatabase()  // Load item properties
loadTraitsFromDatabase()          // Load all traits
```

### RTDB Cache (rtdb-cache.js)
- `fetchSkills()` - Cached skills fetch
- `fetchSpecies()` - Cached species fetch
- `fetchPowerParts()` - Cached power parts
- `fetchTechniqueParts()` - Cached technique parts
- `fetchItemProperties()` - Cached item properties
- `fetchAllFeats()` - Cached feats
- `fetchEquipment()` - Cached equipment catalog
- `clearAllCaches()` - Clear all caches

### Firestore Operations
```javascript
// Character data
db.collection('users').doc(uid).collection('character').doc(charId)

// User's power library
db.collection('users').doc(uid).collection('library')

// User's technique library
db.collection('users').doc(uid).collection('techniqueLibrary')

// User's item library
db.collection('users').doc(uid).collection('itemLibrary')
```

---

## CSS STYLING OVERVIEW

### Design System
- Imports from `core/variables.css`, `core/reset.css`, `core/typography.css`, `core/components.css`, `core/chips.css`

### Key CSS Variables
```css
--primary-blue: var(--color-primary-light);
--primary-dark: var(--color-primary-dark);
--bg-light: var(--color-bg);
--bg-medium: var(--color-accent-light);
--border-color: var(--color-border);
--text-primary: var(--color-text);
--text-secondary: var(--color-text-secondary);
--success-green: var(--color-success);
--danger-red: var(--color-danger);
--warning-orange: var(--color-warning);
```

### Layout
- Max width: 1400px centered
- Main content: 3-column grid (skills | archetype | library)
- Responsive: 2-column at 1200px, 1-column at 768px

### Key Animation Classes
```css
.notification-dot { animation: pulse-dot 2s infinite; }
.level-up-indicator { animation: bounce-up 1s ease-in-out infinite; }
.level-up-available { animation: glow-green 1.5s ease-in-out infinite; }
.die-result.crit-success { animation: pulse 0.5s ease-in-out; }
.die-result.crit-fail { animation: shake 0.5s ease-in-out; }
```

### Point Indicator Classes
```css
.has-points { color: var(--success-green); }    /* Green: points remaining */
.no-points { color: var(--primary-blue); }       /* Blue: exactly allocated */
.over-budget { color: var(--danger-red); }       /* Red: overspent */
```

### Edit Mode Classes
```css
body.edit-mode { /* Edit mode active */ }
.edit-mode-only { /* Only visible in edit mode */ }
.edit-section-toggle { /* Pencil icon buttons */ }
.editable-field { /* Inline editable text */ }
.edit-icon { /* Pencil icons */ }
```

---

## SUMMARY OF ALL FEATURES

### Character Display
- ✅ Portrait with placeholder
- ✅ Name, species, gender display
- ✅ Level and XP tracking with level-up indicator
- ✅ Speed and Evasion calculated stats
- ✅ Health/Energy bars with current/max
- ✅ Terminal threshold display
- ✅ Innate energy display
- ✅ 6 Ability scores with roll buttons
- ✅ 6 Defense scores/bonuses with roll buttons
- ✅ Skills table with proficiency dots
- ✅ Sub-skills table with base skill reference
- ✅ Archetype proficiency (Martial/Power)
- ✅ Attack bonuses table (prof/unprof)
- ✅ Power Potency calculation
- ✅ Weapons table with attack/damage rolls
- ✅ Unarmed Prowess always available
- ✅ Armor table with damage reduction
- ✅ Feats library with collapsible rows
- ✅ Traits display (ancestry, flaw, characteristic)
- ✅ Techniques with energy costs
- ✅ Powers with innate separation
- ✅ Inventory management
- ✅ Currency tracking
- ✅ Armament proficiency display
- ✅ Proficiencies/training points tracking
- ✅ Notes/appearance/archetype description
- ✅ Physical attributes (jump, climb, swim, fall damage)

### Editing Features
- ✅ Edit mode toggle with notification dot
- ✅ Ability point allocation with costs
- ✅ Defense value allocation
- ✅ Health-Energy point allocation
- ✅ Skill point allocation
- ✅ Proficiency point allocation
- ✅ Add/remove feats with slot tracking
- ✅ Add/remove skills/sub-skills
- ✅ Add/remove techniques
- ✅ Add/remove powers
- ✅ Toggle power innate status
- ✅ Add/remove weapons/armor
- ✅ Equipment quantity management
- ✅ Equip/unequip items
- ✅ Speed/Evasion base editing
- ✅ Weight/height editing
- ✅ Archetype milestone choices (mixed)
- ✅ XP/Level editing

### Dice Rolling
- ✅ Roll log panel with toggle
- ✅ Skill checks
- ✅ Attack rolls
- ✅ Damage rolls (parsed dice strings)
- ✅ Ability checks
- ✅ Defense saves
- ✅ Natural 20 bonus (+2)
- ✅ Natural 1 penalty (-2)
- ✅ Interactive dice pool builder
- ✅ Roll history (20 entries)

### Data Persistence
- ✅ Auto-save with 2s debounce
- ✅ Retry on save failure
- ✅ Firestore for character data
- ✅ RTDB for game data lookup
- ✅ Data enrichment pipeline
- ✅ User item/power/technique libraries
- ✅ Proper data cleaning before save

### Validation
- ✅ Ability point tracking
- ✅ Skill point tracking
- ✅ Proficiency point tracking
- ✅ Health-Energy point tracking
- ✅ Feat slot tracking
- ✅ Ability constraints (min, max, negative sum)
- ✅ Defense bonus max (level + 10)
- ✅ Feat requirement checking
- ✅ Allow overspending with visual indicators

### UI/UX
- ✅ Loading overlay
- ✅ Notifications (success, error, info)
- ✅ Modal dialogs
- ✅ Collapsible rows
- ✅ Tabbed interface
- ✅ Color-coded point indicators
- ✅ Responsive layout
- ✅ Long rest functionality
---

## REACT CHARACTER SHEET: CURRENT STATE vs VANILLA

> **Note:** This section was written during initial analysis. See the **IMPLEMENTATION PROGRESS TRACKER** at the top for current status. Most items marked "Missing" below have been implemented.

### Header Section (sheet-header.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Portrait display | ✅ | ✅ | ✓ Complete | React has upload overlay |
| Character name | ✅ | ✅ | ✓ Complete | |
| Gender symbol | ✅ | ✅ | ✓ Complete | |
| Archetype abilities text | ✅ | ✅ | ✓ Complete | "Power: Charisma • Martial: Strength" ✅ 2025-01-21 |
| Species name | ✅ | ✅ | ✓ Complete | Shows as ancestry |
| XP display with level-up | ✅ | ✅ | ✓ Complete | |
| Level display | ✅ | ✅ | ✓ Complete | |
| Level edit dropdown | ✅ | ✅ | ✓ Complete | Level-up modal available |
| Speed stat | ✅ | ✅ | ✓ Complete | |
| Speed base edit | ✅ | ✅ | ✓ Complete | EditableStatBlock in edit mode ✅ 2025-01-20 |
| Evasion stat | ✅ | ✅ | ✓ Complete | |
| Evasion base edit | ✅ | ✅ | ✓ Complete | EditableStatBlock in edit mode ✅ 2025-01-20 |
| Health bar +/- | ✅ | ✅ | ✓ Complete | |
| Energy bar +/- | ✅ | ✅ | ✓ Complete | |
| Terminal threshold line | ✅ | ✅ | ✓ Complete | Visual marker on bar |
| Innate energy display | ✅ | ✅ | ✓ Complete | Full threshold/pools breakdown ✅ 2025-01-20 |
| Health-Energy Editor panel | ✅ | ✅ | ✓ Complete | Full H/E allocation in edit mode ✅ 2025-01-20 |
| Pencil icon with point color | ✅ | ✅ | ✓ Complete | Three-state coloring (green/blue/red) ✅ 2025-01-20 |

### Abilities Section (abilities-section.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| 6 Ability boxes | ✅ | ✅ | ✓ Complete | |
| Ability roll on click | ✅ | ✅ | ✓ Complete | Uses RollContext |
| 6 Defense boxes | ✅ | ✅ | ✓ Complete | In abilities-section ✅ 2025-01-20 |
| Defense roll on click | ✅ | ✅ | ✓ Complete | In abilities section |
| Edit mode +/- buttons | ✅ | ✅ | ✓ Complete | |
| Point cost display | ✅ | ✅ | ✓ Complete | ✓ Verified 2025-01-20 |
| 2-point cost for 4+ | ✅ | ✅ | ✓ Complete | ✓ Already implemented |
| Resource tracker bar | ✅ | ✅ | ✓ Complete | Three-state coloring ✅ 2025-01-20 |
| Max ability by level | ✅ | ✅ | ✓ Complete | Cap enforcement ✅ 2025-01-20 |
| Negative sum limit (-3) | ✅ | ✅ | ✓ Complete | Validation ✅ 2025-01-20 |
| Min ability (-2) | ✅ | ✅ | ✓ Complete | Lower bound ✅ 2025-01-20 |
| Archetype/Martial/Power badges | ✅ | ✅ | ✓ Complete | Color-coded badges |
| Defense skill allocation | ✅ | ✅ | ✓ Complete | ✓ Already implemented with +/- buttons |
| Defense 2-point cost | ✅ | ✅ | ✓ Complete | ✓ Already implemented |

### Skills Section (skills-section.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Skills table | ✅ | ✅ | ✓ Complete | |
| Sub-skills table | ✅ | ✅ | ✓ Complete | Shows grouped by category |
| Proficiency dots | ✅ | ✅ | ✓ Complete | Blue/orange |
| Skill roll on click | ✅ | ✅ | ✓ Complete | |
| Bonus calculation | ✅ | ✅ | ✓ Complete | Full calculation |
| Ability column | ✅ | ✅ | ✓ Complete | ✅ 2025-01-20 |
| Ability dropdown edit | ✅ | ✅ | ✓ Complete | Skill ability selector ✅ 2025-01-20 |
| +/- skill value buttons | ✅ | ✅ | ✓ Complete | |
| Add Skill button | ✅ | ✅ | ✓ Complete | |
| Add Sub-Skill button | ✅ | ✅ | ✓ Complete | |
| Remove skill (✕) | ✅ | ✅ | ✓ Complete | ✅ 2025-01-20 |
| Skill point tracker | ✅ | ✅ | ✓ Complete | Shows remaining ✅ 2025-01-20 |
| Category grouping | ❌ | ✅ | React only | Skills grouped by category |

### Archetype Section (archetype-section.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Martial proficiency box | ✅ | ✅ | ✓ Complete | Meter display |
| Power proficiency box | ✅ | ✅ | ✓ Complete | Meter display |
| Proficiency edit +/- | ✅ | ✅ | ✓ Complete | ✓ Already implemented |
| Attack bonuses table | ✅ | ✅ | ✓ Complete | ✓ Full prof/unprof grid with roll buttons |
| Power Potency display | ✅ | ✅ | ✓ Complete | ✓ Shows 10 + pow_prof + pow_abil in styled box |
| Weapons table | ✅ | ❌ | 🔴 Missing | In LibrarySection instead |
| Unarmed Prowess | ✅ | ✅ | ✓ Complete | ✓ Implemented in LibrarySection 2025-01-20 |
| Armor table | ✅ | ❌ | 🔴 Missing | In LibrarySection instead |
| Archetype choices (mixed) | ✅ | ⚠️ | ⚠️ Partial | Backend done, needs UI for selection |
| Feats in archetype | ❌ | ✅ | React only | Feats displayed here |
| Feat collapsible cards | ✅ | ✅ | ✓ Complete | |
| Feat uses +/- | ✅ | ✅ | ✓ Complete | ✓ Already implemented |

### Library Section (library-section.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Tabbed interface | ✅ | ✅ | ✓ Complete | |
| **Feats Tab** | | | | |
| - Traits section | ✅ | ❌ | 🔴 Missing | Only in vanilla |
| - Archetype feats | ✅ | ⚠️ | ⚠️ Partial | Combined in archetype |
| - Character feats | ✅ | ⚠️ | ⚠️ Partial | Combined in archetype |
| - State feats | ✅ | ❌ | 🔴 Missing | |
| - Uses tracking +/- | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 |
| - Recovery display | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 |
| - Unmet req warning | ✅ | ❌ | 🔴 Missing | |
| **Techniques Tab** | | | | |
| - Name, Action, Weapon | ✅ | ⚠️ | ⚠️ Partial | Less columns |
| - Energy cost display | ✅ | ✅ | ✓ Complete | |
| - Use (X) button | ✅ | ✅ | ✓ Complete | ✓ Use button deducts energy |
| - Collapsible desc | ✅ | ✅ | ✓ Complete | |
| - Parts chips | ✅ | ⚠️ | ⚠️ Partial | ✓ Chips implemented 2025-01-20, needs RTDB enrichment |
| - Weapon requirement | ✅ | ⚠️ | ⚠️ Partial | Shows weapon type, not specific req |
| **Powers Tab** | | | | |
| - Innate vs Regular split | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 with section headers |
| - Innate energy tracking | ✅ | ✅ | ✓ Complete | ✓ Full threshold × pools display with current/max |
| - Toggle innate checkbox | ✅ | ✅ | ✓ Complete | Star button toggle in edit mode |
| - Use button | ✅ | ⚠️ | ⚠️ Partial | Use button exists, needs energy deduction |
| - Parts chips | ✅ | ⚠️ | ⚠️ Partial | ✓ Chips implemented 2025-01-20, needs RTDB enrichment |
| **Inventory Tab** | | | | |
| - Armament Prof box | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 |
| - Currency +/- input | ✅ | ✅ | ✓ Complete | ✓ Verified 2025-01-20 |
| - Weapons list | ✅ | ✅ | ✓ Complete | |
| - Unarmed Prowess | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 |
| - Attack/Damage rolls | ✅ | ✅ | ✓ Complete | |
| - Armor list | ✅ | ✅ | ✓ Complete | |
| - Damage Reduction calc | ✅ | ❌ | 🔴 Missing | |
| - Critical Range calc | ✅ | ❌ | 🔴 Missing | |
| - Equipment list | ✅ | ✅ | ✓ Complete | |
| - Quantity +/- | ✅ | ✅ | ✓ Complete | ✓ Implemented 2025-01-20 |
| - Equip/unequip checkbox | ✅ | ✅ | ✓ Complete | |
| - Properties chips | ✅ | ⚠️ | ⚠️ Partial | Shows but not expandable |
| **Proficiencies Tab** | | | | |
| - TP tracking display | ✅ | ⚠️ | ⚠️ Partial | Incomplete data |
| - Power profs | ✅ | ⚠️ | ⚠️ Partial | Needs RTDB lookup |
| - Technique profs | ✅ | ⚠️ | ⚠️ Partial | Needs RTDB lookup |
| - Weapon profs | ✅ | ⚠️ | ⚠️ Partial | |
| - Armor profs | ✅ | ⚠️ | ⚠️ Partial | |
| - Level requirements | ✅ | ❌ | 🔴 Missing | |
| **Notes Tab** | | | | |
| - Weight editable | ✅ | ✅ | ✓ Complete | |
| - Height editable | ✅ | ✅ | ✓ Complete | |
| - Jump horizontal calc | ✅ | ✅ | ✓ Complete | |
| - Jump vertical calc | ✅ | ✅ | ✓ Complete | |
| - Climb speed calc | ✅ | ✅ | ✓ Complete | |
| - Swim speed calc | ✅ | ✅ | ✓ Complete | |
| - Fall damage roll | ✅ | ✅ | ✓ Complete | |
| - Appearance textarea | ✅ | ✅ | ✓ Complete | |
| - Archetype desc | ✅ | ✅ | ✓ Complete | |
| - Notes textarea | ✅ | ✅ | ✓ Complete | |

### Dice Rolling (roll-log.tsx, roll-context.tsx)

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Roll log panel | ✅ | ✅ | ✓ Complete | Matches vanilla layout |
| Toggle button | ✅ | ✅ | ✓ Complete | |
| Skill checks | ✅ | ✅ | ✓ Complete | |
| Attack rolls | ✅ | ✅ | ✓ Complete | |
| Damage rolls | ✅ | ✅ | ✓ Complete | Parses dice strings |
| Ability checks | ✅ | ✅ | ✓ Complete | |
| Defense saves | ✅ | ✅ | ✓ Complete | |
| Nat 20 bonus (+2) | ✅ | ✅ | ✓ Complete | |
| Nat 1 penalty (-2) | ✅ | ✅ | ✓ Complete | |
| Critical styling | ✅ | ✅ | ✓ Complete | |
| Dice pool builder | ✅ | ✅ | ✓ Complete | Interactive dice adding |
| Roll history (20) | ✅ | ✅ | ✓ Complete | |
| Clear all button | ✅ | ✅ | ✓ Complete | |
| Roll type colors | ✅ | ✅ | ✓ Complete | |

### Edit Mode System

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Global edit toggle | ✅ | ⚠️ | ⚠️ Partial | Button exists but less prominent |
| Notification dot | ✅ | ❌ | 🔴 Missing | Green pulsing dot |
| Section edit toggles | ✅ | ❌ | 🔴 Missing | Per-section pencil icons |
| Pencil icon coloring | ✅ | ❌ | 🔴 Missing | Green/Blue/Red states |
| body.edit-mode class | ✅ | ❌ | 🔴 Missing | CSS class toggle |
| Edit indicator visual | ✅ | ⚠️ | ⚠️ Partial | Less obvious than vanilla |

### Data Persistence

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Auto-save 2s debounce | ✅ | ✅ | ✓ Complete | useAutoSave hook |
| Retry on failure | ✅ | ❌ | 🔴 Missing | No retry logic |
| Data cleaning | ✅ | ⚠️ | ⚠️ Partial | Not stripping computed fields |
| User library fetch | ✅ | ✅ | ✓ Complete | useUserPowers etc |
| Data enrichment | ✅ | ✅ | ✓ Complete | enrichCharacterData |
| Notification on save | ✅ | ❌ | 🔴 Missing | No toast notifications |

### Modals

| Feature | Vanilla | React | Status | Notes |
|---------|---------|-------|--------|-------|
| Modal base component | ✅ | ✅ | ✓ Complete | Modal.tsx |
| Add Feat Modal | ✅ | ✅ | ✓ Complete | AddFeatModal.tsx |
| - Search filter | ✅ | ✅ | ✓ Complete | |
| - Category filter | ✅ | ✅ | ✓ Complete | |
| - Show eligible only | ✅ | ❌ | 🔴 Missing | |
| - Slots remaining | ✅ | ❌ | 🔴 Missing | |
| - Requirement check | ✅ | ⚠️ | ⚠️ Partial | Level only |
| Add Skill Modal | ✅ | ✅ | ✓ Complete | AddSkillModal.tsx |
| Add Sub-Skill Modal | ✅ | ✅ | ✓ Complete | AddSubSkillModal.tsx |
| Power Modal | ✅ | ✅ | ✓ Complete | AddLibraryItemModal.tsx |
| Technique Modal | ✅ | ✅ | ✓ Complete | AddLibraryItemModal.tsx |
| Weapon Modal | ✅ | ✅ | ✓ Complete | AddLibraryItemModal.tsx |
| Armor Modal | ✅ | ✅ | ✓ Complete | AddLibraryItemModal.tsx |
| Equipment Modal | ✅ | ✅ | ✓ Complete | AddLibraryItemModal.tsx |
| Level Up Modal | ✅ | ✅ | ✓ Complete | LevelUpModal.tsx |

---

## REUSABLE COMPONENTS FROM REACT CODEBASE

### UI Components (src/components/ui/)

| Component | Purpose | Reuse in Character Sheet |
|-----------|---------|--------------------------|
| **Modal** | Portal modal with animation | ✅ Already used in AddFeatModal etc |
| **Collapsible** | Expandable sections | Can use for feat/technique details |
| **Chip** | Category badges, tags | Can use for parts, properties |
| **ExpandableChip** | Click-to-expand chips | **Use for technique/power parts** |
| **Button** | Styled buttons | For edit mode toggles |
| **Input** | Form inputs | For editable fields |
| **Tabs** | Tabbed interface | Already used in LibrarySection |
| **Toast** | Notifications | **Add for save notifications** |
| **Card** | Card containers | Already used |
| **Alert** | Warning/error messages | For requirement warnings |

### Shared Components (src/components/shared/)

| Component | Purpose | Reuse in Character Sheet |
|-----------|---------|--------------------------|
| **AbilityCard** | Power/Technique display | **Replace PowerCard/TechniqueCard** |
| **ItemCard** | Unified item display | **Replace custom ItemCard** |
| **ExpandableChip** | Parts with descriptions | **Add to techniques/powers** |
| **DeleteConfirmModal** | Confirm delete dialogs | Add for removing items |
| **ItemList** | Sortable item lists | Could enhance library tabs |
| **ItemSelectionModal** | Select items from list | Could enhance add modals |
| **LoadingState** | Loading indicators | Add to character loading |
| **ErrorState** | Error display | Add to error handling |
| **SpeciesTraitCard** | Trait display | **Use for traits in feats tab** |
| **LoginPromptModal** | Auth prompts | Already used at page level |

### Creator Components (src/components/creator/)

| Component | Purpose | Reuse in Character Sheet |
|-----------|---------|--------------------------|
| **NumberStepper** | +/- number input | **Use for ability/defense editing** |
| **LoadFromLibraryModal** | Library item picker | Similar to AddLibraryItemModal |

### Character Creator Components (src/components/character-creator/)

| Component | Purpose | Reuse in Character Sheet |
|-----------|---------|--------------------------|
| **SpeciesModal** | Species selection | Could adapt for ancestry display |
| **CreatorTabBar** | Tab navigation | Similar to library tabs |

### Calculators (src/lib/calculators/)

| Module | Purpose | Reuse in Character Sheet |
|--------|---------|--------------------------|
| **power-calc** | Power cost/part formatting | **Use for power parts display** |
| **technique-calc** | Technique calculations | **Use for technique parts** |
| **item-calc** | Item property formatting | **Use for weapon/armor properties** |
| **mechanic-builder** | Shared part building | Already available |

### Game Logic (src/lib/game/)

| Module | Purpose | Reuse in Character Sheet |
|--------|---------|--------------------------|
| **calculations.ts** | Defense, speed, health | ✅ Already imported |
| **formulas.ts** | Level progression formulas | ✅ Already used |
| **progression.ts** | Complete progression data | **Import for point tracking** |
| **constants.ts** | Game constants | ✅ Already used |

### Hooks (src/hooks/)

| Hook | Purpose | Reuse in Character Sheet |
|------|---------|--------------------------|
| **useAutoSave** | Debounced saving | ✅ Already used |
| **useUserPowers** | User's power library | ✅ Already used |
| **useUserTechniques** | User's technique library | ✅ Already used |
| **useUserItems** | User's item library | ✅ Already used |
| **useGameData** | RTDB game data | **Use for feat/skill lookups** |
| **useRTDB** | Raw RTDB access | Available for trait lookups |

---

## PRIORITY IMPLEMENTATION ROADMAP

### Phase 1: Critical Edit Mode Features
1. **Unified Edit Mode Toggle** with notification dot
   - Use `hasUnappliedPoints` calculation already present
   - Add pulsing green dot when points available
   
2. **Health-Energy Allocation Panel**
   - Add collapsible panel below health/energy bars
   - Use NumberStepper component
   - Track health_energy_points pool

3. **Ability Point Constraints**
   - Implement 2-point cost for 4+ abilities
   - Add min -2, max by level validation
   - Track negative sum limit

4. **Defense Value Editing**
   - Add defense skill allocation UI
   - 2 skill points per defense point
   - Add to abilities section

### Phase 2: Library Section Improvements
5. **Technique/Power Use Buttons**
   - Add "Use (X)" button that deducts energy
   - Connect to changeEnergy handler

6. **Power Innate Toggle**
   - Add checkbox in edit mode
   - Split powers into Innate/Regular sections
   - Display innate energy tracking

7. **Feat Uses System**
   - Add +/- buttons for use tracking
   - Show recovery period
   - Add unmet requirements warning

8. **Parts/Properties Chips**
   - Use ExpandableChip for technique/power parts
   - Add TP cost highlighting
   - Load full part data from RTDB

### Phase 3: Archetype & Combat
9. **Archetype Bonuses Table**
   - Add Strength/Agility/Acuity/Power grid
   - Show prof/unprof columns
   - Use calculateBonuses function

10. **Power Potency Display**
    - Calculate 10 + pow_prof + pow_abil
    - Display in archetype section

11. **Unarmed Prowess**
    - Always show in weapons section
    - Calculate unproficient strength attack

12. **Archetype Milestone Choices**
    - Add UI for mixed archetype level 4/7/10 choices
    - Store in archetypeChoices field

### Phase 4: Polish & Validation
13. **Point Overspending Indicators**
    - Red coloring when over budget
    - Warning messages

14. **Feat Requirement Checking**
    - Level, ability, skill requirements
    - Visual indicators for unmet reqs

15. **Data Cleaning Before Save**
    - Port cleanForSave logic
    - Strip computed fields

16. **Save Notifications**
    - Add Toast component usage
    - Show save success/failure

---

## COMPONENT REUSE SUMMARY

### High-Value Reusable Components

1. **ExpandableChip** → For technique/power parts display
2. **NumberStepper** → For ability/defense/proficiency editing  
3. **Toast** → For save notifications
4. **AbilityCard** → Can replace PowerCard/TechniqueCard
5. **ItemCard** → Already similar pattern, could unify
6. **SpeciesTraitCard** → For traits section in feats tab
7. **DeleteConfirmModal** → For remove confirmations

### Calculation Modules to Import

1. **progression.ts** → getPlayerProgression for all point tracking
2. **power-calc** → formatPowerPartChip for parts display
3. **technique-calc** → formatTechniquePartChip for parts display
4. **item-calc** → extractProficiencies for TP tracking

### Patterns to Adopt

1. Vanilla's **edit section toggle** pattern with pencil icons
2. Vanilla's **three-state coloring** (green/blue/red for points)
3. Vanilla's **collapsible row** pattern for library items
4. Vanilla's **resource tracking bar** pattern
5. Vanilla's **data cleaning** before save pattern

---

## IMPLEMENTATION FILE REFERENCE

### React Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/app/(main)/characters/[id]/page.tsx` | Add edit toggle UI, point tracking display, data cleaning |
| `src/components/character-sheet/sheet-header.tsx` | Add H/E allocation panel, archetype abilities text, speed/evasion editing |
| `src/components/character-sheet/abilities-section.tsx` | Add defense editing, 2-point costs, constraints validation |
| `src/components/character-sheet/skills-section.tsx` | Add ability selector, remove buttons, proper bonus calc |
| `src/components/character-sheet/archetype-section.tsx` | Add bonuses table, power potency, proficiency editing, milestone choices |
| `src/components/character-sheet/library-section.tsx` | Add use buttons, innate toggle, parts chips, quantity controls |
| `src/components/character-sheet/proficiencies-tab.tsx` | Complete TP calculations with RTDB lookup |
| `src/components/character-sheet/add-feat-modal.tsx` | Add requirement checking, slots display |

### Vanilla Files to Reference

| File | Key Functions/Patterns |
|------|------------------------|
| `vanilla-site-reference-only/public/js/character-sheet/main.js` | cleanForSave, scheduleAutoSave, setEditMode, window functions |
| `vanilla-site-reference-only/public/js/character-sheet/interactions.js` | changeHealth, changeEnergy, rollSkill, rollAttack, rollDamage |
| `vanilla-site-reference-only/public/js/character-sheet/level-progression.js` | ABILITY_CONSTRAINTS, calculateArchetypeProgression, getAbilityIncreaseCost |
| `vanilla-site-reference-only/public/js/character-sheet/validation.js` | getCharacterResourceTracking, point validation |
| `vanilla-site-reference-only/public/js/character-sheet/components/header.js` | Health-Energy editor panel |
| `vanilla-site-reference-only/public/js/character-sheet/components/abilities.js` | Ability editing with costs |
| `vanilla-site-reference-only/public/js/character-sheet/components/archetype.js` | Bonuses table, weapons, armor |
| `vanilla-site-reference-only/public/js/character-sheet/components/library/feats.js` | Feat uses, requirement checks |
| `vanilla-site-reference-only/public/js/character-sheet/components/library/techniques.js` | Use button, parts chips |
| `vanilla-site-reference-only/public/js/character-sheet/components/library/powers.js` | Innate toggle, use button |
| `vanilla-site-reference-only/public/js/character-sheet/components/library/inventory.js` | Quantity controls, currency |
| `vanilla-site-reference-only/public/js/character-sheet/components/library/proficiencies.js` | TP calculations |

### Reusable Component Locations

| Component | Location | Import As |
|-----------|----------|-----------|
| ExpandableChip | `src/components/ui/expandable-chip.tsx` | `{ ExpandableChip }` |
| NumberStepper | `src/components/creator/number-stepper.tsx` | `{ NumberStepper }` |
| Toast | `src/components/ui/toast.tsx` | `{ Toast }` |
| Collapsible | `src/components/ui/collapsible.tsx` | `{ Collapsible }` |
| Chip | `src/components/ui/chip.tsx` | `{ Chip }` |
| Modal | `src/components/ui/modal.tsx` | `{ Modal }` |
| AbilityCard | `src/components/shared/ability-card.tsx` | `{ AbilityCard }` |
| ItemCard | `src/components/shared/item-card.tsx` | `{ ItemCard }` |
| SpeciesTraitCard | `src/components/shared/species-trait-card.tsx` | `{ SpeciesTraitCard }` |
| DeleteConfirmModal | `src/components/shared/delete-confirm-modal.tsx` | `{ DeleteConfirmModal }` |

### Calculation Function Locations

| Function | Location | Purpose |
|----------|----------|---------|
| `getPlayerProgression` | `src/lib/game/progression.ts` | All point totals for level |
| `calculateAbilityPoints` | `src/lib/game/formulas.ts` | Ability points by level |
| `calculateSkillPoints` | `src/lib/game/formulas.ts` | Skill points by level |
| `calculateHealthEnergyPool` | `src/lib/game/formulas.ts` | H/E pool by level |
| `calculateTrainingPoints` | `src/lib/game/formulas.ts` | TP by level + ability |
| `calculateDefenses` | `src/lib/game/calculations.ts` | Defense bonuses/scores |
| `calculateBonuses` | `src/lib/game/calculations.ts` | Attack bonuses |
| `formatPowerPartChip` | `src/lib/calculators/power-calc.ts` | Power part display |
| `formatTechniquePartChip` | `src/lib/calculators/technique-calc.ts` | Technique part display |
| `extractProficiencies` | `src/lib/calculators/item-calc.ts` | Item proficiency extraction |

---

## SUMMARY STATISTICS

### Feature Coverage
- **Total Vanilla Features Analyzed**: 147
- **Fully Implemented in React**: 72 (49%)
- **Partially Implemented**: 28 (19%)
- **Missing from React**: 47 (32%)

### Priority Breakdown
- **High Priority Gaps**: 12 features
- **Medium Priority Gaps**: 14 features
- **Low Priority Gaps**: 21 features

### Reusable Components Identified
- **UI Components**: 10
- **Shared Components**: 8
- **Calculation Modules**: 4
- **Hooks**: 6

### Estimated Implementation Effort
- **Phase 1 (Critical)**: ~20-30 hours
- **Phase 2 (Library)**: ~15-20 hours
- **Phase 3 (Combat)**: ~10-15 hours
- **Phase 4 (Polish)**: ~10-15 hours
- **Total Estimated**: ~55-80 hours

---

*Document generated: January 2026*
*For questions or clarifications, refer to the vanilla site code in `vanilla-site-reference-only/public/js/character-sheet/`*