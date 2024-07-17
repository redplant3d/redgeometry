import { clamp, lerp } from "../utility/scalar.js";
import { Point2, Point3 } from "./point.js";

export interface Vector2Like {
    x: number;
    y: number;
}

export interface Vector3Like {
    x: number;
    y: number;
    z: number;
}

export interface Vector4Like {
    w: number;
    x: number;
    y: number;
    z: number;
}

export class Vector2 implements Vector2Like {
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

    public static fromArray(data: number[], offset = 0): Vector2 {
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
    public static isBetweenCcw(v: Vector2, v1: Vector2, v2: Vector2): boolean {
        if (v1.cross(v2) > 0) {
            // `v2` is clockwise to `v1`
            return v1.cross(v) > 0 && v2.cross(v) < 0;
        } else {
            // `v1` is clockwise to `v2`
            return v1.cross(v) > 0 || v2.cross(v) < 0;
        }
    }

    public static toObject(v: Vector2): Vector2Like {
        return { x: v.x, y: v.y };
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /**
     * Returns the sum of the current vector and a vector `v` scaled by `f`.
     */
    public addMul(v: Vector2, f: number): Vector2 {
        const x = this.x + f * v.x;
        const y = this.y + f * v.y;
        return new Vector2(x, y);
    }

    /**
     * Adds the current vector to a point `p`.
     */
    public addPt(p: Point2): Point2 {
        return new Point2(p.x + this.x, p.y + this.y);
    }

    /**
     * Returns the angle of the vector from polar coordinates.
     */
    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public clamp(vmin: Vector2, vmax: Vector2): Vector2 {
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
     * Returns the cross product of the current vector and `v` as a scalar value.
     *
     * The 2D cross product is defined by z-value of the 3D cross product: \
     * `(x1, y1, 0) cross (x2, y2, 0) == (0, 0, x1 * y2 - y1 * x2)`
     *
     * Identity relating to the dot product: `v1 cross v2 === v1 dot normal(v2)`
     */
    public cross(v: Vector2): number {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Divides the current vector by `d`.
     *
     * Note: Each element is divided separately.
     */
    public div(d: number): Vector2 {
        return new Vector2(this.x / d, this.y / d);
    }

    /**
     * Returns the dot product of the current vector and `v` as a scalar value: \
     * `(x1, y1) dot (x2, y2) == x1 * x2 + y1 * y2`
     *
     * Identity relating to the cross product: `v1 dot v2 === normal(v1) cross v2`
     */
    public dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    public eq(v: Vector2): boolean {
        return this.x === v.x && this.y === v.y;
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

    public lerp(v: Vector2, t: number): Vector2 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        return new Vector2(x, y);
    }

    /**
     * Multiplies the current vector by `f`.
     */
    public mul(f: number): Vector2 {
        return new Vector2(f * this.x, f * this.y);
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

    public sub(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    public toArray(): [number, number] {
        return [this.x, this.y];
    }

    public toPoint(): Point2 {
        return new Point2(this.x, this.y);
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}}`;
    }

    public unit(): Vector2 {
        return this.div(this.len());
    }

    public unitOrZero(): Vector2 {
        const len = this.len();
        return len > 0 ? this.div(len) : Vector2.createZero();
    }
}

export class Vector3 implements Vector3Like {
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

    public static fromArray(data: number[], offset = 0): Vector3 {
        return new Vector3(data[offset], data[offset + 1], data[offset + 2]);
    }

    public static fromObject(obj: Vector3Like): Vector3 {
        return new Vector3(obj.x, obj.y, obj.z);
    }

    public static fromXY(x: number, y: number): Vector3 {
        return new Vector3(x, y, 1);
    }

    public static fromXYZW(x: number, y: number, z: number, w: number): Vector3 {
        return new Vector3(x / w, y / w, z / w);
    }

    public static toObject(v: Vector3): Vector3Like {
        return { x: v.x, y: v.y, z: v.z };
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    /**
     * Returns the sum of the current vector and a vector `v` scaled by `f`.
     */
    public addMul(v: Vector3, f: number): Vector3 {
        const x = this.x + f * v.x;
        const y = this.y + f * v.y;
        const z = this.z + f * v.z;
        return new Vector3(x, y, z);
    }

    /**
     * Adds the current vector to a point `p`.
     */
    public addPt(p: Point3): Point3 {
        return new Point3(p.x + this.x, p.y + this.y, p.z + this.z);
    }

    public clamp(vmin: Vector3, vmax: Vector3): Vector3 {
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

    public cross(v: Vector3): Vector3 {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new Vector3(x, y, z);
    }

    /**
     * Divides the current vector by `d`.
     *
     * Note: Each element is divided separately.
     */
    public div(d: number): Vector3 {
        return new Vector3(this.x / d, this.y / d, this.z / d);
    }

    public dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    public eq(v: Vector3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
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

    public lerp(v: Vector3, t: number): Vector3 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        return new Vector3(x, y, z);
    }

    public mul(f: number): Vector3 {
        return new Vector3(f * this.x, f * this.y, f * this.z);
    }

    public neg(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    /**
     * Returns a non-zero normal vector.
     */
    public normalAny(): Vector3 {
        if (this.x !== 0) {
            return this.normalY();
        } else if (this.y !== 0) {
            return this.normalZ();
        } else {
            return this.normalX();
        }
    }

    /**
     * Returns the normal vector around the x-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (1, 0, 0) == (0, z, -y)`
     */
    public normalX(): Vector3 {
        return new Vector3(0, this.z, -this.y);
    }

    /**
     * Returns the normal vector around the y-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 1, 0) == (-z, 0, x)`
     */
    public normalY(): Vector3 {
        return new Vector3(-this.z, 0, this.x);
    }

    /**
     * Returns the normal vector around the z-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 0, 1) == (y, -x, 0)`
     */
    public normalZ(): Vector3 {
        return new Vector3(this.y, -this.x, 0);
    }

    public sub(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    public toArray(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    public toPoint(): Point3 {
        return new Point3(this.x, this.y, this.z);
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}`;
    }

    public unit(): Vector3 {
        return this.div(this.len());
    }

    public unitOrZero(): Vector3 {
        const len = this.len();
        return len > 0 ? this.div(len) : Vector3.createZero();
    }
}

export class Vector4 implements Vector4Like {
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

    public static fromArray(data: number[], offset = 0): Vector4 {
        return new Vector4(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: Vector4Like): Vector4 {
        return new Vector4(obj.x, obj.y, obj.z, obj.w);
    }

    public static fromXYZ(x: number, y: number, z: number): Vector4 {
        return new Vector4(x, y, z, 1);
    }

    public static toObject(v: Vector4): Vector4Like {
        return { x: v.x, y: v.y, z: v.z, w: v.w };
    }

    /**
     * Returns the sum of the current vector and a vector `v`.
     */
    public add(v: Vector4): Vector4 {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    /**
     * Returns the sum of the current vector and a vector `v` scaled by `f`.
     */
    public addMul(v: Vector4, f: number): Vector4 {
        const x = this.x + f * v.x;
        const y = this.y + f * v.y;
        const z = this.z + f * v.z;
        const w = this.w + f * v.w;
        return new Vector4(x, y, z, w);
    }

    public clamp(vmin: Vector4, vmax: Vector4): Vector4 {
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
     * Divides the current vector by `d`.
     *
     * Note: Each element is divided separately.
     */
    public div(d: number): Vector4 {
        return new Vector4(this.x / d, this.y / d, this.z / d, this.w / d);
    }

    public dot(v: Vector4): number {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    public eq(v: Vector4): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w;
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

    public lerp(v: Vector4, t: number): Vector4 {
        const x = lerp(this.x, v.x, t);
        const y = lerp(this.y, v.y, t);
        const z = lerp(this.z, v.z, t);
        const w = lerp(this.w, v.w, t);
        return new Vector4(x, y, z, w);
    }

    public mul(f: number): Vector4 {
        return new Vector4(f * this.x, f * this.y, f * this.z, f * this.w);
    }

    public neg(): Vector4 {
        return new Vector4(-this.x, -this.y, -this.z, -this.w);
    }

    public sub(v: Vector4): Vector4 {
        return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    public toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}, w: ${this.w}}`;
    }
}
