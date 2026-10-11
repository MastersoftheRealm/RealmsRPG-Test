import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const card = readFileSync(new URL('./skill-participant-card.tsx', import.meta.url), 'utf8');
const view = readFileSync(new URL('../SkillEncounterView.tsx', import.meta.url), 'utf8');

describe('skill participant card narrow layout (86e3k914r)', () => {
  it('stacks identity and roll chrome below md so skill select and delete stay on screen at ~375', () => {
    expect(card).toMatch(/flex flex-col gap-3 md:flex-row md:items-start/);
    expect(card).toMatch(/min-w-0 truncate font-bold text-text-primary/);
    expect(card).toContain('title={participant.name}');
    expect(card).toMatch(/w-full min-w-\[6rem\][\s\S]*md:max-w-\[140px\]/);
    expect(card).not.toMatch(/max-w-\[140px\] min-w-0/);
    expect(card).toMatch(
      /flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:flex-shrink-0 md:justify-end/,
    );
  });

  it('ellipsizes a long name inside the card instead of widening the skill column', () => {
    expect(view).toMatch(/min-w-0 space-y-4 lg:col-span-2/);
    expect(card).toMatch(/min-w-0 truncate font-bold text-text-primary/);
    expect(card).toContain('title={participant.name}');
  });

  it('keeps delete inside the card after a roll', () => {
    expect(card).toMatch(/flex max-w-full min-w-0 flex-wrap items-center gap-2/);
    expect(card).toMatch(
      /label="Remove participant"[\s\S]*?className="flex-shrink-0 hover:bg-danger-light hover:text-danger-fg"/,
    );
  });
});
