import { clamp, eqApproxAbs, eqApproxRel, lerp, roundToPrecision } from "../utility/scalar.js";

export type Vector2Like = {
    readonly x: number;
    readonly y: number;
};

export type Vector3Like = {
    readonly x: number;
    readonly y: number;
    readonly z: number;
};

export type Vector4Like = {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
};

export interface ReadonlyVector2 {
    readonly x: number;
    readonly y: number;

    abs(): Vector2;
    add(v: ReadonlyVector2): Vector2;
    addMulS(v: ReadonlyVector2, s: number): Vector2;
    addS(s: number): Vector2;
    angle(v: ReadonlyVector2): number;
    ceil(): Vector2;
    clamp(vmin: ReadonlyVector2, vmax: ReadonlyVector2): Vector2;
    clone(): Vector2;
    cross(v: ReadonlyVector2): number;
    distance(v: ReadonlyVector2): number;
    distanceSq(v: ReadonlyVector2): number;
    div(v: ReadonlyVector2): Vector2;
    divS(s: number): Vector2;
    dot(v: ReadonlyVector2): number;
    eq(v: ReadonlyVector2): boolean;
    eqApproxAbs(v: ReadonlyVector2, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector2, eps: number): boolean;
    floor(): Vector2;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    length(): number;
    lengthSq(): number;
    lerp(v: ReadonlyVector2, t: number): Vector2;
    max(v: ReadonlyVector2): Vector2;
    min(v: ReadonlyVector2): Vector2;
    mul(v: ReadonlyVector2): Vector2;
    mulS(s: number): Vector2;
    neg(): Vector2;
    nlerp(v: ReadonlyVector2, t: number): Vector2;
    perp(): Vector2;
    polarAngle(): number;
    round(): Vector2;
    roundToPrecision(k: number): Vector2;
    slerp(v: ReadonlyVector2, t: number): Vector2;
    sub(v: ReadonlyVector2): Vector2;
    subS(s: number): Vector2;
    toArray(): [number, number];
    toString(): string;
    unit(): Vector2;
    unitOrZero(): Vector2;
}

export interface ReadonlyVector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    abs(): Vector3;
    add(v: ReadonlyVector3): Vector3;
    addMulS(v: ReadonlyVector3, s: number): Vector3;
    addS(s: number): Vector3;
    angle(v: ReadonlyVector3): number;
    ceil(): Vector3;
    clamp(vmin: ReadonlyVector3, vmax: ReadonlyVector3): Vector3;
    clone(): Vector3;
    cross(v: ReadonlyVector3): Vector3;
    distance(v: ReadonlyVector3): number;
    distanceSq(v: ReadonlyVector3): number;
    div(v: ReadonlyVector3): Vector3;
    divS(s: number): Vector3;
    dot(v: ReadonlyVector3): number;
    eq(v: ReadonlyVector3): boolean;
    eqApproxAbs(v: ReadonlyVector3, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector3, eps: number): boolean;
    floor(): Vector3;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    length(): number;
    lengthSq(): number;
    lerp(v: ReadonlyVector3, t: number): Vector3;
    max(v: ReadonlyVector3): Vector3;
    min(v: ReadonlyVector3): Vector3;
    mul(v: ReadonlyVector3): Vector3;
    mulS(s: number): Vector3;
    neg(): Vector3;
    nlerp(v: ReadonlyVector3, t: number): Vector3;
    orthonormalBasis(): { v1: Vector3; v2: Vector3; v3: Vector3 };
    perpAny(): Vector3;
    round(): Vector3;
    roundToPrecision(k: number): Vector3;
    slerp(v: ReadonlyVector3, t: number): Vector3;
    sub(v: ReadonlyVector3): Vector3;
    subS(s: number): Vector3;
    toArray(): [number, number, number];
    toString(): string;
    unit(): Vector3;
    unitOrZero(): Vector3;
    xy(): Vector2;
    xz(): Vector2;
}

export interface ReadonlyVector4 {
    readonly w: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;

    abs(): Vector4;
    add(v: ReadonlyVector4): Vector4;
    addMulS(v: ReadonlyVector4, s: number): Vector4;
    addS(s: number): Vector4;
    ceil(): Vector4;
    clamp(vmin: ReadonlyVector4, vmax: ReadonlyVector4): Vector4;
    clone(): Vector4;
    distance(v: ReadonlyVector4): number;
    distanceSq(v: ReadonlyVector4): number;
    div(v: ReadonlyVector4): Vector4;
    divS(s: number): Vector4;
    dot(v: ReadonlyVector4): number;
    eq(v: ReadonlyVector4): boolean;
    eqApproxAbs(v: ReadonlyVector4, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector4, eps: number): boolean;
    floor(): Vector4;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    length(): number;
    lengthSq(): number;
    lerp(v: ReadonlyVector4, t: number): Vector4;
    max(v: ReadonlyVector4): Vector4;
    min(v: ReadonlyVector4): Vector4;
    mul(v: ReadonlyVector4): Vector4;
    mulS(s: number): Vector4;
    neg(): Vector4;
    nlerp(v: ReadonlyVector4, t: number): Vector4;
    round(): Vector4;
    roundToPrecision(k: number): Vector4;
    sub(v: ReadonlyVector4): Vector4;
    subS(s: number): Vector4;
    toArray(): [number, number, number, number];
    toString(): string;
    unit(): Vector4;
    unitOrZero(): Vector4;
    xy(): Vector2;
    xyz(): Vector3;
    xz(): Vector2;
}

