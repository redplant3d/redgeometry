import type { DefaultSystemStage, WorldModule, WorldPlugin, WorldScheduleId } from "redgeometry/src/ecs/types";
import type { World } from "redgeometry/src/ecs/world";

export type AnimationFrameData = {
    dataId: "animation-frame";
    provider: AnimationFrameProvider;
    requestHandle: number;
    scheduleId: WorldScheduleId;
    time: number;
};

export type TimeData = {
    dataId: "time";
    delta: number;
    frame: number;
    time: number;
};

export function initTimeSystem(world: World): void {
    const animationFramePlugin = new TimePlugin();
    world.setPlugin<TimePlugin>(animationFramePlugin);

    world.writeData<AnimationFrameData>({
        dataId: "animation-frame",
        provider: window,
        requestHandle: 0,
        scheduleId: "update",
        time: 0,
    });
    world.writeData<TimeData>({
        dataId: "time",
        delta: 0,
        frame: 0,
        time: 0,
    });
}

export function timeSystem(world: World): void {
    const animationFrameData = world.readData<AnimationFrameData>("animation-frame");
    const timeData = world.readData<TimeData>("time");

    const time = animationFrameData.time;
    const frame = timeData.frame + 1;
    const delta = time - timeData.time;

    world.writeData<TimeData>({ dataId: "time", delta, frame, time });
}

export class TimePlugin implements WorldPlugin {
    public readonly pluginId = "time";

    public requestAnimationFrame(world: World): void {
        const data = world.readData<AnimationFrameData>("animation-frame");

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

    public cancelAnimationFrame(world: World): void {
        const data = world.readData<AnimationFrameData>("animation-frame");

        data.provider.cancelAnimationFrame(data.requestHandle);
        data.requestHandle = 0;
    }
}

export class TimeModule implements WorldModule {
    public readonly moduleId = "time";

    public setup(world: World): void {
        world.registerPlugin<TimePlugin>("time");

        world.registerData<AnimationFrameData>("animation-frame");
        world.registerData<TimeData>("time");

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initTimeSystem });
        world.addSystem<DefaultSystemStage>({ stage: "update-pre", fn: timeSystem });
    }
}
