import { Mesh2LnextIterator, Mesh2OnextIterator } from "../internal";
import { Bezier1Curve2, BezierCurve2, Point2, Vector2 } from "../primitives";
import { ArrayMultiMap, assertDebug, log } from "../utility";
import { Path2 } from "./path";

type MeshStatus2 = {
    isMerge: boolean;
    helper: MeshEdge2;
    face?: MeshFace2;
};

/**
 * Represents a half edge of a mesh.
 *
 * Based on the quad-edge data structure described by Leonidas Guibas and Jorge Stolfi.
 * It is only required to hold `p0`, `onext`, `lnext` and `sym` for each edge to build their relationships:
 * - `p0` defines the origin location (vertex) of the edge
 * - `onext` references the next edge in CCW direction around its origin
 * - `lnext` references the next edge within the face
 * - `sym` references the complementary half edge
 * - `face` references the inner face of the edge
 *
 * References:
 * - Leonidas Guibas, Jorge Stolfi.
 *   *Primitives for the Manipulation of General Subdivisions and the Computation of Voronoi Diagrams*.
 *   ACM Transactions on Graphics, Vol. 4, No. 2, April 1985, Pages 74-123.
 * - Paul Heckbert.
 *   *Quad-Edge Data Structure and Library*.
 *   https://www.cs.cmu.edu/afs/andrew/scs/cs/15-463/2001/pub/src/a2/quadedge.html
 */
export class MeshEdge2 {
    public chain: MeshChain2 | undefined;
    public data: unknown;
    public face: MeshFace2 | undefined;
    public lnext: MeshEdge2;
    public onext: MeshEdge2;
    public p0: Point2;
    public seg: BezierCurve2 | undefined;
    public sym: MeshEdge2;

    public constructor(p0: Point2, seg: BezierCurve2 | undefined, data: unknown) {
        this.p0 = p0;
        this.seg = seg;
        this.data = data;

        this.lnext = this;
        this.onext = this;
        this.sym = this;

        this.chain = undefined;
        this.face = undefined;
    }

    public get left(): boolean {
        // Orientation of the edge
        if (this.p0.x !== this.p1.x) {
            return this.p0.x < this.p1.x;
        } else {
            return this.p0.y < this.p1.y;
        }
    }

    public get lprev(): MeshEdge2 {
        return this.onext.sym;
    }

    public get oprev(): MeshEdge2 {
        return this.sym.lnext;
    }

    public get p1(): Point2 {
        return this.sym.p0;
    }

    public get vector(): Vector2 {
        return this.p1.sub(this.p0);
    }

    /**
     * Clears edge references.
     *
     * Note: Does not ensure valid mesh topology for adjacent edges.
     */
    public static clear(e: MeshEdge2): void {
        e.lnext = e;
        e.onext = e;
        e.sym = e;

        e.chain = undefined;
        e.face = undefined;
    }

    public static compareQueue(e1: MeshEdge2, e2: MeshEdge2): number {
        if (e1.p0.x !== e2.p0.x) {
            // Sort by `x`
            return e1.p0.x - e2.p0.x;
        } else if (e1.p0.y !== e2.p0.y) {
            // Same `x`, sort by `y`
            return e1.p0.y - e2.p0.y;
        } else if (e1.left !== e2.left) {
            // Same `y`, sort `!left` before `left`
            return e1.left ? 1 : -1;
        } else if (e1.left) {
            // Same left point
            return Point2.signedArea(e1.p1, e1.p0, e2.p1);
        } else {
            // Same right point
            return Point2.signedArea(e1.p0, e1.p1, e2.p1);
        }
    }

    public static compareStatus(e1: MeshEdge2, e2: MeshEdge2): number {
        if (e1.p0.eq(e2.p0)) {
            if (e1.p1.eq(e2.p1)) {
                // Edges are equal
                return 0;
            } else {
                // Same `p0`
                return Point2.signedArea(e1.p0, e1.p1, e2.p1);
            }
        } else {
            if (MeshEdge2.compareQueue(e1, e2) < 0) {
                // `e1` left of `e2`
                return Point2.signedArea(e1.p0, e1.p1, e2.p0);
            } else {
                // `e2` left of `e1`
                return Point2.signedArea(e2.p1, e2.p0, e1.p0);
            }
        }
    }

    /**
     * Creates a symmetric pair of half edges and returns the first one.
     */
    public static createPair(seg1: BezierCurve2, seg2?: BezierCurve2): MeshEdge2 {
        const e1 = new MeshEdge2(seg1.p0, seg1, undefined);
        const e2 = new MeshEdge2(seg1.p1, seg2, undefined);

        e1.sym = e2;
        e1.lnext = e2;
        e2.sym = e1;
        e2.lnext = e1;

        return e1;
    }

