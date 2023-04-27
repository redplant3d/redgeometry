import { DEFAULT_PATH_QUALITY_OPTIONS, Mesh2, MeshFace2, Path2, PathOverlay2 } from "redgeometry/src/core";
import { ColorRgba, Edge2, Polygon2 } from "redgeometry/src/primitives";
import { RandomXSR128, arrayEquals, assertDebug } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { createPolygonPair } from "../data";
import { ComboBoxInputElement, RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";
import { getWindingRule } from "../utility";

type PathOverlayTagEntry = { tag: number[]; faces: MeshFace2[] };

export class PathOverlayAppPart implements AppPart {
    private context: AppContext2D;
    private launcher: AppLauncher;
    private mesh: Mesh2;
    private polygonA: Polygon2;
    private polygonB: Polygon2;
    private tagEntries: PathOverlayTagEntry[];

    public inputParameter: RangeInputElement;
    public inputWind: ComboBoxInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputParameter = new RangeInputElement("parameter", "0", "200", "100");
        this.inputParameter.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParameter.setStyle("width: 200px");

        this.inputWind = new ComboBoxInputElement("wind", "nonzero");
        this.inputWind.addEventListener("input", () => this.launcher.requestUpdate(true));
        this.inputWind.setOptionValues("nonzero", "evenodd", "positive", "negative", "absgeqtwo");

        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();
        this.mesh = new Mesh2();
        this.tagEntries = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();

        const styles: string[] = [];
        const step = 1 / this.tagEntries.length;
        for (let h = 0; h < 1; h += step) {
            const c = ColorRgba.fromHsv(h, 0.25, 1, 1);
            styles.push(c.style);
        }

        for (const face of this.mesh.getFaces()) {
            const tag = face.data as number[];

            if (tag.length === 0) {
                continue;
            }

            const path = new Path2();
            face.writeToPath(path);

            const idx = this.tagEntries.findIndex((c) => arrayEquals(c.tag, tag));

            if (idx < 0) {
                continue;
            }

            this.context.fillPath(path, styles[idx]);
        }

        this.context.drawMeshEdges(this.mesh, "#888888", 0.5);
    }

    public reset(): void {
        this.polygonA = new Polygon2();
        this.polygonB = new Polygon2();
        this.mesh = new Mesh2();
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();
        const generator = this.launcher.inputGenerator.getInt();
        const offset = 2 * (this.inputParameter.getInt() - 100);

        const random = RandomXSR128.fromSeedLcg(seed);
        const [width, height] = this.context.getSize(false);

        [this.polygonA, this.polygonB] = createPolygonPair(random, generator, offset, width, height);

        const clip = new PathOverlay2(DEFAULT_PATH_QUALITY_OPTIONS);

        for (const edge of this.polygonA.getEdges()) {
            clip.addEdge(edge, 0);
        }

        for (const edge of this.polygonB.getEdges()) {
            clip.addEdge(edge, 1);
        }

        clip.addEdge(Edge2.fromXY(325, 175, 350, 175), 2);
        clip.addEdge(Edge2.fromXY(350, 175, 350, 225), 2);
        clip.addEdge(Edge2.fromXY(350, 225, 325, 225), 2);
        clip.addEdge(Edge2.fromXY(325, 225, 325, 175), 2);

        clip.addEdge(Edge2.fromXY(300, 275, 375, 275), 3);
        clip.addEdge(Edge2.fromXY(375, 275, 375, 325), 3);
        clip.addEdge(Edge2.fromXY(375, 325, 300, 325), 3);
        clip.addEdge(Edge2.fromXY(300, 325, 300, 275), 3);

        const mesh = new Mesh2();

        clip.process(mesh, getWindingRule(this.inputWind.getValue()));

        this.updateTagEntries(mesh);

        this.mesh = mesh;
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParameter);
        this.launcher.addAppInput(this.inputWind);
    }

    private updateTagEntries(mesh: Mesh2): void {
        const entries: PathOverlayTagEntry[] = [];

        for (const face of mesh.getFaces()) {
            assertDebug(face.data !== undefined, "Face data must not be undefined");

            const tag = face.data as number[];
            const entry = entries.find((e) => arrayEquals(e.tag, tag));

            if (entry !== undefined) {
                entry.faces.push(face);
            } else {
                entries.push({ tag, faces: [face] });
            }
        }

        for (const entry of entries) {
            if (entry.tag.length > 0) {
                mesh.monotonizeFaces(entry.faces);
            }
        }

        this.tagEntries = entries;
    }
}