export class Vector2 implements ReadonlyVector2 {
    public static readonly ONE: ReadonlyVector2 = Vector2.createOne();
    public static readonly UNIT_X: ReadonlyVector2 = Vector2.createUnitX();
    public static readonly UNIT_Y: ReadonlyVector2 = Vector2.createUnitY();
    public static readonly ZERO: ReadonlyVector2 = Vector2.createZero();

    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the vector `(1, 1)`.
     */
    public static createOne(): Vector2 {
        return new Vector2(1, 1);
    }

    /**
     * Returns the unit vector in the direction of the x-axis.
     */
    public static createUnitX(): Vector2 {
        return new Vector2(1, 0);
    }

    /**
     * Returns the unit vector in the direction of the y-axis.
     */
    public static createUnitY(): Vector2 {
        return new Vector2(0, 1);
    }

    /**
     * Returns the vector `(0, 0)`.
     */
    public static createZero(): Vector2 {
        return new Vector2(0, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Vector2 {
        return new Vector2(data[offset], data[offset + 1]);
    }

    public static fromObject(obj: Vector2Like): Vector2 {
        return new Vector2(obj.x, obj.y);
    }

    public static fromXYW(x: number, y: number, w: number): Vector2 {
        return new Vector2(x / w, y / w);
    }

    /**
     * Checks if `v` is clockwise between `v1` and `v2`.
     */
    public static isBetweenCcw(v: ReadonlyVector2, v1: ReadonlyVector2, v2: ReadonlyVector2): boolean {
        if (v1.cross(v2) > 0) {
            // `v2` is clockwise to `v1`
            return v1.cross(v) > 0 && v2.cross(v) < 0;
        } else {
            // `v1` is clockwise to `v2`
            return v1.cross(v) > 0 || v2.cross(v) < 0;
        }
    }

    /**
     * Returns whether `p` is inside the triangle `p0`, `p1` and `p2`.
     *
     * References:
     * - *Triangle Interior*.
     *   https://mathworld.wolfram.com/TriangleInterior.html
     */
    public static isPointInTriangle(
        p0: ReadonlyVector2,
        p1: ReadonlyVector2,
        p2: ReadonlyVector2,
        p: ReadonlyVector2,
    ): boolean {
        const v = p.sub(p0);
        const v1 = p1.sub(p0);
        const v2 = p2.sub(p0);

        const r = v.cross(v2);
        const s = v1.cross(v);
        const d = v1.cross(v2);

        if (d > 0) {
            return r > 0 && s > 0 && r + s < d;
        } else {
            return r < 0 && s < 0 && r + s > d;
        }
    }

    public static signedArea(p0: ReadonlyVector2, p1: ReadonlyVector2, p: ReadonlyVector2): number {
        // `result < 0` -> `p` is below `(p0, p1)`
        // `result > 0` -> `p` is above `(p0, p1)`
        const v1 = p1.sub(p0);
        const v2 = p.sub(p0);
        return v1.cross(v2);
    }

    public static toObject(v: ReadonlyVector2): Vector2Like {
        return { x: v.x, y: v.y };
    }

    public abs(): Vector2 {
        const x = Math.abs(this.x);
        const y = Math.abs(this.y);
        return new Vector2(x, y);
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: ReadonlyVector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /**
     * Returns the sum of the current vector and a vector `v` multiplied by a scalar `s`.
     */
    public addMulS(v: ReadonlyVector2, s: number): Vector2 {
        return new Vector2(this.x + s * v.x, this.y + s * v.y);
    }

    /**
     * Returns the sum of the current vector and a scalar `s`.
     */
    public addS(s: number): Vector2 {
        return new Vector2(this.x + s, this.y + s);
    }

    /**
     * Returns the angle between the current vector and `v` in radians.
     *
     * Note: The returned value is unsigned and less than or equal to `PI`.
     */
    public angle(v: ReadonlyVector2): number {
        const dot = this.dot(v);
        const sqrt = Math.sqrt(this.lengthSq() * v.lengthSq());

        if (sqrt <= dot) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        if (sqrt <= -dot) {
            // Angle very close or equal to Pi
            return Math.PI;
        }

        return Math.acos(dot / sqrt);
    }

    public ceil(): Vector2 {
        const x = Math.ceil(this.x);
        const y = Math.ceil(this.y);

        return new Vector2(x, y);
    }

    public clamp(vmin: ReadonlyVector2, vmax: ReadonlyVector2): Vector2 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        return new Vector2(x, y);
    }

    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * Returns the 2D cross product of the current vector and `v` as a scalar value.
     *
     * The 2D cross product is defined by the magnitude of the 3D cross product: \
     * `(x1, y1, 0) cross (x2, y2, 0) == (0, 0, x1 * y2 - y1 * x2)`
     */
    public cross(v: ReadonlyVector2): number {
        return this.x * v.y - this.y * v.x;
    }

    public distance(v: ReadonlyVector2): number {
        const d2 = this.distanceSq(v);
        return Math.sqrt(d2);
    }

    public distanceSq(v: ReadonlyVector2): number {
        const x = this.x - v.x;
        const y = this.y - v.y;
        return x * x + y * y;
    }

    /**
     * Returns the element-wise quotient of the current vector and a vector `v`.
     */
    public div(v: ReadonlyVector2): Vector2 {
        return new Vector2(this.x / v.x, this.y / v.y);
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     */
    public divS(s: number): Vector2 {
        return new Vector2(this.x / s, this.y / s);
    }

    /**
     * Returns the dot product of the current vector and `v` as a scalar value: \
     * `(x1, y1) dot (x2, y2) == x1 * x2 + y1 * y2`
     */
    public dot(v: ReadonlyVector2): number {
        return this.x * v.x + this.y * v.y;
    }

    public eq(v: ReadonlyVector2): boolean {
        return this.x === v.x && this.y === v.y;
    }

    public eqApproxAbs(v: ReadonlyVector2, eps: number): boolean {
        return eqApproxAbs(this.x, v.x, eps) && eqApproxAbs(this.y, v.y, eps);
    }

    public eqApproxRel(v: ReadonlyVector2, eps: number): boolean {
        return eqApproxRel(this.x, v.x, eps) && eqApproxRel(this.y, v.y, eps);
    }

    public floor(): Vector2 {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y);

        return new Vector2(x, y);
    }

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    public length(): number {
        return Math.sqrt(this.lengthSq());
    }

    public lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    public lerp(v: ReadonlyVector2, t: number): Vector2 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        return new Vector2(x, y);
    }

    public max(v: ReadonlyVector2): Vector2 {
        const x = Math.max(this.x, v.x);
        const y = Math.max(this.y, v.y);

        return new Vector2(x, y);
    }

    public min(v: ReadonlyVector2): Vector2 {
        const x = Math.min(this.x, v.x);
        const y = Math.min(this.y, v.y);

        return new Vector2(x, y);
    }

    /**
     * Returns the element-wise product of the current vector and a vector `v`.
     */
    public mul(v: ReadonlyVector2): Vector2 {
        return new Vector2(this.x * v.x, this.y * v.y);
    }

    /**
     * Returns the product of the current vector and a scalar `s`.
     */
    public mulS(s: number): Vector2 {
        return new Vector2(s * this.x, s * this.y);
    }

    public neg(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    /**
     * Returns the normalized linear interpolation of the current vector.
     */
    public nlerp(v: ReadonlyVector2, t: number): Vector2 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);

        const len = Math.sqrt(x * x + y * y);

        if (len === 0) {
            return Vector2.createZero();
        }

        return new Vector2(x / len, y / len);
    }