    /**
     * Disconnects symmetric pair `e` from the rest of the mesh.
     */
    public static detachPair(e: MeshEdge2): void {
        MeshEdge2.splice(e, e.oprev);
        MeshEdge2.splice(e.sym, e.sym.oprev);
    }

    /**
     * Find the edge around `e` so that `v` lies between the found edge and its `onext`.
     */
    public static findConnectingEdge(e: MeshEdge2, v: Vector2): MeshEdge2 {
        // Check if `e` is the only edge around its origin
        if (e === e.onext) {
            return e;
        }

        // Iterate around origin
        let curr = e;

        do {
            const next = curr.onext;

            if (Vector2.isBetweenCcw(v, curr.vector, next.vector)) {
                return curr;
            }

            curr = next;
        } while (curr !== e);

        log.error("Mesh2: Cannot find connecting edge (Fallback)");

        return e;
    }

    public static isJoin(e1: MeshEdge2, e2: MeshEdge2): boolean {
        return e1.p1.eq(e2.p0);
    }

    /**
     * Joins the head of `e1` to the tail of `e2`.
     *
     * Note: Will not create valid topology if `e1` or `e2` are part of edge fans.
     */
    public static join(e1: MeshEdge2, e2: MeshEdge2): void {
        const e1sym = e1.sym;
        const e2sym = e2.sym;

        e1.lnext = e2;
        e2.onext = e1sym;

        e1sym.onext = e2;
        e2sym.lnext = e1sym;
    }

    /**
     * Splicing of the two mesh edges `e1` and `e2`.
     *
     * Note: For a valid mesh topology, `e2` needs to lie directly between `e1` and `e1.onext`.
     */
    public static splice(e1: MeshEdge2, e2: MeshEdge2): void {
        // Splicing (see reference)
        const e1onext = e1.onext;
        const e2onext = e2.onext;

        e1onext.sym.lnext = e2;
        e2onext.sym.lnext = e1;

        e1.onext = e2onext;
        e2.onext = e1onext;
    }

    /**
     * Swaps `e` between neighboring (triangulated) edges.
     * ```
     *        / \                /|\
     *       /   \              / | \
     *      /     \ b          /  |  \ b
     *     /       \          /   |   \
     *    /    e    \        /    |    \
     *    -----------   ->      e | e.sym
     *    \  e.sym  /        \    |    /
     *     \       /          \   |   /
     *    a \     /          a \  |  /
     *       \   /              \ | /
     *        \ /                \|/
     * ```
     * Note: Both faces are oriented CCW so that `a = e.oprev` and `b = e.lnext`.
     */
    public static swap(e: MeshEdge2): void {
        const f1 = e.face;
        const f2 = e.sym.face;

        // Swapping requires faces on both sides of the edge
        if (f1 === undefined || f2 === undefined) {
            return;
        }

        // Swapping (see reference)
        const a = e.oprev;
        const b = e.lnext;

        MeshEdge2.splice(e, a);
        MeshEdge2.splice(e.sym, b);

        MeshEdge2.splice(e, a.lnext);
        MeshEdge2.splice(e.sym, b.lnext);

        // Update segment
        const seg = new Bezier1Curve2(a.p1, b.p1);

        e.p0 = seg.p0;
        e.seg = seg;
        e.sym.p0 = seg.p1;
        e.sym.seg = seg.reverse();

        // Update faces
        f1.start = e;
        MeshFace2.updateEdgeFaces(f1, f1);

        f2.start = e.sym;
        MeshFace2.updateEdgeFaces(f2, f2);
    }

    /**
     * Clones the mesh edge (unlinked).
     *
     * Note: The new mesh edge is not referenced by any mesh.
     */
    public clonePair(): MeshEdge2 {
        const sym = this.sym;

        const e1 = new MeshEdge2(this.p0, this.seg, this.data);
        const e2 = new MeshEdge2(sym.p0, sym.seg, sym.data);

        e1.sym = e2;
        e1.lnext = e2;
        e2.sym = e1;
        e2.lnext = e1;

        return e1;
    }

    /**
     * Returns an iterator which traverses edges around `lnext` starting with `this`.
     */
    public getLnextIterator(): Mesh2LnextIterator {
        return new Mesh2LnextIterator(this, this.lprev);
    }

    /**
     * Returns an iterator which traverses edges around `onext` starting with `this`.
     */
    public getOnextIterator(): Mesh2OnextIterator {
        return new Mesh2OnextIterator(this, this.oprev);
    }

