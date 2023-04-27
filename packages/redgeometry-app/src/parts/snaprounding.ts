import { EdgeSegment2, SnapRound2 } from "redgeometry/src/core";
import { Bezier1Curve2, Box2, Edge2, Point2 } from "redgeometry/src/primitives";
import { RandomXSR128, log } from "redgeometry/src/utility";
import { AppContext2D } from "../context";
import { RangeInputElement } from "../input";
import { AppLauncher, AppPart } from "../launcher";

export class SnapRoundingAppPart implements AppPart {
    private context: AppContext2D;
    private errors: Box2[];
    private inputSegments: Edge2[];
    private intersections: Point2[];
    private launcher: AppLauncher;
    private magnets: Box2[];
    private outputSegments: Edge2[];
    private pins: Point2[];

    public inputParameter: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputParameter = new RangeInputElement("parameter", "1", "200", "50");
        this.inputParameter.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputParameter.setStyle("width: 200px");

        this.inputSegments = [];
        this.outputSegments = [];
        this.intersections = [];
        this.magnets = [];
        this.pins = [];
        this.errors = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        const scale = this.inputParameter.getInt();

        this.context.clear();
        this.context.fillBoxes(this.magnets, "#E4E4E4");
        this.context.drawEdges(this.inputSegments, "#888888");
        this.context.fillPoints(this.pins, "#CCCCCC", 0.25 * scale);
        this.context.fillBoxes(this.errors, "#0088FF44");
        this.context.drawEdges(this.outputSegments);
        this.context.fillEdgePoints(this.outputSegments, "#000000", 5);
        this.context.fillPoints(this.intersections, "#FF0000", 5);
    }

    public reset(): void {
        this.inputSegments = [];
        this.outputSegments = [];
        this.intersections = [];
        this.magnets = [];
        this.pins = [];
        this.errors = [];
    }

    public update(_delta: number): void {
        const scale = this.inputParameter.getInt();
        const precision = 1 / scale;

        const snapRound = new SnapRound2();
        snapRound.precision = precision;

        const [width, height] = this.context.getSize(false);

        this.fillEdges(snapRound, precision, width, height);

        const start = performance.now();
        snapRound.process();
        const end = performance.now();

        log.info("Snap round time: {} ms", (end - start).toFixed(1));

        this.inputSegments = this.transformSegments(snapRound.debugGetInputSegments(), scale);
        this.outputSegments = this.transformSegments(snapRound.debugGetOutputSegments(), scale);
        this.intersections = this.transformPoints(snapRound.debugGetIntersections(), scale);
        this.magnets = this.transformBox(snapRound.debugGetMagnets(), scale);
        this.pins = this.transformPoints(snapRound.debugGetPins(), scale);
        this.errors = this.transformBox(this.transformPoints(snapRound.debugGetErrors(), 1), scale);

        log.info("Got {} input edges", this.inputSegments.length);
        log.info(
            "Found {} intersections, {} magnets and {} pins",
            this.intersections.length,
            this.magnets.length,
            this.pins.length
        );
        log.info("Created {} output edges", this.outputSegments.length);

        if (this.errors.length > 0) {
            log.error("*** {} errors ***", this.errors.length);
        }
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputParameter);
    }

    private addEdge(snapRound: SnapRound2, p0: Point2, p1: Point2, snap = false): void {
        const c = new Bezier1Curve2(p0, p1);
        snapRound.addSegment(c, 0, 1, snap, undefined);
    }

    private addEdges(snapRound: SnapRound2, edges: Edge2[]): void {
        for (const edge of edges) {
            const c = new Bezier1Curve2(edge.p0, edge.p1);
            snapRound.addSegment(c, 0, 1, false, undefined);
        }
    }

    private fillEdges(snapRound: SnapRound2, k: number, width: number, height: number): void {
        const generator = this.launcher.inputGenerator.getInt();
        const seed = this.launcher.inputSeed.getInt();
        const random = RandomXSR128.fromSeedLcg(seed);

        switch (generator) {
            case 0: {
                // Generation constants
                const pinProbability = 0.5;
                const from = 10;
                const to = 30;

                const count = random.nextIntBetween(from, to);

                for (let i = 0; i < count; i++) {
                    let p0 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                    let p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());

                    if (random.nextFloat() < pinProbability) {
                        p0 = Point2.roundToPrecision(p0, k);
                    }

                    if (random.nextFloat() < pinProbability) {
                        p1 = Point2.roundToPrecision(p1, k);
                    }

                    this.addEdge(snapRound, p0, p1);
                }
                break;
            }
            case 1: {
                const edges: Edge2[] = [];
                edges.push(Edge2.fromXY(100, 200, 600, 300));
                edges.push(Edge2.fromXY(75, 425, 575, 625));
                edges.push(Edge2.fromXY(100, 500, 300, 100));
                edges.push(Edge2.fromXY(100, 500, 400, 600));
                edges.push(Edge2.fromXY(300, 500, 500, 200));
                this.addEdges(snapRound, edges);
                break;
            }
            case 2: {
                const edges: Edge2[] = [];
                edges.push(Edge2.fromXY(200, 200, 500, 200));
                edges.push(Edge2.fromXY(500, 200, 500, 500));
                edges.push(Edge2.fromXY(500, 500, 200, 500));
                edges.push(Edge2.fromXY(200, 500, 200, 200));
                edges.push(Edge2.fromXY(300, 220, 400, 220));
                edges.push(Edge2.fromXY(400, 220, 400, 320));
                edges.push(Edge2.fromXY(400, 320, 300, 320));
                edges.push(Edge2.fromXY(300, 320, 300, 220));
                this.addEdges(snapRound, edges);
                break;
            }
            case 3: {
                const p0 = new Point2(width * random.nextFloat(), height * random.nextFloat());
                const p1 = new Point2(width * random.nextFloat(), height * random.nextFloat());

                const t0 = random.nextFloatBetween(0, 0.5);
                const t1 = random.nextFloatBetween(0.5, 1);

                const pp0 = Point2.roundToPrecision(p0.lerp(p1, t0), k);
                const pp1 = Point2.roundToPrecision(p0.lerp(p1, t1), k);

                this.addEdge(snapRound, p0, p1);
                this.addEdge(snapRound, pp0, pp1, true);

                break;
            }
        }
    }

    private transformBox(points: Point2[], scale: number): Box2[] {
        const result: Box2[] = [];

        for (const point of points) {
            const x = Math.round(scale * (point.x - 0.5));
            const y = Math.round(scale * (point.y - 0.5));
            const d = Math.round(scale);
            result.push(new Box2(x, y, x + d, y + d));
        }

        return result;
    }

    private transformEdges(edges: Edge2[], scale: number): Edge2[] {
        const result: Edge2[] = [];

        for (const edge of edges) {
            const x0 = Math.round(scale * edge.p0.x);
            const y0 = Math.round(scale * edge.p0.y);
            const x1 = Math.round(scale * edge.p1.x);
            const y1 = Math.round(scale * edge.p1.y);
            result.push(Edge2.fromXY(x0, y0, x1, y1));
        }

        return result;
    }

    private transformPoints(points: Point2[], scale: number): Point2[] {
        const result: Point2[] = [];

        for (const point of points) {
            const x0 = Math.round(scale * point.x);
            const y0 = Math.round(scale * point.y);
            result.push(new Point2(x0, y0));
        }

        return result;
    }

    private transformSegments(segments: EdgeSegment2[], scale: number): Edge2[] {
        const result: Edge2[] = [];

        for (const segment of segments) {
            const x0 = Math.round(scale * segment.p0.x);
            const y0 = Math.round(scale * segment.p0.y);
            const x1 = Math.round(scale * segment.p1.x);
            const y1 = Math.round(scale * segment.p1.y);
            result.push(Edge2.fromXY(x0, y0, x1, y1));
        }

        return result;
    }
}
