import { expect, test } from "vitest";
import { Complex } from "../../src/primitives/complex.ts";
import { Matrix3, Matrix3A, Matrix4, Matrix4A } from "../../src/primitives/matrix.ts";
import { Quaternion, RotationOrder } from "../../src/primitives/quaternion.ts";
import { Vector2, Vector3, Vector4 } from "../../src/primitives/vector.ts";
import {
    expectToBeCloseComplex,
    expectToBeCloseQuaternion,
    expectToBeCloseVector2,
    expectToBeCloseVector3,
} from "../expect.ts";

test("Matrix3A - extract", () => {
    const v = new Vector2(1, 2);
    const z = Complex.fromRotationAngle(3);
    const p = new Vector2(4, 5);

    const mat = Matrix3A.createIdentity();
    mat.setScale(mat, v.x, v.y);
    mat.setRotate(mat, z.a, z.b);
    mat.setTranslate(mat, p.x, p.y);

    const { s, r, t } = mat.extractSRT();

    expectToBeCloseVector2(s, v);
    expectToBeCloseComplex(r, z);
    expectToBeCloseVector2(t, p);
});

test("Matrix3A - inverse", () => {
    const z = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3A.createIdentity();
    mat.setTranslate(mat, 1, 2);
    mat.setScale(mat, 4, 4);
    mat.setRotate(mat, z.a, z.b);

    const matInv = Matrix3A.createIdentity();
    matInv.setInverse(mat);

    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix3A.IDENTITY);
    expect(mat2).toEqual(Matrix3A.IDENTITY);
});

test("Matrix3A - mulV", () => {
    const mat = Matrix3A.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mulV = mat.mulV(v);

    expect(mulV).toEqual(v);
});

test("Matrix3A - transformPoint", () => {
    const mat = Matrix3A.createIdentity();
    const p = new Vector2(1, 2);

    const transformPoint = mat.transformPoint(p);

    expect(transformPoint).toEqual(p);
});

