/**
 * createCampaignAction must enforce the live role_policies quota, and must not
 * fall back to a looser limit when that policy cannot be read.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;
type DbError = { message: string; code?: string };

class PolicyDb {
  constructor(
    readonly tables: Record<string, Row[]>,
    readonly failSelect: Set<string> = new Set(),
  ) {}

  from(table: string) {
    return new PolicyQuery(this, table);
  }
}

class PolicyQuery implements PromiseLike<{
  data: unknown;
  count: number | null;
  error: DbError | null;
}> {
  private op: 'select' | 'insert' = 'select';
  private payload: Row[] = [];
  private headCount = false;
  private readonly filters: Array<[string, unknown]> = [];

  constructor(
    private readonly db: PolicyDb,
    private readonly table: string,
  ) {}

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    this.headCount = options?.head === true;
    return this;
  }

  insert(row: Row | Row[]) {
    this.op = 'insert';
    this.payload = Array.isArray(row) ? row : [row];
    return this;
  }

  upsert(row: Row | Row[]) {
    return this.insert(row);
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  async maybeSingle() {
    const result = await this.run();
    const rows = (result.data as Row[] | null) ?? [];
    return { data: rows[0] ?? null, error: result.error };
  }

  then<T1 = { data: unknown; count: number | null; error: DbError | null }, T2 = never>(
    onfulfilled?:
      | ((value: {
          data: unknown;
          count: number | null;
          error: DbError | null;
        }) => T1 | PromiseLike<T1>)
      | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private async run(): Promise<{ data: unknown; count: number | null; error: DbError | null }> {
    const rows = (this.db.tables[this.table] ??= []);
    if (this.op === 'insert') {
      rows.push(...this.payload);
      return { data: null, count: null, error: null };
    }
    if (this.db.failSelect.has(this.table)) {
      return {
        data: null,
        count: null,
        error: { message: 'canceling statement due to statement timeout', code: '57014' },
      };
    }
    const matched = rows.filter((row) =>
      this.filters.every(([column, value]) => String(row[column] ?? '') === String(value)),
    );
    return this.headCount
      ? { data: null, count: matched.length, error: null }
      : { data: matched, count: null, error: null };
  }
}

const USER_ID = 'new-player-uid';
let currentDb: PolicyDb;

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(async () => ({ uid: USER_ID, name: 'New Player' })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => currentDb),
  createServiceRoleClient: vi.fn(() => currentDb),
}));

vi.mock('@/lib/observability', () => ({
  reportError: vi.fn(),
}));

function seed(maxCampaigns: number, failSelect: Set<string> = new Set()): PolicyDb {
  currentDb = new PolicyDb(
    {
      user_profiles: [{ id: USER_ID, username: 'newplayer', role: 'new_player' }],
      role_policies: [
        {
          role: 'new_player',
          max_campaigns: maxCampaigns,
          max_players_per_campaign: 5,
          max_characters: 3,
          max_custom_powers: 20,
          max_custom_techniques: 20,
          max_custom_armaments: 15,
          max_custom_creatures: 10,
          permissions: { can_upload_profile_picture: false },
        },
      ],
      campaigns: [],
      campaign_members: [],
    },
    failSelect,
  );
  return currentDb;
}

describe('createCampaignAction role policy quota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the campaign when the live policy allows one', async () => {
    seed(1);
    const { createCampaignAction } = await import('./actions');

    const result = await createCampaignAction({ name: 'QA Test Campaign' });

    expect(result.success).toBe(true);
    expect(currentDb.tables.campaigns).toHaveLength(1);
  });

  it('refuses the campaign when the live policy allows none', async () => {
    seed(0);
    const { createCampaignAction } = await import('./actions');

    const result = await createCampaignAction({ name: 'QA Test Campaign' });

    expect(result.success).toBe(false);
    expect(currentDb.tables.campaigns).toHaveLength(0);
  });

  it('refuses the campaign when the role policy read fails, instead of using the built-in limit', async () => {
    seed(0, new Set(['role_policies']));
    const { createCampaignAction } = await import('./actions');

    const result = await createCampaignAction({ name: 'QA Test Campaign' });

    expect(result.success).toBe(false);
    expect(currentDb.tables.campaigns).toHaveLength(0);
  });
});