    /**
     * Checks if the edge needs swapping according to Delaunay criteria (incircle test).
     */
    public needsSwap(): boolean {
        // Swapping requires faces on both sides of the edge
        if (this.face === undefined || this.sym.face === undefined) {
            return false;
        }

        // A, B and C are ordered CCW, D is the opposing point
        const pa = this.p0;
        const pb = this.sym.p0;
        const pc = this.lnext.p1;
        const pd = this.sym.lnext.p1;

        // Incircle test (see reference)
        const va = pa.sub(pd);
        const vb = pb.sub(pd);
        const vc = pc.sub(pd);

        // | ax  ay  ax^2 + ay^2  1 |   | (ax - dx)  (ay - dy)  (ax^2 - dx^2) + (ay^2 - dy^2) |
        // | bx  by  bx^2 + by^2  1 | = | (bx - dx)  (by - dy)  (bx^2 - dx^2) + (by^2 - dy^2) |
        // | cx  cy  cx^2 + cy^2  1 |   | (cx - dx)  (cy - dy)  (cx^2 - dx^2) + (cy^2 - dy^2) |
        // | dx  dy  dx^2 + dy^2  1 |
        const a = va.lengthSq * vb.cross(vc);
        const b = vb.lengthSq * va.cross(vc);
        const c = vc.lengthSq * va.cross(vb);

        // D lies inside the incircle of A, B and C if the determinant > 0
        return a - b + c > 0;
    }

    public toString(): string {
        return `{p0: ${this.p0}, p1: ${this.p1}}`;
    }

    public validate(): void {
        assertDebug(this.sym !== this);
        assertDebug(this.sym.sym === this);

        assertDebug(this.lnext.onext.sym === this);
        assertDebug(this.onext.sym.lnext === this);

        assertDebug((this.seg !== undefined) === (this.face !== undefined));

        let curr = this.onext;

        do {
            const prev = curr.oprev;
            const next = curr.onext;

            if (prev !== next) {
                assertDebug(curr.p0.eq(prev.p0) && curr.p0.eq(next.p0));
                assertDebug(Vector2.isBetweenCcw(curr.vector, prev.vector, next.vector));
            }

            curr = curr.onext;
        } while (curr !== this.onext);
    }
}

/**
 * Represents a chain of a mesh.
 */
export class MeshChain2 {
    public data: unknown;
    public head: MeshEdge2;
    public tail: MeshEdge2;

    constructor(head: MeshEdge2, tail: MeshEdge2, data: unknown) {
        this.head = head;
        this.tail = tail;
        this.data = data;
    }

    public static updateEdgeChains(ch: MeshChain2, target: MeshChain2 | undefined): void {
        for (const e of ch.getEdgeIterator()) {
            e.chain = target;
        }
    }

    /**
     * Returns an iterator which traverses all edges of the chain.
     */
    public getEdgeIterator(): Mesh2LnextIterator {
        return new Mesh2LnextIterator(this.tail, this.head);
    }

    public isClosed(): boolean {
        return MeshEdge2.isJoin(this.head, this.tail);
    }

    public printDebug(): void {
        let message = "MeshChain2 {\n";
        for (const e of this.getEdgeIterator()) {
            message += `    MeshEdge2 ${e}\n`;
        }
        message += "}";

        log.infoDebug("{}", message);
    }

    public writeToPath(path: Path2): void {
        const iter = this.getEdgeIterator();

        let next = iter.next();

        if (next.done !== true) {
            path.moveTo(next.value.p0);
            next = iter.next();
        }

        while (next.done !== true) {
            path.lineTo(next.value.p0);
            next = iter.next();
        }
    }
}

/**
 * Represents a face of a mesh.
 */
export class MeshFace2 {
    public data: unknown;
    public start: MeshEdge2;

    constructor(start: MeshEdge2, data: unknown) {
        this.start = start;
        this.data = data;
    }

    public static updateEdgeFaces(f: MeshFace2, target: MeshFace2 | undefined): void {
        for (const edge of f.getEdgeIterator()) {
            edge.face = target;
        }
    }

    /**
     * Returns an iterator which traverses all edges of the face.
     */
    public getEdgeIterator(): Mesh2LnextIterator {
        return new Mesh2LnextIterator(this.start, this.start.lprev);
    }

    /**
     * Returns an array containing the edges of the face.
     */
    public getEdges(): MeshEdge2[] {
        const edges: MeshEdge2[] = [];

        for (const e of this.getEdgeIterator()) {
            edges.push(e);
        }

        return edges;
    }

    /**
     * Returns an array containing the origin points of the face.
     */
    public getPoints(): Point2[] {
        const points: Point2[] = [];

        for (const e of this.getEdgeIterator()) {
            points.push(e.p0);
        }

        return points;
    }

