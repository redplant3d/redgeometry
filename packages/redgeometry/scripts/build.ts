import { buildHelper } from "build-helper/src/esbuild";
import { removeDir } from "build-helper/src/file";
import { tscHelper } from "build-helper/src/typescript";

// Clean old build files
removeDir("./dist");

// Build library for `esm` and `cjs`
await buildHelper(
    {
        bundle: true,
        define: { "process.env.NODE_ENV": '"production"' },
        entryPoints: ["./src/index.ts"],
        metafile: true,
        minify: true,
        sourcemap: true,
        sourcesContent: false,
        target: "ES2020",
    },
    [
        {
            format: "esm",
            outfile: "./dist/index.js",
        },
        {
            format: "cjs",
            outfile: "./dist/index.cjs",
        },
    ]
);

// Run `tsc` to create type declarations
tscHelper(
    {
        files: ["./src/index.ts"],
    },
    {
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        noEmit: false,
        outDir: "./dist",
    }
);
