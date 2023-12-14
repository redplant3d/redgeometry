import { COS_ACUTE } from "../core/path-options.js";
import { Bezier2Curve2, type Bezier3Curve2, type BezierRCurve2 } from "../primitives/bezier.js";

/**
 * Returns `true` if the conic satisfies `cosTolerance`.
 */
export function isSimpleQuad(c: Bezier2Curve2, cosTolerance: number): boolean {
    const v1 = c.p1.sub(c.p0);
    const v2 = c.p2.sub(c.p1);

    return v1.dot(v2) > cosTolerance * Math.sqrt(v1.lenSq() * v2.lenSq());
}

export function simplifyParameterStepQuad(c: Bezier2Curve2, m: number): number {
    const [qqa, qqb] = c.getDerivativeCoefficients();

    // m * (bx * bx + by * by) / (|ax * by - ay * bx| - m * (ax * bx + ay * by));
    return (m * qqb.lenSq()) / (Math.abs(qqa.cross(qqb)) - m * qqa.dot(qqb));
}

export function simplifyDistanceCubic(c: Bezier3Curve2): number {
    const v1 = c.p1.sub(c.p0);
    const v2 = c.p2.sub(c.p1);
    const v3 = c.p3.sub(c.p2);

    const v = v3.sub(v2).sub(v2).add(v1);

    return v.len();
}

export function simplifyParameterStepCubic(c: Bezier3Curve2, k: number, tolerance: number): number {
    const v1 = c.p1.sub(c.p0);
    const v2 = c.p2.sub(c.p1);
    const v3 = c.p3.sub(c.p2);

    const v = v3.sub(v2).sub(v2).add(v1);
    const tol = k * tolerance;

    // Smallest parameter step to satisfy tolerance condition
    return Math.pow((tol * tol) / v.lenSq(), 1 / 6);
}

/**
 * Returns `true` if the conic satisfies `simplifyTolerance`.
 *
 * Note: `simplifyTolerance` is expected to be premultiplied by `4`.
 */
export function isSimpleConic(c: BezierRCurve2, simplifyTolerance: number): boolean {
    const v1 = c.p1.sub(c.p0);
    const v2 = c.p2.sub(c.p1);

    return Math.abs(c.w - 1) * v2.sub(v1).len() < simplifyTolerance * (c.w + 1);
}

export function simplifyParameterStepConic(c: BezierRCurve2, k: number, tolerance: number): number {
    const v1 = c.p1.sub(c.p0);
    const v2 = c.p2.sub(c.p1);

    const v = v2.sub(v1);
    const tol = k * tolerance * (c.w + 1);

    // Smallest parameter step to satisfy tolerance condition
    return Math.pow(tol / (Math.abs(c.w - 1) * v.len()), 1 / 4);
}

export function simplifyCubicMidpoint(c: Bezier3Curve2): Bezier2Curve2 {
    // Not continuous at endpoints (midpoint interpolation)
    const pc1 = c.p0.lerp(c.p1, 1.5);
    const pc2 = c.p3.lerp(c.p2, 1.5);
    const pc = pc1.lerp(pc2, 0.5);

    return new Bezier2Curve2(c.p0, pc, c.p3);
}

export function simplifyCubicContinious(c: Bezier3Curve2): [Bezier2Curve2, Bezier2Curve2] {
    // Continuous at endpoints
    const pc1 = c.p0.lerp(c.p1, 0.75);
    const pc2 = c.p3.lerp(c.p2, 0.75);
    const pm = pc1.lerp(pc2, 0.5);

    const c1 = new Bezier2Curve2(c.p0, pc1, pm);
    const c2 = new Bezier2Curve2(pm, pc2, c.p3);

    return [c1, c2];
}

export function simplifyConic(c: BezierRCurve2): Bezier2Curve2 {
    return new Bezier2Curve2(c.p0, c.p1, c.p2);
}

export function isDegenerateQuad(c0: Bezier2Curve2): boolean {
    const v1 = c0.p1.sub(c0.p0);
    const v2 = c0.p2.sub(c0.p1);

    // Check if angle is too sharp
    return v1.dot(v2) < COS_ACUTE * Math.sqrt(v1.lenSq() * v2.lenSq());
}
