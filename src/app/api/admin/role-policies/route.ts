/**
 * Admin Role Policies API
 * =======================
 * Read and update role quotas/permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/admin';
import { buildRateLimitKey, resolveClientIp, retryAfterSecondsFromReset, strictLimiter } from '@/lib/rate-limit';
import { adminRolePolicyPatchSchema, validateJson } from '@/lib/api-validation';
import type { UserRole } from '@/lib/role-limits';

export const dynamic = 'force-dynamic';

type RolePolicyRow = {
  role: UserRole;
  max_campaigns: number;
  max_players_per_campaign: number;
  max_characters: number;
  max_custom_powers: number;
  max_custom_techniques: number;
  max_custom_armaments: number;
  max_custom_creatures: number;
  permissions: Record<string, unknown> | null;
  updated_at: string | null;
  updated_by: string | null;
};

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('role_policies')
      .select(
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions, updated_at, updated_by'
      )
      .order('role');
    if (error) throw error;

    return NextResponse.json((data ?? []) as RolePolicyRow[]);
  } catch (err) {
    console.error('[API Error] GET /api/admin/role-policies:', err);
    return NextResponse.json({ error: 'Failed to load role policies' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json(auth.body, { status: auth.status });
    }

    const rateResult = await strictLimiter.check(
      buildRateLimitKey('admin-role-policies', { userId: auth.userId, ip: resolveClientIp(request.headers) })
    );
    if (!rateResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': retryAfterSecondsFromReset(rateResult.reset) } }
      );
    }

    const validation = await validateJson(request, adminRolePolicyPatchSchema);
    if (!validation.success) return validation.error;

    const body = validation.data;
    const role = body.role;

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from('role_policies')
      .select(
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions'
      )
      .eq('role', role)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Role policy not found' }, { status: 404 });

    const row = existing as RolePolicyRow;
    const permissionsIn = body.permissions ?? row.permissions ?? {};
    // Only persist known permission keys (allowlist) — never spread arbitrary
    // client-supplied keys into the stored permissions blob (TASK-330).
    const permissions: Record<string, boolean> = {
      can_upload_profile_picture: Boolean(permissionsIn.can_upload_profile_picture),
    };

    const updates = {
      max_campaigns: body.maxCampaigns ?? row.max_campaigns,
      max_players_per_campaign: body.maxPlayersPerCampaign ?? row.max_players_per_campaign,
      max_characters: body.maxCharacters ?? row.max_characters,
      max_custom_powers: body.maxCustomPowers ?? row.max_custom_powers,
      max_custom_techniques: body.maxCustomTechniques ?? row.max_custom_techniques,
      max_custom_armaments: body.maxCustomArmaments ?? row.max_custom_armaments,
      max_custom_creatures: body.maxCustomCreatures ?? row.max_custom_creatures,
      permissions,
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    };

    const { data, error } = await supabase
      .from('role_policies')
      .update(updates)
      .eq('role', role)
      .select(
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions, updated_at, updated_by'
      )
      .single();
    if (error) throw error;

    return NextResponse.json(data as RolePolicyRow);
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/role-policies:', err);
    return NextResponse.json({ error: 'Failed to update role policy' }, { status: 500 });
  }
}
