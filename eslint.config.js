const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  { ignores: ['node_modules/**', 'android/**', 'ios/**', '.expo/**', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, __DEV__: 'readonly', require: 'readonly', alert: 'readonly' },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-no-undef': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  { files: ['*.config.js', 'metro.config.js', 'babel.config.js'], languageOptions: { sourceType: 'commonjs' } },
];
