/**
 * Returns a floating point number between `min(a, b)` and `max(a, b)` (exclusive) for
 * input `x` within the range [0, 1).
 */
export function betweenFloat(x: number, a: number, b: number): number {
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    const xd = x1 - x0;
    return x0 + x * xd;
}

/**
 * Returns an integer number between `min(a, b)` and `max(a, b)` (inclusive) for
 * input `x` within the range [0, 1).
 */
export function betweenInt(x: number, a: number, b: number): number {
    let x0 = Math.min(a, b);
    let x1 = Math.max(a, b);
    x0 = Math.ceil(x0);
    x1 = Math.floor(x1);
    const xd = x1 - x0 + 1;
    return Math.floor(x0 + x * xd);
}

/**
 * Returns the value `x` clamped between `min` and `max`.
 */
export function clamp(x: number, min: number, max: number): number {
    return x <= min ? min : x >= max ? max : x;
}

/**
 * Returns the linear interpolation of `x0` and `x1` with parameter `t`.
 */
export function lerp(x0: number, x1: number, t: number): number {
    return x0 + t * (x1 - x0);
}

export function roundToPrecision(x: number, k: number): number {
    return Math.round(k * x) / k;
}
