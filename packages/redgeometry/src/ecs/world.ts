import { deserializePrimitiveObject, serializePrimitiveObject } from "../internal/serialize.js";
import { log, throwError } from "../utility/debug.js";
import { hasComponentTypes } from "./helper.js";
import type {
    Component,
    ComponentTypeOf,
    Components,
    ComponentsTypeOf,
    Entities,
    EntityId,
    System,
    SystemParams,
    TypedComponents,
    TypedEntityEntry,
    WorldData,
    WorldDataId,
    WorldDataTypeOf,
    WorldEvent,
    WorldEventId,
    WorldEventTypeOf,
} from "./types.js";

/**
 * Entry of a system with its entities and dependencies.
 */
type SystemEntry = {
    fn: System;
    args?: unknown[] | undefined;
};

/**
 * Represents an instance context for entities and systems.
 */
export class World {
    private data: Map<WorldDataId, WorldData>;
    private entities: Entities;
    private events: Map<WorldEventId, WorldEvent[]>;
    private startupSystemEntries: SystemEntry[];
    private systemEntries: SystemEntry[];
    private updateQueue: Set<EntityId>;

    constructor() {
        this.entities = new Map();
        this.data = new Map();
        this.events = new Map();
        this.systemEntries = [];
        this.startupSystemEntries = [];
        this.updateQueue = new Set();
    }

    /**
     * Adds a `component` to `entity` (if it exists).
     *
     * Note: This does not immediately register the new component to the systems.
     */
    public addComponent<T extends Component>(entity: EntityId, component: T): void {
        const entityComponents = this.getComponents(entity);

        if (entityComponents !== undefined) {
            this.updateQueue.add(entity);

            entityComponents[component.componentId] = component;
        }
    }

    /**
     * Adds `components` to `entity` (if it exists).
     *
     * Note: This does not immediately register the new component to the systems.
     */
    public addComponents<T extends Component[]>(entity: EntityId, ...components: T): void {
        const entityComponents = this.getComponents(entity);

        if (entityComponents !== undefined) {
            this.updateQueue.add(entity);

            for (const component of components) {
                entityComponents[component.componentId] = component;
            }
        }
    }

    /**
     * Adds a system and registers all existing entities that satify its dependencies.
     */
    public addSystem<T extends System>(params: SystemParams<T>): void {
        if (params.startup === true) {
            this.startupSystemEntries.push(params);
        } else {
            this.systemEntries.push(params);
        }
    }

    /**
     * Clears all entities from this world.
     */
    public clearEntities(): void {
        this.entities.clear();
    }

    /**
     * Creates a new entity.
     */
    public createEntity<T extends Component[]>(...params: T): EntityId {
        // TODO: Proper id generation (with version).
        const entity = this.entities.size;
        const components: Components = {};

        for (const c of params) {
            components[c.componentId] = c;
        }

        this.entities.set(entity, components);
        this.updateQueue.add(entity);

        return entity;
    }

    /**
     * Destroys `entity` from the world and returns if it was sucessful.
     */
    public destroyEntity(entity: EntityId): boolean {
        // Queue `entity` for deletion in systems
        this.updateQueue.delete(entity);

        // Delete from global list
        return this.entities.delete(entity);
    }

    /**
     * Returns the component `type` of `entity`.
     */
    public getComponent<T extends Component>(entity: EntityId, type: ComponentTypeOf<T>): T | undefined {
        const components = this.getComponents(entity);

        if (components !== undefined) {
            return components[type] as T | undefined;
        } else {
            return undefined;
        }
    }

    /**
     * Returns all components of `entity`.
     */
    public getComponents(entity: EntityId): Components | undefined {
        return this.entities.get(entity);
    }

    /**
     * Returns components of `entity` that satisfy `types`.
     */
    public getTypedComponents<T extends Component[]>(
        entity: EntityId,
        types: ComponentsTypeOf<T>
    ): TypedComponents<T> | undefined {
        const components = this.getComponents(entity);

        if (components !== undefined && hasComponentTypes(components, types)) {
            return components;
        } else {
            return undefined;
        }
    }

