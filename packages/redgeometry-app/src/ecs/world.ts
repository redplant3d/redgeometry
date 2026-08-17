import { assert } from "redgeometry/src/internal/debug";
import { log } from "redgeometry/src/internal/log";
import { WorldDataStorage, type WorldData, type WorldDataId, type WorldDataIdOf } from "./data.js";
import {
    EntityComponentIterator,
    EntityComponentStorage,
    type Component,
    type ComponentIdOf,
    type EntityComponentQueryValue,
    type EntityId,
} from "./entity-component.ts";
import {
    WorldEventIterator,
    WorldEventStorage,
    type WorldEvent,
    type WorldEventId,
    type WorldEventIdOf,
} from "./event.ts";
import { WorldPluginStorage, type WorldPlugin, type WorldPluginId, type WorldPluginIdOf } from "./plugin.js";
import {
    SystemScheduleStorage,
    type SystemDependencyOptions,
    type SystemOptions,
    type SystemScheduleId,
} from "./system-schedule.js";

export type WorldId = string;
export type WorldModuleId = string;

export type WorldModuleOptions = {
    id: WorldModuleId;
    fn: (context: WorldContext) => void;
};

export type WorldContextRegisterDataEntry = {
    type: "register-data";
    dataId: WorldDataId;
};
export type WorldContextRegisterEventEntry = {
    type: "register-event";
    eventId: WorldDataId;
};
export type WorldContextRegisterModuleEntry = {
    type: "register-module";
    options: WorldModuleOptions;
};
export type WorldContextRegisterPluginEntry = {
    type: "register-plugin";
    pluginId: WorldPluginId;
};
export type WorldContextRegisterScheduleEntry = {
    type: "register-schedule";
    scheduleId: SystemScheduleId;
};
export type WorldContextRegisterSystemEntry = {
    type: "register-system";
    options: SystemOptions;
};
export type WorldContextRegisterSystemDependencyEntry = {
    type: "register-system-dependency";
    options: SystemDependencyOptions;
};
export type WorldContextRequireDataEntry = {
    type: "require-data";
    dataId: WorldDataId;
};
export type WorldContextRequireEventEntry = {
    type: "require-event";
    eventId: WorldEventId;
};
export type WorldContextRequirePluginEntry = {
    type: "require-plugin";
    pluginId: WorldPluginId;
};
export type WorldContextEntry =
    | WorldContextRegisterDataEntry
    | WorldContextRegisterEventEntry
    | WorldContextRegisterModuleEntry
    | WorldContextRegisterPluginEntry
    | WorldContextRegisterScheduleEntry
    | WorldContextRegisterSystemEntry
    | WorldContextRegisterSystemDependencyEntry
    | WorldContextRequireDataEntry
    | WorldContextRequireEventEntry
    | WorldContextRequirePluginEntry;

export const ComponentFlags = {
    NONE: 0,
    DEFAULT: 1,
    ADDED: 2,
    UPDATED: 4,
    DELETED: 8,
    ALL: 15,
} as const;
export type ComponentFlags = number;

export const EntityFlags = {
    NONE: 0,
    DEFAULT: 1,
    CREATED: 2,
    DESTROYED: 4,
    ALL: 7,
} as const;
export type EntityFlags = number;

export class World {
    private entityComponentStorage: EntityComponentStorage;
    private systemScheduleStorage: SystemScheduleStorage;
    private dataStorage: WorldDataStorage;
    private eventStorage: WorldEventStorage;
    private pluginStorage: WorldPluginStorage;

    constructor(
        entityComponentStorage: EntityComponentStorage,
        systemScheduleStorage: SystemScheduleStorage,
        dataStorage: WorldDataStorage,
        eventStorage: WorldEventStorage,
        pluginStorage: WorldPluginStorage,
    ) {
        this.entityComponentStorage = entityComponentStorage;
        this.systemScheduleStorage = systemScheduleStorage;
        this.dataStorage = dataStorage;
        this.eventStorage = eventStorage;
        this.pluginStorage = pluginStorage;
    }

