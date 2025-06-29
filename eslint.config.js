import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // or "commonjs" if using require()
      globals: {
        ...globals.browser,
        ...globals.node, // ✅ adds 'process', '__dirname', etc.
      },
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "tests/",
      "*.config.js", // optional
    ],
  },
]);
