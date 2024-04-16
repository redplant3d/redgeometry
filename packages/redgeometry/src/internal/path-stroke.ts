import {
    COS_OBTUSE,
    CapType,
    DEFAULT_PATH_STROKE_OPTIONS,
    JoinType,
    type CustomCap,
    type PathStrokeOptions,
    type StrokeCaps,
} from "../core/path-options.js";
import { Path2 } from "../core/path.js";
import { Bezier2Curve2, type Bezier1Curve2 } from "../primitives/bezier.js";
import type { Point2 } from "../primitives/point.js";
import { Vector2 } from "../primitives/vector.js";
import {
    getDashArcLengthLinear,
    getDashArcLengthQuadratic,
    getDashIndexNext,
    getDashParameterLinear,
    getDashParameterQuadratic,
    getDashStart,
} from "./path-dash.js";
import { insertInnerJoin, insertOuterJoin } from "./path-offset.js";

export class StrokeState {
    public caps: StrokeCaps;
    public currentIndex: number;
    public currentLength: number;
    public currentPhase: boolean;
    public dashArray: number[];
    public dashCaps: StrokeCaps;
    public distance: number;
    public isDash: boolean;
    public isFirstDash: boolean;
    public join: JoinType;
    public left: Path2;
    public leftFirst: Path2;
    public leftMain: Path2;
    public miterLimit: number;
    public ms: Vector2;
    public output: Path2;
    public right: Path2;
    public rightFirst: Path2;
    public rightMain: Path2;
    public startAdvancedLength: number;
    public startIndex: number;
    public startPhase: boolean;

    public constructor() {
        this.caps = DEFAULT_PATH_STROKE_OPTIONS.caps;
        this.dashArray = DEFAULT_PATH_STROKE_OPTIONS.dashArray;
        this.dashCaps = DEFAULT_PATH_STROKE_OPTIONS.dashCaps;
        this.distance = 0.5 * DEFAULT_PATH_STROKE_OPTIONS.width;
        this.join = DEFAULT_PATH_STROKE_OPTIONS.join;
        this.miterLimit = DEFAULT_PATH_STROKE_OPTIONS.miterLimit;

        this.currentIndex = 0;
        this.currentLength = 0;
        this.currentPhase = false;
        this.isDash = false;
        this.isFirstDash = true;
        this.ms = Vector2.createZero();
        this.output = Path2.createEmpty();
        this.startAdvancedLength = 0;
        this.startIndex = 0;
        this.startPhase = false;

        const leftFirst = Path2.createEmpty();
        const rightFirst = Path2.createEmpty();
        const leftMain = Path2.createEmpty();
        const rightMain = Path2.createEmpty();

        this.left = leftFirst;
        this.leftFirst = leftFirst;
        this.leftMain = leftMain;
        this.right = rightFirst;
        this.rightFirst = rightFirst;
        this.rightMain = rightMain;
    }

    public finalizeClosed(): void {
        if (this.isDash) {
            this.finalizeClosedDashStroke();
        } else {
            this.finalizeClosedStroke();
        }
    }

    public finalizeOpen(): void {
        if (this.isDash) {
            this.finalizeOpenDashStroke();
        } else {
            this.finalizeOpenStroke();
        }
    }

    public finalizePoint(p: Point2): void {
        const m = Vector2.createUnitX();
        this.insertMoveStroke(p, m);
        this.finalizeOpen();
    }

    public initialize(output: Path2, options: PathStrokeOptions): void {
        this.output = output;

        if (options.dashArray.length > 0) {
            this.initializeStroke(options);
            this.initializeDashStroke(options);
            this.resetDash();

            this.isDash = true;
        } else {
            this.initializeStroke(options);
            this.resetStroke();

            this.left = this.leftMain;
            this.right = this.rightMain;
            this.isDash = false;
        }
    }

    public strokeFirstOrJoin(p: Point2, m0: Vector2, m1: Vector2): void {
        if (this.isDash) {
            this.insertFirstOrJoinDashStroke(p, m0, m1);
        } else {
            this.insertFirstOrJoinStroke(p, m0, m1);
        }
    }

    public strokeLinear(c0: Bezier1Curve2, m: Vector2): void {
        if (this.isDash) {
            this.insertLinearDashStroke(c0);
        } else {
            this.insertLinearStroke(c0.p1, m);
        }
    }

    public strokeQuadraticDegenerate(p0: Point2, p1: Point2, p2: Point2): void {
        if (this.isDash) {
            this.insertQuadraticDegenerateDashStroke(p0, p1, p2);
        } else {
            this.insertQuadraticDegenerateStroke(p0, p1, p2);
        }
    }

    public strokeQuadraticSimple(c0: Bezier2Curve2): void {
        if (this.isDash) {
            this.insertQuadraticSimpleDashStroke(c0);
        } else {
            this.insertQuadraticSimpleStroke(c0);
        }
    }

