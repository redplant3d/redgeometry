import { test } from "vitest";
import { Complex } from "../../src/primitives/complex.js";
import { Matrix3A } from "../../src/primitives/matrix.js";
import { Vector2 } from "../../src/primitives/vector.js";
import { expectToBeCloseComplex, expectToBeCloseVector2 } from "../expect.js";

test("Complex - inverse", () => {
    const z = new Complex(1, 2);
    const zInv = z.inverse();

    const z1 = z.mul(zInv);
    const z2 = zInv.mul(z);

    expectToBeCloseComplex(z1, Complex.IDENTITY);
    expectToBeCloseComplex(z2, Complex.IDENTITY);
});

test("Complex - rotate", () => {
    const a = 1;
    const z = Complex.fromRotationAngle(a);

    z.rotate(-a);

    expectToBeCloseComplex(z, Complex.IDENTITY);
});

test("Quaternion - mulV", () => {
    const a = 1;
    const z = Complex.fromRotationAngle(a);
    const mat = Matrix3A.fromRotation(z.a, z.b);
    const v = new Vector2(1, 2);

    const v1 = mat.mulV(v);
    const v2 = z.mulV(v);

    expectToBeCloseVector2(v1, v2);
});
