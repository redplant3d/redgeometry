import { BUTT_CAPS, JoinType, type StrokeCaps } from "../core/path-options.js";
import type { Path2 } from "../core/path.js";
import { ColorRgba } from "../primitives/color.js";
import { Matrix3A } from "../primitives/matrix.js";
import type { Image2 } from "./image.js";
import { SoftwareRenderPipeline, type RenderPipeline } from "./pipeline.js";

export enum CompositeOperation {
    Source,
    SourceOver,
}

export enum FillRule {
    NonZero,
    EvenOdd,
}

export enum StrokeTransformOrder {
    Pre,
    Post,
}

export type ContextFillOptions = {
    color: ColorRgba;
    compOp: CompositeOperation;
    rule: FillRule;
};

export type ContextStrokeOptions = {
    caps: StrokeCaps;
    color: ColorRgba;
    compOp: CompositeOperation;
    dashArray: number[];
    dashCaps: StrokeCaps;
    dashOffset: number;
    join: JoinType;
    miterLimit: number;
    transformOrder: StrokeTransformOrder;
    width: number;
};

export const DEFAULT_CONTEXT_FILL_OPTIONS: Readonly<ContextFillOptions> = {
    color: new ColorRgba(0, 0, 0, 255),
    compOp: CompositeOperation.SourceOver,
    rule: FillRule.NonZero,
};

export const DEFAULT_CONTEXT_STROKE_OPTIONS: Readonly<ContextStrokeOptions> = {
    caps: BUTT_CAPS,
    color: new ColorRgba(0, 0, 0, 255),
    compOp: CompositeOperation.SourceOver,
    dashArray: [],
    dashCaps: BUTT_CAPS,
    dashOffset: 0,
    join: JoinType.Miter,
    miterLimit: 4,
    transformOrder: StrokeTransformOrder.Post,
    width: 1,
};

export interface RenderContext2 {
    caps: StrokeCaps;
    dashArray: number[];
    dashCaps: StrokeCaps;
    dashOffset: number;
    fillColor: ColorRgba;
    fillCompOp: CompositeOperation;
    fillRule: FillRule;
    join: JoinType;
    miterLimit: number;
    strokeColor: ColorRgba;
    strokeCompOp: CompositeOperation;
    strokeWidth: number;
    transformOrder: StrokeTransformOrder;

    clear(): void;
    fillCircle(x: number, y: number, r: number): void;
    fillEllipse(x: number, y: number, rx: number, ry: number): void;
    fillPath(path: Path2): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    rentPath(): Path2;
    returnPath(path: Path2): void;
    strokeCircle(cx: number, cy: number, r: number): void;
    strokeEllipse(cx: number, cy: number, rx: number, ry: number): void;
    strokeLine(x0: number, y0: number, x1: number, y1: number): void;
    strokePath(path: Path2): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
}

export class SoftwareRenderContext2 implements RenderContext2 {
    private fillOptions: ContextFillOptions;
    private pipeline: RenderPipeline;
    private strokeOptions: ContextStrokeOptions;
    private transform: Matrix3A;

    public constructor() {
        this.fillOptions = { ...DEFAULT_CONTEXT_FILL_OPTIONS };
        this.strokeOptions = { ...DEFAULT_CONTEXT_STROKE_OPTIONS };
        this.pipeline = new SoftwareRenderPipeline();
        this.transform = Matrix3A.createIdentity();
    }

    public get caps(): StrokeCaps {
        return this.strokeOptions.caps;
    }

    public set caps(caps: StrokeCaps) {
        this.strokeOptions.caps = caps;
    }

    public get dashArray(): number[] {
        return this.strokeOptions.dashArray;
    }

    public set dashArray(arr: number[]) {
        this.strokeOptions.dashArray = arr;
    }

    public get dashCaps(): StrokeCaps {
        return this.strokeOptions.dashCaps;
    }

    public set dashCaps(caps: StrokeCaps) {
        this.strokeOptions.dashCaps = caps;
    }

    public get dashOffset(): number {
        return this.strokeOptions.dashOffset;
    }

