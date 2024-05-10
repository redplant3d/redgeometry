import { Point2, Point3 } from "./point.js";
import { Vector2, Vector3 } from "./vector.js";

export class Ray2 {
    public p: Point2;
    public v: Vector2;

    constructor(p: Point2, v: Vector2) {
        this.p = p;
        this.v = v;
    }

    public static from(obj: { p: Point2; v: Vector2 }): Ray2 {
        return new Ray2(obj.p, obj.v);
    }

    public static fromPoints(p0: Point2, p1: Point2): Ray2 {
        const v = p1.sub(p0);
        return new Ray2(p0, v);
    }

    public static fromXY(px: number, py: number, vx: number, vy: number): Ray2 {
        const p = new Point2(px, py);
        const v = new Vector2(vx, vy);
        return new Ray2(p, v);
    }

    public clone(): Ray2 {
        return new Ray2(this.p.clone(), this.v.clone());
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the ray.
     */
    public getParameterFromPoint(p: Point2): number {
        const v1 = this.v;
        const v2 = p.sub(this.p);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the signed distance to where a point `p` is orthogonal to the ray.
     */
    public getSignedDistanceFromPoint(p: Point2): number {
        const v1 = this.v;
        const v2 = this.p.sub(p);
        return v1.cross(v2) / v1.len();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Point2 {
        return this.p.addMul(this.v, t);
    }

    public normal(): Ray2 {
        return new Ray2(this.p, this.v.normal());
    }

    public reverse(): Ray2 {
        return new Ray2(this.p, this.v.neg());
    }

    public toString(): string {
        return `{p: ${this.p}, p: ${this.p}}`;
    }

    public translate(v: Vector2): Ray2 {
        return new Ray2(this.p.add(v), this.v);
    }
}

export class Ray3 {
    public p: Point3;
    public v: Vector3;

    constructor(p: Point3, v: Vector3) {
        this.p = p;
        this.v = v;
    }

    public static from(obj: { p: Point3; v: Vector3 }): Ray3 {
        return new Ray3(obj.p, obj.v);
    }

    public static fromPoints(p0: Point3, p1: Point3): Ray3 {
        const v = p1.sub(p0);
        return new Ray3(p0, v);
    }

    public static fromXYZ(px: number, py: number, pz: number, vx: number, vy: number, vz: number): Ray3 {
        const p = new Point3(px, py, pz);
        const v = new Vector3(vx, vy, vz);
        return new Ray3(p, v);
    }

    public clone(): Ray3 {
        return new Ray3(this.p.clone(), this.v.clone());
    }

    /**
     * Returns the distance to where a point `p` is orthogonal to the ray.
     */
    public getDistanceFromPoint(p: Point3): number {
        const v1 = this.v;
        const v2 = this.p.sub(p);
        return v1.cross(v2).len() / v1.len();
    }

    public getNormalAround(v: Vector3): Ray3 {
        return new Ray3(this.p, this.v.cross(v));
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the ray.
     */
    public getParameterFromPoint(p: Point3): number {
        const v1 = this.v;
        const v2 = p.sub(this.p);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Point3 {
        return this.p.addMul(this.v, t);
    }

    public isFinite(): boolean {
        return this.p.isFinite() && this.v.isFinite();
    }

    public reverse(): Ray3 {
        return new Ray3(this.p, this.v.neg());
    }

    public toString(): string {
        return `{p: ${this.p}, p: ${this.p}}`;
    }

    public translate(v: Vector3): Ray3 {
        return new Ray3(this.p.add(v), this.v);
    }
}
