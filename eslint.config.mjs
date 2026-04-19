import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
]);

export default eslintConfig;
