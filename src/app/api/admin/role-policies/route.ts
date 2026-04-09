/**
 * Admin Role Policies API
 * =======================
 * Read and update role quotas/permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
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

const ALLOWED_ROLES: UserRole[] = ['new_player', 'playtester', 'developer', 'admin'];

function isAllowedRole(role: string): role is UserRole {
  return ALLOWED_ROLES.includes(role as UserRole);
}

function normalizeInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return fallback;
}

export async function GET() {
  try {
    const { user } = await getSession();
    if (!user?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isAdmin(user.uid);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
    const { user } = await getSession();
    if (!user?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isAdmin(user.uid);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = (await request.json()) as Record<string, unknown>;
    const role = typeof body.role === 'string' ? body.role : '';
    if (!isAllowedRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

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
    const permissionsIn = (body.permissions ?? row.permissions ?? {}) as Record<string, unknown>;
    const permissions = {
      ...(row.permissions ?? {}),
      ...permissionsIn,
      can_upload_profile_picture: Boolean(permissionsIn.can_upload_profile_picture),
    };

    const updates = {
      max_campaigns: normalizeInt(body.maxCampaigns, row.max_campaigns),
      max_players_per_campaign: normalizeInt(body.maxPlayersPerCampaign, row.max_players_per_campaign),
      max_characters: normalizeInt(body.maxCharacters, row.max_characters),
      max_custom_powers: normalizeInt(body.maxCustomPowers, row.max_custom_powers),
      max_custom_techniques: normalizeInt(body.maxCustomTechniques, row.max_custom_techniques),
      max_custom_armaments: normalizeInt(body.maxCustomArmaments, row.max_custom_armaments),
      max_custom_creatures: normalizeInt(body.maxCustomCreatures, row.max_custom_creatures),
      permissions,
      updated_at: new Date().toISOString(),
      updated_by: user.uid,
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