    public set dashOffset(offset: number) {
        this.strokeOptions.dashOffset = offset;
    }

    public get fillColor(): ColorRgba {
        return this.fillOptions.color;
    }

    public set fillColor(color: ColorRgba) {
        this.fillOptions.color = color;
    }

    public get fillCompOp(): CompositeOperation {
        return this.fillOptions.compOp;
    }

    public set fillCompOp(compOp: CompositeOperation) {
        this.fillOptions.compOp = compOp;
    }

    public get fillRule(): FillRule {
        return this.fillOptions.rule;
    }

    public set fillRule(rule: FillRule) {
        this.fillOptions.rule = rule;
    }

    public get join(): JoinType {
        return this.strokeOptions.join;
    }

    public set join(join: JoinType) {
        this.strokeOptions.join = join;
    }

    public get miterLimit(): number {
        return this.strokeOptions.miterLimit;
    }

    public set miterLimit(ml: number) {
        this.strokeOptions.miterLimit = ml;
    }

    public get strokeColor(): ColorRgba {
        return this.strokeOptions.color;
    }

    public set strokeColor(color: ColorRgba) {
        this.strokeOptions.color = color;
    }

    public get strokeCompOp(): CompositeOperation {
        return this.strokeOptions.compOp;
    }

    public set strokeCompOp(compOp: CompositeOperation) {
        this.strokeOptions.compOp = compOp;
    }

    public get strokeWidth(): number {
        return this.strokeOptions.width;
    }

    public set strokeWidth(width: number) {
        this.strokeOptions.width = width;
    }

    public get transformOrder(): StrokeTransformOrder {
        return this.strokeOptions.transformOrder;
    }

    public set transformOrder(order: StrokeTransformOrder) {
        this.strokeOptions.transformOrder = order;
    }

    public begin(image: Image2): void {
        this.pipeline.begin(image);
    }

    public clear(): void {
        this.pipeline.clear(this.fillOptions);
    }

    public end(): void {
        this.pipeline.end();
    }

    public fillCircle(x: number, y: number, r: number): void {
        const path = this.rentPath();
        path.addCircleXY(x, y, r);
        this.fillPath(path);
        this.returnPath(path);
    }

    public fillEllipse(x: number, y: number, rx: number, ry: number): void {
        const path = this.rentPath();
        path.addEllipseXY(x, y, rx, ry);
        this.fillPath(path);
        this.returnPath(path);
    }

    public fillPath(path: Path2): void {
        this.pipeline.addFill(path, this.transform);
        this.pipeline.renderFill(this.fillOptions);
    }

    public fillRect(x: number, y: number, w: number, h: number): void {
        const path = this.rentPath();
        path.addRectXY(x, y, w, h);
        this.fillPath(path);
        this.returnPath(path);
    }

    public rentPath(): Path2 {
        return this.pipeline.rentPath();
    }

    public returnPath(path: Path2): void {
        this.pipeline.returnPath(path);
    }

    public strokeCircle(cx: number, cy: number, r: number): void {
        const path = this.rentPath();
        path.addCircleXY(cx, cy, r);
        this.strokePath(path);
        this.returnPath(path);
    }

    public strokeEllipse(cx: number, cy: number, rx: number, ry: number): void {
        const path = this.rentPath();
        path.addEllipseXY(cx, cy, rx, ry);
        this.strokePath(path);
        this.returnPath(path);
    }

    public strokeLine(x0: number, y0: number, x1: number, y1: number): void {
        const path = this.rentPath();
        path.addLineXY(x0, y0, x1, y1);
        this.strokePath(path);
        this.returnPath(path);
    }

    public strokePath(path: Path2): void {
        this.pipeline.addStroke(path, this.transform, this.strokeOptions);
        this.pipeline.renderStroke(this.strokeOptions);
    }

    public strokeRect(x: number, y: number, w: number, h: number): void {
        const path = this.rentPath();
        path.addRectXY(x, y, w, h);
        this.strokePath(path);
        this.returnPath(path);
    }
}
