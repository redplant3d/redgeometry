import { buildHelper } from "build-helper/src/esbuild";
import { removeDir } from "build-helper/src/file";

// Clean old build files
removeDir("./dist");

// Build application
await buildHelper({
    bundle: true,
    define: { "process.env.NODE_ENV": '"production"' },
    entryPoints: [
        { in: "./src/index.ts", out: "index" },
        { in: "./public/index.html", out: "index" },
    ],
    format: "esm",
    loader: { ".html": "copy" },
    minify: true,
    outdir: "./dist",
    target: "ESNext",
});
