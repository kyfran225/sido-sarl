module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error'
  }
};
