import {
    addComponent,
    createComponent,
    DEFAULT_SERIALIZATION_MAPPING,
    deleteComponent,
    EntityEntryChangedIterator,
    EntityEntryIterator,
    SerializationMap,
    SystemEntry,
    updateComponent,
} from "../internal";
import { Debug } from "../utility";
import {
    Changeset,
    Component,
    ComponentIdOf,
    Components,
    ComponentsIdsOf,
    EntityEntry,
    EntityId,
    Serializable,
    SerializableConstructor,
    System,
    SystemParams,
    TypedEntityEntry,
    WorldData,
    WorldDataId,
    WorldDataIdOf,
    WorldEvent,
    WorldEventId,
    WorldEventIdOf,
    WorldPlugin,
} from "./types";

/**
 * Represents an instance context for entities and systems.
 */
export class World {
    private data: Map<WorldDataId, WorldData | undefined>;
    private entityEntries: Map<EntityId, EntityEntry>;
    private entityEntriesChanged: Map<EntityId, EntityEntry>;
    private entityId: number;
    private events: Map<WorldEventId, WorldEvent[]>;
    private serializationMap: SerializationMap;
    private startupSystemEntries: SystemEntry[];
    private systemEntries: SystemEntry[];

    constructor() {
        this.serializationMap = new SerializationMap([...DEFAULT_SERIALIZATION_MAPPING]);

        this.data = new Map();
        this.entityEntries = new Map();
        this.entityEntriesChanged = new Map();
        this.events = new Map();

        this.startupSystemEntries = [];
        this.systemEntries = [];

        this.entityId = 0;
    }

    /**
     * Adds a `component` to `entity` (if it exists).
     */
    public addComponent<T extends Component>(entity: EntityId, component: T): void {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return;
        }

        addComponent(entry.components, entry.changeset, component);

