import { Box2 } from "redgeometry/src/primitives";
import { Image2 } from "redgeometry/src/render";
import { RandomXSR128, assertUnreachable, clamp, type Random } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { ComboBoxInputElement, RangeInputElement } from "../input";
import { AppLauncher, type AppPart } from "../launcher";

const SOBOL_XOR_1 = [
    0x00000000, 0x00000001, 0x00000001, 0x00000007, 0x00000001, 0x00000013, 0x00000015, 0x0000007f, 0x00000001,
    0x00000103, 0x00000105, 0x0000070f, 0x00000111, 0x00001333, 0x00001555, 0x00007fff, 0x00000001, 0x00010003,
    0x00010005, 0x0007000f, 0x00010011, 0x00130033, 0x00150055, 0x007f00ff, 0x00010101, 0x01030303, 0x01050505,
    0x070f0f0f, 0x01111111, 0x13333333,
];

export class SamplingAppPart implements AppPart {
    private boxes: Box2[];
    private context: AppContext2D;
    private image: Image2;
    private launcher: AppLauncher;

    public inputCount: RangeInputElement;
    public inputFormat: ComboBoxInputElement;
    public inputSize: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputSize = new RangeInputElement("size", "16", "1024", "512");
        this.inputSize.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputSize.setStyle("width: 200px");

        this.inputCount = new RangeInputElement("count", "0", "16", "8");
        this.inputCount.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputCount.setStyle("width: 200px");

        this.inputFormat = new ComboBoxInputElement("format", "none");
        this.inputFormat.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputFormat.setOptionValues("none", "u8", "u16", "u32", "f32");

        this.image = new Image2(0, 0);
        this.boxes = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        const w = this.image.getWidth();
        const size = this.inputSize.getInt();

        let scale = Math.trunc(size / w);
        scale = clamp(scale, 1, 128);

        const image = this.image.magnify(scale);

        this.context.clear();
        this.context.blitImage(image, 0, 0);
        this.context.fillBoxes(this.boxes, "#000000");
    }

    public reset(): void {
        this.image = new Image2(0, 0);
        this.boxes = [];
    }

    public update(_delta: number): void {
        this.reset();

        const generator = this.launcher.inputGenerator.getInt();
        const count = 2 ** this.inputCount.getFloat();
        const seed = this.launcher.inputSeed.getInt();
        const size = this.inputSize.getInt();

        const random = RandomXSR128.fromSeedLcg(seed);
        const samples: number[] = [];

        switch (generator) {
            case 0: {
                this.sampleWhiteNoise(random, count, samples);
                break;
            }
            case 1: {
                this.sampleJitteredGrid(random, count, samples);
                break;
            }
            case 2: {
                this.sampleStochasticSobol(random, count, samples);
                break;
            }
        }

        switch (this.inputFormat.getValue()) {
            case "none": {
                this.boxes = this.createBoxes(samples, size, size / 256);
                break;
            }
            case "u8": {
                this.image = this.createImage(samples, "u8");
                break;
            }
            case "u16": {
                this.image = this.createImage(samples, "u16");
                break;
            }
            case "u32": {
                this.image = this.createImage(samples, "u32");
                break;
            }
            case "f32": {
                this.image = this.createImage(samples, "f32");
                break;
            }
        }
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputSize);
        this.launcher.addAppInput(this.inputCount);
        this.launcher.addAppInput(this.inputFormat);
    }

    private createBoxes(samples: number[], size: number, d: number): Box2[] {
        const boxes: Box2[] = [];

        for (let i = 0; i < samples.length; i += 2) {
            const sx = size * samples[i + 0];
            const sy = size * samples[i + 1];
            const b = new Box2(sx - d, sy - d, sx + d, sy + d);
            boxes.push(b);
        }

        return boxes;
    }

    private createImage(samples: number[], format: "u8" | "u16" | "u32" | "f32"): Image2 {
        switch (format) {
            case "u8": {
                const d = this.getImageMinSize(samples.length, 4);
                const arr = new Uint8Array(4 * d * d);

                for (let i = 0; i < samples.length; i++) {
                    arr[i] = 256 * samples[i];
                }

                return new Image2(d, d, arr.buffer);
            }
            case "u16": {
                const d = this.getImageMinSize(samples.length, 2);
                const arr = new Uint16Array(2 * d * d);

                for (let i = 0; i < samples.length; i++) {
                    arr[i] = 65536 * samples[i];
                }

                return new Image2(d, d, arr.buffer);
            }
            case "u32": {
                const d = this.getImageMinSize(samples.length, 1);
                const arr = new Uint32Array(d * d);

                for (let i = 0; i < samples.length; i++) {
                    arr[i] = 4294967296 * samples[i];
                }

                return new Image2(d, d, arr.buffer);
            }
            case "f32": {
                const d = this.getImageMinSize(samples.length, 1);
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

    private createStratifiedSample(
        random: Random,
        stratum0: number,
        stratum1: number,
        strata: number,
        samples: number[]
    ): void {
        const x = stratum0 + random.nextFloat();
        const y = stratum1 + random.nextFloat();
        samples.push(x / strata);
        samples.push(y / strata);
    }

    private getImageMinSize(sampleCount: number, bpp: number): number {
        const size = Math.sqrt(sampleCount / bpp);
        return Math.ceil(size);
    }

    private sampleJitteredGrid(random: Random, count: number, samples: number[]): void {
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

    private sampleStochasticSobol(random: Random, count: number, samples: number[]): void {
        //  ssobol02 (Stochastic Generation of (t,s) Sample Sequences by Andrew Helmer)
        let stratum0 = 0;
        let stratum1 = 0;
        let strata = 1;

        this.createStratifiedSample(random, stratum0, stratum1, strata, samples);

        for (let i = 0, j = 1; j < count; i++, j = strata) {
            strata = 2 * j;

            for (let k = 0; k < j; k++) {
                const xor0 = 2 * (k ^ 0);
                const xor1 = 2 * (k ^ SOBOL_XOR_1[i]);

                stratum0 = (strata * samples[xor0 + 0]) ^ 1;
                stratum1 = (strata * samples[xor1 + 1]) ^ 1;

                this.createStratifiedSample(random, stratum0, stratum1, strata, samples);
            }
        }
    }

    private sampleWhiteNoise(random: Random, count: number, samples: number[]): void {
        for (let i = 0; i < count; i++) {
            const x = random.nextFloat();
            const y = random.nextFloat();
            samples.push(x);
            samples.push(y);
        }
    }
}
