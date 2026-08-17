import type { Mesh2, MeshFace2 } from "redgeometry/src/core/mesh";
import { Path2 } from "redgeometry/src/core/path";
import { Polygon2 } from "redgeometry/src/core/polygon";
import { assertUnreachable, throwError } from "redgeometry/src/internal/debug";
import type { Mesh2 as Mesh2Next, MeshFaceIdx as MeshNextFaceIdx } from "redgeometry/src/internal/mesh-next";
import type { ReadonlyMinMaxBox2 } from "redgeometry/src/primitives/box";
import type { Edge2, ReadonlyEdge2 } from "redgeometry/src/primitives/edge";
import type { ReadonlyMatrix3A } from "redgeometry/src/primitives/matrix";
import type { ReadonlyRay2 } from "redgeometry/src/primitives/ray";
import { Vector2, type ReadonlyVector2 } from "redgeometry/src/primitives/vector";
import type { Random } from "redgeometry/src/utility/random";
import type { World, WorldContext } from "../ecs/world.ts";
import { ColorRgba } from "../utility/color.ts";
import { createRandomColor } from "../utility/helper.ts";
import type { Image2 } from "../utility/image.ts";
import { START_SCHEDULE_ID, type AppCanvasData } from "./app.ts";

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export const APP_CONTEXT_START_SYSTEM_ID = "app-context-start-system";

function appContextStartSystem(world: World): void {
    const { canvas } = world.getData<AppCanvasData>("app-canvas-data");

    const context = canvas.getContext("2d");

    if (context === null) {
        throwError("Unable to create app rendering context");
    }

    const plugin = new AppContextPlugin(context);

    world.setPlugin<AppContextPlugin>(plugin);
}

export class AppContextPlugin {
    private context: CanvasRenderingContext2D;

    public readonly pluginId = "app-context-plugin";

