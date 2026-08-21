import {
    Vector2,
    Vector3,
    type ReadonlyVector2,
    type ReadonlyVector3,
    type Vector2Like,
    type Vector3Like,
} from "./vector.js";

export type Triangle2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
    readonly p2: Vector2Like;
};

export type Triangle3Like = {
    readonly p0: Vector3Like;
    readonly p1: Vector3Like;
    readonly p2: Vector3Like;
};

export interface ReadonlyTriangle2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;
    readonly p2: ReadonlyVector2;

    clone(): Triangle2;
    closestParameter(p: ReadonlyVector2): { u: number; v: number; w: number };
    eq(tri: ReadonlyTriangle2): boolean;
    hasPointInside(p: ReadonlyVector2): boolean;
    isFinite(): boolean;
    signedArea(): number;
    toArray(): [number, number, number, number, number, number];
    toString(): string;
    valueAt(u: number, v: number, w: number): Vector2;
}

export interface ReadonlyTriangle3 {
    readonly p0: ReadonlyVector3;
    readonly p1: ReadonlyVector3;
    readonly p2: ReadonlyVector3;

    area(): number;
    clone(): Triangle3;
    closestParameter(p: ReadonlyVector3): { u: number; v: number; w: number };
    eq(tri: ReadonlyTriangle3): boolean;
    isFinite(): boolean;
    normal(): Vector3;
    toArray(): [number, number, number, number, number, number, number, number, number];
    toString(): string;
    valueAt(u: number, v: number, w: number): Vector3;
}

export class Triangle2 implements ReadonlyTriangle2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;
    public p2: ReadonlyVector2;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Triangle2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);
        const p2 = Vector2.fromArray(data, offset + 4);

        return new Triangle2(p0, p1, p2);
    }

    public static fromObject(obj: Triangle2Like): Triangle2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        const p2 = Vector2.fromObject(obj.p2);

        return new Triangle2(p0, p1, p2);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): Triangle2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);

        return new Triangle2(p0, p1, p2);
    }

    public static toObject(tri: ReadonlyTriangle2): Triangle2Like {
        const p0 = Vector2.toObject(tri.p0);
        const p1 = Vector2.toObject(tri.p1);
        const p2 = Vector2.toObject(tri.p2);

        return { p0, p1, p2 };
    }

    public clone(): Triangle2 {
        return new Triangle2(this.p0, this.p1, this.p2);
    }

    /**
     * References:
     * - Christer Ericson.
     *   *Closest Point on Triangle to Point*.
     *   Real-Time Collision Detection, 2005.
     */
    public closestParameter(p: ReadonlyVector2): { u: number; v: number; w: number } {
        // Check if P in vertex region outside A
        const vab = this.p1.sub(this.p0);
        const vac = this.p2.sub(this.p0);
        const vap = p.sub(this.p0);

        const d1 = vab.dot(vap);
        const d2 = vac.dot(vap);

        if (d1 <= 0 && d2 <= 0) {
            return { u: 1, v: 0, w: 0 };
        }

        // Check if P in vertex region outside B
        const vbp = p.sub(this.p1);
        const d3 = vab.dot(vbp);
        const d4 = vac.dot(vbp);

        if (d3 >= 0 && d4 <= d3) {
            return { u: 0, v: 1, w: 0 };
        }

        // Check if P in edge region of AB, if so return projection of P onto AB
        const vc = d1 * d4 - d3 * d2;

        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return { u: 1 - v, v, w: 0 };
        }

        // Check if P in vertex region outside C
        const vcp = p.sub(this.p2);
        const d5 = vab.dot(vcp);
        const d6 = vac.dot(vcp);

        if (d6 >= 0 && d5 <= d6) {
            return { u: 0, v: 0, w: 1 };
        }

        // Check if P in edge region of AC, if so return projection of P onto AC
        const vb = d5 * d2 - d1 * d6;

        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            return { u: 1 - w, v: 0, w };
        }

        // Check if P in edge region of BC, if so return projection of P onto BC
        const va = d3 * d6 - d5 * d4;

        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
            return { u: 0, v: 1 - w, w };
        }

        // P inside face region
        const den = va + vb + vc;

        return { u: va / den, v: vb / den, w: vc / den };
    }

    public eq(tri: ReadonlyTriangle2): boolean {
        return this.p0.eq(tri.p0) && this.p1.eq(tri.p1) && this.p2.eq(tri.p2);
    }

    /**
     * Returns whether `p` is inside the triangle.
     *
     * References:
     * - *Triangle Interior*.
     *   https://mathworld.wolfram.com/TriangleInterior.html
     */
    public hasPointInside(p: ReadonlyVector2): boolean {
        const v = p.sub(this.p0);
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p0);

        const r = v.cross(v2);
        const s = v1.cross(v);
        const d = v1.cross(v2);

        if (d > 0) {
            return r > 0 && s > 0 && r + s < d;
        } else {
            return r < 0 && s < 0 && r + s > d;
        }
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite() && this.p2.isFinite();
    }

    public signedArea(): number {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p0);

        return v1.cross(v2);
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.p2.x, this.p2.y];
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + ", p2: " + this.p2.toString() + "}";
    }

    public valueAt(u: number, v: number, w: number): Vector2 {
        return new Vector2(
            u * this.p0.x + v * this.p1.x + w * this.p2.x,
            u * this.p0.y + v * this.p1.y + w * this.p2.y,
        );
    }
}