    /**
     * Returns a vector that is perpendicular to the current vector.
     *
     * The result is defined by the cross product in 3D: \
     * `(x, y, 0) cross (0, 0, 1) == (y, -x, 0)`
     */
    public perp(): Vector2 {
        return new Vector2(this.y, -this.x);
    }

    /**
     * Returns the angle of the vector from polar coordinates in radians.
     */
    public polarAngle(): number {
        return Math.atan2(this.y, this.x);
    }

    public round(): Vector2 {
        const x = Math.round(this.x);
        const y = Math.round(this.y);

        return new Vector2(x, y);
    }

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public roundToPrecision(k: number): Vector2 {
        const x = roundToPrecision(this.x, k);
        const y = roundToPrecision(this.y, k);

        return new Vector2(x, y);
    }

    public set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public setAdd(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        this.x = v1.x + v2.x;
        this.y = v1.y + v2.y;
    }

    public setAddMulS(v1: ReadonlyVector2, s: number, v2: ReadonlyVector2): void {
        this.x = v1.x + s * v2.x;
        this.y = v1.y + s * v2.y;
    }

    public setAddS(v: ReadonlyVector2, s: number): void {
        this.x = v.x + s;
        this.y = v.y + s;
    }

    public setDiv(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        this.x = v1.x / v2.x;
        this.y = v1.y / v2.y;
    }

    public setDivS(v: ReadonlyVector2, s: number): void {
        this.x = v.x / s;
        this.y = v.y / s;
    }

    public setFrom(v: ReadonlyVector2): void {
        this.x = v.x;
        this.y = v.y;
    }

