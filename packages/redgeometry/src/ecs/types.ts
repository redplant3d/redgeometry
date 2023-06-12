import { World } from "./world.js";

// Entity
export type EntityId = number;

export type EntityEntry = { entity: EntityId; components: Components };
export type Entities = Map<EntityId, Components>;

export type TypedEntityEntry<T extends Component[]> = { entity: EntityId; components: TypedComponents<T> };
export type TypedEntities<T extends Component[]> = Map<EntityId, TypedComponents<T>>;

// Component
export type ComponentId = string;
export type Component = { componentId: ComponentId };

export type ComponentTypeOf<T extends Component> = T["componentId"];
export type ComponentsTypeOf<T extends Component[]> = { [P in keyof T]: ComponentTypeOf<T[P]> };

export type Components = Record<ComponentId, Component>;
export type TypedComponents<T extends Component[]> = { [P in T[number] as ComponentTypeOf<P>]: P };

// System
export type System = (world: World, ...args: any[]) => void;

export type SystemArgs<T> = T extends [unknown, ...unknown[]] ? { args: T } : { args?: T };
export type SystemArgsInfer<T> = T extends (world: World, ...args: infer P) => void ? SystemArgs<P> : never;

export type SystemParams<T> = {
    fn: T;
    startup?: boolean;
} & SystemArgsInfer<T>;

// World data
export type WorldDataId = string;
export type WorldData = { dataId: WorldDataId };

export type WorldDataTypeOf<T extends WorldData> = T["dataId"];

// World event
export type WorldEventId = string;
export type WorldEvent = { eventId: WorldEventId };

export type WorldEventTypeOf<T extends WorldEvent> = T["eventId"];
