import { expect, test } from "vitest";
import { MinMaxBox2, MinMaxBox3 } from "../../src/primitives/box.ts";

test("Box2 - intersects", () => {
    const b1 = new MinMaxBox2(0, 0, 2, 2);
    const b2 = new MinMaxBox2(1, 1, 3, 3);
    const b3 = new MinMaxBox2(3, 3, 5, 5);

    const i1 = b1.intersects(b2, 0);
    const i2 = b2.intersects(b1, 0);
    const i3 = b1.intersects(b3, 0);
    const i4 = b3.intersects(b1, 0);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});

test("Box3 - intersects", () => {
    const b1 = new MinMaxBox3(0, 0, 0, 2, 2, 2);
    const b2 = new MinMaxBox3(1, 1, 1, 3, 3, 3);
    const b3 = new MinMaxBox3(3, 3, 3, 5, 5, 5);

    const i1 = b1.intersects(b2, 0);
    const i2 = b2.intersects(b1, 0);
    const i3 = b1.intersects(b3, 0);
    const i4 = b3.intersects(b1, 0);

    expect(i1).toEqual(true);
    expect(i2).toEqual(true);
    expect(i3).toEqual(false);
    expect(i4).toEqual(false);
});