    public setMul(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        this.x = v1.x * v2.x;
        this.y = v1.y * v2.y;
    }

    public setMulS(s: number, v: ReadonlyVector2): void {
        this.x = s * v.x;
        this.y = s * v.y;
    }

    public setSub(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        this.x = v1.x - v2.x;
        this.y = v1.y - v2.y;
    }

    public setSubS(v: ReadonlyVector2, s: number): void {
        this.x = v.x - s;
        this.y = v.y - s;
    }

    public setUnit(v: ReadonlyVector2): void {
        const s = v.length();
        this.x = v.x / s;
        this.y = v.y / s;
    }

    /**
     * Returns the spherical linear interpolation of the current vector and `v`.
     */
    public slerp(v: ReadonlyVector2, t: number): Vector2 {
        const dot = this.dot(v);
        const sqrt = Math.sqrt(this.lengthSq() * v.lengthSq());

        if (sqrt <= dot) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(v, t);
        }

        const angle = Math.acos(dot / sqrt);
        const sin1 = Math.sin(angle - angle * t);
        const sin2 = Math.sin(angle * t);
        const sin3 = Math.sin(angle);

        const s1 = sin1 / sin3;
        const s2 = sin2 / sin3;

        const x = s1 * this.x + s2 * v.x;
        const y = s1 * this.y + s2 * v.y;

        return new Vector2(x, y);
    }

    /**
     * Returns the difference of the current vector and a vector `v`.
     */
    public sub(v: ReadonlyVector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /**
     * Returns the difference of the current vector and a scalar `s`.
     */
    public subS(s: number): Vector2 {
        return new Vector2(this.x - s, this.y - s);
    }

    public toArray(): [number, number] {
        return [this.x, this.y];
    }

    public toString(): string {
        return "{x: " + this.x + ", y: " + this.y + "}";
    }

    public unit(): Vector2 {
        return this.divS(this.length());
    }

    public unitOrZero(): Vector2 {
        const s = this.length();

        if (s === 0) {
            return Vector2.createZero();
        }

        return this.divS(s);
    }
}

export class Vector3 implements ReadonlyVector3 {
    public static readonly ONE: ReadonlyVector3 = Vector3.createOne();
    public static readonly UNIT_X: ReadonlyVector3 = Vector3.createUnitX();
    public static readonly UNIT_Y: ReadonlyVector3 = Vector3.createUnitY();
    public static readonly UNIT_Z: ReadonlyVector3 = Vector3.createUnitZ();
    public static readonly ZERO: ReadonlyVector3 = Vector3.createZero();

    public x: number;
    public y: number;
    public z: number;

    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Returns the vector `(1, 1, 1)`.
     */
    public static createOne(): Vector3 {
        return new Vector3(1, 1, 1);
    }

    /**
     * Returns the unit vector in the direction of the x-axis.
     */
    public static createUnitX(): Vector3 {
        return new Vector3(1, 0, 0);
    }

