import { World } from "./world";

export interface AnimationFrameData {
    dataId: "animationFrame";
    requestHandle: number;
    provider: AnimationFrameProvider;
    time: number;
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
    world.addSystem({ fn: startAnimationFrameSystem, startup: true });
    world.addSystem({ fn: timeSystem });

    world.writeData<AnimationFrameData>({ dataId: "animationFrame", provider: window, requestHandle: 0, time: 0 });
    world.writeData<TimeData>({ dataId: "time", frame: 0, time: 0, delta: 0 });
}

export function timeSystem(world: World): void {
    const animationFrameData = world.readData<AnimationFrameData>("animationFrame");
    const timeData = world.readData<TimeData>("time");

    const time = animationFrameData.time;
    const frame = timeData.frame + 1;
    const delta = time - timeData.time;

    world.writeData<TimeData>({ dataId: "time", frame, time, delta });
}

export function startAnimationFrameSystem(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    if (data.requestHandle !== 0) {
        return;
    }

    // Instantly queue next callback, get time and trigger world update
    const onAnimationFrame = (time: number): void => {
        data.requestHandle = data.provider.requestAnimationFrame(onAnimationFrame);
        data.time = time;
        world.update();
    };

    data.requestHandle = data.provider.requestAnimationFrame(onAnimationFrame);
}

export function stepAnimationFrameSystem(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    if (data.requestHandle !== 0) {
        return;
    }

    // Get time from the callback and trigger a single world update
    const onAnimationFrame = (time: number): void => {
        data.time = time;
        world.update();
    };

    data.requestHandle = data.provider.requestAnimationFrame(onAnimationFrame);
}

export function stopAnimationFrameSystem(world: World): void {
    const data = world.readData<AnimationFrameData>("animationFrame");

    data.provider.cancelAnimationFrame(data.requestHandle);
    data.requestHandle = 0;
}
