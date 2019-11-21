module.exports = {
  parser: "babel-eslint",
  // extends: ['eslint-config-google'].map(require.resolve),
  extends: ['@advanced-rest-client/eslint-config'].map(require.resolve),
  rules: {
    'import/no-extraneous-dependencies': 'off'
  }
};
