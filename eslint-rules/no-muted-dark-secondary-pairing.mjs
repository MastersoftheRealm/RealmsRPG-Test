/**
 * ESLint rule: realms/no-muted-dark-secondary-pairing
 * ===================================================
 * Bans `text-text-muted` paired with `dark:text-text-secondary` in the same
 * class string. The tokens resolve to the same colour in dark mode, so the
 * `dark:` half is dead CSS (DESIGN_SYSTEM.md § Muted vs secondary text).
 */

const PAIRING_RE =
  /text-text-muted(?:[\s\w:/[\]%-]*?)dark:text-text-secondary|dark:text-text-secondary(?:[\s\w:/[\]%-]*?)text-text-muted/;

function hasPairing(value) {
  return typeof value === 'string' && PAIRING_RE.test(value);
}

/** @type {import('eslint').Rule.RuleModule} */
const noMutedDarkSecondaryPairingRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow text-text-muted paired with dark:text-text-secondary; write text-text-muted alone.',
    },
    messages: {
      pairing:
        'Do not pair text-text-muted with dark:text-text-secondary (no-op in dark mode). Use text-text-muted alone. See DESIGN_SYSTEM.md § Muted vs secondary text.',
    },
    schema: [],
  },
  create(context) {
    function check(node, value) {
      if (hasPairing(value)) {
        context.report({ node, messageId: 'pairing' });
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

export default noMutedDarkSecondaryPairingRule;
