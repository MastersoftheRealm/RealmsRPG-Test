import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Combatant } from '@/types/encounter';
import { CombatantCard } from './CombatantCard';

function combatant(partial: Partial<Combatant> & Pick<Combatant, 'id' | 'name'>): Combatant {
  return {
    initiative: 10,
    acuity: 0,
    maxHealth: 20,
    currentHealth: 20,
    maxEnergy: 10,
    currentEnergy: 10,
    armor: 0,
    evasion: 10,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'ally',
    isAlly: true,
    isSurprised: false,
    ...partial,
  };
}

describe('CombatantCard a11y (86e3k0h3n)', () => {
  const alpha = combatant({ id: 'a', name: 'Alpha' });

  const cardProps = {
    combatant: alpha,
    isCurrentTurn: false,
    isDragOver: false,
    isDragging: false,
    onUpdate: () => {},
    onRemove: () => {},
    onDuplicate: () => {},
    onAddCondition: () => {},
    onRemoveCondition: () => {},
    onUpdateConditionLevel: () => {},
    onUpdateAP: () => {},
    onDamage: () => {},
    onHeal: () => {},
    onEnergyDrain: () => {},
    onEnergyRestore: () => {},
    onDragStart: () => {},
    onDragEnd: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
    onMoveUp: () => {},
    onMoveDown: () => {},
    canMoveUp: false,
    canMoveDown: false,
  };

  it('labels Health/Energy inputs and names AP/Health/Energy steppers per combatant', () => {
    const html = renderToStaticMarkup(<CombatantCard {...cardProps} />);

    expect(html).toContain('aria-label="Current health for Alpha"');
    expect(html).toContain('aria-label="Maximum health for Alpha"');
    expect(html).toContain('aria-label="Current energy for Alpha"');
    expect(html).toContain('aria-label="Maximum energy for Alpha"');
    expect(html).toContain('aria-label="Decrease Alpha health"');
    expect(html).toContain('aria-label="Increase Alpha health"');
    expect(html).toContain('aria-label="Decrease Alpha energy"');
    expect(html).toContain('aria-label="Increase Alpha energy"');
    expect(html).toContain('aria-label="Decrease Alpha action points"');
    expect(html).toContain('aria-label="Increase Alpha action points"');
  });

  it('names the Conditions toggle and exposes collapsed expanded state', () => {
    const html = renderToStaticMarkup(<CombatantCard {...cardProps} />);

    expect(html).toContain('aria-label="Alpha conditions"');
    expect(html).toContain('aria-expanded="false"');
  });
});
