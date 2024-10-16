import { assertUnreachable } from "../utility/debug.js";
import { eqApproxAbs, eqApproxRel, lerp } from "../utility/scalar.js";
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

    /**
     * Returns a quaternion rotated by the intrinsic Euler (Tait-Bryan) angles `angleX`, `angleY` and `angleZ` with `order`.
     */
    public static fromRotationEuler(angleX: number, angleY: number, angleZ: number, order: RotationOrder): Quaternion {
        const sinX = Math.sin(0.5 * angleX);
        const cosX = Math.cos(0.5 * angleX);
        const sinY = Math.sin(0.5 * angleY);
        const cosY = Math.cos(0.5 * angleY);
        const sinZ = Math.sin(0.5 * angleZ);
        const cosZ = Math.cos(0.5 * angleZ);

        const qa1 = cosX * cosY * cosZ;
        const qa2 = sinX * sinY * sinZ;
        const qb1 = sinX * cosY * cosZ;
        const qb2 = cosX * sinY * sinZ;
        const qc1 = cosX * sinY * cosZ;
        const qc2 = sinX * cosY * sinZ;
        const qd1 = cosX * cosY * sinZ;
        const qd2 = sinX * sinY * cosZ;

        switch (order) {
            case RotationOrder.XYZ: {
                return new Quaternion(qa1 - qa2, qb1 + qb2, qc1 - qc2, qd1 + qd2);
            }
            case RotationOrder.XZY: {
                return new Quaternion(qa1 + qa2, qb1 - qb2, qc1 - qc2, qd1 + qd2);
            }
            case RotationOrder.YXZ: {
                return new Quaternion(qa1 + qa2, qb1 + qb2, qc1 - qc2, qd1 - qd2);
            }
            case RotationOrder.YZX: {
                return new Quaternion(qa1 - qa2, qb1 + qb2, qc1 + qc2, qd1 - qd2);
            }
            case RotationOrder.ZXY: {
                return new Quaternion(qa1 - qa2, qb1 - qb2, qc1 + qc2, qd1 + qd2);
            }
            case RotationOrder.ZYX: {
                return new Quaternion(qa1 + qa2, qb1 - qb2, qc1 + qc2, qd1 - qd2);
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
                const qa = 1 + q0 + q4 + q8;
                const qb = q5 - q7;
                const qc = q6 - q2;
                const qd = q1 - q3;
                const f = 0.5 / Math.sqrt(qa);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            } else {
                // 2 qb^2 > 2 qa^2
                const qa = q5 - q7;
                const qb = 1 + q0 - q4 - q8;
                const qc = q3 + q1;
                const qd = q6 + q2;
                const f = 0.5 / Math.sqrt(qb);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            }
        } else {
            // qc^2 + qd^2 > qa^2 + qb^2
            if (q4 - q8 >= 0) {
                // 2 qc^2 >= 2 qd^2
                const qa = q6 - q2;
                const qb = q3 + q1;
                const qc = 1 - q0 + q4 - q8;
                const qd = q7 + q5;
                const f = 0.5 / Math.sqrt(qc);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            } else {
                // 2 qd^2 > 2 qc^2
                const qa = q1 - q3;
                const qb = q6 + q2;
                const qc = q7 + q5;
                const qd = 1 - q0 - q4 + q8;
                const f = 0.5 / Math.sqrt(qd);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
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

    /**
     * Returns the angle between the current quaternion and `q` in radians.
     *
     * Note: The returned value is unsigned and less than `2 * PI`.
     */
    public angleTo(q: Quaternion): number {
        // Glenn Davis formula (referenced by Ken Shoemake)
        const dot = this.a * q.a + this.b * q.b + this.c * q.c + this.d * q.d;
        const lenSq = this.lenSq() * q.lenSq();

        if (dot * dot >= lenSq) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        const cos = dot / Math.sqrt(lenSq);

        return 2 * Math.acos(cos);
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

    public eq(q: Quaternion): boolean {
        return this.a === q.a && this.b === q.b && this.c === q.c && this.d === q.d;
    }

    public eqApproxAbs(q: Quaternion, eps: number): boolean {
        return (
            eqApproxAbs(this.a, q.a, eps) &&
            eqApproxAbs(this.b, q.b, eps) &&
            eqApproxAbs(this.c, q.c, eps) &&
            eqApproxAbs(this.d, q.d, eps)
        );
    }

    public eqApproxRel(q: Quaternion, eps: number): boolean {
        return (
            eqApproxRel(this.a, q.a, eps) &&
            eqApproxRel(this.b, q.b, eps) &&
            eqApproxRel(this.c, q.c, eps) &&
            eqApproxRel(this.d, q.d, eps)
        );
    }

    /**
     * Returns the instrinsic Euler (Tait-Bryan) angles of the current quaternion with respect to `order`.
     *
     * References:
     * - https://en.wikipedia.org/wiki/Euler_angles#Conversion_to_other_orientation_representations
     */
    public getEulerAngles(order: RotationOrder): { x: number; y: number; z: number } {
        const qaa = this.a * this.a;
        const qbb = this.b * this.b;
        const qcc = this.c * this.c;
        const qdd = this.d * this.d;

        const qab2 = 2 * this.a * this.b;
        const qac2 = 2 * this.a * this.c;
        const qad2 = 2 * this.a * this.d;
        const qbc2 = 2 * this.b * this.c;
        const qbd2 = 2 * this.b * this.d;
        const qcd2 = 2 * this.c * this.d;

        switch (order) {
            case RotationOrder.XYZ: {
                return {
                    x: Math.atan2(qab2 - qcd2, qaa - qbb - qcc + qdd),
                    y: Math.asin(qbd2 + qac2),
                    z: Math.atan2(qad2 - qbc2, qaa + qbb - qcc - qdd),
                };
            }
            case RotationOrder.XZY: {
                return {
                    x: Math.atan2(qcd2 + qab2, qaa - qbb + qcc - qdd),
                    y: Math.atan2(qbd2 + qac2, qaa + qbb - qcc - qdd),
                    z: Math.asin(qad2 - qbc2),
                };
            }
            case RotationOrder.YXZ: {
                return {
                    x: Math.asin(qab2 - qcd2),
                    y: Math.atan2(qbd2 + qac2, qaa - qbb - qcc + qdd),
                    z: Math.atan2(qbc2 + qad2, qaa - qbb + qcc - qdd),
                };
            }
            case RotationOrder.YZX: {
                return {
                    x: Math.atan2(qab2 - qcd2, qaa - qbb + qcc - qdd),
                    y: Math.atan2(qac2 - qbd2, qaa + qbb - qcc - qdd),
                    z: Math.asin(qbc2 + qad2),
                };
            }
            case RotationOrder.ZXY: {
                return {
                    x: Math.asin(qcd2 + qab2),
                    y: Math.atan2(qac2 - qbd2, qaa - qbb - qcc + qdd),
                    z: Math.atan2(qad2 - qbc2, qaa - qbb + qcc - qdd),
                };
            }
            case RotationOrder.ZYX: {
                return {
                    x: Math.atan2(qcd2 + qab2, qaa - qbb - qcc + qdd),
                    y: Math.asin(qac2 - qbd2),
                    z: Math.atan2(qbc2 + qad2, qaa + qbb - qcc - qdd),
                };
            }
            default: {
                assertUnreachable(order);
            }
        }
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
     * Returns the linear interpolation of the current quaternion and `q`.
     *
     * Note: For the more common spherical linear interpolation see `slerp`.
     */
    public lerp(q: Quaternion, t: number): Quaternion {
        const qa = lerp(this.a, q.a, t);
        const qb = lerp(this.b, q.b, t);
        const qc = lerp(this.c, q.c, t);
        const qd = lerp(this.d, q.d, t);
        return new Quaternion(qa, qb, qc, qd);
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
    public mulP(p: Point3): Point3 {
        const qa = this.b * p.x + this.c * p.y + this.d * p.z;
        const qb = this.a * p.x + this.c * p.z - this.d * p.y;
        const qc = this.a * p.y - this.b * p.z + this.d * p.x;
        const qd = this.a * p.z + this.b * p.y - this.c * p.x;

        return new Point3(
            qa * this.b + qb * this.a - qc * this.d + qd * this.c,
            qa * this.c + qb * this.d + qc * this.a - qd * this.b,
            qa * this.d - qb * this.c + qc * this.b + qd * this.a,
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
    public mulV(v: Vector3): Vector3 {
        const qa = this.b * v.x + this.c * v.y + this.d * v.z;
        const qb = this.a * v.x + this.c * v.z - this.d * v.y;
        const qc = this.a * v.y - this.b * v.z + this.d * v.x;
        const qd = this.a * v.z + this.b * v.y - this.c * v.x;

        return new Vector3(
            qa * this.b + qb * this.a - qc * this.d + qd * this.c,
            qa * this.c + qb * this.d + qc * this.a - qd * this.b,
            qa * this.d - qb * this.c + qc * this.b + qd * this.a,
        );
    }

    /**
     * Returns the current quaternion to the power of `x`.
     *
     * References:
     * - https://en.wikipedia.org/wiki/Quaternion#Exponential,_logarithm,_and_power_functions
     */
    public pow(x: number): Quaternion {
        const len = this.len();
        const r = Math.pow(len, x);
        const angle = x * Math.acos(this.a / len);
        const rsin = r * Math.sin(angle);
        const rcos = r * Math.cos(angle);
        const va = this.axis().unit();
        return new Quaternion(rcos, rsin * va.x, rsin * va.y, rsin * va.z);
    }

    /**
     * Returns the current quaternion rotated by an extrinsic rotation around the x-axis.
     */
    public rotateX(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | cos |   | a |
        // | sin | * | b |
        // |   0 |   | c |
        // |   0 |   | d |
        this.a = cos * qa - sin * qb;
        this.b = cos * qb + sin * qa;
        this.c = cos * qc - sin * qd;
        this.d = cos * qd + sin * qc;
    }

    /**
     * Returns the current quaternion rotated by an instrinsic rotation around the x-axis.
     */
    public rotateXPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | a |   | cos |
        // | b | * | sin |
        // | c |   |   0 |
        // | d |   |   0 |
        this.a = qa * cos - qb * sin;
        this.b = qb * cos + qa * sin;
        this.c = qc * cos + qd * sin;
        this.d = qd * cos - qc * sin;
    }

    /**
     * Returns the current quaternion rotated by an extrinsic rotation around the y-axis.
     */
    public rotateY(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | cos |   | a |
        // |   0 | * | b |
        // | sin |   | c |
        // |   0 |   | d |
        this.a = cos * qa - sin * qc;
        this.b = cos * qb + sin * qd;
        this.c = cos * qc + sin * qa;
        this.d = cos * qd - sin * qb;
    }

    /**
     * Returns the current quaternion rotated by an instrinsic rotation around the y-axis.
     */
    public rotateYPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   | sin |
        // | d |   |   0 |
        this.a = qa * cos - qc * sin;
        this.b = qb * cos - qd * sin;
        this.c = qc * cos + qa * sin;
        this.d = qd * cos + qb * sin;
    }

    /**
     * Returns the current quaternion rotated by an extrinsic rotation around the z-axis.
     */
    public rotateZ(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | cos |   | a |
        // |   0 | * | b |
        // |   0 |   | c |
        // | sin |   | d |
        this.a = cos * qa - sin * qd;
        this.b = cos * qb - sin * qc;
        this.c = cos * qc + sin * qb;
        this.d = cos * qd + sin * qa;
    }

    /**
     * Returns the current quaternion rotated by an instrinsic rotation around the z-axis.
     */
    public rotateZPre(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        const qa = this.a;
        const qb = this.b;
        const qc = this.c;
        const qd = this.d;

        // | a |   | cos |
        // | b | * |   0 |
        // | c |   |   0 |
        // | d |   | sin |
        this.a = qa * cos - qd * sin;
        this.b = qb * cos + qc * sin;
        this.c = qc * cos - qb * sin;
        this.d = qd * cos + qa * sin;
    }

    /**
     * Returns the spherical linear interpolation of the current quaternion and `q`.
     */
    public slerp(q: Quaternion, t: number): Quaternion {
        // Glenn Davis formula (referenced by Ken Shoemake)
        const dot = this.a * q.a + this.b * q.b + this.c * q.c + this.d * q.d;
        const lenSq = this.lenSq() * q.lenSq();

        if (dot * dot >= lenSq) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(q, t);
        }

        const cos = dot / Math.sqrt(lenSq);

        const angle = Math.acos(cos);
        const sin1 = Math.sin(angle - angle * t);
        const sin2 = Math.sin(angle * t);
        const sin3 = Math.sin(angle);

        const s1 = sin1 / sin3;
        const s2 = sin2 / sin3;

        const qa = s1 * this.a + s2 * q.a;
        const qb = s1 * this.b + s2 * q.b;
        const qc = s1 * this.c + s2 * q.c;
        const qd = s1 * this.d + s2 * q.d;

        return new Quaternion(qa, qb, qc, qd);
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
