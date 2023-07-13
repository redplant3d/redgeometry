import { serveHelper } from "build-helper/src/esbuild.js";
import { removeDir } from "build-helper/src/file.js";

// Clean old build files
removeDir("./dist");

// Serve app with live reload
serveHelper(
    {
        bundle: true,
        define: { "process.env.NODE_ENV": '"development"' },
        entryPoints: [
            { in: "./src/index.ts", out: "index" },
            { in: "./public/index.html", out: "index" },
        ],
        format: "esm",
        loader: { ".html": "copy", ".wgsl": "text" },
        outdir: "./dist",
        sourcemap: true,
        sourcesContent: false,
        target: "ESNext",
        write: false,
    },
    {
        host: "127.0.0.1",
        port: 8001,
    },
    {},
);
