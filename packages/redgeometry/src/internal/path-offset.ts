import { COS_ACUTE, COS_OBTUSE, JoinType } from "../core/path-options.js";
import type { Path2 } from "../core/path.js";
import { Bezier2Curve2, BezierRCurve2, type ReadonlyBezier2Curve2 } from "../primitives/bezier.js";
import type { ReadonlyVector2 } from "../primitives/vector.js";
import { assertUnreachable } from "../utility/debug.js";

export function offsetQuadraticSimple(path: Path2, c: ReadonlyBezier2Curve2, d: number): void {
    // Possible null vector (curve is a point)
    let v1 = c.getTangentStart();
    let v2 = c.getTangentEnd();

    if (!v1.isZero()) {
        v1 = v1.unit().normal();
        v2 = v2.unit().normal();

        v1 = v1.add(v2);

        v1 = v1.mulS(2 * d).divS(v1.lengthSquared());
        v2 = v2.mulS(d);

        path.quadTo(c.p1.add(v1), c.p2.add(v2));
    }
}

export function offsetQuadraticDegenerate(
    path: Path2,
    p0: ReadonlyVector2,
    p1: ReadonlyVector2,
    p2: ReadonlyVector2,
    d: number,
): void {
    const c1 = new Bezier2Curve2(p0, p1, p1);
    const c2 = new Bezier2Curve2(p1, p1, p2);

    const n0 = p1.sub(p0).unit().normal();
    const n1 = p2.sub(p1).unit().normal();

    offsetQuadraticSimple(path, c1, d);
    insertOuterJoin(path, p1, n0, n1, d, 0, JoinType.ROUND);
    offsetQuadraticSimple(path, c2, d);
}

export function insertOffsetJoin(
    path: Path2,
    p: ReadonlyVector2,
    m0: ReadonlyVector2,
    m1: ReadonlyVector2,
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
    p: ReadonlyVector2,
    n0: ReadonlyVector2,
    n1: ReadonlyVector2,
    d: number,
    ml: number,
    join: JoinType,
): void {
    const mld = ml * Math.abs(d);

    switch (join) {
        case 0 /* BEVEL */: {
            path.lineTo(p.addMulS(n1, d));

            break;
        }
        case 1 /* MITER */: {
            let k = n0.add(n1);

            k = k.mulS(2 * d).divS(k.lengthSquared());

            if (k.lengthSquared() <= mld * mld) {
                path.lineTo(p.add(k));
            }

            path.lineTo(p.addMulS(n1, d));

            break;
        }
        case 2 /* MITER_CLIP */: {
            let k = n0.add(n1);

            k = k.mulS(2 * d).divS(k.lengthSquared());

            const pp0 = p.addMulS(n0, d);
            const pp2 = p.addMulS(n1, d);

            if (k.lengthSquared() <= mld * mld) {
                // Same as miter join
                path.lineTo(p.add(k));
            } else if (n0.dot(n1) <= COS_ACUTE) {
                // Join is too sharp ('k' is approaching infinity)
                path.lineTo(pp0.addMulS(n0.normal(), -mld));
                path.lineTo(pp2.addMulS(n1.normal(), mld));
            } else {
                const kov = k.dot(p.sub(pp0));
                const kok = k.dot(k);

                const t = (kov + mld * Math.sqrt(kok)) / (kov + kok);

                // Fall back to bevel otherwise
                if (t > 0) {
                    const pp1 = p.add(k);

                    path.lineTo(pp0.lerp(pp1, t));
                    path.lineTo(pp2.lerp(pp1, t));
                }
            }

            path.lineTo(pp2);

            break;
        }
        case 3 /* ROUND */: {
            const pp0 = p.addMulS(n0, d);
            const pp2 = p.addMulS(n1, d);

            if (n0.dot(n1) < 0) {
                // Obtuse angle (2 segments)
                const nm = pp2.sub(pp0).unitOrZero().normal();

                let k = n0.add(nm);

                k = k.mulS(2 * d).divS(k.lengthSquared());

                const pc1 = p.add(k);
                const pp1 = p.addMulS(nm, d);
                const pc2 = pc1.lerp(pp1, 2);

                const w = BezierRCurve2.getWeightFromVectors(p, pc1, pp1);

                path.conicTo(pc1, pp1, w);
                path.conicTo(pc2, pp2, w);
            } else {
                // Acute angle (1 segment)
                let k = n0.add(n1);

                k = k.mulS(2 * d).divS(k.lengthSquared());

                const pc = p.add(k);

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

export function insertInnerJoin(path: Path2, p: ReadonlyVector2, n1: ReadonlyVector2, d: number): void {
    // Go back to the point of the base path to fix some offset artifacts (basically a hack)
    path.lineTo(p);

    // Bevel join
    path.lineTo(p.addMulS(n1, d));
}
