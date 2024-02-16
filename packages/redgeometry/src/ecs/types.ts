import type { Nominal } from "../utility/types.js";
import { World } from "./world.js";

// Entity
export type EntityId = Nominal<number, "EntityId">;

// Component
export type ComponentId = string;
export type ComponentIdOf<T extends Component> = T["componentId"];
export type ComponentIdsOf<T extends Component[]> = { [P in keyof T]: ComponentIdOf<T[P]> };
export type Component = { componentId: ComponentId };

// System
export type SystemSync = (world: World, ...args: any[]) => void;
export type SystemAsync = (world: World, ...args: any[]) => Promise<void>;
export type System = SystemAsync | SystemSync;

export type SystemMode<T> = T extends SystemAsync
    ? { mode: "async" }
    : T extends SystemSync
      ? { mode?: "sync" }
      : never;
export type SystemArgs<T> = T extends (world: World, ...args: infer A) => void
    ? A extends [unknown, ...unknown[]]
        ? { args: A }
        : { args?: A }
    : never;

export type SystemStage = "start" | "update" | "stop";
export type SystemOrder = "before" | "after";

export type SystemDependency = {
    seq: [System, ...System[]];
    stage?: SystemStage;
    optional?: boolean;
};

export type SystemOptions<T = System> = {
    fn: T;
    stage?: SystemStage;
} & SystemMode<T> &
    SystemArgs<T>;

// Plugin
export type WorldPlugin = (world: World) => void;

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

// Serializable
export type Serializable = {
    toArray(): number[];
};

export type SerializableConstructor<T extends Serializable> = {
    new (...args: any[]): T;
    fromArray(data: number[]): T;
};
