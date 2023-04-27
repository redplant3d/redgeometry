import { BezierCurve2, CurveType, Edge2, Point2 } from "../primitives";
import { ArrayMultiSet, Float128, assertDebug, log, solveLinear } from "../utility";

enum PixelType {
    Magnet,
    Pin,
}

type Pixel2 = {
    type: PixelType;
    p: Point2;
};

class PixelSet2 {
    private pixel: Map<string, Pixel2>;

    public constructor() {
        this.pixel = new Map<string, Pixel2>();
    }

    public addMagnet(p: Point2): void {
        const key = p.toString();

        // Magnets may overwrite pins
        this.pixel.set(key, { type: PixelType.Magnet, p });
    }

    public addPin(p: Point2): void {
        const key = p.toString();

        // Pins must not overwrite magnets
        if (!this.pixel.has(key)) {
            this.pixel.set(key, { type: PixelType.Pin, p });
        }
    }

    public clear(): void {
        this.pixel.clear();
    }

    public getMagnets(): Point2[] {
        const result: Point2[] = [];

        for (const pixel of this.pixel.values()) {
            if (pixel.type === PixelType.Magnet) {
                result.push(pixel.p);
            }
        }

        return result;
    }

    public getPins(): Point2[] {
        const result: Point2[] = [];

        for (const pixel of this.pixel.values()) {
            if (pixel.type === PixelType.Pin) {
                result.push(pixel.p);
            }
        }

        return result;
    }

    public getValues(): IterableIterator<Pixel2> {
        return this.pixel.values();
    }
}

type PixelIntersection2 = {
    p: Point2;
    min: number;
    max: number;
};

export type EdgeSegmentRef2 = {
    data: unknown;
    set: number;
    weight: number;
};

export type EdgeSegment2 = {
    p0: Point2;
    p1: Point2;
    ref: EdgeSegmentRef2;
};

export class SnapRoundSweepEvent2 {
    public key: number;
    public left: boolean;
    public p0: Point2;
    public p1: Point2;
    public seg: EdgeSegment2;

    constructor(p0: Point2, p1: Point2, seg: EdgeSegment2, key: number, left: boolean) {
        this.p0 = p0;
        this.p1 = p1;
        this.seg = seg;
        this.key = key;
        this.left = left;
    }

    public static compareQueue(e1: SnapRoundSweepEvent2, e2: SnapRoundSweepEvent2): number {
        // result < 0 -> e1 < e2
        // result > 0 -> e2 < e1
        if (e1.p0.x !== e2.p0.x) {
            // Sort by `x`
            return e1.p0.x - e2.p0.x;
        } else if (e1.p0.y !== e2.p0.y) {
            // Same `x`, sort by `y`
            return e1.p0.y - e2.p0.y;
        } else if (e1.left !== e2.left) {
            // Same `y`, sort `!left` before `left`
            return e1.left ? 1 : -1;
        } else {
            return 0;
        }
    }

    public static compareStatus(e1: SnapRoundSweepEvent2, e2: SnapRoundSweepEvent2): number {
        // Just sort by key
        return e1.key - e2.key;
    }
}

/**
 * Line intersection with snap rounding.
 *
 * References:
 * - John Hershberger.
 *   *Stable snap rounding*.
 *   Computational Geometry 46 (2013) 403–416.
 */
export class SnapRound2 {
    private inputSegments: EdgeSegment2[];
    private intersections: Point2[];
    private magnets: Point2[];
    private outputSegments: EdgeSegment2[];
    private pins: Point2[];
    private pixelSet: PixelSet2;

    public precision: number;

    constructor() {
        this.precision = 2 ** 16;

        this.inputSegments = [];
        this.intersections = [];
        this.magnets = [];
        this.outputSegments = [];
        this.pins = [];

        this.pixelSet = new PixelSet2();
    }

    public addSegment(c: BezierCurve2, set: number, weight: number, snap: boolean, data: unknown): void {
        log.assertFn(() => c.isFinite(), "SnapRound2: BezierCurve2 is not finite");

        if (c.type !== CurveType.Bezier1) {
            log.warn("SnapRound2: Not implemented yet");
        }

        const k = this.precision;
        const p0 = this.addEndpoint(c.p0, k, snap);
        const p1 = this.addEndpoint(c.pn, k, snap);
        const ref = { set, weight, data };

        this.inputSegments.push({ p0, p1, ref });
    }

    public clear(): void {
        this.pixelSet.clear();

        this.inputSegments = [];
        this.intersections = [];
        this.magnets = [];
        this.outputSegments = [];
        this.pins = [];
    }

    public debugGetErrors(): Point2[] {
        return this.createIntersections(this.outputSegments);
    }

    public debugGetInputSegments(): EdgeSegment2[] {
        return this.inputSegments.slice();
    }

    public debugGetIntersections(): Point2[] {
        return this.intersections.slice();
    }

    public debugGetMagnets(): Point2[] {
        return this.magnets.slice();
    }

    public debugGetOutputSegments(): EdgeSegment2[] {
        return this.outputSegments.slice();
    }

