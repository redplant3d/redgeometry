import type { DefaultSystemStage, WorldModule, WorldModuleId, WorldScheduleId } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";

export type AnimationFrameData = {
    dataId: "animationFrame";
    requestHandle: number;
    provider: AnimationFrameProvider;
    time: number;
    scheduleId: WorldScheduleId;
};

export type TimeData = {
    dataId: "time";
    time: number;
    delta: number;
    frame: number;
};

export class TimeModule implements WorldModule {
    public get moduleId(): WorldModuleId {
        return "time";
    }

    public setup(world: World): void {
        world.registerData<AnimationFrameData>("animationFrame");
        world.registerData<TimeData>("time");

        world.addSystem<DefaultSystemStage>({ stage: "start-post", fn: requestAnimationFrameSystem });

        world.addSystem<DefaultSystemStage>({ stage: "update", fn: timeSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-post", fn: requestAnimationFrameSystem });

        world.addSystem<DefaultSystemStage>({ stage: "stop-pre", fn: cancelAnimationFrame });

        world.writeData<AnimationFrameData>({
            dataId: "animationFrame",
            provider: window,
            scheduleId: "update",
            requestHandle: 0,
            time: 0,
        });
        world.writeData<TimeData>({
            dataId: "time",
            frame: 0,
            time: 0,
            delta: 0,
        });
    }
}

export function timeSystem(world: World): void {
    const animationFrameData = world.readData<AnimationFrameData>("animationFrame");
    const timeData = world.readData<TimeData>("time");

    const time = animationFrameData.time;
    const frame = timeData.frame + 1;
    const delta = time - timeData.time;

    world.writeData<TimeData>({ dataId: "time", frame, time, delta });
}

export function requestAnimationFrameSystem(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    if (data.requestHandle !== 0) {
        return;
    }

    // Get time from the callback and trigger a single world update
    data.requestHandle = data.provider.requestAnimationFrame((time) => {
        data.requestHandle = 0;
        data.time = time;

        world.runSchedule(data.scheduleId);
    });
}

export function cancelAnimationFrame(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    data.provider.cancelAnimationFrame(data.requestHandle);
    data.requestHandle = 0;
}
