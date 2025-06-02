import { Polygon2EdgeIterator } from "../internal/iterator.js";
import { MinMaxBox2 } from "../primitives/box.js";
import { Edge2, type ReadonlyEdge2 } from "../primitives/edge.js";
import type { ReadonlyMatrix3, ReadonlyMatrix3A } from "../primitives/matrix.js";
import { Vector2, type ReadonlyVector2, type Vector2Like } from "../primitives/vector.js";
import { Path2 } from "./path.js";
import { isWindingInside, WindingOperator, type CustomWindingOperator } from "./winding.js";

export type Polygon2Like = {
    readonly points: Vector2Like[];
};

export class Polygon2 {
    public points: ReadonlyVector2[];

    public constructor(points: ReadonlyVector2[]) {
        this.points = points;
    }

    public static createConvexHull(points: ReadonlyVector2[]): Polygon2 {
        // Find lowest/leftmost point
        let p0 = points[0];

        for (let i = 1; i < points.length; i++) {
            const p1 = points[i];

            if (p1.y === p0.y ? p1.x < p0.x : p1.y < p0.y) {
                p0 = p1;
            }
        }

        const sorted = points.slice();
        sorted.sort((pa, pb) => {
            const v1 = pa.sub(p0);
            const v2 = pb.sub(p0);

            const a1 = v1.angle();
            const a2 = v2.angle();

            if (a1 !== a2) {
                // Sort by polar angle around p0
                return a1 - a2;
            }

            // Sort by distance
            return v1.lenSq() - v2.lenSq();
        });

        // Compute the convex hull (graham scan)
        const stack: ReadonlyVector2[] = [];

        for (const p0 of sorted) {
            let len = stack.length;

            while (len > 1) {
                const p2 = stack[len - 2];
                const p1 = stack[len - 1];

                const v1 = p0.sub(p1);
                const v2 = p1.sub(p2);

                if (v1.cross(v2) <= 0) {
                    break;
                }

                stack.pop();
                len -= 1;
            }

            stack.push(p0);
        }

        return new Polygon2(stack);
    }

    public static createEmpty(): Polygon2 {
        return new Polygon2([]);
    }

    public static fromObject(obj: Polygon2Like): Polygon2 {
        const points = obj.points.map((p) => Vector2.fromObject(p));
        return new Polygon2(points);
    }

    public static isAreaIntersection(
        poly1: Polygon2,
        poly2: Polygon2,
        windingOperator: WindingOperator | CustomWindingOperator,
    ): boolean {
        if (Polygon2.isEdgeIntersection(poly1, poly2)) {
            // Polygons intersect
            return true;
        }

        if (Polygon2.isPointInside(poly1, poly2.points[0], windingOperator)) {
            // `poly2` is inside `poly1`
            return true;
        }

        if (Polygon2.isPointInside(poly2, poly1.points[0], windingOperator)) {
            // `poly1` is inside `poly2`
            return true;
        }

        return false;
    }

