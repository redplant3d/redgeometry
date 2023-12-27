import { getMaxEigenvalueSym2x2, getMaxEigenvalueSym3x3 } from "../internal/matrix.js";
import { Point2, Point3 } from "./point.js";
import { Vector2, Vector3 } from "./vector.js";

export enum MatrixType {
    Affine,
    NonAffine,
}

export type Matrix3 = Matrix3x2 | Matrix3x3;
export type Matrix4 = Matrix4x3 | Matrix4x4;

/**
 * Represents a matrix for affine transformations in 2D:
 * ```
 * | m11  m12  m13 |
 * | m21  m22  m23 |
 * |   0    0    1 |
 * ```
 */
export class Matrix3x2 {
    public readonly elements: [number, number, number, number, number, number];

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * |   0    0    1 |
     * ```
     */
    public constructor(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number) {
        this.elements = [m11, m12, m13, m21, m22, m23];
    }

    public get type(): MatrixType.Affine {
        return MatrixType.Affine;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix3x2 {
        return new Matrix3x2(1, 0, 0, 0, 1, 0);
    }

    /**
     * ```
     * | m11  m12  0 |
     * | m21  m22  0 |
     * |   0    0  1 |
     * ```
     */
    public static fromAffine(m11: number, m12: number, m21: number, m22: number): Matrix3x2 {
        return new Matrix3x2(m11, m12, 0, m21, m22, 0);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0, transpose = false): Matrix3x2 {
        const el = elements;
        const i = offset;

        // prettier-ignore
        if (transpose) {
            return new Matrix3x2(
                el[i + 0], el[i + 2], el[i + 4],
                el[i + 1], el[i + 3], el[i + 5],
            );
        } else {
            return new Matrix3x2(
                el[i + 0], el[i + 1], el[i + 2],
                el[i + 3], el[i + 4], el[i + 5],
            );
        }
    }

    /**
     * ```
     * | z11  z12  0 |
     * | z21  z22  0 |
     * |   0    0  1 |
     * ```
     */
    public static fromRotation(za: number, zb: number): Matrix3x2 {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        return new Matrix3x2(z11, z12, 0, z21, z22, 0);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number): Matrix3x2 {
        return new Matrix3x2(sx, 0, 0, 0, sy, 0);
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3x2 {
        return new Matrix3x2(1, 0, tx, 0, 1, ty);
    }

    public add(mat: Matrix3x2): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] += el2[0];
        el1[1] += el2[1];
        el1[2] += el2[2];
        el1[3] += el2[3];
        el1[4] += el2[4];
        el1[5] += el2[5];
    }

    public clone(): Matrix3x2 {
        const el = this.elements;
        return new Matrix3x2(el[0], el[1], el[2], el[3], el[4], el[5]);
    }

    public getDeterminant(): number {
        const el = this.elements;
        return el[0] * el[4] - el[1] * el[3];
    }

    public getInverse(): Matrix3x2 {
        const det = this.getDeterminant();

        if (det === 0) {
            return Matrix3x2.createIdentity();
        }

        const el = this.elements;
        const detInv = 1 / det;

        const m11 = detInv * el[4];
        const m12 = detInv * -el[1];
        const m13 = detInv * (el[1] * el[5] - el[2] * el[4]);
        const m21 = detInv * -el[3];
        const m22 = detInv * el[0];
        const m23 = detInv * (el[2] * el[3] - el[0] * el[5]);

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
    }

    public getMaxScale(): number {
        const el = this.elements;

        // Compute elements of `S^2 = M * M^T`
        const s11 = el[0] * el[0] + el[1] * el[1];
        const s12 = el[0] * el[3] + el[1] * el[4];
        const s22 = el[3] * el[3] + el[4] * el[4];

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const eig = getMaxEigenvalueSym2x2(s11, s12, s22);

        return Math.sqrt(eig);
    }

    /**
     * ```
     * | m11  m12  m13 |   | x |
     * | m21  m22  m23 | * | y |
     * |   0    0    1 |   | 1 |
     * ```
     */
    public mapPoint(p: Point2): Point2 {
        // | m11 * x + m12 * y + m13 |
        // | m21 * x + m22 * y + m23 |
        // |                       1 |
        const el = this.elements;

        const x = el[0] * p.x + el[1] * p.y + el[2];
        const y = el[3] * p.x + el[4] * p.y + el[5];

        return new Point2(x, y);
    }

    /**
     * ```
     * | m11  m12  m13 |   | x |
     * | m21  m22  m23 | * | y |
     * |   0    0    1 |   | 1 |
     * ```
     */
    public mapVector(v: Vector2): Vector2 {
        // | m11 * x + m12 * y + m13 |
        // | m21 * x + m22 * y + m23 |
        // |                       1 |
        const el = this.elements;

        const x = el[0] * v.x + el[1] * v.y + el[2];
        const y = el[3] * v.x + el[4] * v.y + el[5];

        return new Vector2(x, y);
    }

    public mul(mat: Matrix3x2): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        const m11 = el1[0] * el2[0] + el1[1] * el2[3];
        const m12 = el1[0] * el2[1] + el1[1] * el2[4];
        const m13 = el1[0] * el2[2] + el1[1] * el2[5] + el1[2];
        el1[0] = m11;
        el1[1] = m12;
        el1[2] = m13;

        const m21 = el1[3] * el2[0] + el1[4] * el2[3];
        const m22 = el1[3] * el2[1] + el1[4] * el2[4];
        const m23 = el1[3] * el2[2] + el1[4] * el2[5] + el1[5];
        el1[3] = m21;
        el1[4] = m22;
        el1[5] = m23;
    }

    /**
     * ```
     * | m11  m12  m13 |   | z11  z12  0 |
     * | m21  m22  m23 | * | z21  z22  0 |
     * | 0    0      1 |   |   0    0  1 |
     * ```
     */
    public rotatePost(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        const el = this.elements;

        const m11 = el[0] * z11 + el[1] * z21;
        const m12 = el[0] * z12 + el[1] * z22;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[3] * z11 + el[4] * z21;
        const m22 = el[3] * z12 + el[4] * z22;
        el[3] = m21;
        el[4] = m22;
    }

    /**
     * ```
     * | z11  z12  0 |   | m11  m12  m13 |
     * | z21  z22  0 | * | m21  m22  m23 |
     * |   0    0  1 |   |   0    0    1 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        const el = this.elements;

        const m11 = z11 * el[0] + z12 * el[3];
        const m21 = z21 * el[0] + z22 * el[3];
        el[0] = m11;
        el[3] = m21;

        const m12 = z11 * el[1] + z12 * el[4];
        const m22 = z21 * el[1] + z22 * el[4];
        el[1] = m12;
        el[4] = m22;

