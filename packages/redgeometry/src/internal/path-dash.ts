import { Path2, PathDashOptions } from "../core";
import { Bezier1Curve2, Bezier2Curve2, Point2, Vector2 } from "../primitives";
import { RootType, solveQuadratic } from "../utility";

export class DashState {
    public currentIndex: number;
    public currentLength: number;
    public currentPhase: boolean;
    public dashArray: number[];
    public isFirst: boolean;
    public output: Path2;
    public path: Path2;
    public pathFirst: Path2;
    public startAdvancedLength: number;
    public startIndex: number;
    public startPhase: boolean;

    constructor() {
        this.currentIndex = 0;
        this.currentLength = 0;
        this.currentPhase = false;
        this.dashArray = [];
        this.isFirst = true;
        this.output = new Path2();
        this.startAdvancedLength = 0;
        this.startIndex = 0;
        this.startPhase = false;

        const first = new Path2();

        this.path = first;
        this.pathFirst = first;
    }

    public dashDegenerateQuad(p0: Point2, p1: Point2, p2: Point2): void {
        const c1 = new Bezier2Curve2(p0, p1, p1);
        const c2 = new Bezier2Curve2(p1, p1, p2);

        this.dashQuadraticSimple(c1);
        this.dashQuadraticSimple(c2);
    }

    public dashFirst(p: Point2, m: Vector2): void {
        if (this.currentPhase && m.isZero()) {
            this.insertMove(p);
        }
    }

    public dashLinear(c0: Bezier1Curve2): void {
        let c = c0;

        // Remaining length of the current dash and full length of the line
        let dashRemainingLength = this.getDashLength() - this.currentLength;
        let length1 = getLengthLinear(c);

        while (dashRemainingLength < length1) {
            const t = getParameterAtLengthLinear(c, dashRemainingLength);

            c = c.splitAfter(t);
            length1 = getLengthLinear(c);

            if (this.currentPhase) {
                this.insertLinear(c.p0);
            } else {
                this.insertMove(c.p0);
            }

            this.advance();

            dashRemainingLength = this.getDashLength();
        }

        this.currentLength += length1;

        if (this.currentPhase) {
            this.insertLinear(c.p1);
        }
    }

    public dashQuadraticSimple(c0: Bezier2Curve2): void {
        let c = c0;

        // Remaining length of the current dash and full length of the curve
        let dashRemainingLength = this.getDashLength() - this.currentLength;
        let length2 = getLengthQuadratic(c);

        while (dashRemainingLength < length2) {
            const t = getParameterAtLengthQuadratic(c, dashRemainingLength);

            const [c1, c2] = c.splitAt(t);
            length2 = getLengthQuadratic(c2);

            if (this.currentPhase) {
                this.insertQuadratic(c1.p1, c1.p2);
            } else {
                this.insertMove(c2.p0);
            }

            this.advance();

            dashRemainingLength = this.getDashLength();
            c = c2;
        }

        this.currentLength += length2;

        if (this.currentPhase) {
            this.insertQuadratic(c.p1, c.p2);
        }
    }

    public finalizeClosed(output: Path2): void {
        if (this.startPhase) {
            output.addPath(this.pathFirst, this.currentPhase);
        }

        this.reset();
    }

    public finalizeOpen(output: Path2): void {
        if (this.startPhase) {
            output.addPath(this.pathFirst, false);
        }

        this.reset();
    }

    public initialize(output: Path2, options: PathDashOptions): void {
        this.dashArray = options.array;

        const [length, index, phase] = getDashStart(options.array, options.offset);

        this.startAdvancedLength = length;
        this.startIndex = index;
        this.startPhase = phase;

        this.output = output;

        this.reset();
    }

    private advance(): void {
        const index = getDashIndexNext(this.dashArray, this.currentIndex);

        this.currentLength = 0;
        this.currentIndex = index;
        this.currentPhase = !this.currentPhase;

        if (this.isFirst) {
            this.isFirst = false;

            this.path = this.output;
        }
    }

