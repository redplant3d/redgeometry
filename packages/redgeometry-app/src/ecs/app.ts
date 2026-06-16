import { log } from "redgeometry/src/utility/debug";
import { WorldChannelLocal, WorldGroup } from "../utility/ecs-app.ts";
import type {
    DefaultSystemStage,
    DefaultWorldScheduleId,
    SystemStage,
    WorldGroupId,
    WorldId,
    WorldModule,
    WorldScheduleId,
} from "./types.ts";
import { World, type WorldScheduleOptions } from "./world.ts";

export type WorldOptions<
    T extends WorldScheduleId = DefaultWorldScheduleId,
    U extends SystemStage = DefaultSystemStage,
> = {
    id: WorldId;
    modules: WorldModule[];
    schedules: WorldScheduleOptions<T, U>[];
};

export type WorldGroupOptions = {
    id: WorldGroupId;
    parent: WorldGroupId | undefined;
    worlds: WorldOptions<WorldScheduleId, SystemStage>[];
    workerScriptURL?: URL | string;
};

export interface AppContext {
    readonly isMain: boolean;
    readonly isWorker: boolean;
    readonly selfName: string | undefined;
}

export class App {
    private context: AppContext;
    private groupMap: Map<WorldGroupId, WorldGroup>;
    private groupOptionsMap: Map<WorldGroupId, WorldGroupOptions>;

    public constructor(context: AppContext) {
        this.context = context;

        this.groupOptionsMap = new Map();
        this.groupMap = new Map();
    }

    public addWorldGroup(options: WorldGroupOptions): void {
        const { id } = options;

        if (this.groupOptionsMap.has(id)) {
            log.warn("Group '{}' will be overwritten", id);
        }

        this.groupOptionsMap.set(id, options);
    }

    public run<T extends WorldScheduleId>(worldId: WorldId, scheduleId: T): void {
        const { context } = this;

        // Create world groups
        for (const groupOptions of this.groupOptionsMap.values()) {
            const channels = this.createChannels(groupOptions);

            const group = new WorldGroup(groupOptions.id, context, channels);

            this.groupMap.set(groupOptions.id, group);
        }

        // Run startup world
        for (const group of this.groupMap.values()) {
            const channel = group.channelMap.get(worldId);

            if (channel !== undefined) {
                void channel.world.runSchedule(scheduleId);
            }
        }
    }

    private createChannels(groupOptions: WorldGroupOptions): Map<WorldId, WorldChannelLocal> {
        const channels = new Map<WorldId, WorldChannelLocal>();

        for (const worldOptions of groupOptions.worlds) {
            log.infoDebug("{} >> Created local world '{}'", groupOptions.id, worldOptions.id);

            const world = new World();
            world.addModules(worldOptions.modules);
            world.addSchedules(worldOptions.schedules);
            world.init();

            const channel = new WorldChannelLocal(worldOptions.id, world);
            channels.set(worldOptions.id, channel);
        }

        return channels;
    }
}

export class LocalAppContext implements AppContext {
    public readonly isMain: boolean;
    public readonly isWorker: boolean;
    public readonly selfName: string | undefined;

    public constructor() {
        const isMain = typeof window !== "undefined";
        const isWorker = !isMain;
        const selfName = isWorker ? self.name : undefined;

        this.isMain = isMain;
        this.isWorker = isWorker;
        this.selfName = selfName;
    }
}