    public debugGetPins(): Point2[] {
        return this.pins.slice();
    }

    public process(): void {
        this.intersections = this.createIntersections(this.inputSegments);

        for (const intersection of this.intersections) {
            const p = roundPoint(intersection);
            this.pixelSet.addMagnet(p);
        }

        this.magnets = this.pixelSet.getMagnets();
        this.pins = this.pixelSet.getPins();

        this.intersectEdges(this.magnets, this.pins);
    }

    public validate(): boolean {
        return this.debugGetErrors().length === 0;
    }

    public writeEdgeSegmentsTo(output: EdgeSegment2[]): void {
        const k = this.precision;

        for (const segment of this.outputSegments) {
            const p0 = new Point2(segment.p0.x / k, segment.p0.y / k);
            const p1 = new Point2(segment.p1.x / k, segment.p1.y / k);
            const ref = segment.ref;

            output.push({ p0, p1, ref });
        }
    }

    public writeEdges(output: Edge2[]): void {
        const k = this.precision;

        for (const segment of this.outputSegments) {
            const p0 = new Point2(segment.p0.x / k, segment.p0.y / k);
            const p1 = new Point2(segment.p1.x / k, segment.p1.y / k);

            output.push(new Edge2(p0, p1));
        }
    }

    private static signedArea(p0: Point2, p1: Point2, p: Point2): number {
        const x0 = Float128.from(p0.x);
        const y0 = Float128.from(p0.y);
        const x1 = Float128.from(p1.x);
        const y1 = Float128.from(p1.y);
        const x = Float128.from(p.x);
        const y = Float128.from(p.y);

        const v1x = x1.sub(x0);
        const v1y = y1.sub(y0);
        const v2x = x.sub(x0);
        const v2y = y.sub(y0);

        const va = v1x.mul(v2y);
        const vb = v1y.mul(v2x);

        return va.sub(vb).value;
    }

    private addEndpoint(p: Point2, k: number, snap: boolean): Point2 {
        // Note: `snap` demotes `p` to a magnet (useful when lines should perfectly
        // overlap but actually do not because of floating point precision)
        const scaled = new Point2(k * p.x, k * p.y);
        const snapped = roundPoint(scaled);

        if (this.isPin(snapped, p, k) && !snap) {
            // Snap pin to grid and return snapped
            this.pixelSet.addPin(snapped);
            return snapped;
        } else {
            // Snap magnet to grid and return scaled
            this.pixelSet.addMagnet(snapped);
            return scaled;
        }
    }

    private addSegmentCandidate(ur: EdgeSegment2, p0: Point2, p1: Point2, pins: Point2[]): void {
        if (p0.eq(p1)) {
            return;
        }

        const pinIntersections = this.getPixelIntersections(p0, p1, pins);

        this.sortByParameter(pinIntersections);

        let p = p0;

        for (const pi of pinIntersections) {
            // Check if the ursegment is on the same side as the rounded segment
            const a1 = Point2.signedArea(ur.p0, ur.p1, pi.p);
            const a2 = Point2.signedArea(p0, p1, pi.p);

            if (a1 * a2 <= 0) {
                this.addSegmentOutput(p, pi.p, ur.ref);
                p = pi.p;
            }
        }

        // Final segment
        this.addSegmentOutput(p, p1, ur.ref);
    }

    private addSegmentOutput(p0: Point2, p1: Point2, ref: EdgeSegmentRef2): void {
        if (!p0.eq(p1)) {
            this.outputSegments.push({ p0, p1, ref });
        }
    }

    private createIntersections(segments: EdgeSegment2[]): Point2[] {
        const intersections: Point2[] = [];

        const queue = this.createQueue(segments);
        const status = new ArrayMultiSet<SnapRoundSweepEvent2>(SnapRoundSweepEvent2.compareStatus);

        for (const qe of queue.values) {
            if (qe.left) {
                // Try to intersect `qe` against all segments within the sweepline
                for (const se of status.values) {
                    this.writeSegmentIntersectionsTo(qe.seg, se.seg, intersections);
                }

                // Add to sweepline
                status.insert(qe);
            } else {
                // Remove from sweepline
                const success = status.remove(qe);

                assertDebug(success, "SnapRound2: Status event not found\n{}", qe.seg);
            }
        }

        return intersections;
    }

    private createQueue(segments: EdgeSegment2[]): ArrayMultiSet<SnapRoundSweepEvent2> {
        const events: SnapRoundSweepEvent2[] = [];

        for (let i = 0; i < segments.length; i++) {
            const s = segments[i];

            if (s.p0.eq(s.p1)) {
                // Ignore empty edges
                continue;
            }

            if (s.p0.lt(s.p1)) {
                events.push(new SnapRoundSweepEvent2(s.p0, s.p1, s, i, true));
                events.push(new SnapRoundSweepEvent2(s.p1, s.p0, s, i, false));
            } else {
                events.push(new SnapRoundSweepEvent2(s.p1, s.p0, s, i, true));
                events.push(new SnapRoundSweepEvent2(s.p0, s.p1, s, i, false));
            }
        }

        return ArrayMultiSet.fromArray(events, SnapRoundSweepEvent2.compareQueue);
    }

