import { expect, test } from "vitest";
import { Vector2 } from "../../src/primitives/vector.js";

test("isBetweenCcw", () => {
    const vx = Vector2.UNIT_X;
    const vy = Vector2.UNIT_Y;

    const v1 = new Vector2(1, 1);
    const v2 = new Vector2(-1, -1);

    expect(Vector2.isBetweenCcw(v1, vx, vy)).toEqual(true);
    expect(Vector2.isBetweenCcw(v1, vy, vx)).toEqual(false);

    expect(Vector2.isBetweenCcw(v2, vx, vy)).toEqual(false);
    expect(Vector2.isBetweenCcw(v2, vy, vx)).toEqual(true);

    expect(Vector2.isBetweenCcw(vx, vx, vy)).toEqual(false);
    expect(Vector2.isBetweenCcw(vx, vy, vx)).toEqual(false);

    expect(Vector2.isBetweenCcw(vy, vx, vy)).toEqual(false);
    expect(Vector2.isBetweenCcw(vy, vy, vx)).toEqual(false);
});
