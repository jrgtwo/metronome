import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.vite', 'node_modules'] },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },

  // App + test source — TYPE-CHECKED (recommendedTypeChecked enables the type-aware
  // rules, notably no-floating-promises which enforces the `void` fire-and-forget style).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      // projectService auto-discovers the project-references graph (tsconfig.app.json
      // for src+tests, tsconfig.node.json for vite.config.ts) — no manual project array.
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TS (strict + noUnusedLocals via `tsc -b`) is the source of truth for
      // undefined/unused identifiers; core no-undef also false-positives on Vitest's
      // ambient globals (describe/it/expect — globals:true).
      'no-undef': 'off',
    },
  },

  // shadcn-generated UI — don't lint-police vendored code.
  {
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Tests.
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Config files run in Node and aren't part of a typed tsconfig project
  // (tailwind.config.ts / vite.config.ts / postcss.config.js / eslint.config.js).
  // disableTypeChecked turns off the type-aware rules AND tells the parser not to
  // require a project — otherwise tailwind.config.ts errors as "not found by the
  // project service".
  {
    files: ['**/*.{js,cjs,mjs}', '*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
);
