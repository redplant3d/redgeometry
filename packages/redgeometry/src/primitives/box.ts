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

export type Box2Like = {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
};

export type Box3Like = {
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
};

export type AABox2Like = {
    readonly center: Vector2Like;
    readonly extents: Vector2Like;
};

export type AABox3Like = {
    readonly center: Vector3Like;
    readonly extents: Vector3Like;
};

export type OBox2Like = {
    readonly center: Vector2Like;
    readonly extents: Vector2Like;
    readonly rotation: ComplexLike;
};

export type OBox3Like = {
    readonly center: Vector3Like;
    readonly extents: Vector3Like;
    readonly rotation: QuaternionLike;
};

export interface ReadonlyBox2 {
    readonly maxX: number;
    readonly maxY: number;
    readonly minX: number;
    readonly minY: number;

    center(): Vector2;
    clone(): Box2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    extents(): Vector2;
    intersects(b: ReadonlyBox2, eps: number): boolean;
    intersectsRay(ray: ReadonlyRay2): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(dx: number, dy: number): Box2;
    scaleRel(fx: number, fy: number): Box2;
    sizeX(): number;
    sizeY(): number;
    toAABox(): AABox2;
    toArray(): [number, number, number, number];
    toOBox(): OBox2;
    toString(): string;
    transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): Box2;
}

export interface ReadonlyBox3 {
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;

    center(): Vector3;
    clone(): Box3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    extents(): Vector3;
    intersects(b: ReadonlyBox3, eps: number): boolean;
    intersectsRay(ray: ReadonlyRay3): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(dx: number, dy: number, dz: number): Box3;
    scaleRel(fx: number, fy: number, fz: number): Box3;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toAABox(): AABox3;
    toArray(): [number, number, number, number, number, number];
    toOBox(): OBox3;
    toString(): string;
    transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): Box3;
}

export interface ReadonlyAABox2 {
    readonly center: ReadonlyVector2;
    readonly extents: ReadonlyVector2;

    axisX(): Vector2;
    axisY(): Vector2;
    clone(): AABox2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    getCorner(index: number): Vector2;
    getPoints(): FixedSizeArray<Vector2, 4>;
    getTransform(): Matrix3A;
    intersects(box: AABox2, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    maxX(): number;
    maxY(): number;
    minX(): number;
    minY(): number;
    scaleAbs(sx: number, sy: number): AABox2;
    scaleRel(sx: number, sy: number): AABox2;
    setEnclosePoint(box: ReadonlyAABox2, p: ReadonlyVector2): void;
    sizeX(): number;
    sizeY(): number;
    toArray(): FixedSizeArray<number, 4>;
    toBox(): Box2;
    toOBox(): OBox2;
    toString(): string;
}

export interface ReadonlyAABox3 {
    readonly center: ReadonlyVector3;
    readonly extents: ReadonlyVector3;

    axisX(): Vector3;
    axisY(): Vector3;
    axisZ(): Vector3;
    clone(): AABox3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    getCorner(index: number): Vector3;
    getPoints(): FixedSizeArray<Vector3, 8>;
    getTransform(): Matrix4A;
    intersects(box: AABox3, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    maxX(): number;
    maxY(): number;
    maxZ(): number;
    minX(): number;
    minY(): number;
    minZ(): number;
    scaleAbs(sx: number, sy: number, sz: number): AABox3;
    scaleRel(sx: number, sy: number, sz: number): AABox3;
    setEnclosePoint(box: ReadonlyAABox3, p: ReadonlyVector3): void;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toArray(): FixedSizeArray<number, 6>;
    toBox(): Box3;
    toOBox(): OBox3;
    toString(): string;
}

export interface ReadonlyOBox2 {
    readonly center: ReadonlyVector2;
    readonly extents: ReadonlyVector2;
    readonly rotation: ReadonlyComplex;

    axisX(): Vector2;
    axisY(): Vector2;
    clone(): OBox2;
    containsPoint(p: ReadonlyVector2, eps: number): boolean;
    getCorner(index: number): Vector2;
    getPoints(): FixedSizeArray<Vector2, 4>;
    getTransform(): Matrix3A;
    intersects(box: OBox2, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(sx: number, sy: number): OBox2;
    scaleRel(sx: number, sy: number): OBox2;
    sizeX(): number;
    sizeX(): number;
    toAABox(): AABox2;
    toArray(): FixedSizeArray<number, 6>;
    toString(): string;
}

export interface ReadonlyOBox3 {
    readonly center: ReadonlyVector3;
    readonly extents: ReadonlyVector3;
    readonly rotation: ReadonlyQuaternion;

