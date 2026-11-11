import parser from "@typescript-eslint/parser";
import ts from "@typescript-eslint/eslint-plugin";
import hooks from "eslint-plugin-react-hooks";
export default [
  {
    ignores: [
      "dist/**",
      "bindings/**",
      "node_modules/**",
      "src/routeTree.gen.ts",
      "runtime*.js",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { "@typescript-eslint": ts, "react-hooks": hooks },
    rules: {
      ...ts.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
