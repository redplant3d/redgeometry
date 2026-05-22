import {
    getIntersectionQuadQuad,
    getWindingAtParameterConic,
    getWindingAtParameterCubic,
    getWindingAtParameterLinear,
    getWindingAtParameterQuadratic,
    minimizeCurveDistanceAt,
    setEncloseCurveAt,
} from "../internal/bezier.ts";
import { Interval } from "../utility/interval.ts";
import { solveCubic, solveLinear, solveQuadratic } from "../utility/solve.ts";
import { MinMaxBox2 } from "./box.ts";
import { Edge2 } from "./edge.ts";
import { Vector2, Vector3, type ReadonlyVector2, type ReadonlyVector3, type Vector2Like } from "./vector.ts";

export type Bezier1Curve2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
};

export type Bezier2Curve2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
    readonly p2: Vector2Like;
};

export type Bezier3Curve2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
    readonly p2: Vector2Like;
    readonly p3: Vector2Like;
};

export type BezierRCurve2Like = {
    readonly p0: Vector2Like;
    readonly p1: Vector2Like;
    readonly p2: Vector2Like;
    readonly w: number;
};

export type BezierCurve2 = Bezier1Curve2 | Bezier2Curve2 | Bezier3Curve2 | BezierRCurve2;

export type ReadonlyBezierCurve2 =
    | ReadonlyBezier1Curve2
    | ReadonlyBezier2Curve2
    | ReadonlyBezier3Curve2
    | ReadonlyBezierRCurve2;

export interface ReadonlyBezier1Curve2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;
    readonly pn: ReadonlyVector2;
    readonly type: "bezier-1";

    bounds(): MinMaxBox2;
    clone(): Bezier1Curve2;
    controlBounds(): MinMaxBox2;
    derivative(): Vector2;
    isFinite(): boolean;
    isPoint(): boolean;
    reverse(): Bezier1Curve2;
    signedArea(): number;
    splitAfter(t: number): Bezier1Curve2;
    splitAt(t: number): [Bezier1Curve2, Bezier1Curve2];
    splitBefore(t: number): Bezier1Curve2;
    splitBetween(t0: number, t1: number): Bezier1Curve2;
    tangentEnd(): Vector2;
    tangentStart(): Vector2;
    toArray(): [number, number, number, number];
    toEdge(): Edge2;
    toString(): string;
    valueAt(t: number): Vector2;
    windingAt(p: ReadonlyVector2): number;
}

export interface ReadonlyBezier2Curve2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;
    readonly p2: ReadonlyVector2;
    readonly pn: ReadonlyVector2;
    readonly type: "bezier-2";

    bounds(): MinMaxBox2;
    clone(): Bezier2Curve2;
    closestParameter(p: ReadonlyVector2): number;
    coefficients(): [Vector2, Vector2, Vector2];
    controlBounds(): MinMaxBox2;
    curvatureAt(t: number): number;
    curvatureMetric(): number;
    derivativeAt(t: number): Vector2;
    derivativeCoefficients(): [Vector2, Vector2];
    intersectLine(c: ReadonlyBezier1Curve2, outParameters: number[]): void;
    intersectQuad(c: ReadonlyBezier2Curve2, outParameters: Vector2[]): void;
    isCollinear(): boolean;
    isFinite(): boolean;
    isPoint(): boolean;
    offsetCuspParameter(rad: number): [number, number];
    reverse(): Bezier2Curve2;
    signedArea(): number;
    splitAfter(t: number): Bezier2Curve2;
    splitAt(t: number): [Bezier2Curve2, Bezier2Curve2];
    splitBefore(t: number): Bezier2Curve2;
    splitBetween(t0: number, t1: number): Bezier2Curve2;
    tangentEnd(): Vector2;
    tangentStart(): Vector2;
    toArray(): [number, number, number, number, number, number];
    toString(): string;
    valueAt(t: number): Vector2;
    vertexParameter(): number;
    windingAt(p: ReadonlyVector2): number;
}

export interface ReadonlyBezier3Curve2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;
    readonly p2: ReadonlyVector2;
    readonly p3: ReadonlyVector2;
    readonly pn: ReadonlyVector2;
    readonly type: "bezier-3";

    bounds(): MinMaxBox2;
    clone(): Bezier3Curve2;
    coefficients(): [Vector2, Vector2, Vector2, Vector2];
    controlBounds(): MinMaxBox2;
    curvatureAt(t: number): number;
    curvatureMetric(): number;
    derivativeAt(t: number): Vector2;
    derivativeCoefficients(): [Vector2, Vector2, Vector2];
    inflectionParameter(): [number, number];
    isCollinear(): boolean;
    isFinite(): boolean;
    isPoint(): boolean;
    reverse(): Bezier3Curve2;
    signedArea(): number;
    splitAfter(t: number): Bezier3Curve2;
    splitAt(t: number): [Bezier3Curve2, Bezier3Curve2];
    splitBefore(t: number): Bezier3Curve2;
    splitBetween(t0: number, t1: number): Bezier3Curve2;
    tangentEnd(): Vector2;
    tangentStart(): Vector2;
    toArray(): [number, number, number, number, number, number, number, number];
    toString(): string;
    valueAt(t: number): Vector2;
    windingAt(p: ReadonlyVector2): number;
}

