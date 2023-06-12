import { Point2, Point3 } from "./point.js";

export class Box2 {
    public x0: number;
    public x1: number;
    public y0: number;
    public y1: number;

    constructor(x0: number, y0: number, x1: number, y1: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
    }

    public static get empty(): Box2 {
        return new Box2(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );
    }

    public get dx(): number {
        return this.x1 - this.x0;
    }

    public get dy(): number {
        return this.y1 - this.y0;
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

    public contains(p: Point2): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.x1 > p.x && this.y1 > p.y;
    }

    public containsInclusive(p: Point2): boolean {
        return this.x0 <= p.x && this.y0 <= p.y && this.x1 >= p.x && this.y1 >= p.y;
    }

    public enclose(p: Point2): void {
        this.x0 = Math.min(this.x0, p.x);
        this.y0 = Math.min(this.y0, p.y);
        this.x1 = Math.max(this.x1, p.x);
        this.y1 = Math.max(this.y1, p.y);
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

    public isEmpty(): boolean {
        return this.x0 > this.x1 || this.y0 > this.y1;
    }

    public isPoint(): boolean {
        return this.x0 === this.x1 && this.y0 === this.y1;
    }

    public scale(fx: number, fy: number): Box2 {
        const dx = 0.5 * (fx - 1) * this.dx;
        const dy = 0.5 * (fy - 1) * this.dy;

        return this.scaleAbsolute(dx, dy);
    }

    public scaleAbsolute(dx: number, dy: number): Box2 {
        return new Box2(this.x0 - dx, this.y0 - dy, this.x1 + dx, this.y1 + dy);
    }

    public toString(): string {
        return `{x0: ${this.x0}, y0: ${this.y0}, x1: ${this.x1}, y1: ${this.y1}}`;
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

    constructor(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.x1 = x1;
        this.y1 = y1;
        this.z1 = z1;
    }

    public static get empty(): Box3 {
        return new Box3(
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            Number.NEGATIVE_INFINITY
        );
    }

    public get dx(): number {
        return this.x1 - this.x0;
    }

    public get dy(): number {
        return this.y1 - this.y0;
    }

    public get dz(): number {
        return this.z1 - this.z0;
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

    public contains(p: Point3): boolean {
        return this.x0 < p.x && this.y0 < p.y && this.z0 < p.z && this.x1 > p.x && this.y1 > p.y && this.z1 > p.z;
    }

    public containsInclusive(p: Point3): boolean {
        return this.x0 <= p.x && this.y0 <= p.y && this.z0 <= p.z && this.x1 >= p.x && this.y1 >= p.y && this.z1 >= p.z;
    }

    public enclose(p: Point3): void {
        this.x0 = Math.min(this.x0, p.x);
        this.y0 = Math.min(this.y0, p.y);
        this.z0 = Math.min(this.z0, p.z);
        this.x1 = Math.max(this.x1, p.x);
        this.y1 = Math.max(this.y1, p.y);
        this.z1 = Math.max(this.z1, p.z);
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

    public isEmpty(): boolean {
        return this.x0 > this.x1 || this.y0 > this.y1 || this.z0 > this.z1;
    }

    public isPoint(): boolean {
        return this.x0 === this.x1 && this.y0 === this.y1 && this.z0 === this.z1;
    }

    public scale(fx: number, fy: number, fz: number): Box3 {
        const dx = 0.5 * (fx - 1) * this.dx;
        const dy = 0.5 * (fy - 1) * this.dy;
        const dz = 0.5 * (fz - 1) * this.dz;

        return this.scaleAbsolute(dx, dy, dz);
    }

    public scaleAbsolute(dx: number, dy: number, dz: number): Box3 {
        return new Box3(this.x0 - dx, this.y0 - dy, this.z0 - dz, this.x1 + dx, this.y1 + dy, this.z1 + dz);
    }

    public toString(): string {
        return `{x0: ${this.x0}, y0: ${this.y0}, z0: ${this.z0}, x1: ${this.x1}, y1: ${this.y1}}, z1: ${this.z1}}`;
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
