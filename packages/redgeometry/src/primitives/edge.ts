import { clamp } from "../utility/scalar.js";
import { RootType, solveQuadratic } from "../utility/solve.js";
import { Bezier1Curve2 } from "./bezier.js";
import { Box2, Box3 } from "./box.js";
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

    clone(): Edge2;
    eq(e: ReadonlyEdge2): boolean;
    getBounds(): Box2;
    getClosestPoint(p: ReadonlyVector2): Vector2;
    getClosestPointDistance(p: ReadonlyVector2): number;
    getParameterFromPoint(p: ReadonlyVector2): number;
    getSignedDistanceFromPoint(p: ReadonlyVector2): number;
    getValueAt(t: number): Vector2;
    isFinite(): boolean;
    isPoint(): boolean;
    isPointInside(p: ReadonlyVector2): boolean;
    normal(): Edge2;
    reverse(): Edge2;
    toArray(): [number, number, number, number];
    toBezier(): Bezier1Curve2;
    toRay(): Ray2;
    toString(): string;
    translate(v: ReadonlyVector2): Edge2;
    vector(): Vector2;
}

export interface ReadonlyEdge3 {
    readonly p0: ReadonlyVector3;
    readonly p1: ReadonlyVector3;

    clone(): Edge3;
    eq(e: ReadonlyEdge3): boolean;
    getBounds(): Box3;
    getClosestPoint(p: ReadonlyVector3): Vector3;
    getClosestPointDistance(p: ReadonlyVector3): number;
    getDistanceFromPoint(p: ReadonlyVector3): number;
    getNormalAround(v: ReadonlyVector3): Edge3;
    getParameterFromPoint(p: ReadonlyVector3): number;
    getProjectedEdge(p0: ReadonlyVector2, p1: ReadonlyVector2): Edge3;
    getValueAt(t: number): Vector3;
    isFinite(): boolean;
    reverse(): Edge3;
    toArray(): [number, number, number, number, number, number];
    toRay(): Ray3;
    toString(): string;
    translate(v: ReadonlyVector3): Edge3;
    vector(): Vector3;
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
            const [t] = Edge2.getIntersectionParameter(clipped, clipEdge);
            const a = Vector2.signedArea(clipEdge.p0, clipEdge.p1, clipped.p0);

            if (t > 0 && t < 1) {
                const p = clipped.getValueAt(t);
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

        if (roots.type === RootType.Two) {
            const t1 = roots.x1;
            const t2 = roots.x2;

            return [t1, t2];
        } else {
            return undefined;
        }
    }

    public static getClosestDistance(e1: ReadonlyEdge2, e2: ReadonlyEdge2): number {
        const [t, u] = Edge2.getClosestParameter(e1, e2);

        const p0 = e1.getValueAt(t);
        const p1 = e2.getValueAt(u);

        return p0.distanceTo(p1);
    }

