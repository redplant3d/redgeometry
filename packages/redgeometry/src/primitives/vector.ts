import { clamp } from "../utility";
import { Point2, Point3 } from "./point";

export class Vector2 {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the vector `(1, 1)`.
     */
    public static get one(): Vector2 {
        return new Vector2(1, 1);
    }

    /**
     * Returns the unit vector in the direction of the x-axis.
     */
    public static get unitX(): Vector2 {
        return new Vector2(1, 0);
    }

    /**
     * Returns the unit vector in the direction of the y-axis.
     */
    public static get unitY(): Vector2 {
        return new Vector2(0, 1);
    }

    /**
     * Returns the vector `(0, 0)`.
     */
    public static get zero(): Vector2 {
        return new Vector2(0, 0);
    }

    /**
     * Returns the angle of the vector from polar coordinates.
     */
    public get angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public get length(): number {
        return Math.sqrt(this.lengthSq);
    }

    public get lengthSq(): number {
        return this.dot(this);
    }

    public get neg(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    /**
     * Returns the normal vector.
     *
     * The normal is defined by the 3D cross product: \
     * `(x, y, 0) cross (0, 0, 1) == (y, -x, 0)`
     */
    public get normal(): Vector2 {
        return new Vector2(this.y, -this.x);
    }

    public get unit(): Vector2 {
        return this.div(this.length);
    }

    public static fromArray(data: number[], offset = 0): Vector2 {
        return new Vector2(data[offset], data[offset + 1]);
    }

    public static fromObject(obj: { x: number; y: number }): Vector2 {
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
        return new Vector2(this.x + f * v.x, this.y + f * v.y);
    }

    /**
     * Adds the current vector to a point `p`.
     */
    public addPt(p: Point2): Point2 {
        return new Point2(p.x + this.x, p.y + this.y);
    }

    public clamp(vmin: Vector2, vmax: Vector2): Vector2 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        return new Vector2(x, y);
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

    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    /**
     * Multiplies the current vector by `f`.
     */
    public mul(f: number): Vector2 {
        return new Vector2(f * this.x, f * this.y);
    }

    public sub(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    public toArray(): number[] {
        return [this.x, this.y];
    }

    public toPoint(): Point2 {
        return new Point2(this.x, this.y);
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}}`;
    }
}

export class Vector3 {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Returns the vector `(1, 1, 1)`.
     */
    public static get one(): Vector3 {
        return new Vector3(1, 1, 1);
    }

    /**
     * Returns the unit vector in the direction of the x-axis.
     */
    public static get unitX(): Vector3 {
        return new Vector3(1, 0, 0);
    }

    /**
     * Returns the unit vector in the direction of the y-axis.
     */
    public static get unitY(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    /**
     * Returns the unit vector in the direction of the z-axis.
     */
    public static get unitZ(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    /**
     * Returns the vector `(0, 0, 0)`.
     */
    public static get zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    public get length(): number {
        return Math.sqrt(this.lengthSq);
    }

    public get lengthSq(): number {
        return this.dot(this);
    }

    public get neg(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    /**
     * Returns the normal vector around the x-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (1, 0, 0) == (0, z, -y)`
     */
    public get normalX(): Vector3 {
        return new Vector3(0, this.z, -this.y);
    }

    /**
     * Returns the normal vector around the y-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 1, 0) == (-z, 0, x)`
     */
    public get normalY(): Vector3 {
        return new Vector3(-this.z, 0, this.x);
    }

    /**
     * Returns the normal vector around the z-axis.
     *
     * The normal is defined by the cross product: \
     * `(x, y, z) cross (0, 0, 1) == (y, -x, 0)`
     */
    public get normalZ(): Vector3 {
        return new Vector3(this.y, -this.x, 0);
    }

    public get unit(): Vector3 {
        return this.div(this.length);
    }

    public static fromArray(data: number[], offset = 0): Vector3 {
        return new Vector3(data[offset], data[offset + 1], data[offset + 2]);
    }

    public static fromObject(obj: { x: number; y: number; z: number }): Vector3 {
        return new Vector3(obj.x, obj.y, obj.z);
    }

    public static fromXY(x: number, y: number): Vector3 {
        return new Vector3(x, y, 1);
    }

    public static fromXYW(x: number, y: number, w: number): Vector3 {
        return new Vector3(w * x, w * y, w);
    }

    public static fromXYZW(x: number, y: number, z: number, w: number): Vector3 {
        return new Vector3(x / w, y / w, z / w);
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
        return new Vector3(this.x + f * v.x, this.y + f * v.y, this.z + f * v.z);
    }

    public clamp(vmin: Vector3, vmax: Vector3): Vector3 {
        const x = clamp(this.x, vmin.x, vmax.x);
        const y = clamp(this.y, vmin.y, vmax.y);
        const z = clamp(this.z, vmin.z, vmax.z);
        return new Vector3(x, y, z);
    }

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
        data[offset + 2] = this.z;
    }

    public cross(v: Vector3): Vector3 {
        return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
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

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    public mul(f: number): Vector3 {
        return new Vector3(f * this.x, f * this.y, f * this.z);
    }

    public sub(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    public toArray(): number[] {
        return [this.x, this.y, this.z];
    }

    public toPoint(): Point3 {
        return new Point3(this.x, this.y, this.z);
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}`;
    }
}
