import { type ViteUserConfigExport } from "vitest/config";

const config: ViteUserConfigExport = {
    define: {
        REDGEOMETRY_DEBUG: "true",
    },
};

export default config;
