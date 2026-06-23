import { PathSweepEvent2, createSweepEventQueue, isIncOutBoolean } from "../internal/path-sweep.ts";
import { Bezier1Curve2, type ReadonlyBezierCurve2 } from "../primitives/bezier.ts";
import type { ReadonlyEdge2 } from "../primitives/edge.ts";
import { ArrayMultiSet } from "../utility/array.ts";
import { log } from "../utility/log.ts";
import type { Mesh2 } from "./mesh.ts";
import {
    ApproximationMode,
    PATH_CLIP_OPTIONS_DEFAULT,
    type BooleanOperator,
    type PathClipOptions,
    type PathQualityOptions,
} from "./path-options.ts";
import type { Path2 } from "./path.ts";
import { SnapRound2 } from "./snapround.ts";
import { isWindingInside2, type CustomWindingOperator, type WindingOperator } from "./winding.ts";

export class PathClip2 {
    private booleanOperator: BooleanOperator;
    private flattenTolerance: number;
    private snapRound: SnapRound2;
    private status: ArrayMultiSet<PathSweepEvent2>;
    private windingOperatorA: WindingOperator | CustomWindingOperator;
    private windingOperatorB: WindingOperator | CustomWindingOperator;

    public constructor(options: PathQualityOptions) {
        this.status = new ArrayMultiSet(PathSweepEvent2.compareStatus);
        this.snapRound = new SnapRound2();

        this.snapRound.precision = options.clipPrecision;
        this.flattenTolerance = options.flattenTolerance;

        this.booleanOperator = PATH_CLIP_OPTIONS_DEFAULT.booleanOperator;
        this.windingOperatorA = PATH_CLIP_OPTIONS_DEFAULT.windingOperatorA;
        this.windingOperatorB = PATH_CLIP_OPTIONS_DEFAULT.windingOperatorB;
    }

    public addCurve(c: ReadonlyBezierCurve2, set = 0, weight = 1, snap = false, data?: unknown): void {
        this.snapRound.addSegment(c, set, weight, snap, data);
    }

    public addEdge(e: ReadonlyEdge2, set = 0, weight = 1, snap = false, data?: unknown): void {
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
        const bufferPath = path.flatten(false, {
            flattenMode: ApproximationMode.RECURSIVE,
            flattenTolerance: this.flattenTolerance,
        });

        for (const c of bufferPath.toCurves()) {
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

        let wind1a = 0;
        let wind2a = 0;
        let wind1b = 0;
        let wind2b = 0;

        let isDone = false;

        // Iterate backwards (substract windings)
        for (let i = this.status.size() - 1; i >= 0; i--) {
            const status = this.status.getAt(i);

            if (status.eq(ev)) {
                if (status.seg.ref.set === 0) {
                    wind1a -= status.wind;
                } else {
                    wind1b -= status.wind;
                }

                status.wind = 0;
                isDone = true;
            } else if (!isDone) {
                // Sum all previous windings
                if (status.seg.ref.set === 0) {
                    wind2a -= status.wind;
                } else {
                    wind2b -= status.wind;
                }
            } else {
                break;
            }
        }

        // Add previous to current winding
        wind1a += wind2a;
        wind1b += wind2b;

        const [in1a, in2a] = isWindingInside2(wind1a, wind2a, this.windingOperatorA);
        const [in1b, in2b] = isWindingInside2(wind1b, wind2b, this.windingOperatorB);

        return isIncOutBoolean(in1a, in2a, in1b, in2b, this.booleanOperator);
    }
}
