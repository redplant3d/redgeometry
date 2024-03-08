import { Mesh2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { DEFAULT_PATH_QUALITY_OPTIONS } from "redgeometry/src/core/path-options";
import { Polygon2 } from "redgeometry/src/primitives/polygon";
import { log } from "redgeometry/src/utility/debug";
import { RandomXSR128 } from "redgeometry/src/utility/random";
import type { AppContext2D } from "../context.js";
import { createPolygonPair } from "../data.js";
import { ComboBoxInputElement, RangeInputElement } from "../input.js";
import type { AppLauncher, AppPart } from "../launcher.js";
import { getBooleanOperator, getWindingRule } from "../utility.js";

export class TriangulateAppPart implements AppPart {
    private context: AppContext2D;
    private error: Path2;
    private launcher: AppLauncher;
    private mesh: Mesh2;
    private polygonA: Polygon2;
    private polygonB: Polygon2;

    public inputBoolOp: ComboBoxInputElement;
    public inputOptions: ComboBoxInputElement;
    public inputParameter: RangeInputElement;
    public inputWindA: ComboBoxInputElement;
    public inputWindB: ComboBoxInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputParameter = new RangeInputElement("parameter", "0", "200", "100");
        this.inputParameter.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParameter.setStyle("width: 200px");

        this.inputBoolOp = new ComboBoxInputElement("boolOp", "union");
        this.inputBoolOp.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputBoolOp.setOptionValues("union", "intersection", "exclusion", "awithoutb", "bwithouta");

        this.inputWindA = new ComboBoxInputElement("windA", "nonzero");
        this.inputWindA.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputWindA.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");

        this.inputWindB = new ComboBoxInputElement("windB", "nonzero");
        this.inputWindB.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputWindB.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");

        this.inputOptions = new ComboBoxInputElement("options", "triangulate");
        this.inputOptions.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputOptions.setOptionValues("monotonize", "triangulate", "triangulateOpt");

        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();

        this.error = new Path2();
        this.mesh = new Mesh2();
    }

    public create(): void {
        return;
    }

    public render(): void {
        const seed = this.launcher.inputSeed.getInt();
        const random = RandomXSR128.fromSeedLcg(seed);

        this.context.clear();
        this.context.fillMeshRandom(this.mesh, random);

        const pattern = this.context.createLinePattern(10, "#FF0000") ?? "#FF000022";
        this.context.fillPath(this.error, pattern);

        this.context.drawMeshEdges(this.mesh, "#AAAAAA", 1.5);
    }

    public reset(): void {
        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();

        this.error = new Path2();
        this.mesh = new Mesh2();
    }

    public update(_delta: number): void {
        const seed = this.launcher.inputSeed.getInt();
        const generator = this.launcher.inputGenerator.getInt();
        const offset = 2 * (this.inputParameter.getInt() - 100);

        const random = RandomXSR128.fromSeedLcg(seed);
        const [width, height] = this.context.getSize(false);

        [this.polygonA, this.polygonB] = createPolygonPair(random, generator, offset, width, height);

        const clip = new PathClip2(DEFAULT_PATH_QUALITY_OPTIONS);

        for (const edge of this.polygonA.getEdges()) {
            clip.addEdge(edge, 0);
        }

        for (const edge of this.polygonB.getEdges()) {
            clip.addEdge(edge, 1);
        }

        const mesh = new Mesh2();
        clip.process(mesh, {
            booleanOperator: getBooleanOperator(this.inputBoolOp.getValue()),
            windingOperatorA: getWindingRule(this.inputWindA.getValue()),
            windingOperatorB: getWindingRule(this.inputWindB.getValue()),
        });

        switch (this.inputOptions.getValue()) {
            case "monotonize": {
                mesh.monotonize();
                break;
            }
            case "triangulate": {
                mesh.triangulate(false);
                break;
            }
            case "triangulateOpt": {
                mesh.triangulate(true);
                break;
            }
        }

        mesh.validate();

        this.mesh = mesh;
        this.error = new Path2();

        for (const face of this.mesh.getFaces()) {
            const orientation = face.getSignedArea();

            if (orientation <= 0) {
                log.warn("Negative path area: {}", orientation);
            }

            if (!face.isMonotoneInX()) {
                face.writeToPath(this.error);
                log.error("Face not monotone");
            }
        }
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParameter);
        this.launcher.addAppInput(this.inputBoolOp);
        this.launcher.addAppInput(this.inputWindA);
        this.launcher.addAppInput(this.inputWindB);
        this.launcher.addAppInput(this.inputOptions);
    }
}
