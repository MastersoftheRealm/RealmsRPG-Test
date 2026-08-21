/**
 * Admin Role Policies API
 * =======================
 * Read and update role quotas/permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/admin';
import {
  buildRateLimitKey,
  resolveClientIp,
  retryAfterSecondsFromReset,
  strictLimiter,
} from '@/lib/rate-limit';
import { adminRolePolicyPatchSchema, validateJson } from '@/lib/api-validation';
import { asDbJson } from '@/lib/supabase/database';

export const dynamic = 'force-dynamic';

function permissionFlag(source: unknown): boolean {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
  return Boolean((source as Record<string, unknown>).can_upload_profile_picture);
}

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
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions, updated_at, updated_by',
      )
      .order('role');
    if (error) throw error;

    return NextResponse.json(data ?? []);
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
      buildRateLimitKey('admin-role-policies', {
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

    const validation = await validateJson(request, adminRolePolicyPatchSchema);
    if (!validation.success) return validation.error;

    const body = validation.data;
    const role = body.role;

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from('role_policies')
      .select(
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions',
      )
      .eq('role', role)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ error: 'Role policy not found' }, { status: 404 });

    // Only persist known permission keys (allowlist) — never spread arbitrary
    // client-supplied keys into the stored permissions blob (TASK-330).
    const permissions = {
      can_upload_profile_picture: permissionFlag(body.permissions ?? existing.permissions),
    };

    const updates = {
      max_campaigns: body.maxCampaigns ?? existing.max_campaigns,
      max_players_per_campaign: body.maxPlayersPerCampaign ?? existing.max_players_per_campaign,
      max_characters: body.maxCharacters ?? existing.max_characters,
      max_custom_powers: body.maxCustomPowers ?? existing.max_custom_powers,
      max_custom_techniques: body.maxCustomTechniques ?? existing.max_custom_techniques,
      max_custom_armaments: body.maxCustomArmaments ?? existing.max_custom_armaments,
      max_custom_creatures: body.maxCustomCreatures ?? existing.max_custom_creatures,
      permissions: asDbJson(permissions),
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    };

    const { data, error } = await supabase
      .from('role_policies')
      .update(updates)
      .eq('role', role)
      .select(
        'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions, updated_at, updated_by',
      )
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API Error] PATCH /api/admin/role-policies:', err);
    return NextResponse.json({ error: 'Failed to update role policy' }, { status: 500 });
  }
}
