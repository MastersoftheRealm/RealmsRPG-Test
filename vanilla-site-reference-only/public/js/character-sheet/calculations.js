export function calculateDefenses(abilities, defenseVals) {
    const a = abilities || {};
    const d = defenseVals || {};
    const defenseBonuses = {
        might: (a.strength || 0) + (d.might || 0),
        fortitude: (a.vitality || 0) + (d.fortitude || 0),
        reflex: (a.agility || 0) + (d.reflex || 0),
        discernment: (a.acuity || 0) + (d.discernment || 0),
        mentalFortitude: (a.intelligence || 0) + (d.mentalFortitude || 0),
        resolve: (a.charisma || 0) + (d.resolve || 0)
    };
    const defenseScores = {
        might: 10 + defenseBonuses.might,
        fortitude: 10 + defenseBonuses.fortitude,
        reflex: 10 + defenseBonuses.reflex,
        discernment: 10 + defenseBonuses.discernment,
        mentalFortitude: 10 + defenseBonuses.mentalFortitude,
        resolve: 10 + defenseBonuses.resolve
    };
    return { defenseBonuses, defenseScores };
}

export function calculateSpeed(agility, speedBase = 6) {
    // Speed = speedBase + (agility / 2) rounded up
    return speedBase + Math.ceil(agility / 2);
}

export function calculateEvasion(agility, reflexDefense, evasionBase = 10) {
    // Evasion = evasionBase + agility
    return evasionBase + agility;
}

export function calculateMaxHealth(healthPoints, vitality, level, archetypeAbility, abilities) {
    // Determine if vitality is the highest archetype ability
    const useStrength = (archetypeAbility === 'Vitality' || archetypeAbility === 'vitality');
    const abilityMod = useStrength ? (abilities?.strength || 0) : vitality;
    
    if (abilityMod < 0) {
        return 8 + abilityMod + healthPoints;
    } else {
        return 8 + (abilityMod * level) + healthPoints;
    }
}

export function calculateMaxEnergy(energyPoints, archetypeAbility, abilities, level, charData) {
    // Use getArchetypeAbilityScore if charData is provided, else fallback to old logic
    let abilityMod = 0;
    if (charData) {
        abilityMod = getArchetypeAbilityScore(charData);
    } else {
        abilityMod = abilities?.[archetypeAbility?.toLowerCase()] || 0;
    }
    return (abilityMod * level) + energyPoints;
}

export function calculateBonuses(martProf, powProf, abilities, powAbil) {
    const mart = martProf || 0;
    const pow = powProf || 0;
    
    // Get power ability value
    const powerAbilityValue = powAbil ? (abilities?.[powAbil.toLowerCase()] || 0) : (abilities?.charisma || 0);
    
    // Helper: for unprof bonuses, if ability is negative, double it; otherwise divide by 2 rounded up
    const unprofBonus = (abilityValue) => {
        return abilityValue < 0 ? abilityValue * 2 : Math.ceil(abilityValue / 2);
    };
    
    return {
        martial: mart,
        power: pow,
        strength: {
            prof: mart + (abilities?.strength || 0),
            unprof: unprofBonus(abilities?.strength || 0)
        },
        agility: {
            prof: mart + (abilities?.agility || 0),
            unprof: unprofBonus(abilities?.agility || 0)
        },
        acuity: {
            prof: mart + (abilities?.acuity || 0),
            unprof: unprofBonus(abilities?.acuity || 0)
        },
        power: {
            prof: pow + powerAbilityValue,
            unprof: unprofBonus(powerAbilityValue)
        }
    };
}

/**
 * Get the current speed base value (default 6, or custom if modified)
 * @param {object} charData - Character data
 * @returns {number} Speed base value
 */
export function getSpeedBase(charData) {
    return charData?.speedBase ?? 6;
}

/**
 * Get the current evasion base value (default 10, or custom if modified)
 * @param {object} charData - Character data
 * @returns {number} Evasion base value
 */
export function getEvasionBase(charData) {
    return charData?.evasionBase ?? 10;
}

// Returns the archetype ability score for a character (max of pow_abil or mart_abil, using abilities)
export function getArchetypeAbilityScore(charData) {
    if (!charData || !charData.abilities) return 0;
    let powAbil = charData.pow_abil || (charData.archetype && charData.archetype.pow_abil) || (charData.archetype && charData.archetype.ability);
    let martAbil = charData.mart_abil || (charData.archetype && charData.archetype.mart_abil);
    let powVal = 0, martVal = 0;
    if (powAbil) powVal = charData.abilities[String(powAbil).toLowerCase()] || 0;
    if (martAbil) martVal = charData.abilities[String(martAbil).toLowerCase()] || 0;
    return Math.max(powVal, martVal);
}