    /**
     * Returns the signed area of the face.
     */
    public getSignedArea(): number {
        let area = 0;

        for (const e of this.getEdgeIterator()) {
            // If segment does not exist, use origin points as fallback
            const seg = e.seg ?? new Bezier1Curve2(e.p0, e.p1);
            area += seg.getSignedArea();
        }

        return area;
    }

    /**
     * Returns `true` if a point `p` is inside the face.
     */
    public hasPointInside(p: Point2): boolean {
        let wind = 0;

        for (const e of this.getEdgeIterator()) {
            // If segment does not exist, use origin points as fallback
            const seg = e.seg ?? new Bezier1Curve2(e.p0, e.p1);
            wind += seg.getWindingAt(p);
        }

        // Non-zero rule suffices
        return wind !== 0;
    }

    public isMonotoneInX(): boolean {
        const last = this.start.lprev;

        let turns = 0;
        let d0 = last.p1.x - last.p0.x;

        for (const edge of this.getEdgeIterator()) {
            const d1 = edge.p1.x - edge.p0.x;

            if ((d0 > 0 || d1 > 0) && (d0 < 0 || d1 < 0)) {
                turns += 1;
            }

            d0 = d1;
        }

        return turns <= 2;
    }

    public printDebug(): void {
        let message = "MeshFace2 {\n";

        for (const e of this.getEdgeIterator()) {
            message += `    MeshEdge2 ${e}\n`;
        }

        message += "}";

        log.infoDebug("{}", message);
    }

    public writeToPath(path: Path2): void {
        const iter = this.getEdgeIterator();

        let next = iter.next();

        if (next.done !== true) {
            path.moveTo(next.value.p0);
            next = iter.next();
        }

        while (next.done !== true) {
            path.lineTo(next.value.p0);
            next = iter.next();
        }

        path.close();
    }
}

export class Mesh2 {
    private chains: MeshChain2[];
    private edges: MeshEdge2[];
    private faces: MeshFace2[];

    constructor() {
        this.chains = [];
        this.edges = [];
        this.faces = [];
    }

    /**
     * Create a new mesh from a chain.
     */
    public static createFromChain(ch: MeshChain2): Mesh2 {
        const mesh = new Mesh2();

        const iter = ch.getEdgeIterator();
        const eb0 = iter.curr.clonePair();
        mesh.edges.push(eb0);

        // Skip the first edge because we have already retrieved it
        iter.next();

        let eb1 = eb0;

        for (const ea of iter) {
            const eb = ea.clonePair();
            mesh.edges.push(eb);

            MeshEdge2.join(eb1, eb);

            eb1 = eb;
        }

        const chb = new MeshChain2(eb0, eb1, ch.data);
        MeshChain2.updateEdgeChains(chb, chb);
        mesh.chains.push(chb);

        return mesh;
    }

    /**
     * Create a new mesh from a face.
     */
    public static createFromFace(f: MeshFace2): Mesh2 {
        const mesh = new Mesh2();

        const iter = f.getEdgeIterator();
        const eb0 = iter.curr.clonePair();
        mesh.edges.push(eb0);

        // Skip the first edge because we have already retrieved it
        iter.next();

        let eb1 = eb0;

        for (const ea of iter) {
            const eb = ea.clonePair();
            MeshEdge2.join(eb1, eb);
            mesh.edges.push(eb);

            eb1 = eb;
        }

        MeshEdge2.join(eb1, eb0);

        const fb = new MeshFace2(eb0, f.data);
        MeshFace2.updateEdgeFaces(fb, fb);
        mesh.faces.push(fb);

        return mesh;
    }

    public addChainSegment(seg: BezierCurve2, data?: unknown): MeshEdge2 {
        // Create and add new edge
        const edge = this.createEdge(seg);
        edge.data = data;

        for (const chain of this.chains) {
            if (MeshEdge2.isJoin(chain.head, edge)) {
                this.chainAddHead(chain, edge);
                return edge;
            }

            if (MeshEdge2.isJoin(edge, chain.tail)) {
                this.chainAddTail(chain, edge);
                return edge;
            }
        }

        // Otherwise create a new chain
        this.createChain(edge, edge);

        return edge;
    }

    /**
     * Clears all faces, chains and edges from the mesh.
     *
     * Note: Also resets edge relations such that they only reference themselves.
     */
    public clear(): void {
        // Assist the GC by minimizing reference cycles (probably)
        for (const e of this.edges) {
            MeshEdge2.clear(e);
        }

        this.chains = [];
        this.edges = [];
        this.faces = [];
    }

