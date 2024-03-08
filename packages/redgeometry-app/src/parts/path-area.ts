import { Path2 } from "redgeometry/src/core/path";
import { WindingOperator } from "redgeometry/src/core/path-options";
import { Box2 } from "redgeometry/src/primitives/box";
import { Point2 } from "redgeometry/src/primitives/point";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContext2D } from "../context.js";
import { createPath } from "../data.js";
import { TextBoxInputElement } from "../input.js";
import type { AppLauncher, AppPart } from "../launcher.js";

export class PathAreaAppPart implements AppPart {
    private bounds: Box2;
    private context: AppContext2D;
    private input: Path2;
    private isInside: boolean;
    private launcher: AppLauncher;

    public inputCount: TextBoxInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new TextBoxInputElement("count", "10");
        this.inputCount.setStyle("width: 80px");

        this.input = new Path2();
        this.bounds = Box2.createEmpty();
        this.isInside = false;
    }

    public create(): void {
        const canvas = document.getElementById("canvas2D");
        canvas?.addEventListener("mousemove", (e) => this.onMouseMove(e));
    }

    public render(): void {
        this.context.clear();
        this.context.fillBox(this.bounds, "#ADD8E644");
        this.context.fillPath(this.input, this.isInside ? "#FFCCCC" : "#CCCCCC", "evenodd");
        this.context.drawPath(this.input, "#666666");
        this.context.fillPoints(this.input.getPoints(), "#000000", 5);
    }

    public reset(): void {
        this.input.clear();
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();
        const generator = this.launcher.inputGenerator.getInt();
        const count = this.inputCount.getInt();

        const random = RandomXSR128.fromSeedLcg(seed);
        const [canvasWidth, canvasHeight] = this.context.getSize(false);

        const path = createPath(random, generator, count, canvasWidth, canvasHeight);
        path.close();

        this.input = path;
        this.bounds = path.getBounds();

        log.info("Path area = {}", path.getSignedArea());
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputCount);
    }

    private onMouseMove(e: MouseEvent): void {
        const p = new Point2(e.offsetX, e.offsetY);
        this.isInside = this.input.hasPointInside(p, WindingOperator.EvenOdd);
        this.launcher.requestUpdate();
    }
}
