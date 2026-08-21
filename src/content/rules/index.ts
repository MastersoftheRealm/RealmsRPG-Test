import type { ComponentType } from 'react';
import CharacterCreation from './character-creation.mdx';
import CombatEncounters from './combat-encounters.mdx';
import Crafting from './crafting.mdx';
import Downtime from './downtime.mdx';
import Encounters from './encounters.mdx';
import Equipment from './equipment.mdx';
import Glossary from './glossary.mdx';
import PlayingTheGame from './playing-the-game.mdx';
import PowersAndTechniques from './powers-and-techniques.mdx';
import RollTables from './roll-tables.mdx';
import SkillEncounters from './skill-encounters.mdx';
import TheRealms from './the-realms.mdx';
import WelcomeToRealms from './welcome-to-realms.mdx';

const COMPONENTS: Record<string, ComponentType> = {
  'welcome-to-realms': WelcomeToRealms,
  'playing-the-game': PlayingTheGame,
  encounters: Encounters,
  'combat-encounters': CombatEncounters,
  'skill-encounters': SkillEncounters,
  'character-creation': CharacterCreation,
  'roll-tables': RollTables,
  equipment: Equipment,
  crafting: Crafting,
  downtime: Downtime,
  'powers-and-techniques': PowersAndTechniques,
  glossary: Glossary,
  'the-realms': TheRealms,
};

export function getRulebookChapterComponent(slug: string): ComponentType | undefined {
  return COMPONENTS[slug];
}
