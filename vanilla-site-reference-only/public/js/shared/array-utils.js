/**
 * RealmsRPG Shared Utilities - Array Functions
 * =============================================
 * Centralized array manipulation functions.
 */

/**
 * Convert a value to an array of strings.
 * Handles arrays, objects, and single values.
 * 
 * @param {*} value - The value to convert
 * @returns {string[]} An array of strings
 * 
 * @example
 * toStrArray(['a', 'b']) // returns ['a', 'b']
 * toStrArray({0: 'a', 1: 'b'}) // returns ['a', 'b']
 * toStrArray('single') // returns ['single']
 * toStrArray(null) // returns []
 */
export function toStrArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(item => String(item));
    }
    if (typeof value === 'object') {
        return Object.values(value).map(item => String(item));
    }
    return [String(value)];
}

/**
 * Convert a value to an array of numbers.
 * Handles arrays, objects, and single values.
 * 
 * @param {*} value - The value to convert
 * @returns {number[]} An array of numbers
 * 
 * @example
 * toNumArray([1, '2', 3]) // returns [1, 2, 3]
 * toNumArray({0: 1, 1: 2}) // returns [1, 2]
 * toNumArray(42) // returns [42]
 */
export function toNumArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(item => Number(item) || 0);
    }
    if (typeof value === 'object') {
        return Object.values(value).map(item => Number(item) || 0);
    }
    return [Number(value) || 0];
}

/**
 * Remove duplicate values from an array.
 * 
 * @param {Array} arr - The array to deduplicate
 * @returns {Array} A new array with unique values
 * 
 * @example
 * unique([1, 2, 2, 3, 3, 3]) // returns [1, 2, 3]
 */
export function unique(arr) {
    if (!arr) return [];
    return [...new Set(arr)];
}

/**
 * Remove duplicate objects from an array based on a key.
 * 
 * @param {Object[]} arr - The array of objects
 * @param {string} key - The key to check for uniqueness
 * @returns {Object[]} A new array with unique objects
 * 
 * @example
 * uniqueBy([{id: 1, name: 'a'}, {id: 1, name: 'b'}], 'id')
 * // returns [{id: 1, name: 'a'}]
 */
export function uniqueBy(arr, key) {
    if (!arr) return [];
    const seen = new Set();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

/**
 * Group an array of objects by a key.
 * 
 * @param {Object[]} arr - The array to group
 * @param {string} key - The key to group by
 * @returns {Object} An object with keys as group names and arrays as values
 * 
 * @example
 * groupBy([{type: 'a', name: 'x'}, {type: 'b', name: 'y'}, {type: 'a', name: 'z'}], 'type')
 * // returns {a: [{type: 'a', name: 'x'}, {type: 'a', name: 'z'}], b: [{type: 'b', name: 'y'}]}
 */
export function groupBy(arr, key) {
    if (!arr) return {};
    return arr.reduce((groups, item) => {
        const group = item[key] || 'unknown';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
}

/**
 * Sort an array of objects by a key.
 * 
 * @param {Object[]} arr - The array to sort
 * @param {string} key - The key to sort by
 * @param {'asc'|'desc'} [direction='asc'] - Sort direction
 * @returns {Object[]} A new sorted array
 * 
 * @example
 * sortBy([{name: 'b'}, {name: 'a'}], 'name') // returns [{name: 'a'}, {name: 'b'}]
 */
export function sortBy(arr, key, direction = 'asc') {
    if (!arr) return [];
    const multiplier = direction === 'desc' ? -1 : 1;
    return [...arr].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (typeof valA === 'string' && typeof valB === 'string') {
            return multiplier * valA.localeCompare(valB);
        }
        if (valA < valB) return -1 * multiplier;
        if (valA > valB) return 1 * multiplier;
        return 0;
    });
}

/**
 * Filter an array by a search term across multiple fields.
 * 
 * @param {Object[]} arr - The array to filter
 * @param {string} searchTerm - The search term
 * @param {string[]} fields - The fields to search in
 * @returns {Object[]} Filtered array
 * 
 * @example
 * filterBySearch([{name: 'Fire', type: 'magic'}], 'fir', ['name', 'type'])
 * // returns [{name: 'Fire', type: 'magic'}]
 */
export function filterBySearch(arr, searchTerm, fields) {
    if (!arr || !searchTerm) return arr || [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return arr;
    
    return arr.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(term);
        });
    });
}

