import { expect, test } from "vitest";
import { Vector2 } from "../../src/primitives/vector.ts";

test("isBetweenCcw", () => {
    const vx = Vector2.UNIT_X;
    const vy = Vector2.UNIT_Y;

    const v1 = new Vector2(1, 1);
    const v2 = new Vector2(-1, -1);

    expect(v1.isBetweenCcw(vx, vy)).toEqual(true);
    expect(v1.isBetweenCcw(vy, vx)).toEqual(false);

    expect(v2.isBetweenCcw(vx, vy)).toEqual(false);
    expect(v2.isBetweenCcw(vy, vx)).toEqual(true);

    expect(vx.isBetweenCcw(vx, vy)).toEqual(false);
    expect(vx.isBetweenCcw(vy, vx)).toEqual(false);

    expect(vy.isBetweenCcw(vx, vy)).toEqual(false);
    expect(vy.isBetweenCcw(vy, vx)).toEqual(false);
});
