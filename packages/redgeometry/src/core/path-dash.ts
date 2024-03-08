import { DashState } from "../internal/path-dash.js";
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
import { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierRCurve2 } from "../primitives/bezier.js";
import { Point2 } from "../primitives/point.js";
import { Vector2 } from "../primitives/vector.js";
import { assertUnreachable } from "../utility/debug.js";
import { MAX_PARAMETER, type PathDashOptions, type PathQualityOptions } from "./path-options.js";
import { PathCommandType, type Path2 } from "./path.js";

export interface PathDash2 {
    process(input: Path2, output: Path2, options: PathDashOptions): void;
    setQualityOptions(options: PathQualityOptions): void;
}

export class PathDashIncremental2 implements PathDash2 {
    private state: DashState;

    public simplifyTolerance: number;
    public tanOffsetTolerance: number;

    public constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(qualityOptions.offsetTolerance);

        this.state = new DashState();
    }

    public process(input: Path2, output: Path2, options: PathDashOptions): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let ps = Point2.ZERO;
        let p0 = Point2.ZERO;
        let m0 = Vector2.ZERO;

        this.initialize(output, options);

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.state.finalizeOpen(output);
                    }

                    p0 = points[pIdx++];
                    m0 = Vector2.ZERO;

                    ps = p0;
                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.state.dashLinear(c);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.dashLinear(c);
                    }

                    if (!m0.isZero()) {
                        this.state.finalizeClosed(output);
                    }

                    p0 = ps;
                    m0 = Vector2.ZERO;

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.state.finalizeOpen(output);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.tanOffsetTolerance = Math.tan(options.offsetTolerance);
    }

    private dashConic(c0: BezierRCurve2): void {
        let t = simplifyParameterStepConic(c0, 4, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const cc1 = simplifyConic(c1);
            this.dashQuadratic(cc1);

            t = t / (1 - t);
            c = c2;
        }

        const cc = simplifyConic(c);
        this.dashQuadratic(cc);
    }

    private dashCubic(c0: Bezier3Curve2): void {
        let t = simplifyParameterStepCubic(c0, 54, this.simplifyTolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const [cc1, cc2] = simplifyCubicContinious(c1);
            this.dashQuadratic(cc1);
            this.dashQuadratic(cc2);

            t = t / (1 - t);
            c = c2;
        }

        const [cc1, cc2] = simplifyCubicContinious(c);
        this.dashQuadratic(cc1);
        this.dashQuadratic(cc2);
    }

    private dashQuadratic(c0: Bezier2Curve2): void {
        const tc = c0.getVertexParameter();

        // Considers `NaN` parameters to be outside
        if (tc > 0 && tc < 1 && isDegenerateQuad(c0)) {
            // Degenerate case
            this.state.dashDegenerateQuad(c0.p0, c0.getValueAt(tc), c0.p2);
        } else {
            // Default case
            this.dashQuadraticSimplify(c0);
        }
    }

    private dashQuadraticSimplify(c0: Bezier2Curve2): void {
        let t = simplifyParameterStepQuad(c0, this.tanOffsetTolerance);
        let c = c0;

        while (t > 0 && t < MAX_PARAMETER) {
            const [c1, c2] = c.splitAt(t);

            this.state.dashQuadraticSimple(c1);

            t = simplifyParameterStepQuad(c2, this.tanOffsetTolerance);
            c = c2;
        }

        this.state.dashQuadraticSimple(c);
    }

    private initialize(output: Path2, options: PathDashOptions): void {
        this.state.initialize(output, options);
    }
}

export class PathDashRecursive2 implements PathDash2 {
    private state: DashState;

    public cosOffsetTolerance: number;
    public simplifyTolerance: number;

    public constructor(qualityOptions: PathQualityOptions) {
        this.simplifyTolerance = qualityOptions.simplifyTolerance;
        this.cosOffsetTolerance = Math.cos(qualityOptions.offsetTolerance);

        this.state = new DashState();
    }

    public process(input: Path2, output: Path2, options: PathDashOptions): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let ps = Point2.ZERO;
        let p0 = Point2.ZERO;
        let m0 = Vector2.ZERO;

        this.state.initialize(output, options);

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    if (!m0.isZero()) {
                        this.state.finalizeOpen(output);
                    }

                    p0 = points[pIdx++];
                    m0 = Vector2.ZERO;

                    ps = p0;
                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(p0, points[pIdx++]);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.state.dashLinear(c);

                        p0 = c.p1;
                        m0 = m;
                    }

                    break;
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(p0, points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashQuadratic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashCubic(c);

                        p0 = c.p3;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    const m = c.getTangentStart();

                    if (!m.isZero()) {
                        this.state.dashFirst(p0, m0);
                        this.dashConic(c);

                        p0 = c.p2;
                        m0 = c.getTangentEnd();
                    }

                    break;
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(p0, ps);
                    const m = c.getDerivative();

                    if (!m.isZero()) {
                        this.state.dashLinear(c);
                    }

                    if (!m0.isZero()) {
                        this.state.finalizeClosed(output);
                    }

                    p0 = ps;
                    m0 = Vector2.ZERO;

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        // Finalize last shape
        if (!m0.isZero()) {
            this.state.finalizeOpen(output);
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.simplifyTolerance = options.simplifyTolerance;
        this.cosOffsetTolerance = Math.cos(options.offsetTolerance);
    }

    private dashConic(c0: BezierRCurve2): void {
        const tol = 4 * this.simplifyTolerance;

        const dashConicRecursive = (c: BezierRCurve2): void => {
            if (isSimpleConic(c, tol)) {
                const cc = simplifyConic(c);
                this.dashQuadratic(cc);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                dashConicRecursive(c1);
                dashConicRecursive(c2);
            }
        };

        dashConicRecursive(c0);
    }

    private dashCubic(c0: Bezier3Curve2): void {
        const tol = 54 * this.simplifyTolerance;
        const d = simplifyDistanceCubic(c0);

        const dashCubicRecursive = (c: Bezier3Curve2, d: number): void => {
            if (tol > d) {
                const [cc1, cc2] = simplifyCubicContinious(c);
                this.dashQuadratic(cc1);
                this.dashQuadratic(cc2);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                dashCubicRecursive(c1, 0.125 * d);
                dashCubicRecursive(c2, 0.125 * d);
            }
        };

        dashCubicRecursive(c0, d);
    }

    private dashQuadratic(c0: Bezier2Curve2): void {
        const tc = c0.getVertexParameter();

        // Considers `NaN` parameters to be outside
        if (tc > 0 && tc < 1 && isDegenerateQuad(c0)) {
            // Degenerate case
            this.state.dashDegenerateQuad(c0.p0, c0.getValueAt(tc), c0.p2);
        } else {
            // Default case
            this.dashQuadraticSimplify(c0);
        }
    }

    private dashQuadraticSimplify(c0: Bezier2Curve2): void {
        const tol = this.cosOffsetTolerance;

        const dashQuadraticRecursive = (c: Bezier2Curve2): void => {
            if (isSimpleQuad(c, tol)) {
                this.state.dashQuadraticSimple(c);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                dashQuadraticRecursive(c1);
                dashQuadraticRecursive(c2);
            }
        };

        dashQuadraticRecursive(c0);
    }
}
