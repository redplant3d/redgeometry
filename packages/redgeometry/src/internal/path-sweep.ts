import type { BooleanOperator } from "../core/path-options.ts";
import type { EdgeSegment2, SnapRound2 } from "../core/snapround.ts";
import { Vector2, type ReadonlyVector2 } from "../primitives/vector.ts";
import { log } from "../utility/debug.ts";

export class PathSweepEvent2 {
    public left: boolean;
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;
    public seg: EdgeSegment2;
    public wind: number;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2, seg: EdgeSegment2, wind: number, left: boolean) {
        this.p0 = p0;
        this.p1 = p1;
        this.seg = seg;
        this.wind = wind;
        this.left = left;
    }

    public static compareQueue(this: void, ev1: PathSweepEvent2, ev2: PathSweepEvent2): number {
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
            return Vector2.signedArea(ev1.p1, ev1.p0, ev2.p1);
        } else {
            // Same right point
            return Vector2.signedArea(ev1.p0, ev1.p1, ev2.p1);
        }
    }

    public static compareStatus(this: void, ev1: PathSweepEvent2, ev2: PathSweepEvent2): number {
        // `result < 0` -> `e1 < e2`
        // `result > 0` -> `e2 < e1`
        if (ev1.p0.eq(ev2.p0)) {
            if (ev1.p1.eq(ev2.p1)) {
                // Segments are equal
                return 0;
            } else {
                // Same left point
                return Vector2.signedArea(ev1.p1, ev1.p0, ev2.p1);
            }
        } else {
            if (PathSweepEvent2.compareQueue(ev1, ev2) < 0) {
                // `e1` is left of `e2`
                return Vector2.signedArea(ev1.p1, ev1.p0, ev2.p0);
            } else {
                // `e2` is left of `e1`
                return Vector2.signedArea(ev2.p0, ev2.p1, ev1.p0);
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
            this.wind,
        );
    }
}

export function createSweepEventQueue(snapRound: SnapRound2): PathSweepEvent2[] {
    snapRound.process();

    log.assertFnDebug(() => snapRound.validate(), "PathClip2: Validation failed");

    const edgeSegments: EdgeSegment2[] = [];
    snapRound.writeEdgeSegmentsTo(edgeSegments);

    const queue: PathSweepEvent2[] = [];

    for (const seg of edgeSegments) {
        // Fetch points, weight becomes winding
        const wind = seg.ref.weight;
        const p0 = seg.p0;
        const p1 = seg.p1;

        if (p0.eq(p1)) {
            // Ignore empty edges
            continue;
        }

        if (p0.x !== p1.x ? p0.x < p1.x : p0.y < p1.y) {
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

export function isIncOutBoolean(
    in1a: boolean,
    in2a: boolean,
    in1b: boolean,
    in2b: boolean,
    booleanOperator: BooleanOperator,
): [boolean, boolean] {
    // Incoming & outgoing:
    //      inca = !in1a && in2a;
    //      outa = in1a && !in2a;
    //      incb = !in1b && in2b;
    //      outb = in1b && !in2b;
    // Union:
    //      inc = (inca && !in1b) || (incb && !in1a);
    //      out = (outa && !in2b) || (outb && !in2a);
    // Intersection:
    //      inc = (inca && in2b) || (incb && in2a);
    //      out = (outa && in1b) || (outb && in1a);
    // Exclusion:
    //      inc = (inca && !in1b && !in2b) || (outb && in1a && in2a) ||
    //          (incb && !in1a && !in2a) || (outa && in1b && in2b);
    //      isOut = (outa && !in1b && !in2b) || (incb && in1a && in2a) ||
    //          (outb && !in1a && !in2a) || (inca && in1b && in2b);
    // AWithoutB:
    //      inc = (inca && !in2b) || (outb && in2a);
    //      out = (outa && !in1b) || (incb && in1a);
    // BWithoutA:
    //      inc = (incb && !in2a) || (outa && in2b);
    //      out = (outb && !in1a) || (inca && in1b);
    let inc = false;
    let out = false;

    switch (booleanOperator) {
        case 0 /* UNION */: {
            inc = !in1a && !in1b && (in2a || in2b);
            out = !in2a && !in2b && (in1a || in1b);
            break;
        }
        case 1 /* INTERSECTION */: {
            inc = in2a && in2b && (!in1a || !in1b);
            out = in1a && in1b && (!in2a || !in2b);
            break;
        }
        case 2 /* EXCLUSION */: {
            inc = in1a === in1b && in2a !== in2b;
            out = in1a !== in1b && in2a === in2b;
            break;
        }
        case 3 /* A_WITHOUT_B */: {
            inc = in2a && !in2b && (!in1a || in1b);
            out = in1a && !in1b && (!in2a || in2b);
            break;
        }
        case 4 /* B_WITHOUT_A */: {
            inc = !in2a && in2b && (in1a || !in1b);
            out = !in1a && in1b && (in2a || !in2b);
            break;
        }
    }

    return [inc, out];
}
