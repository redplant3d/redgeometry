import type { AppContext } from "../ecs/app.ts";
import type { WorldData, WorldEvent, WorldGroupId, WorldId, WorldScheduleId } from "../ecs/types.ts";
import type { World } from "../ecs/world.ts";

export class WorldChannelLocal {
    public readonly world: World;
    public readonly worldId: WorldId;

    public constructor(worldId: WorldId, world: World) {
        this.worldId = worldId;
        this.world = world;
    }

    public applyBuffer(dataBuffer: WorldData[], eventBuffer: WorldEvent[]): void {
        const { world } = this;

        for (const data of dataBuffer) {
            world.writeData(data);
        }

        for (const event of eventBuffer) {
            world.writeEvent(event);
        }
    }

    public queueData<T extends WorldData>(data: T, _transfer?: Transferable[]): void {
        this.world.writeData(data);
    }

    public queueEvent<T extends WorldEvent>(event: T, _transfer?: Transferable[]): void {
        this.world.writeEvent(event);
    }

    public queueEvents<T extends WorldEvent>(events: T[], _transfer?: Transferable[]): void {
        this.world.writeEvents(events);
    }

    public queueSchedule<T extends WorldScheduleId>(scheduleId: T): void {
        void this.executorAsync(scheduleId);
    }

    public runScheduleAsync<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        return this.executorAsync(scheduleId);
    }

    private async executorAsync<T extends WorldScheduleId>(scheduleId: T): Promise<void> {
        // Delay execution to continue as microtask
        await Promise.resolve();

        return this.world.runSchedule(scheduleId);
    }
}

export class WorldGroup {
    public readonly channelMap: Map<WorldId, WorldChannelLocal>;
    public readonly context: AppContext;
    public readonly id: WorldGroupId;

    public constructor(id: WorldGroupId, context: AppContext, channelMap: Map<WorldId, WorldChannelLocal>) {
        this.id = id;
        this.context = context;
        this.channelMap = channelMap;
    }
}
