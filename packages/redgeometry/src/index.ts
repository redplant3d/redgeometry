export * from "./core/mesh.js";
export * from "./core/path-clip.js";
export * from "./core/path-dash.js";
export * from "./core/path-flatten.js";
export * from "./core/path-offset.js";
export * from "./core/path-options.js";
export * from "./core/path-overlay.js";
export * from "./core/path-simplify.js";
export * from "./core/path-stroke.js";
export * from "./core/path.js";
export * from "./core/snapround.js";
export * from "./primitives/bezier.js";
export * from "./primitives/box.js";
export * from "./primitives/color.js";
export * from "./primitives/edge.js";
export * from "./primitives/matrix.js";
export * from "./primitives/point.js";
export * from "./primitives/polygon.js";
export * from "./primitives/vector.js";
export * from "./utility/array.js";
export * from "./utility/debug.js";
export * from "./utility/float128.js";
export * from "./utility/hash.js";
export * from "./utility/interval.js";
export * from "./utility/log.js";
export * from "./utility/random.js";
export * from "./utility/scalar.js";
export * from "./utility/solve.js";
export * from "./utility/string.js";
export * from "./utility/types.js";
export * from "./utility/uint64.js";

/* eslint-disable no-var */
declare global {
    /** Enables debugging asserts for the `redgeometry` package */
    var REDGEOMETRY_DEBUG: boolean;
}
/* eslint-enable no-var */
