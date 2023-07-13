import { expect, test } from "vitest";
import { PathSweepEvent2 } from "../../src/internal/path-sweep.js";
import { Point2 } from "../../src/primitives/point.js";

test("compareQueue", () => {
    const e0 = createEvent(400, 400, 600, 600, true);
    checkQueue(e0, e0, "e0 = e0");

    // Regular
    const e1 = createEvent(600, 600, 800, 800, true);
    checkQueue(e0, e1, "e0 < e1");

    // Same X
    const e2 = createEvent(400, 600, 800, 800, true);
    checkQueue(e0, e2, "e0 < e2");

    // Same X, Y
    const e3 = createEvent(400, 400, 600, 800, false);
    checkQueue(e3, e0, "e3 < e0");

    // Same X, Y, Left
    const e4 = createEvent(400, 400, 600, 800, true);
    checkQueue(e0, e4, "e0 < e4");
});

test("compareQueueSpecific", () => {
    const e1 = createEvent(375, 400, 100, 400, false);
    const e2 = createEvent(375, 400, 325, 500, false);
    checkQueue(e1, e2, "e1 < e2");

    const e3 = createEvent(188, 225, 175, 200, false);
    const e4 = createEvent(188, 225, 100, 400, false);
    checkQueue(e3, e4, "e3 < e4");
});

test("compareStatus", () => {
    const e0 = createEvent(400, 400, 600, 400);

    checkStatus(e0, e0, "e0 = e0");

    // Same left point
    const e1 = createEvent(400, 400, 400, 200);
    const e2 = createEvent(400, 400, 600, 200);

    const e3 = createEvent(400, 400, 600, 600);
    const e4 = createEvent(400, 400, 400, 600);

    checkStatus(e1, e0, "e1 < e0");
    checkStatus(e2, e0, "e2 < e0");

    checkStatus(e0, e3, "e0 < e3");
    checkStatus(e0, e4, "e0 < e4");

    // Not same left point
    const e7 = createEvent(200, 0, 400, 200);
    const e8 = createEvent(400, 200, 600, 400);
    const e9 = createEvent(400, 200, 800, 600);

    const e10 = createEvent(200, 400, 400, 600);
    const e11 = createEvent(400, 600, 600, 800);
    const e12 = createEvent(400, 600, 800, 1000);

    checkStatus(e7, e0, "e7 < e0");
    checkStatus(e8, e0, "e8 < e0");
    checkStatus(e9, e0, "e9 < e0");

    checkStatus(e0, e10, "e0 < e10");
    checkStatus(e0, e11, "e0 < e11");
    checkStatus(e0, e12, "e0 < e12");
});

function createEvent(x0: number, y0: number, x1: number, y1: number, left = true): PathSweepEvent2 {
    const p0 = new Point2(x0, y0);
    const p1 = new Point2(x1, y1);
    const ref = { weight: 0, set: 0, data: undefined };
    const seg = { p0, p1, ref };

    return new PathSweepEvent2(p0, p1, seg, 0, left);
}

function checkQueue(before: PathSweepEvent2, after: PathSweepEvent2, id: string): void {
    const beforeAfter = PathSweepEvent2.compareQueue(before, after);
    const afterBefore = PathSweepEvent2.compareQueue(after, before);

    const isValid = (beforeAfter === 0 && afterBefore === 0) || (beforeAfter < 0 && afterBefore > 0);

    if (!isValid) {
        console.error(
            `Event order wrong: ${id}\n` +
                `\tBefore: ${before.p0} -> ${before.p1} (${before.left})\n` +
                `\tAfter: ${after.p0} -> ${after.p1} (${after.left})`,
        );
    }

    expect(isValid).toEqual(true);
}

function checkStatus(below: PathSweepEvent2, above: PathSweepEvent2, id: string): void {
    const belowAbove = PathSweepEvent2.compareStatus(below, above);
    const aboveBelow = PathSweepEvent2.compareStatus(above, below);

    const isValid = (belowAbove === 0 && aboveBelow === 0) || (belowAbove < 0 && aboveBelow > 0);

    if (!isValid) {
        console.error(
            `Event order wrong: ${id}\n` +
                `\tBelow: ${below.p0} -> ${below.p1}\n` +
                `\tAbove: ${above.p0} -> ${above.p1}`,
        );
    }

    expect(isValid).toEqual(true);
}
