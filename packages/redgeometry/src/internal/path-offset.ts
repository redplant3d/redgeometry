import { COS_ACUTE, COS_OBTUSE, JoinType } from "../core/path-options.js";
import type { Path2 } from "../core/path.js";
import { Bezier2Curve2, BezierRCurve2 } from "../primitives/bezier.js";
import type { Point2 } from "../primitives/point.js";
import type { Vector2 } from "../primitives/vector.js";
import { assertUnreachable } from "../utility/debug.js";

export function offsetQuadraticSimple(path: Path2, c: Bezier2Curve2, d: number): void {
    // Possible null vector (curve is a point)
    let v1 = c.getTangentStart();
    let v2 = c.getTangentEnd();

    if (!v1.isZero()) {
        v1 = v1.unit().normal();
        v2 = v2.unit().normal();

        v1 = v1.add(v2);

        v1 = v1.mulS(2 * d).divS(v1.lenSq());
        v2 = v2.mulS(d);

        path.quadTo(c.p1.addV(v1), c.p2.addV(v2));
    }
}

export function offsetQuadraticDegenerate(path: Path2, p0: Point2, p1: Point2, p2: Point2, d: number): void {
    const c1 = new Bezier2Curve2(p0, p1, p1);
    const c2 = new Bezier2Curve2(p1, p1, p2);

    const n0 = p1.sub(p0).unit().normal();
    const n1 = p2.sub(p1).unit().normal();

    offsetQuadraticSimple(path, c1, d);
    insertOuterJoin(path, p1, n0, n1, d, 0, JoinType.Round);
    offsetQuadraticSimple(path, c2, d);
}

export function insertOffsetJoin(
    path: Path2,
    p: Point2,
    m0: Vector2,
    m1: Vector2,
    d: number,
    ml: number,
    join: JoinType,
): void {
    const n0 = m0.unit().normal();
    const n1 = m1.unit().normal();

    // Check if join is not too flat
    if (n0.dot(n1) < COS_OBTUSE) {
        if (d * n0.cross(n1) >= 0) {
            insertOuterJoin(path, p, n0, n1, d, ml, join);
        } else {
            insertInnerJoin(path, p, n1, d);
        }
    }
}

export function insertOuterJoin(
    path: Path2,
    p: Point2,
    n0: Vector2,
    n1: Vector2,
    d: number,
    ml: number,
    join: JoinType,
): void {
    const mld = ml * Math.abs(d);

    switch (join) {
        case JoinType.Bevel: {
            path.lineTo(p.addVMulS(n1, d));

            break;
        }
        case JoinType.Miter: {
            let k = n0.add(n1);

            k = k.mulS(2 * d).divS(k.lenSq());

            if (k.lenSq() <= mld * mld) {
                path.lineTo(p.addV(k));
            }

            path.lineTo(p.addVMulS(n1, d));

            break;
        }
        case JoinType.MiterClip: {
            let k = n0.add(n1);

            k = k.mulS(2 * d).divS(k.lenSq());

            const pp0 = p.addVMulS(n0, d);
            const pp2 = p.addVMulS(n1, d);

            if (k.lenSq() <= mld * mld) {
                // Same as miter join
                path.lineTo(p.addV(k));
            } else if (n0.dot(n1) <= COS_ACUTE) {
                // Join is too sharp ('k' is approaching infinity)
                path.lineTo(pp0.addVMulS(n0.normal(), -mld));
                path.lineTo(pp2.addVMulS(n1.normal(), mld));
            } else {
                const kov = k.dot(p.sub(pp0));
                const kok = k.dot(k);

                const t = (kov + mld * Math.sqrt(kok)) / (kov + kok);

                // Fall back to bevel otherwise
                if (t > 0) {
                    const pp1 = p.addV(k);

                    path.lineTo(pp0.lerp(pp1, t));
                    path.lineTo(pp2.lerp(pp1, t));
                }
            }

            path.lineTo(pp2);

            break;
        }
        case JoinType.Round: {
            const pp0 = p.addVMulS(n0, d);
            const pp2 = p.addVMulS(n1, d);

            if (n0.dot(n1) < 0) {
                // Obtuse angle (2 segments)
                const nm = pp2.sub(pp0).unitOrZero().normal();

                let k = n0.add(nm);

                k = k.mulS(2 * d).divS(k.lenSq());

                const pc1 = p.addV(k);
                const pp1 = p.addVMulS(nm, d);
                const pc2 = pc1.lerp(pp1, 2);

                const w = BezierRCurve2.getWeightFromVectors(p, pc1, pp1);

                path.conicTo(pc1, pp1, w);
                path.conicTo(pc2, pp2, w);
            } else {
                // Acute angle (1 segment)
                let k = n0.add(n1);

                k = k.mulS(2 * d).divS(k.lenSq());

                const pc = p.addV(k);

                const w = BezierRCurve2.getWeightFromVectors(p, pc, pp2);

                path.conicTo(pc, pp2, w);
            }

            break;
        }
        default: {
            assertUnreachable(join);
        }
    }
}

export function insertInnerJoin(path: Path2, p: Point2, n1: Vector2, d: number): void {
    // Go back to the point of the base path to fix some offset artifacts (basically a hack)
    path.lineTo(p);

    // Bevel join
    path.lineTo(p.addVMulS(n1, d));
}