    public static getClosestParameter(e1: ReadonlyEdge2, e2: ReadonlyEdge2): [number, number] {
        // Based on the nonrobust implementation of *Robust Computation
        // of Distance Between Line Segments* by David Eberly
        const r = e1.vector();
        const s = e2.vector();
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

    public static getIntersection(e1: ReadonlyEdge2, e2: ReadonlyEdge2): Vector2 | undefined {
        const v1 = e1.vector();
        const v2 = e2.vector();
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

        return e1.getValueAt(t);
    }

    public static getIntersectionParameter(e1: ReadonlyEdge2, e2: ReadonlyEdge2): [number, number] {
        const v1 = e1.vector();
        const v2 = e2.vector();
        const den = v1.cross(v2);

        if (den === 0) {
            // Edges are collinear (TODO: Maybe return undefined)
            return [Number.NaN, Number.NaN];
        }

        // `t = (p2 − p1) cross v2 / (v1 cross v2)`
        // `u = (p2 − p1) cross v1 / (v1 cross v2)`
        const v = e2.p0.sub(e1.p0);
        const t = v.cross(v2) / den;
        const u = v.cross(v1) / den;

        return [t, u];
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

    public clone(): Edge2 {
        return new Edge2(this.p0, this.p1);
    }

    public eq(e: ReadonlyEdge2): boolean {
        return this.p0.eq(e.p0) && this.p1.eq(e.p1);
    }

    public getBounds(): Box2 {
        return Box2.fromPoints(this.p0, this.p1);
    }

    public getClosestParameter(p: ReadonlyVector2): number {
        const t = this.getParameterFromPoint(p);
        return clamp(t, 0, 1);
    }

    public getClosestPoint(p: ReadonlyVector2): Vector2 {
        const t = this.getParameterFromPoint(p);

        if (t <= 0) {
            return this.p0.clone();
        } else if (t >= 1) {
            return this.p1.clone();
        } else {
            return this.getValueAt(t);
        }
    }

    public getClosestPointDistance(p: ReadonlyVector2): number {
        return this.getClosestPoint(p).distanceTo(p);
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the edge.
     */
    public getParameterFromPoint(p: ReadonlyVector2): number {
        const v1 = this.vector();
        const v2 = p.sub(this.p0);

        return v1.dot(v2) / v1.lenSq();
    }

    /**
     * Returns the signed distance to where a point `p` is orthogonal on the edge.
     */
    public getSignedDistanceFromPoint(p: ReadonlyVector2): number {
        const v1 = this.vector();
        const v2 = this.p0.sub(p);

        return v1.cross(v2) / v1.len();
    }

    /**
     * Returns the parameterized point on the edge between its endpoints.
     */
    public getValueAt(t: number): Vector2 {
        return this.p0.lerp(this.p1, t);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite();
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1);
    }

    public isPointInside(p: ReadonlyVector2): boolean {
        // Check if projected point is between endpoints
        const t = this.getParameterFromPoint(p);

        return t >= 0 && t <= 1;
    }

    public normal(): Edge2 {
        const vn = this.vector().normal();
        const p1 = this.p0.add(vn);
        return new Edge2(this.p0, p1);
    }

    public reverse(): Edge2 {
        return new Edge2(this.p1, this.p0);
    }

    public set(p0: Vector2, p1: Vector2): void {
        this.p0 = p0;
        this.p1 = p1;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
    }

    public toArray(): [number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y];
    }

    public toBezier(): Bezier1Curve2 {
        return new Bezier1Curve2(this.p0, this.p1);
    }

    public toRay(): Ray2 {
        return new Ray2(this.p0, this.vector());
    }

    public toString(): string {
        return `{p0: ${this.p0}, p1: ${this.p1}}`;
    }

    public translate(v: ReadonlyVector2): Edge2 {
        const p0 = this.p0.add(v);
        const p1 = this.p1.add(v);
        return new Edge2(p0, p1);
    }

    public vector(): Vector2 {
        return this.p1.sub(this.p0);
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

    public clone(): Edge3 {
        return new Edge3(this.p0, this.p1);
    }

    public eq(e: ReadonlyEdge3): boolean {
        return this.p0.eq(e.p0) && this.p1.eq(e.p1);
    }

    public getBounds(): Box3 {
        return Box3.fromPoints(this.p0, this.p1);
    }

    public getClosestParameter(p: ReadonlyVector3): number {
        const t = this.getParameterFromPoint(p);
        return clamp(t, 0, 1);
    }

    public getClosestPoint(p: ReadonlyVector3): Vector3 {
        const t = this.getParameterFromPoint(p);

        if (t <= 0) {
            return this.p0.clone();
        } else if (t >= 1) {
            return this.p1.clone();
        } else {
            return this.getValueAt(t);
        }
    }

    public getClosestPointDistance(p: ReadonlyVector3): number {
        return this.getClosestPoint(p).distanceTo(p);
    }

    /**
     * Returns the distance to where a point `p` is orthogonal on the edge.
     */
    public getDistanceFromPoint(p: ReadonlyVector3): number {
        const v1 = this.vector();
        const v2 = this.p0.sub(p);

        return v1.cross(v2).len() / v1.len();
    }

    public getNormalAround(v: ReadonlyVector3): Edge3 {
        const vn = this.vector().cross(v);
        const p1 = this.p0.add(vn);
        return new Edge3(this.p0, p1);
    }

    /**
     * Returns the parameterized value where a point `p` is orthogonal on the edge.
     */
    public getParameterFromPoint(p: ReadonlyVector3): number {
        const v1 = this.vector();
        const v2 = p.sub(this.p0);

        return v1.dot(v2) / v1.lenSq();
    }

    public getProjectedEdge(p0: ReadonlyVector2, p1: ReadonlyVector2): Edge3 {
        const edge = Edge2.fromXY(this.p0.x, this.p0.y, this.p1.x, this.p1.y);

        const t0 = edge.getParameterFromPoint(p0);
        const t1 = edge.getParameterFromPoint(p1);

        return new Edge3(this.getValueAt(t0), this.getValueAt(t1));
    }

    /**
     * Returns the parameterized point on the edge between its endpoints.
     */
    public getValueAt(t: number): Vector3 {
        return this.p0.lerp(this.p1, t);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite();
    }

    public reverse(): Edge3 {
        return new Edge3(this.p1, this.p0);
    }

    public set(p0: Vector3, p1: Vector3): void {
        this.p0 = p0;
        this.p1 = p1;
    }

    public setXYZ(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
        this.p0 = new Vector3(x0, y0, z0);
        this.p1 = new Vector3(x1, y1, z1);
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p0.z, this.p1.x, this.p1.y, this.p1.z];
    }

    public toRay(): Ray3 {
        return new Ray3(this.p0, this.vector());
    }

    public toString(): string {
        return `{p0: ${this.p0}, p1: ${this.p1}}`;
    }

    public translate(v: ReadonlyVector3): Edge3 {
        const p0 = this.p0.add(v);
        const p1 = this.p1.add(v);
        return new Edge3(p0, p1);
    }

    public vector(): Vector3 {
        return this.p1.sub(this.p0);
    }
}
