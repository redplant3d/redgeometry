import { PathOverlayState2 } from "../internal/path-overlay.js";
import { PathSweepEvent2, createSweepEventQueue } from "../internal/path-sweep.js";
import { Bezier1Curve2, type BezierCurve2 } from "../primitives/bezier.js";
import type { Edge2 } from "../primitives/edge.js";
import { ArrayMultiSet, arrayEquals } from "../utility/array.js";
import { assertDebug, log } from "../utility/debug.js";
import { Mesh2, MeshChain2, MeshEdge2 } from "./mesh.js";
import {
    ApproximationMode,
    DEFAULT_PATH_CLIP_OPTIONS,
    WindingOperator,
    type CustomWindingOperator,
    type PathQualityOptions,
} from "./path-options.js";
import { Path2 } from "./path.js";
import { SnapRound2, type EdgeSegmentRef2 } from "./snapround.js";

export type PathOverlayData2 = {
    tag: number[];
    refs: EdgeSegmentRef2[];
};

export class PathOverlay2 {
    private flattenTolerance: number;
    private snapRound: SnapRound2;
    private status: ArrayMultiSet<PathSweepEvent2>;
    private windingOperator: WindingOperator | CustomWindingOperator;

    constructor(options: PathQualityOptions) {
        this.status = new ArrayMultiSet(PathSweepEvent2.compareStatus);
        this.snapRound = new SnapRound2();

        this.snapRound.precision = options.clipPrecision;
        this.flattenTolerance = options.flattenTolerance;

        this.windingOperator = DEFAULT_PATH_CLIP_OPTIONS.windingOperatorA;
    }

    public addCurve(c: BezierCurve2, set = 0, weight = 1, snap = false, data?: unknown): void {
        this.snapRound.addSegment(c, set, weight, snap, data);
    }

