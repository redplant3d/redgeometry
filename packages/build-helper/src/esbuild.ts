import { build, BuildContext, BuildOptions, BuildResult, context, ServeOptions, WatchOptions } from "esbuild";
import { createDir, joinPaths, writeFile } from "./file";

const FOOTER_LIVE_RELOAD_DEFAULT = `
// footer
const eventSource = new EventSource("/esbuild");
eventSource.addEventListener("change", () => {
  console.log("Live reload");
  location.reload();
});`;

const FOOTER_LIVE_RELOAD_IIFE = `
(() => {
  // footer
  const eventSource = new EventSource("/esbuild");
  eventSource.addEventListener("change", () => {
    console.log("Live reload");
    location.reload();
  });
})();`;

export async function buildHelper(
    options: BuildOptions,
    variants?: BuildOptions[]
): Promise<BuildResult<BuildOptions>[]> {
    console.log("Building...");

    const buildResults: BuildResult<BuildOptions>[] = [];

    if (variants !== undefined) {
        for (const variant of variants) {
            const buildOptions: BuildOptions = { logLevel: "info", ...options, ...variant };
            const buildResult = await build(buildOptions);
            buildResults.push(buildResult);
        }

        return buildResults;
    } else {
        const buildOptions: BuildOptions = { logLevel: "info", ...options };
        const buildResult = await build(buildOptions);
        buildResults.push(buildResult);
    }

    return buildResults;
}

export async function serveHelper(
    buildOptions: BuildOptions,
    serveOptions: ServeOptions,
    watchOptions?: WatchOptions
): Promise<BuildContext> {
    console.log("Serving...");

    const contextOptions: BuildOptions = { format: "esm", logLevel: "info", ...buildOptions };

    if (watchOptions !== undefined) {
        if (contextOptions.format === "iife") {
            contextOptions.footer = { js: FOOTER_LIVE_RELOAD_IIFE };
        } else {
            contextOptions.footer = { js: FOOTER_LIVE_RELOAD_DEFAULT };
        }
    }

    const ctx = await context(contextOptions);

    if (watchOptions !== undefined) {
        ctx.watch(watchOptions);
    }

    await ctx.serve(serveOptions);

    return Promise.resolve(ctx);
}

export function writeMeta(path: string, results: BuildResult[]): void {
    console.log("Writing metafiles...");

    createDir(path);

    for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.metafile === undefined) {
            continue;
        }

        const metaPath = joinPaths(path, `meta${i}.json`);
        const metaData = JSON.stringify(result.metafile);

        writeFile(metaPath, metaData);
    }

    console.log(`\x1b[32mDone\x1b[0m`);
}
