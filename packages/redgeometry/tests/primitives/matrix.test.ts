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

test("Matrix3A - decomposeSRT", () => {
    const s = new Vector2(1, 2);
    const r = Complex.fromRotationAngle(3);
    const t = new Vector2(4, 5);

    const mat1 = Matrix3A.createIdentity();
    mat1.setScale(mat1, s.x, s.y);
    mat1.setRotate(mat1, r.a, r.b);
    mat1.setTranslate(mat1, t.x, t.y);

    const srt = mat1.decomposeSRT();

    expectToBeCloseVector2(srt.s, s);
    expectToBeCloseComplex(srt.r, r);
    expectToBeCloseVector2(srt.t, t);
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

test("Matrix3A - fromRotation", () => {
    const z = Complex.fromRotationAngle(1);

    const mat1 = Matrix3A.fromRotation(z.a, z.b);

    const mat2 = Matrix3A.createIdentity();
    mat2.setFromRotation(z.a, z.b);

    const mat3 = Matrix3A.createIdentity();
    mat3.setRotate(mat3, z.a, z.b);

    const mat4 = Matrix3A.createIdentity();
    mat4.setRotatePre(mat4, z.a, z.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3A - fromSRT", () => {
    const s = new Vector2(1, 2);
    const r = Complex.fromRotationAngle(3);
    const t = new Vector2(4, 5);

    const mat1 = Matrix3A.fromSRT(s.x, s.y, r.a, r.b, t.x, t.y);

    const mat2 = Matrix3A.createIdentity();
    mat2.setFromSRT(s.x, s.y, r.a, r.b, t.x, t.y);

    const mat3 = Matrix3A.createIdentity();
    mat3.setScale(mat3, s.x, s.y);
    mat3.setRotate(mat3, r.a, r.b);
    mat3.setTranslate(mat3, t.x, t.y);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3A - fromScale", () => {
    const mat1 = Matrix3A.fromScale(1, 2);

    const mat2 = Matrix3A.createIdentity();
    mat2.setFromScale(1, 2);

    const mat3 = Matrix3A.createIdentity();
    mat3.setScale(mat3, 1, 2);

    const mat4 = Matrix3A.createIdentity();
    mat4.setScalePre(mat4, 1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3A - fromTranslation", () => {
    const mat1 = Matrix3A.fromTranslation(1, 2);

    const mat2 = Matrix3A.createIdentity();
    mat2.setFromTranslation(1, 2);

    const mat3 = Matrix3A.createIdentity();
    mat3.setTranslate(mat3, 1, 2);

    const mat4 = Matrix3A.createIdentity();
    mat4.setTranslatePre(mat4, 1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3A - transform", () => {
    const mat = Matrix3A.createIdentity();
    const p = new Vector2(1, 2);
    const v = new Vector2(1, 2);

    const transformPoint = mat.transformPoint(p);
    const transformVector = mat.transformVector(v);

    expect(transformPoint).toEqual(p);
    expect(transformVector).toEqual(v);
});

test("Matrix3 - decomposeSRT", () => {
    const s = new Vector2(1, 2);
    const r = Complex.fromRotationAngle(3);
    const t = new Vector2(4, 5);

    const mat = Matrix3.createIdentity();
    mat.setScale(mat, s.x, s.y);
    mat.setRotate(mat, r.a, r.b);
    mat.setTranslate(mat, t.x, t.y);

    const srt = mat.decomposeSRT();

    expectToBeCloseVector2(srt.s, s);
    expectToBeCloseComplex(srt.r, r);
    expectToBeCloseVector2(srt.t, t);
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

test("Matrix3 - fromRotation", () => {
    const z = Complex.fromRotationAngle(1);

    const mat1 = Matrix3.fromRotation(z.a, z.b);

    const mat2 = Matrix3.createIdentity();
    mat2.setFromRotation(z.a, z.b);

    const mat3 = Matrix3.createIdentity();
    mat3.setRotate(mat3, z.a, z.b);

    const mat4 = Matrix3.createIdentity();
    mat4.setRotatePre(mat4, z.a, z.b);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3 - fromScale", () => {
    const mat1 = Matrix3.fromScale(1, 2);

    const mat2 = Matrix3.createIdentity();
    mat2.setFromScale(1, 2);

    const mat3 = Matrix3.createIdentity();
    mat3.setScale(mat3, 1, 2);

    const mat4 = Matrix3.createIdentity();
    mat4.setScalePre(mat4, 1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3 - fromSRT", () => {
    const s = new Vector2(1, 2);
    const r = Complex.fromRotationAngle(3);
    const t = new Vector2(4, 5);

    const mat1 = Matrix3.fromSRT(s.x, s.y, r.a, r.b, t.x, t.y);

    const mat2 = Matrix3.createIdentity();
    mat2.setFromSRT(s.x, s.y, r.a, r.b, t.x, t.y);

    const mat3 = Matrix3.createIdentity();
    mat3.setScale(mat3, s.x, s.y);
    mat3.setRotate(mat3, r.a, r.b);
    mat3.setTranslate(mat3, t.x, t.y);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix3 - fromTranslation", () => {
    const mat1 = Matrix3.fromTranslation(1, 2);

    const mat2 = Matrix3.createIdentity();
    mat2.setFromTranslation(1, 2);

    const mat3 = Matrix3.createIdentity();
    mat3.setTranslate(mat3, 1, 2);

    const mat4 = Matrix3.createIdentity();
    mat4.setTranslatePre(mat4, 1, 2);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix3 - transform", () => {
    const mat = Matrix3.createIdentity();
    const p = new Vector2(1, 2);
    const v = new Vector2(1, 2);

    const transformPoint = mat.transformPoint(p);
    const transformPointAffine = mat.transformPointAffine(p);
    const transformVectorAffine = mat.transformVectorAffine(v);

    expect(transformPoint).toEqual(p);
    expect(transformPointAffine).toEqual(p);
    expect(transformVectorAffine).toEqual(v);
});

test("Matrix4A - decomposeSRT", () => {
    const s = new Vector3(1, 2, 3);
    const r = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const t = new Vector3(7, 8, 9);

    const mat = Matrix4A.createIdentity();
    mat.setScale(mat, s.x, s.y, s.z);
    mat.setRotate(mat, r.a, r.b, r.c, r.d);
    mat.setTranslate(mat, t.x, t.y, t.z);

    const srt = mat.decomposeSRT();

    expectToBeCloseVector3(srt.s, s);
    expectToBeCloseQuaternion(srt.r, r);
    expectToBeCloseVector3(srt.t, t);
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

test("Matrix4A - fromRotation (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);

    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4A.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4A.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - fromRotation (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);

    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4A.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4A.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - fromRotation (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);

    const mat1 = Matrix4A.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4A.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4A.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - fromScale", () => {
    const mat1 = Matrix4A.fromScale(1, 2, 3);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromScale(1, 2, 3);

    const mat3 = Matrix4A.createIdentity();
    mat3.setScale(mat3, 1, 2, 3);

    const mat4 = Matrix4A.createIdentity();
    mat4.setScalePre(mat4, 1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - fromSRT", () => {
    const s = new Vector3(1, 2, 3);
    const r = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const t = new Vector3(7, 8, 9);

    const mat1 = Matrix4A.fromSRT(s.x, s.y, s.z, r.a, r.b, r.c, r.d, t.x, t.y, t.z);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromSRT(s.x, s.y, s.z, r.a, r.b, r.c, r.d, t.x, t.y, t.z);

    const mat3 = Matrix4A.createIdentity();
    mat3.setScale(mat3, s.x, s.y, s.z);
    mat3.setRotate(mat3, r.a, r.b, r.c, r.d);
    mat3.setTranslate(mat3, t.x, t.y, t.z);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4A - fromTranslation", () => {
    const mat1 = Matrix4A.fromTranslation(1, 2, 3);

    const mat2 = Matrix4A.createIdentity();
    mat2.setFromTranslation(1, 2, 3);

    const mat3 = Matrix4A.createIdentity();
    mat3.setTranslate(mat3, 1, 2, 3);

    const mat4 = Matrix4A.createIdentity();
    mat4.setTranslatePre(mat4, 1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - transform", () => {
    const mat = Matrix4A.createIdentity();
    const p = new Vector3(1, 2, 3);
    const v = new Vector3(1, 2, 3);

    const transformPoint = mat.transformPoint(p);
    const transformVector = mat.transformVector(v);

    expect(transformPoint).toEqual(p);
    expect(transformVector).toEqual(v);
});

test("Matrix4 - decomposeSRT", () => {
    const s = new Vector3(1, 2, 3);
    const r = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const t = new Vector3(7, 8, 9);

    const mat = Matrix4.createIdentity();
    mat.setScale(mat, s.x, s.y, s.z);
    mat.setRotate(mat, r.a, r.b, r.c, r.d);
    mat.setTranslate(mat, t.x, t.y, t.z);

    const srt = mat.decomposeSRT();

    expectToBeCloseVector3(srt.s, s);
    expectToBeCloseQuaternion(srt.r, r);
    expectToBeCloseVector3(srt.t, t);
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

test("Matrix4 - fromRotation (x)", () => {
    const q = Quaternion.fromRotationAngleX(1);

    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4 - fromRotation (y)", () => {
    const q = Quaternion.fromRotationAngleY(1);

    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4 - fromRotation (z)", () => {
    const q = Quaternion.fromRotationAngleZ(1);

    const mat1 = Matrix4.fromRotation(q.a, q.b, q.c, q.d);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromRotation(q.a, q.b, q.c, q.d);

    const mat3 = Matrix4.createIdentity();
    mat3.setRotate(mat3, q.a, q.b, q.c, q.d);

    const mat4 = Matrix4.createIdentity();
    mat4.setRotatePre(mat4, q.a, q.b, q.c, q.d);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4 - fromScale", () => {
    const mat1 = Matrix4.fromScale(1, 2, 3);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromScale(1, 2, 3);

    const mat3 = Matrix4.createIdentity();
    mat3.setScale(mat3, 1, 2, 3);

    const mat4 = Matrix4.createIdentity();
    mat4.setScalePre(mat4, 1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4A - fromSRT", () => {
    const s = new Vector3(1, 2, 3);
    const r = Quaternion.fromRotationEuler(4, 5, 6, RotationOrder.XYZ);
    const t = new Vector3(7, 8, 9);

    const mat1 = Matrix4.fromSRT(s.x, s.y, s.z, r.a, r.b, r.c, r.d, t.x, t.y, t.z);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromSRT(s.x, s.y, s.z, r.a, r.b, r.c, r.d, t.x, t.y, t.z);

    const mat3 = Matrix4.createIdentity();
    mat3.setScale(mat3, s.x, s.y, s.z);
    mat3.setRotate(mat3, r.a, r.b, r.c, r.d);
    mat3.setTranslate(mat3, t.x, t.y, t.z);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
});

test("Matrix4 - fromTranslation", () => {
    const mat1 = Matrix4.fromTranslation(1, 2, 3);

    const mat2 = Matrix4.createIdentity();
    mat2.setFromTranslation(1, 2, 3);

    const mat3 = Matrix4.createIdentity();
    mat3.setTranslate(mat3, 1, 2, 3);

    const mat4 = Matrix4.createIdentity();
    mat4.setTranslatePre(mat4, 1, 2, 3);

    expect(mat1).toEqual(mat2);
    expect(mat2).toEqual(mat3);
    expect(mat3).toEqual(mat4);
});

test("Matrix4 - transform", () => {
    const mat = Matrix4.createIdentity();
    const p = new Vector3(1, 2, 3);
    const v = new Vector3(1, 2, 3);

    const transformPoint = mat.transformPoint(p);
    const transformPointAffine = mat.transformPointAffine(p);
    const transformVectorAffine = mat.transformVectorAffine(v);

    expect(transformPoint).toEqual(p);
    expect(transformPointAffine).toEqual(p);
    expect(transformVectorAffine).toEqual(v);
});
