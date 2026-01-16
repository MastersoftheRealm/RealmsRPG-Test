/**
 * Roll Log Component
 * A sticky panel that displays all dice rolls in a DND Beyond-like style
 * Opens from bottom-right corner, tracks up to 20 rolls
 */

const MAX_ROLLS = 20;
let rollLog = [];
let isRollLogOpen = false;
let rollLogElement = null;

// Dice roller state
const dicePool = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 };

/**
 * Initialize the roll log component
 * Creates the toggle button and log container in the DOM
 */
export function initRollLog() {
    if (document.getElementById('roll-log-container')) return;
    
    // Create container that holds button and log panel
    const container = document.createElement('div');
    container.id = 'roll-log-container';
    container.className = 'roll-log-container';
    
    // Create toggle button with dice image
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'roll-log-toggle';
    toggleBtn.className = 'roll-log-toggle';
    toggleBtn.innerHTML = '<img src="/images/RD20.png" alt="Roll Log" class="toggle-dice-img">';
    toggleBtn.title = 'Toggle Roll Log';
    toggleBtn.onclick = toggleRollLog;
    
    // Create log panel
    const logPanel = document.createElement('div');
    logPanel.id = 'roll-log-panel';
    logPanel.className = 'roll-log-panel';
    
    // Header with title and clear button
    const header = document.createElement('div');
    header.className = 'roll-log-header';
    header.innerHTML = `
        <h3>Roll Log</h3>
        <button class="roll-log-clear" title="Clear all rolls" onclick="window.clearRollLog()">🗑️ Clear</button>
    `;
    
    // Scrollable roll list
    const rollList = document.createElement('div');
    rollList.id = 'roll-log-list';
    rollList.className = 'roll-log-list';
    rollList.innerHTML = '<div class="roll-log-empty">No rolls yet. Roll some dice!</div>';
    
    // Dice roller section
    const diceRoller = document.createElement('div');
    diceRoller.id = 'dice-roller-section';
    diceRoller.className = 'dice-roller-section';
    diceRoller.innerHTML = `
        <div class="dice-roller-row">
            <button id="dice-roll-btn" class="dice-roll-all-btn" style="display:none;" onclick="window.rollDicePool()">Roll</button>
            <div class="dice-buttons">
                <div class="dice-btn-wrapper" data-die="d4">
                    <img src="/images/D4.png" alt="d4" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
                <div class="dice-btn-wrapper" data-die="d6">
                    <img src="/images/D6.png" alt="d6" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
                <div class="dice-btn-wrapper" data-die="d8">
                    <img src="/images/D8.png" alt="d8" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
                <div class="dice-btn-wrapper" data-die="d10">
                    <img src="/images/D10.png" alt="d10" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
                <div class="dice-btn-wrapper" data-die="d12">
                    <img src="/images/D12.png" alt="d12" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
                <div class="dice-btn-wrapper" data-die="d20">
                    <img src="/images/D20_1.png" alt="d20" class="dice-img" oncontextmenu="return false;">
                    <span class="dice-count" style="display:none;">0</span>
                </div>
            </div>
        </div>
    `;
    
    logPanel.appendChild(header);
    logPanel.appendChild(rollList);
    logPanel.appendChild(diceRoller);
    
    container.appendChild(logPanel);
    container.appendChild(toggleBtn);
    
    document.body.appendChild(container);
    rollLogElement = logPanel;
    
    // Setup dice button click handlers
    setupDiceButtons();
    
    // Expose functions globally
    window.clearRollLog = clearRollLog;
    window.addRoll = addRoll;
    window.toggleRollLog = toggleRollLog;
    window.openRollLog = openRollLog;
    window.rollDicePool = rollDicePool;
}

/**
 * Setup click/right-click handlers for dice buttons
 */
function setupDiceButtons() {
    setTimeout(() => {
        const wrappers = document.querySelectorAll('.dice-btn-wrapper');
        wrappers.forEach(wrapper => {
            const die = wrapper.dataset.die;
            const img = wrapper.querySelector('.dice-img');
            
            // Left click: add die
            img.addEventListener('click', () => {
                dicePool[die]++;
                updateDiceUI();
            });
            
            // Right click: remove die
            img.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (dicePool[die] > 0) {
                    dicePool[die]--;
                    updateDiceUI();
                }
            });
        });
    }, 0);
}

/**
 * Update the dice roller UI to reflect current pool
 */
function updateDiceUI() {
    const hasAnyDice = Object.values(dicePool).some(v => v > 0);
    const rollBtn = document.getElementById('dice-roll-btn');
    
    if (rollBtn) {
        rollBtn.style.display = hasAnyDice ? 'block' : 'none';
    }
    
    Object.entries(dicePool).forEach(([die, count]) => {
        const wrapper = document.querySelector(`.dice-btn-wrapper[data-die="${die}"]`);
        if (wrapper) {
            const countEl = wrapper.querySelector('.dice-count');
            if (countEl) {
                countEl.textContent = count;
                countEl.style.display = count > 0 ? 'flex' : 'none';
            }
            wrapper.classList.toggle('has-dice', count > 0);
        }
    });
}

