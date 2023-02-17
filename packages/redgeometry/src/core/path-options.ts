import { Point2 } from "../primitives";
import { PathSink2 } from "./path";
import { PathDash2, PathDashIncremental2, PathDashRecursive2 } from "./path-dash";
import { PathFlatten2, PathFlattenIncremental2, PathFlattenRecursive2 } from "./path-flatten";
import { PathOffset2, PathOffsetIncremental2, PathOffsetRecursive2 } from "./path-offset";
import { PathSimplify2, PathSimplifyIncremental2, PathSimplifyRecursive2 } from "./path-simplify";
import { PathStroke2, PathStrokeIncremental2, PathStrokeRecursive2 } from "./path-stroke";

export enum ApproximationMode {
    Incremental,
    Recursive,
}

export enum JoinType {
    Bevel,
    Miter,
    MiterClip,
    Round,
}

export enum CapType {
    Butt,
    Square,
    Round,
}

export enum WindingOperator {
    NonZero,
    EvenOdd,
    Positive,
    Negative,
}

export enum BooleanOperator {
    Union,
    Intersection,
    Exclusion,
    AWithoutB,
    BWithoutA,
}

export type PathQualityOptions = {
    clipPrecision: number;
    dashMode: ApproximationMode | PathDash2;
    flattenMode: ApproximationMode | PathFlatten2;
    flattenTolerance: number;
    offsetMode: ApproximationMode | PathOffset2;
    offsetTolerance: number;
    simplifyMode: ApproximationMode | PathSimplify2;
    simplifyTolerance: number;
    strokeMode: ApproximationMode | PathStroke2;
};

export type PathOffsetOptions = {
    join: JoinType;
    miterLimit: number;
    distance: number;
};

export type PathDashOptions = {
    array: number[];
    offset: number;
};

export type PathStrokeOptions = {
    caps: StrokeCaps;
    dashArray: number[];
    dashCaps: StrokeCaps;
    dashOffset: number;
    join: JoinType;
    miterLimit: number;
    width: number;
};

export type PathClipOptions = {
    booleanOperator: BooleanOperator;
    windingOperatorA: WindingOperator | CustomWindingOperator;
    windingOperatorB: WindingOperator | CustomWindingOperator;
};

export type StrokeCaps = {
    end: CapType | CustomCap;
    start: CapType | CustomCap;
};

export type CustomCap = (path: PathSink2, p0: Point2, p1: Point2) => void;
export type CustomWindingOperator = (wind: number) => boolean;

export const BUTT_CAPS: Readonly<StrokeCaps> = { start: CapType.Butt, end: CapType.Butt };
export const ROUND_CAPS: Readonly<StrokeCaps> = { start: CapType.Round, end: CapType.Round };
export const SQUARE_CAPS: Readonly<StrokeCaps> = { start: CapType.Square, end: CapType.Square };

export const DEFAULT_PATH_QUALITY_OPTIONS: Readonly<PathQualityOptions> = {
    clipPrecision: 65536,
    dashMode: ApproximationMode.Incremental,
    flattenMode: ApproximationMode.Incremental,
    flattenTolerance: 0.2,
    offsetMode: ApproximationMode.Incremental,
    offsetTolerance: 0.39269908169,
    simplifyMode: ApproximationMode.Incremental,
    simplifyTolerance: 0.05,
    strokeMode: ApproximationMode.Incremental,
};

export const DEFAULT_PATH_DASH_OPTIONS: Readonly<PathDashOptions> = {
    array: [],
    offset: 0,
};

export const DEFAULT_PATH_OFFSET_OPTIONS: Readonly<PathOffsetOptions> = {
    join: JoinType.Miter,
    miterLimit: 4,
    distance: 1,
};

export const DEFAULT_PATH_STROKE_OPTIONS: Readonly<PathStrokeOptions> = {
    caps: BUTT_CAPS,
    dashArray: [],
    dashCaps: BUTT_CAPS,
    dashOffset: 0,
    join: JoinType.Miter,
    miterLimit: 4,
    width: 1,
};

export const DEFAULT_PATH_CLIP_OPTIONS: Readonly<PathClipOptions> = {
    booleanOperator: BooleanOperator.Union,
    windingOperatorA: WindingOperator.NonZero,
    windingOperatorB: WindingOperator.NonZero,
};

// Threshold for acute (179.9999 degrees) and obtuse (0.0001 degrees) angles.
export const COS_ACUTE = -0.99999999999847689;
export const COS_OBTUSE = 0.99999999999847689;

// Threshold for curve splitting (to avoid tiny tail curves).
export const MIN_PARAMETER = 5e-7;
export const MAX_PARAMETER = 1 - MIN_PARAMETER;

export function createPathFlatten(options: PathQualityOptions): PathFlatten2 {
    switch (options.flattenMode) {
        case ApproximationMode.Incremental:
            return new PathFlattenIncremental2(options);
        case ApproximationMode.Recursive:
            return new PathFlattenRecursive2(options);
        default:
            return options.flattenMode;
    }
}

export function createPathSimplify(options: PathQualityOptions): PathSimplify2 {
    switch (options.simplifyMode) {
        case ApproximationMode.Incremental:
            return new PathSimplifyIncremental2(options);
        case ApproximationMode.Recursive:
            return new PathSimplifyRecursive2(options);
        default:
            return options.simplifyMode;
    }
}

export function createPathOffset(options: PathQualityOptions): PathOffset2 {
    switch (options.offsetMode) {
        case ApproximationMode.Incremental:
            return new PathOffsetIncremental2(options);
        case ApproximationMode.Recursive:
            return new PathOffsetRecursive2(options);
        default:
            return options.offsetMode;
    }
}

export function createPathDash(options: PathQualityOptions): PathDash2 {
    switch (options.dashMode) {
        case ApproximationMode.Incremental:
            return new PathDashIncremental2(options);
        case ApproximationMode.Recursive:
            return new PathDashRecursive2(options);
        default:
            return options.dashMode;
    }
}

export function createPathStroke(options: PathQualityOptions): PathStroke2 {
    switch (options.strokeMode) {
        case ApproximationMode.Incremental:
            return new PathStrokeIncremental2(options);
        case ApproximationMode.Recursive:
            return new PathStrokeRecursive2(options);
        default:
            return options.strokeMode;
    }
}