        const m13 = z11 * el[2] + z12 * el[5];
        const m23 = z21 * el[2] + z22 * el[5];
        el[2] = m13;
        el[5] = m23;
    }

    /**
     * ```
     * | z11  z12  0 |
     * | z21  z22  0 |
     * |   0    0  1 |
     * ```
     */
    public rotateSet(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        this.set(z11, z12, 0, z21, z22, 0);
    }

    /**
     * ```
     * | m11  m12  m13 |   | sx   0  0 |
     * | m21  m22  m23 | * |  0  sy  0 |
     * |   0    0    1 |   |  0   0  1 |
     * ```
     */
    public scalePost(sx: number, sy: number): void {
        // | m11 * sx  m12 * sy  m13 |
        // | m21 * sx  m22 * sy  m23 |
        // |        0         0    1 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sy;

        el[3] *= sx;
        el[4] *= sy;
    }

    /**
     * ```
     * | sx   0  0 |   | m11  m12  m13 |
     * |  0  sy  0 | * | m21  m22  m23 |
     * |  0   0  1 |   |   0    0    1 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
        // | sx * m11  sx * m12  sx * m13 |
        // | sy * m21  sy * m22  sy * m23 |
        // |        0         0         1 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sx;
        el[2] *= sx;

        el[3] *= sy;
        el[4] *= sy;
        el[5] *= sy;
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public scaleSet(sx: number, sy: number): void {
        this.set(sx, 0, 0, 0, sy, 0);
    }

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * |   0    0    1 |
     * ```
     */
    public set(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number): void {
        const el = this.elements;

        el[0] = m11;
        el[1] = m12;
        el[2] = m13;
        el[3] = m21;
        el[4] = m22;
        el[5] = m23;
    }

    /**
     * ```
     * |  1  sx  0 |
     * | sy   1  0 |
     * |  0   0  1 |
     * ```
     */
    public skewSet(sx: number, sy: number): void {
        this.set(1, sx, 0, sy, 1, 0);
    }

    public sub(mat: Matrix3x2): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] -= el2[0];
        el1[1] -= el2[1];
        el1[2] -= el2[2];
        el1[3] -= el2[3];
        el1[4] -= el2[4];
        el1[5] -= el2[5];
    }

    public toArray(transpose = false): number[] {
        const el = this.elements;

        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                el[0], el[3], 0,
                el[1], el[4], 0,
                el[2], el[5], 1,
            ];
        } else {
            // row-major order
            return [
                el[0], el[1], el[2],
                el[3], el[4], el[5],
                0, 0, 1,
            ];
        }
    }

    public toString(): string {
        const el = this.elements;

        // prettier-ignore
        return (
            `{m11: ${el[0]}, m12: ${el[1]}, m13: ${el[2]},\n` +
            ` m21: ${el[3]}, m22: ${el[4]}, m23: ${el[5]}}`
        );
    }

    /**
     * ```
     * | m11  m12  m13 |   | 1  0  tx |
     * | m21  m22  m23 | * | 0  1  ty |
     * |   0    0    1 |   | 0  0   1 |
     * ```
     */
    public translatePost(tx: number, ty: number): void {
        // | m11  m12  m11 * tx + m12 * ty + m13 |
        // | m21  m22  m21 * tx + m22 * ty + m23 |
        // |   0    0                          1 |
        const el = this.elements;

        el[2] += el[0] * tx + el[1] * ty;
        el[5] += el[3] * tx + el[4] * ty;
    }

    /**
     * ```
     * | 1  0  tx |   | m11  m12  m13 |
     * | 0  1  ty | * | m21  m22  m23 |
     * | 0  0   1 |   |   0    0    1 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        // | m11  m12  tx + m13 |
        // | m21  m22  ty + m23 |
        // |   0    0         1 |
        const el = this.elements;

        el[2] += tx;
        el[5] += ty;
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, tx, 0, 1, ty);
    }
}

/**
 * Represents a matrix for non-affine (perspective) transformations in 2D:
 * ```
 * | m11  m12  m13 |
 * | m21  m22  m23 |
 * | m31  m32  m33 |
 * ```
 */
