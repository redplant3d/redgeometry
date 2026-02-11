import type { Path2 } from "../core/path.ts";
import { isWindingInside, WindingOperator, type CustomWindingOperator } from "../core/winding.ts";
import { Bezier1Curve2 } from "../primitives/bezier.ts";
import { MinMaxBox2 } from "../primitives/box.ts";
import { Edge2 } from "../primitives/edge.ts";
import { Vector2, type ReadonlyVector2 } from "../primitives/vector.ts";
import { assertDebug, log, throwError, ValidationHelper } from "../utility/debug.ts";
import type { Nominal } from "../utility/types.ts";

export type MeshVertexIdx = Nominal<number, "MeshVertexIdx">;
export type MeshEdgeIdx = Nominal<number, "MeshEdgeIdx">;
export type MeshFaceIdx = Nominal<number, "MeshFaceIdx">;
export type MeshLinkIdx = Nominal<number, "MeshEdgeLinkIdx">;
export type MeshLoopIdx = Nominal<number, "MeshLoopIdx">;
export type MeshShellIdx = Nominal<number, "MeshShellIdx">;

export type MaybeMeshVertexIdx = MeshVertexIdx | -1;
export type MaybeMeshEdgeIdx = MeshEdgeIdx | -1;
export type MaybeMeshFaceIdx = MeshFaceIdx | -1;
export type MaybeMeshLinkIdx = MeshLinkIdx | -1;
export type MaybeMeshLoopIdx = MeshLoopIdx | -1;
export type MaybeMeshShellIdx = MeshShellIdx | -1;

export type MaybeValue<T> = T | null;

export type MeshVerticesLike<T, U> = {
    readonly data: MaybeValue<T>[];
    readonly firstLink: MaybeMeshLinkIdx[];
    readonly free: MeshVertexIdx[];
    readonly length: number;
    readonly pos: MaybeValue<U>[];
};

export type MeshEdgesLike<T> = {
    readonly data: MaybeValue<T>[];
    readonly free: MeshEdgeIdx[];
    readonly length: number;
    readonly link: MaybeMeshLinkIdx[];
};

export type MeshFacesLike<T> = {
    readonly data: MaybeValue<T>[];
    readonly firstLoop: MaybeMeshLoopIdx[];
    readonly free: MeshFaceIdx[];
    readonly length: number;
    readonly next: MaybeMeshFaceIdx[];
    readonly prev: MaybeMeshFaceIdx[];
    readonly shell: MaybeMeshShellIdx[];
};

export type MeshLinksLike = {
    readonly edge: MaybeMeshEdgeIdx[];
    readonly free: MeshLinkIdx[];
    readonly length: number;
    readonly lnext: MaybeMeshLinkIdx[];
    readonly loop: MaybeMeshLoopIdx[];
    readonly onext: MaybeMeshLinkIdx[];
    readonly sym: MaybeMeshLinkIdx[];
    readonly vertex: MaybeMeshVertexIdx[];
};

export type MeshLoopsLike = {
    readonly face: MaybeMeshFaceIdx[];
    readonly firstLink: MaybeMeshLinkIdx[];
    readonly free: MeshLoopIdx[];
    readonly length: number;
    readonly next: MaybeMeshLoopIdx[];
    readonly prev: MaybeMeshLoopIdx[];
};

export type MeshShellsLike<S> = {
    readonly data: MaybeValue<S>[];
    readonly firstFace: MaybeMeshFaceIdx[];
    readonly free: MeshShellIdx[];
    readonly length: number;
    readonly next: MaybeMeshShellIdx[];
    readonly prev: MaybeMeshShellIdx[];
};

export type MeshLike<S, F, E, V, P> = {
    readonly vertices: MeshVerticesLike<V, P>;
    readonly edges: MeshEdgesLike<E>;
    readonly faces: MeshFacesLike<F>;
    readonly links: MeshLinksLike;
    readonly loops: MeshLoopsLike;
    readonly shells: MeshShellsLike<S>;
};

export type Mesh2<S, F, E, V> = Mesh<S | null, F | null, E | null, V | null, ReadonlyVector2>;

export class MeshVertices<T, U> {
    public data: MaybeValue<T>[];
    public firstLink: MaybeMeshLinkIdx[];
    public free: MeshVertexIdx[];
    public length: number;
    public pos: MaybeValue<U>[];

    constructor(
        data: MaybeValue<T>[],
        pos: MaybeValue<U>[],
        firstLink: MaybeMeshLinkIdx[],
        free: MeshVertexIdx[],
        length: number,
    ) {
        this.data = data;
        this.pos = pos;
        this.firstLink = firstLink;
        this.free = free;
        this.length = length;
    }

    public static createEmpty<T, U>(): MeshVertices<T, U> {
        return new MeshVertices([], [], [], [], 0);
    }

    public static fromObject<T, U>(obj: MeshVerticesLike<T, U>): MeshVertices<T, U> {
        const data = obj.data.slice();
        const pos = obj.pos.slice();
        const firstLink = obj.firstLink.slice();
        const free = obj.free.slice();
        const length = obj.length;

        return new MeshVertices(data, pos, firstLink, free, length);
    }

    public static toObject<T, U>(vertices: MeshVertices<T, U>): MeshVerticesLike<T, U> {
        const data = vertices.data.slice();
        const pos = vertices.pos.slice();
        const firstLink = vertices.firstLink.slice();
        const free = vertices.free.slice();
        const length = vertices.length;

        return { data, pos, firstLink, free, length };
    }

    public clear(): void {
        this.data = [];
        this.pos = [];
        this.firstLink = [];
        this.free = [];
        this.length = 0;
    }

    /**
     * Note: Only data references will be cloned (shallow copy).
     */
    public clone(): MeshVertices<T, U> {
        const data = this.data.slice();
        const pos = this.pos.slice();
        const firstLink = this.firstLink.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshVertices(data, pos, firstLink, free, length);
    }

    public copy(dest: MeshVertexIdx, src: MeshVertexIdx): void {
        this.data[dest] = this.data[src];
        this.pos[dest] = this.pos[src];
        this.firstLink[dest] = this.firstLink[src];
    }

    public create(data: T, pos: U): MeshVertexIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshVertexIdx;
            this.data.push(data);
            this.pos.push(pos);
            this.firstLink.push(-1);
            this.length = idx + 1;
        } else {
            this.data[idx] = data;
            this.pos[idx] = pos;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshVertexIdx> {
        return new MeshPrimitiveIterator(this.firstLink);
    }

    public destroy(idx: MeshVertexIdx): void {
        this.data[idx] = null;
        this.pos[idx] = null;
        this.free.push(idx);
    }

    public getData(idx: MeshVertexIdx): T {
        return this.data[idx] as T;
    }

    public getFirstLink(idx: MeshVertexIdx): MeshLinkIdx {
        return this.firstLink[idx] as MeshLinkIdx;
    }

    public getPos(idx: MeshVertexIdx): U {
        return this.pos[idx] as U;
    }

    public init(idx: MeshVertexIdx, firstLink: MeshLinkIdx): void {
        this.firstLink[idx] = firstLink;
    }

    public isValid(idx: MeshVertexIdx): boolean {
        return idx < this.length ? this.firstLink[idx] >= 0 : false;
    }

    public reset(idx: MeshVertexIdx): void {
        this.firstLink[idx] = -1;
    }

    public setData(idx: MeshVertexIdx, data: T): void {
        this.data[idx] = data;
    }

    public setFirstLink(idx: MeshVertexIdx, firstLink: MeshLinkIdx): void {
        this.firstLink[idx] = firstLink;
    }

    public setPos(idx: MeshVertexIdx, pos: U): void {
        this.pos[idx] = pos;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.data.splice(lengthMin);
        this.pos.splice(lengthMin);
        this.firstLink.splice(lengthMin);
        this.length = lengthMin;
    }
}

export class MeshEdges<T> {
    public data: MaybeValue<T>[];
    public free: MeshEdgeIdx[];
    public length: number;
    public link: MaybeMeshLinkIdx[];

    constructor(data: MaybeValue<T>[], link: MaybeMeshLinkIdx[], free: MeshEdgeIdx[], length: number) {
        this.data = data;
        this.link = link;
        this.free = free;
        this.length = length;
    }

    public static createEmpty<T>(): MeshEdges<T> {
        return new MeshEdges([], [], [], 0);
    }

    public static fromObject<T>(obj: MeshEdgesLike<T>): MeshEdges<T> {
        const data = obj.data.slice();
        const link = obj.link.slice();
        const free = obj.free.slice();
        const length = obj.length;

        return new MeshEdges(data, link, free, length);
    }

    public static toObject<T>(edges: MeshEdges<T>): MeshEdgesLike<T> {
        const data = edges.data.slice();
        const link = edges.link.slice();
        const free = edges.free.slice();
        const length = edges.length;

        return { data, link, free, length };
    }

    public clear(): void {
        this.data = [];
        this.link = [];
        this.free = [];
        this.length = 0;
    }

    /**
     * Note: Only data references will be cloned (shallow copy).
     */
    public clone(): MeshEdges<T> {
        const data = this.data.slice();
        const link = this.link.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshEdges(data, link, free, length);
    }

    public copy(dest: MeshEdgeIdx, src: MeshEdgeIdx): void {
        this.data[dest] = this.data[src];
        this.link[dest] = this.link[src];
    }

    public create(data: T): MeshEdgeIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshEdgeIdx;
            this.data.push(data);
            this.link.push(-1);
            this.length = idx + 1;
        } else {
            this.data[idx] = data;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshEdgeIdx> {
        return new MeshPrimitiveIterator(this.link);
    }

    public destroy(idx: MeshEdgeIdx): void {
        this.data[idx] = null;
        this.free.push(idx);
    }

    public getData(idx: MeshEdgeIdx): T {
        return this.data[idx] as T;
    }

    public getLink(idx: MeshEdgeIdx): MeshLinkIdx {
        return this.link[idx] as MeshLinkIdx;
    }

    public init(idx: MeshEdgeIdx, link: MeshLinkIdx): void {
        this.link[idx] = link;
    }

    public isValid(idx: MeshEdgeIdx): boolean {
        return idx < this.length ? this.link[idx] >= 0 : false;
    }

    public reset(idx: MeshEdgeIdx): void {
        this.link[idx] = -1;
    }

    public setData(idx: MeshEdgeIdx, data: T): void {
        this.data[idx] = data;
    }

    public setLink(idx: MaybeMeshEdgeIdx, link: MeshLinkIdx): void {
        this.link[idx] = link;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.data.splice(lengthMin);
        this.link.splice(lengthMin);
        this.length = lengthMin;
    }
}

export class MeshFaces<T> {
    public data: MaybeValue<T>[];
    public firstLoop: MaybeMeshLoopIdx[];
    public free: MeshFaceIdx[];
    public length: number;
    public next: MaybeMeshFaceIdx[];
    public prev: MaybeMeshFaceIdx[];
    public shell: MaybeMeshShellIdx[];

    constructor(
        data: MaybeValue<T>[],
        shell: MaybeMeshShellIdx[],
        firstLoop: MaybeMeshLoopIdx[],
        next: MaybeMeshFaceIdx[],
        prev: MaybeMeshFaceIdx[],
        free: MeshFaceIdx[],
        length: number,
    ) {
        this.data = data;
        this.shell = shell;
        this.firstLoop = firstLoop;
        this.next = next;
        this.prev = prev;
        this.free = free;
        this.length = length;
    }

    public static createEmpty<T>(): MeshFaces<T> {
        return new MeshFaces([], [], [], [], [], [], 0);
    }

    public static fromObject<T>(obj: MeshFacesLike<T>): MeshFaces<T> {
        const data = obj.data.slice();
        const shell = obj.shell.slice();
        const firstLoop = obj.firstLoop.slice();
        const free = obj.free.slice();
        const next = obj.next.slice();
        const prev = obj.prev.slice();
        const length = obj.length;

        return new MeshFaces(data, shell, firstLoop, next, prev, free, length);
    }

    public static toObject<T>(faces: MeshFaces<T>): MeshFacesLike<T> {
        const data = faces.data.slice();
        const shell = faces.shell.slice();
        const firstLoop = faces.firstLoop.slice();
        const free = faces.free.slice();
        const next = faces.next.slice();
        const prev = faces.prev.slice();
        const length = faces.length;

        return { data, shell, firstLoop, next, prev, free, length };
    }

    public clear(): void {
        this.data = [];
        this.firstLoop = [];
        this.free = [];
        this.next = [];
        this.prev = [];
        this.shell = [];
        this.length = 0;
    }

    /**
     * Note: Only data references will be cloned (shallow copy).
     */
    public clone(): MeshFaces<T> {
        const data = this.data.slice();
        const shell = this.shell.slice();
        const firstLoop = this.firstLoop.slice();
        const next = this.next.slice();
        const prev = this.prev.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshFaces(data, shell, firstLoop, next, prev, free, length);
    }

    public copy(dest: MeshFaceIdx, src: MeshFaceIdx): void {
        this.data[dest] = this.data[src];
        this.shell[dest] = this.shell[src];
        this.firstLoop[dest] = this.firstLoop[src];
        this.next[dest] = this.next[src];
        this.prev[dest] = this.prev[src];
    }

