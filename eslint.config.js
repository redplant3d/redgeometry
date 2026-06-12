import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
    files: ["**/{src,tests}/**/*.ts"],
    extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
        parserOptions: {
            projectService: true,
        },
    },
    rules: {
        eqeqeq: "error",
        "no-useless-assignment": "off",
        "@typescript-eslint/no-unnecessary-condition": "error",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/strict-boolean-expressions": [
            "error",
            {
                allowString: false,
                allowNumber: false,
                allowNullableObject: false,
                allowNullableBoolean: false,
                allowNullableString: false,
                allowNullableNumber: false,
                allowAny: false,
            },
        ],
    },
});