    /**
     * Returns a deep copy of the mesh.
     */
    public clone(): Mesh2 {
        const mesh = new Mesh2();

        // Create new edges and fill edge map
        const edgeMap = new Map<MeshEdge2, number>();

        for (let i = 0; i < this.edges.length; i++) {
            const oldEdge = this.edges[i];
            const newEdge = new MeshEdge2(oldEdge.p0, oldEdge.seg, oldEdge.data);
            mesh.edges.push(newEdge);

            // Remember edge/index relation to resolve new edges
            edgeMap.set(oldEdge, i);
        }

        // Update edges
        for (let i = 0; i < this.edges.length; i++) {
            const oldEdge = this.edges[i];
            const newEdge = mesh.edges[i];

            const symIdx = edgeMap.get(oldEdge.sym);
            const lnextIdx = edgeMap.get(oldEdge.lnext);
            const onextIdx = edgeMap.get(oldEdge.onext);

            if (symIdx !== undefined) {
                newEdge.sym = mesh.edges[symIdx];
            }

            if (lnextIdx !== undefined) {
                newEdge.lnext = mesh.edges[lnextIdx];
            }

            if (onextIdx !== undefined) {
                newEdge.onext = mesh.edges[onextIdx];
            }
        }

        // Copy chains
        for (const oldChain of this.chains) {
            const headIdx = edgeMap.get(oldChain.head);
            const tailIdx = edgeMap.get(oldChain.tail);

            if (headIdx !== undefined && tailIdx !== undefined) {
                const newChain = new MeshChain2(mesh.edges[headIdx], mesh.edges[tailIdx], oldChain.data);
                MeshChain2.updateEdgeChains(newChain, newChain);

                mesh.chains.push(newChain);
            }
        }

        // Copy faces
        for (const oldFace of this.faces) {
            const startIdx = edgeMap.get(oldFace.start);

            if (startIdx !== undefined) {
                const newFace = new MeshFace2(mesh.edges[startIdx], oldFace.data);
                MeshFace2.updateEdgeFaces(newFace, newFace);
                mesh.faces.push(newFace);
            }
        }

        return mesh;
    }

    /**
     * Connects the origin locations of `e1` and `e2` by finding right edges in their possible edge fans.
     */
    public connectEdgePoints(e1: MeshEdge2, e2: MeshEdge2): void {
        const v = e2.p0.sub(e1.p0);

        if (v.isZero()) {
            // Base points are equivalent, we assume edge fans do not overlap
            // and test any opposing edge (just take `e1` and `e2`)
            const ce1 = MeshEdge2.findConnectingEdge(e1, e2.vector);
            const ce2 = MeshEdge2.findConnectingEdge(e2, e1.vector);

            this.connectEdges(ce1, ce2);
        } else {
            // Test respective edges that join the base points
            const ce1 = MeshEdge2.findConnectingEdge(e1, v);
            const ce2 = MeshEdge2.findConnectingEdge(e2, v.neg);

            this.connectEdges(ce1, ce2);
        }
    }

    /**
     * Explicitly connects the origin locations of `e1` and `e2`.
     *
     * Note: Does not ensure valid mesh topology (use `connectEdgePoints()` instead).
     */
    public connectEdges(e1: MeshEdge2, e2: MeshEdge2): void {
        if (e1 === e2) {
            // Nothing to do
            return;
        }

        // Both faces must be set
        if (e1.face === undefined || e2.face === undefined) {
            log.error("Mesh2: At least one face is undefined");
            return;
        }

        // We assume that the edges may be connected without intersecting other edges
        if (e1.p0.eq(e2.p0)) {
            // Same base point
            MeshEdge2.splice(e1, e2);
        } else {
            // We need to insert a new edge
            const c = new Bezier1Curve2(e1.p0, e2.p0);
            const e = this.createEdge(c, c.reverse());

            MeshEdge2.splice(e1, e);
            MeshEdge2.splice(e2, e.sym);
        }

        // TODO: Reconsider cases when edges have the same base point
        if (e1.face === e2.face) {
            // Faces needs to be subdivisioned (create new from `e2`)
            const f1 = e1.face;
            f1.start = e1;
            MeshFace2.updateEdgeFaces(f1, f1);

            const f2 = this.createFace(e2);
            f2.data = f1.data;
            MeshFace2.updateEdgeFaces(f2, f2);
        } else {
            // The two faces merge into one (delete from `e2`)
            const f = e2.face;
            MeshFace2.updateEdgeFaces(f, e1.face);

            const success = this.destroyFace(f);
            assertDebug(success, "Unable to destroy face");
        }

        // e1.validate();
        // e2.validate();
    }

    public createChain(head: MeshEdge2, tail: MeshEdge2): MeshChain2 {
        const chain = new MeshChain2(head, tail, undefined);
        this.chains.push(chain);
        return chain;
    }

