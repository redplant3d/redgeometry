import { assert } from "redgeometry/src/index";

export type WorldPluginId = string;
export type WorldPlugin = { readonly pluginId: WorldPluginId };
export type WorldPluginIdOf<T extends WorldPlugin> = T["pluginId"];

export class WorldPluginStorage {
    private plugins: Map<WorldPluginId, WorldPlugin | undefined>;

    constructor() {
        this.plugins = new Map();
    }

    public register(pluginId: WorldPluginId): void {
        const hasPlugin = this.plugins.has(pluginId);
        assert(!hasPlugin, "World plugin id '{}' is already registered", pluginId);

        this.plugins.set(pluginId, undefined);
    }

    public require(pluginId: WorldPluginId): void {
        const hasPlugin = this.plugins.has(pluginId);
        assert(hasPlugin, "World plugin id '{}' is required but missing", pluginId);
    }

    public set<T extends WorldPlugin>(plugin: T): void {
        this.plugins.set(plugin.pluginId, plugin);
    }

    public get<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): T {
        const plugin = this.plugins.get(pluginId);
        assert(plugin !== undefined, "World plugin id '{}' is not available", pluginId);

        return plugin as T;
    }
}
