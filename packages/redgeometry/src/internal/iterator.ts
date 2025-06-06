import type { MeshEdge2 } from "../core/mesh.js";

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
