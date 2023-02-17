import { getMaxEigenvalueSym2x2, getMaxEigenvalueSym3x3 } from "../internal";
import { Point2, Point3 } from "./point";
import { Vector2, Vector3 } from "./vector";

/**
 * Represents a matrix for affine transformations in 2D:
 * ```
 * | m11  m12  m13 |
 * | m21  m22  m23 |
 * |   0    0    1 |
 * ```
 */
export class Matrix3x2 {
    public m11: number;
    public m12: number;
    public m13: number;
    public m21: number;
    public m22: number;
    public m23: number;

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * |   0    0    1 |
     * ```
     */
    constructor(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number) {
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public static get identity(): Matrix3x2 {
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

    public static fromArray(data: ArrayLike<number>, offset = 0, transpose = false): Matrix3x2 {
        let m11, m12, m13, m21, m22, m23;

        if (transpose) {
            m11 = data[offset];
            m21 = data[offset + 1];
            m12 = data[offset + 2];
            m22 = data[offset + 3];
            m13 = data[offset + 4];
            m23 = data[offset + 5];
        } else {
            m11 = data[offset];
            m12 = data[offset + 1];
            m13 = data[offset + 2];
            m21 = data[offset + 3];
            m22 = data[offset + 4];
            m23 = data[offset + 5];
        }

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
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

    public add(mat: Matrix3x2): Matrix3x2 {
        const m11 = this.m11 + mat.m11;
        const m12 = this.m12 + mat.m12;
        const m13 = this.m13 + mat.m13;
        const m21 = this.m21 + mat.m21;
        const m22 = this.m22 + mat.m22;
        const m23 = this.m23 + mat.m23;

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
    }

    public clone(): Matrix3x2 {
        const m11 = this.m11;
        const m12 = this.m12;
        const m13 = this.m13;
        const m21 = this.m21;
        const m22 = this.m22;
        const m23 = this.m23;

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
    }

    public getDeterminant(): number {
        return this.m11 * this.m22 - this.m12 * this.m21;
    }

    public getMaxScale(): number {
        // Compute elements of `S^2 = M * M^T`
        const s11 = this.m11 * this.m11 + this.m12 * this.m12;
        const s12 = this.m11 * this.m21 + this.m12 * this.m22;
        const s22 = this.m21 * this.m21 + this.m22 * this.m22;

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const e = getMaxEigenvalueSym2x2(s11, s12, s22);

        return Math.sqrt(e);
    }

    public inverse(): Matrix3x2 {
        const det = this.getDeterminant();

        if (det === 0) {
            return Matrix3x2.identity;
        }

        const detInv = 1 / det;

        const m11 = detInv * this.m22;
        const m12 = detInv * -this.m12;
        const m13 = detInv * (this.m12 * this.m23 - this.m13 * this.m22);
        const m21 = detInv * -this.m21;
        const m22 = detInv * this.m11;
        const m23 = detInv * (this.m13 * this.m21 - this.m11 * this.m23);

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
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
        const x = this.m11 * p.x + this.m12 * p.y + this.m13;
        const y = this.m21 * p.x + this.m22 * p.y + this.m23;

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
        const x = this.m11 * v.x + this.m12 * v.y + this.m13;
        const y = this.m21 * v.x + this.m22 * v.y + this.m23;

        return new Vector2(x, y);
    }

    public mul(mat: Matrix3x2): Matrix3x2 {
        const m11 = this.m11 * mat.m11 + this.m12 * mat.m21;
        const m12 = this.m11 * mat.m12 + this.m12 * mat.m22;
        const m13 = this.m11 * mat.m13 + this.m12 * mat.m23 + this.m13;
        const m21 = this.m21 * mat.m11 + this.m22 * mat.m21;
        const m22 = this.m21 * mat.m12 + this.m22 * mat.m22;
        const m23 = this.m21 * mat.m13 + this.m22 * mat.m23 + this.m23;

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
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
        const m11 = this.m12 * sin + this.m11 * cos;
        const m12 = this.m12 * cos - this.m11 * sin;
        this.m11 = m11;
        this.m12 = m12;

        const m21 = this.m22 * sin + this.m21 * cos;
        const m22 = this.m22 * cos - this.m21 * sin;
        this.m21 = m21;
        this.m22 = m22;
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
        const m11 = this.m11 * cos - this.m21 * sin;
        const m21 = this.m21 * cos + this.m11 * sin;
        this.m11 = m11;
        this.m21 = m21;

        const m12 = this.m12 * cos - this.m22 * sin;
        const m22 = this.m22 * cos + this.m12 * sin;
        this.m12 = m12;
        this.m22 = m22;

        const m13 = this.m13 * cos - this.m23 * sin;
        const m23 = this.m23 * cos + this.m13 * sin;
        this.m13 = m13;
        this.m23 = m23;
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
        this.m11 *= sx;
        this.m21 *= sx;
        this.m12 *= sy;
        this.m22 *= sy;
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
        this.m11 *= sx;
        this.m12 *= sx;
        this.m13 *= sx;
        this.m21 *= sy;
        this.m22 *= sy;
        this.m23 *= sy;
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
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
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

    public sub(mat: Matrix3x2): Matrix3x2 {
        const m11 = this.m11 - mat.m11;
        const m12 = this.m12 - mat.m12;
        const m13 = this.m13 - mat.m13;
        const m21 = this.m21 - mat.m21;
        const m22 = this.m22 - mat.m22;
        const m23 = this.m23 - mat.m23;

        return new Matrix3x2(m11, m12, m13, m21, m22, m23);
    }

    public toArray(transpose = false): number[] {
        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                this.m11, this.m21, 0,
                this.m12, this.m22, 0,
                this.m13, this.m23, 1,
            ];
        } else {
            // row-major order
            return [
                this.m11, this.m12, this.m13,
                this.m21, this.m22, this.m23,
                0, 0, 1,
            ];
        }
    }

    public toString(): string {
        return (
            `{m11: ${this.m11}, m12: ${this.m12}, m13: ${this.m13},\n` +
            ` m21: ${this.m21}, m22: ${this.m22}, m23: ${this.m23}}`
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
        this.m13 += this.m11 * tx + this.m12 * ty;
        this.m23 += this.m21 * tx + this.m22 * ty;
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
        this.m13 += tx;
        this.m23 += ty;
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
 * Represents a matrix for non-affine (projective) transformations in 2D:
 * ```
 * | m11  m12  m13 |
 * | m21  m22  m23 |
 * | m31  m32  m33 |
 * ```
 */
export class Matrix3x3 {
    public m11: number;
    public m12: number;
    public m13: number;
    public m21: number;
    public m22: number;
    public m23: number;
    public m31: number;
    public m32: number;
    public m33: number;

    /**
     * ```
     * | m11  m12  m13 |
     * | m21  m22  m23 |
     * | m31  m32  m33 |
     * ```
     */
    constructor(
        m11: number,
        m12: number,
        m13: number,
        m21: number,
        m22: number,
        m23: number,
        m31: number,
        m32: number,
        m33: number
    ) {
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
        this.m31 = m31;
        this.m32 = m32;
        this.m33 = m33;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public static get identity(): Matrix3x3 {
        return new Matrix3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 0  0  0 |
     * | 0  0  0 |
     * | 0  0  0 |
     * ```
     */
    public static get zero(): Matrix3x3 {
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

    public static fromArray(data: ArrayLike<number>, offset = 0, transpose = false): Matrix3x3 {
        let m11, m12, m13, m21, m22, m23, m31, m32, m33;

        if (transpose) {
            m11 = data[offset];
            m21 = data[offset + 1];
            m31 = data[offset + 2];
            m12 = data[offset + 3];
            m22 = data[offset + 4];
            m32 = data[offset + 5];
            m13 = data[offset + 6];
            m23 = data[offset + 7];
            m33 = data[offset + 8];
        } else {
            m11 = data[offset];
            m12 = data[offset + 1];
            m13 = data[offset + 2];
            m21 = data[offset + 3];
            m22 = data[offset + 4];
            m23 = data[offset + 5];
            m31 = data[offset + 6];
            m32 = data[offset + 7];
            m33 = data[offset + 8];
        }

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
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

    public add(m: Matrix3x3): Matrix3x3 {
        const m11 = this.m11 + m.m11;
        const m12 = this.m12 + m.m12;
        const m13 = this.m13 + m.m13;
        const m21 = this.m21 + m.m21;
        const m22 = this.m22 + m.m22;
        const m23 = this.m23 + m.m23;
        const m31 = this.m31 + m.m31;
        const m32 = this.m32 + m.m32;
        const m33 = this.m33 + m.m33;

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }

    public clone(): Matrix3x3 {
        const m11 = this.m11;
        const m12 = this.m12;
        const m13 = this.m13;
        const m21 = this.m21;
        const m22 = this.m22;
        const m23 = this.m23;
        const m31 = this.m31;
        const m32 = this.m32;
        const m33 = this.m33;

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }

    public getDeterminant(): number {
        const a = this.m11 * (this.m22 * this.m33 - this.m23 * this.m32);
        const b = this.m12 * (this.m21 * this.m33 - this.m23 * this.m31);
        const c = this.m13 * (this.m21 * this.m32 - this.m22 * this.m31);

        return a - b + c;
    }

    public getMaxScale(): number {
        // Compute elements of `S^2 = M * M^T`
        const s11 = this.m11 * this.m11 + this.m12 * this.m12;
        const s12 = this.m11 * this.m21 + this.m12 * this.m22;
        const s22 = this.m21 * this.m21 + this.m22 * this.m22;

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const e = getMaxEigenvalueSym2x2(s11, s12, s22);

        return Math.sqrt(e);
    }

    public inverse(): Matrix3x3 {
        const det = this.getDeterminant();

        if (det === 0) {
            return Matrix3x3.identity;
        }

        const detInv = 1 / det;

        const m11 = detInv * (this.m22 * this.m33 - this.m23 * this.m32);
        const m12 = detInv * (this.m13 * this.m32 - this.m12 * this.m33);
        const m13 = detInv * (this.m12 * this.m23 - this.m13 * this.m22);
        const m21 = detInv * (this.m23 * this.m31 - this.m21 * this.m33);
        const m22 = detInv * (this.m11 * this.m33 - this.m13 * this.m31);
        const m23 = detInv * (this.m13 * this.m21 - this.m11 * this.m23);
        const m31 = detInv * (this.m21 * this.m32 - this.m22 * this.m31);
        const m32 = detInv * (this.m12 * this.m31 - this.m11 * this.m32);
        const m33 = detInv * (this.m11 * this.m22 - this.m12 * this.m21);

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
        const x = this.m11 * p.x + this.m12 * p.y + this.m13;
        const y = this.m21 * p.x + this.m22 * p.y + this.m23;
        const w = this.m31 * p.x + this.m32 * p.y + this.m33;

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
        const x = this.m11 * v.x + this.m12 * v.y + this.m13;
        const y = this.m21 * v.x + this.m22 * v.y + this.m23;
        const w = this.m31 * v.x + this.m32 * v.y + this.m33;

        return Vector2.fromXYW(x, y, w);
    }

    public mul(m: Matrix3x3): Matrix3x3 {
        const m11 = this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31;
        const m12 = this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32;
        const m13 = this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33;
        const m21 = this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31;
        const m22 = this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32;
        const m23 = this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33;
        const m31 = this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31;
        const m32 = this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32;
        const m33 = this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33;

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
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
        const m11 = this.m12 * sin + this.m11 * cos;
        const m12 = this.m12 * cos - this.m11 * sin;
        this.m11 = m11;
        this.m12 = m12;

        const m21 = this.m22 * sin + this.m21 * cos;
        const m22 = this.m22 * cos - this.m21 * sin;
        this.m21 = m21;
        this.m22 = m22;

        const m31 = this.m32 * sin + this.m31 * cos;
        const m32 = this.m32 * cos - this.m31 * sin;
        this.m31 = m31;
        this.m32 = m32;
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
        const m11 = this.m11 * cos - this.m21 * sin;
        const m21 = this.m11 * sin + this.m21 * cos;
        this.m11 = m11;
        this.m21 = m21;

        const m12 = this.m12 * cos - this.m22 * sin;
        const m22 = this.m12 * sin + this.m22 * cos;
        this.m12 = m12;
        this.m22 = m22;

        const m13 = this.m13 * cos - this.m23 * sin;
        const m23 = this.m13 * sin + this.m23 * cos;
        this.m13 = m13;
        this.m23 = m23;
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
        this.m11 *= sx;
        this.m21 *= sx;
        this.m31 *= sx;
        this.m12 *= sy;
        this.m22 *= sy;
        this.m32 *= sy;
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
        this.m11 *= sx;
        this.m12 *= sx;
        this.m13 *= sx;
        this.m21 *= sy;
        this.m22 *= sy;
        this.m23 *= sy;
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
        m33: number
    ): void {
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
        this.m31 = m31;
        this.m32 = m32;
        this.m33 = m33;
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

    public sub(m: Matrix3x3): Matrix3x3 {
        const m11 = this.m11 - m.m11;
        const m12 = this.m12 - m.m12;
        const m13 = this.m13 - m.m13;
        const m21 = this.m21 - m.m21;
        const m22 = this.m22 - m.m22;
        const m23 = this.m23 - m.m23;
        const m31 = this.m31 - m.m31;
        const m32 = this.m32 - m.m32;
        const m33 = this.m33 - m.m33;

        return new Matrix3x3(m11, m12, m13, m21, m22, m23, m31, m32, m33);
    }

    public toArray(transpose = false): number[] {
        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                this.m11, this.m21, this.m31,
                this.m12, this.m22, this.m32,
                this.m13, this.m23, this.m33,
            ];
        } else {
            // row-major order
            return [
                this.m11, this.m12, this.m13,
                this.m21, this.m22, this.m23,
                this.m31, this.m32, this.m33,
            ];
        }
    }

    public toString(): string {
        return (
            `{m11: ${this.m11}, m12: ${this.m12}, m13: ${this.m13},\n` +
            ` m21: ${this.m21}, m22: ${this.m22}, m23: ${this.m23},\n` +
            ` m31: ${this.m31}, m32: ${this.m32}, m33: ${this.m33}}`
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
        this.m13 += this.m11 * tx + this.m12 * ty;
        this.m23 += this.m21 * tx + this.m22 * ty;
        this.m33 += this.m31 * tx + this.m32 * ty;
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
        this.m11 += this.m31 * tx;
        this.m12 += this.m32 * tx;
        this.m13 += this.m33 * tx;
        this.m21 += this.m31 * ty;
        this.m22 += this.m32 * ty;
        this.m23 += this.m33 * ty;
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
 * Represents a matrix for non-affine (projective) transformations in 3D:
 * ```
 * | m11  m12  m13  m14 |
 * | m21  m22  m23  m24 |
 * | m31  m32  m33  m34 |
 * | m41  m42  m43  m44 |
 * ```
 */
export class Matrix4x4 {
    public m11: number;
    public m12: number;
    public m13: number;
    public m14: number;
    public m21: number;
    public m22: number;
    public m23: number;
    public m24: number;
    public m31: number;
    public m32: number;
    public m33: number;
    public m34: number;
    public m41: number;
    public m42: number;
    public m43: number;
    public m44: number;

    /**
     * ```
     * | m11  m12  m13  m14 |
     * | m21  m22  m23  m24 |
     * | m31  m32  m33  m34 |
     * | m41  m42  m43  m44 |
     * ```
     */
    constructor(
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
        m44: number
    ) {
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m14 = m14;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
        this.m24 = m24;
        this.m31 = m31;
        this.m32 = m32;
        this.m33 = m33;
        this.m34 = m34;
        this.m41 = m41;
        this.m42 = m42;
        this.m43 = m43;
        this.m44 = m44;
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public static get identity(): Matrix4x4 {
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
    public static get zero(): Matrix4x4 {
        return new Matrix4x4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0, transpose = false): Matrix4x4 {
        let m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44;

        if (transpose) {
            m11 = data[offset];
            m21 = data[offset + 1];
            m31 = data[offset + 2];
            m41 = data[offset + 3];
            m12 = data[offset + 4];
            m22 = data[offset + 5];
            m32 = data[offset + 6];
            m42 = data[offset + 7];
            m13 = data[offset + 8];
            m23 = data[offset + 9];
            m33 = data[offset + 10];
            m43 = data[offset + 11];
            m14 = data[offset + 12];
            m24 = data[offset + 13];
            m34 = data[offset + 14];
            m44 = data[offset + 15];
        } else {
            m11 = data[offset];
            m12 = data[offset + 1];
            m13 = data[offset + 2];
            m14 = data[offset + 3];
            m21 = data[offset + 4];
            m22 = data[offset + 5];
            m23 = data[offset + 6];
            m24 = data[offset + 7];
            m31 = data[offset + 8];
            m32 = data[offset + 9];
            m33 = data[offset + 10];
            m34 = data[offset + 11];
            m41 = data[offset + 12];
            m42 = data[offset + 13];
            m43 = data[offset + 14];
            m44 = data[offset + 15];
        }

        return new Matrix4x4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
    }

    public static fromOrthographic(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number
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
        far: number
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

        return this.fromPerspective(left, left + width, top, top - height, near, far);
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

    public add(m: Matrix4x4): Matrix4x4 {
        const m11 = this.m11 + m.m11;
        const m12 = this.m12 + m.m12;
        const m13 = this.m13 + m.m13;
        const m14 = this.m14 + m.m14;
        const m21 = this.m21 + m.m21;
        const m22 = this.m22 + m.m22;
        const m23 = this.m23 + m.m23;
        const m24 = this.m24 + m.m24;
        const m31 = this.m31 + m.m31;
        const m32 = this.m32 + m.m32;
        const m33 = this.m33 + m.m33;
        const m34 = this.m34 + m.m34;
        const m41 = this.m41 + m.m41;
        const m42 = this.m42 + m.m42;
        const m43 = this.m43 + m.m43;
        const m44 = this.m44 + m.m44;

        return new Matrix4x4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
    }

    public clone(): Matrix4x4 {
        const m11 = this.m11;
        const m12 = this.m12;
        const m13 = this.m13;
        const m14 = this.m14;
        const m21 = this.m21;
        const m22 = this.m22;
        const m23 = this.m23;
        const m24 = this.m24;
        const m31 = this.m31;
        const m32 = this.m32;
        const m33 = this.m33;
        const m34 = this.m34;
        const m41 = this.m41;
        const m42 = this.m42;
        const m43 = this.m43;
        const m44 = this.m44;

        return new Matrix4x4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
    }

    public getMaxScale(): number {
        // Compute elements of `S^2 = M * M^T`
        const s11 = this.m11 * this.m11 + this.m12 * this.m12 + this.m13 * this.m13;
        const s12 = this.m11 * this.m21 + this.m12 * this.m22 + this.m13 * this.m23;
        const s13 = this.m11 * this.m31 + this.m12 * this.m32 + this.m13 * this.m33;
        const s22 = this.m21 * this.m21 + this.m22 * this.m22 + this.m23 * this.m23;
        const s23 = this.m21 * this.m31 + this.m22 * this.m32 + this.m23 * this.m33;
        const s33 = this.m31 * this.m31 + this.m32 * this.m32 + this.m33 * this.m33;

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const e = getMaxEigenvalueSym3x3(s11, s12, s13, s22, s23, s33);

        return Math.sqrt(e);
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
        const x = this.m11 * p.x + this.m12 * p.y + this.m13 * p.z + this.m14;
        const y = this.m21 * p.x + this.m22 * p.y + this.m23 * p.z + this.m24;
        const z = this.m31 * p.x + this.m32 * p.y + this.m33 * p.z + this.m34;
        const w = this.m41 * p.x + this.m42 * p.y + this.m43 * p.z + this.m44;

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
        const x = this.m11 * v.x + this.m12 * v.y + this.m13 * v.z + this.m14;
        const y = this.m21 * v.x + this.m22 * v.y + this.m23 * v.z + this.m24;
        const z = this.m31 * v.x + this.m32 * v.y + this.m33 * v.z + this.m34;
        const w = this.m41 * v.x + this.m42 * v.y + this.m43 * v.z + this.m44;

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | m11  m12  m13  m14 |   | mm11  mm12  mm13  mm14 |
     * | m21  m22  m23  m24 | * | mm21  mm22  mm23  mm24 |
     * | m31  m32  m33  m34 |   | mm31  mm32  mm33  mm34 |
     * | m41  m42  m43  m44 |   | mm41  mm42  mm43  mm44 |
     * ```
     */
    public mul(m: Matrix4x4): Matrix4x4 {
        const m11 = this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31 + this.m14 * m.m41;
        const m12 = this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32 + this.m14 * m.m42;
        const m13 = this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33 + this.m14 * m.m43;
        const m14 = this.m11 * m.m14 + this.m12 * m.m24 + this.m13 * m.m34 + this.m14 * m.m44;
        const m21 = this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31 + this.m24 * m.m41;
        const m22 = this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32 + this.m24 * m.m42;
        const m23 = this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33 + this.m24 * m.m43;
        const m24 = this.m21 * m.m14 + this.m22 * m.m24 + this.m23 * m.m34 + this.m24 * m.m44;
        const m31 = this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31 + this.m34 * m.m41;
        const m32 = this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32 + this.m34 * m.m42;
        const m33 = this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33 + this.m34 * m.m43;
        const m34 = this.m31 * m.m14 + this.m32 * m.m24 + this.m33 * m.m34 + this.m34 * m.m44;
        const m41 = this.m41 * m.m11 + this.m42 * m.m21 + this.m43 * m.m31 + this.m44 * m.m41;
        const m42 = this.m41 * m.m12 + this.m42 * m.m22 + this.m43 * m.m32 + this.m44 * m.m42;
        const m43 = this.m41 * m.m13 + this.m42 * m.m23 + this.m43 * m.m33 + this.m44 * m.m43;
        const m44 = this.m41 * m.m14 + this.m42 * m.m24 + this.m43 * m.m34 + this.m44 * m.m44;

        return new Matrix4x4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
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
        z: number
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
        z: number
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
        const m12 = this.m13 * sin + this.m12 * cos;
        const m13 = this.m13 * cos - this.m12 * sin;
        this.m12 = m12;
        this.m13 = m13;

        const m22 = this.m23 * sin + this.m22 * cos;
        const m23 = this.m23 * cos - this.m22 * sin;
        this.m22 = m22;
        this.m23 = m23;

        const m32 = this.m33 * sin + this.m32 * cos;
        const m33 = this.m33 * cos - this.m32 * sin;
        this.m32 = m32;
        this.m33 = m33;

        const m42 = this.m43 * sin + this.m42 * cos;
        const m43 = this.m43 * cos - this.m42 * sin;
        this.m42 = m42;
        this.m43 = m43;
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
        const m21 = this.m21 * cos - this.m31 * sin;
        const m31 = this.m21 * sin + this.m31 * cos;
        this.m21 = m21;
        this.m31 = m31;

        const m22 = this.m22 * cos - this.m32 * sin;
        const m32 = this.m22 * sin + this.m32 * cos;
        this.m22 = m22;
        this.m32 = m32;

        const m23 = this.m23 * cos - this.m33 * sin;
        const m33 = this.m23 * sin + this.m33 * cos;
        this.m23 = m23;
        this.m33 = m33;

        const m24 = this.m24 * cos - this.m34 * sin;
        const m34 = this.m24 * sin + this.m34 * cos;
        this.m24 = m24;
        this.m34 = m34;
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
        const m11 = this.m11 * cos - this.m13 * sin;
        const m13 = this.m11 * sin + this.m13 * cos;
        this.m11 = m11;
        this.m13 = m13;

        const m21 = this.m21 * cos - this.m23 * sin;
        const m23 = this.m21 * sin + this.m23 * cos;
        this.m21 = m21;
        this.m23 = m23;

        const m31 = this.m31 * cos - this.m33 * sin;
        const m33 = this.m31 * sin + this.m33 * cos;
        this.m31 = m31;
        this.m33 = m33;

        const m41 = this.m41 * cos - this.m43 * sin;
        const m43 = this.m41 * sin + this.m43 * cos;
        this.m41 = m41;
        this.m43 = m43;
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
        const m11 = this.m31 * sin + this.m11 * cos;
        const m31 = this.m31 * cos - this.m11 * sin;
        this.m11 = m11;
        this.m31 = m31;

        const m12 = this.m32 * sin + this.m12 * cos;
        const m32 = this.m32 * cos - this.m12 * sin;
        this.m12 = m12;
        this.m32 = m32;

        const m13 = this.m33 * sin + this.m13 * cos;
        const m33 = this.m33 * cos - this.m13 * sin;
        this.m13 = m13;
        this.m33 = m33;

        const m14 = this.m34 * sin + this.m14 * cos;
        const m34 = this.m34 * cos - this.m14 * sin;
        this.m14 = m14;
        this.m34 = m34;
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
        const m11 = this.m12 * sin + this.m11 * cos;
        const m12 = this.m12 * cos - this.m11 * sin;
        this.m11 = m11;
        this.m12 = m12;

        const m21 = this.m22 * sin + this.m21 * cos;
        const m22 = this.m22 * cos - this.m21 * sin;
        this.m21 = m21;
        this.m22 = m22;

        const m31 = this.m32 * sin + this.m31 * cos;
        const m32 = this.m32 * cos - this.m31 * sin;
        this.m31 = m31;
        this.m32 = m32;

        const m41 = this.m42 * sin + this.m41 * cos;
        const m42 = this.m42 * cos - this.m41 * sin;
        this.m41 = m41;
        this.m42 = m42;
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
        const m11 = this.m11 * cos - this.m21 * sin;
        const m21 = this.m11 * sin + this.m21 * cos;
        this.m11 = m11;
        this.m21 = m21;

        const m12 = this.m12 * cos - this.m22 * sin;
        const m22 = this.m12 * sin + this.m22 * cos;
        this.m12 = m12;
        this.m22 = m22;

        const m13 = this.m13 * cos - this.m23 * sin;
        const m23 = this.m13 * sin + this.m23 * cos;
        this.m13 = m13;
        this.m23 = m23;

        const m14 = this.m14 * cos - this.m24 * sin;
        const m24 = this.m14 * sin + this.m24 * cos;
        this.m14 = m14;
        this.m24 = m24;
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
        this.m11 *= sx;
        this.m21 *= sx;
        this.m31 *= sx;
        this.m41 *= sx;
        this.m12 *= sy;
        this.m22 *= sy;
        this.m32 *= sy;
        this.m42 *= sy;
        this.m13 *= sz;
        this.m23 *= sz;
        this.m33 *= sz;
        this.m43 *= sz;
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
        this.m11 *= sx;
        this.m12 *= sx;
        this.m13 *= sx;
        this.m14 *= sx;
        this.m21 *= sy;
        this.m22 *= sy;
        this.m23 *= sy;
        this.m24 *= sy;
        this.m31 *= sz;
        this.m32 *= sz;
        this.m33 *= sz;
        this.m34 *= sz;
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
        m44: number
    ): void {
        this.m11 = m11;
        this.m12 = m12;
        this.m13 = m13;
        this.m14 = m14;
        this.m21 = m21;
        this.m22 = m22;
        this.m23 = m23;
        this.m24 = m24;
        this.m31 = m31;
        this.m32 = m32;
        this.m33 = m33;
        this.m34 = m34;
        this.m41 = m41;
        this.m42 = m42;
        this.m43 = m43;
        this.m44 = m44;
    }

    public sub(m: Matrix4x4): Matrix4x4 {
        const m11 = this.m11 - m.m11;
        const m12 = this.m12 - m.m12;
        const m13 = this.m13 - m.m13;
        const m14 = this.m14 - m.m14;
        const m21 = this.m21 - m.m21;
        const m22 = this.m22 - m.m22;
        const m23 = this.m23 - m.m23;
        const m24 = this.m24 - m.m24;
        const m31 = this.m31 - m.m31;
        const m32 = this.m32 - m.m32;
        const m33 = this.m33 - m.m33;
        const m34 = this.m34 - m.m34;
        const m41 = this.m41 - m.m41;
        const m42 = this.m42 - m.m42;
        const m43 = this.m43 - m.m43;
        const m44 = this.m44 - m.m44;

        return new Matrix4x4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
    }

    public toArray(transpose = false): number[] {
        // prettier-ignore
        if (transpose) {
            // column-major order
            return [
                this.m11, this.m21, this.m31, this.m41,
                this.m12, this.m22, this.m32, this.m42,
                this.m13, this.m23, this.m33, this.m43,
                this.m14, this.m24, this.m34, this.m44,
            ];
        } else {
            // row-major order
            return [
                this.m11, this.m12, this.m13, this.m14,
                this.m21, this.m22, this.m23, this.m24,
                this.m31, this.m32, this.m33, this.m34,
                this.m41, this.m42, this.m43, this.m44,
            ];
        }
    }

    public toString(): string {
        return (
            `{m11: ${this.m11}, m12: ${this.m12}, m13: ${this.m13}, m14: ${this.m14},\n` +
            ` m21: ${this.m21}, m22: ${this.m22}, m23: ${this.m23}, m24: ${this.m24},\n` +
            ` m31: ${this.m31}, m32: ${this.m32}, m33: ${this.m33}, m34: ${this.m34},\n` +
            ` m41: ${this.m41}, m42: ${this.m42}, m43: ${this.m43}, m44: ${this.m44}}`
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
        this.m14 += this.m11 * tx + this.m12 * ty + this.m13 * tz;
        this.m24 += this.m21 * tx + this.m22 * ty + this.m23 * tz;
        this.m34 += this.m31 * tx + this.m32 * ty + this.m33 * tz;
        this.m44 += this.m41 * tx + this.m42 * ty + this.m43 * tz;
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
        this.m11 += this.m41 * tx;
        this.m12 += this.m42 * tx;
        this.m13 += this.m43 * tx;
        this.m14 += this.m44 * tx;
        this.m21 += this.m41 * ty;
        this.m22 += this.m42 * ty;
        this.m23 += this.m43 * ty;
        this.m24 += this.m44 * ty;
        this.m31 += this.m41 * tz;
        this.m32 += this.m42 * tz;
        this.m33 += this.m43 * tz;
        this.m34 += this.m44 * tz;
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

export class Matrix4 {
    public data: Float64Array;

    constructor(data: Float64Array) {
        this.data = data;
    }

    public add(mat: Matrix4): Matrix4 {
        const d = new Float64Array(16);
        const d1 = this.data;
        const d2 = mat.data;

        d[0] = d1[0] + d2[0];
        d[1] = d1[1] + d2[1];
        d[2] = d1[2] + d2[2];
        d[3] = d1[3] + d2[3];
        d[4] = d1[4] + d2[4];
        d[5] = d1[5] + d2[5];
        d[6] = d1[6] + d2[6];
        d[7] = d1[7] + d2[7];
        d[8] = d1[8] + d2[8];
        d[9] = d1[9] + d2[9];
        d[10] = d1[10] + d2[10];
        d[11] = d1[11] + d2[11];
        d[12] = d1[12] + d2[12];
        d[13] = d1[13] + d2[13];
        d[14] = d1[14] + d2[14];
        d[15] = d1[15] + d2[15];

        return new Matrix4(d);
    }

    public clone(): Matrix4 {
        const data = new Float64Array(this.data);
        return new Matrix4(data);
    }
}