    public createEdge(seg1: BezierCurve2, seg2?: BezierCurve2): MeshEdge2 {
        const edge = MeshEdge2.createPair(seg1, seg2);
        this.edges.push(edge, edge.sym);
        return edge;
    }

    public createFace(start: MeshEdge2): MeshFace2 {
        const face = new MeshFace2(start, undefined);
        this.faces.push(face);
        return face;
    }

    /**
     * Deletes edge `e` from the mesh.
     *
     * Note: Does not ensure valid mesh topology.
     */
    public deleteEdgePair(e: MeshEdge2): void {
        MeshEdge2.detachPair(e);

        e.chain = undefined;
        e.face = undefined;
        e.sym.chain = undefined;
        e.sym.face = undefined;

        const success = this.destroyEdge(e);
        const successSym = this.destroyEdge(e.sym);

        assertDebug(success && successSym, "Unable to destroy edges");
    }

    /**
     * Deletes face `f` from the mesh and also deletes its edges if they have no outer face.
     */
    public deleteFace(f: MeshFace2): void {
        const es = f.start;

        let e0 = es;
        let e1 = e0.lnext;

        do {
            e0 = e1;
            e1 = e0.lnext;

            if (e0.sym.face === undefined) {
                // Fully remove edge if there is no outer face
                this.deleteEdgePair(e0);
            } else {
                // Otherwise just reset inner face
                e0.face = undefined;
            }
        } while (e0 !== es);

        const success = this.destroyFace(f);
        assertDebug(success, "Unable to destroy face");
    }

    /**
     * Attempts to destroy chain `ch`.
     */
    public destroyChain(ch: MeshChain2): boolean {
        const start = this.chains.indexOf(ch);

        if (start < 0) {
            return false;
        }

        this.chains.splice(start, 1);

        return true;
    }

    /**
     * Attempts to destroy edge `e`.
     */
    public destroyEdge(e: MeshEdge2): boolean {
        const start = this.edges.indexOf(e);

        if (start < 0) {
            return false;
        }

        this.edges.splice(start, 1);

        return true;
    }

    /**
     * Attempts to destroy face `f`.
     */
    public destroyFace(f: MeshFace2): boolean {
        const start = this.faces.indexOf(f);

        if (start < 0) {
            return false;
        }

        this.faces.splice(start, 1);

        return true;
    }

    public finalizeChain(ch: MeshChain2): void {
        const face = this.createFace(ch.tail);
        face.data = ch.data;

        const success = this.destroyChain(ch);
        assertDebug(success, "Unable to destroy chain");

        // Update edges
        for (const e of face.getEdgeIterator()) {
            e.face = face;
            e.chain = undefined;
        }
    }

    public getChains(): readonly MeshChain2[] {
        return this.chains;
    }

    public getChainsPath(): Path2 {
        const path = new Path2();

        for (const chain of this.chains) {
            chain.writeToPath(path);
        }

        return path;
    }

    public getEdges(): readonly MeshEdge2[] {
        return this.edges;
    }

    public getFaces(): readonly MeshFace2[] {
        return this.faces;
    }

    public getFacesPath(): Path2 {
        const path = new Path2();

        for (const face of this.faces) {
            face.writeToPath(path);
        }

        return path;
    }

    public getFacesPaths(): Path2[] {
        const output: Path2[] = [];

        for (const face of this.faces) {
            const path = new Path2();
            face.writeToPath(path);
            output.push(path);
        }

        return output;
    }

    public monotonize(): void {
        const queue = this.edges.filter((e) => e.face !== undefined);
        queue.sort((e1, e2) => MeshEdge2.compareQueue(e1, e2));

        this.monotoneProcess(queue);
    }

    public monotonizeFaces(faces: MeshFace2[]): void {
        const queue: MeshEdge2[] = [];

        for (const face of faces) {
            for (const e of face.getEdgeIterator()) {
                queue.push(e);
            }
        }

        queue.sort((e1, e2) => MeshEdge2.compareQueue(e1, e2));

        this.monotoneProcess(queue);
    }

    public printDebug(): void {
        let message = "Mesh2 {\n";

        for (const chain of this.getChains()) {
            message += "    MeshChain2 {\n";
            for (const e of chain.getEdgeIterator()) {
                message += `        MeshEdge2 ${e}\n`;
            }
            message += "    }\n";
        }

        for (const face of this.getFaces()) {
            message += "    MeshFace2 {\n";
            for (const e of face.getEdgeIterator()) {
                message += `        MeshEdge2 ${e}\n`;
            }
            message += "    }\n";
        }
        message += "}";

        log.infoDebug("{}", message);
    }

