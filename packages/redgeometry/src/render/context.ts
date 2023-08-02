import { BUTT_CAPS, JoinType, type StrokeCaps } from "../core/path-options.js";
import type { Path2 } from "../core/path.js";
import { ColorRgba } from "../primitives/color.js";

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
