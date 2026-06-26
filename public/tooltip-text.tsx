import { AbilityName } from "@/types"
import { ABILITIES } from "@/types/abilities"

// Navbar
export const navbarLibrary = `Realms Library contains official content. 
My Library is your personal saved collection. 
Use Library to add or customize Powers, Techniques, Armaments, and Creatures.`

export const navbarCodex = `The Codex is your rules and reference index for Skills, Feats, Species, Parts, and Equipment.
Use it while creating Characters or custom content.`


// Character Creator

export const createNewCharacter = `Create your character step-by-step: Archetype, Species, Ancestry, Abilities, Skills,
 Feats, Equipment, Powers, then Finalize. Use Choose a Path for guided picks, or Forge Your Own for full manual control.`

export const chooseCharacterCreationStyle = `Choose a Path gives curated level 1 recommendations. 
Forge Your Own gives full manual customization from the start. Both follow the same core progression rules.`

export function getTooltipTextByPowerAbility(ability: AbilityName) {
    switch (ability) {
        case ABILITIES.strength:
            return `Great for heavy weapons, grappling, raw force, and "front-line bruise" builds.`
        case ABILITIES.vitality:
            return `Fits resilient tanks, endurance-focused fighters, and characters who outlast threats.`
        case ABILITIES.agility:
            return `Good for nimble archers, evasive dulists, and precision/positioning playstyles.`
        case ABILITIES.acuity:
            return `A focus-and-awareness stat. Works for tacticians, sharpshooters, and characters channeling power through focus/attunement.`
        case ABILITIES.intelligence:
            return `Ideal fo scholars, inventors, and spellcasters who study and refine their craft.`
        case ABILITIES.charisma:
            return `Fits leaders, performers ,and power users who influence the world through presence and will.`
    }
    return ''
}

export const powerAbility = `Your Power Ability pairs with your Power usage and best fts your character. It helps determine Energy, your Power-related
effectiveness, and Training Points used for crafting powers. Common choices include Acuity, Intelligence, or Charisma.`

export const martialAbility = `Your Martial Ability reflects your combat style and approach to challenges. It influences Energy and Training
Points for Techniques and proficiencies. Common picks include Strength, Vitality, Agility, or Acuity depending on your concept.`

export const chooseYourSpecies = (
    <div>
        <div>Species Sources</div>
        <strong>Choose Your Species</strong>
        <br />
        Your species defines your character&apos;s physical traits and inherent abilities.
        <ul>
            <li><strong>Public species</strong> are official Realms options.</li>
            <li><strong>My species</strong> are custom species you created.</li>
        </ul>
    </div>
)

export const chooseYourAncestryTraits = (
    <div>
        <div>Ancestry Trait Rules</div>
        <div>
            Default selection is <strong>1 ancestry trait.</strong>
        </div>
        <div>
            Taking a flaw grants <strong>+1 extra ancestry trait</strong> (for 2 total).
        </div>
        <div>
            In mixed species, choose one species trait from each side before finalizing ancestry
        </div>
    </div>
)

export const assignAbilities = (
    <div>
        <div>
            Ability Point Rules
        </div>
        <div>
            At level <strong>1</strong>, you have <strong>7 Ability Points.</strong>
        </div>
        <div>
            At creation, each Ability can be between <strong>-2</strong> and <strong>3</strong>.
        </div>
        <div>
            Total negative adjustments cannot go below <strong>-3</strong>.
        </div>
    </div>
)

export const allocateSkills = (
    <div>
        <div>
            Skill Point Rules
        </div>
        <div>
            At level <strong>1</strong>, you have <strong>3 Skill Points</strong>.
        </div>
        <div>
            Base skill cap is <strong>3</strong>.
        </div>
        <div>
            Past-cap cost: base <strong>3</strong>, sub-skill <strong>2</strong>.
        </div>
    </div>
    
)

export const addSubSkill = (
    <div>
        <div>
            Sub-Skills
        </div>
        <br />
        <div>
            Sub-skills are <strong>specialized skills</strong> that build on a broader base skill (example: <i>Lockpicking</i> under <i>Sleight of Hand</i> ).
        </div>
        <br />
        <div>
            You <strong>can't gain proficiency</strong> in a sub-skill until you have proficiency in its <strong>base skill</strong>.
        </div>
        <br />
        <div>
            When you add a sub-skill here, the base skill will be added automatically if needed.
        </div>
    </div>
)