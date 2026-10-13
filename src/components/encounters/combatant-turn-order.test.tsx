import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Combatant, Encounter, TrackedCombatant } from '@/types/encounter';
import { CombatantCard } from './CombatantCard';
import { CombatantCardInitiative } from './combatant-card-initiative';
import { CombatCombatantList } from '@/app/(main)/encounters/[id]/_components/combat/combat-combatant-list';
import {
  applyCombatantTurnOrderMove,
  moveCombatantInTurnOrder,
  sortCombatantsForTurnOrder,
} from '@/app/(main)/encounters/[id]/_components/combat/combat-encounter-helpers';

function combatant(
  partial: Partial<TrackedCombatant> & Pick<TrackedCombatant, 'id' | 'name'>,
): TrackedCombatant {
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

function encounter(combatants: TrackedCombatant[], round = 1, currentTurnIndex = 0): Encounter {
  return {
    id: 'enc',
    name: 'QA S10 Guest Combat',
    type: 'combat',
    status: 'preparing',
    combatants,
    round,
    currentTurnIndex,
    isActive: false,
    applySurprise: true,
  };
}

function buttonByLabel(html: string, label: string): string {
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((match) => match[0]);
  const button = buttons.find((markup) => markup.includes(`aria-label="${label}"`));
  expect(button, `missing button ${label}`).toBeTruthy();
  return button ?? '';
}

function isDisabled(buttonHtml: string): boolean {
  const tag = buttonHtml.match(/^<button\b[^>]*>/)?.[0] ?? '';
  return /\sdisabled(?:=|\s|>)/.test(tag);
}

describe('combat turn order keyboard (86e3k0h3f)', () => {
  const alpha = combatant({ id: 'a', name: 'Alpha', initiative: 12 });
  const beta = combatant({ id: 'b', name: 'Beta', initiative: 8 });
  const companion = combatant({
    id: 'c',
    name: 'Companion',
    combatantType: 'companion',
    isAlly: true,
  });
  const surprised = combatant({ id: 's', name: 'Surprised', isSurprised: true });

  it('moves one step inside the turn-order group and keeps the current turn', () => {
    const start = encounter([alpha, beta], 1, 1);
    expect(sortCombatantsForTurnOrder(start.combatants, 1).map((c) => c.id)).toEqual(['a', 'b']);

    const moved = applyCombatantTurnOrderMove(start, 'b', -1);
    expect(moved.combatants.map((c) => c.id)).toEqual(['b', 'a']);
    expect(moved.currentTurnIndex).toBe(0);
    expect(moveCombatantInTurnOrder(moved.combatants, 1, 'b', -1)).toBeNull();
    expect(applyCombatantTurnOrderMove(moved, 'b', -1)).toBe(moved);
  });

  it('does not move across surprise or companion groups', () => {
    const roundOne = [alpha, surprised, companion];
    expect(moveCombatantInTurnOrder(roundOne, 1, 's', -1)).toBeNull();
    expect(moveCombatantInTurnOrder(roundOne, 1, 'a', 1)).toBeNull();
    expect(moveCombatantInTurnOrder(roundOne, 1, 'c', -1)).toBeNull();

    const afterRoundOne = moveCombatantInTurnOrder([surprised, alpha], 2, 's', 1);
    expect(afterRoundOne?.map((c) => c.id)).toEqual(['a', 's']);
  });

  it('renders Move up, Move down, and a focusable initiative control before the name', () => {
    const html = renderToStaticMarkup(
      <CombatCombatantList
        encounter={encounter([alpha, beta])}
        sortedCombatants={[alpha, beta]}
        userId={undefined}
        draggedId={null}
        dragOverId={null}
        onUpdate={() => {}}
        onRemove={() => {}}
        onDuplicate={() => {}}
        onAddCondition={() => {}}
        onRemoveCondition={() => {}}
        onUpdateConditionLevel={() => {}}
        onUpdateAP={() => {}}
        onDragStart={() => {}}
        onDragEnd={() => {}}
        onDragOver={() => {}}
        onDragLeave={() => {}}
        onDrop={() => {}}
        onMove={() => {}}
      />,
    );

    expect(html).toContain('or use Move up and Move down');
    expect(html).not.toContain('Click to edit initiative');

    const moveAlphaUp = buttonByLabel(html, 'Move Alpha up');
    const moveAlphaDown = buttonByLabel(html, 'Move Alpha down');
    const moveBetaUp = buttonByLabel(html, 'Move Beta up');
    const moveBetaDown = buttonByLabel(html, 'Move Beta down');
    expect(moveAlphaDown).toContain('>Move down<');
    expect(isDisabled(moveAlphaUp)).toBe(true);
    expect(isDisabled(moveAlphaDown)).toBe(false);
    expect(isDisabled(moveBetaUp)).toBe(false);
    expect(isDisabled(moveBetaDown)).toBe(true);

    const initiativeAt = html.indexOf('Edit initiative for Alpha: 12');
    const nameAt = html.indexOf('Combatant name: Alpha');
    const moveAt = html.indexOf('Move Alpha up');
    expect(initiativeAt).toBeGreaterThanOrEqual(0);
    expect(nameAt).toBeGreaterThan(initiativeAt);
    expect(moveAt).toBeGreaterThan(nameAt);

    const initiativeButton = buttonByLabel(html, 'Edit initiative for Alpha: 12');
    expect(initiativeButton).toContain('type="button"');
    expect(initiativeButton).toContain('>12<');
  });

  it('edits initiative from a labeled input', () => {
    const html = renderToStaticMarkup(
      <CombatantCardInitiative
        combatant={alpha}
        isCurrentTurn={false}
        isEditingInitiative
        onStartEditInitiative={() => {}}
        onStopEditInitiative={() => {}}
        onUpdate={() => {}}
        onDragStart={() => {}}
        onDragEnd={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Initiative for Alpha"');
    expect(html).toContain('type="number"');
    expect(html).not.toContain('Edit initiative for Alpha');
    expect(html).not.toContain('<div role="button"');
  });

  it('keeps the initiative button on the card when it is not being edited', () => {
    const html = renderToStaticMarkup(
      <CombatantCard
        combatant={alpha as Combatant}
        isCurrentTurn={false}
        isDragOver={false}
        isDragging={false}
        onUpdate={() => {}}
        onRemove={() => {}}
        onDuplicate={() => {}}
        onAddCondition={() => {}}
        onRemoveCondition={() => {}}
        onUpdateConditionLevel={() => {}}
        onUpdateAP={() => {}}
        onDragStart={() => {}}
        onDragEnd={() => {}}
        onDragOver={() => {}}
        onDragLeave={() => {}}
        onDrop={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        canMoveUp={false}
        canMoveDown
      />,
    );

    expect(buttonByLabel(html, 'Edit initiative for Alpha: 12')).toContain('type="button"');
    expect(html.indexOf('Edit initiative for Alpha: 12')).toBeLessThan(
      html.indexOf('Combatant name: Alpha'),
    );
    expect(html.indexOf('Move Alpha down')).toBeGreaterThan(html.indexOf('Combatant name: Alpha'));
  });
});
