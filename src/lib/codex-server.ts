/**
 * Codex Data (Prisma)
 * ===================
 * Server-side codex fetchers. Use in Server Components or API routes.
 */

import { prisma } from '@/lib/prisma';

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') return val.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
  return [];
}

export async function getFeats() {
  const rows = await prisma.codexFeat.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getSkills() {
  const rows = await prisma.codexSkill.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getSpecies() {
  const rows = await prisma.codexSpecies.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getTraits() {
  const rows = await prisma.codexTrait.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getArchetypes() {
  const rows = await prisma.codexArchetype.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getPowerParts() {
  const rows = await prisma.codexPart.findMany();
  const filtered = rows.filter((r) => ((r.data as Record<string, unknown>)?.type as string)?.toLowerCase() === 'power');
  return Object.fromEntries(filtered.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getTechniqueParts() {
  const rows = await prisma.codexPart.findMany();
  const filtered = rows.filter((r) => ((r.data as Record<string, unknown>)?.type as string)?.toLowerCase() === 'technique');
  return Object.fromEntries(filtered.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getItemProperties() {
  const rows = await prisma.codexProperty.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getEquipment() {
  const rows = await prisma.codexEquipment.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}

export async function getCreatureFeats() {
  const rows = await prisma.codexCreatureFeat.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, r.data as Record<string, unknown>]));
}
