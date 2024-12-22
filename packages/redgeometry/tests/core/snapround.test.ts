import { expect, test } from "vitest";
import { intersectSegmentWithPixel } from "../../src/core/snapround.js";
import { Point2 } from "../../src/primitives/point.js";

test("intersectSegmentWithPixel", () => {
    const p = new Point2(2.5, 2.5);

    const p0 = new Point2(1, 1);
    const p1 = new Point2(2, 1);
    const p2 = new Point2(3, 1);
    const p3 = new Point2(4, 1);
    const p4 = new Point2(4, 2);
    const p5 = new Point2(4, 3);
    const p6 = new Point2(4, 4);
    const p7 = new Point2(3, 4);
    const p8 = new Point2(2, 4);
    const p9 = new Point2(1, 4);
    const p10 = new Point2(1, 3);
    const p11 = new Point2(1, 2);

    // Diagonal
    expect(intersectSegmentWithPixel(p0, p6, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p1, p5, p)).toEqual(undefined);
    expect(intersectSegmentWithPixel(p7, p11, p)).toEqual(undefined);

    expect(intersectSegmentWithPixel(p2, p10, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p3, p9, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p4, p8, p)).toEqual(undefined);

    expect(intersectSegmentWithPixel(p5, p1, p)).toEqual(undefined);
    expect(intersectSegmentWithPixel(p6, p0, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p7, p11, p)).toEqual(undefined);

    expect(intersectSegmentWithPixel(p8, p4, p)).toEqual(undefined);
    expect(intersectSegmentWithPixel(p9, p3, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p10, p2, p)).not.toEqual(undefined);

    // Vertical
    expect(intersectSegmentWithPixel(p1, p8, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p1, p7, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p2, p7, p)).toEqual(undefined);

    expect(intersectSegmentWithPixel(p7, p2, p)).toEqual(undefined);
    expect(intersectSegmentWithPixel(p7, p1, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p8, p1, p)).not.toEqual(undefined);

    // Horexpect
    expect(intersectSegmentWithPixel(p4, p11, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p4, p10, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p5, p10, p)).toEqual(undefined);

    expect(intersectSegmentWithPixel(p10, p5, p)).toEqual(undefined);
    expect(intersectSegmentWithPixel(p10, p4, p)).not.toEqual(undefined);
    expect(intersectSegmentWithPixel(p11, p4, p)).not.toEqual(undefined);
});
