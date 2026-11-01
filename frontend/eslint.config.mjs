import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  // Rule 1: fetch only lives in src/lib/api. Everything else goes through api().
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/api/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Do not call fetch directly. Add a function in src/lib/api/ that uses api() (see CONVENTIONS.md).",
        },
      ],
    },
  },

  // Rule 2: components and pages call hooks, not API functions.
  // A warning (not an error) so it shows the remaining work without blocking the build.
  {
    files: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/lib/api/*"],
              message:
                "Components do not call the API directly. Use or add a hook in src/hooks/ (see CONVENTIONS.md).",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;