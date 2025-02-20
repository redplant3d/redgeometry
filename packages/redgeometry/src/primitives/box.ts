import type { ReadonlyMatrix3, ReadonlyMatrix3A, ReadonlyMatrix4, ReadonlyMatrix4A } from "./matrix.js";
import type { ReadonlyRay2, ReadonlyRay3 } from "./ray.js";
import { Vector2, Vector3, type ReadonlyVector2, type ReadonlyVector3 } from "./vector.js";

export type Box2Like = {
    readonly x0: number;
    readonly x1: number;
    readonly y0: number;
    readonly y1: number;
};

export type Box3Like = {
    readonly x0: number;
    readonly x1: number;
    readonly y0: number;
    readonly y1: number;
    readonly z0: number;
    readonly z1: number;
};

export interface ReadonlyBox2 {
    readonly x0: number;
    readonly x1: number;
    readonly y0: number;
    readonly y1: number;

    addMinkowski(box: ReadonlyBox2): Box2;
    clone(): Box2;
    contains(p: ReadonlyVector2): boolean;
    containsInclusive(p: ReadonlyVector2): boolean;
    dx(): number;
    dy(): number;
    getCenter(): Vector2;
    intersects(b: ReadonlyBox2): boolean;
    intersectsInclusive(b: ReadonlyBox2): boolean;
    intersectsRay(ray: ReadonlyRay2): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scale(fx: number, fy: number): Box2;
    scaleAbsolute(dx: number, dy: number): Box2;
    subMinkowski(box: ReadonlyBox2): Box2;
    toArray(): [number, number, number, number];
    toString(): string;
    transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): Box2;
}

export interface ReadonlyBox3 {
    readonly x0: number;
    readonly x1: number;
    readonly y0: number;
    readonly y1: number;
    readonly z0: number;
    readonly z1: number;

    addMinkowski(box: ReadonlyBox3): Box3;
    clone(): Box3;
    contains(p: ReadonlyVector3): boolean;
    containsInclusive(p: ReadonlyVector3): boolean;
    dx(): number;
    dy(): number;
    dz(): number;
    getCenter(): Vector3;
    intersects(b: ReadonlyBox3): boolean;
    intersectsInclusive(b: ReadonlyBox3): boolean;
    intersectsRay(ray: ReadonlyRay3): boolean;
    isEmpty(): boolean;
    isPoint(): boolean;
    scale(fx: number, fy: number, fz: number): Box3;
    scaleAbsolute(dx: number, dy: number, dz: number): Box3;
    subMinkowski(box: ReadonlyBox3): Box3;
    toArray(): [number, number, number, number, number, number];
    toString(): string;
    transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): Box3;
}

export class Box2 implements ReadonlyBox2 {
    public x0: number;
    public x1: number;
    public y0: number;
    public y1: number;

    public constructor(x0: number, y0: number, x1: number, y1: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
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
        return new Box2(obj.x0, obj.y0, obj.x1, obj.y1);
    }

    public static fromPoints(p0: ReadonlyVector2, p1: ReadonlyVector2): Box2 {
        const x0 = Math.min(p0.x, p1.x);
        const y0 = Math.min(p0.y, p1.y);
        const x1 = Math.max(p0.x, p1.x);
        const y1 = Math.max(p0.y, p1.y);

        return new Box2(x0, y0, x1, y1);
    }

    public static fromXYWH(x: number, y: number, w: number, h: number): Box2 {
        const x0 = Math.min(x, x + w);
        const y0 = Math.min(y, y + h);
        const x1 = Math.max(x, x + w);
        const y1 = Math.max(y, y + h);

        return new Box2(x0, y0, x1, y1);
    }

    public static toObject(box: ReadonlyBox2): Box2Like {
        return { x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 };
    }

    /**
     * Returns the Minkowski sum of the boxes.
     */
    public addMinkowski(box: ReadonlyBox2): Box2 {
        const x0 = this.x0 - box.x1;
        const y0 = this.y0 - box.y1;
        const x1 = this.x1 - box.x0;
        const y1 = this.y1 - box.y0;

        return new Box2(x0, y0, x1, y1);
    }

