import { getMaxEigenvalueSym2x2, getMaxEigenvalueSym3x3 } from "../internal/matrix.js";
import { Point2, Point3 } from "./point.js";
import { Vector2, Vector3 } from "./vector.js";

export enum MatrixType {
    Affine,
    Projective,
}

/**
 * Represents a column-major matrix for affine transformations in 2D:
 * ```
 * | e0  e3  0 |
 * | e1  e4  0 |
 * | e2  e5  1 |
 * ```
 */
export class Matrix3A {
    public readonly elements: [number, number, number, number, number, number];

    /**
     * ```
     * | e0  e3  0 |
     * | e1  e4  0 |
     * | e2  e5  1 |
     * ```
     */
    public constructor(elements: [number, number, number, number, number, number]) {
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
        return new Matrix3A([1, 0, 0, 0, 1, 0]);
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
        const z1 = -zb;
        const z2 = zb;
        const z3 = za;

        return new Matrix3A([z0, z1, 0, z2, z3, 0]);
    }

    /**
     * ```
     * | sx   0  0 |
     * |  0  sy  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromScale(sx: number, sy: number): Matrix3A {
        return new Matrix3A([sx, 0, 0, 0, sy, 0]);
    }

    /**
     * ```
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3A {
        return new Matrix3A([1, 0, tx, 0, 1, ty]);
    }

    /**
     * ```
     * | ea0  ea3  0 |   | eb0  eb3  0 |
     * | ea1  ea4  0 | + | eb1  eb4  0 |
     * | ea2  ea5  1 |   | eb2  eb5  1 |
     * ```
     */
    public add(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] += eb[0];
        ea[1] += eb[1];
        ea[2] += eb[2];
        ea[3] += eb[3];
        ea[4] += eb[4];
        ea[5] += eb[5];
    }

    /**
     * ```
     * | eb0  eb3  0 |   | ea0  ea3  0 |
     * | eb1  eb4  0 | + | ea1  ea4  0 |
     * | eb2  eb5  1 |   | ea2  ea5  1 |
     * ```
     */
    public addPre(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] += ea[0];
        eb[1] += ea[1];
        eb[2] += ea[2];
        eb[3] += ea[3];
        eb[4] += ea[4];
        eb[5] += ea[5];
    }

    public clone(): Matrix3A {
        return new Matrix3A([...this.elements]);
    }

    public copyFrom(mat: Matrix3A | Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] = eb[0];
        ea[1] = eb[1];
        ea[2] = eb[2];
        ea[3] = eb[3];
        ea[4] = eb[4];
        ea[5] = eb[5];
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

    public getDeterminant(): number {
        const e = this.elements;
        return e[0] * e[4] - e[1] * e[3];
    }

    public getInverse(): Matrix3A {
        const det = this.getDeterminant();

        if (det === 0) {
            return Matrix3A.createIdentity();
        }

        const detInv = 1 / det;
        const e = this.elements;

        const e0 = detInv * e[4];
        const e1 = detInv * -e[1];
        const e2 = detInv * (e[1] * e[5] - e[2] * e[4]);
        const e3 = detInv * -e[3];
        const e4 = detInv * e[0];
        const e5 = detInv * (e[2] * e[3] - e[0] * e[5]);

        return new Matrix3A([e0, e1, e2, e3, e4, e5]);
    }

    public getMaxScale(): number {
        const e = this.elements;

        // Compute elements of `S^2 = M * M^T`
        const s11 = e[0] * e[0] + e[1] * e[1];
        const s12 = e[0] * e[3] + e[1] * e[4];
        const s22 = e[3] * e[3] + e[4] * e[4];

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const eig = getMaxEigenvalueSym2x2(s11, s12, s22);

        return Math.sqrt(eig);
    }

    /**
     * ```
     *               | e0  e3  0 |
     * | x  y  1 | * | e1  e4  0 |
     *               | e2  e5  1 |
     * ```
     */
    public mapPoint(p: Point2): Point2 {
        const e = this.elements;

        const x = p.x * e[0] + p.y * e[1] + e[2];
        const y = p.x * e[3] + p.y * e[4] + e[5];

        return new Point2(x, y);
    }

    /**
     * ```
     *               | e0  e3  0 |
     * | x  y  1 | * | e1  e4  0 |
     *               | e2  e5  1 |
     * ```
     */
    public mapVector(v: Vector2): Vector2 {
        const e = this.elements;

        const x = v.x * e[0] + v.y * e[1] + e[2];
        const y = v.x * e[3] + v.y * e[4] + e[5];

        return new Vector2(x, y);
    }

    /**
     * ```
     * | ea0  ea3  0 |   | eb0  eb3  0 |
     * | ea1  ea4  0 | * | eb1  eb4  0 |
     * | ea2  ea5  1 |   | eb2  eb5  1 |
     * ```
     */
    public mul(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = ea[0] * eb[0] + ea[3] * eb[1];
        const ea3 = ea[0] * eb[3] + ea[3] * eb[4];
        ea[0] = ea0;
        ea[3] = ea3;

        const ea1 = ea[1] * eb[0] + ea[4] * eb[1];
        const ea4 = ea[1] * eb[3] + ea[4] * eb[4];
        ea[1] = ea1;
        ea[4] = ea4;

        const ea2 = ea[2] * eb[0] + ea[5] * eb[1] + eb[2];
        const ea5 = ea[2] * eb[3] + ea[5] * eb[4] + eb[5];
        ea[2] = ea2;
        ea[5] = ea5;
    }

    /**
     * ```
     * | eb0  eb3  0 |   | ea0  ea3  0 |
     * | eb1  eb4  0 | * | ea1  ea4  0 |
     * | eb2  eb5  1 |   | ea2  ea5  1 |
     * ```
     */
    public mulPre(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = eb[0] * ea[0] + eb[3] * ea[1];
        const ea1 = eb[1] * ea[0] + eb[4] * ea[1];
        const ea2 = eb[2] * ea[0] + eb[5] * ea[1] + ea[2];
        ea[0] = ea0;
        ea[1] = ea1;
        ea[2] = ea2;

        const ea3 = eb[0] * ea[3] + eb[3] * ea[4];
        const ea4 = eb[1] * ea[3] + eb[4] * ea[4];
        const ea5 = eb[2] * ea[3] + eb[5] * ea[4] + ea[5];
        ea[3] = ea3;
        ea[4] = ea4;
        ea[5] = ea5;
    }

    /**
     * ```
     * | e0  e3  0 |   | z0  z2  0 |
     * | e1  e4  0 | * | z1  z3  0 |
     * | e2  e5  1 |   |  0   0  1 |
     * ```
     */
    public rotate(za: number, zb: number): void {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
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
     * | z0  z2  0 |   | e0  e3  0 |
     * | z1  z3  0 | * | e1  e4  0 |
     * |  0   0  1 |   | e2  e5  1 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
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
        const z1 = -zb;
        const z2 = zb;
        const z3 = za;

        this.set(z0, z1, 0, z2, z3, 0);
    }

    /**
     * ```
     * | e0  e3  0 |   | sx   0  0 |
     * | e1  e4  0 | * |  0  sy  0 |
     * | e2  e5  1 |   |  0   0  1 |
     * ```
     */
    public scale(sx: number, sy: number): void {
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
     * | sx   0  0 |   | e0  e3  0 |
     * |  0  sy  0 | * | e1  e4  0 |
     * |  0   0  1 |   | e2  e5  1 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
        const e = this.elements;

        e[0] *= sx;
        e[1] *= sy;

        e[3] *= sx;
        e[4] *= sy;
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
     * | e0  e3  0 |
     * | e1  e4  0 |
     * | e2  e5  1 |
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
     * ```
     * | ea0  ea3  0 |   | eb0  eb3  0 |
     * | ea1  ea4  0 | - | eb1  eb4  0 |
     * | ea2  ea5  1 |   | eb2  eb5  1 |
     * ```
     */
    public sub(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] -= eb[0];
        ea[1] -= eb[1];
        ea[2] -= eb[2];
        ea[3] -= eb[3];
        ea[4] -= eb[4];
        ea[5] -= eb[5];
    }

    /**
     * ```
     * | eb0  eb3  0 |   | ea0  ea3  0 |
     * | eb1  eb4  0 | - | ea1  ea4  0 |
     * | eb2  eb5  1 |   | ea2  ea5  1 |
     * ```
     */
    public subPre(mat: Matrix3A): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] -= ea[0];
        eb[1] -= ea[1];
        eb[2] -= ea[2];
        eb[3] -= ea[3];
        eb[4] -= ea[4];
        eb[5] -= ea[5];
    }

    public toArray(): number[] {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e3: ${e[3]},\n` +
            ` e1: ${e[1]}, e4: ${e[4]},\n` +
            ` e2: ${e[2]}, e5: ${e[5]}}`
        );
    }

    /**
     * ```
     * | e0  e3  0 |   |  1   0  0 |
     * | e1  e4  0 | * |  0   1  0 |
     * | e2  e5  1 |   | tx  ty  1 |
     * ```
     */
    public translate(tx: number, ty: number): void {
        const e = this.elements;

        e[2] += tx;
        e[5] += ty;
    }

    /**
     * ```
     * |  1   0  0 |   | e0  e3  0 |
     * |  0   1  0 | * | e1  e4  0 |
     * | tx  ty  1 |   | e2  e5  1 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        const e = this.elements;

        e[2] += tx * e[0] + ty * e[1];
        e[5] += tx * e[3] + ty * e[4];
    }

    /**
     * ```
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, tx, 0, 1, ty);
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
    public readonly elements: [number, number, number, number, number, number, number, number, number];

    /**
     * ```
     * | e0  e3  e6 |
     * | e1  e4  e7 |
     * | e2  e5  e8 |
     * ```
     */
    public constructor(elements: [number, number, number, number, number, number, number, number, number]) {
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
     * ```
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public static fromRotation(za: number, zb: number): Matrix3 {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
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
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number): Matrix3 {
        return new Matrix3([1, 0, tx, 0, 1, ty, 0, 0, 1]);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | + | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public add(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] += eb[0];
        ea[1] += eb[1];
        ea[2] += eb[2];
        ea[3] += eb[3];
        ea[4] += eb[4];
        ea[5] += eb[5];
        ea[6] += eb[6];
        ea[7] += eb[7];
        ea[8] += eb[8];
    }

    /**
     * ```
     * | eb0  eb3  eb6 |   | ea0  ea3  ea6 |
     * | eb1  eb4  eb7 | + | ea1  ea4  ea7 |
     * | eb2  eb5  eb8 |   | ea2  ea5  ea8 |
     * ```
     */
    public addPre(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] += ea[0];
        eb[1] += ea[1];
        eb[2] += ea[2];
        eb[3] += ea[3];
        eb[4] += ea[4];
        eb[5] += ea[5];
        eb[6] += ea[6];
        eb[7] += ea[7];
        eb[8] += ea[8];
    }

    public clone(): Matrix3 {
        return new Matrix3([...this.elements]);
    }

    public copyFrom(mat: Matrix3): void {
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

    public getDeterminant(): number {
        const e = this.elements;

        const a = e[0] * (e[4] * e[8] - e[5] * e[7]);
        const b = e[1] * (e[3] * e[8] - e[5] * e[6]);
        const c = e[2] * (e[3] * e[7] - e[4] * e[6]);

        return a - b + c;
    }

    public getInverse(): Matrix3 {
        const det = this.getDeterminant();

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
     *               | e0  e3  e6 |
     * | x  y  1 | * | e1  e4  e7 |
     *               | e2  e5  e8 |
     * ```
     */
    public mapPoint(p: Point2): Point2 {
        const e = this.elements;

        const x = p.x * e[0] + p.y * e[1] + e[2];
        const y = p.x * e[3] + p.y * e[4] + e[5];
        const w = p.x * e[6] + p.y * e[7] + e[8];

        return Point2.fromXYW(x, y, w);
    }

    /**
     * ```
     *               | e0  e3  e6 |
     * | x  y  1 | * | e1  e4  e7 |
     *               | e2  e5  e8 |
     * ```
     */
    public mapVector(v: Vector2): Vector2 {
        const e = this.elements;

        const x = v.x * e[0] + v.y * e[1] + e[2];
        const y = v.x * e[3] + v.y * e[4] + e[5];
        const w = v.x * e[6] + v.y * e[7] + e[8];

        return Vector2.fromXYW(x, y, w);
    }

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | * | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public mul(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = ea[0] * eb[0] + ea[3] * eb[1] + ea[6] * eb[2];
        const ea3 = ea[0] * eb[3] + ea[3] * eb[4] + ea[6] * eb[5];
        const ea6 = ea[0] * eb[6] + ea[3] * eb[7] + ea[6] * eb[8];
        ea[0] = ea0;
        ea[3] = ea3;
        ea[6] = ea6;

        const ea1 = ea[1] * eb[0] + ea[4] * eb[1] + ea[7] * eb[2];
        const ea4 = ea[1] * eb[3] + ea[4] * eb[4] + ea[7] * eb[5];
        const ea7 = ea[1] * eb[6] + ea[4] * eb[7] + ea[7] * eb[8];
        ea[1] = ea1;
        ea[4] = ea4;
        ea[7] = ea7;

        const ea2 = ea[2] * eb[0] + ea[5] * eb[1] + ea[8] * eb[2];
        const ea5 = ea[2] * eb[3] + ea[5] * eb[4] + ea[8] * eb[5];
        const ea8 = ea[2] * eb[6] + ea[5] * eb[7] + ea[8] * eb[8];
        ea[2] = ea2;
        ea[5] = ea5;
        ea[8] = ea8;
    }

    /**
     * ```
     * | eb0  eb3  eb6 |   | ea0  ea3  ea6 |
     * | eb1  eb4  eb7 | * | ea1  ea4  ea7 |
     * | eb2  eb5  eb8 |   | ea2  ea5  ea8 |
     * ```
     */
    public mulPre(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = eb[0] * ea[0] + eb[3] * ea[1] + eb[6] * ea[2];
        const ea1 = eb[1] * ea[0] + eb[4] * ea[1] + eb[7] * ea[2];
        const ea2 = eb[2] * ea[0] + eb[5] * ea[1] + eb[8] * ea[2];
        ea[0] = ea0;
        ea[1] = ea1;
        ea[2] = ea2;

        const ea3 = eb[0] * ea[3] + eb[3] * ea[4] + eb[6] * ea[5];
        const ea4 = eb[1] * ea[3] + eb[4] * ea[4] + eb[7] * ea[5];
        const ea5 = eb[2] * ea[3] + eb[5] * ea[4] + eb[8] * ea[5];
        ea[3] = ea3;
        ea[4] = ea4;
        ea[5] = ea5;

        const ea6 = eb[0] * ea[6] + eb[3] * ea[7] + eb[6] * ea[8];
        const ea7 = eb[1] * ea[6] + eb[4] * ea[7] + eb[7] * ea[8];
        const ea8 = eb[2] * ea[6] + eb[5] * ea[7] + eb[8] * ea[8];
        ea[6] = ea6;
        ea[7] = ea7;
        ea[8] = ea8;
    }

    /**
     * ```
     * | e0  e3  e6 |   | z0  z2  0 |
     * | e1  e4  e7 | * | z1  z3  0 |
     * | e2  e5  e8 |   |  0   0  1 |
     * ```
     */
    public rotate(za: number, zb: number): void {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
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
     * | z0  z2  0 |   | e0  e3  e6 |
     * | z1  z3  0 | * | e1  e4  e7 |
     * |  0   0  1 |   | e2  e5  e8 |
     * ```
     */
    public rotatePre(za: number, zb: number): void {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
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
     * | z0  z2  0 |
     * | z1  z3  0 |
     * |  0   0  1 |
     * ```
     */
    public rotateSet(za: number, zb: number): void {
        const z0 = za;
        const z1 = -zb;
        const z2 = zb;
        const z3 = za;

        this.set(z0, z1, 0, z2, z3, 0, 0, 0, 1);
    }

    /**
     * ```
     * | e0  e3  e6 |   | sx   0  0 |
     * | e1  e4  e7 | * |  0  sy  0 |
     * | e2  e5  e8 |   |  0   0  1 |
     * ```
     */
    public scale(sx: number, sy: number): void {
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
     * | sx   0  0 |   | e0  e3  e6 |
     * |  0  sy  0 | * | e1  e4  e7 |
     * |  0   0  1 |   | e2  e5  e8 |
     * ```
     */
    public scalePre(sx: number, sy: number): void {
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

    /**
     * ```
     * | ea0  ea3  ea6 |   | eb0  eb3  eb6 |
     * | ea1  ea4  ea7 | - | eb1  eb4  eb7 |
     * | ea2  ea5  ea8 |   | eb2  eb5  eb8 |
     * ```
     */
    public sub(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] -= eb[0];
        ea[1] -= eb[1];
        ea[2] -= eb[2];
        ea[3] -= eb[3];
        ea[4] -= eb[4];
        ea[5] -= eb[5];
        ea[6] -= eb[6];
        ea[7] -= eb[7];
        ea[8] -= eb[8];
    }

    /**
     * ```
     * | eb0  eb3  eb6 |   | ea0  ea3  ea6 |
     * | eb1  eb4  eb7 | - | ea1  ea4  ea7 |
     * | eb2  eb5  eb8 |   | ea2  ea5  ea8 |
     * ```
     */
    public subPre(mat: Matrix3): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] -= ea[0];
        eb[1] -= ea[1];
        eb[2] -= ea[2];
        eb[3] -= ea[3];
        eb[4] -= ea[4];
        eb[5] -= ea[5];
        eb[6] -= ea[6];
        eb[7] -= ea[7];
        eb[8] -= ea[8];
    }

    public toArray(): number[] {
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
     * | e0  e3  e6 |   |  1   0  0 |
     * | e1  e4  e7 | * |  0   1  0 |
     * | e2  e5  e8 |   | tx  ty  1 |
     * ```
     */
    public translate(tx: number, ty: number): void {
        const e = this.elements;

        e[0] += e[6] * tx;
        e[1] += e[7] * tx;
        e[2] += e[8] * tx;

        e[3] += e[6] * ty;
        e[4] += e[7] * ty;
        e[5] += e[8] * ty;
    }

    /**
     * ```
     * |  1   0  0 |   | e0  e3  e6 |
     * |  0   1  0 | * | e1  e4  e7 |
     * | tx  ty  1 |   | e2  e5  e8 |
     * ```
     */
    public translatePre(tx: number, ty: number): void {
        const e = this.elements;

        e[2] += tx * e[0] + ty * e[1];
        e[5] += tx * e[3] + ty * e[4];
        e[8] += tx * e[6] + ty * e[7];
    }

    /**
     * ```
     * |  1   0  0 |
     * |  0   1  0 |
     * | tx  ty  1 |
     * ```
     */
    public translateSet(tx: number, ty: number): void {
        this.set(1, 0, tx, 0, 1, ty, 0, 0, 1);
    }
}

/**
 * Represents a column-major matrix for affine transformations in 3D:
 * ```
 * | e0  e4   e8  0 |
 * | e1  e5   e9  0 |
 * | e2  e6  e10  0 |
 * | e3  e7  e11  1 |
 * ```
 */
export class Matrix4A {
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
     * | e0  e4   e8  0 |
     * | e1  e5   e9  0 |
     * | e2  e6  e10  0 |
     * | e3  e7  e11  1 |
     * ```
     */
    public constructor(
        elements: [number, number, number, number, number, number, number, number, number, number, number, number],
    ) {
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
        return new Matrix4A([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    }

    /**
     * ```
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * | 0  0  0  0 |
     * ```
     */
    public static createZero(): Matrix4A {
        return new Matrix4A([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

        return new Matrix4A([q0, q1, q2, 0, q3, q4, q5, 0, q6, q7, q8, 0]);
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
        return new Matrix4A([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0]);
    }

    /**
     * ```
     * |  1   0   0  0 |
     * |  0   1   0  0 |
     * |  0   0   1  0 |
     * | tx  ty  tz  1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4A {
        return new Matrix4A([1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz]);
    }

    /**
     * ```
     * | ea0  ea4   ea8  0 |   | eb0  eb4   eb8  0 |
     * | ea1  ea5   ea9  0 | + | eb1  eb5   eb9  0 |
     * | ea2  ea6  ea10  0 |   | eb2  eb6  eb10  0 |
     * | ea3  ea7  ea11  1 |   | eb3  eb7  eb11  1 |
     * ```
     */
    public add(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] += eb[0];
        ea[1] += eb[1];
        ea[2] += eb[2];
        ea[3] += eb[3];
        ea[4] += eb[4];
        ea[5] += eb[5];
        ea[6] += eb[6];
        ea[7] += eb[7];
        ea[8] += eb[8];
        ea[9] += eb[9];
        ea[10] += eb[10];
        ea[11] += eb[11];
    }

    /**
     * ```
     * | eb0  eb4   eb8  0 |   | ea0  ea4   ea8  0 |
     * | eb1  eb5   eb9  0 | + | ea1  ea5   ea9  0 |
     * | eb2  eb6  eb10  0 |   | ea2  ea6  ea10  0 |
     * | eb3  eb7  eb11  1 |   | ea3  ea7  ea11  1 |
     * ```
     */
    public addPre(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] += ea[0];
        eb[1] += ea[1];
        eb[2] += ea[2];
        eb[3] += ea[3];
        eb[4] += ea[4];
        eb[5] += ea[5];
        eb[6] += ea[6];
        eb[7] += ea[7];
        eb[8] += ea[8];
        eb[9] += ea[9];
        eb[10] += ea[10];
        eb[11] += ea[11];
    }

    public clone(): Matrix4A {
        return new Matrix4A([...this.elements]);
    }

    public copyFrom(mat: Matrix4A | Matrix4): void {
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

    public getMaxScale(): number {
        const e = this.elements;

        // Compute elements of `S^2 = M * M^T`
        const s11 = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
        const s12 = e[0] * e[4] + e[1] * e[5] + e[2] * e[6];
        const s13 = e[0] * e[8] + e[1] * e[9] + e[2] * e[10];
        const s22 = e[4] * e[4] + e[5] * e[5] + e[6] * e[6];
        const s23 = e[4] * e[8] + e[5] * e[9] + e[6] * e[10];
        const s33 = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];

        // The eigenvalue of `S^2` is the squared eigenvalue of the singular values of `M`
        const eig = getMaxEigenvalueSym3x3(s11, s12, s13, s22, s23, s33);

        return Math.sqrt(eig);
    }

    /**
     * ```
     *                  | e0  e4   e8  0 |
     * | x  y  z  1 | * | e1  e5   e9  0 |
     *                  | e2  e6  e10  0 |
     *                  | e3  e7  e11  1 |
     * ```
     */
    public mapPoint(p: Point3): Point3 {
        const e = this.elements;

        const x = p.x * e[0] + p.y * e[1] + p.z * e[2] + e[3];
        const y = p.x * e[4] + p.y * e[5] + p.z * e[6] + e[7];
        const z = p.x * e[8] + p.y * e[9] + p.z * e[10] + e[11];

        return new Point3(x, y, z);
    }

    /**
     * ```
     *                  | e0  e4   e8  0 |
     * | x  y  z  1 | * | e1  e5   e9  0 |
     *                  | e2  e6  e10  0 |
     *                  | e3  e7  e11  1 |
     * ```
     */
    public mapVector(v: Vector3): Vector3 {
        const e = this.elements;

        const x = v.x * e[0] + v.y * e[1] + v.z * e[2] + e[3];
        const y = v.x * e[4] + v.y * e[5] + v.z * e[6] + e[7];
        const z = v.x * e[8] + v.y * e[9] + v.z * e[10] + e[11];

        return new Vector3(x, y, z);
    }

    /**
     * ```
     * | ea0  ea4   ea8  0 |   | eb0  eb4   eb8  0 |
     * | ea1  ea5   ea9  0 | * | eb1  eb5   eb9  0 |
     * | ea2  ea6  ea10  0 |   | eb2  eb6  eb10  0 |
     * | ea3  ea7  ea11  1 |   | eb3  eb7  eb11  1 |
     * ```
     */
    public mul(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = ea[0] * eb[0] + ea[4] * eb[1] + ea[8] * eb[2];
        const ea4 = ea[0] * eb[4] + ea[4] * eb[5] + ea[8] * eb[6];
        const ea8 = ea[0] * eb[8] + ea[4] * eb[9] + ea[8] * eb[10];
        ea[0] = ea0;
        ea[4] = ea4;
        ea[8] = ea8;

        const ea1 = ea[1] * eb[0] + ea[5] * eb[1] + ea[9] * eb[2];
        const ea5 = ea[1] * eb[4] + ea[5] * eb[5] + ea[9] * eb[6];
        const ea9 = ea[1] * eb[8] + ea[5] * eb[9] + ea[9] * eb[10];
        ea[1] = ea1;
        ea[5] = ea5;
        ea[9] = ea9;

        const ea2 = ea[2] * eb[0] + ea[6] * eb[1] + ea[10] * eb[2];
        const ea6 = ea[2] * eb[4] + ea[6] * eb[5] + ea[10] * eb[6];
        const ea10 = ea[2] * eb[8] + ea[6] * eb[9] + ea[10] * eb[10];
        ea[2] = ea2;
        ea[6] = ea6;
        ea[10] = ea10;

        const ea3 = ea[3] * eb[0] + ea[7] * eb[1] + ea[11] * eb[2] + eb[3];
        const ea7 = ea[3] * eb[4] + ea[7] * eb[5] + ea[11] * eb[6] + eb[7];
        const ea11 = ea[3] * eb[8] + ea[7] * eb[9] + ea[11] * eb[10] + eb[11];
        ea[3] = ea3;
        ea[7] = ea7;
        ea[11] = ea11;
    }

    /**
     * ```
     * | eb0  eb4   eb8  0 |   | ea0  ea4   ea8  0 |
     * | eb1  eb5   eb9  0 | * | ea1  ea5   ea9  0 |
     * | eb2  eb6  eb10  0 |   | ea2  ea6  ea10  0 |
     * | eb3  eb7  eb11  1 |   | ea3  ea7  ea11  1 |
     * ```
     */
    public mulPre(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = eb[0] * ea[0] + eb[4] * ea[1] + eb[8] * ea[2];
        const ea1 = eb[1] * ea[0] + eb[5] * ea[1] + eb[9] * ea[2];
        const ea2 = eb[2] * ea[0] + eb[6] * ea[1] + eb[10] * ea[2];
        const ea3 = eb[3] * ea[0] + eb[7] * ea[1] + eb[11] * ea[2] + ea[3];
        ea[0] = ea0;
        ea[1] = ea1;
        ea[2] = ea2;
        ea[3] = ea3;

        const ea4 = eb[0] * ea[4] + eb[4] * ea[5] + eb[8] * ea[6];
        const ea5 = eb[1] * ea[4] + eb[5] * ea[5] + eb[9] * ea[6];
        const ea6 = eb[2] * ea[4] + eb[6] * ea[5] + eb[10] * ea[6];
        const ea7 = eb[3] * ea[4] + eb[7] * ea[5] + eb[11] * ea[6] + ea[7];
        ea[4] = ea4;
        ea[5] = ea5;
        ea[6] = ea6;
        ea[7] = ea7;

        const ea8 = eb[0] * ea[8] + eb[4] * ea[9] + eb[8] * ea[10];
        const ea9 = eb[1] * ea[8] + eb[5] * ea[9] + eb[9] * ea[10];
        const ea10 = eb[2] * ea[8] + eb[6] * ea[9] + eb[10] * ea[10];
        const ea11 = eb[3] * ea[8] + eb[7] * ea[9] + eb[11] * ea[10] + ea[11];
        ea[8] = ea8;
        ea[9] = ea9;
        ea[10] = ea10;
        ea[11] = ea11;
    }

    /**
     * ```
     * | e0  e4   e8  0 |   | q0  q3  q6  0 |
     * | e1  e5   e9  0 | * | q1  q4  q7  0 |
     * | e2  e6  e10  0 |   | q2  q5  q8  0 |
     * | e3  e7  e11  1 |   |  0   0   0  1 |
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

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
        const e6 = e[2] * q3 + e[6] * q4 + e[10] * q5;
        const e10 = e[2] * q6 + e[6] * q7 + e[10] * q8;
        e[2] = e2;
        e[6] = e6;
        e[10] = e10;

        const e3 = e[3] * q0 + e[7] * q1 + e[11] * q2;
        const e7 = e[3] * q3 + e[7] * q4 + e[11] * q5;
        const e11 = e[3] * q6 + e[7] * q7 + e[11] * q8;
        e[3] = e3;
        e[7] = e7;
        e[11] = e11;
    }

    /**
     * ```
     * | q0  q3  q6  0 |   | e0  e4   e8  0 |
     * | q1  q4  q7  0 | * | e1  e5   e9  0 |
     * | q2  q5  q8  0 |   | e2  e6  e10  0 |
     * |  0   0   0  1 |   | e3  e7  e11  1 |
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

        this.set(q0, q1, q2, 0, q3, q4, q5, 0, q6, q7, q8, 0);
    }

    /**
     * ```
     * | e0  e4   e8  0 |   | sx   0   0  0 |
     * | e1  e5   e9  0 | * |  0  sy   0  0 |
     * | e2  e6  e10  0 |   |  0   0  sz  0 |
     * | e3  e7  e11  1 |   |  0   0   0  1 |
     * ```
     */
    public scale(sx: number, sy: number, sz: number): void {
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
     * | sx   0   0  0 |   | e0  e4   e8  0 |
     * |  0  sy   0  0 | * | e1  e5   e9  0 |
     * |  0   0  sz  0 |   | e2  e6  e10  0 |
     * |  0   0   0  1 |   | e3  e7  e11  1 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
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
        this.set(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0);
    }

    /**
     * ```
     * | e0  e4   e8  0 |
     * | e1  e5   e9  0 |
     * | e2  e6  e10  0 |
     * | e3  e7  e11  1 |
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
     * ```
     * | ea0  ea4   ea8  0 |   | eb0  eb4   eb8  0 |
     * | ea1  ea5   ea9  0 | - | eb1  eb5   eb9  0 |
     * | ea2  ea6  ea10  0 |   | eb2  eb6  eb10  0 |
     * | ea3  ea7  ea11  1 |   | eb3  eb7  eb11  1 |
     * ```
     */
    public sub(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] -= eb[0];
        ea[1] -= eb[1];
        ea[2] -= eb[2];
        ea[3] -= eb[3];
        ea[4] -= eb[4];
        ea[5] -= eb[5];
        ea[6] -= eb[6];
        ea[7] -= eb[7];
        ea[8] -= eb[8];
        ea[9] -= eb[9];
        ea[10] -= eb[10];
        ea[11] -= eb[11];
    }

    /**
     * ```
     * | eb0  eb4   eb8  0 |   | ea0  ea4   ea8  0 |
     * | eb1  eb5   eb9  0 | - | ea1  ea5   ea9  0 |
     * | eb2  eb6  eb10  0 |   | ea2  ea6  ea10  0 |
     * | eb3  eb7  eb11  1 |   | ea3  ea7  ea11  1 |
     * ```
     */
    public subPre(mat: Matrix4A): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] -= ea[0];
        eb[1] -= ea[1];
        eb[2] -= ea[2];
        eb[3] -= ea[3];
        eb[4] -= ea[4];
        eb[5] -= ea[5];
        eb[6] -= ea[6];
        eb[7] -= ea[7];
        eb[8] -= ea[8];
        eb[9] -= ea[9];
        eb[10] -= ea[10];
        eb[11] -= ea[11];
    }

    public toArray(): number[] {
        return [...this.elements];
    }

    public toString(): string {
        const e = this.elements;

        // prettier-ignore
        return (
            `{e0: ${e[0]}, e4: ${e[4]}, e8: ${e[8]},\n` +
            ` e1: ${e[1]}, e5: ${e[5]}, e9: ${e[9]},\n` +
            ` e2: ${e[2]}, e6: ${e[6]}, e10: ${e[10]},\n` +
            ` e3: ${e[3]}, e7: ${e[7]}, e11: ${e[11]}}`
        );
    }

    /**
     * ```
     * | e0  e4   e8  0 |   |  1   0   0  0 |
     * | e1  e5   e9  0 | * |  0   1   0  0 |
     * | e2  e6  e10  0 |   |  0   0   1  0 |
     * | e3  e7  e11  1 |   | tx  ty  tz  1 |
     * ```
     */
    public translate(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[3] += tx;
        e[7] += ty;
        e[11] += tz;
    }

    /**
     * ```
     * |  1   0   0  0 |   | e0  e4   e8  0 |
     * |  0   1   0  0 | * | e1  e5   e9  0 |
     * |  0   0   1  0 |   | e2  e6  e10  0 |
     * | tx  ty  tz  1 |   | e3  e7  e11  1 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[3] += tx * e[0] + ty * e[1] + tz * e[2];
        e[7] += tx * e[4] + ty * e[5] + tz * e[6];
        e[11] += tx * e[8] + ty * e[9] + tz * e[10];
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
        this.set(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz);
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
     * | e0  e4   e8  e12 |
     * | e1  e5   e9  e13 |
     * | e2  e6  e10  e14 |
     * | e3  e7  e11  e15 |
     * ```
     */
    public constructor(
        elements: [
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
        ],
    ) {
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

    public static fromOrthographic(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number,
    ): Matrix4 {
        // OpenGL orthographic projection matrix
        const w = right - left;
        const h = top - bottom;
        const d = far - near;

        // | e0   0    0  0 |
        // |  0  e5    0  0 |
        // |  0   0  e10  0 |
        // | e3  e7  e11  1 |
        const e0 = 2 / w;
        const e3 = -(right + left) / w;
        const e5 = 2 / h;
        const e7 = -(top + bottom) / h;
        const e10 = -2 / d;
        const e11 = -(far + near) / d;

        return new Matrix4([e0, 0, 0, e3, 0, e5, 0, e7, 0, 0, e10, e11, 0, 0, 0, 1]);
    }

    public static fromPerspective(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number,
    ): Matrix4 {
        // OpenGL perspective projection matrix
        const w = right - left;
        const h = top - bottom;
        const d = far - near;

        // |  e0   0    0   0 |
        // |   0  e5    0   0 |
        // |  e2  e6  e10  -1 |
        // |   0   0  e11   0 |
        const e0 = (2 * near) / w;
        const e2 = (right + left) / w;
        const e5 = (2 * near) / h;
        const e6 = (top + bottom) / h;
        const e10 = (near + far) / d;
        const e11 = (2 * near * far) / d;

        return new Matrix4([e0, 0, e2, 0, 0, e5, e6, 0, 0, 0, e10, e11, 0, 0, -1, 0]);
    }

    public static fromPerspectiveFrustum(fovy: number, aspect: number, near: number, far: number): Matrix4 {
        const top = near * Math.tan(fovy * (Math.PI / 360));
        const height = 2 * top;
        const width = aspect * height;
        const left = -0.5 * width;

        return Matrix4.fromPerspective(left, left + width, top, top - height, near, far);
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

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
     * |  1   0   0  0 |
     * |  0   1   0  0 |
     * |  0   0   1  0 |
     * | tx  ty  tz  1 |
     * ```
     */
    public static fromTranslation(tx: number, ty: number, tz: number): Matrix4 {
        return new Matrix4([1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1]);
    }

    /**
     * ```
     * | ea0  ea4   ea8  eb12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  eb13 | + | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  eb14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  eb15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public add(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] += eb[0];
        ea[1] += eb[1];
        ea[2] += eb[2];
        ea[3] += eb[3];
        ea[4] += eb[4];
        ea[5] += eb[5];
        ea[6] += eb[6];
        ea[7] += eb[7];
        ea[8] += eb[8];
        ea[9] += eb[9];
        ea[10] += eb[10];
        ea[11] += eb[11];
        ea[12] += eb[12];
        ea[13] += eb[13];
        ea[14] += eb[14];
        ea[15] += eb[15];
    }

    /**
     * ```
     * | eb0  eb4   eb8  eb12 |   | ea0  ea4   ea8  eb12 |
     * | eb1  eb5   eb9  eb13 | + | ea1  ea5   ea9  eb13 |
     * | eb2  eb6  eb10  eb14 |   | ea2  ea6  ea10  eb14 |
     * | eb3  eb7  eb11  eb15 |   | ea3  ea7  ea11  eb15 |
     * ```
     */
    public addPre(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] += ea[0];
        eb[1] += ea[1];
        eb[2] += ea[2];
        eb[3] += ea[3];
        eb[4] += ea[4];
        eb[5] += ea[5];
        eb[6] += ea[6];
        eb[7] += ea[7];
        eb[8] += ea[8];
        eb[9] += ea[9];
        eb[10] += ea[10];
        eb[11] += ea[11];
        eb[12] += ea[12];
        eb[13] += ea[13];
        eb[14] += ea[14];
        eb[15] += ea[15];
    }

    public clone(): Matrix4 {
        return new Matrix4([...this.elements]);
    }

    public copyFrom(mat: Matrix4): void {
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

    /**
     * ```
     *                  | e0  e4   e8  e12 |
     * | x  y  z  1 | * | e1  e5   e9  e13 |
     *                  | e2  e6  e10  e14 |
     *                  | e3  e7  e11  e15 |
     * ```
     */
    public mapPoint(p: Point3): Point3 {
        const e = this.elements;

        const x = p.x * e[0] + p.y * e[1] + p.z * e[2] + e[3];
        const y = p.x * e[4] + p.y * e[5] + p.z * e[6] + e[7];
        const z = p.x * e[8] + p.y * e[9] + p.z * e[10] + e[11];
        const w = p.x * e[12] + p.y * e[13] + p.z * e[14] + e[15];

        return Point3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     *                  | e0  e4   e8  e12 |
     * | x  y  z  1 | * | e1  e5   e9  e13 |
     *                  | e2  e6  e10  e14 |
     *                  | e3  e7  e11  e15 |
     * ```
     */
    public mapVector(v: Vector3): Vector3 {
        const e = this.elements;

        const x = v.x * e[0] + v.y * e[1] + v.z * e[2] + e[3];
        const y = v.x * e[4] + v.y * e[5] + v.z * e[6] + e[7];
        const z = v.x * e[8] + v.y * e[9] + v.z * e[10] + e[11];
        const w = v.x * e[12] + v.y * e[13] + v.z * e[14] + e[15];

        return Vector3.fromXYZW(x, y, z, w);
    }

    /**
     * ```
     * | ea0  ea4   ea8  eb12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  eb13 | * | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  eb14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  eb15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public mul(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = ea[0] * eb[0] + ea[4] * eb[1] + ea[8] * eb[2] + ea[12] * eb[3];
        const ea4 = ea[0] * eb[4] + ea[4] * eb[5] + ea[8] * eb[6] + ea[12] * eb[7];
        const ea8 = ea[0] * eb[8] + ea[4] * eb[9] + ea[8] * eb[10] + ea[12] * eb[11];
        const ea12 = ea[0] * eb[12] + ea[4] * eb[13] + ea[8] * eb[14] + ea[12] * eb[15];
        ea[0] = ea0;
        ea[4] = ea4;
        ea[8] = ea8;
        ea[12] = ea12;

        const ea1 = ea[1] * eb[0] + ea[5] * eb[1] + ea[9] * eb[2] + ea[13] * eb[3];
        const ea5 = ea[1] * eb[4] + ea[5] * eb[5] + ea[9] * eb[6] + ea[13] * eb[7];
        const ea9 = ea[1] * eb[8] + ea[5] * eb[9] + ea[9] * eb[10] + ea[13] * eb[11];
        const ea13 = ea[1] * eb[12] + ea[5] * eb[13] + ea[9] * eb[14] + ea[13] * eb[15];
        ea[1] = ea1;
        ea[5] = ea5;
        ea[9] = ea9;
        ea[13] = ea13;

        const ea2 = ea[2] * eb[0] + ea[6] * eb[1] + ea[10] * eb[2] + ea[14] * eb[3];
        const ea6 = ea[2] * eb[4] + ea[6] * eb[5] + ea[10] * eb[6] + ea[14] * eb[7];
        const ea10 = ea[2] * eb[8] + ea[6] * eb[9] + ea[10] * eb[10] + ea[14] * eb[11];
        const ea14 = ea[2] * eb[12] + ea[6] * eb[13] + ea[10] * eb[14] + ea[14] * eb[15];
        ea[2] = ea2;
        ea[6] = ea6;
        ea[10] = ea10;
        ea[14] = ea14;

        const ea3 = ea[3] * eb[0] + ea[7] * eb[1] + ea[11] * eb[2] + ea[15] * eb[3];
        const ea7 = ea[3] * eb[4] + ea[7] * eb[5] + ea[11] * eb[6] + ea[15] * eb[7];
        const ea11 = ea[3] * eb[8] + ea[7] * eb[9] + ea[11] * eb[10] + ea[15] * eb[11];
        const ea15 = ea[3] * eb[12] + ea[7] * eb[13] + ea[11] * eb[14] + ea[15] * eb[15];
        ea[3] = ea3;
        ea[7] = ea7;
        ea[11] = ea11;
        ea[15] = ea15;
    }

    /**
     * ```
     * | eb0  eb4   eb8  eb12 |   | ea0  ea4   ea8  eb12 |
     * | eb1  eb5   eb9  eb13 | * | ea1  ea5   ea9  eb13 |
     * | eb2  eb6  eb10  eb14 |   | ea2  ea6  ea10  eb14 |
     * | eb3  eb7  eb11  eb15 |   | ea3  ea7  ea11  eb15 |
     * ```
     */
    public mulPre(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        const ea0 = eb[0] * ea[0] + eb[4] * ea[1] + eb[8] * ea[2] + eb[12] * ea[3];
        const ea1 = eb[1] * ea[0] + eb[5] * ea[1] + eb[9] * ea[2] + eb[13] * ea[3];
        const ea2 = eb[2] * ea[0] + eb[6] * ea[1] + eb[10] * ea[2] + eb[14] * ea[3];
        const ea3 = eb[3] * ea[0] + eb[7] * ea[1] + eb[11] * ea[2] + eb[15] * ea[3];
        ea[0] = ea0;
        ea[1] = ea1;
        ea[2] = ea2;
        ea[3] = ea3;

        const ea4 = eb[0] * ea[4] + eb[4] * ea[5] + eb[8] * ea[6] + eb[12] * ea[7];
        const ea5 = eb[1] * ea[4] + eb[5] * ea[5] + eb[9] * ea[6] + eb[13] * ea[7];
        const ea6 = eb[2] * ea[4] + eb[6] * ea[5] + eb[10] * ea[6] + eb[14] * ea[7];
        const ea7 = eb[3] * ea[4] + eb[7] * ea[5] + eb[11] * ea[6] + eb[15] * ea[7];
        ea[4] = ea4;
        ea[5] = ea5;
        ea[6] = ea6;
        ea[7] = ea7;

        const ea8 = eb[0] * ea[8] + eb[4] * ea[9] + eb[8] * ea[10] + eb[12] * ea[11];
        const ea9 = eb[1] * ea[8] + eb[5] * ea[9] + eb[9] * ea[10] + eb[13] * ea[11];
        const ea10 = eb[2] * ea[8] + eb[6] * ea[9] + eb[10] * ea[10] + eb[14] * ea[11];
        const ea11 = eb[3] * ea[8] + eb[7] * ea[9] + eb[11] * ea[10] + eb[15] * ea[11];
        ea[8] = ea8;
        ea[9] = ea9;
        ea[10] = ea10;
        ea[11] = ea11;

        const ea12 = eb[0] * ea[12] + eb[4] * ea[13] + eb[8] * ea[14] + eb[12] * ea[15];
        const ea13 = eb[1] * ea[12] + eb[5] * ea[13] + eb[9] * ea[14] + eb[13] * ea[15];
        const ea14 = eb[2] * ea[12] + eb[6] * ea[13] + eb[10] * ea[14] + eb[14] * ea[15];
        const ea15 = eb[3] * ea[12] + eb[7] * ea[13] + eb[11] * ea[14] + eb[15] * ea[15];
        ea[12] = ea12;
        ea[13] = ea13;
        ea[14] = ea14;
        ea[15] = ea15;
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | q0  q3  q6  0 |
     * | e1  e5   e9  e13 | * | q1  q4  q7  0 |
     * | e2  e6  e10  e14 |   | q2  q5  q8  0 |
     * | e3  e7  e11  e15 |   |  0   0   0  1 |
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

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
     * | q0  q3  q6  0 |   | e0  e4   e8  e12 |
     * | q1  q4  q7  0 | * | e1  e5   e9  e13 |
     * | q2  q5  q8  0 |   | e2  e6  e10  e14 |
     * |  0   0   0  1 |   | e3  e7  e11  e15 |
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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

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
        const q1 = qbc + qbc - qad - qad;
        const q3 = qbc + qbc + qad + qad;

        const qbd = qb * qd;
        const qac = qa * qc;
        const q2 = qbd + qbd + qac + qac;
        const q6 = qbd + qbd - qac - qac;

        const qcd = qc * qd;
        const qab = qa * qb;
        const q5 = qcd + qcd - qab - qab;
        const q7 = qcd + qcd + qab + qab;

        this.set(q0, q1, q2, 0, q3, q4, q5, 0, q6, q7, q8, 0, 0, 0, 0, 1);
    }

    /**
     * ```
     * | e0  e4   e8  e12 |   | sx   0   0  0 |
     * | e1  e5   e9  e13 | * |  0  sy   0  0 |
     * | e2  e6  e10  e14 |   |  0   0  sz  0 |
     * | e3  e7  e11  e15 |   |  0   0   0  1 |
     * ```
     */
    public scale(sx: number, sy: number, sz: number): void {
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
     * | sx   0   0  0 |   | e0  e4   e8  e12 |
     * |  0  sy   0  0 | * | e1  e5   e9  e13 |
     * |  0   0  sz  0 |   | e2  e6  e10  e14 |
     * |  0   0   0  1 |   | e3  e7  e11  e15 |
     * ```
     */
    public scalePre(sx: number, sy: number, sz: number): void {
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

    /**
     * ```
     * | ea0  ea4   ea8  eb12 |   | eb0  eb4   eb8  eb12 |
     * | ea1  ea5   ea9  eb13 | - | eb1  eb5   eb9  eb13 |
     * | ea2  ea6  ea10  eb14 |   | eb2  eb6  eb10  eb14 |
     * | ea3  ea7  ea11  eb15 |   | eb3  eb7  eb11  eb15 |
     * ```
     */
    public sub(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        ea[0] -= eb[0];
        ea[1] -= eb[1];
        ea[2] -= eb[2];
        ea[3] -= eb[3];
        ea[4] -= eb[4];
        ea[5] -= eb[5];
        ea[6] -= eb[6];
        ea[7] -= eb[7];
        ea[8] -= eb[8];
        ea[9] -= eb[9];
        ea[10] -= eb[10];
        ea[11] -= eb[11];
        ea[12] -= eb[12];
        ea[13] -= eb[13];
        ea[14] -= eb[14];
        ea[15] -= eb[15];
    }

    /**
     * ```
     * | eb0  eb4   eb8  eb12 |   | ea0  ea4   ea8  eb12 |
     * | eb1  eb5   eb9  eb13 | - | ea1  ea5   ea9  eb13 |
     * | eb2  eb6  eb10  eb14 |   | ea2  ea6  ea10  eb14 |
     * | eb3  eb7  eb11  eb15 |   | ea3  ea7  ea11  eb15 |
     * ```
     */
    public subPre(mat: Matrix4): void {
        const ea = this.elements;
        const eb = mat.elements;

        eb[0] -= ea[0];
        eb[1] -= ea[1];
        eb[2] -= ea[2];
        eb[3] -= ea[3];
        eb[4] -= ea[4];
        eb[5] -= ea[5];
        eb[6] -= ea[6];
        eb[7] -= ea[7];
        eb[8] -= ea[8];
        eb[9] -= ea[9];
        eb[10] -= ea[10];
        eb[11] -= ea[11];
        eb[12] -= ea[12];
        eb[13] -= ea[13];
        eb[14] -= ea[14];
        eb[15] -= ea[15];
    }

    public toArray(): number[] {
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
     * | e0  e4   e8  e12 |   |  1   0   0  0 |
     * | e1  e5   e9  e13 | * |  0   1   0  0 |
     * | e2  e6  e10  e14 |   |  0   0   1  0 |
     * | e3  e7  e11  e15 |   | tx  ty  tz  1 |
     * ```
     */
    public translate(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[0] += e[12] * tx;
        e[1] += e[13] * tx;
        e[2] += e[14] * tx;
        e[3] += e[15] * tx;

        e[4] += e[12] * ty;
        e[5] += e[13] * ty;
        e[6] += e[14] * ty;
        e[7] += e[15] * ty;

        e[8] += e[12] * tz;
        e[9] += e[13] * tz;
        e[10] += e[14] * tz;
        e[11] += e[15] * tz;
    }

    /**
     * ```
     * |  1   0   0  0 |   | e0  e4   e8  e12 |
     * |  0   1   0  0 | * | e1  e5   e9  e13 |
     * |  0   0   1  0 |   | e2  e6  e10  e14 |
     * | tx  ty  tz  1 |   | e3  e7  e11  e15 |
     * ```
     */
    public translatePre(tx: number, ty: number, tz: number): void {
        const e = this.elements;

        e[3] += tx * e[0] + ty * e[1] + tz * e[2];
        e[7] += tx * e[4] + ty * e[5] + tz * e[6];
        e[11] += tx * e[8] + ty * e[9] + tz * e[10];
        e[15] += tx * e[12] + ty * e[13] + tz * e[14];
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
        this.set(1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1);
    }
}
