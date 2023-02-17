import {
    isSimpleConic,
    simplifyConic,
    simplifyCubicContinious,
    simplifyDistanceCubic,
    simplifyParameterStepConic,
    simplifyParameterStepCubic,
} from "../internal";
import { Bezier2Curve2, Bezier3Curve2, BezierRCurve2, Point2 } from "../primitives";
import { Debug } from "../utility";
import { Path2, PathCommandType } from "./path";
import { PathQualityOptions } from "./path-options";

export interface PathSimplify2 {
    process(input: Path2, output: Path2): void;
    setQualityOptions(options: PathQualityOptions): void;
}

/**
 * Incremental path simplifying.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 */
export class PathSimplifyIncremental2 implements PathSimplify2 {
    public tolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.tolerance = qualityOptions.simplifyTolerance;
    }

    public process(input: Path2, output: Path2): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let p0 = Point2.zero;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    p0 = points[pIdx++];
                    output.moveTo(p0);
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
                    output.quadTo(c.p1, c.p2);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    this.simplifyCubic(output, c);
                    p0 = c.p3;
                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    this.simplifyConic(output, c);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Close: {
                    output.close();
                    break;
                }
                default: {
                    Debug.assertUnreachable(command);
                }
            }
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.tolerance = options.simplifyTolerance;
    }

    private simplifyConic(output: Path2, c0: BezierRCurve2): void {
        let t = simplifyParameterStepConic(c0, 4, this.tolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const cc1 = simplifyConic(c1);
            output.quadTo(cc1.p1, cc1.p2);

            t = t / (1 - t);
            c = c2;
        }

        const cc = simplifyConic(c);
        output.quadTo(cc.p1, cc.p2);
    }

    private simplifyCubic(output: Path2, c0: Bezier3Curve2): void {
        let t = simplifyParameterStepCubic(c0, 54, this.tolerance);
        let c = c0;

        while (t < 1) {
            const [c1, c2] = c.splitAt(t);

            const [cc1, cc2] = simplifyCubicContinious(c1);
            output.quadTo(cc1.p1, cc1.p2);
            output.quadTo(cc2.p1, cc2.p2);

            t = t / (1 - t);
            c = c2;
        }

        const [cc1, cc2] = simplifyCubicContinious(c);
        output.quadTo(cc1.p1, cc1.p2);
        output.quadTo(cc2.p1, cc2.p2);
    }
}

/**
 * Recursive path simplifying.
 *
 * References:
 * - Fabian Yzerman.
 *   *Fast approaches to simplify and offset Bézier curves within specified error limits*.
 *   https://blend2d.com/
 */
export class PathSimplifyRecursive2 implements PathSimplify2 {
    public tolerance: number;

    constructor(qualityOptions: PathQualityOptions) {
        this.tolerance = qualityOptions.simplifyTolerance;
    }

    public process(input: Path2, output: Path2): void {
        if (!input.isValid()) {
            return;
        }

        const commands = input.getCommands();
        const points = input.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let p0 = Point2.zero;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    p0 = points[pIdx++];
                    output.moveTo(p0);
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
                    output.quadTo(c.p1, c.p2);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(p0, points[pIdx++], points[pIdx++], points[pIdx++]);
                    this.simplifyCubic(output, c);
                    p0 = c.p3;
                    break;
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(p0, points[pIdx++], points[pIdx++], command.w);
                    this.simplifyConic(output, c);
                    p0 = c.p2;
                    break;
                }
                case PathCommandType.Close: {
                    output.close();
                    break;
                }
                default: {
                    Debug.assertUnreachable(command);
                }
            }
        }
    }

    public setQualityOptions(options: PathQualityOptions): void {
        this.tolerance = options.simplifyTolerance;
    }

    private simplifyConic(output: Path2, c0: BezierRCurve2): void {
        const tol = 4 * this.tolerance;

        const simplifyConicRecursive = (c: BezierRCurve2): void => {
            if (isSimpleConic(c, tol)) {
                const cc = simplifyConic(c);
                output.quadTo(cc.p1, cc.p2);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                simplifyConicRecursive(c1);
                simplifyConicRecursive(c2);
            }
        };

        simplifyConicRecursive(c0);
    }

    private simplifyCubic(output: Path2, c0: Bezier3Curve2): void {
        const tol = 54 * this.tolerance;
        const d = simplifyDistanceCubic(c0);

        const simplifyCubicRecursive = (c: Bezier3Curve2, d: number): void => {
            if (tol > d) {
                const [cc1, cc2] = simplifyCubicContinious(c);
                output.quadTo(cc1.p1, cc1.p2);
                output.quadTo(cc2.p1, cc2.p2);
            } else {
                const [c1, c2] = c.splitAt(0.5);
                simplifyCubicRecursive(c1, 0.125 * d);
                simplifyCubicRecursive(c2, 0.125 * d);
            }
        };

        simplifyCubicRecursive(c0, d);
    }
}