    public create(data: T): MeshFaceIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshFaceIdx;
            this.data.push(data);
            this.shell.push(-1);
            this.firstLoop.push(-1);
            this.next.push(-1);
            this.prev.push(-1);
            this.length = idx + 1;
        } else {
            this.data[idx] = data;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshFaceIdx> {
        return new MeshPrimitiveIterator(this.firstLoop);
    }

    public createIteratorNext(firstFace: MaybeMeshFaceIdx): MeshPrimitiveNextIterator<MeshFaceIdx> {
        return new MeshPrimitiveNextIterator(this.next, firstFace);
    }

    public destroy(idx: MeshFaceIdx): void {
        this.data[idx] = null;
        this.free.push(idx);
    }

    public getData(idx: MeshFaceIdx): T {
        return this.data[idx] as T;
    }

    public getFirstLoop(idx: MeshFaceIdx): MeshLoopIdx {
        return this.firstLoop[idx] as MeshLoopIdx;
    }

    public getNext(idx: MeshFaceIdx): MeshFaceIdx {
        return this.next[idx] as MeshFaceIdx;
    }

    public getPrev(idx: MeshFaceIdx): MeshFaceIdx {
        return this.prev[idx] as MeshFaceIdx;
    }

    public getShell(idx: MeshFaceIdx): MeshShellIdx {
        return this.shell[idx] as MeshShellIdx;
    }

    public init(idx: MeshFaceIdx, shell: MeshShellIdx, firstLoop: MeshLoopIdx): void {
        this.shell[idx] = shell;
        this.firstLoop[idx] = firstLoop;
        this.next[idx] = idx;
        this.prev[idx] = idx;
    }

    /**
     * Inserts face at `idx` before `face`.
     */
    public insertFace(idx: MeshFaceIdx, face: MeshFaceIdx): void {
        const facePrev = this.getPrev(face);

        this.setNext(facePrev, idx);
        this.setPrev(idx, facePrev);

        this.setNext(idx, face);
        this.setPrev(face, idx);
    }

    public isValid(idx: MeshFaceIdx): boolean {
        return idx < this.length ? this.firstLoop[idx] >= 0 : false;
    }

    /**
     * Removes face `idx` from its chain.
     *
     * Note: Does nothing if the face has already been removed.
     */
    public removeFace(idx: MeshFaceIdx): void {
        const idxNext = this.getNext(idx);
        const idxPrev = this.getPrev(idx);

        this.setNext(idxPrev, idxNext);
        this.setPrev(idxNext, idxPrev);

        this.setNext(idx, idx);
        this.setPrev(idx, idx);
    }

    public reset(idx: MeshFaceIdx): void {
        this.firstLoop[idx] = -1;
        this.next[idx] = -1;
        this.prev[idx] = -1;
        this.shell[idx] = -1;
    }

    public setData(idx: MeshFaceIdx, data: T): void {
        this.data[idx] = data;
    }

    public setFirstLoop(idx: MeshFaceIdx, firstLoop: MeshLoopIdx): void {
        this.firstLoop[idx] = firstLoop;
    }

    public setNext(idx: MeshFaceIdx, next: MeshFaceIdx): void {
        this.next[idx] = next;
    }

    public setPrev(idx: MeshFaceIdx, prev: MeshFaceIdx): void {
        this.prev[idx] = prev;
    }

    public setShell(idx: MeshFaceIdx, shell: MeshShellIdx): void {
        this.shell[idx] = shell;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.data.splice(lengthMin);
        this.shell.splice(lengthMin);
        this.firstLoop.splice(lengthMin);
        this.next.splice(lengthMin);
        this.prev.splice(lengthMin);
        this.length = lengthMin;
    }
}

export class MeshLinks {
    public edge: MaybeMeshEdgeIdx[];
    public free: MeshLinkIdx[];
    public length: number;
    public lnext: MaybeMeshLinkIdx[];
    public loop: MaybeMeshLoopIdx[];
    public onext: MaybeMeshLinkIdx[];
    public sym: MaybeMeshLinkIdx[];
    public vertex: MaybeMeshVertexIdx[];

    constructor(
        edge: MaybeMeshEdgeIdx[],
        loop: MaybeMeshLoopIdx[],
        lnext: MaybeMeshLinkIdx[],
        onext: MaybeMeshLinkIdx[],
        vertex: MaybeMeshVertexIdx[],
        sym: MaybeMeshLinkIdx[],
        free: MeshLinkIdx[],
        length: number,
    ) {
        this.edge = edge;
        this.loop = loop;
        this.lnext = lnext;
        this.onext = onext;
        this.vertex = vertex;
        this.sym = sym;
        this.free = free;
        this.length = length;
    }

    public static createEmpty(): MeshLinks {
        return new MeshLinks([], [], [], [], [], [], [], 0);
    }

    public static fromObject(obj: MeshLinksLike): MeshLinks {
        const edge = obj.edge.slice();
        const loop = obj.loop.slice();
        const lnext = obj.lnext.slice();
        const onext = obj.onext.slice();
        const vertex = obj.vertex.slice();
        const sym = obj.sym.slice();
        const free = obj.free.slice();
        const length = obj.length;

        return new MeshLinks(edge, loop, lnext, onext, vertex, sym, free, length);
    }

    public static toObject(links: MeshLinks): MeshLinksLike {
        const edge = links.edge.slice();
        const loop = links.loop.slice();
        const lnext = links.lnext.slice();
        const onext = links.onext.slice();
        const vertex = links.vertex.slice();
        const sym = links.sym.slice();
        const free = links.free.slice();
        const length = links.length;

        return { edge, loop, lnext, onext, vertex, sym, free, length };
    }

    public clear(): void {
        this.edge = [];
        this.loop = [];
        this.lnext = [];
        this.onext = [];
        this.vertex = [];
        this.sym = [];
        this.free = [];
        this.length = 0;
    }

    public clone(): MeshLinks {
        const edge = this.edge.slice();
        const loop = this.loop.slice();
        const lnext = this.lnext.slice();
        const onext = this.onext.slice();
        const vertex = this.vertex.slice();
        const sym = this.sym.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshLinks(edge, loop, lnext, onext, vertex, sym, free, length);
    }

    public copy(dest: MeshLinkIdx, src: MeshLinkIdx): void {
        this.edge[dest] = this.edge[src];
        this.loop[dest] = this.loop[src];
        this.lnext[dest] = this.lnext[src];
        this.onext[dest] = this.onext[src];
        this.vertex[dest] = this.vertex[src];
        this.sym[dest] = this.sym[src];
    }

    public create(): MeshLinkIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshLinkIdx;
            this.edge.push(-1);
            this.loop.push(-1);
            this.lnext.push(-1);
            this.onext.push(-1);
            this.vertex.push(-1);
            this.sym.push(-1);
            this.length = idx + 1;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshLinkIdx> {
        return new MeshPrimitiveIterator(this.loop);
    }

    public createIteratorLnext(firstLink: MaybeMeshLinkIdx): MeshPrimitiveNextIterator<MeshLinkIdx> {
        return new MeshPrimitiveNextIterator(this.lnext, firstLink);
    }

    public createIteratorOnext(firstLink: MaybeMeshLinkIdx): MeshPrimitiveNextIterator<MeshLinkIdx> {
        return new MeshPrimitiveNextIterator(this.onext, firstLink);
    }

    public destroy(idx: MeshLinkIdx): void {
        this.free.push(idx);
    }

    public getEdge(idx: MeshLinkIdx): MaybeMeshEdgeIdx {
        return this.edge[idx];
    }

    public getEdgeSym(idx: MeshLinkIdx): MaybeMeshEdgeIdx {
        const sym = this.sym[idx];
        return this.edge[sym];
    }

    public getLnext(idx: MeshLinkIdx): MeshLinkIdx {
        return this.lnext[idx] as MeshLinkIdx;
    }

    public getLoop(idx: MeshLinkIdx): MeshLoopIdx {
        return this.loop[idx] as MeshLoopIdx;
    }

    public getLoopSym(idx: MeshLinkIdx): MeshLoopIdx {
        const sym = this.sym[idx];
        return this.loop[sym] as MeshLoopIdx;
    }

    public getLprev(idx: MeshLinkIdx): MeshLinkIdx {
        const onext = this.onext[idx];
        return this.sym[onext] as MeshLinkIdx;
    }

    public getOnext(idx: MeshLinkIdx): MeshLinkIdx {
        return this.onext[idx] as MeshLinkIdx;
    }

    public getOprev(idx: MeshLinkIdx): MeshLinkIdx {
        const sym = this.sym[idx];
        return this.lnext[sym] as MeshLinkIdx;
    }

    public getSym(idx: MeshLinkIdx): MeshLinkIdx {
        return this.sym[idx] as MeshLinkIdx;
    }

    public getVertex(idx: MeshLinkIdx): MeshVertexIdx {
        return this.vertex[idx] as MeshVertexIdx;
    }

    public getVertexSym(idx: MeshLinkIdx): MeshVertexIdx {
        const sym = this.sym[idx];
        return this.vertex[sym] as MeshVertexIdx;
    }

    public init(
        idx: MeshLinkIdx,
        sym: MeshLinkIdx,
        edge: MaybeMeshEdgeIdx,
        vertex: MeshVertexIdx,
        loop: MeshLoopIdx,
    ): void {
        this.edge[idx] = edge;
        this.loop[idx] = loop;
        this.lnext[idx] = sym;
        this.onext[idx] = idx;
        this.vertex[idx] = vertex;
        this.sym[idx] = sym;
    }

    public isValid(idx: MeshLinkIdx): boolean {
        return idx < this.length ? this.loop[idx] >= 0 : false;
    }

    public reset(idx: MeshLinkIdx): void {
        this.edge[idx] = -1;
        this.loop[idx] = -1;
        this.lnext[idx] = -1;
        this.onext[idx] = -1;
        this.vertex[idx] = -1;
        this.sym[idx] = -1;
    }

    public setEdge(idx: MeshLinkIdx, edge: MeshEdgeIdx): void {
        this.edge[idx] = edge;
    }

    public setEdgeSym(idx: MeshLinkIdx, edge: MeshEdgeIdx): void {
        const sym = this.sym[idx];
        this.edge[sym] = edge;
    }

    public setLnext(idx: MeshLinkIdx, lnext: MeshLinkIdx): void {
        this.lnext[idx] = lnext;
    }

    public setLoop(idx: MeshLinkIdx, loop: MeshLoopIdx): void {
        this.loop[idx] = loop;
    }

    public setLoopSym(idx: MeshLinkIdx, loop: MeshLoopIdx): void {
        const sym = this.sym[idx];
        this.loop[sym] = loop;
    }

    public setLprev(idx: MeshLinkIdx, lprev: MeshLinkIdx): void {
        const onext = this.onext[idx];
        this.sym[onext] = lprev;
    }

    public setOnext(idx: MeshLinkIdx, onext: MeshLinkIdx): void {
        this.onext[idx] = onext;
    }

    public setOprev(idx: MeshLinkIdx, oprev: MeshLinkIdx): void {
        const sym = this.sym[idx];
        this.lnext[sym] = oprev;
    }

    public setSym(idx: MeshLinkIdx, sym: MeshLinkIdx): void {
        this.sym[idx] = sym;
    }

    public setVertex(idx: MeshLinkIdx, vertex: MeshVertexIdx): void {
        this.vertex[idx] = vertex;
    }

    public setVertexSym(idx: MeshLinkIdx, vertex: MeshVertexIdx): void {
        const sym = this.sym[idx];
        this.vertex[sym] = vertex;
    }

    /**
     * Splicing of the two mesh links `link1` and `link2`.
     *
     * Note: For a valid mesh topology, `link2` needs to lie directly between `link1` and `link1.onext`.
     */
    public splice(link1: MeshLinkIdx, link2: MeshLinkIdx): void {
        // Splicing (see reference)
        const linkOnext1 = this.onext[link1];
        const linkOnext2 = this.onext[link2];

        const linkOnextSym1 = this.sym[linkOnext1];
        const linkOnextSym2 = this.sym[linkOnext2];

        this.lnext[linkOnextSym1] = link2;
        this.lnext[linkOnextSym2] = link1;

        this.onext[link1] = linkOnext2;
        this.onext[link2] = linkOnext1;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.edge.splice(lengthMin);
        this.loop.splice(lengthMin);
        this.lnext.splice(lengthMin);
        this.onext.splice(lengthMin);
        this.vertex.splice(lengthMin);
        this.sym.splice(lengthMin);
        this.length = lengthMin;
    }

    public updateLoop(linkFrom: MeshLinkIdx, linkTo: MeshLinkIdx, loop: MeshLoopIdx): void {
        let link = linkFrom;
        do {
            this.setLoop(link, loop);
            link = this.getLnext(link);
        } while (link !== linkTo);
    }

    public updateVertex(linkFrom: MeshLinkIdx, linkTo: MeshLinkIdx, vertex: MeshVertexIdx): void {
        let link = linkFrom;
        do {
            this.setVertex(link, vertex);
            link = this.getOnext(link);
        } while (link !== linkTo);
    }
}

