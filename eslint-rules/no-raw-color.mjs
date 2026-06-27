/**
 * ESLint rule: realms/no-raw-color
 * ================================
 * Bans raw Tailwind default-palette color utilities (e.g. `bg-gray-100`,
 * `text-red-500`, `border-slate-300`), bare `*-white`/`*-black`, and arbitrary
 * hex color values (`bg-[#fff]`) in class strings. These ignore the theme and
 * are the primary source of dark-mode breakage and cross-page incoherence.
 *
 * Allowed: the project's SEMANTIC ramps and tokens (primary, accent, success,
 * danger, warning, info, category-*, power, martial, surface, text-*, border-*,
 * etc.) — those ARE the design system. Only the raw default palette is banned.
 *
 * Scope is controlled in eslint.config.mjs (auth shell + primitives + the
 * not-yet-migrated backlog are exempted; everything else and all new code is
 * hard-blocked).
 */

const PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
].join('|');

const PROP = [
  'bg', 'text', 'border', 'ring', 'ring-offset', 'from', 'via', 'to',
  'fill', 'stroke', 'divide', 'outline', 'decoration', 'placeholder',
  'caret', 'accent', 'shadow',
].join('|');

// e.g. `hover:dark:bg-blue-600/50` -> matches the `bg-blue-600` segment.
const RAMP_RE = new RegExp(
  `(?:^|[\\s:'"\`!(])(?:${PROP})-(?:${PALETTE})-(?:50|[1-9]00|950)(?:\\/\\d{1,3})?\\b`,
);
const BLACK_WHITE_RE = new RegExp(
  `(?:^|[\\s:'"\`!(])(?:bg|text|border|ring|fill|stroke|divide|placeholder|caret|accent|from|via|to)-(?:white|black)(?:\\/\\d{1,3})?\\b`,
);
const ARBITRARY_HEX_RE = /\[#(?:[0-9a-fA-F]{3,8})\]/;

function findViolation(value) {
  if (typeof value !== 'string') return null;
  if (RAMP_RE.test(value)) return value.match(RAMP_RE)[0].trim();
  if (BLACK_WHITE_RE.test(value)) return value.match(BLACK_WHITE_RE)[0].trim();
  if (ARBITRARY_HEX_RE.test(value)) return value.match(ARBITRARY_HEX_RE)[0].trim();
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw Tailwind palette colors, bare white/black, and arbitrary hex in class strings; use semantic design tokens.',
    },
    messages: {
      rawColor:
        "Raw color '{{token}}' is not allowed. Use a semantic design token (e.g. bg-surface, text-text-primary, border-border, bg-primary-600, text-success-700). See src/docs/DESIGN_SYSTEM.md.",
    },
    schema: [],
  },
  create(context) {
    function check(node, value) {
      const token = findViolation(value);
      if (token) {
        context.report({ node, messageId: 'rawColor', data: { token } });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};
