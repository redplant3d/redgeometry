import type { ConfigExport } from "rolldown";
import { dts } from "rolldown-plugin-dts";

const config: ConfigExport = [
    {
        input: "src/index.ts",
        output: {
            entryFileNames: "[name].js",
            format: "module",
            sourcemap: true,
        },
        plugins: [dts()],
        transform: {
            define: {
                REDGEOMETRY_DEBUG: "false",
            },
        },
    },
    {
        input: "src/index.ts",
        output: {
            entryFileNames: "[name].cjs",
            format: "commonjs",
            sourcemap: true,
        },
        plugins: [],
        transform: {
            define: {
                REDGEOMETRY_DEBUG: "false",
            },
        },
    },
    // Dedicated run for commonjs type declarations
    {
        input: "src/index.ts",
        output: {
            entryFileNames: "[name].cjs",
        },
        plugins: [dts({ emitDtsOnly: true })],
        transform: {
            define: {
                REDGEOMETRY_DEBUG: "false",
            },
        },
    },
];

export default config;