    public static isEdgeIntersection(poly1: Polygon2, poly2: Polygon2): boolean {
        // Test pairwise (naive)
        for (const e1 of poly1.getEdgeIterator()) {
            for (const e2 of poly2.getEdgeIterator()) {
                if (Edge2.isIntersection(e1, e2)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static isPointInside(
        poly: Polygon2,
        p: ReadonlyVector2,
        windingOperator: WindingOperator | CustomWindingOperator,
    ): boolean {
        let wind = 0;

        for (const e of poly.getEdgeIterator()) {
            wind += e.toBezier().getWindingAt(p);
        }

        return isWindingInside(wind, windingOperator);
    }

    public static isPolygonInside(
        poly1: Polygon2,
        poly2: Polygon2,
        windingOperator: WindingOperator | CustomWindingOperator,
    ): boolean {
        for (const p of poly2.points) {
            if (!Polygon2.isPointInside(poly1, p, windingOperator)) {
                return false;
            }
        }

        return true;
    }

    public static toObject(path: Polygon2): Polygon2Like {
        const points = path.points.map((p) => Vector2.toObject(p));
        return { points };
    }

    public addPoint(p: ReadonlyVector2): void {
        this.points.push(p);
    }

    public addXY(x: number, y: number): void {
        this.addPoint(new Vector2(x, y));
    }

    public centroid(): Vector2 | undefined {
        let x = 0;
        let y = 0;
        let area = 0;

        for (const edge of this.getEdgeIterator()) {
            const p0 = edge.p0;
            const p1 = edge.p1;
            const a = p0.cross(p1);
            x += a * (p0.x + p1.x);
            y += a * (p0.y + p1.y);
            area += a;
        }

        if (area === 0) {
            return undefined;
        }

        area *= 3;

        return new Vector2(x / area, y / area);
    }

    public clear(): void {
        this.points = [];
    }

    public clone(): Polygon2 {
        const points = this.points.slice();
        return new Polygon2(points);
    }

    public findClosestEdgePoint(p: ReadonlyVector2): ReadonlyEdge2 | undefined {
        let minDistSq = Number.POSITIVE_INFINITY;
        let closestEdge: ReadonlyEdge2 | undefined;

        // Find the edge with the closest point on it
        for (const edge of this.getEdgeIterator()) {
            const distSq = edge.getClosestPoint(p).sub(p).lenSq();

            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestEdge = edge;
            }
        }

        return closestEdge;
    }

    public getBounds(): MinMaxBox2 {
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;

        for (const p of this.points) {
            x0 = Math.min(x0, p.x);
            y0 = Math.min(y0, p.y);
            x1 = Math.max(x1, p.x);
            y1 = Math.max(y1, p.y);
        }

        return new MinMaxBox2(x0, y0, x1, y1);
    }

    /**
     * Returns an iterator which traverses all edges of the polygon.
     */
    public getEdgeIterator(): Polygon2EdgeIterator {
        return new Polygon2EdgeIterator(this.points);
    }

    public getEdges(): ReadonlyEdge2[] {
        const edges: ReadonlyEdge2[] = [];

        for (const e of this.getEdgeIterator()) {
            edges.push(e);
        }

        return edges;
    }

    public getOrientedBoundingBox(): Polygon2 {
        // Find the oriented bounding box with the smallest area
        let minArea = Number.POSITIVE_INFINITY;

        const points = [Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO];
        const convexHull = Polygon2.createConvexHull(this.points);

        // Iterate all edges
        for (const edge of convexHull.getEdgeIterator()) {
            let minParam = Number.POSITIVE_INFINITY;
            let maxParam = Number.NEGATIVE_INFINITY;
            let minDist = Number.POSITIVE_INFINITY;

            // For every edge iterate all points
            for (const p of convexHull.points) {
                // The points of the convex hull are oriented to the inside
                // of each edge so that `dist` is always negative
                const param = edge.getParameterFromPoint(p);
                const dist = edge.getSignedDistanceFromPoint(p);

                // Find the bounding values
                minParam = Math.min(minParam, param);
                maxParam = Math.max(maxParam, param);
                minDist = Math.min(minDist, dist);
            }

            // Calculate bounding box and area
            const p0 = edge.getValueAt(minParam);
            const p1 = edge.getValueAt(maxParam);

            const v0 = p1.sub(p0);
            const v1 = v0.unit().normal().mulS(minDist);

            const area = v0.cross(v1);

            if (area < minArea) {
                // Update bounding box
                points[0] = p0;
                points[1] = p0.add(v1);
                points[2] = p1.add(v1);
                points[3] = p1;
                minArea = area;
            }
        }

        return new Polygon2(points);
    }

    public hasPoints(): boolean {
        return this.points.length > 0;
    }

    public isConvex(): boolean {
        // A polygon is convex if all interior angles are less than 180 degrees
        const length = this.points.length;

        let p1 = this.points[length - 1];
        let p2 = this.points[length - 2];

        // Approach: Check if the sign of the cross product changes
        let gtz = false;
        let ltz = false;

        for (let i = 0; i < length; i++) {
            const p0 = this.points[i];

            const cross = p1.sub(p0).cross(p2.sub(p1));

            if (cross > 0) {
                gtz = true;
            } else if (cross < 0) {
                ltz = true;
            }

            if (ltz && gtz) {
                // Sign changed
                return false;
            }

            p2 = p1;
            p1 = p0;
        }

        return true;
    }

    public isSimple(): boolean {
        // A polygon is simple if no edges are self-intersecting
        for (const e1 of this.getEdgeIterator()) {
            for (const e2 of this.getEdgeIterator()) {
                if (e1 !== e2 && !Edge2.isAdjacent(e1, e2) && Edge2.isIntersection(e1, e2)) {
                    // Edges intersect
                    return false;
                }
            }
        }

        return true;
    }

    public reverse(): void {
        this.points.reverse();
    }

    public signedArea(): number {
        let area = 0;

        for (const edge of this.getEdgeIterator()) {
            area += edge.p0.cross(edge.p1);
        }

        return 0.5 * area;
    }

    public toPath(): Path2 {
        const path = Path2.createEmpty();

        if (this.points.length > 0) {
            path.moveTo(this.points[0]);

            for (let i = 1; i < this.points.length; i++) {
                path.lineTo(this.points[i]);
            }

            path.close();
        }

        return path;
    }

    public transform(mat: ReadonlyMatrix3 | ReadonlyMatrix3A): void {
        const points = this.points;
        for (let i = 0; i < points.length; i++) {
            points[i] = mat.transformPoint(points[i]);
        }
    }
}
