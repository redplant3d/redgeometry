import type { MeshEdge2 } from "../core/mesh.js";
import { PathCommandType, type PathCommand } from "../core/path.js";
import { Bezier1Curve2, Bezier2Curve2, Bezier3Curve2, BezierRCurve2, type BezierCurve2 } from "../primitives/bezier.js";
import { Edge2 } from "../primitives/edge.js";
import { Point2 } from "../primitives/point.js";
import { assertUnreachable } from "../utility/debug.js";

export class Mesh2LnextIterator implements IterableIterator<MeshEdge2> {
    public curr: MeshEdge2;
    public last: MeshEdge2;
    public wasLast: boolean;

    constructor(first: MeshEdge2, last: MeshEdge2) {
        this.curr = first;
        this.last = last;

        this.wasLast = false;
    }

    public [Symbol.iterator](): IterableIterator<MeshEdge2> {
        return this;
    }

    public next(): IteratorResult<MeshEdge2> {
        const done = this.wasLast;
        const value = this.curr;

        this.wasLast = this.last === value || done;
        this.curr = value.lnext;

        return { done, value };
    }
}

export class Mesh2OnextIterator implements IterableIterator<MeshEdge2> {
    public curr: MeshEdge2;
    public last: MeshEdge2;
    public wasLast: boolean;

    constructor(first: MeshEdge2, last: MeshEdge2) {
        this.curr = first;
        this.last = last;

        this.wasLast = false;
    }

    public [Symbol.iterator](): IterableIterator<MeshEdge2> {
        return this;
    }

    public next(): IteratorResult<MeshEdge2> {
        const done = this.wasLast;
        const value = this.curr;

        this.wasLast = this.last === value || done;
        this.curr = value.onext;

        return { done, value };
    }
}

export class Path2CurveIterator implements IterableIterator<BezierCurve2> {
    public cIdx: number;
    public commands: PathCommand[];
    public p0: Point2;
    public pIdx: number;
    public points: Point2[];
    public ps: Point2;

    constructor(commands: PathCommand[], points: Point2[]) {
        this.commands = commands;
        this.points = points;

        this.cIdx = 0;
        this.pIdx = 0;

        this.ps = Point2.zero;
        this.p0 = Point2.zero;
    }

    public [Symbol.iterator](): IterableIterator<BezierCurve2> {
        return this;
    }

    public next(): IteratorResult<BezierCurve2> {
        const commands = this.commands;
        const points = this.points;

        while (this.cIdx < commands.length) {
            const command = commands[this.cIdx++];
            switch (command.type) {
                case PathCommandType.Move: {
                    this.ps = points[this.pIdx++];
                    this.p0 = this.ps;

                    break;
                }
                case PathCommandType.Linear: {
                    const c = new Bezier1Curve2(this.p0, points[this.pIdx++]);
                    this.p0 = c.p1;

                    return { done: false, value: c };
                }
                case PathCommandType.Quadratic: {
                    const c = new Bezier2Curve2(this.p0, points[this.pIdx++], points[this.pIdx++]);
                    this.p0 = c.p2;

                    return { done: false, value: c };
                }
                case PathCommandType.Cubic: {
                    const c = new Bezier3Curve2(this.p0, points[this.pIdx++], points[this.pIdx++], points[this.pIdx++]);
                    this.p0 = c.p3;

                    return { done: false, value: c };
                }
                case PathCommandType.Conic: {
                    const c = new BezierRCurve2(this.p0, points[this.pIdx++], points[this.pIdx++], command.w);
                    this.p0 = c.p2;

                    return { done: false, value: c };
                }
                case PathCommandType.Close: {
                    const c = new Bezier1Curve2(this.p0, this.ps);
                    this.p0 = c.p1;

                    if (!c.isPoint()) {
                        return { done: false, value: c };
                    }

                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }

        return { done: true, value: undefined };
    }
}

export class Polygon2EdgeIterator implements IterableIterator<Edge2> {
    public idx: number;
    public points: Point2[];

    constructor(points: Point2[]) {
        this.points = points;
        this.idx = 1;
    }

    public [Symbol.iterator](): IterableIterator<Edge2> {
        return this;
    }

    public next(): IteratorResult<Edge2> {
        const points = this.points;
        const idx = this.idx;

        if (idx < points.length) {
            const e = new Edge2(points[idx - 1], points[idx]);
            this.idx += 1;
            return { done: false, value: e };
        } else if (idx === points.length) {
            const e = new Edge2(points[idx - 1], points[0]);
            this.idx += 1;
            return { done: false, value: e };
        } else {
            return { done: true, value: undefined };
        }
    }
}
