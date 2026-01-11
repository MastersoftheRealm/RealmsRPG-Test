export function renderAbilities(character) {
    const container = document.getElementById('abilities-section');
    if (!container) return;

    const abilities = character.abilities || {
        strength: 0,
        vitality: 0,
        agility: 0,
        acuity: 0,
        intelligence: 0,
        charisma: 0
    };

    const defenses = character.defenses || {
        might: 10,
        fortitude: 10,
        reflex: 10,
        discernment: 10,
        mentalFortitude: 10,
        resolve: 10
    };

    const formatBonus = (val) => {
        const num = parseInt(val) || 0;
        return num >= 0 ? `+${num}` : `${num}`;
    };

    container.innerHTML = `
        <div class="abilities-section">
            <div class="abilities-grid">
                <div class="ability-box">
                    <div class="ability-name">Strength</div>
                    <div class="ability-value">${formatBonus(abilities.strength)}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">Vitality</div>
                    <div class="ability-value">${formatBonus(abilities.vitality)}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">Agility</div>
                    <div class="ability-value">${formatBonus(abilities.agility)}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">Acuity</div>
                    <div class="ability-value">${formatBonus(abilities.acuity)}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">Intelligence</div>
                    <div class="ability-value">${formatBonus(abilities.intelligence)}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">Charisma</div>
                    <div class="ability-value">${formatBonus(abilities.charisma)}</div>
                </div>
            </div>
            
            <div class="defenses-grid">
                <div class="defense-box">
                    <div class="defense-name">Might</div>
                    <div class="defense-value">${defenses.might}</div>
                </div>
                <div class="defense-box">
                    <div class="defense-name">Fortitude</div>
                    <div class="defense-value">${defenses.fortitude}</div>
                </div>
                <div class="defense-box">
                    <div class="defense-name">Reflex</div>
                    <div class="defense-value">${defenses.reflex}</div>
                </div>
                <div class="defense-box">
                    <div class="defense-name">Discernment</div>
                    <div class="defense-value">${defenses.discernment}</div>
                </div>
                <div class="defense-box">
                    <div class="defense-name">Mental Fort.</div>
                    <div class="defense-value">${defenses.mentalFortitude}</div>
                </div>
                <div class="defense-box">
                    <div class="defense-name">Resolve</div>
                    <div class="defense-value">${defenses.resolve}</div>
                </div>
            </div>
        </div>
    `;
}
