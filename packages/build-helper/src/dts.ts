import { writeFile } from "build-helper/src/file.js";
import { generateDtsBundle, type EntryPointConfig } from "dts-bundle-generator";

export type DtsBundleOptions = {
    config: EntryPointConfig;
    outputFiles: string[];
};

export function dtsBundleHelper(options: DtsBundleOptions): void {
    console.log("Executing dts-bundle-generator...");

    const dts = generateDtsBundle([options.config]);

    for (const data of dts) {
        for (const path of options.outputFiles) {
            writeFile(path, data);
        }
    }

    console.log(`\x1b[32mDone\x1b[0m`);
}
