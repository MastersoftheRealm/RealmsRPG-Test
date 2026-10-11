import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('character creation state duration (86e3jrj8h)', () => {
  it('says a state lasts 1 minute, which is 6 rounds', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/content/rules/character-creation.mdx'),
      'utf8',
    );
    expect(source).toContain(
      'The default duration of a state is 1 minute (6 Rounds) unless otherwise specified.',
    );
    expect(source).not.toContain('1 minute (10 Rounds)');
  });
});
