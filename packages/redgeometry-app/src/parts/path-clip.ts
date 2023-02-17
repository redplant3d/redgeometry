import { DEFAULT_PATH_QUALITY_OPTIONS, Mesh2, Path2, PathClip2 } from "redgeometry/src/core";
import { Polygon2 } from "redgeometry/src/primitives";
import { RandomXSR128 } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { createPolygonPair } from "../data";
import { ComboBoxInputElement, RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";
import { getBooleanOperator, getWindingRule } from "../utility";

export class PathClipAppPart implements AppPart {
    private chains: Path2;
    private context: AppContext2D;
    private faces: Path2;
    private launcher: AppLauncher;
    private polygonA: Polygon2;
    private polygonB: Polygon2;

    public inputBoolOp: ComboBoxInputElement;
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

        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();

        this.chains = new Path2();
        this.faces = new Path2();
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.fillPolygon(this.polygonA, "#00FF0022");
        this.context.fillPolygon(this.polygonB, "#0000FF22");

        const pattern = this.context.createLinePattern(6, "#FF0000") ?? "#FF000022";

        this.context.fillPath(this.faces, pattern);
        this.context.drawPath(this.faces, "#FF3333", 1.5);
        this.context.drawPath(this.chains, "#3333FF", 1.5);
    }

    public reset(): void {
        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();

        this.chains = new Path2();
        this.faces = new Path2();
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

        this.faces.clear();
        this.chains.clear();

        const mesh = new Mesh2();
        clip.process(mesh, {
            booleanOperator: getBooleanOperator(this.inputBoolOp.getValue()),
            windingOperatorA: getWindingRule(this.inputWindA.getValue()),
            windingOperatorB: getWindingRule(this.inputWindB.getValue()),
        });

        this.faces = mesh.getFacesPath();
        this.chains = mesh.getChainsPath();
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParameter);
        this.launcher.addAppInput(this.inputBoolOp);
        this.launcher.addAppInput(this.inputWindA);
        this.launcher.addAppInput(this.inputWindB);
    }
}
