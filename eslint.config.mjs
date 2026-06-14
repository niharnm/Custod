import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next (made recursive so stray build
    // output in sibling folders like website/.next is ignored too):
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // Untracked local scratch build dir — not part of the app.
    "website/**",
    // The Chrome extension is plain, unbundled MV3 JavaScript (browser globals
    // like `chrome`, no TS/JSX). It has its own conventions and is not linted by
    // the Next.js/TypeScript ruleset.
    "extension/**",
  ]),
]);

export default eslintConfig;
