import type { Mesh2, MeshFace2 } from "redgeometry/src/core/mesh";
import { PathCommandType, type Path2 } from "redgeometry/src/core/path";
import type { Box2 } from "redgeometry/src/primitives/box";
import type { Edge2 } from "redgeometry/src/primitives/edge";
import { Point2 } from "redgeometry/src/primitives/point";
import type { Polygon2 } from "redgeometry/src/primitives/polygon";
import type { Ray2 } from "redgeometry/src/primitives/ray";
import type { Image2 } from "redgeometry/src/render/image";
import { assertUnreachable, throwError } from "redgeometry/src/utility/debug";
import type { Random } from "redgeometry/src/utility/random";
import type { DefaultSystemStage, WorldModule, WorldPlugin } from "../ecs/types.js";
import type { World } from "../ecs/world.js";
import { createRandomColor } from "../utility/helper.js";
import type { AppCanvasData } from "./app.js";

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export function initCanvasContextSystem(world: World): void {
    const { canvas } = world.readData<AppCanvasData>("app-canvas");

    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (context === null) {
        throwError("Unable to create app rendering context");
    }

    const plugin = new AppContextPlugin(context);

    world.setPlugin<AppContextPlugin>(plugin);
}

export class AppContextPlugin implements WorldPlugin {
    private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    public readonly pluginId = "app-context";

    public constructor(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        this.context = context;
    }

    public get canvas(): HTMLCanvasElement | OffscreenCanvas {
        return this.context.canvas;
    }

    public static fromCanvas(canvas: HTMLCanvasElement): AppContextPlugin | undefined {
        const context = canvas.getContext("2d") as CanvasRenderingContext2D | null;

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

    public drawBox(box: Box2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.save();
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
        ctx.restore();
    }

    public drawBoxes(boxes: Box2[], style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const box of boxes) {
            ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
        }

        ctx.save();
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public drawEdge(edge: Edge2, style: CanvasStyle = "#000000", width = 1): void {
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

    public drawEdges(edges: readonly Edge2[], style: CanvasStyle = "#000000", width = 1): void {
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

    public drawRay(edge: Ray2, style: CanvasStyle = "#000000", width = 1): void {
        const ctx = this.context;
        ctx.beginPath();
        ctx.moveTo(edge.p.x, edge.p.y);
        ctx.lineTo(edge.p.x + edge.v.x, edge.p.y + edge.v.y);

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineWidth = width;
        ctx.strokeStyle = style;
        ctx.stroke();
        ctx.restore();
    }

    public fillBox(box: Box2, style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.save();
        ctx.fillStyle = style;
        ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
        ctx.restore();
    }

    public fillBoxes(boxes: Box2[], style: CanvasStyle = "#000000"): void {
        const ctx = this.context;
        ctx.beginPath();

        for (const box of boxes) {
            ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
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

    public fillPath(path: Path2, style: CanvasStyle = "#000000", fillRule?: "evenodd" | "nonzero" | undefined): void {
        const ctx = this.context;
        ctx.beginPath();

        this.addPath(ctx, path);

        ctx.save();
        ctx.fillStyle = style;
        ctx.fill(fillRule);
        ctx.restore();
    }

    public fillPoints(points: readonly Point2[], style: CanvasStyle = "#000000", width = 1): void {
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

    public fillText(text: string, pc: Point2, style: CanvasStyle = "#000000", font = "16px Verdana"): void {
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

    public resize(width: number, height: number): void {
        if (width < 0 || height < 0) {
            return;
        }

        const canvas = this.context.canvas;
        canvas.width = width;
        canvas.height = height;
    }

    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        const ctx = this.context;

        ctx.setTransform(a, b, c, d, e, f);
    }

    private addCircle(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, c: Point2, r: number): void {
        ctx.moveTo(c.x + r, c.y);
        ctx.arcTo(c.x + r, c.y + r, c.x, c.y + r, r);
        ctx.arcTo(c.x - r, c.y + r, c.x - r, c.y, r);
        ctx.arcTo(c.x - r, c.y - r, c.x, c.y - r, r);
        ctx.arcTo(c.x + r, c.y - r, c.x + r, c.y, r);
        ctx.closePath();
    }

    private addMeshFaceToContext(
        ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        face: MeshFace2,
    ): void {
        const p0 = face.start.p0;
        ctx.moveTo(p0.x, p0.y);

        for (const e of face.getEdgeIterator()) {
            ctx.lineTo(e.p1.x, e.p1.y);
        }

        ctx.closePath();
    }

    private addPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, path: Path2): void {
        if (!path.isValid()) {
            return;
        }

        const commands = path.getCommands();
        const points = path.getPoints();

        let cIdx = 0;
        let pIdx = 0;

        let p0 = Point2.ZERO;

        while (cIdx < commands.length) {
            const command = commands[cIdx++];

            switch (command.type) {
                case PathCommandType.Move: {
                    p0 = points[pIdx++];
                    ctx.moveTo(p0.x, p0.y);
                    break;
                }
                case PathCommandType.Linear: {
                    const p1 = points[pIdx++];

                    ctx.lineTo(p1.x, p1.y);
                    p0 = p1;
                    break;
                }
                case PathCommandType.Quadratic: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];

                    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    p0 = p2;
                    break;
                }
                case PathCommandType.Cubic: {
                    const p1 = points[pIdx++];
                    const p2 = points[pIdx++];
                    const p3 = points[pIdx++];

                    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
                    p0 = p3;
                    break;
                }
                case PathCommandType.Conic: {
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
                case PathCommandType.Close: {
                    ctx.closePath();
                    break;
                }
                default: {
                    assertUnreachable(command);
                }
            }
        }
    }

    private addPolygon(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, poly: Polygon2): void {
        const vertices = poly.getPoints();

        if (vertices.length === 0) {
            return;
        }

        ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        ctx.closePath();
    }
}

export class AppContextModule implements WorldModule {
    public readonly moduleId = "app-context";

    public setup(world: World): void {
        world.registerPlugin<AppContextPlugin>("app-context");

        world.addSystem<DefaultSystemStage>({ stage: "start-pre", fn: initCanvasContextSystem });
    }
}
