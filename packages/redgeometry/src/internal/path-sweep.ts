import { BooleanOperator, SnapRound2, WindingOperator, type CustomWindingOperator, type EdgeSegment2 } from "../core";
import { Point2 } from "../primitives";
import { log } from "../utility";

export class PathSweepEvent2 {
    public left: boolean;
    public p0: Point2;
    public p1: Point2;
    public seg: EdgeSegment2;
    public wind: number;

    constructor(p0: Point2, p1: Point2, seg: EdgeSegment2, wind: number, left: boolean) {
        this.p0 = p0;
        this.p1 = p1;
        this.seg = seg;
        this.wind = wind;
        this.left = left;
    }

    public static compareQueue(ev1: PathSweepEvent2, ev2: PathSweepEvent2): number {
        // `result` < 0 -> `e1 < e2`
        // `result` > 0 -> `e2 < e1`
        if (ev1.p0.x !== ev2.p0.x) {
            // Sort by `x`
            return ev1.p0.x - ev2.p0.x;
        } else if (ev1.p0.y !== ev2.p0.y) {
            // Same `x`, sort by `y`
            return ev1.p0.y - ev2.p0.y;
        } else if (ev1.left !== ev2.left) {
            // Same `y`, sort `!left` before `left`
            return ev1.left ? 1 : -1;
        } else if (ev1.left) {
            // Same left point
            return Point2.signedArea(ev1.p1, ev1.p0, ev2.p1);
        } else {
            // Same right point
            return Point2.signedArea(ev1.p0, ev1.p1, ev2.p1);
        }
    }

    public static compareStatus(ev1: PathSweepEvent2, ev2: PathSweepEvent2): number {
        // `result < 0` -> `e1 < e2`
        // `result > 0` -> `e2 < e1`
        if (ev1.p0.eq(ev2.p0)) {
            if (ev1.p1.eq(ev2.p1)) {
                // Segments are equal
                return 0;
            } else {
                // Same left point
                return Point2.signedArea(ev1.p1, ev1.p0, ev2.p1);
            }
        } else {
            if (PathSweepEvent2.compareQueue(ev1, ev2) < 0) {
                // `e1` is left of `e2`
                return Point2.signedArea(ev1.p1, ev1.p0, ev2.p0);
            } else {
                // `e2` is left of `e1`
                return Point2.signedArea(ev2.p0, ev2.p1, ev1.p0);
            }
        }
    }

    public eq(ev: PathSweepEvent2): boolean {
        return this.p0.eq(ev.p0) && this.p1.eq(ev.p1);
    }

    public printDebug(): void {
        log.infoDebug(
            "{} -> {} ({}, id = {}, winding = {})",
            this.p0,
            this.p1,
            this.left ? "left" : "right",
            this.seg.ref.data,
            this.wind
        );
    }
}

export function createSweepEventQueue(snapRound: SnapRound2): PathSweepEvent2[] {
    snapRound.process();

    log.assertFn(() => snapRound.validate(), "PathClip2: Validation failed");

    const edgeSegments: EdgeSegment2[] = [];
    snapRound.writeEdgeSegmentsTo(edgeSegments);

    const queue: PathSweepEvent2[] = [];

    for (const seg of edgeSegments) {
        // Fetch points, weight becomes winding
        const p0 = seg.p0;
        const p1 = seg.p1;
        const wind = seg.ref.weight;

        if (p0.eq(p1)) {
            // Ignore empty edges
            continue;
        }

        if (p0.lt(p1)) {
            queue.push(new PathSweepEvent2(p0, p1, seg, wind, true));
            queue.push(new PathSweepEvent2(p1, p0, seg, wind, false));
        } else {
            queue.push(new PathSweepEvent2(p1, p0, seg, -wind, true));
            queue.push(new PathSweepEvent2(p0, p1, seg, -wind, false));
        }
    }

    queue.sort(PathSweepEvent2.compareQueue);

    return queue;
}

export function isInWinding(
    w0: number,
    w1: number,
    windingOperator: WindingOperator | CustomWindingOperator
): [boolean, boolean] {
    let in0 = false;
    let in1 = false;

    switch (windingOperator) {
        case WindingOperator.NonZero: {
            in0 = w0 !== 0;
            in1 = w1 !== 0;
            break;
        }
        case WindingOperator.EvenOdd: {
            in0 = (w0 & 1) !== 0;
            in1 = (w1 & 1) !== 0;
            break;
        }
        case WindingOperator.Positive: {
            in0 = w0 > 0;
            in1 = w1 > 0;
            break;
        }
        case WindingOperator.Negative: {
            in0 = w0 < 0;
            in1 = w1 < 0;
            break;
        }
        default: {
            in0 = windingOperator(w0);
            in1 = windingOperator(w1);
            break;
        }
    }

    return [in0, in1];
}

export function isIncOutBoolean(
    ina0: boolean,
    ina1: boolean,
    inb0: boolean,
    inb1: boolean,
    booleanOperator: BooleanOperator
): [boolean, boolean] {
    // Incoming & outgoing:
    //      inca = !ina0 && ina1;
    //      outa = ina0 && !ina1;
    //      incb = !inb0 && inb1;
    //      outb = inb0 && !inb1;
    // Union:
    //      inc = (inca && !inb0) || (incb && !ina0);
    //      out = (outa && !inb1) || (outb && !ina1);
    // Intersection:
    //      inc = (inca && inb1) || (incb && ina1);
    //      out = (outa && inb0) || (outb && ina0);
    // Exclusion:
    //      inc = (inca && !inb0 && !inb1) || (outb && ina0 && ina1) ||
    //          (incb && !ina0 && !ina1) || (outa && inb0 && inb1);
    //      isOut = (outa && !inb0 && !inb1) || (incb && ina0 && ina1) ||
    //          (outb && !ina0 && !ina1) || (inca && inb0 && inb1);
    // AWithoutB:
    //      inc = (inca && !inb1) || (outb && ina1);
    //      out = (outa && !inb0) || (incb && ina0);
    // BWithoutA:
    //      inc = (incb && !ina1) || (outa && inb1);
    //      out = (outb && !ina0) || (inca && inb0);
    let inc = false;
    let out = false;

    switch (booleanOperator) {
        case BooleanOperator.Union: {
            inc = !ina0 && !inb0 && (ina1 || inb1);
            out = !ina1 && !inb1 && (ina0 || inb0);
            break;
        }
        case BooleanOperator.Intersection: {
            inc = ina1 && inb1 && (!ina0 || !inb0);
            out = ina0 && inb0 && (!ina1 || !inb1);
            break;
        }
        case BooleanOperator.Exclusion: {
            inc = ina0 === inb0 && ina1 !== inb1;
            out = ina0 !== inb0 && ina1 === inb1;
            break;
        }
        case BooleanOperator.AWithoutB: {
            inc = ina1 && !inb1 && (!ina0 || inb0);
            out = ina0 && !inb0 && (!ina1 || inb1);
            break;
        }
        case BooleanOperator.BWithoutA: {
            inc = !ina1 && inb1 && (ina0 || !inb0);
            out = !ina0 && inb0 && (ina1 || !inb1);
            break;
        }
    }

    return [inc, out];
}
