import type { FixedSizeArray } from "../utility/types.js";
import { Complex } from "./complex.js";
import { Point2, Point3 } from "./point.js";
import { Quaternion } from "./quaternion.js";
import { Vector2, Vector3, Vector4 } from "./vector.js";

export type MatrixElements3A = FixedSizeArray<number, 6>;
export type MatrixElements3 = FixedSizeArray<number, 9>;
export type MatrixElements4A = FixedSizeArray<number, 12>;
export type MatrixElements4 = FixedSizeArray<number, 16>;

export enum MatrixType {
    Affine,
    Projective,
}

/**
 * Represents a column-major matrix for affine transformations in 2D:
 * ```
 * | e0  e2  e4 |
 * | e1  e3  e5 |
 * |  0   0   1 |
 * ```
 */
export class Matrix3A {
    public readonly elements: MatrixElements3A;

    /**
     * ```
     * | e0  e2  e4 |
     * | e1  e3  e5 |
     * |  0   0   1 |
     * ```
     */
    public constructor(elements: MatrixElements3A) {
        this.elements = elements;
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
    public static createIdentity(): Matrix3A {
        return new Matrix3A([1, 0, 0, 1, 0, 0]);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0): Matrix3A {
        const e = elements;
        const i = offset;

        return new Matrix3A([e[i + 0], e[i + 1], e[i + 2], e[i + 3], e[i + 4], e[i + 5]]);
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromRotation(za: number, zb: number): Matrix3A {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        return new Matrix3A([z0, z1, z2, z3, 0, 0]);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number): Matrix3A {
        return new Matrix3A([sx, 0, 0, sy, 0, 0]);
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3A {
        return new Matrix3A([1, 0, 0, 1, tx, ty]);
    }

    public clone(): Matrix3A {
        return new Matrix3A([...this.elements]);
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat3(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[3];
        ea[3] = eb[4];
        ea[4] = eb[6];
        ea[5] = eb[7];
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat3A(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[3];
        ea[4] = eb[4];
        ea[5] = eb[5];
    }

    /**
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;
        return e[0] * e[3] - e[1] * e[2];
    }

    public eq(mat: Matrix3A): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            eb[0] === ea[0] &&
            eb[1] === ea[1] &&
            eb[2] === ea[2] &&
            eb[3] === ea[3] &&
            eb[4] === ea[4] &&
            eb[5] === ea[5]
        );
    }

    public extractSRT(): { s: Vector2; r: Complex; t: Point2 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
        const sy = Math.sqrt(e[2] * e[2] + e[3] * e[3]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;

        const s = new Vector2(sx, sy);
        const r = new Complex(fx * e[0], fx * e[1]);
        const t = new Point2(e[4], e[5]);

        return { s, r, t };
    }

    /**
     * Returns the inverse of the matrix.
     */
    public inverse(): Matrix3A {
        const det = this.determinant();

        if (det === 0) {
            return Matrix3A.createIdentity();
        }

        const detInv = 1 / det;
        const e = this.elements;

        const e0 = detInv * e[3];
        const e1 = detInv * -e[1];
        const e2 = detInv * -e[2];
        const e3 = detInv * e[0];
        const e4 = -(e[4] * e0 + e[5] * e2);
        const e5 = -(e[4] * e1 + e[5] * e3);

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | eb0  eb2  eb4 |
     * | ea1  ea3  ea5 | * | eb1  eb3  eb5 |
     * |   0    0    1 |   |   0    0    1 |
     * ```
     */
    public mul(mat: Matrix3A): Matrix3A {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] * eb[0] + ea[2] * eb[1];
        const e1 = ea[1] * eb[0] + ea[3] * eb[1];

        const e2 = ea[0] * eb[2] + ea[2] * eb[3];
        const e3 = ea[1] * eb[2] + ea[3] * eb[3];

        const e4 = ea[0] * eb[4] + ea[2] * eb[5] + ea[4];
        const e5 = ea[1] * eb[4] + ea[3] * eb[5] + ea[5];

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 1 |
     * ```
     */
    public mulPt2(p: Point2): Point2 {
        const e = this.elements;

        const x = e[0] * p.x + e[2] * p.y + e[4];
        const y = e[1] * p.x + e[3] * p.y + e[5];

        return new Point2(x, y);
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | eb0  eb2  eb4 |
     * | ea1  ea3  ea5 | * | eb1  eb3  eb5 |
     * |   0    0    1 |   |   0    0    1 |
     * ```
     */
    public mulSet(mat1: Matrix3A, mat2: Matrix3A): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] * eb[0] + ea[2] * eb[1];
        const e1 = ea[1] * eb[0] + ea[3] * eb[1];

        const e2 = ea[0] * eb[2] + ea[2] * eb[3];
        const e3 = ea[1] * eb[2] + ea[3] * eb[3];

        const e4 = ea[0] * eb[4] + ea[2] * eb[5] + ea[4];
        const e5 = ea[1] * eb[4] + ea[3] * eb[5] + ea[5];

        this.set(e0, e1, e2, e3, e4, e5);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 1 |
     * ```
     */
    public mulVec2(v: Vector2): Vector2 {
        const e = this.elements;

        const x = e[0] * v.x + e[2] * v.y + e[4];
        const y = e[1] * v.x + e[3] * v.y + e[5];

        return new Vector2(x, y);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | z |
     * ```
     */
    public mulVec3(v: Vector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[2] * v.y + e[4] * v.z;
        const y = e[1] * v.x + e[3] * v.y + e[5] * v.z;
        const z = v.z;

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | z0  z2  0 |   | e0  e2  e4 |
     * | z1  z3  0 | * | e1  e3  e5 |
     * |  0   0  1 |   |  0   0   1 |
     * ```
     */
    public rotate(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const e = this.elements;

        const e0 = z0 * e[0] + z2 * e[1];
        const e1 = z1 * e[0] + z3 * e[1];
        e[0] = e0;
        e[1] = e1;

        const e2 = z0 * e[2] + z2 * e[3];
        const e3 = z1 * e[2] + z3 * e[3];
        e[2] = e2;
        e[3] = e3;

        const e4 = z0 * e[4] + z2 * e[5];
        const e5 = z1 * e[4] + z3 * e[5];
        e[4] = e4;
        e[5] = e5;
    }

    /**
     * ```
     * | e0  e2  e4 |   | z0  z2  0 |
     * | e1  e3  e5 | * | z1  z3  0 |
     * |  0   0   1 |   |  0   0  1 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const e = this.elements;

        const e0 = e[0] * z0 + e[2] * z1;
        const e2 = e[0] * z2 + e[2] * z3;
        e[0] = e0;
        e[2] = e2;

        const e1 = e[1] * z0 + e[3] * z1;
        const e3 = e[1] * z2 + e[3] * z3;
        e[1] = e1;
        e[3] = e3;
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public rotateSet(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        this.set(z0, z1, z2, z3, 0, 0);
    }

    /**
     * ```
     * | sx   0  0 |   | e0  e2  e4 |
     * |  0  sy  0 | * | e1  e3  e5 |
     * |  0   0  1 |   |  0   0   1 |
     * ```
     */
    public scale(sx: number, sy: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sy;

        e[2] *= sx;
        e[3] *= sy;

        e[4] *= sx;
        e[5] *= sy;
    }

    /**
     * ```
     * | e0  e2  e4 |   | sx   0  0 |
     * | e1  e3  e5 | * |  0  sy  0 |
     * |  0   0   1 |   |  0   0  1 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sx;

        e[2] *= sy;
        e[3] *= sy;
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public scaleSet(sx: number, sy: number): void {
        this.set(sx, 0, 0, sy, 0, 0);
    }

    /**
     * ```
     * | e0  e2  e4 |
     * | e1  e3  e5 |
     * |  0   0   1 |
     * ```
     */
    public set(e0: number, e1: number, e2: number, e3: number, e4: number, e5: number): void {
        const e = this.elements;

        e[0] = e0;
        e[1] = e1;
        e[2] = e2;
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;
    }

    public toArray(): MatrixElements3A {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e2: ${e[2]}, e4: ${e[3]},\n` +
            ` e1: ${e[1]}, e3: ${e[3]}, e5: ${e[5]}}`
        );
    }

    /**
     * ```
     * | 1  0  tx |   | e0  e2  e4 |
     * | 0  1  ty | * | e1  e3  e5 |
     * | 0  0   1 |   |  0   0   1 |
     * ```
     */
    public translate(tx: number, ty: number): void {
        const e = this.elements;

        e[4] += tx;
        e[5] += ty;
    }

    /**
     * ```
     * | e0  e2  e4 |   | 1  0  tx |
     * | e1  e3  e5 | * | 0  1  ty |
     * |  0   0   1 |   | 0  0   1 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        const e = this.elements;

        e[4] += e[0] * tx + e[2] * ty;
        e[5] += e[1] * tx + e[3] * ty;
    }

    /**
     * ```
     * | 1  0  ty |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, 0, 1, tx, ty);
    }

    /**
     * Returns the transpose of the matrix.
     */
    public transpose(): Matrix3 {
        const e = this.elements;
        return new Matrix3([e[0], e[2], e[4], e[1], e[3], e[5], 0, 0, 1]);
    }
}

/**
 * Represents a column-major matrix for projective transformations in 2D:
 * ```
 * | e0  e3  e6 |
 * | e1  e4  e7 |
 * | e2  e5  e8 |
 * ```
 */
export class Matrix3 {
    public readonly elements: MatrixElements3;

    /**
     * ```
     * | e0  e3  e6 |
     * | e1  e4  e7 |
     * | e2  e5  e8 |
     * ```
     */
    public constructor(elements: MatrixElements3) {
        this.elements = elements;
    }

    public get type(): MatrixType.Projective {
        return MatrixType.Projective;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix3 {
        return new Matrix3([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | 0  0  0 |
     * | 0  0  0 |
     * | 0  0  0 |
     * ```
     */
    public static createZero(): Matrix3 {
        return new Matrix3([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0): Matrix3 {
        const e = elements;
        const i = offset;

        return new Matrix3([e[i + 0], e[i + 1], e[i + 2], e[i + 3], e[i + 4], e[i + 5], e[i + 6], e[i + 7], e[i + 8]]);
    }

    /**
     * Creates a matrix from `mat` by omitting the projection and translation parts.
     */
    public static fromMat4(mat: Matrix4): Matrix3 {
        const e = mat.elements;
        return new Matrix3([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]]);
    }

    /**
     * Creates a matrix from `mat` by omitting the translation part.
     */
    public static fromMat4A(mat: Matrix4A): Matrix3 {
        const e = mat.elements;
        return new Matrix3([e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]);
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromRotation(za: number, zb: number): Matrix3 {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        return new Matrix3([z0, z1, 0, z2, z3, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number): Matrix3 {
        return new Matrix3([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | 1  0  tx |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3 {
        return new Matrix3([1, 0, 0, 0, 1, 0, tx, ty, 1]);
    }

    public add(mat: Matrix3): Matrix3 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] + eb[0];
        const e1 = ea[1] + eb[1];
        const e2 = ea[2] + eb[2];
        const e3 = ea[3] + eb[3];
        const e4 = ea[4] + eb[4];
        const e5 = ea[5] + eb[5];
        const e6 = ea[6] + eb[6];
        const e7 = ea[7] + eb[7];
        const e8 = ea[8] + eb[8];

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
    }

    public addSet(mat1: Matrix3, mat2: Matrix3): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] + eb[0];
        const e1 = ea[1] + eb[1];
        const e2 = ea[2] + eb[2];
        const e3 = ea[3] + eb[3];
        const e4 = ea[4] + eb[4];
        const e5 = ea[5] + eb[5];
        const e6 = ea[6] + eb[6];
        const e7 = ea[7] + eb[7];
        const e8 = ea[8] + eb[8];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8);
    }

    public clone(): Matrix3 {
        return new Matrix3([...this.elements]);
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat3(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[3];
        ea[4] = eb[4];
        ea[5] = eb[5];
        ea[6] = eb[6];
        ea[7] = eb[7];
        ea[8] = eb[8];
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat3A(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = 0;
        ea[3] = eb[2];
        ea[4] = eb[3];
        ea[5] = 0;
        ea[6] = eb[4];
        ea[7] = eb[5];
        ea[8] = 1;
    }

    /**
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;

        const a = e[8] * (e[0] * e[4] - e[1] * e[3]);
        const b = e[5] * (e[0] * e[7] - e[1] * e[6]);
        const c = e[2] * (e[3] * e[7] - e[4] * e[6]);

        return a - b + c;
    }

    public eq(mat: Matrix3): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            eb[0] === ea[0] &&
            eb[1] === ea[1] &&
            eb[2] === ea[2] &&
            eb[3] === ea[3] &&
            eb[4] === ea[4] &&
            eb[5] === ea[5] &&
            eb[6] === ea[6] &&
            eb[7] === ea[7] &&
            eb[8] === ea[8]
        );
    }

    public extractSRT(): { s: Vector2; r: Complex; t: Point2 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
        const sy = Math.sqrt(e[3] * e[3] + e[4] * e[4] + e[5] * e[5]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;

        const s = new Vector2(sx, sy);
        const r = new Complex(fx * e[0], fx * e[1]);
        const t = new Point2(e[6], e[7]);

        return { s, r, t };
    }

    /**
     * Returns the inverse of the matrix.
     */
    public inverse(): Matrix3 {
        const det = this.determinant();

        if (det === 0) {
            return Matrix3.createIdentity();
        }

        const detInv = 1 / det;
        const e = this.elements;

        const e0 = detInv * (e[4] * e[8] - e[5] * e[7]);
        const e1 = detInv * (e[2] * e[7] - e[1] * e[8]);
        const e2 = detInv * (e[1] * e[5] - e[2] * e[4]);
        const e3 = detInv * (e[5] * e[6] - e[3] * e[8]);
        const e4 = detInv * (e[0] * e[8] - e[2] * e[6]);
        const e5 = detInv * (e[2] * e[3] - e[0] * e[5]);
        const e6 = detInv * (e[3] * e[7] - e[4] * e[6]);
        const e7 = detInv * (e[1] * e[6] - e[0] * e[7]);
        const e8 = detInv * (e[0] * e[4] - e[1] * e[3]);

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | * | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public mul(mat: Matrix3): Matrix3 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] * eb[0] + ea[3] * eb[1] + ea[6] * eb[2];
        const e1 = ea[1] * eb[0] + ea[4] * eb[1] + ea[7] * eb[2];
        const e2 = ea[2] * eb[0] + ea[5] * eb[1] + ea[8] * eb[2];

        const e3 = ea[0] * eb[3] + ea[3] * eb[4] + ea[6] * eb[5];
        const e4 = ea[1] * eb[3] + ea[4] * eb[4] + ea[7] * eb[5];
        const e5 = ea[2] * eb[3] + ea[5] * eb[4] + ea[8] * eb[5];

        const e6 = ea[0] * eb[6] + ea[3] * eb[7] + ea[6] * eb[8];
        const e7 = ea[1] * eb[6] + ea[4] * eb[7] + ea[7] * eb[8];
        const e8 = ea[2] * eb[6] + ea[5] * eb[7] + ea[8] * eb[8];

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 1 |
     * ```
     */
    public mulPt2(p: Point2): Point2 {
        const e = this.elements;

        const x = e[0] * p.x + e[3] * p.y + e[6];
        const y = e[1] * p.x + e[4] * p.y + e[7];
        const w = e[2] * p.x + e[5] * p.y + e[8];

        return Point2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | * | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public mulSet(mat1: Matrix3, mat2: Matrix3): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] * eb[0] + ea[3] * eb[1] + ea[6] * eb[2];
        const e1 = ea[1] * eb[0] + ea[4] * eb[1] + ea[7] * eb[2];
        const e2 = ea[2] * eb[0] + ea[5] * eb[1] + ea[8] * eb[2];

        const e3 = ea[0] * eb[3] + ea[3] * eb[4] + ea[6] * eb[5];
        const e4 = ea[1] * eb[3] + ea[4] * eb[4] + ea[7] * eb[5];
        const e5 = ea[2] * eb[3] + ea[5] * eb[4] + ea[8] * eb[5];

        const e6 = ea[0] * eb[6] + ea[3] * eb[7] + ea[6] * eb[8];
        const e7 = ea[1] * eb[6] + ea[4] * eb[7] + ea[7] * eb[8];
        const e8 = ea[2] * eb[6] + ea[5] * eb[7] + ea[8] * eb[8];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 1 |
     * ```
     */
    public mulVec2(v: Vector2): Vector2 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6];
        const y = e[1] * v.x + e[4] * v.y + e[7];
        const w = e[2] * v.x + e[5] * v.y + e[8];

        return Vector2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | z |
     * ```
     */
    public mulVec3(v: Vector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z;
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z;
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z;

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | z0  z2  0 |   | e0  e3  e6 |
     * | z1  z3  0 | * | e1  e4  e7 |
     * |  0   0  1 |   | e2  e5  e8 |
     * ```
     */
    public rotate(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const e = this.elements;

        const e0 = z0 * e[0] + z2 * e[1];
        const e1 = z1 * e[0] + z3 * e[1];
        e[0] = e0;
        e[1] = e1;

        const e3 = z0 * e[3] + z2 * e[4];
        const e4 = z1 * e[3] + z3 * e[4];
        e[3] = e3;
        e[4] = e4;

        const e6 = z0 * e[6] + z2 * e[7];
        const e7 = z1 * e[6] + z3 * e[7];
        e[6] = e6;
        e[7] = e7;
    }

    /**
     * ```
     * | e0  e3  e6 |   | z0  z2  0 |
     * | e1  e4  e7 | * | z1  z3  0 |
     * | e2  e5  e8 |   |  0   0  1 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const e = this.elements;

        const e0 = e[0] * z0 + e[3] * z1;
        const e3 = e[0] * z2 + e[3] * z3;
        e[0] = e0;
        e[3] = e3;

        const e1 = e[1] * z0 + e[4] * z1;
        const e4 = e[1] * z2 + e[4] * z3;
        e[1] = e1;
        e[4] = e4;

        const e2 = e[2] * z0 + e[5] * z1;
        const e5 = e[2] * z2 + e[5] * z3;
        e[2] = e2;
        e[5] = e5;
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public rotateSet(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        this.set(z0, z1, 0, z2, z3, 0, 0, 0, 1);
    }

    /**
     * ```
     * | sx   0  0 |   | e0  e3  e6 |
     * |  0  sy  0 | * | e1  e4  e7 |
     * |  0   0  1 |   | e2  e5  e8 |
     * ```
     */
    public scale(sx: number, sy: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sy;

        e[3] *= sx;
        e[4] *= sy;

        e[6] *= sx;
        e[7] *= sy;
    }

    /**
     * ```
     * | e0  e3  e6 |   | sx   0  0 |
     * | e1  e4  e7 | * |  0  sy  0 |
     * | e2  e5  e8 |   |  0   0  1 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sx;
        e[2] *= sx;

        e[3] *= sy;
        e[4] *= sy;
        e[5] *= sy;
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
     * | e0  e3  e6 |
     * | e1  e4  e7 |
     * | e2  e5  e8 |
     * ```
     */
    public set(
        e0: number,
        e1: number,
        e2: number,
        e3: number,
        e4: number,
        e5: number,
        e6: number,
        e7: number,
        e8: number,
    ): void {
        const e = this.elements;

        e[0] = e0;
        e[1] = e1;
        e[2] = e2;
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;
        e[6] = e6;
        e[7] = e7;
        e[8] = e8;
    }

    public sub(mat: Matrix3): Matrix3 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] - eb[0];
        const e1 = ea[1] - eb[1];
        const e2 = ea[2] - eb[2];
        const e3 = ea[3] - eb[3];
        const e4 = ea[4] - eb[4];
        const e5 = ea[5] - eb[5];
        const e6 = ea[6] - eb[6];
        const e7 = ea[7] - eb[7];
        const e8 = ea[8] - eb[8];

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
    }

    public subSet(mat1: Matrix3, mat2: Matrix3): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] - eb[0];
        const e1 = ea[1] - eb[1];
        const e2 = ea[2] - eb[2];
        const e3 = ea[3] - eb[3];
        const e4 = ea[4] - eb[4];
        const e5 = ea[5] - eb[5];
        const e6 = ea[6] - eb[6];
        const e7 = ea[7] - eb[7];
        const e8 = ea[8] - eb[8];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8);
    }

    public toArray(): MatrixElements3 {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e3: ${e[3]}, e6: ${e[6]},\n` +
            ` e1: ${e[1]}, e4: ${e[4]}, e7: ${e[7]},\n` +
            ` e2: ${e[2]}, e5: ${e[5]}, e8: ${e[8]}}`
        );
    }

    /**
     * ```
     * | 1  0  tx |   | e0  e3  e6 |
     * | 0  1  ty | * | e1  e4  e7 |
     * | 0  0   1 |   | e2  e5  e8 |
     * ```
     */
    public translate(tx: number, ty: number): void {
        const e = this.elements;

        e[0] += tx * e[2];
        e[1] += ty * e[2];

        e[3] += tx * e[5];
        e[4] += ty * e[5];

        e[6] += tx * e[8];
        e[7] += ty * e[8];
    }

    /**
     * ```
     * | e0  e3  e6 |   | 1  0  tx |
     * | e1  e4  e7 | * | 0  1  ty |
     * | e2  e5  e8 |   | 0  0   1 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        const e = this.elements;

        e[6] += e[0] * tx + e[3] * ty;
        e[7] += e[1] * tx + e[4] * ty;
        e[8] += e[2] * tx + e[5] * ty;
    }

    /**
     * ```
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, 0, 0, 1, 0, tx, ty, 1);
    }

    /**
     * Returns the transpose of the matrix.
     */
    public transpose(): Matrix3 {
        const e = this.elements;
        return new Matrix3([e[0], e[3], e[6], e[1], e[4], e[7], e[2], e[5], e[8]]);
    }
}

/**
 * Represents a column-major matrix for affine transformations in 3D:
 * ```
 * | e0  e3  e6   e9 |
 * | e1  e4  e7  e10 |
 * | e2  e5  e8  e11 |
 * |  0   0   0    1 |
 * ```
 */
export class Matrix4A {
    public readonly elements: MatrixElements4A;

    /**
     * ```
     * | e0  e3  e6   e9 |
     * | e1  e4  e7  e10 |
     * | e2  e5  e8  e11 |
     * |  0   0   0    1 |
     * ```
     */
    public constructor(elements: MatrixElements4A) {
        this.elements = elements;
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
    public static createIdentity(): Matrix4A {
        return new Matrix4A([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0): Matrix4A {
        const e = elements;
        const i = offset;

        return new Matrix4A([
            e[i + 0],
            e[i + 1],
            e[i + 2],
            e[i + 3],
            e[i + 4],
            e[i + 5],
            e[i + 6],
            e[i + 7],
            e[i + 8],
            e[i + 9],
            e[i + 10],
            e[i + 11],
        ]);
    }

    /**
     * Creates a matrix from `mat`.
     */
    public static fromMat3(mat: Matrix3): Matrix4A {
        const e = mat.elements;
        return new Matrix4A([e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], 0, 0, 0]);
    }

    /**
     * Creates a matrix from `mat`.
     */
    public static fromMat4(mat: Matrix4): Matrix4A {
        const e = mat.elements;
        return new Matrix4A([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10], e[12], e[13], e[14]]);
    }

    /**
     * Returns a right-handed orthographic projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::orthoRH_NO`.
     */
    public static fromOrthographicFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4A {
        // | e0   0   0   e9 |
        // |  0  e4   0  e10 |
        // |  0   0  e8  e11 |
        // |  0   0   0    1 |
        const e0 = 2 / (right - left);
        const e4 = 2 / (top - bottom);
        const e8 = 1 / (near - far);
        const e9 = (left + right) / (left - right);
        const e10 = (bottom + top) / (bottom - top);
        const e11 = near / (near - far);

        return new Matrix4A([e0, 0, 0, 0, e4, 0, 0, 0, e8, e9, e10, e11]);
    }

    /**
     * Returns a right-handed orthographic projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::orthoRH_ZO`.
     */
    public static fromOrthographicFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4A {
        // | e0   0   0   e9 |
        // |  0  e4   0  e10 |
        // |  0   0  e8  e11 |
        // |  0   0   0    1 |
        const e0 = 2 / (right - left);
        const e4 = 2 / (top - bottom);
        const e8 = 2 / (near - far);
        const e9 = (left + right) / (left - right);
        const e10 = (bottom + top) / (bottom - top);
        const e11 = (near + far) / (near - far);

        return new Matrix4A([e0, 0, 0, 0, e4, 0, 0, 0, e8, e9, e10, e11]);
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromRotation(qa: number, qb: number, qc: number, qd: number): Matrix4A {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        return new Matrix4A([q0, q1, q2, q3, q4, q5, q6, q7, q8, 0, 0, 0]);
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number, sz: number): Matrix4A {
        return new Matrix4A([sx, 0, 0, 0, sy, 0, 0, 0, sz, 0, 0, 0]);
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4A {
        return new Matrix4A([1, 0, 0, 0, 1, 0, 0, 0, 1, tx, ty, tz]);
    }

    public clone(): Matrix4A {
        return new Matrix4A([...this.elements]);
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat4(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[4];
        ea[4] = eb[5];
        ea[5] = eb[6];
        ea[6] = eb[8];
        ea[7] = eb[9];
        ea[8] = eb[10];
        ea[9] = eb[12];
        ea[10] = eb[13];
        ea[11] = eb[14];
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat4A(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[3];
        ea[4] = eb[4];
        ea[5] = eb[5];
        ea[6] = eb[6];
        ea[7] = eb[7];
        ea[8] = eb[8];
        ea[9] = eb[9];
        ea[10] = eb[10];
        ea[11] = eb[11];
    }

    /**
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;

        const a = e[8] * (e[0] * e[4] - e[1] * e[3]);
        const b = e[5] * (e[0] * e[7] - e[1] * e[6]);
        const c = e[2] * (e[3] * e[7] - e[4] * e[6]);

        return a - b + c;
    }

    public eq(mat: Matrix4A): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            eb[0] === ea[0] &&
            eb[1] === ea[1] &&
            eb[2] === ea[2] &&
            eb[3] === ea[3] &&
            eb[4] === ea[4] &&
            eb[5] === ea[5] &&
            eb[6] === ea[6] &&
            eb[7] === ea[7] &&
            eb[8] === ea[8] &&
            eb[9] === ea[9] &&
            eb[10] === ea[10] &&
            eb[11] === ea[11]
        );
    }

    public extractSRT(): { s: Vector3; r: Quaternion; t: Point3 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
        const sy = Math.sqrt(e[3] * e[3] + e[4] * e[4] + e[5] * e[5]);
        const sz = Math.sqrt(e[6] * e[6] + e[7] * e[7] + e[8] * e[8]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;
        const fy = 1 / sy;
        const fz = 1 / sz;

        const s = new Vector3(sx, sy, sz);
        const r = Quaternion.fromRotationMatrix(
            fx * e[0],
            fx * e[1],
            fx * e[2],
            fy * e[3],
            fy * e[4],
            fy * e[5],
            fz * e[6],
            fz * e[7],
            fz * e[8],
        );
        const t = new Point3(e[9], e[10], e[11]);

        return { s, r, t };
    }

    /**
     * Returns the inverse of the matrix.
     */
    public inverse(): Matrix4A {
        const det = this.determinant();

        if (det === 0) {
            return Matrix4A.createIdentity();
        }

        const detInv = 1 / det;
        const e = this.elements;

        const e0 = detInv * (e[4] * e[8] - e[5] * e[7]);
        const e1 = detInv * (e[2] * e[7] - e[1] * e[8]);
        const e2 = detInv * (e[1] * e[5] - e[2] * e[4]);
        const e3 = detInv * (e[5] * e[6] - e[3] * e[8]);
        const e4 = detInv * (e[0] * e[8] - e[2] * e[6]);
        const e5 = detInv * (e[2] * e[3] - e[0] * e[5]);
        const e6 = detInv * (e[3] * e[7] - e[4] * e[6]);
        const e7 = detInv * (e[1] * e[6] - e[0] * e[7]);
        const e8 = detInv * (e[0] * e[4] - e[1] * e[3]);
        const e9 = -(e[9] * e0 + e[10] * e3 + e[11] * e6);
        const e10 = -(e[9] * e1 + e[10] * e4 + e[11] * e7);
        const e11 = -(e[9] * e2 + e[10] * e5 + e[11] * e8);

        return new Matrix4A([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11]);
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | eb0  eb3  eb6   eb9 |
     * | ea1  ea4  ea7  ea10 | * | eb1  eb4  eb7  ea10 |
     * | ea2  ea5  ea8  ea11 |   | eb2  eb5  eb8  eb11 |
     * |   0    0    0     1 |   |   0    0    0     1 |
     * ```
     */
    public mul(mat: Matrix4A): Matrix4A {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] * eb[0] + ea[3] * eb[1] + ea[6] * eb[2];
        const e1 = ea[1] * eb[0] + ea[4] * eb[1] + ea[7] * eb[2];
        const e2 = ea[2] * eb[0] + ea[5] * eb[1] + ea[8] * eb[2];

        const e3 = ea[0] * eb[3] + ea[3] * eb[4] + ea[6] * eb[5];
        const e4 = ea[1] * eb[3] + ea[4] * eb[4] + ea[7] * eb[5];
        const e5 = ea[2] * eb[3] + ea[5] * eb[4] + ea[8] * eb[5];

        const e6 = ea[0] * eb[6] + ea[3] * eb[7] + ea[6] * eb[8];
        const e7 = ea[1] * eb[6] + ea[4] * eb[7] + ea[7] * eb[8];
        const e8 = ea[2] * eb[6] + ea[5] * eb[7] + ea[8] * eb[8];

        const e9 = ea[0] * eb[9] + ea[3] * eb[10] + ea[6] * eb[11] + ea[9];
        const e10 = ea[1] * eb[9] + ea[4] * eb[10] + ea[7] * eb[11] + ea[10];
        const e11 = ea[2] * eb[9] + ea[5] * eb[10] + ea[8] * eb[11] + ea[11];

        return new Matrix4A([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11]);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 1 |
     * ```
     */
    public mulPt3(p: Point3): Point3 {
        const e = this.elements;

        const x = e[0] * p.x + e[3] * p.y + e[6] * p.z + e[9];
        const y = e[1] * p.x + e[4] * p.y + e[7] * p.z + e[10];
        const z = e[2] * p.x + e[5] * p.y + e[8] * p.z + e[11];

        return new Point3(x, y, z);
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | eb0  eb3  eb6   eb9 |
     * | ea1  ea4  ea7  ea10 | * | eb1  eb4  eb7  ea10 |
     * | ea2  ea5  ea8  ea11 |   | eb2  eb5  eb8  eb11 |
     * |   0    0    0     1 |   |   0    0    0     1 |
     * ```
     */
    public mulSet(mat1: Matrix4A, mat2: Matrix4A): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] * eb[0] + ea[3] * eb[1] + ea[6] * eb[2];
        const e1 = ea[1] * eb[0] + ea[4] * eb[1] + ea[7] * eb[2];
        const e2 = ea[2] * eb[0] + ea[5] * eb[1] + ea[8] * eb[2];

        const e3 = ea[0] * eb[3] + ea[3] * eb[4] + ea[6] * eb[5];
        const e4 = ea[1] * eb[3] + ea[4] * eb[4] + ea[7] * eb[5];
        const e5 = ea[2] * eb[3] + ea[5] * eb[4] + ea[8] * eb[5];

        const e6 = ea[0] * eb[6] + ea[3] * eb[7] + ea[6] * eb[8];
        const e7 = ea[1] * eb[6] + ea[4] * eb[7] + ea[7] * eb[8];
        const e8 = ea[2] * eb[6] + ea[5] * eb[7] + ea[8] * eb[8];

        const e9 = ea[0] * eb[9] + ea[3] * eb[10] + ea[6] * eb[11] + ea[9];
        const e10 = ea[1] * eb[9] + ea[4] * eb[10] + ea[7] * eb[11] + ea[10];
        const e11 = ea[2] * eb[9] + ea[5] * eb[10] + ea[8] * eb[11] + ea[11];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 1 |
     * ```
     */
    public mulVec3(v: Vector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z + e[9];
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z + e[10];
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z + e[11];

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | w |
     * ```
     */
    public mulVec4(v: Vector4): Vector4 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z + e[9] * v.w;
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z + e[10] * v.w;
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z + e[11] * v.w;
        const w = v.w;

        return new Vector4(x, y, z, w);
    }

    /**
     * ```
     * | q0  q3  q6  0 |   | e0  e3  e6   e9 |
     * | q1  q4  q7  0 | * | e1  e4  e7  e10 |
     * | q2  q5  q8  0 |   | e2  e5  e8  e11 |
     * |  0   0   0  1 |   |  0   0   0    1 |
     * ```
     */
    public rotate(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        const e = this.elements;

        const e0 = q0 * e[0] + q3 * e[1] + q6 * e[2];
        const e1 = q1 * e[0] + q4 * e[1] + q7 * e[2];
        const e2 = q2 * e[0] + q5 * e[1] + q8 * e[2];
        e[0] = e0;
        e[1] = e1;
        e[2] = e2;

        const e3 = q0 * e[3] + q3 * e[4] + q6 * e[5];
        const e4 = q1 * e[3] + q4 * e[4] + q7 * e[5];
        const e5 = q2 * e[3] + q5 * e[4] + q8 * e[5];
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;

        const e6 = q0 * e[6] + q3 * e[7] + q6 * e[8];
        const e7 = q1 * e[6] + q4 * e[7] + q7 * e[8];
        const e8 = q2 * e[6] + q5 * e[7] + q8 * e[8];
        e[6] = e6;
        e[7] = e7;
        e[8] = e8;

        const e9 = q0 * e[9] + q3 * e[10] + q6 * e[11];
        const e10 = q1 * e[9] + q4 * e[10] + q7 * e[11];
        const e11 = q2 * e[9] + q5 * e[10] + q8 * e[11];
        e[9] = e9;
        e[10] = e10;
        e[11] = e11;
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | q0  q3  q6  0 |
     * | e1  e4  e7  e10 | * | q1  q4  q7  0 |
     * | e2  e5  e8  e11 |   | q2  q5  q8  0 |
     * |  0   0   0    1 |   |  0   0   0  1 |
     * ```
     */
    public rotatePre(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        const e = this.elements;

        const e0 = e[0] * q0 + e[3] * q1 + e[6] * q2;
        const e3 = e[0] * q3 + e[3] * q4 + e[6] * q5;
        const e6 = e[0] * q6 + e[3] * q7 + e[6] * q8;
        e[0] = e0;
        e[3] = e3;
        e[6] = e6;

        const e1 = e[1] * q0 + e[4] * q1 + e[7] * q2;
        const e4 = e[1] * q3 + e[4] * q4 + e[7] * q5;
        const e7 = e[1] * q6 + e[4] * q7 + e[7] * q8;
        e[1] = e1;
        e[4] = e4;
        e[7] = e7;

        const e2 = e[2] * q0 + e[5] * q1 + e[8] * q2;
        const e5 = e[2] * q3 + e[5] * q4 + e[8] * q5;
        const e8 = e[2] * q6 + e[5] * q7 + e[8] * q8;
        e[2] = e2;
        e[5] = e5;
        e[8] = e8;
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public rotateSet(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        this.set(q0, q1, q2, q3, q4, q5, q6, q7, q8, 0, 0, 0);
    }

    /**
     * ```
     * | sx   0   0  0 |   | e0  e3  e6   e9 |
     * |  0  sy   0  0 | * | e1  e4  e7  e10 |
     * |  0   0  sz  0 |   | e2  e5  e8  e11 |
     * |  0   0   0  1 |   |  0   0   0    1 |
     * ```
     */
    public scale(sx: number, sy: number, sz: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sy;
        e[2] *= sz;

        e[3] *= sx;
        e[4] *= sy;
        e[5] *= sz;

        e[6] *= sx;
        e[7] *= sy;
        e[8] *= sz;

        e[9] *= sx;
        e[10] *= sy;
        e[11] *= sz;
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | sx   0   0  0 |
     * | e1  e4  e7  e10 | * |  0  sy   0  0 |
     * | e2  e5  e8  e11 |   |  0   0  sz  0 |
     * |  0   0   0    1 |   |  0   0   0  1 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sx;
        e[2] *= sx;

        e[3] *= sy;
        e[4] *= sy;
        e[5] *= sy;

        e[6] *= sz;
        e[7] *= sz;
        e[8] *= sz;
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public scaleSet(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, sy, 0, 0, 0, sz, 0, 0, 0);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |
     * | e1  e4  e7  e10 |
     * | e2  e5  e8  e11 |
     * |  0   0   0    1 |
     * ```
     */
    public set(
        e0: number,
        e1: number,
        e2: number,
        e3: number,
        e4: number,
        e5: number,
        e6: number,
        e7: number,
        e8: number,
        e9: number,
        e10: number,
        e11: number,
    ): void {
        const e = this.elements;

        e[0] = e0;
        e[1] = e1;
        e[2] = e2;
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;
        e[6] = e6;
        e[7] = e7;
        e[8] = e8;
        e[9] = e9;
        e[10] = e10;
        e[11] = e11;
    }

    public toArray(): MatrixElements4A {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e3: ${e[3]}, e6: ${e[6]}, e9: ${e[9]},\n` +
            ` e1: ${e[1]}, e4: ${e[4]}, e7: ${e[7]}, e10: ${e[10]},\n` +
            ` e2: ${e[2]}, e5: ${e[5]}, e8: ${e[8]}, e11: ${e[11]}}`
        );
    }

    /**
     * ```
     * | 1  0  0  tx |   | e0  e3  e6   e9 |
     * | 0  1  0  ty | * | e1  e4  e7  e10 |
     * | 0  0  1  tz |   | e2  e5  e8  e11 |
     * | 0  0  0   1 |   |  0   0   0    1 |
     * ```
     */
    public translate(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[9] += tx;
        e[10] += ty;
        e[11] += tz;
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | 1  0  0  tx |
     * | e1  e4  e7  e10 | * | 0  1  0  ty |
     * | e2  e5  e8  e11 |   | 0  0  1  tz |
     * |  0   0   0    1 |   | 0  0  0   1 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[9] += e[0] * tx + e[3] * ty + e[6] * tz;
        e[10] += e[1] * tx + e[4] * ty + e[7] * tz;
        e[11] += e[2] * tx + e[5] * ty + e[8] * tz;
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
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1, tx, ty, tz);
    }

    /**
     * Returns the transpose of the matrix.
     */
    public transpose(): Matrix4 {
        const e = this.elements;
        return new Matrix4([e[0], e[3], e[6], e[9], e[1], e[4], e[7], e[10], e[2], e[5], e[8], e[11], 0, 0, 0, 1]);
    }
}

/**
 * Represents a column-major matrix for projective transformations in 3D:
 * ```
 * | e0  e4   e8  e12 |
 * | e1  e5   e9  e13 |
 * | e2  e6  e10  e14 |
 * | e3  e7  e11  e15 |
 * ```
 */
export class Matrix4 {
    public readonly elements: MatrixElements4;

    /**
     * ```
     * | e0  e4   e8  e12 |
     * | e1  e5   e9  e13 |
     * | e2  e6  e10  e14 |
     * | e3  e7  e11  e15 |
     * ```
     */
    public constructor(elements: MatrixElements4) {
        this.elements = elements;
    }

    public get type(): MatrixType.Projective {
        return MatrixType.Projective;
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public static createIdentity(): Matrix4 {
        return new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * ```
     */
    public static createZero(): Matrix4 {
        return new Matrix4([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }

    public static fromArray(elements: ArrayLike<number>, offset = 0): Matrix4 {
        const e = elements;
        const i = offset;

        return new Matrix4([
            e[i + 0],
            e[i + 1],
            e[i + 2],
            e[i + 3],
            e[i + 4],
            e[i + 5],
            e[i + 6],
            e[i + 7],
            e[i + 8],
            e[i + 9],
            e[i + 10],
            e[i + 11],
            e[i + 12],
            e[i + 13],
            e[i + 14],
            e[i + 15],
        ]);
    }

    /**
     * Creates a matrix from `mat`.
     */
    public static fromMat3(mat: Matrix3): Matrix4 {
        const e = mat.elements;
        return new Matrix4([e[0], e[1], e[2], 0, e[3], e[4], e[5], 0, e[6], e[7], e[8], 0, 0, 0, 0, 1]);
    }

    /**
     * Creates a matrix from `mat`.
     */
    public static fromMat4A(mat: Matrix4A): Matrix4 {
        const e = mat.elements;
        return new Matrix4([e[0], e[1], e[2], 0, e[3], e[4], e[5], 0, e[6], e[7], e[8], 0, e[9], e[10], e[11], 1]);
    }

    /**
     * Returns a right-handed orthographic projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::orthoRH_NO`.
     */
    public static fromOrthographicFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        // | e0   0    0  e12 |
        // |  0  e5    0  e13 |
        // |  0   0  e10  e14 |
        // |  0   0    0    1 |
        const e0 = 2 / (right - left);
        const e5 = 2 / (top - bottom);
        const e10 = 1 / (near - far);
        const e12 = (left + right) / (left - right);
        const e13 = (bottom + top) / (bottom - top);
        const e14 = near / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, 0, e12, e13, e14, 1]);
    }

    /**
     * Returns a right-handed orthographic projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::orthoRH_ZO`.
     */
    public static fromOrthographicFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        // | e0   0    0  e12 |
        // |  0  e5    0  e13 |
        // |  0   0  e10  e14 |
        // |  0   0    0    1 |
        const e0 = 2 / (right - left);
        const e5 = 2 / (top - bottom);
        const e10 = 2 / (near - far);
        const e12 = (left + right) / (left - right);
        const e13 = (bottom + top) / (bottom - top);
        const e14 = (near + far) / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, 0, e12, e13, e14, 1]);
    }

    /**
     * Returns a right-handed perspective projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::perspectiveRH_ZO`.
     */
    public static fromPerspective(fovY: number, aspectRatio: number, near: number, far: number): Matrix4 {
        const cot = 1 / Math.tan(0.5 * fovY);

        // | e0   0    0    0 |
        // |  0  e5    0    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = cot / aspectRatio;
        const e5 = cot;
        const e10 = far / (near - far);
        const e14 = (near * far) / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, -1, 0, 0, e14, 0]);
    }

    /**
     * Returns a right-handed perspective projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::frustumRH_ZO`.
     */
    public static fromPerspectiveFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        // | e0   0   e8    0 |
        // |  0  e5   e9    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = (2 * near) / (right - left);
        const e5 = (2 * near) / (top - bottom);
        const e8 = (left + right) / (right - left);
        const e9 = (bottom + top) / (top - bottom);
        const e10 = far / (near - far);
        const e14 = (near * far) / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, e8, e9, e10, -1, 0, 0, e14, 0]);
    }

    /**
     * Returns a right-handed perspective projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::frustumRH_NO`.
     */
    public static fromPerspectiveFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        // | e0   0   e8    0 |
        // |  0  e5   e9    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = (2 * near) / (right - left);
        const e5 = (2 * near) / (top - bottom);
        const e8 = (left + right) / (right - left);
        const e9 = (bottom + top) / (top - bottom);
        const e10 = (near + far) / (near - far);
        const e14 = (2 * near * far) / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, e8, e9, e10, -1, 0, 0, e14, 0]);
    }

    /**
     * Returns a right-handed perspective projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::perspectiveRH_NO`.
     */
    public static fromPerspectiveGL(fovY: number, aspectRatio: number, near: number, far: number): Matrix4 {
        const cot = 1 / Math.tan(0.5 * fovY);

        // | e0   0    0    0 |
        // |  0  e5    0    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = cot / aspectRatio;
        const e5 = cot;
        const e10 = (near + far) / (near - far);
        const e14 = (2 * far * near) / (near - far);

        return new Matrix4([e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, -1, 0, 0, e14, 0]);
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromRotation(qa: number, qb: number, qc: number, qd: number): Matrix4 {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        return new Matrix4([q0, q1, q2, 0, q3, q4, q5, 0, q6, q7, q8, 0, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number, sz: number): Matrix4 {
        return new Matrix4([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4 {
        return new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
    }

    public add(mat: Matrix4): Matrix4 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] + eb[0];
        const e1 = ea[1] + eb[1];
        const e2 = ea[2] + eb[2];
        const e3 = ea[3] + eb[3];
        const e4 = ea[4] + eb[4];
        const e5 = ea[5] + eb[5];
        const e6 = ea[6] + eb[6];
        const e7 = ea[7] + eb[7];
        const e8 = ea[8] + eb[8];
        const e9 = ea[9] + eb[9];
        const e10 = ea[10] + eb[10];
        const e11 = ea[11] + eb[11];
        const e12 = ea[12] + eb[12];
        const e13 = ea[13] + eb[13];
        const e14 = ea[14] + eb[14];
        const e15 = ea[15] + eb[15];

        return new Matrix4([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]);
    }

    public addSet(mat1: Matrix4, mat2: Matrix4): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] + eb[0];
        const e1 = ea[1] + eb[1];
        const e2 = ea[2] + eb[2];
        const e3 = ea[3] + eb[3];
        const e4 = ea[4] + eb[4];
        const e5 = ea[5] + eb[5];
        const e6 = ea[6] + eb[6];
        const e7 = ea[7] + eb[7];
        const e8 = ea[8] + eb[8];
        const e9 = ea[9] + eb[9];
        const e10 = ea[10] + eb[10];
        const e11 = ea[11] + eb[11];
        const e12 = ea[12] + eb[12];
        const e13 = ea[13] + eb[13];
        const e14 = ea[14] + eb[14];
        const e15 = ea[15] + eb[15];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
    }

    public clone(): Matrix4 {
        return new Matrix4([...this.elements]);
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat4(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[3];
        ea[4] = eb[4];
        ea[5] = eb[5];
        ea[6] = eb[6];
        ea[7] = eb[7];
        ea[8] = eb[8];
        ea[9] = eb[9];
        ea[10] = eb[10];
        ea[11] = eb[11];
        ea[12] = eb[12];
        ea[13] = eb[13];
        ea[14] = eb[14];
        ea[15] = eb[15];
    }

    /**
     * Copies values from `mat` into this matrix.
     */
    public copyFromMat4A(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = 0;
        ea[4] = eb[3];
        ea[5] = eb[4];
        ea[6] = eb[5];
        ea[7] = 0;
        ea[8] = eb[6];
        ea[9] = eb[7];
        ea[10] = eb[8];
        ea[11] = 0;
        ea[12] = eb[9];
        ea[13] = eb[10];
        ea[14] = eb[11];
        ea[15] = 1;
    }

    /**
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;

        const a1 = e[10] * (e[0] * e[5] - e[1] * e[4]);
        const a2 = e[9] * (e[0] * e[6] - e[2] * e[4]);
        const a3 = e[8] * (e[1] * e[6] - e[2] * e[5]);
        const a = e[15] * (a1 - a2 + a3);

        const b1 = e[11] * (e[0] * e[5] - e[1] * e[4]);
        const b2 = e[9] * (e[0] * e[7] - e[3] * e[4]);
        const b3 = e[8] * (e[1] * e[7] - e[3] * e[5]);
        const b = e[14] * (b1 - b2 + b3);

        const c1 = e[11] * (e[0] * e[6] - e[2] * e[4]);
        const c2 = e[10] * (e[0] * e[7] - e[3] * e[4]);
        const c3 = e[8] * (e[2] * e[7] - e[3] * e[6]);
        const c = e[13] * (c1 - c2 + c3);

        const d1 = e[11] * (e[1] * e[6] - e[2] * e[5]);
        const d2 = e[10] * (e[1] * e[7] - e[3] * e[5]);
        const d3 = e[9] * (e[2] * e[7] - e[3] * e[6]);
        const d = e[12] * (d1 - d2 + d3);

        return a - b + c - d;
    }

    public eq(mat: Matrix4): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            eb[0] === ea[0] &&
            eb[1] === ea[1] &&
            eb[2] === ea[2] &&
            eb[3] === ea[3] &&
            eb[4] === ea[4] &&
            eb[5] === ea[5] &&
            eb[6] === ea[6] &&
            eb[7] === ea[7] &&
            eb[8] === ea[8] &&
            eb[9] === ea[9] &&
            eb[10] === ea[10] &&
            eb[11] === ea[11] &&
            eb[12] === ea[12] &&
            eb[13] === ea[13] &&
            eb[14] === ea[14] &&
            eb[15] === ea[15]
        );
    }

    public extractSRT(): { s: Vector3; r: Quaternion; t: Point3 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2] + e[3] * e[3]);
        const sy = Math.sqrt(e[4] * e[4] + e[5] * e[5] + e[6] * e[6] + e[7] * e[7]);
        const sz = Math.sqrt(e[8] * e[8] + e[9] * e[9] + e[10] * e[10] + e[11] * e[11]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;
        const fy = 1 / sy;
        const fz = 1 / sz;

        const s = new Vector3(sx, sy, sz);
        const r = Quaternion.fromRotationMatrix(
            fx * e[0],
            fx * e[1],
            fx * e[2],
            fy * e[4],
            fy * e[5],
            fy * e[6],
            fz * e[8],
            fz * e[9],
            fz * e[10],
        );
        const t = new Point3(e[12], e[13], e[14]);

        return { s, r, t };
    }

    /**
     * Returns the inverse of the matrix.
     */
    public inverse(): Matrix4 {
        const det = this.determinant();

        if (det === 0) {
            return Matrix4.createIdentity();
        }

        const detInv = 1 / det;
        const e = this.elements;

        const e0a = e[15] * (e[5] * e[10] - e[6] * e[9]);
        const e0b = e[14] * (e[5] * e[11] - e[7] * e[9]);
        const e0c = e[13] * (e[6] * e[11] - e[7] * e[10]);
        const e0 = detInv * (e0a - e0b + e0c);

        const e1a = e[15] * (e[2] * e[9] - e[1] * e[10]);
        const e1b = e[14] * (e[3] * e[9] - e[1] * e[11]);
        const e1c = e[13] * (e[3] * e[10] - e[2] * e[11]);
        const e1 = detInv * (e1a - e1b + e1c);

        const e2a = e[15] * (e[1] * e[6] - e[2] * e[5]);
        const e2b = e[14] * (e[1] * e[7] - e[3] * e[5]);
        const e2c = e[13] * (e[2] * e[7] - e[3] * e[6]);
        const e2 = detInv * (e2a - e2b + e2c);

        const e3a = e[11] * (e[2] * e[5] - e[1] * e[6]);
        const e3b = e[10] * (e[3] * e[5] - e[1] * e[7]);
        const e3c = e[9] * (e[3] * e[6] - e[2] * e[7]);
        const e3 = detInv * (e3a - e3b + e3c);

        const e4a = e[15] * (e[6] * e[8] - e[4] * e[10]);
        const e4b = e[14] * (e[7] * e[8] - e[4] * e[11]);
        const e4c = e[12] * (e[7] * e[10] - e[6] * e[11]);
        const e4 = detInv * (e4a - e4b + e4c);

        const e5a = e[15] * (e[0] * e[10] - e[2] * e[8]);
        const e5b = e[14] * (e[0] * e[11] - e[3] * e[8]);
        const e5c = e[12] * (e[2] * e[11] - e[3] * e[10]);
        const e5 = detInv * (e5a - e5b + e5c);

        const e6a = e[15] * (e[2] * e[4] - e[0] * e[6]);
        const e6b = e[14] * (e[3] * e[4] - e[0] * e[7]);
        const e6c = e[12] * (e[3] * e[6] - e[2] * e[7]);
        const e6 = detInv * (e6a - e6b + e6c);

        const e7a = e[11] * (e[0] * e[6] - e[2] * e[4]);
        const e7b = e[10] * (e[0] * e[7] - e[3] * e[4]);
        const e7c = e[8] * (e[2] * e[7] - e[3] * e[6]);
        const e7 = detInv * (e7a - e7b + e7c);

        const e8a = e[15] * (e[4] * e[9] - e[5] * e[8]);
        const e8b = e[13] * (e[4] * e[11] - e[7] * e[8]);
        const e8c = e[12] * (e[5] * e[11] - e[7] * e[9]);
        const e8 = detInv * (e8a - e8b + e8c);

        const e9a = e[15] * (e[1] * e[8] - e[0] * e[9]);
        const e9b = e[13] * (e[3] * e[8] - e[0] * e[11]);
        const e9c = e[12] * (e[3] * e[9] - e[1] * e[11]);
        const e9 = detInv * (e9a - e9b + e9c);

        const e10a = e[15] * (e[0] * e[5] - e[1] * e[4]);
        const e10b = e[13] * (e[0] * e[7] - e[3] * e[4]);
        const e10c = e[12] * (e[1] * e[7] - e[3] * e[5]);
        const e10 = detInv * (e10a - e10b + e10c);

        const e11a = e[11] * (e[1] * e[4] - e[0] * e[5]);
        const e11b = e[9] * (e[3] * e[4] - e[0] * e[7]);
        const e11c = e[8] * (e[3] * e[5] - e[1] * e[7]);
        const e11 = detInv * (e11a - e11b + e11c);

        const e12a = e[14] * (e[5] * e[8] - e[4] * e[9]);
        const e12b = e[13] * (e[6] * e[8] - e[4] * e[10]);
        const e12c = e[12] * (e[6] * e[9] - e[5] * e[10]);
        const e12 = detInv * (e12a - e12b + e12c);

        const e13a = e[14] * (e[0] * e[9] - e[1] * e[8]);
        const e13b = e[13] * (e[0] * e[10] - e[2] * e[8]);
        const e13c = e[12] * (e[1] * e[10] - e[2] * e[9]);
        const e13 = detInv * (e13a - e13b + e13c);

        const e14a = e[14] * (e[1] * e[4] - e[0] * e[5]);
        const e14b = e[13] * (e[2] * e[4] - e[0] * e[6]);
        const e14c = e[12] * (e[2] * e[5] - e[1] * e[6]);
        const e14 = detInv * (e14a - e14b + e14c);

        const e15a = e[10] * (e[0] * e[5] - e[1] * e[4]);
        const e15b = e[9] * (e[0] * e[6] - e[2] * e[4]);
        const e15c = e[8] * (e[1] * e[6] - e[2] * e[5]);
        const e15 = detInv * (e15a - e15b + e15c);

        return new Matrix4([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]);
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | * | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public mul(mat: Matrix4): Matrix4 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] * eb[0] + ea[4] * eb[1] + ea[8] * eb[2] + ea[12] * eb[3];
        const e1 = ea[1] * eb[0] + ea[5] * eb[1] + ea[9] * eb[2] + ea[13] * eb[3];
        const e2 = ea[2] * eb[0] + ea[6] * eb[1] + ea[10] * eb[2] + ea[14] * eb[3];
        const e3 = ea[3] * eb[0] + ea[7] * eb[1] + ea[11] * eb[2] + ea[15] * eb[3];

        const e4 = ea[0] * eb[4] + ea[4] * eb[5] + ea[8] * eb[6] + ea[12] * eb[7];
        const e5 = ea[1] * eb[4] + ea[5] * eb[5] + ea[9] * eb[6] + ea[13] * eb[7];
        const e6 = ea[2] * eb[4] + ea[6] * eb[5] + ea[10] * eb[6] + ea[14] * eb[7];
        const e7 = ea[3] * eb[4] + ea[7] * eb[5] + ea[11] * eb[6] + ea[15] * eb[7];

        const e8 = ea[0] * eb[8] + ea[4] * eb[9] + ea[8] * eb[10] + ea[12] * eb[11];
        const e9 = ea[1] * eb[8] + ea[5] * eb[9] + ea[9] * eb[10] + ea[13] * eb[11];
        const e10 = ea[2] * eb[8] + ea[6] * eb[9] + ea[10] * eb[10] + ea[14] * eb[11];
        const e11 = ea[3] * eb[8] + ea[7] * eb[9] + ea[11] * eb[10] + ea[15] * eb[11];

        const e12 = ea[0] * eb[12] + ea[4] * eb[13] + ea[8] * eb[14] + ea[12] * eb[15];
        const e13 = ea[1] * eb[12] + ea[5] * eb[13] + ea[9] * eb[14] + ea[13] * eb[15];
        const e14 = ea[2] * eb[12] + ea[6] * eb[13] + ea[10] * eb[14] + ea[14] * eb[15];
        const e15 = ea[3] * eb[12] + ea[7] * eb[13] + ea[11] * eb[14] + ea[15] * eb[15];

        return new Matrix4([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 1 |
     * ```
     */
    public mulPt3(p: Point3): Point3 {
        const e = this.elements;

        const x = e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12];
        const y = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13];
        const z = e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14];
        const w = e[3] * p.x + e[7] * p.y + e[11] * p.z + e[15];

        return Point3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | * | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public mulSet(mat1: Matrix4, mat2: Matrix4): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] * eb[0] + ea[4] * eb[1] + ea[8] * eb[2] + ea[12] * eb[3];
        const e1 = ea[1] * eb[0] + ea[5] * eb[1] + ea[9] * eb[2] + ea[13] * eb[3];
        const e2 = ea[2] * eb[0] + ea[6] * eb[1] + ea[10] * eb[2] + ea[14] * eb[3];
        const e3 = ea[3] * eb[0] + ea[7] * eb[1] + ea[11] * eb[2] + ea[15] * eb[3];

        const e4 = ea[0] * eb[4] + ea[4] * eb[5] + ea[8] * eb[6] + ea[12] * eb[7];
        const e5 = ea[1] * eb[4] + ea[5] * eb[5] + ea[9] * eb[6] + ea[13] * eb[7];
        const e6 = ea[2] * eb[4] + ea[6] * eb[5] + ea[10] * eb[6] + ea[14] * eb[7];
        const e7 = ea[3] * eb[4] + ea[7] * eb[5] + ea[11] * eb[6] + ea[15] * eb[7];

        const e8 = ea[0] * eb[8] + ea[4] * eb[9] + ea[8] * eb[10] + ea[12] * eb[11];
        const e9 = ea[1] * eb[8] + ea[5] * eb[9] + ea[9] * eb[10] + ea[13] * eb[11];
        const e10 = ea[2] * eb[8] + ea[6] * eb[9] + ea[10] * eb[10] + ea[14] * eb[11];
        const e11 = ea[3] * eb[8] + ea[7] * eb[9] + ea[11] * eb[10] + ea[15] * eb[11];

        const e12 = ea[0] * eb[12] + ea[4] * eb[13] + ea[8] * eb[14] + ea[12] * eb[15];
        const e13 = ea[1] * eb[12] + ea[5] * eb[13] + ea[9] * eb[14] + ea[13] * eb[15];
        const e14 = ea[2] * eb[12] + ea[6] * eb[13] + ea[10] * eb[14] + ea[14] * eb[15];
        const e15 = ea[3] * eb[12] + ea[7] * eb[13] + ea[11] * eb[14] + ea[15] * eb[15];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 1 |
     * ```
     */
    public mulVec3(v: Vector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12];
        const y = e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13];
        const z = e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14];
        const w = e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15];

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | w |
     * ```
     */
    public mulVec4(v: Vector4): Vector4 {
        const e = this.elements;

        const x = e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12] * v.w;
        const y = e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13] * v.w;
        const z = e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14] * v.w;
        const w = e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15] * v.w;

        return new Vector4(x, y, z, w);
    }

    /**
     * ```
     * | q0  q3  q6  0 |   | e0  e4   e8  e12 |
     * | q1  q4  q7  0 | * | e1  e5   e9  e13 |
     * | q2  q5  q8  0 |   | e2  e6  e10  e14 |
     * |  0   0   0  1 |   | e3  e7  e11  e15 |
     * ```
     */
    public rotate(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        const e = this.elements;

        const e0 = q0 * e[0] + q3 * e[1] + q6 * e[2];
        const e1 = q1 * e[0] + q4 * e[1] + q7 * e[2];
        const e2 = q2 * e[0] + q5 * e[1] + q8 * e[2];
        e[0] = e0;
        e[1] = e1;
        e[2] = e2;

        const e4 = q0 * e[4] + q3 * e[5] + q6 * e[6];
        const e5 = q1 * e[4] + q4 * e[5] + q7 * e[6];
        const e6 = q2 * e[4] + q5 * e[5] + q8 * e[6];
        e[4] = e4;
        e[5] = e5;
        e[6] = e6;

        const e8 = q0 * e[8] + q3 * e[9] + q6 * e[10];
        const e9 = q1 * e[8] + q4 * e[9] + q7 * e[10];
        const e10 = q2 * e[8] + q5 * e[9] + q8 * e[10];
        e[8] = e8;
        e[9] = e9;
        e[10] = e10;

        const e12 = q0 * e[12] + q3 * e[13] + q6 * e[14];
        const e13 = q1 * e[12] + q4 * e[13] + q7 * e[14];
        const e14 = q2 * e[12] + q5 * e[13] + q8 * e[14];
        e[12] = e12;
        e[13] = e13;
        e[14] = e14;
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | q0  q3  q6  0 |
     * | e1  e5   e9  e13 | * | q1  q4  q7  0 |
     * | e2  e6  e10  e14 |   | q2  q5  q8  0 |
     * | e3  e7  e11  e15 |   |  0   0   0  1 |
     * ```
     */
    public rotatePre(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        const e = this.elements;

        const e0 = e[0] * q0 + e[4] * q1 + e[8] * q2;
        const e4 = e[0] * q3 + e[4] * q4 + e[8] * q5;
        const e8 = e[0] * q6 + e[4] * q7 + e[8] * q8;
        e[0] = e0;
        e[4] = e4;
        e[8] = e8;

        const e1 = e[1] * q0 + e[5] * q1 + e[9] * q2;
        const e5 = e[1] * q3 + e[5] * q4 + e[9] * q5;
        const e9 = e[1] * q6 + e[5] * q7 + e[9] * q8;
        e[1] = e1;
        e[5] = e5;
        e[9] = e9;

        const e2 = e[2] * q0 + e[6] * q1 + e[10] * q2;
        const e6 = e[2] * q1 + e[6] * q4 + e[10] * q5;
        const e10 = e[2] * q2 + e[6] * q7 + e[10] * q8;
        e[2] = e2;
        e[6] = e6;
        e[10] = e10;

        const e3 = e[3] * q0 + e[7] * q1 + e[11] * q2;
        const e7 = e[3] * q1 + e[7] * q4 + e[11] * q5;
        const e11 = e[3] * q2 + e[7] * q7 + e[11] * q8;
        e[3] = e3;
        e[7] = e7;
        e[11] = e11;
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public rotateSet(qa: number, qb: number, qc: number, qd: number): void {
        const qaa = qa * qa;
        const qbb = qb * qb;
        const qcc = qc * qc;
        const qdd = qd * qd;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = qb * qc;
        const qad = qa * qd;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        this.set(q0, q1, q2, 0, q3, q4, q5, 0, q6, q7, q8, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | sx   0   0  0 |   | e0  e4   e8  e12 |
     * |  0  sy   0  0 | * | e1  e5   e9  e13 |
     * |  0   0  sz  0 |   | e2  e6  e10  e14 |
     * |  0   0   0  1 |   | e3  e7  e11  e15 |
     * ```
     */
    public scale(sx: number, sy: number, sz: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sy;
        e[2] *= sz;

        e[4] *= sx;
        e[5] *= sy;
        e[6] *= sz;

        e[8] *= sx;
        e[9] *= sy;
        e[10] *= sz;

        e[12] *= sx;
        e[13] *= sy;
        e[14] *= sz;
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | sx   0   0  0 |
     * | e1  e5   e9  e13 | * |  0  sy   0  0 |
     * | e2  e6  e10  e14 |   |  0   0  sz  0 |
     * | e3  e7  e11  e15 |   |  0   0   0  1 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sx;
        e[2] *= sx;
        e[3] *= sx;

        e[4] *= sy;
        e[5] *= sy;
        e[6] *= sy;
        e[7] *= sy;

        e[8] *= sz;
        e[9] *= sz;
        e[10] *= sz;
        e[11] *= sz;
    }

    /**
     * ```
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public scaleSet(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |
     * | e1  e5   e9  e13 |
     * | e2  e6  e10  e14 |
     * | e3  e7  e11  e15 |
     * ```
     */
    public set(
        e0: number,
        e1: number,
        e2: number,
        e3: number,
        e4: number,
        e5: number,
        e6: number,
        e7: number,
        e8: number,
        e9: number,
        e10: number,
        e11: number,
        e12: number,
        e13: number,
        e14: number,
        e15: number,
    ): void {
        const e = this.elements;

        e[0] = e0;
        e[1] = e1;
        e[2] = e2;
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;
        e[6] = e6;
        e[7] = e7;
        e[8] = e8;
        e[9] = e9;
        e[10] = e10;
        e[11] = e11;
        e[12] = e12;
        e[13] = e13;
        e[14] = e14;
        e[15] = e15;
    }

    public sub(mat: Matrix4): Matrix4 {
        const ea = this.elements;
        const eb = mat.elements;

        const e0 = ea[0] - eb[0];
        const e1 = ea[1] - eb[1];
        const e2 = ea[2] - eb[2];
        const e3 = ea[3] - eb[3];
        const e4 = ea[4] - eb[4];
        const e5 = ea[5] - eb[5];
        const e6 = ea[6] - eb[6];
        const e7 = ea[7] - eb[7];
        const e8 = ea[8] - eb[8];
        const e9 = ea[9] - eb[9];
        const e10 = ea[10] - eb[10];
        const e11 = ea[11] - eb[11];
        const e12 = ea[12] - eb[12];
        const e13 = ea[13] - eb[13];
        const e14 = ea[14] - eb[14];
        const e15 = ea[15] - eb[15];

        return new Matrix4([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]);
    }

    public subSet(mat1: Matrix4, mat2: Matrix4): void {
        const ea = mat1.elements;
        const eb = mat2.elements;

        const e0 = ea[0] - eb[0];
        const e1 = ea[1] - eb[1];
        const e2 = ea[2] - eb[2];
        const e3 = ea[3] - eb[3];
        const e4 = ea[4] - eb[4];
        const e5 = ea[5] - eb[5];
        const e6 = ea[6] - eb[6];
        const e7 = ea[7] - eb[7];
        const e8 = ea[8] - eb[8];
        const e9 = ea[9] - eb[9];
        const e10 = ea[10] - eb[10];
        const e11 = ea[11] - eb[11];
        const e12 = ea[12] - eb[12];
        const e13 = ea[13] - eb[13];
        const e14 = ea[14] - eb[14];
        const e15 = ea[15] - eb[15];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
    }

    public toArray(): MatrixElements4 {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e4: ${e[4]}, e8: ${e[8]}, e12: ${e[12]},\n` +
            ` e1: ${e[1]}, e5: ${e[5]}, e9: ${e[9]}, e13: ${e[13]},\n` +
            ` e2: ${e[2]}, e6: ${e[6]}, e10: ${e[10]}, e14: ${e[14]},\n` +
            ` e3: ${e[3]}, e7: ${e[7]}, e11: ${e[11]}, e15: ${e[15]}}`
        );
    }

    /**
     * ```
     * | 1  0  0  tx |   | e0  e4   e8  e12 |
     * | 0  1  0  ty | * | e1  e5   e9  e13 |
     * | 0  0  1  tz |   | e2  e6  e10  e14 |
     * | 0  0  0   1 |   | e3  e7  e11  e15 |
     * ```
     */
    public translate(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[0] += tx * e[3];
        e[1] += ty * e[3];
        e[2] += tz * e[3];

        e[4] += tx * e[7];
        e[5] += ty * e[7];
        e[6] += tz * e[7];

        e[8] += tx * e[11];
        e[9] += ty * e[11];
        e[10] += tz * e[11];

        e[12] += tx * e[15];
        e[13] += ty * e[15];
        e[14] += tz * e[15];
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | 1  0  0  tx |
     * | e1  e5   e9  e13 | * | 0  1  0  ty |
     * | e2  e6  e10  e14 |   | 0  0  1  tz |
     * | e3  e7  e11  e15 |   | 0  0  0   1 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[12] += e[0] * tx + e[4] * ty + e[8] * tz;
        e[13] += e[1] * tx + e[5] * ty + e[9] * tz;
        e[14] += e[2] * tx + e[6] * ty + e[10] * tz;
        e[15] += e[3] * tx + e[7] * ty + e[11] * tz;
    }

    /**
     * ```
     * |  1   0   0  0 |
     * |  0   1   0  0 |
     * |  0   0   1  0 |
     * | tx  ty  tz  1 |
     * ```
     */
    public translateSet(tx: number, ty: number, tz: number): void {
        this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
    }

    /**
     * Returns the transpose of the matrix.
     */
    public transpose(): Matrix4 {
        const e = this.elements;
        return new Matrix4([
            e[0],
            e[4],
            e[8],
            e[12],
            e[1],
            e[5],
            e[9],
            e[13],
            e[2],
            e[6],
            e[10],
            e[14],
            e[3],
            e[7],
            e[11],
            e[15],
        ]);
    }
}