export interface ReadonlyBezierRCurve2 {
    readonly p0: ReadonlyVector2;
    readonly p1: ReadonlyVector2;
    readonly p2: ReadonlyVector2;
    readonly pn: ReadonlyVector2;
    readonly type: "bezier-r";
    readonly w: number;

    bounds(): MinMaxBox2;
    clone(): BezierRCurve2;
    controlBounds(): MinMaxBox2;
    derivativeAt(t: number): Vector2;
    derivativeCoefficients(): [Vector3, Vector3, Vector3];
    isFinite(): boolean;
    isPoint(): boolean;
    projectivePoints(): [Vector3, Vector3, Vector3];
    reverse(): BezierRCurve2;
    signedArea(): number;
    splitAfter(t: number): BezierRCurve2;
    splitAt(t: number): [BezierRCurve2, BezierRCurve2];
    splitBefore(t: number): BezierRCurve2;
    splitBetween(t0: number, t1: number): BezierRCurve2;
    tangentEnd(): Vector2;
    tangentStart(): Vector2;
    toArray(): [number, number, number, number, number, number, number];
    toString(): string;
    valueAt(t: number): Vector2;
    windingAt(p: ReadonlyVector2): number;
}

export class Bezier1Curve2 implements ReadonlyBezier1Curve2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2) {
        this.p0 = p0;
        this.p1 = p1;
    }

    public get pn(): ReadonlyVector2 {
        return this.p1;
    }

    public get type(): "bezier-1" {
        return "bezier-1";
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Bezier1Curve2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);

        return new Bezier1Curve2(p0, p1);
    }

    public static fromObject(obj: Bezier1Curve2Like): Bezier1Curve2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        return new Bezier1Curve2(p0, p1);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number): Bezier1Curve2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);

        return new Bezier1Curve2(p0, p1);
    }

    public static toObject(c: ReadonlyBezier1Curve2): Bezier1Curve2Like {
        const p0 = Vector2.toObject(c.p0);
        const p1 = Vector2.toObject(c.p1);
        return { p0, p1 };
    }

    public bounds(): MinMaxBox2 {
        return MinMaxBox2.fromPoints(this.p0, this.p1);
    }

    public clone(): Bezier1Curve2 {
        return new Bezier1Curve2(this.p0, this.p1);
    }

    public controlBounds(): MinMaxBox2 {
        return MinMaxBox2.fromPoints(this.p0, this.p1);
    }

    public derivative(): Vector2 {
        return this.p1.sub(this.p0);
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite();
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1);
    }

    public reverse(): Bezier1Curve2 {
        return new Bezier1Curve2(this.p1, this.p0);
    }

    public set(p0: Vector2, p1: Vector2): void {
        this.p0 = p0;
        this.p1 = p1;
    }

    public setFrom(c: ReadonlyBezier1Curve2): void {
        this.p0 = c.p0;
        this.p1 = c.p1;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
    }

    public signedArea(): number {
        const v0 = this.p0;
        const v1 = this.p1;

        const a01 = v0.cross(v1);

        return a01 / 2;
    }

    public splitAfter(t: number): Bezier1Curve2 {
        const p01 = this.p0.lerp(this.p1, t);

        return new Bezier1Curve2(p01, this.p1);
    }

    public splitAt(t: number): [Bezier1Curve2, Bezier1Curve2] {
        const p01 = this.p0.lerp(this.p1, t);

        const c1 = new Bezier1Curve2(this.p0, p01);
        const c2 = new Bezier1Curve2(p01, this.p1);

        return [c1, c2];
    }

    public splitBefore(t: number): Bezier1Curve2 {
        const p01 = this.p0.lerp(this.p1, t);

        return new Bezier1Curve2(this.p0, p01);
    }

    public splitBetween(t0: number, t1: number): Bezier1Curve2 {
        const tp0 = this.p0.lerp(this.p1, t0);
        const tp1 = this.p0.lerp(this.p1, t1);

        return new Bezier1Curve2(tp0, tp1);
    }

    public tangentEnd(): Vector2 {
        return this.derivative();
    }

    public tangentStart(): Vector2 {
        return this.derivative();
    }

    public toArray(): [number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y];
    }

    public toEdge(): Edge2 {
        return new Edge2(this.p0, this.p1);
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + "}";
    }

    public valueAt(t: number): Vector2 {
        return this.p0.lerp(this.p1, t);
    }

    public windingAt(p: ReadonlyVector2): number {
        const v0 = this.p0.y - p.y;
        const v1 = this.p1.y - this.p0.y;

        const x = solveLinear(v1, v0);

        return getWindingAtParameterLinear(this, x, p.x);
    }
}

