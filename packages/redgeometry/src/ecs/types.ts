import type { Nominal } from "../utility/types.js";
import type { World } from "./world.js";

// Entity
export type EntityId = Nominal<number, "EntityId">;

// Component
export type ComponentId = string;

export type ComponentIdOf<T extends Component> = T["componentId"];
export type ComponentIdsOf<T extends Component[]> = { [P in keyof T]: ComponentIdOf<T[P]> };

export type Component = { componentId: ComponentId };

// System
export type SystemSync = (world: World) => void;
export type SystemAsync = (world: World) => Promise<void>;

export type SystemArgs = [unknown, ...unknown[]];

export type SystemWithArgsSync<T extends SystemArgs> = (world: World, ...args: T) => void;
export type SystemWithArgsAsync<T extends SystemArgs> = (world: World, ...args: T) => Promise<void>;

export type System = SystemSync | SystemAsync | SystemWithArgsSync<SystemArgs> | SystemWithArgsAsync<SystemArgs>;

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

// Plugin
export type WorldPluginId = string;

export interface WorldPlugin {
    id: WorldPluginId;

    setup(world: World): void;
}

// World
export type WorldId = string;
export type WorldGroupId = string;

// World data
export type WorldDataId = string;
export type WorldData = { dataId: WorldDataId };
export type WorldDataIdOf<T extends WorldData> = T["dataId"];

// World event
export type WorldEventId = string;
export type WorldEvent = { eventId: WorldEventId };
export type WorldEventIdOf<T extends WorldEvent> = T["eventId"];

// World schedule
export type WorldScheduleId = string;

export type DefaultWorldScheduleId = "start" | "update" | "stop";

// Serializable
export type Serializable = {
    toArray(): number[];
};

export type SerializableConstructor<T extends Serializable> = {
    new (...args: never[]): T;
    fromArray(data: number[]): T;
};
