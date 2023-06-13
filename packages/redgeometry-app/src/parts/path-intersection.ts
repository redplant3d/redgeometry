import { Path2 } from "../../../redgeometry/src/core/path.js";
import { Bezier2Curve2 } from "../../../redgeometry/src/primitives/bezier.js";
import { Point2 } from "../../../redgeometry/src/primitives/point.js";
import { AppContext2D } from "../context.js";
import { RangeInputElement } from "../input.js";
import { AppLauncher, type AppPart } from "../launcher.js";

export class PathIntersectionAppPart implements AppPart {
    private context: AppContext2D;
    private launcher: AppLauncher;
    private path: Path2;
    private points: Point2[];

    public inputParameter: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputParameter = new RangeInputElement("parameter", "0", "200", "100");
        this.inputParameter.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParameter.setStyle("width: 200px");

        this.path = new Path2();
        this.points = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.drawPath(this.path);
        this.context.fillPoints(this.points, "#FF0000", 5);
    }

    public reset(): void {
        this.path = new Path2();
        this.points = [];
    }

    public update(_delta: number): void {
        const offset = this.inputParameter.getInt();

        const c1 = new Bezier2Curve2(new Point2(100, 150), new Point2(300, 400), new Point2(600, 250));
        const c2 = new Bezier2Curve2(new Point2(100, 500), new Point2(300, 100), new Point2(500, 100 + 3 * offset));

        this.points = [];
        this.path = new Path2();

        c1.intersectQuad(c2, this.points);

        this.path.addCurveSplines(c1);
        this.path.addCurveSplines(c2);
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParameter);
    }
}
