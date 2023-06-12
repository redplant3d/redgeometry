import {
    simplifyConic,
    simplifyCubicMidpoint,
    simplifyParameterStepConic,
    simplifyParameterStepCubic,
} from "../internal/path-simplify.js";
import { Bezier2Curve2, Bezier3Curve2, BezierRCurve2 } from "../primitives/bezier.js";
import { Point2 } from "../primitives/point.js";
import { assertUnreachable } from "../utility/debug.js";
import type { PathQualityOptions } from "./path-options.js";
import { Path2, PathCommandType } from "./path.js";

export interface PathFlatten2 {
    process(input: Path2, output: Path2, forceClose: boolean): void;
    setQualityOptions(options: PathQualityOptions): void;
}

/**
 * Incremental path flattening.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 */
export class PathFlattenIncremental2 implements PathFlatten2 {
    private simplifyTolerance: number;
    private tolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.tolerance = qualityOptions.flattenTolerance;
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
    }

    public process(input: Path2, output: Path2, forceClose: boolean): void {
        // Check if path is empty or invalid
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let ps = Point2.zero;
        let p0 = Point2.zero;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (forceClose && !p0.eq(ps)) {
                        output.lineTo(ps);
                    }
                    ps = points[pIdx++];
                    output.moveTo(ps);
                    p0 = ps;
                    break;
                }
                case PathCommandType.Linear: {
                    const p1 = points[pIdx++];
                    output.lineTo(p1);
                    p0 = p1;
                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    this.flattenQuadratic(c, output);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    this.flattenCubic(c, output);
                    p0 = c.p3;
                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    this.flattenConic(c, output);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Close: {
                    if (!p0.eq(ps)) {
                        output.lineTo(ps);
                    }
                    output.close();
                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        if (forceClose && !p0.eq(ps)) {
            output.lineTo(ps);
            output.close();
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.tolerance = options.flattenTolerance;
        this.simplifyTolerance = options.simplifyTolerance;
    }

    private flattenConic(c0: BezierRCurve2, output: Path2): void {
        let t = simplifyParameterStepConic(c0, 4, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            this.flattenQuadratic(simplifyConic(c1), output);

            t = t / (1 - t);
            c = c2;
        }

        this.flattenQuadratic(simplifyConic(c), output);
    }

    private flattenCubic(c0: Bezier3Curve2, output: Path2): void {
        let t = simplifyParameterStepCubic(c0, 54, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            this.flattenQuadratic(simplifyCubicMidpoint(c1), output);

            t = t / (1 - t);
            c = c2;
        }

        this.flattenQuadratic(simplifyCubicMidpoint(c), output);
    }

    private flattenQuadratic(c0: Bezier2Curve2, output: Path2): void {
        const [qa, qb, qc] = c0.getCoefficients();

        // Smallest parameter step to satisfy tolerance condition
        const step = Math.sqrt((4 * this.tolerance) / qa.length);

        for (let t = step; t < 1; t += step) {
            // Evaluate points (Horner's method)
            const p = qa.mul(t).add(qb).mul(t).addPt(qc);
            output.lineTo(p);
        }

        output.lineTo(c0.p2);
    }
}

/**
 * Recursive path flattening.
 */
export class PathFlattenRecursive2 implements PathFlatten2 {
    private tolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.tolerance = qualityOptions.flattenTolerance;
    }

    public process(input: Path2, output: Path2, forceClose: boolean): void {
        // Check if path is empty or invalid
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let ps = Point2.zero;
        let p0 = Point2.zero;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (forceClose && !p0.eq(ps)) {
                        output.lineTo(ps);
                    }
                    ps = points[pIdx++];
                    output.moveTo(ps);
                    p0 = ps;
                    break;
                }
                case PathCommandType.Linear: {
                    const p1 = points[pIdx++];
                    output.lineTo(p1);
                    p0 = p1;
                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    this.flattenQuadratic(c, output);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    this.flattenCubic(c, output);
                    p0 = c.p3;
                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    this.flattenConic(c, output);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Close: {
                    if (!p0.eq(ps)) {
                        output.lineTo(ps);
                    }
                    output.close();
                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        if (forceClose && !p0.eq(ps)) {
            output.lineTo(ps);
            output.close();
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.tolerance = options.flattenTolerance;
    }

    private flattenConic(c0: BezierRCurve2, output: Path2): void {
        // Expected area from flatness criterion (squared)
        const tol2 = this.tolerance * this.tolerance;

        const flattenConicRecursive = (c: BezierRCurve2): void => {
            // Vector between endpoints
            const v = c.p2.sub(c.p0);

            // The maximum deviation for rational curves is determined by the weight ratio
            const k = c.w / (c.w + 1);

            // Area of the parallelogram between the vectors
            const a = k * v.cross(c.p1.sub(c.p0));

            // Compare area `a` with the expected area
            if (a * a > tol2 * v.lengthSq) {
                const [c1, c2] = c.splitAt(0.5);

                flattenConicRecursive(c1);
                flattenConicRecursive(c2);
            } else {
                output.lineTo(c.p2);
            }
        };

        // Recursion
        flattenConicRecursive(c0);
    }

    private flattenCubic(c0: Bezier3Curve2, output: Path2): void {
        // The maximum deviation for cubic curves is 75% of the control point distance (squared)
        const k2 = 1 / (0.75 * 0.75);

        // Expected area from flatness criterion (squared)
        const tol2 = k2 * this.tolerance * this.tolerance;

        const flattenCubicRecursive = (c: Bezier3Curve2): void => {
            // Vector between endpoints
            let v = c.p3.sub(c.p0);

            // Check for special case
            if (v.isZero()) {
                // If this is also null the curve will be considered as perfectly flat
                v = c.p2.sub(c.p1);
            }

            // Areas of the parallelogram between the vectors
            const a1 = v.cross(c.p1.sub(c.p0));
            const a2 = v.cross(c.p2.sub(c.p0));

            // Compare the bigger area of the two with the expected area
            if (Math.max(a1 * a1, a2 * a2) > tol2 * v.lengthSq) {
                const [c1, c2] = c.splitAt(0.5);

                flattenCubicRecursive(c1);
                flattenCubicRecursive(c2);
            } else {
                output.lineTo(c.p3);
            }
        };

        // Recursion
        flattenCubicRecursive(c0);
    }

    private flattenQuadratic(c0: Bezier2Curve2, output: Path2): void {
        // The maximum deviation for quadratic curves is 50% of the control point distance (squared)
        const k2 = 1 / (0.5 * 0.5);

        // Expected area from flatness criterion (squared)
        const tol2 = k2 * this.tolerance * this.tolerance;

        const flattenQuadraticRecursive = (c: Bezier2Curve2): void => {
            // Vector between endpoints
            const v = c.p2.sub(c.p0);

            // Area of the parallelogram between the vectors
            const a = v.cross(c.p1.sub(c.p0));

            // Compare area `a` with the expected area
            if (a * a > tol2 * v.lengthSq) {
                const [c1, c2] = c.splitAt(0.5);

                flattenQuadraticRecursive(c1);
                flattenQuadraticRecursive(c2);
            } else {
                output.lineTo(c.p2);
            }
        };

        // Recursion
        flattenQuadraticRecursive(c0);
    }
}