        this.entityEntriesChanged.set(entry.entity, entry);
    }

    /**
     * Adds `components` to `entity` (if it exists).
     */
    public addComponents<T extends Component[]>(entity: EntityId, ...components: T): void {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return;
        }

        for (const component of components) {
            addComponent(entry.components, entry.changeset, component);
        }

        this.entityEntriesChanged.set(entry.entity, entry);
    }

    public addPlugin<T extends WorldPlugin>(fn: T): void {
        fn(this);
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
        this.entityEntries.clear();
    }

    /**
     * Creates a new entity.
     */
    public createEntity<T extends Component[]>(...components: T): EntityId {
        const entity = this.getNewEntityId();

        const entry = { entity, components: {}, changeset: {} };

        for (const component of components) {
            createComponent(entry.components, entry.changeset, component);
        }

        this.entityEntries.set(entity, entry);
        this.entityEntriesChanged.set(entity, entry);

        return entity;
    }

    /**
     * Destroys `entity` from the world and returns if it was sucessful.
     */
    public destroyEntity(entity: EntityId): boolean {
        // Get entry and delete
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return false;
        }

        this.entityEntries.delete(entity);

        // Mark components as deleted
        for (const componentId in entry.components) {
            deleteComponent(entry.changeset, componentId);
        }

        entry.components = {};

        this.entityEntriesChanged.set(entry.entity, entry);

        return true;
    }

    public getChangeset(entity: EntityId): Changeset | undefined {
        return this.entityEntriesChanged.get(entity)?.changeset;
    }

    /**
     * Returns the component `type` of `entity`.
     */
    public getComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return undefined;
        }

        const component = entry.components[componentId] as T | undefined;

        if (component !== undefined) {
            updateComponent(entry.changeset, componentId);
            this.entityEntriesChanged.set(entry.entity, entry);
        }

        return component;
    }

    public getComponents(entity: EntityId): Components | undefined {
        return this.entityEntries.get(entity)?.components;
    }

    public loadEntities(text: string): void {
        this.clearEntities();

        const entries = this.serializationMap.deserialize(text) as EntityEntry[];

        for (const entry of entries) {
            this.entityEntries.set(entry.entity, entry);
        }
    }

    public queryEntities<T extends Component[]>(
        componentIds: ComponentsIdsOf<T>
    ): IterableIterator<TypedEntityEntry<T, Component[]>> {
        return new EntityEntryIterator(this.entityEntries, componentIds);
    }

    /**
     * Query entities that have changed recently.
     */
    public queryEntitiesChanged<U extends Component[]>(
        componentIds: ComponentsIdsOf<U>
    ): IterableIterator<TypedEntityEntry<Component[], U>> {
        return new EntityEntryChangedIterator(this.entityEntriesChanged, componentIds);
    }

    public readData<T extends WorldData>(type: WorldDataIdOf<T>): T {
        const data = this.data.get(type);

        if (data === undefined) {
            throw new Error(`Cannot read data '${type}'`);
        }

        return data as T;
    }

    public readEvents<T extends WorldEvent>(type: WorldEventIdOf<T>): T[] {
        const events = this.events.get(type);

        if (events === undefined) {
            throw new Error(`Cannot get events '${type}'`);
        }

        return events as T[];
    }

    public registerData<T extends WorldData>(dataId: WorldDataIdOf<T>): void {
        if (this.data.has(dataId)) {
            Debug.warn("World already has dataId '{}' and will be overwritten", dataId);
        }

        this.data.set(dataId, undefined);
    }

    public registerEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): void {
        if (this.events.has(eventId)) {
            Debug.warn("World already has eventId '{}' and will be overwritten", eventId);
        }

        this.events.set(eventId, []);
    }

    public registerSerializable<T extends Serializable>(ClassType: SerializableConstructor<T>): void {
        this.serializationMap.add(
            ClassType,
            (obj: T) => obj.toArray(),
            (data: number[]) => ClassType.fromArray(data)
        );
    }

    /**
     * Removes `componentId` from `entity` and returns if it was sucessful.
     */
    public removeComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): boolean {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return false;
        }

        const success = delete entry.components[componentId];

        if (success) {
            deleteComponent(entry.changeset, componentId);
            this.entityEntriesChanged.set(entry.entity, entry);
        }

        return success;
    }

    /**
     * Removes `componentIds` from `entity` and returns how many components were updated.
     */
    public removeComponents<T extends Component[]>(entity: EntityId, componentIds: ComponentsIdsOf<T>): number {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return 0;
        }

        let count = 0;

        for (const componentId of componentIds) {
            const success = delete entry.components[componentId];

            if (success) {
                deleteComponent(entry.changeset, componentId);
                count += 1;
            }
        }

        if (count > 0) {
            this.entityEntriesChanged.set(entry.entity, entry);
        }

        return count;
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
        return this.serializationMap.serialize([...this.entityEntries.values()]);
    }

    /**
     * Runs startup systems.
     */
    public start(): void {
        this.runSchedule(this.startupSystemEntries);
        this.validate();
    }

    /**
     * Updates the world by running all systems.
     */
    public update(): void {
        this.runSchedule(this.systemEntries);
        this.cleanup();
    }

    /**
     * Marks `componentId` of `entity` for update.
     */
    public updateComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): boolean {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return false;
        }

        let success = false;

        if (componentId in entry.components) {
            updateComponent(entry.changeset, componentId);
            this.entityEntriesChanged.set(entry.entity, entry);
            success = true;
        }

        return success;
    }

    /**
     * Marks `componentIds` of `entity` for update.
     */
    public updateComponents<T extends Component[]>(entity: EntityId, componentIds: ComponentsIdsOf<T>): number {
        const entry = this.entityEntries.get(entity);

        if (entry === undefined) {
            return 0;
        }

        let count = 0;

        for (const componentId of componentIds) {
            if (componentId in entry.components) {
                updateComponent(entry.changeset, componentId);
                count += 1;
            }
        }

        if (count > 0) {
            this.entityEntriesChanged.set(entry.entity, entry);
        }

        return count;
    }

    public validate(): boolean {
        let success = true;

        // World data
        for (const [id, data] of this.data) {
            if (data === undefined) {
                Debug.warn("World data '{}' has not been initialized", id);
                success = false;
            }
        }

        return success;
    }

    public writeData<T extends WorldData>(data: T): void {
        if (this.data.has(data.dataId)) {
            this.data.set(data.dataId, data);
        } else {
            throw new Error(`World data '${data.dataId}' is not registered`);
        }
    }

    public writeEvent<T extends WorldEvent>(event: T): void {
        const events = this.events.get(event.eventId);

        if (events !== undefined) {
            events.push(event);
        } else {
            throw new Error(`World event '${event.eventId}' is not registered`);
        }
    }

    private cleanup(): void {
        // Reset entity entries
        for (const entry of this.entityEntriesChanged.values()) {
            entry.changeset = {};
        }

        this.entityEntriesChanged.clear();

        // Reset events
        for (const eventId of this.events.keys()) {
            this.events.set(eventId, []);
        }
    }

    private getNewEntityId(): EntityId {
        // TODO: Proper id generation
        const entityId = this.entityId;
        this.entityId += 1;
        return entityId;
    }

    private runSchedule(schedule: SystemEntry[]): void {
        for (const { fn, args } of schedule) {
            if (args !== undefined) {
                fn(this, ...args);
            } else {
                fn(this);
            }
        }
    }
}