export class Matrix3x3 {
    public readonly elements: [number, number, number, number, number, number, number, number, number];

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * | m31  m32  m33 |
     * ```
     */
    public constructor(
        m11: number,
        m12: number,
        m13: number,
        m21: number,
        m22: number,
        m23: number,
        m31: number,
        m32: number,
        m33: number,
    ) {
        this.elements = [m11, m12, m13, m21, m22, m23, m31, m32, m33];
    }

    public get type(): MatrixType.NonAffine {
        return MatrixType.NonAffine;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix3x3 {
        return new Matrix3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 0  0  0 |
     * | 0  0  0 |
     * | 0  0  0 |
     * ```
     */
    public static createZero(): Matrix3x3 {
        return new Matrix3x3(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /**
     * ```
     * | m11  m12  0 |
     * | m21  m22  0 |
     * |   0    0  1 |
     * ```
     */
    public static fromAffine(m11: number, m12: number, m21: number, m22: number): Matrix3x3 {
        return new Matrix3x3(m11, m12, 0, m21, m22, 0, 0, 0, 1);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0, transpose = false): Matrix3x3 {
        const el = elements;
        const i = offset;

        // prettier-ignore
        if (transpose) {
            return new Matrix3x3(
                el[i + 0], el[i + 3], el[i + 6],
                el[i + 1], el[i + 4], el[i + 7],
                el[i + 2], el[i + 5], el[i + 8],
            );
        } else {
            return new Matrix3x3(
                el[i + 0], el[i + 1], el[i + 2],
                el[i + 3], el[i + 4], el[i + 5],
                el[i + 6], el[i + 7], el[i + 8],
            );
        }
    }

    /**
     * ```
     * | z11  z12  0 |
     * | z21  z22  0 |
     * |   0    0  1 |
     * ```
     */
    public static fromRotation(za: number, zb: number): Matrix3x3 {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        return new Matrix3x3(z11, z12, 0, z21, z22, 0, 0, 0, 1);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number): Matrix3x3 {
        return new Matrix3x3(sx, 0, 0, 0, sy, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3x3 {
        return new Matrix3x3(1, 0, tx, 0, 1, ty, 0, 0, 1);
    }

    public add(mat: Matrix3x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] += el2[0];
        el1[1] += el2[1];
        el1[2] += el2[2];
        el1[3] += el2[3];
        el1[4] += el2[4];
        el1[5] += el2[5];
        el1[6] += el2[6];
        el1[7] += el2[7];
        el1[8] += el2[8];
    }

    public clone(): Matrix3x3 {
        const el = this.elements;
        return new Matrix3x3(el[0], el[1], el[2], el[3], el[4], el[5], el[6], el[7], el[8]);
    }

    public getDeterminant(): number {
        const el = this.elements;

        const a = el[0] * (el[4] * el[8] - el[5] * el[7]);
        const b = el[1] * (el[3] * el[8] - el[5] * el[6]);
        const c = el[2] * (el[3] * el[7] - el[4] * el[6]);

        return a - b + c;
    }

    public getInverse(): Matrix3x3 {
        const det = this.getDeterminant();

        if (det === 0) {
            return Matrix3x3.createIdentity();
        }

        const el = this.elements;
        const detInv = 1 / det;

        const m11 = detInv * (el[4] * el[8] - el[5] * el[7]);
        const m12 = detInv * (el[2] * el[7] - el[1] * el[8]);
        const m13 = detInv * (el[1] * el[5] - el[2] * el[4]);
        const m21 = detInv * (el[5] * el[6] - el[3] * el[8]);
        const m22 = detInv * (el[0] * el[8] - el[2] * el[6]);
        const m23 = detInv * (el[2] * el[3] - el[0] * el[5]);
        const m31 = detInv * (el[3] * el[7] - el[4] * el[6]);
        const m32 = detInv * (el[1] * el[6] - el[0] * el[7]);
        const m33 = detInv * (el[0] * el[4] - el[1] * el[3]);

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }

    /**
     * ```
     * | m11  m12  m13 |   | x |
     * | m21  m22  m23 | * | y |
     * | m31  m32  m33 |   | 1 |
     * ```
     */
    public mapPoint(p: Point2): Point2 {
        // | m11 * x + m12 * y + m13 |
        // | m21 * x + m22 * y + m23 |
        // | m31 * x + m32 * y + m33 |
        const el = this.elements;

        const x = el[0] * p.x + el[1] * p.y + el[2];
        const y = el[3] * p.x + el[4] * p.y + el[5];
        const w = el[6] * p.x + el[7] * p.y + el[8];

        return Point2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | m11  m12  m13 |   | x |
     * | m21  m22  m23 | * | y |
     * | m31  m32  m33 |   | 1 |
     * ```
     */
    public mapVector(v: Vector2): Vector2 {
        // | m11 * x + m12 * y + m13 |
        // | m21 * x + m22 * y + m23 |
        // | m31 * x + m32 * y + m33 |
        const el = this.elements;

        const x = el[0] * v.x + el[1] * v.y + el[2];
        const y = el[3] * v.x + el[4] * v.y + el[5];
        const w = el[6] * v.x + el[7] * v.y + el[8];

        return Vector2.fromXYW(x, y, w);
    }

    public mul(mat: Matrix3x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        const m11 = el1[0] * el2[0] + el1[1] * el2[3] + el1[2] * el2[6];
        const m12 = el1[0] * el2[1] + el1[1] * el2[4] + el1[2] * el2[7];
        const m13 = el1[0] * el2[2] + el1[1] * el2[5] + el1[2] * el2[8];
        el1[0] = m11;
        el1[1] = m12;
        el1[2] = m13;

        const m21 = el1[3] * el2[0] + el1[4] * el2[3] + el1[5] * el2[6];
        const m22 = el1[3] * el2[1] + el1[4] * el2[4] + el1[5] * el2[7];
        const m23 = el1[3] * el2[2] + el1[4] * el2[5] + el1[5] * el2[8];
        el1[3] = m21;
        el1[4] = m22;
        el1[5] = m23;

        const m31 = el1[6] * el2[0] + el1[7] * el2[3] + el1[8] * el2[6];
        const m32 = el1[6] * el2[1] + el1[7] * el2[4] + el1[8] * el2[7];
        const m33 = el1[6] * el2[2] + el1[7] * el2[5] + el1[8] * el2[8];
        el1[6] = m31;
        el1[7] = m32;
        el1[8] = m33;
    }

    /**
     * ```
     * | m11  m12  m13 |   | z11  z12  0 |
     * | m21  m22  m23 | * | z21  z22  0 |
     * | m31  m32  m33 |   |   0    0  1 |
     * ```
     */
    public rotatePost(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        const el = this.elements;

        const m11 = el[0] * z11 + el[1] * z21;
        const m12 = el[0] * z12 + el[1] * z22;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[3] * z11 + el[4] * z21;
        const m22 = el[3] * z12 + el[4] * z22;
        el[3] = m21;
        el[4] = m22;

        const m31 = el[6] * z11 + el[7] * z21;
        const m32 = el[6] * z12 + el[7] * z22;
        el[6] = m31;
        el[7] = m32;
    }

    /**
     * ```
     * | z11  z12  0 |   | m11  m12  m13 |
     * | z21  z22  0 | * | m21  m22  m23 |
     * |   0    0  1 |   | m31  m32  m33 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        const el = this.elements;

        const m11 = z11 * el[0] + z12 * el[3];
        const m21 = z21 * el[0] + z22 * el[3];
        el[0] = m11;
        el[3] = m21;

        const m12 = z11 * el[1] + z12 * el[4];
        const m22 = z21 * el[1] + z22 * el[4];
        el[1] = m12;
        el[4] = m22;

        const m13 = z11 * el[2] + z12 * el[5];
        const m23 = z21 * el[2] + z22 * el[5];
        el[2] = m13;
        el[5] = m23;
    }

    /* ```
     * | z11  z12  0 |
     * | z21  z22  0 |
     * |   0    0  1 |
     * ```
     */
    public rotateSet(za: number, zb: number): void {
        const z11 = za;
        const z12 = -zb;
        const z21 = zb;
        const z22 = za;

        this.set(z11, z12, 0, z21, z22, 0, 0, 0, 1);
    }

    /**
     * ```
     * | m11  m12  m13 |   | sx   0  0 |
     * | m21  m22  m23 | * |  0  sy  0 |
     * | m31  m32  m33 |   |  0   0  1 |
     * ```
     */
    public scalePost(sx: number, sy: number): void {
        // | m11 * sx  m12 * sy  m13 |
        // | m21 * sx  m22 * sy  m23 |
        // | m31 * sx  m32 * sy  m33 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sy;

        el[3] *= sx;
        el[4] *= sy;

        el[6] *= sx;
        el[7] *= sy;
    }

    /**
     * ```
     * | sx   0  0 |   | m11  m12  m13 |
     * |  0  sy  0 | * | m21  m22  m23 |
     * |  0   0  1 |   | m31  m32  m33 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
        // | sx * m11  sx * m12  sx * m13 |
        // | sy * m21  sy * m22  sy * m23 |
        // |      m31       m32       m33 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sx;
        el[2] *= sx;

        el[3] *= sy;
        el[4] *= sy;
        el[5] *= sy;
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public scaleSet(sx: number, sy: number): void {
        this.set(sx, 0, 0, 0, sy, 0, 0, 0, 1);
    }

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * | m31  m32  m33 |
     * ```
     */
    public set(
        m11: number,
        m12: number,
        m13: number,
        m21: number,
        m22: number,
        m23: number,
        m31: number,
        m32: number,
        m33: number,
    ): void {
        const el = this.elements;

        el[0] = m11;
        el[1] = m12;
        el[2] = m13;
        el[3] = m21;
        el[4] = m22;
        el[5] = m23;
        el[6] = m31;
        el[7] = m32;
        el[8] = m33;
    }

    /**
     * ```
     * |  1  sx  0 |
     * | sy   1  0 |
     * |  0   0  1 |
     * ```
     */
    public skewSet(sx: number, sy: number): void {
        this.set(1, sx, 0, sy, 1, 0, 0, 0, 1);
    }

    public sub(mat: Matrix3x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] -= el2[0];
        el1[1] -= el2[1];
        el1[2] -= el2[2];
        el1[3] -= el2[3];
        el1[4] -= el2[4];
        el1[5] -= el2[5];
        el1[6] -= el2[6];
        el1[7] -= el2[7];
        el1[8] -= el2[8];
    }

    public toArray(transpose = false): number[] {
        const el = this.elements;

        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                el[0], el[3], el[6],
                el[1], el[4], el[7],
                el[2], el[5], el[8],
            ];
        } else {
            // row-major order
            return [
                el[0], el[1], el[2],
                el[3], el[4], el[5],
                el[6], el[7], el[8],
            ];
        }
    }

    public toString(): string {
        const el = this.elements;

        return (
            `{m11: ${el[0]}, m12: ${el[1]}, m13: ${el[2]},\n` +
            ` m21: ${el[3]}, m22: ${el[4]}, m23: ${el[5]},\n` +
            ` m31: ${el[6]}, m32: ${el[7]}, m33: ${el[8]}}`
        );
    }

    /**
     * ```
     * | m11  m12  m13 |   | 1  0  tx |
     * | m21  m22  m23 | * | 0  1  ty |
     * | m31  m32  m33 |   | 0  0   1 |
     * ```
     */
    public translatePost(tx: number, ty: number): void {
        // | m11  m12  m11 * tx + m12 * ty + m13 |
        // | m21  m22  m21 * tx + m22 * ty + m23 |
        // | m31  m32  m31 * tx + m32 * ty + m33 |
        const el = this.elements;

        el[2] += el[0] * tx + el[1] * ty;
        el[5] += el[3] * tx + el[4] * ty;
        el[8] += el[6] * tx + el[7] * ty;
    }

