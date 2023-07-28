import {
    BooleanOperator,
    JoinType,
    WindingOperator,
    type CustomWindingOperator,
} from "redgeometry/src/core/path-options.js";
import { Polygon2 } from "redgeometry/src/primitives/polygon.js";

export function getBooleanOperator(value: string): BooleanOperator {
    switch (value) {
        case "intersection":
            return BooleanOperator.Intersection;
        case "exclusion":
            return BooleanOperator.Exclusion;
        case "awithoutb":
            return BooleanOperator.AWithoutB;
        case "bwithouta":
            return BooleanOperator.BWithoutA;
        default:
            return BooleanOperator.Union;
    }
}

export function getJoin(value: string): JoinType {
    switch (value) {
        case "miter":
            return JoinType.Miter;
        case "miterclip":
            return JoinType.MiterClip;
        case "round":
            return JoinType.Round;
        default:
            return JoinType.Bevel;
    }
}

export function getWindingRule(value: string): WindingOperator | CustomWindingOperator {
    switch (value) {
        case "evenodd":
            return WindingOperator.EvenOdd;
        case "positive":
            return WindingOperator.Positive;
        case "negative":
            return WindingOperator.Negative;
        case "absgeqtwo":
            return (wind: number) => Math.abs(wind) > 2;
        default:
            return WindingOperator.NonZero;
    }
}

export function isEdgeIntersectionArray(poly1: Polygon2, roofObstacles: Polygon2[]): boolean {
    for (const poly2 of roofObstacles) {
        if (Polygon2.isEdgeIntersection(poly1, poly2)) {
            return true;
        }
    }

    return false;
}

export function delaunayNextHalfedge(e: number): number {
    return e % 3 === 2 ? e - 2 : e + 1;
}
