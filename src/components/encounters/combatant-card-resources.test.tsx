import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Combatant } from '@/types/encounter';
import {
  COMBATANT_RESOURCE_NUMBER_INPUT_CLASS,
  CombatantCardResources,
} from './combatant-card-resources';

function combatant(partial: Partial<Combatant> = {}): Combatant {
  return {
    id: 'a',
    name: 'Alpha',
    initiative: 10,
    acuity: 0,
    maxHealth: 134,
    currentHealth: 134,
    maxEnergy: 9999,
    currentEnergy: 9999,
    armor: 0,
    evasion: 10,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'enemy',
    isAlly: false,
    isSurprised: false,
    ...partial,
  };
}

function inputByLabel(html: string, label: string): string {
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
  const input = inputs.find((markup) => markup.includes(`aria-label="${label}"`));
  expect(input, `missing input ${label}`).toBeTruthy();
  return input ?? '';
}

describe('combatant resource number boxes (86e3t5a7e)', () => {
  const props = {
    combatant: combatant(),
    linkedResourcesReadOnly: false,
    linkedResourcesTitle: '',
    onUpdate: () => {},
  };

  it('sizes compact Health and Energy boxes for a 3-digit and a 4-digit value', () => {
    const html = renderToStaticMarkup(<CombatantCardResources {...props} variant="compact" />);
    const health = inputByLabel(html, 'Current health for Alpha');
    const energy = inputByLabel(html, 'Current energy for Alpha');

    expect(health).toContain('value="134"');
    expect(energy).toContain('value="9999"');
    expect(health).toContain(COMBATANT_RESOURCE_NUMBER_INPUT_CLASS);
    expect(energy).toContain(COMBATANT_RESOURCE_NUMBER_INPUT_CLASS);
    expect(health).not.toContain('w-10');
    expect(energy).not.toContain('w-10');
    expect(html).toContain('/ 134');
    expect(html).toContain('/ 9999');
  });

  it('uses the same width on the full-card current and max boxes', () => {
    const html = renderToStaticMarkup(<CombatantCardResources {...props} variant="full" />);
    for (const label of [
      'Current health for Alpha',
      'Maximum health for Alpha',
      'Current energy for Alpha',
      'Maximum energy for Alpha',
    ]) {
      const input = inputByLabel(html, label);
      expect(input).toContain(COMBATANT_RESOURCE_NUMBER_INPUT_CLASS);
      expect(input).not.toContain('w-12');
    }
  });
});
