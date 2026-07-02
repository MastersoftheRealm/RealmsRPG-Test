import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noRawColor from "./eslint-rules/no-raw-color.mjs";
import { RAW_COLOR_BACKLOG } from "./eslint-rules/raw-color-backlog.mjs";

const realmsPlugin = { rules: { "no-raw-color": noRawColor } };

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local ESLint JSON dumps (e.g. npx eslint -f json -o …)
    "eslint-errors.json",
  ]),
  // Node seed/maintenance scripts use CommonJS require(); do not force ESM imports.
  {
    files: ["scripts/**/*.{js,cjs,mjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // React Compiler rules: valid patterns (e.g. cache hydration, modal open sync) still flag;
  // keep as warnings so `npm run lint` stays actionable without blocking on style churn.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
  // Incremental cleanup: admin codex still uses `any` at spreadsheet boundaries.
  {
    files: ["src/app/(main)/admin/**/*.tsx", "src/app/(main)/admin/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Design-system guardrail: ban raw Tailwind palette colors / hex in class
  // strings. Hard error for all source + new code; exemptions below.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { realms: realmsPlugin },
    rules: {
      "realms/no-raw-color": "error",
    },
  },
  // Exemptions:
  // 1. Auth shell (`(auth)/`, `components/auth/`) intentionally uses gray-* for
  //    its dark marketing-style shell (documented exception).
  // 2. UI primitives define the semantic ramps and still carry a few deprecated
  //    palette variants slated for removal — they are the source of tokens.
  {
    files: [
      "src/app/(auth)/**/*.{ts,tsx}",
      "src/components/auth/**/*.{ts,tsx}",
      "src/components/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "realms/no-raw-color": "off",
    },
  },
  // Migration backlog (ratchet): files that still contain raw colors as of the
  // Phase 0a audit. The rule stays ON (error) everywhere else and for all new
  // files. DELETE entries from this list as each file is migrated to tokens
  // (Phase 1/4) — the goal is an empty list.
  ...(RAW_COLOR_BACKLOG.length
    ? [
        {
          files: RAW_COLOR_BACKLOG,
          rules: {
            "realms/no-raw-color": "off",
          },
        },
      ]
    : []),
]);

export default eslintConfig;
