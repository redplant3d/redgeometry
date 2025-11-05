import { COS_ACUTE } from "../core/consts.js";
import { eqApproxAbs, eqApproxRel, lerp } from "../utility/scalar.js";
import { Vector2, type ReadonlyVector2 } from "./vector.js";

export type ComplexLike = {
    readonly a: number;
    readonly b: number;
};

export interface ReadonlyComplex {
    readonly a: number;
    readonly b: number;

    add(z: ReadonlyComplex): Complex;
    angle(z: ReadonlyComplex): number;
    clone(): Complex;
    conjugate(): Complex;
    divS(s: number): Complex;
    dot(z: ReadonlyComplex): number;
    eq(z: ReadonlyComplex): boolean;
    eqApproxAbs(z: ReadonlyComplex, eps: number): boolean;
    eqApproxRel(z: ReadonlyComplex, eps: number): boolean;
    inverse(): Complex;
    isFinite(): boolean;
    isIdentity(): boolean;
    length(): number;
    lengthSq(): number;
    lerp(z: ReadonlyComplex, t: number): Complex;
    mul(z: ReadonlyComplex): Complex;
    mulS(s: number): Complex;
    mulV(v: ReadonlyVector2): Vector2;
    nlerp(z: ReadonlyComplex, t: number): Complex;
    orthonormalBasis(): { v1: Vector2; v2: Vector2 };
    rotate(z: ReadonlyComplex, a: number): Complex;
    slerp(z: ReadonlyComplex, t: number): Complex;
    sub(z: ReadonlyComplex): Complex;
    toArray(): [number, number];
    toString(): string;
    unit(): Complex;
    unitOrIdentity(): Complex;
}

/**
 * A complex number to be used for 2D rotations.
 */
export class Complex implements ReadonlyComplex {
    public static readonly IDENTITY: ReadonlyComplex = Complex.createIdentity();

    public a: number;
    public b: number;

