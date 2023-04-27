import {
    insertOffsetJoin,
    isDegenerateQuad,
    isSimpleConic,
    isSimpleQuad,
    offsetQuadraticDegenerate,
    offsetQuadraticSimple,
    simplifyConic,
    simplifyCubicContinious,
    simplifyDistanceCubic,
    simplifyParameterStepConic,
    simplifyParameterStepCubic,
    simplifyParameterStepQuad,
} from "../internal";
import { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierRCurve2, Point2, Vector2 } from "../primitives";
import { assertUnreachable } from "../utility";
import { Path2, PathCommandType } from "./path";
import { JoinType, MAX_PARAMETER, PathOffsetOptions, PathQualityOptions } from "./path-options";

export interface PathOffset2 {
    process(input: Path2, output: Path2, options: PathOffsetOptions): void;
    setQualityOptions(options: PathQualityOptions): void;
}

/**
 * Incremental path offseting.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 * - Fabian Yzerman.
 *   *Precise offsetting of quadratic Bézier curves*.
 *   https://blend2d.com/
 */
export class PathOffsetIncremental2 implements PathOffset2 {
    private buffer: Path2;
    private d: number;
    private join: JoinType;
    private miterLimit: number;
    private ms: Vector2;
    private ps: Point2;
    private simplifyTolerance: number;
    private tanOffsetTolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(qualityOptions.offsetTolerance);

        this.buffer = new Path2();
        this.d = 0;
        this.join = JoinType.Bevel;
        this.miterLimit = 0;
        this.ms = Vector2.zero;
        this.ps = Point2.zero;
    }

    public process(input: Path2, output: Path2, options: PathOffsetOptions): void {
        if (!input.isValid()) {
            return;
        }

        this.join = options.join;
        this.miterLimit = options.miterLimit;
        this.d = options.distance;

        // Path data
        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        // Current point and tangent
        let p0 = this.ps;
        let m0 = Vector2.zero;

        this.buffer.clear();

        // Iterate path
        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.finalizeOpenOffset(output);
                    }

                    p0 = points[pIdx++];
                    m0 = Vector2.zero;

                    this.ps = p0;

                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetLinear(c.p1, m);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, this.ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(c.p0, m0, m);
                        this.offsetLinear(c.p1, m);

                        m0 = m;
                    }

                    if (!m0.isZero()) {
                        this.offsetFirstOrJoin(this.ps, m0, this.ms);
                        this.finalizeClosed(output);
                    }

                    p0 = this.ps;
                    m0 = Vector2.zero;

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.finalizeOpenOffset(output);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(options.offsetTolerance);
    }

    private finalizeClosed(output: Path2): void {
        this.buffer.close();
        output.addPath(this.buffer, false);
        this.buffer.clear();
    }

    private finalizeOpenOffset(output: Path2): void {
        output.addPath(this.buffer, false);
        this.buffer.clear();
    }

    private offsetConic(c0: BezierRCurve2): void {
        let t = simplifyParameterStepConic(c0, 4, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const cc1 = simplifyConic(c1);
            this.offsetQuadratic(cc1);

            t = t / (1 - t);
            c = c2;
        }

        const cc = simplifyConic(c);
        this.offsetQuadratic(cc);
    }

    private offsetCubic(c0: Bezier3Curve2): void {
        let t = simplifyParameterStepCubic(c0, 54, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const [cc1, cc2] = simplifyCubicContinious(c1);
            this.offsetQuadratic(cc1);
            this.offsetQuadratic(cc2);

            t = t / (1 - t);
            c = c2;
        }

        const [cc1, cc2] = simplifyCubicContinious(c);
        this.offsetQuadratic(cc1);
        this.offsetQuadratic(cc2);
    }

    private offsetFirstOrJoin(p: Point2, m0: Vector2, m1: Vector2): void {
        if (m0.isZero()) {
            this.offsetMove(p, m1);
            this.ms = m1;
        } else {
            insertOffsetJoin(this.buffer, p, m0, m1, this.d, this.miterLimit, this.join);
        }
    }

    private offsetLinear(p1: Point2, m: Vector2): void {
        const v = m.unit.normal.mul(this.d);

        this.buffer.lineTo(p1.add(v));
    }

    private offsetMove(p0: Point2, m: Vector2): void {
        const v = m.unit.normal.mul(this.d);

        this.buffer.moveTo(p0.add(v));
    }

    private offsetQuadratic(c0: Bezier2Curve2): void {
        const [tc, td] = c0.getOffsetCuspParameter(this.d);

        const t1 = tc - td;
        const t2 = tc + td;

        // Considers `NaN` parameters to be outside
        if (t1 < 1 && t2 > 0) {
            if (isDegenerateQuad(c0)) {
                // Degenerate case
                offsetQuadraticDegenerate(this.buffer, c0.p0, c0.getValueAt(tc), c0.p2, this.d);
            } else {
                // Generic case
                let t0 = 0;

                // Start curve
                if (t1 > t0 && t1 < MAX_PARAMETER) {
                    this.offsetQuadraticSimplify(c0.splitBefore(t1), this.d);
                    t0 = t1;
                }

                // Middle curve
                if (t2 > t0 && t2 < MAX_PARAMETER) {
                    this.offsetQuadraticSimplify(c0.splitBetween(t0, t2), this.d);
                    t0 = t2;
                }

                // End curve
                if (t0 > 0) {
                    this.offsetQuadraticSimplify(c0.splitAfter(t0), this.d);
                } else {
                    this.offsetQuadraticSimplify(c0, this.d);
                }
            }
        } else {
            // Default case (parameters outside of curve)
            this.offsetQuadraticSimplify(c0, this.d);
        }
    }

    private offsetQuadraticSimplify(c0: Bezier2Curve2, d: number): void {
        let t = simplifyParameterStepQuad(c0, this.tanOffsetTolerance);
        let c = c0;

        while (t > 0 && t < MAX_PARAMETER) {
            const [c1, c2] = c.splitAt(t);

            offsetQuadraticSimple(this.buffer, c1, d);

            t = simplifyParameterStepQuad(c2, this.tanOffsetTolerance);
            c = c2;
        }

        offsetQuadraticSimple(this.buffer, c, d);
    }
}

