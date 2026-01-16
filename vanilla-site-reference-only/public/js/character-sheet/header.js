export function renderHeader(character) {
    const container = document.getElementById('header-section');
    if (!container) return;

    const speed = character.speed || 6;
    const evasion = character.evasion || 10;
    const currentHealth = character.currentHealth ?? character.hitPoints ?? 0;
    const maxHealth = character.hitPoints || 0;
    const currentEnergy = character.currentEnergy ?? character.energy ?? 0;
    const maxEnergy = character.energy || 0;
    const terminal = Math.ceil(maxHealth / 4);
    
    // Calculate innate threshold using archetype progression
    let innateThreshold = 0;
    if (typeof window.calculateArchetypeProgression === 'function') {
        const progression = window.calculateArchetypeProgression(
            character.level || 1,
            character.mart_prof || 0,
            character.pow_prof || 0,
            character.archetypeChoices || {}
        );
        innateThreshold = progression.innateThreshold;
    }

    container.innerHTML = `
        <div class="character-header">
            <div class="header-info">
                <h1 class="character-name">${character.name || 'Unnamed Character'}</h1>
                <div class="character-details">
                    <span class="detail-item">Level 1</span>
                    <span class="detail-separator">•</span>
                    <span class="detail-item">${character.species || 'Unknown Species'}</span>
                    ${character.size ? `<span class="detail-separator">•</span><span class="detail-item">${character.size}</span>` : ''}
                </div>
            </div>
            
            <div class="header-stats">
                <div class="speed-evasion-column">
                    <div class="stat-box">
                        <div class="stat-label">Speed</div>
                        <div class="stat-value">${speed}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Evasion</div>
                        <div class="stat-value">${evasion}</div>
                    </div>
                </div>
                
                <div class="health-energy-group">
                    <div class="health-box">
                        <div class="health-label">Health</div>
                        <input type="number" class="health-input" id="current-health" 
                               value="${currentHealth}" min="0" max="${maxHealth}">
                        <div class="health-max">/ ${maxHealth}</div>
                        <div class="health-sublabel">Terminal: ${terminal}</div>
                    </div>
                    
                    <div class="energy-box">
                        <div class="energy-label">Energy</div>
                        <input type="number" class="energy-input" id="current-energy" 
                               value="${currentEnergy}" min="0" max="${maxEnergy}">
                        <div class="energy-max">/ ${maxEnergy}</div>
                        ${innateThreshold > 0 ? `<div class="energy-sublabel">Innate Threshold: ${innateThreshold}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for health/energy inputs
    const healthInput = document.getElementById('current-health');
    const energyInput = document.getElementById('current-energy');

    if (healthInput) {
        healthInput.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(maxHealth, parseInt(e.target.value) || 0));
            e.target.value = value;
            character.currentHealth = value;
            // Trigger auto-save
            window.scheduleAutoSave?.();
        });
        healthInput.addEventListener('change', () => {
            window.updateResourceColors?.();
        });
    }

    if (energyInput) {
        energyInput.addEventListener('change', (e) => {
            const value = Math.max(0, Math.min(maxEnergy, parseInt(e.target.value) || 0));
            e.target.value = value;
            character.currentEnergy = value;
            // Trigger auto-save
            window.scheduleAutoSave?.();
        });
        energyInput.addEventListener('change', () => {
            window.updateResourceColors?.();
        });
    }

    window.updateResourceColors?.();
}
