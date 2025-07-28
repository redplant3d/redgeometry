import { clamp } from "../utility/scalar.js";
import { solveQuadratic } from "../utility/solve.js";
import { Bezier1Curve2 } from "./bezier.js";
import { MinMaxBox2, MinMaxBox3 } from "./box.js";
import { Ray2, Ray3 } from "./ray.js";
import {
    type ReadonlyVector2,
    type ReadonlyVector3,
    type Vector2Like,
    type Vector3Like,
    Vector2,
    Vector3,
} from "./vector.js";

export type Edge2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
};

export type Edge3Like = {
    readonly p0: Vector3Like;
    readonly p1: Vector3Like;
};

export interface ReadonlyEdge2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;

    bounds(): MinMaxBox2;
    clone(): Edge2;
    closestPoint(p: ReadonlyVector2): Vector2;
    closestPointDistance(p: ReadonlyVector2): number;
    direction(): Vector2;
    eq(e: ReadonlyEdge2): boolean;
    isFinite(): boolean;
    isPoint(): boolean;
    isPointInside(p: ReadonlyVector2): boolean;
    parameterFromPoint(p: ReadonlyVector2): number;
    perp(): Edge2;
    reverse(): Edge2;
    signedDistanceFromPoint(p: ReadonlyVector2): number;
    toArray(): [number, number, number, number];
    toBezier(): Bezier1Curve2;
    toRay(): Ray2;
    toString(): string;
    translate(v: ReadonlyVector2): Edge2;
    valueAt(t: number): Vector2;
}

export interface ReadonlyEdge3 {
    readonly p0: ReadonlyVector3;
    readonly p1: ReadonlyVector3;

    bounds(): MinMaxBox3;
    clone(): Edge3;
    closestPoint(p: ReadonlyVector3): Vector3;
    closestPointDistance(p: ReadonlyVector3): number;
    direction(): Vector3;
    distanceFromPoint(p: ReadonlyVector3): number;
    eq(e: ReadonlyEdge3): boolean;
    isFinite(): boolean;
    parameterFromPoint(p: ReadonlyVector3): number;
    perpTo(v: ReadonlyVector3): Edge3;
    projectedEdge(p0: ReadonlyVector2, p1: ReadonlyVector2): Edge3;
    reverse(): Edge3;
    toArray(): [number, number, number, number, number, number];
    toRay(): Ray3;
    toString(): string;
    translate(v: ReadonlyVector3): Edge3;
    valueAt(t: number): Vector3;
}

