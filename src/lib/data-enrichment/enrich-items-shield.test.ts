import { describe, expect, it } from 'vitest';
import { enrichItems } from './enrich-items';
import type { UserItem } from '@/hooks/use-user-library';

describe('enrichItems shield display (86e1vtdht)', () => {
  const library: UserItem[] = [
    {
      id: 'shield-1',
      docId: 'shield-1',
      name: 'Buckler',
      type: 'shield',
      shieldDR: { amount: 1, size: 6 },
      hasShieldDamage: true,
      shieldDamage: { amount: 1, size: 4 },
      properties: [],
    },
  ];

  it('maps saved block and damage onto enriched shields', () => {
    const rows = enrichItems(
      [{ id: 'shield-1', name: 'Buckler', equipped: true }],
      library,
      'shield',
    );
    expect(rows[0]?.shieldAmount).toBe('1d6');
    expect(rows[0]?.shieldDamage).toBe('1d4 Bludgeoning');
  });
});