/**
 * Roll all dice in the pool
 */
function rollDicePool() {
    const rolls = [];
    let total = 0;
    const diceStr = [];
    
    Object.entries(dicePool).forEach(([die, count]) => {
        if (count > 0) {
            const size = parseInt(die.substring(1));
            diceStr.push(`${count}${die}`);
            for (let i = 0; i < count; i++) {
                const result = Math.floor(Math.random() * size) + 1;
                rolls.push({ die, size, result });
                total += result;
            }
        }
    });
    
    if (rolls.length === 0) return;
    
    // Add to roll log
    addRoll({
        type: 'damage',
        title: 'Dice Roll',
        diceRolls: rolls.map(r => r.result),
        diceDetails: rolls,
        modifier: 0,
        total: total
    });
    
    // Clear the pool
    Object.keys(dicePool).forEach(k => dicePool[k] = 0);
    updateDiceUI();
}

/**
 * Toggle the roll log panel open/closed
 */
function toggleRollLog() {
    isRollLogOpen = !isRollLogOpen;
    const panel = document.getElementById('roll-log-panel');
    const btn = document.getElementById('roll-log-toggle');
    
    if (isRollLogOpen) {
        panel?.classList.add('open');
        btn?.classList.add('active');
        // Scroll to bottom to show latest roll
        const list = document.getElementById('roll-log-list');
        if (list) list.scrollTop = list.scrollHeight;
    } else {
        panel?.classList.remove('open');
        btn?.classList.remove('active');
    }
}

/**
 * Open the roll log (if not already open)
 */
function openRollLog() {
    if (!isRollLogOpen) {
        toggleRollLog();
    } else {
        // Just scroll to bottom
        const list = document.getElementById('roll-log-list');
        if (list) list.scrollTop = list.scrollHeight;
    }
}

/**
 * Clear all rolls from the log
 */
function clearRollLog() {
    rollLog = [];
    renderRollLog();
}

/**
 * Add a new roll to the log
 * @param {Object} roll - Roll data
 * @param {string} roll.type - Type of roll (skill, attack, damage, ability, defense)
 * @param {string} roll.title - Display title for the roll
 * @param {number} roll.dieResult - The raw die result (for d20 rolls)
 * @param {number} roll.modifier - The modifier added to the roll
 * @param {number} roll.total - The total result
 * @param {boolean} roll.isCritSuccess - Whether it's a natural 20
 * @param {boolean} roll.isCritFail - Whether it's a natural 1
 * @param {Array} roll.diceRolls - Array of individual die results (for damage)
 * @param {string} roll.damageType - Type of damage (for damage rolls)
 * @param {string} roll.critMessage - Custom crit message
 */
function addRoll(roll) {
    const timestamp = new Date();
    rollLog.push({
        ...roll,
        id: Date.now(),
        timestamp
    });
    
    // Keep only last MAX_ROLLS
    if (rollLog.length > MAX_ROLLS) {
        rollLog = rollLog.slice(-MAX_ROLLS);
    }
    
    renderRollLog();
    openRollLog();
}

/**
 * Render the roll log to the DOM
 */
function renderRollLog() {
    const list = document.getElementById('roll-log-list');
    if (!list) return;
    
    if (rollLog.length === 0) {
        list.innerHTML = '<div class="roll-log-empty">No rolls yet. Roll some dice!</div>';
        return;
    }
    
    list.innerHTML = rollLog.map(roll => createRollEntry(roll)).join('');
    
    // Scroll to bottom to show latest roll
    list.scrollTop = list.scrollHeight;
}

/**
 * Create HTML for a single roll entry
 * @param {Object} roll - Roll data
 * @returns {string} HTML string
 */
