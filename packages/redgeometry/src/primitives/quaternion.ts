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

export interface QuaternionLike {
    a: number;
    b: number;
    c: number;
    d: number;
}

/**
 * A quaternion to be used for 3D rotations.
 *
 * References:
 * - https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
 * - https://danceswithcode.net/engineeringnotes/quaternions/quaternions.html
 */
export class Quaternion implements QuaternionLike {
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

    public static createIdentity(): Quaternion {
        return new Quaternion(1, 0, 0, 0);
    }

    public static fromArray(data: number[], offset = 0): Quaternion {
        return new Quaternion(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: QuaternionLike): Quaternion {
        return new Quaternion(obj.a, obj.b, obj.c, obj.d);
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

    /**
     * Returns a quaternion with minimal rotation from `v1` to `v2`.
     */
    public static fromRotationBetween(v1: Vector3, v2: Vector3): Quaternion {
        const v1u = v1.unit();
        const v2u = v2.unit();

        // Vector halfway between `v1` and `v2`
        const vu = v1u.add(v2u).unitOrZero();

        // If `vu` is zero then `vd = 0` and `vn` just needs to be any normal of `v1`
        const vd = v1u.dot(vu);
        const vn = vu.isZero() ? v1u.normalAroundAny() : v1u.normalAround(vu);

        return new Quaternion(vd, vn.x, vn.y, vn.z);
    }

    public static fromRotationEuler(angleX: number, angleY: number, angleZ: number, order: RotationOrder): Quaternion {
        const sinX = Math.sin(0.5 * angleX);
        const cosX = Math.cos(0.5 * angleX);
        const sinY = Math.sin(0.5 * angleY);
        const cosY = Math.cos(0.5 * angleY);
        const sinZ = Math.sin(0.5 * angleZ);
        const cosZ = Math.cos(0.5 * angleZ);

        const a1 = cosX * cosY * cosZ;
        const a2 = sinX * sinY * sinZ;
        const b1 = sinX * cosY * cosZ;
        const b2 = cosX * sinY * sinZ;
        const c1 = cosX * sinY * cosZ;
        const c2 = sinX * cosY * sinZ;
        const d1 = cosX * cosY * sinZ;
        const d2 = sinX * sinY * cosZ;

        switch (order) {
            case RotationOrder.XYZ: {
                return new Quaternion(a1 + a2, b1 - b2, c1 + c2, d1 - d2);
            }
            case RotationOrder.XZY: {
                return new Quaternion(a1 - a2, b1 + b2, c1 + c2, d1 - d2);
            }
            case RotationOrder.YXZ: {
                return new Quaternion(a1 - a2, b1 - b2, c1 + c2, d1 + d2);
            }
            case RotationOrder.YZX: {
                return new Quaternion(a1 + a2, b1 - b2, c1 - c2, d1 + d2);
            }
            case RotationOrder.ZXY: {
                return new Quaternion(a1 + a2, b1 + b2, c1 - c2, d1 - d2);
            }
            case RotationOrder.ZYX: {
                return new Quaternion(a1 - a2, b1 + b2, c1 - c2, d1 + d2);
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

    /**
     * Returns a quaternion with values following the `XYZW` notation.
     */
    public static fromXYZW(x: number, y: number, z: number, w: number): Quaternion {
        return new Quaternion(w, x, y, z);
    }

    public static toObject(q: Quaternion): QuaternionLike {
        return { a: q.a, b: q.b, c: q.c, d: q.d };
    }

    public add(q: Quaternion): Quaternion {
        return new Quaternion(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d);
    }

    public axis(): Vector3 {
        return new Vector3(this.b, this.c, this.d);
    }

    public clone(): Quaternion {
        return new Quaternion(this.a, this.b, this.c, this.d);
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

    /**
     * Returns the euler angles of the quaternion in `XYZ` order.
     */
    public getEulerAngles(): { x: number; y: number; z: number } {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        const aa = a * a;
        const bb = b * b;
        const cc = c * c;
        const dd = d * d;

        const ab = a * b;
        const cd = c * d;
        const x = Math.atan2(ab + ab + cd + cd, aa - bb - cc + dd);

        const ad = a * d;
        const bc = b * c;
        const z = Math.atan2(ad + ad + bc + bc, aa + bb - cc - dd);

        const ac = a * c;
        const bd = b * d;
        const y = Math.asin(ac + ac - bd - bd);

        return { x, y, z };
    }

    public inverse(): Quaternion {
        const div = this.lenSq();
        return new Quaternion(this.a / div, -this.b / div, -this.c / div, -this.d / div);
    }

    public isIdentity(): boolean {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 0;
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

    public rotateX(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | cos |   | a |
        // | sin | * | b |
        // |   0 |   | c |
        // |   0 |   | d |
        this.a = cos * a - sin * b;
        this.b = cos * b + sin * a;
        this.c = cos * c - sin * d;
        this.d = cos * d + sin * c;
    }

    public rotateXPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | a |   | cos |
        // | b | * | sin |
        // | c |   |   0 |
        // | d |   |   0 |
        this.a = a * cos - b * sin;
        this.b = b * cos + a * sin;
        this.c = c * cos + d * sin;
        this.d = d * cos - c * sin;
    }

    public rotateY(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | cos |   | a |
        // |   0 | * | b |
        // | sin |   | c |
        // |   0 |   | d |
        this.a = cos * a - sin * c;
        this.b = cos * b + sin * d;
        this.c = cos * c + sin * a;
        this.d = cos * d - sin * b;
    }

    public rotateYPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   | sin |
        // | d |   |   0 |
        this.a = a * cos - c * sin;
        this.b = b * cos - d * sin;
        this.c = c * cos + a * sin;
        this.d = d * cos + b * sin;
    }

    public rotateZ(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | cos |   | a |
        // |   0 | * | b |
        // |   0 |   | c |
        // | sin |   | d |
        this.a = cos * a - sin * d;
        this.b = cos * b - sin * c;
        this.c = cos * c + sin * b;
        this.d = cos * d + sin * a;
    }

    public rotateZPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   |   0 |
        // | d |   | sin |
        this.a = a * cos - d * sin;
        this.b = b * cos + c * sin;
        this.c = c * cos - b * sin;
        this.d = d * cos + a * sin;
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
        const div = this.len();
        return new Quaternion(this.a / div, this.b / div, this.c / div, this.d / div);
    }
}
