import js from "@eslint/js";
import globals from "globals";

export default [
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
  { files: ["tests/**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.jest } },
  { files: ["jest.setup.js"], languageOptions: { globals: globals.jest } },
  js.configs.recommended,
];
