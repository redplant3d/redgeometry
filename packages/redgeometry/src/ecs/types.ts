import { World } from "./world.js";

export enum ChangeFlags {
    None = 0,
    Created = 1,
    Updated = 2,
    Deleted = 4,
}

// Component
export type ComponentId = string;
export type Component = { componentId: ComponentId };

export type ComponentIdOf<T extends Component> = T["componentId"];
export type ComponentsIdsOf<T extends Component[]> = { [P in keyof T]: ComponentIdOf<T[P]> };

export type Components = Record<ComponentId, Component>;
export type TypedComponent<T extends Component> = { [P in T as ComponentIdOf<P>]: P };
export type TypedComponents<T extends Component[]> = { [P in T[number] as ComponentIdOf<P>]: P };

// Changeset
export type Changeset = Record<ComponentId, ChangeFlags>;
export type TypedChangeset<T extends Component[]> = { [P in T[number] as ComponentIdOf<P>]: ChangeFlags };

// Entity
export type EntityId = number;

export type EntityEntry = {
    entity: EntityId;
    components: Components;
    changeset: Changeset;
};
export type TypedEntityEntry<T extends Component[], U extends Component[]> = {
    entity: EntityId;
    components: TypedComponents<T>;
    changeset: TypedChangeset<U>;
};

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

export type CallbackSystemOptions<T = System> = {
    fn: T;
    world: World;
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