    public clone(): Box2 {
        return new Box2(this.x0, this.y0, this.x1, this.y1);
    }

    public contains(p: ReadonlyVector2): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.x1 > p.x && this.y1 > p.y;
    }

    public containsInclusive(p: ReadonlyVector2): boolean {
        return this.x0 <= p.x && this.y0 <= p.y && this.x1 >= p.x && this.y1 >= p.y;
    }

    public dx(): number {
        return this.x1 - this.x0;
    }

    public dy(): number {
        return this.y1 - this.y0;
    }

    public getCenter(): Vector2 {
        return new Vector2(0.5 * (this.x0 + this.x1), 0.5 * (this.y0 + this.y1));
    }

    public intersects(b: ReadonlyBox2): boolean {
        return this.x0 < b.x1 && this.x1 > b.x0 && this.y0 < b.y1 && this.y1 > b.y0;
    }

    public intersectsInclusive(b: ReadonlyBox2): boolean {
        return this.x0 <= b.x1 && this.x1 >= b.x0 && this.y0 <= b.y1 && this.y1 >= b.y0;
    }

    public intersectsRay(ray: ReadonlyRay2): boolean {
        let tmin = Number.NEGATIVE_INFINITY;
        let tmax = Number.POSITIVE_INFINITY;

        let d = 1 / ray.v.x;
        let t0 = (this.x0 - ray.p.x) * d;
        let t1 = (this.x1 - ray.p.x) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.v.y;
        t0 = (this.y0 - ray.p.y) * d;
        t1 = (this.y1 - ray.p.y) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        return tmin < tmax;
    }

    public isEmpty(): boolean {
        return this.x0 > this.x1 || this.y0 > this.y1;
    }

    public isPoint(): boolean {
        return this.x0 === this.x1 && this.y0 === this.y1;
    }

    public scale(fx: number, fy: number): Box2 {
        const dx = 0.5 * (fx - 1) * this.dx();
        const dy = 0.5 * (fy - 1) * this.dy();

        return this.scaleAbsolute(dx, dy);
    }

    public scaleAbsolute(dx: number, dy: number): Box2 {
        return new Box2(this.x0 - dx, this.y0 - dy, this.x1 + dx, this.y1 + dy);
    }

    public set(x0: number, y0: number, x1: number, y1: number): void {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
    }

    public setEnclose(box: ReadonlyBox2, p: ReadonlyVector2): void {
        this.x0 = Math.min(box.x0, p.x);
        this.y0 = Math.min(box.y0, p.y);
        this.x1 = Math.max(box.x1, p.x);
        this.y1 = Math.max(box.y1, p.y);
    }

    public setEncloseWithTransform(
        box: ReadonlyBox2,
        p: ReadonlyVector2,
        mat: ReadonlyMatrix3 | ReadonlyMatrix3A,
    ): void {
        const pp = mat.transformPoint(p);
        this.setEnclose(box, pp);
    }

    public setUnion(box1: ReadonlyBox2, box2: ReadonlyBox2): void {
        this.x0 = Math.min(box1.x0, box2.x0);
        this.y0 = Math.min(box1.y0, box2.y0);
        this.x1 = Math.max(box1.x1, box2.x1);
        this.y1 = Math.max(box1.y1, box2.y1);
    }

    /**
     * Returns the Minkowski difference of the boxes.
     */
    public subMinkowski(box: ReadonlyBox2): Box2 {
        const x0 = this.x0 + box.x1;
        const y0 = this.y0 + box.y1;
        const x1 = this.x1 + box.x0;
        const y1 = this.y1 + box.y0;

        return new Box2(x0, y0, x1, y1);
    }

    public toArray(): [number, number, number, number] {
        return [this.x0, this.y0, this.x1, this.y1];
    }

    public toString(): string {
        return `{x0: ${this.x0}, y0: ${this.y0}, x1: ${this.x1}, y1: ${this.y1}}`;
    }

    public transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): Box2 {
        const box = Box2.createEmpty();
        box.setEncloseWithTransform(box, new Vector2(this.x0, this.y0), mat);
        box.setEncloseWithTransform(box, new Vector2(this.x0, this.y1), mat);
        box.setEncloseWithTransform(box, new Vector2(this.x1, this.y0), mat);
        box.setEncloseWithTransform(box, new Vector2(this.x1, this.y1), mat);

        return box;
    }
}

