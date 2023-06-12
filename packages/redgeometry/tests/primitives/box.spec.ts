import { expect, test } from "vitest";
import { Box2, Box3 } from "../../src/primitives/box.js";

test("Box2 - intersects", () => {
    const b1 = new Box2(0, 0, 2, 2);
    const b2 = new Box2(1, 1, 3, 3);
    const b3 = new Box2(3, 3, 5, 5);

    const i1 = b1.intersects(b2);
    const i2 = b2.intersects(b1);
    const i3 = b1.intersects(b3);
    const i4 = b3.intersects(b1);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});

test("Box2 - intersectsInclusive", () => {
    const b1 = new Box2(0, 0, 2, 2);
    const b2 = new Box2(2, 2, 4, 4);
    const b3 = new Box2(4, 4, 6, 6);

    const i1 = b1.intersectsInclusive(b2);
    const i2 = b2.intersectsInclusive(b1);
    const i3 = b1.intersectsInclusive(b3);
    const i4 = b3.intersectsInclusive(b1);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});

test("Box3 - intersects", () => {
    const b1 = new Box3(0, 0, 0, 2, 2, 2);
    const b2 = new Box3(1, 1, 1, 3, 3, 3);
    const b3 = new Box3(3, 3, 3, 5, 5, 5);

    const i1 = b1.intersects(b2);
    const i2 = b2.intersects(b1);
    const i3 = b1.intersects(b3);
    const i4 = b3.intersects(b1);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});

test("Box3 - intersectsInclusive", () => {
    const b1 = new Box3(0, 0, 0, 2, 2, 2);
    const b2 = new Box3(2, 2, 2, 4, 4, 4);
    const b3 = new Box3(4, 4, 4, 6, 6, 6);

    const i1 = b1.intersectsInclusive(b2);
    const i2 = b2.intersectsInclusive(b1);
    const i3 = b1.intersectsInclusive(b3);
    const i4 = b3.intersectsInclusive(b1);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});
