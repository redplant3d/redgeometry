import type { FixedSizeArray } from "../utility/types.js";
import { Complex } from "./complex.js";
import { Quaternion } from "./quaternion.js";
import {
    Vector2,
    Vector3,
    Vector4,
    type ReadonlyVector2,
    type ReadonlyVector3,
    type ReadonlyVector4,
} from "./vector.js";

export type MatrixElements3A = FixedSizeArray<number, 6>;
export type MatrixElements3 = FixedSizeArray<number, 9>;
export type MatrixElements4A = FixedSizeArray<number, 12>;
export type MatrixElements4 = FixedSizeArray<number, 16>;

export type ReadonlyMatrixElements3A = Readonly<MatrixElements3A>;
export type ReadonlyMatrixElements3 = Readonly<MatrixElements3>;
export type ReadonlyMatrixElements4A = Readonly<MatrixElements4A>;
export type ReadonlyMatrixElements4 = Readonly<MatrixElements4>;

export type Matrix3ALike = {
    readonly elements: ReadonlyMatrixElements3A;
};

export type Matrix3Like = {
    readonly elements: ReadonlyMatrixElements3;
};

export type Matrix4ALike = {
    readonly elements: ReadonlyMatrixElements4A;
};

export type Matrix4Like = {
    readonly elements: ReadonlyMatrixElements4;
};

export interface ReadonlyMatrix3A {
    readonly elements: ReadonlyMatrixElements3A;
    readonly type: "affine";

    clone(): Matrix3A;
    determinant(): number;
    eq(mat: ReadonlyMatrix3A): boolean;
    extractSRT(): { s: Vector2; r: Complex; t: Vector2 };
    mul(mat: ReadonlyMatrix3A): Matrix3A;
    mulV(v: ReadonlyVector2): Vector2;
    toArray(): MatrixElements3A;
    toString(): string;
    transformPoint(p: ReadonlyVector2): Vector2;
    transformPointXY(px: number, py: number): Vector2;
    transformVector(v: ReadonlyVector2): Vector2;
    transformVectorXY(vx: number, vy: number): Vector2;
    transpose(): Matrix3;
}

export interface ReadonlyMatrix3 {
    readonly elements: ReadonlyMatrixElements3;
    readonly type: "projective";

    add(mat: ReadonlyMatrix3): Matrix3;
    clone(): Matrix3;
    determinant(): number;
    eq(mat: ReadonlyMatrix3): boolean;
    extractSRT(): { s: Vector2; r: Complex; t: Vector2 };
    mul(mat: ReadonlyMatrix3): Matrix3;
    mulV(v: ReadonlyVector3): Vector3;
    toArray(): MatrixElements3;
    toString(): string;
    transformPoint(p: ReadonlyVector2): Vector2;
    transformPointXY(px: number, py: number): Vector2;
    transformVector(v: ReadonlyVector2): Vector2;
    transformVectorXY(vx: number, vy: number): Vector2;
    transpose(): Matrix3;
}

export interface ReadonlyMatrix4A {
    readonly elements: ReadonlyMatrixElements4A;
    readonly type: "affine";

    clone(): Matrix4A;
    determinant(): number;
    eq(mat: ReadonlyMatrix4A): boolean;
    extractSRT(): { s: Vector3; r: Quaternion; t: Vector3 };
    mul(mat: ReadonlyMatrix4A): Matrix4A;
    mulV(v: ReadonlyVector3): Vector3;
    toArray(): MatrixElements4A;
    toString(): string;
    transformPoint(p: ReadonlyVector3): Vector3;
    transformPointXYZ(px: number, py: number, pz: number): Vector3;
    transformVector(v: ReadonlyVector3): Vector3;
    transformVectorXYZ(vx: number, vy: number, vz: number): Vector3;
    transpose(): Matrix4;
}

export interface ReadonlyMatrix4 {
    readonly elements: ReadonlyMatrixElements4;
    readonly type: "projective";

    add(mat: ReadonlyMatrix4): Matrix4;
    clone(): Matrix4;
    determinant(): number;
    eq(mat: ReadonlyMatrix4): boolean;
    extractSRT(): { s: Vector3; r: Quaternion; t: Vector3 };
    mul(mat: ReadonlyMatrix4): Matrix4;
    mulV(v: ReadonlyVector4): Vector4;
    sub(mat: ReadonlyMatrix4): Matrix4;
    toArray(): MatrixElements4;
    toString(): string;
    transformPoint(p: ReadonlyVector3): Vector3;
    transformPointXYZ(px: number, py: number, pz: number): Vector3;
    transformVector(v: ReadonlyVector3): Vector3;
    transformVectorXYZ(vx: number, vy: number, vz: number): Vector3;
    transpose(): Matrix4;
}

/**
 * Represents a column-major matrix for affine transformations in 2D:
 * ```
 * | e0  e2  e4 |
 * | e1  e3  e5 |
 * |  0   0   1 |
 * ```
 */
export class Matrix3A implements ReadonlyMatrix3A {
    public static readonly IDENTITY: ReadonlyMatrix3A = Matrix3A.createIdentity();

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

