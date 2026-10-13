import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { skillsHeaderPinOffset } from './skills-header-pin';

describe('skills heading stays below the sticky section tabs (86e3jv3yy)', () => {
  it('pins the heading flush with the tab strip and keeps it inside the card', () => {
    expect(
      skillsHeaderPinOffset({
        naturalTop: 120,
        headerHeight: 64,
        stickLine: 36,
        cardBottom: 900,
      }),
    ).toBe(0);

    expect(
      skillsHeaderPinOffset({
        naturalTop: 10,
        headerHeight: 64,
        stickLine: 36,
        cardBottom: 800,
      }),
    ).toBe(26);

    expect(
      skillsHeaderPinOffset({
        naturalTop: -700,
        headerHeight: 60,
        stickLine: 36,
        cardBottom: 84,
      }),
    ).toBe(724);

    expect(
      skillsHeaderPinOffset({
        naturalTop: -900,
        headerHeight: 60,
        stickLine: 36,
        cardBottom: -40,
      }),
    ).toBe(800);

    expect(
      skillsHeaderPinOffset({
        naturalTop: 100,
        headerHeight: 80,
        stickLine: 36,
        cardBottom: 150,
      }),
    ).toBe(0);

    expect(
      skillsHeaderPinOffset({
        naturalTop: 40,
        headerHeight: 0,
        stickLine: 36,
        cardBottom: 400,
      }),
    ).toBe(0);
  });

  it('pins the title and the filter row together, with no 3rem offset', () => {
    const source = readFileSync(path.join(import.meta.dirname, 'skills-section.tsx'), 'utf8');
    const pinAt = source.indexOf('data-skills-header-pin');
    const headingAt = source.indexOf('>Skills</h2>');
    const filterAt = source.indexOf('Skill proficiency filter');
    const subSkillsAt = source.indexOf('sheet-skills-sub-skills', filterAt);

    expect(pinAt).toBeGreaterThan(-1);
    expect(headingAt).toBeGreaterThan(pinAt);
    expect(filterAt).toBeGreaterThan(headingAt);
    expect(subSkillsAt).toBeGreaterThan(filterAt);

    const block = source.slice(pinAt, subSkillsAt);
    const opens = block.match(/<div[\s>]/g)?.length ?? 0;
    const closes = block.match(/<\/div>/g)?.length ?? 0;
    expect(opens).toBeGreaterThan(closes);

    expect(source).not.toContain('max-md:sticky');
    expect(source).not.toContain('max-md:top-12');
    expect(source).not.toContain('scroll-mt-12');
    expect(source).toContain('skillsHeaderPinOffset');

    const body = readFileSync(path.join(import.meta.dirname, 'character-sheet-body.tsx'), 'utf8');
    expect(body).toContain('data-sheet-section-tabs');
  });
});
