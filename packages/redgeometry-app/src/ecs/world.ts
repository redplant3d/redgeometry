import { log, throwError } from "redgeometry/src/utility/debug";
import type { Enum } from "redgeometry/src/utility/types";
import { EntityComponentStorage } from "./entity-component.ts";
import { WorldEventIterator, WorldEventStorage } from "./event.ts";
import { SystemSchedule, type SystemDependencyOptions, type SystemOptions, type SystemsOptions } from "./schedule.ts";
import type {
    Component,
    ComponentIdOf,
    DefaultSystemStage,
    DefaultWorldScheduleId,
    EntityComponentIterator,
    EntityComponentQueryValue,
    EntityId,
    SystemStage,
    WorldData,
    WorldDataId,
    WorldDataIdOf,
    WorldEvent,
    WorldEventIdOf,
    WorldModule,
    WorldModuleId,
    WorldPlugin,
    WorldPluginId,
    WorldPluginIdOf,
    WorldScheduleId,
} from "./types.ts";

export type WorldScheduleOptions<
    T extends WorldScheduleId = DefaultWorldScheduleId,
    U extends SystemStage = DefaultSystemStage,
> = {
    id: T;
    stages: WorldScheduleStage<U>[];
};

export type WorldScheduleStage<T extends SystemStage> = {
    id: T;
};

export const ComponentFlags = {
    NONE: 0,
    DEFAULT: 1,
    ADDED: 2,
    UPDATED: 4,
    DELETED: 8,
    ALL: 15,
} as const;
export type ComponentFlags = Enum<typeof ComponentFlags> | number;

export const EntityFlags = {
    NONE: 0,
    DEFAULT: 1,
    CREATED: 2,
    DESTROYED: 4,
    ALL: 7,
} as const;
export type EntityFlags = Enum<typeof EntityFlags> | number;

export const WORLD_SCHEDULE_OPTIONS_DEFAULT: WorldScheduleOptions<DefaultWorldScheduleId, DefaultSystemStage>[] = [
    {
        id: "start",
        stages: [{ id: "start-pre" }, { id: "start" }, { id: "start-post" }],
    },
    {
        id: "update",
        stages: [{ id: "update-pre" }, { id: "update" }, { id: "update-post" }],
    },
    {
        id: "stop",
        stages: [{ id: "stop-pre" }, { id: "stop" }, { id: "stop-post" }],
    },
];

export class World {
    private data: Map<WorldDataId, WorldData | undefined>;
    private ecStorage: EntityComponentStorage;
    private evStorage: WorldEventStorage;
    private modules: Map<WorldModuleId, WorldModule>;
    private plugins: Map<WorldPluginId, WorldPlugin | undefined>;
    private schedules: Map<SystemStage, SystemSchedule>;
    private stages: Map<WorldScheduleId, SystemSchedule[]>;

    public constructor() {
        this.data = new Map();
        this.ecStorage = new EntityComponentStorage();
        this.evStorage = new WorldEventStorage();
        this.modules = new Map();
        this.plugins = new Map();
        this.schedules = new Map();
        this.stages = new Map();
    }

    public addComponent<T extends Component>(entityId: EntityId, component: T): void {
        this.ecStorage.addComponent(entityId, component);
    }

    public addDependency<T extends SystemStage>(dep: SystemDependencyOptions<T>): void {
        const schedule = this.getSchedule(dep.stage);
        schedule.addDepedency(dep);
    }

    public addModules<T extends WorldModule>(modules: T[]): void {
        for (const module of modules) {
            this.modules.set(module.moduleId, module);
        }
    }

    public addSchedules<T extends WorldScheduleId, U extends SystemStage>(
        WorldScheduleOptions: WorldScheduleOptions<T, U>[],
    ): void {
        for (const option of WorldScheduleOptions) {
            const schedules: SystemSchedule[] = [];

            for (const stage of option.stages) {
                const schedule = new SystemSchedule();

                schedules.push(schedule);

                this.schedules.set(stage.id, schedule);
            }

            this.stages.set(option.id, schedules);
        }
    }

    public addSystem<T extends SystemStage = DefaultSystemStage>(options: SystemOptions<T>): void {
        const schedule = this.getSchedule(options.stage);
        schedule.addSystem(options);
    }

    public addSystems<T extends SystemStage>(options: SystemsOptions<T>): void {
        const schedule = this.getSchedule(options.stage);
        schedule.addSystems(options);
    }

    public clearEntities(): void {
        this.ecStorage.clear();
    }

    public createEntity(): EntityId {
        return this.ecStorage.createEntity();
    }

