import type { WorldOptions } from "redgeometry/src/ecs/app";
import type { DefaultSystemStage, WorldModule } from "redgeometry/src/ecs/types";
import { DEFAULT_WORLD_SCHEDULES, type World } from "redgeometry/src/ecs/world";
import { Box2 } from "redgeometry/src/primitives/box";
import { Image2 } from "redgeometry/src/render/image";
import { assertUnreachable } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { clamp } from "redgeometry/src/utility/scalar";
import type { AppContextPlugin } from "../ecs/app-context.js";
import { AppContextModule } from "../ecs/app-context.js";
import type { AppInputData } from "../ecs/app-input.js";
import { ComboBoxInputElement, RangeInputElement } from "../ecs/app-input.js";
import { AppMainModule, AppRemoteModule, type AppStateData } from "../ecs/app.js";

const SOBOL_XOR_1 = [
    0x00000000, 0x00000001, 0x00000001, 0x00000007, 0x00000001, 0x00000013, 0x00000015, 0x0000007f, 0x00000001,
    0x00000103, 0x00000105, 0x0000070f, 0x00000111, 0x00001333, 0x00001555, 0x00007fff, 0x00000001, 0x00010003,
    0x00010005, 0x0007000f, 0x00010011, 0x00130033, 0x00150055, 0x007f00ff, 0x00010101, 0x01030303, 0x01050505,
    0x070f0f0f, 0x01111111, 0x13333333,
];

type AppPartMainData = {
    dataId: "app-part-main";
    inputCount: RangeInputElement;
    inputFormat: ComboBoxInputElement;
    inputSize: RangeInputElement;
};

type AppPartRemoteData = {
    dataId: "app-part-remote";
    boxes: Box2[];
    image: Image2;
};

type AppPartStateData = {
    dataId: "app-part-state";
    size: number;
    count: number;
    format: string;
};

function initMainSystem(world: World): void {
    const { inputElements } = world.readData<AppInputData>("app-input");

    const inputSize = new RangeInputElement("size", "16", "1024", "512");
    inputSize.setStyle("width: 200px");
    inputElements.push(inputSize);

    const inputCount = new RangeInputElement("count", "0", "16", "8");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    const inputFormat = new ComboBoxInputElement("format", "none");
    inputFormat.setOptionValues("none", "u8", "u16", "u32", "f32");
    inputElements.push(inputFormat);

    world.writeData<AppPartMainData>({
        dataId: "app-part-main",
        inputSize,
        inputCount,
        inputFormat,
    });
}

function initRemoteSystem(world: World): void {
    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        boxes: [],
        image: new Image2(0, 0),
    });
}

function writeStateSystem(world: World): void {
    const { inputSize, inputCount, inputFormat } = world.readData<AppPartMainData>("app-part-main");

    const stateData: AppPartStateData = {
        dataId: "app-part-state",
        size: inputSize.getInt(),
        count: inputCount.getInt(),
        format: inputFormat.getValue(),
    };

    world.writeData(stateData);

    const channel = world.getChannel("remote");
    channel.queueData(stateData);
}

function updateSystem(world: World): void {
    const { size, count, format } = world.readData<AppPartStateData>("app-part-state");
    const { seed, generator } = world.readData<AppStateData>("app-state");

    const countP = 2 ** count;

    const random = RandomXSR128.fromSeedLcg(seed);
    const samples: number[] = [];

    switch (generator) {
        case 0: {
            sampleWhiteNoise(random, countP, samples);
            break;
        }
        case 1: {
            sampleJitteredGrid(random, countP, samples);
            break;
        }
        case 2: {
            sampleStochasticSobol(random, countP, samples);
            break;
        }
    }

    let boxes: Box2[] = [];
    let image = new Image2(0, 0);

    switch (format) {
        case "none": {
            boxes = createBoxes(samples, size, size / 256);
            break;
        }
        case "u8": {
            image = createImage(samples, "u8");
            break;
        }
        case "u16": {
            image = createImage(samples, "u16");
            break;
        }
        case "u32": {
            image = createImage(samples, "u32");
            break;
        }
        case "f32": {
            image = createImage(samples, "f32");
            break;
        }
    }

    world.writeData<AppPartRemoteData>({
        dataId: "app-part-remote",
        boxes,
        image,
    });
}

function renderSystem(world: World): void {
    const { boxes, image } = world.readData<AppPartRemoteData>("app-part-remote");
    const { size } = world.readData<AppPartStateData>("app-part-state");

    const ctx = world.getPlugin<AppContextPlugin>("app-context");

    const w = image.getWidth();

    let scale = Math.trunc(size / w);
    scale = clamp(scale, 1, 128);

    const imageScaled = image.magnify(scale);

    ctx.clear();
    ctx.blitImage(imageScaled, 0, 0);
    ctx.fillBoxes(boxes, "#000000");
}

