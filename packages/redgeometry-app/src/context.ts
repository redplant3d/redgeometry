import { Mesh2, MeshFace2, Path2, PathCommandType } from "redgeometry/src/core";
import { Box2, Edge2, Point2, Polygon2 } from "redgeometry/src/primitives";
import { Image2 } from "redgeometry/src/render";
import { Debug, Random } from "redgeometry/src/utility";
import { createRandomColor } from "./data";

type CanvasStyle = string | CanvasGradient | CanvasPattern;

export class AppContext2D {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;
    }

    public static fromCanvas(canvas: HTMLCanvasElement): AppContext2D | undefined {
        const context = canvas.getContext("2d");

        if (context !== null) {
            return new AppContext2D(canvas, context);
        } else {
            return undefined;
        }
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
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }

    public createLinePattern(d: number, style: CanvasStyle = "#000000"): CanvasPattern | null {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context === null) {
            return null;
        }

        canvas.width = d;
        canvas.height = d;

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

            ctx.fillStyle = createRandomColor(random, 0.25, 1, 1).style;
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
        if (dynamic) {
            return [this.canvas.width, this.canvas.height];
        } else {
            // Static size for reproducible data
            return [1400, 700];
        }
    }

    public resize(width: number, height: number): void {
        if (width < 0 || height < 0) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
    }

    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        const ctx = this.context;

        ctx.setTransform(a, b, c, d, e, f);
    }

    private addCircle(ctx: CanvasRenderingContext2D, c: Point2, r: number): void {
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

        let p0 = Point2.zero;

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
                    Debug.assertUnreachable(command);
                }
            }
        }
    }

    private addPolygon(ctx: CanvasRenderingContext2D, poly: Polygon2): void {
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

export class AppContextGPU {
    private canvas: HTMLCanvasElement;

    public readonly adapter: GPUAdapter;
    public readonly context: GPUCanvasContext;
    public readonly device: GPUDevice;
    public readonly format: GPUTextureFormat;

    public currentTexture: GPUTexture;
    public currentTextureView: GPUTextureView;

    constructor(
        canvas: HTMLCanvasElement,
        context: GPUCanvasContext,
        format: GPUTextureFormat,
        adapter: GPUAdapter,
        device: GPUDevice
    ) {
        this.canvas = canvas;
        this.format = format;
        this.adapter = adapter;
        this.context = context;
        this.device = device;

        const texture = context.getCurrentTexture();
        const textureView = texture.createView();

        this.currentTexture = texture;
        this.currentTextureView = textureView;
    }

    public get height(): number {
        return this.canvas.height;
    }

    public get width(): number {
        return this.canvas.width;
    }

    public static async fromCanvas(
        canvas: HTMLCanvasElement,
        alphaMode: GPUCanvasAlphaMode = "premultiplied"
    ): Promise<AppContextGPU | undefined> {
        const gpu = navigator.gpu as GPU | undefined;

        if (gpu === undefined) {
            return undefined;
        }

        const context = canvas.getContext("webgpu");
        const format = gpu.getPreferredCanvasFormat();

        const adapter = await gpu.requestAdapter();

        if (context === null || adapter === null) {
            return undefined;
        }

        const device = await adapter.requestDevice();

        context.configure({ device, format, alphaMode });

        return new AppContextGPU(canvas, context, format, adapter, device);
    }

    public beginFrame(): void {
        const texture = this.context.getCurrentTexture();
        const textureView = texture.createView();

        this.currentTexture = texture;
        this.currentTextureView = textureView;
    }

    public getSize(dynamic: boolean): [number, number] {
        if (dynamic) {
            return [this.width, this.height];
        } else {
            // Static size for reproducible data
            return [1400, 700];
        }
    }

    public resize(width: number, height: number): void {
        if (width < 0 || height < 0) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        const device = this.device;
        const format = this.format;
        const alphaMode = "premultiplied";

        this.context.configure({ device, format, alphaMode });
    }
}