export class MeshLoops {
    public face: MaybeMeshFaceIdx[];
    public firstLink: MaybeMeshLinkIdx[];
    public free: MeshLoopIdx[];
    public length: number;
    public next: MaybeMeshLoopIdx[];
    public prev: MaybeMeshLoopIdx[];

    constructor(
        face: MaybeMeshFaceIdx[],
        firstLink: MaybeMeshLinkIdx[],
        next: MaybeMeshLoopIdx[],
        prev: MaybeMeshLoopIdx[],
        free: MeshLoopIdx[],
        length: number,
    ) {
        this.face = face;
        this.firstLink = firstLink;
        this.next = next;
        this.prev = prev;
        this.free = free;
        this.length = length;
    }

    public static createEmpty(): MeshLoops {
        return new MeshLoops([], [], [], [], [], 0);
    }

    public static fromObject(obj: MeshLoopsLike): MeshLoops {
        const face = obj.face.slice();
        const firstLink = obj.firstLink.slice();
        const next = obj.next.slice();
        const prev = obj.prev.slice();
        const free = obj.free.slice();
        const length = obj.length;

        return new MeshLoops(face, firstLink, next, prev, free, length);
    }

    public static toObject(loops: MeshLoops): MeshLoopsLike {
        const face = loops.face.slice();
        const firstLink = loops.firstLink.slice();
        const next = loops.next.slice();
        const prev = loops.prev.slice();
        const free = loops.free.slice();
        const length = loops.length;

        return { face, firstLink, next, prev, free, length };
    }

    public clear(): void {
        this.face = [];
        this.firstLink = [];
        this.next = [];
        this.prev = [];
        this.free = [];
        this.length = 0;
    }

    public clone(): MeshLoops {
        const face = this.face.slice();
        const firstLink = this.firstLink.slice();
        const next = this.next.slice();
        const prev = this.prev.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshLoops(face, firstLink, next, prev, free, length);
    }

    public copy(dest: MeshLoopIdx, src: MeshLoopIdx): void {
        this.face[dest] = this.face[src];
        this.firstLink[dest] = this.firstLink[src];
        this.next[dest] = this.next[src];
        this.prev[dest] = this.prev[src];
    }

    public create(): MeshLoopIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshLoopIdx;
            this.face.push(-1);
            this.firstLink.push(-1);
            this.next.push(-1);
            this.prev.push(-1);
            this.length = idx + 1;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshLoopIdx> {
        return new MeshPrimitiveIterator(this.firstLink);
    }

    public createIteratorNext(firstLoop: MaybeMeshLoopIdx): MeshPrimitiveNextIterator<MeshLoopIdx> {
        return new MeshPrimitiveNextIterator(this.next, firstLoop);
    }

    public destroy(idx: MeshLoopIdx): void {
        this.free.push(idx);
    }

    public getFace(idx: MeshLoopIdx): MeshFaceIdx {
        return this.face[idx] as MeshFaceIdx;
    }

    public getFirstLink(idx: MeshLoopIdx): MeshLinkIdx {
        return this.firstLink[idx] as MeshLinkIdx;
    }

    public getNext(idx: MeshLoopIdx): MeshLoopIdx {
        return this.next[idx] as MeshLoopIdx;
    }

    public getPrev(idx: MeshLoopIdx): MeshLoopIdx {
        return this.prev[idx] as MeshLoopIdx;
    }

    public init(idx: MeshLoopIdx, face: MeshFaceIdx, firstLink: MeshLinkIdx): void {
        this.face[idx] = face;
        this.firstLink[idx] = firstLink;
        this.next[idx] = idx;
        this.prev[idx] = idx;
    }

    /**
     * Inserts loop at `idx` before `loop`.
     */
    public insertLoop(idx: MeshLoopIdx, loop: MeshLoopIdx): void {
        const loopPrev = this.getPrev(loop);

        this.setNext(loopPrev, idx);
        this.setPrev(idx, loopPrev);

        this.setNext(idx, loop);
        this.setPrev(loop, idx);
    }

    public isValid(idx: MeshLoopIdx): boolean {
        return idx < this.length ? this.firstLink[idx] >= 0 : false;
    }

    /**
     * Merges chain starting at `idx` before `loop`.
     */
    public mergeLoops(idx: MeshLoopIdx, loop: MeshLoopIdx): void {
        const idxPrev = this.getPrev(idx);
        const loopPrev = this.getPrev(loop);

        this.setNext(loopPrev, idx);
        this.setPrev(idx, loopPrev);

        this.setNext(idxPrev, loop);
        this.setPrev(loop, idxPrev);
    }

    /**
     * Removes loop `idx` from its chain.
     *
     * Note: Does nothing if the loop has already been removed.
     */
    public removeLoop(idx: MeshLoopIdx): void {
        const idxNext = this.getNext(idx);
        const idxPrev = this.getPrev(idx);

        this.setNext(idxPrev, idxNext);
        this.setPrev(idxNext, idxPrev);

        this.setNext(idx, idx);
        this.setPrev(idx, idx);
    }

    public reset(idx: MeshLoopIdx): void {
        this.face[idx] = -1;
        this.firstLink[idx] = -1;
        this.next[idx] = -1;
        this.prev[idx] = -1;
    }

    public setFace(idx: MeshLoopIdx, face: MeshFaceIdx): void {
        this.face[idx] = face;
    }

    public setFirstLink(idx: MeshLoopIdx, firstLink: MeshLinkIdx): void {
        this.firstLink[idx] = firstLink;
    }

    public setNext(idx: MeshLoopIdx, next: MeshLoopIdx): void {
        this.next[idx] = next;
    }

    public setPrev(idx: MeshLoopIdx, prev: MeshLoopIdx): void {
        this.prev[idx] = prev;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.face.splice(lengthMin);
        this.firstLink.splice(lengthMin);
        this.next.splice(lengthMin);
        this.prev.splice(lengthMin);
        this.length = lengthMin;
    }

    public updateFace(loopFrom: MeshLoopIdx, loopTo: MeshLoopIdx, face: MeshFaceIdx): void {
        let loop = loopFrom;
        do {
            this.setFace(loop, face);
            loop = this.getNext(loop);
        } while (loop !== loopTo);
    }
}

export class MeshShells<T> {
    public data: MaybeValue<T>[];
    public firstFace: MaybeMeshFaceIdx[];
    public free: MeshShellIdx[];
    public length: number;
    public next: MaybeMeshShellIdx[];
    public prev: MaybeMeshShellIdx[];

    constructor(
        data: MaybeValue<T>[],
        firstFace: MaybeMeshFaceIdx[],
        next: MaybeMeshShellIdx[],
        prev: MaybeMeshShellIdx[],
        free: MeshShellIdx[],
        length: number,
    ) {
        this.data = data;
        this.firstFace = firstFace;
        this.next = next;
        this.prev = prev;
        this.free = free;
        this.length = length;
    }

    public static createEmpty<T>(): MeshShells<T> {
        return new MeshShells([], [], [], [], [], 0);
    }

    public static fromObject<T>(obj: MeshShellsLike<T>): MeshShells<T> {
        const data = obj.data.slice();
        const firstFace = obj.firstFace.slice();
        const next = obj.next.slice();
        const prev = obj.prev.slice();
        const free = obj.free.slice();
        const length = obj.length;

        return new MeshShells(data, firstFace, next, prev, free, length);
    }

    public static toObject<T>(loops: MeshShells<T>): MeshShellsLike<T> {
        const data = loops.data.slice();
        const firstFace = loops.firstFace.slice();
        const next = loops.next.slice();
        const prev = loops.prev.slice();
        const free = loops.free.slice();
        const length = loops.length;

        return { data, firstFace, next, prev, free, length };
    }

    public clear(): void {
        this.data = [];
        this.firstFace = [];
        this.next = [];
        this.prev = [];
        this.free = [];
        this.length = 0;
    }

    /**
     * Note: Only data references will be cloned (shallow copy).
     */
    public clone(): MeshShells<T> {
        const data = this.data.slice();
        const firstFace = this.firstFace.slice();
        const next = this.next.slice();
        const prev = this.prev.slice();
        const free = this.free.slice();
        const length = this.length;

        return new MeshShells(data, firstFace, next, prev, free, length);
    }

    public copy(dest: MeshShellIdx, src: MeshShellIdx): void {
        this.data[dest] = this.data[src];
        this.firstFace[dest] = this.firstFace[src];
        this.next[dest] = this.next[src];
        this.prev[dest] = this.prev[src];
    }

    public create(data: T): MeshShellIdx {
        let idx = this.free.pop();

        if (idx === undefined) {
            idx = this.length as MeshShellIdx;
            this.data.push(data);
            this.firstFace.push(-1);
            this.next.push(-1);
            this.prev.push(-1);
            this.length = idx + 1;
        }

        return idx;
    }

    public createIterator(): MeshPrimitiveIterator<MeshShellIdx> {
        return new MeshPrimitiveIterator(this.firstFace);
    }

    public destroy(idx: MeshShellIdx): void {
        this.data[idx] = null;
        this.free.push(idx);
    }

    public getData(idx: MeshShellIdx): T {
        return this.data[idx] as T;
    }

    public getFirstFace(idx: MeshShellIdx): MeshFaceIdx {
        return this.firstFace[idx] as MeshFaceIdx;
    }

    public getNext(idx: MeshShellIdx): MeshShellIdx {
        return this.next[idx] as MeshShellIdx;
    }

    public getPrev(idx: MeshShellIdx): MeshShellIdx {
        return this.prev[idx] as MeshShellIdx;
    }

    public init(idx: MeshShellIdx, firstFace: MeshFaceIdx): void {
        this.firstFace[idx] = firstFace;
        this.next[idx] = idx;
        this.prev[idx] = idx;
    }

    /**
     * Inserts shell at `idx` before `shell`.
     */
    public insertShell(idx: MeshShellIdx, shell: MeshShellIdx): void {
        const shellPrev = this.getPrev(shell);

        this.setNext(shellPrev, idx);
        this.setPrev(idx, shellPrev);

        this.setNext(idx, shell);
        this.setPrev(shell, idx);
    }

    public isValid(idx: MeshShellIdx): boolean {
        return idx < this.length ? this.firstFace[idx] >= 0 : false;
    }

    /**
     * Removes shell `idx` from its chain.
     *
     * Note: Does nothing if the shell has already been removed.
     */
    public removeShell(idx: MeshShellIdx): void {
        const idxNext = this.getNext(idx);
        const idxPrev = this.getPrev(idx);

        this.setNext(idxPrev, idxNext);
        this.setPrev(idxNext, idxPrev);

        this.setNext(idx, idx);
        this.setPrev(idx, idx);
    }

    public reset(idx: MeshShellIdx): void {
        this.firstFace[idx] = -1;
        this.next[idx] = -1;
        this.prev[idx] = -1;
    }

    public setData(idx: MeshShellIdx, data: T): void {
        this.data[idx] = data;
    }

    public setFirstFace(idx: MeshShellIdx, firstFace: MeshFaceIdx): void {
        this.firstFace[idx] = firstFace;
    }

    public setNext(idx: MeshShellIdx, next: MeshShellIdx): void {
        this.next[idx] = next;
    }

    public setPrev(idx: MeshShellIdx, prev: MeshShellIdx): void {
        this.prev[idx] = prev;
    }

    public truncate(): void {
        const lengthMin = sortAndTruncateFree(this.free, this.length);
        this.data.splice(lengthMin);
        this.firstFace.splice(lengthMin);
        this.next.splice(lengthMin);
        this.prev.splice(lengthMin);
        this.length = lengthMin;
    }
}

/**
 * ### Mesh Primitives:
 * - `MeshShells` - A shell
 * - `MeshFaces` - A face
 * - `MeshEdges` - An edge
 * - `MeshVertices` - A vertex
 * - `MeshLoops` - A loop
 * - `MeshLinks` - A link
 *
 * ### Euler characteristics:
 *   `V - E - L + 2F + 2H - 2S = 0`
 *
 * ### Relationship of mesh primitives:
 * ```
 *   -----------------------------
 *   |           Shell           |
 *   -----------------------------
 *               ^   |
 *         shell |   | firstFace
 *               |   v
 *   -----------------------------
 *   |            Face           |
 *   -----------------------------
 *               ^   |
 *          face |   | firstLoop
 *               |   v
 *   ------------------------------
 *   |            Loop            |
 *   ------------------------------
 *               ^   |
 *          loop |   | firstLink
 *               |   v
 *   ------------------------------    edge    ------------------------------
 *   |            Link            | <--------> |            Edge            |
 *   ------------------------------    link    ------------------------------
 *               |   ^
 *        vertex |   | firstLink
 *               v   |
 *   ------------------------------
 *   |           Vertex           |
 *   ------------------------------
 * ```
 *
 */
export class Mesh<S, F, E, V, P> {
    public edges: MeshEdges<E>;
    public faces: MeshFaces<F>;
    public links: MeshLinks;
    public loops: MeshLoops;
    public shells: MeshShells<S>;
    public vertices: MeshVertices<V, P>;

