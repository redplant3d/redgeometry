import { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierCurve2, BezierRCurve2, Box2, Point2 } from "../primitives";
import { Interval, lerp, log, RootType, solveQuadratic } from "../utility";

export function encloseCurveAt(c: BezierCurve2, box: Box2, t: number): void {
    if (t > 0 && t < 1) {
        box.enclose(c.getValueAt(t));
    }
}

export function minimizeCurveDistanceAt(
    c: BezierCurve2,
    p: Point2,
    t: number,
    min: { param: number; distSq: number }
): void {
    if (t > 0 && t < 1) {
        const distSq = c.getValueAt(t).sub(p).lengthSq;

        if (distSq < min.distSq) {
            min.param = t;
            min.distSq = distSq;
        }
    }
}

export function getWindingAtParameterLinear(c: Bezier1Curve2, t: number, px: number): number {
    if (t < 0 || t > 1) {
        return 0;
    }

    const x = lerp(c.p0.x, c.p1.x, t);
    const yy = c.p0.y - c.p1.y;

    return getWinding(px, x, yy);
}

export function getWindingAtParameterQuadratic(c: Bezier2Curve2, t: number, px: number): number {
    if (t < 0 || t > 1) {
        return 0;
    }

    const p01 = c.p0.lerp(c.p1, t);
    const p12 = c.p1.lerp(c.p2, t);

    const x = lerp(p01.x, p12.x, t);
    const yy = p01.y - p12.y;

    return getWinding(px, x, yy);
}

export function getWindingAtParameterCubic(c: Bezier3Curve2, t: number, px: number): number {
    if (t < 0 || t > 1) {
        return 0;
    }

    const p01 = c.p0.lerp(c.p1, t);
    const p12 = c.p1.lerp(c.p2, t);
    const p23 = c.p2.lerp(c.p3, t);

    const p012 = p01.lerp(p12, t);
    const p123 = p12.lerp(p23, t);

    const x = lerp(p012.x, p123.x, t);
    const yy = p012.y - p123.y;

    return getWinding(px, x, yy);
}

export function getWindingAtParameterConic(c: BezierRCurve2, t: number, px: number): number {
    if (t < 0 || t > 1) {
        return 0;
    }

    const [p0, p1, p2] = c.getProjectivePoints();

    const p01 = p0.lerp(p1, t);
    const p12 = p1.lerp(p2, t);

    const p012 = p01.lerp(p12, t);

    // Derivative of `y` is calculated with quotient rule (denominator may be omitted)
    const x = p012.x / p012.z;
    const yy = p012.y * (p12.z - p01.z) - p012.z * (p12.y - p01.y);

    return getWinding(px, x, yy);
}

export function getWinding(px: number, x: number, yy: number): number {
    if (px < x || yy === 0) {
        return 0;
    } else if (yy < 0) {
        return -1;
    } else {
        return 1;
    }
}

export function checkIntervalQuadQuad(
    c1: Bezier2Curve2,
    i1: Interval,
    c2: Bezier2Curve2,
    i2: Interval,
    ii: Interval,
    output: Point2[]
): void {
    const eps = 2 ** -50;

    if (!ii.intersects(i1)) {
        // Divergent
        return;
    }

    ii = ii.clamp(i1.a, i1.b);

    log.infoDebug("Intersection candidate: [{}, {}]", ii.a, ii.b);

    if (ii.diameter < eps) {
        const mid = ii.mid;
        log.infoDebug("Intersection found at t = {} (Diam: {})", mid, ii.diameter);
        output.push(c1.getValueAt(ii.mid));
    } else {
        getIntersectionQuadQuad(c2, i2, c1, ii, output);
    }
}

export function getIntersectionQuadQuad(
    c1: Bezier2Curve2,
    i1: Interval,
    c2: Bezier2Curve2,
    i2: Interval,
    output: Point2[]
): void {
    // 'c1' is the curve part, 'c2' is the line part
    const cc2 = c2.splitBetween(i2.a, i2.b);

    const d = 0.5 * Point2.signedArea(cc2.p0, cc2.p2, cc2.p1);

    const a0 = Point2.signedArea(cc2.p0, cc2.p2, c1.p0);
    const a1 = Point2.signedArea(cc2.p0, cc2.p2, c1.p1);
    const a2 = Point2.signedArea(cc2.p0, cc2.p2, c1.p2);

    const v1 = a1 - a0;
    const v2 = a2 - a1;

    const dmin = Math.min(0, d);
    const dmax = Math.max(0, d);

    const rmin = solveQuadratic(v2 - v1, v1, a0 - dmin);
    const rmax = solveQuadratic(v2 - v1, v1, a0 - dmax);

    if (rmin.type === RootType.Two && rmax.type === RootType.Two) {
        const ii1 = Interval.fromUnordered(rmin.x1, rmax.x1);
        const ii2 = Interval.fromUnordered(rmin.x2, rmax.x2);

        checkIntervalQuadQuad(c1, i1, c2, i2, ii1, output);
        checkIntervalQuadQuad(c1, i1, c2, i2, ii2, output);
    } else if (rmin.type === RootType.Two) {
        const ii = Interval.fromUnordered(rmin.x1, rmin.x2);

        checkIntervalQuadQuad(c1, i1, c2, i2, ii, output);
    } else if (rmax.type === RootType.Two) {
        const ii = Interval.fromUnordered(rmax.x1, rmax.x2);

        checkIntervalQuadQuad(c1, i1, c2, i2, ii, output);
    }
}