function createRollEntry(roll) {
    const timeStr = roll.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine roll type styling
    let typeClass = 'roll-type-default';
    let typeIcon = '🎲';
    
    switch (roll.type) {
        case 'attack':
            typeClass = 'roll-type-attack';
            typeIcon = '⚔️';
            break;
        case 'damage':
            typeClass = 'roll-type-damage';
            typeIcon = '💥';
            break;
        case 'skill':
            typeClass = 'roll-type-skill';
            typeIcon = '🎯';
            break;
        case 'ability':
            typeClass = 'roll-type-ability';
            typeIcon = '💪';
            break;
        case 'defense':
            typeClass = 'roll-type-defense';
            typeIcon = '🛡️';
            break;
    }
    
    // Build the dice display - group by die type
    const diceGroups = groupDiceByType(roll);
    const diceGroupsHTML = buildDiceGroupsHTML(diceGroups);
    
    // Calculate dice subtotal (sum of all dice without modifiers)
    const diceSubtotal = diceGroups.reduce((sum, g) => sum + g.results.reduce((s, r) => s + r, 0), 0);
    
    // Build the result section
    const modifier = roll.modifier || 0;
    const total = roll.total;
    
    // For d20 rolls, check for crits
    const dieResultClass = roll.isCritSuccess ? 'crit-success' : (roll.isCritFail ? 'crit-fail' : '');
    const critIndicator = roll.isCritSuccess ? '<span class="crit-indicator success">NAT 20!</span>' : 
                          (roll.isCritFail ? '<span class="crit-indicator fail">NAT 1!</span>' : '');
    
    // Build result HTML
    let resultHTML = '';
    if (modifier !== 0) {
        resultHTML = `
            <span class="roll-subtotal">${diceSubtotal}</span>
            <span class="roll-operator">${modifier >= 0 ? '+' : '−'}</span>
            <span class="roll-modifier-value">${Math.abs(modifier)}</span>
            <span class="roll-equals">=</span>
            <span class="roll-total-value">${total}</span>
        `;
    } else {
        resultHTML = `
            <span class="roll-subtotal">${diceSubtotal}</span>
            <span class="roll-equals">=</span>
            <span class="roll-total-value">${total}</span>
        `;
    }
    
    // Add damage type if present
    if (roll.damageType) {
        resultHTML += ` <span class="damage-type">${roll.damageType}</span>`;
    }
    
    return `
        <div class="roll-entry ${typeClass} ${dieResultClass ? 'is-crit' : ''}">
            <div class="roll-entry-header">
                <span class="roll-icon">${typeIcon}</span>
                <span class="roll-title">${roll.title}</span>
                <span class="roll-time">${timeStr}</span>
            </div>
            <div class="roll-entry-body roll-new-format">
                <div class="roll-dice-groups">
                    ${diceGroupsHTML}
                </div>
                <div class="roll-result">
                    ${resultHTML}
                </div>
                ${critIndicator}
            </div>
            ${roll.critMessage ? `<div class="roll-crit-message">${roll.critMessage}</div>` : ''}
        </div>
    `;
}

/**
 * Group dice by type from roll data
 * @param {Object} roll - Roll data
 * @returns {Array} Array of {die, count, results} objects
 */
function groupDiceByType(roll) {
    const groups = [];
    
    // Handle detailed dice info (from dice pool roller)
    if (roll.diceDetails && roll.diceDetails.length > 0) {
        const grouped = {};
        roll.diceDetails.forEach(d => {
            const die = d.die.toLowerCase();
            if (!grouped[die]) {
                grouped[die] = { die, size: d.size, results: [] };
            }
            grouped[die].results.push(d.result);
        });
        return Object.values(grouped);
    }
    
    // Handle d20 rolls (skill, attack, ability, defense)
    if (roll.dieResult !== undefined) {
        return [{ die: 'd20', size: 20, results: [roll.dieResult] }];
    }
    
    // Handle damage rolls with diceRolls array
    if (roll.diceRolls && roll.diceRolls.length > 0) {
        // Try to parse dice notation from title (e.g., "2d6 + 3")
        const diceMatch = roll.title?.match(/(\d+)d(\d+)/i);
        if (diceMatch) {
            const size = parseInt(diceMatch[2]);
            return [{ die: `d${size}`, size, results: roll.diceRolls }];
        }
        // Default to showing as generic dice
        return [{ die: 'd?', size: 0, results: roll.diceRolls }];
    }
    
    return [];
}

/**
 * Build HTML for dice groups (image + notation)
 * @param {Array} groups - Array of {die, count, results} objects
 * @returns {string} HTML string
 */
function buildDiceGroupsHTML(groups) {
    if (groups.length === 0) return '';
    
    return groups.map(group => {
        const imgSrc = getDiceImageSrc(group.die);
        const count = group.results.length;
        const notation = `${count}${group.die}`;
        const hoverText = group.results.join(', ');
        
        return `
            <div class="dice-group">
                <img src="${imgSrc}" alt="${group.die}" class="dice-group-img">
                <span class="dice-group-notation" title="${hoverText}">${notation}</span>
            </div>
        `;
    }).join('');
}

/**
 * Get the image source for a die type
 * @param {string} die - Die type (e.g., 'd6', 'd20')
 * @returns {string} Image path
 */
function getDiceImageSrc(die) {
    const dieType = die.toLowerCase();
    switch (dieType) {
        case 'd4': return '/images/D4.png';
        case 'd6': return '/images/D6.png';
        case 'd8': return '/images/D8.png';
        case 'd10': return '/images/D10.png';
        case 'd12': return '/images/D12.png';
        case 'd20': return '/images/D20_1.png';
        default: return '/images/D20_1.png'; // Fallback
    }
}

// Export for ES modules
export { addRoll, clearRollLog, toggleRollLog, openRollLog };
