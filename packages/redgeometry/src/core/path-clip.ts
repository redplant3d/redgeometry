import { createSweepEventQueue, isIncOutBoolean, isInWinding, PathSweepEvent2 } from "../internal";
import { Bezier1Curve2, BezierCurve2, Edge2 } from "../primitives";
import { ArrayMultiSet, log } from "../utility";
import { Mesh2 } from "./mesh";
import { Path2 } from "./path";
import {
    ApproximationMode,
    BooleanOperator,
    CustomWindingOperator,
    DEFAULT_PATH_CLIP_OPTIONS,
    PathClipOptions,
    PathQualityOptions,
    WindingOperator,
} from "./path-options";
import { SnapRound2 } from "./snapround";

export class PathClip2 {
    private booleanOperator: BooleanOperator;
    private flattenTolerance: number;
    private snapRound: SnapRound2;
    private status: ArrayMultiSet<PathSweepEvent2>;
    private windingOperatorA: WindingOperator | CustomWindingOperator;
    private windingOperatorB: WindingOperator | CustomWindingOperator;

    constructor(options: PathQualityOptions) {
        this.status = new ArrayMultiSet(PathSweepEvent2.compareStatus);
        this.snapRound = new SnapRound2();

        this.snapRound.precision = options.clipPrecision;
        this.flattenTolerance = options.flattenTolerance;

        this.booleanOperator = DEFAULT_PATH_CLIP_OPTIONS.booleanOperator;
        this.windingOperatorA = DEFAULT_PATH_CLIP_OPTIONS.windingOperatorA;
        this.windingOperatorB = DEFAULT_PATH_CLIP_OPTIONS.windingOperatorB;
    }

    public addCurve(c: BezierCurve2, set = 0, weight = 1, snap = false, data?: unknown): void {
        this.snapRound.addSegment(c, set, weight, snap, data);
    }

    public addEdge(e: Edge2, set = 0, weight = 1, snap = false, data?: unknown): void {
        this.snapRound.addSegment(e.toBezier(), set, weight, snap, data);
    }

    public addMesh(mesh: Mesh2, set = 0, weight = 1, snap = false): void {
        for (const chain of mesh.getChains()) {
            for (const edge of chain.getEdgeIterator()) {
                if (edge.seg !== undefined) {
                    this.snapRound.addSegment(edge.seg, set, weight, snap, edge.data);
                }
            }
        }

        for (const face of mesh.getFaces()) {
            for (const edge of face.getEdgeIterator()) {
                if (edge.seg !== undefined) {
                    this.snapRound.addSegment(edge.seg, set, weight, snap, edge.data);
                }
            }
        }
    }

    public addPath(path: Path2, set = 0, weight = 1, snap = false): void {
        // Workaround: Flatten whole path
        const buffer = path.flatten(false, {
            flattenMode: ApproximationMode.Recursive,
            flattenTolerance: this.flattenTolerance,
        });

        for (const c of buffer.getCurveIterator()) {
            this.snapRound.addSegment(c, set, weight, snap, undefined);
        }
    }

    public process(output: Mesh2, options: PathClipOptions): void {
        this.booleanOperator = options.booleanOperator;
        this.windingOperatorA = options.windingOperatorA;
        this.windingOperatorB = options.windingOperatorB;

        this.status.clear();

        const queue = createSweepEventQueue(this.snapRound);

        for (const qev of queue) {
            if (qev.left) {
                this.status.insert(qev);
            } else {
                // Find the left status
                const index = this.status.findIndexBy((sev) => sev.seg === qev.seg);

                if (index < 0) {
                    log.error("PathClip2: Status event segment {} not found", qev.seg);
                    continue;
                }

                const left = this.status.getAt(index);

                // Add region according to winding rule
                const [inc, out] = this.isIncOut(left);

                if (inc) {
                    const c = new Bezier1Curve2(left.p0, left.p1);
                    output.addChainSegment(c, left.seg.ref.data);
                } else if (out) {
                    const c = new Bezier1Curve2(left.p1, left.p0);
                    output.addChainSegment(c, left.seg.ref.data);
                }

                // Finally remove the event
                this.status.removeAt(index);
            }
        }

        // Cleanup
        this.snapRound.clear();
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.snapRound.precision = options.clipPrecision;
        this.flattenTolerance = options.flattenTolerance;
    }

    private isIncOut(ev: PathSweepEvent2): [boolean, boolean] {
        if (ev.wind === 0) {
            // Quickly reject inactive segments
            return [false, false];
        }

        let wa0 = 0;
        let wa1 = 0;
        let wb0 = 0;
        let wb1 = 0;

        let isDone = false;

        // Iterate backwards (substract windings)
        for (let i = this.status.length - 1; i >= 0; i--) {
            const status = this.status.getAt(i);

            if (status.eq(ev)) {
                if (status.seg.ref.set === 0) {
                    wa0 -= status.wind;
                } else {
                    wb0 -= status.wind;
                }

                status.wind = 0;
                isDone = true;
            } else if (!isDone) {
                // Sum all previous windings
                if (status.seg.ref.set === 0) {
                    wa1 -= status.wind;
                } else {
                    wb1 -= status.wind;
                }
            } else {
                break;
            }
        }

        // Add previous to current winding
        wa0 += wa1;
        wb0 += wb1;

        const [ina0, ina1] = isInWinding(wa0, wa1, this.windingOperatorA);
        const [inb0, inb1] = isInWinding(wb0, wb1, this.windingOperatorB);

        return isIncOutBoolean(ina0, ina1, inb0, inb1, this.booleanOperator);
    }
}