    private advanceDash(): void {
        const index = getDashIndexNext(this.dashArray, this.currentIndex);

        if (this.isFirstDash) {
            this.isFirstDash = false;

            this.left = this.leftMain;
            this.right = this.rightMain;
        } else if (this.currentPhase) {
            combineStroke(this.output, this.leftMain, this.rightMain, this.dashCaps.start, this.dashCaps.end);

            this.resetStroke();
        }

        this.currentLength = 0;
        this.currentIndex = index;
        this.currentPhase = !this.currentPhase;
    }

    private finalizeClosedDashStroke(): void {
        if (this.startPhase && this.currentPhase) {
            if (this.isFirstDash) {
                // First dash is closed
                this.leftFirst.close();
                this.rightFirst.close();

                this.output.addPath(this.leftFirst, false);
                this.output.addPathReversed(this.rightFirst, false);
            } else {
                // Last and first dash are connected
                this.leftMain.addPath(this.leftFirst, true);
                this.rightMain.addPath(this.rightFirst, true);

                combineStroke(this.output, this.leftMain, this.rightMain, this.dashCaps.start, this.dashCaps.end);
            }
        } else {
            // Last and first dash are not connected
            combineStroke(this.output, this.leftMain, this.rightMain, this.dashCaps.start, this.caps.end);
            combineStroke(this.output, this.leftFirst, this.rightFirst, this.caps.start, this.dashCaps.end);
        }

        this.resetDash();
    }

    private finalizeClosedStroke(): void {
        this.left.close();
        this.right.close();

        this.output.addPath(this.left, false);
        this.output.addPathReversed(this.right, false);

        this.resetStroke();
    }

    private finalizeOpenDashStroke(): void {
        if (!this.isFirstDash) {
            // Last dash
            combineStroke(this.output, this.leftMain, this.rightMain, this.dashCaps.start, this.caps.end);
        }

        if (this.startPhase) {
            // First dash
            combineStroke(this.output, this.leftFirst, this.rightFirst, this.caps.start, this.dashCaps.end);
        }

        this.resetDash();
    }

    private finalizeOpenStroke(): void {
        combineStroke(this.output, this.left, this.right, this.caps.start, this.caps.end);

        this.resetStroke();
    }

    private getDashLength(): number {
        return this.dashArray[this.currentIndex];
    }

    private initializeDashStroke(options: PathStrokeOptions): void {
        this.dashArray = options.dashArray;
        this.dashCaps = options.dashCaps;

        const [length, index, phase] = getDashStart(options.dashArray, options.dashOffset);

        this.startAdvancedLength = length;
        this.startIndex = index;
        this.startPhase = phase;
    }

    private initializeStroke(options: PathStrokeOptions): void {
        this.caps = options.caps;
        this.distance = 0.5 * options.width;
        this.join = options.join;
        this.miterLimit = options.miterLimit;
    }

    private insertFirstOrJoinDashStroke(p: Point2, m0: Vector2, m1: Vector2): void {
        if (this.currentPhase) {
            this.insertFirstOrJoinStroke(p, m0, m1);
        }
    }

    private insertFirstOrJoinStroke(p: Point2, m0: Vector2, m1: Vector2): void {
        if (m0.isZero()) {
            this.insertMoveStroke(p, m1);
            this.ms = m1;
        } else {
            insertStrokeJoin(this.left, this.right, p, m0, m1, this.distance, this.miterLimit, this.join);
        }
    }

    private insertLinearDashStroke(c0: Bezier1Curve2): void {
        let lenRem = this.getDashLength() - this.currentLength;
        let len = getDashArcLengthLinear(c0);
        let c = c0;

        while (lenRem < len) {
            const t = getDashParameterLinear(c, lenRem);
            const c2 = c.splitAfter(t);
            const m = c2.getDerivative();

            if (this.currentPhase) {
                this.insertLinearStroke(c2.p0, m);
            } else {
                this.insertMoveStroke(c2.p0, m);
            }

            this.advanceDash();

            lenRem = this.getDashLength();
            len = getDashArcLengthLinear(c2);
            c = c2;
        }

        this.currentLength += len;

        if (this.currentPhase) {
            const m = c.getTangentStart();
            this.insertLinearStroke(c.p1, m);
        }
    }

    private insertLinearStroke(p: Point2, m: Vector2): void {
        const v = m.unit().normal().mul(this.distance);

        this.left.lineTo(p.add(v));
        this.right.lineTo(p.add(v.neg()));
    }

    private insertMoveStroke(p0: Point2, m: Vector2): void {
        const v = m.unit().normal().mul(this.distance);

        this.left.moveTo(p0.add(v));
        this.right.moveTo(p0.add(v.neg()));
    }

    private insertQuadraticDegenerateDashStroke(p0: Point2, p1: Point2, p2: Point2): void {
        const c1 = new Bezier2Curve2(p0, p1, p1);
        const c2 = new Bezier2Curve2(p1, p1, p2);

        const n0 = p1.sub(p0).unit().normal();
        const n1 = p2.sub(p1).unit().normal();

        this.insertQuadraticSimpleStroke(c1);

        if (this.currentPhase) {
            insertOuterJoin(this.left, p1, n0, n1, this.distance, 0, JoinType.Round);
            insertOuterJoin(this.right, p1, n0.neg(), n1.neg(), this.distance, 0, JoinType.Round);
        }

        this.insertQuadraticSimpleStroke(c2);
    }

