import type { Matrix3, Matrix3A, Matrix4, Matrix4A } from "./matrix.js";
import { Point2, Point3 } from "./point.js";
import type { Ray2, Ray3 } from "./ray.js";

export class Box2 {
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

    public static fromArray(data: number[], offset = 0): Box2 {
        return new Box2(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
    }

    public static fromObject(obj: { x0: number; y0: number; x1: number; y1: number }): Box2 {
        return new Box2(obj.x0, obj.y0, obj.x1, obj.y1);
    }

    public static fromPoints(p0: Point2, p1: Point2): Box2 {
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

    public static toObject(box: Box2): { x0: number; y0: number; x1: number; y1: number } {
        return { x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 };
    }

    /**
     * Returns the Minkowski sum of the boxes.
     */
    public addMinkowski(box: Box2): Box2 {
        const x0 = this.x0 - box.x1;
        const y0 = this.y0 - box.y1;
        const x1 = this.x1 - box.x0;
        const y1 = this.y1 - box.y0;

        return new Box2(x0, y0, x1, y1);
    }

    public clone(): Box2 {
        return new Box2(this.x0, this.y0, this.x1, this.y1);
    }

    public contains(p: Point2): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.x1 > p.x && this.y1 > p.y;
    }

    public containsInclusive(p: Point2): boolean {
        return this.x0 <= p.x && this.y0 <= p.y && this.x1 >= p.x && this.y1 >= p.y;
    }

    public dx(): number {
        return this.x1 - this.x0;
    }

    public dy(): number {
        return this.y1 - this.y0;
    }

    public enclose(p: Point2): void {
        this.x0 = Math.min(this.x0, p.x);
        this.y0 = Math.min(this.y0, p.y);
        this.x1 = Math.max(this.x1, p.x);
        this.y1 = Math.max(this.y1, p.y);
    }

    public encloseWithTransform(p: Point2, mat: Matrix3 | Matrix3A): void {
        const pp = mat.mulP(p);
        this.enclose(pp);
    }

    public getCenter(): Point2 {
        return new Point2(0.5 * (this.x0 + this.x1), 0.5 * (this.y0 + this.y1));
    }

    public intersects(b: Box2): boolean {
        return this.x0 < b.x1 && this.x1 > b.x0 && this.y0 < b.y1 && this.y1 > b.y0;
    }

    public intersectsInclusive(b: Box2): boolean {
        return this.x0 <= b.x1 && this.x1 >= b.x0 && this.y0 <= b.y1 && this.y1 >= b.y0;
    }

    public intersectsRay(ray: Ray2): boolean {
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

    /**
     * Returns the Minkowski difference of the boxes.
     */
    public subMinkowski(box: Box2): Box2 {
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

    public transform(mat: Matrix3 | Matrix3A): Box2 {
        const box = Box2.createEmpty();

        box.encloseWithTransform(new Point2(this.x0, this.y0), mat);
        box.encloseWithTransform(new Point2(this.x0, this.y1), mat);
        box.encloseWithTransform(new Point2(this.x1, this.y0), mat);
        box.encloseWithTransform(new Point2(this.x1, this.y1), mat);

        return box;
    }

    public union(b: Box2): void {
        this.x0 = Math.min(this.x0, b.x0);
        this.y0 = Math.min(this.y0, b.y0);
        this.x1 = Math.max(this.x1, b.x1);
        this.y1 = Math.max(this.y1, b.y1);
    }
}

export class Box3 {
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

    public static fromArray(data: number[], offset = 0): Box3 {
        return new Box3(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
            data[offset + 4],
            data[offset + 5],
        );
    }

    public static fromObject(obj: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }): Box3 {
        return new Box3(obj.x0, obj.y0, obj.z0, obj.x1, obj.y1, obj.z1);
    }

    public static fromPoints(p0: Point3, p1: Point3): Box3 {
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

    public static toObject(box: Box3): { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number } {
        return { x0: box.x0, y0: box.y0, z0: box.z0, x1: box.x1, y1: box.y1, z1: box.z1 };
    }

    /**
     * Returns the Minkowski sum of the boxes.
     */
    public addMinkowski(box: Box3): Box3 {
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

    public contains(p: Point3): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.z0 < p.z && this.x1 > p.x && this.y1 > p.y && this.z1 > p.z;
    }

    public containsInclusive(p: Point3): boolean {
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

    public enclose(p: Point3): void {
        this.x0 = Math.min(this.x0, p.x);
        this.y0 = Math.min(this.y0, p.y);
        this.z0 = Math.min(this.z0, p.z);
        this.x1 = Math.max(this.x1, p.x);
        this.y1 = Math.max(this.y1, p.y);
        this.z1 = Math.max(this.z1, p.z);
    }

    public encloseWithTransform(p: Point3, mat: Matrix4 | Matrix4A): void {
        const pp = mat.mulP(p);
        this.enclose(pp);
    }

    public getCenter(): Point3 {
        return new Point3(0.5 * (this.x0 + this.x1), 0.5 * (this.y0 + this.y1), 0.5 * (this.z0 + this.z1));
    }

    public intersects(b: Box3): boolean {
        return this.x0 < b.x1 && this.x1 > b.x0 && this.y0 < b.y1 && this.y1 > b.y0 && this.z0 < b.z1 && this.z1 > b.z0;
    }

    public intersectsInclusive(b: Box3): boolean {
        return (
            this.x0 <= b.x1 &&
            this.x1 >= b.x0 &&
            this.y0 <= b.y1 &&
            this.y1 >= b.y0 &&
            this.z0 <= b.z1 &&
            this.z1 >= b.z0
        );
    }

    public intersectsRay(ray: Ray3): boolean {
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

    /**
     * Returns the Minkowski difference of the boxes.
     */
    public subMinkowski(box: Box3): Box3 {
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

    public transform(mat: Matrix4 | Matrix4A): Box3 {
        const box = Box3.createEmpty();

        box.encloseWithTransform(new Point3(this.x0, this.y0, this.z0), mat);
        box.encloseWithTransform(new Point3(this.x0, this.y0, this.z1), mat);
        box.encloseWithTransform(new Point3(this.x0, this.y1, this.z0), mat);
        box.encloseWithTransform(new Point3(this.x0, this.y1, this.z1), mat);
        box.encloseWithTransform(new Point3(this.x1, this.y0, this.z0), mat);
        box.encloseWithTransform(new Point3(this.x1, this.y0, this.z1), mat);
        box.encloseWithTransform(new Point3(this.x1, this.y1, this.z0), mat);
        box.encloseWithTransform(new Point3(this.x1, this.y1, this.z1), mat);

        return box;
    }

    public union(b: Box3): void {
        this.x0 = Math.min(this.x0, b.x0);
        this.y0 = Math.min(this.y0, b.y0);
        this.z0 = Math.min(this.z0, b.z0);
        this.x1 = Math.max(this.x1, b.x1);
        this.y1 = Math.max(this.y1, b.y1);
        this.z1 = Math.max(this.z1, b.z1);
    }
}
