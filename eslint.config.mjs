import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noRawColor from './eslint-rules/no-raw-color.mjs';
import noMutedDarkSecondaryPairing from './eslint-rules/no-muted-dark-secondary-pairing.mjs';
import noRawUploadFetch from './eslint-rules/no-raw-upload-fetch.mjs';

const realmsPlugin = {
  rules: {
    'no-raw-color': noRawColor,
    'no-muted-dark-secondary-pairing': noMutedDarkSecondaryPairing,
    'no-raw-upload-fetch': noRawUploadFetch,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Local ESLint JSON dumps (e.g. npx eslint -f json -o …)
    'eslint-errors.json',
  ]),
  // Node seed/maintenance scripts use CommonJS require(); do not force ESM imports.
  {
    files: ['scripts/**/*.{js,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // React Compiler rules: valid patterns (e.g. cache hydration, modal open sync) still flag;
  // keep as warnings so `npm run lint` stays actionable without blocking on style churn.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
  // Incremental cleanup: admin codex still uses `any` at spreadsheet boundaries.
  {
    files: ['src/app/(main)/admin/**/*.tsx', 'src/app/(main)/admin/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Design-system guardrail: ban raw Tailwind palette colors / hex in class
  // strings. Hard error for all source + new code; exemptions below.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { realms: realmsPlugin },
    rules: {
      'realms/no-raw-color': 'error',
      'realms/no-muted-dark-secondary-pairing': 'error',
      'realms/no-raw-upload-fetch': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/components/shared',
              message:
                'src/components/shared was removed (ADR-0019 / TASK-794). Import from @/components/patterns, or AddCombatantModal from @/components/encounters/add-combatant-modal.',
            },
          ],
          patterns: [
            {
              group: ['@/components/shared', '@/components/shared/*'],
              message:
                'src/components/shared was removed (ADR-0019 / TASK-794). Import from @/components/patterns (or a patterns/<bucket> deep path).',
            },
          ],
        },
      ],
    },
  },
  // ADR-0019: do not import the patterns barrel from inside patterns/ (intra-barrel cycles).
  {
    files: ['src/components/patterns/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/components/patterns',
              message:
                'Deep-import siblings under patterns/<bucket>/; do not import the patterns barrel from inside patterns/ (ADR-0019 / TASK-794).',
            },
            {
              name: '@/components/shared',
              message:
                'src/components/shared was removed (ADR-0019 / TASK-794). Import siblings under patterns/<bucket>/.',
            },
          ],
          patterns: [
            {
              group: ['@/components/shared', '@/components/shared/*'],
              message:
                'src/components/shared was removed (ADR-0019 / TASK-794). Import siblings under patterns/<bucket>/.',
            },
          ],
        },
      ],
    },
  },
  // Exemptions:
  // 1. Auth shell (`(auth)/`, `components/auth/`) intentionally uses gray-* for
  //    its dark marketing-style shell (documented exception).
  // 2. Three UI primitives use a bare black/white alpha for a scrim or track
  //    (modal overlay, chip pressed state, spinner track) and have no semantic
  //    overlay token yet. This replaces a blanket `components/ui/**` exemption
  //    that switched the rule off for 124 files to hide these 3 violations.
  {
    files: [
      'src/app/(auth)/**/*.{ts,tsx}',
      'src/components/auth/**/*.{ts,tsx}',
      'src/components/ui/chip.tsx',
      'src/components/ui/modal.tsx',
      'src/components/ui/spinner.tsx',
    ],
    rules: {
      'realms/no-raw-color': 'off',
    },
  },
]);

export default eslintConfig;
