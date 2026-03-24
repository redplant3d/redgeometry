import { type ConfigEnv, type UserConfigExport } from "vite";

const config: UserConfigExport = (env: ConfigEnv) => ({
    define: {
        REDGEOMETRY_DEBUG: env.mode === "development",
    },
});

export default config;
