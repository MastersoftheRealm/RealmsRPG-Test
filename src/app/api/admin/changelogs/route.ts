import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_ENTITY_TYPES = new Set<string>([
  'codex_feats',
  'codex_skills',
  'codex_species',
  'codex_traits',
  'codex_parts',
  'codex_properties',
  'codex_equipment',
  'codex_archetypes',
  'codex_creature_feats',
  'core_rules',
]);

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

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(user.uid))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const params = request.nextUrl.searchParams;
    const entityType = params.get('entityType') ?? 'codex_feats';
    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }
    const limit = toValidLimit(params.get('limit'));

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('codex_change_logs')
      .select('id, entity_type, entity_id, operation, changed_at, changed_by_user_id, before_data, after_data, changed_fields')
      .eq('entity_type', entityType)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = (data ?? []) as ChangeLogRow[];
    const userIds = Array.from(new Set(rows.map((row) => String(row.changed_by_user_id)).filter(Boolean)));
    let profilesById = new Map<string, UserProfileRow>();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, username_display, display_name, email')
        .in('id', userIds);
      if (profileError) throw profileError;

      profilesById = new Map((profiles ?? []).map((profile) => [String((profile as UserProfileRow).id), profile as UserProfileRow]));
    }

    const payload = rows.map((row) => {
      const actor = profilesById.get(String(row.changed_by_user_id));
      return {
        ...row,
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
