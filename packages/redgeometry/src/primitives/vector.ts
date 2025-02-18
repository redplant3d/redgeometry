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
    angle(): number;
    angleTo(v: ReadonlyVector2): number;
    clamp(vmin: ReadonlyVector2, vmax: ReadonlyVector2): Vector2;
    clone(): Vector2;
    copyTo(data: number[], offset?: number): void;
    cross(v: ReadonlyVector2): number;
    distanceTo(p: ReadonlyVector2): number;
    divS(s: number): Vector2;
    dot(v: ReadonlyVector2): number;
    eq(v: ReadonlyVector2): boolean;
    eqApproxAbs(v: ReadonlyVector2, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector2, eps: number): boolean;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    len(): number;
    lenSq(): number;
    lerp(v: ReadonlyVector2, t: number): Vector2;
    mulS(s: number): Vector2;
    neg(): Vector2;
    normal(): Vector2;
    slerp(v: ReadonlyVector2, t: number): Vector2;
    sub(v: ReadonlyVector2): Vector2;
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
    angleTo(v: ReadonlyVector3): number;
    clamp(vmin: ReadonlyVector3, vmax: ReadonlyVector3): Vector3;
    clone(): Vector3;
    copyTo(data: number[], number?: number): void;
    cross(v: ReadonlyVector3): Vector3;
    distanceTo(p: ReadonlyVector3): number;
    divS(s: number): Vector3;
    dot(v: ReadonlyVector3): number;
    eq(v: ReadonlyVector3): boolean;
    eqApproxAbs(v: ReadonlyVector3, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector3, eps: number): boolean;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    len(): number;
    lenSq(): number;
    lerp(v: ReadonlyVector3, t: number): Vector3;
    mulS(s: number): Vector3;
    neg(): Vector3;
    normalAround(v: ReadonlyVector3): Vector3;
    normalAroundAny(): Vector3;
    normalAroundX(): Vector3;
    normalAroundY(): Vector3;
    normalAroundZ(): Vector3;
    orthonormalBasis(): { n1: Vector3; n2: Vector3 };
    slerp(v: ReadonlyVector3, t: number): Vector3;
    sub(v: ReadonlyVector3): Vector3;
    toArray(): [number, number, number];
    toString(): string;
    unit(): Vector3;
    unitOrZero(): Vector3;
}

export interface ReadonlyVector4 {
    readonly w: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;

