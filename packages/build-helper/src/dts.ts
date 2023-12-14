import { generateDtsBundle, type EntryPointConfig } from "dts-bundle-generator";
import { writeFile } from "./file.js";

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

    console.log("\x1b[32mDone\x1b[0m");
}
