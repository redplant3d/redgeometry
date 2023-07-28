import { buildHelper } from "../../build-helper/src/esbuild.js";
import { removeDir } from "../../build-helper/src/file.js";

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
    loader: { ".html": "copy", ".wgsl": "text" },
    minify: true,
    outdir: "./dist",
    target: "ESNext",
});
