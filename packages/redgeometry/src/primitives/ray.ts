import {
    Vector2,
    Vector3,
    type ReadonlyVector2,
    type ReadonlyVector3,
    type Vector2Like,
    type Vector3Like,
} from "./vector.js";

export type Ray2Like = {
    readonly origin: Vector2Like;
    readonly direction: Vector2Like;
};

export type Ray3Like = {
    readonly origin: Vector3Like;
    readonly direction: Vector3Like;
};

export interface ReadonlyRay2 {
    readonly direction: ReadonlyVector2;
    readonly origin: ReadonlyVector2;

    clone(): Ray2;
    getParameterFromPoint(p: ReadonlyVector2): number;
    getSignedDistanceFromPoint(p: ReadonlyVector2): number;
    getValueAt(t: number): Vector2;
    normal(): Ray2;
    reverse(): Ray2;
    toArray(): [number, number, number, number];
    toString(): string;
    translate(v: ReadonlyVector2): Ray2;
}

export interface ReadonlyRay3 {
    readonly direction: ReadonlyVector3;
    readonly origin: ReadonlyVector3;

    clone(): Ray3;
    getDistanceFromPoint(p: ReadonlyVector3): number;
    getNormalAround(v: ReadonlyVector3): Ray3;
    getParameterFromPoint(p: ReadonlyVector3): number;
    getValueAt(t: number): Vector3;
    isFinite(): boolean;
    reverse(): Ray3;
    toArray(): [number, number, number, number, number, number];
    toString(): string;
    translate(v: ReadonlyVector3): Ray3;
}

export class Ray2 implements ReadonlyRay2 {
    public direction: ReadonlyVector2;
    public origin: ReadonlyVector2;

