import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const footer = readFileSync(path.join(import.meta.dirname, 'guided-step-footer.tsx'), 'utf8');
const layout = readFileSync(path.join(import.meta.dirname, 'guided-step-layout.tsx'), 'utf8');
const shell = readFileSync(path.join(import.meta.dirname, 'guided-creator-shell.tsx'), 'utf8');

describe('GuidedStepFooter opacity (TASK-829)', () => {
  it('is opaque below md and frosted from md+', () => {
    expect(footer).toContain('bg-surface shadow-raised md:bg-surface/95 md:backdrop-blur-md');
    expect(footer).not.toMatch(/'bg-surface\/95 shadow-raised backdrop-blur-md'/);
    expect(footer).not.toMatch(/solid dock \(C4\)/);
  });

  it('keeps GuidedStepLayout bottom reserve for the sticky bar', () => {
    expect(layout).toMatch(/completionHint \? 'pb-32 sm:pb-24' : 'pb-24'/);
  });

  it('makes the chapter rail opaque below md', () => {
    expect(shell).toContain('bg-background md:bg-background/95 md:backdrop-blur-md');
    expect(shell).not.toMatch(/'bg-background\/95 backdrop-blur-md'/);
  });
});