    public constructor(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    public get canvas(): HTMLCanvasElement {
        return this.context.canvas;
    }

    public static fromCanvas(canvas: HTMLCanvasElement): AppContextPlugin | undefined {
        const context = canvas.getContext("2d");

        if (context === null) {
            return undefined;
        }

        return new AppContextPlugin(context);
    }

    public blitImage(image: Image2, dx: number, dy: number): void {
        const imageData = image.toImageData();

        if (imageData !== undefined) {
            this.context.putImageData(imageData, dx, dy);
        }
    }

    public clear(style: CanvasStyle = "#FFFFFF"): void {
        const ctx = this.context;
        ctx.resetTransform();
        ctx.save();
        ctx.fillStyle = style;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    public createLinePattern(d: number, style: CanvasStyle = "#000000"): CanvasPattern | null {
        const canvas = new OffscreenCanvas(d, d);
        const context = canvas.getContext("2d");

        if (context === null) {
            return null;
        }

        context.fillStyle = style;

        for (let i = 0; i < d; i++) {
            context.fillRect(i, i, 1, 1);
        }

        return this.context.createPattern(canvas, "repeat");
    }

    public drawBox(box: ReadonlyMinMaxBox2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.save();
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.strokeRect(box.minX, box.minY, box.sizeX(), box.sizeY());
        ctx.restore();
    }

    public drawBoxes(boxes: ReadonlyMinMaxBox2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const box of boxes) {
            ctx.rect(box.minX, box.minY, box.sizeX(), box.sizeY());
        }

        ctx.save();
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawEdge(edge: ReadonlyEdge2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();
        ctx.moveTo(edge.p0.x, edge.p0.y);
        ctx.lineTo(edge.p1.x, edge.p1.y);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawEdges(edges: readonly ReadonlyEdge2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const e of edges) {
            ctx.moveTo(e.p0.x, e.p0.y);
            ctx.lineTo(e.p1.x, e.p1.y);
        }

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawMesh2Next<S, F, E, V>(
        mesh: Mesh2Next<S, F, E, V>,
        options?: { pointWidth?: number; edgeWidth?: number; linkWidth?: number },
    ): void {
        const pointWidth = options?.pointWidth ?? 8;
        const edgeWidth = options?.pointWidth ?? 2;
        const linkWidth = options?.pointWidth ?? 2;

        const meshVertices = mesh.vertices;
        const meshEdges = mesh.edges;
        const meshFaces = mesh.faces;
        const meshLinks = mesh.links;
        const meshLoops = mesh.loops;

        const points: ReadonlyVector2[] = [];
        const edges: Path2[] = [];
        const faceEntries: { face: MeshNextFaceIdx; path: Path2 }[] = [];
        const linkEntries: { face: MeshNextFaceIdx; path: Path2 }[] = [];

        const iterVertices = meshVertices.createIterator();

        while (iterVertices.next()) {
            const vtx = iterVertices.getIndex();
            const vtxPos = meshVertices.getPos(vtx);

            points.push(vtxPos);
        }

        const iterEdges = meshEdges.createIterator();

        while (iterEdges.next()) {
            const edge = iterEdges.getIndex();
            const edgeLink = meshEdges.getLink(edge);

            const vtx0 = meshLinks.getVertex(edgeLink);
            const vtx1 = meshLinks.getVertexSym(edgeLink);

            const p0 = meshVertices.getPos(vtx0);
            const p1 = meshVertices.getPos(vtx1);

            const vu = p1.sub(p0).unit();
            const vn = vu.perpCCW();

            const pp0 = p0.addMulS(vu, 4 * pointWidth).addMulS(vn, 4 * linkWidth);
            const pp1 = p1.subMulS(vu, 4 * pointWidth).addMulS(vn, 4 * linkWidth);

            const path = Path2.createEmpty();
            path.moveTo(pp0);
            path.lineTo(pp1);

            edges.push(path);
        }

        const iterFaces = meshFaces.createIterator();
        const iterLoopNext = meshLoops.createIteratorNext(-1);
        const iterLinkLnext = meshLinks.createIteratorLnext(-1);

        while (iterFaces.next()) {
            const face = iterFaces.getIndex();
            const faceFirstLoop = meshFaces.getFirstLoop(face);
            const path = Path2.createEmpty();

            iterLoopNext.reset(faceFirstLoop);

            while (iterLoopNext.next()) {
                const loop = iterLoopNext.getIndex();
                const loopFirstLink = meshLoops.getFirstLink(loop);
                const polygon = Polygon2.createEmpty();

                iterLinkLnext.reset(loopFirstLink);

                while (iterLinkLnext.next()) {
                    const link = iterLinkLnext.getIndex();
                    const linkVtx = meshLinks.getVertex(link);
                    const linkVtxPos = meshVertices.getPos(linkVtx);

                    polygon.add(linkVtxPos);
                }

                path.addPolygon(polygon);
            }

            faceEntries.push({ face, path });
        }

        const iterLinks = meshLinks.createIterator();

        while (iterLinks.next()) {
            const link = iterLinks.getIndex();

            const vtx0 = meshLinks.getVertex(link);
            const vtx1 = meshLinks.getVertexSym(link);

            const p0 = meshVertices.getPos(vtx0);
            const p1 = meshVertices.getPos(vtx1);

            const path = Path2.createEmpty();

            if (vtx0 === vtx1) {
                const r = 10;
                const x = r * Math.cos(1);
                const y = r * Math.sin(1);
                const v0 = new Vector2(-x, -y);
                const v1 = new Vector2(x, -y);
                const v2 = new Vector2(x, 0);
                const pp0 = p0.add(v0);
                const pp1 = p1.add(v1);
                const pp2 = pp1.add(v2);

                path.moveTo(pp0);
                path.svgArcTo(pp1, r, r, 0, true, false);
                path.lineTo(pp2);
            } else {
                const vu = p1.sub(p0).unit();
                const vn = vu.perpCCW();

                const pp0 = p0.addMulS(vu, 2 * pointWidth).addMulS(vn, 1.5 * linkWidth);
                const pp1 = p1.subMulS(vu, 2 * pointWidth).addMulS(vn, 1.5 * linkWidth);
                const pp2 = p1.subMulS(vu, 3 * pointWidth).addMulS(vn, 4 * linkWidth);

                path.moveTo(pp0);
                path.lineTo(pp1);
                path.lineTo(pp2);
            }

            const loop = meshLinks.getLoop(link);
            const face = meshLoops.getFace(loop);

            linkEntries.push({ face, path });
        }

        for (const faceEntry of faceEntries) {
            const c = ColorRgba.fromHSV(faceEntry.face / meshFaces.length, 0.2, 1, 0.5);
            const pc = faceEntry.path.centroid();

            if (pc !== undefined) {
                this.fillPath(faceEntry.path, c.style());
                this.fillText(faceEntry.face.toString(), pc, "#000000");
            }
        }

        for (const linkEntry of linkEntries) {
            const c = ColorRgba.fromHSV(linkEntry.face / meshFaces.length, 1, 1, 1);

            this.drawPath(linkEntry.path, c.style(), linkWidth);
        }

        this.drawPaths(edges, "#888888", edgeWidth);
        this.fillPoints(points, "#000000", pointWidth);
    }

    public drawMeshEdges(mesh: Mesh2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const me of mesh.getEdges()) {
            ctx.moveTo(me.p0.x, me.p0.y);
            ctx.lineTo(me.p1.x, me.p1.y);
        }

        ctx.save();
        ctx.lineJoin = "round";
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.restore();
    }

    public drawPath(path: Path2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        this.addPath(ctx, path);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawPaths(paths: Path2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const path of paths) {
            this.addPath(ctx, path);
        }

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawPolygon(poly: Polygon2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        this.addPolygon(ctx, poly);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawRay(edge: ReadonlyRay2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();
        ctx.moveTo(edge.origin.x, edge.origin.y);
        ctx.lineTo(edge.origin.x + edge.direction.x, edge.origin.y + edge.direction.y);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public fillBox(box: ReadonlyMinMaxBox2, style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.save();
        ctx.fillStyle = style;
        ctx.fillRect(box.minX, box.minY, box.sizeX(), box.sizeY());
        ctx.restore();
    }

    public fillBoxes(boxes: ReadonlyMinMaxBox2[], style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const box of boxes) {
            ctx.rect(box.minX, box.minY, box.sizeX(), box.sizeY());
        }

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill();
        ctx.restore();
    }

    public fillEdgePoints(edges: readonly Edge2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const e of edges) {
            this.addCircle(ctx, e.p0, 0.5 * width);
            this.addCircle(ctx, e.p1, 0.5 * width);
        }

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill();
        ctx.restore();
    }

    public fillMesh(mesh: Mesh2, style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const face of mesh.getFaces()) {
            this.addMeshFaceToContext(ctx, face);
        }

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill();
        ctx.restore();
    }

    public fillMeshRandom(mesh: Mesh2, random: Random): void {
        const ctx = this.context;
        ctx.save();

        for (const face of mesh.getFaces()) {
            ctx.beginPath();

            this.addMeshFaceToContext(ctx, face);

            ctx.fillStyle = createRandomColor(random, 0.25, 1, 1).style();
            ctx.fill();
        }

        ctx.restore();
    }

    public fillPath(path: Path2, style: CanvasStyle = "#000000", fillRule?: "evenodd" | "nonzero"): void {
        const ctx = this.context;
        ctx.beginPath();

        this.addPath(ctx, path);

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill(fillRule);
        ctx.restore();
    }

    public fillPaths(paths: Path2[], style: CanvasStyle = "#000000", fillRule?: "evenodd" | "nonzero"): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const path of paths) {
            this.addPath(ctx, path);
        }

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill(fillRule);
        ctx.restore();
    }