    public addComponent<T extends Component>(entityId: EntityId, component: T): void {
        this.entityComponentStorage.addComponent(entityId, component);
    }

    public addEvent<T extends WorldEvent>(event: T): void {
        this.eventStorage.add(event);
    }

    public addEventArray<T extends WorldEvent>(events: T[]): void {
        this.eventStorage.addArray(events);
    }

    public clearEntities(): void {
        this.entityComponentStorage.clear();
    }

    public createEntity(): EntityId {
        return this.entityComponentStorage.createEntity();
    }

    public deleteComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): void {
        this.entityComponentStorage.deleteComponent(entity, componentId);
    }

    public destroyEntity(entity: EntityId): void {
        this.entityComponentStorage.destroyEntity(entity);
    }

    public findComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        return this.entityComponentStorage.findComponent(entity, componentId);
    }

    public findLastEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): T | undefined {
        return this.eventStorage.findLast(eventId);
    }

    public getComponentFlags<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): ComponentFlags {
        return this.entityComponentStorage.getComponentFlags(entityId, componentId);
    }

    public getData<T extends WorldData>(dataId: WorldDataIdOf<T>): T {
        return this.dataStorage.get(dataId);
    }

    public getEntityFlags(entityId: EntityId): EntityFlags {
        return this.entityComponentStorage.getEntityFlags(entityId);
    }

    public getEvents<T extends WorldEvent>(eventId: WorldEventIdOf<T>): WorldEventIterator<T> {
        return this.eventStorage.get(eventId);
    }

    public getPlugin<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): T {
        return this.pluginStorage.get(pluginId);
    }

    public hasComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): boolean {
        return this.entityComponentStorage.hasComponent(entityId, componentId);
    }

    public hasComponentFlags<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        return this.entityComponentStorage.hasComponentFlags(entityId, componentId, flagMask);
    }

    public hasComponentFlagsAny<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        return this.entityComponentStorage.hasComponentFlagsAny(entityId, componentId, flagMask);
    }

    public hasEntityFlags(entityId: EntityId, flagMask: EntityFlags): boolean {
        return this.entityComponentStorage.hasEntityFlags(entityId, flagMask);
    }

    public hasEntityFlagsAny(entityId: EntityId, flagMask: EntityFlags): boolean {
        return this.entityComponentStorage.hasEntityFlagsAny(entityId, flagMask);
    }

    public isEntityAlive(entityId: EntityId): boolean {
        return this.entityComponentStorage.isEntityAlive(entityId);
    }

    public queryEntities<T extends Component = Component>(
        predicate: (q: EntityComponentQueryValue<T>) => boolean,
    ): EntityComponentIterator<T> {
        return this.entityComponentStorage.queryEntities(predicate);
    }

    public reset(): void {
        this.entityComponentStorage.reset();
        this.eventStorage.reset();
    }

    public runSchedule(scheduleId: SystemScheduleId): Promise<void> {
        return this.systemScheduleStorage.runSchedule(scheduleId, this);
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        this.entityComponentStorage.setComponent(entityId, component);
    }

    public setData<T extends WorldData>(data: T): void {
        this.dataStorage.set(data);
    }

    public setPlugin<T extends WorldPlugin>(plugin: T): void {
        this.pluginStorage.set(plugin);
    }

    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        this.entityComponentStorage.updateComponent(entityId, componentId);
    }
}

export class WorldContext {
    private entries: WorldContextEntry[];

    constructor(entries: WorldContextEntry[]) {
        this.entries = entries;
    }

    public addData<T extends WorldData>(dataId: WorldDataIdOf<T>): void {
        this.entries.push({ type: "register-data", dataId });
    }