export class Edge2 implements ReadonlyEdge2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2) {
        this.p0 = p0;
        this.p1 = p1;
    }

    public static clip(e: Edge2, ...clipEdges: ReadonlyEdge2[]): Edge2 | undefined {
        let clipped = e;

        for (const clipEdge of clipEdges) {
            const result = Edge2.getIntersectionParameter(clipped, clipEdge);
            const a = Vector2.signedArea(clipEdge.p0, clipEdge.p1, clipped.p0);

            if (result !== undefined && result.t1 > 0 && result.t1 < 1) {
                const p = clipped.valueAt(result.t1);
                if (a <= 0) {
                    clipped = new Edge2(p, clipped.p1);
                } else {
                    clipped = new Edge2(clipped.p0, p);
                }
            } else if (a <= 0) {
                // Rejected
                return undefined;
            }
        }

        if (clipped.isPoint()) {
            return undefined;
        } else {
            return clipped;
        }
    }

    public static closestParameter(e1: ReadonlyEdge2, e2: ReadonlyEdge2): [number, number] {
        // Based on the nonrobust implementation of *Robust Computation
        // of Distance Between Line Segments* by David Eberly
        const r = e1.direction();
        const s = e2.direction();
        const v = e1.p0.sub(e2.p0);

        const a = r.dot(r);
        const b = r.dot(s);
        const c = s.dot(s);
        const d = r.dot(v);
        const e = s.dot(v);

        const acbb = a * c - b * b;

        let t: number | undefined;
        let u: number | undefined;

        if (acbb > 0) {
            // Segments are not collinear
            const becd = b * e - c * d;
            const aebd = a * e - b * d;

            if (becd <= 0) {
                if (e <= 0) {
                    // Region 6: `t <= 0` and `u <= 0`
                    t = clamp(-d / a, 0, 1);
                    u = 0;
                } else if (e < c) {
                    // Region 5: `t <= 0` and `0 < u < 1`
                    t = 0;
                    u = e / c;
                } else {
                    // Region 4: `t <= 0` and `u >= 1`
                    t = clamp((b - d) / a, 0, 1);
                    u = 1;
                }
            } else if (acbb <= becd) {
                if (b + e <= 0) {
                    // Region 8: `t >= 1` and `u <= 0`
                    t = clamp(-d / a, 0, 1);
                    u = 0;
                } else if (b + e < c) {
                    // Region 1: `t >= 1` and `0 < u < 1`
                    t = 1;
                    u = (b + e) / c;
                } else {
                    // Region 2: `t >= 1` and `u >= 1`
                    t = clamp((b - d) / a, 0, 1);
                    u = 1;
                }
            } else {
                if (aebd <= 0) {
                    // Region 7: `0 < t < 1` and `u <= 0`
                    t = clamp(-d / a, 0, 1);
                    u = 0;
                } else if (aebd < acbb) {
                    // Region 0: `0 < t < 1` and `0 < u < 1`
                    t = becd / acbb;
                    u = aebd / acbb;
                } else {
                    // Region 3: `0 < t < 1` and `u >= 1`
                    t = clamp((b - d) / a, 0, 1);
                    u = 1;
                }
            }
        } else {
            // Segments are collinear
            if (e <= 0) {
                // `u <= 0`
                t = clamp(-d / a, 0, 1);
                u = 0;
            } else if (e < c) {
                // `0 < u < 1`
                t = 0;
                u = e / c;
            } else {
                // `u >= 1`
                t = clamp((b - d) / a, 0, 1);
                u = 1;
            }
        }

        return [t, u];
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Edge2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);

        return new Edge2(p0, p1);
    }

    public static fromObject(obj: Edge2Like): Edge2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        return new Edge2(p0, p1);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number): Edge2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);

        return new Edge2(p0, p1);
    }

    public static getCircleIntersectionParameter(
        e: ReadonlyEdge2,
        p: ReadonlyVector2,
        r: number,
    ): [number, number] | undefined {
        const v1 = e.p1.sub(e.p0);
        const v2 = p.sub(e.p0);

        const a = v1.dot(v1);
        const b = v1.dot(v2.neg());
        const c = v2.dot(v2) - r * r;

        const roots = solveQuadratic(a, b, c);

        if (roots.type === "two") {
            const t1 = roots.x1;
            const t2 = roots.x2;

            return [t1, t2];
        } else {
            return undefined;
        }
    }

    public static getClosestDistance(e1: ReadonlyEdge2, e2: ReadonlyEdge2): number {
        const [t, u] = Edge2.closestParameter(e1, e2);

        const p0 = e1.valueAt(t);
        const p1 = e2.valueAt(u);

        return p0.distance(p1);
    }

    public static getIntersection(e1: ReadonlyEdge2, e2: ReadonlyEdge2): Vector2 | undefined {
        const v1 = e1.direction();
        const v2 = e2.direction();
        const den = v1.cross(v2);

        if (den === 0) {
            // Edges are collinear
            return undefined;
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        // `u = (p2 − p1) cross v1 / (v1 cross v2)`
        const v = e2.p0.sub(e1.p0);
        const t = v.cross(v2) / den;
        const u = v.cross(v1) / den;

        if (t < 0 || t > 1 || u < 0 || u > 1) {
            return undefined;
        }

        return e1.valueAt(t);
    }

    public static getIntersectionParameter(
        e1: ReadonlyEdge2,
        e2: ReadonlyEdge2,
    ): { t1: number; t2: number } | undefined {
        const v1 = e1.direction();
        const v2 = e2.direction();
        const den = v1.cross(v2);

        if (den === 0) {
            // Edges are collinear
            return undefined;
        }

        // `t1 = (p2 − p1) cross v2 / (v1 cross v2)`
        // `t2 = (p2 − p1) cross v1 / (v1 cross v2)`
        const v = e2.p0.sub(e1.p0);
        const t1 = v.cross(v2) / den;
        const t2 = v.cross(v1) / den;

        return { t1, t2 };
    }

    public static isAdjacent(e1: ReadonlyEdge2, e2: ReadonlyEdge2): boolean {
        return e1.p0.eq(e2.p0) || e1.p0.eq(e2.p1) || e1.p1.eq(e2.p0) || e1.p1.eq(e2.p1);
    }

    public static isEqual(e1: ReadonlyEdge2, e2: ReadonlyEdge2): boolean {
        return e1.p0.eq(e2.p0) && e1.p1.eq(e2.p1);
    }

    public static isIntersection(e1: ReadonlyEdge2, e2: ReadonlyEdge2): boolean {
        // Stategy: Quickly reject
        const o1p0 = Vector2.signedArea(e1.p0, e1.p1, e2.p0);
        const o1p1 = Vector2.signedArea(e1.p0, e1.p1, e2.p1);
        const o1 = o1p0 * o1p1;

        if (o1 > 0) {
            // Both points of `e2` lie on one side of `e1`
            return false;
        }

        const o2p0 = Vector2.signedArea(e2.p0, e2.p1, e1.p0);
        const o2p1 = Vector2.signedArea(e2.p0, e2.p1, e1.p1);
        const o2 = o2p0 * o2p1;

        if (o2 > 0) {
            // Both points of `e1` lie on one side of `e2`
            return false;
        }

        if (o1 * o2 > 0) {
            // Edges intersect
            return true;
        } else if (
            (o1p0 === 0 && e1.isPointInside(e2.p0)) ||
            (o1p1 === 0 && e1.isPointInside(e2.p1)) ||
            (o2p0 === 0 && e2.isPointInside(e1.p0)) ||
            (o2p1 === 0 && e2.isPointInside(e1.p1))
        ) {
            // At least one endpoint touches the other edge
            return true;
        } else {
            // Edges do not touch/intersect
            return false;
        }
    }

    public static isOpposite(e1: ReadonlyEdge2, e2: ReadonlyEdge2): boolean {
        return e1.p0.eq(e2.p1) && e1.p1.eq(e2.p0);
    }

    public static toObject(e: ReadonlyEdge2): Edge2Like {
        const p0 = Vector2.toObject(e.p0);
        const p1 = Vector2.toObject(e.p1);
        return { p0, p1 };
    }

    public bounds(): MinMaxBox2 {
        return MinMaxBox2.fromPoints(this.p0, this.p1);
    }

    public clone(): Edge2 {
        return new Edge2(this.p0, this.p1);
    }

    public closestParameter(p: ReadonlyVector2): number {
        const t = this.parameterFromPoint(p);
        return clamp(t, 0, 1);
    }

    public closestPoint(p: ReadonlyVector2): Vector2 {
        const t = this.parameterFromPoint(p);

        if (t <= 0) {
            return this.p0.clone();
        } else if (t >= 1) {
            return this.p1.clone();
        } else {
            return this.valueAt(t);
        }
    }

    public closestPointDistance(p: ReadonlyVector2): number {
        return this.closestPoint(p).distance(p);
    }

    public direction(): Vector2 {
        return this.p1.sub(this.p0);
    }

    public eq(e: ReadonlyEdge2): boolean {
        return this.p0.eq(e.p0) && this.p1.eq(e.p1);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite();
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1);
    }

    public isPointInside(p: ReadonlyVector2): boolean {
        // Check if projected point is between endpoints
        const t = this.parameterFromPoint(p);

        return t >= 0 && t <= 1;
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the edge.
     */
    public parameterFromPoint(p: ReadonlyVector2): number {
        const v1 = this.direction();
        const v2 = p.sub(this.p0);

        return v1.dot(v2) / v1.lengthSq();
    }

    public perp(): Edge2 {
        const vp = this.direction().perp();
        const p1 = this.p0.add(vp);
        return new Edge2(this.p0, p1);
    }

    public reverse(): Edge2 {
        return new Edge2(this.p1, this.p0);
    }

    public set(p0: Vector2, p1: Vector2): void {
        this.p0 = p0;
        this.p1 = p1;
    }

    public setFrom(e: ReadonlyEdge2): void {
        this.p0 = e.p0;
        this.p1 = e.p1;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
    }

    /**
     * Returns the signed distance to where a point `p` is orthogonal on the edge.
     */
    public signedDistanceFromPoint(p: ReadonlyVector2): number {
        const v1 = this.direction();
        const v2 = this.p0.sub(p);

        return v1.cross(v2) / v1.length();
    }

    public toArray(): [number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y];
    }

    public toBezier(): Bezier1Curve2 {
        return new Bezier1Curve2(this.p0, this.p1);
    }

    public toRay(): Ray2 {
        return new Ray2(this.p0, this.direction());
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + "}";
    }

    public translate(v: ReadonlyVector2): Edge2 {
        const p0 = this.p0.add(v);
        const p1 = this.p1.add(v);
        return new Edge2(p0, p1);
    }

    /**
     * Returns the parameterized point on the edge between its endpoints.
     */
    public valueAt(t: number): Vector2 {
        return this.p0.lerp(this.p1, t);
    }
}