    public fillPoints(points: readonly ReadonlyVector2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const p of points) {
            this.addCircle(ctx, p, 0.5 * width);
        }

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill();
        ctx.restore();
    }

    public fillPolygon(poly: Polygon2, style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.beginPath();

        this.addPolygon(ctx, poly);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.fillStyle = style;
        ctx.fill();
        ctx.restore();
    }

    public fillText(text: string, pc: ReadonlyVector2, style: CanvasStyle = "#000000", font = "16px Verdana"): void {
        const ctx = this.context;

        ctx.save();
        ctx.font = font;
        ctx.fillStyle = style;

        // Center text around `pc`
        const metrics = ctx.measureText(text);
        const x = pc.x - 0.5 * (metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft);
        const y = pc.y - 0.5 * (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent);

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    public getSize(dynamic: boolean): [number, number] {
        const canvas = this.context.canvas;
        if (dynamic) {
            return [canvas.width, canvas.height];
        } else {
            // Static size for reproducible data
            return [1400, 700];
        }
    }

    public resetTransform(): void {
        const ctx = this.context;
        ctx.resetTransform();
    }

    public resize(width: number, height: number): void {
        if (width < 0 || height < 0) {
            return;
        }

        const canvas = this.context.canvas;
        canvas.width = width;
        canvas.height = height;
    }

    public setTransform(mat: ReadonlyMatrix3A): void {
        const ctx = this.context;
        const el = mat.elements;
        ctx.setTransform(el[0], el[1], el[2], el[3], el[4], el[5]);
    }

    private addCircle(ctx: CanvasRenderingContext2D, c: ReadonlyVector2, r: number): void {
        ctx.moveTo(c.x + r, c.y);
        ctx.arcTo(c.x + r, c.y + r, c.x, c.y + r, r);
        ctx.arcTo(c.x - r, c.y + r, c.x - r, c.y, r);
        ctx.arcTo(c.x - r, c.y - r, c.x, c.y - r, r);
        ctx.arcTo(c.x + r, c.y - r, c.x + r, c.y, r);
        ctx.closePath();
    }

    private addMeshFaceToContext(ctx: CanvasRenderingContext2D, face: MeshFace2): void {
        const p0 = face.start.p0;
        ctx.moveTo(p0.x, p0.y);

        for (const e of face.getEdgeIterator()) {
            ctx.lineTo(e.p1.x, e.p1.y);
        }

        ctx.closePath();
    }

    private addPath(ctx: CanvasRenderingContext2D, path: Path2): void {
        if (!path.isValid()) {
            return;
        }

        const commands = path.getCommands();
        const points = path.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let p0 = Vector2.ZERO;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];

            switch (command.type) {
                case 0 /* MOVE */: {
                    p0 = points[pIdx++];
                    ctx.moveTo(p0.x, p0.y);
                    break;
                }
                case 1 /* LINEAR */: {
                    const p1 = points[pIdx++];

                    ctx.lineTo(p1.x, p1.y);
                    p0 = p1;
                    break;
                }
                case 2 /* QUADRATIC */: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];

                    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    p0 = p2;
                    break;
                }
                case 3 /* CUBIC */: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    const p3 = points[pIdx++];

                    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
                    p0 = p3;
                    break;
                }
                case 4 /* CONIC */: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    const w = command.w;

                    // HTML canvas does not support conics (approximate with a single cubic for now)
                    const a = (4 / 3) * (w / (w + 1));
                    const p01 = p0.lerp(p1, a);
                    const p12 = p2.lerp(p1, a);

                    ctx.bezierCurveTo(p01.x, p01.y, p12.x, p12.y, p2.x, p2.y);
                    p0 = p2;
                    break;
                }
                case 5 /* CLOSE */: {
                    ctx.closePath();
                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }
    }

    private addPolygon(ctx: CanvasRenderingContext2D, poly: Polygon2): void {
        const points = poly.points;

        if (points.length === 0) {
            return;
        }

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.closePath();
    }
}

export const APP_CONTEXT_MODULE_ID = "app-context-module";

export function appContextModule(context: WorldContext): void {
    context.addPlugin<AppContextPlugin>("app-context-plugin");

    context.addSystem({
        id: APP_CONTEXT_START_SYSTEM_ID,
        fn: appContextStartSystem,
        mode: "sync",
        scheduleId: START_SCHEDULE_ID,
    });

    context.requireData<AppCanvasData>("app-canvas-data");
}
