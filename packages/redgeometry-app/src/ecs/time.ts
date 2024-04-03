import type { DefaultSystemStage, WorldId, WorldModule } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";

export type AnimationFrameEvent = {
    eventId: "animation-frame";
    time: number;
};

export type TimeInitData = {
    dataId: "time-init";
    receiverIds: WorldId[];
};

export type TimeData = {
    dataId: "time";
    delta: number;
    frame: number;
    time: number;
};

export function startTimeSystem(world: World): void {
    world.writeData<TimeData>({
        dataId: "time",
        delta: 0,
        frame: 0,
        time: 0,
    });
}

export function timeSystem(world: World): void {
    const initData = world.readData<TimeInitData>("time-init");

    const animationFrameEvents = world.readEvents<AnimationFrameEvent>("animation-frame");

    // Propagate events
    for (const id of initData.receiverIds) {
        const channel = world.getChannel(id);
        channel.queueEvents(animationFrameEvents);
    }

    let { delta, frame, time } = world.readData<TimeData>("time");

    for (const ev of animationFrameEvents) {
        delta = ev.time - time;
        frame = frame + 1;
        time = ev.time;
    }

    world.writeData<TimeData>({ dataId: "time", delta, frame, time });
}

export class TimeModule implements WorldModule {
    public readonly moduleId = "time";

    public setup(world: World): void {
        world.registerData<TimeInitData>("time-init");
        world.registerData<TimeData>("time");

        world.registerEvent<AnimationFrameEvent>("animation-frame");

        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startTimeSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: timeSystem });
    }
}
