import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GridListRow } from './grid-list-row';
import { HubListRow } from './hub-list-row';

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const WIDGET_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'option',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
]);

function isInteractive(tag: string, attrs: string): boolean {
  const role = attrs.match(/\brole="([^"]*)"/)?.[1];
  if (role && WIDGET_ROLES.has(role)) return true;
  if (tag === 'button' || tag === 'select' || tag === 'textarea' || tag === 'summary') return true;
  if (tag === 'a' && /\bhref=/.test(attrs)) return true;
  if (tag === 'input') {
    const type = attrs.match(/\btype="([^"]*)"/)?.[1] ?? 'text';
    return type !== 'hidden';
  }
  const tab = attrs.match(/\btabindex="(-?\d+)"/)?.[1];
  return tab !== undefined && tab !== '-1';
}

/** axe nested-interactive: a button, link, or widget must not contain another one. */
function nestedInteractive(html: string): string[] {
  const re = /<\/?([a-zA-Z][\w:-]*)([^<>]*?)(\/?)>/g;
  type Frame = { tag: string; interactive: boolean; nested: string[] };
  const stack: Frame[] = [];
  const problems: string[] = [];
  for (const match of html.matchAll(re)) {
    const closing = match[0].startsWith('</');
    const tag = match[1]!.toLowerCase();
    const attrs = match[2] ?? '';
    const selfClosing = match[3] === '/' || VOID_TAGS.has(tag);
    if (closing) {
      const frame = stack.pop();
      if (!frame) continue;
      if (frame.interactive && frame.nested.length > 0) {
        problems.push(`${frame.tag} contains ${frame.nested.join(', ')}`);
      }
      const parent = stack[stack.length - 1];
      if (parent && (frame.interactive || frame.nested.length > 0)) {
        parent.nested.push(frame.interactive ? frame.tag : frame.nested[0]!);
      }
      continue;
    }
    if (selfClosing) {
      if (isInteractive(tag, attrs)) stack[stack.length - 1]?.nested.push(tag);
      continue;
    }
    stack.push({ tag, interactive: isInteractive(tag, attrs), nested: [] });
  }
  return problems;
}

describe('grid rows do not nest focusable controls (86e3k0ch6)', () => {
  it('keeps a library thumbnail and a column control outside the row button', () => {
    const html = renderToStaticMarkup(
      <GridListRow
        id="fireball"
        name="Fireball"
        description="A burst of fire."
        thumbnail={{ src: '/fireball.png', alt: 'Fireball' }}
        columns={[
          {
            key: 'attack',
            label: 'Attack',
            value: <button type="button">Roll</button>,
          },
        ]}
        quantity={2}
        onQuantityChange={() => {}}
      />,
    );

    expect(nestedInteractive(html)).toEqual([]);
    expect(html).toContain('data-grid-row-trigger');
    expect(html).toContain('>Fireball</span></button>');
    expect(html).toContain('View enlarged image: Fireball');
    expect(html).toContain('>Roll</button>');
    expect(html).not.toContain('role="button"');
  });

  it('keeps encounter actions outside the row button', () => {
    const html = renderToStaticMarkup(
      <HubListRow
        icon={<span>icon</span>}
        title="Skirmish"
        subtitle="Combat"
        onClick={() => {}}
        rightSlot={<button type="button">Mark complete</button>}
      />,
    );

    expect(nestedInteractive(html)).toEqual([]);
    expect(html).toContain('>Skirmish</span></button>');
    expect(html).toContain('>Mark complete</button>');
    expect(html).not.toContain('role="button"');
  });

  it('keeps the encounter delete button outside the row button', () => {
    const html = renderToStaticMarkup(
      <HubListRow
        icon={<span>icon</span>}
        title="Skirmish"
        onClick={() => {}}
        onDelete={() => {}}
        deleteAriaLabel="Delete encounter Skirmish"
      />,
    );

    expect(nestedInteractive(html)).toEqual([]);
    expect(html).toContain('aria-label="Delete encounter Skirmish"');
    expect(html).not.toContain('role="button"');
  });
});
