import {
    isDegenerateQuad,
    isSimpleConic,
    isSimpleQuad,
    simplifyConic,
    simplifyCubicContinious,
    simplifyDistanceCubic,
    simplifyParameterStepConic,
    simplifyParameterStepCubic,
    simplifyParameterStepQuad,
} from "../internal/path-simplify.js";
import { StrokeState } from "../internal/path-stroke.js";
import { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierRCurve2 } from "../primitives/bezier.js";
import { Point2 } from "../primitives/point.js";
import { Vector2 } from "../primitives/vector.js";
import { assertUnreachable } from "../utility/debug.js";
import { MAX_PARAMETER, type PathQualityOptions, type PathStrokeOptions } from "./path-options.js";
import { PathCommandType, type Path2 } from "./path.js";

export interface PathStroke2 {
    process(input: Path2, output: Path2, options: PathStrokeOptions): void;
    setQualityOptions(options: PathQualityOptions): void;
}

/**
 * Incremental path stroking.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 * - Fabian Yzerman.
 *   *Precise offsetting of quadratic Bézier curves*.
 *   https://blend2d.com/
 */
export class PathStrokeIncremental2 implements PathStroke2 {
    private state: StrokeState;

    public simplifyTolerance: number;
    public tanOffsetTolerance: number;

    public constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(qualityOptions.offsetTolerance);

        this.state = new StrokeState();
    }

    public process(input: Path2, output: Path2, options: PathStrokeOptions): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let ct0 = PathCommandType.Move;

        let ps = Point2.ZERO;
        let p0 = Point2.ZERO;
        let m0 = Vector2.ZERO;

        this.state.initialize(output, options);

        while (cIdx < commands.length) {
            const cmd = commands[cIdx++];
            const ct1 = cmd.type;

            switch (ct1) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.state.finalizeOpen();
                    } else if (ct0 !== PathCommandType.Move && ct0 !== PathCommandType.Close) {
                        this.state.finalizePoint(ps);
                    }

                    ps = points[pIdx++];
                    p0 = ps;
                    m0 = Vector2.ZERO;
                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.state.strokeLinear(c, m);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], cmd.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.state.strokeLinear(c, m);

                        m0 = m;
                    }

                    if (!m0.isZero()) {
                        this.state.strokeFirstOrJoin(ps, m0, this.state.ms);
                        this.state.finalizeClosed();
                    } else if (ct0 !== PathCommandType.Close) {
                        this.state.finalizePoint(ps);
                    }

                    p0 = ps;
                    m0 = Vector2.ZERO;
                    break;
                }
                default: {
                    assertUnreachable(cmd);
                }
            }

            ct0 = ct1;
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.state.finalizeOpen();
        } else if (ct0 !== PathCommandType.Move && ct0 !== PathCommandType.Close) {
            this.state.finalizePoint(ps);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(options.offsetTolerance);
    }

    private strokeConic(c0: BezierRCurve2): void {
        let t = simplifyParameterStepConic(c0, 4, this.simplifyTolerance);
        let c = c0;

        while (t > 0 && t < 1) {
            const [c1, c2] = c.splitAt(t);

            const cc1 = simplifyConic(c1);
            this.strokeQuadratic(cc1);

            t = t / (1 - t);
            c = c2;
        }

        const cc = simplifyConic(c);
        this.strokeQuadratic(cc);
    }

    private strokeCubic(c0: Bezier3Curve2): void {
        let t = simplifyParameterStepCubic(c0, 54, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const [cc1, cc2] = simplifyCubicContinious(c1);
            this.strokeQuadratic(cc1);
            this.strokeQuadratic(cc2);

            t = t / (1 - t);
            c = c2;
        }

        const [cc1, cc2] = simplifyCubicContinious(c);
        this.strokeQuadratic(cc1);
        this.strokeQuadratic(cc2);
    }

    private strokeQuadratic(c0: Bezier2Curve2): void {
        const [tc, td] = c0.getOffsetCuspParameter(this.state.distance);

        const t1 = tc - td;
        const t2 = tc + td;

        // Considers `NaN` parameters to be outside
        if (t1 < 1 && t2 > 0) {
            if (isDegenerateQuad(c0)) {
                // Degenerate case
                this.state.strokeQuadraticDegenerate(c0.p0, c0.getValueAt(tc), c0.p2);
            } else {
                // Generic case
                let t0 = 0;

                // Start curve
                if (t1 > t0 && t1 < MAX_PARAMETER) {
                    this.strokeQuadraticSimplify(c0.splitBefore(t1));

                    t0 = t1;
                }

                // Middle curve
                if (t2 > t0 && t2 < MAX_PARAMETER) {
                    this.strokeQuadraticSimplify(c0.splitBetween(t0, t2));

                    t0 = t2;
                }

                // End curve
                if (t0 > 0) {
                    this.strokeQuadraticSimplify(c0.splitAfter(t0));
                } else {
                    this.strokeQuadraticSimplify(c0);
                }
            }
        } else {
            // Default case (parameters outside of curve)
            this.strokeQuadraticSimplify(c0);
        }
    }

    private strokeQuadraticSimplify(c0: Bezier2Curve2): void {
        let t = simplifyParameterStepQuad(c0, this.tanOffsetTolerance);
        let c = c0;

        while (t > 0 && t < MAX_PARAMETER) {
            const [c1, c2] = c.splitAt(t);

            this.state.strokeQuadraticSimple(c1);

            t = simplifyParameterStepQuad(c2, this.tanOffsetTolerance);
            c = c2;
        }

        this.state.strokeQuadraticSimple(c);
    }
}

