import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
    files: ["**/{src,tests}/**/*.ts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            projectService: true,
        },
    },
    rules: {
        eqeqeq: "error",
        "@typescript-eslint/no-explicit-any": [
            "error",
            {
                ignoreRestArgs: true,
            },
        ],
        "@typescript-eslint/no-unnecessary-condition": "error",
        "@typescript-eslint/no-unused-expressions": "error",
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
