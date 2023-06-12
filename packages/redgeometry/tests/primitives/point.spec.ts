import { expect, test } from "vitest";
import { Point2 } from "../../src/primitives/point.js";

test("signedArea", () => {
    const p0 = new Point2(200, 200);
    const p1 = new Point2(400, 200);

    const p2 = new Point2(300, 100);
    const p3 = new Point2(300, 200);
    const p4 = new Point2(300, 400);

    expect(Point2.signedArea(p0, p1, p2) < 0).toEqual(true);
    expect(Point2.signedArea(p1, p0, p2) > 0).toEqual(true);

    expect(Point2.signedArea(p0, p1, p3) === 0).toEqual(true);
    expect(Point2.signedArea(p1, p0, p3) === 0).toEqual(true);

    expect(Point2.signedArea(p0, p1, p4) > 0).toEqual(true);
    expect(Point2.signedArea(p1, p0, p4) < 0).toEqual(true);
});
