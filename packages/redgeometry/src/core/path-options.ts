import type { ReadonlyVector2 } from "../primitives/vector.js";
import type { Enum } from "../utility/types.js";
import { PathDashIncremental2, PathDashRecursive2, type PathDash2 } from "./path-dash.js";
import { PathFlattenIncremental2, PathFlattenRecursive2, type PathFlatten2 } from "./path-flatten.js";
import { PathOffsetIncremental2, PathOffsetRecursive2, type PathOffset2 } from "./path-offset.js";
import { PathSimplifyIncremental2, PathSimplifyRecursive2, type PathSimplify2 } from "./path-simplify.js";
import { PathStrokeIncremental2, PathStrokeRecursive2, type PathStroke2 } from "./path-stroke.js";
import type { PathSink2 } from "./path.js";

export const ApproximationMode = {
    INCREMENTAL: 0,
    RECURSIVE: 1,
} as const;
export type ApproximationMode = Enum<typeof ApproximationMode>;

export const JoinType = {
    BEVEL: 0,
    MITER: 1,
    MITER_CLIP: 2,
    ROUND: 3,
} as const;
export type JoinType = Enum<typeof JoinType>;

export const CapType = {
    BUTT: 0,
    SQUARE: 1,
    ROUND: 2,
} as const;
export type CapType = Enum<typeof CapType>;

export const WindingOperator = {
    NON_ZERO: 0,
    EVEN_ODD: 1,
    POSITIVE: 2,
    NEGATIVE: 3,
} as const;
export type WindingOperator = Enum<typeof WindingOperator>;

export const BooleanOperator = {
    UNION: 0,
    INTERSECTION: 1,
    EXCLUSION: 2,
    A_WITHOUT_B: 3,
    B_WITHOUT_A: 4,
} as const;
export type BooleanOperator = Enum<typeof BooleanOperator>;

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

export const BUTT_CAPS: Readonly<StrokeCaps> = { start: CapType.BUTT, end: CapType.BUTT };
export const ROUND_CAPS: Readonly<StrokeCaps> = { start: CapType.ROUND, end: CapType.ROUND };
export const SQUARE_CAPS: Readonly<StrokeCaps> = { start: CapType.SQUARE, end: CapType.SQUARE };

export const PATH_QUALITY_OPTIONS_DEFAULT: Readonly<PathQualityOptions> = {
    clipPrecision: 65536,
    dashMode: ApproximationMode.INCREMENTAL,
    flattenMode: ApproximationMode.INCREMENTAL,
    flattenTolerance: 0.2,
    offsetMode: ApproximationMode.INCREMENTAL,
    offsetTolerance: 0.39269908169,
    simplifyMode: ApproximationMode.INCREMENTAL,
    simplifyTolerance: 0.05,
    strokeMode: ApproximationMode.INCREMENTAL,
};

export const PATH_DASH_OPTIONS_DEFAULT: Readonly<PathDashOptions> = {
    array: [],
    offset: 0,
};

export const PATH_OFFSET_OPTIONS_DEFAULT: Readonly<PathOffsetOptions> = {
    join: JoinType.MITER,
    miterLimit: 4,
    distance: 1,
};

export const PATH_STROKE_OPTIONS_DEFAULT: Readonly<PathStrokeOptions> = {
    caps: BUTT_CAPS,
    dashArray: [],
    dashCaps: BUTT_CAPS,
    dashOffset: 0,
    join: JoinType.MITER,
    miterLimit: 4,
    width: 1,
};

export const PATH_CLIP_OPTIONS_DEFAULT: Readonly<PathClipOptions> = {
    booleanOperator: BooleanOperator.UNION,
    windingOperatorA: WindingOperator.NON_ZERO,
    windingOperatorB: WindingOperator.NON_ZERO,
};

// Threshold for acute (179.9999 degrees) and obtuse (0.0001 degrees) angles.
export const COS_ACUTE: number = -0.99999999999847689;
export const COS_OBTUSE: number = 0.99999999999847689;

// Threshold for curve splitting (to avoid tiny tail curves).
export const MIN_PARAMETER: number = 5e-7;
export const MAX_PARAMETER: number = 1 - MIN_PARAMETER;

export function createPathFlatten(options: PathQualityOptions): PathFlatten2 {
    switch (options.flattenMode) {
        case 0 /* INCREMENTAL */:
            return new PathFlattenIncremental2(options);
        case 1 /* RECURSIVE */:
            return new PathFlattenRecursive2(options);
        default:
            return options.flattenMode;
    }
}

export function createPathSimplify(options: PathQualityOptions): PathSimplify2 {
    switch (options.simplifyMode) {
        case 0 /* INCREMENTAL */:
            return new PathSimplifyIncremental2(options);
        case 1 /* RECURSIVE */:
            return new PathSimplifyRecursive2(options);
        default:
            return options.simplifyMode;
    }
}

export function createPathOffset(options: PathQualityOptions): PathOffset2 {
    switch (options.offsetMode) {
        case 0 /* INCREMENTAL */:
            return new PathOffsetIncremental2(options);
        case 1 /* RECURSIVE */:
            return new PathOffsetRecursive2(options);
        default:
            return options.offsetMode;
    }
}

export function createPathDash(options: PathQualityOptions): PathDash2 {
    switch (options.dashMode) {
        case 0 /* INCREMENTAL */:
            return new PathDashIncremental2(options);
        case 1 /* RECURSIVE */:
            return new PathDashRecursive2(options);
        default:
            return options.dashMode;
    }
}

export function createPathStroke(options: PathQualityOptions): PathStroke2 {
    switch (options.strokeMode) {
        case 0 /* INCREMENTAL */:
            return new PathStrokeIncremental2(options);
        case 1 /* RECURSIVE */:
            return new PathStrokeRecursive2(options);
        default:
            return options.strokeMode;
    }
}
