/**
 * Post-activation onboarding copy (TASK-388 / product overview §11).
 */

export const ONBOARDING_COPY = {
  playTogether: {
    title: "You're ready to play!",
    description: 'Your character is saved. See your sheet now, or find a party below.',
    viewCharacter: 'See my character',
    secondaryHeading: 'Find your party',
    discord: 'Join Discord',
    campaigns: 'Join campaign',
    runGames: 'Run games as RM',
    dontShowAgain: "Don't show this again",
  },
  sheetTourOffer: {
    title: 'Learn your sheet?',
    description:
      'A short tour of abilities, rolls, edit mode, and where help lives — skip anytime.',
    start: 'Take the tour',
    skip: 'Skip',
    dontShowAgain: "Don't show again",
    accountHint: 'You can turn tutorials off anytime under My Account.',
  },
  sheetTour: {
    steps: [
      {
        id: 'abilities',
        target: 'sheet-tour-abilities',
        title: 'Abilities & defenses',
        body: 'Core stats and defenses live here. Scores feed skills, attacks, and pools.',
      },
      {
        id: 'skills',
        target: 'sheet-tour-skills',
        title: 'Skills',
        body: 'Skill rolls and proficiency. Spend skill points in edit mode when you level up.',
      },
      {
        id: 'library',
        target: 'sheet-tour-library',
        title: 'Library',
        body: 'Feats, powers, techniques, and gear. Add from Realms Library or your creations.',
      },
      {
        id: 'roll',
        target: 'sheet-tour-roll-log',
        title: 'Roll log',
        body: 'Dice results from the sheet collect here so you and your table can follow the action.',
      },
      {
        id: 'edit',
        target: 'sheet-tour-edit',
        title: 'Edit vs view',
        body: 'The pencil toggles edit mode. View for play; edit to spend points and change loadout.',
      },
      {
        id: 'help',
        target: 'sheet-tour-header',
        title: 'Contextual help',
        body: 'Look for info tips (ⓘ) on labels — short rules help without leaving the sheet.',
      },
    ],
    next: 'Next',
    back: 'Back',
    done: "You're ready",
    skip: 'Skip tour',
  },
  levelUpGuide: {
    titleFirst: 'First level-up',
    titleAbility: 'Ability points unlocked',
    titleLibrary: 'More room in your library',
    titleReady: "You're ready to play at level {level}",
    dismiss: 'Got it',
    allocateAbilities: 'Spend ability points here in edit mode.',
    allocateSkills: 'Spend new skill points on the Skills panel.',
    allocateHealthEnergy: 'Health and Energy pools grew — check the header resources.',
    allocateFeats: 'New feat slots — add from the Library feats tab.',
    allocateTraining: 'Training Points grew — add or upgrade powers and techniques in Library.',
    abilityTip:
      'Ability scores power skills, attacks, and defenses. Tips on ability labels explain what each affects.',
    editModeOn: 'Edit mode is on so you can allocate now.',
  },
  account: {
    tutorialsTitle: 'Tutorials & tips',
    tutorialsDescription:
      'Contextual sheet tours and first-time level-up guides. Turn off to hide all of them.',
    tutorialsLabel: 'Show tutorials',
  },
  sheetSettings: {
    tourTitle: 'Sheet tour',
    tourDescription:
      'A short walkthrough of abilities, skills, library, rolls, edit mode, and contextual help.',
    tourRetake: 'Take the tour again',
    tourDisabledHint: 'Turn on Show tutorials under My Account to retake the tour.',
  },
} as const;
