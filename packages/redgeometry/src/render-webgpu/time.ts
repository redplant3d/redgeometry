import type { SystemStage } from "../ecs/types.js";
import { World } from "../ecs/world.js";

export interface AnimationFrameData {
    dataId: "animationFrame";
    requestHandle: number;
    provider: AnimationFrameProvider;
    time: number;
    stage: SystemStage;
}

export interface TimeData {
    dataId: "time";
    time: number;
    delta: number;
    frame: number;
}

export function timePlugin(world: World): void {
    world.registerData<AnimationFrameData>("animationFrame");
    world.registerData<TimeData>("time");
    world.addSystem({ fn: requestAnimationFrameSystem, stage: "start" });
    world.addSystem({ fn: requestAnimationFrameSystem, stage: "update" });
    world.addSystem({ fn: cancelAnimationFrame, stage: "stop" });
    world.addSystem({ fn: timeSystem });

    world.writeData<AnimationFrameData>({
        dataId: "animationFrame",
        provider: window,
        stage: "update",
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

        world.runStage(data.stage);
    });
}

export function cancelAnimationFrame(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    data.provider.cancelAnimationFrame(data.requestHandle);
    data.requestHandle = 0;
}
