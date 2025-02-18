import { eqApproxAbs, eqApproxRel } from "../utility/scalar.js";
import { Vector2 } from "./vector.js";

export type ComplexLike = {
    readonly a: number;
    readonly b: number;
};

export interface ReadonlyComplex {
    readonly a: number;
    readonly b: number;

    angleTo(z: Complex): number;
    clone(): Complex;
    conjugate(): Complex;
    eq(z: Complex): boolean;
    eqApproxAbs(z: Complex, eps: number): boolean;
    eqApproxRel(z: Complex, eps: number): boolean;
    inverse(): Complex;
    isIdentity(): boolean;
    len(): number;
    lenSq(): number;
    mul(z: Complex): Complex;
    mulV(v: Vector2): Vector2;
    sub(z: Complex): Complex;
    toArray(): [number, number];
    toString(): string;
    unit(): Complex;
}

/**
 * A complex number to be used for 2D rotations.
 */
export class Complex implements ReadonlyComplex {
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
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        return new Complex(cos, sin);
    }

    public static toObject(z: Complex): ComplexLike {
        return { a: z.a, b: z.b };
    }

    public add(z: Complex): Complex {
        return new Complex(this.a + z.a, this.b + z.b);
    }

    /**
     * Returns the angle between the current complex and `z` in radians.
     *
     * Note: The returned value is unsigned and less than `PI`.
     */
    public angleTo(z: Complex): number {
        // Formula adapted from `Quaternion`
        const dot = this.a * z.a + this.b * z.b;
        const lenSq2 = this.lenSq() * z.lenSq();

        if (dot * dot >= lenSq2) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        const cos = dot / Math.sqrt(lenSq2);

        return Math.acos(cos);
    }

    public clone(): Complex {
        return new Complex(this.a, this.b);
    }

    public conjugate(): Complex {
        return new Complex(this.a, -this.b);
    }

    public eq(z: Complex): boolean {
        return this.a === z.a && this.b === z.b;
    }

    public eqApproxAbs(z: Complex, eps: number): boolean {
        return eqApproxAbs(this.a, z.a, eps) && eqApproxAbs(this.b, z.b, eps);
    }

    public eqApproxRel(z: Complex, eps: number): boolean {
        return eqApproxRel(this.a, z.a, eps) && eqApproxRel(this.b, z.b, eps);
    }

    public inverse(): Complex {
        const s = this.lenSq();
        return new Complex(this.a / s, -this.b / s);
    }

    public isIdentity(): boolean {
        return this.a === 1 && this.b === 0;
    }

    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    public lenSq(): number {
        return this.a * this.a + this.b * this.b;
    }

    /**
     * ```
     * | a | * | za |
     * | b |   | zb |
     * ```
     */
    public mul(z: Complex): Complex {
        return new Complex(this.a * z.a - this.b * z.b, this.a * z.b + this.b * z.a);
    }

    /**
     * ```
     * | a | * | vx |
     * | b |   | vy |
     * ```
     */
    public mulV(v: Vector2): Vector2 {
        return new Vector2(this.a * v.x - this.b * v.y, this.a * v.y + this.b * v.x);
    }

    public rotate(angle: number): void {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const za = this.a;
        const zb = this.b;

        this.a = cos * za - sin * zb;
        this.b = cos * zb + sin * za;
    }

    public set(a: number, b: number): void {
        this.a = a;
        this.b = b;
    }

    public setAdd(z1: Complex, z2: Complex): void {
        const za = z1.a + z2.a;
        const zb = z1.b + z2.b;
        this.set(za, zb);
    }

    public setMul(z1: Complex, z2: Complex): void {
        const za = z1.a * z2.a - z1.b * z2.b;
        const zb = z1.a * z2.b + z1.b * z2.a;
        this.set(za, zb);
    }

    public setSub(z1: Complex, z2: Complex): void {
        const za = z1.a - z2.a;
        const zb = z1.b - z2.b;
        this.set(za, zb);
    }

    public sub(z: Complex): Complex {
        return new Complex(this.a - z.a, this.b - z.b);
    }

    public toArray(): [number, number] {
        return [this.a, this.b];
    }

    public toString(): string {
        return `{a: ${this.a}, b: ${this.b}}`;
    }

    public unit(): Complex {
        const s = this.len();
        return new Complex(this.a / s, this.b / s);
    }
}