export class Bezier2Curve2 implements ReadonlyBezier2Curve2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;
    public p2: ReadonlyVector2;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    public get pn(): ReadonlyVector2 {
        return this.p2;
    }

    public get type(): "bezier-2" {
        return "bezier-2";
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Bezier2Curve2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);
        const p2 = Vector2.fromArray(data, offset + 4);

        return new Bezier2Curve2(p0, p1, p2);
    }

    public static fromObject(obj: Bezier2Curve2Like): Bezier2Curve2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        const p2 = Vector2.fromObject(obj.p2);
        return new Bezier2Curve2(p0, p1, p2);
    }

    public static fromXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): Bezier2Curve2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);

        return new Bezier2Curve2(p0, p1, p2);
    }

    public static toObject(c: ReadonlyBezier2Curve2): Bezier2Curve2Like {
        const p0 = Vector2.toObject(c.p0);
        const p1 = Vector2.toObject(c.p1);
        const p2 = Vector2.toObject(c.p2);
        return { p0, p1, p2 };
    }

    public bounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p2);
        const [qqa, qqb] = this.derivativeCoefficients();

        const tx = solveLinear(qqa.x, qqb.x);
        const ty = solveLinear(qqa.y, qqb.y);

        setEncloseCurveAt(this, box, tx);
        setEncloseCurveAt(this, box, ty);

        return box;
    }

    public clone(): Bezier2Curve2 {
        return new Bezier2Curve2(this.p0, this.p1, this.p2);
    }

    public closestParameter(p: ReadonlyVector2): number {
        // Solve `(C(t) - P) dot C'(t) = 0` for `t`
        const v0 = this.p0.sub(p);
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p1);

        const a10 = v1.dot(v0);
        const a11 = v1.dot(v1);
        const a20 = v2.dot(v0);
        const a21 = v2.dot(v1);
        const a22 = v2.dot(v2);

        const a = 2 * (a22 - a21 - a21 + a11);
        const b = 2 * (a21 - a11);
        const c = (2 / 3) * (a20 + a11 + a11 - a10);
        const d = 2 * a10;

        const rt = solveCubic(a, b, c, d);

        const distSq0 = this.p0.sub(p).lengthSq();
        const distSq1 = this.p2.sub(p).lengthSq();

        const min = distSq0 < distSq1 ? { param: 0, distSq: distSq0 } : { param: 1, distSq: distSq1 };

        if (rt.type === "three") {
            minimizeCurveDistanceAt(this, p, rt.x1, min);
            minimizeCurveDistanceAt(this, p, rt.x2, min);
            minimizeCurveDistanceAt(this, p, rt.x3, min);
        } else {
            minimizeCurveDistanceAt(this, p, rt.x, min);
        }

        return min.param;
    }

    public coefficients(): [Vector2, Vector2, Vector2] {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p1);

        // qa = v2 - v1
        // qb = v1 + v1
        const qa = v2.sub(v1);
        const qb = v1.add(v1);
        const qc = this.p0.clone();

        return [qa, qb, qc];
    }

    public controlBounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p2);
        box.setEnclosePoint(box, this.p1);

        return box;
    }

    public curvatureAt(t: number): number {
        const [qqa, qqb] = this.derivativeCoefficients();

        // vv = qqa * t + qbb
        // vvv = qqa
        const vv = qqa.mulS(t).add(qqb);
        const vvv = qqa;

        const len = vv.length();

        return vv.cross(vvv) / (len * len * len);
    }

    public curvatureMetric(): number {
        const [qqa, qqb] = this.derivativeCoefficients();

        return qqa.cross(qqb);
    }

    public derivativeAt(t: number): Vector2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);

        return p12.sub(p01).mulS(2);
    }

    public derivativeCoefficients(): [Vector2, Vector2] {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p1);

        // qqa = 2 * (v2 - v1)
        // qqb = v1 + v1
        const qqa = v2.sub(v1).mulS(2);
        const qqb = v1.add(v1);

        return [qqa, qqb];
    }

    public intersectLine(c: ReadonlyBezier1Curve2, outParameters: number[]): void {
        const a0 = Vector2.signedArea(c.p0, c.p1, this.p0);
        const a1 = Vector2.signedArea(c.p0, c.p1, this.p1);
        const a2 = Vector2.signedArea(c.p0, c.p1, this.p2);

        const v1 = a1 - a0;
        const v2 = a2 - a1;

        const r = solveQuadratic(v2 - v1, v1, a0);

        if (r.type === "two") {
            if (r.x1 >= 0 && r.x1 <= 1) {
                outParameters.push(r.x1);
            }

            if (r.x2 >= 0 && r.x2 <= 1) {
                outParameters.push(r.x2);
            }
        }
    }

    public intersectQuad(c: ReadonlyBezier2Curve2, outParameters: Vector2[]): void {
        const i1 = new Interval(0, 1);
        const i2 = new Interval(0, 1);

        getIntersectionQuadQuad(this, i1, c, i2, outParameters);
    }

    public isCollinear(): boolean {
        return this.curvatureMetric() === 0;
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite() && this.p2.isFinite();
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1) && this.p1.eq(this.p2);
    }

    public offsetCuspParameter(rad: number): [number, number] {
        const [qqa, qqb] = this.derivativeCoefficients();

        const alen2 = qqa.lengthSq();
        const blen2 = qqb.lengthSq();
        const axb = qqa.cross(qqb);
        const aob = qqa.dot(qqb);
        const fac = 1 / alen2;

        const tc = fac * -aob;

        let td = 0;

        if (axb !== 0) {
            const cbrt = Math.cbrt(rad * rad * axb * axb);
            const sqrt = Math.sqrt(aob * aob - alen2 * (blen2 - cbrt));

            td = fac * sqrt;
        }

        return [tc, td];
    }

    public reverse(): Bezier2Curve2 {
        return new Bezier2Curve2(this.p2, this.p1, this.p0);
    }

    public set(p0: Vector2, p1: Vector2, p2: Vector2): void {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    public setFrom(c: ReadonlyBezier2Curve2): void {
        this.p0 = c.p0;
        this.p1 = c.p1;
        this.p2 = c.p2;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
        this.p2 = new Vector2(x2, y2);
    }

    public signedArea(): number {
        const v0 = this.p0;
        const v1 = this.p1;
        const v2 = this.p2;

        const a01 = 2 * v0.cross(v1);
        const a12 = 2 * v1.cross(v2);
        const a02 = v0.cross(v2);

        return (a01 + a02 + a12) / 6;
    }

    public splitAfter(t: number): Bezier2Curve2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);

        const p012 = p01.lerp(p12, t);

        return new Bezier2Curve2(p012, p12, this.p2);
    }

    public splitAt(t: number): [Bezier2Curve2, Bezier2Curve2] {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);

        const p012 = p01.lerp(p12, t);

        const c1 = new Bezier2Curve2(this.p0, p01, p012);
        const c2 = new Bezier2Curve2(p012, p12, this.p2);

        return [c1, c2];
    }

    public splitBefore(t: number): Bezier2Curve2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);

        const p012 = p01.lerp(p12, t);

        return new Bezier2Curve2(this.p0, p01, p012);
    }

    public splitBetween(t0: number, t1: number): Bezier2Curve2 {
        // Blossoming (Curves and Surfaces for CAGD by Gerald Farin)
        const t0p0 = this.p0.lerp(this.p1, t0);
        const t1p1 = this.p0.lerp(this.p1, t1);
        const t0p1 = this.p1.lerp(this.p2, t0);
        const t1p2 = this.p1.lerp(this.p2, t1);

        const tp0 = t0p0.lerp(t0p1, t0);
        const tp1 = t1p1.lerp(t1p2, t0);
        const tp2 = t1p1.lerp(t1p2, t1);

        return new Bezier2Curve2(tp0, tp1, tp2);
    }

    public tangentEnd(): Vector2 {
        if (!this.p2.eq(this.p1)) {
            return this.p2.sub(this.p1);
        } else {
            return this.p1.sub(this.p0);
        }
    }

    public tangentStart(): Vector2 {
        if (!this.p1.eq(this.p0)) {
            return this.p1.sub(this.p0);
        } else {
            return this.p2.sub(this.p1);
        }
    }

    public toArray(): [number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.p2.x, this.p2.y];
    }

    public toString(): string {
        return "{p0: " + this.p0.toString() + ", p1: " + this.p1.toString() + ", p2: " + this.p2.toString() + "}";
    }

    public valueAt(t: number): Vector2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);

        return p01.lerp(p12, t);
    }

    public vertexParameter(): number {
        const [qqa, qqb] = this.derivativeCoefficients();

        // The vertex is at the minimum of the curvature (only one solution)
        return -qqa.dot(qqb) / qqa.lengthSq();
    }

    public windingAt(p: ReadonlyVector2): number {
        const v0 = this.p0.y - p.y;
        const v1 = this.p1.y - this.p0.y;
        const v2 = this.p2.y - this.p1.y;

        const r = solveQuadratic(v2 - v1, v1, v0);

        let wind = 0;

        if (r.type === "two") {
            wind += getWindingAtParameterQuadratic(this, r.x1, p.x);
            wind += getWindingAtParameterQuadratic(this, r.x2, p.x);
        }

        return wind;
    }
}

