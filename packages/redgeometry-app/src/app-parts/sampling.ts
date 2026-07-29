import { MinMaxBox2, type ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import { assertUnreachable } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { clamp } from "redgeometry/src/utility/scalar";
import type { AppContextPlugin } from "../ecs-modules/app-context.ts";
import { APP_INPUT_START_SYSTEM_ID } from "../ecs-modules/app-input.ts";
import {
    APP_MODULE_ID,
    APP_START_SYSTEM_ID,
    APP_UPDATE_SYSTEM_ID,
    appModule,
    START_SCHEDULE_ID,
    UPDATE_SCHEDULE_ID,
    type AppInputData,
    type AppMainInputData,
} from "../ecs-modules/app.ts";
import { WorldContext, type World } from "../ecs/world.ts";
import { ComboBoxInputElement, RangeInputElement } from "../utility/html-element.ts";
import { Image2 } from "../utility/image.ts";

const SOBOL_XOR_1 = [
    0x00000000, 0x00000001, 0x00000001, 0x00000007, 0x00000001, 0x00000013, 0x00000015, 0x0000007f, 0x00000001,
    0x00000103, 0x00000105, 0x0000070f, 0x00000111, 0x00001333, 0x00001555, 0x00007fff, 0x00000001, 0x00010003,
    0x00010005, 0x0007000f, 0x00010011, 0x00130033, 0x00150055, 0x007f00ff, 0x00010101, 0x01030303, 0x01050505,
    0x070f0f0f, 0x01111111, 0x13333333,
];

type SamplingInputData = {
    dataId: "sampling-input-data";
    inputCount: RangeInputElement;
    inputFormat: ComboBoxInputElement;
    inputSize: RangeInputElement;
};

type SamplingStateData = {
    dataId: "sampling-state-data";
    boxes: ReadonlyMinMaxBox2[];
    image: Image2;
};

const SAMPLING_START_SYSTEM_ID = "sampling-start-system";
const SAMPLING_UPDATE_SYSTEM_ID = "sampling-update-system";
const SAMPLING_RENDER_SYSTEM_ID = "sampling-render-system";

function samplingStartSystem(world: World): void {
    const { inputElements } = world.getData<AppInputData>("app-input-data");

    const inputSize = new RangeInputElement("size", "16", "1024", "512");
    inputSize.setStyle("width: 200px");
    inputElements.push(inputSize);

    const inputCount = new RangeInputElement("count", "0", "16", "8");
    inputCount.setStyle("width: 200px");
    inputElements.push(inputCount);

    const inputFormat = new ComboBoxInputElement("format", "none");
    inputFormat.setOptionValues("none", "u8", "u16", "u32", "f32");
    inputElements.push(inputFormat);

    world.setData<SamplingInputData>({
        dataId: "sampling-input-data",
        inputSize,
        inputCount,
        inputFormat,
    });

    world.setData<SamplingStateData>({
        dataId: "sampling-state-data",
        boxes: [],
        image: new Image2(0, 0),
    });
}

function samplingUpdateSystem(world: World): void {
    const { inputSize, inputCount, inputFormat } = world.getData<SamplingInputData>("sampling-input-data");
    const size = inputSize.getInt();
    const count = inputCount.getInt();
    const format = inputFormat.getValue();

    const { generatorTextBox, seedTextBox } = world.getData<AppMainInputData>("app-main-input-data");
    const seed = seedTextBox.getInt();
    const generator = generatorTextBox.getInt();

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

    let boxes: MinMaxBox2[] = [];
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

    world.setData<SamplingStateData>({
        dataId: "sampling-state-data",
        boxes,
        image,
    });
}

function samplingRenderSystem(world: World): void {
    const { boxes, image } = world.getData<SamplingStateData>("sampling-state-data");
    const { inputSize } = world.getData<SamplingInputData>("sampling-input-data");
    const size = inputSize.getInt();

    const ctx = world.getPlugin<AppContextPlugin>("app-context-plugin");

    const w = image.getWidth();

    let scale = Math.trunc(size / w);
    scale = clamp(scale, 1, 128);

    const imageScaled = image.magnify(scale);

    ctx.clear();
    ctx.blitImage(imageScaled, 0, 0);
    ctx.fillBoxes(boxes, "#000000");
}

function createBoxes(samples: number[], size: number, d: number): MinMaxBox2[] {
    const boxes: MinMaxBox2[] = [];

    for (let i = 0; i < samples.length; i += 2) {
        const sx = size * samples[i + 0];
        const sy = size * samples[i + 1];
        const b = new MinMaxBox2(sx - d, sy - d, sx + d, sy + d);
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

export const SAMPLING_APP_PART_MODULE_ID = "sampling-app-part-module";

export function samplingAppPartModule(context: WorldContext): void {
    context.addModule({
        id: APP_MODULE_ID,
        fn: appModule,
    });

    context.addData<SamplingInputData>("sampling-input-data");
    context.addData<SamplingStateData>("sampling-state-data");

    context.addSystem({
        id: SAMPLING_START_SYSTEM_ID,
        fn: samplingStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystem({
        id: SAMPLING_UPDATE_SYSTEM_ID,
        fn: samplingUpdateSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });
    context.addSystem({
        id: SAMPLING_RENDER_SYSTEM_ID,
        fn: samplingRenderSystem,
        mode: "sync",
        scheduleId: UPDATE_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_START_SYSTEM_ID, SAMPLING_START_SYSTEM_ID, APP_INPUT_START_SYSTEM_ID],
        scheduleId: START_SCHEDULE_ID,
    });

    context.addSystemDepedency({
        seq: [APP_UPDATE_SYSTEM_ID, SAMPLING_UPDATE_SYSTEM_ID, SAMPLING_RENDER_SYSTEM_ID],
        scheduleId: UPDATE_SCHEDULE_ID,
    });
}
