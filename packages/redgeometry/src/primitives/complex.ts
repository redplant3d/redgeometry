import { Point2 } from "./point.js";
import { Vector2 } from "./vector.js";

export interface ComplexLike {
    a: number;
    b: number;
}

/**
 * A complex number to be used for 2D rotations.
 */
export class Complex implements ComplexLike {
    public a: number;
    public b: number;

    public constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    public static createIdentity(): Complex {
        return new Complex(1, 0);
    }

    public static fromArray(data: number[], offset = 0): Complex {
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

    public clone(): Complex {
        return new Complex(this.a, this.b);
    }

    public conjugate(): Complex {
        return new Complex(this.a, -this.b);
    }

    public cross(z: Complex): Complex {
        return new Complex(0, this.a * z.b - this.b * z.a);
    }

    public dot(z: Complex): number {
        return this.a * z.a + this.b * z.b;
    }

    public eq(z: Complex): boolean {
        return this.a === z.a && this.b === z.b;
    }

    public inverse(): Complex {
        const div = this.lenSq();
        return new Complex(this.a / div, -this.b / div);
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
     * | a | * | px |
     * | b |   | py |
     * ```
     */
    public mulP(p: Point2): Point2 {
        return new Point2(this.a * p.x - this.b * p.y, this.a * p.y + this.b * p.x);
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
        const a = this.a;
        const b = this.b;

        this.a = cos * a - sin * b;
        this.b = cos * b + sin * a;
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
        const div = this.len();
        return new Complex(this.a / div, this.b / div);
    }
}