    /**
     * ```
     * | 1  0  tx |   | m11  m12  m13 |
     * | 0  1  ty | * | m21  m22  m23 |
     * | 0  0   1 |   | m31  m32  m33 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        // | m11 + tx * m31  m12 + tx * m32  m13 + tx * m33 |
        // | m21 + ty * m31  m22 + ty * m32  m23 + ty * m33 |
        // |            m31             m32             m33 |
        const el = this.elements;

        el[0] += el[6] * tx;
        el[1] += el[7] * tx;
        el[2] += el[8] * tx;

        el[3] += el[6] * ty;
        el[4] += el[7] * ty;
        el[5] += el[8] * ty;
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, tx, 0, 1, ty, 0, 0, 1);
    }
}

/**
 * Represents a matrix for affine transformations in 3D:
 * ```
 * | m11  m12  m13  m14 |
 * | m21  m22  m23  m24 |
 * | m31  m32  m33  m34 |
 * |   0    0    0    1 |
 * ```
 */
export class Matrix4x3 {
    public readonly elements: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
    ];

    /**
     * ```
     * | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |
     * |   0    0    0    1 |
     * ```
     */
    public constructor(
        m11: number,
        m12: number,
        m13: number,
        m14: number,
        m21: number,
        m22: number,
        m23: number,
        m24: number,
        m31: number,
        m32: number,
        m33: number,
        m34: number,
    ) {
        this.elements = [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34];
    }

