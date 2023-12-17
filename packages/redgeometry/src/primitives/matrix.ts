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
     * | cos  -sin  0 |
     * | sin   cos  0 |
     * |   0    0   1 |
     * ```
     */
    public static fromRotation(sin: number, cos: number): Matrix3x2 {
        return new Matrix3x2(cos, -sin, 0, sin, cos, 0);
    }

    public static fromRotationAngle(a: number): Matrix3x2 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix3x2.fromRotation(sin, cos);
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

    public rotateAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotatePost(sin, cos);
    }

    public rotateAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotatePre(sin, cos);
    }

    public rotateAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateSet(sin, cos);
    }

    public rotateAroundAnglePost(a: number, x: number, y: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateAroundPost(sin, cos, x, y);
    }

    public rotateAroundAnglePre(a: number, x: number, y: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateAroundPre(sin, cos, x, y);
    }

    public rotateAroundPost(sin: number, cos: number, x: number, y: number): void {
        this.translatePost(x, y);
        this.rotatePost(sin, cos);
        this.translatePost(-x, -y);
    }

    public rotateAroundPre(sin: number, cos: number, x: number, y: number): void {
        this.translatePre(-x, -y);
        this.rotatePre(sin, cos);
        this.translatePre(x, y);
    }

    /**
     * ```
     * | m11  m12  m13 |   | cos  -sin  0 |
     * | m21  m22  m23 | * | sin   cos  0 |
     * | 0    0      1 |   |   0     0  1 |
     * ```
     */
    public rotatePost(sin: number, cos: number): void {
        // | m11 * cos + m12 * sin  m12 * cos + m11 * -sin  m13 |
        // | m21 * cos + m22 * sin  m22 * cos + m21 * -sin  m23 |
        // |                     0                       0    1 |
        const el = this.elements;

        const m11 = el[1] * sin + el[0] * cos;
        const m12 = el[1] * cos - el[0] * sin;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[4] * sin + el[3] * cos;
        const m22 = el[4] * cos - el[3] * sin;
        el[3] = m21;
        el[4] = m22;
    }

    /**
     * ```
     * | cos  -sin  0 |   | m11  m12  m13 |
     * | sin   cos  0 | * | m21  m22  m23 |
     * |   0     0  1 |   |   0    0    1 |
     * ```
     */
    public rotatePre(sin: number, cos: number): void {
        // | cos * m11 + -sin * m21  cos * m12 + -sin * m22  cos * m13 + -sin * m23 |
        // |  cos * m21 + sin * m11   cos * m22 + sin * m12   cos * m23 + sin * m13 |
        // |                      0                       0                       1 |
        const el = this.elements;

        const m11 = el[0] * cos - el[3] * sin;
        const m21 = el[3] * cos + el[0] * sin;
        el[0] = m11;
        el[3] = m21;

        const m12 = el[1] * cos - el[4] * sin;
        const m22 = el[4] * cos + el[1] * sin;
        el[1] = m12;
        el[4] = m22;

        const m13 = el[2] * cos - el[5] * sin;
        const m23 = el[5] * cos + el[2] * sin;
        el[2] = m13;
        el[5] = m23;
    }

    /**
     * ```
     * | cos  -sin  0 |
     * | sin   cos  0 |
     * |   0     0  1 |
     * ```
     */
    public rotateSet(sin: number, cos: number): void {
        this.set(cos, -sin, 0, sin, cos, 0);
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
     * | cos  -sin  0 |
     * | sin   cos  0 |
     * |   0    0   1 |
     * ```
     */
    public static fromRotation(sin: number, cos: number): Matrix3x3 {
        return new Matrix3x3(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
    }

    public static fromRotationAngle(a: number): Matrix3x3 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix3x3.fromRotation(sin, cos);
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

    public rotateAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotatePost(sin, cos);
    }

    public rotateAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotatePre(sin, cos);
    }

    public rotateAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateSet(sin, cos);
    }

    public rotateAroundAnglePost(a: number, x: number, y: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateAroundPost(sin, cos, x, y);
    }

    public rotateAroundAnglePre(a: number, x: number, y: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateAroundPre(sin, cos, x, y);
    }

    public rotateAroundPost(sin: number, cos: number, x: number, y: number): void {
        this.translatePost(x, y);
        this.rotatePost(sin, cos);
        this.translatePost(-x, -y);
    }

    public rotateAroundPre(sin: number, cos: number, x: number, y: number): void {
        this.translatePre(-x, -y);
        this.rotatePre(sin, cos);
        this.translatePre(x, y);
    }

    /**
     * ```
     * | m11  m12  m13 |   | cos  -sin  0 |
     * | m21  m22  m23 | * | sin   cos  0 |
     * | m31  m32  m33 |   |   0     0  1 |
     * ```
     */
    public rotatePost(sin: number, cos: number): void {
        // | m11 * cos + m12 * sin  m11 * -sin + m12 * cos  m13 |
        // | m21 * cos + m12 * sin  m21 * -sin + m22 * cos  m23 |
        // | m31 * cos + m32 * sin  m31 * -sin + m32 * cos  m33 |
        const el = this.elements;

        const m11 = el[1] * sin + el[0] * cos;
        const m12 = el[1] * cos - el[0] * sin;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[4] * sin + el[3] * cos;
        const m22 = el[4] * cos - el[3] * sin;
        el[3] = m21;
        el[4] = m22;

        const m31 = el[7] * sin + el[6] * cos;
        const m32 = el[7] * cos - el[6] * sin;
        el[6] = m31;
        el[7] = m32;
    }

    /**
     * ```
     * | cos  -sin  0 |   | m11  m12  m13 |
     * | sin   cos  0 | * | m21  m22  m23 |
     * |   0     0  1 |   | m31  m32  m33 |
     * ```
     */
    public rotatePre(sin: number, cos: number): void {
        // | cos * m11 + -sin * m21  cos * m12 + -sin * m22  cos * m32 + -sin * m32 |
        // |  sin * m11 + cos * m21   sin * m12 + cos * m22   sin * m32 + cos * m32 |
        // |                    m31                     m32                     m33 |
        const el = this.elements;

        const m11 = el[0] * cos - el[3] * sin;
        const m21 = el[0] * sin + el[3] * cos;
        el[0] = m11;
        el[3] = m21;

        const m12 = el[1] * cos - el[4] * sin;
        const m22 = el[1] * sin + el[4] * cos;
        el[1] = m12;
        el[4] = m22;

        const m13 = el[2] * cos - el[5] * sin;
        const m23 = el[2] * sin + el[5] * cos;
        el[2] = m13;
        el[5] = m23;
    }

    /* ```
     * | cos  -sin  0 |
     * | sin   cos  0 |
     * |   0     0  1 |
     * ```
     */
    public rotateSet(sin: number, cos: number): void {
        this.set(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
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
     * | 1    0     0  0 |
     * | 0  cos  -sin  0 |
     * | 0  sin   cos  0 |
     * | 0    0     0  1 |
     * ```
     */
    public static fromRotationX(sin: number, cos: number): Matrix4x3 {
        return new Matrix4x3(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0);
    }

    public static fromRotationXAngle(a: number): Matrix4x3 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x3.fromRotationX(sin, cos);
    }

    /**
     * ```
     * |  cos  0  sin  0 |
     * |    0  1    0  0 |
     * | -sin  0  cos  0 |
     * |    0  0    0  1 |
     * ```
     */
    public static fromRotationY(sin: number, cos: number): Matrix4x3 {
        return new Matrix4x3(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0);
    }

    public static fromRotationYAngle(a: number): Matrix4x3 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x3.fromRotationX(sin, cos);
    }

    /**
     * ```
     * | cos  -sin  0  0 |
     * | sin   cos  0  0 |
     * |   0     0  1  0 |
     * |   0     0  0  1 |
     * ```
     */
    public static fromRotationZ(sin: number, cos: number): Matrix4x3 {
        return new Matrix4x3(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0);
    }

    public static fromRotationZAngle(a: number): Matrix4x3 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x3.fromRotationX(sin, cos);
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

    /**
     * ```
     * | m11  m12  m13  m14 |   | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 | * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |   | m31  m32  m33  m34 |
     * |   0    0    0    1 |   |   0    0    0    1 |
     * ```
     */
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

    public rotateAroundAnglePost(ax: number, ay: number, az: number, x: number, y: number, z: number): void {
        const sinx = Math.sin(ax);
        const cosx = Math.cos(ax);
        const siny = Math.sin(ay);
        const cosy = Math.cos(ay);
        const sinz = Math.sin(az);
        const cosz = Math.cos(az);

        this.rotateAroundPost(sinx, cosx, siny, cosy, sinz, cosz, x, y, z);
    }

    public rotateAroundAnglePre(ax: number, ay: number, az: number, x: number, y: number, z: number): void {
        const sinx = Math.sin(ax);
        const cosx = Math.cos(ax);
        const siny = Math.sin(ay);
        const cosy = Math.cos(ay);
        const sinz = Math.sin(az);
        const cosz = Math.cos(az);

        this.rotateAroundPre(sinx, cosx, siny, cosy, sinz, cosz, x, y, z);
    }

    public rotateAroundPost(
        sinx: number,
        cosx: number,
        siny: number,
        cosy: number,
        sinz: number,
        cosz: number,
        x: number,
        y: number,
        z: number,
    ): void {
        this.translatePost(x, y, z);
        this.rotateXPost(sinx, cosx);
        this.rotateYPost(siny, cosy);
        this.rotateZPost(sinz, cosz);
        this.translatePost(-x, -y, -z);
    }

    public rotateAroundPre(
        sinx: number,
        cosx: number,
        siny: number,
        cosy: number,
        sinz: number,
        cosz: number,
        x: number,
        y: number,
        z: number,
    ): void {
        this.translatePre(x, y, z);
        this.rotateXPre(sinx, cosx);
        this.rotateYPre(siny, cosy);
        this.rotateZPre(sinz, cosz);
        this.translatePre(-x, -y, -z);
    }

    public rotateXAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXPost(sin, cos);
    }

    public rotateXAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXPre(sin, cos);
    }

    public rotateXAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | 1    0     0  0 |
     * | m21  m22  m23  m24 | * | 0  cos  -sin  0 |
     * | m31  m32  m33  m34 |   | 0  sin   cos  0 |
     * |   0    0    0    1 |   | 0    0     0  1 |
     * ```
     */
    public rotateXPost(sin: number, cos: number): void {
        // | m11  m12 * cos + m13 * sin  m12 * -sin + m13 * cos  m14 |
        // | m21  m22 * cos + m23 * sin  m22 * -sin + m23 * cos  m24 |
        // | m31  m32 * cos + m33 * sin  m32 * -sin + m33 * cos  m34 |
        // |   0                      0                       0    1 |
        const el = this.elements;

        const m12 = el[2] * sin + el[1] * cos;
        const m13 = el[2] * cos - el[1] * sin;
        el[1] = m12;
        el[2] = m13;

        const m22 = el[6] * sin + el[5] * cos;
        const m23 = el[6] * cos - el[5] * sin;
        el[5] = m22;
        el[6] = m23;

        const m32 = el[10] * sin + el[9] * cos;
        const m33 = el[10] * cos - el[9] * sin;
        el[9] = m32;
        el[10] = m33;
    }

    /**
     * ```
     * | 1    0     0  0 |   | m11  m12  m13  m14 |
     * | 0  cos  -sin  0 | * | m21  m22  m23  m24 |
     * | 0  sin   cos  0 |   | m31  m32  m33  m34 |
     * | 0    0     0  1 |   |   0    0    0    1 |
     * ```
     */
    public rotateXPre(sin: number, cos: number): void {
        // |                    m11                     m12                     m13                     m14 |
        // | cos * m21 + -sin * m31  cos * m22 + -sin * m32  cos * m23 + -sin * m33  cos * m24 + -sin * m34 |
        // |  sin * m21 + cos * m31   sin * m22 + cos * m32   sin * m23 + cos * m33   sin * m24 + cos * m34 |
        // |                      0                       0                       0                       1 |
        const el = this.elements;

        const m21 = el[4] * cos - el[8] * sin;
        const m31 = el[4] * sin + el[8] * cos;
        el[4] = m21;
        el[8] = m31;

        const m22 = el[5] * cos - el[9] * sin;
        const m32 = el[5] * sin + el[9] * cos;
        el[5] = m22;
        el[9] = m32;

        const m23 = el[6] * cos - el[10] * sin;
        const m33 = el[6] * sin + el[10] * cos;
        el[6] = m23;
        el[10] = m33;

        const m24 = el[7] * cos - el[11] * sin;
        const m34 = el[7] * sin + el[11] * cos;
        el[7] = m24;
        el[11] = m34;
    }

    /**
     * ```
     * | 1    0     0  0 |
     * | 0  cos  -sin  0 |
     * | 0  sin   cos  0 |
     * | 0    0     0  1 |
     * ```
     */
    public rotateXSet(sin: number, cos: number): void {
        this.set(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0);
    }

    public rotateYAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYPost(sin, cos);
    }

    public rotateYAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYPre(sin, cos);
    }

    public rotateYAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   |  cos  0  sin  0 |
     * | m21  m22  m23  m24 | * |    0  1    0  0 |
     * | m31  m32  m33  m34 |   | -sin  0  cos  0 |
     * |   0    0    0    1 |   |    0  0    0  1 |
     * ```
     */
    public rotateYPost(sin: number, cos: number): void {
        // | m11 * cos + m13 * -sin  m12  m11 * sin + m13 * cos  m14 |
        // | m21 * cos + m23 * -sin  m22  m21 * sin + m23 * cos  m24 |
        // | m31 * cos + m33 * -sin  m32  m31 * sin + m33 * cos  m34 |
        // |                      0    0                      0    1 |
        const el = this.elements;

        const m11 = el[0] * cos - el[2] * sin;
        const m13 = el[0] * sin + el[2] * cos;
        el[0] = m11;
        el[2] = m13;

        const m21 = el[4] * cos - el[6] * sin;
        const m23 = el[4] * sin + el[6] * cos;
        el[4] = m21;
        el[6] = m23;

        const m31 = el[8] * cos - el[10] * sin;
        const m33 = el[8] * sin + el[10] * cos;
        el[8] = m31;
        el[10] = m33;
    }

    /**
     * ```
     * |  cos  0  sin  0 |   | m11  m12  m13  m14 |
     * |    0  1    0  0 | * | m21  m22  m23  m24 |
     * | -sin  0  cos  0 |   | m31  m32  m33  m34 |
     * |    0  0    0  1 |   |   0    0    0    1 |
     * ```
     */
    public rotateYPre(sin: number, cos: number): void {
        // |  cos * m11 + sin * m31   cos * m12 + sin * m32   cos * m13 + sin * m33   cos * m14 + sin * m34 |
        // |                    m21                     m22                     m23                     m24 |
        // | -sin * m11 + cos * m31  -sin * m12 + cos * m32  -sin * m13 + cos * m33  -sin * m14 + cos * m34 |
        // |                      0                       0                       0                       1 |
        const el = this.elements;

        const m11 = el[8] * sin + el[0] * cos;
        const m31 = el[8] * cos - el[0] * sin;
        el[0] = m11;
        el[8] = m31;

        const m12 = el[9] * sin + el[1] * cos;
        const m32 = el[9] * cos - el[1] * sin;
        el[1] = m12;
        el[9] = m32;

        const m13 = el[10] * sin + el[2] * cos;
        const m33 = el[10] * cos - el[2] * sin;
        el[2] = m13;
        el[10] = m33;

        const m14 = el[11] * sin + el[3] * cos;
        const m34 = el[11] * cos - el[3] * sin;
        el[3] = m14;
        el[11] = m34;
    }

    /**
     * ```
     * |  cos  0  sin  0 |
     * |    0  1    0  0 |
     * | -sin  0  cos  0 |
     * |    0  0    0  1 |
     * ```
     */
    public rotateYSet(sin: number, cos: number): void {
        this.set(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0);
    }

    public rotateZAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZPost(sin, cos);
    }

    public rotateZAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZPre(sin, cos);
    }

    public rotateZAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | cos  -sin  0  0 |
     * | m21  m22  m23  m24 | * | sin   cos  0  0 |
     * | m31  m32  m33  m34 |   |   0     0  1  0 |
     * |   0    0    0    1 |   |   0     0  0  1 |
     * ```
     */
    public rotateZPost(sin: number, cos: number): void {
        // | m11 * cos + m12 * sin  m11 * -sin + m12 * cos  m13  m14 |
        // | m21 * cos + m22 * sin  m21 * -sin + m22 * cos  m23  m24 |
        // | m31 * cos + m32 * sin  m31 * -sin + m32 * cos  m33  m34 |
        // |               0                             0    0    1 |
        const el = this.elements;

        const m11 = el[1] * sin + el[0] * cos;
        const m12 = el[1] * cos - el[0] * sin;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[5] * sin + el[4] * cos;
        const m22 = el[5] * cos - el[4] * sin;
        el[4] = m21;
        el[5] = m22;

        const m31 = el[9] * sin + el[8] * cos;
        const m32 = el[9] * cos - el[8] * sin;
        el[8] = m31;
        el[9] = m32;
    }

    /**
     * ```
     * | cos  -sin  0  0 |   | m11  m12  m13  m14 |
     * | sin   cos  0  0 | * | m21  m22  m23  m24 |
     * |   0     0  1  0 |   | m31  m32  m33  m34 |
     * |   0     0  0  1 |   |   0    0    0    1 |
     * ```
     */
    public rotateZPre(sin: number, cos: number): void {
        // | cos * m11 + -sin * m21  cos * m12 + -sin * m22  cos * m13 + -sin * m23  cos * m14 + -sin * m24 |
        // |  sin * m11 + cos * m21   sin * m12 + cos * m22   sin * m13 + cos * m23   sin * m14 + cos * m24 |
        // |                    m31                     m32                     m33                     m34 |
        // |                      0                       0                       0                       1 |
        const el = this.elements;

        const m11 = el[0] * cos - el[4] * sin;
        const m21 = el[0] * sin + el[4] * cos;
        el[0] = m11;
        el[4] = m21;

        const m12 = el[1] * cos - el[5] * sin;
        const m22 = el[1] * sin + el[5] * cos;
        el[1] = m12;
        el[5] = m22;

        const m13 = el[2] * cos - el[6] * sin;
        const m23 = el[2] * sin + el[6] * cos;
        el[2] = m13;
        el[6] = m23;

        const m14 = el[3] * cos - el[7] * sin;
        const m24 = el[3] * sin + el[7] * cos;
        el[3] = m14;
        el[7] = m24;
    }

    /**
     * ```
     * | cos  -sin  0  0 |
     * | sin   cos  0  0 |
     * |   0     0  1  0 |
     * |   0     0  0  1 |
     * ```
     */
    public rotateZSet(sin: number, cos: number): void {
        this.set(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0);
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
     * | 1    0     0  0 |
     * | 0  cos  -sin  0 |
     * | 0  sin   cos  0 |
     * | 0    0     0  1 |
     * ```
     */
    public static fromRotationX(sin: number, cos: number): Matrix4x4 {
        return new Matrix4x4(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }

    public static fromRotationXAngle(a: number): Matrix4x4 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x4.fromRotationX(sin, cos);
    }

    /**
     * ```
     * |  cos  0  sin  0 |
     * |    0  1    0  0 |
     * | -sin  0  cos  0 |
     * |    0  0    0  1 |
     * ```
     */
    public static fromRotationY(sin: number, cos: number): Matrix4x4 {
        return new Matrix4x4(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }

    public static fromRotationYAngle(a: number): Matrix4x4 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x4.fromRotationX(sin, cos);
    }

    /**
     * ```
     * | cos  -sin  0  0 |
     * | sin   cos  0  0 |
     * |   0     0  1  0 |
     * |   0     0  0  1 |
     * ```
     */
    public static fromRotationZ(sin: number, cos: number): Matrix4x4 {
        return new Matrix4x4(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }

    public static fromRotationZAngle(a: number): Matrix4x4 {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        return Matrix4x4.fromRotationX(sin, cos);
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

    /**
     * ```
     * | m11  m12  m13  m14 |   | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 | * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |   | m31  m32  m33  m34 |
     * | m41  m42  m43  m44 |   | m41  m42  m43  m44 |
     * ```
     */
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

    public rotateAroundAnglePost(ax: number, ay: number, az: number, x: number, y: number, z: number): void {
        const sinx = Math.sin(ax);
        const cosx = Math.cos(ax);
        const siny = Math.sin(ay);
        const cosy = Math.cos(ay);
        const sinz = Math.sin(az);
        const cosz = Math.cos(az);

        this.rotateAroundPost(sinx, cosx, siny, cosy, sinz, cosz, x, y, z);
    }

    public rotateAroundAnglePre(ax: number, ay: number, az: number, x: number, y: number, z: number): void {
        const sinx = Math.sin(ax);
        const cosx = Math.cos(ax);
        const siny = Math.sin(ay);
        const cosy = Math.cos(ay);
        const sinz = Math.sin(az);
        const cosz = Math.cos(az);

        this.rotateAroundPre(sinx, cosx, siny, cosy, sinz, cosz, x, y, z);
    }

    public rotateAroundPost(
        sinx: number,
        cosx: number,
        siny: number,
        cosy: number,
        sinz: number,
        cosz: number,
        x: number,
        y: number,
        z: number,
    ): void {
        this.translatePost(x, y, z);
        this.rotateXPost(sinx, cosx);
        this.rotateYPost(siny, cosy);
        this.rotateZPost(sinz, cosz);
        this.translatePost(-x, -y, -z);
    }

    public rotateAroundPre(
        sinx: number,
        cosx: number,
        siny: number,
        cosy: number,
        sinz: number,
        cosz: number,
        x: number,
        y: number,
        z: number,
    ): void {
        this.translatePre(x, y, z);
        this.rotateXPre(sinx, cosx);
        this.rotateYPre(siny, cosy);
        this.rotateZPre(sinz, cosz);
        this.translatePre(-x, -y, -z);
    }

    public rotateXAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXPost(sin, cos);
    }

    public rotateXAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXPre(sin, cos);
    }

    public rotateXAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateXSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | 1    0     0  0 |
     * | m21  m22  m23  m24 | * | 0  cos  -sin  0 |
     * | m31  m32  m33  m34 |   | 0  sin   cos  0 |
     * | m41  m42  m43  m44 |   | 0    0     0  1 |
     * ```
     */
    public rotateXPost(sin: number, cos: number): void {
        // | m11  m12 * cos + m13 * sin  m12 * -sin + m13 * cos  m14 |
        // | m21  m22 * cos + m23 * sin  m22 * -sin + m23 * cos  m24 |
        // | m31  m32 * cos + m33 * sin  m32 * -sin + m33 * cos  m34 |
        // | m41  m42 * cos + m43 * sin  m42 * -sin + m43 * cos  m44 |
        const el = this.elements;

        const m12 = el[2] * sin + el[1] * cos;
        const m13 = el[2] * cos - el[1] * sin;
        el[1] = m12;
        el[2] = m13;

        const m22 = el[6] * sin + el[5] * cos;
        const m23 = el[6] * cos - el[5] * sin;
        el[5] = m22;
        el[6] = m23;

        const m32 = el[10] * sin + el[9] * cos;
        const m33 = el[10] * cos - el[9] * sin;
        el[9] = m32;
        el[10] = m33;

        const m42 = el[14] * sin + el[13] * cos;
        const m43 = el[14] * cos - el[13] * sin;
        el[13] = m42;
        el[14] = m43;
    }

    /**
     * ```
     * | 1    0     0  0 |   | m11  m12  m13  m14 |
     * | 0  cos  -sin  0 | * | m21  m22  m23  m24 |
     * | 0  sin   cos  0 |   | m31  m32  m33  m34 |
     * | 0    0     0  1 |   | m41  m42  m43  m44 |
     * ```
     */
    public rotateXPre(sin: number, cos: number): void {
        // |                    m11                     m12                     m13                     m14 |
        // | cos * m21 + -sin * m31  cos * m22 + -sin * m32  cos * m23 + -sin * m33  cos * m24 + -sin * m34 |
        // |  sin * m21 + cos * m31   sin * m22 + cos * m32   sin * m23 + cos * m33   sin * m24 + cos * m34 |
        // |                    m41                     m42                     m43                     m44 |
        const el = this.elements;

        const m21 = el[4] * cos - el[8] * sin;
        const m31 = el[4] * sin + el[8] * cos;
        el[4] = m21;
        el[8] = m31;

        const m22 = el[5] * cos - el[9] * sin;
        const m32 = el[5] * sin + el[9] * cos;
        el[5] = m22;
        el[9] = m32;

        const m23 = el[6] * cos - el[10] * sin;
        const m33 = el[6] * sin + el[10] * cos;
        el[6] = m23;
        el[10] = m33;

        const m24 = el[7] * cos - el[11] * sin;
        const m34 = el[7] * sin + el[11] * cos;
        el[7] = m24;
        el[11] = m34;
    }

    /**
     * ```
     * | 1    0     0  0 |
     * | 0  cos  -sin  0 |
     * | 0  sin   cos  0 |
     * | 0    0     0  1 |
     * ```
     */
    public rotateXSet(sin: number, cos: number): void {
        this.set(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
    }

    public rotateYAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYPost(sin, cos);
    }

    public rotateYAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYPre(sin, cos);
    }

    public rotateYAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateYSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   |  cos  0  sin  0 |
     * | m21  m22  m23  m24 | * |    0  1    0  0 |
     * | m31  m32  m33  m34 |   | -sin  0  cos  0 |
     * | m41  m42  m43  m44 |   |    0  0    0  1 |
     * ```
     */
    public rotateYPost(sin: number, cos: number): void {
        // | m11 * cos + m13 * -sin  m12  m11 * sin + m13 * cos  m14 |
        // | m21 * cos + m23 * -sin  m22  m21 * sin + m23 * cos  m24 |
        // | m31 * cos + m33 * -sin  m32  m31 * sin + m33 * cos  m34 |
        // | m41 * cos + m43 * -sin  m42  m41 * sin + m43 * cos  m44 |
        const el = this.elements;

        const m11 = el[0] * cos - el[2] * sin;
        const m13 = el[0] * sin + el[2] * cos;
        el[0] = m11;
        el[2] = m13;

        const m21 = el[4] * cos - el[6] * sin;
        const m23 = el[4] * sin + el[6] * cos;
        el[4] = m21;
        el[6] = m23;

        const m31 = el[8] * cos - el[10] * sin;
        const m33 = el[8] * sin + el[10] * cos;
        el[8] = m31;
        el[10] = m33;

        const m41 = el[12] * cos - el[14] * sin;
        const m43 = el[12] * sin + el[14] * cos;
        el[12] = m41;
        el[14] = m43;
    }

    /**
     * ```
     * |  cos  0  sin  0 |   | m11  m12  m13  m14 |
     * |    0  1    0  0 | * | m21  m22  m23  m24 |
     * | -sin  0  cos  0 |   | m31  m32  m33  m34 |
     * |    0  0    0  1 |   | m41  m42  m43  m44 |
     * ```
     */
    public rotateYPre(sin: number, cos: number): void {
        // |  cos * m11 + sin * m31   cos * m12 + sin * m32   cos * m13 + sin * m33   cos * m14 + sin * m34 |
        // |                    m21                     m22                     m23                     m24 |
        // | -sin * m11 + cos * m31  -sin * m12 + cos * m32  -sin * m13 + cos * m33  -sin * m14 + cos * m34 |
        // |                    m41                     m42                     m43                     m44 |
        const el = this.elements;

        const m11 = el[8] * sin + el[0] * cos;
        const m31 = el[8] * cos - el[0] * sin;
        el[0] = m11;
        el[8] = m31;

        const m12 = el[9] * sin + el[1] * cos;
        const m32 = el[9] * cos - el[1] * sin;
        el[1] = m12;
        el[9] = m32;

        const m13 = el[10] * sin + el[2] * cos;
        const m33 = el[10] * cos - el[2] * sin;
        el[2] = m13;
        el[10] = m33;

        const m14 = el[11] * sin + el[3] * cos;
        const m34 = el[11] * cos - el[3] * sin;
        el[3] = m14;
        el[11] = m34;
    }

    /**
     * ```
     * |  cos  0  sin  0 |
     * |    0  1    0  0 |
     * | -sin  0  cos  0 |
     * |    0  0    0  1 |
     * ```
     */
    public rotateYSet(sin: number, cos: number): void {
        this.set(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
    }

    public rotateZAnglePost(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZPost(sin, cos);
    }

    public rotateZAnglePre(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZPre(sin, cos);
    }

    public rotateZAngleSet(a: number): void {
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        this.rotateZSet(sin, cos);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | cos  -sin  0  0 |
     * | m21  m22  m23  m24 | * | sin   cos  0  0 |
     * | m31  m32  m33  m34 |   |   0     0  1  0 |
     * | m41  m42  m43  m44 |   |   0     0  0  1 |
     * ```
     */
    public rotateZPost(sin: number, cos: number): void {
        // | m11 * cos + m12 * sin  m11 * -sin + m12 * cos  m13  m14 |
        // | m21 * cos + m22 * sin  m21 * -sin + m22 * cos  m23  m24 |
        // | m31 * cos + m32 * sin  m31 * -sin + m32 * cos  m33  m34 |
        // | m41 * cos + m42 * sin  m41 * -sin + m42 * cos  m43  m44 |
        const el = this.elements;

        const m11 = el[1] * sin + el[0] * cos;
        const m12 = el[1] * cos - el[0] * sin;
        el[0] = m11;
        el[1] = m12;

        const m21 = el[5] * sin + el[4] * cos;
        const m22 = el[5] * cos - el[4] * sin;
        el[4] = m21;
        el[5] = m22;

        const m31 = el[9] * sin + el[8] * cos;
        const m32 = el[9] * cos - el[8] * sin;
        el[8] = m31;
        el[9] = m32;

        const m41 = el[13] * sin + el[12] * cos;
        const m42 = el[13] * cos - el[12] * sin;
        el[12] = m41;
        el[13] = m42;
    }

    /**
     * ```
     * | cos  -sin  0  0 |   | m11  m12  m13  m14 |
     * | sin   cos  0  0 | * | m21  m22  m23  m24 |
     * |   0     0  1  0 |   | m31  m32  m33  m34 |
     * |   0     0  0  1 |   | m41  m42  m43  m44 |
     * ```
     */
    public rotateZPre(sin: number, cos: number): void {
        // | cos * m11 + -sin * m21  cos * m12 + -sin * m22  cos * m13 + -sin * m23  cos * m14 + -sin * m24 |
        // |  sin * m11 + cos * m21   sin * m12 + cos * m22   sin * m13 + cos * m23   sin * m14 + cos * m24 |
        // |                    m31                     m32                     m33                     m34 |
        // |                    m41                     m42                     m43                     m44 |
        const el = this.elements;

        const m11 = el[0] * cos - el[4] * sin;
        const m21 = el[0] * sin + el[4] * cos;
        el[0] = m11;
        el[4] = m21;

        const m12 = el[1] * cos - el[5] * sin;
        const m22 = el[1] * sin + el[5] * cos;
        el[1] = m12;
        el[5] = m22;

        const m13 = el[2] * cos - el[6] * sin;
        const m23 = el[2] * sin + el[6] * cos;
        el[2] = m13;
        el[6] = m23;

        const m14 = el[3] * cos - el[7] * sin;
        const m24 = el[3] * sin + el[7] * cos;
        el[3] = m14;
        el[7] = m24;
    }

    /**
     * ```
     * | cos  -sin  0  0 |
     * | sin   cos  0  0 |
     * |   0     0  1  0 |
     * |   0     0  0  1 |
     * ```
     */
    public rotateZSet(sin: number, cos: number): void {
        this.set(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
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
