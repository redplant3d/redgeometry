import { Path2 } from "../core/path.js";
import { Polygon2EdgeIterator } from "../internal/iterator.js";
import { Box2 } from "./box.js";
import { Edge2 } from "./edge.js";
import type { Matrix3, Matrix3A } from "./matrix.js";
import { Point2 } from "./point.js";

export class Polygon2 {
    public points: Point2[];

    public constructor(points: Point2[]) {
        this.points = points;
    }

    public static createEmpty(): Polygon2 {
        return new Polygon2([]);
    }

    public static isAreaIntersection(poly1: Polygon2, poly2: Polygon2, isNonZero: boolean): boolean {
        if (Polygon2.isEdgeIntersection(poly1, poly2)) {
            // Polygons intersect
            return true;
        }

        if (Polygon2.isPointInside(poly1, poly2.points[0], isNonZero)) {
            // `poly2` is inside `poly1`
            return true;
        }

        if (Polygon2.isPointInside(poly2, poly1.points[0], isNonZero)) {
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

    public static isPointInside(poly: Polygon2, p: Point2, isNonZero: boolean): boolean {
        let wind = 0;

        for (const e of poly.getEdgeIterator()) {
            wind += e.toBezier().getWindingAt(p);
        }

        if (!isNonZero) {
            wind = wind & 1;
        }

        return wind !== 0;
    }

    public static isPolygonInside(poly1: Polygon2, poly2: Polygon2, isNonZero = false): boolean {
        for (const p of poly2.points) {
            if (!Polygon2.isPointInside(poly1, p, isNonZero)) {
                return false;
            }
        }

        return true;
    }

    public addPoint(p: Point2): void {
        this.points.push(p);
    }

    public addXY(x: number, y: number): void {
        this.addPoint(new Point2(x, y));
    }

    public clear(): void {
        this.points = [];
    }

    public clone(): Polygon2 {
        const points = this.points.map((p) => p.clone());
        return new Polygon2(points);
    }

    public findClosestEdgePoint(p: Point2): Edge2 | undefined {
        let minDistSq = Number.POSITIVE_INFINITY;
        let closestEdge: Edge2 | undefined;

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

    public getBounds(): Box2 {
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

        return new Box2(x0, y0, x1, y1);
    }

    public getCentroid(): Point2 {
        let x = 0;
        let y = 0;

        for (const p of this.points) {
            x += p.x;
            y += p.y;
        }

        const len = this.points.length;

        return new Point2(x / len, y / len);
    }

    public getConvexHull(): Polygon2 {
        // Find lowest/leftmost point
        let p0 = this.points[0];

        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i];

            if (p1.y === p0.y ? p1.x < p0.x : p1.y < p0.y) {
                p0 = p1;
            }
        }

        // Sort points by polar angle around p0
        const points = this.points.slice();

        points.sort((pa, pb) => pa.sub(p0).angle() - pb.sub(p0).angle());

        // Compute the convex hull (graham scan)
        let idx = 2;

        while (idx < points.length) {
            const pp0 = points[idx - 2];
            const pp1 = points[idx - 1];
            const pp2 = points[idx - 0];

            const v1 = pp0.sub(pp1);
            const v2 = pp0.sub(pp2);

            if (v1.cross(v2) > 0) {
                idx++;
            } else {
                idx--;
                points.splice(idx, 1);
            }
        }

        return new Polygon2(points);
    }

    /**
     * Returns an iterator which traverses all edges of the polygon.
     */
    public getEdgeIterator(): Polygon2EdgeIterator {
        return new Polygon2EdgeIterator(this.points);
    }

    public getEdges(): Edge2[] {
        const edges: Edge2[] = [];

        for (const e of this.getEdgeIterator()) {
            edges.push(e);
        }

        return edges;
    }

    public getOrientation(): number {
        let result = 0;

        for (const edge of this.getEdgeIterator()) {
            result += edge.p0.toVector().cross(edge.p1.toVector());
        }

        return result;
    }

    public getOrientedBoundingBox(): Polygon2 {
        // Find the oriented bounding box with the smallest area
        let minArea = Number.POSITIVE_INFINITY;

        const points = [Point2.createZero(), Point2.createZero(), Point2.createZero(), Point2.createZero()];
        const convexHull = this.getConvexHull();

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
            const v1 = v0.unit().normal().mul(minDist);

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

    public transform(mat: Matrix3 | Matrix3A): void {
        const points = this.points;
        for (let i = 0; i < points.length; i++) {
            points[i] = mat.mulPt2(points[i]);
        }
    }
}