    abs(): Vector4;
    add(v: ReadonlyVector4): Vector4;
    addMulS(v: ReadonlyVector4, s: number): Vector4;
    clamp(vmin: ReadonlyVector4, vmax: ReadonlyVector4): Vector4;
    clone(): Vector4;
    copyTo(data: number[], offset?: number): void;
    divS(s: number): Vector4;
    dot(v: ReadonlyVector4): number;
    eq(v: ReadonlyVector4): boolean;
    eqApproxAbs(v: ReadonlyVector4, eps: number): boolean;
    eqApproxRel(v: ReadonlyVector4, eps: number): boolean;
    isFinite(): boolean;
    isOne(): boolean;
    isZero(): boolean;
    len(): number;
    lenSq(): number;
    lerp(v: ReadonlyVector4, t: number): Vector4;
    mulS(s: number): Vector4;
    neg(): Vector4;
    sub(v: ReadonlyVector4): Vector4;
    toArray(): [number, number, number, number];
    toString(): string;
    unit(): Vector4;
    unitOrZero(): Vector4;
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

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public static roundToPrecision(v: ReadonlyVector2, k: number): Vector2 {
        const x = roundToPrecision(v.x, k);
        const y = roundToPrecision(v.y, k);
        return new Vector2(x, y);
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
     * Returns the angle of the vector from polar coordinates in radians.
     */
    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Returns the angle between the current vector and `v` in radians.
     *
     * Note: The returned value is unsigned and less than `PI`.
     */
    public angleTo(v: ReadonlyVector2): number {
        const dot = this.dot(v);
        const lenSq2 = this.lenSq() * v.lenSq();

        if (dot * dot >= lenSq2) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        const cos = dot / Math.sqrt(lenSq2);

        return Math.acos(cos);
    }

    public clamp(vmin: ReadonlyVector2, vmax: ReadonlyVector2): Vector2 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        return new Vector2(x, y);
    }

    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
    }

    /**
     * Returns the 2D cross product of the current vector and `v` as a scalar value.
     *
     * The 2D cross product is defined by the magnitude of the 3D cross product: \
     * `(x1, y1, 0) cross (x2, y2, 0) == (0, 0, x1 * y2 - y1 * x2)`
     *
     * Identity relating to the dot product: `v1 cross v2 === v1 dot normal(v2)`
     */
    public cross(v: ReadonlyVector2): number {
        return this.x * v.y - this.y * v.x;
    }

    public distanceTo(p: ReadonlyVector2): number {
        const x = this.x - p.x;
        const y = this.y - p.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     *
     * Note: Each element is divided separately.
     */
    public divS(s: number): Vector2 {
        return new Vector2(this.x / s, this.y / s);
    }

    /**
     * Returns the dot product of the current vector and `v` as a scalar value: \
     * `(x1, y1) dot (x2, y2) == x1 * x2 + y1 * y2`
     *
     * Identity relating to the cross product: `v1 dot v2 === normal(v1) cross v2`
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

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    public lenSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    public lerp(v: ReadonlyVector2, t: number): Vector2 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        return new Vector2(x, y);
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
     * Returns the normal vector.
     *
     * The normal is defined by the 3D cross product: \
     * `(x, y, 0) cross (0, 0, 1) == (y, -x, 0)`
     */
    public normal(): Vector2 {
        return new Vector2(this.y, -this.x);
    }

    public set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    public setAdd(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        const vx = v1.x + v2.x;
        const vy = v1.y + v2.y;
        this.set(vx, vy);
    }

    public setAddMulS(v1: ReadonlyVector2, s: number, v2: ReadonlyVector2): void {
        const vx = v1.x + s * v2.x;
        const vy = v1.y + s * v2.y;
        this.set(vx, vy);
    }

    public setDivS(v: ReadonlyVector2, s: number): void {
        const vx = v.x / s;
        const vy = v.y / s;
        this.set(vx, vy);
    }

    public setMulS(s: number, v: ReadonlyVector2): void {
        const vx = s * v.x;
        const vy = s * v.y;
        this.set(vx, vy);
    }

    public setSub(v1: ReadonlyVector2, v2: ReadonlyVector2): void {
        const vx = v1.x - v2.x;
        const vy = v1.y - v2.y;
        this.set(vx, vy);
    }

    /**
     * Returns the spherical linear interpolation of the current vector and `v`.
     */
    public slerp(v: ReadonlyVector2, t: number): Vector2 {
        const dot = this.dot(v);
        const lenSq2 = this.lenSq() * v.lenSq();

        if (dot * dot >= lenSq2) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(v, t);
        }

        const cos = dot / Math.sqrt(lenSq2);
        const angle = Math.acos(cos);
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

    public toArray(): [number, number] {
        return [this.x, this.y];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}}`;
    }

    public unit(): Vector2 {
        const s = this.len();
        return this.divS(s);
    }

    public unitOrZero(): Vector2 {
        const s = this.len();

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

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public static roundToPrecision(v: ReadonlyVector3, k: number): Vector3 {
        const x = roundToPrecision(v.x, k);
        const y = roundToPrecision(v.y, k);
        const z = roundToPrecision(v.z, k);
        return new Vector3(x, y, z);
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
     * Returns the angle between the current vector and `v` in radians.
     *
     * Note: The returned value is unsigned and less than `PI`.
     */
    public angleTo(v: ReadonlyVector3): number {
        const dot = this.dot(v);
        const lenSq2 = this.lenSq() * v.lenSq();

        if (dot * dot >= lenSq2) {
            // Angle either undefined, very close or equal to zero
            return 0;
        }

        const cos = dot / Math.sqrt(lenSq2);

        return Math.acos(cos);
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

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
        data[offset + 2] = this.z;
    }

    public cross(v: ReadonlyVector3): Vector3 {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new Vector3(x, y, z);
    }

    public distanceTo(p: ReadonlyVector3): number {
        const x = this.x - p.x;
        const y = this.y - p.y;
        const z = this.z - p.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     *
     * Note: Each element is divided separately.
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

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1 && this.z === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    public lenSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    public lerp(v: ReadonlyVector3, t: number): Vector3 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        return new Vector3(x, y, z);
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

    public normalAround(v: ReadonlyVector3): Vector3 {
        return this.cross(v);
    }

    /**
     * Returns the normal vector around the most appropriate axis.
     */
    public normalAroundAny(): Vector3 {
        const absX = Math.abs(this.x);
        const absY = Math.abs(this.y);
        const absZ = Math.abs(this.z);

        // Use the two biggest absolute values
        if (absX <= absY) {
            return absX <= absZ ? this.normalAroundX() : this.normalAroundZ();
        } else {
            return absY <= absZ ? this.normalAroundY() : this.normalAroundZ();
        }
    }

    /**
     * Returns the normal vector around the x-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (1, 0, 0) == (0, z, -y)`
     *
     * Note: Might return a zero vector.
     */
    public normalAroundX(): Vector3 {
        return new Vector3(0, this.z, -this.y);
    }

    /**
     * Returns the normal vector around the y-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 1, 0) == (-z, 0, x)`
     *
     * Note: Might return a zero vector.
     */
    public normalAroundY(): Vector3 {
        return new Vector3(-this.z, 0, this.x);
    }

    /**
     * Returns the normal vector around the z-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 0, 1) == (y, -x, 0)`
     *
     * Note: Might return a zero vector.
     */
    public normalAroundZ(): Vector3 {
        return new Vector3(this.y, -this.x, 0);
    }

    /**
     * Returns the orthonormal basis of the current (unit) vector.
     *
     * References:
     * - Tom Duff, James Burgess, Per Christensen, Christophe Hery, Andrew Kensler, Max Liani and Ryusuke Villemin.
     *   *Building an Orthonormal Basis, Revisited*.
     *   Journal of Computer Graphics Techniques Vol. 6, No. 1, 2017.
     */
    public orthonormalBasis(): { n1: Vector3; n2: Vector3 } {
        const { x, y, z } = this;

        // This implementation will only work for unit vectors.
        const sign = z >= 0 ? 1 : -1;
        const a = -1 / (sign + z);
        const b = x * y * a;
        const n1 = new Vector3(1 + sign * x * x * a, sign * b, -sign * x);
        const n2 = new Vector3(b, sign + y * y * a, -y);

        return { n1, n2 };
    }

    public set(x: number, y: number, z: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public setAdd(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        const vx = v1.x + v2.x;
        const vy = v1.y + v2.y;
        const vz = v1.z + v2.z;
        this.set(vx, vy, vz);
    }

    public setAddMulS(v1: ReadonlyVector3, s: number, v2: ReadonlyVector3): void {
        const vx = v1.x + s * v2.x;
        const vy = v1.y + s * v2.y;
        const vz = v1.z + s * v2.z;
        this.set(vx, vy, vz);
    }

    public setCross(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        const vx = v1.y * v2.z - v1.z * v2.y;
        const vy = v1.z * v2.x - v1.x * v2.z;
        const vz = v1.x * v2.y - v1.y * v2.x;
        this.set(vx, vy, vz);
    }

    public setDivS(v: ReadonlyVector3, s: number): void {
        const vx = v.x / s;
        const vy = v.y / s;
        const vz = v.z / s;
        this.set(vx, vy, vz);
    }

    public setMulS(s: number, v: ReadonlyVector3): void {
        const vx = s * v.x;
        const vy = s * v.y;
        const vz = s * v.z;
        this.set(vx, vy, vz);
    }

    public setSub(v1: ReadonlyVector3, v2: ReadonlyVector3): void {
        const vx = v1.x - v2.x;
        const vy = v1.y - v2.y;
        const vz = v1.z - v2.z;
        this.set(vx, vy, vz);
    }

    /**
     * Returns the spherical linear interpolation of the current vector and `v`.
     */
    public slerp(v: ReadonlyVector3, t: number): Vector3 {
        const dot = this.dot(v);
        const lenSq2 = this.lenSq() * v.lenSq();

        if (dot * dot >= lenSq2) {
            // Fallback (angle either undefined, very close or equal to zero)
            return this.lerp(v, t);
        }

        const cos = dot / Math.sqrt(lenSq2);
        const angle = Math.acos(cos);
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

    public toArray(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}`;
    }

    public unit(): Vector3 {
        const s = this.len();
        return this.divS(s);
    }

    public unitOrZero(): Vector3 {
        const s = this.len();

        if (s === 0) {
            return Vector3.createZero();
        }

        return this.divS(s);
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

    /**
     * Returns a rounded vector from `v` with specified precision where `k` denotes the
     * reciprocal of the minimum interval that the rounded number is able to represent
     */
    public static roundToPrecision(v: ReadonlyVector4, k: number): Vector4 {
        const x = roundToPrecision(v.x, k);
        const y = roundToPrecision(v.y, k);
        const z = roundToPrecision(v.z, k);
        const w = roundToPrecision(v.w, k);
        return new Vector4(x, y, z, w);
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

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
        data[offset + 2] = this.z;
        data[offset + 3] = this.w;
    }

    /**
     * Returns the quotient of the current vector and a scalar `s`.
     *
     * Note: Each element is divided separately.
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

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z) && Number.isFinite(this.w);
    }

    public isOne(): boolean {
        return this.x === 1 && this.y === 1 && this.z === 1 && this.w === 1;
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0 && this.w === 0;
    }

    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    public lenSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    public lerp(v: ReadonlyVector4, t: number): Vector4 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        const w = lerp(this.w, v.w, t);
        return new Vector4(x, y, z, w);
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

    public set(x: number, y: number, z: number, w: number): void {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public setAdd(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        const vx = v1.x + v2.x;
        const vy = v1.y + v2.y;
        const vz = v1.z + v2.z;
        const vw = v1.w + v2.w;
        this.set(vx, vy, vz, vw);
    }

    public setAddMulS(v1: ReadonlyVector4, s: number, v2: ReadonlyVector4): void {
        const vx = v1.x + s * v2.x;
        const vy = v1.y + s * v2.y;
        const vz = v1.z + s * v2.z;
        const vw = v1.w + s * v2.w;
        this.set(vx, vy, vz, vw);
    }

    public setDivS(v: ReadonlyVector4, s: number): void {
        const vx = v.x / s;
        const vy = v.y / s;
        const vz = v.z / s;
        const vw = v.w / s;
        this.set(vx, vy, vz, vw);
    }

    public setMulS(s: number, v: ReadonlyVector4): void {
        const vx = s * v.x;
        const vy = s * v.y;
        const vz = s * v.z;
        const vw = s * v.w;
        this.set(vx, vy, vz, vw);
    }

    public setSub(v1: ReadonlyVector4, v2: ReadonlyVector4): void {
        const vx = v1.x - v2.x;
        const vy = v1.y - v2.y;
        const vz = v1.z - v2.z;
        const vw = v1.w - v2.w;
        this.set(vx, vy, vz, vw);
    }

    public sub(v: ReadonlyVector4): Vector4 {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    public toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}, w: ${this.w}}`;
    }

    public unit(): Vector4 {
        const s = this.len();
        return this.divS(s);
    }

    public unitOrZero(): Vector4 {
        const s = this.len();

        if (s === 0) {
            return Vector4.createZero();
        }

        return this.divS(s);
    }
}