    private insertQuadraticDegenerateStroke(p0: Point2, p1: Point2, p2: Point2): void {
        const c1 = new Bezier2Curve2(p0, p1, p1);
        const c2 = new Bezier2Curve2(p1, p1, p2);

        const n0 = p1.sub(p0).unit().normal();
        const n1 = p2.sub(p1).unit().normal();

        this.insertQuadraticSimpleStroke(c1);

        insertOuterJoin(this.left, p1, n0, n1, this.distance, 0, JoinType.Round);
        insertOuterJoin(this.right, p1, n0.neg(), n1.neg(), this.distance, 0, JoinType.Round);

        this.insertQuadraticSimpleStroke(c2);
    }

    private insertQuadraticSimpleDashStroke(c0: Bezier2Curve2): void {
        let lenRem = this.getDashLength() - this.currentLength;
        let len = getDashArcLengthQuadratic(c0);
        let c = c0;

        while (lenRem < len) {
            const t = getDashParameterQuadratic(c, lenRem);
            const [c1, c2] = c.splitAt(t);

            if (this.currentPhase) {
                this.insertQuadraticSimpleStroke(c1);
            } else {
                const m = c2.getTangentStart();
                this.insertMoveStroke(c2.p0, m);
            }

            this.advanceDash();

            lenRem = this.getDashLength();
            len = getDashArcLengthQuadratic(c2);
            c = c2;
        }

        this.currentLength += len;

        if (this.currentPhase) {
            this.insertQuadraticSimpleStroke(c);
        }
    }

    private insertQuadraticSimpleStroke(c: Bezier2Curve2): void {
        // Check for possible null vector (curve is a point)
        let v1 = c.getTangentStart();
        let v2 = c.getTangentEnd();

        if (!v1.isZero()) {
            const d = this.distance;

            v1 = v1.unit().normal();
            v2 = v2.unit().normal();

            v1 = v1.add(v2);

            v1 = v1.mul(2 * d).div(v1.lenSq());
            v2 = v2.mul(d);

            this.left.quadTo(c.p1.add(v1), c.p2.add(v2));
            this.right.quadTo(c.p1.add(v1.neg()), c.p2.add(v2.neg()));
        }
    }

    private resetDash(): void {
        this.leftFirst.clear();
        this.rightFirst.clear();
        this.leftMain.clear();
        this.rightMain.clear();

        this.currentIndex = this.startIndex;
        this.currentLength = this.startAdvancedLength;

        if (this.startPhase) {
            this.left = this.leftFirst;
            this.right = this.rightFirst;
            this.currentPhase = true;
            this.isFirstDash = true;
        } else {
            this.left = this.leftMain;
            this.right = this.rightMain;
            this.currentPhase = false;
            this.isFirstDash = false;
        }
    }

    private resetStroke(): void {
        this.leftMain.clear();
        this.rightMain.clear();
    }
}

export function insertStrokeJoin(
    left: Path2,
    right: Path2,
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
        if (n0.cross(n1) >= 0) {
            insertOuterJoin(left, p, n0, n1, d, ml, join);
            insertInnerJoin(right, p, n1, -d);
        } else {
            insertOuterJoin(right, p, n0, n1, -d, ml, join);
            insertInnerJoin(left, p, n1, d);
        }
    }
}

export function insertStrokeCap(path: Path2, p1: Point2, cap: CapType | CustomCap): void {
    switch (cap) {
        case CapType.Butt: {
            path.lineTo(p1);
            break;
        }
        case CapType.Square: {
            const p0 = path.getLastPoint();

            if (p0 === undefined) {
                break;
            }

            const v = p1.sub(p0).mul(0.5).normal();
            path.lineTo(p0.add(v));
            path.lineTo(p1.add(v));
            path.lineTo(p1);

            break;
        }
        case CapType.Round: {
            const p0 = path.getLastPoint();

            if (p0 === undefined) {
                break;
            }

            const v = p1.sub(p0).mul(0.5).normal();
            path.arcTo(p0.add(v), p0.add(v.sub(v.normal())));
            path.arcTo(p1.add(v), p1);

            break;
        }
        default: {
            const p0 = path.getLastPoint();

            if (p0 === undefined) {
                break;
            }

            cap(path, p0, p1);

            // Check if last point is set by the callback
            if (path.getLastPoint()?.eq(p1) === true) {
                break;
            }

            // Fallback
            path.lineTo(p1);
        }
    }
}

export function combineStroke(
    output: Path2,
    left: Path2,
    right: Path2,
    startCap: CapType | CustomCap,
    endCap: CapType | CustomCap,
): void {
    const p1 = right.getLastPoint();
    const p2 = left.getFirstPoint();

    if (p1 !== undefined && p2 !== undefined) {
        output.addPath(left, false);
        insertStrokeCap(output, p1, endCap);
        output.addPathReversed(right, true);
        insertStrokeCap(output, p2, startCap);
        output.close();
    }
}
