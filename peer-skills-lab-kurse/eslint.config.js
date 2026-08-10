import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    // src/lib, src/hooks, src/api und App.jsx waren bisher vom Linting
    // ausgenommen — also genau die Dateien, in denen die Hook-Fehler steckten.
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    ignores: ["src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      // Der `rules`-Block überschreibt die Regeln aus pluginJs.configs.recommended
      // komplett, deshalb steht no-undef hier explizit. Ohne die Regel fällt ein
      // versehentlich entfernter Prop erst zur Laufzeit auf — genau so ist die
      // AboutUs-Seite mit "A is not defined" abgestürzt.
      "no-undef": "error",
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      // Zunächst als Warnung: die Regel deckt echte Stale-Closure-Fehler auf,
      // aber nicht jede Meldung lässt sich ohne Verhaltensänderung beheben.
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