    public get type(): MatrixType.Affine {
        return MatrixType.Affine;
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix4x3 {
        return new Matrix4x3(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0);
    }

    /**
     * ```
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * ```
     */
    public static createZero(): Matrix4x3 {
        return new Matrix4x3(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /**
     * ```
     * | m11  m12  m13  0 |
     * | m21  m22  m23  0 |
     * | m31  m32  m33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public static fromAffine(
        m11: number,
        m12: number,
        m13: number,
        m21: number,
        m22: number,
        m23: number,
        m31: number,
        m32: number,
        m33: number,
    ): Matrix4x3 {
        return new Matrix4x3(m11, m12, m13, 0, m21, m22, m23, 0, m31, m32, m33, 0);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0, transpose = false): Matrix4x3 {
        const el = elements;
        const i = offset;

        // prettier-ignore
        if (transpose) {
            return new Matrix4x3(
                el[i + 0], el[i + 4], el[i + 8], el[i + 12],
                el[i + 1], el[i + 5], el[i + 9], el[i + 13],
                el[i + 2], el[i + 6], el[i + 10], el[i + 14],
            );
        } else {
            return new Matrix4x3(
                el[i + 0], el[i + 1], el[i + 2], el[i + 3],
                el[i + 4], el[i + 5], el[i + 6],  el[i + 7],
                el[i + 8], el[i + 9], el[i + 10], el[i + 11],
            );
        }
    }

    /**
     * ```
     * | q11  q12  q13  0 |
     * | q21  q22  q23  0 |
     * | q31  q32  q33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public static fromRotation(qa: number, qb: number, qc: number, qd: number): Matrix4x3 {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        return new Matrix4x3(q11, q12, q13, 0, q21, q22, q23, 0, q31, q32, q33, 0);
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number, sz: number): Matrix4x3 {
        return new Matrix4x3(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0);
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4x3 {
        return new Matrix4x3(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz);
    }

    public add(mat: Matrix4x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] += el2[0];
        el1[1] += el2[1];
        el1[2] += el2[2];
        el1[3] += el2[3];
        el1[4] += el2[4];
        el1[5] += el2[5];
        el1[6] += el2[6];
        el1[7] += el2[7];
        el1[8] += el2[8];
        el1[9] += el2[9];
        el1[10] += el2[10];
        el1[11] += el2[11];
    }

    public clone(): Matrix4x3 {
        const el = this.elements;
        return new Matrix4x3(el[0], el[1], el[2], el[3], el[4], el[5], el[6], el[7], el[8], el[9], el[10], el[11]);
    }

    public getMaxScale(): number {
        const el = this.elements;

        // Compute elements of `S^2 = M * M^T`
        const s11 = el[0] * el[0] + el[1] * el[1] + el[2] * el[2];
        const s12 = el[0] * el[4] + el[1] * el[5] + el[2] * el[6];
        const s13 = el[0] * el[8] + el[1] * el[9] + el[2] * el[10];
        const s22 = el[4] * el[4] + el[5] * el[5] + el[6] * el[6];
        const s23 = el[4] * el[8] + el[5] * el[9] + el[6] * el[10];
        const s33 = el[8] * el[8] + el[9] * el[9] + el[10] * el[10];

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const eig = getMaxEigenvalueSym3x3(s11, s12, s13, s22, s23, s33);

        return Math.sqrt(eig);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | x |
     * | m21  m22  m23  m24 | * | y |
     * | m31  m32  m33  m34 |   | z |
     * |   0    0    0    1 |   | 1 |
     * ```
     */
    public mapPoint(p: Point3): Point3 {
        // | m11 * x + m12 * y + m13 * z + m14 |
        // | m21 * x + m22 * y + m23 * z + m24 |
        // | m31 * x + m32 * y + m33 * z + m34 |
        // |                                 1 |
        const el = this.elements;

        const x = el[0] * p.x + el[1] * p.y + el[2] * p.z + el[3];
        const y = el[4] * p.x + el[5] * p.y + el[6] * p.z + el[7];
        const z = el[8] * p.x + el[9] * p.y + el[10] * p.z + el[11];

        return new Point3(x, y, z);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | x |
     * | m21  m22  m23  m24 | * | y |
     * | m31  m32  m33  m34 |   | z |
     * |   0    0    0    1 |   | 1 |
     * ```
     */
    public mapVector(v: Vector3): Vector3 {
        // | m11 * x + m12 * y + m13 * z + m14 |
        // | m21 * x + m22 * y + m23 * z + m24 |
        // | m31 * x + m32 * y + m33 * z + m34 |
        // |                                 1 |
        const el = this.elements;

        const x = el[0] * v.x + el[1] * v.y + el[2] * v.z + el[3];
        const y = el[4] * v.x + el[5] * v.y + el[6] * v.z + el[7];
        const z = el[8] * v.x + el[9] * v.y + el[10] * v.z + el[11];

        return new Vector3(x, y, z);
    }

    public mul(mat: Matrix4x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        const m11 = el1[0] * el2[0] + el1[1] * el2[4] + el1[2] * el2[8];
        const m12 = el1[0] * el2[1] + el1[1] * el2[5] + el1[2] * el2[9];
        const m13 = el1[0] * el2[2] + el1[1] * el2[6] + el1[2] * el2[10];
        const m14 = el1[0] * el2[3] + el1[1] * el2[7] + el1[2] * el2[11] + el1[3];
        el1[0] = m11;
        el1[1] = m12;
        el1[2] = m13;
        el1[3] = m14;

        const m21 = el1[4] * el2[0] + el1[5] * el2[4] + el1[6] * el2[8];
        const m22 = el1[4] * el2[1] + el1[5] * el2[5] + el1[6] * el2[9];
        const m23 = el1[4] * el2[2] + el1[5] * el2[6] + el1[6] * el2[10];
        const m24 = el1[4] * el2[3] + el1[5] * el2[7] + el1[6] * el2[11] + el1[7];
        el1[4] = m21;
        el1[5] = m22;
        el1[6] = m23;
        el1[7] = m24;

        const m31 = el1[8] * el2[0] + el1[9] * el2[4] + el1[10] * el2[8];
        const m32 = el1[8] * el2[1] + el1[9] * el2[5] + el1[10] * el2[9];
        const m33 = el1[8] * el2[2] + el1[9] * el2[6] + el1[10] * el2[10];
        const m34 = el1[8] * el2[3] + el1[9] * el2[7] + el1[10] * el2[11] + el1[11];
        el1[8] = m31;
        el1[9] = m32;
        el1[10] = m33;
        el1[11] = m34;
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | q11  q12  q13  0 |
     * | m21  m22  m23  m24 | * | q21  q22  q23  0 |
     * | m31  m32  m33  m34 |   | q31  q32  q33  0 |
     * |   0    0    0    1 |   |   0    0    0  1 |
     * ```
     */
    public rotatePost(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        const el = this.elements;

        const m11 = el[0] * q11 + el[1] * q21 + el[2] * q31;
        const m12 = el[0] * q12 + el[1] * q22 + el[2] * q32;
        const m13 = el[0] * q13 + el[1] * q23 + el[2] * q33;
        el[0] = m11;
        el[1] = m12;
        el[2] = m13;

        const m21 = el[4] * q11 + el[5] * q21 + el[6] * q31;
        const m22 = el[4] * q12 + el[5] * q22 + el[6] * q32;
        const m23 = el[4] * q13 + el[5] * q23 + el[6] * q33;
        el[4] = m21;
        el[5] = m22;
        el[6] = m23;

        const m31 = el[8] * q11 + el[9] * q21 + el[10] * q31;
        const m32 = el[8] * q12 + el[9] * q22 + el[10] * q32;
        const m33 = el[8] * q13 + el[9] * q23 + el[10] * q33;
        el[8] = m31;
        el[9] = m32;
        el[10] = m33;
    }

    /**
     * ```
     * | q11  q12  q13  0 |   | m11  m12  m13  m14 |
     * | q21  q22  q23  0 | * | m21  m22  m23  m24 |
     * | q31  q32  q33  0 |   | m31  m32  m33  m34 |
     * |   0    0    0  1 |   |   0    0    0    1 |
     * ```
     */
    public rotatePre(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        const el = this.elements;

        const m11 = q11 * el[0] + q12 * el[4] + q13 * el[8];
        const m21 = q21 * el[0] + q22 * el[4] + q23 * el[8];
        const m31 = q31 * el[0] + q32 * el[4] + q33 * el[8];
        el[0] = m11;
        el[4] = m21;
        el[8] = m31;

        const m12 = q11 * el[1] + q12 * el[5] + q13 * el[9];
        const m22 = q21 * el[1] + q22 * el[5] + q23 * el[9];
        const m32 = q31 * el[1] + q32 * el[5] + q33 * el[9];
        el[1] = m12;
        el[5] = m22;
        el[9] = m32;

        const m13 = q11 * el[2] + q12 * el[6] + q13 * el[10];
        const m23 = q21 * el[2] + q22 * el[6] + q23 * el[10];
        const m33 = q31 * el[2] + q32 * el[6] + q33 * el[10];
        el[2] = m13;
        el[6] = m23;
        el[10] = m33;

        const m14 = q11 * el[3] + q12 * el[7] + q13 * el[11];
        const m24 = q21 * el[3] + q22 * el[7] + q23 * el[11];
        const m34 = q31 * el[3] + q32 * el[7] + q33 * el[11];
        el[3] = m14;
        el[7] = m24;
        el[11] = m34;
    }

    /**
     * ```
     * | q11  q12  q13  0 |
     * | q21  q22  q23  0 |
     * | q31  q32  q33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public rotateSet(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        this.set(q11, q12, q13, 0, q21, q22, q23, 0, q31, q32, q33, 0);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | cos  -sin  0  0 |
     * | m21  m22  m23  m24 | * | sin   cos  0  0 |
     * | m31  m32  m33  m34 |   |   0     0  1  0 |
     * |   0    0    0    1 |   |   0     0  0  1 |
     * ```
     */
    public scalePost(sx: number, sy: number, sz: number): void {
        // | m11 * sx  m12 * sy  m13 * sz  m14 |
        // | m21 * sx  m22 * sy  m23 * sz  m24 |
        // | m31 * sx  m32 * sy  m33 * sz  m34 |
        // |        0         0         0    1 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sy;
        el[2] *= sz;

        el[4] *= sx;
        el[5] *= sy;
        el[6] *= sz;

        el[8] *= sx;
        el[9] *= sy;
        el[10] *= sz;
    }

    /**
     * ```
     * | sx   0   0  0 |   | m11  m12  m13  m14 |
     * |  0  sy   0  0 | * | m21  m22  m23  m24 |
     * |  0   0  sz  0 |   | m31  m32  m33  m34 |
     * |  0   0   0  1 |   |   0    0    0    1 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
        // | sx * m11  sx * m12  sx * m13  sx * m14 |
        // | sy * m21  sy * m22  sy * m23  sy * m24 |
        // | sz * m31  sz * m32  sz * m33  sz * m34 |
        // |        0         0         0         1 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sx;
        el[2] *= sx;
        el[3] *= sx;

        el[4] *= sy;
        el[5] *= sy;
        el[6] *= sy;
        el[7] *= sy;

        el[8] *= sz;
        el[9] *= sz;
        el[10] *= sz;
        el[11] *= sz;
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public scaleSet(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |
     * |   0    0    0    1 |
     * ```
     */
    public set(
        m11: number,
        m12: number,
        m13: number,
        m14: number,
        m21: number,
        m22: number,
        m23: number,
        m24: number,
        m31: number,
        m32: number,
        m33: number,
        m34: number,
    ): void {
        const el = this.elements;

        el[0] = m11;
        el[1] = m12;
        el[2] = m13;
        el[3] = m14;
        el[4] = m21;
        el[5] = m22;
        el[6] = m23;
        el[7] = m24;
        el[8] = m31;
        el[9] = m32;
        el[10] = m33;
        el[11] = m34;
    }

    public sub(mat: Matrix4x3): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] -= el2[0];
        el1[1] -= el2[1];
        el1[2] -= el2[2];
        el1[3] -= el2[3];
        el1[4] -= el2[4];
        el1[5] -= el2[5];
        el1[6] -= el2[6];
        el1[7] -= el2[7];
        el1[8] -= el2[8];
        el1[9] -= el2[9];
        el1[10] -= el2[10];
        el1[11] -= el2[11];
    }

    public toArray(transpose = false): number[] {
        const el = this.elements;

        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                el[0], el[4], el[8], 0,
                el[1], el[5], el[9], 0,
                el[2], el[6], el[10], 0,
                el[3], el[7], el[11], 1,
            ];
        } else {
            // row-major order
            return [
                el[0], el[1], el[2], el[3],
                el[4], el[5], el[6], el[7],
                el[8], el[9], el[10], el[11],
                0, 0, 0, 1,
            ];
        }
    }

