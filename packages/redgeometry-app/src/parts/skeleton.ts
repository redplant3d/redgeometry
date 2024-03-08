import { Mesh2, MeshEdge2, type MeshFace2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { PathClip2 } from "redgeometry/src/core/path-clip";
import { BooleanOperator, DEFAULT_PATH_QUALITY_OPTIONS, WindingOperator } from "redgeometry/src/core/path-options";
import { Box2 } from "redgeometry/src/primitives/box";
import { Edge2 } from "redgeometry/src/primitives/edge";
import { Point2 } from "redgeometry/src/primitives/point";
import type { Vector2 } from "redgeometry/src/primitives/vector";
import { assertDebug, log } from "redgeometry/src/utility/debug";
import { RandomXSR128, type Random } from "redgeometry/src/utility/random";
import { RootType, solveLinear, solveQuadratic, type Root1, type Root2 } from "redgeometry/src/utility/solve";
import type { AppContext2D } from "../context.js";
import { createPolygonPair, createSimplePolygon } from "../data.js";
import { RangeInputElement } from "../input.js";
import type { AppLauncher, AppPart } from "../launcher.js";

enum KineticEventType {
    EdgeEvent,
    SplitEvent,
    FlipEvent,
    FullEvent,
}

export class SkeletonAppPart implements AppPart {
    private context: AppContext2D;
    private inner: Path2;
    private launcher: AppLauncher;
    private mesh: Mesh2;
    private meshOriginal: Mesh2;
    private outer: Path2;
    private vertices: KineticVertex[];

    public inputTime: RangeInputElement;

    public constructor(launcher: AppLauncher, context: AppContext2D) {
        this.launcher = launcher;
        this.context = context;

        this.inputTime = new RangeInputElement("time", "0", "500", "50");
        this.inputTime.addEventListener("input", () => this.launcher.requestUpdate());
        this.inputTime.setStyle("width: 200px");

        this.inner = new Path2();
        this.outer = new Path2();
        this.mesh = new Mesh2();
        this.meshOriginal = new Mesh2();
        this.vertices = [];
    }

    public create(): void {
        return;
    }

    public render(): void {
        this.context.clear();
        this.context.drawEdges(this.getVertexEdges(), "#FF0000");
        this.context.drawMeshEdges(this.meshOriginal, "#000000");
        this.context.drawMeshEdges(this.mesh, "#00FF00");
    }

    public reset(): void {
        this.inner.clear();
        this.outer.clear();
        this.mesh = new Mesh2();
        this.meshOriginal = new Mesh2();
        this.vertices = [];
    }

    public update(_delta: number): void {
        this.reset();

        const seed = this.launcher.inputSeed.getInt();
        const random = RandomXSR128.fromSeedLcg(seed);
        const [canvasWidth, canvasHeight] = this.context.getSize(false);
        const box = new Box2(0, 0, canvasWidth, canvasHeight);

        const generator = this.launcher.inputGenerator.getInt();
        const tmax = this.inputTime.getInt();

        // const path = createSimplePolygon(random, box, generator, 0.5, 0.25).toPath();
        const path = createSimplePolygon(random, box, generator, 1, 0).toPath();
        // const path = createSimplePolygon(random, box, generator, 0.05, 0.95).toPath();

        // path.clear();
        // path.moveToXY(100, 100);
        // path.lineToXY(200, 100);
        // path.lineToXY(300, 100);
        // path.lineToXY(300, 200);
        // path.lineToXY(200, 200);
        // path.lineToXY(100, 200);
        // path.close();

        this.mesh = path.toMesh(WindingOperator.NonZero);
        // const mesh = this.getRandomMesh(random, generator, 25, canvasWidth, canvasHeight);

        this.meshOriginal = this.mesh.clone();

        this.mesh.triangulate(false);

        this.initializeMesh(this.mesh);
        this.createStraightSkeleton(this.mesh, tmax);
    }

    public updateLayout(): void {
        this.launcher.addAppInput(this.inputTime);
    }

    private createStraightSkeleton(mesh: Mesh2, tmax: number): void {
        const faces = mesh.getFaces().slice();

        while (faces.length > 0) {
            faces.sort((f1, f2) => KineticEvent.compareFace(f1, f2));

            const ev = faces[0].data as KineticEvent;

            assertDebug(ev.t1 >= 0, "Parameter must be positve (t = {})", ev.t1);

            this.printEvents(faces, tmax);

            if (tmax < ev.t1) {
                for (const face of faces) {
                    this.updateFacePositionAt(face, tmax);
                    this.dumpVerticesAt(face, tmax);
                }
                break;
            }

            for (const face of faces) {
                this.updateFacePositionAt(face, ev.t1);
            }

            this.handleEvent(ev);

            if (ev.type !== KineticEventType.FlipEvent) {
                faces.splice(0, 1);
            }

            for (const face of faces) {
                this.updateFaceEvent(face);
            }
        }
    }

    /**
     * Removes the triangle face of of the collapsing edge `e0`.
     *
     * All edges around `e1` will fall into `e0`.
     */
    private deleteEdgeAndMerge(e0: MeshEdge2): void {
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        const e0sym = e0.sym;
        const e1sym = e1.sym;
        const e2sym = e2.sym;

        e0.data = undefined;

        // Unlink `e0` from vertex around `e1`
        MeshEdge2.splice(e0sym, e1);

        // Set all vertices around `e0` to `e0.p0`
        let curr = e1;
        do {
            curr.p0 = e0.p0;
            curr.onext.p0 = e0.p0;
            curr = curr.onext;
        } while (curr !== e1);

        // Merge edge fans of `e0` and `e1` (it is mind blowing that this just works)
        MeshEdge2.splice(e0, e1);

        MeshEdge2.detachPair(e0);

        MeshEdge2.clear(e1);
        MeshEdge2.clear(e2);

        e1sym.lnext.onext = e2sym;
        e2sym.lnext.onext = e1sym;
        e1sym.sym = e2sym;
        e2sym.sym = e1sym;

        // this.printEdgesOnext(e2sym);
    }

    private deleteEdgeAndSplit(e0: MeshEdge2): void {
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        MeshEdge2.detachPair(e1);

        e1.p0 = Point2.ZERO;
        e1.sym.p0 = Point2.ZERO;

        // Not a vertex anymore
        e0.data = undefined;

        MeshEdge2.splice(e0, KineticVertex.getWavefrontEdgeCcw(e0));
        // MeshEdge2.splice(e0, e2.sym.onext);

        // this.printEdgesOnext(e0.oprev, true);
        // this.printEdgesOnext(e2.sym, true);

        e0.face = undefined;
        e1.face = undefined;
        e2.face = undefined;
    }

    private dumpVerticesAt(face: MeshFace2, t: number): void {
        const e0 = face.start;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        const vtx0 = e0.data as KineticVertex | undefined;
        const vtx1 = e1.data as KineticVertex | undefined;
        const vtx2 = e2.data as KineticVertex | undefined;

        if (vtx0 !== undefined) {
            vtx0.t1 = t;
            this.vertices.push(vtx0);
        }

        if (vtx1 !== undefined) {
            vtx1.t1 = t;
            this.vertices.push(vtx1);
        }

        if (vtx2 !== undefined) {
            vtx2.t1 = t;
            this.vertices.push(vtx2);
        }
    }

    /**
     * Returns the parameter `t` when `vtxa` and `vtxb` are coinciding.
     */
    private getEdgeCollapseParameter(vtxa: KineticVertex, vtxb: KineticVertex): number {
        const pa = vtxa.getPositionAt(0);
        const pb = vtxb.getPositionAt(0);
        const va = vtxa.vel;
        const vb = vtxb.vel;

        const v1 = vb.sub(va);
        const v2 = pb.sub(pa);

        return v1.dot(v2.neg()) / v1.dot(v1);
    }

    /**
     * Returns the parameter `t` when `vtx0` is crashing into approaching edge front `(vtx1, vtx2)`.
     */
    private getEdgeCrashParameter(vtx0: KineticVertex, vtx1: KineticVertex, vtx2: KineticVertex): number {
        const p0 = vtx0.getPositionAt(0);
        const p1 = vtx1.getPositionAt(0);
        const p2 = vtx2.getPositionAt(0);
        const v0 = vtx0.vel;

        const v1 = p1.sub(p0);
        const v2 = p2.sub(p1);
        const n2 = v2.unit().normal();

        return v1.dot(n2) / (1 + v0.dot(n2));
    }

    private getKineticEventTypeName(type: KineticEventType): string {
        switch (type) {
            case KineticEventType.EdgeEvent:
                return "EdgeEvent";
            case KineticEventType.SplitEvent:
                return "SplitEvent";
            case KineticEventType.FlipEvent:
                return "FlipEvent";
            case KineticEventType.FullEvent:
                return "FullEvent";
        }
    }

    private getRandomMesh(random: Random, generator: number, offset: number, width: number, height: number): Mesh2 {
        const [polygonA, polygonB] = createPolygonPair(random, generator, offset, width, height);

        const clip = new PathClip2(DEFAULT_PATH_QUALITY_OPTIONS);

        for (const edge of polygonA.getEdges()) {
            clip.addEdge(edge, 0);
        }

        for (const edge of polygonB.getEdges()) {
            clip.addEdge(edge, 1);
        }

        const mesh = new Mesh2();
        clip.process(mesh, {
            booleanOperator: BooleanOperator.Exclusion,
            windingOperatorA: WindingOperator.NonZero,
            windingOperatorB: WindingOperator.NonZero,
        });

        return mesh;
    }

    /**
     * Compute the time parameter where the triangle area is zero
     */
    private getTriangleCollapseParameter(vtx0: KineticVertex, vtx1: KineticVertex, vtx2: KineticVertex): Root2 | Root1 {
        const vp0 = vtx0.getPositionAt(0).toVector();
        const vp1 = vtx1.getPositionAt(0).toVector();
        const vp2 = vtx2.getPositionAt(0).toVector();
        const v0 = vtx0.vel;
        const v1 = vtx1.vel;
        const v2 = vtx2.vel;

        // 1/2 (-p0y p1x + p0x p1y + p0y p2x - p1y p2x - p0x p2y + p1x p2y) +
        //  1/2 t (p1y v0x - p2y v0x - p1x v0y + p2x v0y - p0y v1x + p2y v1x +
        //     p0x v1y - p2x v1y + p0y v2x - p1y v2x - p0x v2y + p1x v2y) +
        //  1/2 t^2 (-v0y v1x + v0x v1y + v0y v2x - v1y v2x - v0x v2y + v1x v2y)
        const a = v0.cross(v1) - v0.cross(v2) + v1.cross(v2);
        const b = vp0.cross(v1) - vp0.cross(v2) + vp1.cross(v2) - vp1.cross(v0) + vp2.cross(v0) - vp2.cross(v1);
        const c = vp0.cross(vp1) - vp0.cross(vp2) + vp1.cross(vp2);

        // Root may only be close (but not less or equal) to zero due to floating point issues
        const rt = solveQuadratic(a, 0.5 * b, c);

        if (rt.type === RootType.Two) {
            return rt;
        } else {
            // Get the extremum/minimum of the triangle area instead
            return { type: RootType.One, x: solveLinear(2 * a, b) };
        }
    }

    private getVertexEdges(): Edge2[] {
        const edges: Edge2[] = [];

        for (const vtx of this.vertices) {
            const p0 = vtx.getPositionAt(vtx.t0);
            const p1 = vtx.getPositionAt(vtx.t1);
            edges.push(new Edge2(p0, p1));
        }

        return edges;
    }

    private handleEvent(ev: KineticEvent): void {
        const e0 = ev.e;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;
        const vtx2 = e2.data as KineticVertex;

        const t = ev.t1;

        switch (ev.type) {
            case KineticEventType.EdgeEvent: {
                // `e0` is collapsing
                this.stopVertexAt(vtx0, t);
                this.stopVertexAt(vtx1, t);

                const orig = vtx0.getPositionAt(t);
                const vtx = new KineticVertex(orig, vtx1.n1, vtx0.n2, t);

                // Remember before merge
                const e1sym = e1.sym;
                const e2sym = e2.sym;

                this.deleteEdgeAndMerge(e0);

                if (e1sym.face !== undefined) {
                    this.updateVerticesCw(e1sym.sym, vtx);
                }

                if (e2sym.face !== undefined) {
                    this.updateVerticesCcw(e2sym, vtx);
                }

                break;
            }
            case KineticEventType.SplitEvent: {
                // `e0.p0` is crashing into `e1`
                this.stopVertexAt(vtx0, t);

                const orig = vtx0.getPositionAt(t);
                const vtxa = new KineticVertex(orig, vtx0.n1, vtx1.n1, t);
                const vtxb = new KineticVertex(orig, vtx2.n2, vtx0.n2, t);

                this.deleteEdgeAndSplit(e0);

                this.updateVerticesCw(e0, vtxa);
                this.updateVerticesCcw(e2.sym, vtxb);

                break;
            }
            case KineticEventType.FlipEvent: {
                // `e0` is the edge that is crossed
                MeshEdge2.swap(e0);

                e0.data = e0.oprev.data;
                e0.sym.data = e0.sym.oprev.data;

                break;
            }
            case KineticEventType.FullEvent: {
                // Three waveforms are collapsing in a single point
                this.stopVertexAt(vtx0, t);
                this.stopVertexAt(vtx1, t);
                this.stopVertexAt(vtx2, t);

                break;
            }
        }
    }

    /**
     * No edges are wavefronts
     */
    private handleTriangle0(e0: MeshEdge2, e1: MeshEdge2, e2: MeshEdge2): KineticEvent {
        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;
        const vtx2 = e2.data as KineticVertex;

        const rt = this.getTriangleCollapseParameter(vtx0, vtx1, vtx2);

        let t1: number | undefined;

        if (rt.type === RootType.Two) {
            if (rt.x1 < rt.x2 || rt.x2 < 0) {
                t1 = rt.x1;
            } else {
                t1 = rt.x2;
            }
        } else {
            t1 = rt.x;
        }

        const p0 = vtx0.getPositionAt(t1);
        const p1 = vtx1.getPositionAt(t1);
        const p2 = vtx2.getPositionAt(t1);

        const d0 = p1.sub(p0).lenSq();
        const d1 = p2.sub(p1).lenSq();
        const d2 = p0.sub(p2).lenSq();

        let d = d0;
        let e = e0;

        if (d1 > d) {
            d = d1;
            e = e1;
        }

        if (d2 > d) {
            d = d2;
            e = e2;
        }

        return new KineticEvent(KineticEventType.FlipEvent, e, t1);
    }

    /**
     * `e0.p0` is the opposite point of `e1` (wavefront edge)
     */
    private handleTriangle1(e0: MeshEdge2, e1: MeshEdge2, e2: MeshEdge2): KineticEvent {
        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;
        const vtx2 = e2.data as KineticVertex;

        assertDebug(e0.sym.face !== undefined);
        assertDebug(e1.sym.face === undefined);
        assertDebug(e2.sym.face !== undefined);

        const tv = this.getEdgeCrashParameter(vtx0, vtx1, vtx2);
        const te = this.getEdgeCollapseParameter(vtx1, vtx2);

        if (te <= tv && te > 0) {
            return { type: KineticEventType.EdgeEvent, e: e1, t1: te };
        }

        // If the longest edge is the wavefront edge, it is a split event, otherwise it is a flip event.
        const p0 = vtx0.getPositionAt(tv);
        const p1 = vtx1.getPositionAt(tv);
        const p2 = vtx2.getPositionAt(tv);

        const d0 = p1.sub(p0).lenSq();
        const d1 = p2.sub(p1).lenSq();
        const d2 = p0.sub(p2).lenSq();

        let d = d0;
        let e = e0;

        if (d1 > d) {
            d = d1;
            e = e1;
        }

        if (d2 > d) {
            d = d2;
            e = e2;
        }

        if (e === e1) {
            return new KineticEvent(KineticEventType.SplitEvent, e0, tv);
        } else {
            return new KineticEvent(KineticEventType.FlipEvent, e, tv);
        }
    }

    /**
     * `e0.p0` is the point opposite of the non-wavefront edge
     * `e0` and `e2` are wavefronts.
     */
    private handleTriangle2(e0: MeshEdge2, e1: MeshEdge2, e2: MeshEdge2): KineticEvent {
        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;
        const vtx2 = e2.data as KineticVertex;

        const t1 = this.getEdgeCollapseParameter(vtx0, vtx1);
        const t2 = this.getEdgeCollapseParameter(vtx0, vtx2);

        if (t1 < t2 || t2 < 0) {
            return new KineticEvent(KineticEventType.EdgeEvent, e0, t1);
        } else {
            return new KineticEvent(KineticEventType.EdgeEvent, e2, t2);
        }
    }

    /**
     * All edges are wavefronts
     */
    private handleTriangle3(e0: MeshEdge2, e1: MeshEdge2): KineticEvent {
        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;

        const t1 = this.getEdgeCollapseParameter(vtx0, vtx1);

        return new KineticEvent(KineticEventType.FullEvent, e0, t1);
    }

    private initializeMesh(mesh: Mesh2): void {
        for (const edge of mesh.getEdges()) {
            if (edge.data !== undefined) {
                // Vertex already exists
                continue;
            }

            const vtx = KineticVertex.createFrom(edge);

            let curr = edge;

            do {
                assertDebug(curr.data === undefined);

                curr.data = vtx;
                curr = curr.onext;
            } while (curr !== edge);
        }

        for (const face of mesh.getFaces()) {
            this.updateFaceEvent(face);
        }
    }

    private printEdgesLnext(edge: MeshEdge2, validate: boolean): void {
        log.infoDebug("lnext");
        let i = 0;

        for (const e of edge.getLnextIterator()) {
            log.infoDebug("  [{}] p0: {}", i, e.p0);
            log.infoDebug("      p1: {}", e.p1);

            if (validate) {
                e.validate();
            }
            i++;
        }
    }

    private printEdgesOnext(edge: MeshEdge2, validate: boolean): void {
        log.infoDebug("onext");
        let i = 0;

        for (const e of edge.getOnextIterator()) {
            log.infoDebug("  [{}] p0: {}", i, e.p0);
            log.infoDebug("      p1: {}", e.p1);
            log.infoDebug("      angle: {}", (e.p1.sub(e.p0).angle() * 180) / Math.PI);

            if (validate) {
                assertDebug(e.data === edge.data);
                e.validate();
            }

            i++;
        }
    }

    private printEvents(faces: MeshFace2[], t: number): void {
        log.infoDebug("******************************************************************");
        log.infoDebug("Parameter = {}", t);
        log.infoDebug("******************************************************************");
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            const event = face.data as KineticEvent;
            log.infoDebug("[{}] type = {}", i, this.getKineticEventTypeName(event.type));
            log.infoDebug("    t = {}", event.t1);
            log.infoDebug("    edge = {}", event.e.p0);
            log.infoDebug("           {}", event.e.p1);
        }
    }

    private printFace(face: MeshFace2): void {
        log.infoDebug("******************************************************************");

        const e0 = face.start;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        log.infoDebug("Face: e0 = {}", e0.p0);
        log.infoDebug("           {}", e0.p1);
        log.infoDebug("      e1 = {}", e1.p0);
        log.infoDebug("           {}", e1.p1);
        log.infoDebug("      e2 = {}", e2.p0);
        log.infoDebug("           {}", e2.p1);
    }

    private printVerticesAt(face: MeshFace2, t: number): void {
        log.infoDebug("******************************************************************");

        const e0 = face.start;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        const vtx0 = e0.data as KineticVertex;
        const vtx1 = e1.data as KineticVertex;
        const vtx2 = e2.data as KineticVertex;

        log.infoDebug("vtx0: pos = {}", vtx0.getPositionAt(t));
        log.infoDebug("      vel = {}", vtx0.vel);
        log.infoDebug("       n1 = {}", vtx0.n1);
        log.infoDebug("       n2 = {}", vtx0.n2);
        log.infoDebug("vtx1: pos = {}", vtx1.getPositionAt(t));
        log.infoDebug("      vel = {}", vtx1.vel);
        log.infoDebug("       n1 = {}", vtx1.n1);
        log.infoDebug("       n2 = {}", vtx1.n2);
        log.infoDebug("vtx2: pos = {}", vtx2.getPositionAt(t));
        log.infoDebug("      vel = {}", vtx2.vel);
        log.infoDebug("       n1 = {}", vtx2.n1);
        log.infoDebug("       n2 = {}", vtx2.n2);
    }

    private stopVertexAt(vtx: KineticVertex, t: number): void {
        vtx.t1 = t;

        this.vertices.push(vtx);
    }

    private updateEdgePositionAt(e: MeshEdge2, t: number): void {
        const vtx = e.data as KineticVertex;
        const vtxSym = e.sym.data as KineticVertex;

        e.p0 = vtx.getPositionAt(t);
        e.sym.p0 = vtxSym.getPositionAt(t);
    }

    private updateFaceEvent(face: MeshFace2): void {
        const e0 = face.start;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        let ev: KineticEvent | undefined;

        if (e0.sym.face === undefined) {
            if (e1.sym.face === undefined) {
                if (e2.sym.face === undefined) {
                    // Wavefronts: e0, e1, e2
                    ev = this.handleTriangle3(e0, e1);
                } else {
                    // Wavefronts: e0, e1
                    ev = this.handleTriangle2(e1, e2, e0);
                }
            } else {
                if (e2.sym.face === undefined) {
                    // Wavefronts: e0, e2
                    ev = this.handleTriangle2(e0, e1, e2);
                } else {
                    // Wavefronts: e0
                    ev = this.handleTriangle1(e2, e0, e1);
                }
            }
        } else {
            if (e1.sym.face === undefined) {
                if (e2.sym.face === undefined) {
                    // Wavefronts: e1, e2
                    ev = this.handleTriangle2(e2, e0, e1);
                } else {
                    // Wavefronts: e1
                    ev = this.handleTriangle1(e0, e1, e2);
                }
            } else {
                if (e2.sym.face === undefined) {
                    // Wavefronts: e2
                    ev = this.handleTriangle1(e1, e2, e0);
                } else {
                    // No wavefronts
                    ev = this.handleTriangle0(e0, e1, e2);
                }
            }
        }

        face.data = ev;
    }

    private updateFacePositionAt(face: MeshFace2, t: number): void {
        const e0 = face.start;
        const e1 = e0.lnext;
        const e2 = e1.lnext;

        this.updateEdgePositionAt(e0, t);
        this.updateEdgePositionAt(e1, t);
        this.updateEdgePositionAt(e2, t);
    }

    private updateVerticesCcw(e: MeshEdge2, vtx: KineticVertex): void {
        let curr = e;
        do {
            curr.data = vtx;
            curr = curr.onext;
        } while (curr !== e);
    }

    private updateVerticesCw(e: MeshEdge2, vtx: KineticVertex): void {
        let curr = e;
        do {
            curr.data = vtx;
            curr = curr.oprev;
        } while (curr !== e);
    }
}