    public constructor(
        shells: MeshShells<S>,
        faces: MeshFaces<F>,
        edges: MeshEdges<E>,
        vertices: MeshVertices<V, P>,
        loops: MeshLoops,
        links: MeshLinks,
    ) {
        this.shells = shells;
        this.faces = faces;
        this.edges = edges;
        this.vertices = vertices;
        this.loops = loops;
        this.links = links;
    }

    public static createEmpty<S, F, E, V, P>(): Mesh<S, F, E, V, P> {
        const vertices = MeshVertices.createEmpty<V, P>();
        const edges = MeshEdges.createEmpty<E>();
        const faces = MeshFaces.createEmpty<F>();
        const links = MeshLinks.createEmpty();
        const loops = MeshLoops.createEmpty();
        const shells = MeshShells.createEmpty<S>();

        return new Mesh(shells, faces, edges, vertices, loops, links);
    }

    public static fromObject<S, F, E, V, P>(obj: MeshLike<S, F, E, V, P>): Mesh<S, F, E, V, P> {
        const vertices = MeshVertices.fromObject(obj.vertices);
        const edges = MeshEdges.fromObject(obj.edges);
        const faces = MeshFaces.fromObject(obj.faces);
        const links = MeshLinks.fromObject(obj.links);
        const loops = MeshLoops.fromObject(obj.loops);
        const shells = MeshShells.fromObject(obj.shells);

        return new Mesh(shells, faces, edges, vertices, loops, links);
    }

    public static toObject<S, F, E, V, P>(mesh: Mesh<S, F, E, V, P>): MeshLike<S, F, E, V, P> {
        const vertices = MeshVertices.toObject(mesh.vertices);
        const edges = MeshEdges.toObject(mesh.edges);
        const faces = MeshFaces.toObject(mesh.faces);
        const links = MeshLinks.toObject(mesh.links);
        const loops = MeshLoops.toObject(mesh.loops);
        const shells = MeshShells.toObject(mesh.shells);

        return { shells, faces, edges, vertices, loops, links };
    }

    public clear(): void {
        this.shells.clear();
        this.faces.clear();
        this.edges.clear();
        this.vertices.clear();
        this.loops.clear();
        this.links.clear();
    }

    /**
     * Note: Only data references will be cloned (shallow copy).
     */
    public clone(): Mesh<S, F, E, V, P> {
        const shells = this.shells.clone();
        const faces = this.faces.clone();
        const edges = this.edges.clone();
        const vertices = this.vertices.clone();
        const loops = this.loops.clone();
        const links = this.links.clone();

        return new Mesh(shells, faces, edges, vertices, loops, links);
    }

    /**
     * Euler operator: Adds and edge and a face to the mesh.
     *
     * Note: Deletes loop of `oldEdge1` or `link2`
     *
     * ```
     *              l2                               l2
     *          x---------x                      x---------x
     *          |        /|                      |         |
     *          |   oe1 / |                      |         |
     *          |      /  |                      |         |
     *          |     /   |                      |         |
     *  l1onext |    /    | l2onext  ->  l1onext |         | l2onext
     *          |   /     |                      |         |
     *          |  /      |                      |         |
     *          | / oe2   |                      |         |
     *          |/        |                      |         |
     *          x---------x                      x---------x
     *              l1                               l1
     * ```
     */
    public killEdgeFace(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        oldEdge1: MeshEdgeIdx,
        oldEdge2: MeshEdgeIdx,
        oldFace: MeshFaceIdx,
    ): void {
        // Update vertex first link
        const vtx1 = this.links.getVertex(link1);
        const vtx2 = this.links.getVertex(link2);
        this.vertices.setFirstLink(vtx1, link1);
        this.vertices.setFirstLink(vtx2, link2);

        // Splice/destroy old links
        const oldLink1 = this.edges.getLink(oldEdge1);
        const oldLink2 = this.edges.getLink(oldEdge2);
        this.links.splice(oldLink1, link1);
        this.links.splice(oldLink2, link2);
        this.links.reset(oldLink1);
        this.links.reset(oldLink2);
        this.links.destroy(oldLink1);
        this.links.destroy(oldLink2);

        // Reset edges
        this.edges.reset(oldEdge1);
        this.edges.reset(oldEdge2);

        // Merge/destroy loops
        const loop = this.links.getLoop(link1);
        const oldLoop = this.links.getLoop(link2);
        this.loops.mergeLoops(loop, oldLoop);
        this.loops.removeLoop(oldLoop);
        this.loops.reset(oldLoop);
        this.loops.destroy(oldLoop);

        // TODO: Refine update from/to
        const face = this.loops.getFace(loop);
        this.loops.updateFace(loop, loop, face);
        this.links.updateLoop(link1, link1, loop);
        this.loops.setFirstLink(loop, link1);

        // Update first face in shell if necessary
        const shell = this.faces.getShell(oldFace);
        const firstFace = this.shells.getFirstFace(shell);
        if (oldFace === firstFace) {
            this.shells.setFirstFace(shell, face);
        }

        // Reset face and edges
        this.faces.removeFace(oldFace);
        this.faces.reset(oldFace);
    }

    public killEdgeMakeLoop(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        oldEdge1: MeshEdgeIdx,
        oldEdge2: MeshEdgeIdx,
    ): void {
        // Update vertices
        const vtx1 = this.links.getVertex(link1);
        const vtx2 = this.links.getVertex(link2);
        this.vertices.setFirstLink(vtx1, link1);
        this.vertices.setFirstLink(vtx2, link2);

        // Initialize new loop
        const loop1 = this.links.getLoop(link1);
        const loop2 = this.loops.create();
        const face = this.loops.getFace(loop1);
        const firstLoop = this.faces.getFirstLoop(face);
        this.loops.init(loop2, face, link2);
        this.loops.insertLoop(loop2, firstLoop);
        this.loops.setFirstLink(loop1, link1);

        // Update links
        const oldLink1 = this.edges.getLink(oldEdge1);
        const oldLink2 = this.edges.getLink(oldEdge2);
        this.links.splice(oldLink1, link1);
        this.links.splice(oldLink2, link2);

        // TODO: Refine update from/to
        this.links.updateLoop(link1, link1, loop1);
        this.links.updateLoop(link2, link2, loop2);

        if (link1 === oldLink1) {
            this.links.init(link1, link1, -1, vtx1, loop1);
        } else {
            this.links.reset(oldLink1);
            this.links.destroy(oldLink1);
        }

        if (link2 === oldLink2) {
            this.links.init(link2, link2, -1, vtx2, loop2);
        } else {
            this.links.reset(oldLink2);
            this.links.destroy(oldLink2);
        }

        this.edges.reset(oldEdge1);
        this.edges.reset(oldEdge2);
    }

    /**
     * Euler operator: Kills `oldVertex` and removes it from `face`.
     */
    public killVertex(oldVertex: MeshVertexIdx, face: MeshFaceIdx): void {
        const oldLink = this.vertices.getFirstLink(oldVertex);
        const oldLoop = this.links.getLoop(oldLink);
        const oldLoopNext = this.loops.getNext(oldLoop);

        this.faces.setFirstLoop(face, oldLoopNext);
        this.loops.removeLoop(oldLoop);

        this.vertices.reset(oldVertex);
        this.links.reset(oldLink);
        this.loops.reset(oldLoop);

        this.links.destroy(oldLink);
        this.loops.destroy(oldLoop);
    }

    /**
     * Euler operator: Merges an edge by removing a vertex and an edge.
     *
     * ```
     *       x              x
     *       |              |
     *   oe1 | oe2          |
     *       |              |
     *       x nv    ->  l1 | l2
     *       |              |
     *    l1 | l2           |
     *       |              |
     *       x              x
     * ```
     */
    public killVertexEdgeSplit(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        oldVertex: MeshVertexIdx,
        oldEdge1: MeshEdgeIdx,
        oldEdge2: MeshEdgeIdx,
    ): void {
        // Update loops
        const loop1 = this.links.getLoop(link1);
        const loop2 = this.links.getLoop(link2);
        this.loops.setFirstLink(loop1, link1);
        this.loops.setFirstLink(loop2, link2);

        // Update links
        const oldLink1 = this.edges.getLink(oldEdge1);
        const oldLink2 = this.edges.getLink(oldEdge2);
        const oprev2 = this.links.getOprev(oldLink2);
        this.links.splice(oldLink1, link2);

        if (oldLink2 !== oprev2) {
            // If `oldLink2` is not a single link we need to splice
            this.links.splice(oldLink2, oprev2);
            this.links.splice(link2, oprev2);
        }

        // Reset edges
        this.edges.reset(oldEdge1);
        this.edges.reset(oldEdge2);

        // Update remaining and reset old vertex
        const vtx2 = this.links.getVertex(oldLink2);
        this.links.setVertex(link2, vtx2);
        this.vertices.setFirstLink(vtx2, link2);
        this.vertices.reset(oldVertex);

        // Finally, destroy old links
        this.links.reset(oldLink1);
        this.links.reset(oldLink2);
        this.links.destroy(oldLink1);
        this.links.destroy(oldLink2);
    }

    /**
     * Euler operator: Kills `oldVertex`, `oldFace` and `oldShell`.
     */
    public killVertexFaceShell(oldVertex: MeshVertexIdx, oldFace: MeshFaceIdx, oldShell: MeshShellIdx): void {
        const oldLink = this.vertices.getFirstLink(oldVertex);
        const oldLoop = this.links.getLoop(oldLink);
        this.links.reset(oldLink);
        this.loops.reset(oldLoop);
        this.links.destroy(oldLink);
        this.loops.destroy(oldLoop);

        this.shells.reset(oldShell);
        this.faces.reset(oldFace);
        this.vertices.reset(oldVertex);
    }

    /**
     * Euler operator: Adds and edge and a face to the mesh.
     *
     * ```
     *              l2                               l2
     *          x---------x                      x---------x
     *          |         |                      |        /|
     *          |         |                      |   ne1 / |
     *          |         |                      |      /  |
     *          |         |                      |     /   |
     *  l1onext |         | l2onext  ->  l1onext |    /    | l2onext
     *          |         |                      |   /     |
     *          |         |                      |  /      |
     *          |         |                      | / ne2   |
     *          |         |                      |/        |
     *          x---------x                      x---------x
     *              l1                               l1
     * ```
     */
    public makeEdgeFace(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        newEdge1: MeshEdgeIdx,
        newEdge2: MeshEdgeIdx,
        newFace: MeshFaceIdx,
    ): void {
        const newLink1 = this.links.create();
        const newLink2 = this.links.create();
        const newLoop = this.loops.create();

        const loop = this.links.getLoop(link1);
        const face = this.loops.getFace(loop);
        const shell = this.faces.getShell(face);
        this.faces.init(newFace, shell, newLoop);
        this.faces.insertFace(newFace, face);

        this.loops.init(newLoop, newFace, newLink1);
        this.loops.setFirstLink(loop, newLink2);

        const vtx1 = this.links.getVertex(link1);
        const vtx2 = this.links.getVertex(link2);
        this.links.init(newLink1, newLink2, newEdge1, vtx1, newLoop);
        this.links.init(newLink2, newLink1, newEdge2, vtx2, loop);
        this.links.splice(newLink1, link1);
        this.links.splice(newLink2, link2);

        // TODO: Refine update from/to
        this.links.updateLoop(newLink1, newLink1, newLoop);
        this.links.updateLoop(newLink2, newLink2, loop);

        this.edges.init(newEdge1, newLink1);
        this.edges.init(newEdge2, newLink2);
    }

    public makeEdgeKillLoop(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        newEdge1: MeshEdgeIdx,
        newEdge2: MeshEdgeIdx,
    ): void {
        // Create new links  (if necessary) and splice
        const edge1 = this.links.getEdge(link1);
        const edge2 = this.links.getEdge(link2);

        const newLink1 = edge1 < 0 ? link1 : this.links.create();
        const newLink2 = edge2 < 0 ? link2 : this.links.create();

        const vtx1 = this.links.getVertex(link1);
        const vtx2 = this.links.getVertex(link2);
        const loop1 = this.links.getLoop(link1);
        const loop2 = this.links.getLoop(link2);

        this.links.init(newLink1, newLink2, newEdge1, vtx1, loop1);
        this.links.init(newLink2, newLink1, newEdge2, vtx2, loop1);

        this.links.splice(newLink1, link1);
        this.links.splice(newLink2, link2);

        // TODO: Refine update from/to
        this.links.updateLoop(newLink1, newLink1, loop1);

        // Initialize edges
        this.edges.init(newEdge1, newLink1);
        this.edges.init(newEdge2, newLink2);

        // Update first loop in face if necessary
        const face = this.loops.getFace(loop1);
        // const firstLoop = this.faces.getFirstLoop(face);
        // if (loop2 === firstLoop) {
        //     this.faces.setFirstLoop(face, loop1);
        // }
        this.faces.setFirstLoop(face, loop1);

        // Remove old loop
        this.loops.removeLoop(loop2);
        this.loops.reset(loop2);
        this.loops.destroy(loop2);
    }

    /**
     * Euler operator: Makes `newVertex` and adds it to `face`.
     */
    public makeVertex(newVertex: MeshVertexIdx, face: MeshFaceIdx): void {
        const firstLoop = this.faces.getFirstLoop(face);

        const newLink = this.links.create();
        const newLoop = this.loops.create();

        this.vertices.init(newVertex, newLink);
        this.links.init(newLink, newLink, -1, newVertex, newLoop);
        this.loops.init(newLoop, face, newLink);

        this.loops.insertLoop(newLoop, firstLoop);
        this.faces.setFirstLoop(face, newLoop);
    }