    public constructor(origin: ReadonlyVector2, direction: ReadonlyVector2) {
        this.origin = origin;
        this.direction = direction;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Ray2 {
        const origin = Vector2.fromArray(data, offset);
        const direction = Vector2.fromArray(data, offset + 2);

        return new Ray2(origin, direction);
    }

    public static fromObject(obj: Ray2Like): Ray2 {
        const origin = Vector2.fromObject(obj.origin);
        const direction = Vector2.fromObject(obj.direction);
        return new Ray2(origin, direction);
    }

    public static fromPoints(p0: Vector2, p1: Vector2): Ray2 {
        const v = p1.sub(p0);
        return new Ray2(p0, v);
    }

    public static fromXY(px: number, py: number, vx: number, vy: number): Ray2 {
        const origin = new Vector2(px, py);
        const direction = new Vector2(vx, vy);
        return new Ray2(origin, direction);
    }

    public static getIntersection(ray1: ReadonlyRay2, ray2: ReadonlyRay2): Vector2 | undefined {
        const v1 = ray1.direction;
        const v2 = ray2.direction;
        const den = v1.cross(v2);

        if (den === 0) {
            // Rays are collinear
            return undefined;
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        const v = ray2.origin.sub(ray1.origin);
        const t = v.cross(ray2.direction) / den;

        return ray1.getValueAt(t);
    }

    public static getIntersectionParameter(ray1: ReadonlyRay2, ray2: ReadonlyRay2): [number, number] {
        const v1 = ray1.direction;
        const v2 = ray2.direction;
        const den = v1.cross(v2);

        if (den === 0) {
            // Rays are collinear (TODO: Maybe return undefined)
            return [Number.NaN, Number.NaN];
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        // `u = (p2 − p1) cross v1 / (v1 cross v2)`
        const v = ray2.origin.sub(ray1.origin);
        const t = v.cross(v2) / den;
        const u = v.cross(v1) / den;

        return [t, u];
    }

    public static toObject(ray: ReadonlyRay2): Ray2Like {
        const origin = Vector2.toObject(ray.origin);
        const direction = Vector2.toObject(ray.direction);
        return { origin, direction };
    }

    public clone(): Ray2 {
        return new Ray2(this.origin, this.direction);
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the ray.
     */
    public getParameterFromPoint(p: ReadonlyVector2): number {
        const v1 = this.direction;
        const v2 = p.sub(this.origin);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the signed distance to where a point `p` is orthogonal to the ray.
     */
    public getSignedDistanceFromPoint(p: ReadonlyVector2): number {
        const v1 = this.direction;
        const v2 = this.origin.sub(p);
        return v1.cross(v2) / v1.len();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Vector2 {
        return this.origin.addMulS(this.direction, t);
    }

    public normal(): Ray2 {
        return new Ray2(this.origin, this.direction.normal());
    }

    public reverse(): Ray2 {
        return new Ray2(this.origin, this.direction.neg());
    }

    public set(origin: Vector2, direction: Vector2): void {
        this.origin = origin;
        this.direction = direction;
    }

    public setFrom(ray: ReadonlyRay2): void {
        this.origin = ray.origin;
        this.direction = ray.direction;
    }

    public setXY(px: number, py: number, vx: number, vy: number): void {
        this.origin = new Vector2(px, py);
        this.direction = new Vector2(vx, vy);
    }

    public toArray(): [number, number, number, number] {
        return [this.origin.x, this.origin.y, this.direction.x, this.direction.y];
    }

    public toString(): string {
        return "{origin: " + this.origin.toString() + ", direction: " + this.direction.toString() + "}";
    }

    public translate(v: ReadonlyVector2): Ray2 {
        const origin = this.origin.add(v);
        return new Ray2(origin, this.direction);
    }
}

export class Ray3 implements ReadonlyRay3 {
    public direction: ReadonlyVector3;
    public origin: ReadonlyVector3;

    public constructor(origin: ReadonlyVector3, direction: ReadonlyVector3) {
        this.origin = origin;
        this.direction = direction;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Ray3 {
        const origin = Vector3.fromArray(data, offset);
        const direction = Vector3.fromArray(data, offset + 3);

        return new Ray3(origin, direction);
    }

    public static fromObject(obj: Ray3Like): Ray3 {
        const origin = Vector3.fromObject(obj.origin);
        const direction = Vector3.fromObject(obj.direction);
        return new Ray3(origin, direction);
    }

    public static fromPoints(p0: Vector3, p1: Vector3): Ray3 {
        const direction = p1.sub(p0);
        return new Ray3(p0, direction);
    }

    public static fromXYZ(px: number, py: number, pz: number, vx: number, vy: number, vz: number): Ray3 {
        const origin = new Vector3(px, py, pz);
        const direction = new Vector3(vx, vy, vz);
        return new Ray3(origin, direction);
    }

    /**
     * Returns the parameters of the closest points which lie on the rays `ray1` and `ray2`
     * or `undefined` if the rays are parallel.
     */
    public static getClosestParameter(ray1: ReadonlyRay3, ray2: ReadonlyRay3): [number, number] | undefined {
        // Reference: https://math.stackexchange.com/a/4764188
        // ```
        // p1 + t1 * v1 = p2 + t2 * v2
        // t1 * v1 - t2 * v2 = p2 - p1
        // ```
        const vc = ray1.direction.cross(ray2.direction);
        const den = vc.lenSq();

        if (den === 0) {
            // Rays are parallel
            return undefined;
        }

        // `v = p2 - p1`
        const v = ray2.origin.sub(ray1.origin);

        // We can elimate `t2` by applying the cross product with `v2` so that `v2 cross v2` vanishes:
        // ```
        // t1 * (v1 cross v2) - t2 * (v2 cross v2) = v cross v2
        // t1 * (v1 cross v2) = v cross v2
        // t1 * (v1 cross v2) dot (v1 cross v2) = (v cross v2) dot (v1 cross v2)
        // t1 = ((v cross v2) dot (v1 cross v2)) / ((v1 cross v2) dot (v1 cross v2))
        // ```
        const t1 = v.cross(ray2.direction).dot(vc) / den;

        // Similarly, we eliminate `t1` and use the anticommutativity property of the cross product:
        // ```
        // t1 * (v1 cross v1) - t2 * (v2 cross v1) = v cross v1
        // t2 * (v1 cross v2) = v cross v1
        // t2 * (v1 cross v2) dot (v1 cross v2) = (v cross v1) dot (v1 cross v2)
        // t2 = ((v cross v1) dot (v1 cross v2)) / ((v1 cross v2) dot (v1 cross v2))
        // ```
        const t2 = v.cross(ray1.direction).dot(vc) / den;

        return [t1, t2];
    }

    public static toObject(ray: ReadonlyRay3): Ray3Like {
        const origin = Vector3.toObject(ray.origin);
        const direction = Vector3.toObject(ray.direction);
        return { origin, direction };
    }

    public clone(): Ray3 {
        return new Ray3(this.origin, this.direction);
    }

    /**
     * Returns the distance to where a point `p` is orthogonal to the ray.
     */
    public getDistanceFromPoint(p: ReadonlyVector3): number {
        const v1 = this.direction;
        const v2 = this.origin.sub(p);
        return v1.cross(v2).len() / v1.len();
    }

    public getNormalAround(v: ReadonlyVector3): Ray3 {
        return new Ray3(this.origin, this.direction.cross(v));
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the ray.
     */
    public getParameterFromPoint(p: ReadonlyVector3): number {
        const v1 = this.direction;
        const v2 = p.sub(this.origin);
        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the parameterized point on the ray along its direction.
     */
    public getValueAt(t: number): Vector3 {
        return this.origin.addMulS(this.direction, t);
    }

    public isFinite(): boolean {
        return this.origin.isFinite() && this.direction.isFinite();
    }

    public reverse(): Ray3 {
        return new Ray3(this.origin, this.direction.neg());
    }

    public set(origin: Vector3, direction: Vector3): void {
        this.origin = origin;
        this.direction = direction;
    }

    public setFrom(ray: ReadonlyRay3): void {
        this.origin = ray.origin;
        this.direction = ray.direction;
    }

    public setXYZ(px: number, py: number, pz: number, vx: number, vy: number, vz: number): void {
        this.origin = new Vector3(px, py, pz);
        this.direction = new Vector3(vx, vy, vz);
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.origin.x, this.origin.y, this.origin.z, this.direction.x, this.direction.y, this.direction.z];
    }

    public toString(): string {
        return "{origin: " + this.origin.toString() + ", direction: " + this.direction.toString() + "}";
    }

    public translate(v: ReadonlyVector3): Ray3 {
        const origin = this.origin.add(v);
        return new Ray3(origin, this.direction);
    }
}
