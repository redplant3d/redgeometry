import { COS_ACUTE, COS_OBTUSE } from "../core/consts.ts";
import { assertUnreachable } from "../utility/debug.ts";
import { clamp, eqApproxAbs, eqApproxRel, lerp } from "../utility/scalar.ts";
import type { Enum } from "../utility/types.ts";
import { Vector3, type ReadonlyVector3 } from "./vector.ts";

export type QuaternionLike = {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
};

export interface ReadonlyQuaternion {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;

    add(q: ReadonlyQuaternion): Quaternion;
    angle(q: ReadonlyQuaternion): number;
    axis(): Vector3;
    axisAngle(): number;
    clone(): Quaternion;
    conjugate(): Quaternion;
    divS(s: number): Quaternion;
    dot(z: ReadonlyQuaternion): number;
    eq(q: ReadonlyQuaternion): boolean;
    eqApproxAbs(q: ReadonlyQuaternion, eps: number): boolean;
    eqApproxRel(q: ReadonlyQuaternion, eps: number): boolean;
    eulerAngles(order: RotationOrder): { x: number; y: number; z: number };
    inverse(): Quaternion;
    isFinite(): boolean;
    isIdentity(): boolean;
    length(): number;
    lengthSq(): number;
    lerp(q: ReadonlyQuaternion, t: number): Quaternion;
    mul(q: ReadonlyQuaternion): Quaternion;
    mulS(s: number): Quaternion;
    mulV(v: ReadonlyVector3): Vector3;
    nlerp(q: ReadonlyQuaternion, t: number): Quaternion;
    orthonormalBasis(): { v1: Vector3; v2: Vector3; v3: Vector3 };
    rotateX(q: ReadonlyQuaternion, angle: number): Quaternion;
    rotateXPre(q: ReadonlyQuaternion, angle: number): Quaternion;
    rotateY(q: ReadonlyQuaternion, angle: number): Quaternion;
    rotateYPre(q: ReadonlyQuaternion, angle: number): Quaternion;
    rotateZ(q: ReadonlyQuaternion, angle: number): Quaternion;
    rotateZPre(q: ReadonlyQuaternion, angle: number): Quaternion;
    slerp(q: ReadonlyQuaternion, t: number): Quaternion;
    sub(q: ReadonlyQuaternion): Quaternion;
    toArray(): [number, number, number, number];
    toString(): string;
    unit(): Quaternion;
    unitOrIdentity(): Quaternion;
}

export const RotationOrder = {
    XYZ: 0,
    XZY: 1,
    YXZ: 2,
    YZX: 3,
    ZXY: 4,
    ZYX: 5,
} as const;
export type RotationOrder = Enum<typeof RotationOrder>;

/**
 * A quaternion to be used for 3D rotations.
 *
 * References:
 * - https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation
 * - https://danceswithcode.net/engineeringnotes/quaternions/quaternions.html
 */
export class Quaternion implements ReadonlyQuaternion {
    public static readonly IDENTITY: ReadonlyQuaternion = Quaternion.createIdentity();

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

    public static fromArray(data: ArrayLike<number>, offset = 0): Quaternion {
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

    /**
     * Returns a quaternion with rotation around `axis` and `angle`.
     *
     * Note: `axis` is assumed to be a unit vector.
     */
    public static fromRotationAxis(axis: ReadonlyVector3, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        return new Quaternion(cos, sin * axis.x, sin * axis.y, sin * axis.z);
    }

    /**
     * Returns a quaternion with minimal rotation from `v1` to `v2`.
     *
     * Note: `v1` and `v2` are assumed to be unit vectors.
     */
    public static fromRotationBetween(v1: ReadonlyVector3, v2: ReadonlyVector3): Quaternion {
        // This angle is double of the quaternion rotation
        const cos = v1.dot(v2);

        if (cos > COS_OBTUSE) {
            return Quaternion.createIdentity();
        }

        if (cos < COS_ACUTE) {
            // If the angle is close to 180 degrees the axis just needs to be perpendicular to `v1`
            const v1p = v1.perpAny().unit();
            return new Quaternion(0, v1p.x, v1p.y, v1p.z);
        }

        // We add an identity quaternion and set it to unit length to get half the rotation
        const va = v1.cross(v2);

        const q = new Quaternion(cos + 1, va.x, va.y, va.z);
        q.setUnit(q);

        return q;
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
            case 0 /* XYZ */: {
                return new Quaternion(qa1 - qa2, qb1 + qb2, qc1 - qc2, qd1 + qd2);
            }
            case 1 /* XZY */: {
                return new Quaternion(qa1 + qa2, qb1 - qb2, qc1 - qc2, qd1 + qd2);
            }
            case 2 /* YXZ */: {
                return new Quaternion(qa1 + qa2, qb1 + qb2, qc1 - qc2, qd1 - qd2);
            }
            case 3 /* YZX */: {
                return new Quaternion(qa1 - qa2, qb1 + qb2, qc1 + qc2, qd1 - qd2);
            }
            case 4 /* ZXY */: {
                return new Quaternion(qa1 - qa2, qb1 - qb2, qc1 + qc2, qd1 + qd2);
            }
            case 5 /* ZYX */: {
                return new Quaternion(qa1 + qa2, qb1 - qb2, qc1 + qc2, qd1 - qd2);
            }
            default: {
                assertUnreachable(order);
            }
        }
    }

