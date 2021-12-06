module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {args: "all", argsIgnorePattern: "^_"},
    ],

    "@typescript-eslint/no-this-alias": [
      "error",
      {
        "allowedNames": ["self"],
        "allowDestructuring": true
      },
    ],
    "quotes": [
      "error",
      "single"
    ]
  },
  overrides: [
    {
      "files": [ "*.json" ],
      "rules": {
        "quotes": [ "error", "double" ],
        "indent": [ "error", 2 ]
      }
    }
  ]
};
