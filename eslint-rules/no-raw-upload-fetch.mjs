/**
 * ESLint rule: realms/no-raw-upload-fetch
 * ======================================
 * Bans ad-hoc `fetch('/api/upload/...')` (and template equivalents) in app code.
 * Multipart uploads must use `apiUpload` from `@/lib/api-client` so error parsing
 * stays consistent (ARCHITECTURE_CONSTITUTION.md).
 *
 * `src/lib/api-client.ts` is exempt (implements apiUpload).
 */

const UPLOAD_PATH_RE = /\/api\/upload\b/;

function stringLooksLikeUploadUrl(value) {
  return typeof value === 'string' && UPLOAD_PATH_RE.test(value);
}

function templateHasUpload(node) {
  if (!node || node.type !== 'TemplateLiteral') return false;
  return node.quasis.some((q) => UPLOAD_PATH_RE.test(q.value.cooked || q.value.raw || ''));
}

function argIsUploadUrl(arg) {
  if (!arg) return false;
  if (arg.type === 'Literal') return stringLooksLikeUploadUrl(arg.value);
  if (arg.type === 'TemplateLiteral') return templateHasUpload(arg);
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw fetch() to /api/upload/*; use apiUpload from @/lib/api-client.',
    },
    messages: {
      rawUploadFetch:
        "Do not fetch('/api/upload/…') directly. Use apiUpload from '@/lib/api-client' (see ARCHITECTURE_CONSTITUTION.md).",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, '/');
    if (filename.endsWith('/src/lib/api-client.ts')) {
      return {};
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        const isFetch =
          (callee.type === 'Identifier' && callee.name === 'fetch') ||
          (callee.type === 'MemberExpression' &&
            !callee.computed &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'fetch');
        if (!isFetch) return;
        if (argIsUploadUrl(node.arguments[0])) {
          context.report({ node, messageId: 'rawUploadFetch' });
        }
      },
    };
  },
};

export default rule;
