import js from '@eslint/js'

export default [
  {
    ignores: ['node_modules/', 'dist/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^(_err|_)$', varsIgnorePattern: '^_' }],
    },
  },
]