    public addEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): void {
        this.entries.push({ type: "register-event", eventId });
    }

    public addModule(options: WorldModuleOptions): void {
        this.entries.push({ type: "register-module", options });
    }

    public addPlugin<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): void {
        this.entries.push({ type: "register-plugin", pluginId });
    }

    public addSchedule(scheduleId: SystemScheduleId): void {
        this.entries.push({ type: "register-schedule", scheduleId });
    }

    public addSystem(options: SystemOptions): void {
        this.entries.push({ type: "register-system", options });
    }

    public addSystemDepedency(options: SystemDependencyOptions): void {
        this.entries.push({ type: "register-system-dependency", options });
    }

    public requireData<T extends WorldData>(dataId: WorldDataIdOf<T>): void {
        this.entries.push({ type: "require-data", dataId });
    }

    public requireEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): void {
        this.entries.push({ type: "require-event", eventId });
    }

    public requirePlugin<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): void {
        this.entries.push({ type: "require-plugin", pluginId });
    }
}

export class WorldStorage {
    private worlds: Map<WorldId, World>;

    constructor() {
        this.worlds = new Map();
    }

    public add(worldId: WorldId, options: WorldModuleOptions): World {
        const hasWorld = this.worlds.has(worldId);
        assert(!hasWorld, "World '{}' already exists", worldId);

        const world = this.createWorld({ type: "register-module", options });
        this.worlds.set(worldId, world);

        return world;
    }

    public get(worldId: WorldId): World {
        const world = this.worlds.get(worldId);
        assert(world !== undefined, "World '{}' not found", worldId);

        return world;
    }

    private createWorld(moduleEntry: WorldContextRegisterModuleEntry): World {
        const modules = new Map<WorldModuleId, WorldContextEntry[]>();

        this.iterateEntry(moduleEntry, modules);

        const entityComponentStorage = new EntityComponentStorage();
        const systemScheduleStorage = new SystemScheduleStorage();
        const dataStorage = new WorldDataStorage();
        const eventStorage = new WorldEventStorage();
        const pluginStorage = new WorldPluginStorage();

        // First pass
        for (const [moduleId, entries] of modules) {
            for (const entry of entries) {
                switch (entry.type) {
                    case "register-data": {
                        dataStorage.register(entry.dataId, moduleId);
                        break;
                    }
                    case "register-event": {
                        eventStorage.register(entry.eventId, moduleId);
                        break;
                    }
                    case "register-plugin": {
                        pluginStorage.register(entry.pluginId, moduleId);
                        break;
                    }
                    case "register-schedule": {
                        systemScheduleStorage.registerSchedule(entry.scheduleId, moduleId);
                        break;
                    }
                }
            }
        }

        // Second pass
        for (const [moduleId, entries] of modules) {
            for (const entry of entries) {
                switch (entry.type) {
                    case "require-data": {
                        dataStorage.require(entry.dataId, moduleId);
                        break;
                    }
                    case "require-event": {
                        eventStorage.require(entry.eventId, moduleId);
                        break;
                    }
                    case "require-plugin": {
                        pluginStorage.require(entry.pluginId, moduleId);
                        break;
                    }
                    case "register-system": {
                        systemScheduleStorage.registerSystem(entry.options, moduleId);
                        break;
                    }
                    case "register-system-dependency": {
                        systemScheduleStorage.registerSystemDependency(entry.options, moduleId);
                        break;
                    }
                }
            }
        }

        systemScheduleStorage.initialize();

        return new World(entityComponentStorage, systemScheduleStorage, dataStorage, eventStorage, pluginStorage);
    }

    private iterateEntry(
        moduleEntry: WorldContextRegisterModuleEntry,
        outModules: Map<WorldModuleId, WorldContextEntry[]>,
    ): void {
        const subEntries: WorldContextEntry[] = [];
        const ctx = new WorldContext(subEntries);

        moduleEntry.options.fn(ctx);
        outModules.set(moduleEntry.options.id, subEntries);

        for (const subEntry of subEntries) {
            if (subEntry.type !== "register-module") {
                continue;
            }

            if (outModules.has(subEntry.options.id)) {
                log.warn(
                    "Ignoring duplicate world module '{}' (addded in '{}')",
                    subEntry.options.id,
                    moduleEntry.options.id,
                );
                continue;
            }

            // Initialize modules recursively
            this.iterateEntry(subEntry, outModules);
        }
    }
}