/**
 * Recursive path offseting.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 * - Fabian Yzerman.
 *   *Precise offsetting of quadratic Bézier curves*.
 *   https://blend2d.com/
 */
export class PathOffsetRecursive2 implements PathOffset2 {
    private buffer: Path2;
    private cosOffsetTolerance: number;
    private d: number;
    private join: JoinType;
    private miterLimit: number;
    private ms: Vector2;
    private ps: Point2;
    private simplifyTolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.cosOffsetTolerance = Math.cos(qualityOptions.offsetTolerance);

        this.buffer = new Path2();
        this.d = 0;
        this.join = JoinType.Bevel;
        this.miterLimit = 0;
        this.ms = Vector2.zero;
        this.ps = Point2.zero;
    }

    public process(input: Path2, output: Path2, options: PathOffsetOptions): void {
        if (!input.isValid()) {
            return;
        }

        this.join = options.join;
        this.miterLimit = options.miterLimit;
        this.d = options.distance;

        // Path data
        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        // Current point and tangent
        let p0 = this.ps;
        let m0 = Vector2.zero;

        this.buffer.clear();

        // Iterate path
        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.finalizeOpenOffset(output);
                    }

                    p0 = points[pIdx++];
                    m0 = Vector2.zero;

                    this.ps = p0;

                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetLinear(c.p1, m);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(p0, m0, m);
                        this.offsetConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, this.ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.offsetFirstOrJoin(c.p0, m0, m);
                        this.offsetLinear(c.p1, m);

                        m0 = m;
                    }

                    if (!m0.isZero()) {
                        this.offsetFirstOrJoin(this.ps, m0, this.ms);
                        this.finalizeClosed(output);
                    }

                    p0 = this.ps;
                    m0 = Vector2.zero;

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.finalizeOpenOffset(output);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.cosOffsetTolerance = Math.tan(options.offsetTolerance);
    }

    private finalizeClosed(output: Path2): void {
        this.buffer.close();
        output.addPath(this.buffer, false);
        this.buffer.clear();
    }

    private finalizeOpenOffset(output: Path2): void {
        output.addPath(this.buffer, false);
        this.buffer.clear();
    }

    private offsetConic(c0: BezierRCurve2): void {
        const tol = 4 * this.simplifyTolerance;

        const offsetConicRecursive = (c: BezierRCurve2): void => {
            if (isSimpleConic(c, tol)) {
                const cc = simplifyConic(c);
                this.offsetQuadratic(cc);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                offsetConicRecursive(c1);
                offsetConicRecursive(c2);
            }
        };

        offsetConicRecursive(c0);
    }

    private offsetCubic(c0: Bezier3Curve2): void {
        const tol = 54 * this.simplifyTolerance;
        const d = simplifyDistanceCubic(c0);

        const offsetCubicRecursive = (c: Bezier3Curve2, d: number): void => {
            if (tol > d) {
                const [cc1, cc2] = simplifyCubicContinious(c);
                this.offsetQuadratic(cc1);
                this.offsetQuadratic(cc2);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                offsetCubicRecursive(c1, 0.125 * d);
                offsetCubicRecursive(c2, 0.125 * d);
            }
        };

        offsetCubicRecursive(c0, d);
    }

    private offsetFirstOrJoin(p: Point2, m0: Vector2, m1: Vector2): void {
        if (m0.isZero()) {
            this.offsetMove(p, m1);
            this.ms = m1;
        } else {
            insertOffsetJoin(this.buffer, p, m0, m1, this.d, this.miterLimit, this.join);
        }
    }

    private offsetLinear(p1: Point2, m: Vector2): void {
        const v = m.unit.normal.mul(this.d);

        this.buffer.lineTo(p1.add(v));
    }

    private offsetMove(p0: Point2, m: Vector2): void {
        const v = m.unit.normal.mul(this.d);

        this.buffer.moveTo(p0.add(v));
    }

    private offsetQuadratic(c0: Bezier2Curve2): void {
        const [tc, td] = c0.getOffsetCuspParameter(this.d);

        const t1 = tc - td;
        const t2 = tc + td;

        // Considers `NaN` parameters to be outside
        if (t1 < 1 && t2 > 0) {
            if (isDegenerateQuad(c0)) {
                // Degenerate case
                offsetQuadraticDegenerate(this.buffer, c0.p0, c0.getValueAt(tc), c0.p2, this.d);
            } else {
                // Generic case
                let t0 = 0;

                // Start curve
                if (t1 > t0 && t1 < MAX_PARAMETER) {
                    this.offsetQuadraticSimplify(c0.splitBefore(t1), this.d);
                    t0 = t1;
                }

                // Middle curve
                if (t2 > t0 && t2 < MAX_PARAMETER) {
                    this.offsetQuadraticSimplify(c0.splitBetween(t0, t2), this.d);
                    t0 = t2;
                }

                // End curve
                if (t0 > 0) {
                    this.offsetQuadraticSimplify(c0.splitAfter(t0), this.d);
                } else {
                    this.offsetQuadraticSimplify(c0, this.d);
                }
            }
        } else {
            // Default case (parameters outside of curve)
            this.offsetQuadraticSimplify(c0, this.d);
        }
    }

    private offsetQuadraticSimplify(c0: Bezier2Curve2, d: number): void {
        const tol = this.cosOffsetTolerance;

        const offsetQuadraticRecursive = (c: Bezier2Curve2): void => {
            if (isSimpleQuad(c, tol)) {
                offsetQuadraticSimple(this.buffer, c, d);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                offsetQuadraticRecursive(c1);
                offsetQuadraticRecursive(c2);
            }
        };

        offsetQuadraticRecursive(c0);
    }
}
