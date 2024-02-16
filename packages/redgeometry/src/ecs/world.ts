import { DEFAULT_SERIALIZATION_MAPPING, SerializationMap } from "../internal/serialize.js";
import { assertUnreachable, log, throwError } from "../utility/debug.js";
import { SystemSchedule } from "./schedule.js";
import { EntityComponentStorage, EntityHierarchySelector } from "./storage-sparse.js";
import type {
    Component,
    ComponentIdOf,
    ComponentIdsOf,
    EntityId,
    Serializable,
    SerializableConstructor,
    System,
    SystemDependency,
    SystemOptions,
    SystemStage,
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

export enum ChangeFlags {
    None = 0,
    Created = 1,
    Updated = 2,
    Deleted = 4,
}

/**
 * Represents an instance context for entities and systems.
 */
export class World {
    private channels: Map<WorldId, WorldChannel>;
    private data: Map<WorldDataId, WorldData | undefined>;
    private ecStorage: EntityComponentStorage;
    private events: Map<WorldEventId, WorldEvent[]>;
    private scheduleStart: SystemSchedule;
    private scheduleStop: SystemSchedule;
    private scheduleUpdate: SystemSchedule;
    private serializationMap: SerializationMap;

    public constructor() {
        this.serializationMap = new SerializationMap([...DEFAULT_SERIALIZATION_MAPPING]);

        this.data = new Map();
        this.events = new Map();
        this.channels = new Map();

        this.scheduleStart = new SystemSchedule();
        this.scheduleUpdate = new SystemSchedule();
        this.scheduleStop = new SystemSchedule();

        this.ecStorage = new EntityComponentStorage();
    }

    public addChannel(id: WorldId, channel: WorldChannel): void {
        if (this.channels.has(id)) {
            log.warn("World channel '{}' already exists and will be overwritten", id);
        }

        this.channels.set(id, channel);
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
        this.ecStorage.clear();
    }

    /**
     * Creates a new entity.
     */
    public createEntity<T extends Component[]>(parent: EntityId | undefined, ...components: T): EntityId {
        return this.ecStorage.createEntity(parent, components);
    }

    public createHierarchySelector(): EntityHierarchySelector {
        return this.ecStorage.createHierarchySelector();
    }

    /**
     * Removes `componentId` from `entity` and returns if it was sucessful.
     */
    public deleteComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): boolean {
        return this.ecStorage.deleteComponent(entity, componentId);
    }

    /**
     * Destroys `entity` from the world and returns if it was sucessful.
     */
    public destroyEntity(entity: EntityId): boolean {
        return this.ecStorage.destroyEntity(entity);
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
        return this.ecStorage.getComponent(entity, componentId);
    }

    /**
     * Get entities that have changed recently.
     */
    public getEntitiesChanged(): IterableIterator<EntityId> {
        return this.ecStorage.getEntitiesChanged();
    }

    public hasChangeFlag<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flag: ChangeFlags,
    ): boolean {
        return this.ecStorage.hasChangeFlag(entityId, componentId, flag);
    }

    public hasComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): boolean {
        return this.ecStorage.hasComponent(entity, componentId);
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
        this.ecStorage.loadEntities(this.serializationMap, text);
    }

    public queryEntities<T extends Component[]>(componentIds: ComponentIdsOf<T>): IterableIterator<EntityId> {
        return this.ecStorage.queryEntities(componentIds);
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
        return this.ecStorage.saveEntities(this.serializationMap);
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        this.ecStorage.setComponent(entityId, component);
    }

    public setParent(entity: EntityId, parent: EntityId): void {
        this.ecStorage.setParent(entity, parent);
    }

    /**
     * Marks `componentId` of `entity` for update.
     */
    public updateComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): void {
        this.ecStorage.updateComponent(entityId, componentId);
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
        this.ecStorage.cleanup();

        // Reset events
        for (const eventId of this.events.keys()) {
            this.events.set(eventId, []);
        }
    }
}
