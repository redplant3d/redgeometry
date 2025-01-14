import { Vector2, Vector3, type Vector2Like, type Vector3Like } from "./vector.js";

export type Ray2Like = {
    readonly p: Vector2Like;
    readonly v: Vector2Like;
};

export type Ray3Like = {
    readonly p: Vector3Like;
    readonly v: Vector3Like;
};

export class Ray2 {
    public p: Vector2;
    public v: Vector2;

    constructor(p: Vector2, v: Vector2) {
        this.p = p;
        this.v = v;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Ray2 {
        const p = Vector2.fromArray(data, offset);
        const v = Vector2.fromArray(data, offset + 2);

        return new Ray2(p, v);
    }

    public static fromObject(obj: Ray2Like): Ray2 {
        const p = Vector2.fromObject(obj.p);
        const v = Vector2.fromObject(obj.v);
        return new Ray2(p, v);
    }

    public static fromPoints(p0: Vector2, p1: Vector2): Ray2 {
        const v = p1.sub(p0);
        return new Ray2(p0, v);
    }

    public static fromXY(px: number, py: number, vx: number, vy: number): Ray2 {
        const p = new Vector2(px, py);
        const v = new Vector2(vx, vy);
        return new Ray2(p, v);
    }

    public static getIntersection(ray1: Ray2, ray2: Ray2): Vector2 | undefined {
        const v1 = ray1.v;
        const v2 = ray2.v;
        const den = v1.cross(v2);

        if (den === 0) {
            // Rays are collinear
            return undefined;
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        const v = ray2.p.sub(ray1.p);
        const t = v.cross(ray2.v) / den;

        return ray1.getValueAt(t);
    }

    public static getIntersectionParameter(ray1: Ray2, ray2: Ray2): [number, number] {
        const v1 = ray1.v;
        const v2 = ray2.v;
        const den = v1.cross(v2);

        if (den === 0) {
            // Rays are collinear (TODO: Maybe return undefined)
            return [Number.NaN, Number.NaN];
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        // `u = (p2 − p1) cross v1 / (v1 cross v2)`
        const v = ray2.p.sub(ray1.p);
        const t = v.cross(v2) / den;
        const u = v.cross(v1) / den;

        return [t, u];
    }

    public static toObject(ray: Ray2): Ray2Like {
        const p = Vector2.toObject(ray.p);
        const v = Vector2.toObject(ray.v);
        return { p, v };
    }

    public clone(): Ray2 {
        return new Ray2(this.p.clone(), this.v.clone());
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the ray.
     */
    public getParameterFromPoint(p: Vector2): number {
        const v1 = this.v;
        const v2 = p.sub(this.p);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the signed distance to where a point `p` is orthogonal to the ray.
     */
    public getSignedDistanceFromPoint(p: Vector2): number {
        const v1 = this.v;
        const v2 = this.p.sub(p);
        return v1.cross(v2) / v1.len();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Vector2 {
        return this.p.addVMulS(this.v, t);
    }

    public normal(): Ray2 {
        return new Ray2(this.p, this.v.normal());
    }

    public reverse(): Ray2 {
        return new Ray2(this.p, this.v.neg());
    }

    public toArray(): [number, number, number, number] {
        return [this.p.x, this.p.y, this.v.x, this.v.y];
    }

    public toString(): string {
        return `{p: ${this.p}, p: ${this.p}}`;
    }

    public translate(v: Vector2): Ray2 {
        const p = this.p.addV(v);
        return new Ray2(p, this.v);
    }
}

export class Ray3 {
    public p: Vector3;
    public v: Vector3;

    constructor(p: Vector3, v: Vector3) {
        this.p = p;
        this.v = v;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Ray3 {
        const p = Vector3.fromArray(data, offset);
        const v = Vector3.fromArray(data, offset + 3);

        return new Ray3(p, v);
    }

    public static fromObject(obj: Ray3Like): Ray3 {
        const p = Vector3.fromObject(obj.p);
        const v = Vector3.fromObject(obj.v);
        return new Ray3(p, v);
    }

    public static fromPoints(p0: Vector3, p1: Vector3): Ray3 {
        const v = p1.sub(p0);
        return new Ray3(p0, v);
    }

    public static fromXYZ(px: number, py: number, pz: number, vx: number, vy: number, vz: number): Ray3 {
        const p = new Vector3(px, py, pz);
        const v = new Vector3(vx, vy, vz);
        return new Ray3(p, v);
    }

    /**
     * Returns the parameters of the closest points which lie on the rays `ray1` and `ray2`
     * or `undefined` if the rays are parallel.
     */
    public static getClosestParameter(ray1: Ray3, ray2: Ray3): [number, number] | undefined {
        // Reference: https://math.stackexchange.com/a/4764188
        // ```
        // p1 + t1 * v1 = p2 + t2 * v2
        // t1 * v1 - t2 * v2 = p2 - p1
        // ```
        const vc = ray1.v.cross(ray2.v);
        const den = vc.lenSq();

        if (den === 0) {
            // Rays are parallel
            return undefined;
        }

        // `v = p2 - p1`
        const v = ray2.p.sub(ray1.p);

        // We can elimate `t2` by applying the cross product with `v2` so that `v2 cross v2` vanishes:
        // ```
        // t1 * (v1 cross v2) - t2 * (v2 cross v2) = v cross v2
        // t1 * (v1 cross v2) = v cross v2
        // t1 * (v1 cross v2) dot (v1 cross v2) = (v cross v2) dot (v1 cross v2)
        // t1 = ((v cross v2) dot (v1 cross v2)) / ((v1 cross v2) dot (v1 cross v2))
        // ```
        const t1 = v.cross(ray2.v).dot(vc) / den;

        // Similarly, we eliminate `t1` and use the anticommutativity property of the cross product:
        // ```
        // t1 * (v1 cross v1) - t2 * (v2 cross v1) = v cross v1
        // t2 * (v1 cross v2) = v cross v1
        // t2 * (v1 cross v2) dot (v1 cross v2) = (v cross v1) dot (v1 cross v2)
        // t2 = ((v cross v1) dot (v1 cross v2)) / ((v1 cross v2) dot (v1 cross v2))
        // ```
        const t2 = v.cross(ray1.v).dot(vc) / den;

        return [t1, t2];
    }

    public static toObject(ray: Ray3): Ray3Like {
        const p = Vector3.toObject(ray.p);
        const v = Vector3.toObject(ray.v);
        return { p, v };
    }

    public clone(): Ray3 {
        return new Ray3(this.p.clone(), this.v.clone());
    }

    /**
     * Returns the distance to where a point `p` is orthogonal to the ray.
     */
    public getDistanceFromPoint(p: Vector3): number {
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
    public getParameterFromPoint(p: Vector3): number {
        const v1 = this.v;
        const v2 = p.sub(this.p);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Vector3 {
        return this.p.addVMulS(this.v, t);
    }

    public isFinite(): boolean {
        return this.p.isFinite() && this.v.isFinite();
    }

    public reverse(): Ray3 {
        return new Ray3(this.p, this.v.neg());
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.p.x, this.p.y, this.p.z, this.v.x, this.v.y, this.v.z];
    }

    public toString(): string {
        return `{p: ${this.p}, p: ${this.p}}`;
    }

    public translate(v: Vector3): Ray3 {
        const p = this.p.addV(v);
        return new Ray3(p, this.v);
    }
}