    private getPixelIntersections(p0: Point2, p1: Point2, pixel: Point2[]): PixelIntersection2[] {
        const result: PixelIntersection2[] = [];

        for (const p of pixel) {
            if (p.eq(p0) || p.eq(p1)) {
                // Skip if pixel is an endpoint
                continue;
            }

            const parameter = intersectSegmentWithPixel(p0, p1, p);

            if (parameter !== undefined) {
                const [min, max] = parameter;
                result.push({ p, min, max });
            }
        }

        return result;
    }

    private intersectEdges(magnets: Point2[], pins: Point2[]): void {
        for (const ur of this.inputSegments) {
            const p0 = roundPoint(ur.p0);
            const p1 = roundPoint(ur.p1);

            if (p0.eq(p1)) {
                // Allow this case to avoid empty pins
                this.outputSegments.push({ p0, p1, ref: ur.ref });
                continue;
            }

            // Get intersections and sort by parameter
            const magnetIntersections = this.getPixelIntersections(ur.p0, ur.p1, magnets);

            this.sortByParameter(magnetIntersections);

            let p = p0;

            for (const mi of magnetIntersections) {
                this.addSegmentCandidate(ur, p, mi.p, pins);

                // Advance to next magnet
                p = mi.p;
            }

            // Final segment
            this.addSegmentCandidate(ur, p, p1, pins);
        }
    }

    private isPin(snapped: Point2, p: Point2, k: number): boolean {
        // Check if the input point `p` would be transformed to a pin in the output
        return snapped.x / k === p.x && snapped.y / k === p.y;
    }

    private sortByParameter(intersections: PixelIntersection2[]): void {
        intersections.sort((i1, i2) => {
            if (i1.min !== i2.min) {
                return i1.min - i2.min;
            } else {
                if (i1.max === i2.max) {
                    log.error("Max parameter values are equal");
                }
                return i1.max - i2.max;
            }
        });
    }

    private writeSegmentIntersectionsTo(s1: EdgeSegment2, s2: EdgeSegment2, output: Point2[]): void {
        if (s1.p0.eq(s2.p0) || s1.p0.eq(s2.p1) || s1.p1.eq(s2.p0) || s1.p1.eq(s2.p1)) {
            // No intersection because segments are adjacent
            return;
        }

        const a10 = Point2.signedArea(s2.p0, s2.p1, s1.p0);
        const a11 = Point2.signedArea(s2.p0, s2.p1, s1.p1);
        const t = solveLinear(a11 - a10, a10);

        if (t < 0 || t > 1 || Number.isNaN(t)) {
            return;
        }

        const a20 = Point2.signedArea(s1.p0, s1.p1, s2.p0);
        const a21 = Point2.signedArea(s1.p0, s1.p1, s2.p1);
        const u = solveLinear(a21 - a20, a20);

        if (u < 0 || u > 1 || Number.isNaN(u)) {
            return;
        }

        const p0 = s1.p0.lerp(s1.p1, t);
        const p1 = s2.p0.lerp(s2.p1, u);

        output.push(p0.lerp(p1, 0.5));
    }
}

export function intersectSegmentWithPixel(p0: Point2, p1: Point2, p: Point2): [number, number] | undefined {
    // Pixel bounds
    const x0 = p.x - 0.5;
    const y0 = p.y - 0.5;
    const x1 = p.x + 0.5;
    const y1 = p.y + 0.5;

    if ((p0.x < x0 && p1.x < x0) || (p0.y < y0 && p1.y < y0) || (p0.x > x1 && p1.x > x1) || (p0.y > y1 && p1.y > y1)) {
        // Quick reject: Both points on the same side of pixel (while not touching)
        return undefined;
    }

    // Slab method
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    let t0x = (x0 - p0.x) / dx;
    let t1x = (x1 - p0.x) / dx;
    let t0y = (y0 - p0.y) / dy;
    let t1y = (y1 - p0.y) / dy;

    if (dx === 0) {
        if (p0.x === x1) {
            return undefined;
        }

        t0x = t0y;
        t1x = t1y;
    }

    if (dy === 0) {
        if (p0.y === y1) {
            return undefined;
        }

        t0y = t0x;
        t1y = t1x;
    }

    const min = Math.max(Math.min(t0x, t1x), Math.min(t0y, t1y));
    const max = Math.min(Math.max(t0x, t1x), Math.max(t0y, t1y));

    let result: [number, number] | undefined = undefined;

    if (min === max) {
        // Intersection on corner points
        const p = p0.lerp(p1, min);

        // Only accept left bottom corner
        if (p.x === x0 && p.y === y0) {
            result = [min, max];
        }
    } else if (min < max) {
        if (min >= 0 && min <= 1) {
            result = [min, max];
        } else if (max >= 0 && max <= 1) {
            // Include min as tiebreaker
            result = [max, min];
        }
    }

    return result;
}

function roundPoint(p: Point2): Point2 {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    return new Point2(x, y);
}