    public triangulate(optimize = false): void {
        this.monotonize();

        // Remember current number of faces as more will be added during triangulation
        const len = this.faces.length;

        // Iterate monotone faces
        for (let i = 0; i < len; i++) {
            this.triangulateProcess(this.faces[i]);
        }

        if (optimize) {
            this.triangulateOptimize();
        }
    }

    /**
     * Add a point into an existing triangle face of the mesh.
     *
     * The point will be ignored if it is not inside any of them.
     */
    public triangulateAddPoint(p: Point2): void {
        for (const face1 of this.faces) {
            if (face1.hasPointInside(p)) {
                const e1 = face1.start;
                const e2 = e1.lnext;
                const e3 = e2.lnext;

                const c1 = new Bezier1Curve2(p, e1.p0);
                const c2 = new Bezier1Curve2(p, e2.p0);
                const c3 = new Bezier1Curve2(p, e3.p0);

                const ee1 = this.createEdge(c1, c1.reverse());
                const ee2 = this.createEdge(c2, c2.reverse());
                const ee3 = this.createEdge(c3, c3.reverse());

                MeshEdge2.splice(ee1, ee2);
                MeshEdge2.splice(ee2, ee3);

                MeshEdge2.splice(e1, ee1.sym);
                MeshEdge2.splice(e2, ee2.sym);
                MeshEdge2.splice(e3, ee3.sym);

                const face2 = new MeshFace2(e2, undefined);
                const face3 = new MeshFace2(e3, undefined);

                // Update faces
                MeshFace2.updateEdgeFaces(face1, face1);
                MeshFace2.updateEdgeFaces(face2, face2);
                MeshFace2.updateEdgeFaces(face3, face3);

                this.faces.push(face2);
                this.faces.push(face3);

                // Done (skip rest)
                return;
            }
        }
    }

    /**
     * Optimizes an existing triangulation trying to produce a Delaunay triangulation.
     *
     * Note: The Delaunay criteria are not guaranteed to be met for any input.
     */
    public triangulateOptimize(): void {
        let i = 0;

        // Iterative over edges until all of them do not need to be swapped anymore
        while (i < this.edges.length) {
            const edge = this.edges[i];

            if (edge.needsSwap()) {
                MeshEdge2.swap(edge);

                // Reset and start over
                i = 0;
            } else {
                i++;
            }
        }
    }

    public validate(): void {
        for (const edge of this.edges) {
            edge.validate();
        }
    }

    private chainAddHead(chain: MeshChain2, edge: MeshEdge2): void {
        // Connect edge and set new head
        MeshEdge2.join(chain.head, edge);

        chain.head = edge;

        if (chain.isClosed()) {
            MeshEdge2.join(chain.head, chain.tail);
            this.finalizeChain(chain);
        } else {
            this.chainCheckTails(chain);
        }
    }

    private chainAddTail(chain: MeshChain2, edge: MeshEdge2): void {
        // Connect edge and set new tail
        MeshEdge2.join(edge, chain.tail);

        chain.tail = edge;

        if (chain.isClosed()) {
            MeshEdge2.join(chain.head, chain.tail);
            this.finalizeChain(chain);
        } else {
            this.chainCheckHeads(chain);
        }
    }

    private chainCheckHeads(refChain: MeshChain2): void {
        // Check new tail against all other heads
        for (const chain of this.chains) {
            if (chain !== refChain && MeshEdge2.isJoin(chain.head, refChain.tail)) {
                // Connect chain and set new tail
                MeshEdge2.join(chain.head, refChain.tail);
                refChain.tail = chain.tail;

                // Remove dangling chain
                const success = this.destroyChain(chain);
                assertDebug(success, "Unable to destroy chain");

                if (refChain.isClosed()) {
                    MeshEdge2.join(refChain.head, refChain.tail);
                    this.finalizeChain(refChain);
                }

                return;
            }
        }
    }

    private chainCheckTails(refChain: MeshChain2): void {
        // Check new head against all other tails
        for (const chain of this.chains) {
            if (chain !== refChain && MeshEdge2.isJoin(refChain.head, chain.tail)) {
                // Connect chain and set new head
                MeshEdge2.join(refChain.head, chain.tail);
                refChain.head = chain.head;

                // Remove dangling chain
                const success = this.destroyChain(chain);
                assertDebug(success, "Unable to destroy chain");

                if (refChain.isClosed()) {
                    MeshEdge2.join(refChain.head, refChain.tail);
                    this.finalizeChain(refChain);
                }

                return;
            }
        }
    }

