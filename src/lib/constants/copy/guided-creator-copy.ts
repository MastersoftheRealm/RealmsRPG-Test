/**
 * Guided character creator — user-facing copy
 * ==========================================
 * Edit static prose here (chooser, shell chrome, chapter rail, step titles/descriptions).
 * Codex-driven names (paths, species, feats) still come from the database.
 *
 * Step files import from this module — do not duplicate strings in components.
 */

export const GUIDED_CREATOR_COPY = {
  chooser: {
    title: 'Create a New Character',
    subtitle: 'How do you want to build?',
    backToHome: 'Back to home',
    /** Soft nudge on the guided card only; both options are valid peers. Keep short — single-line pill. */
    firstTimerBadge: 'New player recommended',
    modes: {
      guided: {
        label: 'Guided',
        tagline: 'Become your character with path recommendations.',
        bullets: [
          'Pick a path, then choose species, Feats, and gear from its options',
          'Watch your character take shape as you go',
          'Great for your first character, or anytime you want a guided start',
        ],
      },
      custom: {
        label: 'Custom',
        tagline: 'The full builder when you want every option up front.',
        bullets: [
          'All catalogs available while you build',
          'Forge your own archetype, or fine-tune every pick',
          'Ideal if you already know the system or want full control',
        ],
      },
    },
  },

  shell: {
    eyebrow: 'Guided character creation',
    title: 'Create Your Character',
    changeModeLink: 'Choose another way to create',
    restart: 'Restart',
    previewToggle: 'Character preview',
    stepProgressFallback: 'Guided creation',
    restartModal: {
      title: 'Restart Character',
      description: 'Start over? All progress for this guided character will be lost.',
      confirmLabel: 'Restart',
    },
  },

  preview: {
    defaultName: 'Your Hero',
    defaultSubtitle: 'Begin your journey',
  },

  /** Compact horizontal preview above step content (early steps). */
  strip: {
    defaultName: 'Your character',
    defaultSubtitle: 'Choices appear here as you go',
  },

  /** Layer 1 ↔ 2/3 navigation — shared labels (REALMS §3). Expand/collapse always below content. */
  layerNav: {
    backToRecommendations: 'Back to recommendations',
  },

  /**
   * Choice-card disclosure labels (Ladder A). Catalog breadth uses layerNav / “See more options”.
   * - See more / See less — in-card deepen (truncated description, expandedExtra on the card).
   * - More details / Less details — entity modal (`onDetails`) or lots of chip/fact disclosure.
   */
  choiceCard: {
    seeMore: 'See more…',
    seeLess: 'See less',
    moreDetails: 'More details',
    lessDetails: 'Less details',
  },

  entityDetail: {
    close: 'Close',
    select: 'Select',
    overviewHeading: 'Overview',
    optionsRegionLabel: 'What you can choose later',
  },

  chapters: {
    foundation: { title: 'Foundation', subtitle: 'Choose your path and species' },
    ancestry: { title: 'Ancestry', subtitle: 'Make your species your own' },
    abilities: { title: 'Abilities', subtitle: 'Who you are' },
    archetype: { title: 'Your Archetype', subtitle: 'Skills and Feats' },
    equipment: { title: 'Equipment', subtitle: 'Gear, then Powers or Techniques' },
    reveal: { title: 'Your Hero', subtitle: 'Bring them to life' },
  },

  steps: {
    path: {
      title: 'Choose your path',
      description:
        'Your path suggests Abilities, Skills, Feats, and gear. Then you choose among those options.',
      showHybridPaths: 'Show hybrid (Powered-Martial) paths',
      backToCorePaths: 'Back to Power and Martial paths',
      emptyTitle: 'No paths available',
      emptyDescription: 'Try a different filter or check back later.',
      /** Modal chrome: preview; Select in footer applies the path. */
      detailModalHint: 'Preview this path, then Select if it fits your character.',
      detail: {
        noDescription: 'No description is available for this path yet.',
        loadingCatalogs: 'Loading path options…',
        typePower: 'Power',
        typeMartial: 'Martial',
        typePoweredMartial: 'Powered-Martial',
        proficiencyTitle: 'Proficiency',
        proficiencyPower: (n: number) => `Archetype Power Proficiency ${n}`,
        proficiencyMartial: (n: number) => `Archetype Martial Proficiency ${n}`,
        pathAbilitiesTitle: 'Path Abilities',
        archetypeAbility: (label: string) => `Archetype Ability ${label}`,
        archetypePowerAbility: (label: string) => `Archetype Power Ability ${label}`,
        archetypeMartialAbility: (label: string) => `Archetype Martial Ability ${label}`,
        secondaryAbility: (label: string) => `Secondary Recommended Ability ${label}`,
        recommendedAbilitiesTitle: 'Recommended Abilities',
        recommendedSkillsTitle: 'Recommended Skills',
        pathOptionsTitle: 'Path Options',
        pathOptionsIntro:
          'Here are choices this path offers during character creation.',
        pathOptionsNotesOnlyIntro: 'Notes for this path during character creation.',
        archetypeFeatsTitle: 'Archetype Feat Options',
        archetypeFeatsIntro:
          'Combat-focused Feats from this path. You choose among them in Your Archetype.',
        characterFeatsTitle: 'Character Feat Options',
        characterFeatsIntro:
          'Character Feats tied to this path. You pick one in Your Archetype.',
        weaponsTitle: 'Weapon Options',
        weaponsIntro:
          'Weapons and shields recommended for this path. Expand a row for Damage, Range, and properties.',
        unarmedProwessName: 'Unarmed Prowess',
        unarmedProwessDescription:
          'This path recommends Unarmed Prowess so you can fight effectively without a weapon.',
        unarmedProwessStats: 'Unarmed',
        armorTitle: 'Armor Options',
        armorIntro: 'Armor recommended for this path. Expand a row for Damage Reduction and other details.',
        gearTitle: 'Adventuring Gear',
        gearIntro: 'Gear recommended for this path.',
        techniquesTitle: 'Technique Options',
        techniquesIntro: 'Techniques this Martial path recommends.',
        powersTitle: 'Power Options',
        powersIntro: 'Powers this path recommends.',
      },
    },
    species: {
      title: 'Choose your species',
      description: 'Any species works with any path. Pick the one that excites you.',
      showAll: 'Show all species',
      backToStarters: 'Back to starter species',
      emptyTitle: 'No species available',
      emptyDescription: 'Check back later.',
      detailModalHint: 'Preview this species, then Select if it fits your character.',
      detail: {
        loadingTraits: 'Loading species options…',
        speciesTraitOptionsTitle: 'Species Trait Options',
        speciesTraitOptionsIntro:
          'These Species Traits ask you to pick a variant during Ancestry. Expand a row for the full description.',
        speciesTraitOptionPickHint: 'Pick one of these options during Ancestry.',
        ancestryTraitsTitle: 'Ancestry Trait Options',
        ancestryTraitsIntro:
          'You will choose one Ancestry Trait (two if you take a Flaw). Expand any row to read more.',
        characteristicsTitle: 'Characteristic Options',
        characteristicsIntro: 'You will choose one Characteristic during Ancestry.',
        flawsTitle: 'Flaw Options',
        flawsIntro:
          'Flaws are optional. Taking one grants an extra Ancestry Trait. Expand a row for details.',
      },
    },
    ancestry: {
      skipFlaw: 'No Flaw',
      skipFlawDescription:
        'Continue without a Flaw. You will not gain an extra Ancestry Trait.',
      selectSpeciesFirst: 'Choose a species first.',
      emptyOptions: 'No ancestry options are available for this species.',
      nextPick: 'Next pick',
      speciesOverview: {
        title: (name: string) => `Your ${name} heritage`,
        description:
          "These traits and details come with your species. Next, you'll personalize your ancestry.",
        vitalsTitle: 'At a glance',
        sizeLabel: 'Size',
        typeLabel: 'Type',
        avgHeightLabel: 'Avg height',
        avgWeightLabel: 'Avg weight',
        adulthoodLabel: 'Adulthood',
        lifespanLabel: 'Lifespan',
        abilityBonusesTitle: 'Ability Bonuses',
        skillsTitle: 'Species Skills',
        languagesTitle: 'Languages',
        grantedTitle: 'Species Traits',
        grantedHint: 'Granted with your species. No choice needed here.',
        choiceTeaserTitle: 'Choices ahead',
        choiceTeaserHint: (names: string[]) => {
          if (names.length === 1) {
            return `You'll choose your variant for ${names[0]} on the next screen.`;
          }
          if (names.length === 2) {
            return `You'll choose your variants for ${names[0]} and ${names[1]} on the next screens.`;
          }
          const last = names[names.length - 1];
          return `You'll choose your variants for ${names.slice(0, -1).join(', ')}, and ${last} on the next screens.`;
        },
        continueLabel: 'Continue',
        sizeChoiceTitle: 'Choose your size',
        sizeChoiceHint:
          'Some species can be more than one size. Pick the size that fits how you imagine this character.',
        sizeChoiceRequired: 'Select a size to continue.',
      },
    },
    abilities: {
      title: 'Your Abilities',
      description: 'Abilities describe how strong, quick, or sharp you are.',
      recommendedHeading: (pathName: string) => `Recommended for ${pathName}`,
      recommendedHint:
        'These Abilities match your path. Continue to keep them, or customize if you prefer different values.',
      customize: 'Customize Abilities',
      abilityPointsLabel: 'Ability Points',
    },
    skills: {
      title: 'Your Skills',
      description:
        'Species Skills are free. Spend Skill Points to gain proficiency in other Skills and to raise their value. The counter shows how many you have left.',
      applyRecommended: 'Restore path Skills',
      applyRecommendedHint: 'Puts back path Skill proficiencies you removed.',
      emptySkills: 'No Skills yet. Use suggestions below or browse the full list.',
      pointsRemaining: (n: number) =>
        `Spend ${n} more Skill Point${n === 1 ? '' : 's'} to continue.`,
      pointsComplete: 'All Skill Points spent',
      suggestedSkillsTitle: 'Suggested Skills',
      pathSkillSuggestionsTitle: (pathName: string) => `From ${pathName}`,
      pathSkillSuggestionsHint: (pathName: string) =>
        `You removed a Skill recommended for ${pathName}. Tap a card to add it back, or browse the full list.`,
      mixedSkillSuggestionsTitle: 'Recommended Skills',
      mixedSkillSuggestionsHint: (remaining: number) =>
        `You have ${remaining} Skill Point${remaining === 1 ? '' : 's'} left. Restore a path Skill or pick a suggestion below.`,
      browseAll: 'Browse all Skills',
      browseOverLimit: (max: number) =>
        max <= 0
          ? 'No Skill Points left to add more. Remove a Skill or lower a value, then try again.'
          : `You can add up to ${max} more Skill${max === 1 ? '' : 's'} with your remaining points. Deselect some if you need room.`,
      continueLabel: 'Looks good →',
    },
    archetypeFeats: {
      title: 'How you excel in combat',
      description: (count: number, pathName?: string) =>
        pathName
          ? `Pick ${count} Archetype Feat${count === 1 ? '' : 's'} for your ${pathName}. Groups suggest styles; you can mix picks across groups.`
          : `Pick ${count} Archetype Feat${count === 1 ? '' : 's'} that shape how you fight.`,
      groupIntro:
        'Groups are suggestions, not either/or. Keep picking until you reach your limit.',
      seeMore: 'See more Feats',
      emptyTitle: 'No Feat recommendations',
      emptyDescription:
        'This path does not list Archetype Feats yet. Use See more Feats, or pick another path.',
    },
    characterFeat: {
      title: 'Who you are beyond the fight',
      description: 'Pick one Character Feat, usually about personality, background, or non-combat flair.',
      seeMore: 'See more Character Feats',
      emptyTitle: 'No Character Feats found',
      emptyDescription:
        'None are available right now. Use See more Character Feats, or pick another path.',
    },
    /** Shared Layer 2 browse chrome for archetype + character feat steps. */
    featsBrowse: {
      heading: 'Browse Feats',
      hint: (max: number) =>
        max === 1
          ? 'Showing Feats you qualify for. Pick one, or show locked Feats to see their requirements.'
          : `Showing Feats you qualify for. Pick up to ${max}. Selecting another swaps your most recent pick.`,
      searchPlaceholder: 'Search Feats…',
      categoryLabel: 'Category',
      abilityLabel: 'Ability',
      allCategories: 'All categories',
      allAbilities: 'All Abilities',
      showBlocked: "Show Feats I don't qualify for",
      recommendedBadge: 'Recommended',
      requirementsNotMet: 'Requirements not met',
      emptyTitle: 'No Feats match',
      emptyDescription: 'Try clearing filters or showing locked Feats.',
    },
    loadout: {
      title: 'Your equipment',
      description: 'Choose weapons, armor, and adventuring gear from your path options.',
      continueLabel: 'Looks good →',
      emptyTitle: 'No equipment recommendations yet',
      emptyDescription:
        'This path has no recommended weapons, armor, or gear yet. Use See more options to browse common items, or pick another path.',
      loadingItems: 'Loading equipment…',
      unresolvedItem: 'Unknown item',
      unarmed: {
        title: 'Unarmed combat',
        description:
          'Your path favors fighting without weapons. Add Unarmed Prowess if you want unarmed strikes on your character.',
        add: 'Add Unarmed Prowess',
        remove: 'Remove Unarmed Prowess',
        addedHint: 'Unarmed Prowess will be on your character.',
      },
      phases: {
        weapon: {
          title: 'Weapons & shields',
          description:
            'Pick from your path options. Use See more for requirements and traits.',
        },
        armor: {
          title: 'Armor',
          description: 'Pick armor from your path, or continue without armor when that is allowed.',
        },
        gear: {
          title: 'Adventuring gear',
          description:
            'Pick recommended gear, or add all at once. Currency spent on weapons and armor already counts against your total.',
        },
        skipArmorLabel: 'Fight unarmored',
        seeMoreLabel: 'See more options',
        backToPhase: 'Back to recommendations',
        continueWeapon: 'Continue to armor →',
        continueToGear: 'Continue to gear →',
        currencyLabel: 'Currency',
        unresolvedItem: 'Unknown item',
        weaponPhase: {
          emptyTitle: 'No weapons on your path',
          emptyDescription: 'Use See more options to browse more weapons and shields.',
          handBlocked: 'A two-handed weapon cannot be used with a shield.',
          tpBlocked: 'Not enough Training Points for that item.',
        },
        armorPhase: {
          emptyTitle: 'No armor on your path',
          emptyDescription:
            'Use See more options to browse armor, or continue without armor if your path allows.',
          tpBlocked: 'Not enough Training Points for that item.',
        },
        gearPhase: {
          emptyTitle: 'No gear on your path',
          emptyDescription: 'Use See more options to browse adventuring gear within your budget.',
          addAllRecommended: 'Add all recommended gear',
          currencyBlocked: 'Not enough Currency remaining for that gear.',
        },
        l2: {
          weaponTitle: 'Browse weapons & shields',
          armorTitle: 'Browse armor',
          gearTitle: 'Browse adventuring gear',
          description: 'Common items you can take. Training Points update as you select.',
          gearDescription:
            'Common gear costing 50 Currency or less each. Remaining Currency updates as you select.',
          tpLabel: 'Training Points',
          currencyLabel: 'Currency',
          confirmError: 'That selection does not fit. Check Training Points, hands, or Currency.',
          searchPlaceholder: (phase: 'weapon' | 'armor' | 'gear') =>
            phase === 'gear' ? 'Search gear…' : `Search ${phase}…`,
          emptyMessage: (phase: 'weapon' | 'armor' | 'gear') =>
            phase === 'gear'
              ? 'No matching gear found'
              : phase === 'armor'
                ? 'No matching armor found'
                : 'No matching weapons or shields found',
        },
      },
    },
    powersTechniques: {
      martial: {
        title: 'Your Techniques',
        description: 'Techniques are trained combat moves that define how you fight.',
      },
      poweredMartial: {
        title: 'Your Powers',
        description: 'Powers that fit your hybrid fighting style.',
      },
      power: {
        title: 'Your Powers',
        description: 'Powers are supernatural or extraordinary effects you can use.',
      },
      /** `kind` is "powers" | "techniques" from the step; labels are capitalized for display. */
      groupIntro: (kind: string) => {
        const label = kind === 'techniques' ? 'Techniques' : 'Powers';
        return `Recommended ${label} for your path. Highlighted cards are selected. Tap to turn one off if you prefer.`;
      },
      energyTag: (energy: number) => `${energy} Energy`,
      emptyTitle: (kind: string) => {
        const label = kind === 'techniques' ? 'Techniques' : 'Powers';
        return `No ${label} on this path`;
      },
      emptyDescription: (kind: string) => {
        const label = kind === 'techniques' ? 'Techniques' : 'Powers';
        return `This path has no ${label} recommendations yet. You can add ${label} later on your character sheet.`;
      },
    },
    reveal: {
      title: 'Meet your hero',
      description: 'Review your build, name them, then create your character.',
      heroUnnamed: 'Unnamed Hero',
      identityTitle: 'Identity',
      nameLabel: 'Character name',
      namePlaceholder: 'Give your hero a name',
      ageLabel: 'Age (optional)',
      heightLabel: 'Height (cm, optional)',
      weightLabel: 'Weight (kg, optional)',
      appearanceLabel: 'Appearance (optional)',
      appearancePlaceholder: 'Hair, eyes, distinguishing features…',
      allocateHint: (remaining: number) =>
        `Allocate ${remaining} more point${remaining === 1 ? '' : 's'} between Health and Energy.`,
      save: 'Create character',
      saving: 'Creating…',
      portrait: {
        label: 'Portrait (optional)',
        emptyHint: 'No image',
        uploadButton: (hasPortrait: boolean) => (hasPortrait ? 'Change image' : 'Upload image'),
        processing: 'Processing…',
        hint: 'Upload and crop a portrait. JPG, PNG, or GIF. Max 5MB.',
        modalTitle: 'Character portrait',
        removeLabel: 'Remove portrait',
        tooLarge: 'That image is still too large. Try a smaller file.',
        processError: 'Could not process that image.',
      },
      healthEnergy: {
        title: 'Health & Energy',
        description: 'Split your bonus points between max Health and max Energy.',
        baseStats: (hp: number, en: number) => `Base Health: ${hp} · Base Energy: ${en}`,
        autoAllocate: 'Auto-allocate',
        autoAllocateAria:
          'Set Energy to cover your highest Power or Technique cost, and put the rest into Health',
        highestCostHint: (cost: number) =>
          `Your costliest Power or Technique needs ${cost} Energy. Auto-allocate can cover that cost first.`,
        allocateHint: (remaining: number) =>
          `Allocate ${remaining} more point${remaining === 1 ? '' : 's'} to continue.`,
      },
      summary: {
        title: 'Your build',
        description: 'Everything at a glance. Jump back anytime to edit.',
        coreTitle: 'Core choices',
        pathLabel: 'Path',
        speciesLabel: 'Species',
        typeLabel: 'Type',
        powerAbilityLabel: 'Power Ability',
        martialAbilityLabel: 'Martial Ability',
        abilitiesTitle: 'Abilities',
        ancestryTitle: 'Ancestry & Traits',
        skillsTitle: 'Skills',
        featsTitle: 'Feats',
        loadoutTitle: 'Equipment',
        powersTitle: 'Powers & Techniques',
        defaultLoadout: 'No equipment selected',
        customLoadout: 'Selected equipment',
      },
      loginModal: {
        title: 'Sign in to save',
        description: 'Create a free account to save your character and play with friends.',
        signIn: 'Sign in',
        register: 'Create account',
      },
      playTogetherModal: {
        title: "You're ready to play!",
        description: 'Realms is most fun with a party. Join Discord, browse campaigns, or run games as Realm Master.',
        viewCharacter: 'View my character',
        discord: 'Join Discord',
        campaigns: 'Browse campaigns',
        runGames: 'Run games as RM',
      },
    },
  },
} as const;

export type GuidedCreatorCopy = typeof GUIDED_CREATOR_COPY;