    /**
     * Returns a quaternion from an unscaled rotation matrix.
     *
     * References:
     * - https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
     */
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
        // q0 = qaa + qbb - qcc - qdd
        // q4 = qaa - qbb + qcc - qdd
        // q8 = qaa - qbb - qcc + qdd
        if (q0 >= 0) {
            // qaa + qbb >= qcc + qdd
            if (q4 + q8 >= 0) {
                // 2 qaa >= 2 qbb
                const qa = 1 + q0 + q4 + q8;
                const qb = q5 - q7;
                const qc = q6 - q2;
                const qd = q1 - q3;
                const f = 0.5 / Math.sqrt(qa);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            } else {
                // 2 qbb > 2 qaa
                const qa = q5 - q7;
                const qb = 1 + q0 - q4 - q8;
                const qc = q3 + q1;
                const qd = q6 + q2;
                const f = 0.5 / Math.sqrt(qb);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            }
        } else {
            // qcc + qdd > qaa + qbb
            if (q4 - q8 >= 0) {
                // 2 qcc >= 2 qdd
                const qa = q6 - q2;
                const qb = q3 + q1;
                const qc = 1 - q0 + q4 - q8;
                const qd = q7 + q5;
                const f = 0.5 / Math.sqrt(qc);
                return new Quaternion(f * qa, f * qb, f * qc, f * qd);
            } else {
                // 2 qdd > 2 qcc
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

    public static toObject(q: ReadonlyQuaternion): QuaternionLike {
        return { a: q.a, b: q.b, c: q.c, d: q.d };
    }

    public add(q: ReadonlyQuaternion): Quaternion {
        return new Quaternion(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d);
    }

    /**
     * Returns the angle between the current quaternion and `q` in radians.
     *
     * Note: The returned value is unsigned and less than or equal to `2 * PI`.
     */
    public angle(q: ReadonlyQuaternion): number {
        // Glenn Davis formula (referenced by Ken Shoemake)
        const dot = this.dot(q);
        const sqrt = Math.sqrt(this.lengthSq() * q.lengthSq());

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

    /**
     * Returns the rotation axis vector of the current quaternion.
     *
     * Note: The result is generally not a unit vector.
     */
    public axis(): Vector3 {
        return new Vector3(this.b, this.c, this.d);
    }

    /**
     * Returns the rotation axis angle of the current quaternion.
     *
     * Note: The current quaternion is assumed to be of unit length.
     */
    public axisAngle(): number {
        return 2 * Math.acos(this.a);
    }

    public clone(): Quaternion {
        return new Quaternion(this.a, this.b, this.c, this.d);
    }

    public conjugate(): Quaternion {
        return new Quaternion(this.a, -this.b, -this.c, -this.d);
    }

    public divS(s: number): Quaternion {
        return new Quaternion(this.a / s, this.b / s, this.c / s, this.d / s);
    }

    public dot(q: ReadonlyQuaternion): number {
        return this.a * q.a + this.b * q.b + this.c * q.c + this.d * q.d;
    }

    public eq(q: ReadonlyQuaternion): boolean {
        return this.a === q.a && this.b === q.b && this.c === q.c && this.d === q.d;
    }

    public eqApproxAbs(q: ReadonlyQuaternion, eps: number): boolean {
        return (
            eqApproxAbs(this.a, q.a, eps) &&
            eqApproxAbs(this.b, q.b, eps) &&
            eqApproxAbs(this.c, q.c, eps) &&
            eqApproxAbs(this.d, q.d, eps)
        );
    }

    public eqApproxRel(q: ReadonlyQuaternion, eps: number): boolean {
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
    public eulerAngles(order: RotationOrder): { x: number; y: number; z: number } {
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
            case 0 /* XYZ */: {
                return {
                    x: Math.atan2(qab2 - qcd2, qaa - qbb - qcc + qdd),
                    y: Math.asin(clamp(qbd2 + qac2, -1, 1)),
                    z: Math.atan2(qad2 - qbc2, qaa + qbb - qcc - qdd),
                };
            }
            case 1 /* XZY */: {
                return {
                    x: Math.atan2(qcd2 + qab2, qaa - qbb + qcc - qdd),
                    y: Math.atan2(qbd2 + qac2, qaa + qbb - qcc - qdd),
                    z: Math.asin(clamp(qad2 - qbc2, -1, 1)),
                };
            }
            case 2 /* YXZ */: {
                return {
                    x: Math.asin(clamp(qab2 - qcd2, -1, 1)),
                    y: Math.atan2(qbd2 + qac2, qaa - qbb - qcc + qdd),
                    z: Math.atan2(qbc2 + qad2, qaa - qbb + qcc - qdd),
                };
            }
            case 3 /* YZX */: {
                return {
                    x: Math.atan2(qab2 - qcd2, qaa - qbb + qcc - qdd),
                    y: Math.atan2(qac2 - qbd2, qaa + qbb - qcc - qdd),
                    z: Math.asin(clamp(qbc2 + qad2, -1, 1)),
                };
            }
            case 4 /* ZXY */: {
                return {
                    x: Math.asin(clamp(qcd2 + qab2, -1, 1)),
                    y: Math.atan2(qac2 - qbd2, qaa - qbb - qcc + qdd),
                    z: Math.atan2(qad2 - qbc2, qaa - qbb + qcc - qdd),
                };
            }
            case 5 /* ZYX */: {
                return {
                    x: Math.atan2(qcd2 + qab2, qaa - qbb - qcc + qdd),
                    y: Math.asin(clamp(qac2 - qbd2, -1, 1)),
                    z: Math.atan2(qbc2 + qad2, qaa + qbb - qcc - qdd),
                };
            }
            default: {
                assertUnreachable(order);
            }
        }
    }

    public inverse(): Quaternion {
        const s = this.lengthSq();
        return new Quaternion(this.a / s, -this.b / s, -this.c / s, -this.d / s);
    }

    public isIdentity(): boolean {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 0;
    }

    public isFinite(): boolean {
        return Number.isFinite(this.a) && Number.isFinite(this.b) && Number.isFinite(this.c) && Number.isFinite(this.d);
    }

    public length(): number {
        return Math.sqrt(this.lengthSq());
    }

    public lengthSq(): number {
        return this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d;
    }

    /**
     * Returns the linear interpolation of the current quaternion and `q`.
     */
    public lerp(q: ReadonlyQuaternion, t: number): Quaternion {
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
    public mul(q: ReadonlyQuaternion): Quaternion {
        return new Quaternion(
            this.a * q.a - this.b * q.b - this.c * q.c - this.d * q.d,
            this.a * q.b + this.b * q.a + this.c * q.d - this.d * q.c,
            this.a * q.c - this.b * q.d + this.c * q.a + this.d * q.b,
            this.a * q.d + this.b * q.c - this.c * q.b + this.d * q.a,
        );
    }

    public mulS(s: number): Quaternion {
        return new Quaternion(s * this.a, s * this.b, s * this.c, s * this.d);
    }

    /**
     * ```
     * | a |   |  0 |   |  a |
     * | b | * | vx | * | -b |
     * | c |   | vy |   | -c |
     * | d |   | vz |   | -d |
     * ```
     */
    public mulV(v: ReadonlyVector3): Vector3 {
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
     * Returns the normalized linear interpolation of the current quaternion and `q`.
     */
    public nlerp(q: ReadonlyQuaternion, t: number): Quaternion {
        const a = lerp(this.a, q.a, t);
        const b = lerp(this.b, q.b, t);
        const c = lerp(this.c, q.c, t);
        const d = lerp(this.d, q.d, t);

        const len = Math.sqrt(a * a + b * b + c * c + d * d);

        if (len === 0) {
            return Quaternion.createIdentity();
        }

        return new Quaternion(a / len, b / len, c / len, d / len);
    }

    /**
     * Returns an orthonormal basis of the current quaternion.
     *
     * Note: The current quaternion is assumed to be of unit length.
     */
    public orthonormalBasis(): { v1: Vector3; v2: Vector3; v3: Vector3 } {
        const qaa = this.a * this.a;
        const qbb = this.b * this.b;
        const qcc = this.c * this.c;
        const qdd = this.d * this.d;
        const q0 = qaa + qbb - qcc - qdd;
        const q4 = qaa - qbb + qcc - qdd;
        const q8 = qaa - qbb - qcc + qdd;

        const qbc = this.b * this.c;
        const qad = this.a * this.d;
        const q1 = qbc + qbc + qad + qad;
        const q3 = qbc + qbc - qad - qad;

        const qbd = this.b * this.d;
        const qac = this.a * this.c;
        const q2 = qbd + qbd - qac - qac;
        const q6 = qbd + qbd + qac + qac;

        const qcd = this.c * this.d;
        const qab = this.a * this.b;
        const q5 = qcd + qcd + qab + qab;
        const q7 = qcd + qcd - qab - qab;

        const v1 = new Vector3(q0, q1, q2);
        const v2 = new Vector3(q3, q4, q5);
        const v3 = new Vector3(q6, q7, q8);

        return { v1, v2, v3 };
    }

    /**
     * ```
     * | cos |   | a |
     * | sin | * | b |
     * |   0 |   | c |
     * |   0 |   | d |
     * ```
     */
    public rotateX(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.b;
        const qb = cos * q.b + sin * q.a;
        const qc = cos * q.c - sin * q.d;
        const qd = cos * q.d + sin * q.c;

        return new Quaternion(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * | sin |
     * | c |   |   0 |
     * | d |   |   0 |
     * ```
     */
    public rotateXPre(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.b * sin;
        const qb = q.b * cos + q.a * sin;
        const qc = q.c * cos + q.d * sin;
        const qd = q.d * cos - q.c * sin;

        return new Quaternion(qa, qb, qc, qd);
    }

    /**
     * ```
     * | cos |   | a |
     * |   0 | * | b |
     * | sin |   | c |
     * |   0 |   | d |
     * ```
     */
    public rotateY(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.c;
        const qb = cos * q.b + sin * q.d;
        const qc = cos * q.c + sin * q.a;
        const qd = cos * q.d - sin * q.b;

        return new Quaternion(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * |   0 |
     * | c |   | sin |
     * | d |   |   0 |
     * ```
     */
    public rotateYPre(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.c * sin;
        const qb = q.b * cos - q.d * sin;
        const qc = q.c * cos + q.a * sin;
        const qd = q.d * cos + q.b * sin;

        return new Quaternion(qa, qb, qc, qd);
    }

    /**
     * ```
     * | cos |   | a |
     * |   0 | * | b |
     * |   0 |   | c |
     * | sin |   | d |
     * ```
     */
    public rotateZ(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.d;
        const qb = cos * q.b - sin * q.c;
        const qc = cos * q.c + sin * q.b;
        const qd = cos * q.d + sin * q.a;

        return new Quaternion(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * |   0 |
     * | c |   |   0 |
     * | d |   | sin |
     * ```
     */
    public rotateZPre(q: ReadonlyQuaternion, angle: number): Quaternion {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.d * sin;
        const qb = q.b * cos + q.c * sin;
        const qc = q.c * cos - q.b * sin;
        const qd = q.d * cos + q.a * sin;

        return new Quaternion(qa, qb, qc, qd);
    }

    public set(a: number, b: number, c: number, d: number): void {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    public setAdd(q1: ReadonlyQuaternion, q2: ReadonlyQuaternion): void {
        this.a = q1.a + q2.a;
        this.b = q1.b + q2.b;
        this.c = q1.c + q2.c;
        this.d = q1.d + q2.d;
    }

    public setDivS(q: ReadonlyQuaternion, s: number): void {
        this.a = q.a / s;
        this.b = q.b / s;
        this.c = q.c / s;
        this.d = q.d / s;
    }

    public setFrom(q: ReadonlyQuaternion): void {
        this.a = q.a;
        this.b = q.b;
        this.c = q.c;
        this.d = q.d;
    }

    public setFromRotationX(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        this.set(cos, sin, 0, 0);
    }

    public setFromRotationY(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        this.set(cos, 0, sin, 0);
    }

    public setFromRotationZ(angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);
        this.set(cos, 0, 0, sin);
    }

    public setMul(q1: ReadonlyQuaternion, q2: ReadonlyQuaternion): void {
        const qa = q1.a * q2.a - q1.b * q2.b - q1.c * q2.c - q1.d * q2.d;
        const qb = q1.a * q2.b + q1.b * q2.a + q1.c * q2.d - q1.d * q2.c;
        const qc = q1.a * q2.c - q1.b * q2.d + q1.c * q2.a + q1.d * q2.b;
        const qd = q1.a * q2.d + q1.b * q2.c - q1.c * q2.b + q1.d * q2.a;

        this.set(qa, qb, qc, qd);
    }

    public setMulS(s: number, q: ReadonlyQuaternion): void {
        this.a = s * q.a;
        this.b = s * q.b;
        this.c = s * q.c;
        this.d = s * q.d;
    }

    /**
     * ```
     * | cos |   | a |
     * | sin | * | b |
     * |   0 |   | c |
     * |   0 |   | d |
     * ```
     */
    public setRotateX(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.b;
        const qb = cos * q.b + sin * q.a;
        const qc = cos * q.c - sin * q.d;
        const qd = cos * q.d + sin * q.c;

        this.set(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * | sin |
     * | c |   |   0 |
     * | d |   |   0 |
     * ```
     */
    public setRotateXPre(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.b * sin;
        const qb = q.b * cos + q.a * sin;
        const qc = q.c * cos + q.d * sin;
        const qd = q.d * cos - q.c * sin;

        this.set(qa, qb, qc, qd);
    }

    /**
     * ```
     * | cos |   | a |
     * |   0 | * | b |
     * | sin |   | c |
     * |   0 |   | d |
     * ```
     */
    public setRotateY(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.c;
        const qb = cos * q.b + sin * q.d;
        const qc = cos * q.c + sin * q.a;
        const qd = cos * q.d - sin * q.b;

        this.set(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * |   0 |
     * | c |   | sin |
     * | d |   |   0 |
     * ```
     */
    public setRotateYPre(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.c * sin;
        const qb = q.b * cos - q.d * sin;
        const qc = q.c * cos + q.a * sin;
        const qd = q.d * cos + q.b * sin;

        this.set(qa, qb, qc, qd);
    }

    /**
     * ```
     * | cos |   | a |
     * |   0 | * | b |
     * |   0 |   | c |
     * | sin |   | d |
     * ```
     */
    public setRotateZ(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = cos * q.a - sin * q.d;
        const qb = cos * q.b - sin * q.c;
        const qc = cos * q.c + sin * q.b;
        const qd = cos * q.d + sin * q.a;

        this.set(qa, qb, qc, qd);
    }

    /**
     * ```
     * | a |   | cos |
     * | b | * |   0 |
     * | c |   |   0 |
     * | d |   | sin |
     * ```
     */
    public setRotateZPre(q: ReadonlyQuaternion, angle: number): void {
        const sin = Math.sin(0.5 * angle);
        const cos = Math.cos(0.5 * angle);

        const qa = q.a * cos - q.d * sin;
        const qb = q.b * cos + q.c * sin;
        const qc = q.c * cos - q.b * sin;
        const qd = q.d * cos + q.a * sin;

        this.set(qa, qb, qc, qd);
    }

    public setSub(q1: ReadonlyQuaternion, q2: ReadonlyQuaternion): void {
        this.a = q1.a - q2.a;
        this.b = q1.b - q2.b;
        this.c = q1.c - q2.c;
        this.d = q1.d - q2.d;
    }

    public setUnit(q: ReadonlyQuaternion): void {
        const s = q.length();
        this.setDivS(q, s);
    }

    /**
     * Returns the spherical linear interpolation of the current quaternion and `q`.
     */
    public slerp(q: ReadonlyQuaternion, t: number): Quaternion {
        // Glenn Davis formula (referenced by Ken Shoemake)
        const dot = this.dot(q);
        const sqrt = Math.sqrt(this.lengthSq() * q.lengthSq());

        if (sqrt <= dot) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(q, t);
        }

        const angle = Math.acos(dot / sqrt);
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

    public sub(q: ReadonlyQuaternion): Quaternion {
        return new Quaternion(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d);
    }

    public toArray(): [number, number, number, number] {
        return [this.a, this.b, this.c, this.d];
    }

    public toString(): string {
        return "{a: " + this.a + ", b: " + this.b + ", c: " + this.c + ", d: " + this.d + "}";
    }

    public unit(): Quaternion {
        return this.divS(this.length());
    }

    public unitOrIdentity(): Quaternion {
        const s = this.length();

        if (s === 0) {
            return Quaternion.createIdentity();
        }

        return this.divS(s);
    }
}
