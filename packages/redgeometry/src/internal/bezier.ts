import type { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierCurve2, BezierRCurve2 } from "../primitives/bezier.js";
import type { Box2 } from "../primitives/box.js";
import { Point2, type Point3 } from "../primitives/point.js";
import { Vector2, type Vector3 } from "../primitives/vector.js";
import { log } from "../utility/debug.js";
import { Interval } from "../utility/interval.js";
import { lerp } from "../utility/scalar.js";
import { RootType, solveCubic, solveQuadratic } from "../utility/solve.js";

export function encloseCurveAt(c: BezierCurve2, box: Box2, t: number): void {
    if (t > 0 && t < 1) {
        box.enclose(c.getValueAt(t));
    }
}

export function minimizeCurveDistanceAt(
    c: BezierCurve2,
    p: Point2,
    t: number,
    min: { param: number; distSq: number },
): void {
    if (t > 0 && t < 1) {
        const distSq = c.getValueAt(t).sub(p).lenSq();

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
    output: Point2[],
): void {
    const eps = 2 ** -50;

    if (!ii.intersects(i1)) {
        // Divergent
        return;
    }

    const iiNext = ii.clamp(i1.a, i1.b);

    log.infoDebug("Intersection candidate: [{}, {}]", iiNext.a, iiNext.b);

    if (iiNext.diameter() < eps) {
        log.infoDebug("Intersection found at t = {} (Diam: {})", iiNext.mid(), iiNext.diameter());

        output.push(c1.getValueAt(iiNext.mid()));
    } else {
        getIntersectionQuadQuad(c2, i2, c1, iiNext, output);
    }
}

export function getIntersectionQuadQuad(
    c1: Bezier2Curve2,
    i1: Interval,
    c2: Bezier2Curve2,
    i2: Interval,
    output: Point2[],
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

export function getArcLengthQuadratic(c: Bezier2Curve2): number {
    let sum = 0;

    const [qqa, qqb] = c.getDerivativeCoefficients();

    // Weights and abscissae for `n = 4`
    sum += sampleArcLengthQuadratic(0.1739274225687269, 0.06943184420297371, qqa, qqb);
    sum += sampleArcLengthQuadratic(0.3260725774312731, 0.3300094782075719, qqa, qqb);
    sum += sampleArcLengthQuadratic(0.3260725774312731, 0.6699905217924281, qqa, qqb);
    sum += sampleArcLengthQuadratic(0.1739274225687269, 0.9305681557970263, qqa, qqb);

    return sum;
}

export function getArcLengthCubic(c: Bezier3Curve2): number {
    let sum = 0;

    const [qqa, qqb, qqc] = c.getDerivativeCoefficients();

    // Weights and abscissae for `n = 8`
    sum += sampleArcLengthCubic(0.05061426814518813, 0.01985507175123188, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.1111905172266872, 0.1016667612931866, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.1568533229389436, 0.2372337950418355, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.181341891689181, 0.4082826787521751, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.181341891689181, 0.5917173212478249, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.1568533229389436, 0.7627662049581645, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.1111905172266872, 0.8983332387068134, qqa, qqb, qqc);
    sum += sampleArcLengthCubic(0.05061426814518813, 0.9801449282487681, qqa, qqb, qqc);

    return sum;
}

export function getArcLengthConic(c: BezierRCurve2): number {
    let sum = 0;

    const [qqa, qqb, qqc] = c.getDerivativeCoefficients();

    // Weights and abscissae for `n = 8`
    sum += sampleArcLengthConic(0.05061426814518813, 0.01985507175123188, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.1111905172266872, 0.1016667612931866, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.1568533229389436, 0.2372337950418355, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.181341891689181, 0.4082826787521751, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.181341891689181, 0.5917173212478249, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.1568533229389436, 0.7627662049581645, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.1111905172266872, 0.8983332387068134, qqa, qqb, qqc);
    sum += sampleArcLengthConic(0.05061426814518813, 0.9801449282487681, qqa, qqb, qqc);

    return sum;
}

export function getParameterAtArcLengthQuadratic(c: Bezier2Curve2, d: number): number {
    const d1 = c.p1.sub(c.p0).len();
    const d2 = c.p2.sub(c.p1).len();

    const r = solveQuadratic(d2 - d1, d1, -d);

    if (r.type === RootType.Two) {
        return r.x1;
    } else {
        // Fallback
        return 1;
    }
}

export function getParameterAtArcLengthCubic(c: Bezier3Curve2, d: number): number {
    const d1 = c.p1.sub(c.p0).len();
    const d2 = c.p2.sub(c.p1).len();
    const d3 = c.p2.sub(c.p1).len();

    const r = solveCubic(d3 - 2 * d2 + d1, d2 - d1, d1, -d);

    if (r.type === RootType.Three) {
        return r.x1;
    } else {
        return r.x;
    }
}

export function getParameterAtArcLengthConic(c: BezierRCurve2, d: number): number {
    const d1 = c.p1.sub(c.p0).len();
    const d2 = c.p2.sub(c.p1).len();
    const dw = c.w * d1;

    const r = solveQuadratic(d2 - 2 * dw - d1, dw, -d);

    if (r.type === RootType.Two) {
        return r.x1;
    } else {
        // Fallback
        return 1;
    }
}

function sampleArcLengthQuadratic(wz: number, xz: number, qqa: Vector2, qqb: Vector2): number {
    const v = qqa.mul(xz).add(qqb);
    return wz * v.len();
}

function sampleArcLengthCubic(wz: number, xz: number, qqa: Vector2, qqb: Vector2, qqc: Vector2): number {
    const v = qqa.mul(xz).add(qqb).mul(xz).add(qqc);
    return wz * v.len();
}

function sampleArcLengthConic(wz: number, xz: number, qqa: Vector3, qqb: Vector3, qqc: Point3): number {
    const vv = qqa.mul(xz).add(qqb).mul(xz).addPt(qqc);
    const v = Vector2.fromXYW(vv.x, vv.y, vv.z * vv.z);
    return wz * v.len();
}