class KineticVertex {
    public n1: Vector2;
    public n2: Vector2;
    public orig: Point2;
    public t0: number;
    public t1: number;
    public vel: Vector2;

    public constructor(orig: Point2, n1: Vector2, n2: Vector2, t0: number) {
        this.orig = orig;
        this.vel = KineticVertex.getVelocity(n1, n2);
        this.n1 = n1;
        this.n2 = n2;
        this.t0 = t0;
        this.t1 = Number.POSITIVE_INFINITY;
    }

    public static createFrom(e: MeshEdge2): KineticVertex {
        const orig = e.p0;

        const e1 = KineticVertex.getWavefrontEdgeCw(e);
        const e2 = KineticVertex.getWavefrontEdgeCcw(e);

        const n1 = e1.p1.sub(e1.p0).unit().normal().neg();
        const n2 = e2.p0.sub(e2.p1).unit().normal().neg();

        return new KineticVertex(orig, n1, n2, 0);
    }

    public static getVelocity(n1: Vector2, n2: Vector2): Vector2 {
        const k = n1.add(n2);
        return k.mul(2).div(k.lenSq());
    }

    public static getWavefrontEdgeCcw(e: MeshEdge2): MeshEdge2 {
        let curr = e;

        do {
            if (curr.face === undefined && curr.sym.face !== undefined) {
                return curr;
            }

            curr = curr.onext;
        } while (curr !== e);

        log.error("Fallback (ccw)");

        return e;
    }

    public static getWavefrontEdgeCw(e: MeshEdge2): MeshEdge2 {
        let curr = e;

        do {
            if (curr.face !== undefined && curr.sym.face === undefined) {
                return curr;
            }

            curr = curr.oprev;
        } while (curr !== e);

        log.error("Fallback (cw)");

        return e;
    }

    public getPositionAt(t: number): Point2 {
        return this.orig.addMul(this.vel, t - this.t0);
    }
}

class KineticEvent {
    public e: MeshEdge2;
    public t1: number;
    public type: KineticEventType;

    public constructor(type: KineticEventType, e: MeshEdge2, t1: number) {
        this.type = type;
        this.e = e;
        this.t1 = t1;
    }

    public static compareFace(f1: MeshFace2, f2: MeshFace2): number {
        const ev1 = f1.data as KineticEvent;
        const ev2 = f2.data as KineticEvent;

        const t1 = ev1.t1;
        const t2 = ev2.t1;

        // Separate postive and negative parameter values, such that it starts with the positive ones
        if (t1 < 0 === t2 < 0) {
            return t1 - t2;
        } else {
            return t2;
        }
    }
}
