import { expect, test } from "vitest";
import { Complex } from "../../src/primitives/complex.js";
import { Matrix3A } from "../../src/primitives/matrix.js";
import { Point2 } from "../../src/primitives/point.js";
import { Vector2 } from "../../src/primitives/vector.js";
import { expectToBeCloseComplex, expectToBeClosePoint2, expectToBeCloseVector2 } from "../expect.js";

test("Complex - inverse", () => {
    const z = new Complex(1, 2);
    const zInv = z.inverse();

    const z1 = z.mul(zInv);
    const z2 = zInv.mul(z);

    expectToBeCloseComplex(z1, Complex.createIdentity());
    expectToBeCloseComplex(z2, Complex.createIdentity());
});

test("Complex - rotate", () => {
    const a = 1;
    const z = Complex.fromRotationAngle(a);

    z.rotate(-a);

    expectToBeCloseComplex(z, Complex.createIdentity());
});

test("Quaternion - mulPt/mulVec", () => {
    const a = 1;
    const z = Complex.fromRotationAngle(a);
    const mat = Matrix3A.fromRotation(z.a, z.b);
    const p = new Point2(1, 2);
    const v = new Vector2(1, 2);

    const p1 = mat.mulPt(p);
    const v1 = mat.mulVec(v);
    const p2 = z.mulPt(p);
    const v2 = z.mulVec(v);

    expectToBeClosePoint2(p1, p2);
    expectToBeCloseVector2(v1, v2);
    expect(p1).toEqual(v1);
    expect(p2).toEqual(v2);
});