export class Edge3 implements ReadonlyEdge3 {
    public p0: ReadonlyVector3;
    public p1: ReadonlyVector3;

    public constructor(p0: ReadonlyVector3, p1: ReadonlyVector3) {
        this.p0 = p0;
        this.p1 = p1;
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Edge3 {
        const p0 = Vector3.fromArray(data, offset);
        const p1 = Vector3.fromArray(data, offset + 3);

        return new Edge3(p0, p1);
    }

    public static fromObject(obj: Edge3Like): Edge3 {
        const p0 = Vector3.fromObject(obj.p0);
        const p1 = Vector3.fromObject(obj.p1);
        return new Edge3(p0, p1);
    }

    public static fromXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Edge3 {
        const p0 = new Vector3(x0, y0, z0);
        const p1 = new Vector3(x1, y1, z1);

        return new Edge3(p0, p1);
    }

    public static isAdjacent(e1: ReadonlyEdge3, e2: ReadonlyEdge3): boolean {
        return e1.p0.eq(e2.p0) || e1.p0.eq(e2.p1) || e1.p1.eq(e2.p0) || e1.p1.eq(e2.p1);
    }

    public static isEqual(e1: ReadonlyEdge3, e2: ReadonlyEdge3): boolean {
        return e1.p0.eq(e2.p0) && e1.p1.eq(e2.p1);
    }

    public static isOpposite(e1: ReadonlyEdge3, e2: ReadonlyEdge3): boolean {
        return e1.p0.eq(e2.p1) && e1.p1.eq(e2.p0);
    }

    public static toObject(e: ReadonlyEdge3): Edge3Like {
        const p0 = Vector3.toObject(e.p0);
        const p1 = Vector3.toObject(e.p1);
        return { p0, p1 };
    }

    public bounds(): MinMaxBox3 {
        return MinMaxBox3.fromPoints(this.p0, this.p1);
    }

    public clone(): Edge3 {
        return new Edge3(this.p0, this.p1);
    }

    public closestParameter(p: ReadonlyVector3): number {
        const t = this.parameterFromPoint(p);
        return clamp(t, 0, 1);
    }

    public closestPoint(p: ReadonlyVector3): Vector3 {
        const t = this.parameterFromPoint(p);

        if (t <= 0) {
            return this.p0.clone();
        } else if (t >= 1) {
            return this.p1.clone();
        } else {
            return this.valueAt(t);
        }
    }

    public closestPointDistance(p: ReadonlyVector3): number {
        return this.closestPoint(p).distance(p);
    }

    public direction(): Vector3 {
        return this.p1.sub(this.p0);
    }

    /**
     * Returns the distance to where a point `p` is orthogonal on the edge.
     */
    public distanceFromPoint(p: ReadonlyVector3): number {
        const v1 = this.direction();
        const v2 = this.p0.sub(p);

        return v1.cross(v2).length() / v1.length();
    }

    public eq(e: ReadonlyEdge3): boolean {
        return this.p0.eq(e.p0) && this.p1.eq(e.p1);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite();
    }

    public perpTo(v: ReadonlyVector3): Edge3 {
        const vp = this.direction().perpTo(v);
        const p1 = this.p0.add(vp);
        return new Edge3(this.p0, p1);
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the edge.
     */
    public parameterFromPoint(p: ReadonlyVector3): number {
        const v1 = this.direction();
        const v2 = p.sub(this.p0);

        return v1.dot(v2) / v1.lengthSq();
    }

    public projectedEdge(p0: ReadonlyVector2, p1: ReadonlyVector2): Edge3 {
        const edge = Edge2.fromXY(this.p0.x, this.p0.y, this.p1.x, this.p1.y);

        const t0 = edge.parameterFromPoint(p0);
        const t1 = edge.parameterFromPoint(p1);

        return new Edge3(this.valueAt(t0), this.valueAt(t1));
    }

    public reverse(): Edge3 {
        return new Edge3(this.p1, this.p0);
    }

    public set(p0: Vector3, p1: Vector3): void {
        this.p0 = p0;
        this.p1 = p1;
    }

    public setFrom(e: ReadonlyEdge3): void {
        this.p0 = e.p0;
        this.p1 = e.p1;
    }

    public setXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
        this.p0 = new Vector3(x0, y0, z0);
        this.p1 = new Vector3(x1, y1, z1);
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p0.z, this.p1.x, this.p1.y, this.p1.z];
    }

    public toRay(): Ray3 {
        return new Ray3(this.p0, this.direction());
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + "}";
    }

    public translate(v: ReadonlyVector3): Edge3 {
        const p0 = this.p0.add(v);
        const p1 = this.p1.add(v);
        return new Edge3(p0, p1);
    }

    /**
     * Returns the parameterized point on the edge between its endpoints.
     */
    public valueAt(t: number): Vector3 {
        return this.p0.lerp(this.p1, t);
    }
}
