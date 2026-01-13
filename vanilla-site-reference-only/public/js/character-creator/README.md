# Character Creator Modules

This folder contains the modular JavaScript for the Realms character creator.

## Structure

## Character Save Data Format

When a character is saved to Firestore via the `saveCharacterToLibraryHttp` Cloud Function, the following data structure is used:

```javascript
{
  // Basic Info
  name: "Character Name",
  species: "Human",
  size: "Medium",

  // Archetype
  mart_prof: 2,
  pow_prof: 0,
  pow_abil: "Intelligence",
  mart_abil: "Strength",

  // Abilities
  abilities: {
    strength: 2,
    vitality: 1,
    agility: 0,
    acuity: -1,
    intelligence: 3,
    charisma: 0
  },

  // Defense values
  defenseVals: {
    might: 0,
    fortitude: 0,
    reflex: 0,
    discernment: 0,
    mentalFortitude: 0,
    resolve: 0
  },

  // Traits (array of strings)
  traits: [
    "Night Vision",
    "Athletic",
    "Frail"
  ],

  // Skills (array of objects)
  skills: [
    {
      name: "Athletics",
      skill_val: 2,
      ability: "Strength",
      prof: true
    }
  ],

  // Feats (array of strings)
  feats: [
    "Power Attack",
    "Toughness",
    "Lucky"
  ],

  // Equipment (arrays of item names)
  equipment: [
    "Healing Potion",
    "Rope",
    "Lantern"
  ],
  weapons: [
    "Longsword",
    "Shortbow"
  ],
  armor: [
    "Plate Armor"
  ],

  // Powers & Techniques (array of strings)
  powers: ["Fireball", "Lightning Bolt"],
  techniques: ["Power Strike"],

  // Health & Energy Allocation
  health_energy_points: {
    health: 5,
    energy: 13
  },

  // Character Details
  appearance: "Tall warrior with...",
  archetypeDesc: "A battle-hardened...",
  notes: "Background story...",
  weight: "200",
  height: "6'2"
}
```

### Key Points

- **Abilities are grouped** in a single `abilities` object for cleaner organization
- **Equipment is separated by type** - `equipment` for general items, `weapons` and `armor` for armaments
- **Arrays store names/strings only** - Full objects for powers, techniques, and items are retrieved from their respective libraries using these names
- **Optional fields** (`pow_abil`, `mart_abil`, `size`) are only included if they have values
- **Skills** are stored with their bonuses pre-calculated during character creation
- **Health/Energy** stores only the points allocated *above* the base values calculated from abilities
- **Defense values are grouped** in a single `defenseVals` object (parallel to `abilities`)
- Defense bonus = abilities[corresponding] + defenseVals[defense]
- Each def_val can only be increased if the associated ability is 0 or less
- If an ability increases to 1+, the corresponding def_val is reset to 0
- Each defense increase costs 2 skill points