    /**
     * Euler operator: Splits an edge by adding a vertex and an edge.
     *
     * ```
     *      x              x
     *      |              |
     *      |          ne1 | ne2
     *      |              |
     *   l1 | l2    ->     x nv
     *      |              |
     *      |           l1 | l2
     *      |              |
     *      x              x
     * ```
     */
    public makeVertexEdgeSplit(
        link1: MeshLinkIdx,
        link2: MeshLinkIdx,
        newVertex: MeshVertexIdx,
        newEdge1: MeshEdgeIdx,
        newEdge2: MeshEdgeIdx,
    ): void {
        const newLink1 = this.links.create();
        const newLink2 = this.links.create();

        // Initialize new vertex
        const vtx2 = this.links.getVertex(link2);
        this.vertices.init(newVertex, newLink1);
        this.vertices.setFirstLink(vtx2, newLink2);

        // Initialize new links
        const loop1 = this.links.getLoop(link1);
        const loop2 = this.links.getLoop(link2);
        this.links.init(newLink1, newLink2, newEdge1, newVertex, loop1);
        this.links.init(newLink2, newLink1, newEdge2, vtx2, loop2);
        this.links.setVertex(link2, newVertex);

        // Initialize new edges
        this.edges.init(newEdge1, newLink1);
        this.edges.init(newEdge2, newLink2);

        // Update links
        const oprev2 = this.links.getOprev(link2);

        if (link2 !== oprev2) {
            // If `link2` is not a single link we need to splice
            this.links.splice(link2, oprev2);
            this.links.splice(newLink2, oprev2);
        }

        this.links.splice(newLink1, link2);
    }

    /**
     * Euler operator: Makes `newVertex`, `newFace` and `newShell`.
     */
    public makeVertexFaceShell(newVertex: MeshVertexIdx, newFace: MeshFaceIdx, newShell: MeshShellIdx): void {
        const newLink = this.links.create();
        const newLoop = this.loops.create();

        this.vertices.init(newVertex, newLink);
        this.faces.init(newFace, newShell, newLoop);
        this.shells.init(newShell, newFace);
        this.links.init(newLink, newLink, -1, newVertex, newLoop);
        this.loops.init(newLoop, newFace, newLink);
    }

    public truncate(): void {
        this.vertices.truncate();
        this.edges.truncate();
        this.faces.truncate();
        this.links.truncate();
        this.loops.truncate();
        this.shells.truncate();
    }

    public truncateReindex(): void {
        throwError("Not implemented");
    }

    private moveEdge(edgeDest: MeshEdgeIdx, edgeSrc: MeshEdgeIdx): void {
        const link = this.edges.getLink(edgeSrc);

        this.links.setEdge(link, edgeDest);

        this.edges.copy(edgeDest, edgeSrc);
    }

    private moveFace(faceDest: MeshFaceIdx, faceSrc: MeshFaceIdx): void {
        const firstLoop = this.faces.getFirstLoop(faceSrc);

        this.loops.updateFace(firstLoop, firstLoop, faceDest);

        this.faces.copy(faceDest, faceSrc);
    }

    private moveLink(linkDest: MeshLinkIdx, linkSrc: MeshLinkIdx): void {
        const loop = this.links.getLoop(linkSrc);
        const lprev = this.links.getLprev(linkSrc);
        const oprev = this.links.getOprev(linkSrc);
        const vtx = this.links.getVertex(linkSrc);
        const sym = this.links.getSym(linkSrc);
        const edge = this.links.getEdge(linkSrc);

        // Update vertex
        const vtxFirstLink = this.vertices.getFirstLink(vtx);

        if (vtxFirstLink === linkSrc) {
            this.vertices.setFirstLink(vtx, linkDest);
        }

        // Update link
        this.links.setLnext(lprev, linkDest);
        this.links.setOnext(oprev, linkDest);
        this.links.setSym(sym, linkDest);

        // Update edge
        if (edge >= 0) {
            this.edges.setLink(edge, linkDest);
        }

        // Update loop
        const loopLirstLink = this.loops.getFirstLink(loop);

        if (loopLirstLink === linkSrc) {
            this.loops.setFirstLink(loop, linkDest);
        }

        this.links.copy(linkDest, linkSrc);
    }

    private moveLoop(loopDest: MeshLoopIdx, loopSrc: MeshLoopIdx): void {
        const face = this.loops.getFace(loopSrc);
        const firstLink = this.loops.getFirstLink(loopSrc);
        const next = this.loops.getNext(loopSrc);
        const prev = this.loops.getPrev(loopSrc);

        this.links.setLoop(firstLink, loopDest);
        this.loops.setNext(prev, loopDest);
        this.loops.setPrev(next, loopDest);

        const firstLoop = this.faces.getFirstLoop(face);

        if (firstLoop === loopSrc) {
            this.faces.setFirstLoop(face, loopDest);
        }

        this.loops.copy(loopDest, loopSrc);
    }

    private moveVertex(vtxDest: MeshVertexIdx, vtxSrc: MeshVertexIdx): void {
        const firstLink = this.vertices.getFirstLink(vtxSrc);

        this.links.updateVertex(firstLink, firstLink, vtxDest);

        this.vertices.copy(vtxDest, vtxSrc);
    }
}

export class MeshPrimitiveIterator<T extends number> {
    private idxCurr: number;
    private refs: number[];

    public constructor(refs: number[]) {
        this.refs = refs;
        this.idxCurr = -1;
    }

    public getIndex(): T {
        return this.idxCurr as T;
    }

    public next(): boolean {
        let idxNext = this.idxCurr + 1;

        while (idxNext < this.refs.length) {
            if (this.refs[idxNext] >= 0) {
                this.idxCurr = idxNext;
                return true;
            }

            idxNext += 1;
        }

        this.idxCurr = idxNext;
        return false;
    }

    public reset(): void {
        this.idxCurr = -1;
    }
}

export class MeshPrimitiveNextIterator<T extends number> {
    private firstRef: number;
    private idxCurr: number;
    private idxNext: number;
    private nextRefs: number[];

    public constructor(nextRefs: number[], firstRef: number) {
        this.nextRefs = nextRefs;
        this.firstRef = firstRef;
        this.idxNext = firstRef;
        this.idxCurr = -1;
    }

    public getIndex(): T {
        return this.idxCurr as T;
    }

    public next(): boolean {
        if (this.idxCurr < 0) {
            if (this.idxNext < 0) {
                return false;
            }
        } else {
            if (this.idxNext === this.firstRef) {
                return false;
            }
        }

        this.idxCurr = this.idxNext;
        this.idxNext = this.nextRefs[this.idxNext];

        return true;
    }

    public reset(firstRef: number): void {
        this.firstRef = firstRef;
        this.idxNext = firstRef;
        this.idxCurr = -1;
    }
}

export function meshPrint<S, F, E, V, P>(
    mesh: Mesh<S, F, E, V, P>,
    options?: {
        vertices?: boolean;
        edges?: boolean;
        faces?: boolean;
        shells?: boolean;
        links?: boolean;
        loops?: boolean;
    },
): void {
    const shells = mesh.shells;
    const faces = mesh.faces;
    const edges = mesh.edges;
    const vertices = mesh.vertices;
    const links = mesh.links;
    const loops = mesh.loops;

    let msg = "Mesh: \n";

    if (options === undefined || options.shells === true) {
        msg += `  Shells # length = ${shells.length}, free = [${shells.free}]\n`;
        for (let i = 0; i < shells.length; i++) {
            msg +=
                `    [${i}] firstFace = ${shells.firstFace[i]},` +
                ` next = ${shells.next[i]},` +
                ` prev = ${shells.prev[i]}\n`;
        }
    }

    if (options === undefined || options.faces === true) {
        msg += `  Faces # length = ${faces.length}, free = [${faces.free}]\n`;
        for (let i = 0; i < faces.length; i++) {
            msg +=
                `    [${i}] shell = ${faces.shell[i]},` +
                ` firstLoop = ${faces.firstLoop[i]},` +
                ` next = ${faces.next[i]},` +
                ` prev = ${faces.prev[i]},` +
                ` data = ${faces.data[i]}\n`;
        }
    }

    if (options === undefined || options.loops === true) {
        msg += `  Loops # length = ${loops.length}, free = [${loops.free}]\n`;
        for (let i = 0; i < loops.length; i++) {
            msg +=
                `    [${i}] face = ${loops.face[i]},` +
                ` firstLink = ${loops.firstLink[i]},` +
                ` next = ${loops.next[i]},` +
                ` prev = ${loops.prev[i]}\n`;
        }
    }

    if (options === undefined || options.links === true) {
        msg += `  Links # length = ${links.length}, free = [${links.free}]\n`;
        for (let i = 0; i < links.length; i++) {
            msg +=
                `    [${i}] loop = ${links.loop[i]},` +
                ` lnext = ${links.lnext[i]},` +
                ` onext = ${links.onext[i]},` +
                ` sym = ${links.sym[i]},` +
                ` edge = ${links.edge[i]},` +
                ` vertex = ${links.vertex[i]}\n`;
        }
    }

    if (options === undefined || options.edges === true) {
        msg += `  Edges # length = ${edges.length}, free = [${edges.free}]\n`;
        for (let i = 0; i < edges.length; i++) {
            msg += `    [${i}] link = ${edges.link[i]}, data = ${edges.data[i]}\n`;
        }
    }

    if (options === undefined || options.vertices === true) {
        msg += `  Vertices # length = ${vertices.length}, free = [${vertices.free}]\n`;
        for (let i = 0; i < vertices.length; i++) {
            msg += `    [${i}] firstLink = ${vertices.firstLink[i]}, data = ${vertices.data[i]}\n`;
        }
    }

    log.info("{}", msg);
}