/**
 * Chunk an array into smaller arrays of a specified size.
 * 
 * @param {Array} arr - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array[]} An array of chunks
 * 
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // returns [[1, 2], [3, 4], [5]]
 */
export function chunk(arr, size) {
    if (!arr || size < 1) return [];
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Flatten a nested array.
 * 
 * @param {Array} arr - The array to flatten
 * @param {number} [depth=1] - The depth to flatten
 * @returns {Array} The flattened array
 * 
 * @example
 * flatten([[1, 2], [3, 4]]) // returns [1, 2, 3, 4]
 */
export function flatten(arr, depth = 1) {
    if (!arr) return [];
    return arr.flat(depth);
}

/**
 * Get the first N items from an array.
 * 
 * @param {Array} arr - The array
 * @param {number} [n=1] - Number of items to take
 * @returns {Array} The first N items
 */
export function take(arr, n = 1) {
    if (!arr) return [];
    return arr.slice(0, n);
}

/**
 * Get the last N items from an array.
 * 
 * @param {Array} arr - The array
 * @param {number} [n=1] - Number of items to take
 * @returns {Array} The last N items
 */
export function takeLast(arr, n = 1) {
    if (!arr) return [];
    return arr.slice(-n);
}

/**
 * Check if an array is empty or null/undefined.
 * 
 * @param {Array} arr - The array to check
 * @returns {boolean} True if empty or null/undefined
 */
export function isEmpty(arr) {
    return !arr || arr.length === 0;
}

/**
 * Find an item in an array by a key-value pair.
 * 
 * @param {Object[]} arr - The array to search
 * @param {string} key - The key to match
 * @param {*} value - The value to find
 * @returns {Object|undefined} The found item or undefined
 * 
 * @example
 * findBy([{id: 1, name: 'a'}, {id: 2, name: 'b'}], 'id', 2)
 * // returns {id: 2, name: 'b'}
 */
export function findBy(arr, key, value) {
    if (!arr) return undefined;
    return arr.find(item => item[key] === value);
}

/**
 * Remove an item from an array by value (returns new array).
 * 
 * @param {Array} arr - The array
 * @param {*} value - The value to remove
 * @returns {Array} A new array without the value
 */
export function removeItem(arr, value) {
    if (!arr) return [];
    return arr.filter(item => item !== value);
}

/**
 * Remove an item from an array by key-value (returns new array).
 * 
 * @param {Object[]} arr - The array
 * @param {string} key - The key to match
 * @param {*} value - The value to match
 * @returns {Object[]} A new array without the matching item
 */
export function removeBy(arr, key, value) {
    if (!arr) return [];
    return arr.filter(item => item[key] !== value);
}

/**
 * Shuffle an array randomly.
 * 
 * @param {Array} arr - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffle(arr) {
    if (!arr) return [];
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Get the intersection of two arrays.
 * 
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Items that exist in both arrays
 */
export function intersection(arr1, arr2) {
    if (!arr1 || !arr2) return [];
    const set2 = new Set(arr2);
    return arr1.filter(item => set2.has(item));
}

/**
 * Get the difference between two arrays.
 * 
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Items in arr1 that are not in arr2
 */
export function difference(arr1, arr2) {
    if (!arr1) return [];
    if (!arr2) return [...arr1];
    const set2 = new Set(arr2);
    return arr1.filter(item => !set2.has(item));
}
