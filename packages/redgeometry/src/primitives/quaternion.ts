import { assertUnreachable } from "../index.js";
import { Point3 } from "./point.js";
import { Vector3 } from "./vector.js";

export enum RotationOrder {
    XYZ,
    XZY,
    YXZ,
    YZX,
    ZXY,
    ZYX,
}

/**
 * A quaternion to be used for 3D rotations.
 *
 * References:
 * - https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
 * - https://danceswithcode.net/engineeringnotes/quaternions/quaternions.html
 */
export class Quaternion {
    public static readonly IDENTITY: Readonly<Quaternion> = new Quaternion(1, 0, 0, 0);

    public a: number;
    public b: number;
    public c: number;
    public d: number;

    public constructor(a: number, b: number, c: number, d: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    public static fromArray(data: number[], offset = 0): Quaternion {
        return new Quaternion(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromRotationAngleX(angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        return new Quaternion(cos, sin, 0, 0);
    }

    public static fromRotationAngleY(angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        return new Quaternion(cos, 0, sin, 0);
    }

    public static fromRotationAngleZ(angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        return new Quaternion(cos, 0, 0, sin);
    }

    public static fromRotationAxis(v: Vector3, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        // `cos * v.len()` ensures correct scaling
        return new Quaternion(cos * v.len(), sin * v.x, sin * v.y, sin * v.z);
    }

    public static fromRotationEuler(angleX: number, angleY: number, angleZ: number, order: RotationOrder): Quaternion {
        const sinx = Math.sin(0.5 * angleX);
        const cosx = Math.cos(0.5 * angleX);
        const siny = Math.sin(0.5 * angleY);
        const cosy = Math.cos(0.5 * angleY);
        const sinz = Math.sin(0.5 * angleZ);
        const cosz = Math.cos(0.5 * angleZ);

        const a1 = cosx * cosy * cosz;
        const a2 = sinx * siny * sinz;
        const b1 = sinx * cosy * cosz;
        const b2 = cosx * siny * sinz;
        const c1 = cosx * siny * cosz;
        const c2 = sinx * cosy * sinz;
        const d1 = cosx * cosy * sinz;
        const d2 = sinx * siny * cosz;

        switch (order) {
            case RotationOrder.XYZ: {
                return new Quaternion(a1 - a2, b1 + b2, c1 - c2, d1 + d2);
            }
            case RotationOrder.XZY: {
                return new Quaternion(a1 + a2, b1 - b2, c1 - c2, d1 + d2);
            }
            case RotationOrder.YXZ: {
                return new Quaternion(a1 + a2, b1 + b2, c1 - c2, d1 - d2);
            }
            case RotationOrder.YZX: {
                return new Quaternion(a1 - a2, b1 + b2, c1 + c2, d1 - d2);
            }
            case RotationOrder.ZXY: {
                return new Quaternion(a1 - a2, b1 - b2, c1 + c2, d1 + d2);
            }
            case RotationOrder.ZYX: {
                return new Quaternion(a1 + a2, b1 - b2, c1 + c2, d1 - d2);
            }
            default: {
                assertUnreachable(order);
            }
        }
    }

    public static fromRotationMatrix(
        q0: number,
        q1: number,
        q2: number,
        q3: number,
        q4: number,
        q5: number,
        q6: number,
        q7: number,
        q8: number,
    ): Quaternion {
        // q0 = qa^2 + qb^2 - qc^2 - qd^2
        // q4 = qa^2 - qb^2 + qc^2 - qd^2
        // q5 = qa^2 - qb^2 - qc^2 + qd^2
        if (q0 >= 0) {
            // qa^2 + qb^2 >= qc^2 + qd^2
            if (q4 + q8 >= 0) {
                // 2 qa^2 >= 2 qb^2
                const a = 1 + q0 + q4 + q8;
                const b = q5 - q7;
                const c = q6 - q2;
                const d = q1 - q3;
                const f = 0.5 / Math.sqrt(a);
                return new Quaternion(f * a, f * b, f * c, f * d);
            } else {
                // 2 qb^2 > 2 qa^2
                const a = q5 - q7;
                const b = 1 + q0 - q4 - q8;
                const c = q3 + q1;
                const d = q6 + q2;
                const f = 0.5 / Math.sqrt(b);
                return new Quaternion(f * a, f * b, f * c, f * d);
            }
        } else {
            // qc^2 + qd^2 > qa^2 + qb^2
            if (q4 - q8 >= 0) {
                // 2 qc^2 >= 2 qd^2
                const a = q6 - q2;
                const b = q3 + q1;
                const c = 1 - q0 + q4 - q8;
                const d = q7 + q5;
                const f = 0.5 / Math.sqrt(c);
                return new Quaternion(f * a, f * b, f * c, f * d);
            } else {
                // 2 qd^2 > 2 qc^2
                const a = q1 - q3;
                const b = q6 + q2;
                const c = q7 + q5;
                const d = 1 - q0 - q4 + q8;
                const f = 0.5 / Math.sqrt(d);
                return new Quaternion(f * a, f * b, f * c, f * d);
            }
        }
    }

    public add(q: Quaternion): Quaternion {
        return new Quaternion(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d);
    }

    public axis(): Vector3 {
        return new Vector3(this.b, this.c, this.d);
    }

    public conjugate(): Quaternion {
        return new Quaternion(this.a, -this.b, -this.c, -this.d);
    }

    public cross(q: Quaternion): Quaternion {
        // `(1 / 2) * (q1 * q2 - q2 * q1)`
        const b = this.c * q.d - this.d * q.c;
        const c = this.d * q.b - this.b * q.d;
        const d = this.b * q.c - this.c * q.b;
        return new Quaternion(0, b, c, d);
    }

    public dot(q: Quaternion): number {
        // `(1 / 2) * (q1 * (q2*)) - q2 * (q1*))`
        return this.a * q.a + this.b * q.b + this.c * q.c + this.d * q.d;
    }

    public eq(q: Quaternion): boolean {
        return this.a === q.a && this.b === q.b && this.c === q.c && this.d === q.d;
    }

    public inverse(): Quaternion {
        return this.unit().conjugate();
    }

    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    public lenSq(): number {
        return this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d;
    }

    /**
     * ```
     * | a |   | qa |
     * | b | * | qb |
     * | c |   | qc |
     * | d |   | qd |
     * ```
     */
    public mul(q: Quaternion): Quaternion {
        return new Quaternion(
            this.a * q.a - this.b * q.b - this.c * q.c - this.d * q.d,
            this.a * q.b + this.b * q.a + this.c * q.d - this.d * q.c,
            this.a * q.c - this.b * q.d + this.c * q.a + this.d * q.b,
            this.a * q.d + this.b * q.c - this.c * q.b + this.d * q.a,
        );
    }

    /**
     * ```
     * | qa |   | a |
     * | qb | * | b |
     * | qc |   | c |
     * | qd |   | d |
     * ```
     */
    public mulPre(q: Quaternion): Quaternion {
        return new Quaternion(
            q.a * this.a - q.b * this.b - q.c * this.c - q.d * this.d,
            q.a * this.b + q.b * this.a + q.c * this.d - q.d * this.c,
            q.a * this.c - q.b * this.d + q.c * this.a + q.d * this.b,
            q.a * this.d + q.b * this.c - q.c * this.b + q.d * this.a,
        );
    }

    /**
     * ```
     * | a |   |  0 |   |  a |
     * | b | * | px | * | -b |
     * | c |   | py |   | -c |
     * | d |   | pz |   | -d |
     * ```
     */
    public mulPt(p: Point3): Point3 {
        const a = this.b * p.x + this.c * p.y + this.d * p.z;
        const b = this.a * p.x + this.c * p.z - this.d * p.y;
        const c = this.a * p.y - this.b * p.z + this.d * p.x;
        const d = this.a * p.z + this.b * p.y - this.c * p.x;

        return new Point3(
            a * this.b + b * this.a - c * this.d + d * this.c,
            a * this.c + b * this.d + c * this.a - d * this.b,
            a * this.d - b * this.c + c * this.b + d * this.a,
        );
    }

    /**
     * ```
     * | a |   |  0 |   |  a |
     * | b | * | vx | * | -b |
     * | c |   | vy |   | -c |
     * | d |   | vz |   | -d |
     * ```
     */
    public mulVec(v: Vector3): Vector3 {
        const a = this.b * v.x + this.c * v.y + this.d * v.z;
        const b = this.a * v.x + this.c * v.z - this.d * v.y;
        const c = this.a * v.y - this.b * v.z + this.d * v.x;
        const d = this.a * v.z + this.b * v.y - this.c * v.x;

        return new Vector3(
            a * this.b + b * this.a - c * this.d + d * this.c,
            a * this.c + b * this.d + c * this.a - d * this.b,
            a * this.d - b * this.c + c * this.b + d * this.a,
        );
    }

    public rotateX(ax: number): Quaternion {
        const sin = Math.sin(0.5 * ax);
        const cos = Math.cos(0.5 * ax);

        // | a |   | cos |
        // | b | * | sin |
        // | c |   |   0 |
        // | d |   |   0 |
        return new Quaternion(
            this.a * cos - this.b * sin,
            this.b * cos + this.a * sin,
            this.c * cos + this.d * sin,
            this.d * cos - this.c * sin,
        );
    }

    public rotateXPre(ax: number): Quaternion {
        const sin = Math.sin(0.5 * ax);
        const cos = Math.cos(0.5 * ax);

        // | cos |   | a |
        // | sin | * | b |
        // |   0 |   | c |
        // |   0 |   | d |
        return new Quaternion(
            cos * this.a - sin * this.b,
            cos * this.b + sin * this.a,
            cos * this.c - sin * this.d,
            cos * this.d + sin * this.c,
        );
    }

    public rotateY(ay: number): Quaternion {
        const sin = Math.sin(0.5 * ay);
        const cos = Math.cos(0.5 * ay);

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   | sin |
        // | d |   |   0 |
        return new Quaternion(
            this.a * cos - this.c * sin,
            this.b * cos - this.d * sin,
            this.c * cos + this.a * sin,
            this.d * cos + this.b * sin,
        );
    }

    public rotateYPre(ay: number): Quaternion {
        const sin = Math.sin(0.5 * ay);
        const cos = Math.cos(0.5 * ay);

        // | cos |   | a |
        // |   0 | * | b |
        // | sin |   | c |
        // |   0 |   | d |
        return new Quaternion(
            cos * this.a - sin * this.c,
            cos * this.b + sin * this.d,
            cos * this.c + sin * this.a,
            cos * this.d - sin * this.b,
        );
    }

    public rotateZ(az: number): Quaternion {
        const sin = Math.sin(0.5 * az);
        const cos = Math.cos(0.5 * az);

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   |   0 |
        // | d |   | sin |
        return new Quaternion(
            this.a * cos - this.d * sin,
            this.b * cos + this.c * sin,
            this.c * cos - this.b * sin,
            this.d * cos + this.a * sin,
        );
    }

    public rotateZPre(az: number): Quaternion {
        const sin = Math.sin(0.5 * az);
        const cos = Math.cos(0.5 * az);

        // | cos |   | a |
        // |   0 | * | b |
        // |   0 |   | c |
        // | sin |   | d |
        return new Quaternion(
            cos * this.a - sin * this.d,
            cos * this.b - sin * this.c,
            cos * this.c + sin * this.b,
            cos * this.d + sin * this.a,
        );
    }

    public sub(q: Quaternion): Quaternion {
        return new Quaternion(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d);
    }

    public toArray(): number[] {
        return [this.a, this.b, this.c, this.d];
    }

    public toString(): string {
        return `{a: ${this.a}, b: ${this.b}, c: ${this.c}, d: ${this.d}}`;
    }

    public unit(): Quaternion {
        const len = this.len();
        return new Quaternion(this.a / len, this.b / len, this.c / len, this.d / len);
    }
}
