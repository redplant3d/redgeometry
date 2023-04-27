import { Box3, Edge2, Edge3, Matrix4x4, Point2, Point3 } from "redgeometry/src/primitives";
import { Random } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { ComboBoxInputElement, RangeInputElement, TextBoxInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class MatrixAppPart implements AppPart {
    private context: AppContext2D;
    private edges: Edge2[];
    private launcher: AppLauncher;

    public inputCount: TextBoxInputElement;
    public inputProjection: ComboBoxInputElement;
    public inputRotation: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new TextBoxInputElement("count", "10");
        this.inputCount.setStyle("width: 80px");

        this.inputRotation = new RangeInputElement("rotation", "0", "360", "0");
        this.inputRotation.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputRotation.setStyle("width: 200px");

        this.inputProjection = new ComboBoxInputElement("projection", "orthographic");
        this.inputProjection.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputProjection.setOptionValues("orthographic", "perspective");

        this.edges = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.drawEdges(this.edges, "#000000");
    }

    public reset(): void {
        this.edges = [];
    }

    public update(_delta: number): void {
        this.reset();

        const rotation = this.inputRotation.getInt();

        const [canvasWidth, canvasHeight] = this.context.getSize(true);

        const edges = this.createCube();

        const w = 0.5 * canvasWidth;
        const h = 0.5 * canvasHeight;
        const s = 0.2 * Math.min(canvasWidth, canvasHeight);
        const d = (rotation * Math.PI) / 180;

        const model = Matrix4x4.identity;
        model.rotateXAnglePre(1.1 * d);
        model.rotateYAnglePre(1.3 * d);
        model.rotateZAnglePre(1.7 * d);

        const view = Matrix4x4.identity;
        view.translatePre(0, 0, -10);

        let projection;

        if (this.inputProjection.getValue() === "orthographic") {
            projection = Matrix4x4.fromOrthographic(-1, 1, 1, -1, -10, 1000);
        } else {
            projection = Matrix4x4.fromPerspective(-1, 1, 1, -1, -10, 1000);
        }

        projection.scalePre(s, s, s);
        projection.translatePre(w, h, 0);

        const pvm = projection.mul(view).mul(model);

        this.edges = this.transformEdges(edges, pvm);

        // log.infoDebug("*********");
        // for (const e of this.edges) {
        //     log.infoDebug("{}", e);
        // }
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputCount);
        this.launcher.addAppInput(this.inputRotation);
        this.launcher.addAppInput(this.inputProjection);
    }

    private createCube(): Edge3[] {
        const p0 = new Point3(1, 1, 1);
        const p1 = new Point3(1, 1, -1);
        const p2 = new Point3(1, -1, 1);
        const p3 = new Point3(1, -1, -1);
        const p4 = new Point3(-1, 1, 1);
        const p5 = new Point3(-1, 1, -1);
        const p6 = new Point3(-1, -1, 1);
        const p7 = new Point3(-1, -1, -1);

        const edges = [
            new Edge3(p0, p1),
            new Edge3(p2, p3),
            new Edge3(p4, p5),
            new Edge3(p6, p7),

            new Edge3(p0, p2),
            new Edge3(p1, p3),
            new Edge3(p4, p6),
            new Edge3(p5, p7),

            new Edge3(p0, p4),
            new Edge3(p1, p5),
            new Edge3(p2, p6),
            new Edge3(p3, p7),
        ];

        return edges;
    }

    private nextPointFromBox(random: Random, box: Box3): Point3 {
        const x = random.nextFloatBetween(box.x0, box.x1);
        const y = random.nextFloatBetween(box.y0, box.y1);
        const z = random.nextFloatBetween(box.z0, box.z1);

        return new Point3(x, y, z);
    }

    private transformEdges(edges: Edge3[], m: Matrix4x4): Edge2[] {
        const output: Edge2[] = [];

        for (const e of edges) {
            const p0 = m.mapPoint(e.p0);
            const p1 = m.mapPoint(e.p1);
            const pp0 = Point2.fromObject(p0);
            const pp1 = Point2.fromObject(p1);
            output.push(new Edge2(pp0, pp1));
        }

        return output;
    }
}
