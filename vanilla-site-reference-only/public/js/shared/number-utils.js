/**
 * RealmsRPG Shared Utilities - Number Functions
 * ==============================================
 * Centralized number formatting and manipulation functions.
 */

/**
 * Format a number as a bonus string with + or - prefix.
 * 
 * @param {number|string} value - The value to format
 * @returns {string} The formatted bonus string
 * 
 * @example
 * formatBonus(3) // returns '+3'
 * formatBonus(-2) // returns '-2'
 * formatBonus(0) // returns '+0'
 */
export function formatBonus(value) {
    const num = parseInt(value, 10) || 0;
    return num >= 0 ? `+${num}` : `${num}`;
}

/**
 * Format a number with thousands separators.
 * 
 * @param {number|string} value - The value to format
 * @param {string} [locale='en-US'] - The locale for formatting
 * @returns {string} The formatted number
 * 
 * @example
 * formatNumber(1234567) // returns '1,234,567'
 */
export function formatNumber(value, locale = 'en-US') {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString(locale);
}

/**
 * Clamp a number between a minimum and maximum value.
 * 
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} The clamped value
 * 
 * @example
 * clamp(15, 0, 10) // returns 10
 * clamp(-5, 0, 10) // returns 0
 * clamp(5, 0, 10) // returns 5
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Round a number to a specified number of decimal places.
 * 
 * @param {number} value - The value to round
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {number} The rounded value
 * 
 * @example
 * round(3.14159, 2) // returns 3.14
 */
export function round(value, decimals = 2) {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate the percentage of a value relative to a total.
 * 
 * @param {number} value - The partial value
 * @param {number} total - The total value
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {number} The percentage
 * 
 * @example
 * percentage(25, 100) // returns 25
 * percentage(1, 3, 1) // returns 33.3
 */
export function percentage(value, total, decimals = 0) {
    if (total === 0) return 0;
    return round((value / total) * 100, decimals);
}

/**
 * Convert centimeters to feet and inches.
 * 
 * @param {number} cm - Height in centimeters
 * @returns {{feet: number, inches: number, formatted: string}} Converted height
 * 
 * @example
 * cmToFeetInches(180) // returns {feet: 5, inches: 11, formatted: "5'11\""}
 */
export function cmToFeetInches(cm) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return {
        feet,
        inches,
        formatted: `${feet}'${inches}"`
    };
}

/**
 * Convert kilograms to pounds.
 * 
 * @param {number} kg - Weight in kilograms
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {number} Weight in pounds
 * 
 * @example
 * kgToLbs(80) // returns 176.4
 */
export function kgToLbs(kg, decimals = 1) {
    return round(kg * 2.20462, decimals);
}

/**
 * Convert pounds to kilograms.
 * 
 * @param {number} lbs - Weight in pounds
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {number} Weight in kilograms
 */
export function lbsToKg(lbs, decimals = 1) {
    return round(lbs / 2.20462, decimals);
}

/**
 * Parse a number from a string, returning a default if invalid.
 * 
 * @param {string|number} value - The value to parse
 * @param {number} [defaultValue=0] - Default value if parsing fails
 * @returns {number} The parsed number or default
 * 
 * @example
 * parseNum('42') // returns 42
 * parseNum('abc', 10) // returns 10
 */
export function parseNum(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Parse an integer from a string, returning a default if invalid.
 * 
 * @param {string|number} value - The value to parse
 * @param {number} [defaultValue=0] - Default value if parsing fails
 * @returns {number} The parsed integer or default
 */
export function parseInt10(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

/**
 * Check if a value is a valid number.
 * 
 * @param {*} value - The value to check
 * @returns {boolean} True if the value is a valid number
 */
export function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Generate a random integer between min and max (inclusive).
 * 
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} A random integer
 * 
 * @example
 * randomInt(1, 6) // returns a number between 1 and 6
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate rolling dice.
 * 
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides on each die
 * @returns {{rolls: number[], total: number}} The individual rolls and total
 * 
 * @example
 * rollDice(2, 6) // returns {rolls: [4, 2], total: 6}
 */
export function rollDice(count, sides) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(randomInt(1, sides));
    }
    return {
        rolls,
        total: rolls.reduce((sum, roll) => sum + roll, 0)
    };
}

/**
 * Format dice notation (e.g., "2d6+3").
 * 
 * @param {number} count - Number of dice
 * @param {number} sides - Number of sides
 * @param {number} [modifier=0] - Modifier to add
 * @returns {string} Formatted dice notation
 * 
 * @example
 * formatDice(2, 6, 3) // returns '2d6+3'
 * formatDice(1, 8, -1) // returns '1d8-1'
 */
export function formatDice(count, sides, modifier = 0) {
    let notation = `${count}d${sides}`;
    if (modifier > 0) {
        notation += `+${modifier}`;
    } else if (modifier < 0) {
        notation += `${modifier}`;
    }
    return notation;
}

/**
 * Calculate the sum of an array of numbers.
 * 
 * @param {number[]} values - Array of numbers
 * @returns {number} The sum
 */
export function sum(values) {
    return values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
}

/**
 * Calculate the average of an array of numbers.
 * 
 * @param {number[]} values - Array of numbers
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {number} The average
 */
export function average(values, decimals = 2) {
    if (!values || values.length === 0) return 0;
    return round(sum(values) / values.length, decimals);
}

/**
 * Compute dice splits for optimization.
 * Used for determining optimal dice combinations.
 * 
 * @param {number} diceAmt - Number of dice
 * @param {number} dieSize - Size of die
 * @returns {number} Number of splits possible
 */
export function computeSplits(diceAmt, dieSize) {
    const valid = [4, 6, 8, 10, 12];
    if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
    const total = diceAmt * dieSize;
    const minDiceUsingD12 = Math.ceil(total / 12);
    return Math.max(0, diceAmt - minDiceUsingD12);
}
