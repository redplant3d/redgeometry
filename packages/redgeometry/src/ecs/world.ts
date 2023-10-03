import {
    EntityEntryChangedIterator,
    EntityEntryIterator,
    addComponent,
    createComponent,
    deleteComponent,
    updateComponent,
} from "../internal/ecs.js";
import { DEFAULT_SERIALIZATION_MAPPING, SerializationMap } from "../internal/serialize.js";
import { assertUnreachable, log, throwError } from "../utility/debug.js";
import { hasTypedComponents } from "./helper.js";
import { SystemSchedule } from "./schedule.js";
import type {
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
    SystemDependency,
    SystemOptions,
    SystemStage,
    TypedComponents,
    TypedEntityEntry,
    WorldData,
    WorldDataId,
    WorldDataIdOf,
    WorldEvent,
    WorldEventId,
    WorldEventIdOf,
    WorldId,
    WorldPlugin,
} from "./types.js";

/**
 * Channel to remote worlds.
 */
export interface WorldChannel {
    queueData<T extends WorldData>(data: T, transfer?: Transferable[]): void;
    queueEvent<T extends WorldEvent>(event: T, transfer?: Transferable[]): void;
    queueEvents<T extends WorldEvent>(events: T[], transfer?: Transferable[]): void;
    queueStage(stage: SystemStage): void;
    runStageAsync(stage: SystemStage): Promise<void>;
}

/**
 * Represents an instance context for entities and systems.
 */
export class World {
    private channels: Map<WorldId, WorldChannel>;
    private data: Map<WorldDataId, WorldData | undefined>;
    private entityEntries: Map<EntityId, EntityEntry>;
    private entityEntriesChanged: Map<EntityId, EntityEntry>;
    private entityId: number;
    private events: Map<WorldEventId, WorldEvent[]>;
    private scheduleStart: SystemSchedule;
    private scheduleStop: SystemSchedule;
    private scheduleUpdate: SystemSchedule;
    private serializationMap: SerializationMap;

    constructor() {
        this.serializationMap = new SerializationMap([...DEFAULT_SERIALIZATION_MAPPING]);

        this.data = new Map();
        this.entityEntries = new Map();
        this.entityEntriesChanged = new Map();
        this.events = new Map();
        this.channels = new Map();

        this.scheduleStart = new SystemSchedule();
        this.scheduleUpdate = new SystemSchedule();
        this.scheduleStop = new SystemSchedule();

        this.entityId = 0;
    }

