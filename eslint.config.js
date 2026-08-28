import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Never lint build output or deps
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },

  // App source
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Components and constants are PascalCase / UPPER_CASE; don't flag
      // them as unused when they're only referenced in JSX.
      "no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^_",
        },
      ],

      // Supabase wrappers throw on error and callers catch. An empty catch
      // block means an error is being swallowed silently.
      "no-empty": ["error", { allowEmptyCatch: false }],

      // Realtime subscriptions and async wrappers make these genuinely
      // dangerous rather than stylistic.
      "no-unused-expressions": "error",
      "require-atomic-updates": "error",

      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Test files
  {
    files: ["src/**/*.{test,spec}.{js,jsx}", "src/**/__tests__/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Vite config and other root-level tooling files run in Node
  {
    files: ["*.config.js", "vite.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];