    public toString(): string {
        const el = this.elements;

        return (
            `{m11: ${el[0]}, m12: ${el[1]}, m13: ${el[2]}, m14: ${el[3]},\n` +
            ` m21: ${el[4]}, m22: ${el[5]}, m23: ${el[6]}, m24: ${el[7]},\n` +
            ` m31: ${el[8]}, m32: ${el[9]}, m33: ${el[10]}, m34: ${el[11]}`
        );
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | 1  0  0  tx |
     * | m21  m22  m23  m24 | * | 0  1  0  ty |
     * | m31  m32  m33  m34 |   | 0  0  1  tz |
     * |   0    0    0    1 |   | 0  0  0   1 |
     * ```
     */
    public translatePost(tx: number, ty: number, tz: number): void {
        // | m11  m12  m13  m11 * tx + m12 * ty + m13 * tz + m14 |
        // | m21  m22  m23  m21 * tx + m22 * ty + m23 * tz + m24 |
        // | m31  m32  m33  m31 * tx + m32 * ty + m33 * tz + m34 |
        // |   0    0    0                                     1 |
        const el = this.elements;

        el[3] += el[0] * tx + el[1] * ty + el[2] * tz;
        el[7] += el[4] * tx + el[5] * ty + el[6] * tz;
        el[11] += el[8] * tx + el[9] * ty + el[10] * tz;
    }

    /**
     * ```
     * | 1  0  0  tx |   | m11  m12  m13  m14 |
     * | 0  1  0  ty | * | m21  m22  m23  m24 |
     * | 0  0  1  tz |   | m31  m32  m33  m34 |
     * | 0  0  0   1 |   |   0    0    0    1 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        // | m11  m42  m43  m14 + tx |
        // | m21  m42  m43  m24 + ty |
        // | m31  m42  m43  m34 + tz |
        // |   0    0    0         1 |
        const el = this.elements;

        el[3] += tx;
        el[7] += ty;
        el[11] += tz;
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public translateSet(tx: number, ty: number, tz: number): void {
        this.set(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz);
    }
}

/**
 * Represents a matrix for non-affine (perspective) transformations in 3D:
 * ```
 * | m11  m12  m13  m14 |
 * | m21  m22  m23  m24 |
 * | m31  m32  m33  m34 |
 * | m41  m42  m43  m44 |
 * ```
 */
export class Matrix4x4 {
    public readonly elements: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
    ];

    /**
     * ```
     * | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |
     * | m41  m42  m43  m44 |
     * ```
     */
    public constructor(
        m11: number,
        m12: number,
        m13: number,
        m14: number,
        m21: number,
        m22: number,
        m23: number,
        m24: number,
        m31: number,
        m32: number,
        m33: number,
        m34: number,
        m41: number,
        m42: number,
        m43: number,
        m44: number,
    ) {
        this.elements = [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44];
    }

