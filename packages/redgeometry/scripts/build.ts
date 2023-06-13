import { dtsBundleHelper } from "build-helper/src/dts.js";
import { buildHelper } from "build-helper/src/esbuild.js";
import { removeDir } from "build-helper/src/file.js";

// Clean old build files
removeDir("./dist");

// Build library for `esm` and `cjs`
await buildHelper(
    {
        bundle: true,
        define: { "process.env.NODE_ENV": '"production"' },
        entryPoints: ["./src/index.ts"],
        loader: { ".wgsl": "text" },
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

// Bundle types
dtsBundleHelper({
    config: { filePath: "./src/index.ts" },
    outputFiles: ["./dist/index.d.ts", "./dist/index.d.cts"],
});