    public loadEntities(text: string): void {
        this.clearEntities();

        this.entities = deserializePrimitiveObject(text) as Entities;
    }

    public queryEntities<T extends Component[]>(types: ComponentsTypeOf<T>): TypedEntityEntry<T>[] {
        const result: TypedEntityEntry<T>[] = [];

        for (const [entity, components] of this.entities) {
            if (hasComponentTypes(components, types)) {
                result.push({ entity, components });
            }
        }

        return result;
    }

    public queryEntitiesMatch<T extends Component[]>(
        types: ComponentsTypeOf<T>,
        match: (components: TypedComponents<T>) => boolean
    ): TypedEntityEntry<T>[] {
        const result: TypedEntityEntry<T>[] = [];

        for (const [entity, components] of this.entities.entries()) {
            if (hasComponentTypes(components, types) && match(components)) {
                result.push({ entity, components });
            }
        }

        return result;
    }

    public readData<T extends WorldData>(type: WorldDataTypeOf<T>): T {
        const data = this.data.get(type);

        if (data === undefined) {
            throwError("Cannot read data '{}'", type);
        }

        return data as T;
    }

    public readEvents<T extends WorldEvent>(type: WorldEventTypeOf<T>): T[] {
        const events = this.events.get(type);

        if (events === undefined) {
            throwError("Cannot get events '{}'", type);
        }

        return events as T[];
    }

    public registerData<T extends WorldData>(data: T): void {
        if (this.data.has(data.dataId)) {
            log.warn("World already has data type '{}' and will be overwritten", data.dataId);
        }

        this.data.set(data.dataId, data);
    }

    public registerEvent<T extends WorldEvent>(type: WorldEventTypeOf<T>): void {
        if (this.events.has(type)) {
            log.warn("World already has event type '{}' and will be overwritten", type);
        }

        this.events.set(type, []);
    }

    /**
     * Removes component `type` from `entity` and returns if it was sucessful.
     */
    public removeComponent<T extends Component>(entity: EntityId, type: ComponentTypeOf<T>): boolean {
        const components = this.getComponents(entity);

        if (components !== undefined) {
            this.updateQueue.add(entity);
            return delete components[type];
        } else {
            return false;
        }
    }

    /**
     * Removes `system` from the world and returns if it was sucessful.
     */
    public removeSystem(system: System): boolean {
        const start = this.systemEntries.findIndex((se) => se.fn === system);

        if (start >= 0) {
            this.systemEntries.splice(start, 1);
            return true;
        } else {
            return false;
        }
    }

    public saveEntities(): string {
        return serializePrimitiveObject(this.entities);
    }

    public start(): void {
        for (const { fn, args } of this.startupSystemEntries) {
            if (args !== undefined) {
                fn(this, ...args);
            } else {
                fn(this);
            }
        }
    }

    /**
     * Updates all entities.
     */
    public update(): void {
        for (const { fn, args } of this.systemEntries) {
            if (args !== undefined) {
                fn(this, ...args);
            } else {
                fn(this);
            }
        }

        this.updateQueue.clear();

        for (const eventId of this.events.keys()) {
            this.events.set(eventId, []);
        }
    }

    /**
     * Marks an entity for update.
     */
    public updateEntity(entity: EntityId): void {
        this.updateQueue.add(entity);
    }

    public writeData<T extends WorldData>(data: T): void {
        if (this.data.has(data.dataId)) {
            this.data.set(data.dataId, data);
        } else {
            throwError("Data '{}' not registered", data.dataId);
        }
    }

    public writeEvent<T extends WorldEvent>(event: T): void {
        const events = this.events.get(event.eventId);

        if (events !== undefined) {
            events.push(event);
        } else {
            throwError("Event '{}' not registered", event.eventId);
        }
    }
}