    public get type(): MatrixType.NonAffine {
        return MatrixType.NonAffine;
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix4x4 {
        return new Matrix4x4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * ```
     */
    public static createZero(): Matrix4x4 {
        return new Matrix4x4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /**
     * ```
     * | m11  m12  m13  0 |
     * | m21  m22  m23  0 |
     * | m31  m32  m33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public static fromAffine(
        m11: number,
        m12: number,
        m13: number,
        m21: number,
        m22: number,
        m23: number,
        m31: number,
        m32: number,
        m33: number,
    ): Matrix4x4 {
        return new Matrix4x4(m11, m12, m13, 0, m21, m22, m23, 0, m31, m32, m33, 0, 0, 0, 0, 1);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0, transpose = false): Matrix4x4 {
        const el = elements;
        const i = offset;

        // prettier-ignore
        if (transpose) {
            return new Matrix4x4(
                el[i + 0], el[i + 4], el[i + 8], el[i + 12],
                el[i + 1], el[i + 5], el[i + 9], el[i + 13],
                el[i + 2], el[i + 6], el[i + 10], el[i + 14],
                el[i + 3], el[i + 7], el[i + 11], el[i + 15],
            );
        } else {
            return new Matrix4x4(
                el[i + 0], el[i + 1], el[i + 2], el[i + 3],
                el[i + 4], el[i + 5], el[i + 6],  el[i + 7],
                el[i + 8], el[i + 9], el[i + 10], el[i + 11],
                el[i + 12], el[i + 13], el[i + 14], el[i + 15],
            );
        }
    }

    public static fromOrthographic(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number,
    ): Matrix4x4 {
        // OpenGL orthographic projection matrix
        const w = right - left;
        const h = top - bottom;
        const d = far - near;

        // | m11    0    0  m14 |
        // |   0  m22    0  m24 |
        // |   0    0  m33  m34 |
        // |   0    0    0    1 |
        const m11 = 2 / w;
        const m14 = -(right + left) / w;
        const m22 = 2 / h;
        const m24 = -(top + bottom) / h;
        const m33 = -2 / d;
        const m34 = -(far + near) / d;

        return new Matrix4x4(m11, 0, 0, m14, 0, m22, 0, m24, 0, 0, m33, m34, 0, 0, 0, 1);
    }

    public static fromPerspective(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number,
    ): Matrix4x4 {
        // OpenGL perspective projection matrix
        const w = right - left;
        const h = top - bottom;
        const d = far - near;

        // | m11    0  m13    0 |
        // |   0  m22  m23    0 |
        // |   0    0  m33  m34 |
        // |   0    0   -1    0 |
        const m11 = (2 * near) / w;
        const m13 = (right + left) / w;
        const m22 = (2 * near) / h;
        const m23 = (top + bottom) / h;
        const m33 = (near + far) / d;
        const m34 = (2 * near * far) / d;

        return new Matrix4x4(m11, 0, m13, 0, 0, m22, m23, 0, 0, 0, m33, m34, 0, 0, -1, 0);
    }

    public static fromPerspectiveFrustum(fovy: number, aspect: number, near: number, far: number): Matrix4x4 {
        const top = near * Math.tan(fovy * (Math.PI / 360));
        const height = 2 * top;
        const width = aspect * height;
        const left = -0.5 * width;

        return Matrix4x4.fromPerspective(left, left + width, top, top - height, near, far);
    }

    /**
     * ```
     * | q11  q12  q13  0 |
     * | q21  q22  q23  0 |
     * | q31  q32  q33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public static fromRotation(qa: number, qb: number, qc: number, qd: number): Matrix4x4 {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        return new Matrix4x4(q11, q12, q13, 0, q21, q22, q23, 0, q31, q32, q33, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number, sz: number): Matrix4x4 {
        return new Matrix4x4(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4x4 {
        return new Matrix4x4(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1);
    }

    public add(mat: Matrix4x4): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] += el2[0];
        el1[1] += el2[1];
        el1[2] += el2[2];
        el1[3] += el2[3];
        el1[4] += el2[4];
        el1[5] += el2[5];
        el1[6] += el2[6];
        el1[7] += el2[7];
        el1[8] += el2[8];
        el1[9] += el2[9];
        el1[10] += el2[10];
        el1[11] += el2[11];
        el1[12] += el2[12];
        el1[13] += el2[13];
        el1[14] += el2[14];
        el1[15] += el2[15];
    }

    public clone(): Matrix4x4 {
        const el = this.elements;
        return new Matrix4x4(
            el[0],
            el[1],
            el[2],
            el[3],
            el[4],
            el[5],
            el[6],
            el[7],
            el[8],
            el[9],
            el[10],
            el[11],
            el[12],
            el[13],
            el[14],
            el[15],
        );
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | x |
     * | m21  m22  m23  m24 | * | y |
     * | m31  m32  m33  m34 |   | z |
     * | m41  m42  m43  m44 |   | 1 |
     * ```
     */
    public mapPoint(p: Point3): Point3 {
        // | m11 * x + m12 * y + m13 * z + m14 |
        // | m21 * x + m22 * y + m23 * z + m24 |
        // | m31 * x + m32 * y + m33 * z + m34 |
        // | m41 * x + m42 * y + m43 * z + m44 |
        const el = this.elements;

        const x = el[0] * p.x + el[1] * p.y + el[2] * p.z + el[3];
        const y = el[4] * p.x + el[5] * p.y + el[6] * p.z + el[7];
        const z = el[8] * p.x + el[9] * p.y + el[10] * p.z + el[11];
        const w = el[12] * p.x + el[13] * p.y + el[14] * p.z + el[15];

        return Point3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | x |
     * | m21  m22  m23  m24 | * | y |
     * | m31  m32  m33  m34 |   | z |
     * | m41  m42  m43  m44 |   | 1 |
     * ```
     */
    public mapVector(v: Vector3): Vector3 {
        // | m11 * x + m12 * y + m13 * z + m14 |
        // | m21 * x + m22 * y + m23 * z + m24 |
        // | m31 * x + m32 * y + m33 * z + m34 |
        // | m41 * x + m42 * y + m43 * z + m44 |
        const el = this.elements;

        const x = el[0] * v.x + el[1] * v.y + el[2] * v.z + el[3];
        const y = el[4] * v.x + el[5] * v.y + el[6] * v.z + el[7];
        const z = el[8] * v.x + el[9] * v.y + el[10] * v.z + el[11];
        const w = el[12] * v.x + el[13] * v.y + el[14] * v.z + el[15];

        return Vector3.fromXYZW(x, y, z, w);
    }

    public mul(mat: Matrix4x4): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        const m11 = el1[0] * el2[0] + el1[1] * el2[4] + el1[2] * el2[8] + el1[3] * el2[12];
        const m12 = el1[0] * el2[1] + el1[1] * el2[5] + el1[2] * el2[9] + el1[3] * el2[13];
        const m13 = el1[0] * el2[2] + el1[1] * el2[6] + el1[2] * el2[10] + el1[3] * el2[14];
        const m14 = el1[0] * el2[3] + el1[1] * el2[7] + el1[2] * el2[11] + el1[3] * el2[15];
        el1[0] = m11;
        el1[1] = m12;
        el1[2] = m13;
        el1[3] = m14;

        const m21 = el1[4] * el2[0] + el1[5] * el2[4] + el1[6] * el2[8] + el1[7] * el2[12];
        const m22 = el1[4] * el2[1] + el1[5] * el2[5] + el1[6] * el2[9] + el1[7] * el2[13];
        const m23 = el1[4] * el2[2] + el1[5] * el2[6] + el1[6] * el2[10] + el1[7] * el2[14];
        const m24 = el1[4] * el2[3] + el1[5] * el2[7] + el1[6] * el2[11] + el1[7] * el2[15];
        el1[4] = m21;
        el1[5] = m22;
        el1[6] = m23;
        el1[7] = m24;

        const m31 = el1[8] * el2[0] + el1[9] * el2[4] + el1[10] * el2[8] + el1[11] * el2[12];
        const m32 = el1[8] * el2[1] + el1[9] * el2[5] + el1[10] * el2[9] + el1[11] * el2[13];
        const m33 = el1[8] * el2[2] + el1[9] * el2[6] + el1[10] * el2[10] + el1[11] * el2[14];
        const m34 = el1[8] * el2[3] + el1[9] * el2[7] + el1[10] * el2[11] + el1[11] * el2[15];
        el1[8] = m31;
        el1[9] = m32;
        el1[10] = m33;
        el1[11] = m34;

        const m41 = el1[12] * el2[0] + el1[13] * el2[4] + el1[14] * el2[8] + el1[15] * el2[12];
        const m42 = el1[12] * el2[1] + el1[13] * el2[5] + el1[14] * el2[9] + el1[15] * el2[13];
        const m43 = el1[12] * el2[2] + el1[13] * el2[6] + el1[14] * el2[10] + el1[15] * el2[14];
        const m44 = el1[12] * el2[3] + el1[13] * el2[7] + el1[14] * el2[11] + el1[15] * el2[15];
        el1[12] = m41;
        el1[13] = m42;
        el1[14] = m43;
        el1[15] = m44;
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | q11  q12  q13  0 |
     * | m21  m22  m23  m24 | * | q21  q22  q23  0 |
     * | m31  m32  m33  m34 |   | q31  q32  q33  0 |
     * | m41  m42  m43  m44 |   |   0    0    0  1 |
     * ```
     */
    public rotatePost(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        const el = this.elements;

        const m11 = el[0] * q11 + el[1] * q21 + el[2] * q31;
        const m12 = el[0] * q12 + el[1] * q22 + el[2] * q32;
        const m13 = el[0] * q13 + el[1] * q23 + el[2] * q33;
        el[0] = m11;
        el[1] = m12;
        el[2] = m13;

        const m21 = el[4] * q11 + el[5] * q21 + el[6] * q31;
        const m22 = el[4] * q12 + el[5] * q22 + el[6] * q32;
        const m23 = el[4] * q13 + el[5] * q23 + el[6] * q33;
        el[4] = m21;
        el[5] = m22;
        el[6] = m23;

        const m31 = el[8] * q11 + el[9] * q21 + el[10] * q31;
        const m32 = el[8] * q12 + el[9] * q22 + el[10] * q32;
        const m33 = el[8] * q13 + el[9] * q23 + el[10] * q33;
        el[8] = m31;
        el[9] = m32;
        el[10] = m33;

        const m41 = el[12] * q11 + el[13] * q21 + el[14] * q31;
        const m42 = el[12] * q12 + el[13] * q22 + el[14] * q32;
        const m43 = el[12] * q13 + el[13] * q23 + el[14] * q33;
        el[12] = m41;
        el[13] = m42;
        el[14] = m43;
    }

    /**
     * ```
     * | q11  q12  q13  0 |   | m11  m12  m13  m14 |
     * | q21  q22  q23  0 | * | m21  m22  m23  m24 |
     * | q31  q32  q33  0 |   | m31  m32  m33  m34 |
     * |   0    0    0  1 |   | m41  m42  m43  m44 |
     * ```
     */
    public rotatePre(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        const el = this.elements;

        const m11 = q11 * el[0] + q12 * el[4] + q13 * el[8];
        const m21 = q21 * el[0] + q22 * el[4] + q23 * el[8];
        const m31 = q31 * el[0] + q32 * el[4] + q33 * el[8];
        el[0] = m11;
        el[4] = m21;
        el[8] = m31;

        const m12 = q11 * el[1] + q12 * el[5] + q13 * el[9];
        const m22 = q21 * el[1] + q22 * el[5] + q23 * el[9];
        const m32 = q31 * el[1] + q32 * el[5] + q33 * el[9];
        el[1] = m12;
        el[5] = m22;
        el[9] = m32;

        const m13 = q11 * el[2] + q12 * el[6] + q13 * el[10];
        const m23 = q21 * el[2] + q22 * el[6] + q23 * el[10];
        const m33 = q31 * el[2] + q32 * el[6] + q33 * el[10];
        el[2] = m13;
        el[6] = m23;
        el[10] = m33;

        const m14 = q11 * el[3] + q12 * el[7] + q13 * el[11];
        const m24 = q21 * el[3] + q22 * el[7] + q23 * el[11];
        const m34 = q31 * el[3] + q32 * el[7] + q33 * el[11];
        el[3] = m14;
        el[7] = m24;
        el[11] = m34;
    }

    /**
     * ```
     * | q11  q12  q13  0 |
     * | q21  q22  q23  0 |
     * | q31  q32  q33  0 |
     * |   0    0    0  1 |
     * ```
     */
    public rotateSet(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q11 = qaa + qbb - qcc - qdd;
        const q22 = qaa - qbb + qcc - qdd;
        const q33 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q12 = qbc + qbc - qad - qad;
        const q21 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q13 = qbd + qbd + qac + qac;
        const q31 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q23 = qcd + qcd - qab - qab;
        const q32 = qcd + qcd + qab + qab;

        this.set(q11, q12, q13, 0, q21, q22, q23, 0, q31, q32, q33, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | cos  -sin  0  0 |
     * | m21  m22  m23  m24 | * | sin   cos  0  0 |
     * | m31  m32  m33  m34 |   |   0     0  1  0 |
     * | m41  m42  m43  m44 |   |   0     0  0  1 |
     * ```
     */
    public scalePost(sx: number, sy: number, sz: number): void {
        // | m11 * sx  m12 * sy  m13 * sz  m14 |
        // | m21 * sx  m22 * sy  m23 * sz  m24 |
        // | m31 * sx  m32 * sy  m33 * sz  m34 |
        // | m41 * sx  m42 * sy  m43 * sz  m44 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sy;
        el[2] *= sz;

        el[4] *= sx;
        el[5] *= sy;
        el[6] *= sz;

        el[8] *= sx;
        el[9] *= sy;
        el[10] *= sz;

        el[12] *= sx;
        el[13] *= sy;
        el[14] *= sz;
    }

    /**
     * ```
     * | sx   0   0  0 |   | m11  m12  m13  m14 |
     * |  0  sy   0  0 | * | m21  m22  m23  m24 |
     * |  0   0  sz  0 |   | m31  m32  m33  m34 |
     * |  0   0   0  1 |   | m41  m42  m43  m44 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
        // | sx * m11  sx * m12  sx * m13  sx * m14 |
        // | sy * m21  sy * m22  sy * m23  sy * m24 |
        // | sz * m31  sz * m32  sz * m33  sz * m34 |
        // |      m41       m42       m43       m44 |
        const el = this.elements;

        el[0] *= sx;
        el[1] *= sx;
        el[2] *= sx;
        el[3] *= sx;

        el[4] *= sy;
        el[5] *= sy;
        el[6] *= sy;
        el[7] *= sy;

        el[8] *= sz;
        el[9] *= sz;
        el[10] *= sz;
        el[11] *= sz;
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public scaleSet(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |
     * | m41  m42  m43  m44 |
     * ```
     */
    public set(
        m11: number,
        m12: number,
        m13: number,
        m14: number,
        m21: number,
        m22: number,
        m23: number,
        m24: number,
        m31: number,
        m32: number,
        m33: number,
        m34: number,
        m41: number,
        m42: number,
        m43: number,
        m44: number,
    ): void {
        const el = this.elements;

        el[0] = m11;
        el[1] = m12;
        el[2] = m13;
        el[3] = m14;
        el[4] = m21;
        el[5] = m22;
        el[6] = m23;
        el[7] = m24;
        el[8] = m31;
        el[9] = m32;
        el[10] = m33;
        el[11] = m34;
        el[12] = m41;
        el[13] = m42;
        el[14] = m43;
        el[15] = m44;
    }

    public sub(mat: Matrix4x4): void {
        const el1 = this.elements;
        const el2 = mat.elements;

        el1[0] -= el2[0];
        el1[1] -= el2[1];
        el1[2] -= el2[2];
        el1[3] -= el2[3];
        el1[4] -= el2[4];
        el1[5] -= el2[5];
        el1[6] -= el2[6];
        el1[7] -= el2[7];
        el1[8] -= el2[8];
        el1[9] -= el2[9];
        el1[10] -= el2[10];
        el1[11] -= el2[11];
        el1[12] -= el2[12];
        el1[13] -= el2[13];
        el1[14] -= el2[14];
        el1[15] -= el2[15];
    }

    public toArray(transpose = false): number[] {
        const el = this.elements;

        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                el[0], el[4], el[8], el[12],
                el[1], el[5], el[9], el[13],
                el[2], el[6], el[10], el[14],
                el[3], el[7], el[11], el[15],
            ];
        } else {
            // row-major order
            return [
                el[0], el[1], el[2], el[3],
                el[4], el[5], el[6], el[7],
                el[8], el[9], el[10], el[11],
                el[12], el[13], el[14], el[15],
            ];
        }
    }

    public toString(): string {
        const el = this.elements;

        return (
            `{m11: ${el[0]}, m12: ${el[1]}, m13: ${el[2]}, m14: ${el[3]},\n` +
            ` m21: ${el[4]}, m22: ${el[5]}, m23: ${el[6]}, m24: ${el[7]},\n` +
            ` m31: ${el[8]}, m32: ${el[9]}, m33: ${el[10]}, m34: ${el[11]},\n` +
            ` m41: ${el[12]}, m42: ${el[13]}, m43: ${el[14]}, m44: ${el[15]}}`
        );
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | 1  0  0  tx |
     * | m21  m22  m23  m24 | * | 0  1  0  ty |
     * | m31  m32  m33  m34 |   | 0  0  1  tz |
     * | m41  m42  m43  m44 |   | 0  0  0   1 |
     * ```
     */
    public translatePost(tx: number, ty: number, tz: number): void {
        // | m11  m12  m13  m11 * tx + m12 * ty + m13 * tz + m14 |
        // | m21  m22  m23  m21 * tx + m22 * ty + m23 * tz + m24 |
        // | m31  m32  m33  m31 * tx + m32 * ty + m33 * tz + m34 |
        // | m41  m42  m43  m41 * tx + m42 * ty + m43 * tz + m44 |
        const el = this.elements;

        el[3] += el[0] * tx + el[1] * ty + el[2] * tz;
        el[7] += el[4] * tx + el[5] * ty + el[6] * tz;
        el[11] += el[8] * tx + el[9] * ty + el[10] * tz;
        el[15] += el[12] * tx + el[13] * ty + el[14] * tz;
    }

    /**
     * ```
     * | 1  0  0  tx |   | m11  m12  m13  m14 |
     * | 0  1  0  ty | * | m21  m22  m23  m24 |
     * | 0  0  1  tz |   | m31  m32  m33  m34 |
     * | 0  0  0   1 |   | m41  m42  m43  m44 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        // | m11 + tx * m41  m12 + tx * m42  m13 + tx * m43  m14 + tx * m44 |
        // | m21 + ty * m41  m22 + ty * m42  m23 + ty * m43  m24 + ty * m44 |
        // | m31 + tz * m41  m32 + tz * m42  m33 + tz * m43  m34 + tz * m44 |
        // |            m41             m42             m43             m44 |
        const el = this.elements;

        el[0] += el[12] * tx;
        el[1] += el[13] * tx;
        el[2] += el[14] * tx;
        el[3] += el[15] * tx;

        el[4] += el[12] * ty;
        el[5] += el[13] * ty;
        el[6] += el[14] * ty;
        el[7] += el[15] * ty;

        el[8] += el[12] * tz;
        el[9] += el[13] * tz;
        el[10] += el[14] * tz;
        el[11] += el[15] * tz;
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public translateSet(tx: number, ty: number, tz: number): void {
        this.set(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1);
    }
}