test("Matrix3A - setRotate", () => {
    const z = Complex.fromRotationAngle(1);
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.setRotate(mat1, z.a, z.b);
    mat2.setRotatePre(mat2, z.a, z.b);
    mat3.setFromRotation(z.a, z.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3A - setScale", () => {
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.setScale(mat1, 1, 2);
    mat2.setScalePre(mat2, 1, 2);
    mat3.setFromScale(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3A - setTranslate", () => {
    const mat1 = Matrix3A.createIdentity();
    const mat2 = Matrix3A.createIdentity();
    const mat3 = Matrix3A.createIdentity();

    mat1.setTranslate(mat1, 1, 2);
    mat2.setTranslatePre(mat2, 1, 2);
    mat3.setFromTranslation(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - extract", () => {
    const v = new Vector2(1, 2);
    const z = Complex.fromRotationAngle(3);
    const p = new Vector2(4, 5);

    const mat = Matrix3.createIdentity();
    mat.setScale(mat, v.x, v.y);
    mat.setRotate(mat, z.a, z.b);
    mat.setTranslate(mat, p.x, p.y);

    const { s, r, t } = mat.extractSRT();

    expectToBeCloseVector2(s, v);
    expectToBeCloseComplex(r, z);
    expectToBeCloseVector2(t, p);
});

test("Matrix3 - inverse", () => {
    const z = Complex.fromRotationAngle(Math.PI);
    const mat = Matrix3.createIdentity();
    mat.setTranslate(mat, 1, 2);
    mat.setScale(mat, 4, 4);
    mat.setRotate(mat, z.a, z.b);

    const matInv = Matrix3.createIdentity();
    matInv.setInverse(mat);

    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix3.IDENTITY);
    expect(mat2).toEqual(Matrix3.IDENTITY);
});

test("Matrix3 - mulV", () => {
    const mat = Matrix3.createIdentity();
    const v = new Vector3(1, 2, 3);

    const mulV = mat.mulV(v);

    expect(mulV).toEqual(v);
});

test("Matrix3 - transformPoint", () => {
    const mat = Matrix3.createIdentity();
    const p = new Vector2(1, 2);

    const transformPoint = mat.transformPoint(p);

    expect(transformPoint).toEqual(p);
});

test("Matrix3 - setRotate", () => {
    const z = Complex.fromRotationAngle(1);
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.setRotate(mat1, z.a, z.b);
    mat2.setRotatePre(mat2, z.a, z.b);
    mat3.setFromRotation(z.a, z.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - setScale", () => {
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.setScale(mat1, 1, 2);
    mat2.setScalePre(mat2, 1, 2);
    mat3.setFromScale(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - setTranslate", () => {
    const mat1 = Matrix3.createIdentity();
    const mat2 = Matrix3.createIdentity();
    const mat3 = Matrix3.createIdentity();

    mat1.setTranslate(mat1, 1, 2);
    mat2.setTranslatePre(mat2, 1, 2);
    mat3.setFromTranslation(1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4A - extract", () => {
    const v = new Vector3(1, 2, 3);
    const q = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const p = new Vector3(7, 8, 9);

    const mat = Matrix4A.createIdentity();
    mat.setScale(mat, v.x, v.y, v.z);
    mat.setRotate(mat, q.a, q.b, q.c, q.d);
    mat.setTranslate(mat, p.x, p.y, p.z);

    const { s, r, t } = mat.extractSRT();

    expectToBeCloseVector3(s, v);
    expectToBeCloseQuaternion(r, q);
    expectToBeCloseVector3(t, p);
});

test("Matrix4A - inverse", () => {
    const q = Quaternion.fromRotationAngleX(Math.PI);
    const mat = Matrix4A.createIdentity();
    mat.setTranslate(mat, 1, 2, 3);
    mat.setScale(mat, 4, 4, 4);
    mat.setRotate(mat, q.a, q.b, q.c, q.d);

    const matInv = Matrix4A.createIdentity();
    matInv.setInverse(mat);

    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix4A.IDENTITY);
    expect(mat2).toEqual(Matrix4A.IDENTITY);
});

test("Matrix4A - mulV", () => {
    const mat = Matrix4A.createIdentity();
    const v = new Vector4(1, 2, 3, 4);

    const mulV = mat.mulV(v);

    expect(mulV).toEqual(v);
});

test("Matrix4A - transformPoint", () => {
    const mat = Matrix4A.createIdentity();
    const p = new Vector3(1, 2, 3);

    const transformPoint = mat.transformPoint(p);

    expect(transformPoint).toEqual(p);
});

test("Matrix4A - setRotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - setRotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - setRotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - setScale", () => {
    const mat1 = Matrix4A.fromScale(1, 2, 3);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.setScale(mat2, 1, 2, 3);
    mat3.setScalePre(mat3, 1, 2, 3);
    mat4.setFromScale(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4A - setTranslate", () => {
    const mat1 = Matrix4A.fromTranslation(1, 2, 3);
    const mat2 = Matrix4A.createIdentity();
    const mat3 = Matrix4A.createIdentity();
    const mat4 = Matrix4A.createIdentity();

    mat2.setTranslate(mat2, 1, 2, 3);
    mat3.setTranslatePre(mat3, 1, 2, 3);
    mat4.setFromTranslation(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - extract", () => {
    const v = new Vector3(1, 2, 3);
    const q = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const p = new Vector3(7, 8, 9);

    const mat = Matrix4.createIdentity();
    mat.setScale(mat, v.x, v.y, v.z);
    mat.setRotate(mat, q.a, q.b, q.c, q.d);
    mat.setTranslate(mat, p.x, p.y, p.z);

    const { s, r, t } = mat.extractSRT();

    expectToBeCloseVector3(s, v);
    expectToBeCloseQuaternion(r, q);
    expectToBeCloseVector3(t, p);
});

test("Matrix4 - inverse", () => {
    const q = Quaternion.fromRotationAngleX(Math.PI);
    const mat = Matrix4.createIdentity();
    mat.setTranslate(mat, 1, 2, 3);
    mat.setScale(mat, 4, 4, 4);
    mat.setRotate(mat, q.a, q.b, q.c, q.d);

    const matInv = Matrix4.createIdentity();
    matInv.setInverse(mat);

    const mat1 = mat.mul(matInv);
    const mat2 = matInv.mul(mat);

    expect(mat1).toEqual(Matrix4.IDENTITY);
    expect(mat2).toEqual(Matrix4.IDENTITY);
});

test("Matrix4 - mulV", () => {
    const mat = Matrix4.createIdentity();
    const v = new Vector4(1, 2, 3, 4);

    const mulV = mat.mulV(v);

    expect(mulV).toEqual(v);
});

test("Matrix4 - transformPoint", () => {
    const mat = Matrix4.createIdentity();
    const p = new Vector3(1, 2, 3);

    const transformPoint = mat.transformPoint(p);

    expect(transformPoint).toEqual(p);
});

test("Matrix4 - setRotate (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - setRotate (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - setRotate (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);
    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.setRotate(mat2, q.a, q.b, q.c, q.d);
    mat3.setRotatePre(mat3, q.a, q.b, q.c, q.d);
    mat4.setFromRotation(q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - setScale", () => {
    const mat1 = Matrix4.fromScale(1, 2, 3);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.setScale(mat2, 1, 2, 3);
    mat3.setScalePre(mat3, 1, 2, 3);
    mat4.setFromScale(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});

test("Matrix4 - setTranslate", () => {
    const mat1 = Matrix4.fromTranslation(1, 2, 3);
    const mat2 = Matrix4.createIdentity();
    const mat3 = Matrix4.createIdentity();
    const mat4 = Matrix4.createIdentity();

    mat2.setTranslate(mat2, 1, 2, 3);
    mat3.setTranslatePre(mat3, 1, 2, 3);
    mat4.setFromTranslation(1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat1).toEqual(mat3);
    expect(mat1).toEqual(mat4);
});
