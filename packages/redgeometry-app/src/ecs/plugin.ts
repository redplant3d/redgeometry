import { assert } from "redgeometry/src/index";

export type WorldPluginId = string;
export type WorldPlugin = { readonly pluginId: WorldPluginId };
export type WorldPluginIdOf<T extends WorldPlugin> = T["pluginId"];

export class WorldPluginStorage {
    public pluginEntries: Map<WorldPluginId, WorldPlugin | undefined>;

    constructor() {
        this.pluginEntries = new Map();
    }

    public register(pluginId: WorldPluginId): void {
        const hasPlugin = this.pluginEntries.has(pluginId);
        assert(!hasPlugin, "World plugin id '{}' is already registered", pluginId);

        this.pluginEntries.set(pluginId, undefined);
    }

    public require(pluginId: WorldPluginId): void {
        const hasPlugin = this.pluginEntries.has(pluginId);
        assert(hasPlugin, "World plugin id '{}' is required but missing", pluginId);
    }

    public set<T extends WorldPlugin>(plugin: T): void {
        const hasPlugin = this.pluginEntries.has(plugin.pluginId);
        assert(hasPlugin, "World plugin id '{}' is not registered", plugin.pluginId);

        this.pluginEntries.set(plugin.pluginId, plugin);
    }

    public get<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): T {
        const plugin = this.pluginEntries.get(pluginId);
        assert(plugin !== undefined, "World plugin id '{}' is not available", pluginId);

        return plugin as T;
    }
}