    axisX(): Vector3;
    axisY(): Vector3;
    axisZ(): Vector3;
    clone(): OBox3;
    containsPoint(p: ReadonlyVector3, eps: number): boolean;
    getCorner(index: number): Vector3;
    getPoints(): FixedSizeArray<Vector3, 8>;
    getTransform(): Matrix4A;
    intersects(box: OBox3, eps: number): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scaleAbs(sx: number, sy: number, sz: number): OBox3;
    scaleRel(sx: number, sy: number, sz: number): OBox3;
    sizeX(): number;
    sizeY(): number;
    sizeZ(): number;
    toAABox(): AABox3;
    toArray(): FixedSizeArray<number, 10>;
    toString(): string;
}

export class Box2 implements ReadonlyBox2 {
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
    public static createEmpty(): Box2 {
        return new Box2(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Box2 {
        return new Box2(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: Box2Like): Box2 {
        return new Box2(obj.minX, obj.minY, obj.maxX, obj.maxY);
    }

    public static fromPoints(p0: ReadonlyVector2, p1: ReadonlyVector2): Box2 {
        const minX = Math.min(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y);
        const maxX = Math.max(p0.x, p1.x);
        const maxY = Math.max(p0.y, p1.y);

        return new Box2(minX, minY, maxX, maxY);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number): Box2 {
        const minX = Math.min(x, x + w);
        const minY = Math.min(y, y + h);
        const maxX = Math.max(x, x + w);
        const maxY = Math.max(y, y + h);

        return new Box2(minX, minY, maxX, maxY);
    }

    public static toObject(box: ReadonlyBox2): Box2Like {
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

    public clone(): Box2 {
        return new Box2(this.minX, this.minY, this.maxX, this.maxY);
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

    public intersects(b: ReadonlyBox2, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number): Box2 {
        return new Box2(this.minX - sx, this.minY - sy, this.maxX + sx, this.maxY + sy);
    }

    public scaleRel(sx: number, sy: number): Box2 {
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

    public setEnclosePoint(box: ReadonlyBox2, p: ReadonlyVector2): void {
        this.minX = Math.min(box.minX, p.x);
        this.minY = Math.min(box.minY, p.y);
        this.maxX = Math.max(box.maxX, p.x);
        this.maxY = Math.max(box.maxY, p.y);
    }

    public setEnclosePointTransform(
        box: ReadonlyBox2,
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

    public setUnion(box1: ReadonlyBox2, box2: ReadonlyBox2): void {
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

    public toAABox(): AABox2 {
        return new AABox2(this.center(), this.extents());
    }

    public toArray(): [number, number, number, number] {
        return [this.minX, this.minY, this.maxX, this.maxY];
    }

    public toOBox(): OBox2 {
        return new OBox2(this.center(), this.extents(), Complex.IDENTITY);
    }

    public toString(): string {
        // prettier-ignore
        return (
            `{minX: ${this.minX}, minY: ${this.minY},\n` +
            ` maxX: ${this.maxX}, maxY: ${this.maxY}}`
        );
    }

    public transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): Box2 {
        const box = Box2.createEmpty();
        box.setEnclosePointTransform(box, new Vector2(this.minX, this.minY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.minX, this.maxY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.maxX, this.minY), mat);
        box.setEnclosePointTransform(box, new Vector2(this.maxX, this.maxY), mat);

        return box;
    }
}

export class Box3 implements ReadonlyBox3 {
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
    public static createEmpty(): Box3 {
        return new Box3(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
        );
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Box3 {
        return new Box3(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
            data[offset + 4],
            data[offset + 5],
        );
    }

    public static fromObject(obj: Box3Like): Box3 {
        return new Box3(obj.minX, obj.minY, obj.minZ, obj.maxX, obj.maxY, obj.maxZ);
    }

    public static fromPoints(p0: ReadonlyVector3, p1: ReadonlyVector3): Box3 {
        const minX = Math.min(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y);
        const minZ = Math.min(p0.z, p1.z);
        const maxX = Math.max(p0.x, p1.x);
        const maxY = Math.max(p0.y, p1.y);
        const maxZ = Math.max(p0.z, p1.z);

        return new Box3(minX, minY, minZ, maxX, maxY, maxZ);
    }

    public static fromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): Box3 {
        const minX = Math.min(x, x + w);
        const minY = Math.min(y, y + h);
        const minZ = Math.min(z, z + d);
        const maxX = Math.max(x, x + w);
        const maxY = Math.max(y, y + h);
        const maxZ = Math.max(z, z + d);

        return new Box3(minX, minY, minZ, maxX, maxY, maxZ);
    }

    public static toObject(box: ReadonlyBox3): Box3Like {
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

    public clone(): Box3 {
        return new Box3(this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
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

    public intersects(b: ReadonlyBox3, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number, sz: number): Box3 {
        return new Box3(this.minX - sx, this.minY - sy, this.maxX + sx, this.maxY + sy, this.maxZ + sz, this.maxZ + sz);
    }

    public scaleRel(sx: number, sy: number, sz: number): Box3 {
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

    public setEnclosePoint(box: ReadonlyBox3, p: ReadonlyVector3): void {
        this.minX = Math.min(box.minX, p.x);
        this.minY = Math.min(box.minY, p.y);
        this.minZ = Math.min(box.minZ, p.z);
        this.maxX = Math.max(box.maxX, p.x);
        this.maxY = Math.max(box.maxY, p.y);
        this.maxZ = Math.max(box.maxZ, p.z);
    }

    public setEnclosePointTransform(
        box: ReadonlyBox3,
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

    public setUnion(box1: ReadonlyBox3, box2: ReadonlyBox3): void {
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

    public toAABox(): AABox3 {
        return new AABox3(this.center(), this.extents());
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ];
    }

    public toOBox(): OBox3 {
        return new OBox3(this.center(), this.extents(), Quaternion.IDENTITY);
    }

    public toString(): string {
        return (
            `{minX: ${this.minX}, minY: ${this.minY}, minZ: ${this.minZ},\n` +
            ` maxX: ${this.maxX}, maxY: ${this.maxY}, maxZ: ${this.maxZ}}`
        );
    }

    public transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): Box3 {
        const box = Box3.createEmpty();

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

export class AABox2 implements ReadonlyAABox2 {
    public center: ReadonlyVector2;
    public extents: ReadonlyVector2;

    public constructor(center: ReadonlyVector2, extents: ReadonlyVector2) {
        this.center = center;
        this.extents = extents;
    }

    public static createEmpty(): AABox2 {
        const center = Vector2.createZero();
        const extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        return new AABox2(center, extents);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): AABox2 {
        const center = Vector2.fromArray(data, offset);
        const extents = Vector2.fromArray(data, offset + 2);

        return new AABox2(center, extents);
    }

    public static fromObject(obj: AABox2Like): AABox2 {
        const center = Vector2.fromObject(obj.center);
        const extents = Vector2.fromObject(obj.extents);

        return new AABox2(center, extents);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number): AABox2 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);

        const center = new Vector2(x0 + ex, y0 + ey);
        const extents = new Vector2(ex, ey);

        return new AABox2(center, extents);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number): AABox2 {
        const center = new Vector2(x, y);
        const extents = new Vector2(0.5 * w, 0.5 * h);

        return new AABox2(center, extents);
    }

    public static toObject(box: ReadonlyAABox2): AABox2Like {
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

    public clone(): AABox2 {
        return new AABox2(this.center, this.extents);
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

    public intersects(box: ReadonlyAABox2, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number): AABox2 {
        const extents = new Vector2(this.extents.x + sx, this.extents.y + sy);
        return new AABox2(this.center, extents);
    }

    public scaleRel(sx: number, sy: number): AABox2 {
        const extents = new Vector2(this.extents.x * sx, this.extents.y * sy);
        return new AABox2(this.center, extents);
    }

    public set(center: ReadonlyVector2, extents: ReadonlyVector2): void {
        this.center = center;
        this.extents = extents;
    }

    public setEnclosePoint(box: ReadonlyAABox2, p: ReadonlyVector2): void {
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

    public setUnion(box1: ReadonlyAABox2, box2: ReadonlyAABox2): void {
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

    public toBox(): Box2 {
        return new Box2(this.minX(), this.minY(), this.maxX(), this.maxY());
    }

    public toOBox(): OBox2 {
        return new OBox2(this.center, this.extents, Complex.IDENTITY);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}}`;
    }
}

export class AABox3 implements ReadonlyAABox3 {
    public center: ReadonlyVector3;
    public extents: ReadonlyVector3;

    public constructor(center: ReadonlyVector3, extents: ReadonlyVector3) {
        this.center = center;
        this.extents = extents;
    }

    public static createEmpty(): AABox3 {
        const center = Vector3.createZero();
        const extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        return new AABox3(center, extents);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): AABox3 {
        const center = Vector3.fromArray(data, offset);
        const extents = Vector3.fromArray(data, offset + 2);

        return new AABox3(center, extents);
    }

    public static fromObject(obj: AABox3Like): AABox3 {
        const center = Vector3.fromObject(obj.center);
        const extents = Vector3.fromObject(obj.extents);

        return new AABox3(center, extents);
    }

    public static fromXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): AABox3 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);
        const ez = 0.5 * (z1 - z0);

        const center = new Vector3(x0 + ex, y0 + ey, z0 + ez);
        const extents = new Vector3(ex, ey, ez);

        return new AABox3(center, extents);
    }

    public static fromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): AABox3 {
        const center = new Vector3(x, y, z);
        const extents = new Vector3(0.5 * w, 0.5 * h, 0.5 * d);

        return new AABox3(center, extents);
    }

    public static toObject(box: ReadonlyAABox3): AABox3Like {
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

    public clone(): AABox3 {
        return new AABox3(this.center, this.extents);
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

    public intersects(box: ReadonlyAABox3, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number, sz: number): AABox3 {
        const extents = new Vector3(this.extents.x + sx, this.extents.y + sy, this.extents.z + sz);
        return new AABox3(this.center, extents);
    }

    public scaleRel(sx: number, sy: number, sz: number): AABox3 {
        const extents = new Vector3(this.extents.x * sx, this.extents.y * sy, this.extents.z * sz);
        return new AABox3(this.center, extents);
    }

    public set(center: ReadonlyVector3, extents: ReadonlyVector3): void {
        this.center = center;
        this.extents = extents;
    }

    public setEnclosePoint(box: ReadonlyAABox3, p: ReadonlyVector3): void {
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

    public setUnion(box1: ReadonlyAABox3, box2: ReadonlyAABox3): void {
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

    public toBox(): Box3 {
        return new Box3(this.minX(), this.minY(), this.minZ(), this.maxX(), this.maxY(), this.maxZ());
    }

    public toOBox(): OBox3 {
        return new OBox3(this.center, this.extents, Quaternion.IDENTITY);
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}}`;
    }
}

export class OBox2 implements ReadonlyOBox2 {
    public center: ReadonlyVector2;
    public extents: ReadonlyVector2;
    public rotation: ReadonlyComplex;

    public constructor(center: ReadonlyVector2, extents: ReadonlyVector2, rotation: ReadonlyComplex) {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public static createEmpty(): OBox2 {
        const center = Vector2.createZero();
        const extents = new Vector2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        const rotation = Complex.createIdentity();

        return new OBox2(center, extents, rotation);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): OBox2 {
        const center = Vector2.fromArray(data, offset);
        const extents = Vector2.fromArray(data, offset + 2);
        const rotation = Complex.fromArray(data, offset + 4);

        return new OBox2(center, extents, rotation);
    }

    public static fromObject(obj: OBox2Like): OBox2 {
        const center = Vector2.fromObject(obj.center);
        const extents = Vector2.fromObject(obj.extents);
        const rotation = Complex.fromObject(obj.rotation);

        return new OBox2(center, extents, rotation);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number, rotation: ReadonlyComplex): OBox2 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);

        const center = new Vector2(x0 + ex, y0 + ey);
        const extents = new Vector2(ex, ey);

        return new OBox2(center, extents, rotation);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number, rotation: ReadonlyComplex): OBox2 {
        const center = new Vector2(x, y);
        const extents = new Vector2(0.5 * w, 0.5 * h);

        return new OBox2(center, extents, rotation);
    }

    public static toObject(box: ReadonlyOBox2): OBox2Like {
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

    public clone(): OBox2 {
        return new OBox2(this.center, this.extents, this.rotation);
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

    public intersects(box: OBox2, eps: number): boolean {
        const va1 = this.axisX();
        const va2 = box.axisX();

        return (
            this.intersectsOnAxis(box, va1, eps) &&
            this.intersectsOnAxis(box, va2, eps) &&
            this.intersectsOnAxis(box, va1.normal(), eps) &&
            this.intersectsOnAxis(box, va2.normal(), eps)
        );
    }

    public intersectsOnAxis(box: OBox2, axis: Vector2, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number): OBox2 {
        const extents = new Vector2(this.extents.x + sx, this.extents.y + sy);
        return new OBox2(this.center, extents, this.rotation);
    }

    public scaleRel(sx: number, sy: number): OBox2 {
        const extents = new Vector2(this.extents.x * sx, this.extents.y * sy);
        return new OBox2(this.center, extents, this.rotation);
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

    public toAABox(): AABox2 {
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

        return AABox2.fromXY(x0, y0, x1, y1);
    }

    public toArray(): FixedSizeArray<number, 6> {
        const pc = this.center;
        const ve = this.extents;
        const qr = this.rotation;

        return [pc.x, pc.y, ve.x, ve.y, qr.a, qr.b];
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}, rotation: ${this.rotation}}`;
    }
}

export class OBox3 implements ReadonlyOBox3 {
    public center: ReadonlyVector3;
    public extents: ReadonlyVector3;
    public rotation: ReadonlyQuaternion;

    public constructor(center: ReadonlyVector3, extents: ReadonlyVector3, rotation: ReadonlyQuaternion) {
        this.center = center;
        this.extents = extents;
        this.rotation = rotation;
    }

    public static createEmpty(): OBox3 {
        const center = Vector3.createZero();
        const extents = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        const rotation = Quaternion.createIdentity();

        return new OBox3(center, extents, rotation);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): OBox3 {
        const center = Vector3.fromArray(data, offset);
        const extents = Vector3.fromArray(data, offset + 3);
        const rotation = Quaternion.fromArray(data, offset + 6);

        return new OBox3(center, extents, rotation);
    }

    public static fromObject(obj: OBox3Like): OBox3 {
        const center = Vector3.fromObject(obj.center);
        const extents = Vector3.fromObject(obj.extents);
        const rotation = Quaternion.fromObject(obj.rotation);

        return new OBox3(center, extents, rotation);
    }

    public static fromXYZ(
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
        rotation: ReadonlyQuaternion,
    ): OBox3 {
        const ex = 0.5 * (x1 - x0);
        const ey = 0.5 * (y1 - y0);
        const ez = 0.5 * (z1 - z0);

        const center = new Vector3(x0 + ex, y0 + ey, z0 + ez);
        const extents = new Vector3(ex, ey, ez);

        return new OBox3(center, extents, rotation);
    }

    public static fromXYZWHD(
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        rotation: ReadonlyQuaternion,
    ): OBox3 {
        const center = new Vector3(x, y, z);
        const extents = new Vector3(0.5 * w, 0.5 * h, 0.5 * d);

        return new OBox3(center, extents, rotation);
    }

    public static toObject(box: ReadonlyOBox3): OBox3Like {
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

    public clone(): OBox3 {
        return new OBox3(this.center, this.extents, this.rotation);
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

    public intersects(box: OBox3, eps: number): boolean {
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

    public intersectsOnAxis(box: OBox3, axis: Vector3, eps: number): boolean {
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

    public scaleAbs(sx: number, sy: number, sz: number): OBox3 {
        const extents = new Vector3(this.extents.x + sx, this.extents.y + sy, this.extents.z + sz);
        return new OBox3(this.center, extents, this.rotation);
    }

    public scaleRel(sx: number, sy: number, sz: number): OBox3 {
        const extents = new Vector3(this.extents.x * sx, this.extents.y * sy, this.extents.z * sz);
        return new OBox3(this.center, extents, this.rotation);
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

    public toAABox(): AABox3 {
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

        return AABox3.fromXYZ(x0, y0, z0, x1, y1, z1);
    }

    public toArray(): FixedSizeArray<number, 10> {
        const pc = this.center;
        const ve = this.extents;
        const qr = this.rotation;

        return [pc.x, pc.y, pc.z, ve.x, ve.y, ve.z, qr.a, qr.b, qr.c, qr.d];
    }

    public toString(): string {
        return `{center: ${this.center}, extents: ${this.extents}, rotation: ${this.rotation}}`;
    }
}