/**
 * Recursive path stroking.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 * - Fabian Yzerman.
 *   *Precise offsetting of quadratic Bézier curves*.
 *   https://blend2d.com/
 */
export class PathStrokeRecursive2 implements PathStroke2 {
    private state: StrokeState;

    public cosOffsetTolerance: number;
    public simplifyTolerance: number;

    public constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.cosOffsetTolerance = Math.cos(qualityOptions.offsetTolerance);

        this.state = new StrokeState();
    }

    public process(input: Path2, output: Path2, options: PathStrokeOptions): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let ct0 = PathCommandType.Move;

        let cIdx = 0;
        let pIdx = 0;

        let ps = Point2.ZERO;
        let p0 = Point2.ZERO;
        let m0 = Vector2.ZERO;

        this.state.initialize(output, options);

        while (cIdx < commands.length) {
            const cmd = commands[cIdx++];
            const ct1 = cmd.type;

            switch (cmd.type) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.state.finalizeOpen();
                    } else if (ct0 !== PathCommandType.Move && ct0 !== PathCommandType.Close) {
                        this.state.finalizePoint(ps);
                    }

                    ps = points[pIdx++];
                    p0 = ps;
                    m0 = Vector2.ZERO;
                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.state.strokeLinear(c, m);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], cmd.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.strokeConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.strokeFirstOrJoin(p0, m0, m);
                        this.state.strokeLinear(c, m);

                        m0 = m;
                    }

                    if (!m0.isZero()) {
                        this.state.strokeFirstOrJoin(ps, m0, this.state.ms);
                        this.state.finalizeClosed();
                    } else if (ct0 !== PathCommandType.Close) {
                        this.state.finalizePoint(ps);
                    }

                    p0 = ps;
                    m0 = Vector2.ZERO;
                    break;
                }
                default: {
                    assertUnreachable(cmd);
                }
            }

            ct0 = ct1;
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.state.finalizeOpen();
        } else if (ct0 !== PathCommandType.Move && ct0 !== PathCommandType.Close) {
            this.state.finalizePoint(ps);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.cosOffsetTolerance = Math.cos(options.offsetTolerance);
    }

    private strokeConic(c0: BezierRCurve2): void {
        const tol = 4 * this.simplifyTolerance;

        const strokeConicRecursive = (c: BezierRCurve2): void => {
            if (isSimpleConic(c, tol)) {
                const cc = simplifyConic(c);
                this.strokeQuadratic(cc);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                strokeConicRecursive(c1);
                strokeConicRecursive(c2);
            }
        };

        strokeConicRecursive(c0);
    }

    private strokeCubic(c0: Bezier3Curve2): void {
        const tol = 54 * this.simplifyTolerance;
        const d = simplifyDistanceCubic(c0);

        const strokeCubicRecursive = (c: Bezier3Curve2, d: number): void => {
            if (tol > d) {
                const [cc1, cc2] = simplifyCubicContinious(c);
                this.strokeQuadratic(cc1);
                this.strokeQuadratic(cc2);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                strokeCubicRecursive(c1, 0.125 * d);
                strokeCubicRecursive(c2, 0.125 * d);
            }
        };

        strokeCubicRecursive(c0, d);
    }

    private strokeQuadratic(c0: Bezier2Curve2): void {
        const [tc, td] = c0.getOffsetCuspParameter(this.state.distance);

        const t1 = tc - td;
        const t2 = tc + td;

        // Considers `NaN` parameters to be outside
        if (t1 < 1 && t2 > 0) {
            if (isDegenerateQuad(c0)) {
                // Degenerate case
                this.state.strokeQuadraticDegenerate(c0.p0, c0.getValueAt(tc), c0.p2);
            } else {
                // Generic case
                let t0 = 0;

                // Start curve
                if (t1 > t0 && t1 < MAX_PARAMETER) {
                    this.strokeQuadraticSimplify(c0.splitBefore(t1));

                    t0 = t1;
                }

                // Middle curve
                if (t2 > t0 && t2 < MAX_PARAMETER) {
                    this.strokeQuadraticSimplify(c0.splitBetween(t0, t2));

                    t0 = t2;
                }

                // End curve
                if (t0 > 0) {
                    this.strokeQuadraticSimplify(c0.splitAfter(t0));
                } else {
                    this.strokeQuadraticSimplify(c0);
                }
            }
        } else {
            // Default case (parameters outside of curve)
            this.strokeQuadraticSimplify(c0);
        }
    }

    private strokeQuadraticSimplify(c0: Bezier2Curve2): void {
        const tol = this.cosOffsetTolerance;

        const strokeQuadraticRecursive = (c: Bezier2Curve2): void => {
            if (isSimpleQuad(c, tol)) {
                this.state.strokeQuadraticSimple(c);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                strokeQuadraticRecursive(c1);
                strokeQuadraticRecursive(c2);
            }
        };

        strokeQuadraticRecursive(c0);
    }
}
