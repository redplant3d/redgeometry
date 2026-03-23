import { eqApproxAbs, eqApproxRel } from "../utility/scalar.ts";
import { Vector3, type ReadonlyVector3, type Vector3Like } from "./vector.ts";

export type PlaneLike = {
    readonly normal: Vector3Like;
    readonly distance: number;
};

export interface ReadonlyPlane {
    readonly normal: ReadonlyVector3;
    readonly distance: number;

    eq(box: ReadonlyPlane): boolean;
    eqApproxAbs(box: ReadonlyPlane, eps: number): boolean;
    eqApproxRel(box: ReadonlyPlane, eps: number): boolean;
    point(): Vector3;
    reverse(): Plane;
    signedDistanceFromPoint(p: ReadonlyVector3): number;
    toArray(): [number, number, number, number];
    toString(): string;
    translate(v: ReadonlyVector3): Plane;
}

/**
 * A plane that represent a 2D surface extending infinitely in 3D space.
 * It is represented by a unit normal vector and a distance from origin (Hesse normal form).
 *
 * References:
 * - https://mathworld.wolfram.com/HessianNormalForm.html
 */
export class Plane implements ReadonlyPlane {
    public static readonly XY: ReadonlyPlane = Plane.createXY();
    public static readonly XZ: ReadonlyPlane = Plane.createXZ();
    public static readonly YZ: ReadonlyPlane = Plane.createYZ();

    public normal: ReadonlyVector3;
    public distance: number;

    public constructor(normal: ReadonlyVector3, distance: number) {
        this.normal = normal;
        this.distance = distance;
    }

    public static createXY(): Plane {
        return new Plane(Vector3.UNIT_Z, 0);
    }

    public static createXZ(): Plane {
        return new Plane(Vector3.UNIT_Y, 0);
    }

    public static createYZ(): Plane {
        return new Plane(Vector3.UNIT_X, 0);
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Plane {
        const normal = Vector3.fromArray(data, offset);
        const distance = data[offset + 3];

        return new Plane(normal, distance);
    }

    public static fromNormalAndOrigin(normal: ReadonlyVector3, origin: ReadonlyVector3): Plane {
        const distance = normal.dot(origin);

        return new Plane(normal, distance);
    }

    public static fromObject(obj: PlaneLike): Plane {
        const normal = Vector3.fromObject(obj.normal);
        const distance = obj.distance;

        return new Plane(normal, distance);
    }

    public static fromPoints(p0: ReadonlyVector3, p1: ReadonlyVector3, p2: ReadonlyVector3): Plane {
        const v1 = p1.sub(p0);
        const v2 = p2.sub(p0);
        const normal = v1.cross(v2);

        return Plane.fromNormalAndOrigin(normal, p0);
    }

    public static toObject(plane: ReadonlyPlane): PlaneLike {
        const normal = Vector3.toObject(plane.normal);
        const distance = plane.distance;

        return { normal, distance };
    }

    public eq(plane: ReadonlyPlane): boolean {
        return this.normal.eq(plane.normal) && this.distance === plane.distance;
    }

    public eqApproxAbs(plane: ReadonlyPlane, eps: number): boolean {
        return this.normal.eqApproxAbs(plane.normal, eps) && eqApproxAbs(this.distance, plane.distance, eps);
    }

    public eqApproxRel(plane: ReadonlyPlane, eps: number): boolean {
        return this.normal.eqApproxRel(plane.normal, eps) && eqApproxRel(this.distance, plane.distance, eps);
    }

    public signedDistanceFromPoint(p: ReadonlyVector3): number {
        return this.normal.dot(p) - this.distance;
    }

    public point(): Vector3 {
        return this.normal.mulS(this.distance);
    }

    public reverse(): Plane {
        const normal = this.normal.neg();
        const distance = -this.distance;

        return new Plane(normal, distance);
    }

    public set(normal: ReadonlyVector3, distance: number): void {
        this.normal = normal;
        this.distance = distance;
    }

    public toArray(): [number, number, number, number] {
        return [this.normal.x, this.normal.y, this.normal.z, this.distance];
    }

    public toString(): string {
        return "{normal: " + this.normal.toString() + ", distance: " + this.distance + "}";
    }

    public translate(v: ReadonlyVector3): Plane {
        const normal = this.normal;
        const distance = v.dot(normal) + this.distance;

        return new Plane(normal, distance);
    }
}
