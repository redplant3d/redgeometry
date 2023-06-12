import { expect, test } from "vitest";
import { Point2 } from "../../src/primitives/point.js";
import { Polygon2 } from "../../src/primitives/polygon.js";

test("isConvex", () => {
    const p0 = new Point2(0, 0);
    const p1 = new Point2(0, 1);
    const p2 = new Point2(1, 1);
    const p3 = new Point2(1, 0);

    const polygon1 = new Polygon2();
    polygon1.addPoint(p0);
    polygon1.addPoint(p1);
    polygon1.addPoint(p2);
    polygon1.addPoint(p3);

    const polygon2 = new Polygon2();
    polygon2.addPoint(p0);
    polygon2.addPoint(p2);
    polygon2.addPoint(p1);
    polygon2.addPoint(p3);

    const isConvex1 = polygon1.isConvex();
    const isConvex2 = polygon2.isConvex();

    expect(isConvex1).toEqual(true);
    expect(isConvex2).toEqual(false);
});

test("isSimple", () => {
    const p0 = new Point2(0, 0);
    const p1 = new Point2(0, 1);
    const p2 = new Point2(1, 1);
    const p3 = new Point2(1, 0);

    const polygon1 = new Polygon2();
    polygon1.addPoint(p0);
    polygon1.addPoint(p1);
    polygon1.addPoint(p2);
    polygon1.addPoint(p3);

    const polygon2 = new Polygon2();
    polygon2.addPoint(p0);
    polygon2.addPoint(p2);
    polygon2.addPoint(p1);
    polygon2.addPoint(p3);

    const isSimple1 = polygon1.isSimple();
    const isSimple2 = polygon2.isSimple();

    expect(isSimple1).toEqual(true);
    expect(isSimple2).toEqual(false);
});
