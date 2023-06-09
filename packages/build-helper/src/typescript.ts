import {
    createProgram,
    findConfigFile,
    parseJsonConfigFileContent,
    readConfigFile,
    sys,
    type CompilerOptions,
} from "typescript";

export interface ConfigOptions {
    exclude?: string[];
    files?: string[];
    include?: string[];
}

export function tscHelper(configOptions: ConfigOptions, compilerOptions: CompilerOptions): void {
    console.log("Executing tsc...");

    const json = getConfigJson(configOptions);
    const parsed = parseJsonConfigFileContent(json, sys, "./");
    const program = createProgram(parsed.fileNames, { ...parsed.options, ...compilerOptions });
    const result = program.emit();

    if (result.emitSkipped) {
        console.log("\x1b[33mWarning: Emit skipped\x1b[0m");
    }

    console.log(`\x1b[32mDone\x1b[0m`);
}

function getConfigJson(config: ConfigOptions): unknown {
    // Try to find `tsconfig.json`
    const configFileName = findConfigFile("./", sys.fileExists);

    if (configFileName !== undefined) {
        const configFile = readConfigFile(configFileName, sys.readFile);
        return { ...configFile.config, ...config };
    } else {
        return config;
    }
}
