import type { PathDashOptions } from "../core/path-options.js";
import { Path2 } from "../core/path.js";
import { Bezier2Curve2, type Bezier1Curve2 } from "../primitives/bezier.js";
import type { Point2 } from "../primitives/point.js";
import type { Vector2 } from "../primitives/vector.js";
import { getArcLengthQuadratic, getParameterAtArcLengthQuadratic } from "./bezier.js";

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

    public constructor() {
        this.currentIndex = 0;
        this.currentLength = 0;
        this.currentPhase = false;
        this.dashArray = [];
        this.isFirst = true;
        this.output = Path2.createEmpty();
        this.startAdvancedLength = 0;
        this.startIndex = 0;
        this.startPhase = false;

        const first = Path2.createEmpty();

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
        let lenRem = this.getDashLength() - this.currentLength;
        let len = getDashArcLengthLinear(c0);
        let c = c0;

        while (lenRem < len) {
            const t = getDashParameterLinear(c, lenRem);
            const c2 = c.splitAfter(t);

            if (this.currentPhase) {
                this.insertLinear(c2.p0);
            } else {
                this.insertMove(c2.p0);
            }

            this.advance();

            lenRem = this.getDashLength();
            len = getDashArcLengthLinear(c2);
            c = c2;
        }

        this.currentLength += len;

        if (this.currentPhase) {
            this.insertLinear(c.p1);
        }
    }

    public dashQuadraticSimple(c0: Bezier2Curve2): void {
        let lenRem = this.getDashLength() - this.currentLength;
        let len = getDashArcLengthQuadratic(c0);
        let c = c0;

        while (lenRem < len) {
            const t = getDashParameterQuadratic(c, lenRem);
            const [c1, c2] = c.splitAt(t);

            if (this.currentPhase) {
                this.insertQuadratic(c1.p1, c1.p2);
            } else {
                this.insertMove(c1.p2);
            }

            this.advance();

            lenRem = this.getDashLength();
            len = getDashArcLengthQuadratic(c2);
            c = c2;
        }

        this.currentLength += len;

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
    let length = 2 * getDashArrayLength(dashArray);
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

export function getDashArcLengthLinear(c: Bezier1Curve2): number {
    return c.p1.sub(c.p0).len();
}

export function getDashParameterLinear(c: Bezier1Curve2, length: number): number {
    return length / getDashArcLengthLinear(c);
}

export function getDashArcLengthQuadratic(c: Bezier2Curve2): number {
    return getArcLengthQuadratic(c);
}

export function getDashParameterQuadratic(c: Bezier2Curve2, length: number): number {
    const t = getParameterAtArcLengthQuadratic(c, length);

    if (t >= 1) {
        // Fallback
        return 1;
    }

    // Refine solution one more time
    const [c1, c2] = c.splitAt(t);
    const length2 = length - getDashArcLengthQuadratic(c1);
    const t2 = (1 - t) * getParameterAtArcLengthQuadratic(c2, length2);

    return t + t2;
}

function getDashArrayLength(dashArray: number[]): number {
    let length = 0;

    for (const dash of dashArray) {
        length += dash;
    }

    return length;
}
