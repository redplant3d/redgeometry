import { expect, test } from "vitest";
import { Vector2 } from "../../src/primitives/vector.ts";

test("isBetweenCCW", () => {
    const vx = Vector2.UNIT_X;
    const vy = Vector2.UNIT_Y;

    const v1 = new Vector2(1, 1);
    const v2 = new Vector2(-1, -1);

    expect(v1.isBetweenCCW(vx, vy)).toEqual(true);
    expect(v1.isBetweenCCW(vy, vx)).toEqual(false);

    expect(v2.isBetweenCCW(vx, vy)).toEqual(false);
    expect(v2.isBetweenCCW(vy, vx)).toEqual(true);

    expect(vx.isBetweenCCW(vx, vy)).toEqual(false);
    expect(vx.isBetweenCCW(vy, vx)).toEqual(false);

    expect(vy.isBetweenCCW(vx, vy)).toEqual(false);
    expect(vy.isBetweenCCW(vy, vx)).toEqual(false);
});
