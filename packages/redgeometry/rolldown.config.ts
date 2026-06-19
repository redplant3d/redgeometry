import type { ConfigExport } from "rolldown";
import { dts } from "rolldown-plugin-dts";

const config: ConfigExport = [
    {
        input: "src/index.ts",
        output: {
            cleanDir: true,
            format: "es",
            sourcemap: true,
        },
        plugins: [dts()],
        transform: {
            define: {
                REDGEOMETRY_DEBUG: "false",
            },
        },
    },
];

export default config;
