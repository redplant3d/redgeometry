import type { PathFlatten2 } from "../core/path-flatten.js";
import { DEFAULT_PATH_QUALITY_OPTIONS, createPathFlatten, createPathStroke } from "../core/path-options.js";
import type { PathStroke2 } from "../core/path-stroke.js";
import { Path2 } from "../core/path.js";
import type { Matrix3A } from "../primitives/matrix.js";
import { Point2 } from "../primitives/point.js";
import {
    FillRule,
    StrokeTransformOrder,
    type ContextFillOptions,
    type ContextStrokeOptions,
} from "../render/context.js";
import type { Image2 } from "../render/image.js";
import { clamp } from "../utility/scalar.js";
import { Compositor } from "./compositor.js";
import { RasterizerAliased } from "./rasterizer-aliased.js";

class Rectangle2 {
    public bottom: number;
    public left: number;
    public right: number;
    public top: number;

    public constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }
}

export class PipelineSoftware {
    private clipRect: Rectangle2;
    private compositor: Compositor;
    private pathFlatten: PathFlatten2;
    private pathStroke: PathStroke2;
    private rasterizer: RasterizerAliased;

    public constructor() {
        this.compositor = new Compositor();
        this.rasterizer = new RasterizerAliased(this.compositor);

        this.clipRect = new Rectangle2(0, 0, 0, 0);

        this.pathFlatten = createPathFlatten(DEFAULT_PATH_QUALITY_OPTIONS);
        this.pathStroke = createPathStroke(DEFAULT_PATH_QUALITY_OPTIONS);
    }

    public addFill(path: Path2, mat: Matrix3A): void {
        const input = this.rentPath();
        input.copyFrom(path);
        input.transform(mat);

        this.flatten(input);
        this.returnPath(input);
    }

    public addStroke(path: Path2, mat: Matrix3A, options: ContextStrokeOptions): void {
        const stroke = this.rentPath();

        if (options.transformOrder === StrokeTransformOrder.Pre) {
            // Transform -> Stroke
            const input = this.rentPath();
            input.copyFrom(path);
            input.transform(mat);

            this.pathStroke.process(input, stroke, options);
            this.returnPath(input);
        } else {
            // Stroke -> Transform
            this.pathStroke.process(path, stroke, options);
            stroke.transform(mat);
        }

        this.flatten(stroke);
        this.returnPath(stroke);
    }

    public begin(image: Image2): void {
        const width = image.getWidth();
        const height = image.getWidth();

        this.clipRect = new Rectangle2(0, height, width, 0);

        this.compositor.initialize(image);
        this.rasterizer.initialize(width, height);
    }

    public clear(options: ContextFillOptions): void {
        this.compositor.setColor(options.color);
        this.compositor.fill();
    }

    public end(): void {
        return;
    }

    public renderFill(options: ContextFillOptions): void {
        this.compositor.setColor(options.color);
        this.compositor.setOperation(options.compOp);
        this.rasterizer.render(options.rule);
    }

    public renderStroke(options: ContextStrokeOptions): void {
        this.compositor.setColor(options.color);
        this.compositor.setOperation(options.compOp);
        this.rasterizer.render(FillRule.NonZero);
    }

    public rentPath(): Path2 {
        return Path2.createEmpty();
    }

    public returnPath(_path: Path2): void {
        return;
    }

    private clipPolyline(polyline: readonly Point2[], rect: Rectangle2): void {
        const rasterizer = this.rasterizer;
        let p1 = polyline[0];

        let y = clamp(p1.y, rect.bottom, rect.top);

        let yl = y;
        let yr = y;

        const count = polyline.length;

        for (let i = 1; i < count; i++) {
            const p0 = p1;

            p1 = polyline[i];

            let pp0 = p0;
            let pp1 = p1;

            // Clip left
            if (pp0.x < rect.left) {
                if (pp1.x < rect.left) {
                    continue;
                } else {
                    pp0 = getVerticalIntersection(p0, p1, rect.left);
                    y = clamp(pp0.y, rect.bottom, rect.top);
                    rasterizer.addLine(rect.left, yl, rect.left, y);
                }
            } else if (pp1.x < rect.left) {
                pp1 = getVerticalIntersection(p0, p1, rect.left);
                yl = clamp(pp1.y, rect.bottom, rect.top);
            }

            // Clip right
            if (pp0.x > rect.right) {
                if (pp1.x > rect.right) {
                    continue;
                } else {
                    pp0 = getVerticalIntersection(p0, p1, rect.right);
                    y = clamp(pp0.y, rect.bottom, rect.top);
                    rasterizer.addLine(rect.right, yr, rect.right, y);
                }
            } else if (pp1.x > rect.right) {
                pp1 = getVerticalIntersection(p0, p1, rect.right);
                yr = clamp(pp1.y, rect.bottom, rect.top);
            }

            // Clip bottom
            if (pp0.y < rect.bottom) {
                if (pp1.y < rect.bottom) {
                    continue;
                } else {
                    pp0 = getHorizontalIntersection(p0, p1, rect.bottom);
                }
            } else if (pp1.y < rect.bottom) {
                pp1 = getHorizontalIntersection(p0, p1, rect.bottom);
            }

            // Clip top
            if (pp0.y > rect.top) {
                if (pp1.y > rect.top) {
                    continue;
                } else {
                    pp0 = getHorizontalIntersection(p0, p1, rect.top);
                }
            } else if (pp1.y > rect.top) {
                pp1 = getHorizontalIntersection(p0, p1, rect.top);
            }

            rasterizer.addLine(pp0.x, pp0.y, pp1.x, pp1.y);
        }

        if (p1.x > rect.right) {
            y = clamp(p1.y, rect.bottom, rect.top);
            rasterizer.addLine(rect.right, yr, rect.right, y);
        } else if (p1.x < rect.left) {
            y = clamp(p1.y, rect.bottom, rect.top);
            rasterizer.addLine(rect.left, yl, rect.left, y);
        }
    }

    private flatten(path: Path2): void {
        const flattened = Path2.createEmpty();
        this.pathFlatten.process(path, flattened, true);

        this.clipPolyline(flattened.getPoints(), this.clipRect);
    }
}

function getHorizontalIntersection(p1: Point2, p2: Point2, y: number): Point2 {
    return new Point2(p1.x + ((p2.x - p1.x) * (y - p1.y)) / (p2.y - p1.y), y);
}

function getVerticalIntersection(p1: Point2, p2: Point2, x: number): Point2 {
    return new Point2(x, p1.y + ((p2.y - p1.y) * (x - p1.x)) / (p2.x - p1.x));
}
