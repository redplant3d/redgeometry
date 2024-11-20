import { defineConfig } from "vitest/config";

export default defineConfig({
    esbuild: {
        define: { REDGEOMETRY_DEBUG: "true" },
    },
});
