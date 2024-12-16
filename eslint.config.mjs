import functional from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  functional.configs.recommended,
  importPlugin.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    ignores: [
      "server.js",
      "**/*.config.js",
      "**/*.config.mjs",
      "infra/**",
      "public/**",
      ".history/**",
    ],
  },
  {
    settings: {
      "import/resolver": {},
    },
  },
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.ts"],
    rules: {
      "functional/no-throw-statements": "off",
      "functional/no-expression-statements": "off",
      "functional/no-return-void": "off",
      "functional/no-conditional-statements": "off",
      "functional/no-mixed-types": "off",
      "functional/no-loop-statements": "off",
      "functional/immutable-data": "off",
      "functional/no-let": "off",
      "functional/prefer-readonly-type": [
        "error",
        {
          allowLocalMutation: true,
          allowMutableReturnType: false,
          checkImplicit: false,
          ignoreClass: false,
          ignoreInterface: false,
        },
      ],
      "import/prefer-default-export": "off",
      // https://github.com/import-js/eslint-plugin-import/issues/2995
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-unresolved": "off",
      //   "import/newline-after-import": ["error", { count: 2 }],

      "import/order": [
        "error",
        {
          pathGroups: [
            {
              pattern: "@/**",
              group: "external",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "never",
        },
      ],
    },
  },
);
