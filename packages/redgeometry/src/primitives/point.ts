import { lerp, roundToPrecision } from "../utility/scalar.js";
import { Vector2, Vector3 } from "./vector.js";

export interface Point2Like {
    x: number;
    y: number;
}

export interface Point3Like {
    x: number;
    y: number;
    z: number;
}

export class Point2 implements Point2Like {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the point `(0, 0)`.
     */
    public static createZero(): Point2 {
        return new Point2(0, 0);
    }

    public static fromArray(data: number[], offset = 0): Point2 {
        return new Point2(data[offset], data[offset + 1]);
    }

    public static fromObject(obj: Point2Like): Point2 {
        return new Point2(obj.x, obj.y);
    }

    public static fromXYW(x: number, y: number, w: number): Point2 {
        return new Point2(x / w, y / w);
    }

    /**
     * Returns whether `p` is inside the triangle `p0`, `p1` and `p2`.
     *
     * References:
     * - *Triangle Interior*.
     *   https://mathworld.wolfram.com/TriangleInterior.html
     */
    public static isPointInTriangle(p0: Point2, p1: Point2, p2: Point2, p: Point2): boolean {
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

    public static roundToPrecision(p: Point2, k: number): Point2 {
        // `k` denotes the reciprocal of the minimum interval that the rounded number is able to represent
        const x = roundToPrecision(p.x, k);
        const y = roundToPrecision(p.y, k);
        return new Point2(x, y);
    }

    public static signedArea(p0: Point2, p1: Point2, p: Point2): number {
        // `result < 0` -> `p` is below `(p0, p1)`
        // `result > 0` -> `p` is above `(p0, p1)`
        const v1 = p1.sub(p0);
        const v2 = p.sub(p0);
        return v1.cross(v2);
    }

    public static toObject(p: Point2): Point2Like {
        return { x: p.x, y: p.y };
    }

    /**
     * Returns the sum of the current point and a vector `v` scaled by `f`.
     */
    public addMulV(v: Vector2, f: number): Point2 {
        const x = this.x + f * v.x;
        const y = this.y + f * v.y;
        return new Point2(x, y);
    }

    /**
     * Returns the sum of the current point and a vector `v`.
     */
    public addV(v: Vector2): Point2 {
        return new Point2(this.x + v.x, this.y + v.y);
    }

    public clone(): Point2 {
        return new Point2(this.x, this.y);
    }

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
    }

    public distanceTo(p: Point2): number {
        const x = this.x - p.x;
        const y = this.y - p.y;
        return Math.sqrt(x * x + y * y);
    }

    public eq(p: Point2): boolean {
        return this.x === p.x && this.y === p.y;
    }

    public gt(p: Point2): boolean {
        return this.x === p.x ? this.y > p.y : this.x > p.x;
    }

    public gte(p: Point2): boolean {
        return this.x === p.x ? this.y >= p.y : this.x > p.x;
    }

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0;
    }

    public lerp(p: Point2, t: number): Point2 {
        const x = lerp(this.x, p.x, t);
        const y = lerp(this.y, p.y, t);
        return new Point2(x, y);
    }

    public lt(p: Point2): boolean {
        return this.x === p.x ? this.y < p.y : this.x < p.x;
    }

    public lte(p: Point2): boolean {
        return this.x === p.x ? this.y <= p.y : this.x < p.x;
    }

    public sub(p: Point2): Vector2 {
        return new Vector2(this.x - p.x, this.y - p.y);
    }

    /**
     * Returns the difference of the current point and a vector `v`.
     */
    public subV(v: Vector2): Point2 {
        return new Point2(this.x - v.x, this.y - v.y);
    }

    public toArray(): [number, number] {
        return [this.x, this.y];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}}`;
    }

    public toVector(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}

export class Point3 implements Point3Like {
    public x: number;
    public y: number;
    public z: number;

    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Returns the point `(0, 0, 0)`.
     */
    public static createZero(): Point3 {
        return new Point3(0, 0, 0);
    }

    public static fromArray(data: number[], offset = 0): Point3 {
        return new Point3(data[offset], data[offset + 1], data[offset + 2]);
    }

    public static fromObject(obj: Point3Like): Point3 {
        return new Point3(obj.x, obj.y, obj.z);
    }

    public static fromXYW(x: number, y: number, w: number): Point3 {
        return new Point3(w * x, w * y, w);
    }

    public static fromXYZW(x: number, y: number, z: number, w: number): Point3 {
        return new Point3(x / w, y / w, z / w);
    }

    public static roundToPrecision(p: Point3, k: number): Point3 {
        // `k` denotes the reciprocal of the minimum interval that the rounded number is able to represent
        const x = roundToPrecision(p.x, k);
        const y = roundToPrecision(p.y, k);
        const z = roundToPrecision(p.z, k);
        return new Point3(x, y, z);
    }

    public static toObject(p: Point3): Point3Like {
        return { x: p.x, y: p.y, z: p.z };
    }

    /**
     * Returns the sum of the current point and a vector `v` scaled by `f`.
     */
    public addMulV(v: Vector3, f: number): Point3 {
        const x = this.x + f * v.x;
        const y = this.y + f * v.y;
        const z = this.z + f * v.z;
        return new Point3(x, y, z);
    }

    /**
     * Returns the sum of the current point and a vector `v`.
     */
    public addV(v: Vector3): Point3 {
        return new Point3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    public clone(): Point3 {
        return new Point3(this.x, this.y, this.z);
    }

    public copyTo(data: number[], offset = 0): void {
        data[offset] = this.x;
        data[offset + 1] = this.y;
        data[offset + 2] = this.z;
    }

    public distanceTo(p: Point3): number {
        const x = this.x - p.x;
        const y = this.y - p.y;
        const z = this.z - p.z;
        return Math.sqrt(x * x + y * y + z * z);
    }

    public eq(p: Point3): boolean {
        return this.x === p.x && this.y === p.y && this.z === p.z;
    }

    public isFinite(): boolean {
        return Number.isFinite(this.x) && Number.isFinite(this.y) && Number.isFinite(this.z);
    }

    public isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    public lerp(p: Point3, t: number): Point3 {
        const x = lerp(this.x, p.x, t);
        const y = lerp(this.y, p.y, t);
        const z = lerp(this.z, p.z, t);
        return new Point3(x, y, z);
    }

    public sub(v: Point3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    /**
     * Returns the difference of the current point and a vector `v`.
     */
    public subV(v: Vector3): Point3 {
        return new Point3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    public toArray(): [number, number, number] {
        return [this.x, this.y, this.z];
    }

    public toString(): string {
        return `{x: ${this.x}, y: ${this.y}, z: ${this.z}}`;
    }

    public toVector(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }
}
