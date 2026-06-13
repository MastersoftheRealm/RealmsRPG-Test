import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import {
  buildRateLimitKey,
  resolveClientIp,
  standardLimiter,
} from '@/lib/rate-limit';
import {
  validateJson,
  tooltipCreateSchema,
  tooltipPatchSchema,
} from '@/lib/api-validation';
import type { TooltipAudience, TooltipPlacement, TooltipRecord, TooltipTrigger } from '@/types/tooltips';

export const dynamic = 'force-dynamic';

type TooltipRow = {
  id: string;
  key: string;
  scope: string;
  title: string | null;
  body_md: string;
  placement: TooltipPlacement;
  trigger: TooltipTrigger;
  audience: TooltipAudience;
  enabled: boolean;
  version: number;
  updated_at: string;
  updated_by: string | null;
};

function toTooltipRecord(row: TooltipRow): TooltipRecord {
  return {
    id: row.id,
    key: row.key,
    scope: row.scope,
    title: row.title,
    bodyMd: row.body_md,
    placement: row.placement,
    trigger: row.trigger,
    audience: row.audience,
    enabled: row.enabled,
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function parseKeys(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

async function getRoleAndTooltipSetting(userId: string | undefined) {
  if (!userId) {
    return { role: null, showTooltips: true };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, show_tooltips')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const profile = (data as { role?: string | null; show_tooltips?: boolean | null } | null) ?? null;
  return {
    role: profile?.role ?? null,
    showTooltips: profile?.show_tooltips ?? true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    const keys = parseKeys(url.searchParams.get('keys'));
    const includeAll = url.searchParams.get('includeAll') === '1';

    const { user } = await getSession();
    const userId = user?.uid;
    const admin = await isAdmin(userId);

    const rateKey = buildRateLimitKey('tooltips-get', {
      userId,
      ip: resolveClientIp(request.headers),
    });
    const { success: rateOk } = standardLimiter.check(rateKey);
    if (!rateOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    if (includeAll && !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role, showTooltips } = await getRoleAndTooltipSetting(userId);
    const supabase = createServiceRoleClient();
    let query = supabase
      .from('ui_tooltips')
      .select('id, key, scope, title, body_md, placement, trigger, audience, enabled, version, updated_at, updated_by')
      .order('scope', { ascending: true })
      .order('key', { ascending: true });

    if (scope) query = query.eq('scope', scope);
    if (keys.length > 0) query = query.in('key', keys);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = ((data ?? []) as TooltipRow[]).map(toTooltipRecord);

    const filtered = includeAll
      ? rows
      : rows.filter((tooltip) => {
          if (!tooltip.enabled) return false;
          if (tooltip.audience === 'all') return true;
          if (tooltip.audience === 'admin') return admin;
          if (tooltip.audience === 'new_player') return role === 'new_player' || role == null;
          return false;
        });

    return NextResponse.json({
      tooltips: showTooltips ? filtered : [],
      user: {
        role,
        showTooltips,
        isAdmin: admin,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tooltips';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function requireAdminUser() {
  const { user } = await getSession();
  const userId = user?.uid;
  if (!userId) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const admin = await isAdmin(userId);
  if (!admin) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const, userId };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const rateKey = buildRateLimitKey('tooltips-post', {
    userId: auth.userId,
    ip: resolveClientIp(request.headers),
  });
  const { success: rateOk } = standardLimiter.check(rateKey);
  if (!rateOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const validation = await validateJson(request, tooltipCreateSchema);
    if (!validation.success) return validation.error;
    const body = validation.data;
    const { key, scope, title, bodyMd, placement, trigger, audience, enabled, version } = body;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('ui_tooltips')
      .insert({
        key,
        scope,
        title: title ?? null,
        body_md: bodyMd,
        placement,
        trigger,
        audience,
        enabled,
        version,
        updated_by: auth.userId,
      })
      .select('id, key, scope, title, body_md, placement, trigger, audience, enabled, version, updated_at, updated_by')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tooltip: toTooltipRecord(data as TooltipRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tooltip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const rateKey = buildRateLimitKey('tooltips-patch', {
    userId: auth.userId,
    ip: resolveClientIp(request.headers),
  });
  const { success: rateOk } = standardLimiter.check(rateKey);
  if (!rateOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const validation = await validateJson(request, tooltipPatchSchema);
    if (!validation.success) return validation.error;
    const body = validation.data;

    const updates: Record<string, unknown> = {
      updated_by: auth.userId,
    };

    if (body.key !== undefined) updates.key = body.key;
    if (body.scope !== undefined) updates.scope = body.scope;
    if (body.title !== undefined) updates.title = body.title;
    if (body.bodyMd !== undefined) updates.body_md = body.bodyMd;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.version !== undefined) updates.version = body.version;
    if (body.placement !== undefined) updates.placement = body.placement;
    if (body.trigger !== undefined) updates.trigger = body.trigger;
    if (body.audience !== undefined) updates.audience = body.audience;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('ui_tooltips')
      .update(updates)
      .eq('id', body.id)
      .select('id, key, scope, title, body_md, placement, trigger, audience, enabled, version, updated_at, updated_by')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tooltip: toTooltipRecord(data as TooltipRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tooltip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) return auth.response;

  const rateKey = buildRateLimitKey('tooltips-delete', {
    userId: auth.userId,
    ip: resolveClientIp(request.headers),
  });
  const { success: rateOk } = standardLimiter.check(rateKey);
  if (!rateOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('ui_tooltips').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete tooltip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
