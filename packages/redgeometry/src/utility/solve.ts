export enum RootType {
    Zero,
    One,
    Two,
    Three,
}

export type Root0 = {
    type: RootType.Zero;
};

export type Root1 = {
    type: RootType.One;
    x: number;
};

export type Root2 = {
    type: RootType.Two;
    x1: number;
    x2: number;
};

export type Root3 = {
    type: RootType.Three;
    x1: number;
    x2: number;
    x3: number;
};

/**
 * Solves `a * x + b = 0` for `x`.
 */
export function solveLinear(a: number, b: number): number {
    return -b / a;
}

/**
 * Solves `a * x^2 + 2 * b * x + c = 0` for real `x`.
 *
 * References:
 * - James F. Blinn.
 *   *How to Solve a Quadratic Equation (Part 1-2)*.
 *   IEEE Computer Graphics and Applications.
 */
export function solveQuadratic(a: number, b: number, c: number): Root2 | Root0 {
    let d = b * b - a * c;

    if (d < 0) {
        // No roots (ignore complex pair)
        return { type: RootType.Zero };
    } else {
        // Two roots
        let x1: number | undefined;
        let x2: number | undefined;

        d = Math.sqrt(d);

        if (b > 0) {
            d = -b - d;
            x1 = c / d;
            x2 = d / a;
        } else if (b < 0) {
            d = -b + d;
            x1 = d / a;
            x2 = c / d;
        } else if (a * a >= c * c) {
            x1 = d / a;
            x2 = -d / a;
        } else {
            x1 = c / -d;
            x2 = c / d;
        }

        return { type: RootType.Two, x1, x2 };
    }
}

/**
 * Solves `a * x^3 + 3 * b * x^2 + 3 * c * x + d = 0` for real `x`.
 *
 * References:
 * - James F. Blinn.
 *   *How to Solve a Cubic Equation (Part 1-5)*.
 *   IEEE Computer Graphics and Applications.
 */
export function solveCubic(a: number, b: number, c: number, d: number): Root3 | Root1 {
    const d1 = a * c - b * b;
    const d2 = a * d - b * c;
    const d3 = b * d - c * c;
    const dt = 4 * d1 * d3 - d2 * d2;

    if (dt < 0) {
        // Single root (ignore complex pair)
        let x: number | undefined;

        if (b * b * b * d >= a * c * c * c) {
            const da = 2 * b * d1 - a * d2;
            const s = da < 0 ? -1 : 1;
            const t0 = s * Math.abs(a) * Math.sqrt(-dt);
            const t1 = t0 + da;
            const p = Math.cbrt(0.5 * t1);
            const q = t0 === t1 ? -p : -d1 / p;
            const x1 = d1 <= 0 ? p + q : da / (p * p + q * q + d1);

            x = (x1 - b) / a;
        } else {
            const dd = d * d2 - 2 * c * d3;
            const s = dd < 0 ? -1 : 1;
            const t0 = s * Math.abs(d) * Math.sqrt(-dt);
            const t1 = t0 + dd;
            const p = Math.cbrt(0.5 * t1);
            const q = t0 === t1 ? -p : -d3 / p;
            const x1 = d3 <= 0 ? p + q : dd / (p * p + q * q + d3);

            x = -d / (x1 + c);
        }

        return { type: RootType.One, x };
    } else {
        // Three roots
        const sqrtdt = Math.sqrt(dt);
        const da = 2 * b * d1 - a * d2;
        const dd = d * d2 - 2 * c * d3;
        const ta = Math.abs(Math.atan2(a * sqrtdt, da) / 3);
        const td = Math.abs(Math.atan2(d * sqrtdt, dd) / 3);
        const sqrtca = 2 * Math.sqrt(-d1);
        const sqrtcd = 2 * Math.sqrt(-d3);
        const cosa = Math.cos(ta);
        const cosd = Math.cos(td);
        const x1a = sqrtca * cosa;
        const x1d = sqrtcd * cosd;
        const x3a = -sqrtca * (0.5 * cosa + 0.8660254037844386 * Math.sin(ta));
        const x3d = -sqrtcd * (0.5 * cosd + 0.8660254037844386 * Math.sin(td));

        const xl = x1a + x3a > 2 * b ? x1a - b : x3a - b;
        const wl = a;
        const xs = -d;
        const ws = x1d + x3d < 2 * c ? x1d + c : x3d + c;

        const e = wl * ws;
        const f = -xl * ws - wl * xs;
        const g = xl * xs;
        const xm = c * f - b * g;
        const wm = c * e - b * f;

        return { type: RootType.Three, x1: xl / wl, x2: xs / ws, x3: xm / wm };
    }
}
