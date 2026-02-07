/**
 * Game Data Service
 * ==================
 * Game data (archetypes, skills, feats, species) — reads from Prisma via API.
 */

import type { Archetype, Skill, Feat, Ancestry } from '@/types';

let codexCache: { data: Awaited<ReturnType<typeof fetchCodex>>; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchCodex() {
  const res = await fetch('/api/codex');
  if (!res.ok) throw new Error('Failed to fetch codex');
  return res.json();
}

async function getCodex() {
  if (codexCache && Date.now() - codexCache.timestamp < CACHE_TTL) {
    return codexCache.data;
  }
  const data = await fetchCodex();
  codexCache = { data, timestamp: Date.now() };
  return data;
}

export function clearCache(): void {
  codexCache = null;
}

export async function getArchetypes(): Promise<Archetype[]> {
  const data = await getCodex();
  return (data.archetypes ?? []).map((a: Record<string, unknown>) => ({ ...a, id: a.id })) as Archetype[];
}

export async function getArchetype(id: string): Promise<Archetype | null> {
  const all = await getArchetypes();
  return all.find((a) => a.id === id) ?? null;
}

export async function getSkills(): Promise<Skill[]> {
  const data = await getCodex();
  return (data.skills ?? []) as Skill[];
}

export async function getSkill(id: string): Promise<Skill | null> {
  const all = await getSkills();
  return all.find((s) => s.id === id) ?? null;
}

export async function getFeats(): Promise<Feat[]> {
  const data = await getCodex();
  return (data.feats ?? []) as Feat[];
}

export async function getFeat(id: string): Promise<Feat | null> {
  const all = await getFeats();
  return all.find((f) => f.id === id) ?? null;
}

export async function getAncestries(): Promise<Ancestry[]> {
  const data = await getCodex();
  return (data.species ?? []) as Ancestry[];
}

export async function getAncestry(id: string): Promise<Ancestry | null> {
  const all = await getAncestries();
  return all.find((a) => a.id === id) ?? null;
}

export async function getGameData<T>(path: string): Promise<T | null> {
  const data = await getCodex();
  const map: Record<string, unknown[]> = {
    archetypes: data.archetypes ?? [],
    skills: data.skills ?? [],
    feats: data.feats ?? [],
    species: data.species ?? [],
  };
  const arr = map[path];
  if (arr) return Object.fromEntries((arr as { id?: string }[]).map((i) => [i.id, i])) as T;
  return null;
}

export async function getGameDataList<T extends { id?: string }>(path: string): Promise<T[]> {
  const data = await getCodex();
  const map: Record<string, unknown[]> = {
    archetypes: data.archetypes ?? [],
    skills: data.skills ?? [],
    feats: data.feats ?? [],
    species: data.species ?? [],
  };
  return (map[path] ?? []) as T[];
}
