import { assert } from "redgeometry/src/internal/debug";
import type { WorldModuleId } from "./world.ts";

export type WorldPluginId = string;
export type WorldPlugin = { readonly pluginId: WorldPluginId };
export type WorldPluginIdOf<T extends WorldPlugin> = T["pluginId"];

export class WorldPluginStorage {
    public pluginEntries: Map<WorldPluginId, WorldPlugin | undefined>;

    constructor() {
        this.pluginEntries = new Map();
    }

    public get<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): T {
        const plugin = this.pluginEntries.get(pluginId);
        assert(plugin !== undefined, "World plugin '{}' is not available", pluginId);

        return plugin as T;
    }

    public register(pluginId: WorldPluginId, moduleId: WorldModuleId): void {
        assert(
            !this.pluginEntries.has(pluginId),
            "World plugin '{}' is registered in world module '{}' but has already been registered",
            pluginId,
            moduleId,
        );

        this.pluginEntries.set(pluginId, undefined);
    }

    public require(pluginId: WorldPluginId, moduleId: WorldModuleId): void {
        assert(
            this.pluginEntries.has(pluginId),
            "World plugin '{}' is required in world module '{}' but has not been registered",
            pluginId,
            moduleId,
        );
    }

    public set<T extends WorldPlugin>(plugin: T): void {
        assert(
            this.pluginEntries.has(plugin.pluginId),
            "World plugin '{}' has not been registered in a world module",
            plugin.pluginId,
        );

        this.pluginEntries.set(plugin.pluginId, plugin);
    }
}
