import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin';
import {
  codexChangelogIdentityWithLiveName,
  pickCodexChangelogIdentity,
  readStoredCodexChangelogEntityName,
} from '@/lib/codex-changelog-display';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { adminChangelogsQuerySchema, validateQuery } from '@/lib/api-validation';
import {
  buildRateLimitKey,
  resolveClientIp,
  retryAfterSecondsFromReset,
  standardLimiter,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

type ChangeLogRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  changed_at: string;
  changed_by_user_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_fields: Array<Record<string, unknown>> | null;
};

type UserProfileRow = {
  id: string;
  username: string | null;
  username_display: string | null;
  display_name: string | null;
  email: string | null;
};

function toValidLimit(raw: string | null): number {
  const parsed = Number(raw ?? '');
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(200, Math.floor(parsed)));
}

/**
 * One batched name read for rows whose snapshot has no identity name.
 * `core_rules` has no name column. A lookup failure leaves those titles unnamed.
 */
async function loadLiveEntityNames(
  supabase: ReturnType<typeof createServiceRoleClient>,
  entityType: string,
  rows: readonly ChangeLogRow[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (entityType === 'core_rules') return names;
  const ids = [
    ...new Set(
      rows
        .filter((row) => !readStoredCodexChangelogEntityName(row.before_data, row.after_data))
        .map((row) => String(row.entity_id))
        .filter(Boolean),
    ),
  ];
  if (ids.length === 0) return names;

  const { data, error } = await supabase.from(entityType).select('id, name').in('id', ids);
  if (error) {
    console.error('[API Error] GET /api/admin/changelogs entity names:', error);
    return names;
  }
  for (const row of data ?? []) {
    if (!row || typeof row !== 'object') continue;
    const record = row as { id?: unknown; name?: unknown };
    const id = String(record.id ?? '');
    if (!id || typeof record.name !== 'string') continue;
    const name = record.name.trim();
    if (name) names.set(id, name);
  }
  return names;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const rateResult = await standardLimiter.check(
      buildRateLimitKey('admin-changelogs-get', {
        userId: auth.userId,
        ip: resolveClientIp(request.headers),
      }),
    );
    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': retryAfterSecondsFromReset(rateResult.reset) } },
      );
    }

    const queryResult = validateQuery(request, adminChangelogsQuerySchema);
    if (!queryResult.success) return queryResult.error;
    const entityType = queryResult.data.entityType ?? 'codex_feats';
    const limitRaw = queryResult.data.limit;
    const limit = limitRaw ? toValidLimit(limitRaw) : toValidLimit(null);

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('codex_change_logs')
      .select(
        'id, entity_type, entity_id, operation, changed_at, changed_by_user_id, before_data, after_data, changed_fields',
      )
      .eq('entity_type', entityType)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data ?? []) as ChangeLogRow[];
    const liveNames = await loadLiveEntityNames(supabase, entityType, rows);
    const userIds = Array.from(
      new Set(rows.map((row) => String(row.changed_by_user_id)).filter(Boolean)),
    );
    let profilesById = new Map<string, UserProfileRow>();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, username_display, display_name, email')
        .in('id', userIds);
      if (profileError) throw profileError;

      profilesById = new Map(
        (profiles ?? []).map((profile) => [
          String((profile as UserProfileRow).id),
          profile as UserProfileRow,
        ]),
      );
    }

    const payload = rows.map((row) => {
      const actor = profilesById.get(String(row.changed_by_user_id));
      const identity = codexChangelogIdentityWithLiveName(
        pickCodexChangelogIdentity(row.before_data),
        pickCodexChangelogIdentity(row.after_data),
        liveNames.get(String(row.entity_id)),
      );
      return {
        ...row,
        // TASK-874: list UI only needs identity — do not ship full snapshots.
        before_data: identity.before_data,
        after_data: identity.after_data,
        actor: actor
          ? {
              id: actor.id,
              username: actor.username,
              usernameDisplay: actor.username_display ?? actor.username,
              displayName: actor.display_name,
              email: actor.email,
            }
          : null,
      };
    });

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[API Error] GET /api/admin/changelogs:', err);
    return NextResponse.json({ error: 'Failed to load changelogs' }, { status: 500 });
  }
}