function createBoxes(samples: number[], size: number, d: number): Box2[] {
    const boxes: Box2[] = [];

    for (let i = 0; i < samples.length; i += 2) {
        const sx = size * samples[i + 0];
        const sy = size * samples[i + 1];
        const b = new Box2(sx - d, sy - d, sx + d, sy + d);
        boxes.push(b);
    }

    return boxes;
}

function createImage(samples: number[], format: "u8" | "u16" | "u32" | "f32"): Image2 {
    switch (format) {
        case "u8": {
            const d = getImageMinSize(samples.length, 4);
            const arr = new Uint8Array(4 * d * d);

            for (let i = 0; i < samples.length; i++) {
                arr[i] = 256 * samples[i];
            }

            return new Image2(d, d, arr.buffer);
        }
        case "u16": {
            const d = getImageMinSize(samples.length, 2);
            const arr = new Uint16Array(2 * d * d);

            for (let i = 0; i < samples.length; i++) {
                arr[i] = 65536 * samples[i];
            }

            return new Image2(d, d, arr.buffer);
        }
        case "u32": {
            const d = getImageMinSize(samples.length, 1);
            const arr = new Uint32Array(d * d);

            for (let i = 0; i < samples.length; i++) {
                arr[i] = 4294967296 * samples[i];
            }

            return new Image2(d, d, arr.buffer);
        }
        case "f32": {
            const d = getImageMinSize(samples.length, 1);
            const arr = new Float32Array(d * d);

            for (let i = 0; i < samples.length; i++) {
                arr[i] = samples[i];
            }

            return new Image2(d, d, arr.buffer);
        }
        default: {
            assertUnreachable(format);
        }
    }
}

function createStratifiedSample(
    random: Random,
    stratum0: number,
    stratum1: number,
    strata: number,
    samples: number[],
): void {
    const x = stratum0 + random.nextFloat();
    const y = stratum1 + random.nextFloat();
    samples.push(x / strata);
    samples.push(y / strata);
}

function getImageMinSize(sampleCount: number, bpp: number): number {
    const size = Math.sqrt(sampleCount / bpp);
    return Math.ceil(size);
}

function sampleJitteredGrid(random: Random, count: number, samples: number[]): void {
    const sqrt = Math.sqrt(count);
    const d = 1 / Math.ceil(sqrt);

    for (let y = 0; y < 1; y += d) {
        for (let x = 0; x < 1; x += d) {
            const dx = d * random.nextFloat();
            const dy = d * random.nextFloat();
            samples.push(x + dx);
            samples.push(y + dy);
        }
    }
}

function sampleStochasticSobol(random: Random, count: number, samples: number[]): void {
    //  ssobol02 (Stochastic Generation of (t,s) Sample Sequences by Andrew Helmer)
    let stratum0 = 0;
    let stratum1 = 0;
    let strata = 1;

    createStratifiedSample(random, stratum0, stratum1, strata, samples);

    for (let i = 0, j = 1; j < count; i++, j = strata) {
        strata = 2 * j;

        for (let k = 0; k < j; k++) {
            const xor0 = 2 * (k ^ 0);
            const xor1 = 2 * (k ^ SOBOL_XOR_1[i]);

            stratum0 = (strata * samples[xor0 + 0]) ^ 1;
            stratum1 = (strata * samples[xor1 + 1]) ^ 1;

            createStratifiedSample(random, stratum0, stratum1, strata, samples);
        }
    }
}

function sampleWhiteNoise(random: Random, count: number, samples: number[]): void {
    for (let i = 0; i < count; i++) {
        const x = random.nextFloat();
        const y = random.nextFloat();
        samples.push(x);
        samples.push(y);
    }
}

class AppPartMainModule implements WorldModule {
    public readonly moduleId = "app-part-main";

    public setup(world: World): void {
        world.registerData<AppPartMainData>("app-part-main");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initMainSystem, writeStateSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [writeStateSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "start", seq: [initMainSystem, writeStateSystem] });
    }
}

class AppPartRemoteModule implements WorldModule {
    public readonly moduleId = "app-part-remote";

    public setup(world: World): void {
        world.addModules([new AppContextModule()]);

        world.registerData<AppPartRemoteData>("app-part-remote");
        world.registerData<AppPartStateData>("app-part-state");

        world.addSystems<DefaultSystemStage>({ stage: "start", fns: [initRemoteSystem] });
        world.addSystems<DefaultSystemStage>({ stage: "update", fns: [updateSystem, renderSystem] });

        world.addDependency<DefaultSystemStage>({ stage: "update", seq: [updateSystem, renderSystem] });
    }
}

export const SAMPLING_MAIN_WORLD: WorldOptions = {
    id: "main",
    modules: [new AppMainModule(), new AppPartMainModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};

export const SAMPLING_REMOTE_WORLD: WorldOptions = {
    id: "remote",
    modules: [new AppRemoteModule(), new AppPartRemoteModule()],
    schedules: DEFAULT_WORLD_SCHEDULES,
};
