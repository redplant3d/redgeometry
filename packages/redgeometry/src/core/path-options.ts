import type { ReadonlyVector2 } from "../primitives/vector.js";
import { PathDashIncremental2, PathDashRecursive2, type PathDash2 } from "./path-dash.js";
import { PathFlattenIncremental2, PathFlattenRecursive2, type PathFlatten2 } from "./path-flatten.js";
import { PathOffsetIncremental2, PathOffsetRecursive2, type PathOffset2 } from "./path-offset.js";
import { PathSimplifyIncremental2, PathSimplifyRecursive2, type PathSimplify2 } from "./path-simplify.js";
import { PathStrokeIncremental2, PathStrokeRecursive2, type PathStroke2 } from "./path-stroke.js";
import type { PathSink2 } from "./path.js";

export const ApproximationMode = {
    Incremental: 0,
    Recursive: 1,
} as const;
export type ApproximationMode = (typeof ApproximationMode)[keyof typeof ApproximationMode];

export const JoinType = {
    Bevel: 0,
    Miter: 1,
    MiterClip: 2,
    Round: 3,
} as const;
export type JoinType = (typeof JoinType)[keyof typeof JoinType];

export const CapType = {
    Butt: 0,
    Square: 1,
    Round: 2,
} as const;
export type CapType = (typeof CapType)[keyof typeof CapType];

export const WindingOperator = {
    NonZero: 0,
    EvenOdd: 1,
    Positive: 2,
    Negative: 3,
} as const;
export type WindingOperator = (typeof WindingOperator)[keyof typeof WindingOperator];

export const BooleanOperator = {
    Union: 0,
    Intersection: 1,
    Exclusion: 2,
    AWithoutB: 3,
    BWithoutA: 4,
} as const;
export type BooleanOperator = (typeof BooleanOperator)[keyof typeof BooleanOperator];

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

export type CustomCap = (path: PathSink2, p0: ReadonlyVector2, p1: ReadonlyVector2) => void;
export type CustomWindingOperator = (wind: number) => boolean;

export const BUTT_CAPS: Readonly<StrokeCaps> = { start: CapType.Butt, end: CapType.Butt };
export const ROUND_CAPS: Readonly<StrokeCaps> = { start: CapType.Round, end: CapType.Round };
export const SQUARE_CAPS: Readonly<StrokeCaps> = { start: CapType.Square, end: CapType.Square };

export const PATH_QUALITY_OPTIONS_DEFAULT: Readonly<PathQualityOptions> = {
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

export const PATH_DASH_OPTIONS_DEFAULT: Readonly<PathDashOptions> = {
    array: [],
    offset: 0,
};

export const PATH_OFFSET_OPTIONS_DEFAULT: Readonly<PathOffsetOptions> = {
    join: JoinType.Miter,
    miterLimit: 4,
    distance: 1,
};

export const PATH_STROKE_OPTIONS_DEFAULT: Readonly<PathStrokeOptions> = {
    caps: BUTT_CAPS,
    dashArray: [],
    dashCaps: BUTT_CAPS,
    dashOffset: 0,
    join: JoinType.Miter,
    miterLimit: 4,
    width: 1,
};

export const PATH_CLIP_OPTIONS_DEFAULT: Readonly<PathClipOptions> = {
    booleanOperator: BooleanOperator.Union,
    windingOperatorA: WindingOperator.NonZero,
    windingOperatorB: WindingOperator.NonZero,
};

// Threshold for acute (179.9999 degrees) and obtuse (0.0001 degrees) angles.
export const COS_ACUTE: number = -0.99999999999847689;
export const COS_OBTUSE: number = 0.99999999999847689;

// Threshold for curve splitting (to avoid tiny tail curves).
export const MIN_PARAMETER: number = 5e-7;
export const MAX_PARAMETER: number = 1 - MIN_PARAMETER;

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