    private monotoneDelete(status: ArrayMultiMap<MeshEdge2, MeshStatus2>, e0: MeshEdge2, e1: MeshEdge2): void {
        const idx = status.findIndex(e0);

        if (idx < 0) {
            log.error("Mesh2: Unable to delete status");
            return;
        }

        const s = status.getValueAt(idx);

        if (s.isMerge === true) {
            this.connectEdgePoints(e1, s.helper);
        }

        status.removeAt(idx);
    }

    private monotoneInsert(status: ArrayMultiMap<MeshEdge2, MeshStatus2>, e1: MeshEdge2): void {
        // When added, the helper is always the edge itself
        status.insert(e1, { helper: e1, face: e1.face, isMerge: false });
    }

    private monotoneProcess(queue: MeshEdge2[]): void {
        const status = new ArrayMultiMap<MeshEdge2, MeshStatus2>(MeshEdge2.compareStatus);

        for (const event of queue) {
            const e0 = event.lprev;
            const e1 = event;

            if (e1.seg === undefined) {
                log.error("Mesh2: Unable to get segment");
                continue;
            }

            const p0 = e0.p0;
            const p1 = e1.p0;
            const p2 = e1.p1;

            const v1 = p1.sub(p0);
            const v2 = p2.sub(p1);
            const cross = v1.cross(v2);

            if (cross > 0) {
                if (p0.x >= p1.x && p1.x < p2.x) {
                    // log.infoDebug("{} -> Start", p1);
                    this.monotoneInsert(status, e1);
                    continue;
                }

                if (p0.x <= p1.x && p1.x > p2.x) {
                    // log.infoDebug("{} -> End", p1);
                    this.monotoneDelete(status, e0, e1);
                    continue;
                }
            } else if (cross < 0) {
                if (p0.x > p1.x && p1.x <= p2.x) {
                    // log.infoDebug("{} -> Split", p1);
                    this.monotoneUpdate(status, e1, false, true);
                    this.monotoneInsert(status, e1);
                    continue;
                }

                if (p0.x < p1.x && p1.x >= p2.x) {
                    // log.infoDebug("{} -> Merge", p1);
                    this.monotoneDelete(status, e0, e1);
                    this.monotoneUpdate(status, e1, true, false);
                    continue;
                }
            }

            if (p1.lt(p2)) {
                // log.infoDebug("{} -> Regular (Interior Above)", p1);
                this.monotoneDelete(status, e0, e1);
                this.monotoneInsert(status, e1);
            } else {
                // log.infoDebug("{} -> Regular (Interior Below)", p1);
                this.monotoneUpdate(status, e1, false, false);
            }
        }
    }

    private monotoneUpdate(
        status: ArrayMultiMap<MeshEdge2, MeshStatus2>,
        e1: MeshEdge2,
        isMerge: boolean,
        force: boolean
    ): void {
        // Get the index of the edge above `e1`
        const idx = status.findIndexNearestEnd(e1);

        if (idx < 0) {
            log.error("Mesh2: Unable to update status");
            return;
        }

        const s = status.getValueAt(idx);

        if (s.isMerge || force) {
            this.connectEdgePoints(e1, s.helper);
        }

        s.helper = e1;
        s.isMerge = isMerge;
    }

    private triangulateProcess(face: MeshFace2): void {
        const queue = face.getEdges();
        queue.sort((e1, e2) => MeshEdge2.compareQueue(e1, e2));

        const stack = [queue[0], queue[1]];

        for (let i = 2; i < queue.length - 1; i++) {
            const q2 = queue[i];
            const q1 = queue[i - 1];

            // Check which side of the chain we are on
            const isTop = q2.lnext.p0.eq(q1.p0);
            const isBottom = q1.lnext.p0.eq(q2.p0);

            if (isTop || isBottom) {
                // Same side
                while (stack.length > 1) {
                    const e1 = stack[stack.length - 1];
                    const e0 = stack[stack.length - 2];
                    const area = Point2.signedArea(q2.p0, e1.p0, e0.p0);

                    // Pop edges and connect (until one is outside of the polygon)
                    if ((isTop && area > 0) || (isBottom && area < 0)) {
                        this.connectEdgePoints(q2, e0);
                        stack.pop();
                    } else {
                        break;
                    }
                }
            } else {
                // Different side
                while (stack.length > 1) {
                    // Pop edges and connect (all except the last)
                    const e1 = stack[stack.length - 1];
                    this.connectEdgePoints(q2, e1);
                    stack.pop();
                }

                // Pop last edge and push previous
                stack.pop();
                stack.push(q1);
            }

            stack.push(q2);
        }

        // Connect the remaining from stack
        const q = queue[queue.length - 1];

        for (let i = 1; i < stack.length - 1; i++) {
            const e = stack[i];
            this.connectEdgePoints(q, e);
        }
    }
}
