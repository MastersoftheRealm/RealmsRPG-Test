/**
 * Characters API
 * ==============
 * List and create characters. Uses Prisma. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils/object';
import { validateJson, characterCreateSchema } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';
import type { Character, CharacterSummary } from '@/types';

function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  // Remove display-only properties
  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

function prepareForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareForSave(data);
  cleaned.createdAt = new Date().toISOString();
  return cleaned;
}

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.character.findMany({
      where: { userId: user.uid },
      orderBy: { updatedAt: 'desc' },
    });

    const characters: CharacterSummary[] = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        name: (d.name as string) || 'Unnamed',
        level: (d.level as number) || 1,
        portrait: d.portrait as string | undefined,
        archetypeName: (d.archetype as { name?: string; type?: string })?.name
          || ((d.archetype as { type?: string })?.type?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
        ancestryName: (d.ancestry as { name?: string })?.name || (d.species as string),
        status: d.status as CharacterSummary['status'],
        visibility: (d.visibility as CharacterSummary['visibility']) ?? 'private',
        updatedAt: r.updatedAt ?? undefined,
      };
    });

    return NextResponse.json(characters);
  } catch (err) {
    console.error('[API Error] GET /api/characters:', err);
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = standardLimiter.check(`char-post:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateJson(request, characterCreateSchema);
    if (!validation.success) return validation.error;
    const { duplicateOf, ...rest } = validation.data;
    const data = rest as Partial<Character>;

    if (duplicateOf) {
      // Duplicate existing character
      const existing = await prisma.character.findFirst({
        where: { id: duplicateOf, userId: user.uid },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      const d = existing.data as Record<string, unknown>;
      const baseData = { ...d };
      delete baseData.createdAt;
      delete baseData.updatedAt;
      const newData = {
        ...baseData,
        name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await prisma.userProfile.upsert({
        where: { id: user.uid },
        create: { id: user.uid },
        update: {},
      });

      const created = await prisma.character.create({
        data: {
          userId: user.uid,
          data: newData as object,
        },
      });

      return NextResponse.json({ id: created.id });
    }

    // Create new character
    const cleanedData = prepareForCreate(data);

    await prisma.userProfile.upsert({
      where: { id: user.uid },
      create: { id: user.uid },
      update: {},
    });

    const created = await prisma.character.create({
      data: {
        userId: user.uid,
        data: cleanedData as object,
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error('[API Error] POST /api/characters:', err);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}