    /**
     * Returns the unit vector in the direction of the y-axis.
     */
    public static createUnitY(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    /**
     * Returns the unit vector in the direction of the z-axis.
     */
    public static createUnitZ(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    /**
     * Returns the vector `(0, 0, 0)`.
     */
    public static createZero(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Vector3 {
        return new Vector3(data[offset], data[offset + 1], data[offset + 2]);
    }

    public static fromObject(obj: Vector3Like): Vector3 {
        return new Vector3(obj.x, obj.y, obj.z);
    }

    public static fromXYW(x: number, y: number, w: number): Vector3 {
        return new Vector3(w * x, w * y, w);
    }

    public static fromXYZW(x: number, y: number, z: number, w: number): Vector3 {
        return new Vector3(x / w, y / w, z / w);
    }

    public static toObject(v: ReadonlyVector3): Vector3Like {
        return { x: v.x, y: v.y, z: v.z };
    }

    public abs(): Vector3 {
        const x = Math.abs(this.x);
        const y = Math.abs(this.y);
        const z = Math.abs(this.z);
        return new Vector3(x, y, z);
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: ReadonlyVector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    /**
     * Returns the sum of the current vector and a vector `v` multiplied by a scalar `s`.
     */
    public addMulS(v: ReadonlyVector3, s: number): Vector3 {
        return new Vector3(this.x + s * v.x, this.y + s * v.y, this.z + s * v.z);
    }

    /**
     * Returns the sum of the current vector and a scalar `s`.
     */
    public addS(s: number): Vector3 {
        return new Vector3(this.x + s, this.y + s, this.z + s);
    }

    /**
     * Returns the angle between the current vector and `v` in radians.
     *
     * Note: The returned value is unsigned and less than or equal to `PI`.
     */
    public angle(v: ReadonlyVector3): number {
        const dot = this.dot(v);
        const sqrt = Math.sqrt(this.lengthSq() * v.lengthSq());

        if (sqrt <= dot) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        if (sqrt <= -dot) {
            // Angle very close or equal to Pi
            return Math.PI;
        }

        return Math.acos(dot / sqrt);
    }

    public ceil(): Vector3 {
        const x = Math.ceil(this.x);
        const y = Math.ceil(this.y);
        const z = Math.ceil(this.z);

        return new Vector3(x, y, z);
    }

    public clamp(vmin: ReadonlyVector3, vmax: ReadonlyVector3): Vector3 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        const z = clamp(this.z, vmin.z, vmax.z);
        return new Vector3(x, y, z);
    }

    public clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public cross(v: ReadonlyVector3): Vector3 {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new Vector3(x, y, z);
    }

    public distance(v: ReadonlyVector3): number {
        const d2 = this.distanceSq(v);
        return Math.sqrt(d2);
    }

    public distanceSq(v: ReadonlyVector3): number {
        const x = this.x - v.x;
        const y = this.y - v.y;
        const z = this.z - v.z;
        return x * x + y * y + z * z;
    }

    /**
     * Returns the element-wise quotient of the current vector and a vector `v`.
     */
    public div(v: ReadonlyVector3): Vector3 {
        return new Vector3(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     */
    public divS(s: number): Vector3 {
        return new Vector3(this.x / s, this.y / s, this.z / s);
    }

    public dot(v: ReadonlyVector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    public eq(v: ReadonlyVector3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    public eqApproxAbs(v: ReadonlyVector3, eps: number): boolean {
        return eqApproxAbs(this.x, v.x, eps) && eqApproxAbs(this.y, v.y, eps) && eqApproxAbs(this.z, v.z, eps);
    }

    public eqApproxRel(v: ReadonlyVector3, eps: number): boolean {
        return eqApproxRel(this.x, v.x, eps) && eqApproxRel(this.y, v.y, eps) && eqApproxRel(this.z, v.z, eps);
    }

    public floor(): Vector3 {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y);
        const z = Math.floor(this.z);

        return new Vector3(x, y, z);
    }

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1 && this.z === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    public length(): number {
        return Math.sqrt(this.lengthSq());
    }

    public lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    public lerp(v: ReadonlyVector3, t: number): Vector3 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        return new Vector3(x, y, z);
    }

    public max(v: ReadonlyVector3): Vector3 {
        const x = Math.max(this.x, v.x);
        const y = Math.max(this.y, v.y);
        const z = Math.max(this.z, v.z);

        return new Vector3(x, y, z);
    }

    public min(v: ReadonlyVector3): Vector3 {
        const x = Math.min(this.x, v.x);
        const y = Math.min(this.y, v.y);
        const z = Math.min(this.z, v.z);

        return new Vector3(x, y, z);
    }

    /**
     * Returns the element-wise product of the current vector and a vector `v`.
     */
    public mul(v: ReadonlyVector3): Vector3 {
        return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    /**
     * Returns the product of the current vector and a scalar `s`.
     */
    public mulS(s: number): Vector3 {
        return new Vector3(s * this.x, s * this.y, s * this.z);
    }

    public neg(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    /**
     * Returns the normalized linear interpolation of the current vector.
     */
    public nlerp(v: ReadonlyVector3, t: number): Vector3 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);

        const len = Math.sqrt(x * x + y * y + z * z);

        if (len === 0) {
            return Vector3.createZero();
        }

        return new Vector3(x / len, y / len, z / len);
    }

    /**
     * Returns an orthonormal basis of the current vector.
     *
     * Note: The current vector is assumed to be of unit length.
     *
     * References:
     * - Tom Duff, James Burgess, Per Christensen, Christophe Hery, Andrew Kensler, Max Liani and Ryusuke Villemin.
     *   *Building an Orthonormal Basis, Revisited*.
     *   Journal of Computer Graphics Techniques Vol. 6, No. 1, 2017.
     */
    public orthonormalBasis(): { v1: Vector3; v2: Vector3; v3: Vector3 } {
        const sign = this.z >= 0 ? 1 : -1;
        const a = -1 / (sign + this.z);
        const b = this.x * this.y * a;

        const v1 = this.clone();
        const v2 = new Vector3(1 + sign * this.x * this.x * a, sign * b, -sign * this.x);
        const v3 = new Vector3(b, sign + this.y * this.y * a, -this.y);

        return { v1, v2, v3 };
    }

    /**
     * Returns a vector that is perpendicular to the current vector and an appropriate axis.
     *
     * The result is defined by the cross product:
     * - `(x, y, z) cross (1, 0, 0) == (0, z, -y)` if x is the absolute minimum
     * - `(x, y, z) cross (0, 1, 0) == (-z, 0, x)` if y is the absolute minimum
     * - `(x, y, z) cross (0, 0, 1) == (y, -x, 0)` if z is the absolute minimum
     */
    public perpAny(): Vector3 {
        const absX = Math.abs(this.x);
        const absY = Math.abs(this.y);
        const absZ = Math.abs(this.z);

        // Use the two biggest absolute values
        if (absX <= absY) {
            if (absX <= absZ) {
                // `(x, y, z) cross (1, 0, 0) == (0, z, -y)`
                return new Vector3(0, this.z, -this.y);
            } else {
                // `(x, y, z) cross (0, 0, 1) == (y, -x, 0)`
                return new Vector3(this.y, -this.x, 0);
            }
        } else {
            if (absY <= absZ) {
                // `(x, y, z) cross (0, 1, 0) == (-z, 0, x)`
                return new Vector3(-this.z, 0, this.x);
            } else {
                // `(x, y, z) cross (0, 0, 1) == (y, -x, 0)`
                return new Vector3(this.y, -this.x, 0);
            }
        }
    }

    public round(): Vector3 {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const z = Math.round(this.z);

        return new Vector3(x, y, z);
    }

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public roundToPrecision(k: number): Vector3 {
        const x = roundToPrecision(this.x, k);
        const y = roundToPrecision(this.y, k);
        const z = roundToPrecision(this.z, k);

        return new Vector3(x, y, z);
    }

    public set(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public setAdd(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        this.x = v1.x + v2.x;
        this.y = v1.y + v2.y;
        this.z = v1.z + v2.z;
    }

    public setAddMulS(v1: ReadonlyVector3, s: number, v2: ReadonlyVector3): void {
        this.x = v1.x + s * v2.x;
        this.y = v1.y + s * v2.y;
        this.z = v1.z + s * v2.z;
    }

    public setAddS(v: ReadonlyVector3, s: number): void {
        this.x = v.x + s;
        this.y = v.y + s;
        this.z = v.z + s;
    }

    public setCross(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        const vx = v1.y * v2.z - v1.z * v2.y;
        const vy = v1.z * v2.x - v1.x * v2.z;
        const vz = v1.x * v2.y - v1.y * v2.x;

        this.set(vx, vy, vz);
    }

    public setDiv(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        this.x = v1.x / v2.x;
        this.y = v1.y / v2.y;
        this.z = v1.z / v2.z;
    }

    public setDivS(v: ReadonlyVector3, s: number): void {
        this.x = v.x / s;
        this.y = v.y / s;
        this.z = v.z / s;
    }

    public setFrom(v: ReadonlyVector3): void {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    public setMul(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        this.x = v1.x * v2.x;
        this.y = v1.y * v2.y;
        this.z = v1.z * v2.z;
    }

    public setMulS(s: number, v: ReadonlyVector3): void {
        this.x = s * v.x;
        this.y = s * v.y;
        this.z = s * v.z;
    }

    public setSub(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        this.x = v1.x - v2.x;
        this.y = v1.y - v2.y;
        this.z = v1.z - v2.z;
    }

    public setSubS(v: ReadonlyVector3, s: number): void {
        this.x = v.x - s;
        this.y = v.y - s;
        this.z = v.z - s;
    }

    public setUnit(v: ReadonlyVector3): void {
        const s = v.length();
        this.x = v.x / s;
        this.y = v.y / s;
        this.z = v.z / s;
    }

    /**
     * Returns the spherical linear interpolation of the current vector and `v`.
     */
    public slerp(v: ReadonlyVector3, t: number): Vector3 {
        const dot = this.dot(v);
        const sqrt = Math.sqrt(this.lengthSq() * v.lengthSq());

        if (sqrt <= dot) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(v, t);
        }

        const angle = Math.acos(dot / sqrt);
        const sin1 = Math.sin(angle - angle * t);
        const sin2 = Math.sin(angle * t);
        const sin3 = Math.sin(angle);

        const s1 = sin1 / sin3;
        const s2 = sin2 / sin3;

        const x = s1 * this.x + s2 * v.x;
        const y = s1 * this.y + s2 * v.y;
        const z = s1 * this.z + s2 * v.z;

        return new Vector3(x, y, z);
    }

    /**
     * Returns the difference of the current vector and a vector `v`.
     */
    public sub(v: ReadonlyVector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    /**
     * Returns the difference of the current vector and a scalar `s`.
     */
    public subS(s: number): Vector3 {
        return new Vector3(this.x - s, this.y - s, this.z - s);
    }

    public toArray(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    public toString(): string {
        return "{x: " + this.x + ", y: " + this.y + ", z: " + this.z + "}";
    }

    public unit(): Vector3 {
        return this.divS(this.length());
    }

    public unitOrZero(): Vector3 {
        const s = this.length();

        if (s === 0) {
            return Vector3.createZero();
        }

        return this.divS(s);
    }

    public xy(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public xz(): Vector2 {
        return new Vector2(this.x, this.z);
    }
}

export class Vector4 implements ReadonlyVector4 {
    public static readonly ONE: ReadonlyVector4 = Vector4.createOne();
    public static readonly UNIT_W: ReadonlyVector4 = Vector4.createUnitW();
    public static readonly UNIT_X: ReadonlyVector4 = Vector4.createUnitX();
    public static readonly UNIT_Y: ReadonlyVector4 = Vector4.createUnitY();
    public static readonly UNIT_Z: ReadonlyVector4 = Vector4.createUnitZ();
    public static readonly ZERO: ReadonlyVector4 = Vector4.createZero();

    public w: number;
    public x: number;
    public y: number;
    public z: number;

    public constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Returns the vector `(1, 1, 1, 1)`.
     */
    public static createOne(): Vector4 {
        return new Vector4(1, 1, 1, 1);
    }

    /**
     * Returns the unit vector in the direction of the z-axis.
     */
    public static createUnitW(): Vector4 {
        return new Vector4(0, 0, 0, 1);
    }

    /**
     * Returns the unit vector in the direction of the x-axis.
     */
    public static createUnitX(): Vector4 {
        return new Vector4(1, 0, 0, 0);
    }

    /**
     * Returns the unit vector in the direction of the y-axis.
     */
    public static createUnitY(): Vector4 {
        return new Vector4(0, 1, 0, 0);
    }

    /**
     * Returns the unit vector in the direction of the z-axis.
     */
    public static createUnitZ(): Vector4 {
        return new Vector4(0, 0, 1, 0);
    }

    /**
     * Returns the vector `(0, 0, 0, 0)`.
     */
    public static createZero(): Vector4 {
        return new Vector4(0, 0, 0, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Vector4 {
        return new Vector4(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: Vector4Like): Vector4 {
        return new Vector4(obj.x, obj.y, obj.z, obj.w);
    }

    public static toObject(v: ReadonlyVector4): Vector4Like {
        return { x: v.x, y: v.y, z: v.z, w: v.w };
    }

    public abs(): Vector4 {
        const x = Math.abs(this.x);
        const y = Math.abs(this.y);
        const z = Math.abs(this.z);
        const w = Math.abs(this.w);
        return new Vector4(x, y, z, w);
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: ReadonlyVector4): Vector4 {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    /**
     * Returns the sum of the current vector and a vector `v` multiplied by a scalar `s`.
     */
    public addMulS(v: ReadonlyVector4, s: number): Vector4 {
        return new Vector4(this.x + s * v.x, this.y + s * v.y, this.z + s * v.z, this.w + s * v.w);
    }

    /**
     * Returns the sum of the current vector and a scalar `s`.
     */
    public addS(s: number): Vector4 {
        return new Vector4(this.x + s, this.y + s, this.z + s, this.w + s);
    }

    public ceil(): Vector4 {
        const x = Math.ceil(this.x);
        const y = Math.ceil(this.y);
        const z = Math.ceil(this.z);
        const w = Math.ceil(this.w);

        return new Vector4(x, y, z, w);
    }

    public clamp(vmin: ReadonlyVector4, vmax: ReadonlyVector4): Vector4 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        const z = clamp(this.z, vmin.z, vmax.z);
        const w = clamp(this.w, vmin.w, vmax.w);
        return new Vector4(x, y, z, w);
    }

    public clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    public distance(v: ReadonlyVector4): number {
        const d2 = this.distanceSq(v);
        return Math.sqrt(d2);
    }

    public distanceSq(v: ReadonlyVector4): number {
        const x = this.x - v.x;
        const y = this.y - v.y;
        const z = this.z - v.z;
        const w = this.w - v.w;
        return x * x + y * y + z * z + w * w;
    }

    /**
     * Returns the element-wise quotient of the current vector and a vector `v`.
     */
    public div(v: ReadonlyVector4): Vector4 {
        return new Vector4(this.x / v.x, this.y / v.y, this.z / v.z, this.w / v.w);
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     */
    public divS(s: number): Vector4 {
        return new Vector4(this.x / s, this.y / s, this.z / s, this.w / s);
    }

    public dot(v: ReadonlyVector4): number {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    public eq(v: ReadonlyVector4): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w;
    }

    public eqApproxAbs(v: ReadonlyVector4, eps: number): boolean {
        return (
            eqApproxAbs(this.x, v.x, eps) &&
            eqApproxAbs(this.y, v.y, eps) &&
            eqApproxAbs(this.z, v.z, eps) &&
            eqApproxAbs(this.w, v.w, eps)
        );
    }

    public eqApproxRel(v: ReadonlyVector4, eps: number): boolean {
        return (
            eqApproxRel(this.x, v.x, eps) &&
            eqApproxRel(this.y, v.y, eps) &&
            eqApproxRel(this.z, v.z, eps) &&
            eqApproxAbs(this.w, v.w, eps)
        );
    }

    public floor(): Vector4 {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y);
        const z = Math.floor(this.z);
        const w = Math.floor(this.w);

        return new Vector4(x, y, z, w);
    }

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z) && Number.isFinite(this.w);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1 && this.z === 1 && this.w === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0 && this.w === 0;
    }

    public length(): number {
        return Math.sqrt(this.lengthSq());
    }

    public lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    public lerp(v: ReadonlyVector4, t: number): Vector4 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        const w = lerp(this.w, v.w, t);
        return new Vector4(x, y, z, w);
    }

    public max(v: ReadonlyVector4): Vector4 {
        const x = Math.max(this.x, v.x);
        const y = Math.max(this.y, v.y);
        const z = Math.max(this.z, v.z);
        const w = Math.max(this.w, v.w);

        return new Vector4(x, y, z, w);
    }

    public min(v: ReadonlyVector4): Vector4 {
        const x = Math.min(this.x, v.x);
        const y = Math.min(this.y, v.y);
        const z = Math.min(this.z, v.z);
        const w = Math.min(this.w, v.w);

        return new Vector4(x, y, z, w);
    }

    /**
     * Returns the element-wise product of the current vector and a vector `v`.
     */
    public mul(v: ReadonlyVector4): Vector4 {
        return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
    }

    /**
     * Returns the product of the current vector and a scalar `s`.
     */
    public mulS(s: number): Vector4 {
        return new Vector4(s * this.x, s * this.y, s * this.z, s * this.w);
    }

    public neg(): Vector4 {
        return new Vector4(-this.x, -this.y, -this.z, -this.w);
    }

    /**
     * Returns the normalized linear interpolation of the current vector.
     */
    public nlerp(v: ReadonlyVector4, t: number): Vector4 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        const w = lerp(this.w, v.w, t);

        const len = Math.sqrt(x * x + y * y + z * z + w * w);

        if (len === 0) {
            return Vector4.createZero();
        }

        return new Vector4(x / len, y / len, z / len, w / len);
    }

    public round(): Vector4 {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const z = Math.round(this.z);
        const w = Math.round(this.w);

        return new Vector4(x, y, z, w);
    }

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public roundToPrecision(k: number): Vector4 {
        const x = roundToPrecision(this.x, k);
        const y = roundToPrecision(this.y, k);
        const z = roundToPrecision(this.z, k);
        const w = roundToPrecision(this.w, k);

        return new Vector4(x, y, z, w);
    }

    public set(x: number, y: number, z: number, w: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public setAdd(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        this.x = v1.x + v2.x;
        this.y = v1.y + v2.y;
        this.z = v1.z + v2.z;
        this.w = v1.w + v2.w;
    }

    public setAddMulS(v1: ReadonlyVector4, s: number, v2: ReadonlyVector4): void {
        this.x = v1.x + s * v2.x;
        this.y = v1.y + s * v2.y;
        this.z = v1.z + s * v2.z;
        this.w = v1.w + s * v2.w;
    }

    public setAddS(v: ReadonlyVector4, s: number): void {
        this.x = v.x + s;
        this.y = v.y + s;
        this.z = v.z + s;
        this.w = v.w + s;
    }

    public setDiv(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        this.x = v1.x / v2.x;
        this.y = v1.y / v2.y;
        this.z = v1.z / v2.z;
        this.w = v1.w / v2.w;
    }

    public setDivS(v: ReadonlyVector4, s: number): void {
        this.x = v.x / s;
        this.y = v.y / s;
        this.z = v.z / s;
        this.w = v.w / s;
    }

    public setFrom(v: ReadonlyVector4): void {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
    }

    public setMul(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        this.x = v1.x * v2.x;
        this.y = v1.y * v2.y;
        this.z = v1.z * v2.z;
        this.w = v1.w * v2.w;
    }

    public setMulS(s: number, v: ReadonlyVector4): void {
        this.x = s * v.x;
        this.y = s * v.y;
        this.z = s * v.z;
        this.w = s * v.w;
    }

    public setSub(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        this.x = v1.x - v2.x;
        this.y = v1.y - v2.y;
        this.z = v1.z - v2.z;
        this.w = v1.w - v2.w;
    }

    public setSubS(v: ReadonlyVector4, s: number): void {
        this.x = v.x - s;
        this.y = v.y - s;
        this.z = v.z - s;
        this.w = v.w - s;
    }

    public setUnit(v: ReadonlyVector4): void {
        const s = v.length();
        this.x = v.x / s;
        this.y = v.y / s;
        this.z = v.z / s;
        this.w = v.w / s;
    }

    public sub(v: ReadonlyVector4): Vector4 {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    /**
     * Returns the difference of the current vector and a scalar `s`.
     */
    public subS(s: number): Vector4 {
        return new Vector4(this.x - s, this.y - s, this.z - s, this.w - s);
    }

    public toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w];
    }

    public toString(): string {
        return "{x: " + this.x + ", y: " + this.y + ", z: " + this.z + ", w: " + this.w + "}";
    }

    public unit(): Vector4 {
        return this.divS(this.length());
    }

    public unitOrZero(): Vector4 {
        const s = this.length();

        if (s === 0) {
            return Vector4.createZero();
        }

        return this.divS(s);
    }

    public xy(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public xyz(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public xz(): Vector2 {
        return new Vector2(this.x, this.z);
    }
}
