import { lerp } from "../utility/scalar.js";
import type { FixedSizeArray } from "../utility/types.js";
import { Complex, type ComplexLike, type ReadonlyComplex } from "./complex.js";
import type { ReadonlyMatrix3, ReadonlyMatrix3A, ReadonlyMatrix4, ReadonlyMatrix4A } from "./matrix.js";
import { Matrix3A, Matrix4A } from "./matrix.js";
import { Quaternion, type QuaternionLike, type ReadonlyQuaternion } from "./quaternion.js";
import type { ReadonlyRay2, ReadonlyRay3 } from "./ray.js";
import {
    Vector2,
    Vector3,
    type ReadonlyVector2,
    type ReadonlyVector3,
    type Vector2Like,
    type Vector3Like,
} from "./vector.js";

export type MinMaxBox2Like = {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
};

export type MinMaxBox3Like = {
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
};

export type AxisAlignedBox2Like = {
    readonly center: Vector2Like;
    readonly extents: Vector2Like;
};

export type AxisAlignedBox3Like = {
    readonly center: Vector3Like;
    readonly extents: Vector3Like;
};

export type OrientedBox2Like = {
    readonly center: Vector2Like;
    readonly extents: Vector2Like;
    readonly rotation: ComplexLike;
};

export type OrientedBox3Like = {
    readonly center: Vector3Like;
    readonly extents: Vector3Like;
    readonly rotation: QuaternionLike;
};

export interface ReadonlyMinMaxBox2 {
    readonly maxX: number;
    readonly maxY: number;
    readonly minX: number;
    readonly minY: number;

    center(): Vector2;
    clone(): MinMaxBox2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    extents(): Vector2;
    intersects(b: ReadonlyMinMaxBox2, eps: number): boolean;
    intersectsRay(ray: ReadonlyRay2): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(dx: number, dy: number): MinMaxBox2;
    scaleRel(fx: number, fy: number): MinMaxBox2;
    sizeX(): number;
    sizeY(): number;
    toArray(): [number, number, number, number];
    toAxisAlignedBox(): AxisAlignedBox2;
    toOrientedBox(): OrientedBox2;
    toString(): string;
    transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): MinMaxBox2;
}

export interface ReadonlyMinMaxBox3 {
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;

    center(): Vector3;
    clone(): MinMaxBox3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    extents(): Vector3;
    intersects(b: ReadonlyMinMaxBox3, eps: number): boolean;
    intersectsRay(ray: ReadonlyRay3): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(dx: number, dy: number, dz: number): MinMaxBox3;
    scaleRel(fx: number, fy: number, fz: number): MinMaxBox3;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toArray(): [number, number, number, number, number, number];
    toAxisAlignedBox(): AxisAlignedBox3;
    toOrientedBox(): OrientedBox3;
    toString(): string;
    transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): MinMaxBox3;
}

export interface ReadonlyAxisAlignedBox2 {
    readonly center: ReadonlyVector2;
    readonly extents: ReadonlyVector2;

    axisX(): Vector2;
    axisY(): Vector2;
    clone(): AxisAlignedBox2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    getCorner(index: number): Vector2;
    getPoints(): FixedSizeArray<Vector2, 4>;
    getTransform(): Matrix3A;
    intersects(box: AxisAlignedBox2, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    maxX(): number;
    maxY(): number;
    minX(): number;
    minY(): number;
    scaleAbs(sx: number, sy: number): AxisAlignedBox2;
    scaleRel(sx: number, sy: number): AxisAlignedBox2;
    setEnclosePoint(box: ReadonlyAxisAlignedBox2, p: ReadonlyVector2): void;
    sizeX(): number;
    sizeY(): number;
    toArray(): FixedSizeArray<number, 4>;
    toMinMaxBox(): MinMaxBox2;
    toOrientedBox(): OrientedBox2;
    toString(): string;
}

export interface ReadonlyAxisAlignedBox3 {
    readonly center: ReadonlyVector3;
    readonly extents: ReadonlyVector3;

    axisX(): Vector3;
    axisY(): Vector3;
    axisZ(): Vector3;
    clone(): AxisAlignedBox3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    getCorner(index: number): Vector3;
    getPoints(): FixedSizeArray<Vector3, 8>;
    getTransform(): Matrix4A;
    intersects(box: AxisAlignedBox3, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    maxX(): number;
    maxY(): number;
    maxZ(): number;
    minX(): number;
    minY(): number;
    minZ(): number;
    scaleAbs(sx: number, sy: number, sz: number): AxisAlignedBox3;
    scaleRel(sx: number, sy: number, sz: number): AxisAlignedBox3;
    setEnclosePoint(box: ReadonlyAxisAlignedBox3, p: ReadonlyVector3): void;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toArray(): FixedSizeArray<number, 6>;
    toMinMaxBox(): MinMaxBox3;
    toOrientedBox(): OrientedBox3;
    toString(): string;
}

export interface ReadonlyOrientedBox2 {
    readonly center: ReadonlyVector2;
    readonly extents: ReadonlyVector2;
    readonly rotation: ReadonlyComplex;

    axisX(): Vector2;
    axisY(): Vector2;
    clone(): OrientedBox2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    getCorner(index: number): Vector2;
    getPoints(): FixedSizeArray<Vector2, 4>;
    getTransform(): Matrix3A;
    intersects(box: OrientedBox2, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(sx: number, sy: number): OrientedBox2;
    scaleRel(sx: number, sy: number): OrientedBox2;
    sizeX(): number;
    sizeX(): number;
    toArray(): FixedSizeArray<number, 6>;
    toAxisAlignedBox(): AxisAlignedBox2;
    toString(): string;
}

export interface ReadonlyOrientedBox3 {
    readonly center: ReadonlyVector3;
    readonly extents: ReadonlyVector3;
    readonly rotation: ReadonlyQuaternion;

