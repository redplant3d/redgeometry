import type { Nominal } from "redgeometry/src/utility/types";
import type { ComponentFlags, EntityFlags, World } from "./world.js";

// Entity
export type EntityId = Nominal<number, "EntityId">;

// Component
export type ComponentId = string;
export type Component = { readonly componentId: ComponentId };

export type ComponentIdOf<T extends Component> = T["componentId"];
export type ComponentIdsOf<T extends Component[]> = { [P in keyof T]: ComponentIdOf<T[P]> };

export type ComponentUnion<T extends Component[]> = T[number];

// System
export type SystemSync = (world: World) => void;
export type SystemAsync = (world: World) => Promise<void>;

export type System = SystemSync | SystemAsync;

// System stage
export type SystemStage = string;

export type DefaultSystemStage =
    | "start-pre"
    | "start"
    | "start-post"
    | "update-pre"
    | "update"
    | "update-post"
    | "stop-pre"
    | "stop"
    | "stop-post";

// World
export type WorldId = string;
export type WorldGroupId = string;

// World module
export type WorldModuleId = string;

export interface WorldModule {
    readonly moduleId: WorldModuleId;
    setup(world: World): void;
}

// World plugin
export type WorldPluginId = string;
export type WorldPlugin = { readonly pluginId: WorldPluginId };

export type WorldPluginIdOf<T extends WorldPlugin> = T["pluginId"];

// World data
export type WorldDataId = string;
export type WorldData = { readonly dataId: WorldDataId };

export type WorldDataIdOf<T extends WorldData> = T["dataId"];

// World event
export type WorldEventId = string;
export type WorldEvent = { readonly eventId: WorldEventId };

export type WorldEventIdOf<T extends WorldEvent> = T["eventId"];
export type WorldEventIdsOf<T extends WorldEvent[]> = { [P in keyof T]: WorldEventIdOf<T[P]> };

export type WorldEventUnion<T extends WorldEvent[]> = T[number];

// World schedule
export type WorldScheduleId = string;

export type DefaultWorldScheduleId = "start" | "update" | "stop";

// Query
export interface EntityComponentQueryValue<U extends Component> {
    /**
     * Equivalent to `hasComponentFlagsAny(componentId,
     * ComponentFlags.Default | ComponentFlags.Added | ComponentFlags.Updated)`
     */
    hasComponent<T extends U>(componentId: ComponentIdOf<T>): boolean;
    hasComponentFlags<T extends U>(componentId: ComponentIdOf<T>, flagMask: ComponentFlags): boolean;
    hasComponentFlagsAny<T extends U>(componentId: ComponentIdOf<T>, flagMask: ComponentFlags): boolean;
    hasEntityFlags(flagMask: EntityFlags): boolean;
    hasEntityFlagsAny(flagMask: EntityFlags): boolean;
    /**
     * Equivalent to `hasEntityFlagsAny(EntityFlags.Default | EntityFlags.Created)`
     */
    isEntityAlive(): boolean;
}

export interface EntityComponentIterator<U extends Component> {
    findComponent<T extends Component>(componentId: ComponentIdOf<T>): T | undefined;
    getComponent<T extends U>(componentId: ComponentIdOf<T>): T;
    getComponentFlags<T extends Component>(componentId: ComponentIdOf<T>): ComponentFlags;
    getEntityFlags(): EntityFlags;
    getEntityId(): EntityId;
    /**
     * Equivalent to `hasComponentFlagsAny(componentId,
     * ComponentFlags.Default | ComponentFlags.Added | ComponentFlags.Updated)`
     */
    hasComponent<T extends Component>(componentId: ComponentIdOf<T>): boolean;
    hasComponentFlags<T extends Component>(componentId: ComponentIdOf<T>, flagMask: ComponentFlags): boolean;
    hasComponentFlagsAny<T extends Component>(componentId: ComponentIdOf<T>, flagMask: ComponentFlags): boolean;
    hasEntityFlags(flagMask: EntityFlags): boolean;
    hasEntityFlagsAny(flagMask: EntityFlags): boolean;
    /**
     * Equivalent to `hasEntityFlagsAny(EntityFlags.Default | EntityFlags.Created)`
     */
    isEntityAlive(): boolean;
    next(): boolean;
    toEntityIdArray(): EntityId[];
}
