import { describe, expect, it } from 'vitest';
import {
  ROLE_QUOTA_EXCEEDED_CODE,
  buildRoleQuotaExceededResponse,
  parseRoleQuotaExceededDbError,
} from './role-quota-messages';

type QuotaGate = {
  currentCount: number;
  maxAllowed: number;
  insert: () => void;
};

/**
 * Models the pre-fix API pattern: read count, then insert in separate steps with no lock.
 * Under concurrency both readers can observe a slot and both insert.
 */
function simulateUnlockedCountThenInsert(gates: QuotaGate[]): number {
  return gates.reduce((successfulInserts, gate) => {
    if (gate.currentCount < gate.maxAllowed) {
      gate.insert();
      return successfulInserts + 1;
    }
    return successfulInserts;
  }, 0);
}

describe('role quota atomicity', () => {
  it('proves unlocked count-then-insert allows one extra insert at the cap', () => {
    let count = 2;
    const maxAllowed = 3;
    const gates: QuotaGate[] = [
      {
        currentCount: count,
        maxAllowed,
        insert: () => {
          count += 1;
        },
      },
      {
        currentCount: count,
        maxAllowed,
        insert: () => {
          count += 1;
        },
      },
    ];

    const inserts = simulateUnlockedCountThenInsert(gates);
    expect(inserts).toBe(2);
    expect(count).toBe(4);
  });

  it('parses ROLE_QUOTA_EXCEEDED database errors for API 403 responses', () => {
    const parsed = parseRoleQuotaExceededDbError({
      code: 'P0001',
      message: 'ROLE_QUOTA_EXCEEDED',
      details: JSON.stringify({
        resource: 'characters',
        role: 'new_player',
        currentCount: 3,
        maxAllowed: 3,
      }),
    });
    expect(parsed).toEqual(
      buildRoleQuotaExceededResponse({
        role: 'new_player',
        resource: 'characters',
        currentCount: 3,
        maxAllowed: 3,
      }),
    );
    expect(parsed?.code).toBe(ROLE_QUOTA_EXCEEDED_CODE);
  });
});
