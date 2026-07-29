import type { World, WorldContext } from "../ecs/world.ts";
import { START_SCHEDULE_ID, UPDATE_SCHEDULE_ID } from "./app.ts";

export type AnimationFrameEvent = {
    eventId: "animation-frame-event";
    time: number;
};

export type TimeData = {
    dataId: "time-data";
    delta: number;
    frame: number;
    time: number;
};

export const TIME_START_SYSTEM_ID = "time-start-system";
export const TIME_UPDATE_SYSTEM_ID = "time-update-system";

function timeStartSystem(world: World): void {
    world.setData<TimeData>({
        dataId: "time-data",
        delta: 0,
        frame: 0,
        time: 0,
    });
}

function timeappPartUpdateSystem(world: World): void {
    const animationFrameEvents = world.getEvents<AnimationFrameEvent>("animation-frame-event").toArray();

    let { delta, frame, time } = world.getData<TimeData>("time-data");

    for (const ev of animationFrameEvents) {
        delta = ev.time - time;
        frame = frame + 1;
        time = ev.time;
    }

    world.setData<TimeData>({ dataId: "time-data", delta, frame, time });
}

export const TIME_MODULE_ID = "time-module";

export function timeModule(context: WorldContext): void {
    context.addData<TimeData>("time-data");

    context.addEvent<AnimationFrameEvent>("animation-frame-event");

    context.addSystem({
        id: TIME_START_SYSTEM_ID,
        fn: timeStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: TIME_UPDATE_SYSTEM_ID,
        fn: timeappPartUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
