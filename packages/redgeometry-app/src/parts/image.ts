import { ColorRgba } from "redgeometry/src/primitives/color";
import { FillRule, SoftwareRenderContext2 } from "redgeometry/src/render/context";
import { Image2 } from "redgeometry/src/render/image";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContext2D } from "../context.js";
import { createPath } from "../data.js";
import { RangeInputElement, TextBoxInputElement } from "../input.js";
import type { AppLauncher, AppPart } from "../launcher.js";

export class ImageAppPart implements AppPart {
    private context: AppContext2D;
    private image: Image2;
    private launcher: AppLauncher;

    public inputColor: RangeInputElement;
    public inputCount: TextBoxInputElement;
    public inputSize: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new TextBoxInputElement("count", "10");
        this.inputCount.setStyle("width: 80px");

        this.inputSize = new RangeInputElement("size", "1", "1024", "200");
        this.inputSize.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputSize.setStyle("width: 200px");

        this.inputColor = new RangeInputElement("color", "0", "255", "128");
        this.inputColor.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputColor.setStyle("width: 200px");

        this.image = new Image2(0, 0);
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.blitImage(this.image, 0, 0);
    }

    public reset(): void {
        this.image = new Image2(0, 0);
    }

    public update(_delta: number): void {
        const seed = this.launcher.inputSeed.getInt();
        const generator = this.launcher.inputGenerator.getInt();
        const count = this.inputCount.getInt();
        const size = this.inputSize.getInt();
        const color = this.inputColor.getInt();

        const random = RandomXSR128.fromSeedLcg(seed);

        const path = createPath(random, generator, count, size, size);
        path.close();

        this.image.resize(size, size);

        const ctx = new SoftwareRenderContext2();
        ctx.begin(this.image);
        ctx.fillRule = FillRule.EvenOdd;

        ctx.fillColor = new ColorRgba(224, 224, 224, 255);
        ctx.clear();

        ctx.fillColor = new ColorRgba(color, 0, 0, 255);
        ctx.fillPath(path);
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputCount);
        this.launcher.addAppInput(this.inputSize);
        this.launcher.addAppInput(this.inputColor);
    }
}
