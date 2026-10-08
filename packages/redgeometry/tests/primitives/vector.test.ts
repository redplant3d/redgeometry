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

test("signedArea", () => {
    const p0 = new Vector2(200, 200);
    const p1 = new Vector2(400, 200);

    const p2 = new Vector2(300, 100);
    const p3 = new Vector2(300, 200);
    const p4 = new Vector2(300, 400);

    expect(Vector2.signedArea(p0, p1, p2) < 0).toEqual(true);
    expect(Vector2.signedArea(p1, p0, p2) > 0).toEqual(true);

    expect(Vector2.signedArea(p0, p1, p3) === 0).toEqual(true);
    expect(Vector2.signedArea(p1, p0, p3) === 0).toEqual(true);

    expect(Vector2.signedArea(p0, p1, p4) > 0).toEqual(true);
    expect(Vector2.signedArea(p1, p0, p4) < 0).toEqual(true);
});
