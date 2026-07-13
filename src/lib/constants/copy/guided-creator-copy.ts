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
    subtitle: 'Both paths create a full character — choose the experience you want today.',
    backToHome: 'Back to home',
    /** Soft nudge on the guided card only; both options are valid peers. Keep short — single-line pill. */
    firstTimerBadge: 'New player recommended',
    modes: {
      guided: {
        label: 'Guided',
        tagline: 'Chapter-by-chapter, with your path doing the heavy lifting.',
        bullets: [
          'Pick a path and we create a complete level-1 character',
          'One clear decision at a time, with a live preview',
          'Great for your first character or a quick start',
        ],
      },
      custom: {
        label: 'Custom',
        tagline: 'The full nine-step builder when you want every option from the start.',
        bullets: [
          'Same rules engine — all steps, all choices',
          'Forge your own archetype or fine-tune every detail',
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

  chapters: {
    foundation: { title: 'Foundation', subtitle: 'Choose your path and species' },
    ancestry: { title: 'Ancestry', subtitle: 'Make your species your own' },
    abilities: { title: 'Abilities', subtitle: 'Who you are, naturally' },
    archetype: { title: 'Your Archetype', subtitle: 'Skills, feats, and training' },
    equipment: { title: 'Equipment', subtitle: 'Your loadout and abilities' },
    reveal: { title: 'Your Hero', subtitle: 'Review and bring them to life' },
  },

  steps: {
    path: {
      title: 'Choose your path',
      description:
        "Your path shapes your abilities, skills, feats, and gear. Pick one and we'll build a complete level-1 character around it.",
      showHybridPaths: 'Show hybrid (Powered-Martial) paths',
      backToCorePaths: 'Back to power & martial paths',
      emptyTitle: 'No paths available',
      emptyDescription: 'Try a different filter or check back later.',
    },
    species: {
      title: 'Choose your species',
      description:
        "This is who you're becoming. Any species works with any path, so pick the one that excites you.",
      showAll: 'Show all species',
      backToStarters: 'Back to starter species',
      emptyTitle: 'No species available',
      emptyDescription: 'Check back later.',
    },
    ancestry: {
      skipFlaw: 'Skip — no flaw',
      skipFlawDescription:
        'Continue without a flaw. You will not gain an extra ancestry trait.',
      selectSpeciesFirst: 'Select a species first.',
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
        abilityBonusesTitle: 'Ability bonuses',
        skillsTitle: 'Species skills',
        languagesTitle: 'Languages',
        grantedTitle: 'Species traits',
        grantedHint: 'Granted automatically — no choice needed.',
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
          'Some species can be more than one size. Pick the size that fits how you imagine this character — it affects reach, carrying capacity, and how you fit in the world.',
        sizeChoiceRequired: 'Select a size to continue.',
      },
    },
    abilities: {
      title: 'Your natural abilities',
      description: 'Abilities describe who you are — how strong, quick, or sharp you are naturally.',
      recommendedHeading: (pathName: string) => `Recommended for ${pathName}`,
      recommendedHint: 'These scores are applied for your path. Customize if you want a different spread.',
      customize: 'Customize scores',
      abilityPointsLabel: 'Ability points',
    },
    skills: {
      title: 'Your skills',
      description:
        'You have 3 skill points at level 1. Species skills are free; each other skill costs 1 point for proficiency (then more to raise its value).',
      pathHelp: (names: string[]) =>
        names.length === 1
          ? `we recommend ${names[0]} — toggle it off to spend that point elsewhere.`
          : names.length === 2
            ? `we recommend ${names[0]} and ${names[1]} — toggle either off to pick a different skill.`
            : `we recommend ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]} — adjust as you like.`,
      applyRecommended: 'Restore path skills',
      applyRecommendedHint: 'Re-adds path skill proficiencies you removed.',
      emptySkills: 'No skills yet — use suggestions below or browse the full list.',
      pointsRemaining: (n: number) =>
        `Spend ${n} more skill point${n === 1 ? '' : 's'} to continue.`,
      pointsComplete: 'All skill points spent',
      suggestedSkillsTitle: 'Suggested skills',
      pathSkillSuggestionsTitle: (pathName: string) => `From ${pathName}`,
      pathSkillSuggestionsHint: (pathName: string) =>
        `You removed a skill recommended for ${pathName}. Tap a card to add it back, or browse the full list.`,
      mixedSkillSuggestionsTitle: 'Recommended skills',
      mixedSkillSuggestionsHint: (remaining: number) =>
        `You have ${remaining} skill point${remaining === 1 ? '' : 's'} left. Restore a path skill or pick a suggestion below.`,
      browseAll: 'Browse all skills',
      browseOverLimit: (max: number) =>
        max <= 0
          ? "You don't have enough skill points to add more. Remove a skill or decrease a skill bonus, then try again."
          : `You've selected more skills than you can afford (${max} remaining). Deselect some, or free skill points first.`,
      continueLabel: 'Looks good →',
    },
    archetypeFeats: {
      title: 'How you excel in combat',
      description: (count: number, pathName?: string) =>
        pathName
          ? `Pick ${count} archetype feat${count === 1 ? '' : 's'} for your ${pathName}. Each group below is a different fighting style — choose feats from any group.`
          : `Pick ${count} archetype feat${count === 1 ? '' : 's'} that shape how you fight.`,
      groupIntro:
        'Groups are suggestions, not either/or — pick the feats you want until you reach your limit.',
      seeMore: 'See more feats',
      emptyTitle: 'No feat recommendations',
      emptyDescription: 'Path data may need authoring in admin.',
    },
    characterFeat: {
      title: 'Who you are beyond the fight',
      description: 'Pick one character feat — usually about personality, background, or non-combat flair.',
      seeMore: 'See more character feats',
      emptyTitle: 'No character feats found',
      emptyDescription: 'Codex may need character feats tagged.',
    },
    /** Shared Layer 2 browse chrome for archetype + character feat steps. */
    featsBrowse: {
      heading: 'Browse feats',
      hint: (max: number) =>
        max === 1
          ? 'Filtered to feats you qualify for. Pick one — or show blocked feats to explore requirements.'
          : `Filtered to feats you qualify for. Pick up to ${max} — selecting another swaps your most recent pick.`,
      searchPlaceholder: 'Search feats…',
      categoryLabel: 'Category',
      abilityLabel: 'Ability',
      allCategories: 'All categories',
      allAbilities: 'All abilities',
      showBlocked: "Show feats I don't qualify for",
      recommendedBadge: 'Recommended',
      requirementsNotMet: 'Requirements not met',
      emptyTitle: 'No feats match',
      emptyDescription: 'Try clearing filters or showing blocked feats.',
    },
    loadout: {
      title: 'Your loadout',
      description: 'Choose weapons, then armor, then adventuring gear — one step at a time.',
      continueLabel: 'Looks good →',
      emptyTitle: 'No loadouts yet',
      emptyDescription: 'Path loadouts can be authored in admin (level1_loadouts).',
      defaultWhy: 'Included in your path',
      pathDefaultTitle: (pathName: string) => `${pathName} loadout`,
      pathDefaultWhy: 'Recommended gear for your path.',
      groupIntro:
        'Each section below is a complete loadout. Review the gear list, choose one kit, then continue.',
      loadoutGroupLabel: 'Path loadout options',
      selectKit: 'Use this kit',
      selectedKit: 'Selected',
      kitContentsLabel: 'Kit contents',
      loadingItems: 'Loading equipment details…',
      unresolvedItem: 'Unknown item',
      andMoreItems: (count: number) => ` +${count} more`,
      weaponsLabel: 'Weapons',
      armorLabel: 'Armor',
      gearLabel: 'Gear',
      emptyKit: 'No items in this kit yet.',
      customKitHint: 'You customized your gear — use See more to adjust, or pick a quick kit above.',
      unarmed: {
        title: 'Unarmed combat',
        description:
          'Your path recommends fighting without weapons. Add Unarmed Prowess if you want unarmed strikes on your sheet.',
        add: 'Add Unarmed Prowess',
        remove: 'Remove Unarmed Prowess',
        addedHint: 'Included on your character.',
      },
      phases: {
        progressLabel: 'Equipment steps',
        labels: {
          weapon: '1. Weapons',
          armor: '2. Armor',
          gear: '3. Gear',
        },
        weapon: {
          title: 'Weapons & shields',
          description:
            'Pick how you fight. Your path recommends options below — use See more to browse the full catalog.',
        },
        armor: {
          title: 'Armor',
          description:
            'Confirm or choose armor. Some paths can fight unarmored — skip if that fits your hero.',
        },
        gear: {
          title: 'Adventuring gear',
          description:
            'Bandages, rope, and other essentials. Spending on weapons and armor comes out of your starting currency first.',
        },
        quickKitsTitle: 'Quick kits',
        quickKitsDescription: 'Pre-built loadouts from your path — apply one to fill all steps at once.',
        selectedSummary: 'Your selection',
        emptySelection: {
          weapon: 'No weapons selected yet. Pick a quick kit or use See more.',
          armor: 'No armor selected. Optional for your path — continue or pick armor below.',
          gear: 'No extra gear yet. Path bundles and See more add items here.',
        },
        skipArmorLabel: 'Fight unarmored',
        seeMoreLabel: 'See more',
        backToPhase: 'Back to recommendations',
        continueWeapon: 'Continue to armor →',
        continueArmor: 'Continue to gear →',
        continueGear: 'Looks good →',
        currencyRemaining: (amount: number) => `${amount}c remaining for gear`,
        unresolvedItem: 'Unknown item',
        weaponPhase: {
          emptyTitle: 'No eligible weapons on your path',
          emptyDescription: 'Use See more to browse the full catalog.',
          handBlocked: 'Two-handed weapons cannot be used with a shield.',
          pathBadge: 'Path pick',
        },
        armorPhase: {
          emptyTitle: 'No eligible armor on your path',
          emptyDescription: 'Use See more to browse armor, or continue unarmored if your path allows.',
          pathBadge: 'Path pick',
        },
        gearPhase: {
          emptyTitle: 'No eligible gear on your path',
          emptyDescription: 'Use See more to browse adventuring gear within your budget.',
          pathBadge: 'Path pick',
        },
        l2: {
          weaponTitle: 'Browse weapons & shields',
          armorTitle: 'Browse armor',
          gearTitle: 'Browse adventuring gear',
          description:
            'Common items you qualify for at level 1. Training points update as you select.',
          gearDescription:
            'Common gear costing 50c or less per item. Currency remaining updates as you select.',
          tpLabel: 'Training points',
          currencyLabel: 'Currency',
          confirmError: 'Could not apply selection — check training points, hands, or currency.',
          searchPlaceholder: (phase: 'weapon' | 'armor' | 'gear') =>
            phase === 'gear' ? 'Search gear…' : `Search ${phase}…`,
          emptyMessage: (phase: 'weapon' | 'armor' | 'gear') =>
            phase === 'gear' ? 'No eligible gear found' : `No eligible ${phase} items found`,
        },
      },
    },
    powersTechniques: {
      martial: {
        title: 'Your techniques',
        description: 'Techniques are your martial abilities — trained moves that define how you fight.',
      },
      poweredMartial: {
        title: 'Your powers',
        description: 'Pick the powers that complement your hybrid fighting style.',
      },
      power: {
        title: 'Your powers',
        description: 'Powers are your supernatural or extraordinary abilities.',
      },
      groupIntro: (kind: string) =>
        `These ${kind} are recommended for your path. Select the ones you want on your character.`,
      energyTag: (energy: number) => `${energy} EN`,
      emptyTitle: (kind: string) => `No ${kind} on this path`,
      emptyDescription: (kind: string) =>
        `This path has no level-1 ${kind} recommendations yet. You can add ${kind} from your library later.`,
    },
    reveal: {
      title: 'Meet your hero',
      description: 'Review your build, add who they are, then bring them to life.',
      heroLevel: 'Level 1',
      heroUnnamed: 'Unnamed Hero',
      identityTitle: 'Identity',
      nameLabel: 'Character name',
      namePlaceholder: 'Give your hero a name',
      ageLabel: 'Age (optional)',
      heightLabel: 'Height cm (optional)',
      weightLabel: 'Weight kg (optional)',
      appearanceLabel: 'Appearance (optional)',
      appearancePlaceholder: 'Hair, eyes, distinguishing features…',
      allocateHint: (remaining: number) =>
        `Allocate ${remaining} more point${remaining === 1 ? '' : 's'} between health and energy.`,
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
        tooLarge: 'Image is still too large. Please use a smaller image.',
        processError: 'Failed to process image',
      },
      healthEnergy: {
        title: 'Health & energy',
        description: 'Split your bonus points between max health and max energy.',
        baseStats: (hp: number, en: number) => `Base HP: ${hp} · Base EN: ${en}`,
        autoAllocate: 'Auto-allocate',
        autoAllocateAria:
          'Auto-allocate points so max energy matches highest power or technique cost, rest to health',
        highestCostHint: (cost: number) =>
          `Your highest ability costs ${cost} EN — auto-allocate sets energy to match when possible.`,
        allocateHint: (remaining: number) =>
          `Allocate ${remaining} more point${remaining === 1 ? '' : 's'} to continue.`,
      },
      summary: {
        title: 'Your build',
        description: 'Every choice at a glance — jump back to edit any step.',
        coreTitle: 'Core choices',
        levelLabel: 'Level',
        pathLabel: 'Path',
        speciesLabel: 'Species',
        typeLabel: 'Type',
        powerAbilityLabel: 'Power ability',
        martialAbilityLabel: 'Martial ability',
        abilitiesTitle: 'Abilities',
        ancestryTitle: 'Ancestry & traits',
        skillsTitle: 'Skills',
        featsTitle: 'Feats',
        loadoutTitle: 'Equipment',
        powersTitle: 'Powers & techniques',
        defaultLoadout: 'Path loadout',
        customLoadout: 'Custom loadout',
      },
      loginModal: {
        title: 'Sign in to save',
        description: 'Create a free account to save your character and play with friends.',
        signIn: 'Sign in',
        register: 'Create account',
      },
      playTogetherModal: {
        title: "You're ready to play!",
        description: 'Realms is most fun with a party. Join a group or start a campaign as Realm Master.',
        viewCharacter: 'View my character',
        discord: 'Join Discord',
        campaigns: 'Browse campaigns',
        runGames: 'Run games as RM',
      },
    },
  },
} as const;

export type GuidedCreatorCopy = typeof GUIDED_CREATOR_COPY;