export class Box3 implements ReadonlyBox3 {
    public x0: number;
    public x1: number;
    public y0: number;
    public y1: number;
    public z0: number;
    public z1: number;

    public constructor(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
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
        return new Box3(obj.x0, obj.y0, obj.z0, obj.x1, obj.y1, obj.z1);
    }

    public static fromPoints(p0: ReadonlyVector3, p1: ReadonlyVector3): Box3 {
        const x0 = Math.min(p0.x, p1.x);
        const y0 = Math.min(p0.y, p1.y);
        const z0 = Math.min(p0.z, p1.z);
        const x1 = Math.max(p0.x, p1.x);
        const y1 = Math.max(p0.y, p1.y);
        const z1 = Math.max(p0.z, p1.z);

        return new Box3(x0, y0, z0, x1, y1, z1);
    }

    public static fromXYZWHD(x: number, y: number, z: number, w: number, h: number, d: number): Box3 {
        const x0 = Math.min(x, x + w);
        const y0 = Math.min(y, y + h);
        const z0 = Math.min(z, z + d);
        const x1 = Math.max(x, x + w);
        const y1 = Math.max(y, y + h);
        const z1 = Math.max(z, z + d);

        return new Box3(x0, y0, z0, x1, y1, z1);
    }

    public static toObject(box: ReadonlyBox3): Box3Like {
        return { x0: box.x0, y0: box.y0, z0: box.z0, x1: box.x1, y1: box.y1, z1: box.z1 };
    }

    /**
     * Returns the Minkowski sum of the boxes.
     */
    public addMinkowski(box: ReadonlyBox3): Box3 {
        const x0 = this.x0 - box.x1;
        const y0 = this.y0 - box.y1;
        const z0 = this.z0 - box.z1;
        const x1 = this.x1 - box.x0;
        const y1 = this.y1 - box.y0;
        const z1 = this.z1 - box.z0;

        return new Box3(x0, y0, z0, x1, y1, z1);
    }

    public clone(): Box3 {
        return new Box3(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1);
    }