export class Triangle3 implements ReadonlyTriangle3 {
    public p0: ReadonlyVector3;
    public p1: ReadonlyVector3;
    public p2: ReadonlyVector3;

    public constructor(p0: ReadonlyVector3, p1: ReadonlyVector3, p2: ReadonlyVector3) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Triangle3 {
        const p0 = Vector3.fromArray(data, offset);
        const p1 = Vector3.fromArray(data, offset + 3);
        const p2 = Vector3.fromArray(data, offset + 6);

        return new Triangle3(p0, p1, p2);
    }

    public static fromObject(obj: Triangle3Like): Triangle3 {
        const p0 = Vector3.fromObject(obj.p0);
        const p1 = Vector3.fromObject(obj.p1);
        const p2 = Vector3.fromObject(obj.p2);

        return new Triangle3(p0, p1, p2);
    }

    public static fromXYZ(
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
        x2: number,
        y2: number,
        z2: number,
    ): Triangle3 {
        const p0 = new Vector3(x0, y0, z0);
        const p1 = new Vector3(x1, y1, z1);
        const p2 = new Vector3(x2, y2, z2);

        return new Triangle3(p0, p1, p2);
    }

    public static toObject(tri: ReadonlyTriangle3): Triangle3Like {
        const p0 = Vector3.toObject(tri.p0);
        const p1 = Vector3.toObject(tri.p1);
        const p2 = Vector3.toObject(tri.p2);

        return { p0, p1, p2 };
    }

    public area(): number {
        return 0.5 * this.normal().length();
    }

    public clone(): Triangle3 {
        return new Triangle3(this.p0, this.p1, this.p2);
    }

    /**
     * References:
     * - Christer Ericson.
     *   *Closest Point on Triangle to Point*.
     *   Real-Time Collision Detection, 2005.
     */
    public closestParameter(p: ReadonlyVector3): { u: number; v: number; w: number } {
        // Check if P in vertex region outside A
        const vab = this.p1.sub(this.p0);
        const vac = this.p2.sub(this.p0);
        const vap = p.sub(this.p0);

        const d1 = vab.dot(vap);
        const d2 = vac.dot(vap);

        if (d1 <= 0 && d2 <= 0) {
            return { u: 1, v: 0, w: 0 };
        }

        // Check if P in vertex region outside B
        const vbp = p.sub(this.p1);
        const d3 = vab.dot(vbp);
        const d4 = vac.dot(vbp);

        if (d3 >= 0 && d4 <= d3) {
            return { u: 0, v: 1, w: 0 };
        }

        // Check if P in edge region of AB, if so return projection of P onto AB
        const vc = d1 * d4 - d3 * d2;

        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return { u: 1 - v, v, w: 0 };
        }

        // Check if P in vertex region outside C
        const vcp = p.sub(this.p2);
        const d5 = vab.dot(vcp);
        const d6 = vac.dot(vcp);

        if (d6 >= 0 && d5 <= d6) {
            return { u: 0, v: 0, w: 1 };
        }

        // Check if P in edge region of AC, if so return projection of P onto AC
        const vb = d5 * d2 - d1 * d6;

        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            return { u: 1 - w, v: 0, w };
        }

        // Check if P in edge region of BC, if so return projection of P onto BC
        const va = d3 * d6 - d5 * d4;

        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
            return { u: 0, v: 1 - w, w };
        }

        // P inside face region
        const den = va + vb + vc;

        return { u: va / den, v: vb / den, w: vc / den };
    }

    public eq(tri: ReadonlyTriangle3): boolean {
        return this.p0.eq(tri.p0) && this.p1.eq(tri.p1) && this.p2.eq(tri.p2);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite() && this.p2.isFinite();
    }

    public normal(): Vector3 {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p0);

        return v1.cross(v2);
    }

    public toArray(): [number, number, number, number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p0.z, this.p1.x, this.p1.y, this.p1.z, this.p2.x, this.p2.y, this.p2.z];
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + ", p2: " + this.p2.toString() + "}";
    }

    public valueAt(u: number, v: number, w: number): Vector3 {
        return new Vector3(
            u * this.p0.x + v * this.p1.x + w * this.p2.x,
            u * this.p0.y + v * this.p1.y + w * this.p2.y,
            u * this.p0.z + v * this.p1.z + w * this.p2.z,
        );
    }
}