export function meshValidate<S, F, E, V, P>(mesh: Mesh<S, F, E, V, P>): ValidationHelper {
    const vh = new ValidationHelper();

    const shells = mesh.shells;
    const faces = mesh.faces;
    const edges = mesh.edges;
    const vertices = mesh.vertices;
    const links = mesh.links;
    const loops = mesh.loops;

    for (let i = 0; i < shells.length; i++) {
        const idx = i as MeshShellIdx;

        if (shells.isValid(idx)) {
            vh.notEqual(shells.getFirstFace(idx), -1, "shells.getFirstFace({})", idx);
            vh.notEqual(shells.getNext(idx), -1, "shells.getNext({})", idx);
            vh.notEqual(shells.getPrev(idx), -1, "shells.getPrev({})", idx);

            vh.equal(faces.isValid(shells.getFirstFace(idx)), true, "faces.isValid(shells.getFirstFace({}))", idx);
            vh.equal(shells.isValid(shells.getNext(idx)), true, "shells.isValid(shells.getNext({}))", idx);
            vh.equal(shells.isValid(shells.getPrev(idx)), true, "shells.isValid(shells.getPrev({}))", idx);

            vh.equal(faces.getShell(shells.getFirstFace(idx)), idx, "faces.getShell(getFirstFace({}))", idx);
            vh.equal(shells.getPrev(shells.getNext(idx)), idx, "shells.getPrev(shells.getNext({})", idx);
            vh.equal(shells.getNext(shells.getPrev(idx)), idx, "shells.getNext(shells.getPrev({})", idx);
        } else {
            vh.equal(shells.getFirstFace(idx), -1, "shells.getFirstFace({})", idx);
            vh.equal(shells.getNext(idx), -1, "shells.getNext({})", idx);
            vh.equal(shells.getPrev(idx), -1, "shells.getPrev({})", idx);
        }
    }

    for (let i = 0; i < faces.length; i++) {
        const idx = i as MeshFaceIdx;

        if (faces.isValid(idx)) {
            vh.notEqual(faces.getFirstLoop(idx), -1, "faces.getFirstLoop({})", idx);
            vh.notEqual(faces.getShell(idx), -1, "faces.getShell({})", idx);
            vh.notEqual(faces.getNext(idx), -1, "faces.getNext({})", idx);
            vh.notEqual(faces.getPrev(idx), -1, "faces.getPrev({})", idx);

            vh.equal(loops.isValid(faces.getFirstLoop(idx)), true, "loops.isValid(faces.getFirstLoop({}))", idx);
            vh.equal(shells.isValid(faces.getShell(idx)), true, "shells.isValid(faces.getShell({}))", idx);
            vh.equal(faces.isValid(faces.getNext(idx)), true, "faces.isValid(faces.getNext({}))", idx);
            vh.equal(faces.isValid(faces.getPrev(idx)), true, "faces.isValid(faces.getPrev({}))", idx);

            vh.equal(loops.getFace(faces.getFirstLoop(idx)), idx, "loops.getFace(faces.getFirstLoop({}))", idx);
            vh.equal(faces.getPrev(faces.getNext(idx)), idx, "faces.getPrev(faces.getNext({})", idx);
            vh.equal(faces.getNext(faces.getPrev(idx)), idx, "faces.getNext(faces.getPrev({})", idx);
        } else {
            vh.equal(faces.getFirstLoop(idx), -1, "faces.getFirstLoop({})", idx);
            vh.equal(faces.getShell(idx), -1, "faces.getShell({})", idx);
            vh.equal(faces.getNext(idx), -1, "faces.getNext({})", idx);
            vh.equal(faces.getPrev(idx), -1, "faces.getPrev({})", idx);
            vh.equal(faces.getData(idx), null, "faces.getData({})", idx);
        }
    }

    for (let i = 0; i < loops.length; i++) {
        const idx = i as MeshLoopIdx;

        if (loops.isValid(idx)) {
            vh.notEqual(loops.getFirstLink(idx), -1, "loops.getFirstLink({})", idx);
            vh.notEqual(loops.getFace(idx), -1, "loops.getFace({})", idx);
            vh.notEqual(loops.getNext(idx), -1, "loops.getNext({})", idx);
            vh.notEqual(loops.getPrev(idx), -1, "loops.getPrev({})", idx);

            vh.equal(links.isValid(loops.getFirstLink(idx)), true, "links.isValid(loops.getFirstLink(({})", idx);
            vh.equal(faces.isValid(loops.getFace(idx)), true, "faces.isValid(loops.getFace(({})", idx);
            vh.equal(loops.isValid(loops.getNext(idx)), true, "loops.isValid(loops.getNext(({})", idx);
            vh.equal(loops.isValid(loops.getPrev(idx)), true, "loops.isValid(loops.getPrev(({})", idx);

            vh.equal(links.getLoop(loops.getFirstLink(idx)), idx, "links.getLoop(loops.getFirstLink({}))", idx);
            vh.equal(loops.getPrev(loops.getNext(idx)), idx, "loops.getPrev(loops.getNext({})", idx);
            vh.equal(loops.getNext(loops.getPrev(idx)), idx, "loops.getNext(loops.getPrev({})", idx);
        } else {
            vh.equal(loops.getFirstLink(idx), -1, "loops.getFirstLink({})", idx);
            vh.equal(loops.getFace(idx), -1, "loops.getFace({})", idx);
            vh.equal(loops.getNext(idx), -1, "loops.getNext({})", idx);
            vh.equal(loops.getPrev(idx), -1, "loops.getPrev({})", idx);
        }
    }

    for (let i = 0; i < links.length; i++) {
        const idx = i as MeshLinkIdx;

        if (links.isValid(idx)) {
            vh.notEqual(links.getLoop(idx), -1, "links.getLoop({})", idx);
            vh.notEqual(links.getLnext(idx), -1, "links.getLnext({})", idx);
            vh.notEqual(links.getOnext(idx), -1, "links.getOnext({})", idx);
            vh.notEqual(links.getVertex(idx), -1, "links.getOrig({})", idx);
            vh.notEqual(links.getSym(idx), -1, "links.getSym({})", idx);

            vh.equal(loops.isValid(links.getLoop(idx)), true, "loops.isValid(links.getLoop({})", idx);
            vh.equal(links.isValid(links.getLnext(idx)), true, "links.isValid(links.getLnext({})", idx);
            vh.equal(links.isValid(links.getOnext(idx)), true, "links.isValid(links.getOnext({})", idx);
            vh.equal(vertices.isValid(links.getVertex(idx)), true, "vertices.isValid(links.getOrig({})", idx);
            vh.equal(links.isValid(links.getSym(idx)), true, "links.isValid(links.getSym({})", idx);

            vh.equal(links.getLprev(links.getLnext(idx)), idx, "links.getLprev(links.getLnext({})", idx);
            vh.equal(links.getOprev(links.getOnext(idx)), idx, "links.getOprev(links.getOnext({})", idx);
            vh.equal(links.getSym(links.getSym(idx)), idx, "links.getSym(links.getSym({})", idx);
        } else {
            vh.equal(links.getLoop(idx), -1, "links.getLoop({})", idx);
            vh.equal(links.getLnext(idx), -1, "links.getLnext({})", idx);
            vh.equal(links.getOnext(idx), -1, "links.getOnext({})", idx);
            vh.equal(links.getVertex(idx), -1, "links.getOrig({})", idx);
            vh.equal(links.getSym(idx), -1, "links.getSym({})", idx);
        }

        const edge = links.getEdge(idx);

        if (edge !== -1) {
            vh.equal(edges.getLink(edge), idx, "edges.getLink(links.getEdge({}))", idx);
        }
    }

    for (let i = 0; i < edges.length; i++) {
        const idx = i as MeshEdgeIdx;

        if (edges.isValid(idx)) {
            vh.notEqual(edges.getLink(idx), -1, "edges.getLink({})", idx);

            vh.equal(links.isValid(edges.getLink(idx)), true, "links.isValid(edges.getLink({})", idx);
        } else {
            vh.equal(edges.getLink(idx), -1, "edges.getLink({})", idx);
            vh.equal(edges.getData(idx), null, "edges.getData({})", idx);
        }
    }

    for (let i = 0; i < vertices.length; i++) {
        const idx = i as MeshVertexIdx;

        if (vertices.isValid(idx)) {
            vh.notEqual(vertices.getFirstLink(idx), -1, "vertices.getFirstLink({})", idx);
            vh.notEqual(vertices.getPos(idx), null, "vertices.getPos({})", idx);

            vh.equal(links.isValid(vertices.getFirstLink(idx)), true, "links.isValid(vertices.getFirstLink({})", idx);

            vh.equal(links.getVertex(vertices.getFirstLink(idx)), idx, "links.getOrig(vertices.getFirstLink({}))", idx);
        } else {
            vh.equal(vertices.getFirstLink(idx), -1, "vertices.getFirstLink({})", idx);
            vh.equal(vertices.getData(idx), null, "vertices.getData({})", idx);
            vh.equal(vertices.getPos(idx), null, "vertices.getPos({})", idx);
        }
    }

    for (const idx of shells.free) {
        vh.greaterThan(shells.length, idx, "shells.length", idx);
        vh.equal(shells.isValid(idx), false, "shells.isValid({})", idx);
    }

    for (const idx of faces.free) {
        vh.greaterThan(faces.length, idx, "faces.length", idx);
        vh.equal(faces.isValid(idx), false, "faces.isValid({})", idx);
    }

    for (const idx of loops.free) {
        vh.greaterThan(loops.length, idx, "loops.length", idx);
        vh.equal(loops.isValid(idx), false, "loops.isValid({})", idx);
    }

    for (const idx of links.free) {
        vh.greaterThan(links.length, idx, "links.length", idx);
        vh.equal(links.isValid(idx), false, "links.isValid({})", idx);
    }

    for (const idx of edges.free) {
        vh.greaterThan(edges.length, idx, "edges.length", idx);
        vh.equal(edges.isValid(idx), false, "edges.isValid({})", idx);
    }

    for (const idx of vertices.free) {
        vh.greaterThan(vertices.length, idx, "vertices.length", idx);
        vh.equal(vertices.isValid(idx), false, "vertices.isValid({})", idx);
    }

    return vh;
}

export function mesh2AddEdge<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    vtx1: MeshVertexIdx,
    vtx2: MeshVertexIdx,
): { edge1: MeshEdgeIdx; edge2: MeshEdgeIdx; face: MaybeMeshFaceIdx } | undefined {
    if (vtx1 === vtx2) {
        // Vertices must not be equal
        return undefined;
    }

    const link1 = mesh2GetConnectingLink(mesh, vtx1, vtx2);
    const link2 = mesh2GetConnectingLink(mesh, vtx2, vtx1);

    const vtxSym1 = mesh.links.getVertexSym(link1);
    const vtxSym2 = mesh.links.getVertexSym(link2);

    if (vtx1 === vtxSym2 && vtx2 === vtxSym1) {
        // Vertices must not be connected yet
        return undefined;
    }

    const loop1 = mesh.links.getLoop(link1);
    const loop2 = mesh.links.getLoop(link2);
    const face1 = mesh.loops.getFace(loop1);
    const face2 = mesh.loops.getFace(loop2);

    if (face1 !== face2) {
        // Faces must be equal
        return undefined;
    }

    const newEdge1 = mesh.edges.create(null);
    const newEdge2 = mesh.edges.create(null);

    let newFace: MaybeMeshFaceIdx = -1;

    if (loop1 === loop2) {
        const area = mesh2CalculateSignedArea(mesh, link1, link2);

        newFace = mesh.faces.create(null);

        if (area < 0) {
            mesh.makeEdgeFace(link1, link2, newEdge1, newEdge2, newFace);
            mesh2UpdateInnerLoops(mesh, link1, link2);
        } else {
            mesh.makeEdgeFace(link2, link1, newEdge2, newEdge1, newFace);
            mesh2UpdateInnerLoops(mesh, link2, link1);
        }
    } else {
        mesh.makeEdgeKillLoop(link1, link2, newEdge1, newEdge2);
    }

    return {
        edge1: newEdge1,
        edge2: newEdge2,
        face: newFace,
    };
}

export function mesh2AddVertex<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    pos: ReadonlyVector2,
    face: MeshFaceIdx,
): MeshVertexIdx {
    const newVertex = mesh.vertices.create(null, pos);

    mesh.makeVertex(newVertex, face);

    return newVertex;
}

export function mesh2AddVertexFaceShell<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    pos: ReadonlyVector2,
): {
    shell: MeshShellIdx;
    face: MeshFaceIdx;
    vertex: MeshVertexIdx;
} {
    const newVertex = mesh.vertices.create(null, pos);
    const newFace = mesh.faces.create(null);
    const newShell = mesh.shells.create(null);

    mesh.makeVertexFaceShell(newVertex, newFace, newShell);

    return { shell: newShell, face: newFace, vertex: newVertex };
}

export function mesh2FindClosestEdgeAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
): MeshEdgeIdx | undefined {
    // TODO: Better way to get consistent results?
    let minD = Number.POSITIVE_INFINITY;
    let minEdge = undefined;

    const iter = mesh.edges.createIterator();

    while (iter.next()) {
        const edge = iter.getIndex();
        const link = mesh.edges.getLink(edge);

        const vtx0 = mesh.links.getVertex(link);
        const vtx1 = mesh.links.getVertexSym(link);

        const p0 = mesh.vertices.getPos(vtx0);
        const p1 = mesh.vertices.getPos(vtx1);

        if (Vector2.signedArea(p0, p1, p) < 0) {
            // Edge has wrong direction
            continue;
        }

        const e = new Edge2(p0, p1);
        const d = e.closestPointDistance(p);

        if (d < minD) {
            minD = d;
            minEdge = edge;
        }
    }

    return minEdge;
}

export function mesh2FindClosestEdgeOriented<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
): MeshEdgeIdx | undefined {
    let minD = Number.POSITIVE_INFINITY;
    let minEdge = undefined;

    const iter = mesh.edges.createIterator();

    while (iter.next()) {
        const edge = iter.getIndex();
        const link = mesh.edges.getLink(edge);

        const vtx0 = mesh.links.getVertex(link);
        const vtx1 = mesh.links.getVertexSym(link);

        const p0 = mesh.vertices.getPos(vtx0);
        const p1 = mesh.vertices.getPos(vtx1);

        if (p0.x !== p1.x ? p0.x < p1.x : p0.y < p1.y) {
            // Edge has wrong orientation
            continue;
        }

        const e = new Edge2(p0, p1);
        const d = e.closestPointDistance(p);

        if (d < minD) {
            minD = d;
            minEdge = edge;
        }
    }

    return minEdge;
}

export function mesh2FindClosestEdgeAtExcept<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
    except: ReadonlyArray<MeshVertexIdx>,
): MeshEdgeIdx | undefined {
    let minD = Number.POSITIVE_INFINITY;
    let minEdge = undefined;

    const iter = mesh.edges.createIterator();

    while (iter.next()) {
        const edge = iter.getIndex();
        const link = mesh.edges.getLink(edge);

        const vtx0 = mesh.links.getVertex(link);
        const vtx1 = mesh.links.getVertexSym(link);

        if (except.includes(vtx0) || except.includes(vtx1)) {
            continue;
        }

        const p0 = mesh.vertices.getPos(vtx0);
        const p1 = mesh.vertices.getPos(vtx1);

        if (Vector2.signedArea(p0, p1, p) < 0) {
            // Edge has wrong direction
            continue;
        }

        const e = new Edge2(p0, p1);
        const d = e.closestPointDistance(p);

        if (d < minD) {
            minD = d;
            minEdge = edge;
        }
    }

    return minEdge;
}

export function mesh2FindClosestLinkAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
): MeshEdgeIdx | undefined {
    const edge = mesh2FindClosestEdgeAt(mesh, p);

    if (edge === undefined) {
        return undefined;
    }

    const link = mesh.edges.getLink(edge);
    const linkSym = mesh.links.getSym(link);

    const edgeSym = mesh.links.getEdge(linkSym);

    if (edgeSym === -1) {
        return undefined;
    }

    const vtx0 = mesh.links.getVertex(link);
    const vtx1 = mesh.links.getVertex(linkSym);

    const p0 = mesh.vertices.getPos(vtx0);
    const p1 = mesh.vertices.getPos(vtx1);

    const d0 = p.distance(p0);
    const d1 = p.distance(p1);

    if (d0 < d1) {
        return edge;
    } else {
        return edgeSym;
    }
}