    public contains(p: ReadonlyVector3): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.z0 < p.z && this.x1 > p.x && this.y1 > p.y && this.z1 > p.z;
    }

    public containsInclusive(p: ReadonlyVector3): boolean {
        return this.x0 <= p.x && this.y0 <= p.y && this.z0 <= p.z && this.x1 >= p.x && this.y1 >= p.y && this.z1 >= p.z;
    }

    public dx(): number {
        return this.x1 - this.x0;
    }

    public dy(): number {
        return this.y1 - this.y0;
    }

    public dz(): number {
        return this.z1 - this.z0;
    }

    public getCenter(): Vector3 {
        return new Vector3(0.5 * (this.x0 + this.x1), 0.5 * (this.y0 + this.y1), 0.5 * (this.z0 + this.z1));
    }

    public intersects(b: ReadonlyBox3): boolean {
        return this.x0 < b.x1 && this.x1 > b.x0 && this.y0 < b.y1 && this.y1 > b.y0 && this.z0 < b.z1 && this.z1 > b.z0;
    }

    public intersectsInclusive(b: ReadonlyBox3): boolean {
        return (
            this.x0 <= b.x1 &&
            this.x1 >= b.x0 &&
            this.y0 <= b.y1 &&
            this.y1 >= b.y0 &&
            this.z0 <= b.z1 &&
            this.z1 >= b.z0
        );
    }

    public intersectsRay(ray: ReadonlyRay3): boolean {
        let tmin = Number.NEGATIVE_INFINITY;
        let tmax = Number.POSITIVE_INFINITY;

        let d = 1 / ray.v.x;
        let t0 = (this.x0 - ray.p.x) * d;
        let t1 = (this.x1 - ray.p.x) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.v.y;
        t0 = (this.y0 - ray.p.y) * d;
        t1 = (this.y1 - ray.p.y) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        d = 1 / ray.v.z;
        t0 = (this.z0 - ray.p.z) * d;
        t1 = (this.z1 - ray.p.z) * d;

        tmin = Math.max(Math.min(t0, t1), tmin);
        tmax = Math.min(Math.max(t0, t1), tmax);

        return tmin < tmax;
    }

    public isEmpty(): boolean {
        return this.x0 > this.x1 || this.y0 > this.y1 || this.z0 > this.z1;
    }

    public isPoint(): boolean {
        return this.x0 === this.x1 && this.y0 === this.y1 && this.z0 === this.z1;
    }

    public scale(fx: number, fy: number, fz: number): Box3 {
        const dx = 0.5 * (fx - 1) * this.dx();
        const dy = 0.5 * (fy - 1) * this.dy();
        const dz = 0.5 * (fz - 1) * this.dz();

        return this.scaleAbsolute(dx, dy, dz);
    }

    public scaleAbsolute(dx: number, dy: number, dz: number): Box3 {
        return new Box3(this.x0 - dx, this.y0 - dy, this.z0 - dz, this.x1 + dx, this.y1 + dy, this.z1 + dz);
    }

    public set(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
    }

    public setEnclose(box: ReadonlyBox3, p: ReadonlyVector3): void {
        this.x0 = Math.min(box.x0, p.x);
        this.y0 = Math.min(box.y0, p.y);
        this.z0 = Math.min(box.z0, p.z);
        this.x1 = Math.max(box.x1, p.x);
        this.y1 = Math.max(box.y1, p.y);
        this.z1 = Math.max(box.z1, p.z);
    }

    public setEncloseWithTransform(
        box: ReadonlyBox3,
        p: ReadonlyVector3,
        mat: ReadonlyMatrix4 | ReadonlyMatrix4A,
    ): void {
        const pp = mat.transformPoint(p);
        this.setEnclose(box, pp);
    }

    public setUnion(box1: ReadonlyBox3, box2: ReadonlyBox3): void {
        this.x0 = Math.min(box1.x0, box2.x0);
        this.y0 = Math.min(box1.y0, box2.y0);
        this.z0 = Math.min(box1.z0, box2.z0);
        this.x1 = Math.max(box1.x1, box2.x1);
        this.y1 = Math.max(box1.y1, box2.y1);
        this.z1 = Math.max(box1.z1, box2.z1);
    }

    /**
     * Returns the Minkowski difference of the boxes.
     */
    public subMinkowski(box: ReadonlyBox3): Box3 {
        const x0 = this.x0 + box.x1;
        const y0 = this.y0 + box.y1;
        const z0 = this.z0 + box.z1;
        const x1 = this.x1 + box.x0;
        const y1 = this.y1 + box.y0;
        const z1 = this.z1 + box.z0;

        return new Box3(x0, y0, z0, x1, y1, z1);
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.x0, this.y0, this.z0, this.x1, this.y1, this.z1];
    }

    public toString(): string {
        return `{x0: ${this.x0}, y0: ${this.y0}, z0: ${this.z0}, x1: ${this.x1}, y1: ${this.y1}}, z1: ${this.z1}}`;
    }

    public transform(mat: ReadonlyMatrix4 | ReadonlyMatrix4A): Box3 {
        const box = Box3.createEmpty();

        box.setEncloseWithTransform(box, new Vector3(this.x0, this.y0, this.z0), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x0, this.y0, this.z1), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x0, this.y1, this.z0), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x0, this.y1, this.z1), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x1, this.y0, this.z0), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x1, this.y0, this.z1), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x1, this.y1, this.z0), mat);
        box.setEncloseWithTransform(box, new Vector3(this.x1, this.y1, this.z1), mat);

        return box;
    }
}