export class Bezier3Curve2 implements ReadonlyBezier3Curve2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;
    public p2: ReadonlyVector2;
    public p3: ReadonlyVector2;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2, p3: ReadonlyVector2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    public get pn(): ReadonlyVector2 {
        return this.p3;
    }

    public get type(): "bezier-3" {
        return "bezier-3";
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): Bezier3Curve2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);
        const p2 = Vector2.fromArray(data, offset + 4);
        const p3 = Vector2.fromArray(data, offset + 6);

        return new Bezier3Curve2(p0, p1, p2, p3);
    }

    public static fromObject(obj: Bezier3Curve2Like): Bezier3Curve2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        const p2 = Vector2.fromObject(obj.p2);
        const p3 = Vector2.fromObject(obj.p3);
        return new Bezier3Curve2(p0, p1, p2, p3);
    }

    public static fromXY(
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): Bezier3Curve2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);
        const p3 = new Vector2(x3, y3);

        return new Bezier3Curve2(p0, p1, p2, p3);
    }

    public static toObject(c: ReadonlyBezier3Curve2): Bezier3Curve2Like {
        const p0 = Vector2.toObject(c.p0);
        const p1 = Vector2.toObject(c.p1);
        const p2 = Vector2.toObject(c.p2);
        const p3 = Vector2.toObject(c.p3);
        return { p0, p1, p2, p3 };
    }

    public bounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p3);
        const [qqa, qqb, qqc] = this.derivativeCoefficients();

        const r1 = solveQuadratic(qqa.x, 0.5 * qqb.x, qqc.x);
        const r2 = solveQuadratic(qqa.y, 0.5 * qqb.y, qqc.y);

        if (r1.type === "two") {
            setEncloseCurveAt(this, box, r1.x1);
            setEncloseCurveAt(this, box, r1.x2);
        }

        if (r2.type === "two") {
            setEncloseCurveAt(this, box, r2.x1);
            setEncloseCurveAt(this, box, r2.x2);
        }

        return box;
    }

    public clone(): Bezier3Curve2 {
        return new Bezier3Curve2(this.p0, this.p1, this.p2, this.p3);
    }

    public coefficients(): [Vector2, Vector2, Vector2, Vector2] {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p1);
        const v3 = this.p3.sub(this.p2);

        // qa = v3 - v2 - v2 + v1;
        // qb = 3 * (v2 - v1);
        // qc = 3 * v1;
        const qa = v3.sub(v2).sub(v2).add(v1);
        const qb = v2.sub(v1).mulS(3);
        const qc = v1.mulS(3);
        const qd = this.p0.clone();

        return [qa, qb, qc, qd];
    }

    public controlBounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p3);
        box.setEnclosePoint(box, this.p1);
        box.setEnclosePoint(box, this.p2);

        return box;
    }

    public curvatureAt(t: number): number {
        const [qqa, qqb, qqc] = this.derivativeCoefficients();

        // vv = qqa * t^2 + qqb * t + qqc
        // vvv = 2 * qqa * t + qqb
        const vv = qqa.mulS(t).add(qqb).mulS(t).add(qqc);
        const vvv = qqa.mulS(2 * t).add(qqb);

        const len = vv.length();

        return vv.cross(vvv) / (len * len * len);
    }

    public curvatureMetric(): number {
        const [qqa, qqb] = this.derivativeCoefficients();

        return qqa.cross(qqb);
    }

    public derivativeAt(t: number): Vector2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);

        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        return p123.sub(p012).mulS(3);
    }

    public derivativeCoefficients(): [Vector2, Vector2, Vector2] {
        const v1 = this.p1.sub(this.p0);
        const v2 = this.p2.sub(this.p1);
        const v3 = this.p3.sub(this.p2);

        // qqa = 3 * (v3 - v2 - v2 + v1);
        // qqb = 6 * (v2 - v1);
        // qqc = 3 * v1;
        const qqa = v3.sub(v2).sub(v2).add(v1).mulS(3);
        const qqb = v2.sub(v1).mulS(6);
        const qqc = v1.mulS(3);

        return [qqa, qqb, qqc];
    }

    public inflectionParameter(): [number, number] {
        // To get the inflections C'(t) cross C''(t) = at^2 + bt + c = 0 needs to be solved for 't'
        const [qqa, qqb, qqc] = this.derivativeCoefficients();

        let tc: number | undefined;
        let td: number | undefined;

        // The first cooefficient of the quadratic formula is also the denominator
        const den = qqb.cross(qqa);

        if (den !== 0) {
            // Two roots might exist, solve with quadratic formula ('td' is real)
            tc = qqa.cross(qqc) / den;
            td = tc * tc + qqb.cross(qqc) / den;

            // If 'td < 0' there are two complex roots (no need to solve)
            // If 'td == 0' there is a real double root at 'tc' (cusp case)
            if (td > 0) {
                // Two real roots at 'tc - td' and 'tc + td' exist
                td = Math.sqrt(td);
            }
        } else {
            // One real root might exist, solve linear case ('td' is NaN)
            tc = (-0.5 * qqc.cross(qqb)) / qqc.cross(qqa);
            td = Number.NaN;
        }

        return [tc, td];
    }

    public isCollinear(): boolean {
        return this.curvatureMetric() === 0;
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite() && this.p2.isFinite() && this.p3.isFinite();
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1) && this.p1.eq(this.p2) && this.p2.eq(this.p3);
    }

    public reverse(): Bezier3Curve2 {
        return new Bezier3Curve2(this.p3, this.p2, this.p1, this.p0);
    }

    public set(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2): void {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    public setFrom(c: ReadonlyBezier3Curve2): void {
        this.p0 = c.p0;
        this.p1 = c.p1;
        this.p2 = c.p2;
        this.p3 = c.p3;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
        this.p2 = new Vector2(x2, y2);
        this.p3 = new Vector2(x3, y3);
    }

    public signedArea(): number {
        const v0 = this.p0;
        const v1 = this.p1;
        const v2 = this.p2;
        const v3 = this.p3;

        const a01 = 6 * v0.cross(v1);
        const a23 = 6 * v2.cross(v3);
        const a02 = 3 * v0.cross(v2);
        const a12 = 3 * v1.cross(v2);
        const a13 = 3 * v1.cross(v3);
        const a03 = v0.cross(v3);

        return (a01 + a02 + a03 + a12 + a13 + a23) / 20;
    }

    public splitAfter(t: number): Bezier3Curve2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);

        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        const p0123 = p012.lerp(p123, t);

        return new Bezier3Curve2(this.p0, p01, p012, p0123);
    }

    public splitAt(t: number): [Bezier3Curve2, Bezier3Curve2] {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);

        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        const p0123 = p012.lerp(p123, t);

        const c1 = new Bezier3Curve2(this.p0, p01, p012, p0123);
        const c2 = new Bezier3Curve2(p0123, p123, p23, this.p3);

        return [c1, c2];
    }

    public splitBefore(t: number): Bezier3Curve2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);

        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        const p0123 = p012.lerp(p123, t);

        return new Bezier3Curve2(p0123, p123, p23, this.p3);
    }

    public splitBetween(t0: number, t1: number): Bezier3Curve2 {
        // Blossoming (Curves and Surfaces for CAGD by Gerald Farin)
        let t0p0 = this.p0.lerp(this.p1, t0);
        let t1p1 = this.p0.lerp(this.p1, t1);
        let t0p1 = this.p1.lerp(this.p2, t0);
        let t1p2 = this.p1.lerp(this.p2, t1);
        let t0p2 = this.p2.lerp(this.p3, t0);
        let t1p3 = this.p2.lerp(this.p3, t1);

        t0p0 = t0p0.lerp(t0p1, t0);
        t0p1 = t0p1.lerp(t0p2, t0);

        t1p3 = t1p2.lerp(t1p3, t1);
        t1p2 = t1p1.lerp(t1p2, t1);

        t0p0 = t0p0.lerp(t0p1, t0);
        t1p1 = t0p0.lerp(t0p1, t1);

        t0p2 = t1p2.lerp(t1p3, t0);
        t1p3 = t1p2.lerp(t1p3, t1);

        return new Bezier3Curve2(t0p0, t1p1, t0p2, t1p3);
    }

    public tangentEnd(): Vector2 {
        if (!this.p3.eq(this.p2)) {
            return this.p3.sub(this.p2);
        } else if (!this.p2.eq(this.p1)) {
            return this.p2.sub(this.p1);
        } else {
            return this.p1.sub(this.p0);
        }
    }

    public tangentStart(): Vector2 {
        if (!this.p1.eq(this.p0)) {
            return this.p1.sub(this.p0);
        } else if (!this.p2.eq(this.p1)) {
            return this.p2.sub(this.p1);
        } else {
            return this.p3.sub(this.p2);
        }
    }

    public toArray(): [number, number, number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.p3.x, this.p3.y];
    }

    public toString(): string {
        return (
            "{p0: " +
            this.p0.toString() +
            ", p1: " +
            this.p1.toString() +
            ", p2: " +
            this.p2.toString() +
            ", p3: " +
            this.p3.toString() +
            "}"
        );
    }

    public valueAt(t: number): Vector2 {
        const p01 = this.p0.lerp(this.p1, t);
        const p12 = this.p1.lerp(this.p2, t);
        const p23 = this.p2.lerp(this.p3, t);

        const p012 = p01.lerp(p12, t);
        const p123 = p12.lerp(p23, t);

        return p012.lerp(p123, t);
    }

    public windingAt(p: ReadonlyVector2): number {
        const v0 = this.p0.y - p.y;
        const v1 = this.p1.y - this.p0.y;
        const v2 = this.p2.y - this.p1.y;
        const v3 = this.p3.y - this.p2.y;

        const r = solveCubic(v3 - v2 - v2 + v1, v2 - v1, v1, v0);

        let wind = 0;

        if (r.type === "three") {
            wind += getWindingAtParameterCubic(this, r.x1, p.x);
            wind += getWindingAtParameterCubic(this, r.x2, p.x);
            wind += getWindingAtParameterCubic(this, r.x3, p.x);
        } else {
            wind += getWindingAtParameterCubic(this, r.x, p.x);
        }

        return wind;
    }
}

