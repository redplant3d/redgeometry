/**
 * Returns a floating point number between `min(a, b)` and `max(a, b)` (exclusive) for
 * input `x` within the range [0, 1).
 */
export function betweenFloat(a: number, b: number, t: number): number {
    const x0 = Math.min(a, b);
    const x1 = Math.max(a, b);
    return lerp(x0, x1, t);
}

/**
 * Returns an integer number between `min(a, b)` and `max(a, b)` (inclusive) for
 * input `x` within the range [0, 1).
 */
export function betweenInt(a: number, b: number, t: number): number {
    let x0 = Math.min(a, b);
    let x1 = Math.max(a, b);
    x0 = Math.ceil(x0);
    x1 = Math.floor(x1);
    const x = lerp(x0, x1, t);
    return Math.ceil(x);
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

/**
 * Returns the next power of two for `x > 0`.
 *
 * Note: Does not return `1` for `x = 0` but rather `0` (which is not strictly correct).
 */
export function nextPowerOfTwo(x: number): number {
    let y = x - 1;
    y |= y >>> 1;
    y |= y >>> 2;
    y |= y >>> 4;
    y |= y >>> 8;
    y |= y >>> 16;
    return y + 1;
}

export function roundToPrecision(x: number, k: number): number {
    return Math.round(k * x) / k;
}