export function mesh2FindClosestVertexAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
): MeshVertexIdx | undefined {
    let minD = Number.POSITIVE_INFINITY;
    let minVtx = undefined;

    const iter = mesh.vertices.createIterator();

    while (iter.next()) {
        const vtx = iter.getIndex();
        const vtxPos = mesh.vertices.getPos(vtx);
        const d = p.distance(vtxPos);

        if (d < minD) {
            minD = d;
            minVtx = vtx;
        }
    }

    return minVtx;
}

export function mesh2FindClosestVertexAtExcept<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    p: ReadonlyVector2,
    except: ReadonlyArray<MeshVertexIdx>,
): MeshVertexIdx | undefined {
    let minD = Number.POSITIVE_INFINITY;
    let minVtx = undefined;

    const iter = mesh.vertices.createIterator();

    while (iter.next()) {
        const vtx = iter.getIndex();

        if (except.includes(vtx)) {
            continue;
        }

        const vtxPos = mesh.vertices.getPos(vtx);
        const d = p.distance(vtxPos);

        if (d < minD) {
            minD = d;
            minVtx = vtx;
        }
    }

    return minVtx;
}

export function mesh2FindFaceAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    position: ReadonlyVector2,
    windingOperator: WindingOperator | CustomWindingOperator,
): MeshFaceIdx | undefined {
    // TODO: Find loops instead?
    const iterFace = mesh.faces.createIterator();
    const iterLoopsNext = mesh.loops.createIteratorNext(-1);
    const iterLinksLnext = mesh.links.createIteratorLnext(-1);

    while (iterFace.next()) {
        let wind = 0;

        const face = iterFace.getIndex();
        const firstLoop = mesh.faces.getFirstLoop(face);

        iterLoopsNext.reset(firstLoop);

        while (iterLoopsNext.next()) {
            const loop = iterLoopsNext.getIndex();
            const firstLink = mesh.loops.getFirstLink(loop);

            iterLinksLnext.reset(firstLink);

            while (iterLinksLnext.next()) {
                const link = iterLinksLnext.getIndex();

                wind += mesh2GetLinkWinding(mesh, link, position);
            }
        }

        if (isWindingInside(wind, windingOperator)) {
            return face;
        }
    }

    return undefined;
}

export function mesh2FindVertexAt<S, F, E, V>(mesh: Mesh2<S, F, E, V>, p: ReadonlyVector2): MeshVertexIdx | undefined {
    const iter = mesh.vertices.createIterator();

    while (iter.next()) {
        const vtx = iter.getIndex();
        const vtxPos = mesh.vertices.getPos(vtx);

        if (p.eq(vtxPos)) {
            return vtx;
        }
    }

    return undefined;
}

export function mesh2GetBounds<S, F, E, V>(mesh: Mesh2<S, F, E, V>): MinMaxBox2 {
    const iter = mesh.vertices.createIterator();
    const box = MinMaxBox2.createEmpty();

    while (iter.next()) {
        const vtx = iter.getIndex();
        const vtxPos = mesh.vertices.getPos(vtx);
        box.setEnclosePoint(box, vtxPos);
    }

    return box;
}

export function mesh2ClosestPointOnEdge<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    edge: MeshEdgeIdx,
    p: ReadonlyVector2,
): Vector2 {
    const link = mesh.edges.getLink(edge);
    const linkSym = mesh.links.getSym(link);

    const vtx = mesh.links.getVertex(link);
    const vtxSym = mesh.links.getVertex(linkSym);

    const p0 = mesh.vertices.getPos(vtx);
    const p1 = mesh.vertices.getPos(vtxSym);

    const e = new Edge2(p0, p1);

    return e.closestPoint(p);
}

export function mesh2GetConnectingLink<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    vtxFrom: MeshVertexIdx,
    vtxTo: MeshVertexIdx,
): MeshLinkIdx {
    const pFrom = mesh.vertices.getPos(vtxFrom);
    const pTo = mesh.vertices.getPos(vtxTo);
    const direction = pTo.sub(pFrom);

    const link = mesh.vertices.getFirstLink(vtxFrom);
    const linkEdge = mesh.links.getEdge(link);

    if (linkEdge < 0) {
        // Single link
        return link;
    }

    const vtx0 = mesh.links.getVertex(link);
    const vtx1 = mesh.links.getVertexSym(link);

    const p0 = mesh.vertices.getPos(vtx0);
    const p1 = mesh.vertices.getPos(vtx1);

    // Iterate around origin
    let linkCurr = link;
    let v1 = p1.sub(p0);

    let fallback = link;

    do {
        const linkNext = mesh.links.getOnext(linkCurr);
        const linkNextVtxSym = mesh.links.getVertexSym(linkNext);

        if (linkNextVtxSym === vtxTo) {
            // A link to `vtxTo` already exists
            return linkNext;
        }

        const p2 = mesh.vertices.getPos(linkNextVtxSym);
        const v2 = p2.sub(p0);

        if (Vector2.isBetweenCcw(direction, v1, v2)) {
            return linkCurr;
        }

        // TODO: Can we do without?
        if (v2.eq(direction)) {
            fallback = linkCurr;
        }

        linkCurr = linkNext;
        v1 = v2;
    } while (linkCurr !== link);

    // log.error("Mesh2: Cannot find connecting link (Fallback)");

    return fallback;
}

export function mesh2GetFacingLink<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    link: MeshLinkIdx,
    vertex: MeshVertexIdx,
): MeshLinkIdx {
    const linkSym = mesh.links.getSym(link);

    const vtx0 = mesh.links.getVertex(link);
    const vtx1 = mesh.links.getVertex(linkSym);

    const p0 = mesh.vertices.getPos(vtx0);
    const p1 = mesh.vertices.getPos(vtx1);

    const p = mesh.vertices.getPos(vertex);

    return Vector2.signedArea(p0, p1, p) > 0 ? link : linkSym;
}

/**
 * Return the winding number of `link` from `position`.
 *
 * Note: Links with the same loop on each side return `0`.
 */
export function mesh2GetLinkWinding<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    link: MeshLinkIdx,
    position: ReadonlyVector2,
): number {
    const linkSym = mesh.links.getSym(link);

    const loop = mesh.links.getLoop(link);
    const loopSym = mesh.links.getLoop(linkSym);

    if (loop === loopSym) {
        // Edge does not contribute to winding
        return 0;
    }

    const vtx = mesh.links.getVertex(link);
    const vtxSym = mesh.links.getVertex(linkSym);

    const pos = mesh.vertices.getPos(vtx);
    const posSym = mesh.vertices.getPos(vtxSym);

    const c = new Bezier1Curve2(pos, posSym);

    return c.windingAt(position);
}

/**
 * Returns `true` if `vtx` is the last vertex in its shell.
 */
export function mesh2IsLastVertex<S, F, E, V>(mesh: Mesh2<S, F, E, V>, vtx: MeshVertexIdx): boolean {
    const link = mesh.vertices.getFirstLink(vtx);
    const loop = mesh.links.getLoop(link);
    const face = mesh.loops.getFace(loop);

    if (face !== mesh.faces.getNext(face)) {
        // At least one other face (and vertex)
        return false;
    }

    if (loop !== mesh.loops.getNext(loop)) {
        // At least one other loop (and vertex)
        return false;
    }

    if (link !== mesh.links.getLnext(link)) {
        // At least one other vertex
        return false;
    }

    return true;
}

/**
 * Returns `true` if every vertex position of `innerLoop` is fully inside `outerLoop`.
 */
export function mesh2IsLoopInside<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    innerLoop: MeshLoopIdx,
    outerLoop: MeshLoopIdx,
    windingOperator: WindingOperator | CustomWindingOperator,
): boolean {
    const innerFirstLink = mesh.loops.getFirstLink(innerLoop);
    const outerFirstLink = mesh.loops.getFirstLink(outerLoop);

    let currInnerLink = innerFirstLink;

    do {
        const innerVtx = mesh.links.getVertex(currInnerLink);
        const innerPos = mesh.vertices.getPos(innerVtx);

        let currOuterLink = outerFirstLink;
        let wind = 0;

        do {
            wind += mesh2GetLinkWinding(mesh, currOuterLink, innerPos);

            currOuterLink = mesh.links.getLnext(currOuterLink);
        } while (currOuterLink !== outerFirstLink);

        if (!isWindingInside(wind, windingOperator)) {
            return false;
        }

        currInnerLink = mesh.links.getLnext(currInnerLink);
    } while (currInnerLink !== innerFirstLink);

    return true;
}

export function mesh2IsMergableVertex<S, F, E, V>(mesh: Mesh2<S, F, E, V>, vertex: MeshVertexIdx): boolean {
    const linkSym = mesh.vertices.getFirstLink(vertex);
    const linkOnextSym = mesh.links.getOnext(linkSym);
    const linkOnextOnextSym = mesh.links.getOnext(linkOnextSym);

    if (linkSym === linkOnextSym || linkSym !== linkOnextOnextSym) {
        // Outgoing links must be exactly 2
        return false;
    }

    const link = mesh.links.getSym(linkSym);
    const linkOnext = mesh.links.getSym(linkOnextSym);

    const linkVtx = mesh.links.getVertex(link);
    const linkVtxOnext = mesh.links.getVertex(linkOnext);

    if (linkVtx === linkVtxOnext) {
        // Must not merge to same origin
        return false;
    }

    return true;
}

export function mesh2MergeEdgeAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    vertex: MeshVertexIdx,
    edgeToKeep: MaybeMeshEdgeIdx,
): boolean {
    if (!mesh2IsMergableVertex(mesh, vertex)) {
        return false;
    }

    const linkSym = mesh.vertices.getFirstLink(vertex);
    const linkOnextSym = mesh.links.getOnext(linkSym);

    const link = mesh.links.getSym(linkSym);
    const linkOnext = mesh.links.getSym(linkOnextSym);

    const edge = mesh.links.getEdge(link);
    const edgeSym = mesh.links.getEdge(linkSym);
    const edgeOnext = mesh.links.getEdge(linkOnext);
    const edgeOnextSym = mesh.links.getEdge(linkOnextSym);

    if (edge === -1 || edgeSym === -1 || edgeOnext === -1 || edgeOnextSym === -1) {
        // Empty edges
        return false;
    }

    if (edge !== edgeToKeep) {
        mesh.killVertexEdgeSplit(linkOnext, linkOnextSym, vertex, edgeSym, edge);
        mesh.edges.destroy(edgeSym);
        mesh.edges.destroy(edge);
    } else {
        mesh.killVertexEdgeSplit(link, linkSym, vertex, edgeOnextSym, edgeOnext);
        mesh.edges.destroy(edgeOnextSym);
        mesh.edges.destroy(edgeOnext);
    }

    mesh.vertices.destroy(vertex);

    return true;
}

export function mesh2MergeLink<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    link: MeshLinkIdx,
    vtx: MeshVertexIdx,
): { face: MaybeMeshFaceIdx } | undefined {
    const linkSym = mesh.links.getSym(link);
    const linkOnext = mesh.links.getOnext(link);

    if (link !== linkOnext) {
        // Must be single link
        return undefined;
    }

    const edge = mesh.links.getEdge(link);
    const edgeSym = mesh.links.getEdge(linkSym);

    if (edge === -1 || edgeSym === -1) {
        // Must be valid edges
        return undefined;
    }

    const linkVtx = mesh.links.getVertex(link);
    const linkVtxSym = mesh.links.getVertex(linkSym);

    const loop = mesh.links.getLoop(link);
    const face = mesh.loops.getFace(loop);

    // Add edge
    const vtx1 = vtx;
    const vtx2 = linkVtxSym;

    if (vtx1 === vtx2) {
        // Vertices must not be equal
        return undefined;
    }

    const link1 = mesh2GetConnectingLink(mesh, vtx1, vtx2);
    let link2 = mesh2GetConnectingLink(mesh, vtx2, vtx1);

    const vtxSym1 = mesh.links.getVertexSym(link1);
    const vtxSym2 = mesh.links.getVertexSym(link2);

    if (vtx1 === vtxSym2 && vtx2 === vtxSym1) {
        // Vertices must not be connected yet
        return undefined;
    }

    const loop1 = mesh.links.getLoop(link1);
    const loop2 = mesh.links.getLoop(link2);
    const face1 = mesh.loops.getFace(loop1);
    const face2 = mesh.loops.getFace(loop2);

    if (face1 !== face2) {
        // Faces must be equal
        return undefined;
    }

    // Kill edge
    const linkSymOprev = mesh.links.getOprev(linkSym);
    mesh.killEdgeMakeLoop(link, linkSymOprev, edge, edgeSym);

    // Kill and destroy vertex
    mesh.killVertex(linkVtx, face);
    mesh.vertices.destroy(linkVtx);

    // Get connecting link again because it might have been killed
    link2 = mesh2GetConnectingLink(mesh, vtx2, vtx1);

    // Finally, add edge and possible a face
    let newFace: MaybeMeshFaceIdx = -1;

    if (loop1 === loop2) {
        newFace = mesh.faces.create(null);

        const area = mesh2CalculateSignedArea(mesh, link1, link2);

        if (area < 0) {
            mesh.makeEdgeFace(link1, link2, edge, edgeSym, newFace);
            mesh2UpdateInnerLoops(mesh, link1, link2);
        } else {
            mesh.makeEdgeFace(link2, link1, edgeSym, edge, newFace);
            mesh2UpdateInnerLoops(mesh, link2, link1);
        }
    } else {
        mesh.makeEdgeKillLoop(link1, link2, edge, edgeSym);
    }

    return { face: newFace };
}

