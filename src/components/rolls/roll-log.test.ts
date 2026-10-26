import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ROLL_LOG_DICE_BUILDER_CLASS,
  ROLL_LOG_DICE_BUILDER_SCROLL_CLASS,
  ROLL_LOG_HEADER_MIN_CLASS,
  ROLL_LOG_HISTORY_LIST_CLASS,
  ROLL_LOG_HISTORY_LIST_MIN_CLASS,
  ROLL_LOG_PANEL_HEIGHT_CLASS,
  ROLL_LOG_ROLL_BUTTON_FOOTER_CLASS,
} from '@/lib/rolls/roll-log-layout';

const source = readFileSync(path.join(import.meta.dirname, 'roll-log.tsx'), 'utf8');
const globalsCss = readFileSync(path.join(import.meta.dirname, '../../app/globals.css'), 'utf8');

const rollButton = readFileSync(
  path.join(import.meta.dirname, '../patterns/chrome/roll-button.tsx'),
  'utf8',
);

describe('RollLog layout (TASK-826 / C6)', () => {
  it('unmounts the closed panel instead of laying out a zero-size 360px card', () => {
    expect(source).toMatch(/\{isOpen \? \(/);
    expect(source).toMatch(/w-\[min\(22\.5rem,calc\(100svw-2\*var\(--dock-gap\)\)\)\]/);
    expect(source).not.toMatch(/w-\[360px\]/);
    expect(source).not.toMatch(/pointer-events-none h-0 w-0 max-w-0/);
  });
});

describe('RollLog layout (86e3jwawd follow-up)', () => {
  it('caps panel height with CSS vars and gives the history list a minimum height', () => {
    expect(source).toContain('roll-log-panel');
    expect(source).toContain('ROLL_LOG_PANEL_HEIGHT_CLASS');
    expect(ROLL_LOG_PANEL_HEIGHT_CLASS).toContain('--roll-log-panel-max-height');
    expect(source).toContain('ROLL_LOG_HISTORY_LIST_CLASS');
    expect(ROLL_LOG_HISTORY_LIST_CLASS).toContain('roll-log-history');
    expect(ROLL_LOG_HISTORY_LIST_CLASS).toContain('--roll-log-history-min');
    expect(ROLL_LOG_HISTORY_LIST_CLASS).not.toContain('min-h-0');
    expect(source).toContain('ROLL_LOG_DICE_BUILDER_CLASS');
    expect(ROLL_LOG_HISTORY_LIST_MIN_CLASS).toBe('min-h-20');
    expect(globalsCss).toContain('--roll-log-history-min: 5rem');
    expect(globalsCss).toMatch(/max-height: 28rem\)[\s\S]*--roll-log-history-min: 3rem/);
    expect(globalsCss).toContain('--roll-log-panel-max-height');
    expect(globalsCss).toMatch(
      /body:has\(\[data-character-sheet-page\]\)[\s\S]*--roll-log-panel-max-height/,
    );
  });

  it('keeps the roll button inside the card via a shrinkable builder and pinned footer', () => {
    expect(source).toContain('ROLL_LOG_DICE_BUILDER_CLASS');
    expect(source).toContain('ROLL_LOG_DICE_BUILDER_SCROLL_CLASS');
    expect(source).toContain('ROLL_LOG_ROLL_BUTTON_FOOTER_CLASS');
    expect(ROLL_LOG_DICE_BUILDER_CLASS).toContain('shrink');
    expect(ROLL_LOG_DICE_BUILDER_CLASS).not.toContain('shrink-0');
    expect(ROLL_LOG_DICE_BUILDER_SCROLL_CLASS).toContain('overflow-y-auto');
    expect(ROLL_LOG_ROLL_BUTTON_FOOTER_CLASS).toContain('shrink-0');
    expect(source).toMatch(
      /ROLL_LOG_ROLL_BUTTON_FOOTER_CLASS[\s\S]{0,400}<Button[\s\S]*?executeRoll/,
    );
    expect(source).not.toMatch(/ROLL_LOG_DICE_BUILDER_SCROLL_CLASS[\s\S]{0,1200}executeRoll/);
  });

  it('keeps Personal and Campaign tab headers the same height', () => {
    expect(source).toContain('ROLL_LOG_HEADER_MIN_CLASS');
    expect(ROLL_LOG_HEADER_MIN_CLASS).toBe('min-h-14');
    expect(source).toMatch(/isCampaignMode \? \([\s\S]*invisible[\s\S]*Clear/);
  });
});

describe('RollLog bonus source hover (TASK-893)', () => {
  it('resolves a modifier label onto the bonus chip title', () => {
    expect(source).toContain('resolveRollModifierLabel');
    expect(source).toContain('title={bonusLabel}');
  });
});

describe('RollLog roll entry titles (86e3kfkc1 / 86e3t17b1)', () => {
  it('clamps long titles to two lines, expands on tap, and keeps hover title', () => {
    expect(source).toContain('function RollLogEntryTitle');
    expect(source).toContain('title={title}');
    expect(source).toContain('line-clamp-2');
    expect(source).toContain('break-words');
    expect(source).toContain('aria-expanded={expanded}');
    expect(source).not.toMatch(/roll\.title[\s\S]{0,120}className="[^"]*\btruncate\b/);
  });
});

describe('Roll Log dock title contrast (86e3jvv3v)', () => {
  it('puts text-text-on-dark on the heading so the global h3 title color does not win', () => {
    expect(source).toMatch(
      /<h3 className="[^"]*\btext-text-on-dark\b[^"]*">[\s\S]*?🎲 Roll Log[\s\S]*?<\/h3>/,
    );
  });
});

describe('RollLog outside click (TASK-895)', () => {
  it('closes on pointerdown outside and ignores roll triggers', () => {
    expect(source).toContain('pointerdown');
    expect(source).toContain("closest('[data-roll-trigger]')");
    expect(source).toContain('Escape');
    expect(rollButton).toContain('data-roll-trigger');
  });
});