    public addEdge(e: Edge2, set = 0, weight = 1, snap = false, data?: unknown): void {
        this.snapRound.addSegment(e.toBezier(), set, weight, snap, data);
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

    public process(output: Mesh2, windingOperator: WindingOperator | CustomWindingOperator): void {
        this.windingOperator = windingOperator;

        this.status.clear();

        const queue = createSweepEventQueue(this.snapRound);

        const state = new PathOverlayState2();

        for (const qev of queue) {
            if (qev.left) {
                this.status.insert(qev);
            } else {
                // Find the left status
                const index = this.status.findIndexBy((sev) => sev.seg === qev.seg);

                if (index < 0) {
                    log.error("PathOverlay2: Status event segment {} not found", qev.seg);
                    continue;
                }

                const left = this.status.getAt(index);

                // Add region according to winding rule
                this.setState(left, state);

                const [data1, data2] = state.collectData(this.windingOperator);

                state.reset();

                // Quickly reject unnecessary edges (same tags)
                if (!arrayEquals(data1.tag, data2.tag)) {
                    const seg1 = new Bezier1Curve2(left.p1, left.p0);
                    const seg2 = new Bezier1Curve2(left.p0, left.p1);

                    this.addSegmentPair(output, seg1, seg2, data1, data2);
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
    }

    private static isOpen(e1: MeshEdge2, e2: MeshEdge2): boolean {
        return e1.p0.eq(e2.p0) && e1 !== e2;
    }

    private addSegmentPair(
        output: Mesh2,
        seg1: BezierCurve2,
        seg2: BezierCurve2,
        data1: PathOverlayData2,
        data2: PathOverlayData2,
    ): void {
        // Create edge pair
        const edge = output.createEdge(seg1, seg2);
        const edgeSym = edge.sym;

        edge.data = data1;
        edgeSym.data = data2;

        // Try to connect chains
        const chains = output.getChains();

        for (const chain of chains) {
            if (PathOverlay2.isOpen(chain.head.sym, edge)) {
                this.connectSegmentPair(output, chain.head.sym, edge, edgeSym, data1, data2);
                break;
            } else if (PathOverlay2.isOpen(edge, chain.tail)) {
                this.connectSegmentPair(output, chain.tail, edge, edgeSym, data1, data2);
                break;
            }
        }

        for (const chain of chains) {
            if (PathOverlay2.isOpen(chain.head.sym, edgeSym)) {
                this.connectSegmentPair(output, chain.head.sym, edgeSym, edge, data2, data1);
                break;
            } else if (PathOverlay2.isOpen(edgeSym, chain.tail)) {
                this.connectSegmentPair(output, chain.tail, edgeSym, edge, data2, data1);
                break;
            }
        }

        // Check if we need to create new chains
        const chain = edge.chain;
        const chainSym = edgeSym.chain;

        if (chain === undefined) {
            const newChain = output.createChain(edge, edge);
            newChain.data = data1.tag;
            MeshChain2.updateEdgeChains(newChain, newChain);
        } else if (chain.isClosed()) {
            output.finalizeChain(chain);
        }

        if (chainSym === undefined) {
            const newChain = output.createChain(edgeSym, edgeSym);
            newChain.data = data2.tag;
            MeshChain2.updateEdgeChains(newChain, newChain);
        } else if (chainSym.isClosed()) {
            output.finalizeChain(chainSym);
        }
    }

    /**
     * Connects the segment pair `edge` and `edgeSym` to `ref`.
     *
     * ```
     *                 ...
     *
     *                 ^ |
     *                 | |
     *            edge | | edgeSym
     *                 | |
     *                 | v
     *       --------->   --------->
     *          chain      chainSym
     * ```
     */
    private connectSegmentPair(
        output: Mesh2,
        ref: MeshEdge2,
        edge: MeshEdge2,
        edgeSym: MeshEdge2,
        data: PathOverlayData2,
        dataSym: PathOverlayData2,
    ): void {
        // Connect edge and set new head
        const ce1 = MeshEdge2.findConnectingEdge(edge, ref.vector);
        const ce2 = MeshEdge2.findConnectingEdge(ref, edge.vector);
        MeshEdge2.splice(ce1, ce2);

        // Edge `edge` has just been spliced into its edge fan
        const chain = edge.lprev.chain;
        const chainSym = edgeSym.lnext.chain;

        if (chain === undefined || chainSym === undefined) {
            log.error("PathOverlay: No chain");
            return;
        }

        if (chain === chainSym) {
            log.error("PathOverlay: Chain would need splitting");
            return;
        }

        const chainTag = chain.data as number[];
        const chainSymTag = chainSym.data as number[];

        if (arrayEquals(chainTag, data.tag)) {
            if (edge.chain === undefined) {
                // Append `edge` to the head of `chain`
                edge.chain = chain;
                chain.head = edge;
            } else if (edge.chain !== chain) {
                // Merge `chain.tail` into `edge.chain.tail`
                MeshChain2.updateEdgeChains(chain, edge.chain);
                edge.chain.tail = chain.tail;

                const success = output.destroyChain(chain);
                assertDebug(success, "Unable to destroy chain");
            }
        }

        if (arrayEquals(chainSymTag, dataSym.tag)) {
            if (edgeSym.chain === undefined) {
                // Append `edge` to the tail of `chain`
                edgeSym.chain = chainSym;
                chainSym.tail = edgeSym;
            } else if (edgeSym.chain !== chainSym) {
                // Merge `chainSym.head` into `edgeSym.chain.head`
                MeshChain2.updateEdgeChains(chainSym, edgeSym.chain);
                edgeSym.chain.head = chainSym.head;

                const success = output.destroyChain(chainSym);
                assertDebug(success, "Unable to destroy chain");
            }
        }
    }

    private setState(ev: PathSweepEvent2, state: PathOverlayState2): void {
        // Quickly reject inactive segments
        if (ev.wind === 0) {
            return;
        }

        let isDone = false;

        // Iterate backwards (substract windings)
        for (let i = this.status.length - 1; i >= 0; i--) {
            const status = this.status.getAt(i);
            const ref = status.seg.ref;
            const entry = state.getEntry(ref.set);

            if (status.eq(ev)) {
                entry.w0 -= status.wind;
                entry.refs.push(ref);
                status.wind = 0;
                isDone = true;
            } else if (!isDone) {
                // Sum all previous windings
                entry.w1 -= status.wind;
            } else {
                break;
            }
        }
    }
}
