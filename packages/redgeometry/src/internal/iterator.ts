import type { MeshEdge2 } from "../core/mesh.js";
import { Edge2, type ReadonlyEdge2 } from "../primitives/edge.js";
import { type ReadonlyVector2 } from "../primitives/vector.js";

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