    axisX(): Vector3;
    axisY(): Vector3;
    axisZ(): Vector3;
    clone(): OrientedBox3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    getCorner(index: number): Vector3;
    getPoints(): FixedSizeArray<Vector3, 8>;
    getTransform(): Matrix4A;
    intersects(box: OrientedBox3, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(sx: number, sy: number, sz: number): OrientedBox3;
    scaleRel(sx: number, sy: number, sz: number): OrientedBox3;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toArray(): FixedSizeArray<number, 10>;
    toAxisAlignedBox(): AxisAlignedBox3;
    toString(): string;
}

export class MinMaxBox2 implements ReadonlyMinMaxBox2 {
    public maxX: number;
    public maxY: number;
    public minX: number;
    public minY: number;

    public constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * Returns an empty `Box2` object.
     */
    public static createEmpty(): MinMaxBox2 {
        return new MinMaxBox2(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): MinMaxBox2 {
        return new MinMaxBox2(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: MinMaxBox2Like): MinMaxBox2 {
        return new MinMaxBox2(obj.minX, obj.minY, obj.maxX, obj.maxY);
    }

    public static fromPoints(p0: ReadonlyVector2, p1: ReadonlyVector2): MinMaxBox2 {
        const minX = Math.min(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y);
        const maxX = Math.max(p0.x, p1.x);
        const maxY = Math.max(p0.y, p1.y);

        return new MinMaxBox2(minX, minY, maxX, maxY);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number): MinMaxBox2 {
        const minX = Math.min(x, x + w);
        const minY = Math.min(y, y + h);
        const maxX = Math.max(x, x + w);
        const maxY = Math.max(y, y + h);

        return new MinMaxBox2(minX, minY, maxX, maxY);
    }

    public static toObject(box: ReadonlyMinMaxBox2): MinMaxBox2Like {
        return {
            minX: box.minX,
            minY: box.minY,
            maxX: box.maxX,
            maxY: box.maxY,
        };
    }

    public center(): Vector2 {
        const x = lerp(0.5, this.minX, this.maxX);
        const y = lerp(0.5, this.minY, this.maxY);

        return new Vector2(x, y);
    }

    public clone(): MinMaxBox2 {
        return new MinMaxBox2(this.minX, this.minY, this.maxX, this.maxY);
    }

    public containsPoint(p: ReadonlyVector2, eps: number): boolean {
        const x0 = this.minX - p.x;
        const y0 = this.minY - p.y;
        const x1 = p.x - this.maxX;
        const y1 = p.y - this.maxY;

        return x0 <= eps && x1 <= eps && y0 <= eps && y1 <= eps;
    }

    public extents(): Vector2 {
        const x = 0.5 * (this.maxX - this.minX);
        const y = 0.5 * (this.maxY - this.minY);

        return new Vector2(x, y);
    }

    public intersects(b: ReadonlyMinMaxBox2, eps: number): boolean {
        const x0 = this.minX - b.maxX;
        const y0 = this.minY - b.maxY;
        const x1 = b.minX - this.maxX;
        const y1 = b.minY - this.maxY;

        return x0 <= eps && x1 <= eps && y0 <= eps && y1 <= eps;
    }

    public intersectsRay(ray: ReadonlyRay2): boolean {
        let tmin = Number.NEGATIVE_INFINITY;
        let tmax = Number.POSITIVE_INFINITY;

        let d = 1 / ray.direction.x;
        let t0 = (this.minX - ray.origin.x) * d;
        let t1 = (this.maxX - ray.origin.x) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.direction.y;
        t0 = (this.minY - ray.origin.y) * d;
        t1 = (this.maxY - ray.origin.y) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        return tmin < tmax;
    }

    public isEmpty(): boolean {
        return this.minX > this.maxX || this.minY > this.maxY;
    }

    public isPoint(): boolean {
        return this.minX === this.maxX && this.minY === this.maxY;
    }

    public scaleAbs(sx: number, sy: number): MinMaxBox2 {
        return new MinMaxBox2(this.minX - sx, this.minY - sy, this.maxX + sx, this.maxY + sy);
    }

    public scaleRel(sx: number, sy: number): MinMaxBox2 {
        const ssx = 0.5 * (sx - 1) * this.sizeX();
        const ssy = 0.5 * (sy - 1) * this.sizeY();

        return this.scaleAbs(ssx, ssy);
    }

    public set(minX: number, minY: number, maxX: number, maxY: number): void {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    public setEnclosePoint(box: ReadonlyMinMaxBox2, p: ReadonlyVector2): void {
        this.minX = Math.min(box.minX, p.x);
        this.minY = Math.min(box.minY, p.y);
        this.maxX = Math.max(box.maxX, p.x);
        this.maxY = Math.max(box.maxY, p.y);
    }

    public setEnclosePointTransform(
        box: ReadonlyMinMaxBox2,
        p: ReadonlyVector2,
        mat: ReadonlyMatrix3 | ReadonlyMatrix3A,
    ): void {
        const pp = mat.transformPoint(p);
        this.setEnclosePoint(box, pp);
    }

    public setToEmpty(): void {
        this.set(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public setUnion(box1: ReadonlyMinMaxBox2, box2: ReadonlyMinMaxBox2): void {
        this.minX = Math.min(box1.minX, box2.minX);
        this.minY = Math.min(box1.minY, box2.minY);
        this.maxX = Math.max(box1.maxX, box2.maxX);
        this.maxY = Math.max(box1.maxY, box2.maxY);
    }

    public sizeX(): number {
        return this.maxX - this.minX;
    }

    public sizeY(): number {
        return this.maxY - this.minY;
    }

    public toArray(): [number, number, number, number] {
        return [this.minX, this.minY, this.maxX, this.maxY];
    }

    public toAxisAlignedBox(): AxisAlignedBox2 {
        return new AxisAlignedBox2(this.center(), this.extents());
    }

    public toOrientedBox(): OrientedBox2 {
        return new OrientedBox2(this.center(), this.extents(), Complex.IDENTITY);
    }

    public toString(): string {
        // prettier-ignore
        return (
            `{minX: ${this.minX}, minY: ${this.minY},\n` +
            ` maxX: ${this.maxX}, maxY: ${this.maxY}}`
        );
    }

    public transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): MinMaxBox2 {
        const box = MinMaxBox2.createEmpty();
        box.setEnclosePointTransform(box, new Vector2(this.minX, this.minY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.minX, this.maxY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.maxX, this.minY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.maxX, this.maxY), mat);

        return box;
    }
}

export class MinMaxBox3 implements ReadonlyMinMaxBox3 {
    public maxX: number;
    public maxY: number;
    public maxZ: number;
    public minX: number;
    public minY: number;
    public minZ: number;

    public constructor(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    /**
     * Returns an empty `Box3` object.
     */
    public static createEmpty(): MinMaxBox3 {
        return new MinMaxBox3(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): MinMaxBox3 {
        return new MinMaxBox3(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
            data[offset + 4],
            data[offset + 5],
        );
    }

    public static fromObject(obj: MinMaxBox3Like): MinMaxBox3 {
        return new MinMaxBox3(obj.minX, obj.minY, obj.minZ, obj.maxX, obj.maxY, obj.maxZ);
    }

    public static fromPoints(p0: ReadonlyVector3, p1: ReadonlyVector3): MinMaxBox3 {
        const minX = Math.min(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y);
        const minZ = Math.min(p0.z, p1.z);
        const maxX = Math.max(p0.x, p1.x);
        const maxY = Math.max(p0.y, p1.y);
        const maxZ = Math.max(p0.z, p1.z);

        return new MinMaxBox3(minX, minY, minZ, maxX, maxY, maxZ);
    }

    public static fromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): MinMaxBox3 {
        const minX = Math.min(x, x + w);
        const minY = Math.min(y, y + h);
        const minZ = Math.min(z, z + d);
        const maxX = Math.max(x, x + w);
        const maxY = Math.max(y, y + h);
        const maxZ = Math.max(z, z + d);

        return new MinMaxBox3(minX, minY, minZ, maxX, maxY, maxZ);
    }

    public static toObject(box: ReadonlyMinMaxBox3): MinMaxBox3Like {
        return {
            minX: box.minX,
            minY: box.minY,
            minZ: box.minZ,
            maxX: box.maxX,
            maxY: box.maxY,
            maxZ: box.maxZ,
        };
    }

    public center(): Vector3 {
        const x = lerp(0.5, this.minX, this.maxX);
        const y = lerp(0.5, this.minY, this.maxY);
        const z = lerp(0.5, this.minZ, this.maxZ);

        return new Vector3(x, y, z);
    }

    public clone(): MinMaxBox3 {
        return new MinMaxBox3(this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
    }

    public containsPoint(p: ReadonlyVector3, eps: number): boolean {
        const x0 = this.minX - p.x;
        const y0 = this.minY - p.y;
        const z0 = this.minZ - p.z;
        const x1 = p.x - this.maxX;
        const y1 = p.y - this.maxY;
        const z1 = p.z - this.maxZ;

        return x0 <= eps && x1 <= eps && y0 <= eps && y1 <= eps && z0 <= eps && z1 <= eps;
    }

    public extents(): Vector3 {
        const x = 0.5 * (this.maxX - this.minX);
        const y = 0.5 * (this.maxY - this.minY);
        const z = 0.5 * (this.maxZ - this.minZ);

        return new Vector3(x, y, z);
    }

    public intersects(b: ReadonlyMinMaxBox3, eps: number): boolean {
        const x0 = this.minX - b.maxX;
        const y0 = this.minY - b.maxY;
        const z0 = this.minZ - b.maxZ;
        const x1 = b.minX - this.maxX;
        const y1 = b.minY - this.maxY;
        const z1 = b.minZ - this.maxZ;

        return x0 <= eps && x1 <= eps && y0 <= eps && y1 <= eps && z0 <= eps && z1 <= eps;
    }

    public intersectsRay(ray: ReadonlyRay3): boolean {
        let tmin = Number.NEGATIVE_INFINITY;
        let tmax = Number.POSITIVE_INFINITY;

        let d = 1 / ray.direction.x;
        let t0 = (this.minX - ray.origin.x) * d;
        let t1 = (this.maxX - ray.origin.x) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.direction.y;
        t0 = (this.minY - ray.origin.y) * d;
        t1 = (this.maxY - ray.origin.y) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.direction.z;
        t0 = (this.minZ - ray.origin.z) * d;
        t1 = (this.maxZ - ray.origin.z) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        return tmin < tmax;
    }

    public isEmpty(): boolean {
        return this.minX > this.maxX || this.minY > this.maxY || this.minZ > this.maxZ;
    }

    public isPoint(): boolean {
        return this.minX === this.maxX && this.minY === this.maxY && this.minZ === this.maxZ;
    }

    public scaleAbs(sx: number, sy: number, sz: number): MinMaxBox3 {
        return new MinMaxBox3(
            this.minX - sx,
            this.minY - sy,
            this.maxX + sx,
            this.maxY + sy,
            this.maxZ + sz,
            this.maxZ + sz,
        );
    }

    public scaleRel(sx: number, sy: number, sz: number): MinMaxBox3 {
        const ssx = 0.5 * (sx - 1) * this.sizeX();
        const ssy = 0.5 * (sy - 1) * this.sizeY();
        const ssz = 0.5 * (sz - 1) * this.sizeZ();

        return this.scaleAbs(ssx, ssy, ssz);
    }

    public set(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    public setEnclosePoint(box: ReadonlyMinMaxBox3, p: ReadonlyVector3): void {
        this.minX = Math.min(box.minX, p.x);
        this.minY = Math.min(box.minY, p.y);
        this.minZ = Math.min(box.minZ, p.z);
        this.maxX = Math.max(box.maxX, p.x);
        this.maxY = Math.max(box.maxY, p.y);
        this.maxZ = Math.max(box.maxZ, p.z);
    }

    public setEnclosePointTransform(
        box: ReadonlyMinMaxBox3,
        p: ReadonlyVector3,
        mat: ReadonlyMatrix4 | ReadonlyMatrix4A,
    ): void {
        const pp = mat.transformPoint(p);
        this.setEnclosePoint(box, pp);
    }

    public setToEmpty(): void {
        this.set(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public setUnion(box1: ReadonlyMinMaxBox3, box2: ReadonlyMinMaxBox3): void {
        this.minX = Math.min(box1.minX, box2.minX);
        this.minY = Math.min(box1.minY, box2.minY);
        this.minZ = Math.min(box1.minZ, box2.minZ);
        this.maxX = Math.max(box1.maxX, box2.maxX);
        this.maxY = Math.max(box1.maxY, box2.maxY);
        this.maxZ = Math.max(box1.maxZ, box2.maxZ);
    }

    public sizeX(): number {
        return this.maxX - this.minX;
    }

    public sizeY(): number {
        return this.maxY - this.minY;
    }

    public sizeZ(): number {
        return this.maxZ - this.minZ;
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ];
    }

    public toAxisAlignedBox(): AxisAlignedBox3 {
        return new AxisAlignedBox3(this.center(), this.extents());
    }

    public toOrientedBox(): OrientedBox3 {
        return new OrientedBox3(this.center(), this.extents(), Quaternion.IDENTITY);
    }

    public toString(): string {
        return (
            `{minX: ${this.minX}, minY: ${this.minY}, minZ: ${this.minZ},\n` +
            ` maxX: ${this.maxX}, maxY: ${this.maxY}, maxZ: ${this.maxZ}}`
        );
    }

    public transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): MinMaxBox3 {
        const box = MinMaxBox3.createEmpty();

        box.setEnclosePointTransform(box, new Vector3(this.minX, this.minY, this.minZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.minX, this.minY, this.maxZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.minX, this.maxY, this.minZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.minX, this.maxY, this.maxZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.maxX, this.minY, this.minZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.maxX, this.minY, this.maxZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.maxX, this.maxY, this.minZ), mat);
        box.setEnclosePointTransform(box, new Vector3(this.maxX, this.maxY, this.maxZ), mat);

        return box;
    }
}

export class AxisAlignedBox2 implements ReadonlyAxisAlignedBox2 {
    public center: ReadonlyVector2;
    public extents: ReadonlyVector2;

    public constructor(center: ReadonlyVector2, extents: ReadonlyVector2) {
        this.center = center;
        this.extents = extents;
    }

    public static createEmpty(): AxisAlignedBox2 {
        const center = Vector2.createZero();
        const extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        return new AxisAlignedBox2(center, extents);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): AxisAlignedBox2 {
        const center = Vector2.fromArray(data, offset);
        const extents = Vector2.fromArray(data, offset + 2);

        return new AxisAlignedBox2(center, extents);
    }

    public static fromObject(obj: AxisAlignedBox2Like): AxisAlignedBox2 {
        const center = Vector2.fromObject(obj.center);
        const extents = Vector2.fromObject(obj.extents);

        return new AxisAlignedBox2(center, extents);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number): AxisAlignedBox2 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);

        const center = new Vector2(x0 + ex, y0 + ey);
        const extents = new Vector2(ex, ey);

        return new AxisAlignedBox2(center, extents);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number): AxisAlignedBox2 {
        const center = new Vector2(x, y);
        const extents = new Vector2(0.5 * w, 0.5 * h);

        return new AxisAlignedBox2(center, extents);
    }

    public static toObject(box: ReadonlyAxisAlignedBox2): AxisAlignedBox2Like {
        const center = Vector2.toObject(box.center);
        const extents = Vector2.toObject(box.extents);

        return { center, extents };
    }

    public axisX(): Vector2 {
        return Vector2.createUnitX();
    }

    public axisY(): Vector2 {
        return Vector2.createUnitY();
    }

    public clone(): AxisAlignedBox2 {
        return new AxisAlignedBox2(this.center, this.extents);
    }

    public containsPoint(p: ReadonlyVector2, eps: number): boolean {
        const cx = p.x - this.center.x;
        const cy = p.y - this.center.y;
        const ex = this.extents.x + eps;
        const ey = this.extents.y + eps;

        return cx <= ex && cx >= -ex && cy <= ey && cy >= -ey;
    }

    public getCorner(index: number): Vector2 {
        const x = ((index & 1) << 1) - 1;
        const y = ((index & 2) >> 0) - 1;

        let p = new Vector2(x, y);

        p = this.extents.mul(p);
        p = this.center.add(p);

        return p;
    }

    public getPoints(): FixedSizeArray<Vector2, 4> {
        const points: Vector2[] = [];

        for (let i = 0; i < 4; i++) {
            const p = this.getCorner(i);
            points.push(p);
        }

        return points as FixedSizeArray<Vector2, 4>;
    }

    public getTransform(): Matrix3A {
        const mat = Matrix3A.fromScale(this.extents.x, this.extents.y);
        mat.setTranslate(mat, this.center.x, this.center.y);

        return mat;
    }

    public intersects(box: ReadonlyAxisAlignedBox2, eps: number): boolean {
        const cx = box.center.x - this.center.x;
        const cy = box.center.y - this.center.y;
        const ex = this.extents.x + box.extents.x + eps;
        const ey = this.extents.y + box.extents.y + eps;

        return cx <= ex && cx >= -ex && cy <= ey && cy >= -ey;
    }

    public isEmpty(): boolean {
        const ve = this.extents;
        return ve.x < 0 || ve.y < 0;
    }

    public isPoint(): boolean {
        const ve = this.extents;
        return ve.x === 0 && ve.y === 0;
    }

    public maxX(): number {
        return this.center.x + this.extents.x;
    }

    public maxY(): number {
        return this.center.y + this.extents.y;
    }

    public minX(): number {
        return this.center.x - this.extents.x;
    }

    public minY(): number {
        return this.center.y - this.extents.y;
    }

    public scaleAbs(sx: number, sy: number): AxisAlignedBox2 {
        const extents = new Vector2(this.extents.x + sx, this.extents.y + sy);
        return new AxisAlignedBox2(this.center, extents);
    }

    public scaleRel(sx: number, sy: number): AxisAlignedBox2 {
        const extents = new Vector2(this.extents.x * sx, this.extents.y * sy);
        return new AxisAlignedBox2(this.center, extents);
    }

    public set(center: ReadonlyVector2, extents: ReadonlyVector2): void {
        this.center = center;
        this.extents = extents;
    }

    public setEnclosePoint(box: ReadonlyAxisAlignedBox2, p: ReadonlyVector2): void {
        const pc = box.center;
        const ve = box.extents;

        const x0 = Math.min(pc.x - ve.x, p.x);
        const y0 = Math.min(pc.y - ve.y, p.y);
        const x1 = Math.max(pc.x + ve.x, p.x);
        const y1 = Math.max(pc.y + ve.y, p.y);

        this.setFromXY(x0, y0, x1, y1);
    }

    public setFromXY(x0: number, y0: number, x1: number, y1: number): void {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);

        this.center = new Vector2(x0 + ex, y0 + ey);
        this.extents = new Vector2(ex, ey);
    }

    public setFromXYWH(x: number, y: number, w: number, h: number): void {
        this.center = new Vector2(x, y);
        this.extents = new Vector2(0.5 * w, 0.5 * h);
    }

    public setToEmpty(): void {
        this.center = Vector2.createZero();
        this.extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    public setUnion(box1: ReadonlyAxisAlignedBox2, box2: ReadonlyAxisAlignedBox2): void {
        const pc1 = box1.center;
        const ve1 = box1.extents;
        const pc2 = box2.center;
        const ve2 = box2.extents;

        const x0 = Math.min(pc1.x - ve1.x, pc2.x - ve2.x);
        const y0 = Math.min(pc1.y - ve1.y, pc2.y - ve2.y);
        const x1 = Math.max(pc1.x + ve1.x, pc2.x + ve2.x);
        const y1 = Math.max(pc1.y + ve1.y, pc2.y + ve2.y);

        this.setFromXY(x0, y0, x1, y1);
    }

    public sizeX(): number {
        return 2 * this.extents.x;
    }

    public sizeY(): number {
        return 2 * this.extents.y;
    }

    public toArray(): FixedSizeArray<number, 4> {
        const pc = this.center;
        const ve = this.extents;

        return [pc.x, pc.y, ve.x, ve.y];
    }

    public toMinMaxBox(): MinMaxBox2 {
        return new MinMaxBox2(this.minX(), this.minY(), this.maxX(), this.maxY());
    }

    public toOrientedBox(): OrientedBox2 {
        return new OrientedBox2(this.center, this.extents, Complex.IDENTITY);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}}`;
    }
}

export class AxisAlignedBox3 implements ReadonlyAxisAlignedBox3 {
    public center: ReadonlyVector3;
    public extents: ReadonlyVector3;

    public constructor(center: ReadonlyVector3, extents: ReadonlyVector3) {
        this.center = center;
        this.extents = extents;
    }

    public static createEmpty(): AxisAlignedBox3 {
        const center = Vector3.createZero();
        const extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        return new AxisAlignedBox3(center, extents);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): AxisAlignedBox3 {
        const center = Vector3.fromArray(data, offset);
        const extents = Vector3.fromArray(data, offset + 2);

        return new AxisAlignedBox3(center, extents);
    }

    public static fromObject(obj: AxisAlignedBox3Like): AxisAlignedBox3 {
        const center = Vector3.fromObject(obj.center);
        const extents = Vector3.fromObject(obj.extents);

        return new AxisAlignedBox3(center, extents);
    }

    public static fromXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): AxisAlignedBox3 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);
        const ez = 0.5 * (z1 - z0);

        const center = new Vector3(x0 + ex, y0 + ey, z0 + ez);
        const extents = new Vector3(ex, ey, ez);

        return new AxisAlignedBox3(center, extents);
    }

    public static fromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): AxisAlignedBox3 {
        const center = new Vector3(x, y, z);
        const extents = new Vector3(0.5 * w, 0.5 * h, 0.5 * d);

        return new AxisAlignedBox3(center, extents);
    }

    public static toObject(box: ReadonlyAxisAlignedBox3): AxisAlignedBox3Like {
        const center = Vector3.toObject(box.center);
        const extents = Vector3.toObject(box.extents);

        return { center, extents };
    }

    public axisX(): Vector3 {
        return Vector3.createUnitX();
    }

    public axisY(): Vector3 {
        return Vector3.createUnitY();
    }

    public axisZ(): Vector3 {
        return Vector3.createUnitY();
    }

    public clone(): AxisAlignedBox3 {
        return new AxisAlignedBox3(this.center, this.extents);
    }

    public containsPoint(p: ReadonlyVector3, eps: number): boolean {
        const cx = p.x - this.center.x;
        const cy = p.y - this.center.y;
        const cz = p.z - this.center.z;
        const ex = this.extents.x + eps;
        const ey = this.extents.y + eps;
        const ez = this.extents.z + eps;

        return cx <= ex && cx >= -ex && cy <= ey && cy >= -ey && cz <= ez && cz >= -ez;
    }

    public getCorner(index: number): Vector3 {
        const x = ((index & 1) << 1) - 1;
        const y = ((index & 2) >> 0) - 1;
        const z = ((index & 4) >> 1) - 1;

        let p = new Vector3(x, y, z);

        p = this.extents.mul(p);
        p = this.center.add(p);

        return p;
    }

    public getPoints(): FixedSizeArray<Vector3, 8> {
        const points: Vector3[] = [];

        for (let i = 0; i < 8; i++) {
            const p = this.getCorner(i);
            points.push(p);
        }

        return points as FixedSizeArray<Vector3, 8>;
    }

    public getTransform(): Matrix4A {
        const mat = Matrix4A.fromScale(this.extents.x, this.extents.y, this.extents.z);
        mat.setTranslate(mat, this.center.x, this.center.y, this.center.z);

        return mat;
    }

    public intersects(box: ReadonlyAxisAlignedBox3, eps: number): boolean {
        const cx = box.center.x - this.center.x;
        const cy = box.center.y - this.center.y;
        const cz = box.center.z - this.center.z;
        const ex = this.extents.x + box.extents.x + eps;
        const ey = this.extents.y + box.extents.y + eps;
        const ez = this.extents.z + box.extents.z + eps;

        return cx <= ex && cx >= -ex && cy <= ey && cy >= -ey && cz <= ez && cz >= -ez;
    }

    public isEmpty(): boolean {
        const ve = this.extents;
        return ve.x < 0 || ve.y < 0 || ve.z < 0;
    }

    public isPoint(): boolean {
        const ve = this.extents;
        return ve.x === 0 && ve.y === 0 && ve.z === 0;
    }

    public maxX(): number {
        return this.center.x + this.extents.x;
    }

    public maxY(): number {
        return this.center.y + this.extents.y;
    }

    public maxZ(): number {
        return this.center.z + this.extents.z;
    }

    public minX(): number {
        return this.center.x - this.extents.x;
    }

    public minY(): number {
        return this.center.y - this.extents.y;
    }

    public minZ(): number {
        return this.center.z - this.extents.z;
    }

    public scaleAbs(sx: number, sy: number, sz: number): AxisAlignedBox3 {
        const extents = new Vector3(this.extents.x + sx, this.extents.y + sy, this.extents.z + sz);
        return new AxisAlignedBox3(this.center, extents);
    }

    public scaleRel(sx: number, sy: number, sz: number): AxisAlignedBox3 {
        const extents = new Vector3(this.extents.x * sx, this.extents.y * sy, this.extents.z * sz);
        return new AxisAlignedBox3(this.center, extents);
    }

    public set(center: ReadonlyVector3, extents: ReadonlyVector3): void {
        this.center = center;
        this.extents = extents;
    }

    public setEnclosePoint(box: ReadonlyAxisAlignedBox3, p: ReadonlyVector3): void {
        const pc = box.center;
        const ve = box.extents;

        const x0 = Math.min(pc.x - ve.x, p.x);
        const y0 = Math.min(pc.y - ve.y, p.y);
        const z0 = Math.min(pc.z - ve.z, p.z);
        const x1 = Math.max(pc.x + ve.x, p.x);
        const y1 = Math.max(pc.y + ve.y, p.y);
        const z1 = Math.max(pc.z + ve.z, p.z);

        this.setFromXYZ(x0, y0, z0, x1, y1, z1);
    }

    public setFromXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);
        const ez = 0.5 * (z1 - z0);

        this.center = new Vector3(x0 + ex, y0 + ey, z0 + ez);
        this.extents = new Vector3(ex, ey, ez);
    }

    public setFromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): void {
        this.center = new Vector3(x, y, z);
        this.extents = new Vector3(0.5 * w, 0.5 * h, 0.5 * d);
    }

    public setToEmpty(): void {
        this.center = Vector3.createZero();
        this.extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    public setUnion(box1: ReadonlyAxisAlignedBox3, box2: ReadonlyAxisAlignedBox3): void {
        const pc1 = box1.center;
        const ve1 = box1.extents;
        const pc2 = box2.center;
        const ve2 = box2.extents;

        const x0 = Math.min(pc1.x - ve1.x, pc2.x - ve2.x);
        const y0 = Math.min(pc1.y - ve1.y, pc2.y - ve2.y);
        const z0 = Math.min(pc1.z - ve1.z, pc2.z - ve2.z);
        const x1 = Math.max(pc1.x + ve1.x, pc2.x + ve2.x);
        const y1 = Math.max(pc1.y + ve1.y, pc2.y + ve2.y);
        const z1 = Math.max(pc1.z + ve1.z, pc2.z + ve2.z);

        this.setFromXYZ(x0, y0, z0, x1, y1, z1);
    }

    public sizeX(): number {
        return 2 * this.extents.x;
    }

    public sizeY(): number {
        return 2 * this.extents.y;
    }

    public sizeZ(): number {
        return 2 * this.extents.z;
    }

    public toArray(): FixedSizeArray<number, 6> {
        const pc = this.center;
        const ve = this.extents;

        return [pc.x, pc.y, pc.z, ve.x, ve.y, ve.z];
    }

    public toMinMaxBox(): MinMaxBox3 {
        return new MinMaxBox3(this.minX(), this.minY(), this.minZ(), this.maxX(), this.maxY(), this.maxZ());
    }

    public toOrientedBox(): OrientedBox3 {
        return new OrientedBox3(this.center, this.extents, Quaternion.IDENTITY);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}}`;
    }
}

export class OrientedBox2 implements ReadonlyOrientedBox2 {
    public center: ReadonlyVector2;
    public extents: ReadonlyVector2;
    public rotation: ReadonlyComplex;

    public constructor(center: ReadonlyVector2, extents: ReadonlyVector2, rotation: ReadonlyComplex) {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public static createEmpty(): OrientedBox2 {
        const center = Vector2.createZero();
        const extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        const rotation = Complex.createIdentity();

        return new OrientedBox2(center, extents, rotation);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): OrientedBox2 {
        const center = Vector2.fromArray(data, offset);
        const extents = Vector2.fromArray(data, offset + 2);
        const rotation = Complex.fromArray(data, offset + 4);

        return new OrientedBox2(center, extents, rotation);
    }

    public static fromObject(obj: OrientedBox2Like): OrientedBox2 {
        const center = Vector2.fromObject(obj.center);
        const extents = Vector2.fromObject(obj.extents);
        const rotation = Complex.fromObject(obj.rotation);

        return new OrientedBox2(center, extents, rotation);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number, rotation: ReadonlyComplex): OrientedBox2 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);

        const center = new Vector2(x0 + ex, y0 + ey);
        const extents = new Vector2(ex, ey);

        return new OrientedBox2(center, extents, rotation);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number, rotation: ReadonlyComplex): OrientedBox2 {
        const center = new Vector2(x, y);
        const extents = new Vector2(0.5 * w, 0.5 * h);

        return new OrientedBox2(center, extents, rotation);
    }

    public static toObject(box: ReadonlyOrientedBox2): OrientedBox2Like {
        const center = Vector2.toObject(box.center);
        const extents = Vector2.toObject(box.extents);
        const rotation = Complex.toObject(box.rotation);

        return { center, extents, rotation };
    }

    public axisX(): Vector2 {
        return this.rotation.mulV(Vector2.UNIT_X);
    }

    public axisY(): Vector2 {
        return this.rotation.mulV(Vector2.UNIT_Y);
    }

    public clone(): OrientedBox2 {
        return new OrientedBox2(this.center, this.extents, this.rotation);
    }

    public containsPoint(p: ReadonlyVector2, eps: number): boolean {
        const v = p.sub(this.center);
        const vc = this.rotation.inverse().mulV(v);

        const ex = this.extents.x + eps;
        const ey = this.extents.y + eps;

        return vc.x <= ex && vc.x >= -ex && vc.y <= ey && vc.y >= -ey;
    }

    public getCorner(index: number): Vector2 {
        const x = ((index & 1) << 1) - 1;
        const y = ((index & 2) >> 0) - 1;

        let p = new Vector2(x, y);

        p = this.extents.mul(p);
        p = this.rotation.mulV(p);
        p = this.center.add(p);

        return p;
    }

    public getPoints(): FixedSizeArray<Vector2, 4> {
        const points: Vector2[] = [];

        for (let i = 0; i < 4; i++) {
            const p = this.getCorner(i);
            points.push(p);
        }

        return points as FixedSizeArray<Vector2, 4>;
    }

    public getTransform(): Matrix3A {
        const mat = Matrix3A.fromScale(this.extents.x, this.extents.y);
        mat.setRotate(mat, this.rotation.a, this.rotation.b);
        mat.setTranslate(mat, this.center.x, this.center.y);

        return mat;
    }

    public intersects(box: OrientedBox2, eps: number): boolean {
        const va1 = this.axisX();
        const va2 = box.axisX();

        return (
            this.intersectsOnAxis(box, va1, eps) &&
            this.intersectsOnAxis(box, va2, eps) &&
            this.intersectsOnAxis(box, va1.normal(), eps) &&
            this.intersectsOnAxis(box, va2.normal(), eps)
        );
    }

    public intersectsOnAxis(box: OrientedBox2, axis: Vector2, eps: number): boolean {
        let min1 = Number.POSITIVE_INFINITY;
        let min2 = Number.POSITIVE_INFINITY;
        let max1 = Number.NEGATIVE_INFINITY;
        let max2 = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < 4; i++) {
            const p1 = this.getCorner(i);
            const x1 = axis.dot(p1);
            min1 = Math.min(min1, x1);
            max1 = Math.max(max1, x1);

            const p2 = box.getCorner(i);
            const x2 = axis.dot(p2);
            min2 = Math.min(min2, x2);
            max2 = Math.max(max2, x2);
        }

        return min2 - max1 <= eps && min1 - max2 <= eps;
    }

    public isEmpty(): boolean {
        return this.extents.x < 0 || this.extents.y < 0;
    }

    public isPoint(): boolean {
        return this.extents.x === 0 && this.extents.y === 0;
    }

    public scaleAbs(sx: number, sy: number): OrientedBox2 {
        const extents = new Vector2(this.extents.x + sx, this.extents.y + sy);
        return new OrientedBox2(this.center, extents, this.rotation);
    }

    public scaleRel(sx: number, sy: number): OrientedBox2 {
        const extents = new Vector2(this.extents.x * sx, this.extents.y * sy);
        return new OrientedBox2(this.center, extents, this.rotation);
    }

    public set(center: ReadonlyVector2, extents: ReadonlyVector2, rotation: ReadonlyComplex): void {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public setToEmpty(): void {
        this.center = Vector2.createZero();
        this.extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        this.rotation = Complex.createIdentity();
    }

    public sizeX(): number {
        return 2 * this.extents.x;
    }

    public sizeY(): number {
        return 2 * this.extents.y;
    }

    public toArray(): FixedSizeArray<number, 6> {
        const pc = this.center;
        const ve = this.extents;
        const qr = this.rotation;

        return [pc.x, pc.y, ve.x, ve.y, qr.a, qr.b];
    }

    public toAxisAlignedBox(): AxisAlignedBox2 {
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < 4; i++) {
            const p = this.getCorner(i);

            x0 = Math.min(x0, p.x);
            y0 = Math.min(y0, p.y);
            x1 = Math.max(x1, p.x);
            y1 = Math.max(y1, p.y);
        }

        return AxisAlignedBox2.fromXY(x0, y0, x1, y1);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}, rotation: ${this.rotation}}`;
    }
}

export class OrientedBox3 implements ReadonlyOrientedBox3 {
    public center: ReadonlyVector3;
    public extents: ReadonlyVector3;
    public rotation: ReadonlyQuaternion;

    public constructor(center: ReadonlyVector3, extents: ReadonlyVector3, rotation: ReadonlyQuaternion) {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public static createEmpty(): OrientedBox3 {
        const center = Vector3.createZero();
        const extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        const rotation = Quaternion.createIdentity();

        return new OrientedBox3(center, extents, rotation);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): OrientedBox3 {
        const center = Vector3.fromArray(data, offset);
        const extents = Vector3.fromArray(data, offset + 3);
        const rotation = Quaternion.fromArray(data, offset + 6);

        return new OrientedBox3(center, extents, rotation);
    }

    public static fromObject(obj: OrientedBox3Like): OrientedBox3 {
        const center = Vector3.fromObject(obj.center);
        const extents = Vector3.fromObject(obj.extents);
        const rotation = Quaternion.fromObject(obj.rotation);

        return new OrientedBox3(center, extents, rotation);
    }

    public static fromXYZ(
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
        rotation: ReadonlyQuaternion,
    ): OrientedBox3 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);
        const ez = 0.5 * (z1 - z0);

        const center = new Vector3(x0 + ex, y0 + ey, z0 + ez);
        const extents = new Vector3(ex, ey, ez);

        return new OrientedBox3(center, extents, rotation);
    }

    public static fromXYZWHD(
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        rotation: ReadonlyQuaternion,
    ): OrientedBox3 {
        const center = new Vector3(x, y, z);
        const extents = new Vector3(0.5 * w, 0.5 * h, 0.5 * d);

        return new OrientedBox3(center, extents, rotation);
    }

    public static toObject(box: ReadonlyOrientedBox3): OrientedBox3Like {
        const center = Vector3.toObject(box.center);
        const extents = Vector3.toObject(box.extents);
        const rotation = Quaternion.toObject(box.rotation);

        return { center, extents, rotation };
    }

    public axisX(): Vector3 {
        return this.rotation.mulV(Vector3.UNIT_X);
    }

    public axisY(): Vector3 {
        return this.rotation.mulV(Vector3.UNIT_Y);
    }

    public axisZ(): Vector3 {
        return this.rotation.mulV(Vector3.UNIT_Z);
    }

    public clone(): OrientedBox3 {
        return new OrientedBox3(this.center, this.extents, this.rotation);
    }

    public containsPoint(p: ReadonlyVector3, eps: number): boolean {
        const v = p.sub(this.center);
        const vc = this.rotation.inverse().mulV(v);

        const ex = this.extents.x + eps;
        const ey = this.extents.y + eps;
        const ez = this.extents.z + eps;

        return vc.x <= ex && vc.x >= -ex && vc.y <= ey && vc.y >= -ey && vc.z <= ez && vc.z >= -ez;
    }

    public getCorner(index: number): Vector3 {
        const x = ((index & 1) << 1) - 1;
        const y = ((index & 2) >> 0) - 1;
        const z = ((index & 4) >> 1) - 1;

        let p = new Vector3(x, y, z);

        p = this.extents.mul(p);
        p = this.rotation.mulV(p);
        p = this.center.add(p);

        return p;
    }

    public getPoints(): FixedSizeArray<Vector3, 8> {
        const points: Vector3[] = [];

        for (let i = 0; i < 8; i++) {
            const p = this.getCorner(i);
            points.push(p);
        }

        return points as FixedSizeArray<Vector3, 8>;
    }

    public getTransform(): Matrix4A {
        const mat = Matrix4A.fromScale(this.extents.x, this.extents.y, this.extents.z);
        mat.setRotate(mat, this.rotation.a, this.rotation.b, this.rotation.c, this.rotation.d);
        mat.setTranslate(mat, this.center.x, this.center.y, this.center.z);

        return mat;
    }

    public intersects(box: OrientedBox3, eps: number): boolean {
        const va1 = this.axisX();
        const va2 = box.axisX();

        return (
            this.intersectsOnAxis(box, va1, eps) &&
            this.intersectsOnAxis(box, va2, eps) &&
            this.intersectsOnAxis(box, va1.normalAroundY(), eps) &&
            this.intersectsOnAxis(box, va2.normalAroundY(), eps) &&
            this.intersectsOnAxis(box, va1.normalAroundZ(), eps) &&
            this.intersectsOnAxis(box, va2.normalAroundZ(), eps)
        );
    }

    public intersectsOnAxis(box: OrientedBox3, axis: Vector3, eps: number): boolean {
        let min1 = Number.POSITIVE_INFINITY;
        let min2 = Number.POSITIVE_INFINITY;
        let max1 = Number.NEGATIVE_INFINITY;
        let max2 = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < 8; i++) {
            const p1 = this.getCorner(i);
            const x1 = axis.dot(p1);
            min1 = Math.min(min1, x1);
            max1 = Math.max(max1, x1);

            const p2 = box.getCorner(i);
            const x2 = axis.dot(p2);
            min2 = Math.min(min2, x2);
            max2 = Math.max(max2, x2);
        }

        return min2 - max1 <= eps && min1 - max2 <= eps;
    }

    public isEmpty(): boolean {
        const ve = this.extents;
        return ve.x < 0 || ve.y < 0 || ve.z < 0;
    }

    public isPoint(): boolean {
        const ve = this.extents;
        return ve.x === 0 && ve.y === 0 && ve.z === 0;
    }

    public scaleAbs(sx: number, sy: number, sz: number): OrientedBox3 {
        const extents = new Vector3(this.extents.x + sx, this.extents.y + sy, this.extents.z + sz);
        return new OrientedBox3(this.center, extents, this.rotation);
    }

    public scaleRel(sx: number, sy: number, sz: number): OrientedBox3 {
        const extents = new Vector3(this.extents.x * sx, this.extents.y * sy, this.extents.z * sz);
        return new OrientedBox3(this.center, extents, this.rotation);
    }

    public set(center: ReadonlyVector3, extents: ReadonlyVector3, rotation: ReadonlyQuaternion): void {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public setToEmpty(): void {
        this.center = Vector3.createZero();
        this.extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        this.rotation = Quaternion.createIdentity();
    }

    public sizeX(): number {
        return 2 * this.extents.x;
    }

    public sizeY(): number {
        return 2 * this.extents.y;
    }

    public sizeZ(): number {
        return 2 * this.extents.z;
    }

    public toArray(): FixedSizeArray<number, 10> {
        const pc = this.center;
        const ve = this.extents;
        const qr = this.rotation;

        return [pc.x, pc.y, pc.z, ve.x, ve.y, ve.z, qr.a, qr.b, qr.c, qr.d];
    }

    public toAxisAlignedBox(): AxisAlignedBox3 {
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let z0 = Number.POSITIVE_INFINITY;
        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;
        let z1 = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < 8; i++) {
            const p = this.getCorner(i);

            x0 = Math.min(x0, p.x);
            y0 = Math.min(y0, p.y);
            z0 = Math.min(z0, p.z);
            x1 = Math.max(x1, p.x);
            y1 = Math.max(y1, p.y);
            z1 = Math.max(z1, p.z);
        }

        return AxisAlignedBox3.fromXYZ(x0, y0, z0, x1, y1, z1);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}, rotation: ${this.rotation}}`;
    }
}