export class BezierRCurve2 implements ReadonlyBezierRCurve2 {
    public p0: ReadonlyVector2;
    public p1: ReadonlyVector2;
    public p2: ReadonlyVector2;
    public w: number;

    public constructor(p0: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2, w: number) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.w = w;
    }

    public get pn(): ReadonlyVector2 {
        return this.p2;
    }

    public get type(): "bezier-r" {
        return "bezier-r";
    }

    public static fromArray(data: ArrayLike<number>, offset = 0): BezierRCurve2 {
        const p0 = Vector2.fromArray(data, offset);
        const p1 = Vector2.fromArray(data, offset + 2);
        const p2 = Vector2.fromArray(data, offset + 4);
        const w = data[offset + 6];

        return new BezierRCurve2(p0, p1, p2, w);
    }

    public static fromCenterPoint(p0: Vector2, p1: Vector2, p2: Vector2, pc: ReadonlyVector2): BezierRCurve2 {
        const pm = p0.lerp(p2, 0.5);
        const dm = pm.distance(pc);
        const d1 = p1.distance(pc);
        const w = Math.sqrt(dm / d1);
        return new BezierRCurve2(p0, p1, p2, w);
    }

    public static fromObject(obj: BezierRCurve2Like): BezierRCurve2 {
        const p0 = Vector2.fromObject(obj.p0);
        const p1 = Vector2.fromObject(obj.p1);
        const p2 = Vector2.fromObject(obj.p2);
        return new BezierRCurve2(p0, p1, p2, obj.w);
    }

    public static fromProjectivePoints(p0: ReadonlyVector3, p1: ReadonlyVector3, p2: ReadonlyVector3): BezierRCurve2 {
        const pp0 = Vector2.fromXYW(p0.x, p0.y, p0.z);
        const pp1 = Vector2.fromXYW(p1.x, p1.y, p1.z);
        const pp2 = Vector2.fromXYW(p2.x, p2.y, p2.z);
        const w = BezierRCurve2.getNormalizedWeight(p0.z, p1.z, p2.z);

        return new BezierRCurve2(pp0, pp1, pp2, w);
    }

    public static fromXY(
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        w: number,
    ): BezierRCurve2 {
        const p0 = new Vector2(x0, y0);
        const p1 = new Vector2(x1, y1);
        const p2 = new Vector2(x2, y2);

        return new BezierRCurve2(p0, p1, p2, w);
    }

    public static getNormalizedWeight(w0: number, w1: number, w2: number): number {
        return w1 / Math.sqrt(w0 * w2);
    }

    public static getWeightFromVectors(pc: ReadonlyVector2, p1: ReadonlyVector2, p2: ReadonlyVector2): number {
        const v1 = p1.sub(pc);
        const v2 = p2.sub(pc);

        return v1.dot(v2) / Math.sqrt(v1.lengthSq() * v2.lengthSq());
    }

    public static toObject(c: ReadonlyBezierRCurve2): BezierRCurve2Like {
        const p0 = Vector2.toObject(c.p0);
        const p1 = Vector2.toObject(c.p1);
        const p2 = Vector2.toObject(c.p2);
        return { p0, p1, p2, w: c.w };
    }

    public bounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p2);
        const [qqa, qqb, qqc] = this.derivativeCoefficients();

        const r1 = solveQuadratic(qqa.x, 0.5 * qqb.x, qqc.x);
        const r2 = solveQuadratic(qqa.y, 0.5 * qqb.y, qqc.y);

        if (r1.type === "two") {
            setEncloseCurveAt(this, box, r1.x1);
            setEncloseCurveAt(this, box, r1.x2);
        }

        if (r2.type === "two") {
            setEncloseCurveAt(this, box, r2.x1);
            setEncloseCurveAt(this, box, r2.x2);
        }

        return box;
    }

    public clone(): BezierRCurve2 {
        return new BezierRCurve2(this.p0, this.p1, this.p2, this.w);
    }

    public controlBounds(): MinMaxBox2 {
        const box = MinMaxBox2.fromPoints(this.p0, this.p2);
        box.setEnclosePoint(box, this.p1);

        return box;
    }

    public derivativeAt(t: number): Vector2 {
        const [p0, p1, p2] = this.projectivePoints();

        const p01 = p0.lerp(p1, t);
        const p12 = p1.lerp(p2, t);

        // Point and derivative in homogeneous coordinates
        const p = p01.lerp(p12, t);
        const pp = p12.sub(p01).mulS(2);

        // Transforming to cartesian coordinates requires quotient rule
        const x = pp.x * p.z - p.x * pp.z;
        const y = pp.y * p.z - p.y * pp.z;
        const z = p.z * p.z;

        return Vector2.fromXYW(x, y, z);
    }

    /**
     * Returns the derivative coefficients of the curve.
     *
     * **Note:** Transforming to cartesian coordinates requires the w-component to be squared (see example).
     *
     * # Example:
     * ```
     * const c = BezierRCurve2.fromXY(0, 0, 0, 1, 1, 1, 2);
     * const [qqa, qqb, qqc] = c.derivativeCoefficients();
     * const t = 0.5;
     * const vv = qqa.mul(t).add(qqb).mul(t).add(qqc);
     * const v = Vector2.fromXYW(vv.x, vv.y, vv.z * vv.z);
     * ```
     */
    public derivativeCoefficients(): [Vector3, Vector3, Vector3] {
        const [p0, p1, p2] = this.projectivePoints();

        const pp2x = p2.x * p1.z - p1.x * p2.z;
        const pp2y = p2.y * p1.z - p1.y * p2.z;
        const pp1x = p2.x * p0.z - p0.x * p2.z;
        const pp1y = p2.y * p0.z - p0.y * p2.z;
        const pp0x = p1.x * p0.z - p0.x * p1.z;
        const pp0y = p1.y * p0.z - p0.y * p1.z;

        // Derivative coefficients as points
        const pp2 = new Vector3(2 * pp2x, 2 * pp2y, p2.z);
        const pp1 = new Vector3(pp1x, pp1y, p1.z);
        const pp0 = new Vector3(2 * pp0x, 2 * pp0y, p0.z);

        const vv2 = pp2.sub(pp1);
        const vv1 = pp1.sub(pp0);

        const qqa = vv2.sub(vv1);
        const qqb = vv1.mulS(2);
        const qqc = pp0;

        return [qqa, qqb, qqc];
    }

    public isFinite(): boolean {
        return this.p0.isFinite() && this.p1.isFinite() && this.p2.isFinite() && Number.isFinite(this.w);
    }

    public isPoint(): boolean {
        return this.p0.eq(this.p1) && this.p1.eq(this.p2);
    }

    public projectivePoints(): [Vector3, Vector3, Vector3] {
        const p0 = Vector3.fromXYW(this.p0.x, this.p0.y, 1);
        const p1 = Vector3.fromXYW(this.p1.x, this.p1.y, this.w);
        const p2 = Vector3.fromXYW(this.p2.x, this.p2.y, 1);

        return [p0, p1, p2];
    }

    public reverse(): BezierRCurve2 {
        return new BezierRCurve2(this.p2, this.p1, this.p0, this.w);
    }

    public set(p0: Vector2, p1: Vector2, p2: Vector2, w: number): void {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.w = w;
    }

    public setFrom(c: ReadonlyBezierRCurve2): void {
        this.p0 = c.p0;
        this.p1 = c.p1;
        this.p2 = c.p2;
        this.w = c.w;
    }

    public setXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number): void {
        this.p0 = new Vector2(x0, y0);
        this.p1 = new Vector2(x1, y1);
        this.p2 = new Vector2(x2, y2);
        this.w = w;
    }

    public signedArea(): number {
        // Inspired from: https://ich.deanmcnamee.com/graphics/2016/03/30/CurveArea.html
        const v0 = this.p0;
        const v1 = this.p1;
        const v2 = this.p2;
        const w = this.w;

        const a01 = v0.cross(v1);
        const a02 = v0.cross(v2);
        const a12 = v1.cross(v2);

        // We need to be careful around `w = -1` and `w = 1`
        // Single float mantissa size seems to be wide enough for sufficient precision
        const eps = 2 ** -23;

        if (w < 1 - eps) {
            if (w <= -1 + eps) {
                // `-Inf < w <= -1` -> Divergent case (just assume linear)
                return a02 / 2;
            } else {
                // `-1 < w < 1` -> Elliptic case
                const w1 = 1 - w * w;
                const w2 = (1 - w) / (1 + w);
                const sqrtw1 = Math.sqrt(w1);
                const sqrtw2 = Math.sqrt(w2);
                const a = w * w * (a01 + a12) - a02;
                const b = 2 * w * (a01 + a12 - a02);
                const d = 2 * sqrtw1 * w1;
                return (b * Math.atan(sqrtw2) - a * sqrtw1) / d;
            }
        } else {
            if (w <= 1 + eps) {
                // `w == 1` -> Parabolic case (series expansion about `w = 1` because of singularity)
                const s0 = (2 * a01 + a02 + 2 * a12) / 6;
                const s1 = (2 / 15) * (a02 - a01 - a12) * (w - 1);
                return s0 - s1;
            } else {
                // `1 < w < Inf` -> Hyperbolic case
                const w1 = w * w - 1;
                const w2 = (w - 1) / (w + 1);
                const sqrtw1 = Math.sqrt(w1);
                const sqrtw2 = Math.sqrt(w2);
                const a = w * w * (a01 + a12) - a02;
                const b = 2 * w * (a01 + a12 - a02);
                const d = 2 * sqrtw1 * w1;
                return (a * sqrtw1 - b * Math.atanh(sqrtw2)) / d;
            }
        }
    }

    public splitAfter(t: number): BezierRCurve2 {
        const [p0, p1, p2] = this.projectivePoints();

        const p01 = p0.lerp(p1, t);
        const p12 = p1.lerp(p2, t);

        const p012 = p01.lerp(p12, t);

        return BezierRCurve2.fromProjectivePoints(p0, p01, p012);
    }

    public splitAt(t: number): [BezierRCurve2, BezierRCurve2] {
        const [p0, p1, p2] = this.projectivePoints();

        const p01 = p0.lerp(p1, t);
        const p12 = p1.lerp(p2, t);

        const p012 = p01.lerp(p12, t);

        const c1 = BezierRCurve2.fromProjectivePoints(p0, p01, p012);
        const c2 = BezierRCurve2.fromProjectivePoints(p012, p12, p2);

        return [c1, c2];
    }

    public splitBefore(t: number): BezierRCurve2 {
        const [p0, p1, p2] = this.projectivePoints();

        const p12 = p1.lerp(p2, t);
        const p01 = p0.lerp(p1, t);

        const p012 = p01.lerp(p12, t);

        return BezierRCurve2.fromProjectivePoints(p012, p12, p2);
    }

    public splitBetween(t0: number, t1: number): BezierRCurve2 {
        const [p0, p1, p2] = this.projectivePoints();

        // See blossoming (Curves and Surfaces for CAGD by Gerald Farin)
        const t0p0 = p0.lerp(p1, t0);
        const t1p1 = p0.lerp(p1, t1);
        const t0p1 = p1.lerp(p2, t0);
        const t1p2 = p1.lerp(p2, t1);

        const tp0 = t0p0.lerp(t0p1, t0);
        const tp1 = t1p1.lerp(t1p2, t0);
        const tp2 = t1p1.lerp(t1p2, t1);

        return BezierRCurve2.fromProjectivePoints(tp0, tp1, tp2);
    }

    public tangentEnd(): Vector2 {
        if (!this.p2.eq(this.p1)) {
            return this.p2.sub(this.p1);
        } else {
            return this.p1.sub(this.p0);
        }
    }

    public tangentStart(): Vector2 {
        if (!this.p1.eq(this.p0)) {
            return this.p1.sub(this.p0);
        } else {
            return this.p2.sub(this.p1);
        }
    }

    public toArray(): [number, number, number, number, number, number, number] {
        return [this.p0.x, this.p0.y, this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.w];
    }

    public toString(): string {
        return (
            "{p0: " +
            this.p0.toString() +
            ", p1: " +
            this.p1.toString() +
            ", p2: " +
            this.p2.toString() +
            ", w: " +
            this.w +
            "}"
        );
    }

    public valueAt(t: number): Vector2 {
        const [p0, p1, p2] = this.projectivePoints();

        const p01 = p0.lerp(p1, t);
        const p12 = p1.lerp(p2, t);

        const p = p01.lerp(p12, t);

        return Vector2.fromXYW(p.x, p.y, p.z);
    }

    public windingAt(p: ReadonlyVector2): number {
        const y1 = this.w * this.p1.y - this.w * p.y + p.y;

        const v0 = this.p0.y - p.y;
        const v1 = y1 - this.p0.y;
        const v2 = this.p2.y - y1;

        const r = solveQuadratic(v2 - v1, v1, v0);

        let wind = 0;

        if (r.type === "two") {
            wind += getWindingAtParameterConic(this, r.x1, p.x);
            wind += getWindingAtParameterConic(this, r.x2, p.x);
        }

        return wind;
    }
}
