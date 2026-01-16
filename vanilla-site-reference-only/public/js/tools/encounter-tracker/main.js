document.addEventListener("DOMContentLoaded", () => {
    const initiativeList = document.querySelector(".initiative-list");
    const startEncounterButton = document.getElementById("start-encounter");
    const nextTurnButton = document.getElementById("next-turn");
    const clearEncounterButton = document.getElementById("clear-encounter");
    const resetEncounterButton = document.getElementById("reset-encounter");
    const sortInitiativeButton = document.getElementById("sort-initiative");
    const addEntryButton = document.getElementById("add-entry");
    const applySurpriseCheckbox = document.getElementById("apply-surprise");
    const roundNumberDisplay = document.getElementById("round-number");

    let initiativeEntries = [];
    let currentTurnIndex = 0;
    let roundNumber = 0;
    let hasSortedAfterFirstRound = false;

    const conditionOptions = [
        { name: "Bleeding", decaying: true, description: "Bleeding creatures lose 1 Hit Point for each level of bleeding at the beginning of their turn. Any healing received reduces the bleeding condition by the amount healed." },
        { name: "Blinded", decaying: false, description: "All targets are considered completely obscured to a blinded creature that relies on basic vision. Acuity Skill rolls that rely on sight automatically fail." },
        { name: "Charmed", decaying: false, description: "Charmed creatures can't attack or perform harmful Actions against the creature that charmed them. All Charisma rolls and potencies against this target from the charmer gain +2." },
        { name: "Dazed", decaying: false, description: "Dazed creatures cannot take Reactions." },
        { name: "Deafened", decaying: false, description: "You cannot hear anything in the world around you. You have resistance to sonic damage. Acuity Skill rolls that rely on hearing automatically fail." },
        { name: "Dying", decaying: false, description: "When your Hit Point total is reduced to zero or a negative value, you enter the dying condition. Each turn, at the beginning of your turn, you take 1d4 irreducible damage, doubling each turn." },
        { name: "Exhausted", decaying: false, description: "Exhaustion reduces all bonuses and Evasion by an amount equal to its level. At level 10, the character dies." },
        { name: "Exposed", decaying: true, description: "Exposed creatures decrease their Evasion by 1 for each level of Exposed." },
        { name: "Faint", decaying: false, description: "You have -1 to Evasion, Might, Reflex, and on all D20 rolls requiring balance or poise." },
        { name: "Frightened", decaying: false, description: "Frightened creatures have -2 on all scores and D20 rolls against the source of their fear." },
        { name: "Grappled", decaying: false, description: "Grappled targets have -2 to attack rolls, are +2 to hit, and cannot take movement Actions." },
        { name: "Hidden", decaying: false, description: "While hidden, you have a +2 bonus on attack rolls made against creatures unaware of your location." },
        { name: "Immobile", decaying: false, description: "Immobile creatures cannot take Movement Actions, and their Speed is considered 0." },
        { name: "Invisible", decaying: false, description: "You are considered completely obscured to all creatures relying on basic vision." },
        { name: "Prone", decaying: false, description: "While prone, your movement speed is reduced by ½. You are +2 to hit by others and have -2 to hit others." },
        { name: "Resilient", decaying: true, description: "Resilient creatures take 1 less damage each time they are damaged per Resilient level." },
        { name: "Slowed", decaying: true, description: "Slowed creatures lose 1 or more movement speed depending on the level of Slowed." },
        { name: "Stunned", decaying: true, description: "Stunned creatures lose 1 or more Action Points based on the level of Stun." },
        { name: "Susceptible", decaying: true, description: "Susceptible creatures take 1 extra damage each time they are damaged per Susceptible level." },
        { name: "Terminal", decaying: false, description: "Your current health is at or below ¼ of your maximum health, placing you in the Terminal Range." },
        { name: "Weakened", decaying: true, description: "Weakened creatures decrease all D20 rolls by 1 or more depending on the level of Weakened." },
        { name: "Add Custom", decaying: true, description: "Custom conditions are automatically classified as decaying." }
    ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    function createEntry() {
        const entry = document.createElement("div");
        entry.className = "initiative-entry";
        entry.draggable = true;
        entry.dataset.id = `entry-${Date.now()}`;
        entry.innerHTML = `
            <span class="toggle-conditions">↓</span>
            <input type="text" class="creature-name" placeholder="Creature Name" maxlength="50">
            <input type="number" class="initiative-roll" placeholder="Roll" min="1" max="20">
            <input type="number" class="acuity-score" placeholder="Acuity" step="1">
            <div class="side-toggle">
                <label>
                    <input type="radio" name="side-${Date.now()}" value="ally" checked> Ally
                </label>
                <label>
                    <input type="radio" name="side-${Date.now()}" value="enemy"> Enemy
                </label>
            </div>
            <label class="surprised-checkbox">
                <input type="checkbox"> Surprised
            </label>
            <div class="ap-tracker">
                <input type="number" class="hp-input current-hp" placeholder="HP" min="-9999">
                <input type="number" class="hp-input max-hp" placeholder="Max" min="0">
                <span class="ap-label">AP</span>
                <button class="decrease-ap">-</button>
                <span class="ap-value">4</span>
                <button class="increase-ap">+</button>
            </div>
            <button class="remove-entry">X</button>
            <div class="conditions-section">
                <span class="conditions-label">Conditions:</span>
                <select class="conditions-select">
                    <option value="">Select Condition</option>
                    ${conditionOptions.map(opt => `<option value="${opt.name}" data-decaying="${opt.decaying}" title="${opt.description}">${opt.name}</option>`).join('')}
                </select>
                <div class="conditions-list"></div>
            </div>
        `;
        initiativeList.appendChild(entry);

        // Toggle conditions section
        const toggleButton = entry.querySelector(".toggle-conditions");
        const conditionsSection = entry.querySelector(".conditions-section");
        toggleButton.addEventListener("click", () => {
            conditionsSection.classList.toggle("active");
            toggleButton.textContent = conditionsSection.classList.contains("active") ? "↑" : "↓";
        });

        // Drag-and-drop logic
        entry.addEventListener("dragstart", handleDragStart);
        entry.addEventListener("dragover", handleDragOver);
        entry.addEventListener("drop", handleDrop);
        entry.addEventListener("dragend", handleDragEnd);

        // AP logic
        const apValue = entry.querySelector(".ap-value");
        entry.querySelector(".increase-ap").addEventListener("click", () => {
            apValue.textContent = Math.min(10, parseInt(apValue.textContent) + 1);
        });
        entry.querySelector(".decrease-ap").addEventListener("click", () => {
            apValue.textContent = Math.max(0, parseInt(apValue.textContent) - 1);
        });

        // HP logic
        const currentHpInput = entry.querySelector(".current-hp");
        const maxHpInput = entry.querySelector(".max-hp");
        const sideToggle = entry.querySelector("input[name^='side']");
        currentHpInput.addEventListener("input", () => {
            const currentHp = parseInt(currentHpInput.value) || 0;
            const maxHp = parseInt(maxHpInput.value) || 0;
            if (sideToggle.value === "enemy" && currentHp === 0) {
                entry.classList.add("enemy-zero-hp");
            } else {
                entry.classList.remove("enemy-zero-hp");
            }
        });

        maxHpInput.addEventListener("input", () => {
            const maxHp = parseInt(maxHpInput.value) || 0;
            if (maxHp < 0) maxHpInput.value = 0; // Prevent max HP from being negative
        });

        // Conditions logic
        const conditionsContainer = entry.querySelector(".conditions-list");
        const conditionsSelect = entry.querySelector(".conditions-select");
        conditionsSelect.addEventListener("change", (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            let conditionName = selectedOption.value;
            const isDecaying = selectedOption.dataset.decaying === "true";

            if (conditionName === "Add Custom") {
                conditionName = prompt("Enter custom condition name:");
                if (!conditionName) {
                    e.target.value = "";
                    return;
                }
            }

            if (conditionName) {
                const conditionElement = document.createElement("div");
                conditionElement.className = "condition";
                conditionElement.textContent = conditionName;
                conditionElement.title = selectedOption.title || "Custom condition";
                if (isDecaying) {
                    conditionElement.classList.add("decaying");
                    conditionElement.dataset.level = 1;
                }
                conditionsContainer.appendChild(conditionElement);
            }
            e.target.value = ""; // Reset dropdown
        });

        conditionsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("condition")) {
                const isDecaying = e.target.classList.contains("decaying");
                if (isDecaying) {
                    const level = parseInt(e.target.dataset.level);
                    e.target.dataset.level = level + 1;
                }
            }
        });

        conditionsContainer.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (e.target.classList.contains("condition")) {
                const isDecaying = e.target.classList.contains("decaying");
                if (isDecaying) {
                    const level = parseInt(e.target.dataset.level);
                    if (level > 1) {
                        e.target.dataset.level = level - 1;
                    } else {
                        e.target.remove();
                    }
                } else {
                    e.target.remove();
                }
            }
        });

        entry.querySelector(".remove-entry").addEventListener("click", () => {
            entry.remove();
            updateInitiativeEntries();
        });

        updateInitiativeEntries();
    }

    function handleDragStart(e) {
        e.target.classList.add("dragging");
        e.dataTransfer.setData("text/plain", e.target.dataset.id);
    }

    function handleDragOver(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(initiativeList, e.clientY);
        const dragging = document.querySelector(".dragging");
        if (afterElement == null) {
            initiativeList.appendChild(dragging);
        } else {
            initiativeList.insertBefore(dragging, afterElement);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
    }

    function handleDragEnd(e) {
        e.target.classList.remove("dragging");
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".initiative-entry:not(.dragging)")];

        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }

    function sortInitiative() {
        const allies = [];
        const enemies = [];

        initiativeEntries = Array.from(initiativeList.children).map(entry => ({
            element: entry,
            name: entry.querySelector(".creature-name").value,
            roll: parseInt(entry.querySelector(".initiative-roll").value) || 0,
            acuity: parseInt(entry.querySelector(".acuity-score").value) || 0,
            side: entry.querySelector("input[name^='side']:checked").value,
            surprised: entry.querySelector(".surprised-checkbox input").checked
        }));

        initiativeEntries.forEach(entry => {
            if (entry.side === "ally") {
                allies.push(entry);
            } else {
                enemies.push(entry);
            }
        });

        const sortByRollAndAcuity = (a, b) => {
            if (a.roll !== b.roll) return b.roll - a.roll;
            return b.acuity - a.acuity;
        };

        allies.sort(sortByRollAndAcuity);
        enemies.sort(sortByRollAndAcuity);

        if (applySurpriseCheckbox.checked && roundNumber === 0 && !hasSortedAfterFirstRound) {
            const nonSurprisedAllies = allies.filter(entry => !entry.surprised);
            const surprisedAllies = allies.filter(entry => entry.surprised);
            const nonSurprisedEnemies = enemies.filter(entry => !entry.surprised);
            const surprisedEnemies = enemies.filter(entry => entry.surprised);

            allies = [...nonSurprisedAllies, ...surprisedAllies];
            enemies = [...nonSurprisedEnemies, ...surprisedEnemies];
        }

        // Determine which side has the highest initiative to start
        const firstAlly = allies[0];
        const firstEnemy = enemies[0];
        let startWithAlly = true;

        if (firstAlly && firstEnemy) {
            startWithAlly = sortByRollAndAcuity(firstAlly, firstEnemy) <= 0; // Start with the higher initiative
        } else if (!firstAlly) {
            startWithAlly = false; // No allies, start with enemies
        }

        initiativeEntries = [];
        while (allies.length || enemies.length) {
            if (startWithAlly && allies.length) initiativeEntries.push(allies.shift());
            if (!startWithAlly && enemies.length) initiativeEntries.push(enemies.shift());
            startWithAlly = !startWithAlly; // Alternate between allies and enemies
        }

        initiativeList.innerHTML = "";
        initiativeEntries.forEach(entry => initiativeList.appendChild(entry.element));
    }

    function startEncounter() {
        sortInitiative();
        startEncounterButton.disabled = true;
        nextTurnButton.disabled = false;
        resetEncounterButton.disabled = false;
        currentTurnIndex = 0;
        roundNumber = 0;
        updateRoundNumber();
        highlightCurrentTurn();
    }

    function highlightCurrentTurn() {
        initiativeEntries.forEach((entry, index) => {
            entry.element.classList.toggle("active-turn", index === currentTurnIndex);
        });
    }

    function nextTurn() {
        // Reset AP for the current creature at the end of their turn
        initiativeEntries[currentTurnIndex].element.querySelector(".ap-value").textContent = 4;

        currentTurnIndex = (currentTurnIndex + 1) % initiativeEntries.length;
        if (currentTurnIndex === 0) {
            roundNumber++;
            updateRoundNumber();
            if (roundNumber === 1 && applySurpriseCheckbox.checked && !hasSortedAfterFirstRound) {
                hasSortedAfterFirstRound = true;
                sortInitiative(); // Re-sort for round 2, ignoring surprise
            }
        }
        highlightCurrentTurn();
    }

    function updateRoundNumber() {
        roundNumberDisplay.textContent = roundNumber;
    }

    function clearEncounter() {
        initiativeList.innerHTML = "";
        createEntry();
        initiativeEntries = [];
        currentTurnIndex = 0;
        roundNumber = 0;
        updateRoundNumber();
        startEncounterButton.disabled = false;
        nextTurnButton.disabled = true;
    }

    function resetEncounter() {
        initiativeEntries.forEach(entry => {
            const currentHpInput = entry.element.querySelector(".current-hp");
            const maxHpInput = entry.element.querySelector(".max-hp");
            const apValue = entry.element.querySelector(".ap-value");
            const conditionsContainer = entry.element.querySelector(".conditions-list");
            const initiativeRollInput = entry.element.querySelector(".initiative-roll");

            // Reset HP to max
            currentHpInput.value = maxHpInput.value;

            // Reset AP to 4
            apValue.textContent = 4;

            // Clear conditions
            conditionsContainer.innerHTML = "";

            // Clear initiative roll
            initiativeRollInput.value = "";
        });
    }

    function updateInitiativeEntries() {
        initiativeEntries = Array.from(initiativeList.children).map(entry => ({
            element: entry,
            name: entry.querySelector(".creature-name").value,
            roll: parseInt(entry.querySelector(".initiative-roll").value) || 0,
            acuity: parseInt(entry.querySelector(".acuity-score").value) || 0,
            side: entry.querySelector("input[name^='side']:checked").value,
            surprised: entry.querySelector(".surprised-checkbox input").checked
        }));
    }

    createEntry();

    clearEncounterButton.addEventListener("click", clearEncounter);
    resetEncounterButton.addEventListener("click", resetEncounter);
    sortInitiativeButton.addEventListener("click", sortInitiative);
    startEncounterButton.addEventListener("click", startEncounter);
    nextTurnButton.addEventListener("click", nextTurn);
    addEntryButton.addEventListener("click", createEntry);
});