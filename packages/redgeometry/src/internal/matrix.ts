/**
 * Returns the largest eigenvalue of the symmetric matrix `A`:
 * ```
 * | a11  a12 |
 * | a12  a22 |
 * ```
 * References:
 * - *Eigenvalue algorithm, 2x2 matrix*.
 *   https://en.wikipedia.org/wiki/Eigenvalue_algorithm#2%C3%972_matrices
 */
export function getMaxEigenvalueSym2x2(a11: number, a12: number, a22: number): number {
    const q = a11 + a22;
    const det = a11 * a22 - a12 * a12;

    const p = Math.sqrt(q * q - 4 * det);

    // Maximum eigenvalue of `A`
    return 0.5 * (p + q);
}

/**
 * Returns the largest eigenvalue of the symmetric matrix `A`:
 * ```
 * | a11  a12  a13|
 * | a12  a22  a23|
 * | a13  a23  a33|
 * ```
 * References:
 * - *Eigenvalue algorithm, 3x3 matrix*.
 *   https://en.wikipedia.org/wiki/Eigenvalue_algorithm#3%C3%973_matrices
 */
export function getMaxEigenvalueSym3x3(
    a11: number,
    a12: number,
    a13: number,
    a22: number,
    a23: number,
    a33: number,
): number {
    const p1 = 2 * (a12 * a12 + a13 * a13 + a23 * a23);

    if (p1 === 0) {
        return Math.max(a11, a22, a33);
    }

    const q = (a11 + a22 + a33) / 3;

    const b11 = a11 - q;
    const b22 = a22 - q;
    const b33 = a33 - q;

    const p2 = b11 * b11 + b22 * b22 + b33 * b33;
    const p = Math.sqrt((p1 + p2) / 6);

    const a = b11 * (b22 * b33 - a23 * a23);
    const b = a12 * (a12 * b33 - a13 * a23);
    const c = a13 * (a12 * a23 - a13 * b22);

    const det = a - b + c;
    const r = det / (2 * p * p * p);

    let phi;

    // Avoid underflow/overflow
    if (r >= 1) {
        phi = 0;
    } else if (r <= -1) {
        phi = Math.PI;
    } else {
        phi = Math.acos(r);
    }

    // Maximum eigenvalue of `A`
    return 2 * p * Math.cos(phi / 3) + q;
}
