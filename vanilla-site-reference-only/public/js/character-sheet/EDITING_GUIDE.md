# Character Sheet Editing Implementation Guide

This guide documents the edit mode system implemented for the character sheet.

## Architecture Overview

### Files Structure
1. **`level-progression.js`** - Contains all formulas for character progression and ability costs
2. **`validation.js`** - Validates edits against progression rules, exports helper functions
3. **`main.js`** - Global edit mode state and editing functions
4. **`components/abilities.js`** - Renders abilities with edit mode support
5. **CSS in `styles/characterSheet/main.css`** - Edit mode styling

## Implemented Features

### Edit Mode Toggle
- Click the "Edit" button in sheet-actions to toggle edit mode
- Body gets `edit-mode` class for CSS styling
- All components re-render based on edit mode state

### Global Functions (window.*)
- `window.isEditMode` - Current edit mode state
- `window.setEditMode(enabled)` - Sets edit mode and updates UI
- `window.refreshCharacterSheet()` - Re-renders entire sheet
- `window.getResourceTracking()` - Gets current resource allocation info

### Ability Editing
- `window.increaseAbility(abilityName)` - Increases an ability score
- `window.decreaseAbility(abilityName)` - Decreases an ability score
- `window.getAbilityEditInfo(abilityName)` - Gets edit info for UI

### Health-Energy Editing
- `window.increaseHealthAllocation(amount)` - Adds to health pool
- `window.decreaseHealthAllocation(amount)` - Removes from health pool
- `window.increaseEnergyAllocation(amount)` - Adds to energy pool
- `window.decreaseEnergyAllocation(amount)` - Removes from energy pool

## Ability Score Rules Implemented

### Constraints (from level-progression.js)
```javascript
ABILITY_CONSTRAINTS = {
    MIN_ABILITY: -2,           // No ability can go below -2
    MAX_NEGATIVE_SUM: -3,      // Sum of negative abilities cannot be less than -3
    LEVEL_1_MAX: 3,            // At level 1, no ability can exceed 3
    getMaxAbility: (level)     // Returns max ability for a given level
}
```

### Ability Point Costs
- Going from 0-4: Costs 1 point per increase
- Going from 4 to 5: Costs 2 points
- Going from 5 to 6+: Costs 2 points each

### Refunds
- Decreasing from 5 to 4: Refunds 2 points  
- Decreasing from 6+ to 5+: Refunds 2 points
- Normal decreases: Refund 1 point

## Health-Energy Points

### Formula
`18 + level * 12` total points to allocate between health and energy pools.

### Validation
- Cannot allocate negative values
- Cannot exceed total available points
- Changes affect Max HP/EP calculations

## Resource Tracking

The `getCharacterResourceTracking()` function returns:
```javascript
{
    level,
    healthEnergyPoints: {
        total, spent, remaining, health, energy
    },
    abilityPoints: {
        total, spent, remaining, negativeSum, maxAbility  
    },
    skillPoints: { total, spent, remaining },
    proficiencyPoints: { 
        total, spent, remaining, martial, power 
    },
    feats: {
        archetype: { max, current, remaining },
        character: { max, current, remaining }
    }
}
```