    public deleteComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): void {
        this.ecStorage.deleteComponent(entity, componentId);
    }

    public destroyEntity(entity: EntityId): void {
        this.ecStorage.destroyEntity(entity);
    }

    public findComponent<T extends Component>(entity: EntityId, componentId: ComponentIdOf<T>): T | undefined {
        return this.ecStorage.findComponent(entity, componentId);
    }

    public getComponentFlags<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): ComponentFlags {
        return this.ecStorage.getComponentFlags(entityId, componentId);
    }

    public getEntityFlags(entityId: EntityId): EntityFlags {
        return this.ecStorage.getEntityFlags(entityId);
    }

    public getPlugin<T extends WorldPlugin>(pluginId: WorldPluginIdOf<T>): T {
        const context = this.plugins.get(pluginId);

        if (context === undefined) {
            throwError("World plugin '{}' not available", pluginId);
        }

        return context as T;
    }

    public getSchedule(stage: SystemStage): SystemSchedule {
        const schedule = this.schedules.get(stage);

        if (schedule === undefined) {
            throwError("Stage '{}' not found", stage);
        }

        return schedule;
    }

    public hasComponent<T extends Component>(entityId: EntityId, componentId: ComponentIdOf<T>): boolean {
        return this.ecStorage.hasComponent(entityId, componentId);
    }

    public hasComponentFlags<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        return this.ecStorage.hasComponentFlags(entityId, componentId, flagMask);
    }

    public hasComponentFlagsAny<T extends Component>(
        entityId: EntityId,
        componentId: ComponentIdOf<T>,
        flagMask: ComponentFlags,
    ): boolean {
        return this.ecStorage.hasComponentFlagsAny(entityId, componentId, flagMask);
    }

    public hasEntityFlags(entityId: EntityId, flagMask: EntityFlags): boolean {
        return this.ecStorage.hasEntityFlags(entityId, flagMask);
    }

    public hasEntityFlagsAny(entityId: EntityId, flagMask: EntityFlags): boolean {
        return this.ecStorage.hasEntityFlagsAny(entityId, flagMask);
    }

    public hasEvents<T extends WorldEvent>(eventId: WorldEventIdOf<T>): boolean {
        return this.evStorage.hasEvent(eventId);
    }

    public init(): void {
        for (const module of this.modules.values()) {
            module.setup(this);
        }

        for (const schedule of this.schedules.values()) {
            schedule.update();
        }

        // for (const [id, schedule] of this.schedules) {
        //     log.infoDebug("*** Schedule: {} ***\n{}", id, schedule);
        // }
    }

    public isEntityAlive(entityId: EntityId): boolean {
        return this.ecStorage.isEntityAlive(entityId);
    }

    public queryEntities<T extends Component = Component>(
        predicate: (q: EntityComponentQueryValue<T>) => boolean,
    ): EntityComponentIterator<T> {
        return this.ecStorage.queryEntities(predicate);
    }

    public readData<T extends WorldData>(type: WorldDataIdOf<T>): T {
        const data = this.data.get(type);

        if (data === undefined) {
            throwError("Cannot read data '{}'", type);
        }

        return data as T;
    }

    public readEvents<T extends WorldEvent>(eventId: WorldEventIdOf<T>): WorldEventIterator<T> {
        return this.evStorage.getEvents(eventId);
    }

    public readLatestEvent<T extends WorldEvent>(eventId: WorldEventIdOf<T>): T | undefined {
        return this.evStorage.findLastEvent(eventId);
    }

    public async runSchedule<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        const schedules = this.stages.get(scheduleId);

        if (schedules === undefined) {
            throwError("World stage '{}' unavailable", scheduleId);
        }

        for (const schedule of schedules) {
            await schedule.execute(this);
        }

        if (scheduleId === "start") {
            this.validate();
        } else if (scheduleId === "update") {
            this.cleanup();
        }
    }

    public setComponent<T extends Component>(entityId: EntityId, component: T): void {
        this.ecStorage.setComponent(entityId, component);
    }

    public setPlugin<T extends WorldPlugin>(plugin: T): void {
        this.plugins.set(plugin.pluginId, plugin);
    }

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
        this.data.set(data.dataId, data);
    }

    public writeEvent<T extends WorldEvent>(event: T): void {
        this.evStorage.addEvent(event);
    }

    public writeEvents<T extends WorldEvent>(events: T[]): void {
        this.evStorage.addEvents(events);
    }

    private cleanup(): void {
        this.ecStorage.reset();
        this.evStorage.reset();
    }
}