export function mesh2MoveLoopToFace<S, F, E, V>(mesh: Mesh2<S, F, E, V>, loop: MeshLoopIdx, face: MeshFaceIdx): void {
    // Check if `loop` is the first loop in its face
    const loopFace = mesh.loops.getFace(loop);
    const loopFirstLoop = mesh.faces.getFirstLoop(loopFace);

    if (loop === loopFirstLoop) {
        const loopNextLoop = mesh.loops.getNext(loopFirstLoop);
        assertDebug(loopFirstLoop !== loopNextLoop);

        mesh.faces.setFirstLoop(loopFace, loopNextLoop);
    }

    // Move the loop to the new face
    const firstLoop = mesh.faces.getFirstLoop(face);

    mesh.loops.removeLoop(loop);
    mesh.loops.updateFace(loop, loop, face);
    mesh.loops.insertLoop(loop, firstLoop);
}

/**
 * Removes `edge` from the mesh while preserving `faceToKeep`.
 *
 * If `faceToKeep` is a valid face of either side of `edge`, the other face will be
 *  removed instead of `faceToKeep`. Otherwise, the face of `edge` will removed.
 */
export function mesh2RemoveEdge<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    edge: MeshEdgeIdx,
    faceToKeep: MaybeMeshFaceIdx,
): void {
    const link = mesh.edges.getLink(edge);
    const linkSym = mesh.links.getSym(link);

    const edgeSym = mesh.links.getEdge(linkSym);
    assertDebug(edgeSym !== -1);

    const loop = mesh.links.getLoop(link);
    const loopSym = mesh.links.getLoop(linkSym);

    const face = mesh.loops.getFace(loop);
    const faceSym = mesh.loops.getFace(loopSym);

    const linkOprev = mesh.links.getOprev(link);
    const linkSymOprev = mesh.links.getOprev(linkSym);

    if (loop === loopSym) {
        mesh.killEdgeMakeLoop(linkOprev, linkSymOprev, edge, edgeSym);
    } else if (face !== faceToKeep) {
        mesh.killEdgeFace(linkOprev, linkSymOprev, edge, edgeSym, face);
        mesh.faces.destroy(face);
    } else {
        mesh.killEdgeFace(linkSymOprev, linkOprev, edgeSym, edge, faceSym);
        mesh.faces.destroy(faceSym);
    }

    mesh.edges.destroy(edge);
    mesh.edges.destroy(edgeSym);
}

/**
 * Removes `shell` and every related primitive from the mesh.
 */
export function mesh2RemoveShell<S, F, E, V>(mesh: Mesh2<S, F, E, V>, shell: MeshShellIdx): void {
    const iterFaces = mesh.faces.createIterator();
    const iterLoopNext = mesh.loops.createIteratorNext(-1);
    const iterLinkLnext = mesh.links.createIteratorLnext(-1);

    while (iterFaces.next()) {
        const face = iterFaces.getIndex();
        const faceFirstLoop = mesh.faces.getFirstLoop(face);
        iterLoopNext.reset(faceFirstLoop);

        while (iterLoopNext.next()) {
            const loop = iterLoopNext.getIndex();
            const loopFirstLink = mesh.loops.getFirstLink(loop);
            iterLinkLnext.reset(loopFirstLink);

            while (iterLinkLnext.next()) {
                const link = iterLinkLnext.getIndex();
                const vertex = mesh.links.getVertex(link);
                const vertexFirstLink = mesh.vertices.getFirstLink(vertex);

                if (link === vertexFirstLink) {
                    mesh.vertices.reset(vertex);
                    mesh.vertices.destroy(vertex);
                }

                const edge = mesh.links.getEdge(link);

                if (edge !== -1) {
                    mesh.edges.reset(edge);
                    mesh.edges.destroy(edge);
                }

                mesh.links.reset(link);
                mesh.links.destroy(link);
            }

            mesh.loops.reset(loop);
            mesh.loops.destroy(loop);
        }

        mesh.faces.reset(face);
        mesh.faces.destroy(face);
    }

    mesh.shells.removeShell(shell);
    mesh.shells.reset(shell);
    mesh.shells.destroy(shell);
}

/**
 * Removes `vertex` from the mesh.
 *
 * The shell and face are also removed if `vertex` is the last one in the mesh.
 */
export function mesh2RemoveVertex<S, F, E, V>(mesh: Mesh2<S, F, E, V>, vertex: MeshVertexIdx): void {
    const link = mesh.vertices.getFirstLink(vertex);

    const edge = mesh.links.getEdge(link);
    assertDebug(edge === -1, "Vertex must have no edges");

    const loop = mesh.links.getLoop(link);
    const face = mesh.loops.getFace(loop);

    if (mesh2IsLastVertex(mesh, vertex)) {
        const shell = mesh.faces.getShell(face);
        mesh.killVertexFaceShell(vertex, face, shell);

        mesh.shells.destroy(shell);
        mesh.faces.destroy(face);
    } else {
        mesh.killVertex(vertex, face);
    }

    mesh.vertices.destroy(vertex);
}

/**
 * Removes `vertex` from the mesh while preserving `faceToKeep`.
 *
 * If edges are removed and `faceToKeep` is a valid face of either side of
 * its edge, the other face will be removed instead of `faceToKeep`.
 */
export function mesh2RemoveVertexAndEdges<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    vertex: MeshVertexIdx,
    faceToKeep: MaybeMeshFaceIdx = -1,
): void {
    // Gradually remove edges around the vertex
    let curr = mesh.vertices.getFirstLink(vertex);
    let currEdge = mesh.links.getEdge(curr);

    while (currEdge !== -1) {
        // Get next link before removing edge
        const next = mesh.links.getOnext(curr);

        mesh2RemoveEdge(mesh, currEdge, faceToKeep);

        curr = next;
        currEdge = mesh.links.getEdge(curr);
    }

    // Finally, remove the vertex
    mesh2RemoveVertex(mesh, vertex);
}

export function mesh2SplitEdgeAt<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    edge: MeshEdgeIdx,
    pos: ReadonlyVector2,
): { vertex: MeshVertexIdx; edge1: MeshEdgeIdx; edge2: MeshEdgeIdx } {
    const newVertex = mesh.vertices.create(null, pos);
    const newEdge1 = mesh.edges.create(null);
    const newEdge2 = mesh.edges.create(null);

    const link1 = mesh.edges.getLink(edge);
    const link2 = mesh.links.getSym(link1);

    mesh.makeVertexEdgeSplit(link1, link2, newVertex, newEdge1, newEdge2);

    return { vertex: newVertex, edge1: newEdge1, edge2: newEdge2 };
}

export function mesh2SplitLink<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    link: MeshLinkIdx,
    faceToKeep: MeshFaceIdx,
): MeshVertexIdx | undefined {
    const linkSym = mesh.links.getSym(link);
    const linkOnext = mesh.links.getOnext(link);
    const linkVtx = mesh.links.getVertex(link);

    if (link === linkOnext) {
        return undefined;
    }

    const edge = mesh.links.getEdge(link);
    const edgeSym = mesh.links.getEdge(linkSym);

    if (edge === -1 || edgeSym === -1) {
        // Must be valid edges
        return undefined;
    }

    // Remove edge of the link
    const loop = mesh.links.getLoop(link);
    const loopSym = mesh.links.getLoop(linkSym);

    const face = mesh.loops.getFace(loop);
    const faceSym = mesh.loops.getFace(loopSym);

    const linkOprev = mesh.links.getOprev(link);
    const linkSymOprev = mesh.links.getOprev(linkSym);

    if (loop === loopSym) {
        mesh.killEdgeMakeLoop(linkOprev, linkSymOprev, edge, edgeSym);
    } else if (face !== faceToKeep) {
        mesh.killEdgeFace(linkOprev, linkSymOprev, edge, edgeSym, face);
        mesh.faces.destroy(face);
    } else {
        mesh.killEdgeFace(linkSymOprev, linkOprev, edgeSym, edge, faceSym);
        mesh.faces.destroy(faceSym);
    }

    // Create new vertex at the same position of the link
    const pos = mesh.vertices.getPos(linkVtx);

    const newVertex = mesh.vertices.create(null, pos);
    mesh.makeVertex(newVertex, faceToKeep);

    // Re-add connecting edge
    const link1 = mesh.vertices.getFirstLink(newVertex);
    const link2 = linkSymOprev;

    mesh.makeEdgeKillLoop(link1, link2, edge, edgeSym);

    return newVertex;
}

/**
 * Checks if loops from the face of `outerLink` are inside of the loop
 * of `innerLink` and moves them to the face of `innerLink`.
 */
export function mesh2UpdateInnerLoops<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    outerLink: MeshLinkIdx,
    innerLink: MeshLinkIdx,
): void {
    // The face of the outer loop contains all loops that need to be checked
    const outerLoop = mesh.links.getLoop(outerLink);

    // The inner face is the new face
    const innerLoop = mesh.links.getLoop(innerLink);
    const innerFace = mesh.loops.getFace(innerLoop);

    // Skip `outerLoop` because its equivalent to `innerLoop` (but inverted)
    let currLoop = mesh.loops.getNext(outerLoop);

    do {
        // Assign the next loop before the current loop is potentially moved to another face
        const nextLoop = mesh.loops.getNext(currLoop);

        if (mesh2IsLoopInside(mesh, currLoop, innerLoop, WindingOperator.POSITIVE)) {
            mesh2MoveLoopToFace(mesh, currLoop, innerFace);
        }

        currLoop = nextLoop;
    } while (currLoop !== outerLoop);
}

export function mesh2WriteFaceToPath<S, F, E, V>(mesh: Mesh2<S, F, E, V>, idx: MeshFaceIdx, outPath: Path2): void {
    const firstLoop = mesh.faces.getFirstLoop(idx);
    let currLoop = firstLoop;

    do {
        const firstLink = mesh.loops.getFirstLink(currLoop);
        const firstVtx = mesh.links.getVertex(firstLink);
        const firstPos = mesh.vertices.getPos(firstVtx);
        outPath.moveTo(firstPos);

        let count = 0;
        let currLink = mesh.links.getLnext(firstLink);

        while (currLink !== firstLink) {
            const currVtx = mesh.links.getVertex(currLink);
            const currPos = mesh.vertices.getPos(currVtx);
            outPath.lineTo(currPos);

            count += 1;
            currLink = mesh.links.getLnext(currLink);
        }

        if (count > 0) {
            outPath.close();
        }

        currLoop = mesh.loops.getNext(currLoop);
    } while (currLoop !== firstLoop);
}

export function mesh2WriteFaceToPathReversed<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    idx: MeshFaceIdx,
    outPath: Path2,
): void {
    const firstLoop = mesh.faces.getFirstLoop(idx);
    let currLoop = firstLoop;

    do {
        const firstLink = mesh.loops.getFirstLink(currLoop);
        const firstVtx = mesh.links.getVertex(firstLink);
        const firstPos = mesh.vertices.getPos(firstVtx);
        outPath.moveTo(firstPos);

        let count = 0;
        let currLink = mesh.links.getLprev(firstLink);

        while (currLink !== firstLink) {
            const currVtx = mesh.links.getVertex(currLink);
            const currPos = mesh.vertices.getPos(currVtx);
            outPath.lineTo(currPos);

            count += 1;
            currLink = mesh.links.getLprev(currLink);
        }

        if (count > 0) {
            outPath.close();
        }

        currLoop = mesh.loops.getNext(currLoop);
    } while (currLoop !== firstLoop);
}

export function mesh2CalculateSignedArea<S, F, E, V>(
    mesh: Mesh2<S, F, E, V>,
    linkFrom: MeshLinkIdx,
    linkTo: MeshLinkIdx,
): number {
    const fromVtx = mesh.links.getVertex(linkFrom);
    const p0 = mesh.vertices.getPos(fromVtx);

    let area = 0;
    let link = linkFrom;
    let p1 = p0;

    do {
        const next = mesh.links.getLnext(link);
        const nextVtx = mesh.links.getVertex(next);
        const p2 = mesh.vertices.getPos(nextVtx);

        area += p1.cross(p2);
        link = next;
        p1 = p2;
    } while (link !== linkTo);

    // Final segment
    area += p1.cross(p0);

    return area / 2;
}

function sortAndTruncateFree(free: number[], maxLength: number): number {
    free.sort((a, b) => a - b);

    let freeIdx = free.length - 1;
    let maxIdx = maxLength - 1;

    while (freeIdx >= 0) {
        if (maxIdx !== free[freeIdx]) {
            break;
        }

        freeIdx -= 1;
        maxIdx -= 1;
    }

    free.splice(freeIdx + 1);

    return maxIdx + 1;
}
