import { assert } from "redgeometry/src/internal/debug";
import type { WorldModuleId } from "./world.ts";

export type WorldPluginId = string;
export type WorldPlugin = { readonly pluginId: WorldPluginId };
export type WorldPluginIdOf<T extends WorldPlugin> = T["pluginId"];

type WorldPluginEntry = {
    plugin: WorldPlugin | undefined;
};

export class WorldPluginStorage {
    public entries: Map<WorldPluginId, WorldPluginEntry>;

    constructor() {
        this.entries = new Map();
    }

    public get(pluginId: WorldPluginId): WorldPlugin {
        const entry = this.entries.get(pluginId);
        assert(entry !== undefined, "World plugin '{}' is not registered", pluginId);
        assert(entry.plugin !== undefined, "World plugin '{}' is not initialized", pluginId);

        return entry.plugin;
    }

    public register(pluginId: WorldPluginId, moduleId: WorldModuleId): void {
        assert(
            !this.entries.has(pluginId),
            "World plugin '{}' is registered from world module '{}' but has already been registered",
            pluginId,
            moduleId,
        );

        this.entries.set(pluginId, {
            plugin: undefined,
        });
    }

    public require(pluginId: WorldPluginId, moduleId: WorldModuleId): void {
        assert(
            this.entries.has(pluginId),
            "World plugin '{}' is required by world module '{}' but has not been registered",
            pluginId,
            moduleId,
        );
    }

    public set(plugin: WorldPlugin): void {
        const entry = this.entries.get(plugin.pluginId);
        assert(entry !== undefined, "World plugin '{}' has not been registered in a world module", plugin.pluginId);

        entry.plugin = plugin;
    }
}
