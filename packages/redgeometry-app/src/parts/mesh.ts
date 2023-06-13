import { Mesh2 } from "../../../redgeometry/src/core/mesh.js";
import { PathClip2 } from "../../../redgeometry/src/core/path-clip.js";
import { DEFAULT_PATH_CLIP_OPTIONS, DEFAULT_PATH_QUALITY_OPTIONS } from "../../../redgeometry/src/core/path-options.js";
import { Path2 } from "../../../redgeometry/src/core/path.js";
import { Box2 } from "../../../redgeometry/src/primitives/box.js";
import type { Point2 } from "../../../redgeometry/src/primitives/point.js";
import { RandomXSR128 } from "../../../redgeometry/src/utility/random.js";
import { AppContext2D } from "../context.js";
import { nextPointFromBox } from "../data.js";
import { RangeInputElement } from "../input.js";
import { AppLauncher, type AppPart } from "../launcher.js";

export class MeshAppPart implements AppPart {
    private context: AppContext2D;
    private launcher: AppLauncher;
    private mesh: Mesh2;
    private points: Point2[];

    public inputCount: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputCount = new RangeInputElement("count", "0", "50", "1");
        this.inputCount.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputCount.setStyle("width: 200px");

        this.mesh = new Mesh2();
        this.points = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        const seed = this.launcher.inputSeed.getInt();
        const random = RandomXSR128.fromSeedLcg(seed);

        this.context.clear();
        this.context.fillMeshRandom(this.mesh, random);
        this.context.drawMeshEdges(this.mesh, "#666666", 0.5);
        this.context.fillPoints(this.points, "#000000", 5);
    }

    public reset(): void {
        this.mesh = new Mesh2();
        this.points = [];
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();
        const count = this.inputCount.getInt();
        const random = RandomXSR128.fromSeedLcg(seed);
        const [canvasWidth, canvasHeight] = this.context.getSize(false);
        const box = new Box2(0, 0, canvasWidth, canvasHeight);

        const p0 = nextPointFromBox(random, box);
        const p1 = nextPointFromBox(random, box);
        const p2 = nextPointFromBox(random, box);

        this.points.push(p0, p1, p2);

        const path = new Path2();
        path.moveTo(p0);
        path.lineTo(p1);
        path.lineTo(p2);
        path.close();

        const mesh = new Mesh2();
        const pathClip = new PathClip2(DEFAULT_PATH_QUALITY_OPTIONS);
        pathClip.addPath(path);
        pathClip.process(mesh, DEFAULT_PATH_CLIP_OPTIONS);

        for (let i = 0; i < count; i++) {
            const p01 = p0.lerp(p1, random.nextFloat());
            const p12 = p1.lerp(p2, random.nextFloat());
            const pm = p01.lerp(p12, random.nextFloat());
            mesh.triangulateAddPoint(pm);
            this.points.push(pm);
        }

        mesh.triangulateOptimize();
        mesh.validate();

        this.mesh = mesh;
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputCount);
    }
}
