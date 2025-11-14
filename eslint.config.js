// eslint.config.js (Flat config, ESM-safe)
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build artifacts
  globalIgnores(['dist', 'coverage', 'node_modules']),

  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2023,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        // If you use path alias "@", install:
        //   npm i -D eslint-import-resolver-typescript
        // then uncomment the block below and ensure tsconfig paths are set
        // typescript: {
        //   alwaysTryTypes: true,
        //   project: ['./tsconfig.json'],
        // },
      },
    },
    // Base rules
    rules: {
      // React fast refresh: warn (not error) if file exports non-components
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Hooks
      ...reactHooks.configs['recommended-latest'].rules,

      // JSX a11y
      ...jsxA11y.configs.recommended.rules,

      // Import hygiene
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [{ pattern: '@/**', group: 'internal', position: 'after' }],
        pathGroupsExcludedImportTypes: ['builtin'],
      }],

      // TS prefers type-only imports
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],

      // Let TS handle unused vars
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // React 17+ (no need to import React in scope)
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      'plugin:react/recommended',
    ],
  },
])
