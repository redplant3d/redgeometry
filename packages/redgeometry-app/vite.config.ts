import { type ConfigEnv, type UserConfigExport } from "vite";

const config: UserConfigExport = (env: ConfigEnv) => ({
    base: "./",
    define: {
        REDGEOMETRY_DEBUG: env.mode === "development",
    },
    server: {
        host: true,
    },
});

export default config;
