import type { DefaultSystemStage, WorldModule } from "../ecs/types.ts";
import type { World } from "../ecs/world.ts";

export type AnimationFrameEvent = {
    eventId: "animation-frame";
    time: number;
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
    const animationFrameEvents = world.readEvents<AnimationFrameEvent>("animation-frame").toArray();

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
        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: startTimeSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: timeSystem });
    }
}