    public addChannel(id: WorldId, channel: WorldChannel): void {
        if (this.channels.has(id)) {
            log.warn("World channel '{}' already exists and will be overwritten", id);
        }

        this.channels.set(id, channel);
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

    public addDependency(dep: SystemDependency): void {
        if (dep.stage === "start") {
            this.scheduleStart.addDepedency(dep);
        } else if (dep.stage === "stop") {
            this.scheduleStop.addDepedency(dep);
        } else {
            this.scheduleUpdate.addDepedency(dep);
        }
    }

    public addPlugins<T extends WorldPlugin>(plugins: T[]): void {
        for (const fn of plugins) {
            fn(this);
        }
    }

    /**
     * Adds a system and registers all existing entities that satify its dependencies.
     */
    public addSystem<T extends System>(options: SystemOptions<T>): void {
        if (options.stage === "start") {
            this.scheduleStart.addSystem(options);
        } else if (options.stage === "stop") {
            this.scheduleStop.addSystem(options);
        } else {
            this.scheduleUpdate.addSystem(options);
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

    public getChannel(worldId: WorldId): WorldChannel {
        const remote = this.channels.get(worldId);

        if (remote === undefined) {
            throwError("World channel '{}' not available", worldId);
        }

        return remote;
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

    public getTypedComponents<T extends Component[]>(
        entity: EntityId,
        componentIds: ComponentsIdsOf<T>,
    ): TypedComponents<T> | undefined {
        const entry = this.entityEntries.get(entity);

        if (entry !== undefined && hasTypedComponents(entry, componentIds)) {
            return entry.components;
        } else {
            return undefined;
        }
    }

    public hasEvents<T extends WorldEvent>(type: WorldEventIdOf<T>): boolean {
        const events = this.events.get(type);

        if (events !== undefined) {
            return events.length > 0;
        } else {
            return false;
        }
    }

    public init(): void {
        this.scheduleStart.update();
        this.scheduleUpdate.update();
        this.scheduleStop.update();

        // log.infoDebug("*** Start Schedule ***\n{}", this.scheduleStart);
        // log.infoDebug("*** Update Schedule ***\n{}", this.scheduleUpdate);
        // log.infoDebug("*** Stop Schedule ***\n{}", this.scheduleStop);
    }

    public loadEntities(text: string): void {
        this.clearEntities();

        const entries = this.serializationMap.deserialize(text) as EntityEntry[];

        for (const entry of entries) {
            this.entityEntries.set(entry.entity, entry);
        }
    }

    public queryEntities<T extends Component[]>(
        componentIds: ComponentsIdsOf<T>,
    ): IterableIterator<TypedEntityEntry<T, Component[]>> {
        return new EntityEntryIterator(this.entityEntries, componentIds);
    }

    /**
     * Query entities that have changed recently.
     */
    public queryEntitiesChanged<U extends Component[]>(
        componentIds: ComponentsIdsOf<U>,
    ): IterableIterator<TypedEntityEntry<Component[], U>> {
        return new EntityEntryChangedIterator(this.entityEntriesChanged, componentIds);
    }

    public queueEvent<T extends WorldEvent>(event: T): void {
        const events = this.events.get(event.eventId);

        if (events !== undefined) {
            events.push(event);
        } else {
            throwError("World event '{}' is not registered", event.eventId);
        }
    }

    public readData<T extends WorldData>(type: WorldDataIdOf<T>): T {
        const data = this.data.get(type);

        if (data === undefined) {
            throwError("Cannot read data '{}'", type);
        }

        return data as T;
    }

    public readEvents<T extends WorldEvent>(type: WorldEventIdOf<T>): T[] {
        const events = this.events.get(type);

        if (events === undefined) {
            throwError("Cannot get events '{}'", type);
        }

        return events as T[];
    }

    public readLatestEvent<T extends WorldEvent>(type: WorldEventIdOf<T>): T | undefined {
        const events = this.events.get(type);

        if (events === undefined) {
            throwError("Cannot get events '{}'", type);
        }

        if (events.length === 0) {
            return undefined;
        }

        return events[events.length - 1] as T;
    }

    public registerData<T extends WorldData>(dataId: WorldDataIdOf<T>): void {
        if (this.data.has(dataId)) {
            log.warn("World already has dataId '{}' and will be overwritten", dataId);
        }

        this.data.set(dataId, undefined);
    }

    public registerEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): void {
        if (this.events.has(eventId)) {
            log.warn("World already has eventId '{}' and will be overwritten", eventId);
        }

        this.events.set(eventId, []);
    }

    public registerSerializable<T extends Serializable>(ClassType: SerializableConstructor<T>): void {
        this.serializationMap.add(
            ClassType,
            (obj: T) => obj.toArray(),
            (data: number[]) => ClassType.fromArray(data),
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

    public async runStage(stage: SystemStage): Promise<void> {
        switch (stage) {
            case "start": {
                await this.scheduleStart.executeSystems(this);
                this.validate();
                break;
            }
            case "update": {
                await this.scheduleUpdate.executeSystems(this);
                this.cleanup();
                break;
            }
            case "stop": {
                await this.scheduleStop.executeSystems(this);
                break;
            }
            default: {
                assertUnreachable(stage);
            }
        }
    }

    public saveEntities(): string {
        return this.serializationMap.serialize([...this.entityEntries.values()]);
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
                log.warn("World data '{}' has not been initialized", id);
                success = false;
            }
        }

        return success;
    }

    public writeData<T extends WorldData>(data: T): void {
        if (!this.data.has(data.dataId)) {
            throwError("World data '{}' is not registered", data.dataId);
        }

        this.data.set(data.dataId, data);
    }

    public writeEvent<T extends WorldEvent>(event: T): void {
        const events = this.events.get(event.eventId);

        if (events === undefined) {
            throwError("World event '{}' is not registered", event.eventId);
        }

        events.push(event);
    }

    public writeEvents<T extends WorldEvent>(events: T[]): void {
        for (const ev of events) {
            this.writeEvent(ev);
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
}