    public constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    public static createIdentity(): Complex {
        return new Complex(1, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Complex {
        return new Complex(data[offset], data[offset + 1]);
    }

    public static fromObject(obj: ComplexLike): Complex {
        return new Complex(obj.a, obj.b);
    }

    public static fromRotationAngle(angle: number): Complex {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        return new Complex(cos, sin);
    }

    public static fromRotationBetween(v1: ReadonlyVector2, v2: ReadonlyVector2): Complex {
        // This angle is double of the complex rotation
        const cos = v1.dot(v2);

        if (cos < COS_ACUTE) {
            return new Complex(0, 1);
        }

        const sin = v1.cross(v2);

        // We add an identity complex and set it to unit length to get half the rotation
        const q = new Complex(cos + 1, sin);
        q.setUnit(q);

        return q;
    }

    /**
     * Returns a complex from an unscaled rotation matrix.
     *
     * References:
     * - https://en.wikipedia.org/wiki/Square_root_of_a_2_by_2_matrix
     */
    public static fromRotationMatrix(z0: number, z1: number): Complex {
        // z0 = zaa - zbb
        // z1 = zab + zab
        if (z0 >= 0) {
            // zaa >= zbb
            const za = 1 + z0;
            const zb = z1;
            const f = 1 / Math.sqrt(2 * za);
            return new Complex(f * za, f * zb);
        } else {
            // zbb > zaa
            const za = z1;
            const zb = 1 - z0;
            const f = 1 / Math.sqrt(2 * zb);
            return new Complex(f * za, f * zb);
        }
    }

    public static toObject(z: ReadonlyComplex): ComplexLike {
        return { a: z.a, b: z.b };
    }

    public add(z: ReadonlyComplex): Complex {
        return new Complex(this.a + z.a, this.b + z.b);
    }

    /**
     * Returns the angle between the current complex and `z` in radians.
     *
     * Note: The returned value is unsigned and less than or equal to `PI`.
     */
    public angle(z: ReadonlyComplex): number {
        // Formula adapted from `Quaternion`
        const dot = this.dot(z);
        const sqrt = Math.sqrt(this.lengthSq() * z.lengthSq());

        if (sqrt <= dot) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        if (sqrt <= -dot) {
            // Angle very close or equal to Pi
            return 2 * Math.PI;
        }

        return 2 * Math.acos(dot / sqrt);
    }

    public clone(): Complex {
        return new Complex(this.a, this.b);
    }

    public conjugate(): Complex {
        return new Complex(this.a, -this.b);
    }

    public divS(s: number): Complex {
        return new Complex(this.a / s, this.b / s);
    }

    public dot(z: ReadonlyComplex): number {
        return this.a * z.a + this.b * z.b;
    }

    public eq(z: ReadonlyComplex): boolean {
        return this.a === z.a && this.b === z.b;
    }

    public eqApproxAbs(z: ReadonlyComplex, eps: number): boolean {
        return eqApproxAbs(this.a, z.a, eps) && eqApproxAbs(this.b, z.b, eps);
    }

    public eqApproxRel(z: ReadonlyComplex, eps: number): boolean {
        return eqApproxRel(this.a, z.a, eps) && eqApproxRel(this.b, z.b, eps);
    }

    public inverse(): Complex {
        const s = this.lengthSq();
        return new Complex(this.a / s, -this.b / s);
    }

    public isIdentity(): boolean {
        return this.a === 1 && this.b === 0;
    }

    public isFinite(): boolean {
        return Number.isFinite(this.a) && Number.isFinite(this.b);
    }

    public length(): number {
        return Math.sqrt(this.lengthSq());
    }

    public lengthSq(): number {
        return this.a * this.a + this.b * this.b;
    }

    /**
     * Returns the linear interpolation of the current complex and `z`.
     */
    public lerp(z: ReadonlyComplex, t: number): Complex {
        const za = lerp(this.a, z.a, t);
        const zb = lerp(this.b, z.b, t);
        return new Complex(za, zb);
    }

    /**
     * ```
     * | a | * | za |
     * | b |   | zb |
     * ```
     */
    public mul(z: ReadonlyComplex): Complex {
        return new Complex(this.a * z.a - this.b * z.b, this.a * z.b + this.b * z.a);
    }

    public mulS(s: number): Complex {
        return new Complex(s * this.a, s * this.b);
    }

    /**
     * ```
     * | a | * | vx | * |  a |
     * | b |   | vy |   | -b |
     * ```
     */
    public mulV(v: ReadonlyVector2): Vector2 {
        const za = this.a * v.x - this.b * v.y;
        const zb = this.a * v.y + this.b * v.x;

        return new Vector2(this.a * za - this.b * zb, this.a * zb + this.b * za);
    }

    /**
     * Returns the normalized linear interpolation of the current complex.
     */
    public nlerp(z: ReadonlyComplex, t: number): Complex {
        const a = lerp(this.a, z.a, t);
        const b = lerp(this.b, z.b, t);

        const len = Math.sqrt(a * a + b * b);

        if (len === 0) {
            return Complex.createIdentity();
        }

        return new Complex(a / len, b / len);
    }

    /**
     * Returns an orthonormal basis of the current complex.
     *
     * Note: The current complex is assumed to be of unit length.
     */
    public orthonormalBasis(): { v1: Vector2; v2: Vector2 } {
        const zaa = this.a * this.a;
        const zbb = this.b * this.b;
        const zab = this.a * this.b;
        const z0 = zaa - zbb;
        const z1 = zab + zab;
        const z2 = -z1;
        const z3 = z0;

        const v1 = new Vector2(z0, z1);
        const v2 = new Vector2(z2, z3);

        return { v1, v2 };
    }

    public rotate(z: ReadonlyComplex, a: number): Complex {
        const sin = Math.sin(0.5 * a);
        const cos = Math.cos(0.5 * a);

        const za = cos * z.a - sin * z.b;
        const zb = cos * z.b + sin * z.a;

        return new Complex(za, zb);
    }

    public set(a: number, b: number): void {
        this.a = a;
        this.b = b;
    }

    public setAdd(z1: ReadonlyComplex, z2: ReadonlyComplex): void {
        this.a = z1.a + z2.a;
        this.b = z1.b + z2.b;
    }

    public setDivS(z: ReadonlyComplex, s: number): void {
        this.a = z.a / s;
        this.b = z.b / s;
    }

    public setFrom(z: ReadonlyComplex): void {
        this.a = z.a;
        this.b = z.b;
    }

    public setFromRotationAngle(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        this.set(cos, sin);
    }

    public setMul(z1: ReadonlyComplex, z2: ReadonlyComplex): void {
        const za = z1.a * z2.a - z1.b * z2.b;
        const zb = z1.a * z2.b + z1.b * z2.a;
        this.set(za, zb);
    }

    public setMulS(z: ReadonlyComplex, s: number): void {
        this.a = s * z.a;
        this.b = s * z.b;
    }

    public setRotate(z: ReadonlyComplex, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const za = cos * z.a - sin * z.b;
        const zb = cos * z.b + sin * z.a;

        this.set(za, zb);
    }

    public setSub(z1: ReadonlyComplex, z2: ReadonlyComplex): void {
        this.a = z1.a - z2.a;
        this.b = z1.b - z2.b;
    }

    public setUnit(z: ReadonlyComplex): void {
        const s = z.length();
        this.setDivS(z, s);
    }

    /**
     * Returns the spherical linear interpolation of the current complext and `z`.
     */
    public slerp(z: ReadonlyComplex, t: number): Complex {
        // Formula adapted from `Quaternion`
        const dot = this.dot(z);
        const sqrt = Math.sqrt(this.lengthSq() * z.lengthSq());

        if (sqrt <= dot) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(z, t);
        }

        const angle = Math.acos(dot / sqrt);
        const sin1 = Math.sin(angle - angle * t);
        const sin2 = Math.sin(angle * t);
        const sin3 = Math.sin(angle);

        const s1 = sin1 / sin3;
        const s2 = sin2 / sin3;

        const za = s1 * this.a + s2 * z.a;
        const zb = s1 * this.b + s2 * z.b;

        return new Complex(za, zb);
    }

    public sub(z: ReadonlyComplex): Complex {
        return new Complex(this.a - z.a, this.b - z.b);
    }

    public toArray(): [number, number] {
        return [this.a, this.b];
    }

    public toString(): string {
        return "{a: " + this.a + ", b: " + this.b + "}";
    }

    public unit(): Complex {
        return this.divS(this.length());
    }

    public unitOrIdentity(): Complex {
        const s = this.length();

        if (s === 0) {
            return Complex.createIdentity();
        }

        return this.divS(s);
    }
}