    public get type(): "affine" {
        return "affine";
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

    public static fromMatrix3(mat: ReadonlyMatrix3): Matrix3A {
        const ea = mat.elements;

        //  | e0  e2  e4 |   | ea0  ea3  ea6 |
        //  | e1  e3  e5 | = | ea1  ea4  ea7 |
        //  |  0   0   1 |   | ea2  ea5  ea8 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[3];
        const e3 = ea[4];
        const e4 = ea[6];
        const e5 = ea[7];

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
    }

    public static fromMatrix4(mat: ReadonlyMatrix4): Matrix3A {
        const ea = mat.elements;

        //  | e0  e2  e4  x |   | ea0  ea4   ea8  ea12 |
        //  | e1  e3  e5  x | = | ea1  ea5   ea9  ea13 |
        //  |  0   0   1  x |   | ea2  ea6  ea10  ea14 |
        //  |  x   x   x  x |   | ea3  ea7  ea11  ea15 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[4];
        const e3 = ea[5];
        const e4 = ea[8];
        const e5 = ea[9];

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
    }

    public static fromMatrix4A(mat: ReadonlyMatrix4A): Matrix3A {
        const ea = mat.elements;

        //  | e0  e2  e4  x |   | ea0  ea3  ea6   ea9 |
        //  | e1  e3  e5  x | = | ea1  ea4  ea7  ea10 |
        //  |  0   0   1  x |   | ea2  ea5  ea8  ea11 |
        //  |  x   x   x  x |   |   0    0    0     1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[3];
        const e3 = ea[4];
        const e4 = ea[6];
        const e5 = ea[7];

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
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
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;
        return e[0] * e[3] - e[1] * e[2];
    }

    public eq(mat: ReadonlyMatrix3A): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            ea[0] === eb[0] &&
            ea[1] === eb[1] &&
            ea[2] === eb[2] &&
            ea[3] === eb[3] &&
            ea[4] === eb[4] &&
            ea[5] === eb[5]
        );
    }

    public extractSRT(): { s: Vector2; r: Complex; t: Vector2 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
        const sy = Math.sqrt(e[2] * e[2] + e[3] * e[3]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;

        const s = new Vector2(sx, sy);
        const r = new Complex(fx * e[0], fx * e[1]);
        const t = new Vector2(e[4], e[5]);

        return { s, r, t };
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | eb0  eb2  eb4 |
     * | ea1  ea3  ea5 | * | eb1  eb3  eb5 |
     * |   0    0    1 |   |   0    0    1 |
     * ```
     */
    public mul(mat: ReadonlyMatrix3A): Matrix3A {
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
    public mulV(v: ReadonlyVector2): Vector2 {
        const e = this.elements;

        const x = e[0] * v.x + e[2] * v.y + e[4];
        const y = e[1] * v.x + e[3] * v.y + e[5];

        return new Vector2(x, y);
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

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFrom(mat: ReadonlyMatrix3A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e2  e4 |   | ea0  ea2  ea4 |
        //  | e1  e3  e5 | = | ea1  ea3  ea5 |
        //  |  0   0   1 |   |   0    0    1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3(mat: ReadonlyMatrix3): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e2  e4 |   | ea0  ea3  ea6 |
        //  | e1  e3  e5 | = | ea1  ea4  ea7 |
        //  |  0   0   1 |   | ea2  ea5  ea8 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[3];
        e[3] = ea[4];
        e[4] = ea[6];
        e[5] = ea[7];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4(mat: ReadonlyMatrix4): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e2  e4  x |   | ea0  ea4   ea8  ea12 |
        //  | e1  e3  e5  x | = | ea1  ea5   ea9  ea13 |
        //  |  0   0   1  x |   | ea2  ea6  ea10  ea14 |
        //  |  x   x   x  x |   | ea3  ea7  ea11  ea15 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[4];
        e[3] = ea[5];
        e[4] = ea[8];
        e[5] = ea[9];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4A(mat: ReadonlyMatrix4A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e2  e4  x |   | ea0  ea3  ea6   ea9 |
        //  | e1  e3  e5  x | = | ea1  ea4  ea7  ea10 |
        //  |  0   0   1  x |   | ea2  ea5  ea8  ea11 |
        //  |  x   x   x  x |   |   0    0    0     1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[3];
        e[3] = ea[4];
        e[4] = ea[6];
        e[5] = ea[7];
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public setFromRotation(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        this.set(z0, z1, z2, z3, 0, 0);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public setFromScale(sx: number, sy: number): void {
        this.set(sx, 0, 0, sy, 0, 0);
    }

    /**
     * ```
     * | 1  0  ty |
     * | 0  1  ty |
     * | 0  0   1 |
     * ```
     */
    public setFromTranslation(tx: number, ty: number): void {
        this.set(1, 0, 0, 1, tx, ty);
    }

    public setInverse(mat: ReadonlyMatrix3A): void {
        const det = mat.determinant();

        if (det === 0) {
            this.setToIdentity();
            return;
        }

        const detInv = 1 / det;
        const ea = mat.elements;

        const e0 = detInv * ea[3];
        const e1 = detInv * -ea[1];
        const e2 = detInv * -ea[2];
        const e3 = detInv * ea[0];
        const e4 = -(ea[4] * e0 + ea[5] * e2);
        const e5 = -(ea[4] * e1 + ea[5] * e3);

        this.set(e0, e1, e2, e3, e4, e5);
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | eb0  eb2  eb4 |
     * | ea1  ea3  ea5 | * | eb1  eb3  eb5 |
     * |   0    0    1 |   |   0    0    1 |
     * ```
     */
    public setMul(mat1: ReadonlyMatrix3A, mat2: ReadonlyMatrix3A): void {
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
     * | z0  z2  0 |   | ea0  ea2  ea4 |
     * | z1  z3  0 | * | ea1  ea3  ea5 |
     * |  0   0  1 |   |   0    0    1 |
     * ```
     */
    public setRotate(mat: ReadonlyMatrix3A, za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const ea = mat.elements;
        const e = this.elements;

        const e0 = z0 * ea[0] + z2 * ea[1];
        const e1 = z1 * ea[0] + z3 * ea[1];
        e[0] = e0;
        e[1] = e1;

        const e2 = z0 * ea[2] + z2 * ea[3];
        const e3 = z1 * ea[2] + z3 * ea[3];
        e[2] = e2;
        e[3] = e3;

        const e4 = z0 * ea[4] + z2 * ea[5];
        const e5 = z1 * ea[4] + z3 * ea[5];
        e[4] = e4;
        e[5] = e5;
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | z0  z2  0 |
     * | ea1  ea3  ea5 | * | z1  z3  0 |
     * |   0    0    1 |   |  0   0  1 |
     * ```
     */
    public setRotatePre(mat: ReadonlyMatrix3A, za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const ea = mat.elements;
        const e = this.elements;

        const e0 = ea[0] * z0 + ea[2] * z1;
        const e2 = ea[0] * z2 + ea[2] * z3;
        e[0] = e0;
        e[2] = e2;

        const e1 = ea[1] * z0 + ea[3] * z1;
        const e3 = ea[1] * z2 + ea[3] * z3;
        e[1] = e1;
        e[3] = e3;
    }

    /**
     * ```
     * | sx   0  0 |   | ea0  ea2  ea4 |
     * |  0  sy  0 | * | ea1  ea3  ea5 |
     * |  0   0  1 |   |   0    0    1 |
     * ```
     */
    public setScale(mat: ReadonlyMatrix3A, sx: number, sy: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = sx * ea[0];
        e[1] = sy * ea[1];

        e[2] = sx * ea[2];
        e[3] = sy * ea[3];

        e[4] = sx * ea[4];
        e[5] = sy * ea[5];
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | sx   0  0 |
     * | ea1  ea3  ea5 | * |  0  sy  0 |
     * |   0    0    1 |   |  0   0  1 |
     * ```
     */
    public setScalePre(mat: ReadonlyMatrix3A, sx: number, sy: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] * sx;
        e[1] = ea[1] * sx;

        e[2] = ea[2] * sy;
        e[3] = ea[3] * sy;
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public setToIdentity(): void {
        this.set(1, 0, 0, 1, 0, 0);
    }

    /**
     * ```
     * | 1  0  tx |   | ea0  ea2  ea4 |
     * | 0  1  ty | * | ea1  ea3  ea5 |
     * | 0  0   1 |   |   0    0    1 |
     * ```
     */
    public setTranslate(mat: ReadonlyMatrix3A, tx: number, ty: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[4] = tx + ea[4];
        e[5] = ty + ea[5];
    }

    /**
     * ```
     * | ea0  ea2  ea4 |   | 1  0  tx |
     * | ea1  ea3  ea5 | * | 0  1  ty |
     * |   0    0    1 |   | 0  0   1 |
     * ```
     */
    public setTranslatePre(mat: ReadonlyMatrix3A, tx: number, ty: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[4] = ea[0] * tx + ea[2] * ty + ea[4];
        e[5] = ea[1] * tx + ea[3] * ty + ea[5];
    }

    public toArray(): MatrixElements3A {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        let str = "{e0: " + e[0] + ", e2: " + e[2] + ", e4: " + e[4] + ",\n";
        str += " e1: " + e[1] + ", e3: " + e[3] + ", e5: " + e[5] + "}";

        return str;
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 1 |
     * ```
     */
    public transformPoint(p: ReadonlyVector2): Vector2 {
        const e = this.elements;

        const x = e[0] * p.x + e[2] * p.y + e[4];
        const y = e[1] * p.x + e[3] * p.y + e[5];

        return new Vector2(x, y);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 1 |
     * ```
     */
    public transformPointXY(px: number, py: number): Vector2 {
        const e = this.elements;

        const x = e[0] * px + e[2] * py + e[4];
        const y = e[1] * px + e[3] * py + e[5];

        return new Vector2(x, y);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 0 |
     * ```
     */
    public transformVector(v: ReadonlyVector2): Vector2 {
        const e = this.elements;

        const x = e[0] * v.x + e[2] * v.y;
        const y = e[1] * v.x + e[3] * v.y;

        return new Vector2(x, y);
    }

    /**
     * ```
     * | e0  e2  e4 |   | x |
     * | e1  e3  e5 | * | y |
     * |  0   0   1 |   | 0 |
     * ```
     */
    public transformVectorXY(vx: number, vy: number): Vector2 {
        const e = this.elements;

        const x = e[0] * vx + e[2] * vy;
        const y = e[1] * vx + e[3] * vy;

        return new Vector2(x, y);
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
export class Matrix3 implements ReadonlyMatrix3 {
    public static readonly IDENTITY: ReadonlyMatrix3 = Matrix3.createIdentity();
    public static readonly ZERO: ReadonlyMatrix3 = Matrix3.createZero();

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

    public get type(): "projective" {
        return "projective";
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

    public static fromMatrix3A(mat: ReadonlyMatrix3A): Matrix3 {
        const ea = mat.elements;

        //  | e0  e3  e6  |   | ea0  ea2  ea4 |
        //  | e1  e4  e7  | = | ea1  ea3  ea5 |
        //  | e2  e5  e8  |   |   0    0    1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e3 = ea[2];
        const e4 = ea[3];
        const e6 = ea[4];
        const e7 = ea[5];

        return new Matrix3([e0, e1, 0, e3, e4, 0, e6, e7, 1]);
    }

    public static fromMatrix4(mat: ReadonlyMatrix4): Matrix3 {
        const ea = mat.elements;

        //  | e0  e3  e6  x |   | ea0  ea4   ea8  ea12 |
        //  | e1  e4  e7  x | = | ea1  ea5   ea9  ea13 |
        //  | e2  e5  e8  x |   | ea2  ea6  ea10  ea14 |
        //  |  x   x   x  x |   | ea3  ea7  ea11  ea15 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e3 = ea[4];
        const e4 = ea[5];
        const e5 = ea[6];
        const e6 = ea[8];
        const e7 = ea[9];
        const e8 = ea[10];

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
    }

    public static fromMatrix4A(mat: ReadonlyMatrix4A): Matrix3 {
        const ea = mat.elements;

        //  | e0  e3  e6  x |   | ea0  ea3  ea6   ea9 |
        //  | e1  e4  e7  x | = | ea1  ea4  ea7  ea10 |
        //  | e2  e5  e8  x |   | ea2  ea5  ea8  ea11 |
        //  |  x   x   x  x |   |   0    0    0     1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e3 = ea[3];
        const e4 = ea[4];
        const e5 = ea[5];
        const e6 = ea[6];
        const e7 = ea[7];
        const e8 = ea[8];

        return new Matrix3([e0, e1, e2, e3, e4, e5, e6, e7, e8]);
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

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | + | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public add(mat: ReadonlyMatrix3): Matrix3 {
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

    public clone(): Matrix3 {
        return new Matrix3([...this.elements]);
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

    public eq(mat: ReadonlyMatrix3): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            ea[0] === eb[0] &&
            ea[1] === eb[1] &&
            ea[2] === eb[2] &&
            ea[3] === eb[3] &&
            ea[4] === eb[4] &&
            ea[5] === eb[5] &&
            ea[6] === eb[6] &&
            ea[7] === eb[7] &&
            ea[8] === eb[8]
        );
    }

    public extractSRT(): { s: Vector2; r: Complex; t: Vector2 } {
        const e = this.elements;

        let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
        const sy = Math.sqrt(e[3] * e[3] + e[4] * e[4] + e[5] * e[5]);

        if (this.determinant() < 0) {
            sx = -sx;
        }

        const fx = 1 / sx;

        const s = new Vector2(sx, sy);
        const r = new Complex(fx * e[0], fx * e[1]);
        const t = new Vector2(e[6], e[7]);

        return { s, r, t };
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | * | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public mul(mat: ReadonlyMatrix3): Matrix3 {
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
     * | e2  e5  e8 |   | z |
     * ```
     */
    public mulV(v: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z;
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z;
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z;

        return new Vector3(x, y, z);
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

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | + | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public setAdd(mat1: ReadonlyMatrix3, mat2: ReadonlyMatrix3): void {
        const ea = mat1.elements;
        const eb = mat2.elements;
        const e = this.elements;

        e[0] = ea[0] + eb[0];
        e[1] = ea[1] + eb[1];
        e[2] = ea[2] + eb[2];
        e[3] = ea[3] + eb[3];
        e[4] = ea[4] + eb[4];
        e[5] = ea[5] + eb[5];
        e[6] = ea[6] + eb[6];
        e[7] = ea[7] + eb[7];
        e[8] = ea[8] + eb[8];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFrom(mat: ReadonlyMatrix3): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6  |   | ea0  ea3  ea6 |
        //  | e1  e4  e7  | = | ea1  ea4  ea7 |
        //  | e2  e5  e8  |   | ea2  ea5  ea8 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
        e[6] = ea[6];
        e[7] = ea[7];
        e[8] = ea[8];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3A(mat: ReadonlyMatrix3A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6  |   | ea0  ea2  ea4 |
        //  | e1  e4  e7  | = | ea1  ea3  ea5 |
        //  | e2  e5  e8  |   |   0    0    1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = 0;
        e[3] = ea[2];
        e[4] = ea[3];
        e[5] = 0;
        e[6] = ea[4];
        e[7] = ea[5];
        e[8] = 1;
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4(mat: ReadonlyMatrix4): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6  x |   | ea0  ea4   ea8  ea12 |
        //  | e1  e4  e7  x | = | ea1  ea5   ea9  ea13 |
        //  | e2  e5  e8  x |   | ea2  ea6  ea10  ea14 |
        //  |  x   x   x  x |   | ea3  ea7  ea11  ea15 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[4];
        e[4] = ea[5];
        e[5] = ea[6];
        e[6] = ea[8];
        e[7] = ea[9];
        e[8] = ea[10];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4A(mat: ReadonlyMatrix4A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6  x |   | ea0  ea3  ea6   ea9 |
        //  | e1  e4  e7  x | = | ea1  ea4  ea7  ea10 |
        //  | e2  e5  e8  x |   | ea2  ea5  ea8  ea11 |
        //  |  x   x   x  x |   |   0    0    0     1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
        e[6] = ea[6];
        e[7] = ea[7];
        e[8] = ea[8];
    }

    /**
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public setFromRotation(za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        this.set(z0, z1, 0, z2, z3, 0, 0, 0, 1);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public setFromScale(sx: number, sy: number): void {
        this.set(sx, 0, 0, 0, sy, 0, 0, 0, 1);
    }

    /**
     * ```
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public setFromTranslation(tx: number, ty: number): void {
        this.set(1, 0, 0, 0, 1, 0, tx, ty, 1);
    }

    public setInverse(mat: ReadonlyMatrix3): void {
        const det = mat.determinant();

        if (det === 0) {
            this.setToIdentity();
            return;
        }

        const detInv = 1 / det;
        const ea = mat.elements;

        const e0 = detInv * (ea[4] * ea[8] - ea[5] * ea[7]);
        const e1 = detInv * (ea[2] * ea[7] - ea[1] * ea[8]);
        const e2 = detInv * (ea[1] * ea[5] - ea[2] * ea[4]);
        const e3 = detInv * (ea[5] * ea[6] - ea[3] * ea[8]);
        const e4 = detInv * (ea[0] * ea[8] - ea[2] * ea[6]);
        const e5 = detInv * (ea[2] * ea[3] - ea[0] * ea[5]);
        const e6 = detInv * (ea[3] * ea[7] - ea[4] * ea[6]);
        const e7 = detInv * (ea[1] * ea[6] - ea[0] * ea[7]);
        const e8 = detInv * (ea[0] * ea[4] - ea[1] * ea[3]);

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | * | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public setMul(mat1: ReadonlyMatrix3, mat2: ReadonlyMatrix3): void {
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
     * | z0  z2  0 |   | ea0  ea3  ea6 |
     * | z1  z3  0 | * | ea1  ea4  ea7 |
     * |  0   0  1 |   | ea2  ea5  ea8 |
     * ```
     */
    public setRotate(mat: ReadonlyMatrix3, za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const ea = mat.elements;
        const e = this.elements;

        const e0 = z0 * ea[0] + z2 * ea[1];
        const e1 = z1 * ea[0] + z3 * ea[1];
        e[0] = e0;
        e[1] = e1;

        const e3 = z0 * ea[3] + z2 * ea[4];
        const e4 = z1 * ea[3] + z3 * ea[4];
        e[3] = e3;
        e[4] = e4;

        const e6 = z0 * ea[6] + z2 * ea[7];
        const e7 = z1 * ea[6] + z3 * ea[7];
        e[6] = e6;
        e[7] = e7;
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | z0  z2  0 |
     * | ea1  ea4  ea7 | * | z1  z3  0 |
     * | ea2  ea5  ea8 |   |  0   0  1 |
     * ```
     */
    public setRotatePre(mat: ReadonlyMatrix3, za: number, zb: number): void {
        const z0 = za;
        const z1 = zb;
        const z2 = -zb;
        const z3 = za;

        const ea = mat.elements;
        const e = this.elements;

        const e0 = ea[0] * z0 + ea[3] * z1;
        const e3 = ea[0] * z2 + ea[3] * z3;
        e[0] = e0;
        e[3] = e3;

        const e1 = ea[1] * z0 + ea[4] * z1;
        const e4 = ea[1] * z2 + ea[4] * z3;
        e[1] = e1;
        e[4] = e4;

        const e2 = ea[2] * z0 + ea[5] * z1;
        const e5 = ea[2] * z2 + ea[5] * z3;
        e[2] = e2;
        e[5] = e5;
    }

    /**
     * ```
     * | sx   0  0 |   | ea0  ea3  ea6 |
     * |  0  sy  0 | * | ea1  ea4  ea7 |
     * |  0   0  1 |   | ea2  ea5  ea8 |
     * ```
     */
    public setScale(mat: ReadonlyMatrix3, sx: number, sy: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = sx * ea[0];
        e[1] = sy * ea[1];

        e[3] = sx * ea[3];
        e[4] = sy * ea[4];

        e[6] = sx * ea[6];
        e[7] = sy * ea[7];
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | sx   0  0 |
     * | ea1  ea4  ea7 | * |  0  sy  0 |
     * | ea2  ea5  ea8 |   |  0   0  1 |
     * ```
     */
    public setScalePre(mat: ReadonlyMatrix3, sx: number, sy: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] * sx;
        e[1] = ea[1] * sx;
        e[2] = ea[2] * sx;

        e[3] = ea[3] * sy;
        e[4] = ea[4] * sy;
        e[5] = ea[5] * sy;
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | - | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public setSub(mat1: ReadonlyMatrix3, mat2: ReadonlyMatrix3): void {
        const ea = mat1.elements;
        const eb = mat2.elements;
        const e = this.elements;

        e[0] = ea[0] - eb[0];
        e[1] = ea[1] - eb[1];
        e[2] = ea[2] - eb[2];
        e[3] = ea[3] - eb[3];
        e[4] = ea[4] - eb[4];
        e[5] = ea[5] - eb[5];
        e[6] = ea[6] - eb[6];
        e[7] = ea[7] - eb[7];
        e[8] = ea[8] - eb[8];
    }

    /**
     * ```
     * | 1  0  0 |
     * | 0  1  0 |
     * | 0  0  1 |
     * ```
     */
    public setToIdentity(): void {
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 0  0  0 |
     * | 0  0  0 |
     * | 0  0  0 |
     * ```
     */
    public setToZero(): void {
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /**
     * ```
     * | 1  0  tx |   | ea0  ea3  ea6 |
     * | 0  1  ty | * | ea1  ea4  ea7 |
     * | 0  0   1 |   | ea2  ea5  ea8 |
     * ```
     */
    public setTranslate(mat: ReadonlyMatrix3, tx: number, ty: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] + tx * ea[2];
        e[1] = ea[1] + ty * ea[2];

        e[3] = ea[3] + tx * ea[5];
        e[4] = ea[4] + ty * ea[5];

        e[6] = ea[6] + tx * ea[8];
        e[7] = ea[7] + ty * ea[8];
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | 1  0  tx |
     * | ea1  ea4  ea7 | * | 0  1  ty |
     * | ea2  ea5  ea8 |   | 0  0   1 |
     * ```
     */
    public setTranslatePre(mat: ReadonlyMatrix3, tx: number, ty: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[6] = ea[0] * tx + ea[3] * ty + ea[6];
        e[7] = ea[1] * tx + ea[4] * ty + ea[7];
        e[8] = ea[2] * tx + ea[5] * ty + ea[8];
    }

    public setTranspose(mat: ReadonlyMatrix3): void {
        const ea = mat.elements;

        // | e0  e3  e6 |   | ea0  ea1  ea2 |
        // | e1  e4  e7 | = | ea3  ea4  ea5 |
        // | e2  e5  e8 |   | ea6  ea7  ea8 |
        const e0 = ea[0];
        const e1 = ea[3];
        const e2 = ea[6];
        const e3 = ea[1];
        const e4 = ea[4];
        const e5 = ea[7];
        const e6 = ea[2];
        const e7 = ea[5];
        const e8 = ea[8];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | - | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public sub(mat: ReadonlyMatrix3): Matrix3 {
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

    public toArray(): MatrixElements3 {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        let str = "{e0: " + e[0] + ", e3: " + e[3] + ", e6: " + e[6] + ",\n";
        str += " e1: " + e[1] + ", e4: " + e[4] + ", e7: " + e[7] + ",\n";
        str += " e2: " + e[2] + ", e5: " + e[5] + ", e8: " + e[8] + "}";

        return str;
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 1 |
     * ```
     */
    public transformPoint(p: ReadonlyVector2): Vector2 {
        const e = this.elements;

        const x = e[0] * p.x + e[3] * p.y + e[6];
        const y = e[1] * p.x + e[4] * p.y + e[7];
        const w = e[2] * p.x + e[5] * p.y + e[8];

        return Vector2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 1 |
     * ```
     */
    public transformPointXY(px: number, py: number): Vector2 {
        const e = this.elements;

        const x = e[0] * px + e[3] * py + e[6];
        const y = e[1] * px + e[4] * py + e[7];
        const w = e[2] * px + e[5] * py + e[8];

        return Vector2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 0 |
     * ```
     */
    public transformVector(v: ReadonlyVector2): Vector2 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y;
        const y = e[1] * v.x + e[4] * v.y;
        const w = e[2] * v.x + e[5] * v.y;

        return Vector2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | e0  e3  e6 |   | x |
     * | e1  e4  e7 | * | y |
     * | e2  e5  e8 |   | 0 |
     * ```
     */
    public transformVectorXY(vx: number, vy: number): Vector2 {
        const e = this.elements;

        const x = e[0] * vx + e[3] * vy;
        const y = e[1] * vx + e[4] * vy;
        const w = e[2] * vx + e[5] * vy;

        return Vector2.fromXYW(x, y, w);
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
export class Matrix4A implements ReadonlyMatrix4A {
    public static readonly IDENTITY: ReadonlyMatrix4A = Matrix4A.createIdentity();

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

    public get type(): "affine" {
        return "affine";
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

    public static fromMatrix3(mat: ReadonlyMatrix3): Matrix4A {
        const ea = mat.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea3  ea6  0 |
        //  | e1  e4  e7  e10 | = | ea1  ea4  ea7  0 |
        //  | e2  e5  e8  e11 |   | ea2  ea5  ea8  0 |
        //  |  0   0   0    1 |   |   0    0    0  1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e3 = ea[3];
        const e4 = ea[4];
        const e5 = ea[5];
        const e6 = ea[6];
        const e7 = ea[7];
        const e8 = ea[8];

        return new Matrix4A([e0, e1, e2, e3, e4, e5, e6, e7, e8, 0, 0, 0]);
    }

    public static fromMatrix3A(mat: ReadonlyMatrix3A): Matrix4A {
        const ea = mat.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea2  ea4  0 |
        //  | e1  e4  e7  e10 | = | ea1  ea3  ea5  0 |
        //  | e2  e5  e8  e11 |   |   0    0    1  0 |
        //  |  0   0   0    1 |   |   0    0    0  1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e3 = ea[2];
        const e4 = ea[3];
        const e6 = ea[4];
        const e7 = ea[5];

        return new Matrix4A([e0, e1, 0, e3, e4, 0, e6, e7, 1, 0, 0, 0]);
    }

    public static fromMatrix4(mat: ReadonlyMatrix4): Matrix4A {
        const ea = mat.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea4   ea8  ea12 |
        //  | e1  e4  e7  e10 | = | ea1  ea5   ea9  ea13 |
        //  | e2  e5  e8  e11 |   | ea2  ea6  ea10  ea14 |
        //  |  0   0   0    1 |   | ea3  ea7  ea11  ea15 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e3 = ea[4];
        const e4 = ea[5];
        const e5 = ea[6];
        const e6 = ea[8];
        const e7 = ea[9];
        const e8 = ea[10];
        const e9 = ea[12];
        const e10 = ea[13];
        const e11 = ea[14];

        return new Matrix4A([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11]);
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
     * Returns the determinant of the matrix.
     */
    public determinant(): number {
        const e = this.elements;

        const a = e[8] * (e[0] * e[4] - e[1] * e[3]);
        const b = e[5] * (e[0] * e[7] - e[1] * e[6]);
        const c = e[2] * (e[3] * e[7] - e[4] * e[6]);

        return a - b + c;
    }

    public eq(mat: ReadonlyMatrix4A): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            ea[0] === eb[0] &&
            ea[1] === eb[1] &&
            ea[2] === eb[2] &&
            ea[3] === eb[3] &&
            ea[4] === eb[4] &&
            ea[5] === eb[5] &&
            ea[6] === eb[6] &&
            ea[7] === eb[7] &&
            ea[8] === eb[8] &&
            ea[9] === eb[9] &&
            ea[10] === eb[10] &&
            ea[11] === eb[11]
        );
    }

    public extractSRT(): { s: Vector3; r: Quaternion; t: Vector3 } {
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
        const t = new Vector3(e[9], e[10], e[11]);

        return { s, r, t };
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | eb0  eb3  eb6   eb9 |
     * | ea1  ea4  ea7  ea10 | * | eb1  eb4  eb7  ea10 |
     * | ea2  ea5  ea8  ea11 |   | eb2  eb5  eb8  eb11 |
     * |   0    0    0     1 |   |   0    0    0     1 |
     * ```
     */
    public mul(mat: ReadonlyMatrix4A): Matrix4A {
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
    public mulV(v: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z + e[9];
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z + e[10];
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z + e[11];

        return new Vector3(x, y, z);
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

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFrom(mat: ReadonlyMatrix4A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea3  ea6   ea9 |
        //  | e1  e4  e7  e10 | = | ea1  ea4  ea7  ea10 |
        //  | e2  e5  e8  e11 |   | ea2  ea5  ea8  ea11 |
        //  |  0   0   0    1 |   |   0    0    0     1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
        e[6] = ea[6];
        e[7] = ea[7];
        e[8] = ea[8];
        e[9] = ea[9];
        e[10] = ea[10];
        e[11] = ea[11];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3(mat: ReadonlyMatrix3): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea3  ea6  0 |
        //  | e1  e4  e7  e10 | = | ea1  ea4  ea7  0 |
        //  | e2  e5  e8  e11 |   | ea2  ea5  ea8  0 |
        //  |  0   0   0    1 |   |   0    0    0  1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
        e[6] = ea[6];
        e[7] = ea[7];
        e[8] = ea[8];
        e[9] = 0;
        e[10] = 0;
        e[11] = 0;
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3A(mat: ReadonlyMatrix3A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea2  ea4  0 |
        //  | e1  e4  e7  e10 | = | ea1  ea3  ea5  0 |
        //  | e2  e5  e8  e11 |   |   0    0    1  0 |
        //  |  0   0   0    1 |   |   0    0    0  1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = 0;
        e[3] = ea[2];
        e[4] = ea[3];
        e[5] = 0;
        e[6] = ea[4];
        e[7] = ea[5];
        e[8] = 1;
        e[9] = 0;
        e[10] = 0;
        e[11] = 0;
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4(mat: ReadonlyMatrix4): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e3  e6   e9 |   | ea0  ea4   ea8  ea12 |
        //  | e1  e4  e7  e10 | = | ea1  ea5   ea9  ea13 |
        //  | e2  e5  e8  e11 |   | ea2  ea6  ea10  ea14 |
        //  |  0   0   0    1 |   | ea3  ea7  ea11  ea15 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[4];
        e[4] = ea[5];
        e[5] = ea[6];
        e[6] = ea[8];
        e[7] = ea[9];
        e[8] = ea[10];
        e[9] = ea[12];
        e[10] = ea[13];
        e[11] = ea[14];
    }

    /**
     * Sets a right-handed orthographic projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::orthoRH_ZO`.
     */
    public setFromOrthographicFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, e4, 0, 0, 0, e8, e9, e10, e11);
    }

    /**
     * Sets a right-handed orthographic projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::orthoRH_NO`.
     */
    public setFromOrthographicFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, e4, 0, 0, 0, e8, e9, e10, e11);
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public setFromRotation(qa: number, qb: number, qc: number, qd: number): void {
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
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public setFromScale(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, sy, 0, 0, 0, sz, 0, 0, 0);
    }

    /**
     * ```
     * | 1  0  0  tx |
     * | 0  1  0  ty |
     * | 0  0  1  tz |
     * | 0  0  0   1 |
     * ```
     */
    public setFromTranslation(tx: number, ty: number, tz: number): void {
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1, tx, ty, tz);
    }

    /**
     * Sets a view matrix where `x` is right, `y` is up and `-z` is forward.
     */
    public setFromView(offset: ReadonlyVector3, direction: ReadonlyVector3, up: ReadonlyVector3): void {
        // Orthonormal basis
        const v3 = direction.neg().unit();
        const v1 = up.cross(v3).unit();
        const v2 = v3.cross(v1);

        // See the `Matrix4.setFromView()` for derivation.
        const e0 = v1.x;
        const e1 = v2.x;
        const e2 = v3.x;
        const e3 = v1.y;
        const e4 = v2.y;
        const e5 = v3.y;
        const e6 = v1.z;
        const e7 = v2.z;
        const e8 = v3.z;
        const e9 = -offset.dot(v1);
        const e10 = -offset.dot(v2);
        const e11 = -offset.dot(v3);

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11);
    }

    public setInverse(mat: ReadonlyMatrix4A): void {
        const det = mat.determinant();

        if (det === 0) {
            this.setToIdentity();
            return;
        }

        const detInv = 1 / det;
        const ea = mat.elements;

        const e0 = detInv * (ea[4] * ea[8] - ea[5] * ea[7]);
        const e1 = detInv * (ea[2] * ea[7] - ea[1] * ea[8]);
        const e2 = detInv * (ea[1] * ea[5] - ea[2] * ea[4]);
        const e3 = detInv * (ea[5] * ea[6] - ea[3] * ea[8]);
        const e4 = detInv * (ea[0] * ea[8] - ea[2] * ea[6]);
        const e5 = detInv * (ea[2] * ea[3] - ea[0] * ea[5]);
        const e6 = detInv * (ea[3] * ea[7] - ea[4] * ea[6]);
        const e7 = detInv * (ea[1] * ea[6] - ea[0] * ea[7]);
        const e8 = detInv * (ea[0] * ea[4] - ea[1] * ea[3]);
        const e9 = -(ea[9] * e0 + ea[10] * e3 + ea[11] * e6);
        const e10 = -(ea[9] * e1 + ea[10] * e4 + ea[11] * e7);
        const e11 = -(ea[9] * e2 + ea[10] * e5 + ea[11] * e8);

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11);
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | eb0  eb3  eb6   eb9 |
     * | ea1  ea4  ea7  ea10 | * | eb1  eb4  eb7  ea10 |
     * | ea2  ea5  ea8  ea11 |   | eb2  eb5  eb8  eb11 |
     * |   0    0    0     1 |   |   0    0    0     1 |
     * ```
     */
    public setMul(mat1: ReadonlyMatrix4A, mat2: ReadonlyMatrix4A): void {
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
     * | q0  q3  q6  0 |   | ea0  ea3  ea6   ea9 |
     * | q1  q4  q7  0 | * | ea1  ea4  ea7  ea10 |
     * | q2  q5  q8  0 |   | ea2  ea5  ea8  ea11 |
     * |  0   0   0  1 |   |   0    0    0     1 |
     * ```
     */
    public setRotate(mat: ReadonlyMatrix4A, qa: number, qb: number, qc: number, qd: number): void {
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

        const ea = mat.elements;
        const e = this.elements;

        const e0 = q0 * ea[0] + q3 * ea[1] + q6 * ea[2];
        const e1 = q1 * ea[0] + q4 * ea[1] + q7 * ea[2];
        const e2 = q2 * ea[0] + q5 * ea[1] + q8 * ea[2];
        e[0] = e0;
        e[1] = e1;
        e[2] = e2;

        const e3 = q0 * ea[3] + q3 * ea[4] + q6 * ea[5];
        const e4 = q1 * ea[3] + q4 * ea[4] + q7 * ea[5];
        const e5 = q2 * ea[3] + q5 * ea[4] + q8 * ea[5];
        e[3] = e3;
        e[4] = e4;
        e[5] = e5;

        const e6 = q0 * ea[6] + q3 * ea[7] + q6 * ea[8];
        const e7 = q1 * ea[6] + q4 * ea[7] + q7 * ea[8];
        const e8 = q2 * ea[6] + q5 * ea[7] + q8 * ea[8];
        e[6] = e6;
        e[7] = e7;
        e[8] = e8;

        const e9 = q0 * ea[9] + q3 * ea[10] + q6 * ea[11];
        const e10 = q1 * ea[9] + q4 * ea[10] + q7 * ea[11];
        const e11 = q2 * ea[9] + q5 * ea[10] + q8 * ea[11];
        e[9] = e9;
        e[10] = e10;
        e[11] = e11;
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | q0  q3  q6  0 |
     * | ea1  ea4  ea7  ea10 | * | q1  q4  q7  0 |
     * | ea2  ea5  ea8  ea11 |   | q2  q5  q8  0 |
     * |   0    0    0     1 |   |  0   0   0  1 |
     * ```
     */
    public setRotatePre(mat: ReadonlyMatrix4A, qa: number, qb: number, qc: number, qd: number): void {
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

        const ea = mat.elements;
        const e = this.elements;

        const e0 = ea[0] * q0 + ea[3] * q1 + ea[6] * q2;
        const e3 = ea[0] * q3 + ea[3] * q4 + ea[6] * q5;
        const e6 = ea[0] * q6 + ea[3] * q7 + ea[6] * q8;
        e[0] = e0;
        e[3] = e3;
        e[6] = e6;

        const e1 = ea[1] * q0 + ea[4] * q1 + ea[7] * q2;
        const e4 = ea[1] * q3 + ea[4] * q4 + ea[7] * q5;
        const e7 = ea[1] * q6 + ea[4] * q7 + ea[7] * q8;
        e[1] = e1;
        e[4] = e4;
        e[7] = e7;

        const e2 = ea[2] * q0 + ea[5] * q1 + ea[8] * q2;
        const e5 = ea[2] * q3 + ea[5] * q4 + ea[8] * q5;
        const e8 = ea[2] * q6 + ea[5] * q7 + ea[8] * q8;
        e[2] = e2;
        e[5] = e5;
        e[8] = e8;
    }

    /**
     * ```
     * | sx   0   0  0 |   | ea0  ea3  ea6   ea9 |
     * |  0  sy   0  0 | * | ea1  ea4  ea7  ea10 |
     * |  0   0  sz  0 |   | ea2  ea5  ea8  ea11 |
     * |  0   0   0  1 |   |   0    0    0     1 |
     * ```
     */
    public setScale(mat: ReadonlyMatrix4A, sx: number, sy: number, sz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = sx * ea[0];
        e[1] = sy * ea[1];
        e[2] = sz * ea[2];

        e[3] = sx * ea[3];
        e[4] = sy * ea[4];
        e[5] = sz * ea[5];

        e[6] = sx * ea[6];
        e[7] = sy * ea[7];
        e[8] = sz * ea[8];

        e[9] = sx * ea[9];
        e[10] = sy * ea[10];
        e[11] = sz * ea[11];
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | sx   0   0  0 |
     * | ea1  ea4  ea7  ea10 | * |  0  sy   0  0 |
     * | ea2  ea5  ea8  ea11 |   |  0   0  sz  0 |
     * |   0    0    0     1 |   |  0   0   0  1 |
     * ```
     */
    public setScalePre(mat: ReadonlyMatrix4A, sx: number, sy: number, sz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] * sx;
        e[1] = ea[1] * sx;
        e[2] = ea[2] * sx;

        e[3] = ea[3] * sy;
        e[4] = ea[4] * sy;
        e[5] = ea[5] * sy;

        e[6] = ea[6] * sz;
        e[7] = ea[7] * sz;
        e[8] = ea[8] * sz;
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public setToIdentity(): void {
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0);
    }

    /**
     * ```
     * | 1  0  0  tx |   | ea0  ea3  ea6   ea9 |
     * | 0  1  0  ty | * | ea1  ea4  ea7  ea10 |
     * | 0  0  1  tz |   | ea2  ea5  ea8  ea11 |
     * | 0  0  0   1 |   |   0    0    0     1 |
     * ```
     */
    public setTranslate(mat: ReadonlyMatrix4A, tx: number, ty: number, tz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[9] = ea[9] + tx;
        e[10] = ea[10] + ty;
        e[11] = ea[11] + tz;
    }

    /**
     * ```
     * | ea0  ea3  ea6   ea9 |   | 1  0  0  tx |
     * | ea1  ea4  ea7  ea10 | * | 0  1  0  ty |
     * | ea2  ea5  ea8  ea11 |   | 0  0  1  tz |
     * |   0    0    0     1 |   | 0  0  0   1 |
     * ```
     */
    public setTranslatePre(mat: ReadonlyMatrix4A, tx: number, ty: number, tz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[9] = ea[0] * tx + ea[3] * ty + ea[6] * tz + ea[9];
        e[10] = ea[1] * tx + ea[4] * ty + ea[7] * tz + ea[10];
        e[11] = ea[2] * tx + ea[5] * ty + ea[8] * tz + ea[11];
    }

    public toArray(): MatrixElements4A {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        let str = "{e0: " + e[0] + ", e3: " + e[3] + ", e6: " + e[6] + ", e9: " + e[9] + ",\n";
        str += " e1: " + e[1] + ", e4: " + e[4] + ", e7: " + e[7] + ", e10: " + e[10] + ",\n";
        str += " e2: " + e[2] + ", e5: " + e[5] + ", e8: " + e[8] + ", e11: " + e[11] + "}";

        return str;
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 1 |
     * ```
     */
    public transformPoint(p: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * p.x + e[3] * p.y + e[6] * p.z + e[9];
        const y = e[1] * p.x + e[4] * p.y + e[7] * p.z + e[10];
        const z = e[2] * p.x + e[5] * p.y + e[8] * p.z + e[11];

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 1 |
     * ```
     */
    public transformPointXYZ(px: number, py: number, pz: number): Vector3 {
        const e = this.elements;

        const x = e[0] * px + e[3] * py + e[6] * pz + e[9];
        const y = e[1] * px + e[4] * py + e[7] * pz + e[10];
        const z = e[2] * px + e[5] * py + e[8] * pz + e[11];

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 0 |
     * ```
     */
    public transformVector(v: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[3] * v.y + e[6] * v.z;
        const y = e[1] * v.x + e[4] * v.y + e[7] * v.z;
        const z = e[2] * v.x + e[5] * v.y + e[8] * v.z;

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | e0  e3  e6   e9 |   | x |
     * | e1  e4  e7  e10 | * | y |
     * | e2  e5  e8  e11 |   | z |
     * |  0   0   0    1 |   | 0 |
     * ```
     */
    public transformVectorXYZ(vx: number, vy: number, vz: number): Vector3 {
        const e = this.elements;

        const x = e[0] * vx + e[3] * vy + e[6] * vz;
        const y = e[1] * vx + e[4] * vy + e[7] * vz;
        const z = e[2] * vx + e[5] * vy + e[8] * vz;

        return new Vector3(x, y, z);
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
export class Matrix4 implements ReadonlyMatrix4 {
    public static readonly IDENTITY: ReadonlyMatrix4 = Matrix4.createIdentity();
    public static readonly ZERO: ReadonlyMatrix4 = Matrix4.createZero();

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

    public get type(): "projective" {
        return "projective";
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

    public static fromMatrix3(mat: ReadonlyMatrix3): Matrix4 {
        const ea = mat.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea3  ea6  0 |
        //  | e1  e5   e9  e13 | = | ea1  ea4  ea7  0 |
        //  | e2  e6  e10  e14 |   | ea2  ea5  ea8  0 |
        //  | e3  e7  e11  e15 |   |   0    0    0  1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e3 = 0;
        const e4 = ea[3];
        const e5 = ea[4];
        const e6 = ea[5];
        const e7 = 0;
        const e8 = ea[6];
        const e9 = ea[7];
        const e10 = ea[8];
        const e11 = 0;
        const e12 = 0;
        const e13 = 0;
        const e14 = 0;
        const e15 = 1;

        return new Matrix4([e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]);
    }

    public static fromMatrix3A(mat: ReadonlyMatrix3A): Matrix4 {
        const ea = mat.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea2  ea4  0 |
        //  | e1  e5   e9  e13 | = | ea1  ea3  ea5  0 |
        //  | e2  e6  e10  e14 |   |   0    0    1  0 |
        //  | e3  e7  e11  e15 |   |   0    0    0  1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e4 = ea[2];
        const e5 = ea[3];
        const e8 = ea[4];
        const e9 = ea[5];

        return new Matrix4([e0, e1, 0, 0, e4, e5, 0, 0, e8, e9, 1, 0, 0, 0, 0, 1]);
    }

    public static fromMatrix4A(mat: ReadonlyMatrix4A): Matrix4 {
        const ea = mat.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea3  ea6   ea9 |
        //  | e1  e5   e9  e13 | = | ea1  ea4  ea7  ea10 |
        //  | e2  e6  e10  e14 |   | ea2  ea5  ea8  ea11 |
        //  | e3  e7  e11  e15 |   |   0    0    0     1 |
        const e0 = ea[0];
        const e1 = ea[1];
        const e2 = ea[2];
        const e4 = ea[3];
        const e5 = ea[4];
        const e6 = ea[5];
        const e8 = ea[6];
        const e9 = ea[7];
        const e10 = ea[8];
        const e12 = ea[9];
        const e13 = ea[10];
        const e14 = ea[11];

        return new Matrix4([e0, e1, e2, 0, e4, e5, e6, 0, e8, e9, e10, 0, e12, e13, e14, 1]);
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

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | + | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public add(mat: ReadonlyMatrix4): Matrix4 {
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

    public clone(): Matrix4 {
        return new Matrix4([...this.elements]);
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

    public eq(mat: ReadonlyMatrix4): boolean {
        const ea = this.elements;
        const eb = mat.elements;

        return (
            ea[0] === eb[0] &&
            ea[1] === eb[1] &&
            ea[2] === eb[2] &&
            ea[3] === eb[3] &&
            ea[4] === eb[4] &&
            ea[5] === eb[5] &&
            ea[6] === eb[6] &&
            ea[7] === eb[7] &&
            ea[8] === eb[8] &&
            ea[9] === eb[9] &&
            ea[10] === eb[10] &&
            ea[11] === eb[11] &&
            ea[12] === eb[12] &&
            ea[13] === eb[13] &&
            ea[14] === eb[14] &&
            ea[15] === eb[15]
        );
    }

    public extractSRT(): { s: Vector3; r: Quaternion; t: Vector3 } {
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
        const t = new Vector3(e[12], e[13], e[14]);

        return { s, r, t };
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | * | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public mul(mat: ReadonlyMatrix4): Matrix4 {
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
     * | e3  e7  e11  e15 |   | w |
     * ```
     */
    public mulV(v: ReadonlyVector4): Vector4 {
        const e = this.elements;

        const x = e[0] * v.x + e[4] * v.y + e[8] * v.z + e[12] * v.w;
        const y = e[1] * v.x + e[5] * v.y + e[9] * v.z + e[13] * v.w;
        const z = e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14] * v.w;
        const w = e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15] * v.w;

        return new Vector4(x, y, z, w);
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

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | + | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public setAdd(mat1: ReadonlyMatrix4, mat2: ReadonlyMatrix4): void {
        const ea = mat1.elements;
        const eb = mat2.elements;
        const e = this.elements;

        e[0] = ea[0] + eb[0];
        e[1] = ea[1] + eb[1];
        e[2] = ea[2] + eb[2];
        e[3] = ea[3] + eb[3];
        e[4] = ea[4] + eb[4];
        e[5] = ea[5] + eb[5];
        e[6] = ea[6] + eb[6];
        e[7] = ea[7] + eb[7];
        e[8] = ea[8] + eb[8];
        e[9] = ea[9] + eb[9];
        e[10] = ea[10] + eb[10];
        e[11] = ea[11] + eb[11];
        e[12] = ea[12] + eb[12];
        e[13] = ea[13] + eb[13];
        e[14] = ea[14] + eb[14];
        e[15] = ea[15] + eb[15];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFrom(mat: ReadonlyMatrix4): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea4   ea8  ea12 |
        //  | e1  e5   e9  e13 | = | ea1  ea5   ea9  ea13 |
        //  | e2  e6  e10  e14 |   | ea2  ea6  ea10  ea14 |
        //  | e3  e7  e11  e15 |   | ea3  ea7  ea11  ea15 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = ea[3];
        e[4] = ea[4];
        e[5] = ea[5];
        e[6] = ea[6];
        e[7] = ea[7];
        e[8] = ea[8];
        e[9] = ea[9];
        e[10] = ea[10];
        e[11] = ea[11];
        e[12] = ea[12];
        e[13] = ea[13];
        e[14] = ea[14];
        e[15] = ea[15];
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3(mat: ReadonlyMatrix3): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea3  ea6  0 |
        //  | e1  e5   e9  e13 | = | ea1  ea4  ea7  0 |
        //  | e2  e6  e10  e14 |   | ea2  ea5  ea8  0 |
        //  | e3  e7  e11  e15 |   |   0    0    0  1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = 0;
        e[4] = ea[3];
        e[5] = ea[4];
        e[6] = ea[5];
        e[7] = 0;
        e[8] = ea[6];
        e[9] = ea[7];
        e[10] = ea[8];
        e[11] = 0;
        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix3A(mat: ReadonlyMatrix3A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea2  ea4  0 |
        //  | e1  e5   e9  e13 | = | ea1  ea3  ea5  0 |
        //  | e2  e6  e10  e14 |   |   0    0    1  0 |
        //  | e3  e7  e11  e15 |   |   0    0    0  1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = 0;
        e[3] = 0;
        e[4] = ea[2];
        e[5] = ea[3];
        e[6] = 0;
        e[7] = 0;
        e[8] = ea[4];
        e[9] = ea[5];
        e[10] = 1;
        e[11] = 0;
        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;
    }

    /**
     * Sets values from `mat` to this matrix.
     */
    public setFromMatrix4A(mat: ReadonlyMatrix4A): void {
        const ea = mat.elements;
        const e = this.elements;

        //  | e0  e4   e8  e12 |   | ea0  ea3  ea6   ea9 |
        //  | e1  e5   e9  e13 | = | ea1  ea4  ea7  ea10 |
        //  | e2  e6  e10  e14 |   | ea2  ea5  ea8  ea11 |
        //  | e3  e7  e11  e15 |   |   0    0    0     1 |
        e[0] = ea[0];
        e[1] = ea[1];
        e[2] = ea[2];
        e[3] = 0;
        e[4] = ea[3];
        e[5] = ea[4];
        e[6] = ea[5];
        e[7] = 0;
        e[8] = ea[6];
        e[9] = ea[7];
        e[10] = ea[8];
        e[11] = 0;
        e[12] = ea[9];
        e[13] = ea[10];
        e[14] = ea[11];
        e[15] = 1;
    }

    /**
     * Sets a right-handed orthographic projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::orthoRH_ZO`.
     */
    public setFromOrthographicFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, 0, e12, e13, e14, 1);
    }

    /**
     * Sets a right-handed orthographic projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::orthoRH_NO`.
     */
    public setFromOrthographicFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, 0, e12, e13, e14, 1);
    }

    /**
     * Sets a right-handed perspective projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::perspectiveRH_ZO`.
     */
    public setFromPerspective(fovY: number, aspectRatio: number, near: number, far: number): void {
        const cot = 1 / Math.tan(0.5 * fovY);

        // | e0   0    0    0 |
        // |  0  e5    0    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = cot / aspectRatio;
        const e5 = cot;
        const e10 = far / (near - far);
        const e14 = (near * far) / (near - far);

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, -1, 0, 0, e14, 0);
    }

    /**
     * Sets a right-handed perspective projection matrix with a depth range of `[0, 1]`.
     *
     * Values equal to `glm::frustumRH_ZO`.
     */
    public setFromPerspectiveFrustum(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, e8, e9, e10, -1, 0, 0, e14, 0);
    }

    /**
     * Sets a right-handed perspective projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::frustumRH_NO`.
     */
    public setFromPerspectiveFrustumGL(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): void {
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

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, e8, e9, e10, -1, 0, 0, e14, 0);
    }

    /**
     * Sets a right-handed perspective projection matrix with a depth range of `[-1, 1]`.
     *
     * Values equal to `glm::perspectiveRH_NO`.
     */
    public setFromPerspectiveGL(fovY: number, aspectRatio: number, near: number, far: number): void {
        const cot = 1 / Math.tan(0.5 * fovY);

        // | e0   0    0    0 |
        // |  0  e5    0    0 |
        // |  0   0  e10  e14 |
        // |  0   0   -1    0 |
        const e0 = cot / aspectRatio;
        const e5 = cot;
        const e10 = (near + far) / (near - far);
        const e14 = (2 * far * near) / (near - far);

        this.set(e0, 0, 0, 0, 0, e5, 0, 0, 0, 0, e10, -1, 0, 0, e14, 0);
    }

    /**
     * ```
     * | q0  q3  q6  0 |
     * | q1  q4  q7  0 |
     * | q2  q5  q8  0 |
     * |  0   0   0  1 |
     * ```
     */
    public setFromRotation(qa: number, qb: number, qc: number, qd: number): void {
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
     * | sx   0   0  0 |
     * |  0  sy   0  0 |
     * |  0   0  sz  0 |
     * |  0   0   0  1 |
     * ```
     */
    public setFromScale(sx: number, sy: number, sz: number): void {
        this.set(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * |  1   0   0  0 |
     * |  0   1   0  0 |
     * |  0   0   1  0 |
     * | tx  ty  tz  1 |
     * ```
     */
    public setFromTranslation(tx: number, ty: number, tz: number): void {
        this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
    }

    /**
     * Sets a view matrix where `x` is right, `y` is up and `-z` is forward.
     */
    public setFromView(offset: ReadonlyVector3, direction: ReadonlyVector3, up: ReadonlyVector3): void {
        // Orthonormal basis
        const v3 = direction.neg().unit();
        const v1 = up.cross(v3).unit();
        const v2 = v3.cross(v1);

        // The inverse of the view matrix is the camera transform:
        // ```
        // | 1  0  0  x |   | v1x  v2x  v3x  0 |
        // | 0  1  0  y | * | v1y  v2y  v3y  0 |
        // | 0  0  1  z |   | v1z  v2z  v3z  0 |
        // | 0  0  0  1 |   |   0    0    0  1 |
        // ```
        // Because the inverse of an orthogonal matrix is just its transpose
        // and `(A * B)^-1 = B^-1 * A^-1`, the view matrix is:
        // ```
        // | v1x  v2y  v3z  0 |   | 1  0  0  -x |
        // | v2x  v2y  v2z  0 | * | 0  1  0  -y |
        // | v3x  v3y  v3z  0 |   | 0  0  1  -z |
        // |   0    0    0  1 |   | 0  0  0   1 |
        // ```
        const e0 = v1.x;
        const e1 = v2.x;
        const e2 = v3.x;
        const e4 = v1.y;
        const e5 = v2.y;
        const e6 = v3.y;
        const e8 = v1.z;
        const e9 = v2.z;
        const e10 = v3.z;
        const e12 = -offset.dot(v1);
        const e13 = -offset.dot(v2);
        const e14 = -offset.dot(v3);

        this.set(e0, e1, e2, 0, e4, e5, e6, 0, e8, e9, e10, 0, e12, e13, e14, 1);
    }

    public setInverse(mat: ReadonlyMatrix4): void {
        const det = mat.determinant();

        if (det === 0) {
            this.setToIdentity();
            return;
        }

        const detInv = 1 / det;
        const ea = mat.elements;

        const e0a = ea[15] * (ea[5] * ea[10] - ea[6] * ea[9]);
        const e0b = ea[14] * (ea[5] * ea[11] - ea[7] * ea[9]);
        const e0c = ea[13] * (ea[6] * ea[11] - ea[7] * ea[10]);
        const e0 = detInv * (e0a - e0b + e0c);

        const e1a = ea[15] * (ea[2] * ea[9] - ea[1] * ea[10]);
        const e1b = ea[14] * (ea[3] * ea[9] - ea[1] * ea[11]);
        const e1c = ea[13] * (ea[3] * ea[10] - ea[2] * ea[11]);
        const e1 = detInv * (e1a - e1b + e1c);

        const e2a = ea[15] * (ea[1] * ea[6] - ea[2] * ea[5]);
        const e2b = ea[14] * (ea[1] * ea[7] - ea[3] * ea[5]);
        const e2c = ea[13] * (ea[2] * ea[7] - ea[3] * ea[6]);
        const e2 = detInv * (e2a - e2b + e2c);

        const e3a = ea[11] * (ea[2] * ea[5] - ea[1] * ea[6]);
        const e3b = ea[10] * (ea[3] * ea[5] - ea[1] * ea[7]);
        const e3c = ea[9] * (ea[3] * ea[6] - ea[2] * ea[7]);
        const e3 = detInv * (e3a - e3b + e3c);

        const e4a = ea[15] * (ea[6] * ea[8] - ea[4] * ea[10]);
        const e4b = ea[14] * (ea[7] * ea[8] - ea[4] * ea[11]);
        const e4c = ea[12] * (ea[7] * ea[10] - ea[6] * ea[11]);
        const e4 = detInv * (e4a - e4b + e4c);

        const e5a = ea[15] * (ea[0] * ea[10] - ea[2] * ea[8]);
        const e5b = ea[14] * (ea[0] * ea[11] - ea[3] * ea[8]);
        const e5c = ea[12] * (ea[2] * ea[11] - ea[3] * ea[10]);
        const e5 = detInv * (e5a - e5b + e5c);

        const e6a = ea[15] * (ea[2] * ea[4] - ea[0] * ea[6]);
        const e6b = ea[14] * (ea[3] * ea[4] - ea[0] * ea[7]);
        const e6c = ea[12] * (ea[3] * ea[6] - ea[2] * ea[7]);
        const e6 = detInv * (e6a - e6b + e6c);

        const e7a = ea[11] * (ea[0] * ea[6] - ea[2] * ea[4]);
        const e7b = ea[10] * (ea[0] * ea[7] - ea[3] * ea[4]);
        const e7c = ea[8] * (ea[2] * ea[7] - ea[3] * ea[6]);
        const e7 = detInv * (e7a - e7b + e7c);

        const e8a = ea[15] * (ea[4] * ea[9] - ea[5] * ea[8]);
        const e8b = ea[13] * (ea[4] * ea[11] - ea[7] * ea[8]);
        const e8c = ea[12] * (ea[5] * ea[11] - ea[7] * ea[9]);
        const e8 = detInv * (e8a - e8b + e8c);

        const e9a = ea[15] * (ea[1] * ea[8] - ea[0] * ea[9]);
        const e9b = ea[13] * (ea[3] * ea[8] - ea[0] * ea[11]);
        const e9c = ea[12] * (ea[3] * ea[9] - ea[1] * ea[11]);
        const e9 = detInv * (e9a - e9b + e9c);

        const e10a = ea[15] * (ea[0] * ea[5] - ea[1] * ea[4]);
        const e10b = ea[13] * (ea[0] * ea[7] - ea[3] * ea[4]);
        const e10c = ea[12] * (ea[1] * ea[7] - ea[3] * ea[5]);
        const e10 = detInv * (e10a - e10b + e10c);

        const e11a = ea[11] * (ea[1] * ea[4] - ea[0] * ea[5]);
        const e11b = ea[9] * (ea[3] * ea[4] - ea[0] * ea[7]);
        const e11c = ea[8] * (ea[3] * ea[5] - ea[1] * ea[7]);
        const e11 = detInv * (e11a - e11b + e11c);

        const e12a = ea[14] * (ea[5] * ea[8] - ea[4] * ea[9]);
        const e12b = ea[13] * (ea[6] * ea[8] - ea[4] * ea[10]);
        const e12c = ea[12] * (ea[6] * ea[9] - ea[5] * ea[10]);
        const e12 = detInv * (e12a - e12b + e12c);

        const e13a = ea[14] * (ea[0] * ea[9] - ea[1] * ea[8]);
        const e13b = ea[13] * (ea[0] * ea[10] - ea[2] * ea[8]);
        const e13c = ea[12] * (ea[1] * ea[10] - ea[2] * ea[9]);
        const e13 = detInv * (e13a - e13b + e13c);

        const e14a = ea[14] * (ea[1] * ea[4] - ea[0] * ea[5]);
        const e14b = ea[13] * (ea[2] * ea[4] - ea[0] * ea[6]);
        const e14c = ea[12] * (ea[2] * ea[5] - ea[1] * ea[6]);
        const e14 = detInv * (e14a - e14b + e14c);

        const e15a = ea[10] * (ea[0] * ea[5] - ea[1] * ea[4]);
        const e15b = ea[9] * (ea[0] * ea[6] - ea[2] * ea[4]);
        const e15c = ea[8] * (ea[1] * ea[6] - ea[2] * ea[5]);
        const e15 = detInv * (e15a - e15b + e15c);

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | * | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public setMul(mat1: ReadonlyMatrix4, mat2: ReadonlyMatrix4): void {
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
     * | q0  q3  q6  0 |   | ea0  ea4   ea8  ea12 |
     * | q1  q4  q7  0 | * | ea1  ea5   ea9  ea13 |
     * | q2  q5  q8  0 |   | ea2  ea6  ea10  ea14 |
     * |  0   0   0  1 |   | ea3  ea7  ea11  ea15 |
     * ```
     */
    public setRotate(mat: ReadonlyMatrix4, qa: number, qb: number, qc: number, qd: number): void {
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

        const ea = mat.elements;
        const e = this.elements;

        const e0 = q0 * ea[0] + q3 * ea[1] + q6 * ea[2];
        const e1 = q1 * ea[0] + q4 * ea[1] + q7 * ea[2];
        const e2 = q2 * ea[0] + q5 * ea[1] + q8 * ea[2];
        e[0] = e0;
        e[1] = e1;
        e[2] = e2;

        const e4 = q0 * ea[4] + q3 * ea[5] + q6 * ea[6];
        const e5 = q1 * ea[4] + q4 * ea[5] + q7 * ea[6];
        const e6 = q2 * ea[4] + q5 * ea[5] + q8 * ea[6];
        e[4] = e4;
        e[5] = e5;
        e[6] = e6;

        const e8 = q0 * ea[8] + q3 * ea[9] + q6 * ea[10];
        const e9 = q1 * ea[8] + q4 * ea[9] + q7 * ea[10];
        const e10 = q2 * ea[8] + q5 * ea[9] + q8 * ea[10];
        e[8] = e8;
        e[9] = e9;
        e[10] = e10;

        const e12 = q0 * ea[12] + q3 * ea[13] + q6 * ea[14];
        const e13 = q1 * ea[12] + q4 * ea[13] + q7 * ea[14];
        const e14 = q2 * ea[12] + q5 * ea[13] + q8 * ea[14];
        e[12] = e12;
        e[13] = e13;
        e[14] = e14;
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | q0  q3  q6  0 |
     * | ea1  ea5   ea9  ea13 | * | q1  q4  q7  0 |
     * | ea2  ea6  ea10  ea14 |   | q2  q5  q8  0 |
     * | ea3  ea7  ea11  ea15 |   |  0   0   0  1 |
     * ```
     */
    public setRotatePre(mat: ReadonlyMatrix4, qa: number, qb: number, qc: number, qd: number): void {
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

        const ea = mat.elements;
        const e = this.elements;

        const e0 = ea[0] * q0 + ea[4] * q1 + ea[8] * q2;
        const e4 = ea[0] * q3 + ea[4] * q4 + ea[8] * q5;
        const e8 = ea[0] * q6 + ea[4] * q7 + ea[8] * q8;
        e[0] = e0;
        e[4] = e4;
        e[8] = e8;

        const e1 = ea[1] * q0 + ea[5] * q1 + ea[9] * q2;
        const e5 = ea[1] * q3 + ea[5] * q4 + ea[9] * q5;
        const e9 = ea[1] * q6 + ea[5] * q7 + ea[9] * q8;
        e[1] = e1;
        e[5] = e5;
        e[9] = e9;

        const e2 = ea[2] * q0 + ea[6] * q1 + ea[10] * q2;
        const e6 = ea[2] * q1 + ea[6] * q4 + ea[10] * q5;
        const e10 = ea[2] * q2 + ea[6] * q7 + ea[10] * q8;
        e[2] = e2;
        e[6] = e6;
        e[10] = e10;

        const e3 = ea[3] * q0 + ea[7] * q1 + ea[11] * q2;
        const e7 = ea[3] * q1 + ea[7] * q4 + ea[11] * q5;
        const e11 = ea[3] * q2 + ea[7] * q7 + ea[11] * q8;
        e[3] = e3;
        e[7] = e7;
        e[11] = e11;
    }

    /**
     * ```
     * | sx   0   0  0 |   | ea0  ea4   ea8  ea12 |
     * |  0  sy   0  0 | * | ea1  ea5   ea9  ea13 |
     * |  0   0  sz  0 |   | ea2  ea6  ea10  ea14 |
     * |  0   0   0  1 |   | ea3  ea7  ea11  ea15 |
     * ```
     */
    public setScale(mat: ReadonlyMatrix4, sx: number, sy: number, sz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = sx * ea[0];
        e[1] = sy * ea[1];
        e[2] = sz * ea[2];

        e[4] = sx * ea[4];
        e[5] = sy * ea[5];
        e[6] = sz * ea[6];

        e[8] = sx * ea[8];
        e[9] = sy * ea[9];
        e[10] = sz * ea[10];

        e[12] = sx * ea[12];
        e[13] = sy * ea[13];
        e[14] = sz * ea[14];
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | sx   0   0  0 |
     * | ea1  ea5   ea9  ea13 | * |  0  sy   0  0 |
     * | ea2  ea6  ea10  ea14 |   |  0   0  sz  0 |
     * | ea3  ea7  ea11  ea15 |   |  0   0   0  1 |
     * ```
     */
    public setScalePre(mat: ReadonlyMatrix4, sx: number, sy: number, sz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] * sx;
        e[1] = ea[1] * sx;
        e[2] = ea[2] * sx;
        e[3] = ea[3] * sx;

        e[4] = ea[4] * sy;
        e[5] = ea[5] * sy;
        e[6] = ea[6] * sy;
        e[7] = ea[7] * sy;

        e[8] = ea[8] * sz;
        e[9] = ea[9] * sz;
        e[10] = ea[10] * sz;
        e[11] = ea[11] * sz;
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | - | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public setSub(mat1: ReadonlyMatrix4, mat2: ReadonlyMatrix4): void {
        const ea = mat1.elements;
        const eb = mat2.elements;
        const e = this.elements;

        e[0] = ea[0] - eb[0];
        e[1] = ea[1] - eb[1];
        e[2] = ea[2] - eb[2];
        e[3] = ea[3] - eb[3];
        e[4] = ea[4] - eb[4];
        e[5] = ea[5] - eb[5];
        e[6] = ea[6] - eb[6];
        e[7] = ea[7] - eb[7];
        e[8] = ea[8] - eb[8];
        e[9] = ea[9] - eb[9];
        e[10] = ea[10] - eb[10];
        e[11] = ea[11] - eb[11];
        e[12] = ea[12] - eb[12];
        e[13] = ea[13] - eb[13];
        e[14] = ea[14] - eb[14];
        e[15] = ea[15] - eb[15];
    }

    /**
     * ```
     * | 1  0  0  0 |
     * | 0  1  0  0 |
     * | 0  0  1  0 |
     * | 0  0  0  1 |
     * ```
     */
    public setToIdentity(): void {
        this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * ```
     */
    public setToZero(): void {
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /**
     * ```
     * | 1  0  0  tx |   | ea0  ea4   ea8  ea12 |
     * | 0  1  0  ty | * | ea1  ea5   ea9  ea13 |
     * | 0  0  1  tz |   | ea2  ea6  e1a0  ea14 |
     * | 0  0  0   1 |   | ea3  ea7  e1a1  ea15 |
     * ```
     */
    public setTranslate(mat: ReadonlyMatrix4, tx: number, ty: number, tz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[0] = ea[0] + tx * ea[3];
        e[1] = ea[1] + ty * ea[3];
        e[2] = ea[2] + tz * ea[3];

        e[4] = ea[4] + tx * ea[7];
        e[5] = ea[5] + ty * ea[7];
        e[6] = ea[6] + tz * ea[7];

        e[8] = ea[8] + tx * ea[11];
        e[9] = ea[9] + ty * ea[11];
        e[10] = ea[10] + tz * ea[11];

        e[12] = ea[12] + tx * ea[15];
        e[13] = ea[13] + ty * ea[15];
        e[14] = ea[14] + tz * ea[15];
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | 1  0  0  tx |
     * | ea1  ea5   ea9  ea13 | * | 0  1  0  ty |
     * | ea2  ea6  ea10  ea14 |   | 0  0  1  tz |
     * | ea3  ea7  ea11  ea15 |   | 0  0  0   1 |
     * ```
     */
    public setTranslatePre(mat: ReadonlyMatrix4, tx: number, ty: number, tz: number): void {
        const ea = mat.elements;
        const e = this.elements;

        e[12] = ea[0] * tx + ea[4] * ty + ea[8] * tz + ea[12];
        e[13] = ea[1] * tx + ea[5] * ty + ea[9] * tz + ea[13];
        e[14] = ea[2] * tx + ea[6] * ty + ea[10] * tz + ea[14];
        e[15] = ea[3] * tx + ea[7] * ty + ea[11] * tz + ea[15];
    }

    public setTranspose(mat: ReadonlyMatrix4): void {
        const ea = mat.elements;

        // | e0  e4   e8  e12 |   |  ea0   ea1   ea2   ea3 |
        // | e1  e5   e9  e13 | = |  ea4   ea5   ea6   ea7 |
        // | e2  e6  e10  e14 |   |  ea8   ea9  ea10  ea11 |
        // | e3  e7  e11  e15 |   | ea12  ea13  ea14  ea15 |
        const e0 = ea[0];
        const e1 = ea[4];
        const e2 = ea[8];
        const e3 = ea[12];
        const e4 = ea[1];
        const e5 = ea[5];
        const e6 = ea[9];
        const e7 = ea[13];
        const e8 = ea[2];
        const e9 = ea[6];
        const e10 = ea[10];
        const e11 = ea[14];
        const e12 = ea[3];
        const e13 = ea[7];
        const e14 = ea[11];
        const e15 = ea[15];

        this.set(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15);
    }

    /**
     * ```
     * | ea0  ea4   ea8  ea12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  ea13 | - | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  ea14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  ea15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public sub(mat: ReadonlyMatrix4): Matrix4 {
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

    public toArray(): MatrixElements4 {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        let str = "{e0: " + e[0] + ", e4: " + e[4] + ", e8: " + e[8] + ", e12: " + e[12] + ",\n";
        str += " e1: " + e[1] + ", e5: " + e[5] + ", e9: " + e[9] + ", e13: " + e[13] + ",\n";
        str += " e2: " + e[2] + ", e6: " + e[6] + ", e10: " + e[10] + ", e14: " + e[14] + ",\n";
        str += " e3: " + e[3] + ", e7: " + e[7] + ", e11: " + e[11] + ", e15: " + e[15] + "}";

        return str;
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 1 |
     * ```
     */
    public transformPoint(p: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12];
        const y = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13];
        const z = e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14];
        const w = e[3] * p.x + e[7] * p.y + e[11] * p.z + e[15];

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 1 |
     * ```
     */
    public transformPointXYZ(px: number, py: number, pz: number): Vector3 {
        const e = this.elements;

        const x = e[0] * px + e[4] * py + e[8] * pz + e[12];
        const y = e[1] * px + e[5] * py + e[9] * pz + e[13];
        const z = e[2] * px + e[6] * py + e[10] * pz + e[14];
        const w = e[3] * px + e[7] * py + e[11] * pz + e[15];

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 0 |
     * ```
     */
    public transformVector(v: ReadonlyVector3): Vector3 {
        const e = this.elements;

        const x = e[0] * v.x + e[4] * v.y + e[8] * v.z;
        const y = e[1] * v.x + e[5] * v.y + e[9] * v.z;
        const z = e[2] * v.x + e[6] * v.y + e[10] * v.z;
        const w = e[3] * v.x + e[7] * v.y + e[11] * v.z;

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | x |
     * | e1  e5   e9  e13 | * | y |
     * | e2  e6  e10  e14 |   | z |
     * | e3  e7  e11  e15 |   | 0 |
     * ```
     */
    public transformVectorXYZ(vx: number, vy: number, vz: number): Vector3 {
        const e = this.elements;

        const x = e[0] * vx + e[4] * vy + e[8] * vz;
        const y = e[1] * vx + e[5] * vy + e[9] * vz;
        const z = e[2] * vx + e[6] * vy + e[10] * vz;
        const w = e[3] * vx + e[7] * vy + e[11] * vz;

        return Vector3.fromXYZW(x, y, z, w);
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
