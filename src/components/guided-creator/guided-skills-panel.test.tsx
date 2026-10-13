import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getGameRulesFallback, type Skill } from '@/hooks';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import { AssignedSkillDetails, GuidedSkillsPanel } from './guided-skills-panel';

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useCodexSkills: () => ({
      data: [
        {
          id: 'climb',
          name: 'Climb',
          description: 'Assigned skill description.',
          ability: 'strength',
          success_desc: 'Assigned success outcome.',
          failure_desc: 'Assigned failure outcome.',
          ds_calc: 'Assigned difficulty calculation.',
        },
        {
          id: 'outcomes-only',
          name: 'Outcomes Only',
          description: '',
          ability: 'strength',
          success_desc: 'Outcome-only success text.',
        },
      ],
      isLoading: false,
    }),
    useGameRules: () => ({
      rules: actual.getGameRulesFallback(),
      isLoading: false,
      error: null,
    }),
  };
});

const panelSource = readFileSync(path.join(import.meta.dirname, 'guided-skills-panel.tsx'), 'utf8');

const assignedSkill = {
  id: 'climb',
  name: 'Climb',
  description: 'Assigned skill description.',
  ability: 'strength',
  success_desc: 'Assigned success outcome.',
  failure_desc: 'Assigned failure outcome.',
  ds_calc: 'Assigned difficulty calculation.',
} as Skill;

describe('Assigned base skills show the add-list information (86e2q66jv)', () => {
  it('shows the Codex description and the additional descriptions from the add list', () => {
    const html = renderToStaticMarkup(<AssignedSkillDetails skill={assignedSkill} />);

    expect(html).toContain('Assigned skill description.');
    expect(html).toContain('Additional descriptions');
    expect(html).toContain('Success Outcomes');
    expect(html).toContain('Assigned success outcome.');
    expect(html).toContain('Failure Outcomes');
    expect(html).toContain('Assigned failure outcome.');
    expect(html).toContain('DS Calculation');
    expect(html).toContain('Assigned difficulty calculation.');
  });

  it('keeps an expand control on an assigned skill after it leaves the add list', () => {
    const html = renderToStaticMarkup(
      <GuidedSkillsPanel
        abilities={DEFAULT_ABILITIES}
        allocations={{ climb: 0, 'outcomes-only': 0 }}
        speciesSkillIds={new Set()}
        pathSkillIds={new Set()}
        totalPoints={3}
        spentPoints={2}
        onAllocationsChange={() => {}}
        defenseSkills={DEFAULT_DEFENSE_SKILLS}
        onDefenseChange={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Expand Climb details"');
    expect(html).toContain('aria-label="Expand Outcomes Only details"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Assigned success outcome.');
    expect(html).not.toContain('Outcome-only success text.');
    expect(panelSource).toContain('<AssignedSkillDetails skill={skill} />');
    expect(getGameRulesFallback()).toBeTruthy();
  });
});
