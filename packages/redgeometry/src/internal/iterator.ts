import type { MeshEdge2 } from "../core/mesh.js";
import { type PathCommand } from "../core/path.js";
import {
    Bezier1Curve2,
    Bezier2Curve2,
    Bezier3Curve2,
    BezierRCurve2,
    type ReadonlyBezierCurve2,
} from "../primitives/bezier.js";
import { Edge2, type ReadonlyEdge2 } from "../primitives/edge.js";
import { Vector2, type ReadonlyVector2 } from "../primitives/vector.js";
import { assertUnreachable } from "../utility/debug.js";

export class Mesh2LnextIterator implements IterableIterator<MeshEdge2> {
    public curr: MeshEdge2;
    public last: MeshEdge2;
    public wasLast: boolean;

    public constructor(first: MeshEdge2, last: MeshEdge2) {
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

    public constructor(first: MeshEdge2, last: MeshEdge2) {
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

export class Path2CurveIterator implements IterableIterator<ReadonlyBezierCurve2> {
    public cIdx: number;
    public commands: PathCommand[];
    public p0: ReadonlyVector2;
    public pIdx: number;
    public points: ReadonlyVector2[];
    public ps: ReadonlyVector2;

    public constructor(commands: PathCommand[], points: ReadonlyVector2[]) {
        this.commands = commands;
        this.points = points;

        this.cIdx = 0;
        this.pIdx = 0;

        this.ps = Vector2.ZERO;
        this.p0 = Vector2.ZERO;
    }

    public [Symbol.iterator](): IterableIterator<ReadonlyBezierCurve2> {
        return this;
    }

    public next(): IteratorResult<ReadonlyBezierCurve2> {
        const commands = this.commands;
        const points = this.points;

        while (this.cIdx < commands.length) {
            const command = commands[this.cIdx++];
            switch (command.type) {
                case 0 /* MOVE */: {
                    this.ps = points[this.pIdx++];
                    this.p0 = this.ps;

                    break;
                }
                case 1 /* LINEAR */: {
                    const c = new Bezier1Curve2(this.p0, points[this.pIdx++]);
                    this.p0 = c.p1;

                    return { done: false, value: c };
                }
                case 2 /* QUADRATIC */: {
                    const c = new Bezier2Curve2(this.p0, points[this.pIdx++], points[this.pIdx++]);
                    this.p0 = c.p2;

                    return { done: false, value: c };
                }
                case 3 /* CUBIC */: {
                    const c = new Bezier3Curve2(this.p0, points[this.pIdx++], points[this.pIdx++], points[this.pIdx++]);
                    this.p0 = c.p3;

                    return { done: false, value: c };
                }
                case 4 /* CONIC */: {
                    const c = new BezierRCurve2(this.p0, points[this.pIdx++], points[this.pIdx++], command.w);
                    this.p0 = c.p2;

                    return { done: false, value: c };
                }
                case 5 /* CLOSE */: {
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

export class Polygon2EdgeIterator implements IterableIterator<ReadonlyEdge2> {
    public idx: number;
    public points: ReadonlyVector2[];

    public constructor(points: ReadonlyVector2[]) {
        this.points = points;
        this.idx = 1;
    }

    public [Symbol.iterator](): IterableIterator<ReadonlyEdge2> {
        return this;
    }

    public next(): IteratorResult<ReadonlyEdge2> {
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