    private getDashLength(): number {
        return this.dashArray[this.currentIndex];
    }

    private insertLinear(p1: Point2): void {
        this.path.lineTo(p1);
    }

    private insertMove(p0: Point2): void {
        this.path.moveTo(p0);
    }

    private insertQuadratic(p1: Point2, p2: Point2): void {
        this.path.quadTo(p1, p2);
    }

    private reset(): void {
        this.pathFirst.clear();

        this.currentIndex = this.startIndex;
        this.currentLength = this.startAdvancedLength;

        if (this.startPhase) {
            this.path = this.pathFirst;
            this.currentPhase = true;
            this.isFirst = true;
        } else {
            this.path = this.output;
            this.currentPhase = false;
            this.isFirst = false;
        }
    }
}

export function getDashIndexNext(dashArray: number[], index: number): number {
    return (index + 1) % dashArray.length;
}

export function getDashStart(dashArray: number[], dashOffset: number): [number, number, boolean] {
    let length = 2 * getDashLength(dashArray);
    let offset = dashOffset % length;

    if (offset < 0) {
        offset += length;
    }

    let index = 0;
    let phase = true;

    length = dashArray[index];

    while (offset >= length) {
        offset -= length;

        index = getDashIndexNext(dashArray, index);
        phase = !phase;

        length = dashArray[index];
    }

    length = offset;

    return [length, index, phase];
}

export function getLengthLinear(c: Bezier1Curve2): number {
    return c.p1.sub(c.p0).length;
}

export function getLengthQuadratic(c: Bezier2Curve2): number {
    // https://pomax.github.io/bezierinfo/legendre-gauss.html
    // Let `wz = (z / 2) * w` and `xz = (z / 2) * x + (z / 2)` with `z = 1`,
    // so that `sum += wz * (B + xz * A).length` is the arc length
    let sum = 0;

    const [qqa, qqb] = c.getDerivativeCoefficients();

    // Weights and abscissae for `n = 4`
    sum += gaussLegendreQuadratic(0.1739274225687269, 0.06943184420297371, qqa, qqb);
    sum += gaussLegendreQuadratic(0.3260725774312731, 0.3300094782075719, qqa, qqb);
    sum += gaussLegendreQuadratic(0.3260725774312731, 0.6699905217924281, qqa, qqb);
    sum += gaussLegendreQuadratic(0.1739274225687269, 0.9305681557970263, qqa, qqb);

    return sum;
}

export function getParameterAtLengthLinear(c: Bezier1Curve2, length: number): number {
    return length / getLengthLinear(c);
}

export function getParameterAtLengthQuadratic(c: Bezier2Curve2, length: number): number {
    let t = interpolateQuadratic(c, length);

    if (t < 1) {
        const [c1, c2] = c.splitAt(t);

        // Refine solution one more time
        const d = length - getLengthQuadratic(c1);
        t += (1 - t) * interpolateQuadratic(c2, d);
    }

    return t;
}

function gaussLegendreQuadratic(wz: number, xz: number, qqa: Vector2, qqb: Vector2): number {
    // wz * (qqb + xz * qqa)
    return qqa.mul(xz).add(qqb).mul(wz).length;
}

function getDashLength(dashArray: number[]): number {
    let length = 0;

    for (const dash of dashArray) {
        length += dash;
    }

    return length;
}

function interpolateQuadratic(c: Bezier2Curve2, d: number): number {
    const d1 = c.p1.sub(c.p0).length;
    const d2 = c.p2.sub(c.p1).length;

    // Solve `(d2 - d1) * t^2 + d1 * t = d` for `t` (`t = 1` -> `d1 + d2 = d`)
    const r = solveQuadratic(d2 - d1, d1, -d);

    if (r.type !== RootType.Zero) {
        return r.x1;
    } else {
        // Fallback
        return (d1 + d2) / d;
    }
}
